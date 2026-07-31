import { EVENT_CONFIG } from "./constants";

/**
 * Formats a sequential number into a readable registration ID.
 * Example: BNI-AFL-0001
 */
export function formatRegistrationId(
  sequence: number,
  prefix = EVENT_CONFIG.registrationPrefix
): string {
  if (!Number.isInteger(sequence) || sequence < 1) {
    throw new Error("Sequence must be a positive integer");
  }
  return `${prefix}-${String(sequence).padStart(4, "0")}`;
}

export function parseRegistrationSequence(
  registrationId: string,
  prefix = EVENT_CONFIG.registrationPrefix
): number | null {
  const pattern = new RegExp(`^${escapeRegExp(prefix)}-(\\d{4,})$`);
  const match = registrationId.match(pattern);
  if (!match) return null;
  return Number.parseInt(match[1], 10);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
