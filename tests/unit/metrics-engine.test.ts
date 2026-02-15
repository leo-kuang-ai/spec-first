/**
 * M6 MetricsEngine 单元测试
 * Health Score + Bottleneck + Metrics CLI
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { calcHealthScore } from '../../src/core/metrics-engine/health-score.js';
import { detectBottlenecks, calcReworkRate, calcGateFirstPassRate } from '../../src/core/metrics-engine/bottleneck.js';
import { handleMetrics } from '../../src/cli/commands/metrics.js';
import { ExitCode } from '../../src/shared/types.js';
import type { CoverageMetrics } from '../../src/shared/types.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-metrics');

function withCwd(dir: string, fn: () => number): number {
  const orig = process.cwd;
  process.cwd = () => dir;
  try { return fn(); } finally { process.cwd = orig; }
}

/** 构造 CoverageMetrics */
function makeCoverage(overrides: Partial<Record<string, number>> = {}): CoverageMetrics {
  const base: Record<string, number> = {
    C1: 0.9, C2: 0.9, C3: 0.9, C4: 0.9,
    C5: 0.8, C6: 0.9, C7: 0.95, C8: 0.9, C9: 0.9,
    ...overrides,
  };
  return base as unknown as CoverageMetrics;
}

beforeEach(() => {
  mkdirSync(join(TMP, 'specs', 'FEAT-TEST'), { recursive: true });
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

// ─── Health Score Tests ─────────────────────────────────

describe('calcHealthScore', () => {
  it('should return high score for full coverage', () => {
    const coverage = makeCoverage({ C1: 1, C2: 1, C3: 1, C4: 1, C5: 1, C6: 1, C7: 1, C8: 1, C9: 1 });
    const result = calcHealthScore(coverage, 5, 0);
    expect(result.H1).toBe(100);
    expect(result.grade).toBe('A');
    expect(result.E1).toBe(5);
    expect(result.Q1).toBe(0);
  });

  it('should apply escape rate penalty', () => {
    const coverage = makeCoverage({ C1: 1, C2: 1, C3: 1, C4: 1, C5: 1, C6: 1, C7: 1, C8: 1, C9: 1 });
    const result = calcHealthScore(coverage, 5, 0.05);
    // penalty = 0.05 * 200 = 10
    expect(result.H1).toBe(90);
    // 浮点精度: weights 之和 ≈ 0.9999..., raw H1 ≈ 89.999, grade 按 raw 值判定
    expect(result.grade).toBe('B');
  });

  it('should cap penalty at 50', () => {
    const coverage = makeCoverage({ C1: 1, C2: 1, C3: 1, C4: 1, C5: 1, C6: 1, C7: 1, C8: 1, C9: 1 });
    const result = calcHealthScore(coverage, 5, 0.5);
    // penalty = min(0.5*200, 50) = 50
    expect(result.H1).toBe(50);
    expect(result.grade).toBe('F');
  });

  it('should return grade B for score 80-89', () => {
    const coverage = makeCoverage({ C1: 0.8, C2: 0.8, C3: 0.8, C4: 0.8, C5: 0.8, C6: 0.8, C7: 0.8, C8: 0.8, C9: 0.8 });
    const result = calcHealthScore(coverage, 3, 0);
    expect(result.H1).toBe(80);
    expect(result.grade).toBe('B');
  });

  it('should return grade F for low coverage', () => {
    const coverage = makeCoverage({ C1: 0.3, C2: 0.3, C3: 0.3, C4: 0.3, C5: 0.3, C6: 0.3, C7: 0.3, C8: 0.3, C9: 0.3 });
    const result = calcHealthScore(coverage, 10, 0);
    expect(result.H1).toBe(30);
    expect(result.grade).toBe('F');
  });

  it('should include breakdown per metric', () => {
    const coverage = makeCoverage();
    const result = calcHealthScore(coverage, 0, 0);
    expect(result.breakdown).toBeDefined();
    expect(Object.keys(result.breakdown)).toContain('C1');
    expect(Object.keys(result.breakdown)).toContain('C9');
  });
});

// ─── Bottleneck Tests ───────────────────────────────────

describe('detectBottlenecks', () => {
  it('should return empty for healthy coverage', () => {
    const coverage = makeCoverage();
    const result = detectBottlenecks(coverage);
    expect(result).toHaveLength(0);
  });

  it('should detect R1 design bottleneck', () => {
    const coverage = makeCoverage({ C1: 0.3 });
    const result = detectBottlenecks(coverage);
    const r1 = result.find(b => b.rule === 'R1');
    expect(r1).toBeDefined();
    expect(r1!.severity).toBe('high');
  });

  it('should detect R2 test bottleneck', () => {
    const coverage = makeCoverage({ C4: 0.4 });
    const result = detectBottlenecks(coverage);
    const r2 = result.find(b => b.rule === 'R2');
    expect(r2).toBeDefined();
    // C4=0.4 不满足 <0.4, severity 为 medium
    expect(r2!.severity).toBe('medium');
  });

  it('should detect R3 implementation lag', () => {
    const coverage = makeCoverage({ C6: 0.5 });
    const result = detectBottlenecks(coverage);
    const r3 = result.find(b => b.rule === 'R3');
    expect(r3).toBeDefined();
    // C6=0.5 不满足 <0.5, severity 为 medium
    expect(r3!.severity).toBe('medium');
  });

  it('should detect R4 compliance gap', () => {
    const coverage = makeCoverage({ C7: 0.6 });
    const result = detectBottlenecks(coverage);
    const r4 = result.find(b => b.rule === 'R4');
    expect(r4).toBeDefined();
    expect(r4!.severity).toBe('medium');
  });

  it('should detect multiple bottlenecks', () => {
    const coverage = makeCoverage({ C1: 0.3, C4: 0.3, C6: 0.4, C7: 0.5 });
    const result = detectBottlenecks(coverage);
    expect(result.length).toBeGreaterThanOrEqual(4);
  });
});

// ─── Rework & Gate Pass Rate ────────────────────────────

describe('calcReworkRate', () => {
  it('should return 0 for no tasks', () => {
    expect(calcReworkRate(0, 0)).toBe(0);
  });
  it('should calculate correctly', () => {
    expect(calcReworkRate(10, 2)).toBeCloseTo(0.2);
  });
});

describe('calcGateFirstPassRate', () => {
  it('should return 1 for no gates', () => {
    expect(calcGateFirstPassRate(0, 0)).toBe(1);
  });
  it('should calculate correctly', () => {
    expect(calcGateFirstPassRate(10, 8)).toBeCloseTo(0.8);
  });
});

// ─── Metrics CLI Tests ──────────────────────────────────

describe('handleMetrics', () => {
  it('should return VALIDATION_ERROR without subcommand', () => {
    const code = withCwd(TMP, () => handleMetrics([]));
    expect(code).toBe(ExitCode.VALIDATION_ERROR);
  });

  it('should return VALIDATION_ERROR for unknown subcommand', () => {
    const code = withCwd(TMP, () => handleMetrics(['unknown']));
    expect(code).toBe(ExitCode.VALIDATION_ERROR);
  });

  it('should return VALIDATION_ERROR for coverage without featureId', () => {
    const code = withCwd(TMP, () => handleMetrics(['coverage']));
    expect(code).toBe(ExitCode.VALIDATION_ERROR);
  });

  it('should return VALIDATION_ERROR for report without featureId', () => {
    const code = withCwd(TMP, () => handleMetrics(['report']));
    expect(code).toBe(ExitCode.VALIDATION_ERROR);
  });

  it('should return VALIDATION_ERROR for health without featureId', () => {
    const code = withCwd(TMP, () => handleMetrics(['health']));
    expect(code).toBe(ExitCode.VALIDATION_ERROR);
  });
});
