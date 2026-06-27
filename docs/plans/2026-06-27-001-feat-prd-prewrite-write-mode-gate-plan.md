---
spec_id: spec-prd-prewrite-write-mode-gate
title: "feat: prd-prewrite-guard 强制首次 PRD write 声明可写入 write_mode 路径"
type: feat
status: completed
date: 2026-06-27
completed: 2026-06-27
plan_depth: standard
author: leokuang
target_repo: "."
related_docs:
  - docs/adr/0002-spec-prd-stays-workflow-not-agent-collection.md
  - docs/02-架构设计/2026-06-27-spec-prd-workflow-stability-fix-recommendations.md
  - docs/02-架构设计/2026-06-25-spec-prd-执行流程图与质量闭环.md
external_refs:
  - https://www.anthropic.com/engineering/building-effective-agents
  - https://openai.github.io/openai-agents-python/guardrails/
  - https://docs.langchain.com/oss/python/langgraph/interrupts
  - https://docs.temporal.io/workflow-definition
local_benchmark_refs:
  - /Users/kuang/xiaobu/skills/skills/engineering/grill-with-docs/SKILL.md
  - /Users/kuang/xiaobu/skills/skills/productivity/grilling/SKILL.md
  - /Users/kuang/xiaobu/skills/skills/engineering/domain-modeling/SKILL.md
---

# feat: prd-prewrite-guard 强制首次 PRD write 声明可写入 write_mode 路径

## Summary

ADR `0002` 锁定了方向:`spec-prd` 不整体 agent 化,真正缺口是**第一次 durable PRD write 前缺确定性写前检查点**。本 plan 落地 ADR 的第一层——把 `prd-prewrite-guard` 的触发条件从「只认 ready-intent」扩到「**任何首次 PRD `Write` 缺可写入 `write_mode` 路径 token 即拦**」,把 Codex 已加的 run-local Decision Card 从可忽略的 prose 升级成 script 守的确定性写前闸。

根因复现(202957 真实运行):模型读完输入直接 `Write` 一份 frontmatter 无 `status`/无 `write_mode` 的 346 行 PRD,三条现有触发条件(`readyStatus ∨ machineReceipt ∨ (firstWrite ∧ readyIntent)`)全不命中,**穿透写前闸**,只在 closeout 撞 Stop hook 后才事后补字段收敛为 checkpoint。新增第四类触发条件直接堵这个穿透形态:逼模型在第一次写 PRD 前就声明走哪条路径(`ask-owner-first`/`checkpoint-prd`/`final-prd`/`route-out`),而不是写完全量 PRD 再被动收敛。

这是确定性运行边界(script 守 Gate),不引入任何 agent,符合角色契约「强运行边界 + 轻语义合同」。

2026-06-27 后续澄清:Requirements Grill 的执行纪律应**严格组合继承**原始 `grill-with-docs` 所调用的 `grilling + domain-modeling` 行为。二者不是两套可选动作,而是每个 owner-owned load-bearing branch 的同一套准出标准:先做 source-first lookup,同步挑战术语/模糊词/具体场景/代码文档矛盾;仍需 owner 判断时,一次只问一个问题、给 recommended answer 与后果、等待反馈后再进入下一问;resolved fact 写回 PRD-local sections,只有 resolved domain term 才懒写 `CONTEXT.md`,只有满足 ADR 三条件才建 ADR。目标是尽可能澄清需求细节,直到 source evidence、真实 owner answer、owner cap、route-out 或 non-ready checkpoint residue 之一成立。该继承是 Requirements Grill 的行为内核,不是把外部 skill 的 artifact topology 或 invocation 机制整体接管进 `$spec-prd`。

2026-06-27 source-level integration:外部 benchmark 不再只是仓外路径引用。`skills/spec-prd/references/grill-with-docs-integration.md` 已嵌入三份上游 `SKILL.md` 的 package-local source snapshot(`grill-with-docs`/`grilling`/`domain-modeling`),`skills/spec-prd/SKILL.md` 的 reference pointer 指向该本地快照与适配合同。运行期不依赖 `/Users/kuang/xiaobu/skills/...` 仓外路径;上游源码只作为纪律锚点,不变成新的公开入口或 PRD artifact topology。

---

## Completion Evidence

本计划已按最终方案完成并标记 `status: completed`。落地范围保持在写前副作用边界:

