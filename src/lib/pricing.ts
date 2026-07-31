import { PRICING_RULES } from "./constants";

/**
 * Contribution amount based on member count.
 * Total = members × perPerson
 */
export function calculateContribution(memberCount: number): number {
  const count = Math.floor(Number(memberCount));
  if (!Number.isFinite(count) || count < 1) {
    throw new Error("Member count must be an integer of at least 1");
  }

  return count * PRICING_RULES.perPerson;
}

export function getPricingRuleLabel(memberCount: number): string {
  const count = Math.floor(Number(memberCount));
  return `${count} × ₹${PRICING_RULES.perPerson}`;
}

export function formatCurrency(amount: number, symbol = "₹"): string {
  return `${symbol}${amount.toLocaleString("en-IN")}`;
}
