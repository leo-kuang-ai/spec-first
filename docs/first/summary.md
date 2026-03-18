# 项目摘要

> 标准模式：deep
> 文档层级：docs/first 投影视图
> 真源依赖：.spec-first/runtime/first/summary.json

## 项目是什么
- 项目: spec-first
- 平台: cli-tool
- 生成时间: 2026-03-17T10:30:00.000Z
- 概述: AI-workflow CLI for spec-driven development — quality gates, traceability, and feature lifecycle management for AI-era teams

## 主要能力
- Stage State Machine (8 active + 2 terminal)
- Gate Engine (19 conditions: 16 blocking + 3 warning)
- Trace Engine (14 ID types, 5 coverage metrics)
- Skill Runtime (20 skills, 3-layer routing)
- Change Management (RFC + Defect state machines)
- AI Orchestrator (auto-loop, catchup context recovery)
- Template Engine (Handlebars-based artifact generation)
- CLI Commands (27 commands)

## 入口
- src/cli/index.ts
- dist/cli/index.js

## 关键模块
- cli
- process-engine
- skill-runtime
- gate-engine
- trace-engine
- change-mgr
- ai-orchestrator
- template
- tool-integration
- metrics-engine
- validators
- task-plan
- rules
- batch-executor
- migrations
- host-adapters
- shared
- config

## 核心数据模型
- Feature
- Stage
- IdType
- ExitCode
- GateCondition
- GateResult
- CoverageMetrics
- RFC
- Defect
- Waiver

## 接口面
- spec-first init
- spec-first stage advance
- spec-first gate check
- spec-first matrix sync
- spec-first feature current
- spec-first id generate
- spec-first id search
- spec-first defect create
- spec-first rfc create
- spec-first skill render
- spec-first first
- spec-first doctor
- spec-first orchestrate
- spec-first ai context
- spec-first ai catchup

## 风险
- Stage state machine is irreversible - manual edits to stage-state.json will corrupt state
- Gate conditions are blocking - failed gates prevent stage advancement
- Coverage thresholds (C3/C4/C6/C8/C9) must be met for stage advancement
- ID format validation is strict - non-conforming IDs will be rejected
- Traceability matrix must be synchronized manually or via CLI

## 证据摘要
- package.json:1-98 — project metadata — [显式]
- src/shared/types.ts:7-18 — Stage enum definition — [显式]
- src/core/gate-engine/condition-registry.ts:1-50 — Gate conditions — [显式]
- src/core/trace-engine/id-validator.ts:9-22 — ID patterns — [显式]