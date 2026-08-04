'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  applyHostConfig,
  inspectHostConfig,
  resolveHostConfigTarget,
} = require('../../skills/spec-runtime-setup/scripts/lib/host-config.cjs');
const {
  createOpenCodePermissionEditor,
  deriveOpenCodePermissionPolicy,
  validateOpenCodePermissionPolicy,
} = require('../../skills/spec-runtime-setup/scripts/lib/opencode-permissions.cjs');

const SMALL_ASSET_SET = Object.freeze({
  workflowSkills: ['spec-work', 'using-spec-first'],
  skills: ['spec-debug'],
  internalSkills: ['spec-worktree'],
});

function tempDir(label) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `spec-first-opencode-permissions-${label}-`));
}

function authority() {
  return {
    ok: true,
    explicit: true,
    mutation_allowed: true,
    host: 'opencode',
  };
}

function openCodeEntry() {
  return {
    id: 'context7',
    detection: { key: 'context7' },
    host_config: {
      command: 'npx',
      args: ['-y', '@upstash/context7-mcp@latest'],
      json_container_path: ['mcp'],
      server_representation: 'opencode-local',
      permission_policy: { kind: 'opencode-governed-assets-v1' },
      targets: {
        project: {
          config_path: 'opencode.json',
          config_format: 'json',
          precedence: 50,
        },
      },
      fallback_order: ['project'],
    },
  };
}

function targetFor(repoRoot, entry = openCodeEntry()) {
  return resolveHostConfigTarget({
    entry,
    host: 'opencode',
    authority: authority(),
    repoRoot,
    homeDir: path.join(repoRoot, 'home'),
    env: {},
    userScope: false,
    requireWritable: true,
  });
}

function smallEditor() {
  const result = createOpenCodePermissionEditor({
    host: 'opencode',
    assetSet: SMALL_ASSET_SET,
  });
  expect(result).toMatchObject({ ok: true, applicable: true });
  return result.editor;
}