- Hook source: `templates/claude/hooks/prd-prewrite-guard` 新增 `hasDurableWriteMode` / `missingWriteModeOnFirstWrite`,首次 PRD `Write` 缺 durable-write path、非法 token 或 `write_mode: not-run` 时阻断;checker 缺失仍 fail-open。
- Workflow source: `skills/spec-prd/SKILL.md` 同步 Claude runtime mutation guard 说明,明确 `not-run` 不是 write path。
- Requirements Grill source integration: `skills/spec-prd/references/grill-with-docs-integration.md` 内嵌上游 `grill-with-docs`/`grilling`/`domain-modeling` 源码快照,`skills/spec-prd/SKILL.md` pointer 明确读取 package-local source snapshot。
- Tests: 新增 `tests/unit/prd-prewrite-guard-hook.test.js`,覆盖 10 个行为场景:缺 path、非法 token、`not-run`、三种可写入 path、已有 PRD 编辑、checker 缺失、非 PRD/非 Write/缺 artifact_kind、ready/machine receipt 回归。
- Runtime mirrors: 已运行 `node ./bin/spec-first.js init -y --claude` 与 `node ./bin/spec-first.js init -y --codex`;`.claude/hooks/prd-prewrite-guard` 与 source `cmp` 一致,`.claude/commands/spec/prd.md` 与 `.agents/skills/spec-prd/SKILL.md` 已包含 durable-write guard 锚点。
- Verification: `bash -n templates/claude/hooks/prd-prewrite-guard`;`npx jest tests/unit/prd-prewrite-guard-hook.test.js --runInBand`;`npx jest tests/unit/runtime-plan-contracts.test.js tests/unit/runtime-hook-permissions.test.js --runInBand`;`npx jest tests/unit/spec-prd-contracts.test.js --runInBand`;`npx jest tests/unit/changelog-format.test.js tests/unit/plan-status-taxonomy.test.js --runInBand`;`npm run lint:skill-entrypoints`;`git diff --check`。
- Not checked: `quick_validate.py skills/spec-prd` because `quick_validate.py` is not available in the current PATH and no repo-local equivalent script exists.

Residual boundary: Claude 有 PreToolUse 写前硬闸;Codex/无 PreToolUse 宿主仍只能消费更新后的 SKILL loud convention 与 closeout/finalize 出口闸。该计划不证明 owner 真回答、grill 充分性或需求质量,只阻断首次 durable write 前未选路径这个确定性控制流缺口。

Post-completion design clarification: Requirements Grill 的语义执行纪律按用户确认收紧为“严格组合继承 `grilling + domain-modeling`”。本澄清不改变已落地 hook 行为,但要求后续 `spec-prd` workflow/source 演进把该纪律作为 Requirements Grill 的 completion criterion:每个 owner-owned load-bearing branch 必须同时经过 source-first + domain-modeling semantic pressure + one-question-at-a-time owner interaction + recommended answer + feedback wait + PRD-local persistence 后关闭或显式降级。不能只问 owner 而不做 glossary/scenario/code contradiction,也不能只写 domain notes 而不等待 owner answer;checkpoint、Outstanding Questions 或 checker 字段修补都不能替代真实 grill。

---

## Decision Brief

- **Recommended approach:** 在 `prd-prewrite-guard` 现有 `node` 段内,复用已暴露的 `checkerFacts.write_mode`(checker 已解析并暴露 `facts.write_mode`),新增一类触发条件:`firstWrite && !可写入 write_mode 路径`。可写入路径是 `ask-owner-first`/`checkpoint-prd`/`final-prd`/`route-out`;checker 识别的 `not-run` 只表示 run-local 决策尚未发生,不能作为首次 durable write 路径。零新增解析逻辑,零新增 checker 改动。
- **Key decisions:** (1) 只在 `firstWrite`(目标 PRD 文件尚不存在)时强制 write_mode,**不**约束对已存在 PRD 的后续编辑(避免误伤 grill 过程中的增量更新);(2) 路径 token 判定**直接复用 checker 的 `write_mode` fact**,不在 hook 内重复维护解析枚举(防 source-of-truth 分叉),但把 `not-run` 视为不可写入;(3) block message 复用现有「选路径」文案骨架,新增一句明确「首次写 PRD 必须先声明 durable-write path」;(4) checker 不可用(`checkerFacts===null`)时**放行**,保持现有 fail-open 语义(hook 不能因 checker 缺失而硬拦合法写入)。
- **Validation focus:** 新建 prewrite guard 行为测试文件(当前**零行为测试**,是必须补的基线缺口),证明:无 write_mode 首次写被拦 / 非法或 `not-run` 首次写被拦 / durable-write path 首次写放行 / 已存在 PRD 编辑放行 / 非 PRD 路径放行 / checker 缺失放行。复用 `prd-readiness-guard-hook.test.js` 的 `spawnSync(HOOK_TEMPLATE, {input: JSON})` 模板。
- **Largest risks / boundaries:** 最大风险是**误伤合法首次写**——若模型本就打算写合法 checkpoint 但忘了 write_mode,会被拦;这是 intended(逼它声明),但 block message 必须清晰可恢复。次要风险是 checker 解析 write_mode 的边界(空值/大小写/别名)与 hook 判定一致——通过复用同一 `checkerFacts.write_mode` 消除,仅把 `not-run` 排除为不可写入路径。不改 Codex 正在改的 checker/finalize 语义;`SKILL.md` 只同步行为说明,避免 workflow source 与 hook 脱节。

---

## Problem Frame

`prd-prewrite-guard` 是 Claude PreToolUse hook,拦截直接把 PRD 写成 ready/final 的控制流违规。现有触发条件(`templates/claude/hooks/prd-prewrite-guard:46-52`):

```text
readyStatus      = frontmatter 含 status: ready-for-planning
machineReceipt   = frontmatter 含 readiness_verified_* 等机器收据字段
firstWrite       = 目标 PRD 文件尚不存在
readyIntent      = checkerFacts.ready_claim_present === true
block when: readyStatus || machineReceipt || (firstWrite && readyIntent)
```

