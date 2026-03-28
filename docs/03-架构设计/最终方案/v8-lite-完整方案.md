# Spec-First v8-lite 完整方案

> **版本**: 1.0
> **日期**: 2026-03-27
> **状态**: 推荐实施方案
> **定位**: 轻量增强 + 智能 Skill 选择

---

## 1. 方案定位

### 1.1 核心目标

**用最小改动，实现最大价值**

1. ✅ 提升任务创建体验（Preset 快捷命令）
2. ✅ 提升可观测性（explain 命令）
3. ✅ 提升质量追溯（evidence 记录）
4. ✅ 智能 Skill 选择（自动匹配场景）
5. ✅ 轻量质量门禁（关键节点把控）

### 1.2 与 v8 完整方案对比

| 维度 | v8 完整方案 | v8-lite 完整方案 | 改进 |
|------|------------|-----------------|------|
| 新增代码 | ~3300 行 | ~650 行 | **减少 80%** |
| 新增文件 | 14+ 个 | 4 个 | **减少 71%** |
| 工期 | 15+ 天 | 7 天 | **减少 53%** |
| 破坏性变更 | 高 | 低 | **向后兼容** |
| 学习成本 | 高 | 低 | **易理解** |

### 1.3 方案组成

```text
v8-lite 完整方案
├── 模块 1: 任务创建增强（Preset）
├── 模块 2: 可观测性增强（explain）
├── 模块 3: 质量追溯（evidence）
├── 模块 4: 智能 Skill 选择（核心）
└── 模块 5: 轻量质量门禁
```

---

## 2. 核心设计原则

### 2.1 直接存储，不推导

❌ **v8 方式**：workflow → action → selector → capability（4 层推导）

✅ **v8-lite 方式**：直接存储 `current_action` 和 `selected_skills`

### 2.2 重命名，不重构

❌ **v8 方式**：删除 `decision_hints`，新增 `action_config`

✅ **v8-lite 方式**：`decision_hints` 重命名为 `action_config`，保持兼容

### 2.3 查表，不推理

❌ **v8 方式**：复杂的 selector rules + capability registry

✅ **v8-lite 方式**：简单的 skill-profiles.json 查表

---

## 3. task.json 结构设计

### 3.1 新结构

```json
{
  "id": "fix-login-bug",
  "title": "Fix login bug",
  "status": "planning",
  "dev_type": "backend",
  "task_mode": "debug",
  "package": "api",
  "priority": "P1",

  "workflow_type": "default",
  "current_phase": 0,
  "next_action": [
    {"action": "implement"},
    {"action": "check"},
    {"action": "finish"},
    {"action": "create-pr"}
  ],

  "action_config": {
    "check": {
      "verify_commands": ["pnpm lint", "pnpm typecheck"]
    }
  },

  "selected_skills": {
    "implement": ["before-dev", "systematic-debugging"],
    "check": ["check", "finish-work"],
    "finish": ["finish-work"],
    "create-pr": ["create-pr"]
  },

  "evidence": {
    "verify_result": {
      "commands": ["pnpm lint", "pnpm typecheck"],
      "status": "passed",
      "timestamp": "2026-03-27T12:00:00Z"
    },
    "finish_note": "",
    "release_note": ""
  },

  "creator": "kuang",
  "assignee": "kuang",
  "createdAt": "2026-03-27",
  "branch": null,
  "commit": null,
  "pr_url": null,
  "meta": {}
}
```

### 3.2 字段变更说明

| 操作 | 字段 | 说明 |
|------|------|------|
| **重命名** | `decision_hints` → `action_config` | 语义更清晰 |
| **新增** | `task_mode` | 任务模式（default/debug/tdd/docs） |
| **新增** | `selected_skills` | 每个 action 对应的 skill 列表 |
| **新增** | `evidence` | 执行证据记录 |
| **保留** | `current_phase` | 兼容现有逻辑 |
| **保留** | `next_action` | 兼容现有逻辑 |
| **保留** | `workflow_type` | 已有字段 |

### 3.3 向后兼容策略

```python
# 兼容读取
def get_action_config(task_data: dict) -> dict:
    """优先读取 action_config，回退到 decision_hints"""
    return task_data.get("action_config") or task_data.get("decision_hints", {})

# 兼容写入（过渡期）
def write_task_data(task_data: dict):
    """同时写入新旧字段"""
    if "action_config" in task_data:
        task_data["decision_hints"] = task_data["action_config"]
```

