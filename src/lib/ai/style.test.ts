import { describe, expect, it } from 'vitest';
import { BEAD_STYLE_SUFFIX, buildStyledPrompt } from './style';

describe('buildStyledPrompt', () => {
  it('keeps what the user typed and appends the bead style terms', () => {
    const styled = buildStyledPrompt('a red mushroom');

    expect(styled.startsWith('a red mushroom')).toBe(true);
    expect(styled.endsWith(BEAD_STYLE_SUFFIX)).toBe(true);
  });

  it('constrains the palette so the chart stays buyable', () => {
    const styled = buildStyledPrompt('a cat').toLowerCase();

    expect(styled).toContain('at most 10 distinct colours');
    expect(styled).toContain('flat solid colours');
  });

  it('asks for a centred subject on a plain background', () => {
    const styled = buildStyledPrompt('a cat').toLowerCase();

    expect(styled).toContain('centred subject');
    expect(styled).toContain('plain solid background');
    expect(styled).toContain('no text');
  });
});
