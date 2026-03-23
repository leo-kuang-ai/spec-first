/**
 * Gate CLI E2E 测试
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { handleGate } from '../../src/cli/commands/gate.js';

const TMP = join(import.meta.dirname, '../fixtures/.tmp-gate-e2e');
const FEAT = 'FSREQ-20260312-E2E-001';
const origCwd = process.cwd;

function writeState(stage: string) {
  writeFileSync(
    join(TMP, 'specs', FEAT, 'stage-state.json'),
    JSON.stringify({
      featureId: FEAT,
      mode: 'N',
      size: 'M',
      platforms: ['h5'],
      currentStage: stage,
      history: [],
      terminal: false,
      createdAt: '2026-03-12T00:00:00Z',
      updatedAt: '2026-03-12T00:00:00Z',
    })
  );
}

function writeDocumentLinks() {
  writeFileSync(
    join(TMP, 'specs', FEAT, 'document-links.yaml'),
    [
      'version: 1',
      `featureId: ${FEAT}`,
      'documents:',
      '  - path: spec.md',
      '    kind: requirements',
      '    stage: 01_specify',
      '    references: []',
      '',
    ].join('\n'),
    'utf-8'
  );
}

beforeEach(() => {
  mkdirSync(join(TMP, 'specs', FEAT), { recursive: true });
  writeDocumentLinks();
  process.cwd = () => TMP;
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
  process.cwd = origCwd;
});

describe('gate CLI output', () => {
  it('should show PASS when required docs exist', () => {
    writeState('01_specify');
    writeFileSync(join(TMP, 'specs', FEAT, 'spec.md'), '# Spec', 'utf-8');
    writeFileSync(join(TMP, 'specs', FEAT, 'prd.md'), '# PRD\n## 1. 业务目标\nTest', 'utf-8');
    mkdirSync(join(TMP, 'specs', FEAT, 'checklists'), { recursive: true });
    writeFileSync(
      join(TMP, 'specs', FEAT, 'checklists', 'spec-review.md'),
      '- [x] 完整性\n- [x] 清晰度\n- [x] 可测量\n- [x] 一致性\n- [x] 风险\n',
      'utf-8'
    );

    expect(handleGate(['check', FEAT])).toBe(0);
  });

  it('should persist gate-history.jsonl', () => {
    writeState('00_init');

    expect(handleGate(['check', FEAT])).toBe(0);

    const historyPath = join(TMP, 'specs', FEAT, 'gate-history.jsonl');
    const content = readFileSync(historyPath, 'utf-8');
    expect(content).toContain('gate_eval');
    expect(content).toContain('00_init');
  });
});
