# 代码审查：追踪矩阵状态不一致问题评估

> **日期**: 2026-03-10
> **审查范围**: 分析报告中提到的问题是否已修复
> **结论**: ❌ **存在严重的代码与文档不一致问题**

---

## 🔴 严重问题：代码与文档不一致

### 问题描述

**代码实现**（`src/shared/types.ts:165-172`）定义的有效状态：
```typescript
export type MatrixStatus =
  | 'Planned'
  | 'Implemented'
  | 'Verified'
  | 'Accepted'
  | 'Deferred'
  | 'Cancelled'
  | 'Exception';
```

**Skill 文档**（`skills/spec-first/03-spec/SKILL.md:102`）声明的有效状态：
```markdown
- **Matrix 状态**: 使用 `Planned`, `InProgress`, `Completed`, `Verified`, `Blocked`（禁止使用 `pending`）
```

**不一致点**：
1. ❌ 文档中的 `InProgress` - 代码中**不存在**
2. ❌ 文档中的 `Completed` - 代码中**不存在**
3. ❌ 文档中的 `Blocked` - 代码中**不存在**
4. ✅ 代码中的 `Implemented` - 文档中**未提及**
5. ✅ 代码中的 `Accepted` - 文档中**未提及**
6. ✅ 代码中的 `Deferred` - 文档中**未提及**
7. ✅ 代码中的 `Cancelled` - 文档中**未提及**
8. ✅ 代码中的 `Exception` - 文档中**未提及**

### 影响评估

**严重性**: 🔴 **极高**

**影响**：
1. **用户会被误导**：按照 Skill 文档使用 `InProgress`/`Completed`/`Blocked`，但代码会拒绝这些值
2. **AI Agent 会出错**：spec skill 会生成无效的状态值，导致 Gate check 失败
3. **问题会重现**：即使用户修复了当前的矩阵，下次执行 spec skill 仍会生成错误的状态值

---

## 📊 分析报告问题评估

### 问题 1: 缺少状态枚举文档

**状态**: ⚠️ **部分解决，但存在错误**

**已完成**：
- ✅ Skill 文档中添加了状态说明（`skills/spec-first/03-spec/references/cli-commands-reference.md:24-31`）
- ✅ 添加了 `id-types-and-status.md` 文档

**问题**：
- ❌ 文档中的状态值与代码不一致
- ❌ 文档声称支持 `InProgress`, `Completed`, `Blocked`，但代码不支持

**证据**：
```markdown
# skills/spec-first/03-spec/references/cli-commands-reference.md:24-31
**✅ 使用**:
- `Planned` - 已计划
- `InProgress` - 进行中      ❌ 代码中不存在
- `Completed` - 已完成       ❌ 代码中不存在
- `Verified` - 已验证
- `Blocked` - 已阻塞         ❌ 代码中不存在

**❌ 禁止**:
- `pending` - 应使用 `Planned`
```

### 问题 2: 错误信息不友好

**状态**: ❌ **未解决**

**代码位置**: `src/core/trace-engine/matrix.ts:164`

**当前实现**：
```typescript
if (!VALID_MATRIX_STATUSES.has(rawStatus as MatrixStatus)) {
  throw new Error(`Invalid matrix status "${rawStatus}" for ${id}`);
}
```

**问题**：
- 错误信息仍然不提供有效值列表
- 没有修复建议
- 没有指向文档的链接

**建议改进**（未实现）：
```typescript
if (!VALID_MATRIX_STATUSES.has(rawStatus as MatrixStatus)) {
  const validList = [...VALID_MATRIX_STATUSES].join(', ');
  throw new Error(
    `Invalid matrix status "${rawStatus}" for ${id}. ` +
    `Valid statuses: ${validList}. ` +
    `Default: Planned`
  );
}
```

### 问题 3: 缺少自动修复机制

**状态**: ❌ **未解决**

**检查结果**：
- ❌ 没有 `spec-first matrix fix` 命令
- ❌ 没有自动修复逻辑
- ❌ 没有智能提示机制

