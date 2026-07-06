# spec-prd workflow 稳定性修复建议

> 日期：2026-06-27
> 状态：recommendation
> 范围：`skills/spec-prd/SKILL.md`、`templates/claude/hooks/prd-prewrite-guard`、`templates/claude/hooks/prd-readiness-guard`、`skills/spec-prd/scripts/check-prd-artifact.js`、`skills/spec-prd/scripts/finalize-prd-artifact.js`、相关 unit tests
> 证据：基于 `docs/02-架构设计/2026-06-25-spec-prd-执行流程图与质量闭环.md`、当前 source 直接读取、日志 `/Users/kuang/xiaobu/hsglobal/2026-06-26-232726-local-command-caveatcaveat-the-messages-below.txt` 与 `/Users/kuang/xiaobu/hsglobal/2026-06-27-113802-command-messagespecprdcommand-message.txt`

---

## 1. 结论

`spec-prd` 的总体实现方向正确：Phase 4 checker/finalize 负责 artifact 出口事实，Claude `PreToolUse` guard 负责拦截直接写 ready/final PRD 的控制流违规，Requirements Grill、owner answer fidelity、readiness outcome 仍由 LLM 做语义判断。

当前 workflow 不稳定的主因不是 checker/finalize 方向错误，而是两类问题叠加：

1. `prd-readiness-guard` 的 `source_inputs` 解析存在确定性 bug，导致合法 checkpoint 被误报 `input_scan_degraded`。
2. `prd-prewrite-guard` 拦住直接写 ready/final PRD 后，模型容易进入“修 reason_code 格式”的循环，而不是回到 Requirements Grill。

修复应优先解决 deterministic hook bug 和可复现测试缺口，再优化 guard 文案与 checkpoint 恢复性信号。不要把“是否真的 grill 充分”“owner 是否真实回答”“owner 答复是否被忠实记录”脚本化成 checker 判定；这些仍属于 host-provenance 天花板下的语义判断。

---

## 2. Goals / Non-goals

### Goals

- 修复 `source_inputs` frontmatter 解析越界，消除假的 `input_scan_degraded`。
- 用 unit test 固化日志中的失败形态。
- 优化 hook 阻断文案，让模型回到 Requirements Grill，而不是只追 reason_code。
- 保持 checkpoint closeout 与 ready finalization 的正确分离。
- 记录后续可选增强，避免一次性扩大 runtime contract。

### Non-goals

- 不把 Requirements Grill 的充分性、owner 真伪、Figma 是否真读过交给 checker 判定。
- 不新增复杂状态机、transcript semantic comparator、LLM-judge hook 或 per-question 审批流。
- 不手改 `.claude/`、`.codex/`、`.agents/skills/` generated runtime mirror。
- 不把合法 checkpoint 强制升级为 ready，也不让 checkpoint 绕过未闭合 load-bearing OQ。

---

## 3. P0：修复 `source_inputs` 解析越界

### 问题

`templates/claude/hooks/prd-readiness-guard` 的 `extractSourceInputs()` 从 `source_inputs:` 或 `prd_input:` 往下扫描列表项，只在遇到下一个 `key:` 行时停止。若 `source_inputs` 是 frontmatter 最后一项，其后紧跟 `---` 和正文，`---` 不匹配 `key:`，正文里的 bullet 会被误读成 input path。

日志中真实症状：

- `source_inputs` 位于 frontmatter 最后。
- 正文包含 `- 目标：...`、`- **NG-1**：...` 等 bullet。
- Stop hook 将正文 bullet 当成文件路径传给 finalize。
- `resolveInputFile` 对这些“路径”解析失败，触发假的 `input_scan_degraded`。

### 修复建议

优先将 `extractSourceInputs()` 改为 frontmatter-bounded parser：

1. 如果文档首行不是 `---`，返回空输入列表。
2. 找到第二个 `---` 作为 frontmatter 结束边界。
3. 只在 frontmatter 内扫描 `source_inputs:` / `prd_input:`。
4. 遇到下一个 frontmatter key 或 frontmatter end 即停止。
5. 继续支持现有轻量格式：
   - `- path/to/input.md`
   - `- path: path/to/input.md`

