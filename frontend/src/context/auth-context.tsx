"use client";

import { createContext, useContext, useMemo } from "react";
import { useAuthStore } from "@/store/auth.store";

/**
 * AuthContext — PLACEHOLDER. Wraps the mock auth store so guards/components can
 * read auth state through a stable context. No JWT parsing, no login logic.
 * The MVP triage flow does not use this; it is future operator-gate scaffolding.
 */
interface AuthContextValue {
  user: ReturnType<typeof useAuthStore.getState>["user"];
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const value = useMemo(() => ({ user, isAuthenticated }), [user, isAuthenticated]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
