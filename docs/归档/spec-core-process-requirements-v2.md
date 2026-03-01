# Spec 核心流程需求文档（公司级，最佳实践版）v2.1

> 基线：Spec-First v7.1（方法论参考）
> 日期：2026-02-09
> 设计原则：不受当前实现约束，按目标态最佳实践定义
> 命令规范：所有对外操作统一为 `/spec-first:xxxx`

## 1. 目标与范围

### 1.1 建设目标

- 建立公司统一的 Spec-Driven 研发流程标准。
- 将“需求-设计-开发-测试-发布”转为可追踪、可审计、可自动化闭环。
- 将 AI 协作纳入标准作业流，降低个体差异造成的质量波动。

### 1.2 范围

- 覆盖：Feature 级流程（`00_init` 到 `07_release` + `08_done/09_cancelled`）。
- 不覆盖：企业发布平台策略、绩效考核、模型训练与托管。
- 适用：多人协作、跨模块依赖、长期维护的业务能力。

### 1.3 非目标

- 不以该流程替代项目管理工具（排期、资源管理）。
- 不在本版定义组织级经营分析指标口径。

## 2. 术语与角色

### 2.1 术语

- FR：Functional Requirement
- NFR：Non-Functional Requirement
- AC：Acceptance Criteria
- DS：Design Section
- TC：Test Case
- Gate：阶段准出门禁
- SCA：Spec Consistency Analysis

### 2.2 角色职责

| 角色 | 核心职责 | 决策权 |
|---|---|---|
| PM | 需求边界、优先级、业务验收 | 需求签核、UAT 签核 |
| Tech Lead | 技术方案与流程守护 | Gate 放行、例外审批 |
| Developer | 按 TASK 实现与自测 | 代码提交与修复承诺 |
| QA Lead | 测试策略、覆盖性与风险控制 | 测试放行建议 |
| Architect | 架构一致性与技术演进 | L 规模架构裁决 |
| AI Agent | Skill 编排执行、文档与校验辅助 | 无业务裁决权 |

### 2.3 RACI（核心活动）

| 活动 | PM | TL | Dev | QA | Arch | AI |
|---|---|---|---|---|---|---|
| 需求规格化 | A | R | C | C | I | R |
| 技术设计 | C | A | R | C | R | R |
| 任务拆解 | C | A | R | C | I | R |
| 实现评审 | I | A | R | C | C | R |
| 测试验收 | A | C | R | R | I | R |
| 发布放行 | I | A | C | C | I | R |

## 3. 核心原则（强制）

- `PR-001` 单一真理源：`spec.md`、`design.md`、`traceability-matrix.md` 为基线。
- `PR-002` 全链路追踪：设计、任务、代码、测试、PR 必须追溯到 FR/NFR。
- `PR-003` Gate 阻断：Gate 未通过不得推进阶段。
- `PR-004` 人在回路：AI 生成结果必须人工确认后才能写入。
- `PR-005` 终态不可逆：`08_done/09_cancelled` 不可回退。
- `PR-006` 统一入口：所有用户操作必须在 Claude 内执行。
- `PR-007` 统一语法：所有对外命令必须支持 `/spec-first:xxxx`。
- `PR-008` 默认可审计：关键动作必须记录操作者、时间、输入摘要、输出结果。

## 4. 目标架构（To-Be）

### 4.1 分层模型

- 编排层（Skill）：流程编排、上下文恢复、交互确认、能力路由。
- 能力层（Engine）：ID、Gate、状态机、追踪矩阵、变更管理、度量计算。
- 执行层（Git/CI）：提交约束、流水线阻断、审计存证。

### 4.2 边界约束

- Skill 决策“何时做什么”；Engine 只做“确定性执行”。
- 任何自动修复必须先给出修复提案再执行。
- Git/CI 校验结果优先级高于本地预校验。

## 5. 统一命令体系（强制）

### 5.1 统一语法

- 语法：`/spec-first:<module> [subcommand] [args] [--flags]`
- 输出级别：默认人类可读；加 `--json` 输出机器可读。
- 演练模式：关键变更命令必须支持 `--dry-run`。

### 5.2 对外命令清单（P0）

