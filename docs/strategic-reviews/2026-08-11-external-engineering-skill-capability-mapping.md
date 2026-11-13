# 外部 Engineering Skills 与 spec-first 能力映射

**分析日期：** 2026-08-11
**外部来源：** `/Users/kuang/xiaobu/skills/skills/engineering`
**外部版本：** `mattpocock/skills@84fdeffd12f2ee307994d1eb6feb48173b6e0502`
**分析对象：** 外部 Engineering Skills 与当前 spec-first canonical Skills
**Artifact 类型：** advisory strategic review，不是实现完成证明或新 workflow contract

## 结论

外部 `engineering` 与当前 `spec-first` 的主开发链路大部分已经对应，但两者的组织思路不同：

- 外部 `engineering` 更像一套工程师个人工作流工具箱，部分 Skill 同时包含决策、任务追踪、并行执行和代码操作。
- `spec-first` 更强调 workflow owner 分离、artifact contract、source/runtime 边界、验证证据与 mutation authority。
- 当前最大的候选能力缺口不是实现、测试或 Review，而是：**在需求阶段，把一项超大需求垂直拆成多个可独立规划的功能需求闭环。** 这可以作为一个很薄的 `spec-decompose` 候选 owner，但是否正式新增仍应服从当前 Plan 的 field evidence 与 Build Gate，不能把本分析当成已经批准或实现。
- 外部的 tracker、claim、每票 worktree、默认 subagent 并行等机制，不应跟随需求拆分能力进入 `spec-decompose`。

## 核心研发链路对应

| 外部 Engineering Skill | 当前 spec-first 对应 | 覆盖程度 | 主要差异 |
| --- | --- | --- | --- |
| `ask-matt` | `using-spec-first` + public route map | 高 | 都负责入口路由；spec-first 更强调单一公共入口和无隐式写入权限。 |
| `grill-with-docs` | `spec-brainstorm` / `spec-prd` + `spec-compound` | 组合覆盖 | 外部把追问、文档和知识记录放在一起；spec-first 分离需求形成与 durable knowledge。 |
| `wayfinder` | `spec-brainstorm`、`spec-prd`、`spec-handoff` 部分覆盖；`spec-decompose` 是待验证候选 | 部分，存在候选缺口 | `wayfinder` 主要拆决策迷雾；spec-first 尚无独立 owner 负责“超大需求 → 多个需求级功能闭环”。 |
| `to-spec` | greenfield 使用 `spec-brainstorm`；brownfield 使用 `spec-prd` | 高 | spec-first 对 source refs、验收、范围、证据和 planning readiness 的约束更完整。 |
| `to-tickets` | `spec-write-tasks` | 高 | 都强调 vertical tracer bullets；spec-first 还提供 derived artifact、source hash、freshness、依赖和 execution waves。 |
| `implement` | `spec-work` | 高 | spec-first 对 intake、授权边界、验证证据、closeout 和 handoff 更严格。 |
| `tdd` | `spec-work` 中的 test-first execution direction | 能力内嵌 | 当前没有独立公共 `spec-tdd`；测试策略服务于实现，而不是形成第二个执行入口。 |
| `code-review` | `spec-code-review` | 高 | spec-first 默认 report-only，修复需要明确权限；finding 更强调源码和测试证据。 |
| `diagnosing-bugs` | `spec-debug` | 高 | 都是诊断闭环；spec-first 更明确区分诊断、修复授权和 confirmed evidence。 |
| 外部完整 hands-off 流程 | `spec-lfg` | 高，但显式启用 | spec-first 将 commit、push、PR、CI 等副作用限制在用户显式请求的完整流水线中。 |

两套主链可以概括为：

```text
外部 engineering
ask-matt
  -> grill-with-docs
  -> wayfinder（超大且模糊时）
  -> to-spec
  -> to-tickets
  -> implement / tdd
  -> code-review

spec-first
using-spec-first
  -> spec-brainstorm / spec-prd
  -> spec-decompose（候选，仅超大需求且通过 Build Gate 后）
  -> spec-plan
  -> spec-write-tasks
  -> spec-work
  -> spec-code-review
  -> spec-compound
```

## 辅助能力对应

| 外部 Engineering Skill | 当前 spec-first 对应 | 判断 |
| --- | --- | --- |
| `research` | 分布在 `spec-brainstorm`、`spec-prd`、`spec-plan` 的 research references；独立采用裁决用 `spec-pov` | 按 owner 分散覆盖，避免形成无边界的通用研究入口。 |
| `domain-modeling` | `spec-brainstorm` / `spec-prd` 的领域语言建模；`CONCEPTS.md` + `spec-compound` 负责沉淀 | 组合覆盖。 |
| `codebase-design` | `spec-plan` 的架构/KTD 分析 + `spec-simplify-code` | 部分覆盖；当前没有专门维护 deep-module design vocabulary 的独立 Skill。 |
| `improve-codebase-architecture` | `spec-ideate` → `spec-plan` → `spec-simplify-code` | 组合覆盖；没有外部那种一体化 HTML architecture survey。 |
| `prototype` | `spec-brainstorm` / `spec-plan` 决策，`spec-work` 实施；已有页面打磨用 `spec-polish` | 部分覆盖；没有专门的 throwaway prototype owner。 |
| `triage` | `spec-sweep` 收集反馈，再路由到 `spec-debug`、`spec-prd`、`spec-work` 或 `spec-code-review` | 组合覆盖；spec-first 不建立统一 issue 状态机。 |
| `setup-matt-pocock-skills` | `spec-runtime-setup` + `spec-first init` / `spec-first doctor` | 部分对应；spec-first 管理 harness/runtime，不管理通用 tracker 标签体系。 |
| `resolving-merge-conflicts` | `spec-work` 或 Direct Lane | 没有专用 Skill；属于局部空白，但目前没有充分证据表明需要产品化。 |
| `wizard` | `spec-runtime-setup` 只覆盖 harness/runtime setup | 部分覆盖；外部第三方服务的人工配置引导没有完整对应。 |
| research 后的知识记录 | `spec-compound` / `spec-compound-refresh` | spec-first 更强调 verified、可回源、可复用并带失效条件的知识。 |

