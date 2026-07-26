import { Router } from "express";
import {
  loginController,
  logoutController,
  meController,
  signupController,
} from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const authRouter = Router();

authRouter.post("/signup", signupController);
authRouter.post("/login", loginController);
authRouter.get("/me", authMiddleware, meController);
authRouter.post("/logout", authMiddleware, logoutController);

export default authRouter;
