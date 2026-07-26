import { Worker } from "bullmq";
import { prismaClient } from "@repo/db/client";
import { bullmqRedis } from "../config/redis";
import { executeCode } from "../services/code-execution.service";

export const submissionWorker = new Worker(
  "submissions",
  async (job) => {
    const submissionId = job.data.submissionId as string;

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

    const totalTests = submission.problem.testCases.length;

    // Metrics
    let passedTests = 0;
    let totalExecutionTime = 0;
    let maxMemory = 0;

    // Mark submission as processing
    await prismaClient.submission.update({
      where: {
        id: submission.id,
      },
      data: {
        status: "PROCESSING",
        totalTests,
        passedTests: 0,
      },
    });

    console.log(`Processing submission: ${submission.id}`);
    console.log(`Language: ${submission.language}`);
    console.log(`Test cases: ${totalTests}`);

    try {
      for (const testCase of submission.problem.testCases) {
        console.log(`Running test case: ${testCase.id}`);

        const result = await executeCode(
          submission.sourceCode,
          submission.language,
          testCase.input,
        );

        console.log(`Judge0 status: ${result.status.description}`);

        // Collect metrics for this execution
        if (result.time) {
          totalExecutionTime += Number(result.time);
        }

        if (result.memory) {
          maxMemory = Math.max(maxMemory, result.memory);
        }

        // Compilation Error
        if (result.status.id === 6) {
          await updateFinalResult(
            submission.id,
            "COMPILATION_ERROR",
            passedTests,
            totalTests,
            totalExecutionTime,
            maxMemory,
          );

          return;
        }

        // Time Limit Exceeded
        if (result.status.id === 5) {
          await updateFinalResult(
            submission.id,
            "TIME_LIMIT_EXCEEDED",
            passedTests,
            totalTests,
            totalExecutionTime,
            maxMemory,
          );

          return;
        }

        // Runtime errors
        if (result.status.id >= 7 && result.status.id <= 12) {
          await updateFinalResult(
            submission.id,
            "RUNTIME_ERROR",
            passedTests,
            totalTests,
            totalExecutionTime,
            maxMemory,
          );

          return;
        }

        // Judge0 internal error
        if (result.status.id === 13) {
          throw new Error(
            `Judge0 internal error: ${result.message ?? "Unknown error"}`,
          );
        }

        if (result.status.id !== 3) {
          throw new Error(
            `Unexpected Judge0 status: ${result.status.description}`,
          );
        }

        const actualOutput = normalizeOutput(result.stdout ?? "");
        const expectedOutput = normalizeOutput(testCase.expectedOutput);

        // Wrong Answer
        if (actualOutput !== expectedOutput) {
          await updateFinalResult(
            submission.id,
            "WRONG_ANSWER",
            passedTests,
            totalTests,
            totalExecutionTime,
            maxMemory,
          );

          console.log(`Wrong answer on test case: ${testCase.id}`);

          return;
        }

        passedTests++;

        console.log(
          `Test case passed: ${testCase.id} (${passedTests}/${totalTests})`,
        );
      }

      // All tests passed
      await updateFinalResult(
        submission.id,
        "ACCEPTED",
        passedTests,
        totalTests,
        totalExecutionTime,
        maxMemory,
      );

      console.log(`Submission accepted: ${submission.id}`);
      console.log(`Tests: ${passedTests}/${totalTests}`);
      console.log(`Execution time: ${totalExecutionTime}s`);
      console.log(`Max memory: ${maxMemory} KB`);
    } catch (error) {
      console.error(`Error judging submission ${submission.id}:`, error);

      await updateFinalResult(
        submission.id,
        "INTERNAL_ERROR",
        passedTests,
        totalTests,
        totalExecutionTime,
        maxMemory,
      );

      throw error;
    }
  },
  {
    connection: bullmqRedis,
  },
);

async function updateFinalResult(
  submissionId: string,
  status:
    | "ACCEPTED"
    | "WRONG_ANSWER"
    | "TIME_LIMIT_EXCEEDED"
    | "RUNTIME_ERROR"
    | "COMPILATION_ERROR"
    | "INTERNAL_ERROR",
  passedTests: number,
  totalTests: number,
  executionTime: number,
  memoryUsed: number,
) {
  await prismaClient.submission.update({
    where: {
      id: submissionId,
    },
    data: {
      status,
      passedTests,
      totalTests,
      executionTime,
      memoryUsed,
    },
  });
}

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
  console.error(`Submission job failed: ${job?.id}`, error.message);
});
