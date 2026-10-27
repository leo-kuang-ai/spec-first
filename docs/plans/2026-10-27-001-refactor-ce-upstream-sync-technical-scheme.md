---
title: "CE 上游更新同步技术方案"
type: refactor
status: active
date: 2026-10-27
sequence: 001
topic: ce-upstream-sync
artifact_contract: spec-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: spec-plan-bootstrap
execution: code
target_repo: spec-first
upstream_range: 153e605e1622154a0d7da095fceed13edcb68bf7..00d0a5bbf1300b2138b65ce724b325dd4dff77ba
---

# CE 上游更新同步技术方案

## Goal Capsule

- **目标：** 为每一轮 Compound Engineering（CE）上游更新建立可回源、可裁决、可验证的同步闭环，将适用增量吸收到 spec-first 当前 canonical owner，同时避免复制 CE package、generated runtime、宿主专属产品或中心同步 runner。
- **推荐方法：** 冻结上游 Git 窗口和目标仓库快照 -> 生成逐路径确定性事实 -> 生成与脚本事实分离的语义裁决账本 -> 校验账本和 owner 映射 -> 按 owner 实施最小 source/test 变更 -> 逐项验证与证据收口。
- **本方案定位：** 新一轮 CE 更新的技术基线和执行准入方案。它不承接 2026-08-19 方案的旧 commit range、517-path 分母、旧 ledger 或旧完成状态。
- **决策焦点：** 每条上游变化是否适用于当前 spec-first、应由哪个 source owner 吸收、采用 `reuse / extend / compose / reference-only / product-exclusion` 中哪种裁决，以及是否需要产品负责人确认新的 public surface、宿主或 provider。
- **验证焦点：** 证明上游窗口、目标快照、路径完整性、owner/test 映射、source/runtime 边界和失败保持规则；不把本地机制测试提升为真实宿主、模型、PR/CI、用户收益或现场结果。
- **最大风险：** 把 CE 的目录结构或一次性实现机械搬入 spec-first，制造 duplicate owner、第二 truth source、host parity 假象和无法回源的完成声明。

## Product Contract

### Problem Frame

CE 持续变化，更新可能同时涉及 Skill prose、references、scripts、schema、CLI、配置、测试、runtime 和发布元数据。spec-first 与 CE 存在同名或近邻能力，但两者的 source-of-truth、宿主边界、授权模型和证据合同不同。单纯按文件复制或按 commit message 标记“已同步”，无法证明当前目标仓库已经正确吸收行为。

旧的 [2026-08-19 全窗口方案](2026-08-19-003-refactor-ce-post-3-20-full-window-sync-plan.md) 固定在 CE `5c7cb347..956087b3` 的 168 commits、517 paths，且状态为 `completed`。它可以提供方法和边界，不能作为新上游窗口的事实输入。新的更新必须建立新的 successor 方案和新的 ledger。

### Requirements

- **R1 Window truth：** 新方案必须绑定 CE upstream repository、base、head/tag、commit range、读取时间、目标仓库 HEAD、dirty manifest、source tree hash 和 inventory hash；缺任何关键快照时，相关工作保持 `blocked` 或 `incomplete`。
- **R2 Path completeness：** 以 `git diff --name-status -M` 和逐文件 hash 形成唯一 path denominator。每条记录必须含 `path`、`name_status`、`old_path`（如适用）、`group`、`surface`、`role`、`canonical_owner`、`implementation_unit`、`target_action`、`evidence_status`、`source_refs`、`test_refs` 和 `limitations`。
- **R3 Current source ownership：** CE 目录、runtime mirror、文档、测试和 provider 输出只能作为 advisory upstream evidence；spec-first 的 durable owner 必须位于当前 `skills/`、`src/cli/`、`scripts/`、`templates/`、`docs/contracts/`、`docs/` 或 `tests/`。
- **R4 Existing-owner first：** 初始映射可以使用 `ce-* -> spec-*` 作为导航线索，最终必须依据当前 source owner 和 consumer 判断；默认 `reuse / extend / compose`，不得因同名自动创建 duplicate public Skill。既有明确产品排除在 owner 改变决定前继续有效；回源确认适用范围不等于自动撤销排除。
- **R5 Product boundary：** 新增 Skill、宿主、provider、外部通信面、CE 产品面或发布面必须单独形成决策；上游存在不等于当前产品接受。
- **R6 Deterministic floor：** 脚本只生成路径、hash、schema、join、状态、receipt、排序和可重复事实；LLM 判断语义充分性、owner fit、优先级、产品适用性和 review 结论。
- **R7 Source/runtime boundary：** 修改 canonical source；generated runtime 只通过既有生成链预览或在单独授权下投射。不得手改 `.claude/`、`.codex/`、`.agents/skills/`、`.cursor/`、`.kiro/`、`.qoder/` 或其他 host-local mirror 作为同步修复。
- **R8 Evidence honesty：** 计划、账本、测试通过、runtime preview、provider 输出和 handoff artifact 只能证明其直接覆盖的 claim；不得由此声称真实模型行为、跨宿主加载、PR/CI、发布、field outcome 或用户收益。
- **R9 Incomplete preservation：** upstream mismatch、owner 不明、schema 无效、source/test evidence 缺失、必要验证失败或授权缺失时，保留 `planned`、`blocked`、`degraded`、`not-run` 或 `incomplete`，不得批量关闭。
- **R10 Single-writer closeout：** ledger、adjudication 汇总和最终证据必须有唯一写入 owner；实施、审查和收口职责分别记录。同一 Agent 串行执行时如实标注内联自查，不能声称独立审查。

### Scope

本方案覆盖：CE 固定 Git 窗口的读取、冻结、逐路径 inventory 和 hash；CE Skill、reference、script、schema、CLI、配置、测试和 runtime 相关变更的适用性裁决；当前 spec-first source owner 的映射、最小融合、focused test 和文档证据；ledger、adjudication、verification summary、handoff 和 limitation 的收口；必要时的 host projection dry-run、doctor/readiness 状态记录。

本方案不覆盖：自动把 CE 全部内容复制进 spec-first；创建 CE 同名 public Skill、中心同步 runner 或新的宿主抽象；未经授权的 commit、push、PR、发布、外部 provider 调用、数据外发或 runtime apply；真实用户现场收益、模型质量、跨宿主 loader parity 或生产结果验证；把旧方案的历史 ledger、旧任务状态或旧完成声明当作新窗口的事实。

## Planning Contract

### Architecture Posture

总体采用 **reuse / extend / compose**。现有 owner、schema、reconciler、verification helper 和 runtime projection 能承载变化时直接复用；已有 owner 拥有边界但缺少行为时局部扩展；跨 owner 只增加转换、排序、失败传播和证据聚合的 thin glue。只有复用会混淆职责、复制 truth source 或扭曲既有 contract 时，才提出 `new`。范围内可逆实现由模型判断；新增产品面或重大副作用才提交 owner 决策。

当前应优先复用的能力包括：

- `scripts/check-ce-upstream-reconciliation.cjs`：上游路径、快照、账本和一致性检查；
- `docs/contracts/verification/ce-upstream-adjudication-input.schema.json`：裁决输入合同；
- `docs/contracts/verification/ce-upstream-adjudication.schema.json`：裁决输出合同；
- `tests/unit/ce-upstream-reconciliation-v2.test.js`：同步与账本合同回归；
- `docs/contracts/verification/provider-serving-receipt.schema.json`：provider/agent serving receipt；
- `docs/contracts/workflows/fresh-source-eval-checklist.md`：Skill 源码语义复核清单。

这些能力是现有 source evidence，不代表新窗口已经准备就绪。执行前必须重新读取当前 source、测试和 schema，确认没有 drift。

### Key Technical Decisions

- **KTD1 Window binding：** 新窗口用完整 SHA 或 immutable tag 绑定，不以 branch 名称、当前远端 HEAD 或 commit message 作为唯一身份。
- **KTD2 Read-only upstream：** CE checkout 只读；实现、测试、ledger 和 changelog 变更只发生在 `target_repo: spec-first`。跨 repo 读取不扩大写权限。
- **KTD3 Two-stage judgment：** 先由脚本准备 path/hash/status facts，再按历史排除与 closure profile 分流。LLM 只对适用性候选和明确例外做 owner、行为差额与语义充分性裁决；reconciler 校验全量路径归属、schema、join、snapshot 和 closure，不替代语义判断。
- **KTD4 Profile-aware completion：** 每条路径都需可追踪处置，但只有适用行为源码需要逐路径语义裁决。历史产品排除按包关闭，evidence-only 按 count/hash、group rule 和 exception list 关闭。不得用 package summary 或目录存在冒充适用源码的语义审查。
- **KTD5 Evidence tiers：** `structure_contract`、`behavior_quality`、`runtime_cost`、`field_outcome` 分层记录；没有真实任务和宿主证据时，后两层保持 `not-run`。
- **KTD6 Runtime projection：** source 变更后的 runtime 只允许 dry-run 或明确授权的投射；projection 成功只证明生成和 drift check，不证明宿主已加载。
- **KTD7 Historical preservation：** 旧方案保持不可变；新窗口建立新文档、ledger 和验证目录，通过 `supersedes` / `successor_of` 建立关系，不重写旧事实。

## High-Level Technical Design

```text
CE immutable Git refs + target repo snapshot
        ↓
deterministic inventory: name-status, hashes, groups, source facts
        ↓
adjudication input/output: owner, action, evidence, limitations
        ↓
reconciler: schema + join + snapshot + closure validation
        ↓
owner-local source/test changes (reuse / extend / compose)
        ↓
focused verification + optional fresh-source eval
        ↓
single-writer ledger merge + verification summary + handoff
```

