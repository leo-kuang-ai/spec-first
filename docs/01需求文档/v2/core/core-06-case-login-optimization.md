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

关键产出：

- `specs/FSREQ-20260209-AUTH-001/stage-state.json`
- `specs/FSREQ-20260209-AUTH-001/progress.md`
- `specs/FSREQ-20260209-AUTH-001/findings.md`
- `specs/FSREQ-20260209-AUTH-001/task_plan.md`

Mode I 强制动作：

- 定位历史产物并读取已有 `spec/design/contracts/task_plan`。
- 读取并确认 `constitution.md` 约束后再进入下一阶段。

Gate 要点：Mode/Size/Platforms 已确认，历史产物定位完成，Constitution 已读取。

### Step 1: 需求规格化（01_specify）

```bash
/spec-first:spec FSREQ-20260209-AUTH-001
/spec-first:verify FSREQ-20260209-AUTH-001 quick
/spec-first:stage advance --feature FSREQ-20260209-AUTH-001
```

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

### Step 4: 实现开发（04_implement）

```bash
/spec-first:code FSREQ-20260209-AUTH-001 --task TASK-AUTH-001
/spec-first:code FSREQ-20260209-AUTH-001 --task TASK-AUTH-002
/spec-first:code FSREQ-20260209-AUTH-001 --task TASK-AUTH-003
/spec-first:code FSREQ-20260209-AUTH-001 --task TASK-AUTH-004
/spec-first:verify FSREQ-20260209-AUTH-001 quick
/spec-first:stage advance --feature FSREQ-20260209-AUTH-001
```

实现要求：

- 代码与 PR 需关联 TASK ID。
- 保持与 API 契约一致。
- 关键逻辑位置保留追踪注释。

Gate 要点：代码覆盖率达标，PR 合规率 = 100%。

### Step 5: 测试验证（05_verify）

```bash
/spec-first:test FSREQ-20260209-AUTH-001
/spec-first:verify FSREQ-20260209-AUTH-001 full
/spec-first:stage advance --feature FSREQ-20260209-AUTH-001
```

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

关键产出：

- `retro.md`
- 最终 `traceability-matrix.md`
- 归档清单

Gate 要点：矩阵状态闭合（Accepted/Cancelled）。

### Step 7: 发布与完成（07_release → 08_done）

```bash
/spec-first:stage advance --feature FSREQ-20260209-AUTH-001
```

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
| 13 | `progress.md` / `findings.md` | 记录变更决策、风险与里程碑 | 审计轨迹完整 |

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
/spec-first:verify FSREQ-20260209-AUTH-001 full
```

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

---

## 6. 常见执行问题

- 问题：`stage advance` 失败。  
  处理：先执行 `/spec-first:verify <featureId> full` 查看未通过 Gate 条件。

- 问题：新增任务无法通过合规校验。  
  处理：检查 `task_plan.md` 中是否缺少 `traces`。

- 问题：测试覆盖不足。  
  处理：补充 TC，并确保 `verifies` 关联到 FR/AC/NFR。

---

*core-06-case-login-optimization.md 完成*