describe('OpenCode permission policy derivation', () => {
  test('derives exact governed skill rules including using-spec-first without wildcard allow', () => {
    const result = deriveOpenCodePermissionPolicy({ assetSet: SMALL_ASSET_SET });

    expect(result).toMatchObject({ ok: true, reason_code: 'opencode-permission-policy-derived' });
    expect(result.policy.skill_names).toEqual([
      'spec-debug',
      'spec-work',
      'spec-worktree',
      'using-spec-first',
    ]);
    expect(result.policy.permission_entries.skill).toEqual({
      'spec-debug': 'allow',
      'spec-work': 'allow',
      'spec-worktree': 'allow',
      'using-spec-first': 'allow',
    });
    expect(result.policy.permission_entries).toMatchObject({
      bash: 'ask',
      edit: 'ask',
      task: 'ask',
      webfetch: 'ask',
      websearch: 'ask',
    });
    expect(result.policy.permission_entries).not.toHaveProperty('*');
    expect(result.policy.skill_names.every((name) => !/[?*]/.test(name))).toBe(true);
  });

  test('rejects wildcard skill names and global allow before mutation', () => {
    const derived = deriveOpenCodePermissionPolicy({ assetSet: SMALL_ASSET_SET });
    const wildcardSkill = structuredClone(derived.policy);
    wildcardSkill.skill_names.push('spec-*');
    wildcardSkill.permission_entries.skill['spec-*'] = 'allow';
    expect(validateOpenCodePermissionPolicy(wildcardSkill)).toMatchObject({
      ok: false,
      reason_code: 'opencode-permission-wildcard-rejected',
    });

    const globalAllow = structuredClone(derived.policy);
    globalAllow.permission_entries['*'] = 'allow';
    expect(validateOpenCodePermissionPolicy(globalAllow)).toMatchObject({
      ok: false,
      reason_code: 'opencode-permission-global-allow-rejected',
    });
  });

  test('does not derive or execute the translator for non-OpenCode hosts', () => {
    const buildAssetSet = jest.fn(() => {
      throw new Error('should not run');
    });
    const result = createOpenCodePermissionEditor({
      host: 'codex',
      buildAssetSet,
    });

    expect(result).toEqual({
      ok: true,
      applicable: false,
      editor: null,
      reason_code: 'opencode-permission-not-applicable',
    });
    expect(buildAssetSet).not.toHaveBeenCalled();
  });

  test('derives exact governed skills from the projected OpenCode runtime state', () => {
    const repoRoot = tempDir('projected-state');
    const skillRoot = path.join(repoRoot, '.opencode', 'skills', 'spec-runtime-setup');
    const statePath = path.join(repoRoot, '.opencode', 'spec-first', 'state.json');
    fs.mkdirSync(skillRoot, { recursive: true });
    fs.mkdirSync(path.dirname(statePath), { recursive: true });
    fs.writeFileSync(statePath, `${JSON.stringify({
      manifestVersion: '1.13.2',
      platform: 'opencode',
      skills: ['using-spec-first', 'spec-worktree'],
      workflowSkills: ['spec-work', 'spec-debug'],
      agents: [],
      agentSupportFiles: [],
    }, null, 2)}\n`);

    const result = deriveOpenCodePermissionPolicy({ skillRoot });

    expect(result).toMatchObject({ ok: true, reason_code: 'opencode-permission-policy-derived' });
    expect(result.policy.skill_names).toEqual([
      'spec-debug',
      'spec-work',
      'spec-worktree',
      'using-spec-first',
    ]);
  });

  test('fails closed when projected OpenCode runtime state is unavailable', () => {
    const result = deriveOpenCodePermissionPolicy({
      skillRoot: path.join(tempDir('missing-projected-state'), '.opencode', 'skills', 'spec-runtime-setup'),
    });

    expect(result).toEqual({
      ok: false,
      reason_code: 'opencode-permission-runtime-state-unavailable',
    });
  });

  test('fails closed when projected OpenCode runtime state contains non-canonical skill names', () => {
    const repoRoot = tempDir('invalid-projected-state');
    const skillRoot = path.join(repoRoot, '.opencode', 'skills', 'spec-runtime-setup');
    const statePath = path.join(repoRoot, '.opencode', 'spec-first', 'state.json');
    fs.mkdirSync(skillRoot, { recursive: true });
    fs.mkdirSync(path.dirname(statePath), { recursive: true });
    fs.writeFileSync(statePath, `${JSON.stringify({
      platform: 'opencode',
      skills: ['using-spec-first', '*'],
      workflowSkills: ['spec-work'],
    }, null, 2)}\n`);

    expect(deriveOpenCodePermissionPolicy({ skillRoot })).toEqual({
      ok: false,
      reason_code: 'opencode-permission-runtime-state-invalid',
    });
  });
});

describe('OpenCode permission ordering and conflict safety', () => {
  test('adds missing exact skills after user wildcards and keeps dangerous tools at ask', () => {
    const editor = smallEditor();
    const config = {
      permission: {
        '*': 'allow',
        skill: { '*': 'deny' },
      },
      user_field: { preserved: true },
    };

    const mutated = editor.mutate(config, { operation: 'upsert' });

    expect(mutated).toMatchObject({ ok: true, changed: true });
    expect(mutated.value.user_field).toEqual({ preserved: true });
    expect(Object.keys(mutated.value.permission).slice(-5)).toEqual([
      'bash',
      'edit',
      'task',
      'webfetch',
      'websearch',
    ]);
    expect(mutated.value.permission.skill).toMatchObject({
      '*': 'deny',
      'spec-debug': 'allow',
      'spec-work': 'allow',
      'spec-worktree': 'allow',
      'using-spec-first': 'allow',
    });
    expect(editor.inspect(mutated.value, { operation: 'upsert' })).toMatchObject({
      ok: true,
      configured: true,
      conflict: false,
      permission_status: 'ready',
    });
  });

  test('fails closed when an existing exact skill rule is overridden by a later wildcard', () => {
    const editor = smallEditor();
    const config = {
      permission: {
        skill: {
          'spec-work': 'allow',
          '*': 'deny',
        },
      },
    };

    expect(editor.inspect(config, { operation: 'upsert' })).toMatchObject({
      ok: true,
      configured: false,
      conflict: true,
      reason_code: 'host-config-opencode-permission-order-unsafe',
      conflict_fields: expect.arrayContaining(['permission.skill.spec-work']),
    });
    expect(editor.mutate(config, { operation: 'upsert' })).toMatchObject({
      ok: false,
      reason_code: 'host-config-opencode-permission-order-unsafe',
    });
    expect(config.permission.skill).toEqual({ 'spec-work': 'allow', '*': 'deny' });
  });

  test('preserves explicit deny but rejects dangerous allow and unsafe pattern maps', () => {
    const editor = smallEditor();
    const safeDeny = editor.mutate({ permission: { bash: 'deny' } }, { operation: 'upsert' });
    expect(safeDeny).toMatchObject({ ok: true });
    expect(safeDeny.value.permission.bash).toBe('deny');

    expect(editor.inspect({ permission: { bash: 'allow' } }, { operation: 'upsert' })).toMatchObject({
      configured: false,
      conflict: true,
      reason_code: 'host-config-opencode-permission-conflict',
      conflict_fields: expect.arrayContaining(['permission.bash']),
    });
    expect(editor.inspect({
      permission: { bash: { '*': 'ask', 'git *': 'allow' } },
    }, { operation: 'upsert' })).toMatchObject({
      configured: false,
      conflict: true,
      reason_code: 'host-config-opencode-permission-order-unsafe',
    });
  });
});

