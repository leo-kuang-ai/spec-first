# spec-doc-review 评审（R3）

## 逐项裁决表

| ID | 裁决 | 证据（file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | references/subagent-template.md:52（FP catalog）、references/synthesis-and-presentation.md:25/107、SKILL.md:42-54 | 约束分层清晰（spine 硬约束 + lazy cold-path + STOP 锚点），未发现相互矛盾或过度指导的残留补丁；长度只作诊断有 cost-shape advisory（persona-selection.md:31-39） |
| D02 | pass | references/personas/coherence-reviewer.md:31-50（owning safe_auto patterns + strawman-resistance）、findings-schema.json、scripts/cross-model-doc-review.sh:159-164 | 领域知识以 persona 资产 + 8 条 document-type 适配承载，脚本只做确定性校验（receipt/hash/schema），语义判断全在 LLM 侧 |
| D03 | pass | references/task-pack-review-lens.md:12-38（deterministic intake floor）、references/synthesis-and-presentation.md:13-17（validate）、evals/fixtures/scripts/check-*-marker.sh | 验证门明确分层：CLI validator floor、schema validation、byte-preservation judge 各自独立，未把语义判断冒充机械判定 |
| D04 | pass | tests/unit/spec-doc-review-task-pack-contracts.test.js:72-92（write-tasks handoff contract）、skills/spec-plan/references/plan-handoff.md:13-69（producer 降级/重消费契约）、synthesis-and-presentation.md:141 | 上下游 consumer（spec-plan、spec-write-tasks）有字节级 handoff contract 和 fail-closed 字段校验，链路边由 owning contract test 锁死 |
| D05 | pass | SKILL.md:42-54（SKILL.md 仅 75 行 + 条件加载）、references/rendering-floor.md（单一渲染真相源被 5 个 surface 引用，review-peer-expansion-contracts.test.js:19-28 验证） | 紧凑性好：SKILL.md 只做路由，规则单一归属（rendering floor / intake / dispatch 各自 own），可定位性由 contract tests 保证 |
| D06 | pass | references/dispatch.md:7-13（capability_probe/worker_context_isolation/worker_model_override 三态）、cross-model-review.md:14-16（serving receipt degraded→拒绝 admission） | 能力假设显式三态建模，不支持时诚实降级（inline fallback + isolation=degraded_inherited + reason_code），peer 侧在 receipt unverified 时 fail closed |
| D07 | pass | references/synthesis-multi-round.md:6-17（R29/R30）、evals/（6 个行为 case + 2 组 JSON case）、walkthrough.md:223-225 | 有真实的失败→修订链证据（multi-round suppression、provisional withdrawal 规则），eval case 可失效可复跑；知识以 contract test + eval 沉淀 |
| D08 | pass | references/dispatch.md:19-21（section slices + anti-waste rule）、task-pack-review-lens.md:44（有界读取 source plan）、document-intake.md:75-79（reuse 前置重读） | 按需加载与 anti-waste 规则明确且可定位；复用有 freshness 前置条件 |
| B01 | pass | SKILL.md:1-5（frontmatter description 含正向/负向触发）、references/modes.md:7-25（flag 解析 fail closed）、references/document-intake.md:15 | 入口职责清晰，task-pack/统一工件/legacy 三类输入各有路径；误触发由分类规则与 missing-document gate 防护 |
| B02 | pass | references/findings-schema.json:6-117、synthesis-and-presentation.md:134-246（text/JSON envelope 双形态）、references/dispatch.md:19（模板变量清单） | 输入输出 schema 明确且被 contract test 逐字段锁定；来源与 readiness 在 intake/lens 中显式区分 |
| B03 | pass | SKILL.md:24（default-report-only）、dispatch.md:9（direct invocation 不授权 dispatch）、synthesis-and-presentation.md:114-120（report-only 阻断所有写路径）、tests/unit/mutation-authority-contracts.test.js:70-77 | 授权边界是全仓最严的一档：只读默认、dispatch/mutation/HTML/peer 四道独立 gate，材料内嵌指令不扩权 |
| B04 | pass | tests/unit/command-resource-path-rewrite.test.js:67-228（source→runtime 投射测试）、tests/unit/peer-job-runner-parity.test.js:12-17（三 skill runner 字节一致） | 真相源在 skills/，runtime 投射由 CLI 测试覆盖；peer runner 跨 skill 字节一致性有 parity test |
| B05 | pass | references/dispatch.md:11/45-50（backpressure/失败语义/inline fallback）、open-questions-defer.md:83-111（失败路径三选项 + 默认 B）、walkthrough.md:244（中断丢弃内存状态）、task-pack-review-lens.md:28（deterministic failure 不 dispatch） | 失败/恢复/隔离覆盖最全：超时、部分成功、并发写冲突、会话中断、capability 缺失各有命名路径与 reason_code |
| B06 | pass | references/subagent-template.md:56（evidence 强制引用）、rendering-floor.md:25-52（decision-first 字段序）、synthesis-and-presentation.md:19-23（3.1b consequence admission）、walkthrough.md:272-301（完成报告含失败 bucket） | 审查质量机制完整：finding 必带位置与后果、误报有 FP catalog、漏报有 always-on 双 reviewer 兜底、未完成有 incomplete/limitations 披露 |
| X01 | pass | references/dispatch.md:11（bounded parallelism + 队列）、task-pack-review-lens.md:52-56（dependency/wave truth lens） | 多 reviewer 长任务有界并行与 backpressure 处理；task-pack 长链路由 wave/dependency lens 覆盖 |
| X02 | pass | SKILL.md:9/16（task-pack/source-plan drift 为 hard exit）、task-pack-review-lens.md:20-28（hash/identity/validity 校验） | 版本/接口变化有 stale_hash、wrong-chain、drift 检测与 fail-closed 路径 |
| X03 | pass | open-questions-defer.md:75-81（写前重读 + mtime 冲突检测）、synthesis-and-presentation.md:263（Apply 后 R30 复验）、cross-model-doc-review.sh:11-15（serving 未认证拒绝启动） | 高风险写操作（文档编辑/peer 启动）有验证对账与回退语义 |
| X04 | pass | references/dispatch.md:25-43（decision primer 跨轮累积）、synthesis-multi-round.md:7-11（抑制已决事项）、document-intake.md:77（reuse 需完整 evidence） | 多轮协作有决策保留与 freshness 边界；跨会话持久化显式声明 out of scope |

