"use client";

import { Fragment, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { IconChevronRight } from "@tabler/icons-react";
import { CoughRecorder } from "./cough-recorder";
import { AttemptList } from "./attempt-list";
import { Button } from "@/components/ui/button";
import { useT } from "@/hooks/use-t";
import { useSessionStore } from "@/store/session.store";

/** Splits a "*strong* text" template into <strong> and plain spans. */
function emphasize(template: string) {
  return template.split("*").map((chunk, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold text-ink">
        {chunk}
      </strong>
    ) : (
      <Fragment key={i}>{chunk}</Fragment>
    ),
  );
}

export function CoughsScreen() {
  const t = useT();
  const router = useRouter();
  const coughFiles = useSessionStore((state) => state.coughFiles);
  const setCough = useSessionStore((state) => state.setCough);

  // Which slot the recorder writes to: the requested replace slot if any, else
  // the first empty slot (falls back to the last once all five are recorded).
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);
  const firstEmptyIndex = coughFiles.findIndex((file) => file === null);
  const targetIndex = replaceIndex ?? (firstEmptyIndex === -1 ? 4 : firstEmptyIndex);
  const complete = coughFiles.every(Boolean);

  const onCaptured = useCallback(
    (file: File) => {
      setCough(targetIndex, file);
      setReplaceIndex(null);
    },
    [targetIndex, setCough],
  );

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-semibold text-ink">{t("coughs.title")}</h1>

      <ul className="flex list-disc flex-col gap-1 pl-5 text-ink-muted marker:text-ink">
        <li>{emphasize(t("coughs.bullets.attempt"))}</li>
        <li>{emphasize(t("coughs.bullets.replay"))}</li>
        <li>{emphasize(t("coughs.bullets.capture"))}</li>
      </ul>

      <CoughRecorder attemptIndex={targetIndex + 1} onCaptured={onCaptured} />

      <AttemptList onReplace={setReplaceIndex} />

      <div className="mt-2 flex flex-col gap-3">
        {!complete && (
          <p className="text-base text-ink-muted" role="status">
            {t("coughs.incompleteHint")}
          </p>
        )}
        <div className="flex gap-3">
        <Button
          type="button"
          variant="return"
          className="flex-1"
          onClick={() => router.push("/clinical")}
        >
          {t("coughs.return")}
        </Button>
        <Button
          type="button"
          className="flex-1"
          disabled={!complete}
          onClick={() => router.push("/review")}
        >
          <span>{t("coughs.continue")}</span>
          <IconChevronRight data-icon="inline-end" aria-hidden="true" />
        </Button>
        </div>
      </div>
    </div>
  );
}
