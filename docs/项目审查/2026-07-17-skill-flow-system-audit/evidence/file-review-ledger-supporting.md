# Skill 关系审查：直接支撑面逐文件台账

## 审查边界

- 审查日期：2026-07-17
- 源码快照：`7cb9721f0a9e4f0e0dc265c7194ab80e678b3c64`
- 审查方式：按冻结清单逐文件完整读取，不使用抽样、摘要或仅关键词命中代替源文理解。
- 审查维度：仅登记 Skill 之间的 route、handoff、consumer、caller、authority、failure/return、stop condition、internal-helper delivery 与相关 focused test coverage。
- 不在范围：普通代码质量、性能、命名、风格、非 Skill 流程缺陷；本台账不修复任何 Skill、CLI、contract、test 或 runtime mirror。
- 工作树复核：首轮完整读取后，`docs/项目审查/README.md` 被并行收口线程更新；已对该文件完整重读并以 54 行当前版登记。其余冻结文件无并行变化。

## 完整性核算

| 分区 | Expected | Actual | Missing | Extra | Duplicate |
| --- | ---: | ---: | ---: | ---: | ---: |
| A. `docs/contracts/workflows/**` | 14 | 14 | 0 | 0 | 0 |
| B. knowledge / graph / provider / source-runtime / verification contracts | 9 | 9 | 0 | 0 | 0 |
| C. governance / projection / handoff implementation | 11 | 11 | 0 | 0 | 0 |
| D. Runtime Setup 直接实现 | 2 | 2 | 0 | 0 | 0 |
| E. README / catalog / 用户手册 / 审查索引 | 7 | 7 | 0 | 0 | 0 |
| F. 关系 finding 直接相关 focused tests | 33 | 33 | 0 | 0 | 0 |
| **总计** | **76** | **76** | **0** | **0** | **0** |

`spec-work*` 测试已展开为精确文件清单，并纳入了单数命名的 `spec-work-run-artifact-contract.test.js`，避免只按 `contracts` 复数字面匹配而漏读。

## 支撑面候选 Findings

以下是供主报告与 Skill 源码台账交叉裁决的候选，不单独作为最终 finding。

### SF-01（候选 P1）Internal helper caller 与五宿主 runtime delivery 缺少可达性合同

- Governance 将 7 个 helper 全部标记为 `internal_only` / `host_delivery.*=internal`，但 filtered asset set 只把 `spec-worktree` 放入 `DELIVERED_INTERNAL_SKILLS`。
- Runtime catalog 如实投影为“1 个 delivered agent-facing internal skill + 6 个 governance-only internal records”；用户手册却将 7 个 helper 统一描述为“由公开 workflow 委托”。
- Focused tests 证明 `spec-lfg` 依赖 `spec-commit-push-pr` / `spec-test-browser` 的 pipeline contract，且证明 `spec-test-browser` 是 internal-only；但 projection tests 只正向断言 `spec-worktree` 存在，没有 caller → target → projected/reachable → fallback 可达性测试。
- 需要主 Skill 台账进一步区分：哪些调用有可执行的内联/API fallback，哪些会在目标仓库的 generated runtime 中真正断链，哪些 helper 根本无 caller。

### SF-02（候选 P1）Runtime Setup 对 `plan_output` / `brainstorm_output` 的 consumer 分类被测试固定在旧状态

- `mcp-setup-config-consumers.test.js` 明确要求 Runtime Setup 把 `plan_output` 与 `brainstorm_output` 说成 reserved future hints。
- 这不是“缺少测试”，而是现有 focused test 锁定了错误 consumer 关系。主 Skill 台账需与 `spec-plan` / `spec-brainstorm` 当前源码交叉确认 active consumption。

### SF-03（候选 P1）`spec-brainstorm` durable artifact topology 在 canonical contract 与用户文档层双重漂移

- `spec-id-traceability.md` 仍规定新 requirements 写入 `docs/brainstorms/` 并从该目录扫描 identity。
- 中英文 README 与 `spec-brainstorm` focused test 已明确当前产物是 `docs/plans/` 下的 requirements-only unified plan。
- 用户手册 04、10、24 三处仍把 `spec-brainstorm` producer path 写为 `docs/brainstorms/*-requirements.md`。这会同时误导 producer、plan consumer、identity scan 与用户寻址。

