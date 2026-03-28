# v8-lite 实施计划

> **基于**: design.md v1.0
> **创建日期**: 2026-03-27
> **目标**: 分步实施 v8-lite 最小裁剪版

---

## 执行说明

**For agentic workers**: 本计划包含 4 个独立任务，每个任务都是完整的开发单元。建议按顺序执行，每个任务完成后提交代码。

---

## 任务概览

| 任务 | 目标 | 工期 | 依赖 |
|------|------|------|------|
| Task 1 | 创建 skill resolver 核心逻辑 | 0.5 天 | 无 |
| Task 2 | 集成到任务创建流程 | 0.5 天 | Task 1 |
| Task 3 | 实现 explain 命令 | 0.5 天 | Task 2 |
| Task 4 | Hook 集成和测试 | 0.5 天 | Task 3 |

**总工期**: 2 天

---

## Task 1: 创建 Skill Resolver 核心逻辑

**目标**: 实现 skill 查表逻辑

**Files**:
- Create: `.spec-first/scripts/common/skill_resolver.py`
- Create: `.spec-first/config/skill-profiles.json`

### Step 1: 创建配置文件

创建 `.spec-first/config/skill-profiles.json`:

```json
{
  "profiles": {
    "backend-debug-implement": ["before-dev", "systematic-debugging"],
    "backend-default-implement": ["before-dev", "backend-patterns"],
    "frontend-default-implement": ["before-dev", "frontend-patterns"],
    "frontend-debug-implement": ["before-dev", "systematic-debugging"],
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

### Step 2: 创建 skill_resolver.py

创建 `.spec-first/scripts/common/skill_resolver.py`:

```python
"""Skill resolver for automatic skill selection based on task attributes."""

from pathlib import Path
from .io import read_json


def resolve_skills(
    dev_type: str | None,
    task_mode: str,
    action: str,
    config_path: Path
) -> list[str]:
    """
    根据任务属性解析 skill 列表

    Args:
        dev_type: 开发类型 (backend/frontend/fullstack/None)
        task_mode: 任务模式 (default/debug/tdd/docs)
        action: 动作名称 (implement/check/finish/create-pr)
        config_path: skill-profiles.json 路径

    Returns:
        skill 列表
    """
    if not config_path.exists():
        # 配置文件不存在，返回默认值
        return _get_default_skills(action)

    config = read_json(config_path)
    profiles = config.get("profiles", {})

    # 构建查找键（优先级从高到低）
    dev_type_str = dev_type or "*"
    keys = [
        f"{dev_type_str}-{task_mode}-{action}",  # 精确匹配
        f"{dev_type_str}-*-{action}",            # dev_type 匹配
        f"*-{task_mode}-{action}",               # task_mode 匹配
        f"*-*-{action}",                         # action 匹配
    ]

    # 查找匹配的 profile
    for key in keys:
        if key in profiles:
            return profiles[key]

    # 回退到默认值
    defaults = config.get("defaults", {})
    return defaults.get(action, [])


def _get_default_skills(action: str) -> list[str]:
    """获取默认 skills（配置文件不存在时使用）"""
    default_map = {
        "implement": ["before-dev"],
        "check": ["check"],
        "finish": ["finish-work"],
        "create-pr": ["create-pr"]
    }
    return default_map.get(action, [])
```

### Step 3: 测试 resolver

手动测试（在 Python REPL 中）:

```python
from pathlib import Path
from .spec-first.scripts.common.skill_resolver import resolve_skills

config_path = Path(".spec-first/config/skill-profiles.json")

# 测试 1: backend + debug + implement
skills = resolve_skills("backend", "debug", "implement", config_path)
assert skills == ["before-dev", "systematic-debugging"]

# 测试 2: frontend + default + implement
skills = resolve_skills("frontend", "default", "implement", config_path)
assert skills == ["before-dev", "frontend-patterns"]

# 测试 3: 通配符匹配
skills = resolve_skills("backend", "default", "check", config_path)
assert skills == ["check", "finish-work"]

