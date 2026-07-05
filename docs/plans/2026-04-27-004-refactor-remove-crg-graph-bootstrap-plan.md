---
title: refactor: Remove internal CRG and graph-bootstrap workflow
type: refactor
status: completed
date: 2026-04-27
spec_id: 2026-04-27-004-remove-crg-graph-bootstrap
---

# refactor: Remove internal CRG and graph-bootstrap workflow

## Overview

本计划面向一个更激进、更干净的 cutover：直接删除 `src/crg/` 与 `skills/spec-graph-bootstrap/SKILL.md`，并同步退役所有以 CRG 为中心的 CLI、workflow 入口、上下文锚点、MCP readiness、native install dependency、contract/e2e/unit 测试和当前用户文档。

这不是 `docs/plans/2026-04-27-003-refactor-crg-external-code-review-graph-plan.md` 的薄 adapter 版本。003 计划仍保留 `spec-first crg <subcommand>` 作为稳定入口，而本计划按用户最新决策处理：

```text
spec-first 不再拥有 CRG runtime
spec-first 不再暴露 graph-bootstrap workflow
spec-first 不再维护 graph.db / parser / SQLite / hook / workspace graph 生命周期
```

重构后的职责边界是：

```text
spec-first = workflow source assets + deterministic install/init/doctor/tasks helpers
direct repo reads / optional external tools = 上下文事实来源
LLM = 语义判断、范围选择、review finding 与取舍决策
```

如果后续仍要集成外部 `code-review-graph`，应通过安装式 external tool 或 MCP/helper readiness 纳入 `spec-mcp-setup`，而不是复用 `spec-first crg` 或在 `src/crg/` 下保留 adapter。这样可以避免旧 CRG runtime 与外部 graph provider 形成第二真相源。

## Problem Frame

当前 CRG 已经从一个内部 graph helper 扩散成跨仓库核心基础设施：

- `bin/spec-first.js` 对 `crg` 做特殊分支并延迟加载 `src/crg/cli/router`。
- `src/cli/index.js` help 与 version onboarding 仍公开 `spec-first crg`、`spec-graph-bootstrap`。
- `src/cli/commands/doctor.js` 通过 CRG 检查 CLI、`better-sqlite3`、`tree-sitter` 和 graph contract。
- `scripts/run-ai-dev-quality-gate.js` 与 `.github/workflows/ai-dev-quality-gate.yml` 把 CRG runtime contracts 当作 AI Dev Gate 的核心。
- `skills/spec-plan`、`spec-work`、`spec-work-beta`、`spec-code-review`、`spec-write-tasks` 把 CRG hook 当作上下文入口。
- `skills/spec-mcp-setup` readiness ledger 暴露 `crg.cli_status` 与 `crg.native_modules_status`，下游写明由 graph-bootstrap 消费。
- `package.json`、`bin/postinstall.js`、`bin/prune-native.js`、`vendor/` 承担 CRG 的 Node native dependency 安装和修复。
- `tests/unit`、`tests/contracts`、`tests/e2e`、`tests/smoke`、`tests/integration` 中有大量正向断言要求 CRG 存在。

因此“直接删除目录和 skill 文件”本身不可行；可行的是按源真相面逐层删除，先迁出少数非 CRG 通用能力，再删除公开入口与运行时依赖，最后用单测和负向 contract 证明没有残留。

## Governing Principles

本计划按 `docs/10-prompt/项目角色.md` 校准：

- **确定性执行归脚本**：`init`、`doctor`、install checks、package contracts、runtime manifest generation 和 negative scans 应由脚本或测试确定性验证。
- **语义判断归 LLM**：计划、执行、review 的上下文取舍不应再由 CRG hook 或 graph quality gate 自动裁决。
- **轻 contract**：删除 CRG 后不要马上引入重型 `src/graph/` provider abstraction；外部工具先作为 advisory input 或 setup readiness fact。
- **明确边界**：`spec-first` 不读外部 graph SQLite schema，不复用旧 `.spec-first/graph/`，不在 workflow 中隐式要求 graph readiness。
- **单一真相源**：source-of-truth 是 `skills/`、`templates/`、`src/cli/`、`.claude-plugin/plugin.json`、`src/cli/contracts/**`；不要手改 `.claude/`、`.codex/`、`.agents/skills/` runtime 副本。

## Requirements Trace

| ID | Requirement | Plan Coverage |
|---|---|---|
| R1 | 直接删除 `src/crg/` | U1 先迁出 `resolveWorkflowArtifactDir`，U6 删除 CRG source tree |
| R2 | 直接删除 `skills/spec-graph-bootstrap/SKILL.md` | U3 删除 workflow source skill 与 host entrypoints |
| R3 | 删除 `spec-first crg` CLI | U2 删除 bin special branch、help、doctor CRG checks、smoke expectations |
| R4 | 删除 CRG 上下文使用 | U4 重写 plan/work/review/write-tasks/using-spec-first anchors |
| R5 | 删除相关配置 | U3/U5/U7 更新 plugin manifest、governance contracts、quality gate policy、MCP setup ledger |
| R6 | 删除安装依赖 | U6 删除 `better-sqlite3`、`tree-sitter*`、`vendor/`、postinstall repair、prune script |
| R7 | 删除 CRG 测试并补单测 | U8 明确删除旧正向测试，新增负向 contract 与 smoke/integration 覆盖 |
| R8 | 保证删除彻底 | U9 用 `rg` negative scans、package lock checks、runtime init checks、full test chain 收口 |
| R9 | 不考虑向下兼容 | 所有旧 CRG 命令和 graph-bootstrap 入口直接消失，不保留 alias |
| R10 | 不手改 runtime artifacts | U3/U9 要求通过 `spec-first init --claude|--codex` 重新生成 runtime |

## Scope Boundaries

### In Scope

