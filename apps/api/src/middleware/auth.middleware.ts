import type { NextFunction, Request, Response } from "express";
import { redis } from "../config/redis";
import {
  sessionDataSchema,
  type SessionData,
} from "../schemas/schemas";

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
    const parsedData = JSON.parse(sessionData);
    session = sessionDataSchema.parse(parsedData);
  } catch {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  req.userId = session.userId;
  req.csrfToken = session.csrfToken;

  next();
}
