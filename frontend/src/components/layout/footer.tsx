"use client";

import { useT } from "@/hooks/use-t";
import { cn } from "@/lib/utils";

/** Footer — persistent research disclaimer (locked safety language, design §2). */
export function Footer({ wide = false }: { wide?: boolean }) {
  const t = useT();

  return (
    <footer
      className={cn(
        "mx-auto w-full px-4 py-8 lg:px-6",
        wide ? "max-w-flow lg:max-w-flow-wide" : "max-w-flow",
      )}
    >
      <p className="mx-auto max-w-[65ch] text-center text-base font-light text-ink-muted">{t("footer.disclaimer")}</p>
    </footer>
  );
}
