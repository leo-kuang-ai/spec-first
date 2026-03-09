# Spec-First ID 关联性全局审查报告

**审查日期**: 2026-03-09
**审查范围**: ID 生成、校验、追溯矩阵、阶段流转、Skill 间传递
**审查方法**: 代码静态分析 + 逻辑推演

---

## 执行摘要

本次审查发现 **5 个严重问题** 和 **2 个中等问题**，涉及 ID 格式一致性、循环依赖检测、引用完整性校验等关键领域。

**严重程度分布**:
- 🔴 严重 (Critical): 3 个
- 🟠 高 (High): 2 个
- 🟡 中 (Medium): 2 个

---

## 问题清单

### 🔴 P0-1: 单字符缩写导致 ID 生成失败

**位置**:
- `src/core/trace-engine/id-validator.ts:8-23`
- `src/core/trace-engine/id-generator.ts:52-59`
- `src/core/process-engine/init.ts:47-53`

**问题描述**:
ID 校验正则要求缩写至少 2 个字符，但生成函数允许 1 个字符，导致不一致。

**详细分析**:
```typescript
// id-validator.ts - 要求 2-16 位
{ type: 'FR', regex: /^FR-[A-Z][A-Z0-9]{1,15}-\d{3}$/ }

// id-generator.ts - 允许 1-16 位
function validateAbbr(abbr: string): void {
  if (!/^[A-Z][A-Z0-9]{0,15}$/.test(normalized)) { // {0,15} = 1-16位
    throw new Error(...);
  }
}

// init.ts - 允许 1-16 位
function validateFeat(feat: string): void {
  if (!/^[A-Z][A-Z0-9]{0,15}$/.test(feat)) { // {0,15} = 1-16位
    throw new Error(...);
  }
}
```

**触发条件**: 用户使用单字符缩写（如 `feat="A"` 或 `abbr="B"`）

**后果**:
1. `nextId()` 函数在第 41-44 行抛出异常：`生成了无效 ID：FR-A-001`
2. Feature 初始化失败：`FSREQ-20260309-A-001` 无法通过校验
3. 用户体验差：错误信息不明确

**影响范围**: 所有 ID 类型（FR/DS/TASK/REQ/SYS/ARCH/MOD/ATP/STP/ITP/UTP/TC/Feature）

**修复方案**:
```typescript
// 方案1（推荐）：统一为 2-16 位
// id-generator.ts:52
function validateAbbr(abbr: string): void {
  const normalized = abbr.replace(/-/g, '');
  if (!/^[A-Z][A-Z0-9]{1,15}$/.test(normalized)) { // 改为 {1,15}
    throw new Error(
      `无效缩写 "${abbr}"：移除连字符后必须为 2-16 位、以 A-Z 开头、且仅包含 A-Z0-9`,
    );
  }
}

// init.ts:48
function validateFeat(feat: string): void {
  if (!/^[A-Z][A-Z0-9]{1,15}$/.test(feat)) { // 改为 {1,15}
    throw new Error(
      `无效 FEAT 缩写 "${feat}"：必须为 2-16 位、以 A-Z 开头、且仅包含 A-Z0-9`,
    );
  }
}
```

---

### 🔴 P0-2: REQ-PRD ID 格式未定义

**位置**:
- `src/core/trace-engine/id-validator.ts:8-23`
- `src/core/trace-engine/matrix.ts:72`
- `src/core/gate-engine/sca.ts:151,304`

**问题描述**:
代码中广泛使用 `REQ-PRD-NNN` 格式，但 `id-validator.ts` 没有对应的正则定义。

**详细分析**:
```typescript
// matrix.ts:72 - 检查 FR 是否有 PRD upstream
const hasPrd = (fr.upstream ?? []).some(u => u.startsWith('REQ-PRD-'));

// 但 id-validator.ts 只定义了 REQ 类型
{ type: 'REQ', regex: /^REQ-[A-Z][A-Z0-9]{1,15}-\d{3}$/ }
// REQ-PRD-001 不匹配此正则（PRD 不符合 [A-Z][A-Z0-9]{1,15}）
```

**后果**:
1. `parseMatrixContent()` 在第 159 行调用 `validateId('REQ-PRD-001')` 返回 `{ valid: false }`
2. 第 160 行 fallback：`const type: IdType = validation.type ?? 'Feature'`
3. REQ-PRD-001 被错误识别为 Feature 类型
4. 追溯矩阵数据错误，影响覆盖率计算

**影响范围**: 所有使用 REQ-PRD 的场景（PRD→FR 映射检查）

