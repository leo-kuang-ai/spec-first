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
    if (host === 'claude' && delivery === 'command') {
      return `/spec:${record.command_name}`;
    }
    if (host === 'codex' && delivery === 'skill') {
      return `$${record.skill_name}`;
    }
    if (host === 'kiro' && delivery === 'skill') {
      return `Kiro Agent Skill: ${record.skill_name}`;
    }
    if (host === 'qoder' && delivery === 'command') {
      return `/spec:${record.command_name}`;
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

function countBy(records, key) {
  return records.reduce((counts, record) => {
    const value = record[key] || 'unknown';
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
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
  const claudeAssets = buildFilteredAssetSet('claude');
  const codexAssets = buildFilteredAssetSet('codex');
  const kiroAssets = buildFilteredAssetSet('kiro');
  const qoderAssets = buildFilteredAssetSet('qoder');
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
  const deliveredInternal = internalRecords.filter((record) =>
    claudeAssets.internalSkills.includes(record.skill_name)
      || codexAssets.internalSkills.includes(record.skill_name)
      || kiroAssets.internalSkills.includes(record.skill_name)
      || qoderAssets.internalSkills.includes(record.skill_name),
  );
  const betaRecords = workflowRecords.filter((record) => /-beta$/.test(record.skill_name));
  const workflowRuntimeContracts = listWorkflowRuntimeContracts();
  const plannedRuntimeContracts = workflowRuntimeContracts.filter((contract) => contract.status === 'planned');

  const lines = [
    '# Runtime Capability Catalog',
    '',
    '> 本文件由 `scripts/generate-runtime-capability-catalog.js` 从 `src/cli/plugin.js`、`src/cli/contracts/dual-host-governance/skills-governance.json`、`docs/contracts/workflows/*.schema.json` 和当前 `skills/` / `agents/` source 资产派生生成。',
    '> 它是只读 catalog，不是第二套 source of truth；修改 runtime 能力时应先改 source/governance，再重新生成本文件。',
    '',
    '## Source Truth',
    '',
    '| Source | 职责 |',
    '|---|---|',
    '| `src/cli/plugin.js` | 构建 plugin manifest、filtered asset set、runtime sync 与 drift 检查的实现真相源 |',
    '| `src/cli/contracts/dual-host-governance/skills-governance.json` | workflow / standalone / internal skill 的 host delivery 治理真相源 |',
    '| `templates/claude/commands/spec/*.md` | Claude `/spec:*` command source templates |',
    '| `skills/*/SKILL.md` | workflow、standalone、agent-facing internal skill source |',
    '| `agents/**/*.agent.md` | supported-host agent source |',
    '| `docs/contracts/workflows/*.schema.json` | docs-side workflow artifact contracts；planned contract 不等于 runtime producer 已实现 |',
    '',
    '## Summary',
    '',
    '| 范围 | 当前值 |',
    '|---|---|',
    `| Bundled source skills | ${bundledSkillCount} |`,
    `| Bundled source agents | ${bundledAgentCount} |`,
    `| Bundled agent support files | ${bundledSupportCount} |`,
    `| Governance records by entry surface | ${formatCounts(countBy(records, 'entry_surface'))} |`,
    `| Claude runtime delivery | ${deliverySummary(claudeAssets)} |`,
    `| Codex runtime delivery | ${deliverySummary(codexAssets)} |`,
    `| Kiro runtime delivery | ${deliverySummary(kiroAssets)} |`,
    `| Qoder runtime delivery | ${deliverySummary(qoderAssets)} |`,
    `| Beta workflow entries | ${betaRecords.map((record) => record.skill_name).join(', ') || 'none'} |`,
    `| Workflow runtime contracts | ${workflowRuntimeContracts.length} |`,
    `| Planned runtime contracts | ${plannedRuntimeContracts.length} |`,
    '',
    '## Public Workflows',
    '',
    '| Workflow | Skill | Claude Entry | Codex Entry | Kiro Entry | Qoder Entry | Host Delivery | Beta | Description |',
    '|---|---|---|---|---|---|---|---|---|',
    ...workflowRecords
      .sort((a, b) => a.command_name.localeCompare(b.command_name))
      .map((record) => {
        const command = commandBySkill.get(record.skill_name);
        return tableRow([
          record.command_name,
          record.skill_name,
          entrypointFor(record, 'claude'),
          entrypointFor(record, 'codex'),
          entrypointFor(record, 'kiro'),
          entrypointFor(record, 'qoder'),
          `claude=${record.host_delivery.claude}; codex=${record.host_delivery.codex}; kiro=${record.host_delivery.kiro}; qoder=${record.host_delivery.qoder}`,
          /-beta$/.test(record.skill_name) ? 'yes' : 'no',
          command ? command.description : readSkillDescription(record.skill_name),
        ]);
      }),
    '',
    '## Standalone Skills',
    '',
    'Standalone skills 会安装为宿主可发现的 skills，不是 command-backed workflows。',
    '',
    '| Skill | Claude Delivery | Codex Delivery | Kiro Delivery | Qoder Delivery | Description |',
    '|---|---|---|---|---|---|',
    ...standaloneRecords.map((record) => tableRow([
      record.skill_name,
      entrypointFor(record, 'claude'),
      entrypointFor(record, 'codex'),
      entrypointFor(record, 'kiro'),
      entrypointFor(record, 'qoder'),
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
    '| Claude Code | `/spec:*` commands | `.claude/commands/spec/` |',
    '| Claude Code | standalone and agent-facing internal skills | `.claude/skills/` |',
    '| Claude Code | workflow skill mirrors for command-backed workflows | `.claude/spec-first/workflows/` |',
    '| Claude Code | agents | `.claude/agents/` |',
    '| Codex | workflow, standalone, and agent-facing internal skills | `.agents/skills/` |',
    '| Codex | agents | `.codex/agents/` |',
    '| Kiro | workflow, standalone, and agent-facing internal skills | `.kiro/skills/` |',
    '| Kiro | agents | `.kiro/agents/` |',
    '| Kiro | spec-first managed state | `.kiro/spec-first/` |',
    '| Kiro | MCP config surface | `.kiro/settings/mcp.json` / `~/.kiro/settings/mcp.json` |',
    '| Kiro | native specs advisory input | `.kiro/specs/**` (Kiro-owned; not generated by spec-first) |',
    '| Qoder | `/spec:*` project commands | `.qoder/commands/spec/` |',
    '| Qoder | workflow, standalone, and agent-facing internal skills | `.qoder/skills/` |',
    '| Qoder | agents | `.qoder/agents/` |',
    '| Qoder | spec-first managed state | `.qoder/spec-first/` |',
    '| Qoder | local MCP config surface | `.qoder/settings.local.json` |',
    '| Qoder | user MCP config surface | `~/.qoder/settings.json` (requires `--user-scope` / `QODER_USER_SCOPE=1`) |',
    '| Qoder | native rules advisory input | `.qoder/rules/**` (Qoder-owned; not generated by spec-first) |',
    '',
    '## Source Runtime Customization Boundary',
    '',
    '`docs/contracts/source-runtime-customization-boundary.md` defines the customization contract for checked-in source, generated host runtime mirrors, host-local config outputs, target-repo workflow artifacts, and external provider/tool facts. Generated mirrors under `.claude/`, `.codex/`, `.agents/skills/`, `.kiro/skills/`, `.kiro/agents/`, `.kiro/spec-first/`, spec-first managed `.kiro/settings/`, `.qoder/commands/spec/`, `.qoder/skills/`, `.qoder/agents/`, `.qoder/spec-first/`, and Qoder local `.qoder/settings.local.json` are not source-of-truth; edit source assets and regenerate with `spec-first init`, choosing the target host when prompted, when a runtime refresh is required. Qoder clean preserves `.qoder/settings.local.json` because it may contain user-owned MCP entries. Kiro-native `.kiro/specs/**` and Qoder-native `.qoder/rules/**` remain host-owned advisory input only when explicitly named.',
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
    'AI dev benchmark fixtures are advisory evidence for workflow input and artifact-shape drift. The checked-in suite currently has four repo-like fixtures (`docs-only`, `cli-bugfix`, `api-contract`, `multi-module-refactor`) and one recorded semantic-review evidence file for `api-contract`. They validate deterministic fixture contracts and evidence visibility, not LLM semantic quality or real `$spec-work` output quality.',
    '',
    '| Command | Artifact | Gate behavior | Boundary |',
    '|---|---|---|---|',
    '| `npm run test:ai-dev:benchmarks` | `.spec-first/workflows/quality-gates/ai-dev-benchmark-fixtures/benchmark-fixtures-result.json` | Fails on invalid fixture manifest/schema/path data, including missing declared semantic-review evidence files. | Deterministic fixture and evidence-shape validation only; does not run agents or workflows, and does not perform semantic scoring. |',
    '| `npm run test:ai-dev:gate` | `.spec-first/workflows/quality-gates/ai-dev-quality-gate/ai-dev-quality-gate-result.json` | Includes benchmark fixture results as `advisory`; gate-level `passed` and blocking `failures` are computed from non-advisory checks. | Advisory benchmark failures remain visible in `advisory_failures[]`; they are not release hard gates in v1. |',
    '',
    '## Release Package Evidence',
    '',
    'Release package evidence is deterministic package/install proof for maintainers and release reviewers. It records package contents and installed-CLI dry-run behavior; it does not decide whether a release should ship.',
    '',
    '| Command | Artifacts | Evidence | Boundary |',
    '|---|---|---|---|',
    '| `npm run test:release:install` / npm install matrix | `.spec-first/ci/npm-install-matrix/<runner>/package-content-manifest.json`, `init-claude-programmatic.log`, `init-codex-programmatic.log`, `init-kiro-programmatic.log`, `init-qoder-programmatic.log`, `release-artifact-summary.json` | npm pack dry-run file manifest, tarball-installed programmatic `buildInitPlan` / `applyInitPlan` evidence for Claude/Codex/Kiro/Qoder, and release reviewer summary. | Deterministic release evidence only; no dashboard, history store, GitHub Release automation, or release decision engine. |',
    '',
    '## Readiness Meaning',
    '',
    'Runtime delivery describes what commands, skills, and agents were generated. It does not mean MCP helpers or external tools are ready. Downstream workflows should read the layer-specific artifacts below instead of treating one pass/fail value as global readiness.',
    '',
    '| Layer | Entry | Canonical artifacts | Means | Does not mean |',
    '|---|---|---|---|---|',
    '| CLI/runtime health | `spec-first doctor` | doctor text/JSON report | Node/Git/package checks, generated host runtime assets, workflow surface, and stale verification evidence were inspected. | MCP/helper setup is complete or any external tool evidence is available. |',
    '| Harness setup | `/spec:mcp-setup`, `$spec-mcp-setup`, Kiro Agent Skill `spec-mcp-setup`, or Qoder project command `/spec:mcp-setup` / Skill `spec-mcp-setup` | `.spec-first/config/tool-facts.json`, `.spec-first/config/runtime-capabilities.json` | Required MCP/helper runtime facts were prepared. | Any external tool result is semantically relevant; the LLM still decides how to use direct evidence. |',
    '',
    '## Maintenance Contract',
    '',
    '- 不手改 `.claude/`、`.codex/`、`.agents/skills/`、`.kiro/skills/`、`.kiro/agents/`、`.kiro/spec-first/`、spec-first managed `.kiro/settings/`、`.qoder/commands/spec/`、`.qoder/skills/`、`.qoder/agents/`、`.qoder/spec-first/` 或 `.qoder/settings.local.json` 作为 source fix；需要刷新 runtime 时运行 `spec-first init` 并按引导选择目标宿主。`.qoder/settings.local.json` 是 host-local config output，clean 保留整文件；`.kiro/specs/**` 和 `.qoder/rules/**` 是 host-native advisory input，不是 spec-first generated mirror。',
    '- 不在本 catalog 中手写能力数量；能力数量必须由 generator 从 source/governance 推导。',
    '- Workflow runtime contracts 必须由 `docs/contracts/workflows/*.schema.json` 的 `x-spec-first-*` metadata 派生；不能在 catalog 手写 planned/producer/integrated 状态。',
    '- 新增、删除或改变 host delivery 时，同步更新 governance/source，运行 `npm run docs:runtime-catalog`，再运行 targeted governance tests。',
    '- 该 catalog 只描述 delivery surface，不判断某个 MCP/helper 当前是否 ready；setup readiness 由 `spec-mcp-setup` 产物表达。',
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