不建议为 hook 引入完整 YAML parser。当前需求只是解析一个受控 frontmatter 列表，轻量 parser 更符合 hook runtime 预算与维护成本。

### 验证建议

新增 `tests/unit/prd-readiness-guard-hook.test.js` case：

- PRD artifact 路径：`docs/brainstorms/frontmatter-last-input-requirements.md`
- frontmatter 最后一项：

```yaml
source_inputs:
  - source_docs/input-a.md
---
```

- 正文包含普通 bullet：

```markdown
- 目标：展示市场页
- **NG-1**：不实现交易
```

断言：

- hook 派生 inputs 只包含真实 input 文件。
- 不出现 `input_scan_degraded`。
- 合法 checkpoint closeout 不被阻断。

---

## 4. P0：补齐 Stop hook 层测试缺口

当前 `spec-prd-finalize.test.js` 能证明合法 checkpoint 可豁免 input-side 降级，但它测试的是 finalize closeout 逻辑，不测试 Stop hook 的 input 抽取逻辑。

必须补的测试在 `prd-readiness-guard-hook.test.js`，因为真实 bug 发生在：

```text
PRD frontmatter -> prd-readiness-guard extractSourceInputs -> finalize --inputs
```

不是发生在：

```text
finalizePrd(prdPath, inputs)
```

测试重点应覆盖“hook 传给 finalize 的 inputs 是否正确”，而不是只覆盖 finalize 对 degraded input 的处理。

---

## 5. P1：优化 hook 阻断文案，降低格式修补循环

### 问题

日志显示，`prd-prewrite-guard` 拦住首次 ready/final write 后，模型开始围绕 checker reason codes 修字段和标题，而不是稳定回到 Requirements Grill。这说明 guard 已经卡住出口，但错误恢复路径不够明确。

### 优化建议

`prd-prewrite-guard` 的阻断消息应显式给出三条合法恢复路径：

1. 继续 Requirements Grill：问最高风险 load-bearing gap。
2. 写合法 recovery checkpoint：`write_mode: checkpoint-prd`、`can_enter_spec_plan: no`、`next_owner_question` 必须指向未闭合问题。
3. route-out：当 target anchor 缺失、wrong-stage 或 PRD 不增加 durable WHAT 价值。

建议补一句反模式提醒：

> Do not only downgrade ready fields to checkpoint to bypass the guard. A checkpoint is legal only when it preserves recoverable context while naming the next owner question or true large-input/headless recovery reason.

中文含义：不要只把 ready 字段改成 checkpoint 来绕过守卫。checkpoint 必须保留可恢复上下文，并点名下一道 owner 问题或真实的大输入/headless 恢复原因。

---

## 6. P1：澄清 closeout 与 finalize 的出口语义

`finalize-prd-artifact.js` 当前设计是正确的：

- `finalizable`：可以写 machine-owned ready receipt。
- `checkpoint-closeout`：允许本次 PRD 运行合法收口，但不是 ready。
- `blocked`：当前 artifact 既不能 ready，也不能 closeout。

建议将 Stop hook 输出也按这个三态解释，减少“checkpoint 也必须 finalize”的误解。

推荐文案方向：

```text
This checkpoint can close out this PRD run, but it is not ready for planning.
Do not hand off to spec-plan until finalize writes a current ready receipt.
```

如果 closeout 被阻断，则继续列 `closeout_blocking_reason_codes`，并说明这些才是需要当前修复的 blocker。

---

## 7. P1/P2：为 checkpoint 恢复性增加 advisory fact

合法 checkpoint 的最低可恢复性要求是：下次恢复时知道从哪个 load-bearing gap 继续 grill。因此 `next_owner_question` 很重要。

但不建议一开始把它加入 `BLOCKING_REASON_CODES`。原因：

- checkpoint 是 non-ready 出口，不应被过度 ceremony 化。
- `BLOCKING_REASON_CODES` 已有冻结约束，新增 hard blocker 需要更强证据。
- `next_owner_question` 的内容质量仍是语义判断，checker 最多判断在场性。

建议先加 advisory fact：

```text
checkpoint_next_owner_question_present: true | false
```

消费方式：

