"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { makeQueryClient } from "@/lib/query-client";
import { AuthProvider } from "@/context/auth-context";
import { ErrorBoundary } from "@/components/common/error-boundary";
import { HtmlLang } from "@/components/layout/html-lang";

/**
 * Single client-side provider tree mounted in the root layout.
 * QueryClient instance is created once per browser session.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <HtmlLang />
        <ErrorBoundary>{children}</ErrorBoundary>
      </AuthProvider>
    </QueryClientProvider>
  );
}
