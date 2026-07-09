import { describe, expect, it } from "vitest";

import { EMPTY_GATE_ACKNOWLEDGEMENTS, isGateComplete } from "./gate-utils";

describe("isGateComplete", () => {
  it("returns false when no acknowledgements are checked", () => {
    expect(isGateComplete(EMPTY_GATE_ACKNOWLEDGEMENTS)).toBe(false);
  });

  it("returns false when only one acknowledgement is checked", () => {
    expect(
      isGateComplete({ adultWithCough: true, confirmatoryEvaluation: false }),
    ).toBe(false);
    expect(
      isGateComplete({ adultWithCough: false, confirmatoryEvaluation: true }),
    ).toBe(false);
  });

  it("returns true when both acknowledgements are checked", () => {
    expect(
      isGateComplete({ adultWithCough: true, confirmatoryEvaluation: true }),
    ).toBe(true);
  });
});
