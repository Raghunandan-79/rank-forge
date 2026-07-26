import type { NextFunction, Request, Response } from "express";
import { createProblemSchema } from "../schemas/schemas";
import { createProblemService } from "../services/problem.service";

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
