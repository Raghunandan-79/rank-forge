import { prismaClient } from "@repo/db/client";
import { AppError } from "../utils/app-error";

export async function getUsersService() {
  return prismaClient.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: {
      username: "asc",
    },
  });
}

export async function updateUserRoleService(id: string, role: "USER" | "PROBLEM_SETTER" | "ADMIN") {
  const user = await prismaClient.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return prismaClient.user.update({
    where: { id },
    data: { role },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
    },
  });
}

export async function deleteUserService(id: string) {
  const user = await prismaClient.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return prismaClient.user.delete({
    where: { id },
  });
}
