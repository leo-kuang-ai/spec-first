# C8 合规率健壮性分析报告

> **日期**: 2026-03-10
> **问题**: C8 (Task Compliance) = 88.9%，导致 Gate Check 失败
> **根因**: NFR 类型未被正确支持
> **目标**: 设计健壮的解决方案，防止未来遗漏

---

## 📊 问题回顾

### 现象

日志显示 AI 为所有 TASK 添加了详细执行步骤，但 C8 仍然是 88.9%。

### 根本原因

**代码 Bug**: `src/core/trace-engine/coverage.ts:103-122`

```typescript
/** C8: Task Compliance — TASK 有上游 FR/NFR/DS 的比例（反向：无孤儿 TASK） */
function calcTaskCompliance(
  taskRows: MatrixRow[],
  frRows: MatrixRow[],
  dsRows: MatrixRow[],
  lineage: UpstreamLineage,
): number {
  // ...
  // C8 定义：TASK 关联 FR/NFR/DS 即视为合规
  const allowedUpstreamIds = new Set<string>([
    ...frRows.map((r) => r.id),  // ✅ 包含 FR
    ...dsRows.map((r) => r.id),  // ✅ 包含 DS
  ]);                                    // ❌ 遗漏 NFR！

  const compliant = taskRows.filter(r =>
    lineage.hasAnyAncestor(r.id, allowedUpstreamIds),
  );
  return pct(compliant.length, taskRows.length);
}
```

**问题**：
- **注释说支持 `FR/NFR/DS`**
- **代码只包含 `FR` 和 `DS`**
- **NFR 被遗漏**

### 临时解决方案

日志显示的 workaround：
```markdown
- TASK-HOMEPERF-009 上游从 NFR-PERF-001 改为 FR-HOMEPERF-001,FR-HOMEPERF-005
```

这是**绕过问题**而非**修复问题**。

---

## 🔍 ID 类型体系分析

### 当前 ID 类型定义

**文件**: `src/shared/types.ts:27-31`

```typescript
export type NextIdType =
  | 'FR' | 'DS' | 'TASK' | 'TC' | 'RFC'
  | 'REQ' | 'SYS' | 'ARCH' | 'MOD'
  | 'ATP' | 'STP' | 'ITP' | 'UTP';

export type IdType = NextIdType | 'Feature';
```

### 类型分类

| 类别 | 类型 | 用途 | C8 是否需要支持 |
|------|------|------|-----------------|
| **需求层** | FR | 功能需求 | ✅ 必须支持 |
| | NFR | 非功能需求 | ✅ **应该支持** |
| | REQ | 原始需求 | ⚠️ 可选 |
| | AC | 验收标准 | ❌ 不需要 |
| **设计层** | DS | 设计规格 | ✅ 必须支持 |
| | ARCH | 架构决策 | ⚠️ 可选 |
| | SYS | 系统约束 | ⚠️ 可选 |
| **实现层** | TASK | 实现任务 | - (被检查对象) |
| | TC | 测试用例 | ❌ 不需要 |
| **变更层** | RFC | 变更请求 | ⚠️ 可选 |
| **测试计划** | ATP/STP/ITP/UTP | 各级测试计划 | ❌ 不需要 |
| **其他** | MOD | 模块 | ⚠️ 可选 |
| | Feature | 特性 | ❌ 不需要 |

### NFR 的特殊处理

**当前实现**: NFR 不是独立类型，而是作为 FR 的 `nfrTag` 属性存在：

```typescript
// src/core/trace-engine/matrix.ts:170-172
let nfrTag: string | undefined;
const nfrMatch = title.match(/\[NFR:(\w+)\]/);
if (nfrMatch) nfrTag = nfrMatch[1];
```

**问题**：
- `NFR-PERF-001` 实际上是一个 FR ID
- 但它的 title 包含 `[NFR:PERF]` 标签
- C8 检查时只看 ID 是否在允许列表中，不看 `nfrTag`

---

## 🛠️ 健壮性解决方案

### 方案 A: 扩展 allowedUpstreamIds（推荐）

**优先级**: P0
**工作量**: 小（< 30min）
**风险**: 低

**修改**: `src/core/trace-engine/coverage.ts:103-122`

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
  // NFR 通过 nfrTag 标识，需要一并包含
  const allowedUpstreamIds = new Set<string>([
    ...frRows.map((r) => r.id),
    ...dsRows.map((r) => r.id),
  ]);

  // 同时检查 nfrTag：如果 FR 有 nfrTag，则允许 TASK 通过 NFR-* ID 关联
  const nfrPrefixedIds = new Set<string>();
  for (const fr of frRows) {
    if (fr.nfrTag) {
      // 支持 NFR-TAG 格式的上游引用
      nfrPrefixedIds.add(`NFR-${fr.nfrTag}`);
    }
  }

  const compliant = taskRows.filter(r => {
    // 检查直接关联
    if (lineage.hasAnyAncestor(r.id, allowedUpstreamIds)) return true;
    // 检查 NFR 标签关联
    if (r.upstream) {
      for (const u of r.upstream) {
        if (nfrPrefixedIds.has(u)) return true;
      }
    }
    return false;
  });

  return pct(compliant.length, taskRows.length);
}
```

### 方案 B: 统一 ID 类型定义（长期方案）

**优先级**: P1
**工作量**: 中（2-4h）
**风险**: 中

**修改**: `src/shared/types.ts`

```typescript
// 扩展 ID 类型，正式支持 NFR
export type NextIdType =
  | 'FR' | 'NFR' | 'DS' | 'TASK' | 'TC' | 'RFC'  // 添加 NFR
  | 'REQ' | 'SYS' | 'ARCH' | 'MOD'
  | 'ATP' | 'STP' | 'ITP' | 'UTP';
