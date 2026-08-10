'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
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

function collectExecFormHooks(settings) {
  const hooks = [];
  for (const matchers of Object.values(settings.hooks || {})) {
    for (const matcher of matchers) {
      for (const hook of matcher.hooks || []) {
        if (hook.command === 'node' && Array.isArray(hook.args)) {
          hooks.push(hook);
        }
      }
    }
  }
  return hooks;
}

describe('claude-settings managed hook paths', () => {
  test('uses portable runtime launchers that resolve from CLAUDE_PROJECT_DIR instead of generation paths', () => {
    const projectRoot = makeProjectRoot();
    try {
      upsertManagedClaudeHooks(projectRoot);
      const settings = readSettings(projectRoot);
      const hooks = collectExecFormHooks(settings);

      expect(hooks).toHaveLength(MANAGED_RELATIVE_HOOK_PATHS.length);
      for (const relativePath of MANAGED_RELATIVE_HOOK_PATHS) {
        const hook = hooks.find((entry) => entry.args[1].includes(JSON.stringify(relativePath)));
        expect(hook).toBeDefined();
        expect(hook.args[0]).toBe('-e');
        expect(hook.args[1]).toContain('process.env.CLAUDE_PROJECT_DIR || process.cwd()');
        expect(hook.args.join('\n')).not.toContain(projectRoot);
      }
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('portable SessionStart launcher works when Claude starts from a project subdirectory', () => {
    const projectRoot = makeProjectRoot();
    try {
      upsertManagedClaudeHooks(projectRoot);
      const settings = readSettings(projectRoot);
      const hook = settings.hooks.SessionStart[0].hooks[0];
      const hookPath = path.join(projectRoot, '.claude', 'hooks', 'session-start');
      const launchDirectory = path.join(projectRoot, 'packages', 'app');
      fs.mkdirSync(path.dirname(hookPath), { recursive: true });
      fs.mkdirSync(launchDirectory, { recursive: true });
      fs.writeFileSync(hookPath, "process.stdout.write('portable-hook');\n", 'utf8');

      const result = spawnSync(hook.command, hook.args, {
        cwd: launchDirectory,
        env: { ...process.env, CLAUDE_PROJECT_DIR: projectRoot },
        encoding: 'utf8',
      });
      expect(result.status).toBe(0);
      expect(result.stdout).toBe('portable-hook');
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

  test('removal recognizes the portable managed hooks and clears the settings file', () => {
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

  test('removal still recognizes an absolute-path managed hook left by an older install', () => {
    const projectRoot = makeProjectRoot();
    try {
      fs.mkdirSync(path.join(projectRoot, '.claude'), { recursive: true });
      fs.writeFileSync(
        path.join(projectRoot, '.claude', 'settings.json'),
        JSON.stringify({
          hooks: {
            SessionStart: [{
              matcher: 'startup|resume|clear|compact',
              hooks: [{
                type: 'command',
                command: 'node',
                args: [path.join(projectRoot, '.claude/hooks/session-start')],
              }],
            }],
          },
        }, null, 2),
      );

      expect(removeManagedClaudeHooks(projectRoot)).toBe(true);
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
