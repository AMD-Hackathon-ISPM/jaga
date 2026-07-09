import React, { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSessionStore } from "@/store/session.store";
import { ClinicalForm } from "./clinical-form";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: ReactNode;
    href: string;
  }) => React.createElement("a", { href, ...props }, children),
}));

const mockSubmitIntake = vi.fn();

vi.mock("@/services/patient.service", () => ({
  patientService: {
    submitIntake: (...args: unknown[]) => mockSubmitIntake(...args),
  },
  PatientValidationError: class PatientValidationError extends Error {
    errors: unknown[] = [];
  },
}));

function renderClinicalForm() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
    },
  });

  return render(
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(ClinicalForm),
    ),
  );
}

function getContinueButton() {
  return screen.getByRole("button", { name: /continue/i });
}

describe("ClinicalForm", () => {
  beforeEach(() => {
    cleanup();
    useSessionStore.getState().reset();
    mockPush.mockClear();
    mockSubmitIntake.mockClear();
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("shows field errors and does not submit when Continue is clicked with empty form", async () => {
    const user = userEvent.setup();
    renderClinicalForm();

    await user.click(getContinueButton());

    await waitFor(() => {
      expect(screen.getByLabelText(/age \(years\)/i)).toHaveAttribute(
        "aria-invalid",
        "true",
      );
      expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
    });

    expect(document.getElementById("age_years-error")).toHaveTextContent(
      "Enter a number.",
    );
    expect(
      screen.queryByText(/expected number, received nan/i),
    ).not.toBeInTheDocument();

    expect(mockSubmitIntake).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("clears a field error as the user types after a failed submit", async () => {
    const user = userEvent.setup();
    renderClinicalForm();

    await user.click(getContinueButton());

    const ageInput = await screen.findByLabelText(/age \(years\)/i);
    expect(ageInput).toHaveAttribute("aria-invalid", "true");

    await user.type(ageInput, "35");

    await waitFor(() => {
      expect(ageInput).toHaveAttribute("aria-invalid", "false");
    });
  });
});
