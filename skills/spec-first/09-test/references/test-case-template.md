# Test Case Template

标准测试用例模板，确保测试用例的可执行性和可追溯性。

## 测试用例结构

```markdown
### TC-{LEVEL}-{ABBR}-{SEQ}: [测试用例标题]

**映射**: FR-XXX, AC-XXX
**级别**: UT | IT | E2E | ST
**优先级**: P0 | P1 | P2 | P3
**前置条件**: [执行前需要满足的条件]
**后置条件**: [执行后需要清理的资源]

**步骤**:
1. [具体操作]
2. [具体操作]
3. [具体操作]

**预期结果**:
- [具体可验证的结果 1]
- [具体可验证的结果 2]

**验收标准**:
- [ ] 测试可执行
- [ ] 结果可验证
- [ ] 失败时可诊断
```

## 测试用例类型

### Happy Path（正常路径）

验证功能在正常情况下的行为。

```markdown
### TC-IT-AUTH-001: 短信登录 Happy Path

**映射**: FR-AUTH-001, AC-AUTH-001-01, AC-AUTH-001-02
**级别**: IT
**优先级**: P0

**前置条件**: 用户已注册手机号 13800138000
**后置条件**: 清理测试用户数据

**步骤**:
1. POST /api/auth/sms/send-otp {phone: "13800138000"}
2. 从数据库 otp_sessions 获取验证码
3. POST /api/auth/sms/login {phone: "13800138000", code: "<otp>"}

**预期结果**:
- 状态码 200
- 返回 JWT token
- token 可通过验证

**验收标准**:
- [ ] 验证码 60s 内发送成功
- [ ] 登录后 3s 内返回 token
```

### Sad Path（异常路径）

验证功能在异常情况下的处理。

```markdown
### TC-IT-AUTH-002: 错误验证码登录

**映射**: FR-AUTH-001, AC-AUTH-001-03
**级别**: IT
**优先级**: P0

**前置条件**: 用户已注册手机号 13800138000
**后置条件**: 清理测试用户数据

**步骤**:
1. POST /api/auth/sms/send-otp {phone: "13800138000"}
2. POST /api/auth/sms/login {phone: "13800138000", code: "000000"}

**预期结果**:
- 状态码 401
- 返回错误信息 "验证码错误"

**验收标准**:
- [ ] 错误信息明确
- [ ] 不暴露系统信息
```

### Edge Case（边界条件）

验证功能在边界条件下的行为。

```markdown
### TC-UT-AUTH-003: 验证码 5 分钟过期

**映射**: FR-AUTH-001, AC-AUTH-001-04
**级别**: UT
**优先级**: P1

**前置条件**: -
**后置条件**: -

**步骤**:
1. 创建验证码，设置 created_at 为 6 分钟前
2. 调用 validateOtp(code)

**预期结果**:
- 返回 false
- 错误信息 "验证码已过期"

**验收标准**:
- [ ] 过期时间准确
```

## 测试数据管理

### 测试数据隔离

| 策略 | 描述 | 适用场景 |
|------|------|----------|
| **Database Rollback** | 测试后回滚事务 | IT 需要数据库 |
| **Test Containers** | 使用 Docker 容器 | IT 需要完整环境 |
| **Mock Server** | 模拟外部服务 | E2E 需要隔离 |
| **Fixtures** | 预定义测试数据 | 所有层级 |

### Fixture 示例

```typescript
// fixtures/auth.ts
export const testUser = {
  phone: '13800138000',
  password: 'password123',
};

export const expiredOtp = {
  code: '123456',
  created_at: new Date(Date.now() - 6 * 60 * 1000),
};

export const validOtp = {
  code: '123456',
  created_at: new Date(),
};
```

## 测试断言规范

### 断言原则

**DO**:
- ✅ 一个断言验证一个行为
- ✅ 断言消息描述具体期望
- ✅ 使用精确匹配（toBe）而非模糊匹配（toContain）

**DON'T**:
- ❌ 多个断言混杂
- ❌ 断言消息模糊
- ❌ 过度依赖实现细节

### 断言示例

| 类型 | 好的断言 | 差的断言 |
|------|----------|----------|
| 状态码 | `expect(response.status).toBe(200)` | `expect(response.ok).toBe(true)` |
| 数据结构 | `expect(result).toEqual({id: 1, name: 'test'})` | `expect(result).toHaveProperty('id')` |
| 错误信息 | `expect(error.message).toBe('User not found')` | `expect(error).toBeDefined()` |
| 行为次数 | `expect(mockFn).toHaveBeenCalledTimes(1)` | `expect(mockFn).toBeTruthy()` |

## 测试命名规范

### 测试函数命名

```typescript
// 格式: <verb> <subject> <condition> <expectation>
test('returns user when valid id is provided', () => {
  // ...
});

test('throws error when user not found', () => {
  // ...
});

test('calculates total with discount applied', () => {
  // ...
});
```

### 测试文件命名

```
tests/
├── unit/
│   └── auth.service.test.ts        # 对应 src/auth/auth.service.ts
├── integration/
│   └── auth.api.test.ts            # 对应 src/api/auth.ts
└── e2e/
    └── login.flow.test.ts          # 对应用户流程
```

## 常见反模式

| ❌ 反模式 | ✅ 正确做法 |
|---------|-----------|
| 测试包含多个逻辑分支 | 每个分支一个测试 |
| 测试依赖执行顺序 | 每个测试独立 |
| 测试共享状态 | 每个测试隔离数据 |
| 测试超长（>50 行） | 拆分为多个测试或提取 helper |
| 测试验证实现细节 | 验证行为而非实现 |
