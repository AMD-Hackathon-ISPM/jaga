import { beforeEach, describe, expect, it } from "vitest";
import { usePrismaStore } from "./prisma.store";

describe("prisma store", () => {
  beforeEach(() => usePrismaStore.getState().reset());

  it("keeps the selected image only in memory and clears it on reset", () => {
    const file = new File(["image"], "cxr.png", { type: "image/png" });
    usePrismaStore.getState().setImage(file);
    expect(usePrismaStore.getState().image).toBe(file);
    usePrismaStore.getState().reset();
    expect(usePrismaStore.getState().image).toBeNull();
  });
});
