# Traces Trailer 注入规范

## 格式定义

每个实现文件末尾必须注入 traces trailer：

```typescript
// Related: FR-AUTH-001, DS-AUTH-001
// Task: TASK-AUTH-002
// Author: Claude Code (spec-first:code v2.0)
// Date: 2026-03-09
```

## 字段说明

| 字段 | 说明 | 示例 |
|------|------|------|
| Related | 关联的需求 ID 和设计 ID | `FR-AUTH-001, DS-AUTH-001` |
| Task | 当前 TASK ID | `TASK-AUTH-002` |
| Author | 生成者 + 版本 | `Claude Code (spec-first:code v2.0)` |
| Date | 生成日期 | `2026-03-09` |

## 多关联格式

当一个文件关联多个 FR/DS/TASK 时：

```typescript
// Related: FR-AUTH-001, FR-AUTH-002
// Design: DS-AUTH-001, DS-AUTH-003
// Tasks: TASK-AUTH-002, TASK-AUTH-004
// Author: Claude Code (spec-first:code v2.0)
// Date: 2026-03-09
```

## 批量模式注意事项

- 每个 subagent 生成的文件都必须注入 traces
- traces 信息从上下文包中获取
- 不允许遗漏或格式错误