**穿透形态(202957 实测):** 模型 `Write` 一份 frontmatter 只有 `artifact_kind: prd-requirements` + 业务字段、**无 `status`、无 `write_mode`、无 receipt** 的全量 PRD。此时 `readyStatus=false`、`machineReceipt=false`、`readyIntent=false`(没声称 ready)→ 三条件全 false → **放行**。模型于是写完整个 PRD,直到 closeout 才被 Stop hook(`prd-readiness-guard`)拦,然后进入「读 checker 源码逐条修字段」的收敛循环。

**根因:** 写前闸只覆盖「自称 ready」的形态,不覆盖「无路径声明的草稿直写」形态——而后者正是模型的默认失败路径(读→写全量 PRD→事后贴 readiness)。Codex 已在 SKILL 加 run-local Decision Card prose 要求写前声明 `write_mode`,但 prose 是可忽略的(202957 模型未发 Decision Card)。

**修复:** 把「首次写 PRD 必须带可写入 write_mode 路径」从 prose 升成 hook gate。Decision Card 的核心字段 `write_mode` 成为写前硬约束:首次写一份 PRD artifact,必须已经做出路径决策并写进 frontmatter,否则拦。

---

## Requirements

- R1. `prd-prewrite-guard` 必须在**首次写**(目标 PRD 文件不存在)一份 `artifact_kind: prd-requirements` 的 PRD 时,要求 frontmatter 含可写入 `write_mode` 路径 token;缺失、非法或仍为 `not-run` 时拦截。
- R2. 可写入 `write_mode` token 集是 `ask-owner-first`/`checkpoint-prd`/`final-prd`/`route-out`;hook 通过复用 `checkerFacts.write_mode` 实现,不在 hook 内重复解析枚举,只把 checker 识别的 `not-run` 视为“尚未决策,不可 durable write”。
- R3. 对**已存在**的 PRD 文件的后续 `Write`(grill 过程中的增量更新),新增的 write_mode 闸**不得**触发(只补 write_mode 缺失这一类,不约束 edit-in-place);现有的 `readyStatus`/`machineReceipt` 触发对已存在文件的行为保持不变。
- R4. checker 不可用(`tryBuildCheckerFacts` 返回 `null`)时,write_mode 闸**放行**(fail-open),与现有 `readyIntent` 在 checker 缺失时不触发的语义一致。
- R5. 非 PRD 路径(不匹配 `docs/brainstorms/.+-requirements.md`)、非 `Write` 工具、空 content、缺 `artifact_kind: prd-requirements` 的写入,保持现有早退放行,不受影响。
- R6. block message 必须明确告知:首次写 PRD 须先声明可写入 `write_mode` 路径,并给出四个可写入 token 与各自语义(复用现有「选路径」文案),引导模型回到写前路径决策而非删需求/修字段。
- R7. 必须新建 prewrite guard 行为测试(当前零行为测试),覆盖 R1–R5 的拦截/放行矩阵;source 改动后刷新 generated runtime mirror(`spec-first init`,不手改 `.claude/hooks/`)。
- R8. 不改 `check-prd-artifact.js`、`finalize-prd-artifact.js`、`prd-readiness-guard`;允许同步更新 `skills/spec-prd/SKILL.md` 中的 prewrite guard 行为说明,使 workflow source 与 hook 行为一致。本 plan 实现范围限 `prd-prewrite-guard` + 新测试 + SKILL/docs/changelog。
- R9. Requirements Grill 必须严格组合继承 `/Users/kuang/xiaobu/skills/skills/engineering/grill-with-docs` 的实际行为内核:它调用的 `grilling` 纪律(逐分支 relentless 访谈、一次一个问题、等待反馈、每问给 recommended answer、source-answerable gap 先查 source)必须与 `domain-modeling` 纪律(术语冲突挑战、fuzzy term sharpening、具体场景压测、代码/文档矛盾回证、resolved term/ADR-worthy decision 才懒写 context/ADR)在同一 load-bearing branch 内共同执行。禁止只问 owner 而跳过 glossary/scenario/source contradiction 压测;也禁止只沉淀 domain notes 而不等待 owner answer。目标是最大化需求细节澄清,直到 source evidence、真实 owner answer、owner cap、route-out 或 non-ready checkpoint residue 之一成立。本继承只覆盖 Requirements Grill 的执行纪律,不允许外部 skill 接管 `$spec-prd` 的 PRD artifact、readiness/finalize、handoff 或 generated runtime 边界。

---

## Scope Boundaries

### In Scope
- `templates/claude/hooks/prd-prewrite-guard` 新增「首次写缺可写入 write_mode 路径」触发条件。
- 新建 `tests/unit/prd-prewrite-guard-hook.test.js` 行为测试。
- `skills/spec-prd/SKILL.md` 同步声明 Claude `prd-prewrite-guard` 会阻断缺 durable-write `write_mode` path 或仍为 `not-run` 的首次 PRD write。
- Requirements Grill 设计澄清:严格组合继承 `grilling + domain-modeling` 执行纪律,作为后续 `spec-prd` source 演进的 completion criterion。
- `spec-first init` 刷新 `.claude/hooks/prd-prewrite-guard` runtime mirror。
- CHANGELOG + 必要 docs 同步。

