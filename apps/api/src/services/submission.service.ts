import { prismaClient, ProgrammingLanguage } from "@repo/db/client";
import { AppError } from "../utils/app-error";
import { submissionQueue } from "../queues/submission.queue";

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

  return submission;
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
