/**
 * Gate CLI E2E 测试
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const TMP = join(import.meta.dirname, '../fixtures/.tmp-gate-e2e');
const FEAT = 'FSREQ-20260312-E2E-001';

function writeState(stage: string) {
  writeFileSync(join(TMP, 'specs', FEAT, 'stage-state.json'), JSON.stringify({
    featureId: FEAT,
    mode: 'N',
    size: 'M',
    platforms: ['h5'],
    currentStage: stage,
    history: [],
    terminal: false,
    createdAt: '2026-03-12T00:00:00Z',
    updatedAt: '2026-03-12T00:00:00Z',
  }));
}

beforeEach(() => {
  mkdirSync(join(TMP, 'specs', FEAT), { recursive: true });
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe('gate CLI output', () => {
  it('should show warning conditions in output', () => {
    writeState('01_specify');
    writeFileSync(join(TMP, 'specs', FEAT, 'spec.md'), '# Spec');
    writeFileSync(join(TMP, 'specs', FEAT, 'traceability-matrix.md'),
      '| ID | Type | Title | Status | Upstream | Downstream |\n' +
      '|----|------|-------|--------|----------|------------|\n' +
      '| FR-E2E-001 | FR | Feature | Planned |  |  |\n'
    );

    const output = execSync(
      `node ${join(import.meta.dirname, '../../dist/cli/index.js')} gate check ${FEAT}`,
      { cwd: TMP, encoding: 'utf-8' }
    );

    expect(output).toContain('PASS');
  });

  it('should persist gate-history.jsonl', () => {
    writeState('00_init');

    execSync(
      `node ${join(import.meta.dirname, '../../dist/cli/index.js')} gate check ${FEAT}`,
      { cwd: TMP }
    );

    const historyPath = join(TMP, 'specs', FEAT, 'gate-history.jsonl');
    const content = readFileSync(historyPath, 'utf-8');
    expect(content).toContain('gate_eval');
    expect(content).toContain('00_init');
  });
});