### SF-04（候选 P1）Work run artifact 的用户文档 consumer contract 落后于 v2 schema 和活跃实现

- 用户手册 04 仍声称 `workflow_integrated=false`，而 schema metadata、runtime catalog、producer integration test 和 shipping contract 都确认当前为 conditional `workflow_integrated=true`。
- 同一文档对 `direct_evidence_used` 的字段解释仍是旧 `graph_evidence_used` 形状；当前 v2 字段是 `source_refs` / `checks_or_logs` / `repo_scope` / `limitations` / `redaction_status`。
- 这会直接误导 `spec-code-review` 对上游 work evidence 的消费和降级判断。

### SF-05（候选 P1）Knowledge promotion 只验证“文件存在”，没有验证“可回源、可失效”

- Knowledge Harness 要求新 promote 带 `invalidation_condition` 与 `source_refs`，并把 candidate → review → promote 定义为 L6 出口边界。
- `honest-closeout` 实现与 focused test 对 `knowledge_promotion` 只校验 ref 位于 `docs/solutions/**`、文件存在且是仓库内普通文件，不校验前述 promotion 资格。
- 支撑面内没有 promotion contract test 能拒绝缺失这两个字段的新 learning；需与 `spec-compound` 当前 schema/模板交叉裁决是否已回归。

## 已确认的反证（不应误报为关系缺陷）

- Shared verification chain 一致：`spec-work` / `spec-debug` / `spec-code-review` 共享 `verification-run-summary.v1` 和 `honest-closeout.v1`；只有 `spec-work` 拥有 `spec-work-run-artifact/v2`。文档、schema、helper 和 focused tests 相互一致。
- Plan → optional task pack → work 主链一致：task pack 以 source-plan path + body hash 作确定性 identity，plan 仍是 authority，pack 仍是 `derived`，且 `spec-work` 必须在每个 task/review 前重放 drift/stop condition。
- Plan lifecycle 关系一致：新 Markdown software plan 以 `active` 开始，只由拥有 shipping tail 的 caller 在 verification/review/residual/return-to-caller 收口后更新为 `completed`；task pack 不被改写。
- Source/runtime 边界一致：governance → filtered asset set → plugin sync → five-host projection 的生成链路是 source-first 且可复建；问题在于 internal caller 的可达性未入模，不是已投递 asset 的复制机制失效。
- Provider readiness / project-graph 边界一致：setup 只产生 advisory mechanical facts，普通 workflow 可始终回退 direct source/test/log reads，graph candidate 不能越级成为 finding、root cause 或 shipping proof。
- `using-spec-first` 的公开路由不暴露 internal-only 名称，且 active workflow / bounded worker 不重启路由；这一入口边界有 focused test 覆盖。

## A. Workflow contracts（14/14）

