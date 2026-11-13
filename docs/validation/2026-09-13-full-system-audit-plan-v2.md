---
artifact_type: audit-plan
artifact_version: 3
artifact_contract: full-system-audit-plan/v2
title: spec-first 全链路系统审查方案 v2
type: docs
date: 2026-09-13
created_at: 2026-09-13
updated_at: 2026-09-14
target_repo: .
scope: current-source-to-field-evidence
status: active
authority: audit-artifacts-only-by-default
execution: audit
execution_isolation: disposable-worktree
supersedes: docs/validation/2026-08-01-full-system-audit-plan.md
---

# spec-first 全链路系统审查方案 v2

## Goal Capsule

- **目标：** 判断当前 checkout 是否能把 `Codebase -> Spec -> Plan -> Tasks -> Code -> Review -> Knowledge` 连接成可验证、可恢复、可复用的可信变更闭环。
- **审查边界：** 以当前 `HEAD`、当前 source、当前 contracts/tests 和显式授权为准；旧报告、memory、provider 输出只作 advisory 线索。
- **审查方式：** 先做 source/contract 与 deterministic floor，再做隔离 projection/lifecycle，最后按授权选择真实宿主、真实任务和 comparator 波次。
- **执行环境：** 审查在一次性 git worktree 中执行，被审 source 由一个具名 commit 固定；审查产物全部写在该 worktree 内，主 checkout 不接收任何审查写入。这使 source snapshot 判定不再被审查自身的产物写入干扰。
- **不得声称：** fixture 或模型自评不能证明真实宿主可用；projection 不能证明 workflow invocation；单个成功任务不能证明相对增量价值。
- **产物：** 一份 run manifest、逐项 evidence receipt、finding ledger 和 canonical report；审查过程不夹带 source/runtime 修复。
- **文档契约：** 本文件是 report-only 的 `full-system-audit-plan/v2`，不是 `spec-unified-plan/v1`，不交给 `spec-work` 直接执行；执行只产生审查 artifact，修复仍由后续 owner workflow 承担。
- **停止条件：** 发现授权越界、隔离失败、凭证暴露、source snapshot 改变而未重新冻结、或连续尝试没有新证据时停止受影响波次并保留未完成状态。
- **后续 owner：** 审查报告只交付 findings 和复验条件；修复另行进入 `spec-plan`/`spec-work`，知识沉淀另行进入 `spec-compound`。

## Product Contract

### Summary

本方案服务于项目研发负责人对 spec-first 的整体质量判断。审查对象不是仓库逐行代码，而是决定可信变更的 ownership、连接、出口和证据链。

### Problem Frame

当前项目同时包含 CLI、8 个宿主适配器、runtime projection、workflow Skill、Provider/setup、verification/handoff/knowledge contract，以及持续演化的 CE localization 工件。历史审查已经证明局部机制可以通过，但也证明旧 source snapshot、旧宿主数量和历史 evidence 不能直接代表当前状态。审查必须先处理 source identity 与 dirty-worktree 边界，再决定哪些结论能够升级。

### Requirements

#### Scope and authority

- R1. 审查必须在一次性 worktree 中执行，并在 run start 冻结被审 commit、worktree 路径、dirty paths、Node/npm、package version、动态宿主集合、授权和工具可用性。
- R2. 审查必须把 project-owned source、generated runtime、host-local state、provider artifact 和审查产物分开，并把结论回源到当前 source/test/log/contract。
- R3. 审查不得在被审工作树修复 finding、手改 generated runtime、注入 source/runtime drift、全局安装、commit、push、PR 或外发数据，也不得向主 checkout 写入任何审查产物。

#### Evidence and claims

- R4. 每个 check 必须记录 command/method、是否实际运行、exit code、status、evidence path、source refs、owner、consumer 和 limitation。
- R5. 结论必须使用 `C0`（source/contract）、`C1`（CLI/projection）、`C2`（版本冻结的宿主 loader）、`C3`（真实任务）和 `C4`（可比较增量价值）claim ceiling，禁止跨层外推。
- R6. `passed`、`failed`、`degraded`、`not-run`、`blocked` 与 `hard-enforced`、`loud-convention`、`missing` 分开记录。

#### Coverage and closeout

- R7. 审查必须覆盖动态宿主全集、五类退出 gate、核心 public workflow、Runtime Setup/Provider、受支持的降级路径和历史 evidence freshness。
- R8. 每个 P0/P1 finding 必须有直接证据、后果、source owner、最小修复方向、复验方法和失效/重评条件。
- R9. 只有所有计划 check 有终态、证据可回源、未执行项有 reason code、且 claim ceiling 与证据一致，才能称本轮审查完成；这不等于项目整体机制、field outcome 或增量价值已通过。
- R10. 每个 canonical Skill 必须单独验证其内部入口、触发边界、流程分支、引用依赖、输出合同、失败处理和完成条件，不能用 workflow 总评替代。
- R11. 每个 workflow Skill 必须验证从输入到 handoff/closeout 的路径完整性，包括正常、边界、失败、降级、停止和恢复分支，以及每个分支的 owner 与 evidence obligation。
- R12. 单个 Skill 的逻辑审查必须把 source body、条件 reference、scripts、schemas、tests、host projection 和实际 consumers 组成可回源的 dependency closure；缺任一关键节点时只能报告 `degraded`（语义缺口以 `concerns` 级 finding 记录，不作为运行状态）或 `not-run`。

#### Product positioning and value

- R13. 产品定位审查必须明确 primary user、anti-persona、核心 Job-to-be-Done、触发时机、现有替代方式和首个可感知结果，不能用“面向所有 AI coding 用户”替代分群。
- R14. 产品价值必须拆成可信度、质量调整后吞吐、风险/返工降低、上下文复利和可验证性等 outcome，并为每项指定可观察指标、baseline、反指标和证据上限。
- R15. 审查必须比较 spec-first 与宿主原生能力、手工 SDLC、CI/review/knowledge 工具及自建 workflow 的边界和替代关系，明确差异化 wedge、不可替代资产和不应重复建设的能力。
- R16. 审查必须覆盖从安装/init/首次 workflow 到首次可信变更的 activation 路径，以及重复任务、团队协作、跨会话/跨宿主 handoff 和知识复用的 retention 机制。
- R17. 审查必须评估用户采用成本：setup、学习、token/compute、等待、review、维护、升级、host drift 和治理负担，并检查这些成本是否超过目标 outcome 的收益。
- R18. 审查必须区分个人开发者、小团队、平台/基础设施团队和受监管组织的适用性、权限模型、数据边界、采购/推广阻力与成功标准；缺少证据的群体保持未验证。
- R19. 审查必须定义产品生命周期决策：何时 Adopt、Experiment、Wrap、Build、Thin 或 Retire 一项能力，以及默认路径、preview/degraded 状态和退出条件如何影响定位可信度。
- R20. 产品定位结论必须分别标记结构、行为、runtime cost、field outcome 和相对增量价值证据；能力数量、Skill 数量、测试通过或单个 demo 不得直接升级为市场/产品价值。

#### Execution isolation, redaction and budgeted coverage

- R21. 审查必须在与主 checkout 分离的一次性 worktree 中执行，被审 source 由 commit 固定；审查产物落在该 worktree 的 run-scoped 目录内，run 结束前不得进入任何被跟踪路径，也不得依赖主 checkout 的可写状态。
- R22. 脱敏要求必须覆盖全部 artifact 类别（raw log、check receipt、Skill receipt、gate/positioning matrix、finding ledger 和 canonical report），并且脱敏门必须与其他出口一样提供负例证据；「扫描通过」在没有负例证据时不得记为脱敏已强制。
- R23. 覆盖承诺必须在计划阶段而不是执行中段确定：每个 canonical Skill 在开跑前就归入「承诺最低覆盖」或「本轮显式 not-run」，`not-run` 必须带 reason code 与重评条件；预算耗尽不得把已承诺包降级为浅覆盖，也不得把未承诺包写成通过。

### Scope Boundaries

- **本轮包含：** 当前 source/contract inventory、8 宿主 projection/lifecycle、deterministic gate、16 个核心 workflow/入口语义、38 个 canonical Skill 的逐包覆盖裁定（24 个承诺最低覆盖 + 14 个计划期显式 `not-run`）、产品定位、Provider/setup、历史证据复核、canonical report 收口（U11）。
- **本轮不包含：** 逐行审查全部文件、无授权的 worker/persona dispatch、真实外部系统写入、真实用户数据、生产部署、发布或 durable knowledge promotion。
- **条件范围：** 隔离 D 场景（U6）需要 L0–L2 出口条件已通过，KTD6 的不自动扩大规则对它与 J/C 波次同等适用；C2 需要 exact-version 宿主 journey；C3 需要真实未解决任务和 disposable worktree；C4 需要预注册 comparator。输入缺失时记 `not-run`，不以降级措辞掩盖。

### Working Positioning Baseline

以下定位选择由项目 owner 于 2026-09-14 以判断方式固化（溯源：`CHANGELOG.md` v1.15.3 2026-09-14 条目），全部为 `hypothesis` 级——基于当前 source 与角色契约的 owner 判断，未执行用户研究、真实任务或 comparator 验证，不占用本仓库保留词 `confirmed`。它们作为后续审查的产品口径约束审查问题，不替代真实用户和 field evidence；U10 必须独立复核并可推翻其中任何一条，被推翻项按 Finding Contract 记录，不因出现在本节而获得豁免。

