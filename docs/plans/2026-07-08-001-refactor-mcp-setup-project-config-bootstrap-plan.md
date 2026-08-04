---
date: 2026-07-08
type: refactor
status: completed
spec_id: 2026-07-08-001-mcp-setup-project-config-bootstrap
---

# refactor: 补齐 spec-mcp-setup 的项目本地配置与 readiness bootstrap

## Summary

本方案从 spec-first 的当前职责出发，补齐 `spec-mcp-setup` 的 project-local readiness 与 local config bootstrap 表达。目标是让后续 `spec-*` workflows 能消费清晰、稳定、可验证的项目本地配置事实，而不是依赖隐含约定、旧目录惯性或用户口头记忆。

## Problem Frame

`spec-mcp-setup` 已经负责 Runtime Setup：MCP baseline、helper tools、provider readiness、host config、setup-owned facts、generated runtime freshness 等。当前 source 中也已经存在 `.spec-first/config.local.yaml` 模板和 `bootstrap-project-config.*` 脚本。

缺口不在于从零实现脚本，而在于 project-local config bootstrap 的产品契约还不够清晰：

- 用户不容易区分哪些写入发生在项目目录，哪些属于 host/user-level runtime config。
- 后续 `spec-*` workflows 不容易判断哪些 local config key 是已实现 consumer，哪些只是 future hint。
- 旧项目遗留配置需要被识别为 migration signal；其中仍被后续 skill 使用的配置能力必须被融合进 spec-first-native config contract，而不是继续依赖旧路径或旧命名。
- 最终 setup 输出应让人直接看到 project-local config 是否 ready，而不是只看到 MCP/provider readiness。

## Goals

- 将 project-local config bootstrap 明确为 `spec-mcp-setup` 的一等子能力。
- 让 `.spec-first/config.local.example.yaml` 和 `.spec-first/config.local.yaml` 成为当前项目本地配置产物。
- 明确 `.spec-first/config.local.yaml` 是 local-only override，不是 team-shared source of truth。
- 明确旧项目配置路径只作为 migration signal 报告；旧配置能力必须逐项裁决为已接入、待接入、reserved 或 retired。
- 让最终 status block 暴露 Project local config 状态，方便后续 skill 和用户判断 readiness。
- 为项目本地配置产物、gitignore 安全、legacy signal 和 parent workspace 边界补 focused tests。

## Non-Goals

- 不建立新的团队配置中心。
- 不把 local-only preference 提升为 shared workflow policy。
- 不把旧项目配置 key 机械复制到 `.spec-first/config.local.yaml`；应按 spec-first consumer、命名和边界逐项融合。
- 不让 setup 判断团队语义规则，例如 issue/PR policy、label vocabulary、scope accept/reject 或 ADR 适用性。
- 不手改 generated runtime mirrors；需要刷新时通过 `spec-first init`。

## Current Source Evidence

当前相关 source：

- `skills/spec-mcp-setup/SKILL.md`
- `skills/spec-mcp-setup/references/config-template.yaml`
- `skills/spec-mcp-setup/scripts/bootstrap-project-config.sh`
- `skills/spec-mcp-setup/scripts/bootstrap-project-config.ps1`
- `skills/spec-mcp-setup/helper-tools.json`
- `skills/spec-mcp-setup/scripts/verify-tools.sh`
- `skills/spec-mcp-setup/scripts/verify-tools.ps1`
- `skills/spec-mcp-setup/scripts/render-status-block.cjs`

当前已有的项目本地配置目标：

- `.spec-first/config.local.example.yaml`
- `.spec-first/config.local.yaml`
- `.spec-first/*.local.yaml` gitignore rule

当前应继续识别但不应成为 source truth 的 legacy signals：

- `compound-engineering.local.md`
- `.compound-engineering/config.local.yaml`

## Product Contract

### Project-local config 产物

`spec-mcp-setup` 应把以下文件视为当前 project-local config surface：

| 文件 | 类型 | 权威性 |
|---|---|---|
| `.spec-first/config.local.example.yaml` | repo-local example | 可提交，描述 local-only 可用 key |
| `.spec-first/config.local.yaml` | repo-local local override | 不提交，仅当前 checkout 使用 |
| `.gitignore` 中 `.spec-first/*.local.yaml` | repo-local safety rule | 可提交，保护 local override |

### Config Capability Migration Matrix

旧路径不迁移，但后续 skill 仍可能依赖的配置能力必须进入 spec-first 的能力矩阵。每一项都要有当前 key、consumer 和处理状态；没有 consumer 的 key 不能作为 active contract 暴露。

