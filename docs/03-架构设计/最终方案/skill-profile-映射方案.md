# Skill Profile 映射方案

> **版本**: 1.0
> **日期**: 2026-03-27
> **定位**: v8-lite 的 skill 选择增强
> **复杂度**: 极简（~200 行代码）

---

## 1. 问题定义

### 1.1 用户需求

**核心诉求**：在不同场景下，自动选择最适合的 skill 执行任务

**具体场景**：
- Backend 任务 → 激活 backend 相关 skill
- Frontend 任务 → 激活 frontend 相关 skill
- Debug 任务 → 激活 debugging 相关 skill
- Docs 任务 → 激活 docs 相关 skill

### 1.2 当前系统现状

**已有能力**：
- ✅ task.json 有 `dev_type` 字段（backend/frontend/fullstack）
- ✅ task.json 有 `workflow_type` 字段（default/quick-fix/docs-only）
- ✅ 平台已有 skill 目录（.claude/skills/, .codex/skills/）

**缺失能力**：
- ❌ 没有"根据场景自动选择 skill"的逻辑
- ❌ 没有统一的 skill 配置机制

### 1.3 v8 方案的问题

v8 引入了复杂的 selector 系统：
- capability registry（能力注册表）
- selector rules（选择规则）
- 多层推导逻辑
- 3300+ 行代码

**问题**：过度设计，维护成本高

---

## 2. 解决方案

### 2.1 核心思想

**用简单的查表逻辑替代复杂的 selector 系统**

```text
输入：dev_type + task_mode + action
查表：skill-profiles.json
输出：skill 列表
```

### 2.2 架构图

```text
┌─────────────────────────────────────────────────────────┐
│ Task Creation                                           │
│ - dev_type: backend                                     │
│ - task_mode: debug                                      │
│ - current_action: implement                             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ Skill Profile Resolver                                  │
│ - 读取 skill-profiles.json                              │
│ - 查找匹配的 profile                                    │
│ - 返回 skill 列表                                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ task.json                                               │
│ {                                                       │
│   "dev_type": "backend",                                │
│   "task_mode": "debug",                                 │
│   "selected_skills": {                                  │
│     "implement": ["before-dev", "systematic-debugging"],│
│     "check": ["check", "finish-work"]                   │
│   }                                                     │
│ }                                                       │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌──────────────────┐    ┌──────────────────────┐
│ Dynamic Platform │    │ Static Platform      │
│ (Claude/iFlow)   │    │ (Codex/Kiro)         │
├──────────────────┤    ├──────────────────────┤
│ Hook 读取        │    │ 生成 manifest        │
│ selected_skills  │    │ 平台读取 manifest    │
│ 动态注入内容     │    │ 激活对应 skill       │
└──────────────────┘    └──────────────────────┘
```

---

## 3. 配置文件设计

### 3.1 skill-profiles.json 结构

**文件位置**：`.spec-first/config/skill-profiles.json`

```json
{
  "profiles": {
    "backend-default-implement": {
      "skills": ["before-dev", "backend-patterns"],
      "description": "Backend 标准开发"
    },
    "backend-debug-implement": {
      "skills": ["before-dev", "systematic-debugging"],
      "description": "Backend 调试模式"
    },
    "frontend-default-implement": {
      "skills": ["before-dev", "frontend-patterns"],
      "description": "Frontend 标准开发"
    },
    "docs-default-implement": {
      "skills": ["docs-guidelines"],
      "description": "文档编写"
    },
    "*-*-check": {
      "skills": ["check", "finish-work"],
      "description": "通用检查动作"
    },
    "*-*-finish": {
      "skills": ["finish-work"],
      "description": "通用完成动作"
    }
  },
  "defaults": {
    "implement": ["before-dev"],
    "check": ["check"],
    "finish": ["finish-work"],
    "create-pr": ["create-pr"]
  }
}
```

### 3.2 Profile 命名规则

**格式**：`{dev_type}-{task_mode}-{action}`

**通配符支持**：
- `*` 匹配任意值
- 例如：`*-*-check` 匹配所有 check 动作

**匹配优先级**：
1. 精确匹配：`backend-debug-implement`
2. 部分通配：`backend-*-implement`
3. 全通配：`*-*-implement`
4. 默认值：`defaults.implement`

---

## 4. task.json 字段设计

### 4.1 新增字段

```json
{
  "dev_type": "backend",
  "task_mode": "debug",
  "selected_skills": {
    "implement": ["before-dev", "systematic-debugging"],
    "check": ["check", "finish-work"],
    "finish": ["finish-work"],
    "create-pr": ["create-pr"]
  }
}
```

### 4.2 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `dev_type` | string | 已有字段，开发类型 |
| `task_mode` | string | 新增字段，任务模式（default/debug/tdd） |
| `selected_skills` | object | 新增字段，每个 action 对应的 skill 列表 |

### 4.3 task_mode 枚举值

