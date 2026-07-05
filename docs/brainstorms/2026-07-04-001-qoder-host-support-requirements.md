---
spec_id: 2026-07-04-001-qoder-host-support
artifact_kind: prd-requirements
target_surface: cli-devtool-runtime
status: ready-for-planning
evidence_grade: mixed
source_authority: mixed
readiness_authority: engineering-owned
created: 2026-07-04
source_inputs:
  - docs/10-prompt/结构化项目角色契约.md
  - src/cli/adapters/base.js
  - src/cli/adapters/kiro.js
  - src/cli/plugin.js
  - src/cli/commands/init.js
  - docs/solutions/workflow-issues/host-entrypoint-mapping-source-boundary-2026-04-29.md
  - docs/solutions/workflow-issues/workflow-host-instruction-reuse-policy-2026-05-25.md
write_mode: final-prd
can_enter_spec_plan: yes
clarification_evidence: source-proven-no-ask
preflight_sweep_closure: closed
next_owner_question: none
decision_card_highest_risk_gap: Qoder 官方 commands/skills/subagent/MCP/memory 能力与 spec-first source/runtime 边界的映射不能被误当作已实现；真实 Qoder CLI/IDE smoke 仍需实施期验证。
decision_card_next_action: final-prd
decision_card_why_no_invention: P0 只定义 Qoder opt-in preview host 的投影边界、配置安全边界、验收与非目标；官方文档未覆盖或未实测的行为进入 Planning Recheck / Outstanding Questions，不让 planning 发明 WHAT。
readiness_verified_by: check-prd-artifact.js
readiness_verified_at: 2026-07-03T18:58:50.217Z
readiness_checker_schema: spec-prd-artifact-check.v1
readiness_finding_count: 0
readiness_blocking_count: 0
readiness_prd_hash: sha256:1f6ddfd2b59a689c2b4f5e0f5cf1c98d856960a047debd920e520f17f722978c
readiness_inputs_hash: sha256:9b378eb72f0f842a5ba6a9c716a3c3fe3078f1db15ee9adc23f4a4df98dde4e9
---

# Qoder Host Support 需求

<!-- prd:section=summary -->
## Summary

为 `spec-first` 增加 Qoder 作为第四个 opt-in preview 宿主，使现有 source assets 能投影到 Qoder project commands、project skills、project subagents 与本地 MCP 配置，同时保持 `AGENTS.md` 为共享静态记忆入口、generated runtime 可重建、用户级配置写入显式 opt-in。P0 目标是建立可试用、可验证、可回滚的 Qoder runtime surface；不在本切片交付 Qoder plugin、hooks 默认安装或 `.qoder/rules/` 规则拆分。

---

## Problem Frame

`spec-first` 当前已支持 Claude Code、Codex 与 Kiro。Kiro 支持刚完成 opt-in preview，但它的 P0 投影受 Kiro 能力边界约束：不生成 commands，agent 默认工具只有 `read`，且真实 IDE smoke 仍为 degraded/open item。Qoder 官方 CLI 文档显示它同时支持 project commands、project skills、project subagents、MCP scopes、hooks，以及以 `AGENTS.md` 为默认静态记忆入口；这意味着 Qoder 不应机械复用 Kiro 的最小投影策略，而应把 project commands/skills/agents 一并纳入 P0。

本需求的产品对象是 spec-first CLI/runtime generation 与治理文档，不是 Qoder 的原生产品体验。成功结果是后续 `spec-plan` 能在不重新发明宿主边界的情况下规划实现：新增 Qoder host adapter、接入 init/doctor/clean/plugin registry、补齐 MCP setup、本地文档与测试矩阵，并清楚标注真实 Qoder CLI/IDE smoke 的验证上限。

---

## Current System Snapshot

