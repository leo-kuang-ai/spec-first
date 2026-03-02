# Spec-First Skill 命令参考手册

> **版本**: v2.0 | **日期**: 2026-02-14
> **基准**: 当前代码实现（src/cli/commands/*.ts + skills/spec-first/*.md）
> **总览**: 3 协同命令 + 22 Skill（6 阶段执行模型） + 13 CLI 命令组（38 子命令）

---

## 一、协同命令（3 条）

日常使用的顶层入口，内部编排 Skill + CLI 原子命令。位于 `.claude/commands/`。

| 命令 | 参数 | 说明 | 产出物 |
|------|------|------|--------|
| `/plan` | `<featureId> "<task>"` | 阶段规划：识别当前阶段，调用对应 Skill 生成交付物，执行 Gate 校验 | 执行计划 + stage-state.json |
| `/verify` | `<featureId> [quick\|full]` | 质量校验：矩阵完整性 + 覆盖率 + Gate 条件检查 | 校验报告（findings.md） |
| `/orchestrate` | `<featureId> "<task>"` | 全流程编排：plan → skill → verify → stage advance 循环 | 全阶段交付物 + 阶段推进 |

---

## 二、22 个 Skill

所有 Skill 调用格式：`/spec-first:<skillName>`（如 `/spec-first:spec`、`/spec-first:catchup`）。

每个 Skill 遵循统一的 6 阶段执行模型（P0→P5）：

```
P0_LOCATE      定位 Feature 工作区，校验阶段约束
P1_CONTEXT     加载 Context Pack，读取阶段相关产物
P2_GENERATE    AI 推理生成内容（纯推理，不调 CLI）
P3_CONFIRM     展示生成内容，用户确认/修改/拒绝
P4_WRITE       写入目标文件，注册新 ID
P5_SIDE_EFFECT 矩阵校验、Gate 检查、更新运行态文件
```

### 2.1 阶段 Skill（10 条）

| # | Skill | 命令 | 阶段 | confirm | 产出物 | CLI 依赖 |
|---|-------|------|------|---------|--------|---------|
| 01 | init | `/spec-first:init` | any | strict | stage-state.json, constitution.md, traceability-matrix.md | `spec-first init` |
| 02 | catchup | `/spec-first:catchup` | any | assisted | stage-state.json（恢复摘要追加） | `ai catchup`, `stage current` |
| 03 | spec | `/spec-first:spec` | 01_specify | strict/assisted | spec.md, traceability-matrix.md | `id next FR`, `matrix update`, `matrix check` |
| 04 | design | `/spec-first:design` | 02_design | strict | design.md, traceability-matrix.md | `id next DS`, `matrix update`, `metrics coverage` |
| 05 | research | `/spec-first:research` | any | assisted | research.md | `ai context` |
| 06 | task | `/spec-first:task` | 03_plan | assisted | task_plan.md, traceability-matrix.md | `id next TASK`, `matrix update`, `metrics coverage` |
| 07 | code | `/spec-first:code` | 04_implement | strict/assisted | 源代码, task_plan.md, stage-state.json | `commit`, `matrix update`, `ai context` |
| 08 | code-review | `/spec-first:code-review` | 04_implement | assisted | findings.md | `metrics coverage`, `matrix check` |
| 09 | test | `/spec-first:test` | 05_verify | assisted | tests/*.test.md, traceability-matrix.md | `id next TC`, `matrix update`, `metrics coverage` |
| 10 | archive | `/spec-first:archive` | 06_wrap_up | strict | retro.md | `metrics report`, `gate check`, `stage advance` |

### 2.2 编排 Skill（3 条）

| # | Skill | 命令 | confirm | 说明 | CLI 依赖 |
|---|-------|------|---------|------|---------|
| 11 | plan | `/spec-first:plan` | assisted | 生成执行计划（支持多需求切换），写入 stage-state.json | `feature list`, `feature switch`, `feature current`, `stage current`, `metrics health`, `doctor` |
| 12 | verify | `/spec-first:verify` | auto | 校验报告（Gate + 矩阵 + 覆盖率缺口），写入 findings.md | `gate check`, `matrix check`, `metrics coverage` |
| 13 | orchestrate | `/spec-first:orchestrate` | strict | 主编排器：plan → 阶段 Skill → verify → advance | `stage current/advance`, `gate check`, `metrics health` |

13-orchestrate 调度协议：

| 当前阶段 | 调度 Skill |
|---------|-----------|
| 01_specify | 03-spec |
| 02_design | 04-design（05-research 按需） |
| 03_plan | 06-task |
| 04_implement | 07-code（08-code-review 按需） |
| 05_verify | 09-test |
| 06_wrap_up | 10-archive |

子 Skill 失败时 orchestrate 终止，已完成的产出物保留不回滚。

### 2.3 辅助 Skill（6 条）

| # | Skill | 命令 | confirm | 说明 | CLI 依赖 |
|---|-------|------|---------|------|---------|
| 14 | status | `/spec-first:status` | auto | 状态仪表盘（只读，不写文件） | `stage current`, `metrics health`, `feature current` |
| 15 | doctor | `/spec-first:doctor` | auto | 环境诊断（只读，不写文件） | `spec-first doctor` |
| 16 | sync | `/spec-first:sync` | assisted | 矩阵同步回填，审计日志写入 findings.md | `matrix update`, `matrix check`, `rfc list` |
| 17 | feature-list | `/spec-first:feature-list` | auto | 列出当前项目全部 Feature（只读） | `feature list` |
| 18 | feature-switch | `/spec-first:feature-switch <featureId>` | assisted | 切换当前 Feature 上下文（更新 .spec-first/current） | `feature list`, `feature switch`, `feature current` |
| 19 | feature-current | `/spec-first:feature-current` | auto | 查看当前 Feature 与阶段信息（只读） | `feature current`, `stage current` |

### 2.4 confirm_policy 语义

| policy | P3 行为 | 适用 Skill |
|--------|--------|-----------|
| auto | 跳过用户确认，直接进入 P4 | status, doctor, verify |
| assisted | 展示摘要，用户可确认/修改/拒绝 | catchup, research, task, code-review, test, plan, sync |
| strict | 展示完整内容，用户逐项审阅确认 | init, spec, design, code, archive, orchestrate |

### 2.5 阶段 × Skill 映射

| 阶段 | Skill | 主要交付物 |
|------|-------|-----------|
| 00_init | 01-init | stage-state.json, constitution.md |
| 01_specify | 03-spec | spec.md |
| 02_design | 04-design, 05-research | design.md, contracts/, research.md |
| 03_plan | 06-task | task_plan.md, checklist.md |
| 04_implement | 07-code, 08-code-review | 源代码, task_plan.md 状态更新 |
| 05_verify | 09-test | tests/*.test.md |
| 06_wrap_up | 10-archive | retro.md |
| 任意阶段 | 02-catchup, 05-research | 恢复报告, 调研报告 |
| 编排层 | 11-plan, 12-verify, 13-orchestrate | 执行计划, 校验报告 |
| 辅助层 | 14-status, 15-doctor, 16-sync, 17-feature-list, 18-feature-switch, 19-feature-current | 状态查询, 诊断, 矩阵同步, Feature 上下文切换 |

---

## 三、CLI 原子命令（13 组 38 子命令）

底层确定性执行层，由 Skill 编排调用或用户直接使用。

### 3.1 init（1 条）

| 命令 | 参数 | 说明 |
|------|------|------|
| `spec-first init` | `--feat <abbr>` 必填；`--mode <N\|I>` 默认 N；`--size <S\|M\|L>` 默认 M；`--platforms <p1,p2,...>`；`[--feature-id <id>]`；`[--title <title>]` | 初始化 Feature 工作区，生成 stage-state.json + constitution.md |

### 3.2 id（4 条）

| 命令 | 参数 | 说明 |
|------|------|------|
| `spec-first id next` | `<type> <abbr> --feature <featureId> [--level <UT\|IT\|E2E\|ST>]`；type: FR\|DS\|TASK\|TC\|RFC；`--level` 仅 TC 需要 | 生成下一个全局唯一 ID |
| `spec-first id validate` | `<id>` | 校验 ID 格式合法性 |
| `spec-first id search` | `<query> --feature <featureId> [--type <type>]` | 模糊搜索已注册 ID |
| `spec-first id list` | `--feature <featureId> [--type <type>]` | 列出已注册 ID |

ID 格式规则：

| 类型 | 格式 | 示例 |
|------|------|------|
| FR | `FR-<ABBR>-NNN` | FR-AUTH-001 |
| DS | `DS-<ABBR>-NNN` | DS-AUTH-001 |
| TASK | `TASK-<ABBR>-NNN` | TASK-AUTH-001 |
| TC | `TC-<LEVEL>-<ABBR>-NNN` | TC-UT-AUTH-001 |
| RFC | `RFC-NNN` | RFC-001 |

### 3.3 stage（3 条）

| 命令 | 参数 | 说明 |
|------|------|------|
| `spec-first stage current` | `<featureId>` | 查看当前阶段 |
| `spec-first stage advance` | `<featureId> [--force]` | 推进到下一阶段（需 Gate PASS，`--force` 跳过写审计记录） |
| `spec-first stage cancel` | `<featureId> --reason "<reason>"` | 取消 Feature → 09_cancelled |

阶段顺序：`00_init → 01_specify → 02_design → 03_plan → 04_implement → 05_verify → 06_wrap_up → 07_release → 08_done`

终态：`08_done`（正常完结）、`09_cancelled`（取消）— 不可逆。

### 3.4 matrix（3 条）

| 命令 | 参数 | 说明 |
|------|------|------|
| `spec-first matrix check` | `<featureId>` | 校验矩阵完整性（孤儿项、断链检测） |
| `spec-first matrix export` | `<featureId> [--format <markdown\|yaml>]` | 导出追踪矩阵 |
| `spec-first matrix update` | `<featureId> <id> [--status <status>] [--title <title>] [--upstream <ids>] [--downstream <ids>]` | 更新矩阵行 |

### 3.5 gate（3 条）

| 命令 | 参数 | 说明 |
|------|------|------|
| `spec-first gate check` | `<featureId>` | 校验当前阶段 Gate 条件 |
| `spec-first gate conditions` | `<featureId>` | 查看 Gate 条件定义 |
| `spec-first gate history` | `<featureId>` | 查看 Gate 评估历史 |

Gate 结果：`PASS`（通过）| `PASS_WITH_WAIVER`（有豁免的通过）| `FAIL`（阻断）

### 3.6 golive（1 条）

| 命令 | 参数 | 说明 |
|------|------|------|
| `spec-first golive check` | `<featureId>` | 上线前检查（Gate 全通过、覆盖率达标、无未关闭缺陷） |

### 3.7 metrics（3 条）

| 命令 | 参数 | 说明 |
|------|------|------|
| `spec-first metrics coverage` | `<featureId>` | 计算 C1-C9 九项覆盖率指标 |
| `spec-first metrics report` | `<featureId>` | 生成综合度量报告 |
| `spec-first metrics health` | `<featureId>` | 健康分（加权综合评分） |

9 项覆盖率指标：

| 指标 | 含义 |
|------|------|
| C1 Design Coverage | 被 DS 覆盖的 FR 比例 |
| C2 API Coverage | 需接口的 FR 被 API 覆盖比例 |
| C3 Task Coverage | 被 TASK 覆盖的 FR 比例 |
| C4 Test Coverage (FR) | 被 TC 覆盖的 FR 比例 |
| C5 Test Coverage (AC) | 被 TC 覆盖的 AC 比例 |
| C6 Impl Coverage | 已实现的 TASK 比例 |
| C7 PR Compliance | 关联 TASK ID 的 PR 比例 |
| C8 Task Compliance | 关联 DS/FR 的 TASK 比例 |
| C9 TC Compliance | 关联 AC/FR 的 TC 比例 |

### 3.8 rfc（5 条）

| 命令 | 参数 | 说明 |
|------|------|------|
| `spec-first rfc create` | `<featureId> --title "<title>" [--level <Minor\|Major\|Critical>] [--by <author>]` | 创建 RFC（draft 状态） |
| `spec-first rfc submit` | `<rfcId> --feature <featureId>` | 提交 RFC 进入评审 |
| `spec-first rfc transition` | `<rfcId> <status> --feature <featureId>`；status: draft\|approved\|closed\|rejected | RFC 状态流转 |
| `spec-first rfc list` | `<featureId>` | 列出 Feature 下所有 RFC |
| `spec-first rfc get` | `<rfcId> --feature <featureId>` | 查看 RFC 详情 |

### 3.9 defect（5 条）

| 命令 | 参数 | 说明 |
|------|------|------|
| `spec-first defect register` | `<featureId> --severity <S1\|S2\|S3\|S4> --title "<title>" [--reporter "<name>"] [--discovered-in <stage>] [--linked-fr <id>]` | 登记缺陷（open 状态） |
| `spec-first defect update` | `<featureId> <seq> --status <status>`；status: open\|fixing\|fixed\|verified\|wontfix | 更新缺陷状态 |
| `spec-first defect list` | `<featureId> [--status <status>] [--severity <severity>]` | 列出缺陷 |
| `spec-first defect get` | `<featureId> <seq>` | 查看缺陷详情 |
| `spec-first defect escape-rate` | `<featureId>` | 计算缺陷逃逸率 |

### 3.10 ai（3 条）

| 命令 | 参数 | 说明 |
|------|------|------|
| `spec-first ai context` | `<featureId>` | 生成 Context Pack（<2KB YAML） |
| `spec-first ai catchup` | `<featureId>` | 会话恢复（7 步恢复流程） |
| `spec-first ai stats` | `<featureId>` | AI 编码统计 |

### 3.11 commit（1 条）

| 命令 | 参数 | 说明 |
|------|------|------|
| `spec-first commit` | `-m "<message>" [--task <taskId>]`；`--task` 未指定时自动从 task_plan.md 查找 In Progress 的 TASK | Git 提交，自动注入 `traces: <taskId>` trailer |

### 3.12 feature（3 条）

| 命令 | 参数 | 说明 |
|------|------|------|
| `spec-first feature list` | — | 列出所有 Feature |
| `spec-first feature current` | — | 查看当前活跃 Feature |
| `spec-first feature switch` | `<featureId>` | 切换活跃 Feature |

### 3.13 doctor（1 条）

| 命令 | 参数 | 说明 |
|------|------|------|
| `spec-first doctor` | `[featureId]` | 环境诊断：Node.js 版本、Git 配置、.spec-first/ 目录、config.yaml、Git Hook 状态、Gate 降级检测、运行时文件膨胀检测。指定 featureId 时额外检查 Feature 级状态 |

---

## 四、Dispatcher 路由规则

Skill 调用时，Dispatcher 按以下优先级路由：

1. **SEMANTIC_MAP** — 语义快捷方式（如 `rfc approve` → `rfc transition ... approved`）
2. **RUNTIME_COMMANDS** — 直接走 CLI 原子命令（id/matrix/stage/rfc/defect/metrics/gate/golive/ai/commit/feature）
3. **Skill 路由** — 加载 `NN-skillName/SKILL.md` 进入 6 阶段执行

语义快捷方式示例：

```bash
/spec-first:rfc approve RFC-001    # → rfc transition RFC-001 approved
/spec-first:rfc reject RFC-001     # → rfc transition RFC-001 rejected
/spec-first:defect fix AUTH 1      # → defect update AUTH 1 --status fixing
/spec-first:defect verify AUTH 1   # → defect update AUTH 1 --status verified
```

---

## 五、汇总统计

| 类别 | 数量 |
|------|------|
| 协同命令 | 3 |
| 项目认知/专项 Skill | 3（first/spec-review/analyze） |
| 阶段 Skill | 10 |
| 编排 Skill | 3 |
| 辅助 Skill | 6 |
| CLI 命令组 | 13（38 子命令） |
| **合计** | **22 Skill + 38 CLI 子命令 + 3 协同命令 = 63** |

使用优先级：协同命令（`/plan` `/verify` `/orchestrate`）→ Skill（`/spec-first:<name>`）→ CLI 原子命令（`spec-first <cmd>`）。

---

**文档版本**: v2.0
**最后更新**: 2026-02-14
