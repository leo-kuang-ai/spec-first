# Session Start Hook 详解

> 本文档详细分析 Trellis 的 Session Start Hook（会话启动钩子）

---

## 1. 核心定位

### 1.1 功能定义

**会话初始化钩子** — 在 AI 会话开始时自动注入项目上下文。

```
┌─────────────────────────────────────────────────────────────┐
│                  Session Start Hook 定位                     │
├─────────────────────────────────────────────────────────────┤
│  触发时机：                                                  │
│  └─ 新会话开始时（Claude Code 启动）                         │
│                                                              │
│  核心功能：                                                  │
│  ├─ 注入项目上下文                                           │
│  ├─ 加载工作流文档                                           │
│  ├─ 注入规范索引                                             │
│  ├─ 恢复上次会话状态                                         │
│  └─ 初始化 AI 工作环境                                       │
│                                                              │
│  输出：                                                     │
│  ├─ 上下文注入提示                                           │
│  ├─ 工作流指引                                               │
│  └─ 状态恢复信息                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 与其他 Hook 的关系

| Hook | 触发时机 | 主要功能 |
|------|----------|----------|
| **SessionStart** | 会话开始 | 注入全局上下文 |
| **PreToolUse** | Task 调用前 | 注入任务特定上下文 |
| **SubagentStop** | 子代理停止 | 质量门禁检查 |

---

## 2. 执行流程

### 2.1 完整流程

```
┌─────────────────────────────────────────────────────────────┐
│                 Session Start Hook Flow                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Step 1: 检测会话开始                                        │
│          Claude Code 启动时自动触发                          │
│          │                                                   │
│          ▼                                                   │
│  Step 2: 读取项目配置                                        │
│          ├─ 检查 .trellis/ 目录存在                          │
│          ├─ 读取 workflow.md                                 │
│          └─ 读取 spec 索引                                   │
│          │                                                   │
│          ▼                                                   │
│  Step 3: 获取当前状态                                        │
│          python3 ./.trellis/scripts/get_context.py           │
│          │                                                   │
│          ▼                                                   │
│  Step 4: 恢复上次会话                                        │
│          ├─ 读取 workspace 日志                              │
│          ├─ 识别活跃任务                                     │
│          └─ 恢复任务上下文                                   │
│          │                                                   │
│          ▼                                                   │
│  Step 5: 生成上下文提示                                      │
│          ├─ 工作流指引                                       │
│          ├─ 规范索引                                         │
│          └─ 状态报告                                         │
│          │                                                   │
│          ▼                                                   │
│  Step 6: 注入到 AI 上下文                                    │
│          作为 system prompt 的一部分                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 核心脚本调用

```python
# session-start.py 核心逻辑

def on_session_start():
    # 1. 检查项目配置
    if not is_trellis_project():
        return None

    # 2. 读取工作流文档
    workflow = read_file(".trellis/workflow.md")

    # 3. 获取当前状态
    context = run_script("./.trellis/scripts/get_context.py")

    # 4. 读取规范索引
    spec_index = read_spec_index()

    # 5. 生成上下文提示
    prompt = generate_context_prompt(
        workflow=workflow,
        context=context,
        spec_index=spec_index
    )

    return prompt
```

---

## 3. 上下文注入内容

### 3.1 注入内容结构

```
┌─────────────────────────────────────────────────────────────┐
│                  Session Start 注入内容                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. 工作流文档                                               │
│     ├─ .trellis/workflow.md                                 │
│     └─ 命令使用指南                                          │
│                                                              │
│  2. 规范索引                                                 │
│     ├─ .trellis/spec/backend/index.md                       │
│     ├─ .trellis/spec/frontend/index.md                      │
│     └─ .trellis/spec/guides/index.md                        │
│                                                              │
│  3. 当前状态                                                 │
│     ├─ 活跃任务列表                                          │
│     ├─ 当前分支                                              │
│     ├─ 最近会话                                              │
│     └─ 待处理事项                                            │
│                                                              │
│  4. 工作建议                                                 │
│     ├─ 建议使用的命令                                        │
│     └─ 建议继续的任务                                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 注入示例

```markdown
## Trellis 项目上下文

### 工作流指引
使用 `/trellis:start` 开始开发会话。

### 规范索引
- Backend: `.trellis/spec/backend/index.md`
- Frontend: `.trellis/spec/frontend/index.md`
- Cross-layer: `.trellis/spec/guides/cross-layer.md`

### 当前状态
- 活跃任务: 2 个
- 当前分支: feature/auth
- 最近提交: abc1234 (2小时前)

### 建议操作
- 继续任务: auth-implementation
- 运行: `/trellis:start` 恢复上下文
```

---

## 4. get_context.py 脚本

### 4.1 脚本功能

```python
#!/usr/bin/env python3
"""
get_context.py - 获取项目当前上下文

输出格式:
{
    "active_tasks": [...],
    "current_branch": "...",
    "recent_sessions": [...],
    "pending_items": [...]
}
"""

def get_context():
    context = {
        "active_tasks": get_active_tasks(),
        "current_branch": get_current_branch(),
        "recent_sessions": get_recent_sessions(),
        "pending_items": get_pending_items()
    }
    return json.dumps(context, indent=2)

