材料已读齐（SKILL.md、6 份 references、检查表、合同基线、10 个消费者测试、evals 与上游引用面）。按格式输出裁决。

# spec-debug 评审（R3）

## 逐项裁决表

| ID | 裁决 | 证据（file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | SKILL.md:57-65, :52-54 | 红旗表标注为注意力提醒非硬 gate，预测要求限定于"uncertain links"，未见过时约束堆叠 |
| D02 | pass | investigation-techniques.md:326-344, anti-patterns.md:11-23, defense-in-depth.md:17-26 | Bug-class 模式清单、好/坏预测对照、四层纵深均为领域知识；脚本草图服务于观察值捕获而非流程控制 |
| D03 | pass | SKILL.md:299-325, :19; tests/unit/spec-work-shipping-contracts.test.js:102-111 | 结构化 verification closeout 有 owning CLI（`verification-run-summary record`/`honest-closeout validate`），failed/not-run 不得软化为 prose |
| D04 | pass | SKILL.md:21, :189-192, :253-257; spec-work-lfg-recovery-contracts.test.js:58-69 | 消费者声明一致；`fixed-not-pushed` envelope 与 LFG watch 消费合同逐字对账 |
| D05 | pass | SKILL.md:15-21, fix.md:1-19; spec-debug-fix-reference-contracts.test.js:7-18 | 入口保留触发条件、机制下沉 reference，分工有契约测试锁死；规则可定位 |
| D06 | pass | SKILL.md:223-227, :291; pipeline-return.md:8-18 | 并行 probe 走 `worker_dispatch_*` 授权/能力探测并降级 ranked-sequential，模型假设显式且含降级路径 |
| D07 | pass | SKILL.md:356-368; evals/examples.json:11-42 | 学习捕获分三级且有"机械修复默认跳过"反囤积规则；5 条 eval example 均锚定历史真实失败 |
| D08 | pass | SKILL.md:85, :168, :176, :244, :290-293 | 各 reference 均按 Phase/条件加载，无整库预读 |
| B01 | pass | SKILL.md:3, :27; using-spec-first/SKILL.md:26; spec-work/SKILL.md:3 | description 含正触发与负路由（spec-work)；入口治理与 spec-work 回流边界一致 |
| B02 | pass | SKILL.md:16-21, :39-44; evals/eval.yaml:3-8 | 输入/输出/硬出口/权威/消费者五要素齐备；eval.yaml `environment: none` 属诚实标注的非隔离运行 |
| B03 | pass | SKILL.md:239, :342-354; pipeline-return.md:8-18 | Fix-it-now/commit/landing 三层授权分离；mode token 明确不扩权；材料内嵌指令不产生授权 |
| B04 | pass | SKILL.md:89; scenario-capability-matrix-contracts.test.js:28-38 | source/runtime 边界显式；Scenario Capability 段与 owning matrix 逐字同步且有消费者测试 |
| B05 | fail | SKILL.md:271-272（缺 limitation 字段）, :259-273（摘要模板无 workflow 中断/复跑指引）; 对照 spec-lfg-recovery 测试 | 运行级失败隔离完备，但"workflow 自身中断后如何恢复/复跑"无任何机制（无 durable progress state、无 resume 指引），`claim_limitations` 的枚举在 B06 深挖确认不完整 |
| B06 | pass | SKILL.md:175-187, :259-273, :297-325, :279-295 | 完整交付链（findings→post-fix tail→residuals→re-verify→closeout）逐级可追溯，finding 带位置与后果，完成披露结构化 |
| X01 | not-applicable | SKILL.md:77（无阶段跳过声明） | 单 bug 调查非多模块长任务编排；跨子系统场景已由边界插桩与智能升级覆盖，不要求独立编排机制 |
| X02 | not-applicable | 全文检索无 API/schema/版本迁移面 | spec-debug 不拥有对外接口演进职责；其 envelope 兼容性由消费者测试承担 |
| X03 | pass | SKILL.md:40-44, :285-295, :342-354 | high-risk override 显式；敏感面（auth/persistence/concurrency）触发强制 simplify+review；P0/P1 residual 阻断自动 PR |
| X04 | pass | SKILL.md:252-257, :356-368; pipeline-return.md:34-53 | pipeline-return envelope 带 evidence refs/limitations/residuals；needs-human 决策保留完整 source set |

## Findings

1. **[B05] 结构化摘要的 `claim_limitations` 模板枚举不完整（P2）** — 位置：SKILL.md:271-272。模板行 `**claim_limitations**: [not-run, missing evidence, bounded coverage, or none]` 未列 `diagnosis-only-no-post-fix-verification`，而 :275 的 diagnosis-only 路径明确要求填入该值。模板是模型生成 envelope 时的第一参照，枚举缺项会导致填自由文本或漏填。最小修复：在模板行补上该 reason_code。此条同时是 B05 深挖发现的锚点之一。

2. **[B05] spec-debug 无 workflow 自身的中断恢复机制（P2，诚实缺口而非缺陷外推）** — 位置：SKILL.md:299（run-id 仅创建于修复尾声的 closeout）。排障会话天然长（多假设、环境检查、bisect），LLM 上下文截断或会话中断后，调查中间状态（已排除假设、插桩位置、pre-fix scope）只存在于 transcript，无 durable 落点；SKILL.md 全文与 6 份 references 均无 resume/recovery 指引。对照：spec-work 有 append-only `state/<generation>.json` + `expected_sha256` + `run-source-drifted`（spec-work-lfg-recovery-contracts.test.js:18-28）。spec-debug 在 Phase 4 之前没有任何等价物。最小修复建议：在 Phase 3 workspace-check 段落（SKILL.md:242 已记录 pre-fix scope）补充一句"中断恢复经 spec-handoff 承接"，或显式声明该缺口为已接受的 degraded 并给出重估条件；保持现状也成立——排障证据可从头重跑，状态陈旧风险低于 spec-work 的多任务运行——但当前文本未做任何声明。

