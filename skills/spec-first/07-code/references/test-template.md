# Test Template Reference

测试编写模板，确保测试质量和一致性。

## 测试文件结构

### 标准结构

```typescript
/**
 * UserService 单元测试
 *
 * @see FR-AUTH-001 用户管理功能
 * @see TC-AUTH-001-T01 用户注册测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UserService } from '@/services/user.service';
import { UserRepository } from '@/repositories/user.repository';
import type { User } from '@/types/user';

// Mock 依赖
vi.mock('@/repositories/user.repository');

describe('UserService', () => {
  let service: UserService;
  let mockRepository: UserRepository;

  beforeEach(() => {
    // 每个测试前执行
    mockRepository = new UserRepository() as jest.Mocked<UserRepository>;
    service = new UserService(mockRepository);
  });

  afterEach(() => {
    // 每个测试后执行
    vi.clearAllMocks();
  });

  // 测试套件分组
  describe('create', () => {
    // Happy Path 测试
    it('should create user with valid input', async () => {
      // Arrange
      const input = {
        name: 'John Doe',
        email: 'john@example.com'
      };

      const expectedUser: User = {
        id: 'user-123',
        ...input,
        createdAt: new Date()
      };

      vi.spyOn(mockRepository, 'create').mockResolvedValue(expectedUser);

      // Act
      const result = await service.create(input);

      // Assert
      expect(result).toEqual(expectedUser);
      expect(mockRepository.create).toHaveBeenCalledWith(input);
      expect(mockRepository.create).toHaveBeenCalledTimes(1);
    });

    // Sad Path 测试
    it('should throw ValidationError when name is too short', async () => {
      // Arrange
      const input = {
        name: 'J',
        email: 'john@example.com'
      };

      // Act & Assert
      await expect(service.create(input))
        .rejects
        .toThrow('Name must be at least 2 characters');
    });

    it('should throw ConflictError when email already exists', async () => {
      // Arrange
      const input = {
        name: 'John Doe',
        email: 'existing@example.com'
      };

      vi.spyOn(mockRepository, 'findByEmail')
        .mockResolvedValue({ id: 'existing-123' } as User);

      // Act & Assert
      await expect(service.create(input))
        .rejects
        .toThrow('Email already exists');
    });

    // Edge Case 测试
    it('should trim whitespace from input', async () => {
      // Arrange
      const input = {
        name: '  John Doe  ',
        email: '  john@example.com  '
      };

      const expectedUser: User = {
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: new Date()
      };

      vi.spyOn(mockRepository, 'create').mockResolvedValue(expectedUser);

      // Act
      const result = await service.create(input);

      // Assert
      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('john@example.com');
    });
  });

  describe('findById', () => {
    // ... 测试用例
  });
});

// Related: FR-AUTH-001, TC-AUTH-001-T01
// Author: Claude Code (spec-first:code)
// Date: 2026-03-05
```

## AAA 模式（Arrange-Act-Assert）

```typescript
it('should calculate discount correctly', () => {
  // Arrange - 准备测试数据
  const price = 100;
  const discountPercent = 20;
  const expected = 80;

  // Act - 执行被测试的行为
  const result = calculateDiscount(price, discountPercent);

  // Assert - 验证结果
  expect(result).toBe(expected);
});
```

## 测试分类

### Happy Path 测试

描述正常流程下的预期行为。

```typescript
it('should successfully create user with valid data', async () => {
  const input = { name: 'John', email: 'john@example.com' };
  const result = await userService.create(input);
  expect(result).toHaveProperty('id');
  expect(result.name).toBe('John');
});
```

### Sad Path 测试

描述异常情况下的错误处理。

```typescript
it('should throw error when email is invalid', async () => {
  const input = { name: 'John', email: 'invalid-email' };
  await expect(userService.create(input))
    .rejects
    .toThrow(ValidationError);
});
```

### Edge Case 测试

描述边界条件和特殊情况。

```typescript
it('should handle empty name correctly', async () => {
  const input = { name: '', email: 'john@example.com' };
  await expect(userService.create(input))
    .rejects
    .toThrow('Name is required');
});

it('should handle maximum length name', async () => {
  const input = { name: 'A'.repeat(50), email: 'john@example.com' };
  const result = await userService.create(input);
  expect(result.name).toHaveLength(50);
});
```

## Mock 最佳实践

### Mock 外部依赖

```typescript
import { vi } from 'vitest';

describe('UserService', () => {
  it('should call external API correctly', async () => {
    // Mock fetch
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: '123', name: 'John' })
      } as Response)
    );

    const result = await userService.fetchFromAPI('123');

    expect(result).toEqual({ id: '123', name: 'John' });
    expect(fetch).toHaveBeenCalledWith('/api/users/123');
  });
});
```

### Mock 时间

```typescript
import { vi } from 'vitest';

describe('Time-dependent logic', () => {
  it('should calculate age correctly', () => {
    // 固定时间
    const fixedDate = new Date('2026-03-05');
    vi.setSystemTime(fixedDate);

    const birthDate = new Date('1990-03-05');
    const age = calculateAge(birthDate);

    expect(age).toBe(36);

    // 恢复时间
    vi.useRealSystemTime();
  });
});
```

