"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  MOCK_TURNS,
  type ChatMessage,
  type ChatStatus,
} from "./mock-conversation";

const THINKING_MS = 900;
const TOKEN_MS = 18;

function createId() {
  return crypto.randomUUID();
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const FALLBACK_ASSISTANT =
  "Thanks for your message! This demo uses scripted replies about MessageScroller — reset the conversation to replay them, or connect a real API for live responses.";

export function useMockChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("ready");
  const [turnIndex, setTurnIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const streamTimerRef = useRef<number | null>(null);
  const thinkingTimerRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (streamTimerRef.current !== null) {
      window.clearInterval(streamTimerRef.current);
      streamTimerRef.current = null;
    }
    if (thinkingTimerRef.current !== null) {
      window.clearTimeout(thinkingTimerRef.current);
      thinkingTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const reset = useCallback(() => {
    clearTimers();
    setMessages([]);
    setTurnIndex(0);
    setInputValue("");
    setStatus("ready");
  }, [clearTimers]);

  const streamAssistantReply = useCallback(
    (assistantText: string) => {
      const assistantId = createId();

      if (prefersReducedMotion()) {
        setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: assistantText }]);
        setStatus("ready");
        setTurnIndex((i) => i + 1);
        return;
      }

      setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);
      setStatus("streaming");

      const tokens = assistantText.match(/\S+|\s+/g) ?? [assistantText];
      let index = 0;

      streamTimerRef.current = window.setInterval(() => {
        index += 1;
        const partial = tokens.slice(0, index).join("");

        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId ? { ...message, content: partial } : message,
          ),
        );

        if (index >= tokens.length) {
          clearTimers();
          setStatus("ready");
          setTurnIndex((i) => i + 1);
        }
      }, TOKEN_MS);
    },
    [clearTimers],
  );

  const sendMessage = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed || status !== "ready") return;

    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      content: trimmed,
    };

    const assistantText = MOCK_TURNS[turnIndex]?.assistant ?? FALLBACK_ASSISTANT;

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setStatus("submitted");

    thinkingTimerRef.current = window.setTimeout(() => {
      streamAssistantReply(assistantText);
    }, THINKING_MS);
  }, [inputValue, status, streamAssistantReply, turnIndex]);

  const isBusy = status === "submitted" || status === "streaming";

  return {
    messages,
    status,
    isBusy,
    inputValue,
    setInputValue,
    sendMessage,
    reset,
  };
}
