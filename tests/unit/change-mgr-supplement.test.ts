/**
 * M4 ChangeMgr Supplement 单元测试
 * Impact Analysis + Reverse Sync Backfill
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { analyzeImpact } from '../../src/core/change-mgr/impact.js';
import { syncBackfill } from '../../src/core/change-mgr/sync.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-change-mgr-b');
const FEAT = 'FSREQ-20260211-AUTH-001';

const SAMPLE_MATRIX = `| ID | Type | Title | Status | Upstream | Downstream |
|----|------|-------|--------|----------|------------|
| ${FEAT} | Feature | Auth Module | Planned | | FR-AUTH-001, FR-AUTH-002 |
| FR-AUTH-001 | FR | Login | Planned | ${FEAT} | DS-AUTH-001, TC-UT-AUTH-001, TC-IT-AUTH-001 |
| FR-AUTH-002 | FR | Logout | Planned | ${FEAT} | DS-AUTH-002, TC-UT-AUTH-002, TC-IT-AUTH-002 |
| DS-AUTH-001 | DS | Login Design | Planned | FR-AUTH-001 | |
| DS-AUTH-002 | DS | Logout Design | Planned | FR-AUTH-002 | |
| TC-UT-AUTH-001 | TC | UT Login | Planned | FR-AUTH-001 | |
| TC-UT-AUTH-002 | TC | UT Logout | Planned | FR-AUTH-002 | |
| TC-IT-AUTH-001 | TC | IT Login | Planned | FR-AUTH-001 | |
| TC-IT-AUTH-002 | TC | IT Logout | Planned | FR-AUTH-002 | |
`;

function writeMatrix(content: string) {
  writeFileSync(join(TMP, 'specs', FEAT, 'traceability-matrix.md'), content);
}

describe('analyzeImpact', () => {
  beforeEach(() => {
    mkdirSync(join(TMP, 'specs', FEAT), { recursive: true });
  });
  afterEach(() => {
    rmSync(TMP, { recursive: true, force: true });
  });
  it('should find direct impact from FR change', () => {
    writeMatrix(SAMPLE_MATRIX);
    const result = analyzeImpact(FEAT, ['FR-AUTH-001'], TMP);
    expect(result.directImpact.length).toBeGreaterThan(0);
    const ids = result.directImpact.map(r => r.id);
    expect(ids).toContain('DS-AUTH-001');
    expect(ids).toContain('TC-UT-AUTH-001');
    expect(ids).toContain('TC-IT-AUTH-001');
  });
  it('should find indirect impact (2nd level)', () => {
    writeMatrix(SAMPLE_MATRIX);
    const result = analyzeImpact(FEAT, ['FR-AUTH-001'], TMP);
    // FR-AUTH-001 upstream is FEAT, FEAT downstream includes FR-AUTH-002
    expect(result.allAffected.length).toBeGreaterThan(4);
  });
  it('should return empty for unknown ID', () => {
    writeMatrix(SAMPLE_MATRIX);
    const result = analyzeImpact(FEAT, ['NONEXIST-001'], TMP);
    expect(result.directImpact).toHaveLength(0);
    expect(result.indirectImpact).toHaveLength(0);
  });
  it('should handle empty matrix', () => {
    writeMatrix('| ID | Type | Title | Status | Upstream | Downstream |\n|----|------|-------|--------|----------|------------|\n');
    const result = analyzeImpact(FEAT, ['FR-AUTH-001'], TMP);
    expect(result.allAffected).toEqual(['FR-AUTH-001']);
  });
  it('should include summary string', () => {
    writeMatrix(SAMPLE_MATRIX);
    const result = analyzeImpact(FEAT, ['FR-AUTH-001'], TMP);
    expect(result.summary).toContain('Changed: 1');
    expect(result.summary).toContain('Direct');
  });
});

// ─── Reverse Sync Backfill Tests ────────────────────────────────

describe('syncBackfill', () => {
  beforeEach(() => {
    mkdirSync(join(TMP, 'specs', FEAT), { recursive: true });
  });
  afterEach(() => {
    rmSync(TMP, { recursive: true, force: true });
  });
  it('should update matrix row status', () => {
    writeMatrix(SAMPLE_MATRIX);
    const result = syncBackfill(FEAT, ['TC-UT-AUTH-001'], 'Implemented', TMP);
    expect(result.updatedIds).toContain('TC-UT-AUTH-001');
    expect(result.skippedIds).toHaveLength(0);
  });
  it('should skip unknown IDs', () => {
    writeMatrix(SAMPLE_MATRIX);
    const result = syncBackfill(FEAT, ['NONEXIST-001'], 'Implemented', TMP);
    expect(result.skippedIds).toContain('NONEXIST-001');
    expect(result.updatedIds).toHaveLength(0);
  });
  it('should skip already-same-status IDs', () => {
    writeMatrix(SAMPLE_MATRIX);
    const result = syncBackfill(FEAT, ['TC-UT-AUTH-001'], 'Planned', TMP);
    expect(result.skippedIds).toContain('TC-UT-AUTH-001');
  });
  it('should write audit log to findings.md', () => {
    writeMatrix(SAMPLE_MATRIX);
    syncBackfill(FEAT, ['TC-UT-AUTH-001'], 'Implemented', TMP);
    const findings = readFileSync(join(TMP, 'specs', FEAT, 'findings.md'), 'utf-8');
    expect(findings).toContain('Backfill Sync');
    expect(findings).toContain('TC-UT-AUTH-001');
  });
  it('should handle multiple IDs', () => {
    writeMatrix(SAMPLE_MATRIX);
    const result = syncBackfill(FEAT, ['TC-UT-AUTH-001', 'TC-IT-AUTH-001', 'NONEXIST'], 'Implemented', TMP);
    expect(result.updatedIds).toHaveLength(2);
    expect(result.skippedIds).toHaveLength(1);
    expect(result.auditLog).toHaveLength(3);
  });
});
