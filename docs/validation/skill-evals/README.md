# Skill 测评目录

本目录用于对 spec-first 自有的 37 个 skill 逐个开展行为测评,并跟踪进度。基线清点见 [2026-08-30-skill-inventory.md](./2026-08-30-skill-inventory.md)。

## 文件约定

- 每个 skill 一份测评文件,命名为 `<skill-name>.md`(如 `spec-plan.md`),从 [_template.md](./_template.md) 复制起稿。
- 测评完成后在下方索引表更新状态与文件链接。
- 行为语义测评优先使用 fresh-source eval(把磁盘上的 skill 源文件注入全新通用 subagent 评估),checklist 见 `docs/contracts/workflows/fresh-source-eval-checklist.md`;无法执行时必须在测评文件中记录原因,不得声称通过。
- 清点口径:治理注册表 `src/cli/contracts/dual-host-governance/skills-governance.json` 收录的 37 个 skill。`skills/autoresearch` 是指向 generated runtime 的第三方 symlink、`_shared/` 是共享参考契约、`spec-project-rules-workspace/` 是开发期 eval 工作区,均不在测评范围。
- `results.tsv` 是 darwin 优化循环日志(baseline / keep / revert / regression);commit 列 `wt@<hash>` 表示改动基于该 HEAD 的未提交 working tree,commit 后可替换为真实 hash。

## 测评进度索引

状态取值:`待测评` / `进行中` / `通过` / `需改进` / `失败`。

| # | Skill | 级别 | 分组 | 状态 | 测评文件 | evals 资产 |
|---|---|---|---|---|---|---|
| 1 | using-spec-first | S | 入口与路由 | 通过 | [using-spec-first.md](./using-spec-first.md) | [evals/](../../skills/using-spec-first/evals/eval.yaml) |
| 2 | spec-ideate | W | 需求与规划 | 通过 | [spec-ideate.md](./spec-ideate.md) | [evals/](../../skills/spec-ideate/evals/eval.yaml) |
| 3 | spec-brainstorm | W | 需求与规划 | 通过 | [spec-brainstorm.md](./spec-brainstorm.md) | [evals/](../../skills/spec-brainstorm/evals/eval.yaml) |
| 4 | spec-prd | W | 需求与规划 | 通过 | [spec-prd.md](./spec-prd.md) | [evals/](../../skills/spec-prd/evals/eval.yaml) |
| 5 | spec-doc-review | W | 需求与规划 | 通过 | [spec-doc-review.md](./spec-doc-review.md) | [evals/](../../skills/spec-doc-review/evals/eval.yaml) |
| 6 | spec-strategy | S | 需求与规划 | 通过 | [spec-strategy.md](./spec-strategy.md) | [evals/](../../skills/spec-strategy/evals/eval.yaml) |
| 7 | spec-prototype | S | 需求与规划 | 通过 | [spec-prototype.md](./spec-prototype.md) | [evals/](../../skills/spec-prototype/evals/eval.yaml) |
| 8 | spec-plan | W | 计划与任务 | 通过 | [spec-plan.md](./spec-plan.md) | [evals/](../../skills/spec-plan/evals/eval.yaml) |
| 9 | spec-write-tasks | W | 计划与任务 | 通过 | [spec-write-tasks.md](./spec-write-tasks.md) | [evals/](../../skills/spec-write-tasks/evals/eval.yaml) |
| 10 | spec-work | W | 执行与交付 | 通过 | [spec-work.md](./spec-work.md) | [evals/](../../skills/spec-work/evals/eval.yaml) |
| 11 | spec-lfg | S | 执行与交付 | 通过(带条件) | [spec-lfg.md](./spec-lfg.md) | [evals/](../../skills/spec-lfg/evals/eval.yaml) |
| 12 | spec-resolve-pr-feedback | S | 执行与交付 | 通过 | [spec-resolve-pr-feedback.md](./spec-resolve-pr-feedback.md) | [evals/](../../skills/spec-resolve-pr-feedback/evals/eval.yaml) |
| 13 | spec-commit | I | 执行与交付 | 通过 | [spec-internal-helpers.md](./spec-internal-helpers.md) | [evals/](../../skills/spec-commit/evals/eval.yaml) |
| 14 | spec-commit-push-pr | I | 执行与交付 | 通过 | [spec-internal-helpers.md](./spec-internal-helpers.md) | [evals/](../../skills/spec-commit-push-pr/evals/eval.yaml) |
| 15 | spec-worktree | I | 执行与交付 | 通过 | [spec-internal-helpers.md](./spec-internal-helpers.md) | 确定性脚本测试(见测评文档) |
| 16 | spec-debug | W | 调试与质量 | 通过 | [spec-debug.md](./spec-debug.md) | [evals/](../../skills/spec-debug/evals/eval.yaml) |
| 17 | spec-code-review | W | 调试与质量 | 通过 | [spec-code-review.md](./spec-code-review.md) | [evals/](../../skills/spec-code-review/evals/eval.yaml) |
| 18 | spec-optimize | W | 调试与质量 | 待测评 | | |
| 19 | spec-simplify-code | S | 调试与质量 | 待测评 | | |
| 20 | spec-dogfood | W | 调试与质量 | 待测评 | | |
| 21 | spec-app-consistency-audit | W | 调试与质量 | 待测评 | | |
| 22 | spec-runtime-setup | W | 运行时与设备验证 | 待测评 | | |
| 23 | spec-test-browser | I | 运行时与设备验证 | 待测评 | | |
| 24 | spec-test-xcode | S | 运行时与设备验证 | 待测评 | | |
| 25 | spec-compound | W | 知识与规则沉淀 | 待测评 | | |
| 26 | spec-compound-refresh | W | 知识与规则沉淀 | 待测评 | | |
| 27 | spec-project-rules | S | 知识与规则沉淀 | 待测评 | | |
| 28 | spec-rule-miner | S | 知识与规则沉淀 | 待测评 | | |
| 29 | spec-product-pulse | S | 产品信号与反馈 | 待测评 | | |
| 30 | spec-sweep | S | 产品信号与反馈 | 待测评 | | |
| 31 | spec-riffrec-feedback-analysis | S | 产品信号与反馈 | 待测评 | | |
| 32 | spec-polish | W | 产品信号与反馈 | 待测评 | | |
| 33 | spec-explain | S | 会话连续性与解释 | 待测评 | | |
| 34 | spec-handoff | S | 会话连续性与解释 | 待测评 | | |
| 35 | spec-pov | S | 会话连续性与解释 | 待测评 | | |
| 36 | spec-write-skill | W | 治理与元能力 | 待测评 | | |
| 37 | spec-promote | S | 发布 | 待测评 | | |

级别说明:**W** = 公开 workflow(workflow_command),**S** = standalone skill,**I** = internal helper(internal_only,非用户入口,测评时经其 governed caller 的派发契约触发)。
