'use strict';

// 回归测试：SUP-15 - 持久状态的 stop_reason 可直接冒充收敛判定
// 证据：docs/validation/2026-11-09-harness-full-code-deep-review.md:173-179

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const scriptPath = path.join(__dirname, '../../skills/autoresearch/scripts/orchestrate.sh');

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sup15-'));
}

function validateState(state) {
  const root = tmpDir();
  try {
    const statePath = path.join(root, 'state.json');
    fs.writeFileSync(statePath, JSON.stringify(state));

    const result = spawnSync('bash', [scriptPath, 'validate-state', statePath], {
      encoding: 'utf8',
      timeout: 5000,
    });

    return {
      exitCode: result.status,
      stdout: result.stdout.trim(),
      stderr: result.stderr.trim(),
    };
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function verdict(state) {
  const root = tmpDir();
  try {
    const statePath = path.join(root, 'state.json');
    fs.writeFileSync(statePath, JSON.stringify(state));

    const result = spawnSync('bash', [scriptPath, 'verdict', statePath], {
      encoding: 'utf8',
      timeout: 5000,
    });

    return {
      exitCode: result.status,
      stdout: result.stdout.trim(),
      stderr: result.stderr.trim(),
    };
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

describe('Autoresearch stop_reason validation — SUP-15', () => {
  const baseState = {
    goal: 'test goal',
    archetype: 'test-arch',
    mode: 'loop',
    pipeline: ['verify'],
    terminal_choice: 'stop-at-verified',
    hop_log: [],
    cycle_count: 1,
    predicate: {
      command: 'echo test',
      expected: 'test',
    },
    units_remaining: [1],
  };

  test('拒绝 stop_reason=CONVERGED（成功 verdict 不能作为 stop_reason）', () => {
    const state = {
      ...baseState,
      predicate_met: false,
      stop_reason: 'CONVERGED',
    };

    const result = validateState(state);

    expect(result.exitCode).toBe(2);
    expect(result.stdout).toContain('invalid');
    expect(result.stdout).toMatch(/stop_reason:.*not a success verdict/);
  });

  test('允许合法 stop_reason=EXTERNAL-STOP', () => {
    const state = {
      ...baseState,
      predicate_met: false,
      stop_reason: 'EXTERNAL-STOP',
    };

    const result = validateState(state);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('valid');
  });

  test('允许合法 stop_reason=USER-INTERRUPT', () => {
    const state = {
      ...baseState,
      predicate_met: false,
      stop_reason: 'USER-INTERRUPT',
    };

    const result = validateState(state);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('valid');
  });

  test('允许合法 stop_reason=ERROR', () => {
    const state = {
      ...baseState,
      predicate_met: false,
      stop_reason: 'ERROR',
    };

    const result = validateState(state);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('valid');
  });

  test('拒绝 stop_reason=PENDING-SHIP-APPROVAL（成功 verdict）', () => {
    const state = {
      ...baseState,
      predicate_met: false,
      stop_reason: 'PENDING-SHIP-APPROVAL',
    };

    const result = validateState(state);

    expect(result.exitCode).toBe(2);
    expect(result.stdout).toContain('invalid');
    expect(result.stdout).toMatch(/stop_reason:.*not a success verdict/);
  });

  test('predicate_met=true 正常输出 CONVERGED（无 stop_reason 干扰）', () => {
    const state = {
      ...baseState,
      predicate_met: true,
    };

    const validateResult = validateState(state);
    expect(validateResult.exitCode).toBe(0);
    expect(validateResult.stdout).toContain('valid');

    const verdictResult = verdict(state);
    expect(verdictResult.exitCode).toBe(0);
    expect(verdictResult.stdout).toContain('CONVERGED');
  });

  test('stop_reason=EXTERNAL-STOP 优先于 predicate_met 输出中断原因', () => {
    const state = {
      ...baseState,
      predicate_met: true, // 即使满足 predicate
      stop_reason: 'EXTERNAL-STOP', // 但有外部中断
    };

    const validateResult = validateState(state);
    expect(validateResult.exitCode).toBe(0);
    expect(validateResult.stdout).toContain('valid');

    const verdictResult = verdict(state);
    expect(verdictResult.exitCode).toBe(0);
    expect(verdictResult.stdout).toContain('EXTERNAL-STOP');
    expect(verdictResult.stdout).not.toContain('CONVERGED');
  });
});
