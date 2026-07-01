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
      <SheetTrigger asChild>
        <Button type="button" variant="secondary" size="sm">
          <MessageCircleIcon />
          Help
        </Button>
      </SheetTrigger>
      <SheetContent>
        <div className="mb-4 pr-10">
          <SheetTitle>Jaga guidance</SheetTitle>
          <SheetDescription>Workflow help only. Do not enter names or personal medical details.</SheetDescription>
        </div>
        <ChatScreen />
      </SheetContent>
    </Sheet>
  );
}
