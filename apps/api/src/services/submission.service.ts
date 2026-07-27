import { prismaClient, ProgrammingLanguage } from "@repo/db/client";
import { AppError } from "../utils/app-error";
import { submissionQueue } from "../queues/submission.queue";
import { redis } from "../config/redis";

export async function createSubmissionService(
  userId: string,
  slug: string,
  sourceCode: string,
  language: ProgrammingLanguage,
) {
  const problem = await prismaClient.problem.findUnique({
    where: {
      slug,
    },
    select: {
      id: true,
    },
  });

  if (!problem) {
    throw new AppError("Problem not found", 404);
  }

  const submission = await prismaClient.submission.create({
    data: {
      userId,
      problemId: problem.id,
      sourceCode,
      language,
    },
  });

  await submissionQueue.add("judge-submission", {
    submissionId: submission.id,
  });

  return submission;
}

export async function getSubmissionByIdService(
  submissionId: string,
  userId: string,
) {
  const submission = await prismaClient.submission.findFirst({
    where: {
      id: submissionId,
      userId,
    },
    select: {
      id: true,
      status: true,
      language: true,
      executionTime: true,
      memoryUsed: true,
      passedTests: true,
      totalTests: true,
      createdAt: true,
      updatedAt: true,

      problem: {
        select: {
          title: true,
          slug: true,
        },
      },
    },
  });

  if (!submission) {
    throw new Error("Submission not found");
  }

  let cachedOutput = null;
  try {
    const data = await redis.get(`submission:${submissionId}:output`);
    if (data) {
      cachedOutput = JSON.parse(data);
    }
  } catch (err) {
    console.error("Failed to read submission output from Redis:", err);
  }

  return {
    ...submission,
    output: cachedOutput,
  };
}

export async function getUserSubmissionsService(
  userId: string,
  page: number,
  limit: number,
) {
  const skip = (page - 1) * limit;

  const [submissions, total] = await Promise.all([
    prismaClient.submission.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
      select: {
        id: true,
        status: true,
        language: true,
        executionTime: true,
        memoryUsed: true,
        passedTests: true,
        totalTests: true,
        createdAt: true,

        problem: {
          select: {
            title: true,
            slug: true,
            difficulty: true,
          },
        },
      },
    }),

    prismaClient.submission.count({
      where: {
        userId,
      },
    }),
  ]);

  return {
    submissions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getProblemSubmissionsService(
  userId: string,
  slug: string,
  page: number,
  limit: number,
) {
  const problem = await prismaClient.problem.findUnique({
    where: {
      slug,
    },
    select: {
      id: true,
    },
  });

  if (!problem) {
    throw new Error("Problem not found");
  }

  const skip = (page - 1) * limit;

  const where = {
    userId,
    problemId: problem.id,
  };

  const [submissions, total] = await Promise.all([
    prismaClient.submission.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
      select: {
        id: true,
        status: true,
        language: true,
        executionTime: true,
        memoryUsed: true,
        passedTests: true,
        totalTests: true,
        createdAt: true,
      },
    }),

    prismaClient.submission.count({
      where,
    }),
  ]);

  return {
    submissions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function createContestSubmissionService(
  userId: string,
  contestSlug: string,
  problemSlug: string,
  sourceCode: string,
  language: ProgrammingLanguage,
) {
  // 1. Find contest
  const contest = await prismaClient.contest.findUnique({
    where: {
      slug: contestSlug,
    },
    select: {
      id: true,
      startTime: true,
      endTime: true,
    },
  });

  if (!contest) {
    throw new AppError("Contest not found", 404);
  }

  // 2. Check contest timing
  const now = new Date();

  if (now < contest.startTime) {
    throw new AppError("Contest has not started yet", 403);
  }

  if (now >= contest.endTime) {
    throw new AppError("Contest has already ended", 403);
  }

  // 3. Check whether user is registered
  const registration = await prismaClient.contestRegistration.findUnique({
    where: {
      contestId_userId: {
        contestId: contest.id,
        userId,
      },
    },
    select: {
      id: true,
    },
  });

  if (!registration) {
    throw new AppError("You are not registered for this contest", 403);
  }

  // 4. Check whether problem belongs to contest
  const contestProblem = await prismaClient.contestProblem.findFirst({
    where: {
      contestId: contest.id,
      problem: {
        slug: problemSlug,
      },
    },
    select: {
      problemId: true,
    },
  });

  if (!contestProblem) {
    throw new AppError("Problem does not belong to this contest", 404);
  }

  // 5. Create contest submission
  const submission = await prismaClient.submission.create({
    data: {
      userId,
      problemId: contestProblem.problemId,
      contestId: contest.id,
      sourceCode,
      language,
    },
  });

  // 6. Reuse existing BullMQ judging pipeline
  await submissionQueue.add("judge-submission", {
    submissionId: submission.id,
  });

  return submission;
}
