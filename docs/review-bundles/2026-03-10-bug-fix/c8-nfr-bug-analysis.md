# C8 合规率问题分析报告

> **日期**: 2026-03-10
> **Feature**: FSREQ-20260310-HOMEPERF-001
> **问题**: C8 (Task Compliance) = 88.9%，无法通过 Gate 检查
> **结论**: ❌ **代码 Bug - C8 计算逻辑遗漏 NFR**

---

## 🔴 问题描述

执行 Gate Check 时，C8 始终显示 88.9%，无法达到 100%：

```
Gate 检查 — FSREQ-20260310-HOMEPERF-001 (03_plan)

结果：FAIL
  [OK]    Task coverage (C3) = 100%
  [FAIL]  Task compliance (C8) = 100%
          C8=88.9%
```

日志中 AI 尝试为所有 TASK 添加详细执行步骤，但 C8 仍然是 88.9%。

---

## 🔍 根本原因分析

### C8 的代码实现

**文件**: `src/core/trace-engine/coverage.ts:103-122`

```typescript
/** C8: Task Compliance — TASK 有上游 FR/NFR/DS 的比例（反向：无孤儿 TASK） */
function calcTaskCompliance(
  taskRows: MatrixRow[],
  frRows: MatrixRow[],
  dsRows: MatrixRow[],
  lineage: UpstreamLineage,
): number {
  if (taskRows.length === 0) return 1;

  // C8 定义：TASK 关联 FR/NFR/DS 即视为合规
  const allowedUpstreamIds = new Set<string>([
    ...frRows.map((r) => r.id),  // ✅ 包含 FR
    ...dsRows.map((r) => r.id),  // ✅ 包含 DS
    // ❌ 缺少 NFR！
  ]);

  const compliant = taskRows.filter(r =>
    lineage.hasAnyAncestor(r.id, allowedUpstreamIds),
  );
  return pct(compliant.length, taskRows.length);
}
```

### 问题所在

**代码注释声称**：`C8 定义：TASK 关联 FR/NFR/DS 即视为合规`

**实际代码**：只包含 FR 和 DS，**遗漏了 NFR**！

### 实际数据验证

**traceability-matrix.md 中的 TASK**：

| TASK ID | Upstream | 是否合规 |
|---------|----------|---------|
| TASK-HOMEPERF-001 | FR-HOMEPERF-001,DS-HOMEPERF-001 | ✅ (有 FR/DS) |
| TASK-HOMEPERF-002 | FR-HOMEPERF-001,DS-HOMEPERF-001 | ✅ (有 FR/DS) |
| TASK-HOMEPERF-003 | FR-HOMEPERF-003,DS-HOMEPERF-003 | ✅ (有 FR/DS) |
| TASK-HOMEPERF-004 | FR-HOMEPERF-002,DS-HOMEPERF-002,DS-HOMEPERF-006 | ✅ (有 FR/DS) |
| TASK-HOMEPERF-005 | FR-HOMEPERF-002,FR-HOMEPERF-004,DS-HOMEPERF-002 | ✅ (有 FR/DS) |
| TASK-HOMEPERF-006 | FR-HOMEPERF-004,DS-HOMEPERF-004 | ✅ (有 FR/DS) |
| TASK-HOMEPERF-007 | FR-HOMEPERF-005,DS-HOMEPERF-005 | ✅ (有 FR/DS) |
| TASK-HOMEPERF-008 | FR-HOMEPERF-005,DS-HOMEPERF-005 | ✅ (有 FR/DS) |
| **TASK-HOMEPERF-009** | **NFR-PERF-001** | ❌ **(只有 NFR，没有 FR/DS)** |

**计算结果**：8/9 = 88.9%

---

## 📊 问题本质

### 日志中的误解

日志中的 AI 认为：
> "C8 合规率 88.9% 意味着 9 个任务中有 1 个不合规。让我检查是否缺少详细的执行步骤。"

**这是错误的**！

### C8 的真正含义

C8 (Task Compliance) 衡量的是 **TASK 是否有上游关联**（防止孤儿 TASK），与详细执行步骤**无关**。

### 真正的问题

