---
name: "spec-first:feature"
description: "Feature 查询/切换命令族"
version: 1.0.0
last_updated: {{DATE}}
---

# Skill: feature

Feature 管理命令族，支持列表查询、查看当前、切换 Feature。

## 触发条件
- Command: `/spec-first:feature <subcommand>`
- 子命令：`list` | `current` | `switch <featureId>`

## 执行流程

**直接调用 CLI**：
```bash
spec-first feature <subcommand> [args]
```

**无需**：
- 读取 Skill 文件
- 搜索项目路径
- 解析参数

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