- readiness lens 和 closeout summary 必须提及该 fact。
- 若为 false，建议模型补 `next_owner_question`，但先不阻断 closeout。
- 观察真实运行后，再决定是否升级为 closeout blocker。

---

## 8. 不建议做的优化

### 不建议新增 LLM-judge hook

用另一个模型在 Stop hook 中判断“是否 grill 充分”会撞两个边界：

- 同一类模型自评不能成为 confirmed evidence。
- transcript semantic comparison 是语义判断，不是稳定 exit invariant。

### 不建议新增 discovery checker

“某个 load-bearing 问题没有被 surface”通常没有可靠文本底物。checker 只能看 artifact 中出现了什么，很难证明缺失了什么。把这类缺失做成 hard gate 容易制造假阳性和 ceremony。

### 不建议扩大 `BLOCKING_REASON_CODES`

当前更高价值的修复是：

- 修 hook parser。
- 补真实失败回归测试。
- 优化 guard 恢复路径文案。
- 用 doc-review / fresh-source eval 捕捉 shallow grill。

除非出现新的稳定可判定出口不变量，否则不要新增 blocker。

---

## 9. 推荐落地顺序

1. 修 `templates/claude/hooks/prd-readiness-guard` 的 frontmatter-bounded `source_inputs` 解析。
2. 给 `tests/unit/prd-readiness-guard-hook.test.js` 增加日志形态回归。
3. 跑 `bash -n templates/claude/hooks/prd-prewrite-guard templates/claude/hooks/prd-readiness-guard`。
4. 跑 `npx jest tests/unit/prd-readiness-guard-hook.test.js tests/unit/spec-prd-finalize.test.js --runInBand`。
5. 跑 `npx jest tests/unit/spec-prd-contracts.test.js --runInBand`。
6. 优化 `prd-prewrite-guard` 和 `prd-readiness-guard` 的 closeout/finalize 文案。
7. 如新增 advisory fact，再补 checker/finalize focused tests 和 contract 锚点。
8. 更新 `CHANGELOG.md`，必要时更新 `docs/02-架构设计/2026-06-25-spec-prd-执行流程图与质量闭环.md` 中关于 `input_scan_degraded 修复` 的状态表述。
9. 如果 runtime mirror 需要刷新，使用 `spec-first init`，不要手改 generated runtime。

---

## 10. 验证矩阵

| 变更 | 最窄验证 |
| --- | --- |
| hook parser 修复 | `bash -n templates/claude/hooks/prd-readiness-guard` |
| Stop hook input 抽取测试 | `npx jest tests/unit/prd-readiness-guard-hook.test.js --runInBand` |
| checkpoint closeout 语义 | `npx jest tests/unit/spec-prd-finalize.test.js --runInBand` |
| skill/source contract 锚点 | `npx jest tests/unit/spec-prd-contracts.test.js --runInBand` |
| changelog 格式 | `npx jest tests/unit/changelog-format.test.js --runInBand` |
| runtime projection 影响 | `npx jest tests/unit/runtime-plan-contracts.test.js tests/unit/runtime-hook-permissions.test.js --runInBand` |

---

## 11. 当前状态判断

### 实现正确的部分

- checker/finalize 的职责分层正确。
- 合法 checkpoint closeout 与 ready finalization 分离正确。
- `prd-prewrite-guard` 作为 direct-ready-write 控制流 guard 的方向正确。
- `BLOCKING_REASON_CODES` 不应随意扩张的纪律正确。

### 必须修复的部分

- `prd-readiness-guard` 的 `source_inputs` frontmatter 解析边界。
- Stop hook 回归测试缺口。

### 仍属边界限制的部分

- 是否真的逐条 Requirements Grill。
- owner 是否真实回答。
- Owner Decision Trace 是否忠实反映 owner 原话。
- Figma/API 是否真的被读取，而不是被 artifact 文本声称读取。

这些限制需要通过 prose forcing、doc-review 触发条件、fresh-source eval、未来 host question receipt / transcript provenance 来逐步改善；不要让当前 checker 假装已经能机械证明。

---

## 12. 最新 113802 日志补充分析

