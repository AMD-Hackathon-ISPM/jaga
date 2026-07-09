import Image from "next/image";
import { AssistantLauncher } from "@/features/chat/assistant-launcher";
import { cn } from "@/lib/utils";
import jagaLogo from "@/assets/icon.svg";
import { LanguageSwitcher } from "./language-switcher";

/** Header — logo left; Help + language toggle right. No clinical chrome. */
export function Header({ wide = false }: { wide?: boolean }) {
  return (
    <header
      className={cn(
        "mx-auto flex w-full items-center justify-between px-4 pt-4 lg:px-6",
        wide ? "max-w-flow lg:max-w-flow-wide" : "max-w-flow",
      )}
    >
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
