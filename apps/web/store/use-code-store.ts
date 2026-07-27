"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CodeState {
  codes: Record<string, string>;
  setCode: (contestSlug: string, problemSlug: string, language: string, code: string) => void;
  getCode: (contestSlug: string, problemSlug: string, language: string) => string;
}

export const useCodeStore = create<CodeState>()(
  persist(
    (set, get) => ({
      codes: {},
      setCode: (contestSlug, problemSlug, language, code) => {
        const key = `${contestSlug}:${problemSlug}:${language}`;
        set((state) => ({
          codes: { ...state.codes, [key]: code }
        }));
      },
      getCode: (contestSlug, problemSlug, language) => {
        const key = `${contestSlug}:${problemSlug}:${language}`;
        return get().codes[key] || "";
      }
    }),
    {
      name: "rankforge-code-storage"
    }
  )
);
