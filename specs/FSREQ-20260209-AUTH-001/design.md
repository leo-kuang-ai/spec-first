---
featureId: FSREQ-20260209-AUTH-001
featAbbr: AUTH
title: 登录流程优化技术方案（短信 + 邮箱验证码登录）
stage: 02_design
mode: I
size: M
platforms: [h5, java-backend]
updatedAt: 2026-02-10
---

# 技术方案（Design）

## 1. 设计目标

1. 在现有认证体系上增量支持短信验证码登录和邮箱验证码登录。
2. 保持原密码登录链路不受影响。
3. 满足 NFR-SEC-001 / NFR-PERF-001 / NFR-OBS-001 / NFR-REL-001。

## 2. 方案总览

### 2.1 模块划分

1. H5 登录页模块
- 新增登录方式切换（密码 / 短信 / 邮箱）。
- 短信登录表单、发送按钮、倒计时状态。
- 邮箱登录表单、发送按钮、倒计时状态。

2. Auth API 模块（java-backend）
- 发送短信验证码接口。
- 短信验证码登录接口。
- 发送邮箱验证码接口。
- 邮箱验证码登录接口。

3. OTP 会话模块
- 保存 OTP 摘要、有效期、尝试次数、状态。

4. 风控模块
- 手机号/IP 双维频控。
- 邮箱/IP 双维频控。
- 异常请求拦截与审计日志。

### 2.2 逻辑流程

发送验证码：

1. 校验手机号格式。
2. 检查频控阈值。
3. 生成 OTP（随机码 + hash 存储）。
4. 写入 otp_sessions。
5. 调用短信通道发送。

验证码登录：

1. 校验手机号与 OTP 入参。
2. 查询有效 OTP 会话（未过期、未消费）。
3. 比对 hash，累计重试次数。
4. 成功则消费 OTP 并签发会话。
5. 失败则记录原因并返回统一错误码。

### 2.3 邮箱验证码流程

发送邮箱验证码：

1. 校验邮箱格式（RFC 5322 基础校验）。
2. 检查频控阈值（邮箱维度 + IP 维度）。
3. 生成 OTP（随机码 + hash 存储）。
4. 写入 otp_sessions（channel = email）。
5. 调用邮件通道发送。

邮箱验证码登录：

1. 校验邮箱与 OTP 入参。
2. 查询有效 OTP 会话（channel = email，未过期、未消费）。
3. 比对 hash，累计重试次数。
4. 成功则消费 OTP 并签发会话。
5. 失败则记录原因并返回统一错误码。

## 3. API 设计（contracts 对应）

### API-AUTH-001 发送验证码

- Method: POST
- Path: `/api/auth/sms/send-otp`
- Request:
  - phone: string
  - scene: string (default: login)
- Response:
  - code: 0
  - message: "ok"
  - data:
    - cooldownSeconds: number

错误码：

1. AUTH_OTP_RATE_LIMIT
2. AUTH_OTP_CHANNEL_UNAVAILABLE
3. AUTH_INVALID_PHONE

### API-AUTH-002 验证码登录

- Method: POST
- Path: `/api/auth/sms/login`
- Request:
  - phone: string
  - otp: string
- Response:
  - code: 0
  - message: "ok"
  - data:
    - accessToken: string
    - refreshToken: string

错误码：

1. AUTH_OTP_INVALID
2. AUTH_OTP_EXPIRED
3. AUTH_OTP_RETRY_EXCEEDED
4. AUTH_OTP_REPLAY_BLOCKED

### API-AUTH-003 发送邮箱验证码

- Method: POST
- Path: `/api/auth/email/send-otp`
- Request:
  - email: string
  - scene: string (default: login)
- Response:
  - code: 0
  - message: "ok"
  - data:
    - cooldownSeconds: number

错误码：

1. AUTH_OTP_RATE_LIMIT
2. AUTH_OTP_CHANNEL_UNAVAILABLE
3. AUTH_INVALID_EMAIL

### API-AUTH-004 邮箱验证码登录

- Method: POST
- Path: `/api/auth/email/login`
- Request:
  - email: string
  - otp: string
- Response:
  - code: 0
  - message: "ok"
  - data:
    - accessToken: string
    - refreshToken: string

错误码：

1. AUTH_OTP_INVALID
2. AUTH_OTP_EXPIRED
3. AUTH_OTP_RETRY_EXCEEDED
4. AUTH_OTP_REPLAY_BLOCKED

## 4. 数据设计

### 4.1 表结构：otp_sessions

1. id (PK)
2. channel (enum: sms/email, indexed)
3. phone (indexed, nullable)
4. email (indexed, nullable)
5. otp_hash
6. scene
7. expires_at
8. retry_count
9. max_retry
10. status (issued/verified/expired/locked)
11. created_at
12. updated_at

约束：phone 和 email 必须有且仅有一个非空（CHECK constraint）。
查询索引：(channel, phone, scene, status) 和 (channel, email, scene, status) 组合索引。

### 4.2 状态机

1. issued -> verified（登录成功）
2. issued -> expired（超时）
3. issued -> locked（重试超限）

## 5. 安全设计（NFR-SEC-001）

1. OTP 明文不落库，仅存 hash。
2. 比对失败次数达到阈值后锁定。
3. 登录成功立即将 OTP 状态置为 verified（一次性消费）。
4. 频控策略：
- phone: 60 秒内最多 1 次发送
- ip: 1 分钟内最多 5 次发送请求

## 6. 性能与容量

1. 发送验证码接口采用异步发送，主流程快速返回。
2. OTP 查询走 `(phone, scene, status)` 组合索引。
3. 预计峰值：200 QPS（登录高峰）。

## 7. 可观测性

### 7.1 日志

1. auth.sms.send.request
2. auth.sms.send.result
3. auth.sms.login.result
4. auth.sms.risk.blocked
5. auth.email.send.request
6. auth.email.send.result
7. auth.email.login.result
8. auth.email.risk.blocked

### 7.2 指标

1. sms_send_success_rate
2. sms_login_success_rate
3. otp_expired_rate
4. otp_risk_block_count
5. email_send_success_rate
6. email_login_success_rate

### 7.3 告警

1. 发送失败率 > 5%（5 分钟窗口）
2. 风控拦截突增（较基线 > 3x）

## 8. 发布与回滚

1. 灰度发布：按用户分组 10% -> 50% -> 100%。
2. 回滚策略：
- 前端隐藏短信登录入口开关。
- 前端隐藏邮箱登录入口开关。
- 后端关闭短信发送与登录接口路由开关。
- 后端关闭邮箱发送与登录接口路由开关。
3. 回滚后密码登录链路保持可用。

## 9. 设计与需求追踪映射

1. DS-AUTH-001（登录页切换与交互） -> FR-AUTH-001, FR-AUTH-002
2. DS-AUTH-002（发送验证码接口） -> FR-AUTH-002, NFR-SEC-001, NFR-PERF-001
3. DS-AUTH-003（验证码登录接口） -> FR-AUTH-002, NFR-SEC-001, NFR-REL-001
4. DS-AUTH-004（风控与监控） -> NFR-SEC-001, NFR-OBS-001
5. DS-AUTH-005（发送邮箱验证码接口） -> FR-AUTH-003, NFR-SEC-001, NFR-PERF-001
6. DS-AUTH-006（邮箱验证码登录接口） -> FR-AUTH-003, NFR-SEC-001, NFR-REL-001
