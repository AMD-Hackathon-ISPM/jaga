/**
 * Prisma digital-CXR result types — PROVISIONAL.
 *
 * `POST /api/v1/cxr` is a SEPARATE signal and is NOT signed yet (Daffa ARCH-1).
 * It is never fused with the Gema triage score (architecture §6, §12.1). These
 * shapes exist only so a future Prisma panel can compile against mock data.
 */
import type { RiskBand } from "./triage";

export interface CxrResult {
  requestId: string;
  /** Separate estimate with its own metrics; never merged with TriageResult. */
  estimate: {
    probability: number;
    band: RiskBand;
    calibrated: boolean;
  } | null;
  metadata: {
    modelVersion: string;
    contractVersion: string;
    limitations: string[];
  };
  inspection?: {
    gradcamUrl?: string;
    available: boolean;
    label: string;
  };
}
