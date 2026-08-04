---
title: "refactor: 治理头部 prose 的 keep/extract/remove —— ablation-first 收束(spec-plan 试点 → 重型节点推广)"
type: refactor
status: completed
date: 2026-06-11
deepened: 2026-06-11
spec_id: 2026-06-11-004-spec-plan-skill-slimming
plan_depth: deep
supersedes_strategy: "v1「按 rebar 外置 Phase 0 resume/deepen fast-path」"
---

# refactor: 治理头部 prose 的 keep/extract/remove —— ablation-first 收束

## Summary

把 `skills/spec-plan/SKILL.md` 收束的**真实靶子**从 v1 误定的「Phase 0.1 resume/deepen fast-path 外置」(2.5KB、上游内联保留、低价值)纠正为**治理头部 prose**:L17-101 的 10 节治理小节中,有约 38 行 / ~4KB 是**跨重型 skill 逐字重复、无机器消费者、未经 ablation 验证、且部分与全局 `CLAUDE.md` 语义重复**的纯劝导 prose。本计划用 **keep / extract / remove** 三分框架处理它们,且以 **ablation eval 先行**——不预设这些 prose 有效,先实测「注入 vs 不注入是否改变 agent 行为」,再据结果决定抽取或删除。抽取目标形态是 Anthropic 官方推荐的**渐进式披露 runtime-copied reference**:本试点先落到 `skills/spec-plan/references/governance-boundaries.md` 并在 spine 留一行按需加载指针,确保现有 Claude/Codex runtime 投影可达;跨节点真正消除 4× 重复留给 follow-up,避免本计划同时扩展 `docs/contracts` runtime delivery 机制。

本计划是**跨节点工作的试点**:治理头部是 4 个重型 workflow 节点(`spec-plan` 10 节、`spec-work` 8 节、`spec-code-review` 8 节、`spec-debug` 7 节)的共性问题,以及 `Workflow Contract Summary` / `Scenario Capability` 跨 18/37 skill 的共性问题。本计划在 spec-plan 上验证 keep/extract/remove 范式 + ablation harness,推广为独立 follow-up。

本计划**放弃** v1 的「按字节外置 Phase 0 分支」主路线:外部对照(上游 ce-plan 更大却内联保留同款 fast-path)与机制证据(L748 handoff 被跳过的真因是约束容量超支,非位置埋没)都证明那是错误靶子。

---

## Strategy Revision —— 与 v1 的差异及理由

v1 方案(同 spec_id 旧版)主路线是「按 rebar 把 Phase 0.1 resume/deepen fast-path 外置成 reference,降低无条件上下文成本」。经上游对照与外部实证,该路线被否决,核心修正如下:

1. **靶子错位**:Phase 0.1 fast-path 仅 2.5KB,且上游母版 `ce-plan`(83.2KB,比 spec-plan 大 12.5KB)**内联保留**同款 fast-path、甚至额外内联 approach-altitude。写 rebar 方法论的上游有充分机会外置却没做——无外部信号表明这是该切的肉。
2. **大头已被吃掉**:spec-plan 比上游小,正因它**已外置** synthesis(~9KB)与 handoff 菜单(~7KB)。便宜的外置红利**已基本吃光**,v1 把"红利部分吃掉"低估了现状。
3. **真实剩余靶子**:spec-plan 相对上游唯一仍大块内联的独有内容,是治理头部(上游 0 节、本仓 10 节)。其中 ~4KB 是跨 skill 重复的未验证 prose。
4. **机制纠正**:v1 的 L748「handoff 被跳过」证据,真因不是"长 spine 埋没"(L748 在文件末尾,U 曲线强区),而是 **ComplexBench 证实的约束容量上界**——约束总量超过模型可靠满足预算,部分被丢弃。降低 spine 的**约束总量**才对症,这正好是抽取治理 prose 的收益,而非外置 fast-path。
5. **保留 v1 的好骨架**:capability-binding test 改造(v1 的 R2/U2)外部独立验证为正确(prompt-as-contract / 用 verifier 度量),予以保留并强化。before/after 度量、fresh-source eval、source/runtime 边界、双宿主 projection 检查全部保留。

---

## Problem Frame

`spec-plan/SKILL.md` 当前 775 行 / 70.7KB。逐节实测后,体量可治理空间集中在**治理头部 L17-101(85 行 / 10.6KB)**,而非 v1 认定的 Phase 0。

治理头部 10 节按「是否有可验证消费者」截然两类:

- **有消费者/运行时对应面(必须保留,3 节)**:`Workflow Contract Summary`(其 `When To Use` / `When Not To Use` / `Outputs` / `Workflow` 是 `skills/retired-skill-review/scripts/lint-skill-structure.js` 的 **P1 REQUIRED_SECTIONS**,机器校验);`Plan-Only Safety Contract`(与 `templates/claude/hooks/spec-plan-guard` 的 planning-only attention guard 对应,非硬阻断);`Scenario Capability`(5 行指针,指向共享 matrix,audit 消费)。
- **无消费者的纯劝导(7 节 ≈ 38 行 ≈ ~4KB)**:`Context Orientation Anchor`、`Domain Language And Decision Ledger`、`Cache-Friendly Context Layout`、`Summary-First Handoff`、`Runtime Context Exclusion`、`Recall Trust Boundary`、`Capability-Class Evidence Boundary`。测试只断言其 prose **存在**(`toContain`),**不验证其生效**;无脚本/hook/路由消费;采纳稀疏(3-7/37);其中 `Runtime Context Exclusion` 与 `Recall Trust Boundary` 的语义**逐字**已在始终加载的 `CLAUDE.md`(L234 / L63)与 `AGENTS.md` 中。

**三类成本必须区分:**