**修复方案**:
```typescript
// id-validator.ts:8 - 添加 REQ-PRD 类型
const ID_PATTERNS: ReadonlyArray<{ type: IdType; regex: RegExp }> = [
  { type: 'Feature', regex: /^FSREQ-\d{8}-[A-Z][A-Z0-9]{1,15}-\d{3}$/ },
  { type: 'FR',      regex: /^FR-[A-Z][A-Z0-9]{1,15}-\d{3}$/ },
  { type: 'DS',      regex: /^DS-[A-Z][A-Z0-9]{1,15}-\d{3}$/ },
  { type: 'TASK',    regex: /^TASK-[A-Z][A-Z0-9]{1,15}-\d{3}$/ },
  { type: 'REQ-PRD', regex: /^REQ-PRD-[A-Z][A-Z0-9]{1,15}-\d{3}$/ }, // 新增
  { type: 'REQ',     regex: /^REQ-[A-Z][A-Z0-9]{1,15}-\d{3}$/ },
  // ... 其他类型
];

// shared/types.ts:27 - 更新类型定义
export type NextIdType =
  | 'FR' | 'DS' | 'TASK' | 'TC' | 'RFC'
  | 'REQ' | 'REQ-PRD' | 'SYS' | 'ARCH' | 'MOD' // 添加 REQ-PRD
  | 'ATP' | 'STP' | 'ITP' | 'UTP';
```

---

### 🔴 P0-3: 循环依赖静默处理

**位置**: `src/core/trace-engine/upstream-lineage.ts:20-41`

**问题描述**:
检测到循环依赖时返回空集合，不报告警告或错误。

**详细分析**:
```typescript
const getAncestors = (id: string, stack = new Set<string>()): ReadonlySet<string> => {
  const cached = cache.get(id);
  if (cached) return cached;
  if (stack.has(id)) return new Set<string>(); // 静默返回空集合

  stack.add(id);
  const ancestors = new Set<string>();
  // ... 递归逻辑
  stack.delete(id);
  return ancestors;
};
```

**场景示例**:
```
TASK-A-001 upstream: [TASK-A-002]
TASK-A-002 upstream: [TASK-A-003]
TASK-A-003 upstream: [TASK-A-001]  // 循环！
```

**后果**:
1. `getAncestors('TASK-A-001')` 返回 `{TASK-A-002, TASK-A-003}`，但不报告循环
2. 用户无法发现循环依赖
3. 覆盖率计算可能不准确
4. `checkMatrix()` 没有专门的循环检测

**影响范围**: 所有依赖 `UpstreamLineage` 的功能（覆盖率、断链检测）

**修复方案**:
```typescript
// upstream-lineage.ts - 添加循环检测
export interface UpstreamLineage {
  rowIndex: ReadonlyMap<string, MatrixRow>;
  getAncestors(id: string): ReadonlySet<string>;
  hasAnyAncestor(id: string, targetIds: ReadonlySet<string>): boolean;
  collectCoveredTargetIds(startIds: Iterable<string>, targetIds: ReadonlySet<string>): Set<string>;
  detectCycles(): Array<{ cycle: string[]; description: string }>; // 新增
}

export function createUpstreamLineage(rows: MatrixRow[]): UpstreamLineage {
  const rowIndex = buildRowIndex(rows);
  const cache = new Map<string, ReadonlySet<string>>();
  const cycles: Array<{ cycle: string[]; description: string }> = [];

  const getAncestors = (id: string, stack = new Set<string>()): ReadonlySet<string> => {
    const cached = cache.get(id);
    if (cached) return cached;

    if (stack.has(id)) {
      // 记录循环
      const cycleArray = Array.from(stack);
      const startIdx = cycleArray.indexOf(id);
      const cycle = [...cycleArray.slice(startIdx), id];
      cycles.push({
        cycle,
        description: `Circular dependency: ${cycle.join(' → ')}`
      });
      return new Set<string>();
    }
    // ... 其余逻辑
  };

  return {
    rowIndex,
    getAncestors,
    hasAnyAncestor,
    collectCoveredTargetIds,
    detectCycles: () => cycles,
  };
}

// matrix.ts - 在 checkMatrix 中添加循环检测
export function checkMatrix(featureId: string, projectRoot: string): MatrixCheckResult {
  const rows = parseMatrix(featureId, projectRoot);
  const warnings: string[] = [];
  const trace = createTraceContext(rows);

  // 检测循环依赖
  const cycles = trace.lineage.detectCycles();
  for (const { cycle, description } of cycles) {
    warnings.push(`Circular dependency: ${description}`);
  }

  // ... 其余检查
}
```

---

### 🟠 P1-1: 缺少引用存在性检查

**位置**: `src/core/trace-engine/matrix.ts:54-95`

**问题描述**:
`checkMatrix()` 没有验证 upstream/downstream 引用的 ID 是否存在于矩阵中。

**场景示例**:
```markdown
| FR-AUTH-001 | FR | Login | Planned | REQ-NONEXIST-001 | DS-AUTH-001 |
| DS-AUTH-001 | DS | Design | Planned | FR-AUTH-001 | TASK-GHOST-999 |
```

**后果**:
- 断链（引用不存在的 ID）不被检测
- 追溯链不完整
- 用户难以发现数据错误

