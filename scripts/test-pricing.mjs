/**
 * Simple pricing logic mirror for offline verification.
 * Keep in sync with src/lib/pricing.ts
 */

function calculateContribution(memberCount) {
  const count = Math.floor(Number(memberCount));
  if (!Number.isFinite(count) || count < 1) {
    throw new Error("Member count must be an integer of at least 1");
  }
  return count * 1000;
}

const cases = [
  [1, 1000],
  [2, 2000],
  [3, 3000],
  [4, 4000],
  [5, 5000],
  [6, 6000],
  [10, 10000],
];

for (const [members, expected] of cases) {
  const actual = calculateContribution(members);
  if (actual !== expected) {
    console.error(`FAIL members=${members}: expected ${expected}, got ${actual}`);
    process.exit(1);
  }
}

console.log("All pricing tests passed.");
