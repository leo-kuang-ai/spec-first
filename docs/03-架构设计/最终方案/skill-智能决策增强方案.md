# Skill 智能决策增强方案

> **版本**: 1.1
> **日期**: 2026-03-27
> **基于**: v8-lite 完整方案
> **目标**: 支持多 skill 场景的智能决策

---

## 1. 问题定义

### 1.1 用户场景

**问题**：当我有很多 skill 时，系统能否自动决策该用哪个？

**具体场景**：
- 场景 1：有 20+ 个 backend skills，如何选择最合适的？
- 场景 2：任务涉及多个领域（API + DB + Cache），如何组合 skills？
- 场景 3：根据代码复杂度，动态添加额外的 skills

### 1.2 当前方案的局限

v8-lite 基础方案：
- ✅ 支持基于 dev_type + task_mode + action 的查表
- ❌ 只返回一个 profile，无法组合
- ❌ 无法根据上下文动态调整
- ❌ 无法处理 skill 依赖和冲突

---

## 2. 增强方案设计

### 2.1 核心思想

**分层选择 + 规则增强 + 用户覆写**

```text
┌─────────────────────────────────────────────┐
│ Layer 3: 用户覆写（最高优先级）             │
│ - task.json.selected_skills (手动指定)      │
└─────────────────────┬───────────────────────┘
                      │ 覆盖
┌─────────────────────▼───────────────────────┐
│ Layer 2: 增强 Skills（动态添加）            │
│ - 根据任务上下文规则                        │
│ - 例如：文件数、复杂度、依赖项              │
└─────────────────────┬───────────────────────┘
                      │ 叠加
┌─────────────────────▼───────────────────────┐
│ Layer 1: 基础 Skills（必选）                │
│ - 根据 dev_type + task_mode + action 查表   │
└─────────────────────────────────────────────┘
```

### 2.2 增强配置文件

**文件位置**：`.spec-first/config/skill-profiles.json`

```json
{
  "profiles": {
    "backend-default-implement": {
      "base_skills": ["before-dev", "backend-patterns"],
      "description": "Backend 标准开发"
    },
    "backend-debug-implement": {
      "base_skills": ["before-dev", "systematic-debugging"],
      "description": "Backend 调试模式"
    }
  },

  "enhancement_rules": [
    {
      "id": "large-codebase",
      "condition": {
        "file_count": {"min": 10}
      },
      "add_skills": ["code-organization", "refactoring-patterns"],
      "description": "大型代码库增强"
    },
    {
      "id": "database-involved",
      "condition": {
        "keywords": ["database", "migration", "schema"]
      },
      "add_skills": ["database-best-practices"],
      "description": "涉及数据库操作"
    },
    {
      "id": "api-design",
      "condition": {
        "keywords": ["api", "endpoint", "rest"]
      },
      "add_skills": ["api-design-patterns"],
      "description": "API 设计相关"
    }
  ],

  "skill_dependencies": {
    "tdd-patterns": {
      "requires": ["before-dev"],
      "conflicts_with": []
    },
    "performance-profiling": {
      "requires": ["systematic-debugging"],
      "conflicts_with": []
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

---


## 3. 核心实现

### 3.1 增强版 Skill Resolver

```python
def resolve_skills_enhanced(
    dev_type: str | None,
    task_mode: str,
    action: str,
    task_context: dict,
    config_path: Path
) -> list[str]:
    """增强版 skill 解析，支持多层选择"""
    config = read_json(config_path)
    
    # Layer 1: 基础 skills（查表）
    base_skills = _resolve_base_skills(dev_type, task_mode, action, config)
    
    # Layer 2: 增强 skills（规则匹配）
    enhancement_skills = _resolve_enhancement_skills(task_context, config)
    
    # Layer 3: 用户覆写（如果存在）
    user_skills = task_context.get("user_override_skills")
    if user_skills:
        return user_skills
    
    # 合并并去重
    all_skills = base_skills + enhancement_skills
    return list(dict.fromkeys(all_skills))  # 保持顺序去重


def _resolve_base_skills(dev_type, task_mode, action, config) -> list[str]:
    """Layer 1: 基础 skills"""
    keys = [
        f"{dev_type or '*'}-{task_mode}-{action}",
        f"{dev_type or '*'}-*-{action}",
        f"*-{task_mode}-{action}",
        f"*-*-{action}",
    ]
    
    for key in keys:
        profile = config.get("profiles", {}).get(key)
        if profile:
            return profile.get("base_skills", [])
    
    return config.get("defaults", {}).get(action, [])


