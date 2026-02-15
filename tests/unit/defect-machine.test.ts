import { describe, it, expect } from 'vitest';
import {
  assertDefectTransition,
  isDefectTerminal,
  getNextDefectStatuses,
  DefectTransitionError,
} from '../../src/core/change-mgr/defect-machine.js';
import type { DefectStatus } from '../../src/shared/types.js';

describe('缺陷状态机', () => {
  describe('合法转换', () => {
    const valid: [DefectStatus, DefectStatus][] = [
      ['open', 'fixing'],
      ['open', 'wontfix'],
      ['fixing', 'fixed'],
      ['fixing', 'open'],
      ['fixed', 'verified'],
      ['fixed', 'open'],
    ];
    it.each(valid)('%s → %s should pass', (from, to) => {
      expect(() => assertDefectTransition(from, to)).not.toThrow();
    });
  });

  describe('非法转换', () => {
    const invalid: [DefectStatus, DefectStatus][] = [
      ['open', 'verified'],
      ['open', 'fixed'],
      ['fixing', 'wontfix'],
      ['fixing', 'verified'],
      ['fixed', 'fixing'],
      ['fixed', 'wontfix'],
    ];
    it.each(invalid)('%s → %s should throw', (from, to) => {
      expect(() => assertDefectTransition(from, to)).toThrow(DefectTransitionError);
    });
  });

  describe('终态不可转换', () => {
    const terminal: [DefectStatus, DefectStatus][] = [
      ['verified', 'open'],
      ['verified', 'fixing'],
      ['wontfix', 'open'],
      ['wontfix', 'fixing'],
    ];
    it.each(terminal)('%s → %s should throw', (from, to) => {
      expect(() => assertDefectTransition(from, to)).toThrow(DefectTransitionError);
    });
  });

  it('isDefectTerminal', () => {
    expect(isDefectTerminal('verified')).toBe(true);
    expect(isDefectTerminal('wontfix')).toBe(true);
    expect(isDefectTerminal('open')).toBe(false);
    expect(isDefectTerminal('fixing')).toBe(false);
    expect(isDefectTerminal('fixed')).toBe(false);
  });

  it('getNextDefectStatuses', () => {
    expect(getNextDefectStatuses('open')).toEqual(expect.arrayContaining(['fixing', 'wontfix']));
    expect(getNextDefectStatuses('verified')).toEqual([]);
  });
});
