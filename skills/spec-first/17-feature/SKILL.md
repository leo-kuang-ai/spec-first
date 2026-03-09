---
name: "spec-first:feature"
description: "Feature 查询/切换命令族"
version: 1.2.0
last_updated: {{DATE}}
---

# Skill: feature

Feature 管理命令族，支持列表查询、查看当前、切换 Feature。

## 触发条件

- Command: `/spec-first:feature <subcommand>`
- 子命令：`list` | `current` | `switch <featureId>`

## 用法

```
/spec-first:feature list
/spec-first:feature current
/spec-first:feature switch <featureId>
```

## 执行逻辑

从用户输入提取子命令，直接执行对应的 CLI 命令：

```bash
# 用户输入 → CLI 命令
list    → spec-first feature list
current → spec-first feature current
switch <id> → spec-first feature switch <id> --yes
```

**注意**：switch 自动添加 `--yes`，用户无需手动指定。

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
