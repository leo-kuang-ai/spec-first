# CE 到 Spec-First 已审查 Skill Parity 复审报告

日期：2026-07-08
审查口径：CE 内容为准，spec-first 只做必要投影；增强可以保留，但必须被识别为增强或显式 divergence，不能混同为“CE parity”。

## 结论

本轮复审覆盖 `docs/validation/2026-07-08-ce-to-spec-first-skill-audit-plan.md` 中已标记“已完成 / 已审查”的 20 个 CE -> spec-first skill pair，并排除 `ce-setup -> spec-mcp-setup`。

总体结论：

- 明确 CE parity / 仅必要投影：`spec-compound`、`spec-explain`、`spec-lfg`、`spec-pov`、`spec-riffrec-feedback-analysis`、`spec-simplify-code`、`spec-strategy`、`spec-sweep`、`spec-test-xcode`。
- CE parity 加可保留增强：`spec-commit`、`spec-dogfood`、`spec-polish`、`spec-resolve-pr-feedback`、`spec-test-browser`、`spec-worktree`。
- 明显不是最小投影，但增强可保留，需 owner 显式记录 divergence：`spec-commit-push-pr`、`spec-optimize`。
- 存在 CE 行为缺失或主流程替换，需优先修复或 owner 决策：`spec-product-pulse`、`spec-promote`、`spec-proof`。

必要投影接受范围：

- `ce-*` / `/ce-*` / `$compound-engineering:*` -> 当前 `spec-*` 入口。
- `.compound-engineering` -> `.spec-first`。
- `/tmp/compound-engineering/<skill>` -> `/tmp/spec-first/<skill>`。
- `ai:compound-engineering` / `Compound Engineering` -> `ai:spec-first` / `Spec-First`。
- 下游 workflow 名称投影，如 `ce-brainstorm` -> `spec-brainstorm`、`/lfg` -> `spec-lfg`。
- `product_contract_source: ce-sweep` -> `product_contract_source: spec-sweep`。
- 当前仓库 source/runtime 边界导致的 helper 路径锚点、installed skill directory、`spec-mcp-setup` 提示等必要适配。

## 逐项结论

### `ce-commit` -> `spec-commit`

状态：CE parity 加可保留增强。

已打开文件：
- CE：`SKILL.md`
- spec-first：`SKILL.md`

判断：
- 必要投影：名称和入口改为 `spec-commit`。
- 增强：fallback 命令扩展、branch ref validation、失败停止、`mktemp` + `git commit -F` 替代 heredoc `git commit -m`。
- 结论：这些增强不需要去掉，但不应标为“仅必要投影”。建议记录为安全增强。

### `ce-commit-push-pr` -> `spec-commit-push-pr`

状态：明显 divergence；增强可保留，但需 owner 显式认可。

已打开文件：
- CE：`SKILL.md`、`references/branch-creation.md`、`references/pr-description-writing.md`
- spec-first：`SKILL.md`、`references/branch-creation.md`、`references/pr-description-writing.md`

判断：
- 必要投影：入口、下游 `ce-*` 名称、平台表达归一化。
- 增强/改写：整体 workflow 从 CE Step 1-5 改成 mode detection + description update + full workflow；PR body 写入改为 file-write 工具；新增 body 非空、placeholder、回读校验；branch creation 增加 ref 校验和 fetch fallback 收紧。
- 缺失/替换：CE 的 concept teaching gate、`pr_teaching_section` / archive、`docs/explainers/` 归档、`Run /ce-explain` trailer 逻辑在 spec 版本中被删除或替换。
- 结论：不是最小投影。增强可以保留，但 teaching/explainer 行为是否废弃需要 owner 决策。

### `ce-compound` -> `spec-compound`

状态：CE parity / 仅必要投影。

已打开文件：
- CE/spec 均打开：`SKILL.md`、`assets/resolution-template.md`、`references/agents/*`、`references/concepts-vocabulary.md`、`references/grounding-validation.md`、`references/repo-profile-cache.md`、`references/schema.yaml`、`references/yaml-schema.md`、`scripts/repo-profile-cache.py`、`scripts/session-history/*`、`scripts/validate-doc-claims.py`、`scripts/validate-frontmatter.py`

