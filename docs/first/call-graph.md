# 调用关系图

## CLI 启动调用链

```
spec-first <command>
    │
    ↓
src/cli/index.ts
    │ registerCommand() × 27
    │ dispatch(process.argv.slice(2))
    ↓
src/cli/router.ts
    │ 根据 command 名查找 handler
    ↓
src/cli/commands/<name>.ts
    │ handleXxx()
    ↓
src/core/<module>/*.ts
    │ 核心逻辑
    ↓
ExitCode
```

## Stage 推进调用链

```
spec-first stage advance
    │
    ↓
handleStage() — src/cli/commands/stage.ts
    │ loadStageState()
    ↓
src/core/process-engine/stage-machine.ts
    │ canAdvance()
    │     │ evaluateGate()
    ↓
src/core/gate-engine/gate-evaluator.ts
    │ GATE_CONDITIONS[stage]
    ↓
src/core/gate-engine/condition-registry.ts
    │ 逐条评估
    ↓
    │ advanceStage()
    ↓
src/core/process-engine/stage-machine.ts
    │ writeJson(stage-state.json)
    ↓
成功/失败
```

## Skill 执行调用链

```
/spec-first:<skill>
    │
    ↓
spec-first skill render <skill>
    │
    ↓
handleSkill() — src/cli/commands/skill.ts
    │ resolveSkillPath()
    ↓
src/core/skill-runtime/dispatcher.ts
    │ assemblePrompt()
    ↓
src/core/skill-runtime/prompt-assembler.ts
    │ 读取 SKILL.md
    │ 读取 references/*.md
    │ 读取 frontmatter
    ↓
    │ checkHardGate()
    ↓
src/core/skill-runtime/hard-gate.ts
    │ 校验 Feature 状态
    │ 校验阶段匹配
    ↓
返回完整 Skill prompt
```

## Gate 校验调用链

```
spec-first gate check
    │
    ↓
handleGate() — src/cli/commands/gate.ts
    │ evaluateGate()
    ↓
src/core/gate-engine/gate-evaluator.ts
    │ GATE_CONDITIONS[stage]
    ↓
src/core/gate-engine/condition-registry.ts
    │ evaluateConditions()
    │     │ 每个条件 evaluate()
    ↓
各条件实现
    │ exists() 检查文件
    │ validatePrd() 校验 PRD
    │ calculateCoverage() 计算覆盖率
    ↓
    │ aggregateResults()
    ↓
GateResult { status, conditions, waivers }
```

## 追溯 ID 生成调用链

```
spec-first id generate FR
    │
    ↓
handleId() — src/cli/commands/id.ts
    │ validateIdType()
    ↓
src/core/trace-engine/id-validator.ts
    │ 检查是否为 14 种合法类型
    ↓
    │ generateId()
    ↓
src/core/trace-engine/id-generator.ts
    │ 格式: {TYPE}-{FEAT}-{NNN}
    ↓
    │ registerId()
    ↓
src/core/trace-engine/matrix.ts
    │ 写入 traceability-matrix.md
    ↓
成功/失败
```

## 模块间依赖

```
cli/commands/
    ├──→ process-engine/ (Stage 状态)
    ├──→ gate-engine/ (Gate 校验)
    ├──→ trace-engine/ (ID 生成)
    ├──→ skill-runtime/ (Skill 分发)
    └──→ change-mgr/ (RFC/Defect)

process-engine/
    └──→ shared/types.ts (Stage 枚举)

gate-engine/
    ├──→ trace-engine/ (覆盖率)
    ├──→ rules/truth-source.ts (规则)
    └──→ shared/types.ts (GateResult)

skill-runtime/
    ├──→ process-engine/ (阶段校验)
    └──→ shared/types.ts (类型)

trace-engine/
    └──→ shared/types.ts (IdType, MatrixRow)
```

## 证据来源

- CLI 入口 (`src/cli/index.ts:36-103`) — 显式
- Router (`src/cli/router.ts`) — 显式
- Gate 条件 (`src/core/gate-engine/condition-registry.ts`) — 显式
- Skill 分发 (`src/core/skill-runtime/dispatcher.ts`) — 显式
