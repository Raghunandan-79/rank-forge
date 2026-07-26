import { PrismaPg } from "@prisma/adapter-pg";
import PG from "pg";
import { PrismaClient, UserRole } from "../generated/prisma/client";

const pool = new PG.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
export const prismaClient = new PrismaClient({ adapter });

export { UserRole };