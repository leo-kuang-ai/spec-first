import { describe, it, expect } from 'vitest';
import { normalizeStatus, getValidStatusList, isValidStatus } from '../../src/shared/status-mapper.js';

describe('status-mapper', () => {
  describe('normalizeStatus', () => {
    it('should map pending to Planned', () => {
      expect(normalizeStatus('pending')).toBe('Planned');
    });

    it('should map done to Accepted', () => {
      expect(normalizeStatus('done')).toBe('Accepted');
    });

    it('should map blocked to Deferred', () => {
      expect(normalizeStatus('blocked')).toBe('Deferred');
    });

    it('should map in_progress to Implemented', () => {
      expect(normalizeStatus('in_progress')).toBe('Implemented');
    });

    it('should handle empty string as Planned', () => {
      expect(normalizeStatus('')).toBe('Planned');
    });

    it('should accept exact case match', () => {
      expect(normalizeStatus('Planned')).toBe('Planned');
      expect(normalizeStatus('Implemented')).toBe('Implemented');
    });

    it('should handle case-insensitive match', () => {
      expect(normalizeStatus('planned')).toBe('Planned');
      expect(normalizeStatus('IMPLEMENTED')).toBe('Implemented');
    });

    it('should return null for unknown status', () => {
      expect(normalizeStatus('unknown-status')).toBeNull();
      expect(normalizeStatus('draft')).toBe('Planned'); // draft maps to Planned
    });
  });

  describe('isValidStatus', () => {
    it('should return true for valid aliases', () => {
      expect(isValidStatus('pending')).toBe(true);
      expect(isValidStatus('done')).toBe(true);
      expect(isValidStatus('blocked')).toBe(true);
    });

    it('should return false for invalid status', () => {
      expect(isValidStatus('unknown-status')).toBe(false);
    });
  });

  describe('getValidStatusList', () => {
    it('should return comma-separated list', () => {
      const list = getValidStatusList();
      expect(list).toContain('Planned');
      expect(list).toContain('Implemented');
      expect(list).toContain('Accepted');
    });
  });
});
