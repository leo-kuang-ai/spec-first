/**
 * 性能基准测试套件
 * SLA: validateId<10ms, getDocumentMetrics<50ms, evaluateGate<200ms, buildContext<500ms
 */
import { bench, describe, beforeAll, afterAll } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';
import { validateId } from '../../src/core/trace-engine/id-validator.js';
import { getDocumentMetrics } from '../../src/cli/commands/metrics.js';
import { evaluateGate } from '../../src/core/gate-engine/gate-evaluator.js';
import { buildContextPack } from '../../src/core/ai-orchestrator/context-pack.js';

const TMP = join(import.meta.dirname, '../fixtures/.tmp-bench');
const FEAT = 'FSREQ-20260211-BENCH-001';
const SPEC_DIR = join(TMP, 'specs', FEAT);

function setupFixtures(): void {
  mkdirSync(join(TMP, '.spec-first'), { recursive: true });
  mkdirSync(SPEC_DIR, { recursive: true });

  // stage-state.json — 00_init 阶段（Gate 条件最简单）
  writeFileSync(join(SPEC_DIR, 'stage-state.json'), JSON.stringify({
    featureId: FEAT, currentStage: '00_init',
    mode: 'N', size: 'M', platforms: ['h5'],
    history: [], createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  // 100 条文档关联记录
  const lines: string[] = ['version: 1', `featureId: ${FEAT}`, 'documents:'];
  for (let i = 1; i <= 100; i++) {
    const pad = String(i).padStart(3, '0');
    lines.push(`  - path: docs/doc-${pad}.md`);
    lines.push('    kind: note');
    lines.push('    stage: 01_specify');
    lines.push('    references: []');
  }
  writeFileSync(join(SPEC_DIR, 'document-links.yaml'), lines.join('\n'));

  // constitution.md
  writeFileSync(join(SPEC_DIR, 'constitution.md'), '# Constitution\nmode: N\nsize: M');

  // config.yaml
  writeFileSync(join(TMP, '.spec-first', 'config.yaml'), yaml.dump({
    version: '1.0', project: 'bench', confirm_policy: 'assisted',
  }));
}

beforeAll(() => setupFixtures());
afterAll(() => rmSync(TMP, { recursive: true, force: true }));

describe('Performance SLA', () => {
  bench('validateId — SLA < 10ms', () => {
    validateId('FR-BENCH-001');
  }, { time: 1000, warmupTime: 200 });

  bench('getDocumentMetrics — SLA < 50ms (100 docs)', () => {
    getDocumentMetrics(FEAT, TMP);
  }, { time: 1000, warmupTime: 200 });

  bench('evaluateGate — SLA < 200ms', () => {
    evaluateGate(FEAT, TMP);
  }, { time: 1000, warmupTime: 200 });

  bench('buildContextPack — SLA < 500ms', () => {
    buildContextPack(FEAT, TMP);
  }, { time: 1000, warmupTime: 200 });
});
