---
artifact_type: audit-plan
artifact_version: 2
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
supersedes: docs/validation/2026-08-01-full-system-audit-plan.md
---

# spec-first 全链路系统审查方案 v2

## Goal Capsule

- **目标：** 判断当前 checkout 是否能把 `Codebase -> Spec -> Plan -> Tasks -> Code -> Review -> Knowledge` 连接成可验证、可恢复、可复用的可信变更闭环。
- **审查边界：** 以当前 `HEAD`、当前 source、当前 contracts/tests 和显式授权为准；旧报告、memory、provider 输出只作 advisory 线索。
- **审查方式：** 先做 source/contract 与 deterministic floor，再做隔离 projection/lifecycle，最后按授权选择真实宿主、真实任务和 comparator 波次。
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

- R1. 审查必须在 run start 冻结 `HEAD`、dirty paths、Node/npm、package version、动态宿主集合、授权和工具可用性。
- R2. 审查必须把 project-owned source、generated runtime、host-local state、provider artifact 和审查产物分开，并把结论回源到当前 source/test/log/contract。
- R3. 审查不得在当前工作树修复 finding、手改 generated runtime、注入 source/runtime drift、全局安装、commit、push、PR 或外发数据。

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

### Scope Boundaries

- **本轮包含：** 当前 source/contract inventory、8 宿主 projection/lifecycle、deterministic gate、13 个核心 workflow/入口语义、38 个 canonical Skill 逐包逻辑审查、产品定位、Provider/setup、隔离 D 场景、历史证据复核、canonical report 收口（U11），以及在单独授权下的 J/C 场景。
- **本轮不包含：** 逐行审查全部文件、无授权的 worker/persona dispatch、真实外部系统写入、真实用户数据、生产部署、发布或 durable knowledge promotion。
- **条件范围：** C2 需要 exact-version 宿主 journey；C3 需要真实未解决任务和 disposable worktree；C4 需要预注册 comparator。输入缺失时记 `not-run`，不以降级措辞掩盖。

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

### Evidence & Limitations

- 当前 `HEAD` 为 `c0803ab5d2e80edde9ca67771c6d204b775bb354`，工作树 dirty，包含 Runtime Setup、CE localization、peer-runner 和 tests 等未提交变更；本方案要求把 dirty paths 原样记录为审查输入，不能覆盖或回退。
- 当前 `src/cli/adapters/index.js` 已注册 8 个宿主，而部分历史测试与合同文件仍使用 “six-host” 命名；这是待验证的 drift 假设，不是已确认缺陷。
- 当前 `tests/` 有 292 个文件、`skills/` 有 76 个目录（含 workspace/eval 支撑目录）；数量只用于计划容量和覆盖检查，不能单独证明质量。
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
- `.spec-first/audits/full-system/<run-id>/gates.json`、`positioning.json`、`findings.json`：退出 gate、定位证据和 finding ledger。
- `docs/validation/full-system-audit/<run-id>-report.md`：唯一 canonical report，汇总上述 artifact，不承载未引用的独立结论。

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

执行依赖固定为：`U1 → U2`；`U1 → U3/U4/U5/U7/U9`；`U3/U4 → U6`；
`U7/U9 → U10`；`U2/U3/U4/U5/U6/U7/U9/U10 → U8`；`U2/U3/U4/U5/U6/U7/U8/U9/U10 → U11`。
没有列入依赖的单元可以并行读取，但 artifact 写入仍由 run owner 串行化。

层级映射（KTD6 中的 L0/L1/L2 引用按此解释）：L0 运行基线与宿主投射（U1、U2、U3）；L1 确定性地板与五类 gate（U4）；L2 语义审查（U5、U9、U10）；L3 隔离机制与授权 field 波次（U6、U8）；U11 为收口单元。文档中 U/V 编号反映追加历史，不代表执行顺序。

