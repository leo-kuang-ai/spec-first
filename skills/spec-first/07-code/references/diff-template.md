# Diff Template Reference

代码变更预览模板，用于 P3 阶段的用户确认。

## Diff 预览标准格式

```markdown
## 代码变更预览 - TASK-ID

### 变更概要

| 字段 | 值 |
|------|-----|
| **TASK ID** | TASK-AUTH-002 |
| **任务标题** | 短信发送 API 实现 |
| **关联需求** | FR-AUTH-001 短信登录功能 |
| **关联设计** | DS-AUTH-001 短信发送 API 设计 |

---

### 文件变更清单

| 类型 | 文件路径 | 行数变化 | 关联 ID | 风险等级 |
|------|----------|----------|---------|----------|
| [新增/修改/删除] | `src/api/auth/sms/send-otp.ts` | +150 | FR-AUTH-001, DS-AUTH-001, TASK-AUTH-002 | [高/中/低] |
| [新增/修改/删除] | `src/services/sms.service.ts` | +80 | FR-AUTH-001, TASK-AUTH-002 | 中 |
| [新增/修改/删除] | `src/types/sms.types.ts` | +25 | DS-AUTH-001, TASK-AUTH-002 | 低 |

---

### 风险评估

#### 行为变更

| 文件 | 变更描述 | 影响范围 |
|------|----------|----------|
| `send-otp.ts` | 新增端点，不修改现有逻辑 | 无（新增端点） |
| `sms.service.ts` | 新增服务，不修改现有逻辑 | 无（新增服务） |

#### 兼容性

| 检查项 | 说明 | 状态 |
|--------|------|------|
| API 版本 | 新增端点，不破坏现有 API | ✅ 兼容 |
| 数据模型 | 新增表，不修改现有表 | ✅ 兼容 |
| 调用方 | 新功能，无现有调用方 | ✅ 无影响 |

#### 回滚方案

| 变更类型 | 回滚方式 | 回滚时间 |
|----------|----------|----------|
| 新增文件 | 删除新增文件 | < 1 分钟 |
| 数据库迁移 | 执行反向 migration | < 5 分钟 |

---

### 拟执行验证命令

```bash
# 1. Lint 检查
npm run lint

# 2. 类型检查
npm run typecheck

# 3. 单元测试
npm test

# 4. 覆盖率检查
npm run test:coverage

# 5. 构建验证
npm run build
```

---

### 代码摘要

#### 文件 1: `src/api/auth/sms/send-otp.ts`

```typescript
/**
 * POST /api/auth/sms/send-otp
 * 发送短信验证码
 *
 * @see FR-AUTH-001 短信登录功能
 * @see DS-AUTH-001 短信发送 API 设计
 */

import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { SmsService } from '@/services/sms.service';
import { logger } from '@/utils/logger';

const smsService = new SmsService();

export async function sendOtpHandler(req: Request, res: Response): Promise<void> {
  // 验证输入
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { phone } = req.body;

  try {
    // 生成并发送 OTP
    const otp = await smsService.sendOtp(phone);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      expiresAt: otp.expiresAt
    });
  } catch (error) {
    logger.error('Failed to send OTP', { error, phone });
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP'
    });
  }
}

// Related: FR-AUTH-001, DS-AUTH-001
// Task: TASK-AUTH-002
// Author: Claude Code (spec-first:code)
// Date: 2026-03-05
```

**关键说明**:
- 使用 express-validator 进行输入验证
- 错误日志包含手机号（生产环境需脱敏）
- 返回过期时间供前端展示倒计时

---

#### 文件 2: `src/services/sms.service.ts`

```typescript
/**
 * 短信服务
 * 负责生成和发送 OTP 验证码
 */

import { generateOTP, storeOTP, verifyOTP } from '@/utils/otp';
import { sendSMS } from '@/providers/sms-provider';
import { logger } from '@/utils/logger';

export class SmsService {
  /**
   * 发送 OTP 到指定手机号
   * @param phone - 手机号（E.164 格式）
   * @returns OTP 信息（不包含验证码本身）
   */
  async sendOtp(phone: string): Promise<{ expiresAt: Date }> {
    // 生成 6 位数字 OTP
    const code = generateOTP(6);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 分钟过期

    // 存储到 Redis
    await storeOTP(phone, code, expiresAt);

    // 发送短信
    await sendSMS(phone, `Your verification code is: ${code}`);

    logger.info('OTP sent', { phone, expiresAt });

    return { expiresAt };
  }

  /**
   * 验证 OTP
   * @param phone - 手机号
   * @param code - 验证码
   * @returns 验证是否成功
   */
  async verifyOtp(phone: string, code: string): Promise<boolean> {
    return verifyOTP(phone, code);
  }
}

