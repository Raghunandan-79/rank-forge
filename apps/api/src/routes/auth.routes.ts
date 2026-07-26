import { Router } from "express";
import {
  loginController,
  meController,
  signupController,
} from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const authRouter = Router();

authRouter.post("/signup", signupController);
authRouter.post("/login", loginController);
authRouter.get("/me", authMiddleware, meController);

export default authRouter;
