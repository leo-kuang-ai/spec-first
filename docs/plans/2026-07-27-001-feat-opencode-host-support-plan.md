---
title: OpenCode Host Support - Plan
type: feat
date: 2026-07-27
topic: opencode-host-support
artifact_contract: spec-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: spec-brainstorm
execution: code
status: active
deepened: 2026-07-27
---

# OpenCode Host Support - Plan

## Goal Capsule

- **Objective:** 将 OpenCode 纳入 spec-first 的正式宿主扩展体系，使社区用户能通过 `spec-first init` 选择并安装独立、可治理、可检查、可升级、可清理的 OpenCode runtime。
- **Recommended approach:** `extend + compose`。新增薄的 `OpenCodeAdapter`，扩展现有 host registry、governance、CLI lifecycle 与 Runtime Setup；复用项目 `AGENTS.md`、skills source、原子 host-config transaction 和现有 preview 证据分级，不创建第二套工作流、权限引擎或通用 agent runtime。
- **Decision focus:** OpenCode 使用独立 `.opencode/**` commands/skills/state ownership；workflow 同时提供 `/spec-*` command 与 skill discovery；helper prompt 保持 skill-local，subagent 执行使用 OpenCode 原生 primitive；MCP/权限写入保持增量、可归属、可撤销。
- **Verification focus:** 先证明 source→projection、governance、init/doctor/update/clean、配置合并与发布包；再用真实 OpenCode 证明 command、skill、subagent、MCP 和端到端 lifecycle。两层证据不得互相替代。
- **Largest risk / boundary:** 当前机器没有 OpenCode CLI，且官方配置/loader 行为属于外部 advisory evidence；在真实旅程完成前，最高发布口径为 `generated_runtime_preview`。
- **Stop conditions:** OpenCode 配置无法在不覆盖用户内容的前提下增量维护、共享 `AGENTS.md` clean ownership 未解决、治理/schema 只能部分迁移，或真实 loader 证据与计划假设冲突时，停止相应 mutation 或支持晋升。
- **Execution profile:** Deep、跨 CLI/adapter/governance/config/docs/tests 的 source-first 变更；generated runtime 只通过实现后的 `spec-first init --opencode` 在临时项目中产生。
- **Tail ownership:** `spec-work` 负责实现、简化、review、验证和 closeout；正式支持晋升由维护者基于独立 OpenCode 证据决定。

---

## Product Contract

### Summary

为 OpenCode 增加独立、可共存的完整宿主支持，覆盖安装选择、workflow 入口、Agent Skills、原生 subagent、MCP、权限与 runtime 生命周期。
功能可以在确定性投射完成后以 opt-in preview 交付，但正式完整支持声明必须等待真实 OpenCode 用户旅程证据。

### Problem Frame

spec-first 当前只注册 Claude Code、Codex、Cursor、Kiro 与 Qoder 五个宿主，社区中的 OpenCode 用户无法通过 `spec-first init` 选择自己的宿主，也无法获得受治理的安装、检查、升级与清理体验。
手工复制其他宿主 runtime 不能提供独立 ownership、配置合并、生命周期管理或可信的支持状态，且可能让 OpenCode 与 Codex 相互覆盖或误删资产。

### Key Decisions

- **完整功能、分阶段证据。** 首次交付覆盖完整产品能力；若缺少真实 OpenCode loader 与端到端验证，发布状态保持 `generated_runtime_preview`，不把文件生成等同于宿主可用。
- **独立宿主、共享 source。** OpenCode 复用 spec-first 的 project-owned source 与治理规则，但拥有独立 runtime 和生命周期，不复用 Codex 的生成目录作为 OpenCode ownership 边界。
- **Opt-in 安装。** OpenCode 出现在交互式宿主选择中并支持显式 flag，但首版不进入 `spec-first init -y` 的默认宿主集合。
- **采用宿主 primitive。** Workflow 内部辅助工作使用 OpenCode 原生 subagent 能力，并继续受当前用户显式 dispatch 授权约束；spec-first 不重建通用 agent runtime。
- **最小配置写入。** MCP 与权限采用可归属的增量合并，保留用户已有配置，不开启全局 auto-approve，也不在清理时删除非 spec-first 内容。

### Actors

- A1. **OpenCode 社区用户：** 希望在项目中选择 OpenCode，安装并运行完整的 spec-first workflow。
- A2. **项目维护者：** 维护跨宿主 source、支持状态、验证证据与发布口径。
- A3. **OpenCode runtime：** 负责发现命令和 skills、执行 agent/subagent、应用权限并连接 MCP。

### Host Delivery Shape

```mermaid
flowchart TB
  S[Project-owned spec-first source] --> G[Governed OpenCode projection]
  G --> C[Public spec-* commands]
  G --> K[Workflow and standalone skills]
  G --> A[Native subagent integration]
  G --> M[MCP and minimal permissions]
  C --> O[OpenCode user journey]
  K --> O
  A --> O
  M --> O
  O --> E{Runtime evidence}
  E -->|Not yet confirmed| P[generated_runtime_preview]
  E -->|Loader and journeys confirmed| F[Full support claim eligible]
```

### Requirements

**Installation and lifecycle**

- R1. 交互式 `spec-first init` 必须把 OpenCode 显示为可选择的独立宿主。
- R2. CLI 必须支持显式 `--opencode` host selector，使非交互安装能够只选择 OpenCode 或将其与其他宿主组合选择。
- R3. OpenCode 首版必须保持 opt-in，不得自动进入无显式 host selector 的 `init -y` 默认安装集合。
- R4. OpenCode 与 Codex 及其他宿主必须能在同一项目中独立共存，任何单宿主安装、检查、升级或清理都不得覆盖或删除另一宿主的 runtime。
- R5. OpenCode 必须进入现有宿主生命周期，包括初始化、状态检查、升级刷新、清理、帮助信息与机器可读结果。

**Workflow and agent experience**

- R6. OpenCode 必须同时提供 `/spec-*` 原生命令入口与 Agent Skills 发现入口，并保持统一的公开 workflow 名称。
- R7. 所有受治理的公开 workflow、standalone skills 与 agent-facing internal skills 必须按其治理分类投射到 OpenCode，不得出现部分 governance record 缺少 OpenCode delivery 状态的中间态。
- R8. 依赖辅助研究、审查或验证角色的 workflow 必须使用 OpenCode 原生 subagent primitive，并在缺少用户 dispatch 授权时保持当前会话内的串行降级路径。
- R9. OpenCode 必须消费项目已有的 `AGENTS.md` 指令真相源，不得为同一项目治理复制第二份 project-owned 入口文档。

**MCP, permissions, and configuration ownership**

- R10. OpenCode MCP 必须默认支持项目级配置，并提供显式 opt-in 的用户级配置路径。
- R11. MCP 与权限写入必须保留用户已有配置，更新时只维护 spec-first 可证明归属的条目，清理时只移除这些条目。
- R12. 权限管理必须采用最小增量，只补足 spec-first workflow 所需能力，不得启用全局 auto-approve 或放宽无关工具权限。
- R13. OpenCode hooks 或 plugins 只有在现有 spec-first workflow 的确定性 gate、生命周期或证据闭环确实需要时才纳入，不以覆盖全部宿主扩展能力为目标。

**Evidence and release claims**

- R14. 完成确定性 runtime 投射、治理一致性、生命周期和发布包验证后，即使真实 OpenCode loader 不可用，也可以 opt-in `generated_runtime_preview` 状态交付。
- R15. 正式完整支持声明必须有真实 OpenCode 证据覆盖命令发现与调用、skill 发现与调用、至少一条 subagent-dependent workflow、MCP 连接，以及安装到清理的端到端用户旅程。
- R16. `doctor` 和用户可见文档必须区分 source/projection evidence、loader evidence 与 field outcome；缺失证据时必须给出明确 degraded 状态和修复或补证方向。
- R17. OpenCode runtime 必须保持 generated-runtime 身份；修复应修改 source、governance 或生成逻辑，再通过 `spec-first init` 重建，不得把生成目录提升为 source-of-truth。
- R18. OpenCode 支持必须同步所有受影响的宿主 registry、governance、runtime catalog、CLI 文案、README、contracts、tests、release/package 校验与 Changelog，避免形成“CLI 可选但下游消费者未知”的部分支持状态。

### Key Flows

- F1. **交互式安装**
  - **Trigger:** A1 在交互式终端运行 `spec-first init`。
  - **Actors:** A1, A3
  - **Steps:** 安装器展示 OpenCode；用户选择 OpenCode；系统预览并写入受治理 runtime；输出安装状态与证据等级。
  - **Outcome:** OpenCode 获得独立、可检查和可清理的完整 runtime。
  - **Covered by:** R1, R3, R5, R14, R16
