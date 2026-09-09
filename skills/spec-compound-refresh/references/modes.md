# Mode selection, authority, and bootstrap

## Mode Detection

Check whether the invocation arguments supplied by the current host contain the exact token `mode:non-interactive` or its deprecated alias `mode:headless`. Strip only those tokens (preserving the remainder, quoted paths, and token order as the scope hint) and run in **non-interactive/headless mode**.

| Mode | When | Behavior |
|------|------|----------|
| **Interactive** (default) | User is present and can answer questions | Ask for decisions on ambiguous cases, confirm actions |
| **Headless** | `mode:headless` in arguments | No user interaction. Apply all unambiguous actions (Keep, Update, Consolidate, auto-Delete, Replace with sufficient evidence). Mark ambiguous cases as stale. Generate a summary report at the end. |

### Resolve mutation and landing authority

Record three independent run-local facts before any write or Git action:

```yaml
mutation_authorization: authorized | missing
commit_authorization: authorized | missing
landing_authorization: authorized | missing
```

A direct request to refresh or maintain `docs/solutions/` authorizes only the bounded local document mutations described by this workflow. Set `commit_authorization` only when the current user or visible upstream handoff separately requests a commit. Set `landing_authorization` only when push or PR creation/update is separately explicit. `mode:headless`, a feature branch, writable permissions, successful edits, or a clean tree do not grant commit, branch creation, push, or PR authority. Without commit authorization, preserve verified edits as uncommitted work; without landing authorization, do not push or open a PR.

### Headless mode rules

- **Skip all user questions.** Never pause for input.
- **Process all docs in scope.** No scope narrowing questions — if no scope hint was provided, process everything.
- **Attempt all safe actions:** Keep (no-op), Update (fix references), Consolidate (merge and delete subsumed doc), auto-Delete (unambiguous criteria met), Replace (when evidence is sufficient). If a write succeeds, record it as **applied**. If a write fails (e.g., permission denied), record the action as **recommended** in the report and continue — do not stop or ask for permissions.
- **Mark as stale when uncertain.** If classification is genuinely ambiguous (Update vs Replace vs Consolidate vs Delete) or Replace evidence is insufficient, mark as stale with `status: stale`, `stale_reason`, and `stale_date` in the frontmatter. If even the stale-marking write fails, include it as a recommendation.
- **Use conservative confidence.** In interactive mode, borderline cases get a user question. In headless mode, borderline cases get marked stale. Err toward stale-marking over incorrect action.
- **Always generate a report.** The report is the primary deliverable. It has two sections: **Applied** (actions that were successfully written) and **Recommended** (actions that could not be written, with full rationale so a human can apply them or run the skill interactively). The report structure is the same regardless of what permissions were granted — the only difference is which section each action lands in.

## CONCEPTS.md bootstrap requests

If invoked specifically to create or bootstrap `CONCEPTS.md` (e.g., "create a CONCEPTS.md", "build the concept map", "set up shared vocabulary"), the intent is ambiguous between two jobs — building the vocabulary file and running a docs/solutions refresh — so disambiguate before proceeding. Use the platform's blocking question tool: `AskUserQuestion` in Claude Code (call `ToolSearch` with `select:AskUserQuestion` first if its schema isn't loaded), `request_user_input` in Codex. Fall back to numbered options in chat only when no blocking tool exists in the harness or the call errors (e.g., Codex edit modes) — not because a schema load is required. Never silently skip the question. Two options:

1. **Create CONCEPTS.md (build the concept map)** — seed the repo-wide concept map; skip only the docs/solutions classification phases (Phases 0–4). Read `references/concepts-vocabulary.md` and follow its **Seed goal** and **Scope of a seed** (repo-wide) rules: seed the project's core domain nouns from the declared domain model (schema, core types, primary models, top-level domain docs), each meeting the qualifying bar, the codebase setting the count. Write the preamble (see Phase 4.5), cluster per the organization rules, and run the Discoverability Check so `AGENTS.md`/`CLAUDE.md` surface the new file. Then enter the authority-aware Phase 5 closeout; without separate commit authorization, leave the verified bootstrap edits uncommitted.
2. **Run a refresh cycle** — proceed with the normal refresh flow below; `CONCEPTS.md` is seeded (if absent) and reconciled as part of Phase 4.5.

In headless mode there is no user to ask: default to the refresh cycle (vocabulary is seeded and reconciled within Phase 4.5 regardless) and note in the report that a standalone repo-wide bootstrap was not run.
