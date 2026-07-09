"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PrototypeBanner } from "@/components/common/prototype-banner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { FigureImage } from "@/features/result/figure-image";
import { NextStepPanel } from "@/features/result/next-step-panel";
import { Reveal } from "@/features/result/reveal";
import { RiskBandTrack } from "@/features/result/risk-band-track";
import { useT } from "@/hooks/use-t";
import { usePrismaStore } from "@/store/prisma.store";

export function CxrResultScreen() {
  const t = useT();
  const result = usePrismaStore((state) => state.result);
  const image = usePrismaStore((state) => state.image);
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

  return (
    <div className="flex flex-col gap-5">
      <PrototypeBanner />

      <Reveal index={0}>
        {result.estimate ? (
          <div>
            <h1 className="font-heading text-2xl font-semibold capitalize">
              {t("cxr.result.bandTitle").replace("{band}", result.estimate.band)}
            </h1>
            <p className="mt-1 font-mono text-base tabular-nums text-ink-muted">
              {(result.estimate.probability * 100).toFixed(0)}% · {result.estimate.calibrationStatus} ·{" "}
              {result.metadata.modelVersion}
            </p>
          </div>
        ) : (
          <h1 className="font-heading text-2xl font-semibold">{t("cxr.result.unavailable")}</h1>
        )}
      </Reveal>

      {result.estimate && (
        <Reveal index={1}>
          <RiskBandTrack band={result.estimate.band} />
        </Reveal>
      )}

      <NextStepPanel title={t("result.nextStepTitle")} instruction={result.mandatoryNextStep} />

      <Reveal index={2}>
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
                <li className="font-mono">
                  {t("result.limitations.contract")} {result.metadata.contractVersion}
                </li>
                <li>
                  {t("result.limitations.cohort")} {result.metadata.cohort}
                </li>
                {result.metadata.limitations.map((limitation) => (
                  <li key={limitation}>{limitation}</li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Reveal>

      {imageUrl && (
        <Reveal index={3}>
          <figure className="flex flex-col gap-2">
            <FigureImage src={imageUrl} alt={t("cxr.result.figureAlt")} className="h-48" />
            <figcaption className="text-sm text-ink-muted">{t("cxr.result.figureCaption")}</figcaption>
          </figure>
        </Reveal>
      )}
    </div>
  );
}
