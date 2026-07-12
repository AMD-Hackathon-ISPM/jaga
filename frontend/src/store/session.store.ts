import { create } from "zustand";
import {
  EMPTY_GATE_ACKNOWLEDGEMENTS,
  type GateAcknowledgementKey,
  type GateAcknowledgements,
} from "@/features/gate/gate-utils";
import type {
  FlowStep,
  PatientIntakeRequest,
  SubmitState,
  TriageResult,
} from "@/types";

/**
 * In-memory session store (Zustand).
 *
 * SAFETY: no `persist` middleware. Patient inputs, audio, and results must never
 * touch localStorage / IndexedDB / service-worker cache (project-architecture.md
 * §3.1, PRD-08). This store lives only in memory and is fully cleared on reset,
 * success acknowledgement, or session timeout.
 *
 * This satisfies both the design intent ("in-memory step machine") and the
 * request for a Zustand store.
 */

/** A single ≤90-second cough recording held only for the current session. */
export interface CoughRecording {
  file: File;
  durationMs: number;
}

interface SessionState {
  step: FlowStep;
  gateAcknowledgements: GateAcknowledgements;
  clinical: Partial<PatientIntakeRequest>;
  coughRecording: CoughRecording | null;
  submitState: SubmitState;
  result: TriageResult | null;
  requestId: string | null;

  // actions
  setStep: (step: FlowStep) => void;
  setGateAcknowledgement: (key: GateAcknowledgementKey, value: boolean) => void;
  setClinical: (values: Partial<PatientIntakeRequest>) => void;
  setCoughRecording: (rec: CoughRecording | null) => void;
  setSubmitState: (state: SubmitState) => void;
  setResult: (result: TriageResult | null) => void;
  reset: () => void;
}

const initialState = {
  step: "gate" as FlowStep,
  gateAcknowledgements: { ...EMPTY_GATE_ACKNOWLEDGEMENTS },
  clinical: {} as Partial<PatientIntakeRequest>,
  coughRecording: null as CoughRecording | null,
  submitState: "idle" as SubmitState,
  result: null as TriageResult | null,
  requestId: null as string | null,
};

export const useSessionStore = create<SessionState>((set) => ({
  ...initialState,
  setStep: (step) => set({ step }),
  setGateAcknowledgement: (key, value) =>
    set((state) => ({
      gateAcknowledgements: { ...state.gateAcknowledgements, [key]: value },
    })),
  setClinical: (values) => set((s) => ({ clinical: { ...s.clinical, ...values } })),
  setCoughRecording: (coughRecording) => set({ coughRecording }),
  setSubmitState: (submitState) => set({ submitState }),
  setResult: (result) => set({ result }),
  reset: () =>
    set({
      ...initialState,
      gateAcknowledgements: { ...EMPTY_GATE_ACKNOWLEDGEMENTS },
      clinical: {},
      coughRecording: null,
    }),
}));
