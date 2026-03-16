# First Runtime Stage Views

## Spec View

- Summary: spec-first 需求视图：1 项能力，2 个核心实体，1 个风险点

### Business Capabilities
- AI-workflow CLI for spec-driven development — quality gates, traceability, and feature lifecycle management for AI-era teams

### Core Entities
- Feature
- StageState

### Dependencies
- 接口: CLI: spec-first

### Warnings
- 项目端类型待确认

## Design View

- Summary: spec-first 设计视图：6 个模块边界，1 个集成点，1 个风险点

### Module Boundaries
- src/cli
- src/config
- src/core
- src/postinstall.ts
- src/preuninstall.ts
- src/shared

### Integration Points
- CLI: spec-first

### Technical Constraints
- 平台类型: unknown

### Risks
- 项目端类型待确认

## Code View

- Summary: spec-first 代码视图：2 个入口，6 个潜在改动区，1 个变更风险

### Entry Points
- dist/cli/index.js
- src/cli/index.ts

### Likely Change Areas
- src/cli
- src/config
- src/core
- src/postinstall.ts
- src/preuninstall.ts
- src/shared

### Call Path Hints
- 入口 -> dist/cli/index.js
- 入口 -> src/cli/index.ts

### Coupling Points
- 模块耦合: src/cli
- 模块耦合: src/config
- 模块耦合: src/core
- 模块耦合: src/postinstall.ts
- 模块耦合: src/preuninstall.ts
- 模块耦合: src/shared

### Change Hazards
- 项目端类型待确认

### Verification Hooks
- package.json
- tsconfig.json
- vitest.config.ts
- dist/cli/index.js
- src/cli/index.ts
- src/cli
- src/config
- src/core

## Verify View

- Summary: spec-first 验证视图：1 项能力，2 条关键链路，1 个发布风险

### Critical Flows
- 入口链路: dist/cli/index.js
- 入口链路: src/cli/index.ts

### Validation Focus
- 能力验证: AI-workflow CLI for spec-driven development — quality gates, traceability, and feature lifecycle management for AI-era teams
- 风险验证: 项目端类型待确认

### Test Focus
- AI-workflow CLI for spec-driven development — quality gates, traceability, and feature lifecycle management for AI-era teams

### Risk Areas
- 项目端类型待确认

### Recommended Checks
- 证据核对: package.json
- 证据核对: tsconfig.json
- 证据核对: vitest.config.ts
- 证据核对: dist/cli/index.js
- 证据核对: src/cli/index.ts
- 证据核对: src/cli
- 证据核对: src/config
- 证据核对: src/core

### Validation Hooks
- package.json
- tsconfig.json
- vitest.config.ts
- dist/cli/index.js
- src/cli/index.ts
- src/cli
- src/config
- src/core

### Release Blockers
- 项目端类型待确认