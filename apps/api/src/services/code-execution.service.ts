import { ProgrammingLanguage } from "@repo/db/client";
import { JUDGE0_LANGUAGE_IDS } from "../config/judge0";

export type Judge0Result = {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;

  time: string | null;
  memory: number | null;

  status: {
    id: number;
    description: string;
  };
};

export async function executeCode(
  sourceCode: string,
  language: ProgrammingLanguage,
  input: string,
): Promise<Judge0Result> {
  const judge0Url = process.env.JUDGE0_URL;

  if (!judge0Url) {
    throw new Error("JUDGE0_URL is not configured");
  }

  const languageId = JUDGE0_LANGUAGE_IDS[language];

  if (!languageId) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const response = await fetch(
    `${judge0Url}/submissions?base64_encoded=false&wait=true`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        source_code: sourceCode,
        language_id: languageId,
        stdin: input,
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();

    throw new Error(
      `Judge0 request failed (${response.status}): ${body}`,
    );
  }

  return (await response.json()) as Judge0Result;
}