"use client";

import { useT } from "@/hooks/use-t";

/** First-focusable skip link for keyboard users (WCAG 2.4.1). */
export function SkipToMain() {
  const t = useT();

  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-tooltip focus:rounded-control focus:bg-brand focus:px-4 focus:py-2 focus:text-white focus:outline-none"
    >
      {t("common.skipToMain")}
    </a>
  );
}
