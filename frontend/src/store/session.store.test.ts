import { beforeEach, describe, expect, it } from "vitest";
import { useSessionStore } from "./session.store";

describe("session store", () => {
  beforeEach(() => useSessionStore.getState().reset());

  it("keeps exactly five cough files in memory", () => {
    const file = new File(["audio"], "cough-1.webm", { type: "audio/webm" });
    useSessionStore.getState().setCough(0, file);

    expect(useSessionStore.getState().coughFiles[0]).toBe(file);
    expect(useSessionStore.getState().coughs[0].status).toBe("captured");
    expect(useSessionStore.getState().coughFiles).toHaveLength(5);
  });

  it("clears patient data, files, gate acknowledgements, and results on reset", () => {
    useSessionStore.getState().setGateAcknowledgement("adultWithCough", true);
    useSessionStore.getState().setClinical({ age_years: 42 });
    useSessionStore.getState().setCough(
      0,
      new File(["audio"], "cough-1.webm", { type: "audio/webm" }),
    );
    useSessionStore.getState().reset();

    expect(useSessionStore.getState().clinical).toEqual({});
    expect(useSessionStore.getState().gateAcknowledgements).toEqual({
      adultWithCough: false,
      confirmatoryEvaluation: false,
    });
    expect(useSessionStore.getState().coughFiles.every((file) => file === null)).toBe(true);
    expect(useSessionStore.getState().result).toBeNull();
  });
});