- **用户分层：** 主要使用者是已有 AI coding 宿主的个人/资深开发者；平台/技术负责人是推广与治理对象；不使用 AI coding 宿主的团队属于 anti-persona。
- **Job-to-be-Done：** 即时任务是把失控风险较高的 AI coding 变成有意图、范围和验证证据的可信变更；组织任务是统一多宿主、多仓 workflow、权限和交接边界；长期任务是沉淀可复用且带失效条件的项目知识。
- **核心 wedge：** 首要价值是可信变更证据链；扩展价值是跨宿主、跨会话的统一 workflow 与 source/runtime 边界；复利价值是可复用项目知识。
- **替代关系：** 主要与宿主、CI、代码审查和知识库互补；在覆盖和迁移成本被验证后，替代团队自建 workflow 与散落脚本；不扩张为统一 AI-DLC 交付平台。
- **首个价值：** 用户首先应获得一次可回源的计划、变更、验证和审查证据；runtime 入口发现和知识整理是同一 onboarding 的后续价值层。
- **持续采用：** 由重要变更的证据需求、跨会话/跨宿主/跨成员交接需求，以及知识和项目规则复用共同驱动。
- **成本优先级：** 首先控制入口、学习和流程长度成本；token、Provider、CI、维护和治理成本作为次级反指标持续记录。
- **组织优先级：** 个人/资深开发者优先作为落地使用者，平台/技术负责人作为推广和治理对象；两者不得共用同一成功指标。
- **能力演化：** 默认先 `reuse/extend`，价值未证实时 `Experiment/Defer`，确认 durable gap 后才 `Build`，无 consumer 或收益不足时 `Thin/Retire`。
- **复杂度策略：** 保留能力广度，通过 progressive disclosure 和 `using-spec-first` 收敛默认入口，不以 Skill 数量直接代表产品聚焦。
- **证据顺序：** 先证明可信变更机制，再证明真实任务效果，最后使用预注册 comparator 判断相对增量价值；任何一层缺失都限制 claim ceiling。

## Planning Contract

### Key Technical Decisions

- **KTD1 — 复用历史审查结构，重建当前基线。** 复用 `docs/validation/2026-08-01-full-system-audit-plan.md` 的 claim ladder、五类 gate、D/J 分层和 finding contract；不复用其中的宿主数量、命令结果、路径计数或 completion claim。
- **KTD2 — 动态宿主集合是唯一覆盖输入。** 每次从 `src/cli/adapters/index.js#getSupportedPlatforms()` 解析宿主，并与 `platform-registry`、host flags、governance schema、receipt schema、catalog 和 lifecycle tests 做一致性比对。当前 source 观察到 `claude,codex,cursor,kiro,qoder,opencode,zcode,pi`；执行时若变化，以冻结 snapshot 为准。
- **KTD3 — 审计与修复分离。** 审计只写 run-scoped evidence 与 validation report；任何 source、test、contract、README、CHANGELOG 或 generated runtime 修复均由后续 owner workflow 在新的 source snapshot 中完成。
- **KTD4 — 采用 `reuse / extend / compose / new` lens。** 本方案不新增审计框架；优先复用现有 `run-test-suite.cjs`、`npm-install-matrix-smoke.cjs`、doctor/init lifecycle、verification summary、handoff 和 promotion contracts。只有现有 receipt 无法表达跨阶段证据时，才在审计产物中增加薄的汇总 glue，不建立第二套领域真相。
- **KTD5 — 独立 fresh-source eval 不是默认前提。** 没有明确 delegation authorization 时采用 serial inline source review，并记录 `dispatch_authorization_missing`；不得把当前会话自审或普通 unit test 写成独立 reviewer evidence。
- **KTD6 — 先收集机制证据，再决定 field 波次。** L0/L1/L2 任一关键安全边界失败时，仍可报告已完成的静态部分，但不自动扩大到 D/J 或 C2–C4；每个波次有自己的 exit criteria。
- **KTD7 — 一次性 worktree 而非干净 clone。** 审查在 `git worktree add` 出来的一次性目录中执行，被审 source 由具名 commit 固定。选它而不选干净 clone 的理由：worktree 与主 checkout 共享 object database，因此 commit 身份天然一致、无需比对两个 remote 状态，也避免 clone 带来的分支/远端差异成为额外的漂移来源；同时 worktree 有独立工作区与独立 index，审查产物和 `npm install` 派生物不会进入主 checkout 的 `git status`。被拒绝的替代方案：在主 checkout 原地执行——审查自己写出的 canonical report 位于被跟踪的 `docs/` 下，会在运行后改变整树指纹，使 R1 的「变化即停止」被自身产物触发。worktree 生命周期由 U1 建立、U11 收口后由 run owner 移除；移除前必须先把 canonical report 复制到主 checkout 的目标路径。
- **KTD8 — 覆盖承诺按依赖闭包体积定档，而不是按出口 gate 归属。** 出口 gate 归属决定审查顺序与风险优先级；单包预算由依赖闭包体积（文件数与正文规模）决定。两者混用会把最大的包放进最小的预算格。承诺覆盖的包在计划期具名固定，未承诺的包在计划期就写成 `not-run`，不留给执行中段的预算截断。

### Evidence & Limitations

- 本方案起草时的 `HEAD` 为 `c0803ab5d2e80edde9ca67771c6d204b775bb354`，工作树 dirty（113 项）。该批 dirty 输入随后被固化为两个 commit：`adaf9093`（Runtime Setup repair-loop 与 CE localization 确定性链重跑）与 `876b5c22`（本方案文档入库）。审查基线因此从不可复现的 dirty 树变为具名 commit；`adaf9093` 触及的高变更 surface（runtime-setup workspace、peer-runner、CE localization ledger、mcp-setup 测试面）仍按原优先级作为重点审查输入，只是现在以 commit diff 而不是 dirty paths 的形式冻结。
- U1 在 run start 必须重新解析被审 commit，不得沿用本节记录的历史值；本节只说明基线是如何形成的。
- 把 `check:shared-references` 纳入 U2 确定性地板的决定已被一次实测验证：在 `876b5c22` 上运行该命令得到 exit code 1，报告 `skills/spec-compound/references/yaml-schema.md` 与 `skills/spec-compound-refresh/references/yaml-schema.md` 相对 `skills/_shared/references/yaml-schema.md` 漂移（两份副本各多出 25 行 `Classification Contract v2` 段落，共享源没有）。这是一个 source-first 方向错误的既有 drift——内容被加在 per-skill 副本而不是共享源上——此前未被任何流程发现。本方案不修它：修复属于后续 owner workflow，且必须先把该段落提升到共享源再 sync，直接运行同步会用共享源覆盖副本并删掉那 25 行。U7 应把它作为 `stale`/待修条目登记，U2 的该条 check 预期为 `failed`，不得因「基线应当为绿」而跳过或掩盖。
- 当前 `src/cli/adapters/index.js` 已注册 8 个宿主，而部分历史测试与合同文件仍使用 “six-host” 命名；这是待验证的 drift 假设，不是已确认缺陷。
- 当前 `tests/` 有 292 个文件、`skills/` 有 76 个目录（含 workspace/eval 支撑目录），其中 38 个目录带 canonical `SKILL.md`；数量只用于计划容量和覆盖检查，不能单独证明质量。
- 当前未获 worker dispatch、外部宿主、真实任务或 comparator 授权；本轮设计默认这些波次为条件执行，不能预先写成通过。

### Architecture and Ownership Map

| Surface | Canonical owner | Audit consumer | Evidence boundary |
| --- | --- | --- | --- |
| Host enumeration and projection | `src/cli/adapters/**`, `src/cli/plugin*.js`, governance schema | init/doctor/lifecycle tests, runtime catalog | projection ≠ loader discovery |
| Workflow semantics | `skills/*/SKILL.md`, references, templates | public workflow contracts and source review | self-review ≠ independent eval |
| Runtime/setup facts | `skills/spec-runtime-setup/**`, `src/cli/commands/doctor.js`, setup contracts | setup tests, receipts, doctor JSON | readiness fact ≠ provider outcome |
| Verification/closeout | `docs/contracts/verification/**`, `skills/spec-work/**`, `spec-code-review/**` | summary/negative tests and receipts | recorder ≠ process supervision |
| Handoff/knowledge | `docs/contracts/artifact-summary.md`, `spec-handoff`, `spec-compound` | consumer/promotion tests | writer pass ≠ universal consumer gate |
| Audit artifacts | `.spec-first/audits/full-system/<run-id>/`, `docs/validation/**` | report readers and follow-up owners | generated evidence ≠ source truth |
| Audit execution environment | run owner 的一次性 worktree（`git worktree`），被审 commit | U1 manifest、全部 check/Skill receipt | worktree 内的写入 ≠ 主 checkout 的 source 变化 |
| Deterministic drift checks | `scripts/sync-shared-references.js`, `scripts/sync-instruction-files.js` | U2 receipts、U7 reconciliation | exit code 是确定性事实；claim 是否 load-bearing 仍是 LLM 判断 |

### Audit Artifact Contract

本轮审查 artifact 使用 `full-system-audit/v1` 运行合同。每个 artifact 必须包含
`schema_version`、`artifact_type`、`run_id`、`generated_at`、`source_snapshot`（含 canonical source
roots 与 `excluded_run_outputs`）、`status`、
`reason_codes`、`evidence_paths`、`claim_ceiling`、`limitations` 和 `consumers`；所有路径必须是
repo-relative，所有写入由同一 run owner 串行完成，禁止预先创建空的“通过”报告。

