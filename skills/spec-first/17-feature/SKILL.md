---
name: "spec-first:feature"
description: "Feature 查询/切换命令族"
version: 1.1.0
last_updated: {{DATE}}
---

# Skill: feature

Feature 管理命令族，支持列表查询、查看当前、切换 Feature。

## 快速执行（推荐）

这是一个简单的 CLI 透传命令，直接执行即可：

```bash
spec-first feature list                      # 列出所有 Feature
spec-first feature current                   # 查看当前 Feature
spec-first feature switch <featureId> --yes  # 切换 Feature
```

**提示**：无需读取本文件内容，上面的命令就是全部用法。

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
