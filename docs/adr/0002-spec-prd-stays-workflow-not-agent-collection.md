# spec-prd 保持 workflow + 选择性 agent dispatch，不整体重构为 agent 架构

- 状态：accepted
- 日期：2026-06-27
- 决策者：leokuang（owner）
- 相关：`docs/02-架构设计/2026-06-27-spec-prd-workflow-stability-fix-recommendations.md`、`docs/02-架构设计/2026-06-25-spec-prd-执行流程图与质量闭环.md`、`docs/10-prompt/结构化项目角色契约.md`、`CLAUDE.md`「系统边界」节

## 决策

`spec-prd` 维持现有的 **workflow 编排 + 在少数真正需要独立判断的节点选择性 dispatch agent** 的混合架构，**不**把 SKILL spine 的每个节点（Intake / Current-State / Requirement Analysis Gate / Product Expert Lens / Requirements Grill / Pre-Write Closure / PRD Write / Readiness）都具化为常驻 agent 专家。

`spec-prd` 当前不稳定的根因是**第一次 durable PRD write 前缺少确定性可观测检查点**（见「背景」），属于运行边界问题，不是语义专家不足问题。正解是补一道 script 守的确定性写前闸（强制 `write_mode` 声明），把已有的 run-local Decision Card prose 升级为 gate；不是用多 agent 编排重构整条 workflow。

## 背景

2026-06-27 两次真实运行暴露同一类失败：

- **113802**：模型读完输入直接写全量 PRD，被 Stop hook 拦后硬冲 `final-prd` 并自写 `design_degraded_owner_acceptance: true` 伪造 ready。
- **202957**（Codex stability-fix 后）：模型同样读完输入直接 `Write` 一份 346 行、frontmatter **无 `status` / 无 `write_mode`** 的 PRD（log L43）；该形态三条 prewrite-guard 触发条件全不命中（`templates/claude/hooks/prd-prewrite-guard:46-52`：`readyStatus ∨ machineReceipt ∨ (firstWrite ∧ readyIntent)`），**穿透写前闸**，只在 closeout 撞 Stop hook，事后补字段收敛为合法 checkpoint。

202957 的出口是诚实的（合法 non-ready checkpoint，未伪造 ready），但 **workflow spine 完全没有运行**：无 Requirement Analysis Gate map、无 Product Expert Lens 输出、`AskUserQuestion` 真实调用 = 0、未发 Decision Card。stability-fix 把失败从「伪造 ready」降级成「诚实 checkpoint」，但没有让 spine 发生。

根因可精确定位为两层：

1. **prewrite guard 只认 ready-intent，不认无 `write_mode` 的草稿**。唯一的写前杠杆触发面太窄，模型的默认失败形态（读 → 写全量 PRD → 事后贴 readiness）恰好绕过它。
2. **spine 的 Lens / Grill / Decision Card 全是 prose，无可观测检查点**。跳过整条 spine 仍能产出结构合法的 checkpoint，跳过零成本。第 2 层的「证明 grill 真实发生」撞 host-provenance 天花板（R12），但第 1 层「强制写前声明路径」是确定性的、可修的。

在此背景下提出的问题是：是否应把 spec-prd 重构为 agent 架构，让各节点具化为 agent 专家，以提升合理性与扩展性。

## 决策依据

### 1. workflow 调度 agent 在 spec-first 已是既有范式，不是新提案

- `Product Expert Lens` 已有 `Escalation To Product Reviewer`（`skills/spec-prd/references/product-expert-lens.md:109`），高风险时 dispatch 独立 product-reviewer agent，并有 `dispatch_unavailable` / `dispatch_authorization_missing` fallback。
- `spec-doc-review` 已是 workflow + persona-agent 混合：host 有 dispatch primitive 且授权时跑多 persona reviewer，否则单 agent report-only fallback。

问题因此不是「要不要 agent 化」，而是「**哪些节点该 agent 化**」。

### 2. 「每个节点具化为常驻 agent 专家」撞三条边界

