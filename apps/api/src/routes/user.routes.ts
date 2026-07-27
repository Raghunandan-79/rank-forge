import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { csrfMiddleware } from "../middleware/csrf.middleware";
import { roleMiddleware } from "../middleware/role.middleware";
import { UserRole } from "@repo/db/client";
import { getUsersController, updateUserRoleController } from "../controllers/user.controller";

const userRouter = Router();

userRouter.get(
  "/",
  authMiddleware,
  roleMiddleware([UserRole.ADMIN]),
  getUsersController
);

userRouter.patch(
  "/:id/role",
  authMiddleware,
  csrfMiddleware,
  roleMiddleware([UserRole.ADMIN]),
  updateUserRoleController
);

export default userRouter;
