# SubagentStop Hook 详解

> 本文档详细分析 Trellis 的 SubagentStop Hook（子代理停止钩子）

---

## 1. 核心定位

### 1.1 功能定义

**Ralph Loop 质量门禁钩子** — 在子代理停止前验证输出完整性，强制完成度检查。

```
┌─────────────────────────────────────────────────────────────┐
│                  SubagentStop Hook 定位                      │
├─────────────────────────────────────────────────────────────┤
│  触发时机：                                                  │
│  └─ 子代理准备停止时（Agent 任务完成）                        │
│                                                              │
│  核心功能：                                                  │
│  ├─ 拦截子代理停止请求                                       │
│  ├─ 检查输出中是否包含完成标记                               │
│  ├─ 缺少标记 → 阻止停止，要求继续                             │
│  ├─ 有标记 → 允许停止                                        │
│  └─ 迭代限制（最多 5 次）                                    │
│                                                              │
│  设计目标：                                                  │
│  ├─ 确保 Agent 完整执行任务                                  │
│  ├─ 避免 Agent 半途而废                                      │
│  └─ 强制输出完整性检查                                       │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Ralph Loop 命名由来

> "Ralph" 来自《辛普森一家》中 Ralph Wiggum 的形象 — 代表"不够聪明"或"不够努力"。
> 这个 Hook 确保 Agent 不会像 Ralph 一样"半途而废"，必须完成任务才能停止。

---

## 2. 执行流程

### 2.1 完整流程

```
┌─────────────────────────────────────────────────────────────┐
│                  SubagentStop Hook Flow                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Step 1: 子代理请求停止                                      │
│          Agent 完成任务，准备停止                             │
│          │                                                   │
│          ▼                                                   │
│  Step 2: Hook 拦截请求                                       │
│          SubagentStop Hook 被触发                             │
│          │                                                   │
│          ▼                                                   │
│  Step 3: 检查迭代次数                                        │
│          是否超过最大迭代次数（5 次）                          │
│          │                                                   │
│          ├─ 超过 → 强制停止（避免无限循环）                    │
│          │                                                   │
│          ▼                                                   │
│  Step 4: 获取期望的完成标记                                   │
│          从 check.jsonl 动态生成                              │
│          │                                                   │
│          ▼                                                   │
│  Step 5: 扫描 Agent 输出                                     │
│          检查是否包含所有完成标记                             │
│          │                                                   │
│          ├────────────────────────────────┐                  │
│          │                                │                  │
│     包含所有标记                      缺少标记                │
│          │                                │                  │
│          ▼                                ▼                  │
│     允许停止                        阻止停止                  │
│          │                                │                  │
│          │                                ▼                  │
│          │                        生成继续消息                │
│          │                        要求补充标记                │
│          │                                │                  │
│          │                                ▼                  │
│          │                        Agent 继续执行              │
│          │                        (迭代计数 +1)               │
│          │                                │                  │
│          ▼                                │                  │
│     任务完成 ◄─────────────────────────────┘                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 核心逻辑伪代码

```python
MAX_ITERATIONS = 5

def on_subagent_stop(subagent_type, output, iteration_count):
    # 只处理 Check Agent
    if subagent_type != "check":
        return AllowStop()

    # 检查迭代限制
    if iteration_count >= MAX_ITERATIONS:
        return ForceStop(reason="Max iterations reached")

    # 获取期望的完成标记
    expected_markers = get_completion_markers(task_dir)

    # 检查输出中的标记
    missing_markers = []
    for marker in expected_markers:
        if marker not in output:
            missing_markers.append(marker)

    # 判断是否允许停止
    if not missing_markers:
        return AllowStop()
    else:
        return BlockStop(
            message=f"Missing completion markers. Please add:\n" +
                    "\n".join(f"- {m}" for m in missing_markers)
        )
```

---

## 3. 完成标记机制

### 3.1 标记生成

```python
def get_completion_markers(task_dir):
    """从 check.jsonl 动态生成完成标记"""
    jsonl_path = f"{task_dir}/check.jsonl"

    if not file_exists(jsonl_path):
        return []

    entries = read_jsonl(jsonl_path)
    markers = []

    for entry in entries:
        reason = entry.get("reason", "")
        # {"reason": "TypeCheck"} → "TYPECHECK_FINISH"
        # {"reason": "Security Check"} → "SECURITY_CHECK_FINISH"
        marker = f"{reason.upper().replace(' ', '_')}_FINISH"
        markers.append(marker)

    return markers
```

### 3.2 标记示例

