# Plan Status Lifecycle Fresh-Source Eval

> Artifact type: advisory semantic review + confirmed source/test references
> Date: 2026-07-15
> Final status: passed

## Scope

独立只读 reviewer 从当前磁盘读取以下 source-of-truth，未读取 `.claude/`、`.codex/` 或 `.agents/skills/` runtime mirror：

- `skills/spec-brainstorm/SKILL.md`
- `skills/spec-brainstorm/references/brainstorm-sections.md`
- `skills/spec-plan/SKILL.md`
- `skills/spec-plan/references/plan-sections.md`
- `skills/spec-plan/references/plan-handoff.md`
- `skills/spec-work/SKILL.md`
- `skills/spec-work/references/shipping-workflow.md`
- `skills/spec-work/references/execution-engines.md`
- `skills/spec-lfg/SKILL.md`

评估场景覆盖 Markdown unified code producer、direct plan closeout、validated task-pack `source_plan` ownership、verification/review/scope 未闭合、Return-to-Caller/LFG ownership，以及 HTML、legacy missing/closed、read-compatible non-active status 和非 direct source path 的 degraded boundary。

## Concern Closure

首轮 fresh-source review 发现并已修复：

- Return-to-Caller `status: complete` 未明确要求全 scope 完成、blockers 为空和 required verification 通过；LFG 也缺 browser/runtime verification 的 failed/not-run gate。
- `lifecycle-managed` eligibility 不够精确，容易把非 software 或不受管理的 Markdown 误送入 mutation helper。
- Enrichment 的 status preservation 容易被误读为重置 lifecycle；现明确只保留一个 canonical status、不把 non-active 重置为 active、不新增 intake gate，duplicate/malformed/non-canonical metadata 阻断修复。

## Final Result

```yaml
fresh_source_eval:
  status: passed
  runtime_paths_checked: []
  reviewer_context: fresh source snippets from current disk
  checks:
    trigger_precision: passed
    source_runtime_boundary: passed
    host_entrypoints: passed
    internal_only_boundary: passed
    deterministic_vs_semantic_boundary: passed
    tests: not_checked
  findings: []
```

测试证据由本次实现的 unit、integration、smoke、quality gate、projection 和 build 命令独立提供；fresh-source reviewer 未把自身判断冒充确定性测试结果。
