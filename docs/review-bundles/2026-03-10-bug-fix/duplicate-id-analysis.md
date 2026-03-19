# 重复 ID 问题分析报告

> **日期**: 2026-03-10
> **Feature**: FSREQ-20260310-HOMEPERF-001
> **问题**: validate format 报告重复 ID（FR-HOMEPERF-001~005）
> **结论**: ❌ **误报 - 格式校验器逻辑错误**

---

## 🔴 问题描述

执行 `npx spec-first validate format FSREQ-20260310-HOMEPERF-001` 时报错：

```
✗ 格式校验失败：
  - 重复 ID：FR-HOMEPERF-001
  - 重复 ID：FR-HOMEPERF-002
  - 重复 ID：FR-HOMEPERF-003
  - 重复 ID：FR-HOMEPERF-004
  - 重复 ID：FR-HOMEPERF-005
  - spec.md 缺少 Feature ID 字段
```

但实际检查 `traceability-matrix.md` 和 `spec.md`，**这些 ID 并没有重复**。

---

## 🔍 根本原因分析

### 问题代码

**文件**: `src/core/validators/format-validator.ts:78-88`

```typescript
const seen = new Set<string>();
const dupes = new Set<string>();
for (const match of content.matchAll(/\|\s*([A-Z][A-Z0-9-]{2,40})\s*\|/g)) {
  const id = match[1];
  if (!validateId(id).valid) continue;
  if (seen.has(id)) dupes.add(id);
  seen.add(id);
}
for (const id of dupes) {
  errors.push(`重复 ID：${id}`);
}
```

### 问题分析

**正则表达式**: `/\|\s*([A-Z][A-Z0-9-]{2,40})\s*\|/g`

这个正则会匹配**所有**被 `|` 包围的大写字母开头的字符串，包括：

1. ✅ **ID 列**（第1列）: `| FR-HOMEPERF-001 |`
2. ✅ **Type 列**（第2列）: `| FR |`, `| DS |`, `| TASK |`, `| AC |`
3. ❌ **Title 列**（第3列）: 如果标题包含大写字母开头的词，也会被匹配
4. ❌ **Status 列**（第4列）: `| Planned |`, `| Implemented |` 等
5. ❌ **Upstream/Downstream 列**: 包含的 ID 引用

### 实际匹配结果

以 `traceability-matrix.md` 第3行为例：

```markdown
| FR-HOMEPERF-001 | FR | CSS 优化 | Planned | REQ-PERF-CSS | AC-HOMEPERF-001-01~03 |
```

正则会匹配到：
1. `FR-HOMEPERF-001` ✅ (ID列)
2. `FR` ✅ (Type列)
3. `CSS` ❌ (Title列，但不是有效ID，会被 validateId 过滤)
4. `Planned` ✅ (Status列，**这是问题所在！**)
5. `REQ-PERF-CSS` ✅ (Upstream列)
6. `AC-HOMEPERF-001` ✅ (Downstream列，从范围表达式中提取)

**关键问题**：
- `FR-HOMEPERF-001` 在 ID 列出现 1 次
- `FR-HOMEPERF-001` 在其他行的 Upstream/Downstream 列被引用多次
- 格式校验器把**所有列**的匹配都计入，导致误报重复

---

## 📊 实际数据验证

### traceability-matrix.md 中的 FR-HOMEPERF-001

**第3行**（ID列）：
```markdown
| FR-HOMEPERF-001 | FR | CSS 优化 | Planned | REQ-PERF-CSS | AC-HOMEPERF-001-01~03 |
```

**第32行**（Upstream列引用）：
```markdown
| TASK-HOMEPERF-001 | TASK | 提取关键 CSS | Planned | FR-HOMEPERF-001,DS-HOMEPERF-001 | - |
```

**第33行**（Upstream列引用）：
```markdown
| TASK-HOMEPERF-002 | TASK | 压缩优化 CSS | Planned | FR-HOMEPERF-001,DS-HOMEPERF-001 | - |
```

**结论**：
- FR-HOMEPERF-001 在 **ID 列只出现 1 次**（第3行）
- FR-HOMEPERF-001 在 **Upstream 列被引用 2 次**（第32、33行）
- **这不是重复定义，而是正常的依赖引用**

---

## ❌ 为什么是误报？

### 正确的重复检测逻辑

**应该只检查 ID 列（第1列）**：
- 每个 ID 在 ID 列只能出现一次
- ID 在其他列的引用（Upstream/Downstream）不算重复

### 当前错误的逻辑

**检查了所有列**：
- 把 ID 列的定义和 Upstream/Downstream 列的引用都计入
- 导致正常的依赖引用被误判为重复

---

## 🛠️ 修复方案

### 方案 A: 只匹配 ID 列（推荐）

**优先级**: P0
**工作量**: 小（< 30min）

**修改**: `src/core/validators/format-validator.ts:78-88`

```typescript
const seen = new Set<string>();
const dupes = new Set<string>();

// 只匹配 ID 列（第1列）：行首 | 后的内容
const lines = content.split('\n');
for (const line of lines) {
  // 跳过表头和分隔线
  if (line.startsWith('| ID |') || line.startsWith('|-')) continue;

  // 提取第1列（ID列）
  const match = line.match(/^\|\s*([A-Z][A-Z0-9-]{2,40})\s*\|/);
  if (!match) continue;

  const id = match[1];
  if (!validateId(id).valid) continue;

  if (seen.has(id)) dupes.add(id);
  seen.add(id);
}

for (const id of dupes) {
  errors.push(`重复 ID：${id}`);
}
```

### 方案 B: 使用 parseMatrix 函数

**优先级**: P1
**工作量**: 小（< 30min）

**修改**: 复用 `src/core/trace-engine/matrix.ts` 的 `parseMatrix` 函数

```typescript
import { parseMatrix } from '../trace-engine/matrix.js';

// ...

const seen = new Set<string>();
const dupes = new Set<string>();

try {
  const rows = parseMatrix(featureId, matrixPath);
  for (const row of rows) {
    if (seen.has(row.id)) dupes.add(row.id);
    seen.add(row.id);
  }
} catch (e) {
  // parseMatrix 失败时回退到简单检查
}

for (const id of dupes) {
  errors.push(`重复 ID：${id}`);
}
```

---

## 📋 其他问题

### "spec.md 缺少 Feature ID 字段"

**状态**: ✅ **已修复**

日志显示已在第 624 行添加：
```markdown
**Feature ID**: FSREQ-20260310-HOMEPERF-001
```

这个问题已解决。

---

## 🎯 总结

### 问题本质

**不是真正的重复 ID**，而是格式校验器的逻辑错误：
- 把依赖引用（Upstream/Downstream 列）误判为重复定义
- 正则表达式匹配范围过宽，包含了所有列

### 影响评估

**严重性**: 🟡 中等

**影响**：
1. 误报导致用户困惑
2. 阻塞了正常的工作流程
3. 用户可能会尝试"修复"不存在的问题

### 修复优先级

**P0 - 立即修复**：
- 修改格式校验器，只检查 ID 列
- 添加测试用例防止回归

**P1 - 本周完成**：
- 复用 parseMatrix 函数，避免重复解析逻辑
- 完善错误信息，区分"重复定义"和"依赖引用"

---

## 🔗 相关文件

- `src/core/validators/format-validator.ts:78-88` - 问题代码
- `src/core/trace-engine/matrix.ts` - parseMatrix 函数（可复用）
- `specs/FSREQ-20260310-HOMEPERF-001/traceability-matrix.md` - 实际数据
- `specs/FSREQ-20260310-HOMEPERF-001/spec.md` - 规格文档
