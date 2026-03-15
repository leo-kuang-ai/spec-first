# DS 输出格式

> Design Skill 的 DS（设计规格）输出格式与示例

---

## 标准格式

```markdown
### DS-{ABBR}-{SEQ}: {设计规格标题}

**映射**: FR-{ABBR}-{SEQ}
**模块**: {模块名称}
**接口**: {API 定义}
**数据模型**: {数据表/实体}
**关键约束**: {业务约束}
```

---

## 字段说明

### DS ID

**格式**: `DS-{ABBR}-{SEQ}`

**示例**:
- `DS-AUTH-001`
- `DS-REPORT-002`

**生成方式**: `spec-first id next DS <abbr> --feature <featureId>`

---

### 映射

**说明**: 关联的功能需求 ID

**格式**: `FR-{ABBR}-{SEQ}`

**示例**: `FR-AUTH-001`

**规则**: 每个 DS 必须映射至少 1 个 FR

---

### 模块

**说明**: 设计规格所属的系统模块

**格式**: `{服务名} / {子模块}`

**示例**:
- `auth-service / otp-sender`
- `user-service / profile-manager`
- `order-service / payment-gateway`

---

### 接口

**说明**: API 端点定义

**格式**: `{METHOD} {PATH}`

**示例**:
- `POST /api/auth/sms/send-otp`
- `GET /api/users/{userId}/profile`
- `PUT /api/orders/{orderId}/status`

**完整示例**:
```
POST /api/auth/login
Request: { phone: string, code: string }
Response: { token: string, userId: string, expiresAt: number }
```

---

### 数据模型

**说明**: 核心数据表或实体

**格式**: `{表名} ({字段列表})`

**示例**:
- `otp_sessions (phone, code, expires_at, attempts)`
- `users (id, phone, nickname, avatar, created_at)`
- `orders (id, user_id, amount, status, created_at)`

---

### 关键约束

**说明**: 业务规则与技术约束

**示例**:
- 单号 60s 冷却、单号日限 10 次、验证码 5min 过期
- 用户昵称长度 2-20 字符、不可包含特殊字符
- 订单支付超时 30min 自动取消

---

## 完整示例

### 示例 1: 短信验证码

```markdown
### DS-AUTH-001: 短信验证码发送服务

**映射**: FR-AUTH-001
**模块**: auth-service / otp-sender
**接口**: POST /api/auth/sms/send-otp
**数据模型**: otp_sessions (phone, code, expires_at, attempts)
**关键约束**: 单号 60s 冷却、单号日限 10 次、验证码 5min 过期
```

---

### 示例 2: 用户登录

```markdown
### DS-AUTH-002: 用户登录验证

**映射**: FR-AUTH-002
**模块**: auth-service / login-handler
**接口**: POST /api/auth/login
**数据模型**: sessions (id, user_id, token, expires_at)
**关键约束**: token 有效期 7 天、单用户最多 5 个活跃会话
```

---

### 示例 3: 订单创建

```markdown
### DS-ORDER-001: 订单创建流程

**映射**: FR-ORDER-001, FR-ORDER-002
**模块**: order-service / order-creator
**接口**: POST /api/orders
**数据模型**: orders (id, user_id, items, amount, status, created_at)
**关键约束**: 库存预占 + 支付超时 30min 自动取消
```

---

## 多 FR 映射

**场景**: 一个 DS 实现多个 FR

**格式**: `**映射**: FR-{ABBR}-{SEQ1}, FR-{ABBR}-{SEQ2}`

**示例**:
```markdown
### DS-REPORT-001: 报表生成引擎

**映射**: FR-REPORT-001, FR-REPORT-002, FR-REPORT-003
**模块**: report-service / generator
**接口**: POST /api/reports/generate
**数据模型**: reports (id, type, params, status, result_url)
**关键约束**: 异步生成、结果保留 7 天、单用户并发限制 3 个
```

---

## 接口契约详细格式

### RESTful API

```markdown
**接口**:
- Endpoint: POST /api/auth/login
- Request:
  ```json
  {
    "phone": "string (11位手机号)",
    "code": "string (6位数字)"
  }
  ```
- Response (200):
  ```json
  {
    "token": "string (JWT)",
    "userId": "string (UUID)",
    "expiresAt": "number (Unix timestamp)"
  }
  ```
- Error (400):
  ```json
  {
    "error": "INVALID_CODE",
    "message": "验证码错误或已过期"
  }
  ```
```

---

### RPC/gRPC

```markdown
**接口**:
- Service: AuthService
- Method: Login
- Request: LoginRequest { phone: string, code: string }
- Response: LoginResponse { token: string, user_id: string, expires_at: int64 }
```

---

## 数据模型详细格式

### 关系型数据库

```markdown
**数据模型**:
```sql
CREATE TABLE otp_sessions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  phone VARCHAR(11) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  attempts INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_phone_expires (phone, expires_at)
);
```
```

---

### NoSQL

```markdown
**数据模型**:
- Collection: sessions
- Schema:
  ```json
  {
    "_id": "ObjectId",
    "userId": "string",
    "token": "string",
    "expiresAt": "Date",
    "createdAt": "Date"
  }
  ```
- Index: { userId: 1, expiresAt: 1 }
```

---

## 输出位置

**主文档**: `specs/{featureId}/design.md`

**契约文件**（可选）: `specs/{featureId}/contracts/*.yaml`

**示例**:
```
specs/FSREQ-20260305-AUTH-001/
├── design.md
└── contracts/
    ├── auth-api.yaml
    └── user-api.yaml
```
