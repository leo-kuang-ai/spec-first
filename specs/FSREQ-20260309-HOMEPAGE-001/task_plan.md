# Task Plan — FSREQ-20260309-HOMEPAGE-001

> Spec-First Viewer 首页样式优化

## 任务明细

| Task ID | 标题 | Owner | 预计工期 | traces | depends_on | 验收标准 | 验证命令 | 状态 |
|---|---|---|---|---|---|---|---|---|
| TASK-VIS-001 | 视觉层次优化 | dev | 0.5d | DS-VIS-001 | - | 字号、颜色、间距符合设计 | 浏览器目视检查 | todo |
| TASK-INT-001 | 交互体验提升 | dev | 0.5d | DS-INT-001 | TASK-VIS-001 | 悬停、焦点效果符合设计 | 浏览器交互测试 | todo |
| TASK-VIZ-001 | 数据可视化增强 | dev | 0.5d | DS-VIZ-001 | TASK-VIS-001 | 图表样式符合设计 | 浏览器目视检查 | todo |
| TASK-LAY-001 | 整体布局优化 | dev | 0.5d | DS-LAY-001 | TASK-VIS-001 | 布局间距符合设计 | 浏览器目视检查 | todo |

## 实施步骤

### TASK-VIS-001 — 视觉层次优化

**目标**: 优化字号、颜色对比度和间距规范

**文件清单**:
- `scripts/stage-viewer/styles.css`

**执行步骤**:
1. 修改 CSS 变量：h1 字号 18px→20px，h2 字号 15px→16px
2. 修改 `--muted` 颜色值：#8ea1c2→#9babc9
3. 统一 section 间距为 20px，卡片内边距 12-16px
4. 验证颜色对比度 ≥ 3:1

**验收标准**:
- AC-VIS-001-01: 字号和颜色对比度符合 WCAG AA
- AC-VIS-001-02: 间距规范统一
- AC-VIS-001-03: 关键信息视觉权重明显
- AC-VIS-001-04: 状态色辨识度清晰

---

### TASK-INT-001 — 交互体验提升

**目标**: 增强悬停反馈和焦点状态

**文件清单**:
- `scripts/stage-viewer/styles.css`

**执行步骤**:
1. 添加 Feature 列表项悬停位移动画（translateX 2px）
2. 统一过渡时长为 150ms，缓动函数 ease
3. 增强焦点 outline（2px，accent 色）
4. 确保所有可点击元素显示 pointer 光标

**验收标准**:
- AC-INT-001-01: Feature 列表项悬停有视觉反馈
- AC-INT-001-02: 可点击元素显示 pointer
- AC-INT-001-03: 过渡动画 150-200ms
- AC-INT-001-04: 焦点指示清晰可见

---

### TASK-VIZ-001 — 数据可视化增强

**目标**: 优化图表和统计卡片视觉呈现

**文件清单**:
- `scripts/stage-viewer/styles.css`

**执行步骤**:
1. 健康分环形图添加渐变色效果
2. 分数字号调整为 24px，等级标识 14px 加粗
3. 覆盖率柱状图添加圆角 4px
4. 缺陷统计卡片添加阴影效果
5. 统计数字使用等宽字体，字号 18px

**验收标准**:
- AC-VIZ-001-01: 环形图渐变色，分数字号 ≥ 24px
- AC-VIZ-001-02: 柱状图悬停显示数值
- AC-VIZ-001-03: 卡片阴影效果，色块区分明显
- AC-VIZ-001-04: 统计数字等宽字体，字号 ≥ 18px

---

### TASK-LAY-001 — 整体布局优化

**目标**: 统一布局和间距

**文件清单**:
- `scripts/stage-viewer/styles.css`

**执行步骤**:
1. 优化侧边栏搜索框焦点样式
2. 统一 Feature 列表项间距为 8px
3. 统一主区域 section 间距为 20px
4. 统一滚动条宽度为 6px

**验收标准**:
- AC-LAY-001-01: 搜索框焦点状态明显
- AC-LAY-001-02: 列表项间距 8px
- AC-LAY-001-03: section 间距 20px
- AC-LAY-001-04: 滚动条宽度 6px

---

## 验证命令

- 启动 Viewer: `node dist/cli/index.js viewer start`
- 浏览器访问: http://127.0.0.1:3000
- 目视检查所有样式变更
