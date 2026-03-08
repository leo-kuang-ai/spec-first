# Status Dashboard Template

状态仪表盘标准格式，确保输出一致性。

## 仪表盘结构

```markdown
# Feature Status Dashboard

## 📊 基本信息

| 字段 | 值 |
|------|-----|
| **Feature ID** | {featureId} |
| **标题** | {title} |
| **当前阶段** | {stage} |
| **模式** | {mode} (Normal/Interactive/Autonomous) |
| **规模** | {size} (S/M/L) |
| **平台** | {platforms} |
| **创建时间** | {created_at} |
| **更新时间** | {updated_at} |

---

## 🎯 阶段进度

```
00_init ✅ → 01_specify ✅ → 02_design ✅ → 03_plan 🔄 → 04_implement ⏸️ → 05_verify ⏸️ → 06_wrap_up ⏸️ → 07_release ⏸️
```

**当前阶段**: {current_stage}
**阶段状态**: {stage_status} (in_progress/completed)
**停留时间**: {duration}

---

## 📈 覆盖率指标

| 指标 | 当前值 | 阈值 | 状态 | 说明 |
|------|--------|------|------|------|
| C1 (Spec Coverage) | {c1}% | >0% | {status} | 需求覆盖率 |
| C2 (API Coverage) | {c2}% | 100% | {status} | API 设计覆盖率 |
| C3 (Task Coverage) | {c3}% | 100% | {status} | 任务覆盖率 |
| C4 (Test Coverage FR) | {c4}% | ≥80% | {status} | 测试对 FR 覆盖率 |
| C5 (Test Coverage AC) | {c5}% | ≥90% | {status} | 测试对 AC 覆盖率 |
| C6 (Implementation Coverage) | {c6}% | 100% | {status} | 实现覆盖率 |
| C7 (PR Compliance) | {c7}% | 100% | {status} | PR 合规率 |
| C8 (Task Compliance) | {c8}% | 100% | {status} | 任务合规率 |
| C9 (TC Compliance) | {c9}% | 100% | {status} | 测试用例合规率 |

---

## 💯 健康分

**总分**: {score}/100 ({level})

| 维度 | 得分 | 权重 | 说明 |
|------|------|------|------|
| 覆盖率完整性 | {coverage_score}/100 | 40% | {coverage_desc} |
| 质量门禁 | {gate_score}/100 | 30% | {gate_desc} |
| 任务进度 | {task_score}/100 | 20% | {task_desc} |
| 风险控制 | {risk_score}/100 | 10% | {risk_desc} |

---

## 📋 任务进度

| 状态 | 数量 | 占比 |
|------|------|------|
| ✅ complete | {complete_count} | {complete_pct}% |
| ✅ verified | {verified_count} | {verified_pct}% |
| 🔄 in_progress | {in_progress_count} | {in_progress_pct}% |
| ⏸️ planned | {planned_count} | {planned_pct}% |
| 🚫 blocked | {blocked_count} | {blocked_pct}% |

**总任务数**: {total_tasks}
**完成率**: {completion_rate}%
**预计剩余**: {estimated_remaining}

---

## ⚠️ 风险识别

### 🔴 高风险 ({high_risk_count})

{high_risk_items}

### 🟡 中风险 ({medium_risk_count})

{medium_risk_items}

### 🟢 低风险 ({low_risk_count})

{low_risk_items}

---

## 🎬 建议下一步

基于当前状态，建议：

{recommendations}

**可推进阶段？** {can_advance} (是/否)
{advance_reason}
```

## 状态图标规范

### 阶段状态

| 图标 | 含义 |
|------|------|
| ✅ | 已完成 |
| 🔄 | 进行中 |
| ⏸️ | 未开始 |
| 🚫 | 已取消 |

### 覆盖率状态

| 图标 | 含义 | 条件 |
|------|------|------|
| ✅ | 达标 | 当前值 ≥ 阈值 |
| ⚠️ | 接近阈值 | 阈值 - 10% ≤ 当前值 < 阈值 |
| ❌ | 未达标 | 当前值 < 阈值 - 10% |

### 健康分等级

| 图标 | 等级 | 分数段 |
|------|------|--------|
| 🟢 | 优秀 | 90-100 |
| 🟡 | 良好 | 70-89 |
| 🟠 | 中等 | 50-69 |
| 🔴 | 较差 | 0-49 |

## 示例：PASS 状态

