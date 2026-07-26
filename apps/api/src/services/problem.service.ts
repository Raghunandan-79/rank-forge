import { prismaClient } from "@repo/db/client";
import { AppError } from "../utils/app-error";

export async function createProblemService(
  title: string,
  slug: string,
  description: string,
  difficulty: "EASY" | "MEDIUM" | "HARD",
) {
  const existingProblem = await prismaClient.problem.findUnique({
    where: {
      slug,
    },
  });

  if (existingProblem) {
    throw new AppError("Problem with this slug already exists", 409);
  }

  const problem = await prismaClient.problem.create({
    data: {
      title,
      slug,
      description,
      difficulty,
    },
  });

  return {
    id: problem.id,
    title: problem.title,
    slug: problem.slug,
    description: problem.description,
    difficulty: problem.difficulty,
    createdAt: problem.createdAt,
  };
}

export async function getProblemsService() {
  const problems = await prismaClient.problem.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      difficulty: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return problems;
}

export async function getProblemsBySlugService(slug: string) {
  const problem = await prismaClient.problem.findUnique({
    where: {
      slug,
    },
  });

  if (!problem) {
    throw new AppError("Problem not found", 404);
  }

  return problem;
}