| claim | evidence tag | source / owner | note |
| --- | --- | --- | --- |
| Host adapter 抽象已有 `PlatformAdapter`，包含 commands、skills、workflows、agents、state file、instruction file、runtime sync/removal/inspection 扩展点。 | confirmed-source | `src/cli/adapters/base.js` | Qoder 应优先新增 adapter 并复用通用生成链路。 |
| 当前支持宿主列表是 `['claude', 'codex', 'kiro']`。 | confirmed-source | `src/cli/plugin.js` | Qoder 需要进入 registry 和治理 schema/data。 |
| Kiro adapter 已实现 host-specific skill/agent 转换、runtime inspection 和 `.kiro/spec-first/state.json`。 | confirmed-source | `src/cli/adapters/kiro.js` | Qoder 可复用其 adapter 结构，但不能照搬 commands=false 或 tools=["read"]。 |
| init 入口已有平台选择、remembered hosts 和 opt-in host 模式；Kiro 不是 `-y` 默认宿主。 | confirmed-source | `src/cli/commands/init.js` | Qoder 应采用同样 opt-in preview 策略。 |
| 项目角色契约要求 Light contract、explicit source/runtime boundaries，scripts 只做确定性事实，LLM 做语义判断。 | confirmed-source | `docs/10-prompt/结构化项目角色契约.md` | Qoder 支持不能演化成第二套 prompt/runtime 系统。 |
| 宿主入口映射应集中在 init/adapter/README 中心表，不应散落到普通 workflow prose。 | confirmed-source | `docs/solutions/workflow-issues/host-entrypoint-mapping-source-boundary-2026-04-29.md` | README 可列 Qoder 对照，普通 skill prose 应继续写 current host。 |
| Qoder 官方文档说明 project commands 位于 `.qoder/commands/`，子目录命令用 `:` namespace。 | external-research | `https://docs.qoder.com/en/cli/command.md`，2026-07-04 读取 | 支持 P0 投影 `.qoder/commands/spec/*.md`。 |
| Qoder 官方文档说明 project skills 位于 `.qoder/skills/{skill-name}/SKILL.md`，frontmatter 需要 `name` 和 `description`。 | external-research | `https://docs.qoder.com/en/cli/Skills.md`，2026-07-04 读取 | 支持 P0 投影 source skills。 |
| Qoder 官方文档说明 project subagents 位于 `.qoder/agents/*.md`，工具名包括 `Read`、`Grep`、`Glob`、`Bash`、`Write`、`Edit`、`WebFetch`、`WebSearch`、`Agent`。 | external-research | `https://docs.qoder.com/en/cli/subagent.md`，2026-07-04 读取 | Qoder agent 默认可比 Kiro 更可用，但仍需 least-privilege。 |
| Qoder 官方文档说明 MCP 默认 `local` scope，写 `${project}/.qoder/settings.local.json`；`user` scope 写 `~/.qoder/settings.json`。 | external-research | `https://docs.qoder.com/en/cli/mcp-servers.md`，2026-07-04 读取 | P0 必须默认 local，user scope 需要显式 gate。 |
| Qoder 官方文档说明 hooks 位于 JSON settings，用户、project、local project 三层会 merge。 | external-research | `https://docs.qoder.com/en/cli/hooks.md`，2026-07-04 读取 | P0 不默认安装 hooks，避免过早扩大副作用面。 |
| Qoder 官方文档说明 `AGENTS.md` 是默认静态记忆文件，`.qoder/rules/**/*.md` 是可选规则拆分。 | external-research | `https://docs.qoder.com/en/cli/memory.md`，2026-07-04 读取 | P0 复用仓库根 `AGENTS.md`，不复制 `.qoder/rules/`。 |

---

<!-- prd:section=change_delta -->
## Change Delta

