# Skill Selector 前置确认层与分层职责修正

> **版本**: 2.0
> **日期**: 2026-03-26
> **状态**: 已校准至当前代码实际状态
> **目的**: 基于 `系统架构与数据流.md` 中 3.3 节的扩展方案映射图，修正对 `skill bundle`、`preset`、`workflow` 与 `decision_hints` 的理解偏差，明确后续架构边界。

---

## 1. 当前实现状态 (2026-03-26)

### ✅ 已实现 (Phase 1 基线)

以下组件已在代码中实现：

| 组件 | 状态 | 说明 |
|------|------|------|
| `workflow_type` | ✅ 已实现 | types.py 中已定义，task_store.py 已编译 |
| `decision_hints` | ✅ 已实现 | 完整的数据结构和编译逻辑 |
| `runtime hook` 注入 | ✅ 已实现 | inject-subagent-context.py 读取 decision_hints |
| `phase agent` 消费 | ✅ 已实现 | ralph-loop.py 优先读取 task.json |

### ❌ 未实现 (待开发)

以下组件尚未实现，是 P1 核心功能：

| 组件 | 状态 | 优先级 | 说明 |
|------|------|--------|------|
| `execution_profile` | ❌ 未实现 | P1 | 仅存在于设计文档，代码中不存在 |
| `skill selector` | ❌ 未实现 | P1 | 核心架构层，必须实现 |
| `selected_skills` | ❌ 未实现 | P1 | 依赖 skill selector |
| `skills-registry.json` | ❌ 未实现 | P1 | skill 元数据 |

---

## 2. 核心修正结论

这里不是让系统在运行时“临场自动发现 skill”，而是：

> 新增一个独立的 `skill selector` 层，在 `phase agent` 执行之前，前置确认当前 phase 应使用的 `skill bundle`。

因此应严格区分：

- `phase agent` 不负责搜索 skill
- `runtime hook` 不负责决定选哪个 skill
- `skill selector` 才是前置决策层
- `selected_skills` 应在注入前就已经被确认

---

## 3. 正确的数据流位置

### 3.1 完整架构流程

```text
workflow_type                    ✅ 已实现
  -> execution_profile           ❌ 未实现 (P1)
  -> skill selector              ❌ 未实现 (P1)
  -> selected_skills             ❌ 未实现 (P1)
  -> runtime hook                ✅ 已实现 (部分)
  -> phase agent                 ✅ 已实现
  -> decision_hints gate         ✅ 已实现
  -> evidence                    ✅ 已预留 (P3 实现)
```

### 3.2 当前实际流程 (Phase 1)

```text
task creation
  -> workflow_type 编译
  -> decision_hints 生成
  -> runtime hook 注入 decision_hints
  -> phase agent 执行
```

### 3.3 目标流程 (Phase 1+)

```text
task creation / plan
  -> 推导 execution_profile        ← P1 新增
  -> 调用 skill selector           ← P1 新增
  -> 产出 selected_skills          ← P1 新增
  -> runtime hook 注入 selected_skills + decision_hints + task context
  -> phase agent 在限定 bundle 内执行
```

这意味着：

- 选择权前移
- 决策层独立
- agent 只消费结果，不自行发现 skill

---

## 4. 分层职责表

| 层 | 状态 | 核心职责 | 输入 | 输出 | 不负责什么 |
|---|---|---|---|---|---|
| `workflow_type` | ✅ 已实现 | 定义流程拓扑与主链路阶段顺序 | 用户任务类型、任务目标 | `next_action`、阶段序列 | 不决定 skill，不表达 TDD/debug 方法语义 |
| `execution_profile` | ❌ 未实现 | 描述任务环境画像 | task metadata、repo 检测结果、用户显式输入 | `surface/language/framework/runtime/task_mode/phase` | 不直接注入 prompt，不做 skill 选择裁决 |
| `skill selector` | ❌ 未实现 | 前置确认当前 phase 应执行的 skill bundle | `execution_profile`、`skills-registry`、`selector-rules` | `selected_skills`、可选 `selector_trace` | 不执行任务，不直接写 gate，不负责 phase 编排 |
| `runtime hook` | ✅ 已实现 | 将已确认结果注入 agent prompt | `task context`、`decision_hints`、`selected_skills` | phase-specific prompt | 不决定选哪个 skill |
| `phase agent` | ✅ 已实现 | 在限定 bundle 内完成实现、检查、修复 | 注入后的 prompt、上下文、skills | 代码、文档、检查结果 | 不搜索 skill 库，不自行拼装 skill 组合 |
| `decision_hints` | ✅ 已实现 | 提供结构化执行约束与 gate 输入 | task contract、规则映射 | `implement/check/...` 的结构化 hints | 不承载完整方法论，不替代 skill 内容 |
| `evidence` | ✅ 已预留 | 记录执行证据与完成依据 | verify 结果、phase outcome、产物链接 | 可追溯证据集合 | 不负责前置路由，不决定如何执行 |

---

## 4. 两组最容易混淆但必须切开的边界

### 4.1 `skill selector` 与 `runtime hook`

二者职责不能混写：

- `skill selector` 负责决策
- `runtime hook` 负责注入

如果把选择逻辑写死在 hook 中，会导致：

- 选择过程不可追踪
- 规则不可配置
- hook 同时承担“决策 + 注入”双职责

这与 3.3 节强调的“新增 selector 层”相冲突。

### 4.2 `skill` 与 `decision_hints`

二者也不能混写：

- `skill` 负责方法论、模式、范式、示例
- `decision_hints` 负责结构化约束、gate 输入、强校验信号

