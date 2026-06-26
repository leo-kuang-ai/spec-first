'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { getAdapter } = require('../../src/cli/adapters');
const { runProgrammaticInit, useIsolatedDeveloperHome } = require('./helpers/init-plan');

useIsolatedDeveloperHome();

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-hook-perms-'));
}

function withProject(projectRoot, fn) {
  const previous = process.cwd();
  process.chdir(projectRoot);
  try {
    return fn();
  } finally {
    process.chdir(previous);
  }
}

function isExecutable(mode) {
  return (mode & 0o111) === 0o111;
}

describe('runtime hook permissions', () => {
  test('init writes managed Claude hooks with template content and execute bits', () => {
    const projectRoot = makeTempDir();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    try {
      expect(withProject(projectRoot, () => runProgrammaticInit({ projectRoot, platform: 'claude' }))).toBe(0);

      const plan = getAdapter('claude').planRuntimeFilesSync(projectRoot);
      for (const relativePath of ['.claude/hooks/session-start', '.claude/hooks/spec-plan-guard', '.claude/hooks/prd-prewrite-guard', '.claude/hooks/prd-readiness-guard']) {
        const hookPath = path.join(projectRoot, relativePath);
        const expected = plan.operations.find((operation) => operation.path === relativePath).contents;
        const actual = fs.readFileSync(hookPath, 'utf8');
        const mode = fs.statSync(hookPath).mode & 0o777;

        expect(actual).toBe(expected);
        expect(mode).toBe(0o755);
        expect(isExecutable(mode)).toBe(true);
      }
    } finally {
      logSpy.mockRestore();
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('re-running init restores execute bits if managed Claude hook permissions drift', () => {
    const projectRoot = makeTempDir();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    try {
      expect(withProject(projectRoot, () => runProgrammaticInit({ projectRoot, platform: 'claude' }))).toBe(0);

      const hookPaths = [
        path.join(projectRoot, '.claude', 'hooks', 'session-start'),
        path.join(projectRoot, '.claude', 'hooks', 'spec-plan-guard'),
        path.join(projectRoot, '.claude', 'hooks', 'prd-prewrite-guard'),
        path.join(projectRoot, '.claude', 'hooks', 'prd-readiness-guard'),
      ];
      for (const hookPath of hookPaths) {
        fs.chmodSync(hookPath, 0o644);

        const driftedMode = fs.statSync(hookPath).mode & 0o777;
        expect(driftedMode).toBe(0o644);
        expect(isExecutable(driftedMode)).toBe(false);
      }

      expect(withProject(projectRoot, () => runProgrammaticInit({ projectRoot, platform: 'claude' }))).toBe(0);

      for (const hookPath of hookPaths) {
        const restoredMode = fs.statSync(hookPath).mode & 0o777;
        expect(restoredMode).toBe(0o755);
        expect(isExecutable(restoredMode)).toBe(true);
      }
    } finally {
      logSpy.mockRestore();
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('runtime inspection warns when managed Claude hook execute bits drift', () => {
    const projectRoot = makeTempDir();

    try {
      const adapter = getAdapter('claude');
      const plan = adapter.planRuntimeFilesSync(projectRoot);
      for (const operation of plan.operations) {
        const hookPath = path.join(projectRoot, operation.path);
        fs.mkdirSync(path.dirname(hookPath), { recursive: true });
        fs.writeFileSync(hookPath, operation.contents, 'utf8');
        fs.chmodSync(hookPath, operation.mode);
      }

      const guardPath = path.join(projectRoot, '.claude', 'hooks', 'spec-plan-guard');
      const prewriteGuardPath = path.join(projectRoot, '.claude', 'hooks', 'prd-prewrite-guard');
      const prdGuardPath = path.join(projectRoot, '.claude', 'hooks', 'prd-readiness-guard');
      fs.chmodSync(guardPath, 0o644);
      fs.chmodSync(prewriteGuardPath, 0o644);
      fs.chmodSync(prdGuardPath, 0o644);

      const checks = adapter.inspectRuntimeFiles(projectRoot);
      const guardCheck = checks.find((check) => check.name === '.claude/hooks/spec-plan-guard');
      expect(guardCheck).toMatchObject({
        level: 'WARNING',
        message: 'managed UserPromptExpansion spec-plan guard hook is not executable',
      });
      expect(guardCheck.fix).toContain('spec-first init');
      const prewriteGuardCheck = checks.find((check) => check.name === '.claude/hooks/prd-prewrite-guard');
      expect(prewriteGuardCheck).toMatchObject({
        level: 'WARNING',
        message: 'managed PreToolUse PRD prewrite guard hook is not executable',
      });
      expect(prewriteGuardCheck.fix).toContain('spec-first init');
      const prdGuardCheck = checks.find((check) => check.name === '.claude/hooks/prd-readiness-guard');
      expect(prdGuardCheck).toMatchObject({
        level: 'WARNING',
        message: 'managed Stop PRD readiness guard hook is not executable',
      });
      expect(prdGuardCheck.fix).toContain('spec-first init');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('codex init writes the managed session-start hook with template content and execute bits', () => {
    const projectRoot = makeTempDir();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    try {
      expect(withProject(projectRoot, () => runProgrammaticInit({ projectRoot, platform: 'codex' }))).toBe(0);

      const normalizedProjectRoot = fs.realpathSync.native(projectRoot);
      const hookPath = path.join(projectRoot, '.codex', 'hooks', 'session-start');
      const commandHookPath = path.join(projectRoot, '.codex', 'hooks', 'session-start.cmd');
      const hooksJsonPath = path.join(projectRoot, '.codex', 'hooks.json');
      const expectedHook = getAdapter('codex')
        .planRuntimeFilesSync(normalizedProjectRoot)
        .operations
        .find((operation) => operation.path === '.codex/hooks/session-start')
        .contents;
      const expectedCommandHook = getAdapter('codex')
        .planRuntimeFilesSync(normalizedProjectRoot)
        .operations
        .find((operation) => operation.path === '.codex/hooks/session-start.cmd')
        .contents;
      const expectedHooksJson = getAdapter('codex')
        .planRuntimeFilesSync(normalizedProjectRoot)
        .operations
        .find((operation) => operation.path === '.codex/hooks.json')
        .contents;
      const mode = fs.statSync(hookPath).mode & 0o777;
      const commandHookMode = fs.statSync(commandHookPath).mode & 0o777;

      expect(fs.readFileSync(hookPath, 'utf8')).toBe(expectedHook);
      expect(fs.readFileSync(commandHookPath, 'utf8')).toBe(expectedCommandHook);
      expect(fs.readFileSync(hooksJsonPath, 'utf8')).toBe(expectedHooksJson);
      expect(mode).toBe(0o755);
      expect(commandHookMode).toBe(0o755);
      expect(isExecutable(mode)).toBe(true);
      expect(isExecutable(commandHookMode)).toBe(true);
    } finally {
      logSpy.mockRestore();
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });
});
