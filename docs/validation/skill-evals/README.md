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
| 18 | spec-optimize | W | 调试与质量 | 通过 | [spec-optimize.md](./spec-optimize.md) | [evals/](../../skills/spec-optimize/evals/eval.yaml) |
| 19 | spec-simplify-code | S | 调试与质量 | 通过 | [spec-simplify-code.md](./spec-simplify-code.md) | [evals/](../../skills/spec-simplify-code/evals/eval.yaml) |
| 20 | spec-dogfood | W | 调试与质量 | 通过(带条件) | [spec-dogfood.md](./spec-dogfood.md) | [evals/](../../skills/spec-dogfood/evals/eval.yaml) |
| 21 | spec-app-consistency-audit | W | 调试与质量 | 通过(带条件) | [spec-app-consistency-audit.md](./spec-app-consistency-audit.md) | [evals/](../../skills/spec-app-consistency-audit/evals/eval.yaml) |
| 22 | spec-runtime-setup | W | 运行时与设备验证 | 通过 | [spec-runtime-setup.md](./spec-runtime-setup.md) | [evals/](../../skills/spec-runtime-setup/evals/eval.yaml) |
| 23 | spec-test-browser | I | 运行时与设备验证 | 通过 | [spec-test-browser-xcode.md](./spec-test-browser-xcode.md) | [evals/](../../skills/spec-test-browser/evals/eval.yaml) |
| 24 | spec-test-xcode | S | 运行时与设备验证 | 通过 | [spec-test-browser-xcode.md](./spec-test-browser-xcode.md) | [evals/](../../skills/spec-test-xcode/evals/eval.yaml) |
| 25 | spec-compound | W | 知识与规则沉淀 | 通过 | [spec-compound-pair.md](./spec-compound-pair.md) | [evals/](../../skills/spec-compound/evals/eval.yaml) |
| 26 | spec-compound-refresh | W | 知识与规则沉淀 | 通过 | [spec-compound-pair.md](./spec-compound-pair.md) | [evals/](../../skills/spec-compound-refresh/evals/eval.yaml) |
| 27 | spec-project-rules | S | 知识与规则沉淀 | 通过 | [spec-project-rules-pair.md](./spec-project-rules-pair.md) | [evals/](../../skills/spec-project-rules/evals/eval.yaml) |
| 28 | spec-rule-miner | S | 知识与规则沉淀 | 通过(带条件) | [spec-project-rules-pair.md](./spec-project-rules-pair.md) | [evals/](../../skills/spec-rule-miner/evals/eval.yaml) |
| 29 | spec-product-pulse | S | 产品信号与反馈 | 通过 | [spec-signal-group.md](./spec-signal-group.md) | [evals/](../../skills/spec-product-pulse/evals/eval.yaml) |
| 30 | spec-sweep | S | 产品信号与反馈 | 通过 | [spec-signal-group.md](./spec-signal-group.md) | [evals/](../../skills/spec-sweep/evals/eval.yaml) |
| 31 | spec-riffrec-feedback-analysis | S | 产品信号与反馈 | 通过 | [spec-signal-group.md](./spec-signal-group.md) | [evals/](../../skills/spec-riffrec-feedback-analysis/evals/eval.yaml) |
| 32 | spec-polish | W | 产品信号与反馈 | 通过 | [spec-signal-group.md](./spec-signal-group.md) | [evals/](../../skills/spec-polish/evals/eval.yaml) |
| 33 | spec-explain | S | 会话连续性与解释 | 通过 | [spec-session-group.md](./spec-session-group.md) | [evals/](../../skills/spec-explain/evals/eval.yaml) |
| 34 | spec-handoff | S | 会话连续性与解释 | 通过 | [spec-session-group.md](./spec-session-group.md) | [evals/](../../skills/spec-handoff/evals/eval.yaml) |
| 35 | spec-pov | S | 会话连续性与解释 | 通过(带条件) | [spec-session-group.md](./spec-session-group.md) | [evals/](../../skills/spec-pov/evals/eval.yaml) |
| 36 | spec-write-skill | W | 治理与元能力 | 通过 | [spec-final-pair.md](./spec-final-pair.md) | [evals/](../../skills/spec-write-skill/evals/eval.yaml) |
| 37 | spec-promote | S | 发布 | 通过 | [spec-final-pair.md](./spec-final-pair.md) | [evals/](../../skills/spec-promote/evals/eval.yaml) |

