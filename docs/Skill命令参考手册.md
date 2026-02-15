# Spec-First 全量命令参考手册（Skill 化视角）

> **来源**：`docs/01需求文档/spec-first-v7.md`
> **生成日期**：2026-02-09
> **说明**：所有命令统一以 Skill 视角呈现，含协同 Skill、阶段 Skill、CLI 原子命令三类，共 39 条。

---

## 一、协同 Skill（3 条）✅ 已可用

日常使用的顶层入口，内部编排阶段 Skill + CLI 原子命令。

| 命令 | 参数说明 | 说明 | 产出物 | 前置依赖 |
|------|---------|------|--------|---------|
| `/plan` | `<featureId> "<task>"` | 阶段规划编排：识别当前阶段，调用对应阶段 Skill 生成交付物，执行 Gate 校验 | 阶段交付物 + Gate 评估结果 + progress.md 更新 | Feature 已 init |
| `/verify` | `<featureId> [quick\|full]` | 校验与质量评估：追踪矩阵完整性、覆盖率计算、Gate 条件检查 | 校验报告（覆盖率 + Gate 结果 + 问题清单） | Feature 已 init，至少完成 01 Specify |
| `/orchestrate` | `<featureId> "<task>"` | 全流程编排：plan → skill 执行 → verify → stage advance 循环驱动 | 全阶段交付物 + 阶段推进记录 | Feature 已 init |

---

## 二、阶段 Skill（8 条）🔧 Partial

每个阶段 Skill 遵循 5 阶段执行模型（上下文加载 → AI 推理 → 用户确认 → 写入交付物 → 副作用执行）。

| 命令 | 参数说明 | 说明 | 对应阶段 | 产出物 | 前置依赖 |
|------|---------|------|---------|--------|---------|
| `/skill 00-session-catchup` | `<featureId>` | 会话中断后恢复上下文，同步追踪产物 | 任意阶段 | 上下文恢复摘要 + progress.md 同步 | Feature 已 init |
| `/skill 01-spec-write` | `<featureId>` | 辅助生成结构化 spec.md，分配 FR/NFR ID | 01 Specify | spec.md（含 FR/NFR 定义） | Feature 已 init，constitution.md 存在 |
| `/skill 02-design-write` | `<featureId>` | 辅助生成技术设计文档、API 契约、数据模型 | 02 Design | design.md + contracts/ + data-model.md | 01 Specify Gate PASS |
| `/skill 03-research` | `<featureId>` | 辅助技术可行性调研，生成调研报告 | 02 Design | research.md | 01 Specify Gate PASS |
| `/skill 04-task-decompose` | `<featureId>` | 辅助生成任务计划，分配 TASK ID | 03 Plan | task_plan.md（含 TASK ID） | 02 Design Gate PASS |
| `/skill 05-code-trace` | `<featureId>` | 辅助按 TASK 编码，确保追踪注释 | 04 Implement | 代码文件（含追踪注释）+ 矩阵更新 | 03 Plan Gate PASS |
| `/skill 06-test-design` | `<featureId>` | 辅助生成测试用例，计算测试覆盖率 | 05 Verify | 测试用例（含 TC ID）+ 测试报告 | 04 Implement Gate PASS |
| `/skill 07-archive` | `<featureId>` | 执行归档审计，生成复盘报告 | 06 Wrap-up | 归档清单 + 复盘报告 | 05 Verify Gate PASS |

---

## 三、CLI 原子命令 — 初始化与 ID（4 条）✅ Implemented

底层确定性执行层，由 Skill 编排调用或用户直接使用。

### 3.1 init（1 条）

| 命令 | 参数说明 | 说明 | 产出物 | 前置依赖 |
|------|---------|------|--------|---------|
| `spec-first init` | `--feat <abbr>` 必填，Feature 缩写；`--mode <N\|I>` 默认 N；`--size <S\|M\|L>` 默认 M；`--platform <github\|gitlab>` 默认 github；`--feature-id <id>` 可选 | 初始化 Feature 工作区 | `specs/<featureId>/` 目录 + stage-state.json + constitution.md 模板 | 无 |

