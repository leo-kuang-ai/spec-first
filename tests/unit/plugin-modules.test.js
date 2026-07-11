'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { getAdapter, getSupportedPlatforms } = require('../../src/cli/adapters');
const plugin = require('../../src/cli/plugin');
const { applyOperationPlan } = require('../../src/cli/state');

function tempProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-plugin-modules-'));
}

describe('plugin module facade and governance', () => {
  test('preserves the plugin facade exports', () => {
    expect(Object.keys(plugin).sort()).toEqual([
      'buildFilteredAssetSet',
      'getBundledPath',
      'getSkillsGovernancePath',
      'inspectInstalledAssets',
      'listBundledAgentNames',
      'listBundledAgentSupportFiles',
      'listBundledAgents',
      'listBundledCommands',
      'listBundledSkills',
      'loadPluginManifest',
      'loadSkillsGovernance',
      'planBundledAssetSync',
      'readBundledCommandTemplate',
      'syncAgents',
      'syncBundledAssets',
      'syncCommands',
      'syncSkills',
      'validateSkillsGovernance',
    ]);
  });

  test('loads manifest and filters delivery mode for command and skill hosts', () => {
    const manifest = plugin.loadPluginManifest();
    const governance = plugin.loadSkillsGovernance();
    expect(manifest.commands).toEqual(expect.any(Array));
    expect(manifest.commands.length).toBeGreaterThan(0);
    expect(governance.skills.length).toBe(plugin.listBundledSkills().length);
    expect(() => plugin.validateSkillsGovernance({
      schemaVersion: governance.schemaVersion,
      skills: governance.skills,
    })).not.toThrow();

    const claude = plugin.buildFilteredAssetSet('claude');
    const cursor = plugin.buildFilteredAssetSet('cursor');
    expect(claude.commands.map((command) => command.name)).toContain('work');
    expect(claude.workflowSkills).toContain('spec-work');
    expect(cursor.commands).toEqual([]);
    expect(cursor.workflowSkills).toContain('spec-work');
    expect(cursor.internalSkills).toContain('spec-worktree');
    expect(cursor.agents).toEqual([]);
    expect(() => plugin.buildFilteredAssetSet('unknown')).toThrow('Unknown platform');
  });

  test('plans, applies, inspects, and anchor-validates bundled assets', () => {
    const projectRoot = tempProject();
    const adapter = getAdapter('cursor');
    const { plan, syncedAssets } = plugin.planBundledAssetSync(projectRoot, adapter);

    expect(plan.operations).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'ensure_dir', path: '.cursor/skills' }),
      expect.objectContaining({ kind: 'write_file', path: '.cursor/skills/spec-work/SKILL.md' }),
    ]));
    expect(syncedAssets.workflowSkills).toContain('spec-code-review');
    applyOperationPlan(projectRoot, plan);

    const healthy = plugin.inspectInstalledAssets(projectRoot, adapter);
    expect(healthy.commands.missing).toEqual([]);
    expect(healthy.skills.missing).toEqual([]);
    expect(healthy.skills.drifted).toEqual([]);

    const reviewSkillPath = path.join(
      projectRoot,
      '.cursor',
      'skills',
      'spec-code-review',
      'SKILL.md',
    );
    fs.writeFileSync(
      reviewSkillPath,
      fs.readFileSync(reviewSkillPath, 'utf8').replace(
        'Plan discovery (requirements verification)',
        'Plan requirements check',
      ),
      'utf8',
    );

    const drifted = plugin.inspectInstalledAssets(projectRoot, adapter);
    expect(drifted.skills.drifted).toEqual(expect.arrayContaining([
      expect.objectContaining({
        skillName: 'spec-code-review',
        issues: expect.arrayContaining([
          'missing_anchor:Plan discovery (requirements verification)',
          'content_mismatch',
        ]),
      }),
    ]));
  });

  test('excludes source-only evals and top-level maintainer READMEs from runtime assets', () => {
    const projectRoot = tempProject();
    const adapter = getAdapter('cursor');
    const staleRuntimeEval = path.join(
      projectRoot,
      '.cursor/skills/spec-prd/evals/stale-runtime-fixture.json',
    );

    try {
      fs.mkdirSync(path.dirname(staleRuntimeEval), { recursive: true });
      fs.writeFileSync(staleRuntimeEval, '{}\n');

      const { plan } = plugin.planBundledAssetSync(projectRoot, adapter);
      const operationPaths = plan.operations.map((operation) => operation.path);

      expect(operationPaths.some((operationPath) =>
        /\/skills\/[^/]+\/evals(?:\/|$)/.test(operationPath)
      )).toBe(false);
      expect(operationPaths.some((operationPath) =>
        /\/skills\/[^/]+\/README\.md$/.test(operationPath)
      )).toBe(false);
      expect(operationPaths).toEqual(expect.arrayContaining([
        '.cursor/skills/spec-prd/references/prd-output-template.md',
        '.cursor/skills/spec-prd/scripts/check-prd-artifact.js',
        '.cursor/skills/spec-prd/assets/templates/00-generic.md',
      ]));

      plugin.syncBundledAssets(projectRoot, adapter);

      expect(fs.existsSync(path.join(
        projectRoot,
        '.cursor/skills/spec-prd/evals',
      ))).toBe(false);
      expect(fs.existsSync(path.join(
        projectRoot,
        '.cursor/skills/spec-app-consistency-audit/README.md',
      ))).toBe(false);
      expect(fs.existsSync(path.join(
        projectRoot,
        '.cursor/skills/spec-prd/references/prd-output-template.md',
      ))).toBe(true);
      expect(fs.existsSync(path.join(
        projectRoot,
        '.cursor/skills/spec-prd/scripts/check-prd-artifact.js',
      ))).toBe(true);
      expect(fs.existsSync(path.join(
        projectRoot,
        '.cursor/skills/spec-prd/assets/templates/00-generic.md',
      ))).toBe(true);

      const installed = plugin.inspectInstalledAssets(projectRoot, adapter);
      expect(installed.skills.missing).toEqual([]);
      expect(installed.skills.drifted).toEqual([]);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('keeps maintainer-only eval assets out of every host runtime projection', () => {
    const targetSurfacePattern = /(?:spec-app-consistency-audit|spec-mcp-setup|spec-optimize|spec-prd)/;
    const maintainerOnlyReferencePattern = /(?:evals\/(?:examples|recorded-output-fixtures)\.json|evals\/output\/|scripts\/run-evals\.js)/;

    for (const platform of getSupportedPlatforms()) {
      const projectRoot = tempProject();
      try {
        const adapter = getAdapter(platform);
        const { plan } = plugin.planBundledAssetSync(projectRoot, adapter);
        const projectedEvalPaths = plan.operations
          .map((operation) => operation.path)
          .filter((operationPath) =>
            /\/(?:skills|workflows)\/[^/]+\/evals(?:\/|$)/.test(operationPath)
          );
        const targetOperations = plan.operations.filter((operation) =>
          targetSurfacePattern.test(operation.path)
        );
        const leakedReferences = targetOperations
          .filter((operation) => typeof operation.contents === 'string')
          .filter((operation) => maintainerOnlyReferencePattern.test(operation.contents))
          .map((operation) => operation.path);

        expect(projectedEvalPaths).toEqual([]);
        expect(leakedReferences).toEqual([]);

        const prdSkillPath = path.posix.join(
          adapter.workflowsRoot,
          'spec-prd',
          'SKILL.md',
        );
        const prdSkill = targetOperations.find((operation) =>
          operation.path === prdSkillPath
        );
        expect(prdSkill).toBeDefined();
        expect(prdSkill.contents).toContain('SKILL_DIR="<absolute path of the directory containing the loaded spec-prd/SKILL.md>"');
        expect(prdSkill.contents).toContain('node "$SKILL_DIR/scripts/finalize-prd-artifact.js"');
        expect(prdSkill.contents).toContain('canonical source-of-truth path `skills/spec-prd/**`');
        expect(prdSkill.contents).toContain('by editing a generated host runtime mirror');
        expect(prdSkill.contents).not.toContain('from the source checkout');
        expect(prdSkill.contents).not.toMatch(/`[^`]*(?:\.claude|\.agents|\.cursor|\.kiro|\.qoder)[^`]*` on (?:Codex|Claude)/);

        const setupSkillPath = path.posix.join(
          adapter.workflowsRoot,
          'spec-mcp-setup',
          'SKILL.md',
        );
        const setupSkill = targetOperations.find((operation) =>
          operation.path === setupSkillPath
        );
        expect(setupSkill).toBeDefined();
        expect(setupSkill.contents).toContain(
          'The canonical package source-of-truth is `skills/spec-mcp-setup/mcp-tools.json`;',
        );
        expect(setupSkill.contents).toContain(
          'Generated host runtime mirrors and host-local MCP config files are projections or outputs, not source.',
        );
        expect(setupSkill.contents).not.toContain('Generated runtime mirrors under');
      } finally {
        fs.rmSync(projectRoot, { recursive: true, force: true });
      }
    }
  });
});