### Artifacts

| Artifact | Owner | Type | Required content |
|---|---|---|---|
| Upstream snapshot | sync coordinator | confirmed | repo identity, base/head, commit count, dirty state, read timestamp |
| Target snapshot | sync coordinator | confirmed | target HEAD, branch, dirty manifest, source tree hash, inventory hash |
| Adjudication input | deterministic producer | generated | path facts, source refs, target snapshot and schema version |
| Adjudication output | semantic reviewer | advisory/confirmed by review | owner, action, rationale, source/test refs, limitations |
| Path ledger | single writer | confirmed/degraded per row | one row per upstream path, exact status and closure profile |
| Owner receipt | implementation owner | confirmed/degraded | changed source, tests, result, limitation, authorization |
| Verification summary | verification owner | confirmed | actual command, exit code, log path, status and reason code |
| Handoff | plan/work owner | confirmed/degraded | summary, source refs, freshness, next owner and claim ceiling |

建议将新窗口的验证产物置于 `docs/validation/ce-pull-<date>/` 或同等 repo-relative 目录；不再把评测或同步产物写入 `skills/*-workspace/`。

## 历史排除规则与本窗口同步范围

本轮沿用历史明确范围，完整路径清单见 [历史排除清单](../validation/ce-pull-2026-10-27/historical-exclusions.md)，机器可读映射见 [historical-exclusions.json](../validation/ce-pull-2026-10-27/historical-exclusions.json)。两者是本方案范围附件；不改写历史账本或当前 raw inventory。

| 类别 | CE 路径规则 | 本窗口数量 | 执行处置 |
|---|---|---:|---|
| H1 完整产品排除 | `skills/ce-babysit-pr/**`、`skills/ce-proof/**`、`skills/ce-retune/**` | 23（14/1/8） | 不移植产品包，不创建本地对应产品；按 `product-excluded` 关闭 |
| H2 文档证据 | `docs/**` | 113 | 不迁入 CE 文档；按 evidence-only 组核对，相关语义仅作定向参考 |
| H3 测试证据 | `tests/**` | 473 | 不迁入 CE 测试体系；已采纳行为需要的断言在本地 owner 测试中重建 |
| H4 metadata/config 证据 | 历史 G05/G06 精确路径与本窗口交集，详见附件 | 16 | 不直接复制；可复用行为需独立映射本地 CLI/config owner |
| H5 适用性候选 | 剩余未命中上述规则的路径 | 398 | 先判等价实现、行为差额、产品边界；有适用差额才更新 |

**1,023 是盘点分母，625 条无需直接移植，398 条是待判断候选；两者均不是待修改文件数。** 只对确认有差额的本地 source 及必要 consumer/test 实施。已有等价实现不改文件，记录可回源依据即可。

历史依据为 [2026-08-19 全窗口方案](2026-08-19-003-refactor-ce-post-3-20-full-window-sync-plan.md) 的 R5、KTD13、G02–G06 和 [2026-09-09 执行方案](2026-09-09-001-refactor-ce-pull-129-commit-sync-execution.md) 的“产品排除”“核对粒度与增量判断”。新窗口计数重新从冻结 inventory 计算，不继承历史 517/219 分母、hash 或完成状态。

以下边界必须保留：

- `ce-setup` 不新增 `spec-setup`，适用行为映射 `spec-runtime-setup`、CLI/config，不能整体跳过。
- `ce-bakeoff`、`ce-noslop` 属于历史待产品决策，不能冒充已排除或已采纳。
- `SKILL.md`、references、personas、agent prompt、行为模板与 CE `.agents/skills/ce-skill-work/**` 是行为 source，不能按 Markdown 或隐藏目录排除。
- `src/**` 的历史 evidence-only 身份表示不能复制 CE CLI，不排除本地兼容性修复。新 `site/**`、发布工具等不在旧精确列表的路径，留在 H5 明确裁决，不能伪称历史已逐文件排除。
- 历史 `evidence-exceptions.json` 的 G01 包含全部 Skill source，并非黑名单。H2/H3/H4 允许 count/hash + group rule + 明确例外分组收口，无须将每个证据文件扩成实施任务。

## 具体比对文件与本地修改清单

以下所有 CE 路径相对于只读仓库 `compound-engineering-plugin`；本地路径相对于 `spec-first`。CE 以固定 `base..head` 净 patch 为主输入，读取相关 commit patch 解释行为演进；本地读取当前磁盘 source 和直接 consumer。文件配对用于语义对比，不按全文覆盖。

### F1. 已定位改造点

| 编号 | CE 比对输入 | 本地拟修改文件 | 具体修改点 | 配套验证文件 |
|---|---|---|---|---|
| F01 | 本窗口冻结事实及历史 reconciler 合同，无需寻找 CE 同名实现 | `scripts/check-ce-upstream-reconciliation.cjs` | 动态 window/package、合法 closure 映射、当前 unit 合并顺序、同快照 patch 与新输出路径；保留旧窗口分支 | `tests/unit/ce-upstream-reconciliation-v2.test.js`、`tests/unit/ce-upstream-3-20-reconciliation.test.js` |
| F02 | `skills/ce-compound/scripts/session-history/extract-metadata.py` | `skills/spec-compound/scripts/session-history/extract-metadata.py` | 当前本地 25 行、CE 200 行；采纳有界窗口扩大，保留现有 error 返回与 summary consumer | `tests/unit/session-history-scripts.test.js` |
| F03 | `skills/ce-commit-push-pr/references/branch-creation.md` | `skills/spec-commit-push-pr/references/branch-creation.md` | 本地两处 `git checkout -b` 缺少 `--no-overwrite-ignore`；逐处补保护，冲突后停止并保持原 index/工作树 | `tests/unit/spec-commit-push-pr-context-contracts.test.js`、`tests/unit/spec-commit-scope-regression.test.js`；必要时在同一 owner 增加临时 Git repo 行为用例 |

F01–F03 是已经定位到改造位置的任务，不是已实现或测试通过的声明。F01 的两个既有测试文件先复用：补新窗口回归，旧 fixture 只有在接口兼容需要时才调整，不为增加改动数重写已有断言。

### F2. 必须比对，有行为差额才修改

同一行列出的多个输入应合并理解；本地列是读取及条件修改集，不要求每个文件都发生 diff。

| 编号 | CE 上游文件 | 本地文件 | 只吸收的行为与保护条件 |
|---|---|---|---|
| F04 | `skills/ce-code-review/SKILL.md`、`skills/ce-code-review/references/depth-paths.md` | `skills/spec-code-review/SKILL.md`、`skills/spec-code-review/references/diff-scope.md` | 阅读深度与 scope；不自动新增同名 reference 或派发拓扑 |
| F05 | `skills/ce-code-review/references/diff-scope.md`、`skills/ce-code-review/scripts/review-scope.py` | `skills/spec-code-review/references/diff-scope.md`、`skills/spec-code-review/scripts/review-scope.py` | staged diff 有界读取、删除文件的存活 consumer、未读范围显式记录 |
| F06 | `skills/ce-code-review/scripts/findings-mechanics.py` | `skills/spec-code-review/scripts/findings-mechanics.py` | peer 身份与 confidence 提升；保留普通 persona 的合法合并语义 |
| F07 | `skills/ce-code-review/references/personas/testing-reviewer.md` | `skills/spec-code-review/references/personas/testing-reviewer.md` | false confidence、test-only seam、重复覆盖 |
| F08 | `skills/ce-code-review/references/personas/reliability-reviewer.md` | `skills/spec-code-review/references/personas/reliability-reviewer.md` | I/O 缺口与实际失败代价，不把无影响建议升为 blocker |
| F09 | `skills/ce-code-review/references/personas/maintainability-reviewer.md` | `skills/spec-code-review/references/personas/maintainability-reviewer.md` | 未请求的新表面和不必要依赖 |
| F10 | `skills/ce-code-review/references/personas/api-contract-reviewer.md` | `skills/spec-code-review/references/personas/api-contract-reviewer.md` | 删除/迁移后的 API consumer 与兼容性 |
| F11 | `skills/ce-code-review/references/finish-input.md`、`skills/ce-code-review/references/finish-review.md` | `skills/spec-code-review/references/finish-review.md` | 收尾上下文与 coverage/finding 保留，不按上游目录机械拆 leaf |
| F12 | `skills/ce-work/references/execution-strategy.md`、`skills/ce-work/references/implementation-loop.md` | `skills/spec-work/references/execution-strategy.md`、`skills/spec-work/references/implementation-loop.md` | 顺序依赖 inline、独立任务 wave、shared index 单写者 |
| F13 | `skills/ce-work/references/shipping-workflow.md`、`skills/ce-commit/SKILL.md` | `skills/spec-work/references/shipping-workflow.md`、`skills/spec-commit/SKILL.md` | transport/canonical commit 区分；commit/landing 仍分别授权 |
| F14 | `skills/ce-commit-push-pr/SKILL.md`、`skills/ce-commit-push-pr/references/commit-and-push.md` | `skills/spec-commit-push-pr/SKILL.md`、`skills/spec-commit-push-pr/references/commit-and-push.md` | 只同步辅助流程入口与实际保护点，不以改入口替代 F03 的真实调用点 |
| F15 | `skills/ce-resolve-pr-feedback/SKILL.md`、`skills/ce-resolve-pr-feedback/references/evaluation-rubric.md`、`skills/ce-resolve-pr-feedback/references/full-mode.md` | 对应 `skills/spec-resolve-pr-feedback/SKILL.md`、`skills/spec-resolve-pr-feedback/references/evaluation-rubric.md`、`skills/spec-resolve-pr-feedback/references/full-mode.md` | scope 外 follow-up、security/data-loss 升级、独立权限 |
| F16 | `skills/ce-resolve-pr-feedback/references/resume.md`、`skills/ce-resolve-pr-feedback/references/return-to-caller.md`、`skills/ce-resolve-pr-feedback/references/pipeline-mode.md` | `skills/spec-resolve-pr-feedback/references/pipeline-return.md`、`skills/spec-resolve-pr-feedback/references/pipeline-mode.md` | 发布后恢复、head/评论身份、调用方回交；不默认创建新 resume owner |
| F17 | `skills/ce-optimize/scripts/decide.mjs`、`skills/ce-optimize/references/measurement.md` | `skills/spec-optimize/scripts/decide.cjs`、`skills/spec-optimize/references/measurement.md` | paired baseline 已有等价保护时不改；不引入第二 decide 实现 |
| F18 | `skills/ce-optimize/SKILL.md`、`skills/ce-optimize/references/spec.md`、`skills/ce-optimize/references/loop.md`、`skills/ce-optimize/references/optimize-spec-schema.yaml` | `skills/spec-optimize/SKILL.md`、`skills/spec-optimize/references/spec.md`、`skills/spec-optimize/references/loop.md`、`skills/spec-optimize/references/optimize-spec-schema.yaml`、`skills/spec-optimize/scripts/measurement-admission.cjs` | holdout 不可变、实验角色和准入 consumer；remote/tick/provider 不采纳 |
| F19 | `skills/ce-compound/references/session-history.md` | `skills/spec-compound/references/session-history.md` | 与 F02 的读取边界和输出计数保持一致 |
| F20 | `skills/ce-compound/references/schema.yaml`、`skills/ce-compound/references/grounding-validation.md` | `skills/spec-compound/references/schema.yaml`、`skills/spec-compound/references/promotion.md`、`skills/spec-compound/references/grounding-validation.md` | 上游 `retire_when` 与本地失效条件的实际承载位置；已有等价语义不新增字段 |
| F21 | `skills/ce-compound-refresh/references/investigate.md`、`skills/ce-compound-refresh/references/schema.yaml` | `skills/spec-compound-refresh/references/investigate.md`、`skills/spec-compound-refresh/references/schema.yaml` | 失效条件和 consumer 对齐；不建立第二知识库 |

