import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { searchId, listIds } from '../../src/core/trace-engine/id-search.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-idsearch');
const FEAT_ID = 'FSREQ-20260211-AUTH-001';
const SPEC_DIR = join(TMP, 'specs', FEAT_ID);

function withCwd(dir: string, fn: () => void | number): void | number {
  const original = process.cwd;
  process.cwd = () => dir;
  try {
    return fn();
  } finally {
    process.cwd = original;
  }
}

const MATRIX_CONTENT = `| ID | Type | Title | Status | Upstream | Downstream |
|----|------|-------|--------|----------|------------|
| FR-AUTH-001 | FR | Login | Planned |  |  |
| FR-AUTH-002 | FR | Logout | Planned |  |  |
| DS-AUTH-001 | DS | Auth Design | Planned |  |  |
| TASK-AUTH-001 | TASK | Impl Login | Planned |  |  |
| TC-UT-AUTH-001 | TC | Unit Test | Planned |  |  |
| RFC-001 | RFC | Change scope | Planned |  |  |
`;

beforeEach(() => {
  mkdirSync(SPEC_DIR, { recursive: true });
  writeFileSync(join(SPEC_DIR, 'traceability-matrix.md'), MATRIX_CONTENT, 'utf-8');
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe('searchId', () => {
  it('should match by prefix "FR-AUTH"', () => {
    const results = searchId('FR-AUTH', FEAT_ID, TMP);
    expect(results).toHaveLength(2);
    expect(results.map(r => r.id)).toEqual(['FR-AUTH-001', 'FR-AUTH-002']);
  });

  it('should match by abbreviation "AUTH"', () => {
    const results = searchId('AUTH', FEAT_ID, TMP);
    expect(results.length).toBeGreaterThanOrEqual(5);
  });

  it('should filter by type', () => {
    const results = searchId('AUTH', FEAT_ID, TMP, 'FR');
    expect(results).toHaveLength(2);
    expect(results.every(r => r.type === 'FR')).toBe(true);
  });

  it('should return empty for no match', () => {
    const results = searchId('NONEXIST', FEAT_ID, TMP);
    expect(results).toEqual([]);
  });

  it('should return empty for empty query', () => {
    expect(searchId('', FEAT_ID, TMP)).toEqual([]);
  });

  it('should return empty when matrix missing', () => {
    expect(searchId('AUTH', 'FSREQ-20260211-NOPE-001', TMP)).toEqual([]);
  });
});

describe('listIds', () => {
  it('should list all IDs', () => {
    const results = listIds(FEAT_ID, TMP);
    expect(results).toHaveLength(6);
  });

  it('should filter by type', () => {
    const results = listIds(FEAT_ID, TMP, 'FR');
    expect(results).toHaveLength(2);
  });

  it('should return empty when matrix missing', () => {
    expect(listIds('FSREQ-20260211-NOPE-001', TMP)).toEqual([]);
  });
});


import { handleId } from '../../src/cli/commands/id.js';
import { vi } from 'vitest';

describe('id command feature resolution', () => {
  it('should resolve feature prefix for id list', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const code = withCwd(TMP, () => handleId(['list', '--feature', 'FSREQ-20260211-AUT']));
    expect(code).toBe(0);
    expect(log.mock.calls.some((call) => String(call[0]).includes('FR-AUTH-001'))).toBe(true);
    log.mockRestore();
  });

  it('should resolve feature prefix for id search', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const code = withCwd(TMP, () => handleId(['search', 'AUTH', '--feature', 'FSREQ-20260211-AUT']));
    expect(code).toBe(0);
    expect(log.mock.calls.some((call) => String(call[0]).includes('FR-AUTH-001'))).toBe(true);
    log.mockRestore();
  });
});
