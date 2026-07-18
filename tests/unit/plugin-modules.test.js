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
    expect(cursor.internalSkills).toContain('spec-test-browser');
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

  test('delivers spec-test-browser as an internal-only recursive package on every host', () => {
    for (const platform of getSupportedPlatforms()) {
      const projectRoot = tempProject();
      try {
        const adapter = getAdapter(platform);
        const { plan, syncedAssets } = plugin.planBundledAssetSync(projectRoot, adapter);
        const operationPaths = plan.operations.map((operation) => operation.path);
        const runtimeRoot = adapter.skillsRoot;

        expect(syncedAssets.internalSkills).toContain('spec-test-browser');
        expect(syncedAssets.skills).not.toContain('spec-test-browser');
        expect(syncedAssets.workflowSkills).not.toContain('spec-test-browser');
        expect(operationPaths).toEqual(expect.arrayContaining([
          path.posix.join(runtimeRoot, 'spec-test-browser/SKILL.md'),
          path.posix.join(runtimeRoot, 'spec-test-browser/references/pipeline-orchestration.md'),
          path.posix.join(runtimeRoot, 'spec-test-browser/scripts/agent-browser-run-context.cjs'),
        ]));
        expect(operationPaths).not.toEqual(expect.arrayContaining([
          path.posix.join(runtimeRoot, 'spec-test-browser/references/browser-runtime-profile.schema.json'),
          path.posix.join(runtimeRoot, 'spec-test-browser/references/browser-runtime-profile.example.json'),
          path.posix.join(runtimeRoot, 'spec-test-browser/scripts/dev-server-run-context.cjs'),
        ]));
        expect(operationPaths.some((operationPath) =>
          operationPath.includes('/spec-test-browser/evals/')
        )).toBe(false);
      } finally {
        fs.rmSync(projectRoot, { recursive: true, force: true });
      }
    }
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
      '.cursor/skills/spec-runtime-setup/evals/stale-runtime-fixture.json',
    );
    const staleSetupRuntimeReadme = path.join(
      projectRoot,
      '.cursor/skills/spec-runtime-setup/README.md',
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
        '.cursor/skills/spec-write-skill/agents/openai.yaml',
        '.cursor/skills/spec-write-skill/references/project-profiles.md',
        '.cursor/skills/spec-write-skill/references/target-profiles.md',
        '.cursor/skills/spec-write-skill/scripts/validate-skill.cjs',
        '.cursor/skills/spec-runtime-setup/setup-registry.json',
        '.cursor/skills/spec-runtime-setup/setup-registry.schema.json',
        '.cursor/skills/spec-runtime-setup/scripts/setup.cjs',
      ]));
      expect(operationPaths).not.toContain(
        '.cursor/skills/spec-write-skill/evals/export-trigger-evals.cjs',
      );

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
        '.cursor/skills/spec-runtime-setup/evals',
      ))).toBe(false);
      expect(fs.existsSync(path.join(
        projectRoot,
        '.cursor/skills/spec-runtime-setup/README.md',
      ))).toBe(false);
      expect(fs.existsSync(path.join(
        projectRoot,
        '.cursor/skills/spec-runtime-setup/setup-registry.json',
      ))).toBe(true);
      expect(fs.existsSync(path.join(
        projectRoot,
        '.cursor/skills/spec-runtime-setup/setup-registry.schema.json',
      ))).toBe(true);
      expect(fs.existsSync(path.join(
        projectRoot,
        '.cursor/skills/spec-runtime-setup/scripts/setup.cjs',
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
        '.cursor/skills/spec-write-skill/agents/openai.yaml',
      ))).toBe(true);
      expect(fs.existsSync(path.join(
        projectRoot,
        '.cursor/skills/spec-write-skill/scripts/validate-skill.cjs',
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

  test('does not project the retired brainstorm visual helper to any supported host', () => {
    for (const platform of getSupportedPlatforms()) {
      const projectRoot = tempProject();
      try {
        const adapter = getAdapter(platform);
        const { plan } = plugin.planBundledAssetSync(projectRoot, adapter);
        const operationPaths = plan.operations.map((operation) => operation.path);

        expect(operationPaths.some((operationPath) =>
          operationPath.endsWith('/spec-brainstorm/references/visual-probes.md')
        )).toBe(false);
        expect(operationPaths.some((operationPath) =>
          operationPath.endsWith('/spec-brainstorm/scripts/visual-probe-server.js')
        )).toBe(false);
      } finally {
        fs.rmSync(projectRoot, { recursive: true, force: true });
      }
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
        markers: [
          'name: grill-with-docs',
          'write status: not written by this workflow',
          'Product confirmation authorizes PRD WHAT; it does not authorize project-level glossary/context/ADR mutation.',
        ],
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
      {
        suffix: '/using-spec-first/references/public-route-map.md',
        markers: [
          '## Main Flow: Intent -> Governed Change',
          '`runtime-maintenance`',
        ],
      },
    ];
    const byteStableSupportFiles = [
      'spec-runtime-setup/setup-registry.json',
      'spec-runtime-setup/setup-registry.schema.json',
      'spec-runtime-setup/references/config-template.yaml',
      'spec-runtime-setup/scripts/check-health',
      'spec-runtime-setup/scripts/setup.cjs',
      'spec-runtime-setup/scripts/lib/args.cjs',
      'spec-runtime-setup/scripts/lib/configured-dependencies.cjs',
      'spec-runtime-setup/scripts/lib/facts.cjs',
      'spec-runtime-setup/scripts/lib/host-authority.cjs',
      'spec-runtime-setup/scripts/lib/host-config.cjs',
      'spec-runtime-setup/scripts/lib/human-output.cjs',
      'spec-runtime-setup/scripts/lib/installation-executor.cjs',
      'spec-runtime-setup/scripts/lib/mode-policy.cjs',
      'spec-runtime-setup/scripts/lib/path-safety.cjs',
      'spec-runtime-setup/scripts/lib/preflight.cjs',
      'spec-runtime-setup/scripts/lib/process-runner.cjs',
      'spec-runtime-setup/scripts/lib/project-config.cjs',
      'spec-runtime-setup/scripts/lib/project-target.cjs',
      'spec-runtime-setup/scripts/lib/registry.cjs',
      'spec-runtime-setup/scripts/lib/renderer.cjs',
      'spec-runtime-setup/scripts/lib/runtime-executor.cjs',
      'spec-runtime-setup/scripts/lib/scenario-fingerprint.cjs',
      'spec-runtime-setup/scripts/lib/toml-section-editor.cjs',
      'spec-runtime-setup/scripts/lib/workspace-executor.cjs',
      'spec-runtime-setup/scripts/lib/worktree-health.cjs',
      'spec-runtime-setup/scripts/providers/codegraph.cjs',
      'spec-runtime-setup/scripts/providers/common.cjs',
      'spec-runtime-setup/scripts/providers/graphify.cjs',
      'spec-runtime-setup/scripts/providers/registry.cjs',
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
          const markers = supportCase.markers || [supportCase.marker];
          for (const marker of markers) {
            expect(operation.contents).toContain(marker);
          }
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
          const installedContents = fs.readFileSync(
            path.join(projectRoot, operation.path),
            'utf8',
          );
          const markers = supportCase.markers || [supportCase.marker];
          for (const marker of markers) {
            expect(installedContents).toContain(marker);
          }
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
          'spec-runtime-setup',
          'SKILL.md',
        );
        const setupSkill = contentOperations.find((operation) =>
          operation.path === setupSkillPath
        );
        expect(setupSkill).toBeDefined();
        expect(setupSkill.contents).toContain(
          'Canonical package source-of-truth 是 `skills/spec-runtime-setup/setup-registry.json`，由共置的 `setup-registry.schema.json` 校验，schema version 为 `setup-registry.v8`。',
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

  test('projects spec-plan quality-closure runtime owners to every supported host', () => {
    const runtimeOwners = {
      'spec-plan': [
        'SKILL.md',
        'references/planning-evidence-boundaries.md',
        'references/plan-sections.md',
        'references/synthesis-summary.md',
        'references/deepening-workflow.md',
        'references/plan-handoff.md',
        'references/agents/architecture-strategist.md',
        'references/agents/pattern-recognition-specialist.md',
      ],
      'spec-doc-review': [
        'SKILL.md',
        'references/synthesis-and-presentation.md',
        'references/walkthrough.md',
        'references/bulk-preview.md',
        'references/open-questions-defer.md',
      ],
      'spec-work': [
        'SKILL.md',
        'references/work-intake-and-task-pack.md',
        'references/non-code-execution.md',
        'references/execution-engines.md',
        'references/execution-strategy.md',
        'references/feedback-and-tests.md',
        'references/implementation-quality.md',
        'references/shipping-workflow.md',
        'references/review-findings-followup.md',
        'references/tracker-defer.md',
        'scripts/source-plan-file-hash.cjs',
      ],
    };

    for (const platform of getSupportedPlatforms()) {
      const projectRoot = tempProject();
      try {
        const adapter = getAdapter(platform);
        const runtimeRoot = adapter.workflowsRoot || adapter.skillsRoot;
        const { plan } = plugin.planBundledAssetSync(projectRoot, adapter);
        const operations = new Map(plan.operations.map((operation) => [operation.path, operation]));

        for (const [skillName, relativePaths] of Object.entries(runtimeOwners)) {
          for (const relativePath of relativePaths) {
            const projectedPath = path.posix.join(runtimeRoot, skillName, relativePath);
            expect(operations.has(projectedPath)).toBe(true);
          }
        }

        const planSkill = operations.get(path.posix.join(runtimeRoot, 'spec-plan/SKILL.md'));
        const evidence = operations.get(path.posix.join(
          runtimeRoot,
          'spec-plan/references/planning-evidence-boundaries.md',
        ));
        const reviewSkill = operations.get(path.posix.join(runtimeRoot, 'spec-doc-review/SKILL.md'));
        const workSkill = operations.get(path.posix.join(runtimeRoot, 'spec-work/SKILL.md'));
        const workStrategy = operations.get(path.posix.join(
          runtimeRoot,
          'spec-work/references/execution-strategy.md',
        ));
        const shippingWorkflow = operations.get(path.posix.join(
          runtimeRoot,
          'spec-work/references/shipping-workflow.md',
        ));
        expect(planSkill.contents).toContain('Inventory before invention');
        expect(planSkill.contents).toContain('reuse / extend / compose / new');
        expect(evidence.contents).toContain('Thin glue may own only');
        expect(reviewSkill.contents).toContain('mutation_policy');
        expect(reviewSkill.contents).toContain('report-only');
        expect(workSkill.contents).toContain('Duplicate critical metadata');
        expect(workStrategy.contents).toContain('worker_dispatch_authorization');
        expect(workStrategy.contents).toContain('landing_authorization');
        expect(shippingWorkflow.contents).toContain(
          'node "$SKILL_DIR/scripts/source-plan-file-hash.cjs" "<source-plan>"',
        );
        expect(shippingWorkflow.contents).not.toContain(
          'node skills/spec-work/scripts/source-plan-file-hash.cjs',
        );
        expect([...operations.keys()].some((operationPath) =>
          operationPath.includes('/spec-plan/evals/')
        )).toBe(false);
        expect([...operations.keys()].some((operationPath) =>
          operationPath.includes('/spec-work/evals/')
          || operationPath.includes('/spec-debug/evals/')
          || operationPath.includes('/spec-code-review/evals/')
          || operationPath.includes('/docs/validation/')
          || operationPath.includes('/docs/plans/')
        )).toBe(false);
      } finally {
        fs.rmSync(projectRoot, { recursive: true, force: true });
      }
    }
  });
});
