"use client";

import { useSessionStore } from "@/store/session.store";

/** Convenience hook over the in-memory session store. */
export function useSession() {
  return useSessionStore();
}
