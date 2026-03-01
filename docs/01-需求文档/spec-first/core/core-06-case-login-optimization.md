# Spec-First v7.1 — 案例：用户登录优化（新增登录方式）

> **模块**: 核心研发流程案例 #6
> **场景**: 现有登录流程优化，新增登录方式（Mode I）
> **适用文档**: `docs/01需求文档/v2`

---

## 1. 场景描述

### 1.1 需求输入

产品提出需求：

- 优化现有登录流程，降低登录流失。
- 在原有账号密码登录基础上，新增短信验证码登录。
- 前后端均涉及变更：`h5` + `java-backend`。

### 1.2 目标

- 用户登录成功率提升。
- 不破坏现有账号密码登录。
- 全流程可追踪、可审计、可验收。

---

## 2. 使用前准备（仅 npm 安装模式）

### 2.1 安装

```bash
npm install -g <package-name>
```

### 2.2 环境检查

```bash
/spec-first:doctor
```

期望结果：Node/npm/Git 与 `specs/` 目录状态检查通过。

---

## 3. 端到端执行步骤

> 以下使用示例 Feature ID：`FSREQ-20260209-AUTH-001`

### Step 0: 初始化 Feature（00_init）

```bash
/spec-first:init
/spec-first:stage current --feature FSREQ-20260209-AUTH-001
```

固定目录名示例（CLI 直调）：

```bash
spec-first init --feat AUTH --mode I --size M --platforms h5,java-backend --feature-id FSREQ-20260210-AUTH-001
```

执行后目录为：

```bash
specs/FSREQ-20260210-AUTH-001/
```

命令说明：

| 命令 | 作用 | 成功标志 |
|---|---|---|
| `/spec-first:init` | 交互式初始化 Feature，采集 mode/size/platforms 并创建标准目录与初始文件 | 生成 Feature 目录与初始运行态文件 |
| `/spec-first:stage current --feature FSREQ-20260209-AUTH-001` | 查询当前阶段，确认初始化已生效 | 输出当前阶段为 `00_init` |

关键产出：

- `specs/FSREQ-20260209-AUTH-001/stage-state.json`
- `specs/FSREQ-20260209-AUTH-001/stage-state.json`
- `specs/FSREQ-20260209-AUTH-001/findings.md`
- `specs/FSREQ-20260209-AUTH-001/task_plan.md`

Mode I 强制动作：

- 定位历史产物并读取已有 `spec/design/contracts/task_plan`。
- 读取并确认 `constitution.md` 约束后再进入下一阶段。

Gate 要点：Mode/Size/Platforms 已确认，历史产物定位完成，Constitution 已读取。

### Step 0.5: 运行态三文件节拍（v2 轻量）

在后续所有阶段执行中，统一采用轻量更新规则：

- `MUST`：当 Phase 标记为 `complete` 时，同一会话内同步更新 `task_plan.md` 与 `stage-state.json`。
- `SHOULD`：`findings.md` 仅记录关键决策、风险、取舍，不要求高频记录。
- `MUST NOT`：仅因 `findings.md` 未更新而阻断阶段推进。

建议在每次阶段推进前执行一次状态检查：

```bash
/spec-first:status FSREQ-20260209-AUTH-001
```

命令说明：

| 命令 | 作用 | 成功标志 |
|---|---|---|
| `/spec-first:status FSREQ-20260209-AUTH-001` | 查看健康度与三类轻量告警，用于推进前自检 | 输出健康度摘要与告警清单（仅提示不阻断） |

期望结果：输出健康度摘要，并仅告警（不阻断）以下三类问题：缺文件、阶段不一致、关键文件过旧。

### Step 1: 需求规格化（01_specify）

```bash
/spec-first:spec FSREQ-20260209-AUTH-001
/spec-first:verify FSREQ-20260209-AUTH-001 quick
/spec-first:stage advance --feature FSREQ-20260209-AUTH-001
```

命令说明：

