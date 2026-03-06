# API 接口规范提取优化方案

## 目标

从项目代码中提取 **API 接口规范**（而非端点列表），生成类似"宪法"的规范文档。

---

## 一、提取内容对比

### 当前 Agent B 输出（仅端点列表）

```markdown
## API 接口

### 认证模块
- POST /auth/login - 用户登录
- GET /auth/me - 获取当前用户

### 用户模块
- GET /users - 获取用户列表
- POST /users - 创建用户
```

### 优化后输出（接口规范）

```markdown
# API 接口规范

## 一、基础规范

### 统一响应格式
```json
{
  "code": 200,
  "message": "success",
  "data": {},
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 错误码规范
| code | 含义 | 常见原因 |
|------|------|----------|
| 200 | 成功 | — |
| 400 | 参数错误 | 缺少必填字段 |
| 401 | 未授权 | Token 无效 |

### 认证方式
Bearer Token (JWT)，请求头：`Authorization: Bearer <token>`

### 分页规范
```json
{
  "list": [],
  "total": 100,
  "page": 1,
  "pageSize": 20
}
```

## 二、接口示例（可选）

### POST /auth/login
**请求**：
```json
{ "email": "...", "password": "..." }
```

**响应**：
```json
{ "code": 200, "data": { "token": "..." } }
```
```

---

## 二、提取策略

### 1. 统一响应格式

**提取位置**：
- Express/Koa: response middleware (`res.json` wrapper)
- NestJS: Interceptor (`@UseInterceptors(TransformInterceptor)`)
- Spring Boot: `@ControllerAdvice` + `ResponseBodyAdvice`
- Django/Flask: response decorator/middleware
- FastAPI: `response_model` 基类

**提取方法**：
1. 搜索 `response`/`result`/`wrapper` 关键词
2. 查找 `BaseResponse`/`ApiResponse` 类型定义
3. 分析 middleware 中的 `res.json()` 包装逻辑

**示例代码模式**：
```typescript
// Express
app.use((req, res, next) => {
  res.success = (data) => res.json({ code: 200, data, message: 'success' });
});

// NestJS
export class ResponseDto<T> {
  code: number;
  message: string;
  data: T;
}
```

---

### 2. 错误码规范

**提取位置**：
- `constants/errors.ts`
- `enums/ErrorCode.ts`
- `exceptions/` 目录
- Error handler middleware

**提取方法**：
1. 搜索 `ErrorCode`/`StatusCode`/`ERROR_` 常量
2. 查找 error handler 中的 code 映射
3. 提取 HTTP status code 与业务 code 的对应关系

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

### 3. 认证方式

**提取位置**：
- Auth middleware (`passport`/`jwt`/`session`)
- `@UseGuards(JwtAuthGuard)` 装饰器
- `Authorization` header 解析逻辑

**提取方法**：
1. 检测依赖：`jsonwebtoken`/`passport-jwt`/`express-session`
2. 查找 `verifyToken`/`authenticate` 函数
3. 分析 header 提取逻辑（`Bearer`/`Cookie`）

**示例代码模式**：
```typescript
// JWT
const token = req.headers.authorization?.replace('Bearer ', '');
jwt.verify(token, SECRET);

// Session
app.use(session({ secret: '...', cookie: { maxAge: 86400000 } }));
```

---

### 4. 分页规范

**提取位置**：
- `dto/pagination.dto.ts`
- `utils/paginate.ts`
- Query 参数解析逻辑

**提取方法**：
1. 搜索 `page`/`pageSize`/`limit`/`offset` 参数
2. 查找 `PaginationDto`/`PageResult` 类型
3. 分析返回格式（`list + total` vs `items + meta`）

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

### 5. 时间格式

**提取位置**：
- 序列化配置（`@JsonFormat`/`toJSON`）
- ORM 配置（TypeORM/Prisma）
- 全局 transformer

**提取方法**：
1. 检查 `Date` 字段的序列化格式
2. 查找 `dateFormat`/`timezone` 配置
3. 分析示例响应中的时间格式

**常见格式**：
- ISO 8601: `2024-01-15T10:30:00Z`
- Unix timestamp: `1705315800`
- 自定义: `2024-01-15 10:30:00`

---

### 6. 命名规范

**提取方法**：
1. 分析现有端点路径（`/user-profile` vs `/userProfile`）
2. 检查字段命名（`created_at` vs `createdAt`）
3. 统计主流模式（snake_case/camelCase/kebab-case）

---

## 三、输出模板结构

```markdown
# {项目名} API 接口规范

> **版本**：v1.0 | **更新时间**：{日期} | **提取自代码**

---

## 一、基础规范

### 1.1 统一响应格式
[从代码提取]

### 1.2 错误码规范
[从 error constants 提取]

### 1.3 认证方式
[从 auth middleware 提取]

### 1.4 分页规范
[从 pagination 代码提取]

### 1.5 时间格式
[从序列化配置提取]

### 1.6 命名规范
[从现有代码推断]

---

## 二、接口示例（可选，quick 模式跳过）

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

### 示例 2：获取列表（分页）
**端点**：GET /users?page=1&pageSize=20
**响应**：
```json
{
  "code": 200,
  "data": {
    "list": [...],
    "total": 100,
    "page": 1,
    "pageSize": 20
  }
}
```

---

## 三、数据字典（可选）

### 用户角色（role）
| 值 | 说明 |
|----|------|
| admin | 管理员 |
| user | 普通用户 |

### 状态（status）
| 值 | 说明 |
|----|------|
| 0 | 禁用 |
| 1 | 启用 |

---

## 四、cURL 调用示例（可选）

```bash
# 登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'

# 获取用户信息
curl http://localhost:3000/api/users/me \
  -H "Authorization: Bearer <token>"
```
```

---

## 四、Agent B 修改方案

### 修改 `agents-api-deps.md` § Agent B

**新增章节**：

#### 输出结构

```markdown
# {项目名} API 接口规范

## 一、基础规范
### 1.1 统一响应格式
[提取自 response middleware/interceptor]

### 1.2 错误码规范
[提取自 error constants/enums]

### 1.3 认证方式
[提取自 auth middleware]

### 1.4 分页规范
[提取自 pagination dto/utils]

### 1.5 时间格式
[提取自序列化配置]

### 1.6 命名规范
[从现有代码推断]

## 二、接口示例（deep 模式）
[选取 2-3 个典型端点，展示完整请求/响应]

## 三、数据字典（deep 模式）
[提取枚举类型定义]

## 四、cURL 示例（deep 模式）
[生成可执行的调用示例]
```

#### 提取优先级

| 模式 | 提取内容 |
|------|----------|
| **quick** | 基础规范（1.1-1.6） |
| **deep** | 基础规范 + 接口示例 + 数据字典 + cURL 示例 |

#### Serena 辅助增强

- 使用 `serena:find_symbol` 定位 `ResponseDto`/`ErrorCode` 类型定义
- 使用 `serena:get_symbols_overview` 分析 middleware 结构
- 使用 `serena:search_for_pattern` 搜索 `@ApiResponse`/`@ApiProperty` 装饰器

---

## 五、成功标准

### quick 模式
- ✅ 提取统一响应格式（至少包含 code/message/data 字段）
- ✅ 提取错误码规范（至少 5 个常见错误码）
- ✅ 识别认证方式（JWT/Session/OAuth）
- ✅ 提取分页格式（如有分页接口）

### deep 模式
- ✅ quick 模式全部内容
- ✅ 至少 2 个完整接口示例（请求 + 响应）
- ✅ 数据字典（至少 1 个枚举类型）
- ✅ 可执行的 cURL 示例（至少 2 个）

---

## 六、降级策略

| 场景 | 降级方案 |
|------|----------|
| 无统一响应格式 | 标注 `[待确认]`，建议查看实际响应 |
| 无错误码定义 | 仅列出 HTTP status code |
| 无分页接口 | 跳过分页规范章节 |
| 无枚举类型 | 跳过数据字典章节 |

---

## 七、实施步骤

1. ✅ 编写本优化方案文档
2. ⏸️ 修改 `agents-api-deps.md` § Agent B 规格
3. ⏸️ 更新 `quality-assurance-rules.md` 添加 API 规范验证规则
4. ⏸️ 测试 quick/deep 模式输出
5. ⏸️ 更新 SKILL.md changelog

---

**下一步**：确认方案后，修改 `agents-api-deps.md`。
