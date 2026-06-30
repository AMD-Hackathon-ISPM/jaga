"use client";

import { useCallback } from "react";
import { useLanguage } from "./use-language";
import { getMessages } from "@/locales/messages";

/**
 * useT — minimal dot-path translator over the active language bundle.
 * Example: t("result.band.higher"). Falls back to the key if missing (a real
 * build should instead fail on missing mandatory keys, design §10).
 */
export function useT() {
  const { language } = useLanguage();
  const bundle = getMessages(language);

  return useCallback(
    (key: string): string => {
      const value = key.split(".").reduce<unknown>((acc, part) => {
        if (acc && typeof acc === "object" && part in (acc as Record<string, unknown>)) {
          return (acc as Record<string, unknown>)[part];
        }
        return undefined;
      }, bundle);
      return typeof value === "string" ? value : key;
    },
    [bundle],
  );
}