| 命令 | 作用 | 成功标志 |
|---|---|---|
| `/spec-first:spec FSREQ-20260209-AUTH-001` | 生成/更新 `spec.md`，完成 FR/NFR/AC 结构化 | `spec.md` 与矩阵初始化完成 |
| `/spec-first:verify FSREQ-20260209-AUTH-001 quick` | 执行当前阶段快速校验（增量） | 返回 quick 校验通过 |
| `/spec-first:stage advance --feature FSREQ-20260209-AUTH-001` | 在 Gate 满足后推进阶段 | 当前阶段推进到 `02_design` |

建议在 `spec.md` 中形成：

- `FR-AUTH-001` 账号密码登录优化（错误提示与限流策略）
- `FR-AUTH-002` 新增短信验证码登录
- `NFR-SEC-001` 验证码安全策略（有效期、重试次数、风控）
- AC（Given-When-Then）覆盖主路径与异常路径

关键产出：

- `spec.md`
- `traceability-matrix.md`（初始化）
- `impact-analysis.md`（Mode I 必须）

Gate 要点：无歧义标记，FR/NFR 均完成 ID 分配。

### Step 2: 技术设计（02_design）

```bash
/spec-first:design FSREQ-20260209-AUTH-001
/spec-first:research FSREQ-20260209-AUTH-001 "短信验证码登录方案与风控策略"
/spec-first:verify FSREQ-20260209-AUTH-001 quick
/spec-first:stage advance --feature FSREQ-20260209-AUTH-001
```

命令说明：

| 命令 | 作用 | 成功标志 |
|---|---|---|
| `/spec-first:design FSREQ-20260209-AUTH-001` | 生成/更新技术设计主文档与契约骨架 | `design.md` 与 `contracts/` 产物可用 |
| `/spec-first:research FSREQ-20260209-AUTH-001 "短信验证码登录方案与风控策略"` | 补充调研结论与技术取舍依据 | `research.md` 落地关键结论 |
| `/spec-first:verify FSREQ-20260209-AUTH-001 quick` | 对设计阶段执行增量一致性与覆盖率检查 | 设计阶段 quick 校验通过 |
| `/spec-first:stage advance --feature FSREQ-20260209-AUTH-001` | 通过 Gate 后推进阶段 | 当前阶段推进到 `03_plan` |

设计建议覆盖：

- H5 登录页新增“短信登录”入口与交互状态机。
- Backend 新增验证码发送与校验 API。
- 频控、重放保护、验证码失效策略。

关键产出：

- `design.md`
- `contracts/*.yaml`
- `data-model.md`（如有字段变更）
- `adr/*.adr.md`（关键决策）

Gate 要点：需要接口的 FR 均有 API 映射（API 覆盖率 100%）。

### Step 3: 任务拆解（03_plan）

```bash
/spec-first:task FSREQ-20260209-AUTH-001
/spec-first:verify FSREQ-20260209-AUTH-001 quick
/spec-first:stage advance --feature FSREQ-20260209-AUTH-001
```

命令说明：

| 命令 | 作用 | 成功标志 |
|---|---|---|
| `/spec-first:task FSREQ-20260209-AUTH-001` | 将设计拆成可执行 TASK，并建立 `traces/depends_on` 关系 | `task_plan.md` 与 `checklist.md` 生成 |
| `/spec-first:verify FSREQ-20260209-AUTH-001 quick` | 校验 Task 覆盖率与合规率 | 任务阶段 quick 校验通过 |
| `/spec-first:stage advance --feature FSREQ-20260209-AUTH-001` | 通过 Gate 后推进阶段 | 当前阶段推进到 `04_implement` |

任务拆解建议：

- `TASK-AUTH-001` H5：新增短信登录 UI 与验证码倒计时
- `TASK-AUTH-002` Backend：发送验证码接口
- `TASK-AUTH-003` Backend：验证码登录校验接口
- `TASK-AUTH-004` 风控与限流策略接入

要求：每个 TASK 必须包含 `traces`，至少关联 1 个 FR/NFR。

关键产出：

- `task_plan.md`
- `checklist.md`

Gate 要点：Task 覆盖率 = 100%，Task 合规率 = 100%。

### Step 3.5: 会话中断恢复（可选，轻量单通道）

若 IDE 重启、上下文丢失或多人交接，先执行恢复再继续开发：

```bash
/spec-first:catchup FSREQ-20260209-AUTH-001
/spec-first:status FSREQ-20260209-AUTH-001
```

