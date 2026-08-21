#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  buildFilteredAssetSet,
  listBundledAgentSupportFiles,
  listBundledAgents,
  listBundledSkills,
  loadPluginManifest,
  loadSkillsGovernance,
} = require('../src/cli/plugin');
const { getAdapter, getSupportedPlatforms } = require('../src/cli/adapters');
const { initPlatformLabel } = require('../src/cli/commands/init-args');
const { countBy } = require('./lib/count-by.cjs');

const REPO_ROOT = path.join(__dirname, '..');
const DEFAULT_OUTPUT_PATH = path.join(REPO_ROOT, 'docs', 'catalog', 'runtime-capabilities.md');
const WORKFLOW_CONTRACTS_DIR = path.join(REPO_ROOT, 'docs', 'contracts', 'workflows');

function readSkillDescription(skillName) {
  const skillPath = path.join(REPO_ROOT, 'skills', skillName, 'SKILL.md');
  if (!fs.existsSync(skillPath)) return '';

  const content = fs.readFileSync(skillPath, 'utf8');
  const frontmatter = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatter) return '';

  const description = frontmatter[1].match(/^description:\s*"?(.+?)"?\s*$/m);
  return description ? description[1].trim() : '';
}

function entrypointFor(record, host) {
  const delivery = record.host_delivery[host];
  if (record.entry_surface === 'workflow_command') {
    if (delivery === 'command' || delivery === 'skill') {
      return record.skill_name;
    }
  }

  if (record.entry_surface === 'standalone_skill' && delivery === 'skill') {
    return `standalone skill: ${record.skill_name}`;
  }

  if (record.entry_surface === 'internal_only' && delivery === 'internal') {
    return 'internal governance record';
  }

  return 'not delivered';
}

function deliverySummary(assetSet) {
  return [
    `${assetSet.commands.length} commands`,
    `${assetSet.workflowSkills.length} workflow skills`,
    `${assetSet.skills.length} standalone skills`,
    `${assetSet.internalSkills.length} agent-facing internal skills`,
    `${assetSet.agents.length} agents`,
    `${assetSet.agentSupportFiles.length} agent support files`,
  ].join(', ');
}

function tableRow(values) {
  return `| ${values.map((value) => String(value || '').replace(/\n/g, '<br>')).join(' | ')} |`;
}

function formatCounts(counts) {
  return Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, count]) => `${key}: ${count}`)
    .join(', ');
}

function listWorkflowRuntimeContracts() {
  if (!fs.existsSync(WORKFLOW_CONTRACTS_DIR)) return [];

  return fs.readdirSync(WORKFLOW_CONTRACTS_DIR)
    .filter((fileName) => fileName.endsWith('.schema.json'))
    .map((fileName) => {
      const absolutePath = path.join(WORKFLOW_CONTRACTS_DIR, fileName);
      const schema = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));

      return {
        title: schema.title || fileName,
        contractPath: path.relative(REPO_ROOT, absolutePath),
        status: schema['x-spec-first-contract-status'] || '',
        producer: schema['x-spec-first-producer'] || '',
        producerAvailable: schema['x-spec-first-producer-available'] === true,
        workflowIntegrated: schema['x-spec-first-workflow-integrated'] === true,
        runtimePath: schema['x-spec-first-runtime-path'] || '',
        boundary: schema['x-spec-first-boundary'] || '',
      };
    })
    .sort((a, b) => a.contractPath.localeCompare(b.contractPath));
}

function listPlannedRuntimeContracts() {
  return listWorkflowRuntimeContracts()
    .filter((contract) => contract.status === 'planned');
}

