import z from "zod";

export const signupSchema = z
  .object({
    username: z.string().min(3).max(30),
    email: z.email().min(3).max(100),
    password: z.string().min(8).max(128),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.email().min(3).max(100),
    password: z.string().min(8).max(128),
  })
  .strict();