# 测试 4: 默认值
skills = resolve_skills(None, "default", "implement", config_path)
assert skills == ["before-dev"]

print("All tests passed!")
```

### Step 4: 提交代码

```bash
git add .spec-first/scripts/common/skill_resolver.py
git add .spec-first/config/skill-profiles.json
git commit -m "feat(skill): add skill resolver and profiles config

- Implement skill_resolver.resolve_skills() with priority-based lookup
- Add skill-profiles.json with default profiles
- Support dev_type, task_mode, action matching"
```

---

## Task 2: 集成到任务创建流程

**目标**: 在创建任务时自动生成 selected_skills

**Files**:
- Modify: `.spec-first/scripts/common/task_store.py` (lines 170-212)
- Modify: `.spec-first/scripts/task.py` (add --task-mode argument)

### Step 1: 添加 --task-mode 参数

修改 `.spec-first/scripts/task.py`，在 create 子命令中添加参数：

```python
# 在 parser_create 定义后添加
parser_create.add_argument(
    "--task-mode",
    choices=["default", "debug", "tdd", "docs"],
    default="default",
    help="Task execution mode (default: default)"
)
```

### Step 2: 修改 task_store.py

在 `cmd_create()` 函数中，line 180 后添加：

```python
# 新增：解析 task_mode
task_mode = getattr(args, "task_mode", "default")

# 新增：解析所有 action 的 skills
selected_skills = {}
config_path = repo_root / ".spec-first/config/skill-profiles.json"

if config_path.exists():
    from .skill_resolver import resolve_skills
    for step in next_action:
        action = step["action"]
        skills = resolve_skills(
            getattr(args, "dev_type", None),
            task_mode,
            action,
            config_path
        )
        selected_skills[action] = skills
```

在 task_data 字典中（line 202 后）添加：

```python
task_data = {
    # ... 现有字段 ...
    "decision_hints": decision_hints,
    "task_mode": task_mode,           # 新增
    "selected_skills": selected_skills, # 新增
    "evidence": None,
    # ...
}
```

### Step 3: 测试任务创建

```bash
# 测试 1: backend debug 任务
python3 ./.spec-first/scripts/task.py create "Test backend debug" \
  --slug test-backend-debug \
  --dev-type backend \
  --task-mode debug

# 验证 task.json
cat .spec-first/tasks/*/task.json | grep -A 5 "selected_skills"
# 应该看到: "implement": ["before-dev", "systematic-debugging"]

# 测试 2: frontend default 任务
python3 ./.spec-first/scripts/task.py create "Test frontend" \
  --slug test-frontend \
  --dev-type frontend \
  --task-mode default

# 验证
cat .spec-first/tasks/*/task.json | grep -A 5 "selected_skills"
# 应该看到: "implement": ["before-dev", "frontend-patterns"]
```

### Step 4: 提交代码

```bash
git add .spec-first/scripts/common/task_store.py
git add .spec-first/scripts/task.py
git commit -m "feat(task): integrate skill resolver into task creation

