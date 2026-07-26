import type { NextFunction, Request, Response } from "express";
import { redis } from "../config/redis";
import type { SessionData } from "../utils/session";

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

  const sessionData = await redis.get(`session:${sessionId}`);

  if (!sessionData) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  let session: SessionData;
  try {
    session = JSON.parse(sessionData);
  } catch {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  req.userId = session.userId;
  req.csrfToken = session.csrfToken;

  next();
}