| 值 | 说明 | 适用场景 |
|---|------|---------|
| `default` | 标准模式 | 常规开发任务 |
| `debug` | 调试模式 | Bug 修复、性能优化 |
| `tdd` | 测试驱动 | 需要先写测试的任务 |
| `docs` | 文档模式 | 纯文档编写 |

---

## 5. 核心实现

### 5.1 Skill Resolver 逻辑

**文件位置**：`.spec-first/scripts/common/skill_resolver.py`

```python
from pathlib import Path
from .io import read_json

def resolve_skills(
    dev_type: str | None,
    task_mode: str,
    action: str,
    config_path: Path
) -> list[str]:
    """根据任务属性解析 skill 列表"""
    profiles = read_json(config_path)

    # 构建查找键（优先级从高到低）
    keys = [
        f"{dev_type}-{task_mode}-{action}",  # 精确匹配
        f"{dev_type}-*-{action}",            # dev_type 匹配
        f"*-{task_mode}-{action}",           # task_mode 匹配
        f"*-*-{action}",                     # action 匹配
    ]

    # 查找匹配的 profile
    for key in keys:
        if key in profiles.get("profiles", {}):
            return profiles["profiles"][key]["skills"]

    # 回退到默认值
    defaults = profiles.get("defaults", {})
    return defaults.get(action, [])
```

**代码量**：~50 行

### 5.2 Task Create 集成

**修改文件**：`.spec-first/scripts/common/task_store.py`

```python
from .skill_resolver import resolve_skills

def cmd_create(args: argparse.Namespace) -> int:
    """Create a new task."""
    # ... 现有逻辑 ...

    # 新增：解析 task_mode
    task_mode = getattr(args, "task_mode", "default")

    # 新增：解析所有 action 的 skills
    workflow = get_workflow(workflow_type)
    selected_skills = {}

    config_path = repo_root / ".spec-first/config/skill-profiles.json"
    for step in workflow["steps"]:
        action = step["action"]
        skills = resolve_skills(dev_type, task_mode, action, config_path)
        selected_skills[action] = skills

    task_data = {
        # ... 现有字段 ...
        "task_mode": task_mode,
        "selected_skills": selected_skills,
    }

    write_json(task_json_path, task_data)
    # ...
```

**改动量**：~20 行

### 5.3 CLI 参数扩展

**修改文件**：`.spec-first/scripts/task.py`

```python
# 在 create 子命令中添加 --task-mode 参数
parser_create.add_argument(
    "--task-mode",
    choices=["default", "debug", "tdd", "docs"],
    default="default",
    help="Task execution mode"
)
```

**改动量**：~10 行

---

## 6. 平台适配

### 6.1 动态平台（Claude/iFlow）

**修改文件**：`.claude/hooks/inject-subagent-context.py`

```python
def inject_skills(task_data: dict, current_action: str) -> str:
    """注入当前 action 对应的 skills"""
    selected_skills = task_data.get("selected_skills", {})
    skills = selected_skills.get(current_action, [])

    content = []
    for skill_id in skills:
        skill_path = SKILLS_DIR / f"{skill_id}.md"
        if skill_path.exists():
            content.append(skill_path.read_text())

    return "\n\n".join(content)
```

**改动量**：~30 行

### 6.2 静态平台（Codex/Kiro）

**新增文件**：`.spec-first/scripts/common/platform_manifest.py`

```python
def generate_manifest(task_data: dict, output_path: Path):
    """生成平台 manifest 文件"""
    selected_skills = task_data.get("selected_skills", {})
    current_action = get_current_action(task_data)

    manifest = {
        "active_skills": selected_skills.get(current_action, []),
        "all_skills": selected_skills,
        "current_action": current_action
    }

    write_json(output_path, manifest)
```

**改动量**：~30 行

**使用方式**：
- Codex/Kiro 在任务启动时读取 `.spec-first/tasks/{task}/.active-skills.json`
- 根据 `active_skills` 列表激活对应的 skill

---

## 7. 完整示例

### 7.1 创建任务

```bash
# 创建 backend debug 任务
$ spec-first task create "Fix login timeout" \
  --dev-type backend \
  --task-mode debug

✓ Task created: 03-27-fix-login-timeout
✓ Selected skills:
  - implement: before-dev, systematic-debugging
  - check: check, finish-work
  - finish: finish-work
  - create-pr: create-pr
```

### 7.2 task.json 结果

```json
{
  "id": "fix-login-timeout",
  "title": "Fix login timeout",
  "dev_type": "backend",
  "task_mode": "debug",
  "workflow_type": "default",
  "selected_skills": {
    "implement": ["before-dev", "systematic-debugging"],
    "check": ["check", "finish-work"],
    "finish": ["finish-work"],
    "create-pr": ["create-pr"]
  }
}
```

### 7.3 平台消费

**Claude/iFlow**：
```python
# Hook 自动注入
current_action = "implement"
skills = ["before-dev", "systematic-debugging"]
# 读取并注入 skill 内容到 prompt
```

**Codex/Kiro**：
```json
// .active-skills.json
{
  "active_skills": ["before-dev", "systematic-debugging"],
  "current_action": "implement"
}
```