运行状态统一为 `passed|failed|degraded|not-run|blocked`；enforcement level 统一为
`hard-enforced|loud-convention|missing`。`concerns` 只允许作为语义 finding 或
`fresh_source_eval` 的子状态，不能替代运行状态。
对 V1/V2/U11 另记录 `record_validity=passed|failed|incomplete`（receipt 是否完整可回源）
与 `mechanism_result=passed|failed|degraded|not-run|blocked`（被审机制是否满足该项通过条件）；
两者必须同时保留，不能由前者推导后者。
上述状态枚举适用于单个 artifact、check、receipt 和 gate。整轮 canonical report
另有生命周期状态 `incomplete|completed-with-findings`；该状态只由 U11/V11 在收口时写入，
不得回填到单项 receipt，也不能把 `completed-with-findings` 解读为所有检查均通过。

固定落位如下：

- `.spec-first/audits/full-system/<run-id>/run-manifest.json`：源身份、dirty fingerprint、环境、授权、工具、脱敏和初末快照。
- `.spec-first/audits/full-system/<run-id>/checks/<check-id>.json` 与 `logs/<check-id>.log`：每条确定性检查的命令、终态、exit code、reason code 和脱敏状态。
- `.spec-first/audits/full-system/<run-id>/skills/<skill-name>.json`：逐 Skill receipt；引用现有 inventory/scenario/baseline artifact，不复制其领域真相。
- `.spec-first/audits/full-system/<run-id>/gates.json`、`positioning.json`、`findings.json`：退出 gate、定位证据和 finding ledger。这三个文件本身是 artifact，因此在文件层携带上述 11 个 envelope 字段，被审对象逐条放在 `items[]` 内：`gates.json` 的 item 是单个退出 gate 行，`positioning.json` 的 item 是单个 positioning card，`findings.json` 的 item 使用下文 Finding Contract 形状。item 级字段名与 envelope 级字段名有意不同——finding 用 `direct_evidence`/`evidence_anchors`/`consumer` 表达单条 finding 的证据与受影响方，envelope 用 `evidence_paths`/`consumers` 表达整个 artifact 的证据集合与下游；V11 只对 envelope 层做 `run_id`/`source_snapshot` 一致性校验，不要求 item 重复这些字段。
- `docs/validation/full-system-audit/<run-id>-report.md`：唯一 canonical report，汇总上述 artifact，不承载未引用的独立结论。

**产物落位、可访问性与保留。** `.spec-first/audits/` 已被本仓库 `.gitignore` 的 spec-first
managed block 覆盖（`.spec-first/audits/`），因此 receipt 与 raw log 按设计只存在于执行者本机的
一次性 worktree 内，不进入版本库，也不能靠该忽略规则的手改来改变——它由 `spec-first init` 生成。
由此产生两条硬要求：

- canonical report 必须内联每条承重结论所依赖的 receipt 事实（check ID、终态、exit code、
  reason code、claim ceiling 与证据摘录），而不是只给一条本机路径；只给路径的结论按
  `evidence_status: degraded` 记录。报告读者与后续修复 owner 必须能在不访问执行者磁盘的前提下
  复核结论成立与否。
- run owner 在 U11 收口后按保留规则处理产物：canonical report 复制到主 checkout 的
  `docs/validation/full-system-audit/<run-id>-report.md`；raw log 与 receipt 在报告交付后删除，
  或在 run manifest 中登记保留期限与保留理由。真实宿主与真实任务波次（U8）产生的 log 默认删除，
  不得无期限留存。

优先复用 `docs/contracts/verification/verification-run-summary.schema.json`、
`skill-inventory.schema.json`、`skill-scenarios.schema.json`、`baseline.schema.json` 和
`field-validation-protocol.schema.json` 的事实与领域字段，但不把它们当作本轮审查 envelope
的直接校验器。审查 envelope 自己负责 run 级关联、审查状态、分支闭包、脱敏结果和报告汇总；
它必须通过显式 `evidence_ref`/`source_ref` 引用已有合同，不能复制或改写已有 inventory、scenario
或 field measurement 真相。`verification-run-summary.v1` 仍只作为命令验证证据，审查 receipt 的
`blocked`、`degraded` 与 `redaction_status` 等字段不得伪装成该合同的合法值；若需跨合同汇总，
先记录映射关系和原始 receipt，再由 U11 做一致性校验。

### Traceability and Execution DAG

| Requirement group | Units | Verification | 说明 |
| --- | --- | --- | --- |
| R1–R3 | U1 | V1 | 源身份、权限、禁止动作和隔离边界 |
| R4–R6 | U1、U2、U9、U11 | V1、V2、V9、V11 | 证据字段、状态枚举和 claim ceiling |
| R7 | U3、U4、U5、U6、U7 | V3–V7 | 宿主、gate、workflow、降级和历史 freshness |
| R8–R9 | U4、U5、U6、U7、U8、U11 | V4–V8、V11 | finding、波次出口和整体收口 |
| R10–R12 | U9 | V9 | 单 Skill 入口、流程、依赖闭包和 consumer |
| R13–R20 | U10、U8 | V10、V8 | 定位、采用、成本、现场结果和相对增量价值 |
| R21–R23 | U1、U9、U11 | V1、V9、V11 | 执行隔离、脱敏覆盖与负例、计划期覆盖承诺 |

执行依赖固定为：`U1 → U2`；`U1 → U3/U4/U7/U9`；`U9(Batch A/B) → U5`；`U3/U4 → U6`；
`U7/U9 → U10`；`U2/U3/U4/U5/U6/U7/U9/U10 → U8`；`U2/U3/U4/U5/U6/U7/U8/U9/U10 → U11`。
没有列入依赖的单元可以并行读取，但 artifact 写入仍由 run owner 串行化。

`U9(Batch A/B) → U5` 是部分依赖：U5 只需要 Batch A 与 Batch B 的 receipt 就绪，不等 Batch C1/C2。
U5 可以在 receipt 就绪前提前读取 source，但在对应 receipt 落盘前不得写出跨 Skill 的
`passed`/`completed` 结论——这条边把该约束固定在依赖图里，而不是只写在 U5 正文中。

层级映射（KTD6 中的 L0/L1/L2 引用按此解释）：L0 运行基线与宿主投射（U1、U2、U3）；L1 确定性地板与五类 gate（U4）；L2 语义审查（U5、U9、U10）；L3 隔离机制与授权 field 波次（U6、U8）；U11 为收口单元。文档中 U/V 编号反映追加历史，不代表执行顺序。

**U9 分批：顺序按风险，预算按闭包体积（KTD8）。** 依赖闭包档位由 U1 在 run start 实测并冻结；
下表为起草时的观测值（文件数 / 正文规模），执行时以冻结值为准：

| 档位 | 判据 | 包数 | 单包预算 | 起草时观测（文件数） |
| --- | --- | --- | --- | --- |
| L | 闭包 ≥ 40 文件 | 8 | 60–90 分钟 | `spec-project-rules` 105、`spec-app-consistency-audit` 90、`spec-runtime-setup` 83（约 1.05 MB 正文）、`spec-plan` 81、`spec-code-review` 62、`spec-doc-review` 53、`spec-prd` 48、`spec-work` 47 |
| M | 闭包 20–39 文件 | 14 | 30–45 分钟 | `spec-compound` 37、`spec-optimize` 37、`spec-brainstorm` 32、`spec-ideate` 30、`autoresearch` 30、`spec-pov` 25、`spec-write-skill` 25、`spec-compound-refresh` 24、`spec-lfg` 24、`spec-write-tasks` 23、`spec-polish` 23、`spec-debug` 22、`spec-resolve-pr-feedback` 22、`spec-sweep` 21 |
| S | 闭包 < 20 文件 | 16 | 15–25 分钟 | `spec-simplify-code` 19、`spec-commit-push-pr` 15、`spec-dogfood` 15、`spec-explain` 15、`spec-prototype` 14、`spec-riffrec-feedback-analysis` 13、`spec-product-pulse` 13、`spec-handoff` 13、`spec-strategy` 13、`spec-rule-miner` 12、`spec-promote` 11、`using-spec-first` 11、`spec-test-browser` 9、`spec-commit` 9、`spec-test-xcode` 5、`spec-worktree` 2 |

批次划分与覆盖裁定（按 R23 在计划期固定，24 个承诺 + 14 个 `not-run`）：

