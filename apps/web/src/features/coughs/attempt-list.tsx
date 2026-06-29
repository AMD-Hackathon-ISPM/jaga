"use client";

import { useSessionStore } from "@/store/session.store";
import { Badge } from "@/components/ui/badge";

/**
 * AttemptList — five rows showing per-attempt status. Status carries an icon
 * AND text (design §6); a retryable error targets a single row and preserves
 * accepted ones. Reads the in-memory session store (mock state).
 */
export function AttemptList() {
  const coughs = useSessionStore((s) => s.coughs);

  return (
    <ul className="space-y-2">
      {coughs.map((c) => (
        <li
          key={c.index}
          className="flex items-center justify-between rounded-control border border-border-subtle bg-surface px-3 py-2"
        >
          <span className="font-mono tabular-nums">Cough {c.index}</span>
          <Badge tone={c.status === "accepted" ? "success" : c.status === "retryable" ? "error" : "neutral"}>
            {c.status}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
