"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconRefresh, IconScan } from "@tabler/icons-react";
import { PrototypeBanner } from "@/components/common/prototype-banner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { AnalysisPanel } from "@/features/result/analysis-panel";
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

      {/* Desktop (lg+): decision column left, evidence column right (§5.6).
          Below lg this grid collapses to the original single-column stack. */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,30rem)_minmax(0,1fr)] lg:items-start lg:gap-x-10">
        <div className="flex min-w-0 flex-col gap-5">
          {/* Band name + explained estimate (§C2.2). The raw mono
              percent/calibration/model line is gone; calibration status and model
              version now live in the limitations accordion. */}
          <Reveal index={0}>
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
              <h1 className="font-heading text-2xl font-semibold">{t("cxr.result.unavailable")}</h1>
            )}
          </Reveal>

          {estimate && (
            <Reveal index={1}>
              <RiskBandTrack band={estimate.band} probability={estimate.probability} caption={t("result.howToRead")} />
            </Reveal>
          )}

          <NextStepPanel title={t("result.nextStepTitle")} instruction={result.mandatoryNextStep} />

          {/* Analysis panel — quiet, below the dominant next step (§C2.4). */}
          <Reveal index={2}>
            <AnalysisPanel
              title={t("result.analysis.title")}
              signal={{
                label: t("result.analysis.signalLabel"),
                value: t("result.analysis.signal.cxr"),
              }}
              metadata={{
                cohort: { label: t("result.analysis.cohortLabel"), value: result.metadata.cohort },
                calibration: {
                  label: t("result.analysis.calibrationLabel"),
                  value: estimate ? estimate.calibrationStatus : "—",
                },
                description: t("result.analysis.body.cxr"),
              }}
            />
          </Reveal>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <Reveal index={3}>
            <Accordion
              type="single"
              collapsible
              defaultValue="limitations"
              className="rounded-control border border-border-subtle bg-card px-4"
            >
              <AccordionItem value="limitations">
                <AccordionTrigger className="font-heading text-base font-semibold text-ink">
                  {t("cxr.result.limitationsTitle")}
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
                    {result.metadata.limitations.map((limitation) => (
                      <li key={limitation}>{limitation}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Reveal>

          {/* Evidence pair (§C2): uploaded CXR + Grad-CAM slot. When no heatmap is
              available (always true in the prototype fixtures) the right tile is a
              labelled dashed placeholder. */}
          {imageUrl && (
            <Reveal index={4}>
              <figure className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <FigureImage
                      src={imageUrl}
                      alt={t("cxr.result.figureAlt")}
                      className="h-56 lg:h-80"
                    />
                    <span className="text-xs text-ink-muted">{t("cxr.result.uploadedTileLabel")}</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {heatmapAvailable ? (
                      <FigureImage
                        src={result.inspection!.gradcamUrl!}
                        alt={t("cxr.result.heatmapAlt")}
                        className="h-56 lg:h-80"
                      />
                    ) : (
                      <div
                        role="img"
                        aria-label={t("cxr.result.gradcamUnavailable")}
                        className="flex h-56 flex-col items-center justify-center gap-2 rounded-control border border-dashed border-border-subtle bg-surface-sunken px-3 text-center lg:h-80"
                      >
                        <IconScan className="size-6 text-ink-muted" aria-hidden="true" />
                        <span className="text-xs text-ink-muted text-pretty">
                          {t("cxr.result.gradcamUnavailable")}
                        </span>
                      </div>
                    )}
                    <span className="text-xs text-ink-muted">{t("cxr.result.heatmapTileLabel")}</span>
                  </div>
                </div>
                <figcaption className="text-sm text-ink-muted">{t("cxr.result.figureCaption")}</figcaption>
              </figure>
            </Reveal>
          )}
        </div>
      </div>

      {/* End-of-flow CTAs — the page never dead-ends (§C2). */}
      <Reveal index={5} className="border-t border-border-subtle pt-5">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" className="min-h-11 sm:min-w-44" onClick={() => router.push("/")}>
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
