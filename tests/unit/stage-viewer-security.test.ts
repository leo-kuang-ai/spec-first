import { describe, it, expect } from 'vitest';
import { sanitizeFeatureId, escapeHtml, isValidFeatureId } from '../../scripts/stage-viewer/security-utils.js';

describe('sanitizeFeatureId', () => {
  describe('valid inputs', () => {
    it('should accept valid feature IDs', () => {
      expect(sanitizeFeatureId('FSREQ-2026-03-09-001')).toBe('FSREQ-2026-03-09-001');
      expect(sanitizeFeatureId('simple_id-123')).toBe('simple_id-123');
      expect(sanitizeFeatureId('FEATURE_ABC')).toBe('FEATURE_ABC');
      expect(sanitizeFeatureId('test-123')).toBe('test-123');
    });

    it('should handle URL-encoded valid IDs', () => {
      expect(sanitizeFeatureId('FSREQ-001')).toBe('FSREQ-001');
      expect(sanitizeFeatureId('test%5Fid')).toBe('test_id'); // %5F = underscore
    });
  });

  describe('path traversal attacks', () => {
    it('should reject path traversal attempts', () => {
      expect(sanitizeFeatureId('../etc/passwd')).toBeNull();
      expect(sanitizeFeatureId('..\\windows\\system32')).toBeNull();
      expect(sanitizeFeatureId('feature/../../../etc')).toBeNull();
      expect(sanitizeFeatureId('..%2F..%2Fetc')).toBeNull();
    });

    it('should reject IDs containing slashes', () => {
      expect(sanitizeFeatureId('feature/../../../etc')).toBeNull();
      expect(sanitizeFeatureId('path/to/feature')).toBeNull();
      expect(sanitizeFeatureId('a/b')).toBeNull();
    });

    it('should reject IDs containing backslashes', () => {
      expect(sanitizeFeatureId('feature\\..\\..\\etc')).toBeNull();
      expect(sanitizeFeatureId('path\\to\\feature')).toBeNull();
      expect(sanitizeFeatureId('a\\b')).toBeNull();
    });
  });

  describe('command injection attacks', () => {
    it('should reject special shell characters', () => {
      expect(sanitizeFeatureId('feature;rm -rf')).toBeNull();
      expect(sanitizeFeatureId('feature$(whoami)')).toBeNull();
      expect(sanitizeFeatureId('feature`id`')).toBeNull();
      expect(sanitizeFeatureId('feature|cat /etc/passwd')).toBeNull();
      expect(sanitizeFeatureId('feature&&ls')).toBeNull();
    });

    it('should reject pipe characters', () => {
      expect(sanitizeFeatureId('feature|command')).toBeNull();
      expect(sanitizeFeatureId('a|b')).toBeNull();
    });
  });

  describe('invalid inputs', () => {
    it('should reject null and undefined', () => {
      expect(sanitizeFeatureId(null)).toBeNull();
      expect(sanitizeFeatureId(undefined)).toBeNull();
    });

    it('should reject non-string types', () => {
      expect(sanitizeFeatureId(123 as unknown as string)).toBeNull();
      expect(sanitizeFeatureId({} as unknown as string)).toBeNull();
      expect(sanitizeFeatureId([] as unknown as string)).toBeNull();
    });

    it('should reject empty string', () => {
      expect(sanitizeFeatureId('')).toBeNull();
    });

    it('should reject strings with spaces', () => {
      expect(sanitizeFeatureId('feature id')).toBeNull();
      expect(sanitizeFeatureId(' feature')).toBeNull();
      expect(sanitizeFeatureId('feature ')).toBeNull();
    });
  });

  describe('URL encoding edge cases', () => {
    it('should reject double-encoded path traversal', () => {
      expect(sanitizeFeatureId('..%252F..%252Fetc')).toBeNull();
    });

    it('should handle invalid URL encoding gracefully', () => {
      // Invalid percent encoding should return null
      expect(sanitizeFeatureId('feature%ZZ')).toBeNull();
      expect(sanitizeFeatureId('%')).toBeNull();
    });
  });
});

describe('escapeHtml', () => {
  describe('XSS prevention', () => {
    it('should escape HTML tags', () => {
      expect(escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
      expect(escapeHtml('<img src=x onerror=alert(1)>')).toBe('&lt;img src=x onerror=alert(1)&gt;');
    });

    it('should escape quotes', () => {
      expect(escapeHtml('"onclick="alert(1)')).toBe('&quot;onclick=&quot;alert(1)');
      expect(escapeHtml("'<img src=x>")).toBe('&#039;&lt;img src=x&gt;');
    });

    it('should escape ampersand', () => {
      expect(escapeHtml('a & b')).toBe('a &amp; b');
      expect(escapeHtml('&&')).toBe('&amp;&amp;');
    });
  });

  describe('non-string inputs', () => {
    it('should handle null', () => {
      expect(escapeHtml(null)).toBe('');
    });

    it('should handle undefined', () => {
      expect(escapeHtml(undefined)).toBe('');
    });

    it('should handle numbers', () => {
      expect(escapeHtml(123)).toBe('123');
      expect(escapeHtml(0)).toBe('0');
    });

    it('should handle objects', () => {
      expect(escapeHtml({})).toBe('[object Object]');
    });
  });

  describe('normal strings', () => {
    it('should pass through safe strings unchanged', () => {
      expect(escapeHtml('Hello World')).toBe('Hello World');
      expect(escapeHtml('FSREQ-2026-03-09-001')).toBe('FSREQ-2026-03-09-001');
      expect(escapeHtml('任务标题')).toBe('任务标题');
    });
  });
});

describe('isValidFeatureId', () => {
  it('should return true for valid IDs', () => {
    expect(isValidFeatureId('FSREQ-001')).toBe(true);
    expect(isValidFeatureId('feature_123')).toBe(true);
    expect(isValidFeatureId('test-id')).toBe(true);
  });

  it('should return false for invalid IDs', () => {
    expect(isValidFeatureId('')).toBe(false);
    expect(isValidFeatureId('feature id')).toBe(false);
    expect(isValidFeatureId('feature/slash')).toBe(false);
    expect(isValidFeatureId('feature;cmd')).toBe(false);
  });

  it('should return false for non-string inputs', () => {
    expect(isValidFeatureId(null as unknown as string)).toBe(false);
    expect(isValidFeatureId(undefined as unknown as string)).toBe(false);
    expect(isValidFeatureId(123 as unknown as string)).toBe(false);
  });
});