U9 内部按风险分批：Batch A（pilot）= 五类退出 gate 的 canonical owner Skill（`spec-work`、`spec-code-review`、`spec-handoff`、`spec-compound`、`spec-runtime-setup`），先行验证 receipt 方法与单包成本；Batch B = 其余 8 个核心 workflow Skill；Batch C = 其余 25 个 canonical Skill，其中包含 7 个 `workflow_command`（`spec-app-consistency-audit`、`spec-compound-refresh`、`spec-debug`、`spec-dogfood`、`spec-optimize`、`spec-polish`、`spec-write-skill`）、14 个 `standalone_skill` 和 4 个 `internal_only`，入口类型与风险等级分别记录，不能以批次名称降低 workflow 覆盖要求。每个 Skill 是独立 receipt 单位：完成一个即落盘；预算中断时，已完成包保留完整 receipt，当前包保留已检查范围、未覆盖分支和恢复点，批次汇总标记 `incomplete`/`not-run`，不伪造整批通过。U1 冻结的 dirty 输入所对应的高变更 surface（当前为 runtime-setup workspace、peer-runner、CE localization ledger）在其所属单元内优先审查。U5 对 13 个核心 workflow 复用已就绪的 U9 Batch A/B dependency closure，不重复深挖；相关 receipt 未就绪时只能报告跨 Skill 结论 `not-run`。

容量参考（计划估算，非承诺）：U1–U4 约 4–7 小时；U9 约 8–13 小时（A 约 2、B 约 3、C 约 3–8，低风险包按抽样规则收敛）；U5 约 2–3；U10 约 2–4；U7 约 1–1.5；U6 约 2–4；U11 约 1–2。跨 session 执行时按批冻结进度。

## Implementation Units

### U1. Freeze run manifest and safety envelope

- **Goal:** 建立可复现 source identity、dirty-worktree fingerprint、运行环境、动态宿主、授权和禁止动作清单。
- **Files / sources:** `src/cli/adapters/index.js`, `package.json`, `AGENTS.md`, `docs/10-prompt/结构化项目角色契约.md`, `docs/contracts/source-runtime-customization-boundary.md`, `docs/contracts/verification/ce-setup-snapshot.schema.json`, `skills/spec-work/scripts/working-tree-fingerprint.cjs`。
- **Method:** 使用现有 `working-tree-fingerprint.cjs` 记录完整工作树身份，同时生成只覆盖 canonical source roots 的 `source_snapshot`；run manifest 在开始时冻结本轮 audit 输出目录、临时目录和其他 `excluded_run_outputs`，这些派生物不得触发源码漂移判定。记录 `git rev-parse HEAD`、Node/npm、CLI version、`getSupportedPlatforms()`、工具/授权状态；运行前后各采集一次 source snapshot，canonical source 内容或宿主集合变化即停止并重新冻结。日志先经过确定性 secret/credential 扫描；审查 envelope 使用 `redaction_status=passed|none-required`，映射既有 verification receipt 时保留其 `redacted|none-required` 原值，任何不满足对应合同的状态都不持久化原始日志。
- **Test scenarios:** dirty tree、detached HEAD、缺失 optional tool、日志疑似含凭证、宿主枚举变化。
- **Exit:** manifest 可回源，且同时能区分完整工作树指纹与排除审查产物后的 canonical source snapshot；任何隔离/脱敏失败则阻断后续会产生持久日志的波次。

### U2. Establish deterministic baseline and package floor

- **Goal:** 判断当前 source 能否通过语法、Skill entrypoint、主测试链、build 和临时 prefix 安装。
- **Files / sources:** `scripts/run-test-suite.cjs`, `scripts/npm-install-matrix-smoke.cjs`, `package.json`, `tests/unit`, `tests/smoke`, `tests/integration`。
- **Method:** 顺序运行 `npm run typecheck`、`npm run lint:skill-entrypoints`、`npm test`、`npm run build`、`node scripts/npm-install-matrix-smoke.cjs` 和按需的 `npm run test:mcp-setup`；每条命令绑定唯一 check ID、超时、终止/残留进程检查、真实 exit code、脱敏日志和 reason code。`npm test` 已覆盖 unit/smoke/integration，不重复拆跑同一套全量链路。
- **Test scenarios:** command missing、declared test path missing、timeout、package install/shim failure、baseline partial failure。
- **Exit:** baseline failure 不回填修复；继续 read-only review，但阻断依赖 green baseline 的高层 claim。V2 另分开记录 `record_validity`（命令是否有完整、可回源 receipt）与 `mechanism_result`（必检命令和关键负例是否达到通过条件），前者通过不等于后者通过。

