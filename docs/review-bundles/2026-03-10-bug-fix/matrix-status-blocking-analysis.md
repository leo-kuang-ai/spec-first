# 追踪矩阵状态阻塞问题分析报告

> **日期**: 2026-03-10
> **问题**: Gate check 失败 - Invalid matrix status
> **影响**: orchestrate/sync 流程被阻塞，无法推进阶段

---

## 📋 问题概述

用户在执行 `/spec-first:orchestrate` 时，遇到 Gate check 失败：

```
Gate 评估失败：FSREQ-20260309-NAVBAR-001
  原因：Invalid matrix status "pending" for FR-NAVBAR-001
```

尝试修复时，使用了多种状态值（`pending`, `draft`, 空字符串），均告失败：

```
Invalid matrix status "pending" for FR-NAVBAR-001  ❌
Invalid matrix status "draft" for FR-NAVBAR-001    ❌
Invalid matrix status "" for FR-NAVBAR-001         ❌
```

---

## 🔍 根本原因分析

### 1. 状态枚举值要求

**代码位置**: `src/shared/types.ts:165-172`

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

**关键发现**：
- ✅ **有效的状态值**（首字母大写）：`Planned`, `Implemented`, `Verified`, `Accepted`, `Deferred`, `Cancelled`, `Exception`
- ❌ **用户尝试的值**（小写）：`pending`, `draft`, `""` (空)
- ⚠️ **大小写敏感**：系统要求精确匹配，`Planned` ≠ `planned` ≠ `PLANNED`

### 2. 默认状态值

**代码位置**: `src/core/trace-engine/matrix.ts:162`

```typescript
const rawStatus = (cells[3] ?? 'Planned').trim();
```

**关键发现**：
- 默认状态是 `'Planned'`（首字母大写）
- 如果 Status 列为空，会自动使用 `'Planned'`
- 但如果填入了无效值（如 `pending`），会抛出错误

### 3. 初始矩阵模板

**代码位置**: `src/core/process-engine/init.ts:340-343`

```typescript
function skeletonMatrix(): string {
  return '| ID | Type | Title | Status | Upstream | Downstream |\n'
    + '|----|------|-------|--------|----------|------------|\n';
}
```

**关键发现**：
- init 创建的追踪矩阵只有表头，**没有数据行**
- spec skill 生成 FR 后，需要手动添加行到追踪矩阵
- 添加行时必须使用正确的状态值格式

---

## ❌ 系统设计问题

### 问题 1: 缺少状态枚举文档

**现状**：
- MatrixStatus 类型定义在 `src/shared/types.ts`
- CLI 的 `--help` 信息不完整（`spec-first matrix --help` 只列出子命令，没有状态说明）
- 没有独立的文档说明有效的状态值
- init/sync skill 的文档中也没有提及

**影响**：
- 用户（包括 AI agent）无法知道正确的状态值
- 错误的猜测导致反复失败

### 问题 2: 错误信息不友好

**现状**：
```typescript
throw new Error(`Invalid matrix status "${rawStatus}" for ${id}`);
```

**问题**：
- 只提示 "Invalid matrix status"，但不告诉用户有效值是什么
- 没有提供修复建议
- 没有指向相关文档

**建议改进**：
```typescript
throw new Error(
  `Invalid matrix status "${rawStatus}" for ${id}. ` +
  `Valid statuses: ${VALID_MATRIX_STATUSES.values().join(', ')}. ` +
  `Default: Planned`
);
```

### 问题 3: 缺少自动修复机制

**现状**：
- 当状态验证失败时，系统只抛出错误
- 没有提供自动修复选项（如 "是否将 'pending' 修正为 'Planned'？"）
- 没有提供 `spec-first matrix fix` 命令

**影响**：
- 用户需要手动编辑文件
- 容易再次出错

### 问题 4: CLI 帮助信息不足

**现状**：
```bash
$ spec-first matrix --help
未知 matrix 子命令：--help
子命令：check, export, update
```

**问题**：
- `--help` 被当作子命令处理
- 没有详细说明 `matrix update --status` 的有效值
- 缺少示例

---

## 🛠️ 修复方案

### 短期修复（用户侧）

1. **立即修复追踪矩阵**：
   将所有 FR 的状态从 `pending`/`draft` 改为 `Planned`：

   ```markdown
   | FR-NAVBAR-001 | FR | 支持titleView对齐模式配置 | Planned | | |
   | FR-NAVBAR-002 | FR | 左对齐布局 | Planned | | |
   | FR-NAVBAR-003 | FR | 居中对齐布局（视觉居中） | Planned | | |
   | FR-NAVBAR-004 | FR | 右对齐布局 | Planned | | |
   ```

