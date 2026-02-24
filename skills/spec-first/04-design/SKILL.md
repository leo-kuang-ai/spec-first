---
name: "spec-first:design"
description: "定位 Feature 并校验阶段为技术设计（02_design）"
---

# Skill: design

生成技术设计方案，将 FR 映射为 DS 设计规格。

## 触发条件
- 阶段: 02_design
- Command: `/spec-first:design`

## 执行阶段
- P0: 定位 Feature，校验阶段为 02_design
- P1: 从矩阵加载 FR，读取 constitution.md
- P2: 生成 DS（设计规格）条目，映射到 FR
- P3: 与用户确认设计决策
- P4: 将 DS 写入矩阵，创建设计文档
- P5: 执行 metrics coverage 检查 FR→DS 覆盖率，执行 matrix check 检测 orphan 项

## CLI 依赖
- `spec-first id next DS <abbr> --feature <featureId>`
- `spec-first matrix update`
- `spec-first matrix check`
- `spec-first metrics coverage`

## 输出路径
- `specs/{featureId}/traceability-matrix.md`
- `specs/{featureId}/design.md`
- `specs/{featureId}/contracts/*.yaml`（按需）

## 确认策略
- 推荐: strict（设计决策属高风险操作）

## 成功标准
- `design.md` 已写入，包含模块划分、API 设计、数据模型
- 所有 DS 已通过 `id next DS` 注册
- `traceability-matrix.md` 已更新，每个 FR 有对应 DS 引用
- `metrics coverage` C1 (Design Coverage) > 0%

## 示例（P2 输出格式）

```markdown
### DS-AUTH-001: 短信验证码发送服务

**映射**: FR-AUTH-001
**模块**: auth-service / otp-sender
**接口**: POST /api/auth/sms/send-otp
**数据模型**: otp_sessions (phone, code, expires_at, attempts)
**关键约束**: 单号 60s 冷却、单号日限 10 次、验证码 5min 过期
```
