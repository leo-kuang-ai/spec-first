---
scenario: "iteration"
scenario_reason: "基于现有 stage-viewer 页面的优化，同步反映已完成的全链路代码优化"
evidence_paths:
  - "docs/review-bundles/2026-03-13-卡点优化/全链路优化版本-完整方案.md"
  - "docs/review-bundles/2026-03-13-卡点优化/开发任务清单.md"
  - "scripts/stage-viewer/index.html"
complexity: "Simple"
created_at: "2026-03-13T01:35:04.272Z"
last_updated: "2026-03-13T09:37:00.000Z"
---

# PRD — FSREQ-20260313-UIOPT-001

> Stage Viewer 页面优化 - 同步反映全链路代码优化

## 1. 业务目标

### 1.1 问题陈述

**当前痛点**：
- Stage Viewer 页面展示的 Gate 条件、指标体系与后端代码优化后的实际行为不一致
- 用户无法从页面上直观看到 warning 语义、精简后的 Gate 条件、profile 模式等新特性
- 页面仍展示已删除的 C1/C2/C5/C7 指标，造成理解混淆

**目标用户**：
- Spec-First 框架使用者（开发者、项目经理）
- 需要查看 Feature 状态和质量指标的团队成员

**使用场景**：
- 查看 Feature 当前阶段状态
- 查看 Gate 条件通过情况
- 查看覆盖率指标和健康分
- 理解当前治理模型（default-simplified vs strict）

### 1.2 业务价值

**预期收益**：
- 页面展示与代码实现保持一致，消除认知偏差
- 用户能直观理解新的治理模型（5 个核心指标 + warning 语义）
- 提升用户体验，减少因展示不一致导致的困惑

**成功指标**：
- Gate 条件展示与 gate-evaluator.ts 实现 100% 一致
- 覆盖率指标默认只显示 C3/C4/C6/C8/C9
- warning 条件能正确标识为 [WARN]

## 2. 功能需求

### 2.1 核心功能

**F1: Gate 条件展示优化**
- 删除已下线的 Gate 条件（C1/C2/C5/C7 对应的 Gate）
- 标识 warning-only 条件（C-PRD/C10/C11）
- 显示 blocking 状态（[FAIL] vs [WARN]）

**F2: 覆盖率指标精简**
- 默认只显示 5 个核心指标：C3/C4/C6/C8/C9
- 已下线指标（C1/C2/C5/C7）添加 deprecated 标识或隐藏
- 支持切换显示全部指标（可选）

**F3: Profile 模式展示**
- 显示当前 Feature 的 profile（default-simplified / strict）
- 说明不同 profile 的差异

### 2.2 用户故事

- 作为开发者，我希望看到与代码一致的 Gate 条件列表，以便准确理解当前阶段的质量要求
- 作为项目经理，我希望看到精简后的核心指标，以便快速判断 Feature 健康度
- 作为团队成员，我希望区分 warning 和 blocking 失败，以便合理安排优先级

## 3. 非功能需求

### 3.1 性能需求

- 页面加载时间 < 2s
- 数据刷新响应时间 < 500ms

### 3.2 兼容性

- 向后兼容旧版 stage-state.json 格式
- 支持 gate-history.jsonl 中的 blocking 字段

## 4. 验收与成功标准

- [ ] Gate 条件表格只显示当前有效的 Gate（不包含 C1/C2/C5/C7）
- [ ] warning 条件显示 [WARN] 标识（黄色）
- [ ] 覆盖率仪表盘默认只显示 5 个核心指标
- [ ] 健康分计算基于 5 个核心指标
- [ ] 页面能正确读取并显示 profile 信息
- [ ] 所有展示逻辑与后端代码实现一致

## 5. 边界与约束

**范围内**：
- 修改 stage-viewer 页面的展示逻辑
- 调整 Gate 条件、指标、健康分的显示

**范围外**：
- 不修改后端 CLI 命令逻辑
- 不修改 gate-evaluator.ts 核心逻辑
- 不新增数据采集能力

**技术约束**：
- 基于现有 HTML/CSS/JS 结构
- 保持页面性能不下降

## 6. 开放问题

| 问题 | 优先级 | 状态 |
|------|--------|------|
| 是否需要支持用户手动切换 profile 视图？ | Low | Open |
| 已下线指标是否完全隐藏还是标记为 deprecated？ | Medium | Open |
