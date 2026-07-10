import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import triageResult from "@/mocks/triage-result.mock.json";
import type { TriageResult } from "@/types";
import { usePrismaStore } from "@/store/prisma.store";
import { useSessionStore } from "@/store/session.store";
import { ResultScreen } from "./result-screen";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

beforeEach(() => {
  act(() => {
    useSessionStore.getState().reset();
    usePrismaStore.getState().reset();
    useSessionStore.setState({ result: triageResult as TriageResult });
  });
});

afterEach(() => {
  cleanup();
});

describe("ResultScreen", () => {
  it("uses the wide result composition from the content-driven tablet breakpoint", () => {
    const { container } = render(<ResultScreen />);

    const resultLayout = container.querySelector(".grid.grid-cols-1.gap-5");
    expect(resultLayout).toHaveClass("min-[840px]:grid-cols-[minmax(0,30rem)_minmax(0,1fr)]");
  });

  it("consolidates technical metadata in a collapsed disclosure", () => {
    render(<ResultScreen />);

    expect(
      screen.queryByRole("heading", { name: "What the model looked at" }),
    ).not.toBeInTheDocument();

    const detailsTrigger = screen.getByRole("button", { name: "About this estimate" });
    expect(detailsTrigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("mock-vX.Y")).not.toBeInTheDocument();

    fireEvent.click(detailsTrigger);

    expect(detailsTrigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Cough audio")).toBeVisible();
    expect(screen.getByText("mock-vX.Y")).toBeVisible();
    expect(screen.getByText("symptomatic adults 18+")).toBeVisible();
    expect(screen.getByText("calibrated (mock)")).toBeVisible();
  });

  it("transitions from a fixture result to the empty state without changing hook order", () => {
    render(<ResultScreen />);

    expect(
      screen.getByRole("heading", { name: "Intermediate model-estimated risk" }),
    ).toBeVisible();

    act(() => useSessionStore.getState().reset());

    expect(screen.getByText("No Gema result in this session")).toBeVisible();
    expect(
      screen.getByText("Submit the clinical inputs and a cough recording first."),
    ).toBeVisible();
  });
});
