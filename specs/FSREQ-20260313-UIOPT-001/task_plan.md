# Task Plan — FSREQ-20260313-UIOPT-001

> Stage Viewer 页面优化 - 任务拆解

## 目标

修改 stage-viewer 前端页面，同步反映后端代码优化：Gate 条件展示优化、覆盖率指标精简、健康分计算优化。

## 当前阶段

Phase 3: Planning (03_plan)

## 用户故事分组

### US1 — Gate 条件展示优化 (P1)
- [ ] TASK-UIOPT-001 [P] [US1] 修改 Gate 条件展示逻辑

### US2 — 覆盖率与健康分优化 (P1)
- [ ] TASK-UIOPT-002 [P] [US2] 精简覆盖率指标展示
- [ ] TASK-UIOPT-003 [P] [US2] 优化健康分计算与展示

### US3 — 样式支持 (P2)
- [ ] TASK-UIOPT-004 [US3] 添加样式支持

## 任务明细

| Task ID | 标题 | Owner | 预计工期 | traces | depends_on | 验收标准 | 状态 |
|---------|------|-------|----------|--------|------------|----------|------|
| TASK-UIOPT-001 | 修改 Gate 条件展示逻辑 | FE | 0.3d | FR-UIOPT-001,DS-UIOPT-001 | - | Gate 表格正确显示 [WARN]/[FAIL]/[OK] 标识 | done |
| TASK-UIOPT-002 | 精简覆盖率指标展示 | FE | 0.2d | FR-UIOPT-002,DS-UIOPT-002 | - | 只显示 C3/C4/C6/C8/C9 五个指标 | done |
| TASK-UIOPT-003 | 优化健康分计算与展示 | FE | 0.3d | FR-UIOPT-003,DS-UIOPT-003 | - | 健康分基于 5 指标计算，显示 profile | done |
| TASK-UIOPT-004 | 添加样式支持 | FE | 0.1d | FR-UIOPT-001,FR-UIOPT-002,FR-UIOPT-003 | TASK-UIOPT-001,TASK-UIOPT-002,TASK-UIOPT-003 | .warn 样式生效，颜色正确 | done |

---

## 实施步骤

### TASK-UIOPT-001 — 修改 Gate 条件展示逻辑

**Owner**: FE
**预计工期**: 0.3d
**traces**: FR-UIOPT-001, DS-UIOPT-001
**depends_on**: -
**用户故事**: US1

**目标**：
修改 `scripts/stage-viewer/app.js` 中的 `renderGateTable()` 函数，根据 `blocking` 字段显示不同状态标识。

**验收标准**：
- [ ] Gate 条件表格不显示已下线的 Gate 条件（C1/C2/C5/C7）
- [ ] warning-only 条件（blocking=false）显示 [WARN] 黄色标识
- [ ] blocking 条件失败时显示 [FAIL] 红色标识
- [ ] 通过的条件显示 [OK] 绿色标识

**文件清单**：
- Modify: `scripts/stage-viewer/app.js` (renderGateTable 函数)

**执行步骤**：

**Step 1: 读取当前实现**
- 打开 `scripts/stage-viewer/app.js`
- 定位 `renderGateTable()` 函数
- 预期输出: 理解当前渲染逻辑

**Step 2: 添加状态格式化函数**
- 在 `renderGateTable()` 前添加 `formatGateStatus()` 辅助函数
- 根据 condition.status 和 condition.blocking 返回对应标识
- 预期输出: 函数可根据状态返回 [OK]/[WARN]/[FAIL]

**Step 3: 修改渲染逻辑**
- 在 `renderGateTable()` 中调用 `formatGateStatus()`
- 替换原有的状态显示逻辑
- 预期输出: Gate 表格使用新的状态标识

**Step 4: 本地验证**
```bash
open scripts/stage-viewer/index.html
```
- 检查 Gate 条件表格显示
- 预期输出: [WARN]/[FAIL]/[OK] 标识正确显示

**测试设计输入**：
- target_fr_ids: FR-UIOPT-001
- target_ac_ids: AC-UIOPT-001-01, AC-UIOPT-001-02, AC-UIOPT-001-03, AC-UIOPT-001-04
- recommended_test_levels: manual
- failure_cases: blocking 字段缺失、状态值异常
- definition_of_done: 所有 AC 通过手动验证
- test_intent: 验证 Gate 条件状态标识正确显示

**状态**: planned

---

### TASK-UIOPT-002 — 精简覆盖率指标展示

**Owner**: FE
**预计工期**: 0.2d
**traces**: FR-UIOPT-002, DS-UIOPT-002
**depends_on**: -
**用户故事**: US2

**目标**：
修改 `scripts/stage-viewer/app.js` 中的 `renderCoverageBars()` 函数，只显示 5 个核心指标。

**验收标准**：
- [ ] 覆盖率仪表盘只显示 C3/C4/C6/C8/C9
- [ ] 不显示 C1/C2/C5/C7
- [ ] 每个指标显示名称、当前值、进度条
- [ ] 指标按 C3/C4/C6/C8/C9 顺序排列

**文件清单**：
- Modify: `scripts/stage-viewer/app.js` (renderCoverageBars 函数)

**执行步骤**：

**Step 1: 读取当前实现**
- 打开 `scripts/stage-viewer/app.js`
- 定位 `renderCoverageBars()` 函数
- 预期输出: 理解当前覆盖率渲染逻辑

