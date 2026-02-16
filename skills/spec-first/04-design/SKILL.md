# Skill: design

## Trigger
- Stage: 02_design
- Command: `/spec-first:design`

## Phases
- P0: Locate Feature, verify stage is 02_design
- P1: Load FRs from matrix, constitution.md
- P2: Generate DS (Design Spec) entries mapped to FRs
- P3: Confirm design decisions with user
- P4: Write DS entries to matrix, create design documents
- P5: Run matrix check for FR→DS coverage

## CLI Dependencies
- `spec-first id next DS <abbr> --feature <featureId>`
- `spec-first matrix update`
- `spec-first metrics coverage`

## Output Paths
- `specs/{featureId}/traceability-matrix.md`
- `specs/{featureId}/design.md`

## confirm_policy
- Recommended: strict (design decisions are critical)

## Success Criteria
- `design.md` 已写入，包含模块划分、API 设计、数据模型
- 所有 DS 已通过 `id next DS` 注册
- `traceability-matrix.md` 已更新，每个 FR 有对应 DS 引用
- `metrics coverage` C1 (Design Coverage) > 0%

## Example (P2 Output Format)

```markdown
### DS-AUTH-001: 短信验证码发送服务

**映射**: FR-AUTH-001
**模块**: auth-service / otp-sender
**接口**: POST /api/auth/sms/send-otp
**数据模型**: otp_sessions (phone, code, expires_at, attempts)
**关键约束**: 单号 60s 冷却、单号日限 10 次、验证码 5min 过期
```
