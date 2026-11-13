# spec-doc-review 全量源码审查

结论：本地不是 CE 的简单覆盖，report-only、任务包派生物 ownership、独立 dispatch 与实际 serving receipt 准入是应保留的研发增强；但 finding 语义、恢复、渲染和评测仍有明显融合缺口。优先吸收 CE 的后果准入和事实重评，而不是复制默认改文档或跨模型执行权限。状态：源码审查完成，未实施，未做独立模型/真实宿主验证。

## 覆盖与事实边界

双方包内全部文本、schema、persona、脚本、eval/fixture 已逐段全文阅读；直接 consumer、执行 handoff、shared dispatch/receipt 合同按 ledger 同 hash 记录复用或完整补读。逐文件证据见 `../file-tables/spec-doc-review.md`。本地 `.pyc` 仅为生成缓存，不作为源码阅读或行为证明。CE 路径根为 `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-doc-review/`，本地根为 `skills/spec-doc-review/`。以下路径均相对各自 Skill 根，另有标明的包外消费者。

## 双方能力与融合裁定

| 能力 | 本地源码事实 | CE 源码事实 | 研发裁定与最小建议 |
|---|---|---|---|
| Finding 准入 | `references/synthesis-and-presentation.md:21-33` 先按 anchor 分桶；schema/rubric 仍允许 nitpick 为 50/FYI，residual 可回流未确认疑虑 | 同名文件 `:17-23` 新增 3.1b：先独立确认照文档执行的实际后果，再路由；FYI/residual/deferred 同门槛 | 优先吸收。偏好、缺章节、重复描述不自动构成缺陷；有用修复不反证缺陷存在 |
| 去重与共识 | 同名文件 `:37-49` 用规范化 section+title，两个独立 reviewer 自动升一档 | one-fix-resolves-both 语义去重，保留 constituent 原始证据；仅组合证据实际满足更高 anchor 才升 | 吸收 CE；由 LLM 判断同一 remedy，不让字符串脚本代替语义。共识不创造严重性或权限 |
| 矛盾处理 | `synthesis-contradictions.md` 分歧容易一律 manual/error；以 Skip>Defer>Apply 固定排序推荐 | 先核事实，剔除错误或偏好；仅真实未决承诺交用户，技术等效项 owner 可决策 | 吸收事实优先规则，撤去固定词序代替正确性的决策 |
| 机制规模 | scope persona 引用无当下证据的 10–100x 成本差，偏向补完整；standard 最多 3 persona 未必激活 scope | scope persona `:54-67` 双向审查过度机制和必要机制遗漏；机制须由现有合同或具体高代价伤害支持；所有 plan 激活 scope lens | 吸收窄 sizing 问题到 owner/feasibility，保持 budget，不必每次增 agent。不得擅自收窄用户要求 |
| 缺细节与目标层级 | feasibility 四路径/latency target 容易按缺项报错；coherence 对 body 更细即权威；design 分数/审美易混进 finding | feasibility 以全文和既有约定能否推导为准；coherence 增加 objective 不应仅复述机制的 altitude 检查 | 窄吸收 CE；每项必须有具体后果。双方共同的审美偏好、正文细节压过上层约束、术语替换 safe-auto 不宜保留为默认缺陷规则 |
| 恢复与证据新鲜度 | intake 未规定完整 review 复用条件；R29 偏重原 quote 变化 | 同 scope/source、完整 findings/evidence/classification/decisions 才可复用；摘要不足；相关 source/约束变化即重评 | 吸收。mode 改变不重开全队；缺独立 corroboration 做不读旧结论的局部核对，不伪造独立性 |
| Withdraw 闭包 | walkthrough 已区分 Apply 导致 provisional withdrawal，但 dispatch primer 与最终报告最低字段漏 Withdraw | primer 带 user-settled Withdraw；Apply provisional 不进 rejected-class，报告含 Withdraw | 统一三个消费者。保留本地“注解只是 provenance，不是新授权或人工逐项审阅证明” |
| 可定位、幂等与输出 | 渲染时再推导 handle；Open Questions 幂等键用 raw schema 字段但显示可改写；Phase5 额外终态菜单 | reviewer 源头输出 section/ID；仅实际改名编号后重解；幂等键基于 rendered title/why；结束回 caller | 吸收定位与 rendered-key，批量分组仍逐项可见；避免结束后重复问路。不搬强制逐条等待流程 |
| 分类/readiness | intake 可因 requirements-only 仅审 Product Contract | CE 看到 implementation planning 即统一审 HOW，旧 readiness 不隐藏现存内容 | 以内容决定审查覆盖；readiness 仍决定执行资格，不因此直接放行 |
| HTML/任务包 ownership | HTML 一律 report-only，由 producer full recompose；任务包回传 JSON 三态及唯一 next owner | CE 可直接改 HTML，缺本地任务包 contract | 保留本地增强，不搬 CE native HTML edit。write-tasks 消费完整 envelope，不消费自由文本完成口号 |
| 跨模型 | runner 准入需要 serving receipt；adapter `cross-model-doc-review.sh:158` 明确失败，当前 dormant | ACP/acpx/private scratch/超时回收和共享 output-contract 更完整，但外发、工具可用性和 route-based independence 宽于本地 | 仅候选生命周期与 prompt calibration 机制；不引入 CE 的隐含外发或只读假设，不降低本地实际服务证明 |
| eval | marker judge 校验固定 SHA，有真实篡改反例；多数合同测试是字符串断言 | CE 有更完整语义与 provider 材料，但不能证明模型结果 | 保留 hash 保护；补准入/去重/恢复/幂等/后果语义的结果 eval，不能以 fixture 数冒充效果 |