- **(a) 跨节点重复成本** —— 同段治理 prose 在 4 个重型节点各抄一份(且已手抄漂移:plan 10 节 vs work/code-review 8 节)。本计划先在 spec-plan 试点 runtime-copied 抽取形态,跨节点真正单份共享或 per-skill reference 复制策略留给 follow-up。
- **(b) 约束容量挤占** —— spine 治理约束总量计入模型「可靠满足所有约束」的有限预算;超支会导致**任意位置**的 load-bearing 步骤(如 Phase 5 handoff)被概率性丢弃。**降低约束总量**的直接目标。
- **(c) 未验证劝导税** —— 7 节是否真改变 agent 行为,从未实测;可能为 null。**ablation 度量**的对象。

外部实证支撑(均经 3-0 对抗验证,见 Context & Research):更多 prose 不单调提升指令遵循、反降稳定性(LIFBench / LongICLBench / LooGLE);约束容量有上界、越 compose 越丢弃(ComplexBench);未验证的 role/劝导 prose 无可靠增益、须用 verifier 度量(persona 研究 / IFEval);Anthropic 自家架构即「抽取引用一次 + 渐进披露 + 移 prose 到单独文件」,subagent 不重灌完整 harness prompt。

---

## Requirements

- R1. 在动任何治理 prose 前,产出**治理头部 capability 清单**,逐节标注:`owner_consumer`(lint / hook / router / 无)、`cross_skill_count`(在 37 skill 的出现数)、`global_layer_duplicate`(是否与 `CLAUDE.md`/`AGENTS.md` 语义重复)、`verdict`(keep / extract / remove-pending)。无消费者且未 ablation 的节不得直接删。
- R2. 产出 **ablation eval harness**:对每个 extract/remove 候选节,以 fresh-source 方式实测「注入该节 vs 不注入」在一组代表性 planning 任务上是否改变可观测 agent 行为(是否排除 generated mirror、是否回 source 验证 advisory、handoff 是否触发)。结果作为 R4/R5 的前置判据。
- R3. 把 `tests/unit/spec-plan-contracts.test.js` 中绑定治理节**精确短语**的断言,改造为绑定**语义能力 + 其 owner surface**(spine / runtime-copied-reference / global-layer)的断言:能力仍被某可达载体约束时通过,能力丢失时失败。保留并新增 lint/projection 等**不可 rebind 的契约断言**。
- R4. 对 formal ablation 证明有可观测效果、且跨节点重复的治理节(Context Orientation / Domain Language / Cache-Friendly Layout / Summary-First Handoff 等),抽取为**渐进式披露 runtime-copied reference**,spine 仅留一行按需加载指针;本试点默认载体为 `skills/spec-plan/references/governance-boundaries.md`,因为现有 `spec-first init` 会递归投影 `skills/spec-plan/**` 到 Claude/Codex runtime。若实现期改选 `docs/contracts/**` 作为载体,必须先新增 generator/projection 机制并补双宿主测试,不得假设它会自动进入 runtime。
- R5. 对 formal ablation 证明效果为 null、且与全局层重复的治理节(Runtime Context Exclusion / Recall Trust Boundary / Capability-Class 的通用部分),在**确认其语义有到达终端运行时的载体**(runtime-copied reference 或扩展后的 bootstrap block)后删除;无法确认运行时载体的不得直接删,降级为 extract。
- R6. 必须保留 3 个 keep 节(`Workflow Contract Summary` / `Plan-Only Safety Contract` / `Scenario Capability`)的契约面与其 lint / attention-guard / audit 对应链路不受损;其中 `spec-plan-guard` 只提供 planning-only additionalContext,不得表述为硬阻断。
- R7. 保持 source/runtime 边界:只改 `skills/spec-plan/**`、新建 runtime-copied reference、必要时改 `templates/` bootstrap 注入与 `tests/`;不手改 `.claude/`、`.codex/`、`.agents/skills/` 镜像;runtime drift 用 `spec-first init` 修复。
- R8. command projection 与双宿主(Claude / Codex)投影在新增/重命名 runtime-copied reference 后仍正确,且新 reference 的 projection 路径断言**同时覆盖两宿主**。
- R9. user-visible 行为变化按仓库格式更新 `CHANGELOG.md`(含 `(user-visible)` 与配置的 developer author)。
- R10. 收束后,有消费者的 3 节及 load-bearing 执行步骤(handoff 必须触发 routed action、document review 强制、blocking question 规则)不得因抽取/删除而更易被跳过或丢失消费链路。

---

## Assumptions

- A1. 收束目标是「降低重复 + 降低约束总量 + 删除未验证税」,不是某个字节/行数 KPI。行数断言若加入 test,是宽松上界防回膨胀。
- A2. 治理头部是**跨 4 个重型节点 + 18 skill** 的共性问题;本计划在 spec-plan 上验证范式,推广为独立 follow-up(见 Deferred)。
- A3. 外部证据建立的是**机制 / 风险 + Anthropic 规范推荐**,**不存在**「内联 vs 共享治理 prose」的受控 A/B 实验;因此本计划用**仓内 ablation**(R2)补上这一缺失的直接证据,而非照搬外部结论。
- A4. 终端用户 repo 不含 spec-first 的 `CLAUDE.md`;注入用户 repo 的 bootstrap block 当前**只含路由决策集,不含 advisory/context 治理语义**。任何「删除依赖全局层兜底」的判断都必须先解决运行时载体问题(R5)。
- A5. ablation 可能结论为「某节确有效果」→ 该节转 extract 而非 remove;R5 是条件性的。

---

## Scope Boundaries

- 不动有可验证消费者的 3 节的契约内容(只在 R3 里改"测试如何断言它们",不改 prose 本身)。
- 不做逐句 prose 压缩(rebar 与 CLAUDE.md 精准修改原则反对)。
- 不外置 fresh-run 必经的 Phase 0.2-0.7 与 Phase 1-5 workflow 主体(v1 误判的 fast-path 外置已放弃)。
- 不改 `spec-plan` 对外行为契约:Phase 语义顺序、handoff menu 选项、Direct Evidence 块、U-ID 规则、blocking question 规则、markdown canonical / HTML sidecar 边界均保持。
- 不触碰 `docs/plans/2026-06-11-003-*-plan-mode-hardening-plan.md` 的 plan-only 执行 gate / hook 加固(正交;且 `Plan-Only Safety Contract` 属其 owner,本计划只保留不改)。

