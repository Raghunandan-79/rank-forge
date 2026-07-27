import type { NextFunction, Request, Response } from "express";

import {
  addContestProblemSchema,
  createContestSchema,
} from "../schemas/schemas";

import {
  addContestProblemService,
  createContestService,
  getContestBySlugService,
  getContestsService,
  registerForContestService,
} from "../services/contest.service";

export async function createContestController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const parsed = createContestSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid contest data",
      details: parsed.error.flatten(),
    });
  }

  try {
    const contest = await createContestService(parsed.data);

    return res.status(201).json({
      message: "Contest created successfully",
      contest,
    });
  } catch (error) {
    next(error);
  }
}

export async function getContestsController(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const contests = await getContestsService();

    return res.status(200).json({
      contests,
    });
  } catch (error) {
    next(error);
  }
}

export async function getContestBySlugController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { slug } = req.params;

    if (typeof slug !== "string") {
      return res.status(400).json({
        error: "Contest slug is required",
      });
    }

    const contest = await getContestBySlugService(slug);

    if (!contest) {
      return res.status(404).json({
        error: "Contest not found",
      });
    }

    return res.status(200).json({
      contest,
    });
  } catch (error) {
    next(error);
  }
}

export async function addContestProblemController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const parsed = addContestProblemSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid contest problem data",
      details: parsed.error.flatten(),
    });
  }

  try {
    const { slug } = req.params;

    if (typeof slug !== "string") {
      return res.status(400).json({
        error: "Contest slug is required",
      });
    }

    const contestProblem = await addContestProblemService(slug, parsed.data);

    return res.status(201).json({
      message: "Problem added to contest successfully",
      contestProblem,
    });
  } catch (error) {
    next(error);
  }
}

export async function registerForContestController(
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
        error: "Contest slug is required",
      });
    }

    const registration = await registerForContestService(userId, slug);

    return res.status(201).json({
      message: "Registered for contest successfully",
      registration,
    });
  } catch (error) {
    next(error);
  }
}
