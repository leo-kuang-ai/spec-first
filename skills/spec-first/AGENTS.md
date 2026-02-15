---
description: Spec-First 全链路研发闭环 — 全局 Agent 指令
---

# Spec-First Agent 全局指令

> 本文件为所有 Skill 提供共享上下文。Codex CLI 自动加载，Claude Code 通过 `/skill` 间接引用。

## 项目概述

**Spec-First** 是一套规范驱动的全链路研发闭环工具链。核心理念：

- **规范即契约** — 所有开发活动以规范为准，规范是唯一真理源
- **全链路追溯** — 从需求到上线，每个环节可追溯到对应规范
- **自动化校验** — 规范可被工具自动解析和校验

### 技术栈

- Node.js 20 + TypeScript 5.x + ESM only
- CLI 框架：Commander.js
- 测试：Vitest
- 构建：tsup

### 目录结构

```text
specs/                          # Feature 工作区根目录
├── .feat-registry.md           # FEAT 缩写注册表
└── <featureId>/                # 单个 Feature 目录
    ├── stage-state.json        # 阶段状态机
    ├── constitution.md         # 项目原则
    ├── spec.md                 # 需求规格（01_specify）
    ├── design.md               # 技术设计（02_design）
    ├── research.md             # 技术调研（02_design 可选）
    ├── contracts/*.yaml        # API 契约（02_design）
    ├── data-model.md           # 数据模型（02_design M/L）
    ├── adr/*.adr.md            # 架构决策记录
    ├── task_plan.md            # 任务拆解（03_plan）
    ├── checklist.md            # 验证清单（03_plan）
    ├── tests/*.test.md         # 测试用例（05_verify）
    ├── reports/                # 报告目录
    │   ├── test-report.md
    │   ├── security-scan.md
    │   └── uat-signoff.md
    ├── retro.md                # 复盘报告（06_wrap_up）
    ├── traceability-matrix.md  # 追踪矩阵
    ├── progress.md             # 进度记录（运行态）
    ├── findings.md             # 过程发现（运行态）
    ├── task_plan.md            # 当前任务计划（运行态）
    ├── gate-history.jsonl      # Gate 评估历史
    ├── ai-stats.jsonl          # AI 调用统计
    └── metrics.jsonl           # 度量数据
```

## CLI 命令参考

所有 Skill 通过 Bash 调用以下 CLI 命令完成确定性操作。

### spec-first init

初始化 Feature 工作区。

```bash
spec-first init --feat <abbr> --mode <N|I> --size <S|M|L> --platforms <p1,p2,...> [--feature-id <id>] [--title <title>]
```

- 创建 `specs/<featureId>/` 目录（featureId 由 `--feat` 缩写自动生成，或通过 `--feature-id` 指定）
- 生成 `stage-state.json`（初始阶段 `00_init`）
- 生成 `constitution.md` 模板

### spec-first id

ID 生成与校验。

```bash
# 生成下一个 ID
spec-first id next <type> <featAbbr>
# type: FR | DS | TASK | TC | RFC

# 校验 ID 格式
spec-first id validate <id>

# 列出已注册 ID
spec-first id list [--type <type>] [--feature <featureId>]
```

**ID 格式规则**：

| 类型 | 格式 | 示例 |
| --- | --- | --- |
| FR | `FR-<ABBR>-NNN` | FR-AUTH-001 |
| DS | `DS-<ABBR>-NNN` | DS-AUTH-001 |
| TASK | `TASK-<ABBR>-NNN` | TASK-AUTH-001 |
| TC | `TC-<LEVEL>-<ABBR>-NNN` | TC-UT-AUTH-001 |
| RFC | `RFC-NNN` | RFC-001 |

### spec-first gate

Gate 条件评估（质量门禁）。

```bash
# 校验当前阶段 Gate
spec-first gate check <featureId> [--stage <stageId>]

# 查看阶段 Gate 条件定义
spec-first gate conditions <stageId>

# 查看 Gate 评估历史
spec-first gate history <featureId>
```

Gate 评估结果：`PASS`（通过）| `PASS_WITH_WAIVER`（有豁免的通过）| `FAIL`（阻断）。

### spec-first stage

阶段生命周期管理。

```bash
# 查看当前阶段
spec-first stage current <featureId>

# 推进到下一阶段（需 Gate PASS）
spec-first stage advance <featureId>

# 取消 Feature
spec-first stage cancel <featureId> --reason "<reason>"
```

**阶段顺序**：

```text
00_init → 01_specify → 02_design → 03_plan → 04_implement → 05_verify → 06_wrap_up → 07_release → 08_done
```

### spec-first matrix

追踪矩阵管理。

```bash
# 校验追踪矩阵完整性
spec-first matrix check <featureId>

# 导出追踪矩阵
spec-first matrix export <featureId> [--format <markdown|yaml>]

# 更新矩阵行
spec-first matrix update <featureId> <id> [--status <status>] [--title <title>] [--upstream <ids>] [--downstream <ids>]
```

### spec-first metrics

