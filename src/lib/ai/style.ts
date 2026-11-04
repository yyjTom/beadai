/**
 * Every AI image is destined for a 50 × 50 bead grid, so the prompt is padded
 * with style terms that survive downsampling: flat fills, few distinct colours,
 * bold outlines and a plain background. Without them a photo-real render turns
 * into mud once 3,364 cells average it out, and the shopping list explodes into
 * dozens of near-identical shades.
 */
export const BEAD_STYLE_SUFFIX =
  ', pixel art bead pattern style, flat solid colours, at most 10 distinct colours, ' +
  'bold dark outlines, simple readable shapes, centred subject, plain solid background, ' +
  'high contrast, no gradients, no text, no watermark';

/**
 * Sent as `negative_prompt` where the model supports it. Kept separate from the
 * positive suffix so a provider that ignores negatives still gets a clean image.
 */
export const BEAD_NEGATIVE_PROMPT =
  'photograph, photorealistic, 3d render, gradient, soft shading, blur, noise, grain, ' +
  'fine detail, texture, text, watermark, signature, cluttered background, many colours';

export const buildStyledPrompt = (prompt: string): string => `${prompt}${BEAD_STYLE_SUFFIX}`;