// Related: FR-AUTH-001
// Task: TASK-AUTH-002
// Author: Claude Code (spec-first:code)
// Date: 2026-03-05
```

**关键说明**:
- OTP 长度 6 位，有效期 5 分钟
- 使用 Redis 存储，支持分布式部署
- 日志不包含实际 OTP 值

---

### 后续步骤

确认变更后，将执行以下操作：

1. 写入上述代码文件
2. 注入 traces trailer
3. 运行验证命令
4. 更新 task_plan.md 中 TASK 状态
5. 记录 findings.md
6. 如有新增测试，注册 TC 并更新矩阵

---

### 用户确认

请确认是否执行上述变更：
- [ ] 确认执行
- [ ] 需要修改
- [ ] 取消操作
```

## 简化格式（小改动）

```markdown
## 代码变更预览 - TASK-ID

### 变更摘要

**文件**: `src/utils/date.util.ts`
**变更**: 新增 `formatDateTime` 函数
**关联**: FR-AUTH-001, TASK-AUTH-002

### 代码差异

```typescript
+ /**
+  * 格式化日期时间
+  * @param date - 日期对象
+  * @param format - 格式字符串（默认：YYYY-MM-DD HH:mm:ss）
+  */
+ export function formatDateTime(
+   date: Date,
+   format: string = 'YYYY-MM-DD HH:mm:ss'
+ ): string {
+   // 实现...
+ }
```

### 风险评估
- 风险等级: 低（新增工具函数）
- 回滚方式: 删除函数（< 1 分钟）
```

## 删除操作格式

```markdown
## 代码变更预览 - TASK-ID

### 删除文件

**文件**: `src/deprecated/auth-legacy.service.ts`
**原因**: 已迁移到新的认证服务
**关联**: TASK-REFactor-001

### 影响分析

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 引用检查 | ✅ 已确认 | 无其他文件引用 |
| 测试覆盖 | ✅ 已移除 | 相关测试已删除 |
| 文档更新 | ✅ 已完成 | API 文档已更新 |

### 回滚方案
如需恢复，可从 git 历史获取：`git checkout <commit-hash> -- src/deprecated/auth-legacy.service.ts`
```

## 重构操作格式

```markdown
## 代码变更预览 - TASK-ID

### 重构摘要

**目标**: 提取通用验证逻辑到独立服务
**关联**: TASK-REFACTOR-001

### 变更清单

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `src/services/validation.service.ts` | 新增 | 通用验证服务 |
| `src/api/auth/login.ts` | 修改 | 使用新服务 |
| `src/api/auth/register.ts` | 修改 | 使用新服务 |

### 行为验证

| 场景 | 重构前 | 重构后 | 状态 |
|------|--------|--------|------|
| 正常登录 | 返回 token | 返回 token | ✅ 一致 |
| 密码过短 | 返回 400 | 返回 400 | ✅ 一致 |
| 邮箱格式错误 | 返回 400 | 返回 400 | ✅ 一致 |

### 测试覆盖
- [ ] 单元测试通过
- [ ] 集成测试通过
- [ ] 覆盖率无下降
```

## 数据库迁移格式

```markdown
## 代码变更预览 - TASK-ID

### 数据库迁移

**迁移文件**: `migrations/20260305_create_otp_table.sql`
**关联**: FR-AUTH-001, DS-AUTH-001, TASK-AUTH-002

### DDL 语句

```sql
CREATE TABLE otp_codes (
  id VARCHAR(36) PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(10) NOT NULL,
  expires_at DATETIME NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_phone_expires (phone, expires_at)
);
```

### 影响分析

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 表冲突 | ✅ 无 | 表名不存在 |
| 索引优化 | ✅ 已确认 | 复合索引支持查询和清理 |
| 权限要求 | ⚠️ 需要 CREATE TABLE 权限 | |

### 回滚方案

```sql
DROP TABLE IF EXISTS otp_codes;
```

### 数据保留策略
- 验证码过期后保留 24 小时（用于审计）
- 定时任务每日清理过期记录
```

## 配置文件变更格式

```markdown
## 代码变更预览 - TASK-ID

### 配置变更

**文件**: `.env.example`
**关联**: TASK-AUTH-002

### 变更内容

```diff
# SMS Provider Configuration
+ SMS_PROVIDER=twilio
+ SMS_ACCOUNT_SID=your_account_sid
+ SMS_AUTH_TOKEN=your_auth_token
+ SMS_FROM_NUMBER=+1234567890
```

### 影响分析

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 必填项 | ⚠️ 需要 | 新服务依赖 |
| 默认值 | ❌ 无 | 需用户配置 |
| 文档更新 | ✅ 已完成 | 部署文档已更新 |

### 验证步骤
1. 复制 `.env.example` 到 `.env`
2. 填写 SMS Provider 配置
3. 运行 `npm run config:verify` 验证配置
```
