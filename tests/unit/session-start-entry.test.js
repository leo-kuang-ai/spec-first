'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { buildManagedBlock } = require('../../src/cli/lang-policy');

const repoRoot = path.join(__dirname, '..', '..');

function tempProject(host) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `spec-first-${host}-session-start-`));
}

function writeText(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value);
}

describe('SessionStart using-spec-first entry pointer', () => {
  test.each([
    {
      host: 'claude',
      instructionFile: 'CLAUDE.md',
      runtimeSkill: '.claude/skills/using-spec-first/SKILL.md',
      envName: 'CLAUDE_PROJECT_DIR',
      input: undefined,
    },
    {
      host: 'codex',
      instructionFile: 'AGENTS.md',
      runtimeSkill: '.agents/skills/using-spec-first/SKILL.md',
      envName: 'CODEX_PROJECT_DIR',
      input: '{}',
    },
    {
      host: 'qoder',
      instructionFile: 'AGENTS.md',
      runtimeSkill: '.qoder/skills/using-spec-first/SKILL.md',
      envName: 'QODER_PROJECT_DIR',
      input: '{}',
    },
  ])('$host recognizes the new managed block and emits its runtime path', ({
    host,
    instructionFile,
    runtimeSkill,
    envName,
    input,
  }) => {
    const projectRoot = tempProject(host);
    const hookPath = path.join(repoRoot, 'templates', host, 'hooks', 'session-start');
    writeText(path.join(projectRoot, instructionFile), buildManagedBlock('en'));
    writeText(path.join(projectRoot, runtimeSkill), '---\nname: using-spec-first\n---\n');

    const result = spawnSync(process.execPath, [hookPath], {
      cwd: projectRoot,
      input,
      encoding: 'utf8',
      env: { ...process.env, [envName]: projectRoot },
    });

    expect(result.status).toBe(0);
    const output = JSON.parse(result.stdout);
    expect(output.hookSpecificOutput.additionalContext).toContain(
      `Full routing policy: ${runtimeSkill}.`,
    );
    expect(output.hookSpecificOutput.additionalContext).not.toContain(
      'Full routing policy: skills/using-spec-first/SKILL.md.',
    );
  });
});

// A managed SessionStart command is shell-quoted, so an installation path containing a space
// (`/Users/me/My Projects/repo`) is still one token. Failing to recognize it as managed left the
// stale entry in place and appended a second one on every refresh.
describe('codex managed SessionStart staleness detection', () => {
  const CodexAdapter = require('../../src/cli/adapters/codex');

  function projectRootWithManagedHook(dirName) {
    const parent = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-codex-stale-')));
    const projectRoot = path.join(parent, dirName, 'repo');
    const hookPath = path.join(projectRoot, '.codex', 'hooks', 'session-start');
    fs.mkdirSync(path.dirname(hookPath), { recursive: true });
    const managedCommand = `'/usr/local/bin/node' '${hookPath.split(path.sep).join('/')}'`;
    writeText(path.join(projectRoot, '.codex', 'hooks.json'), JSON.stringify({
      hooks: { SessionStart: [{ hooks: [{ type: 'command', command: managedCommand }] }] },
    }));
    return projectRoot;
  }

  function sessionStartHookCountAfterRefresh(projectRoot) {
    const operations = new CodexAdapter().planRuntimeFilesSync(projectRoot).operations;
    const write = operations.find((operation) => operation.path && operation.path.endsWith('.codex/hooks.json'));
    expect(write).toBeDefined();
    const entries = JSON.parse(write.contents).hooks.SessionStart || [];
    return entries.reduce((total, entry) => total + (Array.isArray(entry.hooks) ? entry.hooks.length : 0), 0);
  }

  test.each([['My Projects'], ['plain']])(
    'replaces rather than duplicates the managed hook under a path segment %s',
    (dirName) => {
      expect(sessionStartHookCountAfterRefresh(projectRootWithManagedHook(dirName))).toBe(1);
    },
  );

  test('preserves a user wrapper command that only mentions the managed path', () => {
    const parent = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-codex-wrapper-')));
    const projectRoot = path.join(parent, 'My Projects', 'repo');
    fs.mkdirSync(path.join(projectRoot, '.codex', 'hooks'), { recursive: true });
    const userCommand = 'my-wrapper bash .codex/hooks/session-start && echo done';
    writeText(path.join(projectRoot, '.codex', 'hooks.json'), JSON.stringify({
      hooks: { SessionStart: [{ hooks: [{ type: 'command', command: userCommand }] }] },
    }));

    const operations = new CodexAdapter().planRuntimeFilesSync(projectRoot).operations;
    const write = operations.find((operation) => operation.path && operation.path.endsWith('.codex/hooks.json'));
    const commands = (JSON.parse(write.contents).hooks.SessionStart || [])
      .flatMap((entry) => (Array.isArray(entry.hooks) ? entry.hooks : []))
      .map((hook) => hook.command);

    expect(commands).toContain(userCommand);
  });
});

// `.codex/hooks.json` is a mixed-ownership file: removing it because no managed hook entries
// remain would also discard unrelated top-level keys the user keeps there.
describe('codex hooks.json removal preserves user-owned top-level keys', () => {
  const CodexAdapter = require('../../src/cli/adapters/codex');

  function planRemoval(hooksJson) {
    const projectRoot = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-codex-hooks-')));
    const hookPath = path.join(projectRoot, '.codex', 'hooks', 'session-start');
    fs.mkdirSync(path.dirname(hookPath), { recursive: true });
    writeText(path.join(projectRoot, '.codex', 'hooks.json'), JSON.stringify(hooksJson(hookPath)));
    const operations = new CodexAdapter().planRuntimeFilesRemoval(projectRoot).operations;
    return operations.find((operation) => operation.path === '.codex/hooks.json');
  }

  function managedCommand(hookPath) {
    return `'/usr/local/bin/node' '${hookPath.split(path.sep).join('/')}'`;
  }

  test('keeps the file and its user keys when only managed hooks are removed', () => {
    const operation = planRemoval((hookPath) => ({
      version: 1,
      myCustomSetting: { retries: 3 },
      hooks: { SessionStart: [{ hooks: [{ type: 'command', command: managedCommand(hookPath) }] }] },
    }));

    expect(operation.kind).toBe('update_file');
    const remaining = JSON.parse(operation.contents);
    expect(remaining.version).toBe(1);
    expect(remaining.myCustomSetting).toEqual({ retries: 3 });
    expect(remaining.hooks.SessionStart).toBeUndefined();
  });

  test('still removes the file when nothing user-owned is left', () => {
    const operation = planRemoval((hookPath) => ({
      hooks: { SessionStart: [{ hooks: [{ type: 'command', command: managedCommand(hookPath) }] }] },
    }));

    expect(operation.kind).toBe('remove_file');
  });
});