### U3. Audit eight-host projection and ownership lifecycle

- **Goal:** 以动态宿主全集验证 init/doctor/clean、package projection、drift、re-init、user-owned collision 和不触碰 git index。
- **Files / sources:** `src/cli/adapters/**`, `src/cli/plugin*.js`, `src/cli/commands/init*.js`, `src/cli/commands/doctor.js`, `tests/integration/init-six-host-lifecycle.integration.test.js`, `tests/integration/doc-review-six-host-projection.integration.test.js`, `tests/unit/host-enumeration-drift-guard.test.js`。
- **Method:** 复用现有临时 project/home harness；不把测试文件名中的 “six-host” 当成覆盖结论，先核对其实际枚举。
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

- **Goal:** 审查 `using-spec-first`、`spec-ideate`、`spec-brainstorm`、`spec-prd`、`spec-plan`、`spec-write-tasks`、`spec-work`、`spec-code-review`、`spec-doc-review`、`spec-lfg`、`spec-handoff`、`spec-compound`、`spec-runtime-setup` 共 13 个核心 workflow/入口的边界、消费者和降级语义；其中 `using-spec-first`、`spec-lfg`、`spec-handoff` 按 registry 的 `standalone_skill` 类型单列，其余按 `workflow_command` 处理。
- **Files / sources:** 各 `skills/<name>/SKILL.md`、references、`templates/**`（各宿主 command/skill 模板）、对应 `tests/unit/**` 与 `docs/contracts/workflows/**`。
- **Method:** 对每个 workflow 使用同一 lens：WHAT/HOW owner、mutation/worker/external authorization、script/LLM boundary、reason code/fallback、summary-first handoff、公开入口合法性。
- **与 U9 的分工：** U5 只负责跨 workflow/入口语义（边界、授权、降级、consumer、公开入口合法性）与跨 Skill 链路、handoff、closeout；单包内部路径完整性由 U9 receipt 承载，不重复包内分支核对。对 13 个核心 workflow/入口，U5 仅消费已就绪的 U9 Batch A/B dependency closure 与分支图；资料可以提前读取，但在对应 receipt 未就绪前不得形成跨 Skill 的 `passed` 或 `completed` 结论。两单元结论冲突时以分支级 source 证据为准，并将冲突记入 finding ledger。
- **Test scenarios:** Direct Lane 误路由、Product Contract 越权改写、plan readiness 假阳性、review apply/report-only 混淆、handoff 缺失字段、knowledge promotion 过度升级。
- **Exit:** 每个 workflow/入口独立出链路结果；普通 source review、contract test、fresh-source eval 分开计数，leaf-level 分支结果统一引用 U9 receipt。

### U9. Audit single-skill internal logic and workflow completeness

