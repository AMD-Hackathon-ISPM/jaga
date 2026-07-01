import { AssistantLauncher } from "@/features/chat/assistant-launcher";
import { LanguageSwitcher } from "./language-switcher";

/** Header — product name + language toggle. Calm, no clinical chrome. */
export function Header() {
  return (
    <header className="mx-auto flex w-full max-w-flow items-center justify-between px-4 pt-4">
      <span className="font-serif text-lg font-semibold text-brand">Jaga</span>
      <div className="flex items-center gap-2">
        <AssistantLauncher />
        <LanguageSwitcher />
      </div>
    </header>
  );
}
