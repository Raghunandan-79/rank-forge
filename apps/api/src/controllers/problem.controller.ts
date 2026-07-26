import type { NextFunction, Request, Response } from "express";
import { createProblemSchema } from "../schemas/schemas";
import {
  createProblemService,
  getProblemsBySlugService,
  getProblemsService,
} from "../services/problem.service";

export async function createProblemController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const parsed = createProblemSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid problem data",
    });
  }

  try {
    const { title, slug, description, difficulty } = parsed.data;

    const problem = await createProblemService(
      title,
      slug,
      description,
      difficulty,
    );

    return res.status(201).json({
      message: "Problem created successfully",
      problem,
    });
  } catch (error) {
    next(error);
  }
}

export async function getProblemsController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const problems = await getProblemsService();

    return res.status(200).json({
      problems,
    });
  } catch (error) {
    next(error);
  }
}

export async function getProblemBySlugController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({
        error: "Problem slug is required",
      });
    }

    const problem = await getProblemsBySlugService(slug as string);

    return res.status(200).json({
        problem,
    })
  } catch (error) {
    next(error);
  }
}
