---
title: refactor: 简化 spec-mcp-setup 默认执行流程
type: refactor
status: completed
date: 2026-07-08
spec_id: 2026-07-08-002-mcp-setup-lightweight-default-flow
origin_verification_status: not-applicable
---

# refactor: 简化 spec-mcp-setup 默认执行流程

## Summary

本方案将 `spec-mcp-setup` 的默认用户体验收敛为轻量三阶段：诊断目标与 readiness、只执行明确授权的修复、输出分层摘要与 next actions。现有 provider/runtime 深度 setup 能力保留，但从默认热路径移到显式 opt-in 路径，降低首次运行复杂度，并保持后续 `spec-*` workflows 可消费的 readiness facts。

## Decision Brief

- **Recommended approach:** 扩展现有 `spec-mcp-setup` source，而不是新增 setup workflow；默认路径先做 read-only 或低副作用诊断，深度 provider first-generation 通过 `--runtime`、`--only codegraph`、`--only graphify`、`--refresh` 等显式选择进入。
- **Key decisions:** bare `spec-mcp-setup` 不再等价于自动安装 CodeGraph/Graphify 默认 provider pack；`--project-config` 只处理 project-local config；helper 工具如 `agent-browser`、`ast-grep` 默认报告 readiness 和安装建议，不做批量安装。
- **Validation focus:** status renderer 与 setup 脚本的 contract tests 必须证明默认输出简洁、explicit mode 能力仍存在、Project local config 产物未丢失。
- **Largest risks / boundaries:** 不能删除现有 provider/setup 能力，不能让 optional provider readiness 被后续 workflow 当作 confirmed code-understanding truth，不能手改 generated runtime mirrors。

## Problem Frame

当前 `spec-mcp-setup` 已承接 Required Harness Runtime、helper tools、host config、provider readiness、generated runtime freshness、project-local config bootstrap 等多类责任。问题不在能力缺失，而在默认执行体验过重：

- bare setup 同时讲 project config、host MCP/runtime、provider first-generation、Graphify hook、CodeGraph index repair，用户很难判断第一步到底会检查什么、写什么。
- 默认路径把 optional provider install-init 作为热路径，容易放大首次 setup 成本，也容易让用户误以为 provider graph 是普通 workflow 的前置条件。
- `--project-config` 的边界已变清晰，但默认摘要仍需要更突出它和 host/provider/runtime 的不同 ownership surface。
- 后续 workflows 需要稳定 facts，但不需要 setup 在第一步做复杂语义判断或 provider 深度初始化。

本方案保留全部现有能力，把默认路径改成“轻诊断 + 明确下一步”，把深度动作放到显式 opt-in。

## Goals

- 让裸 `spec-mcp-setup` 默认输出变短、分层、可行动。
- 默认第一步检查必需依赖、helper readiness、generated runtime manifest、project-local config、optional provider 状态，但不自动执行 provider first-generation。
- 让 `--project-config` 成为 project-local config 的唯一写入/修复路径，不安装 MCP、不配置 host、不运行 provider 初始化。
- 让 CodeGraph/Graphify 深度 setup 仍完整可用，但只能通过显式 provider/runtime mode 进入。
- 让 `agent-browser`、`ast-grep` 等 helper 检查在默认诊断中可见，并以 missing/degraded/ready 形式输出 next action。
- 保持 scripts 只产 deterministic facts，LLM/downstream workflows 判断是否需要进一步 setup。

## Non-Goals

- 不删除 CodeGraph、Graphify、agent-browser、ast-grep 或 existing helper/provider setup 能力。
- 不新增另一个公开 setup workflow。
- 不把 `.spec-first/config.local.yaml` 提升为团队共享配置。
- 不让 setup 判断项目规则、需求范围、代码语义充分性或 provider graph 结论可信度。
- 不手改 `.claude/`、`.codex/`、`.agents/skills/`、`.cursor/`、`.kiro/`、`.qoder/` generated runtime mirrors。

## Requirements