**check.jsonl**:
```jsonl
{"file": ".trellis/spec/backend/testing.md", "reason": "TypeCheck"}
{"file": ".trellis/spec/guides/security.md", "reason": "SecurityCheck"}
{"file": ".trellis/spec/backend/lint.md", "reason": "Lint"}
```

**生成的完成标记**:
```
TYPECHECK_FINISH
SECURITYCHECK_FINISH
LINT_FINISH
```

### 3.3 Check Agent 输出要求

```markdown
## 检查完成

### 检查结果
- [x] TypeCheck: 通过
- [x] SecurityCheck: 通过
- [x] Lint: 通过

### 完成标记
TYPECHECK_FINISH
SECURITYCHECK_FINISH
LINT_FINISH
```

---

## 4. 迭代限制机制

### 4.1 迭代计数

```python
class IterationTracker:
    """迭代计数器"""

    def __init__(self, task_dir, subagent_type):
        self.task_dir = task_dir
        self.subagent_type = subagent_type
        self.state_file = f"{task_dir}/.ralph_state.json"

    def get_iteration_count(self):
        """获取当前迭代次数"""
        state = self.load_state()
        return state.get(f"{self.subagent_type}_iterations", 0)

    def increment_iteration(self):
        """增加迭代次数"""
        state = self.load_state()
        key = f"{self.subagent_type}_iterations"
        state[key] = state.get(key, 0) + 1
        self.save_state(state)

    def reset_iterations(self):
        """重置迭代次数"""
        state = self.load_state()
        state[f"{self.subagent_type}_iterations"] = 0
        self.save_state(state)
```

### 4.2 状态文件

```json
{
  "check_iterations": 2,
  "debug_iterations": 0,
  "last_check_time": "2026-03-01T10:30:00Z",
  "check_history": [
    {"iteration": 1, "missing": ["TYPECHECK_FINISH"]},
    {"iteration": 2, "missing": []}
  ]
}
```

### 4.3 达到限制时的处理

```python
def handle_max_iterations(subagent_type, output):
    """达到最大迭代时的处理"""
    return ForceStop(
        reason=f"Max iterations ({MAX_ITERATIONS}) reached for {subagent_type}",
        message="""
已达到最大迭代次数限制。这通常意味着：

1. 任务定义可能不够清晰
2. 检查规则可能存在冲突
3. Agent 可能遇到了无法解决的问题

建议：
- 检查 check.jsonl 配置是否合理
- 检查 Agent 输出了解具体问题
- 考虑手动干预
""",
        output=output
    )
```

---

## 5. 阻止消息格式

### 5.1 标准阻止消息

```markdown
## ⚠️ 任务未完成

检测到缺少以下完成标记：

- TYPECHECK_FINISH
- SECURITYCHECK_FINISH

### 当前输出
```
[Agent 的部分输出]
```

### 要求
请在输出末尾添加所有缺失的完成标记。

示例格式：
```
## 检查完成
TYPECHECK_FINISH
SECURITYCHECK_FINISH
```

请继续执行任务并添加完整的完成标记。
```

### 5.2 迭代警告

```markdown
## ⚠️ 迭代警告

当前迭代次数: 4/5

还剩 1 次迭代机会。如果仍未完成任务，将被强制停止。

缺少的标记:
- TYPECHECK_FINISH

请确保在输出中包含所有完成标记。
```

---

## 6. 与其他 Hook 的协作

### 6.1 Hook 协作流程

```
┌─────────────────────────────────────────────────────────────┐
│                   Hook 协作网络                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  SessionStart Hook                                           │
│       │                                                      │
│       ▼                                                      │
│  AI 开始工作                                                  │
│       │                                                      │
│       ▼                                                      │
│  调用 Task 工具 ──────▶ PreToolUse Hook                       │
│       │                      │                               │
│       │                      ▼                               │
│       │              注入上下文到子代理                        │
│       │                      │                               │
│       ▼                      ▼                               │
│  子代理执行 ◀────────────────┘                               │
│       │                                                      │
│       ▼                                                      │
│  子代理请求停止 ──────▶ SubagentStop Hook                     │
│                              │                               │
│                     ┌────────┴────────┐                      │
│                     │                 │                      │
│                 有标记            缺少标记                    │
│                     │                 │                      │
│                     ▼                 ▼                      │
│                 允许停止         阻止停止                     │
│                     │                 │                      │
│                     │                 ▼                      │
│                     │           子代理继续                    │
│                     │                 │                      │
│                     ▼                 │                      │
│                 任务完成 ◄────────────┘                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 数据流

```
PreToolUse Hook:
  - 读取 check.jsonl
  - 生成完成标记列表
  - 注入到子代理 prompt