命令说明：

| 命令 | 作用 | 成功标志 |
|---|---|---|
| `/spec-first:catchup FSREQ-20260209-AUTH-001` | 基于 `stage-state.json` + 运行态三文件恢复上下文并输出摘要 | 输出当前阶段、当前任务、缺失文件清单 |
| `/spec-first:status FSREQ-20260209-AUTH-001` | 恢复后检查健康状态与告警 | 告警清单可用于继续执行前修正 |

恢复边界：

- 仅从 `stage-state.json` + `task_plan.md` + `findings.md` 恢复。
- 不扫描 transcript/会话日志。
- 恢复摘要必须包含缺失文件清单。

### Step 3.6: 多需求并行时的切换恢复（最佳实践）

当同一仓库存在多个需求（多个 `specs/<featureId>/`）时，先定位目标需求再恢复，避免串线。

标准流程（已启用 `feature` 命令时）：

```bash
/spec-first:feature list
/spec-first:feature switch FSREQ-20260209-AUTH-001
/spec-first:feature current
/spec-first:catchup FSREQ-20260209-AUTH-001
/spec-first:status FSREQ-20260209-AUTH-001
```

命令说明：

| 命令 | 作用 | 成功标志 |
|---|---|---|
| `/spec-first:feature list` | 查看当前仓库下需求列表与阶段状态 | 输出需求清单（含阶段/健康度） |
| `/spec-first:feature switch FSREQ-20260209-AUTH-001` | 切换当前工作需求 | 当前指针切换到目标 Feature |
| `/spec-first:feature current` | 确认当前工作需求 | 输出目标 Feature ID |
| `/spec-first:catchup FSREQ-20260209-AUTH-001` | 基于单通道文件恢复上下文 | 输出恢复摘要与缺失文件 |
| `/spec-first:status FSREQ-20260209-AUTH-001` | 检查恢复后的状态告警 | 输出健康度与告警，且不阻断推进 |

兼容流程（`feature` 命令未启用时）：

```bash
/spec-first:stage current --feature FSREQ-20260209-AUTH-001
/spec-first:catchup FSREQ-20260209-AUTH-001
/spec-first:status FSREQ-20260209-AUTH-001
```

最佳实践要点：

- 切换后第一件事是 `catchup + status`，再开始编码或改文档。
- 同一会话只处理一个 Feature，避免交叉写入 `stage-state.json/task_plan.md`。
- 提交前再次确认当前 Feature，防止将变更写入错误需求目录。

### Step 4: 实现开发（04_implement）

```bash
/spec-first:code FSREQ-20260209-AUTH-001 --task TASK-AUTH-001
/spec-first:code FSREQ-20260209-AUTH-001 --task TASK-AUTH-002
/spec-first:code FSREQ-20260209-AUTH-001 --task TASK-AUTH-003
/spec-first:code FSREQ-20260209-AUTH-001 --task TASK-AUTH-004
/spec-first:code-review FSREQ-20260209-AUTH-001
/spec-first:verify FSREQ-20260209-AUTH-001 quick
/spec-first:stage advance --feature FSREQ-20260209-AUTH-001
```

命令说明：

| 命令 | 作用 | 成功标志 |
|---|---|---|
| `/spec-first:code FSREQ-20260209-AUTH-001 --task TASK-AUTH-001` | 实现 H5 短信登录 UI 与验证码倒计时任务 | TASK-AUTH-001 完成并可追踪 |
| `/spec-first:code FSREQ-20260209-AUTH-001 --task TASK-AUTH-002` | 实现后端发送验证码接口任务 | TASK-AUTH-002 完成并可追踪 |
| `/spec-first:code FSREQ-20260209-AUTH-001 --task TASK-AUTH-003` | 实现后端验证码登录校验任务 | TASK-AUTH-003 完成并可追踪 |
| `/spec-first:code FSREQ-20260209-AUTH-001 --task TASK-AUTH-004` | 实现风控与限流接入任务 | TASK-AUTH-004 完成并可追踪 |
| `/spec-first:code-review FSREQ-20260209-AUTH-001` | 执行追踪合规与代码质量审查 | 产出 `reports/code-review-report.md` 且结论可用于 Gate |
| `/spec-first:verify FSREQ-20260209-AUTH-001 quick` | 实现阶段快速校验 | 实现阶段 quick 校验通过 |
| `/spec-first:stage advance --feature FSREQ-20260209-AUTH-001` | 满足 Gate 后推进阶段 | 当前阶段推进到 `05_verify` |

