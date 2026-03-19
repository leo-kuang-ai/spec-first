# Design — FSREQ-20260313-UIOPT-001

> Stage Viewer 页面优化 - 技术设计

## 设计概述

本设计针对 stage-viewer 页面进行优化，使其展示逻辑与后端代码优化保持一致。主要涉及前端 JavaScript 代码修改，不涉及后端 API 变更。

---

## DS-UIOPT-001: Gate 条件展示逻辑优化

**映射**: FR-UIOPT-001

**模块**: `scripts/stage-viewer/app.js`

**设计方案**:
- 修改 `renderGateTable()` 函数，过滤已下线的 Gate 条件
- 添加 `formatGateStatus()` 函数，根据 `blocking` 字段返回不同标识
- 读取 `gate-history.jsonl` 中的 `blocking` 字段

**关键逻辑**:
```javascript
function formatGateStatus(condition) {
  if (condition.status === 'PASS') return '<span class="ok">[OK]</span>';
  if (condition.status === 'WAIVER') return '<span class="waiver">[WVR]</span>';
  if (condition.status === 'FAIL' && condition.blocking === false) {
    return '<span class="warn">[WARN]</span>';
  }
  return '<span class="fail">[FAIL]</span>';
}
```

**数据来源**: `specs/{featureId}/gate-history.jsonl`

---

## DS-UIOPT-002: 覆盖率指标展示精简

**映射**: FR-UIOPT-002

**模块**: `scripts/stage-viewer/app.js`

**设计方案**:
- 修改 `renderCoverageBars()` 函数，只渲染 5 个核心指标
- 定义常量 `CORE_METRICS = ['C3', 'C4', 'C6', 'C8', 'C9']`
- 过滤 coverage 对象，只保留核心指标

**关键逻辑**:
```javascript
const CORE_METRICS = ['C3', 'C4', 'C6', 'C8', 'C9'];
function renderCoverageBars(coverage) {
  const html = CORE_METRICS.map(metric => {
    const value = coverage[metric] || 0;
    return `<div class="coverage-bar">
      <span>${metric}</span>
      <div class="bar"><div style="width:${value*100}%"></div></div>
      <span>${(value*100).toFixed(1)}%</span>
    </div>`;
  }).join('');
  document.getElementById('coverageBars').innerHTML = html;
}
```

**数据来源**: `traceability-matrix.md` 计算得出的覆盖率

---

## DS-UIOPT-003: 健康分计算与展示优化

**映射**: FR-UIOPT-003

**模块**: `scripts/stage-viewer/app.js`

**设计方案**:
- 修改 `calculateHealthScore()` 函数，只基于 5 个核心指标计算
- 调整颜色阈值：≥90 绿色，70-89 黄色，<70 红色
- 在健康分卡片内添加 profile 显示

**关键逻辑**:
```javascript
function calculateHealthScore(coverage) {
  const weights = { C3: 0.25, C4: 0.20, C6: 0.25, C8: 0.15, C9: 0.15 };
  let score = 0;
  for (const [metric, weight] of Object.entries(weights)) {
    score += (coverage[metric] || 0) * weight;
  }
  return score * 100;
}

function getHealthColor(score) {
  if (score >= 90) return 'green';
  if (score >= 70) return 'yellow';
  return 'red';
}
```

**Profile 展示**:
- 读取 `stage-state.json` 中的 `mergedRules.profile`
- 在健康分卡片底部显示：`Profile: default-simplified`

**数据来源**:
- `traceability-matrix.md` (覆盖率)
- `stage-state.json` (profile)

---

## 文件修改清单

| 文件 | 修改类型 | 说明 |
|------|---------|------|
| `scripts/stage-viewer/app.js` | 修改 | 核心逻辑修改 |
| `scripts/stage-viewer/styles.css` | 修改 | 添加 .warn 样式 |

---

## 数据流

```
stage-state.json → 读取 profile
gate-history.jsonl → 读取 conditions (含 blocking)
traceability-matrix.md → 计算覆盖率 (只用 C3/C4/C6/C8/C9)
  ↓
app.js 渲染逻辑
  ↓
HTML 页面展示
```

---

## 非功能需求实现

**NFR-UIOPT-001: 性能要求**
- 使用 DocumentFragment 批量更新 DOM
- 避免重复读取文件，使用缓存
- 指标过滤在内存中完成，不增加 I/O

---

## 风险与约束

**风险**:
- 旧版 gate-history.jsonl 中可能没有 blocking 字段 → 默认为 true

**约束**:
- 不修改后端 CLI 代码
- 保持页面结构不变，只修改渲染逻辑
