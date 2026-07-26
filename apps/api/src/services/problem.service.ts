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
