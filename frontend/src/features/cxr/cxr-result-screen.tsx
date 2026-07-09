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
import { usePrismaStore } from "@/store/prisma.store";

export function CxrResultScreen() {
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
            <EmptyTitle>No Prisma result in this session</EmptyTitle>
            <EmptyDescription>Upload a digital CXR image first.</EmptyDescription>
          </EmptyHeader>
        </Empty>
        <Button asChild><Link href="/cxr">Upload CXR</Link></Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <Reveal index={0}>
        <PrototypeBanner />
      </Reveal>
      <Reveal index={1}>
        {result.estimate ? (
          <div>
            <h1 className="font-serif text-2xl font-semibold capitalize">{result.estimate.band} Prisma band</h1>
            <p className="mt-1 font-mono text-base tabular-nums text-ink-muted">
              {(result.estimate.probability * 100).toFixed(0)}% · {result.estimate.calibrationStatus} · {result.metadata.modelVersion}
            </p>
          </div>
        ) : (
          <h1 className="font-serif text-2xl font-semibold">Prisma estimate unavailable</h1>
        )}
      </Reveal>
      {result.estimate && (
        <Reveal index={2}>
          <RiskBandTrack band={result.estimate.band} />
        </Reveal>
      )}
      <Reveal index={3}>
        <NextStepPanel instruction={result.mandatoryNextStep} />
      </Reveal>
      <Reveal index={4}>
        <Accordion type="single" collapsible defaultValue="limitations" className="rounded-control border border-border-subtle bg-card px-4">
          <AccordionItem value="limitations">
            <AccordionTrigger>Limitations and model details</AccordionTrigger>
            <AccordionContent>
              <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-ink-muted">
                <li className="font-mono">contract {result.metadata.contractVersion}</li>
                <li>cohort: {result.metadata.cohort}</li>
                {result.metadata.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Reveal>
      {imageUrl && (
        <Reveal index={5}>
          <figure className="flex flex-col gap-2">
            <FigureImage src={imageUrl} alt="Uploaded chest X-ray" className="h-48" />
            <figcaption className="text-sm text-ink-muted">
              Uploaded chest X-ray. Shown for reference; not a clinical explanation.
            </figcaption>
          </figure>
        </Reveal>
      )}
    </div>
  );
}
