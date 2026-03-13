# Spec — FSREQ-20260313-UIOPT-001

> Stage Viewer 页面优化 - 同步反映全链路代码优化

## 功能需求 (FR)

### FR-UIOPT-001: Gate 条件展示优化

**需求描述**:
优化 Gate 条件表格展示，删除已下线的 Gate 条件，标识 warning-only 条件。

**上游追溯**: REQ-UIOPT-001

**验收标准**:
- AC-UIOPT-001-01: Gate 条件表格不显示 C1/C2/C5/C7 对应的 Gate 条件
- AC-UIOPT-001-02: warning-only 条件（C-PRD/C10/C11）显示 [WARN] 标识，颜色为黄色
- AC-UIOPT-001-03: blocking 条件失败时显示 [FAIL] 标识，颜色为红色
- AC-UIOPT-001-04: 通过的条件显示 [OK] 标识，颜色为绿色

---

### FR-UIOPT-002: 覆盖率指标精简

**需求描述**:
精简覆盖率指标展示，默认只显示 5 个核心指标（C3/C4/C6/C8/C9），删除已下线指标。

**上游追溯**: REQ-UIOPT-001

**验收标准**:
- AC-UIOPT-002-01: 覆盖率仪表盘只显示 5 个指标：C3/C4/C6/C8/C9
- AC-UIOPT-002-02: 不显示 C1/C2/C5/C7 指标
- AC-UIOPT-002-03: 每个指标显示名称、当前值、进度条
- AC-UIOPT-002-04: 指标按 C3/C4/C6/C8/C9 顺序排列

---

### FR-UIOPT-003: 健康分计算与展示优化

**需求描述**:
基于 5 个核心指标重新计算健康分，调整颜色阈值，在健康分卡片内显示 profile 信息。

**上游追溯**: REQ-UIOPT-001

**验收标准**:
- AC-UIOPT-003-01: 健康分只基于 C3/C4/C6/C8/C9 计算
- AC-UIOPT-003-02: 健康分颜色阈值：≥90 绿色，70-89 黄色，<70 红色
- AC-UIOPT-003-03: 健康分卡片内显示当前 profile（default-simplified / strict）
- AC-UIOPT-003-04: 健康分环形图正确反映计算结果

---

## 非功能需求 (NFR)

### NFR-UIOPT-001: 性能要求

- 页面加载时间 < 2s
- 数据刷新响应时间 < 500ms

---

## 追溯关系

```
REQ-UIOPT-001 (业务需求：同步页面展示与代码优化)
  ├─ FR-UIOPT-001 (Gate 条件展示优化)
  ├─ FR-UIOPT-002 (覆盖率指标精简)
  └─ FR-UIOPT-003 (健康分计算与展示优化)
```