`TASK-HOMEPERF-009` 的上游是 `NFR-PERF-001`（性能需求），这是**合法的上游关联**，但代码没有把 NFR 加入允许列表。

---

## 🛠️ 修复方案

### 方案 A: 修复代码（推荐）

**优先级**: P0
**工作量**: 小（< 15min）

**修改**: `src/core/trace-engine/coverage.ts:103-122`

```typescript
/** C8: Task Compliance — TASK 有上游 FR/NFR/DS 的比例（反向：无孤儿 TASK） */
function calcTaskCompliance(
  taskRows: MatrixRow[],
  frRows: MatrixRow[],
  dsRows: MatrixRow[],
  lineage: UpstreamLineage,
  nfrRows: MatrixRow[],  // 新增参数
): number {
  if (taskRows.length === 0) return 1;

  // C8 定义：TASK 关联 FR/NFR/DS 即视为合规
  const allowedUpstreamIds = new Set<string>([
    ...frRows.map((r) => r.id),
    ...dsRows.map((r) => r.id),
    ...nfrRows.map((r) => r.id),  // 添加 NFR
  ]);

  const compliant = taskRows.filter(r =>
    lineage.hasAnyAncestor(r.id, allowedUpstreamIds),
  );
  return pct(compliant.length, taskRows.length);
}
```

**同时修改调用处** (`src/core/trace-engine/coverage.ts:43`)：

```typescript
C8: calcTaskCompliance(trace.taskRows, trace.frRows, trace.dsRows, trace.nfrRows, trace.lineage),
```

### 方案 B: 临时绕过（不推荐）

修改 `TASK-HOMEPERF-009` 的上游，添加一个 FR：

```markdown
| TASK-HOMEPERF-009 | TASK | 性能测试验证 | Planned | NFR-PERF-001,FR-HOMEPERF-001 | - |
```

但这不是根本解决方案。

---

## 📋 相关问题

### AI 的误解导致无效操作

日志中 AI 做了大量**无效操作**：
1. 为 TASK-HOMEPERF-001 添加详细执行步骤 → C8 仍是 88.9%
2. 为所有 9 个 TASK 添加详细执行步骤 → C8 仍是 88.9%

**原因**：AI 误解了 C8 的含义，认为需要"详细执行步骤"，实际上 C8 只检查上游关联。

### 系统设计问题

1. **错误信息不清晰**：Gate Check 只显示 "C8=88.9%"，不告诉用户哪个 TASK 不合规
2. **代码与注释不一致**：注释说支持 NFR，代码实际不支持
3. **缺少测试覆盖**：没有测试验证 NFR 作为 TASK 上游的场景

---

## 🎯 总结

### 问题本质

| 问题 | 日志中的理解 | 实际原因 |
|------|-------------|---------|
| C8=88.9% | 缺少详细执行步骤 | **代码 bug：遗漏 NFR** |
| 解决方案 | 为所有 TASK 添加步骤 | **修复代码支持 NFR** |

### 影响评估

**严重性**: 🟡 中等

**影响**：
1. 任何关联 NFR 的 TASK 都会导致 C8 不达标
2. 用户会做大量无效操作（添加详细步骤）
3. 阻塞阶段推进

### 修复优先级

**P0 - 立即修复**：
1. 修改 `calcTaskCompliance` 函数，添加 NFR 支持
2. 添加测试用例覆盖 NFR 场景
3. 改进错误信息，显示哪些 TASK 不合规

---

## 🔗 相关文件

- `src/core/trace-engine/coverage.ts:103-122` - 问题代码
- `src/core/gate-engine/gate-evaluator.ts:172` - Gate 条件定义
- `specs/FSREQ-20260310-HOMEPERF-001/traceability-matrix.md:40` - TASK-HOMEPERF-009 定义

---

## 📝 经验教训

1. **代码与注释必须一致**：注释说支持 NFR，代码不支持，这是典型的 bug 来源
2. **错误信息要具体**：Gate Check 应该显示哪些 TASK 不合规，而不是只显示百分比
3. **测试覆盖边界场景**：NFR 作为 TASK 上游是合法场景，应该有测试覆盖
4. **AI 需要理解代码逻辑**：日志中的 AI 误解了 C8 的含义，导致做了大量无效操作
