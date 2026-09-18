# Orchestrator Routing

## Goal Archetypes

| Archetype | Trigger Keywords | Mode | Preset Pipeline |
|---|---|---|---|
| `ship-ready` | ship, release, deploy, publish, production-ready, merge | loop | probe, debug, fix, regression, ship |
| `optimize-metric` | improve, optimize, increase, reduce, faster, smaller, coverage, score | loop | plan, (classic loop), evals |
| `fix-broken` | fix, broken, failing, error, crash, bug, can't run, tests fail | loop | debug, fix, regression |
| `harden` | security, vulnerability, audit, OWASP, CVE, harden, lock down | loop | security, fix, security |
| `build-feature` | build, add, implement, create, new feature, acceptance test | loop | (acceptance-test derive), debug, fix, regression |
| `explore` | understand, explore, investigate, what does, how does, edge cases | loop | probe, scenario, plan |
| `document` | document, wiki, generate docs, explain codebase, write guide | dispatch | learn |
| `what-to-build` | what should I build, ideas, improvements, PRD, roadmap | dispatch | improve |
| `decide-design` | which approach, compare options, design decision, architecture choice | dispatch | reason |

`classify` 仅返回关键词匹配事实（`schema_version: 1` 的 advisory JSON，字段为 `status`、`requires_semantic_judgment`、`candidates[{archetype, mode, matched_keywords}]`）。它不输出最终 archetype/mode，也不处理否定、同义词或语言理解；候选顺序无优先级，无匹配返回空数组。LLM 阅读完整目标后进行语义分类并依入口确认，不将关键词直接变成执行决定。

兼容说明：旧的两列 label/mode 文本输出已退役；消费者必须解析 v1 JSON 并执行语义判断，不能把第一候选写入状态。仓库内消费者为 SKILL 的 Classify 步骤；既有已确认的 orchestrator-state 格式不变。

## Router Decision Table

The `next-hop` subcommand of `scripts/orchestrate.sh` reads `orchestrator-state.json` and applies these rules in order. First match wins.

| State Signal | Source | Next Hop |
|---|---|---|
| `errors > 0` in last handoff | handoff.json `findings` | `fix` |
| regression verdict `UNSTABLE` | handoff.json `verdict` | `regression` |
| `untested_gaps` flagged | handoff.json or units output | `debug` |
| 连续 3 次 units unknown | orchestrator-state.json | `BLOCKED` |
| `pending_verify` true | orchestrator-state.json | `verify` (fresh independent acceptance check) |
| hop outcome `blocked` or `failed`, no retry route | orchestrator-state.json | `BLOCKED` (checkpoint + stop) |
| 失败 hop 有 retry route | orchestrator-state.json | retry route（不能以旧 predicate 收敛） |
| predicate met，且没有上述待处理信号 | Success predicate command exit/output | `DONE` (exit loop) |
| plateau detected | `scripts/orchestrate.sh plateau` | `PLATEAU` (stop + report) |
| archetype pipeline has remaining steps | preset pipeline sequence | next preset step |
| all preset steps exhausted, predicate not met | — | `regression` (convergence re-check) |

`verdict` 与 `next-hop` 共用待处理信号判定：verify → `PENDING-VERIFY`，BLOCKED → `BLOCKED`，其余纠正/重试路由 → `INCOMPLETE`。仅当前最后 hop 的未解决失败阻断；恢复后的 progressed hop 不受历史失败永久阻断。

State signals are cheap reads — last `handoff.json` plus the regression verdict field and error count. No re-run of the full suite just to route.

## Independent Verify & Overfit Guard

The orchestrator must not optimize and accept against the same signal — that lets a
change game its own metric. For `optimize-metric` and `build-feature`, the acceptance
check runs on a **held-out** set (a fresh scenario set or holdout assertions), separate
from the `units` signal used to choose the change. When a high-impact change is accepted
on the working signal, the orchestrator sets `pending_verify` in `orchestrator-state.json`;
`next-hop` then routes to a **verify** hop (dispatched to `reason` or `predict` as an
independent adversarial check) before declaring `DONE` or shipping. The verify hop is
advisory input to convergence — it never auto-approves ship, which stays human-gated.

## Two-Mode Split

**Orchestration loop** — used when the goal has an external, mechanical Success predicate: a shell command that returns a value the orchestrator can compare across cycles. Progress is objective (Units remaining falls), plateau is well-defined, and the loop terminates on convergence or a safety backstop. Archetypes: ship-ready, optimize-metric, fix-broken, harden, build-feature, explore.

**Single-pass dispatch** — used when no mechanical predicate exists. The goal is subjective or the subcommand is internally-converging (reason runs its own adversarial loop) or a one-shot terminal emitter (learn, improve produce a document and stop). The orchestrator routes once, the subcommand self-terminates, and the orchestrator reports the result. No Units remaining, no Plateau counter, no ship gate. Archetypes: document, what-to-build, decide-design.

The criterion is: "Can the orchestrator independently verify done without re-running the subcommand?" If yes → loop. If no → dispatch.

## Build-Feature: TDD Ladder

The `build-feature` archetype has no pre-existing metric, so progress is reframed as `green-assertion-count` (monotone integer, higher-is-better). A change that turns a red sub-test green is kept; a change that regresses a green sub-test is reverted. A floor-guard prevents reverting scaffolding commits that compile and add no new failures but pass zero new tests. Large net-new scope (greenfield with no existing test suite) is detected and the orchestrator advises handing off to a dedicated build command rather than grinding cycles.

## Preset Pipelines (Reference)

| Archetype | Step 1 | Step 2 | Step 3 | Step 4 | Step 5 |
|---|---|---|---|---|---|
| ship-ready | probe | debug | fix | regression | ship |
| optimize-metric | plan | (classic loop) | holdout-verify | evals | — |
| fix-broken | debug | fix | regression | — | — |
| harden | security | fix | security | — | — |
| build-feature | (acceptance-test derive) | debug | fix | regression | — |
| explore | probe | scenario | plan | — | — |
| document | learn | — | — | — | — |
| what-to-build | improve | — | — | — | — |
| decide-design | reason | — | — | — | — |

Presets are starting pipelines. The router adapts per cycle from observed state — it may skip, repeat, or reorder steps based on the decision table above. The preset is a prior, not a fixed schedule.

## Glossary

Terms used consistently across this file, SKILL.md, and orchestrator-state.json. Definitions live in CONTEXT.md.

| Term | Short meaning |
|---|---|
| Goal archetype | Classification of the user's natural-language goal into one of the 9 categories above |
| Success predicate | Exact shell command + expected output that defines "done" for Orchestration loop goals |
| Units remaining | Scalar measure of open gaps (failing tests, errors, metric delta); lower-is-better; computed by `scripts/orchestrate.sh units` |
| Plateau | Units remaining flat or worse for N consecutive computed cycles (default 5); oscillation that nets zero also qualifies |
| Orchestration loop | The cycle-bounded assess→route→run→record loop used for predicate-bearing archetypes |
| Single-pass dispatch | One-shot routing to a self-terminating subcommand; no loop, Plateau, ceiling, or ship gate |
| Independent verify hop | A `verify` routing step (reason/predict) that checks an accepted high-impact change against a fresh signal before DONE/ship; gated by `pending_verify` |
| Holdout-verify | Acceptance check run on a held-out set, separate from the `units` signal used to choose the change, to prevent overfitting the metric |