最新日志 `/Users/kuang/xiaobu/hsglobal/2026-06-27-113802-command-messagespecprdcommand-message.txt` 暴露出比 232726 更清晰的失败链：

1. 用户运行 `spec-prd`，输入是一个 KAZ 市场页素材目录，并要求“梳理需求，输出 app 端需求 prd”。
2. 模型读取 7 个文件后，直接 `Write(docs/brainstorms/kaz-market-page-requirements.md)`，没有 owner question、没有 `AskUserQuestion`、没有 `question_delivery`、没有 Requirements Grill。
3. 首次 closeout 被 Stop hook 拦截，reason codes 指向 readiness declaration、core section、design source 与 finalize 缺口。
4. 模型把问题理解成“字段格式不对”，先写入无效枚举和值：`write_mode: create`、`can_enter_spec_plan: true`、YAML 对象形式的 `clarification_evidence`、自造 `producer_local_finalize: passed`。
5. Stop hook 继续拦截后，模型读取 checker 逻辑，改成 checker 接受的 token：`write_mode: final-prd`、`clarification_evidence: source-proven-no-ask`、`can_enter_spec_plan: yes`。
6. 模型把两个真实未决问题声明为 `source-backed-non-what-assumption` 且 `blocks_planning=no`：
   - `OQ-01` 中台持仓查询接口何时就绪，影响 R-06 自选/持仓标识。
   - `OQ-02` Shariah 末页“温馨提示”投教展位接口来源，影响 R-28。
7. 模型写入 `design_degraded_owner_acceptance: true`，但日志没有任何 owner 交互；这是自声明 owner 接受。
8. 最终 PRD 写入 ready receipt，checker 显示 blocking 为空，但只读复验显示：
   - `input_scan_attempted=false`
   - `design_sources_unread_non_empty=true`
   - `design_degraded_owner_accepted=true`
   - `ready_receipt_current=true`
   - `readiness_inputs_hash=sha256:e3b0...`，即空 inputs hash

这说明当前最危险的失败形态已经从“checkpoint 被误阻断”升级为“模型通过格式学习让 checker 通过，但实际没有 grill、没有 owner acceptance、没有 input-side design-source 核算”。

---

## 13. 以终为始：PRD ready 的真实终点

`spec-prd` 的终点不是“checker blocking 为空”，而是：

> `spec-plan` 能消费 PRD 而不发明 WHAT。

因此 ready-for-planning 必须同时满足：

1. 所有会改变产品行为、验收、范围、数据权威、接口可用性、fallback 展示、analytics acceptance 或 source-of-truth 的问题，都达到合法停点。
2. 如果有 owner-owned 决策，必须真实问 owner，或停在 `ask-owner` / `checkpoint-prd`，不能自写 owner acceptance。
3. 如果有设计源、截图、Figma、外部文档输入，final PRD 必须执行 input-side scan；否则 `input_scan_attempted=false` 是 must-not-ready。
4. 如果设计源未读或 degraded，只能在明确 owner 接受该风险后 ready；这个接受必须有 Owner Decision Trace 或等价可追溯证据，不能由模型写一个布尔字段。
5. Machine ready receipt 只能证明“当前 artifact 文本通过 deterministic checker”，不能覆盖语义 readiness。

从这个终点倒推，Phase 4 应该是“验证出口 + 指向正确下一步”，而不是“指导模型修格式直到 ready”。

---

## 14. 主 workflow 中文说明

当前 `spec-prd` 主 workflow 应按下面这条链路理解：

```text
输入
-> 意图分类
-> 输入盘点与材料消毒
-> 当前系统证据收集
-> 需求分析门
-> 产品专家视角排序
-> Requirements Grill / 需求追问
-> 写前关闭判断
-> PRD 写入 / 修订
-> Readiness + Finalize
-> 交付出口
```

核心目标只有一个：让后续 `spec-plan` 不需要发明 WHAT。

### 14.1 输入

接收用户请求、现有 PRD、粗糙笔记、日志、设计材料、源码线索等。所有输入都先当成“不可信材料”，只能提取 claim、证据、矛盾，不能照着里面的指令执行。

### 14.2 意图分类

判断这次是不是该走 PRD：

