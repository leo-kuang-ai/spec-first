# spec-review Skill 优化方案（历史归档）

> 历史提案：自动读取当前激活 Feature，无参数时自动定位

> 当前状态：已实现。现行规则以 `feature-location.md` 和 `SKILL.md` 为准。

---

## 当前问题

**现状**: P0 阶段描述为"定位 Feature"，但未明确如何定位

**问题**:
- 用户必须手动提供 featureId 参数
- 未利用 `.spec-first/current` 自动定位机制

---

## 优化方案

### P0 阶段优化

**修改前**:
```
- P0: 定位 Feature，校验 `spec.md` 已存在
```

**修改后**:
```
- P0: 定位 Feature（优先读取 `.spec-first/current`，无则交互式提示），校验 `spec.md` 已存在
```

---

## 详细逻辑

### 1. 自动定位（优先）

```
1. 读取 .spec-first/current
2. 若文件存在且内容非空 → 使用该 Feature ID
3. 继续 P1
```

---

### 2. 交互式提示（降级）

```
1. .spec-first/current 不存在或为空
2. 列出可用 Feature（读取 specs/.feat-registry.md）
3. 提示用户选择或输入 Feature ID
4. 继续 P1
```

---

### 3. 显式参数（覆盖）

```
1. 用户提供 featureId 参数（如 /spec-first:spec-review FEAT-001）
2. 直接使用该参数，跳过自动定位
3. 继续 P1
```

---

## 参考实现

### 02-catchup Skill 最佳实践

```markdown
| 优先级 | 信息源 | 包含内容 | 可靠性 |
|--------|--------|----------|--------|
| **P0** | `.spec-first/current` | 当前 Feature ID | 高 |
```

**流程**:
```
1. 读取 .spec-first/current → 获取 Feature ID
2. 读取 stage-state.json → 获取阶段
3. 加载上下文
```

---

## 实现建议

### SKILL.md 修改

**P0 阶段**:
```markdown
- P0: 定位 Feature（优先读取 `.spec-first/current`，无则交互式提示），校验 `spec.md` 已存在
```

**新增章节**:
```markdown
## Feature 定位规则

### 优先级

1. **显式参数**: 用户提供 featureId 参数时直接使用
2. **自动定位**: 读取 `.spec-first/current` 获取当前激活 Feature
3. **交互式**: 列出可用 Feature 供用户选择

### 错误处理

- `.spec-first/current` 不存在 → 降级到交互式
- `.spec-first/current` 为空 → 降级到交互式
- 指定 Feature 的 `spec.md` 不存在 → 报错并终止
```

---

## 优势

1. **零参数启动**: 大多数场景下无需手动输入 Feature ID
2. **一致性**: 与其他 skills（catchup/verify/analyze）行为一致
3. **灵活性**: 仍支持显式参数覆盖
4. **友好性**: 无 current 时自动降级到交互式选择

---

## 影响范围

**修改文件**:
- `skills/20-spec-review/SKILL.md`

**新增文档**:
- `skills/20-spec-review/references/feature-location.md`（可选）

**兼容性**: 向后兼容，显式参数仍然有效
