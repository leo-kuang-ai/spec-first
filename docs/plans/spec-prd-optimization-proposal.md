# spec-prd Skill 重构优化方案

**状态：** implementation-ready，验证优先、按失败样本激活  
**目标 surface：** `skills/spec-prd/` source、聚焦测试、五宿主 runtime projection  
**历史分析：** 重构前的完整候选机制与五视角审查轨迹保留在 Git 历史 `5b8d8637^..5b8d8637`，不再作为当前实施合同  
**当前权威：** 本文档全篇；实施时仍以当前 `skills/spec-prd/**`、脚本与测试事实为最终依据

## 一、结论

`spec-prd` 已经具备较完整的 brownfield PRD 能力：Decision Card、Requirement Analysis Gate、Product Expert Lens、relentless Requirements Grill、Planning Recheck、checker/finalize 和 Handoff Context Slice 都已存在。

当前问题不是“缺少更多机制”，而是：

1. 聚焦验证入口失效，无法可靠证明新改动没有破坏现有合同。
2. 某些确定性跨字段矛盾仍需用失败 fixture 验证 checker 是否覆盖。
3. 现有 grill 排序和 WHAT/HOW 边界可能需要更清晰的反例，但不应新增第二套枚举或 schema。
4. 下游消费视图存在，但需要验证其是否足以让开发和 `spec-plan` 快速定位核心信息。
5. 任何新 prose 都必须证明改善了真实行为，而不是只证明文字被写入。

因此，本轮采用：

> **subtraction-first + evidence-activated**：先恢复验证地板，再对当前 source 做改前基线；只有失败样本证明现有合同不足时才激活对应实现单元。

## 二、目标用户与产品结果

### 2.1 决策职责

本方案按职责分层，不假设所有使用者都是传统 PM：

| 角色 | 主要职责 | 不应承担 |
| --- | --- | --- |
| Decision Owner | 决定产品 WHAT、范围、默认行为、验收与风险接受 | 在证据不足时替代架构师选择实现 HOW |
| Technical Evidence Provider | 提供源码事实、接口可用性、技术可行性与约束 | 单方面改写 Requirements、AE 或 Scope |
| Downstream Consumer | `spec-plan`、开发、测试消费已确定 WHAT 与可复核 HOW | 在 planning 中自行发明产品决策 |
| Workflow Maintainer | 维护 skill、checker、runtime projection 与验证证据 | 用更多 prompt 机制替代缺失的实测证据 |

### 2.2 Primary outcome

- Decision Owner 以尽可能低的重复交互成本关闭 load-bearing WHAT gap。
- source 可以回答的问题不再询问 owner。
- 纯 HOW 选型不被错误升级为产品决策。
- 下游能快速识别 confirmed WHAT、核心 R/AE、must-preserve behavior、阻塞项和 Planning Recheck。
- `ready-for-planning` 不携带仍需 planning 发明的产品 WHAT。

## 三、Goals 与 Non-Goals

### 3.1 Goals

- 降低矛盾 Decision Card 或虚假 ready 状态逸出。
- 让最高传播风险的 PRD-owned WHAT gap 优先被 source-resolve 或询问 owner。
- 保持 relentless 只作用于 load-bearing WHAT branch。
- 复用现有 Handoff Context Slice 改善开发与 `spec-plan` 的消费效率。
- 形成改前/改后、可复查、可说明限制的验证证据。
- 保持 Claude、Codex、Cursor、Kiro、Qoder 的 source/runtime 投射一致。

### 3.2 Non-Goals

- 不新增中心化 workflow engine、persistent progress schema 或第二 PRD artifact。
- 不新增 P0 Architecture / P1 Behavior / P2 Experience 风险枚举。
- 不新增 `non_what_tech_recheck`、`what_affecting_tech_decision` 等同义持久字段。
- 不把 semantic adequacy、问题优先级或 PRD 质量变成脚本评分。
- 不重排现有 Phase spine；当前 Phase 1 已包含 Pre-PRD Clarification。
- 不单方实现 `PRD Revision Signal`；跨 workflow 反馈需独立提案和下游 consumer buy-in。
- 不引入未经实测的 token/context 阈值、System State Cache 或 Acceptance Pattern Library。
- 不因为旧测试曾锁定 9 个 references 就把文件数量当产品合同。
- 本轮默认不新增 reference 文件；只有出现不可由现有文件承载的独立责任和明确 consumer 时才重评。

