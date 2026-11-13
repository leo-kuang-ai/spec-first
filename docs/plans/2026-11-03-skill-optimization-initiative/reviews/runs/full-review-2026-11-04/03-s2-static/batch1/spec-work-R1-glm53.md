证据收集完毕。以下为评审报告。

---

# spec-work 评审（R1）

**评审对象**：`skills/spec-work/`（worktree 5b59293b，fresh-source 只读盲评）
**读取范围**：SKILL.md 全文（126 行）、14 个 references 全文（1876 行）、2 个 scripts 全文、evals（eval.yaml + examples.json 前 2KB + 3 个 case 抽样）、消费者测试抽读 3 份、CLI 接线与跨 skill 衔接点验证（spec-code-review / spec-lfg / spec-write-tasks）。

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | SKILL.md:82-91; input-triage.md:36; implementation-loop.md:28; execution-strategy.md:155-157; docs/plans/2026-08-19-003…md:927 | 反合理化条款均对应有记录的真实失败（CHANGELOG.md:982 completed-plan 合理化、:804 机械修改跳过收尾），重防护规则有 plan 依据且配降级路径；残留 1 条 P3 观察见 findings |
| D02 | pass | feedback-and-tests.md:102,54; shipping-workflow.md:54; implementation-quality.md:41-72; execution-strategy.md:125 | 治理合同套件反查、release 治理候选、thin-glue 拥有/不拥有清单、争用面清单是可操作领域知识而非流程口号；脚本/LLM 分工在每个 owner 显式声明（feedback-and-tests.md:154） |
| D03 | pass | SKILL.md:24; shipping-workflow.md:146-187,38; src/cli/commands/internal.js:31-59; tests/unit/spec-work-shipping-contracts.test.js:33-59 | 唯一脚本强制的 hard exit 被诚实点名，closeout 链 CLI 命令在 src/cli 全部接线且 helper 存在；LLM-owned gate 明确声明非 runtime 强制，语义判断未冒充机械判定 |
| D04 | pass | work-intake.md:40,42; work-intake-and-task-pack.md:79-87; return-to-caller.md:29-52; skills/spec-lfg/references/work-return.md:17-30; skills/spec-write-tasks/references/task-pack-schema.md:56-58 | 上游（Goal Capsule/DoD/KTD/hash 语义）消费、下游 envelope 字段与 LFG 消费侧、task-pack 身份语义与 write-tasks 生产侧逐项对齐，无字段级断缝 |
| D05 | pass | SKILL.md:34-51,32; workspace-setup.md:34,44; implementation-loop.md:58; shipping-workflow.md:62 | Trigger Map 使关键规则可定位、Phase Reads 有复用规则；存在 3 处局部重复/口径分裂（见 findings F1/F3/F4），均为 P3 不构成 fail |
| D06 | pass | execution-strategy.md:99-106,104,159,157; execution-engines.md:39 | authorization/capability/isolation 三分离，supportsAgents/EPERM/宿主名均被限定为非能力证据，enforcement 缺失时诚实降级 inline 且不阻塞普通工作 |
| D07 | pass | evals/evals.yaml:14-24; CHANGELOG.md:982,804,204,15 | 已提交 eval cases（含 R2 对抗 case）+ CHANGELOG 可追溯的问题→修订→复验链（2026-09-01 合理化缺陷修复 paired ×3、09-08 旅程发现补收尾顺序、11-04 isolation advisory） |
| D08 | pass | SKILL.md:32; work-intake.md:40; workspace-setup.md:38; feedback-and-tests.md:27; execution-strategy.md:131,141 | section-map 有界读计划（含 rg 命令）、阶段复用规则、trivial 不加载完整 reference、cold-start tax 定价与独立调用批量派发，按需加载纪律完整 |
| B01 | pass | SKILL.md:3; work-intake.md:21,35; non-code-execution.md:3 | description 覆盖正触发与 spec-debug/spec-lfg/spec-resolve-pr-feedback 负例；开放式症状让渡 spec-debug；knowledge-work 独立 carve-out，不强迫串行全链 |
| B02 | pass | shipping-workflow.md:112; return-to-caller.md:42; templates/claude/commands/spec/work.md:9; skills/spec-code-review/references/modes-and-output.md:19 | 入口/reference/script/template/consumer 四向一致：SKILL_DIR 解析规则两处同款、mode:agent 全参数在 spec-code-review 侧有定义、Claude 投射声明 body 源自 SKILL.md |
| B03 | pass | execution-strategy.md:194-211; shipping-workflow.md:222-238; tracker-defer.md:43; agents/figma-design-sync.md:7 | mutation/commit/landing 三重分离贯穿全部出口；dispatch/tracker 授权语义明确；"a plan or design reference is context, not additional edit authority" 封死材料内嵌指令扩权 |
| B04 | pass | execution-strategy.md:48; tracker-defer.md:3; working-tree-fingerprint.cjs:4-6; diff 验证（本 worktree） | source/runtime 边界与投射 canonical owner 声明完整；spec-lfg 双投影（tracker-defer、fingerprint 脚本）实测 byte-identical；本 worktree 无 `.agents/skills/spec-work` 镜像，无 drift 可比（如实记录） |
| B05 | pass | execution-strategy.md:121,171-182; work-intake-and-task-pack.md:172; shipping-workflow.md:157; 每 reference 的 Fallback 节 | 中断恢复（started=unknown）、CAS 冲突、两轮审查上限、launch 失败先确认无 worker 再 inline、run summary 不可变、dirty overlap 保护均有明确处理 |
| B06 | pass | shipping-workflow.md:30-40,88-106,168; return-to-caller.md:54 | Required-Proof Reconciliation 逐 intent 对账、headless 不自动接受风险、closeout 禁止 cherry-pick、residual 永不静默丢弃，审查视角按变更分级选取 |
| X01 | pass | work-intake-and-task-pack.md:153-157; execution-strategy.md:123-143,171 | 波次依赖顺序、争用映射、shared-workspace wave contract（committed baseline/独占写面/无 worker Git 操作/abort 规则）、append-only 恢复态完整覆盖长任务分解 |
| X02 | pass | execution-strategy.md:63; implementation-quality.md:83-86,51 | 合同/schema/provider/source-of-truth 变化一律 stop-back 回 plan owner，owner 漂移记 material deviation——职责是正确拒绝而非自行设计，符合实现阶段定位 |
| X03 | pass | SKILL.md:56-60; docs/contracts/workflows/scenario-capability-matrix.md:56-70; shipping-workflow.md:204-212 | high-risk overrides 三条与 matrix 的 Overrides 表逐条一致；Post-Deploy Monitoring 为 REQUIRED 且含无影响显式理由（no-PR 路径承载位缺失记 findings F2） |
| X04 | pass | return-to-caller.md:29-58; shipping-workflow.md:170-187; non-code-execution.md:32-41 | 跨会话 envelope 带 source refs/fingerprint/freshness/limitations，durable run artifact 有明确触发条件与不可覆盖语义；knowledge-work 决策保留与回路由规则齐备 |