### Deferred to Follow-Up Work

- **跨节点推广**:把本计划验证过的 keep/extract/remove 范式 + runtime-copied reference 形态应用到 `spec-work` / `spec-code-review` / `spec-debug` 的同款治理节,以及 `Workflow Contract Summary` / `Scenario Capability` 的 18-skill 一致性收束。需先有本计划的 formal ablation 结论与 spec-plan 试点 reference 形态作为输入;若要做到真正单份共享,另行评估 `docs/contracts/**` runtime projection 或 per-skill reference 复制策略。
- **bootstrap block 扩展**:若 R5 需要把 advisory/context 治理语义送达终端运行时,评估扩展 SessionStart 注入的 bootstrap block(影响所有用户 repo,属横切),作为独立工作。

---

## Completion Criteria

- 标记 `completed` 前必须满足:R1 capability 清单已沉淀;R2 formal ablation 已运行且每个候选节有「有效 / null / 未决降 extract」实测结论(无法 dispatch 时记录原因,不得假称);R3 test 改造合入且通过(绑能力到位、旧绑短语断言已替换、lint/projection 不可 rebind 断言保留并为新 reference 新增双宿主断言);R4 抽取已落地且 runtime-copied reference 经投影到达 runtime;R5 删除仅在确认运行时载体后执行,否则降级 extract 并说明;`spec-first init` 已运行且记录 runtime 是否变化。
- **R5 删除门槛(行为门槛非审美门槛)**:任何"删除"的节,closeout 必须证明其语义在**终端运行时**仍有可达载体(指明是 runtime-copied reference 还是 bootstrap),并附 formal ablation 的 null 结论;无证据则不得删。
- **R6 保留门槛**:closeout 必须确认 `Workflow Contract Summary` 的 P1/P2 节仍通过 `lint-skill-structure.js`、`Plan-Only Safety Contract` 仍与 `spec-plan-guard` attention guard 保持一致且不伪造硬阻断、`Scenario Capability` 仍指向 matrix。
- **R10 行为门槛**:closeout 必须用两轮 fresh-source eval 证明——`spine-only scannability eval` 验证仅凭收束后 spine 能识别强制 doc-review、blocking question、handoff reference load、completion check;`spine + plan-handoff behavioral trace` 验证 fresh run 能到达并触发 Phase 5 routed handoff action。
- closeout 必须附 before/after 度量表:`SKILL.md bytes/lines`、`治理头部 bytes/lines`、`cross-node 重复节数`、`未验证劝导节数(ablation 前/后)`、`always-load reference count`、`有消费者契约节数(应不变)`。这些是观测口径非硬 KPI,要求趋势解释与不变量保持证据。

---

## Direct Evidence Readiness

- target_repo: spec-first(当前仓库根);对照仓 compound-engineering-plugin(上游 ce-plan,只读对照)
- evidence_sources: bounded direct reads、`wc`/`grep -rl`/`awk` 跨 skill 计数、本会话已读 SKILL.md / ce-plan 全文 / contract test / lint-skill-structure.js / CLAUDE.md / AGENTS.md、`planBundledAssetSync` projection precheck、首轮 ablation validation 文档、deep-research 外部报告(19 条 3-0 验证)
- source_refs: skills/spec-plan/SKILL.md、tests/unit/spec-plan-contracts.test.js、skills/retired-skill-review/scripts/lint-skill-structure.js、src/cli/plugin.js、src/cli/adapters/{claude,codex}.js、CLAUDE.md、AGENTS.md、templates/claude/hooks/spec-plan-guard、compound-engineering-plugin/plugins/compound-engineering/skills/ce-plan/SKILL.md
- current_revision: 9f24dfa9(工作树含本计划与 `docs/validation/spec-plan/` 首轮 ablation 文档修订;implementation source 尚未改)
- worktree_status: dirty-docs-only at review-fix time(`docs/plans/2026-06-11-004-refactor-spec-plan-skill-slimming-plan.md` modified, `docs/validation/spec-plan/` untracked;本次修复会同步 `CHANGELOG.md`)
- confidence: high on target selection and consumer ownership; medium on final extract/remove verdicts until formal U2 backlog completes
- limitations: U2 目前只有首轮信号与 harness 可行性,尚未完成全部候选节 formal ablation;`planBundledAssetSync` 已确认 `docs/contracts/**` 不会自动投影,因此 runtime carrier 改为 `skills/spec-plan/references/**`;未实测 `spec-first init` 投影 diff(实现期工作);外部证据缺「内联 vs 共享」直接 A/B(由 U2 formal ablation 补)

---

## Direct Evidence

- repo_scope: skills/spec-plan/、skills/retired-skill-review/scripts/、tests/unit/、templates/claude/hooks/、CLAUDE.md、AGENTS.md;对照 compound-engineering-plugin/.../ce-plan/
- source_reads_completed: SKILL.md 逐节字节(L17-101 治理头 85行/10.6KB;候选 7 节 ≈38行/~4KB)、跨 skill 治理节计数(Workflow Contract Summary 18/37、Scenario Capability 18/37、其余 3-7/37)、每 skill 治理节命中数(plan10/work8/code-review8/debug7,17 个 helper 为 0)、lint-skill-structure.js 的 REQUIRED_SECTIONS、spec-plan-guard hook 存在性、contract test 仅 `toContain`/`indexOf` 断言存在、CLAUDE.md L63/L234 与 AGENTS.md 同款语义、上游 ce-plan 791行/83.2KB 且内联 fast-path、`planBundledAssetSync` 确认 `docs/contracts/**` 不在 Claude/Codex runtime operations 中
- source_reads_required: U1 期逐节精读 L17-101 产出 capability 清单;U2 期需 fresh-source dispatch 能力;U5 期读 command projection 生成逻辑与 codex 投影
- commands_or_tools_used: `wc -c -l`、`grep -n/-rl/-c`、`awk` 分节、`git rev-parse`、deep-research workflow(98 agent)
- impact_on_plan: 把策略从「外置 Phase 0 fast-path」整体改为「治理头 keep/extract/remove + ablation-first」;确认真实靶子是 ~4KB 跨节点未验证 prose;确认删除受终端运行时载体约束;确认这是跨节点试点
- key_findings: 见 Problem Frame 与 Context & Research
- limitations: 同 Readiness