- 删除 `src/crg/**` 内部实现。
- 删除 `skills/spec-graph-bootstrap/SKILL.md` source skill。
- 删除 Claude `spec-graph-bootstrap` 与 Codex `spec-graph-bootstrap` 的 source manifest/template 暴露。
- 删除 `spec-first crg` package CLI 入口与 help onboarding。
- 删除 CRG native dependency、postinstall repair、tree-sitter prune、vendored grammars。
- 删除 MCP readiness ledger 中的顶层 `crg` 字段和 native module 检测。
- 删除 workflow skills 中的 CRG hook/context anchor，改为 direct repo reads 与 optional advisory tools。
- 删除 CRG runtime/gate/contracts/e2e/unit 测试，新增负向 contract。
- 更新当前 README、用户手册、package scripts、CI path filters 和 quality gate 命名。
- 更新 `CHANGELOG.md`。

### Out Of Scope

- 不在本计划中实现新的 `src/graph/` provider layer。
- 不保留 `spec-first crg` 作为外部 `code-review-graph` adapter。
- 不自动安装 `code-review-graph`、GitNexus 或任何 Python/Node 外部 graph provider。
- 不新增 `graph_providers`、`provider-status`、GitNexus readiness、`code-review-graph` readiness 或任何 external graph provider schema。
- 不迁移 `.spec-first/graph/graph.db` 数据。
- 不删除或重写所有历史计划、release notes、archive docs 中的 CRG 叙述。
- 不直接编辑 `.claude/`、`.codex/`、`.agents/skills/` 生成资产。

### Future External `code-review-graph` Memo

本 PR 禁止新增 external graph provider readiness。本计划只删除顶层 `crg` readiness，不新增替代结构。

后续如果仍要使用外部 `code-review-graph` 工程或已安装的 `code-review-graph` 能力，应由独立计划处理。独立计划需要重新定义安装、readiness、host 配置、workflow advisory 输入和测试面，不能混入本删除 PR。

本 PR 中不得新增以下结构或命名：

- `graph_providers`
- `provider-status`
- GitNexus readiness
- `code-review-graph` readiness
- external graph provider setup summary
- external graph provider workflow handoff

## Feasibility Review Of Existing Graph Plan

`docs/02-架构设计/graph改造/整体改造方案.md` 的方向是引入 `src/graph/` provider layer，并保留 `spec-graph-bootstrap` 作为 workflow skill。该方向在“长期图谱能力”上可讨论，但不适合作为本次直接删除方案的实施源。

主要原因：

- 它仍保留 `spec-graph-bootstrap`，与用户最新要求删除 `skills/spec-graph-bootstrap/SKILL.md` 冲突。
- 它提出 `src/graph/`、`spec-first graph / impact / context / review` 等新命令，会把“删除 CRG”扩大成“新 graph platform”，风险和交付面明显增大。
- 它把 GitNexus 与 `code-review-graph` 作为默认 baseline，会使 `spec-first` 从 workflow framework 变成 graph provider orchestrator，容易偏离 `Light contract`。
- 它没有先处理现有 `resolveWorkflowArtifactDir` 被 `doctor` 与 quality gate 复用的隐藏依赖；如果直接删除 `src/crg/` 会破坏非 graph 功能。
- 它没有把旧 CRG 正向测试替换成负向 contract 的完整策略。

本计划选择更小、更可维护的路径：

```text
先彻底退役内置 CRG 和 graph-bootstrap
再按真实需要单独设计 external graph provider 集成
```

## Current Reference Surface

### CLI And Runtime Entry

- `bin/spec-first.js`：删除 `argv[0] === 'crg'` 特殊分支。
- `src/cli/index.js`：删除 `crg <subcommand>` help，删除 graph-bootstrap onboarding 示例。
- `src/cli/commands/doctor.js`：删除 CRG CLI/native/graph contract checks；迁移 workflow artifact helper。
- `scripts/run-ai-dev-quality-gate.js`：删除 CRG runtime suite 命名与 test list，改为 general workflow contract suite 或移除 CRG gate 子集。

### Source Runtime Governance

- `.claude-plugin/plugin.json`：删除 `graph-bootstrap` command 和 `spec-graph-bootstrap` skill。
- `templates/claude/commands/spec/graph-bootstrap.md`：删除。
- `src/cli/contracts/dual-host-governance/skills-governance.json`：删除 `spec-graph-bootstrap` record。
- `src/cli/plugin.js`：删除 `spec-graph-bootstrap`、CRG、graph-bootstrap high-value anchors。

### Workflow Skills

- `skills/spec-plan/SKILL.md`：删除 `CRG Planning Anchor`。
- `skills/spec-work/SKILL.md`：删除 `CRG Work Anchors`。
- `skills/spec-work-beta/SKILL.md`：删除 beta CRG anchor。
- `skills/spec-code-review/SKILL.md`：删除 `CRG Review Anchor`。
- `skills/spec-write-tasks/SKILL.md`：删除 CRG lifecycle references，调整 `orientation_evidence.provider` enum。
- `skills/spec-write-tasks/references/task-pack-schema.md`：删除 `crg` provider 与 CRG evidence guidance。
- `skills/spec-write-tasks/references/task-quality-guide.md`：删除 CRG authority 叙述。
- `skills/using-spec-first/SKILL.md`：删除 graph bootstrap / CRG readiness route。

### MCP Setup

- `skills/spec-mcp-setup/SKILL.md`：删除顶层 `crg` ledger 字段、graph-bootstrap downstream consumer、native module facts。
- `skills/spec-mcp-setup/references/supported-mcp-tools.md`：删除 CRG readiness section。
- `skills/spec-mcp-setup/scripts/detect-tools.sh`：删除 `spec-first crg --help`、`better-sqlite3`、`tree-sitter` 检测。
- `skills/spec-mcp-setup/scripts/detect-tools.ps1`：同上。
- `skills/spec-mcp-setup/scripts/verify-tools.ps1`：删除 `Facts.crg` 透传。

### Package And Install

- `package.json`：删除 `test:e2e:crg`、从 `test` 中移除该脚本、删除 CRG optional dependencies、删除 `overrides.tree-sitter`、如 `vendor/` 只服务 CRG 则从 `files` 删除。
- `package-lock.json`：同步删除 native dependency lock entries。
- `bin/postinstall.js`：删除 CRG native repair 和 `prune-native.js` 调用。
- `bin/prune-native.js`：删除。
- `vendor/tree-sitter-objc`、`vendor/tree-sitter-swift`：删除。
- `.github/workflows/npm-install-matrix.yml`：删除对 CRG native packages 的特殊允许逻辑。