### 问题 4: CLI 帮助信息不足

**状态**: ❌ **未解决**

**检查结果**：
```bash
$ spec-first matrix --help
未知 matrix 子命令：--help
子命令：check, export, update
```

- ❌ `--help` 仍被当作子命令处理
- ❌ 没有详细说明 `--status` 的有效值
- ❌ 缺少示例

---

## 🔍 根本原因分析

### 为什么会出现代码与文档不一致？

1. **文档先行，代码未跟进**：
   - 可能在设计阶段计划使用 `InProgress`/`Completed`/`Blocked`
   - 但实现时改为了 `Implemented`/`Accepted`/`Deferred`/`Cancelled`/`Exception`
   - 文档没有同步更新

2. **缺少自动化校验**：
   - 没有测试验证文档中的状态值是否与代码一致
   - 没有 CI 检查文档与代码的一致性

3. **多处定义，难以维护**：
   - 状态值在多个文件中重复定义
   - 修改时容易遗漏某些文件

---

## ✅ 正确的状态值（以代码为准）

**有效状态**（`src/shared/types.ts` + `src/core/trace-engine/matrix.ts`）：

| 状态 | 说明 | 使用场景 |
|------|------|----------|
| `Planned` | 已规划 | 需求已定义，但尚未开始实现（默认值） |
| `Implemented` | 已实现 | 代码已完成，但尚未验证 |
| `Verified` | 已验证 | 通过测试验证，但尚未验收 |
| `Accepted` | 已验收 | 业务方验收通过 |
| `Deferred` | 已延期 | 推迟到后续版本 |
| `Cancelled` | 已取消 | 不再实现 |
| `Exception` | 例外处理 | 特殊情况，需要单独处理 |

**无效状态**（文档中错误声称支持）：
- ❌ `InProgress` - 应使用 `Implemented`
- ❌ `Completed` - 应使用 `Implemented` 或 `Verified`
- ❌ `Blocked` - 应使用 `Deferred` 或在 title 中标注
- ❌ `pending` - 应使用 `Planned`
- ❌ `draft` - 应使用 `Planned`

---

## 🎯 修复方案

### 方案 A: 修改文档以匹配代码（推荐）

**优先级**: P0
**工作量**: 小（< 1h）
**风险**: 低

**操作**：
1. 修改所有 Skill 文档中的状态值说明
2. 将 `InProgress` → `Implemented`
3. 将 `Completed` → `Implemented` 或 `Verified`
4. 将 `Blocked` → `Deferred`
5. 添加 `Accepted`, `Cancelled`, `Exception` 的说明

**影响文件**：
- `skills/spec-first/03-spec/SKILL.md`
- `skills/spec-first/03-spec/references/cli-commands-reference.md`
- `skills/spec-first/03-spec/references/id-types-and-status.md`
- `skills/spec-first/03-spec/references/convergence-qa-rules.md`
- `skills/spec-first/16-sync/references/sync-rules.md`

### 方案 B: 修改代码以匹配文档

**优先级**: P2
**工作量**: 中（2-4h）
**风险**: 高（需要迁移现有数据）

**操作**：
1. 修改 `src/shared/types.ts` 中的 `MatrixStatus` 类型
2. 修改 `src/core/trace-engine/matrix.ts` 中的 `VALID_MATRIX_STATUSES`
3. 添加状态迁移脚本（`Implemented` → `InProgress` 等）
4. 更新所有测试用例

**不推荐原因**：
- 需要迁移现有 Feature 的追踪矩阵
- 可能破坏已有数据
- 工作量大，风险高

---

## 📋 立即行动清单

### 1. 修复文档不一致（P0，今日完成）

**需要修改的文件**：
- `skills/spec-first/03-spec/SKILL.md:102`
- `skills/spec-first/03-spec/references/cli-commands-reference.md:24-31`
- `skills/spec-first/03-spec/references/id-types-and-status.md:24-31`
- `skills/spec-first/03-spec/references/convergence-qa-rules.md:166`
- `skills/spec-first/03-spec/SKILL.md.backup:65-66`

