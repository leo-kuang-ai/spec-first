import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { evaluateGate, getConditions } from '../../src/core/gate-engine/gate-evaluator.js';
import { getStageMetricTargets } from '../../src/core/metrics-engine/core-metric-thresholds.js';
import { Stage } from '../../src/shared/types.js';
import { resetConfigCache } from '../../src/shared/config-schema.js';
import * as coverageModule from '../../src/core/trace-engine/coverage.js';

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

function writeMatrix(): void {
  writeFileSync(
    join(TMP, 'specs', FEAT, 'traceability-matrix.md'),
    [
      '| ID | Type | Title | Status | Upstream | Downstream |',
      '|----|------|-------|--------|----------|------------|',
      '| FR-AUTH-001 | FR | Login | Planned |  | TC-UT-AUTH-001 |',
      '| TC-UT-AUTH-001 | TC | Login test | Planned | FR-AUTH-001 |  |',
      '',
    ].join('\n'),
    'utf-8'
  );
}

function writeConfigYaml(content: string): void {
  writeFileSync(join(TMP, '.spec-first', 'meta', 'config.yaml'), content, 'utf-8');
}

describe('gate thresholds from config', () => {
  beforeEach(() => {
    mkdirSync(join(TMP, '.spec-first', 'meta'), { recursive: true });
    mkdirSync(join(TMP, 'specs', FEAT), { recursive: true });
    writeMatrix();
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

    const coverageSpy = vi.spyOn(coverageModule, 'getCoverage').mockReturnValue({
        C3: 1,
        C4: 0.74,
        C6: 1,
        C8: 1,
        C9: 1,
      } as any);

    const failResult = evaluateGate(FEAT, TMP, { persist: false });
    const implFail = failResult.conditions.find((condition) => condition.id === 'G-IMPL-01');
    expect(implFail?.status).toBe('FAIL');
    expect(implFail?.detail).toContain('target(>= 75%)');

    coverageSpy.mockReturnValue({
      C3: 1,
      C4: 0.75,
      C6: 1,
      C8: 1,
      C9: 1,
    } as any);

    const passResult = evaluateGate(FEAT, TMP, { persist: false });
    const implPass = passResult.conditions.find((condition) => condition.id === 'G-IMPL-01');
    expect(implPass?.status).toBe('PASS');

    const targets = getStageMetricTargets(Stage.IMPLEMENT, TMP);
    expect(targets.find((target) => target.key === 'C4')?.target).toBe(0.75);

    const conditionDefs = getConditions(Stage.IMPLEMENT, undefined, undefined, TMP);
    expect(conditionDefs.find((condition) => condition.id === 'G-IMPL-01')?.description).toContain(
      '>= 75%'
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

    vi.spyOn(coverageModule, 'getCoverage').mockReturnValue({
      C3: 1,
      C4: 0.94,
      C6: 1,
      C8: 1,
      C9: 1,
    } as any);

    const failResult = evaluateGate(FEAT, TMP, { persist: false });
    const verifyFail = failResult.conditions.find((condition) => condition.id === 'G-VERIFY-01');
    expect(verifyFail?.status).toBe('FAIL');
    expect(verifyFail?.detail).toContain('target(= 95%)');

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