function buildRuntimeCapabilityCatalog() {
  const governance = loadSkillsGovernance();
  const manifest = loadPluginManifest();
  const platformEntries = getSupportedPlatforms().map((id) => {
    const adapter = getAdapter(id);
    return {
      id,
      label: initPlatformLabel(id),
      adapter,
      assets: buildFilteredAssetSet(adapter),
    };
  });
  const bundledSkillCount = listBundledSkills().length;
  const bundledAgentCount = listBundledAgents().length;
  const bundledSupportCount = listBundledAgentSupportFiles().length;
  const records = [...governance.skills].sort((a, b) =>
    a.skill_name.localeCompare(b.skill_name),
  );
  const commandBySkill = new Map(manifest.commands.map((command) => [command.skill, command]));
  const workflowRecords = records.filter((record) => record.entry_surface === 'workflow_command');
  const standaloneRecords = records.filter((record) => record.entry_surface === 'standalone_skill');
  const internalRecords = records.filter((record) => record.entry_surface === 'internal_only');
  const deliveredInternal = internalRecords.filter((record) => (
    platformEntries.some(({ assets }) => assets.internalSkills.includes(record.skill_name))
  ));
  const betaRecords = workflowRecords.filter((record) => /-beta$/.test(record.skill_name));
  const workflowRuntimeContracts = listWorkflowRuntimeContracts();
  const plannedRuntimeContracts = workflowRuntimeContracts.filter((contract) => contract.status === 'planned');

  const lines = [
    '# Runtime Capability Catalog',
    '',
    '> 本文件由 `scripts/generate-runtime-capability-catalog.js` 从 `src/cli/plugin.js`、`src/cli/contracts/dual-host-governance/skills-governance.json`、`docs/contracts/workflows/*.schema.json` 和当前 `skills/` source 资产派生生成。',
    '> 它是只读 catalog，不是第二套 source of truth；修改 runtime 能力时应先改 source/governance，再重新生成本文件。',
    '',
    '## Source Truth',
    '',
    '| Source | 职责 |',
    '|---|---|',
    '| `src/cli/plugin.js` | 构建 plugin manifest、filtered asset set、runtime sync 与 drift 检查的实现真相源 |',
    '| `src/cli/contracts/dual-host-governance/skills-governance.json` | workflow / standalone / internal skill 的 host delivery 治理真相源 |',
    '| `templates/claude/commands/spec/*.md` | Unified `spec-*` workflow runtime source templates |',
    '| `skills/*/SKILL.md` | workflow、standalone、agent-facing internal skill source |',
    '| `skills/**/references/agents/`, `skills/**/references/personas/` | skill-local prompt assets；不再通过顶层 `agents/` 作为 runtime source |',
    '| `docs/contracts/workflows/*.schema.json` | docs-side workflow artifact contracts；planned contract 不等于 runtime producer 已实现 |',
    '',
    '## Summary',
    '',
    '| 范围 | 当前值 |',
    '|---|---|',
    `| Bundled source skills | ${bundledSkillCount} |`,
    `| Bundled source agents | ${bundledAgentCount} |`,
    `| Bundled agent support files | ${bundledSupportCount} |`,
    `| Governance records by entry surface | ${formatCounts(countBy(records, (record) => record.entry_surface || 'unknown'))} |`,
    ...platformEntries.map(({ label, assets }) => (
      `| ${label} runtime delivery | ${deliverySummary(assets)} |`
    )),
    '| Cursor support status | generated_runtime_preview |',
    '| Cursor loader evidence | degraded: local Cursor skill discovery/invocation is not verified on this machine; generated skills may not load |',
    `| OpenCode support status | ${getAdapter('opencode').supportState} |`,
    `| OpenCode evidence claim | ${getAdapter('opencode').evidenceClaim} |`,
    '| OpenCode loader evidence | degraded: generated command/skill projection is deterministic, but loader discovery and invocation remain unverified until the versioned host journey runs |',
    `| Beta workflow entries | ${betaRecords.map((record) => record.skill_name).join(', ') || 'none'} |`,
    `| Workflow runtime contracts | ${workflowRuntimeContracts.length} |`,
    `| Planned runtime contracts | ${plannedRuntimeContracts.length} |`,
    '',
    '## Cursor Preview Status',
    '',
    'Cursor is opt-in generated-runtime preview. `spec-first init --cursor` can generate deterministic `.cursor/skills/**` and `.cursor/spec-first/**` assets, but local Cursor skill discovery/invocation has not been confirmed on this machine, so generated skills may not load.',
    '',
    '| Status | Meaning | Promotion boundary |',
    '|---|---|---|',
    '| `generated_runtime_preview` | Deterministic source-to-runtime projection and package evidence exist; loader/user journey evidence is degraded. | Current Cursor state. Do not include Cursor in `init -y` defaults or full host support wording. |',
    '| `skill_first_loader_confirmed_preview` | A local or user-provided Cursor journey proves generated skills are discovered and one skill-first workflow can be explicitly invoked. | Requires U0 loader evidence before promotion. |',
    '| `full_host_preview` | Cursor workflow support is proven for delegation-dependent reviewer/worker flows, or that parity is explicitly scoped out of the claim. | Reserved for follow-up work; P0 does not generate `.cursor/agents/**`. |',
    '',
    '## OpenCode Preview Status',
    '',
    'OpenCode is opt-in generated-runtime preview. `spec-first init --opencode` can generate deterministic `.opencode/commands/spec-*.md`, `.opencode/skills/**` and `.opencode/spec-first/**` assets while cleaning the retired `.opencode/commands/spec/` namespace, but loader discovery/invocation is not promoted without exact-version host evidence.',
    '',
    '| Status | Meaning | Promotion boundary |',
    '|---|---|---|',
    '| `generated_runtime_preview` | Deterministic source-to-runtime projection and package evidence exist; native loader/user journey evidence is not yet confirmed. | Current OpenCode state. Keep `tested_versions=[]` and do not include OpenCode in `init -y` defaults. |',
    '| `loader_confirmed_preview` | A versioned OpenCode journey proves command and skill discovery plus bounded invocation for the recorded version/config. | Requires checked-in U6 evidence with invalidation conditions; it does not imply worker primitive parity. |',
    '',
    '## Public Workflows',
    '',
    '所有支持宿主的用户可见 workflow 入口都统一写作 `spec-*`。宿主 runtime delivery 只影响生成文件位置，不改变用户启动口径。',
    '',
    '| Workflow | Skill | Unified Entry | Beta | Description |',
    '|---|---|---|---|---|',
    ...workflowRecords
      .sort((a, b) => a.command_name.localeCompare(b.command_name))
      .map((record) => {
        const command = commandBySkill.get(record.skill_name);
        return tableRow([
          record.command_name,
          record.skill_name,
          record.skill_name,
          /-beta$/.test(record.skill_name) ? 'yes' : 'no',
          command ? command.description : readSkillDescription(record.skill_name),
        ]);
      }),
    '',
    '## Standalone Skills',
    '',
    'Standalone skills 会安装为宿主可发现的 skills，不是 command-backed workflows。',
    '',
    `| Skill | ${platformEntries.map(({ label }) => `${label} Delivery`).join(' | ')} | Description |`,
    `|---|${platformEntries.map(() => '---|').join('')}---|`,
    ...standaloneRecords.map((record) => tableRow([
      record.skill_name,
      ...platformEntries.map(({ id }) => entrypointFor(record, id)),
      readSkillDescription(record.skill_name),
    ])),
    '',
    '## Internal Skill Governance',
    '',
    'Most `internal_only` governance records are source governance entries and are not copied into the user-facing runtime skill set. Current runtime delivery only installs agent-facing internal skills that subagents need directly.',
    '',
    '| Category | Skills |',
    '|---|---|',
    `| Delivered agent-facing internal skills | ${deliveredInternal.map((record) => record.skill_name).join(', ') || 'none'} |`,
    `| Governance-only internal records | ${internalRecords.filter((record) => !deliveredInternal.includes(record)).map((record) => record.skill_name).join(', ') || 'none'} |`,
    '',
    '## Runtime Paths',
    '',
    '| Host | Runtime surface | Generated path |',
    '|---|---|---|',
    '| Claude Code | `spec-*` workflow runtime files | `.claude/commands/spec-*.md` |',
    '| Claude Code | standalone and agent-facing internal skills | `.claude/skills/` |',
    '| Claude Code | workflow skill mirrors for command-backed workflows | `.claude/spec-first/workflows/` |',
    '| Claude Code | agents | `.claude/agents/` |',
    '| Codex | workflow, standalone, and agent-facing internal skills | `.agents/skills/` |',
    '| Codex | agents | `.codex/agents/` |',
    '| Cursor | workflow, standalone, and agent-facing internal skills | `.cursor/skills/` |',
    '| Cursor | spec-first managed state | `.cursor/spec-first/` |',
    '| Cursor | project MCP config surface | `.cursor/mcp.json` |',
    '| Cursor | user MCP config surface | `~/.cursor/mcp.json` (requires `--user-scope` / `CURSOR_USER_SCOPE=1`) |',
    '| Cursor | native rules advisory input | `.cursor/rules/**` (Cursor-owned; not generated by spec-first) |',
    '| Cursor | native agents surface | `.cursor/agents/**` (not generated in P0 preview) |',
    '| Kiro | workflow, standalone, and agent-facing internal skills | `.kiro/skills/` |',
    '| Kiro | agents | `.kiro/agents/` |',
    '| Kiro | spec-first managed state | `.kiro/spec-first/` |',
    '| Kiro | MCP config surface | `.kiro/settings/mcp.json` / `~/.kiro/settings/mcp.json` |',
    '| Kiro | native specs advisory input | `.kiro/specs/**` (Kiro-owned; not generated by spec-first) |',
    '| Qoder | `spec-*` workflow runtime files | `.qoder/commands/spec-*.md` |',
    '| Qoder | workflow, standalone, and agent-facing internal skills | `.qoder/skills/` |',
    '| Qoder | agents | `.qoder/agents/` |',
    '| Qoder | spec-first managed state | `.qoder/spec-first/` |',
    '| Qoder | local MCP config surface | `.qoder/settings.local.json` |',
    '| Qoder | user MCP config surface | `~/.qoder/settings.json` (requires `--user-scope` / `QODER_USER_SCOPE=1`) |',
    '| Qoder | native rules advisory input | `.qoder/rules/**` (Qoder-owned; not generated by spec-first) |',
    '| OpenCode | `spec-*` workflow runtime files | `.opencode/commands/spec-*.md` |',
    '| OpenCode | workflow, standalone, and agent-facing internal skills | `.opencode/skills/` |',
    '| OpenCode | spec-first managed state | `.opencode/spec-first/` |',
    '| OpenCode | bundled agents | not generated while `supportsAgents=false` |',
    '| OpenCode | project config surface | `opencode.json` / `opencode.jsonc` (host-local; U4/U6 own shape and precedence validation) |',
    '',
    '## Source Runtime Customization Boundary',
    '',
    '`docs/contracts/source-runtime-customization-boundary.md` defines the customization contract for checked-in source, generated host runtime mirrors, host-local config outputs, target-repo workflow artifacts, and external provider/tool facts. Generated mirrors under `.claude/`, `.codex/`, `.agents/skills/`, `.cursor/skills/`, `.cursor/spec-first/`, `.kiro/skills/`, `.kiro/agents/`, `.kiro/spec-first/`, spec-first managed `.kiro/settings/`, `.qoder/commands/spec-*.md`, retired `.qoder/commands/spec/`, `.qoder/skills/`, `.qoder/agents/`, `.qoder/spec-first/`, `.opencode/commands/spec-*.md`, retired `.opencode/commands/spec/`, `.opencode/skills/`, `.opencode/spec-first/`, Cursor project `.cursor/mcp.json`, and Qoder local `.qoder/settings.local.json` are not source-of-truth; edit source assets and regenerate with `spec-first init`, choosing the target host when prompted, when a runtime refresh is required. Host-local config such as `opencode.json` / `opencode.jsonc` is not a generated runtime source surface. Cursor and Qoder clean preserve user-owned MCP entries. Cursor-native `.cursor/rules/**`, Kiro-native `.kiro/specs/**`, and Qoder-native `.qoder/rules/**` remain host-owned advisory input only when explicitly named.',
    '',
    'External tool facts from browser/MCP tools, package managers, shell commands, and user-provided logs are evidence inputs. Raw tool output is untrusted quoted data and must be schema-validated when structured, target-repo-contained, escaped, excerpt-capped, and provenance-classified before it enters prompts, reports, facts, or durable artifacts. Tool credentials belong in environment variables, host secret managers, or tool-native stores, never in source, generated runtime mirrors, durable artifacts, or raw logs.',
    '',
    '## Workflow Runtime Contracts',
    '',
    'These contracts are docs-side visibility records for workflow artifacts. `producer_available=true` only means a source-owned writer exists. `workflow_integrated=true` requires the workflow itself to call that writer and provide fixture/fresh-source evidence.',
    '',
    '| Contract | Status | Producer | Producer available | Workflow integrated | Runtime path | Boundary |',
    '|---|---|---|---|---|---|---|',
    ...(workflowRuntimeContracts.length > 0
      ? workflowRuntimeContracts.map((contract) => tableRow([
        `${contract.title}<br>${contract.contractPath}`,
        contract.status,
        contract.producer,
        contract.producerAvailable ? 'true' : 'false',
        contract.workflowIntegrated ? 'true' : 'false',
        contract.runtimePath,
        contract.boundary,
      ]))
      : [tableRow(['none', 'none', 'none', 'false', 'false', 'none', 'none'])]),
    '',
    '## Quality Gate Evidence',
    '',
    'The AI development gate runs a focused set of current workflow/runtime contract tests. The checked-in test inventory is fail-fast: an active test path must exist instead of being silently skipped.',
    '',
    '| Command | Artifact | Gate behavior | Boundary |',
    '|---|---|---|---|',
    '| `npm run test:ai-dev:gate` | `.spec-first/workflows/quality-gates/ai-dev-quality-gate/ai-dev-quality-gate-result.json` | Runs the declared focused workflow/runtime contract suite and fails when a suite fails or an active path is missing. | Deterministic contract evidence only; it does not run LLM workflows or judge semantic output quality. |',
    '',
    '## Release Package Evidence',
    '',
    'Release package evidence is deterministic package-content proof for maintainers and release reviewers. It does not claim an isolated installation smoke or decide whether a release should ship.',
    '',
    '| Command | Artifacts | Evidence | Boundary |',
    '|---|---|---|---|',
    '| `npm run build` | `npm pack --dry-run` output | Verifies the current package can be packed and exposes the files npm would publish. | Package-content evidence only; no isolated install, global shim, cross-platform matrix, or user-journey proof. |',
    '',
    '## Readiness Meaning',
    '',
    'Runtime delivery describes what commands, skills, and agents were generated. It does not mean MCP helpers or external tools are ready. Downstream workflows should read the layer-specific artifacts below instead of treating one pass/fail value as global readiness.',
    '',
    '| Layer | Entry | Canonical artifacts | Means | Does not mean |',
    '|---|---|---|---|---|',
    '| CLI/runtime health | `spec-first doctor` | doctor text/JSON report | Node/Git/package checks, generated host runtime assets, workflow surface, and stale verification evidence were inspected. | MCP/helper setup is complete or any external tool evidence is available. |',
    '| Harness setup | `spec-runtime-setup` | `.spec-first/config/tool-facts.json`, `.spec-first/config/runtime-capabilities.json` | Required MCP/helper runtime facts were prepared. | Any external tool result is semantically relevant; the LLM still decides how to use direct evidence. |',
    '',
    '## Maintenance Contract',
    '',
    '- 不手改 `.claude/`、`.codex/`、`.agents/skills/`、`.cursor/skills/`、`.cursor/spec-first/`、`.kiro/skills/`、`.kiro/agents/`、`.kiro/spec-first/`、spec-first managed `.kiro/settings/`、`.qoder/commands/spec-*.md`、retired `.qoder/commands/spec/`、`.qoder/skills/`、`.qoder/agents/`、`.qoder/spec-first/`、`.opencode/commands/spec-*.md`、retired `.opencode/commands/spec/`、`.opencode/skills/`、`.opencode/spec-first/`、`.cursor/mcp.json` 或 `.qoder/settings.local.json` 作为 source fix；需要刷新 runtime 时运行 `spec-first init` 并按引导选择目标宿主。`opencode.json` / `opencode.jsonc`、`.cursor/mcp.json` 和 `.qoder/settings.local.json` 是 host-local config output，不是 runtime source；clean 必须保留冲突或用户维护 entry。`.cursor/rules/**`、`.kiro/specs/**` 和 `.qoder/rules/**` 是 host-native advisory input，不是 spec-first generated mirror。',
    '- 不在本 catalog 中手写能力数量；能力数量必须由 generator 从 source/governance 推导。',
    '- Workflow runtime contracts 必须由 `docs/contracts/workflows/*.schema.json` 的 `x-spec-first-*` metadata 派生；不能在 catalog 手写 planned/producer/integrated 状态。',
    '- 新增、删除或改变 host delivery 时，同步更新 governance/source，运行 `npm run docs:runtime-catalog`，再运行 targeted governance tests。',
    '- 该 catalog 只描述 delivery surface，不判断某个 MCP/helper 当前是否 ready；setup readiness 由 `spec-runtime-setup` 产物表达。',
  ];

  return `${lines.join('\n')}\n`;
}

function writeRuntimeCapabilityCatalog(outputPath = DEFAULT_OUTPUT_PATH) {
  const catalog = buildRuntimeCapabilityCatalog();
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, catalog, 'utf8');
  return outputPath;
}

if (require.main === module) {
  const outputPath = writeRuntimeCapabilityCatalog();
  console.log(`Generated ${path.relative(REPO_ROOT, outputPath)}`);
}

module.exports = {
  DEFAULT_OUTPUT_PATH,
  buildRuntimeCapabilityCatalog,
  listWorkflowRuntimeContracts,
  listPlannedRuntimeContracts,
  writeRuntimeCapabilityCatalog,
};