| item | current | target | delta | evidence |
| --- | --- | --- | --- | --- |
| Supported hosts | Claude、Codex、Kiro | 增加 Qoder opt-in preview | extend | `src/cli/plugin.js` |
| Runtime root | 无 Qoder managed output | `.qoder/commands/spec/`、`.qoder/skills/`、`.qoder/agents/`、`.qoder/spec-first/state.json`、local MCP settings | add | Qoder official docs + adapter pattern |
| Commands projection | Kiro 不生成 commands | Qoder P0 生成 project commands | extend | Qoder command docs |
| Skills projection | Kiro 生成 Agent Skills | Qoder 生成 project skills | extend | Qoder skills docs |
| Agents projection | Kiro agents 默认 `tools: ["read"]` | Qoder agents 默认 `tools: [Read, Grep, Glob]`，必要时按角色补 WebFetch/WebSearch，不默认 Write/Edit/Bash/Agent | replace host-specific transform | Qoder subagent docs |
| Static memory | `AGENTS.md` 是 repo source | 复用 `AGENTS.md`；不生成 `.qoder/rules/` | keep | Qoder memory docs + source/runtime boundary |
| MCP config | Claude/Codex/Kiro 已有 setup scripts | 增加 Qoder local default `.qoder/settings.local.json`；user scope 需 `--user-scope`/`QODER_USER_SCOPE=1` | extend | Qoder MCP docs |
| Generated ignores | 已忽略 Claude/Codex/Kiro generated mirrors | 精准忽略 spec-first managed Qoder runtime，不 blanket ignore `.qoder/` | extend | source/runtime boundary |
| Hooks/plugin | 无 Qoder support | P0 不生成 hooks，不交付 Qoder plugin | keep/defer | Qoder hooks docs；P0 副作用控制 |

---

## Change Topology

Primary topology: runtime-host-extension

这是对宿主 runtime projection 的扩展，跨 CLI adapter registry、init/doctor/clean、MCP setup、runtime catalog、context governance、README 与测试矩阵。它不是 workflow 语义重写，也不是 Qoder 原生命令/技能体系的再设计。Qoder 官方能力是 external-research 输入，落地时必须回到 spec-first source-of-truth 与测试验证，不把官方文档本身当作实现完成证明。

---

## Surface Map

| surface | current behavior | target behavior | owner/source | consumer | evidence |
| --- | --- | --- | --- | --- | --- |
| `src/cli/adapters/qoder.js` | 不存在 | 新增 Qoder adapter，负责 commands/skills/agents transform、inspect、runtime cleanup | source | init/doctor/clean/plugin | adapter pattern |
| `src/cli/plugin.js` | 支持 3 host | `SUPPORTED_PLATFORM_IDS` 增加 `qoder`，host delivery 数据可消费 Qoder | source | asset generation、governance checks | current source |
| `src/cli/adapters/index.js` | 无 Qoder export | 注册 Qoder adapter | source | CLI commands | adapter pattern |
| `src/cli/commands/init.js` | Qoder 不可选 | Qoder 可通过 `--qoder` 或 interactive opt-in 选择；`-y` 默认不含 Qoder | source | users、tests | Kiro preview precedent |
| `src/cli/commands/doctor.js` | 无 Qoder platform checks | 支持 `doctor --qoder` 和 managed-state detection，避免仅因 user-owned `.qoder/**` 误判 | source | users、tests | Kiro detect precedent |
| `src/cli/commands/clean.js` | 无 Qoder cleanup | 只清理 spec-first managed Qoder outputs，保留 user-owned `.qoder/rules`、settings 等 | source | users、tests | source/runtime boundary |
| `.qoder/commands/spec/*.md` | 不存在 | generated runtime command mirrors | generated | Qoder CLI | Qoder command docs |
| `.qoder/skills/*/SKILL.md` | 不存在 | generated runtime skill mirrors | generated | Qoder CLI | Qoder skills docs |
| `.qoder/agents/*.md` | 不存在 | generated runtime subagent profiles | generated | Qoder CLI | Qoder subagent docs |
| `.qoder/settings.local.json` | user/project-owned local config | spec-first MCP setup 可写本地配置，默认不提交 | generated/local config | Qoder CLI MCP | Qoder MCP docs |
| `AGENTS.md` | repo host instruction source | 继续作为 Qoder static memory 入口 | source | Qoder CLI memory | Qoder memory docs |
| README / runtime catalog / context docs | 只列 Claude/Codex/Kiro | 增加 Qoder preview 描述与 generated mirror 边界 | source docs | users、reviewers | current docs |

---

## Producer / Artifact / Consumer