判断：
- 必要投影：入口、scratch `/tmp/spec-first/spec-compound`、repo profile cache `/tmp/spec-first/repo-profile`、下游 `spec-compound-refresh` / `spec-simplify-code`、`SKILL_DIR` 路径锚点。
- CE 行为保留：one-learning-per-run、headless mode、scratch artifact pattern、session-history enrichment、`CONCEPTS.md` create/seed、grounding validation、doc claims/frontmatter validators、local prompt assets、success output。
- 结论：对齐 CE-first 投影口径。

### `ce-dogfood` -> `spec-dogfood`

状态：CE parity 加低风险增强。

已打开文件：
- CE/spec 均打开：`SKILL.md`、`references/dogfood-report-template.md`、`references/test-matrix-taxonomy.md`

判断：
- 必要投影：`ce-dogfood`、`ce-compound` 等入口改为 `spec-*`，helper 缺失提示转向 `spec-mcp-setup`。
- 增强：新增 `Workflow Contract Summary` 和更明确 trigger/boundary prose。
- 结论：核心 dogfood 流程和 report/template taxonomy 保持 CE parity；新增 contract summary 可保留。

### `lfg` -> `spec-lfg`

状态：CE parity / 仅必要投影。

已打开文件：
- CE/spec 均打开：`SKILL.md`、`references/review-followup.md`、`references/tracker-defer.md`

判断：
- 必要投影：入口和下游 workflow 从 `ce-*` / `/ce-explain` 改为 `spec-*` / `spec-explain`，plan contract 从 `ce-unified-plan/v1` 改为 `spec-unified-plan/v1`，review artifact path 从 `/tmp/compound-engineering/ce-code-review` 改为 `/tmp/spec-first/spec-code-review`。
- CE 行为保留：严格 plan-first 顺序、`mode:return-to-caller`、behavior-change verification evidence gate、docs-only/trivial simplify skip、report-only review + LFG apply fixes、local-only shipping precondition、residual review durable sink、`spec-test-browser mode:pipeline`、`spec-commit-push-pr mode:pipeline`、CI watch/autofix 3 次循环、`New concepts:` trailer 到 DONE 前 explain follow-up。
- 结论：当前版本已恢复 CE pipeline 承重语义，仅做 spec-first 必要投影。

### `ce-explain` -> `spec-explain`

状态：CE parity / 仅必要投影；存在清理项。

已打开文件：
- CE/spec 均打开：`SKILL.md`、`references/agents/repo-profiler.md`、`references/agents/work-recap-scout.md`、`references/check-in.md`、`references/destinations.md`、`references/explainer-html.md`、`references/explainer-markdown.md`、`references/intake.md`、`references/repo-profile-cache.md`、`scripts/repo-profile-cache.py`
- spec 额外：`scripts/__pycache__/repo-profile-cache.cpython-312.pyc`

判断：
- 必要投影：入口、`/tmp/spec-first/spec-explain`、repo profile cache、下游 `spec-*`。
- Host 归一化：`#$ARGUMENTS` 改为 current request 可接受。
- 清理项：spec source 中存在 `__pycache__`，不属于 skill source，应删除。

### `ce-optimize` -> `spec-optimize`

状态：明显增强型 divergence；增强可保留，但需 owner 显式记录。

已打开文件：
- CE/spec 均打开：`SKILL.md`、`references/agents/learnings-researcher.md`、`references/agents/repo-profiler.md`、`references/agents/repo-research-analyst.md`、`references/example-hard-spec.yaml`、`references/example-judge-spec.yaml`、`references/experiment-log-schema.yaml`、`references/optimize-spec-schema.yaml`、`references/usage-guide.md`、`scripts/experiment-worktree.sh`
- spec 额外打开：`README.md`、`evals/examples.json`
- 通过 diff 辅助定位：其余 prompt/schema/script 差异。

