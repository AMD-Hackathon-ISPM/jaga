import { ChatScreen } from "@/features/chat/chat-screen";

/** Standalone chat demo — outside the triage flow. Mock streaming only; no API. */
export default function ChatPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas px-4 py-8">
      <header className="mx-auto mb-6 w-full max-w-sm">
        <h1 className="font-heading text-lg font-semibold text-brand">Jaga · Chat demo</h1>
        <p className="text-sm text-muted-foreground">
          shadcn MessageScroller, Bubble, Marker, and shimmer loading state.
        </p>
      </header>
      <ChatScreen />
    </div>
  );
}