## Findings

1. **JSON 渲染字段粒度过宽（P3）** — 位置：`references/synthesis-and-presentation.md:246`。`fixes_applied` 与 `applied_fixes` 规则覆盖 text/JSON 双形态且含 `markdown-write + output:json` 的明细要求，但 JSON finding 级仅说"保留 severity、section、title…与 dependency/root 信息（存在时）"，未定义 dependents 嵌套块的 JSON 结构；text envelope 在 198 行有明确嵌套规则，JSON 侧靠实现者自行对齐。后果：JSON consumer（如 spec-write-tasks 的 fail-closed 校验）解析链式 findings 时结构可能漂移。最小修复：在 JSON Rendering 节补一句链式 finding 的嵌套形态（如 `dependents` 数组挂在 root finding 对象内，与 text 缩进块同构）。

2. **`peer-job-runner.py` 100KB 单文件的可维护性（P3，保持现状可辩护）** — 位置：`skills/spec-doc-review/scripts/peer-job-runner.py`（100,272 字节）。三 skill 共享字节一致副本（parity test 锁定），Windows identity guard 等关键不变量有测试覆盖；但单文件 100KB 且三处复制，任一修订需三处同步，drift 风险靠测试而非结构防住。最小修复建议：保持现状成立——已有 parity test 兜底，改为共享包会引入跨 skill 依赖，违反 skill-local 资产边界；仅需在 CHANGELOG/维护说明中保留"三处同步"提醒。

