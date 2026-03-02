# API 文档模板（视角差异）

> **说明**：api-docs.md 的内容和视角因端类型而异

---

## 后台服务（暴露方视角）

### 文档结构

```markdown
# API 文档

## 概述
- 基础 URL: `https://api.example.com`
- 认证方式: Bearer Token / API Key
- 响应格式: JSON

## 端点清单

### 用户管理

#### POST /api/users
**描述**: 创建新用户

**请求体**:
\```json
{
  "name": "string",
  "email": "string",
  "password": "string"
}
\```

**响应** (201):
\```json
{
  "id": "uuid",
  "name": "string",
  "email": "string",
  "createdAt": "ISO8601"
}
\```

**错误响应**:
| 状态码 | 说明 |
|--------|------|
| 400 | 参数校验失败 |
| 409 | 邮箱已存在 |
| 422 | 业务规则校验失败 |
```

### 关键内容

| 内容 | 说明 |
|------|------|
| **端点定义** | HTTP 方法、路径、参数 |
| **请求/响应格式** | JSON Schema、示例 |
| **错误码** | 状态码、错误信息 |
| **认证方式** | JWT、OAuth2、API Key |
| **限流规则** | QPS、并发限制 |

---

## 前端/App（调用方视角）

### 文档结构

```markdown
# API 文档（调用方）

## 概述
- 后端地址: `https://api.example.com`
- 认证方式: Bearer Token（存储在 localStorage）

## 接口清单

### 用户登录

**调用**: `POST /api/auth/login`

**请求代码**:
\```typescript
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: User;
}

const login = async (data: LoginRequest) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  // 处理响应...
};
\```

**错误处理**:
- 401: 显示"账号或密码错误"
- 429: 显示"请求过于频繁，请稍后重试"

### 关键内容

| 内容 | 说明 |
|------|------|
| **接口清单** | 调用的后端 API 列表 |
| **调用示例** | 客户端代码片段 |
| **错误处理** | 用户友好的错误提示 |
| **缓存策略** | 接口缓存、离线降级 |
| **数据转换** | API 数据 → UI 模型 |

---

## 视角对比

| 维度 | 后台（暴露方） | 前端/App（调用方） |
|------|---------------|-------------------|
| **主体** | 服务、资源 | 接口、调用 |
| **描述** | 如何实现 | 如何使用 |
| **示例** | 请求/响应 JSON | 调用代码 |
| **错误** | 状态码、错误码 | 用户提示文案 |
| **关注点** | 性能、安全、兼容性 | 体验、降级、缓存 |
