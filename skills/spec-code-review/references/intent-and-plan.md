# Intent And Plan Verification

Read before Stage 2. This file owns intent, plan discovery, readiness, task-level completeness, and current-tree orientation. Task-Scoped Live Plan Context inputs are defined in `references/scope.md`.

## Plan Requirements Completeness

When a plan is provided via `plan:<path>` or discovered from PR/branch context,
classify readiness before checking completeness:

- Unified artifact: metadata includes `artifact_contract: spec-unified-plan/v1`.
  - `artifact_readiness: requirements-only` can inform product intent, but it
    must not trigger implementation-unit completeness findings. Report that the
    artifact was not implementation-ready if the diff appears to implement it.
  - `artifact_readiness: implementation-ready` is eligible for full
    requirements and U-ID completeness checks.
  - Invalid progress-like readiness values (`active`, `in_progress`,
    `completed`, `done`) are contract errors.
- Legacy plan: use the existing completeness checks.

Extract requirements from these shapes, in order:

1. Unified `Product Contract` -> `### Requirements`
2. Legacy top-level `## Requirements`
3. Legacy `## Requirements Trace`

For unified implementation-ready plans, also extract U-IDs from
`## Implementation Units` and compare against PR body/branch context when
available. Do not require every Product Contract R-ID to map one-to-one to a
single U-ID; verify that implemented U-IDs cite the relevant R/F/AE/KTD IDs and
that no claimed U-ID is missing from the plan.

Task-mode exception: completeness scope is the selected Task Card, its `source_unit`/`requirement_refs`, and the bounded task delta only. Do not flag other plan requirements or U-IDs as unaddressed during an early task review; the final full review owns whole-plan completeness.

### Stage 2: Intent discovery

Understand what the change is trying to accomplish. The source of intent depends on which Stage 1 path was taken:

**PR/URL mode:** Use the PR title, body, and linked issues from `gh pr view` metadata. Supplement with commit messages from the PR if the body is sparse.

**Branch mode:** Run `git log --oneline ${BASE}..<branch-ref>` using the resolved merge-base and resolved branch ref from Stage 1. Use `<branch-ref>` (the resolved `origin/<branch>` or fetched ref), not the raw `<branch>` argument — a remote-only branch has no matching local ref, so the raw name would fail or read a stale same-named local branch.

**Standalone (current branch):** Run:

```
echo "BRANCH:" && git rev-parse --abbrev-ref HEAD && echo "COMMITS:" && git log --oneline ${BASE}..HEAD
```

Combined with conversation context (plan section summary, PR description), write a 2-3 line intent summary:

```
Intent: Simplify tax calculation by replacing the multi-tier rate lookup
with a flat-rate computation. Must not regress edge cases in tax-exempt handling.
```

Pass this to every reviewer in their spawn prompt. Intent shapes *how hard each reviewer looks*, not which reviewers are selected.

**When intent is ambiguous:** Infer from branch name, commits, PR title/body, diff, `plan:`, and conversation. Write the best-effort intent summary and note uncertainty in Coverage — never block on a clarifying question.

### Stage 2b: Plan discovery (requirements verification)

Locate the plan document so Stage 6 can verify requirements completeness. Check these sources in priority order — stop at the first hit:

1. **`plan:` argument.** If the caller passed a plan path, use it directly. Read the file to confirm it exists.
2. **PR body.** If PR metadata was fetched in Stage 1, scan the body for paths matching `docs/plans/*.{md,html}` (unified plans may be markdown or HTML). If exactly one match is found and the file exists, use it as `plan_source: explicit`. If multiple plan paths appear, treat as ambiguous — demote to `plan_source: inferred` for the most recent match that exists on disk, or skip if none exist or none clearly relate to the PR title/intent. Always verify the selected file exists before using it — stale or copied plan links in PR descriptions are common.
3. **Auto-discover.** Extract 2-3 keywords from the branch name (e.g., `feat/onboarding-skill` -> `onboarding`, `skill`). Glob `docs/plans/*` and filter filenames containing those keywords. If exactly one match, use it. If multiple matches or the match looks ambiguous (e.g., generic keywords like `review`, `fix`, `update` that could hit many plans), **skip auto-discovery** — a wrong plan is worse than no plan. If zero matches, skip.

**Confidence tagging:** Record how the plan was found:
- `plan:` argument -> `plan_source: explicit` (high confidence)
- Single unambiguous PR body match -> `plan_source: explicit` (high confidence)
- Multiple/ambiguous PR body matches -> `plan_source: inferred` (lower confidence)
- Auto-discover with single unambiguous match -> `plan_source: inferred` (lower confidence)

If a plan is found, classify readiness before extraction (see "Plan Requirements Completeness" above): for a unified plan read the metadata/header first, and treat a requirements-only artifact as product intent only — it must not drive implementation-unit completeness findings. Then read its **Requirements** in this order — unified `Product Contract` -> `### Requirements`, then legacy top-level `## Requirements`, then legacy `## Requirements Trace` — and the R-IDs (R1, R2, etc.) listed there, plus **Implementation Units** (current numeric subsections such as `### U1.`, `### U2.`, or `### Unit 1:` under `## Implementation Units`; legacy bullet or checkbox unit entries under that section also count). For HTML unified plans the same section names and R-/U-IDs appear as visible headings/anchors — match on the section name, ignoring HTML wrapper tags. Store the extracted requirements list and `plan_source` for Stage 6. In task mode, retain only the selected Task Card's cited source refs for this review and set `completeness_scope: selected-task`; when `source_plan_section_titles` are present, use the Task-Scoped Live Plan Context branch in `references/scope.md` rather than injecting a plan body or asserting freshness. Do not compare the bounded task delta with unrelated U-IDs. Do not block the review if no plan is found — requirements verification is additive, not required.

### Stage 2c: Resolve current-tree orientation

Derive one run-local stack/conventions orientation from the tree actually under review so reviewer selection and the non-standards reviewers (`correctness`, `testing`, `maintainability`) share the same current facts. For `local-aligned`, standalone, and `base:` scope, record the current git identity and dirty state, then read current manifests, layout, and active instructions. For `pr-remote` or `branch-remote`, derive only from the fetched reviewed refs/diff; never substitute the local checkout's profile. Do not persist or reuse this orientation across runs, branches, or worktrees.

Include a compact orientation slice plus direct source refs in the Stage 4 review context bundle passed to every reviewer **except** `project-standards` and `learnings-researcher`. This is orientation only and never replaces a fresh read. The `project-standards-reviewer` still reads the actual root and subdirectory `AGENTS.md`/`CLAUDE.md` standards files through the Stage 3b path list, and `learnings-researcher` re-globs `docs/solutions/` per run. If the reviewed tree or a required source cannot be read, record the exact degraded fact and narrow reviewer claims; do not silently fall back to a profile from another source identity.
