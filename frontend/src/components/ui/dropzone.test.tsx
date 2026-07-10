import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Dropzone } from "./dropzone";

afterEach(() => cleanup());

function getFileInput(container: HTMLElement) {
  const input = container.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) throw new Error("file input not found");
  return input;
}

describe("Dropzone", () => {
  it("calls onSelect with the chosen file when a file is picked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const { container } = render(
      <Dropzone
        id="cxr-image"
        accept="image/png,image/jpeg"
        file={null}
        onSelect={onSelect}
        onClear={vi.fn()}
      />,
    );

    const file = new File(["x"], "scan.png", { type: "image/png" });
    await user.upload(getFileInput(container), file);

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(file);
  });

  it("renders the selected file and calls onClear from the remove button", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    const file = new File(["hello world"], "chest.png", { type: "image/png" });
    render(
      <Dropzone
        id="cxr-image"
        accept="image/png,image/jpeg"
        file={file}
        onSelect={vi.fn()}
        onClear={onClear}
      />,
    );

    expect(screen.getByText("chest.png")).toBeInTheDocument();

    await user.click(screen.getByRole("button"));

    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("marks the input invalid when invalid is set", () => {
    const { container } = render(
      <Dropzone
        id="cxr-image"
        accept="image/png,image/jpeg"
        file={null}
        onSelect={vi.fn()}
        onClear={vi.fn()}
        invalid
        describedBy="cxr-image-error"
      />,
    );

    const input = getFileInput(container);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "cxr-image-error");
  });
});
