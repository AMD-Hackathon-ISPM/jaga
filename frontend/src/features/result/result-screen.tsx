"use client";

import { type ReactNode } from "react";
import type { TriageResult } from "@/types";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PrototypeBanner } from "@/components/common/prototype-banner";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { cn } from "@/lib/utils";
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
 * hierarchy (design §8.1): prototype banner → band name + inline estimate chips
 * → risk track → dominant next-step panel → limitations → optional inspection.
 * The banner and next-step panel render unconditionally (not gated behind motion,
 * §8.2). Only the headline + estimate carry the one reveal.
 */

type ChipTone = "solid" | "soft" | "outline";

/** Metadata chip (Figma page 5). Teal-tint/soft/outline fills only — never the
 *  risk-band ramp, and never the risk meaning (§4.4). All combinations meet AA. */
function Chip({
  tone,
  mono,
  className,
  children,
}: {
  tone: ChipTone;
  mono?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const tones: Record<ChipTone, string> = {
    solid: "bg-brand text-white",
    soft: "bg-tint-brand-10 text-brand",
    outline: "border border-brand/40 bg-surface text-ink",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium leading-none",
        tones[tone],
        mono && "font-mono tabular-nums",
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * Result (step 5) — renders MOCK data only (no API). Follows the locked
 * hierarchy (design §8.1): prototype banner → band name + inline estimate chips
 * → risk track → dominant next-step panel → limitations → optional inspection.
 * The banner and next-step panel render unconditionally (not gated behind motion,
 * §8.2). Only the headline + estimate carry the one reveal.
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
            <EmptyTitle>{t("result.empty.title")}</EmptyTitle>
            <EmptyDescription>{t("result.empty.description")}</EmptyDescription>
          </EmptyHeader>
        </Empty>
        <Button asChild>
          <Link href="/review">{t("result.empty.returnToReview")}</Link>
        </Button>
      </div>
    );
  }

  const estimate = result.estimate;

  return (
    <div className="flex flex-col gap-5">
      {/* 1. Prototype banner — immediate, unconditional (§8.2). */}
      <PrototypeBanner />

      {/* Desktop (lg+): decision column left, evidence column right (§5.6).
          Below lg this grid collapses to the original single-column stack. */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,30rem)_minmax(0,1fr)] lg:items-start lg:gap-x-10">
        <div className="flex min-w-0 flex-col gap-5">
          {/* 2. Band name + inline estimate chips — the one reveal (§8.2). */}
          <Reveal index={0}>
            {estimate ? (
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-ink text-balance">
                  {t(`result.band.${estimate.band}`)}
                </h1>
                {/* Estimate is a compact chip row, never hero-scale (§8.2). */}
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <Chip tone="solid" mono>
                    {(estimate.probability * 100).toFixed(0)}%
                  </Chip>
                  <Chip tone="soft" className="capitalize">
                    {estimate.calibrationStatus}
                  </Chip>
                  <Chip tone="outline" mono>
                    {result.metadata.modelVersion}
                  </Chip>
                </div>
              </div>
            ) : (
              <h1 className="text-2xl font-semibold tracking-tight text-ink text-balance">
                {t("result.unavailable")}
              </h1>
            )}
          </Reveal>

          {/* 3. Named 3-segment risk track (§4.4). */}
          {estimate && (
            <Reveal index={1}>
              <RiskBandTrack band={estimate.band} probability={estimate.probability} />
            </Reveal>
          )}

          {/* 4. Mandatory next step — dominant, immediate, unconditional (§8.2). */}
          <NextStepPanel title={t("result.nextStepTitle")} instruction={result.mandatoryNextStep} />
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          {/* 5. Open-by-default limitations / model details. */}
          <Reveal index={2}>
            <Accordion
              type="single"
              collapsible
              defaultValue="limitations"
              className="rounded-control border border-border-subtle bg-card px-4"
            >
              <AccordionItem value="limitations">
                <AccordionTrigger className="font-heading text-base font-semibold text-ink">
                  {t("result.limitationsTitle")}
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="flex list-disc flex-col gap-1.5 pl-5 text-base text-ink-muted">
                    <li>
                      {t("result.limitations.contract")}{" "}
                      <span className="font-mono">{result.metadata.contractVersion}</span>
                    </li>
                    <li>
                      {t("result.limitations.cohort")} {result.metadata.cohort}
                    </li>
                    {result.metadata.limitations.map((l) => (
                      <li key={l}>{l}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Reveal>

          {/* 6. Optional inspection figure — last (§8.1). */}
          {result.inspection?.available && (
            <Reveal index={3}>
              <SpectrogramFigure
                label={result.inspection.label}
                src={result.inspection.spectrogramUrl}
              />
            </Reveal>
          )}
        </div>
      </div>
    </div>
  );
}
