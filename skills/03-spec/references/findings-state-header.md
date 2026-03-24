# findings.md 状态头规范

findings.md 结构化状态头与 Step 级恢复协议。

---

## 状态头格式

```yaml
---
current_step: "Step 3"
skipped_steps: []
complexity: "Moderate"
scenario: "iteration"
last_updated: "2026-03-05T10:00:00Z"
quality_score: 92
---
```

---

## 字段说明

### current_step

**类型**: String

**取值范围**:
- `"Phase 0"` - PRD 生成阶段
- `"Step 0"` - 确保任务存在
- `"Step 2"` - 复杂度分类
- `"Step 3"` - Question Gate
- `"Step 4"` - Research-first Mode
- `"Step 5"` - Expansion Sweep
- `"Step 6"` - Q&A Loop
- `"Step 7"` - Propose Approaches
- `"Step 8"` - Final Confirmation

**说明**: 当前正在执行的步骤。

---

### skipped_steps

**类型**: Array<String>

**说明**: 被跳过的步骤列表（基于复杂度自适应规则）。

**示例**:
```yaml
skipped_steps: ["Step 7"]  # Moderate 复杂度跳过 Step 7
```

---

### complexity

**类型**: String

**取值范围**: `"Trivial"` | `"Simple"` | `"Moderate"` | `"Complex"`

**说明**: 需求复杂度档位，决定执行路径。

---

### scenario

**类型**: String

**取值范围**: `"greenfield"` | `"iteration"`

**说明**: 场景类型，影响 PRD 模板选择。

---

### last_updated

**类型**: ISO 8601 Timestamp

**说明**: 最后更新时间。

---

### quality_score

**类型**: Number (0-100)

**说明**: Phase 0.2 质量扫描评分。

---

## 更新时机

- **Phase 0.0**: 创建状态头
- **Phase 0.2**: 更新 `quality_score`, `scenario`, `complexity`（初步）
- **Step 2**: 更新 `complexity`（校准）
- **每个 Step 完成**: 更新 `current_step`
- **跳过 Step**: 追加到 `skipped_steps`
- **Step 8 完成**: 归档

---

## 示例

### Trivial 任务

```yaml
---
current_step: "Step 8"
skipped_steps: ["Step 3", "Step 4", "Step 5", "Step 6", "Step 7"]
complexity: "Trivial"
scenario: "greenfield"
last_updated: "2026-03-09T10:00:00Z"
quality_score: 95
---
```

### Moderate 任务

```yaml
---
current_step: "Step 6"
skipped_steps: ["Step 7"]
complexity: "Moderate"
scenario: "iteration"
last_updated: "2026-03-09T10:00:00Z"
quality_score: 88
---
```

### Complex 任务

```yaml
---
current_step: "Step 7"
skipped_steps: []
complexity: "Complex"
scenario: "iteration"
last_updated: "2026-03-09T10:00:00Z"
quality_score: 75
---
```
