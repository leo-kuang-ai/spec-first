---
title: "using-spec-first + runtime setup 姿态重构目标架构"
type: refactor
status: completed
date: 2026-06-25
spec_id: 2026-06-25-spec-first-refactor
completed_at: 2026-06-29
completion_evidence:
  - "Phase 0 已落地:删除独立 external issue/PR 状态机入口;skills/spec-intake 不存在;无 spec:intake/\spec-intake 入口;无 tracker mutation 实现"
  - "Phase 1 已落地:using-spec-first/SKILL.md:135 含 ### External Issue / PR Inputs 段(bug→debug/enhancement→prd/PR→code-review/execution-ready→work);bootstrap 含 external issue/PR input-surface boundary;routing-cases.json 14 cases 含 external/issue/PR/tracker 相关"
  - "Phase 2 已落地:spec-mcp-setup/SKILL.md:50 含 Explore -> Present -> Decide -> Write posture;config-template.yaml 含 verification_profile_path consumer map"
  - "验证:npx jest using-spec-first-contracts spec-dispatch-boundary-contracts 17 测试全绿"
---

> 参考蓝本：`skills/skills/engineering/ask-matt` 的 flow map、`skills/skills/engineering/triage` 的 verify-before-work / needs-info / durable handoff 思想，以及 `skills/skills/engineering/setup-matt-pocock-skills` 的 repo-local setup posture。
> 适配目标：`spec-first` 的 spec-driven workflow harness，而不是 issue tracker triage product。

## 0. 结论

本方案不新增独立的外部 issue/PR 状态机入口，也不实现新的 tracker category/state、label/comment/close 自动化或专用 brief/notes schema。

当前 `spec-first` 的项目定位是 **AI Coding Harness**：围绕 `Codebase -> Spec -> Plan -> Tasks -> Code -> Review -> Knowledge` 提供可治理、可验证、可复用、可沉淀的工程闭环。外部 issue/PR 是输入来源，不应成为新的核心 workflow 节点。

目标收敛为两条线：

```text
using-spec-first
  Entry Governor
  判断当前用户请求进入哪条既有路径
  不持有 issue 状态，不写 artifact，不执行 debug/work/review

spec-mcp-setup / future runtime setup
  Runtime Readiness Layer
  准备工具、provider、verification profile、generated runtime freshness 等 deterministic facts
  不持有 issue/PR 语义状态，不决定请求是否接收、拒绝或实现
```

外部 issue/PR 按真实意图直接分流到既有 workflow：

- 外部 bug、复现失败、异常行为：`spec-debug` / `spec-debug`。
- 外部 enhancement、需求不清、产品定义不足：`spec-prd` / `spec-prd` 或 `spec-brainstorm` / `spec-brainstorm`。
- 外部 PR 的代码质量、风险、diff 审查：`spec-code-review` / `spec-code-review`。
- 已经整理成可执行任务、plan、task pack 或明确 brief：`spec-work` / `spec-work`。
- 可复用的拒绝理由或边界知识：完成验证后进入 `spec-compound` / `spec-compound` 或项目 standards / knowledge 体系。

## 1. 设计依据

### ask-matt 的可迁移思想

`ask-matt` 的价值不是 `disable-model-invocation: true`，而是低认知成本的 workflow topology：

- **main flow**：idea -> ship；
- **side paths**：调试、学习、代码健康、跨会话交接不挤进主干；
- **context hygiene**：何时保持同一上下文、何时 handoff、何时 compact，是路由的一部分；
- **on-ramp 心智**：外部输入先被整理成可执行上下文，再进入主链路。

对 `spec-first` 的落点：`using-spec-first` 应表达主链路和 side paths，让模型与用户知道“这件事该走哪条既有路”。外部输入不需要独立入口；只要路由规则能按 intent 分流即可。

### triage 的可迁移思想

`triage` 可吸收的是方法，不是产品面：

- bug 类输入先 verify claim，再决定 debug、needs-info 或不处理；
- enhancement 类输入需要先澄清 WHAT，不应直接进入实现；
- 交给 agent 的 work brief 应重行为、验收、边界，而不是行号和微观步骤；
- prior notes / rejected rationale 有复用价值，但应作为 knowledge 或 standards evidence，而不是 active workflow state。