- 流程编排：`/spec-first:plan`、`/spec-first:orchestrate`、`/spec-first:verify`
- 生命周期：`/spec-first:init`、`/spec-first:stage`
- 追踪治理：`/spec-first:id`、`/spec-first:matrix`、`/spec-first:gate`
- 变更治理：`/spec-first:rfc`、`/spec-first:defect`
- 运维诊断：`/spec-first:doctor`、`/spec-first:catchup`

### 5.3 命令契约（示例）

| 命令 | 必填参数 | 成功输出 | 失败输出 |
|---|---|---|---|
| `/spec-first:init` | `--feat --mode --size` | `featureId, path, stage=00_init` | 错误码 + 修复建议 |
| `/spec-first:id` | `next <type> <abbr>` | `id, registryUpdated=true` | 错误码 + 冲突项 |
| `/spec-first:gate` | `check <featureId> --stage` | `PASS/WARN/FAIL + violatedRules[]` | 错误码 + 修复动作 |
| `/spec-first:stage` | `advance <featureId>` | `from, to, timestamp` | 错误码 + 未满足 Gate 列表 |
| `/spec-first:rfc` | `create/submit/approve` | `rfcId, status, impactSummary` | 错误码 + 审批缺失项 |

### 5.4 错误码标准

| Code | 名称 | 处理策略 |
|---|---|---|
| `0` | SUCCESS | 正常继续 |
| `10` | VALIDATION_ERROR | 修正输入后重试 |
| `20` | GATE_FAILED | 先修复 Gate 再推进 |
| `30` | STATE_CONFLICT | 刷新阶段状态后重试 |
| `40` | TRACE_VIOLATION | 修复 ID 链接关系 |
| `50` | PERMISSION_DENIED | 走审批或更高权限 |
| `99` | UNKNOWN_ERROR | 收敛日志并人工介入 |

## 6. 主流程需求（8+2）

### 6.1 全局状态机

- `FR-PROC-001` 状态必须按序流转：`00→01→02→03→04→05→06→07→08`。
- `FR-PROC-002` `09_cancelled` 可由任意非终态进入。
- `FR-PROC-003` 禁止跨阶段跳转，除非经 Critical RFC 批准并审计。

### 6.2 Mode 与 Size

- `FR-PROC-010` 支持 Mode N（新功能）与 Mode I（迭代）。
- `FR-PROC-011` Mode I 必须额外产出 `impact-analysis.md` 与 `regression-scope.md`。
- `FR-PROC-012` 支持 Size S/M/L；阶段不裁剪，仅交付深度可裁剪。

### 6.3 阶段明细（Entry/Activity/Deliverable/Exit）

#### `00_init`

- Entry：业务目标明确，已指派 PM 与 TL。
- Activity：初始化目录、读取 Constitution、确定 Mode/Size/Platforms。
- Deliverable：`stage-state.json`、`constitution.md`、`findings.md`、`task_plan.md`。
- Exit Gate：Feature 元数据完整且可解析。
- 命令：`/spec-first:init`、`/spec-first:stage current`。

#### `01_specify`

- Entry：`00_init` 完成。
- Activity：需求建模、FR/NFR 编号、AC 编写、歧义清理。
- Deliverable：`spec.md`、`traceability-matrix.md(初始化)`。
- Exit Gate：DoR 签核、`[NEEDS CLARIFICATION]` 为 0、FR/NFR 均有 ID。
- 命令：`/spec-first:id next FR`、`/spec-first:id next NFR`、`/spec-first:gate check`。

#### `02_design`

- Entry：`01_specify` Gate 通过。
- Activity：方案对比、架构决策、API/数据模型设计。
- Deliverable：`design.md`、`contracts/*`、`data-model.md`、`adr/*`。
- Exit Gate：设计评审通过、需接口需求 API 覆盖率 100%。
- 命令：`/spec-first:id next DS`、`/spec-first:id next API`、`/spec-first:matrix check`。

#### `03_plan`

- Entry：`02_design` Gate 通过。
- Activity：任务拆解、依赖建模、并行策略、验收清单。
- Deliverable：`task_plan.md`、`checklist.md`。
- Exit Gate：Task 覆盖率 100%、Task 合规率 100%。
- 命令：`/spec-first:id next TASK`、`/spec-first:matrix check`、`/spec-first:gate check`。

#### `04_implement`