---

## 4. 模块 1: Preset 快捷命令

### 4.1 功能说明

简化任务创建，用预设配置快速开始。

### 4.2 配置文件

**文件位置**：`.spec-first/config/presets.json`

```json
{
  "presets": {
    "quick-fix": {
      "workflow_type": "quick-fix",
      "task_mode": "default",
      "description": "快速修复、typo、文案修改"
    },
    "feature-dev": {
      "workflow_type": "default",
      "task_mode": "default",
      "description": "标准功能开发"
    },
    "bug-debug": {
      "workflow_type": "default",
      "task_mode": "debug",
      "description": "复杂 bug 调试"
    },
    "docs-update": {
      "workflow_type": "docs-only",
      "task_mode": "docs",
      "description": "文档更新"
    }
  }
}
```

### 4.3 使用方式

```bash
# 使用 preset 创建任务
$ spec-first task create "Fix login bug" --preset bug-debug

# 等价于
$ spec-first task create "Fix login bug" \
  --workflow default \
  --task-mode debug
```

### 4.4 实现要点

```python
def resolve_preset(preset_name: str) -> dict:
    """解析 preset 到标准参数"""
    presets = load_json(".spec-first/config/presets.json")
    preset = presets.get("presets", {}).get(preset_name)

    if not preset:
        raise ValueError(f"Unknown preset: {preset_name}")

    return {
        "workflow_type": preset.get("workflow_type", "default"),
        "task_mode": preset.get("task_mode", "default")
    }
```

**代码量**：~150 行

---

## 5. 模块 2: explain 命令

### 5.1 功能说明

显示当前任务的执行状态和配置来源，提升可观测性。

### 5.2 命令输出

```bash
$ spec-first task explain

Current Task: fix-login-bug
Status: in_progress
Workflow: default

Current Action: implement
Next Actions:
  1. check
  2. finish
  3. create-pr

Selected Skills (implement):
  - before-dev
  - systematic-debugging

Action Config:
  check.verify_commands:
    - pnpm lint
    - pnpm typecheck
  Source: workflow default profile

Evidence:
  verify_result: not_run
  finish_note: empty
  release_note: empty

To customize:
  $ spec-first task update --workflow <type>
  $ spec-first task update --task-mode <mode>
```

### 5.3 实现要点

```python
def cmd_explain(args: argparse.Namespace) -> int:
    """显示当前任务状态"""
    task_data = load_current_task()

    print(f"Current Task: {task_data['id']}")
    print(f"Status: {task_data['status']}")
    print(f"Workflow: {task_data['workflow_type']}")
    print()

    # 显示当前 action
    current_phase = task_data['current_phase']
    next_action = task_data['next_action']
    if current_phase < len(next_action):
        current = next_action[current_phase]
        print(f"Current Action: {current['action']}")

    # 显示 selected skills
    selected_skills = task_data.get('selected_skills', {})
    current_action = next_action[current_phase]['action']
    skills = selected_skills.get(current_action, [])
    print(f"\nSelected Skills ({current_action}):")
    for skill in skills:
        print(f"  - {skill}")

    # 显示 action config
    action_config = get_action_config(task_data)
    print("\nAction Config:")
    for action, config in action_config.items():
        for key, value in config.items():
            print(f"  {action}.{key}: {value}")

    return 0
```

**代码量**：~100 行

---

## 6. 模块 3: evidence 记录

### 6.1 功能说明

记录关键动作的执行证据，提升质量追溯能力。

### 6.2 evidence 结构

```json
{
  "evidence": {
    "verify_result": {
      "commands": ["pnpm lint", "pnpm typecheck"],
      "status": "passed",
      "timestamp": "2026-03-27T12:00:00Z",
      "output": ""
    },
    "finish_note": "Implemented login bug fix, all tests pass",
    "release_note": "Fix: resolve login timeout issue"
  }
}
```

### 6.3 写入时机

| Action | 写入字段 | 时机 |
|--------|---------|------|
| `check` | `verify_result` | check 完成后 |
| `finish` | `finish_note` | finish 完成后 |
| `create-pr` | `release_note` | create-pr 完成后 |

### 6.4 实现要点