## Findings

**F1（P3，内部不一致，建议修复）** — `references/work-intake.md:33`
Trivial 路由写「implement directly — no task list, **no execution loop**」，与 SKILL.md:95「Before the first implementation write, **including a trivial route without tasks**, read `references/implementation-loop.md`」及 implementation-loop.md:13 Trigger「including trivial work」直接矛盾。后果：trivial 变更路径上执行者可能据 work-intake 跳过 implementation-loop owner，连带跳过其中 orphan 清理与 rerun、evidence 记录、commit checkpoint 约束（恰是 Anti-Rationalization 第 4 行防的失败）。该措辞无测试锁定（已 grep 验证）。最小修复：改为「no task list; the implementation-loop trivial-read rule still applies」一类表述。

**F2（P3，文档缝）** — `references/shipping-workflow.md:205`
Phase 3 Step 6 要求 Post-Deploy Monitoring & Validation「for **every change**」且标 REQUIRED，但该段唯一落地位置是 PR description（:236、:262 均限定 when a PR was authorized）；无 landing 授权的 uncommitted/commit-only 出口上该段的承载位置未定义。后果：大多数 standalone run（无 PR）要么空转该步骤要么静默丢失。最小修复：在 Step 6 补一句 no-PR 出口将其并入 verified handoff summary。

**F3（P3，口径分裂）** — `references/implementation-loop.md:58` vs `references/shipping-workflow.md:62,263`
两处 simplify 阈值：phase boundary 用「>=30 **substantive human-authored** code lines」，final simplify 用「>=30 **changed** lines」。两个时点语义本可不同，但同数字双口径在边界情形（如大体积 generated diff + 少量手写行）会产生相反判定且无消解句。最小修复：在 shipping Step 2 显式引用/区分两口径关系，或统一为同一口径。

**F4（P3，重复）** — `references/workspace-setup.md:44-45` vs `:34-36`
「necessary discovered file 仅凭 direct evidence 入 changed set」「缺 dispatch 授权走 inline」两条 hard anchor 在同文件 §2 内整段重复，构成双写漂移面。最小修复：44-45 段收缩为引用 §2 anchors。

