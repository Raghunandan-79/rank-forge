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

export const sessionDataSchema = z
  .object({
    userId: z.string().min(1).max(200),
    csrfToken: z.string().min(1).max(200),
  })
  .strict();

export type SessionData = z.infer<typeof sessionDataSchema>;

export const createProblemSchema = z
  .object({
    title: z.string().min(3).max(150),
    slug: z
      .string()
      .min(3)
      .max(150)
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug must contain lowercase letters, numbers, and hyphens only",
      ),
    description: z.string().min(10).max(10000),
    difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  })
  .strict();

export const createTestCaseSchema = z
  .object({
    input: z.string().max(100000),
    expectedOutput: z.string().max(100000),
    isHidden: z.boolean().default(true),
  })
  .strict();

export const createSubmissionSchema = z
  .object({
    sourceCode: z.string().min(1).max(100000),
    language: z.enum(["C", "CPP", "JAVA", "PYTHON", "JAVASCRIPT"]),
    customInput: z.string().max(100000).optional(),
    customExpectedOutput: z.string().max(100000).optional(),
  })
  .strict();

export const createContestSchema = z
  .object({
    title: z.string().min(3).max(100),

    slug: z
      .string()
      .min(3)
      .max(100)
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug must contain lowercase letters, numbers and hyphens only",
      ),

    description: z.string().min(10).max(5000),

    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export type CreateContestInput = z.infer<typeof createContestSchema>;

export const addContestProblemSchema = z
  .object({
    problemSlug: z.string().min(1).max(150),

    index: z
      .string()
      .min(1)
      .max(3)
      .transform((value) => value.toUpperCase()),

    points: z.number().int().positive().default(100),
  })
  .strict();

export type AddContestProblemInput = z.infer<typeof addContestProblemSchema>;

export const updateUserRoleSchema = z
  .object({
    role: z.enum(["USER", "PROBLEM_SETTER", "ADMIN"]),
  })
  .strict();
