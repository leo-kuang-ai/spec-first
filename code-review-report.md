# 代码质量与安全审查报告

**审查时间**: 2026-03-13
**审查范围**: Gate 优化、Profile 机制、Warning 语义
**变更规模**: 59 文件，+497/-10652 行

---

## 执行摘要

本次变更实现了 Gate 条件简化和 Profile 机制，整体架构设计合理，但存在 **3 个关键问题** 和 **5 个中等风险点** 需要修复。

**关键发现**：
- ✅ 类型安全：blocking 字段定义完整，向后兼容处理正确
- ✅ 逻辑正确性：warning 语义实现符合预期
- ⚠️ 边界条件：存在 undefined 处理缺失
- ⚠️ 安全风险：删除 Gate 条件可能引入质量漏洞
- ⚠️ 测试覆盖：部分边界场景缺少测试

---

## 1. 类型安全问题

### [MEDIUM] blocking 字段类型不一致

**文件**: `src/shared/types.ts:114`, `src/core/gate-engine/condition-registry.ts:20-21`

**问题描述**:
- `ConditionResult.blocking` 定义为 `boolean | undefined`
- `GateConditionDef.blocking` 定义为 `boolean | undefined`
- `evaluate()` 返回值中 `blocking` 也是 `boolean | undefined`

三处定义一致，但在实际使用中存在隐式假设：
```typescript
// gate-evaluator.ts:93
blocking: result.blocking ?? def.blocking,
```

当 `result.blocking` 和 `def.blocking` 都是 `undefined` 时，最终值为 `undefined`，但后续逻辑中：
```typescript
// gate-evaluator.ts:119
const blockingFailures = conditions.filter((c) => c.status === 'FAIL' && c.blocking !== false);
```

这里使用 `!== false` 来判断，意味着 `undefined` 会被视为 `true`（阻塞）。

**影响**:
- 逻辑正确，但隐式约定不够明确
- 未来维护者可能误解 `undefined` 的语义

**建议**:
```typescript
// 方案1: 明确默认值
blocking: result.blocking ?? def.blocking ?? true,

// 方案2: 在类型定义中添加注释
export interface ConditionResult {
  // ...
  /** false 表示 warning-only，不阻塞流程；undefined 或 true 表示阻塞（默认阻塞） */
  blocking?: boolean;
}
```

---

## 2. 向后兼容问题

### [LOW] 历史 gate-history.jsonl 读取兼容性

**文件**: `tests/unit/gate-evaluator.test.ts:567-580`

**问题描述**:
测试用例验证了读取不含 `blocking` 字段的历史记录，但未验证写入后的持久化格式。

**影响**:
- 低风险，测试已覆盖读取场景
- 但缺少对新格式写入的验证

**建议**:
添加测试验证新格式持久化：
```typescript
it('should persist blocking=false for warning conditions', () => {
  // ... 触发 warning 条件
  const history = getGateHistory(FEAT, TMP);
  const warningCond = history[0].conditions.find(c => c.blocking === false);
  expect(warningCond).toBeDefined();
});
```

**状态**: ✅ 已有测试 `tests/unit/gate-evaluator.test.ts:549-565`

---

### [LOW] profile 默认值处理

**文件**: `src/shared/config-schema.ts:96`, `src/core/process-engine/layer-merger.ts:545`

**问题描述**:
- `config-schema.ts` 中默认值为 `'default-simplified'`
- `layer-merger.ts` 直接从 config 读取，未做 fallback
- 多处使用 `?? 'default-simplified'` 作为兜底

**影响**:
- 低风险，多层防御已到位
- 但存在冗余的 fallback 逻辑

**建议**:
统一在 `mergeLayerRules` 中处理默认值，避免散落各处：
```typescript
return {
  profile: config.gate.profile ?? 'default-simplified',
  // ...
};
```

**状态**: ✅ 当前实现已足够安全

---

## 3. 逻辑正确性问题

### [CRITICAL] strict profile 下 warning 提升逻辑不完整

**文件**: `src/core/gate-engine/gate-evaluator.ts:46-57`

**问题描述**:
```typescript
if (profile !== 'strict') return filtered;

// strict 不恢复已删除 Gate，但会把默认 warning 提升为 blocking
return filtered.map((c) =>
  c.blocking === false
    ? {
        ...c,
        blocking: true,
        description: c.description.replace(/\s*\(warning\)\s*/i, ''),
      }
    : c
);
```