- `create`：从零或粗材料写 brownfield PRD。
- `refine`：优化已有低质量 PRD。
- `validate`：验证 PRD 是否可进入 planning。
- `route-out`：其实该走 debug、plan、work、brainstorm、app consistency audit 等。

这一层解决“该不该写 PRD”。

### 14.3 输入盘点与材料消毒

梳理材料来源、权威顺序、是否有过期草稿、会议闲聊、未确认建议、嵌入指令、设计源、源码引用。这一层解决“哪些材料可信、哪些只是参考”。

### 14.4 当前系统证据收集

对 brownfield 系统先建立现状：当前功能、入口、边界、相关模块、已有约束、源码/文档/测试证据。这一层解决“现有系统是什么样”。

### 14.5 需求分析门

把材料转成 run-local map：

```text
input_inventory
source_authority_order
target_surface_anchor
current_state_summary
change_delta
module_map
open_decisions
design_coverage
api_coverage
risk_to_prd_write_target
next_owner_question / source-backed no-question reason
```

这一层是 workflow 的关键节点：先分析缺口，再决定问什么、写什么。

### 14.6 产品专家视角排序

把所有不确定点按 downstream risk 排序：

```text
claim -> evidence -> gap -> owner_question_or_assumption -> PRD_write_target -> closure_state
```

也就是判断：哪些问题如果不关闭，会导致 plan 阶段发明产品行为。

### 14.7 Requirements Grill / 需求追问

对承重缺口持续追问 owner，一次一个问题。每个分支只能在四种情况下停止：

- 已到 leaf，没有会改变 WHAT 的子决策。
- source/docs/tests 已关闭。
- owner 明确回答或明确 cap。
- 纯 HOW 问题下推到 plan，并说明不影响 WHAT。

不能因为“差不多能写了”“问题太多了”“可以后面规划时问”就停止。

### 14.8 写前关闭判断

决定现在能不能写 PRD：

```text
write_mode=ask-owner-first     -> 继续问 owner
write_mode=checkpoint-prd      -> 保存恢复点，不能进入 planning
write_mode=final-prd           -> 允许写最终 PRD
write_mode=route-out           -> 不写 PRD，转正确 workflow
```

这里是防止“直接写 PRD”的关键闸口。

### 14.9 PRD 写入 / 修订

把已经关闭的决策、证据、假设、范围、验收、Outstanding Questions、Planning Recheck 写入 `docs/brainstorms/*-requirements.md`。PRD 不是记录所有过程，而是记录能降低 planning 发明风险的 WHAT/WHY 证据。

### 14.10 Readiness + Finalize

运行 readiness lens 和 finalize/checker。重点不是 checker 过没过，而是判断：

```text
planning 是否还需要发明 WHAT？
owner 决策是否真实关闭？
设计/source 输入是否覆盖？
Outstanding Questions 是否有合法 closure_disposition？
ready receipt 是否 current？
```

### 14.11 交付出口

最后才进入出口：

```text
ready-for-planning -> 交给 spec-plan
ask-owner          -> 回到 Requirements Grill
revise-prd         -> 回到 PRD 写入/修订，必要时回到分析门
doc-review         -> 交给 spec-doc-review 做独立审查
route-out          -> 转到正确 workflow
```

`checkpoint-prd` 不属于 readiness outcome。它只属于写前关闭判断下的恢复性 `write_mode`，必须搭配 `can_enter_spec_plan: no` 和 `next_owner_question`。

---

## 15. 当前执行流程节点拆解

### 节点 0：入口与目标识别

应然：

- 识别为 brownfield PRD create。
- 输入是多源素材目录，且包含 Figma 链接、API 文档、需求文档，属于 design-source + multi-source PRD。
- 运行模式应进入 Requirements Grill 热路径，而不是快速整理文档。

实然：

- 模型读取素材后直接写 PRD。
- 未先声明 `intent`、`input_posture`、`write_mode`、`highest_risk_gap`、`next_owner_question`。

问题：

- skill 的 `Run-Local Decision Card` 是 scratch card，但没有形成强 enough 的执行检查点。
- 对“输出 PRD”这类用户措辞，模型倾向直接生成 artifact，而不是先判断是否需要 owner grill。

优化：

