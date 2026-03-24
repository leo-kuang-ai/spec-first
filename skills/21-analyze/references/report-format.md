# 报告格式

> Analyze Skill 的分析报告格式与示例

---

## 标准报告格式

```markdown
# 一致性分析报告

> 生成时间: {timestamp}
> Feature: {featureId}
> 阶段: {stage}

---

## 📊 分析摘要

| 严重度 | 数量 |
|--------|------|
| CRITICAL | {count} |
| HIGH | {count} |
| MEDIUM | {count} |
| LOW | {count} |
| **总计** | {total} |

## 背景质量结论

- background_input_status: {full/degraded/blind}
- runtime 真源: {healthy/degraded/missing}
- docs 输出: {ready/missing}
- 同步状态: {ready/attention/unknown}
- 建议动作: {repair_action}

---

## 🔴 CRITICAL（阻断级）

### 1. {问题标题}

**类型**: {问题类型}
**位置**: {文件路径}:{行号}
**描述**: {详细描述}
**建议**: {修复建议}

---

## 🟠 HIGH（高风险）

### 1. {问题标题}

...

---

## 🟡 MEDIUM（中风险）

...

---

## 🟢 LOW（提示级）

...

---

## 💡 修复建议

1. 优先修复 CRITICAL 级别问题
2. 建议修复 HIGH 级别问题
3. MEDIUM/LOW 可排期处理

---

## 📋 检查清单

- [ ] 所有 CRITICAL 问题已修复
- [ ] 所有 HIGH 问题已评估
- [ ] 文档关联索引已更新
- [ ] 产物一致性已确认
```

---

## 示例 1: 有问题的报告

```markdown
# 一致性分析报告

> 生成时间: 2026-03-05 12:00:00
> Feature: FSREQ-20260305-SPECOPT-001
> 阶段: 03_plan

---

## 📊 分析摘要

| 严重度 | 数量 |
|--------|------|
| CRITICAL | 1 |
| HIGH | 2 |
| MEDIUM | 3 |
| LOW | 5 |
| **总计** | 11 |

## 背景质量结论

- background_input_status: blind
- runtime 真源: missing
- docs 输出: missing
- 同步状态: attention
- 建议动作: 先补齐背景输入与 docs 输出，再继续分析

---

## 🔴 CRITICAL（阻断级）

### 1. 缺失必需产物

**类型**: 产物缺失
**位置**: specs/FSREQ-20260305-SPECOPT-001/
**描述**: 当前阶段为 03_plan，但缺失 design.md
**建议**: 运行 /spec-first:design 生成设计文档

---

## 🟠 HIGH（高风险）

### 1. FR-003 无对应设计规格

**类型**: 覆盖缺口
**位置**: specs/FSREQ-20260305-SPECOPT-001/spec.md:45
**描述**: FR-003 定义了"问题门禁机制"，但在 design.md 中未找到对应的 DS
**建议**: 在 design.md 中补充 DS-003，说明问题门禁的技术实现

### 2. DS-001 无对应任务

**类型**: 覆盖缺口
**位置**: specs/FSREQ-20260305-SPECOPT-001/design.md:67
**描述**: DS-001 定义了"复杂度分流机制"，但在 task_plan.md 中未找到对应的 TASK
**建议**: 在 task_plan.md 中补充实现任务

---

## 🟡 MEDIUM（中风险）

### 1. TASK-005 无对应测试用例

**类型**: 覆盖缺口
**位置**: specs/FSREQ-20260305-SPECOPT-001/task_plan.md:120
**描述**: TASK-005 定义了"收敛机制实现"，但未找到对应的 TC
**建议**: 补充测试用例 TC-UT-005

### 2. 文档关联未更新

**类型**: 追溯缺失
**位置**: specs/FSREQ-20260305-SPECOPT-001/document-links.yaml
**描述**: 矩阵中缺少 FR-004 的追溯记录
**建议**: 运行 /spec-first:sync 同步矩阵

### 3. 需求描述不够清晰

**类型**: 内容质量
**位置**: specs/FSREQ-20260305-SPECOPT-001/spec.md:78
**描述**: "系统应该尽量提高性能" 表述模糊
**建议**: 明确性能指标，如"响应时间 < 200ms"

---

## 🟢 LOW（提示级）

### 1. 使用歧义词

**类型**: 歧义词
**位置**: specs/FSREQ-20260305-SPECOPT-001/spec.md:34
**描述**: 使用了"可能"、"大概"等歧义词
**建议**: 使用明确的表述

### 2. 格式不规范

**类型**: 格式问题
**位置**: specs/FSREQ-20260305-SPECOPT-001/design.md:12
**描述**: 标题层级跳跃（H2 直接到 H4）
**建议**: 保持标题层级连续

### 3-5. ...

---

## 💡 修复建议

1. **立即修复**: 补充 design.md（CRITICAL）
2. **优先修复**: 补充 DS-003 和 TASK（HIGH）
3. **排期处理**: 补充测试用例、更新矩阵（MEDIUM）
4. **可选优化**: 优化描述、规范格式（LOW）

---

## 📋 检查清单

- [ ] design.md 已生成
- [ ] DS-003 已补充
- [ ] TASK 已补充
- [ ] 文档关联索引已更新
- [ ] 产物一致性已确认
```

---

## 示例 2: 无问题的报告

```markdown
# 一致性分析报告

> 生成时间: 2026-03-05 12:00:00
> Feature: FSREQ-20260304-AUTH-002
> 阶段: 04_implement

---

## 📊 分析摘要

| 严重度 | 数量 |
|--------|------|
| CRITICAL | 0 |
| HIGH | 0 |
| MEDIUM | 0 |
| LOW | 0 |
| **总计** | 0 |

## 背景质量结论

- background_input_status: full
- runtime 真源: healthy
- docs 输出: ready
- 同步状态: in_sync
- 建议动作: 无需额外修复，维持当前同步节奏

---

## ✅ 分析结果

未发现一致性问题。

所有产物完整，追溯链完整，内容一致。

---

## 💡 建议

继续保持良好的文档质量。
```

---

## 问题类型分类

| 类型 | 说明 |
|------|------|
| 产物缺失 | 必需文件不存在 |
| 覆盖缺口 | 上游需求无下游实现 |
| 追溯缺失 | 文档关联索引不完整 |
| 内容冲突 | 产物间描述矛盾 |
| 内容质量 | 描述不清晰或有歧义 |
| 格式问题 | 格式不规范 |

---

## 输出路径

**标准路径**: `specs/{featureId}/reports/analysis-report.md`

**示例**: `specs/FSREQ-20260305-SPECOPT-001/reports/analysis-report.md`