### 3.2 id（3 条）

| 命令 | 参数说明 | 说明 | 产出物 | 前置依赖 |
|------|---------|------|--------|---------|
| `spec-first id next` | `<type> <featAbbr> --feature <featureId>`；type 支持 FR/NFR/DS/API/TASK/TC/ADR/RFC | 生成下一个全局唯一 ID | 新 ID（如 FR-AUTH-001） | Feature 已 init |
| `spec-first id validate` | `<id>` | 校验 ID 格式合法性（<10ms SLA） | 校验结果（valid/invalid + 原因） | 无 |
| `spec-first id list` | `--feature <featureId> [--type <type>]` | 列出已注册 ID | ID 列表（按类型分组） | Feature 已 init |

---

## 四、CLI 原子命令 — Gate 与阶段管理（6 条）

### 4.1 gate（3 条）🔧 Partial

| 命令 | 参数说明 | 说明 | 产出物 | 前置依赖 |
|------|---------|------|--------|---------|
| `spec-first gate check` | `<featureId> [--stage <stageId>]` | 校验当前阶段 Gate 条件 | 评估结果：PASS / FAIL / WARN | Feature 已 init |
| `spec-first gate conditions` | `<stageId>` | 查看指定阶段的 Gate 条件定义 | Gate 条件列表 | 无 |
| `spec-first gate history` | `<featureId>` | 查看 Feature 的 Gate 评估历史 | 评估历史记录 | Feature 已 init |

### 4.2 stage（3 条）✅ Implemented

| 命令 | 参数说明 | 说明 | 产出物 | 前置依赖 |
|------|---------|------|--------|---------|
| `spec-first stage current` | `<featureId>` | 查看 Feature 当前所处阶段 | 当前阶段信息 | Feature 已 init |
| `spec-first stage advance` | `<featureId>` | 推进到下一阶段 | 阶段状态更新（stage-state.json） | 当前阶段 Gate PASS |
| `spec-first stage cancel` | `<featureId> --reason "<reason>"` | 取消 Feature | Feature 状态变更为 09_cancelled | Feature 已 init |

---

## 五、CLI 原子命令 — 追踪与度量（4 条）

### 5.1 matrix（2 条）✅ Implemented

| 命令 | 参数说明 | 说明 | 产出物 | 前置依赖 |
|------|---------|------|--------|---------|
| `spec-first matrix check` | `<featureId>` | 校验追踪矩阵完整性（孤儿项、断链检测） | 矩阵校验报告 | Feature 已 init，矩阵文件存在 |
| `spec-first matrix export` | `<featureId> [--format <markdown\|yaml>]` | 导出追踪矩阵 | traceability-matrix.md 或 .yaml | Feature 已 init |

### 5.2 metrics（2 条）✅ Implemented

| 命令 | 参数说明 | 说明 | 产出物 | 前置依赖 |
|------|---------|------|--------|---------|
| `spec-first metrics coverage` | `<featureId>` | 计算 9 项覆盖率指标（C1-C9） | 覆盖率报告 | Feature 已 init，矩阵文件存在 |
| `spec-first metrics report` | `<featureId>` | 生成综合度量报告（12 项指标 + 健康分 + 瓶颈分析） | 度量报告 | Feature 已 init |

---

## 六、CLI 原子命令 — AI 辅助（3 条）🔧 Partial

| 命令 | 参数说明 | 说明 | 产出物 | 前置依赖 |
|------|---------|------|--------|---------|
| `spec-first ai context` | `<featureId>` | 生成 Context Pack（<2KB YAML），用于跨 Agent 委派 | context-pack.yaml | Feature 已 init |
| `spec-first ai catchup` | `<featureId>` | 会话恢复（7 步恢复流程） | 上下文恢复摘要 | Feature 已 init |
| `spec-first ai stats` | `<featureId>` | AI 调用统计（代码/文档变更行数） | AI 统计报告 | Feature 已 init |