**F5（P3，观察，保持现状成立但建议登记重估条件）** — `references/execution-strategy.md:155-157`
mutation-capable worker 要求宿主提供「write-deny + credential-isolation receipt」，已知宿主基本无法出具，实际效果是 mutation worker dispatch 恒 `inline-fallback`。该规则有明确 plan 依据（docs/plans/2026-08-19-003…md:68 R9/AE5）、reason code 响亮、降级不阻塞普通工作，故非过度补丁；但按项目「机制就位负有向兑现推进的义务」原则，建议在合同或 docs 登记「何条件下重估该 receipt 门槛」，避免其成为永久死路而不被审视。

**F6（P3，观察，保持现状成立）** — `references/execution-engines.md:88`
verbatim dynamic-workflow prompt 硬编码 `ultracode:` 宿主触发词。Step 1 的 callable-primitive gate 与 :66 的不调用 fallback 已覆盖无该约定宿主，不构成宿主泄漏为 selection rule；仅为可移植性观察。

## 主责深挖面发现

- **D01（去补丁化）**：逐条反合理化条款均可回溯到有记录的真实失败（CHANGELOG.md:982 的 completed-plan 合理化→input-triage.md:36 逐字封死；:804 机械修改跳过收尾→SKILL.md:28 closeout 边界；:204 headless 判定保守化）。唯一重防护区（execution-strategy.md:153-159 worker Git index/凭据/清理 receipt 连续五段）经查有 plan 来源与完整降级链，判保持现状 + F5 重估登记。
- **D02（领域知识）**：最强证据是 feedback-and-tests.md:102 的按断言目标反查治理合同套件（「governance、byte-budget、ordering、projection 类合同常不 import 目标文件」——这是本仓真实测试结构的编码经验，非通用最佳实践）与 shipping-workflow.md:54 的 release 治理触发。流程控制之外的知识密度达标。
- **D03（验证门）**：Enforcement provenance 声明（SKILL.md:24）把「哪一个是脚本强制、哪些是 prose 约定」写进合同摘要本身，这是 D03 必查问题（语义判断冒充机械判定）的最直接反证；closeout 链四个 CLI 已在 `src/cli/commands/internal.js:31-59` 逐一确认接线。
- **D04（衔接）**：双向核验通过——消费侧（plan 的 KTD/U-ID/hash 语义、spec-write-tasks 的 body-hash 与 spec_id 兼容 trace 语义两侧逐句一致）、产出侧（return-to-caller envelope 22 字段与 spec-lfg `work-return.md:17-30` 的必填校验及四种 lifecycle degraded 枚举完全对齐）。未发现字段级断缝。
- **D05（紧凑性）**：主问题是 4 处局部重复/口径分裂（F1/F3/F4），无矛盾级缺陷；1876 行 references 的体量由 Trigger Map + 单 owner 职责声明支撑，可审计性良好。
- **D08（上下文效率）**：有界读计划的具体命令（`rg -n '^#{1,3} '`）、bounded reading 不得丢弃 governing decision 的补偿规则（work-intake.md:42）、cold-start tax 定价（execution-strategy.md:131）表明上下文成本被显式建模而非仅口号。

## 未读文件

- `evals/fixtures/scripts/*.sh`（6 个 judge 脚本）及 `evals/fixtures/repos/*/` 内部文件（README/src/server.js/prepare-eval.cjs）——理由：属行为评测层判据细节，本轮静态盲评聚焦 owner 源码与合同锚点；后果：judge 断言与 SKILL.md 合同的逐项对齐未核验（case YAML 的 fixture/judge 引用路径已确认存在）。
- `evals/examples.json` 仅前 2KB——后果：后段 example 与 cases/ 的覆盖对应关系未全核验。
- 消费者清单 30 项中 27 项未逐行读（全文读了 spec-work-contracts、spec-work-consumer-chain，读了 shipping-contracts 前 80 行）——理由：抽读代表性行为合同 + CLI 接线直接验证已覆盖主链断言；后果：其余测试与 source 的锚点漂移未全量核验。
- `skills/spec-lfg/references/work-return.md` 仅 grep 抽验 envelope 字段与 lifecycle 枚举——后果：LFG 侧消费逻辑全文未审。
- `src/cli/helpers/{honest-closeout,verification-run-summary,spec-work-run-artifact,plan-status,verification-profile}.js` 仅确认存在与接线——后果：helper 确定性行为细节（如 redaction 实际范围）未核验。

## 结论一句话

spec-work 在静态层是一个承诺存在、内部高度一致、验证门与授权边界诚实分层、演化有据的主链路实现 skill：18 项检查全部 pass、无 fail 级缺陷，6 条 P3 findings（F1 为应修的真实内部不一致，F2-F4 为口径/重复收敛，F5-F6 为带重估建议的保持现状项）。
