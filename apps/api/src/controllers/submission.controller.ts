import type { NextFunction, Request, Response } from "express";
import { createSubmissionSchema } from "../schemas/schemas";
import {
  createContestSubmissionService,
  createSubmissionService,
  getProblemSubmissionsService,
  getSubmissionByIdService,
  getUserSubmissionsService,
} from "../services/submission.service";

export async function createSubmissionController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const parsed = createSubmissionSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid submission data",
    });
  }

  try {
    const userId = req.userId;
    const { slug } = req.params;

    if (typeof slug !== "string") {
      return res.status(400).json({
        error: "Problem slug is required",
      });
    }

    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    if (!slug) {
      return res.status(400).json({
        error: "Problem slug is required",
      });
    }

    const { sourceCode, language } = parsed.data;

    const submission = await createSubmissionService(
      userId,
      slug,
      sourceCode,
      language,
    );

    return res.status(201).json({
      message: "Submission created successfully",
      submission,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSubmissionByIdController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    if (typeof id !== "string") {
      return res.status(400).json({
        error: "Submission ID is required",
      });
    }

    const submission = await getSubmissionByIdService(id, userId);

    return res.status(200).json({
      submission,
    });
  } catch (error) {
    next(error);
  }
}

export async function getUserSubmissionsController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const page = Math.max(Number(req.query.page) || 1, 1);

    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);

    const result = await getUserSubmissionsService(userId, page, limit);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getProblemSubmissionsController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.userId;
    const { slug } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    if (typeof slug !== "string") {
      return res.status(400).json({
        error: "Problem slug is required",
      });
    }

    const page = Math.max(Number(req.query.page) || 1, 1);

    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);

    const result = await getProblemSubmissionsService(
      userId,
      slug,
      page,
      limit,
    );

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function createContestSubmissionController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const parsed = createSubmissionSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid submission data",
    });
  }

  try {
    const userId = req.userId;
    const { contestSlug, problemSlug } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    if (typeof contestSlug !== "string") {
      return res.status(400).json({
        error: "Contest slug is required",
      });
    }

    if (typeof problemSlug !== "string") {
      return res.status(400).json({
        error: "Problem slug is required",
      });
    }

    const { sourceCode, language } = parsed.data;

    const submission = await createContestSubmissionService(
      userId,
      contestSlug,
      problemSlug,
      sourceCode,
      language,
    );

    return res.status(201).json({
      message: "Contest submission created successfully",
      submission,
    });
  } catch (error) {
    next(error);
  }
}