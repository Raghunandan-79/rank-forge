import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { csrfMiddleware } from "../middleware/csrf.middleware";
import { roleMiddleware } from "../middleware/role.middleware";
import { UserRole } from "@repo/db/client";
import {
  createProblemController,
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

export default problemRouter;
