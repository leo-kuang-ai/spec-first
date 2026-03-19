# Design — FSREQ-20260309-HOMEPAGE-001

> Spec-First Viewer 首页样式优化 - 技术设计

## Constitution 合规性

本设计遵循以下宪法条款：
- Constitution Clause P1 (v1.1.0) - 简洁至上（KISS）：仅修改 CSS，无过度工程化
- Constitution Clause P2 (v1.1.0) - 事实为本：设计基于现有代码结构

## 设计概述

本设计针对 Viewer 可视化面板的 CSS 样式优化，不涉及 HTML 结构和 JavaScript 逻辑变更。所有优化通过修改 `scripts/stage-viewer/styles.css` 实现。

**设计原则**:
- 仅修改 CSS 变量和样式规则
- 保持现有深色主题基调
- 遵循 KISS 原则，避免过度工程化

---

## DS-VIS-001: 视觉层次优化设计

**映射**: FR-VIS-001

**目标**: 改善信息层级和色彩系统

**设计方案**:

1. **字号层级**
   - h1: 18px → 20px
   - h2: 15px → 16px
   - 正文: 13px（保持）
   - 辅助文本: 12px（保持）

2. **颜色对比度优化**
   - 主文本: `--text: #e6edf7` (保持)
   - 辅助文本: `--muted: #8ea1c2` → `#9babc9` (提升对比度)
   - 背景: `--bg: #0b1220` (保持)

3. **间距规范**
   - section 间距: 统一为 20px
   - 卡片内边距: 统一为 12-16px
   - 列表项间距: 统一为 8px

4. **状态色增强**
   - 成功: `--ok: #2ec27e` (保持)
   - 警告: `--warn: #f5c451` (保持)
   - 危险: `--danger: #ef5c6b` (保持)
   - 确保色差 ≥ 3:1

**实现文件**: `scripts/stage-viewer/styles.css`

**简洁性自检**: ✅ 仅调整现有 CSS 变量和规则，无新增层次

---

## DS-INT-001: 交互体验提升设计

**映射**: FR-INT-001

**目标**: 增强悬停反馈和焦点状态

**设计方案**:

1. **悬停效果优化**
   - Feature 列表项: 添加 `transform: translateX(2px)` 位移
   - 过渡时长: 统一为 150ms
   - 缓动函数: `ease`

2. **焦点状态增强**
   - outline 宽度: 2px
   - outline 颜色: `var(--accent)`
   - outline-offset: 2px

3. **光标指示**
   - 所有可点击元素: `cursor: pointer`

**实现文件**: `scripts/stage-viewer/styles.css`

**简洁性自检**: ✅ 仅优化现有交互样式，无新增组件

---
## DS-VIZ-001: 数据可视化增强设计

**映射**: FR-VIZ-001

**目标**: 优化图表和统计卡片视觉呈现

**设计方案**:

1. **健康分环形图**
   - 渐变色: `stroke: linear-gradient(135deg, var(--ok), var(--accent))`
   - 分数字号: 24px
   - 等级标识: 字号 14px，加粗

2. **覆盖率柱状图**
   - 柱状图圆角: 4px
   - 悬停提示: 使用 CSS `::after` 伪元素
   - 数据标签: 字号 12px

3. **缺陷统计卡片**
   - 卡片阴影: `box-shadow: 0 2px 8px rgba(0,0,0,0.2)`
   - 严重等级色块: 使用状态色变量
   - 统计数字: 等宽字体，字号 18px

**实现文件**: `scripts/stage-viewer/styles.css`

**简洁性自检**: ✅ 仅优化现有图表样式，无新增可视化组件

---

## DS-LAY-001: 整体布局优化设计

**映射**: FR-LAY-001

**目标**: 统一布局和间距

**设计方案**:

1. **侧边栏优化**
   - 搜索框焦点: `border-color: var(--accent)`, `box-shadow: 0 0 0 3px rgba(78,161,255,0.15)`
   - Feature 列表项间距: 8px

2. **主区域间距**
   - section 间距: 20px
   - 卡片内边距: 12-16px

3. **滚动条统一**
   - 宽度: 6px
   - 颜色: `var(--border)`
   - 悬停色: `var(--muted)`

**实现文件**: `scripts/stage-viewer/styles.css`

**简洁性自检**: ✅ 仅调整现有布局参数，无新增布局层

---

## 数据模型

无需数据模型变更（仅 CSS 优化）

---

## 接口契约

无需接口变更（仅 CSS 优化）

---

## 关键约束

1. **性能约束**
   - CSS 文件大小 ≤ 30KB
   - CSS 选择器嵌套层级 ≤ 3

2. **兼容性约束**
   - 支持 Chrome/Edge/Firefox/Safari 最新版本
   - 桌面端宽度 ≥ 1280px

3. **实现约束**
   - 不修改 HTML 结构
   - 不引入外部 CSS 框架
   - 保持深色主题基调
