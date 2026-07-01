"use client";

import { ArrowUpIcon, MessageCircleDashedIcon, RotateCwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Marker, MarkerContent } from "@/components/ui/marker";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import { ChatMessageItem } from "./chat-message";
import { useAssistantChat } from "./use-assistant-chat";

export function ChatScreen() {
  const { messages, status, isBusy, inputValue, setInputValue, sendMessage, reset } =
    useAssistantChat();

  return (
    <MessageScrollerProvider autoScroll={status === "ready"}>
      <div className="relative mx-auto flex w-full max-w-sm flex-col gap-4">
        <Card className="h-[35rem] gap-0 overflow-hidden py-0">
          <CardHeader className="gap-1 border-b border-border-subtle py-4">
            <CardTitle>Guidance assistant</CardTitle>
            <CardDescription>Workflow help only—not diagnosis or result interpretation.</CardDescription>
            <CardAction>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label="Reset conversation"
                onClick={reset}
                disabled={isBusy}
              >
                <RotateCwIcon />
              </Button>
            </CardAction>
          </CardHeader>

          <CardContent className="flex min-h-0 flex-1 overflow-hidden p-0">
            {messages.length === 0 && status === "ready" ? (
              <Empty className="h-full border-0">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <MessageCircleDashedIcon />
                  </EmptyMedia>
                  <EmptyTitle>Start a conversation</EmptyTitle>
                  <EmptyDescription>
                    Ask about the current screen, form fields, recording steps, or what happens next.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <MessageScroller>
                <MessageScrollerViewport>
                  <MessageScrollerContent aria-busy={isBusy} className="p-4">
                    {messages.map((message) => (
                      <ChatMessageItem
                        key={message.id}
                        message={message}
                        scrollAnchor={message.role === "user"}
                      />
                    ))}

                    {status === "submitted" && (
                      <Marker role="status">
                        <MarkerContent className="shimmer">Thinking…</MarkerContent>
                      </Marker>
                    )}
                  </MessageScrollerContent>
                </MessageScrollerViewport>
                <MessageScrollerButton />
              </MessageScroller>
            )}
          </CardContent>

          <CardFooter className="flex-col gap-2 py-4">
            <form
              className="w-full"
              onSubmit={(event) => {
                event.preventDefault();
                sendMessage();
              }}
            >
              <div className="flex w-full flex-col rounded-xl border border-border-subtle bg-surface-sunken">
                <textarea
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Type a message…"
                  rows={2}
                  maxLength={500}
                  disabled={isBusy}
                  className="field-sizing-content min-h-14 w-full resize-none border-0 bg-transparent px-3 py-2.5 text-base text-ink outline-none placeholder:text-ink-muted disabled:cursor-not-allowed disabled:opacity-60 md:text-sm"
                />
                <div className="flex items-center justify-end px-2 pb-2 pt-1">
                  <Button
                    type="submit"
                    variant="default"
                    size="icon-sm"
                    disabled={!inputValue.trim() || isBusy}
                    className="size-9 shrink-0 rounded-full p-0"
                    aria-label="Send message"
                  >
                    <ArrowUpIcon className="size-4" />
                  </Button>
                </div>
              </div>
            </form>
          </CardFooter>
        </Card>
      </div>
    </MessageScrollerProvider>
  );
}
