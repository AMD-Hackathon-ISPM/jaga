import { beforeEach, describe, expect, it } from "vitest";
import { type CoughRecording, useSessionStore } from "./session.store";

function makeRecording(): CoughRecording {
  return {
    file: new File(["audio"], "cough-session.webm", { type: "audio/webm" }),
    durationMs: 42_000,
    coughEvents: [1200, 4800, 9000],
  };
}

describe("session store", () => {
  beforeEach(() => useSessionStore.getState().reset());

  it("holds a single cough recording in memory", () => {
    const rec = makeRecording();
    useSessionStore.getState().setCoughRecording(rec);

    expect(useSessionStore.getState().coughRecording).toBe(rec);
    expect(useSessionStore.getState().coughRecording?.coughEvents).toEqual([1200, 4800, 9000]);
  });

  it("clears the cough recording when set to null", () => {
    useSessionStore.getState().setCoughRecording(makeRecording());
    useSessionStore.getState().setCoughRecording(null);
    expect(useSessionStore.getState().coughRecording).toBeNull();
  });

  it("clears patient data, recording, gate acknowledgements, and results on reset", () => {
    useSessionStore.getState().setGateAcknowledgement("adultWithCough", true);
    useSessionStore.getState().setClinical({ age_years: 42 });
    useSessionStore.getState().setCoughRecording(makeRecording());
    useSessionStore.getState().reset();

    expect(useSessionStore.getState().clinical).toEqual({});
    expect(useSessionStore.getState().gateAcknowledgements).toEqual({
      adultWithCough: false,
      confirmatoryEvaluation: false,
    });
    expect(useSessionStore.getState().coughRecording).toBeNull();
    expect(useSessionStore.getState().result).toBeNull();
  });
});