- **Batch A（pilot，5 个，承诺）** — 退出 gate 与 readiness surface 的 canonical owner Skill：`spec-work`、`spec-code-review`、`spec-runtime-setup`（L）、`spec-compound`（M）、`spec-handoff`（S）。先行验证 receipt 方法与单包实际成本，并据此校准后续批次预算。注意 `spec-handoff` 的 registry `entry_surface` 是 `standalone_skill`，`spec-runtime-setup` 在 ownership map 中的归属是 readiness facts 而非五类退出 gate 之一；批次名称不改变它们各自的入口类型与 owner 归属。
- **Batch B（11 个，承诺）** — U5 消费的其余核心 workflow/入口：`spec-plan`、`spec-prd`、`spec-doc-review`（L）、`spec-brainstorm`、`spec-ideate`、`spec-write-tasks`、`spec-lfg`、`spec-debug`、`spec-resolve-pr-feedback`、`spec-pov`（M）、`using-spec-first`（S）。其中 `spec-debug`、`spec-resolve-pr-feedback`、`spec-pov` 是 `AGENTS.md` 入口硬规则点名的强制路由入口，必须与其余核心入口同级覆盖，不得留在抽样层。
- **Batch C1（8 个，承诺）** — 大闭包包与具 mutation/外部副作用的包：`spec-project-rules`、`spec-app-consistency-audit`（L）、`spec-sweep`（M）、`spec-commit`、`spec-commit-push-pr`、`spec-worktree`、`spec-dogfood`、`spec-test-browser`（S）。选入理由分别是闭包体积最大（前两个）与涉及 git mutation、外部源写入或浏览器执行（其余六个）。
- **Batch C2（14 个，本轮 `not-run`）** — `spec-optimize`、`autoresearch`、`spec-write-skill`、`spec-compound-refresh`、`spec-polish`（M），`spec-simplify-code`、`spec-explain`、`spec-prototype`、`spec-riffrec-feedback-analysis`、`spec-product-pulse`、`spec-strategy`、`spec-rule-miner`、`spec-promote`、`spec-test-xcode`（S）。计划期即写入 `status: not-run` + `reason_codes: [budget_out_of_scope_this_run]` receipt，并记录重评条件：该包被后续变更触及、被升级为强制路由入口、或获得额外预算授权。这是显式的覆盖裁定，不是执行失败。

按 registry `entry_surface` 交叉核对（起草时实测，执行时按冻结 inventory 复核）：Batch A/B 合计 16 个入口 = 11 个
`workflow_command` + 5 个 `standalone_skill`；Batch C1/C2 合计 22 个 = 6 个 `workflow_command` + 12 个
`standalone_skill` + 4 个 `internal_only`。全集 = 17 `workflow_command` + 17 `standalone_skill` +
4 `internal_only` = 38。入口类型与风险等级分别记录，批次名称不降低 workflow 覆盖要求。

每个 Skill 是独立 receipt 单位：完成一个即落盘。承诺包必须达到最低语义覆盖；若某个承诺包在自身预算
内无法达到，写入 `degraded` receipt 并记录已检查范围、未覆盖分支与恢复点，同时在 findings 中登记
为覆盖缺口——不得靠削减方法把它记成 `passed`，也不得把它静默换成 Batch C2 的包。`adaf9093` 触及的
高变更 surface（runtime-setup workspace、peer-runner、CE localization ledger、mcp-setup 测试面）在其
所属批次内优先审查。U5 对 16 个核心 workflow/入口复用已就绪的 U9 Batch A/B dependency closure，
不重复深挖；相关 receipt 未就绪时只能报告跨 Skill 结论 `not-run`。

容量参考（计划估算，非承诺）：U1 约 1–1.5 小时（含 worktree 建立与双快照）；U2 约 1–2（含命令实跑
等待）；U3 约 2–3；U4 约 2–3；U9 承诺子集约 15–22（A 约 4–6、B 约 7–10、C1 约 4–6，按上表单包预算
累加）；U5 约 2–3；U7 约 1–1.5；U10 约 2–4；U11 约 1.5–2.5。不含条件波次合计约 28–43 小时；U6 另加
约 2–4；U8 视授权另估。这一总量显著高于本方案 v2 初稿的估算，差异来自按闭包体积而不是按批次名称
定价——初稿把三个 L 档包放在 2 小时的 pilot 预算内。跨 session 执行时按批冻结进度。

## Implementation Units

### U1. Establish isolated run environment, manifest and safety envelope

- **Goal:** 建立与主 checkout 分离的一次性执行环境，并冻结可复现 source identity、closure 档位、运行环境、动态宿主、授权和禁止动作清单。
- **Files / sources:** `src/cli/adapters/index.js`, `package.json`, `AGENTS.md`, `.gitignore`, `docs/10-prompt/结构化项目角色契约.md`, `docs/contracts/source-runtime-customization-boundary.md`, `docs/contracts/verification/ce-setup-snapshot.schema.json`, `skills/spec-work/scripts/working-tree-fingerprint.cjs`, `src/cli/contracts/dual-host-governance/skills-governance.json`。
- **Method（隔离）:** 在主 checkout 之外用 `git worktree add` 建立一次性审查目录，并把被审 commit 固定为 `git rev-parse HEAD` 的当次解析值；run manifest 记录 worktree 路径、被审 commit、创建时间和移除责任人。此后全部读写发生在该 worktree 内：`npm install`/`npm test` 派生物、`.spec-first/audits/<run-id>/` 产物、临时目录都不进入主 checkout 的 `git status`。主 checkout 在本轮内为只读参照，不接收任何审查写入。
- **Method（source identity）:** 分两层记录，不互相替代。
  - **整树指纹：** 直接运行现有 `working-tree-fingerprint.cjs`，取其单一整树哈希作为「审查开始时这个 worktree 的完整身份」。该脚本不接受路径或排除参数，输出覆盖 HEAD、全量 `status`、全量 tracked diff 与全部未忽略的未跟踪文件，因此它**不能**充当 canonical source snapshot——审查自己写出的 `docs/validation/full-system-audit/<run-id>-report.md` 位于被跟踪的 `docs/` 下、不被忽略规则挡住，运行后重采必然改变该哈希。
  - **canonical source snapshot：** 由本单元新增一层薄 glue 生成——按 `AGENTS.md` 列举的 canonical source roots 逐根执行 `git status --porcelain -- <root>` 并计算逐根内容哈希，`excluded_run_outputs` 显式列出 `.spec-first/audits/**`、run 临时目录与 `docs/validation/full-system-audit/**`。按 KTD4，这是审查产物内允许的汇总 glue，不是新的领域真相层；它只负责把「源码是否变了」与「审查是否写过东西」分开，不重新实现指纹脚本已覆盖的整树身份。
  - 运行前后各采集一次 canonical source snapshot。**只有 canonical source snapshot 或宿主集合变化才触发停止并重新冻结**；整树指纹变化若能完全归因于 `excluded_run_outputs`，记录为预期变化，不触发停止。
- **Method（环境与 inventory）:** 记录 Node/npm、CLI version、`getSupportedPlatforms()`、工具/授权状态；同时实测并冻结 38 个 canonical Skill 的依赖闭包档位（文件数与正文规模），作为 U9 单包预算的输入。
- **Method（脱敏）:** 脱敏门按 R22 与其他出口同等对待。
  - 覆盖范围是全部 artifact 类别，不止 raw log：check receipt、Skill receipt、gate/positioning matrix、finding ledger 和 canonical report 在落盘前都过同一确定性 secret/credential 扫描。
  - **负例证据必备：** 在扫描器上跑一条植入式 canary——构造一份含已知假凭证的样本，确认扫描器拦下它并且原始内容未落盘。没有这条负例证据时，脱敏门的 enforcement level 记 `loud-convention` 而不是 `hard-enforced`，并在 limitations 中显式声明；「扫描通过」本身不构成脱敏已强制的证据。
  - **禁止原样落盘的来源：** 宿主 runtime 配置（各宿主 MCP/settings 文件）、环境变量导出、`doctor` 的完整 JSON 输出，以及 U8 真实宿主/真实任务波次的命令输出，一律不得原样写入 receipt 或 log；只记录结构化事实（键名、存在性、readiness 状态、reason code），值一侧按需哈希或省略。
  - 审查 envelope 使用 `redaction_status=passed|none-required`，映射既有 verification receipt 时保留其 `redacted|none-required` 原值，任何不满足对应合同的状态都不持久化原始日志。
- **Test scenarios:** dirty tree、detached HEAD、worktree 创建失败或路径已存在、缺失 optional tool、日志疑似含凭证、canary 未被拦下、只有 `excluded_run_outputs` 变化、canonical source 真实变化、宿主枚举变化。
- **Exit:** manifest 可回源；整树指纹与 canonical source snapshot 分开记录且各自的变化语义明确；closure 档位已冻结；脱敏门的 enforcement level 与 canary 负例结果已记录。任何隔离失败（worktree 未建立、写入落到主 checkout）或脱敏失败阻断后续会产生持久 artifact 的波次。V1 按 R4/R6 分别记录 `record_validity` 与 `mechanism_result`。

### U2. Establish deterministic baseline and package floor

