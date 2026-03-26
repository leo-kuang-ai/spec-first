# Phase 1 代码实施清单

> 目标：把主方案中的 Phase 1 从设计文档落到最小可运行闭环。
> 范围：只实现 `workflow_type + next_action + decision_hints` 的最小 contract，以及 implement/check 的最小 runtime 消费。

---

## 1. 实施目标

Phase 1 只做四件事：

1. 新任务创建时写出结构化 `workflow_type + next_action + decision_hints`
2. `dispatch` 继续只消费 `next_action`
3. `inject-subagent-context.py` 开始向 implement/check 注入最小 policy block
4. `ralph-loop.py` 优先执行 task-level `check.verify_commands`

明确不做：

1. 不实现 `--preset`
2. 不实现 `cross_layer_required`
3. 不实现 `evidence`
4. 不实现 `review / research` 主 workflow
5. 不实现 runtime 推断 verify commands

---

## 2. 新增模块

## 2.1 `workflow.py`

建议新增：

- 路径：
  [workflow.py](/Users/kuang/xiaobu/spec-first/packages/cli/src/templates/spec-first/scripts/common/workflow.py)

职责：

1. 定义 Phase 1 的 topology registry
2. 把 `workflow_type` 编译为 `next_action`

建议接口：

```python
WORKFLOW_TOPOLOGIES = {
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

def get_next_action(workflow_type: str) -> list[dict]:
    ...
```

要求：

1. 只支持 `default / quick-fix / docs-only`
2. 返回值是运行时唯一使用的 topology truth
3. `create-pr` 继续作为 terminal pipeline step 保留在编号序列中

## 2.2 `decision_hints.py`

建议新增：

- 路径：
  [decision_hints.py](/Users/kuang/xiaobu/spec-first/packages/cli/src/templates/spec-first/scripts/common/decision_hints.py)

职责：

1. 生成 Phase 1 默认 `decision_hints`
2. 根据 repo-level verify 配置和 repo 结构生成 `check.verify_commands`

建议接口：

```python
def get_default_verify_commands(repo_root: Path) -> list[str]:
    ...

def get_default_decision_hints(
    workflow_type: str,
    repo_root: Path,
) -> dict:
    ...
```

优先级必须写死：

1. task override
2. repo explicit verify config
3. producer-time repo-aware default
4. markers fallback

Phase 1 默认产物：

```json
{
  "implement": {
    "mode": "direct"
  },
  "check": {
    "verify_commands": ["<repo-specific commands>"]
  }
}
```

约束：

1. 不引入 runtime inference
2. 不把 `pnpm lint / typecheck / test` 写死成事实默认值
3. `tdd_recommended / tdd_required` 只保留为合法枚举，不在 Phase 1 默认产出

---

## 3. 必改文件

## 3.1 `task_store.py`

文件：
- [task_store.py](/Users/kuang/xiaobu/spec-first/packages/cli/src/templates/spec-first/scripts/common/task_store.py)

当前问题：

1. `next_action` 硬编码
2. 没有 `workflow_type`
3. 没有 `decision_hints`

需要改动：

1. 导入 `get_next_action()`
2. 导入 `get_default_decision_hints()`
3. 读取 `args.workflow`
4. 默认 `workflow_type = "default"`
5. 用 `workflow_type` 编译 `next_action`
6. 写入 `workflow_type`
7. 写入 `decision_hints`

建议改造后核心结构：

```python
workflow_type = getattr(args, "workflow", None) or "default"

task_data = {
    ...,
    "workflow_type": workflow_type,
    "current_phase": 0,
    "next_action": get_next_action(workflow_type),
    "decision_hints": get_default_decision_hints(
        workflow_type=workflow_type,
        repo_root=repo_root,
    ),
    ...,
}
```

注意：

1. `workflow_type` 是 create-time metadata
2. 运行时仍只以 `next_action` 为执行拓扑真相

## 3.2 `task.py`

文件：
- [task.py](/Users/kuang/xiaobu/spec-first/packages/cli/src/templates/spec-first/scripts/task.py)

需要改动：

1. `create` 子命令增加 `--workflow`
2. 只允许：
   - `default`
   - `quick-fix`
   - `docs-only`
3. `help` 文案同步更新

建议参数：

```python
p_create.add_argument(
    "--workflow",
    choices=["default", "quick-fix", "docs-only"],
    default="default",
    help="Workflow topology",
)
```

Phase 1 不加：

1. `--preset`
2. `with-tdd`
3. `debug`

## 3.3 `types.py`

文件：
- [types.py](/Users/kuang/xiaobu/spec-first/packages/cli/src/templates/spec-first/scripts/common/types.py)

需要改动：

1. 给 `TaskData` 增加 `workflow_type`
2. 给 `TaskData` 增加 `decision_hints`

建议最小补充：

```python
workflow_type: str
decision_hints: dict
```

注意：

1. `TaskData` 仍然保持 `TypedDict(total=False)`
2. 不要在 Phase 1 加 `evidence`
3. 不要过度细化为完整嵌套 TypedDict，Phase 1 先保持实现轻量

## 3.4 `inject-subagent-context.py`