```markdown
# Feature Status Dashboard

## 📊 基本信息

| 字段 | 值 |
|------|-----|
| **Feature ID** | FSREQ-20260305-AUTH-001 |
| **标题** | 短信验证码登录 |
| **当前阶段** | 04_implement |
| **模式** | Normal |
| **规模** | M |
| **平台** | backend, frontend |
| **创建时间** | 2026-03-01 |
| **更新时间** | 2026-03-05 |

---

## 🎯 阶段进度

```
00_init ✅ → 01_specify ✅ → 02_design ✅ → 03_plan ✅ → 04_implement 🔄 → 05_verify ⏸️ → 06_wrap_up ⏸️ → 07_release ⏸️
```

**当前阶段**: 04_implement (代码实现)
**阶段状态**: in_progress
**停留时间**: 2 天

---

## 📈 覆盖率指标

| 指标 | 当前值 | 阈值 | 状态 | 说明 |
|------|--------|------|------|------|
| C1 (Spec Coverage) | 100% | >0% | ✅ | 需求已定义 |
| C2 (API Coverage) | 100% | 100% | ✅ | 设计已完成 |
| C3 (Task Coverage) | 100% | 100% | ✅ | 任务已拆解 |
| C4 (Test Coverage FR) | 85% | ≥80% | ✅ | 测试覆盖达标 |
| C5 (Test Coverage AC) | 92% | ≥90% | ✅ | AC 覆盖达标 |
| C6 (Implementation Coverage) | 60% | >0% | ✅ | 实现进行中 |

---

## 💯 健康分

**总分**: 88/100 (🟡 良好)

| 维度 | 得分 | 权重 | 说明 |
|------|------|------|------|
| 覆盖率完整性 | 90/100 | 40% | 所有指标达标 |
| 质量门禁 | 85/100 | 30% | Gate 条件通过 |
| 任务进度 | 85/100 | 20% | 任务完成 60% |
| 风险控制 | 95/100 | 10% | 仅 1 个低风险 |

---

## 📋 任务进度

| 状态 | 数量 | 占比 |
|------|------|------|
| ✅ complete | 6 | 60% |
| 🔄 in_progress | 2 | 20% |
| ⏸️ planned | 2 | 20% |
| 🚫 blocked | 0 | 0% |

**总任务数**: 10
**完成率**: 60%
**预计剩余**: 1 天

---

## ⚠️ 风险识别

### 🔴 高风险 (0)
无

### 🟡 中风险 (0)
无

### 🟢 低风险 (1)
1. **任务进度略慢** — 预计剩余 1 天，可能延期 0.5 天
   - 影响: 轻微延期
   - 建议: 评估是否需要资源支持

---

## 🎬 建议下一步

基于当前状态，建议：

1. **继续实现任务** — 完成剩余 2 个 in_progress 任务
2. **准备测试验证** — 实现完成后执行 `/spec-first:verify`
3. **关注进度** — 每日检查任务完成情况

**可推进阶段？** ❌ 否（实现未完成）
需等待所有任务完成后推进到 05_verify
```

## 示例：FAIL 状态

```markdown
# Feature Status Dashboard

## 📊 基本信息

| 字段 | 值 |
|------|-----|
| **Feature ID** | FSREQ-20260305-AUTH-001 |
| **标题** | 短信验证码登录 |
| **当前阶段** | 03_plan |
| **模式** | Normal |
| **规模** | M |
| **平台** | backend, frontend |

---

## 🎯 阶段进度

```
00_init ✅ → 01_specify ✅ → 02_design ✅ → 03_plan 🔄 → 04_implement ⏸️ → ...
```

**当前阶段**: 03_plan (任务拆解)
**阶段状态**: in_progress
**停留时间**: 3 天

---

## 📈 覆盖率指标

| 指标 | 当前值 | 阈值 | 状态 | 说明 |
|------|--------|------|------|------|
| C1 (Spec Coverage) | 100% | >0% | ✅ | 需求已定义 |
| C2 (API Coverage) | 66.7% | 100% | ❌ | 部分 FR 缺少 DS |
| C3 (Task Coverage) | 50% | 100% | ❌ | 任务拆解不完整 |
| C4 (Test Coverage FR) | 0% | ≥80% | ❌ | 测试用例未生成 |

---

## 💯 健康分

**总分**: 45/100 (🔴 较差)

| 维度 | 得分 | 权重 | 说明 |
|------|------|------|------|
| 覆盖率完整性 | 40/100 | 40% | C2/C3 未达标 |
| 质量门禁 | 50/100 | 30% | Gate 条件失败 |
| 任务进度 | 50/100 | 20% | 任务完成 50% |
| 风险控制 | 40/100 | 10% | 存在 2 个高风险 |

---

## ⚠️ 风险识别

### 🔴 高风险 (2)
1. **C2 覆盖率不足** — FR-AUTH-003 缺少对应 DS
   - 影响: 无法拆解任务，阻塞实现
   - 建议: 执行 `/spec-first:design --focus FR-AUTH-003`

2. **C3 覆盖率不足** — 50% FR 缺少 TASK
   - 影响: 实现不完整
   - 建议: 执行 `/spec-first:task` 补充任务拆解

### 🟡 中风险 (1)
1. **停留时间过长** — 已停留 3 天，超过预期
   - 影响: 项目延期
   - 建议: 评估是否需要调整计划

---

## 🎬 建议下一步

基于当前状态，建议：

1. **优先修复 C2** — 补充缺失的 DS
2. **完成 C3** — 补充任务拆解
3. **重新评估计划** — 调整时间预期

**可推进阶段？** ❌ 否（存在高风险）
需修复所有高风险项后才能推进
```

## 背景状态卡片
- background_input_status
- runtime 真源状态
- docs 投影视图状态
- 同步状态