### Deferred to Follow-Up Work
- ADR `0002` 第二/三层(保留已有 Product Reviewer / doc-review agent dispatch;未来视角走 triggered pack)——本 plan 不动。
- prewrite guard 对「已存在 PRD 升级为 final-prd」时是否需额外校验——现有 `readyStatus`/`readyIntent` 已覆盖自称 ready 形态,本 plan 不扩。
- F1/F2(design-acceptance 内联 token / 伪造 trace 空 owner 列,R12 天花板内)——归 P0-B 收口,不在本 plan。

### Outside this product's identity
- 不引入任何 agent / 多 agent 编排(ADR `0002` 已否决)。
- 不把 grill 真实性、owner 真实回答脚本化为 gate(R12 host-provenance 天花板)。
- 不把外部 `grill-with-docs` 整体变成 `$spec-prd` 的新主 workflow、持久状态机或 artifact topology;只继承它经 `grilling + domain-modeling` 表达的行为纪律。

---

## Direct Evidence

- target_repo: `.`
- source_refs:
  - `templates/claude/hooks/prd-prewrite-guard`(现有触发逻辑 line 46-66)
  - `skills/spec-prd/SKILL.md`(主 workflow spine、Run-Local Decision Card、Claude runtime mutation guard 行为说明)
  - `skills/spec-prd/scripts/check-prd-artifact.js:899-906`(write_mode 解析)、`:1085`(`facts.write_mode` 暴露)
  - `tests/unit/prd-readiness-guard-hook.test.js`(行为测试模板:spawnSync + stdin/HOOK_TEMPLATE)
  - `tests/unit/runtime-hook-permissions.test.js:39-121`(仅测可执行位,非行为)
  - `docs/adr/0002-spec-prd-stays-workflow-not-agent-collection.md`(决策方向)
  - `/Users/kuang/xiaobu/hsglobal/2026-06-27-202957-...txt`(穿透形态真实运行,仓外 user-provided evidence)
  - `/Users/kuang/xiaobu/skills/skills/engineering/grill-with-docs/SKILL.md`(原始 wrapper:Run `/grilling` session using `/domain-modeling`)
  - `/Users/kuang/xiaobu/skills/skills/productivity/grilling/SKILL.md`(relentless interview、one question at a time、wait for feedback、recommended answer、source-answerable gap 先查 source)
  - `/Users/kuang/xiaobu/skills/skills/engineering/domain-modeling/SKILL.md`(glossary challenge、fuzzy term sharpening、scenario stress、code contradiction、lazy `CONTEXT.md`/ADR)
  - `skills/spec-prd/references/grill-with-docs-integration.md`(spec-prd 内已保存原始 sustained interview + context/ADR 行为)
  - `skills/spec-prd/references/domain-language-and-decision-ledger.md`(Deep Requirements Grill 七项动作与 PRD-local persistence 边界)
  - Anthropic Building effective agents(官方):well-defined tasks 优先 workflow、简单可组合模式优先、agents 用于开放步数/动态决策。
  - OpenAI Agents SDK Guardrails(官方):guardrails 是运行期输入/输出/工具检查,tripwire 可在检测到违规时阻断继续执行。
  - LangGraph Interrupts(官方):HITL interrupt 保存状态并等待外部输入,可恢复继续;副作用前后要考虑 checkpoint/resume 边界。
  - Temporal Workflow Definition(官方):workflow definition 强调 deterministic constraints 与 replay,外部非确定性操作应移出 replay 路径。
- current_revision: `1dcf9ce5`
- worktree_dirty: true(Codex 并行改 SKILL/check-prd-artifact/finalize-test;prewrite-guard **不在**其改动面,零冲突)
- discovery_methods: 直接读 hook 源码、grep checker write_mode fact、ls/grep 测试文件、git status 确认冲突面
- tests_or_logs: 已只读复跑确认 checker 暴露 `facts.write_mode`、可识别值集、checkpoint 正常写入不被现有闸误伤(前序 session 探针)
- confidence: high(触发逻辑、checker fact、测试模板、冲突面全部直接核验)
- limitations: 202957 日志为仓外 user-provided evidence,行为测试只抽取最小 repro,不复制仓外 PRD 全文;Requirements Grill 继承纪律是 workflow semantic requirement,不是本 hook 可机械证明的事实。

---

## Context & Research

### Relevant Code and Patterns

- **prewrite guard 结构**:bash 包 `node /dev/fd/3` 段,读 stdin JSON(`tool_name`/`tool_input.file_path`/`tool_input.content`),早退链(非 Write / 非 PRD 路径 / 无 artifact_kind 逐层 `process.exit(0)`),最后 `block()` 用 `exit 2` + stderr。新触发条件插在现有 `if (readyStatus || machineReceipt || ...)` 同一判定块。
- **checker write_mode fact**:`extractDeclarationValue(text, 'write_mode', [可识别值集])` 返回 checker-recognized token 或空;`writeModeDeclaredValid = Boolean(writeModeValue)`。hook 侧 `checkerFacts.write_mode` 为空即「无可识别 write_mode」,`not-run` 即「尚未决策」。复用此 fact 使 hook 与 checker 对 write_mode 的解析保持**单一真相源**。
- **测试模板**:`prd-readiness-guard-hook.test.js` 用 `spawnSync(HOOK_TEMPLATE, {input, env})` 真跑 hook。prewrite guard 是 PreToolUse hook,需喂 stdin JSON(`{tool_name:'Write', tool_input:{file_path, content}, cwd}`),断言 `result.status`(0=放行,2=拦)与 stderr 文案。