问题：
1. **只处理了 Layer1 内置条件**，未处理 Layer2/Layer3 自定义条件
2. Layer2 命令条件在 `evaluateGate` 中执行时，没有应用 profile 提升逻辑
3. 可能导致 strict 模式下，自定义 warning 条件仍然不阻塞

**影响**:
- **高风险**：strict 模式语义不完整
- 用户期望 strict 模式下所有 warning 都阻塞，但实际只对内置条件生效

**建议**:
在 `evaluateGate` 中统一处理：
```typescript
// Layer2 命令 Gate 执行后
for (const l2 of l2Conditions) {
  if (!l2.command || evaluatedIds.has(l2.id)) continue;
  const cmdResult = runCommandGate(l2.command, projectRoot);
  const blocking = profile === 'strict' ? true : (l2.blocking ?? true);
  conditions.push({
    id: l2.id,
    description: l2.description,
    status: cmdResult.pass ? 'PASS' : 'FAIL',
    detail: cmdResult.detail,
    blocking,
  });
}
```

---

### [HIGH] warning 条件不记录到 suggestions

**文件**: `src/core/gate-engine/gate-evaluator.ts:166-170`

**问题描述**:
```typescript
suggestions: hasBlockingFailure
  ? conditions
      .filter((c) => c.status === 'FAIL' && c.blocking !== false)
      .map((c) => `Fix: ${c.description} (${c.detail ?? ''})`)
  : undefined,
```

当 Gate 状态为 `PASS` 但存在 warning 时，`suggestions` 为 `undefined`，用户无法看到警告信息。

**影响**:
- **中等风险**：用户体验问题
- warning 信息丢失，用户不知道有哪些质量问题

**建议**:
分离 blocking 和 warning 的 suggestions：
```typescript
const blockingSuggestions = conditions
  .filter((c) => c.status === 'FAIL' && c.blocking !== false)
  .map((c) => `Fix: ${c.description} (${c.detail ?? ''})`);

const warningSuggestions = conditions
  .filter((c) => c.status === 'FAIL' && c.blocking === false)
  .map((c) => `Warning: ${c.description} (${c.detail ?? ''})`);

return {
  // ...
  suggestions: blockingSuggestions.length > 0 ? blockingSuggestions : undefined,
  warnings: warningSuggestions.length > 0 ? warningSuggestions : undefined,
};
```

**当前缓解措施**:
- `advance.ts:160-163` 中已将 warning 写入 findings.md
- `gate.ts:220-223` 中已将 warning 追加到 findings
- 但 GateResult 类型中缺少 warnings 字段

---

### [MEDIUM] Layer2 命令条件缺少 blocking 字段

**文件**: `src/core/gate-engine/gate-evaluator.ts:106-115`

**问题描述**:
```typescript
for (const l2 of l2Conditions) {
  if (!l2.command || evaluatedIds.has(l2.id)) continue;
  const cmdResult = runCommandGate(l2.command, projectRoot);
  conditions.push({
    id: l2.id,
    description: l2.description,
    status: cmdResult.pass ? 'PASS' : 'FAIL',
    detail: cmdResult.detail,
    // ❌ 缺少 blocking 字段
  });
}
```

**影响**:
- Layer2 命令条件的 `blocking` 字段为 `undefined`
- 根据后续逻辑，会被视为 `true`（阻塞）
- 如果 Layer2 条件需要支持 warning 语义，当前实现不支持

**建议**:
1. 如果 Layer2 不需要 warning 语义，添加注释说明
2. 如果需要支持，从 `mergedRules.gateConditions` 中读取 `blocking` 字段：
```typescript
const l2Conditions = (state.mergedRules?.gateConditions?.[stage] ?? []) as Array<{
  id: string;
  description: string;
  command?: string;
  blocking?: boolean;  // 新增
}>;

// ...
conditions.push({
  id: l2.id,
  description: l2.description,
  status: cmdResult.pass ? 'PASS' : 'FAIL',
  detail: cmdResult.detail,
  blocking: l2.blocking,  // 传递
});
```

---

## 4. 边界条件问题

### [MEDIUM] profile 字段校验不严格

**文件**: `src/shared/config-schema.ts:274-276`

**问题描述**:
```typescript
if (gate?.profile && ['default-simplified', 'strict'].includes(String(gate.profile))) {
  cfg.gate.profile = gate.profile as SpecFirstConfig['gate']['profile'];
}
```