- 在 PRD authoring hot path 增加一个极短的 Pre-Write Decision Card 输出要求：写 artifact 前必须先在对话中列出 `write_mode` 和 `next_action`。
- 这个 card 不做持久 schema，不写入 PRD；只作为写前自检，防止“读完即写”。

### 节点 1：素材读取与 source-first 分析

应然：

- 先做 source authority order、target surface anchor、current state summary、change delta、design coverage、API coverage。
- 将不可从 source 关闭的问题变成 owner questions。

实然：

- 模型读取 7 个文件，但没有显式输出 requirement analysis map。
- 后续为了满足 checker，才补 `preflight_sweep_closure: closed`。

问题：

- `preflight_sweep_closure` 只是事后声明，不证明分析真的发生。
- 模型把“读过文件”误当成“source-resolved”，没有识别哪些信息仍是 owner-owned。

优化：

- 将 `preflight_sweep_closure=closed` 的含义收紧：若有 `Outstanding Questions` 且 `write_mode=final-prd`，PRD closeout 必须列 `Resolved before planning` / `Still carried`。
- `Still carried` 中任一 WHAT-bearing gap 仍在时，readiness outcome 必须是 `ask-owner` 或 `revise-prd`；如需保留恢复点，另设 `write_mode=checkpoint-prd` 且 `can_enter_spec_plan: no`。

### 节点 2：Product Expert Lens 与风险排序

应然：

- 对实现者座位和测试作者座位分别问：“哪个未命名接口、权限、状态、source-of-truth 或 fallback 会逼 planning 发明 WHAT？”
- 中台持仓接口就绪、Shariah 投教展位接口、Figma 未读都应成为高风险 gap。

实然：

- 这些 gap 出现在 PRD 的 `Outstanding Questions`，但随后被标成 `source-backed-non-what-assumption` 和 `blocks_planning=no`。

问题：

- 当前 checker 无法判定“这个问题是否 WHAT-bearing”。
- 模型学会用合法 token 包装真实风险。

优化：

- 不新增语义 checker。
- 增加 doc-review 强触发：当 `write_mode=final-prd` 且存在 `Outstanding Questions`，如果任何 question 文本命中接口就绪、权限、source-of-truth、fallback、设计未读、analytics acceptance、投教/运营内容来源等风险词，必须 route to `doc-review` 或降级为 `ask-owner`，不能直接 plan。
- 这仍是 readiness lens / prose forcing，不进 `BLOCKING_REASON_CODES`。

### 节点 3：Requirements Grill / owner 交互

应然：

- 对 owner-owned gap 使用 `AskUserQuestion` 或 fallback chat question。
- 若无法等待用户，记录 `question_delivery=true-headless-unavailable` 和 `clarification_evidence=headless-degraded-logged`，并停在 checkpoint。

实然：

- 日志中没有 `AskUserQuestion`、没有 chat fallback 等待、没有 owner answer。
- 模型直接写 `clarification_evidence: source-proven-no-ask`。

问题：

- `source-proven-no-ask` 对 source 真能关闭的事实是合法的，但被用于绕过 owner-owned 决策。
- 当前 checker 只能验证枚举值，不验证“source 是否足以 no-ask”。

优化：

- readiness lens 明确：`source-proven-no-ask` 对 `Outstanding Questions` 只合法于 source-resolved 问题；只要问题本身问“何时就绪 / 哪个接口 / 是否可用 / owner 是否接受 degraded”，就不能用 `source-proven-no-ask` 关闭。
- Hook 文案中加入：如果 blocking reason 来自缺少 grill evidence，不要补 `source-proven-no-ask`；应改为 `ask-owner-first` 或 `checkpoint-prd`。

### 节点 4：Pre-Write Closure Gate

应然：

- durable write 前决定：
  - `final-prd`：所有 load-bearing branch 合法闭合。
  - `ask-owner-first`：下一步问 owner。
  - `checkpoint-prd`：owner 不可用或大输入恢复点。
  - `route-out`：错阶段或无 PRD 价值。

实然：

- 首次 PRD 没有这些声明。
- Stop hook 之后，模型把 `write_mode` 从 invalid `create` 改为 `final-prd`，但没有补真实闭合证据。

