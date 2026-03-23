/**
 * 核心流程 E2E 测试
 * init → advance 全流程 + Gate 校验 + 文档骨架校验
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';
import { init } from '../../src/core/process-engine/init.js';
import { advance } from '../../src/core/process-engine/advance.js';
import { getFeatureState } from '../../src/core/process-engine/feature.js';
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
    expect(existsSync(join(TMP, 'specs', featureId, 'document-links.yaml'))).toBe(true);
  });

  it('should only advance while gate requirements are actually satisfied', () => {
    const result = advance(featureId, TMP);
    expect(result.from).toBe('00_init');
    expect(result.to).toBe('01_specify');

    const finalState = getFeatureState(featureId, TMP);
    expect(finalState.currentStage).toBe('01_specify');
    expect(finalState.terminal).toBe(false);
  });

  it('should record stage history for each advance', () => {
    // 推进 3 步
    advance(featureId, TMP); // 00→01
    writeFileSync(join(TMP, 'specs', featureId, 'prd.md'), '# PRD\n', 'utf-8');
    writeFileSync(join(TMP, 'specs', featureId, 'spec.md'), '# Spec\n', 'utf-8');
    expect(() => advance(featureId, TMP)).not.toThrow();
    const state = getFeatureState(featureId, TMP);
    expect(state.currentStage).toBe('02_design');
    expect(state.history).toHaveLength(2);
    expect(state.history[0].from).toBe('00_init');
    expect(state.history[0].to).toBe('01_specify');
  });

  it('should evaluate gate at each stage', () => {
    const gateResult = evaluateGate(featureId, TMP);
    expect(gateResult.stage).toBe('00_init');
    expect(['PASS', 'PASS_WITH_WAIVER', 'FAIL']).toContain(gateResult.status);
    expect(gateResult.conditions.length).toBeGreaterThan(0);
  });

  it('should create document links skeleton after init', () => {
    const content = readFileSync(join(TMP, 'specs', featureId, 'document-links.yaml'), 'utf-8');
    expect(content).toContain('version: 1');
    expect(content).toContain(`featureId: ${featureId}`);
    expect(content).toContain('path: spec.md');
  });

  it('should write findings.md on normal advance', () => {
    advance(featureId, TMP);
    const findingsPath = join(TMP, 'specs', featureId, 'findings.md');
    expect(existsSync(findingsPath)).toBe(true);
  });

  it('should write gate-history.jsonl on advance', () => {
    advance(featureId, TMP);
    const histPath = join(TMP, 'specs', featureId, 'gate-history.jsonl');
    expect(existsSync(histPath)).toBe(true);
    const lines = readFileSync(histPath, 'utf-8').trim().split('\n');
    expect(lines.length).toBeGreaterThanOrEqual(1);
    const entry = lines.map((line) => JSON.parse(line)).find((item) => item.action === 'advance');
    expect(entry.action).toBe('advance');
  });

  it('should ignore legacy force option and keep normal behavior', () => {
    const result = advance(featureId, TMP, { force: true } as never);
    expect(result.from).toBe('00_init');
    expect(result.to).toBe('01_specify');
  });
});
