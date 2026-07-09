import { AssistantLauncher } from "@/features/chat/assistant-launcher";
import jagaLogo from "@/assets/icon.svg";
import { LanguageSwitcher } from "./language-switcher";

/** Header — product name + language toggle. Calm, no clinical chrome. */
export function Header() {
  return (
    <header className="mx-auto flex w-full max-w-flow items-center justify-between px-4 pt-4">
      <span className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={jagaLogo.src} alt="" aria-hidden="true" className="h-5 w-5" width={jagaLogo.width} height={jagaLogo.height} />
        <span className="font-serif text-lg font-semibold text-brand">Jaga</span>
      </span>
      <div className="flex items-center gap-2">
        <AssistantLauncher />
        <LanguageSwitcher />
      </div>
    </header>
  );
}