SubagentStop Hook:
  - 读取完成标记列表
  - 扫描子代理输出
  - 验证标记存在
```

---

## 7. 核心规则

### 7.1 六大铁律

| 规则 | 说明 |
|------|------|
| **1. 只处理 Check** | 只对 Check Agent 强制门禁 |
| **2. 标记必须** | 必须包含所有完成标记才能停止 |
| **3. 迭代限制** | 最多 5 次迭代，避免无限循环 |
| **4. 清晰反馈** | 阻止时提供清晰的缺失标记列表 |
| **5. 渐进警告** | 接近限制时给出警告 |
| **6. 强制停止** | 达到限制必须停止，避免资源浪费 |

### 7.2 检查清单

```markdown
## SubagentStop Hook 检查清单

- [ ] 已识别子代理类型
- [ ] 已检查迭代次数
- [ ] 已获取期望标记
- [ ] 已扫描输出
- [ ] 已识别缺失标记
- [ ] 已做出停止/继续决定
- [ ] 已生成反馈消息
```

---

## 8. 配置选项

### 8.1 Hook 配置

```yaml
# .claude/settings.json
{
  "hooks": {
    "SubagentStop": {
      "command": "python3 ./.trellis/hooks/ralph-loop.py",
      "timeout": 3000,
      "config": {
        "max_iterations": 5,
        "check_agents": ["check"],
        "strict_mode": true
      }
    }
  }
}
```

### 8.2 可配置项

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `max_iterations` | 5 | 最大迭代次数 |
| `check_agents` | ["check"] | 需要检查的 Agent 类型 |
| `strict_mode` | true | 是否严格模式（缺少任何标记都阻止） |

---

## 9. 对 spec-first 的借鉴价值

### 9.1 核心借鉴点

| 借鉴点 | 优先级 | 说明 |
|--------|--------|------|
| **Ralph Loop 质量门禁** | P0 | Hook 层强制完成度检查 |
| **动态完成标记** | P0 | 从 JSONL 动态生成 |
| **迭代限制** | P1 | 避免无限循环 |
| **清晰反馈** | P1 | 提供明确的缺失信息 |

### 9.2 实现建议

```python
class SubagentStopHook:
    """SubagentStop Hook - Ralph Loop 质量门禁"""

    MAX_ITERATIONS = 5

    def execute(self, subagent_type, output, context):
        """执行停止检查"""
        # 1. 只处理 Check Agent
        if subagent_type not in ["check"]:
            return AllowStop()

        # 2. 获取迭代计数
        tracker = IterationTracker(context.task_dir, subagent_type)
        iteration = tracker.get_iteration_count()

        # 3. 检查迭代限制
        if iteration >= self.MAX_ITERATIONS:
            return self.force_stop(iteration, output)

        # 4. 获取期望标记
        expected = self.get_expected_markers(context.task_dir)

        # 5. 检查输出
        missing = self.check_markers(output, expected)

        # 6. 决策
        if not missing:
            tracker.reset_iterations()
            return AllowStop()
        else:
            tracker.increment_iteration()
            return self.block_stop(missing, iteration)

    def get_expected_markers(self, task_dir):
        """获取期望的完成标记"""
        jsonl_path = f"{task_dir}/check.jsonl"
        entries = parse_jsonl(read_file(jsonl_path))
        return [
            f"{e['reason'].upper().replace(' ', '_')}_FINISH"
            for e in entries
        ]

    def check_markers(self, output, expected):
        """检查输出中的标记"""
        missing = []
        for marker in expected:
            if marker not in output:
                missing.append(marker)
        return missing

    def block_stop(self, missing, iteration):
        """阻止停止"""
        remaining = self.MAX_ITERATIONS - iteration
        message = f"Missing completion markers (iteration {iteration}/{self.MAX_ITERATIONS}):\n"
        message += "\n".join(f"- {m}" for m in missing)
        message += f"\n\nRemaining iterations: {remaining}"

        return BlockStop(message=message)

    def force_stop(self, iteration, output):
        """强制停止"""
        return ForceStop(
            reason=f"Max iterations ({self.MAX_ITERATIONS}) reached",
            output=output
        )
```

---

## 10. 相关文档

- [PreToolUse Hook](./pre-tool-use.md) - 上下文注入
- [SessionStart Hook](./session-start.md) - 会话初始化
- [Check Agent](../02-agents/check-agent.md) - 质量检查
- [Dispatch Agent](../02-agents/dispatch-agent.md) - 纯调度器
