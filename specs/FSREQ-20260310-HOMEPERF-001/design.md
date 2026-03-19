# Design — FSREQ-20260310-HOMEPERF-001

> Stage Viewer 页面性能优化

## 设计概述

本文档针对 `/scripts/stage-viewer/` 本地静态页面的性能优化设计。

**页面特点**:
- 纯 HTML + CSS + 原生 JavaScript（无框架）
- 通过 fetch 调用本地 API（`/api/features` 等）
- 本地开发工具，无外部部署需求

**宪法合规性检查**: ✅
- Constitution Clause P1 (v1.1.0): 遵循 KISS 原则，仅针对实际痛点优化，无过度工程化
- Constitution Clause P4 (v1.1.0): 已完成前期调研，明确优化范围和技术方案

---

## DS 设计规格

### DS-HOMEPERF-001: CSS 优化

**映射**: FR-HOMEPERF-002, FR-HOMEPERF-005

**当前问题**:
- `styles.css` 约 1000 行，未压缩
- 所有样式内联在单个文件中
- 存在重复的样式定义

**优化策略**:

| 优化项 | 当前状态 | 目标状态 |
|--------|----------|----------|
| CSS 体积 | ~25KB | ~15KB（压缩后） |
| 关键 CSS | 全量加载 | 首屏内联 + 其余延迟 |
| 选择器优化 | 存在冗余 | 精简合并 |

**模块边界**:
```
scripts/stage-viewer/
├── styles.css          # 主样式（优化后）
├── critical.css        # 关键 CSS（首屏，内联到 HTML）
└── deferred.css        # 延迟加载样式（可选）
```

**关键约束**:
- 保持视觉一致性
- 支持响应式布局

---

### DS-HOMEPERF-002: JavaScript 优化

**映射**: FR-HOMEPERF-002, FR-HOMEPERF-005

**当前问题**:
- `app.js` 约 960 行，单文件
- 5 秒轮询刷新可能造成不必要的渲染
- DOM 操作可优化

**优化策略**:

| 优化项 | 当前状态 | 目标状态 |
|--------|----------|----------|
| JS 体积 | ~30KB | ~20KB（压缩后） |
| 刷新策略 | 5s 固定轮询 | 按需刷新 + 可配置间隔 |
| DOM 操作 | 直接 innerHTML | DocumentFragment + 增量更新 |

**模块边界**:
```
scripts/stage-viewer/
├── app.js              # 主逻辑（优化后）
└── utils/
    └── dom-helpers.js  # DOM 工具函数（可选提取）
```

**关键约束**:
- 保持 ES Module 兼容性
- 不引入构建工具依赖

---

### DS-HOMEPERF-003: API 响应缓存

**映射**: FR-HOMEPERF-003

**当前问题**:
- 每次轮询都完整请求 API
- 无本地缓存机制
- 重复数据重复渲染

**优化策略**:

| 接口 | 当前策略 | 优化策略 |
|------|----------|----------|
| `/api/features` | 5s 轮询 | 内存缓存 + 差异检测 |
| `/api/feature/{id}` | 每次请求 | 内存缓存 + 30s TTL |
| `/api/feature/{id}/tasks` | 每次请求 | 内存缓存 + 10s TTL |

**模块边界**:
```javascript
// 内存缓存实现（app.js 内）
const cache = {
  features: { data: null, timestamp: 0, ttl: 30000 },
  feature: new Map(),  // featureId -> { data, timestamp }
};

function withCache(key, fetcher, ttl) {
  const now = Date.now();
  const cached = cache[key];
  if (cached && (now - cached.timestamp) < ttl) {
    return cached.data;
  }
  return fetcher().then(data => {
    cache[key] = { data, timestamp: now };
    return data;
  });
}
```

**关键约束**:
- 缓存 TTL 可配置
- 提供"强制刷新"按钮

---

### DS-HOMEPERF-004: Feature 列表虚拟滚动

**映射**: FR-HOMEPERF-004

**当前问题**:
- Feature 数量多时，列表渲染慢
- 搜索时重新渲染整个列表

**优化策略**:

| 场景 | 当前实现 | 优化实现 |
|------|----------|----------|
| Feature 列表 | 全量 innerHTML | 虚拟滚动（仅渲染可见项） |
| 搜索过滤 | 重新渲染全部 | 增量更新 + 防抖 |

