import React, { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PatientIntakeRequest, TriageResult } from "@/types";
import { useSessionStore } from "@/store/session.store";
import { ReviewScreen } from "./review-screen";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: ReactNode; href: string }) =>
    React.createElement("a", { href, ...props }, children),
}));

const mockSubmitTriage = vi.fn();

vi.mock("@/services/triage.service", () => ({
  triageService: {
    submitTriage: (...args: unknown[]) => mockSubmitTriage(...args),
  },
}));

const VALID_CLINICAL: Partial<PatientIntakeRequest> = {
  age_years: 34,
  sex_at_birth: "female",
  height_cm: 160,
  weight_kg: 52,
  cough_duration_days: 21,
  prior_tb: false,
  hemoptysis: false,
  smoked_last_7_days: false,
  fever_last_30_days: true,
  night_sweats_last_30_days: true,
  weight_loss_last_30_days: true,
};

// Retryable YAMNet gate result: HTTP 200, no cough detected, estimate withheld.
const RETRYABLE_RESULT = {
  requestId: "mock-retryable",
  quality: [{ index: 1, quality: "retryable", reasonCode: "cough_not_detected" }],
  estimate: null,
  mandatoryNextStep: "This person should receive confirmatory TB evaluation regardless.",
  metadata: {
    modelVersion: "mock",
    contractVersion: "unsigned",
    schemaVersion: "0",
    cohort: "symptomatic adults 18+",
    limitations: [],
  },
} as TriageResult;

function renderReviewScreen() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });

  return render(
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(ReviewScreen),
    ),
  );
}

describe("ReviewScreen", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockSubmitTriage.mockReset();
    act(() => {
      useSessionStore.getState().reset();
      useSessionStore.setState({
        clinical: VALID_CLINICAL,
        coughRecording: {
          file: new File(["audio"], "cough-session.webm", { type: "audio/webm" }),
          durationMs: 90000,
        },
      });
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("returns to review with retry guidance instead of navigating when the cough is rejected", async () => {
    const user = userEvent.setup();
    mockSubmitTriage.mockResolvedValue(RETRYABLE_RESULT);
    renderReviewScreen();

    await user.click(screen.getByRole("button", { name: /submit for gema/i }));

    expect(await screen.findByText("No cough detected in the recording")).toBeVisible();

    await waitFor(() => expect(mockSubmitTriage).toHaveBeenCalledTimes(1));
    expect(mockPush).not.toHaveBeenCalled();
    expect(useSessionStore.getState().result).toBeNull();
  });
});