def _resolve_enhancement_skills(task_context: dict, config: dict) -> list[str]:
    """Layer 2: 增强 skills（根据规则）"""
    enhancement_skills = []
    rules = config.get("enhancement_rules", [])
    
    for rule in rules:
        if _match_rule(rule["condition"], task_context):
            enhancement_skills.extend(rule["add_skills"])
    
    return enhancement_skills


def _match_rule(condition: dict, context: dict) -> bool:
    """匹配规则条件"""
    # 文件数量条件
    if "file_count" in condition:
        file_count = context.get("file_count", 0)
        min_count = condition["file_count"].get("min", 0)
        if file_count < min_count:
            return False
    
    # 关键词条件
    if "keywords" in condition:
        title = context.get("title", "").lower()
        description = context.get("description", "").lower()
        text = f"{title} {description}"
        
        keywords = condition["keywords"]
        if not any(kw in text for kw in keywords):
            return False
    
    return True
```

**代码量**：~100 行

---


## 4. 使用示例

### 4.1 场景 1: 基础场景

```bash
# 创建简单的 backend 任务
$ spec-first task create "Add user API" \
  --dev-type backend \
  --task-mode default

# 自动选择
✓ Base skills: before-dev, backend-patterns
✓ Enhancement: (none)
✓ Final: before-dev, backend-patterns
```

### 4.2 场景 2: 大型代码库

```bash
# 创建涉及 15 个文件的重构任务
$ spec-first task create "Refactor auth module" \
  --dev-type backend \
  --task-mode default

# 任务上下文
{
  "title": "Refactor auth module",
  "file_count": 15
}

# 自动选择
✓ Base skills: before-dev, backend-patterns
✓ Enhancement: code-organization, refactoring-patterns (matched: large-codebase)
✓ Final: before-dev, backend-patterns, code-organization, refactoring-patterns
```

### 4.3 场景 3: 多领域任务

```bash
# 创建涉及 API + Database 的任务
$ spec-first task create "Add user API with database migration" \
  --dev-type backend \
  --task-mode default

# 任务上下文
{
  "title": "Add user API with database migration",
  "description": "Create REST API endpoint and schema migration"
}

# 自动选择
✓ Base skills: before-dev, backend-patterns
✓ Enhancement: api-design-patterns (matched: api-design)
✓ Enhancement: database-best-practices (matched: database-involved)
✓ Final: before-dev, backend-patterns, api-design-patterns, database-best-practices
```

---


## 5. 对比分析

### 5.1 vs 基础方案

| 维度 | 基础方案 | 增强方案 |
|------|---------|---------|
| Skill 数量 | 固定（1 个 profile） | 动态（base + enhancement） |
| 上下文感知 | 无 | 有（文件数、关键词） |
| 用户覆写 | 手动编辑 task.json | 支持 |
| 代码量 | ~50 行 | ~150 行 |

### 5.2 复杂度增加

- **配置文件**: +1 个 section（enhancement_rules）
- **代码量**: +100 行
- **学习成本**: 中等（需要理解规则匹配）

---

## 6. 实施建议

### 6.1 渐进式实施

**Phase 1: 基础方案**（推荐先实施）
- 只实现 Layer 1（查表逻辑）
- 代码量：~50 行
- 满足 80% 场景

**Phase 2: 增强方案**（可选）
- 添加 Layer 2（规则增强）
- 代码量：+100 行
- 满足复杂场景

### 6.2 何时需要增强方案

**需要增强**：
- ✅ 项目有 20+ 个 skills
- ✅ 任务类型复杂多样
- ✅ 需要根据上下文动态调整

**不需要增强**：
- ❌ 项目只有 5-10 个 skills
- ❌ 任务类型单一
- ❌ 固定配置已够用

---


## 7. 总结

### 7.1 回答你的问题

**问题**：当我有很多 skill 时，系统能否自动决策该用哪个？

**答案**：✅ 可以，通过分层选择机制

1. **Layer 1（基础）** - 根据任务类型查表
2. **Layer 2（增强）** - 根据上下文规则动态添加
3. **Layer 3（覆写）** - 用户手动指定

### 7.2 核心优势

1. ✅ **智能组合** - 自动组合多个 skills
2. ✅ **上下文感知** - 根据文件数、关键词动态调整
3. ✅ **保持简单** - 只增加 100 行代码
4. ✅ **渐进实施** - 可以先用基础方案

### 7.3 推荐策略

**小型项目（< 10 skills）**：
- 使用基础方案即可
- 代码量：~50 行

**中大型项目（20+ skills）**：
- 使用增强方案
- 代码量：~150 行

---

**文档版本**: 1.1  
**最后更新**: 2026-03-27  
**维护者**: spec-first 团队