实现要求：

- 代码与 PR 需关联 TASK ID。
- 保持与 API 契约一致。
- 关键逻辑位置保留追踪注释。
- `/spec-first:code` 完成后必须执行 `/spec-first:code-review`，产出评审报告。
- 每个 TASK 达到完成状态时，同步更新 `task_plan.md` 与 `stage-state.json`。

关键产出补充：

- `reports/code-review-report.md`

Gate 要点：Code Review 通过，代码覆盖率达标，PR 合规率 = 100%。

### Step 5: 测试验证（05_verify）

```bash
/spec-first:test FSREQ-20260209-AUTH-001
/spec-first:verify FSREQ-20260209-AUTH-001 full
/spec-first:stage advance --feature FSREQ-20260209-AUTH-001
```

命令说明：

| 命令 | 作用 | 成功标志 |
|---|---|---|
| `/spec-first:test FSREQ-20260209-AUTH-001` | 执行测试设计与验证活动 | 产出测试、安全、UAT 相关报告 |
| `/spec-first:verify FSREQ-20260209-AUTH-001 full` | 执行全量校验（含更深引用与覆盖率） | full 校验通过，可安全切换阶段 |
| `/spec-first:stage advance --feature FSREQ-20260209-AUTH-001` | 验证通过后推进阶段 | 当前阶段推进到 `06_wrap_up` |

测试建议：

- 正向：短信发送、验证码登录成功。
- 逆向：验证码错误/过期/重试超限。
- 回归：原密码登录不受影响。
- 安全：暴力尝试、验证码重放、接口频控。

关键产出：

- `reports/test-report.md`
- `reports/security-scan.md`
- `reports/uat-signoff.md`
- `regression-report.md`（Mode I 必须）

Gate 要点：AC 达标、无高危漏洞、TC 合规达标、回归验证完成。

### Step 6: 收尾归档（06_wrap_up）

```bash
/spec-first:archive FSREQ-20260209-AUTH-001
/spec-first:verify FSREQ-20260209-AUTH-001 full
/spec-first:stage advance --feature FSREQ-20260209-AUTH-001
```

命令说明：

| 命令 | 作用 | 成功标志 |
|---|---|---|
| `/spec-first:archive FSREQ-20260209-AUTH-001` | 执行归档与复盘，收敛最终文档状态 | `retro.md` 与归档产物齐备 |
| `/spec-first:verify FSREQ-20260209-AUTH-001 full` | 对归档前后一致性做最终全量校验 | 收尾阶段 full 校验通过 |
| `/spec-first:stage advance --feature FSREQ-20260209-AUTH-001` | 完成收尾 Gate 后推进阶段 | 当前阶段推进到 `07_release` |

关键产出：

- `retro.md`
- 最终 `traceability-matrix.md`
- 归档清单

Gate 要点：矩阵状态闭合（Accepted/Cancelled）。

### Step 7: 发布与完成（07_release → 08_done）

```bash
/spec-first:stage advance --feature FSREQ-20260209-AUTH-001
```

命令说明：

| 命令 | 作用 | 成功标志 |
|---|---|---|
| `/spec-first:stage advance --feature FSREQ-20260209-AUTH-001` | 从 `07_release` 推进到 `08_done`，完成 Feature 生命周期 | 当前阶段显示为 `08_done` |

期望结果：Feature 进入 `08_done`。

---

## 4. 变更场景示例（开发中追加需求）

### 4.1 变更触发

在 `04_implement` 阶段，业务新增诉求：在短信登录之外，再支持“邮箱验证码登录”。

该变更通常会影响：

- 需求规格（新增 FR/AC/NFR）
- 接口契约（新增发送邮箱验证码、邮箱验证码登录接口）
- 任务计划（新增前后端任务）
- 测试用例（新增正向/逆向/安全/回归用例）

### 4.2 变更分级与 RFC 流程