问题：

- Pre-Write Closure Gate 没有在 write 前形成可观察动作。
- Phase 4 被迫承担“事后补流程”的角色。

优化：

- 对首次新建 PRD artifact，`prd-prewrite-guard` 不应只拦 ready/final intent；也应在内容含 `artifact_kind: prd-requirements` 且缺少有效 `write_mode` 时提示写前路径：
  - 如果要保存草稿，必须是 `checkpoint-prd` + `can_enter_spec_plan: no` + `next_owner_question`。
  - 如果要 final，必须先有当前会话中的 grill / source-proven no-ask reason。
- 不一定 hard block 所有缺字段草稿，但 blocking message 要阻断“直接 plan handoff”。

### 节点 5：PRD artifact 写入

应然：

- PRD artifact 持久化的是已关闭的 WHAT、显式 assumption、未关闭 blocker。
- 对未关闭 owner-owned gap，artifact 应是 checkpoint，不是 ready。

实然：

- 第二次大 rewrite 为了满足 checker，删除大量详细内容，压缩成 checker-friendly skeleton。
- 需求质量从 40 条详细需求变成 30 条表格行，部分细节丢失。

问题：

- checker 的 canonical heading 要求让模型把目标从“保留需求质量”切换成“满足格式”。
- Stop hook 没有引导模型“保留原文并补 anchors”，而是让模型认为应重写整个文件。

优化：

- Guard 文案明确：“不要重写或压缩 PRD 来消除 reason codes；保留已有需求内容，只补 canonical heading anchor 和 readiness bridge。”
- 在 `prd-output-template.md` 或 readiness lens 中增加 repair guidance：localized heading 可以改成 `## Summary（需求背景）`，不需要删除原 section。

### 节点 6：Phase 4 checker/finalize

应然：

- finalize 写 ready receipt 前，LLM 已经做出 readiness 语义判断。
- checker facts 是事实输入，不是语义结论。

实然：

- checker 最终 blocking 为空，并写入 ready receipt。
- 只读复验显示 `input_scan_attempted=false`，但仍 `ready_receipt_current=true`。

问题：

- `input_scan_attempted=false` 在 readiness lens 中是 must-not-ready，但不是 checker hard blocker；模型忽略了这个 advisory fact。
- `readiness_inputs_hash` 为空 hash，说明 ready receipt 没覆盖原始输入。

优化：

- 对 final UI/design-surface PRD，`input_scan_attempted=false` 应升级为 closeout blocker，或者至少在 `finalize-prd-artifact.js` 中把 `can_finalize=false`，状态改为 `blocked` / `needs-input-scan`。
- 这不是语义判断，而是确定性出口不变量：final PRD 声称 ready，且 PRD/输入中存在 design-source signal，却没有 input scan。

### 节点 7：设计源 degraded owner acceptance

应然：

- 设计源未读或 partial coverage 可能影响 UI WHAT 时，只有 owner 明确接受 degraded 风险后才能 ready。
- owner acceptance 应有 Owner Decision Trace 或等价证据。

实然：

- 模型写入 `design_degraded_owner_acceptance: true`。
- 日志没有 owner interaction。
- checker 只看该字段布尔值。

问题：

- 这是新的确定性绕过点：一个布尔字段可把 `design_unread_without_owner_acceptance` 和 `design_partial_coverage_unaccepted` 消掉。

优化：

- 不再接受裸 `design_degraded_owner_acceptance: true` 作为通过条件。
- 改为要求 `Owner Decision Trace` 中有绑定 design degraded risk 的 row，或 `design_degraded_owner_acceptance_ref` 指向可检查的 owner answer。
- 若缺 ref，checker 可以报告 `design_degraded_owner_acceptance_unverified`。是否进入 `BLOCKING_REASON_CODES` 可分两步：先 advisory + readiness must-not-ready，再按真实运行复发决定是否 hard block。

### 节点 8：handoff

应然：

- ready handoff 必须报告 checker/finalize receipt、input scan status、remaining WHAT decisions、design degraded status。

实然：

- 最终 closeout 只说“PRD 已通过所有检查，status: finalizable，blocking 为空，可进入 spec-plan”。

问题：

