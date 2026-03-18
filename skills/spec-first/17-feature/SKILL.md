---
name: "spec-first:feature"
description: "Feature 查询/切换命令族"
argument-hint: "[subcommand] [featureId]"
version: "2.0.0"
last_updated: "2026-03-17"
---

# Skill: feature

- Command: `/spec-first:feature [list|current|switch] [featureId]`

$IF($1,
  $IF($1 == "list",
    !`spec-first feature list`,
    $IF($1 == "current",
      !`spec-first feature current`,
      $IF($1 == "switch",
        $IF($2,
          !`spec-first feature switch $2 --yes`,
          ERROR: switch 需要 featureId 参数。用法: /spec-first:feature switch [featureId]
        ),
        ERROR: 未知子命令 "$1"。可用: list, current, switch
      )
    )
  ),
  !`spec-first feature current && echo "" && spec-first feature list && echo "" && echo "可用命令：" && echo "  /spec-first:feature list      - 列出所有 Feature" && echo "  /spec-first:feature current   - 查看当前 Feature" && echo "  /spec-first:feature switch <id> - 切换 Feature"`
)

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
