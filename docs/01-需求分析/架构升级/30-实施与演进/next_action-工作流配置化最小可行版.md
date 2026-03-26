# next_action 工作流配置化最小可行版

> **版本**: v0.1  
> **定位**: 最小可行方案  
> **目标**: 只解决 workflow topology 的最小配置化问题，不引入新的 gate engine，不破坏 `dispatch` 纯调度边界。

---

## 1. 背景

当前 `next_action` 在任务创建时写死为固定四阶段：

```json
[
  { "phase": 1, "action": "implement" },
  { "phase": 2, "action": "check" },
  { "phase": 3, "action": "finish" },
  { "phase": 4, "action": "create-pr" }
]
```

这带来的真实问题只有两个：

1. 所有任务都被迫走同一拓扑
2. 一些明显场景不适配，例如文档任务、快速修复

如果以终为始，并结合已确认的总体方案，`next_action` 这一层只应解决：

> 这个任务有哪些 phase，顺序如何。

它**不应该**解决：

1. TDD 怎么做
2. check 跑哪些命令
3. gate 怎么判定
4. debug 用什么修复策略

这些属于：

- `decision_hints`
- runtime hooks
- phase agents 的自主执行层

---

## 2. 本文目标

本最小可行版只做四件事：

1. 让 `next_action` 支持少量 workflow topology 模板
2. 保持默认行为与当前系统基本一致
3. 不修改 `dispatch` 的纯调度定位
4. 与 `decision_hints` / runtime enforcement 明确分层

---

## 3. 非目标

本方案明确不做：

1. 不引入完整 workflow DSL
2. 不引入 `gate.py`
3. 不在 `dispatch` 中做 gate 判断
4. 不新增 `tdd` / `review` / `debug-systematic` 作为一等 phase
5. 不进行破坏性迁移

---

## 4. 设计原则

### 4.1 `next_action` 只负责 topology

`next_action` 只表达：

- phase 是否存在
- phase 顺序

不表达：

- phase 的策略
- phase 的验证规则
- phase 的内部行为

### 4.2 拓扑少而稳

第一阶段只引入最稳定、最有价值的少量模板。

### 4.3 运行策略继续交给 `decision_hints`

例如：

- `implement.mode`
- `check.verify_commands`
- `check.cross_layer_required`

这些都不进入 `next_action`。

### 4.4 `dispatch` 保持纯调度

`dispatch` 继续只读 `next_action` 并启动 phase，不承担流程引擎职责。

---

## 5. 推荐最小架构

```text
用户需求
   │
   ▼
task creation / plan
   │
   ├── 生成 next_action        ← 只定义流程拓扑
   └── 生成 decision_hints     ← 只定义 phase policy
            │
            ▼
dispatch
   │
   └── 按 next_action 调度 phase
            │
            ▼
runtime hooks
   │
   ├── 注入 decision_hints
   └── 执行 check.verify_commands
            │
            ▼
implement / check / debug / finish
```

关键边界：

- `next_action` 不替代 `decision_hints`
- `decision_hints` 不替代 `next_action`
- `dispatch` 不替代 runtime

---

## 6. 最小模板集合

第一阶段只建议保留 3 个 topology 模板。

### 6.1 `default`

适用：

- 常规研发任务

定义：

```json
[
  { "phase": 1, "action": "implement" },
  { "phase": 2, "action": "check" },
  { "phase": 3, "action": "finish" },
  { "phase": 4, "action": "create-pr" }
]
```

### 6.2 `quick-fix`

适用：

- 紧急修复
- 明确不需要 finish/spec sync 的小范围改动

定义：

```json
[
  { "phase": 1, "action": "implement" },
  { "phase": 2, "action": "check" },
  { "phase": 3, "action": "create-pr" }
]
```

### 6.3 `docs-only`

适用：

- 文档任务
- 无需 PR 自动化动作的轻量任务

定义：

```json
[
  { "phase": 1, "action": "implement" },
  { "phase": 2, "action": "check" }
]
```

---

## 7. 不建议第一阶段引入的模板

以下模板暂不建议进入主方案：

1. `with-tdd`
2. `with-review`
3. `debug`
4. `research`

原因如下。

### 7.1 `with-tdd`

TDD 应先作为 `implement.mode` 的 phase policy，而不是先做成独立 phase。

### 7.2 `with-review`

代码审查目前缺少稳定的 runtime 与流程闭环，先做成 phase 会把系统复杂度拉高。

### 7.3 `debug`

`debug-systematic` 更适合作为 skill/policy，而不是当前 workflow topology 的基础 phase。

### 7.4 `research`

`research` 更像前置探索动作，不适合作为主流水线默认 phase。

---

## 8. 数据结构

### 8.1 推荐最小字段

第一阶段不新增复杂 `workflow` 对象，建议只增加一个轻量字段：

```json
{
  "workflow_type": "default",
  "next_action": [
    { "phase": 1, "action": "implement" },
    { "phase": 2, "action": "check" },
    { "phase": 3, "action": "finish" },
    { "phase": 4, "action": "create-pr" }
  ]
}
```

