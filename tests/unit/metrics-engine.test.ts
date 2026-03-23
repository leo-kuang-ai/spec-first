/**
 * 文档指标 MetricsEngine 单元测试
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { calcHealthScore } from '../../src/core/metrics-engine/health-score.js';
import {
  detectBottlenecks,
  calcGateFirstPassRate,
  calcReworkRate,
} from '../../src/core/metrics-engine/bottleneck.js';
import { getDocumentMetrics, handleMetrics } from '../../src/cli/commands/metrics.js';
import { ExitCode } from '../../src/shared/types.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-metrics');
const FEAT = 'FEAT-TEST';

function withCwd(dir: string, fn: () => number): number {
  const orig = process.cwd;
  process.cwd = () => dir;
  try {
    return fn();
  } finally {
    process.cwd = orig;
  }
}

beforeEach(() => {
  mkdirSync(join(TMP, 'specs', FEAT, 'reports'), { recursive: true });
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

function writeStageState() {
  writeFileSync(
    join(TMP, 'specs', FEAT, 'stage-state.json'),
    JSON.stringify({
      featureId: FEAT,
      currentStage: '03_plan',
      mode: 'N',
      size: 'M',
      platforms: ['h5'],
      history: [],
      terminal: false,
      createdAt: '2026-03-23T00:00:00.000Z',
      updatedAt: '2026-03-23T00:00:00.000Z',
    }),
    'utf-8'
  );
}

function writeDocumentLinks(content?: string) {
  writeFileSync(
    join(TMP, 'specs', FEAT, 'document-links.yaml'),
    content ??
      [
        'version: 1',
        `featureId: ${FEAT}`,
        'documents:',
        '  - path: spec.md',
        '    kind: requirements',
        '    stage: 01_specify',
        '    references: []',
        '  - path: design.md',
        '    kind: design',
        '    stage: 02_design',
        '    references:',
        '      - spec.md',
        '',
      ].join('\n'),
    'utf-8'
  );
}

describe('calcHealthScore', () => {
  it('should return high score for complete document flow', () => {
    const result = calcHealthScore(
      {
        declaredDocCount: 2,
        existingDocCount: 2,
        linkedDocCount: 1,
        brokenReferenceCount: 0,
      },
      3,
      0
    );
    expect(result.H1).toBe(80);
    expect(result.grade).toBe('B');
  });

  it('should penalize broken references', () => {
    const result = calcHealthScore(
      {
        declaredDocCount: 2,
        existingDocCount: 1,
        linkedDocCount: 0,
        brokenReferenceCount: 2,
      },
      3,
      0
    );
    expect(result.H1).toBeLessThan(40);
    expect(result.grade).toBe('F');
  });
});

describe('detectBottlenecks', () => {
  it('should detect missing documents', () => {
    const result = detectBottlenecks({
      declaredDocCount: 3,
      existingDocCount: 1,
      linkedDocCount: 1,
      brokenReferenceCount: 0,
    });
    expect(result.find((item) => item.rule === 'R1')).toBeDefined();
  });

  it('should detect broken references', () => {
    const result = detectBottlenecks({
      declaredDocCount: 2,
      existingDocCount: 2,
      linkedDocCount: 1,
      brokenReferenceCount: 1,
    });
    expect(result.find((item) => item.rule === 'R2')).toBeDefined();
  });
});

describe('derived metrics', () => {
  it('should calculate rework rate', () => {
    expect(calcReworkRate(10, 2)).toBeCloseTo(0.2);
  });

  it('should calculate gate first pass rate', () => {
    expect(calcGateFirstPassRate(10, 8)).toBeCloseTo(0.8);
  });
});

describe('handleMetrics', () => {
  it('should return VALIDATION_ERROR without subcommand', () => {
    expect(withCwd(TMP, () => handleMetrics([]))).toBe(ExitCode.VALIDATION_ERROR);
  });

  it('should render report from document-links', () => {
    writeStageState();
    writeDocumentLinks();
    writeFileSync(join(TMP, 'specs', FEAT, 'spec.md'), '# Spec\n', 'utf-8');
    writeFileSync(join(TMP, 'specs', FEAT, 'design.md'), '# Design\n', 'utf-8');

    expect(withCwd(TMP, () => handleMetrics(['report', FEAT]))).toBe(ExitCode.SUCCESS);
  });

  it('should calculate document metrics explicitly', () => {
    writeStageState();
    writeDocumentLinks();
    writeFileSync(join(TMP, 'specs', FEAT, 'spec.md'), '# Spec\n', 'utf-8');

    const metrics = getDocumentMetrics(FEAT, TMP);
    expect(metrics.declaredDocCount).toBe(2);
    expect(metrics.existingDocCount).toBe(1);
    expect(metrics.linkedDocCount).toBe(1);
  });
});
