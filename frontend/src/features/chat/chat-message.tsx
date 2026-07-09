"use client";

import { ChatMarkdown } from "./chat-markdown";
import type { ChatMessage } from "./mock-conversation";

/**
 * A single chat turn. User turns render as a right-aligned teal-tint bubble
 * (Figma radius 15px with a 5px square top-right corner); assistant turns render
 * as plain left-aligned Markdown so the typewriter reveal reads as flowing text.
 */
export function ChatMessageItem({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-[15px] rounded-tr-[5px] bg-tint-brand-10 px-4 py-2.5 text-base leading-relaxed text-ink">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-full text-base leading-relaxed text-ink">
        <ChatMarkdown text={message.content} />
      </div>
    </div>
  );
}