- Entry：`03_plan` Gate 通过。
- Activity：按 TASK 开发、单测、代码评审、缺陷修复。
- Deliverable：代码变更、单测记录、CR 记录。
- Exit Gate：代码覆盖率达阈值、PR 合规率 100%、高危问题为 0。
- 命令：`/spec-first:gate check`、`/spec-first:matrix check`。

#### `05_verify`

- Entry：`04_implement` Gate 通过。
- Activity：测试设计、执行、缺陷回归、安全扫描、UAT。
- Deliverable：`test-report.md`、`security-report.md`、`uat-signoff.md`。
- Exit Gate：AC 通过、无高危、测试覆盖与合规达标。
- 命令：`/spec-first:id next TC`、`/spec-first:verify`、`/spec-first:gate check`。

#### `06_wrap-up`

- Entry：`05_verify` Gate 通过。
- Activity：归档审计、复盘、技术债登记、知识沉淀。
- Deliverable：`retro.md`、最终矩阵、归档清单。
- Exit Gate：矩阵闭合，关键文档齐套。
- 命令：`/spec-first:matrix export`、`/spec-first:verify full`。

#### `07_release`

- Entry：`06_wrap-up` Gate 通过。
- Activity：构建、Smoke、发布确认、观察项登记。
- Deliverable：`release-note.md`、`smoke-report.md`。
- Exit Gate：Smoke 通过，核心健康信号无异常。
- 命令：`/spec-first:stage advance`。

### 6.4 终态定义

- `08_done`：`07_release` 通过后进入，冻结本 Feature 状态。
- `09_cancelled`：任何阶段可取消，必须记录原因、影响、已投入成本。

## 7. 追踪体系需求（强制）

### 7.1 ID 规则

| 类型 | 格式 | 示例 | 正则 |
|---|---|---|---|
| FR | `FR-<FEAT>-NNN` | `FR-AUTH-001` | `^FR-[A-Z][A-Z0-9]{1,15}-\d{3}$` |
| NFR | `NFR-<DIM>-NNN` | `NFR-SEC-001` | `^NFR-[A-Z][A-Z0-9]{1,7}-\d{3}$` |
| DS | `DS-<FEAT>-NNN` | `DS-AUTH-001` | `^DS-[A-Z][A-Z0-9]{1,15}-\d{3}$` |
| API | `API-<SVC>-NNN` | `API-AUTH-001` | `^API-[A-Z][A-Z0-9]{1,15}-\d{3}$` |
| TASK | `TASK-<FEAT>-NNN` | `TASK-AUTH-001` | `^TASK-[A-Z][A-Z0-9]{1,15}-\d{3}$` |
| TC | `TC-<LVL>-<FEAT>-NNN` | `TC-E2E-AUTH-001` | `^TC-(UT|IT|E2E|ST)-[A-Z][A-Z0-9]{1,15}-\d{3}$` |
| ADR | `ADR-NNN` | `ADR-001` | `^ADR-\d{3}$` |
| RFC | `RFC-NNN` | `RFC-001` | `^RFC-\d{3}$` |

### 7.2 矩阵数据结构

- 行主键：`requirementId`（FR/NFR）。
- 必填列：`designRefs, apiRefs, taskRefs, testRefs, prRefs, status`。
- 状态枚举：`Planned/Implemented/Verified/Accepted/Deferred/Cancelled/Exception`。

### 7.3 指标与阈值（流程版）

- `TaskCoverage = coveredReqByTask / activeReq = 100%`
- `TestCoverageFR = coveredReqByTC / activeReq = 100%`
- `TaskCompliance = tracedTask / totalTask = 100%`
- `TCCompliance = tracedTC / totalTC = 100%`
- `PRCompliance = tracedPR / totalPR = 100%`
- `OrphanRate = orphanItems / allItems = 0%`
- `ACCoverage = coveredAC / totalAC`：S `>=80%`，M/L `>=90%`

### 7.4 例外机制

- 例外记录字段：`id, reason, risk, owner, expireAt, mitigation`。
- 单次 Gate 例外上限：活跃需求数的 10%。
- 过期自动升级 P0 风险并阻断后续 stage advance。

## 8. 横切治理机制（强制）

### 8.1 Gate 规则

- 每阶段定义规则编号、规则描述、判定表达式、失败修复建议。
- 判定结果：`PASS/WARN/FAIL`。
- `WARN` 需 Owner 显式批准；`FAIL` 必阻断。

### 8.2 SCA 规则