### Contracts, Tests, And CI

- `.github/workflows/ai-dev-quality-gate.yml`：删除 `src/crg/**`、`docs/contracts/crg/**`、CRG unit test path filters。
- `src/cli/contracts/quality-gates/branch-protection-policy.json`：删除 CRG policy wording 与 paths，改为 workflow/source governance。
- `docs/contracts/crg/**`：删除当前 CRG schemas，或迁入 archive 并从 current contracts 移除。
- `tests/contracts/crg-cli-v1.test.js`：删除。
- `tests/e2e/crg-*.sh` 与 `tests/e2e/spec-graph-bootstrap-*.sh`：删除。
- `tests/unit/crg-*.test.js`、`tests/unit/spec-graph-bootstrap-contracts.test.js`、`tests/unit/review-context.test.js`：删除或迁移非 CRG helper tests。

### Current User Docs

- `README.md`、`README.zh-CN.md`：删除当前 CRG / graph-bootstrap / native parser / `spec-first crg` / `test:e2e:crg` 叙述。
- 历史 `docs/plans/**`、`docs/brainstorms/**`、`docs/archive/**`、`docs/08-版本更新/**`：不做全量重写；只要不是当前指南，可保留历史事实。

### Current Design Docs

- `docs/02-架构设计/graph改造/**`：不删除，但不再作为 current runtime contract。
- 每个仍可被搜索到的 graph 改造设计文档顶部都要加 superseded notice，避免未来 agent 误把旧 `src/graph/`、GitNexus baseline 或 `spec-graph-bootstrap` 方向当作当前实施依据。

Recommended notice:

```markdown
> 状态说明：本文是 CRG 删除前后的探索性设计记录，不代表当前 runtime contract。
> 当前实现已移除内置 CRG 与 graph-bootstrap workflow。
> 如需恢复图谱能力，请另见后续 external graph provider 集成方案。
```

## Key Technical Decisions

### D1. 删除而不是 adapter

不保留 `spec-first crg` alias，也不把它改成外部 `code-review-graph` wrapper。原因：

- 用户明确不考虑向下兼容。
- 保留旧命令会让 `spec-first crg` 成为新的 compatibility surface。
- 旧 skill/tests/docs 会继续围绕 CRG 入口生长，删除不彻底。

### D2. 先迁出通用 artifact helper

`src/crg/artifact-paths.js` 里有一个非 CRG 通用函数 `resolveWorkflowArtifactDir`，当前被 `doctor` 和 `scripts/run-ai-dev-quality-gate.js` 使用。删除 `src/crg/` 前必须迁移该函数，唯一落点固定为：

```text
src/verification/artifact-paths.js
```

不保留 `src/cli/artifacts.js` 备选，避免实施时发散。迁移后 `src/crg/artifact-paths.js` 中其他 graph/workspace resolver 一并删除。

### D3. 上下文消费回到 direct repo reads

删除 CRG 后，plan/work/review/write-tasks 的上下文策略改成：

```text
source plan / task pack / diff / AGENTS.md / package manifests / nearby code / nearby tests
```

Serena、LSP、external `code-review-graph`、GitNexus 等工具只能作为可选 advisory provider，不能成为 workflow hard precondition。

### D4. 删除 graph-bootstrap 公开 workflow

`graph-bootstrap` 不是改名，也不是隐藏 internal skill，而是从 source runtime governance 中删除。`using-spec-first` 不再把“repository fact preparation / query-first context quality”路由到 graph-bootstrap。此类请求按真实意图进入：

- planning：`spec-plan`
- execution：`spec-work`
- setup/readiness：`spec-mcp-setup`
- review：`spec-code-review` 或 `spec-doc-review`

### D5. MCP readiness 不再报告 CRG native module

删除顶层 `crg` ledger 字段，不保留 `unavailable` 占位。否则下游会继续把 CRG 当作现行能力。

本计划只删除顶层 `crg` readiness，不新增 `graph_providers`。external graph provider readiness 由后续独立计划处理。

本 PR 中不得新增：

- GitNexus readiness
- `code-review-graph` readiness
- `graph_providers`
- `provider-status`
- graph provider install summary
- graph provider workflow handoff

### D6. 单测从“CRG 存在”转为“CRG 已退役”

旧 CRG 正向测试应删除，而不是改成 skip。新增单测应证明：

- CLI help 不再显示 `crg`。
- `spec-first crg` 不再特殊路由。
- package 不再包含 CRG native dependencies。
- plugin/governance/templates 不再暴露 graph-bootstrap。
- workflow skills 不再包含 `spec-first crg hook`。
- MCP ledger schema 不再包含顶层 `crg`。
- current contracts/quality gates 不再以 CRG 命名。

### D7. `summarizeChangeSurface` 默认随 CRG 删除

`summarizeChangeSurface` 默认与 `src/crg/changes.js` 一起删除，不迁移。

只有在实施时发现现有非 CRG workflow gate 或非 CRG 测试直接失败，并且该使用可以证明独立于 graph/runtime/review-context 语义时，才允许迁移。迁移也必须保持最小范围，例如后续独立 PR 中引入 `src/context-routing/change-surface.js` 或 `src/verification/change-surface.js`，而不是在本删除 PR 中顺手保留 CRG 心智。

## High-Level Before/After

### Before

```text
spec-first
  bin/spec-first.js
    -> crg special branch
  src/crg/
    -> parser + graph + SQLite + retrieval + hooks + workspace + quality
  skills/spec-graph-bootstrap/
    -> build graph + hand off query-first context
  workflow skills
    -> spec-first crg hook before-plan/before-work/before-review
  spec-mcp-setup
    -> crg.cli_status + crg.native_modules_status
  package install
    -> better-sqlite3 + tree-sitter* + postinstall repair
```

### After

