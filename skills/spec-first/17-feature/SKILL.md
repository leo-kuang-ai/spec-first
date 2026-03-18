---
name: "spec-first:feature"
description: "Use when you need to list features, inspect the current feature pointer, or switch the active feature workspace for subsequent skills."
argument-hint: "[subcommand] [featureId]"
version: "2.0.0"
last_updated: "2026-03-17"
---

# Skill: feature

- Command: `/spec-first:feature [list|current|switch] [featureId]`

## 作用域与副作用

- `list/current` 为只读查询
- `switch` 会更新 `.spec-first/current`，这是当前需求目录的定位指针
- 任意依赖自动定位的 skill（如 catchup / sync / orchestrate / archive）都会消费该指针
- 因此 `switch` 不是纯展示命令，必须把切换结果、失败原因和恢复动作说清楚

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

## 失败标准

- 目标 Feature 不存在，禁止写入 `.spec-first/current`
- 目标目录存在但 `stage-state.json` 无法读取或 `featureId` 不一致，禁止切换
- 当前会话依赖旧 Feature 上下文且未显式重载时，不得声称“可以直接继续原任务”

## 恢复策略

- 切换后应立即建议执行 `/spec-first:catchup` 重载上下文
- 若切错 Feature，必须支持再次执行 `/spec-first:feature switch <featureId>` 回切
- 若当前指针已写入但下游上下文失败，应先回切，再执行 `catchup` 验证恢复

## 并发会话风险

- `.spec-first/current` 是项目内共享的当前需求定位指针，不是会话私有状态
- 多终端/多 agent 并发切换时，后写入者会覆盖先前结果
- 使用自动定位前，必须以 `current` 或 `catchup` 重新确认当前 Feature

## 输出要求

- `list`：展示 Feature 列表与阶段摘要
- `current`：展示当前 Feature、阶段和定位来源
- `switch`：必须展示目标 Feature、写入结果，以及建议的下一步恢复命令

## 成功标准
- CLI 命令成功执行（exit code = 0）
- 输出符合预期格式
- `switch` 成功时，`.spec-first/current` 已更新且已给出 `/spec-first:catchup` 建议
