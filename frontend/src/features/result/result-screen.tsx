"use client";

import { type ReactNode } from "react";
import type { TriageResult } from "@/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconRefresh } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { PrototypeBanner } from "@/components/common/prototype-banner";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import { useT } from "@/hooks/use-t";
import { useSessionStore } from "@/store/session.store";
import { usePrismaStore } from "@/store/prisma.store";
import { AnalysisPanel } from "./analysis-panel";
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
 * hierarchy (design §8.1, §C2): prototype banner → band name → explained estimate
 * → named risk track → dominant next-step panel → analysis panel; evidence column
 * holds limitations + inspection. The banner and next-step panel render
 * unconditionally (not gated behind motion, §8.2). The flow ends with a CTA block
 * (new screening / home) so the page never dead-ends.
 */
export function ResultScreen() {
  const t = useT();
  const router = useRouter();
  const result = useSessionStore((state) => state.result) as TriageResult | null;
  const resetSession = useSessionStore((state) => state.reset);
  const resetPrisma = usePrismaStore((state) => state.reset);

  const startNewScreening = () => {
    resetSession();
    resetPrisma();
    router.push("/");
  };

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
          {/* 2. Band name + explained estimate — the one reveal (§8.2, §C2.2). */}
          <Reveal index={0}>
            {estimate ? (
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-ink text-balance">
                  {t(`result.band.${estimate.band}`)}
                </h1>
                {/* Percent stays a compact chip; a plain-language sentence sits
                    beside it so the number is never read as a personal risk. */}
                <div className="mt-2.5 flex items-start gap-3">
                  <Chip tone="solid" mono>
                    {(estimate.probability * 100).toFixed(0)}%
                  </Chip>
                  <p className="min-w-0 text-sm leading-relaxed text-ink-muted text-pretty">
                    {t("result.estimateMeaning.cough")}
                  </p>
                </div>
              </div>
            ) : (
              <h1 className="text-2xl font-semibold tracking-tight text-ink text-balance">
                {t("result.unavailable")}
              </h1>
            )}
          </Reveal>

          {/* 3. Named 3-segment risk track with how-to-read caption (§4.4, §C2.3). */}
          {estimate && (
            <Reveal index={1}>
              <RiskBandTrack
                band={estimate.band}
                probability={estimate.probability}
                caption={t("result.howToRead")}
              />
            </Reveal>
          )}

          {/* 4. Mandatory next step — dominant, immediate, unconditional (§8.2). */}
          <NextStepPanel title={t("result.nextStepTitle")} instruction={result.mandatoryNextStep} />

          {/* 5. Analysis panel — quiet, below the dominant next step (§C2.4). */}
          <Reveal index={2}>
            <AnalysisPanel
              title={t("result.analysis.title")}
              signal={{
                label: t("result.analysis.signalLabel"),
                value: t("result.analysis.signal.cough"),
              }}
              metadata={{
                cohort: { label: t("result.analysis.cohortLabel"), value: result.metadata.cohort },
                calibration: {
                  label: t("result.analysis.calibrationLabel"),
                  value: estimate ? estimate.calibrationStatus : "—",
                },
                description: t("result.analysis.body.cough"),
              }}
            />
          </Reveal>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          {/* 6. Open-by-default limitations / model details (absorbs model version
              + calibration status, §C2.2). */}
          <Reveal index={3}>
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
                      {t("result.limitations.model")}{" "}
                      <span className="font-mono">{result.metadata.modelVersion}</span>
                    </li>
                    <li>
                      {t("result.limitations.cohort")} {result.metadata.cohort}
                    </li>
                    {estimate && (
                      <li>
                        {t("result.limitations.calibration")} {estimate.calibrationStatus}
                      </li>
                    )}
                    {result.metadata.limitations.map((l) => (
                      <li key={l}>{l}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Reveal>

          {/* 7. Optional inspection figure — last (§8.1). */}
          {result.inspection?.available && (
            <Reveal index={4}>
              <SpectrogramFigure
                label={result.inspection.label}
                src={result.inspection.spectrogramUrl}
              />
            </Reveal>
          )}
        </div>
      </div>

      {/* 8. End-of-flow CTAs — the page never dead-ends (§C2). */}
      <Reveal index={5} className="border-t border-border-subtle pt-5">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            className="min-h-11 sm:min-w-44"
            onClick={() => router.push("/")}
          >
            {t("result.actions.home")}
          </Button>
          <Button className="min-h-11 sm:min-w-52" onClick={startNewScreening}>
            <IconRefresh data-icon="inline-start" aria-hidden="true" />
            {t("result.actions.newScreening")}
          </Button>
        </div>
      </Reveal>
    </div>
  );
}
