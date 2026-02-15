import { describe, it, expect } from 'vitest';
import { validateId } from '../../src/core/trace-engine/id-validator.js';

describe('validateId', () => {
  it('should validate Feature ID', () => {
    const r = validateId('FSREQ-20260211-AUTH-001');
    expect(r).toEqual({ valid: true, type: 'Feature' });
  });

  it('should validate FR ID', () => {
    expect(validateId('FR-AUTH-001')).toEqual({ valid: true, type: 'FR' });
    expect(validateId('FR-LOGIN2-099')).toEqual({ valid: true, type: 'FR' });
  });

  it('should validate DS ID', () => {
    expect(validateId('DS-AUTH-001')).toEqual({ valid: true, type: 'DS' });
  });

  it('should validate TASK ID', () => {
    expect(validateId('TASK-AUTH-001')).toEqual({ valid: true, type: 'TASK' });
  });

  it('should validate TC ID with level prefix', () => {
    expect(validateId('TC-UT-AUTH-001')).toEqual({ valid: true, type: 'TC' });
    expect(validateId('TC-IT-AUTH-002')).toEqual({ valid: true, type: 'TC' });
    expect(validateId('TC-E2E-AUTH-003')).toEqual({ valid: true, type: 'TC' });
    expect(validateId('TC-ST-AUTH-004')).toEqual({ valid: true, type: 'TC' });
  });

  it('should validate RFC ID', () => {
    expect(validateId('RFC-001')).toEqual({ valid: true, type: 'RFC' });
    expect(validateId('RFC-999')).toEqual({ valid: true, type: 'RFC' });
  });

  it('should reject empty/invalid input', () => {
    expect(validateId('')).toEqual({ valid: false, error: 'ID must be a non-empty string' });
  });

  it('should reject unknown format', () => {
    const r = validateId('UNKNOWN-001');
    expect(r.valid).toBe(false);
    expect(r.error).toContain('Unknown ID format');
  });

  it('should reject malformed IDs', () => {
    expect(validateId('FR-auth-001').valid).toBe(false);   // lowercase
    expect(validateId('FR-A-0001').valid).toBe(false);     // 4-digit seq
    expect(validateId('TC-XX-AUTH-001').valid).toBe(false); // invalid TC level
    expect(validateId('RFC-0001').valid).toBe(false);      // 4-digit RFC
    expect(validateId('FSREQ-2026021-AUTH-001').valid).toBe(false); // 7-digit date
  });

  it('should accept max-length abbreviation (16 chars)', () => {
    expect(validateId('FR-ABCDEFGHIJKLMNOP-001').valid).toBe(true);
  });

  it('should reject abbreviation exceeding 16 chars', () => {
    expect(validateId('FR-ABCDEFGHIJKLMNOPQ-001').valid).toBe(false);
  });
});