```

**同时修改**:
- `src/core/trace-engine/matrix.ts` - 解析 NFR 类型行
- `src/core/trace-engine/coverage.ts` - 添加 nfrRows 参数

### 方案 C: 声明式合规类型配置（最健壮）

**优先级**: P2
**工作量**: 中（4-6h）
**风险**: 低

**设计**: 使用配置定义允许的上游类型，而不是硬编码

```typescript
// src/core/trace-engine/compliance-config.ts

/** C8 允许的 TASK 上游类型 */
export const TASK_ALLOWED_UPSTREAM_TYPES: ReadonlySet<IdType> = new Set([
  'FR',   // 功能需求
  'NFR',  // 非功能需求（通过 nfrTag）
  'DS',   // 设计规格
  'REQ',  // 原始需求（可选）
  'ARCH', // 架构决策（可选）
]);

/** C9 允许的 TC 上游类型 */
export const TC_ALLOWED_UPSTREAM_TYPES: ReadonlySet<IdType> = new Set([
  'FR',   // 功能需求
  'NFR',  // 非功能需求
]);

/** C7 允许的 PR 上游类型 */
export const PR_ALLOWED_UPSTREAM_TYPES: ReadonlySet<IdType> = new Set([
  'TASK', // 实现任务
]);
```

**优点**:
1. **集中配置**: 所有合规类型定义在一处
2. **易于维护**: 新增类型只需修改配置
3. **可扩展**: 支持项目级覆盖
4. **文档化**: 配置即文档

---

## 📋 防止未来遗漏的检查清单

### 1. 代码与注释一致性检查

**检查项**:
- [ ] 函数注释中提到的类型是否都在代码中实现
- [ ] 类型定义是否与实际使用一致
- [ ] 配置文件中的类型是否与代码同步

**自动化**: 添加测试用例验证注释与代码一致性

```typescript
// tests/unit/coverage.test.ts
describe('C8 Task Compliance', () => {
  it('should support NFR-tagged FR as valid upstream', () => {
    // 创建带 NFR 标签的 FR
    const frWithNfr: MatrixRow = {
      id: 'FR-PERF-001',
      type: 'FR',
      title: '性能基线 [NFR:PERF]',
      status: 'Planned',
      nfrTag: 'PERF',
    };

    // 创建关联 NFR-PERF-001 的 TASK
    const taskLinkedToNfr: MatrixRow = {
      id: 'TASK-001',
      type: 'TASK',
      title: '性能测试',
      status: 'Planned',
      upstream: ['NFR-PERF-001'],
    };

    // 验证 C8 计算正确
    const c8 = calcTaskCompliance(
      [taskLinkedToNfr],
      [frWithNfr],
      [],
      mockLineage,
    );

    expect(c8).toBe(1); // 应该是 100%
  });
});
```

### 2. 类型覆盖率测试

**检查项**:
- [ ] 所有 ID 类型都有对应的测试用例
- [ ] 边界场景（空上游、无效类型）有覆盖
- [ ] NFR 场景有专门测试

### 3. 文档与代码同步检查

**检查项**:
- [ ] Skill 文档中的类型列表与代码一致
- [ ] CLI 帮助信息与实际支持的类型一致
- [ ] 错误信息提示有效的类型选项

---

## 🎯 推荐方案

### 立即实施（P0）

**方案 A**: 扩展 `allowedUpstreamIds`，支持 NFR 标签

这是最小改动，风险最低：
1. 修改 `calcTaskCompliance` 函数
2. 添加 NFR 标签检查逻辑
3. 添加测试用例

### 后续改进（P1）

**方案 C**: 声明式合规类型配置

这是最健壮的方案：
1. 创建 `compliance-config.ts`
2. 重构覆盖率计算逻辑
3. 添加完整的测试覆盖

---

## 📊 影响评估

| 问题 | 严重性 | 影响范围 | 修复优先级 |
|------|--------|---------|-----------|
| C8 不支持 NFR | 🟡 中等 | 所有使用 NFR 的 Feature | P0 |
| 注释与代码不一致 | 🟡 中等 | 代码可维护性 | P1 |
| 缺少类型测试覆盖 | 🟢 低 | 回归风险 | P2 |
| 错误信息不明确 | 🟢 低 | 用户体验 | P2 |

---

## ✅ 总结

### 核心问题

1. **C8 代码 Bug**: 遗漏 NFR 支持
2. **临时 workaround**: 把 NFR 改成 FR，而非修复代码
3. **设计缺陷**: NFR 没有正式类型定义

### 健壮性建议

1. **P0 立即修复**: 扩展 C8 支持 NFR 标签
2. **P1 后续改进**: 声明式合规类型配置
3. **P2 长期优化**: 宻整的类型测试覆盖

### 防止遗漏

1. **代码与注释一致性测试**
2. **类型覆盖率测试**
3. **文档与代码同步检查**

---

## 🔗 相关文件

- `src/core/trace-engine/coverage.ts:103-122` - 问题代码
- `src/shared/types.ts:27-31` - ID 类型定义
- `src/core/trace-engine/matrix.ts:170-172` - NFR 标签解析
- `skills/spec-first/03-spec/SKILL.md` - Skill 文档
- `specs/FSREQ-20260310-HOMEPERF-001/findings.md:310-314` - 修复记录
