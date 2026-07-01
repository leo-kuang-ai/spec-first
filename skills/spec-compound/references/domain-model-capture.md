# Domain Model Capture

This reference adapts the useful discipline from domain modeling into `spec-compound`. It is package-local and self-contained: do not depend on external local skill paths, do not expose a `domain-modeling` entrypoint from compound, and do not copy another skill's `CONTEXT.md` or ADR file topology into this workflow.

`spec-compound` still produces one primary artifact: a source-confirmed `docs/solutions/` learning document. Domain Model Capture only decides whether the solved lesson also surfaced project-specific vocabulary, boundary scenarios, source contradictions, or ADR-worthy decision candidates that should improve future recall.

## When To Read This Reference

Read this file after the solution doc is written or updated, before reporting completion, when the solved lesson includes any of these signals:

- a project-specific term, artifact type, lifecycle state, or named workflow concept
- a confusing alias or overloaded phrase that future agents could misread
- a boundary scenario that clarified what the solution does or does not cover
- a code, test, doc, or contract contradiction that changed the final lesson
- a hard decision that may be worth an ADR candidate

If none of these signals appear, record `Domain model capture: scanned, no qualifying signals` rather than widening into a repo-wide terminology sweep.

## Core Actions

Use these four actions as a compact scan, not as a new interview workflow:

1. **Glossary challenge**: compare the solved lesson's terminology against existing project vocabulary such as `CONCEPTS.md` and any directly relevant existing context file. If terms conflict, keep the resolved meaning in the learning and refine the existing vocabulary only under its update-only rules.
2. **Fuzzy term sharpening**: replace vague or overloaded words with the clearest project term when the distinction affects future recall, planning, review, or implementation. Record aliases as `Avoid:` only when they are likely to recur.
3. **Scenario stress**: capture boundary scenarios that forced the lesson to become precise, especially state transitions, permission or role edges, negative cases, cross-context handoffs, and failure paths. Fold these into the learning's guidance, prevention, examples, or rejected alternatives.
4. **Code cross-reference**: verify any claimed domain behavior against current source, tests, checked-in contracts, logs, or review evidence before promotion. If code contradicts the lesson, update the solution doc to reflect the source-confirmed behavior or record the unresolved contradiction as a limitation.

These actions are LLM-owned semantic judgment. Tests and scripts may check that the anchors exist, but they must not decide whether a term is domain-specific or whether an ADR candidate is justified.

## Persistence Order

Apply the narrowest durable surface that fits the evidence:

1. **Solution doc first.** Put the reusable lesson, boundary scenario, source contradiction, rationale, rejected alternatives, `domain`, `pattern`, `invalidation_condition`, and `source_refs` into the `docs/solutions/` learning when they help future recall.
2. **Existing `CONCEPTS.md` update-only.** If `CONCEPTS.md` exists, read `references/concepts-vocabulary.md` and add or refine only qualifying project-specific terms. If it does not exist, do not create or bootstrap it from compound.
3. **Existing context topology as advisory evidence only.** If `CONTEXT.md` or `CONTEXT-MAP.md` already exists and the solved lesson directly turns on that vocabulary, perform a bounded read as advisory evidence. Ordinary compound runs must not edit those files. If a context update looks useful, output a preview-first candidate with the existing path, proposed term, source evidence, and reason it belongs there.
4. **ADR candidate only.** Suggest an ADR candidate only when all three conditions hold: hard to reverse, surprising without context, and real tradeoff. Ordinary compound runs must not write `docs/adr/**` or context-specific ADR files. If the gate does not pass, keep the decision rationale inside the learning doc.

If the user explicitly asks to maintain context or ADR files, treat that as a separately scoped follow-up. Do not silently expand a compound run into a domain-modeling or decision-log maintenance workflow.

## What Qualifies

A signal qualifies when it is specific to this project and materially improves future retrieval or decision quality.

Good candidates:

- `Generated Runtime`: a project-specific boundary between checked-in source and host-projected mirrors; future agents need this term to avoid patching the wrong files.
- `verification-run-summary.v1`: a named evidence artifact whose status and reason-code semantics affect honest closeout.
- `Owner Decision Trace`: a project-specific requirements artifact section that records owner-authorized closure and is easy to confuse with free-form decision notes.
- A boundary scenario such as "compound found one project-specific term but four general engineering words" when it prevents over-capturing vocabulary.
- A code-doc contradiction such as a learning claiming automatic refresh while current source only recommends a narrow `spec-compound-refresh` follow-up.

Do not capture:

- General programming or ordinary engineering terms such as timeout, retry, refactor, utility helper, test, error handler, database migration, configuration, parser, or CLI flag.
- Ordinary English words, one-off variable names, file paths, class/function names, owners, dates, version-specific facts, or raw implementation details.
- Terms already present in `CONCEPTS.md` when the solved lesson adds no durable precision; report `scanned, no qualifying terms` instead of duplicating entries.
- Routine implementation decisions that were easy to reverse, unsurprising, or not the result of a real tradeoff.

Before adding a term, ask: would a new engineer or future agent misunderstand this project without a short definition, or is it a mainstream engineering concept with a standard definition? Only the former belongs in vocabulary maintenance.

## Output Notes

The final compound summary should include the Domain Model Capture result when it ran:

```text
Domain model capture: <scanned, no qualifying signals | folded into learning | context/ADR preview candidates reported>
CONCEPTS.md: <updated — N added/refined | scanned, no qualifying terms | not present; no vocabulary maintenance applied>
Context/ADR candidates: <none | preview only — path/reason/evidence>
```

Keep candidate wording precise enough that a human can approve a follow-up without re-reading the whole compound run, but do not treat preview candidates as confirmed writes.
