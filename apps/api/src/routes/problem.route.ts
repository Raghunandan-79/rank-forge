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

const problemRouter = Router();

problemRouter.get("/", getProblemsController);
problemRouter.get("/:slug", getProblemBySlugController);
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

export default problemRouter;
