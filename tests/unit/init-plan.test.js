'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { applyInitPlan, buildInitPlan } = require('../../src/cli/init-plan');
const { printInitApplySuccess } = require('../../src/cli/commands/init');
const { useIsolatedDeveloperHome } = require('./helpers/init-plan');

// applyInitPlan 会写全局 developer profile(~/.spec-first/.developer);隔离 HOME 避免污染运行机器。
useIsolatedDeveloperHome();

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-init-plan-'));
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

      results.push(`${relativePath}:${fs.readFileSync(absolutePath, 'utf8')}`);
    }
  }

  walk(rootDir);
  return results.sort();
}

function writeLegacyClaudeState(projectRoot) {
  const statePath = path.join(projectRoot, '.claude', 'spec-first', 'state.json');
  const oldSkillPath = path.join(projectRoot, '.claude', 'skills', 'old-skill', 'SKILL.md');
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.mkdirSync(path.dirname(oldSkillPath), { recursive: true });
  fs.writeFileSync(oldSkillPath, 'legacy runtime skill\n', 'utf8');
  fs.writeFileSync(
    statePath,
    `${JSON.stringify({
      manifestVersion: '0.0.0-old',
      platform: 'claude',
      commands: {},
      skills: ['old-skill'],
    }, null, 2)}\n`,
    'utf8',
  );
}