| producer | artifact/path | artifact type | consumer | target behavior |
| --- | --- | --- | --- | --- |
| `spec-first init --qoder` | `.qoder/commands/spec/*.md` | generated | Qoder slash command loader | 提供 `spec-prd`、`spec-plan` 等 project commands。 |
| `spec-first init --qoder` | `.qoder/skills/*/SKILL.md` | generated | Qoder skill loader | 提供自动/手动触发的 project skills。 |
| `spec-first init --qoder` | `.qoder/agents/*.md` | generated | Qoder subagent loader | 提供 least-privilege project subagents。 |
| `spec-first init --qoder` | `.qoder/spec-first/state.json` | generated | doctor/clean/drift checks | 记录 managed asset manifest，作为 spec-first-owned state。 |
| `spec-mcp-setup` scripts | `.qoder/settings.local.json` | local generated config | Qoder MCP loader | 默认 local scope；user/global scope 需显式 opt-in。 |
| repo maintainer | `AGENTS.md` | source | Qoder static memory / other hosts | 继续承载项目指令，不复制到 `.qoder/rules/`。 |

---

## Source-Of-Truth Resolution

| item | source-of-truth | generated / advisory | conflict rule |
| --- | --- | --- | --- |
| Workflow / skill / agent source | `skills/`、`agents/`、`templates/`、`src/cli/` | `.qoder/commands/`、`.qoder/skills/`、`.qoder/agents/` | 修改 source，通过 `spec-first init --qoder` 重建 runtime。 |
| Qoder static memory | `AGENTS.md` | `.qoder/rules/**` 为 Qoder-native optional rules | P0 不生成 rules；若未来支持 rules，需单独 source-of-truth 决策。 |
| MCP server config | `skills/spec-mcp-setup/scripts/**` | `.qoder/settings.local.json` / `~/.qoder/settings.json` | 默认 local；user scope 必须经过脚本层 gate。 |
| Official Qoder behavior | Qoder docs / real CLI smoke | 本 PRD 中的 external-research 摘要 | 实施前复核官方文档；完成前不能用文档替代真实 generated asset/CLI 验证。 |
| Host entrypoint wording | adapter/init/runtime catalog/README 中心表 | 普通 workflow prose | 普通 prose 写 current host，不散落 Qoder 命令映射。 |

---

<!-- prd:section=requirements -->
## Requirements

