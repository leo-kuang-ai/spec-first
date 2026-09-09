# Mode detection and interactive delivery

## Interactive mode rules
- **Pre-load the platform question tool before any question fires.** In Claude Code, `AskUserQuestion` is deferred — call `ToolSearch` with `select:AskUserQuestion` once, eagerly, at the top of Interactive-mode work (before the routing question, walk-through, bulk-preview, and Phase 5 terminal question) rather than at the first question site. Other hosts don't need this preload.
- **The numbered-list fallback applies only when the harness genuinely lacks a blocking question tool** (`ToolSearch` no match, the call fails, or the mode doesn't expose it, e.g. Codex edit modes). A pending schema load is not a fallback trigger. In genuine-fallback cases present options as a numbered list and wait. Rendering a question as narrative text because the tool feels inconvenient, the model is mid-report, or the instruction was buried is a bug — a question that calls for a user decision must either fire the tool or fall back loudly, never slip past as prose.

## Phase 0: Detect Mode
Check the skill arguments for flags and a document path. Tokens matching `mode:*`, `mutation:*`, `output:*`, `roster:*`, or `depth:*` are flags, not file paths — strip every recognized flag before resolving the remaining document path for Phase 1.

| Flag | Meaning |
|------|---------|
| `mode:non-interactive` / `mode:headless` | Non-interactive delivery (the legacy `headless` name remains the envelope value) |
| `mutation:report-only` | Caller-requested zero-write review; valid for Markdown, HTML, and ambiguous/unwritable inputs |
| `mutation:apply-fixes` | Explicitly authorizes bounded reviewer-owned Markdown fixes for this run; does not authorize commit or landing |
| `output:json` | Render the existing structured envelope as one JSON object |
| `roster:lite` / `roster:standard` / `roster:full` | Reviewer budget profile (default **`standard`**) |
| `depth:full` / `depth:lite` | Aliases of `roster:full` / `roster:lite` |

If both `roster:` and `depth:` appear, **`roster:` wins**. If neither appears, profile = **`standard`**.

`mutation:` and `output:` tokens are exact-token contracts. Fixed failure strings in this skill (flag-conflict, headless-missing-path, missing-document) are machine-facing exact contracts: emit them verbatim — never translated, localized, or rephrased. Accept only `mutation:report-only`, `mutation:apply-fixes`, and `output:json`. A duplicate token, multiple `mutation:*` tokens, multiple `output:*` tokens, or any unsupported `mutation:*` / `output:*` value fails closed before document read or reviewer dispatch. Return `Review failed: flag-conflict-or-unsupported` with the conflicting token names; do not guess precedence and do not treat those tokens as a path.

Set run-local `requested_mutation` to `report-only` or `apply-fixes` only when the matching exact token is present; otherwise `default-report-only`. Set `output_mode` to `json` only when `output:json` is present; otherwise `text`. Output mode changes rendering only — it does not grant mutation, dispatch, producer, commit, or lifecycle authority.

Set run-local `delivery_mode` to `headless` when `mode:non-interactive` or its deprecated alias `mode:headless` is present, otherwise `interactive`. Headless changes delivery, not mutation authority: it never upgrades `default-report-only` to a write policy. Only an explicit `requested_mutation: apply-fixes` may resolve to `markdown-write`; under `report-only`, no document write occurs in either delivery mode. `output_mode` is a third orthogonal choice. Headless never uses blocking prompts or interactive routing and Phase 5 returns immediately with "Review complete". Invoke a producer-owned write review via `Skill("spec-doc-review", "mode:headless mutation:apply-fixes docs/plans/my-plan.md")`; omit the mutation token for ordinary report-only review. Interactive references are eligible only after Phase 1 resolves `mutation_policy: markdown-write`.
