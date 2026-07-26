import { prismaClient, ProgrammingLanguage } from "@repo/db/client";
import { AppError } from "../utils/app-error";

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

  return submission;
}
