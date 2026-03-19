# Task Plan — FSREQ-20260310-HOMEPERF-001

> Stage Viewer 页面性能优化

## 目标

优化 Stage Viewer 本地页面的加载和渲染性能，实现 FCP ≤ 1s，TTI ≤ 1.5s。

## 当前阶段

Phase 3: Task Planning (03_plan)

## 用户故事分组

### US1 — CSS 优化 (P0)
- [ ] TASK-HOMEPERF-001 [P] [US1] 提取关键 CSS
- [ ] TASK-HOMEPERF-002 [US1] 压缩优化 CSS

### US2 — JavaScript 优化 (P0)
- [ ] TASK-HOMEPERF-004 [US2] DOM 增量更新
- [ ] TASK-HOMEPERF-005 [P] [US2] 搜索防抖优化

### US3 — API 缓存 (P0)
- [ ] TASK-HOMEPERF-003 [P] [US3] 添加缓存机制

### US4 — 列表渲染优化 (P1)
- [ ] TASK-HOMEPERF-006 [US4] 虚拟滚动实现

### US5 — 首屏优化 (P0)
- [ ] TASK-HOMEPERF-007 [P] [US5] 骨架屏实现
- [ ] TASK-HOMEPERF-008 [US5] API 并行请求

### US6 — 性能验证
- [ ] TASK-HOMEPERF-009 [US6] 性能测试验证

## 任务明细

| Task ID | 标题 | Owner | 预计工期 | traces | depends_on | 验收标准 | target_ac_ids | 状态 |
|---------|------|-------|----------|--------|------------|----------|---------------|------|
| TASK-HOMEPERF-001 | 提取关键 CSS | FE | 0.3d | FR-HOMEPERF-001,DS-HOMEPERF-001 | - | 关键 CSS < 5KB，内联到 HTML | AC-HOMEPERF-001-02 | done |
| TASK-HOMEPERF-002 | 压缩优化 CSS | FE | 0.2d | FR-HOMEPERF-001,DS-HOMEPERF-001 | TASK-HOMEPERF-001 | CSS 体积减少 ≥ 30% | AC-HOMEPERF-001-01 | done |
| TASK-HOMEPERF-003 | 添加缓存机制 | FE | 0.4d | FR-HOMEPERF-003,DS-HOMEPERF-003 | - | 缓存 TTL ≥ 30s，强制刷新按钮 | AC-HOMEPERF-003-01,AC-HOMEPERF-003-03 | done |
| TASK-HOMEPERF-004 | DOM 增量更新 | FE | 0.4d | FR-HOMEPERF-002,DS-HOMEPERF-002,DS-HOMEPERF-006 | TASK-HOMEPERF-003 | 差异检测，仅更新变化部分 | AC-HOMEPERF-002-03 | done |
| TASK-HOMEPERF-005 | 搜索防抖优化 | FE | 0.2d | FR-HOMEPERF-002,FR-HOMEPERF-004,DS-HOMEPERF-002 | - | 搜索响应 < 100ms | AC-HOMEPERF-002-04,AC-HOMEPERF-004-03 | done |
| TASK-HOMEPERF-006 | 虚拟滚动实现 | FE | 0.5d | FR-HOMEPERF-004,DS-HOMEPERF-004 | TASK-HOMEPERF-004 | 100+ 列表渲染 < 300ms，滚动 ≥ 50fps | AC-HOMEPERF-004-01,AC-HOMEPERF-004-02 | done |
| TASK-HOMEPERF-007 | 骨架屏实现 | FE | 0.3d | FR-HOMEPERF-005,DS-HOMEPERF-005 | - | 加载时显示骨架屏 | AC-HOMEPERF-005-03 | done |
| TASK-HOMEPERF-008 | API 并行请求 | FE | 0.3d | FR-HOMEPERF-005,DS-HOMEPERF-005 | TASK-HOMEPERF-003 | FCP ≤ 1s，TTI ≤ 1.5s | AC-HOMEPERF-005-01,AC-HOMEPERF-005-02,AC-HOMEPERF-005-04 | done |
| TASK-HOMEPERF-009 | 性能测试验证 | FE | 0.4d | NFR-PERF-001 | TASK-HOMEPERF-002,TASK-HOMEPERF-006,TASK-HOMEPERF-008 | 所有性能指标达标 | AC-HOMEPERF-001-01,AC-HOMEPERF-004-01,AC-HOMEPERF-005-01 | done |

## 实施步骤

### TASK-HOMEPERF-001 — 提取关键 CSS

**目标**: 提取首屏关键 CSS 并内联到 HTML