3. **[D05] SKILL.md:244 与 fix.md 分工的微小叙述重叠（P3）** — SKILL.md:244 说 fix.md "owns ... the required verification/self-review sequence"，同时 Phase 3 的 :246 又把命令证据保留义务重复陈述一遍（与 fix.md 第 7 步内容一致）。重复有测试锁定（spec-work-shipping-contracts.test.js:102-111 检查入口侧字符串），不构成矛盾，但读者需读两处才能拼全证据义务。保持现状成立：契约测试正是为防止漂移而要求两侧各自出现关键词，重复是刻意的防御性冗余。

4. **[X03] `foreign-residual-workspace` override 的执行依赖未在主文本指明（P3）** — SKILL.md:42 声明 `blocked-action-required`，但"named cleanup/init action"具体指什么（`spec-first clean`/`spec-first init`）只在 CLAUDE.md 层级可知，SKILL.md 本身不点名。低风险（排障者通常会自然找到 init），可不改。

## 主责深挖面发现（B05/B06 + 归因验证）

**B05 失败恢复隔离——分层结论：**

- *工具/命令层：完备。* 干跑与缺工具显式记 `not-run + reason_code`（SKILL.md:301-303）；失败修复须显式作废假设、三次失败触发智能升级且禁止同理论变体重试（fix.md:15）；probe 发射失败一次性纠参、零容量转有界串行（SKILL.md:227）。
- *工作区层：完备。* dirty overlap 须 owner 决策或有界保全策略（SKILL.md:240）；stash 实验须记录对象、含 untracked、恢复验证且绝不自动解决用户冲突（investigate.md:63）；bisect 限隔离 checkout 且必 reset（investigation-techniques.md:83）；未知副作用先查状态（SKILL.md:299 "after every fix-owned mutation has stopped" 前置条件）。
- *workflow 自身层：缺口（即 Finding 2）。* 这是 B05 判 fail 的唯一原因：三个层次中两层满分，但检查表 B05 明确列"中断恢复"为判据，而排障这一最可能长跑的 workflow 恰恰没有恢复面。
- *归因复核：* 此缺口不是"机制存在但没触发"——全文检索确认机制本身缺失（无 state 文件、无 resume 段落、无 spec-handoff 移交语）。归因：Skill 设计层缺口，非模型/工具问题；历史归因中未见此条被登记过，属新发现而非旧归因修正。

**B06 完整交付审查——结论：完备。**

- 可追溯链：causal chain（file:line 引用，SKILL.md:179)→ findings 先于任何提问呈现（:187)→ test-first 修复（fix.md:1-13)→ post-fix tail（简化→审查→residual→复验，:279-295)→ 结构化 closeout（:297-325)→ 授权分离的出口（:342-354)。
- 误报/漏报防护：proof-test 保护防 simplify 误删回归证据（:289）；脏分支禁止 review 扩面并强制记 `Code review: targeted manual due to unrelated branch work`(:291)；未跑成的审查不得冒称独立覆盖（:291 尾句）。
- 完成披露：`not-run`/`failed` 不得软化（:303）；diagnosis-only 显式禁伪造 verdict(:275)；首轮失败与最终结果分列的要求由 closeout 命令证据天然承载（每条命令独立 `ran`/exit code)。
- 对既有 findings 的归因复核：消费者测试覆盖面与 SKILL.md 承诺逐项对账无错位；examples.json 的 5 条 case 与 SKILL.md 当前文本逐条核对仍成立（source_ref_authority: source，evals/examples.json:10），未发现失效旧归因。

## 未读文件

- `skills/spec-debug/evals/fixtures/scripts/check-diagnosis-no-fix.sh`、`check-fixed-no-commit.sh`、`check-prior-attempt-ask.sh`、`check-r2-prior-ask.sh`、`asks-a-question.sh`：judge 脚本的行为语义已由 spec-debug-judge-calibration.test.js（正反例共 10 组断言）间接覆盖，逐行读 shell 对静态合同裁决增量有限。未覆盖后果：judge 脚本自身若有过严/过松断言，本轮只能从校准测试的反例推断，不能逐行证实。
- `skills/spec-debug/evals/fixtures/repos/mini-ledger/*`（server.js、prepare-eval.cjs、package.json、README.md）：fixture 内容，其角色已由 eval case 与校准测试界定。未覆盖后果：fixture 与 SKILL.md 承诺的语义匹配度未独立核对。
- `docs/contracts/workflows/scenario-capability-matrix.md` 全文：只经 scenario-capability-matrix-contracts.test.js:20-37 的断言间接核对三个 override 与 SKILL.md 的同步性。未覆盖后果：matrix 内 spec-debug 未声明的其他 scenario 行是否应适用，本轮未判断。
- `docs/contracts/verification/verification-run-summary.md`、`docs/contracts/workflows/honest-closeout.md`：closeout CLI 的 owning contract 文档未读，SKILL.md:307-323 的命令调用面与合同文档的字段级一致性未核对。未覆盖后果：若合同文档已演进出 SKILL.md 未引用的必填字段，本轮不可见。

## 结论一句话

spec-debug 静态合同整体成立：17 项 pass、1 项 fail——唯一实缺是 workflow 自身的中断恢复面（B05），外加一个 `claim_limitations` 模板枚举缺 `diagnosis-only-no-post-fix-verification` 的 P2 模板错漏，两者均为最小修复可闭合的局部缺口，不撼动排障主链路的授权分离、证据闭环与消费者合同一致性。
