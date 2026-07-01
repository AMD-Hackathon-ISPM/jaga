import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ChatScreen } from "@/features/chat/chat-screen";

export default function ChatPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas px-4 py-8">
      <header className="mx-auto mb-6 w-full max-w-sm">
        <div className="mb-4">
          <Button asChild variant="secondary" size="sm">
            <Link href="/">Back to triage</Link>
          </Button>
        </div>
        <h1 className="font-heading text-lg font-semibold text-brand">Jaga · Guidance</h1>
      </header>
      <ChatScreen />
    </div>
  );
}