## 四、当前 Source 事实与 Ownership

当前 source 基线：`SKILL.md` 293 行、9 个 reference 文档共 1,960 行、5 个脚本文件（含 `scripts/lib/reason-codes.js`）共 2,590 行、`evals/examples.json` 2,693 行。

| 关注点 | 当前权威 source | 当前事实 | 重构规则 |
| --- | --- | --- | --- |
| Decision Card 语义 | `skills/spec-prd/SKILL.md` | 已定义字段、final/checkpoint 语义和四类 legal stop points | 跨字段语义只在此维护；template 只持久化必要字段 |
| Decision Card 确定性事实 | `check-prd-artifact.js` + `reason-codes.js` | 已报告缺字段、checkpoint 自称 ready 等事实 | 可机械判定的冲突进入 checker，不新增 advisory 状态表 |
| Grill 排序 | `product-expert-lens.md` + `domain-language-and-decision-ledger.md` | 已有 `downstream_confirmation_risk` 与 Load-Bearing Gap Triage | 保持一个排序接口，只补反例或边界 |
| WHAT/HOW 交接 | SKILL Closure-disposition razor + readiness/output references | 已有 `implementation-only-how-pushdown`、`planning_would_invent_what`、Planning Recheck | 复用既有术语；WHAT-affecting gap 不得 pushdown |
| 下游快速消费 | `handoff_context_slice` | 已能承载 confirmed WHAT、决策、recheck 与 blocker | 只增强现有 slice，不新增 Developer Quick-Start section |
| Eval fixture | `evals/examples.json` + `run-evals.js` | 当前 111 个 case 的结构与 coverage contract 可通过 | 不是模型语义质量证明 |
| 聚焦测试入口 | `package.json#test:eval-fixtures` | 当前引用已删除的测试文件，命令失败 | U0 必须先恢复可维护的 focused suite |
| Runtime projection | `getSupportedPlatforms()` | 当前平台为 Claude、Codex、Cursor、Kiro、Qoder | 所有行为变更按五宿主验证 |

### 4.1 Scripts 与 LLM 边界

| 归属 | 负责 | 禁止 |
| --- | --- | --- |
| Scripts / tests | 字段组合、结构、section identity、ref、hash、receipt、reason_code、runtime projection | 判断哪个需求更重要、产品 WHAT 是否充分、PRD 语义质量分数 |
| LLM / reviewer | 风险排序、WHAT/HOW 边界、owner authority、语义充分性、用户价值判断 | 编造测试结果、把 advisory 当 confirmed、绕过 finalize receipt |

## 五、假设、指标与激活条件

每个候选改动必须先回答：当前合同是什么、失败样本是什么、现有合同为什么没有覆盖、最小改动是什么。无法回答则不实施。

| 假设 | 改前失败样本 | 主要指标 | 激活条件 | 未激活时处置 |
| --- | --- | --- | --- | --- |
| H1 Decision Card 组合仍会自相矛盾 | `final-prd + can_enter_spec_plan=no`、`checkpoint-prd + can_enter_spec_plan=yes` 等 | 矛盾组合逸出率 | 当前 checker 未报告可机械确认的冲突 | 保持现有 source，不增加状态表 |
| H2 Grill 会先问低传播风险问题 | 高影响 Acceptance/Scope gap 与低影响架构 HOW 同时存在 | 最高风险 PRD-owned WHAT gap 首问命中率 | 当前 source 稳定把纯 HOW 或低风险项排在前面 | 保留现有排序，不补 prose |
| H3 Tech feasibility gap 会被错误放行或错误阻断 | 一组会改变 WHAT，一组仅影响 HOW | WHAT gap 错误放行率；HOW recheck 误阻断率 | 当前 source 无法稳定应用既有 pushdown/Planning Recheck 边界 | 保持现有术语 |
| H4 长/高风险 PRD 的消费成本过高 | 下游需要从长 PRD 找核心 R/AE、preserved behavior、blocker | 关键信息定位完整性；重复内容数 | 现有 Handoff Context Slice 缺少核心消费信息 | 不扩展输出模板 |

共同 guardrails：

