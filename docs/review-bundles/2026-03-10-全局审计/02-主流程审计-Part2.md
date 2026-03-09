# 主流程审计报告 - Part 2

## 二、ID 生成流程审计

### 2.1 nextId 流程追踪

**入口**: `src/core/trace-engine/id-generator.ts:29`

```
nextId({ type, abbr, featureId, projectRoot })
  ↓
validateAbbr(abbr)  // 校验缩写
  ↓
parseMatrixIds(matrixPath)  // 读取已有 ID
  ↓
findNextSeq()  // 计算序号
  ↓
assembleId()  // 组装 ID
  ↓
validateId()  // 校验格式
  ↓
appendToMatrix()  // 追加到矩阵
```

### 2.2 并发安全性验证

**代码**: id-generator.ts:29-49

```typescript
export function nextId(opts: NextIdOptions): NextIdResult {
  validateAbbr(opts.abbr);
  const matrixPath = getMatrixPath(opts.projectRoot, opts.featureId);
  const rows = parseMatrixIds(matrixPath);  // ❌ 读取
  const seq = findNextSeq(rows, opts.type, opts.abbr, opts.tcLevel);
  const id = assembleId(opts.type, opts.abbr, seq, opts.tcLevel);
  validateId(id);
  appendToMatrix(matrixPath, { id, type: opts.type, ... });  // ❌ 写入
  return { id, seq };
}
```

**结论**: ❌ 无锁保护，存在 TOCTOU 竞态

---

### 2.3 问题发现

#### 🔴 问题 3: nextId 并发竞态

**场景**:
```
进程 A: parseMatrixIds() → 读到最大序号 5
进程 B: parseMatrixIds() → 读到最大序号 5
进程 A: findNextSeq() → 返回 6
进程 B: findNextSeq() → 返回 6
进程 A: appendToMatrix() → 写入 FR-AUTH-006
进程 B: appendToMatrix() → 写入 FR-AUTH-006  // ❌ 重复
```

**证据**: 无锁机制，读写分离

**影响**: 并发生成相同 ID

---

#### 🔴 问题 4: appendToMatrix 非原子操作

**位置**: id-generator.ts:113-126

```typescript
function appendToMatrix(matrixPath: string, row: MatrixRow): void {
  if (!exists(matrixPath)) {
    const header = '| ID | Type | Title | Status | Upstream | Downstream |\n'
      + '|----|------|-------|--------|----------|------------|\n';
    writeMarkdown(matrixPath, header);  // ❌ 写入 1
  }
  const content = readMarkdown(matrixPath);  // ❌ 读取
  const newRow = `| ${row.id} | ${row.type} | ... |\n`;
  writeMarkdown(matrixPath, content + newRow);  // ❌ 写入 2
}
```

**风险**: 读-修改-写 非原子，可能丢失数据

---

#### 🟠 问题 5: 序号计算依赖字符串解析

**位置**: id-generator.ts:88-105

```typescript
function extractSeq(id: string, type: NextIdType, abbr: string, tcLevel?: TcLevel): number | null {
  const normalizedAbbr = abbr.replace(/-/g, '');
  let prefix: string;
  if (type === 'TC') {
    prefix = `TC-${tcLevel!}-${normalizedAbbr}-`;
  } else if (type === 'RFC') {
    prefix = 'RFC-';
  } else {
    prefix = `${type}-${normalizedAbbr}-`;
  }
  if (!id.startsWith(prefix)) return null;
  const seqStr = id.slice(prefix.length);
  const seq = parseInt(seqStr, 10);
  return isNaN(seq) ? null : seq;
}
```

**风险**: 如果矩阵中存在格式错误的 ID，可能导致序号计算错误

---

