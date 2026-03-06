/**
 * M7 ToolIntegration 单元测试
 * Hook Installer + Commit + Feature CLI + Doctor Extended + AI Runtime Hook
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { installHooks, uninstallHooks, checkHooks } from '../../src/core/tool-integration/hook-installer.js';
import { generateAIHookConfigs, registerAIHooks, executePreToolUse, executeStopHook } from '../../src/core/tool-integration/ai-runtime-hook.js';
import { handleFeature } from '../../src/cli/commands/feature.js';
import { handleCommit } from '../../src/cli/commands/commit.js';
import { ExitCode } from '../../src/shared/types.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-tool-integration');

function withCwd(dir: string, fn: () => number): number {
  const orig = process.cwd;
  process.cwd = () => dir;
  try { return fn(); } finally { process.cwd = orig; }
}

beforeEach(() => {
  mkdirSync(join(TMP, '.git', 'hooks'), { recursive: true });
  mkdirSync(join(TMP, '.spec-first'), { recursive: true });
  mkdirSync(join(TMP, 'specs'), { recursive: true });
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

// ─── Hook Installer Tests ───────────────────────────────

describe('installHooks', () => {
  it('should install 4 hooks', () => {
    const installed = installHooks(TMP);
    expect(installed).toHaveLength(4);
    expect(installed).toContain('prepare-commit-msg');
    expect(installed).toContain('commit-msg');
  });

  it('should create executable hook files', () => {
    installHooks(TMP);
    const hookPath = join(TMP, '.git', 'hooks', 'commit-msg');
    expect(existsSync(hookPath)).toBe(true);
    const content = readFileSync(hookPath, 'utf-8');
    expect(content).toContain('#!/bin/sh');
    expect(content).toContain('spec-first-hook');
  });

  it('should keep existing custom hook content', () => {
    const preCommitPath = join(TMP, '.git', 'hooks', 'pre-commit');
    writeFileSync(preCommitPath, '#!/bin/sh\necho custom-pre-commit\n', 'utf-8');
    installHooks(TMP);
    const content = readFileSync(preCommitPath, 'utf-8');
    expect(content).toContain('echo custom-pre-commit');
    expect(content).toContain('spec-first-hook');
  });

  it('should refresh existing spec-first hook block to latest template', () => {
    const preCommitPath = join(TMP, '.git', 'hooks', 'pre-commit');
    writeFileSync(
      preCommitPath,
      '#!/bin/sh\necho custom-pre-commit\n\n#!/bin/sh\n# spec-first-hook\necho OLD_PRECOMMIT_TEMPLATE\n',
      'utf-8',
    );

    installHooks(TMP);
    const content = readFileSync(preCommitPath, 'utf-8');

    expect(content).toContain('echo custom-pre-commit');
    expect(content).not.toContain('OLD_PRECOMMIT_TEMPLATE');
    expect(content).toContain('--diff-filter=ACMRD');
    expect(content).toContain('while IFS= read -r FILE');
  });
});

describe('uninstallHooks', () => {
  it('should remove spec-first hooks', () => {
    installHooks(TMP);
    const removed = uninstallHooks(TMP);
    expect(removed).toHaveLength(4);
    expect(existsSync(join(TMP, '.git', 'hooks', 'commit-msg'))).toBe(false);
  });

  it('should not remove non-spec-first hooks', () => {
    writeFileSync(join(TMP, '.git', 'hooks', 'pre-commit'), '#!/bin/sh\necho custom');
    const removed = uninstallHooks(TMP);
    expect(removed).toHaveLength(0);
    expect(existsSync(join(TMP, '.git', 'hooks', 'pre-commit'))).toBe(true);
  });

  it('should keep custom hook when uninstalling appended spec-first block', () => {
    const preCommitPath = join(TMP, '.git', 'hooks', 'pre-commit');
    writeFileSync(preCommitPath, '#!/bin/sh\necho custom\n', 'utf-8');
    installHooks(TMP);
    const removed = uninstallHooks(TMP);
    expect(removed).toContain('pre-commit');
    expect(existsSync(preCommitPath)).toBe(true);
    expect(readFileSync(preCommitPath, 'utf-8')).toContain('echo custom');
  });
});

describe('checkHooks', () => {
  it('should report all hooks not installed', () => {
    const statuses = checkHooks(TMP);
    expect(statuses).toHaveLength(4);
    expect(statuses.every(s => !s.installed)).toBe(true);
  });

  it('should detect spec-first hooks', () => {
    installHooks(TMP);
    const statuses = checkHooks(TMP);
    expect(statuses.every(s => s.installed && s.isSpecFirst)).toBe(true);
  });
});

// ─── Feature CLI Tests ──────────────────────────────────

const FEAT = 'FSREQ-20260211-AUTH-001';

function writeFeatureState() {
  mkdirSync(join(TMP, 'specs', FEAT), { recursive: true });
  writeFileSync(join(TMP, 'specs', FEAT, 'stage-state.json'), JSON.stringify({
    featureId: FEAT, mode: 'N', size: 'M', platforms: ['h5'],
    currentStage: '04_implement', history: [], terminal: false,
    title: 'Auth Module', createdAt: '2026-02-11T00:00:00Z', updatedAt: '2026-02-11T00:00:00Z',
  }));
}

describe('handleFeature', () => {
  it('should return VALIDATION_ERROR without subcommand', () => {
    const code = withCwd(TMP, () => handleFeature([]));
    expect(code).toBe(ExitCode.VALIDATION_ERROR);
  });

  it('should list features', () => {
    writeFeatureState();
    const code = withCwd(TMP, () => handleFeature(['list']));
    expect(code).toBe(ExitCode.SUCCESS);
  });

  it('should show current (no current set)', () => {
    const code = withCwd(TMP, () => handleFeature(['current']));
    expect(code).toBe(ExitCode.SUCCESS);
  });

  it('should switch feature', () => {
    writeFeatureState();
    const code = withCwd(TMP, () => handleFeature(['switch', FEAT]));
    expect(code).toBe(ExitCode.SUCCESS);
    const current = readFileSync(join(TMP, '.spec-first', 'current'), 'utf-8');
    expect(current).toBe(FEAT);
  });

  it('should fail switch for nonexistent feature', () => {
    const code = withCwd(TMP, () => handleFeature(['switch', 'NONEXIST']));
    expect(code).toBe(ExitCode.VALIDATION_ERROR);
  });
});

// ─── Commit CLI Tests ───────────────────────────────────

describe('handleCommit', () => {
  it('should return VALIDATION_ERROR without message', () => {
    const code = withCwd(TMP, () => handleCommit([]));
    expect(code).toBe(ExitCode.VALIDATION_ERROR);
  });

  it('should return VALIDATION_ERROR for invalid task ID', () => {
    const code = withCwd(TMP, () => handleCommit(['--message', 'test', '--task', 'INVALID']));
    expect(code).toBe(ExitCode.VALIDATION_ERROR);
  });
});

// ─── AI Runtime Hook Tests ──────────────────────────────

describe('generateAIHookConfigs', () => {
  it('should generate 6 hook configs', () => {
    const configs = generateAIHookConfigs(TMP);
    expect(configs).toHaveLength(6);
    const types = configs.map(c => c.type);
    expect(types).toContain('PreToolUse');
    expect(types).toContain('PostToolUse');
    expect(types).toContain('Stop');
  });
});

describe('registerAIHooks', () => {
  it('should register hooks when .claude/ exists', () => {
    mkdirSync(join(TMP, '.claude'), { recursive: true });
    const result = registerAIHooks(TMP);
    expect(result.registered).toHaveLength(3);
    expect(result.warnings).toHaveLength(0);
  });

  it('should warn when .claude/ missing', () => {
    // TMP has no .claude/ dir
    rmSync(join(TMP, '.claude'), { recursive: true, force: true });
    const result = registerAIHooks(TMP);
    expect(result.registered).toHaveLength(0);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

describe('executePreToolUse', () => {
  it('should soft-block when no stage-state', () => {
    const result = executePreToolUse(FEAT, TMP);
    expect(result.success).toBe(false);
    expect(result.softBlock).toBe(true);
  });

  it('should pass when stage-state exists', () => {
    writeFeatureState();
    const result = executePreToolUse(FEAT, TMP);
    expect(result.success).toBe(true);
  });
});

describe('executeStopHook', () => {
  it('should append to findings.md', () => {
    writeFeatureState();
    const result = executeStopHook(FEAT, TMP, 'Session summary');
    expect(result.success).toBe(true);
    const content = readFileSync(join(TMP, 'specs', FEAT, 'findings.md'), 'utf-8');
    expect(content).toContain('Session summary');
  });
});
