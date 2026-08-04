'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  inspectManagedClaudeHooks,
  removeManagedClaudeHooks,
  upsertManagedClaudeHooks,
} = require('../../src/cli/claude-settings');

const MANAGED_RELATIVE_HOOK_PATHS = [
  '.claude/hooks/session-start',
  '.claude/hooks/spec-plan-guard',
  '.claude/hooks/prd-prewrite-guard',
  '.claude/hooks/prd-readiness-guard',
];

function makeProjectRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'claude-settings-hook-paths-'));
}

function readSettings(projectRoot) {
  return JSON.parse(fs.readFileSync(path.join(projectRoot, '.claude', 'settings.json'), 'utf8'));
}

function collectExecFormArgs(settings) {
  const args = [];
  for (const matchers of Object.values(settings.hooks || {})) {
    for (const matcher of matchers) {
      for (const hook of matcher.hooks || []) {
        if (hook.command === 'node' && Array.isArray(hook.args)) {
          args.push(...hook.args);
        }
      }
    }
  }
  return args;
}

describe('claude-settings managed hook paths', () => {
  test('bakes an absolute, project-root-scoped path into each managed hook so resolution does not depend on the spawn cwd', () => {
    const projectRoot = makeProjectRoot();
    try {
      upsertManagedClaudeHooks(projectRoot);
      const settings = readSettings(projectRoot);
      const args = collectExecFormArgs(settings);

      expect(args).toHaveLength(MANAGED_RELATIVE_HOOK_PATHS.length);
      for (const relativePath of MANAGED_RELATIVE_HOOK_PATHS) {
        const expectedAbsolute = path.join(projectRoot, relativePath);
        expect(args).toContain(expectedAbsolute);
        // Regression guard: a bare relative arg silently resolves against whatever cwd
        // Claude Code happens to spawn the hook with (e.g. a launch subdirectory), which is
        // exactly the MODULE_NOT_FOUND failure this fix addresses.
        expect(args).not.toContain(relativePath);
        expect(path.isAbsolute(expectedAbsolute)).toBe(true);
      }
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('doctor reports the managed hooks as installed (not drifted) right after generation', () => {
    const projectRoot = makeProjectRoot();
    try {
      upsertManagedClaudeHooks(projectRoot);
      const statuses = inspectManagedClaudeHooks(projectRoot);
      expect(statuses).toHaveLength(4);
      for (const status of statuses) {
        expect(status.status).toBe('installed');
      }
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('removal recognizes the absolute-path managed hooks and clears the settings file', () => {
    const projectRoot = makeProjectRoot();
    try {
      upsertManagedClaudeHooks(projectRoot);
      const removed = removeManagedClaudeHooks(projectRoot);
      expect(removed).toBe(true);
      expect(fs.existsSync(path.join(projectRoot, '.claude', 'settings.json'))).toBe(false);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('removal also recognizes a legacy relative-path managed hook left over from a pre-fix install', () => {
    const projectRoot = makeProjectRoot();
    try {
      fs.mkdirSync(path.join(projectRoot, '.claude'), { recursive: true });
      fs.writeFileSync(
        path.join(projectRoot, '.claude', 'settings.json'),
        JSON.stringify({
          hooks: {
            Stop: [
              {
                matcher: '.*',
                hooks: [
                  { type: 'command', command: 'node', args: ['.claude/hooks/prd-readiness-guard'] },
                ],
              },
            ],
          },
        }, null, 2),
      );

      const removed = removeManagedClaudeHooks(projectRoot);
      expect(removed).toBe(true);
      expect(fs.existsSync(path.join(projectRoot, '.claude', 'settings.json'))).toBe(false);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });
});
