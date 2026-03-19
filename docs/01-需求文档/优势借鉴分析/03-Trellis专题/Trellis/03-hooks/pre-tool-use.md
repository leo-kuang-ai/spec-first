# PreToolUse Hook 详解

> 本文档详细分析 Trellis 的 PreToolUse Hook（工具调用前钩子）

---

## 1. 核心定位

### 1.1 功能定义

**动态上下文注入钩子** — 在 Task 工具调用前，动态注入任务特定的上下文。

```
┌─────────────────────────────────────────────────────────────┐
│                   PreToolUse Hook 定位                       │
├─────────────────────────────────────────────────────────────┤
│  触发时机：                                                  │
│  └─ AI 调用 Task 工具前（调用子代理前）                       │
│                                                              │
│  核心功能：                                                  │
│  ├─ 拦截 Task 调用                                           │
│  ├─ 识别任务类型                                             │
│  ├─ 读取对应的 JSONL 上下文定义                               │
│  ├─ 动态注入上下文到子代理 prompt                             │
│  └─ 更新任务阶段状态                                          │
│                                                              │
│  支持的任务类型：                                            │
│  ├─ implement → implement.jsonl                              │
│  ├─ check → check.jsonl                                      │
│  ├─ debug → debug.jsonl                                      │
│  └─ plan → plan.jsonl                                        │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 核心价值

```
传统方式: AI 需要记住规范 → 随着对话进行遗忘 → 代码偏离规范
Hook 注入: 每次调用都有完整上下文 → 规范始终存在 → 代码符合规范
```

---

## 2. 执行流程

### 2.1 完整流程

```
┌─────────────────────────────────────────────────────────────┐
│                   PreToolUse Hook Flow                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Step 1: 拦截 Task 调用                                      │
│          AI 准备调用 Task 工具                                │
│          │                                                   │
│          ▼                                                   │
│  Step 2: 识别任务类型                                        │
│          从 Task 参数中提取 subagent_type                     │
│          │                                                   │
│          ▼                                                   │
│  Step 3: 查找任务目录                                        │
│          从参数中提取 task_dir                                │
│          │                                                   │
│          ▼                                                   │
│  Step 4: 读取 JSONL 文件                                     │
│          读取 {subagent_type}.jsonl                          │
│          │                                                   │
│          ▼                                                   │
│  Step 5: 加载上下文文件                                      │
│          读取 JSONL 中定义的所有文件                          │
│          │                                                   │
│          ▼                                                   │
│  Step 6: 组装上下文内容                                      │
│          按格式组装上下文 prompt                              │
│          │                                                   │
│          ▼                                                   │
│  Step 7: 更新任务阶段                                        │
│          更新 task.json 中的 current_phase                    │
│          │                                                   │
│          ▼                                                   │
│  Step 8: 注入到 Task 调用                                    │
│          修改 Task 参数，添加上下文                           │
│          │                                                   │
│          ▼                                                   │
│  Step 9: 继续执行 Task                                       │
│          子代理获得完整上下文后执行                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 核心逻辑伪代码

```python
def on_pre_tool_use(tool_name, tool_params):
    # 只处理 Task 工具
    if tool_name != "Task":
        return Continue()

    # 提取参数
    subagent_type = tool_params.get("subagent_type")
    task_dir = tool_params.get("task_dir")

    if not task_dir:
        return Continue()

    # 读取 JSONL 上下文定义
    jsonl_path = f"{task_dir}/{subagent_type}.jsonl"
    if not file_exists(jsonl_path):
        return Continue()

    context_entries = read_jsonl(jsonl_path)

    # 加载上下文内容
    context_content = []
    for entry in context_entries:
        content = read_file(entry["file"])
        context_content.append({
            "file": entry["file"],
            "reason": entry["reason"],
            "content": content
        })

    # 组装上下文 prompt
    context_prompt = assemble_context_prompt(context_content)

    # 更新任务阶段
    update_current_phase(task_dir, subagent_type)

    # 修改 Task 参数
    modified_params = inject_context(tool_params, context_prompt)

    return ModifyParams(modified_params)
```