**接口设计**:
```javascript
// 虚拟滚动参数
const VIRTUAL_SCROLL = {
  itemHeight: 80,      // 每个 Feature 卡片高度
  bufferSize: 5,       // 上下缓冲数量
  containerHeight: 600 // 视口高度
};
```

**关键约束**:
- 滚动流畅度 ≥ 50fps
- 搜索响应时间 < 100ms

---

### DS-HOMEPERF-005: 首屏渲染优化

**映射**: FR-HOMEPERF-005

**当前问题**:
- CSS 阻塞渲染
- API 串行请求
- 无骨架屏

**优化策略**:

| 阶段 | 当前状态 | 优化状态 |
|------|----------|----------|
| HTML 加载 | 同步 CSS | 内联关键 CSS |
| JS 执行 | 阻塞 | defer + async |
| API 请求 | 串行 | 并行 + 缓存 |
| 加载状态 | 无 | 骨架屏 |

**骨架屏设计**:
```html
<!-- Feature 列表骨架屏 -->
<div class="feature-skeleton">
  <div class="skeleton-line" style="width:60%"></div>
  <div class="skeleton-line" style="width:80%"></div>
  <div class="skeleton-chips"></div>
</div>
```

**关键约束**:
- FCP ≤ 1s（本地环境）
- TTI ≤ 1.5s

---

### DS-HOMEPERF-006: 渲染性能优化

**映射**: FR-HOMEPERF-004, FR-HOMEPERF-005

**当前问题**:
- 大量 innerHTML 操作
- 频繁的 DOM 重排
- 轮询刷新全量重渲染

**优化策略**:

| 优化项 | 实现方式 |
|--------|----------|
| 差异检测 | 对比新旧数据，仅更新变化部分 |
| 批量更新 | 使用 requestAnimationFrame |
| 防抖搜索 | 300ms 防抖延迟 |
| 减少重排 | 使用 transform/opacity 动画 |

**代码示例**:
```javascript
// 差异检测 + 增量更新
function updateFeatureList(newFeatures) {
  const oldIds = new Set(state.features.map(f => f.featureId));
  const newIds = new Set(newFeatures.map(f => f.featureId));

  // 仅更新变化的 Feature
  for (const feature of newFeatures) {
    if (!oldIds.has(feature.featureId) ||
        JSON.stringify(state.features.find(f => f.featureId === feature.featureId)) !==
        JSON.stringify(feature)) {
      updateFeatureNode(feature);
    }
  }
}
```

---

## 追溯矩阵

| DS ID | 映射 FR | 优化类型 |
|-------|---------|----------|
| DS-HOMEPERF-001 | FR-HOMEPERF-002, FR-HOMEPERF-005 | CSS 优化 |
| DS-HOMEPERF-002 | FR-HOMEPERF-002, FR-HOMEPERF-005 | JS 优化 |
| DS-HOMEPERF-003 | FR-HOMEPERF-003 | API 缓存 |
| DS-HOMEPERF-004 | FR-HOMEPERF-004 | 虚拟滚动 |
| DS-HOMEPERF-005 | FR-HOMEPERF-005 | 首屏优化 |
| DS-HOMEPERF-006 | FR-HOMEPERF-004, FR-HOMEPERF-005 | 渲染优化 |

---

## 移除的需求

根据用户反馈，以下需求**不需要**：

| 原需求 | 原因 |
|--------|------|
| FR-HOMEPERF-001 (CDN + Redis) | 本地工具页面，无需 CDN |
| FR-HOMEPERF-006 (监控平台) | 本地开发工具，无需外部监控 |

---

## 开放问题

| 问题 | 建议 |
|------|------|
| 是否需要构建工具（Vite/esbuild）？ | 暂不引入，保持简单 |
| 虚拟滚动自研 vs 第三方？ | 自研（场景简单） |

---

## 设计简洁性自检

| 检查项 | 结果 |
|--------|------|
| 所有 DS 直接服务于当前 FR/NFR | ✅ |
| 无投机性架构层 | ✅ |
| 无与当前交付无关的扩展点 | ✅ |
| 设计层次最小化 | ✅ |
| 移除了不需要的 CDN/监控 | ✅ |
