import type { Request, Response } from "express";
import { signupSchema } from "../schemas/schemas";
import { signupService } from "../services/auth.service";

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
        message: "User signedup successfully",
        user
    })
  } catch (error) {
    console.error("Signup error:", error);

    return res.status(500).json({
      message: "Unable to signup user",
    });
  }
}