### Requirements Grill Benchmark Fit

`/Users/kuang/xiaobu/skills/skills/engineering/grill-with-docs/SKILL.md` 本体不是完整流程,而是 wrapper:`Run a /grilling session, using the /domain-modeling skill.` 因此 `$spec-prd` 应继承的是这两个依赖暴露的行为纪律,而不是把外部 skill 的 invocation 或文件拓扑整体照搬。

| Source | Requirements Grill 严格继承 | 不复制到 `$spec-prd` |
|---|---|---|
| `grilling` | Relentless interview; walk each design/requirement branch; ask exactly one question at a time; wait for feedback; provide recommended answer; source-answerable question must be answered by source exploration first | Generic plan/design interview framing; standalone `/grilling` invocation |
| `domain-modeling` | Challenge glossary conflicts; sharpen fuzzy/overloaded terms; stress concrete edge scenarios; cross-reference code/docs and surface contradictions; lazily write `CONTEXT.md`/ADR only when a term/decision crystallizes | Treating `CONTEXT.md` as PRD/spec; eager context/ADR creation; implementation-decision dumping into glossary |
| `spec-prd` local contract | Persist resolved facts into PRD-local sections; keep `docs/brainstorms/*-requirements.md` as planning handoff; readiness/finalize remains producer-local; generated runtime mirrors remain generated | External skill taking ownership of PRD artifact, readiness outcome, finalize receipt, or source/runtime projection |

严格集成后的 Requirements Grill completion criterion:每个 owner-owned load-bearing branch 都必须先经过 source-first lookup 与 domain-modeling semantic pressure;仍由 owner 拥有时,必须进入 `grilling` 的 one-at-a-time interaction loop,等待每个回答后再继续。Completion 只允许五种信号:source evidence 关闭、真实 owner answer 关闭、trace fidelity 下 owner-capped、route-out、或 non-ready checkpoint residue 可见保留。Checkpoint 不能替代 `grilling + domain-modeling` loop。

| Integrated Requirements Grill step | Purpose | Completion signal |
|---|---|---|
| Source-first lookup | 先消除代码/文档可回答的问题,避免把可查事实推给 owner | gap 被 source ref 关闭,或明确转为 owner-owned |
| Glossary / term challenge | 挑战冲突术语与 overloaded language,防 PRD 用词漂移 | canonical term 写入 PRD-local wording;resolved domain term 才懒写 `CONTEXT.md` |
| Concrete scenario stress | 用边界场景压出范围、验收、降级和数据权威细节 | 场景结论写入 acceptance/scope/boundary,或保留为 blocking gap |
| Code/docs contradiction check | 防需求与现有系统事实矛盾 | 矛盾被 source/owner 决策关闭,或转为 checkpoint/route-out residue |
| One owner question at a time | 对仍 owner-owned 的分支做真实交互,避免批量问题被跳过 | 当前只问一个问题,带 recommended answer 与 consequence |
| Wait for feedback | 防模型自问自答或用假设替代 owner 反馈 | 收到 owner answer / owner cap / route-out 信号后才进入下一问 |
| Persist closure locally | 让已澄清事实进入 PRD artifact,供 readiness/handoff 消费 | resolved fact 写回 PRD-local sections 和 Owner Decision Trace |
| Context / ADR lazy write | 只把 durable domain language 或真实 tradeoff 提升到知识层 | `CONTEXT.md` 仅写 resolved term;ADR 仅在 hard-to-reverse + surprising + real tradeoff 三条件成立时创建 |

### Institutional Learnings

- ADR `0002`:确定性写前检查点是 script 守的运行边界,不是 agent 能给的;Decision Card 升 gate 是对症最小杠杆。
- 角色契约 §4:Gate 属「确定性可判定的不变量,不通过即阻断」,由 script 守。本闸正是此类(write_mode 声明可确定性判定)。
- stability-fix recommendations doc §节点4/P0-C:写前必须显式输出 next action,prose 不足以强制,需写前闸。

### Industry Best Practices

- **Anthropic / Building effective agents:** 对明确任务,workflow 提供更高 predictability/consistency;复杂度应从简单可组合 pattern 起步,只有任务需要动态多步自主决策时才升级为 agent。映射到 `spec-prd`:当前问题不是“缺一个专家 agent”,而是已知 PRD 主链中首次 `Write` 副作用可绕过,应保留 workflow 并补可确定 gate。
- **OpenAI Agents SDK / Guardrails:** guardrails 的工程价值在于把检查放进运行期边界,tripwire 可阻断继续执行。映射到 `spec-prd`:把 `write_mode` 从 prose Decision Card 提升到 Claude `PreToolUse` 写前 guard,比事后 Stop hook 修补更符合副作用前置防线。
- **LangGraph / Interrupts:** human-in-the-loop 的关键是可暂停、保存状态、等待外部输入并恢复,不是把所有 owner 判断脚本化。映射到 `spec-prd`:owner/grill 真实性仍属 LLM/host provenance 天花板;当前只 gate “有没有选路径”这个确定性 token,不假装证明 owner 真回答。
- **Temporal / Workflow Definition:** 可重放 workflow 要把 deterministic constraints 与外部非确定性操作分开。映射到 `spec-prd`:hook 只看目标路径、artifact kind、首次写入、checker fact 等确定性事实;Requirements Grill 充分性、需求质量和 owner 决策仍由 LLM/人工审查判断。

