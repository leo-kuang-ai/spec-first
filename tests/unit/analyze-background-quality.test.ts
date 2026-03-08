import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { analyzeArtifacts } from '../../src/core/gate-engine/sca.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-analyze-background-quality');
const FEAT = 'FSREQ-20260308-AUTH-001';

function writeRequiredArtifacts() {
  writeFileSync(join(TMP, 'specs', FEAT, 'prd.md'), '# PRD\n', 'utf-8');
  writeFileSync(join(TMP, 'specs', FEAT, 'spec.md'), '# Spec\n', 'utf-8');
  writeFileSync(join(TMP, 'specs', FEAT, 'design.md'), '# Design\n', 'utf-8');
  writeFileSync(join(TMP, 'specs', FEAT, 'task_plan.md'), '# Task Plan\n', 'utf-8');
  writeFileSync(
    join(TMP, 'specs', FEAT, 'traceability-matrix.md'),
    '| ID | Type | Title | Status | Upstream | Downstream |\n' +
    '|----|------|-------|--------|----------|------------|\n' +
    '| FR-AUTH-001 | FR | Login | Planned | REQ-PRD-001 | DS-AUTH-001 |\n' +
    '| DS-AUTH-001 | DS | Flow | Planned | FR-AUTH-001 | TASK-AUTH-001 |\n' +
    '| TASK-AUTH-001 | TASK | Impl | Planned | DS-AUTH-001 | TC-AUTH-001 |\n',
    'utf-8',
  );
}

describe('analyzeArtifacts background quality', () => {
  beforeEach(() => {
    mkdirSync(join(TMP, 'specs', FEAT), { recursive: true });
    mkdirSync(join(TMP, '.spec-first', 'runtime', 'first'), { recursive: true });
    writeRequiredArtifacts();
  });

  afterEach(() => {
    rmSync(TMP, { recursive: true, force: true });
  });

  it('should flag degraded background input during verification stage', () => {
    writeFileSync(
      join(TMP, 'specs', FEAT, 'stage-state.json'),
      JSON.stringify({ currentStage: '05_verify', backgroundInputStatus: 'degraded' }),
      'utf-8',
    );

    const result = analyzeArtifacts(FEAT, TMP);

    expect(result.findings.some((finding) => finding.detail.includes('background_input_status=degraded'))).toBe(true);
  });

  it('should flag runtime/docs projection drift from first runtime index', () => {
    writeFileSync(
      join(TMP, '.spec-first', 'runtime', 'first', 'index.json'),
      JSON.stringify({
        version: '1.0.0',
        lastRun: '2026-03-08T12:00:00.000Z',
        mode: 'quick',
        summary: { path: '.spec-first/runtime/first/summary.json', fileHash: 'summary', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: true },
        roleViews: { path: '.spec-first/runtime/first/role-views.json', fileHash: 'roles', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: true },
        stageViews: { path: '.spec-first/runtime/first/stage-views.json', fileHash: 'stages', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: false, issues: ['hash mismatch'] },
        docsProjection: {
          'docs/first/README.md': { path: 'docs/first/README.md', fileHash: 'readme', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: false, issues: ['stale projection'] },
        },
        status: 'stale',
        staleReason: 'projection drift',
      }),
      'utf-8',
    );

    const result = analyzeArtifacts(FEAT, TMP);

    expect(result.findings.some((finding) => finding.detail.includes('docs 投影视图漂移'))).toBe(true);
    expect(result.findings.some((finding) => finding.detail.includes('stage-views'))).toBe(true);
  });
});
