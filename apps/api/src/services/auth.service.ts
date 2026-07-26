import { prismaClient } from "@repo/db/client";
import bcrypt from "bcrypt";
import { AppError } from "../utils/app-error";

export async function signupService(
  username: string,
  email: string,
  password: string,
) {
  const existingUser = await prismaClient.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  });

  if (existingUser) {
    throw new AppError("User already exists", 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prismaClient.user.create({
    data: {
      username,
      email,
      passwordHash,
    },
  });

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,
  };
}

export async function loginService(email: string, password: string) {
  const existingUser = await prismaClient.user.findFirst({
    where: {
      email,
    },
  });

  if (!existingUser) {
    throw new AppError("Invalid credentials", 401);
  }

  const isPasswordValid = await bcrypt.compare(
    password,
    existingUser.passwordHash,
  );

  if (!isPasswordValid) {
    throw new AppError("Invalid credentials", 401);
  }

  return {
    id: existingUser.id,
    username: existingUser.username,
    email: existingUser.email,
    createdAt: existingUser.createdAt,
  };
}

export async function getMeService(userId: string) {
  const user = await prismaClient.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return {
    id: user?.id,
    username: user?.username,
    email: user?.email,
    createdAt: user?.createdAt,
  };
}
