"use client";

import { useLanguageStore } from "@/store/language.store";

/** Convenience hook over the language store. */
export function useLanguage() {
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  const toggle = useLanguageStore((s) => s.toggle);
  return { language, setLanguage, toggle };
}