| id | priority | requirement | rationale/source |
| --- | --- | --- | --- |
| R-01 | P0 | Qoder 必须作为第四个 supported host id `qoder` 接入 CLI registry、host delivery governance、init/doctor/clean 与 runtime catalog。 | spec-first host support 需要可发现、可验证、可清理。 |
| R-02 | P0 | Qoder 必须是 opt-in preview host；interactive init 可选，`init -y` 默认不自动安装 Qoder runtime。 | 沿用 Kiro preview 风险姿态，避免新宿主默认副作用。 |
| R-03 | P0 | Qoder P0 必须生成 project commands 到 `.qoder/commands/spec/*.md`，并支持子目录 namespace 规则。 | Qoder 官方支持 project commands，不能照搬 Kiro no-command 策略。 |
| R-04 | P0 | Qoder P0 必须生成 project skills 到 `.qoder/skills/{skill-name}/SKILL.md`，保持 `name` 与目录名一致且符合 64 字符约束。 | Qoder skills loader 以 `SKILL.md` frontmatter 发现技能。 |
| R-05 | P0 | Qoder P0 必须生成 project subagents 到 `.qoder/agents/*.md`，默认工具至少包含 `Read`、`Grep`、`Glob`；不默认授予 `Write`、`Edit`、`Bash`、`Agent`。 | Qoder subagent 有明确工具名，review/research agent 需要检索能力；least-privilege 避免写权限扩散。 |
| R-06 | P0 | 需要 web research 的 agent 可显式包含 `WebFetch`/`WebSearch`，但必须由 adapter transform 或 agent profile 规则决定，不能全量默认开启。 | 保持 agent capability 与职责匹配。 |
| R-07 | P0 | MCP setup 默认写 `.qoder/settings.local.json`；写 `~/.qoder/settings.json` 只允许在 `--user-scope` 或 `QODER_USER_SCOPE=1` 明确启用时发生，且 gate 必须在 shell/PowerShell 脚本层实现。 | 防止绕过 CLI 直接调用脚本写用户级配置。 |
| R-08 | P0 | Qoder 支持必须复用 repo 根 `AGENTS.md` 作为 static memory source，不在 P0 复制或生成 `.qoder/rules/**`。 | 避免第二真相源；Qoder rules 是可选能力。 |
| R-09 | P0 | `.gitignore` / context governance 必须精准覆盖 spec-first managed Qoder generated runtime，不得 blanket ignore `.qoder/`，也不得把 user-owned `.qoder/rules/**`、`.qoder/settings.json` 静默纳入 clean。 | 保留用户/团队 Qoder native 配置。 |
| R-10 | P0 | `doctor --qoder` 必须只识别 spec-first managed state/commands/skills/agents/local MCP config，不得因仅存在 `.qoder/rules/**`、user-owned settings 或其他 Qoder native 文件误判 runtime installed。 | 避免原生 Qoder 项目被误识别为 spec-first 安装态。 |
| R-11 | P0 | `clean --qoder` 必须只删除 spec-first managed Qoder assets，并保留 Qoder native files。 | source/runtime ownership 明确。 |
| R-12 | P0 | Runtime capability catalog、README、README.zh-CN、context-governance/instruction-bootstrap 文案必须增加 Qoder，并明确 Qoder support 是 opt-in preview。 | 用户可见行为变化需要同步 docs。 |
| R-13 | P0 | 测试必须覆盖 Qoder init asset shape、doctor JSON/文本检查、clean 保留 user-owned `.qoder/**`、gitignore policy、MCP setup shell + PowerShell scope gate、runtime catalog 和 release packaging。 | 新宿主影响跨 CLI、脚本、docs、包内容。 |
| R-14 | P0 | 完成标准必须包含真实或降级记录的 Qoder CLI/IDE smoke：至少验证 generated commands/skills/agents 可被 Qoder loader 识别；无法运行时必须写 degraded reason，不得声称 parity。 | 外部文档不是真实 runtime 证明。 |
| R-15 | P0 | P0 不生成 Qoder hooks、不交付 Qoder plugin、不修改 Qoder auto-memory，不新增公共 workflow。 | 控制副作用和范围，避免重建宿主原生能力。 |
| R-16 | P1 | 后续可评估 `.qoder/rules/**` 细粒度规则投影，但必须先定义与 `AGENTS.md` 的 source-of-truth 分工。 | Qoder rules 有价值，但容易形成第二真相源。 |
| R-17 | P1 | 后续可评估 Qoder hooks 支持 mutation/verification gates，但必须独立设计 preview-first、user opt-in 与跨宿主一致性。 | hooks 是高副作用 surface，不进 P0。 |
| R-18 | P1 | 后续可评估 Qoder plugin 形态，但 P0 先以 project-local assets 证明价值。 | 避免过早复杂化发布/安装模型。 |

---

<!-- prd:section=acceptance_examples -->
## Acceptance Examples

AE-01（覆盖 R-01、R-02）
Given 一个干净项目执行 `spec-first init --qoder -y -u test --lang zh`
When init 结束
Then 生成 Qoder managed runtime assets，且普通 `spec-first init -y` 不默认生成 Qoder assets。

AE-02（覆盖 R-03、R-04、R-05）
Given Qoder runtime 已初始化
When 检查 `.qoder/commands/spec/`、`.qoder/skills/`、`.qoder/agents/`
Then commands、skills、agents 均存在，skills frontmatter `name` 与目录匹配，agents frontmatter 使用 Qoder 工具名且默认不含 `Write`、`Edit`、`Bash`、`Agent`。

AE-03（覆盖 R-05、R-06、R-14）
Given review/research agent 被投影到 Qoder
When 只授予 `Read`、`Grep`、`Glob`
Then agent 具备代码库读取/检索最低能力；若真实 Qoder CLI 证明这些工具无法完成检索，计划/实现 closeout 必须降级并重新调整 tools 策略。