问题：
1. 使用 `String(gate.profile)` 转换，可能接受非字符串值
2. 类型断言 `as` 绕过了类型检查
3. 无效值会被静默忽略，使用默认值

**影响**:
- 低风险，但可能导致配置错误难以排查
- 用户配置了错误的 profile 值，但没有任何提示

**建议**:
```typescript
if (gate?.profile) {
  if (gate.profile === 'default-simplified' || gate.profile === 'strict') {
    cfg.gate.profile = gate.profile;
  } else {
    console.warn(`Invalid gate.profile: ${gate.profile}, using default: default-simplified`);
  }
}
```

---

### [LOW] 空数组处理

**文件**: `src/core/gate-engine/gate-evaluator.ts:119-145`

**问题描述**:
```typescript
const blockingFailures = conditions.filter((c) => c.status === 'FAIL' && c.blocking !== false);

if (blockingFailures.length > 0) {
  // 豁免匹配逻辑
}
```

当 `conditions` 为空数组时，逻辑正确，但缺少对异常场景的日志记录。

**影响**:
- 极低风险，空数组是合法场景（某些阶段无 Gate 条件）
- 但可能掩盖配置错误

**建议**:
添加调试日志：
```typescript
if (conditions.length === 0) {
  console.warn(`No gate conditions defined for stage: ${stage}`);
}
```

---

### [LOW] scopeFrIds 为空数组时的豁免匹配

**文件**: `src/core/gate-engine/gate-evaluator.ts:126-128`

**问题描述**:
```typescript
const matched = blockingFailures.filter(
  (c) => Array.isArray(c.scopeFrIds) && c.scopeFrIds.includes(ex.frId)
);
```

当 `scopeFrIds` 为空数组 `[]` 时，不会匹配任何豁免。这是正确的行为，但缺少文档说明。

**影响**:
- 无风险，逻辑正确
- 但可能导致用户困惑：为什么某些条件无法豁免

**建议**:
在 `ConditionResult` 类型定义中添加注释：
```typescript
export interface ConditionResult {
  // ...
  /**
   * 与该条件失败直接相关的 FR 列表，用于精确豁免匹配
   * 空数组或 undefined 表示该条件不支持豁免
   */
  scopeFrIds?: string[];
}
```

---

## 5. 安全风险

### [HIGH] 删除 Gate 条件引入的质量漏洞

**文件**: `src/core/gate-engine/condition-registry.ts`

**问题描述**:
以下 Gate 条件被删除：
- `G-SPEC-01`: Design coverage (C1) = 100%
- `G-DESIGN-02`: API coverage (C2) = 100%
- `G-IMPL-02`: PR compliance (C7) = 100%
- `G-VERIFY-02`: Test coverage AC (C5) ≥ 90%

**影响**:
- **高风险**：质量门禁降低
- C1/C2/C5/C7 不再强制检查，可能导致：
  - 设计文档缺失
  - API 规范不完整
  - PR 不关联 TASK
  - AC 测试覆盖不足

**缓解措施**:
1. ✅ 这些指标仍在 metrics 中计算（health-score.ts）
2. ✅ strict profile 可以恢复部分检查（但当前实现未恢复已删除的 Gate）
3. ⚠️ default-simplified 模式下完全不检查

**建议**:
1. **短期**: 在文档中明确说明 default-simplified 的风险
2. **中期**: 考虑将 C1/C2/C7 降级为 warning 而非删除
3. **长期**: 提供 profile 自定义机制，允许团队选择性启用

**风险评估**:
- 对于成熟团队：可接受（依赖流程规范）
- 对于新团队：高风险（缺少自动化保障）

---

### [MEDIUM] frontend 项目跳过测试 Gate 的安全性

**文件**: `src/core/gate-engine/condition-registry.ts:261-268`

**问题描述**:
```typescript
export function shouldSkipCondition(conditionId: string, projectType: string): boolean {
  if (projectType === 'css-only' || projectType === 'frontend') {
    return ['G-IMPL-01', 'G-VERIFY-01', 'PYTEST', 'DIFF-COV'].some((id) =>
      conditionId.includes(id)
    );
  }
  return false;
}
```

frontend 项目跳过所有测试相关 Gate，可能导致：
- 前端代码无单元测试
- 质量完全依赖人工审查

**影响**:
- 中等风险，取决于团队测试文化
- 对于无测试基础设施的前端项目合理
- 但可能被滥用