```text
spec-first
  bin/spec-first.js
    -> normal CLI only
  src/cli/ + src/verification/
    -> install/init/doctor/tasks/workflow artifact helpers
  workflow skills
    -> direct repo reads + optional advisory tools
  spec-mcp-setup
    -> MCP/helper readiness only, no CRG native facts
  package install
    -> no CRG native dependencies, no tree-sitter prune
```

## Implementation Units

### U1. Migrate Shared Workflow Artifact Helper

Goal: make `src/crg/` removable without breaking non-CRG workflow artifacts.

Files:

- Add `src/verification/artifact-paths.js`.
- Update `src/cli/commands/doctor.js`.
- Update `scripts/run-ai-dev-quality-gate.js`.
- Update `tests/unit/crg-artifact-paths.test.js` by replacing it with a non-CRG artifact-path test, or create `tests/unit/workflow-artifact-paths.test.js`.
- Add a hard source-import contract in `tests/unit/no-crg-runtime-contracts.test.js` or the new artifact-path test.

Implementation notes:

- Move only `SPEC_FIRST_DIR`, `WORKFLOWS_SUBDIR`, and `resolveWorkflowArtifactDir`.
- Do not move graph/workspace constants.
- Keep current layout `<repoRoot>/.spec-first/workflows/<workflow>/<slug>/`.
- Preserve `artifactAnchorRoot` option because quality gate and doctor may rely on it.

Test scenarios:

- `resolveWorkflowArtifactDir(repo, 'verification', 'my-repo')` returns `.spec-first/workflows/verification/my-repo`.
- Empty workflow throws the existing error semantic.
- Empty slug throws the existing error semantic.
- `artifactAnchorRoot` overrides output root.
- `doctor` can still read verification evidence without importing `src/crg`.
- AI Dev Quality Gate can still write artifacts without importing `src/crg`.
- `doctor` and AI Dev Quality Gate import `src/verification/artifact-paths`, never `src/crg`.

Required source-import assertion:

```js
test('doctor and quality gate do not import src/crg', () => {
  const doctorSource = fs.readFileSync('src/cli/commands/doctor.js', 'utf8');
  const gateSource = fs.readFileSync('scripts/run-ai-dev-quality-gate.js', 'utf8');

  expect(doctorSource).not.toContain('src/crg');
  expect(gateSource).not.toContain('src/crg');
  expect(doctorSource).toContain('src/verification/artifact-paths');
  expect(gateSource).toContain('src/verification/artifact-paths');
});
```

### U2. Remove `spec-first crg` CLI And Doctor Checks

Goal: the package no longer exposes or diagnoses CRG.

Files:

- `bin/spec-first.js`
- `src/cli/index.js`
- `src/cli/commands/doctor.js`
- `tests/smoke/cli.sh`
- `tests/unit/doctor*.test.js` if present
- `tests/unit/cli*.test.js` if present

Implementation notes:

- Delete `argv[0] === 'crg'` branch.
- Delete `crg <subcommand>` from help.
- Delete graph-bootstrap examples from version onboarding.
- Delete `checkCrgNativeModules`.
- Delete `checkCrgGraphContract`.
- Delete `buildGraphStatus` import.
- Keep `doctor` checks for Node, Git, plugin manifest, developer profile, runtime assets and verification evidence.

Test scenarios:

- `spec-first --help` does not contain `crg <subcommand>`.
- `spec-first --version` does not suggest `spec-graph-bootstrap`.
- `spec-first crg --help` exits non-zero through normal CLI path; the test should not bind to exact wording.
- Unknown command output matches `/unknown command|unknown|unsupported|invalid/i`.
- Unknown command output does not contain `src/crg` or `crg <subcommand>`.
- `doctor --json` has no check named `CRG`, `CRG CLI`, `CRG graph`, `CRG (better-sqlite3)`, or `CRG (tree-sitter)`.
- `doctor --json` check id/name/message fields do not contain `CRG`, `better-sqlite3`, `tree-sitter`, or `graph contract`.
- `doctor` still reports plugin/runtime/developer profile checks.

### U3. Remove graph-bootstrap Workflow From Source Runtime Governance

Goal: source-of-truth no longer installs `spec-graph-bootstrap`.

Files:

- Delete `skills/spec-graph-bootstrap/SKILL.md`.
- Delete `templates/claude/commands/spec/graph-bootstrap.md`.
- Update `.claude-plugin/plugin.json`.
- Update `src/cli/contracts/dual-host-governance/skills-governance.json`.
- Update `src/cli/plugin.js`.
- Update `src/cli/commands/init.js`.
- Update `src/cli/commands/clean.js`.
- Update runtime asset management module if present, for example `src/cli/runtime-assets.js` or equivalent managed asset planner.
- Update `tests/unit/dual-host-governance-contracts.test.js`.
- Update `tests/unit/plugin*.test.js` or asset consistency tests if present.
- Update `tests/unit/init*.test.js`.
- Update `tests/unit/clean*.test.js`.
- Update `tests/smoke/install-local.sh`.
- Update `tests/smoke/cli.sh`.
- Delete `tests/e2e/spec-graph-bootstrap-mainline.sh`.
- Delete `tests/e2e/spec-graph-bootstrap-installed-runtime.sh`.

Implementation notes:

- Remove both command and skill from plugin manifest.
- Remove graph-bootstrap from bundled command list expectations.
- Do not hand edit `.claude/commands/spec/graph-bootstrap.md` or `.agents/skills/spec-graph-bootstrap/SKILL.md`.
- Verify `init --claude` / `init --codex` source generation no longer creates graph-bootstrap runtime files.
- Verify obsolete managed asset removal still removes old graph-bootstrap runtime files when previous state contains them.
- Verify `clean --claude` / `clean --codex` can remove old managed graph-bootstrap runtime files without treating unmanaged user files as spec-first-owned.

Test scenarios:

- `.claude-plugin/plugin.json` contains no `graph-bootstrap` command.
- `.claude-plugin/plugin.json` contains no `spec-graph-bootstrap` skill.
- `skills-governance.json` contains no `spec-graph-bootstrap`.
- `src/cli/plugin.js` no longer has high-value anchors for CRG/graph-bootstrap.
- `spec-first init --claude --dry-run` does not plan graph-bootstrap creation.
- `spec-first init --codex --dry-run` does not plan `spec-graph-bootstrap` creation.
- Existing managed graph-bootstrap runtime is listed as obsolete and removable by init/clean logic, not manually edited.
- Existing non-managed graph-bootstrap runtime is preserved or reported as a conflict; it must not be silently deleted.

