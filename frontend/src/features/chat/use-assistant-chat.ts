"use client";

import { useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import type { AssistantScreen } from "@/contracts/api";
import { createAssistantRequest } from "@/lib/integration";
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

export function useAssistantChat() {
  const pathname = usePathname();
  const language = useLanguageStore((state) => state.language);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("ready");
  const [inputValue, setInputValue] = useState("");

  const reset = useCallback(() => {
    setMessages([]);
    setInputValue("");
    setStatus("ready");
  }, []);

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
      setMessages((current) => [
        ...current,
        { id: createId(), role: "assistant", content: response.reply },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: "assistant",
          content: "Guidance is temporarily unavailable. Continue with the standard workflow.",
        },
      ]);
    } finally {
      setStatus("ready");
    }
  }, [inputValue, language, messages, pathname, status]);

  return {
    messages,
    status,
    isBusy: status === "submitted",
    inputValue,
    setInputValue,
    sendMessage: () => void sendMessage(),
    reset,
  };
}
