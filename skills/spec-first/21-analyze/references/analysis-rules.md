# 分析规则

> Analyze Skill 的一致性分析规则与检查项

---

## 分析维度

### 1. 产物完整性检查

**检查项**:
- spec.md 是否存在
- design.md 是否存在
- task_plan.md 是否存在
- traceability-matrix.md 是否存在

**严重度判定**:
- 缺失 spec.md → `CRITICAL`
- 缺失 design.md（03_plan 之后）→ `HIGH`
- 缺失 task_plan.md（03_plan 之后）→ `HIGH`
- 缺失 matrix → `MEDIUM`

---

### 2. 追溯完整性检查

**检查项**:
- spec.md 中的 FR 是否在 matrix 中
- design.md 中的 DS 是否在 matrix 中
- task_plan.md 中的 TASK 是否在 matrix 中
- matrix 中的 FR 是否在 spec.md 中定义

**严重度判定**:
- FR 缺失追溯 → `HIGH`
- DS 缺失追溯 → `HIGH`
- TASK 缺失追溯 → `MEDIUM`
- 孤立的 matrix 条目 → `LOW`

---

### 3. 内容一致性检查

**检查项**:
- spec.md 中的需求描述与 design.md 中的设计是否对应
- design.md 中的设计与 task_plan.md 中的任务是否对应
- 需求变更是否同步到设计和任务

**严重度判定**:
- 需求与设计不一致 → `HIGH`
- 设计与任务不一致 → `MEDIUM`
- 描述歧义 → `LOW`

---

### 4. 覆盖率检查

**检查项**:
- 所有 FR 是否有对应的 DS
- 所有 DS 是否有对应的 TASK
- 所有 TASK 是否有对应的 TC

**严重度判定**:
- FR 无 DS 覆盖 → `HIGH`
- DS 无 TASK 覆盖 → `MEDIUM`
- TASK 无 TC 覆盖 → `LOW`

---

## 检查规则详解

### 歧义词检测

**目标**: 识别可能引起理解偏差的模糊表述

**检测模式**:
- "可能"、"也许"、"大概"
- "尽量"、"尽可能"
- "适当"、"合理"
- "等"、"之类"

**示例**:
```
❌ 系统应该尽量提高性能
✅ 系统响应时间应 < 200ms
```

**严重度**: `LOW`（提示性）

---

### 覆盖缺口检测

**目标**: 识别未被下游产物覆盖的上游需求

**检测逻辑**:
1. 提取 spec.md 中所有 FR-XXX
2. 检查 matrix 中是否有对应的 DS
3. 检查 matrix 中是否有对应的 TASK

**示例**:
```
发现: FR-003 无对应的设计规格
位置: specs/FEAT-001/spec.md:45
建议: 在 design.md 中补充 DS-003
```

**严重度**: `HIGH`

---

### 产物缺失检测

**目标**: 识别应该存在但缺失的产物文件

**检测逻辑**:
- 阶段 >= 01_specify → 必须有 spec.md
- 阶段 >= 02_design → 必须有 design.md
- 阶段 >= 03_plan → 必须有 task_plan.md

**示例**:
```
发现: 当前阶段为 03_plan，但缺失 design.md
建议: 运行 /spec-first:design 生成设计文档
```

**严重度**: `CRITICAL`

---

### 潜在冲突检测

**目标**: 识别产物间的矛盾描述

**检测模式**:
- spec.md 说"必须支持 X"，design.md 说"不支持 X"
- design.md 定义接口 A，task_plan.md 实现接口 B
- 数据类型不一致

**示例**:
```
发现: spec.md 要求返回 JSON，design.md 定义返回 XML
位置:
  - spec.md:67
  - design.md:89
建议: 统一数据格式定义
```

**严重度**: `CRITICAL`

---

## 严重度判定标准

### CRITICAL（阻断级）

**定义**: 必须立即修复，否则无法继续推进

**触发条件**:
- 必需产物缺失
- 产物间存在直接矛盾
- 追溯链断裂（FR 无法追溯到实现）

**处理**: 阻断阶段流转，必须修复后才能 advance

---

### HIGH（高风险）

**定义**: 高风险问题，建议当轮修复

**触发条件**:
- FR 无对应 DS
- DS 无对应 TASK
- 需求与设计不一致

**处理**: 警告但不阻断，建议修复后再推进

---

### MEDIUM（中风险）

**定义**: 中等风险，可排期处理

**触发条件**:
- TASK 无对应 TC
- 部分追溯缺失
- 描述不够清晰

**处理**: 记录问题，可延后处理

---

### LOW（提示级）

**定义**: 提示性问题，不影响功能

**触发条件**:
- 歧义词使用
- 格式不规范
- 建议性优化

**处理**: 仅提示，不强制修复
