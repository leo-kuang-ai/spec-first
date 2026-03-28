# Decision Hints Schema

> **版本**: 1.0 | **日期**: 2026-03-26
> 本文档定义 `task.json.decision_hints` 的推荐数据模型、默认值、生产者、消费者和兼容策略。

---

## 1. 目标

`decision_hints` 的目标不是记录“模糊建议”，而是提供：

1. 可机读的 phase policy
2. 可被 runtime 执行的验证配置
3. 可跨平台保持一致的决策语义

它必须满足三个条件：

1. **结构化**：不同平台都能解析
2. **可执行**：关键字段可直接被 hook/runtime 消费
3. **可回退**：旧任务没有该字段时仍能工作

额外约束：

> 不过度设计。`decision_hints` 只保存关键少数、必须一致、runtime 可执行的决策。

---

## 2. 所属位置

`decision_hints` 位于每个 task 的 `task.json` 中：

```json
{
  "id": "user-auth",
  "title": "Add user authentication",
  "next_action": [
    { "phase": 1, "action": "implement" },
    { "phase": 2, "action": "check" },
    { "phase": 3, "action": "finish" }
  ],
  "decision_hints": {
    "...": {}
  }
}
```

---

## 3. 最小可行结构

第一阶段推荐先落最小 schema。

### 3.1 Canonical Phase 1 Schema

```ts
interface DecisionHintsPhase1 {
  implement?: {
    mode: "direct" | "tdd_recommended" | "tdd_required";
  };
  check?: {
    verify_commands: string[];
  };
}
```

说明：

1. 这是一份长期稳定的最小 contract，不引入临时字段名
2. Phase 1 producer 默认只写最保守值：`implement.mode = "direct"`
3. `tdd_recommended / tdd_required` 枚举在 schema 中保留，供 Phase 2 preset 使用
4. `verify_commands` 必须是 producer 写入的 task/repo-specific contract
5. runtime 只执行 `verify_commands`，不负责推断默认命令

### 3.2 Phase 1 默认产物

```json
{
  "decision_hints": {
    "implement": {
      "mode": "direct"
    },
    "check": {
      "verify_commands": ["<repo-specific commands>"]
    }
  }
}
```

这是推荐最小集合，因为它已经覆盖了：

1. implement 的策略强度
2. check 的硬门控命令
3. 当前最明确、最有 enforcement 价值的 runtime contract

补充约束：

- `verify_commands` 的具体值必须由 producer 根据 task/repo 写入
- `["pnpm lint", "pnpm typecheck", "pnpm test"]` 之类的写法只应作为示例
- repo 级显式 verify 配置优先于启发式默认值

## 4. 扩展结构

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

---

## 5. 字段定义

## 5.0 Runtime 注入呈现规范

`decision_hints` 不应只存在于 `task.json` 中，还需要以稳定格式注入到 subagent prompt。

推荐规则：

1. 在 `## Your Context` 后、`## Your Task` 前插入
2. 使用固定标题：`## Phase Policy`
3. 只渲染当前 phase 相关字段
4. 不渲染无关字段
5. 不重复整份 `task.json`

推荐示例：

```md
## Phase Policy

- `implement.mode`: `direct`
```

```md
## Phase Policy

- `check.verify_commands`: `["<repo-specific commands>"]`

Execution requirements:
- You must run the verification commands above
- Treat them as the task-specific gate for this task
```

当前基线：

- Phase 1 只要求 `implement` 和 `check` 渲染 policy block
- `finish/debug` 的独立 policy block 留到后续 consumer 稳定后再加

## 5.1 `implement`

### `implement.mode`

类型：

- `string`

允许值：

- `direct`
- `tdd_recommended`
- `tdd_required`

语义：

- `direct`：直接实现，不要求显式 TDD 流程
- `tdd_recommended`：优先采用 TDD，但不做强门控
- `tdd_required`：必须先 RED 再 GREEN，并展示证据

### `implement.test_layers`

类型：

- `string[]`

允许值：

- `unit`
- `integration`
- `e2e`
- `snapshot`

语义：

- 表达 implement 阶段建议优先覆盖的测试层
- 主要用于 prompt 注入和策略说明

### `implement.must_show_red_green`

类型：

- `boolean`

语义：

- `true`：必须展示 RED 和 GREEN 的执行证据
- `false`：推荐 TDD，但不强制展示完整过程

## 5.2 `check`

### `check.run_tests`

类型：

- `boolean`

语义：

- 用于表达 check 是否期望运行测试
- 仅作为语义层字段
- 实际 gate 以 `verify_commands` 为准

### `check.test_layers`

类型：

- `string[]`

允许值：

- `unit`
- `integration`
- `e2e`
- `snapshot`

语义：

- 表达 check 期望覆盖的测试层
- 可用于 prompt 注入和文档说明

### `check.verify_commands`

类型：

- `string[]`

示例：

```json
["pnpm lint", "pnpm typecheck", "pnpm test"]
```

语义：

- runtime 直接执行的验证命令
- `ralph-loop.py` 的首选消费字段

这是 check 阶段最重要的 enforcement 字段。

### `check.cross_layer_required`

类型：

- `boolean`

语义：

- `true`：check 阶段必须做跨层审查
- `false`：仅做常规代码与质量检查

## 5.3 `debug`

### `debug.fix_strategy`

类型：

- `string`

允许值：

- `minimal_safe_fix`
- `reproduce_then_fix`
- `trace_cross_layer_then_fix`

### `debug.prefer_test_reproduction`

类型：

- `boolean`

语义：

- `true`：优先通过测试或稳定步骤复现问题
- `false`：允许直接做最小修复

### `debug.analysis_depth`

类型：

