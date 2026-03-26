# Phase Decision Guide

> **版本**: 2.0 | **日期**: 2026-03-26
> 本文档定义 spec-first 多 Agent 流水线的 phase policy。它是规则文档，不是 dispatch 的执行脚本。

---

## 1. 文档定位

本文档的职责是：

1. 定义每个 phase 有哪些决策维度
2. 定义这些维度的语义和默认策略
3. 给 `decision_hints` 的取值提供规则依据
4. 为 runtime 和维护者提供统一 policy 参考

本文档**不负责**：

1. 指导 `dispatch` 自行推理复杂决策
2. 作为唯一执行来源
3. 代替 runtime enforcement

最佳实践关系如下：

- `task.json.decision_hints`：结构化 policy 载体
- `plan / task creation`：默认值和任务级覆盖的生产者
- `inject-subagent-context.py`：phase policy 注入到 subagent prompt
- `ralph-loop.py`：执行 check 阶段的硬门控

如果需要字段定义、默认值和兼容策略，请同时阅读：

- [decision-hints-schema.md](/Users/kuang/xiaobu/spec-first/docs/01-需求分析/架构升级/decision-hints-schema.md)
- [dispatch-runtime最佳实践方案.md](/Users/kuang/xiaobu/spec-first/docs/01-需求分析/架构升级/dispatch-runtime最佳实践方案.md)

---

## 2. 设计原则

### 2.1 Policy 与 Enforcement 分离

规则在文档和 schema 中定义，执行必须在 runtime 中完成。

### 2.2 Dispatch 保持纯调度

`dispatch` 只负责按 `next_action` 调度 phase，不承担策略推导。

### 2.3 决策必须机读

所有关键决策最终都应落在 `task.json.decision_hints` 中，而不是只存在于 prompt 文本里。

### 2.4 默认值必须可预测

任何 task 即使没有显式 hints，也必须有稳定默认值，不允许 phase 现场自由发挥。

### 2.5 不过度设计

phase policy 的目标不是替代 agent 思考，而是固定关键边界。

因此本文档优先约束：

1. 实现模式强度
2. check 的 verify policy
3. 跨层检查要求

不优先约束：

1. 具体实现步骤
2. 局部重构方式
3. 所有细粒度上下文判断

### 2.6 LLM 自主决策位置

LLM 的自主决策应主要发生在 phase execution layer：

- `implement`
- `check`
- `debug`
- `finish`

这些 phase 应在既定 policy 边界内，自主决定：

- 具体实现方式
- 局部 tradeoff
- 检查和修复路径

不应把这类自主决策前移到：

- `dispatch`
- `task.json`
- runtime hooks

---

## 3. 决策维度总览

| Phase | 决策维度 | 主要输出 |
|------|----------|----------|
| implement | 实现模式、目标测试层、是否要求 RED/GREEN 证据 | `implement.mode`, `implement.test_layers` |
| check | 是否跑测试、跑什么命令、是否要求跨层检查 | `check.verify_commands`, `check.cross_layer_required` |
| debug | 修复策略、是否优先复现、分析深度 | `debug.fix_strategy` |
| finish | 是否建议更新 spec、是否建议记录 session | `finish.update_spec_expected`, `finish.record_session_expected` |

---

## 4. implement Phase Policy

## 4.1 决策目标

implement phase 的目标不是“完成所有验证”，而是：

1. 选择合适的实现模式
2. 明确建议覆盖的测试层
3. 决定是否必须展示 TDD 证据

## 4.2 最小推荐字段

第一阶段最小推荐：

```json
{
  "implement": {
    "mode": "tdd_recommended"
  }
}
```

## 4.3 扩展字段

```json
{
  "implement": {
    "mode": "tdd_recommended",
    "test_layers": ["unit"],
    "must_show_red_green": false
  }
}
```

### `mode`

推荐枚举值：

- `direct`
- `tdd_recommended`
- `tdd_required`

### `test_layers`

推荐值：

- `unit`
- `integration`
- `e2e`
- `snapshot`

### `must_show_red_green`

用于表示：

- 是否必须展示 RED 失败输出
- 是否必须展示 GREEN 通过输出

只有在 `tdd_required` 或高风险修复场景下建议为 `true`。

## 4.4 场景决策规则

| 场景 | 推荐 `mode` | 推荐 `test_layers` | `must_show_red_green` |
|------|-------------|--------------------|-----------------------|
| 新功能且 spec 明确 | `tdd_recommended` | `["unit"]` | `false` |
| bug fix | `tdd_required` | `["unit"]` | `true` |
| API / service 变更 | `tdd_recommended` | `["unit", "integration"]` | `false` |
| DB / schema 变更 | `tdd_recommended` | `["integration"]` | `false` |
| UI-only 组件 | `direct` | `["snapshot"]` | `false` |
| 快速原型 | `direct` | `[]` 或 `["unit"]` | `false` |
| 单行修复 / 极小改动 | `direct` | `[]` | `false` |

