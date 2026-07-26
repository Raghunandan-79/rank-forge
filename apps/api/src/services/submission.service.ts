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