- F2. **显式或多宿主安装**
  - **Trigger:** A1 使用 `--opencode`，并可同时选择其他宿主。
  - **Actors:** A1
  - **Steps:** CLI 解析选择；分别为每个宿主生成归属明确的 runtime；汇总每个宿主结果。
  - **Outcome:** OpenCode 与 Codex 等宿主共存且互不覆盖。
  - **Covered by:** R2, R4, R5
- F3. **运行 workflow**
  - **Trigger:** A1 在 OpenCode 中调用 `/spec-*` 或让 agent 加载对应 skill。
  - **Actors:** A1, A3
  - **Steps:** OpenCode 发现入口；workflow 加载 source-projected 内容；需要辅助角色时先检查用户 dispatch 授权，再调用原生 subagent 或串行降级。
  - **Outcome:** 用户能执行完整的 spec-first workflow，且授权和降级语义不因宿主变化而失真。
  - **Covered by:** R6, R7, R8, R9
- F4. **配置与清理**
  - **Trigger:** A1 安装、刷新或清理 OpenCode 的 MCP 与权限配置。
  - **Actors:** A1, A3
  - **Steps:** 系统识别已有用户配置；增量维护 spec-first 条目；检查配置状态；清理时删除可证明归属的内容。
  - **Outcome:** spec-first 能工作，用户自有配置保持不变。
  - **Covered by:** R10, R11, R12, R13
- F5. **支持状态晋升**
  - **Trigger:** A2 获得新的真实 OpenCode loader 或用户旅程证据。
  - **Actors:** A2, A3
  - **Steps:** 对照支持声明要求验证关键旅程；记录 evidence scope 与限制；更新支持状态和用户文档。
  - **Outcome:** 支持声明只晋升到证据直接覆盖的等级。
  - **Covered by:** R14, R15, R16

### Acceptance Examples

- AE1. **Covers R1, R3, R5.** Given 用户运行交互式 `spec-first init`, when 选择 OpenCode 且未选择其他宿主, then 只生成 OpenCode 管理的 runtime，并报告其支持状态。
- AE2. **Covers R2, R4.** Given 项目已安装 Codex, when 用户显式安装 OpenCode, then 两个宿主均可用；随后清理 OpenCode 不改变 Codex runtime，也不删除仍被 Codex 使用的共享 `AGENTS.md` 管理块。
- AE3. **Covers R2, R3.** Given 用户执行非交互安装且显式选择 OpenCode, when CLI 应用选择, then OpenCode 被安装；未显式选择时，首版默认集合不自动加入 OpenCode。
- AE4. **Covers R6, R7, R8.** Given OpenCode 已发现 spec-first runtime, when 用户分别通过 `/spec-*` 和 skill 入口启动 workflow, then 两种入口都加载同一 source-owned 语义；需要 subagent 但未获授权时转为串行执行并披露降级。
- AE5. **Covers R10, R11, R12.** Given 项目或用户级 OpenCode 配置已含非 spec-first MCP 与权限规则, when 执行安装、刷新和清理, then 原有配置保持不变，且不会启用全局 auto-approve。
- AE6. **Covers R14, R16.** Given 确定性投射测试通过但当前环境没有 OpenCode CLI, when 用户安装或运行 `doctor`, then 系统报告 `generated_runtime_preview` 与 loader evidence 缺口，不声称正式完整支持。
- AE7. **Covers R15.** Given 真实 OpenCode 环境完成命令、skill、subagent、MCP 和 lifecycle 用户旅程, when 维护者评估发布状态, then 只有被证据直接覆盖的支持声明可以晋升。
- AE8. **Covers R17, R18.** Given OpenCode runtime 出现 drift, when 维护者修复问题, then 修改 source 或生成逻辑并重新生成，同时所有 registry、governance、docs 与 tests 保持一致。

### Success Criteria

- 社区用户能够从交互式安装器选择 OpenCode，也能通过显式 host selector 完成可重复的非交互安装。
- OpenCode 安装产物覆盖全部受治理的公开 workflow 与 skills，并提供原生命令、subagent、MCP 和最小权限体验。
- OpenCode 与现有宿主共存，`doctor`、升级与 `clean` 均遵守 ownership，不产生跨宿主覆盖或用户配置丢失。
- 所有确定性 source、governance、projection、package 与 lifecycle 检查通过后，首版可以带明确限制发布为 preview。
- 只有真实 OpenCode loader 与端到端用户旅程通过后，README、runtime catalog 与发布文案才可声明完整支持。

### Scope Boundaries

- 首版不把 OpenCode 加入无显式 host selector 的 `init -y` 默认集合。
- 不把 Codex 的 `.agents/skills/**` runtime 当作 OpenCode 的共享 ownership 边界。
- 不复制或替代 OpenCode 的通用 agent、权限、插件和工具运行时。
- 不为 helper personas 生成额外的 OpenCode custom agent 用户入口；helper prompt 继续由 owning skill-local references 持有。
- 不为与现有 spec-first workflow 无关的 OpenCode 插件能力追求表面 feature parity。
- 不把官方文档、文件投射或 self-check 单独当作真实 loader 和 field outcome 证据。
- 不把 OpenCode 纳入 user-level language sync；项目级语言与治理继续通过 root `AGENTS.md` 生效。
- 不改写历史计划、审查或验证文档中的“五宿主”快照；只更新当前 source、活跃 contracts、tests 和用户文档。

#### Deferred to Follow-Up Work

- `opencode.jsonc` 的注释保真 mutation。首版 canonical writer 只维护严格 JSON 的 `opencode.json`；检测到仅有 JSONC 或无法无损解析的高优先级配置时 fail closed，并给出 unblock direction。
- OpenCode hooks/plugins。只有真实运行证明某个确定性 exit gate 无法由现有 CLI、skill contract 或 MCP setup 承载时，才单独规划。
- 把重复的 supported-host 常量重构为单一跨模块 schema。当前变更只在既有 owner 中原子扩展，避免借新增宿主进行无关架构重写。

### Dependencies / Assumptions

- 社区需求目前是定性信号；尚无 Issue 链接、用户规模或失败日志，不据此推断采用量或优先级强度。
- OpenCode 官方文档在 2026-07-27 显示其支持 `AGENTS.md`、Agent Skills、project commands、primary agents/subagents、MCP、permissions 与 plugins；这些是 external advisory evidence，implementation 与 verification 必须继续回源。
- 当前机器没有可调用的 OpenCode CLI，因此无法在本次 planning 中验证 loader、命令、skill、subagent、MCP 或完整用户旅程。
- OpenCode 官方配置格式、发现路径、permission 语义或 subagent 行为变化时，相关实现选择与支持状态必须重新评估。

### Outstanding Questions

**Resolve Before Implementation:** 无。

**Deferred to Implementation / Verification:**

- 实现开始时重新读取 OpenCode 官方 command、skill、MCP 与 permission 文档，确认最小 frontmatter、配置容器与 namespaced permission pattern；若当前文档与本计划语义冲突，先更新计划或记录有证据的 deviation。
- 真实 OpenCode 是否提供非交互 loader/配置检查命令；若没有，使用可重复的交互用户旅程并保留版本、输入、输出与 limitations。
- `opencode.jsonc` 与 `opencode.json` 的实际优先级只用于 collision 诊断和后续 JSONC 支持，不扩大首版 writer scope。

### Sources / Research