例如：

- TDD 的 red-green-refactor、测试先行思路，适合放到 `skill`
- `verify_commands`、是否必须做 cross-layer check、是否要求更新 spec，适合放到 `decision_hints`

因此不能把“方法学”继续塞进 `decision_hints`，也不能让 `skill` 取代 gate。

---

## 5. `with-tdd` 与 `debug` 的正确落位

这两个语义不应继续被理解为 `workflow_type`，也不应再以独立 `preset` 子系统的方式对外暴露。

它们更准确的落位应是：

| 语义输入 | 正确落位 | 结果 |
|---|---|---|
| `with-tdd` | `execution_profile.task_mode = "tdd"` | `skill selector` 选中 `test-driven-development` |
| `debug` | `execution_profile.task_mode = "debug"` | `skill selector` 选中 `systematic-debugging` |

因此：

- `with-tdd` 不是 workflow
- `debug` 也不是 workflow
- 它们首先是任务模式语义
- 然后再由 selector 前置确认 skill bundle

---

## 7. 对 Phase 2 的重新定义

### 7.1 应被放弃的旧理解 ❌

不推荐继续建设：

- `--preset with-tdd` ❌ 已废弃
- `--preset debug` ❌ 已废弃
- 用 preset registry 增强 `decision_hints` 的独立子系统 ❌ 已废弃

### 7.2 应保留的新能力 ✅

真正不能跳过的是这条中间能力链：

```text
execution_profile          ← P1 必须实现
  -> skill selector        ← P1 必须实现
  -> selected_skills       ← P1 必须实现
  -> runtime hook injection ← 已实现，需扩展
```

因此，Phase 2 更合理的定义应是：

> **Phase 1+: Execution Profile + Skill Selector**

或者：

> **Skill Bundle 前置确认层**

### 7.3 实施优先级

| 组件 | 优先级 | 工作量 | 状态 |
|------|--------|--------|------|
| execution_profile 字段 | P1 | 2-3h | 未实现 |
| task_mode 映射规则 | P1 | 1-2h | 未实现 |
| skills-registry.json | P1 | 2h | 未实现 |
| skill selector | P1 | 3-4h | 未实现 |
| Hook 注入 skill bundle | P1 | 1-2h | 未实现 |

**总工作量**: 9-13 小时

---

## 8. 对 `Phase2必要性分析.md` 的修正理解

`Phase2必要性分析.md` 中”废弃 preset 子系统”的方向是成立的，但”Phase 2 可以跳过”的表述不够准确。

### 8.1 更准确的收敛结论

1. ❌ `preset` 作为用户可见产品形态可以取消
2. ✅ `execution_profile` 必须保留（P1 新增）
3. ✅ `skill selector` 这一前置决策层必须新增（P1 核心）
4. ✅ `runtime hook` 只负责注入，不负责选择（已实现，需扩展）
5. ✅ `decision_hints` 继续承担硬约束与 gate 输入（已实现）
6. ✅ `evidence` 负责最终完成证据（已预留，P3 实现）

### 8.2 关键区分

换句话说：

- ❌ 可以跳过的是 `preset subsystem`（用户可见的 --preset 参数）
- ✅ 不能跳过的是 `selector bridge layer`（skill selector 架构层）

### 8.3 与 `功能保留废弃分析.md` 的一致性

本文档的结论已与 `功能保留废弃分析.md` 保持一致：

| 功能 | 本文档定位 | 功能保留废弃分析 | 一致性 |
|------|-----------|----------------|--------|
| preset 系统 | ❌ 废弃 | ❌ 废弃 | ✅ 一致 |
| execution_profile | ✅ P1 必须 | 🔄 P1 新增 | ✅ 一致 |
| skill selector | ✅ P1 核心 | 🔄 P1 必须（核心层） | ✅ 一致 |
| decision_hints | ✅ 已实现 | ✅ 已完成 | ✅ 一致 |

---

## 9. 最终架构口径

### 9.1 统一口径

后续统一口径建议如下：

| 组件 | 状态 | 职责边界 |
|------|------|---------|
| `workflow_type` | ✅ 已实现 | 只定义拓扑 |
| `execution_profile` | ❌ 未实现 | 只定义任务画像 |
| `skill selector` | ❌ 未实现 | 只负责前置确认 skill bundle |
| `runtime hook` | ✅ 已实现 | 只负责注入 |
| `phase agent` | ✅ 已实现 | 只负责执行 |
| `decision_hints` | ✅ 已实现 | 只负责结构化约束 |
| `evidence` | ✅ 已预留 | 只负责完成判定与追溯 |

### 9.2 核心原则

> **这里不是 runtime 临场自动选 skill，而是新增 `skill selector` 层，在执行前把当前 phase 的 `skill bundle` 明确选定，再由 hook 注入给 agent 使用。**

### 9.3 实施路径

```
✅ Phase 1 (已完成)
├─ workflow_type 编译
├─ decision_hints 生成
├─ runtime hook 注入
└─ phase agent 消费

🔄 Phase 1+ (P1 待实施，9-13h)
├─ execution_profile 字段 (2-3h)
├─ task_mode 映射规则 (1-2h)
├─ skills-registry.json (2h)
├─ skill selector (3-4h)
└─ Hook 注入 skill bundle (1-2h)

⏸️ Phase 3 (延后)
└─ evidence 完整实现 (15-22h)
```

---

**文档版本**: 2.0
**最后更新**: 2026-03-26
**状态**: 已校准至当前代码实际状态