- **Goal:** 判断当前 source 能否通过语法、Skill entrypoint、主测试链、build 和临时 prefix 安装。
- **Files / sources:** `scripts/run-test-suite.cjs`, `scripts/npm-install-matrix-smoke.cjs`, `scripts/sync-shared-references.js`, `scripts/sync-instruction-files.js`, `package.json`, `tests/unit`, `tests/smoke`, `tests/integration`。
- **Method:** 顺序运行 `npm run typecheck`、`npm run lint:skill-entrypoints`、`npm run check:shared-references`、`npm run sync:instructions`、`npm test`、`npm run build`、`node scripts/npm-install-matrix-smoke.cjs`；每条命令绑定唯一 check ID、超时、终止/残留进程检查、真实 exit code、脱敏日志和 reason code。
- **确定性漂移检查纳入地板的理由：** `check:shared-references` 校验 `skills/_shared/references/**` 与各 Skill 内副本是否一致，`sync:instructions` 校验 `AGENTS.md` 治理区与 `CLAUDE.md` 手写区的派生一致性；两者都以非零 exit code 报告漂移。按 KTD4，这类事实必须由脚本判定后交给 U7，而不是由 U7 逐条读文档近似——U7 的语义工作应集中在这两个脚本不覆盖的 load-bearing claim（宿主数量、历史结论、freshness）。两条命令均为只读校验模式，不得在审查中运行它们的写入形态（`node scripts/sync-shared-references.js` 无 `--check`、`npm run sync:instructions` 加 write 参数），否则构成 R3 禁止的 source 修复。
- **不重复拆跑的边界：** `npm test` 即 `run-test-suite.cjs all`，等于 `tests/unit` 全目录 + `tests/smoke/cli-smoke.test.js` + `tests/integration/**`，故不再单独拆跑 `test:unit`/`test:smoke`/`test:integration`。`npm run test:mcp-setup` 的全部路径都在 `tests/unit/` 下且运行参数相同，因此它是 `npm test` 的严格子集，本轮**不**作为独立 check——把它记成单独 receipt 会让读者误以为 Runtime Setup 获得了基线之外的独立验证。Runtime Setup 的独立结论由 U9 Batch A 的 `spec-runtime-setup` receipt 承担。
- **Test scenarios:** command missing、declared test path missing、timeout、package install/shim failure、baseline partial failure、shared-reference 漂移（起草时已实测为 `failed`，见 Evidence & Limitations）、治理区派生漂移。
- **Exit:** baseline failure 不回填修复；继续 read-only review，但阻断依赖 green baseline 的高层 claim。V2 另分开记录 `record_validity`（命令是否有完整、可回源 receipt）与 `mechanism_result`（必检命令和关键负例是否达到通过条件），前者通过不等于后者通过。

### U3. Audit eight-host projection and ownership lifecycle

- **Goal:** 以动态宿主全集验证 init/doctor/clean、package projection、drift、re-init、user-owned collision 和不触碰 git index。
- **Files / sources:** `src/cli/adapters/**`, `src/cli/plugin*.js`, `src/cli/commands/init*.js`, `src/cli/commands/doctor.js`, `tests/integration/init-six-host-lifecycle.integration.test.js`, `tests/integration/doc-review-six-host-projection.integration.test.js`, `tests/unit/host-enumeration-drift-guard.test.js`。
- **Method:** 复用现有临时 project/home harness；不把测试文件名中的 “six-host” 当成覆盖结论，先核对其实际枚举。
- **与 U9 的分工：** U3 以**宿主**为单位，审查 init/doctor/clean 的生命周期行为、managed 边界与 drift 处理，结论落在「这个宿主的投射与所有权是否正确」。U9 的 host projection parity 以**Skill**为单位，只比对单个包的入口、description、mode、mutation policy、internal-only 标记和 reference 可达性在各宿主投影中是否一致，结论落在「这个包的投影是否忠实」。两者都不得把投影一致升级为 loader 发现或 workflow invocation 通过。同一事实被两边观察到时，以宿主为单位的生命周期证据归 U3，以包为单位的 parity 证据归 U9，U11 校验两侧不产生互相矛盾的结论。
- **Test scenarios:** 8 宿主 projection、preview host、missing/drifted asset、re-init、clean 保留非 managed 文件、packed tarball 与 checkout 行为差异。
- **Exit:** 每个宿主分别给 projection/loader/workflow 三层结果；任一层缺证据保持 `degraded` 或 `not-run`。

### U4. Map five exit gates and script/LLM ownership

- **Goal:** 为 mutation、verification、source/runtime、handoff/context reset、knowledge promotion 建立 owner→enforcement→consumer→negative evidence 矩阵。
- **Files / sources:** `docs/contracts/governance/**`, `docs/contracts/verification/**`, `docs/contracts/workflows/**`, `skills/spec-work/**`, `skills/spec-code-review/**`, `skills/spec-handoff/**`, `skills/spec-compound/**`。
- **Method:** 先做脚本 inventory，再抽取高风险 mutation/process/schema/credential 样本做语义审查；关键词只用于排序，不自动产生 finding。
- **Coverage rule:** 脚本 inventory 全量执行；涉及 mutation、verification、source/runtime、handoff 或 knowledge promotion 的 owner 路径全量语义核对；纯 parser/formatter 只做有界抽样，并在 matrix 中记录分母、样本和排除理由。
- **Test scenarios:** dangling verification evidence、缺 freshness/limitations、未知 provider、路径越界、promotion 缺 `source_refs`/`invalidation_condition`、宿主只能 loud convention 的出口。
- **Exit:** 每个 gate 有 enforcement level 和 limitation；文案 MUST 不得直接计为 hard-enforced。

### U5. Review core workflow semantics from current source

- **Goal:** 审查 `using-spec-first`、`spec-ideate`、`spec-brainstorm`、`spec-prd`、`spec-plan`、`spec-write-tasks`、`spec-work`、`spec-code-review`、`spec-doc-review`、`spec-debug`、`spec-resolve-pr-feedback`、`spec-pov`、`spec-lfg`、`spec-handoff`、`spec-compound`、`spec-runtime-setup` 共 16 个核心 workflow/入口的边界、消费者和降级语义；其中 `using-spec-first`、`spec-lfg`、`spec-handoff`、`spec-resolve-pr-feedback`、`spec-pov` 按 registry 的 `standalone_skill` 类型单列（5 个），其余 11 个按 `workflow_command` 处理。
- **纳入 16 个的判据：** 除 workflow 生命周期主链外，必须覆盖 `AGENTS.md` 入口硬规则点名的全部强制路由入口——存在失败/回归/报错/修复意图时必须进入 `spec-debug`（此类信号下不得走 Direct Lane）；处理 GitHub PR review 反馈必须进入 `spec-resolve-pr-feedback`；外部技术采用裁决必须进入 `spec-pov`；一条龙到绿 PR 进入 `spec-lfg`；跨会话交接进入 `spec-handoff`。这三个此前未列入的入口（`spec-debug`、`spec-resolve-pr-feedback`、`spec-pov`）承载最高频的误路由风险，而本单元的 test scenario 之一正是 Direct Lane 误路由；把它们留在抽样层会使该 scenario 无法被评估。
- **Files / sources:** 各 `skills/<name>/SKILL.md`、references、`templates/**`（各宿主 command/skill 模板）、对应 `tests/unit/**` 与 `docs/contracts/workflows/**`。
- **Method:** 对每个 workflow 使用同一 lens：WHAT/HOW owner、mutation/worker/external authorization、script/LLM boundary、reason code/fallback、summary-first handoff、公开入口合法性。
- **与 U9 的分工：** U5 只负责跨 workflow/入口语义（边界、授权、降级、consumer、公开入口合法性）与跨 Skill 链路、handoff、closeout；单包内部路径完整性由 U9 receipt 承载，不重复包内分支核对。对 16 个核心 workflow/入口，U5 仅消费已就绪的 U9 Batch A/B dependency closure 与分支图；资料可以提前读取，但在对应 receipt 未就绪前不得形成跨 Skill 的 `passed` 或 `completed` 结论——该约束已作为 `U9(Batch A/B) → U5` 固定在执行依赖图中。两单元结论冲突时以分支级 source 证据为准，并将冲突记入 finding ledger。
- **Test scenarios:** Direct Lane 误路由（含失败/报错信号下未进入 `spec-debug`、PR review 反馈未进入 `spec-resolve-pr-feedback`、外部采用裁决未进入 `spec-pov`）、Product Contract 越权改写、plan readiness 假阳性、review apply/report-only 混淆、handoff 缺失字段、knowledge promotion 过度升级。
- **Exit:** 16 个 workflow/入口各自独立出链路结果；普通 source review、contract test、fresh-source eval 分开计数，leaf-level 分支结果统一引用 U9 receipt。

### U9. Audit single-skill internal logic and workflow completeness

