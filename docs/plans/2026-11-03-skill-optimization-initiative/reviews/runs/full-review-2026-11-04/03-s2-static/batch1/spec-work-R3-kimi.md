现在我有足够证据形成评审结论。给出最终输出。

# spec-work 评审（R3）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | skills/spec-work/SKILL.md:82-91；references/work-intake.md:33-35；references/feedback-and-tests.md:21-24；references/implementation-quality.md:26-27 | Anti-rationalization 红旗表与「trivial 不加载完整细节」「trivial work does not need ceremony」均把过度指导收敛为按 slice/触发器加载，非机械补丁 |
| D02 | pass | skills/spec-work/references/implementation-quality.md:44-52；references/feedback-and-tests.md:79-95；references/execution-strategy.md:99-115 | 四姿态 posture、Thin-Glue owns/does-not-own、test-double fidelity order、worker dispatch facts 是项目特有领域知识而非通用流程控制；脚本/L L M 职责分界显式标注 |
| D03 | pass | skills/spec-work/SKILL.md:23-24；references/shipping-workflow.md:32-40,128-188；references/work-intake-and-task-pack.md:48-60 | 硬出口仅 `failed required verification` 由脚本验证（verification-run-summary + honest-closeout），其余明示 LLM-owned 语义出口，脚本不冒充语义判定 |
| D04 | pass | skills/spec-work/SKILL.md:26；references/return-to-caller.md:29-52；references/work-intake-and-task-pack.md:140-151；references/shipping-workflow.md:44-58 | 输入（task-pack/unified plan/bare-prompt）、输出（envelope + run artifact）、消费者（spec-code-review/LFG/tracker/compound）字段级对齐；task-context/v1 schema 承载到 review |
| D05 | pass | skills/spec-work/SKILL.md:1-126；tests/unit/spec-work-front-controller-contracts.test.js:48-52 | SKILL.md 限制在 462 行/49968 字节内，front-controller 模式有显式 contract 测试守护 |
| D06 | pass | skills/spec-work/references/execution-strategy.md:86-115,155-167；references/execution-engines.md:29-50；references/shipping-workflow.md:84 | host-neutral dispatch facts、`worker_git_index_enforcement: unavailable` inline-fallback、engine selection 不依赖 host 名称；不可用能力有 `subagent_capability_missing`/`worker_capability_unproven` reason code |
| D07 | pass | skills/spec-work/SKILL.md:82-91；references/implementation-loop.md:33；references/feedback-and-tests.md:60-84；tests/unit/spec-work-implementation-quality-contracts.test.js:131-191 | examples.json 与 evals/cases/*.yaml 按真实失败（reverse-mismatch/open-ended-500/r2）演化；反例进入 contract 测试 |
| D08 | pass | skills/spec-work/SKILL.md:30-51；references/input-triage.md:22-32；references/work-intake.md:39-41；references/workspace-setup.md:21-46 | Reference Trigger Map 按 phase 触发；input-triage 仅读 metadata；work-intake 用 section map 而非整读；D08 显式禁止「重复读取同 owner」 |
| B01 | pass | skills/spec-work/SKILL.md:3；references/work-intake.md:21-22；references/input-triage.md:48-50 | description 明确路由（spec-debug/spec-lfg/spec-resolve-pr-feedback）；open-ended 症状路由 spec-debug；负例由 `open-ended-routes-debug`、`r2-open-ended-500` eval case 守护 |
| B02 | pass | skills/spec-work/SKILL.md:19-28；references/return-to-caller.md:29-52；references/shipping-workflow.md:44-58；tests/unit/spec-work-shipping-contracts.test.js:70-100 | Input/Output/消费者清单在 SKILL.md Contract Summary 段，输出字段（verification_run_summary_ref、honest_closeout_verdict、fingerprint、run_artifact_path/reason）由 shipping 与 return-to-caller 唯一 owner 定义，contract 测试锁定 |
| B03 | pass | skills/spec-work/SKILL.md:76；references/execution-strategy.md:99-115,194-211；references/work-intake-and-task-pack.md:20；references/shipping-workflow.md:222-238 | commit/landing/dispatch/tracker 授权各自独立分离；`--repo` 不是 mutation 授权；材料内嵌指令不扩大授权（tracker-defer 显式 authorization 要求） |
| B04 | pass | skills/spec-work/SKILL.md:25；references/execution-strategy.md:48；references/work-intake.md:53；tests/unit/spec-lfg-contracts.test.js:167-179 | 「generated runtime mirrors are never source fixes」写在 SKILL 硬锚；fingerprint helper 在 spec-lfg 的 package-local projection 要求字节级一致且测试守护 |
| B05 | pass | skills/spec-work/SKILL.md:32,117；references/return-to-caller.md:17-19,56；references/work-intake-and-task-pack.md:121-128；references/execution-strategy.md:69-79,170-183；references/shipping-workflow.md:58,114-116 | 失败/恢复/隔离覆盖完整：required owner unreadable→blocked+recovery_path；task-pack digest drift→停并重校；idempotent re-entry（return-to-caller）；append-only state + CAS conflict；plan-changed-during-review blocker；worker_git_index_mutation_detected |
| B06 | pass | skills/spec-work/SKILL.md:99-109；references/shipping-workflow.md:32-40,86-118,138-188；references/review-findings-followup.md:1-148；references/work-intake-and-task-pack.md:160-175 | 需求→计划→实现→验证可追溯（U-IDs/R-IDs/源 plan hash + source-plan-section-titles + verified_worktree_fingerprint + run-artifact）；review→followup→residual 闭环带两轮上限与 P0/P1 阻断 |
| X01 | pass | skills/spec-work/references/execution-strategy.md:117-167；references/execution-engines.md:41-91；references/work-intake-and-task-pack.md:102-128 | 多模块/复杂依赖通过 task-pack execution_waves + dependency-aware serial/parallel + bounded wave contract + cold-start tax pricing 处理；允许宿主能力（goal/dynamic-workflow）而非另造编排 |
| X02 | pass | skills/spec-work/references/work-intake-and-task-pack.md:53-62,121-128；references/input-triage.md:33-46；references/shipping-workflow.md:112-118 | task-pack 与 source-plan 的 hash/digest drift 检查；unified metadata 冲突即 fail closed；source-plan semantic review 用 before/after hash 验证 plan 未在 review 期间变更 |
| X03 | pass | skills/spec-work/SKILL.md:56-60；references/shipping-workflow.md:70-118；references/feedback-and-tests.md:86-95；references/execution-strategy.md:155-167 | 高风险场景（foreign-residual-workspace）默认 blocked-action-required；mutation testing/anti-gaming/false-green 检查；worker git-index enforcement receipt 才能开 mutation worker |
| X04 | pass | skills/spec-work/references/return-to-caller.md:29-66；references/shipping-workflow.md:138-188,204-212；references/execution-strategy.md:170-183 | 跨会话交接通过 return-to-caller envelope（带 fingerprint + run_artifact_path + claim_limitations + freshness）；append-only state generation + previous_sha256 chain 支持 compaction/resume；handoff 明确 freshness/limitations |

## Findings

1. **SKILL.md:24  Enforcement provenance 自我声明偏乐观**
   - 位置：skills/spec-work/SKILL.md:23-24
   - 后果：文案写「only `failed required verification` is script-verified (closeout chain: verification-run-summary + spec-first internal honest-closeout)」。这是结构层承诺，但 honest-closeout 是 schema/shape 验证而非行为语义验证；LLM 仍可能组装一个结构上 verified 但语义上漏 required intent 的 claims payload。Required-Proof Reconciliation（shipping-workflow.md:32-40）恰好明示「首轮 reconciliation 是 LLM-owned semantic exit gate, 不是 schema hard enforcement」，但 SKILL.md 的总结句把这点弱化为「script-verified」，消费者读到时容易把 `verified` 当作机械地板之上的完整保证。
   - 最小修复建议：把 SKILL.md:24 改为「`failed required verification` 由脚本在 schema/shape 层验证（verification-run-summary + honest-closeout）；其上的 required-proof semantic reconciliation 仍是 LLM-owned gate（见 shipping-workflow § Required-Proof Reconciliation）」。保持现状亦可接受——references 内部一致，SKILL.md 只是摘要简化。

2. **SKILL.md:40  Return-to-caller unreadable 时的「Minimum blocked recovery only」过于抽象**
   - 位置：skills/spec-work/SKILL.md:40（Reference Trigger Map 行）
   - 后果：return-to-caller 是 caller-owned 模式的关键出口，其 unreadable fallback 在 SKILL.md 仅一句「Minimum blocked recovery only」。具体 envelope 形状（`status: blocked`, `plan_path`, `changed_state`, `blockers`, `recovery_path`）只在 SKILL.md:117 与 return-to-caller.md:17-19 出现；Reference Trigger Map 行本身没指过去。触发器表被设计为「读到即知要不要 load」，但读者只看该表不知道 fallback envelope 必填字段。
   - 最小修复建议：把该行 If-unread 列改为「Minimum blocked recovery envelope (see Return-to-Caller Mode section)」。非阻断。

3. **evals/fixtures/scripts/check-*.sh 与 spec-work-outcome-judges 校准的耦合未在 SKILL.md 或 references 显式化**
   - 位置：skills/spec-work/evals/fixtures/scripts/check-closeout-order.sh；tests/unit/spec-work-outcome-judges.test.js:163-170
   - 后果：outcome judge 脚本通过 `EVAL_EXIT_CODE`/`EVAL_FINAL_MESSAGE`/`EVAL_TRANSCRIPT_PATH` 环境变量驱动，且由 `scripts/evals/build-outcome-judges.cjs --check` 验证「bundled judges stay self-contained and synchronized with canonical eval helpers」。这条同步链对未来修改 spec-work 行为契约的维护者不可见：改 return-to-caller envelope 字段时，SKILL.md 没有提示要同步改 judge 脚本与 calibration 测试。可能在改字段后只看到 judge 校准测试爆掉才回查。
   - 最小修复建议：在 `references/return-to-caller.md` 的 envelope 定义顶部加一行：「任何 envelope 字段变更必须同步 `evals/fixtures/scripts/check-return-to-caller.sh`、`check-closeout-order.sh` 与 `tests/unit/spec-work-outcome-judges.test.js` calibration」。这是「保持现状成立」级别的改进建议，非缺陷。

4. **references/implementation-loop.md:5  Owner 权属声明与 execution-strategy.md:5-13 略有重叠**
   - 位置：skills/spec-work/references/implementation-loop.md:5；references/execution-strategy.md:5-13
   - 后果：implementation-loop 说 execution-strategy owns commit and dispatch authorization，但 execution-strategy 的 Owned 列表还包含「Build the task tracker」「Select an execution engine」——而 implementation-loop.md:19-32 的 Task Execution Loop 步骤 1 自身也执行任务循环（recheck task-pack pins、apply feedback 等）。两份文档各自声明 Owned/Not Owned，但对「task tracker 从哪个 owner 进入 task execution loop」的接缝没有一句相互指向；读者要交叉读才能确认「tracker 由 execution-strategy 建、loop 由 implementation-loop 跑、commit 由 execution-strategy 守」。
   - 最小修复建议：在 implementation-loop.md 第 5 行 Owned/Not Owned 段补一句「Task tracker is built by execution-strategy; this loop consumes it」。非阻断，结构一致性已足够。

5. **references/shipping-workflow.md:188  关于 fingerprint 不被 run-summary 写入影响的论证有循环风险**
   - 位置：skills/spec-work/references/shipping-workflow.md:188
   - 后果：文本说「run summary 与 run artifact 都写在被 ignore 的 `.spec-first/workflows/` 下，因此这些写入不改变指纹」。这一保证依赖 `.spec-first/workflows/` 始终被 `.gitignore` 覆盖；脚本 `working-tree-fingerprint.cjs:79-83` 用 `git status --porcelain=v1 -z --untracked-files=all` + `ls-files --others --exclude-standard`，确实会受 gitignore 影响。但如果某个项目未 ignore `.spec-first/workflows/`，fingerprint 就会在 closeout 写入后变化，与 before/after 不变假设冲突。spec-work 没有前置检查该 ignore 是否生效。
   - 最小修复建议：在 `working-tree-fingerprint.cjs` 或 shipping Step E 加一条确定性前置：调 `git check-ignore -v .spec-first/workflows/<workspace-slug>/<run-id>/` 并断言 ignored；未 ignored 时记录 `fingerprint-stability-unverified` limitation。当前属「机制存在但依赖隐式前置」。

## 主责深挖面发现（B05/B06 + 归因验证）

**B05 失败/恢复/隔离 — 机制与触发核对**

| 失败面 | 机制 | 触发位置 | evals/cases 是否覆盖 |
|---|---|---|---|
| Required owner unreadable | preserve artifacts + blocked + recovery_path | SKILL.md:32；return-to-caller.md:17-19 | 未直接覆盖（no case 模拟 references 缺失） |
| 工具缺失（git/Node/helper） | `fingerprint-helper-unavailable` blocker，不伪造对象 | return-to-caller.md:42；shipping-workflow.md:188 | 未直接覆盖 |
| 部分成功（行为已变但 evidence 缺失） | idempotent re-entry 重跑 Verification Contract，禁止复用旧 summary/fingerprint | return-to-caller.md:56 | `return-to-caller-envelope` 间接覆盖；显式 idempotency 无 case |
| 重试上限 | review 最多两轮（initial + one bounded follow-up） | work-intake-and-task-pack.md:172；review-findings-followup.md:59 | `required-review-p1-block` example 覆盖 |
| 重复执行（drift） | task-pack digest drift → 停全部 dependents | work-intake-and-task-pack.md:113-128 | `drifted-pack-rejects` case + `task-pack-drift-before-next-task` example 覆盖 |
| 中断恢复（resumable run） | append-only state/<generation>.json + previous_sha256 chain + `run-state-conflict`/`run-source-drifted` | execution-strategy.md:170-183；shipping-workflow.md:58 | 未直接覆盖（无 case 模拟中断） |
| dirty overlap | 分类 + preservation strategy + 不 stage user hunks；overlap 文件用 task-only index 或不 commit | execution-strategy.md:40-46,200-201 | 未直接覆盖 |
| 外部副作用（out-of-repo state） | 完成判定基于 observed state，不从 clean tree 或 tracker write 推导 | implementation-loop.md:24 | 未直接覆盖 |
| foreign residual | scenario-capability `blocked-action-required` 阻断 mutation/strong claims | SKILL.md:56-58；execution-strategy.md:69-79 | 未直接覆盖 |
| Worker git index 篡改 | enforcement receipt unavailable → `worker_git_index_enforcement_unavailable` inline fallback；mutation detected → block integration + 独立完成 claim | execution-strategy.md:155-158 | 未直接覆盖 |
| plan 在 review 期间被改 | before/after hash 双跑；二次漂移即 `plan-changed-during-review` blocker | shipping-workflow.md:114-116 | 未直接覆盖 |

**归因判断**：B05 的「机制」覆盖在静态层是充分的；evals/cases 仅直接覆盖 drift 与 lifecycle 两类。其余 9 类的机制**存在但触发未被行为证据锁定**——这是「机制存在但未触发」与「机制缺失」的边界情形：合同测试（`spec-work-front-controller-contracts.test.js:70-83` unread fallbacks、`spec-work-lfg-recovery-contracts.test.js:18-28` append-only state）只断言文本 marker 存在，不证明模型在真实失败时选用正确 fallback。属于「机制已入册，但 behavior_quality 证据尚未采集」，非机制缺失。

**B06 完整交付与审查质量 — 机制与触发核对**

| 完整交付面 | 机制 | 触发位置 |
|---|---|---|
| 需求→计划→实现追溯 | U-IDs + R-IDs + source_plan_hash + task_pack_digest + source_plan_section_titles | work-intake-and-task-pack.md:140-151；implementation-loop.md:85 |
| 需求→验证 | Required-Proof Reconciliation 每 intent 必须对应 result/N-A/deferred/unbound limitation | shipping-workflow.md:32-40 |
| 实现→最终树 | verified_worktree_fingerprint（HEAD+tracked diff+untracked bytes） | return-to-caller.md:42 |
| 审查视角选取 | 按变更风险（mechanical/targeted manual/full/deep）显式分层；deep 仅由 plan/task/user 显式触发 | shipping-workflow.md:70-84 |
| 误报/漏报 | review eligibility filter（rejected/unresolved 永不入 apply queue）；autofix_class 是信号非权限 | review-findings-followup.md:74-87 |
| 修复闭环 | followup 两轮上限 + P0/P1 阻断 + 修复后必须 rerun affected verification | work-intake-and-task-pack.md:172；review-findings-followup.md:131 |
| 未完成披露 | `honest_closeout_verdict: degraded/unsupported` + `claim_limitations`；`overall != verified` 时禁止声称 all tests passed | shipping-workflow.md:165-168 |
| Residual 出口 | Interactive 四选项 / Headless 默认不接受 P0/P1；`Accept and proceed` 必须 durable sink（PR Known Residuals 或 `docs/residual-review-findings/`） | shipping-workflow.md:86-106 |

**归因判断**：B06 的机制在 references 内闭合，且 LFG 侧（`spec-lfg/references/work-return.md:28-32`）作消费者显式校验 envelope 形状——即 B06 的「完整性」有上下游双向约束。calibration 测试（`spec-work-outcome-judges.test.js:116-150`）通过 `missing-trace`/`reversed`/`echo`/`wrong-summary`/`false-flag`/`stale-fingerprint` 六类反例直接对抗「evidence chain 伪造」，这是「机制存在且被负向触发覆盖」的少数已被行为校准的面。其余面（审查视角选取、修复闭环、residual 出口）的负向行为样本未入库。

**主责深挖总结**：B05/B06 机制均存在；evals 现有 10 个 case 主要守护入口路由与 closeout 证据链形状，对「失败/恢复路径」与「审查闭环」的行为触发覆盖稀疏。这不是「机制缺失」，也不是「机制存在但保证不会触发」——是「行为校准样本尚未积累」。按 core/00 三层证据框架，structure_contract 层为 pass；behavior_quality 层对这些子项仍为 not-verified。

## 未读文件

| 路径 | 理由 | 未覆盖后果 |
|---|---|---|
| skills/spec-work/evals/fixtures/scripts/check-*.sh（6 个脚本） | 只读了对应的 spec-work-outcome-judges.test.js 调用方式与契约，脚本内部断言细节未逐行展开 | 不能逐字段独立验证 judge 脚本断言与 spec-work envelope 字段的逐一对齐；依赖 contract 测试守护 |
| skills/spec-work/evals/fixtures/repos/{reqonly-plan,done-plan,drifted-pack,mini-ledger-guarded2} 内容 | fixture 内部 plan/tasks/源码未逐一展开 | 不能验证 fixture 是否仍可触发预期路径；依赖 calibration 测试守护 |
| tests/unit/anti-rationalization-contracts.test.js 等其他消费者测试（consumers.txt 中 ~20 个） | 已在 SKILL/references 直接看到对应 marker；未逐一展开测试代码 | 测试可能在守护额外细节未被发现；本轮聚焦 spec-work 主体合同 |
| tests/integration/spec-work-closeout-producer.test.js | 与 run-artifact producer 相关；静态层合同已由 shipping-workflow.md 与 spec-work-run-artifact-contract.test.js 覆盖 | 未确认 producer 真实写入路径与 schema 完整对齐 |
| docs/contracts/workflows/scenario-capability-matrix.md | SKILL.md:55 引用；本轮假定其存在且按引用语义工作 | 未验证 scenario-capability-matrix 的实际内容是否与 spec-work 的 override 描述一致 |
| docs/contracts/workflows/spec-work-run-artifact.schema.json | run-artifact schema 未逐字段读 | 未独立验证 schema 与 shipping-workflow.md Step D 字段一一对应 |
| src/cli/helpers/spec-work-run-artifact.js、verification-run-summary.js、honest-closeout.js | 脚本层实现，本轮聚焦 skill 层 | 不能验证脚本实现是否真正拒绝伪造；静态层承诺与实现可能漂移 |

## 结论一句话

spec-work 在静态合同层（D01-D08、B01-B06、X01-X04 共 18 项）全部 pass，B05/B06 的失败恢复与完整交付机制设计完整且内闭环，但多数失败路径与审查闭环子项的行为校准样本尚未入库——structure_contract 层充分，behavior_quality 层对这些子项仍为 not-verified。