describe('init plan API', () => {
  test('buildInitPlan materializes a single-repo plan without writing files', () => {
    const projectRoot = makeTempDir();

    try {
      const before = snapshotTree(projectRoot);
      const plan = buildInitPlan({
        projectRoot,
        platform: 'codex',
        name: 'reviewer',
        lang: 'zh',
      });
      const after = snapshotTree(projectRoot);

      expect(plan).toMatchObject({
        schema_version: 'spec-first-init-plan.v1',
        mode: 'single-repo',
        platform: 'codex',
        projectRoot: fs.realpathSync.native(projectRoot),
        errors: [],
      });
      expect(after).toEqual(before);
      expect(plan.summary.write_file + (plan.summary.update_file || 0)).toBeGreaterThan(0);
      expect(plan.operationPlan.operations.map((operation) => operation.path)).toContain('AGENTS.md');
      expect(plan.operationPlan.operations.map((operation) => operation.path)).toContain('.codex/spec-first/state.json');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('applyInitPlan writes the materialized plan contents', () => {
    const projectRoot = makeTempDir();

    try {
      const plan = buildInitPlan({
        projectRoot,
        platform: 'claude',
        name: 'reviewer',
        lang: 'zh',
      });
      const result = applyInitPlan(projectRoot, plan);

      expect(result.exit_code).toBe(0);
      expect(fs.existsSync(path.join(projectRoot, 'CLAUDE.md'))).toBe(true);
      expect(fs.existsSync(path.join(projectRoot, '.claude', 'commands', 'spec-work.md'))).toBe(true);
      expect(fs.existsSync(path.join(projectRoot, '.claude', 'commands', 'spec', 'work.md'))).toBe(false);
      expect(fs.existsSync(path.join(projectRoot, '.claude', 'hooks', 'session-start'))).toBe(true);
      expect(fs.existsSync(path.join(projectRoot, '.claude', 'hooks', 'spec-plan-guard'))).toBe(true);
      expect(fs.existsSync(path.join(projectRoot, '.claude', 'spec-first', 'state.json'))).toBe(true);
      expect(fs.existsSync(path.join(projectRoot, '.claude', 'spec-first', '.developer'))).toBe(false);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('applyInitPlan preserves provider-owned Graphify Codex runtime', () => {
    const projectRoot = makeTempDir();
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
      fs.mkdirSync(path.join(projectRoot, '.codex', 'skills', 'graphify'), { recursive: true });
      fs.mkdirSync(path.join(projectRoot, '.codex'), { recursive: true });
      fs.writeFileSync(path.join(projectRoot, '.codex', 'skills', 'graphify', 'SKILL.md'), '# graphify\n', 'utf8');
      fs.writeFileSync(path.join(projectRoot, '.codex', 'hooks.json'), JSON.stringify({
        hooks: {
          PreToolUse: [graphifyHook],
        },
      }, null, 2), 'utf8');

      const plan = buildInitPlan({
        projectRoot,
        platform: 'codex',
        name: 'reviewer',
        lang: 'zh',
      });
      const result = applyInitPlan(projectRoot, plan);
      const hooksJson = JSON.parse(fs.readFileSync(path.join(projectRoot, '.codex', 'hooks.json'), 'utf8'));

      expect(result.exit_code).toBe(0);
      expect(fs.readFileSync(path.join(projectRoot, '.codex', 'skills', 'graphify', 'SKILL.md'), 'utf8')).toBe('# graphify\n');
      expect(hooksJson.hooks.PreToolUse).toEqual([graphifyHook]);
      expect(hooksJson.hooks.SessionStart[0].hooks[0]).toEqual({
        type: 'command',
        command: `'${process.execPath.replace(/'/g, "'\\''")}' '${path.join(fs.realpathSync.native(projectRoot), '.codex/hooks/session-start').replace(/\\/g, '/').replace(/'/g, "'\\''")}'`,
        commandWindows: `"${path.join(fs.realpathSync.native(projectRoot), '.codex/hooks/session-start.cmd').replace(/"/g, '\\"')}"`,
      });
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('applyInitPlan writes Kiro skills, agents and state without command, hook or steering runtime', () => {
    const projectRoot = makeTempDir();

    try {
      const plan = buildInitPlan({
        projectRoot,
        platform: 'kiro',
        name: 'reviewer',
        lang: 'zh',
      });
      const result = applyInitPlan(projectRoot, plan);

      expect(result.exit_code).toBe(0);
      expect(fs.existsSync(path.join(projectRoot, 'AGENTS.md'))).toBe(true);
      expect(fs.existsSync(path.join(projectRoot, '.kiro', 'skills', 'spec-work', 'SKILL.md'))).toBe(true);
      expect(fs.existsSync(path.join(projectRoot, '.kiro', 'skills', 'spec-mcp-setup', 'SKILL.md'))).toBe(true);
      expect(fs.existsSync(path.join(projectRoot, '.kiro', 'agents', 'spec-security-reviewer.agent.md'))).toBe(true);
      expect(fs.existsSync(path.join(projectRoot, '.kiro', 'spec-first', 'state.json'))).toBe(true);
      expect(fs.existsSync(path.join(projectRoot, '.kiro', 'commands', 'spec'))).toBe(false);
      expect(fs.existsSync(path.join(projectRoot, '.kiro', 'hooks'))).toBe(false);
      expect(fs.existsSync(path.join(projectRoot, '.kiro', 'steering'))).toBe(false);

      const skill = fs.readFileSync(path.join(projectRoot, '.kiro', 'skills', 'spec-work', 'SKILL.md'), 'utf8');
      expect(skill).toContain('name: spec-work');
      expect(skill).not.toContain('.agents/skills/spec-work');

      const agent = fs.readFileSync(path.join(projectRoot, '.kiro', 'agents', 'spec-security-reviewer.agent.md'), 'utf8');
      expect(agent).toContain('name: spec-security-reviewer');
      expect(agent).toContain('tools: ["read"]');
      expect(agent).not.toMatch(/^model:/m);
      expect(agent).not.toMatch(/^tools:.*\b(Read|Grep|Glob|Bash)\b/m);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('applyInitPlan writes Qoder commands, skills, agents and state without rules or hooks runtime', () => {
    const projectRoot = makeTempDir();

    try {
      const plan = buildInitPlan({
        projectRoot,
        platform: 'qoder',
        name: 'reviewer',
        lang: 'zh',
      });
      const result = applyInitPlan(projectRoot, plan);

      expect(result.exit_code).toBe(0);
      expect(fs.existsSync(path.join(projectRoot, 'AGENTS.md'))).toBe(true);
      expect(fs.existsSync(path.join(projectRoot, '.qoder', 'commands', 'spec-work.md'))).toBe(true);
      expect(fs.existsSync(path.join(projectRoot, '.qoder', 'commands', 'spec', 'work.md'))).toBe(false);
      expect(fs.existsSync(path.join(projectRoot, '.qoder', 'skills', 'spec-work', 'SKILL.md'))).toBe(true);
      expect(fs.existsSync(path.join(projectRoot, '.qoder', 'skills', 'spec-mcp-setup', 'SKILL.md'))).toBe(true);
      expect(fs.existsSync(path.join(projectRoot, '.qoder', 'agents', 'spec-security-reviewer.agent.md'))).toBe(true);
      expect(fs.existsSync(path.join(projectRoot, '.qoder', 'spec-first', 'state.json'))).toBe(true);
      expect(fs.existsSync(path.join(projectRoot, '.qoder', 'rules'))).toBe(false);
      expect(fs.existsSync(path.join(projectRoot, '.qoder', 'hooks'))).toBe(false);

      const instructions = fs.readFileSync(path.join(projectRoot, 'AGENTS.md'), 'utf8');
      expect(instructions).toContain('Qoder workflow 入口优先使用 `spec-*` project commands');
      expect(instructions).toContain('setup/runtime→`spec-mcp-setup`');
      expect(instructions).not.toContain('Codex workflow 入口使用同名 `spec-*` Skills');
      expect(instructions).not.toContain('$spec-mcp-setup');

      const command = fs.readFileSync(path.join(projectRoot, '.qoder', 'commands', 'spec-work.md'), 'utf8');
      expect(command).toContain('name: spec-work');
      expect(command).toContain('description:');
      expect(command).not.toContain('.agents/skills/spec-work');

      const skill = fs.readFileSync(path.join(projectRoot, '.qoder', 'skills', 'spec-work', 'SKILL.md'), 'utf8');
      expect(skill).toContain('name: spec-work');
      expect(skill).not.toContain('.agents/skills/spec-work');

      const agent = fs.readFileSync(path.join(projectRoot, '.qoder', 'agents', 'spec-security-reviewer.agent.md'), 'utf8');
      expect(agent).toContain('name: spec-security-reviewer');
      expect(agent).toContain('tools: [Read, Grep, Glob]');
      expect(agent).not.toMatch(/^model:/m);
      expect(agent).not.toMatch(/^tools:.*\b(Write|Edit|Bash|Agent)\b/m);

      const webResearcher = fs.readFileSync(path.join(projectRoot, '.qoder', 'agents', 'spec-web-researcher.agent.md'), 'utf8');
      expect(webResearcher).toContain('name: spec-web-researcher');
      expect(webResearcher).toContain('tools: [Read, Grep, Glob, WebFetch, WebSearch]');
      expect(webResearcher).not.toMatch(/^model:/m);
      expect(webResearcher).not.toMatch(/^tools:.*\b(Write|Edit|Bash|Agent)\b/m);

      const slackResearcher = fs.readFileSync(path.join(projectRoot, '.qoder', 'agents', 'spec-slack-researcher.agent.md'), 'utf8');
      expect(slackResearcher).toContain('name: spec-slack-researcher');
      expect(slackResearcher).toContain('tools: [Read, Grep, Glob, mcp__slack__*]');
      expect(slackResearcher).not.toMatch(/^model:/m);
      expect(slackResearcher).not.toMatch(/^tools:.*\b(Write|Edit|Bash|Agent)\b/m);

      const issueIntelligence = fs.readFileSync(path.join(projectRoot, '.qoder', 'agents', 'spec-issue-intelligence-analyst.agent.md'), 'utf8');
      expect(issueIntelligence).toContain('name: spec-issue-intelligence-analyst');
      expect(issueIntelligence).toContain('tools: [Read, Grep, Glob, mcp__github__*]');
      expect(issueIntelligence).not.toMatch(/^model:/m);
      expect(issueIntelligence).not.toMatch(/^tools:.*\b(Write|Edit|Bash|Agent)\b/m);

      const bestPractices = fs.readFileSync(path.join(projectRoot, '.qoder', 'agents', 'spec-best-practices-researcher.agent.md'), 'utf8');
      expect(bestPractices).toContain('name: spec-best-practices-researcher');
      expect(bestPractices).toContain('tools: [Read, Grep, Glob, WebFetch, WebSearch, mcp__context7__*]');
      expect(bestPractices).not.toMatch(/^model:/m);
      expect(bestPractices).not.toMatch(/^tools:.*\b(Write|Edit|Bash|Agent)\b/m);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('applyInitPlan writes Cursor skills and state without commands, agents, or rules runtime', () => {
    const projectRoot = makeTempDir();

    try {
      const plan = buildInitPlan({
        projectRoot,
        platform: 'cursor',
        name: 'reviewer',
        lang: 'zh',
      });
      const result = applyInitPlan(projectRoot, plan);

      expect(result.exit_code).toBe(0);
      expect(plan.diagnostics).toEqual(expect.arrayContaining([
        expect.objectContaining({
          code: 'cursor_generated_runtime_preview',
          level: 'warn',
        }),
      ]));
      expect(fs.existsSync(path.join(projectRoot, 'AGENTS.md'))).toBe(true);
      expect(fs.existsSync(path.join(projectRoot, '.cursor', 'skills', 'spec-work', 'SKILL.md'))).toBe(true);
      expect(fs.existsSync(path.join(projectRoot, '.cursor', 'skills', 'spec-mcp-setup', 'SKILL.md'))).toBe(true);
      expect(fs.existsSync(path.join(projectRoot, '.cursor', 'spec-first', 'state.json'))).toBe(true);
      expect(fs.existsSync(path.join(projectRoot, '.cursor', 'commands', 'spec'))).toBe(false);
      expect(fs.existsSync(path.join(projectRoot, '.cursor', 'agents'))).toBe(false);
      expect(fs.existsSync(path.join(projectRoot, '.cursor', 'rules'))).toBe(false);

      const state = JSON.parse(fs.readFileSync(path.join(projectRoot, '.cursor', 'spec-first', 'state.json'), 'utf8'));
      expect(state.platform).toBe('cursor');
      expect(state.commands).toEqual([]);
      expect(state.agents).toEqual([]);
      expect(state.agentSupportFiles).toEqual([]);
      expect(state.workflowSkills).toContain('spec-work');

      const skill = fs.readFileSync(path.join(projectRoot, '.cursor', 'skills', 'spec-work', 'SKILL.md'), 'utf8');
      expect(skill).toContain('name: spec-work');
      expect(skill).toContain('description:');
      expect(skill).toContain('disable-model-invocation: true');
      expect(skill).not.toContain('argument-hint:');
      expect(skill).not.toContain('.agents/skills/spec-work');
      expect(skill).not.toContain('.qoder/commands/spec/');
      expect(skill).not.toContain('.qoder/commands/spec-');
      expect(skill).not.toContain('.kiro/settings/');
      expect(skill).not.toContain('`agents/**`');
      expect(skill).toContain('`.cursor/agents/**`');
      expect(skill).not.toContain('$spec-*');
      expect(skill).not.toContain('/spec:*');

      const setupSkill = fs.readFileSync(path.join(projectRoot, '.cursor', 'skills', 'spec-mcp-setup', 'SKILL.md'), 'utf8');
      expect(setupSkill).toContain('## Cursor Host Pin');
      expect(setupSkill).toContain('MCP_SETUP_HOST=cursor');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('programmatic init success output surfaces Cursor generated-runtime preview warning', () => {
    const projectRoot = makeTempDir();
    const logs = [];
    const warns = [];
    const originalLog = console.log;
    const originalWarn = console.warn;

    try {
      const plan = buildInitPlan({
        projectRoot,
        platform: 'cursor',
        name: 'reviewer',
        lang: 'zh',
      });
      const result = applyInitPlan(projectRoot, plan);

      console.log = (...args) => logs.push(args.join(' '));
      console.warn = (...args) => warns.push(args.join(' '));
      printInitApplySuccess(plan, result, { showNextSteps: false });

      expect(warns.join('\n')).toContain('Cursor support is generated-runtime preview');

      warns.length = 0;
      printInitApplySuccess(plan, result, { showDiagnostics: false, showNextSteps: false });
      expect(warns.join('\n')).not.toContain('Cursor support is generated-runtime preview');
    } finally {
      console.log = originalLog;
      console.warn = originalWarn;
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('legacy managed state is represented as destructive plan diagnostics before apply', () => {
    const projectRoot = makeTempDir();

    try {
      writeLegacyClaudeState(projectRoot);
      const plan = buildInitPlan({
        projectRoot,
        platform: 'claude',
        name: 'reviewer',
        lang: 'zh',
      });

      expect(plan.errors).toEqual([]);
      expect(plan.legacyStateDetected).toBe(true);
      expect(plan.destructiveResetReason).toBe('legacy_state_detected');
      expect(plan.destructiveResetPlan.summary.remove_dir).toBeGreaterThan(0);
      expect(plan.diagnostics.map((diagnostic) => diagnostic.code)).toContain('legacy_state_detected');

      const result = applyInitPlan(projectRoot, plan);
      expect(result.exit_code).toBe(0);
      expect(fs.existsSync(path.join(projectRoot, '.claude', 'skills', 'old-skill'))).toBe(false);
      expect(fs.existsSync(path.join(projectRoot, '.claude', 'commands', 'spec-work.md'))).toBe(true);
      expect(fs.existsSync(path.join(projectRoot, '.claude', 'commands', 'spec', 'work.md'))).toBe(false);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('codex init at CODEX_HOME root emits skip diagnostic and installs no hook (U1)', () => {
    const projectRoot = makeTempDir();
    const prevCodexHome = process.env.CODEX_HOME;
    process.env.CODEX_HOME = path.join(projectRoot, '.codex');

    try {
      const plan = buildInitPlan({ projectRoot, platform: 'codex', name: 'reviewer', lang: 'zh' });
      const codes = plan.diagnostics.map((diagnostic) => diagnostic.code);
      expect(codes).toContain('codex_home_hook_write_skipped');
      // No SessionStart hook write planned, but skills/agents/AGENTS.md still install.
      const opPaths = plan.operationPlan.operations.map((operation) => operation.path);
      expect(opPaths).not.toContain('.codex/hooks.json');
      expect(opPaths).not.toContain('.codex/hooks/session-start');
      expect(opPaths).toContain('AGENTS.md');
    } finally {
      if (prevCodexHome === undefined) delete process.env.CODEX_HOME;
      else process.env.CODEX_HOME = prevCodexHome;
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('normal codex init surfaces a U2b advisory when CODEX_HOME is already polluted', () => {
    const projectRoot = makeTempDir();
    // A real CODEX_HOME ends in `.codex` (default ~/.codex); pollution is only possible there,
    // because the managed hook path always contains the `.codex/hooks/session-start` segment.
    const codexHomeParent = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-codexhome-'));
    const codexHome = path.join(codexHomeParent, '.codex');
    fs.mkdirSync(codexHome, { recursive: true });
    const prevCodexHome = process.env.CODEX_HOME;
    process.env.CODEX_HOME = codexHome;

    try {
      // Pre-existing global pollution: a managed SessionStart entry in CODEX_HOME/hooks.json.
      fs.writeFileSync(
        path.join(codexHome, 'hooks.json'),
        JSON.stringify({ hooks: { SessionStart: [{ hooks: [{ type: 'command', command: path.join(codexHome, 'hooks/session-start') }] }] } }),
      );
      const plan = buildInitPlan({ projectRoot, platform: 'codex', name: 'reviewer', lang: 'zh' });
      const codes = plan.diagnostics.map((diagnostic) => diagnostic.code);
      expect(codes).toContain('codex_global_hook_pollution_detected');
      // This is a normal project init (projectRoot != CODEX_HOME), so the hook still installs here.
      const opPaths = plan.operationPlan.operations.map((operation) => operation.path);
      expect(opPaths).toContain('.codex/hooks.json');
    } finally {
      if (prevCodexHome === undefined) delete process.env.CODEX_HOME;
      else process.env.CODEX_HOME = prevCodexHome;
      fs.rmSync(projectRoot, { recursive: true, force: true });
      fs.rmSync(codexHomeParent, { recursive: true, force: true });
    }
  });
});
