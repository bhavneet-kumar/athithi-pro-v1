export const AI_CONSTANTS = {
  MAX_SCORE: 100,
} as const;

export const BUDGET_TIERS = [
  { threshold: 10_000, score: 100 }, // $10,000+ = 100
  { threshold: 7500, score: 85 },
  { threshold: 5000, score: 70 },
  { threshold: 2500, score: 50 },
  { threshold: 1000, score: 30 },
  { threshold: 0, score: 10 }, // Any budget = minimum score
];
