# Spec 核心流程需求文档（公司级）v1.2

> 基线来源：`docs/01需求文档/spec-first-v7.md`（v7.1，更新于 2026-02-09）  
> 文档日期：2026-02-09  
> 目标：建立公司级 Spec-First 核心流程标准，统一“需求→设计→开发→验证→发布”执行与治理。

> 范围声明（V1）：先完成核心流程闭环（阶段流转 + 追踪 + Gate + 变更），度量运营数据在后续版本迭代。

## 1. 文档目标与适用范围

### 1.1 目标

- 建立统一、可审计、可自动化的研发流程标准。
- 以结构化规范作为单一事实源（Single Source of Truth）。
- 将 AI 协作纳入流程治理，降低个人能力差异带来的质量波动。

### 1.2 适用范围

- 适用于：多人协作 Feature（>=2 人）、涉及 API/数据模型变更、跨团队依赖、需长期维护的核心业务。
- 不适用于：紧急 Hotfix、纯配置变更、非规范文档修订、单人 1 天内微调（可走简化流）。

### 1.3 流程边界

- 本流程覆盖：Feature 级从 `00_init` 到 `07_release`，含 `08_done/09_cancelled` 终态。
- 不覆盖：企业发布平台策略（蓝绿/金丝雀/回滚）、绩效考核、模型训练与私有化部署。

## 2. 设计原则（必须遵循）

- `PR-01` 规范即契约：所有交付以 `spec.md`/`design.md`/`traceability-matrix.md` 为准。
- `PR-02` 全链路可追踪：所有设计、任务、测试、PR 必须可反向追溯至 FR/NFR。
- `PR-03` Gate 前置放行：任一阶段 Gate 未通过，不得进入下一阶段。
- `PR-04` AI 在流程中：AI 可辅助生成，但不得绕过用户确认与 Gate 校验。
- `PR-05` 终态不可逆：进入 `08_done` 或 `09_cancelled` 后不可回退。
- `PR-06` 命令统一入口：所有流程命令由 Claude 执行，Skill 提供能力编排与调用。
- `PR-07` 命令统一语法：所有对外命令必须支持 `/spec-first:xxxx` 格式。

## 3. 角色与职责

- `PM`：需求定义、优先级判断、UAT 验收签核。
- `Tech Lead`：流程守护、Gate 放行、跨阶段一致性负责。
- `Developer`：按 TASK 实现、提交可追踪代码与 PR。
- `QA Lead`：测试设计与执行、安全评审、覆盖率达标。
- `Architect`：L 规模架构评审与 ADR 质量把关。
- `AI Agent`：通过 Skill 执行辅助生成、校验与上下文恢复。
- `CI/CD System`：执行提交前与流水线自动校验。

## 4. 核心流程需求（P0）

### 4.1 分层架构要求

- `FR-PROC-001` 必须采用双层架构：Skill 负责流程编排，CLI 负责确定性执行。
- `FR-PROC-002` 必须采用三层规范合并：Layer0（通用流程）+ Layer1（Mode×Size）+ Layer2（端规范）。
- `FR-PROC-003` CLI 不得主动编排流程，只响应 Skill 调用（不作为人工主入口）。
- `FR-PROC-004` 人工操作入口必须统一为 Claude 命令与 Skill 模式，不直接要求研发成员手动执行 CLI 子命令。

### 4.2 流程阶段要求（8+2）

- `FR-PROC-010` 必须实现 `00-07` 阶段状态机与准入准出。
- `FR-PROC-011` 必须支持终态 `08_done`/`09_cancelled`，且状态不可逆。
- `FR-PROC-012` 必须支持 Mode N（新功能）与 Mode I（迭代）；Mode I 必须增加历史定位、影响分析、回归验证。
- `FR-PROC-013` 必须支持 Size S/M/L 裁剪，原则为“阶段不跳过，产出物深度可裁剪”。

### 4.3 各阶段最低交付与 Gate

