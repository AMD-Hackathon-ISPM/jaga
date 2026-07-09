"use client";

import type { TriageResult } from "@/types";
import Link from "next/link";
import { PrototypeBanner } from "@/components/common/prototype-banner";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { useT } from "@/hooks/use-t";
import { useSessionStore } from "@/store/session.store";
import { RiskBandTrack } from "./risk-band-track";
import { NextStepPanel } from "./next-step-panel";
import { SpectrogramFigure } from "./spectrogram-figure";
import { Reveal } from "./reveal";
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
  const result = useSessionStore((state) => state.result) as TriageResult | null;
  if (!result) {
    return (
      <div className="flex flex-col gap-5">
        <PrototypeBanner />
        <Empty className="border border-dashed border-input">
          <EmptyHeader>
            <EmptyTitle>No Gema result in this session</EmptyTitle>
            <EmptyDescription>Submit the clinical inputs and five coughs first.</EmptyDescription>
          </EmptyHeader>
        </Empty>
        <Button asChild>
          <Link href="/review">Return to review</Link>
        </Button>
      </div>
    );
  }
  const estimate = result.estimate;

  return (
    <div className="flex flex-col gap-5">
      <Reveal index={0}>
        <PrototypeBanner />
      </Reveal>

      <Reveal index={1}>
        {estimate ? (
          <div>
            <h1 className="font-serif text-2xl font-semibold">
              {t(`result.band.${estimate.band}`)}
            </h1>
            {/* Estimate is a small inline line, never hero-scale (§8.2). */}
            <p className="mt-1 font-mono text-base tabular-nums text-ink-muted">
              {(estimate.probability * 100).toFixed(0)}% · {estimate.calibrationStatus} ·{" "}
              {result.metadata.modelVersion}
            </p>
          </div>
        ) : (
          <h1 className="font-serif text-2xl font-semibold">{t("result.unavailable")}</h1>
        )}
      </Reveal>

      {estimate && (
        <Reveal index={2}>
          <RiskBandTrack band={estimate.band} />
        </Reveal>
      )}

      <Reveal index={3}>
        <NextStepPanel instruction={result.mandatoryNextStep} />
      </Reveal>

      <Reveal index={4}>
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
      </Reveal>

      {result.inspection?.available && (
        <Reveal index={5}>
          <SpectrogramFigure
            label={result.inspection.label}
            src={result.inspection.spectrogramUrl}
          />
        </Reveal>
      )}
    </div>
  );
}