- `string`

允许值：

- `shallow`
- `deep`

## 5.4 `finish`

### `finish.update_spec_expected`

类型：

- `boolean`

语义：

- `true`：finish 阶段应主动检查并更新 spec
- `false`：通常无需 spec 更新

### `finish.record_session_expected`

类型：

- `boolean`

语义：

- `true`：完成后应记录 session
- `false`：无需记录

---

## 6. 字段分层

为避免 schema 过重，建议把字段分成两类。

### 6.1 Hard policy

这些字段应优先落地，并最终进入 runtime enforcement：

- `implement.mode`
- `check.verify_commands`

### 6.2 Soft policy

这些字段可以保留，但不建议第一阶段作为强制实现范围：

- `check.cross_layer_required`
- `implement.test_layers`
- `implement.must_show_red_green`
- `debug.*`
- `finish.*`

---

## 7. 默认值

推荐默认值：

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

默认值的推荐生产者：

1. `task_store.py`
2. `plan` phase

不建议由 `dispatch` 或 subagent 运行时临时推导。

---

## 8. 生产者与消费者

## 8.1 生产者

### 主生产者

- `packages/cli/src/templates/spec-first/scripts/common/task_store.py`

职责：

- 写入新 task 的基础默认值

### 次生产者

- `plan` agent

职责：

- 根据需求和 research 结果覆写默认值
- 为任务设置更精确的 `verify_commands`
- 推断是否需要 `cross_layer_required`

## 8.2 消费者

### `inject-subagent-context.py`

消费字段：

- `implement.*`
- `check.test_layers`
- `check.cross_layer_required`
- `debug.*`
- `finish.*`

职责：

- 将 phase policy 注入到 prompt

### `ralph-loop.py`

消费字段：

- `check.verify_commands`

职责：

- 执行 check 阶段硬门控
- 控制 check 是否允许结束

### `task_context.py`

消费字段：

- `check.cross_layer_required`
- 未来可扩展消费 `implement.test_layers`

职责：

- 调整默认 jsonl 上下文

---

## 9. LLM 自主决策边界

`decision_hints` 不应该承载 LLM 的思考过程。

LLM 自主决策应主要存在于：

- `plan`
- `implement`
- `check`
- `debug`
- `finish`

`decision_hints` 只保存这些自主决策产出的最小 contract。

---

## 10. fallback 顺序

为兼容旧任务，建议使用以下 fallback：

### check 阶段验证

```text
task.json.decision_hints.check.verify_commands
  > .spec-first/worktree.yaml verify
  > completion markers
```

### prompt 注入

```text
task.json.decision_hints
  > runtime 内置默认值
```

即使旧 task 没有 `decision_hints`，系统也应继续可运行。

---

## 11. 场景示例

## 11.1 API 功能开发

```json
{
  "decision_hints": {
    "implement": {
      "mode": "tdd_recommended",
      "test_layers": ["unit", "integration"],
      "must_show_red_green": false
    },
    "check": {
      "run_tests": true,
      "test_layers": ["unit", "integration"],
      "verify_commands": ["pnpm lint", "pnpm typecheck", "pnpm test"],
      "cross_layer_required": true
    }
  }
}
```

## 11.2 UI-only 改动

```json
{
  "decision_hints": {
    "implement": {
      "mode": "direct",
      "test_layers": ["snapshot"],
      "must_show_red_green": false
    },
    "check": {
      "run_tests": false,
      "test_layers": ["snapshot"],
      "verify_commands": ["pnpm lint", "pnpm typecheck"],
      "cross_layer_required": false
    }
  }
}
```

## 11.3 bug fix

```json
{
  "decision_hints": {
    "implement": {
      "mode": "tdd_required",
      "test_layers": ["unit"],
      "must_show_red_green": true
    },
    "check": {
      "run_tests": true,
      "test_layers": ["unit"],
      "verify_commands": ["pnpm lint", "pnpm typecheck", "pnpm test"],
      "cross_layer_required": false
    },
    "debug": {
      "fix_strategy": "reproduce_then_fix",
      "prefer_test_reproduction": true,
      "analysis_depth": "deep"
    }
  }
}
```

---

## 12. 不推荐的数据建模方式

以下做法不建议采用：

1. 只存 `use_tdd: true/false`
2. 只存 `test_layers`，不存 `verify_commands`
3. 让字段表达依赖平台专有 prompt 语义
4. 把文档描述当成 schema

原因：

- 布尔型表达力不足
- enforcement 无法稳定执行
- 多平台会自行发明语义

---

## 13. 验证规则

建议后续在代码中增加基本校验：

1. `implement.mode` 必须属于允许枚举
2. `analysis_depth` 必须是 `shallow` 或 `deep`
3. `verify_commands` 必须是字符串数组
4. `test_layers` 中的值必须属于允许集合

如果不合法：

- warning 并回退到默认值
- 不应让整个 pipeline 崩溃

---

## 14. 迁移建议

### 新任务

- 自动生成 `decision_hints`

### 旧任务

- 缺失时使用 runtime 内置默认值
- check 继续回退到 `worktree.yaml` 或 completion markers

### 迁移原则

- 不要求批量改历史 task
- 允许新旧任务混跑

---

## 15. 结论

`decision_hints` 应该被视为：

> spec-first 多 Agent 流水线的结构化 phase policy 契约。

它不是：

- dispatch 的内部变量集合
- 只给 prompt 看的人类提示
- 单平台临时实现细节

一个好的 `decision_hints` schema 必须做到：

1. **plan 能生成**
2. **runtime 能执行**
3. **多平台能共享**
4. **旧任务能回退**
5. **字段数量足够小，不把 schema 做成第二份 PRD**