- **Goal:** 对每个 canonical Skill 建立逐包、逐分支的内部逻辑审查记录，判断“能被触发”是否真的能沿完整路径得到受约束的输出或诚实停止。
- **Inventory scope:** 以 `src/cli/contracts/dual-host-governance/skills-governance.json` 和 38 个 `skills/*/SKILL.md` canonical package 为准，排除 `*-workspace`、eval fixture 和 generated runtime mirror；先生成带 `source_snapshot`/`inventory_sha256` 的 inventory，再递归纳入每个包被引用的 `references/`、`scripts/`、`schemas/`、`templates/`、`tests/` 与实际 consumer。
- **Entry contract:** 检查 frontmatter `name`/`description`、public/internal surface、positive trigger、negative trigger、near-neighbor 路由、用户显式调用边界、host delivery 与命名是否一致。
- **Flow graph:** 从入口开始绘制 `input -> preflight -> branch -> reference/script/tool -> artifact/output -> verification -> handoff/closeout`；每个分支标注 guard、owner、读写权限、预期产物和失败出口，识别不可达分支、隐式 fall-through、重复决策和循环无退出条件。
- **Completeness lens:** 逐项核对 happy path、边界输入、无输入/缺文件、工具缺失、Provider degraded、超时/中断、验证失败、权限不足、用户拒绝、部分成功、恢复/重试、停止条件和最终 done signal；不能只检查文档中是否出现 `MUST` 或“已完成”。
- **Reference closure:** 对每个条件 reference 记录读取条件与它支持的判断；检查 body 与 reference 是否重复拥有 gate、是否存在孤儿 reference、路径/anchor/schema/script 是否可达、脚本事实是否被 LLM 语义判断正确消费。
- **Artifact and consumer closure:** 核对输出字段、schema/hash/freshness/limitations、写入 owner、下游 consumer 和 source/runtime 边界；区分 writer 通过、consumer 接受、宿主发现和真实任务效果。
- **Host projection parity:** 将 source Skill 的入口、description、mode、mutation policy、internal-only 标记和 reference 可达性与各宿主 projection 对照；投影一致不升级为 loader/invocation 通过。
- **Test scenarios:** 每个 Skill 至少完成同一套最低语义覆盖：入口与正例、near-neighbor/负例、主要输出/consumer、一个关键错误或停止路径；workflow/high-risk Skill 在此基础上必须覆盖降级、恢复、跨阶段 handoff/closeout；standalone Skill 至少覆盖一条关键错误路径；internal Skill 必须覆盖不可公开触发、consumer 输入和停止路径。风险抽样只用于额外脚本、深层 reference 或运行场景，不得替代上述最低覆盖；receipt 必须记录抽样分母、覆盖率和预算。测试缺失记录为 coverage gap，不凭 prose 自评补齐。
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
- **Budget/owner:** 每个 Skill receipt 记录包级预算、实际耗时、抽样分母/覆盖率、已检查分支、未覆盖分支、恢复点和最终 owner；达到单包或总预算、连续无新证据或 source 变化时停止。已经完成最低覆盖的 Skill 立即写入最终 receipt；未完成最低覆盖的当前包写入 `degraded|not-run` receipt，明确 `reason_codes` 和恢复点，不等待整批结束，也不把已完成包回滚为批次级未记录。
- **Exit:** 38 个 canonical Skill 均有独立 receipt 或明确 `not-run` 原因；发现的逻辑缺口按 Skill、分支和 consumer 定位，不能用“核心 workflow 通过”整体覆盖。

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
- **Method:** 校验 manifest、check receipts、Skill receipts、gate matrix、positioning matrix 和 finding ledger 的 `run_id`/`source_snapshot` 一致性；拒绝缺失 evidence path、未脱敏日志、未声明 reason code 或超出 ceiling 的结论。报告分别列出 `record_validity` 与 `mechanism_result`，再列出 confirmed、degraded、not-run、blocked 和后续 owner handoff，避免“记录完整”被读成“机制通过”。
- **Report skeleton:** (1) Executive verdict 与本轮 claim ceiling；(2) run manifest 摘要；(3) 层级覆盖矩阵（L0–L3 各 check 终态与未执行原因）；(4) 五类 gate matrix；(5) 八宿主 projection/loader/workflow 分层矩阵；(6) 13 个核心 workflow/入口语义结论（按 registry entry_surface 分层）；(7) 38 个 Skill receipt 汇总与缺口定位（含抽样覆盖率）；(8) 定位与采用证据矩阵；(9) D/J/C 波次结果；(10) findings ledger；(11) residual risks、limitations 与 re-evaluate conditions；(12) 修复 handoff 与 recommended next action。
- **Verdict ladder:** `mechanism qualified` = C0/C1 证据通过，且 V1/V2 的 `record_validity=passed`、必检命令与关键负例的 `mechanism_result=passed`，五类 gate 无未说明的 `missing`，degraded 路径均有 reason code 与 fallback；仅有完整 receipt 或失败被如实记录不能升级为机制通过。`field journey qualified` = 至少 J1 在真实任务、隔离 worktree 与真实 verifier 下达到 C3，且无 unsupported completion claim 或未授权 mutation；`incremental value qualified` = 至少一个预注册 comparator 支持 C4。任一级证据缺失时该级显式记「未验证」，不得以下一级通过替代。
- **Exit:** 生成 `docs/validation/full-system-audit/<run-id>-report.md` 与对应 `findings.json`；只有 V11 通过才允许将本轮标记为 `completed-with-findings`，否则保持 `incomplete`。V11 通过只表示审查记录和引用闭包有效，不自动把 `mechanism_result`、field outcome 或 incremental value 提升为通过。

