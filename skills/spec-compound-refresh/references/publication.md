# Refresh Candidate Validation And Publication

Read before preparing mutations and again at the publication exit. This is the
refresh-local consumer of the Knowledge Harness candidate -> review -> promote
boundary. It covers learning edits, stale annotations, relocations, successors,
citation/catalog repairs, and `CONCEPTS.md`; Keep has no write.

## Prepare Private Candidates

Resolve the explicit target repository and authorized write scope first. Record
the current existence/SHA-256 of every target and planned deletion using tools,
not model estimates. Distinguish the candidate path, final target path, and
old source path. Compare normalized absolute paths; a target still used by any
successor must never appear in the deletion set. Do not follow a symlink into
another owner or overwrite an unrelated existing destination.

Assemble complete candidates in owner-private scratch. Final durable paths
remain unchanged through validation and semantic approval. Preserve original
content for recovery until the dependent action completes. Group a successor,
its citation/catalog repairs, and any dependent deletions together; unrelated
candidates may proceed independently. Vocabulary changes remain private until
their evidence and affected references are ready too.

## Validate Candidates

For a new or materially rewritten learning (Replace, Consolidate, Split, or
substantive worth-based shortening), read the schema, YAML guide, and template,
re-evaluate classification under v2, and require grounded `source_refs` and
`invalidation_condition`. Validate the private candidate:

```bash
SKILL_DIR="<absolute directory containing the spec-compound-refresh SKILL.md you read>"
bash "$SKILL_DIR/scripts/run-python.sh" "$SKILL_DIR/scripts/validate-frontmatter.py" --promotion <candidate-path>
```

For a reference-only Update or stale annotation, use the same validator without
`--promotion` and preserve legacy classification unless materially rewriting.
Glossary and catalog documents do not acquire learning frontmatter.

Exit 1 blocks publication until repaired. Exit 2 is a usage/input failure,
not a clean result. If the interpreter or validator is unavailable, report
`validator unavailable: <reason>` and apply the same mechanical checklist:

1. Frontmatter opens and closes with exact `---` lines (trailing whitespace allowed).
2. Unquoted top-level scalar values contain no ` #` or `: `; already quoted or
   structured values and nested values are outside this check.
3. In promotion mode, `source_refs` occurs exactly once as a non-empty top-level
   block or flow array of non-empty strings.
4. In promotion mode, `invalidation_condition` occurs exactly once as a non-empty
   top-level scalar or block string. For both promotion fields, quote tokens
   otherwise typed as null, boolean, number, sexagesimal, date, or timestamp.

The script checks parser safety and these two field shapes, not enum membership,
source credibility, or semantic adequacy. The author checks other schema rules;
manual fallback is disclosed and must not be reported as a script pass.

Run the claims check for changed learning candidates at their final destination:

```bash
bash "$SKILL_DIR/scripts/run-python.sh" "$SKILL_DIR/scripts/validate-doc-claims.py" <candidate-path> --repo-root <target-repo> --target-path <final-learning-path>
```

Exit 1 FLAGs require adjudication: repair, annotate historical references, or
justify intentional references; always repair drafting scaffold. Read NOTE
items even on exit 0: ordinary IDs need no correction, but actual commit claims
still require verification. Exit 2 blocks the check. If the tool is unavailable,
manually check cited paths, commit claims, relative links, and scaffold, and
report the unavailable tool. A valid non-Git directory retains filesystem/link
checks but has no Git/merge evidence. Do not fetch to manufacture freshness or
treat degraded exit 0 as proof of remote state.

Validate inbound and outgoing links against the planned final tree, including
heading anchors and catalog row identity. For links to not-yet-published
successors, a missing-target FLAG can be recorded as a pending dependency only
when the exact target and fragment exist in validated private candidates. It
does not pass until the actual published destination is checked. A link to an
old path scheduled for deletion must be repaired even if it resolves today.

Make an explicit semantic approval decision for each dependency group: retained
claims are supported, still-governing guidance is protected, unique content and
citations survive, invalidation conditions are concrete, and any worth cuts
have quoted recovery evidence and authority. Re-read defining source for changed
vocabulary behavior. Failed approval leaves durable targets unchanged; report
the recommendation and missing evidence. Independent review is optional when
authorized; inline review must not claim independent coverage.

## Publish

1. Recompute every recorded target and deletion existence/SHA-256 before any
   mutation. Drift blocks the affected group; rebuild and review against the
   new content rather than overwriting concurrent changes.
2. Prepare all approved same-directory temporary files before the first rename,
   checking that their bytes match the validated candidates. Use an atomic
   rename for each target, rechecking its snapshot immediately before mutation.
   Without a usable atomic primitive or verifiable target facts, leave the
   group recommended-only. Hash checks detect observed drift; they are not a
   filesystem compare-and-swap lock against arbitrary concurrent writers.
3. Publish approved vocabulary first, then learning successors/canonical docs,
   then dependent citation/catalog repairs. Keep old paths until all replacement
   content and links have been verified at their actual final paths. Same-path
   Replace ends with the replacement; it has no old-file unlink step.
4. Recheck deletion targets and inbound citations immediately before unlinking.
   A changed target, unresolved substantive citation, unpublished successor, or
   failed cleanup blocks deletion. Confirm the old content is recoverable from
   Git or a retained private recovery copy; untracked/non-Git originals must not
   be deleted on the assumption that Git history contains them.
5. Verify final content, links, catalog identities, and deletions. Only then mark
   the dependent action Applied. Multiple replacements are not a multi-file
   transaction. On failure, report exact partial publication (published, deleted,
   unchanged, and pending paths), keep the group incomplete, retain recovery
   evidence, and continue only independent work. Never blindly roll back over
   a concurrent edit or erase the only remaining original copy.

These are workflow instructions enforced by observed tool operations, not a
dedicated transactional runtime gate. Report that enforcement limit when
describing guarantees; never claim global atomicity or a successful tool check
from prose alone. Remove unused candidates/temporary files after completion;
retain recovery material needed by an incomplete action and identify it in the
report. Private scratch is never a successful durable deliverable.
