import { Router } from "express";
import {
  loginController,
  logoutController,
  meController,
  signupController,
} from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  loginRateLimiter,
  signupRateLimiter,
} from "../middleware/rate-limit.middleware";
import { csrfMiddleware } from "../middleware/csrf.middleware";

const authRouter = Router();

authRouter.post("/signup", signupRateLimiter, signupController);
authRouter.post("/login", loginRateLimiter, loginController);
authRouter.get("/me", authMiddleware, meController);
authRouter.post("/logout", authMiddleware, csrfMiddleware, logoutController);

export default authRouter;
