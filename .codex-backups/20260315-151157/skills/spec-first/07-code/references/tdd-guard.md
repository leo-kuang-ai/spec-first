# TDD 守卫说明

当前实现真理源: `src/core/batch-executor/guards.ts`

## 核心原则

`NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST.`

## 当前守卫口径

### P0 预检

批量执行开始前，主进程会扫描 `specs/{featureId}/findings.md`：

- 对每个 todo TASK，检查是否存在 `[TDD-RED] TASK-ID`
- 或存在 `[TDD-WAIVER] TASK-ID`
- 缺失率 `> 50%`：阻断整个批量执行
- 缺失率 `<= 50%`：允许继续，但缺证据 TASK 仍应在执行前补齐

注意：
- 当前实现只检查标记字符串是否存在，不解析表格字段
- `TDD-GREEN` 不是预检通过条件；它属于执行完成后的补充证据

### TASK 级守卫

每个 TASK 在真正开始编码前，仍应满足以下之一：

1. 已记录 RED 证据
2. 已记录经确认的 WAIVER

不满足时，应返回 `blocked`，不要继续生成生产代码。

## 推荐证据格式

### RED

```md
### [TDD-RED] TASK-XXX

- Test: `pnpm vitest run tests/unit/example.test.ts`
- Exit: `1`
- Failure: 目标行为尚未实现
- Time: `2026-03-14T10:30:00+08:00`
```

### WAIVER

```md
### [TDD-WAIVER] TASK-XXX

- Scope: 文档更新 / 纯配置调整 / 无法自动化验证的外部集成
- Reason: 当前变更不适合先写失败测试，已获确认
- Approver: 用户确认 / 负责人确认
- Time: `2026-03-14T10:30:00+08:00`
```

### GREEN

```md
### [TDD-GREEN] TASK-XXX

- Test: `pnpm vitest run tests/unit/example.test.ts`
- Exit: `0`
- Result: 相关测试通过
- Time: `2026-03-14T11:00:00+08:00`
```

## 执行建议

- 预检只负责做批量入口拦截，不替代单 TASK 的 TDD 判断
- 如果仓库只能跑全量验证，也可以记录 `pnpm test -- --run`，但要在说明里标明本 TASK 关联范围
- RED/WAIVER/GREEN 都写入 `specs/{featureId}/findings.md`
