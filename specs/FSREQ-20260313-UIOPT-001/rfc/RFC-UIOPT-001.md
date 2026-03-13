# RFC-UIOPT-001: Stage Viewer 前端代码测试豁免

## 状态
approved

## 提出时间
2026-03-13

## 批准时间
2026-03-13

## 问题描述
Stage Viewer 前端代码（scripts/stage-viewer/*.js）为纯浏览器端 JavaScript，当前项目未配置前端测试框架（如 Jest/Vitest for browser）。

## 提议方案
对 FR-UIOPT-001/002/003 申请 C4 覆盖率豁免，通过手动验证确保功能正确性。

## 影响范围
- FR-UIOPT-001: Gate 条件展示优化
- FR-UIOPT-002: 覆盖率指标精简
- FR-UIOPT-003: 健康分计算优化

## 回滚点
commit: HEAD

## 有效期
2026-06-13
