# Skills Feature 定位逻辑优化方案

> 统一所有 skills 的 Feature 自动定位机制

---

## 现状分析

### 已优化（1个）
- ✅ 20-spec-review - 已实现自动定位

### 需要优化（12个）
- ❌ 04-design
- ❌ 05-research
- ❌ 06-task
- ❌ 07-code
- ❌ 08-code-review
- ❌ 09-test
- ❌ 10-archive
- ❌ 11-plan
- ❌ 12-verify
- ❌ 13-orchestrate
- ❌ 16-sync
- ❌ 21-analyze

---

## 优化原则

### 统一定位规则

**三级优先级**:
1. 显式参数 > 2. 自动定位 > 3. 交互式

**P0 阶段标准描述**:
```
- P0: 定位 Feature（优先读取 `.spec-first/current`，无则交互式提示），校验阶段为 {stage}
```

---

## 分类优化策略

### A类：核心 workflow skills（高优先级）

**特征**: 阶段绑定，频繁使用

**列表**:
- 04-design (02_design)
- 06-task (03_plan)
- 07-code (04_implement)
- 09-test (05_verify)
- 12-verify (任意阶段)

**优化收益**: 最大（用户最常用）

---

### B类：辅助 skills（中优先级）

**特征**: 按需使用，不绑定阶段

**列表**:
- 05-research (按需)
- 08-code-review (按需)
- 10-archive (06_wrap_up)
- 21-analyze (任意阶段)

**优化收益**: 中等

---

### C类：编排/管理 skills（低优先级）

**特征**: 元操作，可能需要特殊处理

**列表**:
- 11-plan (任意阶段)
- 13-orchestrate (任意阶段)
- 16-sync (任意阶段)

**优化收益**: 较低（使用频率低）

---

## 实施建议

### 阶段 1：A类优化（立即）

**目标**: 04-design, 06-task, 07-code, 09-test, 12-verify

**工作量**: 5 个 SKILL.md 更新

**预计时间**: 15 分钟

---

### 阶段 2：B类优化（后续）

**目标**: 05-research, 08-code-review, 10-archive, 21-analyze

**工作量**: 4 个 SKILL.md 更新

**预计时间**: 10 分钟

---

### 阶段 3：C类评估（可选）

**目标**: 11-plan, 13-orchestrate, 16-sync

**注意**: 这些 skills 可能有特殊逻辑，需要单独评估

---

## 标准化模板

### SKILL.md 修改模板

**触发条件**:
```markdown
- Command: `/spec-first:{skill} [featureId]`
```

**新增章节**:
```markdown
## Feature 定位规则

### 优先级

1. **显式参数**: 用户提供 featureId 参数时直接使用
2. **自动定位**: 读取 `.spec-first/current` 获取当前激活 Feature
3. **交互式**: 列出可用 Feature 供用户选择

### 错误处理

- `.spec-first/current` 不存在或为空 → 降级到交互式
- 指定 Feature 的阶段不匹配 → 报错并终止
```

**P0 阶段**:
```markdown
- P0: 定位 Feature（优先读取 `.spec-first/current`，无则交互式提示），校验阶段为 {stage}
```

---

## 预期收益

1. **一致性**: 所有 skills 行为统一
2. **易用性**: 零参数启动，减少输入
3. **可维护性**: 统一的定位逻辑，易于理解和维护
