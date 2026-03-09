# 文档勘误与修正

**创建日期**: 2026-03-09
**版本**: v1.1

---

## 发现的问题

### 问题 1: Step 编号不一致

**位置**: 多个文档

**问题描述**:
- P1-2 提出"删除 Step 1，后续步骤重新编号"
- 但其他文档仍使用原编号（Step 0-8）
- 导致复杂度自适应规则中的 Step 编号不明确

**影响文档**:
- 01-审查报告.md
- 03-P1问题详解.md
- 07-短期优化方案.md
- 09-重构方案.md

**修正方案**:

采用**方案 A：保持编号，标记合并**

```markdown
### Step 0: Ensure Task Exists
[保持不变]

### Step 1: [已合并到 Phase 0.2]
此步骤的功能已合并到 Phase 0.2，不再单独执行。

### Step 2: Classify Complexity
[原内容，编号保持不变]

### Step 3-8: [后续步骤]
[编号保持不变]
```

**优点**:
- 最小改动
- 编号稳定
- 清晰标记合并状态

---

### 问题 2: 复杂度自适应规则需要更新

**位置**: 01-审查报告.md, 09-重构方案.md

**当前规则**:
```
Trivial: Phase 0 + Step 0-2 + Step 8
Simple: Phase 0 + Step 0-3 + Step 6 + Step 8
Moderate: Phase 0 + Step 0-6 + Step 8
Complex: Phase 0 + Step 0-8 全量
```

**修正后**（考虑 Step 1 合并）:
```
Trivial: Phase 0 + Step 0 + Step 2 + Step 8
Simple: Phase 0 + Step 0 + Step 2-3 + Step 6 + Step 8
Moderate: Phase 0 + Step 0 + Step 2-6 + Step 8
Complex: Phase 0 + Step 0-8 全量（Step 1 已合并到 Phase 0.2）
```

---

### 问题 3: 时间估算需要说明

**位置**: 06-立即行动方案.md

**问题描述**:
- 任务 1-4 串行执行：30min + 1h + 1.5h + 4-6h = 7-9h
- 但实际可能需要测试、调试、返工时间

**修正建议**:

添加说明：
```markdown
**总预计时间**: 7-9 小时（纯开发时间）
**建议预留**: 10-12 小时（含测试、调试、返工）
```

---

### 问题 4: 09-重构方案.md 中的示例需要更新

**位置**: 09-重构方案.md

**问题描述**:
- 重构后 SKILL.md 示例中显示 "Step 0-7"
- 应该是 "Step 0-8（Step 1 已合并）"

**修正**:
```markdown
### Step 0-8: FR/AC 定义
详见 [references/steps-fr-ac-workflow.md](references/steps-fr-ac-workflow.md)

**说明**: Step 1 已合并到 Phase 0.2，不再单独执行。
```

---

## 修正优先级

### 高优先级（必须修正）
- [ ] 问题 2: 更新复杂度自适应规则

### 中优先级（建议修正）
- [ ] 问题 1: 统一 Step 编号说明
- [ ] 问题 4: 更新重构方案示例

### 低优先级（可选）
- [ ] 问题 3: 添加时间估算说明

---

## 修正后的复杂度自适应规则（最终版）

```markdown
| 复杂度 | 执行路径 | 说明 |
|--------|---------|------|
| Trivial | Phase 0 + Step 0 + Step 2 + Step 8 | 跳过 Step 3-7 |
| Simple | Phase 0 + Step 0 + Step 2-3 + Step 6 + Step 8 | 跳过 Step 4-5, 7 |
| Moderate | Phase 0 + Step 0 + Step 2-6 + Step 8 | 跳过 Step 7 |
| Complex | Phase 0 + Step 0 + Step 2-8 | 全量执行 |

**注**: Step 1 已合并到 Phase 0.2，所有路径都不再单独执行 Step 1。
```

---

## 建议行动

1. **立即修正**: 更新 01-审查报告.md 中的复杂度自适应规则
2. **短期修正**: 在实施 P1-2 时，明确采用"保持编号，标记合并"方案
3. **文档同步**: 实施重构后，更新所有相关文档

---

## 总结

发现的问题主要是 Step 编号在合并后的一致性问题。建议采用"保持编号，标记合并"方案，最小化改动范围，同时保持清晰性。
