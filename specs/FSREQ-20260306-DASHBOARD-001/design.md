# Design - 仪表盘数据可视化优化

**Feature ID**: FSREQ-20260306-DASHBOARD-001

---

## DS-DASHBOARD-001: 健康仪表盘样式设计

**映射**: FR-DASHBOARD-001

**模块**: `scripts/stage-viewer/styles.css`

**设计方案**:

### 1. 健康分环形图渐变色
- 使用 CSS `conic-gradient` 实现渐变效果
- 颜色映射：
  - 0-59分: `#ef4444` (红色)
  - 60-79分: `#f59e0b` (黄色)
  - 80-100分: `#10b981` (绿色)
- 通过 JavaScript 动态设置 `stroke-dashoffset` 和 `stroke` 颜色

### 2. 覆盖率柱状图悬停提示
- 使用 CSS `::after` 伪元素实现 tooltip
- 悬停时显示具体数值
- 样式：白色背景 + 阴影 + 圆角

### 3. 缺陷统计卡片阴影
- 使用 `box-shadow` 增加层次感
- 阴影参数: `0 2px 8px rgba(0,0,0,0.1)`

**关键约束**:
- 仅修改 CSS，不改变 HTML 结构
- 保持现有功能逻辑不变

---
## DS-DASHBOARD-002: 整体布局样式设计

**映射**: FR-DASHBOARD-002

**模块**: `scripts/stage-viewer/styles.css`

**设计方案**:

### 1. 侧边栏优化
- 宽度调整: `280px` → `300px`
- 内边距: `24px`
- 背景色: `#f9fafb`

### 2. 主区域间距统一
- 卡片间距: `24px`
- 内容内边距: `20px`
- 标题间距: `16px`

### 3. 响应式适配
- 最小宽度: `1280px`
- 使用 `@media` 查询适配不同屏幕

**关键约束**:
- 保持现有布局结构
- 仅调整间距和尺寸

---

## DS-DASHBOARD-003: 交互动画设计

**映射**: FR-DASHBOARD-003

**模块**: `scripts/stage-viewer/styles.css`

**设计方案**:

### 1. 阶段流转图悬停动画
- 使用 `transition` 实现平滑过渡
- 悬停效果: `transform: scale(1.05)`
- 过渡时间: `200ms`

### 2. 任务进度卡片点击反馈
- 点击时: `transform: scale(0.98)`
- 使用 `:active` 伪类

### 3. 时间线平滑滚动
- 使用 `scroll-behavior: smooth`

**关键约束**:
- 动画时长 < 300ms
- 使用 CSS 动画，避免 JavaScript

---
## Constitution 合规性

本设计遵循以下宪法条款：

- **Constitution Clause P1 (v1.1.0)**: 简洁至上（KISS）- 仅修改 CSS，避免过度工程化
- **Constitution Clause P2 (v1.1.0)**: 事实为本 - 设计基于现有代码结构
- **Constitution Clause P5 (v1.1.0)**: 代码变动铁律 - 修改后需强制自检

---
