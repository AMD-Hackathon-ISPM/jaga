"use client";

import Link from "next/link";
import { CoughRecorder } from "./cough-recorder";
import { AttemptList } from "./attempt-list";
import { Button } from "@/components/ui/button";

/** Coughs (step 2) — PLACEHOLDER. Five guided attempts; no real capture wired. */
export function CoughsScreen() {
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-2xl font-semibold">Record five coughs</h1>
      <p className="text-ink-muted">
        One attempt at a time. Each can be replayed or replaced. Phone capture is not the same as a
        clinic recording.
      </p>
      <CoughRecorder attemptIndex={1} />
      <AttemptList />
      <Button asChild>
        <Link href="/review">Continue to review</Link>
      </Button>
    </div>
  );
}
