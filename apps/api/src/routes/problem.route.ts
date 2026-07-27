import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { csrfMiddleware } from "../middleware/csrf.middleware";
import { roleMiddleware } from "../middleware/role.middleware";
import { UserRole } from "@repo/db/client";
import {
  createProblemController,
  createTestCaseController,
  getProblemBySlugController,
  getProblemsController,
} from "../controllers/problem.controller";
import { createSubmissionController, getProblemSubmissionsController } from "../controllers/submission.controller";

const problemRouter = Router();

problemRouter.get("/", getProblemsController);

problemRouter.get("/:slug", getProblemBySlugController);

problemRouter.get(
  "/:slug/submissions",
  authMiddleware,
  getProblemSubmissionsController,
);

problemRouter.post(
  "/",
  authMiddleware,
  csrfMiddleware,
  roleMiddleware([UserRole.PROBLEM_SETTER, UserRole.ADMIN]),
  createProblemController,
);

problemRouter.post(
    "/:slug/test-cases",
    authMiddleware,
    csrfMiddleware,
    roleMiddleware([UserRole.PROBLEM_SETTER, UserRole.ADMIN]),
    createTestCaseController
)

problemRouter.post(
    "/:slug/submissions",
    authMiddleware,
    csrfMiddleware,
    createSubmissionController
)

export default problemRouter;
