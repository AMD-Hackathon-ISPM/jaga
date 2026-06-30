"use client";

import type { TriageResult } from "@/types";
import mockResult from "@/mocks/triage-result.mock.json";
import { PrototypeBanner } from "@/components/common/prototype-banner";
import { useT } from "@/hooks/use-t";
import { RiskBandTrack } from "./risk-band-track";
import { NextStepPanel } from "./next-step-panel";
import { SpectrogramFigure } from "./spectrogram-figure";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/**
 * Result (step 5) — renders MOCK data only (no API). Follows the locked
 * hierarchy (design §8.1): prototype banner → band name + small inline estimate
 * → risk track → dominant next-step panel → limitations → optional inspection.
 * The banner and next-step panel render unconditionally.
 */
export function ResultScreen() {
  const t = useT();
  const result = mockResult as unknown as TriageResult;
  const estimate = result.estimate;

  return (
    <div className="flex flex-col gap-5">
      <PrototypeBanner />

      {estimate ? (
        <div>
          <h1 className="font-serif text-2xl font-semibold">{t(`result.band.${estimate.band}`)}</h1>
          {/* Estimate is a small inline line, never hero-scale (§8.2). */}
          <p className="mt-1 font-mono text-base tabular-nums text-ink-muted">
            {(estimate.probability * 100).toFixed(0)}% · {estimate.calibrationStatus} ·{" "}
            {result.metadata.modelVersion}
          </p>
        </div>
      ) : (
        <h1 className="font-serif text-2xl font-semibold">{t("result.unavailable")}</h1>
      )}

      {estimate && <RiskBandTrack band={estimate.band} />}

      <NextStepPanel instruction={result.mandatoryNextStep} />

      <Accordion
        type="single"
        collapsible
        defaultValue="limitations"
        className="rounded-control border border-border-subtle bg-card px-4"
      >
        <AccordionItem value="limitations">
          <AccordionTrigger>Limitations and model details</AccordionTrigger>
          <AccordionContent>
            <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-ink-muted">
              <li className="font-mono">contract {result.metadata.contractVersion}</li>
              <li>cohort: {result.metadata.cohort}</li>
              {result.metadata.limitations.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {result.inspection?.available && <SpectrogramFigure label={result.inspection.label} />}
    </div>
  );
}
