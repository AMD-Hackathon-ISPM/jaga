"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getNextQueuedUserText,
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

export function useMockChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("ready");
  const [turnIndex, setTurnIndex] = useState(0);
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

  const sendNext = useCallback(() => {
    if (status !== "ready") return;

    const turn = MOCK_TURNS[turnIndex];
    if (!turn) return;

    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      content: turn.user,
    };

    setMessages((prev) => [...prev, userMessage]);
    setStatus("submitted");

    thinkingTimerRef.current = window.setTimeout(() => {
      streamAssistantReply(turn.assistant);
    }, THINKING_MS);
  }, [status, streamAssistantReply, turnIndex]);

  const nextQueuedText = getNextQueuedUserText(turnIndex);
  const isBusy = status === "submitted" || status === "streaming";

  return {
    messages,
    status,
    isBusy,
    nextQueuedText,
    hasMoreTurns: turnIndex < MOCK_TURNS.length,
    sendNext,
    reset,
  };
}
