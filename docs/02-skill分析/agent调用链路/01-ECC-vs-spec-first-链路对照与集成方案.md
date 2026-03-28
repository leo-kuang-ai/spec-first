# ECC vs spec-first：Agent 到 Skill 的链路对照与集成方案

这份文档单独说明两件事：

1. ECC 的 agent/skill 调用链路和当前 `spec-first` 项目的链路有什么不同
2. 如果要把 ECC 这种“按场景灵活选择 skill”的能力集成到当前项目，应该怎么做才不过度设计

## 1. 一句话结论

ECC 的核心是：

- `command -> agent -> skill -> harness runtime`

当前 `spec-first` 的核心是：

- `workflow / phase -> subagent(agent) -> hook/context -> 静态 skill 模板`

两者的主要差异不在“有没有 skill”，而在于：

- ECC 把 skill 当成运行时可被 harness 自动激活的对象
- `spec-first` 目前把 skill 更多当成平台模板或规范输入源
- ECC 的灵活性来自运行时匹配
- `spec-first` 的稳定性来自任务编排和 hook 注入

如果目标是“按场景自动选出最合适的 skill 执行任务”，最小集成方式不是引入一个仓库级运行时评分器，而是在任务创建阶段增加一层轻量解析：

- 解析 `dev_type / task_mode / action`
- 查 `skill-profiles.json`
- 写入 `selected_skills`
- 由 `implement / check` 这类 agent 的 hook 消费

---

## 2. ECC 的链路

ECC 的链路可以概括成四层：

```text
用户请求
  -> 命令
  -> agent
  -> skill
  -> harness runtime 激活
```

### 2.1 命令先选 agent

例如：

- `/tdd` -> `tdd-guide`
- `/security-scan` -> `security-reviewer`
- `/plan` -> `planner`

这里的职责是“谁来处理任务”，不是“任务具体怎么做”。

### 2.2 agent 再绑定 skill

agent 负责角色和工作方式，skill 负责方法、步骤、清单和约束。

例如：

```text
/tdd
  -> tdd-guide agent
  -> tdd-workflow skill
```

### 2.3 harness 负责运行时激活

ECC 里 skill 不只是静态文件，它还有元数据，允许 harness 根据上下文做自动激活。

这意味着：

- 仓库本身不是最终的“选择器”
- 真正的灵活性在运行时
- skill 选择是平台能力的一部分

---

## 3. 当前 spec-first 的链路

当前 `spec-first` 更偏工作流驱动：

```text
/spec:start
  -> task 分类
  -> brainstorm 或直接进入任务执行
  -> dispatch agent
  -> implement / check / debug subagent
  -> hook/context 注入
  -> 平台模板消费
```

### 3.1 任务是入口

入口不是 skill，而是：

- `/spec:start`
- `/spec:brainstorm`
- `task workflow`

### 3.2 dispatch 是纯调度

`dispatch` 的职责是按 phase 调用子 agent，不做复杂决策。

### 3.3 skill 在项目里有两种角色

当前项目里的 skill 更偏两类：

1. 平台模板
2. 规范输入源

这和 ECC 的“skill 是运行时可被激活的执行单元”不完全一样。

---

## 4. 关键差异

| 维度 | ECC | spec-first 当前状态 |
|---|---|---|
| 入口 | command -> agent | `/spec:start -> task workflow` |
| 执行单元 | agent -> skill | workflow -> subagent(agent) |
| skill 角色 | 运行时可激活对象 | 平台模板 / 规范输入源 |
| skill 选择 | harness runtime 自动匹配 | phase / hook / 固定模板 |
| 选择真源 | skill 元数据 + runtime 上下文 | `current_phase` + `decision_hints` |
| 灵活性来源 | 运行时发现 | 工作流编排 + hook 注入 |
| 可观测性 | 元数据和 runtime 行为 | `task.json` + explain + hook 日志 |

一句话：

- ECC 更灵活
- `spec-first` 更稳定

---

## 5. 最小集成方案

如果目标只是“按场景自动选 skill”，建议只加一层轻量解析，不要做完整运行时评分器。

### 5.1 推荐链路

```text
task create
  -> 读取 dev_type / task_mode / action
  -> 查 skill-profiles.json
  -> 写入 selected_skills
  -> implement / check agent 启动
  -> hook 注入对应 skill
```

### 5.2 推荐字段

```json
{
  "selected_skills": {
    "implement": ["before-dev", "tdd"],
    "check": ["check-cross-layer"]
  }
}
```

### 5.3 推荐规则

优先级建议：

1. `dev_type + task_mode + action`
2. `dev_type + action`
3. `action`
4. 默认值

这样可以覆盖大部分实际场景，同时不把系统做重。

---

## 6. 为什么不直接做 ECC 式运行时评分器

因为当前项目的目标不是“运行时最聪明”，而是“运行时可解释、可维护、可回放”。

如果直接引入评分器，会带来这些问题：

- 谁决定最终 skill，边界会变模糊
- 测试矩阵会扩大
- 任务状态和 skill 选择会出现双真源
- 调试成本上升

把 skill 选择前移到任务创建期，能保留灵活性，同时保持系统稳定。

---

## 7. `implement` 节点如何接 TDD

如果要在 `implement` 里支持 `tdd`，推荐做法是：

1. 任务创建时决定是否 TDD
2. 把结果写入 `selected_skills.implement = ["before-dev", "tdd"]`
3. `implement agent` 启动时只消费，不临场判断
4. `tdd` skill 只描述流程，不决定策略

这条链路可以写成：

```text
task create
  -> resolve tdd
  -> selected_skills.implement = ["before-dev", "tdd"]
  -> implement agent
  -> hook 注入 before-dev + tdd
  -> 先写测试，再写实现
```

这比在 agent prompt 里临时判断“要不要 TDD”更稳定。

---

## 8. 什么时候需要更进一步

只有在下面这些条件成立时，才值得往 ECC 那种 runtime 灵活度继续靠：

- skill 数量明显增多
- 同一节点经常要组合多个 skill
- 场景上下文会显著影响 skill 组合
- 团队愿意接受更复杂的规则引擎

如果这些条件不满足，建议继续停留在：

- 任务创建期解析
- `selected_skills`
- hook 注入
- `explain` 可观测

---

## 9. 结论

当前项目如果要集成 ECC 的灵活性，最优路径不是“把 ECC 的 runtime 选择器搬过来”，而是：

- 保留现有 workflow / agent / hook 主链路
- 新增一个轻量 skill profile 解析层
- 在任务创建期完成 skill 选择
- 让 agent 只消费，不决策

这能同时做到：

- 保持稳定
- 增加灵活性
- 不引入第二套复杂策略系统

