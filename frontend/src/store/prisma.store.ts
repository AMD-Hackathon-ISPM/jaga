import { create } from "zustand";
import type { CxrResult, SubmitState } from "@/types";

interface PrismaState {
  image: File | null;
  result: CxrResult | null;
  submitState: SubmitState;
  setImage: (image: File | null) => void;
  setResult: (result: CxrResult | null) => void;
  setSubmitState: (submitState: SubmitState) => void;
  reset: () => void;
}

const initialState = {
  image: null,
  result: null,
  submitState: "idle" as SubmitState,
};

export const usePrismaStore = create<PrismaState>((set) => ({
  ...initialState,
  setImage: (image) => set({ image, result: null, submitState: "idle" }),
  setResult: (result) => set({ result }),
  setSubmitState: (submitState) => set({ submitState }),
  reset: () => set(initialState),
}));