**修复方案**:
```typescript
// matrix.ts - 添加引用存在性检查
export function checkMatrix(featureId: string, projectRoot: string): MatrixCheckResult {
  const rows = parseMatrix(featureId, projectRoot);
  const warnings: string[] = [];
  const trace = createTraceContext(rows);
  const allIds = new Set(rows.map(r => r.id));

  // 检查引用存在性
  const brokenRefs: Array<{ id: string; refType: 'upstream' | 'downstream'; missing: string[] }> = [];
  for (const row of rows) {
    const missingUpstream = (row.upstream ?? []).filter(id => !allIds.has(id));
    const missingDownstream = (row.downstream ?? []).filter(id => !allIds.has(id));

    if (missingUpstream.length > 0) {
      brokenRefs.push({ id: row.id, refType: 'upstream', missing: missingUpstream });
      warnings.push(`Broken reference: ${row.id} upstream references non-existent ${missingUpstream.join(', ')}`);
    }
    if (missingDownstream.length > 0) {
      brokenRefs.push({ id: row.id, refType: 'downstream', missing: missingDownstream });
      warnings.push(`Broken reference: ${row.id} downstream references non-existent ${missingDownstream.join(', ')}`);
    }
  }

  return { total: rows.length, orphans, brokenChains, vModelPairs, brokenRefs, warnings };
}
```

---

### 🟠 P1-2: 缺少自引用检查

**位置**: `src/core/trace-engine/matrix.ts:54-95`

**问题描述**:
没有检测 ID 的 upstream/downstream 是否包含自己。

**场景示例**:
```markdown
| FR-AUTH-001 | FR | Login | Planned | FR-AUTH-001 | DS-AUTH-001 |
```

**后果**:
- 可能导致无限循环
- `getAncestors()` 会检测到并返回空集合，但不报告

**修复方案**:
```typescript
// matrix.ts - 添加自引用检查
for (const row of rows) {
  if (row.upstream?.includes(row.id)) {
    warnings.push(`Self-reference: ${row.id} references itself in upstream`);
  }
  if (row.downstream?.includes(row.id)) {
    warnings.push(`Self-reference: ${row.id} references itself in downstream`);
  }
}
```

---

```

---

### 🟡 M1: 阶段流转时 ID 状态未同步

**位置**: `src/core/process-engine/advance.ts`

**问题描述**: 阶段推进时，只更新 `stage-state.json`，没有同步更新追溯矩阵中相关 ID 的状态。

**场景示例**: Stage 从 `03_plan` 推进到 `04_implement`，矩阵中 TASK 状态仍为 `Planned`，应更新为 `Implemented`

**影响**: 矩阵状态与实际阶段不一致，影响度量准确性

**修复建议**: 在 `advance()` 函数中添加矩阵状态同步逻辑

---

### 🟡 M2: Skill 间产物传递缺少 ID 校验

**位置**: `src/core/skill-runtime/dispatcher.ts`

**问题描述**: Skill 间传递 featureId 时，没有校验其格式合法性。

**场景示例**: `.spec-first/current` 文件被手动修改为无效 ID，后续 Skill 读取后直接使用，可能导致路径错误

**影响**: 运行时错误，用户体验差

**修复建议**: 在 `readCurrentFeatureId()` 中添加 ID 格式校验

---

## 修复优先级建议

### 立即修复 (本周内)

1. **P0-1**: 单字符缩写问题 - 影响所有 ID 生成
2. **P0-2**: REQ-PRD 格式未定义 - 影响追溯矩阵准确性

### 短期修复 (2周内)

3. **P0-3**: 循环依赖检测 - 添加警告机制
4. **P1-1**: 引用存在性检查 - 防止断链
5. **P1-2**: 自引用检查 - 防止无限循环

### 中期优化 (1个月内)

6. **M1**: 阶段流转状态同步
7. **M2**: Skill 间 ID 校验

---

## 测试建议

### 单元测试补充

```typescript
// tests/unit/id-consistency.test.ts
describe('ID Consistency', () => {
  it('should reject single-char abbreviation', () => {
    expect(() => validateAbbr('A')).toThrow('必须为 2-16 位');
  });

  it('should validate REQ-PRD format', () => {
    const result = validateId('REQ-PRD-AUTH-001');
    expect(result.valid).toBe(true);
    expect(result.type).toBe('REQ-PRD');
  });

  it('should detect circular dependencies', () => {
    const rows = [
      { id: 'TASK-A-001', upstream: ['TASK-A-002'] },
      { id: 'TASK-A-002', upstream: ['TASK-A-001'] },
    ];
    const lineage = createUpstreamLineage(rows);
    const cycles = lineage.detectCycles();
    expect(cycles.length).toBeGreaterThan(0);
  });
});
```

---

## 结论

本次审查发现的问题主要集中在 **ID 格式一致性** 和 **引用完整性校验** 两个方面。

**关键发现**:

1. ID 生成与校验存在格式不一致，可能导致运行时错误
2. 循环依赖和断链检测不完善，影响追溯链准确性
3. 缺少全面的引用完整性校验机制

**下一步行动**:

1. 按优先级修复问题
2. 补充单元测试覆盖
3. 建立 ID 一致性 CI 检查
4. 更新文档说明 ID 格式规范

---

**审查人**: Claude (AI Assistant)  
**审查日期**: 2026-03-09  
**报告版本**: v1.0
