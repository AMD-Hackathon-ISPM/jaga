"use client";

import { useAuth } from "@/context/auth-context";

/**
 * ProtectedRoute — PLACEHOLDER guard. Renders children only when a mock session
 * is present, otherwise shows a fallback. NOT used by the public triage flow
 * (which is account-less). Scaffolding for a future operator/admin area only.
 * No redirects or token checks are implemented.
 */
export function ProtectedRoute({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { isAuthenticated } = useAuth();
  return <>{isAuthenticated ? children : fallback}</>;
}