**建议**:
1. 添加配置项控制是否跳过：
```yaml
gate:
  profile: default-simplified
  skip_test_gates_for_frontend: true  # 显式配置
```

2. 在 constitution.md 中要求说明原因：
```markdown
## 项目类型
frontend

## 测试策略
跳过自动化测试 Gate，原因：
- 使用 Cypress E2E 测试替代单元测试
- 测试覆盖率通过 CI 单独检查
```

---

### [LOW] pilot_mode 错误处理信息泄露

**文件**: `src/core/process-engine/advance.ts:187-193`

**问题描述**:
```typescript
const errorMsg = e instanceof Error ? e.message : String(e);
const errorStack = e instanceof Error ? e.stack : undefined;
// ...
`PILOT_PASS: ${from} → ${to} (gate runtime error: ${errorMsg}${errorStack ? '\nStack: ' + errorStack : ''})`
```

将完整的错误堆栈写入 findings.md，可能泄露：
- 文件系统路径
- 内部实现细节
- 敏感配置信息

**影响**:
- 低风险，findings.md 通常不对外公开
- 但在开源项目中可能暴露内部结构

**建议**:
```typescript
const errorMsg = e instanceof Error ? e.message : String(e);
// 仅在开发环境记录堆栈
const errorDetail = process.env.NODE_ENV === 'development' && e instanceof Error
  ? `\nStack: ${e.stack}`
  : '';
appendFindings(
  featureId,
  projectRoot,
  `PILOT_PASS: ${from} → ${to} (gate runtime error: ${errorMsg}${errorDetail})`
);
```

---

## 6. 测试覆盖缺口

### [MEDIUM] 缺少 profile 切换的集成测试

**文件**: `tests/unit/gate-evaluator.test.ts`

**问题描述**:
- 有单元测试验证 strict profile 提升 warning
- 缺少测试验证 profile 在完整流程中的行为：
  - init → advance → gate check → advance
  - profile 从 config 读取 → layer-merger 合并 → gate-evaluator 使用

**影响**:
- 中等风险，可能存在集成问题
- 例如：config 更新后，已存在的 stage-state 未同步

**建议**:
添加集成测试 `tests/integration/profile-flow.test.ts`：
```typescript
it('should respect profile throughout feature lifecycle', () => {
  // 1. 配置 strict profile
  writeConfig({ gate: { profile: 'strict' } });

  // 2. init feature
  init('FEAT-001', 'N', 'M', ['h5']);

  // 3. 验证 mergedRules.profile
  const state = readState('FEAT-001');
  expect(state.mergedRules.profile).toBe('strict');

  // 4. advance 到 01_specify，触发 warning 条件
  // 5. 验证 Gate 失败（strict 模式下 warning 阻塞）
});
```

---

### [MEDIUM] 缺少 Layer2 命令条件的 blocking 测试

**文件**: 无

**问题描述**:
当前测试未覆盖 Layer2 命令条件的 blocking 行为。

**影响**:
- 中等风险，Layer2 条件可能行为不符合预期

**建议**:
添加测试：
```typescript
it('should treat Layer2 command conditions as blocking by default', () => {
  writeState('01_specify', 'N', 'M', {
    gateConditions: {
      '01_specify': [
        { id: 'CUSTOM-01', description: 'Custom check', command: 'exit 1' }
      ]
    }
  });

  const result = evaluateGate('FEAT-001', TMP);
  const customCond = result.conditions.find(c => c.id === 'CUSTOM-01');
  expect(customCond?.status).toBe('FAIL');
  expect(customCond?.blocking).toBeUndefined(); // 默认阻塞
  expect(result.status).toBe('FAIL');
});
```

---

### [LOW] 缺少 health-score profile 参数的边界测试

**文件**: `tests/unit/metrics-engine.test.ts`

**问题描述**:
- 测试了 default-simplified 和 strict 的基本场景
- 缺少边界测试：
  - profile 参数为 `undefined`
  - profile 参数为非法值（如 `'invalid'`）

**影响**:
- 低风险，当前实现使用 `=== 'strict'` 判断，非法值会 fallback 到 default

**建议**:
添加测试：
```typescript
it('should fallback to default-simplified for invalid profile', () => {
  const coverage = makeCoverage();
  const result = calcHealthScore(coverage, 0, 0, 'invalid' as any);
  expect(Object.keys(result.breakdown)).toHaveLength(5); // default 只有 5 个指标
});
```

---

### [LOW] 缺少 dependency-checker profile 的负面测试