### U6. Run controlled degradation journeys

- **Goal:** 在 disposable project/worktree 中验证机制 failure path，不污染当前 checkout。
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
| V1 manifest | always | run manifest + fingerprint + redaction result | source identity、dirty scope、授权和环境完整可回源 |
| V2 baseline | always | command receipts + command logs + exit codes | 每条实际运行命令有终态、超时/终止记录和脱敏状态；失败项不被隐藏；`record_validity` 与 `mechanism_result` 分开，不能以 receipt 完整替代命令通过 |
| V3 host coverage | always | dynamic host list + per-host receipts | 当前全集逐项覆盖，projection/loader/invocation 分层 |
| V4 gate matrix | always | five-gate matrix + negative evidence | owner、consumer、enforcement、limitation 完整 |
| V5 semantic review | always | workflow/entry rows + source refs + contract results | 13 个核心 workflow/入口各有独立结论；按 registry entry_surface 分层，不冒充独立 reviewer |
| V9 single-skill logic | always | one receipt per canonical Skill + dependency closure | 入口、分支、引用、输出、错误/停止/恢复和 consumer 路径均有结论；缺口不被总评掩盖 |
| V10 positioning and value | always | positioning card + alternative map + activation/retention evidence | 用户、任务、差异化、成本、采用、baseline、metric contract 和证据上限完整；无 field evidence 时只能是 hypothesis/not-run |
| V6 controlled journeys | mechanism wave | D receipts | disposable 隔离、预期 reason code、C1 ceiling 明确 |
| V7 history freshness | always | stale/current ledger | 历史 claim 按 source/freshness 重新分类 |
| V8 live/field/comparator | optional | C2/C3/C4 receipts | 仅在授权、版本、真实任务和 comparator 完整时升级 claim |
| V11 closeout | always | manifest/receipt consistency + canonical report + finding ledger | 所有计划 check 有终态，artifact 的 `run_id`/snapshot 一致，finding 可回源，未执行项带 reason code，报告不超出 claim ceiling |

建议命令（执行时以 U1 冻结的当前 source 和实际存在路径为准）：

```bash
git rev-parse HEAD
git status --short
node --version
npm --version
node bin/spec-first.js --version
git diff --check
node -e "console.log(require('./src/cli/adapters').getSupportedPlatforms())"
npm run typecheck
npm run lint:skill-entrypoints
npm test
npm run build
node scripts/npm-install-matrix-smoke.cjs
# 按需补跑（非 baseline 必选）：npm run test:mcp-setup
```

定向 Jest 必须使用 `npm run test:jest -- --runTestsByPath ... --runInBand`，不能把路径追加到固定运行全量 `tests/unit` 的 `npm run test:unit` 后面。执行清单由 U2/U3/U4 根据当前存在的测试路径生成，避免沿用已重命名的六宿主假设。

## Risks and Dependencies

| 风险/依赖 | 影响 | 处理与停止条件 |
| --- | --- | --- |
| 当前工作树持续变化 | receipt 不能回源到同一 source | U1 每个波次前后重采集 fingerprint；变化即停止受影响波次并新建 run |
| secret/credential 出现在日志 | 造成审查 artifact 泄露 | 先扫描再落盘；扫描失败只保留 reason code，不保存 raw log |
| worker dispatch、真实宿主、真实任务或 comparator 未授权/不可用 | C2–C4 无法成立 | 记录 `not-run`/`blocked`，不把 inline review 或 fixture 升级为独立/现场证据 |
| 38 个 Skill 审查规模过大 | 产生浅覆盖或无限运行 | 按 U9 风险分层执行；达到单包预算、总预算或连续无新证据即停止并报告覆盖率 |
| 历史文档与当前宿主集合漂移 | 误报或漏报 host coverage | U7 建立 source/contract/catalog/lifecycle reconciliation 行，逐项标 `current/stale/unknown` |
| 产品指标缺少 baseline 或 field cohort | 只能形成定位假设 | V10 保持 `hypothesis/not-run`；不得进入推广、默认路径或 C4 结论 |

