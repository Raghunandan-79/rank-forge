import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/app-error";

export function errorMiddleware(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: error.message,
    });
  }
  
  console.error("Unhandled error:", error);

  return res.status(500).json({
    error: "Internal server error",
  });
}