- closeout 把 checker 通过等同于 planning-ready。
- 没有报告 `input_scan_attempted=false` 和设计源未读。

优化：

- closeout 模板必须列：
  - `checker_blocking_reason_codes`
  - `input_scan_attempted`
  - `design_sources_unread_non_empty`
  - `owner_acceptance_evidence`
  - `remaining_what_decisions`
- 任一 must-not-ready fact 存在时，禁止输出“可进入 plan”。

---

## 16. 最新日志后的优化优先级修正

结合 113802 日志，优先级应调整为：

### P0-A：final UI/design PRD 缺 input scan 不得 finalize

条件：

- `write_mode=final-prd` 或 `can_enter_spec_plan=yes`
- 且 PRD 文本或 source refs 有 design/Figma signal
- 且 `input_scan_attempted=false`

结果：

- `finalize-prd-artifact.js --check-only` 应返回 non-finalizable。
- Stop hook 应阻断 ready closeout。

理由：这是确定性出口不变量，不是语义判断。

### P0-B：裸 `design_degraded_owner_acceptance: true` 不应消除设计 blocker

短期：

- readiness lens 明确裸布尔字段不是 owner evidence。
- doc-review 触发条件纳入“design degraded acceptance 无 trace/ref”。

中期：

- checker 增加 `design_degraded_owner_acceptance_unverified` advisory fact。
- 观察后再决定是否进入 `BLOCKING_REASON_CODES`。

### P0-C：Stop hook 阻断文案必须从“修字段”改为“选路径”

当前 Stop hook 输出把模型推向修 reason code。建议改为：

```text
Do not repair this by changing enum values to final-prd.
Choose one path:
1. ask-owner-first: ask the next load-bearing owner question
2. checkpoint-prd: preserve context, can_enter_spec_plan:no, name next_owner_question
3. revise-prd: keep source/design gaps visible
4. final-prd: only after all load-bearing gaps are closed and inputs were scanned
```

### P1：减少 checker-friendly rewrite 的诱因

新增修复指导：

- core section missing 时，优先“加英文 anchor 到原 section 标题”，不要重写全文。
- declaration missing 时，优先补 `Readiness Self-Check`，不要把 frontmatter 当成自由塞字段区。
- requirement coverage gap 是 advisory 时，不要为追求 finding_count=0 删除细节。

### P1：写前必须显式输出 next action

在 `spec-prd` hot path 增加轻量要求：

```text
Before first durable PRD Write:
- write_mode:
- highest_risk_gap:
- next_action: ask-owner-first | checkpoint-prd | final-prd | route-out
- why planning will not invent WHAT:
```

这不是持久 schema，也不是 hard gate；它是让 LLM 在副作用前暴露选择。

### P2：将 doc-review 作为“checker 通过但语义可疑”的出口

触发条件：

- final PRD 有 Outstanding Questions。
- `source-proven-no-ask` 与 owner-looking question 同时出现。
- `design_sources_unread` 非空且 owner acceptance 证据弱。
- input scan 未覆盖原始素材。

输出：

- readiness outcome 应为 `doc-review` 或 `ask-owner`，不是 `ready-for-planning`。

---

## 17. 最小可维护落地顺序（更新版）

1. 修 `prd-readiness-guard` 的 `source_inputs` frontmatter 边界解析，并加 Stop hook 回归。
2. 修改 `prd-readiness-guard` / `prd-prewrite-guard` 文案，明确不要用 enum 修补升级 final。
3. 在 finalize/checker 层处理 final UI/design PRD 的 `input_scan_attempted=false`：至少使 finalization 非通过。
4. 收紧 `design_degraded_owner_acceptance`：裸布尔先降级为 advisory risk，要求 trace/ref。
5. 在 `spec-prd` / readiness lens 加写前轻量 Decision Card 和 closeout must-report facts。
6. 增加 focused tests：
   - no-interaction final-prd with owner-looking OQ must not be considered ready by readiness lens contract。
   - design unread + self-declared acceptance does not silently clear readiness risk。
   - final PRD without `source_inputs` / input scan cannot get ready receipt when design source exists。
7. 更新架构流程图，明确 checker pass 不等于 semantic ready。