- R1. 裸 `spec-mcp-setup` 必须先做轻量诊断，输出当前 readiness 和 next actions。
- R2. 裸默认路径不得自动运行 CodeGraph/Graphify first-generation、sync/reindex、graph extract/update 或 hook install，除非用户进入显式 runtime/provider mode。
- R3. `--project-config` 只能处理 `.spec-first/config.local.example.yaml`、`.spec-first/config.local.yaml`、`.gitignore` 和 legacy project config signals。
- R4. `agent-browser`、`ast-grep`、required MCP、Node/npm/npx/jq 等工具检查必须在默认诊断中有明确状态。
- R5. optional providers 必须以 readiness/freshness/advisory next action 展示，不得被总结为 confirmed code-understanding availability。
- R6. existing explicit provider paths 必须保留：`--only codegraph`、`--only graphify`、`--only codegraph,graphify`、Graphify `--refresh`、CodeGraph repair 分支。
- R7. status block 必须区分 Required MCP/helper dependencies、Generated runtime manifest、Project local config、Optional providers、Next actions。

## Scope Boundaries

- 本计划限定 `skills/spec-mcp-setup/`、相关 setup tests、必要 docs/changelog。
- 不调整其他 `spec-*` workflow 的消费逻辑；若消费方需要读取新增/改名 facts，另开计划。
- 不改变 package manager、host alias contract 或 `spec-first init` 生成策略。
- 不把 optional provider artifacts 提交为 source truth。

## Completion Criteria

- `skills/spec-mcp-setup/SKILL.md` 明确轻量三阶段默认 flow、explicit provider/runtime flow 和 `--project-config` 边界。
- 默认 human output 的 contract tests 证明不会展示深层 provider lifecycle 细节作为第一屏主输出。
- explicit provider tests 证明 CodeGraph/Graphify 深度 setup 路径仍可触达。
- Project local config tests 证明 `.spec-first/config.local.example.yaml`、optional local override、gitignore safety、legacy signals 仍覆盖。
- changelog 记录 source 变更和实际验证命令。

## Direct Evidence Readiness

- target_repo: `.`
- evidence_sources: direct source reads, `rg`, existing plan evidence, current setup scripts/tests
- source_refs:
  - `skills/spec-mcp-setup/SKILL.md`
  - `skills/spec-mcp-setup/scripts/check-health`
  - `skills/spec-mcp-setup/scripts/verify-tools.sh`
  - `skills/spec-mcp-setup/scripts/render-status-block.cjs`
  - `skills/spec-mcp-setup/scripts/setup-plan-renderer.cjs`
  - `skills/spec-mcp-setup/helper-tools.json`
  - `skills/spec-mcp-setup/provider-tools.json`
  - `tests/unit/mcp-setup-config-template-contracts.test.js`
  - `tests/unit/dependency-readiness-baseline.test.js`
  - `tests/unit/browser-helper-tool-contracts.test.js`
  - `docs/plans/2026-07-08-001-refactor-mcp-setup-project-config-bootstrap-plan.md`
- current_revision: 未读取提交哈希；本计划基于当前工作区 source 文件。
- worktree_status: 当前命令只显示 `.claude/settings.json` 有未提交改动；该路径是 generated/runtime mirror，不作为本计划 source 输入。
- confidence: medium-high
- limitations: 未运行 runtime setup；本阶段只规划，不验证行为输出。

## Direct Evidence

- repo_scope: `spec-first` 仓库内 `spec-mcp-setup` source 与 tests。
- source_reads_completed:
  - `skills/spec-mcp-setup/SKILL.md` 显示当前 bare invocation 仍把 CodeGraph/Graphify default provider pack 作为自动 setup 路径。
  - `skills/spec-mcp-setup/scripts/check-health` 已有轻量工具与项目配置检查基础，包括 `agent-browser`、`ast-grep`、project-local config status。
  - `skills/spec-mcp-setup/scripts/verify-tools.sh` 已负责 ledger、generated runtime freshness、host pointer、project facts。
  - `tests/unit/dependency-readiness-baseline.test.js` 覆盖 provider readiness、guided plan、Graphify/CodeGraph lifecycle display。
  - `tests/unit/mcp-setup-config-template-contracts.test.js` 覆盖 project-local config bootstrap。
- source_reads_required:
  - 实施前需读取 `install-mcp.sh`、`install-helpers.sh`、PowerShell 对应脚本和 `render-status-block.cjs` 的完整相关分支，确认默认/显式 mode 分歧点。
- commands_or_tools_used:
  - `sed` 读取 source/prose。
  - `rg` 搜索 setup/provider/helper/status/test 相关引用。
- impact_on_plan:
  - 方案应优先复用 `check-health` 和现有 renderer/test，而不是新增 setup workflow。
  - provider 深度能力应保留在现有 `install-mcp.*` / `install-helpers.*` explicit mode，不复制实现。
