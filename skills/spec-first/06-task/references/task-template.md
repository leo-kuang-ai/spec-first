# Task Template

标准任务拆解模板，强调可执行、可追踪、可验证，并把验证入口前置到任务本身。

## 推荐结构

```markdown
# Task Plan — {featureId}

## 任务明细

| Task ID | 标题 | Owner | 预计工期 | traces | depends_on | 验收标准 | 验证命令 | 状态 |
|---|---|---|---|---|---|---|---|---|
| TASK-AUTH-001 | 登录接口实现 | dev | 1d | FR-AUTH-001 | - | 返回 token 且错误码完整 | pnpm test -- tests/unit/auth.test.ts | in_progress |

## 实施步骤

### TASK-AUTH-001 — 登录接口实现
1. 先补 RED 用例并确认失败原因
2. 只写最小实现让测试转绿
3. 更新 traceability-matrix.md 与 findings.md

## 验证命令

- pnpm test -- tests/unit/auth.test.ts
- pnpm test -- tests/e2e/auth-flow.test.ts
```

## 字段要求

| 字段 | 说明 |
|------|------|
| `Task ID` | 必须是唯一 TASK 标识 |
| `traces` | 至少链接 1 个 FR/DS/API |
| `depends_on` | 仅填 TASK ID，多个用逗号分隔 |
| `验收标准` | 写结果，不写动作 |
| `验证命令` | 写最小可执行命令，不能留空 |
| `状态` | `todo/in_progress/blocked/verified/done` |

## 实施步骤

- 每个 TASK 至少 3 步，粒度以单次执行 5-30 分钟为宜
- 若涉及 TDD，第一步必须是 RED 证据
- 若涉及外部调研，结论必须同步到 `findings.md`

## 验证命令

- 优先填写最小测试命令
- 若需要联调或人工验证，补充第二条命令或说明
- 不允许把验证全部推迟到 `verify` 阶段再补