def get_active_tasks():
    """获取活跃任务列表"""
    tasks_dir = ".trellis/tasks"
    tasks = []
    for task in list_directory(tasks_dir):
        task_json = read_json(f"{tasks_dir}/{task}/task.json")
        if task_json["status"] == "active":
            tasks.append({
                "name": task,
                "title": task_json["title"],
                "phase": task_json["current_phase"]
            })
    return tasks

def get_current_branch():
    """获取当前 git 分支"""
    return run_command("git branch --show-current")

def get_recent_sessions():
    """获取最近会话"""
    index = read_json(".trellis/workspace/index.json")
    return index.get("recent_sessions", [])[:5]

def get_pending_items():
    """获取待处理事项"""
    # 检查未完成的任务、未合并的 PR 等
    items = []
    # ... 实现细节
    return items
```

### 4.2 输出示例

```json
{
  "active_tasks": [
    {
      "name": "auth-implementation",
      "title": "实现用户认证",
      "phase": "implement"
    },
    {
      "name": "api-refactor",
      "title": "API 重构",
      "phase": "plan"
    }
  ],
  "current_branch": "feature/auth",
  "recent_sessions": [
    {
      "date": "2026-03-01",
      "title": "认证功能开发",
      "commits": ["abc1234", "def5678"]
    }
  ],
  "pending_items": [
    "完成 auth-implementation 任务",
    "审查 api-refactor PR"
  ]
}
```

---

## 5. Workspace 日志系统

### 5.1 日志结构

```
.trellis/workspace/
├── index.md           # 索引文件
├── journal-1.md       # 会话日志（每文件最多 2000 行）
├── journal-2.md       # 超过 2000 行自动创建新文件
└── ...
```

### 5.2 索引文件格式

```markdown
# Workspace 索引

## 统计
- 总会话数: 42
- 最后活跃: 2026-03-01
- 当前日志文件: journal-3.md

## 最近会话
| 日期 | 标题 | 提交 |
|------|------|------|
| 2026-03-01 | 认证功能开发 | abc1234 |
| 2026-02-28 | API 重构 | def5678 |
```

### 5.3 会话记录格式

```markdown
## Session: 2026-03-01 - 认证功能开发

### 完成内容
- 实现 JWT 令牌验证
- 添加刷新令牌逻辑
- 编写测试用例

### 提交
- abc1234: feat(auth): 实现 JWT 令牌验证
- def5678: test(auth): 添加认证测试

### 相关任务
- auth-implementation
```

---

## 6. 核心规则

### 6.1 五大铁律

| 规则 | 说明 |
|------|------|
| **1. 自动触发** | 会话开始时自动执行，无需用户调用 |
| **2. 最小上下文** | 只注入必要信息，避免上下文膨胀 |
| **3. 状态恢复** | 恢复上次会话的关键信息 |
| **4. 建议驱动** | 提供建议操作，不强制执行 |
| **5. 静默失败** | 出错时不影响会话启动 |

### 6.2 检查清单

```markdown
## Session Start Hook 检查清单

- [ ] 已检查 .trellis/ 目录
- [ ] 已读取 workflow.md
- [ ] 已获取当前状态
- [ ] 已读取规范索引
- [ ] 已生成上下文提示
- [ ] 已注入到 AI 上下文
```

---

## 7. 配置选项

### 7.1 Hook 配置

```yaml
# .claude/settings.json
{
  "hooks": {
    "SessionStart": {
      "command": "python3 ./.trellis/hooks/session-start.py",
      "timeout": 5000
    }
  }
}
```

### 7.2 可配置项

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `max_sessions` | 5 | 显示的最近会话数 |
| `include_workflow` | true | 是否包含工作流文档 |
| `include_spec_index` | true | 是否包含规范索引 |
| `include_suggestions` | true | 是否提供建议操作 |

---

## 8. 对 spec-first 的借鉴价值

### 8.1 核心借鉴点

| 借鉴点 | 优先级 | 说明 |
|--------|--------|------|
| **会话状态恢复** | P1 | 恢复上次会话的上下文 |
| **Workspace 日志** | P1 | 持久化会话历史 |
| **规范索引注入** | P1 | 自动注入规范索引 |
| **建议驱动** | P2 | 提供建议操作 |

### 8.2 实现建议

```python
class SessionStartHook:
    """Session Start Hook - 会话初始化"""

    def execute(self):
        """执行会话初始化"""
        # 1. 检查项目配置
        if not self.is_spec_first_project():
            return None

        # 2. 读取项目状态
        state = self.get_project_state()

        # 3. 恢复会话上下文
        last_session = self.recover_last_session()

        # 4. 生成上下文提示
        prompt = self.generate_prompt(state, last_session)

        # 5. 返回注入内容
        return HookResult(
            content=prompt,
            metadata={
                "project": "spec-first",
                "session_id": generate_session_id()
            }
        )

    def get_project_state(self):
        """获取项目状态"""
        return {
            "active_features": self.get_active_features(),
            "current_stage": self.get_current_stage(),
            "pending_tasks": self.get_pending_tasks()
        }

    def recover_last_session(self):
        """恢复上次会话"""
        sessions = self.read_session_log()
        return sessions[0] if sessions else None
```

---

## 9. 相关文档

- [PreToolUse Hook](./pre-tool-use.md) - 任务上下文注入
- [SubagentStop Hook](./subagent-stop.md) - 质量门禁
- [start 命令](../01-commands/session-commands.md) - 会话启动
