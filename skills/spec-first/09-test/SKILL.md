---
name: "spec-first:test"
description: "定位 Feature 并校验阶段为验证测试（05_verify）"
---

# Skill: test

生成测试用例（TC），映射 FR 与 AC 确保覆盖率。

## 触发条件
- 阶段: 05_verify
- Command: `/spec-first:test`

## 执行阶段
- P0: 定位 Feature，校验阶段为 05_verify
- P1: 从矩阵加载 FR、AC 及已有 TC
- P2: 生成 TC（测试用例）条目，映射到 FR/AC
- P3: 与用户确认测试计划
- P4: 将 TC 写入矩阵，生成测试脚手架文件
- P5: 执行 metrics coverage 检查 C4/C5

## CLI 依赖
- `spec-first id next TC <abbr> --feature <featureId> --level <UT|IT|E2E|ST>`
- `spec-first matrix update`
- `spec-first metrics coverage`

## 输出路径
- `specs/{featureId}/traceability-matrix.md`
- `specs/{featureId}/tests/*.test.md`

## 确认策略
- 推荐: assisted

## 成功标准
- 所有 TC 已通过 `id next TC` 注册
- `traceability-matrix.md` 已更新，每个 FR 有对应 TC 引用
- `specs/{featureId}/tests/*.test.md` 测试文件已生成
- `metrics coverage` C4 (Test Coverage FR) 和 C5 (Test Coverage AC) > 0%

## 示例（P2 输出格式）

```markdown
### TC-IT-AUTH-001: 短信登录 Happy Path

**映射**: FR-AUTH-001 → AC-1, AC-2
**级别**: IT (Integration)
**前置条件**: 用户已注册手机号 13800138000
**步骤**:
1. POST /api/auth/sms/send-otp {phone: "13800138000"}
2. 从 otp_sessions 获取验证码
3. POST /api/auth/sms/login {phone: "13800138000", code: "<otp>"}
**预期**: 200 OK, 返回 JWT token
```