U2 的每条命令、U6 的每个 degradation journey、U8 的每个 field wave 和 U9 的每个 Skill 都必须声明预算、停止条件、恢复点和最终 owner；没有这些字段的条目不能进入 `passed`。

## Definition of Done

- [ ] run manifest 绑定当前 `HEAD`、dirty fingerprint、动态宿主、环境、授权和脱敏结果。
- [ ] 所有 run artifact 符合 `full-system-audit/v1` envelope，绑定同一 `run_id`、canonical source snapshot（含 `excluded_run_outputs`）、producer、consumer 和 schema version；已有领域合同只作为被引用的证据，不被错误套用为审查 envelope 校验器。
- [ ] C0–C4 claim ceiling 与 Appendix `Product evidence axes` 已映射到各单元/波次；每条计划 check 全部有 `passed|failed|degraded|not-run|blocked`，无空白项。
- [ ] 八宿主 projection 与 ownership 逐项覆盖；loader 和 workflow invocation 未验证项保持独立限制。
- [ ] 五类 gate 均有 source owner、consumer、negative evidence、enforcement level 和 limitation。
- [ ] 核心 workflow 逐个完成 current-source review；独立 fresh-source eval 的授权与实际状态单列。
- [ ] 38 个 canonical Skill 均有独立内部逻辑与流程完整性 receipt，包含最低语义覆盖；额外脚本/reference/运行场景抽样单独记录，不能替代最低覆盖。
- [ ] workflow Skill 的阶段 handoff/closeout 与 standalone/internal Skill 的公开边界分别验证；不能以同一套总评替代不同 contract。
- [ ] 每个 Skill 的缺陷均能定位到 source body、reference、script/schema/test 或 consumer；孤儿资源、不可达分支和未声明失败出口均单列。
- [ ] 产品定位审查交付 primary user、anti-persona、Job-to-be-Done、替代方式、差异化 wedge、activation/retention 路径和成本/反指标。
- [ ] 结构、行为、runtime cost、field outcome、相对增量价值五类证据分别记录；每个 metric 有 baseline、分子/分母、窗口、noise floor、missing-data policy 和 decision rule；能力数量、测试通过和 demo 不被当作产品价值。
- [ ] 个人开发者、小团队、平台团队、受监管组织的适用性与未验证项分开；没有用户/市场授权时不伪造外部事实。
- [ ] 每项能力有 Adopt/Experiment/Wrap/Build/Thin/Retire 的证据条件、默认/preview 边界和退出触发器。
- [ ] D 场景只在 disposable 环境运行，并保留 C1 claim ceiling。
- [ ] 历史报告、catalog、README、CE ledger 的 stale/current/unknown 状态可回源；旧文件不被静默改写。
- [ ] 每个 P0/P1 finding 有 consequence、direct evidence、owner、minimal fix、validation 和 re-evaluate 条件。
- [ ] C2/C3/C4 只有在对应授权和直接 evidence 齐全时才升级；否则报告 `not-run` 或 `blocked`。
- [ ] U11/V11 完成 manifest、receipts、gate、positioning、finding 和 canonical report 的一致性收口；未通过时本轮保持 `incomplete`。
- [ ] 审查过程没有 source/runtime 修复、全局安装、外发、commit/push/PR 或 knowledge promotion。
- [ ] canonical report、raw receipts 和后续修复 handoff 路径可访问；报告明确本轮 claim ceiling 与未完成项，mechanism / field journey / incremental value 三级系统结论按 U11 verdict ladder 给出，证据不足的级别显式记未验证。

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
- `skills/spec-work/scripts/working-tree-fingerprint.cjs`
- `docs/catalog/runtime-capabilities.md`
- `docs/validation/2026-08-01-full-system-audit-plan.md`（历史方案，仅复用结构，不复用结果）
