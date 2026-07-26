import { Router } from "express";
import {
  loginController,
  logoutController,
  meController,
  signupController,
} from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { authRateLimiter } from "../middleware/rate-limit.middleware";

const authRouter = Router();

authRouter.post("/signup", authRateLimiter, signupController);
authRouter.post("/login", authRateLimiter, loginController);
authRouter.get("/me", authMiddleware, meController);
authRouter.post("/logout", authMiddleware, logoutController);

export default authRouter;