## 4.5 运行时消费方式

implement policy 应由 `inject-subagent-context.py` 注入到 implement prompt 中。

推荐注入形式：

```text
Phase Policy:
- mode = tdd_recommended
- test_layers = ["unit", "integration"]
- must_show_red_green = false
```

这类信息应该由 runtime 注入，而不是让 `dispatch` 手工拼 prompt 分支。

---

## 5. check Phase Policy

## 5.1 决策目标

check phase 是**质量 gate**，不是“建议阶段”。

它的核心目标是：

1. 决定是否需要测试
2. 决定运行哪些验证命令
3. 决定是否需要跨层检查

## 5.2 最小推荐字段

第一阶段最小推荐：

```json
{
  "check": {
    "verify_commands": ["pnpm lint", "pnpm typecheck", "pnpm test"]
  }
}
```

`check.cross_layer_required` 属于后续扩展字段，不建议在 Phase 1 进入主 contract。

## 5.3 扩展字段

```json
{
  "check": {
    "run_tests": true,
    "test_layers": ["unit"],
    "verify_commands": ["pnpm lint", "pnpm typecheck", "pnpm test"],
    "cross_layer_required": false
  }
}
```

### `run_tests`

保留该字段用于语义表达，但**真正的 gate 应以 `verify_commands` 为准**。

### `test_layers`

用于表达验证意图，帮助：

- prompt 注入
- 文档解释
- 将来扩展更细粒度的 test runner

### `verify_commands`

这是 check policy 中最重要的字段。

原因：

1. runtime 可直接执行
2. 平台无须自行推导命令
3. `ralph-loop.py` 可以直接消费

### `cross_layer_required`

用于标记 check 是否必须进行跨层一致性检查。

## 5.4 场景决策规则

| 场景 | `verify_commands` | `cross_layer_required` |
|------|-------------------|------------------------|
| 任意代码改动 | `["pnpm lint", "pnpm typecheck", "pnpm test"]` | `false` |
| 仅文档修改 | `[]` 或 `["pnpm lint"]` | `false` |
| API 签名变更 | `["pnpm lint", "pnpm typecheck", "pnpm test"]` | `true` |
| DB schema 变更 | `["pnpm lint", "pnpm typecheck", "pnpm test"]` | `true` |
| 状态管理变更 | `["pnpm lint", "pnpm typecheck", "pnpm test"]` | `true` |
| UI-only 变更 | `["pnpm lint", "pnpm typecheck"]` | `false` |
| 内部重构但无行为变化 | `["pnpm lint", "pnpm typecheck", "pnpm test"]` | `false` |

## 5.5 运行时消费方式

check policy 有两层消费：

1. `inject-subagent-context.py`
   - 负责把 `test_layers`、`cross_layer_required` 等扩展字段注入 check prompt
2. `ralph-loop.py`
   - 负责执行 `verify_commands`
   - 失败时阻止 check 结束

因此：

> `verify_commands` 是 enforcement 字段，`test_layers` 更接近解释字段。

---

## 5.6 对 superpowers 的借鉴边界

`/Users/kuang/xiaobu/superpowers` 主要通过 skill-first 方式实现 Harness Engineering：

- 用入口 skill 管工作流
- 用 TDD / verification skill 写死铁律
- 把大部分自主性保留给执行阶段 agent

对 spec-first 来说，值得借鉴的是理念：

1. 只约束关键少数
2. 证据优先于声称
3. 把 LLM 自主性保留在执行层

不建议照搬的是实现形态：

1. 不把所有约束都放在 skill/prompt 文本里
2. 不放弃现有 `task.json + hooks` 的 runtime 优势

---

## 6. debug Phase Policy

## 6.1 决策目标

debug phase 的重点不是“重新实现”，而是：

1. 选择最小且安全的修复路径
2. 确定是否需要先复现问题
3. 决定是否做深层根因分析

## 6.2 推荐字段

```json
{
  "debug": {
    "fix_strategy": "minimal_safe_fix",
    "prefer_test_reproduction": true,
    "analysis_depth": "shallow"
  }
}
```

### `fix_strategy`

推荐枚举值：

- `minimal_safe_fix`
- `reproduce_then_fix`
- `trace_cross_layer_then_fix`

### `prefer_test_reproduction`

表示是否优先通过测试或可重复步骤来复现问题。

### `analysis_depth`

推荐枚举值：

- `shallow`
- `deep`

## 6.3 场景决策规则

