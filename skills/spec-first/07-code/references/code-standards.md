# Code Standards Reference

代码编写规范参考，确保代码一致性和可维护性。

## 命名规范

### 文件命名

| 类型 | 规范 | 示例 |
|------|------|------|
| TypeScript 文件 | `kebab-case.ts` | `user-service.ts`, `auth-controller.ts` |
| 测试文件 | `*.test.ts` | `user-service.test.ts` |
| 类型定义文件 | `*.types.ts` | `user.types.ts` |
| 工具文件 | `*.util.ts` | `date.util.ts` |

### 变量命名

| 类型 | 规范 | 示例 |
|------|------|------|
| 变量/常量 | `camelCase` | `userCount`, `maxRetries` |
| 常量（不可变） | `UPPER_SNAKE_CASE` | `API_BASE_URL`, `MAX_RETRY_COUNT` |
| 类/接口/类型 | `PascalCase` | `UserService`, `IUserRepository` |
| 枚举 | `PascalCase` | `UserRole`, `OrderStatus` |
| 枚举值 | `PascalCase` | `UserRole.Admin`, `OrderStatus.Pending` |
| 私有成员 | `_camelCase` | `_internalCache`, `_validate()` |
| 布尔值 | `is/has/can/should` 前缀 | `isActive`, `hasPermission`, `canDelete` |
| 函数/方法 | `camelCase`，动词开头 | `getUser()`, `validateEmail()`, `sendNotification()` |

### 接口命名

| 类型 | 规范 | 示例 |
|------|------|------|
| 普通接口 | `PascalCase` 或 `I` 前缀 | `User` 或 `IUser` |
| 配置接口 | `Config` 后缀 | `AppConfig`, `DatabaseConfig` |
| Props 接口 | `Props` 后缀 | `ButtonProps`, `ModalProps` |
| 返回值接口 | `Result` 后缀 | `CreateUserResult`, `LoginResult` |

## 代码组织

### 文件结构

```typescript
// 1. 文件头注释（可选）
/**
 * 文件描述
 * @see FR-XXX 关联需求
 */

// 2. Import 语句（分组，按字母顺序）
// Node 内置
import { createHash } from 'crypto';

// 第三方库
import express, { Request, Response } from 'express';
import lodash from 'lodash';

// 内部模块
import { UserService } from './user.service';
import { logger } from '@/utils/logger';
import type { User } from './user.types';

// 3. 类型定义
export interface CreateUserInput {
  name: string;
  email: string;
}

export type UserRole = 'admin' | 'user' | 'guest';

// 4. 常量定义
const MAX_RETRY_COUNT = 3;
const DEFAULT_TIMEOUT = 5000;

// 5. 类/函数定义
export class UserController {
  // 公共方法
  public async create(req: Request, res: Response): Promise<void> {
    // ...
  }

  // 私有方法
  private async validate(input: CreateUserInput): Promise<boolean> {
    // ...
  }
}

// 6. 导出
export default UserController;

// 7. Traces trailer
// Related: FR-XXX, DS-XXX
// Task: TASK-XXX
// Author: Claude Code (spec-first:code)
// Date: 2026-03-05
```

### Import 顺序

1. Node 内置模块
2. 第三方库（按字母顺序）
3. 内部模块（按字母顺序，使用 `@/` 别名）
4. 类型导入（使用 `import type`）
5. 相对路径导入

### 导入规范

```typescript
// ✅ 推荐：具名导入
import { UserService } from './user.service';

// ❌ 避免：默认导出（除非必要）
import UserService from './user.service';

// ✅ 推荐：类型导入使用 import type
import type { User } from './user.types';

// ✅ 推荐：命名空间导入（大型库）
import * as lodash from 'lodash';
```

## 注释规范

### JSDoc 注释

```typescript
/**
 * 创建用户
 *
 * @param input - 用户创建输入
 * @param input.name - 用户名（2-50 字符）
 * @param input.email - 邮箱地址
 * @returns 创建的用户对象
 * @throws {ValidationError} 输入验证失败
 * @throws {ConflictError} 邮箱已存在
 *
 * @see FR-AUTH-001 用户注册功能
 * @see DS-AUTH-001 用户数据模型
 * @example
 * ```typescript
 * const user = await createUser({
 *   name: 'John Doe',
 *   email: 'john@example.com'
 * });
 * ```
 */
export async function createUser(input: CreateUserInput): Promise<User> {
  // Implementation...
}
```

### 行内注释

```typescript
// ✅ 推荐：解释"为什么"而非"是什么"
// 使用指数退避策略避免服务过载
const delay = Math.pow(2, attempt) * 1000;

// ❌ 避免：重复代码逻辑
// 将 delay 设为 2 的 attempt 次方乘以 1000
const delay = Math.pow(2, attempt) * 1000;
```

### TODO 注释

```typescript
// TODO(tech-id): 重构为策略模式 (2026-03-31)
// FIXME: 边界条件处理不完善
// HACK: 临时方案，待后端 API 更新后移除
// NOTE: 性能关键路径，避免引入额外依赖
```

## 错误处理

### 错误类定义

```typescript
// base.error.ts
export class BaseError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// 验证错误
export class ValidationError extends BaseError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

// 冲突错误
export class ConflictError extends BaseError {
  constructor(message: string, details?: unknown) {
    super(message, 'CONFLICT_ERROR', 409, details);
  }
}
```

### 错误处理模式