```python
def record_verify_result(task_json_path: Path, result: dict):
    """记录 check 结果"""
    data = read_json(task_json_path)
    if not data.get("evidence"):
        data["evidence"] = {}

    data["evidence"]["verify_result"] = {
        "commands": result["commands"],
        "status": result["status"],
        "timestamp": datetime.now().isoformat(),
        "output": result.get("output", "")
    }

    write_json(task_json_path, data)
```

**代码量**：~50 行

---

## 7. 模块 4: 智能 Skill 选择（核心）

### 7.1 功能说明

根据任务类型（dev_type + task_mode + action）自动选择最适合的 skill。

### 7.2 配置文件

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
    "frontend-debug-implement": {
      "skills": ["before-dev", "systematic-debugging"],
      "description": "Frontend 调试模式"
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
    },
    "*-*-create-pr": {
      "skills": ["create-pr"],
      "description": "通用 PR 创建"
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

### 7.3 Profile 命名规则

**格式**：`{dev_type}-{task_mode}-{action}`

**通配符支持**：
- `*` 匹配任意值
- 例如：`*-*-check` 匹配所有 check 动作

**匹配优先级**：
1. 精确匹配：`backend-debug-implement`
2. 部分通配：`backend-*-implement` 或 `*-debug-implement`
3. 全通配：`*-*-implement`
4. 默认值：`defaults.implement`

### 7.4 核心实现

```python
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

---


## 8. 模块 5: 轻量质量门禁

### 8.1 功能说明

在关键动作节点设置最小质量检查，防止低质量代码流入下游。

### 8.2 门禁规则

| Action | 门禁条件 | 实现方式 |
|--------|---------|---------|
| `implement` | 无 | 直接执行 |
| `check` | verify_commands 不为空 | hook 检查 |
| `finish` | check 已通过 | hook 检查 evidence |
| `create-pr` | finish_note 不为空 | hook 检查 evidence |

### 8.3 实现要点

```python
# .claude/hooks/before-check.py
def check_gate(task_data: dict) -> bool:
    """check 动作门禁"""
    action_config = get_action_config(task_data)
    verify_commands = action_config.get("check", {}).get("verify_commands", [])

    if not verify_commands:
        print("Error: check.verify_commands is empty")
        return False
    return True
```

**代码量**：~100 行

---

## 9. 平台适配

### 9.1 动态平台（Claude/iFlow）

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

### 9.2 静态平台（Codex/Kiro）

```python
def generate_manifest(task_data: dict, output_path: Path):
    """生成平台 manifest 文件"""
    selected_skills = task_data.get("selected_skills", {})
    current_action = get_current_action(task_data)

    manifest = {
        "active_skills": selected_skills.get(current_action, []),
        "current_action": current_action
    }
    write_json(output_path, manifest)
```

**改动量**：~30 行

---

## 10. 完整示例

### 10.1 创建任务

```bash
$ spec-first task create "Fix login timeout" --preset bug-debug

✓ Task created: 03-27-fix-login-timeout
✓ Selected skills:
  - implement: before-dev, systematic-debugging
  - check: check, finish-work
```

### 10.2 查看状态

```bash
$ spec-first task explain

Current Task: fix-login-timeout
Current Action: implement
Selected Skills: before-dev, systematic-debugging
```

---


## 11. 实施计划

### 11.1 Phase 1: 核心基础（2 天）

**任务**：
- [ ] 创建 `presets.json` 和 `skill-profiles.json`
- [ ] 实现 `skill_resolver.py`
- [ ] 修改 `task_store.py` 集成 resolver
- [ ] 添加 `task_mode` 字段和 CLI 参数

**验收**：
- 创建任务时自动生成 `selected_skills`
- Preset 命令可用

### 11.2 Phase 2: 可观测性（1 天）

**任务**：
- [ ] 实现 `explain` 命令
- [ ] 实现 `evidence` 记录逻辑

**验收**：
- explain 命令正确显示任务状态
- evidence 字段正确写入

### 11.3 Phase 3: 平台适配（2 天）

**任务**：
- [ ] 修改 Claude/iFlow hook
- [ ] 实现 Codex/Kiro manifest 生成

**验收**：
- 所有平台能正确消费 selected_skills

### 11.4 Phase 4: 质量门禁（1 天）

**任务**：
- [ ] 实现 check/finish/create-pr 门禁

**验收**：
- 门禁规则生效

### 11.5 Phase 5: 测试和文档（1 天）

**任务**：
- [ ] 单元测试
- [ ] 集成测试
- [ ] 用户文档

**总工期**：7 天

---


## 12. 代码改动清单

### 12.1 新增文件

| 文件 | 说明 | 代码量 |
|------|------|--------|
| `.spec-first/config/presets.json` | Preset 配置 | 配置文件 |
| `.spec-first/config/skill-profiles.json` | Skill 映射配置 | 配置文件 |
| `.spec-first/scripts/common/skill_resolver.py` | Skill 解析逻辑 | ~50 行 |
| `.spec-first/scripts/common/platform_manifest.py` | Manifest 生成 | ~30 行 |

### 12.2 修改文件

| 文件 | 改动内容 | 代码量 |
|------|---------|--------|
| `.spec-first/scripts/common/task_store.py` | 集成 skill resolver | ~30 行 |
| `.spec-first/scripts/task.py` | 添加 explain 命令 | ~100 行 |
| `.claude/hooks/inject-subagent-context.py` | 读取 selected_skills | ~30 行 |
| `.claude/hooks/before-check.py` | 添加门禁检查 | ~50 行 |
| `.claude/hooks/before-finish.py` | 添加门禁检查 | ~50 行 |

**总计**：~650 行代码，4 个新文件

---

## 13. 对比总结

### 13.1 功能对比

| 功能 | v8 完整 | v8-lite 完整 | 当前 |
|------|---------|-------------|------|
| Preset 快捷命令 | ✅ | ✅ | ❌ |
| explain 命令 | ✅ | ✅ | ❌ |
| 智能 Skill 选择 | ✅ 复杂 | ✅ 简单 | ❌ |
| 质量门禁 | ✅ 复杂 | ✅ 简单 | ❌ |
| 证据记录 | ✅ | ✅ | ❌ |
| 向后兼容 | ❌ | ✅ | ✅ |

### 13.2 复杂度对比

| 维度 | v8 完整 | v8-lite 完整 | 改进 |
|------|---------|-------------|------|
| 新增代码 | ~3300 行 | ~650 行 | **减少 80%** |
| 新增文件 | 14+ 个 | 4 个 | **减少 71%** |
| 新增概念 | 4 层抽象 | 0 层 | **无新抽象** |
| 工期 | 15+ 天 | 7 天 | **减少 53%** |
| 学习成本 | 高 | 低 | **易理解** |

---


## 14. 核心优势

### 14.1 极简实现

- **查表逻辑** - 无复杂推导，直接映射
- **配置驱动** - 所有规则在配置文件中
- **向后兼容** - 同时支持新旧字段

### 14.2 实用价值

- **Preset** - 零配置快速创建任务
- **Skill 选择** - 自动匹配最佳 skill
- **explain** - 随时了解任务状态
- **evidence** - 质量可追溯
- **门禁** - 关键节点把控

### 14.3 易维护

- **无新抽象** - 不引入复杂概念
- **代码少** - 只有 650 行
- **文件少** - 只有 4 个新文件
- **易理解** - 逻辑直接清晰

---

## 15. 风险评估

### 15.1 技术风险

| 风险 | 等级 | 缓解措施 |
|------|------|---------|
| 向后兼容问题 | 低 | 同时支持新旧字段 |
| Profile 配置错误 | 低 | 提供 validate 命令 |
| 平台适配失败 | 低 | 保留原有逻辑 |

### 15.2 业务风险

| 风险 | 等级 | 缓解措施 |
|------|------|---------|
| 用户学习成本 | 低 | 功能可选，渐进推广 |
| 自动选择不符预期 | 中 | 支持手动覆写 |

---

## 16. 总结

### 16.1 一句话总结

**用 20% 的代码，实现 80% 的价值，完美适配当前系统。**

### 16.2 推荐理由

1. ✅ **改动最小** - 只需 650 行代码
2. ✅ **收益最大** - 5 大核心功能
3. ✅ **风险最低** - 向后兼容
4. ✅ **工期最短** - 7 天完成
5. ✅ **易维护** - 无复杂抽象

### 16.3 与其他方案对比

- **vs v8 完整方案**：用 20% 的代码实现核心功能
- **vs 当前方案**：最小改动，最大提升
- **vs 独立方案**：统一整合，协同增效

---

**文档版本**: 1.0  
**最后更新**: 2026-03-27  
**维护者**: spec-first 团队