- key_findings:
  - 当前 `check-health` 已接近轻量诊断模型，可作为默认 human output 的基础。
  - 当前 `SKILL.md` 的 bare setup flow 是复杂度主要入口，需要重写 contract。
  - project-local config 已经是独立 surface，后续只需保持在默认摘要中可见。
- limitations:
  - 外部对照实现只作为经验参考；最终文案、命名、产物和用户路径必须是 spec-first-native。

## Context & Research

### Relevant Code and Patterns

- `skills/spec-mcp-setup/scripts/check-health`：一 pass 诊断工具 readiness 与 project config，可复用为 Stage 1 的轻量输出基础。
- `skills/spec-mcp-setup/scripts/verify-tools.sh` / `.ps1`：写入 setup-owned facts，适合在 explicit verify/refresh 路径继续使用。
- `skills/spec-mcp-setup/scripts/setup-plan-renderer.cjs`：当前用于 provider guided apply preview，后续应从默认热路径下沉到 explicit provider/runtime path。
- `skills/spec-mcp-setup/helper-tools.json`：`agent-browser`、`ast-grep` 等 helper readiness 的 source。
- `skills/spec-mcp-setup/provider-tools.json`：CodeGraph/Graphify optional provider lifecycle 的 source。

### External Comparison Notes

对照实现的有效模式是三阶段和轻量检查：先 `command -v` 诊断 optional capabilities，再只修 repo-local project issues，最后输出 summary。迁入 spec-first 时只保留机制，不保留旧品牌、旧路径、旧配置真相源。

### Institutional Learnings

本计划遵循 `docs/10-prompt/结构化项目角色契约.md` 的边界：scripts 准备 deterministic facts，LLM/downstream workflows 做语义判断；provider output 是 advisory navigation，不是 source truth。

## Key Technical Decisions

- **Extend existing `spec-mcp-setup`:** 它已经拥有 setup source、scripts、tests、host/runtime/provider contract；新增 workflow 会制造第二真相源。
- **Default is diagnose-first:** bare setup 的第一屏应回答“当前缺什么、下一步做什么”，而不是立即进入 provider first-generation。
- **Explicit provider runtime mode:** CodeGraph/Graphify 深度 setup 属于高副作用 provider/runtime repair，应通过 `--runtime` 或现有 `--only`/`--refresh` 明确进入。
- **Keep helper tools visible but non-bulk-install by default:** `agent-browser`、`ast-grep` 对后续 workflows 有价值，但缺失应是 degraded/action-required facts，不应默认批量安装所有 optional capabilities。
- **Project config remains local-only:** `.spec-first/config.local.*` 是项目本地配置产物；缺失不阻塞普通 workflow，setup 不把 local preference 变成团队 policy。

## Open Questions

### Resolved During Planning

- 是否删除 provider 深度 setup？不删除；保留 explicit paths，默认不自动进入。
- 是否另建 `spec-runtime-setup`？不在本计划中新增；当前 alias contract 未落地，继续扩展 `spec-mcp-setup`。

### Deferred to Implementation

- `--runtime` 是否作为新 public flag 落地，还是只用现有 `--only` 表达：实施时根据现有 parser 与 tests 选择最小变更。
- 默认 `spec-mcp-setup` 是否刷新 setup-owned facts：实施时需要确认哪些 facts 写入属于低副作用且已有 contract；若会造成混淆，默认只检查，`--verify-only`/`--refresh-facts` 负责写入。

## High-Level Technical Design

目标用户路径：

```text
spec-mcp-setup
  -> Stage 1 Diagnose
     - target repo / parent workspace ambiguity
     - required MCP/helper readiness
     - agent-browser / ast-grep helper readiness
     - generated runtime manifest freshness
     - project-local config status
     - optional providers detected/missing/stale
  -> Stage 2 Authorized Actions
     - default: no provider first-generation
     - --project-config: local config only
     - --only graphify/codegraph: provider setup only
     - --verify-only/--refresh-facts: facts refresh only
  -> Stage 3 Summary
     - compact grouped status
     - exact next commands
```

期望默认输出形态：

```text
Stage 1: Diagnose
Project config: needs refresh
Required MCP: ready
Helper tools: agent-browser missing, ast-grep ready
Runtime manifest: stale
Optional providers: codegraph missing, graphify not configured

Next:
1. spec-mcp-setup --project-config
2. spec-first init --codex -y
3. spec-mcp-setup --only graphify
```

## Implementation Units

### U1. 重写默认 setup flow contract

