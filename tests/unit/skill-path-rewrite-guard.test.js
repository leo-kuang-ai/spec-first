'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ClaudeAdapter = require('../../src/cli/adapters/claude');
const CodexAdapter = require('../../src/cli/adapters/codex');
const {
  rewriteSourceSkillRuntimePaths,
  shouldPreserveSourceSkillPathLine,
} = require('../../src/cli/skill-path-rewrite-markers');

const REPO_ROOT = path.join(__dirname, '..', '..');

function readSkill(skillName) {
  return fs.readFileSync(path.join(REPO_ROOT, 'skills', skillName, 'SKILL.md'), 'utf8');
}

function renderWorkflowSkill(adapter, skillName) {
  return adapter.transformSkillContent(readSkill(skillName), {
    skillName,
    isWorkflowSkill: true,
  });
}

describe('skill source path rewrite guard', () => {
  test('preserves source-truth self references while rewriting operational references', () => {
    const rendered = rewriteSourceSkillRuntimePaths([
      '| Inputs | Current host and `skills/spec-mcp-setup/mcp-tools.json`. |',
      '`skills/spec-mcp-setup/mcp-tools.json` is the current source directory.',
      'Read `skills/spec-mcp-setup/references/setup.md` before continuing.',
      'bash skills/spec-mcp-setup/scripts/check-health',
      'The source of truth is `skills/spec-mcp-setup/SKILL.md`.',
      'Run from the `skills/spec-mcp-setup/` directory.',
    ].join('\n'), 'spec-mcp-setup', '.agents/skills/spec-mcp-setup');

    expect(rendered).toContain('| Inputs | Current host and `skills/spec-mcp-setup/mcp-tools.json`. |');
    expect(rendered).toContain('`skills/spec-mcp-setup/mcp-tools.json` is the current source directory.');
    expect(rendered).toContain('The source of truth is `skills/spec-mcp-setup/SKILL.md`.');
    expect(rendered).toContain('Read `.agents/skills/spec-mcp-setup/references/setup.md` before continuing.');
    expect(rendered).toContain('bash .agents/skills/spec-mcp-setup/scripts/check-health');
    expect(rendered).toContain('Run from the `.agents/skills/spec-mcp-setup/` directory.');
  });

  test('empty skill names keep content unchanged', () => {
    const content = 'Read `skills/spec-plan/references/plan-template.md`.';

    expect(rewriteSourceSkillRuntimePaths(content, '', '.agents/skills/spec-plan')).toBe(content);
  });

  test('operation markers take precedence over source-truth words', () => {
    expect(shouldPreserveSourceSkillPathLine(
      'Read `skills/spec-plan/references/plan-template.md` before writing the plan. That file is the source of truth.',
      'spec-plan',
    )).toBe(false);
  });

  test('Claude and Codex transforms preserve known source-truth lines and rewrite operational lines', () => {
    const cases = [
      {
        adapter: new ClaudeAdapter(),
        runtimeRoot: '.claude/spec-first/workflows/spec-mcp-setup',
        specPlanRuntimeRoot: '.claude/spec-first/workflows/spec-plan',
      },
      {
        adapter: new CodexAdapter(),
        runtimeRoot: '.agents/skills/spec-mcp-setup',
        specPlanRuntimeRoot: '.agents/skills/spec-plan',
      },
    ];

    for (const { adapter, runtimeRoot, specPlanRuntimeRoot } of cases) {
      const setup = renderWorkflowSkill(adapter, 'spec-mcp-setup');
      const plan = renderWorkflowSkill(adapter, 'spec-plan');

      expect(setup).toContain('| Inputs | Current host, repo target, `skills/spec-mcp-setup/mcp-tools.json`');
      expect(setup).toContain('`skills/spec-mcp-setup/mcp-tools.json` is the current source directory');
      expect(setup).toContain(`bash ${runtimeRoot}/scripts/check-health`);
      expect(setup).toContain(`bash -n ${runtimeRoot}/scripts/*.sh`);
      expect(setup).not.toContain(`\`${runtimeRoot}/mcp-tools.json\` is the current source directory`);

      expect(plan).toContain('references/plan-sections.md');
      expect(plan).toContain('read `references/markdown-rendering.md`');
      expect(plan).toContain('read `references/html-rendering.md`');
      expect(plan).toContain('load `references/plan-handoff.md`');
      expect(plan).not.toContain('Read `skills/spec-plan/references/plan-sections.md`');
    }
  });

  test('preserve-set source-truth lines stay source-shaped through real transforms', () => {
    const cases = [
      {
        adapter: new ClaudeAdapter(),
        skillName: 'using-spec-first',
        runtimeSkillRoot: '.claude/skills/using-spec-first',
        expected: '`skills/using-spec-first/SKILL.md` 是 routing policy source of truth。',
      },
      {
        adapter: new CodexAdapter(),
        skillName: 'using-spec-first',
        runtimeSkillRoot: '.agents/skills/using-spec-first',
        expected: '`skills/using-spec-first/SKILL.md` 是 routing policy source of truth。',
      },
    ];

    for (const { adapter, skillName, runtimeSkillRoot, expected } of cases) {
      const rendered = adapter.transformSkillContent(readSkill(skillName), {
        skillName,
        runtimeSkillRoot,
      });

      expect(rendered).toContain(expected);
      expect(rendered).not.toContain(expected.replace(`skills/${skillName}`, runtimeSkillRoot));
    }
  });
});
