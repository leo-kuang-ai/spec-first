# 全量逐文件复核索引

目录枚举不等于完成审查。同名相对路径仅为结构配对候选，职责映射须在笔记中确认；目录外依赖单独列行。

范围：34 个纳入深审，4 个用户指定跳过；排除项的既有读取不计入审查完成率。

| Skill | CE 对应 | 范围 | 文件关系数 | 全文已读文件数（非完成率） | 表格 |
| --- | --- | --- | --- | --- | --- |
| `autoresearch` | `无直接对应` | 纳入 | 43 | 43 / 43 | [文件表](file-tables/autoresearch.md) |
| `spec-app-consistency-audit` | `无直接对应` | 排除：用户指定跳过 | 90 | 74 / 90 | [文件表](file-tables/spec-app-consistency-audit.md) |
| `spec-brainstorm` | `ce-brainstorm` | 纳入 | 56 | 75 / 75 | [文件表](file-tables/spec-brainstorm.md) |
| `spec-code-review` | `ce-code-review` | 纳入 | 90 | 123 / 124 | [文件表](file-tables/spec-code-review.md) |
| `spec-commit` | `ce-commit` | 纳入 | 19 | 20 / 20 | [文件表](file-tables/spec-commit.md) |
| `spec-commit-push-pr` | `ce-commit-push-pr` | 纳入 | 26 | 33 / 33 | [文件表](file-tables/spec-commit-push-pr.md) |
| `spec-compound` | `ce-compound` | 纳入 | 59 | 86 / 86 | [文件表](file-tables/spec-compound.md) |
| `spec-compound-refresh` | `ce-compound-refresh` | 纳入 | 27 | 43 / 43 | [文件表](file-tables/spec-compound-refresh.md) |
| `spec-debug` | `ce-debug` | 纳入 | 36 | 42 / 42 | [文件表](file-tables/spec-debug.md) |
| `spec-doc-review` | `ce-doc-review` | 纳入 | 62 | 85 / 86 | [文件表](file-tables/spec-doc-review.md) |
| `spec-dogfood` | `ce-dogfood` | 纳入 | 23 | 27 / 27 | [文件表](file-tables/spec-dogfood.md) |
| `spec-explain` | `ce-explain` | 纳入 | 22 | 30 / 30 | [文件表](file-tables/spec-explain.md) |
| `spec-handoff` | `ce-handoff` | 纳入 | 27 | 30 / 30 | [文件表](file-tables/spec-handoff.md) |
| `spec-ideate` | `ce-ideate` | 纳入 | 38 | 56 / 56 | [文件表](file-tables/spec-ideate.md) |
| `spec-lfg` | `lfg` | 纳入 | 34 | 42 / 42 | [文件表](file-tables/spec-lfg.md) |
| `spec-optimize` | `ce-optimize` | 纳入 | 46 | 65 / 65 | [文件表](file-tables/spec-optimize.md) |
| `spec-plan` | `ce-plan` | 纳入 | 100 | 131 / 131 | [文件表](file-tables/spec-plan.md) |
| `spec-polish` | `ce-polish` | 纳入 | 39 | 55 / 55 | [文件表](file-tables/spec-polish.md) |
| `spec-pov` | `ce-pov` | 纳入 | 32 | 47 / 48 | [文件表](file-tables/spec-pov.md) |
| `spec-prd` | `无直接对应` | 纳入 | 64 | 64 / 64 | [文件表](file-tables/spec-prd.md) |
| `spec-product-pulse` | `ce-product-pulse` | 纳入 | 16 | 22 / 22 | [文件表](file-tables/spec-product-pulse.md) |
| `spec-project-rules` | `无直接对应` | 排除：用户指定跳过 | 105 | 0 / 105 | [文件表](file-tables/spec-project-rules.md) |
| `spec-promote` | `ce-promote` | 纳入 | 17 | 19 / 19 | [文件表](file-tables/spec-promote.md) |
| `spec-prototype` | `ce-prototype` | 纳入 | 21 | 28 / 28 | [文件表](file-tables/spec-prototype.md) |
| `spec-resolve-pr-feedback` | `ce-resolve-pr-feedback` | 纳入 | 29 | 39 / 39 | [文件表](file-tables/spec-resolve-pr-feedback.md) |
| `spec-riffrec-feedback-analysis` | `ce-riffrec-feedback-analysis` | 纳入 | 20 | 25 / 27 | [文件表](file-tables/spec-riffrec-feedback-analysis.md) |
| `spec-rule-miner` | `无直接对应` | 排除：用户指定跳过 | 12 | 0 / 12 | [文件表](file-tables/spec-rule-miner.md) |
| `spec-runtime-setup` | `ce-setup` | 纳入 | 106 | 109 / 109 | [文件表](file-tables/spec-runtime-setup.md) |
| `spec-simplify-code` | `ce-simplify-code` | 纳入 | 47 | 51 / 51 | [文件表](file-tables/spec-simplify-code.md) |
| `spec-strategy` | `ce-strategy` | 纳入 | 20 | 25 / 25 | [文件表](file-tables/spec-strategy.md) |
| `spec-sweep` | `ce-sweep` | 纳入 | 29 | 41 / 42 | [文件表](file-tables/spec-sweep.md) |
| `spec-test-browser` | `ce-test-browser` | 纳入 | 18 | 21 / 21 | [文件表](file-tables/spec-test-browser.md) |
| `spec-test-xcode` | `ce-test-xcode` | 纳入 | 14 | 17 / 17 | [文件表](file-tables/spec-test-xcode.md) |
| `spec-work` | `ce-work` | 纳入 | 78 | 91 / 91 | [文件表](file-tables/spec-work.md) |
| `spec-worktree` | `ce-worktree` | 纳入 | 20 | 21 / 21 | [文件表](file-tables/spec-worktree.md) |
| `spec-write-skill` | `无直接对应` | 排除：用户指定跳过 | 25 | 0 / 25 | [文件表](file-tables/spec-write-skill.md) |
| `spec-write-tasks` | `无直接对应` | 纳入 | 47 | 47 / 47 | [文件表](file-tables/spec-write-tasks.md) |
| `using-spec-first` | `无直接对应` | 纳入 | 24 | 24 / 24 | [文件表](file-tables/using-spec-first.md) |