覆盖率与度量。

```bash
# 计算覆盖率（9 项指标）
spec-first metrics coverage <featureId>

# 生成度量报告
spec-first metrics report <featureId>
```

**9 项覆盖率指标**：

| 指标 | 含义 |
| --- | --- |
| C1 Design Coverage | 被 DS 覆盖的 FR 比例 |
| C2 API Coverage | 需接口的 FR 被 API 覆盖比例 |
| C3 Task Coverage | 被 TASK 覆盖的 FR 比例 |
| C4 Test Coverage (FR) | 被 TC 覆盖的 FR 比例 |
| C5 Test Coverage (AC) | 被 TC 覆盖的 AC 比例 |
| C6 Impl Coverage | 已实现的 TASK 比例 |
| C7 PR Compliance | 关联 TASK ID 的 PR 比例 |
| C8 Task Compliance | 关联 DS/FR 的 TASK 比例 |
| C9 TC Compliance | 关联 AC/FR 的 TC 比例 |

### spec-first ai

AI 辅助工具。

```bash
# 生成 Context Pack（<2KB YAML）
spec-first ai context <featureId>

# 会话恢复
spec-first ai catchup <featureId>

# AI 调用统计
spec-first ai stats <featureId>
```

### spec-first rfc

变更请求（RFC）管理。

```bash
# 创建 RFC
spec-first rfc create <featureId> --title "<title>" --impact "<impact>"

# 提交 RFC 进入评审
spec-first rfc submit <rfcId>

# RFC 状态流转
spec-first rfc transition <rfcId> <status>

# 列出 Feature 下所有 RFC
spec-first rfc list <featureId>

# 查看 RFC 详情
spec-first rfc get <rfcId>
```

### spec-first defect

缺陷管理。

```bash
# 登记缺陷
spec-first defect register <featureId> --title "<title>" --severity <critical|major|minor>

# 更新缺陷状态
spec-first defect update <defectId> <status>

# 列出缺陷
spec-first defect list <featureId>

# 查看缺陷详情
spec-first defect get <defectId>

# 计算缺陷逃逸率
spec-first defect escape-rate <featureId>
```

### spec-first doctor

环境诊断。

```bash
spec-first doctor
```

检查：Node.js 版本、pnpm 可用性、Git 配置、specs/ 目录状态。

---

## Skill 统一执行模型

每个 Skill 遵循相同的 6 阶段执行流程（P0 → P5）：

```text
P0_LOCATE — 定位与校验
  ├── 定位 Feature 工作区（specs/<featureId>/）
  └── 校验当前阶段是否允许执行该 Skill

P1_CONTEXT — 上下文加载
  ├── spec-first ai context <featureId>（获取 Context Pack）
  └── 读取阶段相关交付物

P2_GENERATE — AI 推理生成
  └── 根据 SKILL.md 指令生成内容（纯 AI 推理，无 CLI 调用）

P3_CONFIRM — 用户确认
  └── 展示生成内容，等待用户确认 / 修改 / 拒绝（可回退至 P2 修订）

P4_WRITE — 写入交付物
  ├── 写入目标文件
  └── spec-first id next <type> <abbr>（注册新 ID）

P5_SIDE_EFFECT — 副作用执行
  ├── spec-first matrix check <featureId>（校验追踪矩阵）
  ├── spec-first gate check <featureId>（校验 Gate）
  └── 更新运行态三文件（progress.md / findings.md / task_plan.md）
```

## Stage × Skill 映射

| 阶段 | Skill | 主要交付物 |
| --- | --- | --- |
| 00_init | 01-init（CLI `spec-first init`） | stage-state.json, constitution.md |
| 01_specify | 03-spec | spec.md |
| 02_design | 04-design, 05-research | design.md, contracts/, research.md |
| 03_plan | 06-task | task_plan.md, checklist.md |
| 04_implement | 07-code, 08-code-review | task_plan.md 状态更新 |
| 05_verify | 09-test | tests/*.test.md |
| 06_wrap_up | 10-archive | retro.md |
| 任意阶段 | 02-catchup | 无文件（恢复摘要） |
| 编排层 | 11-plan, 12-verify, 13-orchestrate | 执行计划 / 校验报告 |
| 辅助 | 14-status, 15-doctor, 16-sync | 状态查询 / 环境诊断 / 矩阵同步 |

## Guardrails（全局约束）

### 人在回路

- AI 生成内容后**必须展示给用户确认**，确认后才写入文件
- 不得跳过用户确认直接写入交付物
- 用户拒绝时，根据反馈修改后重新展示

### 阶段纪律

- 不得跨阶段执行 Skill（如在 01_specify 阶段执行 04-task-decompose）
- 阶段推进必须通过 `spec-first stage advance`，不得直接修改 stage-state.json
- Gate 未通过时不得推进阶段，除非用户明确使用 `--force`

### ID 纪律

- 所有新建的 FR/DS/TASK/TC/RFC 必须通过 `spec-first id next` 注册
- 不得手动编造 ID
- ID 一旦注册不可复用