---

## 七、CLI 原子命令 — 变更管理 RFC（5 条）✅ Implemented

| 命令 | 参数说明 | 说明 | 产出物 | 前置依赖 |
|------|---------|------|--------|---------|
| `spec-first rfc create` | `<featureId> --title "<title>" [--level <Minor\|Major\|Critical>] [--by <submittedBy>] [--motivation "<motivation>"] [--description "<desc>"]` | 创建变更请求 | RFC 记录（draft 状态） | Feature 已 init |
| `spec-first rfc submit` | `<rfcId> --feature <featureId>` | 提交 RFC 进入评审 | RFC 状态变更为 submitted | RFC 已 create |
| `spec-first rfc transition` | `<rfcId> <status> --feature <featureId>`；11 状态 FSM | RFC 状态流转 | RFC 状态更新 | RFC 已 create |
| `spec-first rfc list` | `<featureId>` | 列出 Feature 下所有 RFC | RFC 列表 | Feature 已 init |
| `spec-first rfc get` | `<rfcId> --feature <featureId>` | 查看 RFC 详情 | RFC 详情 | RFC 已 create |

---

## 八、CLI 原子命令 — 缺陷管理（5 条）✅ Implemented

| 命令 | 参数说明 | 说明 | 产出物 | 前置依赖 |
|------|---------|------|--------|---------|
| `spec-first defect register` | `<featureId> --title "<title>" --severity <S1\|S2\|S3\|S4> --reporter "<reporter>" [--description "<desc>"] [--discovered-in <stage>]` | 登记缺陷 | 缺陷记录（open 状态） | Feature 已 init |
| `spec-first defect update` | `<defectId> <status> [--actor <actor>]` | 更新缺陷状态 | 缺陷状态变更 | 缺陷已 register |
| `spec-first defect list` | `<featureId>` | 列出 Feature 下所有缺陷 | 缺陷列表 | Feature 已 init |
| `spec-first defect get` | `<defectId>` | 查看缺陷详情 | 缺陷详情 | 缺陷已 register |
| `spec-first defect escape-rate` | `<featureId>` | 计算缺陷逃逸率 | 逃逸率报告 | Feature 已 init，存在缺陷记录 |

---

## 九、CLI 原子命令 — 环境诊断（1 条）✅ Implemented

| 命令 | 参数说明 | 说明 | 产出物 | 前置依赖 |
|------|---------|------|--------|---------|
| `spec-first doctor` | 无 | 环境诊断：Node.js ≥20、pnpm、Git 配置、specs/ 目录、CLI 版本 | 诊断报告（逐项 PASS/FAIL） | 无 |

---

## 十、汇总统计

| 类别 | 数量 | 实现状态 |
|------|------|---------|
| 协同 Skill | 3 | ✅ 已可用 |
| 阶段 Skill | 8 | 🔧 Partial |
| CLI — 初始化与 ID | 4 | ✅ Implemented |
| CLI — Gate 与阶段管理 | 6 | 🔧 Partial（gate）/ ✅（stage） |
| CLI — 追踪与度量 | 4 | ✅ Implemented |
| CLI — AI 辅助 | 3 | 🔧 Partial |
| CLI — 变更管理 RFC | 5 | ✅ Implemented |
| CLI — 缺陷管理 | 5 | ✅ Implemented |
| CLI — 环境诊断 | 1 | ✅ Implemented |
| **合计** | **39** | ✅ 24 / 🔧 15 |

> **使用优先级**：协同 Skill（`/plan` `/verify` `/orchestrate`）→ 阶段 Skill → CLI 原子命令。
> 日常开发优先使用协同 Skill，仅需精细控制时才直接调用 CLI 原子命令。
