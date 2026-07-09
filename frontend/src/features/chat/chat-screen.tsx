"use client";

import { IconArrowUp, IconChevronLeft } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { useT } from "@/hooks/use-t";
import { SkipToMain } from "@/components/layout/skip-to-main";
import { cn } from "@/lib/utils";
import { ChatMessageItem } from "./chat-message";
import { useAssistantChat } from "./use-assistant-chat";

type ChatScreenVariant = "standalone" | "sheet";

/**
 * Guidance-assistant chat.
 *
 * `standalone` renders the full Figma /chat screen: a full-width teal header
 * band (back chevron + title) over the conversation and a pinned composer.
 * `sheet` drops the teal band (the launcher Sheet supplies its own title) and
 * fills the sheet body with the same disclaimer strip, bubbles, and composer.
 *
 * All conversation behavior (typewriter reveal, Thinking state, Enter-to-send,
 * 500-char cap, reduced-motion) lives in useAssistantChat and is left untouched.
 */
export function ChatScreen({ variant = "sheet" }: { variant?: ChatScreenVariant }) {
  const t = useT();
  const router = useRouter();
  const { messages, status, isBusy, inputValue, setInputValue, sendMessage } = useAssistantChat();
  const standalone = variant === "standalone";

  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    endRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "end" });
    // Follow new turns and status changes, not every streamed token.
  }, [messages.length, status]);

  const sendDisabled = !inputValue.trim() || isBusy;

  const conversation = (
    <>
      <div className="mx-auto w-full max-w-flow shrink-0 px-4 pt-4">
        <p className="mx-auto w-fit max-w-full rounded-control border border-border-subtle bg-warning-cream px-4 py-2 text-center text-base italic text-ink">
          {t("chat.disclaimer")}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto flex w-full max-w-flow flex-col gap-4">
          {messages.length === 0 && status === "ready" ? (
            <p className="py-10 text-center text-base text-ink-muted">{t("chat.empty")}</p>
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessageItem key={message.id} message={message} />
              ))}
              {status === "submitted" && (
                <p className="text-base text-ink-muted" role="status">
                  {t("chat.thinking")}
                </p>
              )}
            </>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <div className="mx-auto w-full max-w-flow shrink-0 px-4 pb-4 pt-2">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            sendMessage();
          }}
        >
          <div className="relative h-28 rounded-control bg-tint-brand-10 focus-within:ring-2 focus-within:ring-brand/40">
            <textarea
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={t("chat.placeholder")}
              maxLength={500}
              disabled={isBusy}
              aria-label={t("chat.inputLabel")}
              className="absolute inset-0 resize-none rounded-control bg-transparent px-4 py-3 pr-16 text-base text-ink placeholder:text-ink-muted focus:outline-none disabled:opacity-70"
            />
            <button
              type="submit"
              disabled={sendDisabled}
              aria-label={t("chat.send")}
              className="absolute bottom-3 right-3 flex size-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
            >
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-full transition-colors",
                  sendDisabled
                    ? "bg-surface-sunken text-ink-muted"
                    : "bg-brand text-white",
                )}
              >
                <IconArrowUp className="size-4" aria-hidden="true" />
              </span>
            </button>
          </div>
        </form>
      </div>
    </>
  );

  if (standalone) {
    return (
      <div className="flex h-dvh flex-col bg-canvas">
        <SkipToMain />
        <header className="shrink-0 bg-brand">
          <div className="mx-auto flex w-full max-w-flow items-center gap-1 px-2 py-3">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label={t("chat.back")}
              className="flex size-11 items-center justify-center rounded-full text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <IconChevronLeft className="size-6" aria-hidden="true" />
            </button>
            <h1 className="text-lg font-medium text-white">{t("chat.title")}</h1>
          </div>
        </header>
        <div id="main-content" className="flex min-h-0 flex-1 flex-col">
          {conversation}
        </div>
      </div>
    );
  }

  return <div className="flex min-h-0 flex-1 flex-col">{conversation}</div>;
}
