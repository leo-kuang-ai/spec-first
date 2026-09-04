'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  MANAGED_SESSION_START_COMMAND,
  ZCODE_CONFIG_RELATIVE_PATH,
  ZCODE_SESSION_START_RELATIVE_PATH,
  inspectManagedZcodeConfig,
  renderManagedZcodeConfig,
  renderManagedZcodeConfigRemoval,
} = require('../../src/cli/zcode-settings');
const { getAdapter } = require('../../src/cli/adapters');

function withTempProject(files, run) {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'zcode-settings-'));
  try {
    for (const [relativePath, contents] of Object.entries(files)) {
      const target = path.join(projectRoot, relativePath);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, contents, 'utf8');
    }
    return run(projectRoot);
  } finally {
    fs.rmSync(projectRoot, { recursive: true, force: true });
  }
}

function readConfig(projectRoot) {
  return JSON.parse(fs.readFileSync(path.join(projectRoot, ZCODE_CONFIG_RELATIVE_PATH), 'utf8'));
}

function writeConfig(projectRoot, value) {
  const target = path.join(projectRoot, ZCODE_CONFIG_RELATIVE_PATH);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

describe('zcode config managed slice injection', () => {
  test('creates the hooks structure with enabled and the managed SessionStart entry when the config is absent', () => {
    withTempProject({}, (projectRoot) => {
      const rendered = renderManagedZcodeConfig(projectRoot);
      expect(rendered.blocked).toBeUndefined();

      const target = path.join(projectRoot, ZCODE_CONFIG_RELATIVE_PATH);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, rendered.contents, 'utf8');

      const config = readConfig(projectRoot);
      expect(config.hooks.enabled).toBe(true);
      expect(config.hooks.events.SessionStart).toHaveLength(1);
      expect(config.hooks.events.SessionStart[0].hooks[0]).toEqual({
        type: 'command',
        command: MANAGED_SESSION_START_COMMAND,
      });
    });
  });

  test('preserves user-owned hooks entries and other top-level config keys', () => {
    withTempProject({}, (projectRoot) => {
      writeConfig(projectRoot, {
        mcp: { servers: { 'user-tool': { command: 'user-tool' } } },
        hooks: {
          events: {
            SessionStart: [
              { hooks: [{ type: 'command', command: 'echo user-hook' }] },
            ],
            UserPromptSubmit: [
              { matcher: '.*', hooks: [{ type: 'command', command: 'echo prompt' }] },
            ],
          },
        },
      });

      const rendered = renderManagedZcodeConfig(projectRoot);
      writeConfig(projectRoot, JSON.parse(rendered.contents));

      const config = readConfig(projectRoot);
      expect(config.mcp.servers['user-tool']).toEqual({ command: 'user-tool' });
      expect(config.hooks.events.SessionStart).toHaveLength(2);
      expect(config.hooks.events.SessionStart[0].hooks[0].command).toBe('echo user-hook');
      expect(config.hooks.events.UserPromptSubmit).toHaveLength(1);
    });
  });

  test('never overwrites an explicit user hooks.enabled=false and flags it', () => {
    withTempProject({}, (projectRoot) => {
      writeConfig(projectRoot, { hooks: { enabled: false } });

      const rendered = renderManagedZcodeConfig(projectRoot);
      expect(rendered.hooksDisabledByUser).toBe(true);

      writeConfig(projectRoot, JSON.parse(rendered.contents));
      const config = readConfig(projectRoot);
      expect(config.hooks.enabled).toBe(false);
      expect(config.hooks.events.SessionStart).toHaveLength(1);
    });
  });

  test('blocks injection instead of rewriting a corrupt config file', () => {
    withTempProject({ '.zcode/config.json': '{ not valid json' }, (projectRoot) => {
      const rendered = renderManagedZcodeConfig(projectRoot);
      expect(rendered.blocked).toBe('zcode_config_unreadable');
      expect(rendered.contents).toBeUndefined();

      const raw = fs.readFileSync(path.join(projectRoot, ZCODE_CONFIG_RELATIVE_PATH), 'utf8');
      expect(raw).toBe('{ not valid json');

      const inspection = inspectManagedZcodeConfig(projectRoot);
      expect(inspection[0].reasonCode).toBe('zcode_config_unreadable');
    });
  });

  test('is idempotent: re-rendering an already-managed config keeps exactly one managed entry', () => {
    withTempProject({}, (projectRoot) => {
      const first = renderManagedZcodeConfig(projectRoot);
      writeConfig(projectRoot, JSON.parse(first.contents));
      const second = renderManagedZcodeConfig(projectRoot);
      writeConfig(projectRoot, JSON.parse(second.contents));

      const config = readConfig(projectRoot);
      expect(config.hooks.events.SessionStart).toHaveLength(1);
      expect(second.contents).toBe(first.contents);
    });
  });
});

