'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ClaudeAdapter = require('../../src/cli/adapters/claude');
const CodexAdapter = require('../../src/cli/adapters/codex');
const KiroAdapter = require('../../src/cli/adapters/kiro');
const QoderAdapter = require('../../src/cli/adapters/qoder');
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
    const kiroSkills = deliveredSkills(buildFilteredAssetSet('kiro'));
    const qoderSkills = deliveredSkills(buildFilteredAssetSet('qoder'));
    const delivered = new Set([...claudeSkills, ...codexSkills, ...kiroSkills, ...qoderSkills]);

    expect(bundledSkills.length).toBeGreaterThan(0);
    expect(bundledSkills.filter((skillName) => !governedSkills.has(skillName))).toEqual([]);
    expect(runtimeDeliverableSkills.filter((skillName) => !delivered.has(skillName))).toEqual([]);
  });

  test('workflow command templates and workflow skill sources are selected from governance for supported hosts', () => {
    const commands = listBundledCommands();
    const claudeAssets = buildFilteredAssetSet('claude');
    const codexAssets = buildFilteredAssetSet('codex');
    const kiroAssets = buildFilteredAssetSet('kiro');
    const qoderAssets = buildFilteredAssetSet('qoder');

    expect(commands.length).toBeGreaterThan(0);
    expect(claudeAssets.commands.map((command) => command.name)).toEqual(commands.map((command) => command.name));
    expect(codexAssets.commands).toEqual([]);
    expect(kiroAssets.commands).toEqual([]);
    expect(qoderAssets.commands.map((command) => command.name)).toEqual(commands.map((command) => command.name));

    for (const command of commands) {
      const hasTemplate = fs.existsSync(path.join(REPO_ROOT, 'templates/droid/commands/spec', command.filename));
      const hasSkillSource = fs.existsSync(path.join(REPO_ROOT, 'skills', command.skill, 'SKILL.md'));
      expect(hasTemplate || hasSkillSource).toBe(true);
      expect(claudeAssets.workflowSkills).toContain(command.skill);
      expect(codexAssets.workflowSkills).toContain(command.skill);
      expect(kiroAssets.workflowSkills).toContain(command.skill);
      expect(qoderAssets.workflowSkills).toContain(command.skill);
    }
  });

  test('critical workflow and routing skill sources appear in planned runtime sync paths', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-init-coverage-'));

    try {
      const claudePlan = planBundledAssetSync(projectRoot, new ClaudeAdapter()).plan;
      const codexPlan = planBundledAssetSync(projectRoot, new CodexAdapter()).plan;
      const kiroPlan = planBundledAssetSync(projectRoot, new KiroAdapter()).plan;
      const qoderPlan = planBundledAssetSync(projectRoot, new QoderAdapter()).plan;
      const claudePaths = operationPaths(claudePlan);
      const codexPaths = operationPaths(codexPlan);
      const kiroPaths = operationPaths(kiroPlan);
      const qoderPaths = operationPaths(qoderPlan);

      for (const skillName of GOVERNED_CRITICAL_SKILLS) {
        const claudeRuntimeRoot = skillName === 'using-spec-first'
          ? `.claude/skills/${skillName}/SKILL.md`
          : `.claude/spec-first/workflows/${skillName}/SKILL.md`;
        const codexRuntimeRoot = `.agents/skills/${skillName}/SKILL.md`;
        const kiroRuntimeRoot = `.kiro/skills/${skillName}/SKILL.md`;
        const qoderRuntimeRoot = `.qoder/skills/${skillName}/SKILL.md`;

        expect(claudePaths).toContain(claudeRuntimeRoot);
        expect(codexPaths).toContain(codexRuntimeRoot);
        expect(kiroPaths).toContain(kiroRuntimeRoot);
        expect(qoderPaths).toContain(qoderRuntimeRoot);
      }
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('qoder runtime setup projection pins host detection and rewrites Kiro MCP paths precisely', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-qoder-setup-projection-'));

    try {
      const qoderPlan = planBundledAssetSync(projectRoot, new QoderAdapter()).plan;
      const setupSkill = qoderPlan.operations.find((operation) =>
        operation.path === '.qoder/skills/spec-mcp-setup/SKILL.md',
      );
      const setupCommand = qoderPlan.operations.find((operation) =>
        operation.path === '.qoder/commands/spec/mcp-setup.md',
      );

      expect(setupSkill).toEqual(expect.objectContaining({ kind: 'write_file' }));
      expect(setupCommand).toEqual(expect.objectContaining({ kind: 'write_file' }));
      for (const operation of [setupSkill, setupCommand]) {
        expect(operation.contents).toContain('## Qoder Host Pin');
        expect(operation.contents).toContain('MCP_SETUP_HOST=qoder');
        expect(operation.contents).toContain('.qoder/settings.local.json');
        expect(operation.contents).not.toContain('.qoder/settings.local.jsonmcp.json');
        expect(operation.contents).not.toContain('.kiro/settings/mcp.json');
        expect(operation.contents).not.toContain('$HOME/.kiro/settings/mcp.json');
      }
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });
});
