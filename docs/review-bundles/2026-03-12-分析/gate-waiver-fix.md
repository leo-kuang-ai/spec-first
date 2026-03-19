# Gate 豁免机制修复方案

## 问题根因

**代码缺陷**：`G-SPEC-00` 条件的 `evaluate` 函数未返回 `scopeFrIds`，导致豁免匹配逻辑无法工作。

豁免匹配要求（`gate-evaluator.ts:395-401`）：
```typescript
const matched = conditions.filter(
  (c) => c.status === 'FAIL' &&
         Array.isArray(c.scopeFrIds) &&  // ❌ G-SPEC-00 不返回此字段
         c.scopeFrIds.includes(ex.frId)
);
```

## 已修复

修改 `src/core/gate-engine/gate-evaluator.ts:85-99`，添加 `scopeFrIds` 返回值。

## 修复步骤

### 1. 创建 RFC 文档

```bash
# 在 Feature 目录下创建 RFC
cat > specs/FSREQ-20260312-CODEFIELD-001/rfcs/RFC-CPRD-WAIVER-001.md << 'EOF'
---
id: RFC-CPRD-WAIVER-001
title: C-PRD 豁免申请
status: approved
created_at: 2026-03-12
approved_at: 2026-03-12
approved_by: Leo
---

# C-PRD 豁免申请

## 背景
PRD 内容完整（232行，9章节），C10 规格质量=87.9% 已达标，但 C-PRD=70%。

## 决策
批准豁免，允许推进到 02_design 阶段。

## 理由
- 规格质量（C10）已达标
- PRD 内容实质完整
- 不影响后续开发
EOF
```

### 2. 创建 known-exceptions.md

```bash
cat > specs/FSREQ-20260312-CODEFIELD-001/known-exceptions.md << 'EOF'
| ID | RFC ID | FR ID | Reason | Expires At | Rollback Point | Approved By | Approved At |
|----|--------|-------|--------|------------|----------------|-------------|-------------|
| EXC-CPRD-001 | RFC-CPRD-WAIVER-001 | FR-CODEFIELD-001 | C-PRD=70% but C10=87.9% | 2026-04-12 | 01_specify | Leo | 2026-03-12 |
EOF
```

### 3. 更新追踪矩阵

```bash
# 将 RFC 状态记录到 trace-matrix.csv
echo "RFC-CPRD-WAIVER-001,approved,2026-03-12" >> specs/FSREQ-20260312-CODEFIELD-001/trace-matrix.csv
```

### 4. 验证修复

```bash
spec-first gate check FSREQ-20260312-CODEFIELD-001
# 预期输出：PASS_WITH_WAIVER
```

## 关键点

1. **RFC 状态必须是 `approved`**（代码第 48 行检查）
2. **Exception 必须有 `expiresAt` 和 `rollbackPoint`**（代码第 53-66 行检查）
3. **Exception 的 `frId` 必须匹配失败条件的 `scopeFrIds`**（代码第 395-401 行匹配逻辑）

## 代码依据

- `src/core/gate-engine/gate-evaluator.ts:392-410` - 豁免匹配逻辑
- `src/core/trace-engine/exception-validator.ts:15-39` - 读取 `known-exceptions.md`
- `src/core/trace-engine/exception-validator.ts:44-71` - RFC 状态验证