2. **重新执行 Gate check**：
   ```bash
   spec-first gate check FSREQ-20260309-NAVBAR-001
   ```

### 长期改进（系统侧）

#### 1. 增强错误信息

**优先级**: P0
**工作量**: 小（< 1h）

修改 `src/core/trace-engine/matrix.ts:164`：

```typescript
if (!VALID_MATRIX_STATUSES.has(rawStatus as MatrixStatus)) {
  const validList = [...VALID_MATRIX_STATUSES].join(', ');
  throw new Error(
    `Invalid matrix status "${rawStatus}" for ${id}. ` +
    `Valid statuses: ${validList}. ` +
    `See: https://spec-first.dev/docs/matrix-status`
  );
}
```

#### 2. 完善 CLI 帮助信息

**优先级**: P0
**工作量**: 小（< 1h）

修改 `src/cli/commands/matrix.ts`：

```typescript
function printMatrixHelp(): void {
  console.log('用法：spec-first matrix <subcommand> <featureId> [options]\n');
  console.log('子命令：');
  console.log('  check   检查追踪矩阵完整性');
  console.log('  export  导出追踪矩阵为 JSON');
  console.log('  update  更新追踪矩阵条目\n');
  console.log('更新选项：');
  console.log('  --status    状态值，有效选项：');
  console.log('              - Planned (默认，计划中)');
  console.log('              - Implemented (已实现)');
  console.log('              - Verified (已验证)');
  console.log('              - Accepted (已验收)');
  console.log('              - Deferred (已延期)');
  console.log('              - Cancelled (已取消)');
  console.log('              - Exception (例外处理)');
  console.log('  --title     标题');
  console.log('  --upstream  上游依赖（逗号分隔）');
  console.log('  --downstream 下游影响（逗号分隔）\n');
  console.log('示例：');
  console.log('  spec-first matrix update FSREQ-001 FR-001 --status Implemented --yes');
}
```

#### 3. 添加自动修复命令

**优先级**: P1
**工作量**: 中（2-4h）

新增 `spec-first matrix fix` 命令：

```typescript
export function handleMatrixFix(args: string[]): number {
  const featureId = args[0];
  if (!featureId) {
    console.error('用法：spec-first matrix fix <featureId>');
    return ExitCode.VALIDATION_ERROR;
  }

  const projectRoot = process.cwd();
  const matrixPath = join(projectRoot, 'specs', featureId, 'traceability-matrix.md');

  if (!exists(matrixPath)) {
    console.error(`未找到追溯矩阵：${matrixPath}`);
    return ExitCode.VALIDATION_ERROR;
  }

  // 读取并修复
  const content = readFile(matrixPath, 'utf-8');
  const lines = content.split('\n');
  const fixed: string[] = [];
  let fixCount = 0;

  for (const line of lines) {
    const match = line.match(/^\| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \|/);
    if (match) {
      const [, id, type, title, status] = match;
      const trimmedStatus = status.trim();

      // 尝试自动修复常见错误
      const normalizedStatus = normalizeStatus(trimmedStatus);
      if (normalizedStatus !== trimmedStatus) {
        fixed.push(line.replace(status, ` ${normalizedStatus} `));
        fixCount++;
        console.log(`✓ 修复 ${id.trim()}: "${trimmedStatus}" → "${normalizedStatus}"`);
        continue;
      }
    }
    fixed.push(line);
  }

  if (fixCount > 0) {
    writeFile(matrixPath, fixed.join('\n'), 'utf-8');
    console.log(`\n✅ 已修复 ${fixCount} 个状态值`);
    return ExitCode.SUCCESS;
  } else {
    console.log('✓ 未发现需要修复的状态值');
    return ExitCode.SUCCESS;
  }
}

function normalizeStatus(status: string): MatrixStatus {
  const lower = status.toLowerCase();
  const mapping: Record<string, MatrixStatus> = {
    'pending': 'Planned',
    'draft': 'Planned',
    'planned': 'Planned',
    'implementing': 'Implemented',
    'implemented': 'Implemented',
    'done': 'Implemented',
    'verifying': 'Verified',
    'verified': 'Verified',
    'tested': 'Verified',
    'accepting': 'Accepted',
    'accepted': 'Accepted',
    'approved': 'Accepted',
    'deferred': 'Deferred',
    'postponed': 'Deferred',
    'cancelled': 'Cancelled',
    'canceled': 'Cancelled',
    'aborted': 'Cancelled',
    'exception': 'Exception',
    'error': 'Exception',
  };
  return mapping[lower] ?? (status as MatrixStatus);
}
```

#### 4. 在 spec skill 中生成正确格式

**优先级**: P0
**工作量**: 小（< 1h）

修改 spec skill，在生成 FR 时使用正确的状态格式：

```markdown
## 追踪矩阵更新

