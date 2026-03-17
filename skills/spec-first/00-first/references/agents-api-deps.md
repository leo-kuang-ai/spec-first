# Agent B / C1 — API 与外部依赖

> 同波独立并行，无数据依赖。
> 输入上下文：P1a tech-stack 结果 + `serena_available` 状态。

---

## Agent B: API 接口规范（api-docs.md）

**目标**：从代码中提取 API 接口规范（而非端点列表），生成项目的 API 设计规范文档。

---

### 提取内容

#### 基础规范（6 项）

1. **统一响应格式** - 从 response middleware/interceptor 提取
2. **错误码规范** - 从 error constants/enums 提取
3. **认证方式** - 从 auth middleware 提取
4. **分页规范** - 从 pagination dto/utils 提取
5. **时间格式** - 从序列化配置提取
6. **命名规范** - 从现有代码推断

#### 扩展内容

- 基础规范全部内容
- 接口示例（2-3 个典型端点，含请求/响应）
- 数据字典（枚举类型定义）
- cURL 调用示例

---

### 提取策略

#### 1. 统一响应格式

**提取位置**：

| 框架 | 提取方式 |
|------|----------|
| Express/Koa | response middleware 中的 `res.json` wrapper |
| NestJS | `@UseInterceptors(TransformInterceptor)` |
| Spring Boot | `@ControllerAdvice` + `ResponseBodyAdvice` |
| Django/Flask | response decorator/middleware |
| FastAPI | `response_model` 基类 |

**搜索关键词**：`BaseResponse`、`ApiResponse`、`ResponseDto`、`res.success`

**示例代码模式**：

```typescript
// Express
res.success = (data) => res.json({ code: 200, data, message: 'success' });

// NestJS
export class ResponseDto<T> {
  code: number;
  message: string;
  data: T;
}
```

---

#### 2. 错误码规范

**提取位置**：

- `constants/errors.ts`
- `enums/ErrorCode.ts`
- `exceptions/` 目录
- Error handler middleware

**搜索关键词**：`ErrorCode`、`StatusCode`、`ERROR_`、`HttpException`

**示例代码模式**：

```typescript
export enum ErrorCode {
  INVALID_PARAMS = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
}

// Error handler
app.use((err, req, res, next) => {
  res.status(err.httpCode).json({
    code: err.code,
    message: err.message
  });
});
```

---

#### 3. 认证方式

**提取位置**：

- Auth middleware (`passport`/`jwt`/`session`)
- `@UseGuards(JwtAuthGuard)` 装饰器
- `Authorization` header 解析逻辑

**检测依赖**：`jsonwebtoken`、`passport-jwt`、`express-session`

**搜索关键词**：`verifyToken`、`authenticate`、`Bearer`

**示例代码模式**：

```typescript
// JWT
const token = req.headers.authorization?.replace('Bearer ', '');
jwt.verify(token, SECRET);

// Session
app.use(session({ secret: '...', cookie: { maxAge: 86400000 } }));
```

---

#### 4. 分页规范

**提取位置**：

- `dto/pagination.dto.ts`
- `utils/paginate.ts`
- Query 参数解析逻辑

**搜索关键词**：`page`、`pageSize`、`limit`、`offset`、`PaginationDto`

**示例代码模式**：

```typescript
export class PaginationDto {
  page: number = 1;
  pageSize: number = 20;
}

export class PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

---

#### 5. 时间格式

**提取位置**：

- 序列化配置（`@JsonFormat`/`toJSON`）
- ORM 配置（TypeORM/Prisma）
- 全局 transformer

**检查方式**：分析 `Date` 字段的序列化格式

**常见格式**：

- ISO 8601: `2024-01-15T10:30:00Z`
- Unix timestamp: `1705315800`
- 自定义: `2024-01-15 10:30:00`

---

#### 6. 命名规范

**提取方法**：

1. 分析现有端点路径（`/user-profile` vs `/userProfile`）
2. 检查字段命名（`created_at` vs `createdAt`）
3. 统计主流模式（snake_case/camelCase/kebab-case）

---

### 输出模板结构

```markdown
# {项目名} API 接口规范

