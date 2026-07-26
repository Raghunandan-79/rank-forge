import { Worker } from "bullmq";
import { prismaClient } from "@repo/db/client";

import { bullmqRedis } from "../config/redis";
import { executeCode } from "../services/code-execution.service";

export const submissionWorker = new Worker(
  "submissions",

  async (job) => {
    const submissionId = job.data.submissionId as string;

    // 1. Fetch submission + problem + test cases
    const submission = await prismaClient.submission.findUnique({
      where: {
        id: submissionId,
      },

      include: {
        problem: {
          include: {
            testCases: true,
          },
        },
      },
    });

    if (!submission) {
      throw new Error("Submission not found");
    }

    // 2. Mark submission as processing
    await prismaClient.submission.update({
      where: {
        id: submission.id,
      },
      data: {
        status: "PROCESSING",
      },
    });

    console.log(`Processing submission: ${submission.id}`);
    console.log(`Language: ${submission.language}`);
    console.log(
      `Test cases: ${submission.problem.testCases.length}`,
    );

    try {
      // 3. Execute every test case
      for (const testCase of submission.problem.testCases) {
        console.log(`Running test case: ${testCase.id}`);

        const result = await executeCode(
          submission.sourceCode,
          submission.language,
          testCase.input,
        );

        console.log("Judge0 status:", result.status.description);

        // Compilation Error
        if (result.status.id === 6) {
          await prismaClient.submission.update({
            where: {
              id: submission.id,
            },
            data: {
              status: "COMPILATION_ERROR",
            },
          });

          return;
        }

        // Time Limit Exceeded
        if (result.status.id === 5) {
          await prismaClient.submission.update({
            where: {
              id: submission.id,
            },
            data: {
              status: "TIME_LIMIT_EXCEEDED",
            },
          });

          return;
        }

        // Judge0 runtime errors are generally 7-12
        if (result.status.id >= 7 && result.status.id <= 12) {
          await prismaClient.submission.update({
            where: {
              id: submission.id,
            },
            data: {
              status: "RUNTIME_ERROR",
            },
          });

          return;
        }

        // Judge0 internal error
        if (result.status.id === 13) {
          throw new Error(
            `Judge0 internal error: ${result.message ?? "Unknown error"}`,
          );
        }

        // Anything other than Accepted
        if (result.status.id !== 3) {
          throw new Error(
            `Unexpected Judge0 status: ${result.status.description}`,
          );
        }

        // 4. Compare output
        const actualOutput = normalizeOutput(result.stdout ?? "");

        const expectedOutput = normalizeOutput(
          testCase.expectedOutput,
        );

        if (actualOutput !== expectedOutput) {
          await prismaClient.submission.update({
            where: {
              id: submission.id,
            },
            data: {
              status: "WRONG_ANSWER",
            },
          });

          console.log(
            `Wrong answer on test case: ${testCase.id}`,
          );

          return;
        }

        console.log(`Test case passed: ${testCase.id}`);
      }

      // 5. Every testcase passed
      await prismaClient.submission.update({
        where: {
          id: submission.id,
        },
        data: {
          status: "ACCEPTED",
        },
      });

      console.log(`Submission accepted: ${submission.id}`);
    } catch (error) {
      console.error(
        `Error judging submission ${submission.id}:`,
        error,
      );

      await prismaClient.submission.update({
        where: {
          id: submission.id,
        },
        data: {
          status: "INTERNAL_ERROR",
        },
      });

      throw error;
    }
  },

  {
    connection: bullmqRedis,
  },
);

function normalizeOutput(output: string): string {
  return output
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

submissionWorker.on("completed", (job) => {
  console.log(`Submission job completed: ${job.id}`);
});

submissionWorker.on("failed", (job, error) => {
  console.error(
    `Submission job failed: ${job?.id}`,
    error.message,
  );
});