AE-04（覆盖 R-07）
Given 直接调用 `configure-host.sh` 或 PowerShell 等脚本并设置 host 为 Qoder
When 未传 `--user-scope` 且未设置 `QODER_USER_SCOPE=1`
Then 脚本只允许写 `.qoder/settings.local.json`，拒绝写 `~/.qoder/settings.json`，即使调用路径来自 Qoder skill invocation 也一样。

AE-05（覆盖 R-08、R-09、R-10、R-11）
Given 项目已有用户维护的 `.qoder/rules/security.md`、`.qoder/settings.json` 与 `.qoder/hooks/custom.json`
When 运行 `doctor --qoder` 和 `clean --qoder`
Then doctor 不把这些文件当 spec-first managed installed state；clean 不删除它们。

AE-06（覆盖 R-12、R-13）
Given Qoder support 已实现
When 运行 docs/runtime catalog、unit/smoke/release governance tests
Then README/README.zh-CN/runtime catalog 都列出 Qoder preview surface，测试覆盖 init/doctor/clean/MCP/gitignore/package。

AE-07（覆盖 R-15、R-16、R-17、R-18）
Given Qoder 官方支持 hooks、rules 和 plugin-provided agents
When P0 完成
Then diff 中不出现默认 hook install、`.qoder/rules/**` 投影或 Qoder plugin；这些只能作为后续明确计划进入。

---

<!-- prd:section=scope_boundaries -->
## Scope Boundaries

### In Scope

- 新增 Qoder host adapter 与 registry/init/doctor/clean 接入。
- 生成 `.qoder/commands/spec/*.md`、`.qoder/skills/*/SKILL.md`、`.qoder/agents/*.md` 和 `.qoder/spec-first/state.json`。
- `spec-mcp-setup` 支持 Qoder local MCP config 与 user-scope gate。
- 更新 runtime catalog、README、README.zh-CN、context governance、instruction bootstrap 与 generated ignore policy。
- 增加 Qoder unit/smoke/release packaging 覆盖。

### Out Of Scope

- 不交付 Qoder plugin。
- 不默认安装 Qoder hooks。
- 不投影 `.qoder/rules/**`。
- 不默认写用户级 `~/.qoder/settings.json`。
- 不承诺 Qoder 与 Claude/Codex/Kiro 功能完全 parity；P0 是 opt-in preview。
- 不手改 `.qoder/**` generated runtime 来绕过 source generator。

---

## Negative Acceptance

NA1. 不允许 blanket ignore `.qoder/`；必须精准区分 spec-first managed outputs 与 Qoder native/user-owned files。

NA2. 不允许把 `.qoder/rules/**` 当作 P0 source-of-truth 或由 `spec-first init --qoder` 自动生成。

NA3. 不允许 Qoder agents 默认拥有写权限、shell 权限或继续 dispatch `Agent` 权限。

NA4. 不允许 MCP setup 在无 `--user-scope` / `QODER_USER_SCOPE=1` 时写 `~/.qoder/settings.json`。

NA5. 不允许用 Qoder 官方文档本身替代 generated asset inspection、doctor facts、tests 或真实 CLI/IDE smoke。

NA6. 不允许普通 workflow prose 散落 `spec-*` / `spec-*` / Qoder command mapping；宿主入口对照集中在 README/runtime catalog/init guidance。

---

<!-- prd:section=evidence_assumptions -->
## Evidence And Assumptions

| claim | tag | source / owner | planning consequence |
| --- | --- | --- | --- |
| Qoder 支持 project commands、skills、subagents、MCP local/user/project scopes、hooks、`AGENTS.md` static memory。 | external-research | Qoder docs，2026-07-04 读取 | 计划可设计 Qoder adapter 和 P0 projection，但实施前需复核。 |
| Qoder subagent 工具名包含 `Read/Grep/Glob/Bash/Write/Edit/WebFetch/WebSearch/Agent`。 | external-research | Qoder subagent docs | 计划应默认 `Read/Grep/Glob`，避免 Kiro `read` 不足问题。 |
| `.qoder/settings.local.json` 是 local project-specific MCP config。 | external-research | Qoder MCP docs | P0 MCP 默认 local；user scope gate 必须存在。 |
| Qoder CLI/IDE 在本机未做真实 smoke。 | assumption | 本轮未运行 Qoder CLI | Completion Criteria 必须保留 degraded path，不能声称 parity。 |
| 复用现有 adapter/init/doctor/clean 模式能覆盖 Qoder。 | source-candidate | `src/cli/adapters/base.js`、`src/cli/adapters/kiro.js`、`src/cli/plugin.js` | plan 采用 extend 优先；实现期若 adapter contract 不足，再局部扩展。 |

