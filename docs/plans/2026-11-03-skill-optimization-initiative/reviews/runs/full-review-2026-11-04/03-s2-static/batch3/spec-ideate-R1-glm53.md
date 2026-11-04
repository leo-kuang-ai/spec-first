# spec-ideate 评审（R1）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | skills/spec-ideate/references/output-mode.md:17-19, scope-gates.md:26-36, divergent-ideation.md:34, decomposition.md:7 | 每条补丁式规则都附真实失败模式依据（注释行误读、以词长判模糊、grounding 噪声塑形 survivors），且多处有消费者测试锚定，无过时矛盾约束；仅两处数值/措辞漂移见 Findings |
| D02 | pass | divergent-ideation.md:47-53, issue-intelligence-analyst.md:85-98, web-researcher.md:13-18, ideation-sections.md:79-114 | 编码了实质领域知识：六 frames 认知透镜、basis 三级分级、issue 按 root-cause 聚类、bot/human 信号质量区分、来源阅读原则、视觉 hinges-on-structure 判据，而非纯流程控制；模型/脚本分工由 `context_facts_adapter/v1` 声明（grounding.md:39） |
| D03 | pass | post-ideation-workflow.md:147-165（Quality Bar）, divergent-ideation.md:40,77, post-ideation-workflow.md:64, evals/cases/*.yaml | 验证门作为 prose 约定明确存在：basis 必填、`direct:` 必须实读引用、写后 readback、每条拒绝有理由；evals 含 gate 断言（files_not_exist + script judge）；未把语义判断冒充机械判定，也无硬强制伪称 |
| D04 | pass | post-ideation-workflow.md:110-117（seed）, SKILL.md:12-18, output-mode.md:29-51（resume）, grounding.md:39 | 衔接约束完整：seed 携带 basis/snapshot/limitations/provenance、repo 模式禁止越级到 spec-plan、resume 保留旧成果、`context_facts_adapter/v1` 带 freshness；tests/unit/spec-ideate-clarification-handoff-contracts.test.js:17-34 逐条锚定 |
| D05 | pass | SKILL.md:83-97（分阶段加载）, output-mode.md:25（defer rendering）, scope-gates.md:110 vs universal-ideation.md:71 | 指令分 phase 按需加载、关键规则均可定位；重复（Interaction Method 三处、axes 规则双份）是自包含替换的设计决定；发现两处轻微数值漂移与一处跨文件指代，均列 Findings 不达 fail |
| D06 | pass | SKILL.md:71-81（Model Tiers）, SKILL.md:56-69（Dispatch Boundary）, post-ideation-workflow.md:9, universal-ideation.md:25,89 | 能力假设按任务形状分级而非模型名，override 未知即继承、dispatch 缺失即 inline/serial 并携带 reason code，禁止冒充独立覆盖；tests/unit/dispatch-authorization-matrix-contracts.test.js:562-585 锚定 fallback 措辞 |
| D07 | pass | skills/spec-ideate/evals/cases/r2-refine-variant-phrasing.yaml:4-5, git log 1f72bfd0/7b314eac, learnings-researcher.md:160 | 演化有失败→修订→复验链：交叉测评变体入库为 eval case、CE 融合 commit 可追溯；learnings 消费带失效判断（冲突显式标记、日期超期提示），无经验自动化职责需要更强证据 |
| D08 | pass | decomposition.md:36-38（dossier handoff）, diverent→divergent-ideation.md:26-28（byte-identical cache 前缀）, output-mode.md:25（defer）, post-ideation-workflow.md:9（verifier payload 剥离生成史）, web-researcher.md:100 | 上下文效率机制密集且自洽：dossier 文件交接不进主上下文、渲染引用延迟加载、共享 grounding 块字节一致以命中 prompt cache、digest 明确 token 上限、grep-first 预过滤 |
| B01 | pass | SKILL.md:3（description 正负例）, scope-gates.md:5（refine-vs-generate 前置）, evals/cases/refine-own-idea-routes-to-brainstorm.yaml, r2-refine-variant-phrasing.yaml | 正向触发与相似入口负例齐备，refine 检查在任何 phase 之前执行，两个 eval case 机器锚定路由负例；agents/ 下 4 个 prompt 资产均由 references 按需 seed，不独立暴露 |
| B02 | pass | SKILL.md:22-28（Contract Summary）, scope-gates.md:131（reason code）, mcp-setup-config-consumers.test.js:79-100 | 入口/reference/eval/consumer 一致：ideate_output 合同被 spec-runtime-setup 与 config-template 双向锚定；无伪装成 owner 决策的设计推断 |
| B03 | pass | SKILL.md:56-69, scope-gates.md:131（research authority）, grounding.md:119（Slack opt-in）, issue-intelligence-analyst.md:19, web-researcher.md:106-113, slack-researcher.md:111-123 | 四重授权分离清晰（dispatch / external research / Slack / tracker 均独立 gate），三个外部 agent prompt 各含 untrusted-input 处理，写面最小化且 discard 仅限本次创建文件（post-ideation-workflow.md:143） |
| B04 | pass | CLAUDE.md source/runtime 边界, agent-persona-template-drift.test.js:57-63（hash 冻结）, requirements-rendering-parity.test.js:13-19 | 真相源在 skills/spec-ideate/，无手改 mirror；共享 renderer 三份 byte-identical 由测试锁定，persona 变体漂移由 hash gate 守卫；无 scripts，无生成逻辑需核 |
| B05 | pass | grounding.md:3（重试一次/排队/降级）, grounding.md:117（warn-and-proceed）, post-ideation-workflow.md:15,64,143（verifier 失败回退/写失败 inline/不删 resume 文件）, output-mode.md:61（unique suffix）, divergent-ideation.md:95（checkpoint best-effort） | 失败、重试上限、部分成功、重复执行、中断恢复（scratch 抗压缩 checkpoint + artifact 跨会话 resume）均有明确处理路径且相互一致 |
| B06 | pass | SKILL.md:20（Done means）, post-ideation-workflow.md:42-44（shortfall 如实披露）, ideation-sections.md:136-141（拒绝表含 axis gap 行） | 完整交付合同可追溯：完成定义、每条拒绝有理由、覆盖缺口显式入册、不足不注水；evals 与 12 个消费者测试构成审查面 |
| X01 | not-applicable | SKILL.md:18, post-ideation-workflow.md:46-145 | 单会话发散 workflow，无多模块实现、共享写面或长任务依赖编排；其多 agent 编排、并行上限与恢复已由 D06/B05 裁决覆盖，无残留的 X01 特有检查面 |
| X02 | not-applicable | grounding.md:39, ideation-sections.md:33-39 | 该 skill 无 owned API/schema/版本迁移面：ideation doc 明确 point-in-time 无 status 生命周期，唯一版本化接口 `context_facts_adapter/v1` 的一致使用已在 D04 裁决 |
| X03 | not-applicable | SKILL.md:27（无 implementation/commit/landing authority）, post-ideation-workflow.md:136-138 | 无高风险实现或发布面；唯一写副作用是 ideation artifact 与可选 offer-to-commit（不建分支不推送），已由 B03/B05 覆盖 |
| X04 | pass | post-ideation-workflow.md:9-11（fresh-context verifier vs 自审分离）, output-mode.md:29-51（resume）, grounding.md:29（scratch 不跨 invocation）, settled-decisions-contracts.test.js:28-32 | 跨会话/知识工作检查齐备：seed 带 summary/source refs/freshness/limitations、settled-decision 不冒充（仅 user-directed/user-approved 且 brainstorm 是唯一 durable owner）、scratch 与 checkpoint 禁止跨 invocation、独立审查与 inline 自审分别标注 |

## Findings

均为 P3 级非阻断观察，无 P0-P2。

1. **[P3] 内部 taxonomy 标签的用途定位冲突**
   - 位置：`skills/spec-ideate/references/scope-gates.md:71` vs `skills/spec-ideate/references/ideation-sections.md:24-31`
   - 后果：scope-gates 规定三个模式标签 "for routing only"、永不打印给用户；ideation-sections 却把同一组标签定为 artifact metadata 的 `mode` 字段，且 HTML 按 "visible header text" 渲染——用户读 artifact 时会看到被禁的标签。eval（non-software-mode-no-label-leak）只护住对话输出面，护不住文件面。
   - 最小修复：任一侧显式裁决——例如 ideation-sections 声明 `mode` 是 resume/机器判别用 metadata 并配平实语言标签，或 scope-gates 的禁令收敛为「对话宣告不泄漏」。

2. **[P3] 每帧 idea 数默认值跨文件漂移**
   - 位置：`skills/spec-ideate/references/scope-gates.md:110`（6-8/帧）、`references/divergent-ideation.md:18`（~6-8）vs `references/universal-ideation.md:71`（Aim for 5-8）
   - 后果：非软件模式与软件模式对"默认体量"的口径不一致，执行者在两文件都加载的路径（scope-gates 是全模式必读）下无裁决依据。
   - 最小修复：统一为同一区间，或在 universal-ideation 注明非软件模式刻意取下限的理由。

3. **[P3] 宿主 primitive 参数泄漏进 workflow contract**
   - 位置：`skills/spec-ideate/references/divergent-ideation.md:9`（"omit the `mode` parameter so the user's configured permission settings apply"）
   - 后果：`mode` 是特定宿主 dispatch 工具的参数名；该 skill 源码是多宿主投射的 source，其余 references 均用 "generic worker / tier" 抽象。非 Claude 宿主执行到此指令时无对应物。
   - 最小修复：改为能力级表述（如「保持宿主默认权限/审批设置，不额外收紧」），参数细节留在宿主适配层。

4. **[P3] durable checkpoint 归属悬空**
   - 位置：`skills/spec-ideate/references/grounding.md:29`（"Durable repo-backed checkpoints belong under `.spec-first/workflows/spec-ideate/`"）、`references/post-ideation-workflow.md:145`（"any repo-backed checkpoint are confirmed"）
   - 后果：归属位置被声明、收尾流程提及确认，但没有任何 phase 被指派写入 durable checkpoint——Checkpoint A/B 均写 scratch。读者无法定位 writer，`.spec-first/workflows/spec-ideate/` 目录在正常 run 中是否产生不可判。
   - 最小修复：指派 owner phase（例如 Phase 4 在 repo 模式镜像 survivors），或把两处措辞改为纯条件式并删除暗示必然存在的收尾引用。

5. **[P3] 遗留死 fixture**
   - 位置：`skills/spec-ideate/evals/fixtures/scripts/check-r2-asks.sh`
   - 后果：无任何 spec-ideate case 或测试引用它（r2-refine-variant-phrasing.yaml:19 用 `rule_based` judge；ce-outcome-judge-calibration.test.js:233-235 引用的是 using-spec-first 自己的同名副本）。维护者会误以为 r2 case 依赖它。
   - 最小修复：删除，或加一行注释说明保留理由（如备用 judge）。

6. **[P3] e2e case 的落盘断言缺口**
   - 位置：`skills/spec-ideate/evals/cases/repo-grounded-e2e-writes-artifact.yaml:24-34`
   - 后果：judge 仅 `output_contains ["docs/ideation", ".html"]`，断言的是输出提及而非文件存在——对比同目录 vague-subject case 已用 `files_not_exist` 证明引擎支持文件断言。「自动写入 docs/ideation/」这一核心承诺（SKILL.md:18、post-ideation-workflow.md:54）在机器层未被验证，落盘与否仍依赖 transcript 人工核验。
   - 最小修复：给该 case 补 `files_exist` 断言（如 `docs/ideation/*.html`）。

## 主责深挖面发现

**D01（去补丁化）**：逐条核对了主要补丁规则的设计依据，结论是「保持现状成立」：output-mode.md:17-19 的 unknown-output 提示与注释行告警各附具体失败模式（硬编码格式误导、`# ideate_output: md` 被当 active 值静默覆盖默认），后者有 mcp-setup-config-consumers.test.js:84-99 双向锚定；scope-gates.md:26 的 issue-tracker 检测正负例（"top 3 bugs in authentication" 不触发、"issue themes" 触发）与 :32 的 vagueness 判别（词长不等于模糊）都是对真实误路由失败的编码；tactical 词表 + `go deep` 抑制 + "resolved state 保持、不从原始词重推导"（:121）形成防模型走捷径的闭环，divergent-ideation.md:16-22 的 fleet 交互矩阵（surprise-me/go deep/issue fallback/tactical）逐项核对无矛盾。复杂度接近过度指导的边界，但每条交互都可定位且有理由，不建议删减。

**D02（领域知识）**：领域知识密度显著高于流程控制——frames 的透镜定义、`direct:` > `external:` > `reasoned:` 的证据分级进 scoring（post-ideation-workflow.md:37）、issue 聚类的 root-cause 层级原则与 bot/human source mix 信号质量区分（issue-intelligence-analyst.md:5,98）、web 来源阅读四原则（web-researcher.md:13-18）、Slack 的 commitment arc / thread 原子性 / topic 级 supersession（slack-researcher.md:13-19）、ideation 视觉的 hinges-on-structure 判据与「自读散文陷阱」的自我校准（ideation-sections.md:79-114）。

**D03（验证门）**：静态承诺完整（Quality Bar 13 项清单、basis 必填、未验证引用禁标 `direct:`、写后 readback、拒绝理由逐条），且诚实区分 prose 约定与工具强制——无脚本却未伪称硬 gate。弱点是 eval 断言强度（Finding 6）。

**D04（衔接）**：除裁决表证据外，核对了「不重复询问」面：0.4 的 discrimination test（scope-gates.md:87）、0.2 的 3-question 预算与 issue scope question 计入同一预算（issue-intelligence.md:7）、resume 不重新探索已探索内容（output-mode.md:46-51）——正对 core/08 要解决的信息重复/丢失两类问题。core/08 的五个主链 contract 不含 spec-ideate，按检查表第 2 节作为协议参照而非逐字段合同使用。mode 标签张力见 Finding 1。

**D05（紧凑性）**：发现两处保持现状成立的「可接受重复」值得记录：Interaction Method 在 SKILL.md:32、post-ideation-workflow.md:86、universal-ideation.md:104 三处近乎全文重复，是自包含加载的设计代价；axes 规则在 decomposition.md 与 universal-ideation.md:35-58 双份（后者为 facilitator 模式镜像压缩），同上。另 scope-gates.md:42 "per Interaction Method above" 的 "above" 指向 SKILL.md（嵌套加载时可解析），措辞跨文件后略含糊但不致误读。"survivors after dedupe"（~25-30）与最终 survivors（5-7）同词两义，但两处均带限定语（scope-gates.md:110-112、divergent-ideation.md:18），可定位不误导。

**D08（上下文效率）**：机制密度是该 skill 的突出优点——dossier 文件交接明说目的就是不让 bulk 进 orchestrator 上下文（decomposition.md:38）；共享 grounding 块跨 agent 字节一致以吃 prompt cache（divergent-ideation.md:26）；verifier payload 刻意剥离生成史（post-ideation-workflow.md:9）；三个 digest agent 各自 token 上限 500/1000/1500；learnings 的 grep-first 预过滤（learnings-researcher.md:24-31）；issue 拉取禁 bulk bodies、500 字符截断。摘要遗漏风险由 grounding summary 固定 section 清单 + 空产出省略但失败显式 warn 的组合覆盖。

## 未读文件

- `tests/unit/dispatch-authorization-matrix-contracts.test.js:200-520`、`plugin-modules.test.js`（除 425-454）、`mcp-setup-config-consumers.test.js`（除 75-104）、`eval-fixture-contracts.test.js:100-170,229-516`、ce-* 三文件的非 spec-ideate test：已用 grep 定位全部 `spec-ideate` 断言行并逐一读取；未读部分仅含其他 skill 的断言。后果：对本对象的断言覆盖无缺口。
- `skills/spec-brainstorm/references/universal-brainstorm.md` 与 `settled-decisions.md`：X04/D04 链路另一端，未直接读原文，依赖 tests/unit/spec-ideate-clarification-handoff-contracts.test.js:36-45 与 settled-decisions-contracts.test.js:14-20 的字符串锚定确认衔接关键词存在。后果：brainstorm 侧完整语义未直接核对，关键合同字符串由测试守卫。
- `.agents/skills/`、`.claude/` 等 generated runtime mirror：B04 审查以 source 为真相源，mirror 投射正确性属 `spec-first init`/doctor/smoke 测试职责。后果：无（静态合同审查不受影响）。
- `skills/spec-ideate/evals/fixtures/repos/mini-ledger/{package.json,src/server.js}`：README 已核对与 e2e case 主题匹配。后果：fixture 内部代码细节未核，不影响静态合同结论。

## 结论一句话

spec-ideate 静态合同层通过：15 pass / 3 not-applicable / 0 fail / 0 not-verified——补丁均有失败模式依据且多处被 12 个消费者测试机器锚定，衔接、授权、降级与失败路径内部一致，仅存 6 条 P3 级一致性/卫生观察（标签用途冲突、数值漂移、宿主参数泄漏、悬空 durable checkpoint、死 fixture、e2e 落盘断言缺口），均不阻断、可低成本收口。
