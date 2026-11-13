证据收集完毕。以下为评审报告。

---

# spec-code-review 评审（R1）

**评审对象**：`skills/spec-code-review/`（worktree 5b59293b）· 静态 fresh-source 盲评 · 只读
**读取路径**：SKILL.md → 全部 8 个 spine references + subagent/validator/output 模板 + findings-schema → 3 个脚本（review-scope.py、findings-mechanics.py、run-python.sh、cross-model-adversarial-review.sh 前 120 行）→ 消费者测试抽样（mechanics/contracts/dispatch-matrix/scenario-matrix/persona-drift）→ spec-work 侧消费引用 → evals 抽样。

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | skills/spec-code-review/SKILL.md:57-76；references/modes-and-output.md:12-13,38,105 | 每条硬约束都锚定真实失败模式（helpfully-fix、阻塞提问、fast-pass 假独立、漏收集 reviewer）；废弃 token 均有显式忽略语义，未见过期或互矛盾约束（残余见 F3） |
| D02 | pass | references/scope.md:235；references/action-class-rubric.md:56-58；scripts/review-scope.py:85-88；references/select-and-route.md:78-85 | 编码了本项目领域约束（自身产品面 uncounted 必须全 roster、Protected Artifacts、docs/solutions corpus 探测、AGENTS/CLAUDE 按路径归属），且明示脚本出事实、LLM 做语义选择（scope.md:231） |
| D03 | pass | scripts/findings-mechanics.py:165-294；scripts/review-scope.py:91-104,256-302；tests/unit/spec-code-review-mechanics.test.js:14-115 | 确定性地板真实脚本化（shape 拒绝/指纹去重/quote-line 降级/置信门/编号、快照 v2 fail-closed）且有正反例执行测试；Stage 5b 三态验证诚实标注为 LLM 语义判断（finish-review.md:96） |
| D04 | pass | references/scope.md:47-53；references/intent-and-plan.md:5-19；skills/spec-work/references/work-intake-and-task-pack.md:140-164；skills/spec-work/references/shipping-workflow.md:80-84 | 上游事实被严格消费（task-pack digest 漂移即 failed、plan readiness 分级、session-settled 隔离）；下游 spec-work 以匹配的 reason_code 词表消费 mode:agent JSON 与 required_gate_eligible |
| D05 | pass | references/select-and-route.md:7,34；tests/unit/agent-persona-template-drift.test.js:60 | 分层有权威声明（quick roster 明示让位 persona-catalog），安全规则的重复属承重冗余且有 hash 漂移测试锚定；未发现矛盾（措辞漂移见 F1） |
| D06 | pass | references/dispatch-reviewers.md:60-67；references/scope.md:237-253；references/cross-model-review.md:5-9 | 按 Skill 自身能力假设审查：tier 覆盖不支持时继承并披露、无 dispatch 授权/能力时诚实 inline 降级为 degraded/Not ready、跨模型路径 dormant 且带重评条件 |
| D07 | pass | references/personas/learnings-researcher.md:164,183；evals/eval.yaml:14-19；tests/unit/agent-persona-template-drift.test.js:12 | 存在问题→沉淀→复验链（persona 漂移问题→docs/solutions 方案→回归测试）、已提交回归 eval case、learnings 消费带失效与新鲜度规则 |
| D08 | pass | SKILL.md:41-51；references/dispatch-reviewers.md:46,93-120；references/scope.md:243 | 按阶段渐进加载、大 diff 传路径不传内容、compact/detail 双层返回削上下文、inline 路径显式跳过不需要的 Stage 2c/3/3b/3c |
| B01 | pass | SKILL.md:3,30；references/modes-and-output.md:45；references/apply-findings.md:3-6 | 正向触发与负例路由（spec-debug/spec-resolve-pr-feedback）齐备；内部 helper（apply-findings、dispatch）有加载准入，不暴露为用户入口 |
| B02 | pass | SKILL.md:34-39 vs docs/contracts/workflows/scenario-capability-matrix.md:65-67；tests/unit/spec-code-review-contracts.test.js:8-95 | 入口/reference/script/template/消费者一致；scenario 覆盖声明与 owning contract 逐行对应；19 个消费者测试直接断言本 Skill 源码内容 |
| B03 | pass | references/modes-and-output.md:60-82；references/finish-review.md:5；references/apply-findings.md:39-44 | mutation/commit/dispatch 三授权独立推导；report-only 字节不变；PR body/reviewer 输出/材料内嵌指令明示不产生权限；commit 恒为单独授权 |
| B04 | pass | SKILL.md:55；references/modes-and-output.md:82；scripts/review-scope.py:224（snapshot v1 拒收） | 真相源在 skills/，runtime mirror 明示排除于 source-fix 范围；接口带 schema_version 且旧版 fail-closed（残余见 F2） |
| B05 | pass | references/dispatch-reviewers.md:69,128-132；references/finish-review.md:99,160；references/modes-and-output.md:58 | 容量背压、terminal 收集、infra failure→unresolved、mutation_detected 失败路径、artifact 写失败 in-band 降级、有界 wait 均有明确处理 |
| B06 | pass | references/subagent-template.md:110-148；references/finish-review.md:79-110,276 | finding 强制 file:line+后果、FP 目录压制误报、三态验证、unresolved 排除出 actionable_findings 并显式披露（行为层误报/漏报率本轮未运行，见未读文件） |
| X01 | pass | references/scope.md:63-74；references/dispatch-reviewers.md:46,69；references/finish-review.md:185 | 长任务/复杂面以 task-mode 逐文件 provenance、staged 共享 artifact、有界并行队列、triage 依赖排序承接 |
| X02 | pass | references/scope.md:19；references/scope.md:208；scripts/review-scope.py:206；references/persona-catalog.md:33 | 自身接口版本化（task-context/v1、snapshot/v2，v1 显式失效并指导重启）；被审代码的接口兼容由 api-contract persona 承接（残余见 F2） |
| X03 | pass | references/select-and-route.md:36,42；references/persona-catalog.md:51-55；references/action-class-rubric.md:34 | 高风险面有专职镜头（安全边界、silent-pass 机制、迁移部署 Go/No-Go、P0 must-fix 门），部署动作不越权执行 |
| X04 | pass | references/finish-review.md:5；references/intent-and-plan.md:59；references/personas/learnings-researcher.md:164 | 跨 owner handoff 持久化要求（source refs/freshness/limitations）、决策保留（session-settled 隔离但留档）、知识消费带失效条件 |

