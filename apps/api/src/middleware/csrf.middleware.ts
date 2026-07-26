import type { NextFunction, Request, Response } from "express";
import type { SessionData } from "../utils/session";
import { redis } from "../config/redis";

export async function csrfMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const csrfToken = req.get("X-CSRF-Token");

  if (!csrfToken) {
    return res.status(403).json({
      error: "Invalid CSRF token",
    });
  }

  const sessionId = req.cookies.session_id;

  if (!sessionId) {
    return res.status(403).json({
      error: "Invalid CSRF token",
    });
  }

  const sessionData = await redis.get(`session:${sessionId}`);

  if (!sessionData) {
    return res.status(403).json({
      error: "Invalid CSRF token",
    });
  }

  const session: SessionData = JSON.parse(sessionData);

  if (csrfToken !== session.csrfToken) {
    return res.status(403).json({
      error: "Invalid CSRF token",
    });
  }

  next();
}
