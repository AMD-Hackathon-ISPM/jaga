import { create } from "zustand";

/**
 * MOCK auth store — scaffolding only.
 *
 * The triage MVP has no accounts. This exists solely to back the placeholder
 * AuthContext / route guards for a possible future operator gate. No tokens are
 * parsed, no session is fetched, nothing is persisted.
 */
interface MockUser {
  id: string;
  name: string;
  role: "operator" | "admin";
}

interface AuthState {
  user: MockUser | null;
  isAuthenticated: boolean;
  // Mock-only setters; real auth is intentionally not implemented.
  mockSignIn: (user: MockUser) => void;
  mockSignOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  mockSignIn: (user) => set({ user, isAuthenticated: true }),
  mockSignOut: () => set({ user: null, isAuthenticated: false }),
}));