---

## 8. 扩展性设计

### 8.1 自定义 Profile

用户可以在项目中覆盖默认配置：

**文件位置**：`.spec-first/config/skill-profiles.local.json`

```json
{
  "profiles": {
    "backend-performance-implement": {
      "skills": ["before-dev", "performance-profiling"],
      "description": "性能优化专用"
    }
  }
}
```

**加载优先级**：
1. `skill-profiles.local.json`（用户自定义）
2. `skill-profiles.json`（默认配置）

### 8.2 Task 级别覆写

用户可以在创建任务后手动修改 `selected_skills`：

```bash
# 手动编辑 task.json
$ vim .spec-first/tasks/03-27-fix-login-timeout/task.json

# 或使用命令
$ spec-first task update-skills 03-27-fix-login-timeout \
  --action implement \
  --skills "before-dev,custom-skill"
```

### 8.3 动态调整

当 action 切换时，自动更新激活的 skills：

```python
def advance_action(task_data: dict):
    """推进到下一个 action"""
    current_phase = task_data["current_phase"]
    task_data["current_phase"] = current_phase + 1

    # 自动更新平台 manifest（静态平台）
    if is_static_platform():
        generate_manifest(task_data, manifest_path)
```

---

## 9. 对比分析

### 9.1 vs v8 完整方案

| 维度 | v8 完整方案 | Skill Profile 方案 |
|------|------------|-------------------|
| 核心逻辑 | selector + capability registry | 查表映射 |
| 代码量 | ~3300 行 | ~200 行 |
| 新增文件 | 14+ 个 | 3 个 |
| 配置复杂度 | 高（多层嵌套） | 低（扁平映射） |
| 学习成本 | 高 | 低 |
| 扩展性 | 高（但用不上） | 够用 |
| 维护成本 | 高 | 低 |

### 9.2 vs 当前方案

| 维度 | 当前方案 | Skill Profile 方案 |
|------|---------|-------------------|
| Skill 选择 | 手动 | 自动 |
| 配置方式 | 无 | 配置文件 |
| 平台统一 | 否 | 是 |
| 代码改动 | 0 | ~200 行 |

---

## 10. 实施计划

### 10.1 Phase 1: 核心逻辑（2 天）

**任务**：
- [ ] 创建 `skill-profiles.json` 配置文件
- [ ] 实现 `skill_resolver.py`
- [ ] 修改 `task_store.py` 集成 resolver
- [ ] 添加 `--task-mode` CLI 参数

**验收**：
- 创建任务时自动生成 `selected_skills`
- 不同 dev_type/task_mode 生成不同 skills

### 10.2 Phase 2: 动态平台适配（1 天）

**任务**：
- [ ] 修改 Claude hook 读取 `selected_skills`
- [ ] 修改 iFlow hook 读取 `selected_skills`
- [ ] 测试动态注入功能

**验收**：
- Claude/iFlow 能正确注入对应 skills
- 不同 action 注入不同内容

### 10.3 Phase 3: 静态平台适配（1 天）

**任务**：
- [ ] 实现 `platform_manifest.py`
- [ ] 修改 Codex 配置读取 manifest
- [ ] 修改 Kiro 配置读取 manifest

**验收**：
- 生成 `.active-skills.json` 文件
- Codex/Kiro 能正确激活 skills

### 10.4 Phase 4: 测试和文档（1 天）

**任务**：
- [ ] 单元测试（resolver 逻辑）
- [ ] 集成测试（端到端流程）
- [ ] 更新用户文档

**总工期**：5 天

---

## 11. 风险评估

### 11.1 技术风险

| 风险 | 等级 | 缓解措施 |
|------|------|---------|
| Profile 配置错误 | 低 | 提供 validate 命令 |
| 平台适配失败 | 低 | 保留原有逻辑作为回退 |
| Skill 文件缺失 | 中 | 优雅降级，跳过缺失 skill |

### 11.2 业务风险

| 风险 | 等级 | 缓解措施 |
|------|------|---------|
| 用户不理解 task_mode | 低 | 提供默认值和文档 |
| 自动选择不符合预期 | 中 | 支持手动覆写 |

---

## 12. 总结

### 12.1 核心优势

1. **极简** - 只需 200 行代码，3 个文件
2. **直观** - 查表逻辑，一目了然
3. **灵活** - 支持通配符、优先级、覆写
4. **统一** - 所有平台用同一套配置
5. **实用** - 完全满足用户需求

### 12.2 与 v8-lite 的关系

**Skill Profile 方案是 v8-lite 的增强模块**：

- v8-lite 提供：Preset、explain、evidence、门禁
- Skill Profile 提供：自动 skill 选择

两者可以独立实施，也可以组合使用。

### 12.3 一句话总结

**用最简单的查表逻辑，实现智能 skill 选择，完美适配当前系统。**

---

**文档版本**: 1.0
**最后更新**: 2026-03-27
**维护者**: spec-first 团队
