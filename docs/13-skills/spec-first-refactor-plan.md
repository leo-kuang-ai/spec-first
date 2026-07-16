# `spec-intake` + `using-spec-first`：历史提案、当前差距与候选计划

> **文档类型：historical-input + candidate plan。** 原文把 `spec-intake` 的多阶段设计、契约和“已完成”标记混在一起，但当前源码中不存在 `skills/spec-intake/`，当前 public route map 也没有它。因此本文不把该提案描述为现状、承诺或已授权实施；当前 source 优先。2026-07-16 的 source 快照与刷新规则见 [README.md](./README.md)。

## 文档状态

本页不是 active plan、已排期 backlog 或 route-map 的补充规则。它只保留“若 owner 重新提出独立 intake，必须先验证什么”的设计输入。当前 external issue/PR 仍按 `using-spec-first` 的即时意图路由；任何实施任务都必须先从 current source 重新建立需求、consumer 和授权。

## 当前结论

截至本次 source 核对：

- `using-spec-first` 是一个不写 artifact 的 entry governor；对非 Direct Lane 请求读取 public route map，选择**一个**入口后交出控制权。
- 当前 route map 对外部 issue/PR 按立即意图处理：bug/failure → `spec-debug`，未确定 WHAT → `spec-prd` 或 `spec-brainstorm`，diff/PR 风险 → `spec-code-review`，owner-approved work → `spec-work`。
- 当前没有 `spec-intake`、`spec-intake-brief.v1`、`spec-intake-notes.v1`、`out-of-scope-decision.v1` 的 source skill 或已注册 workflow contract。
- 当前 runtime 准备入口叫 `spec-runtime-setup`；`spec-mcp-setup` 不是兼容别名。

所以，任何“external inbound issue/PR 一定路由到 spec-intake”“Phase 1 已 report-only 支持 GitHub”或“已完成 provider mutation”的陈述都没有当前 source 证据，不能用于实现、测试或用户说明。

## 原始提案保留的有效洞见

外部 `ask-matt` 和 `triage` 仍提供值得考虑的设计输入：

1. **薄路由与持久状态分离。** 入口推荐不应偷偷维护 tracker 状态；可恢复的入站状态应在 owner 可见的 tracker/artifact 中。
2. **原始入站不是可执行工作。** 外部 issue/PR 可能需要查重、claim verification、补充信息或明确拒绝，不能只因出现文字就交给实现 agent。
3. **验证 claim 与 debug root cause 分离。** intake 可以确认报告是否成立；需要复杂根因调查时应交给 `spec-debug`。
4. **交接 brief 需要行为、边界、验收与证据。** 它不应变成带陈旧文件路径的第二份 implementation plan。
5. **副作用需要授权。** label/comment/close、checkout、写入项目知识库均需 preview、明确 owner 授权及真实 apply evidence。

这些是候选设计原则，不是本仓已采纳的 schema。

## 应先回答的问题（尚未授权实施）

在创建新的 `spec-intake` 之前，需先取得 Project owner 的明确答案；否则不应开始 package、CLI、runtime 或 tracker mutation 工作：

| 决策 | 为什么是前置条件 | 可接受输出 |
| --- | --- | --- |
| 是否存在真实 consumer 与重复出现的外部入站痛点？ | 避免为被宿主/既有流程覆盖的能力新建 workflow。 | 一个可回源的代表 issue/PR 样本和使用者。 |
| `spec-intake` 是 public workflow 还是仅一套 team 操作？ | 决定 route map、host projection 和治理成本。 | owner 明确的入口与非入口边界。 |
| Phase 1 的 provider/read-only scope 是什么？ | 不同 tracker/API/connector 的事实与权限差异很大。 | provider contract、read 权限、失败/降级行为。 |
| 哪些 mutation 是真的需要，谁批准？ | 环境权限不能代替 comment/label/close/知识写入授权。 | preview + confirmation + receipt 的 ownership。 |
| 输入 brief 的 consumer 是谁、需要哪些确定性字段？ | 防止创建无人消费的 schema 或重复 plan。 | consumer contract、freshness/limitation/invalidation 要求。 |
| 被拒绝 enhancement 是否值得成为 durable knowledge？ | `wontfix` 评论不自动成为可复用项目知识。 | promotion 条件、owner、失效条件和存放位置。 |

## 候选的最小落地顺序

以下是**供 owner 采纳后使用**的最小计划，而不是待执行任务清单。它遵循本仓的 Light contract、Explicit boundaries 与“gate exits, not thinking”。

### Phase A：证据与路由实验（零 mutation）

