# 深度审查报告:spec-write-tasks 质量证据闭环冲刺方案

- **审查对象:** `docs/plans/2026-06-22-002-refactor-spec-write-tasks-quality-evidence-closure-plan.md`
- **审查类型:** 技术方案深度审查(结合源码 + 业界最佳实践 + 角色契约基线)
- **审查时间:** 2026-06-22 23:54
- **审查时仓库 revision:** `681ce9f0`(注:后续终审已将方案 Direct Evidence 的旧 `current_revision: 61c29f10` 拆为 `planning_snapshot_revision` 与 `current_review_revision`,避免把历史快照误读为当前事实)
- **审查者:** leokuang(主审)+ 一个独立 general-purpose fresh-source 评审者(交叉验证)
- **基线文档:** `docs/10-prompt/结构化项目角色契约.md`
- **方法:** 不采信方案自述,逐条把方案关于 `retired-skill-review` 计分的 load-bearing 断言对照真实源码与 live audit 验证;并行做一次独立 fresh-source 评审做结论交叉校验。
- **2026-06-23 修订说明:** 后续复核确认本报告事实地基成立,但两处判断表述过强:现有 contract tests 并非全是字符串断言,第一条 P1 更准确应为 P2 过度治理/边际收益风险。本版同步修正这些表述,并指向已更名的 `quality-evidence-closure` 方案路径。
- **2026-06-23 终审优化说明:** 方案已补充当前终审复核 revision 与只读审计事实;本报告保留当时审查证据,但不再把旧 `current_revision` 表述为当前字段。

---

## 一、总体结论

**有条件批准。** 这是一份对审计机制理解极其准确、自我约束意识极强的方案——它关于 scorer 行为的每一条断言都对照源码验证无误,这在计划文档里很罕见,应当肯定。R10/KTD1/KTD6 主动免疫"为分数游戏化审计",方向正确。

但方案仍需要控制边际成本:**一个被自己判定为"语义健康、仅证据不全"的 standalone skill,不应为了一个只能靠"砍文档"达成的 92 分,配套过重的 maintainer 子系统。** 在落地前建议先做三处收敛(见第五节),否则有 Goodhart 化与 evidence-theater 的真实风险。

主审独立分析与 fresh-source 评审者在 A/B/C/D/E/F 六个维度上结论一致收敛。

---

## 二、事实地基核实(全部成立)

审查没有采信方案的自述,而是直接读取 `skills/retired-skill-review/scripts/lib/scoring.js`、`lib/markdown.js`、`collect-skill-facts.js`、`write-audit-artifacts.js`,并实跑了 `node skills/retired-skill-review/scripts/write-audit-artifacts.js --repo . --target skills/spec-write-tasks`。

| 方案断言 | 源码事实(已核实) | 结论 |
|---|---|---|
| input/output/workflow 硬封顶 4 | `scoring.js:43-45` `hasSection?4:2` / `hasSection(['workflow','execution'])?4:2`,无任何给 5 的代码路径 | ✅ 成立 |
| eval_readiness 最高 4,不检测 runner | `scoreEvalReadiness`(`scoring.js:448-456`)返回值 ∈ {2,3,4},只读 `has_evals`/`eval_case_count`/`eval_has_negative_case` | ✅ 成立 |
| progressive_disclosure 阈值 | `scoring.js:442-446`:`>6000→2`;`>3000→(has_references?4:3)`;`≤3000→(has_references‖has_scripts?5:4)` | ✅ 成立 |
| est_tokens = ceil(全文件含 frontmatter trim 后字符数 / 4) | `markdown.js:43,156-160` 对 `content`(非 body)计算;实测 SKILL.md 23987 chars = 5997 est_tokens | ✅ 成立 |
| `--target` 下 governance 两维度恒 null | `write-audit-artifacts.js:62,69` mode='single' → `isRepoWideSelfAudit=false` → `skippedReport` → `scoring.js` 把 null 排除出分母 | ✅ 成立 |
| 当前 90/A-,dims 完全一致 | live audit 实测:`{spec_compliance:5, trigger_precision:5, boundary_discipline:5, input_contract:4, output_contract:4, workflow_explicitness:4, progressive_disclosure:4, eval_readiness:4, security_posture:5, runtime_governance:null, cross_host_portability:null, spec_first_alignment:5}` | ✅ 逐项吻合 |
| 确定性上限 ≈92,唯一可动维度是 U4 | 用加权公式实跑:仅 progressive_disclosure 4→5 → overall 90→92;这是 `--target` 审计下唯一能动的数字 | ✅ 精确成立 |
| `references/` 已存在,U4 仅需降 token 即可 4→5 | `skills/spec-write-tasks/references/` 实存三文件,`has_references=true` 恒成立 | ✅ 成立 |
| 官方 `.skill` packager 排除 root `evals/` | `tests/unit/spec-write-tasks-contracts.test.js:180,599` 已锁定该行为与 SKILL.md 文案 | ✅ 成立 |

