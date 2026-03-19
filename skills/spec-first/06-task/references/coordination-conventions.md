# Coordination Conventions

用于 `spec-first:task` 的协作标记、交接语和日志记录约定。

## 标记约定

- `[P]`：推荐并行执行的 TASK。仅表示“依赖上可独立”，不等于运行时已自动并发。
- `[US#]`：所属用户故事。用于分组交付和验收视图，属于增强性信息，不是当前 parser 的硬解析字段。

## Handoff 约定

任务拆解完成后，推荐使用统一交接语：

```text
task_plan.md 已写入。下一步进入 /spec-first:code，按依赖顺序执行；若存在 [P] 标记任务，可按并行约定分批推进。
```

## Error Log Pattern

```md
## Errors Encountered

| Error | 尝试次数 | 解决方案 |
|-------|---------|----------|
| FR-AUTH-001 缺少对应 DS | 1 | 先执行 `/spec-first:design` 生成 DS |
| TASK-AUTH-003 粒度过粗 | 1 | 拆分为 TASK-AUTH-003A 和 TASK-AUTH-003B |
| 检测到循环依赖 TASK-AUTH-004 → TASK-AUTH-005 → TASK-AUTH-004 | 1 | 调整依赖关系 |
```

## Decision Log Pattern

```md
## Decisions Made

| 决策 | 理由 |
|------|------|
| 按用户故事分组任务 | 便于独立交付和验收 |
| TASK-AUTH-002 设为可并行 `[P]` | 不依赖其他任务，可提前开始 |
| 登录 API 拆分为 2 个任务 | 发送验证码和验证码登录是两个独立端点 |
```

## Operation Types

| 标记 | 含义 | 执行者 |
|------|------|--------|
| `[AI]` | 自动分析/拆解 | AI |
| `[USER]` | 需要用户确认 | 用户 |
