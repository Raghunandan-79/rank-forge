import type { NextFunction, Request, Response } from "express";

export function csrfMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const csrfToken = req.get("X-CSRF-Token");

  if (!csrfToken || !req.csrfToken) {
    return res.status(403).json({
      error: "Invalid CSRF token",
    });
  }

  if (csrfToken !== req.csrfToken) {
    return res.status(403).json({
      error: "Invalid CSRF token",
    });
  }

  next();
}
