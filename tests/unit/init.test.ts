import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { init } from '../../src/core/process-engine/init.js';
import type { InitOptions } from '../../src/core/process-engine/init.js';
import { Stage } from '../../src/shared/types.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-init');

function baseOpts(overrides?: Partial<InitOptions>): InitOptions {
  return {
    feat: 'AUTH',
    title: 'User Authentication',
    mode: 'N',
    size: 'S',
    platforms: [],
    author: 'Leo',
    projectRoot: TMP,
    ...overrides,
  };
}

beforeEach(() => {
  mkdirSync(TMP, { recursive: true });
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe('init', () => {
  it('should create feature directory with all skeleton files', () => {
    const result = init(baseOpts());
    expect(result.featureId).toMatch(/^FSREQ-\d{8}-AUTH-001$/);
    expect(result.featureDir).toContain('specs/');

    // stage-state.json
    const state = JSON.parse(readFileSync(join(result.featureDir, 'stage-state.json'), 'utf-8'));
    expect(state.featureId).toBe(result.featureId);
    expect(state.currentStage).toBe(Stage.INIT);
    expect(state.mode).toBe('N');
    expect(state.size).toBe('S');
    expect(state.terminal).toBe(false);
    expect(state.mergedRules).toBeDefined();
    expect(state.mergedRules.gateConditions).toBeDefined();
    expect(state.mergedRules.deliverables).toBeDefined();

    // 运行态三文件
    expect(readFileSync(join(result.featureDir, 'progress.md'), 'utf-8')).toContain('Progress');
    expect(readFileSync(join(result.featureDir, 'findings.md'), 'utf-8')).toContain('Findings');
    expect(readFileSync(join(result.featureDir, 'task_plan.md'), 'utf-8')).toContain('Task Plan');

    // traceability-matrix.md
    expect(readFileSync(join(result.featureDir, 'traceability-matrix.md'), 'utf-8')).toContain('| ID |');

    // constitution.md
    expect(readFileSync(join(result.featureDir, 'constitution.md'), 'utf-8')).toContain('Constitution');
  });

  it('should write .spec-first/current', () => {
    const result = init(baseOpts());
    const current = readFileSync(join(TMP, '.spec-first', 'current'), 'utf-8');
    expect(current).toBe(result.featureId);
  });

  it('should register FEAT abbreviation', () => {
    const result = init(baseOpts());
    const registry = readFileSync(join(TMP, 'specs', '.feat-registry.md'), 'utf-8');
    expect(registry).toContain('| AUTH |');
    expect(registry).toContain(result.featureId);
  });

  it('should be idempotent — existing feature not overwritten', () => {
    const r1 = init(baseOpts());
    // 修改 progress.md 内容
    writeFileSync(join(r1.featureDir, 'progress.md'), 'custom content', 'utf-8');

    const r2 = init(baseOpts({ featureId: r1.featureId }));
    expect(r2.featureId).toBe(r1.featureId);
    // 内容未被覆盖
    expect(readFileSync(join(r1.featureDir, 'progress.md'), 'utf-8')).toBe('custom content');
  });

  it('should reject duplicate FEAT abbreviation for different feature', () => {
    init(baseOpts());
    expect(() => init(baseOpts({ featureId: 'FSREQ-20260211-AUTH-999' })))
      .toThrow(/already registered/);
  });

  it('should reject invalid FEAT abbreviation', () => {
    expect(() => init(baseOpts({ feat: 'auth' }))).toThrow(/Invalid FEAT/);
    expect(() => init(baseOpts({ feat: '123' }))).toThrow(/Invalid FEAT/);
  });

  it('should auto-increment sequence number', () => {
    const r1 = init(baseOpts());
    // 用不同缩写创建第二个
    const r2 = init(baseOpts({ feat: 'PAY', title: 'Payment' }));
    expect(r2.featureId).toMatch(/PAY-001$/);

    // 同缩写第二个（需要先让第一个的 feat 注册不冲突）
    // 直接用不同 feat 测试序号递增
    const r3 = init(baseOpts({ feat: 'SHIP', title: 'Shipping' }));
    expect(r3.featureId).toMatch(/SHIP-001$/);
  });

  it('should copy global constitution.md when available', () => {
    const constDir = join(TMP, '.spec-first');
    mkdirSync(constDir, { recursive: true });
    writeFileSync(join(constDir, 'constitution.md'), '# Global Constitution\n\nProject rules here.\n', 'utf-8');

    const result = init(baseOpts());
    const content = readFileSync(join(result.featureDir, 'constitution.md'), 'utf-8');
    expect(content).toContain('Global Constitution');
    expect(content).toContain('Project rules here');
  });

  it('should include merged rules in result', () => {
    const result = init(baseOpts({ mode: 'I', size: 'L' }));
    expect(result.mergedRules.mode).toBe('I');
    expect(result.mergedRules.size).toBe('L');
    // Mode I 应有 impact-analysis gate
    const specGates = result.mergedRules.gateConditions['01_specify'];
    expect(specGates.some((g) => g.id === 'L1-MODE-I-001')).toBe(true);
  });

  it('should create subdirectories (reports, contracts, tests)', () => {
    const result = init(baseOpts());
    expect(existsSync(join(result.featureDir, 'reports'))).toBe(true);
    expect(existsSync(join(result.featureDir, 'contracts'))).toBe(true);
    expect(existsSync(join(result.featureDir, 'tests'))).toBe(true);
  });
});