判断：
- 必要投影：`.context/compound-engineering/ce-optimize` -> `.spec-first/workflows/spec-optimize`、入口、repo profile cache、下游 `spec-*`。
- 增强：`Workflow Contract Summary`、scenario capability、eval examples、admission/budget gate、runtime context exclusion、evidence utilization boundary、dispatch/backend boundary、README、worktree script secret-deny 和 `--copy-env` 安全逻辑。
- 潜在缺失：CE 要求按 `references/optimize-spec-schema.yaml` 的 `validation_rules` 全量校验；spec 版本在 `SKILL.md` 中展开成局部清单，可能弱化 schema 单一真相源。
- 结论：增强不建议删除，但应记录为 spec-first-owned divergence；schema 校验真相源需复核。

### `ce-polish` -> `spec-polish`

状态：CE parity 加可保留增强。

已打开文件：
- CE/spec 均打开：`SKILL.md`、全部 `references/dev-server-*`、`references/ide-detection.md`、`references/launch-json-schema.md`、`scripts/detect-project-type.sh`、`scripts/read-launch-json.sh`、`scripts/resolve-package-manager.sh`、`scripts/resolve-port.sh`

判断：
- 必要投影：入口、browser helper 缺失提示转向 `spec-mcp-setup`。
- 增强：`Workflow Contract Summary`、`spec-test-browser` cascade 提示、禁止默认扫描 `AGENTS.md` / `CLAUDE.md` Rails ports、`detect-project-type.sh` 空格路径修复。
- 结论：核心流程保持 CE parity；增强可保留。

### `ce-pov` -> `spec-pov`

状态：CE parity / 仅必要投影；存在清理项。

已打开文件：
- CE/spec 均打开：`SKILL.md`、`references/boundaries.md`、`references/intake.md`、`references/invocation.md`、`references/method.md`、`references/report.md`、`references/repo-profile-cache.md`、`references/agents/*`、`scripts/repo-profile-cache.py`
- spec 额外：`scripts/__pycache__/repo-profile-cache.cpython-312.pyc`

判断：
- 必要投影：入口、scratch `/tmp/spec-first/spec-pov`、repo profile cache、下游 `spec-*`。
- Host 归一化：current request 表达可接受。
- 清理项：spec source 中存在 `__pycache__`，应删除。

### `ce-product-pulse` -> `spec-product-pulse`

状态：存在 CE 行为缺失；需优先修复或 owner 决策。

已打开文件：
- CE/spec 均打开：`SKILL.md`、`references/interview.md`、`references/report-template.md`

判断：
- 必要投影：`.compound-engineering/config.local.yaml` -> `.spec-first/config.local.yaml`、`ce-strategy` -> `spec-strategy`。
- 缺失：spec 删除 CE frontmatter `disable-model-invocation: true` 和 `allowed-tools` 列表，改变调用/工具边界。
- 行为替换：CE interview 持久化 `schedule: manual|ask-again-after-3-runs` 等 cadence；spec 改为 chat handoff only，不写 schedule cadence。
- 其他增强/改写：删除 `work_delegate_*` 作为 unrelated config key 示例；如果只是去 CE 残留，这属于过度清理，因为 CE 规则本意是保留非 pulse keys。
- 结论：需要恢复 CE 行为或显式 owner 决策；这不是“增强可直接保留”的普通项。

### `ce-promote` -> `spec-promote`

状态：存在 CE 行为缺失；需修复或 owner 决策。

已打开文件：
- CE/spec 均打开：`SKILL.md`、`references/spiral-cli.md`

判断：
- 必要投影：入口、`.spec-first/config.local.yaml`、`spec_promote_spiral_optout`。
- 缺失：spec 移除了 CE frontmatter `disable-model-invocation: true`。
- 结论：应恢复该 frontmatter，或由 owner 明确说明 spec-promote 为什么不再禁用模型调用。

### `ce-proof` -> `spec-proof`

状态：主流程替换；需 owner 决策。

