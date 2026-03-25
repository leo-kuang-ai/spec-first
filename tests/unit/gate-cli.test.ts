/**
 * Gate CLI + GoLive + Rollback 单元测试
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { handleGate, handleGoLive } from '../../src/cli/commands/gate.js';
import { checkGoLive } from '../../src/core/gate-engine/golive.js';
import { buildRollbackPlan, recommendLevel } from '../../src/core/gate-engine/rollback.js';
import { ExitCode } from '../../src/shared/types.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-gate-cli');
const FEAT = 'FSREQ-20260211-AUTH-001';

function withCwd(dir: string, fn: () => number): number {
  const orig = process.cwd;
  process.cwd = () => dir;
  try { return fn(); } finally { process.cwd = orig; }
}

function writeState(stage: string, mode = 'N', size = 'M') {
  writeFileSync(join(TMP, 'specs', FEAT, 'stage-state.json'), JSON.stringify({
    featureId: FEAT, mode, size, platforms: ['h5'],
    currentStage: stage, history: [], terminal: false,
    createdAt: '2026-02-11T00:00:00Z',
  }));
}

function writeDocumentLinks() {
  writeFileSync(
    join(TMP, 'specs', FEAT, 'document-links.yaml'),
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

beforeEach(() => {
  mkdirSync(join(TMP, 'specs', FEAT), { recursive: true });
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

// ─── Gate CLI Tests ──────────────────────────────────────

describe('handleGate', () => {
  it('should return VALIDATION_ERROR without subcommand', () => {
    const code = withCwd(TMP, () => handleGate([]));
    expect(code).toBe(ExitCode.VALIDATION_ERROR);
  });

  it('should return VALIDATION_ERROR for unknown subcommand', () => {
    const code = withCwd(TMP, () => handleGate(['unknown']));
    expect(code).toBe(ExitCode.VALIDATION_ERROR);
  });

  it('should retire check/history/conditions entry points', () => {
    expect(withCwd(TMP, () => handleGate(['check', FEAT]))).toBe(ExitCode.VALIDATION_ERROR);
    expect(withCwd(TMP, () => handleGate(['history', FEAT]))).toBe(ExitCode.VALIDATION_ERROR);
    expect(withCwd(TMP, () => handleGate(['conditions', FEAT]))).toBe(ExitCode.VALIDATION_ERROR);
  });
});

// ─── GoLive CLI Tests ────────────────────────────────────

describe('handleGoLive', () => {
  it('should return VALIDATION_ERROR without check subcommand', () => {
    const code = withCwd(TMP, () => handleGoLive([]));
    expect(code).toBe(ExitCode.VALIDATION_ERROR);
  });

  it('should retire go-live entry point', () => {
    expect(withCwd(TMP, () => handleGoLive(['check']))).toBe(ExitCode.VALIDATION_ERROR);
    expect(withCwd(TMP, () => handleGoLive(['check', FEAT]))).toBe(ExitCode.VALIDATION_ERROR);
  });
});

// ─── GoLive Core Tests ──────────────────────────────────

describe('checkGoLive', () => {
  it('should return NOT READY when no gate history', () => {
    writeState('05_verify');
    const result = checkGoLive(FEAT, TMP);
    expect(result.pass).toBe(false);
    expect(result.degraded).toBe(true);
    expect(result.confirmPolicy).toBe('strict');
  });

  it('should fail GL-03 when security evidence is missing', () => {
    writeState('05_verify');
    const result = checkGoLive(FEAT, TMP);
    const securityCheck = result.checks.find((item) => item.id === 'GL-03');

    expect(securityCheck?.pass).toBe(false);
    expect(securityCheck?.detail).toContain('missing: reports/security-scan.md');
  });

  it('should pass GL-03 and GL-05 when security and release evidence exist', () => {
    writeState('05_verify');
    mkdirSync(join(TMP, 'specs', FEAT, 'reports'), { recursive: true });
    writeFileSync(
      join(TMP, 'specs', FEAT, 'reports', 'security-scan.md'),
      [
        '| ID | Severity | Title | Waived |',
        '|----|----------|-------|--------|',
        '| SEC-001 | S3 | informational finding | no |',
      ].join('\n') + '\n',
      'utf-8',
    );
    writeFileSync(join(TMP, 'specs', FEAT, 'reports', 'release-note.md'), '# release', 'utf-8');
    writeFileSync(join(TMP, 'specs', FEAT, 'reports', 'smoke-test-report.md'), '# smoke', 'utf-8');

    const result = checkGoLive(FEAT, TMP);
    const securityCheck = result.checks.find((item) => item.id === 'GL-03');
    const releaseCheck = result.checks.find((item) => item.id === 'GL-05');

    expect(securityCheck?.pass).toBe(true);
    expect(releaseCheck?.pass).toBe(true);
  });
});

// ─── Rollback Tests ──────────────────────────────────────

describe('buildRollbackPlan', () => {
  it('should build L1 plan with config revert only', () => {
    const plan = buildRollbackPlan(FEAT, 'L1');
    expect(plan.actions).toHaveLength(1);
    expect(plan.actions[0].level).toBe('L1');
    expect(plan.requiresManual).toBe(false);
  });

  it('should build L2 plan with config + version revert', () => {
    const plan = buildRollbackPlan(FEAT, 'L2', 'abc1234');
    expect(plan.actions).toHaveLength(2);
    expect(plan.actions[1].command).toContain('abc1234');
  });

  it('should build L3 plan with manual step', () => {
    const plan = buildRollbackPlan(FEAT, 'L3');
    expect(plan.actions).toHaveLength(3);
    expect(plan.requiresManual).toBe(true);
  });

  it('should throw for invalid commit sha', () => {
    expect(() => buildRollbackPlan(FEAT, 'L2', 'bad;rm -rf /'))
      .toThrow(/无效 commit SHA/);
  });
});

describe('recommendLevel', () => {
  it('should recommend L1 for low error rate without data change', () => {
    expect(recommendLevel(0.1, false)).toBe('L1');
  });

  it('should recommend L2 for high error rate without data change', () => {
    expect(recommendLevel(0.6, false)).toBe('L2');
  });

  it('should recommend L3 when data change involved', () => {
    expect(recommendLevel(0.1, true)).toBe('L3');
  });
});
