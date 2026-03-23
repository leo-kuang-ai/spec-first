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

const SAMPLE_LINKS = `version: 1
featureId: ${FEAT}
documents:
  - path: spec.md
    kind: spec
    stage: 01_specify
    references: []
  - path: design.md
    kind: design
    stage: 02_design
    references: [spec.md]
  - path: task_plan.md
    kind: task-plan
    stage: 03_plan
    references: [spec.md, design.md]
  - path: reports/test-report.md
    kind: report
    stage: 05_verify
    references: [spec.md, task_plan.md]
`;

function writeLinks(content: string) {
  mkdirSync(join(TMP, 'specs', FEAT, 'reports'), { recursive: true });
  writeFileSync(join(TMP, 'specs', FEAT, 'document-links.yaml'), content);
  writeFileSync(join(TMP, 'specs', FEAT, 'spec.md'), '# spec');
  writeFileSync(join(TMP, 'specs', FEAT, 'design.md'), '# design\nspec.md');
  writeFileSync(join(TMP, 'specs', FEAT, 'task_plan.md'), '# tasks\nspec.md\ndesign.md');
  writeFileSync(join(TMP, 'specs', FEAT, 'reports', 'test-report.md'), '# report\nspec.md\ntask_plan.md');
}

describe('analyzeImpact', () => {
  beforeEach(() => {
    mkdirSync(join(TMP, 'specs', FEAT), { recursive: true });
  });
  afterEach(() => {
    rmSync(TMP, { recursive: true, force: true });
  });
  it('should find direct impact from FR change', () => {
    writeLinks(SAMPLE_LINKS);
    const result = analyzeImpact(FEAT, ['spec.md'], TMP);
    expect(result.directImpact.length).toBeGreaterThan(0);
    const ids = result.directImpact.map((r) => r.path);
    expect(ids).toContain('design.md');
    expect(ids).toContain('task_plan.md');
  });
  it('should find indirect impact (2nd level)', () => {
    writeLinks(SAMPLE_LINKS);
    const result = analyzeImpact(FEAT, ['spec.md'], TMP);
    expect(result.allAffected).toContain('reports/test-report.md');
  });
  it('should return empty for unknown ID', () => {
    writeLinks(SAMPLE_LINKS);
    const result = analyzeImpact(FEAT, ['NONEXIST-001'], TMP);
    expect(result.directImpact).toHaveLength(0);
    expect(result.indirectImpact).toHaveLength(0);
  });
  it('should handle empty document links', () => {
    writeLinks(`version: 1\nfeatureId: ${FEAT}\ndocuments: []\n`);
    const result = analyzeImpact(FEAT, ['spec.md'], TMP);
    expect(result.allAffected).toEqual(['spec.md']);
  });
  it('should include summary string', () => {
    writeLinks(SAMPLE_LINKS);
    const result = analyzeImpact(FEAT, ['spec.md'], TMP);
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
    writeLinks(SAMPLE_LINKS);
    const result = syncBackfill(FEAT, ['reports/test-report.md'], 'Implemented', TMP);
    expect(result.updatedIds).toContain('reports/test-report.md');
    expect(result.skippedIds).toHaveLength(0);
  });
  it('should skip unknown IDs', () => {
    writeLinks(SAMPLE_LINKS);
    const result = syncBackfill(FEAT, ['NONEXIST-001'], 'Implemented', TMP);
    expect(result.skippedIds).toContain('NONEXIST-001');
    expect(result.updatedIds).toHaveLength(0);
  });
  it('should record known documents even when status repeats', () => {
    writeLinks(SAMPLE_LINKS);
    const result = syncBackfill(FEAT, ['reports/test-report.md'], 'Planned', TMP);
    expect(result.updatedIds).toContain('reports/test-report.md');
  });
  it('should write audit log to findings.md', () => {
    writeLinks(SAMPLE_LINKS);
    syncBackfill(FEAT, ['reports/test-report.md'], 'Implemented', TMP);
    const findings = readFileSync(join(TMP, 'specs', FEAT, 'findings.md'), 'utf-8');
    expect(findings).toContain('Backfill Sync');
    expect(findings).toContain('reports/test-report.md');
  });
  it('should handle multiple IDs', () => {
    writeLinks(SAMPLE_LINKS);
    const result = syncBackfill(FEAT, ['reports/test-report.md', 'design.md', 'NONEXIST'], 'Implemented', TMP);
    expect(result.updatedIds).toHaveLength(2);
    expect(result.skippedIds).toHaveLength(1);
    expect(result.auditLog).toHaveLength(3);
  });
});
