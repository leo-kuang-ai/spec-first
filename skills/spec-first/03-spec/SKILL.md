# Skill: spec

## Trigger
- Stage: 01_specify
- Command: `/spec-first:spec`

## Phases
- P0: Locate Feature, verify stage is 01_specify
- P1: Load constitution.md, existing FRs from matrix
- P2: Generate FR definitions with ID, title, acceptance criteria
- P3: Confirm FR list with user (allow revision)
- P4: Write FRs to traceability-matrix.md, update spec documents
- P5: Run matrix check for orphan detection

## CLI Dependencies
- `spec-first id next FR <abbr> --feature <featureId>`
- `spec-first matrix update`
- `spec-first matrix check`

## Output Paths
- `specs/{featureId}/traceability-matrix.md`
- `specs/{featureId}/spec.md`

## confirm_policy
- Recommended: strict (Mode N) / assisted (Mode I, Size M+)

## Success Criteria
- `spec.md` 已写入，包含所有 FR 定义和验收标准（AC）
- 所有 FR 已通过 `id next FR` 注册
- `traceability-matrix.md` 已更新，每个 FR 有对应行
- `matrix check` 无 orphan 项

## Example (P2 Output Format)

```markdown
### FR-AUTH-001: 短信验证码登录

**描述**: 用户通过手机号 + 短信验证码完成登录

**验收标准**:
- AC-1: 输入合法手机号后点击发送，60s 内收到 6 位数字验证码
- AC-2: 输入正确验证码后 3s 内完成登录并跳转首页
- AC-3: 验证码错误时显示"验证码错误，请重新输入"
```
