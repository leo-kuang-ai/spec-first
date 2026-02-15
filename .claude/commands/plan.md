---
description: 生成 Spec-First 执行计划（按阶段），识别风险并等待用户确认后再改代码。
---

# /plan - Spec-First 规划命令

## 目标

对给定需求生成可执行计划，明确阶段、风险、验收与推进路径。

## 输入

- 任务描述：`$ARGUMENTS`
- Feature ID（若已知）

## 执行步骤

1. 重述需求（边界、假设、非目标）。
2. 若有 Feature ID，运行：
   - `spec-first stage current <featureId>`
3. 基于当前阶段给出分阶段计划：
   - `00_init -> 01_specify -> 02_design -> 03_plan -> 04_implement -> 05_verify -> 06_wrap_up -> 07_release -> 08_done`
4. 为每阶段补充：
   - 产物（按统一命名：`spec.md`/`design.md`/`task_plan.md`/`test-plan.md`/`test-report.md`）
   - 关键风险（最多 3 条）
   - 验收动作（`matrix`/`metrics`/`gate`）
5. 输出执行清单并等待用户确认。

## 输出格式

```markdown
# Implementation Plan: <title>

## Requirements
- ...

## Stage Plan
1. 01_specify: ...
2. 02_design: ...
3. 03_plan: ...
4. 04_implement: ...
5. 05_verify: ...
6. 06_wrap_up: ...
7. 07_release: ...

## Risks
- ...

## Verification Gates
- spec-first matrix check <featureId>
- spec-first metrics coverage <featureId>
- spec-first gate check <featureId>

**WAITING FOR CONFIRMATION**
```

## 约束

- 未获得确认前，不执行代码修改。
- 计划必须引用可执行命令，不给纯概念建议。