| ID | 完整读取文件 | 行数 | 关系职责 | 权威、失败/停止、投射/测试结论 |
| --- | --- | ---: | --- | --- |
| S-A01 | `docs/contracts/workflows/anti-rationalization-pattern.md` | 44 | 为 `spec-work` / `spec-debug` / `spec-code-review` 提供共享的反合理化注意力提醒形状。 | 明确不是 gate/状态机；确定性测试只可锁 heading、行数和 canonical disclaimer，语义是否适用归 LLM。本 focused 测试冻结集未包含其专项测试，但不影响 Skill edge 判定。 |
| S-A02 | `docs/contracts/workflows/eval-fixture-contract.md` | 65 | 定义 workflow eval fixture 的 source-only 结构与 source ref authority。 | 旧共享 normalizer 已退役，当前 consumer 是各 workflow 的本地 contract tests；fixture 不投射 runtime，coverage tag 不能证明语义质量。 |
| S-A03 | `docs/contracts/workflows/fresh-source-eval-checklist.md` | 97 | 为 Skill/agent prose 变更提供 source → fresh reviewer 的语义验证 handoff。 | 必须读 source，不得把当前会话缓存 typed skill 当 fresh evidence；dispatch 不可用时返回 `not_run` 和原因，不可伪造 passed。 |
| S-A04 | `docs/contracts/workflows/honest-closeout.md` | 22 | 共享 closeout consumer 是 `spec-work` / `spec-debug` / `spec-code-review`。 | 只验证 structured claim → evidence ref 关系；`spec-work` 单独拥有 durable run artifact，debug/review 只返回 summary ref、verdict、limitations。缺 evidence 或 not-run/failed 不得 verified。 |
| S-A05 | `docs/contracts/workflows/honest-closeout.schema.json` | 47 | 机读 `honest-closeout.v1` envelope，将上述三个 workflow 标为 active consumers。 | `x-spec-first-workflow-integrated=true`；它是 non-durable validator output，不是第二个 closeout artifact。`knowledge_promotion` 只是 claim type，schema 本身不验证 solution frontmatter。 |
| S-A06 | `docs/contracts/workflows/requirements-clarification.md` | 99 | `spec-ideate` / `spec-brainstorm` / `spec-prd` / `spec-plan` 共享的 requirements clarification 边界。 | 不新建 workflow/执行器；producer 持有 WHAT，当前用户是唯一人类确认人。Blocker 未解决时必须持久化 checkpoint 并停在 non-ready；cross-release knowledge 只输出 promotion candidate，本 workflow 不写 durable knowledge。 |
| S-A07 | `docs/contracts/workflows/review-closure-traceability.md` | 65 | 以 `referenced_reviews` 建立 review finding → plan 的轻量反向 handoff。 | 当前确定性 consumer 是 `plan-status-taxonomy` 测试；finding 是否真实/覆盖充分归 LLM。文档显式标注 `spec-plan` prose 接入仍 deferred，不应误报成当前 producer 已硬强制。 |
| S-A08 | `docs/contracts/workflows/review-finding.md` | 55 | 为 code/doc/app reviews 的 downstream handoff 提供 compact mapped finding envelope。 | 不替代 `spec-code-review` reviewer JSON schema；高置信 finding 不能只依赖 external-tool evidence，必须配 source/diff/test/contract/log 回源。 |
| S-A09 | `docs/contracts/workflows/scenario-capability-matrix.md` | 86 | 把 setup 的 scenario fingerprint 转成 workflow 的 advisory posture，`spec-work` / `spec-code-review` / `spec-debug` 有 high-risk overrides。 | 不是硬 gate 或全局 risk score；provider/fingerprint 不可用时回退 direct evidence。`foreign-residual-workspace` 才在 mutation/root-cause/review claim 前返回 action-required。 |
| S-A10 | `docs/contracts/workflows/self-reflection-capability-upgrade.md` | 318 | 定义 self-reflection → plan → review → compound → next-cycle 的报告型 handoff。 | 明确不新建 `spec-evolve`、agent 或 auto-rewrite runtime；Accepted CUD 只是 plan input，review 后有可复用 evidence 才允许 compound。 |
| S-A11 | `docs/contracts/workflows/skill-agent-quality-governance.md` | 87 | 定义 public workflow 的 trigger/input/output/failure/done 最小合同与 internal skill 例外。 | 中央 governance 只表达 delivery topology，故意不表达 lifecycle metadata；这一适度边界不能为 caller 可达性缺失开脱。 |
| S-A12 | `docs/contracts/workflows/spec-debug-input-output.md` | 163 | 说明 `spec-debug` 的 bug input → diagnosis/fix → review/shipping/learning handoff，并显式引用 commit helpers 和 `spec-compound`。 | Diagnosis-only 在 summary 后停止；fix 需用户选择且 root-cause chain 成立。Shipping helper 调用对 SF-01 提供 caller 证据，但这份说明文档不能自证 runtime target 可达。 |
| S-A13 | `docs/contracts/workflows/spec-id-traceability.md` | 66 | 串联 requirements → plan → task pack → work 的 `spec_id` identity，plan/task 仍各自持有 `origin` / `source_plan` / hash。 | Identity 不是进度或审批状态。当前对 brainstorm 产物路径的规定与 README / focused test 冲突，构成 SF-03。 |
| S-A14 | `docs/contracts/workflows/spec-work-run-artifact.schema.json` | 456 | 定义 `spec-work` 独有的 v2 closeout artifact，并保留 v1 读/剪兼容。 | 当前 producer available 且 conditional workflow integrated；同 run-id immutable。`direct_evidence_used` 是当前 compact direct evidence 形状，`graph_evidence_used` 仅为 legacy compatibility；为 SF-04 提供 canonical 反证。 |

## B. Knowledge / graph / provider / verification contracts（9/9）