---

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

新增触发条件插入现有判定块,逻辑形如:

```text
// 现有
readyStatus    = /status: ready-for-planning/
machineReceipt = /readiness_verified_*/
firstWrite     = !exists(target)
readyIntent    = checkerFacts?.ready_claim_present === true

// 新增(R1-R4)
hasDurableWriteMode = checkerFacts && typeof checkerFacts.write_mode === 'string'
                    && checkerFacts.write_mode.length > 0
                    && checkerFacts.write_mode !== 'not-run'
missingWriteModeOnFirstWrite = firstWrite
                    && checkerFacts !== null      // checker 可用才判(R4 fail-open)
                    && !hasDurableWriteMode

block when: readyStatus || machineReceipt
            || (firstWrite && readyIntent)
            || missingWriteModeOnFirstWrite        // ← 新增
```

block message 分两种成因(自称 ready vs 缺 write_mode),复用现有「选路径」骨架,新增一句首句区分。

判定矩阵(首次写,checker 可用):

| frontmatter write_mode | 现有闸结果 | 新闸结果 | 最终 |
|---|---|---|---|
| 无 / 非法 token | 放行(若不自称 ready) | **拦(R1)** | 拦 |
| `not-run` | 放行 | **拦(R1/R2,尚未决策)** | 拦 |
| `checkpoint-prd` | 放行 | 放行 | 放行 |
| `ask-owner-first` | 放行 | 放行 | 放行 |
| `route-out` | 放行 | 放行 | 放行 |
| `final-prd` | 拦(readyIntent;checker 将 final-prd 视为 ready claim) | 放行 | 拦(现有闸) |

Requirements Grill discipline 是 write-mode decision 前的语义前置条件。本 hook 不机械证明它,但本 plan 将其视为 workflow-required:如果 Product Expert Lens 识别出 owner-owned load-bearing gaps,则 `write_mode=final-prd` 前必须按严格组合的 `grilling + domain-modeling` 纪律运行 Requirements Grill;否则诚实路径只能是 `ask-owner-first`、`checkpoint-prd` 或 `route-out`。

---

## Implementation Units

### U1. prd-prewrite-guard 新增首次写 write_mode 闸

**Goal:** 在现有触发判定中新增「首次写 PRD 缺可写入 write_mode 路径即拦」,复用 `checkerFacts.write_mode`,fail-open 于 checker 缺失。

**Requirements:** R1, R2, R3, R4, R5, R6

**Dependencies:** None

**Files:**
- Modify: `templates/claude/hooks/prd-prewrite-guard`

**Approach:**
- 在 `const readyIntent = ...`(line 50)后,新增 `hasDurableWriteMode` 与 `missingWriteModeOnFirstWrite` 派生(见 High-Level Technical Design)。
- 关键:`missingWriteModeOnFirstWrite` 必须 gated by `checkerFacts !== null`(R4 fail-open)且 `firstWrite`(R3 不约束 edit-in-place)。
- 把 `missingWriteModeOnFirstWrite` 并入 `if (readyStatus || machineReceipt || (firstWrite && readyIntent) || missingWriteModeOnFirstWrite)`。
- block message:在现有 reasonLines 基础上,当成因是「缺 write_mode」时,首句改为明确「A new PRD artifact's first Write must declare a durable-write path in `write_mode`」,保留四 token 语义说明(`ask-owner-first`/`checkpoint-prd`/`final-prd`/`route-out`)与「不要删需求/修字段」反模式提醒。两种成因可共用一段文案,只要同时覆盖「自称 ready」与「缺 write_mode」两类即可,避免分支膨胀。
- 不改任何早退链、`block()`、`tryBuildCheckerFacts`、checker。

**Patterns to follow:**
- 现有 `readyIntent` 的 `checkerFacts && checkerFacts.X` 防御式取值(防 null)。
- 现有 block message 的 reasonLines 数组拼接 + `checker_blocking_reason_codes` 附加。

**Test scenarios:**(行为测试在 U2)
- 见 U2 拦截/放行矩阵。

**Verification:**
- `bash -n templates/claude/hooks/prd-prewrite-guard` 语法通过。
- `node --check` 不适用(嵌入 heredoc);靠 U2 行为测试真跑验证。

---

### U2. prd-prewrite-guard 行为测试(新建基线)

**Goal:** 建立 prewrite guard 的行为测试基线(当前零行为测试),覆盖新 write_mode 闸的拦截/放行矩阵与既有触发不回归。

**Requirements:** R1, R2, R3, R4, R5, R7

**Dependencies:** U1

**Files:**
- Create: `tests/unit/prd-prewrite-guard-hook.test.js`