- `SCA-01` 需求内部一致性（FR/AC/NFR）。
- `SCA-02` 需求与设计一致性（FR↔DS/API）。
- `SCA-03` 需求与任务一致性（FR↔TASK）。
- `SCA-04` 需求与实现一致性（TASK↔PR）。
- `SCA-05` 需求与测试一致性（FR/AC↔TC）。

### 8.3 RFC 规则

- 分级：Minor（<=2 产物）、Major（3-5 产物）、Critical（>5 或架构级）。
- 审批：Minor=TL；Major=TL+PM；Critical=TL+PM+Architect。
- RFC 必含：动机、影响清单、风险评估、回滚策略、验证计划。

## 9. 数据与产出物规范

### 9.1 目录规范

- `specs/<featureId>/stage-state.json`
- `specs/<featureId>/spec.md`
- `specs/<featureId>/design.md`
- `specs/<featureId>/task_plan.md`
- `specs/<featureId>/traceability-matrix.md`
- `specs/<featureId>/reports/*`
- `specs/<featureId>/gate-history.jsonl`
- `specs/<featureId>/audit-log.jsonl`

### 9.2 关键文件字段（最小集）

**stage-state.json**

- `featureId`
- `mode`
- `size`
- `platforms[]`
- `currentStage`
- `stageHistory[]`
- `updatedAt`

**task_plan.md（每个 TASK）**

- `taskId`
- `title`
- `traces[]`
- `dependsOn[]`
- `owner`
- `status`

**audit-log.jsonl（每条事件）**

- `timestamp`
- `actor`
- `command`
- `featureId`
- `result`
- `summary`

## 10. 安全、权限与审计

### 10.1 权限模型

- PM/TL/QA/Architect/Dev 按角色授权执行命令。
- `/spec-first:stage advance`、`/spec-first:rfc approve` 必须受权限控制。
- 高风险操作需双人批准（4-eyes）。

### 10.2 审计要求

- 所有 Gate、Stage、RFC、Defect 状态变更必须入审计日志。
- 审计日志保留期不少于 365 天。
- 审计查询必须支持 `featureId`、`actor`、`dateRange` 过滤。

## 11. 非功能需求（NFR）

- `NFR-SEC-001` 安全：Verify 阶段必须执行依赖扫描与基础安全检查；涉及安全需求时强制 SAST。
- `NFR-REL-001` 可靠：状态机、Gate、RFC、Defect 变更必须可回放。
- `NFR-AUDIT-001` 审计：关键动作必须全量留痕。
- `NFR-USAB-001` 可用：关键操作均可通过 `/spec-first:xxxx` 单入口触发。
- `NFR-PERF-001` 性能：交互类命令 P95 响应 < 2s；重计算类命令 P95 < 10s。
- `NFR-OBS-001` 可观测：关键命令必须输出 traceId，支持跨系统关联排障。

## 12. 验收标准（DoD）

- `AC-001` 任意 Feature 可从 `00_init` 到 `08_done` 完整走通。
- `AC-002` 全流程操作者仅使用 `/spec-first:xxxx` 完成操作。
- `AC-003` Gate 失败自动阻断并附可执行修复建议。
- `AC-004` 覆盖率与合规指标满足流程阈值。
- `AC-005` RFC 自动输出影响范围并闭环变更。
- `AC-006` 审计日志可按 Feature 全量回放关键轨迹。
- `AC-007` Mode I 能自动产出影响分析与回归范围。

## 13. 验收测试用例（UAT）

- `UAT-001` 新建 Feature：从 init 到 specify 完成并生成 FR/NFR。
- `UAT-002` 设计 Gate：缺失 API 映射时必须 FAIL。
- `UAT-003` 任务合规：存在无 traces TASK 时必须 FAIL。
- `UAT-004` 测试合规：存在无 verifies TC 时必须 FAIL。
- `UAT-005` RFC Critical：缺少 Architect 审批时不得推进。
- `UAT-006` 终态约束：进入 `08_done` 后再次 advance 必须拒绝。
- `UAT-007` 审计回放：可重建某 Feature 的阶段推进与审批链。

## 14. 版本化策略（先流程，后数据）

- `V1 核心流程版`：主流程、追踪、Gate、RFC、审计闭环。
- `V2 数据运营版`：健康分、趋势分析、组织级治理看板。
