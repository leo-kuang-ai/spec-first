# 关键问题清单

**生成时间**: 2026-03-13
**优先级**: P0 (阻塞合并) + P1 (建议修复)

---

## P0 - 必须修复（阻塞合并）

### Issue #1: C2 删除导致需求-设计追溯链断裂

**严重程度**: HIGH
**影响范围**: 02_design 阶段质量门禁
**发现来源**: 安全审查 agent

**问题描述**:
- C2 (DS-API 追溯) 在 Task 1.3 中被完全删除
- 原本要求 API 设计 100% 覆盖需求
- 删除后可能导致需求未被 API 设计覆盖就进入开发阶段

**影响**:
- 需求到 API 设计的强制追溯被阻断
- 设计阶段质量门禁弱化
- 可能出现"孤儿需求"（有需求但无对应 API 设计）

**修复建议**:
恢复 C2 检查，但设为 warning-only（而非完全删除）

```typescript
// src/core/gate-engine/condition-registry.ts
// 在 02_design 阶段添加

{
  id: 'G-DESIGN-02',
  description: 'API coverage (C2) = 100% (warning)',
  blocking: false,  // warning-only
  evaluate: (ctx) => {
    const c2 = evaluateApiCoverage(ctx.featureId, ctx.projectRoot);
    const dsIds = ctx.rows.filter((r) => r.type === 'DS').map((r) => r.id);
    return {
      pass: c2 >= 100,
      detail: `C2=${c2}%`,
      scopeFrIds: dsIds,
      blocking: false
    };
  }
}
```

**验收标准**:
- [ ] condition-registry.ts 中添加 G-DESIGN-02
- [ ] blocking: false 确保不阻断流程
- [ ] 测试覆盖新增条件

---

### Issue #2: Warning 未持久化到 findings.md

**严重程度**: MEDIUM
**影响范围**: 用户体验、审计追溯
**发现来源**: 代码质量审查 agent

**问题描述**:
- Task 2.3 要求将 warning 写入 findings.md
- 但 advance.ts 中未实现此逻辑
- 用户无法查看历史 warning 记录

**影响**:
- Warning 容易被忽略（只在 CLI 输出中显示一次）
- 缺少审计追溯能力
- 无法统计 warning 趋势

**修复建议**:
在 advance.ts 的 Gate 评估后添加 warning 持久化逻辑

```typescript
// src/core/process-engine/advance.ts
// 在 evaluateGate() 调用后添加

if (gateResult.status === 'PASS' || gateResult.status === 'PASS_WITH_WAIVER') {
  // 持久化 warnings
  const warnings = gateResult.conditions.filter(
    (c) => c.status === 'FAIL' && c.blocking === false
  );

  for (const w of warnings) {
    const msg = `GATE_WARNING: ${w.id} - ${w.description} (${w.detail ?? 'no detail'})`;
    appendFindings(featureId, projectRoot, msg);
  }
}
```

**验收标准**:
- [ ] advance.ts 中添加 warning 持久化逻辑
- [ ] findings.md 包含 GATE_WARNING 条目
- [ ] 测试覆盖持久化逻辑

---

## P1 - 建议修复（不阻塞合并）

### Issue #3: Strict profile 下 Layer2 条件未提升 blocking

**严重程度**: MEDIUM
**影响范围**: Profile 机制完整性
**发现来源**: 代码质量审查 agent

**问题描述**:
- getConditions() 接收 profile 参数但未用于 Layer2 条件过滤
- Strict 模式无法将 Layer2 命令条件从 warning 提升为 blocking
- Profile 机制不完整

**影响**:
- Strict 模式无法增强检查
- Layer2 条件始终为 warning（即使在 strict 下）

**修复建议**:
在 getConditions() 中补充 profile 过滤逻辑

