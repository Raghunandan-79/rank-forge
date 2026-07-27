import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";

import {
  getSubmissionByIdController,
  getUserSubmissionsController,
} from "../controllers/submission.controller";

const submissionRouter = Router();

submissionRouter.get("/me", authMiddleware, getUserSubmissionsController);

submissionRouter.get("/:id", authMiddleware, getSubmissionByIdController);

export default submissionRouter;
