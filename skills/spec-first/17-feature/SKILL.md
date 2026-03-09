---
name: "spec-first:feature"
description: "Feature 查询/切换命令族"
version: 1.0.0
last_updated: {{DATE}}
---

# Skill: feature

Feature 管理命令族，支持列表查询、查看当前、切换 Feature。

## 强制约束（必读）

**禁止读取本文件** - 你已经在读这个文件了，不要再读一遍
**直接执行 CLI** - 立即执行 `spec-first feature <subcommand>`，无需任何准备

## 触发条件
- Command: `/spec-first:feature <subcommand>`
- 子命令：`list` | `current` | `switch <featureId>`

## 执行流程

**立即执行**：
```bash
spec-first feature list
spec-first feature current
spec-first feature switch <featureId> --yes
```

**禁止**：
- ❌ 读取 Skill 文件（你正在读的这个）
- ❌ 使用 `spec-first ai feature`（错误格式）
- ❌ 使用 `npm run cli`（不存在）

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