### U4. Rewrite Workflow Context Strategy

Goal: workflows remain useful without CRG hooks.

Files:

- `skills/spec-plan/SKILL.md`
- `skills/spec-work/SKILL.md`
- `skills/spec-work-beta/SKILL.md`
- `skills/spec-code-review/SKILL.md`
- `skills/spec-write-tasks/SKILL.md`
- `skills/spec-write-tasks/references/task-pack-schema.md`
- `skills/spec-write-tasks/references/task-quality-guide.md`
- `skills/using-spec-first/SKILL.md`
- `tests/unit/spec-plan-contracts.test.js`
- `tests/unit/spec-work-contracts.test.js`
- `tests/unit/spec-work-beta-contracts.test.js`
- `tests/unit/spec-code-review-contracts.test.js`
- `tests/unit/spec-write-tasks-contracts.test.js`
- `tests/unit/task-pack-command.test.js`

Replacement strategy:

- Add a shared `Context Orientation Anchor` posture to every affected workflow, with local wording adapted per skill.
- `spec-plan`: replace `CRG Planning Anchor` with `Context Orientation Anchor`; start from requirements/plan input, `AGENTS.md`, nearby code/tests, package manifests and repo conventions. Optional tools may inform candidate surfaces but do not select scope.
- `spec-work`: replace before/after hook with plan/task-pack guided direct reads, `git diff`, targeted tests and explicit scope expansion notes.
- `spec-work-beta`: pass bounded direct-read context to delegates; do not pass CRG work-run ids.
- `spec-code-review`: start from diff, plan/task-pack/work artifact if present, targeted file reads and tests. External graph evidence can prioritize inspection only if already provided.
- `spec-write-tasks`: remove CRG lifecycle handoff; orientation evidence provider enum becomes `direct-repo-reads | serena-lsp | mixed | skipped`.
- `using-spec-first`: remove route for graph bootstrap, CRG readiness, workspace child-repo topology and query-first context quality.

Shared anchor language:

```markdown
## Context Orientation Anchor

When graph evidence is unavailable, orient from:
1. current user request / requirement
2. existing plan or task pack
3. AGENTS.md / CLAUDE.md / project role docs
4. package manifests and command registry
5. nearby implementation files
6. nearby tests
7. git diff and changed files when applicable

External tools may prioritize inspection, but they do not define scope authority.
```

Test scenarios:

- Contract tests assert no skill source contains `spec-first crg hook`.
- Contract tests assert no skill source contains `spec-graph-bootstrap`.
- `spec-plan` contract asserts direct repo reads fallback is primary, not CRG fallback.
- `spec-work` contract asserts scope expansion is judged from plan/task-pack and diff, not CRG after-work.
- `spec-code-review` contract asserts reviewer owns findings and starts from diff.
- `spec-write-tasks` contract asserts provider enum excludes `crg`.
- `task-pack-command` tests no longer import `src/crg/hooks/before-work`.

### U5. Remove MCP Setup CRG Readiness Ledger

Goal: setup no longer reports or depends on internal CRG readiness.

Files:

- `skills/spec-mcp-setup/SKILL.md`
- `skills/spec-mcp-setup/references/supported-mcp-tools.md`
- `skills/spec-mcp-setup/scripts/detect-tools.sh`
- `skills/spec-mcp-setup/scripts/detect-tools.ps1`
- `skills/spec-mcp-setup/scripts/verify-tools.ps1`
- `tests/unit/mcp-setup.sh`
- `tests/unit/mcp-setup-powershell-contracts.test.js`

Implementation notes:

- Delete shell functions `crg_cli_status`, `crg_native_modules_status`, and `crg_can_resolve_module`.
- Delete PowerShell CRG CLI/native module detection.
- Delete `crg` object from readiness JSON.
- Delete next actions `install or repair spec-first crg CLI` and `repair better-sqlite3/tree-sitter native modules`.
- Delete downstream consumer wording pointing to `skills/spec-graph-bootstrap/SKILL.md`.
- Do not add replacement provider readiness in this PR. No `graph_providers`, no GitNexus readiness, no `code-review-graph` readiness, no provider-status file.

Test scenarios:

- `detect-tools.sh` output has no top-level `crg`.
- `detect-tools.ps1` output has no top-level `crg`.
- Readiness JSON string does not contain `"crg"`, `native_modules_status`, `better-sqlite3`, or `tree-sitter`.
- Readiness JSON string does not contain `graph_providers`, `provider-status`, `GitNexus`, or `code-review-graph`.
- `verify-tools.ps1` no longer reads `$Facts.crg`.
- `mcp-setup.sh` no longer creates fake `spec-first crg`.
- `mcp-setup.sh` no longer fakes `better-sqlite3` or `tree-sitter` for setup readiness.
- `supported-mcp-tools.md` no longer lists graph-bootstrap as downstream consumer.

### U6. Remove CRG Source, Contracts, Native Dependencies, And Install Repair

Goal: package contains no internal graph engine and no CRG native install surface.

Files:

- Delete `src/crg/**`.
- Delete `docs/contracts/crg/**` from current contracts.
- Delete `bin/prune-native.js`.
- Update `bin/postinstall.js`.
- Update `package.json`.
- Update `package-lock.json`.
- Delete `vendor/tree-sitter-objc/**`.
- Delete `vendor/tree-sitter-swift/**`.
- Update `.github/workflows/npm-install-matrix.yml`.
- Update `tests/unit/package-install-contracts.test.js`.
- Update `tests/smoke/install-tarball.sh`.

Implementation notes:

- Remove `better-sqlite3`.
- Remove `tree-sitter`.
- Remove every `tree-sitter-*` optional dependency.
- Remove `overrides.tree-sitter`.
- Remove `vendor/` from `package.json.files` if no other feature uses it.
- Remove `postinstall` CRG native repair; keep only install summary behavior that still applies.
- Remove `prune-native.js` invocation from postinstall.
- Regenerate `package-lock.json` using `npm install --package-lock-only`; do not hand-edit lock entries.

