"use client";

import { useSessionStore } from "@/store/session.store";
import { Badge } from "@/components/ui/badge";
import { Item, ItemContent, ItemGroup } from "@/components/ui/item";

/**
 * AttemptList — five rows showing per-attempt status. Status carries an icon
 * AND text (design §6); a retryable error targets a single row and preserves
 * accepted ones. Reads the in-memory session store (mock state).
 */
export function AttemptList() {
  const coughs = useSessionStore((s) => s.coughs);

  return (
    <ItemGroup className="gap-2">
      {coughs.map((c) => (
        <Item
          key={c.index}
          role="listitem"
          variant="outline"
          className="min-h-11 flex-nowrap bg-card"
        >
          <ItemContent className="font-mono tabular-nums">Cough {c.index}</ItemContent>
          <Badge
            variant={c.status === "accepted" ? "success" : c.status === "retryable" ? "error" : "neutral"}
          >
            {c.status}
          </Badge>
        </Item>
      ))}
    </ItemGroup>
  );
}
