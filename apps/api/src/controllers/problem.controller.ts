import type { NextFunction, Request, Response } from "express";
import { createProblemSchema, createTestCaseSchema } from "../schemas/schemas";
import {
  createProblemService,
  createTestCaseService,
  getProblemsBySlugService,
  getProblemsService,
  getProblemAdminTestCasesService,
  deleteTestCaseService,
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

    if (typeof slug !== "string") {
      return res.status(400).json({
        error: "Problem slug is required",
      });
    }

    if (!slug) {
      return res.status(400).json({
        error: "Problem slug is required",
      });
    }

    const problem = await getProblemsBySlugService(slug);

    return res.status(200).json({
      problem,
    });
  } catch (error) {
    next(error);
  }
}

export async function createTestCaseController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const parsed = createTestCaseSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid test case data",
    });
  }

  try {
    const { slug } = req.params;

    if (typeof slug !== "string") {
      return res.status(400).json({
        error: "Problem slug is required",
      });
    }

    if (!slug) {
      return res.status(400).json({
        error: "Problem slug is required",
      });
    }

    const { input, expectedOutput, isHidden } = parsed.data;

    const testCase = await createTestCaseService(
      slug,
      input,
      expectedOutput,
      isHidden,
    );

    return res.status(201).json({
      message: "Test case created successfully",
      testCase,
    });
  } catch (error) {
    next(error);
  }
}

export async function getProblemAdminTestCasesController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { slug } = req.params;
    if (typeof slug !== "string") {
      return res.status(400).json({ error: "Problem slug is required" });
    }
    const problem = await getProblemAdminTestCasesService(slug);
    return res.status(200).json({ problem });
  } catch (error) {
    next(error);
  }
}

export async function deleteTestCaseController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;
    if (typeof id !== "string") {
      return res.status(400).json({ error: "Test case ID is required" });
    }
    const testCase = await deleteTestCaseService(id);
    return res.status(200).json({ message: "Test case deleted successfully", testCase });
  } catch (error) {
    next(error);
  }
}