- Add --task-mode parameter to task create command
- Auto-generate selected_skills field in task.json
- Support backend/frontend/debug/default modes"
```

---

## Task 3: 实现 explain 命令

**目标**: 提供任务状态可观测性

**Files**:
- Modify: `.spec-first/scripts/task.py` (add cmd_explain function)

### Step 1: 实现 cmd_explain 函数

在 `.spec-first/scripts/task.py` 中添加：

```python
def cmd_explain(args: argparse.Namespace) -> int:
    """显示当前任务状态和配置"""
    from .common.paths import get_repo_root
    from .common.io import read_json
    from .common.colors import colored, Colors
    
    repo_root = get_repo_root()
    current_task_file = repo_root / ".spec-first/.current-task"
    
    if not current_task_file.exists():
        print(colored("No active task", Colors.YELLOW))
        return 1
    
    task_dir = current_task_file.read_text().strip()
    task_json = repo_root / task_dir / "task.json"
    
    if not task_json.exists():
        print(colored(f"Task file not found: {task_json}", Colors.RED))
        return 1
    
    task_data = read_json(task_json)
    
    # 显示基本信息
    print(colored(f"Task: {task_data['id']}", Colors.BLUE))
    print(f"Status: {task_data['status']}")
    print(f"Workflow: {task_data['workflow_type']}")
    print(f"Task Mode: {task_data.get('task_mode', 'default')}")
    print()
    
    # 显示当前 action
    phase = task_data['current_phase']
    actions = task_data['next_action']
    
    if phase < len(actions):
        current = actions[phase]['action']
        print(colored(f"Current Action: {current}", Colors.GREEN))
        
        # 显示 selected skills
        skills = task_data.get('selected_skills', {}).get(current, [])
        if skills:
            print(colored("Selected Skills:", Colors.BLUE))
            for skill in skills:
                print(f"  - {skill}")
        else:
            print(colored("No skills selected", Colors.YELLOW))
        
        # 显示后续 actions
        if phase + 1 < len(actions):
            print()
            print(colored("Next Actions:", Colors.BLUE))
            for i in range(phase + 1, len(actions)):
                print(f"  {i - phase}. {actions[i]['action']}")
    else:
        print(colored("All actions completed", Colors.GREEN))
    
    return 0
```

### Step 2: 注册子命令

在 task.py 的 main() 函数中添加：

```python
# 在其他子命令后添加
parser_explain = subparsers.add_parser(
    "explain",
    help="Show current task status and configuration"
)
parser_explain.set_defaults(func=cmd_explain)
```

### Step 3: 测试 explain 命令

```bash
# 先创建并激活一个任务
python3 ./.spec-first/scripts/task.py create "Test explain" \
  --slug test-explain \
  --dev-type backend \
  --task-mode debug

python3 ./.spec-first/scripts/task.py start test-explain

# 运行 explain
python3 ./.spec-first/scripts/task.py explain

# 预期输出:
# Task: test-explain
# Status: planning
# Workflow: default
# Task Mode: debug
# 
# Current Action: implement
# Selected Skills:
#   - before-dev
#   - systematic-debugging
# 
# Next Actions:
#   1. check
#   2. finish
#   3. create-pr
```

### Step 4: 提交代码

```bash
git add .spec-first/scripts/task.py
git commit -m "feat(task): add explain command for task observability

- Implement cmd_explain() to show current task status
- Display current action and selected skills
- Show next actions in queue"
```

---

## Task 4: Hook 集成和端到端测试

**目标**: Hook 自动注入 skill 内容

**Files**:
- Modify: `.claude/hooks/inject-subagent-context.py`

### Step 1: 添加 skill 注入函数

在 `.claude/hooks/inject-subagent-context.py` 中添加：

```python
def inject_skills_for_action(task_data: dict, action: str) -> str:
    """注入当前 action 对应的 skills"""
    selected_skills = task_data.get("selected_skills", {})
    skills = selected_skills.get(action, [])
    
    if not skills:
        return ""
    
    content = []
    skills_dir = Path(".claude/skills")
    
    for skill_id in skills:
        skill_file = skills_dir / f"{skill_id}.md"
        if skill_file.exists():
            content.append(f"# Skill: {skill_id}\n\n")
            content.append(skill_file.read_text())
            content.append("\n\n---\n\n")
    
    return "".join(content)
```

### Step 2: 集成到现有 hook

在 hook 的主逻辑中调用：

```python
# 读取 task.json
task_data = read_json(task_json_path)

# 获取当前 action
current_phase = task_data.get("current_phase", 0)
next_action = task_data.get("next_action", [])
if current_phase < len(next_action):
    current_action = next_action[current_phase]["action"]
    
    # 注入 skills
    skill_content = inject_skills_for_action(task_data, current_action)
    if skill_content:
        print(skill_content)
