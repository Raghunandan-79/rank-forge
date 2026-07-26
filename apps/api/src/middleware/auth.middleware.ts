import type { NextFunction, Request, Response } from "express";
import { redis } from "../config/redis";

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const sessionId = req.cookies.session_id;

  if (!sessionId) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  const userId = await redis.get(`session:${sessionId}`);

  if (!userId) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  req.userId = userId;
  next();
}