3. **eval 行为层覆盖集中在入口与只读不变量（P3，披露充分）** — 位置：`skills/spec-doc-review/evals/eval.yaml:13-20`。6 个 case 覆盖 flag 冲突、headless 缺路径、report-only 不变量、roster 预算，但 walkthrough/bulk-preview/multi-round 等交互深路径无行为 case；cross-model-eval.md:13-14 已显式声明 fresh-source case 在授权前记 `not-run`。这属静态层的已知降级披露，非缺陷；若后续获得评测授权，优先补 multi-round R29/R30 行为 case。

## 主责深挖面发现（B05/B06 + 归因验证）

**B05 深挖（失败恢复隔离）**：四个失败面逐一对账后全部闭环——

- **dispatch 失败**：`dispatch.md:45` 双 always-on reviewer 同时失效 → 一次等价 inline 审查 → 仍失败则 `review_status: incomplete` + `mandatory_review_coverage_missing` + 抑制 clean verdict（与 `synthesis-and-presentation.md:198` 一致，contract test `spec-doc-review-contracts.test.js:227-232` 锁定）。重试语义区分 backpressure（容量错误排队重试，`dispatch.md:11`）与真失败，不盲目重试。
- **写失败**：`open-questions-defer.md:99-103` 三选项失败路径，用户无响应默认 Record-only（B），不静默；重试前有 readback 检查防重复 append（69 行）。
- **并发/中断**：写前重读 + mtime 检测（77 行）；walkthrough 中断丢弃内存态且无半成品写入（`walkthrough.md:244`），Apply 批量在 end-of-walk-through 单 pass，中途失败有 failure bucket。
- **peer 失败**：bounded waits + reap 未完成 job（`cross-model-review.md:37`），unreaped/failed 记 limitation 不提升 confidence。

**B06 深挖（完整交付审查）**：审查质量链完整——evidence 强制（schema minItems:1）→ consequence admission（3.1b）→ anchor gate（3.2）→ dedup（3.3 + premise-collapse）→ 矛盾裁决（3.5）→ 推荐动作（3.5b）→ 链式归并（3.5c）→ 路由（3.7）→ 渲染 floor → 完成报告含 failures/Coverage/Limitations。误报防线为 FP catalog + anchor 0/25 静默丢弃；漏报防线为 always-on 双 reviewer + task-pack 六条共享 lens。修复闭环有 R30（Apply 后复验 + provisional withdrawal 回退）。

**归因验证**：未发现历史归因需要修正的证据。`synthesis-and-presentation.md:198` 与 `cross-model-eval.md:8` 对 serving receipt 的 degraded 判定一致（file-based receipt = unverified → 拒绝 admission），机制存在且 fail-closed 方向正确；task-pack lens 明确"validator 不返回 digest 不得伪造"（lens:26），属诚实的能力边界声明而非机制缺失。

## 未读文件

- `skills/spec-doc-review/scripts/peer-job-runner.py`（100KB 全文未逐行读）：只读了 parity test 与关键 identity-guard 断言（tests/unit/peer-job-runner-parity.test.js:28-48）。未覆盖后果：runner 内部生命周期细节（reap/kill-tree 边界）若有缺陷本次静态审查不会发现；但该 runner 当前处于"serving receipt unverified 即拒绝启动"的关闭状态（cross-model-doc-review.sh:11-15），实际不可达，风险被 admission gate 隔离。
- `evals/fixtures/repos/*` 三个 fixture 仓库内容未逐文件读：只验证了 judge 脚本逻辑与 contract test 对 fixture 的使用方式（spec-doc-review-contracts.test.js:66-98）。未覆盖后果：fixture 文档内容与当前分类规则的细节匹配度未独立复核；但 contract test 已对 fixture 做篡改检测，静态层风险低。

## 结论一句话

spec-doc-review 静态合同层 18 维全部 pass——授权、失败隔离与审查质量机制为本仓最完整一档，仅余 JSON 链式 finding 结构未定义与 peer runner 单文件体量两个 P3 级残余，均不阻断当前使用。
