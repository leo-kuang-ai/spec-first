# intent and plan

## Argument Parsing

Read `references/intent-and-plan.md`, `references/modes-and-output.md`, and `references/scope.md` before scope or output decisions.

Parse the invocation arguments supplied by the current host for optional tokens. Strip only recognized tokens while preserving quoted paths, Windows drive paths, URLs, and the order of the remainder before interpreting it as a PR number, GitHub URL, or branch name.

| Token | Example | Effect |
|-------|---------|--------|
| `mode:agent` | `mode:agent` | **Report-only**: return **JSON** instead of markdown tables and skip the Stage 5c apply (the caller applies). Does not change reviewer selection, merge logic, or scope rules (see Output format) |
| `mode:headless` | `mode:headless` | **Deprecated alias** for `mode:agent` |
| `mode:report-only` | `mode:report-only` | **Deprecated — ignored.** Former no-artifacts mode; default behavior is review-only without checkout |
| `base:<sha-or-ref>` | `base:abc1234` or `base:origin/main` | Diff base on the **current checkout** (explicit; skips auto base detection) |
| `plan:<path>` | `plan:docs/plans/2026-03-25-001-feat-foo-plan.md` | Plan file for requirements verification (explicit). Supports markdown and HTML unified plans. |
| `task-pack:<path>` | `task-pack:docs/tasks/example-tasks.md` | Local task-pack source for a bounded task review. Requires `task:`, `task-context:`, `mode:agent`, and `base:`. |
| `task:<task_id>` | `task:T003` | Task Card ID to review from the paired task pack. |
| `task-context:<path>` | `task-context:<run-local-json>` | Caller-captured `spec-code-review-task-context/v1` facts for digest, pre-task state, and task delta attribution. |
| `depth:full` | `depth:full` | **Force the full reviewer roster** — skip the Stage 3c small-diff lite path so every always-on persona runs regardless of diff size. Use when a deep/thorough review is explicitly requested (the one escalation signal Stage 3c cannot infer from the diff). Does not change conditional selection, merge, or scope. |
| `depth:auto` | `depth:auto` | **Default** — self-right-size via Stage 3c (lite roster for trivial, low-risk, code-only diffs; full roster otherwise). |
| `grouping:auto` | `grouping:auto` | **Default** — build thematic triage groups when findings span distinct concerns (Stage 5 step 9b) |
| `grouping:off` | `grouping:off` | Suppress triage groups: no Triage Groups section, empty `triage_groups` in JSON |
| `grouping:always` | `grouping:always` | Always build triage groups, even for small reviews |

**Grouping is presentation, not a mode.** The `grouping:` tokens change how the finding set is organized for triage — never reviewer selection, merge logic, scope rules, or the Stage 5c apply decision.

**Mode alias:** `mode:headless` normalizes to `mode:agent`. `mode:agent` + `mode:headless` is not a conflict.

Path-valued tokens split only at their first `:` and may be host-quoted so paths with spaces remain one argument. Preserve the decoded path exactly; do not split it again on whitespace. Windows drive letters inside the value and POSIX paths are data, not extra tokens.

**Conflicting arguments:** Stop without dispatching reviewers when:
- Multiple incompatible scope selectors appear together (e.g. `base:` **and** a PR number/branch target — `base:` means "review the current checkout against this base")
- Multiple distinct `mode:` tokens other than the `mode:agent`/`mode:headless` alias pair
- Multiple distinct `grouping:` tokens (e.g. `grouping:off` **and** `grouping:always`)
- task-pack and task tokens must appear together, exactly once, with exactly one `task-context:` token
- any task token appears without `mode:agent` or without `base:`, or task context is combined with a PR number/URL/branch target

Deprecated `mode:autofix` is **not** a conflict — ignore the token and proceed with the normal flow (see below).

Emit a one-line failure reason. In `mode:agent`, return JSON: `{"status":"failed","reason":"..."}`.

### Phase 0a: Freeze effective mode before any tool call

Normalize mode before interpreting intent or running any repository command. This is an exit gate, not a later presentation choice:

```yaml
effective_mode: default | agent
source_mutation_gate: open | closed
artifact_write_gate: review-artifacts-only
```

When `mode:agent` or its `mode:headless` alias is present, set `effective_mode: agent`, `mutation_policy: report-only`, and `source_mutation_gate: closed`. In this mode, adjacent fix/apply wording is intent data, not mutation authority. Do not call project-writing tools, `apply_patch`, edit/write APIs, `git apply`, `git restore`, `git checkout`, formatters with write flags, or any command that can rewrite reviewed source. The only permitted writes are run-scoped review artifacts and deterministic evidence under the exact artifact roots owned below.

Generate the run ID and resolve `REVIEW_ARTIFACT_DIR` here, before scope inspection. Use the OS-native temporary-directory rules in Stage 4 and reuse the same canonical path for the entire run. Failure to create an artifact directory does not open the source mutation gate; `mode:agent` continues report-only with an in-band limitation.

### Phase 0: Resolve mutation, commit, and dispatch policy

Before scope detection, derive three independent run-local facts from the current user request and any visible upstream handoff:

```yaml
mutation_policy: report-only | apply-fixes
commit_authorization: authorized | missing
worker_dispatch_authorization: authorized | missing
capability_probe: not_applicable | attempted | unavailable
worker_dispatch_capability: available | missing | unknown
worker_context_isolation: isolated | inherited | unknown
worker_model_override: supported | unsupported | unknown
worker_bounded_parallelism: supported | unsupported | unknown
```

- Ordinary requests to "review", "check", "audit", or run `spec-code-review` use `mutation_policy: report-only`.
- **Report-only means the reviewed files stay byte-identical.** Under `report-only`, never "helpfully" fix, revert, restore, or normalize a defect you found — not even to undo an obviously bad change, and not even when the finding is P0. Finding a bug is evidence for the report; repairing it belongs to an explicitly authorized `apply-fixes` run (or the caller). `git restore`, `git checkout <file>`, `git apply -R`, edit/write tools on reviewed source, and formatter runs that rewrite it are all violations, regardless of the declared `mutation_policy` in the output JSON matching report-only.
- Use `mutation_policy: apply-fixes` only when the current user or upstream caller explicitly says review-and-fix, review and fix, apply fixes, or equivalent. `mode:agent` always forces report-only even when adjacent text asks to apply.
- `apply-fixes` authorizes only bounded local review-owned edits. It does not authorize commit, push, PR creation/update, tickets, or unrelated cleanup.
- Set `commit_authorization: authorized` only when commit creation is separately explicit. Without commit authorization, return a verified uncommitted review-fix set.
- Set `worker_dispatch_authorization: authorized` only when the current user/upstream explicitly requests subagents, personas, delegated reviewers, multi-agent review, or parallel review. A review invocation, task context, plan, available primitive, or permission setting is not dispatch authorization. Missing authorization forbids schema discovery and fixes `capability_probe: not_applicable` + `worker_dispatch_capability: unknown`. Only after authorization may the current-session registry/schema be consumed as `provider_untrusted` evidence; confirmed absence records `subagent_capability_missing`, while unavailable/incomplete/ambiguous discovery records `worker_capability_unproven`. Normalize every path as `worker_dispatch_outcome`; use only live facts for isolation, model override, parallelism, permission, capacity, output, and mutation claims.

If review repo scope is ambiguous in a parent multi-repo workspace, stop before local diff claims or apply and return a failure reason naming the required selected child repo/current checkout; do not open a blocking prompt. Read-only PR-remote scope may proceed from explicit PR metadata without choosing a sibling checkout. Generated runtime mirrors remain out of source-fix scope.
