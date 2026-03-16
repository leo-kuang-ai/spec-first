# 事故复盘：JSON 生成路径与语法错误

**日期**: 2026-03-16
**影响范围**: `/spec-first:first` skill 执行
**严重程度**: 中（文件生成到错误位置，JSON 语法错误）

---

## 1. 问题描述

执行 `/spec-first:first` 生成项目认知文档时，出现两类错误：

1. **路径错误**：JSON 文件被写入 `.config-first/runtime/first/` 而非 `.spec-first/runtime/first/`
2. **JSON 语法错误**：生成的 JSON 文件包含语法错误（尾随逗号、括号不匹配、多余引号）

---

## 2. 根因分析

### 2.1 路径错误：硬编码 vs 项目常量

**错误行为**：
```typescript
// 错误：手动硬编码路径
const wrongPath = '.config-first/runtime/first/summary.json';
```

**项目正确定义**（`src/core/skill-runtime/first-runtime-store.ts`）：
```typescript
export const FIRST_RUNTIME_DIR = '.spec-first/runtime/first';

export function getFirstRuntimeDir(projectRoot: string): string {
  return path.join(projectRoot, FIRST_RUNTIME_DIR);
}
```

**根因**：未先读取项目常量定义，凭记忆/猜测硬编码路径。

### 2.2 JSON 构造错误：手动拼接 vs Builder 函数

**错误行为**：
```typescript
// 错误：手动拼接 JSON 字符串
const json = `{
  "items": ["a", "b",]  // 尾随逗号
}`;
```

**正确做法**：
```typescript
// 方案1：使用 JSON.stringify
const json = JSON.stringify(data, null, 2);

// 方案2：使用项目中已有的 runtime 写盘入口
import {
  writeFirstRuntimeSummary,
  writeFirstRoleViews,
  writeFirstStageViews,
} from './first-runtime-store';
```

**项目当前真实写盘链路**：
```typescript
// first-runtime-store.ts
function writeRuntimeJson(path: string, data: unknown): void {
  assertValidFirstRuntimePath(path);
  writeJson(path, data);
}

// fs-utils.ts
writeFileSync(safePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
```

**根因**：未检查项目已有 runtime 写盘入口，直接手动拼接 JSON 字符串。

### 2.3 流程违反：未遵循"先读后写"原则

| 正确流程 | 实际执行 |
|---------|---------|
| 1. Grep 查找常量定义 | 1. 直接硬编码路径 ❌ |
| 2. 读取现有 builder 函数 | 2. 手动拼接 JSON ❌ |
| 3. 使用 `JSON.stringify()` | 3. 未验证就写入 ❌ |
| 4. 验证输出 `node -e "JSON.parse(...)"` | |

---

## 3. 解决方案

### 3.1 立即修复

```bash
# 1. 删除错误目录
rm -rf .config-first/

# 2. 恢复被污染的 README.md
git checkout origin/<branch> -- README.md

# 3. 验证正确文件存在且语法有效
for f in .spec-first/runtime/first/*.json; do
  node -e "JSON.parse(require('fs').readFileSync('$f'))" && echo "✓ $f"
done
```

### 3.2 预防措施

| 场景 | 错误模式 | 正确模式 |
|------|---------|---------|
| 文件路径 | 手动输入路径字符串 | `Grep` 搜索 `DIR`/`PATH` 常量定义 |
| JSON 生成 | 字符串模板拼接 | `JSON.stringify(data, null, 2)` |
| 目录创建 | 猜测命名规范 | 读取 `src/core/` 中的路径工具函数 |

### 3.3 代码级防护

**建议在 `first-runtime-store.ts` 中添加路径校验**：

```typescript
export function validateRuntimePath(targetPath: string): boolean {
  const expectedPrefix = '.spec-first/runtime/first';
  return targetPath.includes(expectedPrefix);
}

// 使用时
const targetPath = path.join(projectRoot, FIRST_RUNTIME_DIR, filename);
if (!validateRuntimePath(targetPath)) {
  throw new Error(`Invalid runtime path: ${targetPath}. Expected to contain ${FIRST_RUNTIME_DIR}`);
}
```

---

## 4. 经验教训

### 4.1 Spec-First 核心原则的违背

这次错误恰恰违背了 Spec-First 的核心原则：**规范驱动**。

- 正确做法：生成文件前，先读取项目中已定义的规范（常量、函数、类型）
- 错误做法：凭记忆或猜测操作

### 4.2 检查清单（Checklist）

在生成任何文件前，必须完成：

```
□ 路径：是否已查找项目中定义的路径常量？
□ 格式：是否使用 JSON.stringify() 而非手动拼接？
□ 验证：写入后是否执行语法校验？
□ 位置：是否确认写入路径与项目定义一致？
```

### 4.3 AI Agent 的局限性

- **记忆不可靠**：Agent 的"记忆"（训练数据中的模式）可能与当前项目不一致
- **必须读代码**：项目特定的常量、函数、类型必须从代码中读取，不能假设

---

## 5. 后续行动

| 行动项 | 负责人 | 状态 |
|--------|--------|------|
| 添加路径校验函数到 `first-runtime-store.ts` | — | 已完成 |
| 将路径校验收紧为精确目录边界匹配 | — | 已完成 |
| 添加 runtime 文件生成/路径断言单元测试 | — | 已完成 |
| 在 SKILL.md 中强调"先读后写"原则 | — | 待定 |

---

*文档生成时间: 2026-03-16*