```

### Step 3: 端到端测试

```bash
# 创建测试任务
python3 ./.spec-first/scripts/task.py create "E2E test" \
  --slug e2e-test \
  --dev-type backend \
  --task-mode debug

python3 ./.spec-first/scripts/task.py start e2e-test

# 验证 1: task.json 正确
cat .spec-first/tasks/e2e-test/task.json | jq '.selected_skills'

# 验证 2: explain 正确
python3 ./.spec-first/scripts/task.py explain

# 验证 3: hook 注入（需要实际触发 agent）
# 手动检查 hook 是否正确读取和注入 skill 内容
```

### Step 4: 清理测试任务

```bash
# 归档测试任务
python3 ./.spec-first/scripts/task.py archive test-backend-debug
python3 ./.spec-first/scripts/task.py archive test-frontend
python3 ./.spec-first/scripts/task.py archive test-explain
python3 ./.spec-first/scripts/task.py archive e2e-test
```

### Step 5: 提交代码

```bash
git add .claude/hooks/inject-subagent-context.py
git commit -m "feat(hook): integrate skill injection based on selected_skills

- Add inject_skills_for_action() to read and inject skills
- Hook automatically injects skills for current action
- Complete v8-lite minimal implementation"
```

---

## 验收标准

### Phase 1 完成标准
- [ ] `skill_resolver.py` 创建并通过测试
- [ ] `skill-profiles.json` 配置文件创建
- [ ] 查表逻辑正确（精确匹配 > 通配符 > 默认值）

### Phase 2 完成标准
- [ ] `--task-mode` 参数可用
- [ ] 创建任务时自动生成 `selected_skills` 字段
- [ ] 不同 dev_type/task_mode 生成不同 skills

### Phase 3 完成标准
- [ ] `explain` 命令可用
- [ ] 正确显示当前 action 和 selected skills
- [ ] 显示后续 actions

### Phase 4 完成标准
- [ ] Hook 正确读取 `selected_skills`
- [ ] Skill 内容正确注入到 agent context
- [ ] 端到端流程测试通过

---

## 总结

### 代码改动统计

| 类型 | 文件 | 代码量 |
|------|------|--------|
| 新增 | `skill_resolver.py` | ~50 行 |
| 新增 | `skill-profiles.json` | 配置文件 |
| 修改 | `task_store.py` | ~20 行 |
| 修改 | `task.py` (--task-mode) | ~5 行 |
| 新增 | `task.py` (cmd_explain) | ~60 行 |
| 修改 | `inject-subagent-context.py` | ~30 行 |
| **总计** | **6 个文件** | **~165 行** |

### 核心优势

1. **极简实现** - 只需 165 行新代码
2. **零破坏性** - 完全向后兼容
3. **立即可用** - 每个 Task 完成后即可使用
4. **易扩展** - 后续可叠加智能决策增强

### 注意事项

1. **向后兼容**
   - 现有任务无需迁移
   - `task_mode` 默认为 "default"
   - `selected_skills` 为空时使用默认值

2. **配置文件**
   - `skill-profiles.json` 不存在时使用硬编码默认值
   - 支持用户自定义配置

3. **测试覆盖**
   - 每个 Task 都包含测试步骤
   - Task 4 包含端到端测试

---

## 执行建议

### 推荐执行方式

**选项 1: 顺序执行**（推荐）
- 按 Task 1 → Task 2 → Task 3 → Task 4 顺序执行
- 每个 Task 完成后提交代码
- 便于回滚和问题定位

**选项 2: 并行执行**（高级）
- Task 1 独立执行
- Task 2-3 可并行（依赖 Task 1）
- Task 4 最后执行（依赖 Task 2）

### 时间估算

- Task 1: 0.5 天（核心逻辑）
- Task 2: 0.5 天（集成）
- Task 3: 0.5 天（可观测性）
- Task 4: 0.5 天（Hook + 测试）

**总计**: 2 天

---

**计划版本**: 1.0  
**最后更新**: 2026-03-27  
**维护者**: spec-first 团队