**Goal:** 让 `SKILL.md` 的 bare setup contract 从“自动 default provider pack install-init”改为“轻量诊断 + next actions”。

**Requirements:** R1, R2, R5, R7

**Dependencies:** None

**Files:**
- Modify: `skills/spec-mcp-setup/SKILL.md`
- Test: `tests/unit/dependency-readiness-baseline.test.js`

**Approach:**
- 将现有 `Bare Setup Flow` 改为 `Default Diagnose Flow`。
- 保留 CodeGraph/Graphify 详细 lifecycle，但移动到 explicit provider/runtime subsection。
- 明确 default 不运行 `graphify extract/update`、`graphify hook install`、`codegraph init/sync/index -f`。

**Patterns to follow:**
- 继续使用 `Three-Stage Setup Flow`、`Workflow Modes`、`Output Shape` 结构。

**Test scenarios:**
- Contract: `SKILL.md` 包含默认 diagnose-first 语义。
- Contract: `SKILL.md` 不再把 bare invocation 描述为自动 CodeGraph/Graphify provider pack apply。
- Contract: explicit `--only graphify` / `--only codegraph` 文案仍保留。

**Verification:**
- `npx jest tests/unit/dependency-readiness-baseline.test.js --runInBand`

### U2. 调整默认 health/status 输出

**Goal:** 让默认 human output 优先展示短摘要和 next actions，而不是深层 provider lifecycle 表。

**Requirements:** R1, R4, R5, R7

**Dependencies:** U1

**Files:**
- Modify: `skills/spec-mcp-setup/scripts/check-health`
- Modify: `skills/spec-mcp-setup/scripts/check-health.ps1`
- Modify: `skills/spec-mcp-setup/scripts/render-status-block.cjs`
- Test: `tests/unit/mcp-setup.sh`
- Test: `tests/unit/dependency-readiness-baseline.test.js`
- Test: `tests/unit/browser-helper-tool-contracts.test.js`

**Approach:**
- 复用已有 helper registry 与 project config 检查。
- 默认 human output 增加或强化 `Stage 1: Diagnose` 和 `Next` 分组。
- Provider rows 默认只展示 `missing / configured / stale / ready / explicit setup available`，详细 lifecycle 仅在 explicit provider mode 或 verbose/JSON 中展示。
- `agent-browser` 和 `ast-grep` 保持 helper readiness，可输出安装建议；不默认执行安装。

**Test scenarios:**
- Happy path: 所有 required tools ready 时输出 required readiness + project config + next workflow。
- Edge case: `agent-browser` missing 时输出 helper missing 与 opt-in install action。
- Edge case: `ast-grep` missing 但 `rg` 存在时输出 degraded fallback。
- Contract: 默认输出不包含 Graphify first-generation 长 preview。
- Contract: JSON facts 仍保留 provider lifecycle machine-readable 字段。

**Verification:**
- `bash tests/unit/mcp-setup.sh`
- `npx jest tests/unit/browser-helper-tool-contracts.test.js tests/unit/dependency-readiness-baseline.test.js --runInBand`

### U3. 固化 `--project-config` local-only 路径

**Goal:** 保证 project-local config bootstrap 不与 host config、MCP install、provider setup 混在一起。

**Requirements:** R3, R7

**Dependencies:** U1

**Files:**
- Modify: `skills/spec-mcp-setup/SKILL.md`
- Modify: `skills/spec-mcp-setup/scripts/bootstrap-project-config.sh`
- Modify: `skills/spec-mcp-setup/scripts/bootstrap-project-config.ps1`
- Test: `tests/unit/mcp-setup-config-template-contracts.test.js`
- Test: `tests/unit/mcp-setup.sh`

**Approach:**
- 保持 `.spec-first/config.local.example.yaml` refresh、optional `.spec-first/config.local.yaml` create、`.spec-first/*.local.yaml` gitignore、legacy signal report。
- 明确 `--project-config` 不调用 provider install、host MCP config、runtime generation。
- 若当前 public flag 未完全 wiring，实施时补最小 CLI/skill path contract，不让用户手工复制模板。

**Test scenarios:**
- Happy path: refresh example 后与 `references/config-template.yaml` 一致。
- Happy path: create local override 后被 `.gitignore` 覆盖。
- Edge case: legacy project config signal present 时只报告 manual review，不迁移旧 key。
- Error path: symlink escape 或 parent workspace ambiguity 时拒绝写入。

**Verification:**
- `npx jest tests/unit/mcp-setup-config-template-contracts.test.js --runInBand`
- `bash tests/unit/mcp-setup.sh`

