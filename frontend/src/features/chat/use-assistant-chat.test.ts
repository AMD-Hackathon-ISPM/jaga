import { describe, expect, it } from "vitest";
import { screenForPath } from "./use-assistant-chat";

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
