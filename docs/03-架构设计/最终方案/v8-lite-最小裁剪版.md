# Spec-First v8-lite - 最小裁剪版

> **版本**: 1.0
> **日期**: 2026-03-27
> **状态**: 推荐实施方案
> **定位**: 保留现有流程，只增加按场景选择 skill 的最小能力

---

## 1. 目标

只实现一件事：

**按任务场景自动选择最合适的 skill，并注入给当前执行节点。**

不做架构重构，不做双真源迁移，不做平台泛化。

---

## 2. 保留范围

只保留 4 个能力：

1. `skill-profiles.json`
2. `resolve_skills()`
3. `explain` 命令
4. hook 注入

---

## 3. 不做范围

明确不做：

- 不重构 workflow
- 不引入 selector / capability 新体系
- 不做 `decision_hints -> action_config` 全量迁移
- 不做 evidence 平台化
- 不做静态平台 manifest 生成
- 不做复杂门禁系统
- 不做 LLM 决策层
- 不把 preset 变成策略系统

---

## 4. 当前模型

保留现有任务模型，只新增 `selected_skills`：

```json
{
  "current_phase": 0,
  "next_action": [
    {"action": "implement"},
    {"action": "check"},
    {"action": "finish"},
    {"action": "create-pr"}
  ],
  "decision_hints": {
    "check": {
      "verify_commands": ["pnpm lint", "pnpm typecheck"]
    }
  },
  "selected_skills": {
    "implement": ["before-dev", "systematic-debugging"],
    "check": ["check", "finish-work"],
    "finish": ["finish-work"],
    "create-pr": ["create-pr"]
  }
}
```

说明：

- `current_phase` 继续保留
- `next_action` 继续保留
- `decision_hints` 继续保留
- `selected_skills` 是唯一新增的执行相关字段

---

## 5. 选择规则

skill 选择只做查表，不做推理。

优先级：

1. `dev_type + task_mode + action`
2. `dev_type + action`
3. `action`
4. 默认值

示例配置：

```json
{
  "profiles": {
    "backend-debug-implement": ["before-dev", "systematic-debugging"],
    "frontend-default-implement": ["before-dev", "frontend-patterns"],
    "*-*-check": ["check", "finish-work"],
    "*-*-finish": ["finish-work"],
    "*-*-create-pr": ["create-pr"]
  },
  "defaults": {
    "implement": ["before-dev"],
    "check": ["check"],
    "finish": ["finish-work"],
    "create-pr": ["create-pr"]
  }
}
```

---

## 6. 任务创建

任务创建时只新增一件事：

- 解析当前任务的 `selected_skills`

创建完成后直接写入 `task.json`，供 explain 和 hook 使用。

---

## 7. explain

`explain` 只做可观测性，不改数据。

输出三件事：

- 当前 action 是什么
- 当前选中了哪些 skill
- skill 来自哪个 profile

示例：

```text
Current Task: fix-login-bug
Current Action: implement
Selected Skills:
  - before-dev
  - systematic-debugging
Source: backend-debug-implement
```

---

## 8. hook 注入

hook 只做消费，不做决策。

流程：

1. 读 `current_phase`
2. 推出当前 `action`
3. 读 `selected_skills[action]`
4. 注入对应 skill 内容
5. agent 执行当前动作

### 8.1 implement 的 TDD mode

如果当前任务在创建时被解析为 TDD 场景，`implement` 这一步只需要多携带一个 `tdd` skill。

推荐规则：

- 任务创建阶段决定是否进入 TDD
- `implement agent` 不自己判断要不要 TDD
- `tdd` skill 只描述执行方式，不负责策略决策
- hook 在 `implement` 阶段把 `before-dev` 和 `tdd` 一起注入

典型行为顺序：

1. 先写测试
2. 运行测试，确认失败
3. 写最小实现
4. 重新运行测试，确认通过
5. 做必要重构

示例：

```json
{
  "selected_skills": {
    "implement": ["before-dev", "tdd"]
  }
}
```

这样做的好处是：

- 不新增一层策略引擎
- `implement` 仍然只消费结果
- TDD 只是 `implement` 的一种可选执行模式
- 任务创建、explain、hook 注入三处都能解释清楚

---

## 9. 质量门禁

只保留最轻的一层：

- `check` 时如果 `verify_commands` 为空，阻断
- `finish` 只检查前置结果是否存在
- `create-pr` 只检查 `finish_note` 是否存在

---

## 10. 最小实施清单

只改 4 个地方：

1. `task_store.py`
2. `task.py`
3. hook
4. `skill-profiles.json`

---

## 11. 验收标准

这版是否成功，只看 4 件事：

1. 创建任务后能自动选出 skill
2. `explain` 能说明为什么选这些 skill
3. hook 能把 skill 注入到当前 action
4. 现有 check 流程不被破坏

---

## 12. 结论

**保留现有 workflow 和 check 链路，只新增一个 skill profile 查表层 + explain + hook 注入。**

这才是“最小满足，不过度设计”的版本。
