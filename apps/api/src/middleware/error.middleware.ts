import type { NextFunction, Request, Response } from "express";

export function errorMiddleware(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  console.error("Unhandled error:", error);

  return res.status(500).json({
    error: "Internal server error",
  });
}
