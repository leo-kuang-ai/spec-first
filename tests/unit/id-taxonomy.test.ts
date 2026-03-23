import { describe, it, expect } from 'vitest';
import {
  ID_PATTERNS,
  ID_TYPES,
  NEXT_ID_TYPES,
  TC_LEVELS,
  VALID_ID_TYPES,
  VALID_NEXT_ID_TYPES,
  VALID_TC_LEVELS,
} from '../../src/core/trace-engine/id-taxonomy.js';

describe('id taxonomy', () => {
  it('should expose a single shared set of next-id types', () => {
    expect([...NEXT_ID_TYPES]).toEqual([...VALID_NEXT_ID_TYPES]);
  });

  it('should expose a single shared set of id types', () => {
    expect([...ID_TYPES]).toEqual([...VALID_ID_TYPES]);
  });

  it('should expose a single shared set of tc levels', () => {
    expect([...TC_LEVELS]).toEqual([...VALID_TC_LEVELS]);
  });

  it('should define id patterns from one place', () => {
    expect(ID_PATTERNS.map((item) => item.type)).toEqual([
      'Feature',
      'FR',
      'DS',
      'TASK',
      'REQ',
      'SYS',
      'ARCH',
      'MOD',
      'ATP',
      'STP',
      'ITP',
      'UTP',
      'TC',
      'RFC',
    ]);
  });
});