| 阶段 | 最低交付 | Gate 关键条件 |
|---|---|---|
| `00_init` | Feature 目录、元数据、运行态三文件初始化 | Mode/Size/Platforms 已确认 |
| `01_specify` | `spec.md`、`traceability-matrix.md` 初始化 | DoR 签核；无歧义标记；FR/NFR 全量分配 ID |
| `02_design` | `design.md`、`contracts/`、必要时 `data-model.md` | 设计评审通过；API 覆盖率=100% |
| `03_plan` | `task_plan.md`、`checklist.md` | Task 覆盖率=100%；Task 合规率=100% |
| `04_implement` | 代码、单测、CR 记录 | 代码覆盖率>=80%；PR 合规率=100% |
| `05_verify` | 测试/安全/UAT 报告 | AC 全通过；无高危漏洞；Test 覆盖率=100%；TC 合规率=100% |
| `06_wrap-up` | `retro.md`、完整矩阵、归档清单 | 实现覆盖率=100%；矩阵状态闭合 |
| `07_release` | Release Note、Smoke Test 报告 | Smoke Test 通过；核心指标无异常 |

## 5. 追踪体系需求（P0）

### 5.1 ID 体系

- `FR-TRACE-001` 必须支持 8 类 ID：`FR/NFR/DS/API/TASK/TC/ADR/RFC`。
- `FR-TRACE-002` ID 必须由 Skill 通过 `/spec-first:id ...` 触发底层 CLI 生成，禁止手工编造。
- `FR-TRACE-003` 必须维护 `specs/.feat-registry.md`，确保 FEAT 缩写全局唯一且废弃不复用。

### 5.2 引用与矩阵

- `FR-TRACE-010` TASK 必须包含 `traces`（至少 1 个 FR/NFR）。
- `FR-TRACE-011` TC 必须包含 `verifies`（至少 1 个 FR/AC/NFR）。
- `FR-TRACE-012` PR 必须关联至少 1 个 TASK ID。
- `FR-TRACE-013` 必须维护 `traceability-matrix.md` 并按阶段持续补全。

### 5.3 覆盖率与合规阈值

- `FR-TRACE-020` Task 覆盖率=100%。
- `FR-TRACE-021` Test 覆盖率（FR 级）=100%。
- `FR-TRACE-022` AC 级覆盖率：M/L >=90%（S 不强制）。
- `FR-TRACE-023` 实现覆盖率=100%。
- `FR-TRACE-024` Task/TC/PR 合规率均=100%。
- `FR-TRACE-025` 孤儿项率=0%。

### 5.4 豁免治理

- `FR-TRACE-030` 必须支持 Known Exception List，并将 Exception 条目排除出分母。
- `FR-TRACE-031` 豁免比例上限 10%，且必须有解除时间。
- `FR-TRACE-032` 过期未解除豁免必须升级为高优先级风险。

## 6. 横切机制需求（P0）

### 6.1 Quality Gate

- `FR-X-001` 每阶段必须定义 Gate Owner 与阻断条件。
- `FR-X-002` Gate 失败必须阻断流转，不允许强制跳过成为常态。
- `FR-X-003` Gate 结果必须记录到阶段产物与历史记录。

### 6.2 Spec-Consistency-Analysis（SCA）

- `FR-X-010` 必须在 5 个时机执行 SCA：Specify/Design/Plan/Implement/Verify 完成后。
- `FR-X-011` 不一致项必须在当前阶段闭环，不得带入下一阶段。
- `FR-X-012` 必须支持增量校验（仅校验本次变更影响范围）。

### 6.3 Change Management

- `FR-X-020` 任意阶段必须可触发 RFC。
- `FR-X-021` 变更必须按 Minor/Major/Critical 分级审批。
- `FR-X-022` 变更影响范围必须基于 ID 链自动定位（FR/API/TASK/TC/PR）。

## 7. 工具链能力需求

### 7.1 Claude + Skill 主入口（P0）

- `FR-TOOL-001` 人工交互入口必须统一为 Claude，且所有对外命令必须采用 `/spec-first:xxxx`。
- `FR-TOOL-002` Skill 必须作为能力提供层，负责流程编排、阶段切换、上下文恢复和能力调用。
- `FR-TOOL-003` Skill 执行必须遵循 5 阶段模型：上下文加载→AI 生成→用户确认→写入→副作用执行。
- `FR-TOOL-004` 命令语法必须支持：`/spec-first:<module> [subcommand] [args]`。

**对外命令最小集合（P0）**：

- `/spec-first:plan`
- `/spec-first:verify`
- `/spec-first:orchestrate`
- `/spec-first:init`
- `/spec-first:id`
- `/spec-first:gate`
- `/spec-first:stage`
- `/spec-first:matrix`
- `/spec-first:rfc`
- `/spec-first:defect`
- `/spec-first:doctor`

### 7.2 CLI 能力层（P0，Skill 内部调用）