不迁移的部分：

- 不新增 issue tracker category/state lifecycle；
- 不新增 label/comment/close/PR checkout provider mutation；
- 不把外部 PR discovery、label mapping、tracker policy 做成核心 runtime contract；
- 不新增专门的 external issue/PR public workflow。

### setup-matt-pocock-skills 的可迁移思想

`setup-matt-pocock-skills` 的价值不是具体的 `docs/agents/*` 文件名，而是 setup 的交互与消费边界：

- **Explore before deciding**：先读 `git remote`、host instruction、已有 repo docs/config，再判断默认值；
- **Present before write**：把已发现和缺失项展示给 owner，说明每个选择会影响哪些 workflow；
- **One decision at a time**：只有真正需要人类选择的项目约定逐项确认，不把所有选项一次性倾倒给用户；
- **Repo-local conventions as consumer input**：写出的配置/说明必须明确后续 skill 如何消费；
- **Missing config is not automatically a blocker**：没有配置时可以使用安全默认或降级，但不能把默认值说成 repo truth。

对 `spec-first` 的含义：

- `spec-mcp-setup` / future `spec-runtime-setup` 负责 runtime/tool readiness 与 setup-owned facts；
- team-shared workflow convention 应落在 source-tracked artifact；`.spec-first/config.local.yaml` 是 local override，不能作为团队共享真相源；
- setup 脚本只产 deterministic facts；是否足以进入 debug/work/review/plan 仍由 workflow LLM 判断；
- issue tracker policy、label mapping、external PR request-surface policy 不进入 runtime setup facts。

### 业界实践校准

外部实践的共同点：

- Anthropic 的 workflow/agent 分法强调：能用可组合 workflow 解决时，不要过早制造复杂 agent 自主性。
- OpenAI Agents SDK 的 handoff/guardrails/tracing 思路强调：移交流程要有明确输入、输出与可观测记录。
- LangGraph/Temporal 等 durable workflow 实践强调：长流程状态要可持久、可恢复，human-in-the-loop 是一等控制点。
- GitHub issue forms / label triage / Bugzilla bug writing 这类实践强调：bug report 必须有可复现步骤、expected/actual、环境与后续分流状态。

对 `spec-first` 的含义：

- 路由应轻，但边界要硬；
- 外部 issue/PR 内容是 untrusted input，不是 confirmed truth；
- `spec-work` 的输入合同仍来自 plan、task pack、spec、明确 brief 或当前用户请求，不来自 tracker 状态；
- 更重要的是让既有 workflow 的入口、证据、handoff 与验证变清晰，而不是增加一个新入口面。

## 2. 目标拓扑

```text
Main flow: idea -> ship
  spec-ideate / spec-brainstorm
    -> spec-prd
    -> spec-plan
    -> spec-write-tasks (optional derived layer)
    -> spec-work

External inputs route by intent
  external bug / reproduction / failure
    -> spec-debug
  external enhancement / unclear WHAT
    -> spec-prd or spec-brainstorm
  external PR quality / implementation risk
    -> spec-code-review
  execution-ready brief / task / plan
    -> spec-work

Side paths
  current failure / local reproduction / root cause -> spec-debug
  requirements / plan / task doc critique -> spec-doc-review
  code / diff / PR quality review -> spec-code-review
  reusable learning -> spec-compound / spec-compound-refresh
  runtime/setup/readiness -> spec-mcp-setup / spec-first update

Readiness layer
  spec-mcp-setup
    -> .spec-first/config/tool-facts.json
    -> .spec-first/config/runtime-capabilities.json
    -> .spec-first/workspace/scenario-fingerprint-setup.json
    -> provider-readiness.v2 facts
    -> optional verification_profile_path local alias
```

边界：

