---
title: Edge 深审台账（七问裁决、subtraction test 与 finding 合同）
doc_role: audit-evidence
review_date: 2026-07-26
status: review-evidence-current-source
origin_plan: docs/plans/2026-07-17-002-docs-system-project-audit-validation-approach-plan.md
baseline_audit: docs/项目审查/2026-07-18-skill-flow-system-audit-refresh/README.md
previous_calibration_head: 27baf79f7d3bb0873deb591218c76b9c11a91bbf
current_head_at_calibration: d939ee3c20317ef7d3068a2ef84fda7b62a6a8fb
working_tree_calibrated_at: 2026-07-26
working_tree_overlay: docs-only-6-paths-no-skill-source-overlap
---

# Edge 深审台账

深审对象按 §2.5 高风险规则从 delta 中选出：全部 authority-changing 与 exit-gate 关系均在深审集内（风险地板优先于 20% 成本预算）。Edge ID 只用于本轮引用，不构成 durable contract。

## E-1：`spec-lfg ↔ spec-work` working-tree fingerprint gate（step 6.5）

**七问裁决：**

1. **必要吗** — 是。该 gate 关闭的是「caller-owned Simplify/review-fix 之后、shipping 之前无最终树新鲜验证」的真实 P1（af53aacb 整改来源）；删除它会让 stale evidence 重新可以进入 commit/push/PR。
2. **选对了吗** — 是。final verification 归 spec-work（幂等重入），freshness 比对归 LFG（pipeline owner），分工正确。
3. **唯一吗** — 是。fingerprint schema 单一 producer（`working-tree-fingerprint.cjs`），run summary 与 fingerprint 各司其职，无重复状态。
4. **够用吗** — 基本是。handoff 携带完整 fingerprint 对象 + run summary ref，最小充分。非 behavior-bearing 返回的字段可选性存在 producer/consumer 不对称（SF-29）。
5. **守权吗** — 是。gate 只阻断，不授予任何 mutation/commit/landing。
6. **可恢复吗** — **部分否。** helper failure 一律 `final-verification-stale` 硬停，而 LFG 引用的 helper 路径在五宿主投射下不可解析（SF-28）；诊断也不区分「树真的变了」与「gitignore 管理块缺失导致 summary 文件破坏相等比较」（SF-31）。
7. **会收敛吗** — 是。gate 有明确停止条件（相等或停），不产生无界循环。

**Subtraction test**：删除 6.5 会失去 post-fix 树新鲜性证据（真实用户结果受损），不可 Thin/Retire；修复引用路径即可恢复可用性。

**产出 finding：SF-28（P1）、SF-29（P3）、SF-30（P3）、SF-31（P3）。**

## E-2：`spec-plan / spec-brainstorm → spec-doc-review` mutation 权威模型（token 驱动）

**七问裁决：**

1. **必要吗** — 是。旧模型（reviewer 按文件格式自决 markdown-write）与关系不变量 7「Review 默认 report-only」存在张力；token 驱动把写权移回 producer，是授权模型修复。
2. **选对了吗** — 是。producer（plan/brainstorm）拥有 artifact，因此由 producer 显式供给 `mutation:apply-fixes` 正确。
3. **唯一吗** — 是。mutation authority 单一来源（run-local `requested_mutation` ← 显式 token）；mandatory report-only reasons（task-pack/HTML/write-unavailable/format-conflict）优先级保持且不可被 token 覆盖。
4. **够用吗** — 是。token + 路径即最小充分 handoff；envelope `mutation_reason` enum 同步更新（`caller-requested-apply-fixes` / `default-review-report-only`）。
5. **守权吗** — 是。delivery mode、output:json、可写性、宿主权限均不能供给缺失的 mutation 授权（SKILL.md 明文）；eval 负例 `default-markdown-stays-report-only` 锁定。
6. **可恢复吗** — 是。duplicate/conflict token fail closed（`flag-conflict-or-unsupported`）。
7. **会收敛吗** — 是（无回路语义变化）。

