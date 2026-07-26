import type { NextFunction, Request, Response } from "express";
import { createSubmissionSchema } from "../schemas/schemas";
import { createSubmissionService, getSubmissionByIdService } from "../services/submission.service";

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
