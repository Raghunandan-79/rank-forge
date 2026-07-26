import { prismaClient } from "@repo/db/client";
import bcrypt from "bcrypt";

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
    throw new Error("User already exists");
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
    throw new Error("Invalid credentials");
  }

  const isPasswordValid = await bcrypt.compare(
    password,
    existingUser.passwordHash,
  );

  if (!isPasswordValid) {
    throw new Error("Invalid credentials");
  }

  return {
    id: existingUser.id,
    username: existingUser.username,
    email: existingUser.email,
    createdAt: existingUser.createdAt
  }
}