这样做的好处：

1. `workflow_type` 便于追踪和切换
2. `next_action` 仍然是运行时直接消费字段
3. 不引入第二套复杂 workflow config schema

### 8.2 为什么不用完整 `workflow.phases`

原始大方案里引入：

```json
{
  "workflow": {
    "type": "with-tdd",
    "phases": [...]
  }
}
```

这个结构的问题是：

1. 很容易继续膨胀成 DSL
2. 容易和 `next_action` 形成双真相
3. 需要额外展开逻辑

对最小可行版来说，没有必要。

---

## 9. 生成方式

### 9.1 创建任务时

`task_store.py` 根据 `workflow_type` 生成 `next_action`。

伪代码：

```python
DEFAULT_NEXT_ACTIONS = {
    "default": [
        {"phase": 1, "action": "implement"},
        {"phase": 2, "action": "check"},
        {"phase": 3, "action": "finish"},
        {"phase": 4, "action": "create-pr"},
    ],
    "quick-fix": [
        {"phase": 1, "action": "implement"},
        {"phase": 2, "action": "check"},
        {"phase": 3, "action": "create-pr"},
    ],
    "docs-only": [
        {"phase": 1, "action": "implement"},
        {"phase": 2, "action": "check"},
    ],
}
```

### 9.2 plan 阶段

`plan` 可以根据任务类型覆盖 `workflow_type`，但不应在此阶段引入复杂 gate 逻辑。

例如：

- 文档任务 → `docs-only`
- 紧急修复 → `quick-fix`
- 常规研发 → `default`

---

## 10. 与 `decision_hints` 的分工

### 10.1 `next_action`

只负责：

- 流程拓扑

### 10.2 `decision_hints`

只负责：

- phase policy

推荐最小字段：

```json
{
  "decision_hints": {
    "implement": {
      "mode": "tdd_recommended"
    },
    "check": {
      "verify_commands": ["pnpm lint", "pnpm typecheck", "pnpm test"],
      "cross_layer_required": false
    }
  }
}
```

### 10.3 runtime hooks

只负责：

- 注入 policy
- 执行 gate

也就是：

- `inject-subagent-context.py` 消费 `decision_hints`
- `ralph-loop.py` 执行 `check.verify_commands`

---

## 11. LLM 自主决策边界

在本最小方案里，LLM 自主性应主要存在于 phase execution layer：

- `implement`
- `check`
- `debug`
- `finish`

而不应主要存在于：

- `next_action`
- `dispatch`
- runtime hooks

换句话说：

- `next_action` 决定“走哪几步”
- `decision_hints` 决定“哪些边界不能突破”
- LLM 决定“边界内怎么做最好”

---

## 12. 需要修改的最小文件集合

第一阶段只建议改动：

1. [task_store.py](/Users/kuang/xiaobu/spec-first/packages/cli/src/templates/spec-first/scripts/common/task_store.py)
   - 新增 `workflow_type`
   - 按模板生成 `next_action`

2. [phase.py](/Users/kuang/xiaobu/spec-first/packages/cli/src/templates/spec-first/scripts/common/phase.py)
   - 无需大改，只要继续基于 `next_action` 工作即可

3. 相关 task 类型定义文件
   - 增加 `workflow_type` 字段

不建议第一阶段改：

1. `dispatch.md`
2. `gate.py`
3. `implement.md` 的复杂 TDD 分支
4. 新增大量 workflow action

---

## 13. 兼容策略

### 13.1 旧任务

如果没有 `workflow_type`：

- 视为 `default`
- 继续使用已有 `next_action`

### 13.2 新任务

创建时写入：

```json
{
  "workflow_type": "default"
}
```

### 13.3 回退能力

即使 `workflow_type` 出错，只要 `next_action` 仍然存在，dispatch 仍可正常工作。

这保证了迁移风险可控。

---

## 14. 最小实施计划

### Phase 1

1. 在 `task_store.py` 中定义 3 个默认模板
2. 创建任务时支持 `workflow_type`
3. 将模板展开为 `next_action`
4. 为旧任务保留 `default` fallback

### Phase 2

1. 在 `plan` 中增加轻量 workflow 选择逻辑
2. 不引入新的 action 类型
3. 不引入新的 gate engine

---

## 15. 最终结论

`next_action` 的最小可行配置化，不应该走向完整 workflow engine。

它应该只做一件事：

> 将固定四阶段流程收敛为“少量可选的流程拓扑模板”。

对当前项目，最合适的第一阶段是：

1. 只保留 `default / quick-fix / docs-only`
2. 只增加 `workflow_type`
3. 继续以 `next_action` 作为运行时直接消费字段
4. 把策略与门控继续留在 `decision_hints + runtime hooks`

这样才能同时满足：

- 不过度设计
- 不脱离目标
- 与终局架构一致
- 具备真实落地价值
