import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { csrfMiddleware } from "../middleware/csrf.middleware";
import { roleMiddleware } from "../middleware/role.middleware";
import { UserRole } from "@repo/db/client";
import {
  createProblemController,
  createTestCaseController,
  deleteProblemController,
  getProblemBySlugController,
  getProblemsController,
  getProblemAdminTestCasesController,
  deleteTestCaseController,
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

problemRouter.get(
  "/:slug/admin-test-cases",
  authMiddleware,
  roleMiddleware([UserRole.PROBLEM_SETTER, UserRole.ADMIN]),
  getProblemAdminTestCasesController
);

problemRouter.post(
    "/:slug/test-cases",
    authMiddleware,
    csrfMiddleware,
    roleMiddleware([UserRole.PROBLEM_SETTER, UserRole.ADMIN]),
    createTestCaseController
)

problemRouter.delete(
    "/:slug/test-cases/:id",
    authMiddleware,
    csrfMiddleware,
    roleMiddleware([UserRole.PROBLEM_SETTER, UserRole.ADMIN]),
    deleteTestCaseController
)

problemRouter.post(
    "/:slug/submissions",
    authMiddleware,
    csrfMiddleware,
    createSubmissionController
)

problemRouter.delete(
    "/:slug",
    authMiddleware,
    csrfMiddleware,
    roleMiddleware([UserRole.PROBLEM_SETTER, UserRole.ADMIN]),
    deleteProblemController
)

export default problemRouter;
