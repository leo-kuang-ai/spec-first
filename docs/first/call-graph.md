# 调用链

> 生成时间: 2026-03-17 | 模式: deep

## 关键入口

| 入口 | 触发命令 | 核心调用链 |
|------|----------|------------|
| `src/cli/index.ts` | `spec-first *` | CLI router → command handler |
| `src/core/process-engine/advance.ts` | `spec-first stage advance` | advance → gate-engine → stage-machine |
| `src/core/gate-engine/gate-evaluator.ts` | `spec-first gate check` | evaluate → validators → trace-engine |
| `src/core/skill-runtime/dispatcher.ts` | `spec-first skill render` | dispatch → resolveSkillPath → assemblePrompt |
| `src/core/trace-engine/matrix.ts` | `spec-first matrix sync` | syncMatrix → validators → id-generator |

## 核心调用链

### 1. Stage Advance Flow

**触发**: `spec-first stage advance --feature <featureId>`

**证据**: `src/core/process-engine/advance.ts` — `[显式]`

```
CLI (stage advance)
  │
  ├─→ validateCurrentStage()
  │     └─→ stage-machine/getCurrentStage()
  │
  ├─→ evaluateGateConditions()
  │     ├─→ gate-engine/evaluate()
  │     │     ├─→ validators/validateArtifacts()
  │     │     └─→ trace-engine/getCoverage()
  │     └─→ checkBlockingConditions()
  │
  ├─→ checkDependencies()
  │     └─→ trace-engine/checkUpstreamIds()
  │
  ├─→ syncAgentContext()
  │     └─→ ai-orchestrator/syncContext()
  │
  └─→ updateStageState()
        └─→ stage-machine/transition()
```

### 2. Gate Check Flow

**触发**: `spec-first gate check --feature <featureId>`

**证据**: `src/core/gate-engine/gate-evaluator.ts` — `[显式]`

```
CLI (gate check)
  │
  ├─→ loadGateConditions()
  │     └─→ condition-registry/getConditions()
  │
  ├─→ loadArtifacts()
  │     └─→ fs-utils/readArtifacts()
  │
  ├─→ evaluateEachCondition()
  │     ├─→ validators/validateFormat()
  │     ├─→ trace-engine/checkCoverage()
  │     └─→ rules/checkRules()
  │
  ├─→ calculateCoverage()
  │     └─→ trace-engine/getCoverageMetrics()
  │
  └─→ generateReport()
        └─→ template/renderReport()
```

### 3. Skill Dispatch Flow

**触发**: `spec-first skill render --skill <name>`

**证据**: `src/core/skill-runtime/dispatcher.ts` — `[显式]`

```
CLI (skill render)
  │
  ├─→ parseCommand()
  │     └─→ parse-utils/parseArgs()
  │
  ├─→ resolveSkillPath()
  │     └─→ skill-resolver/resolve()
  │
  ├─→ loadSkillDefinition()
  │     └─→ fs-utils/readSkill()
  │
  ├─→ renderPrompt()
  │     ├─→ template/render()
  │     └─→ context-resolver/resolve()
  │
  └─→ executeSkill()
        └─→ hard-gate-validator/validate()
```

## 高扩散风险点

| 区域 | 风险 | 缓解措施 | 证据 |
|------|------|----------|------|
| State Management | 手动编辑 stage-state.json 会导致状态机损坏 | 使用 CLI 命令操作 | `CLAUDE.md:31-49` — `[显式]` |
| Coverage Metrics | C4 (TC coverage) 不支持传递链，只做严格 FR 覆盖 | 使用 C3 (TASK coverage) 进行传递验证 | `src/core/trace-engine/coverage.ts:62-65` — `[显式]` |
| Gate Bypass | Waiver 可以绑过关键质量检查 | 在 gate-history/ 中追踪 waivers | `CLAUDE.md` — `[推断]` |
| ID Format | ID 格式严格，非合规 ID 会被拒绝 | 使用 `spec-first id generate` 生成 ID | `src/core/trace-engine/id-validator.ts:9-22` — `[显式]` |

## 模块依赖图

```
                    ┌──────────────┐
                    │   CLI Layer   │
                    │   src/cli/    │
                    └──────┬───────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│                      Core Layer                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │process-engine│  │skill-runtime│  │gate-engine  │       │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘       │
│         │                │                │               │
│         ▼                ▼                ▼               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │change-mgr   │  │ai-orchestrat│  │trace-engine │       │
│  └─────────────┘  └─────────────┘  └──────┬──────┘       │
│                                          │               │
│                                          ▼               │
│                                   ┌─────────────┐        │
│                                   │ validators  │        │
│                                   └──────┬──────┘        │
│                                          │               │
│                                          ▼               │
│                                    ┌───────────┐         │
│                                    │   rules   │         │
│                                    └───────────┘         │
└──────────────────────────────────────────────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ Shared Layer │
                    │  src/shared/ │
                    └──────────────┘
```
