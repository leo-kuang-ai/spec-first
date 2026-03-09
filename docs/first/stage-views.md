# First Runtime Stage Views

## Spec View

- Summary: spec-first 需求视图：5 项能力，7 个核心实体，0 个风险点

### Business Capabilities
- Feature lifecycle management
- Stage state machine
- Traceability matrix
- Quality gates
- RFC and defect tracking

### Core Entities
- Feature
- Stage
- Task
- RFC
- Defect
- Gate
- TraceabilityMatrix

### Dependencies
- 接口: spec-first init
- 接口: spec-first stage
- 接口: spec-first id
- 接口: spec-first matrix
- 接口: spec-first rfc
- 接口: spec-first defect
- 接口: spec-first gate

### Warnings
- 无

## Design View

- Summary: spec-first 设计视图：12 个模块边界，7 个集成点，0 个风险点

### Module Boundaries
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

### Integration Points
- spec-first init
- spec-first stage
- spec-first id
- spec-first matrix
- spec-first rfc
- spec-first defect
- spec-first gate

### Technical Constraints
- 平台类型: cli-tool

### Risks
- 无

## Code View

- Summary: spec-first 代码视图：3 个入口，12 个潜在改动区，0 个变更风险

### Entry Points
- src/cli/index.ts
- src/core/process-engine/stage-machine.ts
- src/core/skill-runtime/dispatcher.ts

### Likely Change Areas
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

### Call Path Hints
- 入口 -> src/cli/index.ts
- 入口 -> src/core/process-engine/stage-machine.ts
- 入口 -> src/core/skill-runtime/dispatcher.ts

### Coupling Points
- 模块耦合: cli
- 模块耦合: process-engine
- 模块耦合: skill-runtime
- 模块耦合: ai-orchestrator
- 模块耦合: gate-engine
- 模块耦合: trace-engine
- 模块耦合: change-mgr
- 模块耦合: template
- 模块耦合: tool-integration
- 模块耦合: metrics-engine
- 模块耦合: shared
- 模块耦合: config

### Change Hazards
- 无

### Verification Hooks
- 无

## Verify View

- Summary: spec-first 验证视图：5 项能力，3 条关键链路，0 个发布风险

### Critical Flows
- 入口链路: src/cli/index.ts
- 入口链路: src/core/process-engine/stage-machine.ts
- 入口链路: src/core/skill-runtime/dispatcher.ts

### Validation Focus
- 能力验证: Feature lifecycle management
- 能力验证: Stage state machine
- 能力验证: Traceability matrix
- 能力验证: Quality gates
- 能力验证: RFC and defect tracking

### Test Focus
- Feature lifecycle management
- Stage state machine
- Traceability matrix
- Quality gates
- RFC and defect tracking

### Risk Areas
- 无

### Recommended Checks
- 无

### Validation Hooks
- 无

### Release Blockers
- 无