describe('OpenCode MCP and permission bounded transaction', () => {
  test('writes MCP and permissions together and verifies the combined document', () => {
    const repoRoot = tempDir('combined-success');
    const entry = openCodeEntry();
    const target = targetFor(repoRoot, entry);
    const editor = smallEditor();
    fs.writeFileSync(target.config_path, `${JSON.stringify({ user_field: true }, null, 2)}\n`);

    const result = applyHostConfig({ entry, target, jsonDocumentPolicy: editor });
    const value = JSON.parse(fs.readFileSync(target.config_path, 'utf8'));

    expect(result).toMatchObject({
      ok: true,
      changed: true,
      post_write_verified: true,
      permission_status: 'ready',
    });
    expect(value.user_field).toBe(true);
    expect(value.mcp.context7).toEqual({
      type: 'local',
      command: ['npx', '-y', '@upstash/context7-mcp@latest'],
    });
    expect(value.permission.skill['using-spec-first']).toBe('allow');
    expect(value.permission.bash).toBe('ask');
    expect(inspectHostConfig({ entry, target, jsonDocumentPolicy: editor })).toMatchObject({
      ok: true,
      configured: true,
      permission_status: 'ready',
    });
  });

  test('returns action-required with zero mutation when permission conflicts', () => {
    const repoRoot = tempDir('combined-conflict');
    const entry = openCodeEntry();
    const target = targetFor(repoRoot, entry);
    const editor = smallEditor();
    const original = `${JSON.stringify({ permission: { bash: 'allow' }, user_field: true }, null, 2)}\n`;
    fs.writeFileSync(target.config_path, original);

    const result = applyHostConfig({ entry, target, jsonDocumentPolicy: editor });

    expect(result).toMatchObject({
      ok: false,
      changed: false,
      reason_code: 'host-config-opencode-permission-conflict',
    });
    expect(fs.readFileSync(target.config_path, 'utf8')).toBe(original);
    expect(JSON.parse(original)).not.toHaveProperty('mcp');
    expect(fs.readdirSync(repoRoot).filter((name) => name.includes('.spec-first.'))).toEqual([]);
  });

  test('keeps a compatible combined document byte-stable', () => {
    const repoRoot = tempDir('combined-current');
    const entry = openCodeEntry();
    const target = targetFor(repoRoot, entry);
    const editor = smallEditor();
    expect(applyHostConfig({ entry, target, jsonDocumentPolicy: editor })).toMatchObject({ ok: true, changed: true });
    const current = fs.readFileSync(target.config_path, 'utf8');

    expect(applyHostConfig({ entry, target, jsonDocumentPolicy: editor })).toMatchObject({
      ok: true,
      changed: false,
      reason_code: 'host-config-already-current',
      permission_status: 'ready',
    });
    expect(fs.readFileSync(target.config_path, 'utf8')).toBe(current);
  });

  test('removes only exact permission rules together with the exact MCP entry', () => {
    const repoRoot = tempDir('combined-remove');
    const entry = openCodeEntry();
    const target = targetFor(repoRoot, entry);
    const editor = smallEditor();
    fs.writeFileSync(target.config_path, `${JSON.stringify({
      permission: { custom_tool: 'deny' },
      user_field: true,
    }, null, 2)}\n`);
    expect(applyHostConfig({ entry, target, jsonDocumentPolicy: editor })).toMatchObject({ ok: true });

    const removed = applyHostConfig({
      entry,
      target,
      operation: 'remove',
      jsonDocumentPolicy: editor,
    });
    const value = JSON.parse(fs.readFileSync(target.config_path, 'utf8'));

    expect(removed).toMatchObject({
      ok: true,
      changed: true,
      reason_code: 'host-config-removed',
      permission_status: 'removed',
    });
    expect(value.mcp).not.toHaveProperty('context7');
    expect(value.permission.custom_tool).toBe('deny');
    expect(value.permission).not.toHaveProperty('bash');
    expect(value.permission.skill).not.toHaveProperty('using-spec-first');
    expect(value.user_field).toBe(true);
  });

  test('preserves the whole document when exact permission uninstall ownership conflicts', () => {
    const repoRoot = tempDir('combined-remove-conflict');
    const entry = openCodeEntry();
    const target = targetFor(repoRoot, entry);
    const editor = smallEditor();
    expect(applyHostConfig({ entry, target, jsonDocumentPolicy: editor })).toMatchObject({ ok: true });
    const value = JSON.parse(fs.readFileSync(target.config_path, 'utf8'));
    value.permission.bash = 'allow';
    const original = `${JSON.stringify(value, null, 2)}\n`;
    fs.writeFileSync(target.config_path, original);

    expect(applyHostConfig({
      entry,
      target,
      operation: 'remove',
      jsonDocumentPolicy: editor,
    })).toMatchObject({
      ok: false,
      changed: false,
      reason_code: 'host-config-uninstall-conflict',
      conflict_fields: expect.arrayContaining(['permission.bash']),
    });
    expect(fs.readFileSync(target.config_path, 'utf8')).toBe(original);
  });

  test('removes exact orphaned permission rules even when the MCP entry is already absent', () => {
    const repoRoot = tempDir('combined-remove-orphan');
    const entry = openCodeEntry();
    const target = targetFor(repoRoot, entry);
    const editor = smallEditor();
    const installed = editor.mutate({ user_field: true }, { operation: 'upsert' });
    fs.writeFileSync(target.config_path, `${JSON.stringify(installed.value, null, 2)}\n`);

    expect(applyHostConfig({
      entry,
      target,
      operation: 'remove',
      jsonDocumentPolicy: editor,
    })).toMatchObject({
      ok: true,
      changed: true,
      permission_status: 'removed',
    });
    const value = JSON.parse(fs.readFileSync(target.config_path, 'utf8'));
    expect(value).not.toHaveProperty('mcp');
    expect(value.permission).not.toHaveProperty('bash');
    expect(value.permission.skill).not.toHaveProperty('spec-work');
    expect(value.user_field).toBe(true);
  });

  test('restores MCP and permission changes together when the bounded transaction fails', () => {
    const repoRoot = tempDir('combined-rollback');
    const entry = openCodeEntry();
    const target = targetFor(repoRoot, entry);
    const editor = smallEditor();
    const original = `${JSON.stringify({ user_field: true }, null, 2)}\n`;
    fs.writeFileSync(target.config_path, original);

    const result = applyHostConfig({
      entry,
      target,
      jsonDocumentPolicy: editor,
      faultInjector(stage) {
        if (stage === 'after-replace') throw new Error('combined transaction fault');
      },
    });

    expect(result).toMatchObject({
      ok: false,
      changed: false,
      reason_code: 'host-config-write-failed',
      restore: { status: 'restored' },
    });
    expect(fs.readFileSync(target.config_path, 'utf8')).toBe(original);
    expect(fs.readdirSync(repoRoot).filter((name) => name.includes('.spec-first.'))).toEqual([]);
  });
});