**Caller 对齐核查（全量）**：`spec-plan`（SKILL + plan-handoff 全部调用点均带显式 token，含 pipeline mode 与 free-form 路由）✅；`spec-brainstorm`（选项 3 两格式 report-only）✅；`spec-work` shipping（原本就显式 `mutation:report-only` 并期待 `caller-requested-report-only`）✅；`spec-write-tasks` high-risk handoff（固定 report-only 调用）✅；`spec-prd` / `using-spec-first` route map（仅路由，无 mutation 期待）✅；`templates/claude/commands/spec/doc-review.md` argument-hint 为既有极简形态（不含任何 mutation token，先于本 delta 存在，非回归）。**README.md:172 / README.zh-CN.md:171 仍以格式驱动措辞概述该关系（SF-34，P3 wording）。**

**Subtraction test**：删除 token 机制会回到格式驱动写权，重新违反不变量 7；保留。

**产出 finding：SF-34（P3）。**

## E-3：`spec-compound-refresh` knowledge maintenance 回路授权（headless 不再自动 commit/PR）

**七问**：必要（对齐全局 mutation/commit/landing 三分授权模型，消除 headless 在默认分支自动 branch+commit+PR 的越权路径）；选对（authority facts 在 refresh run 本地解析）；唯一（`commit_authorization` 语义与 spec-work/dogfood/polish 同型，无第二套模型）；够用（`commit_status: not-created` + `commit_reason: commit_authorization_missing` + 未提交路径 + 候选 message，下游可续接）；守权（clean tree/可写权限/headless/branch 均不构成授权，明文）；可恢复（missing 路径返回结构化事实而非失败）；收敛（SF-02 的 promotion checks → destructive delete 顺序保持，本轮复核 INTACT）。**无新 finding。**

## E-4：`spec-code-review` deployment-verification 激活边（双 gate）

**七问**：必要（safe additive migration 误派发是真实成本/噪声源）；选对（orchestrator 判定，worker 不可 self-invoke，SF-24 原句保留）；唯一（选择结果单一记录于 `selected_local_prompt_assets`，Stage 4 只消费不重判）；够用（applicability reason 必须点名 artifact path + 具体 risky operation）；守权（激活收紧方向，无越权）；可恢复（不满足即不派发，无失败悬置）；收敛（无回路）。新增 activation eval（negative-owner + positive）与契约测试对齐。**方向为 SF-24 关闭的加强，无新 finding。**

## E-5：source-command 退役与 internal delivery 单一 owner

**七问**：必要（legacy mirror 与 SF-03 修复前旧措辞漂移，删除消除过期表面）；选对（gitignore/untrack 防护归 CLI policy owner）；唯一（`DELIVERED_INTERNAL_SKILLS` 第二事实源同步删除，governance JSON 单一 owner 由测试锁定）；够用（fresh init 回归测试覆盖 legacy untrack 且不吞团队自有文件）；守权（SF-01 的 9 条 load-bearing caller edge 与 target delivery 复核 INTACT；Cursor internal 投射额外收紧 `disable-model-invocation`）；可恢复（防护性 ignore pattern 覆盖退役命名空间）；收敛（无回路）。**产出 finding：SF-32（P3，命名空间归类表述）。**

## E-6：CI enforcement 升级与测试链路完整性

三个 workflow 引用的 npm scripts 全部存在；producer 稳定性有 `ci-required-producers.test.js` 锁定；`run-test-suite.cjs` 动态发现修补 4 个静默未跑的 integration 测试。这是 readiness/verification 强制点上移（本地约定 → CI 硬 gate），不改变 skill-flow edge 语义。**产出 finding：SF-33（P3，发布包内模块加载期 IO）。反证记录：badge `branch=master` 候选被推翻**（`git ls-remote --symref` 确认远端默认分支即 `master`，badge 正确）。

## 历史 finding 回归裁决（Pass 0 增量）

07-18 批次关闭的 P0-P3 中，凡 owner 文件落在本 delta 变更面内的逐项复核；未触及者沿用 07-18 裁决不重开：

