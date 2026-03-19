# Spec-First Skills 全链路审查计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 基于 stage-views 全流程方案、当前仓库真实代码与单测，对 `skills/spec-first/*` 逐个做现状审查，输出可执行的优化建议。

**Architecture:** 审查先抽象“最佳设计”，再按 `producer → governor → consumer → peripheral` 四类技能逐个对照。所有结论必须落到真实文件、真实代码路径和真实单测，优先指出契约漂移、运行时未落地、文档口径失配三类问题。

**Tech Stack:** Markdown、TypeScript、Vitest、Spec-First runtime (`src/core/skill-runtime/*`)、CLI (`src/cli/commands/*`)。

## Scope

- 背景文档：`docs/review-bundles/skill优化思考/skill-全流程/*.md`
- 技能范围：`skills/spec-first/*/SKILL.md`
- 关键实现：`src/core/skill-runtime/*`、`src/core/gate-engine/sca.ts`、`src/core/process-engine/init.ts`、`src/cli/commands/init.ts`、`src/cli/commands/doctor.ts`
- 关键单测：`tests/unit/*skill-docs.test.ts`、`tests/unit/*background*.test.ts`、`tests/unit/orchestrate-args-parser.test.ts`

## Constraints

- 以真实代码为准，不依据旧方案文档臆测实现状态。
- 先收敛最佳设计，再判断每个 skill 的角色与缺口。
- 区分“已实现”“仅文档承诺”“推断性建议”。
- 对高风险结论给出直接证据路径。

## Tasks

1. 读完全流程背景文档并提炼最佳设计。
2. 盘点 `00-first` runtime 真源、`init/orchestrate/doctor/analyze` 治理逻辑。
3. 跑一组背景治理相关单测，建立审查基线。
4. 建立逐 skill 审查模板：定位、证据、结论、优化建议、优先级。
5. 审查 producer：`00-first`。
6. 审查 governor：`01-init`、`13-orchestrate`、`14-status`、`15-doctor`、`21-analyze`。
7. 审查 consumer：`00-onboarding`、`03-spec`、`04-design`、`07-code`、`12-verify`。
8. 审查 peripheral：`02-catchup`、`05-research`、`06-task`、`08-review`、`10-archive`、`11-plan`、`16-sync`、`17-feature`、`20-spec-review`。
9. 产出总览与逐 skill 审查文档。
10. 回填测试基线与总优先级矩阵。

## Verification

- 运行：`pnpm vitest run tests/unit/first-skill-docs.test.ts tests/unit/first-context-stage-views.test.ts tests/unit/onboarding-skill-docs.test.ts tests/unit/init-runtime-readiness.test.ts tests/unit/spec-skill-docs.test.ts tests/unit/design-skill-docs.test.ts tests/unit/code-skill-docs.test.ts tests/unit/verify-skill-docs.test.ts tests/unit/orchestrate-args-parser.test.ts tests/unit/status-skill-docs.test.ts tests/unit/doctor-skill-docs.test.ts tests/unit/analyze-skill-docs.test.ts tests/unit/analyze-background-quality.test.ts`
- 预期：绝大多数背景治理测试通过；若有失败，必须写入总览并定位到真实漂移点。