Postinstall deletion contract:

- Delete `better-sqlite3` repair.
- Delete `tree-sitter` repair.
- Delete `prune-native` invocation.
- Delete `npm rebuild` hints.
- Delete `prebuild-install` hints.
- Delete CRG native troubleshooting.

Postinstall preservation contract:

- Keep runtime asset summary if still present.
- Keep `spec-first init` guidance.
- Keep non-native Claude/Codex setup hints.

Test scenarios:

- `package.json` dependencies and optionalDependencies do not include `better-sqlite3`, `tree-sitter`, or `tree-sitter-*`.
- `package-lock.json` does not contain `node_modules/better-sqlite3`, `node_modules/tree-sitter`, or `node_modules/tree-sitter-*`.
- `bin/postinstall.js` does not mention CRG, `better-sqlite3`, `tree-sitter`, `npm rebuild`, or `prebuild-install`.
- `bin/postinstall.js` still mentions `spec-first init`, managed assets, Claude, or Codex where those hints remain part of install UX.
- `bin/prune-native.js` does not exist.
- `vendor/tree-sitter-objc` and `vendor/tree-sitter-swift` do not exist.
- `npm pack --dry-run` output does not include `src/crg`, `vendor/tree-sitter-*`, `skills/spec-graph-bootstrap`, or `templates/claude/commands/spec/graph-bootstrap.md`.
- `tests/smoke/install-tarball.sh` or package contract runs `npm pack --dry-run` and rejects `src/crg`, `tree-sitter`, `better-sqlite3`, and `graph-bootstrap` in the packed file list.
- Install tarball smoke no longer checks Swift parser or optional native missing path.

### U7. Rename AI Dev CRG Runtime Gate

Goal: quality gate no longer preserves CRG by name or path.

Files:

- `scripts/run-ai-dev-quality-gate.js`
- `.github/workflows/ai-dev-quality-gate.yml`
- `src/cli/contracts/quality-gates/branch-protection-policy.json`
- `tests/unit/ai-dev-quality-gate.test.js`
- `tests/unit/quality-feedback.test.js`
- `tests/unit/branch-protection-policy.test.js`
- `tests/integration/verification-gate.integration.test.js`

Implementation notes:

- Rename, do not remove, the AI Dev Quality Gate contract suite. Deleting CRG does not delete the need for deterministic workflow/runtime governance checks.
- Rename `CRG_RUNTIME_CONTRACT_TESTS` to `WORKFLOW_RUNTIME_CONTRACT_TESTS`.
- Rename `runCrgRuntimeContractsSuite` to a neutral function.
- Rename artifact `crg-runtime-contracts.junit.json` to `workflow-runtime-contracts.junit.json`.
- Rename check id `crg-runtime-contracts` to `workflow-runtime-contracts`.
- Remove `src/crg/**` and `docs/contracts/crg/**` from workflow triggers.
- Keep AI Dev Quality Gate focused on install/init/doctor/tasks/workflow prose contracts.

Test scenarios:

- Gate output has no `crg-runtime-contracts` check id.
- Gate artifact filenames do not include `crg`.
- Branch protection policy reason does not mention CRG.
- Branch protection policy paths do not include `src/crg/**` or `docs/contracts/crg/**`.
- Integration test expects workflow contract paths, not CRG paths.

### U8. Test Suite Cleanup And New Negative Contracts

Goal: replace old positive CRG coverage with deletion guarantees.

Delete or retire:

- `tests/contracts/crg-cli-v1.test.js`
- `tests/e2e/crg-all-commands.sh`
- `tests/e2e/crg-sqlite-audit.sh`
- `tests/e2e/crg-workspace-mainline.sh`
- `tests/e2e/spec-graph-bootstrap-mainline.sh`
- `tests/e2e/spec-graph-bootstrap-installed-runtime.sh`
- `tests/unit/crg-*.test.js`
- `tests/unit/spec-graph-bootstrap-contracts.test.js`
- `tests/unit/review-context.test.js`

Migrate only if still valuable outside CRG:

- `tests/unit/change-surface.test.js`: either delete with `src/crg/changes.js`, or migrate `summarizeChangeSurface` to a non-CRG module if workflow quality gate still needs it.
- `tests/unit/task-pack-command.test.js`: remove CRG before-work hook integration; keep task pack validator/hash tests.
- `tests/unit/stage0-context-monorepo.test.js`: remove CRG before-work expectation if the file still exists for legacy Stage-0 assertions.

Add or update negative contract tests:

- `tests/unit/no-crg-runtime-contracts.test.js`
- `tests/unit/package-install-contracts.test.js`
- `tests/unit/dual-host-governance-contracts.test.js`
- `tests/unit/spec-plan-contracts.test.js`
- `tests/unit/spec-work-contracts.test.js`
- `tests/unit/spec-work-beta-contracts.test.js`
- `tests/unit/spec-code-review-contracts.test.js`
- `tests/unit/spec-write-tasks-contracts.test.js`
- `tests/unit/mcp-setup-powershell-contracts.test.js`
- `tests/unit/mcp-setup.sh`
- `tests/smoke/cli.sh`
- `tests/smoke/install-local.sh`
- `tests/smoke/install-tarball.sh`

Negative scan allowlist:

- Allow historical mentions in `CHANGELOG.md`, `docs/plans/**`, `docs/brainstorms/**`, `docs/archive/**`, `docs/08-版本更新/**`, and this plan.
- Disallow current runtime/source mentions in `bin/`, `src/`, `skills/`, `templates/`, `.claude-plugin/`, `tests/`, `scripts/`, `.github/`, `package.json`, `package-lock.json`, and current README files.

Required negative assertions:

- No current source file imports `src/crg`.
- No current runtime governance file references `spec-graph-bootstrap`.
- No current skill source references `spec-first crg`.
- No current test source requires `../../src/crg`.
- No package dependency references `better-sqlite3` or `tree-sitter`.
- No smoke test expects graph-bootstrap.

### U9. Documentation And Runtime Regeneration Guidance