## 关键边界判断

### 1. `wayfinder` 不等于候选 `spec-decompose`

外部 `wayfinder` 主要处理：

- Destination 是什么；
- 哪些问题仍然模糊；
- 哪些问题已经清晰；
- 下一步应该优先解决哪个 sharp question；
- 决策之间有什么依赖。

它产出的更接近“决策地图”，不是多个可以独立进入开发流程的需求合同。

候选 `spec-decompose` 应只处理：

```text
一个 program-scale 超大需求
  -> decomposition index
  -> 多个 child requirement seeds / Product Contracts
  -> 每个子需求分别进入 spec-brainstorm 或 spec-prd
```

每个垂直功能切片至少应具备：

- 明确 actor；
- 明确 trigger；
- 独立业务结果；
- 独立 scope / non-goals；
- 独立验收条件；
- 可独立进入 `spec-plan`；
- 可独立排期、验证和发布，或者明确声明业务依赖。

不应按技术层水平拆分为：

```text
前端任务
后端任务
数据库任务
测试任务
文档任务
```

### 2. 需求垂直拆分与任务垂直拆分是两次不同拆分

外部 `to-tickets` 的 tracer bullet 主要发生在执行阶段，对应当前的 `spec-write-tasks`。

但“需求阶段按功能模块垂直拆分”应更早发生：

```text
超大业务目标
  -> 第一次垂直拆分：多个需求级功能闭环
  -> 每个功能闭环形成 PRD / Product Contract
  -> 第二次垂直拆分：每份 PRD 形成可执行 Task Pack
```

因此，不能只依靠 `spec-write-tasks` 解决超大需求问题。到了任务阶段才发现一份 PRD 实际包含多个产品能力，拆分时机已经偏晚。

### 3. 不应照搬外部的执行状态机

值得吸收的实践包括：

- Destination；
- fog 与 sharp question 分离；
- decision frontier；
- 不提前拆分尚未理解的区域；
- Decisions-so-far / Not-yet-specified / Out-of-scope；
- vertical tracer bullets；
- real blocking edges；
- 大型重构中的 expand-contract。

不建议复制的机制包括：

- tracker 成为 canonical source；
- claim-by-assignment 状态机；
- 默认启动并行 subagents；
- 每张 ticket 建立 worktree；
- 中央 orchestrator；
- 让需求拆分 Skill 同时执行代码。

这些机制属于宿主协调能力或执行阶段机制，不是需求拆分的职责。

## 能力判断汇总

- **已高度覆盖：** 入口路由、需求形成、计划、任务拆分、实现、测试、Debug、Review、知识沉淀、完整交付流水线。
- **通过多个 owner 组合覆盖：** 研究、领域建模、架构改进、反馈分诊、原型决策。
- **核心候选缺口：** 超大需求在需求阶段的垂直功能闭环拆分；是否 Build 仍需 current-source Plan 规定的真实 consumer、重复 field failure 和 existing-owner baseline 证据。
- **次要缺口：** throwaway prototype、deep-module design vocabulary、merge-conflict wizard、第三方 setup wizard。
- **不应引入的能力：** 需求 Skill 内的 tracker、claim、worktree、subagent orchestration 和代码执行。

综合判断：可以借鉴外部 `wayfinder + to-spec + to-tickets` 的思想，但不能直接复制其中任何一个 Skill。若 field evidence 证明现有 owner 无法稳定完成 requirements-level decomposition，再新增职责很薄的 `spec-decompose`，只填补“一项超大需求 → 多个 Product Contract”这一层。

## Source、判断与限制

### Source-of-truth

- 外部事实来源：`/Users/kuang/xiaobu/skills/skills/engineering/README.md` 及其各 Skill 的 `SKILL.md`。
- spec-first 事实来源：`skills/*/SKILL.md`、`skills/using-spec-first/references/public-route-map.md`、`docs/10-prompt/结构化项目角色契约.md` 与当前相关 Plan。
- `.claude/`、`.codex/`、`.agents/skills/` 等 generated runtime mirror 不作为本次能力判断的 source。

### Script-owned facts 与 LLM-owned judgment

- 文件存在、Skill 名称、description、source revision 和当前 Plan 文本属于可回源事实。
- “高度对应”“组合覆盖”“候选缺口”“是否值得新增 Skill”属于语义判断，不是脚本可确定结论。

### 限制

- 本文是基于当前源码的静态能力映射，未运行两套 Skill 的同题 field evaluation。
- 本文没有创建、注册或实现 `spec-decompose`，也没有修改公共路由。
- 本文不能替代 `docs/plans/2026-07-28-002-feat-spec-decompose-vertical-closed-loop-plan.md` 的 Build Gate；两者冲突时，以当前有效 Plan 和项目角色契约为准。
- prototype、deep-module design、merge-conflict 与 wizard 等局部空白尚无 confirmed consumer，不应因本次 inventory 自动进入开发。