- **Goal:** 对每个 canonical Skill 建立逐包、逐分支的内部逻辑审查记录，判断“能被触发”是否真的能沿完整路径得到受约束的输出或诚实停止。
- **Inventory scope:** 以 `src/cli/contracts/dual-host-governance/skills-governance.json` 和 38 个 `skills/*/SKILL.md` canonical package 为准，排除 `*-workspace`、eval fixture 和 generated runtime mirror；先生成带 `source_snapshot`/`inventory_sha256` 的 inventory，再递归纳入每个包被引用的 `references/`、`scripts/`、`schemas/`、`templates/`、`tests/` 与实际 consumer。
- **Entry contract:** 检查 frontmatter `name`/`description`、public/internal surface、positive trigger、negative trigger、near-neighbor 路由、用户显式调用边界、host delivery 与命名是否一致。
- **Flow graph:** 从入口开始绘制 `input -> preflight -> branch -> reference/script/tool -> artifact/output -> verification -> handoff/closeout`；每个分支标注 guard、owner、读写权限、预期产物和失败出口，识别不可达分支、隐式 fall-through、重复决策和循环无退出条件。
- **Completeness lens:** 逐项核对 happy path、边界输入、无输入/缺文件、工具缺失、Provider degraded、超时/中断、验证失败、权限不足、用户拒绝、部分成功、恢复/重试、停止条件和最终 done signal；不能只检查文档中是否出现 `MUST` 或“已完成”。
- **Reference closure:** 对每个条件 reference 记录读取条件与它支持的判断；检查 body 与 reference 是否重复拥有 gate、是否存在孤儿 reference、路径/anchor/schema/script 是否可达、脚本事实是否被 LLM 语义判断正确消费。
- **Artifact and consumer closure:** 核对输出字段、schema/hash/freshness/limitations、写入 owner、下游 consumer 和 source/runtime 边界；区分 writer 通过、consumer 接受、宿主发现和真实任务效果。
- **Host projection parity:** 将 source Skill 的入口、description、mode、mutation policy、internal-only 标记和 reference 可达性与各宿主 projection 对照；投影一致不升级为 loader/invocation 通过。
- **Test scenarios:** 每个**承诺覆盖**的 Skill（Batch A/B/C1，共 24 个）至少完成同一套最低语义覆盖：入口与正例、near-neighbor/负例、主要输出/consumer、一个关键错误或停止路径；workflow/high-risk Skill 在此基础上必须覆盖降级、恢复、跨阶段 handoff/closeout；standalone Skill 至少覆盖一条关键错误路径；internal Skill 必须覆盖不可公开触发、consumer 输入和停止路径。风险抽样只用于额外脚本、深层 reference 或运行场景，不得替代上述最低覆盖；receipt 必须记录抽样分母、覆盖率和预算。测试缺失记录为 coverage gap，不凭 prose 自评补齐。Batch C2 的 14 个包本轮不执行上述覆盖，只落 `not-run` receipt 与重评条件，不做浅覆盖。
- **Receipt shape:**
  ```yaml
  schema_version: audit-skill-receipt/v1
  artifact_type: single-skill-logic-receipt
  run_id: <run-id>
  generated_at: <iso-time>
  skill_name: spec-example
  source_paths: [skills/spec-example/SKILL.md]
  source_snapshot: <source-snapshot-ref>
  source_hashes: {"skills/spec-example/SKILL.md": "sha256:..."}
  inventory_ref: docs/validation/ce-localization/skill-inventory.json
  inventory_sha256: "sha256:..."
  entry_surface: workflow_command|standalone_skill|internal_only
  batch: A|B|C1|C2
  closure_tier: L|M|S
  closure_observed: {"files": 47, "bytes": 226494}
  coverage_commitment: committed|planned-not-run
  dependency_closure: confirmed|partial|unknown
  status: passed|failed|degraded|not-run|blocked
  reason_codes: []
  command_or_method: ["exact command or semantic method"]
  ran: true
  exit_code: 0
  evidence_paths: [".spec-first/audits/full-system/<run-id>/logs/...", "source/path:line"]
  source_refs: ["repo-relative source/contract path"]
  owner: "canonical source owner"
  consumers: ["downstream consumer"]
  branches:
    - id: B1
      trigger: "observable condition"
      owner: "skill or referenced asset"
      expected_output: "artifact or stop reason"
      negative_paths: [missing_input, verification_failed]
      status: passed|failed|degraded|not-run|blocked
      reason_code: branch-complete|branch-not-run
  findings: []
  fresh_source_eval: passed|concerns|not-run
  claim_ceiling: C0|C1  # C2/C3 只能经 U8 波次升级，receipt 不预支
  limitations: []
  ```
- **Budget/owner:** 每个 Skill receipt 记录 `closure_tier` 对应的包级预算、实际耗时、抽样分母/覆盖率、已检查分支、未覆盖分支、恢复点和最终 owner；达到单包或总预算、连续无新证据或 source 变化时停止。已经完成最低覆盖的 Skill 立即写入最终 receipt；承诺包未完成最低覆盖时写入 `degraded` receipt，明确 `reason_codes`、未覆盖分支和恢复点，并在 finding ledger 登记为覆盖缺口，不等待整批结束，也不把已完成包回滚为批次级未记录。Batch A 完成后必须用实测耗时回校 L/M/S 单包预算；若实测显著高于表中区间，先调整 Batch C1 的承诺范围并记录调整理由，而不是压缩单包方法。
- **Exit:** 38 个 canonical Skill 均有独立 receipt：24 个承诺包给出 `passed|failed|degraded` 终态，14 个 Batch C2 包给出 `not-run` + `budget_out_of_scope_this_run` + 重评条件。发现的逻辑缺口按 Skill、分支和 consumer 定位，不能用“核心 workflow 通过”整体覆盖；`not-run` 的 14 个包在 canonical report 中单独成节，不与承诺包的通过结论混排。

receipt 的 `status`、`reason_codes`、`evidence_paths` 和 `claim_ceiling` 必须先通过结构校验，再由 U11 汇总；`fresh_source_eval=not-run` 必须携带 `dispatch_authorization_missing` 或等价 reason code。单 Skill receipt 只描述本包逻辑，不替代现有 inventory、scenario、baseline artifact。

### U10. Audit product positioning and adoption viability

- **Goal:** 验证产品定位是否从项目使命落到明确用户、具体任务、可感知 outcome、可解释差异化和可持续采用路径。
- **Positioning card:** 为每个候选 segment 记录 `primary_user`、`anti_persona`、Job-to-be-Done、触发时机、输入、替代方式、首个 outcome、长期 outcome、成功指标、baseline、反指标、证据状态和 claim ceiling，并记录决策来源、确认时间、owner、被拒绝替代方案和 invalidation condition；没有直接用户或 field 证据的字段标为 `hypothesis`。
- **Wedge and alternatives:** 对照宿主原生 workflow、手工 spec/SDLC、CI/review 工具、issue/project tracker、knowledge base、自建脚本和其他 AI coding harness，区分直接替代、互补、集成依赖和项目不应拥有的能力。
- **Journey:** 追踪 `discover -> install -> init -> first workflow -> first trusted change -> repeat use -> team handoff -> knowledge reuse`；记录每步的用户动作、等待/学习成本、失败点、证据产物和退出原因。
- **Value and economics:** 复用 `field-validation-protocol.schema.json` 的 cohort、配对、复杂度、排除和预注册字段，并复用 `baseline.schema.json` 的结构化 metric 形状；分别定义 time-to-trusted-change、质量/回归、人工介入、返工、token/compute、setup/maintenance、host/provider 等待和治理成本的 metric owner、分子/分母、measurement window、noise floor、missing-data policy、baseline 和 decision rule；同时记录“为获得证据而增加的审查负担”这一反指标。
- **Segment fit:** 至少区分个人开发者、小团队、平台/基础设施团队和受监管组织；检查其权限、隐私、审计、集成、审批和购买/推广条件，不把一个 segment 的结果外推到其他 segment。
- **Adoption and lifecycle:** 检查是否存在 recurring trigger、跨任务复用、跨会话/跨宿主 handoff、知识复利、升级/迁移和能力退役路径；对每项能力应用 Adopt/Experiment/Wrap/Build/Thin/Retire 判定，并为每个判定写明证据门槛、默认/preview 边界、反指标和退出触发器，避免功能增长替代产品聚焦。
- **Evidence status:** 外部市场/竞品资料、用户访谈和 provider 自述只作 advisory；进入定位结论前必须有当前 owner、来源、时间、适用范围、反证和 invalidation condition。未获得外部研究授权时只输出本地 source-grounded hypothesis，不声称市场事实。
- **Exit:** 交付一张定位与证据矩阵、一个首要 wedge、一个 anti-persona、一个 activation/retention 路径和一个指标/反指标集合；无法回答“谁在什么时刻为什么选择它”时，定位保持 `hypothesis`，不得进入推广或默认路径决策。

### U11. Synthesize audit closeout and handoff

- **Goal:** 将 V1–V10 的结构化结果汇总为唯一 canonical report，确保所有 check 有终态、所有 finding 可回源、所有 claim ceiling 与证据一致。
- **Depends on:** U2、U3、U4、U5、U6、U7、U8、U9、U10。
- **Method:** 校验 manifest、check receipts、Skill receipts、gate matrix、positioning matrix 和 finding ledger 的 `run_id`/`source_snapshot` 一致性；拒绝缺失 evidence path、未脱敏 artifact、未声明 reason code 或超出 ceiling 的结论。
- **Method（状态词表分离）:** 报告使用两套互不替代的词表，禁止混排。
  - **运行状态**（适用于 check、receipt、gate、Skill 包）：`passed|failed|degraded|not-run|blocked`。收口汇总必须给出这五个桶各自的数量与清单，五个桶都不得省略。
  - **证据状态**（仅适用于 finding ledger 的 `evidence_status`）：`confirmed|advisory|degraded`。`confirmed` 只表示某条 finding 的证据被确认，不表示任何 check 或机制通过，也不作为运行状态桶名出现在覆盖矩阵中。
  - 在这两套之上，V1/V2/U11 另各自记录 `record_validity` 与 `mechanism_result`，并在报告中分列；`record_validity=passed` 只说明 receipt 完整可回源，不推导 `mechanism_result`。
  - 整轮生命周期状态 `incomplete|completed-with-findings` 只出现在报告头部，不回填到任何单项 receipt。
