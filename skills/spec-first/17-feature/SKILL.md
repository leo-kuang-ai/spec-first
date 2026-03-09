---
name: "spec-first:feature"
description: "Feature 查询/切换命令族"
version: 1.3.0
last_updated: {{DATE}}
---

# Skill: feature

**直接执行 CLI，无需读完本文件**

```bash
# 从用户输入提取子命令并执行
list    → spec-first feature list
current → spec-first feature current
switch <id> → spec-first feature switch <id> --yes
```

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