### F3. 兼容性与其他 Skill 的比对边界

| 输入 | 本地先读文件 | 修改条件 |
|---|---|---|
| `src/commands/install.ts`、`src/utils/resolve-output.ts`、`src/converters/claude-to-opencode.ts` | `src/cli/adapters/opencode.js`；沿其实际调用链定位路径/入口 owner | 仅确认本地存在同型 absolute-path 或 package entry 缺陷后，修改命中的调用点 |
| `src/utils/model.ts` | `src/cli/adapters/claude.js`、`src/cli/claude-settings.js` | 找到本地实际模型映射 consumer 才改；若无相同机制则 evidence-only，不能为追平 CE 凭空添加 alias 配置 |
| `src/targets/kiro.ts` 删除、`skills/ce-setup/SKILL.md` 及其引用 | `src/cli/adapters/platform-registry.js`、`src/cli/adapters/kiro.js`、`skills/spec-runtime-setup/SKILL.md` | Kiro 保留；registry/adapter 当前仅为检查集，setup 只有适用差额才改 |
| `skills/ce-code-review/references/cross-model-review.md`、`skills/ce-code-review/scripts/peer-job-runner.py` | `skills/spec-code-review/references/cross-model-review.md`、`skills/spec-code-review/scripts/peer-job-runner.py` | 默认只读保护检查；身份隔离/有界等待确有缺口才局部补强，不改变 dormant/外发授权 |
| 其余 H5 Skill source | `candidate-owner-map.json` 中每条路径的既有 owner 入口及实际引用闭包 | 属 U9 的 208 条目前只有读取导航；完整净 patch 尚未比较，不能先写成全部待改文件 |

**本地合同的条件修改文件：** `docs/contracts/verification/ce-upstream-adjudication-input.schema.json`、`docs/contracts/verification/ce-upstream-adjudication.schema.json`、`docs/contracts/verification/ce-upstream-ledger-patch.schema.json`。先修改脚本中错误的历史假设；能保持 schema 字段/枚举语义时不改 schema。确需修改表示或消费者语义时执行版本/reader 迁移并补回归，不能用 schema 变化掩盖未决裁决。

### F4. 配套测试与实际修改范围

| 对比组 | 本地验证入口 |
|---|---|
| F04–F11 review | `tests/unit/spec-code-review-contracts.test.js`、`tests/unit/spec-code-review-mechanics.test.js`；peer runner 实际修改时再执行 `tests/unit/spec-code-review-peer-runner.test.js` |
| F12–F14 work/commit | `tests/unit/spec-work-execution-strategy-contracts.test.js`、`tests/unit/spec-work-shipping-contracts.test.js`、`tests/unit/spec-commit-push-pr-context-contracts.test.js`、`tests/unit/spec-commit-scope-regression.test.js` |
| F15–F16 PR feedback | `tests/unit/spec-resolve-pr-feedback-contracts.test.js` |
| F17–F18 optimize | `tests/unit/spec-optimize-decide.test.js`、`tests/unit/spec-optimize-contracts.test.js`、`tests/unit/spec-optimize-loop-contracts.test.js` |
| F19–F21 compound | `tests/unit/session-history-scripts.test.js`、`tests/unit/compound-promotion-contracts.test.js`、`tests/unit/spec-compound-reference-contracts.test.js`、`tests/unit/spec-compound-refresh-reference-contracts.test.js` |
| F3 CLI | 按命中 owner 选择 `tests/unit/opencode-adapter.test.js`、`tests/unit/claude-settings-hook-paths.test.js`、`tests/unit/platform-registry-patterns.test.js`、`tests/unit/release-continuity-opencode.test.js` |

测试入口是需运行或按行为缺口扩展的文件，不表示全部需要修改。每组完成后输出三份精确集合：已比较的 CE 文件、已比较的本地文件、实际修改文件；实际修改集才计入同步实现变更。每条“无需改造”保留本地等价实现或排除依据。625 条不直接移植清单继续有效；本节不恢复这些文件为待实施任务。

## Implementation Units

以下单元是可直接执行的 source-first 改造任务。每个单元完成后必须写入 owner receipt；未满足验收条件时保持 `planned` 或 `blocked`，不得顺延关闭。

### U0. 冻结窗口并建立执行账本

- **Goal：** 把 CE `153e605e..00d0a5bb` 固定为本轮唯一输入，并建立不覆盖历史产物的新输出目录。
- **Requirements/KTD：** R1/R2/R6/R9；KTD1/KTD2/KTD4/KTD7。
- **Dependencies：** 无。执行前确认上游工作树 clean、base 为 head 祖先、目标仓库 dirty manifest 已记录。
- **Files：** `scripts/check-ce-upstream-reconciliation.cjs`（只读审查参数）、`docs/validation/ce-pull-2026-10-27/window-snapshot.json`、`name-status.tsv`、`commits.tsv`、`path-inventory.json`、`commit-path-coverage.json`、`git-object-inventory.json`。
- **Approach：** 以完整 SHA、目标 HEAD、读取时间、source/inventory hash 建立 window identity；所有后续命令显式传入 `--ce-repo`、`--base`、`--head` 和新产物路径。禁止默认参数写入旧窗口。
- **Test scenarios：** 输入当前冻结快照，运行 Git 计数与 hash 重放；期望 161 commits、1,023 净路径、A516/M494/D10/R3，且上游 clean。输入一个不存在的 ref；期望退出并保留 `blocked`，不生成可关闭账本。
- **Verification：** `git diff --check`；解析 `window-snapshot.json`、`verification.json`；复核目标仓库只新增本轮文档/验证产物。
- **Execution note：** 本单元的冻结事实已完成，执行实现时只需重放并确认 freshness。

### U1. 参数化 reconciliation producer 并生成新窗口事实

- **Goal：** 消除 `FULL_WINDOW_FACTS=517` 等历史绑定，生成可供 adjudication 的 1,023 条事实输入，同时保留旧窗口回归。
- **Requirements/KTD：** R2/R6/R9；KTD3/KTD7。
- **Dependencies：** U0；先完成 U1 才能生成正式 adjudication input。
- **Files：** `scripts/check-ce-upstream-reconciliation.cjs`；`docs/contracts/verification/ce-upstream-adjudication-input.schema.json`；`docs/contracts/verification/ce-upstream-ledger-patch.schema.json`；`docs/contracts/verification/ce-upstream-adjudication.schema.json`；`tests/unit/ce-upstream-reconciliation-v2.test.js`；`tests/unit/ce-upstream-3-20-reconciliation.test.js`。
- **Approach：** 将窗口事实、输出目录、路径总数、hash 和 package queue 改为输入/派生值；旧 3.20 fixture 继续走兼容分支。增加 rename/delete、重复路径、端点漂移、hash mismatch、缺记录的 fail-closed 校验。脚本只生成事实，不决定 `target_action`。
- **Test scenarios：** 输入新窗口 1,023 条 name-status 与 commit/path join；期望生成 schema 合法 input。输入旧 517 条 fixture；期望旧测试仍通过。删除一条记录或改一条 blob OID；期望退出非零并给出 reason code，不写 passed ledger。
- **Verification：** `node --check scripts/check-ce-upstream-reconciliation.cjs`；运行两个 reconciliation 单测文件；确认 `reconciliation-probe.json` 中的 517 错误被新参数路径替代。
- **Execution note：** 不得只把 517 替换为 1023；必须同时覆盖动态窗口和历史兼容。

