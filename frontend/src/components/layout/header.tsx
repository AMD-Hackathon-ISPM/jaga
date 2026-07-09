import Image from "next/image";
import { AssistantLauncher } from "@/features/chat/assistant-launcher";
import jagaLogo from "@/assets/icon.svg";
import { LanguageSwitcher } from "./language-switcher";

/** Header — logo left; Help + language toggle right. No clinical chrome. */
export function Header() {
  return (
    <header className="mx-auto flex w-full max-w-flow items-center justify-between px-4 pt-4">
      <Image
        src={jagaLogo}
        alt="Jaga"
        className="h-[27px] w-[27px]"
        width={27}
        height={27}
        priority
      />
      <div className="flex items-center gap-2">
        <AssistantLauncher />
        <LanguageSwitcher />
      </div>
    </header>
  );
}