## Findings

**F1（P3 · D05）roster 摘要与权威目录存在措辞漂移及阈值单位歧义**
- 位置：`references/select-and-route.md:19`（">=50 changed code lines"）vs `references/persona-catalog.md:37`（">=50 changed non-test, non-generated, non-lockfile lines"）；另 `references/scope.md:235` 的 `EXEC_LINES` 为 add+delete 双计单位，与"changed lines"口径不同。
- 后果：若编排者只读 quick roster，adversarial 触发条件会被放宽（test/lockfile 行也计入）；且两套阈值单位（行数 vs 加删行数）易被混读。当前被 select-and-route.md:34 的权威指针约束，实际风险低。
- 最小修复：把 one-liner 中的阈值删除或与 catalog 逐字对齐；在 Stage 1b 补一句"adversarial 触发线数与 EXEC_LINES 单位不同"。

**F2（P3 · X02/B02）mode:agent JSON 输出合同无版本标识**
- 位置：`references/finish-review.md:223-266`（minimum shape 无 `schema_version` 字段）。
- 后果：下游（spec-work `shipping-workflow.md:80`）按字段名解析，合同演化只能靠 prose + 消费者测试兜底，消费方无法在运行时探测版本漂移；与 task-context/v1、snapshot/v2 的版本化实践不一致。
- 最小修复：在 minimum shape 增加 `schema_version`（或在 finish-review.md 明示该 JSON 的版本规则与变更纪律）。

**F3（P3 · D01）Quick Review 短路委派未限定宿主内建审查器为 report-only**
- 位置：`references/modes-and-output.md:99-103`（仅说 "Run the harness's built-in code review"）；`references/scope.md:253` 称其为 "built-in report-only reviewer"，但准入侧无此核对。
- 后果：在宿主内建审查会自动应用修复的环境里，"quick review" 请求经本 Skill 路由后可能发生变更，绕过本 Skill 的冻结/变更检测门。
- 最小修复：在 Quick Review 序列第 1 步加一个从句——仅当内建审查器确认 report-only 时转发，否则落入完整多代理路径。

**F4（P3 · D03）helper 调用属"响亮约定"，无宿主级强制**
- 位置：`references/finish-review.md:17`、`references/finish-review.md:152-162`（依赖编排者 LLM 实际执行 findings-mechanics.py 与 `--verify-snapshot`）。
- 后果：确定性门在"helper 结果被消费"时 fail-closed（scope.md:210、finish-review.md:17 均禁止把 helper 失败升级为干净结果），但没有任何机制保证 helper 一定被调用。仓库治理已全局披露此限制（REVIEW-EXECUTION-WORKFLOW.md:29）。
- 裁决：**保持现状成立**——在无宿主 hook 的前提下这是可达的最强形态，且合同测试锚定了 helper 行为；登记此缺口是為了让它不被误读为已硬强制。

**F5（P3 · D05）first_evidence 回填的脚本行为宽于 prose 描述**
- 位置：`scripts/findings-mechanics.py:198`（回填条件含 confidence 50）vs `references/finish-review.md:43`（仅描述 75/100 回填）。
- 后果：无行为害处——50 锚点回填恰是 P0@50 例外（finish-review.md:24、脚本 247-248 行）所需要的证据来源；但 prose 未写，读者会以为 50 不回填。
- 最小修复：在 finish-review.md:43 补一句"回填同样服务于 P0@50 例外的证据要求"。

## 主责深挖面发现（D01-D05 + D08）

