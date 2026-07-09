"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { AssistantScreen } from "@/contracts/api";
import { createAssistantRequest } from "@/lib/integration";
import { getMessages } from "@/locales/messages";
import { assistantService } from "@/services/assistant.service";
import { useLanguageStore } from "@/store/language.store";
import type { ChatMessage, ChatStatus } from "./mock-conversation";

export function screenForPath(path: string): AssistantScreen {
  if (path === "/cxr/result") return "cxr_result";
  if (path.startsWith("/cxr")) return "cxr";
  if (path.startsWith("/clinical")) return "clinical";
  if (path.startsWith("/coughs")) return "coughs";
  if (path.startsWith("/review")) return "review";
  if (path.startsWith("/result")) return "result";
  return "gate";
}

function createId() {
  return crypto.randomUUID();
}

const REVEAL_INTERVAL_MS = 50;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useAssistantChat() {
  const pathname = usePathname();
  const language = useLanguageStore((state) => state.language);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("ready");
  const [inputValue, setInputValue] = useState("");
  const revealTimerRef = useRef<number | null>(null);

  const clearReveal = useCallback(() => {
    if (revealTimerRef.current !== null) {
      window.clearInterval(revealTimerRef.current);
      revealTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearReveal, [clearReveal]);

  const revealAssistantResponse = useCallback(
    (content: string) => {
      const id = createId();
      clearReveal();

      if (prefersReducedMotion()) {
        setMessages((current) => [...current, { id, role: "assistant", content }]);
        setStatus("ready");
        return;
      }

      const tokens = content.match(/\S+|\s+/g) ?? [content];
      let tokenIndex = 0;
      setMessages((current) => [...current, { id, role: "assistant", content: "" }]);
      setStatus("streaming");

      revealTimerRef.current = window.setInterval(() => {
        tokenIndex += 1;
        const partial = tokens.slice(0, tokenIndex).join("");
        setMessages((current) =>
          current.map((message) => (message.id === id ? { ...message, content: partial } : message)),
        );
        if (tokenIndex >= tokens.length) {
          clearReveal();
          setStatus("ready");
        }
      }, REVEAL_INTERVAL_MS);
    },
    [clearReveal],
  );

  const reset = useCallback(() => {
    clearReveal();
    setMessages([]);
    setInputValue("");
    setStatus("ready");
  }, [clearReveal]);

  const sendMessage = useCallback(async () => {
    const content = inputValue.trim();
    if (!content || content.length > 500 || status !== "ready") return;

    const userMessage: ChatMessage = { id: createId(), role: "user", content };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInputValue("");
    setStatus("submitted");

    try {
      const response = await assistantService.send(
        createAssistantRequest({
          locale: language,
          screen: screenForPath(pathname),
          messages: nextMessages.map(({ role, content: messageContent }) => ({
            role,
            content: messageContent,
          })),
        }),
      );
      revealAssistantResponse(response.reply);
    } catch {
      clearReveal();
      const messages = getMessages(language);
      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: "assistant",
          content: messages.chat.error.unavailable,
        },
      ]);
      setStatus("ready");
    }
  }, [clearReveal, inputValue, language, messages, pathname, revealAssistantResponse, status]);

  return {
    messages,
    status,
    isBusy: status === "submitted" || status === "streaming",
    inputValue,
    setInputValue,
    sendMessage: () => void sendMessage(),
    reset,
  };
}
