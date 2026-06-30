"use client";

import { useLanguage } from "@/hooks/use-language";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

/**
 * LanguageSwitcher — pill toggle EN ⇄ ID (design §6). One tap; preserves step
 * and values (it only flips the language store). aria-label states the target.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { language, toggle } = useLanguage();

  return (
    <ToggleGroup
      type="single"
      value={language}
      onValueChange={(value) => value && value !== language && toggle()}
      variant="outline"
      spacing={0}
      aria-label="Language"
      className={className}
    >
      <ToggleGroupItem value="en" aria-label="Switch to English">
        EN
      </ToggleGroupItem>
      <ToggleGroupItem value="id" aria-label="Switch to Bahasa Indonesia">
        ID
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
