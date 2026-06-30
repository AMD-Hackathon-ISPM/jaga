"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";

/**
 * Review (step 3) — PLACEHOLDER. Shows exactly what would be sent (clinical +
 * five accepted coughs) and a single submit. Submit must call the triage service
 * (which throws "API not connected yet") — wiring is intentionally omitted here.
 */
export function ReviewScreen() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-serif text-2xl font-semibold">Review and submit</h1>

      <Card>
        <CardHeader>
          <CardTitle>Clinical inputs</CardTitle>
        </CardHeader>
        <CardContent>
          <Empty className="border border-dashed border-input">
            <EmptyHeader>
              <EmptyTitle>Summary placeholder</EmptyTitle>
              <EmptyDescription>
                The exact clinical values that will be sent render here once entered.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cough attempts</CardTitle>
        </CardHeader>
        <CardContent className="text-ink-muted">Five accepted coughs summarize here.</CardContent>
      </Card>

      {/* Submit is disabled: the triage contract is not signed (ARCH-1). */}
      <Button disabled aria-disabled>
        Submit (API not connected)
      </Button>
      <div>
        <Button asChild variant="tertiary">
          <Link href="/result">Preview result (mock)</Link>
        </Button>
      </div>
    </div>
  );
}
