/**
 * 核心流程 E2E 测试
 * init → transition 全流程 + 节点状态校验
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';
import { init } from '../../src/core/process-engine/init.js';
import { advance } from '../../src/core/process-engine/advance.js';
import { getFeatureState } from '../../src/core/process-engine/feature.js';

const TMP = join(import.meta.dirname, '../fixtures/.tmp-e2e-core');

beforeEach(() => {
  mkdirSync(join(TMP, '.spec-first', 'layer2'), { recursive: true });
  mkdirSync(join(TMP, 'specs'), { recursive: true });
  writeFileSync(join(TMP, '.spec-first', 'config.yaml'), yaml.dump({
    version: '1.0', project: 'e2e-test',
    confirm_policy: 'assisted',
  }));
  writeFileSync(join(TMP, '.spec-first', 'layer2', 'h5.yaml'), yaml.dump({
    platform: 'h5',
    quality_thresholds: {},
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
    expect(existsSync(join(TMP, 'specs', featureId))).toBe(true);
    expect(existsSync(join(TMP, 'specs', featureId, 'stage-state.json'))).toBe(true);
  });

  it('should advance using transition wrapper semantics', () => {
    const result = advance(featureId, TMP);
    expect(result.from).toBe('00_init');
    expect(result.to).toBe('01_specify');
    expect(result.gateResult).toBe('TRANSITIONED');

    const finalState = getFeatureState(featureId, TMP);
    expect(finalState.currentStage).toBe('01_specify');
    expect(finalState.terminal).toBe(false);
  });

  it('should keep terminal flag false before completion', () => {
    advance(featureId, TMP); // 00→01
    const state = getFeatureState(featureId, TMP);
    expect(state.currentStage).toBe('01_specify');
    expect(state.terminal).toBe(false);
  });

  it('should write findings.md on normal advance', () => {
    advance(featureId, TMP);
    const findingsPath = join(TMP, 'specs', featureId, 'findings.md');
    expect(existsSync(findingsPath)).toBe(true);
  });

  it('should ignore legacy force option and keep normal behavior', () => {
    const result = advance(featureId, TMP, { force: true } as never);
    expect(result.from).toBe('00_init');
    expect(result.to).toBe('01_specify');
  });
});