**文件清单**:
- Modify: `scripts/stage-viewer/index.html`
- Create: `scripts/stage-viewer/critical.css`
- Modify: `scripts/stage-viewer/styles.css`

**执行步骤**:

**Step 1: 分析首屏样式**
- 识别首屏渲染所需的 CSS 规则
- 预期输出: 关键样式列表

**Step 2: 提取关键 CSS**
- 从 styles.css 提取关键样式到 critical.css
- 预期输出: critical.css < 5KB

**Step 3: 内联到 HTML**
- 在 index.html `<head>` 中内联 critical.css
- 预期输出: HTML 包含内联样式

**Step 4: 验证**
```bash
# 检查文件大小
ls -lh scripts/stage-viewer/critical.css
# 预期输出: < 5KB
```

**状态**: planned

### TASK-HOMEPERF-002 — 压缩优化 CSS

**目标**: 压缩 CSS 文件体积

**文件清单**:
- Modify: `scripts/stage-viewer/styles.css`

**执行步骤**:

**Step 1: 移除冗余样式**
- 删除重复的 CSS 规则
- 预期输出: 精简后的 styles.css

**Step 2: 压缩 CSS**
- 移除空格、注释
- 预期输出: CSS 体积减少 ≥ 30%

**状态**: planned

### TASK-HOMEPERF-003 — 添加缓存机制

**目标**: 实现本地内存缓存

**文件清单**:
- Modify: `scripts/stage-viewer/app.js`
- Modify: `scripts/stage-viewer/index.html`

**执行步骤**:

**Step 1: 实现缓存逻辑**
- 添加 cache 对象和 withCache 函数
- 预期输出: 缓存机制代码

**Step 2: 添加强制刷新按钮**
- 在 HTML 添加刷新按钮
- 预期输出: 按钮可清除缓存

**状态**: planned

### TASK-HOMEPERF-004 — DOM 增量更新

**目标**: 实现差异检测和增量更新

**文件清单**:
- Modify: `scripts/stage-viewer/app.js`

**执行步骤**:

**Step 1: 实现差异检测**
- 对比新旧数据，识别变化
- 预期输出: 差异检测函数

**Step 2: 增量更新 DOM**
- 仅更新变化的节点
- 预期输出: 减少 DOM 操作

**状态**: planned

### TASK-HOMEPERF-005 — 搜索防抖优化

**目标**: 添加搜索输入防抖

**文件清单**:
- Modify: `scripts/stage-viewer/app.js`

**执行步骤**:

**Step 1: 实现防抖函数**
- 添加 debounce 函数
- 预期输出: 300ms 防抖延迟

**Step 2: 应用到搜索输入**
- 绑定到搜索框事件
- 预期输出: 搜索响应 < 100ms

**状态**: planned

### TASK-HOMEPERF-006 — 虚拟滚动实现

**目标**: 实现虚拟滚动

**文件清单**:
- Modify: `scripts/stage-viewer/app.js`

**执行步骤**:

**Step 1: 计算可见区域**
- 根据滚动位置计算可见项
- 预期输出: 可见项索引范围

**Step 2: 渲染可见项**
- 仅渲染可见项 + 缓冲区
- 预期输出: 100+ 列表 < 300ms

**状态**: planned

### TASK-HOMEPERF-007 — 骨架屏实现

**目标**: 添加加载骨架屏

**文件清单**:
- Modify: `scripts/stage-viewer/index.html`
- Modify: `scripts/stage-viewer/styles.css`

**执行步骤**:

**Step 1: 添加骨架屏 HTML**
- 在 HTML 添加骨架屏结构
- 预期输出: 骨架屏 DOM

**Step 2: 添加骨架屏样式**
- 添加 CSS 动画
- 预期输出: 加载时显示骨架屏

**状态**: planned

### TASK-HOMEPERF-008 — API 并行请求

**目标**: 并行化 API 请求

**文件清单**:
- Modify: `scripts/stage-viewer/app.js`

**执行步骤**:

**Step 1: 使用 Promise.all**
- 并行发起多个 API 请求
- 预期输出: 请求并行执行

**Step 2: 验证性能**
- 测量 FCP 和 TTI
- 预期输出: FCP ≤ 1s，TTI ≤ 1.5s

**状态**: planned

### TASK-HOMEPERF-009 — 性能测试验证

**目标**: 验证所有性能指标

**文件清单**:
- Reference: `scripts/stage-viewer/index.html`
- Reference: `scripts/stage-viewer/app.js`

**执行步骤**:

**Step 1: 测量性能指标**
- 使用 Chrome DevTools 测量
- 预期输出: FCP, TTI, 渲染时间数据

**Step 2: 验证达标**
- 对比目标值
- 预期输出: 所有指标达标

**状态**: planned