---

## Context & Research

### Relevant Code and Patterns

- `skills/spec-plan/SKILL.md` L17-101 — 治理头部,收束目标。
- `skills/retired-skill-review/scripts/lint-skill-structure.js` — `Workflow Contract Summary` 子节的 P1/P2 REQUIRED 校验者(keep 依据)。
- `templates/claude/hooks/spec-plan-guard` — `Plan-Only Safety Contract` 的 Claude runtime attention guard 对应面(非硬阻断;keep 依据)。
- `tests/unit/spec-plan-contracts.test.js` — 当前仅断言治理节 prose 存在;R3 改造对象。
- `CLAUDE.md` L63 / L234、`AGENTS.md` — `Recall Trust Boundary` / `Runtime Context Exclusion` 的全局层同款语义(remove 候选依据)。
- `skills/{spec-work,spec-code-review,spec-debug}/SKILL.md` — 同款治理节的其余重型 owner(推广目标,follow-up)。
- 上游 `compound-engineering-plugin/.../ce-plan/SKILL.md` — 无治理头、内联 fast-path 的对照基线。

### Institutional Learnings

- `docs/solutions/architecture-patterns/rebar-structure-skill-simplification-pattern-2026-06-04.md` — 收束方法论;本计划取其「test 绑能力先行、删除前迁移映射」,但**不取**其"按承重轴外置 workflow 分支"用于 Phase 0(已证错位)。
- `docs/solutions/architecture-patterns/competitor-skill-borrowing-judgment-2026-06-01.md` — 借功底不借形态;对照上游的依据。

### External References(deep-research,均经 3-0 对抗验证;诚实边界见下)

