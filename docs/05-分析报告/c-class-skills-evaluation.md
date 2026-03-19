# C 类编排 Skills 优化评估

> 评估 11-plan, 13-orchestrate, 16-sync 是否需要 Feature 自动定位优化

---

## 评估结果

### 11-plan - ❌ 不需要优化

**原因**:
- P0 已明确："定位 Feature 上下文；存在多个 Feature 时列出供用户选择"
- 已有完善的多 Feature 处理逻辑
- 职责是"生成计划"，不绑定单一 Feature
- 可能需要跨 Feature 规划

**特殊性**:
- 支持多 Feature 场景
- 用户可能需要选择不同 Feature 进行规划
- 自动定位 `.spec-first/current` 可能限制灵活性

---

### 13-orchestrate - ✅ 建议优化

**原因**:
- P0: "定位 Feature，加载当前阶段与状态"
- 是主编排器，通常针对当前激活 Feature
- 用户期望零参数启动编排当前 Feature

**优化收益**: 中等（使用频率较低，但符合统一性）

---

### 16-sync - ✅ 建议优化

**原因**:
- P0: "定位 Feature，检测变更文件"
- 同步操作通常针对当前 Feature
- 符合其他 skills 的行为模式

**优化收益**: 中等（辅助工具，但应保持一致性）

---

## 最终建议

### 立即优化（2个）
- 13-orchestrate
- 16-sync

### 保持现状（1个）
- 11-plan（多 Feature 规划场景，需要灵活性）

---

## 11-plan 特殊说明

**为什么不优化**:
1. 已有完善的多 Feature 处理逻辑
2. 用户可能需要为不同 Feature 生成计划
3. 自动定位可能限制跨 Feature 规划能力

**现有逻辑已足够**:
```
P0: 定位 Feature 上下文；存在多个 Feature 时列出供用户选择
```

这个逻辑已经包含了：
- 自动检测 Feature 数量
- 单个 Feature 时自动使用
- 多个 Feature 时交互式选择

不需要强制绑定 `.spec-first/current`。
