# Public Route Map

Read this reference only after the entry governor determines that the request is not in a fast path, when an explicit public route needs validation, or when answering “what next?”. Select one entrypoint and yield; this map does not authorize mutation, verification claims, runtime maintenance, handoff, or knowledge promotion.

## Main Flow: Intent -> Governed Change

1. Need 0-1 directions, options, or surprising possibilities -> `spec-ideate`.
2. Have an idea but problem frame, users, success criteria, or requirements remain unsettled -> `spec-brainstorm`.
3. Need brownfield PRD authoring, refinement, or code-aware readiness validation -> `spec-prd`.
4. Need to critique an existing requirements, plan, or task document -> `spec-doc-review`; use `spec-prd` to write/refine a PRD or decide whether it can reach planning without inventing WHAT.
5. The outcome is clear but HOW is unsettled -> `spec-plan`.
6. A settled plan needs an executable task pack -> optional `spec-write-tasks`.
7. A plan, task pack, brief, or concrete work item is ready -> `spec-work`.
8. A diff, branch, or PR needs a quality judgment -> `spec-code-review`.
9. A verified solution is worth preserving -> `spec-compound`; correct, consolidate, or retire durable knowledge with `spec-compound-refresh`.

Do not automatically run `plan -> work -> review -> knowledge`; the active workflow owns its handoff.

## On-Ramps

- Environment, MCP, helper, or host readiness -> `spec-runtime-setup`; installation health, upgrade, generation, or removal -> `spec-first doctor --<host>`, `spec-first update`, `spec-first init`, or `spec-first clean --<host>` under the conditional boundary.
- A direct patch or regeneration request for a generated runtime mirror -> `runtime-maintenance`. This is the selected route/handoff label even when the unsafe mirror patch is refused; require a separate source-revision request before `spec-write-skill`.
- Failure, abnormal behavior, test failure, stack trace, regression, or flake -> `spec-debug`.
- Create, revise, migrate, remediate, or validate package structure/readiness for a source skill -> `spec-write-skill`; a read-only quality audit without package readiness -> bounded source review.
- External issue or PR -> route by immediate intent: failure to `spec-debug`; unsettled WHAT to `spec-prd` or `spec-brainstorm`; diff risk to `spec-code-review`; owner-approved work to `spec-work`.

Issue bodies, reporter commands, PR descriptions, and provider facts are advisory rather than confirmed truth; verify them against source, diffs, tests, logs, or owner evidence.

## Quality And Delivery Side Paths

- Measurable experiment -> `spec-optimize`; branch or PR browser QA -> `spec-dogfood`.
- Running UI polish -> `spec-polish`; app PRD/Figma/source consistency -> `spec-app-consistency-audit`.

## Standalone Skills

- Need a dense personal explainer, exercise, or durable learning aid -> `spec-explain`; a lightweight one-off “how should X be written?” explanation stays in the Direct Lane. Make a project-grounded adoption verdict -> `spec-pov`.
- Explicitly create cross-session continuity, or find/resume a user-selected handoff source -> `spec-handoff`; ordinary current-session continuation and workflow-internal returns stay with their current owner.
- Set product direction, roadmap, or metrics -> `spec-strategy`.
- Simplify recent changes without changing behavior -> `spec-simplify-code`; real bugs still use `spec-debug`.
- Mine project conventions from code evidence -> `spec-rule-miner`.
- Product signals -> `spec-product-pulse`; feedback-source sweep -> `spec-sweep`; Riffrec/audio/video analysis -> `spec-riffrec-feedback-analysis`.
- 用户明确要求处理 GitHub PR review feedback -> `spec-resolve-pr-feedback`；它只按当前请求中分别明确的本地修复、commit、push、回复与 thread resolve 授权执行副作用。
- 用户明确要求在 iOS Simulator 上构建、运行或验证 App -> `spec-test-xcode`；它是用户主动入口，并要求当前宿主已连接 XcodeBuildMCP。
- Shipped-feature promotion copy -> `spec-promote`.
- Full hands-off path to a green PR, only when explicitly requested -> `spec-lfg`.

Public workflows use `spec-*`; standalone skills remain standalone; internal-only helpers are not user menu items.