- 更多 prose 不单调提升、反降指令遵循稳定性:[LIFBench](https://arxiv.org/abs/2411.07037)、[LongICLBench](https://arxiv.org/abs/2404.02060)、[LooGLE](https://arxiv.org/abs/2311.04939)
- 约束容量有上界、越 compose 越丢弃约束(L748 被跳过的真机制):[ComplexBench, NeurIPS 2024](https://arxiv.org/abs/2407.03978)
- 位置偏置 U 曲线(次要机制,见诚实边界):[Lost in the Middle, TACL 2023](https://arxiv.org/abs/2307.03172)
- 未验证 role/劝导 prose 无可靠增益、须用 verifier 度量:[Persona 研究, EMNLP 2024 Findings](https://arxiv.org/abs/2311.10054)、[IFEval](https://arxiv.org/abs/2311.07911)
- 抽取引用一次 / 渐进披露 / 移 prose 到单独文件 / subagent 不重灌 harness prompt / guardrail 作独立调用:[Anthropic Subagents](https://docs.anthropic.com/en/docs/claude-code/sub-agents)、[Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)、[Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents)

**外部证据诚实边界(不可越界引用):**
- 长上下文/位置偏置论文测的是 QA/ICL 的**检索与指令遵循**,非"治理 prose vs workflow step 遵循";它们建立**机制与风险**,不直接证明稳定**前缀**会损害末尾步骤。
- 位置偏置弱区是**中段**;治理头在**开头**、handoff 在**末尾**(均强区)。故 L748 被跳过应归因 **ComplexBench 约束容量**,不归因位置埋没。
- persona 研究是事实 QA,类推治理 prose 是合理外推、非同构。
- **被否决、不得引用**:"单指令效果完全随机"(0-3)、"指令遵循在 16-32k 后急剧下降"(0-3)、"Anthropic 明说不可证明改善就别加"(1-2,非逐字)。
- 无「内联 vs 共享治理 prose」直接 A/B;由 U2 仓内 ablation 补这一缺口。

---

## Key Technical Decisions

- **ablation 先行,不预设有效**:外部一致结论是未验证 prose 边际效果不可靠、须用 verifier/ablation 度量。这把"删/抽取"从拍脑袋变为数据驱动,符合 CLAUDE.md「可验证事实优先于模型猜测」。U2 必须在 U4/U5 之前。
- **keep 依据是"有可验证消费者",非体量**:有 lint/hook/audit 消费的节即使最大(Workflow Contract Summary 34 行)也保留;无消费者的小节才是靶子。
- **抽取形态用渐进式披露 runtime-copied reference**:Anthropic 官方对 Skills 的推荐(name+desc 预载、body 按需);本试点降低 spec-plan spine 约束总量并证明 runtime 可达,跨节点 4× 重复消除留给 follow-up。
- **删除受终端运行时载体约束**:全局 `CLAUDE.md` 只在开发本仓在场;终端 repo 不在。"与全局重复故可删"只在确认语义有运行时载体后成立,否则降级 extract。
- **机制纠正为约束容量**:降低 spine 约束总量(抽取治理 prose)比外置某条分支更对症 L748 类丢弃;放弃 v1 的 fast-path 外置。
- **test 绑能力 + 保留契约断言**:lint/projection/heading-order 这类"phrase 即 contract"的断言不可 rebind;劝导节的断言改绑"能力在某可达载体中"。

---

## Open Questions

### Resolved During Planning

- 是否外置 Phase 0 fast-path:否(上游内联、低价值、错误机制)。已改为治理头 keep/extract/remove。
- 是否在 spec-plan 单点做头部去重:本计划作为试点做 spec-plan,跨节点推广剥离为 follow-up(Deferred)。
- 是否逐句压 prose:否。

### Deferred to Implementation

- 各候选节 ablation 结论(有效→extract / null→remove):U2 实测后定。
- 删除节的运行时载体选哪种(runtime-copied reference vs 扩展 bootstrap):U5 期据 R5 定;倾向 `skills/spec-plan/references/**` runtime-copied reference(渐进披露、零横切)。
- test 是否加宽松行数上界防回膨胀:U3 期决定。

---

## High-Level Technical Design

> *方向性指引,供 review,非实现规范。*

```text
执行依赖(以各单元 Dependencies 为准):
  U1 治理头 capability 清单(keep/extract/remove-pending 标注 + 跨 skill 计数 + 全局重复标注)
    └─► U2 ablation harness(逐候选节:注入 vs 不注入,实测行为差;补外部缺失的直接证据)
          └─► U3 test 绑能力改造(可在 U2 harness contract + U1 mapping 稳定后先做;不等待全部 verdict)
                └─► U4 抽取(formal ablation 有效 + 跨节点重复的节 → 渐进披露 runtime-copied reference,spine 留指针)
                      └─► U5 删除/降级(formal ablation null + 全局重复 + 确认运行时载体的节 → 删;否则降 extract)
                            └─► U6 projection 同步 + 双宿主 + 验证 + CHANGELOG(最后)

治理头 10 节裁决矩阵(U1 待确认细节,当前基于实测):
  KEEP(有可验证消费者):
    Workflow Contract Summary   —— lint P1/P2 REQUIRED(skill-review 机读)
    Plan-Only Safety Contract   —— spec-plan-guard attention guard 对应面(非硬阻断)
    Scenario Capability         —— 指向共享 matrix,audit 消费(已是抽取范式)
  EXTRACT(无消费者 + 跨节点重复;ablation 证有效则抽取):
    Context Orientation Anchor / Domain Language & Decision Ledger /
    Cache-Friendly Context Layout / Summary-First Handoff
    → skills/spec-plan/references/governance-boundaries.md(本试点 runtime-copied 渐进披露载体)
  REMOVE-pending(无消费者 + 全局层重复;ablation null + 有运行时载体则删,否则降 extract):
    Runtime Context Exclusion(≈CLAUDE.md L234)/ Recall Trust Boundary(≈CLAUDE.md L63)/
    Capability-Class Evidence Boundary(通用部分删,code-graph/project-graph 特化部分抽取)
```

---

## Implementation Units

执行顺序遵循各单元 `Dependencies`。U4/U5 不并行改同一批 source/test。

### U1. 治理头 capability 清单与裁决矩阵

**Goal:** 动任何 prose 前,确定每节的消费者、跨 skill 重复度、全局层重复、初步裁决,作为 U2-U5 前置。

**Requirements:** R1, R6

**Dependencies:** None

**Files:**
- Create: `docs/solutions/architecture-patterns/spec-plan-governance-header-capability-inventory-2026-06-11.md`
- Test: 无(分析产物)

**Approach:**
- 逐节精读 L17-101,产出表:`section`、`lines`、`owner_consumer`(lint / hook / router / 无)、`cross_skill_count`、`global_layer_duplicate`、`verdict`(keep / extract / remove-pending)。
- keep 的 3 节标注其消费链路(lint REQUIRED_SECTIONS 行号、spec-plan-guard、matrix 路径),供 R6 守护。
- extract/remove 候选标注「迁到哪」(runtime-copied reference)与「全局是否已有同款」(CLAUDE.md/AGENTS.md 行号)。
- 标注 `Capability-Class Evidence Boundary` 的通用 vs 特化拆分边界。
- 列出跨节点推广候选(work/code-review/debug 同款节、18-skill 共享节)供 follow-up。

**Verification:** 每节有明确 verdict 与依据;keep 节有消费链路证据;无 orphan(有待迁移内容但无去向)。

---

### U2. ablation eval harness(补外部缺失的直接证据)

**Goal:** 实测每个 extract/remove 候选节「注入 vs 不注入」是否改变可观测 agent 行为,作为 U4/U5 判据;不预设有效。当前首轮结果只证明 harness 可行和部分节存在信号,不是 U4/U5 的完整授权。

**Requirements:** R2

**Dependencies:** U1

**Files:**
- Create: `docs/validation/spec-plan/governance-header-ablation-2026-06-11.md`
- Create: `skills/spec-plan/evals/governance-ablation/`(若需固定任务集与判分锚点)
- Test: 无(eval 产物)

**Approach:**
- 设计一组代表性 planning 任务,每个绑定可观测行为锚点:是否排除 generated mirror、是否把 advisory(solutions/code-graph)当 advisory 回 source 验证、handoff 是否触发、context intake 是否按序。
- 对每候选节做 fresh-source A/B:同一任务,注入完整治理头 vs 移除该节,比较行为锚点。遵循 `docs/contracts/workflows/fresh-source-eval-checklist.md`。
- **confound 控制(已被首轮实测确认,必须遵守——证据见 `docs/validation/spec-plan/governance-header-ablation-2026-06-11.md`)**:① 任务**不得自带行为锚点线索**——测 `Recall Trust Boundary` 不得明示"dated N months ago"(staleness 先验)、测 `Capability-Class` 不得用 `processPayment` 等高风险域名(慎删先验);否则任务替治理节做工作,得**假 null**;② **全局层确认会泄漏进 subagent**——首轮 RCE 的无节臂自发引用 `spec-first init`/`role contract`,证明本仓 `CLAUDE.md`/`AGENTS.md` 进入了 subagent system prompt。故仓内 A/B 测的是「section vs (ambient 全局层 + 模型先验)」。**仓内 null 只授权 extract-to-runtime-copied-carrier,不直接授权 remove**;outright remove 必须 (a) **clean-room 复跑**(无 spec-first 全局层的临时工作区)确认终端运行时仍 null,或 (b) 语义已落到能投影到终端的 runtime-copied 载体(对齐 R5);③ 每节 A/B 各跑 ≥3 次估方差,单对仅 directional。
- 记录每节结论:`有可观测效果`(→ extract)/ `仓内 null 且 clean-room 确认 + 有运行时载体`(→ remove)/ `未决或混淆未排除`(→ 暂不删,最多降级 extract)。
- host dispatch 不可用则记录原因,不得假称已测。
- **U4/U5 no-go gate:**首轮 partial ablation 不授权抽取/删除。U4 只能处理 formal U2 已给出「有效」结论的候选节;U5 只能处理 formal U2 已给出「clean-room null + runtime carrier」证据的候选节。未完成 backlog 的节一律留在 spine 或降级 extract,不得删除。

**首轮 ablation (2026-06-11, partial,18 agent;详见 validation 文档):**
- **RCE(Runtime Context Exclusion)**:6/6 含/不含均排除生成镜像 → 仓内 NULL,但全局层泄漏证实,**待 clean-room 复跑**才可定 remove。
- **RTB(Recall Trust Boundary)**:有节臂 skepticism-first、无节臂"先采纳再核" → **弱效果,非 null → extract(不删)**。
- **CCEB(Capability-Class)**:6/6 不删但无节臂理由是 payment 高风险(任务混淆)→ **判定未决,中性函数名复跑**。
- harness 机械可行(18 agent 并行、~7s/agent、0 文件读取、隔离成功),U2 可规模化,但 U2 formal verdict 尚未完成。复跑 backlog 见 validation 文档。

**Verification:** formal U2 完成时,每候选节有 A/B 结论与证据;harness 可复跑;结论写入 validation 文档,供 U4/U5 引用。首轮 partial 只可作为方法学输入,不能作为删除依据。

---

### U3. contract test 从绑短语改为绑能力

**Goal:** 让 test 在「内容位置/载体变化但能力仍在」时通过、「能力丢失」时失败;保留不可 rebind 契约断言。

**Requirements:** R3, R6, R10

**Dependencies:** U1 and U2 harness contract/methodology stabilized; does not require every U2 candidate verdict to be final.

**Files:**
- Modify: `tests/unit/spec-plan-contracts.test.js`

**Approach:**
- 识别绑治理节精确短语的 `toContain`/`indexOf` 断言,改为「该能力的语义约束存在于 spine 或其指定 runtime-copied reference 之中」,允许内容落在 spine 或 runtime-copied reference。
- 每个改造测试追溯到 U1 的一行 capability,注明 owner surface 与 consumer。
- 对 R6 的 3 个 keep 节:`Workflow Contract Summary` 保留/强化 lint REQUIRED 对应断言;`Plan-Only Safety Contract` 保留;`Scenario Capability` 保留 matrix 指针断言——这些是不可 rebind 契约。
- 对 R10 load-bearing 步骤(handoff 触发、doc-review 强制、blocking question)补「能力仍被某可达载体约束」断言。
- 为新建 runtime-copied reference 新增 **projection 路径断言,同时覆盖 Claude 与 Codex 两宿主**(现有 test 只断言 Claude 侧,会漏 Codex drift)。
- 保留 heading-order 等产物契约断言。

**Test scenarios:**
- Happy: 当前内容下改造后全绿。
- Edge: 把某劝导节 prose 从 spine 挪到 runtime-copied reference(模拟 U4),test 仍通过。
- Error: 删除某 load-bearing 能力约束,test 失败并指出缺失能力。
- Integration: 与 lint/projection 断言共存,不破坏既有契约测试。

**Verification:** `npx jest tests/unit/spec-plan-contracts.test.js` 全绿;人为移除一条能力触发预期失败(反向验证一次并记录);抽查一个 rebind-allowed 能力(spine→reference 仍过)和一个不可 rebind 能力(lint/projection 改动必失败)。

---

### U4. 抽取有效且重复的治理节为渐进披露 runtime-copied reference

**Goal:** 把 formal ablation 证有效、且跨节点重复的劝导节移入按需加载 runtime-copied reference,spine 留指针;本试点先降低 spec-plan spine 约束总量并验证抽取形态,跨节点 4× 重复消除留给 follow-up。

**Requirements:** R4, R7, R10

**Dependencies:** U1, U2 formal verdicts for the specific candidate sections being moved, U3

**Files:**
- Create: `skills/spec-plan/references/governance-boundaries.md`(默认;若改用 `docs/contracts/**`,必须先新增 projection 机制并补双宿主 test)
- Modify: `skills/spec-plan/SKILL.md`(被抽取节收为一行 `STOP. read ...` 指针)
- Test: `tests/unit/spec-plan-contracts.test.js`

**Approach:**
- 按 U1 迁移映射 + U2 formal「有效」结论,把 Context Orientation / Domain Language / Cache-Friendly Layout / Summary-First Handoff 中**经 ablation 证有效**者移入 `skills/spec-plan/references/governance-boundaries.md`。
- spine 沿用既有 `STOP. read references/...` 强加载措辞留指针(参照现有 11 处模式),确保抽取不让步骤更易跳过(R10)。
- reference 必须能投影到终端 runtime(不只靠开发本仓 CLAUDE.md)。`skills/spec-plan/references/**` 由现有 `copyDirectoryWithTransform` / `planDirectoryWithTransform` 递归覆盖;实现期用 `planBundledAssetSync` 同时断言 Claude `.claude/spec-first/workflows/spec-plan/references/governance-boundaries.md` 与 Codex `.agents/skills/spec-plan/references/governance-boundaries.md`。
- 只改 source,不碰 mirror(R7)。

**Verification:** spine 指针可独立读懂;被抽取能力经 U3 test 验证仍在;spec-plan 治理头 always-load 字节下降;R10 通读确认 handoff/doc-review/blocking-question 三步无需进任何 reference 即可在 spine 读到。

---

### U5. 删除/降级与全局重复的未验证节

**Goal:** 对 formal ablation null + 全局重复的节,在确认运行时载体后删除;否则降级为 extract。

**Requirements:** R5, R7

**Dependencies:** U1, U2 formal verdicts for the specific candidate sections being removed, U3, U4

**Files:**
- Modify: `skills/spec-plan/SKILL.md`
- Possibly Modify: `skills/spec-plan/references/governance-boundaries.md` 或 bootstrap 注入(若需补运行时载体)
- Test: `tests/unit/spec-plan-contracts.test.js`

**Approach:**
- 对 Runtime Context Exclusion / Recall Trust Boundary / Capability-Class 通用部分:若 U2 formal verdict 为 null 且 U1 标注全局重复——**先确认终端运行时载体**(已抽到 U4 runtime-copied reference,或扩展 bootstrap;后者属横切,优先 runtime-copied reference)。
- 载体确认后删除 spine 该节;无法确认载体则降级为 extract 并记录理由(R5 门槛)。
- Capability-Class 的 code-graph/project-graph 特化部分随 U4 抽取,不随通用部分删。
- 删除前确认 U1 迁移映射覆盖其语义边界;删除后跑 orphan 检查。

**Verification:** 删除节均有 ablation null 证据 + 运行时载体证据;无法满足者降级为 extract 并说明;test 全绿。

---

### U6. projection 同步、双宿主、验证与 CHANGELOG

**Goal:** source 改动落地后确保 command/双宿主投影正确,跑聚焦验证,留痕 user-visible 文档。

**Requirements:** R7, R8, R9, R10

**Dependencies:** U1-U5

**Files:**
- Modify: `CHANGELOG.md`
- Inspect: `templates/claude/commands/spec/plan.md`、`src/cli/plugin.js`(投影 generator)
- Test: `tests/unit/spec-plan-contracts.test.js`、command/projection 与 mcp-setup contract

**Approach:**
- 确认新建 runtime-copied reference 被 generator(`copyDirectoryWithTransform`/`planDirectoryWithTransform` + `rewriteSourceSkillRuntimePaths`)递归发现并重写路径。默认路径 `skills/spec-plan/references/governance-boundaries.md` 无需注册 manifest;若实现期改用 `docs/contracts/**`,必须先新增 generator 复制面并用 test 证明 Claude/Codex 双宿主可达。
- 运行 `spec-first init` 重生成 runtime mirror(不手改),记录 Claude/Codex 两侧产物是否变化。
- 验证由窄到宽:`npx jest tests/unit/spec-plan-contracts.test.js` → `npm run lint:skill-entrypoints` → `npm run test:mcp-setup` → 按影响面决定 `npm run test:unit`。
- `CHANGELOG.md` 加 `(user-visible)` 条目(治理头结构变化影响调用者运行时阅读路径),用配置的 developer author。
- **before/after 度量为必需证据**:同口径统计 `SKILL.md bytes/lines`、`治理头 bytes/lines`、`cross-node 重复节数`、`未验证劝导节数(ablation 前/后)`、`always-load reference count`、`有消费者契约节数(应不变)`。写入 closeout。
- **两轮 fresh-source eval 为必需行为门槛**:`spine-only scannability eval` + `spine + plan-handoff behavioral trace`,沉淀到 `docs/validation/spec-plan/`。host dispatch 不可用才允许跳过并记录原因。
- **003 sequencing**:U1 必须基于 implementation start 时的 HEAD 重新确认。若 003(同改 SKILL.md / Phase 5 区域)先合入,对 HEAD 重跑 U1 清单与 U4/U5 再继续。

**Verification:** closeout 列出实跑命令、是否运行 init、产物是否变化、before/after 度量、两轮 fresh-source eval 结论、残余 limitation。

---

## System-Wide Impact

- **Interaction graph:** SKILL.md 是 source,经 command projection 与 `spec-first init` 投影到 `.claude/`/`.codex/`。本计划的新建 reference 默认放在 `skills/spec-plan/references/**`,随 skill directory 一起投影到终端 runtime;`docs/contracts/**` 当前不会随 runtime mirror 自动复制,不得作为删除节的隐式载体。downstream(spec-work/spec-write-tasks/spec-doc-review)消费生成 plan 产物,不直接消费 spine,故治理头收束不改下游产物契约。
- **Error propagation:** 删除/抽取若让 advisory-vs-confirmed 或 context 排除语义在运行时丢失,表现为 agent 误把 advisory 当 confirmed、或扫描 generated mirror。U2 ablation + U5 运行时载体证据 + U3 能力断言三重兜底。
- **Cross-node consistency:** 本计划只改 spec-plan;work/code-review/debug 的同款节暂不一致,follow-up 推广统一。closeout 须标注此暂时不一致为已知、有 follow-up。
- **Concurrent-plan coordination (001 / 003):** spec-plan 上有三份并行 active 计划。**004 是 enabler,先做完;001(decision-surface-coverage)已标记 PAUSED,待 004 后在新纪律下重推。** 004 与 001 同改 `SKILL.md` / `plan-sections.md` / `plan-template.md` / `markdown-rendering.md` / `spec-plan-contracts.test.js`(方向相反),并行实现必冲突;004 与 003(plan-mode-hardening)碰撞低(003 改 Phase 5 + hook,004 改 L17-101 头部),但 003 若中途合入,U1 行号清单须对 HEAD 重跑。**设计护栏:U4 的渐进披露 runtime-copied reference 必须设计得足够通用,能承载 001 之后的 conditional 内容(surface-coverage lens / module model),不得做成只装治理 prose 的私有形态——为 001 留接口,但不在本计划提前实现 001。** 004/U2 ablation harness 与 U3 绑能力测试规范是 001 校准时复用的共享纪律。
- **API surface parity:** Claude/Codex 双宿主投影必须同步(R8);runtime-copied reference 须 host-neutral。
- **Unchanged invariants:** keep 的 3 节契约面、Phase 语义顺序、handoff menu、Direct Evidence 块、U-ID、blocking question、markdown canonical/HTML sidecar 均不变。

---

## Risks & Dependencies

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| 删除节后语义在终端运行时丢失(全局层在用户 repo 不在场) | Medium | High | R5 删除门槛:必须先确认 runtime-copied reference/bootstrap 运行时载体;无载体降级 extract |
| ablation harness 设计不当,把"有效"测成"null"误删有用约束 | Medium | High | 行为锚点具体可观测;反向验证;keep 节不参与 ablation;结论存疑则保守降 extract |
| test 改造把绑短语换成过松断言,失去回归保护 | Medium | High | U1 capability 清单先行;每断言追溯 capability;反向验证;保留 lint/projection/heading-order 不可 rebind 断言 |
| 抽取后 spine 把 load-bearing 步骤埋得更易跳过 | Low | High | 沿用强加载 STOP 措辞;R10 显式验收;两轮 fresh-source eval |
| 抽取但 fresh run 仍每次读回,总 token 不降反升 | Low | Medium | 只抽取 fresh-run 非必经的劝导节;keep 节与必经步骤留 spine |
| 误引用被否决的外部结论(随机性/16-32k 急降/简最方案) | Low | Medium | Context & Research 明列禁引项;裁决只建立在 3-0 确认机制上 |
| runtime mirror 与 source 漂移 | Low | Medium | 只改 source,`spec-first init` 重生成,projection test 验证 |
| 与 003 plan-mode-hardening 冲突 | Low | Medium | 正交(治理 prose vs 执行 gate;Plan-Only Safety Contract 只保留不改);003 先合则对 HEAD 重跑 U1 |

---

## Alternative Approaches Considered

- **v1:按 rebar 外置 Phase 0.1 resume/deepen fast-path**:拒绝。上游 ce-plan 更大却内联保留同款 fast-path;靶子仅 2.5KB;L748 真因是约束容量非位置埋没。详见 Strategy Revision。
- **整块删除治理头部以对齐上游 ce-plan**:拒绝。治理头是 spec-first 的产品本体(Light contract + 证据边界);keep 的 3 节有真消费者;删了退回成裸 workflow。
- **不做 ablation,直接按"无消费者就删"删 7 节**:拒绝。外部一致要求 verifier/ablation 度量;且终端运行时载体问题会导致静默丢治理。
- **整块抽取 7 节为始终加载的共享前缀**:拒绝。会重建 always-load 成本(虽一次非 4×),违背渐进披露;应按需加载。
- **把试点 reference 放到 `docs/contracts/**` 且不改 generator**:拒绝。现有 runtime projection 递归复制 `skills/<skillName>/**`,不复制 `docs/contracts/**`;把删除节依赖放在那里会在终端用户 repo 丢失语义。若后续要做真正共享合同载体,必须作为单独 generator/projection 变更评审。
- **先做跨 37 skill 头部去重再收 spec-plan**:拒绝作为本计划范围。blast radius 大,应以 spec-plan 试点验证范式后独立立项。

---

## Success Metrics

- spec-plan 治理头部 always-load 重复 prose 下降;跨节点 `cross-node 重复节数` 在本计划中作为 follow-up 输入记录,不声称本试点已经消除 4× 重复。
- `未验证劝导节数` 在 ablation 后下降(有效→抽取,null→删/降级),且每节有实测依据而非主观判断。
- keep 的 3 节消费链路(lint / hook / audit)在收束后全部仍通过——`有消费者契约节数` 不变。
- 删除节的语义在终端运行时仍有可达载体(closeout 证据)。
- contract test 在内容/载体变化时不误报、能力丢失时必报;lint/projection 不可 rebind 断言保留。
- 双宿主与 command projection 在新增 runtime-copied reference 后仍正确,无 source/runtime 漂移。
- before/after 表用同一口径给出趋势解释与不变量证据,而非主观描述。
- 产出可作为跨节点推广 follow-up 直接输入的:capability 清单、ablation harness、runtime-copied reference 形态。

---

## Documentation / Operational Notes

- `CHANGELOG.md` 必须有 `(user-visible)` 条目(运行时阅读路径变化)。
- README 大概率无需改(不改对外 workflow 指令)。
- U1 capability 清单沉淀在 `docs/solutions/architecture-patterns/`,closeout 指向它,并附跨节点推广候选供 follow-up。
- U2 ablation 结果与 U6 两轮 fresh-source eval 沉淀在 `docs/validation/spec-plan/`,closeout 指向;无法执行须记录具体 runtime/dispatch 原因,不把未执行写成通过。
- 若 `spec-first init` 刷新 mirror,closeout 说明用了 init 及产物是否变化。
- 删除任何与全局重复的节,closeout 必须同时给出 formal ablation null 证据与运行时载体证据。

---

## Sources & References

- Project role contract: `docs/10-prompt/结构化项目角色契约.md`
- 收束目标: `skills/spec-plan/SKILL.md`(L17-101 治理头)
- keep 依据(消费者): `skills/retired-skill-review/scripts/lint-skill-structure.js`、`templates/claude/hooks/spec-plan-guard`、`docs/contracts/workflows/scenario-capability-matrix.md`
- 全局层同款语义: `CLAUDE.md` L63/L234、`AGENTS.md`
- contract 测试网: `tests/unit/spec-plan-contracts.test.js`
- source/runtime 边界: `docs/contracts/source-runtime-customization-boundary.md`、`docs/contracts/context-governance.md`
- fresh-source eval: `docs/contracts/workflows/fresh-source-eval-checklist.md`
- 方法论(部分采用): `docs/solutions/architecture-patterns/rebar-structure-skill-simplification-pattern-2026-06-04.md`
- 上游对照基线: `compound-engineering-plugin/plugins/compound-engineering/skills/ce-plan/SKILL.md`
- 正交计划: `docs/plans/2026-06-11-003-refactor-spec-plan-plan-mode-hardening-plan.md`
- 外部实证(deep-research,3-0 验证;禁引项见 Context & Research):
  - [Lost in the Middle (TACL 2023)](https://arxiv.org/abs/2307.03172)
  - [LIFBench](https://arxiv.org/abs/2411.07037)
  - [LongICLBench](https://arxiv.org/abs/2404.02060)
  - [LooGLE](https://arxiv.org/abs/2311.04939)
  - [ComplexBench (NeurIPS 2024)](https://arxiv.org/abs/2407.03978)
  - [Persona 研究 (EMNLP 2024 Findings)](https://arxiv.org/abs/2311.10054)
  - [IFEval](https://arxiv.org/abs/2311.07911)
  - [Anthropic Subagents](https://docs.anthropic.com/en/docs/claude-code/sub-agents)
  - [Anthropic Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
  - [Anthropic Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents)
