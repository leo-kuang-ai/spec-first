'use strict';

const fs = require('node:fs');
const {
  DEFAULT_OUTPUT_PATH,
  buildRuntimeCapabilityCatalog,
  listPlannedRuntimeContracts,
  listWorkflowRuntimeContracts,
} = require('../../scripts/generate-runtime-capability-catalog');
const {
  buildFilteredAssetSet,
  listBundledAgents,
  listBundledSkills,
} = require('../../src/cli/plugin');

describe('runtime capability catalog', () => {
  test('generated catalog is derived from current governance', () => {
    const catalog = buildRuntimeCapabilityCatalog();
    const claudeAssets = buildFilteredAssetSet('claude');
    const codexAssets = buildFilteredAssetSet('codex');
    const cursorAssets = buildFilteredAssetSet('cursor');
    const kiroAssets = buildFilteredAssetSet('kiro');
    const qoderAssets = buildFilteredAssetSet('qoder');

    expect(fs.existsSync(DEFAULT_OUTPUT_PATH)).toBe(true);
    expect(catalog).toContain('不是第二套 source of truth');
    expect(catalog).toContain('src/cli/plugin.js');
    expect(catalog).toContain('src/cli/contracts/dual-host-governance/skills-governance.json');
    expect(catalog).toContain('docs/contracts/workflows/*.schema.json');
    expect(catalog).toContain('skill-local prompt assets');
    expect(catalog).not.toContain('`agents/**/*.agent.md`');
    expect(catalog).toContain(`| Bundled source skills | ${listBundledSkills().length} |`);
    expect(catalog).toContain(`| Bundled source agents | ${listBundledAgents().length} |`);
    expect(catalog).toContain(`| Workflow runtime contracts | ${listWorkflowRuntimeContracts().length} |`);
    expect(catalog).toContain(`| Planned runtime contracts | ${listPlannedRuntimeContracts().length} |`);
    expect(catalog).toContain(`| Claude runtime delivery | ${claudeAssets.commands.length} commands, ${claudeAssets.workflowSkills.length} workflow skills, ${claudeAssets.skills.length} standalone skills, ${claudeAssets.internalSkills.length} agent-facing internal skills, ${claudeAssets.agents.length} agents, ${claudeAssets.agentSupportFiles.length} agent support files |`);
    expect(catalog).toContain(`| Codex runtime delivery | ${codexAssets.commands.length} commands, ${codexAssets.workflowSkills.length} workflow skills, ${codexAssets.skills.length} standalone skills, ${codexAssets.internalSkills.length} agent-facing internal skills, ${codexAssets.agents.length} agents, ${codexAssets.agentSupportFiles.length} agent support files |`);
    expect(catalog).toContain(`| Cursor runtime delivery | ${cursorAssets.commands.length} commands, ${cursorAssets.workflowSkills.length} workflow skills, ${cursorAssets.skills.length} standalone skills, ${cursorAssets.internalSkills.length} agent-facing internal skills, ${cursorAssets.agents.length} agents, ${cursorAssets.agentSupportFiles.length} agent support files |`);
    expect(catalog).toContain('| Cursor support status | generated_runtime_preview |');
    expect(catalog).toContain('generated skills may not load');
    expect(catalog).toContain(`| Kiro runtime delivery | ${kiroAssets.commands.length} commands, ${kiroAssets.workflowSkills.length} workflow skills, ${kiroAssets.skills.length} standalone skills, ${kiroAssets.internalSkills.length} agent-facing internal skills, ${kiroAssets.agents.length} agents, ${kiroAssets.agentSupportFiles.length} agent support files |`);
    expect(catalog).toContain(`| Qoder runtime delivery | ${qoderAssets.commands.length} commands, ${qoderAssets.workflowSkills.length} workflow skills, ${qoderAssets.skills.length} standalone skills, ${qoderAssets.internalSkills.length} agent-facing internal skills, ${qoderAssets.agents.length} agents, ${qoderAssets.agentSupportFiles.length} agent support files |`);
  });

  test('catalog exposes public, standalone, internal, beta, and host delivery boundaries', () => {
    const catalog = buildRuntimeCapabilityCatalog();

    expect(catalog).toContain('## Cursor Preview Status');
    expect(catalog).toContain('| `generated_runtime_preview` | Deterministic source-to-runtime projection and package evidence exist; loader/user journey evidence is degraded. | Current Cursor state. Do not include Cursor in `init -y` defaults or full host support wording. |');
    expect(catalog).toContain('| `skill_first_loader_confirmed_preview` |');
    expect(catalog).toContain('| `full_host_preview` |');
    expect(catalog).toContain('| work | spec-work | spec-work | no |');
    expect(catalog).toContain('| dogfood | spec-dogfood | spec-dogfood | no |');
    expect(catalog).not.toContain('spec-work-beta');
    expect(catalog).not.toContain('/spec:work-beta');
    expect(catalog).toContain('| polish | spec-polish | spec-polish | no |');
    expect(catalog).not.toContain('| standards | spec-standards |');
    expect(catalog).not.toContain('| standards | spec-standards | /spec:standards | $spec-standards |');
    expect(catalog).not.toContain(`| ${['spec-team', 'standards-governance'].join('-')} |`);
    expect(catalog).not.toContain('Do not restore legacy standards workflow entrypoints, skills/spec-standards/');
    expect(catalog).toContain('| write-skill | spec-write-skill | spec-write-skill | no |');
    expect(catalog).toContain('| write-tasks | spec-write-tasks | spec-write-tasks | no |');
    expect(catalog).toContain('| Delivered agent-facing internal skills | spec-worktree |');
    expect(catalog).not.toContain('spec-session-extract');
    expect(catalog).not.toContain('spec-session-inventory');
    expect(catalog).toContain('| Governance-only internal records |');
    expect(catalog).toContain('setup readiness 由 `spec-mcp-setup` 产物表达');
    expect(catalog).toContain('## Readiness Meaning');
    expect(catalog).toContain('| CLI/runtime health | `spec-first doctor` |');
    expect(catalog).toContain('| Harness setup | `spec-mcp-setup` |');
    expect(catalog).toContain('It does not mean MCP helpers or external tools are ready.');
    expect(catalog).toContain('## Quality Gate Evidence');
    expect(catalog).toContain('npm run test:ai-dev:benchmarks');
    expect(catalog).toContain('.spec-first/workflows/quality-gates/ai-dev-benchmark-fixtures/benchmark-fixtures-result.json');
    expect(catalog).toContain('advisory_failures[]');
    expect(catalog).toContain('does not run agents or workflows');
    expect(catalog).toContain('## Release Package Evidence');
    expect(catalog).toContain('`tests/smoke/install-tarball.sh` output');
    expect(catalog).toContain('Local npm tarball packaging/install smoke');
    expect(catalog).toContain('no CI matrix');
    expect(catalog).toContain('no generated release evidence artifacts');
  });

  test('catalog exposes workflow artifact contracts without claiming workflow integration', () => {
    const catalog = buildRuntimeCapabilityCatalog();
    const workflowContracts = listWorkflowRuntimeContracts();

    expect(workflowContracts).toEqual(expect.arrayContaining([
      {
        title: 'spec-first spec-work run artifact producer-available contract',
        contractPath: 'docs/contracts/workflows/spec-work-run-artifact.schema.json',
        status: 'producer_available',
        producer: 'internal spec-work-run-artifact write',
        producerAvailable: true,
        workflowIntegrated: true,
        runtimePath: '.spec-first/workflows/spec-work/<workspace-slug>/<run-id>/run.json',
        boundary: 'source-owned write-side producer; same workspace/run-id artifacts are immutable and return artifact-already-exists instead of overwriting; workflow_integrated true only when spec-work closeout calls the producer with durable evidence trigger reason_code',
      },
    ]));
    expect(catalog).toContain('## Workflow Runtime Contracts');
    expect(catalog).toContain('`producer_available=true` only means a source-owned writer exists');
    expect(catalog).toContain('| spec-first spec-work run artifact producer-available contract<br>docs/contracts/workflows/spec-work-run-artifact.schema.json | producer_available | internal spec-work-run-artifact write | true | true | .spec-first/workflows/spec-work/<workspace-slug>/<run-id>/run.json | source-owned write-side producer; same workspace/run-id artifacts are immutable and return artifact-already-exists instead of overwriting; workflow_integrated true only when spec-work closeout calls the producer with durable evidence trigger reason_code |');
    expect(catalog).toContain('Workflow runtime contracts 必须由 `docs/contracts/workflows/*.schema.json` 的 `x-spec-first-*` metadata 派生');
  });
});