### U2. 吸收 review 的有界证据与 diff 读取机制

- **Goal：** 将 CE review 的 lite/focused/full、删除文件消费者检查、staged diff 分段读取和 verified peer confidence 规则增量映射到本地 review owner。
- **Requirements/KTD：** R3/R4/R6/R8；KTD3/KTD5。
- **Dependencies：** U1；U7-A 对 `spec-code-review` 路径完成准入裁决后执行。
- **Files：** `skills/spec-code-review/SKILL.md`；`skills/spec-code-review/references/diff-scope.md`；`skills/spec-code-review/references/finish-review.md`；`skills/spec-code-review/scripts/review-scope.py`；`skills/spec-code-review/scripts/findings-mechanics.py`；`skills/spec-code-review/scripts/peer-job-runner.py`；`tests/unit/spec-code-review-contracts.test.js`；`tests/unit/spec-code-review-mechanics.test.js`；`tests/unit/spec-code-review-peer-runner.test.js`。
- **Approach：** 保留本地 cross-model admission、provider receipt 和 dormant 默认；只移植有界读取、删除后消费者存活检查、测试 reviewer 的 false-confidence/test-only seam、可靠性 reviewer 的实际失败代价门槛及 maintainability 的 unrequested surface 检查。不得引入 CE 默认外发授权、acpx 或 Antigravity。
- **Test scenarios：** 输入 lite scope、staged diff 超过分段阈值、删除被引用文件；期望 scope 可解释、读取有界且发现存活消费者。输入未 verified 的 peer finding；期望 confidence 不提升。输入无真实失败代价的 I/O 缺口；期望不报告为 blocker。
- **Verification：** 运行三个 `spec-code-review` 单测文件和 `npm run lint:skill-entrypoints`；fresh-source eval 若 dispatch 不可用则记录 `not-run`。
- **Execution note：** 该单元不改变跨模型授权合同，任何 provider 变更转入 deferred scope。

### U3. 对齐 work 执行策略与 dirty/index 安全

- **Goal：** 吸收顺序依赖 inline、parallel wave、canonical/transport commit 分离及 shared workspace index ownership；强化 ignored file 冲突时停止规则。
- **Requirements/KTD：** R3/R7/R9；KTD2/KTD6。
- **Dependencies：** U1；与 U2 无源码依赖，可并行审查，实施时先 work 再 PR tail。
- **Files：** `skills/spec-work/references/execution-strategy.md`；`skills/spec-work/references/implementation-loop.md`；`skills/spec-work/references/shipping-workflow.md`；`skills/spec-commit-push-pr/SKILL.md`；`skills/spec-commit-push-pr/references/branch-creation.md`；`skills/spec-commit-push-pr/references/commit-and-push.md`；`skills/spec-commit/SKILL.md`；`tests/unit/spec-work-execution-strategy-contracts.test.js`；`tests/unit/spec-work-shipping-contracts.test.js`；`tests/unit/spec-commit-push-pr-context-contracts.test.js`；`tests/unit/spec-commit-scope-regression.test.js`。
- **Approach：** 顺序依赖默认 inline，独立任务才进入 parallel wave；worker 不写 shared index；分支切换使用 `--no-overwrite-ignore`，ignored 冲突停止并报告，不 stash/remove。保留本地更强的 dirty/index 授权与 scope 保护。
- **Test scenarios：** 输入有依赖的两个任务；期望同一执行上下文顺序完成。输入独立任务；期望可形成 wave 但 canonical commit 仍由 owner 完成。输入 ignored 文件冲突和预存 staged hunk；期望零覆盖、零静默 stash，并返回阻断原因。
- **Verification：** 运行列出的四个 focused test 文件、`npm run typecheck`；验证无 generated runtime 修改。
- **Execution note：** 不引入 CE 的 commit/PR 授权默认值。

### U4. 对齐 PR feedback resume、范围交接与 optimize 合同

- **Goal：** 让发布后 resume、out-of-scope feedback、local fix/commit/push/reply 权限分离，并补强已有 optimize paired baseline/holdout fail-closed 语义。
- **Requirements/KTD：** R4/R5/R8/R9；KTD3/KTD5。
- **Dependencies：** U3；先确认现有 pipeline-return 和 authority admission，再做增量修改。
- **Files：** `skills/spec-resolve-pr-feedback/SKILL.md`；`skills/spec-resolve-pr-feedback/references/evaluation-rubric.md`；`skills/spec-resolve-pr-feedback/references/full-mode.md`；`skills/spec-resolve-pr-feedback/references/pipeline-return.md`；`skills/spec-optimize/SKILL.md`；`skills/spec-optimize/scripts/decide.cjs`；`skills/spec-optimize/scripts/measurement-admission.cjs`；`tests/unit/spec-resolve-pr-feedback-contracts.test.js`；`tests/unit/spec-optimize-contracts.test.js`；`tests/unit/spec-optimize-loop-contracts.test.js`；`tests/unit/spec-optimize-decide.test.js`。
- **Approach：** out-of-scope feedback 写入后续 PR 清单，security/data-loss 走 needs-human；resume 只能消费调用方发布后的 receipt。optimize 复用本地 `decide.cjs`，补 paired baseline 缺失、immutable eval/holdout、task/proposer 分离的合同，不引入 CE `decide.mjs`、remote worker 或后台 tick。
- **Test scenarios：** 输入发布后带新 feedback 的 resume；期望只处理 scope 内项并留下 follow-up。输入缺 baseline 或修改 holdout；期望 fail closed。输入无 push/reply 授权；期望保留本地修复并回交，不执行外发。
- **Verification：** 运行列出的 PR/optimize 单测；对新字段执行 schema/fixture replay；remote/provider 证据保持 `not-run`。
- **Execution note：** 若发现需要新 public provider 或外发面，停止本单元并拆独立方案。

### U5. 改进 compound/session history 与知识失效边界

- **Goal：** 吸收 session metadata 读取窗口扩大、读取失败与无 metadata 分离、`retire_when` 失效条件，同时避免建立第二知识权威。
- **Requirements/KTD：** R3/R8/R9；KTD3/KTD5。
- **Dependencies：** U1；先完成 `spec-project-rules`/`spec-rule-miner`/`docs/solutions` owner 对照。
- **Files：** `skills/spec-compound/scripts/session-history/extract-metadata.py`；`skills/spec-compound/references/session-history.md`；`skills/spec-compound/references/promotion.md`；`skills/spec-compound-refresh/references/investigate.md`；`tests/unit/session-history-scripts.test.js`；`skills/spec-project-rules/SKILL.md`；`skills/spec-rule-miner/SKILL.md`；`tests/unit/spec-compound-reference-contracts.test.js`；`tests/unit/spec-compound-refresh-reference-contracts.test.js`。
- **Approach：** 将 25 行读取扩大到 200 行并区分 error/no-metadata 计数；复用本地 `invalidation_condition`，只有缺少等价语义时才映射 `retire_when`。Packs 仅作 reference-only/compose 候选，暂不新增 durable source、远程 cache 或 CLI。
- **Test scenarios：** 输入 metadata 位于 26-200 行；期望被发现。输入读取异常；期望 error 计数递增而非 no-metadata。输入已有 `invalidation_condition`；期望不产生重复字段或第二失效机制。
- **Verification：** 运行 `tests/unit/session-history-scripts.test.js` 与两个 compound focused test 文件；确认 `docs/solutions` 仍为唯一知识沉淀 owner。
- **Execution note：** 远程 Git source、cache freshness 和 Pack resolver 留在 deferred。

### U6. 修复局部 CLI、路径、模型 alias 与宿主兼容性

- **Goal：** 只吸收能映射到本地 CommonJS CLI 的 Windows absolute path、Claude model alias、OpenCode package entry 兼容修复。
- **Requirements/KTD：** R3/R5/R7；KTD2/KTD6。
- **Dependencies：** U3 和本包 U7-A；必须先确认当前 registry 的受支持宿主列表。
- **Files：** `src/cli/adapters/platform-registry.js`；`src/cli/adapters/kiro.js`（仅消费者审查，不默认删除）；`src/cli/claude-settings.js`；`src/cli/adapters/opencode.js`；`src/cli/adapters/claude.js`；`tests/unit/platform-registry-patterns.test.js`；`tests/unit/claude-settings-hook-paths.test.js`；`tests/unit/opencode-adapter.test.js`；`tests/unit/release-continuity-opencode.test.js`。
- **Approach：** 先逐调用点确认是否存在与 CE 相同的路径/模型/入口缺陷；没有同型缺陷则以源码证据裁决 evidence-only，不为追平 CE 制造改动。确有缺陷时修复对应调用点并补 fixture；Windows 风格路径测试需区分 native `path` 与 `path.win32`，不能宣称 POSIX 的 `path.isAbsolute` 能识别 Windows drive。模型 alias 保留用户配置优先级；OpenCode 只调整已确认受影响的本地 adapter。保留 Kiro adapter，禁止机械同步 CE 删除。
- **Test scenarios：** 输入 POSIX、Windows drive、UNC 和相对路径；期望绝对路径正确识别且无越界。输入旧/新 model alias；期望 canonical config 可解析。运行 package entry smoke；期望入口可加载。
- **Verification：** `npm run typecheck`、相关 unit/smoke/build；macOS 不能冒充 Windows host 验证，Windows 分支证据不足时标记 `pending-verification`。
- **Execution note：** CE Bun/Jekyll/package tooling、Antigravity、新宿主和 Kiro 删除均 product-exclusion/deferred。

### U7. 建立 CE 派生回归 fixtures 与逐路径裁决门

