# Gate 豁免机制全链路审查

## 修复总结

### 已修复的卡点

1. **Gate 评估器** (`gate-evaluator.ts:94-98`)
   - ❌ 问题：`G-SPEC-00` 不返回 `scopeFrIds`
   - ✅ 修复：添加 `scopeFrIds: frIds`

2. **Gate 评估器** (`gate-evaluator.ts:121-123`)
   - ❌ 问题：`G-SPEC-03` 不返回 `scopeFrIds`
   - ✅ 修复：添加 `scopeFrIds: frIds`

3. **Stage Advance** (`advance.ts:136-150`)
   - ❌ 问题：只检查 `FAIL`，`PASS_WITH_WAIVER` 未记录
   - ✅ 修复：添加 waiver 记录到 findings

## 全链路节点

### 1. 豁免定义 (用户输入)
- 文件：`specs/{featureId}/known-exceptions.md`
- 格式：Markdown 表格（8列）
- 必需字段：ID, RFC ID, FR ID, Reason, Expires At, Rollback Point, Approved By, Approved At

### 2. RFC 状态 (用户输入)
- 文件：`specs/{featureId}/rfc/RFC-XXX.rfc.json`
- 必需字段：`{ id, status: "approved" }`
- 格式：RFC ID 必须是 `RFC-XXX`（3位数字）

### 3. Exception 验证 (`exception-validator.ts:15-39`)
- ✅ 读取 `known-exceptions.md`
- ✅ 验证 RFC 状态为 `approved`
- ✅ 验证 `expiresAt` 未过期
- ✅ 验证 `rollbackPoint` 存在
- 输出：`{ valid: [], invalid: [] }`

### 4. Gate 评估 (`gate-evaluator.ts:345-456`)
- ✅ 执行所有条件检查
- ✅ 条件返回 `scopeFrIds`（已修复）
- ✅ 匹配 exception 的 `frId` 与条件的 `scopeFrIds`
- ✅ 将匹配的条件状态改为 `WAIVER`
- ✅ 返回 `PASS_WITH_WAIVER` 状态
- 输出：`GateResult { status, conditions, waivers }`

### 5. Stage Advance (`advance.ts:136-150`)
- ✅ 调用 `evaluateGate`
- ✅ 接受 `PASS_WITH_WAIVER` 状态（已修复）
- ✅ 记录 waiver 到 findings（已修复）
- ✅ 允许阶段推进

## 测试覆盖

- ✅ `G-SPEC-00` 返回 `scopeFrIds`
- ✅ Exception 验证通过
- ✅ Gate 返回 `PASS_WITH_WAIVER`
- ✅ 所有测试通过（3/3）

## 使用示例

```bash
# 1. 创建 RFC
cat > specs/FEATURE-001/rfc/RFC-001.rfc.json << 'EOF'
{
  "id": "RFC-001",
  "status": "approved",
  "title": "C-PRD Waiver"
}
EOF

# 2. 创建 Exception
cat > specs/FEATURE-001/known-exceptions.md << 'EOF'
| ID | RFC ID | FR ID | Reason | Expires At | Rollback Point | Approved By | Approved At |
|----|--------|-------|--------|------------|----------------|-------------|-------------|
| EXC-001 | RFC-001 | FR-XXX-001 | C-PRD=70% but C10=87.9% | 2026-04-12 | 01_specify | Leo | 2026-03-12 |
EOF

# 3. 验证 Gate
spec-first gate check FEATURE-001
# 输出：PASS_WITH_WAIVER

# 4. 推进阶段
spec-first stage advance FEATURE-001 --yes
# 成功推进，findings 记录 waiver
```

## 注意事项

1. RFC ID 格式必须是 `RFC-XXX`（3位数字）
2. RFC 状态必须是 `approved`
3. Exception 的 `expiresAt` 不能过期
4. Exception 的 `frId` 必须匹配条件的 `scopeFrIds`
5. 豁免记录会写入 `findings.md` 和 `gate-history.jsonl`
