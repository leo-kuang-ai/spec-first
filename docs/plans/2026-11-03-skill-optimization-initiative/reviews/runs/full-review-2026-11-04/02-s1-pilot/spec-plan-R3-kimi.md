证据收集已足够。现在输出评审报告。

# spec-plan 评审（R3）

## 逐项裁决表

| ID | 裁决 | 证据（file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | SKILL.md:17, 35-38; intake.md:157-161 | 触发条件均有真实失败来源（resume 误路由、deepen 误判、高风险漏判），未见过时或互相矛盾的补丁式规则 |
| D02 | pass | planning-evidence-boundaries.md:44-85; high-risk-plan-lens.md:5-19; structure.md:126-138 | 携带触发矩阵、reuse/extend/compose/new 姿态、反扩张判断等领域知识；脚本只管 hash/路径，语义判断归 LLM |
| D03 | pass | SKILL.md:29, 68; final-review.md:29, 36; evals/fixtures/scripts/check-product-blocker.sh | 硬出口枚举清晰、blocked envelope 固定、HTD 计数与 cross-set 对账是 producer 机械检查，eval 用 git HEAD/index 冻结硬判 planning-only |
| D04 | pass | intake.md:61-63, 73-82; spec-prd-plan-handoff-contracts.test.js:16-66; plan-handoff.md:93-98 | WHAT/HOW 边界字节保持、legacy PRD checkpoint 继承、goal 瘦目标删除测试均有 owning contract 与消费者测试钉住 |
| D05 | fail | SKILL.md:98, 108-114 vs plan-handoff.md:90-93; intake.md:54 vs 56 vs 175/177 | 读纪律、询问纪律、阻塞判断三处规则自相矛盾或三份副本，关键规则无法定位到唯一 owner |
| D06 | pass | plan-handoff.md:20; research.md:13-15, 198; deepening-workflow.md:198 | 全链 degraded envelope（capability_unavailable/unproven/authorization_missing 三类 reason_code）加 inline fallback，能力假设不外推 |
| D07 | pass | settled-decisions.md:3; evals/README.md:1-12; tests/unit/settled-decisions-contracts.test.js | 失效条件内嵌于协议（severity ladder、invalidating evidence），eval fixture 明示结构证据非行为证据 |
| D08 | partial | SKILL.md:66-68; final-review.md:70; deepening-workflow.md:3 | phase-owner 惰性加载与上下文预算纪律存在，但 D05 的重复读取指令与 gate 时机不确定性会浪费一次完整读取 |
| B01 | pass | SKILL.md:3; resume.md:27-29, 49-58; evals/cases/what-unsettled-blocks-ready.yaml:20-28 | description 携带正负触发，deepen/approach-altitude 意图门与 eval 负例齐备 |
| B02 | pass | plan-sections.md:22-64; output-contracts.md:27-29; SKILL.md:27-31 | 输入形态、readiness 值域、chat-tier 产物不冒充 unified plan 均有明确合同 |
| B03 | pass | intake.md:135-137; planning-evidence-boundaries.md:14; research.md:13 | 产品决策权限守卫逐条列举非授权信号，内嵌指令不授权，dispatch/外部访问分别授权 |
| B04 | pass | SKILL.md:62; planning-evidence-boundaries.md:20; evals/examples.json:112-116 | repo-relative 规则、generated runtime 非真相源、负例 eval 齐备 |
| B05 | fail | plan-handoff.md:20; research.md:3; final-review.md:83; deepening-workflow.md:236; eval.yaml:14-22 | 降级/重试/碰撞/中断恢复散文机制齐备，但 eval 未冻结任何失败路径，「机制存在但未触发 vs 机制缺失」在当前证据下不可区分 |
| B06 | pass | plan-handoff.md:18-24, 69; final-review.md:36; SKILL.md:118-119 | 审查强制、HTML 重试上限、降级 envelope 禁入 clean 文案、cross-set 机械对账均有 owner 与后果 |
| X01 | pass | final-review.md:130-163; deepening-workflow.md:20, 107 | 深度分级、依赖排序、1-3 specialist/section、8 specialist 总量上限约束渐进细化 |
| X02 | pass | interface-and-evolution-lens.md:7-46; intake.md:159 | 触发/负边界、greenfield/evolution 分支、canonical artifact 与验证 owner 要求明确 |
| X03 | pass | high-risk-plan-lens.md:5-19, 42-52; final-review.md:26 | 触发矩阵到落地章节映射、风险保障追踪（required/optional/deferred proof intents）齐备 |
| X04 | pass | plan-handoff.md:5; evals/consumer-replay-cases.json:14-46; resume.md:11-16 | context_facts_adapter/v1 交接合同、跨格式 replay 协议、历史补完的后继/证据规则齐备 |

