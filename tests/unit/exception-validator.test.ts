import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { validateExceptions } from '../../src/core/trace-engine/exception-validator.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-exception');
const FEAT_ID = 'FSREQ-20260211-AUTH-001';
const SPEC_DIR = join(TMP, 'specs', FEAT_ID);

beforeEach(() => {
  mkdirSync(SPEC_DIR, { recursive: true });
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

const FUTURE_DATE = '2099-12-31T00:00:00Z';
const PAST_DATE = '2020-01-01T00:00:00Z';

describe('validateExceptions', () => {
  it('should return empty for missing file', () => {
    const rfcMap = new Map<string, string>();
    const result = validateExceptions(FEAT_ID, TMP, rfcMap);
    expect(result.valid).toEqual([]);
    expect(result.invalid).toEqual([]);
  });

  it('should validate a valid exception', () => {
    writeExceptions([
      `| EX-001 | RFC-001 | FR-AUTH-001 | Deferred | ${FUTURE_DATE} | v1.0.0 | Leo | 2026-02-11 |`,
    ]);
    const rfcMap = new Map([['RFC-001', 'approved']]);
    const result = validateExceptions(FEAT_ID, TMP, rfcMap);
    expect(result.valid).toHaveLength(1);
    expect(result.invalid).toHaveLength(0);
  });

  it('should reject exception with unapproved RFC', () => {
    writeExceptions([
      `| EX-001 | RFC-001 | FR-AUTH-001 | Deferred | ${FUTURE_DATE} | v1.0.0 | Leo | 2026-02-11 |`,
    ]);
    const rfcMap = new Map([['RFC-001', 'draft']]);
    const result = validateExceptions(FEAT_ID, TMP, rfcMap);
    expect(result.invalid).toHaveLength(1);
    expect(result.invalid[0].reason).toContain('draft');
  });

  it('should reject exception with missing RFC', () => {
    writeExceptions([
      `| EX-001 | RFC-999 | FR-AUTH-001 | Deferred | ${FUTURE_DATE} | v1.0.0 | Leo | 2026-02-11 |`,
    ]);
    const rfcMap = new Map<string, string>();
    const result = validateExceptions(FEAT_ID, TMP, rfcMap);
    expect(result.invalid).toHaveLength(1);
    expect(result.invalid[0].reason).toContain('未找到');
  });

  it('should reject expired exception', () => {
    writeExceptions([
      `| EX-001 | RFC-001 | FR-AUTH-001 | Deferred | ${PAST_DATE} | v1.0.0 | Leo | 2026-02-11 |`,
    ]);
    const rfcMap = new Map([['RFC-001', 'approved']]);
    const result = validateExceptions(FEAT_ID, TMP, rfcMap);
    expect(result.invalid).toHaveLength(1);
    expect(result.invalid[0].reason).toContain('已过期');
  });
});

function writeExceptions(rows: string[]) {
  const header = '| ID | RFC | FR | Reason | ExpiresAt | RollbackPoint | ApprovedBy | ApprovedAt |\n'
    + '|----|-----|-----|--------|-----------|---------------|------------|------------|\n';
  writeFileSync(
    join(SPEC_DIR, 'known-exceptions.md'),
    header + rows.join('\n') + '\n',
    'utf-8',
  );
}
