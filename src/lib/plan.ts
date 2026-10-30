// 29 × 29 is only 841 sample points, too coarse to read a subject. The free
// plan gets 58 × 58 (3,364 cells) so detail is usable without paying; 116 × 116
// stays Pro because it is a wall-sized build (13k+ beads).
export const FREE_MAX_GRID = 58;
export const PRO_MAX_GRID = 116;

export const GUEST_DAILY_AI_LIMIT = 3;

export const PLAN_LABELS = {
  free: 'Free',
  pro: 'Pro',
} as const;