**结论:方案的 Completion Criteria 与 KTD1 在数字层面诚实且可达。** 把"机械 100 不可达"写进主成功契约 R10 是正确的反 Goodhart 设计。

补充事实:`output-quality-cases.json` 当前含 `objective_assertions` 但**无** `deterministic_assertions`(U2 需新增);`tests/unit/changelog-format.test.js`、`tests/unit/eval-fixture-contracts.test.js` 均存在(closeout 引用有效);`references/task-quality-guide.md`(4849 est_tokens)、`execution-handoff-contract.md`(2091)、`task-pack-schema.md`(3977)是 U4 位移内容的接收方。

---

## 三、核心问题(按严重度排序)

### 🟡 P2 — 非计分证据存在过度治理风险,需按真实风险收敛

方案自承目标 skill 是 `semantically healthy but evidence-incomplete`(Direct Evidence / key_findings)。在 `--target` 审计口径下:

- **U4** 贡献 +2 分(唯一可动);
- **U2/U3/U5/U6/U7** 对审计数字贡献 **0**(方案自己也标注了;后续修订已把 U1+U5 合并并重排编号)。

这些单元的价值主张部分借鉴 `yao-meta-skill` 的 **release gate** 词汇(output eval / scorecard / owner cadence / portability smoke)。这类机制的设计对象偏向**团队分发 / 受治理型 skill**;而 A1 明确 spec-write-tasks **保持 standalone,不升级为 public workflow**。因此这里不是 scorer 事实错误,而是边际收益与边际成本需要重新校准。

按角色契约"用最小 durable mechanism 解决高频、高价值、真实研发问题"与"可信证据优先于自动化便利",方案需要证明这些机制拦截了真实复发缺陷,或把它们降级为 lightweight maintainer evidence。证据缺口 ≠ 真实风险;这条 finding 的目标是防止证据完整度本身推高自动化复杂度。

### 🔴 P1 — U4 是 Goodhart 风险,且唯一刹车被设为可选

progressive_disclosure 是 **token 数的代理指标**。U4 要把已瘦身的入口(5997)再砍到 ≤3000(约 -50%),而这是全盘**唯一**能动审计分的动作。把 load-bearing 的 branch decision tree / input-output 枚举 / handoff envelope 搬进 references,就能刷过阈值——但 SKILL.md 是会话启动时常驻的路由脊柱,trigger 判定发生在 references 被加载**之前**。

更危险的是:原方案 U9 的 fresh-source eval 写的是 `if substantial prose moved`(条件式),容易被实现期合理化跳过。砍 50% 必然 substantial,应强制路由级 fresh-source eval。现有测试并非全是字符串断言,还包含 package/runtime/fixture 检查;但 U4 的关键风险是瘦身后 trigger 与 routing 语义是否仍可靠,这一点不能由 prose presence 或 package smoke 单独证明。审计数字看不到的用户级 regression,恰恰敞口最大。

参照本仓 CLAUDE.md「Agent 与 Skill 变更验证」铁律:行为语义需要验证时应使用 fresh-source eval。U4 是典型的 prose 大幅位移,fresh-source eval 应当是**硬 gate 而非可选项**。

### 🟡 P2 — 最有意义的证据被允许跳过 → evidence-theater 风险

U2 的 `recorded actual task-pack output + adjudication` 是整个方案里**唯一真正运行 skill、证明真实输出质量**的证据。若它只被允许降级为 output-quality residual,就不能再声称本轮达到 evidence-complete / quality evidence closure。

结果可能是:廉价的确定性脚手架(runner / analyzer / scorecard / full stale-gate)全部建好,而唯一不可替代的真实输出证据被合法跳过——"evidence-complete"退化成"evidence-theater"。建议把"至少一条 recorded output adjudication"提为**硬完成条件**,否则 U2 的存在意义大打折扣。

### 🟡 P2 — framing 残留误导:spec_id / 文件名仍写 "to-100"

标题与正文已诚实改口为"≈92",但修订前 `spec_id: 2026-06-22-002-spec-write-tasks-quality-to-100` 与文件名 `...quality-to-100-plan.md` 仍在。略读的执行者(尤其 `$spec-work` 直接消费时)会被"到 100"误导,而真实可达是 92 且只靠砍文档。已按建议改为 `quality-evidence-closure` 口径。

