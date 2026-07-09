import type { ComponentType, SVGProps } from "react";
import type { FlowStep } from "@/types/common";
import {
  IconFileText,
  IconSearch,
  IconShieldCheck,
  IconStethoscope,
  IconWaveSine,
} from "@tabler/icons-react";

type StepIconProps = SVGProps<SVGSVGElement>;

/**
 * Stepper glyphs from Tabler icons. Fill follows `currentColor` and can be
 * tinted per step state (teal / brand-soft / muted). Decorative only — the
 * visible label carries the accessible name.
 */
export const STEP_ICONS: Record<FlowStep, ComponentType<StepIconProps>> = {
  gate: IconShieldCheck,
  clinical: IconStethoscope,
  coughs: IconWaveSine,
  review: IconSearch,
  result: IconFileText,
};
