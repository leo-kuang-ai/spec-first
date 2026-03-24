import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-pre-push');
const HOOK_DIR = join(TMP, '.spec-first', 'hooks');
const SCRIPT = join(HOOK_DIR, 'pre-push.sh');
const POSIX_SHELL = 'sh';

const PRE_PUSH_HOOK = [
  '#!/usr/bin/env sh',
  'set -eu',
  '',
  'HOOK_VERSION="0.1.0"',
  '',
  'if [ "${1:-}" = "--version" ]; then',
  '  echo "spec-first pre-push hook v${HOOK_VERSION}"',
  '  exit 0',
  'fi',
  '',
  'if ! command -v spec-first >/dev/null 2>&1; then',
  '  exit 0',
  'fi',
  '',
  'if spec-first >/dev/null 2>&1; then',
  '  exit 0',
  'fi',
  '',
  'echo "SCA 校验失败"',
  'echo "降级模式"',
  'exit 0',
].join('\n');

beforeEach(() => {
  mkdirSync(TMP, { recursive: true });
  mkdirSync(HOOK_DIR, { recursive: true });
  writeFileSync(SCRIPT, `${PRE_PUSH_HOOK}\n`, 'utf-8');
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe('pre-push hook', () => {
  it('should exit 0 when spec-first CLI is not available', () => {
    // Create minimal PATH with no spec-first
    const env = { ...process.env, PATH: '/usr/bin:/bin' };

    const result = spawnSync(POSIX_SHELL, [SCRIPT], {
      cwd: TMP,
      encoding: 'utf-8',
      env,
    });

    expect(result.status).toBe(0);
  });

  it('should output version when --version flag is passed', () => {
    const result = spawnSync(POSIX_SHELL, [SCRIPT, '--version'], { encoding: 'utf-8' });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('spec-first pre-push hook');
    expect(result.stdout).toContain('0.1.0');
  });

  it('should exit 0 even when SCA check fails (degraded mode)', () => {
    // Mock spec-first command that fails
    const mockSpecFirst = join(TMP, 'spec-first');
    writeFileSync(
      mockSpecFirst,
      '#!/bin/sh\nexit 1\n',
      'utf-8',
    );
    spawnSync('chmod', ['+x', mockSpecFirst]);

    const env = { ...process.env, PATH: `${TMP}:${process.env.PATH}` };

    const result = spawnSync(POSIX_SHELL, [SCRIPT], {
      cwd: TMP,
      encoding: 'utf-8',
      env,
    });

    expect(result.status).toBe(0);
    const output = result.stdout + result.stderr;
    expect(output).toContain('SCA 校验失败');
    expect(output).toContain('降级模式');
  });

  it('should exit 0 when SCA check succeeds', () => {
    // Mock spec-first command that succeeds
    const mockSpecFirst = join(TMP, 'spec-first');
    writeFileSync(
      mockSpecFirst,
      '#!/bin/sh\nexit 0\n',
      'utf-8',
    );
    spawnSync('chmod', ['+x', mockSpecFirst]);

    const env = { ...process.env, PATH: `${TMP}:${process.env.PATH}` };

    const result = spawnSync(POSIX_SHELL, [SCRIPT], {
      cwd: TMP,
      encoding: 'utf-8',
      env,
    });

    expect(result.status).toBe(0);
  });

  it('should handle spec-first command gracefully', () => {
    // Mock spec-first command that succeeds
    const mockSpecFirst = join(TMP, 'spec-first');
    writeFileSync(
      mockSpecFirst,
      '#!/bin/sh\n# Mock successful SCA\nexit 0\n',
      'utf-8',
    );
    spawnSync('chmod', ['+x', mockSpecFirst]);

    const env = { ...process.env, PATH: `${TMP}:${process.env.PATH}` };

    const result = spawnSync(POSIX_SHELL, [SCRIPT], {
      cwd: TMP,
      encoding: 'utf-8',
      env,
    });

    expect(result.status).toBe(0);
  });
});
