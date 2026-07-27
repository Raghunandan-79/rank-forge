import { Worker } from "bullmq";
import { prismaClient } from "@repo/db/client";
import { bullmqRedis, redis } from "../config/redis";
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

        if (result.compile_output) {
          console.log("=== COMPILER OUTPUT ===");
          console.log(result.compile_output);
        }

        if (result.stderr) {
          console.log("=== STDERR ===");
          console.log(result.stderr);
        }

        if (result.message) {
          console.log("=== JUDGE0 MESSAGE ===");
          console.log(result.message);
        }

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

          if (submission.contestId) {
            await recordWrongContestAttempt(
              submission.contestId,
              submission.userId,
              submission.problemId,
            );
          }

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

      // Award points only for contest submissions
      if (submission.contestId) {
        await awardContestPoints(
          submission.contestId,
          submission.userId,
          submission.problemId,
        );
      }

      console.log(`Submission accepted: ${submission.id}`);
      console.log(`Tests: ${passedTests}/${totalTests}`);
      console.log(`Execution time: ${totalExecutionTime.toFixed(3)}s`);
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

async function recordWrongContestAttempt(
  contestId: string,
  userId: string,
  problemId: string,
) {
  // If already solved, later wrong submissions must not affect penalty.
  const alreadySolved = await prismaClient.contestScore.findUnique({
    where: {
      contestId_userId_problemId: {
        contestId,
        userId,
        problemId,
      },
    },
    select: {
      id: true,
    },
  });

  if (alreadySolved) {
    console.log(
      `Ignoring wrong attempt after solve: user=${userId}, problem=${problemId}`,
    );

    return;
  }

  const attempt = await prismaClient.contestProblemAttempt.upsert({
    where: {
      contestId_userId_problemId: {
        contestId,
        userId,
        problemId,
      },
    },

    create: {
      contestId,
      userId,
      problemId,
      wrongAttempts: 1,
    },

    update: {
      wrongAttempts: {
        increment: 1,
      },
    },
  });

  console.log(
    `Wrong contest attempt recorded: user=${userId}, problem=${problemId}, attempts=${attempt.wrongAttempts}`,
  );
}

async function awardContestPoints(
  contestId: string,
  userId: string,
  problemId: string,
) {
  const contestProblem = await prismaClient.contestProblem.findUnique({
    where: {
      contestId_problemId: {
        contestId,
        problemId,
      },
    },
    select: {
      points: true,

      contest: {
        select: {
          startTime: true,
        },
      },
    },
  });

  if (!contestProblem) {
    throw new Error("Problem does not belong to this contest");
  }

  // ---------------------------------------------
  // Already solved?
  // ---------------------------------------------

  const existingScore = await prismaClient.contestScore.findUnique({
    where: {
      contestId_userId_problemId: {
        contestId,
        userId,
        problemId,
      },
    },
  });

  if (existingScore) {
    console.log(
      `Contest points already awarded: user=${userId}, problem=${problemId}`,
    );

    return;
  }

  // ---------------------------------------------
  // Get wrong attempts before AC
  // ---------------------------------------------

  const attempt = await prismaClient.contestProblemAttempt.findUnique({
    where: {
      contestId_userId_problemId: {
        contestId,
        userId,
        problemId,
      },
    },
    select: {
      wrongAttempts: true,
    },
  });

  const wrongAttempts = attempt?.wrongAttempts ?? 0;

  // ---------------------------------------------
  // Calculate solve-time penalty
  // ---------------------------------------------

  const solvedAt = new Date();

  const elapsedMs =
    solvedAt.getTime() - contestProblem.contest.startTime.getTime();

  const elapsedMinutes = Math.max(0, Math.floor(elapsedMs / 60_000));

  const WRONG_ATTEMPT_PENALTY = 20;

  const penalty = elapsedMinutes + wrongAttempts * WRONG_ATTEMPT_PENALTY;

  // ---------------------------------------------
  // Store score
  // ---------------------------------------------

  try {
    await prismaClient.contestScore.create({
      data: {
        contestId,
        userId,
        problemId,

        points: contestProblem.points,

        penalty,

        solvedAt,
      },
    });
  } catch (error) {
    // Another worker may have awarded it concurrently.
    // Unique constraint prevents duplicate scoring.

    const existing = await prismaClient.contestScore.findUnique({
      where: {
        contestId_userId_problemId: {
          contestId,
          userId,
          problemId,
        },
      },
    });

    if (existing) {
      console.log(
        `Contest points already awarded: user=${userId}, problem=${problemId}`,
      );

      return;
    }

    throw error;
  }

  // ---------------------------------------------
  // Update Redis score leaderboard
  // ---------------------------------------------

  await redis.zincrby(
    `leaderboard:contest:${contestId}`,
    contestProblem.points,
    userId,
  );

  await redis.zincrby(
    `leaderboard:contest:${contestId}`,
    contestProblem.points,
    userId,
  );

  // Notify SSE clients that standings changed
  await redis.publish(
    `contest:${contestId}:standings`,
    JSON.stringify({
      type: "STANDINGS_UPDATED",
      contestId,
      userId,
      problemId,
    }),
  );

  console.log(
    `Contest points awarded: user=${userId}, problem=${problemId}, points=${contestProblem.points}, wrongAttempts=${wrongAttempts}, penalty=${penalty}`,
  );
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