**修改内容**：
将所有 `InProgress` → `Implemented`
将所有 `Completed` → `Implemented`
将所有 `Blocked` → `Deferred`
添加 `Accepted`, `Cancelled`, `Exception` 的说明

### 2. 增强错误信息（P0，本周完成）

**文件**: `src/core/trace-engine/matrix.ts:164`

**修改**：
```typescript
if (!VALID_MATRIX_STATUSES.has(rawStatus as MatrixStatus)) {
  const validList = [...VALID_MATRIX_STATUSES].join(', ');
  throw new Error(
    `Invalid matrix status "${rawStatus}" for ${id}. ` +
    `Valid statuses: ${validList}. ` +
    `Default: Planned`
  );
}
```

### 3. 完善 CLI 帮助信息（P1，本周完成）

**文件**: `src/cli/commands/matrix.ts`

添加详细的帮助信息，包括所有有效状态值和示例。

### 4. 添加自动化校验（P1，下周完成）

**目标**: 防止文档与代码再次不一致

**方案**：
- 添加测试用例验证文档中的状态值
- 添加 CI 检查脚本
- 从代码自动生成文档

---

## 📝 总结

### 当前状态评估

| 问题 | 分析报告 | 当前状态 | 是否解决 |
|------|---------|---------|---------|
| 缺少状态枚举文档 | ❌ | ⚠️ 有文档但错误 | **部分** |
| 错误信息不友好 | ❌ | ❌ 未改进 | **否** |
| 缺少自动修复机制 | ❌ | ❌ 未实现 | **否** |
| CLI 帮助信息不足 | ❌ | ❌ 未改进 | **否** |
| **代码与文档不一致** | - | ❌ **新发现** | **否** |

### 核心问题

**原始问题**（日志中）：
- 用户使用了 `pending`/`draft` 状态 → Gate check 失败

**根本原因**：
1. ✅ 代码要求首字母大写（`Planned` 而非 `pending`）
2. ❌ **文档声称支持的状态值与代码不一致**
3. ❌ 错误信息不提供有效值列表
4. ❌ 缺少自动修复机制

### 修复优先级

**P0 - 立即修复**（今日）：
1. 修复所有 Skill 文档中的状态值不一致
2. 确保文档与代码完全一致

**P0 - 本周完成**：
1. 增强错误信息，提示有效状态值
2. 完善 CLI 帮助信息

**P1 - 下周完成**：
1. 实现 `matrix fix` 自动修复命令
2. 添加自动化校验防止再次不一致

---

## 🔗 相关文件

### 代码文件
- `src/shared/types.ts:165-172` - MatrixStatus 类型定义（真理源）
- `src/core/trace-engine/matrix.ts:11-19` - VALID_MATRIX_STATUSES
- `src/core/trace-engine/matrix.ts:162-166` - 状态验证逻辑
- `src/core/process-engine/init.ts:340-343` - skeletonMatrix()

### 文档文件（需要修复）
- `skills/spec-first/03-spec/SKILL.md:102`
- `skills/spec-first/03-spec/references/cli-commands-reference.md:24-31`
- `skills/spec-first/03-spec/references/id-types-and-status.md:24-31`
- `skills/spec-first/03-spec/references/convergence-qa-rules.md:166`

### 测试文件
- `tests/unit/matrix.test.ts:59` - 测试无效状态
- `tests/unit/gate-evaluator.test.ts:336` - 测试 Gate check 拒绝无效状态

---

## ⚠️ 风险提示

**如果不立即修复文档不一致**：
1. 用户会继续被误导使用错误的状态值
2. AI Agent 会继续生成无效的追踪矩阵
3. 问题会持续重现，无法根治
4. 用户体验极差，信任度下降

**建议**：
立即修复文档不一致问题，这是最高优先级的任务。
