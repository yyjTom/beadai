const BLOCKED_TERMS = [
  'nude',
  'naked',
  'nsfw',
  'porn',
  'sexual',
  'explicit',
  'erotic',
  'xxx',
  'gore',
  'blood',
  'violence',
  'kill',
  'weapon',
  'gun',
  'drugs',
  'cocaine',
  'heroin',
  'suicide',
  'self-harm',
  'child',
  'minor',
  'underage',
  'teen nude',
];

const ADVISORY_TERMS = ['disney', 'pixar', 'marvel', 'pokemon', 'nintendo', 'mario', 'harry potter'];

export type SafetyVerdict = { blocked: boolean; advisory: boolean };

/**
 * A narrow pre-check before spending an API call. It is intentionally basic and
 * is not marketed as reliable content or copyright moderation; the provider's
 * own safety response remains the authoritative second layer.
 */
export const checkPromptSafety = (prompt: string): SafetyVerdict => {
  const normalized = prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const blocked = BLOCKED_TERMS.some((term) => normalized.includes(term));
  const advisory = ADVISORY_TERMS.some((term) => normalized.includes(term));

  return { blocked, advisory };
};

export const MAX_PROMPT_LENGTH = 400;
export const MIN_PROMPT_LENGTH = 3;

export const normalizePrompt = (value: string): string => value.replace(/\s+/g, ' ').trim();
