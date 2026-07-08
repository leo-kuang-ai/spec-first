'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { spawnSync } = require('node:child_process');
const { loadPluginManifest } = require('../../src/cli/plugin');
const { captureProgrammaticInit, useIsolatedDeveloperHome } = require('./helpers/init-plan');

useIsolatedDeveloperHome();

const REPO_ROOT = path.join(__dirname, '..', '..');

const LOCAL_AGENT_BROWSER_DIR = path.join(REPO_ROOT, 'skills', 'agent-browser');
const GOVERNANCE_PATH = path.join(
  REPO_ROOT,
  'src',
  'cli',
  'contracts',
  'dual-host-governance',
  'skills-governance.json',
);
const MCP_TOOLS_PATH = path.join(REPO_ROOT, 'skills', 'spec-mcp-setup', 'mcp-tools.json');
const HELPER_TOOLS_PATH = path.join(REPO_ROOT, 'skills', 'spec-mcp-setup', 'helper-tools.json');
const MCP_SETUP_SKILL_PATH = path.join(REPO_ROOT, 'skills', 'spec-mcp-setup', 'SKILL.md');
const MCP_SETUP_CHECK_HEALTH_PATH = path.join(REPO_ROOT, 'skills', 'spec-mcp-setup', 'scripts', 'check-health');
const MCP_SETUP_LIB_HELPER_REGISTRY_PATH = path.join(REPO_ROOT, 'skills', 'spec-mcp-setup', 'scripts', 'lib-helper-registry.sh');
const MCP_SETUP_INSTALL_HELPERS_PATH = path.join(
  REPO_ROOT,
  'skills',
  'spec-mcp-setup',
  'scripts',
  'install-helpers.sh',
);
const MCP_SETUP_REFERENCE_PATH = path.join(
  REPO_ROOT,
  'skills',
  'spec-mcp-setup',
  'references',
  'supported-mcp-tools.md',
);
const SPEC_SETUP_DIR = path.join(REPO_ROOT, 'skills', 'spec-setup');

const DOWNSTREAM_PROMPTS = [
  path.join(REPO_ROOT, 'skills', 'spec-dogfood', 'SKILL.md'),
  path.join(REPO_ROOT, 'skills', 'spec-test-browser', 'SKILL.md'),
  path.join(REPO_ROOT, 'skills', 'spec-polish', 'SKILL.md'),
];

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function readJson(filePath) {
  return JSON.parse(read(filePath));
}

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'spec-browser-helper-'));
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

function captureInit(cwd, options) {
  return withCwd(cwd, () => captureProgrammaticInit(cwd, options));
}

function writeOldClaudeStateWithAgentBrowser(projectRoot) {
  const statePath = path.join(projectRoot, '.claude', 'spec-first', 'state.json');
  const skillPath = path.join(projectRoot, '.claude', 'skills', 'agent-browser', 'SKILL.md');

  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.mkdirSync(path.dirname(skillPath), { recursive: true });
  fs.writeFileSync(skillPath, 'name: agent-browser\nold local runtime copy\n', 'utf8');
  fs.writeFileSync(
    statePath,
    `${JSON.stringify({
      manifestVersion: '0.0.0-old',
      platform: 'claude',
      commands: [],
      skills: ['agent-browser'],
      workflowSkills: [],
      agents: [],
      agentSupportFiles: [],
    }, null, 2)}\n`,
    'utf8',
  );
}

