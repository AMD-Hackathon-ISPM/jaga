"use client";

import { IconMessageCircleQuestion } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useT } from "@/hooks/use-t";
import { config } from "@/lib/config";
import { ChatScreen } from "./chat-screen";

export function AssistantLauncher() {
  const t = useT();

  if (!config.enableAssistant) return null;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" size="md" className="gap-1.5 px-3.5 text-brand">
          <IconMessageCircleQuestion data-icon="inline-start" aria-hidden="true" />
          {t("chat.launcher.help")}
        </Button>
      </SheetTrigger>
      <SheetContent className="gap-0 overflow-hidden p-0">
        <div className="flex h-full flex-col">
          <div className="shrink-0 px-4 pb-3 pt-4 pr-12">
            <SheetTitle>{t("chat.launcher.title")}</SheetTitle>
            <SheetDescription>{t("chat.launcher.privacy")}</SheetDescription>
          </div>
          <ChatScreen variant="sheet" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