- **Report skeleton:** (1) Executive verdict 与本轮 claim ceiling；(2) run manifest 摘要（含 worktree 隔离、被审 commit、脱敏 canary 结果）；(3) 层级覆盖矩阵（L0–L3 各 check 的五态终态与未执行原因）；(4) 五类 gate matrix；(5) 八宿主 projection/loader/workflow 分层矩阵；(6) 16 个核心 workflow/入口语义结论（按 registry entry_surface 分层）；(7) 24 个承诺 Skill receipt 汇总与缺口定位（含 closure 档位与抽样覆盖率）；(7b) 14 个计划期 `not-run` Skill 及其重评条件，单独成节；(8) 定位与采用证据矩阵；(9) D/J/C 波次结果；(10) findings ledger（含 `evidence_status`）；(11) residual risks、limitations 与 re-evaluate conditions；(12) 修复 handoff 与 recommended next action。
- **Verdict ladder:** `mechanism qualified` = C0/C1 证据通过，且 V1/V2 的 `record_validity=passed`、必检命令与关键负例的 `mechanism_result=passed`，五类 gate 无未说明的 `missing`，degraded 路径均有 reason code 与 fallback；仅有完整 receipt 或失败被如实记录不能升级为机制通过。`field journey qualified` = 至少 J1 在真实任务、隔离 worktree 与真实 verifier 下达到 C3，且无 unsupported completion claim 或未授权 mutation；`incremental value qualified` = 至少一个预注册 comparator 支持 C4。任一级证据缺失时该级显式记「未验证」，不得以下一级通过替代。
- **Exit:** 生成 `docs/validation/full-system-audit/<run-id>-report.md` 与对应 `findings.json`；只有 V11 通过才允许将本轮标记为 `completed-with-findings`，否则保持 `incomplete`。V11 通过只表示审查记录和引用闭包有效，不自动把 `mechanism_result`、field outcome 或 incremental value 提升为通过。

### U6. Run controlled degradation journeys

- **Applicability:** 条件波次。按 KTD6，只有 L0–L2（U1–U4 与 U5/U9/U10 的关键安全边界）出口条件通过后才展开；未展开时按 `not-run` + reason code 记录，不以「本轮包含」为由强行执行。
- **Goal:** 在 disposable project/worktree 中验证机制 failure path，不污染审查 worktree 与主 checkout。
- **Journeys:** D1 source/runtime drift；D2 verification failure；D3 missing/unknown provider；D4 stale advisory graph；D5 incomplete handoff；D6 identity mismatch/lease recovery（仅复用已有 fixture，不修改生产语义）。
- **Evidence:** 每个 journey 记录输入、授权、预期 reason code、直接日志、前后状态、claim ceiling 和未覆盖项。
- **Exit:** D 场景最多支持 C1；任何成功 fixture 不得升级为真实宿主或 field outcome。

### U7. Reconcile historical evidence and current documentation

- **Goal:** 复核旧 audit reports、CE localization/reconciliation、runtime catalog、README/contract 中的 source identity、宿主数量、status 和 supersession。
- **Files / sources:** `docs/validation/2026-08-01-full-system-audit-*.md`, `docs/validation/ce-localization/**`, `docs/catalog/runtime-capabilities.md`, `README.md`, `README.zh-CN.md`, `README.en.md`, `docs/contracts/dual-host-governance/README.md`。
- **Method:** 对每条 load-bearing claim 检查 source ref 是否存在、是否跨 HEAD、是否具备 freshness/invalidation；stale reference 只标记为 advisory，不悄悄纠正历史文件。
- **Exit:** 输出 current/stale/unknown 分类，不能把旧六宿主文字自动判成代码缺陷，也不能把当前 8 宿主代码自动判成 docs 已同步。

### U8. Optional live host, field task, and comparator waves

- **Goal:** 在取得独立授权后补齐 C2/C3/C4 证据；没有输入时保持 not-run。
- **J wave:** J1 小型真实 bugfix，J2 中型真实功能，J3 长时复杂重构；每个 wave 先冻结 acceptance、worktree、paths、预算、停止条件、验证器和恢复点。
- **C2:** exact host/version/config 的 discovery→invocation receipt；不得由另一个宿主或 catalog 代替。
- **C3:** 真实任务 diff、review、verification、人工介入与 claim-scoped closeout；必须有 disposable worktree。
- **C4:** 预注册 comparator、同难度任务和统一指标；无 comparator 只报告 C3，不报告增量价值。
- **Exit:** 上一 wave 未通过不自动扩大；外部权限、凭证或真实写入结果不明时立即停止并记录 blocker。

## Verification Contract

| Check | Applicability | Evidence | Pass condition |
| --- | --- | --- | --- |
| V1 manifest | always | run manifest + 整树指纹 + canonical source snapshot + redaction canary receipt | worktree 隔离成立（无写入落到主 checkout）；source identity、dirty scope、授权、环境、closure 档位完整可回源；整树指纹与 canonical source snapshot 分列且变化语义明确；脱敏 canary 负例已记录。`record_validity` 与 `mechanism_result` 分开，前者通过不等于后者通过 |
| V2 baseline | always | command receipts + command logs + exit codes | 每条实际运行命令有终态、超时/终止记录和脱敏状态；失败项不被隐藏；`record_validity` 与 `mechanism_result` 分开，不能以 receipt 完整替代命令通过 |
| V3 host coverage | always | dynamic host list + per-host receipts | 当前全集逐项覆盖，projection/loader/invocation 分层 |
| V4 gate matrix | always | five-gate matrix + negative evidence | owner、consumer、enforcement、limitation 完整 |
| V5 semantic review | always | workflow/entry rows + source refs + contract results | 16 个核心 workflow/入口各有独立结论，含 `AGENTS.md` 点名的全部强制路由入口；按 registry entry_surface 分层，不冒充独立 reviewer；对应 U9 Batch A/B receipt 未就绪时该行只能是 `not-run` |
| V9 single-skill logic | always | one receipt per canonical Skill + dependency closure + closure tier | 38 个包各有 receipt：24 个承诺包的入口、分支、引用、输出、错误/停止/恢复和 consumer 路径均有结论，14 个 `not-run` 包带 reason code 与重评条件；承诺包不得以浅覆盖记 `passed`，缺口不被总评掩盖 |
| V10 positioning and value | always | positioning card + alternative map + activation/retention evidence | 用户、任务、差异化、成本、采用、baseline、metric contract 和证据上限完整；无 field evidence 时只能是 hypothesis/not-run |
| V6 controlled journeys | mechanism wave | D receipts | disposable 隔离、预期 reason code、C1 ceiling 明确 |
| V7 history freshness | always | stale/current ledger | 历史 claim 按 source/freshness 重新分类 |
| V8 live/field/comparator | optional | C2/C3/C4 receipts | 仅在授权、版本、真实任务和 comparator 完整时升级 claim |
| V11 closeout | always | manifest/receipt consistency + canonical report + finding ledger | 所有计划 check 有终态，artifact 的 `run_id`/snapshot 一致，finding 可回源，未执行项带 reason code，报告不超出 claim ceiling |

建议命令（执行时以 U1 冻结的当前 source 和实际存在路径为准）：

```bash
# U1：建立一次性 worktree 并冻结身份（在主 checkout 中执行第一条，其余在 worktree 内）
git worktree add ../spec-first-audit-<run-id> HEAD
git rev-parse HEAD
git status --short
node --version
npm --version
node bin/spec-first.js --version
git diff --check
node -e "console.log(require('./src/cli/adapters').getSupportedPlatforms())"
node skills/spec-work/scripts/working-tree-fingerprint.cjs   # 整树身份，非 canonical source snapshot

# U2：确定性地板
npm run typecheck
npm run lint:skill-entrypoints
npm run check:shared-references
npm run sync:instructions
npm test
npm run build
node scripts/npm-install-matrix-smoke.cjs
# 不单列：npm run test:mcp-setup（路径全在 tests/unit/ 下，是 npm test 的严格子集）

# U11 收口后：把报告带回主 checkout 再移除 worktree
git worktree remove ../spec-first-audit-<run-id>
```

定向 Jest 必须使用 `npm run test:jest -- --runTestsByPath ... --runInBand`，不能把路径追加到固定运行全量 `tests/unit` 的 `npm run test:unit` 后面。执行清单由 U2/U3/U4 根据当前存在的测试路径生成，避免沿用已重命名的六宿主假设。

## Risks and Dependencies

| 风险/依赖 | 影响 | 处理与停止条件 |
| --- | --- | --- |
| 被审工作树持续变化 | receipt 不能回源到同一 source | 在一次性 worktree 中按具名 commit 执行；U1 每个波次前后重采集 canonical source snapshot；canonical source 或宿主集合变化即停止受影响波次并新建 run |
| 审查自身写入被误判为源码漂移 | 「变化即停止」被自身产物触发，导致反复重新冻结或悄悄跳过该门 | canonical source snapshot 显式排除 `excluded_run_outputs`（audit 产物、run 临时目录、`docs/validation/full-system-audit/**`）；整树指纹变化若可完全归因于这些路径，记为预期变化 |
| secret/credential 出现在 artifact | 造成审查 artifact 泄露 | 全部 artifact 类别（log/receipt/matrix/ledger/report）先扫描再落盘；宿主配置、环境变量导出、`doctor` 完整 JSON 与 U8 命令输出不得原样写入；扫描失败只保留 reason code |
| 脱敏扫描器漏报 | 「扫描通过」掩盖真实泄露，且此后无检测手段 | 脱敏门必须提供植入式 canary 负例证据；缺该证据时 enforcement level 记 `loud-convention` 并写入 limitations，不记 `hard-enforced` |
| 审查产物落在被忽略路径 | 报告读者无法回源，复验只能靠信任 | canonical report 内联承重 receipt 事实（check ID、终态、exit code、reason code、证据摘录）；只给本机路径的结论记 `evidence_status: degraded` |
| worker dispatch、真实宿主、真实任务或 comparator 未授权/不可用 | C2–C4 无法成立 | 记录 `not-run`/`blocked`，不把 inline review 或 fixture 升级为独立/现场证据 |
| 38 个 Skill 审查规模过大 | 产生浅覆盖或无限运行 | 按 KTD8 在计划期裁定 24 承诺 + 14 `not-run`；单包预算按 closure 档位定价；Batch A 实测后回校预算，超出时缩小 C1 承诺范围而不是压缩单包方法 |
| 历史文档与当前宿主集合漂移 | 误报或漏报 host coverage | U7 建立 source/contract/catalog/lifecycle reconciliation 行，逐项标 `current/stale/unknown` |
| 产品指标缺少 baseline 或 field cohort | 只能形成定位假设 | V10 保持 `hypothesis/not-run`；不得进入推广、默认路径或 C4 结论 |