## Findings

1. **P1 · 读纪律规则内部矛盾**（`skills/spec-plan/SKILL.md:98` vs `skills/spec-plan/SKILL.md:108`；`skills/spec-plan/references/plan-handoff.md:90-93`）
   - SKILL.md:98 要求 Phase 5 入口读 `final-review.md` 后即读 `plan-handoff.md`；SKILL.md:108 又要求「Immediately before final delivery…re-read `references/plan-handoff.md`」；plan-handoff.md:90-93 再以 owner 身份重复这条 re-read 指令。后果：consumer 无法确定 5.3.8 之前那次 read 是否满足「delivery 前」要求——5.3.8 文档审查发生在 read 之后、delivery 之前，gate 时机本身不确定；agent 要么读两遍整份 handoff（浪费上下文），要么赌一次 read 够用（gate 可能被跳过）。最小修复：在 SKILL.md:108 删除重复的 re-read 指令，把「delivery 前必须持有一次当前 read」的判定收敛到 plan-handoff.md:90-93 唯一 owner，并明确「5.3.8 入口处的 read 覆盖到 delivery，除非中间发生 user turn」。

2. **P1 · eval 套件未冻结任何失败/降级路径，B05 机制触发状态不可验证**（`skills/spec-plan/evals/eval.yaml:14-22`；对照 `skills/spec-plan/evals/examples.json:118-162` 的 degraded_contract 案例）
   - eval.yaml 冻结的 9 个 case 全部是授权/阻塞/路由类 happy-path-or-block 场景；examples.json 中 `dispatch-authorization-missing-falls-back-inline`、`subagent-capability-missing-falls-back-inline`、`web-capability-missing-records-research-limit`、`reviewer-partial-failure-preserves-coverage`、`mandatory-review-coverage-missing-is-incomplete` 等携带完整 degraded_contract（reason_code、forbidden_behavior、claim_ceiling）的案例只作为维护者样本存在，未进入 eval.yaml 的冻结运行集。后果：plan-handoff.md:20 的三类 reason_code、research.md:13 的 inline fallback 纪律属于「机制存在但从未被回归触发」，任何一次重构悄悄删掉 fallback 分支都不会有红灯。最小修复：把 examples.json 中至少 `dispatch-authorization-missing-falls-back-inline` 与 `mandatory-review-coverage-missing-is-incomplete` 两个 degraded 案例提升为 eval.yaml 冻结 case（rule_based 判定 reason_code 出现即可），或显式记录不冻结的理由。

3. **P2 · 同一交互/阻塞规则存在三份近似副本**（`skills/spec-plan/SKILL.md:50-52`；`skills/spec-plan/references/intake.md:54, 56`；`skills/spec-plan/references/intake.md:175, 177` 与 `skills/spec-plan/references/final-review.md:54, 56`）
   - 「一次问一个问题」「Blocking decision 先检查真实产品阻塞与当前授权」在入口、intake 两处（0.7 与 5.1.5 两处 gate 正文各含一份）重复出现且文字近似但不完全相同。后果：未来修订只改一处会产生静默漂移；consumer 无法回答哪份是 source。最小修复：把 blocking-decision 与交互规则收敛到单一 owner（建议 intake.md 或独立 interaction reference），两处 gate 只引用；这不是长度问题而是 single-owner 问题。

4. **P3 · core/08 拟议合同与现行实现的关系无显式裁决标记**（`docs/plans/2026-11-03-skill-optimization-initiative/core/08-skill-contract-protocol.md:111-146` vs `skills/spec-plan/references/plan-sections.md:22-64`）
   - core/08 为 spec-plan 拟议了 YAML 结构化输出（tech_stack config、acceptance_conditions 数量门、boundary_handling 等值门），现行实现是 prose 章节合同加 readiness 元数据，两者形状差异大；按 REVIEW-EXECUTION-WORKFLOW.md 第 2 节「拟议 YAML、数量阈值、自动重试不是默认现行合同」，本轮按现行合同判 pass，但源码侧没有任何「core/08 已裁决不采纳」的指针。后果：后续维护者可能把 core/08 误当待实施 backlog。最小修复：在 initiative 文档侧（非 skill 源码）补一行裁决记录即可，spec-plan 源码保持现状成立。

## 主责深挖面发现（B05/B06 + 归因验证）

**B05 归因结论：机制存在、样本文档化、但运行期触发证据缺失——当前不可区分「未触发」与「缺失」**。具体分层：

