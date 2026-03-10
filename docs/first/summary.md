---
mode: deep
generated_at: 2026-03-09T20:06:12.462Z
---

# 项目摘要

## 项目概览

- **项目名称**: spec-first
- **平台类型**: cli-tool
- **项目定位**: Specification-driven development process engine

## 核心能力

1. Feature lifecycle management
2. Stage state machine
3. Traceability matrix
4. Quality gates
5. RFC and defect tracking

## 核心模块

- cli
- process-engine
- skill-runtime
- ai-orchestrator
- gate-engine
- trace-engine
- change-mgr
- template
- tool-integration
- metrics-engine
- shared
- config

## 入口点

- `src/cli/index.ts`
- `src/core/process-engine/stage-machine.ts`
- `src/core/skill-runtime/dispatcher.ts`

## 核心实体

- Feature
- Stage
- Task
- RFC
- Defect
- Gate
- TraceabilityMatrix

## CLI 命令接口

- spec-first init
- spec-first stage
- spec-first id
- spec-first matrix
- spec-first rfc
- spec-first defect
- spec-first gate

## 技术栈

- runtime: Node.js ≥20.0.0
- language: TypeScript 5.4+
- module_system: ESM
- bundler: tsup
- test_framework: Vitest

## 风险点

*当前无已识别风险*