| ID | 完整读取文件 | 行数 | 关系职责 | 权威、失败/停止、投射/测试结论 |
| --- | --- | ---: | --- | --- |
| S-B01 | `docs/contracts/knowledge/knowledge-harness.md` | 73 | 定义 summary-first handoff、solution recall 与 verified promotion 的 Knowledge Harness map。 | Recall 永远是 advisory candidate；新 promote 要求 `invalidation_condition` + `source_refs`。文档自述 gate 是 prose/LLM-enforced 而非 machine validated，因此必须由 Skill/schema/test 保持，不能仅依赖文档。 |
| S-B02 | `docs/contracts/project-graph-consumption.md` | 115 | 规定 project-graph / code-graph 在 plan/work/review/debug 中的 candidate-only 消费梯度。 | Readiness 不可从 artifact existence 推导；provider 失败时 direct reads 永远可用。图候选进入结论前必须经 source/test/log/doc 确认。 |
| S-B03 | `docs/contracts/provider-readiness.md` | 30 | Runtime Setup 向 downstream 提供 provider mechanical readiness，不提供 workflow truth。 | `readiness_status` 是 setup health 主字段；lifecycle/steady-state 是解释信息。Graphify hook 失效不应覆盖 core readiness，普通 consumer 仍需 direct evidence。 |
| S-B04 | `docs/contracts/provider-readiness.schema.json` | 128 | 机读 provider readiness v2 shape，定义 lifecycle/fallback/first-generation/steady-state。 | Schema 不包含语义 trust 提升字段，也不授权 workflow 运行 provider mutation。 |
| S-B05 | `docs/contracts/source-runtime-customization-boundary.md` | 168 | 定义 source → generated runtime → workflow artifact/provider evidence 的 ownership 链。 | 修复必须 source-first，runtime drift 只授权 `spec-first init` 重建；tool output 是 untrusted quoted data。这一合同与 plugin projection 实现一致。 |
| S-B06 | `docs/contracts/verification/verification-profile.md` | 28 | 声明 workflow closeout 可用的 check identities/commands，不执行命令。 | Loader 只解析 candidates；missing tools、dry-run 和结果转交 run summary。无 profile 时可从 package scripts 推断，但 authority 更弱。 |
| S-B07 | `docs/contracts/verification/verification-profile.schema.json` | 83 | 机读 profile 的 service/stack/check 关系。 | 仅形状和路径不变量，不做执行或 passed 判断。 |
| S-B08 | `docs/contracts/verification/verification-run-summary.md` | 33 | `spec-work` / `spec-debug` / `spec-code-review` 共享的 per-check result handoff。 | Caller 必须显式选 workflow scope；dry-run 和 missing tool 必须 `not-run`。Work 最终检查在 tail mutation 停止后记录，debug/review 只记录自己真正执行的命令。 |
| S-B09 | `docs/contracts/verification/verification-run-summary.schema.json` | 79 | 机读 shared run summary，路径枚举三个 owning workflow。 | `passed/failed/not-run/degraded` 与 `ran/exit_code/log_path` 的形状约束明确；不包含第四个隐式 consumer。 |

## C. Governance / projection / handoff implementation（11/11）

