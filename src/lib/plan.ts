// Grid size is not a paywall. Every plan can build up to 116 × 116 (13,456 beads
// on sixteen standard pegboards); the cap only exists to keep the browser alive
// when someone types a wild custom size.
export const MAX_GRID = 116;

/** Free generations per day before the paywall. Pro removes the limit. */
export const GUEST_DAILY_AI_LIMIT = 2;

export const PLAN_LABELS = {
  free: 'Free',
  pro: 'Pro',
} as const;