| 场景 | `fix_strategy` | `prefer_test_reproduction` | `analysis_depth` |
|------|----------------|----------------------------|------------------|
| type error | `minimal_safe_fix` | `false` | `shallow` |
| logic bug | `reproduce_then_fix` | `true` | `deep` |
| integration bug | `trace_cross_layer_then_fix` | `true` | `deep` |
| flaky test | `reproduce_then_fix` | `true` | `deep` |
| 性能问题 | `trace_cross_layer_then_fix` | `false` | `deep` |
| 一次性低风险修复 | `minimal_safe_fix` | `false` | `shallow` |

## 6.4 运行时消费方式

debug policy 主要由 `inject-subagent-context.py` 注入 prompt。

当前阶段不建议对 debug 增加过重的强制 gate，但建议统一语义模型，避免修复策略完全自由发挥。

---

## 7. finish Phase Policy

## 7.1 决策目标

finish phase 主要做两件事：

1. 判断是否需要更新 spec
2. 判断是否应该记录 session

## 7.2 推荐字段

```json
{
  "finish": {
    "update_spec_expected": false,
    "record_session_expected": false
  }
}
```

## 7.3 场景决策规则

| 场景 | `update_spec_expected` | `record_session_expected` |
|------|------------------------|---------------------------|
| 新模式 / 新契约 / 新规范 | `true` | `true` |
| API signature 变化 | `true` | `true` |
| DB schema 变化 | `true` | `true` |
| 新功能完成 | `false` 或 `true` | `true` |
| bug fix 无新知识 | `false` | `true` |
| 轻微重构 | `false` | `false` |

## 7.4 执行说明

finish policy 现阶段更偏提示性，不建议在 finish 上做重门控。

原因：

- finish 已经是 pipeline 后段
- 其主要职责是对 requirements/spec sync 做最终确认
- 过重门控会增加误阻塞

---

## 8. 默认 policy

如果任务没有显式 `decision_hints`，推荐使用以下默认值：

```json
{
  "decision_hints": {
    "implement": {
      "mode": "tdd_recommended",
      "test_layers": ["unit"],
      "must_show_red_green": false
    },
    "check": {
      "run_tests": true,
      "test_layers": ["unit"],
      "verify_commands": ["pnpm lint", "pnpm typecheck", "pnpm test"],
      "cross_layer_required": false
    },
    "debug": {
      "fix_strategy": "minimal_safe_fix",
      "prefer_test_reproduction": true,
      "analysis_depth": "shallow"
    },
    "finish": {
      "update_spec_expected": false,
      "record_session_expected": false
    }
  }
}
```

默认值的生产者应是：

1. `task_store.py`
2. `plan` phase

而不是 `dispatch` 运行时推断。

---

## 9. 与 Superpowers 的关系

| Superpowers 能力 | spec-first 对应 phase | 本文档作用 |
|------------------|----------------------|------------|
| `test-driven-development` | implement | 定义何时 direct / 推荐 TDD / 强制 TDD |
| `verification-before-completion` | check | 定义 verify policy 和硬门控意图 |
| `systematic-debugging` | debug | 定义修复策略语义 |
| `finishing-a-development-branch` | finish | 定义 spec/session 收尾判断 |

spec-first 与 Superpowers 的差异在于：

- Superpowers 更偏 skill-first
- spec-first 更偏 task/runtime-first

因此本文档不应变成“让 dispatch 模拟 Superpowers”的文本脚本，而应成为：

> task policy 的统一规则源。

---

## 10. 不建议的做法

以下做法不建议继续采用：

1. 让 `dispatch` 读取本文档后自行做复杂判断
2. 仅通过 prompt 模板表达测试 gate
3. 仅配置 `test_layers` 而不配置 `verify_commands`
4. 让默认值在 runtime 中临时猜测

这些做法都会导致：

- 平台漂移
- enforcement 不稳定
- 文档与 runtime 脱节

---

## 11. 推荐实施顺序

1. 先固化 `decision_hints` schema
2. 再让 task creation / plan 生成默认 hints
3. 再让 `inject-subagent-context.py` 消费 hints
4. 最后让 `ralph-loop.py` 执行 check 的硬门控

`dispatch` 最后再调整，而且只做轻量说明，不做主决策树。

---

## 12. 结论

`phase-decision-guide.md` 应保留，但角色应调整为：

- **Phase Policy Guide**
- **Decision Semantics Guide**

它的核心价值是：

1. 给 `decision_hints` 提供统一语义
2. 给维护者提供场景到策略的映射
3. 为 runtime 和模板提供同一套 policy 依据

它不应该再承担：

- dispatch 的主逻辑
- runtime 的唯一执行来源
- 测试 gate 的实际控制面
