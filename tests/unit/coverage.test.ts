import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getCoverage } from '../../src/core/trace-engine/coverage.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-coverage');
const FEAT_ID = 'FSREQ-20260211-AUTH-001';
const SPEC_DIR = join(TMP, 'specs', FEAT_ID);

beforeEach(() => {
  mkdirSync(SPEC_DIR, { recursive: true });
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe('getCoverage', () => {
  it('should return 100% for empty matrix', () => {
    const c = getCoverage(FEAT_ID, TMP);
    expect(c.C3).toBe(1);
    expect(c.C6).toBe(1);
  });

  it('should calculate coverage for fully linked matrix', () => {
    writeFileSync(join(SPEC_DIR, 'traceability-matrix.md'), [
      '| ID | Type | Title | Status | Upstream | Downstream |',
      '|----|------|-------|--------|----------|------------|',
      '| FR-AUTH-001 | FR | Login | Planned |  | DS-AUTH-001, TASK-AUTH-001, TC-UT-AUTH-001 |',
      '| DS-AUTH-001 | DS | Design | Planned | FR-AUTH-001 |  |',
      '| TASK-AUTH-001 | TASK | Impl | Implemented | FR-AUTH-001 |  |',
      '| TC-UT-AUTH-001 | TC | Test | Planned | FR-AUTH-001 |  |',
      '',
    ].join('\n'), 'utf-8');

    const c = getCoverage(FEAT_ID, TMP);
    expect(c.C3).toBe(1); // FR covered by TASK
    expect(c.C4).toBe(1); // FR covered by TC
    expect(c.C6).toBe(1); // TASK implemented
    expect(c.C8).toBe(1); // TASK linked to FR
    expect(c.C9).toBe(1); // TC linked to FR
  });

  it('should calculate C3/C8 through DS upstream chain', () => {
    writeFileSync(join(SPEC_DIR, 'traceability-matrix.md'), [
      '| ID | Type | Title | Status | Upstream | Downstream |',
      '|----|------|-------|--------|----------|------------|',
      '| FR-AUTH-001 | FR | Login | Planned |  | DS-AUTH-001,TASK-AUTH-001 |',
      '| DS-AUTH-001 | DS | Design | Planned | FR-AUTH-001 | TASK-AUTH-001 |',
      '| TASK-AUTH-001 | TASK | Impl | Implemented | DS-AUTH-001 |  |',
      '',
    ].join('\n'), 'utf-8');

    const c = getCoverage(FEAT_ID, TMP);
    expect(c.C3).toBe(1); // TASK transitively linked to FR via DS
    expect(c.C8).toBe(1); // TASK has upstream FR/DS lineage
  });

  it('should detect uncovered FR', () => {
    writeFileSync(join(SPEC_DIR, 'traceability-matrix.md'), [
      '| ID | Type | Title | Status | Upstream | Downstream |',
      '|----|------|-------|--------|----------|------------|',
      '| FR-AUTH-001 | FR | Login | Planned |  |  |',
      '| FR-AUTH-002 | FR | Logout | Planned |  |  |',
      '| TASK-AUTH-001 | TASK | Impl | Planned | FR-AUTH-001 |  |',
      '',
    ].join('\n'), 'utf-8');

    const c = getCoverage(FEAT_ID, TMP);
    expect(c.C3).toBe(0.5); // 1/2 FR covered by TASK
  });

  it('should exclude Deferred/Cancelled from denominator', () => {
    writeFileSync(join(SPEC_DIR, 'traceability-matrix.md'), [
      '| ID | Type | Title | Status | Upstream | Downstream |',
      '|----|------|-------|--------|----------|------------|',
      '| FR-AUTH-001 | FR | Login | Planned |  |  |',
      '| FR-AUTH-002 | FR | Logout | Deferred |  |  |',
      '| TASK-AUTH-001 | TASK | Impl | Planned | FR-AUTH-001 |  |',
      '',
    ].join('\n'), 'utf-8');

    const c = getCoverage(FEAT_ID, TMP);
    // Only FR-AUTH-001 in denominator (FR-AUTH-002 excluded as Deferred)
    expect(c.C3).toBe(1);
  });

  it('should calculate C6 impl coverage correctly', () => {
    writeFileSync(join(SPEC_DIR, 'traceability-matrix.md'), [
      '| ID | Type | Title | Status | Upstream | Downstream |',
      '|----|------|-------|--------|----------|------------|',
      '| TASK-AUTH-001 | TASK | T1 | Implemented | FR-AUTH-001 |  |',
      '| TASK-AUTH-002 | TASK | T2 | Planned | FR-AUTH-001 |  |',
      '',
    ].join('\n'), 'utf-8');

    const c = getCoverage(FEAT_ID, TMP);
    expect(c.C6).toBe(0.5); // 1/2 TASK implemented
  });

  it('should exclude Exception from denominator only when linked RFC is approved and unexpired', () => {
    mkdirSync(join(SPEC_DIR, 'rfc'), { recursive: true });
    writeFileSync(
      join(SPEC_DIR, 'rfc', 'RFC-001.rfc.json'),
      JSON.stringify({ id: 'RFC-001', status: 'approved' }),
      'utf-8',
    );
    writeFileSync(
      join(SPEC_DIR, 'known-exceptions.md'),
      [
        '| ID | RFC | FR | Reason | ExpiresAt | RollbackPoint | ApprovedBy | ApprovedAt |',
        '|----|-----|-----|--------|-----------|---------------|------------|------------|',
        '| EX-001 | RFC-001 | FR-AUTH-001 | accepted risk | 2099-12-31T00:00:00Z | v1 | Leo | 2026-02-11 |',
        '',
      ].join('\n'),
      'utf-8',
    );
    writeFileSync(join(SPEC_DIR, 'traceability-matrix.md'), [
      '| ID | Type | Title | Status | Upstream | Downstream |',
      '|----|------|-------|--------|----------|------------|',
      '| FR-AUTH-001 | FR | Login | Exception |  |  |',
      '| FR-AUTH-002 | FR | Logout | Planned |  | TC-UT-AUTH-001 |',
      '| TC-UT-AUTH-001 | TC | Test | Planned | FR-AUTH-002 |  |',
      '',
    ].join('\n'), 'utf-8');

    const c = getCoverage(FEAT_ID, TMP);
    expect(c.C4).toBe(1); // 仅 FR-AUTH-002 计入分母
  });

  it('should keep invalid Exception in denominator', () => {
    mkdirSync(join(SPEC_DIR, 'rfc'), { recursive: true });
    writeFileSync(
      join(SPEC_DIR, 'rfc', 'RFC-001.rfc.json'),
      JSON.stringify({ id: 'RFC-001', status: 'draft' }),
      'utf-8',
    );
    writeFileSync(
      join(SPEC_DIR, 'known-exceptions.md'),
      [
        '| ID | RFC | FR | Reason | ExpiresAt | RollbackPoint | ApprovedBy | ApprovedAt |',
        '|----|-----|-----|--------|-----------|---------------|------------|------------|',
        '| EX-001 | RFC-001 | FR-AUTH-001 | accepted risk | 2099-12-31T00:00:00Z | v1 | Leo | 2026-02-11 |',
        '',
      ].join('\n'),
      'utf-8',
    );
    writeFileSync(join(SPEC_DIR, 'traceability-matrix.md'), [
      '| ID | Type | Title | Status | Upstream | Downstream |',
      '|----|------|-------|--------|----------|------------|',
      '| FR-AUTH-001 | FR | Login | Exception |  |  |',
      '| FR-AUTH-002 | FR | Logout | Planned |  |  |',
      '| TASK-AUTH-001 | TASK | Impl | Planned | FR-AUTH-002 |  |',
      '',
    ].join('\n'), 'utf-8');

    const c = getCoverage(FEAT_ID, TMP);
    expect(c.C3).toBe(0.5); // 无效 Exception 仍计入分母
  });
});
