"use client";

import { useEffect } from "react";
import { useLanguageStore } from "@/store/language.store";

/** Keeps document lang in sync with the language store (WCAG 3.1.1). */
export function HtmlLang() {
  const language = useLanguageStore((state) => state.language);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return null;
}
