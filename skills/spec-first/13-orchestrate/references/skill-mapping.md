# Stage-Skill 映射表

> Orchestrate Skill 的阶段到 Skill 调度协议

---

## 调度协议

### Stage → Skill 映射

| 当前阶段 | 调度 Skill | 说明 | 按需 Skill |
|---------|-----------|------|-----------|
| 00_init | 无 | init 已完成 | - |
| 01_specify | 03-spec | 需求定义 | - |
| 02_design | 04-design | 技术设计 | 05-research |
| 03_plan | 06-task | 任务拆解 | - |
| 04_implement | 07-code | 代码实现 | 08-review |
| 05_verify | 12-verify | 阶段验收 | - |
| 06_wrap_up | 10-archive | 归档总结 | - |

---

## 子 Skill 失败处理

### P0 失败（阶段不匹配）

**处理**: orchestrate 终止

**输出**:
```
❌ 子 Skill 失败: 阶段不匹配

当前阶段: 01_specify
Skill 要求: 02_design

orchestrate 已终止。
```

---

### P3 用户拒绝

**处理**: orchestrate 暂停

**输出**:
```
⏸️ 用户拒绝设计方案

orchestrate 已暂停，等待用户决定是否继续。
```

---

### P4/P5 失败

**处理**: orchestrate 终止，不执行 stage advance

**输出**:
```
❌ 子 Skill 失败: 04-design P5 失败

错误: gate check 未通过

orchestrate 已终止，已完成的产出物保留。
```

---

### 产出物保留规则

**规则**: 任何子 Skill 失败后，已完成的子 Skill 产出物保留不回滚

**示例**:
- spec.md 已生成 → 保留
- design.md 生成失败 → 不影响 spec.md

---

## 参数传递

### featureId 继承

**规则**: 所有子 Skill 继承 orchestrate 的 featureId

**示例**:
```
orchestrate --feature FSREQ-20260305-AUTH-001
  ↓
spec --feature FSREQ-20260305-AUTH-001
  ↓
design --feature FSREQ-20260305-AUTH-001
```

---

### confirm_policy 保持

**规则**: 子 Skill 的 confirm_policy 保持各自定义

**示例**:
- orchestrate: strict
- spec: strict（保持）
- design: strict（保持）
- code: relaxed（保持）

---

## 编排序列

### 标准流程

```
plan → skill → verify → advance
```

**详细**:
1. **plan**: 生成编排计划
2. **skill**: 执行目标阶段 Skill
3. **verify**: 校验产出物
4. **advance**: 推进阶段

---

### 00_init 特殊处理

**规则**: init 已完成，直接 verify → advance

**流程**:
```
verify → advance
```

---

## 调度示例

### 示例 1: 01_specify 阶段

```
orchestrate 检测到当前阶段: 01_specify
  ↓
调度 03-spec Skill
  ↓
spec 执行 P0-P5
  ↓
verify 校验 spec.md
  ↓
gate check 通过
  ↓
stage advance → 02_design
```

---

### 示例 2: 02_design 阶段（含按需 Skill）

```
orchestrate 检测到当前阶段: 02_design
  ↓
用户选择: 是否需要调研？
  ├─ 是 → 调度 05-research
  └─ 否 → 跳过
  ↓
调度 04-design Skill
  ↓
design 执行 P0-P5
  ↓
verify 校验 design.md
  ↓
gate check 通过
  ↓
stage advance → 03_plan
```

---

### 示例 3: 04_implement 阶段（含按需 Skill）

```
orchestrate 检测到当前阶段: 04_implement
  ↓
调度 07-code Skill
  ↓
code 执行 P0-P5
  ↓
用户选择: 是否需要代码审查？
  ├─ 是 → 调度 08-review
  └─ 否 → 跳过
  ↓
verify 校验代码
  ↓
gate check 通过
  ↓
stage advance → 05_verify
```
