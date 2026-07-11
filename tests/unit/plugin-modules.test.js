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
    const staleSetupRuntimeEval = path.join(
      projectRoot,
      '.cursor/skills/spec-mcp-setup/evals/stale-runtime-fixture.json',
    );
    const staleSetupRuntimeReadme = path.join(
      projectRoot,
      '.cursor/skills/spec-mcp-setup/README.md',
    );

    try {
      fs.mkdirSync(path.dirname(staleRuntimeEval), { recursive: true });
      fs.writeFileSync(staleRuntimeEval, '{}\n');
      fs.mkdirSync(path.dirname(staleSetupRuntimeEval), { recursive: true });
      fs.writeFileSync(staleSetupRuntimeEval, '{}\n');
      fs.writeFileSync(staleSetupRuntimeReadme, '# Maintainer notes\n');

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
        '.cursor/skills/spec-mcp-setup/setup-registry.json',
        '.cursor/skills/spec-mcp-setup/setup-registry.schema.json',
        '.cursor/skills/spec-mcp-setup/scripts/setup.cjs',
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
        '.cursor/skills/spec-mcp-setup/evals',
      ))).toBe(false);
      expect(fs.existsSync(path.join(
        projectRoot,
        '.cursor/skills/spec-mcp-setup/README.md',
      ))).toBe(false);
      expect(fs.existsSync(path.join(
        projectRoot,
        '.cursor/skills/spec-mcp-setup/setup-registry.json',
      ))).toBe(true);
      expect(fs.existsSync(path.join(
        projectRoot,
        '.cursor/skills/spec-mcp-setup/setup-registry.schema.json',
      ))).toBe(true);
      expect(fs.existsSync(path.join(
        projectRoot,
        '.cursor/skills/spec-mcp-setup/scripts/setup.cjs',
      ))).toBe(true);
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

  test('preserves support-file identity, metadata, and cross-host semantics across every host projection path', () => {
    const supportCases = [
      {
        suffix: '/spec-strategy/references/strategy-template.md',
        marker: 'name: {{product_name}}',
      },
      {
        suffix: '/spec-optimize/references/example-hard-spec.yaml',
        marker: 'name: improve-build-latency',
      },
      {
        suffix: '/spec-optimize/references/example-judge-spec.yaml',
        marker: 'name: improve-search-relevance',
      },
      {
        suffix: '/spec-prd/references/grill-with-docs-integration.md',
        marker: 'name: grill-with-docs',
      },
      {
        suffix: '/spec-prd/assets/overlays/securities.md',
        marker: 'doc_role: securities-domain-reference',
      },
      {
        suffix: '/spec-compound/references/agents/best-practices-researcher.md',
        marker: '`.claude/skills/**/SKILL.md`, `.codex/skills/**/SKILL.md`, and `.agents/skills/**/SKILL.md`',
      },
      {
        suffix: '/using-spec-first/references/conditional-routing-boundaries.md',
        marker: 'Managed assets under `.claude/`, `.codex/`, `.agents/skills/`, `.cursor/`, `.kiro/`, and `.qoder/`',
      },
    ];
    const byteStableSupportFiles = [
      'spec-mcp-setup/setup-registry.json',
      'spec-mcp-setup/setup-registry.schema.json',
      'spec-mcp-setup/references/config-template.yaml',
      'spec-mcp-setup/scripts/check-health',
      'spec-mcp-setup/scripts/setup.cjs',
      'spec-mcp-setup/scripts/lib/args.cjs',
      'spec-mcp-setup/scripts/lib/configured-dependencies.cjs',
      'spec-mcp-setup/scripts/lib/facts.cjs',
      'spec-mcp-setup/scripts/lib/host-authority.cjs',
      'spec-mcp-setup/scripts/lib/host-config.cjs',
      'spec-mcp-setup/scripts/lib/human-output.cjs',
      'spec-mcp-setup/scripts/lib/installation-executor.cjs',
      'spec-mcp-setup/scripts/lib/mode-policy.cjs',
      'spec-mcp-setup/scripts/lib/path-safety.cjs',
      'spec-mcp-setup/scripts/lib/preflight.cjs',
      'spec-mcp-setup/scripts/lib/process-runner.cjs',
      'spec-mcp-setup/scripts/lib/project-config.cjs',
      'spec-mcp-setup/scripts/lib/project-target.cjs',
      'spec-mcp-setup/scripts/lib/registry.cjs',
      'spec-mcp-setup/scripts/lib/renderer.cjs',
      'spec-mcp-setup/scripts/lib/runtime-executor.cjs',
      'spec-mcp-setup/scripts/lib/scenario-fingerprint.cjs',
      'spec-mcp-setup/scripts/lib/toml-section-editor.cjs',
      'spec-mcp-setup/scripts/lib/workspace-executor.cjs',
      'spec-mcp-setup/scripts/lib/worktree-health.cjs',
      'spec-mcp-setup/scripts/providers/codegraph.cjs',
      'spec-mcp-setup/scripts/providers/common.cjs',
      'spec-mcp-setup/scripts/providers/graphify.cjs',
      'spec-mcp-setup/scripts/providers/registry.cjs',
    ];

    for (const platform of getSupportedPlatforms()) {
      const projectRoot = tempProject();
      try {
        const adapter = getAdapter(platform);
        const { plan } = plugin.planBundledAssetSync(projectRoot, adapter);

        for (const supportCase of supportCases) {
          const operation = plan.operations.find((candidate) =>
            candidate.path.endsWith(supportCase.suffix)
          );
          expect(operation).toBeDefined();
          expect(operation.contents).toContain(supportCase.marker);
        }

        for (const relativePath of byteStableSupportFiles) {
          const operation = plan.operations.find((candidate) =>
            candidate.path.endsWith(`/${relativePath}`)
          );
          const source = fs.readFileSync(
            path.join(__dirname, '..', '..', 'skills', relativePath),
          );
          expect(operation).toBeDefined();
          const projected = Buffer.isBuffer(operation.contents)
            ? operation.contents
            : Buffer.from(operation.contents, 'utf8');
          expect(projected).toEqual(source);
        }

        const auditLock = plan.operations.find((candidate) =>
          candidate.path.endsWith('/spec-app-consistency-audit/references/ecc-source-lock.json')
        );
        expect(auditLock.contents).toContain(
          `\"target_root\": \"${adapter.workflowsRoot}/spec-app-consistency-audit/prompts\"`,
        );

        plugin.syncBundledAssets(projectRoot, adapter);

        for (const supportCase of supportCases) {
          const operation = plan.operations.find((candidate) =>
            candidate.path.endsWith(supportCase.suffix)
          );
          expect(fs.readFileSync(path.join(projectRoot, operation.path), 'utf8'))
            .toContain(supportCase.marker);
        }

        for (const relativePath of byteStableSupportFiles) {
          const operation = plan.operations.find((candidate) =>
            candidate.path.endsWith(`/${relativePath}`)
          );
          const source = fs.readFileSync(
            path.join(__dirname, '..', '..', 'skills', relativePath),
          );
          expect(fs.readFileSync(path.join(projectRoot, operation.path))).toEqual(source);
        }
      } finally {
        fs.rmSync(projectRoot, { recursive: true, force: true });
      }
    }
  });

  test('keeps maintainer-only eval assets out of every host runtime projection', () => {
    const sourceOnlyEvalFilePattern = /\bevals\/(?:[A-Za-z0-9._-]+\/)*[A-Za-z0-9._-]+\.[A-Za-z0-9]+/g;

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
        const contentOperations = plan.operations
          .filter((operation) => typeof operation.contents === 'string')
          .filter((operation) => /\/(?:commands|skills|workflows)\//.test(operation.path));
        const leakedReferences = contentOperations.flatMap((operation) =>
          (operation.contents.match(sourceOnlyEvalFilePattern) || []).map((reference) => ({
            path: operation.path,
            reference,
          }))
        );

        expect(projectedEvalPaths).toEqual([]);
        expect(leakedReferences).toEqual([]);

        const prdSkillPath = path.posix.join(
          adapter.workflowsRoot,
          'spec-prd',
          'SKILL.md',
        );
        const prdSkill = contentOperations.find((operation) =>
          operation.path === prdSkillPath
        );
        expect(prdSkill).toBeDefined();
        expect(prdSkill.contents).toContain('SKILL_DIR="<absolute path of the directory containing the loaded spec-prd/SKILL.md>"');
        expect(prdSkill.contents).toContain('node "$SKILL_DIR/scripts/finalize-prd-artifact.js"');
        expect(prdSkill.contents).toContain('canonical source-of-truth path `skills/spec-prd/**`');
        expect(prdSkill.contents).toContain('by editing a generated host runtime mirror');
        expect(prdSkill.contents).not.toContain('from the source checkout');
        expect(prdSkill.contents).not.toContain('current-source finalize command');
        expect(prdSkill.contents).not.toMatch(/`[^`]*(?:\.claude|\.agents|\.cursor|\.kiro|\.qoder)[^`]*` on (?:Codex|Claude)/);

        if (platform === 'qoder') {
          const qoderPrdCommand = contentOperations.find((operation) =>
            operation.path === '.qoder/commands/spec-prd.md'
          );
          for (const surface of [prdSkill, qoderPrdCommand]) {
            expect(surface).toBeDefined();
            expect(surface.contents).toContain('Qoder degraded enforcement boundary');
            expect(surface.contents).toContain('qoder_hook_activation_unverified');
            expect(surface.contents).toContain('all three managed hook scripts remain inactive');
            expect(surface.contents).toContain('loaded `spec-prd` skill root');
            expect(surface.contents).not.toContain('Codex degraded enforcement boundary');
          }
        }

        const setupSkillPath = path.posix.join(
          adapter.workflowsRoot,
          'spec-mcp-setup',
          'SKILL.md',
        );
        const setupSkill = contentOperations.find((operation) =>
          operation.path === setupSkillPath
        );
        expect(setupSkill).toBeDefined();
        expect(setupSkill.contents).toContain(
          'Canonical package source-of-truth 是 `skills/spec-mcp-setup/setup-registry.json`，由共置的 `setup-registry.schema.json` 校验，schema version 为 `setup-registry.v8`。',
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
