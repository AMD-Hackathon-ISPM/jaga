"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { CoughRecorder } from "./cough-recorder";
import { AttemptList } from "./attempt-list";
import { Button } from "@/components/ui/button";
import { useSessionStore } from "@/store/session.store";

export function CoughsScreen() {
  const router = useRouter();
  const coughFiles = useSessionStore((state) => state.coughFiles);
  const setCough = useSessionStore((state) => state.setCough);
  const firstEmptyIndex = coughFiles.findIndex((file) => file === null);
  const currentIndex = firstEmptyIndex === -1 ? 4 : firstEmptyIndex;
  const complete = coughFiles.every(Boolean);
  const onCaptured = useCallback((file: File) => setCough(currentIndex, file), [currentIndex, setCough]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-serif text-2xl font-semibold">Record five coughs</h1>
      <p className="text-ink-muted">
        One attempt at a time. Each can be replayed or replaced. Phone capture is not the same as a
        clinic recording.
      </p>
      <CoughRecorder attemptIndex={currentIndex + 1} onCaptured={onCaptured} />
      <AttemptList />
      <Button type="button" disabled={!complete} onClick={() => router.push("/review")}>
        Continue to review
      </Button>
    </div>
  );
}
