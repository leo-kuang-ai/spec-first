# CONCEPTS.md Advisory Vocabulary Rules

`CONCEPTS.md` is a repo-local advisory vocabulary. It helps agents use stable names for project-specific concepts, but it is not a PRD, ADR, workflow contract, product roadmap, setup requirement, or source-of-truth override. Direct source reads, checked-in contracts, current plans, user decisions, and deterministic command results win when they conflict with it.

For `spec-compound`, vocabulary maintenance is update-only. If `CONCEPTS.md` does not already exist at the repo root, do not create or bootstrap it during learning capture. Record `CONCEPTS.md: not present; no vocabulary maintenance applied` and continue. A downstream project does not need this file for `spec-first` to work.

This reference owns only `CONCEPTS.md` inclusion and refinement. Broader domain-model signals such as boundary scenarios, code/doc contradictions, existing `CONTEXT.md` evidence, or ADR candidates are handled by `references/domain-model-capture.md`; do not turn this file into a context or decision-log owner.

## When To Read This Reference

Read this file after the solution doc is written or updated, before reporting completion, whenever the repo root contains `CONCEPTS.md`. Do not skip the read by assuming no terms qualify from memory.

## What Qualifies

A term qualifies when its meaning is project-specific enough that a new engineer would need it defined to follow source, plans, reviews, tickets, or future learning docs. Good candidates include named workflow concepts, artifact types, status/lifecycle concepts, domain entities, and terms that are easy to confuse with a nearby project-specific term.

Do not add general programming vocabulary, ordinary English, one-off variable names, file paths, class names, function signatures, config values, owners, dates, version-specific claims, or raw implementation details. If a term only matters because of one exact source path, cite that path in the solution doc instead of promoting it to vocabulary.

Do not add mainstream engineering terms that already have standard definitions outside this project, even when the project uses them frequently. Examples include timeout, retry, refactor, parser, migration, error handler, configuration, CLI flag, and utility helper.

## How To Update

1. Scan the new or updated learning, its source-confirming evidence paths, and the closeout context for qualifying terms.
2. If an entry already exists, refine it only when the new learning adds durable precision. Union compatible shades of meaning into one entry; do not create duplicates or most-recent-wins rewrites.
3. If a term is new, add a concise entry in the closest existing cluster. Keep definitions standalone enough for a reader without the current session.
4. If the team uses several words for one concept, pick the clearest term and record retired names as an `Avoid:` line when useful.
5. Keep edits scoped to the learning's vocabulary neighborhood. Do not run a repo-wide concept sweep from compound.

## Entry Shape

Use a heading for the term, then one sentence defining what it means in this project and what distinguishes it from neighbors. A second short paragraph is allowed only for non-obvious behavioral rules, lifecycle rules, or ownership invariants.

Avoid examples that will drift, status metadata, links to PRs/issues, or source paths inside the entry. Cross-references to other entries are fine when both entries are defined in `CONCEPTS.md`.

## Discoverability

If `CONCEPTS.md` was refined and the project instruction file does not surface it, full interactive mode may ask for consent to add a small discoverability line. Lightweight mode should only report a tip. Do not create instruction-file churn for a no-op vocabulary scan.
