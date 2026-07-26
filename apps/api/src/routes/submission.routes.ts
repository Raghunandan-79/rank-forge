import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { getSubmissionByIdController } from "../controllers/submission.controller";

const submissionRouter = Router();

submissionRouter.get(
  "/:id",
  authMiddleware,
  getSubmissionByIdController,
);

export default submissionRouter;