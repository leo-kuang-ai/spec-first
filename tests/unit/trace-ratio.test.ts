import { describe, expect, it } from 'vitest';
import { pct } from '../../src/core/trace-engine/ratio.js';

describe('pct', () => {
  it('should return 100% when denominator is zero', () => {
    expect(pct(0, 0)).toBe(1);
    expect(pct(5, 0)).toBe(1);
  });

  it('should round to four decimals', () => {
    expect(pct(1, 3)).toBe(0.3333);
  });
});