### 🟡 P2 — 单元过拆,同组文件被串行链反复 re-edit

U1、U4、U5 重叠编辑同一批文件:`quality-score-contract.md`、`task-quality-guide.md`、`execution-handoff-contract.md`、`evals/README.md`、`spec-write-tasks-contracts.test.js`,却被 U1→U4→U5 的依赖链拆成三轮,对同组文件反复 churn。U1(定义证据契约)与 U5(语义证据)同属"reviewer 语义证据"族,应合并;U4 的位移内容随合并自然落位。后续修订已将原 U5 合并进 U1。

### 🟢 P3 — freshness / hash stale-gate 对单 skill 过重

U1/U2/U3 都要求 input fixture hash + runner script hash + source revision + stale-check status。对单个 standalone skill 的 maintainer 证据而言,这套 hash-pinned stale-gate 基建偏重,且 U2 runner 只对 file-backed fixture 跑结构化断言,与既有 jest contract tests 有重叠。更轻等价:既有 contract tests + 一份带日期、source revision 和"按需重跑命令"的 scorecard,只对 recorded output/source plan 等 load-bearing artifact 做 targeted hash。

---

## 四、方案做得好的地方(应保留)

- **反 Goodhart 元意识到位:** R10、KTD1、KTD6、风险表首行都在主动免疫"为分数游戏化审计",不是天真的指标驱动。
- **source/runtime 边界纪律严格:** KTD4/KTD7、A2/A3 把 maintainer assets 放在 skill root 外、不手改 generated mirror,完全符合契约。
- **large-plan handling 正确降级为 follow-up**,并要求代表性 fixture / recorded output 先证明行为收益再进 source,是正确的克制。
- **portability 证据诚实:** `not_checked_with_reason` 记为 residual 而非 pass,不虚报跨宿主覆盖。

---

## 五、收敛建议(落地前)

1. **重新定位为"按真实风险分级的证据闭环",而非"审计维度全覆盖"。** 显式区分:U4(真实降低 context 成本,留)、U2-recorded-output(唯一真实质量证据,**提为硬条件**)、U3/U5/U6(对 standalone skill 是否真有高频风险?降级为 advisory 或合并)。不要为 standalone skill 套完整团队 release gate。
2. **U4 把 fresh-source 路由 eval 设为硬 closeout 条件**,而非条件式可跳过步骤。砍 50% 入口必须用全新 subagent 或等价 fresh read-only reviewer 验证瘦身后 SKILL.md + references 的路由不退化;如果宿主不可用,记录 `fresh_source_eval: not_run` 和原因,不能声称通过。
3. **对齐 framing 与拆分:** 改 spec_id / 文件名 / 标题到 92 / quality-evidence-closure 口径;合并 U1+U5;把 stale-gate 降为带日期、source revision、rerun command 和 targeted hash 的轻量 scorecard。

---

## 六、最危险的被低估 / 漏掉风险

1. **入口砍半的路由回归无法只靠 contract/package/runtime smoke 证明。** U4 必须有 fresh-source eval 状态;审计数字看不到路由退化,这是用户级 regression 的最大敞口。
2. **最有意义的证据不能被降级后仍声称完成。** U2 的 recorded real output + adjudication 需真正跑 skill;若产不出,本轮只能叫 `partial_evidence_closure`,不能叫 quality evidence closure。

---

## 七、验证与限制

- **已执行:** 直接读取 scorer / estimator / collector / audit driver 源码;`node skills/retired-skill-review/scripts/write-audit-artifacts.js --repo . --target skills/spec-write-tasks` live audit(实测 90/A-,dims 逐项吻合);加权公式实跑确认 90→92 仅由 U4 驱动;核实 packager `evals/` 排除测试、eval fixture 当前形态、closeout 引用的测试文件存在性、references 目录与各 reference est_tokens。
- **并行交叉校验:** 一个独立 general-purpose fresh-source 评审者读取方案 + 角色契约后独立给出 A–F 结论,与主审收敛。
- **未执行:** 未实跑 U2 设想的 output eval runner(尚不存在);未对瘦身后的 SKILL.md 做 fresh-source 路由 eval(SKILL.md 尚未瘦身,属实施期验证);未实测跨宿主 runtime projection。
- **评审性质:** 本报告是 reviewer 语义判断证据,非 source 变更,不改任何审计分数,不构成 gate。
