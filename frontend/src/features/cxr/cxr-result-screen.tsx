"use client";

import Link from "next/link";
import { PrototypeBanner } from "@/components/common/prototype-banner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { NextStepPanel } from "@/features/result/next-step-panel";
import { RiskBandTrack } from "@/features/result/risk-band-track";
import { usePrismaStore } from "@/store/prisma.store";

export function CxrResultScreen() {
  const result = usePrismaStore((state) => state.result);
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
      <PrototypeBanner />
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
      {result.estimate && <RiskBandTrack band={result.estimate.band} />}
      <NextStepPanel instruction={result.mandatoryNextStep} />
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
    </div>
  );
}