**Approach:**
- 复用 `prd-readiness-guard-hook.test.js` 的脚手架(makeTempDir / installRuntimeScripts / spawnSync HOOK_TEMPLATE),但 prewrite guard 是 PreToolUse hook:通过 `spawnSync(HOOK_TEMPLATE, {input: JSON.stringify({tool_name:'Write', tool_input:{file_path, content}, cwd:projectRoot})})` 喂 stdin。
- installRuntimeScripts 须把 `check-prd-artifact.js` 装到 `.claude/spec-first/workflows/spec-prd/scripts/`(hook 的 `tryBuildCheckerFacts` 从该路径 require)。
- 断言 `result.status`:0=放行,2=拦;拦时断言 stderr 含关键文案锚点。

**Test scenarios:**
- Happy path(放行):首次写带 `write_mode: checkpoint-prd` + `can_enter_spec_plan: no` 的 PRD → `status===0`。
- Happy path(放行):首次写带 `write_mode: ask-owner-first` → `status===0`。
- Happy path(放行):首次写带 `write_mode: route-out` → `status===0`。
- Error path(拦截,核心 202957 形态):首次写 frontmatter 仅 `artifact_kind: prd-requirements` + 业务字段、**无 write_mode、无 status** 的全量 PRD → `status===2`,stderr 含 `write_mode` 引导文案。Covers R1.
- Error path(拦截):首次写带**非法** write_mode(如 `write_mode: create`)→ `status===2`(checker 解析为空 → 无合法 write_mode)。Covers R2.
- Error path(拦截):首次写带 `write_mode: not-run` → `status===2`(`not-run` 只表示决策尚未发生,不是 durable write path)。Covers R1/R2.
- Edge case(放行,R3):目标 PRD 文件**已存在**,再次 Write 无 write_mode 的内容 → `status===0`(write_mode 闸只管首次写;edit-in-place 不拦)。
- Edge case(放行,R4 fail-open):checker 脚本**不存在**(不 installRuntimeScripts)+ 首次写无 write_mode → `status===0`。
- Edge case(放行,R5):非 PRD 路径(`docs/other.md`)首次写无 write_mode → `status===0`;非 Write 工具 → `status===0`;缺 `artifact_kind` → `status===0`。
- Regression(既有触发不变):首次写自称 `status: ready-for-planning` → `status===2`(现有 readyStatus 闸);带 `readiness_verified_by:` → `status===2`(machineReceipt 闸)。

**Verification:**
- `npx jest tests/unit/prd-prewrite-guard-hook.test.js --runInBand` 全绿。

---

### U3. Runtime mirror 刷新 + docs + changelog

**Goal:** 同步 generated runtime mirror,更新 changelog 与相关 docs,保持 source/runtime 与文档一致。

**Requirements:** R7, R8

**Dependencies:** U1, U2

**Files:**
- Regenerate(不手改): `.claude/hooks/prd-prewrite-guard`(经 `spec-first init`)
- Modify: `skills/spec-prd/SKILL.md`
- Modify: `CHANGELOG.md`
- Modify(可选): `docs/02-架构设计/2026-06-27-spec-prd-workflow-stability-fix-recommendations.md`(把 P0-C/节点4「写前必须显式 next action」标记为已落地写前闸)

**Approach:**
- source 改完跑 `spec-first init` 重生 `.claude/hooks/prd-prewrite-guard`,用 `git diff` 确认 mirror 与 source 一致、无手改痕迹。
- `skills/spec-prd/SKILL.md` 同步 Claude runtime mutation guard 行为说明:首次 PRD write 缺 durable-write `write_mode` path 或仍为 `not-run` 会被拦;Codex/无 PreToolUse 宿主仍是 loud convention。
- CHANGELOG 追加一条 user-visible:prewrite guard 现在首次写 PRD 缺 durable-write `write_mode` path 或仍为 `not-run` 即拦,把 Decision Card 从 prose 升为写前闸,引用 ADR `0002`。
- 注意 CHANGELOG 被 Codex 并行编辑:用精确单行插入,不吞 Codex 条目(本会话已验证的 patch 暂存法)。

**Test scenarios:**
- `npx jest tests/unit/runtime-hook-permissions.test.js --runInBand`(确认 mirror 投影自 source、可执行位正确)。
- `npx jest tests/unit/changelog-format.test.js --runInBand`。
- Test expectation: docs 改动 none -- docs-only,靠 changelog-format + git diff --check 覆盖。

**Verification:**
- `git diff` 确认 `.claude/hooks/prd-prewrite-guard` == source。
- `git diff --check` clean。

---

## System-Wide Impact