目标：验证独立 intake 是否有真实收益，而不是只因外部 Skills 有 `triage` 就复制。

- 选取少量真实、已脱敏的外部 issue/PR 样本；记录他们在当前 `spec-debug`/`spec-prd`/`spec-code-review`/`spec-work` 路径中的摩擦。
- 写一份 read-only research artifact，区分 provider facts、LLM recommendation、owner decisions 和未知项。
- 只在样本显示“即时意图路由不足”时，提出一个候选 route；否则记录 `defer`/`retire` 结论。

**退出证据：** source refs、样本 limitations、明确 consumer 和可证伪的 success measure。没有这些，不进入 package 设计。

### Phase B：最小 report-only skill（若 Phase A 证实需要）

目标：只读地把一条外部请求整理成建议，而不改变 tracker 或 working tree。

- 新建 source-owned `skills/spec-intake/`，明确 trigger、非目标和 consumer；同步 dual-host governance、公开入口表、README 和最小 contract tests。
- provider 层只输出带 provenance/freshness/limitations 的 facts；不能把 `gh` 不存在或 connector 未加载当作 provider 不可用的证明。
- 输出建议 category/state、查重/已拒绝发现、claim verification 状态、下一步与 copy-ready manual action；不发 comment、不改 label、不 close、不 checkout PR branch、不写源码。
- 对用于 handoff 的任何 artifact 标出 advisory/confirmed/degraded，不把检查通过写成语义或现场 outcome。

**退出证据：** route fixture、行为例、source-level contract tests、fresh-source review；并明确 report-only 的未覆盖 mutation 边界。

### Phase C：受控 mutation（仅在用户另行授权后）

目标：只为已证实的高价值操作增加 preview-first apply。

- 每种副作用（comment、label、close、checkout、知识写入）单独列出 preview、authorization、apply receipt、retry/partial failure 和回滚/人工修复边界。
- owner 对每次 mutation plan 的确认是必需的；CLI/MCP 环境权限不是确认。
- checkouts 还须检查 target repo、dirty worktree 与隔离策略；无法安全处理就回到 read-only diff/view。
- 只有可回源、已验证、可复用且带 invalidation condition 的拒绝理由才可进入 durable knowledge。

**退出证据：** 每个 mutation 的可观察 receipt；没有 receipt 时只能声称 preview 或 degraded manual action。

## 明确非目标

- 不把 `using-spec-first` 变成状态机、tracker client 或多 workflow 自动编排器。
- 不用 intake 接管当前会话里直接报告的本地 bug；它仍按当前路由进入 `spec-debug`。
- 不让 intake 修代码或替代 root-cause diagnosis。
- 不因输入来自 issue/PR 就绕过 source/runtime、handoff、verification 或 knowledge-promotion gate。
- 不把 `docs/solutions/`、未来的 out-of-scope 记录和普通 tracker 评论混成同一权威层。

## 采用前的验证清单

| 要求 | 需要的证据 |
| --- | --- |
| 新入口真的有 consumer | 真实样本、owner 认可的使用场景、与现有 routes 的比较。 |
| 路由不会劫持正常工作 | `using-spec-first` 的正反例 route fixtures，覆盖本地 bug、外部 bug、未定需求、PR diff、已批准实现。 |
| 只读事实不会伪装为结论 | provider fact schema 带 provenance/freshness/limitations；fresh-source review 验证措辞。 |
| mutation 有授权与可核查结果 | preview、明确确认、apply receipt、失败/降级路径。 |
| brief 能被下游消费 | consumer contract、字段所有权、过期/失效处理和非重复 plan 边界。 |
| 多宿主语义诚实 | source-first projection 检查；无法强制处标记 lossy/degraded，而非假称 feature parity。 |

## 当前权威来源

- 入口：[`skills/using-spec-first/SKILL.md`](../../skills/using-spec-first/SKILL.md) 及其 [`public-route-map.md`](../../skills/using-spec-first/references/public-route-map.md)。
- 项目演化与 authority：[`docs/10-prompt/结构化项目角色契约.md`](../10-prompt/结构化项目角色契约.md)。
- 外部参考：[`skills/engineering/triage/SKILL.md`](../../../skills/skills/engineering/triage/SKILL.md) 与 [`ask-matt/SKILL.md`](../../../skills/skills/engineering/ask-matt/SKILL.md)。

在 owner 选择 Phase A 之前，本页仅是 historical/candidate input，不应被任何实施任务当作已批准 spec。若 Phase A 证明当前即时意图路由已经足够，应记录 `defer` 或 `retire`，而不是把候选 Phase B/C 自动转成工作项。