1. 先做影响分析，判定为 `Major`（影响 3-5 类产物）。
2. 发起 RFC 并进入审批。
3. 审批通过后再改文档与代码，不允许先改后补。

命令示例：

```bash
/spec-first:rfc create FSREQ-20260209-AUTH-001 --title "新增邮箱验证码登录" --level Major --motivation "扩大可用登录方式"
/spec-first:rfc submit RFC-001 --feature FSREQ-20260209-AUTH-001
/spec-first:rfc approve RFC-001 --feature FSREQ-20260209-AUTH-001 --by tech-lead
/spec-first:rfc approve RFC-001 --feature FSREQ-20260209-AUTH-001 --by pm-owner
```

命令说明：

| 命令 | 作用 | 成功标志 |
|---|---|---|
| `/spec-first:rfc create ...` | 创建变更请求，记录级别、动机与影响范围 | RFC 条目创建成功并可检索 |
| `/spec-first:rfc submit RFC-001 --feature ...` | 提交 RFC 进入审批流程 | RFC 状态从 `draft` 进入审批流 |
| `/spec-first:rfc approve RFC-001 ... --by tech-lead` | 技术负责人审批 | RFC 记录新增 tech-lead 审批结果 |
| `/spec-first:rfc approve RFC-001 ... --by pm-owner` | 产品负责人审批，允许进入文档与实现变更 | RFC 达到可执行状态 |

### 4.3 迭代文档更新清单（必须按顺序）

| 顺序 | 文档 | 更新内容 | 校验点 |
|---|---|---|---|
| 1 | `impact-analysis.md` | 记录影响范围（FR/API/TASK/TC/PR）与风险 | 影响项可追踪到具体 ID |
| 2 | `spec.md` | 新增/调整 FR、AC、NFR（如邮箱验证码安全策略） | 无歧义标记，ID 完整 |
| 3 | `traceability-matrix.md` | 新增需求行，更新状态与引用列 | FR/NFR 行完整，无孤儿项 |
| 4 | `design.md` | 增补邮箱登录流程、错误码、限流策略 | 设计与 FR 一致 |
| 5 | `contracts/*.yaml` | 新增/调整 API 定义 | API 覆盖率保持 100% |
| 6 | `data-model.md`（如需） | 增加邮箱验证码相关字段/索引 | 与设计一致 |
| 7 | `task_plan.md` | 新增 TASK 并标注 `traces`、`depends_on` | Task 覆盖率/合规率 100% |
| 8 | `checklist.md` | 增加 AC 派生检查项 | 与 AC 一一对应 |
| 9 | `tests/*.test.md` | 增加 TC 并标注 `verifies` | TC 合规率 100% |
| 10 | `reports/test-report.md` | 记录新增用例执行与结果 | 失败用例闭环 |
| 11 | `reports/security-scan.md` | 补充邮箱验证码相关安全验证 | 无高危遗留 |
| 12 | `reports/uat-signoff.md` | 补充业务验收结论 | UAT 对新增需求签核 |
| 13 | `stage-state.json` / `findings.md` | 记录变更决策、风险与里程碑 | 审计轨迹完整 |

### 4.4 变更执行后的流程推进

文档更新后，按“回退到受影响最早阶段”重新校验并推进：

1. 如果变更触及 `spec + design + tasks`，至少从 `02_design` 重新校验。
2. 重新通过 `03_plan`、`04_implement`、`05_verify` 的 Gate。
3. 通过后再进入 `06_wrap_up` 和 `07_release`。

命令示例：

```bash
/spec-first:verify FSREQ-20260209-AUTH-001 quick
/spec-first:matrix check --feature FSREQ-20260209-AUTH-001
/spec-first:gate check --feature FSREQ-20260209-AUTH-001 --stage 03_plan
/spec-first:gate check --feature FSREQ-20260209-AUTH-001 --stage 04_implement
/spec-first:status FSREQ-20260209-AUTH-001
/spec-first:verify FSREQ-20260209-AUTH-001 full
```

命令说明：

