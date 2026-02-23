/**
 * 核心流程 E2E 测试
 * init → advance 全流程 + Gate 校验 + 矩阵校验 + 覆盖率校验
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';
import { init } from '../../src/core/process-engine/init.js';
import { advance } from '../../src/core/process-engine/advance.js';
import { getFeatureState } from '../../src/core/process-engine/feature.js';
import { getCoverage } from '../../src/core/trace-engine/coverage.js';
import { evaluateGate } from '../../src/core/gate-engine/gate-evaluator.js';

const TMP = join(import.meta.dirname, '../fixtures/.tmp-e2e-core');

beforeEach(() => {
  mkdirSync(join(TMP, '.spec-first', 'layer2'), { recursive: true });
  mkdirSync(join(TMP, 'specs'), { recursive: true });
  // config.yaml with pilot_mode for smooth advance
  writeFileSync(join(TMP, '.spec-first', 'config.yaml'), yaml.dump({
    version: '1.0', project: 'e2e-test',
    gate: { pilot_mode: true },
    confirm_policy: 'assisted',
  }));
  // Layer 2 h5.yaml（E2E 需要）
  writeFileSync(join(TMP, '.spec-first', 'layer2', 'h5.yaml'), yaml.dump({
    platform: 'h5',
    gate_conditions: {
      '04_implement': [{ id: 'L2-H5-IMPL-001', description: 'ESLint check' }],
    },
    extra_deliverables: {
      '05_verify': [{ name: 'reports/lighthouse-report.md', required: true }],
    },
    quality_thresholds: {
      bundle_size_kb: { value: 500, direction: 'lower_is_better' },
    },
  }));
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

// ─── 阶段链定义 ──────────────────────────────────────────

const STAGE_CHAIN = [
  '00_init', '01_specify', '02_design', '03_plan',
  '04_implement', '05_verify', '06_wrap_up', '07_release', '08_done',
] as const;

// ─── 完整流程 E2E ────────────────────────────────────────

describe('Core Flow E2E', () => {
  let featureId: string;

  beforeEach(() => {
    const result = init({
      feat: 'AUTH', mode: 'N', size: 'M',
      platforms: ['h5'], projectRoot: TMP,
    });
    featureId = result.featureId;
  });

  it('should init feature with correct initial state', () => {
    const state = getFeatureState(featureId, TMP);
    expect(state.currentStage).toBe('00_init');
    expect(state.mode).toBe('N');
    expect(state.size).toBe('M');
    expect(state.platforms).toEqual(['h5']);
    // 目录和文件存在
    expect(existsSync(join(TMP, 'specs', featureId))).toBe(true);
    expect(existsSync(join(TMP, 'specs', featureId, 'stage-state.json'))).toBe(true);
  });

  it('should advance through all stages to 08_done', () => {
    // 从 00_init 推进到 08_done（共 8 步）
    for (let i = 0; i < STAGE_CHAIN.length - 1; i++) {
      const from = STAGE_CHAIN[i];
      const to = STAGE_CHAIN[i + 1];
      const result = advance(featureId, TMP, { force: true });
      expect(result.from).toBe(from);
      expect(result.to).toBe(to);
    }
    const finalState = getFeatureState(featureId, TMP);
    expect(finalState.currentStage).toBe('08_done');
    expect(finalState.terminal).toBe(true);
  });

  it('should record stage history for each advance', () => {
    // 推进 3 步
    advance(featureId, TMP, { force: true }); // 00→01
    advance(featureId, TMP, { force: true }); // 01→02
    advance(featureId, TMP, { force: true }); // 02→03
    const state = getFeatureState(featureId, TMP);
    expect(state.currentStage).toBe('03_plan');
    expect(state.history).toHaveLength(3);
    expect(state.history[0].from).toBe('00_init');
    expect(state.history[0].to).toBe('01_specify');
    expect(state.history[2].to).toBe('03_plan');
  });

  it('should evaluate gate at each stage', () => {
    const gateResult = evaluateGate(featureId, TMP);
    expect(gateResult.stage).toBe('00_init');
    expect(['PASS', 'PASS_WITH_WAIVER', 'FAIL']).toContain(gateResult.status);
    expect(gateResult.conditions.length).toBeGreaterThan(0);
  });

  it('should compute coverage metrics after init', () => {
    const cov = getCoverage(featureId, TMP);
    expect(cov).toBeDefined();
    expect(typeof cov.C1).toBe('number');
    expect(typeof cov.C6).toBe('number');
  });

  it('should write findings.md on force advance', () => {
    advance(featureId, TMP, { force: true });
    const findingsPath = join(TMP, 'specs', featureId, 'findings.md');
    expect(existsSync(findingsPath)).toBe(true);
    const content = readFileSync(findingsPath, 'utf-8');
    expect(content).toContain('FORCE_SKIPPED');
  });

  it('should write gate-history.jsonl on advance', () => {
    advance(featureId, TMP, { force: true });
    const histPath = join(TMP, 'specs', featureId, 'gate-history.jsonl');
    expect(existsSync(histPath)).toBe(true);
    const lines = readFileSync(histPath, 'utf-8').trim().split('\n');
    expect(lines.length).toBeGreaterThanOrEqual(1);
    const entry = JSON.parse(lines[0]);
    expect(entry.action).toBe('advance');
  });

  it('should reject advance from terminal stage', () => {
    // 推进到 08_done
    for (let i = 0; i < STAGE_CHAIN.length - 1; i++) {
      advance(featureId, TMP, { force: true });
    }
    expect(() => advance(featureId, TMP, { force: true }))
      .toThrow(/终态阶段/);
  });
});
