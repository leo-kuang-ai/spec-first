# Agent 上下文同步规则

> Design Skill 的宿主上下文自动同步机制

---

## 同步时机

**触发条件**: design 结束并推进阶段后

**目标文件**:
- `CLAUDE.md` - Claude Code 项目指令
- `AGENTS.md` - 多 Agent 协作配置

---

## 托管区块规则

### 自动托管区块

**标记**: `<!-- SPEC-FIRST:BEGIN AUTO-CONTEXT -->` ... `<!-- SPEC-FIRST:END AUTO-CONTEXT -->`

**特性**: 可覆盖更新

**内容**: 自动生成的上下文快照

**示例**:
```markdown
<!-- SPEC-FIRST:BEGIN AUTO-CONTEXT -->
> Auto-synced at 2026-03-05T06:00:00.000Z

## Spec-First Context Snapshot
- Feature: FSREQ-20260305-AUTH-001
- Stage: 02_design
- Design: specs/FSREQ-20260305-AUTH-001/design.md

### Design Highlights
- 模块: auth-service, user-service
- 接口: POST /api/auth/login, GET /api/users/profile
- 数据模型: users, sessions, otp_sessions
<!-- SPEC-FIRST:END AUTO-CONTEXT -->
```

---

### 手工区块

**标记**: `<!-- SPEC-FIRST:BEGIN MANUAL -->` ... `<!-- SPEC-FIRST:END MANUAL -->`

**特性**: 不可覆盖

**内容**: 用户手动补充的上下文

**示例**:
```markdown
<!-- SPEC-FIRST:BEGIN MANUAL -->
## 项目特殊约定

- 所有 API 必须支持幂等性
- 敏感数据必须加密存储
- 日志不得包含用户手机号
<!-- SPEC-FIRST:END MANUAL -->
```

---

## 同步内容

### Feature 基本信息

```markdown
- Feature: {featureId}
- Stage: {currentStage}
- Design: specs/{featureId}/design.md
```

---

### Design Highlights

**提取规则**: 从 design.md 中提取关键信息

**内容**:
- 模块列表
- 核心接口
- 数据模型
- 关键约束

**示例**:
```markdown
### Design Highlights
- 模块: auth-service / otp-sender, auth-service / login-handler
- 接口: POST /api/auth/sms/send-otp, POST /api/auth/login
- 数据模型: otp_sessions (phone, code, expires_at), sessions (id, user_id, token)
- 关键约束: 单号 60s 冷却、token 有效期 7 天
```

---

## 同步失败处理

### 记录到 findings.md

**格式**:
```markdown
## 2026-03-05 上下文同步失败

**类型**: WARNING
**原因**: CLAUDE.md 不存在或无写权限
**影响**: Agent 无法自动加载最新设计上下文
**建议**: 手动创建 CLAUDE.md 或检查文件权限
```

---

### 不得静默失败

**规则**: 同步失败必须明确告知用户

**错误消息**:
```
⚠️  上下文同步失败

目标文件: CLAUDE.md
原因: 文件不存在

💡 建议:
1. 创建 CLAUDE.md 文件
2. 或跳过同步（手动管理上下文）
```

---

## 完整同步示例

### CLAUDE.md 托管区块

```markdown
# CLAUDE.md

项目指令文档...

<!-- SPEC-FIRST:BEGIN MANUAL -->
## 项目特殊约定

- 所有 API 必须支持幂等性
<!-- SPEC-FIRST:END MANUAL -->

<!-- SPEC-FIRST:BEGIN AUTO-CONTEXT -->
> Auto-synced at 2026-03-05T06:00:00.000Z

## Spec-First Context Snapshot
- Feature: FSREQ-20260305-AUTH-001
- Stage: 02_design
- Design: specs/FSREQ-20260305-AUTH-001/design.md

### Design Highlights
- 模块: auth-service / otp-sender, auth-service / login-handler
- 接口: POST /api/auth/sms/send-otp, POST /api/auth/login
- 数据模型: otp_sessions, sessions
- 关键约束: 单号 60s 冷却、token 有效期 7 天
<!-- SPEC-FIRST:END AUTO-CONTEXT -->
```

---

### AGENTS.md 托管区块

```markdown
# AGENTS.md

多 Agent 协作配置...

<!-- SPEC-FIRST:BEGIN AUTO-CONTEXT -->
> Auto-synced at 2026-03-05T06:00:00.000Z

## Current Feature Context
- Feature: FSREQ-20260305-AUTH-001
- Stage: 02_design
- Design Doc: specs/FSREQ-20260305-AUTH-001/design.md

## Design Summary
- auth-service: 认证服务（登录、验证码）
- user-service: 用户管理（资料、权限）
<!-- SPEC-FIRST:END AUTO-CONTEXT -->
```

---

## 同步命令

**手动触发**: `spec-first sync context`

**自动触发**: design 阶段完成后

---

## 文件系统即外部记忆

**规则**: 每连续 2 个关键动作后，必须更新 `findings.md`

**关键动作**:
- 设计决策
- 接口定义
- 回滚策略确认

**最小落盘字段**:
- 当前结论
- 证据路径（`design.md` / 契约文件位置）
- 下一步动作

**示例**:
```markdown
## 2026-03-05 设计决策

**决策**: 采用微服务架构，拆分为 auth-service 和 user-service
**证据**: design.md § 1.1 架构概览
**下一步**: 定义服务间接口契约
```

---

## 中断恢复

**中断前必须落盘**:
- 当前设计决策
- 未决问题
- 下一步命令

**恢复时读取**:
- `findings.md` 最新记录
- `design.md` 当前状态
- `traceability-matrix.md` 已注册 DS

**示例**:
```markdown
## 2026-03-05 中断前状态

**已完成**: DS-AUTH-001, DS-AUTH-002 已定义
**未决问题**: 用户服务与订单服务是否需要拆分？
**下一步**: 运行 spec-first matrix update 更新追溯矩阵
```
