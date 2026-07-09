import { describe, expect, it } from "vitest";

import { isClinicalComplete } from "./clinical-form-utils";
import type { ClinicalFormValues } from "./clinical-schema";

describe("isClinicalComplete", () => {
  const complete = {
    age_years: 30,
    sex_at_birth: "male" as const,
    height_cm: 170,
    weight_kg: 70,
    cough_duration_days: 14,
    prior_tb: false,
    hemoptysis: false,
    smoked_last_7_days: false,
    fever_last_30_days: false,
    night_sweats_last_30_days: false,
    weight_loss_last_30_days: false,
  };

  it("returns true for a complete required set without optional vitals", () => {
    expect(isClinicalComplete(complete)).toBe(true);
  });

  it("ignores empty optional vitals", () => {
    expect(
      isClinicalComplete({
        ...complete,
        heart_rate_bpm: null,
        temperature_c: undefined,
      }),
    ).toBe(true);
  });

  it("returns false when a required boolean is missing", () => {
    const incomplete: Partial<ClinicalFormValues> = { ...complete };
    delete incomplete.prior_tb;
    expect(isClinicalComplete(incomplete)).toBe(false);
  });
});