Goal: users and future agents do not follow retired CRG instructions.

Files:

- `README.md`
- `README.zh-CN.md`
- `docs/02-架构设计/graph改造/整体改造方案.md` if it remains discoverable as current guidance
- `docs/02-架构设计/graph改造/mcp-setup重构方案.md` if it remains discoverable as current guidance
- `CHANGELOG.md`

Implementation notes:

- Current user docs: must delete CRG runtime instructions.
- Current design docs: if they still reference CRG or graph-bootstrap, add the superseded notice from this plan.
- Historical/archive docs: may keep CRG historical facts and should not be rewritten just to satisfy negative scans.
- README should describe current workflow entrypoints without graph-bootstrap.
- Remove `spec-first crg` command reference.
- Remove CRG native parser install notes.
- Remove `test:e2e:crg` from local development docs.
- If graph改造 docs remain exploratory, add status language that they are not current runtime contract.
- README should not promise future graph provider integration. Prefer: "The internal CRG runtime and graph-bootstrap workflow have been removed. Current workflows rely on explicit repo context, task packs, diffs, tests, and optional tools supplied by the user or host."
- README should include a current replacement path for codebase context after CRG removal, without mentioning GitNexus or `code-review-graph`.
- Do not edit `.claude/`, `.codex/`, `.agents/skills/` manually.
- After source changes, validate runtime generation through `spec-first init --claude|--codex` in tests or dry-run paths.

Recommended README section:

```markdown
## Codebase context after CRG removal

The internal CRG runtime has been removed. For current workflows:

- Use `spec-plan` for design and implementation planning.
- Use `spec-write-tasks` to compile executable task packs.
- Use `spec-work` with direct repo reads, nearby files, task packs, diffs, and tests.
- Use `spec-code-review` for review from diff, plan/task evidence, targeted file reads, and test results.
- Use `spec-mcp-setup` only for MCP/helper readiness, not graph readiness.
```

Test scenarios:

- README current sections contain no `spec-first crg`.
- README current sections contain no `spec-graph-bootstrap`.
- Runtime install smoke confirms generated command/skill counts after deletion.
- Obsolete managed graph-bootstrap runtime is cleaned by managed asset removal flow.
- README contains the replacement path section and does not mention GitNexus or `code-review-graph` as a promised replacement.
- `CHANGELOG.md` includes a breaking-change entry for removing internal CRG, graph-bootstrap, `spec-first crg`, `graph.db`, native CRG dependencies, and CRG tests.

## Unit Test Strategy

### Minimum Unit Coverage

| Area | Required tests |
|---|---|
| Artifact helper migration | `tests/unit/workflow-artifact-paths.test.js` covers path layout, validation errors, `artifactAnchorRoot` |
| CLI deletion | `tests/smoke/cli.sh` and/or Jest CLI test asserts no `crg` help and unknown command for `crg` |
| Doctor deletion | Doctor JSON/unit test asserts no CRG checks and no native module probes |
| Runtime governance | Dual-host/plugin contract tests assert no graph-bootstrap command/skill |
| Workflow prose | Contract tests assert no `spec-first crg hook`, no graph-bootstrap entrypoint, direct repo reads language exists |
| Task pack schema | Contract tests assert `orientation_evidence.provider` excludes `crg` |
| MCP setup | Shell and PowerShell tests assert readiness ledger has no top-level `crg` |
| Package install | Package contract asserts no CRG native deps in `package.json` or `package-lock.json` |
| Postinstall | Contract/smoke asserts postinstall has no CRG repair path |
| Quality gate | Unit/integration asserts neutral workflow runtime gate naming and no CRG path filters |
| Deletion completeness | `tests/unit/no-crg-runtime-contracts.test.js` scans current source/test/runtime governance allowlisted paths |

### Tests To Delete Rather Than Rewrite

Delete tests whose only value is preserving old CRG behavior:

- CRG parser, migrations, graph, retrieval, flows, communities, quality, workspace, CLI router, SQLite audit, native module behavior.
- Graph-bootstrap installed runtime e2e.
- CRG CLI v1 contract.

Do not keep these as skipped tests. Skipped tests preserve obsolete ownership and invite accidental restoration.

Do not replace deleted CRG tests with snapshots of old CRG prose. Snapshotting retired wording preserves the same stale ownership in a harder-to-review form.

### Characterization Tests Before Deletion

No characterization tests are required for deleted CRG behavior because the desired behavior is removal, not preservation.

Characterization is required only for shared survivors:

- `resolveWorkflowArtifactDir`
- task pack validator/hash behavior if currently coupled to CRG hook tests
- AI Dev Quality Gate artifact writing if currently importing CRG path helpers
- runtime obsolete asset removal if graph-bootstrap runtime cleanup relies on existing managed asset logic

## Verification Commands

Targeted verification after implementation:

```bash
npm run typecheck
npm run test:unit
npm run test:smoke
npm run test:integration
npm run build
npm test
```

`npm test` must no longer run `test:e2e:crg`.

Deletion completeness scans:

Strict runtime/source scan:

```bash
! rg -n \
  "src/crg|spec-first crg|spec-graph-bootstrap|graph-bootstrap|graph\\.db|crg\\.native_modules_status|crg\\.cli_status" \
  bin src skills templates tests scripts .github package.json package-lock.json .claude-plugin
```

If a negative contract test needs to assert retired literals, it should construct the literal from split tokens or keep the literal in a scan allowlist fixture. The strict scan should not be weakened by direct forbidden strings inside the tests that are supposed to enforce deletion.

Package dependency scan:

```bash
test ! -e bin/prune-native.js
! rg -n \
  "better-sqlite3|tree-sitter" \
  package.json package-lock.json bin/postinstall.js .github tests/smoke
```

Current user docs scan:

```bash
doc_targets=(README.md README.zh-CN.md)
[ -d docs/user-manual ] && doc_targets+=(docs/user-manual)
[ -f docs/README.md ] && doc_targets+=(docs/README.md)
! rg -n \
  "spec-first crg|spec-graph-bootstrap|\\spec-graph-bootstrap|graph\\.db|test:e2e:crg" \
  "${doc_targets[@]}"
```

