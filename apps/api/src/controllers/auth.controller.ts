import type { NextFunction, Request, Response } from "express";
import { loginSchema, signupSchema } from "../schemas/schemas";
import {
  getMeService,
  loginService,
  signupService,
} from "../services/auth.service";
import { createSession, deleteSession } from "../utils/session";

export async function signupController(
  req: Request, 
  res: Response,
  next: NextFunction
) {
  const parsed = signupSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid format",
    });
  }

  try {
    const { username, email, password } = parsed.data;

    const user = await signupService(username, email, password);

    return res.status(201).json({
      message: "Signup successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
}

export async function loginController(
  req: Request, 
  res: Response,
  next: NextFunction
) {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid format",
    });
  }

  try {
    const { email, password } = parsed.data;

    const user = await loginService(email, password);
    const { sessionId, csrfToken } = await createSession(user.id);

    res.cookie("session_id", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.status(200).json({
      message: "Login successfull",
      user,
      csrfToken
    });
  } catch (error) {
    next(error);
  }
}

export async function meController(
  req: Request, 
  res: Response, 
  next: NextFunction
) {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const user = await getMeService(userId);

    return res.status(200).json({
      user,
    });
  } catch (error) {
    next(error);
  }
}

export async function logoutController(
  req: Request, 
  res: Response,
  next: NextFunction,
) {
  try {
    const sessionId = req.cookies.session_id;

    if (sessionId) {
      await deleteSession(sessionId);
    }

    res.clearCookie("session_id", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return res.status(200).json({
      message: "Logout successful",
    });
  } catch (error) {
    next(error);
  }
}
