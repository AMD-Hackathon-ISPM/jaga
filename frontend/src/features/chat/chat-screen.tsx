"use client";

import { ArrowUpIcon, MessageCircleDashedIcon, PlusIcon, RotateCwIcon } from "lucide-react";

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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
} from "@/components/ui/input-group";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import { Spinner } from "@/components/ui/spinner";
import { ChatMessageItem } from "./chat-message";
import { useMockChat } from "./use-mock-chat";

export function ChatScreen() {
  const { messages, status, isBusy, nextQueuedText, hasMoreTurns, sendNext, reset } =
    useMockChat();

  return (
    <MessageScrollerProvider autoScroll>
      <div className="relative mx-auto flex w-full max-w-sm flex-col gap-4">
        <Card className="h-[35rem] gap-0 overflow-hidden py-0">
          <CardHeader className="gap-1 border-b border-border-subtle py-4">
            <CardTitle>New Chat</CardTitle>
            <CardDescription>How can I help you today?</CardDescription>
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
                    Press send to walk through a scripted demo of streaming scroll, turn anchoring,
                    and accessibility behavior.
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
                        <MarkerIcon>
                          <Spinner />
                        </MarkerIcon>
                        <MarkerContent className="shimmer">Thinking…</MarkerContent>
                      </Marker>
                    )}
                  </MessageScrollerContent>
                </MessageScrollerViewport>
                <MessageScrollerButton />
              </MessageScroller>
            )}
          </CardContent>

          <CardFooter className="flex-col gap-2 border-t border-border-subtle py-4">
            <form
              className="w-full"
              onSubmit={(event) => {
                event.preventDefault();
                if (!hasMoreTurns || isBusy) return;
                sendNext();
              }}
            >
              <InputGroup className="h-auto min-h-14">
                <div className="h-14 w-full px-3 py-2.5">
                  <span
                    className="line-clamp-2 text-sm opacity-60 data-[status=ready]:opacity-100"
                    data-status={status}
                  >
                    {nextQueuedText ? (
                      nextQueuedText
                    ) : (
                      <span className="text-muted-foreground">
                        No messages queued. Reset the conversation.
                      </span>
                    )}
                  </span>
                </div>
                <InputGroupAddon align="block-end" className="pt-1">
                  <InputGroupButton
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label="Add attachment"
                    disabled
                  >
                    <PlusIcon />
                  </InputGroupButton>
                  <InputGroupButton
                    type="submit"
                    variant="default"
                    size="icon-sm"
                    disabled={!nextQueuedText || isBusy}
                    className="ml-auto"
                    aria-label="Send message"
                  >
                    <ArrowUpIcon />
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </form>
          </CardFooter>
        </Card>

        <p className="px-0.5 text-center text-xs text-muted-foreground">
          Demo is read only. Press send to advance the scripted conversation.
        </p>
      </div>
    </MessageScrollerProvider>
  );
}