| ID | 完整读取文件 | 行数 | 关系职责 | 权威、失败/停止、投射/测试结论 |
| --- | --- | ---: | --- | --- |
| S-C01 | `src/cli/contracts/dual-host-governance/skills-governance.json` | 496 | 35 个 governed Skill 的 entry surface 与 five-host delivery 真相源：17 workflow、11 standalone、7 internal-only。 | 7 个 internal helper 在每个宿主都标为 `internal`，但该合同不表达 caller、fallback 或 reachability；是 SF-01 的 topology 起点。 |
| S-C02 | `src/cli/contracts/dual-host-governance/skills-governance.schema.json` | 153 | 约束 entry surface / host scope / delivery enum 和宿主全键。 | 不存在 caller/consumer/fallback/reachable 字段，因此 schema 通过不能证明 internal edge 可执行。 |
| S-C03 | `src/cli/plugin-governance.js` | 137 | 把 governance records 转换为每宿主 filtered asset set。 | `DELIVERED_INTERNAL_SKILLS` 只有 `spec-worktree`；其余 internal records 全部进入 skipped，即使 `host_delivery=internal`。这是 SF-01 的确定性实现证据。 |
| S-C04 | `src/cli/plugin-manifest.js` | 631 | 从 governance + Skill dirs + command templates 构建 manifest，并验证每个 bundled Skill 有唯一 governance record。 | 能发现 roster 遗漏/重复/非法 delivery，但不扫描 Skill caller 或验证 caller target 被投射。 |
| S-C05 | `src/cli/plugin-sync.js` | 941 | 消费 filtered asset set，将 workflow/standalone/delivered-internal Skill 及 support files 投射到五宿主并检测 drift。 | 完整复制被选 Skill 目录，排除 evals 和 top-level maintainer README；它不会为未被 filtered 选中的 helper 提供隐式 fallback。 |
| S-C06 | `src/cli/plugin.js` | 46 | 聚合 manifest、governance、sync 与 inspect 的 public facade。 | 不新增语义；上层 init/doctor 所见的 asset 集合完全取决于 C03/C05。 |
| S-C07 | `src/cli/task-pack.js` | 909 | 为 `spec-write-tasks` → `spec-work` handoff 验证 source-plan path/hash、Task Pack Contract、wave/dependency/file/stop shape。 | 确定性验证不裁决语义充分性；wrong chain/stale/unverifiable/invalid 都 fail closed。Plan 仍是 authority，task pack 仅 derived index。 |
| S-C08 | `src/cli/helpers/plan-status.js` | 234 | 为 shipping-tail owner 提供 plan `inspect` / `complete` 的窄 mutation helper。 | 只允许 `active → completed`，已 completed 幂等，其他状态/非法路径/重复字段失败。它不自己判断 verification/review 是否收口。 |
| S-C09 | `src/cli/helpers/honest-closeout.js` | 369 | 消费 run summary 和 structured claims，为 work/debug/review 输出 verified/degraded/unsupported。 | Validation passed 必须覆盖整个 run summary；path claim 必须指向仓库内普通文件。Knowledge claim 只限 `docs/solutions/**` 和文件存在，未校验 promotion fields，构成 SF-05 证据。 |
| S-C10 | `src/cli/helpers/verification-run-summary.js` | 618 | 共享 record/read helper，显式支持 work/debug/code-review 三个 artifact root。 | 不执行命令、不安装工具、不推断 exit code；同 run immutable，log 必须 repo-contained 且通过 bounded secret scan。 |
| S-C11 | `src/cli/helpers/spec-work-run-artifact.js` | 1271 | 只为 `spec-work` 写/读/剪 durable run artifact，消费同 run 的 verification summary。 | 硬编码 `WORKFLOW=spec-work`；debug/review 不能借此获得 work artifact ownership。写入仅接受合法 trigger 与聚合状态一致的 summary ref。 |

## D. Runtime Setup 直接实现（2/2）

| ID | 完整读取文件 | 行数 | 关系职责 | 权威、失败/停止、投射/测试结论 |
| --- | --- | ---: | --- | --- |
| S-D01 | `skills/spec-runtime-setup/scripts/setup.cjs` | 765 | `spec-runtime-setup` 的入口调度器：解析 mode/target/host authority，路由 diagnostic、plan、project-config、provider mutation 与 workspace graph。 | Target 不允许写或 host authority 冲突时 mutation 失败关闭；plan 只 preview。该实现产生 readiness/config facts，不裁决 `spec-plan` / `spec-brainstorm` 的语义 consumer。 |
| S-D02 | `skills/spec-runtime-setup/scripts/lib/project-config.cjs` | 330 | 规划、检查并应用 `.spec-first/config.local*.yaml` / `.gitignore` 的 repo-local setup mutation。 | 使用 containment 和 atomic write，不覆盖已有 local config；parent workspace 只写 advisory summary。它不读 plan/brainstorm output hints，因此 SF-02 是 prose/config consumer 映射问题，不是这个 helper 的运行分支。 |

## E. README / catalog / 用户手册 / 审查索引（7/7）

