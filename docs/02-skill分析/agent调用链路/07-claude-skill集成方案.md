# Claude Skill 集成方案

这份方案只面向 `spec-first/packages/cli/src/templates/claude` 这条实现线，目标是：

**把 ECC 的 skill 资产同步进来，并在 Claude 的任务执行链路里，自动选择对应节点需要的 skill。**

这里的 Claude 链路按三层理解：

- **命令层**：`/spec:start`、`/spec:brainstorm`、`/spec:finish-work`
- **agent 层**：`dispatch`、`implement`、`check`、`debug`、`plan`、`research`
- **hook 层**：`inject-subagent-context.py`、`ralph-loop.py`

---

## 1. 设计目标

1. 把 `/Users/kuang/xiaobu/everything-claude-code/skills` 纳入 `spec-first` 的 skill 资产体系
2. 能在 ECC skill 更新后自动同步本地镜像和 manifest
3. 在任务创建期自动选出节点需要的 skill
4. 让 Claude hook 只负责消费，不负责策略决策
5. 先只打通 `implement / check` 两个节点

---

## 2. 设计边界

### 2.1 不改的部分

- 不改现有 `dispatch -> implement / check / debug` 主链路
- 不把 `/spec:start / brainstorm / finish-work` 当成 agent 改造
- 不引入仓库级 runtime 评分器
- 不把 skill 做成第二套 workflow
- 不让 agent 自己临场决定是否启用某个 skill

### 2.2 保留的部分

- 保留现有 `current_phase`
- 保留现有 `decision_hints`
- 保留现有 `implement / check / debug` agent 入口
- 保留现有 hook 注入机制
- 保留现有 `/spec:start / brainstorm / finish-work` 命令入口

### 2.3 新增的部分

- skill 同步层
- skill manifest / catalog
- 任务创建期解析层
- `selected_skills`

---

## 3. 总体架构

```text
ECC skill 源码
  -> 同步脚本
  -> skill-catalog.json / skill-manifest.json
  -> 任务创建期解析
  -> selected_skills
  -> Claude hook
  -> implement / check agent
```

这条链路分成三层：

1. **同步层**
2. **解析层**
3. **消费层**

---

## 4. 第一层：同步层

### 4.1 职责

同步层只负责资产接入，不负责任务决策。

### 4.2 输入

- ECC skill 源目录
  - `/Users/kuang/xiaobu/everything-claude-code/skills`
- 本地 skill 镜像目录
  - `.spec-first/skills/`
- 本地配置目录
  - `.spec-first/config/`

### 4.3 输出

- `.spec-first/skills/<skill-name>/SKILL.md`
- `.spec-first/skills/<skill-name>/...` 辅助文件
- `.spec-first/config/skill-catalog.json`
- `.spec-first/config/skill-manifest.json`
- `.spec-first/config/skill-sync-report.json`

### 4.4 同步脚本职责

同步脚本应该只做四件事：

1. 扫描 ECC skill 目录
2. 同步 skill 镜像
3. 生成/更新 catalog 和 manifest
4. 输出变更报告

---

## 5. 第二层：解析层

### 5.1 职责

解析层在任务创建时运行，负责给当前任务选出最合适的 skill bundle。

### 5.2 输入

- `action`
- `package`
- `task_mode`
- `language`
- `framework`

### 5.3 输出

写入 task.json：

```json
{
  "selected_skills": {
    "implement": ["before-dev", "tdd-workflow", "frontend-patterns"],
    "check": ["check-cross-layer"]
  }
}
```

### 5.4 选择优先级

建议按这个顺序选：

1. `node skill`
2. `language / framework context skill`
3. `explicit override`
4. `default`

---

## 6. 第三层：消费层

### 6.1 职责

Claude hook 只负责消费 `selected_skills`，不负责策略裁决。

### 6.2 消费位置

优先改这两个模板：

- `packages/cli/src/templates/claude/hooks/inject-subagent-context.py`
- `packages/cli/src/templates/claude/agents/implement.md`
- `packages/cli/src/templates/claude/agents/check.md`

`/spec:start`、`/spec:brainstorm`、`/spec:finish-work` 仍然只负责命令层流程控制，不在这一轮改成 skill 消费点。

### 6.3 消费流程

```text
hook 读取 task.json
  -> 找到当前 action
  -> 读取 selected_skills[action]
  -> 注入 skill 内容
  -> agent 执行
```

---

## 7. 首批建议接入的 skill

优先接这些：

- `before-dev`
- `tdd-workflow`
- `check-cross-layer`
- `frontend-patterns`
- `backend-patterns`

原因：

- `before-dev` 是几乎所有代码任务都需要的前置 skill
- `tdd-workflow` 能覆盖高价值实现场景
- `check-cross-layer` 适合 check 节点
- `frontend-patterns / backend-patterns` 适合按技术栈注入

---

## 8. Claude 模板的最小改动顺序

### 第一步

先做同步层和 manifest，不动 hook。

### 第二步

让任务创建期解析 `selected_skills`。

### 第三步

修改 Claude hook，消费 `selected_skills`。

### 第四步

补 `explain` 或日志输出，方便查看为什么选了这些 skill。

### Claude 主流程口径

```text
/spec:start
  -> 建立任务上下文
  -> 任务创建期解析 selected_skills
  -> /spec:brainstorm（仅在任务不清晰时）
  -> /before-dev
  -> dispatch
  -> implement agent
  -> check agent
  -> /spec:finish-work
```

其中：

- `/spec:start`、`/spec:brainstorm`、`/spec:finish-work` 是命令
- `dispatch / implement / check / debug / plan / research` 是 agent
- skill 只在 `implement / check` 这一轮先跑通闭环

---

## 9. 为什么这样最稳

因为它保留了当前系统的稳定主干：

- workflow 仍然负责节点顺序
- agent 仍然负责执行
- hook 仍然负责注入上下文
- skill 只新增一层可选能力

这样做的好处是：

- 可回滚
- 可解释
- 可测试
- 不会把系统做成重型调度器

---

## 10. 结论

如果要先在 Claude Code 这条线上推进，最合理的方案是：

**先同步 skill 资产，再在任务创建期解析 selected_skills，最后让 Claude hook 消费结果。**

这条路径最小、稳定，适合小步推进。