describe('browser helper tool contracts', () => {
  test('agent-browser is external helper tooling, not a bundled source skill', () => {
    const manifest = loadPluginManifest();
    const governance = readJson(GOVERNANCE_PATH);
    const mcpTools = readJson(MCP_TOOLS_PATH);
    const helperTools = readJson(HELPER_TOOLS_PATH);

    expect(fs.existsSync(LOCAL_AGENT_BROWSER_DIR)).toBe(false);
    expect(manifest.skills).not.toContain('agent-browser');
    expect(governance.skills.map((entry) => entry.skill_name)).not.toContain('agent-browser');
    expect(mcpTools.tools.map((tool) => tool.id)).not.toContain('agent-browser');
    expect(mcpTools.tools.map((tool) => tool.id)).not.toContain('ast-grep');
    expect(helperTools.helpers.map((helper) => helper.id)).toEqual([
      'agent-browser',
      'gh',
      'jq',
      'vhs',
      'silicon',
      'ffmpeg',
      'ast-grep',
      'ast-grep-skill',
    ]);
    expect(helperTools.helpers.find((helper) => helper.id === 'agent-browser')).toMatchObject({
      required: true,
      baseline_blocking: false,
    });
  });

  test('spec-mcp-setup owns agent-browser helper detection and install handoff', () => {
    const setupSkill = read(MCP_SETUP_SKILL_PATH);
    const checkHealth = read(MCP_SETUP_CHECK_HEALTH_PATH);
    const installHelpers = read(MCP_SETUP_INSTALL_HELPERS_PATH);
    const helperTools = readJson(HELPER_TOOLS_PATH);
    const reference = read(MCP_SETUP_REFERENCE_PATH);

    expect(setupSkill).toContain('Required helper tooling outside `mcp-tools.json`');
    expect(setupSkill).toContain('`agent-browser`');
    expect(setupSkill).toContain('helper_tools');
    expect(setupSkill).toContain('install-helpers.* --verify-only');
    expect(setupSkill).toContain('npx -y skills@latest add https://github.com/vercel-labs/agent-browser --skill agent-browser -g -y');
    expect(setupSkill).toContain('NPM_CONFIG_REGISTRY');
    expect(setupSkill).toContain('agent-browser install --with-deps');
    expect(installHelpers).toContain('install-helpers.sh - Install or verify required non-MCP helper tooling');
    expect(installHelpers).toContain('agent-browser install');
    expect(installHelpers).toContain('agent-browser install --with-deps');
    expect(installHelpers).toContain('.agent-browser/spec-first-install.json');
    expect(installHelpers).toContain('npx -y skills@latest add https://github.com/vercel-labs/agent-browser --skill agent-browser -g -y');
    expect(installHelpers).toContain('NPM_CONFIG_REGISTRY');
    expect(installHelpers).toContain('npm_config_registry');
    expect(installHelpers).toContain('CI=true npm install -g agent-browser@latest');
    expect(installHelpers).toContain('SPEC_FIRST_BROWSER_HELPER_REQUIRED');
    expect(installHelpers).toContain('browser_capability_demand_signals');
    expect(installHelpers).toContain('status="skipped"');
    expect(installHelpers).not.toContain('env CI=true npm install -g agent-browser@latest');
    expect(checkHealth).toContain('helper_registry_cli_ids');
    expect(checkHealth).toContain('helper_registry_skill_ids');
    expect(checkHealth).toContain('--json');
    expect(checkHealth).toContain('Tool install status');
    expect(checkHealth).toContain('Skill install status');
    expect(checkHealth).toContain('Required');
    expect(checkHealth).toContain('Status');
    expect(checkHealth).toContain('agent-browser-cli-ready|skipped) echo "skipped"');
    expect(checkHealth).toContain('SPEC_FIRST_BROWSER_HELPER_REQUIRED=1');
    expect(checkHealth).toContain('elif [ "$name" = "agent-browser" ]; then');
    expect(checkHealth).not.toMatch(/installed_skill_names=.*npx --yes skills list/);
    // ast-grep-skill 的展示命令收敛到共享 lib(check-health 经 helper_registry_install_command_display 委派)。
    const libHelperRegistry = read(MCP_SETUP_LIB_HELPER_REGISTRY_PATH);
    expect(libHelperRegistry).toContain('npx -y skills@latest add ast-grep/agent-skill -g -y');
    expect(checkHealth).toContain('helper_registry_install_command_display');
    expect(helperTools.helpers.find((helper) => helper.id === 'ast-grep')).toMatchObject({
      required: true,
      baseline_blocking: false,
    });
    expect(helperTools.helpers.find((helper) => helper.id === 'ast-grep-skill')).toMatchObject({
      required: true,
      baseline_blocking: true,
    });
    expect(reference).toContain('not an MCP server');
    expect(reference).toContain('"helper_tools"');
  });

  test('check-health JSON exposes required helper tooling', () => {
    const result = spawnSync('bash', [MCP_SETUP_CHECK_HEALTH_PATH, '--json'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    });
    expect(result.status).toBe(0);

    const payload = JSON.parse(result.stdout);
    expect(payload.schema_version).toBe('spec-mcp-setup-preflight.v2');
    const agentBrowser = payload.tools.find((tool) => tool.id === 'agent-browser');
    expect(agentBrowser).toMatchObject({
      required: true,
      baseline_blocking: false,
      host_config_status: 'not-applicable',
      project_status: 'not-applicable',
    });
    expect(['ready', 'missing']).toContain(agentBrowser.dependency_status);
    if (agentBrowser.dependency_status !== 'ready') {
      expect(agentBrowser.result).toBe('skipped');
      expect(agentBrowser.next_action).toContain('SPEC_FIRST_BROWSER_HELPER_REQUIRED=1');
    }
    if (agentBrowser.dependency_status === 'ready' && agentBrowser.result === 'skipped') {
      expect(agentBrowser.next_action).toContain('SPEC_FIRST_BROWSER_HELPER_REQUIRED=1');
    }

    const astGrepTool = payload.tools.find((tool) => tool.id === 'ast-grep');
    expect(astGrepTool).toMatchObject({
      required: true,
      baseline_blocking: false,
      host_config_status: 'not-applicable',
      project_status: 'not-applicable',
    });

    const astGrepSkill = payload.skills.find((skill) => skill.id === 'ast-grep-skill');
    expect(astGrepSkill).toMatchObject({
      required: true,
      baseline_blocking: true,
      host_config_status: 'not-applicable',
      project_status: 'not-applicable',
    });
    expect(payload.tools.every((tool) => tool.required === true)).toBe(true);

    expect(payload.project).toHaveProperty('local_config_status');
    expect(payload.legacy).toHaveProperty('compound_engineering_config_status');
  });

  test('spec-setup is retired and spec-mcp-setup is the single setup owner', () => {
    const manifest = loadPluginManifest();
    const governance = readJson(GOVERNANCE_PATH);
    const setupSkill = read(MCP_SETUP_SKILL_PATH);

    expect(fs.existsSync(SPEC_SETUP_DIR)).toBe(false);
    expect(manifest.commands.map((command) => command.name)).not.toContain('setup');
    expect(manifest.skills).not.toContain('spec-setup');
    expect(governance.skills.map((entry) => entry.skill_name)).not.toContain('spec-setup');
    expect(setupSkill).toContain('Project Preflight / Local Setup');
    expect(setupSkill).toContain('Required Harness Runtime');
    expect(setupSkill).toContain('Required helper tooling must not be added to `mcp-tools.json`');
  });

  test('downstream browser prompts keep CLI usage and dual-host missing-tool guidance', () => {
    for (const promptPath of DOWNSTREAM_PROMPTS) {
      const prompt = read(promptPath);

      expect(prompt).toContain('agent-browser');
      expect(prompt).toContain('SPEC_FIRST_BROWSER_HELPER_REQUIRED=1');
      expect(prompt).toContain('This does not block spec-first baseline');
      expect(prompt).not.toContain('skills/agent-browser');
      expect(prompt).not.toMatch(/load\/use the `agent-browser` skill/i);
      expect(prompt).not.toContain('in Claude or `$spec-mcp-setup` in Codex');
      expect(prompt).not.toContain('/spec:mcp-setup` on Claude Code');
      expect(prompt).not.toContain('$spec-mcp-setup` on Codex');
    }

    const testBrowser = read(path.join(REPO_ROOT, 'skills', 'spec-test-browser', 'SKILL.md'));
    expect(testBrowser).toContain('Use `agent-browser` Only For Browser Automation');
    expect(testBrowser).toContain('agent-browser open');
    expect(testBrowser).toContain('agent-browser snapshot -i');
    expect(testBrowser).toContain('agent-browser skills get core');
    expect(testBrowser).toContain('Already-loaded project guidance');
    expect(testBrowser).toContain('Do not scan `AGENTS.md` / `CLAUDE.md` for ports by default');
    expect(testBrowser).not.toContain('Project instructions`');
    expect(testBrowser).not.toContain('PORT=$(grep -Eio');
  });

  test('Claude init removes obsolete local agent-browser runtime copies from old managed state', () => {
    const projectRoot = makeTempDir();
    try {
      writeOldClaudeStateWithAgentBrowser(projectRoot);

      const dryRun = captureInit(projectRoot, { platform: 'claude', dryRun: true });
      expect(dryRun.exitCode).toBe(0);
      expect(dryRun.stderr).toBe('');
      expect(dryRun.stdout).toContain('Would perform a managed hard reset before regenerating runtime assets');
      expect(dryRun.stdout).toContain('Would remove');

      const apply = captureInit(projectRoot, { platform: 'claude' });
      expect(apply.exitCode).toBe(0);
      expect(apply.stderr).toBe('');
      expect(fs.existsSync(path.join(projectRoot, '.claude', 'skills', 'agent-browser'))).toBe(false);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });
});
