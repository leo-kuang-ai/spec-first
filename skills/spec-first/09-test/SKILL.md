# Skill: test

## Trigger
- Stage: 05_verify
- Command: `/spec-first:test`

## Phases
- P0: Locate Feature, verify stage is 05_verify
- P1: Load FRs, ACs, existing TCs from matrix
- P2: Generate TC (Test Case) entries mapped to FRs/ACs
- P3: Confirm test plan with user
- P4: Write TCs to matrix, generate test scaffolds
- P5: Run metrics coverage to check C4/C5

## CLI Dependencies
- `spec-first id next TC <abbr> --feature <featureId>`
- `spec-first matrix update`
- `spec-first metrics coverage`

## Output Paths
- `specs/{featureId}/traceability-matrix.md`
- `specs/{featureId}/tests/*.test.md`

## confirm_policy
- Recommended: assisted

## Success Criteria
- 所有 TC 已通过 `id next TC` 注册
- `traceability-matrix.md` 已更新，每个 FR 有对应 TC 引用
- `specs/{featureId}/tests/*.test.md` 测试文件已生成
- `metrics coverage` C4 (Test Coverage FR) 和 C5 (Test Coverage AC) > 0%

## Example (P2 Output Format)

```markdown
### TC-L2-AUTH-001: 短信登录 Happy Path

**映射**: FR-AUTH-001 → AC-1, AC-2
**级别**: L2 (Integration)
**前置条件**: 用户已注册手机号 13800138000
**步骤**:
1. POST /api/auth/sms/send-otp {phone: "13800138000"}
2. 从 otp_sessions 获取验证码
3. POST /api/auth/sms/login {phone: "13800138000", code: "<otp>"}
**预期**: 200 OK, 返回 JWT token
```