## 已核实的问题与实际验证

1. **评测假阴性（confirmed）**：`evals/fixtures/scripts/check-headless-no-path.sh:10` 仍匹配 `headless mode requires a document path`；现行合同固定回执为 `Review failed: non-interactive mode requires a document path. Expected arguments: mode:non-interactive <path>`。直接把现行回执传给 judge，exit 1。证据 `../doc-review-source-probes.json`，未运行模型。应同步 judge，且补 exact 当前回执与无 persona 外部调用的真实检查。
2. **dormant adapter schema 错配（源码 confirmed，未证明当前真实 peer 丢数据）**：`scripts/cross-model-doc-review.sh:115-128` 提取 `testing_gaps`，doc schema 要求 `deferred_questions`；后者被丢弃。当前 adapter 在 serving receipt 门处退出，因此是 latent path 缺陷。prompt 未注入 persona 引用的 shared output-contract/context-slots-rules，CE 有可借机制；双方 settled context 不能仅靠模板占位符声称已传递。
3. **旧 eval 合同漂移（源码 confirmed）**：`references/cross-model-eval.md` 仍规定每 lens trio/whole-doc，与现行一个 whole-document peer、dispatch authority 和 serving receipt 门冲突。它不能证明当前独立 peer 可运行。
4. `standard-roster-budget.yaml` 主要检查 cost-shape/security 关键词，不能证明实际 persona≤3 或 conditional unique；conflict case 的词命中不证明没读取/派发；不完整 taskpack fixture 只覆盖强制 report-only，不能证明正常 taskpack 语义。

实际运行两组现有单测：`spec-doc-review-contracts.test.js`、`spec-doc-review-task-pack-contracts.test.js`，**2 suites / 53 tests 全通过**，见 `../doc-review-tests.json` 与 `.log`。它们确认结构合同和部分实际 marker 防篡改，未覆盖上述语义缺口及 judge 漂移；未执行跨模型、真实文档修改或外部连接器。

## 直接消费者与落地顺序

`spec-write-tasks/references/execution-handoff-contract.md` 要求 report-only JSON envelope、task_pack_outcome、source_plan、确定性 receipt 和 next owner 全匹配；独立的 `Review complete` 无效。`spec-work/references/shipping-workflow.md` 消费 review closure，不能把 report-only finding 当修复完成。`spec-plan/references/final-review.md` 区分 Markdown producer 明确 apply-fixes 与 HTML producer recompose；不因审查跨越 Product Contract/producer ownership。已完成 brainstorm/LFG 的同 hash consumer 核对继续有效。

最小实施顺序：先修 judge/schema/primer-report 自洽；再后果准入、证据升分与语义去重；再恢复、Withdraw、定位与幂等；最后用冻结真实研发文档比较有效缺陷、误报、漏报、往返次数及成本，决定是否调整 roster。跨模型保持 dormant，直到独立授权、实际 serving 证明与只读边界同时有可验证实现。所有建议均为本轮语义判断，不是已融合或收益确认。
