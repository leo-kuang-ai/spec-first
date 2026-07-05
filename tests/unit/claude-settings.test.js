'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const {
  SESSION_START_COMMAND,
  PRD_PREWRITE_GUARD_COMMAND,
  PRD_READINESS_GUARD_COMMAND,
  SPEC_PLAN_GUARD_COMMAND,
  buildManagedPrdPrewriteGuardMatcher,
  buildManagedPrdReadinessGuardMatcher,
  buildManagedSessionStartMatcher,
  buildManagedSpecPlanGuardMatcher,
  getClaudeSettingsPath,
  inspectManagedClaudeHooks,
  inspectManagedPrdPrewriteGuardHook,
  inspectManagedPrdReadinessGuardHook,
  inspectManagedSessionStartHook,
  inspectManagedSpecPlanGuardHook,
  removeManagedSessionStartHook,
  upsertManagedSessionStartHook,
  validateClaudeSettingsFile,
} = require('../../src/cli/claude-settings');
const { getAdapter } = require('../../src/cli/adapters');

const REPO_ROOT = path.join(__dirname, '..', '..');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-claude-settings-'));
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeRenderedHook(projectRoot, targetPath, transform = (content) => content) {
  const adapter = getAdapter('claude');
  const plan = adapter.planRuntimeFilesSync(projectRoot);
  const hook = plan.operations.find((operation) => operation.path === targetPath);
  const hookPath = path.join(projectRoot, targetPath);
  fs.mkdirSync(path.dirname(hookPath), { recursive: true });
  fs.writeFileSync(hookPath, transform(hook.contents), 'utf8');
  fs.chmodSync(hookPath, 0o755);
  return hookPath;
}

function writeRenderedSessionStartHook(projectRoot, transform = (content) => content) {
  return writeRenderedHook(projectRoot, '.claude/hooks/session-start', transform);
}

function writeRenderedSpecPlanGuardHook(projectRoot, transform = (content) => content) {
  return writeRenderedHook(projectRoot, '.claude/hooks/spec-plan-guard', transform);
}

function writeRenderedPrdPrewriteGuardHook(projectRoot, transform = (content) => content) {
  return writeRenderedHook(projectRoot, '.claude/hooks/prd-prewrite-guard', transform);
}

function installPrdCheckerRuntime(projectRoot) {
  const scriptDir = path.join(projectRoot, '.claude', 'spec-first', 'workflows', 'spec-prd', 'scripts');
  fs.mkdirSync(path.join(scriptDir, 'lib'), { recursive: true });
  fs.copyFileSync(
    path.join(REPO_ROOT, 'skills', 'spec-prd', 'scripts', 'check-prd-artifact.js'),
    path.join(scriptDir, 'check-prd-artifact.js'),
  );
  fs.copyFileSync(
    path.join(REPO_ROOT, 'skills', 'spec-prd', 'scripts', 'lib', 'reason-codes.js'),
    path.join(scriptDir, 'lib', 'reason-codes.js'),
  );
}

