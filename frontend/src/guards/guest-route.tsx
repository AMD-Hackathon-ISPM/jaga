"use client";

import { useAuth } from "@/context/auth-context";

/**
 * GuestRoute — PLACEHOLDER guard. Inverse of ProtectedRoute: renders children
 * only when NOT authenticated. Scaffolding only; no redirects.
 */
export function GuestRoute({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { isAuthenticated } = useAuth();
  return <>{!isAuthenticated ? children : fallback}</>;
}