### Mock 文件系统

```typescript
import { vi } from 'vitest';
import { promises as fs } from 'fs';

describe('File operations', () => {
  it('should read and parse config file', async () => {
    const mockConfig = { apiKey: 'test-key' };

    vi.spyOn(fs, 'readFile')
      .mockResolvedValue(JSON.stringify(mockConfig));

    const config = await loadConfig('config.json');

    expect(config).toEqual(mockConfig);
  });
});
```

## 测试覆盖率目标

| 覆盖率类型 | 目标 | 说明 |
|-----------|------|------|
| Lines | ≥ 75% | 可执行语句覆盖率 |
| Functions | ≥ 75% | 函数调用覆盖率 |
| Branches | ≥ 65% | 条件分支覆盖率 |
| Statements | ≥ 75% | 语句覆盖率 |

## TDD 循环模板

### RED - 失败的测试

```typescript
// 1. 先写测试（预期失败）
it('should validate email format', async () => {
  const input = { name: 'John', email: 'invalid' };

  await expect(userService.create(input))
    .rejects
    .toThrow('Invalid email format');
});

// 记录 RED 证据到 findings.md
// 命令: npm test -- src/services/user.service.test.ts
// 退出码: 1
// 失败原因: ValidationError not thrown
```

### GREEN - 最小实现

```typescript
// 2. 写最小代码使测试通过
async function create(input: CreateUserInput): Promise<User> {
  // 最小实现
  if (!input.email.includes('@')) {
    throw new ValidationError('Invalid email format');
  }
  // ...
}

// 记录 GREEN 证据到 findings.md
// 命令: npm test -- src/services/user.service.test.ts
// 退出码: 0
// 通过: All tests passed
```

### REFACTOR - 重构优化

```typescript
// 3. 重构代码（保持测试通过）
async function create(input: CreateUserInput): Promise<User> {
  validateEmail(input.email);
  // ...
}

function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }
}
```

## 测试命令记录模板

### 记录到 findings.md

```markdown
## [TDD-RED] TASK-AUTH-002

| 字段 | 值 |
|------|-----|
| **测试命令** | `npm test -- src/services/user.service.test.ts -t "should validate email format"` |
| **退出码** | 1 |
| **失败原因** | Expected: throws ValidationError, Received: returns normally |
| **时间** | 2026-03-05T10:30:00Z |

## [TDD-GREEN] TASK-AUTH-002

| 字段 | 值 |
|------|-----|
| **测试命令** | `npm test -- src/services/user.service.test.ts` |
| **退出码** | 0 |
| **通过** | 5/5 tests passed |
| **时间** | 2026-03-05T10:35:00Z |
```

## 集成测试模板

### API 集成测试

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '@/app';

describe('POST /api/users', () => {
  let authToken: string;

  beforeAll(async () => {
    // 设置测试环境
    authToken = await getTestAuthToken();
  });

  afterAll(async () => {
    // 清理测试数据
    await cleanupTestData();
  });

  it('should create user and return 201', async () => {
    const response = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test User',
        email: 'test@example.com'
      })
      .expect(201);

    expect(response.body).toMatchObject({
      id: expect.any(String),
      name: 'Test User',
      email: 'test@example.com'
    });
  });

  it('should return 400 for invalid input', async () => {
    await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'T',
        email: 'invalid'
      })
      .expect(400);
  });
});
```

## E2E 测试模板

### 端到端流程测试

```typescript
import { test, expect } from '@playwright/test';

test.describe('User Registration Flow', () => {
  test('should complete full registration flow', async ({ page }) => {
    // 导航到注册页面
    await page.goto('/register');

    // 填写表单
    await page.fill('[name="name"]', 'John Doe');
    await page.fill('[name="email"]', 'john@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');

    // 提交表单
    await page.click('[type="submit"]');

    // 验证导航到欢迎页面
    await expect(page).toHaveURL('/welcome');
    await expect(page.locator('h1')).toContainText('Welcome, John Doe');

    // 验证收到确认邮件（使用测试邮件服务）
    const emails = await testEmailService.getEmails('john@example.com');
    expect(emails).toHaveLength(1);
    expect(emails[0].subject).toContain('Welcome');
  });
});
```

## 性能测试模板

### 基准测试

```typescript
import { bench, describe } from 'vitest';

describe('String operations', () => {
  bench('string concatenation with +', () => {
    let result = '';
    for (let i = 0; i < 1000; i++) {
      result += 'test';
    }
  });

  bench('string concatenation with array join', () => {
    const parts = [];
    for (let i = 0; i < 1000; i++) {
      parts.push('test');
    }
    parts.join('');
  });

  bench('string concatenation with template literal', () => {
    let result = '';
    for (let i = 0; i < 1000; i++) {
      result = `${result}test`;
    }
  });
});
```

## 测试检查清单

提交代码前确认：

- [ ] 所有测试通过（退出码 0）
- [ ] 新功能有对应测试
- [ ] Bug 修复有回归测试
- [ ] 边界条件已覆盖
- [ ] 错误路径已测试
- [ ] Mock 正确设置和清理
- [ ] 测试文件包含 traces trailer
- [ ] TC 已注册到矩阵
