"use client";

import { useLanguage } from "@/hooks/use-language";
import { cn } from "@/lib/utils";

/**
 * LanguageSwitcher — pill toggle EN ⇄ ID (design §6). One tap; preserves step
 * and values (it only flips the language store). aria-label states the target.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { language, toggle } = useLanguage();
  const target = language === "en" ? "Bahasa Indonesia" : "English";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${target}`}
      className={cn(
        "inline-flex min-h-[44px] items-center gap-1 rounded-full border border-border-strong bg-surface px-3 text-sm font-semibold",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus",
        className,
      )}
    >
      <span className={cn(language === "en" && "text-brand")}>EN</span>
      <span aria-hidden className="text-ink-muted">
        /
      </span>
      <span className={cn(language === "id" && "text-brand")}>ID</span>
    </button>
  );
}