| Finding | 状态 | 本轮证据 |
| --- | --- | --- |
| SF-01 internal delivery | **INTACT（强化）** | `DELIVERED_INTERNAL_SKILLS` 硬编码删除，governance JSON 唯一派生 + 逐平台等价测试；9 条 caller edge 与 5 宿主 target delivery 复核在位；`spec-commit`/`spec-commit-push-pr` 保持 `user-invocable: false`；新增 provenance 契约测试锚定口径 |
| SF-02 promotion provenance | INTACT | `--promotion` 机械校验与 Consolidate destructive-delete 后置原样保留（delta 未触及对应段落） |
| SF-03 rendering config consumer | INTACT | delta 仅触 workspace 并发/路径 lib；`plan_output` 等三 key 的统一措辞与回退语义未动；退役 mirror 中的旧措辞副本被删除（漂移面减少） |
| SF-04 task-pack review consumer | **INTACT（强化）** | task-pack mandatory report-only 在新 token 模型中保持最高优先（`mutation:apply-fixes` 仅在无 mandatory reason 时生效） |
| SF-05 autofix_class 分类语义 | INTACT | code-review :84/:148/:789 原句未动；新 Contract Summary 复述一致 |
| SF-06/SF-21 maintainability precedence | INTACT | `references/` 零 diff；threshold 与 anchor 规则在位 |
| SF-08 brainstorm→lfg 名称 | INTACT | handoff.md 选项 2 保留精确 `spec-lfg` 名称与 artifact payload 条件 |
| SF-10 artifact map | INTACT | 用户地图未在 delta 中；producer contract 未变 |
| SF-11/M-013 requirements-only 边界 | INTACT | html-rendering references 零 diff；LFG 入场仍拒绝 requirements-only/knowledge-work |
| SF-13 ideate→brainstorm 唯一下一跳 | INTACT | ideate delta 仅新增 Contract Summary，消费者行与 SF-13 一致 |
| SF-18 tracker-defer 唯一 owner | INTACT | `cmp` 复核两份文件 byte-identical，delta 零改动 |
| SF-22 riffrec/sweep parity | INTACT | 两脚本各 +96 行同步演进后 `diff -q` 复核仍 byte-identical |
| SF-23 五宿主投射 | INTACT | cursor.js 变更仅影响 internal/workflow skill frontmatter，standalone 投射不变；五宿主 runtime 磁盘核对在位 |
| SF-24 deployment gate | **INTACT（强化）** | 见 E-4 |
| SF-25 why_it_matters 可选 | INTACT | synthesis-and-presentation.md delta 仅改 mutation_reason enum 行 |
| SF-26 LFG Simplify 描述 | INTACT | step 3 原句保留；6.5 明文「additive and never replace it」 |
| SF-27 dispatch 授权矩阵 | INTACT | doc-review dispatch gate 段仅措辞随 token 模型微调，授权语义不变 |

**REGRESSED：0。** 唯一例外性发现是 SF-28 属于 U8/U13（07-18 修复的 source-checkout 路径 bug 类）在新增代码上的**同类模式再现**，不是旧 finding 本体回归。

## Finding 合同

~~~text
finding_id: SF-28
edge_id_or_scope: E-1（spec-lfg step 6.5 → working-tree-fingerprint helper）
claim: LFG 6.5 以 source-checkout 路径 `skills/spec-work/scripts/working-tree-fingerprint.cjs` 引用跨 skill helper；五宿主投射（.claude/.agents/.cursor/.kiro/.qoder 的 spec-lfg 包）均携带该字面路径且无宿主解析规则；目标仓（init 安装、无 skills/ 源码）中该路径不存在，而 helper 实际位于各宿主 spec-work runtime root（已核实 .claude/spec-first/workflows/spec-work/scripts/ 投射在位）。helper failure 按合同 = final-verification-stale 硬停，LFG 全管道在目标仓将确定性终止于最后一道 gate，或迫使 LLM 即兴寻径（破坏 deterministic floor）。
severity: P1
evidence_level: current source + 五宿主 projection 磁盘核对（observed）
source_refs: skills/spec-lfg/SKILL.md:116,138-140；.claude/skills/spec-lfg/SKILL.md:116（及 .agents/.cursor/.kiro/.qoder 同位）；skills/spec-work/references/shipping-workflow.md:94（SKILL_DIR 解析先例，明令禁止本模式）；tests/unit/spec-lfg-contracts.test.js:116（仅子串断言）
counter_evidence: 已查证无宿主级跨 skill 路径重写（cursor rewriteSharedPaths 仅改写 SKILL.md 引用为文件读取路径，未改写本脚本引用，.cursor 投射保留原字面路径）；spec-work 自身侧不受影响（其 SKILL_DIR 相对引用可解析）。若某宿主 loader 在加载时注入等价路径变量，此条降级——当前无此证据。
user_impact: 在任何非 spec-first 源码仓使用 LFG 全管道的用户，行为改动完成后被 6.5 确定性阻断（安全方向失败，但旗舰自主管道不可用），且诊断码不指向真实根因。
root_cause: af53aacb 新增 6.5 gate 时沿用了 07-18 已修复 bug 类（U8/U13：五宿主投射后错误依赖 project cwd 的 skills/ source checkout）的引用形态；SF-18 已确立的 LFG package-local byte-parity 投射先例未被复用。
recommended_posture: 修复（extend existing owner）：按 SF-18 先例把 helper 以 byte-parity 投射进 spec-lfg package 并改引用为 package-local，或按 shipping-workflow.md:94 先例改为「当前宿主 spec-work Skill root」解析规则；契约测试从子串断言升级为引用形态断言。
closure_condition: LFG 六处 fingerprint 引用在五宿主投射下均可解析（source parity/projection contract 测试通过），并有一次 sandbox init 后的路径存在性验证。
invalidation_condition: 证明所有受支持宿主在加载时对跨 skill `skills/*` 路径做等价重写，或 LFG 被限定仅在源码仓运行。
status: open
origin_plan: docs/plans/2026-07-17-002-docs-system-project-audit-validation-approach-plan.md
~~~