- **Goal：** 为已采纳语义建立最小正负例，并确保 1,023 条路径逐行有 action 或明确 deferred/unresolved。
- **Requirements/KTD：** R2/R4/R6/R8/R9/R10；KTD3/KTD4/KTD5。
- **Dependencies：** U7-A 只依赖 U1，按包在 U2-U6/U9 实施前完成；U7-B 依赖对应实施单元，执行后验证 closure。任何实现单元不得跳过 U7-A。
- **Files：** `docs/contracts/verification/ce-upstream-adjudication-input.schema.json`；`docs/contracts/verification/ce-upstream-adjudication.schema.json`；`docs/validation/ce-pull-2026-10-27/candidate-owner-map.json`；本窗口目录下 adjudication/ledger/receipts；`tests/unit/ce-upstream-reconciliation-v2.test.js`；各 owner focused fixtures。
- **Approach：** 先生成 input 并 join 历史排除附件：H1 按产品包、H2/H3/H4 按 evidence-only 组 count/hash + rule + exception list 收口；不要求为它们生成改造任务或逐文件 source/test receipt。H5 的 398 条先判断适用性，确认差额后才映射 U2-U6/U9。每行保留合法 action/profile；source-adjudication 记录 owner/unit/targets/source/test refs，产品排除按 schema 使用 null owner/unit 与空 targets。19 条有界阅读只作 seed，不代表候选包已审完。
- **Test scenarios：** 输入重复 path、缺 owner、generated runtime path、deferred provider path；期望分别被拒绝、标记 unresolved、归 source/runtime boundary、进入 deferred。输入完整 ledger；期望 schema/join/hash/closure 全通过。
- **Verification：** schema 校验、path count/hash replay、profile 分组核对；仅已采纳 source 变更要求 owner receipt join；未裁决候选有显式 `not-run`/`degraded`，已按规则关闭的证据组不伪标未实施失败。
- **Execution note：** 这是实施准入门，不允许通过“package summary”关闭。

### U8. 汇总验证、交接与关闭

- **Goal：** 单写者合并 receipts，形成可回源 handoff；仅在实际实施完成后更新 lifecycle。
- **Requirements/KTD：** R8/R9/R10；KTD5/KTD6/KTD7。
- **Dependencies：** U7-B 及 U2-U6/U9 中所有已采纳单元；runtime projection 需额外授权。
- **Files：** `docs/validation/ce-pull-2026-10-27/verification-run-summary.json`、`honest-closeout.md`、`owner-receipts/`、`CHANGELOG.md`；必要时 `docs/contracts/workflows/fresh-source-eval-checklist.md` 结果引用。
- **Approach：** 记录真实命令、exit code、日志路径、reason code、freshness、claim ceiling 和未执行项。source 变更先验证，runtime 只 dry-run；不执行 commit/push/PR。
- **Test scenarios：** 输入所有 owner receipts 均 confirmed；期望生成 completed verification summary。输入任一必需 focused test 失败；期望整体保持 incomplete，不能写 `status: completed`。可选 runtime 未授权只记 not-run，不阻塞 source 同步范围的完成，也不产生 runtime 完成声明。
- **Verification：** `git diff --check`、JSON parse、链接检查；必要时按影响面运行 `npm run test:unit`/smoke/integration/build。
- **Execution note：** 本轮当前仅完成方案和冻结证据，U8 的实施收口尚未发生。

### U9. 补齐重点单元之外的已有 Skill owner 增量

- **Goal：** 为候选导航中其余 208 条提供明确承接单元，避免重点包以外的范围遗漏；208 是导航数，不是待改造文件数。
- **Requirements/KTD：** R3/R4/R5/R8/R9；KTD3/KTD4/KTD5。
- **Dependencies：** U1 与每个包自身 U7-A；不依赖 U2-U6 全部完成。接收 U2/U4 的 review/plan 共享合同变化时再建立具体 consumer 依赖。
- **Files：** 以 `candidate-owner-map.json` 的 U9 逐文件导航为读取集；本地以 `skills/spec-plan/SKILL.md`、`skills/spec-brainstorm/SKILL.md`、`skills/spec-doc-review/SKILL.md`、`skills/spec-write-skill/SKILL.md`、`skills/spec-lfg/SKILL.md` 及同表其余已存在 owner 为准。仅修改已确认差额所在文件，不全量重写包。
- **Approach：** 按 D5 的链路逐包比较；producer/consumer 一起核对，保留 readiness、授权、provider 与 source/runtime 边界。`ce-bakeoff`、`ce-noslop` 和新 `wtf` 入口不创建同名 Skill，记录待决策与可能复用的现有能力；不伪称已有 canonical owner。
- **Test scenarios：** requirements-only plan 被 work 拒绝；ready plan 消费成功；reference 缺失不能关闭；Skill authoring preview 不写 runtime；LFG 无提交授权时回交；新 public Skill 未决时保持 deferred。
- **Verification：** 按实际修改包选择已有 `tests/unit/spec-plan-consumer-replay-contracts.test.js`、`tests/unit/spec-doc-review-contracts.test.js`、`tests/unit/spec-write-skill-contracts.test.js`、`tests/unit/spec-lfg-contracts.test.js` 等 owner 聚焦测试；每个 receipt 写实际完整 argv，不能以入口存在作为通过证据。
- **Execution note：** 同包存在等价复用、采纳和 deferred 混合时保留逐路径结果，不为生成单值 package summary 强制同一 action。

### Execution dependency order

`U0 → U1 → U7-A（按包准入）→ U2-U6/U9（按依赖实施）→ U7-B（验收）→ U8`。U2-U6/U9 各自只消费已完成 U7-A 的包；U6 保持其 U3 依赖。未审包可以继续审查，但不能实施。U7 发现 unresolved owner、产品面或授权缺口时，回退对应单元并保持未关闭。

## 文件级改造设计

### D1. Reconciler 的动态窗口与历史兼容

本轮扩展现有脚本，不新增同步 runner。当前已回源的耦合点及改造要求如下：

| 当前源码点 | 问题 | 改造设计 | 验收条件 |
|---|---|---|---|
| `parseArgs` / `main` | CLI 无法传入 `runtime.fullWindowFacts`，默认回到旧窗口 | 增加 `--window-facts <repo-relative-json>`，用于 prepare 与 full-window；非历史窗口必须显式提供所有输出路径 | 缺 manifest、refs 不匹配、输出落入历史目录，均在首次写文件前拒绝 |
| `assertFullWindowFacts` | 固定 total/status/group/hash | 读取具名窗口事实并与 Git 对象重新计算结果比对，保留历史只读验证分支 | 新 1,023 和旧 517 分母都可验证；篡改期望计数不能绕过 Git hash |
| `PACKAGE_IDS` / surface mapping / `buildAdjudicationInput` | 固定旧 P01–P33，不能覆盖新增包和 `skills/CODING_STANDARDS.md` | 通过当前路径集合确定 package 候选；用仓库相对 package path 作新窗口稳定 ID；共享规范单独作 support source，不误认 Skill | 新包、共享文件、`.agents/skills/ce-skill-work` 均可登记；旧 package ID 不改写 |
| `buildPackageSummary` | 同包要求单一 action、unit、profile，且按 package 数量相等误用旧 G01 分母 | 正式逐路径 ledger 仍为权威；包导航只聚合数量和记录引用，不强制同包同 action，也不把导航结果反写成语义裁决 | 同一 review 包可同时包含采纳与 deferred 路径；不得为凑单值修改裁决 |
| `groupFor` / `v2RoleFor` | G06 兜底不能代表语义排除 | 保持 G01–G06 分类兼容；H1–H5 是独立范围维度，不按 group 自动决定 action | H5 中 `site/**` 和 CLI source 分别按实际角色裁决 |
| `isRunOutput` / `canonicalSourceFiles` | 新窗口输出未登记，生成证据可能改变自己的 source snapshot | 为本窗口枚举精确 run-owned input/output/ledger/patch/log 文件与目录，纳入既有 hash scope contract；计划、schema、source/test 仍计入 hash | 重跑证据生成不产生自漂移；修改 source 或计划会失效；不能用整个 `docs/validation/**` 排除规避漂移 |
| `validateAdjudicationArtifact` / patch merge | 全量输入 join、owner、快照和字段约束需随窗口贯通 | 所有校验函数显式接收相同 window facts、package manifest 与 scope contract；保留 owner 和 patch 可修改字段白名单 | 错 window、错 unit、越权改 action、base ledger hash 漂移均拒绝 |

**Manifest 设计：** 计划在 U1 生成 `docs/validation/ce-pull-2026-10-27/window-facts.json`，包含 `repository`、完整 `base/head`、`total`、`status_counts`、`group_counts`、`name_status_sha256`、`changed_path_sha256`、package 路径集合与精确输出 allowlist。前七类事实从 Git 端点和冻结清单计算，LLM 不填计数或 hash；allowlist 只决定可写产物位置，不决定采纳范围。该文件当前尚未生成，也不能把旧自描述 snapshot 冒充它。

**Schema 兼容：** input/output v1 继续保持合法 action 与 closure profile。若内部 reconciliation 包汇总的表示形状必须改变，则给该内部产物提升版本、保留旧 reader 并更新 `ce-upstream-reconciliation-v2.test.js`；不能在标记为 v2 的结果中静默改字段类型。新 package ID 是不透明字符串，只有依赖固定 P-ID 的 consumer 才需兼容迁移；G01–G06 不新增枚举。

