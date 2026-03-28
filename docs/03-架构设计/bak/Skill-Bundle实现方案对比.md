# Skill Bundle 实现方案对比

> **版本**: 1.0
> **日期**: 2026-03-26
> **问题**: 如果不做 skill selector，如何实现 skill bundle？

---

## 方案对比

### 方案 A: 完整 Skill Selector（原方案）

```
execution_profile
   ↓
skill selector (自动选择)
   ↓
skill bundle
   ↓
inject to agent
```

**优点**:
- 自动化程度高
- 可扩展性强
- 规则可配置

**缺点**:
- 需要实现 selector 逻辑（3-4小时）
- 需要维护 skills-registry.json（2小时）
- 系统复杂度增加

**工作量**: 6-8小时

---

### 方案 B: 静态配置（简化方案）

```
execution_profile
   ↓
静态映射规则 (hardcode)
   ↓
skill bundle
   ↓
inject to agent
```

**实现**:
```python
# inject-subagent-context.py
SKILL_BUNDLE_MAP = {
    ("frontend", "typescript", "react"): [
        "/path/to/typescript-patterns.md",
        "/path/to/react-patterns.md"
    ],
    ("backend", "python", "django"): [
        "/path/to/python-patterns.md",
        "/path/to/django-patterns.md"
    ],
    ("backend", "python", None): [
        "/path/to/python-patterns.md"
    ]
}

def get_skill_bundle(profile: dict) -> list[str]:
    key = (
        profile.get("surface"),
        profile.get("language"),
        profile.get("framework")
    )
    return SKILL_BUNDLE_MAP.get(key, [])
```

**优点**:
- 实现简单（1-2小时）
- 无需额外文件
- 易于调试

**缺点**:
- 扩展需要修改代码
- 规则硬编码
- 不够灵活

**工作量**: 1-2小时

---