describe('zcode config managed slice removal', () => {
  test('removes the managed entry and keeps user-owned config content', () => {
    withTempProject({}, (projectRoot) => {
      const installed = renderManagedZcodeConfig(projectRoot);
      const config = JSON.parse(installed.contents);
      config.mcp = { servers: { 'user-tool': { command: 'user-tool' } } };
      config.hooks.events.SessionStart.push({ hooks: [{ type: 'command', command: 'echo user-hook' }] });
      writeConfig(projectRoot, config);

      const removal = renderManagedZcodeConfigRemoval(projectRoot);
      expect(removal.existsAfter).toBe(true);
      writeConfig(projectRoot, JSON.parse(removal.contents));

      const after = readConfig(projectRoot);
      expect(after.hooks.events.SessionStart).toHaveLength(1);
      expect(after.hooks.events.SessionStart[0].hooks[0].command).toBe('echo user-hook');
      expect(after.mcp.servers['user-tool']).toBeDefined();
    });
  });

  test('keeps the file with the harmless enabled flag when only spec-first content remains', () => {
    withTempProject({}, (projectRoot) => {
      const installed = renderManagedZcodeConfig(projectRoot);
      writeConfig(projectRoot, JSON.parse(installed.contents));

      // Ownership: a leftover hooks.enabled cannot be attributed to spec-first,
      // so removal preserves it rather than deleting the file.
      const removal = renderManagedZcodeConfigRemoval(projectRoot);
      expect(removal.existsAfter).toBe(true);
      writeConfig(projectRoot, JSON.parse(removal.contents));

      const after = readConfig(projectRoot);
      expect(after).toEqual({ hooks: { enabled: true } });
    });
  });

  test('never deletes a user-written hooks.enabled=false on removal', () => {
    withTempProject({}, (projectRoot) => {
      const installed = renderManagedZcodeConfig(projectRoot);
      const config = JSON.parse(installed.contents);
      config.hooks.enabled = false;
      writeConfig(projectRoot, config);

      const removal = renderManagedZcodeConfigRemoval(projectRoot);
      writeConfig(projectRoot, JSON.parse(removal.contents));

      const after = readConfig(projectRoot);
      expect(after).toEqual({ hooks: { enabled: false } });
    });
  });

  test('returns null when nothing managed is present', () => {
    withTempProject({ '.zcode/config.json': '{"mcp":{"servers":{}}}' }, (projectRoot) => {
      expect(renderManagedZcodeConfigRemoval(projectRoot)).toBeNull();
    });
  });
});

describe('zcode adapter runtime file planning (hooks)', () => {
  const zcode = getAdapter('zcode');

  test('plans the hook script write and the config managed slice write', () => {
    withTempProject({}, (projectRoot) => {
      const plan = zcode.planRuntimeFilesSync(projectRoot);
      const paths = plan.operations.map((operation) => operation.path);
      expect(paths).toContain(ZCODE_SESSION_START_RELATIVE_PATH);
      expect(paths).toContain(ZCODE_CONFIG_RELATIVE_PATH);
      expect(plan.skippedConfigWrite).toBe(false);

      const hookWrite = plan.operations.find((operation) => operation.path === ZCODE_SESSION_START_RELATIVE_PATH);
      expect(hookWrite.mode).toBe(0o755);
      expect(hookWrite.contents).toContain("'startup-reminder', '--zcode'");
      expect(hookWrite.contents).toContain('ZCODE_PROJECT_DIR');
    });
  });

  test('skips the config write when the existing config is corrupt', () => {
    withTempProject({ '.zcode/config.json': 'broken {' }, (projectRoot) => {
      const plan = zcode.planRuntimeFilesSync(projectRoot);
      expect(plan.skippedConfigWrite).toBe(true);
      expect(plan.configWriteBlockReason).toContain('not readable JSON');
      expect(plan.operations.map((operation) => operation.path)).not.toContain(ZCODE_CONFIG_RELATIVE_PATH);
    });
  });

  test('inspects the hook script and config with actionable warnings', () => {
    withTempProject({}, (projectRoot) => {
      const missing = zcode.inspectRuntimeFiles(projectRoot);
      expect(missing).toHaveLength(2);
      expect(missing.every((entry) => entry.level === 'WARNING')).toBe(true);

      const plan = zcode.planRuntimeFilesSync(projectRoot);
      const hookDir = path.join(projectRoot, path.dirname(ZCODE_SESSION_START_RELATIVE_PATH));
      fs.mkdirSync(hookDir, { recursive: true });
      fs.writeFileSync(path.join(projectRoot, ZCODE_SESSION_START_RELATIVE_PATH), plan.operations[0].contents, 'utf8');
      fs.writeFileSync(path.join(projectRoot, ZCODE_CONFIG_RELATIVE_PATH), plan.operations[1].contents, 'utf8');

      const present = zcode.inspectRuntimeFiles(projectRoot);
      expect(present[0].level).toBe('PASS');
      expect(present[1].level).toBe('WARNING');
      expect(present[1].reasonCode).toBe('zcode_activation_unverified');
    });
  });

  test('removal plans both the hook script and the managed config entry', () => {
    withTempProject({}, (projectRoot) => {
      const plan = zcode.planRuntimeFilesSync(projectRoot);
      for (const operation of plan.operations) {
        const target = path.join(projectRoot, operation.path);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, operation.contents, 'utf8');
      }

      const removal = zcode.planRuntimeFilesRemoval(projectRoot);
      const kinds = removal.operations.map((operation) => operation.kind);
      expect(kinds).toContain('remove_file');
      expect(removal.operations.some((operation) => operation.path === ZCODE_SESSION_START_RELATIVE_PATH)).toBe(true);
      expect(removal.operations.some((operation) => operation.path === ZCODE_CONFIG_RELATIVE_PATH)).toBe(true);
    });
  });
});