describe('claude settings', () => {
  test('creates managed Claude hook matchers in an empty settings file', () => {
    const projectRoot = makeTempDir();

    try {
      upsertManagedSessionStartHook(projectRoot);

      expect(readJson(getClaudeSettingsPath(projectRoot))).toEqual({
        hooks: {
          SessionStart: [
            buildManagedSessionStartMatcher(),
          ],
          UserPromptExpansion: [
            buildManagedSpecPlanGuardMatcher(),
          ],
          PreToolUse: [
            buildManagedPrdPrewriteGuardMatcher(),
          ],
          Stop: [
            buildManagedPrdReadinessGuardMatcher(),
          ],
        },
      });
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('prd prewrite matcher covers Write, Edit, and MultiEdit mutation tools', () => {
    const matcher = buildManagedPrdPrewriteGuardMatcher();

    expect(matcher.matcher).toBe('Write|Edit|MultiEdit');
    expect(matcher.hooks).toEqual([
      {
        type: 'command',
        command: PRD_PREWRITE_GUARD_COMMAND,
      },
    ]);
  });

  test('appends the managed matcher without disturbing user hooks or permissions', () => {
    const projectRoot = makeTempDir();
    const settingsPath = getClaudeSettingsPath(projectRoot);

    try {
      fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
      fs.writeFileSync(settingsPath, `${JSON.stringify({
        permissions: {
          allow: ['Read(*)'],
        },
        hooks: {
          SessionStart: [
            {
              matcher: 'startup',
              hooks: [
                {
                  type: 'command',
                  command: '"$CLAUDE_PROJECT_DIR"/.claude/hooks/custom-start',
                },
              ],
            },
          ],
          Stop: [
            {
              matcher: '.*',
              hooks: [
                {
                  type: 'command',
                  command: '"$CLAUDE_PROJECT_DIR"/.claude/hooks/custom-stop',
                },
              ],
            },
          ],
        },
      }, null, 2)}\n`, 'utf8');

      upsertManagedSessionStartHook(projectRoot);
      const settings = readJson(settingsPath);

      expect(settings.permissions).toEqual({ allow: ['Read(*)'] });
      expect(settings.hooks.Stop).toHaveLength(2);
      expect(settings.hooks.Stop[1]).toEqual(buildManagedPrdReadinessGuardMatcher());
      expect(settings.hooks.SessionStart).toHaveLength(2);
      expect(settings.hooks.SessionStart[1]).toEqual(buildManagedSessionStartMatcher());
      expect(settings.hooks.UserPromptExpansion).toEqual([
        buildManagedSpecPlanGuardMatcher(),
      ]);
      expect(settings.hooks.PreToolUse).toEqual([
        buildManagedPrdPrewriteGuardMatcher(),
      ]);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('repeated upsert does not duplicate the managed matcher', () => {
    const projectRoot = makeTempDir();

    try {
      upsertManagedSessionStartHook(projectRoot);
      upsertManagedSessionStartHook(projectRoot);

      const settings = readJson(getClaudeSettingsPath(projectRoot));
      expect(settings.hooks.SessionStart).toHaveLength(1);
      expect(settings.hooks.SessionStart[0].hooks[0].command).toBe(SESSION_START_COMMAND);
      expect(settings.hooks.UserPromptExpansion).toHaveLength(1);
      expect(settings.hooks.UserPromptExpansion[0].hooks[0].command).toBe(SPEC_PLAN_GUARD_COMMAND);
      expect(settings.hooks.PreToolUse).toHaveLength(1);
      expect(settings.hooks.PreToolUse[0].hooks[0].command).toBe(PRD_PREWRITE_GUARD_COMMAND);
      expect(settings.hooks.Stop).toHaveLength(1);
      expect(settings.hooks.Stop[0].hooks[0].command).toBe(PRD_READINESS_GUARD_COMMAND);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('upsert preserves a user wrapper hook that merely references the managed path', () => {
    const projectRoot = makeTempDir();
    const settingsPath = getClaudeSettingsPath(projectRoot);
    const userWrapper = {
      type: 'command',
      command: `my-wrapper ${SESSION_START_COMMAND} && echo extra`,
    };

    try {
      fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
      fs.writeFileSync(settingsPath, `${JSON.stringify({
        hooks: {
          SessionStart: [
            { matcher: 'startup', hooks: [userWrapper] },
          ],
        },
      }, null, 2)}\n`, 'utf8');

      upsertManagedSessionStartHook(projectRoot);

      const settings = readJson(settingsPath);
      const allHooks = settings.hooks.SessionStart.flatMap((matcher) => matcher.hooks);
      // Substring-based removal would have deleted this wrapper; exact/prefix removal keeps it.
      expect(allHooks).toContainEqual(userWrapper);
      expect(allHooks.filter((hook) => hook.command === SESSION_START_COMMAND)).toHaveLength(1);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('remove only deletes managed matchers and preserves custom entries', () => {
    const projectRoot = makeTempDir();
    const settingsPath = getClaudeSettingsPath(projectRoot);

    try {
      fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
      fs.writeFileSync(settingsPath, `${JSON.stringify({
        hooks: {
          SessionStart: [
            buildManagedSessionStartMatcher(),
            {
              matcher: 'startup',
              hooks: [
                {
                  type: 'command',
                  command: '"$CLAUDE_PROJECT_DIR"/.claude/hooks/custom-start',
                },
              ],
            },
          ],
          UserPromptExpansion: [
            buildManagedSpecPlanGuardMatcher(),
            {
              matcher: 'custom:prompt',
              hooks: [
                {
                  type: 'command',
                  command: '"$CLAUDE_PROJECT_DIR"/.claude/hooks/custom-prompt',
                },
              ],
            },
          ],
          PreToolUse: [
            buildManagedPrdPrewriteGuardMatcher(),
            {
              matcher: 'Read',
              hooks: [
                {
                  type: 'command',
                  command: '"$CLAUDE_PROJECT_DIR"/.claude/hooks/custom-pretool',
                },
              ],
            },
          ],
          Stop: [
            buildManagedPrdReadinessGuardMatcher(),
            {
              matcher: '.*',
              hooks: [
                {
                  type: 'command',
                  command: '"$CLAUDE_PROJECT_DIR"/.claude/hooks/custom-stop',
                },
              ],
            },
          ],
        },
      }, null, 2)}\n`, 'utf8');

      removeManagedSessionStartHook(projectRoot);

      expect(readJson(settingsPath)).toEqual({
        hooks: {
          SessionStart: [
            {
              matcher: 'startup',
              hooks: [
                {
                  type: 'command',
                  command: '"$CLAUDE_PROJECT_DIR"/.claude/hooks/custom-start',
                },
              ],
            },
          ],
          UserPromptExpansion: [
            {
              matcher: 'custom:prompt',
              hooks: [
                {
                  type: 'command',
                  command: '"$CLAUDE_PROJECT_DIR"/.claude/hooks/custom-prompt',
                },
              ],
            },
          ],
          PreToolUse: [
            {
              matcher: 'Read',
              hooks: [
                {
                  type: 'command',
                  command: '"$CLAUDE_PROJECT_DIR"/.claude/hooks/custom-pretool',
                },
              ],
            },
          ],
          Stop: [
            {
              matcher: '.*',
              hooks: [
                {
                  type: 'command',
                  command: '"$CLAUDE_PROJECT_DIR"/.claude/hooks/custom-stop',
                },
              ],
            },
          ],
        },
      });
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('inspect reports drift when the managed command is rewritten', () => {
    const projectRoot = makeTempDir();
    const settingsPath = getClaudeSettingsPath(projectRoot);

    try {
      fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
      fs.writeFileSync(settingsPath, `${JSON.stringify({
        hooks: {
          SessionStart: [
            {
              matcher: 'startup|resume|clear|compact',
              hooks: [
                {
                  type: 'command',
                  command: '"$CLAUDE_PROJECT_DIR"/.claude/hooks/session-start --debug',
                },
              ],
            },
          ],
        },
      }, null, 2)}\n`, 'utf8');

      expect(inspectManagedSessionStartHook(projectRoot)).toEqual({
        status: 'drifted',
        message: 'managed SessionStart matcher drifted from the bundled template',
      });
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('inspect reports independent status for every managed Claude hook matcher', () => {
    const projectRoot = makeTempDir();

    try {
      upsertManagedSessionStartHook(projectRoot);
      const settingsPath = getClaudeSettingsPath(projectRoot);
      const settings = readJson(settingsPath);
      delete settings.hooks.UserPromptExpansion;
      delete settings.hooks.PreToolUse;
      fs.writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`, 'utf8');

      expect(inspectManagedClaudeHooks(projectRoot)).toEqual([
        {
          status: 'installed',
          message: 'managed SessionStart matcher present',
          eventName: 'SessionStart',
          displayName: 'SessionStart',
        },
        {
          status: 'missing',
          message: '`hooks.UserPromptExpansion` array missing',
          eventName: 'UserPromptExpansion',
          displayName: 'UserPromptExpansion spec-plan guard',
        },
        {
          status: 'missing',
          message: '`hooks.PreToolUse` array missing',
          eventName: 'PreToolUse',
          displayName: 'PreToolUse PRD prewrite guard',
        },
        {
          status: 'installed',
          message: 'managed Stop PRD readiness guard matcher present',
          eventName: 'Stop',
          displayName: 'Stop PRD readiness guard',
        },
      ]);
      expect(inspectManagedSpecPlanGuardHook(projectRoot)).toEqual({
        status: 'missing',
        message: '`hooks.UserPromptExpansion` array missing',
      });
      expect(inspectManagedPrdPrewriteGuardHook(projectRoot)).toEqual({
        status: 'missing',
        message: '`hooks.PreToolUse` array missing',
      });
      expect(inspectManagedPrdReadinessGuardHook(projectRoot)).toEqual({
        status: 'installed',
        message: 'managed Stop PRD readiness guard matcher present',
      });
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('session-start hook emits a short governance pointer without re-injecting the bootstrap block', () => {
    const projectRoot = makeTempDir();
    const instructionPath = path.join(projectRoot, 'CLAUDE.md');

    try {
      fs.writeFileSync(instructionPath, [
        '# CLAUDE.md',
        '',
        '<!-- spec-first:bootstrap:start -->',
        '## Workflow 入口治理',
        '',
        '- 本 block 是 using-spec-first 的核心决策集；完整路由策略在 `skills/using-spec-first/SKILL.md`',
        '- substantial work 前先判断是否进入公开 spec-first workflow；轻量问答和窄事实查询可直接回答；已在 workflow 或 bounded subagent 中时不重新分流',
        '- Workflow 入口统一使用同名 `spec-*`',
        '- 不要把 `using-spec-first` 本身当作 command-backed workflow',
        '<!-- spec-first:bootstrap:end -->',
        '',
      ].join('\n'), 'utf8');
      const hookPath = writeRenderedSessionStartHook(projectRoot);

      const result = spawnSync('bash', [hookPath], {
        cwd: projectRoot,
        encoding: 'utf8',
        env: {
          ...process.env,
          CLAUDE_PROJECT_DIR: projectRoot,
        },
      });

      expect(result.status).toBe(0);
      const payload = JSON.parse(result.stdout);
      expect(payload.hookSpecificOutput.hookEventName).toBe('SessionStart');
      const ctx = payload.hookSpecificOutput.additionalContext;
      expect(ctx).toContain('[spec-first] using-spec-first SessionStart injection');
      expect(ctx).toContain('Workflow entry governance is active');
      expect(ctx).toContain('before non-trivial or risky edits');
      expect(ctx).toContain('target_repo');
      expect(ctx).toContain('skills/using-spec-first/SKILL.md');
      // CLAUDE.md already carries the block; the hook must not duplicate its body.
      expect(ctx).not.toContain('## Workflow 入口治理');
      expect(ctx).not.toContain('substantial work 前先判断是否进入公开 spec-first workflow');
      expect(ctx).not.toContain('before editing');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('session-start hook appends startup version reminder when the helper prints one', () => {
    const projectRoot = makeTempDir();
    const instructionPath = path.join(projectRoot, 'CLAUDE.md');
    const fakeCliPath = path.join(projectRoot, 'spec-first.js');

    try {
      fs.writeFileSync(fakeCliPath, [
        'if (process.argv[2] === "startup-reminder" && process.argv[3] === "--claude") {',
        '  console.log("[spec-first] Update available for Claude Code runtime: 1.6.1 -> 1.6.2");',
        '  console.log("Run `spec-first update` in your terminal to check version and runtime freshness.");',
        '}',
      ].join('\n'), 'utf8');
      fs.writeFileSync(instructionPath, [
        '# CLAUDE.md',
        '',
        '<!-- spec-first:bootstrap:start -->',
        '## Workflow 入口治理',
        '',
        '- Workflow 入口统一使用同名 `spec-*`',
        '<!-- spec-first:bootstrap:end -->',
        '',
      ].join('\n'), 'utf8');
      const hookPath = writeRenderedSessionStartHook(projectRoot, (content) => (
        content.replace(JSON.stringify(path.join(REPO_ROOT, 'bin', 'spec-first.js')), JSON.stringify(fakeCliPath))
      ));

      const result = spawnSync('bash', [hookPath], {
        cwd: projectRoot,
        encoding: 'utf8',
        env: {
          ...process.env,
          CLAUDE_PROJECT_DIR: projectRoot,
        },
      });

      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
      const payload = JSON.parse(result.stdout);
      expect(payload.hookSpecificOutput.additionalContext).toContain('using-spec-first SessionStart injection');
      expect(payload.hookSpecificOutput.additionalContext).toContain('1.6.1 -> 1.6.2');
      expect(payload.hookSpecificOutput.additionalContext).toContain('spec-first update');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('session-start hook does not execute a fake spec-first from PATH', () => {
    const projectRoot = makeTempDir();
    const fakeBin = path.join(projectRoot, 'bin');
    const sentinelPath = path.join(projectRoot, 'fake-spec-first-ran');

    try {
      fs.mkdirSync(fakeBin, { recursive: true });
      fs.writeFileSync(path.join(fakeBin, 'spec-first'), [
        '#!/bin/bash',
        `printf fake > ${JSON.stringify(sentinelPath)}`,
        'printf "%s\\n" "FAKE PATH REMINDER"',
      ].join('\n'), 'utf8');
      fs.chmodSync(path.join(fakeBin, 'spec-first'), 0o755);
      const hookPath = writeRenderedSessionStartHook(projectRoot);

      const result = spawnSync('bash', [hookPath], {
        cwd: projectRoot,
        encoding: 'utf8',
        env: {
          ...process.env,
          CLAUDE_PROJECT_DIR: projectRoot,
          PATH: `${fakeBin}${path.delimiter}${process.env.PATH}`,
          HOME: path.join(projectRoot, 'home'),
          SPEC_FIRST_VERSION_REMINDER_LATEST: '1.6.2',
        },
      });

      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
      expect(fs.existsSync(sentinelPath)).toBe(false);
      expect(result.stdout).not.toContain('FAKE PATH REMINDER');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('session-start hook degrades non-blockingly when trusted helper exits non-zero', () => {
    const projectRoot = makeTempDir();
    const fakeCliPath = path.join(projectRoot, 'spec-first.js');

    try {
      fs.writeFileSync(fakeCliPath, 'process.exit(23);\n', 'utf8');
      const hookPath = writeRenderedSessionStartHook(projectRoot, (content) => (
        content.replace(JSON.stringify(path.join(REPO_ROOT, 'bin', 'spec-first.js')), JSON.stringify(fakeCliPath))
      ));

      const result = spawnSync('bash', [hookPath], {
        cwd: projectRoot,
        encoding: 'utf8',
        env: {
          ...process.env,
          CLAUDE_PROJECT_DIR: projectRoot,
          HOME: path.join(projectRoot, 'home'),
        },
      });

      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
      const payload = JSON.parse(result.stdout);
      expect(payload.hookSpecificOutput.hookEventName).toBe('SessionStart');
      expect(payload.hookSpecificOutput.additionalContext).toContain('using-spec-first SessionStart injection');
      expect(payload.hookSpecificOutput.additionalContext).not.toContain('Update available');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('session-start hook degrades non-blockingly when the bootstrap block is missing', () => {
    const projectRoot = makeTempDir();

    try {
      const hookPath = writeRenderedSessionStartHook(projectRoot);
      const result = spawnSync('bash', [hookPath], {
        cwd: projectRoot,
        encoding: 'utf8',
        env: {
          ...process.env,
          CLAUDE_PROJECT_DIR: projectRoot,
        },
      });

      expect(result.status).toBe(0);
      const payload = JSON.parse(result.stdout);
      expect(payload.hookSpecificOutput.hookEventName).toBe('SessionStart');
      expect(payload.hookSpecificOutput.additionalContext).toContain('Managed using-spec-first bootstrap is missing');
      expect(payload.hookSpecificOutput.additionalContext).toContain('spec-first init');
      expect(payload.hookSpecificOutput.additionalContext).toContain('choose Claude Code');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('session-start hook degrades non-blockingly when the instruction path is unreadable', () => {
    const projectRoot = makeTempDir();

    try {
      const hookPath = writeRenderedSessionStartHook(projectRoot);
      // A directory in place of CLAUDE.md makes readFileSync throw EISDIR regardless of
      // the runner's uid (unlike chmod 0o000, which root bypasses) -> exercises the guard.
      fs.mkdirSync(path.join(projectRoot, 'CLAUDE.md'));

      const result = spawnSync('bash', [hookPath], {
        cwd: projectRoot,
        encoding: 'utf8',
        env: {
          ...process.env,
          CLAUDE_PROJECT_DIR: projectRoot,
        },
      });

      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
      const payload = JSON.parse(result.stdout);
      expect(payload.hookSpecificOutput.hookEventName).toBe('SessionStart');
      expect(payload.hookSpecificOutput.additionalContext).toContain('using-spec-first SessionStart injection');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('session-start hook emits exactly the SessionStart wire contract (no extra keys, single JSON object)', () => {
    // Keep the Claude hook output identical in shape to the Codex SessionStart wire contract
    // (hookSpecificOutput with only hookEventName + additionalContext). This guards dual-host
    // parity and prevents stdout noise / extra keys that a strict host parser would reject.
    const projectRoot = makeTempDir();

    try {
      fs.writeFileSync(path.join(projectRoot, 'CLAUDE.md'), [
        '<!-- spec-first:bootstrap:start -->',
        '- Workflow entrypoints use the same `spec-*` names.',
        '<!-- spec-first:bootstrap:end -->',
        '',
      ].join('\n'), 'utf8');
      const hookPath = writeRenderedSessionStartHook(projectRoot);

      const result = spawnSync('bash', [hookPath], {
        cwd: projectRoot,
        encoding: 'utf8',
        env: { ...process.env, CLAUDE_PROJECT_DIR: projectRoot },
      });

      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
      const trimmed = result.stdout.trim();
      expect(trimmed.startsWith('{')).toBe(true);
      const payload = JSON.parse(trimmed);
      expect(Object.keys(payload)).toEqual(['hookSpecificOutput']);
      expect(Object.keys(payload.hookSpecificOutput).sort()).toEqual(['additionalContext', 'hookEventName']);
      expect(payload.hookSpecificOutput.hookEventName).toBe('SessionStart');
      expect(typeof payload.hookSpecificOutput.additionalContext).toBe('string');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('spec-plan guard hook emits UserPromptExpansion context for native Plan Mode', () => {
    const projectRoot = makeTempDir();

    try {
      const hookPath = writeRenderedSpecPlanGuardHook(projectRoot);
      const result = spawnSync('bash', [hookPath], {
        cwd: projectRoot,
        encoding: 'utf8',
        input: JSON.stringify({
          hook_event_name: 'UserPromptExpansion',
          command_name: 'spec-plan',
          permission_mode: 'plan',
        }),
      });

      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
      const payload = JSON.parse(result.stdout);
      expect(payload.hookSpecificOutput.hookEventName).toBe('UserPromptExpansion');
      expect(payload.hookSpecificOutput.additionalContext).toContain('spec-plan planning-only attention guard');
      expect(payload.hookSpecificOutput.additionalContext).toContain('planning-only');
      expect(payload.hookSpecificOutput.additionalContext).toContain('wait for the user handoff choice');
      expect(payload.hookSpecificOutput.additionalContext).toContain('Claude native Plan Mode write protection is active');
      expect(payload.hookSpecificOutput).not.toHaveProperty('decision');
      expect(payload.hookSpecificOutput.additionalContext).not.toContain('deny');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('spec-plan guard hook reads large UserPromptExpansion payloads from stdin', () => {
    const projectRoot = makeTempDir();

    try {
      const hookPath = writeRenderedSpecPlanGuardHook(projectRoot);
      const result = spawnSync('bash', [hookPath], {
        cwd: projectRoot,
        encoding: 'utf8',
        input: JSON.stringify({
          hook_event_name: 'UserPromptExpansion',
          command_name: 'spec-plan',
          permission_mode: 'default',
          prompt: 'x'.repeat(1024 * 1024),
        }),
      });

      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
      const payload = JSON.parse(result.stdout);
      expect(payload.hookSpecificOutput.hookEventName).toBe('UserPromptExpansion');
      expect(payload.hookSpecificOutput.additionalContext).toContain('best-effort attention reminder only');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test.each(['default', 'acceptEdits', 'bypassPermissions', 'auto', 'dontAsk', undefined])(
    'spec-plan guard hook marks %s permission mode as best-effort',
    (permissionMode) => {
      const projectRoot = makeTempDir();

      try {
        const hookPath = writeRenderedSpecPlanGuardHook(projectRoot);
        const input = {
          hook_event_name: 'UserPromptExpansion',
          command_name: 'spec-plan',
        };
        if (permissionMode !== undefined) {
          input.permission_mode = permissionMode;
        }

        const result = spawnSync('bash', [hookPath], {
          cwd: projectRoot,
          encoding: 'utf8',
          input: JSON.stringify(input),
        });

        expect(result.status).toBe(0);
        expect(result.stderr).toBe('');
        const payload = JSON.parse(result.stdout);
        expect(payload.hookSpecificOutput.additionalContext).toContain('best-effort attention reminder only');
        expect(payload.hookSpecificOutput.additionalContext).toContain('no hard write protection');
      } finally {
        fs.rmSync(projectRoot, { recursive: true, force: true });
      }
    },
  );

  test('spec-plan guard hook ignores non spec-plan commands', () => {
    const projectRoot = makeTempDir();

    try {
      const hookPath = writeRenderedSpecPlanGuardHook(projectRoot);
      const result = spawnSync('bash', [hookPath], {
        cwd: projectRoot,
        encoding: 'utf8',
        input: JSON.stringify({
          hook_event_name: 'UserPromptExpansion',
          command_name: 'spec-work',
          permission_mode: 'bypassPermissions',
        }),
      });

      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
      expect(result.stdout).toBe('');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('prd prewrite guard blocks first Write of ready/final PRD artifacts', () => {
    const projectRoot = makeTempDir();

    try {
      installPrdCheckerRuntime(projectRoot);
      const hookPath = writeRenderedPrdPrewriteGuardHook(projectRoot);
      const result = spawnSync('bash', [hookPath], {
        cwd: projectRoot,
        encoding: 'utf8',
        env: {
          ...process.env,
          CLAUDE_PROJECT_DIR: projectRoot,
        },
        input: JSON.stringify({
          hook_event_name: 'PreToolUse',
          tool_name: 'Write',
          tool_input: {
            file_path: path.join(projectRoot, 'docs', 'brainstorms', 'kaz-market-requirements.md'),
            content: [
              '---',
              'artifact_kind: prd-requirements',
              'status: ready-for-planning',
              '---',
              '',
              '## Summary',
              'x',
              '## Readiness Self-Check',
              'write_mode: final-prd',
              'clarification_evidence: skipped',
              'can_enter_spec_plan: yes',
              '',
            ].join('\n'),
          },
        }),
      });

      expect(result.status).toBe(2);
      expect(result.stdout).toBe('');
      expect(result.stderr).toContain('PRD prewrite guard blocked Write');
      expect(result.stderr).toContain('Requirements Grill first');
      expect(result.stderr).toContain('checker_blocking_reason_codes');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('prd prewrite guard permits non-ready checkpoint PRD writes', () => {
    const projectRoot = makeTempDir();

    try {
      installPrdCheckerRuntime(projectRoot);
      const hookPath = writeRenderedPrdPrewriteGuardHook(projectRoot);
      const result = spawnSync('bash', [hookPath], {
        cwd: projectRoot,
        encoding: 'utf8',
        env: {
          ...process.env,
          CLAUDE_PROJECT_DIR: projectRoot,
        },
        input: JSON.stringify({
          hook_event_name: 'PreToolUse',
          tool_name: 'Write',
          tool_input: {
            file_path: 'docs/brainstorms/kaz-market-requirements.md',
            content: [
              '---',
              'artifact_kind: prd-requirements',
              'status: draft',
              '---',
              '',
              '## Summary',
              'checkpoint',
              '## Readiness Self-Check',
              'write_mode: checkpoint-prd',
              'clarification_evidence: asked-owner',
              'can_enter_spec_plan: no',
              'preflight_sweep_closure: blocked',
              '',
            ].join('\n'),
          },
        }),
      });

      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
      expect(result.stdout).toBe('');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('validateClaudeSettingsFile throws when settings JSON is invalid', () => {
    const projectRoot = makeTempDir();
    const settingsPath = getClaudeSettingsPath(projectRoot);

    try {
      fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
      fs.writeFileSync(settingsPath, '{"hooks":', 'utf8');

      expect(() => validateClaudeSettingsFile(projectRoot)).toThrow();
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });
});
