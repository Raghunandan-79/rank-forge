import type { NextFunction, Request, Response } from "express";
import { updateUserRoleSchema } from "../schemas/schemas";
import { getUsersService, updateUserRoleService } from "../services/user.service";

export async function getUsersController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const users = await getUsersService();
    return res.status(200).json({ users });
  } catch (error) {
    next(error);
  }
}

export async function updateUserRoleController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;
    if (typeof id !== "string") {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Do not allow admins to change their own role to prevent lockout
    if (id === req.userId) {
      return res.status(400).json({ error: "You cannot change your own role" });
    }

    const parsed = updateUserRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid role value" });
    }

    const { role } = parsed.data;

    const user = await updateUserRoleService(id, role);

    return res.status(200).json({
      message: "User role updated successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
}