- **Interaction graph:** `prd-prewrite-guard`(PreToolUse)在模型 `Write` PRD 时拦截;新增条件只影响「首次写 PRD」路径。下游 `prd-readiness-guard`(Stop hook)、`check-prd-artifact.js`、`finalize` 不变。`spec-plan`/`spec-work` 不受影响。
- **双宿主非对称:** prewrite guard 是 **Claude-only** PreToolUse hook;Codex 无等价 PreToolUse primitive。本闸在 Claude 生效,Codex 侧仍靠 SKILL prose(Decision Card)+ finalize/closeout 出口闸——与现有 stability-fix 的双宿主非对称一致,docs 须诚实标注 Codex 不享此写前硬闸。
- **Error propagation:** 拦截经 `exit 2` + stderr,Claude 把 stderr 回灌给模型;模型下一步应补 write_mode 声明(回到写前路径决策),而非删需求。
- **Unchanged invariants:** `docs/brainstorms/*-requirements.md` 仍是唯一 PRD 路径;`status: ready-for-planning` 仍机器所有;write_mode 解析仍由 checker 单一定义。

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| 误伤合法首次写(模型本想写 checkpoint 但忘 write_mode) | 这是 intended(逼声明);block message 清晰可恢复,明确四 token 语义;U2 证明带 durable-write path 放行 |
| hook 与 checker 对 write_mode 判定分叉 | 复用同一 `checkerFacts.write_mode` fact,不在 hook 重维护解析枚举;仅排除 `not-run` 这个“尚未决策”状态(R2) |
| checker 缺失时硬拦合法写入 | fail-open:`missingWriteModeOnFirstWrite` gated by `checkerFacts !== null`(R4),U2 专测此路径 |
| edit-in-place 增量更新被误拦 | 闸 gated by `firstWrite`(R3),U2 专测已存在文件放行 |
| 与 Codex 并行改动冲突 | prewrite-guard 不在 Codex 改动面(已 git status 确认);本 plan 不碰 checker/finalize/readiness-guard,`SKILL.md` 只同步行为说明(R8) |
| CHANGELOG 并发编辑被吞 | 精确单行 patch 暂存(本会话已验证),不吞 Codex 条目 |
| runtime mirror 手改漂移 | 经 `spec-first init` 重生,git diff 确认(R7) |

---

## Alternative Approaches Considered

- **把 write_mode 闸做进 checker(`check-prd-artifact.js`)而非 hook:** rejected。checker 是 closeout/finalize 出口闸(读已写文件),管不到「写之前」;write_mode 写前约束本质是 PreToolUse 时机,只能在 hook。且 Codex 正在改 checker,改它会冲突。
- **在 hook 内重新维护 write_mode 合法枚举:** rejected。会与 checker 的 `extractDeclarationValue` 枚举分叉,违反单一真相源;复用 `checkerFacts.write_mode` 更轻、更稳,仅把 `not-run` 作为未决状态排除。
- **强制首次写必须是 `checkpoint-prd`(最严):** rejected。过度约束——`route-out`/`ask-owner-first`/`checkpoint-prd` 都是合法写前路径;闸只该管「有没有声明可写入路径」,不该替模型选路径。`final-prd` 首次写仍由既有 readyIntent 闸拦截,必须走 producer-local finalize path。
- **把 Decision Card 全字段(highest_risk_gap/next_action/why)都做成 gate:** rejected。其余字段是语义内容(撞 R12,hook 无法判真伪);只有 `write_mode` 是确定性可判定的 token。ADR `0002` 明确闸只升「确定性可判定」的部分。

---

## Open Questions

### Resolved During Planning
- 闸放 hook 还是 checker?hook(PreToolUse 时机,checker 管不到写前;且避开 Codex 改动面)。
- write_mode 解析集在哪定义?复用 checker `facts.write_mode`,hook 不重维护解析枚举;`not-run` 是未决状态,不是 durable write path。
- checker 缺失怎么办?fail-open 放行(与现有 readyIntent 语义一致)。
- 约束 edit-in-place 吗?不。只管首次写(firstWrite)。

### Deferred to Implementation
- block message 两种成因(自称 ready / 缺 write_mode)是合并一段还是分支——实现时按可读性定,R6 只要求文案同时覆盖两类,不规定分支结构。
- U2 测试里 checker 装载路径细节(`.claude/spec-first/workflows/spec-prd/scripts/`)以实现时实际 `tryBuildCheckerFacts` 解析路径为准,与 readiness-guard 测试的 installRuntimeScripts 对齐。

---

## Sources & References

- ADR: `docs/adr/0002-spec-prd-stays-workflow-not-agent-collection.md`
- Stability-fix recommendations: `docs/02-架构设计/2026-06-27-spec-prd-workflow-stability-fix-recommendations.md`(P0-C / 节点4)
- 执行流程图: `docs/02-架构设计/2026-06-25-spec-prd-执行流程图与质量闭环.md`
- Hook source: `templates/claude/hooks/prd-prewrite-guard`
- Workflow source: `skills/spec-prd/SKILL.md`
- Checker write_mode fact: `skills/spec-prd/scripts/check-prd-artifact.js:899-906, :1085`
- 测试模板: `tests/unit/prd-readiness-guard-hook.test.js`
- 真实运行(穿透形态): `~/xiaobu/hsglobal/2026-06-27-202957-local-command-caveatcaveat-the-messages-below.txt`
- Anthropic, “Building effective agents”: https://www.anthropic.com/engineering/building-effective-agents
- OpenAI Agents SDK, “Guardrails”: https://openai.github.io/openai-agents-python/guardrails/
- LangGraph, “Interrupts”: https://docs.langchain.com/oss/python/langgraph/interrupts
- Temporal, “Workflow Definition”: https://docs.temporal.io/workflow-definition
