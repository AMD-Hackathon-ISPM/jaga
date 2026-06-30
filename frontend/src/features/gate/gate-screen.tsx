"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PrototypeBanner } from "@/components/common/prototype-banner";

/**
 * Gate (step 0) — PLACEHOLDER. Real version blocks Clinical until all
 * eligibility + consent acknowledgements are checked (PRD-01); acknowledgements
 * are never preselected. No logic wired here.
 */
export function GateScreen() {
  return (
    <div className="flex flex-col gap-4">
      <PrototypeBanner />
      <h1 className="font-serif text-2xl font-semibold">Before you begin</h1>
      <p className="text-ink-muted">
        For symptomatic adults aged 18 and over. This tool prioritizes follow-up urgency and does
        not decide whether a person receives testing.
      </p>
      <Card>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-ink-muted">
            Eligibility and consent acknowledgements will render here (placeholder). Each must be
            acknowledged explicitly before continuing.
          </p>
        </CardContent>
      </Card>
      <Button asChild>
        <Link href="/clinical">Continue</Link>
      </Button>
    </div>
  );
}
