# Spec-First 在 Claude Code 的 Skill + CLI 集成方案

> **版本**: v1.0  
> **日期**: 2026-02-09  
> **范围**: 仅 Claude Code CLI 场景

---

## 1. 目标

在 Claude Code 中统一通过 `/` 命令运行 Spec-First 全部能力，命令形态示例：

- `/spec-first:init`
- `/spec-first:stage-current`
- `/spec-first:gate-check`

约束：

- 不修改现有 TypeScript 代码
- 所有执行仍以 `spec-first` CLI 为唯一后端
- Skill/命令层只负责交互编排、参数补全与结果格式化

---

## 2. 总体架构

### 2.1 三层结构

1. 命令门面层（Claude Commands）  
对用户暴露 `/spec-first:*` 命令，负责参数交互、CLI 调用与输出标准化。

2. Skill 编排层（Claude Skills）  
按领域提供流程化能力（stage/gate/verify/orchestrate），供命令门面复用。

3. CLI 执行层（spec-first）  
底层原子能力执行入口：`spec-first <group> <subcommand> ...`（由 Skill 统一编排调用）。

### 2.2 关键原则

- 状态流转主权在 Skill：所有阶段流转由 `/spec-first:*` 或 `/orchestrate` 触发
- CLI 仅提供底层能力支持（状态变更、校验、查询），不作为用户主交互入口
- Skill 不直接写 `stage-state.json`，而是调用 CLI 完成状态变更
- `stage advance` 默认不带 `--force`
- 每条命令执行链可回放、可审计

---

## 3. 命名规范

### 3.1 目标命名（主）

- `/spec-first:init`
- `/spec-first:stage-current`
- `/spec-first:id-next`

### 3.2 兼容命名（兜底）

若平台对 `:` 支持受限，提供等价别名：

- `/spec-first-init`
- `/spec-first-stage-current`
- `/spec-first-id-next`

---

## 4. 全量命令映射（28 个）

- `spec-first init` -> `/spec-first:init`
- `spec-first stage current` -> `/spec-first:stage-current`
- `spec-first stage advance` -> `/spec-first:stage-advance`
- `spec-first stage cancel` -> `/spec-first:stage-cancel`
- `spec-first id next` -> `/spec-first:id-next`
- `spec-first id validate` -> `/spec-first:id-validate`
- `spec-first id list` -> `/spec-first:id-list`
- `spec-first gate check` -> `/spec-first:gate-check`
- `spec-first gate conditions` -> `/spec-first:gate-conditions`
- `spec-first gate history` -> `/spec-first:gate-history`
- `spec-first matrix check` -> `/spec-first:matrix-check`
- `spec-first matrix export` -> `/spec-first:matrix-export`
- `spec-first metrics coverage` -> `/spec-first:metrics-coverage`
- `spec-first metrics report` -> `/spec-first:metrics-report`
- `spec-first rfc create` -> `/spec-first:rfc-create`
- `spec-first rfc submit` -> `/spec-first:rfc-submit`
- `spec-first rfc transition` -> `/spec-first:rfc-transition`
- `spec-first rfc list` -> `/spec-first:rfc-list`
- `spec-first rfc get` -> `/spec-first:rfc-get`
- `spec-first defect register` -> `/spec-first:defect-register`
- `spec-first defect update` -> `/spec-first:defect-update`
- `spec-first defect list` -> `/spec-first:defect-list`
- `spec-first defect get` -> `/spec-first:defect-get`
- `spec-first defect escape-rate` -> `/spec-first:defect-escape-rate`
- `spec-first ai context` -> `/spec-first:ai-context`
- `spec-first ai catchup` -> `/spec-first:ai-catchup`
- `spec-first ai stats` -> `/spec-first:ai-stats`
- `spec-first doctor` -> `/spec-first:doctor`

---

## 5. 统一交互协议（每个命令）

1. 参数解析与补全（缺参则交互询问）
2. 回显将执行的 CLI 命令
3. 调用 `spec-first ...`
4. 输出统一结构：`Result / Key Data / Next Action / Blockers`
5. 给出下一步命令建议

---

## 6. Skill 协同策略

保留并联动三个协同入口：

- `/plan`（`/skill spec-first-plan`）
- `/verify`（`/skill spec-first-verify`）
- `/orchestrate`（`/skill spec-first-orchestrate`）

职责分配：

- 原子操作：走 `/spec-first:*`
- 阶段编排：走 `/plan|/verify|/orchestrate`
- 状态推进由 Skill 触发，底层调用 `spec-first stage ...`
- 校验由 Skill 触发，底层调用 `spec-first gate/matrix/metrics ...`

---

## 7. 与三层体系对齐

- Layer 0（做什么）：CLI 的流程状态机、Gate、追踪规则
- Layer 1（怎么做）：命令门面按 `Mode × Size` 提示产物深度和执行策略
- Layer 2（做到什么标准）：端特有规则在 verify/gate 前后注入检查项

执行顺序：  
`Feature 启动 -> 确定 Mode/Size/Platform -> 读取 Layer 0 -> 应用 Layer 1 -> 合并 Layer 2 -> 形成命令执行链`

---

## 8. 分期落地（不改核心代码）

1. P0：上线高频 8 个门面命令  
`init / stage-current / stage-advance / id-next / matrix-check / metrics-coverage / gate-check / doctor`

2. P1：补齐其余 20 个门面命令（达到 28 个全覆盖）

3. P2：将 `/orchestrate` 与全量门面打通，形成完整闭环

---

## 9. 验收标准

- Claude 下可调用全部 28 个 `/spec-first:*` 命令
- 每个门面命令都有唯一 `spec-first` 映射
- 可完成单 Feature 闭环：`00_init -> ... -> 08_done`
- `--force` 有明确保护与确认
- 输出结构统一，可复盘
- 用户全程可在 Skill 命令层完成流程流转（无须手动输入裸 CLI）

---

## 10. 风险与控制

1. 命名兼容风险（冒号风格支持差异）  
控制：提供 `:` 与 `-` 双命名别名。

2. 门面文档与 CLI 演进漂移  
控制：维护命令映射清单并定期校准。

3. 能力预期偏差（误认为全自动）  
控制：在命令输出中固定声明“状态在 CLI，内容需人工确认”。

---

**结论**：  
在不改现有核心代码前提下，可通过“Claude 命令门面 + Skill 编排 + CLI 执行锚点”实现 `/spec-first:*` 的统一使用体验。