Do not run the strict no-CRG scan over all `docs/**`. Historical plans, archives, brainstorms, release notes, and changelog entries can preserve historical facts.

## Sequencing

### Phase 0. Confirm Dirty Worktree And Scope

- Preserve existing uncommitted user changes.
- Do not delete user-created docs under `docs/02-架构设计/graph改造/` unless explicitly requested.
- Apply changes surgically by ownership area.

### Phase 1. Unblock Deletion

- Migrate `resolveWorkflowArtifactDir` to `src/verification/artifact-paths.js`.
- Update doctor and AI Dev Quality Gate imports.
- Add unit tests for the migrated helper.

### Phase 2. Remove Public CRG Entry Points

- Remove `bin/spec-first.js` CRG branch.
- Update CLI help and version text.
- Remove doctor CRG checks.
- Update smoke/doctor tests.

### Phase 3. Remove graph-bootstrap Runtime Source

- Delete skill and command template.
- Update plugin manifest/governance/plugin anchor contracts.
- Update init/clean runtime asset planner tests and install smoke tests.

### Phase 4. Rewrite Workflow Skills

- Replace CRG anchors with direct repo read orientation.
- Remove CRG provider enum from task pack docs.
- Update prose contract tests.

### Phase 5. Remove MCP CRG Readiness

- Delete shell/PowerShell CRG detection.
- Update readiness ledger docs and tests.

### Phase 6. Remove Engine, Dependencies, And Install Repair

- Delete `src/crg/**`.
- Delete CRG contracts and e2e/unit tests.
- Remove package native dependencies and lock entries.
- Remove `vendor/` grammar packages and `bin/prune-native.js`.
- Update postinstall and install tarball smoke.

### Phase 7. Update Quality Gate And Docs

- Rename CRG runtime contract suite to neutral `workflow-runtime-contracts`; do not remove AI Dev Quality Gate in this PR.
- Update CI path filters and branch protection policy.
- Update README files and current architecture docs.

### Phase 8. Run Full Verification

- Run targeted unit/smoke/integration/build.
- Run negative scans.
- Run full `npm test`.
- Review `npm pack --dry-run` output for deleted files.

## Risks And Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Hidden non-CRG imports from `src/crg` remain | CLI or tests fail after directory deletion | U1 migration plus negative scan |
| Runtime still exposes graph-bootstrap | Users can invoke removed workflow | U3 source governance update plus init smoke |
| MCP setup still writes `crg` ledger | Downstream workflows infer CRG exists | U5 schema/test update |
| Package lock retains native deps | Install remains slow/fragile | U6 package-lock negative assertions |
| Existing workflow prose loses context guidance | Plan/work/review quality drops | U4 direct repo reads replacement with explicit orientation rules |
| Historical docs confuse future agents | Agents follow retired CRG route | Update current README and mark graph改造 docs as exploratory if needed |
| Quality gate name remains CRG | CI preserves stale mental model | U7 neutral rename and tests |
| Old generated runtime files linger in local repos | `spec-graph-bootstrap` still appears until re-init | Do not hand edit runtime; document and test managed obsolete removal through init |

## Done Signals

Implementation is complete only when all are true:

- `src/crg/` does not exist.
- `src/verification/artifact-paths.js` exists.
- `src/crg/artifact-paths.js` does not exist.
- `src/cli/commands/doctor.js` and `scripts/run-ai-dev-quality-gate.js` import `src/verification/artifact-paths`, not `src/crg`.
- `skills/spec-graph-bootstrap/SKILL.md` does not exist.
- `templates/claude/commands/spec/graph-bootstrap.md` does not exist.
- `bin/spec-first.js` has no CRG branch.
- `spec-first --help` does not advertise `crg`.
- `spec-first crg --help` is an unknown command.
- `.claude-plugin/plugin.json` contains no `graph-bootstrap` or `spec-graph-bootstrap`.
- `skills-governance.json` contains no `spec-graph-bootstrap`.
- `using-spec-first` contains no graph-bootstrap route.
- `spec-plan` / `spec-work` / `spec-work-beta` / `spec-code-review` / `spec-write-tasks` contain no `spec-first crg hook`.
- `spec-write-tasks` provider enum excludes `crg`.
- `spec-mcp-setup` readiness ledger has no top-level `crg`.
- `spec-mcp-setup` readiness ledger has no `graph_providers`, GitNexus readiness, `code-review-graph` readiness, or provider-status replacement.
- `doctor` has no CRG checks.
- `package.json` and `package-lock.json` contain no `better-sqlite3` or `tree-sitter*`.
- `bin/postinstall.js` contains no CRG native repair.
- `bin/prune-native.js` does not exist.
- `vendor/tree-sitter-objc` and `vendor/tree-sitter-swift` do not exist.
- AI Dev Quality Gate uses `workflow-runtime-contracts`, not `crg-runtime-contracts`.
- `npm test` does not invoke `test:e2e:crg`.
- Current README files do not instruct users to run graph-bootstrap or `spec-first crg`.
- Current README files include the codebase context replacement path after CRG removal.
- `docs/02-架构设计/graph改造/**` docs that remain searchable contain the superseded notice.
- `CHANGELOG.md` includes a breaking-change entry for removing internal CRG, graph-bootstrap, `spec-first crg`, `graph.db`, native CRG dependencies, and CRG tests.
- Negative contract tests and full verification commands pass.

## Open Decisions Before Implementation

1. Whether any non-managed local graph-bootstrap runtime files should be preserved with a warning or reported as explicit conflicts during clean/init.

## Recommended Implementation Posture

Use deletion-first, contract-backed execution:

- Do U1 first because it prevents accidental breakage outside CRG.
- Remove public entrypoints before deleting internals, so tests fail against the intended public behavior early.
- Delete old CRG positive tests in the same change wave as source deletion.
- Add negative tests immediately after each surface deletion.
- Avoid speculative graph provider abstraction until the deleted baseline is stable.

This keeps the migration aligned with the project role baseline: scripts verify concrete source/runtime/install facts, while LLM workflows continue to make semantic decisions from direct, inspectable repository context.
