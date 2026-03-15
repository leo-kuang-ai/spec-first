# Test Template Reference

用于 `spec-first:code` 的测试模板，优先对齐当前仓库测试栈：

- Vitest
- `*.test.ts`
- `vi` mock / spy

## 基本模板

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('target module', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should handle the happy path', async () => {
    expect(true).toBe(true);
  });

  it('should reject invalid input', async () => {
    await expect(Promise.reject(new Error('bad input'))).rejects.toThrow('bad input');
  });
});
```

## 推荐结构

每个 TASK 相关测试至少覆盖：

1. Happy path
2. Invalid input / error path
3. 边界条件

## Mock 约束

推荐：

```typescript
const spy = vi.spyOn(service, 'run').mockResolvedValue('ok');
expect(spy).toHaveBeenCalledTimes(1);
```

避免：

- `jest.Mocked`
- Jest 专属 API
- 与当前仓库不一致的测试框架写法

## 时间与全局状态

如需 mock 时间：

```typescript
vi.useFakeTimers();
vi.setSystemTime(new Date('2026-03-14T00:00:00.000Z'));

// test logic

vi.useRealTimers();
```

如需 mock 全局函数：

```typescript
const fetchSpy = vi.spyOn(globalThis, 'fetch');
```

## TASK 对齐要求

测试文件应尽量体现：

- 关联 TASK
- 直接验证当前实现行为
- 避免顺手扩大范围测试

如果增加了测试但未覆盖验收标准，应在 findings 中说明缺口。

## 命名建议

- 文件名：`*.test.ts`
- case 名称：`should ...`
- 按功能分组：`describe('module')` / `describe('method')`

## 最小验收

对每个完成的 TASK：

- 至少有 1 个新增或更新的有效测试
- 测试能够证明当前改动不是伪实现
- 测试命令应可纳入：
  - `pnpm test -- --run`
  - 或最小子集定向测试命令