**Closure 与目录分组解耦：** 旧 `validateAdjudicationArtifact` 按 G01 强制 source-adjudication、按非 G01 强制 evidence-only。U1 必须替换该推导：group/role 仍由路径事实确定；profile 则由经审查的逐路径处置决定，并验证合法组合。产品排除必须 action=out-of-scope-by-product-decision、status=not-applicable、owner/unit=null、targets=[]；evidence-only 必须 action=evidence-only、targets=[]，提供负责核对的 group owner/unit 与真实规则/验证引用；source-adjudication 必须有本地 owner/unit/targets 和 source/test 依据，可承载 G04 CLI 行为映射。G01 的纯参考路径可为 evidence-only，已有等价实现的 source-adjudication targets 指向真实既有 source，不表示文件已修改。增加 G01 纯参考、G04 适用修复、错误 profile/action、空目标和产品排除字段冲突的正负例；不能只放宽枚举而取消约束。

**当前单元合并顺序：** 新窗口从具名 manifest 读取当前 unit 顺序，不复用只支持旧 U2a/U2b/U5a 等 ID 的 `MERGE_ORDER`。本轮默认证据合并顺序为 U2、U3、U4、U5、U6、U9、U7；未产生 patch 的单元跳过，U0/U1 的 source 准备在建立该快照的 ledger 前完成，U8 仅汇总。此顺序是确定性证据合并顺序，不替代包实施依赖。每轮同一 unit 的多包 receipts 由唯一 writer 汇总为一份不重复 affected_paths 的 patch，尤其 U9 不能把多个同 unit patch 直接交旧 merger。校验未知/重复 unit、重复 path、错 base hash；所有 patches 必须绑定同一轮快照与顺序合并后的 ledger hash。U7-A/U7-B 是阶段标签，正式 patch 使用合法 unit_id=U7，不把带连字符的阶段名塞入 v1 schema。

**跨 source 快照策略：** 本轮保留 v1 patch 的“同 source 快照证据更新”含义：base/result snapshot 均等于 current ledger snapshot，patch 不迁移 source。任一 source 改动后重建 result input 和 adjudication/ledger，核对此前准入理由与 source/test refs 的有效性，再在该 result snapshot 上合并证据；旧 receipt 保留其真实输入与结果引用，不原地改写成新运行。source 变化前尚无正式全量 ledger 时，使用包级准入记录与 receipts，最终在稳定 result snapshot 建立正式 ledger。遇到需要跨快照 transition 的 patch 则拒绝并重新绑定，不削弱现有两处 snapshot 相等校验，不新增 v2 patch 协议。回归应证明同快照 patch 可合并、跨快照 patch 拒绝、source 变化后重新生成的 ledger 可验、旧证据不能凭换 hash 自动恢复 confirmed。

**部分准入与完整关闭：** 当前 `validateAdjudicationArtifact` 要求全量 records。U7-A 可先在有源引用的包级工作账本完成语义准入并实施；完整窗口正式 output 则在所有路径有合法处置后生成。未决项不得填假 action 凑满 1,023 条。若 deferred 新产品始终无法形成正式合法 output，则报告已采纳子集完成、整窗 incomplete，最后完整同步节点仍不前移；不为通过校验而冒充产品永久排除。

### D2. Review 的具体增量与保护面

| 修改点 | 本地 source | 要求 |
|---|---|---|
| diff 阅读深度 | `skills/spec-code-review/references/diff-scope.md`、`skills/spec-code-review/scripts/review-scope.py` | depth 是语义阅读策略，不能删 coverage；staged diff 按 path/有界段读取，保留未读范围，不能把输出截断记作审完 |
| 删除文件消费者 | 同上与 `skills/spec-code-review/references/personas/api-contract-reviewer.md` | 从删除路径查找存活 imports、配置、命令、文档入口；仅有名称命中不生成 confirmed finding，必须回源实际 consumer |
| confidence promotion | `skills/spec-code-review/scripts/findings-mechanics.py` | 当前 `independent_reviewer` 对 `adversarial-*` 检查 `independence_verified`，其他 name 默认 true；对照 CE patch 明确需要 receipt 的来源，不把普通同模型 persona 冒充独立模型，也不误删本地合法 persona 合并语义 |
| persona 审查门槛 | `skills/spec-code-review/references/personas/testing-reviewer.md`、`skills/spec-code-review/references/personas/reliability-reviewer.md`、`skills/spec-code-review/references/personas/maintainability-reviewer.md` | 分别检查虚假测试信心、真实失败代价、未请求的新表面/依赖；不把机械关键词当 finding 判定 |
| finish 上下文 | `skills/spec-code-review/references/finish-review.md` | 先确认 scope、coverage、verified finding、未完成项均保留；只有确实能减少重复读取才拆 leaf，不为跟随上游新增 agent topology |

必须保留 `cross-model-review.md` 的外发/凭据/身份 admission。至少回归普通 persona、未 verified peer、verified peer、伪造 provider 标识、重复 finding、删除 consumer、截断 diff 七种情况；确定性脚本测试覆盖结构/去重/拒绝分支，语义充分性另用 fresh-source 场景评估，结果分别记录。

### D3. Work、提交辅助与 PR feedback

- 在 `execution-strategy.md` 明确“依赖链默认 inline，独立工作才可派发”；是否派发仍由真实宿主能力和当前授权决定。transport commit 仅服务隔离 worker 返回，不自动成为 canonical commit；shared checkout 的 worker 不写 index。
- 在 `spec-commit-push-pr` 的实际分支切换说明与调用点使用 `git switch --no-overwrite-ignore` 或相应 checkout 选项；先检查当前 Git 支持。冲突时返回具体路径，不移除 ignored 文件，也不自动 stash。
- Git 安全回归必须在临时 repo 内实际构造 ignored collision、已暂存无关 hunk、未暂存重叠文件，前后比较文件内容与 index tree；单纯检查文案含选项不算行为通过。
- PR feedback 以真实 PR head、评论 ID、scope、调用方 return mode 为恢复依据。相同 receipt 重放不重复发布、不重复 resolve thread；本轮不运行真实发布验证。scope 外的问题给出理由和 follow-up，不静默丢弃；security/data-loss 风险升级给 owner。
- U4 内 PR 与 optimize 两个子包分别准入、分别 receipt：PR 依赖 U3 的回交合同；optimize 没有 PR 源码依赖，可在自身 U7-A 后独立处理。

### D4. Compound 与 optimize：优先复用已存在机制

`skills/spec-compound/scripts/session-history/extract-metadata.py` 当前 `MAX_LINES=25`，且已有 `process_file` 的 error 返回及 `parse_errors` 计数。因此本轮只扩大到 200，并对照 CE 判断“无 metadata”是否已与 I/O error 区分；不预设必须新增字段。边界用例为第 25、26、200、201 行 metadata、空文件、损坏 JSONL、不可读路径、批量输入部分失败；201 行之外保持有界读取，不应为追求发现率无限读文件。若确需改变 summary JSON，必须先核对 `session-history.md` 与 `session-history-scripts.test.js` consumer。

本地 `invalidation_condition` 已是知识晋升合同；CE `retire_when` 仅在语义不等价时映射，不添加重复字段。规则/solutions 的语义采用仍由 LLM 判断，脚本不按关键字自动晋升知识。

`skills/spec-optimize/scripts/decide.cjs` 已拒绝 paired candidate 缺少对应 baseline。执行时先重放现有负例并比对净 patch；该行为等价即记录复用，不再“补实现”。剩余候选只处理 holdout 不可变、样本配对身份、独立确认的真实缺口。task/proposer model 分离是实验角色说明，不能据此启动新 provider、增加费用或传递凭据。

### D5. 其余 Skill 与跨 consumer 链路

重点包之外由 U9 承接，导航表覆盖全部 398 条候选路径，详见 [候选 owner 导航](../validation/ce-pull-2026-10-27/candidate-owner-map.md) 及 [逐文件映射](../validation/ce-pull-2026-10-27/candidate-owner-map.json)。这些映射只决定先读哪里，不等于已做采纳裁决。

每个 owner 执行以下有界比较：入口/触发条件 → 上游净 patch → 相关逐提交 patch → 本地 source 与直接 consumer → 适用差额 → 最小补丁或等价依据。只读与改造文件分开记录；references 必须读取其实际引用闭包，不能只看 `SKILL.md`。rename/delete 还需检查旧路径存活引用。

| 跨 owner 链路 | 必须守住的合同 | 最低回归 |
|---|---|---|
| brainstorm → plan → tasks → work | readiness 与 lifecycle 分离；正文足够且声明一致；不删除本地字段 | requirements-only 不执行、implementation-ready 可消费、失效 plan/hash 被拒绝 |
| doc-review/code-review/POV → work | finding/source refs、授权、receipt 和 degraded 状态可追溯 | 缺引用、不可信 peer、review 未完成都不能变成 clean |
| debug → work/shipping | 已有 root-cause 与验证证据；修复不自动授权提交 | fixed-but-uncommitted、scope 外根因、缺测试证据 |
| write-skill → source/runtime | CE authoring source 映射本地 `spec-write-skill`；不直接写 generated mirror | 非法目标路径拒绝、preview 不写入、promotion 缺 evidence 阻断 |
| LFG → work/review/compound | 编排复用现有 owner，不重建 babysit-pr 状态机 | caller return、失败保持、无授权不发布 |
| setup → CLI/adapters → doctor | registry 是宿主事实源；readiness 不证明 loader 已加载 | Kiro 保留、不同宿主分别记录、source/runtime drift 明示 |

### D6. 命令、产物与验证执行顺序

以下命令用于后续实施；本轮未运行产品测试。仓库根目录执行，`CE_REPO` 指向只读上游 checkout。新增 `--window-facts` 在 U1 完成前不可运行。