| 配置能力 | spec-first key / target | 下游 consumer | 当前状态 | 后续动作 |
|---|---|---|---|---|
| 本地验证 profile override | `verification_profile_path` | `src/verification/profile-loader.js`、verification/closeout 相关流程 | 已实现 | 保留为 active key，并在 template 中标注 supported consumer |
| work delegation 开关 | `work_delegate`、`work_delegate_consent`、`work_delegate_sandbox`、`work_delegate_decision`，或重命名后的 `spec_work_delegate_*` | `spec-work`、可能的 Codex delegation/worker handoff | 待确认 | 检查当前 `spec-work` 是否仍有 delegation consumer；若有则补入 `.spec-first/config.local.example.yaml`，若无则标为 retired |
| work delegation model/effort | `work_delegate_model`、`work_delegate_effort`，或重命名后的 `spec_work_delegate_model` / `spec_work_delegate_effort` | Codex delegation runtime，若仍存在 | 待确认 | 若 consumer 存在，明确 omitted 时 defer 到 host/user config；不得写死 model 默认值 |
| plan 输出格式 preference | `plan_output` | `spec-plan` | reserved / 待裁决 | spec-first 当前以 markdown canonical 为主；只有存在 focused downstream consumer tests 时才能激活 |
| brainstorm 输出格式 preference | `brainstorm_output` | `spec-brainstorm` | reserved / 待裁决 | 同上；HTML 只能作为 optional sidecar，不能替代 canonical markdown |
| ideate 输出格式 preference | `ideate_output` | `spec-ideate` | 待确认 | 检查 `spec-ideate` 是否仍有 HTML/Markdown output consumer；无测试则 reserved |
| plan scoping confirmation preference | `plan_skip_scoping_confirm` 或更明确的 `spec_plan_skip_scoping_confirm` | `spec-plan` | 待确认 | 若 `spec-plan` 仍支持 scoping confirm auto/ask，补入 template 并加 focused test |
| promote one-time opt-out | `spec_promote_*` 命名空间下的新 key | `spec-promote` | 待确认 / 需去旧命名 | 不保留旧 `ce_promote_*` 命名；若 consumer 仍需要 opt-out，迁入 spec-first 命名 |
| product pulse product/source config | `pulse_*` 或 `spec_product_pulse_*` | `spec-product-pulse` | 待确认 | 因 `spec-product-pulse` 已存在，应逐项确认 product name、lookback、event、source、metric keys 是否需要 template 支撑 |
| feedback source registry | `feedback_sources` | `spec-sweep`、可能的 feedback workflows | 待接入 | 应作为 high-priority config capability，明确 source type、target、ack/closeout action、sensitive/approved 边界 |
| sweep state path | `sweep_state_path` | `spec-sweep` | 待接入 | 若 `spec-sweep` 读该 key，应纳入 template；需明确 committed vs local path 边界 |
| sweep ack cap | `sweep_ack_cap` | `spec-sweep` | 待接入 | 保留为 safety/circuit-breaker config，需有 consumer test |
| sweep lease TTL | `sweep_lease_ttl_minutes` | `spec-sweep` | 待接入 | 保留为 single-writer lease config，需有 consumer test |
| sweep shared branch | `sweep_shared_branch` | `spec-sweep` | 待接入 | 仅在 workflow 实现 shared-docs-branch topology 时激活 |

状态定义：

- `已实现`：已有 source consumer 和测试证据，可作为 active key。
- `待确认`：需要读取目标 skill/source，确认是否有真实 consumer。
- `待接入`：已有明确目标 workflow，应补 config template、读取逻辑或测试。
- `reserved / 待裁决`：方向可能合理，但没有足够 downstream consumer tests 前不能激活。
- `retired`：确认后续 skill 不再需要，应在报告中说明替代路径或退役理由。

### 当前支持的 local config key

`skills/spec-mcp-setup/references/config-template.yaml` 应明确：

- `verification_profile_path` 是当前已实现 consumer。
- document rendering keys 默认是 reserved hints，除非后续 workflow 有 implemented consumer 和 focused tests。
- provider/output/local preference key 只有进入上方矩阵并具备 consumer 状态后，才能作为 active config contract 暴露。

### Legacy signal 策略

setup 可以报告 legacy project config signal，但不能静默迁移：

