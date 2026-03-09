# Verify Report Template

verify 报告标准格式，确保输出一致性。

## 报告结构

```markdown
# Verify Report: {FeatureId}

## 执行摘要

| 字段 | 值 |
|------|-----|
| **Feature** | {FeatureId} |
| **阶段** | {CurrentStage} |
| **Gate 状态** | PASS / PASS_WITH_WAIVER / FAIL |
| **退出码** | {ExitCode} |
| **执行时间** | {Timestamp} |

## Gate 条件检查

### PASS 条件

- [G-XXX-01] {条件描述} ✅

### WAIVER 条件（如有）

- [G-XXX-02] {条件描述} ⚠️ WAIVER
  - 豁免理由: {Reason}
  - 批准人: {Approver}
  - 有效期: {Expiry}

### FAIL 条件（如有）

- [G-XXX-03] {条件描述} ❌
  - 失败原因: {Reason}
  - 影响: {Impact}
  - 修复建议: {Suggestion}

## 覆盖率指标

| 指标 | 当前值 | 阈值 | 状态 |
|------|--------|------|------|
| C1 (Spec Coverage) | {value}% | {threshold}% | ✅/❌ |
| C2 (API Coverage) | {value}% | {threshold}% | ✅/❌ |
| C3 (Task Coverage) | {value}% | {threshold}% | ✅/❌ |
| C4 (Test Coverage FR) | {value}% | {threshold}% | ✅/❌ |
| C5 (Test Coverage AC) | {value}% | {threshold}% | ✅/❌ |
| C6 (Implementation Coverage) | {value}% | {threshold}% | ✅/❌ |
| C7 (PR Compliance) | {value}% | {threshold}% | ✅/❌ |
| C8 (Task Compliance) | {value}% | {threshold}% | ✅/❌ |
| C9 (TC Compliance) | {value}% | {threshold}% | ✅/❌ |

## 失败条目详情

### {FAIL_ID}: {失败描述}

**关联 ID**: {FR/DS/TASK/TC ID}
**当前状态**: {Status}
**修复建议**:
1. {Step 1}
2. {Step 2}
3. {Step 3}

## 建议下一步

{基于 Gate 结果的建议}

## verify-view 字段映射

- `recommended_checks`: 来自 verify-view 的建议补充检查
- `critical_flows`: 来自 verify-view 的关键链路
- `validation_focus`: 来自 verify-view 的验证重点
- `validation_hooks`: 来自 verify-view 的验证钩子建议
- `release_blockers`: 来自 verify-view 的发布阻断项

## 执行证据

### 命令输出

\`\`\`bash
$ spec-first gate check {featureId}
Gate 检查 — {featureId} ({stage})

结果：{status}

{条件输出}
\`\`\`

### 退出码

{ExitCode}: {说明}
```

## 报告示例

### PASS 示例

```markdown
# Verify Report: FSREQ-20260209-AUTH-001

## 执行摘要

| 字段 | 值 |
|------|-----|
| **Feature** | FSREQ-20260209-AUTH-001 |
| **阶段** | 01_specify |
| **Gate 状态** | PASS |
| **退出码** | 0 |
| **执行时间** | 2026-03-05T10:30:00Z |

## Gate 条件检查

### PASS 条件

- [G-SPEC-01] spec.md exists ✅
- [G-SPEC-02] FR/NFR IDs assigned ✅ (FR count: 3)
- [G-SPEC-03] Spec quality score (C10) ✅ (C10=85%)

## 覆盖率指标

| 指标 | 当前值 | 阈值 | 状态 |
|------|--------|------|------|
| C1 (Spec Coverage) | 100% | >0% | ✅ |
| C10 (Spec Quality) | 85% | ≥80% | ✅ |

## 建议下一步

Gate 已通过，可以推进到下一阶段。
建议执行: `spec-first stage advance`
```

### FAIL 示例

```markdown
# Verify Report: FSREQ-20260209-AUTH-001

## 执行摘要

| 字段 | 值 |
|------|-----|
| **Feature** | FSREQ-20260209-AUTH-001 |
| **阶段** | 02_design |
| **Gate 状态** | FAIL |
| **退出码** | 1 |
| **执行时间** | 2026-03-05T10:30:00Z |

## Gate 条件检查

### FAIL 条件

- [G-DESIGN-02] API coverage (C2) ❌
  - 失败原因: C2=66.7%, uncovered FR: FR-AUTH-003
  - 影响: 部分 FR 缺少设计规格
  - 修复建议: 为 FR-AUTH-003 补充 DS

## 覆盖率指标

| 指标 | 当前值 | 阈值 | 状态 |
|------|--------|------|------|
| C1 (Spec Coverage) | 100% | >0% | ✅ |
| C2 (API Coverage) | 66.7% | 100% | ❌ |
| C11 (Constitution Compliance) | 100% | 100% | ✅ |

## 失败条目详情

### FR-AUTH-003: 密码重置功能

**关联 ID**: FR-AUTH-003
**当前状态**: 缺少 DS
**修复建议**:
1. 运行 `/spec-first:design --focus FR-AUTH-003`
2. 补充 API 设计（POST /api/auth/password/reset）
3. 补充数据模型（password_reset_tokens 表）
4. 重新运行 verify

## 建议下一步

修复失败条件后重新执行 verify。
```

### PASS_WITH_WAIVER 示例

```markdown
# Verify Report: FSREQ-20260209-AUTH-001

## 执行摘要

| 字段 | 值 |
|------|-----|
| **Feature** | FSREQ-20260209-AUTH-001 |
| **阶段** | 01_specify |
| **Gate 状态** | PASS_WITH_WAIVER |
| **退出码** | 0 |
| **执行时间** | 2026-03-05T10:30:00Z |

## Gate 条件检查

### PASS 条件

- [G-SPEC-01] spec.md exists ✅
- [G-SPEC-02] FR/NFR IDs assigned ✅ (FR count: 3)

### WAIVER 条件

- [G-SPEC-03] Spec quality score (C10) ⚠️ WAIVER
  - 豁免理由: C10=75%, 分阶段提升，第一阶段先完成核心功能
  - 批准人: Tech Lead
  - 有效期: 2026-03-31

## 覆盖率指标

| 指标 | 当前值 | 阈值 | 状态 |
|------|--------|------|------|
| C1 (Spec Coverage) | 100% | >0% | ✅ |
| C10 (Spec Quality) | 75% | ≥80% | ⚠️ WAIVER |

## WAIVER 记录

| 条件 ID | 豁免理由 | 批准人 | 有效期 | 状态 |
|---------|----------|--------|--------|------|
| G-SPEC-03 | 分阶段提升 | Tech Lead | 2026-03-31 | ACTIVE |

## 建议下一步

有条件通过，记录 WAIVER 到 findings.md。
建议执行: `spec-first stage advance`
注意: C10 需在 2026-03-31 前提升到 80%
```

## 报告生成规则

1. **必须包含执行摘要** — Feature、阶段、状态、退出码
2. **必须列出所有 Gate 条件** — PASS/WAIVER/FAIL
3. **必须包含覆盖率指标表** — C1-C9 当前值、阈值、状态
4. **FAIL 时必须包含失败详情** — 关联 ID、修复建议
5. **WAIVER 时必须包含豁免记录** — 理由、批准人、有效期
6. **必须包含执行证据** — 命令输出、退出码
7. **必须包含建议下一步** — 基于结果的可执行建议

## 背景输入字段
- verify-view
- critical_flows
- validation_focus
- recommended_checks
- validation_hooks
- release_blockers
- background_input_status