```typescript
// src/core/gate-engine/gate-evaluator.ts

export function getConditions(
  stage: Stage,
  projectType?: string,
  profile?: string
): GateConditionDef[] {
  const allConditions = GATE_CONDITIONS[stage] ?? [];

  // 1. projectType 过滤
  let filtered = projectType
    ? allConditions.filter((c) => !shouldSkipCondition(c.id, projectType))
    : allConditions;

  // 2. profile 过滤（新增）
  if (profile === 'strict') {
    // Strict 模式下，将 Layer2 命令条件的 blocking 提升为 true
    filtered = filtered.map((c) => {
      if (c.id.startsWith('G-CMD-')) {
        return { ...c, blocking: true };
      }
      return c;
    });
  }

  return filtered;
}
```

**验收标准**:
- [ ] getConditions() 中添加 profile 过滤逻辑
- [ ] Strict 模式下 Layer2 条件 blocking 为 true
- [ ] 测试覆盖 strict 模式

---

### Issue #4: C5 删除导致验收测试覆盖率弱化

**严重程度**: MEDIUM
**影响范围**: 05_verify 阶段质量门禁
**发现来源**: 安全审查 agent

**问题描述**:
- C5 (TASK-TC 追溯) 在 Task 1.3 中被完全删除
- 原本要求 M/L 项目验收测试覆盖率 ≥ 90%
- 删除后只保留 C4 (≥80%)，标准降低

**影响**:
- M/L 规模项目不再强制 90% 验收测试覆盖
- 可能导致关键需求缺少验收测试就上线

**修复建议**:
恢复 C5 检查，但降低阈值并设为 warning-only

```typescript
// src/core/gate-engine/condition-registry.ts
// 在 05_verify 阶段添加

{
  id: 'G-VERIFY-02',
  description: 'Test coverage AC (C5) ≥ 80% (warning)',
  blocking: false,  // warning-only
  evaluate: (ctx) => {
    const c5 = evaluateTestCoverageAC(ctx.featureId, ctx.projectRoot);
    const taskIds = ctx.rows.filter((r) => r.type === 'TASK').map((r) => r.id);
    return {
      pass: c5 >= 80,  // 降低阈值从 90% 到 80%
      detail: `C5=${c5}%`,
      scopeFrIds: taskIds,
      blocking: false
    };
  }
}
```

**验收标准**:
- [ ] condition-registry.ts 中添加 G-VERIFY-02
- [ ] 阈值降低到 80%
- [ ] blocking: false 确保不阻断流程

---

## P2 - 优化（可延后）

### Issue #5: CoverageMetrics 缺少 @deprecated 注释

**严重程度**: LOW
**影响范围**: 代码可维护性
**发现来源**: 架构审查 agent

**问题描述**:
Task 2.7 要求为 C1/C2/C5/C7 添加 @deprecated 注释，但未实现

**修复建议**:
```typescript
// src/shared/types.ts:196

export interface CoverageMetrics {
  /** @deprecated 已下线，保留字段兼容 */
  C1: number;
  /** @deprecated 已下线，保留字段兼容 */
  C2: number;
  C3: number;
  C4: number;
  /** @deprecated 已下线，保留字段兼容 */
  C5: number;
  C6: number;
  /** @deprecated 已下线，保留字段兼容 */
  C7: number;
  C8: number;
  C9: number;
}
```

---

### Issue #6: 用户文档缺少 profile 配置说明

**严重程度**: LOW
**影响范围**: 用户体验
**发现来源**: 架构审查 agent

**问题描述**:
Task 4.12 要求补充 profile 配置文档，但未实现

**修复建议**:
在 docs/ 或 README.md 中添加 profile 配置说明

---

## 修复优先级总结

| Issue | 严重程度 | 优先级 | 预计工时 |
|-------|----------|--------|----------|
| #1 C2 删除 | HIGH | P0 | 1h |
| #2 Warning 持久化 | MEDIUM | P0 | 1h |
| #3 Strict profile | MEDIUM | P1 | 2h |
| #4 C5 删除 | MEDIUM | P1 | 1h |
| #5 @deprecated | LOW | P2 | 0.5h |
| #6 文档 | LOW | P2 | 1h |

**总计**: P0 修复约 2 小时，P1 修复约 3 小时