---

## Planning Recheck

- 实施前重新打开 Qoder 官方 docs，确认 commands/skills/subagent/MCP/settings 文件路径和 frontmatter 字段没有变化。
- 实施期验证 Qoder subagent `Read/Grep/Glob` 是否足以完成现有 review/research agent 的代码检索；若不足，不得交付一批不可用 agent，必须调整 default tools 或降级 Qoder agent support。
- 实施期确认 Qoder CLI 是否能 reload project commands/skills/agents；若只能新会话加载，README 和 completion evidence 要明确。
- 实施期确认 `.qoder/settings.local.json` 与 `.qoder/settings.json` 的 merge/priority 是否与官方文档一致。

---

<!-- prd:section=outstanding_questions -->
## Outstanding Questions

| id | question | prd_write_target | owner_status | blocks_planning | closure_disposition | planning_would_invent_what | closure_state | recommended_default |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| OQ-01 | Qoder CLI/IDE 是否已安装并可执行真实 loader smoke？ | Acceptance Examples / Completion Criteria | not-owner-owned | no | implementation-only-how-pushdown | no | deferred | 实施期执行；不可用时记录 degraded smoke，而不是改变 P0 WHAT。 |
| OQ-02 | Qoder `Read/Grep/Glob` 在真实 subagent 中是否足以覆盖现有 review/research agent 的代码检索？ | R-05 / AE-03 / Planning Recheck | not-owner-owned | no | implementation-only-how-pushdown | no | deferred | 实施期必须验证；若失败则调整 tools 策略或降级 agent projection。 |
| OQ-03 | 是否要在 P1 投影 `.qoder/rules/**`？ | Scope Boundaries / R-16 | not-owner-owned | no | source-backed-non-what-assumption | no | deferred | P0 明确不做；未来需新 PRD/plan，参考 https://docs.qoder.com/en/cli/memory.md。 |
| OQ-04 | 是否要在 P1 默认安装 Qoder hooks？ | Scope Boundaries / R-17 | not-owner-owned | no | source-backed-non-what-assumption | no | deferred | P0 明确不做；未来需独立副作用设计，参考 https://docs.qoder.com/en/cli/hooks.md。 |

---

## Owner Decision Trace

| question | owner_answer | chosen_answer | prd_write_target | consequence | closure_state |
| --- | --- | --- | --- | --- | --- |
| 用户要求“接下来，要支持 qoder，请思考需求、方案；写入需求文档后，再进入 spec-plan 生成正式计划文档”。 | 用户明确要求先需求后计划。 | 产出 Qoder host support PRD requirements，并继续生成正式计划。 | Summary / Requirements / Planning Recheck | 不进入 implementation；计划可消费本文档。 | closed |

---

<!-- prd:section=readiness_self_check -->
## Readiness Self-Check

write_mode: final-prd

clarification_evidence: source-proven-no-ask

preflight_sweep_closure: closed

decision_card_highest_risk_gap: Qoder 官方能力与 spec-first 投影边界存在外部文档依赖；真实 Qoder CLI/IDE smoke 与 agent tool 可用性仍需实施期验证。

decision_card_next_action: final-prd

decision_card_why_no_invention: 本文已固定 P0/P1 边界、requirements、acceptance、negative acceptance、source/runtime ownership 和验证上限；未确认的 Qoder loader/agent 行为进入 Planning Recheck 与实施期验证，不让 plan 自行发明 WHAT。

readiness_outcome: ready-for-planning

can_enter_spec_plan: yes

why_not: n/a。本文把产品/宿主边界收敛到 Qoder opt-in preview host support，剩余问题为实施期验证或 P1 范围选择，不阻塞正式计划。
