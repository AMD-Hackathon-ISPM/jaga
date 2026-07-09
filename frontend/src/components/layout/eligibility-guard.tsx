"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isGateComplete } from "@/features/gate/gate-utils";
import { useSessionStore } from "@/store/session.store";

/**
 * Redirects to the gate when PRD-01 acknowledgements are incomplete.
 * Used on capture routes (clinical onward and Prisma CXR upload).
 */
export function EligibilityGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const acknowledgements = useSessionStore((state) => state.gateAcknowledgements);
  const complete = isGateComplete(acknowledgements);

  useEffect(() => {
    if (!complete) router.replace("/");
  }, [complete, router]);

  if (!complete) return null;

  return <>{children}</>;
}