- `src/cli/adapters/index.js`、`src/cli/adapters/base.js`、`src/cli/adapters/platform-registry.js` — 当前 adapter、projection 与 runtime ownership 扩展点；observed at repository commit `2c89c5a18eaf85998dbf80fd98bf2d27d7f263fc`。
- `src/cli/adapters/qoder.js`、`src/cli/adapters/cursor.js` — command+skill host 与 generated-preview host 的相邻实现；只复用当前仍成立的 pattern。
- `src/cli/commands/init-args.js`、`src/cli/commands/init.js`、`src/cli/commands/init-output.js`、`src/cli/commands/doctor.js`、`src/cli/commands/clean.js`、`src/cli/commands/update.js` — host selector 与 lifecycle consumers。
- `src/cli/plugin-manifest.js`、`src/cli/plugin-governance.js`、`src/cli/contracts/dual-host-governance/skills-governance.json` — source/governance 到 runtime asset set 的投射链。
- `skills/spec-runtime-setup/setup-registry.json`、`skills/spec-runtime-setup/setup-registry.schema.json`、`skills/spec-runtime-setup/scripts/lib/host-authority.cjs`、`skills/spec-runtime-setup/scripts/lib/host-config.cjs` — MCP/config mutation 的 canonical registry、authority 与 transaction owner。
- `docs/solutions/workflow-issues/runtime-setup-host-authority-and-script-owned-facts-2026-07-04.md` — 新宿主必须使用显式 `MCP_SETUP_HOST`，setup facts/config mutation 必须 script-owned。
- `docs/solutions/workflow-issues/host-entrypoint-mapping-source-boundary-2026-04-29.md`、`docs/solutions/conventions/skill-publication-command-surface-alignment-2026-06-23.md`、`docs/solutions/workflow-issues/modify-source-not-artifacts-2026-04-13.md` — 入口映射集中、governance/command/runtime 同步与 source-first 约束。
- `docs/plans/2026-07-04-001-feat-qoder-host-support-plan.md`、`docs/plans/2026-07-04-002-feat-cursor-host-support-plan.md` — 历史宿主扩展计划；作为模式参考，不覆盖当前 source。
- [OpenCode Rules](https://opencode.ai/docs/rules/)、[Agent Skills](https://opencode.ai/docs/skills/)、[Commands](https://opencode.ai/docs/commands/)、[Agents](https://opencode.ai/docs/agents/)、[MCP Servers](https://opencode.ai/docs/mcp-servers/)、[Permissions](https://opencode.ai/docs/permissions/)、[Plugins](https://opencode.ai/docs/plugins/) — 官方 `anomalyco/opencode` `dev` 文档，observed 2026-07-27；重要行为仍需真实 runtime 证明。

---

## Planning Contract

### Product Contract Preservation

Product Contract unchanged except AE2 clarifies the already-required shared `AGENTS.md` coexistence outcome, and Scope Boundaries make previously implied non-goals explicit；R1-R18、A1-A3、F1-F5 与其他 Acceptance Examples 保持原意。

### Architecture Posture

- **Posture:** `extend + compose / thin-glue`。
- **Extend:** `PlatformAdapter`、adapter registry、skills governance、init/doctor/update/clean、platform ownership registry 和 Runtime Setup registry 已拥有相应边界，OpenCode 以新 host record 与 host-specific transform 扩展这些 owner。
- **Compose:** OpenCode adapter 只负责 path/frontmatter/runtime-identity translation；plugin sync 继续拥有 asset projection，governance 继续拥有 delivery truth，Runtime Setup 继续拥有 host authority、配置事务和 facts。
- **Thin-glue boundary:** OpenCode-specific glue 只拥有 host representation translation、preview diagnostics 和配置 shape mapping；不复制 workflow 语义、权限策略引擎、状态模型或 provider logic。
- **Rejected new boundary:** 不创建 `OpenCodeRuntimeManager`、独立 installer 或第二份 command/skill catalog；现有 owner 能在不混合职责的前提下吸收变化。
- **Source of truth:** `skills/`、`templates/`、`src/cli/`、`skills/spec-runtime-setup/`、contracts 与 docs；`.opencode/**` 和目标项目 `opencode.json` 中的 managed slice 都是可重建 runtime/config output，不反向成为 source。

### Key Technical Decisions

- KTD1. **OpenCode runtime 独立投射。** Commands 使用 `.opencode/commands/spec-*.md`，workflow/standalone/internal skills 使用 `.opencode/skills/<skill>/`，state 使用 `.opencode/spec-first/state.json`；不共享 `.agents/skills`，避免 Codex/OpenCode 安装和 clean ownership 耦合。
- KTD2. **双入口共享同一 source。** `workflow_command` 在 OpenCode governance 中标记为 `command`，现有 filtered asset semantics 同时投射 command 与 backing workflow skill；standalone 为 `skill`，agent-facing internal 为 `internal`。两种入口不得维护不同 workflow body。
- KTD3. **原生 subagent，不生成 custom helper agents。** OpenCode adapter 首版 `supportsAgents=false`；该 adapter 字段只表示“不投射 bundled/custom agent profiles”，不得被解释为 OpenCode runtime 不支持 subagent，也不得作为 dispatch readiness fact。需要 helper 的 workflow 读取 skill-local prompt asset，并在用户授权后使用 OpenCode native task/subagent primitive；无授权、primitive 不可用或 loader 未确认时保留 inline fallback 并报告原因。此选择不影响命令/skill 完整度，但正式支持证据必须覆盖一条 subagent-dependent workflow。
- KTD4. **`AGENTS.md` 是共享 project instruction。** OpenCode 不生成 pointer/rule 文件。`clean --opencode` 只有在其他消费同一路径的 adapter 均被 confirmed absent 时，才移除共享 managed instruction block；若其他 host state 缺失、损坏、版本不可读或 runtime/state 证据矛盾，保留 managed block 并返回 action-required reason code。单宿主 clean 不得破坏其他宿主入口。
- KTD5. **Runtime clean 与配置 uninstall 分权。** `spec-first clean --opencode` 只删除 managed OpenCode runtime/state；`spec-runtime-setup` 的 uninstall/cleanup path 删除 `opencode.json` 中仍与 ledger/expected value 匹配的 spec-first MCP/permission entries。两个生命周期都保留未知用户内容。
- KTD6. **MCP 配置 project-first，user-scope 显式授权。** OpenCode project target 为 `opencode.json`，user target 为 `$HOME/.config/opencode/opencode.json`，后者必须通过 `--user-scope`。`MCP_SETUP_HOST=opencode` 是 mutation authority；runtime dirs、PATH 和旧 facts 只能是 advisory candidates。
- KTD7. **配置 shape 由 registry 声明，不按 host 名字散落分支。** 扩展 host-config contract，使 JSON container、server representation 与可归属 permission entries 由 `setup-registry` 描述；现有 hosts 保持默认 `mcpServers`/string-command 行为，OpenCode 使用官方 `mcp` representation。
- KTD8. **权限最小化。** 只维护官方 schema 能表达且以 `spec-*` 命名空间归属的 skill permission；已有 conflicting deny/allow 不覆盖，task/subagent、bash、edit、web 等仍遵循用户配置或 OpenCode `ask` 流程。禁止写 wildcard/global allow；无法证明安全归属时宁可 action-required，也不静默放宽。
- KTD9. **严格 JSON writer，JSONC fail closed。** 首版原子事务只修改 `opencode.json`。发现 `opencode.jsonc`、无法解析的 higher-precedence config 或 comment-bearing content 时只检查并返回明确 reason code，不做 lossy rewrite。
- KTD10. **治理与 registry 原子升级。** `skills-governance` 从 schemaVersion 1 升级，`setup-registry.v8` 升级到下一版本；schema、data、parser constants、generated projections、catalog 和 tests 必须在同一实现 slice 中同步，任何 partial key set 都是 blocking failure。
- KTD11. **复用现有 evidence vocabulary。** OpenCode 初始状态为 `generated_runtime_preview`；`doctor` 提供 `opencode_generated_runtime_loader_unverified` 等 degraded/non-drift reason code。正式支持晋升沿用 projection→loader→workflow/field 的证据层级，不创建第二套状态机。
- KTD12. **Hooks/plugins 不进入首版。** 没有证据证明它们是 command/skill/subagent/MCP 生命周期或确定性 exit gate 的必要条件；先用现有 CLI、skill contract 与 Runtime Setup 交付高价值路径。

### High-Level Technical Design

#### Component topology

```mermaid
flowchart TB
  Source[skills templates CLI contracts] --> Governance[skills governance schema and data]
  Source --> Manifest[plugin manifest and filtered asset set]
  Governance --> Manifest
  Manifest --> Adapter[OpenCodeAdapter]
  Registry[platform ownership registry] --> Adapter
  Adapter --> Commands[.opencode commands]
  Adapter --> Skills[.opencode skills]
  Adapter --> State[.opencode spec-first state]
  Root[Root AGENTS.md] --> Session[OpenCode session]
  Setup[spec-runtime-setup] --> Authority[MCP_SETUP_HOST opencode]
  SetupRegistry[setup registry next version] --> ConfigTxn[host config transaction]
  Authority --> ConfigTxn
  ConfigTxn --> ProjectConfig[project opencode.json]
  ConfigTxn --> UserConfig[user opencode.json opt-in]
  Doctor[doctor] --> Commands
  Doctor --> Skills
  Doctor --> State
  Clean[clean opencode] --> Commands
  Clean --> Skills
  Clean --> State
```

#### Lifecycle and ownership sequence

```mermaid
sequenceDiagram
  actor User
  participant Init as spec-first init
  participant Adapter as OpenCodeAdapter
  participant Runtime as .opencode runtime
  participant Setup as spec-runtime-setup
  participant Config as opencode.json managed slice
  participant Doctor as spec-first doctor
  participant RuntimeClean as spec-first clean
  participant SetupUninstall as setup uninstall

  User->>Init: select OpenCode or pass --opencode
  Init->>Adapter: plan governed projection
  Adapter->>Runtime: commands skills state
  Init-->>User: generated_runtime_preview when loader unverified
  User->>Setup: configure required runtime
  Setup->>Config: explicit-authority incremental merge
  User->>Doctor: inspect source projection and evidence gap
  Doctor-->>User: ready or degraded reason codes
  User->>RuntimeClean: clean OpenCode runtime
  RuntimeClean->>Runtime: remove only managed OpenCode assets
  User->>SetupUninstall: uninstall OpenCode setup entries
  SetupUninstall->>Config: remove only matching spec-first entries
```

#### Support-state promotion

```mermaid
stateDiagram-v2
  [*] --> NotDelivered
  NotDelivered --> GeneratedRuntimePreview: deterministic projection lifecycle package pass
  GeneratedRuntimePreview --> LoaderConfirmedPreview: command and skill discovery invoked
  LoaderConfirmedPreview --> FullSupportEligible: subagent workflow MCP and end-to-end journey pass
  GeneratedRuntimePreview --> GeneratedRuntimePreview: docs or host changes require recheck
  LoaderConfirmedPreview --> GeneratedRuntimePreview: loader regression or stale evidence
  FullSupportEligible --> GeneratedRuntimePreview: invalidation evidence
```

#### Host-selection matrix

| Invocation mode | OpenCode selection | Expected result |
|---|---|---|
| Interactive `init` | User checks OpenCode | OpenCode is included in preview and apply plan |
| `init -y` without host flags | Not selected | Existing default hosts remain unchanged |
| `init --opencode -y` | Explicit | Only OpenCode is initialized unless other flags are present |
| `init --codex --opencode -y` | Explicit multi-host | Independent runtime/state are generated; shared `AGENTS.md` remains coherent |
| `update` with OpenCode state present | Auto-detected from managed state | Refresh args include `--opencode` |
| `doctor` without flags | Auto-detected from managed state only | User-owned `.opencode/**` or `opencode.json` alone do not create a false install |

### Interface Contracts

| Interface / mode | Consumers | Canonical artifact | Contract summary | Compatibility / rollback | Verification owner |
|---|---|---|---|---|---|
| CLI host selector / evolution | Users, init, doctor, clean, update, help/smoke | `src/cli/commands/init-args.js` plus adapter registry | Additive `--opencode`; opt-in default; explicit flags compose | Existing flags/defaults unchanged; remove selector and adapter to roll back preview | CLI parser/unit/smoke/integration tests |
| Skills governance / evolution | plugin manifest, filtered asset set, catalog, all governed skills | `src/cli/contracts/dual-host-governance/skills-governance.schema.json` and `.json` | Every record requires `host_delivery.opencode`; workflow=`command`, standalone=`skill`, eligible internal=`internal` | Versioned atomic migration; old partial documents rejected | schema validation and `tests/unit/plugin-modules.test.js` |
| Runtime ownership / evolution | path rewrite, gitignore/context policy, doctor/clean | `src/cli/adapters/platform-registry.js` | Declares generated `.opencode` surfaces and mixed-ownership `opencode.json`; no blanket root ownership | Additive host record; rollback removes only its declared surfaces | registry pattern and ownership tests |
| Runtime Setup registry / evolution | setup parser, facts, config resolver, generated skills | `skills/spec-runtime-setup/setup-registry.json` and schema | Canonical host `opencode`, project/user targets, JSON container/server shape, optional namespaced permission entries | Bump registry version; previous hosts retain equivalent effective config | registry/schema/node contract tests |
| OpenCode project config / greenfield managed slice | OpenCode runtime and Runtime Setup | Target project `opencode.json`; source owner remains setup registry/scripts | Incremental `mcp` server entry plus only safely namespaced permission entries; strict JSON; conflicts fail closed | Preserve unknown keys; uninstall removes only current managed values; JSONC is detected but not rewritten | `host-config.cjs` transaction tests plus real OpenCode MCP journey |
| Shared project instructions / evolution | Codex, Cursor, Kiro, Qoder, OpenCode | Root `AGENTS.md` managed block; producer in CLI instruction bootstrap | One shared project instruction, multiple host states; clean uses remaining-host ownership | Last-consumer removal only; single-host clean preserves shared block | multi-host clean integration tests |

### Evidence & Limitations

- **Direct source:** Current extension points and hard-coded consumers were re-read at commit `2c89c5a18eaf85998dbf80fd98bf2d27d7f263fc`; CodeGraph was used as advisory orientation, and load-bearing conclusions were confirmed by direct source reads.
- **Historical learnings:** Runtime Setup host-authority, source/runtime, entrypoint and skill-publication learnings shape KTD2、KTD5、KTD6、KTD10 and the verification ladder; they remain advisory where current source differs.
- **External evidence:** OpenCode official docs observed 2026-07-27 shape paths and host capabilities, but do not prove spec-first output loads. Implementation must re-open them before writing host-specific transforms.
- **Runtime limitation:** `command -v opencode` is unavailable on this machine, so loader/subagent/MCP/field evidence is not available in planning.
- **Dispatch limitation:** No subagent authorization was provided; repository research, learnings synthesis, agent-native analysis and flow analysis were applied inline with `dispatch_authorization_missing`.
- **Dirty worktree:** 本计划的 write set 仅包含 `CHANGELOG.md` 与本计划文件；当前工作树另有与本计划无关的 prompt/audit 文档变更，实施与验证必须排除这些并发改动，不把任何未提交内容当作 OpenCode 证据。

### Sequencing

1. U1 establishes the adapter transform/runtime ownership shape without claiming governed projection completeness.
2. U3 adds the matching governance/schema/catalog and completes the first atomic foundation wave with U1；U1/U3 之间不得发布、提交 partial host support 或运行 packaged init claim。
3. U2 adds public CLI lifecycle and fixes shared `AGENTS.md` clean ownership only after U1+U3 can produce a valid governed asset set.
4. U4 extends Runtime Setup configuration, provider integration and permission ownership using the registered host.
5. U5 aligns source/runtime policy, user docs, package and release claims.
6. U6 proves packaged preview behavior, then records real OpenCode promotion evidence when the runtime is available.

---

## Implementation Units

### U1. OpenCode Adapter、Projection 与 Runtime Ownership

- **Goal:** 建立 OpenCode 独立 runtime 的唯一 adapter/source owner，投射 command+skill 双入口、state 和 preview diagnostics，不生成 custom helper agents。
- **Requirements:** R4, R6-R9, R14, R16-R18; F2-F3; AE2, AE4, AE6, AE8
- **Dependencies:** None
- **Files:**
  - Create: `src/cli/adapters/opencode.js`
  - Modify: `src/cli/adapters/index.js`
  - Modify: `src/cli/adapters/platform-registry.js`
  - Modify: `src/cli/adapters/host-comparative-config-paths.js`
  - Modify: `tests/unit/host-runtime-projection-contracts.test.js`
  - Modify: `tests/unit/platform-registry-patterns.test.js`
  - Modify: `tests/unit/command-resource-path-rewrite.test.js`
  - Create: `tests/unit/opencode-runtime-lifecycle.test.js`
- **Approach:**
  - 实现 `OpenCodeAdapter`：`hasCommands=true`、`supportsAgents=false`，commands=`.opencode/commands`、skills/workflows=`.opencode/skills`、state=`.opencode/spec-first/state.json`、instruction=`AGENTS.md`。`supportsAgents=false` 只抑制 bundled agent profile 投射；dispatch capability 由 workflow authorization、OpenCode primitive readiness 与真实 loader evidence 分别判断。
  - Command filename 使用统一 `spec-<command>.md`；command body 与 backing workflow skill 都从同一 governed source 生成，frontmatter 只保留 OpenCode 官方 loader 所需的最小字段。
  - Skill transform 复用 shared path rewrite、source-skill runtime path rewrite、runtime-setup host pin；OpenCode-specific code 不复制 workflow prose。
  - Adapter `inspectRuntimeFiles()` 校验 command/skill frontmatter、非 OpenCode runtime path residue、unexpected agent assets，并始终在缺少真实 loader 证据时输出 degraded/non-drift preview warning。
  - Platform registry 精确声明 generated command/skill/state surfaces 与 mixed-ownership `opencode.json`；未知 `.opencode/**` 保持 host/user-owned。
- **Patterns to follow:** `src/cli/adapters/qoder.js` 的 command+skill transform、`src/cli/adapters/cursor.js` 的 preview warning、`src/cli/adapters/platform-registry.js` 的 ownership declaration。
- **Test scenarios:**
  1. Covers AE4. 给定由治理层准备好的 workflow command 与 backing skill asset input，adapter 同时渲染 `/spec-*` command file 和同名 workflow skill，两个 body 都来自同一 source，且公开名称保持 `spec-*`；真实 governance selection 在 U3 验证。
  2. 给定已分类的 standalone/internal asset input，OpenCode 只投射输入中允许的 skill package 到 `.opencode/skills`，adapter 不因 `spec-` 前缀自行猜测 entry surface。
  3. 给定 source package 中的 skill-local helper prompt，projection 保留 references/scripts 且排除 evals/maintainer-only files；`.opencode/agents` 不产生 custom agent profiles，且 `supportsAgents=false` 不会被输出为“OpenCode 不支持 subagent”的 capability 结论。
  4. 给定 `spec-runtime-setup`，projected command 与 skill 都携带 `MCP_SETUP_HOST=opencode`、entrypoint authority 和 script-owned config/facts 约束。
  5. 给定其他宿主 runtime path 和 host-comparative config mapping，OpenCode transform 重写前者但保留后者，不留下 `.claude/.codex/.cursor/.kiro/.qoder` 误引用。
  6. Covers AE6. 给定完整 generated runtime 但无 loader evidence，doctor-facing adapter check 返回 `opencode_generated_runtime_loader_unverified`、`degradedByDesign=true`、`drift=false`。
  7. 给定 user-owned `.opencode/plugins`、`.opencode/agents/custom.md` 或其他未知文件，inspection/removal plan 不把它们纳入 managed assets。
- **Verification:** Adapter transform、projection plan、frontmatter/path validation 和 ownership patterns 能由 unit tests 确定性证明；governed filtered asset set 与 supported-host completeness 由依赖 U1 的 U3 关闭，不从任一 source test 推断真实 OpenCode loader 可用。

### U2. Host Selection、Lifecycle 与 Shared Instruction Ownership

- **Goal:** 将 `--opencode` 接入交互/非交互 init、doctor、update、clean、workspace 与帮助输出，并确保单宿主 clean 不破坏其他 AGENTS-based hosts。
- **Requirements:** R1-R5, R9, R14, R16; F1-F2; AE1-AE3, AE6
- **Dependencies:** U1, U3
- **Files:**
  - Modify: `src/cli/commands/init-args.js`
  - Modify: `src/cli/commands/init-input.js`
  - Modify: `src/cli/commands/init.js`
  - Modify: `src/cli/commands/init-output.js`
  - Modify: `src/cli/commands/init-workspace.js`
  - Modify: `src/cli/commands/doctor.js`
  - Modify: `src/cli/commands/clean.js`
  - Modify: `src/cli/commands/update.js`
  - Modify: `tests/unit/init-module-split.test.js`
  - Modify: `tests/unit/init-preview.test.js`
  - Modify: `tests/unit/doctor-platform-cli.test.js`
  - Modify: `tests/unit/doctor-runtime-assets.test.js`
  - Modify: `tests/unit/managed-removal-ownership.test.js`
  - Modify: `tests/unit/update-command-spawn.test.js`
  - Rename: `tests/integration/init-five-host-lifecycle.integration.test.js` → `tests/integration/init-supported-host-lifecycle.integration.test.js`
- **Approach:**
  - 在 `INIT_PLATFORM_CHOICES` 增加 OpenCode，`defaultForYes=false`；所有 host labels/help/next-step 文案统一包含显式 `--opencode`，默认集合保持 Claude+Codex。
  - `doctor --opencode` 与无 flag auto-detection 只依据 managed state/adapter-owned assets，不因 root `opencode.json` 或任意 `.opencode` user file 误判已安装。
  - `update` 继续从 adapter state 动态构建 refresh flags；OpenCode state 存在时加入 `--opencode`。
  - `clean --opencode` 使用 state ledger 与 adapter removal plan，只删除 managed commands/skills/state。配置 entry 由 Runtime Setup uninstall 持有。
  - 清理共享 instruction 前检查所有消费同一 `instructionFile` 的 adapter；只有其他 consumer 被 confirmed absent 时才移除 `AGENTS.md` managed block。缺失/损坏/旧版本 state、state 与 runtime 矛盾或读取失败都按 ownership uncertain 处理：保留 block、不中断其他 runtime 清理，并输出 action-required reason code。
  - `hasAnyManagedState`、preview aggregation 和 workspace skip roots 应使用 adapter registry 或显式加入 OpenCode，避免 banner、child discovery 和 summary 漏宿主。
- **Execution note:** 先补 characterization tests 锁定现有五宿主默认和 clean 行为，再加入 OpenCode，防止新增 host 顺带改变旧 host lifecycle。
- **Patterns to follow:** `INIT_PLATFORM_CHOICES.defaultForYes`、`getSupportedPlatforms()` update detection、`planManagedAssetRemoval()`、现有 multi-host lifecycle integration。
- **Test scenarios:**
  1. Covers AE1. 交互选择只有 OpenCode 时，preview/apply 只包含 OpenCode runtime，输出 host label 与 preview support status。
  2. Covers AE3. `init -y` 无 host flag 时不安装 OpenCode；`init --opencode -y` 安装 OpenCode；未知或重复 flag 保持现有 parser semantics。
  3. Covers AE2. 同项目安装 Codex+OpenCode 后清理 OpenCode，Codex state/skills 与共享 `AGENTS.md` managed block byte-stable；最后清理 Codex 才移除共享 block。
  4. 同项目安装 OpenCode+Qoder 后清理 Qoder 或 OpenCode，另一宿主 command/skill/state 不变，重新 init 仍幂等。
  5. `doctor --opencode --json` 输出 platform、asset checks、preview reason code；无 flag 时只有 OpenCode state 才触发 auto-detection。
  6. 只有 `opencode.json`、`.opencode/plugins` 或 user-owned `.opencode/agents/custom.md` 时，doctor 不把项目识别为 spec-first OpenCode install。
  7. OpenCode state 存在时 `update` refresh args 保留全部已安装宿主并包含 `--opencode`；无 OpenCode state 时不添加。
  8. Workspace parent/child discovery 不递归进入 `.opencode` runtime，summary index 能记录 `platform=opencode` 且不接受未知 host id。
  9. CLI help、非 TTY guidance、dry-run 与 next steps 都显示 OpenCode opt-in，不暗示已取得 loader evidence。
  10. 其他 AGENTS-based host 的 state 缺失、损坏、版本不兼容或与 runtime 证据矛盾时，`clean --opencode` 保留共享 managed block 并报告 ownership-uncertain/action-required；OpenCode 自有 runtime 仍按可证明 ownership 清理。
- **Verification:** CLI unit tests和 lifecycle integration 证明 opt-in、coexistence、idempotence、shared instruction ownership 与 machine-readable output；真实 host invocation 留给 U6。

### U3. Governance、Schema 与 Runtime Catalog 原子扩展

- **Goal:** 把 OpenCode 作为第六个 governed host 原子加入 manifest/filter/schema/data/catalog，确保所有 skill records 和下游 consumers 同步迁移。
- **Requirements:** R6-R7, R14, R16, R18; F3, F5; AE4, AE6-AE8
- **Dependencies:** U1
- **Files:**
  - Modify: `src/cli/plugin-manifest.js`
  - Modify: `src/cli/plugin-governance.js`
  - Modify: `src/cli/contracts/dual-host-governance/skills-governance.schema.json`
  - Modify: `src/cli/contracts/dual-host-governance/skills-governance.json`
  - Modify: `scripts/generate-runtime-capability-catalog.js`
  - Modify: `scripts/check-release-continuity.cjs`
  - Regenerate: `docs/catalog/runtime-capabilities.md`
  - Modify: `tests/unit/plugin-modules.test.js`
  - Modify: `tests/unit/host-runtime-projection-contracts.test.js`
  - Rename: `tests/integration/doc-review-five-host-projection.integration.test.js` → `tests/integration/doc-review-supported-host-projection.integration.test.js`
  - Rename: `tests/integration/workspace-graph-five-host-projection.integration.test.js` → `tests/integration/workspace-graph-supported-host-projection.integration.test.js`
- **Approach:**
  - U3 与 U1 属于同一个 atomic foundation wave：U1 提供 adapter/registry shape，U3 一次性补齐 `SUPPORTED_PLATFORM_IDS`、schema/data 和 consumers；任何只完成一侧的工作树都不得被验证或发布为可安装 OpenCode。
  - 将 governance schemaVersion 升级并把 `opencode` 加入 host enum、owner_host enum 和 `host_delivery` required properties；同一 patch 为每条 record 增加 delivery。
  - Workflow records 使用 `command`，standalone 使用 `skill`，internal records 沿用当前 delivery policy，不引入 OpenCode-only public workflow。
  - Manifest/governance validators 对缺 key、多 key、错误 delivery 和旧 schemaVersion fail closed；不能用 runtime fallback 补齐缺失 governance。
  - Catalog 增加 OpenCode delivery counts、runtime paths、MCP/permission boundary、preview status 与 promotion criteria，并继续声明 generated catalog 不是 source。
  - Active projection tests 从“固定五宿主”语义改为 `getSupportedPlatforms()`/supported-host 语义；历史 evidence 文档不重写。
- **Patterns to follow:** 当前 `skills-governance.schema.json` 的 `additionalProperties:false` 原子迁移、runtime catalog generator、release continuity stale-catalog gate。
- **Test scenarios:**
  1. 所有 governance records 恰好包含当前 supported host key set；缺少 `opencode` 或存在未知 host 都被 schema/validator 拒绝。
  2. Governance schemaVersion 旧值与 parser constant 不匹配时 fail closed；完整新版本可加载并生成 asset set。
  3. Covers AE4. OpenCode workflow asset set 同时包含 commands 与 workflow skills，standalone/internal delivery 与 record 分类一致。
  4. Catalog OpenCode counts 与 `buildFilteredAssetSet('opencode')` 一致，且 status 为 `generated_runtime_preview` 而非 full support。
  5. Release continuity 在 catalog 未重新生成、schema/data partial migration 或 package 漏 source 时失败。
  6. 所有通过 `getSupportedPlatforms()` 投射 skill-local references/scripts 的 active integration 自动覆盖 OpenCode，且仍排除 evals/maintainer-only files。
- **Verification:** Schema、manifest、filtered asset set、catalog freshness 和 supported-host projection tests 在同一 revision 通过；不得仅更新 JSON data 或文档。

### U4. Runtime Setup MCP、Permission 与 Host Authority

- **Goal:** 让 `spec-runtime-setup` 能以 OpenCode 明确 host authority 安全地检查、写入、验证和卸载 project/user MCP 及最小 permission entries。
- **Requirements:** R8, R10-R13, R15-R16; F3-F4; AE4-AE7
- **Dependencies:** U1, U3
- **Files:**
  - Modify: `skills/spec-runtime-setup/SKILL.md`
  - Modify: `skills/spec-runtime-setup/setup-registry.json`
  - Modify: `skills/spec-runtime-setup/setup-registry.schema.json`
  - Modify: `skills/spec-runtime-setup/references/supported-mcp-tools.md`
  - Modify: `skills/spec-runtime-setup/scripts/lib/registry.cjs`
  - Modify: `skills/spec-runtime-setup/scripts/lib/host-authority.cjs`
  - Modify: `skills/spec-runtime-setup/scripts/lib/host-config.cjs`
  - Modify: `skills/spec-runtime-setup/scripts/lib/configured-dependencies.cjs`
  - Modify: `skills/spec-runtime-setup/scripts/lib/facts.cjs`
  - Modify: `skills/spec-runtime-setup/scripts/lib/human-output.cjs`
  - Modify: `skills/spec-runtime-setup/scripts/lib/runtime-executor.cjs`
  - Modify: `skills/spec-runtime-setup/scripts/lib/workspace-routing-inject.cjs`
  - Modify: `skills/spec-runtime-setup/scripts/providers/graphify.cjs`
  - Modify: `tests/unit/mcp-setup-registry.test.js`
  - Modify: `tests/unit/mcp-setup-host-config.test.js`
  - Modify: `tests/unit/mcp-setup-node-contracts.test.js`
  - Modify: `tests/unit/mcp-setup-config-consumers.test.js`
  - Modify: `tests/unit/mcp-setup-facts-renderer.test.js`
  - Modify: `tests/unit/mcp-setup-providers.test.js`
  - Modify: `tests/unit/mcp-setup-workspace-routing-inject.test.js`
- **Approach:**
  - 将 setup registry 升级到下一 schema version，新增 canonical host `opencode`、project/user targets、OpenCode JSON container/server representation 和 permission managed-entry contract。
  - `host-config.cjs` 从 hard-coded `mcpServers` 扩展为 registry-declared JSON container；server normalization 支持 OpenCode 官方 representation，同时保持其他 hosts byte/semantic compatibility。
  - 项目默认 target 为 `opencode.json`；`--user-scope` 才允许 `$HOME/.config/opencode/opencode.json`。所有 mutation 继续执行 containment、symlink、secret、lock、atomic replace、post-write verify 与 rollback。
  - Permission 只写 namespaced、可比较、可撤销条目；已有冲突返回 action-required，不覆盖。task/subagent 等非 namespaced/global 权限保持用户/OpenCode `ask`，不写全局 allow。
  - `opencode.jsonc`、comment-bearing/unparseable config 或 higher-precedence conflict 返回明确 reason code；不把重新序列化导致的注释丢失当作成功。
  - Facts/human output 分别记录 selected scope、config path、managed entry identifiers、loader/MCP evidence 与 limitations；不得序列化或回显完整用户配置、未知用户条目、literal secret 或解析失败的原始片段，敏感值只保留 redacted/reference-only 事实。LLM 不手改 facts/config。
- **Execution note:** 先为现有五宿主 host-config 行为补齐 compatibility tests，再扩展 registry-driven container/representation，避免 OpenCode shape 破坏 `mcpServers`/TOML writer。
- **Patterns to follow:** `host-authority.cjs` 的 explicit pin、`host-config.cjs` 的 transaction/rollback、runtime setup learning 中的 script-owned facts contract。
- **Test scenarios:**
  1. `MCP_SETUP_HOST=opencode` 授权 mutation；无 pin、错误 pin、runtime-dir/PATH candidate 或 stale facts 都不能授权写入。
  2. Covers AE5. 现有 `opencode.json` 包含未知 top-level、MCP 和 permission keys 时，upsert 只增加/更新 spec-first entries，其他内容语义不变。
  3. Project scope 是默认 target；请求 user scope 但未传 `--user-scope` 返回 `host-user-scope-not-authorized`，显式 opt-in 才写用户路径。
  4. 已有 conflicting spec-first MCP key、permission deny/allow 或 higher-precedence target 时 action-required，不覆盖用户决策。
  5. Literal secret、path escape、symlink target、lock contention、post-write verification failure 分别 fail closed，并在 fault injection 后恢复原始 bytes/mode。
  6. Uninstall 只删除仍匹配 managed expected value 的 MCP/permission entries；用户修改过的条目保留并报告 conflict，空容器按既有 renderer policy 处理。
  7. `opencode.jsonc` 或 comment-bearing config 被检测为 unsupported mutation surface，文件 byte-stable，reason code 指向严格 JSON migration/后续支持。
  8. 现有 Claude/Codex/Cursor/Kiro/Qoder JSON/TOML config fixtures 在 registry version 升级后仍得到相同 target、server shape、conflict 和 rollback 结果。
  9. Covers AE4/AE7. 真实 OpenCode 能连接至少一个 required MCP；subagent workflow 在未全局 auto-approve 的情况下通过用户授权或 ask 流程完成。
  10. 已有配置含未知 secret-like value、解析错误或 conflict 时，facts、human output、JSON evidence 与 thrown error 都不包含原始 secret/config fragment，只输出稳定 reason code、redacted key/path 与恢复方向。
  11. OpenCode runtime state path、workspace `AGENTS.md` routing injection 与 Graphify project-skill/provider integration 使用 `.opencode/**`；所有 canonical-host lists 与 host-path regex 都包含 OpenCode，且旧宿主结果不变。
- **Verification:** Deterministic config transaction tests证明无损 ownership/rollback；只有真实 OpenCode connection 才能把 MCP loader claim 提升为 confirmed。

### U5. Source/Runtime Policy、Docs、Package 与 Release Surface

- **Goal:** 让 OpenCode 在 source/runtime、context、gitignore、用户手册、发布包和 Changelog 中成为一致的 opt-in preview host。
- **Requirements:** R5, R9, R13-R18; F1-F5; AE1-AE8
- **Dependencies:** U1-U4
- **Files:**
  - Modify: `src/cli/gitignore-policy.js`
  - Modify: `CLAUDE.md`
  - Regenerate/verify: `AGENTS.md`
  - Modify: `README.md`
  - Modify: `README.zh-CN.md`
  - Modify: `docs/contracts/context-governance.md`
  - Modify: `docs/contracts/source-runtime-customization-boundary.md`
  - Modify: `docs/contracts/dual-host-governance/README.md`
  - Modify: `skills/spec-runtime-setup/references/supported-mcp-tools.md`
  - Modify: `package.json`
  - Modify: `CHANGELOG.md`
  - Modify: `tests/unit/gitignore-policy.test.js`
  - Modify: `tests/unit/runtime-untrack.test.js`
  - Modify: `tests/unit/platform-compatibility-characterization.test.js`
  - Modify: `tests/smoke/cli-smoke.test.js`
- **Approach:**
  - 精确 ignore/untrack generated OpenCode commands、skills 和 state；不 blanket ignore `.opencode/`，不 ignore/untrack root `opencode.json`、plugins、custom agents 或其他 user/team-owned files。
  - 通过 `CLAUDE.md` source 和 `npm run sync:instructions` 更新 checked-in instruction mapping；不手改 managed-generated runtime mirrors。
  - README/中文 README 集中说明 host selection、runtime paths、双入口、MCP scope、permission boundary、clean vs setup uninstall 和 preview claim。
  - Context/source-runtime contracts 把 `.opencode/commands/spec-*.md`、`.opencode/skills/**`、`.opencode/spec-first/**` 与 managed config slice 分类为 runtime/config output；未知 OpenCode native surfaces 保持 advisory/user-owned。
  - Package description、runtime catalog 和 release continuity 只声明 OpenCode generated preview；正式支持文案受 U6 real-runtime evidence gate 控制。
- **Patterns to follow:** 精确 mixed-ownership gitignore policy、README 的集中 host entry mapping、generated catalog 和 source-first Changelog。
- **Test scenarios:**
  1. `.opencode/commands/spec-work.md`、`.opencode/skills/spec-work/**`、`.opencode/spec-first/**` 被 ignore/untrack policy 精确覆盖。
  2. `opencode.json`、`.opencode/plugins/**`、`.opencode/agents/custom.md`、非 `spec-*` command/skill 保持可见且不自动 untrack。
  3. Recursive pathspec 覆盖嵌套 skill files，不因目录 wildcard 漏掉 `SKILL.md` references/scripts。
  4. README/中文 README、help、catalog、package description 对 OpenCode 的 host 名称、opt-in 和 preview 证据口径一致。
  5. Instruction sync 后 CLAUDE/AGENTS managed governance 区一致，OpenCode runtime 被列为 generated surface，root `AGENTS.md` 仍是 source instruction。
  6. Packed tarball 包含 adapter、setup registry/schema/scripts、contracts 和生成后的 current catalog，不包含本仓 `.opencode` runtime。
- **Verification:** Policy/unit/docs/package gates 证明 source 与发布面一致；未取得 U6 real-runtime evidence 时，所有用户文案保持 preview ceiling。

### U6. Deterministic Preview 与 Real OpenCode Verification Ladder

- **Goal:** 用与 claim 匹配的分层证据关闭发布，允许缺 CLI 时交付 deterministic preview，并为正式支持晋升保留可复跑的真实旅程。
- **Requirements:** R14-R18; F5; AE6-AE8
- **Dependencies:** U1-U5
- **Files:**
  - Modify: `tests/smoke/cli-smoke.test.js`
  - Modify after U2 rename: `tests/integration/init-supported-host-lifecycle.integration.test.js`
  - Modify after U3 rename: `tests/integration/workspace-graph-supported-host-projection.integration.test.js`
  - Modify after U3 rename: `tests/integration/doc-review-supported-host-projection.integration.test.js`
  - Create: `tests/integration/opencode-runtime-lifecycle.integration.test.js`
  - Create: `docs/validation/2026-07-27-opencode-host-support/README.md`
  - Create: `docs/validation/2026-07-27-opencode-host-support/deterministic-summary.json`
  - Create when available: `docs/validation/2026-07-27-opencode-host-support/real-runtime-summary.json`
- **Approach:**
  - 先执行 focused adapter/CLI/governance/setup tests，再执行 typecheck、skill lint、unit、smoke、integration、full test、build、release continuity 与 diff checks。
  - 从 packed tarball 安装到隔离 prefix/home，在临时 project 执行 OpenCode-only、Codex+OpenCode 和 all-supported-host init/doctor/update/clean，证明发布包而非 source checkout 行为。
  - Deterministic evidence 记录 commit、package version、commands、exit codes、artifacts、reason codes 与 limitations；缺 OpenCode CLI 时 `real-runtime-summary.json` 不伪造，可记录 `not_run`/reason 或保持未创建。
  - 真实 OpenCode 旅程固定覆盖 command discovery/invocation、skill discovery/invocation、subagent-dependent workflow、MCP connection、permission prompt/deny behavior、init→doctor→update→clean/setup-uninstall。
  - 支持晋升由 evidence reviewer 对照状态边界判断；官方 docs、unit tests、自检或 transcript completion statement 都不能单独晋升。
- **Patterns to follow:** packaged five-host verification learning、Cursor preview promotion gate、`verification-run-summary`/honest evidence ceiling。
- **Test scenarios:**
  1. Covers AE6. 无 OpenCode CLI 的隔离环境完成 packed `init --opencode`、doctor、re-init、update refresh planning、clean；输出保持 preview/degraded，不失败也不声称 loader pass。
  2. Covers AE2. Packed Codex+OpenCode install 后分别 clean 任一宿主，另一宿主 runtime/state/共享 instruction 保持；setup uninstall 仅影响 OpenCode managed config entries。
  3. All-supported-host packed init 使用动态 supported roster，所有 host state、skill packages 和 doctor drift checks 一致，OpenCode 不改变默认 `init -y` roster。
  4. Covers AE7. 真实 OpenCode 通过 `/spec-brainstorm` 或等价 command 与 `spec-brainstorm` skill 两个入口，证明发现和调用，而非只列文件。
  5. 真实 OpenCode 在用户明确授权 dispatch 后运行一条 subagent-dependent workflow；无授权 case 走 inline fallback，并在结果中披露 degradation。
  6. 真实 OpenCode 连接 required MCP，验证 project/user scope、permission ask/deny 和 cleanup；用户已有 config entries 保持。
  7. Loader、配置 schema 或 permission 行为与官方 docs/计划不一致时，证据标记 failure/degraded，支持状态回退，不修改 summary 伪装成功。
- **Verification:** Preview completion 需要 deterministic/package ladder 全部通过；正式支持 completion 还需要 `real-runtime-summary.json` 覆盖全部真实旅程并由维护者确认 claim scope。

---

## Verification Contract

### Deterministic Gates

| Gate | Applies to | Required outcome |
|---|---|---|
| Focused Jest suites for U1-U5 | 每个 feature-bearing unit | 新增 scenarios 先失败后通过；旧五宿主 compatibility 保持 |
| `npm run typecheck` | CLI/scripts | 所有 CommonJS source 与关键 scripts 语法通过 |
| `npm run lint:skill-entrypoints` | Skill/governance/projection | OpenCode delivery 不引入 public/internal 入口漂移 |
| `npm run test:runtime-setup` | U4 | Registry、host authority、config transaction、providers 全通过 |
| `npm run test:unit` | 全部 source owners | Adapter、CLI、governance、ownership、docs contracts 全通过 |
| `npm run test:smoke` | CLI/package UX | Help、default host set、packed OpenCode init smoke 通过 |
| `npm run test:integration` | Lifecycle/projection | OpenCode-only、多宿主、workspace graph、doc-review projection 通过 |
| `npm test` | Full regression | 主测试链路无新增失败；conditional skips 有明确原因 |
| `npm run docs:runtime-catalog` + `npm run test:release` | Generated catalog / release continuity | Catalog 与 current source/governance byte-current，release continuity 无 partial-host 漂移 |
| `npm run build` | Release package | Tarball 包含所有 source/config/docs contracts，不含 repo-local runtime |
| `npm run sync:instructions` verification | CLAUDE/AGENTS managed source | Checked-in host instructions 无 drift |
| `git diff --check` | Final diff | 无 whitespace/error；变更集不含手改 `.opencode/**` runtime |

### Packaged Runtime Gates

- 从 `npm pack` 产物进行隔离安装，不以 source-tree CLI 代替发布包证明。
- 临时项目覆盖 OpenCode-only、Codex+OpenCode、all-supported-host；每个场景检查 init、doctor、immediate re-init idempotence、update refresh args、clean 和 user-owned file preservation。
- 配置 transaction 使用隔离 project/home，覆盖 project/user scope、conflict、secret、symlink、lock、rollback、uninstall 和 JSONC fail-closed。
- 证据必须记录版本、commit、平台、命令、exit code、artifact path 和 claim limitation；测试输出摘要不是 field outcome。

### Behavioral / Fresh-Source Gates

- `skills/spec-runtime-setup/SKILL.md` 或 host-specific skill transform 发生语义变更后，使用当前磁盘 source 做 fresh-source read-only evaluation，覆盖 explicit host authority、no manual config edit、user-scope、permission/auto-approve 和 degraded claim。
- 当前 planning 没有 subagent 授权；实现阶段若仍缺 dispatch primitive/authorization，记录 `not_run: dispatch_authorization_missing`，不能声称 fresh-source eval 通过。
- OpenCode 本机不可用时，真实 loader/MCP/subagent journey 记录 `not_run: opencode_cli_unavailable`；这不阻断 deterministic preview，但阻断正式支持晋升。

### Real OpenCode Promotion Gates

| Claim | Required evidence |
|---|---|
| `generated_runtime_preview` | Deterministic source/projection/governance/lifecycle/config/package gates |
| Loader-confirmed preview | OpenCode 版本可追溯；至少一个 command 与一个 skill 被真实发现和调用 |
| Full support eligible | Loader evidence + subagent-dependent workflow + MCP connection + permission deny/ask + install-to-clean end-to-end journey |

---

## System-Wide Impact

| Surface | Scope | Impact |
|---|---|---|
| CLI/user interaction | In scope | 新 host selector、help、preview、doctor/clean/update 结果 |
| Runtime projection | In scope | 独立 commands、skills、state；不生成 custom agents |
| Governance/schema | In scope | 第六 host key、versioned atomic migration、catalog consumer |
| Agent/tool surface | In scope | Command+skill parity、native subagent、inline fallback、MCP/permission |
| Project instructions | In scope | 复用 `AGENTS.md`；shared clean ownership |
| Host config | In scope | Project-first strict JSON merge、user-scope opt-in、managed uninstall |
| Git/context policy | In scope | 精确 generated paths；未知 OpenCode assets 保持 visible/advisory |
| Data/database/backend service | Out of scope: CLI 不引入持久业务数据或网络服务 | 只有 local files/state/config |
| User-global language sync | Out of scope | OpenCode 继续消费 project `AGENTS.md`，不新增 global instruction mutation |
| Hooks/plugins | Deferred: 真实 gate gap 触发 | 首版不追求 feature parity |
| Operational rollout | In scope | Opt-in preview、claim promotion、rollback/uninstall 文档与证据 |

---

## Risks & Dependencies

| Risk | Consequence | Mitigation / owner-visible proof |
|---|---|---|
| OpenCode docs/config schema drift | Generated assets or config cannot load | Implementation re-reads official docs; real journey gates promotion; degraded reason preserves claim ceiling |
| Governance/schema partial migration | Init/catalog fails or silently omits skills | Version bump + additionalProperties/required-key tests + atomic change |
| Reusing `.agents/skills` | Codex/OpenCode clean and precedence collide | Independent `.opencode/skills`; coexistence tests |
| Shared `AGENTS.md` removed by single-host clean | Remaining hosts lose project routing | Confirmed-absent last-consumer rule；ambiguous state preserves block and reports action-required；Codex/OpenCode/Qoder integration tests |
| Config overwrite, lossy JSONC rewrite, or diagnostic secret exposure | User config/comments lost or credentials leak into facts/logs/evidence | Strict JSON target, atomic transaction, conflict/JSONC fail-closed, redacted/reference-only diagnostics, rollback and secret-leak fault tests |
| Permission overreach | Unintended command/tool auto-approval | Namespaced minimal entry only; conflicting rules preserved; task/bash/edit/web stay ask/user-owned |
| No local OpenCode CLI | False full-support claim | Preview status and `opencode_cli_unavailable`; real evidence gate remains blocking for promotion |
| Subagent permission/authorization ambiguity | Workflow silently changes autonomy | User dispatch authority checked by workflow; native task remains host-permissioned; inline fallback tested |
| Broad `.opencode` ignore/clean | Team/user assets hidden or deleted | Registry-declared exact surfaces, recursive pathspec tests, user-owned sentinels |
| Package-only omissions | Source tests pass but community install fails | Isolated tarball install/init/doctor/clean is required preview proof |

---

## Alternative Approaches Considered

- **Reuse Codex `.agents/skills`.** Rejected because it violates independent runtime/clean ownership and makes OpenCode precedence depend on another host install.
- **Skill-only OpenCode preview.** Rejected because the Product Contract requires `/spec-*` commands and skill discovery together, and OpenCode officially exposes project commands.
- **Generate custom helper agents.** Rejected because helper prompts already have skill-local owners and OpenCode native subagents are the execution primitive; custom profiles would create extra user entrypoints and tool-policy duplication.
- **Build an OpenCode-specific installer/config manager.** Rejected because existing adapter、plugin sync、Runtime Setup authority/transaction already own the necessary boundaries.
- **Overwrite `opencode.json` from a template.** Rejected because the file is mixed ownership and may contain user MCP、permission、model、plugin or other settings.
- **Support JSONC mutation immediately.** Deferred because comment-preserving editing needs a new parser/dependency or a larger editor boundary; strict JSON plus fail-closed collision covers the primary path without silent data loss.
- **Install hooks/plugins for parity.** Rejected until direct evidence shows a required deterministic gate cannot be carried by current CLI/skill/setup mechanisms.

---

## Documentation / Operational Notes

- README 和 README.zh-CN 把 OpenCode 加入集中 host table、init examples、runtime paths、MCP scope、clean/uninstall 与 support status；共享 workflow prose 继续使用“current host”而不是散落 host branch。
- Runtime catalog 从 source/governance 生成，OpenCode 初始状态明确为 `generated_runtime_preview`；真实证据落地后再更新 promotion status。
- `docs/contracts/context-governance.md` 与 `source-runtime-customization-boundary.md` 明确 `.opencode` generated slice、`opencode.json` mixed ownership 和 source-first repair path。
- 实现阶段创建验证目录，确定性与真实 runtime 证据分开；缺失真实 evidence 是显式 limitation，不是空壳 pass。
- Rollback 分两步：`spec-first clean --opencode` 移除 runtime；Runtime Setup uninstall 移除仍可证明归属的 config entries。两步都不删除 unknown user content。
- 发布为 preview 时无需 feature flag；opt-in `--opencode` 本身是 rollout gate。正式支持晋升 owner 为项目维护者，rollback trigger 是 loader/MCP/subagent/end-to-end 任一回归。

---

## Definition of Done

### Global Preview Completion

- Product Contract preservation note准确，R1-R18 在 U1-U6、tests、verification 或明确 deferment 中可追踪。
- OpenCode adapter、CLI lifecycle、governance/schema、Runtime Setup、ownership/docs/package 全部 source-first 实现；工作树不包含手改 `.opencode/**` runtime。
- `init --opencode` opt-in 可用，`init -y` defaults 不变；OpenCode 与 Codex/Qoder 等宿主可共存和独立 clean。
- OpenCode commands、workflow skills、standalone/internal skills、state 和 runtime-setup host pin 按 governance 生成；不生成 custom helper agents。
- `opencode.json` project/user config merge、permission minimum、conflict、rollback、uninstall 和 JSONC fail-closed 由确定性 tests 证明。
- Focused、typecheck、skill lint、runtime setup、unit、smoke、integration、full test、catalog、build、instruction sync 与 diff gates 全部通过，或 conditional skip 有具体 non-success reason。
- Packed tarball 的 OpenCode-only、多宿主和 all-supported-host lifecycle 通过；验证 artifacts 记录实际命令、exit code、paths 和 limitations。
- README/catalog/release/Changelog 只声明 `generated_runtime_preview`，除非真实 promotion gates 已通过。
- 实验或失败路线产生的 dead code、临时 parser、重复 host lists 和 sandbox artifacts 已清理，不留在最终 diff。

### Per-Unit Done Signals

| Unit | Done signal |
|---|---|
| U1 | OpenCode adapter transform/projection/inspection/ownership tests 通过，runtime roots 与 Codex 独立，preview warning 非 drift；filtered asset completeness 等待 U3 atomic close |
| U2 | Selector/default/help/doctor/update/clean/workspace tests 通过；单独 clean 保留其他 host runtime 与共享 `AGENTS.md`，ambiguous consumer state fail closed |
| U3 | Versioned governance/schema/data/catalog 原子通过，所有 records 和 active supported-host projection 包含 OpenCode |
| U4 | Explicit host authority、project/user scope、MCP/permission merge、conflict、rollback、uninstall、JSONC fail-closed 与 secret-safe diagnostics 全部通过，旧 host fixtures 无回归 |
| U5 | Git/context/source-runtime/docs/package/Changelog 对 OpenCode preview 一致，未知 user assets 可见且保留 |
| U6 | Deterministic/package evidence 完整；真实 OpenCode 不可用时明确 `not_run` 且不晋升 claim |

### Full Support Promotion Completion

- `real-runtime-summary.json` 记录 OpenCode 版本与真实 command、skill、subagent、MCP、permission 和 lifecycle 旅程。
- 命令与 skill 都是实际调用成功，不是仅扫描到文件；subagent workflow 与无授权 inline fallback 都有可审计结果。
- MCP project/user scope 与 uninstall 在真实 OpenCode 配置加载后生效，用户已有 config 保持。
- 维护者确认 evidence freshness、limitations 与 claim scope 后，才更新 catalog/README/release wording；任何反例会把状态降回相应较低层级。