~~~text
finding_id: SF-29
edge_id_or_scope: E-1（producer/consumer 非 behavior-bearing 不对称）
claim: spec-work 仅对 behavior-bearing complete 硬性要求 verified_worktree_fingerprint（允许 deliberate non-behavior exception），而 spec-lfg step 2 无条件 require complete object、6.5 无 non-behavior 跳过条款；code plan 以合法 non-behavior 结果返回时可能被 consumer 侧 missing-field 误停。
severity: P3（LFG 只接纳 execution: code 计划，non-behavior 完成路径低频；字段清单本身无条件列出，producer 大概率总是产出）
evidence_level: current source（declared）
source_refs: skills/spec-work/SKILL.md:258,270；skills/spec-lfg/SKILL.md:43,112
counter_evidence: S4/S6 场景显示模型倾向按字段清单无条件产出 fingerprint，实际冲突频率可能为零。
user_impact: 罕见路径上的非预期阻断或 producer 合同被事实收紧而未写明。
recommended_posture: 修补 wording：producer 侧明确 non-behavior 返回也建议产出 fingerprint，或 consumer 侧为 non-behavior 返回定义等价豁免。
closure_condition: 两侧合同对 non-behavior 返回的 fingerprint 期待一致。
invalidation_condition: 证明 LFG 管道不可能出现合法 non-behavior complete 返回。
status: open
~~~

~~~text
finding_id: SF-30
edge_id_or_scope: E-1（producer 降级语义缺失）
claim: verification_run_summary_ref 定义了「null + explicit limitation」失败出口，而 verified_worktree_fingerprint 无 script-unavailable/degraded 表达（只能整体 blocked）；shipping-workflow.md Step 5.1 closeout 序列未提及 fingerprint 捕获位置。
severity: P3（硬阻断本身是 verification gate 的既定失败语义，缺的是 reason_code 粒度与文档位置）
evidence_level: current source（declared）
source_refs: skills/spec-work/SKILL.md:257-258；skills/spec-work/references/shipping-workflow.md:128
recommended_posture: wording 补充：blockers 中命名 helper failure 的结构化 reason，Step 5.1 补捕获时点。
closure_condition: producer 侧有显式 helper-failure 表达路径。
invalidation_condition: 裁决确认 deterministic evidence 不设降级出口为有意设计并成文。
status: open
~~~

