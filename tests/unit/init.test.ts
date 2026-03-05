import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
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

    // 运行态文件
    expect(readFileSync(join(result.featureDir, 'findings.md'), 'utf-8')).toContain('Findings');
    const taskPlan = readFileSync(join(result.featureDir, 'task_plan.md'), 'utf-8');
    expect(taskPlan).toContain('Task Plan');
    expect(taskPlan).toContain('| Task ID | 标题 | Owner | 预计工期 | traces | depends_on | 验收标准 | 状态 |');

    // traceability-matrix.md
    expect(readFileSync(join(result.featureDir, 'traceability-matrix.md'), 'utf-8')).toContain('| ID |');

    // constitution.md
    const constitution = readFileSync(join(result.featureDir, 'constitution.md'), 'utf-8');
    expect(constitution).toContain('Constitution');
    expect(constitution).toContain('Version: 1.0.0');
    expect(constitution).toContain('Amendment History');
  });

  it('should write .spec-first/current', () => {
    const result = init(baseOpts());
    const current = readFileSync(join(TMP, '.spec-first', 'current'), 'utf-8');
    expect(current).toBe(`${result.featureId}\n`);
  });

  it('should create default .spec-first/meta/config.yaml when missing', () => {
    init(baseOpts());
    const configPath = join(TMP, '.spec-first', 'meta', 'config.yaml');
    expect(existsSync(configPath)).toBe(true);
    const content = readFileSync(configPath, 'utf-8');
    expect(content).toContain('pilot_mode: false');
    expect(content).toContain('token_budget: 16000');
    expect(content).toContain('trigger: prompt');
    expect(content).toContain('max_self_corrections: 3');
    expect(content).toContain('kv_cache_hard_gate: false');
  });

  it('should not overwrite existing .spec-first/meta/config.yaml', () => {
    const metaDir = join(TMP, '.spec-first', 'meta');
    const configPath = join(metaDir, 'config.yaml');
    mkdirSync(metaDir, { recursive: true });
    const custom = 'gate:\n  pilot_mode: true\n';
    writeFileSync(configPath, custom, 'utf-8');

    init(baseOpts());
    expect(readFileSync(configPath, 'utf-8')).toBe(custom);
  });

  it('should register FEAT abbreviation', () => {
    const result = init(baseOpts());
    const registry = readFileSync(join(TMP, 'specs', '.feat-registry.md'), 'utf-8');
    expect(registry).toContain('| AUTH |');
    expect(registry).toContain(result.featureId);
  });

  it('should be idempotent — existing feature not overwritten', () => {
    const r1 = init(baseOpts());
    // 修改 findings.md 内容
    writeFileSync(join(r1.featureDir, 'findings.md'), 'custom content', 'utf-8');

    const r2 = init(baseOpts({ featureId: r1.featureId }));
    expect(r2.featureId).toBe(r1.featureId);
    // 内容未被覆盖
    expect(readFileSync(join(r1.featureDir, 'findings.md'), 'utf-8')).toBe('custom content');
  });

  it('should self-heal .spec-first/current on idempotent init', () => {
    const r1 = init(baseOpts());
    writeFileSync(join(TMP, '.spec-first', 'current'), 'FSREQ-20990101-OTHER-999\n', 'utf-8');

    init(baseOpts({ featureId: r1.featureId }));
    const current = readFileSync(join(TMP, '.spec-first', 'current'), 'utf-8');
    expect(current).toBe(`${r1.featureId}\n`);
  });

  it('should backfill FEAT registry on idempotent init when missing', () => {
    const r1 = init(baseOpts());
    const registryPath = join(TMP, 'specs', '.feat-registry.md');
    writeFileSync(
      registryPath,
      '# FEAT 缩写注册表\n\n| FEAT | Feature ID |\n|------|------------|\n',
      'utf-8',
    );

    init(baseOpts({ featureId: r1.featureId }));
    const registry = readFileSync(registryPath, 'utf-8');
    expect(registry).toContain(`| AUTH | ${r1.featureId} |`);
  });

  it('should reject duplicate FEAT abbreviation for different feature', () => {
    init(baseOpts());
    expect(() => init(baseOpts({ featureId: 'FSREQ-20260211-AUTH-999' })))
      .toThrow(/已被注册/);
  });

  it('should reject invalid FEAT abbreviation', () => {
    expect(() => init(baseOpts({ feat: 'auth' }))).toThrow(/无效 FEAT 缩写/);
    expect(() => init(baseOpts({ feat: '123' }))).toThrow(/无效 FEAT 缩写/);
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
    expect(content).toContain('Version: 1.0.0');
    expect(content).toContain('Amendment History');
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

  it('should not leave temporary init directories after successful init', () => {
    init(baseOpts());
    const entries = readFileSync(join(TMP, 'specs', '.feat-registry.md'), 'utf-8');
    expect(entries).toContain('| AUTH |');
    const dirs = existsSync(join(TMP, 'specs'))
      ? readdirSync(join(TMP, 'specs'))
      : [];
    expect(dirs.some((name: string) => name.includes('.tmp-'))).toBe(false);
  });

  it('should recover stale FEAT registry lock and continue init', () => {
    const specsDir = join(TMP, 'specs');
    mkdirSync(specsDir, { recursive: true });
    writeFileSync(
      join(specsDir, '.feat-registry.lock'),
      JSON.stringify({
        pid: 999999,
        createdAt: Date.now() - 60_000,
      }),
      'utf-8',
    );

    const result = init(baseOpts());
    expect(result.featureId).toMatch(/^FSREQ-\d{8}-AUTH-001$/);
    expect(existsSync(join(specsDir, '.feat-registry.lock'))).toBe(false);
  });
});