---

## 3. JSONL 上下文定义

### 3.1 JSONL 格式

```jsonl
{"file": ".trellis/spec/backend/index.md", "reason": "Backend guidelines"}
{"file": ".trellis/spec/backend/api-design.md", "reason": "API design patterns"}
{"file": ".trellis/spec/backend/testing.md", "reason": "Testing standards"}
{"file": ".trellis/spec/guides/error-handling.md", "reason": "Error handling"}
{"file": "src/auth/", "reason": "Auth module reference"}
```

### 3.2 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `file` | string | 文件路径（可以是文件或目录） |
| `reason` | string | 为什么需要这个文件的上下文 |

### 3.3 路径类型处理

```python
def load_context_entry(entry):
    path = entry["file"]

    if is_directory(path):
        # 目录：读取目录下所有代码文件
        return load_directory_context(path)
    else:
        # 文件：直接读取
        return read_file(path)

def load_directory_context(dir_path):
    """读取目录上下文（限制深度和大小）"""
    context = []
    for file in list_files(dir_path, max_depth=2):
        if is_code_file(file) and file_size(file) < MAX_FILE_SIZE:
            context.append(read_file(file))
    return "\n\n".join(context)
```

---

## 4. 上下文组装

### 4.1 组装格式

```python
def assemble_context_prompt(context_entries):
    """组装上下文 prompt"""
    prompt = "## 项目规范上下文\n\n"

    for entry in context_entries:
        prompt += f"### {entry['reason']} ({entry['file']})\n"
        prompt += f"```\n{entry['content']}\n```\n\n"

    prompt += "请根据以上规范和上下文执行任务。\n"

    return prompt
```

### 4.2 组装示例

```
## 项目规范上下文

### Backend Guidelines (.trellis/spec/backend/index.md)
```
# Backend 开发规范

## 代码风格
- 使用 TypeScript strict mode
- 使用 named exports
- ...
```

### API Design Patterns (.trellis/spec/backend/api-design.md)
```
# API 设计规范

## RESTful 约定
- GET 用于查询
- POST 用于创建
- ...
```

### Testing Standards (.trellis/spec/backend/testing.md)
```
# 测试规范

## 单元测试
- 每个函数必须有测试
- 测试覆盖率 ≥ 75%
- ...
```

请根据以上规范和上下文执行任务。
```

---

## 5. 阶段自动更新

### 5.1 更新逻辑

```python
def update_current_phase(task_dir, subagent_type):
    """自动更新任务阶段"""
    phase_mapping = {
        "implement": "implement",
        "check": "check",
        "debug": "debug",
        "plan": "plan",
        "finish": "finish"
    }

    task_json_path = f"{task_dir}/task.json"
    task_json = read_json(task_json_path)

    # 更新阶段
    task_json["current_phase"] = phase_mapping.get(subagent_type, "unknown")
    task_json["phase_history"].append({
        "phase": task_json["current_phase"],
        "timestamp": current_timestamp()
    })

    write_json(task_json_path, task_json)
```

### 5.2 task.json 结构

```json
{
  "name": "auth-implementation",
  "title": "实现用户认证",
  "status": "active",
  "current_phase": "implement",
  "phase_history": [
    {"phase": "plan", "timestamp": "2026-03-01T10:00:00Z"},
    {"phase": "implement", "timestamp": "2026-03-01T10:30:00Z"}
  ],
  "created_at": "2026-03-01T09:00:00Z",
  "updated_at": "2026-03-01T10:30:00Z"
}
```

---

## 6. 完成标记生成

### 6.1 为 Check Agent 生成标记

