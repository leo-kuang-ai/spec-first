# Test Level Guide

测试层级详细指南，用于指导测试用例的层级选择。

## 测试层级定义

| 层级 | 全称 | 范围 | 典型场景 | 执行时间 |
|------|------|------|----------|----------|
| **UT** | Unit Test | 单模块/函数级，隔离外部依赖 | 算法逻辑、数据转换、纯函数 | < 1s |
| **IT** | Integration Test | 多模块或模块+基础设施集成 | API 端点、数据库交互、消息队列 | 1-10s |
| **E2E** | End-to-End Test | 端到端用户路径验证 | 完整用户流程、跨系统交互 | 10-60s |
| **ST** | System Test | 系统级非功能或全局行为 | 性能、稳定性、恢复、并发 | 1-10min |

## 层级选择决策树

```
需要测试的行为
    │
    ├─ 是否涉及外部系统（数据库/API/消息队列）？
    │   ├─ 是 → 是否需要验证端到端用户路径？
    │   │   ├─ 是 → E2E
    │   │   └─ 否 → IT
    │   └─ 否 → UT
    │
    └─ 是否涉及非功能需求（性能/稳定性/并发）？
        └─ 是 → ST
```

## 层级映射规则

### UT（单元测试）

**适用场景**：
- 纯函数逻辑
- 数据转换/验证
- 状态机逻辑
- 算法实现

**特征**：
- 无外部依赖（mock 所有外部调用）
- 执行速度快（< 1s）
- 隔立性强，可并行运行

**示例**：
```typescript
// UT: 验证密码强度计算逻辑
test('calculatePasswordStrength returns correct score', () => {
  expect(calculatePasswordStrength('abc')).toBe('weak');
  expect(calculatePasswordStrength('Abc123!@#')).toBe('strong');
});
```

### IT（集成测试）

**适用场景**：
- API 端点测试
- 数据库交互
- 缓存集成
- 消息队列集成

**特征**：
- 使用真实基础设施（或 testcontainers）
- 验证模块间协作
- 执行时间适中（1-10s）

**示例**：
```typescript
// IT: 验证登录 API 端到端行为
test('POST /api/auth/login returns token with valid credentials', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ username: 'test', password: 'password' });

  expect(response.status).toBe(200);
  expect(response.body.token).toBeDefined();
});
```

### E2E（端到端测试）

**适用场景**：
- 完整用户流程
- 跨系统交互
- UI 交互验证

**特征**：
- 模拟真实用户操作
- 涉及多个系统集成
- 执行时间长（10-60s）

**示例**：
```typescript
// E2E: 验证用户注册到登录完整流程
test('user can register and then login', async () => {
  // 注册
  await page.goto('/register');
  await page.fill('#username', 'testuser');
  await page.fill('#password', 'password123');
  await page.click('#register-button');

  // 登录
  await page.goto('/login');
  await page.fill('#username', 'testuser');
  await page.fill('#password', 'password123');
  await page.click('#login-button');

  // 验证
  await expect(page).toHaveURL('/dashboard');
});
```

### ST（系统测试）

**适用场景**：
- 性能测试
- 压力测试
- 稳定性测试
- 恢复测试
- 并发测试

**特征**：
- 关注非功能需求
- 需要专门的测试环境
- 执行时间长（1-10min）

**示例**：
```typescript
// ST: 验证 API 性能
test('API handles 1000 concurrent requests', async () => {
  const startTime = Date.now();
  const promises = Array(1000).fill(null).map(() =>
    fetch('http://api.example.com/data')
  );

  await Promise.all(promises);
  const duration = Date.now() - startTime;

  expect(duration).toBeLessThan(5000); // 5s 内完成
});
```

## AC 到测试层级的映射

| AC 类型 | 推荐层级 | 备选层级 |
|---------|----------|----------|
| 功能逻辑（纯函数） | UT | - |
| API 端点 | IT | E2E |
| 数据库操作 | IT | E2E |
| 用户交互流程 | E2E | IT |
| 性能要求 | ST | - |
| 安全验证 | IT | ST |

## 覆盖率策略

### 测试金字塔

```
        /\
       /  \      E2E (10%)
      /____\     ───────────────
     /      \    IT (30%)
    /________\   ────────────────
   /          \  UT (60%)
  /____________\ ─────────────────
```

**原则**：
- UT 占 60%：快速反馈，覆盖核心逻辑
- IT 占 30%：验证集成，覆盖关键路径
- E2E 占 10%：验证用户价值，覆盖核心流程
- ST 按需：非功能需求专项测试

### 最小覆盖要求

| AC 复杂度 | 最小测试要求 |
|-----------|-------------|
| 简单（单一逻辑） | 1 个 UT |
| 中等（多步骤） | 1 个 IT + N 个 UT |
| 复杂（跨系统） | 1 个 E2E + N 个 IT + N 个 UT |
| 性能敏感 | 1 个 ST |