将以下内容添加到 `traceability-matrix.md`：

| ID | Type | Title | Status | Upstream | Downstream |
|----|------|-------|--------|----------|------------|
| FR-NAVBAR-001 | FR | 支持titleView对齐模式配置 | Planned | | |
| FR-NAVBAR-002 | FR | 左对齐布局 | Planned | | |
| FR-NAVBAR-003 | FR | 居中对齐布局（视觉居中） | Planned | | |
| FR-NAVBAR-004 | FR | 右对齐布局 | Planned | | |

**注意**: 状态值必须首字母大写，有效值：Planned, Implemented, Verified, Accepted, Deferred, Cancelled, Exception
```

#### 5. 添加状态枚举文档

**优先级**: P1
**工作量**: 小（< 1h）

创建 `docs/matrix-status.md`：

```markdown
# 追踪矩阵状态说明

## 状态枚举

| 状态 | 说明 | 使用场景 |
|------|------|----------|
| Planned | 计划中 | 需求已定义，但尚未开始实现 |
| Implemented | 已实现 | 代码已完成，但尚未验证 |
| Verified | 已验证 | 通过测试验证，但尚未验收 |
| Accepted | 已验收 | 业务方验收通过 |
| Deferred | 已延期 | 推迟到后续版本 |
| Cancelled | 已取消 | 不再实现 |
| Exception | 例外处理 | 特殊情况，需要单独处理 |

## 状态转换

```
Planned → Implemented → Verified → Accepted
   ↓          ↓            ↓          ↓
   └──────────┴────────────┴──────────→ Deferred/Cancelled
```

## 常见错误

❌ **错误示例**：
- `pending` (小写)
- `draft` (非标准值)
- `done` (非标准值)
- `in progress` (非标准值)

✅ **正确示例**：
- `Planned` (首字母大写)
- `Implemented` (首字母大写)
- `Verified` (首字母大写)
```

---

## 📊 影响评估

### 用户体验影响

- **严重性**: 🔴 高
- **影响范围**: 所有使用 orchestrate/sync 的用户
- **触发频率**: 每次新 Feature 初始化后执行 spec skill 时
- **用户困惑度**: 非常高（错误信息无帮助）

### 系统健壮性影响

- **问题类型**: 设计缺陷 + 用户体验问题
- **根因**:
  1. 缺少用户文档
  2. 错误信息不友好
  3. 缺少自动修复机制
- **可修复性**: ✅ 完全可修复，且修复成本低

---

## ✅ 结论

**是否为系统设计不合理导致？**

**✅ 是的。**

这是一个典型的**系统设计缺陷**，具体表现为：

1. **文档缺失**：没有告知用户正确的状态值格式
2. **错误处理不当**：错误信息不提供有效值提示
3. **缺少防护机制**：没有自动修复或智能提示
4. **CLI 不完善**：帮助信息不足以指导用户

**这不是用户错误，而是系统没有提供足够的信息和工具来防止/修复错误。**

---

## 🎯 行动计划

### 立即行动（今日）

1. ✅ 生成此分析报告
2. ⏳ 创建 GitHub Issue 跟踪此问题
3. ⏳ 在项目中添加临时文档说明状态值

### 短期行动（本周）

1. ⏳ 实现错误信息增强（P0）
2. ⏳ 完善 CLI 帮助信息（P0）
3. ⏳ 修改 spec skill 模板（P0）
4. ⏳ 添加状态枚举文档（P1）

### 长期行动（下周）

1. ⏳ 实现 `matrix fix` 自动修复命令（P1）
2. ⏳ 在 init skill 中添加状态值说明（P1）
3. ⏳ 添加集成测试覆盖此场景（P2）

---

## 📝 附录

### A. 有效状态值速查表

```
Planned      - 计划中（默认）
Implemented  - 已实现
Verified     - 已验证
Accepted     - 已验收
Deferred     - 已延期
Cancelled    - 已取消
Exception    - 例外处理
```

### B. 相关代码文件

- `src/shared/types.ts:165-172` - MatrixStatus 类型定义
- `src/core/trace-engine/matrix.ts:11-17` - VALID_MATRIX_STATUSES
- `src/core/trace-engine/matrix.ts:162-166` - 状态验证逻辑
- `src/core/process-engine/init.ts:340-343` - skeletonMatrix()
- `src/cli/commands/matrix.ts` - matrix CLI 命令

### C. 参考日志

完整执行日志：`docs/review-bundles/2026-03-10-bug-fix/2026-03-09-local-command-caveatcaveat-the-messages-below-w.txt`
