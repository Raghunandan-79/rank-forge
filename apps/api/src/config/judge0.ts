import { ProgrammingLanguage } from "@repo/db/client";

export const JUDGE0_LANGUAGE_IDS: Record<ProgrammingLanguage, number> = {
  [ProgrammingLanguage.C]: 50, // GCC 9.2.0
  [ProgrammingLanguage.CPP]: 54, // GCC 9.2.0
  [ProgrammingLanguage.JAVA]: 62, // OpenJDK 13
  [ProgrammingLanguage.PYTHON]: 71, // Python 3.8.1
  [ProgrammingLanguage.JAVASCRIPT]: 63, // Node.js 12.14
};
