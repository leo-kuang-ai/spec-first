'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { runClean } = require('../../src/cli/commands/clean');
const { getAdapter } = require('../../src/cli/adapters');
const { readState } = require('../../src/cli/state');
const { runProgrammaticInit, useIsolatedDeveloperHome } = require('./helpers/init-plan');

useIsolatedDeveloperHome();

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-clean-dry-run-'));
}

function withCwd(cwd, fn) {
  const previous = process.cwd();
  process.chdir(cwd);
  try {
    return fn();
  } finally {
    process.chdir(previous);
  }
}

function captureCommand(cwd, runner, args) {
  const logs = [];
  const errors = [];
  const originalLog = console.log;
  const originalError = console.error;
  console.log = (message = '') => logs.push(String(message));
  console.error = (message = '') => errors.push(String(message));
  try {
    const exitCode = withCwd(cwd, () => runner(args));
    return {
      exitCode,
      stdout: logs.join('\n'),
      stderr: errors.join('\n'),
    };
  } finally {
    console.log = originalLog;
    console.error = originalError;
  }
}

function snapshotTree(rootDir) {
  const results = [];

  function walk(currentDir) {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const absolutePath = path.join(currentDir, entry.name);
      const relativePath = path.relative(rootDir, absolutePath);
      if (entry.isDirectory()) {
        results.push(`${relativePath}/`);
        walk(absolutePath);
        continue;
      }

      const content = fs.readFileSync(absolutePath, 'utf8');
      results.push(`${relativePath}:${content}`);
    }
  }

  walk(rootDir);
  return results.sort();
}

