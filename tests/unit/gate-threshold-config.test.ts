import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { evaluateGate, getConditions } from '../../src/core/gate-engine/gate-evaluator.js';
import { getStageMetricTargets } from '../../src/core/metrics-engine/core-metric-thresholds.js';
import { Stage } from '../../src/shared/types.js';
import { resetConfigCache } from '../../src/shared/config-schema.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-gate-thresholds');
const FEAT = 'FEAT-THRESHOLD';

function writeStageState(stage: Stage): void {
  writeFileSync(
    join(TMP, 'specs', FEAT, 'stage-state.json'),
    JSON.stringify(
      {
        featureId: FEAT,
        mode: 'N',
        size: 'M',
        platforms: ['h5'],
        currentStage: stage,
        history: [],
        terminal: false,
        createdAt: '2026-03-14T00:00:00.000Z',
        updatedAt: '2026-03-14T00:00:00.000Z',
      },
      null,
      2
    ),
    'utf-8'
  );
}

function writeDocumentLinks(): void {
  writeFileSync(
    join(TMP, 'specs', FEAT, 'document-links.yaml'),
    `version: 1
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
    references: [task_plan.md]
  - path: reports/security-scan.md
    kind: report
    stage: 05_verify
    references: [task_plan.md]
`,
    'utf-8'
  );
}

function writeConfigYaml(content: string): void {
  writeFileSync(join(TMP, '.spec-first', 'meta', 'config.yaml'), content, 'utf-8');
}

describe('gate thresholds from config', () => {
  beforeEach(() => {
    mkdirSync(join(TMP, '.spec-first', 'meta'), { recursive: true });
    mkdirSync(join(TMP, 'specs', FEAT, 'reports'), { recursive: true });
    writeDocumentLinks();
    writeFileSync(join(TMP, 'specs', FEAT, 'spec.md'), '# spec', 'utf-8');
    writeFileSync(join(TMP, 'specs', FEAT, 'design.md'), '# design\nspec.md', 'utf-8');
    writeFileSync(join(TMP, 'specs', FEAT, 'task_plan.md'), '# tasks\nspec.md\ndesign.md', 'utf-8');
    resetConfigCache();
  });

  afterEach(() => {
    rmSync(TMP, { recursive: true, force: true });
    resetConfigCache();
    vi.restoreAllMocks();
  });

  it('should drive implement gate and stage targets from config.yaml', () => {
    writeConfigYaml(
      'gate:\n  thresholds:\n    G-IMPL-01:\n      value: 0.75\n      direction: higher_is_better\n'
    );
    writeStageState(Stage.IMPLEMENT);

    const failResult = evaluateGate(FEAT, TMP, { persist: false });
    const implFail = failResult.conditions.find((condition) => condition.id === 'G-IMPL-01');
    expect(implFail?.status).toBe('FAIL');
    expect(implFail?.detail).toContain('reports/test-report.md');

    writeFileSync(join(TMP, 'specs', FEAT, 'reports', 'test-report.md'), '# report', 'utf-8');
    writeFileSync(join(TMP, 'specs', FEAT, 'reports', 'security-scan.md'), '# security', 'utf-8');

    const passResult = evaluateGate(FEAT, TMP, { persist: false });
    const implPass = passResult.conditions.find((condition) => condition.id === 'G-IMPL-01');
    expect(implPass?.status).toBe('PASS');

    const targets = getStageMetricTargets(Stage.IMPLEMENT, TMP);
    expect(targets.find((target) => target.key === 'C4')?.target).toBe(0.75);

    const conditionDefs = getConditions(Stage.IMPLEMENT, undefined, undefined, TMP);
    expect(conditionDefs.find((condition) => condition.id === 'G-IMPL-01')?.description).toContain(
      'Declared documents exist on disk'
    );
  });

  it('should drive verify gate and docs from config truth source', () => {
    writeConfigYaml(
      [
        'gate:',
        '  thresholds:',
        '    G-VERIFY-01:',
        '      value: 0.95',
        '      direction: higher_is_better',
        '',
      ].join('\n')
    );
    writeStageState(Stage.VERIFY);

    const failResult = evaluateGate(FEAT, TMP, { persist: false });
    const verifyFail = failResult.conditions.find((condition) => condition.id === 'G-VERIFY-01');
    expect(verifyFail?.status).toBe('FAIL');
    expect(verifyFail?.detail).toContain('reports/test-report.md');

    const targets = getStageMetricTargets(Stage.VERIFY, TMP);
    expect(targets.find((target) => target.key === 'C4')?.target).toBe(0.95);

    const skillDoc = readFileSync(
      join(process.cwd(), 'skills', 'spec-first', '12-verify', 'SKILL.md'),
      'utf-8'
    );
    expect(skillDoc).toContain('读取 `.spec-first/meta/config.yaml` / `.spec-first/local/config.yaml`');
    expect(skillDoc).not.toContain('| G-IMPL-01 | Unit test coverage (C4) | ≥ 80% |');
    expect(skillDoc).not.toContain('| G-VERIFY-01 | Test coverage FR (C4) | = 100% |');
  });
});
