# Scope Guards

本文件承接 SKILL 主面的 scope guards 详细规则:准入豁免、substantial work 判定、subagent/active-workflow 非重路由、skill trigger 与 workflow admission 区分、父级多仓 workspace 写入边界。SKILL 主面只保留路由面(Routing Priority + Route Map)与少量 runtime-safe stub,本文件是这些规则的详情落点。

## If You Are Already In A Workflow

If a public `spec-first` workflow is already active, do not restart entry routing on every step. Follow the active workflow's `SKILL.md`.

Re-run entry routing only when the user changes the goal, the active workflow explicitly hands off, or the current request is clearly outside the active workflow's scope.

## If You Are A Subagent

If you were dispatched as a subagent or worker for a specific bounded task, do not restart workflow routing unless the parent explicitly asked you to choose a workflow. Complete the assigned task within its scope and report back.

## What Counts as Substantial Work

Treat these as substantial work:

- non-trivial or risky edits that need an engineering loop: multi-file changes, architecture or contract changes, governance/runtime delivery changes, unclear root cause, sensitive areas, or changes likely to require planning, debugging, review, or migration judgment
- starting implementation, debugging, review, planning, setup, update, bootstrap, optimization, or context-capture workflows
- running commands that change project state or depend on workflow context
- making architectural, prompt, workflow, governance, or contract decisions
- creating, refreshing, or retiring durable project knowledge

These are not substantial work:

- lightweight factual answers
- brief explanations with no workflow leverage
- quick questions where `spec-first` provides no meaningful routing benefit
- showing command output or answering a narrow "where is X used?" question without edits
- clearly scoped, single-point, low-risk code/prose/config edits such as a typo, comment, constant, or local single-function fix, provided the root cause and target file are clear and no architecture, contract, governance, runtime delivery, multi-file, or sensitive-surface judgment is needed

## Sensitive Surfaces

A **sensitive surface** is any area where an edit's blast radius, reversibility cost, or governance weight exceeds an ordinary local change — so the change is substantial work even when the diff looks small. Do not rationalize a sensitive-surface change as "non-sensitive" just because it touches few lines.

Sensitive surfaces include:

- **Architecture / contracts:** source-of-truth schemas, `src/cli/contracts/**`, public CLI/JSON shapes, cross-module interfaces, or anything downstream consumers depend on.
- **Governance / routing:** entry-routing prose, red flags, `skills-governance.json`, bootstrap blocks, host instruction managed slices.
- **Runtime delivery:** generated mirror generation logic, `init`/`doctor`/`clean` behavior, source→runtime projection.
- **Security / safety:** auth, credential handling, secret-deny patterns, security scanners, destructive command paths.
- **Multi-file / wide blast radius:** changes that ripple across many files, or whose rollback is coupled.

Examples:

- Sensitive (route, do not treat as small): editing `routing-red-flags.md` route targets, changing a task-pack validator field, adjusting `skills-governance.json`, modifying a security scanner pattern.
- Not sensitive (clearly scoped small edit may proceed directly): fixing a typo in a doc paragraph, correcting a comment, renaming a local variable inside one function, adjusting a single non-contract constant.

When in doubt, treat the surface as sensitive and route rather than editing directly.

## Lightweight Direct Outcomes

`using-spec-first` has valid non-workflow outcomes. When the current request is lightweight, answer directly or perform a bounded read instead of creating a public workflow artifact.

Direct-answer / bounded-read cases include greetings, current-context or current-instruction explanations, narrow code-location lookups such as "where is X used?", and summarizing or reorganizing the current conversation or a user-provided single document. These requests may still use ordinary source tools such as `rg` or precise file reads when needed, but they do not require brainstorm, plan, work, review, Graphify, or durable artifacts by default.

Clearly scoped small edits may also proceed as normal execution without opening a public workflow. Direct execution still carries the local engineering discipline: update `CHANGELOG.md` when project policy requires it, use the narrowest meaningful verification, respect source/runtime boundaries, and avoid generated mirror patches as source fixes.

If a lightweight request turns into non-trivial or risky editing, planning, review, debugging, setup, source/runtime judgment, multi-file spread, unclear root cause, or another substantial state-changing action, reclassify it at that point and route normally.

## Spec-First Self-Work

Work on `spec-first` itself is substantial when it changes skills, agents, prompt/workflow prose, host instruction blocks, `init`/`doctor`/`clean` behavior, governance contracts, architecture, source/runtime policy, or runtime delivery rules.

Before self-work that changes architecture, prompt, workflow, contract, source/runtime governance, or evolution policy, read `docs/10-prompt/结构化项目角色契约.md` and use it as the judgment baseline.

Clearly scoped, single-point, low-risk ordinary code/prose corrections in `spec-first` itself may proceed directly when they do not touch prompt/workflow/contract/governance/runtime delivery semantics and do not expand beyond the known target. Keep the same local discipline: source-of-truth edits, `CHANGELOG.md` when required, narrow verification, and reclassification if the change becomes substantial.

Route substantial concrete implementation or prose changes to `spec-work`. The workflow identifier stays the same across hosts; host-specific loading is only the runtime carrier.

Route unresolved policy, architecture, or scope questions to `spec-brainstorm` or `spec-plan` based on whether the WHAT or HOW is unclear. Route review-only requests by artifact type: code/diff/PR quality review to `spec-code-review`, requirements/plan/Markdown review to `spec-doc-review`, and skill/agent asset governance audits to `spec-skill-audit`. If the request asks for review plus concrete revisions, route to work and keep a review posture during execution.

For source changes, update source-of-truth files, the narrowest contract tests, and `CHANGELOG.md` when project policy requires it. Keep changelog entries compact and consume changelog history through the latest relevant window / summary-first rules in `docs/contracts/context-governance.md`. Do not modify generated `.claude/`, `.codex/`, or `.agents/skills/` mirrors just to refresh runtime behavior. If runtime drift must be repaired after source validation, use `spec-first init` with the target host selected as a runtime regeneration step, not as the source fix.

## Skill Trigger vs Workflow Admission

A skill trigger is source/methodology loading; it is not automatically public workflow admission. Reading this SKILL, loading an examples file, or matching a skill description can help classify the request while still producing a direct answer, bounded read, or normal execution when no public workflow adds value.

Public workflow admission happens only when the current intent actually matches a public `spec-*` workflow, or the user explicitly invokes one and the route is safe. Legacy host-specific spellings normalize to the same unified workflow id; they are not separate products and should not be presented as current user-facing entrypoints. Admission to a workflow authorizes that workflow to run under its own contract; it does not create a plan/task/review artifact inside this governor and does not grant host-level subagent dispatch beyond the dispatch rules below.

## Parent Workspace Direct Reads

If the user asks a read-only codebase question from a parent workspace containing multiple child Git repos, do not force a workflow only because there are multiple repos. Use bounded direct reads in the likely child repo candidates and state the target-repo assumption. If the request asks for planning, writing, fixing, testing, changelog updates, review autofix, or commits, route normally but require explicit `target_repo` / per-child scope before any repo-local write.
