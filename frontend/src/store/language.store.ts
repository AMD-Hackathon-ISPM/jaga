import { create } from "zustand";
import type { Language } from "@/types";

/**
 * Language toggle (design §10). Default English; one tap to Bahasa Indonesia,
 * never loses step or values. Kept separate so it can be read anywhere without
 * subscribing to the whole session. In-memory only.
 */
interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
  toggle: () => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: "en",
  setLanguage: (language) => set({ language }),
  toggle: () => set((s) => ({ language: s.language === "en" ? "id" : "en" })),
}));
