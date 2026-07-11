import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CxrResult } from "@/types";
import { usePrismaStore } from "@/store/prisma.store";
import { useSessionStore } from "@/store/session.store";
import { CxrResultScreen } from "./cxr-result-screen";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const result: CxrResult = {
  requestId: "synthetic-prisma-001",
  estimate: {
    probability: 0.31,
    band: "lower",
    calibrated: true,
    calibrationStatus: "calibrated synthetic fixture",
  },
  mandatoryNextStep:
    "This person should receive confirmatory TB evaluation regardless of this estimate.",
  metadata: {
    modelVersion: "synthetic-prisma-v1",
    contractVersion: "cxr-v1",
    cohort: "digital CXR research cohort",
    limitations: [
      "Synthetic fixture; not evidence of model performance.",
      "Digital CXR research estimate only; not a diagnosis.",
    ],
  },
  inspection: {
    available: false,
    label: "Model inspection; not a clinical explanation.",
  },
};

beforeEach(() => {
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: vi.fn(() => "blob:synthetic-cxr"),
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: vi.fn(),
  });

  act(() => {
    useSessionStore.getState().reset();
    usePrismaStore.getState().reset();
    usePrismaStore.setState({
      image: new File(["image"], "synthetic-cxr.png", { type: "image/png" }),
      result,
    });
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("CxrResultScreen", () => {
  it("consolidates Prisma metadata in a collapsed disclosure", () => {
    render(<CxrResultScreen />);

    expect(
      screen.queryByRole("heading", { name: "What the model looked at" }),
    ).not.toBeInTheDocument();

    const detailsTrigger = screen.getByRole("button", { name: "About this estimate" });
    expect(detailsTrigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("synthetic-prisma-v1")).not.toBeInTheDocument();

    fireEvent.click(detailsTrigger);

    expect(detailsTrigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Digital chest X-ray")).toBeVisible();
    expect(screen.getByText("synthetic-prisma-v1")).toBeVisible();
    expect(screen.getByText("digital CXR research cohort")).toBeVisible();
    expect(screen.getByText("calibrated synthetic fixture")).toBeVisible();
  });

  it("gives the side-by-side CXR evidence pair the full result width", async () => {
    const { container } = render(<CxrResultScreen />);

    await screen.findByRole("img", { name: "Uploaded chest X-ray" });

    const evidenceFigure = screen.getByText("Uploaded CXR").closest("figure");
    const evidenceGrid = evidenceFigure?.querySelector(".grid");

    expect(evidenceFigure).toHaveClass("w-full");
    expect(evidenceGrid).toHaveClass("grid-cols-1", "min-[640px]:grid-cols-2");
    expect(container.querySelectorAll(".aspect-\\[4\\/3\\]")).toHaveLength(2);
  });

  it("renders the Grad-CAM overlay when inspection is available", async () => {
    act(() => {
      usePrismaStore.setState({
        result: {
          ...result,
          inspection: {
            available: true,
            gradcamUrl: "data:image/png;base64,QUJD",
            label: "Model inspection; not a clinical explanation.",
          },
        },
      });
    });

    render(<CxrResultScreen />);

    const heatmap = await screen.findByRole("img", { name: "Model inspection heatmap" });
    expect(heatmap).toHaveAttribute("src", "data:image/png;base64,QUJD");
    expect(
      screen.queryByText("Model heatmap unavailable in this prototype"),
    ).not.toBeInTheDocument();
  });

  it("keeps the unavailable placeholder when inspection is not available", async () => {
    render(<CxrResultScreen />);

    await screen.findByRole("img", { name: "Uploaded chest X-ray" });
    expect(
      screen.getAllByText("Model heatmap unavailable in this prototype").length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByRole("img", { name: "Model inspection heatmap" }),
    ).not.toBeInTheDocument();
  });
});
