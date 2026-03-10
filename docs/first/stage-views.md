---
mode: deep
generated_at: 2026-03-09T20:06:12.462Z
---

# 阶段视图

## 需求阶段视图 (Spec)

**摘要**: spec-first 需求视图：5 项能力，7 个核心实体，0 个风险点

### 业务能力
- Feature lifecycle management
- Stage state machine
- Traceability matrix
- Quality gates
- RFC and defect tracking

### 核心实体
- Feature
- Stage
- Task
- RFC
- Defect
- Gate
- TraceabilityMatrix

### 接口依赖
- spec-first init
- spec-first stage
- spec-first id
- spec-first matrix
- spec-first rfc
- spec-first defect
- spec-first gate

---

## 设计阶段视图 (Design)

**摘要**: spec-first 设计视图：12 个模块边界，7 个集成点，0 个风险点

### 模块边界
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

### 集成点
- spec-first init
- spec-first stage
- spec-first id
- spec-first matrix
- spec-first rfc
- spec-first defect
- spec-first gate

### 技术约束
- 平台类型: cli-tool

---

## 代码阶段视图 (Code)

**摘要**: spec-first 代码视图：3 个入口，12 个潜在改动区，0 个变更风险

### 入口点
- `src/cli/index.ts`
- `src/core/process-engine/stage-machine.ts`
- `src/core/skill-runtime/dispatcher.ts`

### 潜在改动区
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

---

## Verify View

## 验证阶段视图 (Verify)

**摘要**: spec-first 验证视图：5 项能力，3 条关键链路，0 个发布风险

### 关键流程
- 入口链路: `src/cli/index.ts`
- 入口链路: `src/core/process-engine/stage-machine.ts`
- 入口链路: `src/core/skill-runtime/dispatcher.ts`

### 验证焦点
- Feature lifecycle management
- Stage state machine
- Traceability matrix
- Quality gates
- RFC and defect tracking

### 测试重点
- Feature lifecycle management
- Stage state machine
- Traceability matrix
- Quality gates
- RFC and defect tracking
