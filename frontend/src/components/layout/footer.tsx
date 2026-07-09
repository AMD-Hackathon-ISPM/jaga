"use client";

import { useT } from "@/hooks/use-t";

/** Footer — persistent research disclaimer (locked safety language, design §2). */
export function Footer() {
  const t = useT();

  return (
    <footer className="mx-auto w-full max-w-flow px-4 py-8">
      <p className="text-center text-base font-light text-ink-muted">{t("footer.disclaimer")}</p>
    </footer>
  );
}