| ID | 完整读取文件 | 行数 | 关系职责 | 权威、失败/停止、投射/测试结论 |
| --- | --- | ---: | --- | --- |
| S-E01 | `README.md` | 306 | 用户可见的主链、artifact ownership、five-host delivery 与 shared closeout 说明。 | 当前正确声明新 `spec-brainstorm` 写 `docs/plans/` requirements-only，`spec-prd` 仍写 `docs/brainstorms/`；也正确区分 work/debug/review 的 artifact ownership，为 SF-03/SF-04 反证。 |
| S-E02 | `README.zh-CN.md` | 305 | E01 的中文用户投影。 | 与 E01 的 current route/artifact/authority 描述对齐；不支持用户手册中旧 brainstorm path。 |
| S-E03 | `docs/catalog/runtime-capabilities.md` | 172 | 从 governance/plugin/schema/source Skill 派生的只读 runtime catalog。 | 明确只投递 `spec-worktree`，其他 6 个 internal 为 governance-only；正确标记 work artifact workflow-integrated=true 与 work-only ownership。Catalog 不是第二真相源，但它是当前 generator 输出的可见反证。 |
| S-E04 | `docs/05-用户手册/04-workflows-artifacts-map.md` | 190 | 向用户映射 workflow producer → artifact path → consumer → Git boundary。 | 同时存在三类漂移：brainstorm path、work artifact integrated status、`direct_evidence_used` 字段形状；分别支持 SF-03/SF-04。 |
| S-E05 | `docs/05-用户手册/10-产物目录.md` | 97 | 定义 durable docs、runtime/control-plane 与 generated mirror 的用户可读 ownership。 | 将 `spec-brainstorm` 仍登记为 `docs/brainstorms/*-requirements.md` producer，与 README/current Skill contract 冲突。其他 source/runtime 边界基本一致。 |
| S-E06 | `docs/05-用户手册/24-公开入口与Skill目录.md` | 134 | 投影 public workflow/standalone/internal roster 和用户路由。 | 主链表中 brainstorm path 仍为旧值；同时声称 internal helpers “由公开 workflow 在需要时委托”，但没有披露只有 worktree 被投射，支持 SF-01/SF-03。 |
| S-E07 | `docs/项目审查/README.md` | 54 | 审查报告与 active recommendations 的索引 consumer。 | 并行收口线程已登记本次 2026-07-17 Skill-flow audit，并写入 275 个 source 文件、157 个 canonical mention pair、76 个直接支撑文件与 11 个 P1 的索引摘要；本台账只将其视为主报告的 downstream index，不使用该摘要反向替代源文证据。 |

## F. Focused tests（33/33）

