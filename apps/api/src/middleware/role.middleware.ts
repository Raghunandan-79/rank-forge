import { prismaClient, UserRole } from "@repo/db/client";
import type { NextFunction, Request, Response } from "express";

export function roleMiddleware(allowedRoles: UserRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({
          error: "Unauthorized",
        });
      }

      const user = await prismaClient.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          role: true,
        },
      });

      if (!user) {
        return res.status(401).json({
          error: "Unauthorized",
        });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          error: "Forbidden",
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