U2 的每条命令、U6 的每个 degradation journey、U8 的每个 field wave 和 U9 的每个 Skill 都必须声明预算、停止条件、恢复点和最终 owner；没有这些字段的条目不能进入 `passed`。

## Definition of Done

- [ ] 审查在一次性 worktree 中执行；主 checkout 未接收任何审查写入；worktree 生命周期与移除责任人已登记。
- [ ] run manifest 绑定被审 commit、整树指纹、canonical source snapshot（含 `excluded_run_outputs`）、closure 档位、动态宿主、环境、授权和脱敏结果。
- [ ] 脱敏覆盖全部 artifact 类别，并有植入式 canary 负例证据；缺该证据时已按 `loud-convention` 降级声明。
- [ ] canonical report 内联每条承重结论的 receipt 事实；只给本机路径的结论已记 `evidence_status: degraded`；产物保留或删除决定已登记。
- [ ] 所有 run artifact 符合 `full-system-audit/v1` envelope，绑定同一 `run_id`、canonical source snapshot（含 `excluded_run_outputs`）、producer、consumer 和 schema version；已有领域合同只作为被引用的证据，不被错误套用为审查 envelope 校验器。
- [ ] C0–C4 claim ceiling 与 Appendix `Product evidence axes` 已映射到各单元/波次；每条计划 check 全部有 `passed|failed|degraded|not-run|blocked`，无空白项。
- [ ] 八宿主 projection 与 ownership 逐项覆盖；loader 和 workflow invocation 未验证项保持独立限制。
- [ ] 五类 gate 均有 source owner、consumer、negative evidence、enforcement level 和 limitation。
- [ ] 16 个核心 workflow/入口逐个完成 current-source review，含 `AGENTS.md` 点名的全部强制路由入口；独立 fresh-source eval 的授权与实际状态单列。
- [ ] 24 个承诺 Skill 均有独立内部逻辑与流程完整性 receipt，包含最低语义覆盖；14 个 Batch C2 包有计划期 `not-run` receipt 与重评条件；额外脚本/reference/运行场景抽样单独记录，不能替代最低覆盖。
- [ ] workflow Skill 的阶段 handoff/closeout 与 standalone/internal Skill 的公开边界分别验证；不能以同一套总评替代不同 contract。
- [ ] 每个 Skill 的缺陷均能定位到 source body、reference、script/schema/test 或 consumer；孤儿资源、不可达分支和未声明失败出口均单列。
- [ ] 产品定位审查交付 primary user、anti-persona、Job-to-be-Done、替代方式、差异化 wedge、activation/retention 路径和成本/反指标。
- [ ] 结构、行为、runtime cost、field outcome、相对增量价值五类证据分别记录；每个 metric 有 baseline、分子/分母、窗口、noise floor、missing-data policy 和 decision rule；能力数量、测试通过和 demo 不被当作产品价值。
- [ ] 个人开发者、小团队、平台团队、受监管组织的适用性与未验证项分开；没有用户/市场授权时不伪造外部事实。
- [ ] 每项能力有 Adopt/Experiment/Wrap/Build/Thin/Retire 的证据条件、默认/preview 边界和退出触发器。
- [ ] D 场景只在 L0–L2 出口条件通过后展开，只在 disposable 环境运行，并保留 C1 claim ceiling；未展开时按 `not-run` + reason code 记录。
- [ ] 历史报告、catalog、README、CE ledger 的 stale/current/unknown 状态可回源；旧文件不被静默改写。
- [ ] 每个 P0/P1 finding 有 consequence、direct evidence、owner、minimal fix、validation 和 re-evaluate 条件。
- [ ] C2/C3/C4 只有在对应授权和直接 evidence 齐全时才升级；否则报告 `not-run` 或 `blocked`。
- [ ] U11/V11 完成 manifest、receipts、gate、positioning、finding 和 canonical report 的一致性收口；未通过时本轮保持 `incomplete`。
- [ ] 审查过程没有 source/runtime 修复、全局安装、外发、commit/push/PR 或 knowledge promotion。
- [ ] 运行状态词表（`passed|failed|degraded|not-run|blocked`）、finding 证据状态词表（`confirmed|advisory|degraded`）、`record_validity`/`mechanism_result` 与整轮生命周期状态在报告中分列，未混排；运行状态五个桶均给出数量与清单。
- [ ] canonical report 与后续修复 handoff 路径可访问，报告自身承载复核所需事实；报告明确本轮 claim ceiling 与未完成项，mechanism / field journey / incremental value 三级系统结论按 U11 verdict ladder 给出，证据不足的级别显式记未验证。

## Finding Contract

```yaml
id: F-<number>
run_id: <run-id>
severity: P0|P1|P2|P3
claim_scope: "具体宿主、workflow、gate、artifact 或 field wave"
consequence: "不处理会发生什么"
evidence_status: confirmed|advisory|degraded
direct_evidence:
  - "repo-relative source/test/log path"
evidence_anchors:
  - "path:line or artifact pointer"
root_cause: "LLM judgment，与直接事实分开"
owner: "canonical source owner"
consumer: "受影响的 workflow、报告读者或后续 owner"
proposed_fix: "最小 source-first 修复方向"
validation: "复验命令或语义方法"
re_evaluate_when: "失效条件或重评触发器"
```

严重级别只表达影响，不替代证据强度：P0 为未授权/不可恢复 mutation、凭证泄露、source/runtime corruption 或虚假 verified/ship claim；P1 为核心入口、关键 gate 或 evidence chain 的系统性断裂；P2 为显著增加误解、人工成本或恢复成本的缺口；P3 为不改变可信 claim 的改进项。

## Appendix

### Claim ceiling

| Ceiling | 可声称 | 仍不能声称 |
| --- | --- | --- |
| C0 | 当前 source/contract 的结构事实 | runtime 可加载、任务正确 |
| C1 | CLI、package、projection、隔离机制可运行 | 真实宿主发现、真实任务收益 |
| C2 | 指定版本宿主完成 discovery/invocation | 其他宿主、长期稳定性、业务收益 |
| C3 | 指定真实任务达到约定验收 | 相对增量价值、普遍效果 |
| C4 | 预注册 comparator 支持增量价值结论 | 跨项目普遍推广或永久有效 |

### Product evidence axes

产品定位使用独立于 C0–C4 的证据轴，避免把“定位卡完整”误读为“市场或收益已证实”。

| Axis | 可声称 | 缺失时 |
| --- | --- | --- |
| `structure_contract` | 当前 source、用户确认口径和替代关系已被准确记录 | 保持 `hypothesis` |
| `behavior_quality` | 指定真实任务中首个可信变更和采用路径可观察 | 只能报告机制/任务假设 |
| `runtime_cost` | setup、等待、token、维护和治理成本有可回源测量 | 不得声称成本收益 |
| `field_outcome` | 真实用户/团队 cohort 达到预注册指标 | 保持 `not-run`/`hypothesis` |
| `incremental_value` | 预注册 comparator 支持相对增量结论 | 最高停留在 C3 |

`V10` 的通过只表示证据矩阵和限制完整；它不自动把任一轴提升为 confirmed。

### Reference owners

- `docs/10-prompt/结构化项目角色契约.md`
- `docs/10-prompt/AI-Coding-Harness演化方法论.md`
- `docs/contracts/source-runtime-customization-boundary.md`
- `docs/contracts/context-governance.md`
- `docs/contracts/artifact-summary.md`
- `docs/contracts/verification/verification-run-summary.md`
- `docs/contracts/workflows/fresh-source-eval-checklist.md`
- `docs/contracts/knowledge/knowledge-harness.md`
- `docs/contracts/project-graph-consumption.md`
- `docs/contracts/verification/skill-inventory.schema.json`
- `docs/contracts/verification/skill-scenarios.schema.json`
- `docs/contracts/verification/baseline.schema.json`
- `docs/contracts/verification/field-validation-protocol.schema.json`
- `skills/spec-work/scripts/working-tree-fingerprint.cjs`（整树身份；不提供路径 scoping，不能充当 canonical source snapshot）
- `scripts/sync-shared-references.js`（`--check` 模式：共享 reference 副本一致性）
- `scripts/sync-instruction-files.js`（默认校验模式：`AGENTS.md` 治理区派生一致性）
- `src/cli/contracts/dual-host-governance/skills-governance.json`（38 包与 `entry_surface` 的 registry 真相源）
- `.gitignore`（spec-first managed block；决定审查产物是否进入版本库）
- `docs/catalog/runtime-capabilities.md`
- `docs/validation/2026-08-01-full-system-audit-plan.md`（历史方案，仅复用结构，不复用结果）
