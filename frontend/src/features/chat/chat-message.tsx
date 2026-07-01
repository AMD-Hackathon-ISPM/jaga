"use client";

import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Message, MessageContent } from "@/components/ui/message";
import { MessageScrollerItem } from "@/components/ui/message-scroller";
import type { ChatMessage } from "./mock-conversation";

export function ChatMessageItem({
  message,
  scrollAnchor = false,
}: {
  message: ChatMessage;
  scrollAnchor?: boolean;
}) {
  const isUser = message.role === "user";

  return (
    <MessageScrollerItem scrollAnchor={scrollAnchor}>
      <Message align={isUser ? "end" : "start"}>
        <MessageContent>
          {isUser ? (
            <Bubble variant="secondary" align="end">
              <BubbleContent className="rounded-2xl rounded-tr-sm">{message.content}</BubbleContent>
            </Bubble>
          ) : (
            <Bubble variant="ghost">
              <BubbleContent className="whitespace-pre-wrap">{message.content}</BubbleContent>
            </Bubble>
          )}
        </MessageContent>
      </Message>
    </MessageScrollerItem>
  );
}