- `FR-TOOL-010` 必须保留能力命令组：`init/id/gate/stage/matrix/rfc/defect/doctor`。
- `FR-TOOL-011` CLI 仅作为确定性原子能力层，由 Skill 内部调用，不作为人工主入口。
- `FR-TOOL-012` CLI 必须有可审计 Exit Code（成功/校验失败/配置错误/I-O 错误等）。

**命令映射要求（P0）**：

- `/spec-first:init` → `spec-first init ...`
- `/spec-first:id` → `spec-first id ...`
- `/spec-first:gate` → `spec-first gate ...`
- `/spec-first:stage` → `spec-first stage ...`
- `/spec-first:matrix` → `spec-first matrix ...`
- `/spec-first:rfc` → `spec-first rfc ...`
- `/spec-first:defect` → `spec-first defect ...`
- `/spec-first:doctor` → `spec-first doctor`

### 7.3 Hook 与 CI（P1）

- `FR-TOOL-020` Git/CI Hook 必须承担底线校验（commit-msg、pre-push、CI）。
- `FR-TOOL-021` AI Runtime Hook 作为增强层，可在 AI 场景实时反馈与阻断。
- `FR-TOOL-022` 纯人工场景下，流程校验不得依赖 AI Runtime Hook。

## 8. 产出物与数据规范（P0）

- `FR-ART-001` 必须采用标准目录：`specs/<featureId>/...`。
- `FR-ART-002` 运行态三文件必须持续更新：`progress.md`、`findings.md`、`task_plan.md`。
- `FR-ART-003` Gate 历史数据必须采用 JSONL 存储（`gate-history.jsonl`）。
- `FR-ART-004` 模板化初始化必须支持 `stage-state`、`constitution`、`matrix`、`gate-report`、`health-report`。

## 9. 度量运营需求（P1/P2，后续迭代）

- `FR-METRIC-001`（P1）应支持覆盖率报表自动生成与历史归档。
- `FR-METRIC-002`（P2）应计算 12 项核心指标（9 覆盖率 + 1 效率 + 1 质量 + 1 综合）。
- `FR-METRIC-003`（P2）应计算 Health Score 并输出健康等级。
- `FR-METRIC-004`（P2）应支持瓶颈规则识别（设计/测试/实现/合规/缺陷逃逸）。

## 10. 非功能需求（NFR）

- `NFR-SEC-001` 安全基线：Verify 阶段必须执行 OWASP Top 10 + 依赖扫描；存在 `NFR-SEC-*` 时强制 SAST。
- `NFR-REL-001` 可靠性：关键状态变更（stage/rfc/defect）必须可审计、可回放。
- `NFR-PERF-001` 性能目标（P2）：`validateId < 10ms`，`getCoverage < 50ms`，`evaluateGate < 200ms`。
- `NFR-USAB-001` 可用性：环境诊断能力必须可在 Claude 会话中通过 `/spec-first:doctor` 触发（底层由 `spec-first doctor` 执行）。

## 11. 当前建设状态与实施优先级

### 11.1 As-Is（截至 2026-02-09）

- 已具备：M1/M2/M4/M6、10 组 CLI、3 个协同 Skill、模板系统、基础校验链路。
- 已知缺口：M3 GateEngine 自动条件解析未完成；M5 AIOrchestrator 类型漂移。

### 11.2 分期建议

- `P0（立即）`：以 Claude 统一入口 + 3 协同 Skill 打通 8+2 主流程、追踪矩阵、Gate 阻断与 RFC 变更闭环。
- `P1（近期）`：完成 8 阶段 Skill 联调、Hook 双层体系、覆盖率报表自动化、关键命令类型一致性修复。
- `P2（中期）`：12 指标与健康分、M7 ToolIntegration、Layer2 多端扩展、性能 SLA、端到端集成测试。

## 12. 验收标准（流程上线 DoD）

- `AC-01` 任意 Feature 可从 `00_init` 无人工绕过推进到 `08_done`。
- `AC-02` 追踪矩阵中 Active 条目覆盖率与合规率满足阈值。
- `AC-03` Gate 失败可阻断推进，且有可执行修复建议。
- `AC-04` RFC 变更可自动给出受影响产物列表并闭环。
- `AC-05` V1 仅要求覆盖率类报表可生成；健康分与瓶颈分析纳入后续版本验收。
- `AC-06` 流程操作者仅需在 Claude 中执行命令，不要求直接操作 CLI。
- `AC-07` 文档定义的对外命令均可通过 `/spec-first:xxxx` 调用并成功路由到对应能力。