> **版本**：v1.0 | **更新时间**：{日期} | **提取自代码**

---

## 一、基础规范

### 1.1 统一响应格式

[从代码提取]

### 1.2 错误码规范

| code | 含义 | 常见原因 |
|------|------|----------|
| 200 | 成功 | — |
| 400 | 参数错误 | 缺少必填字段 |
| 401 | 未授权 | Token 无效 |

### 1.3 认证方式

[从 auth middleware 提取]

### 1.4 分页规范

[从 pagination 代码提取]

### 1.5 时间格式

[从序列化配置提取]

### 1.6 命名规范

[从现有代码推断]

---

## 二、接口示例

### 示例 1：用户登录

**端点**：POST /auth/login

**请求**：
```json
{ "email": "...", "password": "..." }
```

**响应**：
```json
{ "code": 200, "data": { "token": "..." } }
```

---

## 三、数据字典

### 用户角色（role）

| 值 | 说明 |
|----|------|
| admin | 管理员 |
| user | 普通用户 |

---

## 四、cURL 示例

```bash
# 登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'
```
```

---

### Serena 辅助

**如 P0 激活成功**：

- 使用 `serena:find_symbol` 定位 `ResponseDto`/`ErrorCode` 类型定义
- 使用 `serena:get_symbols_overview` 分析 middleware 结构
- 使用 `serena:search_for_pattern` 搜索 `@ApiResponse`/`@ApiProperty` 装饰器

**降级**：Serena 不可用时，基于正则匹配提取

---

### 成功标准

#### 最低要求

- ✅ 提取统一响应格式（至少包含 code/message/data 字段）
- ✅ 提取错误码规范（至少 5 个常见错误码）
- ✅ 识别认证方式（JWT/Session/OAuth）
- ✅ 提取分页格式（如有分页接口）

#### 完整要求

- ✅ 最低要求全部内容
- ✅ 至少 2 个完整接口示例（请求 + 响应）
- ✅ 数据字典（至少 1 个枚举类型）
- ✅ 可执行的 cURL 示例（至少 2 个）

---

### 降级策略

| 场景 | 降级方案 |
|------|----------|
| 无统一响应格式 | 标注 `[待确认]`，建议查看实际响应 |
| 无错误码定义 | 仅列出 HTTP status code |
| 无分页接口 | 跳过分页规范章节 |
| 无枚举类型 | 跳过数据字典章节 |

输出 → `docs/first/api-docs.md`

---

## Agent C1: 外部依赖与第三方服务（external-deps.md）

扫描代码和配置中的第三方服务与中间件引用：

| 类别 | 检测方式 |
|------|----------|
| 消息队列 | RabbitMQ/Kafka/RocketMQ 依赖或配置 |
| 缓存 | Redis/Memcached 连接配置 |
| 对象存储 | OSS/S3/MinIO SDK 引用 |
| 支付 | 支付宝/微信支付/Stripe SDK |
| 短信/邮件 | 短信网关、SMTP 配置 |
| 搜索引擎 | Elasticsearch/Solr 配置 |
| 注册中心/配置中心 | Nacos/Consul/Eureka/Apollo 配置 |
| 监控 | Prometheus/Grafana/Sentry SDK |

输出 → `docs/first/external-deps.md`（头部包含 `last_updated: {{DATE}}`）

---

## 质量保障规则（B / C1 通用）

- 通用证据格式、抽样流程、违规判定：见 `references/quality-assurance-rules.md`
- B/C1 的"必须标注证据内容"与"抽样规模"：见统一规则文档中的 Agent 矩阵
- B/C1 若出现无法验证项，必须显式标记 `[待确认]`
