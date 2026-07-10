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
import { RiskBandTrack } from "./risk-band-track";
import { NextStepPanel } from "./next-step-panel";
import { SpectrogramFigure } from "./spectrogram-figure";
import { CoughFocusFigure } from "./cough-focus-figure";
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
 * hierarchy (design §8.1): prototype banner → band + explained estimate → named
 * risk track → dominant next step → recording evidence → collapsed technical
 * details. The banner and next-step panel render unconditionally. The flow ends
 * with a CTA block so the page never dead-ends.
 */
export function ResultScreen() {
  const t = useT();
  const router = useRouter();
  const result = useSessionStore((state) => state.result) as TriageResult | null;
  const coughRecording = useSessionStore((state) => state.coughRecording);
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

      {/* Result-class pages use available tablet/desktop width from 840px. */}
      <div className="grid grid-cols-1 gap-5 min-[840px]:grid-cols-[minmax(0,30rem)_minmax(0,1fr)] min-[840px]:items-start min-[840px]:gap-x-10">
        <div className="flex min-w-0 flex-col gap-5">
          {/* Band, estimate, and risk track form the single result reveal. */}
          <Reveal index={0}>
            <div className="flex flex-col gap-5">
              {estimate ? (
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-ink text-balance">
                    {t(`result.band.${estimate.band}`)}
                  </h1>
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
              {estimate && <RiskBandTrack band={estimate.band} caption={t("result.howToRead")} />}
            </div>
          </Reveal>

          {/* Mandatory next step stays immediate and unconditional. */}
          <NextStepPanel title={t("result.nextStepTitle")} instruction={result.mandatoryNextStep} />
        </div>

        {/* Recording evidence is the secondary visual beat, before technical detail. */}
        <div className="flex min-w-0 flex-col gap-5">
          {coughRecording ? (
            <CoughFocusFigure recording={coughRecording} />
          ) : (
            result.inspection?.available && (
              <SpectrogramFigure
                label={result.inspection.label}
                src={result.inspection.spectrogramUrl}
              />
            )
          )}
        </div>
      </div>

      {/* Reviewer detail remains available without interrupting the primary flow. */}
      <Accordion
        type="single"
        collapsible
        className="rounded-control border border-border-subtle bg-card px-4"
      >
        <AccordionItem value="details">
          <AccordionTrigger className="font-heading text-base font-semibold text-ink">
            {t("result.limitationsTitle")}
          </AccordionTrigger>
          <AccordionContent>
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
              <dt className="text-ink-muted">{t("result.analysis.signalLabel")}</dt>
              <dd className="text-ink">{t("result.analysis.signal.cough")}</dd>
              <dt className="text-ink-muted">{t("result.analysis.cohortLabel")}</dt>
              <dd className="text-ink">{result.metadata.cohort}</dd>
              <dt className="text-ink-muted">{t("result.analysis.calibrationLabel")}</dt>
              <dd className="text-ink">{estimate ? estimate.calibrationStatus : "—"}</dd>
              <dt className="text-ink-muted">{t("result.limitations.model")}</dt>
              <dd className="font-mono text-ink">{result.metadata.modelVersion}</dd>
              <dt className="text-ink-muted">{t("result.limitations.contract")}</dt>
              <dd className="font-mono text-ink">{result.metadata.contractVersion}</dd>
            </dl>
            <ul className="mt-4 flex list-disc flex-col gap-1.5 border-t border-border-subtle pl-5 pt-4 text-sm text-ink-muted">
              {result.metadata.limitations.map((limitation) => (
                <li key={limitation}>{limitation}</li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* End-of-flow CTAs — the page never dead-ends. */}
      <div className="border-t border-border-subtle pt-5">
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
      </div>
    </div>
  );
}
