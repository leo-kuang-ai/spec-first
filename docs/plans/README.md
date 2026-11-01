# 计划目录

保存当前 workflow 操作路径下的计划；新软件产物遵循 `skills/spec-plan/`、`skills/spec-brainstorm/` 的 unified plan 合同。

[返回文档总入口](../README.md) · [历史与其他计划](./history-index.md) · [已迁移历史计划](../archive/plans/README.md)

## 读取与执行边界

- 本页是 2026-10-31 的文件元数据导航，不是活跃任务队列或验收结论；执行前重新检查当前 source、计划状态与证据。
- `active` 只是文档声明；requirements-only 不能直接进入实施。`completed`、`superseded` 和 `closed` 不因仍在此目录而变为可执行。
- CLI 的 plan-status 要求 `docs/plans/*.md`，现行计划保持平铺，不建立 active/ 或年份子目录。README 和索引不声明计划 type/status，不作为计划执行。
- 历史计划如仍有文档、机器消费者或工作区改动，保留原位，通过索引降噪。归档不重置旧状态，也不重写旧 task-pack pins。

## 声明为 active 的计划

| 文件 | 声明状态 |
|---|---|
| [2026-07-06-001-refactor-skill-prompt-slimming-plan.md](2026-07-06-001-refactor-skill-prompt-slimming-plan.md) | active |
| [2026-07-06-002-refactor-skill-activation-index-governance-plan.md](2026-07-06-002-refactor-skill-activation-index-governance-plan.md) | active |
| [2026-08-29-001-feat-spec-project-rules-v2-ultimate-design-plan.md](2026-08-29-001-feat-spec-project-rules-v2-ultimate-design-plan.md) | active |
| [2026-08-29-002-feat-spec-project-rules-hash-freshness-plan.md](2026-08-29-002-feat-spec-project-rules-hash-freshness-plan.md) | active |
| [2026-09-09-001-feat-ai-sdlc-change-traceability-plan.md](2026-09-09-001-feat-ai-sdlc-change-traceability-plan.md) | active |
| [2026-09-09-002-feat-automated-skill-evolution-loop-plan.md](2026-09-09-002-feat-automated-skill-evolution-loop-plan.md) | active |
| [2026-09-11-spec-runtime-setup-p123-optimization-plan.md](2026-09-11-spec-runtime-setup-p123-optimization-plan.md) | active |
| [2026-09-24-001-perf-skill-prompt-model-adaptation-plan.md](2026-09-24-001-perf-skill-prompt-model-adaptation-plan.md) | active |
| [2026-10-27-001-refactor-ce-upstream-sync-technical-scheme.md](2026-10-27-001-refactor-ce-upstream-sync-technical-scheme.md) | active |
| [2026-10-29-001-refactor-ce-skill-optimization-plan.md](2026-10-29-001-refactor-ce-skill-optimization-plan.md) | active |
| [2026-10-30-001-test-remaining-27-ce-skill-acceptance-plan.md](2026-10-30-001-test-remaining-27-ce-skill-acceptance-plan.md) | active |

## 状态盘点

以下为本次整理时的 front matter 文本统计，非 CLI 合法性裁决或任务完成证明。

| 声明状态 | 文件数 |
|---|---:|
| active | 11 |
| closed | 2 |
| completed | 228 |
| draft | 2 |
| reviewed-proposed | 1 |
| superseded | 37 |
| 未声明 | 13 |