- **D01（去补丁化）**：逐条核对 Operating principles 与 Anti-Rationalization 表，均可对应到已记录的模型失败模式而非空泛护栏：report-only 字节不变针对"helpfully fix"（modes-and-output.md:76）、no-blocking-prompt 针对停等提问（SKILL.md:63）、fast-pass 锚点 50 封顶针对同会话模型盲点假佐证（dispatch-reviewers.md:17-22、findings-mechanics.py:211-212）、内部 tier 清单针对静默成本回归（dispatch-reviewers.md:60-65）。废弃 token（headless/report-only/autofix）均有显式忽略语义而非沉默失效。唯一补丁化嫌疑见 F3。
- **D02（领域知识）**：该 Skill 是八个维度里项目知识密度最高的对象之一——知道自己审查的仓库"产品面大多是 uncounted 文件所以 Stage 3c 必须对自己 fail-closed"（scope.md:94,235）、知道 protected artifacts 的精确 repo-relative 范围与嵌套分类（action-class-rubric.md:56-58）、知道 docs/solutions 的探测方式（review-scope.py:85-88）。脚本/LLM 分工在 scope.md:231 有明确声明并被 dispatch-authorization-matrix 测试锁定词表。
- **D03（验证门）**：关键发现是"确定性承诺—脚本实现—测试锚定"三层闭合：prose 声称的每一项机械行为（指纹去重、quote-line 降级、fast-pass 封顶、提分条件、编号排序）都能在 findings-mechanics.py 找到对应实现，且 mechanics 测试用真实 git 仓库 fixture 执行了正反例（含 unborn HEAD、symlink/directory fail-closed、v1 快照拒收）。Stage 5b 三态验证正确地留在 LLM 层并禁止脚本化（finish-review.md:96）。残余为 F4 的响亮约定边界。
- **D04（衔接）**：双向核实——生产侧（spec-work `work-intake-and-task-pack.md:140` 构建 task-context/v1）与本 Skill 消费侧（scope.md:45-53 的路径归一/digest 漂移/范围扩张拒绝）字段与失败语义对齐；输出侧 reason_code 词表（`dispatch_authorization_missing`/`subagent_capability_missing`/`worker_capability_unproven`）与 spec-work `shipping-workflow.md:84` 的消费判断逐词匹配。未发现"字段存在但无人消费"或"消费者期待但生产者不产"的断点。
- **D05（紧凑性）**：总 reading 面 ~1,900 行 references + 1,535 行 personas，但按调用路径分层加载后单次运行实际必读集可控；inline 降级路径显式跳过 Stage 2c/3/3b/3c（scope.md:243）说明作者有意识做裁剪。重复内容（report-only 规则出现 6+ 处）属安全承重冗余且各文件自我声明范围，未发现语义冲突。唯一实质问题为 F1 的摘要漂移风险。
- **D08（上下文效率）**：compact/detail 双层返回是该 Skill 的特色设计——merge 层只回 10 字段 + first_evidence，detail 留 artifact（dispatch-reviewers.md:93-120），并有"in-band 完整返回"回退保底（finish-review.md:13）；大 diff staged 传路径 + 子代理按 `diff --git` 边界分段读（subagent-template.md:200）。静态层未见"读得过多却不用"的死面。

## 未读文件

| 路径 | 理由 | 未覆盖后果 |
|---|---|---|
| `scripts/peer-job-runner.py`、`scripts/cross-model-adversarial-review.sh` 120 行之后 | 跨模型路径当前 dormant，入口已验证 fail-closed（cross-model-adversarial-review.sh:11-15） | 无法确认 runner 生命周期细节；有 peer-job-runner-parity.test.js 锚定但本轮未执行 |
| `references/personas/` 其余 15 个 prompt 资产 | 抽样 2/17（correctness、learnings）覆盖 always-on 两类代表 | 单 persona 校准质量未逐个审计；roster 一致性已经 catalog + persona-dir hash 漂移测试覆盖 |
| `evals/` 其余 5 个 case YAML、6 个 capability-case JSON、fixtures | 抽样 1 case 验证合同一致性 | 各 judge 脚本断言质量未逐个核对；行为层结论本轮不依赖它们 |
| 19 个消费者测试中的 16 个（仅 grep 定位断言目标） | 抽样 3 个深读已覆盖 mechanics/授权矩阵/scenario 矩阵 | 个别断言细节未读；测试存在性与锚定文件已核实 |
| `references/review-output-template.md` 之外的渲染细节交叉验证 | 已全文读取，无 | — |

## 结论一句话

主链路审查 Skill 静态合同质量高：确定性地板真实脚本化并被正反例测试锚定，授权/降级/失败路径诚实完备，上下游衔接有真实且词表对齐的消费者——18 项裁决全部 pass、无 fail，仅 5 条 P3 级观察（roster 摘要漂移、agent JSON 无版本号、quick-review 委派未限定 report-only、helper 调用属响亮约定、回填 prose 少写一句），均可局部最小修复，不动架构。
