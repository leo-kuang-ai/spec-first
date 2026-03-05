# findings.md 状态头规范

findings.md 结构化状态头与 Step 级恢复协议。

---

## 状态头格式

```yaml
---
current_step: "Step 3"
completed_steps: ["Phase 0", "Step 0", "Step 1", "Step 2"]
skipped_steps: []
next_step: "Step 4"
complexity: "Moderate"
scenario: "iteration"
last_updated: "2026-03-05T10:00:00Z"
---
```

---

## 字段说明

### current_step

**类型**: String

**取值范围**:
- `"Phase 0"` - PRD 生成阶段
- `"Step 0"` - 确保任务存在
- `"Step 1"` - 自动上下文收集
- `"Step 2"` - 复杂度分类
- `"Step 3"` - Question Gate
- `"Step 4"` - Research-first Mode
- `"Step 5"` - Expansion Sweep
- `"Step 6"` - Q&A Loop
- `"Step 7"` - Propose Approaches
- `"Step 8"` - Final Confirmation

**说明**: 当前正在执行的步骤。

---

### completed_steps

**类型**: Array<String>

**说明**: 已完成的步骤列表，按执行顺序排列。

**示例**:
```yaml
completed_steps: ["Phase 0", "Step 0", "Step 1", "Step 2"]
```

---

### skipped_steps

**类型**: Array<String>

**说明**: 被跳过的步骤列表（根据复杂度档位）。

**示例**:
```yaml
# Trivial 复杂度
skipped_steps: ["Step 3", "Step 4", "Step 5", "Step 6", "Step 7"]

# Simple 复杂度
skipped_steps: ["Step 4", "Step 5", "Step 7"]

# Moderate 复杂度
skipped_steps: ["Step 7"]

# Complex 复杂度
skipped_steps: []
```

---

### next_step

**类型**: String

**说明**: 下一步要执行的步骤。

**取值范围**: 同 `current_step`

---

### complexity

**类型**: String

**取值范围**:
- `"Trivial"` - 单文件微调
- `"Simple"` - 单模块功能
- `"Moderate"` - 跨模块协作
- `"Complex"` - 架构级变更
- `"待判定"` - 初始状态

**说明**: 需求复杂度档位，在 Step 2 判定后更新。

---

### scenario

**类型**: String

**取值范围**:
- `"greenfield"` - 0-1 新需求
- `"iteration"` - 迭代需求

**说明**: 需求场景类型，在 Phase 0.2 判定后更新。

---

### last_updated

**类型**: String (ISO 8601)

**格式**: `YYYY-MM-DDTHH:mm:ssZ`

**说明**: 最后更新时间。

---

## 更新时机

### Phase 0 开始时

```yaml
---
current_step: "Phase 0"
completed_steps: []
skipped_steps: []
next_step: "Step 0"
complexity: "待判定"
scenario: "待判定"
last_updated: "2026-03-05T10:00:00Z"
---
```

---

### Phase 0 完成后

```yaml
---
current_step: "Step 0"
completed_steps: ["Phase 0"]
skipped_steps: []
next_step: "Step 1"
complexity: "待判定"
scenario: "greenfield"  # 或 "iteration"
last_updated: "2026-03-05T10:05:00Z"
---
```

---

### Step 2 完成后（复杂度判定）

```yaml
---
current_step: "Step 3"
completed_steps: ["Phase 0", "Step 0", "Step 1", "Step 2"]
skipped_steps: []
next_step: "Step 4"
complexity: "Moderate"  # 已判定
scenario: "greenfield"
last_updated: "2026-03-05T10:10:00Z"
---
```

**同时更新 skipped_steps**（根据复杂度）:
```yaml
# Moderate 复杂度跳过 Step 7
skipped_steps: ["Step 7"]
```

---

### Step 跳过时

```yaml
---
current_step: "Step 6"
completed_steps: ["Phase 0", "Step 0", "Step 1", "Step 2", "Step 3"]
skipped_steps: ["Step 4", "Step 5"]  # Simple 复杂度跳过
next_step: "Step 8"  # 跳过 Step 7
complexity: "Simple"
scenario: "greenfield"
last_updated: "2026-03-05T10:15:00Z"
---
```

---

### Step 8 完成后

```yaml
---
current_step: "Step 8"
completed_steps: ["Phase 0", "Step 0", "Step 1", "Step 2", "Step 3", "Step 6", "Step 8"]
skipped_steps: ["Step 4", "Step 5", "Step 7"]
next_step: "完成"
complexity: "Simple"
scenario: "greenfield"
last_updated: "2026-03-05T10:20:00Z"
---
```

---

## Step 级恢复协议

### 恢复流程

1. **读取状态头**
   ```typescript
   const findings = readFindings(featureId);
   const state = parseYamlFrontMatter(findings);
   ```

2. **判断恢复点**
   ```typescript
   if (state.next_step === "完成") {
     // spec 阶段已完成
     return "进入 design 阶段";
   } else {
     // 从 next_step 继续
     return `继续执行 ${state.next_step}`;
   }
   ```

3. **加载上下文**
   ```typescript
   const context = {
     completed: state.completed_steps,
     skipped: state.skipped_steps,
     complexity: state.complexity,
     scenario: state.scenario
   };
   ```

4. **恢复执行**
   ```typescript
   executeStep(state.next_step, context);
   ```

---

### 恢复示例

**场景**: 用户在 Step 3 中断，重新进入会话。

**状态头**:
```yaml
---
current_step: "Step 3"
completed_steps: ["Phase 0", "Step 0", "Step 1", "Step 2"]
skipped_steps: []
next_step: "Step 4"
complexity: "Moderate"
scenario: "iteration"
last_updated: "2026-03-05T10:10:00Z"
---
```

**恢复提示**:
```markdown
检测到 spec 阶段未完成：

- 已完成: Phase 0, Step 0-2
- 当前步骤: Step 3 (Question Gate)
- 下一步: Step 4 (Research-first Mode)
- 复杂度: Moderate
- 场景: iteration

是否继续执行 Step 3？
```

---

## 最佳实践

### DO ✅

1. **每个 Step 完成后立即更新** - 不要延迟更新
2. **更新 last_updated** - 每次更新都要更新时间戳
3. **同步更新 completed_steps 和 next_step** - 保持一致性
4. **Step 2 后更新 complexity 和 skipped_steps** - 判定后立即更新
5. **Phase 0.2 后更新 scenario** - 判定后立即更新

### DON'T ❌

1. **不要跳过更新** - 每个 Step 都要更新
2. **不要手动编辑** - 由系统自动更新
3. **不要忘记 skipped_steps** - 跳过的 Step 必须记录
4. **不要忘记 last_updated** - 每次更新都要更新时间戳
5. **不要在 Step 8 后继续更新** - Step 8 完成后状态头不再变化

---

## 参考

- 主文档：`03-spec/SKILL.md` findings.md 结构化状态头章节
- 复杂度分类：`complexity-classification.md`
- 恢复协议：`02-catchup/SKILL.md`