- `spec-write-tasks` 产出的任务是内部派生执行输入，直接进入 `spec-work` / `spec-work`，不经过外部入站分流。
- 用户当前会话里报“这里坏了，帮我修”默认是 `spec-debug` 或 `spec-work`，不是 tracker 分流问题。
- 外部 issue/PR 的 body、comments、diff、reporter 命令都是 `provider_untrusted` 或 `user-provided` 输入；下游 workflow 必须用当前 source/test/log evidence 确认。
- `spec-mcp-setup` 的 setup facts 可帮助下游了解工具/verification/provider readiness，但不能成为 issue/PR category、scope、accept/reject 或 implementation truth。
- 如果未来目标用户明确需要高频维护外部 tracker，再把它作为 optional extension / plugin 重新立项；不进入当前核心方案。

## 3. using-spec-first 目标架构

### 3.1 职责

`using-spec-first` 是入口治理层：

| 项 | 目标 |
| --- | --- |
| 对象 | 当前用户请求 |
| 决策 | public workflow / standalone skill / direct answer / normal execution |
| 输出 | 一个入口建议 + 一个理由，或直接执行/直接答 |
| 不做 | 不生成 plan/task/review artifact，不维护 issue 状态，不跑 provider mutation |
| 下游 | `spec-*` / `spec-*` workflows、standalone `spec-write-tasks` |

### 3.2 主面应保留什么

主面不应追求固定 80 或 100 行。目标是**入口治理语义清晰，runtime-safe anchors 不丢**。

建议保留：

- Contract Summary；
- main flow / external-input-by-intent / side paths 拓扑；
- Routing Priority；
- compact Route Map；
- Source/runtime boundary stub；
- scope guard stub；
- dispatch/host boundary stub；
- hard rules stub；
- reference index。

长解释下沉到 references，但 reference index 不能完全删除。入口治理依赖“什么时候读哪个 reference”，没有索引会降低可维护性。

### 3.3 Route Map 调整

不新增 external issue/PR 专用入口。`using-spec-first` 只需在 route map 或 routing prose 中明确：

| External input shape | Route |
| --- | --- |
| issue 描述的是 failure、bug、测试失败、异常行为 | `spec-debug` / `spec-debug` |
| issue 描述的是新需求、改进、产品问题，WHAT 未清 | `spec-prd` / `spec-prd` 或 `spec-brainstorm` / `spec-brainstorm` |
| PR 需要审查 diff 质量、风险、测试缺口 | `spec-code-review` / `spec-code-review` |
| issue/PR 已有明确 plan、task pack、执行 brief 或 owner 指令 | `spec-work` / `spec-work` |

同步面仅在现有入口文案不足时触发：

- `skills/using-spec-first/SKILL.md` route prose；
- `skills/using-spec-first/evals/routing-cases.json` 中的 intent-by-external-input 回归用例；
- README / README.zh-CN 只有在用户手册当前误导“外部 issue/PR 有独立入口”时才更新；
- 不新增 command template、public workflow map entry、dual-host governance entry 或 entrypoint spelling 测试。

### 3.4 不变硬边界

- `using-spec-first` 不是 command-backed workflow。
- 不把 unclear request 全部导向 brainstorm。
- 不把 lightweight Q&A 变成 workflow traffic。
- 不把 internal helper 暴露成入口。
- 不因 route match 自动运行 state-changing command。
- Codex dispatch 仍需要显式 subagent/persona/parallel 授权。
- 外部 issue/PR 不因来源是 tracker 就获得更高 authority；仍需 current source/test/log evidence。

## 4. runtime setup / project convention integration

目标：借鉴 `setup-matt-pocock-skills` 的 setup posture，但不把 runtime setup 扩成 workflow convention hub。

`spec-mcp-setup` / future `spec-runtime-setup` 可补：

- 在 SKILL 主面或 reference 中明确 `Explore -> Present -> Decide -> Write` posture：先探索 host、target repo、generated runtime manifest、existing setup facts、`config.local.yaml`、verification profile、provider artifacts，再输出 install/init preview；
- 把当前 `.spec-first/config.local.yaml` 模板补成真实 consumer map：当前可消费 `verification_profile_path: .spec-first/verification-profile.local.json`；其他 output/provider 字段若未实现只能保持 commented reserved hints；
- 输出形状补 `Project conventions` 或 `Local overrides` 段，说明哪些 facts 是 setup-owned、哪些 local-only、哪些只是 future hints；
- setup completion 文案说明：修改 local config 后跑 `spec-mcp-setup --refresh-facts`；generated runtime stale 用 `spec-first init`；Graphify 已有 artifact 默认 verify，显式刷新用 `--only graphify --refresh`；
- 若新增 project-conventions facts，只记录确定性存在性，例如 `CONTEXT.md`、`CONTEXT-MAP.md`、`docs/adr/`、team standards index 是否存在；不得让脚本判断术语是否正确、ADR 是否适用、某个 issue 是否该接收或拒绝。