| Legacy signal | 处理 |
|---|---|
| `compound-engineering.local.md` | 报告为 legacy markdown config；只有显式动作才删除 |
| `.compound-engineering/config.local.yaml` | 报告为 legacy local config；不复制旧路径，但其中仍被需要的配置能力按矩阵融合到 `.spec-first/config.local.*` |

原因：旧 key 的路径、命名和默认值不能默认等价于 spec-first 当前 contract；但后续 skill 仍需要的能力必须以 spec-first key、consumer 和测试重新接入。

## Proposed Changes

### U1. 补强 project-local config contract

**Files:**

- `skills/spec-mcp-setup/SKILL.md`

**Change:**

在 `Project Preflight / Local Setup` 或 `Setup Posture And Project Conventions` 附近补充：

- Project-local config bootstrap 是 Runtime Setup 的一等子能力。
- 它检查、刷新、可选创建 `.spec-first/config.local.*`。
- 它确保 `.spec-first/*.local.yaml` 可被 `.gitignore` 保护。
- 它报告 legacy project config signal，但不自动迁移。
- 它不把 local config 当作 team-shared source truth。

**Rationale:**

能力已经部分存在于脚本；公开 workflow contract 需要让用户和后续 skill 明确它的产物和边界。

### U2. 分离 project-local writes、host config writes 和 helper/provider effects

**Files:**

- `skills/spec-mcp-setup/SKILL.md`

**Change:**

在 Boundaries 或 Output Shape 中明确三类 effect：

1. Project-local writes：
   - `.spec-first/config.local.example.yaml`
   - `.spec-first/config.local.yaml`
   - `.gitignore`
   - 可显式删除 repo-root `compound-engineering.local.md`
2. Host config writes：
   - Claude/Codex/Kiro/Qoder/Cursor 的 MCP/runtime config
3. Helper/provider effects：
   - 全局 CLI、browser runtime、provider-native project artifacts、hook setup、provider index

最终输出必须分组呈现，不用单一 “setup complete” 掩盖不同权威边界。

**Rationale:**

项目配置、host runtime config 和用户机器工具安装属于不同 ownership surface。混在一起会让后续 workflow 错误消费 facts。

### U3. 收紧 config template 的 consumer 注释

**Files:**

- `skills/spec-mcp-setup/references/config-template.yaml`

**Change:**

保留当前模板的精简策略，并补强注释：

- 明确 `verification_profile_path` 是当前 supported consumer。
- 明确 reserved keys 不代表可用 contract。
- 按 Config Capability Migration Matrix 补齐已实现或待接入的 active/reserved key。
- 明确 local config 不承载团队约定、tracker policy、label vocabulary、外部 PR request-surface policy 或 rejected-scope decisions。

**Rationale:**

模板是后续 skill 最容易误读的地方。注释必须防止 future hint 被当作 current contract。

### U4. 在最终 status block 中展示 Project local config

**Files:**

- `skills/spec-mcp-setup/SKILL.md`
- `skills/spec-mcp-setup/scripts/render-status-block.cjs`
- `skills/spec-mcp-setup/scripts/verify-tools.sh`
- `skills/spec-mcp-setup/scripts/verify-tools.ps1`
- 可能涉及 `normalize-setup-facts.*`

**Change:**

最终输出增加或强化 Project local config 分组：

```text
Project local config:
- example config: current | missing | refreshed | outdated
- local config: present | missing | created
- local config gitignore: ignored | missing | added
- legacy markdown config: missing | present | deleted
- legacy local config: missing | present | manual review required
```

优先复用 `bootstrap-project-config.*` 已输出字段：

- `project.example_config_status`
- `project.local_config_status`
- `project.local_config_gitignore_status`
- `legacy.compound_engineering_markdown_status`
- `legacy.compound_engineering_config_status`

如果字段命名需要保留历史兼容，human-facing label 可以去品牌化为 `legacy markdown config` / `legacy local config`。

**Rationale:**

`spec-mcp-setup` 的价值不只是安装 MCP/provider，也要告诉用户项目本地配置是否 ready，后续 skill 才能安全消费 setup facts。

### U5. 文档化 project-config-only 路径

**Files:**

- `skills/spec-mcp-setup/SKILL.md`
- `skills/spec-mcp-setup/scripts/bootstrap-project-config.sh`
- `skills/spec-mcp-setup/scripts/bootstrap-project-config.ps1`
- 相关 CLI/internal command wiring，如已有入口则只补文案

**Change:**

确认当前 public workflow 是否有只处理 project-local config 的可达路径。

若已有路径：

