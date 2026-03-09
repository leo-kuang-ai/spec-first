# First Runtime Summary

## 项目概览
- 项目: spec-first
- 模式: deep
- 平台: cli-tool
- 生成时间: 2026-03-09T04:52:18.445Z
- 概述: Specification-driven development process engine

## Tech Stack
- runtime: Node.js ≥20.0.0
- language: TypeScript 5.4+
- module_system: ESM
- bundler: tsup
- test_framework: Vitest

## Capabilities
- Feature lifecycle management
- Stage state machine
- Traceability matrix
- Quality gates
- RFC and defect tracking

## Modules
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

## Entry Points
- src/cli/index.ts
- src/core/process-engine/stage-machine.ts
- src/core/skill-runtime/dispatcher.ts

## Data Models
- Feature
- Stage
- Task
- RFC
- Defect
- Gate
- TraceabilityMatrix

## API Surface
- spec-first init
- spec-first stage
- spec-first id
- spec-first matrix
- spec-first rfc
- spec-first defect
- spec-first gate

## Risks
- 无

## Evidence
- 无