级别说明:**W** = 公开 workflow(workflow_command),**S** = standalone skill,**I** = internal helper(internal_only,非用户入口,测评时经其 governed caller 的派发契约触发)。

## 专项测评(跨 skill,不占用上表逐 skill 口径)

### 路由测量器结果合同

`routing-audit-20260902/run_routing.py` 的新运行使用 `spec-first-routing-eval/v2`，保留原有 engines、reps、pilot、`--claude-model` 与 `--tag` 参数。每次输出进入独立的 `routing-audit-20260902/runs/<run-id>/`，终端打印实际结果路径；历史 `results*.json`、重判结果及 raw 文件保持原样。

- `records[]` 保留 engine、case、group、expected、got、ok、env_error、dur_s，新增 rep、status、attempts 与原始证据路径。每次尝试单独写入 `*-a1.txt`、`*-a2.txt`；原 `*-rN.txt` 形状保留为该任务最终输出。路径相对结果中的 `raw_path_base` 解析。
- 退出失败、API 错误、超时、空输出、解析失败和正常错误答案分别记录；仅空输出或解析失败重试一次。Codex 通过 `--output-last-message` 读取最终消息，缺失时不以执行日志代替；Claude 使用 print/text 最终输出。仅符合约定两行格式的最终答案参与答案判定。
- `summary.<engine>.task_success_rate` 使用计划任务数作分母；`answer_accuracy` 只使用可判定答案作分母；`overall_acc` 与 `valid_n` 保留历史“排除环境失败，但包含解析失败”的观察口径，不能将其称为完整任务成功率。`planned_n`、`recorded_n`、`attempted_n`、`attempt_n`、`missing_n`、`not_run_n` 和 `status_counts` 分别显示覆盖、尝试及缺失；某类没有有效样本时 acc 为 null。
- 每次 attempt 的 dur_s 均计入任务耗时；未知耗时、缺失的尝试证据和不可获得的费用保持 null。费用未知不能当作零费用；重复执行也不增加独立任务种类。
- raw 写入失败保留已知 attempts、耗时与 `evidence_errors`，缺失的 raw_path 为 null，未能独立落盘的输出保留在 attempt 的 raw_output 中；任务标为 harness-error，不计成功。若最终 JSON 也无法写入，命令失败，不能声称已有完整结果。
- `run_status: completed` 只表示结果采集结束；环境或执行器错误标 degraded。判断路由是否通过须读取失败、缺失及各项结果，不能仅看 run_status 或进程正常退出。

| writer / reader | 兼容行为 |
| --- | --- |
| v2 writer → 原字段 reader | records/summary 的既有字段继续存在；reader 使用新运行打印的路径，不能继续猜测被保留的旧 results 路径 |
| 旧 writer → `summarize_records` | 保留旧观察口径并标 `legacy-unverified`；不补造退出码、attempt、新口径准确率或费用；缺字段不会让汇总崩溃 |
| 未知 schema → `summarize_records` | 显式拒绝 `unsupported-result-schema`，不将其当作兼容旧数据 |
| v2 异常身份 → `summarize_records` | 单引擎汇总拒绝重复 case/rep、计划外 case/rep 与混合引擎，返回 `invalid-result-identity`；不以截断比例掩盖错误分母 |
| v2 矛盾证据 → `summarize_records` | 校验 expected、状态、ok/env_error、attempt 顺序、退出码及最终答案一致性；缺失或矛盾记录返回 `invalid-result-evidence`，不自动修正为成功。not-run 保留空 attempts，未知尝试数仅允许明确的 harness-error + attempts:null；旧记录仍按 legacy-unverified 处理 |

该变更收紧 v2 reader 的有效性校验，不改变 writer/schema 版本或旧记录口径；校验只证明记录内部一致性，不证明原始证据真实性。下一阶段的历史校准与受限模型结果见[最小证据包](next-phase-20260908/README.md)。

无模型回归入口：`npx --no-install jest tests/unit/routing-eval-runner.test.js --runInBand`。测试使用替身引擎与临时文件，检查失败分类、重试记录、分母、最终消息读取和历史数据保护；通过仅证明本地测量行为，不证明真实模型路由或产品收益。

| 日期 | 专项 | 报告 | 资产 |
|---|---|---|---|
| 2026-09-02 | 入口路由准确率(22 用例 ×3 ×双引擎)+ 37 skill 静态体检 + 碰撞/安全扫描 | [2026-09-02-entry-routing-and-static-audit.md](./2026-09-02-entry-routing-and-static-audit.md) | [routing-audit-20260902/](./routing-audit-20260902/) |
