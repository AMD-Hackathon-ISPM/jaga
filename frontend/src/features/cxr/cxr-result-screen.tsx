"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconRefresh, IconScan } from "@tabler/icons-react";
import { PrototypeBanner } from "@/components/common/prototype-banner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { FigureImage } from "@/features/result/figure-image";
import { NextStepPanel } from "@/features/result/next-step-panel";
import { Reveal } from "@/features/result/reveal";
import { RiskBandTrack } from "@/features/result/risk-band-track";
import { useT } from "@/hooks/use-t";
import { usePrismaStore } from "@/store/prisma.store";
import { useSessionStore } from "@/store/session.store";

export function CxrResultScreen() {
  const t = useT();
  const router = useRouter();
  const result = usePrismaStore((state) => state.result);
  const image = usePrismaStore((state) => state.image);
  const resetPrisma = usePrismaStore((state) => state.reset);
  const resetSession = useSessionStore((state) => state.reset);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!image) {
      setImageUrl(null);
      return;
    }
    const url = URL.createObjectURL(image);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

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
            <EmptyTitle>{t("cxr.empty.title")}</EmptyTitle>
            <EmptyDescription>{t("cxr.empty.description")}</EmptyDescription>
          </EmptyHeader>
        </Empty>
        <Button asChild>
          <Link href="/cxr">{t("cxr.empty.uploadCta")}</Link>
        </Button>
      </div>
    );
  }

  const estimate = result.estimate;
  const heatmapAvailable = Boolean(result.inspection?.available && result.inspection.gradcamUrl);

  return (
    <div className="flex flex-col gap-5">
      <PrototypeBanner />

      {/* Result summary and mandatory action form the first beat. */}
      <div className="grid grid-cols-1 gap-5 min-[840px]:grid-cols-[minmax(0,30rem)_minmax(0,1fr)] min-[840px]:items-start min-[840px]:gap-x-10">
        <div className="flex min-w-0 flex-col gap-5">
          <Reveal index={0}>
            <div className="flex flex-col gap-5">
              {estimate ? (
                <div>
                  <h1 className="font-heading text-2xl font-semibold capitalize">
                    {t("cxr.result.bandTitle").replace("{band}", estimate.band)}
                  </h1>
                  <div className="mt-2.5 flex items-start gap-3">
                    <span className="inline-flex items-center rounded-full bg-brand px-2.5 py-1 font-mono text-xs font-medium leading-none tabular-nums text-white">
                      {(estimate.probability * 100).toFixed(0)}%
                    </span>
                    <p className="min-w-0 text-sm leading-relaxed text-ink-muted text-pretty">
                      {t("cxr.result.estimateMeaning")}
                    </p>
                  </div>
                </div>
              ) : (
                <h1 className="font-heading text-2xl font-semibold">
                  {t("cxr.result.unavailable")}
                </h1>
              )}
              {estimate && <RiskBandTrack band={estimate.band} caption={t("result.howToRead")} />}
            </div>
          </Reveal>
        </div>

        <div className="min-w-0">
          <NextStepPanel title={t("result.nextStepTitle")} instruction={result.mandatoryNextStep} />
        </div>
      </div>

      {/* The imaging evidence pair gets the full result width. */}
      {imageUrl && (
        <figure className="flex w-full flex-col gap-3">
          <div className="grid grid-cols-1 gap-4 min-[640px]:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-2">
              <FigureImage
                src={imageUrl}
                alt={t("cxr.result.figureAlt")}
                className="aspect-[4/3] w-full"
              />
              <span className="text-sm text-ink-muted">{t("cxr.result.uploadedTileLabel")}</span>
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              {heatmapAvailable ? (
                <FigureImage
                  src={result.inspection!.gradcamUrl!}
                  alt={t("cxr.result.heatmapAlt")}
                  className="aspect-[4/3] w-full"
                />
              ) : (
                <div
                  role="img"
                  aria-label={t("cxr.result.gradcamUnavailable")}
                  className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-control border border-dashed border-border-subtle bg-surface-sunken px-4 text-center"
                >
                  <IconScan className="size-7 text-ink-muted" aria-hidden="true" />
                  <span className="max-w-48 text-sm text-ink-muted text-pretty">
                    {t("cxr.result.gradcamUnavailable")}
                  </span>
                </div>
              )}
              <span className="text-sm text-ink-muted">{t("cxr.result.heatmapTileLabel")}</span>
            </div>
          </div>
          <figcaption className="text-sm text-ink-muted">
            {t("cxr.result.figureCaption")}
          </figcaption>
        </figure>
      )}

      <Accordion
        type="single"
        collapsible
        className="rounded-control border border-border-subtle bg-card px-4"
      >
        <AccordionItem value="details">
          <AccordionTrigger className="font-heading text-base font-semibold text-ink">
            {t("cxr.result.limitationsTitle")}
          </AccordionTrigger>
          <AccordionContent>
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
              <dt className="text-ink-muted">{t("result.analysis.signalLabel")}</dt>
              <dd className="text-ink">{t("result.analysis.signal.cxr")}</dd>
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