- owner 问题总量不得因“排序优化”无界增加。
- 重复问题数不得高于改前基线。
- source 可回答的问题不得继续转成 owner 问题。
- 改动不得增加第二套 enum、artifact、progress ledger 或 runtime source。
- 行为改善必须由同一 fixture 的改前/改后证据支撑，不能只以字符串存在断言完成。

## 六、实施单元

### U0：恢复验证地板（无条件执行）

**目标**：恢复 `spec-prd` 当前 source 的可验证 contract 入口，解除“等待已删除测试恢复”的伪前置条件。

**修改面**：

- 新建一个规模受控的 `spec-prd` focused contract suite；不机械恢复已删除的 3,854 行旧测试。
- 修复 `package.json` 的 `test:eval-fixtures`，只引用当前存在且受维护的测试。
- 覆盖 source/reference reachability、reason-code 分类、checker/finalize good/bad fixtures、eval fixture contract、关键 source/runtime projection。
- 对固定 reference 数量只做有意图的 compactness 检查，不把精确文件数当不可演化的架构真相。

**完成条件**：

- `npm run test:eval-fixtures` 可执行并通过。
- `node skills/spec-prd/scripts/run-evals.js --json` 继续返回 fixture contract passed。
- focused suite 能在缺 reference、reason-code 漂移、checker/finalize 关键回归时失败。

### U1：Decision Card 确定性一致性（按 H1 激活）

**原则**：字段组合是否自相矛盾是 script-owned deterministic fact；需求是否充分仍是 LLM-owned judgment。

**最小方案**：

1. 先增加能在当前 source 上失败的 checker fixture。
2. 若冲突可机械确认，在 `check-prd-artifact.js` 报告单一一致性 finding，并在 `reason-codes.js` 归类。
3. ready/final 出口的确定性矛盾应阻断完成。
4. `SKILL.md` 保留唯一组合语义；`prd-output-template.md` 只保留持久字段和 canonical 指针。
5. 不新增完整合法状态矩阵，不要求 LLM 维护第二张表。

**至少覆盖**：

- `final-prd + can_enter_spec_plan=no`。
- `final-prd + clarification_evidence=skipped`。
- `checkpoint-prd + can_enter_spec_plan=yes`。
- `decision_card_next_action` 与 `write_mode` 明确冲突。

### U2：Grill 风险排序收敛（按 H2 激活）

**原则**：只排序 PRD-owned、load-bearing WHAT gap；纯实现 HOW 不进入 owner grill 优先级队列。

继续使用唯一接口 `downstream_confirmation_risk`，综合判断：

1. 是否会让 planning 发明 WHAT。
2. 对 Requirements、AE、Scope、默认行为、数据权威、fallback、analytics acceptance 的影响。
3. 影响面、不可逆性与跨 section 传播范围。
4. source/user/glossary/contract contradiction。
5. 是否必须由 owner 裁决，或可先由源码解决。

Architecture、Behavior、Experience 只作为案例标签，不带固定优先级。必须加入反例：高验收影响的行为 gap 应排在低影响的存储/协议 HOW 之前。

**Owner 成本边界**：relentless 适用于 load-bearing WHAT branch；非 load-bearing 项可以通过 source-resolved、evidence-backed accepted assumption、owner-capped 或合法 HOW pushdown 闭合。LLM 生成问题成本低，不代表 owner 判断成本为零。

### U3：WHAT/HOW 与 tech-input 交接收敛（按 H3 激活）

不新增字段，补强既有 `implementation-only-how-pushdown` 与 Planning Recheck 的决策测试：

> 技术复核的不同结论是否会改变 Requirement、AE、Scope、source-of-truth、默认行为、interface availability、fallback 或 analytics acceptance？

- **会改变**：它仍是 PRD-owned WHAT gap，必须继续 source-read / ask-owner / checkpoint / revise-prd，不得标为非阻塞 Planning Recheck。
- **不会改变**：使用现有 `implementation-only-how-pushdown` 或 Planning Recheck，并声明 `planning_would_invent_what=no`。

本单元只改善 `spec-prd` producer 边界，不宣称 `spec-plan` 已消费新的协议。若需要 planning 在技术不可行时自动返回 `spec-prd refine`，另立跨 workflow 提案，并同步修改生产者、消费者和 consumer tests。

### U4：下游消费视图（按 H4 激活）

不新增 `Developer Quick-Start` section；增强现有 `handoff_context_slice`，在 long / mixed / high-risk PRD closeout 中包含：