- 在 `SKILL.md` 写明何时调用 `bootstrap-project-config.*`。
- 写明 `--check` 只报告不写入。
- 写明 bare setup 是否会刷新 example config、创建 local config、确保 gitignore，或只在显式模式下执行。

若缺少 public 参数，考虑新增：

```text
spec-mcp-setup --project-config
```

该模式只处理 project-local config，不安装 MCP/provider/helper tools。

**Rationale:**

用户有时只想修项目本地配置，不想进入完整 runtime/provider setup。该路径能降低 setup 的副作用面。

### U6. 明确 helper readiness 不能照搬“optional tools”心智

**Files:**

- `skills/spec-mcp-setup/SKILL.md`
- `skills/spec-mcp-setup/helper-tools.json`
- 相关 status rendering/tests

**Change:**

说明 spec-first helper readiness 分层：

- baseline-blocking helper 缺失可以让 setup readiness 变为 action-required。
- optional helper/provider 缺失应显示为 degraded、optional-skipped 或 action-needed for specific workflow。
- missing optional capability 不阻塞普通 plan/work/review/debug，只影响对应 workflow。
- install actions 必须来自 setup mode 授权或 explicit opt-in。

**Rationale:**

Runtime Setup 是 readiness contract，不是简单的 PATH checker。不同 helper 的缺失影响不同 workflow，不能统一降级为“可忽略 optional”。

## Output Contract

后续实现完成后，`spec-mcp-setup` 的最终输出应至少能回答：

- 当前 host runtime dependencies 是否 ready？
- generated runtime manifest 是否 current？
- provider readiness 是 install-ready、index-ready、query-verified，还是 degraded？
- project-local config 是否 ready？
- local config 是否被 gitignore 保护？
- 是否发现 legacy project config signal？
- 用户下一步应修复 runtime、选择 child repo、继续目标 workflow，还是单独运行 `spec-rule-miner`？

## Test Plan

新增或更新 focused tests 覆盖：

- `.spec-first/config.local.example.yaml` 缺失时可刷新。
- `.spec-first/config.local.yaml` 可在明确动作下创建。
- `.spec-first/config.local.yaml` 存在时 `.gitignore` 会追加 `.spec-first/*.local.yaml`，且不覆盖 unrelated content。
- `compound-engineering.local.md` 只在显式动作下删除。
- `.compound-engineering/config.local.yaml` 只报告为 legacy signal，不自动迁移路径；其中仍需保留的能力必须经矩阵迁入 `.spec-first/config.local.example.yaml`。
- Config Capability Migration Matrix 中 `已实现` / `待接入` key 有对应 template 注释和 consumer tests；`reserved` key 不被 active parser 当成当前 contract。
- parent workspace 下默认不把 repo-local config 写到 parent，除非 explicit child repo 或 all-repos 模式允许。
- symlinked `.spec-first`、`.spec-first/workspace`、`.gitignore` 等 escape path 被阻断。
- Project local config 状态在最终 status block 中可见。

建议验证命令：

```bash
bash -n skills/spec-mcp-setup/scripts/bootstrap-project-config.sh
npx jest tests/unit/changelog-format.test.js --runInBand
npx jest tests/unit/mcp-setup-project-config-contracts.test.js --runInBand
npm run test:mcp-setup
```

如修改 `SKILL.md` 或 runtime capability catalog 输入：

```bash
npm run lint:skill-entrypoints
npm run docs:runtime-catalog
```

## Risks

- **配置中心化过度：** 把 local config bootstrap 扩展成团队治理配置中心。
- **静默迁移：** 自动复制 legacy config，导致旧 key 成为 spec-first 伪 contract。
- **边界混淆：** 把 project-local config、host config 和 helper/provider install 混成一个 setup 结论。
- **过度阻断：** 把 optional helper 缺失错误地作为普通 workflow 阻断条件。
- **Runtime mirror patching：** 为了让当前 host 立刻生效而手改 generated mirrors。

## Handoff

实施顺序：

1. 先更新 `skills/spec-mcp-setup/SKILL.md` 的 contract 和边界说明。
2. 确认 `bootstrap-project-config.*` 当前字段是否足够支撑 final output。
3. 如果 status rendering 缺 project-local config 展示，再改 renderer。
4. 补 focused tests。
5. 更新 `CHANGELOG.md`。

不要在实施阶段手改 generated runtime mirrors。若 source 修复后需要宿主 runtime 刷新，单独运行 `spec-first init` 并记录验证结果。
