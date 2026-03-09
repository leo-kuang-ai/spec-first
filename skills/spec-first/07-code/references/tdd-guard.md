# TDD 守卫详细说明

## 核心原则

**NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST.**

## 批量模式下的 TDD 守卫

### P0 阶段：TDD 预检

扫描所有 todo TASK，统计缺少 TDD 证据的数量：
- 缺少率 > 50%：阻断整个批量执行
- 缺少率 ≤ 50%：继续，但在 subagent 内部仍然检查

### Subagent 内部：TDD 强制守卫

每个 TASK 必须满足以下之一：
1. 在 findings.md 中存在 RED 证据
2. 在 findings.md 中存在结构化 TDD-WAIVER

不满足则返回 blocked，不执行代码生成。

## RED 证据格式

```markdown
### [TDD-RED] TASK-XXX

**测试命令**: `npm test path/to/test.spec.ts`
**退出码**: 1
**失败原因**: 功能缺失 - 函数 `sendOtp` 未定义
**时间**: 2026-03-09T10:30:00Z
```

## TDD-WAIVER 格式

```markdown
### [TDD-WAIVER] TASK-XXX

| 字段 | 值 |
|------|-----|
| **场景** | UI 细节调整 / 配置文件变更 / 文档更新 |
| **理由** | 无法通过自动化测试验证 / 测试成本过高 |
| **批准人** | Tech Lead / 用户确认 |
| **时间** | 2026-03-09T10:30:00Z |
```

## GREEN 证据格式

```markdown
### [TDD-GREEN] TASK-XXX

**测试命令**: `npm test path/to/test.spec.ts`
**退出码**: 0
**通过情况**: 所有测试通过
**时间**: 2026-03-09T11:00:00Z
```
