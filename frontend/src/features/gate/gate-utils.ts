export type GateAcknowledgementKey = "adultWithCough" | "confirmatoryEvaluation";

export interface GateAcknowledgements {
  adultWithCough: boolean;
  confirmatoryEvaluation: boolean;
}

export const EMPTY_GATE_ACKNOWLEDGEMENTS: GateAcknowledgements = {
  adultWithCough: false,
  confirmatoryEvaluation: false,
};

/** PRD-01: both acknowledgements must be checked before capture begins. */
export function isGateComplete(acks: GateAcknowledgements): boolean {
  return acks.adultWithCough && acks.confirmatoryEvaluation;
}
