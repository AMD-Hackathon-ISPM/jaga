"use client";

import { useLanguage } from "@/hooks/use-language";
import { useT } from "@/hooks/use-t";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "en" as const, label: "EN", switchKey: "language.switchEn" },
  { value: "id" as const, label: "ID", switchKey: "language.switchId" },
];

/**
 * LanguageSwitcher — segmented EN ⇄ ID pill (Figma header). White pill with a
 * teal hairline; the active segment is a filled teal pill with white text. One
 * tap flips the language store; step and values are preserved (store logic
 * unchanged). Each segment keeps a 44px touch target.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { language, toggle } = useLanguage();
  const t = useT();

  return (
    <div
      role="group"
      aria-label={t("language.navLabel")}
      className={cn(
        "inline-flex items-center rounded-full border border-brand bg-card p-0.5",
        className,
      )}
    >
      {OPTIONS.map((opt) => {
        const active = language === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            aria-label={t(opt.switchKey)}
            onClick={() => {
              if (!active) toggle();
            }}
            className={cn(
              "inline-flex min-h-11 items-center justify-center rounded-full px-3.5 text-sm font-semibold transition-colors",
              active ? "bg-brand text-white" : "text-brand hover:bg-tint-brand-5",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