文件：
- [.claude/hooks/inject-subagent-context.py](/Users/kuang/xiaobu/spec-first/.claude/hooks/inject-subagent-context.py)
- [inject-subagent-context.py](/Users/kuang/xiaobu/spec-first/packages/cli/src/templates/claude/hooks/inject-subagent-context.py)

当前问题：

1. `build_implement_prompt()` 没有 policy 注入位点
2. `build_check_prompt()` 仍写死 “Run project's lint and typecheck commands”
3. 还不会读取 `task.json.decision_hints`

需要改动：

1. 新增读取当前 task `decision_hints` 的 helper
2. 新增渲染 policy block 的 helper
3. 修改 `build_implement_prompt()`
4. 修改 `build_check_prompt()`

建议 helper：

```python
def get_task_decision_hints(repo_root: str, task_dir: str) -> dict:
    ...

def render_phase_policy_markdown(phase: str, decision_hints: dict) -> str:
    ...
```

Phase 1 只渲染：

### implement

```md
## Phase Policy

- `implement.mode`: `direct`

Execution requirements:
- Implement directly unless a stronger preset/policy is injected
- Do not perform git commit
```

### check

```md
## Phase Policy

- `check.verify_commands`: `["<repo-specific commands>"]`

Execution requirements:
- You must run the verification commands above
- Treat these commands as the task-specific gate for this task
- If they fail, continue checking/fixing instead of claiming completion
```

注入位置：

1. 在 `## Your Context` 之后
2. 在 `## Your Task` 之前

缺字段时：

1. 不渲染空 block
2. 保持原有 fallback 文案

## 3.5 `ralph-loop.py`

文件：
- [.claude/hooks/ralph-loop.py](/Users/kuang/xiaobu/spec-first/.claude/hooks/ralph-loop.py)

当前问题：

1. 只读 `.spec-first/worktree.yaml verify`
2. 不读 task-level `decision_hints`

需要改动：

1. 新增读取 task-level `decision_hints.check.verify_commands`
2. 调整 verify 命令优先级

建议新增 helper：

```python
def get_task_verify_commands(repo_root: str, task_dir: str) -> list[str]:
    ...
```

执行优先级改成：

1. `task.json.decision_hints.check.verify_commands`
2. `.spec-first/worktree.yaml verify`
3. completion markers

实现要求：

1. task-level contract 优先
2. repo-level verify 作为 fallback
3. 不做 runtime 推断命令

---

## 4. 可暂缓文件

## 4.1 `task_context.py`

文件：
- [task_context.py](/Users/kuang/xiaobu/spec-first/packages/cli/src/templates/spec-first/scripts/common/task_context.py)

当前结论：

Phase 1 不依赖它改造才能形成最小闭环。

但它是后续触点：

1. 如果以后要让 jsonl 初始化与 `decision_hints` 对齐，这里需要跟进
2. 如果以后要按 `workflow_type` / `preset` 初始化不同上下文模板，这里需要扩展

## 4.2 `dispatch.md`

文件：
- [.claude/agents/dispatch.md](/Users/kuang/xiaobu/spec-first/.claude/agents/dispatch.md)

当前结论：

Phase 1 不需要增加新的决策逻辑。

最多只需要补文档说明：

1. `next_action` 来自 compiler
2. `decision_hints` 由 runtime hooks 消费
3. `dispatch` 继续只做调度

---

## 5. 建议实施顺序

推荐顺序：

1. 新建 `workflow.py`
2. 新建 `decision_hints.py`
3. 修改 `task_store.py`
4. 修改 `task.py`
5. 修改 `types.py`
6. 修改 `ralph-loop.py`
7. 修改 `inject-subagent-context.py`

原因：

1. 先有 producer
2. 再有 runtime gate
3. 最后再有 prompt 呈现

---

## 6. 验证清单

### 6.1 创建任务

```bash
python3 ./.spec-first/scripts/task.py create "Test workflow" --workflow quick-fix
```

检查生成的 `task.json`：

1. 包含 `workflow_type`
2. 包含编译后的 `next_action`
3. 包含 `decision_hints`

### 6.2 topology 验证

`quick-fix` 任务应生成：

```json
[
  { "phase": 1, "action": "implement" },
  { "phase": 2, "action": "check" },
  { "phase": 3, "action": "create-pr" }
]
```

### 6.3 policy 注入验证

在 implement/check 子 agent prompt 中确认：

1. 出现 `## Phase Policy`
2. implement 能看到 `implement.mode`
3. check 能看到 `check.verify_commands`

### 6.4 verify gate 验证

构造一个 task-level `verify_commands` 故意失败的任务，确认：

1. `ralph-loop.py` 优先执行 task-level commands
2. 检查失败时阻止 stop
3. 不再直接退回 repo-level verify

---

## 7. 成功标准

Phase 1 完成后，应满足：

1. 新任务不再硬编码固定 `next_action`
2. `workflow_type` 不再是悬空概念
3. `decision_hints` 有最小 canonical schema
4. implement/check 开始消费 task-level policy
5. check gate 开始优先消费 task-level verify contract

如果上述 5 条没同时成立，就不应宣称 Phase 1 完成。
