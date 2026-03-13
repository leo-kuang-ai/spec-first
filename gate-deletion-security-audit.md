# Gate 条件删除安全影响评估报告

**评估时间**: 2026-03-13
**评估范围**: Gate 条件简化变更（C1/C2/C5/C7 删除 + C-PRD/C10/C11 改为 warning）
**变更文件**:
- `src/core/gate-engine/gate-evaluator.ts` (重构为 condition-registry.ts)
- `src/core/gate-engine/condition-registry.ts` (新增)
- `src/shared/config-schema.ts` (新增 profile 配置)

---

## 1. 删除的 Gate 条件分析

### C1 (FR-DS 追溯) - 设计覆盖率
- **状态**: ✅ 已完全删除
- **原定义**: `C1: Design Coverage — FR 中有 DS 映射的比例`
- **原位置**: 无独立 Gate 条件（仅作为 coverage 指标存在）
- **风险等级**: **MEDIUM**
- **影响分析**:
  - C1 在旧版中**从未作为独立 Gate 条件**，仅在 `coverage.ts` 中计算
  - 删除后不影响 Gate 评估流程
  - 但失去了需求到设计的追溯能力监控
- **补偿措施**: Coverage 指标仍在 `coverage.ts` 中计算，可通过 `spec-first metrics` 查看

### C2 (DS-API 追溯) - API 覆盖率
- **状态**: ✅ 已完全删除
- **原定义**: `G-DESIGN-02: API coverage (C2) = 100%`
- **原位置**: `02_design` 阶段
- **风险等级**: **HIGH**
- **影响分析**:
  - **阻断需求到 API 设计的强制追溯**
  - 可能导致需求未被 API 设计覆盖就进入开发阶段
  - 设计阶段质量门禁弱化
- **补偿措施**: 无自动补偿，依赖人工 Code Review

### C5 (TASK-TC 追溯) - 验收测试覆盖率
- **状态**: ✅ 已完全删除
- **原定义**: `G-VERIFY-02: Test coverage AC (C5) ≥ 90% for M/L`
- **原位置**: `05_verify` 阶段
- **风险等级**: **HIGH**
- **影响分析**:
  - **阻断验收测试覆盖率检查**
  - M/L 规模项目不再强制 90% 验收测试覆盖
  - 可能导致关键需求缺少验收测试就上线
- **补偿措施**: 仍保留 C4 (≥80%)，但 C5 更严格的 AC 级别检查已失效

### C7 (TASK-FR 追溯) - PR 合规率
- **状态**: ✅ 已完全删除
- **原定义**: `G-IMPL-02: PR compliance (C7) = 100%`
- **原位置**: `04_implement` 阶段
- **风险等级**: **MEDIUM**
- **影响分析**:
  - **阻断任务到需求的反向追溯检查**
  - 可能出现"孤儿任务"（无需求关联的开发任务）
  - 影响变更影响分析的准确性
- **补偿措施**: 无自动补偿

---

## 2. Warning-only 条件分析

### C-PRD (G-SPEC-00)
- **实现状态**: ✅ 正确实现 `blocking: false`
- **代码位置**: `condition-registry.ts:69-85`
- **风险评估**: **MEDIUM**
- **影响**:
  - PRD 质量分数 <85% 不再阻断流程
  - 可能导致需求定义不清晰就进入设计阶段
- **用户行为预测**: Warning 容易被忽略，特别是在快速迭代场景

### C10 (G-SPEC-03) - Spec 质量评分
- **实现状态**: ✅ 正确实现 `blocking: false`
- **代码位置**: `condition-registry.ts:103-111`
- **风险评估**: **MEDIUM**
- **影响**:
  - Spec 质量分数 <80% 不再阻断流程
  - 可能导致规范质量下降
- **用户行为预测**: 在时间压力下，团队可能跳过 spec-review checklist

### C11 (G-DESIGN-03) - Constitution 合规性
- **实现状态**: ✅ 正确实现 `blocking: false`
- **代码位置**: `condition-registry.ts:125-132`
- **风险评估**: **LOW**
- **影响**:
  - Constitution 不合规不再阻断流程
  - 对核心追溯链影响较小
- **用户行为预测**: Constitution 主要用于治理，warning 可接受

---

## 3. 安全风险矩阵

| 风险项 | 等级 | 影响 | 缓解措施 | 状态 |
|--------|------|------|----------|------|
| C2 删除导致需求-设计断链 | HIGH | 需求未被 API 设计覆盖 | 依赖人工 Code Review | ⚠️ 无自动化 |
| C5 删除导致验收测试不足 | HIGH | 关键需求缺少验收测试 | C4 仍保留 80% 基线 | ⚠️ 降级保护 |
| C7 删除导致孤儿任务 | MEDIUM | 任务无需求关联 | 依赖开发规范 | ⚠️ 无自动化 |
| C1 删除影响追溯可见性 | MEDIUM | 设计覆盖率不可见 | metrics 命令仍可查看 | ✅ 有补偿 |
| C-PRD warning 被忽略 | MEDIUM | PRD 质量下降 | strict profile 可恢复 | ✅ 有回滚 |
| C10 warning 被忽略 | MEDIUM | Spec 质量下降 | strict profile 可恢复 | ✅ 有回滚 |
| C11 warning 被忽略 | LOW | 治理合规性下降 | strict profile 可恢复 | ✅ 有回滚 |
| 追溯链完整性破坏 | HIGH | FR→DS→TASK→TC 链路断裂 | 无完整补偿机制 | ❌ 高风险 |


