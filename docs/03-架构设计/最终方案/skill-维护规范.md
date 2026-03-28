# Skill 维护规范

> **日期**: 2026-03-27
> **适用方案**: `v8-lite-最小裁剪版`
> **目标**: 让新增 skill 的维护方式稳定、可理解、可验证

---

## 1. 维护目标

Skill 维护只解决三件事：

1. **skill 正文怎么写**
2. **skill 什么时候生效**
3. **skill 怎么验证是否选对**

不把 skill 维护扩展成新的策略系统。

---

## 2. 核心原则

### 2.1 正文与选择分离

- skill 正文只描述“怎么做”
- `skill-profiles.json` 只描述“什么时候用”
- `task.json` 只记录“当前任务实际用了什么”

### 2.2 一个 skill 对应一个稳定 id

- 一个 `id` 对应一份技能正文
- 不要把多个职责塞进一个 skill
- 行为变化大时，新建 skill id，不覆盖旧 id

### 2.3 不把 skill 变成策略层

skill 不负责：

- workflow
- 门禁
- verify_commands
- 任务编排

---

## 3. 推荐目录结构

```text
.spec-first/
  capabilities/
    before-dev.md
    systematic-debugging.md
    check.md
    finish-work.md
    create-pr.md
  config/
    skill-profiles.json
    presets.json
  tasks/
    ...
```

说明：

- `capabilities/` 放 skill 正文
- `skill-profiles.json` 放 skill 映射
- `task.json` 放实际选择结果

---

## 4. skill 正文规范

每个 skill 文档建议包含：

1. 适用场景
2. 触发条件
3. 输入要求
4. 执行步骤
5. 输出要求
6. 禁忌事项

示例：

```md
# before-dev

## 适用场景
代码修改前

## 触发条件
implement 动作开始时

## 输入要求
- 当前任务上下文
- 相关 spec 文档

## 执行步骤
1. 读取任务上下文
2. 读取相关 spec
3. 明确改动范围

## 输出要求
- 明确实施计划

## 禁忌事项
- 不直接开始写代码
```

---

## 5. skill 选择规范

### 5.1 映射文件

文件位置：

```text
.spec-first/config/skill-profiles.json
```

### 5.2 推荐键名

优先使用：

- `dev_type + task_mode + action`

必要时可降级为：

- `dev_type + action`
- `action`
- `defaults`

### 5.3 示例

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

## 6. 新增 skill 的流程

### 6.1 新增步骤

1. 新建 skill 正文
2. 把 skill id 加到 `skill-profiles.json`
3. 运行 `task explain` 看结果
4. 运行真实任务验证 hook 注入

### 6.2 变更原则

- 小改动优先改 profile
- 语义变化大才新建 skill
- 不要在 skill 正文里偷偷改选择规则

---

## 7. 更新与退役

### 7.1 更新

- skill 内容可以迭代
- skill id 尽量不变
- 兼容性变化由 profile 控制

### 7.2 退役

退役 skill 时：

1. 从 `skill-profiles.json` 移除引用
2. 保留正文一段时间
3. 确认没有任务再消费后再删除

---

## 8. 验证方式

### 8.1 选择验证

使用：

```bash
spec-first task explain
```

确认：

- 当前 action 正确
- selected skills 正确
- profile 来源正确

### 8.2 执行验证

跑一次真实任务，确认：

- hook 能注入 skill
- 当前节点执行正常
- 现有 check 流程不被破坏

---

## 9. 一句话总结

**skill 负责“怎么做”，profile 负责“什么时候用”，task.json 负责“实际用了什么”。**

