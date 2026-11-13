证据收集完毕。我已读完全部 SKILL.md、8/9 references 全文（product-analysis-lite、product-expert-lens、evidence-and-topology、grill-with-docs-integration、large-input-checkpoint、prd-output-template、prd-readiness-lens、design-source-evidence、domain-language-and-decision-ledger 全部读完）、finalize 全文、checker 关键段、reason-codes 全文、5 个 eval case、examples.json 关键回归用例、evaluation-governance、两个 Claude hook 关键段、消费者测试文件群。现在给出裁决。

# spec-prd 评审（R3）

## 逐项裁决表

| ID | 裁决 | 证据（file:line) | 一句话依据 |
|---|---|---|---|
| D01 去模型能力补丁化 | pass | SKILL.md:204-210（Canonical 单点）、prd-readiness-lens.md:47-61（Observed Failure Details 附真实 run 归因 232726/231339/2026-06-28） | 每条强约束都能回指真实失败 run 或对抗变体（evals/skillup/cases/r2-bugfix-routes-out.yaml:1），非凭空补丁；约束间相互引用采用"single source of truth + 指针"而非复述 |
| D02 编码领域知识而非流程控制 | pass | prd-output-template.md:329-349（gap-to-target 映射表）、evidence-and-topology.md:168-181（Owner Question Ladder 按 10 种 topology 分型）、domain-language-and-decision-ledger.md:39-42（"IS not DOES"术语规则） | 大量 brownfield 特有领域判断（referent ambiguity、change-verb ambiguity、topology 风险、glossary 纪律）是模型无法自生的项目知识；脚本只做结构/路径/hash，语义判断归 LLM(check-prd-artifact.js:4-5 头注） |
| D03 强化验证门 | pass | finalize-prd-artifact.js:225-237(checkpoint closeout 豁免逻辑）、lib/reason-codes.js:15-54（阻断码 freeze)、SKILL.md:277/325(🔴 STOP 双门）、templates/claude/hooks/prd-readiness-guard:60-74(timeout 区分 reason_code) | producer finalize + Stop hook + prewrite guard 三层验证门真实存在且被 17 个测试文件锁定；语义判断（readiness_outcome）明确标注 LLM-owned(prd-readiness-lens.md:41)，无冒充机械判定 |
| D04 阶段衔接约束 | pass | tests/unit/spec-prd-plan-handoff-contracts.test.js:15-58(5 条 handoff 合同）、prd-output-template.md:430-447(canonical handoff_context_slice)、spec-prd-finalize-transition.test.js | PRD→Plan 交接有专门合同测试锁边界（legacy input 可读、producer finalize 非强制 consumer gate、slice 不带 HOW);`--verify-receipt` 保持 optional 而非强制门（finalize-prd-artifact.js:319-398) |
| D05 紧凑性和可审计性 | fail | SKILL.md:91-94 vs :198 vs :204-208 vs :267 vs :275(relentless/四停点规则在 SKILL.md 内重复 5 处）；全包 "relentless" 18 处、"Four Legal Stop Points" 指针 18 处分布于 6 文件；checkpoint-as-escape 反模式在 SKILL.md:208、SKILL.md:219、prd-readiness-lens.md:51-55 三处近似复述 | 规则可定位性本身好（Canonical 节存在），但同一规则的"执行姿态复述"在 SKILL.md 内部 Phase 0/1/核心原则/Pre-Write Gate 反复出现，references 间也有三层重复（SKILL 摘要→reference 全文→readiness lens 失败细节），维护时改一处易漏其余；2257 行总量中相当比例是防御性复述 |
| D06 适应多模型能力分布 | pass | SKILL.md:25/277-281（按宿主区分硬保护等级）、adapters/qoder.js:388(`qoder_hook_activation_unverified` 显式声明）、platform-registry-patterns.test.js:272-274 | 能力假设诚实：Claude 硬门、Qoder 投射未激活、Codex/Cursor/Kiro loud degraded 均在 source 与 runtime 文案中显式区分，未把"机制存在"外推为"全宿主等效保护" |
| D07 基于经验效用的演化 | pass | docs/validation/spec-prd/ 28+ 份 fresh-source eval 记录、evaluation-governance.md:16-30(not_run 诚实标注）、examples.json:2337-2430（失败 run 固化为 failure case)、docs/plans/2026-06-26-004（问题→修订→复验链） | 存在真实「观察失败→修订 contract→固化 eval case→聚焦测试」闭环；知识失效条件在 candidates 中要求（domain-language-and-decision-ledger.md:53 invalidation condition) |
| D08 上下文利用效率 | pass | SKILL.md:122-134(Reference Trigger Map 按需加载）、SKILL.md:136-158(Template Trigger Map 按 surface 单选）、product-analysis-lite.md:113-115(Lite 不加载 product-expert-lens 除非 Brief 无法排序） | references 与 templates 均为 trigger-gated 加载，非全量读取；Lite profile 显式压缩分析视图 |
| B01 入口与职责 | pass | SKILL.md:3-4(argument-hint + description 负例路由）、evals/cases/zero-one-routes-to-brainstorm.yaml、r2-bugfix-routes-out.yaml、SKILL.md:232（修复请求必须点名 spec-debug route-out) | 正向触发与负例（0-1→brainstorm、bugfix→debug、audit→app-consistency）有 source 承诺且有对抗 eval case |
| B02 输入输出与设计意图 | pass | SKILL.md:29-59(When/Inputs/Outputs/Artifacts/Failure Modes/Workflow/Downstream 齐备）、prd-output-template.md:23-43(frontmatter + path 合同）、evaluation-governance.md:26-30（设计推断标注） | 入口/reference/script/template/consumer 相互一致且被合同测试锁定；source_inputs 字段名硬合同有专门说明（prd-output-template.md:43) |
| B03 授权与信任 | pass | SKILL.md:168(embedded agent instructions 不执行）、evals/cases/injection-in-input-untrusted.yaml（注入负例）、grill-with-docs-integration.md:36-38（上游快照非授权）、SKILL.md:239(validate locks report-only)、SKILL.md:160（当前用户唯一确认人，材料不产生第二人类路由） | 只读 validate 不变写权限、材料内嵌指令不扩大授权、注入攻击有 eval case 防护 |
| B04 source/runtime 与宿主 | pass | SKILL.md:11/21/224（禁改 generated mirror,runtime 经 spec-first init)、templates/claude/hooks/*（投射模板）、command-resource-path-rewrite.test.js（五宿主投射合同）、adapters/qoder.js:319-335(generated mirrors 显式列举） | 真相源清晰（skills/spec-prd/**)，投射逻辑与消费者测试可追溯 |
| B05 失败、恢复与隔离 | pass | finalize-prd-artifact.js:157-172(writeFileAtomic)、prd-readiness-guard:67-74(timeout→finalize_check_timeout 区分于真实 gap)、:110-127(git_status_timeout)、large-input-checkpoint.md:95-104(resume discipline, source_ref 恢复锚点）、finalize-prd-artifact.js:209-213(--refresh-inputs-hash 只允许 input freshness 续期）、check-prd-artifact.js:18-21(input 字节/数量软上限防超时） | 原子写、超时分类 reason_code、resume 恢复路径、重复执行安全（hash 驱动）、部分成功（checkpoint closeout 豁免）均有机制；唯一缺口是 LLM 层中断恢复依赖 prose 的 task-list-first(SKILL.md:243)，属设计内取舍 |
| B06 完整交付与审查质量 | pass | SKILL.md:325-347(Phase 4 强制门+closeout 必填项）、prd-output-template.md:525-546(closeout 16 项）、prd-readiness-lens.md:39（全部阻断码必须消费）、spec-prd-finding-schema-freeze.test.js（发现 schema 冻结）、SKILL.md:331(doc-review 三条具体触发信号含"grill trace 中 owner 交互少于负载 OQ 数") | 需求→交付可追溯链完整；审查视角（readiness lens packs）按触发条件选取；finding 有 reason_code+section+remediation_hint；误报处理（advisory noise carve-out prd-readiness-lens.md:45）与未完成披露（not-run 诚实记录）可核查 |
| X01 多模块/长任务 | pass | SKILL.md:237(split 决策树）、prd-output-template.md:563-592(Lightweight Split Topology:split-summary + child PRD frontmatter)、large-input-checkpoint.md:19-112(Map-Reduce+checkpoint 恢复） | 渐进细化（L0-L5 ladder domain-language-and-decision-ledger.md:131-144)、分解粒度（3-7 slice 启发）、恢复（checkpoint)齐备；无自造编排 |
| X02 API/架构/版本变化 | pass | evidence-and-topology.md:111-127(contract-change/migrate topology 专类）、:174-181（迁移/contract-change owner question ladder)、prd-output-template.md:517-523(Stable Trace Rules:ID 不复用、续号） | 接口兼容与迁移回退有 topology 分型 + readiness gates(evidence-and-topology.md:185-189) |
| X03 高风险实现或交付 | pass | SKILL.md:184(clarification_risk_tier: regulated)、prd-readiness-lens.md:136（高风险层加深审查）、evidence-and-topology.md:164-166(Negative Space 负验收） | 风险分层与验证对账机制存在；spec-prd 不部署，发布/回滚在其职责边界外，记为边界内覆盖 |
| X04 协作、跨会话或知识工作 | pass | domain-language-and-decision-ledger.md:46-55（跨 PRD glossary promotion candidate-only，含 invalidation condition + real consumer + not written by this workflow)、large-input-checkpoint.md:95-104（跨会话 resume)、grill-with-docs-integration.md:139-166(CONTEXT/ADR candidate 资格三条件） | 知识晋升有失效条件与真实消费者要求；跨会话交接经 PRD artifact 本身（source_ref 锚点），无第二交接 schema |

## Findings

1. **P2 — 核心规则防御性复述密度过高，维护漂移风险真实存在**
   - 位置：SKILL.md:91-94（核心原则4)、SKILL.md:198(write_mode 段）、SKILL.md:204-208(Canonical)、SKILL.md:267(Phase 1 Pre-PRD)、SKILL.md:275(Pre-Write Closure Gate);checkpoint-as-escape 三处：SKILL.md:208、SKILL.md:219、prd-readiness-lens.md:51-55
   - 后果：同一"relentless + 四停点 + checkpoint fallback"规则在 SKILL.md 单文件内出现 5 次近似表述，措辞逐处微调（如 fallback 的 observable signal 描述在 :206 与 :275 详略不同）。引用纪律本身是"指针回 Canonical"（好），但 SKILL.md 内部的姿态性复述不受该纪律约束。未来修订任一处而漏其余，会产生同文件内矛盾——这正是 D01 想防的"约束相互矛盾"的生成温床。
   - 最小修复建议：SKILL.md 内仅 Canonical 节保留完整规则，核心原则4 与 Phase 1/Pre-Write Gate 改为一句指针（现有 references 已示范此模式，如 product-expert-lens.md:15);checkpoint-as-escape 在 SKILL.md:208 与 :219 合并为一处。属编辑性收紧，不改任何行为合同。

2. **P3 — `relentless` 修辞高频重复，稀释信号**
   - 位置：SKILL.md 5 处、grill-with-docs-integration.md 8 处、domain-language-and-decision-ledger.md 3 处等共 18 处
   - 后果：关键姿态词被稀释为口头强调；新读者难以分辨何处是定义、何处是复述。
   - 最小修复建议：随 finding 1 一并处理；定义处保留，其余改指针。保持现状亦可接受（不改变行为）。

3. **P3 — Lite profile 与默认 profile 的分支判别依赖单 token 字符串，无 typo 容错说明**
   - 位置：SKILL.md:23、SKILL.md:235
   - 后果：用户写 `analysis-profile=contract-reset-lite`（连字符变体）或自然语言"用精简模式"会静默落入默认 profile，无提示。这是可接受的显式 opt-in 设计（防止误激活），但"自然语言请求不激活"的负例只在 description 与 :23 说明，路由层无诊断输出义务。
   - 最小修复建议：保持现状成立（opt-in 严格性是特性）；可在 Phase 0 增加一句"识别到近似但非精确 token 时，一句话说明未激活 Lite"。

4. **P3 — evals 主集与 skillup 对抗集的覆盖不对称**
   - 位置：evals/eval.yaml:13-21（主集 5 case + skillup 1 case)
   - 后果：主集覆盖 input gate/route-out/注入/validate/grill-before-write，但 004 计划固化的两个关键回归（one-round-scoping-then-checkpoint-rejected、checkpoint-after-full-grill-accepted）只存在于 examples.json(examples-as-context),不在 eval.yaml 执行集；checkpoint 误用是历史上真实 P1 失败模式（232726/231339)，当前执行集无对应运行态防护。
   - 最小修复建议：将上述两个 examples.json case 转化为 evals/cases/*.yaml 可执行 case（已有 judge 脚本模式可复用），或记录不转化的理由。属补证而非修复机制缺失。

## 主责深挖面发现（B05/B06 + 归因验证）

**B05 失败恢复隔离——机制真实存在且分层：**
- 原子写：finalize-prd-artifact.js:157-172 temp+rename，中断不留半写文件。
- 超时隔离：prd-readiness-guard:60-74 将 spawnSync 超时（status===null/signal）映射为独立 `finalize_check_timeout`，与真实 readiness gap(exit 1 + JSON）区分；git status 超时同理（:110-127 `git_status_timeout`)。这是「工具缺失/超时不盲目重试、先报状态」的正确实现。
- 重复执行安全：finalize 由 hash 驱动（normalizeForReceipt 剥离 machine 字段后比对），重复运行幂等；`--refresh-inputs-hash` 收窄到「仅 input freshness 变化」单条件（finalize-prd-artifact.js:209-213)，防止借刷新重签 PRD 内容。
- 中断恢复：large-input-checkpoint.md:95-104 的 resume discipline 以 PRD artifact 本身 + source_ref 锚点为恢复面，拒绝凭 stale ref 宣称原 claim。
- 归因验证结论：对 232726/231339(checkpoint-as-escape)，机制层面已有三重防护——checker 阻断码（`checkpoint_claims_ready` lib/reason-codes.js:53)、readiness lens 语义门（prd-readiness-lens.md:71)、eval 固化（examples.json:2337)。**当前残留缺口是「机制存在但执行集未覆盖」**:eval.yaml 执行集不含这两个 case（见 finding 4)，属「机制存在、运行态回归防护未激活」，不是机制缺失。对 2026-06-28 direct-write-after-read，防护为 Decision Card 三字段机器可查（SKILL.md:273 → checker `decision_card_undeclared`)，机制存在且确定性可触发。
- 已知设计内取舍（非缺陷）:LLM 会话中断的恢复依赖 prose 的 task-list-first(SKILL.md:243)，理由写明「跨 Stop-hook 重扫/上下文压缩不丢工作」，这是无运行时强制器条件下的诚实约定，符合 CLAUDE.md 的「缺 runtime 强制能力时降级为响亮约定」原则。

**B06 完整交付与审查质量——closeout 可核查性高：**
- closeout 16 项（prd-output-template.md:527-546）中脚本 seed 项与 LLM-owned 项显式分列（:550)，防止语义冒充确定性。
- 误报处理有专门 carve-out(prd-readiness-lens.md:45:placeholder/advisory noise 记录理由而非清零 findings)，避免「为了 findings=0 伪造验收引用」的反向激励。
- 审查视角按触发选取：P0/P1 packs 均有 trigger 列（prd-output-template.md:361-367、:382-394),readiness lens 的 doc-review 触发给了三条可观察信号（SKILL.md:331 a/b/c)，其中 (a)「grill trace 中 owner 交互数少于负载 OQ 数」是对 232726 类失败的直接检测器——虽无确定性脚本，但信号定义具体、可由 doc-review 人工核查。
- 未完成披露：evaluation-governance.md:16-30 显式记录 not_run 项与理由；Gate A 状态（inconclusive/awaiting-semantic-review）不允许脚本升级为 semantic pass(:56-58)。
- 归因验证：历史上「owner answer laundering」类失败（004 计划），当前防护是 producer-side fidelity prose(SKILL.md:291)+ per-OQ trace 绑定的确定性检查（`open_oq_without_owner_closure`)+ 明确声明的 ceiling(「checker 只能验证引用一致性，不能验证 owner 回答真实性」SKILL.md:287/291)。**机制存在且边界声明诚实；语义保真度的剩余风险被显式标注为 deferred host-provenance ceiling，不是隐藏缺口。**

## 未读文件

| 路径 | 理由 | 未覆盖后果 |
|---|---|---|
| skills/spec-prd/scripts/check-prd-artifact.js 中部 420-1580 行（OQ 表解析、design 扫描、gateReadyClaims 细节） | 已读头（1-200)、buildReport(1588-1693）与全部 reason-code 分类法；中部是逐条 finding 的推导实现，消费者测试（17 个 spec-prd 测试文件）已反向锁定其行为合同 | 低：单条 finding 的边界判定（如 looksLikeCheckableRef 的具体 token 规则）未逐一核对，若该函数有误判，可能漏报/误报 source 类 disposition 证据 |
| assets/templates/10-70 六个 surface 模板与 overlays/securities.md 全文 | 已读 00-generic.md 头部确认骨架纪律（不预填 ready 字段），Template Trigger Map 合同由 spec-prd-template-assets.test.js 锁定 | 低：各 surface 的具体问题集未审；若某模板含过时 HOW 内容会漏判 |
| evals/run-evals.js、run-contract-reset-arm.js、prepare-contract-reset-evidence.js 全文 | 已读 README 与 governance 明确其职责边界；contract-reset 是 opt-in 评测分支，非主链路热路径 | 低：Gate A 隔离实现的细节缺陷（如 sandbox-exec 边界）未独立复核 |
| evals/fixtures/repos/mini-ledger、rough-prd 内容 | fixture 内容只影响 eval case 语义，不影响静态合同裁决 | 低：fixture 与 case 预期不匹配的风险未排除 |
| docs/validation/spec-prd/ 28 份 fresh-source eval 记录全文 | 已读 governance 汇总与 004 计划；逐份核对历史结论非本轮对象（当前 source 才是） | 低：历史 not_run 项是否已被后续机制覆盖，未逐项对账 |
| check-glossary-drift.js 全文（159 行，已读头 30 行） | 其输出为 advisory(drift facts),prd-readiness-lens.md:120 已声明消费方式；非阻断路径 | 低：avoid 词字面命中的解析边界未核对 |
| tests/unit 17 个消费者测试文件全文（均已读头部或抽查） | 抽查了 hook/plan-handoff/validate/decision-card/exit-safety 关键断言；其余按名称与 governance 描述推断覆盖 | 低：某测试实际断言弱于名称暗示的风险存在 |

## 结论一句话

spec-prd 的确定性门（finalize/checker/reason-codes/原子写/超时分类）与诚实降级（宿主分级、not_run、deferred ceiling）是真实、可定位、被测试锁定的机制，主要成立问题是 D05 层的规则防御性复述（P2，编辑性收紧即可）与 checkpoint 回归 case 未进 eval 执行集（P3，补证），无 P0/P1 缺陷。