- confirmed WHAT；
- top-3 load-bearing Requirements 及对应 AE；
- must-preserve behaviors；
- unresolved WHAT blockers；
- Planning Recheck / source refs；
- degraded facts 与 downstream sync impact。

该 slice 是已有 PRD 内容的聚合视图，不创造新需求、不复制完整 Requirements、不包含文件级 HOW 或任务顺序。

## 七、Source 分配、Consumer 与顺序

### 7.1 Source / Consumer Map

| 变更类型 | Source 落点 | Producer | Consumer | 禁止 |
| --- | --- | --- | --- | --- |
| 确定性 Decision Card 冲突 | checker + reason-code taxonomy | `spec-prd` finalize/checker | finalize、hooks、contract tests | 仅靠 prose 自查 |
| Grill 排序语义 | 现有 Product Expert Lens / Domain Ledger 段 | `spec-prd` LLM | Requirements Grill | 新建风险 enum/reference |
| WHAT/HOW 判定 | SKILL closure razor + readiness/output references | `spec-prd` | readiness、handoff、`spec-plan` 现有 PRD 消费 | 新字段或未承诺 consumer 的协议 |
| 消费视图 | 现有 Handoff Context Slice | `spec-prd` closeout | 人类开发、测试、`spec-plan` | 第二 PRD section/topology |
| Runtime | source 经 `spec-first init` 生成 | CLI adapters | Claude/Codex/Cursor/Kiro/Qoder | 手改 runtime mirror |

### 7.2 实施顺序

```text
U0 恢复验证地板
  -> 当前 source 基线（H1/H2/H3/H4）
  -> 逐项 Activation Decision
     -> 未复现：删除该候选实现
     -> 已复现：激活对应 U1/U2/U3/U4
  -> 同 fixture 改后重跑
  -> focused tests + fresh-source eval
  -> 五宿主 source/runtime projection
  -> closeout evidence
```

实施单元彼此独立，不得因为 U1 激活就默认 U2/U3/U4 也需要实施。若 U2 与 U3 同时激活，先完成 U3 的 WHAT/HOW 边界，再调整 U2 排序，避免把纯 HOW 错误列为最高优先级 owner 问题。

## 八、风险与失败模式

| 风险 | 触发信号 | 缓解 |
| --- | --- | --- |
| 重复合同继续增加 | 出现第二套风险 enum、tech-input 字段或 Decision Card 表 | subtraction review；删除同义机制，保留唯一权威 |
| 测试只证明字符串存在 | contract test 通过但行为 fixture 不改善 | 强制改前/改后同场景比较 |
| 脚本越权判断语义 | checker 开始判断哪个 gap 更重要或是否充分 | 脚本只报告组合、结构、ref、receipt 等事实 |
| Decision Owner 被迫裁决 HOW | owner question 出现存储/协议选择且不改变 WHAT | 先走 U3 判定，HOW pushdown |
| false-ready 未下降 | WHAT-affecting tech gap 仍被放行 | 保持 checkpoint/revise；补 fresh-source fixture |
| owner 负担上升 | 问题数、重复问题数显著增加 | 保持 load-bearing 边界和 source-first guardrail |
| runtime drift | source 变化未投射某宿主 | 五宿主临时目录矩阵；不手改 mirror |

## 九、明确不纳入本轮的方向

| 方向 | 处置 | 重新激活条件 |
| --- | --- | --- |
| Phase Checkpoint Protocol / spine 重排 | 不实施；现有 Failure-Mode Blacklist、Pre-Write Gate 与 Phase 1 clarification 已覆盖 | 真实运行证据证明时序而非执行遵从是根因 |
| T0 / Session Recovery / Context Budget | 不实施 | 有真实跨会话分布和 token 消耗数据，且现有 handoff 无法满足 |
| PRD Revision Signal / Inbound Revision Request | 独立跨 workflow 提案 | 至少一个 `spec-plan` / `spec-work` / review consumer 明确承诺消费并同步测试 |
| System State Cache / Acceptance Pattern Library | 不实施 | 出现多个可指名消费者及 freshness/invalidation contract |
| 多模态预处理新管道 | 不实施 | 现有 design-source/large-input/resume 能力出现已验证覆盖缺口 |
| Per-Question Quality Layer 新机制 | 不实施；复用现有 scenario grill | 当前 scenario discipline 在可重放样本中稳定失效 |
| 三受众 Handoff Views / optional `resolution_requires` 列 | 不实施 | 有真实 consumer 要求且现有 Handoff Context Slice 无法表达 |
| `CONTEXT.md` / `CONCEPTS.md` / domain glossary 统一 | 独立术语 ownership 决策 | 先确定三者 authority、alias、migration、consumer 和 invalidation 条件 |
| 新建 reference 文件 | 默认不实施 | 出现不可由现有文件承载的独立责任和至少一个明确 consumer |