1. **U1 验证：**

   ```bash
   node --check scripts/check-ce-upstream-reconciliation.cjs
   npm run test:jest -- --runInBand --runTestsByPath tests/unit/ce-upstream-reconciliation-v2.test.js tests/unit/ce-upstream-3-20-reconciliation.test.js
   ```

2. **U1 完成后的 prepare：** `window-facts.json` 由 U1 根据 Git 生成，不能手工拼凑。写入 producer 专属文件，不覆盖原始冻结 inventory/name-status。

   ```bash
   node scripts/check-ce-upstream-reconciliation.cjs --refresh --prepare-adjudication \
     --ce-repo "$CE_REPO" \
     --base 153e605e1622154a0d7da095fceed13edcb68bf7 \
     --head 00d0a5bbf1300b2138b65ce724b325dd4dff77ba \
     --window-facts docs/validation/ce-pull-2026-10-27/window-facts.json \
     --name-status docs/validation/ce-pull-2026-10-27/producer-name-status.tsv \
     --inventory docs/validation/ce-pull-2026-10-27/target-source-inventory.json \
     --adjudication-input docs/validation/ce-pull-2026-10-27/adjudication-input.json
   ```

   此命令生成事实，不生成语义 output。U7-A 基于 input + scope filter + 当前 source 产出包级准入记录。所有路径处置完整后，再用 `--full-window --adjudication <本轮output> --ledger <本轮ledger> --summary <本轮summary>` 并显式重复相同 refs、facts、name-status、inventory 和 input 参数生成正式 ledger；不使用历史默认输出。

3. **每个已改 owner 验证：** 用该单元列出的具体 Jest 路径运行 `npm run test:jest -- --runInBand --runTestsByPath ...`。Python 改动优先执行直接调用当前磁盘脚本的既有测试；Git 侧效应用临时 repo 验证。只更改文档而不影响行为时不新增实现镜像测试。
4. **共享 source/Skill 改动后：** 执行 `npm run check:shared-references`、`npm run lint:skill-entrypoints`、`npm run typecheck`。若修改的是共享源，只通过既有 `sync:shared-references` 规则生成 source 副本；该操作不授权 runtime apply。
5. **最终组合检查：** 本窗口涵盖多个 workflow 且可能改变 CLI 时，在已通过 focused tests 后执行 `npm test`、`npm run build`、`git diff --check`。若最终实际只有独立文案/零行为补丁，则记录收窄验证的依据，不为凑检查运行无关全量测试。
6. **fresh-source 验证：** 对实际变更的 Skill 按 `docs/contracts/workflows/fresh-source-eval-checklist.md` 运行未缓存源码场景；多 agent 未授权或宿主不可用则记 `not-run` 并注明原因，不能用同会话加载旧定义替代。
7. **runtime：** 只在需要时执行 `node bin/spec-first.js init --dry-run`，逐宿主记录生成候选；不得在这轮方案阶段执行。真实 apply、模型、外发、PR/CI 和 field 结果单列，不作为本地绿色检查的推论。

**证据落点：** U1 保留初始失败 `reconciliation-probe.json`；实现日志放本窗口 `logs/`；owner receipt 记录输入快照、相关上游 paths、实际 changed files、状态、命令/exit code/log refs、等价复用依据和 limitations。U9 各包分 receipt，避免一个“大包通过”掩盖失败。所有 receipt 都以实际运行补全，不预填 passed。

### D7. 失败恢复、迁移和同步节点推进

- 任一 owner 改动后 source hash 变化，重新绑定本轮 input/output 与 receipt，历史判定理由可复用但必须检查其 source refs 是否仍有效。新报告输出不能改变自身 source snapshot；D1 的精确 run-output allowlist 必须先落地。
- 回退以本次拥有的 hunk/file 为范围；执行前后保存 changed set 和内容指纹。存在用户混合修改时保留其内容，不用 `git reset --hard`、整文件 checkout 或目录删除回退。
- 包级准入不等于整窗完成。`source-adjudication` 需要适用行为及必要测试证据，`evidence-only` 需要组 hash/rule/exception，`product-excluded` 需要明确产品依据。
- 所有本窗口记录满足对应 closure、必要测试通过、source snapshot 一致后，才可提出把“最后已完整同步节点”从 `153e605e` 更新为 `00d0a5bb`。只完成首批包或有 unresolved 路径时保留旧节点，并记录已采纳子集与恢复入口。
- source 同步完成与 runtime 投射、真实模型行为、远程 landing 分别声明。本文 `status: active` 表示执行尚未完成；本轮仅交付规划，不提前写实现 receipt 或最后节点。

## Interface Contracts

- **Reconciliation input/output：** input 每行绑定 upstream path/status/blob OID、window identity、target snapshot 和 schema version；output 只能引用 input 中存在的 path，必须包含 schema 规定的 owner/unit/action/evidence/source/test/limitations 字段，取值按 closure profile 校验；产品排除允许 null owner/unit 与空 targets，不强造本地实施目标。任何重复、缺项、hash mismatch 或端点漂移均 fail closed。
- **Target action：** 保持现有 v1 schema 枚举。设计层 `reuse/extend` 映射 `implement-in-current-owner`；`compose` 原样；`reference-only` 映射 `evidence-only`；`product-exclusion` 映射 `out-of-scope-by-product-decision`。`deferred/unresolved` 是队列处置状态，不是合法 `target_action`；未裁决记录保留在工作账本，不能捏造正式 output。正式 output 的 `evidence_status` 保持 `planned|confirmed|not-applicable`，`degraded` 单独记录。
- **Closure profile：** 保持现有 `source-adjudication|evidence-only|product-excluded`，分别要求 source/test 证据、无实施的适用性理由、明确产品排除依据。单元运行状态另记在 receipt，不塞入 schema 字段。U1 如需放宽历史 group/package 约束，必须同步 input/output/patch schema 与 consumer 测试；无需修改的 v1 字段保持兼容。
- **Source snapshot/hash：** source tree hash、inventory hash、blob OID 和 runtime projection hash 分开记录；冻结的 HEAD tree hash 不包含 dirty 内容，实施前另存实际 changed files 内容 hash 与 dirty manifest，每次 source 变化重新绑定 input/output，禁止用旧 snapshot 关闭新变更；generated runtime hash 不能作为 source 变更证明。
- **Owner receipt（已采纳变更）：** 必须包含 changed files、source refs、命令、exit code、测试结果、limitations、授权边界和 claim ceiling；已采纳 source 变更无 receipt 不得关闭；evidence-only/product-excluded 以分组或产品依据关闭，不伪造实现 receipt。
- **Compatibility/rollback：** 保留旧 3.20 producer fixture 和旧 schema consumer；新 producer 失败时回到 raw inventory，不覆盖旧证据。source 改动按 owner 单元回退，禁止用 runtime mirror 反向修复 source。

## System-Wide Impact

影响面按 source、consumer、证据和尾部动作分层：`skills/` 是行为 source；`scripts/` 与 `docs/contracts/verification/` 负责确定性事实和 schema；`tests/`/fixtures 是回归 consumer；`docs/validation/ce-pull-2026-10-27/` 保存本窗口证据；`templates/` 与八宿主 runtime 仅在 source 验证后考虑 projection；`src/cli/` 涉及 Claude、Codex、Cursor、Kiro、Qoder、OpenCode、ZCode、Pi 的 registry/adapter 影响；provider、外发、PR/CI、commit/push 属于独立授权尾部。不得因某一层绿色推断其他层已完成。

## Alternatives And Decision

| Alternative | Decision | Reason |
|---|---|---|
| 机械复制 CE 全窗口 | 拒绝 | 会复制 duplicate owner、外发授权和宿主专属面，无法证明 consumer 兼容 |
| 只做 package-level 摘要 | 拒绝 | 无法满足逐路径 owner、hash、测试和 limitation 合同 |
| 先适配 producer，再按 owner 分包实施 | 采用 | 先恢复可复核事实，再让语义裁决决定最小 source 变更 |
| 同步 CE provider/runtime、新宿主、remote optimize | deferred | 需要独立产品、凭据、真实宿主和外部通信证据 |
| 退役本地 readiness 或 Kiro | 本轮拒绝 | 会破坏已有 work consumer 或受支持宿主合同 |

## Verification Contract

### Deterministic Checks

- CE base/head/tag 和目标 repo HEAD 可回源；
- `git diff --name-status -M`、路径 hash、commit/path join 和 ledger count 一致；
- adjudication input/output 符合对应 schema；
- 每条记录按 source-adjudication、evidence-only、product-excluded 校验字段和允许空值，不为排除项捏造 owner/unit/test；
- 无 generated runtime 被当作 source owner；
- 无旧窗口 path count、hash 或完成状态混入新 ledger。

### Focused Checks

每个单元列出的 Jest 文件用 `npm run test:jest -- --runInBand --runTestsByPath <该单元的完整测试路径列表>` 执行；每次保存实际 argv、exit code 与日志。已有等价行为只补必要缺口测试，不添加仅匹配文案的重复断言。

至少运行与变更面匹配的：

```text
node scripts/check-ce-upstream-reconciliation.cjs ...
node --check <changed-script>
npm run lint:skill-entrypoints
npm run typecheck
相关 tests/unit/*contract*.test.js
```

命令和具体测试路径必须由当前 source discovery 确认，不在计划阶段编造不存在的测试。跨 Skill/CLI 影响时再扩大到 `npm run test:unit`、`npm run test:smoke`、`npm run test:integration` 和 `npm run build`。

### Runtime And Field Ceiling

