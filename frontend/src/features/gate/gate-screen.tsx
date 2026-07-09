"use client";

import { useRouter } from "next/navigation";
import { IconChevronRight } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { isGateComplete } from "@/features/gate/gate-utils";
import { useT } from "@/hooks/use-t";
import { config } from "@/lib/config";
import { useSessionStore } from "@/store/session.store";

/**
 * Gate (step 0) — PRD-01 eligibility and consent acknowledgements.
 * Checkboxes are never preselected; capture routes stay blocked until complete.
 */
export function GateScreen() {
  const t = useT();
  const router = useRouter();
  const acknowledgements = useSessionStore((state) => state.gateAcknowledgements);
  const setGateAcknowledgement = useSessionStore((state) => state.setGateAcknowledgement);
  const complete = isGateComplete(acknowledgements);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h1 className="font-sans text-xl font-semibold text-ink">{t("gate.title")}</h1>
        <p className="text-base text-ink-muted">{t("gate.lead")}</p>
      </div>

      <p
        role="note"
        className="rounded-control border border-border-subtle bg-warning-cream px-4 py-3 text-base italic text-ink"
      >
        {t("prototype.banner")}
      </p>

      <Card>
        <CardContent>
          <FieldGroup>
            <Field orientation="horizontal">
              <Checkbox
                id="gate-adult-with-cough"
                checked={acknowledgements.adultWithCough}
                onCheckedChange={(checked) =>
                  setGateAcknowledgement("adultWithCough", checked === true)
                }
              />
              <FieldLabel htmlFor="gate-adult-with-cough" className="min-h-11 text-base">
                {t("gate.acknowledgements.adultWithCough")}
              </FieldLabel>
            </Field>
            <Field orientation="horizontal">
              <Checkbox
                id="gate-confirmatory-evaluation"
                checked={acknowledgements.confirmatoryEvaluation}
                onCheckedChange={(checked) =>
                  setGateAcknowledgement("confirmatoryEvaluation", checked === true)
                }
              />
              <FieldLabel htmlFor="gate-confirmatory-evaluation" className="min-h-11 text-base">
                {t("gate.acknowledgements.confirmatoryEvaluation")}
              </FieldLabel>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 pt-1">
        {!complete && (
          <p className="text-base text-ink-muted" role="status">
            {t("gate.incompleteHint")}
          </p>
        )}
        <Button
          type="button"
          size="lg"
          className="w-full"
          disabled={!complete}
          onClick={() => router.push("/clinical")}
        >
          {t("common.continue")}
          <IconChevronRight data-icon="inline-end" aria-hidden="true" />
        </Button>
        {config.enablePrisma && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            disabled={!complete}
            onClick={() => router.push("/cxr")}
          >
            {t("gate.uploadCxr")}
          </Button>
        )}
      </div>
    </div>
  );
}
