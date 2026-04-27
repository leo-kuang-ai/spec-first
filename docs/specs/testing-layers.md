---
spec_id: testing-layers
title: 测试分层策略
source: extracted
confirmation_status: confirmed
lifecycle_status: active
level: L3
scope:
  - testing
  - cli
  - crg
  - workflows
priority: 85
severity: medium
confidence: high
status: active
---

# 测试分层策略

## Agent 摘要

- 本项目使用四个测试层：unit、smoke、integration、e2e:crg。
- 需要运行的最低测试范围取决于所触及的变更面。
- 运行比变更面要求更窄的测试层是验证短路，不应接受。
- `npm test` 运行全部测试层；针对性验证可用子命令。

## 规则

### RULE-TESTING-LAYERS-001 测试层与变更面对应

- 状态: inferred
- 范围: testing
- 严重性: medium
- 规则: 改动 CLI 参数、状态文件或运行时同步逻辑时，至少运行相关 unit 测试和 smoke 测试（`npm run test:unit`、`npm run test:smoke`）。
- 验证方式: 对照下方映射表检查变更文件路径。

### RULE-TESTING-LAYERS-002 治理变更须先过入口 lint

- 状态: inferred
- 范围: testing/workflows
- 严重性: medium
- 规则: 改动 agent/workflow 治理、入口映射或合约时，须先运行入口治理 lint（`npm run lint:skills-lint`），再补 contract/unit 测试。
- 验证方式: 确认 lint 通过后再添加合约测试。

### RULE-TESTING-LAYERS-003 CRG 变更须运行 CRG unit 及 e2e

- 状态: inferred
- 范围: testing/crg
- 严重性: medium
- 规则: 改动 CRG 图构建、检索或 SQLite 逻辑时，运行相关 `tests/unit/crg-*.test.js`；影响面较广时还需运行 `npm run test:e2e:crg`。
- 验证方式: 确认哪些 CRG 测试覆盖了被改动的路径。

### RULE-TESTING-LAYERS-004 Stage-0 与上下文路由变更须运行集成测试

- 状态: inferred
- 范围: testing/cli
- 严重性: medium
- 规则: 改动 Stage-0 上下文、verification 或 context routing 时，运行 `npm run test:integration`，并按需补充 `tests/unit/*verification*` 和 `tests/unit/*context*` 下的 unit 测试。
- 验证方式: 确认集成测试输出覆盖了被改动的路由。

### RULE-TESTING-LAYERS-005 发布与打包变更须通过构建验证

- 状态: inferred
- 范围: testing/cli
- 严重性: medium
- 规则: 改动发布产物、打包内容或安装路径时，至少运行 `npm run build` 和相关 smoke/release 测试。
- 验证方式: 确认 `npm run build` 和 `npm run test:smoke` 通过。

## 变更面与测试层映射表

| 变更面 | 最低测试层 |
|---|---|
| CLI 参数 / 状态文件 / 运行时同步 | unit + smoke |
| Agent/workflow 治理 / 入口映射 / 合约 | 入口 lint + contract/unit |
| Stage-0 / verification / context routing | integration + unit |
| CRG 图 / 检索 / SQLite | crg unit + e2e:crg（影响面较广时）|
| 发布 / 打包 / 安装路径 | build + smoke/release |
| Agent/workflow prose 行为 | fresh-source eval（不可用同会话 typed-agent）|
