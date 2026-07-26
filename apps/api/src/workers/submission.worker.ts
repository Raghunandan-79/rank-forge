import { Worker } from "bullmq";
import { prismaClient } from "@repo/db/client";
import { bullmqRedis } from "../config/redis";
import { executeCode } from "../services/code-execution.service";

export const submissionWorker = new Worker(
  "submissions",

  async (job) => {
    const submissionId = job.data.submissionId as string;

    // ------------------------------------------------
    // Fetch submission + problem + test cases
    // ------------------------------------------------

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

    // ------------------------------------------------
    // Metrics
    // ------------------------------------------------

    let passedTests = 0;
    let totalExecutionTime = 0;
    let maxMemory = 0;

    // ------------------------------------------------
    // Mark submission PROCESSING
    // ------------------------------------------------

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

    console.log(
      `Limits: ${submission.problem.timeLimit}s / ${submission.problem.memoryLimit}MB`,
    );

    try {
      // ------------------------------------------------
      // Run every test case
      // ------------------------------------------------

      for (const testCase of submission.problem.testCases) {
        console.log(`Running test case: ${testCase.id}`);

        const result = await executeCode(
          submission.sourceCode,
          submission.language,
          testCase.input,

          // Per-problem limits
          submission.problem.timeLimit,
          submission.problem.memoryLimit,
        );

        console.log(`Judge0 status: ${result.status.description}`);

        // ------------------------------------------------
        // Collect execution metrics
        // ------------------------------------------------

        if (result.time) {
          totalExecutionTime += Number(result.time);
        }

        if (result.memory) {
          maxMemory = Math.max(maxMemory, result.memory);
        }

        // ------------------------------------------------
        // Compilation Error
        // ------------------------------------------------

        if (result.status.id === 6) {
          await updateFinalResult(
            submission.id,
            "COMPILATION_ERROR",
            passedTests,
            totalTests,
            totalExecutionTime,
            maxMemory,
          );

          console.log(`Compilation error: ${submission.id}`);

          return;
        }

        // ------------------------------------------------
        // Time Limit Exceeded
        // ------------------------------------------------

        if (result.status.id === 5) {
          await updateFinalResult(
            submission.id,
            "TIME_LIMIT_EXCEEDED",
            passedTests,
            totalTests,
            totalExecutionTime,
            maxMemory,
          );

          console.log(`Time limit exceeded: ${submission.id}`);

          return;
        }

        // ------------------------------------------------
        // Runtime Errors
        //
        // Judge0:
        // 7  = Runtime Error (SIGSEGV)
        // 8  = Runtime Error (SIGXFSZ)
        // 9  = Runtime Error (SIGFPE)
        // 10 = Runtime Error (SIGABRT)
        // 11 = Runtime Error (NZEC)
        // 12 = Runtime Error (Other)
        // ------------------------------------------------

        if (result.status.id >= 7 && result.status.id <= 12) {
          await updateFinalResult(
            submission.id,
            "RUNTIME_ERROR",
            passedTests,
            totalTests,
            totalExecutionTime,
            maxMemory,
          );

          console.log(`Runtime error: ${submission.id}`);

          return;
        }

        // ------------------------------------------------
        // Judge0 Internal Errors
        // ------------------------------------------------

        if (result.status.id === 13 || result.status.id === 14) {
          throw new Error(
            `Judge0 internal error: ${result.message ?? "Unknown error"}`,
          );
        }

        // ------------------------------------------------
        // We only expect Accepted at this point
        // ------------------------------------------------

        if (result.status.id !== 3) {
          throw new Error(
            `Unexpected Judge0 status: ${result.status.description}`,
          );
        }

        // ------------------------------------------------
        // Compare output ourselves
        // ------------------------------------------------

        const actualOutput = normalizeOutput(result.stdout ?? "");

        const expectedOutput = normalizeOutput(testCase.expectedOutput);

        // ------------------------------------------------
        // Wrong Answer
        // ------------------------------------------------

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

        // ------------------------------------------------
        // Test passed
        // ------------------------------------------------

        passedTests++;

        console.log(
          `Test case passed: ${testCase.id} (${passedTests}/${totalTests})`,
        );
      }

      // ------------------------------------------------
      // Every test passed
      // ------------------------------------------------

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

      // ------------------------------------------------
      // Our infrastructure / Judge0 failure
      // ------------------------------------------------

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

// ------------------------------------------------
// Update final submission result
// ------------------------------------------------

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

// ------------------------------------------------
// Normalize stdout before comparing
// ------------------------------------------------

function normalizeOutput(output: string): string {
  return output
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

// ------------------------------------------------
// BullMQ events
// ------------------------------------------------

submissionWorker.on("completed", (job) => {
  console.log(`Submission job completed: ${job.id}`);
});

submissionWorker.on("failed", (job, error) => {
  console.error(`Submission job failed: ${job?.id}`, error.message);
});
