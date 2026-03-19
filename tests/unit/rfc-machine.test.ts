import { describe, it, expect } from 'vitest';
import {
  assertRfcTransition,
  isRfcTerminal,
  getNextRfcStatuses,
  RfcTransitionError,
} from '../../src/core/change-mgr/rfc-machine.js';
import type { RfcStatus } from '../../src/shared/types.js';

describe('RFC 状态机', () => {
  describe('合法转换', () => {
    const valid: [RfcStatus, RfcStatus][] = [
      ['draft', 'approved'],
      ['draft', 'rejected'],
      ['approved', 'closed'],
      ['approved', 'rejected'],
    ];
    it.each(valid)('%s → %s should pass', (from, to) => {
      expect(() => assertRfcTransition(from, to)).not.toThrow();
    });
  });

  describe('非法转换', () => {
    const invalid: [RfcStatus, RfcStatus][] = [
      ['draft', 'closed'],
      ['draft', 'draft'],
      ['approved', 'draft'],
      ['approved', 'approved'],
    ];
    it.each(invalid)('%s → %s should throw', (from, to) => {
      expect(() => assertRfcTransition(from, to)).toThrow(RfcTransitionError);
    });
  });

  describe('终态不可转换', () => {
    const terminal: [RfcStatus, RfcStatus][] = [
      ['rejected', 'draft'],
      ['rejected', 'approved'],
      ['closed', 'draft'],
      ['closed', 'approved'],
    ];
    it.each(terminal)('%s → %s should throw', (from, to) => {
      expect(() => assertRfcTransition(from, to)).toThrow(RfcTransitionError);
    });
  });

  it('isRfcTerminal', () => {
    expect(isRfcTerminal('rejected')).toBe(true);
    expect(isRfcTerminal('closed')).toBe(true);
    expect(isRfcTerminal('draft')).toBe(false);
    expect(isRfcTerminal('approved')).toBe(false);
  });

  it('getNextRfcStatuses', () => {
    expect(getNextRfcStatuses('draft')).toEqual(expect.arrayContaining(['approved', 'rejected']));
    expect(getNextRfcStatuses('rejected')).toEqual([]);
    expect(getNextRfcStatuses('closed')).toEqual([]);
  });
});