**文件**: `tests/unit/dependency-checker.test.ts`

**问题描述**:
- 测试了 strict 模式检查 npm scripts
- 测试了 default-simplified 跳过 npm scripts
- 缺少测试：profile 参数为 `undefined` 时的行为

**影响**:
- 低风险，代码中有默认值 `= 'default-simplified'`

**建议**:
添加测试验证默认行为：
```typescript
it('should use default-simplified when profile is undefined', () => {
  writeFileSync(join(TEST_ROOT, 'package.json'), JSON.stringify({ scripts: {} }));
  const result = checkDependencies(FEATURE_ID, Stage.IMPLEMENT, TEST_ROOT, undefined);
  expect(result.pass).toBe(true);
});
```

**状态**: ✅ 已有测试 `tests/unit/dependency-checker.test.ts:65-69`

---

## 7. 代码质量问题

### [LOW] 重复的 profile 读取逻辑

**文件**: 多处

**问题描述**:
以下文件都有 `state.mergedRules?.profile ?? 'default-simplified'`：
- `src/core/gate-engine/gate-evaluator.ts:81`
- `src/core/process-engine/advance.ts:130`
- `src/cli/commands/metrics.ts:118`
- `src/cli/commands/gate.ts:136`

**影响**:
- 低风险，但增加维护成本
- 如果默认值需要修改，需要改多处

**建议**:
提取为工具函数：
```typescript
// src/shared/profile-utils.ts
export function getProfile(state: StageState): 'default-simplified' | 'strict' {
  return state.mergedRules?.profile ?? 'default-simplified';
}
```

---

### [LOW] 魔法字符串

**文件**: 多处

**问题描述**:
`'default-simplified'` 和 `'strict'` 作为字符串字面量散落各处。

**影响**:
- 低风险，但容易拼写错误

**建议**:
定义常量：
```typescript
// src/shared/types.ts
export const PROFILE = {
  DEFAULT: 'default-simplified',
  STRICT: 'strict',
} as const;

export type Profile = typeof PROFILE[keyof typeof PROFILE];
```

---

## 8. 性能问题

### [LOW] getConditions 重复调用

**文件**: `src/core/gate-engine/gate-evaluator.ts:82`, `src/cli/commands/gate.ts:137`

**问题描述**:
`getConditions` 在每次调用时都会：
1. 读取 GATE_CONDITIONS
2. 过滤 projectType
3. 应用 profile 转换

对于同一 stage，可能被多次调用。

**影响**:
- 极低风险，计算量很小
- 但在批量操作时可能累积

**建议**:
如果性能成为问题，可以添加缓存：
```typescript
const conditionsCache = new Map<string, GateConditionDef[]>();

export function getConditions(stage: Stage, projectType?: string, profile?: string): GateConditionDef[] {
  const cacheKey = `${stage}:${projectType}:${profile}`;
  if (conditionsCache.has(cacheKey)) {
    return conditionsCache.get(cacheKey)!;
  }

  const result = /* 当前逻辑 */;
  conditionsCache.set(cacheKey, result);
  return result;
}
```

**当前评估**: 不需要优化，过早优化

---

## 总结

### 关键问题数：3

1. **[CRITICAL]** strict profile 下 Layer2 条件未提升 blocking
2. **[HIGH]** warning 条件不记录到 suggestions，用户体验差
3. **[HIGH]** 删除 Gate 条件引入质量漏洞风险

### 建议优先修复：

**P0 (立即修复)**:
1. 修复 strict profile 下 Layer2 条件的 blocking 提升逻辑
2. 在 GateResult 中添加 warnings 字段，改善用户体验

**P1 (本周修复)**:
3. 为 Layer2 命令条件添加 blocking 字段支持
4. 添加 profile 切换的集成测试
5. 改进 profile 字段校验，添加警告日志

**P2 (下个迭代)**:
6. 提取 profile 读取逻辑为工具函数
7. 定义 PROFILE 常量，消除魔法字符串
8. 完善文档，说明 default-simplified 的风险

### 整体评价

本次变更的架构设计合理，blocking 字段和 warning 语义的实现基本正确。主要问题集中在：
1. strict profile 的实现不完整
2. 用户体验细节需要打磨
3. 测试覆盖需要补充边界场景

建议在修复 P0/P1 问题后再合并到主分支。

---

**审查人**: Claude (AI Code Reviewer)
**审查方法**: 静态代码分析 + 测试覆盖分析 + 安全风险评估
