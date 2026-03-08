# Task Plan - 仪表盘数据可视化优化

**Feature ID**: FSREQ-20260306-DASHBOARD-001

---

## 目标
优化 Stage Viewer 页面展示效果，提升视觉美观度、信息密度和交互体验。

## 当前阶段
08_done (Completed)

## 任务明细

| Task ID | 标题 | Owner | 预计工期 | traces | depends_on | 验收标准 | 状态 |
|---------|------|-------|----------|--------|------------|----------|------|
| TASK-DASHBOARD-001 | 健康仪表盘样式优化 | FE | 0.3d | FR-DASHBOARD-001 | - | 环形图渐变色、柱状图tooltip、卡片阴影生效 | verified |
| TASK-DASHBOARD-002 | 整体布局样式优化 | FE | 0.2d | FR-DASHBOARD-002 | - | 侧边栏、间距、响应式优化生效 | verified |
| TASK-DASHBOARD-003 | 交互动画优化 | FE | 0.2d | FR-DASHBOARD-003 | TASK-DASHBOARD-001,TASK-DASHBOARD-002 | 悬停动画、点击反馈、平滑滚动生效 | verified |

---
## 任务详细定义

### TASK-DASHBOARD-001: 健康仪表盘样式优化

**Owner**: FE
**预计工期**: 0.3d
**traces**: FR-DASHBOARD-001,DS-DASHBOARD-001
**depends_on**: -

**目标**：
优化健康仪表盘模块的视觉呈现效果。

**验收标准**：
- [x] 健康分环形图根据分数显示渐变色（0-59红、60-79黄、80-100绿）
- [x] 覆盖率柱状图悬停显示具体数值
- [x] 缺陷统计卡片有阴影效果

**文件清单**：
- Modify: `scripts/stage-viewer/styles.css`

**执行步骤**：

**Step 1: 优化健康分环形图**
- 修改 `.health-score-ring .progress` 样式
- 添加动态颜色逻辑（通过 CSS 变量或 JS 设置）
- 预期输出: 环形图显示渐变色

**Step 2: 优化覆盖率柱状图**
- 为 `.coverage-bars` 子元素添加 `::after` 伪元素
- 实现 tooltip 样式
- 预期输出: 悬停显示数值

**Step 3: 优化缺陷统计卡片**
- 为 `.defect-stats` 添加 `box-shadow`
- 预期输出: 卡片有阴影层次感

**Step 4: Commit**
```bash
git add scripts/stage-viewer/styles.css
git commit -m "feat(viewer): 优化健康仪表盘样式"
```

**验证命令**：
```bash
# 启动服务查看效果
cd scripts/stage-viewer && node server.js
# 浏览器访问 http://localhost:8080
```

**状态**: verified

---
### TASK-DASHBOARD-002: 整体布局样式优化

**Owner**: FE
**预计工期**: 0.2d
**traces**: FR-DASHBOARD-002,DS-DASHBOARD-002
**depends_on**: -

**目标**：
优化页面整体布局和导航体验。

**验收标准**：
- [x] 侧边栏宽度和内边距优化
- [x] 主区域内容间距统一
- [x] 响应式适配 1280px+

**文件清单**：
- Modify: `scripts/stage-viewer/styles.css`

**执行步骤**：

**Step 1: 优化侧边栏**
- 调整 `.sidebar` 宽度和内边距
- 预期输出: 侧边栏视觉呼吸感提升

**Step 2: 统一主区域间距**
- 调整卡片间距和内边距
- 预期输出: 内容层级清晰

**Step 3: Commit**
```bash
git add scripts/stage-viewer/styles.css
git commit -m "feat(viewer): 优化整体布局样式"
```

**状态**: verified

---
### TASK-DASHBOARD-003: 交互动画优化

**Owner**: FE
**预计工期**: 0.2d
**traces**: FR-DASHBOARD-003,DS-DASHBOARD-003
**depends_on**: TASK-DASHBOARD-001,TASK-DASHBOARD-002

**目标**：
优化各模块的交互反馈效果。

**验收标准**：
- [x] 阶段流转图节点悬停有动画
- [x] 任务进度卡片点击有反馈
- [x] 时间线视图平滑滚动

**文件清单**：
- Modify: `scripts/stage-viewer/styles.css`

**执行步骤**：

**Step 1: 添加悬停动画**
- 为阶段流转图节点添加 `transition` 和 `:hover` 效果
- 预期输出: 悬停时节点放大

**Step 2: 添加点击反馈**
- 为任务卡片添加 `:active` 效果
- 预期输出: 点击时卡片缩小

**Step 3: 添加平滑滚动**
- 为时间线容器添加 `scroll-behavior: smooth`
- 预期输出: 滚动平滑

**Step 4: Commit**
```bash
git add scripts/stage-viewer/styles.css
git commit -m "feat(viewer): 优化交互动画"
```

**状态**: verified
