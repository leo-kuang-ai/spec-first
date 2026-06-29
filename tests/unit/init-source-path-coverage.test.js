'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ClaudeAdapter = require('../../src/cli/adapters/claude');
const CodexAdapter = require('../../src/cli/adapters/codex');
const {
  buildFilteredAssetSet,
  listBundledCommands,
  listBundledSkills,
  loadSkillsGovernance,
  planBundledAssetSync,
} = require('../../src/cli/plugin');

const REPO_ROOT = path.join(__dirname, '..', '..');
const GOVERNED_CRITICAL_SKILLS = [
  'spec-code-review',
  'spec-debug',
  'spec-doc-review',
  'spec-mcp-setup',
  'spec-plan',
  'spec-work',
  'using-spec-first',
];

function deliveredSkills(assetSet) {
  return new Set([
    ...assetSet.workflowSkills,
    ...assetSet.skills,
    ...assetSet.internalSkills,
  ]);
}

function operationPaths(plan) {
  return plan.operations.map((operation) => operation.path);
}

describe('init source path coverage', () => {
  test('every runtime-deliverable bundled skill source directory is governed and selected', () => {
    const bundledSkills = listBundledSkills();
    const governance = loadSkillsGovernance().skills;
    const governedSkills = new Set(governance.map((record) => record.skill_name));
    const runtimeDeliverableSkills = governance
      .filter((record) => Object.values(record.host_delivery).some((delivery) =>
        ['command', 'skill'].includes(delivery),
      ))
      .map((record) => record.skill_name);
    const claudeSkills = deliveredSkills(buildFilteredAssetSet('claude'));
    const codexSkills = deliveredSkills(buildFilteredAssetSet('codex'));
    const delivered = new Set([...claudeSkills, ...codexSkills]);

    expect(bundledSkills.length).toBeGreaterThan(0);
    expect(bundledSkills.filter((skillName) => !governedSkills.has(skillName))).toEqual([]);
    expect(runtimeDeliverableSkills.filter((skillName) => !delivered.has(skillName))).toEqual([]);
  });

  test('workflow command templates and workflow skill sources are selected from governance for both hosts', () => {
    const commands = listBundledCommands();
    const claudeAssets = buildFilteredAssetSet('claude');
    const codexAssets = buildFilteredAssetSet('codex');

    expect(commands.length).toBeGreaterThan(0);
    expect(claudeAssets.commands.map((command) => command.name)).toEqual(commands.map((command) => command.name));
    expect(codexAssets.commands).toEqual([]);

    for (const command of commands) {
      const hasTemplate = fs.existsSync(path.join(REPO_ROOT, 'templates/droid/commands/spec', command.filename));
      const hasSkillSource = fs.existsSync(path.join(REPO_ROOT, 'skills', command.skill, 'SKILL.md'));
      expect(hasTemplate || hasSkillSource).toBe(true);
      expect(claudeAssets.workflowSkills).toContain(command.skill);
      expect(codexAssets.workflowSkills).toContain(command.skill);
    }
  });

  test('critical workflow and routing skill sources appear in planned runtime sync paths', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-init-coverage-'));

    try {
      const claudePlan = planBundledAssetSync(projectRoot, new ClaudeAdapter()).plan;
      const codexPlan = planBundledAssetSync(projectRoot, new CodexAdapter()).plan;
      const claudePaths = operationPaths(claudePlan);
      const codexPaths = operationPaths(codexPlan);

      for (const skillName of GOVERNED_CRITICAL_SKILLS) {
        const claudeRuntimeRoot = skillName === 'using-spec-first'
          ? `.claude/skills/${skillName}/SKILL.md`
          : `.claude/spec-first/workflows/${skillName}/SKILL.md`;
        const codexRuntimeRoot = `.agents/skills/${skillName}/SKILL.md`;

        expect(claudePaths).toContain(claudeRuntimeRoot);
        expect(codexPaths).toContain(codexRuntimeRoot);
      }
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });
});