已打开文件：
- CE：`SKILL.md`
- spec-first：`SKILL.md`、`references/hitl-review.md`

判断：
- 必要投影：Proof identity 从 `ai:compound-engineering` / `Compound Engineering` 转为 `ai:spec-first` / `Spec-First`。
- 主流程替换：CE primary use 是 Publish Mode：发布本地 markdown 到 Proof，local file stays canonical，不自动同步回本地；spec 主入口变为 HITL Review Mode：上传、循环 ingest、end-sync、本地 atomic write。
- 增强：HITL loop、mark classification、idempotent ingest、sync confirmation 都是有价值增强。
- 结论：增强可以保留，但它不是 CE 最小投影；需要明确 `spec-proof` 是否仍保留 CE 的 Publish Mode 作为主能力，或将 HITL 作为有意 divergence。

### `ce-resolve-pr-feedback` -> `spec-resolve-pr-feedback`

状态：CE parity 加可保留增强。

已打开文件：
- CE/spec 均打开：`SKILL.md`、`references/evaluation-rubric.md`、`references/full-mode.md`、`references/targeted-mode.md`、`references/agents/pr-comment-resolver.md`、`scripts/get-pr-comments`、`scripts/get-thread-for-comment`、`scripts/reply-to-pr-thread`、`scripts/resolve-pr-thread`

判断：
- 必要投影：入口、helper path 通过 loaded skill directory 解析。
- CE 行为保留：orchestrator-owned legitimacy gate、central judgment、fix/reply/human verdict、resolver agents 只执行已批准 fix。
- 增强：conflict-aware resolver dispatch、script allowed-tools 收紧、fetch warnings、PR-level feedback 过滤增强、reply body file 化以避免 shell quoting 注入。
- 结论：增强可保留；核心 CE contract 保持。

### `ce-riffrec-feedback-analysis` -> `spec-riffrec-feedback-analysis`

状态：CE parity / 仅必要投影；存在清理项。

已打开文件：
- CE/spec 均打开：`SKILL.md`、`references/extensive-analysis.md`、`references/install-riffrec.md`、`references/quick-bug-report.md`、feedback format reference、`scripts/analyze_riffrec_zip.py`
- CE/spec 均有或 spec 额外存在 `scripts/__pycache__/...`

判断：
- 必要投影：入口、format reference 文件名、`ce-brainstorm` -> `spec-brainstorm`、`ce-debug` -> `spec-debug`。
- 注意：`extensive-analysis.md` 中 “durable requirements document under `docs/brainstorms/`” 是当前 spec-first 归一化；如果按更严格 sweep-style CE plan 输出链路，需另行 owner 决策，但本 skill 已按当前 spec-brainstorm 边界表达。
- 清理项：`__pycache__` 不应作为 source。

### `ce-simplify-code` -> `spec-simplify-code`

状态：CE parity / 仅必要投影。

已打开文件：
- CE/spec 均打开：`SKILL.md`、`references/personas/code-quality-reviewer.md`、`references/personas/code-reuse-reviewer.md`、`references/personas/efficiency-reviewer.md`

判断：
- 必要投影：入口、`ce-debug` -> `spec-debug`。
- Persona 文件保持一致。
- 结论：无额外处理。

### `ce-strategy` -> `spec-strategy`

状态：CE parity / 仅必要投影。

已打开文件：
- CE/spec 均打开：`SKILL.md`、`references/interview.md`、`references/strategy-template.md`

判断：
- 必要投影：入口、`ce-*` -> `spec-*`、current request 参数表达。
- Template 与 interview 保持一致。
- 结论：无额外处理。

### `ce-sweep` -> `spec-sweep`

状态：CE parity / 仅必要投影。

已打开文件：
- CE/spec 均打开：`SKILL.md`、`references/agents/media-analyzer.md`、`references/interview.md`、`references/model-tiers.md`、`references/plan-template.md`、`references/sources/email.md`、`references/sources/github-issues.md`、`references/sources/slack.md`、`references/state-schema.md`、`references/subagent-template.md`、`scripts/analyze_riffrec_zip.py`、`scripts/sweep-state.py`
- spec 额外：`scripts/__pycache__/*`