| 命令 | 作用 | 成功标志 |
|---|---|---|
| `/spec-first:verify ... quick` | 先做增量快速校验，确认回退后的关键变更可继续 | quick 校验通过 |
| `/spec-first:matrix check --feature ...` | 检查追踪矩阵完整性与关联闭环 | 矩阵校验通过，无孤儿项 |
| `/spec-first:gate check --feature ... --stage 03_plan` | 单独验证计划阶段 Gate | `03_plan` Gate 通过 |
| `/spec-first:gate check --feature ... --stage 04_implement` | 单独验证实现阶段 Gate | `04_implement` Gate 通过 |
| `/spec-first:status ...` | 查看轻量告警，确认无明显状态漂移 | 告警在可接受范围且不阻断 |
| `/spec-first:verify ... full` | 最终做全量校验后再继续推进 | full 校验通过 |

### 4.5 变更场景执行原则

- RFC 未审批通过前，不落地代码与正式文档变更。
- 每次变更都要先更新 `traceability-matrix.md`，再进入实现。
- 变更引入的新需求必须补齐测试与安全证据。
- Gate 不通过时禁止 `stage advance`。

---

## 5. 案例验收清单

- `AC-CASE-001` 用户全程仅通过 `/spec-first:xxxx` 操作。
- `AC-CASE-002` 新增登录方式链路（需求→设计→任务→测试→PR）可在矩阵中追溯。
- `AC-CASE-003` 原登录方式回归通过，无行为退化。
- `AC-CASE-004` 安全项（验证码有效期、频控、重试）有证据与报告。
- `AC-CASE-005` 最终状态进入 `08_done`，审计轨迹完整。
- `AC-CASE-006` 开发中途需求变更已完成 RFC 审批与迭代文档更新清单闭环。
- `AC-CASE-007` 发生会话中断时，可通过 `/spec-first:catchup` 在单通道文件恢复下继续执行。
- `AC-CASE-008` 每次阶段完成后，`task_plan.md` 与 `stage-state.json` 同步更新，`status` 告警不阻断推进。
- `AC-CASE-009` 多需求并行时，可先查看需求列表并切换目标需求后继续恢复执行。

---

## 6. 常见执行问题

- 问题：`stage advance` 失败。  
  处理：先执行 `/spec-first:verify <featureId> full` 查看未通过 Gate 条件。

- 问题：新增任务无法通过合规校验。  
  处理：检查 `task_plan.md` 中是否缺少 `traces`。

- 问题：测试覆盖不足。  
  处理：补充 TC，并确保 `verifies` 关联到 FR/AC/NFR。

- 问题：会话中断后不知道做到哪里。  
  处理：先执行 `/spec-first:catchup <featureId>`，再执行 `/spec-first:status <featureId>` 查看告警与当前阶段。

---

## 7. 流程可行性验证（基于 v2 最新规范）

### 7.1 验证结果

结论：该案例流程在需求层面可行，可覆盖“新增登录方式 + 中途变更 + 会话中断恢复”的主路径。

### 7.2 可行性检查点

| 检查点 | 验证方式 | 通过标准 |
|---|---|---|
| 阶段完整性 | 00→07 顺序执行并逐段 `verify` | 无阶段跳跃，Gate 条件可解释 |
| 追踪闭环 | 检查 `spec/design/task/tests/matrix` | FR/NFR→TASK→TC→报告链路完整 |
| 轻量恢复 | 执行 `/spec-first:catchup` | 可恢复当前阶段/TASK，输出缺失文件清单 |
| 轻量节拍 | 检查 `task_plan.md` + `stage-state.json` | 每个完成 Phase 均有同步更新记录 |
| 告警策略 | 执行 `/spec-first:status` | 缺文件/阶段不一致/过旧仅告警，不阻断 |
| 需求切换 | 执行 `feature list/switch/current`（或显式 `--feature`） | 切换后恢复到正确 Feature，不发生串线 |
| 变更治理 | 执行 RFC 流程并回退校验 | 先审批后改动，重走受影响阶段 Gate |

### 7.3 已知风险与处理

- 风险：`M5 AIOrchestrator` 存在交付状态上的类型签名漂移。  
  处理：以 `/spec-first:*` 统一入口执行流程；若自动恢复异常，手动重试 `/spec-first:catchup <featureId>` 并按 `status` 告警修复。

---

*core-06-case-login-optimization.md 完成*
