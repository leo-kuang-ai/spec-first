# Current-Task 深度分析

> 源文件: `/packages/cli/src/templates/claude/commands/spec/current-task.md`

---

## 1. Skill 概述

### 1.1 核心定位

**current-task** 是任务列表和切换命令，用于查看活跃任务并切换工作焦点。

| 维度 | 描述 |
|------|------|
| **目标** | 查看/切换当前任务 |
| **操作** | `list` 和 `switch` |
| **特点** | 只读写指针，不修改任务元数据 |

### 1.2 核心规则

```
┌─────────────────────────────────────────────────────────────┐
│                    核心规则                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   此命令只读取或更新当前任务指针                            │
│                                                             │
│   不做: 创建任务、初始化上下文、归档工作、修改 spec         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 功能详解

### 2.1 list - 列出任务

显示活跃任务列表，让用户选择切换目标。

```bash
python3 ./.spec-first/scripts/current_task.py list
```

### 2.2 switch - 切换任务

更新当前任务指针：

```bash
python3 ./.spec-first/scripts/current_task.py switch <selection>
```

**示例**:
```bash
# 按序号切换
python3 ./.spec-first/scripts/current_task.py switch 1

# 按路径切换
python3 ./.spec-first/scripts/current_task.py switch .spec-first/tasks/03-25-my-task
```

**目标文件**: `.spec-first/.current-task`

---

## 3. 用户触发词

### list 触发词

- "list tasks"
- "show current tasks"
- "what tasks are available"
- "切换任务"
- "查看任务列表"

### switch 触发词

- "switch to task A"
- "change current task"
- "go back to the bugfix task"
- "切换到任务 A"

---

## 4. 行为契约

### 4.1 输入

| 输入 | 描述 |
|------|------|
| `list` | 请求列出任务 |
| `switch` | 请求切换任务 |
| 选择条目 | list 后用户选择 |

### 4.2 输出

| 操作 | 输出 |
|------|------|
| `list` | 活跃任务列表 + 当前任务 |
| `switch` | 确认选择 + 新当前任务 |
| 可选提示 | 目标任务是否需要 init-context |

### 4.3 副作用

| 操作 | 副作用 |
|------|--------|
| `list` | 无状态变更 |
| `switch` | 写入 `.spec-first/.current-task` |
| 选择当前任务 | 无状态变更，报告已激活 |

### 4.4 无副作用

- ❌ 不修改 `task.json`
- ❌ 不修改 `prd.md`
- ❌ 不修改 `implement.jsonl`
- ❌ 不修改 `check.jsonl`
- ❌ 不修改 `debug.jsonl`
- ❌ 不修改 `spec/`

---

## 5. 流程图

```
┌─────────────────────────────────────────────────────────────┐
│                   current-task 工作流                        │
└─────────────────────────────────────────────────────────────┘

  用户请求
      │
      ├── "list tasks" ──────────────────────────┐
      │                                          ▼
      │                              ┌─────────────────┐
      │                              │ 显示任务列表    │
      │                              │ + 当前任务      │
      │                              └─────────────────┘
      │
      └── "switch to X" ────┐
                             │
                             ▼
                    ┌─────────────────┐
                    │ X 是当前任务?   │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                    ▼                 ▼
               [是]              [否]
                    │                 │
                    ▼                 ▼
           ┌─────────────┐   ┌─────────────────┐
           │ 报告已激活  │   │ 更新指针        │
           └─────────────┘   └────────┬────────┘
                                      │
                                      ▼
                             ┌─────────────────┐
                             │ 检查上下文完整性│
                             └────────┬────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    │                                   │
                    ▼                                   ▼
              [完整]                               [不完整]
                    │                                   │
                    ▼                                   ▼
           ┌─────────────┐                   ┌─────────────────┐
           │ 确认切换    │                   │ 建议运行        │
           └─────────────┘                   │ init-context    │
                                             └─────────────────┘
```

---

## 6. 推荐响应模式

切换时保持简短明确：

1. 确认选择的任务
2. 显示使用的命令或动作
3. 说明新的当前任务
4. 提及是否需要 `init-context`

**上下文完整时**:
```
✓ 已切换到任务: .spec-first/tasks/03-25-my-task
  路径: .spec-first/tasks/03-25-my-task
  上下文: implement.jsonl ✓ | check.jsonl ✓ | debug.jsonl ✓
```

**上下文不完整时**:
```
✓ 已切换到任务: .spec-first/tasks/03-25-my-task
  路径: .spec-first/tasks/03-25-my-task
  上下文: implement.jsonl ✓ | check.jsonl ✓ | debug.jsonl ✗
  提示: 该任务上下文不完整，建议先运行 init-context
```

---

## 7. 好案例与坏案例

### 7.1 好案例

- 用户想在选择前比较任务
- 用户想恢复现有任务
- 用户想切换焦点而不重新初始化仓库

### 7.2 坏案例

- 通过此命令创建新任务
- 不询问就自动运行 `init-context`
- 自动归档之前的任务
- 切换时编辑任务元数据

---

## 8. 常见错误

| 错误 | 说明 |
|------|------|
| **混淆 list 和 switch** | `list` 只读，`switch` 改变活跃任务 |
| **把切换当作创建** | 切换只改变指针，不创建任务 |
| **假设切换后上下文完整** | 目标任务可能没有 init-context 文件 |

---

## 9. 命令参考

| 命令 | 用途 |
|------|------|
| `current_task.py list` | 显示活跃任务 |
| `current_task.py switch <selection>` | 设置当前任务 |
| `task.py init-context <task> <type>` | 准备任务上下文 |
| `task.py finish` | 清除当前任务 |

---

## 10. 设计分析

### 10.1 单一职责

```
current-task: 只管理指针
    │
    ├── list: 读取指针和任务列表
    └── switch: 写入指针

其他职责由其他命令处理:
    ├── 创建任务 → task.py create
    ├── 初始化上下文 → task.py init-context
    ├── 归档任务 → task.py archive
    └── 完成任务 → task.py finish
```

### 10.2 状态管理

```
.spec-first/.current-task
         │
         │ 内容: 任务目录路径
         │
         └──→ 决定 Hook 注入哪个任务的上下文
```

---

## 11. 总结

**current-task** 是任务焦点管理工具：

```
list → 查看选项
switch → 改变焦点
         │
         └──→ 只更新指针，不修改其他内容
```

**核心价值**:
- 简单的任务切换
- 清晰的状态报告
- 上下文完整性提示
- 单一职责设计
