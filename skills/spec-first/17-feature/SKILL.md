---
name: "spec-first:feature"
description: "Feature 查询/切换命令族"
version: 1.4.0
last_updated: {{DATE}}
---

# Skill: feature

**用户输入格式**：
- `/spec-first:feature list`
- `/spec-first:feature current`
- `/spec-first:feature switch <featureId>`

**执行逻辑**：
1. 检查用户输入中的子命令（list/current/switch）
2. 执行对应的 CLI 命令：
   - `list` → `spec-first feature list`
   - `current` → `spec-first feature current`
   - `switch <id>` → `spec-first feature switch <id> --yes`

**注意**：switch 自动添加 `--yes`

## 子命令

### list
列出所有 Feature 及其状态
```bash
spec-first feature list
```

### current
查看当前激活的 Feature 详情
```bash
spec-first feature current
```

### switch
切换到指定 Feature（需要 `--yes` 确认）
```bash
spec-first feature switch <featureId> --yes
```

## 成功标准
- CLI 命令成功执行（exit code = 0）
- 输出符合预期格式