```python
def get_completion_markers(task_dir):
    """从 check.jsonl 生成完成标记"""
    jsonl_path = f"{task_dir}/check.jsonl"
    entries = read_jsonl(jsonl_path)

    markers = []
    for entry in entries:
        # {"reason": "TypeCheck"} → "TYPECHECK_FINISH"
        marker = f"{entry['reason'].upper().replace(' ', '_')}_FINISH"
        markers.append(marker)

    return markers

def inject_completion_markers_prompt(task_dir, prompt):
    """注入完成标记提示"""
    markers = get_completion_markers(task_dir)

    if markers:
        marker_prompt = "\n\n## 完成标记要求\n"
        marker_prompt += "你必须在输出末尾包含以下完成标记：\n"
        for marker in markers:
            marker_prompt += f"- {marker}\n"

        return prompt + marker_prompt

    return prompt
```

---

## 7. 核心规则

### 7.1 六大铁律

| 规则 | 说明 |
|------|------|
| **1. 只处理 Task** | 只拦截 Task 工具调用，其他工具忽略 |
| **2. 必须有 task_dir** | 没有 task_dir 参数则跳过 |
| **3. 静默失败** | 读取失败不影响任务执行 |
| **4. 大小限制** | 上下文总大小有限制，避免膨胀 |
| **5. 自动更新** | 自动更新任务阶段，无需手动 |
| **6. 完成标记** | Check Agent 自动注入标记要求 |

### 7.2 检查清单

```markdown
## PreToolUse Hook 检查清单

- [ ] 已识别 Task 调用
- [ ] 已提取 subagent_type
- [ ] 已提取 task_dir
- [ ] 已读取 JSONL 文件
- [ ] 已加载上下文内容
- [ ] 已组装上下文 prompt
- [ ] 已更新任务阶段
- [ ] 已注入到 Task 参数
```

---

## 8. 对 spec-first 的借鉴价值

### 8.1 核心借鉴点

| 借鉴点 | 优先级 | 说明 |
|--------|--------|------|
| **JSONL 上下文定义** | P0 | 灵活配置每个任务的上下文 |
| **动态注入** | P0 | 每次调用都有完整上下文 |
| **阶段自动更新** | P1 | Hook 自动处理状态 |
| **完成标记生成** | P1 | 支持质量门禁 |

### 8.2 实现建议

```python
class PreToolUseHook:
    """PreToolUse Hook - 动态上下文注入"""

    MAX_CONTEXT_SIZE = 50000  # 最大上下文大小（字符）

    def execute(self, tool_name, tool_params):
        """执行上下文注入"""
        # 1. 只处理 Task 工具
        if tool_name != "Task":
            return Continue()

        # 2. 提取参数
        subagent_type = tool_params.get("subagent_type")
        task_dir = tool_params.get("task_dir")

        if not task_dir:
            return Continue()

        # 3. 读取上下文定义
        context_entries = self.read_jsonl(task_dir, subagent_type)

        # 4. 加载上下文内容
        context_content = self.load_context(context_entries)

        # 5. 检查大小限制
        if len(context_content) > self.MAX_CONTEXT_SIZE:
            context_content = self.truncate_context(context_content)

        # 6. 组装 prompt
        prompt = self.assemble_prompt(context_content)

        # 7. 添加完成标记（Check Agent）
        if subagent_type == "check":
            prompt = self.inject_completion_markers(task_dir, prompt)

        # 8. 更新阶段
        self.update_phase(task_dir, subagent_type)

        # 9. 修改参数
        modified_params = self.inject_to_params(tool_params, prompt)

        return ModifyParams(modified_params)

    def read_jsonl(self, task_dir, subagent_type):
        """读取 JSONL 文件"""
        jsonl_path = f"{task_dir}/{subagent_type}.jsonl"
        if not file_exists(jsonl_path):
            return []

        return parse_jsonl(read_file(jsonl_path))
```

---

## 9. 相关文档

- [SessionStart Hook](./session-start.md) - 会话初始化
- [SubagentStop Hook](./subagent-stop.md) - 质量门禁
- [Dispatch Agent](../02-agents/dispatch-agent.md) - 纯调度器
- [Check Agent](../02-agents/check-agent.md) - 质量检查