### U4. 保留 explicit provider/runtime 深度 setup

**Goal:** 把 CodeGraph/Graphify 深度 setup 从默认路径下沉，但不削弱已实现能力。

**Requirements:** R2, R5, R6

**Dependencies:** U1, U2

**Files:**
- Modify: `skills/spec-mcp-setup/scripts/install-mcp.sh`
- Modify: `skills/spec-mcp-setup/scripts/install-mcp.ps1`
- Modify: `skills/spec-mcp-setup/scripts/install-helpers.sh`
- Modify: `skills/spec-mcp-setup/scripts/install-helpers.ps1`
- Modify: `skills/spec-mcp-setup/scripts/setup-plan-renderer.cjs`
- Test: `tests/unit/dependency-readiness-baseline.test.js`

**Approach:**
- 默认 mode 调用只做 diagnose/plan/facts，不触发 selected provider apply。
- `--only codegraph`、`--only graphify`、`--only codegraph,graphify` 仍触发现有 install-init。
- Graphify `--refresh` 保持显式 incremental/code-only refresh。
- CodeGraph sync/reindex repair 只在 CodeGraph explicit mode 内运行。

**Test scenarios:**
- Contract: default mode 不调用 `codegraph init`、`graphify extract`、`graphify hook install`。
- Happy path: `--only graphify` 仍可进入 Graphify install/init/render plan。
- Happy path: `--only codegraph` 仍可进入 CodeGraph init/status/sync/reindex repair。
- Edge case: unknown provider id 仍 action-required。

**Verification:**
- `npx jest tests/unit/dependency-readiness-baseline.test.js --runInBand`

### U5. 更新 tests 与 docs/changelog

**Goal:** 让新默认路径成为受测试保护的 contract。

**Requirements:** R1-R7

**Dependencies:** U1-U4

**Files:**
- Modify: `tests/unit/mcp-setup.sh`
- Modify: `tests/unit/dependency-readiness-baseline.test.js`
- Modify: `tests/unit/browser-helper-tool-contracts.test.js`
- Modify: `tests/unit/mcp-setup-config-template-contracts.test.js`
- Modify: `CHANGELOG.md`
- Optional Modify: `README.md`
- Optional Modify: `README.zh-CN.md`

**Approach:**
- 增加 default output contract tests。
- 保留 explicit provider lifecycle tests，避免误删深度 setup 能力。
- 用户可见行为变化需记录 changelog；若 README 当前把 `spec-mcp-setup` 描述为自动 provider install-init，需要同步修正。

**Test scenarios:**
- Contract: changelog format pass。
- Contract: default setup 文案不再承诺自动 provider pack apply。
- Contract: explicit provider setup 文案与 tests 仍保留。

**Verification:**
- `npm run test:mcp-setup`
- `npm run lint:skill-entrypoints`
- `npx jest tests/unit/changelog-format.test.js --runInBand`
- `git diff --check`

## Risks & Dependencies

- **Provider capability regression:** 如果默认/explicit mode 分支拆分不清，可能误伤 Graphify/CodeGraph setup。缓解：保留 explicit provider tests 并新增 default 不执行 tests。
- **Downstream expectation drift:** 下游 workflow 可能假设 bare setup 已经生成 provider artifacts。缓解：以 readiness facts 和 next actions 作为 contract；普通 workflow 必须可用 direct evidence fallback。
- **Cross-host drift:** Bash 与 PowerShell 分支可能不一致。缓解：同步修改 `.sh` / `.ps1`，并用现有 cross-host tests 覆盖关键输出。
- **过度简化输出:** 不能隐藏 action-required 信息。缓解：默认摘要短，但 JSON/machine facts 保留细节，next actions 明确。

## Verification Plan

实施完成后至少运行：

```bash
npm run test:mcp-setup
npm run lint:skill-entrypoints
npx jest tests/unit/changelog-format.test.js --runInBand
git diff --check
```

若改动触及 provider install/render 分支，再运行：

```bash
npx jest tests/unit/dependency-readiness-baseline.test.js tests/unit/browser-helper-tool-contracts.test.js tests/unit/mcp-setup-config-template-contracts.test.js --runInBand
```

## Handoff

已按 U1-U5 完成实施。后续若继续扩大 setup 能力，应保持同一边界：默认路径只做轻量诊断与 next actions，CodeGraph/Graphify 深度 provider setup 继续留在显式 `--only` / `--refresh` 路径。
