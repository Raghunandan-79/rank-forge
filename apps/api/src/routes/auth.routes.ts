import { Router } from "express";
import { signupSchema } from "../schemas/schemas";

const authRouter = Router();

authRouter.post("/signup", async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid format",
    });
    return;
  }

  try {
    const username = parsed.data?.username;
    const email = parsed.data?.email;
    const password = parsed.data?.password;

    res.json({
      message: "Signup successfull",
      user: {
        username,
        email,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to signup user",
    });
  }
});

export default authRouter;
