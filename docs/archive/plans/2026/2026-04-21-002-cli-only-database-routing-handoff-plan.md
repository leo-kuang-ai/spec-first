---
title: 收缩 bootstrap 数据库 handoff 为 CLI-only
type: refactor
status: superseded
date: 2026-04-21
---

# 收缩 bootstrap 数据库 handoff 为 CLI-only

## Overview

当前 `spec-graph-bootstrap` 的数据库模块已经从重型 route/worker 收缩为 `LLM-first handoff`，但 `database-routing.json` 仍然保留了 `mysql-mcp` 这条 route 语义，并且 `recommended_action` 对 route 与凭证完备性的判断过于宽松。用户明确要求进一步简化：直接去掉 `mysql-mcp`，只保留 CLI 只读能力。

本轮工作不再继续扩展项目类型 profile，也不回到重型 route state machine，而是把 handoff 再收紧一层：**bootstrap 只暴露与当前 hints 真正相关的 CLI 只读能力，并且只有在 route 与 env 条件同时满足时才推荐 `llm-readonly-introspect`。**

## Planning Anchor

- Restated Understanding：需要把数据库 handoff 从 `mysql-cli + mysql-mcp` 双 route 收缩为 `cli-only`，同时修正 readiness 误判，避免 downstream LLM 被错误引导去做只读 introspection。
- Current Core Goal：移除 `mysql-mcp`，让 `database-routing.json` 的 capability / blocker / recommended_action 更保守、更真实。
- Scope / Non-goals：只修改 bootstrap 数据库 handoff 的 contract、实现、样例和测试；不重新引入 database worker，不新增其他数据库类型的 CLI route，不改下游 workflow 的数据库分析行为。
- Verification-as-Done：能够证明 `database-routing.json` 不再暴露 `mysql-mcp`；非 MySQL 或无 CLI hint 场景不会误报 `llm-readonly-introspect`；env hint 不完整时会显式阻断 introspection。

## Requirements Trace

- R1. `database-routing.json` 不再暴露 `mysql-mcp`。
- R2. `runtime_capabilities.available_readonly_routes` 只表达当前 hints 相关的 CLI route，不再把无关 route 当作通用能力。
- R3. `recommended_action=llm-readonly-introspect` 只能在存在可用 CLI route 且必要 env hints 完整时出现。
- R4. 当没有 route hint、CLI 不可用或 env hints 不完整时，必须回退为 `llm-inspect-repo` 并写出 blocker。
- R5. source skill、prompt mirror、artifact schema、sample、fixture、unit test 必须同步移除 `mysql-mcp` 语义。
- R6. 不新增新的 route state machine、selected route、secret resolution 或 database 文档生成逻辑。

## Scope Boundaries

- 不恢复 `database/` 文档生成。
- 不新增 `postgres-cli`、`sqlite-cli` 等新 route。
- 不扩展 `fact-inventory.database[]` 的字段。
- 不改 `spec-plan` / `spec-work` / `spec-code-review` 的主流程，只更新它们消费的 database handoff 真源。

## Relevant Files

- `src/bootstrap-compiler/compile-routing.js`
- `src/bootstrap-compiler/sample-generator.js`
- `docs/contracts/spec-graph-bootstrap/database-routing.schema.json`
- `skills/spec-graph-bootstrap/references/artifact-schemas.md`
- `skills/spec-graph-bootstrap/references/database-worker.md`
- `skills/spec-graph-bootstrap/SKILL.md`
- `docs/10-prompt/skills/spec-graph-bootstrap/SKILL.md`
- `tests/unit/spec-graph-bootstrap-compiler.test.js`
- `tests/unit/spec-graph-bootstrap-contracts.test.js`
- `tests/fixtures/bootstrap/spec-first-bootstrap-sample.js`
- `CHANGELOG.md`
- `docs/08-版本更新/README.md`

## Key Decisions

- 决策 1：只保留 `mysql-cli`，移除 `mysql-mcp`。
  - 原因：当前 handoff 的目标是降低 orchestrator 复杂度，不是保留多 route 选择器。

- 决策 2：route availability 必须与当前 `static_access_hints` 对齐，而不是暴露“仓库里可能根本用不上的只读工具”。
  - 原因：非 MySQL hints 下暴露 `mysql-cli` 会误导 downstream LLM。

- 决策 3：`llm-readonly-introspect` 必须同时满足 `route available` 与 `env hints complete`。
  - 原因：只要缺少一部分 credential hints，就不应宣称当前可直接 introspect。

## Implementation Units

- [ ] Unit 1：收紧 routing compiler 的 CLI-only handoff 语义
  - Goal：移除 `mysql-mcp`，把 `available_readonly_routes`、`recommended_action` 和 `blockers` 改成与 hints/凭证更一致的逻辑。
  - Files：
    - `src/bootstrap-compiler/compile-routing.js`
  - Approach：
    - 删除 `hasMysqlMcp`
    - `available_readonly_routes` 只保留当前 hints 支持的 `mysql-cli`
    - 只有 `static_access_hints` 命中且 CLI 可用且 env hints 完整时才给出 `llm-readonly-introspect`
    - 对无 route hint、CLI 缺失、env hints 缺失分别写 blocker
  - Verification：
    - MySQL + 完整 env → `llm-readonly-introspect`
    - Postgres hint / 无 CLI hint → `llm-inspect-repo`
    - MySQL + 部分 env → `llm-inspect-repo` + env blocker

- [ ] Unit 2：同步 contract / sample / docs mirror
  - Goal：让 schema、artifact docs、skill docs 与 CLI-only handoff 保持一致。
  - Files：
    - `src/bootstrap-compiler/sample-generator.js`
    - `docs/contracts/spec-graph-bootstrap/database-routing.schema.json`
    - `skills/spec-graph-bootstrap/references/artifact-schemas.md`
    - `skills/spec-graph-bootstrap/references/database-worker.md`
    - `skills/spec-graph-bootstrap/SKILL.md`
    - `docs/10-prompt/skills/spec-graph-bootstrap/SKILL.md`
  - Verification：
    - 全仓不再出现 `mysql-mcp` 作为 active route contract
    - docs mirror 与 source skill 锚点一致

- [ ] Unit 3：补测试与治理收尾
  - Goal：用针对性测试锁住新的 CLI-only 语义，并补齐变更记录。
  - Files：
    - `tests/unit/spec-graph-bootstrap-compiler.test.js`
    - `tests/unit/spec-graph-bootstrap-contracts.test.js`
    - `tests/fixtures/bootstrap/spec-first-bootstrap-sample.js`
    - `CHANGELOG.md`
    - `docs/08-版本更新/README.md`
  - Verification：
    - `npx jest tests/unit/spec-graph-bootstrap-compiler.test.js --runInBand`
    - `npx jest tests/unit/spec-graph-bootstrap-contracts.test.js --runInBand`
    - `npx jest tests/unit/asset-consistency.test.js --runInBand`
    - `npm run test:smoke`
    - `npm run test:integration`

## Risks

- 如果 route 判定收得过紧，某些仅有部分 env hint 的仓库会从 `introspect` 降级到 `inspect-repo`；这是有意的保守化，不视为回归。
- 现有测试样例大多围绕 MySQL，需要补一条“非 MySQL 不误报 CLI route”的回归用例。
