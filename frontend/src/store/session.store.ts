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

interface CoughAttempt {
  index: number; // 1..5
  status: "empty" | "recording" | "captured" | "accepted" | "retryable";
}

interface SessionState {
  step: FlowStep;
  gateAcknowledgements: GateAcknowledgements;
  clinical: Partial<PatientIntakeRequest>;
  coughs: CoughAttempt[];
  coughFiles: Array<File | null>;
  submitState: SubmitState;
  result: TriageResult | null;
  requestId: string | null;

  // actions
  setStep: (step: FlowStep) => void;
  setGateAcknowledgement: (key: GateAcknowledgementKey, value: boolean) => void;
  setClinical: (values: Partial<PatientIntakeRequest>) => void;
  setCough: (index: number, file: File) => void;
  setSubmitState: (state: SubmitState) => void;
  setResult: (result: TriageResult | null) => void;
  reset: () => void;
}

const emptyCoughs: CoughAttempt[] = Array.from({ length: 5 }, (_, i) => ({
  index: i + 1,
  status: "empty",
}));

const initialState = {
  step: "gate" as FlowStep,
  gateAcknowledgements: { ...EMPTY_GATE_ACKNOWLEDGEMENTS },
  clinical: {} as Partial<PatientIntakeRequest>,
  coughs: emptyCoughs,
  coughFiles: Array.from({ length: 5 }, () => null) as Array<File | null>,
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
  setCough: (index, file) =>
    set((state) => ({
      coughFiles: state.coughFiles.map((current, currentIndex) =>
        currentIndex === index ? file : current,
      ),
      coughs: state.coughs.map((attempt, currentIndex) =>
        currentIndex === index ? { ...attempt, status: "captured" } : attempt,
      ),
    })),
  setSubmitState: (submitState) => set({ submitState }),
  setResult: (result) => set({ result }),
  reset: () =>
    set({
      ...initialState,
      gateAcknowledgements: { ...EMPTY_GATE_ACKNOWLEDGEMENTS },
      coughs: emptyCoughs.map((c) => ({ ...c })),
      coughFiles: Array.from({ length: 5 }, () => null),
    }),
}));
