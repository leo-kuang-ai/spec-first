# Task Template

标准任务拆解模板，强调可执行、可维护、可验证，并把任务进展与下一步动作前置到文档主视图。

## 推荐结构

```markdown
# Task Plan — {featureId}

## Plan Status

- summary: 已完成任务拆分，等待开始当前实现项
- next_step: 选择唯一 in_progress 任务并启动实现

## 任务总览

| title | status | summary | next_step | owner | notes |
|---|---|---|---|---|---|
| 登录接口实现 | todo | 待开始 | 进入实现并补齐最小测试 | dev | 返回 token 且错误码完整 |

## 实施步骤

### 登录接口实现
1. 先补 RED 用例并确认失败原因
2. 只写最小实现让测试转绿
3. 更新 task_plan.md 与 findings.md 的实现说明

## 验证命令

- pnpm vitest run tests/unit/auth.test.ts
- pnpm vitest run tests/e2e/auth-flow.test.ts
```

## 字段要求

| 字段 | 说明 |
|------|------|
| `title` | 必填，且在当前表格内必须唯一 |
| `status` | 必填，严格使用 `todo/in_progress/blocked/done` |
| `summary` | 推荐，记录当前进展或阻塞摘要 |
| `next_step` | 推荐，记录下一步动作 |
| `owner` | 可选，记录责任人 |
| `notes` | 可选，记录补充说明或验收提示 |

## 实施步骤

- 每个任务至少 3 步，粒度以单次执行 5-30 分钟为宜
- 若涉及 TDD，第一步必须是 RED 证据
- 若涉及外部调研，结论必须同步到 `findings.md`
- 同一时刻最多只能有一个 `in_progress`

## 验证命令

- 优先填写最小测试命令
- 若需要联调或人工验证，补充第二条命令或说明
- 不允许把验证全部推迟到 `verify` 阶段再补