```typescript
// ✅ 推荐：早期返回
export async function getUser(id: string): Promise<User> {
  if (!id) {
    throw new ValidationError('User ID is required');
  }

  const user = await userRepository.findById(id);
  if (!user) {
    throw new NotFoundError(`User not found: ${id}`);
  }

  return user;
}

// ✅ 推荐：Result 模式（函数式错误处理）
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

export async function safeGetUser(id: string): Promise<Result<User>> {
  try {
    const user = await userRepository.findById(id);
    if (!user) {
      return { success: false, error: new NotFoundError(`User not found: ${id}`) };
    }
    return { success: true, data: user };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}
```

## 异步编程

### Promise 规范

```typescript
// ✅ 推荐：使用 async/await
export async function fetchUserData(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  const data = await response.json();
  return data;
}

// ❌ 避免：嵌套 Promise
export function fetchUserData(id: string): Promise<User> {
  return fetch(`/api/users/${id}`)
    .then(response => response.json())
    .then(data => data);
}
```

### 并行处理

```typescript
// ✅ 推荐：并行执行独立操作
export async function fetchDashboardData(userId: string): Promise<DashboardData> {
  const [user, posts, notifications] = await Promise.all([
    fetchUser(userId),
    fetchUserPosts(userId),
    fetchNotifications(userId)
  ]);

  return { user, posts, notifications };
}

// ✅ 推荐：带错误处理的并行
export async function fetchDashboardDataSafe(userId: string): Promise<DashboardData> {
  const results = await Promise.allSettled([
    fetchUser(userId),
    fetchUserPosts(userId),
    fetchNotifications(userId)
  ]);

  const user = results[0].status === 'fulfilled' ? results[0].value : null;
  const posts = results[1].status === 'fulfilled' ? results[1].value : [];
  const notifications = results[2].status === 'fulfilled' ? results[2].value : [];

  return { user, posts, notifications };
}
```

## 类型安全

### 类型定义

```typescript
// ✅ 推荐：明确类型定义
interface CreateUserInput {
  name: string;
  email: string;
  role?: UserRole;
}

// ✅ 推荐：使用 utility types
type UpdateUserInput = Partial<CreateUserInput>;
type ReadonlyUser = Readonly<User>;
type UserKeys = keyof User;

// ✅ 推荐：联合类型
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

// ✅ 推荐：字面量类型
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// ✅ 推荐：泛型约束
function logEvent<T extends { id: string }>(event: T): void {
  console.log(`Event ${event.id}`);
}
```

### 类型守卫

```typescript
// ✅ 推荐：类型守卫函数
function isUser(input: unknown): input is User {
  return (
    typeof input === 'object' &&
    input !== null &&
    'id' in input &&
    'name' in input &&
    'email' in input
  );
}

function isArrayOfUsers(input: unknown): input is User[] {
  return Array.isArray(input) && input.every(isUser);
}
```

## 性能规范

### 避免陷阱

```typescript
// ❌ 避免：循环中的重复计算
for (let i = 0; i < array.length; i++) {
  // 每次都计算 array.length
}

// ✅ 推荐：缓存长度
const length = array.length;
for (let i = 0; i < length; i++) {
  // ...
}

// ✅ 推荐：使用 for...of
for (const item of array) {
  // ...
}

// ❌ 避免：不必要的数组复制
const newArray = array.map(item => item); // 不做任何转换

// ✅ 推荐：使用 forEach 或 for...of
array.forEach(item => console.log(item));
```

### 大数据处理

```typescript
// ✅ 推荐：流式处理
import { Readable } from 'stream';

async function processLargeFile(filePath: string): Promise<void> {
  const stream = fs.createReadStream(filePath);

  for await (const chunk of stream) {
    await processChunk(chunk);
  }
}

// ✅ 推荐：分批处理
async function processBatch<T>(
  items: T[],
  batchSize: number,
  processor: (item: T) => Promise<void>
): Promise<void> {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.all(batch.map(processor));
  }
}
```

## 安全规范

### 敏感数据处理

```typescript
// ❌ 避免：硬编码敏感信息
const API_KEY = 'sk-xxxxx';

// ✅ 推荐：环境变量
const API_KEY = process.env.API_KEY!;

// ✅ 推荐：日志脱敏
function sanitizeLog(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...data };

  // 脱敏字段
  const sensitiveFields = ['password', 'token', 'apiKey', 'secret'];
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '***REDACTED***';
    }
  }

  return sanitized;
}
```

### 输入验证

```typescript
// ✅ 推荐：使用验证库
import { z } from 'zod';

const createUserSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  role: z.enum(['admin', 'user', 'guest']).optional()
});

export async function createUser(input: unknown): Promise<User> {
  const validated = createUserSchema.parse(input);
  // ...
}
```

## 代码清单

### 提交前检查

- [ ] ESLint 通过（0 errors, 0 warnings）
- [ ] TypeScript 类型检查通过
- [ ] 单元测试通过
- [ ] 测试覆盖率达标
- [ ] 无 console.log 或 debugger 语句
- [ ] 无注释掉的代码块
- [ ] traces trailer 已注入
- [ ] findings.md 已更新

## 最小实现与范围边界
- 只实现当前 TASK 直接需要的逻辑
- 不为未来需求预埋抽象、配置或扩展点
- 范围外问题记录到 `findings.md`，不在本次 TASK 中一并处理

## code-view 对齐要求
- `entryPoints`：明确本轮改动入口
- `likelyChangeAreas`：列出高概率变更模块
- `changeHazards`：列出回归与风险点
- 若背景不足，需同时输出 `backgroundInputStatus`