判断：
- 必要投影：`.spec-first/config.local.yaml`、`/tmp/spec-first/spec-sweep`、`spec-lfg` handoff、`product_contract_source: spec-sweep`。
- CE 行为保留：feedback source sweep、first-run interview、standing approval、state/lease engine、ack/read-back/cursor discipline、media analysis、fix verification、rolling `docs/plans/feedback-sweep-plan.md`。
- 结论：符合用户特别强调的 `spec-sweep` 方法论：当前版本是 CE 的必要 spec-first 化版本，而不是额外改写版。清理 `__pycache__` 即可。

### `ce-test-browser` -> `spec-test-browser`

状态：CE parity 加可保留增强。

已打开文件：
- CE/spec 均打开：`SKILL.md`、`references/pipeline-orchestration.md`

判断：
- 必要投影：入口、pipeline caller `spec-lfg`、helper 缺失提示转向 `spec-mcp-setup`。
- 增强/改写：入口结构重排为 Prerequisites/Setup；pipeline mode port/server orchestration 合入主 workflow；日志路径改为 `/tmp/spec-test-browser-dev-server-<port>.log`；禁扫 instruction files port。
- 注意：CE manual mode 先验证 server 再问 headed/headless；spec 当前先问 browser mode 再确定 scope/port/server，属于行为顺序变化。影响较低，但应记录。
- 结论：增强可保留；若追求严格 CE parity，可考虑恢复 manual mode 的 server check-before-question 顺序。

### `ce-test-xcode` -> `spec-test-xcode`

状态：CE parity / 仅必要投影，description 低风险扩写。

已打开文件：
- CE：`SKILL.md`
- spec-first：`SKILL.md`

判断：
- 必要投影：入口示例、`ce-code-review` -> `spec-code-review`。
- 增强：description 扩写、移除 Antigravity/Pi question tool 文案。
- 结论：核心 XcodeBuildMCP preflight、fail closed、手工安装提示保留。

### `ce-worktree` -> `spec-worktree`

状态：大幅增强型 divergence；增强可保留，但需记录为 spec-first-owned helper contract。

已打开文件：
- CE：`SKILL.md`
- spec-first：`SKILL.md`、`scripts/worktree-manager.sh`

判断：
- 必要投影：入口、`ce-work` / `ce-code-review` -> `spec-work` / `spec-code-review`。
- 增强/改写：spec 版本将 prose fallback 转成 internal helper + script-owned facts contract；新增 `user-invocable: false`、`allowed-tools` 窄授权、`detect --json` schema、env copy opt-in、mise/direnv trust behavior、node JSON emission、worktree creation refusal rules。
- CE 行为变化：CE 允许直接用户入口式使用；spec 明确 internal helper，不作为 public workflow。该变化符合 spec-first internal-helper 边界，但不是 CE 最小投影。
- 结论：增强可保留；需在迁移记录中标为 intentional divergence。

## 优先级建议

1. 修复或 owner 决策：`spec-product-pulse` 的 `disable-model-invocation` / `allowed-tools` / schedule persistence，`spec-promote` 的 `disable-model-invocation`，`spec-proof` 的 Publish Mode 与 HITL 主流程关系。
2. 明确记录可保留 divergence：`spec-commit-push-pr`、`spec-optimize`、`spec-worktree`。
3. 清理 source 污染：`spec-explain`、`spec-pov`、`spec-riffrec-feedback-analysis`、`spec-sweep` 下的 `__pycache__`。
4. 对增强项不做回退：`spec-commit`、`spec-dogfood`、`spec-polish`、`spec-resolve-pr-feedback`、`spec-test-browser` 等只需在审查记录中标注“CE parity + enhancement”。

## 验证说明

本报告未修改 `skills/` source，也未手改 generated runtime mirrors。逐项语义判断来自逐文件打开 CE 与 spec-first source；`diff -ru` 仅用于辅助定位差异。
