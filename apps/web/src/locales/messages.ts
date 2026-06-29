import en from "./en.json";
import id from "./id.json";
import type { Language } from "@/types";

/**
 * Keyed/versioned string bundles (design §10). EN is the source of truth shape;
 * ID must provide the same keys. Final paired strings are owned by UX-1.
 */
export const messages = { en, id } as const;

/** EN defines the canonical key shape. */
export type Messages = typeof en;

export function getMessages(language: Language): Messages {
  return messages[language] as Messages;
}