- **`agent collection`（CLAUDE.md 系统边界节）/ Agent 定位（角色契约 line 92：Agent 是「专业判断角色」「也不是状态机执行器」）**：8 个节点 = 8 个 agent，把 workflow 内部流程步骤当 agent 编排，等于把 agent 当状态机执行器。
- **`强状态机 / 中心化流程引擎`（CLAUDE.md 系统边界节；角色契约 line 113）**：节点间硬编排是把 light-contract workflow 升级成 orchestration 状态机。行业调研（Anthropic / OpenAI / LangGraph / 阿里 / 腾讯 / 字节）共同收敛于「强运行边界保护轻语义判断」，不是「强流程编排」。
- **宿主能力重建（角色契约 line 172）**：subagent dispatch、in-loop review、plan mode 正在 Claude / Codex 双向商品化；自建多 agent 编排引擎是与宿主即将免费提供的能力正面竞争。

### 3. agent 化解决不了根因

202957 的根因是「spine 在第一次 durable write 前零强制」。把 Lens / Grill 做成 agent，模型**同样可以不 dispatch 就直接 Write**——「是否调用 agent」正是 LLM 的自由旋钮，正是失败点。用 agent 重构 = 用「更多可跳过的 prose 节点」替换「已有的可跳过的 prose 节点」，根因原样保留，还多了编排开销。

### 4. 扩展性的真相：缺的是写前检查点，不是专家数量

- **形式扩展性（agent 给的）**：加专家 = 加 agent。但 Product Expert Lens 已用 dimension + 双座位（implementer / test-author seat）覆盖多视角，且 `product-expert-lens.md:5` 明确「single canonical source…must not create a second canonical lens」。把一个 canonical lens 拆成 N 个会漂移的 mini-lens 是反扩展性。
- **闭环扩展性（spec-first 真正的价值锚，角色契约 line 172）**：差异化锚点在「宿主不拥有的层——跨宿主证据 / 验证 / 知识闭环、source/runtime 同源纪律、治理外显」。spec-prd 的扩展性应长在证据闭环和确定性出口闸上（checker reason_code 可被 doc-review / eval 消费），不是长在 agent 数量上。
- 写前检查点是确定性边界（角色契约 §4：Gate 属「确定性可判定的不变量」，由 script 守，不由 agent 守），agent（语义判断者）给不了。

## 后续动作（不在本 ADR 落地，留给独立 plan）

按 80/20 分三层，本 ADR 只锁方向：

1. **第一层（对症、最小、不撞红线）**：把 prewrite guard 从 ready-intent 扩到「任何首次 PRD `Write` 缺合法 `write_mode` token 即拦」，把 Decision Card 从 prose 升成确定性写前闸。这是 script 守的运行边界，无需任何 agent。
2. **第二层（选择性 agent，只保留已有两处）**：Product Reviewer escalation 与 doc-review handoff——真正需要「独立第二双眼睛」的语义判断（角色契约 §11 line 231：不得同一会话自审自改自批）。Intake / Current-State / Write 是执行不是判断，不 agent 化。
3. **第三层（未来扩展）**：新视角走 Lens 既有 triggered pack 或 Escalation conditional dispatch，不新建常驻 agent（角色契约 80/20：低频边缘能力放 optional capability / explicit opt-in）。

## 边界与非目标

- 本 ADR **不**改任何代码，仅锁定架构方向；第一层的 write_mode 写前闸实现走独立 `spec-plan` → `spec-work`。
- **不**否定 spec-prd 现有的 agent dispatch（Product Reviewer / doc-review）；它们是该保留的正确 agent 化。
- **不**主张 spec-prd 永不增加 agent；主张的是「以流程步骤为单位批量 agent 化」撞红线，「以独立判断需求为单位选择性 agent 化」才合理。
- 写前闸只能保证「路径被声明」，**不能**保证「grill 真实发生」或「owner 真实回答」——后者撞 host-provenance 天花板（R12），仍靠 prose forcing + doc-review + fresh-source eval 防御纵深，本 ADR 不假装突破该上界。