---

## 4. 回滚能力评估

### Strict Profile 支持
- **状态**: ✅ **部分支持**
- **实现位置**: `gate-evaluator.ts:46-58`
- **能力范围**:
  ```typescript
  if (profile !== 'strict') return filtered;
  
  // strict 不恢复已删除 Gate，但会把默认 warning 提升为 blocking
  return filtered.map((c) =>
    c.blocking === false
      ? { ...c, blocking: true, description: c.description.replace(/\s*\(warning\)\s*/i, '') }
      : c
  );
  ```
- **限制**:
  - ✅ 可将 C-PRD/C10/C11 从 warning 提升为 blocking
  - ❌ **无法恢复已删除的 C1/C2/C5/C7**
  - ❌ 代码中已完全移除这些条件的定义

### 扩展点保留
- **状态**: ✅ **架构支持良好**
- **扩展机制**:
  1. `GATE_CONDITIONS` 注册表设计支持动态添加
  2. `GateConditionDef` 接口完整保留
  3. `EvalContext` 包含所有必要数据（coverage, rows, rfcStatuses）
- **恢复成本**: 需要重新编写 C1/C2/C5/C7 的 evaluate 函数，估计 2-4 小时

### 配置回滚路径
```yaml
# .spec-first.yml
gate:
  profile: strict  # 将 C-PRD/C10/C11 提升为 blocking
  # 但无法恢复 C1/C2/C5/C7
```

---

## 5. 补偿机制评估

### 现有补偿
1. **Coverage 指标仍计算**: `coverage.ts` 中 C1-C9 全部保留
2. **Metrics 命令可查看**: `spec-first metrics` 可查看所有覆盖率
3. **C4 基线保留**: 80% 测试覆盖率仍强制检查
4. **Waiver 机制**: 豁免机制仍可用于特殊情况

### 缺失补偿
1. **无 findings.md 记录**: 代码中未找到 warning 记录到 findings.md 的逻辑
2. **无主动提醒**: Warning 仅在 gate 输出中显示，无持久化告警
3. **无趋势分析**: 无法追踪 warning 被忽略的频率


---

## 6. 建议

### [MUST] 立即执行

1. **恢复 C2 检查** - 需求到 API 设计的追溯是核心质量保障
   - 建议在 `02_design` 阶段恢复，在 default-simplified 下可设为 warning
   - 在 strict profile 下必须为 blocking

2. **实现 Warning 持久化** - 将 warning 记录到 findings.md
   - 在 gate-evaluator.ts 中添加 warning 记录逻辑
   - 确保 warning 不会被遗忘

### [SHOULD] 优先执行

3. **恢复 C5 检查** - 验收测试覆盖率对质量至关重要
   - 建议: 在 default-simplified 下降低阈值到 70%，而非完全删除
   - 在 strict 下恢复 90% 阈值

4. **增强 Strict Profile** - 使其能恢复已删除条件
   - 在 condition-registry.ts 中添加 STRICT_ONLY_CONDITIONS
   - 支持通过配置完全恢复追溯链检查

5. **添加 Warning 仪表盘** - 在 stage-viewer 中显示累积 warning 数量

### [NICE-TO-HAVE] 可选执行

6. **实现 Warning 配额** - 限制单个 Feature 可忽略的 warning 数量
7. **添加 Warning 过期机制** - 超过 N 天的 warning 自动升级为 blocking
8. **C1/C7 作为 Metrics** - 虽不阻断流程，但在报告中突出显示


---

## 7. 结论

### 总体风险评级: **HIGH** ⚠️

**关键发现**:
1. ✅ Warning 机制实现正确，blocking: false 生效
2. ✅ Strict profile 架构设计合理
3. ❌ **C2 删除破坏需求-设计追溯链**（最高风险）
4. ❌ **C5 删除弱化验收测试保障**（高风险）
5. ❌ Strict profile 无法恢复已删除条件
6. ❌ 缺少 warning 持久化和告警机制

**可接受场景**:
- 小型项目（Size: S）
- 快速原型验证
- 内部工具开发

**不可接受场景**:
- 生产级系统（Size: M/L）
- 需要严格质量保障的项目
- 多团队协作项目

**建议行动**:
1. 立即恢复 C2（需求-设计追溯）
2. 实现 warning 持久化机制
3. 增强 strict profile 以支持恢复已删除条件
4. 在文档中明确说明 default-simplified 的适用场景和风险

---

## 附录：代码证据

### A. C2 删除证据
```bash
git diff HEAD src/core/gate-engine/gate-evaluator.ts | grep -A5 "G-DESIGN-02"
# 输出显示 G-DESIGN-02 (C2) 已完全删除
```

### B. Warning 实现证据
```typescript
// condition-registry.ts:69-71
{
  id: 'G-SPEC-00',
  description: 'PRD exists and C-PRD ≥ 85% (warning)',
  blocking: false,  // ✅ 正确实现
  ...
}
```

### C. Strict Profile 限制证据
```typescript
// gate-evaluator.ts:46-58
if (profile !== 'strict') return filtered;

// ❌ 仅提升 blocking 标志，无法恢复已删除条件
return filtered.map((c) =>
  c.blocking === false ? { ...c, blocking: true } : c
);
```