~~~text
finding_id: SF-31
edge_id_or_scope: E-1（指纹相等 gate 的环境依赖未声明）
claim: 6.5 相等比较隐式依赖 target repo 已安装 spec-first managed .gitignore 块（`.spec-first/workflows/` 被 ignore 后 summary 写入不进指纹）；块缺失时 fresh summary 成为 untracked 非 ignore 文件，相等比较确定性失败，`final-verification-stale` 诊断不指向 gitignore 根因。
severity: P3（LFG 可运行前提本就包含 init 安装 runtime，块通常在位；失败方向安全）
evidence_level: current source + gitignore policy 派生逻辑（declared）
source_refs: skills/spec-lfg/SKILL.md:135；skills/spec-work/references/shipping-workflow.md:168；src/cli/gitignore-policy.js:75；skills/spec-work/scripts/working-tree-fingerprint.cjs:78
recommended_posture: wording：6.5 失败分支提示检查 managed gitignore 块，或 helper 输出 dirty 明细辅助定位。
closure_condition: 失败诊断可区分「树真变了」与「summary 未被 ignore」。
invalidation_condition: 证明所有受支持安装路径必然带 managed 块且不可移除。
status: open
~~~

~~~text
finding_id: SF-32
edge_id_or_scope: E-5（退役命名空间归类表述）
claim: boundary doc 与 gitignore section 把 `.agents/skills/source-command-spec-*/` 归入「spec-first generated runtime assets」，但仓库内无 generator 产出该路径（宿主侧迁移产物）；读者可能误期待 init/clean 管理它。
severity: P3
evidence_level: current source + git log -S（observed：全历史仅命中 pattern 添加本身）
source_refs: docs/contracts/source-runtime-customization-boundary.md:31；src/cli/gitignore-policy.js:8-34
counter_evidence: 该清单操作语义是「不得手改/不得当 source」，把宿主产物纳入防护清单与文档目的一致；同 section 本就收录非严格生成路径。
recommended_posture: wording：为该行加「host-generated legacy，仅防护性覆盖」注记，或裁决该清单口径为 managed-ignore namespace 并成文。
closure_condition: 归属口径二选一成文。
invalidation_condition: 上轮审查已有清单口径裁决且为「保护范围」。
status: open
~~~

~~~text
finding_id: SF-33
edge_id_or_scope: E-6（发布包内孤儿失败路径）
claim: run-test-suite.cjs 在模块加载期执行 fs.readdirSync(tests/integration)，该文件入 npm 包但 tests/ 不入包；安装态 require/执行将加载期 ENOENT。
severity: P3（正常 CLI 路径不触达；无 runtime 代码 require 它）
evidence_level: current source（declared）
source_refs: scripts/run-test-suite.cjs:42-47；package.json files 字段
recommended_posture: 最小修补：目录缺失时返回空列表或延迟到 runIntegration 调用时读取。
closure_condition: 安装态加载不抛错或该文件退出发布包。
invalidation_condition: 裁决发布包内脚本按源码可追溯性保留且明文不支持安装态执行。
status: open
~~~

~~~text
finding_id: SF-34
edge_id_or_scope: E-2（README 与 token 驱动 mutation 模型的措辞漂移）
claim: README.md:172 / README.zh-CN.md:171 以格式驱动措辞（「Markdown review may apply safe writes, while HTML report-only」）概述 review mutation；delta 后写权由 producer token 驱动，普通 Markdown review 默认 report-only。语句在 spec-plan producer 语境（显式传 apply-fixes）下仍为真，但把差异归因于格式而非 token。
severity: P3（wording；实际行为比文档描述更安全）
evidence_level: current source（declared）
source_refs: README.md:172；README.zh-CN.md:171；skills/spec-doc-review/SKILL.md:36-42
recommended_posture: 并入既定的 README 首屏叙事重写工作（2026-07-26 战略报告 P0-3），不单独开工作流。
closure_condition: README 双语措辞与 token 驱动模型一致。
invalidation_condition: 无。
status: open
~~~

## 被推翻的候选（不进入 finding）

- **badge branch=master**：`git ls-remote --symref github HEAD` 返回 `refs/heads/master`，远端默认分支即 master，badge 与查询串正确。本地「main 为主分支」是会话快照的误导。
- **dual-host governance README 第二事实源**：README 变更为 4→5 宿主口径补齐，未枚举 per-skill 名单，维护规则仍指向 governance JSON 为唯一 machine-readable 落位；与 27baf79f 时 JSON 已含 35 处 cursor 键一致，方向是文档追平既有事实。
- **spec-plan「safe, mechanical fixes were already applied」菜单措辞疑似漂移**：spec-plan producer 流始终显式传 `mutation:apply-fixes`，headless 先行 pass 确实已应用 safe fixes，措辞在其唯一出现语境内为真。