## 十、验证合同

### 10.1 改前/改后对照 Eval

每个激活假设至少准备一个可重放 fixture，并在相同模型/宿主条件下执行：

1. 当前 source 改前运行，证明失败可复现。
2. 修改后至少运行 3 个 fresh session，避免把单次偶然命中当稳定改善。
3. 脚本记录字段、reason_code、receipt、首问和输出路径等确定性事实。
4. 独立 reviewer 盲审“是否为最高风险 WHAT gap”“是否错误放行 WHAT”等语义结果。
5. 任一指标无改善或 guardrail 回归，撤销对应增量；不以“prose 已写入”宣布完成。

| Fixture | 预期 |
| --- | --- |
| Decision Card 冲突 | checker 稳定报告确定性冲突，finalize 不产生 ready receipt |
| 高影响行为 gap + 低影响架构 HOW | 先 source-resolve / 询问高影响 WHAT gap，纯 HOW 不询问 owner |
| WHAT-affecting tech feasibility | 不得 ready；进入 source-read / ask-owner / checkpoint / revise |
| non-WHAT tech recheck | 可进入 Planning Recheck，不误阻断 ready |
| source 可解 + owner gap 并存 | source 可解项不问 owner，owner 问题绑定 write target |
| 长/高风险 PRD handoff | slice 可定位核心 R/AE、preserved behavior、blocker 与 recheck，不复制完整 PRD |

### 10.2 确定性验证

- `npm run test:eval-fixtures`。
- `node skills/spec-prd/scripts/run-evals.js --json`。
- 新 focused suite 的 checker/finalize good/bad fixture 测试。
- `npm run lint:skill-entrypoints`。
- `npm run typecheck`。
- 影响面需要时运行 `npm run test:unit`；不得在 focused gate 未恢复时用不相关绿灯替代。

### 10.3 五宿主 Source/Runtime Matrix

在临时项目目录通过 source CLI 执行显式五宿主初始化：

```text
spec-first init --claude --codex --cursor --kiro --qoder -y -u <name> --lang zh
```

| Host | 重点验证 |
| --- | --- |
| Claude | workflow references、prewrite/readiness hooks、checker/finalize projection |
| Codex | `.agents/skills/spec-prd` source projection 与 degraded hook 声明 |
| Cursor | `.cursor/skills/spec-prd` generated-runtime preview；保留 loader 未验证限制 |
| Kiro | `.kiro/skills/spec-prd` 与 steering/runtime projection |
| Qoder | `.qoder/skills/spec-prd`、prewrite/readiness hooks 与 lifecycle tests |

只修改 `skills/spec-prd/**`、templates、CLI generator 或 tests 等 source-of-truth；`.claude/`、`.codex/`、`.agents/skills/`、`.cursor/`、`.kiro/`、`.qoder/` 只通过 `spec-first init` 再生成。

## 十一、Definition of Done

- U0 已恢复且 `test:eval-fixtures` 不再引用不存在的测试。
- 每个实际实现的 U1/U2/U3/U4 都有改前失败证据、激活决策、改后结果和限制说明。
- 未复现的候选项已从实施范围删除，而不是以“顺手补 prose”落地。
- 没有新增第二套状态表、风险 enum、tech-input schema、progress artifact 或 PRD topology。
- 确定性事实与 LLM 语义判断的 ownership 清晰，checker 不越权做产品质量评分。
- Handoff Context Slice 的增量不创造新需求，不包含任务级 HOW。
- 五宿主 projection 已验证或逐宿主记录未验证原因；不得以单宿主绿灯宣称全平台完成。
- CHANGELOG 记录实际 source surface、用户可见影响、验证命令与未执行项。
- fresh-source eval 使用当前磁盘 source；若 dispatch primitive 不可用，明确记录未执行原因，不声称通过。