不纳入 `spec-mcp-setup`：

- issue tracker selection、label mapping、external PR request-surface policy 的 team-shared truth；
- issue/PR category、state、scope、accept/reject 的语义判断；
- rejected decision owner；
- Graphify/CodeGraph/other provider 的语义结论。

若后续需要 first-class project workflow conventions，优先设计独立 source-tracked artifact；不要把它塞进 gitignored `.spec-first/config.local.yaml`。

## 5. 变更清单

### Phase 0: 方案收敛

- 删除独立 external issue/PR 状态机入口的实现计划；
- 删除专用 provider facts、brief、notes、out-of-scope decision schema；
- 删除 GitHub tracker mutation / PR checkout / external PR discovery 的实现计划；
- 将可吸收思想收敛为 existing workflow routing、untrusted input boundary、verify-before-work 和 knowledge reuse；
- 保留 using-spec-first 入口治理与 runtime setup posture 作为当前方案主轴。

### Phase 1: using-spec-first 路由澄清

只在当前 `using-spec-first` 文案或 eval 对外部输入分流不清楚时修改：

- 补外部 issue/PR 按 intent 分流的 route prose；
- 增加 routing eval：external bug -> debug，external enhancement -> prd/brainstorm，external PR review -> code-review，execution-ready issue brief -> work；
- 验证不新增 public workflow entrypoint，不暴露 internal helper，不把 tracker 来源变成 authority。

### Phase 2: runtime setup 姿态补强

目标：

- 明确 `Explore -> Present -> Decide -> Write` setup posture；
- 区分 setup-owned facts、local-only overrides、future reserved hints；
- 收敛 `.spec-first/config.local.yaml` 的真实 consumer map；
- 保持 setup scripts 只产 deterministic facts，不做语义路由或项目决策。

验证：

- `npm run test:mcp-setup` 或更窄等价测试；
- shell/PowerShell parity 仍通过；
- `config-template.yaml` contract tests 仍通过；
- generated runtime mirrors 不手改，需要投影时使用 `spec-first init`。

## 6. 验收标准

### using-spec-first

- 外部 bug/failure/stack trace 路由到 `spec-debug` / `spec-debug`。
- 外部 enhancement 或 WHAT 不清的 request 路由到 `spec-prd` / `spec-prd` 或 `spec-brainstorm` / `spec-brainstorm`。
- 外部 PR diff 质量审查路由到 `spec-code-review` / `spec-code-review`。
- execution-ready input 仍路由到 `spec-work` / `spec-work`。
- settled plan split 仍是 standalone `spec-write-tasks`。
- lightweight request 仍可 direct answer。
- no default brainstorm。
- no hidden helper exposure。
- no state-changing command from entry governor。
- 不新增 public workflow entrypoint、command template、dual-host governance entry 或 entrypoint spelling case。

### runtime setup / project convention

- setup facts 是 optional advisory input，不是任何 workflow 的 semantic truth。
- `.spec-first/config.local.yaml` 不被用作 team-shared tracker/label policy source。
- project-conventions facts 只记录确定性存在性，不做 domain/issue/out-of-scope 语义判断。
- Phase 2 若修改 `spec-mcp-setup`，必须同步 `config-template.yaml` contract tests、`mcp-setup` shell/PowerShell parity tests、`npm run test:mcp-setup` 或更窄等价验证。

## 7. Non-Goals

- 不实现新的 external issue/PR public workflow。
- 不新增 tracker label/comment/close mutation。
- 不新增 provider-specific `gh` tracker lifecycle。
- 不新增专用 external issue/PR brief 或 notes schema。
- 不新增 first-class out-of-scope KB state machine。
- 不让 runtime setup 承担 issue/PR 接收、拒绝、分类或优先级判断。
