"use client";

import { MessageCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { config } from "@/lib/config";
import { ChatScreen } from "./chat-screen";

export function AssistantLauncher() {
  if (!config.enableAssistant) return null;

  return (
    <Sheet>
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40">
        <div className="mx-auto flex w-full max-w-flow justify-end px-4">
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="primary"
              size="icon-sm"
              aria-label="Open Jaga guidance"
              className="pointer-events-auto size-14 rounded-full shadow-lg transition-transform hover:scale-105"
            >
              <MessageCircleIcon className="size-6" />
            </Button>
          </SheetTrigger>
        </div>
      </div>
      <SheetContent>
        <div className="mb-4 shrink-0 pr-10">
          <SheetTitle>Jaga guidance</SheetTitle>
          <SheetDescription>Workflow help only. Do not enter names or personal medical details.</SheetDescription>
        </div>
        <ChatScreen />
      </SheetContent>
    </Sheet>
  );
}