| ID | 完整读取文件 | 行数 | 直接覆盖的关系 | 覆盖结论 / 盲区 |
| --- | --- | ---: | --- | --- |
| S-F01 | `tests/integration/init-five-host-lifecycle.integration.test.js` | 317 | Source → five-host init → doctor/idempotence，并校验 17 workflow + 12 standalone/internal 的 Claude 计数。 | 证明已选 assets 能稳定投射；12 实际是 11 standalone + 1 worktree，不证明其他 internal caller 可达。 |
| S-F02 | `tests/integration/plan-status-closeout.integration.test.js` | 111 | Direct plan 和 task-pack source-plan 的 shipping lifecycle handoff。 | 证明只改 source plan `active → completed`，pack 字节不变；支持 plan authority 关系。 |
| S-F03 | `tests/integration/spec-work-closeout-producer.test.js` | 131 | `spec-work` closeout → verification summary → run artifact producer。 | `trigger-task-pack` 会生成 schema-valid、`workflow_integrated=true` 的 durable evidence，直接反证 E04 的旧说明。 |
| S-F04 | `tests/unit/honest-closeout.test.js` | 545 | Shared run-summary claim validation，以及 review/impact/knowledge path claims。 | 防止 cherry-pick passed checks；knowledge test 只要求 `docs/solutions/**` 普通文件存在，没有 promotion field 校验，支持 SF-05。 |
| S-F05 | `tests/unit/host-runtime-projection-contracts.test.js` | 281 | Cursor/Kiro/Qoder 的 Skill content transform、comparative path 和 workflow classification。 | 保护 host-local projection 语义，但不建立 public caller → internal target reachability。 |
| S-F06 | `tests/unit/low-findings-cleanup-contracts.test.js` | 55 | `spec-test-browser` 的 source `user-invocable:false` 与 governance `internal_only`。 | 证明 helper 不是用户入口，但未证明 `spec-lfg` caller 在 runtime 能找到它；支持 SF-01。 |
| S-F07 | `tests/unit/mcp-setup-config-consumers.test.js` | 174 | Runtime Setup config keys → Skill consumers。 | 测试正向锁定“ideate active，plan/brainstorm reserved”；若两个 source Skill 已消费后两者，该测试是 drift 保护而非保障，即 SF-02。 |
| S-F08 | `tests/unit/pipeline-mode-contracts.test.js` | 53 | `spec-lfg` → `spec-commit-push-pr` / `spec-test-browser` 的 unattended pipeline handoff。 | 证明 source-level caller contract 真实存在，但未证明目标 helper 被 five-host runtime 投射，是 SF-01 关键反差证据。 |
| S-F09 | `tests/unit/plan-status-helper.test.js` | 229 | Shipping caller → plan status helper。 | 覆盖 canonical statuses、duplicate/missing/invalid fail-close、atomic/idempotent complete 与 path safety；关系正确。 |
| S-F10 | `tests/unit/plan-status-taxonomy.test.js` | 112 | Review report → plan `referenced_reviews` 弱反链，以及 lifecycle taxonomy。 | 只校验 origin+in 声明 finding ids，不裁决 finding 真实性/覆盖；与 A07 的 weak-by-design 边界对齐。 |
| S-F11 | `tests/unit/plugin-modules.test.js` | 537 | Governance/manifest/filter/sync/inspect 的五宿主 projection。 | 只断言 `cursor.internalSkills` 包含 `spec-worktree`，并证明 references/scripts 整包投射；没有任何 caller-target closure 测试。 |
| S-F12 | `tests/unit/repo-profile-cache-parity.test.js` | 84 | `spec-plan` 及其他复制 consumer 共享 repo-profile cache 资产的 parity。 | 证明同名 cache/reference/agent 副本字节一致，且 plan-only docs 变化不会错误失效 profile；未发现关系漂移。 |
| S-F13 | `tests/unit/spec-brainstorm-contracts.test.js` | 35 | `spec-brainstorm` → requirements-only unified Markdown plan lifecycle。 | 证明 software Markdown 产物携带 `execution:code` + `status:active`，HTML/通用路由不携 status；与 README 合证当前已转 `docs/plans/`。 |
| S-F14 | `tests/unit/spec-code-review-contracts.test.js` | 122 | Review caller/dispatch、task review handoff、artifact path 与 mutation/commit authority。 | `mode:agent` 永远 report-only；dispatch 未授权时 inline degraded；apply 不授权 commit。未涉及 internal shipping helper 投射。 |
| S-F15 | `tests/unit/spec-debug-contracts.test.js` | 42 | Debug diagnosis → optional fix → commit/landing 的分离 authority。 | Fix 不授权 commit/push/PR；dispatch 不可用时 serial fallback。测试没有验证其文档中 commit helper target 的 runtime 可达性。 |
| S-F16 | `tests/unit/spec-doc-review-contracts.test.js` | 320 | Doc review route/classification/dispatch/mutation policy 与 lazy-reference reachability。 | Mandatory reviewer 缺失时 incomplete，report-only 禁止 Markdown mutation；lazy refs 均从 execution spine 可达。未发现 Skill edge 漂移。 |
| S-F17 | `tests/unit/spec-lfg-contracts.test.js` | 24 | `spec-lfg` 作为 end-to-end caller 拥有 plan completion tail。 | 覆盖 review/residual/final verification 收口后 lifecycle complete，但不覆盖 LFG 呼叫的 internal helper 是否可发现/可执行。 |
| S-F18 | `tests/unit/spec-plan-contracts.test.js` | 96 | Requirements producer → plan in-place enrichment，plan → work 执行 handoff。 | 保留 lifecycle，不把 readiness 当 progress；legacy brainstorm 仅作 historical input。测试本身不校验 A13 的新 brainstorm path。 |
| S-F19 | `tests/unit/spec-plan-quality-contracts.test.js` | 238 | Plan 的 inline/subagent fallback、doc-review handoff、source ownership lens 与 five-host reference projection。 | 证明未授权 dispatch 不阻断 inline plan，且 runtime refs 均投射、evals 不投射。不解决 Runtime Setup config key 错标。 |
| S-F20 | `tests/unit/spec-work-consumer-chain-contracts.test.js` | 40 | `spec-code-review` temp artifact → `spec-work` followup/shipping/tracker 的 consumer chain。 | Run-local consumer 必须复用 returned `artifact_path`，durable handoff 必须物化 repo-local evidence 或 structured summary；关系正确。 |
| S-F21 | `tests/unit/spec-work-contracts.test.js` | 80 | Implementation-ready plan / validated task pack → work，再到 report-only review 和 shipping lifecycle。 | Source plan 仍 authority，leaf worker/reviewer 不改 plan status，commit 需独立授权；关系正确。 |
| S-F22 | `tests/unit/spec-work-execution-strategy-contracts.test.js` | 81 | Work orchestrator → worker dispatch/workspace isolation/commit/landing 的权限拆分。 | Worker 不 commit，无 dispatch 授权时 inline，无 landing 授权时不 push/PR；关系正确。 |
| S-F23 | `tests/unit/spec-work-front-controller-contracts.test.js` | 96 | Work Front Controller → 9 个一层 runtime references。 | 每个 reference 都有 Owned/Not Owned/Trigger/Fallback，且真实链接可达；这证明 Skill 内 reference edge 正确，不等于独立 internal Skill 可达。 |
| S-F24 | `tests/unit/spec-work-implementation-quality-contracts.test.js` | 109 | Work 在首次 mutation/ durable surface 前分别加载 feedback 和 architecture owner。 | 确保 reuse/extend/compose/new 与 scope-changing stop-back 到 `spec-plan` / `spec-write-tasks`；未发现关系漂移。 |
| S-F25 | `tests/unit/spec-work-intake-contracts.test.js` | 87 | Task pack 分类→CLI 验证→semantic fit→waves/review/stop replay。 | 不自动重分解或自动编译 task pack；drift/stop/P0-P1 未收口阻断 dependent work。 |
| S-F26 | `tests/unit/spec-work-run-artifact-contract.test.js` | 309 | v1/v2 schema compatibility、producer metadata、direct evidence 与 path classes。 | 明确 current `direct_evidence_used` 形状和 integrated=true trigger rules，直接反证 E04 旧文档。 |
| S-F27 | `tests/unit/spec-work-run-artifact-producer.test.js` | 1211 | Internal CLI write/read/prune → schema → same-run verification summary。 | 覆盖 immutable write、trigger metadata、status aggregate、containment、secret/path rejection、v1 read/prune；不授权 debug/review 写 work artifact。 |
| S-F28 | `tests/unit/spec-work-shipping-contracts.test.js` | 132 | Work/debug/review 共享 run-summary + honest-closeout，work 额外 conditional durable artifact。 | 精确锁定三个 consumer 与 work-only ownership，并要求 temp review evidence 物化/降级；关系正确。 |
| S-F29 | `tests/unit/spec-worktree-contracts.test.js` | 88 | `spec-dogfood` → delivered internal `spec-worktree` existing-ref isolation。 | 证明 worktree helper 有真实 caller 和可执行 script，且不切换 primary checkout；它是 SF-01 中的正常可达对照组。 |
| S-F30 | `tests/unit/spec-write-tasks-contracts.test.js` | 64 | Plan → derived optional task pack → work 的 producer contract。 | 必须有 CLI hash/validate evidence 才能声称 deterministic handoff；high-risk review 不自动 dispatch。 |
| S-F31 | `tests/unit/task-pack-command.test.js` | 314 | `spec-first tasks hash/validate` 的路径/hash/spec-id/wave/file 确定性边界。 | 缺 `spec_id` 只降级 trace，mismatch/stale/path escape/generated runtime 失败关闭；支持 task-pack 关系正确。 |
| S-F32 | `tests/unit/using-spec-first-contracts.test.js` | 133 | Entry governor → public route map / conditional boundaries，并覆盖全部 public roster。 | 强制每次只选一个 entry，active worker 不 reroute，且用户可读 package 不暴露任何 internal-only 名称。正确的可见性边界不能替代 internal caller reachability。 |
| S-F33 | `tests/unit/verification-run-summary.test.js` | 455 | 三个 workflow 的 run-summary record/read 与 schema parity。 | 覆盖 explicit workflow roots、dry-run/missing dependency 不得 passed、log containment/secret scan、immutable write，且校验 helper workflow set 与 schema alternation 一致。 |

## 最终台账验收

- 冻结清单行：76
- 实际台账行：76
- 未登记：0
- 越界登记：0
- 重复登记：0
- 每个文件都已完整读取，并至少登记了其 route/handoff/consumer/caller/authority/failure/stop/projection/test coverage 中与本审查直接相关的关系。
- 本文件只是 supporting evidence ledger；最终 finding 需与 275 个 Skill source/reference 文件的三分区台账合并裁决。
