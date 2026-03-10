---
mode: deep
generated_at: 2026-03-09T20:06:12.462Z
---

# 调用链分析

## 主要入口点

### 1. CLI 入口 (`src/cli/index.ts`)
```
CLI Entry
  ↓
Router (src/cli/router.ts)
  ↓
Command Handlers (src/cli/commands/*.ts)
  ↓
Core Modules
```

### 2. 状态机入口 (`src/core/process-engine/stage-machine.ts`)
```
Stage Machine
  ↓
Stage Advance (advance.ts)
  ↓
Feature Management (feature.ts)
  ↓
Gate Evaluation (gate-engine)
```

### 3. Skill 分发入口 (`src/core/skill-runtime/dispatcher.ts`)
```
Skill Dispatcher
  ↓
Prompt Assembler (prompt-assembler.ts)
  ↓
Hard Gate Check (hard-gate.ts)
  ↓
AI Orchestrator
```

## 关键调用路径

### Feature 生命周期流转
```
init → specify → design → plan → implement → verify → wrap_up → release → done
```

### 质量门禁评估
```
Gate Evaluator
  ↓
Security Scanner
  ↓
SCA Analysis
  ↓
Go-Live Check
```

### 追溯矩阵生成
```
ID Generator
  ↓
Matrix Builder
  ↓
Coverage Calculator
```

## 模块耦合点

- CLI ↔ Process Engine
- Process Engine ↔ Gate Engine
- Skill Runtime ↔ AI Orchestrator
- Trace Engine ↔ Change Manager
- Template ↔ Tool Integration