- 机制存在（散文层完整）：dispatch 降级三态（research.md:13、deepening-workflow.md:198）、review 不可用的一次性 bounded producer self-review 加显式 degraded envelope（plan-handoff.md:20）、HTML 两次重 compose 上限（plan-handoff.md:22）、文件路径碰撞 exclusive-create 重试（final-review.md:83、structure.md:34）、worker 启动失败的一次纠正重试与 capacity 排队（research.md:3）、OS-temp scratch 清理豁免（deepening-workflow.md:236）。
- 文档化样本存在：examples.json 有 6+ 个带 degraded_contract 的失败案例（dispatch 缺授权、capability 缺失、web 缺失、reviewer 部分失败、review 覆盖缺失），每个都带 reason_code、forbidden_behavior、claim_ceiling，且 evals/README.md:12 诚实声明「fixture pass 是结构证据，非行为证据」。
- 缺失的是冻结运行：eval.yaml:14-22 的 9 个 script-judge case 全部验证授权边界与阻塞 fail-closed（git HEAD/index 冻结是强判据），没有任何 case 以 degraded envelope 字段或 reason_code 为判定目标。按 REVIEW-EXECUTION-WORKFLOW.md 第 5 节第 4 条，本评审只能给出「机制存在但触发未验证」，不能断言机制有效。这是 Finding 2 的归因基础。

**B06 归因结论：机制存在且部分被测试钉住，成立**。

- 完整交付链：Product Contract 字节保持在 intake.md:61-63 要求、plan-handoff.md:47 在 5.3.9 复核（drift 则 block 并恢复），spec-plan-contracts.test.js:62-87 双侧钉住——生产侧与复核侧都有 owner，属于「机制存在且被触发」。
- 审查质量：5.3.8 强制审查与 confidence check 互补的理据写明（plan-handoff.md:28-30）；HTML 无审查跳径被封堵（plan-handoff.md:16）；degraded envelope 被禁止进入 clean/complete 文案分支（plan-handoff.md:69），且 SKILL.md:119 要求不得把自审描述为独立审查——误报/漏报的诚实披露有明确后果规则。
- 需求→验证可追溯：final-review.md:36 的 cross-set reconciliation 把「单元 verification 无 plan-level 命令」与「touched files 未被合同测试覆盖」定义为 producer-owned 机械检查，spec-plan-reference-contracts.test.js:69-77 有对应断言。
- 残余风险：5.3.8 审查的实际运行依赖宿主 invocation 能力，degraded 路径的「bounded self-review 不重读完整产物」纪律（plan-handoff.md:20）无 eval 冻结——与 B05 同一缺口，不重复立案。

## 未读文件

- `skills/spec-plan/references/markdown-rendering.md`、`html-rendering.md`、`frontend-engineering-lens.md`、`deepening-workflow.md` 的 5.3.6b 之后细节、`universal-planning.md:60+`、`approach-altitude.md:50+`、`synthesis-summary.md:60+`、`interface-and-evolution-lens.md:50+`、`plan-sections.md:80+`：均为条件渲染/领域 lens/模板细则，本轮裁决项（D/B/X 与 B05/B06 深挖）不经过这些分支；未覆盖后果：渲染层与前端 lens 的散文质量未裁决，对应 D05 结论不覆盖这些文件。
- `skills/spec-plan/references/agents/*.md`（16 个 worker prompt 资产）：按 research.md:11，它们是 worker seed 而非必读；未覆盖后果：worker prompt 与 5.3.4 specialist 映射的一致性未核对，若 prompt 资产与 deepening-workflow.md:111-155 的映射漂移，本轮不可见。
- `evals/output-quality-cases.json`、`evals/cases/` 中 5 个未逐个展开的 yaml、`evals/fixtures/repos/*` 内容、eval-fixture-contracts.test.js:195 附近上下文：Finding 2 的成立不依赖逐 case 内容，依赖 eval.yaml 运行集与 examples.json degraded 案例的对照，该对照已完成；未覆盖后果：单个 case 的 fixture 过期风险未排查。
- `docs/plans/.../reviews/runs/full-review-2026-11-04/evidence/input-packs/spec-plan.consumers.txt`：文件不存在（worktree 内 reviews/ 下仅有 corrections/）；改用 grep 全库得到的 tests/src 消费者清单代替，未覆盖后果：若该清单含有 grep 不可见的消费者（如动态加载），B04/D04 的消费者核对可能漏边。

## 结论一句话

spec-plan 的合同边界、授权守卫与审查闭环在散文与测试双层均扎实（18 项中 15 pass），但读纪律与交互规则存在三处互相矛盾/重复副本（D05 fail），且全部失败降级机制从未进入冻结 eval 运行集、触发证据缺失（B05 fail）——补齐 2 个 degraded eval case 并收敛重复规则前，对象结论为有条件通过，审查执行为 complete（静态层）。
