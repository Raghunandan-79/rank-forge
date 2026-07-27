import { Router } from "express";

import { UserRole } from "@repo/db/client";

import { authMiddleware } from "../middleware/auth.middleware";
import { csrfMiddleware } from "../middleware/csrf.middleware";
import { roleMiddleware } from "../middleware/role.middleware";

import {
  addContestProblemController,
  createContestController,
  getContestBySlugController,
  getContestLeaderboardController,
  getContestsController,
  registerForContestController,
} from "../controllers/contest.controller";
import { createContestSubmissionController } from "../controllers/submission.controller";

const contestRouter = Router();

contestRouter.get("/", getContestsController);

contestRouter.post(
  "/",
  authMiddleware,
  csrfMiddleware,
  roleMiddleware([UserRole.PROBLEM_SETTER, UserRole.ADMIN]),
  createContestController,
);

contestRouter.post(
  "/:slug/problems",
  authMiddleware,
  csrfMiddleware,
  roleMiddleware([UserRole.PROBLEM_SETTER, UserRole.ADMIN]),
  addContestProblemController,
);

contestRouter.get("/:slug/leaderboard", getContestLeaderboardController);

contestRouter.get("/:slug", getContestBySlugController);

contestRouter.post(
  "/:slug/register",
  authMiddleware,
  csrfMiddleware,
  registerForContestController,
);

contestRouter.post(
  "/:contestSlug/problems/:problemSlug/submissions",
  authMiddleware,
  csrfMiddleware,
  createContestSubmissionController,
);

export default contestRouter;
