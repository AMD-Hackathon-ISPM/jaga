import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { screenForPath, useAssistantChat } from "./use-assistant-chat";

const sendMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ usePathname: () => "/clinical" }));
vi.mock("@/services/assistant.service", () => ({
  assistantService: { send: sendMock },
}));

const response = {
  request_id: "assistant-1",
  reply: "Here is the requested workflow guidance.",
  disposition: "answer" as const,
  provider: "fixture",
  model: "fixture",
  contract_version: "assistant-v1" as const,
};

function setReducedMotion(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  sendMock.mockReset();
});

describe("screenForPath", () => {
  it.each([
    ["/", "gate"],
    ["/clinical", "clinical"],
    ["/coughs", "coughs"],
    ["/review", "review"],
    ["/result", "result"],
    ["/cxr", "cxr"],
    ["/cxr/result", "cxr_result"],
  ])("maps %s to %s", (path, screen) => {
    expect(screenForPath(path)).toBe(screen);
  });
});

describe("useAssistantChat", () => {
  it("shows thinking, then progressively reveals the completed response", async () => {
    vi.useFakeTimers();
    setReducedMotion(false);
    let resolveResponse!: (value: typeof response) => void;
    sendMock.mockReturnValue(new Promise((resolve) => (resolveResponse = resolve)));
    const { result } = renderHook(() => useAssistantChat());

    act(() => result.current.setInputValue("How do I complete this field?"));
    act(() => result.current.sendMessage());
    expect(result.current.status).toBe("submitted");

    await act(async () => {
      resolveResponse(response);
      await Promise.resolve();
    });
    expect(result.current.status).toBe("streaming");
    expect(result.current.messages.at(-1)?.content).toBe("");

    act(() => vi.advanceTimersByTime(18));
    expect(result.current.messages.at(-1)?.content).toBe("Here");

    act(() => vi.runAllTimers());
    expect(result.current.messages.at(-1)?.content).toBe(response.reply);
    expect(result.current.status).toBe("ready");
  });

  it("reveals the completed response immediately under reduced motion", async () => {
    setReducedMotion(true);
    sendMock.mockResolvedValue(response);
    const { result } = renderHook(() => useAssistantChat());

    act(() => result.current.setInputValue("What happens next?"));
    await act(async () => result.current.sendMessage());

    expect(result.current.messages.at(-1)?.content).toBe(response.reply);
    expect(result.current.status).toBe("ready");
  });
});