describe('clean --dry-run', () => {
  test('Claude clean --dry-run previews managed deletions without touching custom assets', () => {
    const projectRoot = makeTempDir();
    const initLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    try {
      expect(withCwd(projectRoot, () => runProgrammaticInit({ projectRoot, platform: 'claude' }))).toBe(0);

      const customSkillPath = path.join(projectRoot, '.claude', 'skills', 'custom-skill', 'SKILL.md');
      const customHookPath = path.join(projectRoot, '.claude', 'hooks', 'custom-hook');
      fs.mkdirSync(path.dirname(customSkillPath), { recursive: true });
      fs.writeFileSync(customSkillPath, 'name: custom-skill\n', 'utf8');
      fs.writeFileSync(customHookPath, '#!/bin/bash\n', 'utf8');

      const before = snapshotTree(projectRoot);
      const result = captureCommand(projectRoot, runClean, ['--claude', '--dry-run']);
      const after = snapshotTree(projectRoot);

      expect(result.exitCode).toBe(0);
      expect(result.stderr).toBe('');
      expect(after).toEqual(before);
      expect(result.stdout).toContain('Dry run: spec-first clean (claude)');
      expect(result.stdout).toContain('Would remove');
      expect(result.stdout).toContain('.claude/spec-first/state.json');
      expect(result.stdout).toContain('.claude/hooks/session-start');
      expect(result.stdout).toContain('.claude/hooks/spec-plan-guard');
      expect(result.stdout).toContain('.claude/hooks/prd-prewrite-guard');
      expect(result.stdout).toContain('.claude/hooks/prd-readiness-guard');
      expect(result.stdout).toContain('.claude/settings.json');
      expect(result.stdout).toContain('CLAUDE.md');
      expect(result.stdout).toContain('Custom assets outside the spec-first managed set would remain untouched.');
      expect(result.stdout).toContain('No files were changed.');
      expect(fs.existsSync(customSkillPath)).toBe(true);
      expect(fs.existsSync(customHookPath)).toBe(true);
    } finally {
      initLogSpy.mockRestore();
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('Claude clean apply matches the high-value paths promised by dry-run', () => {
    const projectRoot = makeTempDir();
    const initLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    try {
      expect(withCwd(projectRoot, () => runProgrammaticInit({ projectRoot, platform: 'claude' }))).toBe(0);

      const dryRun = captureCommand(projectRoot, runClean, ['--claude', '--dry-run']);
      expect(dryRun.exitCode).toBe(0);

      const cleanResult = captureCommand(projectRoot, runClean, ['--claude']);
      expect(cleanResult.exitCode).toBe(0);
      expect(cleanResult.stdout).toContain('Apply: spec-first clean (claude)');
      expect(cleanResult.stdout).toContain('Removing');
      expect(cleanResult.stdout).toContain('Updating');
      expect(cleanResult.stdout).toContain('Empty managed roots are removed during cleanup.');
      expect(cleanResult.stdout).toContain('.claude/spec-first/state.json');
      expect(cleanResult.stdout).toContain('.claude/hooks/session-start');
      expect(cleanResult.stdout).toContain('Custom assets outside the spec-first managed set are left untouched.');
      expect(cleanResult.stdout).not.toContain('Would remove');
      expect(cleanResult.stdout).not.toContain('Would update');
      expect(cleanResult.stdout).not.toContain('empty managed root(s) after cleanup.');
      expect(cleanResult.stdout).not.toContain('No files were changed.');

      const removedPaths = [
        '.claude/spec-first/state.json',
        '.claude/hooks/session-start',
        '.claude/hooks/spec-plan-guard',
        '.claude/hooks/prd-prewrite-guard',
        '.claude/hooks/prd-readiness-guard',
        '.claude/settings.json',
      ];
      for (const relativePath of removedPaths) {
        expect(dryRun.stdout).toContain(relativePath);
        expect(fs.existsSync(path.join(projectRoot, relativePath))).toBe(false);
      }

      expect(dryRun.stdout).toContain('CLAUDE.md');
      expect(fs.existsSync(path.join(projectRoot, 'CLAUDE.md'))).toBe(true);
      const claudeInstructionPath = path.join(projectRoot, 'CLAUDE.md');
      const claudeInstruction = fs.readFileSync(claudeInstructionPath, 'utf8');
      expect(claudeInstruction).not.toContain('spec-first:bootstrap:start');
      expect(claudeInstruction).not.toContain('spec-first:coding-guidelines:start');
      expect(claudeInstruction).not.toContain('spec-first:runtime-tools:start');
    } finally {
      initLogSpy.mockRestore();
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('Claude clean dry-run keeps empty-root preview in the summary', () => {
    const projectRoot = makeTempDir();
    const initLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    try {
      expect(withCwd(projectRoot, () => runProgrammaticInit({ projectRoot, platform: 'claude' }))).toBe(0);

      fs.rmSync(path.join(projectRoot, '.claude', 'skills'), { recursive: true, force: true });
      fs.mkdirSync(path.join(projectRoot, '.claude', 'skills'), { recursive: true });

      const result = captureCommand(projectRoot, runClean, ['--claude', '--dry-run']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Would remove 1 empty managed root(s) after cleanup.');
      expect(result.stdout).toContain('No files were changed.');
    } finally {
      initLogSpy.mockRestore();
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('Codex clean preserves provider-owned Graphify runtime while removing managed and legacy assets', () => {
    const projectRoot = makeTempDir();
    const initLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const legacyPaths = [
      '.codex/commands/spec',
      '.codex/spec-first/commands',
      '.agents/plugins',
      'plugins/spec',
      'plugins/spec-first',
    ];
    const providerOwnedGraphifySkill = '.codex/skills/graphify/SKILL.md';
    const staleLegacySpecFirstSkill = '.codex/skills/work/SKILL.md';
    const graphifyHook = {
      matcher: 'Bash',
      hooks: [
        {
          type: 'command',
          command: 'graphify hook status --refresh',
        },
      ],
    };

    try {
      expect(withCwd(projectRoot, () => runProgrammaticInit({ projectRoot, platform: 'codex' }))).toBe(0);
      for (const relativePath of legacyPaths) {
        fs.mkdirSync(path.join(projectRoot, relativePath), { recursive: true });
      }
      fs.mkdirSync(path.dirname(path.join(projectRoot, providerOwnedGraphifySkill)), { recursive: true });
      fs.writeFileSync(path.join(projectRoot, providerOwnedGraphifySkill), '# graphify\n', 'utf8');
      fs.mkdirSync(path.dirname(path.join(projectRoot, staleLegacySpecFirstSkill)), { recursive: true });
      fs.writeFileSync(path.join(projectRoot, staleLegacySpecFirstSkill), '# stale spec-first work\n', 'utf8');
      const hooksPath = path.join(projectRoot, '.codex', 'hooks.json');
      const hooksJson = JSON.parse(fs.readFileSync(hooksPath, 'utf8'));
      hooksJson.hooks.PreToolUse = [graphifyHook];
      fs.writeFileSync(hooksPath, `${JSON.stringify(hooksJson, null, 2)}\n`, 'utf8');

      const dryRun = captureCommand(projectRoot, runClean, ['--codex', '--dry-run']);
      expect(dryRun.exitCode).toBe(0);

      const cleanResult = captureCommand(projectRoot, runClean, ['--codex']);
      expect(cleanResult.exitCode).toBe(0);

      for (const relativePath of legacyPaths) {
        expect(dryRun.stdout).toContain(relativePath);
        expect(fs.existsSync(path.join(projectRoot, relativePath))).toBe(false);
      }
      for (const relativePath of ['.codex/hooks/session-start']) {
        expect(dryRun.stdout).toContain(relativePath);
        expect(fs.existsSync(path.join(projectRoot, relativePath))).toBe(false);
      }
      expect(dryRun.stdout).toContain('.codex/hooks.json');
      expect(dryRun.stdout).toContain('.codex/skills/work');
      expect(fs.existsSync(path.join(projectRoot, staleLegacySpecFirstSkill))).toBe(false);
      expect(fs.readFileSync(path.join(projectRoot, providerOwnedGraphifySkill), 'utf8')).toBe('# graphify\n');
      const cleanedHooksJson = JSON.parse(fs.readFileSync(hooksPath, 'utf8'));
      expect(cleanedHooksJson.hooks.PreToolUse).toEqual([graphifyHook]);
      expect(cleanedHooksJson.hooks.SessionStart).toBeUndefined();

    } finally {
      initLogSpy.mockRestore();
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('Kiro clean removes only spec-first managed runtime and preserves user-owned Kiro assets', () => {
    const projectRoot = makeTempDir();
    const initLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    try {
      expect(withCwd(projectRoot, () => runProgrammaticInit({ projectRoot, platform: 'kiro' }))).toBe(0);

      const userSkillPath = path.join(projectRoot, '.kiro', 'skills', 'custom-skill', 'SKILL.md');
      const userAgentPath = path.join(projectRoot, '.kiro', 'agents', 'custom-agent.md');
      const userHookPath = path.join(projectRoot, '.kiro', 'hooks', 'user-hook.json');
      const userSettingsPath = path.join(projectRoot, '.kiro', 'settings', 'mcp.json');
      const userSpecPath = path.join(projectRoot, '.kiro', 'specs', 'feature-a', 'requirements.md');
      fs.mkdirSync(path.dirname(userSkillPath), { recursive: true });
      fs.mkdirSync(path.dirname(userAgentPath), { recursive: true });
      fs.mkdirSync(path.dirname(userHookPath), { recursive: true });
      fs.mkdirSync(path.dirname(userSettingsPath), { recursive: true });
      fs.mkdirSync(path.dirname(userSpecPath), { recursive: true });
      fs.writeFileSync(userSkillPath, '---\nname: custom-skill\ndescription: custom\n---\n', 'utf8');
      fs.writeFileSync(userAgentPath, '---\nname: custom-agent\ndescription: custom\n---\n', 'utf8');
      fs.writeFileSync(userHookPath, '{}\n', 'utf8');
      fs.writeFileSync(userSettingsPath, '{"mcpServers":{"user":{}}}\n', 'utf8');
      fs.writeFileSync(userSpecPath, '# Requirements\n', 'utf8');

      const dryRun = captureCommand(projectRoot, runClean, ['--kiro', '--dry-run']);
      expect(dryRun.exitCode).toBe(0);
      expect(dryRun.stderr).toBe('');
      expect(dryRun.stdout).toContain('Dry run: spec-first clean (kiro)');
      expect(dryRun.stdout).toContain('.kiro/skills/spec-work');
      expect(dryRun.stdout).toContain('.kiro/agents/spec-security-reviewer.agent.md');
      expect(dryRun.stdout).toContain('.kiro/spec-first/state.json');
      expect(dryRun.stdout).toContain('AGENTS.md');
      expect(dryRun.stdout).not.toContain('.kiro/hooks/user-hook.json');
      expect(dryRun.stdout).not.toContain('.kiro/settings/mcp.json');
      expect(dryRun.stdout).not.toContain('.kiro/specs/feature-a/requirements.md');

      const cleanResult = captureCommand(projectRoot, runClean, ['--kiro']);
      expect(cleanResult.exitCode).toBe(0);
      expect(cleanResult.stdout).toContain('Removed spec-first managed Kiro assets');
      expect(fs.existsSync(path.join(projectRoot, '.kiro', 'skills', 'spec-work'))).toBe(false);
      expect(fs.existsSync(path.join(projectRoot, '.kiro', 'agents', 'spec-security-reviewer.agent.md'))).toBe(false);
      expect(fs.existsSync(path.join(projectRoot, '.kiro', 'spec-first', 'state.json'))).toBe(false);
      expect(fs.existsSync(userSkillPath)).toBe(true);
      expect(fs.existsSync(userAgentPath)).toBe(true);
      expect(fs.existsSync(userHookPath)).toBe(true);
      expect(fs.existsSync(userSettingsPath)).toBe(true);
      expect(fs.existsSync(userSpecPath)).toBe(true);

      const instructions = fs.readFileSync(path.join(projectRoot, 'AGENTS.md'), 'utf8');
      expect(instructions).not.toContain('spec-first:bootstrap:start');
      expect(instructions).not.toContain('spec-first:runtime-tools:start');
    } finally {
      initLogSpy.mockRestore();
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('Qoder clean removes only spec-first managed runtime and preserves user-owned Qoder assets', () => {
    const projectRoot = makeTempDir();
    const initLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    try {
      expect(withCwd(projectRoot, () => runProgrammaticInit({ projectRoot, platform: 'qoder' }))).toBe(0);

      const userRulePath = path.join(projectRoot, '.qoder', 'rules', 'security.md');
      const userSettingsPath = path.join(projectRoot, '.qoder', 'settings.json');
      const localMcpConfigPath = path.join(projectRoot, '.qoder', 'settings.local.json');
      const userHookPath = path.join(projectRoot, '.qoder', 'hooks', 'custom.json');
      fs.mkdirSync(path.dirname(userRulePath), { recursive: true });
      fs.mkdirSync(path.dirname(userHookPath), { recursive: true });
      fs.writeFileSync(userRulePath, '# native rule\n', 'utf8');
      fs.writeFileSync(userSettingsPath, '{"mcpServers":{"user":{}}}\n', 'utf8');
      fs.writeFileSync(localMcpConfigPath, '{"mcpServers":{"local":{}}}\n', 'utf8');
      fs.writeFileSync(userHookPath, '{}\n', 'utf8');

      const dryRun = captureCommand(projectRoot, runClean, ['--qoder', '--dry-run']);
      expect(dryRun.exitCode).toBe(0);
      expect(dryRun.stderr).toBe('');
      expect(dryRun.stdout).toContain('Dry run: spec-first clean (qoder)');
      expect(dryRun.stdout).toContain('.qoder/commands/spec/work.md');
      expect(dryRun.stdout).toContain('.qoder/skills/spec-work');
      expect(dryRun.stdout).toContain('.qoder/agents/spec-security-reviewer.agent.md');
      expect(dryRun.stdout).toContain('.qoder/spec-first/state.json');
      expect(dryRun.stdout).toContain('AGENTS.md');
      expect(dryRun.stdout).not.toContain('.qoder/rules/security.md');
      expect(dryRun.stdout).not.toContain('.qoder/settings.json');
      expect(dryRun.stdout).not.toContain('.qoder/settings.local.json');
      expect(dryRun.stdout).not.toContain('.qoder/hooks/custom.json');

      const cleanResult = captureCommand(projectRoot, runClean, ['--qoder']);
      expect(cleanResult.exitCode).toBe(0);
      expect(cleanResult.stdout).toContain('Removed spec-first managed Qoder assets');
      expect(fs.existsSync(path.join(projectRoot, '.qoder', 'commands', 'spec', 'work.md'))).toBe(false);
      expect(fs.existsSync(path.join(projectRoot, '.qoder', 'skills', 'spec-work'))).toBe(false);
      expect(fs.existsSync(path.join(projectRoot, '.qoder', 'agents', 'spec-security-reviewer.agent.md'))).toBe(false);
      expect(fs.existsSync(path.join(projectRoot, '.qoder', 'spec-first', 'state.json'))).toBe(false);
      expect(fs.existsSync(userRulePath)).toBe(true);
      expect(fs.existsSync(userSettingsPath)).toBe(true);
      expect(fs.existsSync(localMcpConfigPath)).toBe(true);
      expect(fs.existsSync(userHookPath)).toBe(true);

      const instructions = fs.readFileSync(path.join(projectRoot, 'AGENTS.md'), 'utf8');
      expect(instructions).not.toContain('spec-first:bootstrap:start');
      expect(instructions).not.toContain('spec-first:runtime-tools:start');
    } finally {
      initLogSpy.mockRestore();
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('clean rejects unsafe managed state paths before deleting assets', () => {
    const tempRoot = makeTempDir();
    const projectRoot = path.join(tempRoot, 'project');
    const victimPath = path.join(tempRoot, 'victim.txt');
    const initLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    try {
      fs.mkdirSync(projectRoot, { recursive: true });
      fs.writeFileSync(victimPath, 'do not remove\n', 'utf8');
      expect(withCwd(projectRoot, () => runProgrammaticInit({ projectRoot, platform: 'codex' }))).toBe(0);

      const adapter = getAdapter('codex');
      const statePath = path.join(projectRoot, adapter.stateFile);
      const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      state.skills.push('../../../../victim.txt');
      fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');

      expect(() => readState(projectRoot, adapter)).toThrow(/unsafe path entry/);
      const cleanResult = captureCommand(projectRoot, runClean, ['--codex']);
      expect(cleanResult.exitCode).toBe(1);
      expect(cleanResult.stderr).toContain('unsafe path entry');
      expect(fs.readFileSync(victimPath, 'utf8')).toBe('do not remove\n');
    } finally {
      initLogSpy.mockRestore();
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  test('managed state ignores legacy developer fields when present', () => {
    const projectRoot = makeTempDir();
    const initLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    try {
      expect(withCwd(projectRoot, () => runProgrammaticInit({ projectRoot, platform: 'codex' }))).toBe(0);

      const adapter = getAdapter('codex');
      const statePath = path.join(projectRoot, adapter.stateFile);
      const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      state.developer = { path: '.codex/spec-first/.developer', name: 'legacy', lang: 'zh' };
      fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');

      const reread = readState(projectRoot, adapter);
      expect(reread).not.toHaveProperty('developer');
    } finally {
      initLogSpy.mockRestore();
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });
});

describe('clean --workspace-orphans', () => {
  test('lists parent quarantine entries without deleting files', () => {
    const projectRoot = makeTempDir();
    try {
      const workspaceDir = path.join(projectRoot, '.spec-first', 'workspace');
      const toolFactsPath = path.join(projectRoot, '.spec-first', 'config', 'tool-facts.json');
      fs.mkdirSync(path.dirname(toolFactsPath), { recursive: true });
      fs.mkdirSync(workspaceDir, { recursive: true });
      fs.writeFileSync(toolFactsPath, '{"schema_version":"tool-facts.v1"}\n', 'utf8');
      fs.writeFileSync(
        path.join(workspaceDir, 'parent-artifact-quarantine.json'),
        `${JSON.stringify({
          schema_version: 'parent-artifact-quarantine.v1',
          topology: 'multi-repo-workspace',
          advisory: true,
          authority_level: 'advisory',
          freshness: 'generated',
          generated_at: '2026-05-28T00:00:00Z',
          generated_by: 'spec-mcp-setup',
          consumers: ['spec-first clean --workspace-orphans'],
          quarantined_paths: [
            {
              path: '.spec-first/config/tool-facts.json',
              reason_code: 'parent-workspace-must-not-have-repo-local-setup-facts',
              stale_indicator: 'parent-workspace-repo-local-artifact-present',
              last_generated_at: '2026-05-28T00:00:00Z',
              fingerprint_origin: '/tmp/project-a',
            },
          ],
        }, null, 2)}\n`,
        'utf8',
      );

      const before = snapshotTree(projectRoot);
      const result = captureCommand(projectRoot, runClean, ['--workspace-orphans']);
      const after = snapshotTree(projectRoot);

      expect(result.exitCode).toBe(0);
      expect(result.stderr).toBe('');
      expect(after).toEqual(before);
      expect(result.stdout).toContain('Parent workspace orphan artifact preview:');
      expect(result.stdout).toContain('.spec-first/config/tool-facts.json (parent-workspace-must-not-have-repo-local-setup-facts)');
      expect(result.stdout).toContain('Run `spec-first clean --workspace-orphans --confirm` to delete listed paths.');
      expect(result.stdout).toContain('No files were changed.');
      expect(fs.existsSync(toolFactsPath)).toBe(true);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('deletes supported quarantined paths only with explicit confirmation', () => {
    const projectRoot = makeTempDir();
    try {
      const workspaceDir = path.join(projectRoot, '.spec-first', 'workspace');
      const toolFactsPath = path.join(projectRoot, '.spec-first', 'config', 'tool-facts.json');
      const runtimeFactsPath = path.join(projectRoot, '.spec-first', 'config', 'runtime-capabilities.json');
      fs.mkdirSync(path.dirname(toolFactsPath), { recursive: true });
      fs.mkdirSync(workspaceDir, { recursive: true });
      fs.writeFileSync(toolFactsPath, '{"schema_version":"tool-facts.v1"}\n', 'utf8');
      fs.writeFileSync(runtimeFactsPath, '{"schema_version":"runtime-capabilities.v1"}\n', 'utf8');
      fs.writeFileSync(
        path.join(workspaceDir, 'parent-artifact-quarantine.json'),
        `${JSON.stringify({
          schema_version: 'parent-artifact-quarantine.v1',
          topology: 'multi-repo-workspace',
          advisory: true,
          authority_level: 'advisory',
          freshness: 'generated',
          generated_at: '2026-05-28T00:00:00Z',
          generated_by: 'spec-mcp-setup',
          consumers: ['spec-first clean --workspace-orphans'],
          quarantined_paths: [
            {
              path: '.spec-first/config/tool-facts.json',
              reason_code: 'foreign-absolute-path-stat-failed',
              stale_indicator: '/Users/old/project',
              last_generated_at: '2026-05-28T00:00:00Z',
              fingerprint_origin: '/Users/old/project',
            },
            {
              path: '.spec-first/config/runtime-capabilities.json',
              reason_code: 'parent-workspace-must-not-have-repo-local-setup-facts',
              stale_indicator: 'parent-workspace-repo-local-artifact-present',
              last_generated_at: '2026-05-28T00:00:01Z',
              fingerprint_origin: '/tmp/old',
            },
          ],
        }, null, 2)}\n`,
        'utf8',
      );

      const result = captureCommand(projectRoot, runClean, ['--workspace-orphans', '--confirm']);

      expect(result.exitCode).toBe(0);
      expect(result.stderr).toBe('');
      expect(result.stdout).toContain('Parent workspace orphan artifact preview:');
      expect(result.stdout).toContain('Deleted 2 workspace orphan path(s).');
      expect(result.stdout).not.toContain('No files were changed.');
      expect(fs.existsSync(toolFactsPath)).toBe(false);
      expect(fs.existsSync(runtimeFactsPath)).toBe(false);
      expect(fs.existsSync(path.join(workspaceDir, 'parent-artifact-quarantine.json'))).toBe(true);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('fails closed when mixed with runtime clean mode or unsafe deletion target', () => {
    const projectRoot = makeTempDir();
    try {
      const mixed = captureCommand(projectRoot, runClean, ['--workspace-orphans', '--claude']);
      expect(mixed.exitCode).toBe(2);
      expect(mixed.stderr).toContain('--workspace-orphans cannot be combined with host flags');

      const invalidConfirm = captureCommand(projectRoot, runClean, ['--confirm']);
      expect(invalidConfirm.exitCode).toBe(2);
      expect(invalidConfirm.stderr).toContain('--confirm is only valid with --workspace-orphans');

      const sourcePath = path.join(projectRoot, 'src', 'index.js');
      const workspaceDir = path.join(projectRoot, '.spec-first', 'workspace');
      fs.mkdirSync(path.dirname(sourcePath), { recursive: true });
      fs.mkdirSync(workspaceDir, { recursive: true });
      fs.writeFileSync(sourcePath, 'module.exports = 1;\n', 'utf8');
      fs.writeFileSync(
        path.join(workspaceDir, 'parent-artifact-quarantine.json'),
        `${JSON.stringify({
          schema_version: 'parent-artifact-quarantine.v1',
          topology: 'multi-repo-workspace',
          advisory: true,
          authority_level: 'advisory',
          freshness: 'generated',
          generated_at: '2026-05-28T00:00:00Z',
          generated_by: 'spec-mcp-setup',
          consumers: ['spec-first clean --workspace-orphans'],
          quarantined_paths: [
            {
              path: 'src/index.js',
              reason_code: 'parent-workspace-must-not-have-repo-local-setup-artifact',
              stale_indicator: 'malformed-test-fixture',
              last_generated_at: null,
              fingerprint_origin: null,
            },
          ],
        }, null, 2)}\n`,
        'utf8',
      );
      const unsafe = captureCommand(projectRoot, runClean, ['--workspace-orphans', '--confirm']);
      expect(unsafe.exitCode).toBe(1);
      expect(unsafe.stderr).toContain('outside supported workspace orphan cleanup targets');
      expect(fs.existsSync(sourcePath)).toBe(true);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('requires a valid parent quarantine artifact', () => {
    const projectRoot = makeTempDir();
    try {
      const missing = captureCommand(projectRoot, runClean, ['--workspace-orphans']);
      expect(missing.exitCode).toBe(1);
      expect(missing.stderr).toContain('No parent artifact quarantine found.');

      const workspaceDir = path.join(projectRoot, '.spec-first', 'workspace');
      fs.mkdirSync(workspaceDir, { recursive: true });
      fs.writeFileSync(
        path.join(workspaceDir, 'parent-artifact-quarantine.json'),
        '{"schema_version":"wrong","quarantined_paths":[]}\n',
        'utf8',
      );
      const invalid = captureCommand(projectRoot, runClean, ['--workspace-orphans']);
      expect(invalid.exitCode).toBe(1);
      expect(invalid.stderr).toContain('schema_version must be parent-artifact-quarantine.v1');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });
});

describe('clean is not blocked by the CODEX_HOME write-side guard (U3)', () => {
  test('codex clean removes managed assets even when projectRoot .codex is CODEX_HOME', () => {
    // The U1 anti-pollution guard lives in the WRITE plan (planRuntimeFilesSync). clean uses
    // the REMOVAL plan, so it must still work in a directory whose .codex is CODEX_HOME —
    // this is the official cleanup path for global pollution. Asserting it is not blocked
    // prevents a future "symmetry" change from copying the guard onto clean.
    const projectRoot = makeTempDir();
    const initLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const prevCodexHome = process.env.CODEX_HOME;
    process.env.CODEX_HOME = path.join(projectRoot, '.codex');

    try {
      // Install a normal codex project first (writes state + hooks), then point CODEX_HOME at
      // it to simulate "this directory's .codex is the global hook location".
      delete process.env.CODEX_HOME;
      expect(withCwd(projectRoot, () => runProgrammaticInit({ projectRoot, platform: 'codex' }))).toBe(0);
      process.env.CODEX_HOME = path.join(projectRoot, '.codex');
      initLogSpy.mockRestore();

      expect(fs.existsSync(path.join(projectRoot, '.codex', 'hooks.json'))).toBe(true);

      const cleanResult = captureCommand(projectRoot, runClean, ['--codex']);
      expect(cleanResult.exitCode).toBe(0);
      // clean ran (not refused) and removed the managed hook script.
      expect(fs.existsSync(path.join(projectRoot, '.codex', 'hooks', 'session-start'))).toBe(false);
    } finally {
      if (prevCodexHome === undefined) {
        delete process.env.CODEX_HOME;
      } else {
        process.env.CODEX_HOME = prevCodexHome;
      }
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('codex clean reports no managed state when state is absent (state-gated path → manual fallback needed)', () => {
    // When the global hook was written by an older version with no/legacy state, clean cannot
    // strip it. This documents why U4 must provide a state-independent manual-delete fallback.
    const projectRoot = makeTempDir();
    try {
      const codexHome = path.join(projectRoot, '.codex');
      fs.mkdirSync(path.join(codexHome, 'hooks'), { recursive: true });
      fs.writeFileSync(
        path.join(codexHome, 'hooks.json'),
        JSON.stringify({ hooks: { SessionStart: [{ hooks: [{ type: 'command', command: path.join(codexHome, 'hooks/session-start') }] }] } }),
      );
      // No .codex/spec-first/state.json written — simulates the state-missing case.
      const result = captureCommand(projectRoot, runClean, ['--codex']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('No spec-first managed project assets found');
      // The polluting hook remains — confirming clean cannot help here without state.
      expect(fs.existsSync(path.join(codexHome, 'hooks.json'))).toBe(true);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });
});