**Step 2: 定义核心指标常量**
- 在文件顶部添加 `const CORE_METRICS = ['C3', 'C4', 'C6', 'C8', 'C9']`
- 预期输出: 常量定义完成

**Step 3: 修改渲染逻辑**
- 在 `renderCoverageBars()` 中只遍历 CORE_METRICS
- 过滤掉其他指标
- 预期输出: 只渲染 5 个核心指标

**Step 4: 本地验证**
```bash
open scripts/stage-viewer/index.html
```
- 检查覆盖率仪表盘
- 预期输出: 只显示 C3/C4/C6/C8/C9

**测试设计输入**：
- target_fr_ids: FR-UIOPT-002
- target_ac_ids: AC-UIOPT-002-01, AC-UIOPT-002-02, AC-UIOPT-002-03, AC-UIOPT-002-04
- recommended_test_levels: manual
- failure_cases: 指标顺序错误、显示了已下线指标
- definition_of_done: 所有 AC 通过手动验证
- test_intent: 验证覆盖率指标精简正确

**状态**: planned

---

### TASK-UIOPT-003 — 优化健康分计算与展示

**Owner**: FE
**预计工期**: 0.3d
**traces**: FR-UIOPT-003, DS-UIOPT-003
**depends_on**: -
**用户故事**: US2

**目标**：
修改 `scripts/stage-viewer/app.js` 中的 `calculateHealthScore()` 函数，基于 5 个核心指标重新计算，调整颜色阈值，显示 profile。

**验收标准**：
- [ ] 健康分只基于 C3/C4/C6/C8/C9 计算
- [ ] 健康分颜色阈值：≥90 绿色，70-89 黄色，<70 红色
- [ ] 健康分卡片内显示当前 profile
- [ ] 健康分环形图正确反映计算结果

**文件清单**：
- Modify: `scripts/stage-viewer/app.js` (calculateHealthScore, getHealthColor 函数)

**执行步骤**：

**Step 1: 读取当前实现**
- 打开 `scripts/stage-viewer/app.js`
- 定位 `calculateHealthScore()` 和 `getHealthColor()` 函数
- 预期输出: 理解当前健康分计算逻辑

**Step 2: 修改健康分计算**
- 修改 `calculateHealthScore()` 权重为 C3:0.25, C4:0.20, C6:0.25, C8:0.15, C9:0.15
- 只基于 5 个核心指标计算
- 预期输出: 健康分计算逻辑更新

**Step 3: 修改颜色阈值**
- 修改 `getHealthColor()` 阈值：≥90 绿色，70-89 黄色，<70 红色
- 预期输出: 颜色阈值更新

**Step 4: 添加 profile 显示**
- 读取 `stage-state.json` 中的 `mergedRules.profile`
- 在健康分卡片底部显示 profile
- 预期输出: Profile 信息显示在健康分卡片内

**Step 5: 本地验证**
```bash
open scripts/stage-viewer/index.html
```
- 检查健康分计算和颜色
- 检查 profile 显示
- 预期输出: 健康分和 profile 正确显示

**测试设计输入**：
- target_fr_ids: FR-UIOPT-003
- target_ac_ids: AC-UIOPT-003-01, AC-UIOPT-003-02, AC-UIOPT-003-03, AC-UIOPT-003-04
- recommended_test_levels: manual
- failure_cases: 权重计算错误、颜色阈值错误、profile 读取失败
- definition_of_done: 所有 AC 通过手动验证
- test_intent: 验证健康分计算和展示正确

**状态**: planned

---

### TASK-UIOPT-004 — 添加样式支持

**Owner**: FE
**预计工期**: 0.1d
**traces**: FR-UIOPT-001, FR-UIOPT-002, FR-UIOPT-003
**depends_on**: TASK-UIOPT-001, TASK-UIOPT-002, TASK-UIOPT-003
**用户故事**: US3

**目标**：
在 `scripts/stage-viewer/styles.css` 中添加 `.warn` 样式，支持黄色警告标识。

**验收标准**：
- [ ] .warn 样式定义完成
- [ ] 黄色警告标识正确显示
- [ ] 样式与现有 .ok/.fail 一致

**文件清单**：
- Modify: `scripts/stage-viewer/styles.css`

**执行步骤**：

**Step 1: 读取现有样式**
- 打开 `scripts/stage-viewer/styles.css`
- 查看 .ok 和 .fail 样式定义
- 预期输出: 理解现有样式结构

**Step 2: 添加 .warn 样式**
- 添加 `.warn { color: #f59e0b; font-weight: bold; }`
- 预期输出: .warn 样式定义完成

**Step 3: 本地验证**
```bash
open scripts/stage-viewer/index.html
```
- 检查 [WARN] 标识颜色
- 预期输出: 黄色警告标识正确显示

**测试设计输入**：
- target_fr_ids: FR-UIOPT-001
- target_ac_ids: AC-UIOPT-001-02
- recommended_test_levels: manual
- failure_cases: 颜色不正确、样式未生效
- definition_of_done: [WARN] 标识显示为黄色
- test_intent: 验证样式支持正确

**状态**: planned

---

## 验证命令

```bash
# 本地验证
open scripts/stage-viewer/index.html

# 检查 Gate 条件表格
# 检查覆盖率指标
# 检查健康分和 profile
```