`node bin/spec-first.js init --dry-run` 或等价 projection 只证明生成候选和 drift facts；apply、doctor、宿主加载、真实模型、PR/CI、浏览器/Xcode、生产和用户收益必须有独立证据。缺少证据时对应状态保持 `not-run` 或 `degraded`。

## Failure Handling And Recovery

| Failure | Required response |
|---|---|
| CE ref 不存在、窗口变化或远端不稳定 | 冻结当前记录为 blocked，重新确认 immutable refs；不继续用旧 ledger |
| 目标仓库 dirty overlap | 保留用户改动，按 hunk/owner 隔离；无法隔离则停止写入 |
| path/hash/count 不一致 | 拒绝 ledger merge，回到 U0/U1 修复输入或 producer |
| owner 不明或涉及新产品面 | 保持 unresolved，进入产品/计划决策，不猜测 owner |
| schema/join 失败 | 保留原始日志和失败 reason code，不手工 patch 结果文件 |
| focused test 失败 | 归因并修复；必要时回到 owner；不得用其他绿色检查覆盖 |
| fresh-source/provider/runtime 能力不可用 | 走 inline/fallback，明确独立覆盖未执行，收窄 claim ceiling |
| commit/landing 未授权 | 保持本地未提交，输出 verified handoff，不 push/PR |

## Definition Of Done

- 新 CE 窗口有 immutable upstream snapshot 和 target snapshot；
- 新 ledger 逐路径覆盖，schema、join、hash 和状态一致；
- 所有适用路径都有当前 owner、action、source/test refs 和 limitations；
- source/test 变更只落在 canonical source，未手改 generated runtime；
- 必要 focused verification 有真实命令、退出码、日志和 reason code；
- fresh-source、runtime、provider、PR/CI 和 field 证据的未执行范围明确可见；
- 新 handoff 可由下一个 owner 回源，不依赖会话声明或旧 workspace；
- 旧计划和历史验证不被改写；
- readiness 与 lifecycle 分开：输入、范围和实施设计明确后才设 `artifact_readiness: implementation-ready`；执行与必要验证完成后才设 `status: completed`，二者不能互相替代。

## Open Questions And Execution-Time Unknowns

- 原阅读覆盖中的 1,004 条 inventory-only 不等于待改造清单。历史范围映射后 H5 共 398 条仍需适用性判断，H1-H4 共 625 条按产品排除或 evidence-only profile 收口；正式 schema/join/closure 尚未执行。
- provider、宿主、public Skill、外部通信、remote optimize 和 Packs 是否进入产品仍保持 deferred；触发时需另立产品/授权方案。
- fresh-source eval、runtime projection、Windows-native、真实 PR/CI 和 field outcome 的可用性在执行时确认；不可用时按 claim ceiling 降级。
- commit/landing 授权仍不属于本方案；完成 U8 只产生未提交 handoff，不改变远程节点。

窗口 identity、已确认的本地合同和首批 owner 边界已在本方案中固定；执行期只对上述未知项建立证据或保留明确状态，不重新打开已裁决的 R01–R04。

## Evidence And Limitations

- 方法来源：[2026-08-19-003-refactor-ce-post-3-20-full-window-sync-plan.md](2026-08-19-003-refactor-ce-post-3-20-full-window-sync-plan.md)，用于复用同步边界、账本字段、owner 映射原则和证据分层；其旧 upstream range、517-path 分母和 completed 状态不作为本方案事实。
- 执行来源：[2026-09-09-001-refactor-ce-pull-129-commit-sync-execution.md](2026-09-09-001-refactor-ce-pull-129-commit-sync-execution.md)，用于复用逐 patch 核对、串行 owner-local 实施和逐项证据要求；其 129 commit range 不作为本方案事实。
- 当前可复用机制：`scripts/check-ce-upstream-reconciliation.cjs`、两个 adjudication schema、`tests/unit/ce-upstream-reconciliation-v2.test.js`、provider receipt schema 和 fresh-source checklist；执行时仍需重新检查 drift。
- 本方案已完成新 CE range 的确定性冻结，并将 producer adaptation、owner-local source/test 变更、分层裁决、接口合同和验收场景拆成 U0-U9；因此方案 readiness 为 `implementation-ready`。正式语义 adjudication、source changes、runtime projection 和同步完成状态仍未发生，不能把本方案 readiness 解读为 CE 更新已同步。

## 2026-10-27 窗口冻结记录

- **上游窗口：** `153e605e1622154a0d7da095fceed13edcb68bf7..00d0a5bbf1300b2138b65ce724b325dd4dff77ba`
- **上游仓库状态：** clean；base 是 head 的祖先；161 个 commits。
- **变更路径：** 1,023；状态为 `A=516`、`M=494`、`D=10`、`R063=2`、`R076=1`。
- **路径分类：** `tests=473`、`skills=359`、`docs=113`、`root-or-package=44`、`host-or-config=15`、`cli-runtime=10`、`ci=4`、`scripts=3`、`assets=2`。
- **目标仓库快照：** spec-first `HEAD=59cb4cb130a31bb1a2335add80d570b87a8b40d4`；初次冻结已有 4 个 dirty paths；原清理记录保留，本文和 CHANGELOG 本轮补充，未实施产品同步。
- **冻结产物：** [window-snapshot.json](../validation/ce-pull-2026-10-27/window-snapshot.json)、[name-status.tsv](../validation/ce-pull-2026-10-27/name-status.tsv)、[commits.tsv](../validation/ce-pull-2026-10-27/commits.tsv)、[path-inventory.json](../validation/ce-pull-2026-10-27/path-inventory.json)、[freeze-summary.md](../validation/ce-pull-2026-10-27/freeze-summary.md)。
- **工具阻塞：** `scripts/check-ce-upstream-reconciliation.cjs --prepare-adjudication --ce-repo ... --base ... --head ...` 已实际运行，但被 `full-window path count must be 517, got 1023` 阻断；脚本的历史 `FULL_WINDOW_FACTS`、默认 ledger/inventory 路径和摘要标题仍绑定 CE post-3.20 窗口。该失败保留为 `tooling-adaptation-required`，未修改旧脚本或旧产物。
- **当前结论：** U0 Git 事实冻结 confirmed（哈希边界见 snapshot-supplement）；U1 producer adaptation 待处理；U2 已开展有界准入审查，但正式逐路径 adjudication 未完成。owner 实施、runtime projection 和实现验证未开始。冻结不等于同步完成。

## 本文档复核记录

2026-10-27 完成内联一致性复核，修正规划与实施交接顺序、readiness/lifecycle 混用，以及历史脚本默认输出可能覆盖旧证据的风险。已核对所列现有脚本、schema、测试与清单文件存在，并检查文档链接和 diff 格式。未执行独立 Agent 审查、新窗口同步、模型测评或实现测试。

## 本窗口准入审查结果

[审查报告](../validation/ce-pull-2026-10-27/review-report.md) 已记录 R01–R04：计划 readiness 契约冲突、跨模型授权/身份差异、Kiro 删除适用性及历史 producer 固定分母。建议按语义分包吸收，保留当前本地合同，不直接覆盖源码。

[覆盖清单](../validation/ce-pull-2026-10-27/review-coverage.json) 区分 19 条有界直接阅读与其余 1,004 条仅盘点；全窗口逐路径裁决完成数为 0，整体审查 partial/degraded。161 个提交路径已冻结，不代表逐提交语义审完。新的快照/清单是原始事实格式，未通过正式 adjudication schema/join/closure。

当前方案为 `implementation-ready`，最后已同步上游节点不变；本轮只深化执行方案和冻结证据，未改写历史同步完成记录，未实施产品同步。

## Deferred 登记与恢复条件

| 范围 | 负责 owner | 恢复条件 | 本轮处置 |
|---|---|---|---|
| acpx/Antigravity/新 provider 外发 | 产品 owner + spec-code-review | 独立范围、接收方/凭据授权、真实身份 receipt 与失败回收证据明确 | 不激活 dormant route |
| remote optimize、后台 tick | spec-optimize owner | 独立任务/预算/resume/远程写权限和 holdout 完整性方案 | 仅本地已有协议补强 |
| Compound Packs durable source/cache | 知识架构 owner | 证明现有 rules/solutions 无法承载，完成 source/cache/consumer 决策 | 不新增知识权威 |
| polish live mode、新宿主/public Skill | 产品 owner | 具体需求、现有 owner 不适用的证据及验证方案 | 不纳入首批实施 |
| readiness 字段退役 | spec-plan + spec-work owner | 单独 producer/consumer/历史兼容迁移与 replay | 保留本地合同 |

2026-10-27 方案深化复核：修正 schema 枚举映射、session-history source owner 与 U7 前后两段门禁；本轮只验证文档路径、链接、格式与已有证据 JSON。产品实现测试、fresh-source 行为测评和 runtime 投射未运行。

2026-10-27 范围修订：从历史方案恢复不移植与产品排除规则，增加 1,023 条当前路径的范围映射。625 条无需直接移植，398 条仅为适用性候选；修正此前将全部 inventory-only 路径要求逐文件语义补审的过度范围。此范围附件未经正式 adjudication producer 校验，不更新最后同步节点。

2026-10-27 详细技术设计补充：增加 D1-D7 的函数级改造、逐行为保护面、命令顺序、快照自漂移处理与同步节点条件；增加 U9 承接其余已有 owner，以及 398 条完整候选路径导航。候选映射为 advisory，未声明净 patch 全部审完，未执行实现。

2026-10-27 文件清单与审查补充：新增 F1-F4 的 CE→本地具体比对/修改/验证文件，补入 branch-creation 实际调用点；D1 明确 closure/profile 解耦、当前 U9 合并顺序、同快照 patch 和跨快照重新生成策略。仅修改方案，未实施相应源码与测试。
