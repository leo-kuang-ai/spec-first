# spec-brainstorm 评审（R1）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | skills/spec-brainstorm/references/synthesis-summary.md:56（"a real defect that produced one-sentence syntheses"）、:5（两阶段拆分的设计依据）；tests/unit/spec-brainstorm-visual-retirement-contracts.test.js:10-18（退役有测试锁定） | 步骤普遍附带真实失败依据；未发现过时或互相矛盾的硬约束；dispatch 高密度块是 18 包统一合同（tests/unit/dispatch-authorization-matrix-contracts.test.js:308-317），非孤立补丁 |
| D02 | pass | skills/spec-brainstorm/references/product-pressure-test.md:15-40（rigor-gap 透镜目录）、approaches.md:24（mechanism vs architecture 粒度及理由）、dialogue.md:25（absence claims 必须先验证）、interaction-rules.md:25（推荐范围判据） | 编码了产品发散领域知识（缺口透镜、粒度判据、verify-before-claiming），模型/脚本职责分工在 handoff.md:5 显式声明 |
| D03 | pass | skills/spec-brainstorm/references/plan-write.md:12（Ready for Planning Check + 失败诚实报告）、brainstorm-sections.md:93（显式声明"not a script-owned readiness classifier"）、approaches.md:49-53（claim verifier 三值裁决 + inline fallback 保留 coverage limitation） | 必需验证明确、失败路径可见；语义检查未被冒充为机械判定，prose 约定层诚实声明未硬强制 |
| D04 | pass | 生产者 skills/spec-brainstorm/references/brainstorm-sections.md:28-37,298-337 ↔ 消费者 skills/spec-plan/references/intake.md:42-45（三个 metadata 键逐字对齐）、final-review.md:91（in-place enrich + byte-preserve）、resume.md:25（requirements-only 不是 resume target） | 上游字段、settled-decisions（byte-identical，tests/unit/settled-decisions-contracts.test.js:15）、dossier 传递（handoff.md:80-83）均被消费者按合同消费 |
| D05 | pass | skills/spec-brainstorm/SKILL.md:54-69（78 行入口 + phase 表 owner 委托）、:73-74（关键规则可定位）；重复处见 Findings 1-3 | 指令清晰可定位，重复多为“入口摘要→reference 详述”的 owner 委托模式，无矛盾；3 条 P3 维护性 finding |
| D06 | pass | skills/spec-brainstorm/references/model-tiers.md:7-11（tier 按 task shape、never hardcoded、降级规则）、SKILL.md:40（unknown→serializes/inherits/gate 保持 open）、handoff.md:23-24（宿主选项上限差异 + numbered fallback） | 能力假设按 task shape 表达，宿主不支持时有显式诚实降级路径并被测试 pin（tests/unit/spec-brainstorm-clarification-contracts.test.js:105-130 全宿主投射） |
| D07 | pass | skills/spec-brainstorm/evals/eval.yaml:13-25（7 case 含第二轮对抗变体 r2-verdict-graphql.yaml）、plan-write.md:22-26（promotion candidate 带 invalidation condition）、tests/unit/private-scratch-migration-contracts.test.js:18-29（scratch 迁移有合同） | 失败→修订→回归链可追溯（visual 退役、verdict 二轮 eval、synthesis 缺陷修正记录）；知识沉淀走带失效条件的候选机制 |
| D08 | pass | skills/spec-brainstorm/SKILL.md:56（按 phase 必读、不整包加载）、output-mode.md:19（渲染 reference 延迟到 Phase 3，附 token 论证）、dialogue.md:19-21（gist-only + dossier 按需）、agents/slack-researcher.md:104（500/1000/1500 token 预算） | 按需加载链完整，预算显式；防摘要遗漏的四件套（ref/snapshot/limitation/invalidation）在 brainstorm-sections.md:262-269 |
| B01 | pass | skills/spec-brainstorm/SKILL.md:3（正向 + 负例 + spec-pov 边界）、:13（轻量不入 ceremony）；skills/using-spec-first/references/public-route-map.md:8,24（入口路由一致） | 正负触发清晰，与 spec-ideate/spec-pov/spec-prd 边界在双侧声明一致；不强迫串行（轻量 chat 结束） |
| B02 | pass | skills/spec-brainstorm/SKILL.md:19-25（Inputs/Outputs/Hard exits/Authority/Consumers 摘要）、:58-67（Execution Flow 表）；18 个 reference 文件全部经直接或两层间接可达 | 入口/reference/消费者一致，无孤儿文件、无缺失引用；推断显式标注（synthesis-summary.md Inferred 桶） |
| B03 | pass | skills/spec-brainstorm/SKILL.md:27-40（invocation 不授权 dispatch）、references/handoff.md:62-63（spec-lfg 选项的授权范围与不授权项）、dialogue.md:17（umask 077 + mktemp 私有 scratch）、agents/slack-researcher.md:111-123（untrusted input + 不搜 DM） | 只读边界、dispatch 授权、Git/外发副作用按实际授权执行；材料内嵌指令不扩大授权（Slack 消息指令忽略） |
| B04 | pass | source=skills/spec-brainstorm/**（本目录全读）；tests/unit/plugin-modules.test.js:566-584（退役文件不投射）、:459-465（evals 不投射）、tests/unit/spec-brainstorm-clarification-contracts.test.js:105-130（handoff 内容逐宿主校验） | 真相源清楚，投射与 drift 检测有确定性测试；skill 内无手改 runtime 的指引；见 Findings 4 的 eval 指向 mirror 观察 |
| B05 | pass | dialogue.md:21-23（scout 未返回→等待/空结果→继续）、approaches.md:53（verifier 失败→inline fallback）、plan-write.md:16（路径独占创建 + 重试不覆盖）、phase-0.md:9-12（durable recovery + 不从缺失 scratch 推断闭合）、model-tiers.md:3（纠错一次 + 不重复派发运行中任务） | 工具缺失、超时、部分成功、重复执行、中断恢复、dirty（recheck source identity）均有明确处理 |
| B06 | pass | plan-write.md:12-14（检查失败→诚实报告草稿与阻塞，不声称 readiness）、handoff.md:141-167（complete/paused 双模板）、synthesis-summary.md:45（不虚称未发生的文件/调用）、handoff.md:69（post-review nudge 复查残余 P0/P1） | 交付链可追溯（需求→检查→handoff payload→closing summary），审查闭环经 spec-doc-review 选项与残余 nudge |
| X01 | pass | skills/spec-brainstorm/references/phase-0.md:60-67（coherent-work check：独立成果 vs 覆盖面切分、不造 roadmap；Deep feature/product 分级） | 在其职责面（大需求聚焦、分解粒度）有可定位承诺；共享写面/集成恢复显式移交 planning（approaches.md:24），未越界 |
| X02 | pass | brainstorm-sections.md:331-336（字段名跨版本稳定 + 改名破坏 resume 检测的说明）、:54-56（legacy 输入不迁移重写）、phase-0.md:12 与 skills/spec-plan/references/intake.md:42（legacy shape 双侧一致） | 自身 artifact contract 的版本稳定性、legacy 迁移边界、开放问题（Outstanding Questions 二分）均有承诺且与消费者对齐 |
| X03 | pass | brainstorm-sections.md:248-269（Dependencies/Assumptions + blocker 处置）、agents/…/blindspot-pass.md:41（hazard hunting：静默咬人的坑、未写入约定的约束）、handoff.md:28-33（Resolve Before Planning 非空则隐藏进入实施的选项） | 适用子面（风险对账、失效条件、阻塞门槛）有承诺；测试策略/发布/回滚显式归 planning 所有 |
| X04 | pass | handoff.md:5（context_facts_adapter/v1 带 source_identity/freshness/limitations）、plan-write.md:20（暂停保留 next question + source refs + invalidation）、settled-decisions.md:28-45（决策保留协议 + brief 输入合同） | 跨会话交接四要素、决策保留、知识候选（含失效条件）齐全；与 ideate→brainstorm brief 链路（settled-decisions.md:45）闭合 |

## Findings

1. **[P3/D05] verdict shape 三要素判据双写，无 owner 委托声明**
   位置：`skills/spec-brainstorm/references/phase-0.md:34` 与 `skills/spec-brainstorm/references/verdict-routing.md:5-11`。
   后果：两处近乎逐字独立维护同一判据（named external candidate / whether-to-commit intent / judged against this project）；当前一致，但未来单侧修订会造成 0.1c gate 判据分叉，而 eval 只能事后捕获。
   最小修复：phase-0.md 收敛为简式判据并显式声明 verdict-routing.md 为 shape 判据 owner——同文件 `phase-0.md:38` 已有 "The reference owns the offer construction, field mapping..." 的委托句式可扩展。也可保持现状成立：两处现内容一致且有 verdict 双 eval（`evals/cases/verdict-routes-to-pov.yaml`、`r2-verdict-graphql.yaml`）兜底。

2. **[P3/D05] references 中英文混排，可审计性受损**
   位置：`skills/spec-brainstorm/references/approaches.md:45`、`phase-0.md:49`、`synthesis-summary.md:45,49,53,170,172,222,228,230`、`handoff.md:62` 等（后续修订批次以中文补写，与文件英文主体不统一）。
   后果：语义完整、无功能影响，但 diff 评审与后续修订的语言基线混乱。
   最小修复：若统一语言，**必须**同步修改测试——`handoff.md:62` 的中文串（"委派一组独立、只读的 reviewer 执行代码审查"、"不授权任意 worker dispatch"）被 `tests/unit/spec-brainstorm-clarification-contracts.test.js:90-91` 与 `:120-121` pin，单改源码会破坏合同测试。不统一也可接受，但应作为已知状态记录。

3. **[P3/D05/B02] wireframe 的 markdown 降级方式在 sections 与 rendering 两个合同文件双写**
   位置：`skills/spec-brainstorm/references/brainstorm-sections.md:210-213`（"a mermaid layout diagram or prose in markdown; there is no inline-SVG wireframe in markdown"）与 `markdown-rendering.md:173-177`（同一降级规则的 rendering 侧表述）。
   后果：sections 文件按自身分工（`brainstorm-sections.md:5-6`：WHAT 归 sections、HOW 归 rendering）不应携带渲染 HOW；当前两处一致，drift 风险低（同 skill 目录、渲染文件有 parity 测试 `tests/unit/requirements-rendering-parity.test.js:14-19`）。
   最小修复：sections 侧留判据（何时给 visual）、删去 markdown 具体降级手段，指向 rendering reference；或保持现状成立。

4. **[P3/B04/D07] 两个 verdict eval case 把被测定义指向 runtime mirror**
   位置：`skills/spec-brainstorm/evals/cases/verdict-routes-to-pov.yaml:11`、`r2-verdict-graphql.yaml:11`（"本仓库 .claude/skills/spec-brainstorm/SKILL.md 是被测 skill 的定义文件"），配合 `evals/eval.yaml:4`（`environment: type: none`）。
   后果：若 host mirror 与 source drift，eval 实测的是 stale 定义；这正是 `REVIEW-EXECUTION-WORKFLOW.md` 第 7 节"eval 引擎加载来源"警告的类别。
   最小修复：case prompt 改指向 source 路径 `skills/spec-brainstorm/SKILL.md`，或在 eval.yaml 登记运行前 mirror 一致性前置检查。保持现状成立的条件：投射一致性测试链（`spec-brainstorm-clarification-contracts.test.js:105-130`、plugin drift 检测）持续在主测试链上运行。

5. **[观察/D03，保持现状成立] 全部验证门为 prose 约定，无 runtime 强制器**
   位置：`skills/spec-brainstorm/references/plan-write.md:12`、`brainstorm-sections.md:84-93`。
   说明：skill 未声称硬强制，且 `brainstorm-sections.md:93` 显式声明语义检查非脚本所有、失败必须诚实报告——符合仓库 gate 原则中“缺 runtime 强制能力时显式声明未强制”的诚实降级要求。无需修复。

## 主责深挖面发现

- **D01（去补丁化）**：逐条检查约束的失败依据——synthesis 两阶段拆分（`synthesis-summary.md:5` "the comprehensive audit shape produced too much detail"）、Path A/B 双信号 gate（`:56` 记录旧单信号 gate 是 real defect）、call-outs 的 consequence 类保留理由（`:74`）。退役面（visual helper、spec-proof、repo-profile-cache）均有测试锁定不回流（`spec-brainstorm-visual-retirement-contracts.test.js`、`plugin-modules.test.js:431-457`）。未发现指向已消亡机制的过时规则。唯一密度热点是 `SKILL.md:27-40` dispatch 段（约 260 词单段），但它是 18 包统一合同且带 yaml 锚，一致性收益大于局部可读性损失。
- **D02（领域知识）**：最强的证据是判据而非口号——attachment/evidence/specificity/counterfactual/durability 五类缺口透镜各有"何时出现、问什么"（`product-pressure-test.md:15-40`）；approach 反通用测试（"if it would appear in a generic listicle"，`approaches.md:7`）；gap 四分法与反仪式规则（`source_attempt: not-applicable`，`dialogue.md:7`）。
- **D03（验证门）**：机械/语义分工诚实（`handoff.md:5`：git 身份与 hash 是 script-owned facts，需求充分性是 LLM judgment）；claim verifier 的三值裁决与 inline fallback 的 coverage limitation 声明被 `dispatch-authorization-matrix-contracts.test.js:568-569` pin，防止 fallback 被包装成独立验证。
- **D04（衔接）**：做了生产者↔消费者双向对账：metadata 三键（`brainstorm-sections.md:313-317` ↔ `spec-plan/references/intake.md:45`）、`status: active` 仅 md（`brainstorm-sections.md:321-329` ↔ `spec-plan/references/plan-handoff.md:74` 只对 implementation-ready 放行 spec-work）、settled-decisions byte-identical 分发、dossier 路径传递、output 偏好不自动传播的显式边界（`output-mode.md:21`）。未发现字段或语义断点。
- **D05（紧凑性）**：入口 78 行 + 按 phase 委托的结构良好；真正的问题只有 Findings 1-3 的三处双写与混排，均为 P3。
- **D08（上下文效率）**：按需加载链完整且每处带 token/成本论证（渲染 reference 延迟加载 `output-mode.md:19`、scout gist-only `dialogue.md:19-21`、tier 决定 scan 深度 `dialogue.md:9-11`、Slack digest 预算 `agents/slack-researcher.md:104`）；防摘要遗漏由 artifact 内四件套兜底而非依赖会话记忆（`brainstorm-sections.md:262-269`、`plan-write.md:20`）。

## 未读文件

| 路径 | 理由 | 未覆盖后果 |
|---|---|---|
| `tests/unit/ce-upstream-reconciliation-v2.test.js`（仅读 brainstorm 相关行段 196-250、305-561，未逐行全文） | brainstorm 在该文件中仅作为 CE ledger 的 fixture 记录数据出现（grep 确认无对 brainstorm 源码语义的字符串断言） | 若存在未被我 grep 命中的 brainstorm 源码断言会被漏掉；风险低 |
| `tests/unit/plugin-modules.test.js` 1-400、600-935 行 | brainstorm 专属断言（retired helper 不投射 :566-584、Proof 标识清除 :431-457、handoff 全宿主投射）已读；其余为其他 skill 的投射通用断言 | 不影响 spec-brainstorm 专属结论 |
| `tests/unit/eval-fixture-contracts.test.js` 275-516 行 | 该段为 clarification replay 的 hash/聚合校验逻辑，对 brainstorm 仅引用路径字符串（:192-194） | 不影响静态合同结论 |
| `skills/spec-brainstorm/evals/fixtures/repos/mini-ledger/*` | eval 运行 fixture（README/package.json/server.js），仅被 case 运行时消费 | 无法评估 fixture 内容与 case 预期的匹配度；属 S3 行为层 |
| `skills/spec-plan/references/*.md`（仅 grep 读取 brainstorm 衔接相关段落） | spec-plan 全文属其自身评审范围；本轮只做 D04 衔接对账所需的消费侧证据 | spec-plan 内部流程的其他问题不在本轮范围 |
| `tests/unit/spec-brainstorm-visual-retirement-contracts.test.js` 等已读；`docs/plans/2026-11-03-…/core/00-07、09-12` | 检查表第 4 节已内嵌 D/B/X 判据，core 其余文件按第 2 节映射属流程背景 | 维度判据以 REVIEW-EXECUTION-WORKFLOW 第 4 节为准，已完整覆盖 |

## 结论一句话

spec-brainstorm 静态合同层 18 项全部 pass：入口/衔接/验证/降级/授权承诺可定位、内部一致、与消费者（spec-plan、spec-ideate、spec-pov、spec-lfg、spec-doc-review）双向对账无断点；未发现阻断或 P1/P2 缺陷，仅 4 条 P3 维护性 finding（verdict 判据双写、中英混排触及 pinned 测试、wireframe 降级双写、verdict eval 指向 runtime mirror），各有最小修复路径或保持现状成立的明确条件。
