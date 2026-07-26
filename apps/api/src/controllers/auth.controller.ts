import type { Request, Response } from "express";
import { loginSchema, signupSchema } from "../schemas/schemas";
import {
  getMeService,
  loginService,
  signupService,
} from "../services/auth.service";
import { createSession, deleteSession } from "../utils/session";

export async function signupController(req: Request, res: Response) {
  const parsed = signupSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid format",
    });
  }

  try {
    const { username, email, password } = parsed.data;

    const user = await signupService(username, email, password);

    res.status(201).json({
      message: "Signup successfully",
      user,
    });
  } catch (error) {
    console.error("Signup error:", error);

    return res.status(500).json({
      message: "Unable to signup user",
    });
  }
}

export async function loginController(req: Request, res: Response) {
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
    console.error("Login error:", error);

    return res.status(401).json({
      error: "Invalid credentials",
    });
  }
}

export async function meController(req: Request, res: Response) {
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
    console.error("Get me error:", error);

    return res.status(500).json({
      error: "Unable to fetch user",
    });
  }
}

export async function logoutController(req: Request, res: Response) {
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
      message: "Logout successfull",
    });
  } catch (error) {
    console.error("Logout error:", error);

    return res.status(500).json({
      errro: "Unable to logout",
    });
  }
}
