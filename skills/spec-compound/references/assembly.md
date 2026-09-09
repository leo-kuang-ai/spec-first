# Candidate Assembly And Grounding

Read `references/schema.yaml`, `references/yaml-schema.md`, and `assets/resolution-template.md` when assembling. Phase 2.46 lives in `references/enhancement.md`; publication in Phase 2.47 requires `references/promotion.md`. Nothing in this reference publishes durable candidates.

### Phase 2: Assembly & Candidate Validation

<sequential_tasks>

**WAIT for all Phase 1 inputs to complete before proceeding** — the three research roles (parallel only under authorized dispatch) and, when separately authorized in Full mode, the internal session-history flow, which may stop at `no relevant prior sessions`. An authorization skip is a terminal Phase 1 fact, not an empty permission to inspect private session roots.

The orchestrating agent (main conversation) performs these steps:

1. **Collect Phase 1 results from the run artifacts.** Read `context.json`, `solution.md`, `related.json`, and `session-history.md` when that flow ran. Under authorized dispatch, fall back to the subagent's inline return only when its artifact is absent or empty. Under inline fallback, the orchestrator owns both role execution and artifact writes. The artifact is authoritative when present.
2. **Check the overlap assessment** from the Related Docs Finder before deciding what to write:

   | Overlap | Action |
   |---------|--------|
   | **High** — existing doc covers the same problem, root cause, and solution | **Update the existing doc** with fresher context (new code examples, updated references, additional prevention tips) rather than creating a duplicate. The existing doc's path and structure stay the same. |
   | **Moderate** — same problem area but different angle, root cause, or solution | **Create the new doc** normally. Flag the overlap for Phase 2.5 to recommend consolidation review. |
   | **Low or none** | **Create the new doc** normally. |

   The reason to update rather than create: two docs describing the same problem and solution will inevitably drift apart. The newer context is fresher and more trustworthy, so fold it into the existing doc rather than creating a second one that immediately needs consolidation.

   When updating an existing doc, preserve its file path and existing frontmatter structure, but add `source_refs` and `invalidation_condition` when absent because this path materially rewrites the learning. Update the solution, code examples, prevention tips, and any stale references. Add a `last_updated: YYYY-MM-DD` field to the frontmatter. Do not change the title unless the problem framing has materially shifted.

3. **Incorporate session history findings** (if available). When the internal session-history flow returned relevant prior-session context:
   - Fold investigation dead ends and failed approaches into the **What Didn't Work** section (bug track) or **Context** section (knowledge track)
   - Use cross-session patterns to enrich the **Prevention** or **Why This Matters** sections
   - Tag session-sourced content with "(session history)" so its origin is clear to future readers
   - If findings are thin or "no relevant prior sessions," proceed without session context
4. Assemble the complete markdown into `<private-scratch-dir>/learning-candidate.md`, reading `assets/resolution-template.md` for the section structure of new docs. Do not create or modify the final `docs/solutions/**` path yet. For an existing target, record its current existence and SHA-256 before assembly so publication can detect concurrent drift.
5. Validate the candidate frontmatter against `references/schema.yaml`, including non-empty `source_refs` and `invalidation_condition` promotion exit fields and the YAML-safety quoting rule for array items (see `references/yaml-schema.md` > YAML Safety Rules). The references must be grounded and the invalidation condition must be semantically specific; the script in step 6 checks only their mechanical shape.
6. **Validate parser-safety and the knowledge-promotion exit contract on the candidate** after every new or materially rewritten learning. Promotion mode catches malformed `---` delimiter lines, unquoted ` #` in scalar values (silent comment truncation), unquoted `: ` in scalar values (silent mapping confusion), and mechanically requires a non-empty top-level `source_refs` array plus a non-empty top-level `invalidation_condition`. The bundled validator ships **inside the skill bundle**; `SKILL_DIR` resolves to the skill directory, but the runtime Bash tool's CWD is the user's project, so a project-relative path (without the `$SKILL_DIR` prefix) would miss. Run it through an existence guard so platforms that cannot locate the script (harnesses where `$SKILL_DIR` is unset) fall back to the same manual gate instead of silently skipping the protection:

   ```bash
   if [ -n "${SKILL_DIR:-}" ] && [ -f "$SKILL_DIR/scripts/validate-frontmatter.py" ]; then
     bash "$SKILL_DIR/scripts/run-python.sh" "$SKILL_DIR/scripts/validate-frontmatter.py" --promotion <candidate-path>
   else
     echo "Bundled validate-frontmatter.py not resolvable on this platform; applying the parser-safety and promotion checklist manually."
   fi
   ```

   - **If the script ran:** exit 0 means the mechanical promotion gate passed; exit 1 means stderr names the offending field(s) — repair the frontmatter and re-run until exit 0. Do not declare success while validation fails.
   - **If the script did not run** (else branch): apply the same parser-safety and promotion-shape checks by hand. Do not declare success until all four checks pass:
     1. The opening and closing frontmatter delimiters are each a line whose content is `---` (trailing whitespace is fine; `----` or `---extra` is not a valid delimiter).
     2. For each **top-level** mapping entry (`key: value`, no leading indentation) whose value is **not already quoted or structured** (does not start with `"`, `'`, `[`, `{`, `|`, or `>`): the value must contain no unquoted ` #` (space-then-hash — YAML treats it as a comment and silently truncates) and no unquoted `: ` (colon-then-space — strict YAML may read it as a nested mapping). Quote the whole value if either appears.
     3. `source_refs` appears exactly once as a top-level non-empty block or flow array, and every item is a non-empty string. Plain tokens that common YAML parsers type as null, boolean, number, sexagesimal, date, or timestamp do not count as strings; quote them.
     4. `invalidation_condition` appears exactly once as a top-level non-empty scalar or block string, with the same implicit-type quoting rule for plain scalar values.
     Nested parser-safety values, semantic source credibility, and semantic invalidation adequacy remain outside this mechanical fallback. Then state in the completion output that the bundled script validator was unavailable on this platform and the checks were applied manually.

   Default validator mode remains parser-safety-only for legacy compatibility. `--promotion` adds only the two promotion exit shapes; it does not judge reference credibility, invalidation adequacy, other schema fields, or enum values. It also does not flag YAML reserved-indicator characters (those produce loud parser errors downstream rather than silent corruption — out of scope). Uses Python 3 stdlib only (no PyYAML or other deps).

When creating a new doc, preserve the section order from `assets/resolution-template.md` unless the user explicitly asks for a different structure. A candidate passing this mechanical check is not promoted yet.

</sequential_tasks>

### Phase 2.4: Vocabulary Capture

**First, read `references/concepts-vocabulary.md`.** This is unconditional. Do not pre-judge from memory that nothing qualifies — the reference's criteria are non-obvious and qualifying terms often live in the surrounding conversation rather than the new doc itself. Reading the reference is what makes the rest of the phase possible.

Then, applying those criteria, scan the learning candidate **and** the surrounding conversation for qualifying domain terms. Prepare any resulting `CONCEPTS.md` change as `<private-scratch-dir>/concepts-candidate.md`; do not modify the durable file before Phase 2.47. If `CONCEPTS.md` exists at repo root, base the candidate on its current contents and record its SHA-256; if it does not exist and at least one qualifying term surfaced, prepare a new candidate.

**Verify behavior assertions against source before writing them.** When an entry asserts how code behaves (states, transitions, limits, semantics), Read the defining source at the current tree first — an entry drafted from a session-level summary is exactly how wrong semantics enter the glossary. Phase 2.45 re-checks these entries, but the cheap fix is to not write the error.

**Seed the learning's area at creation — don't write a lone term.** When `CONCEPTS.md` does not yet exist, alongside the surfaced term also seed the core domain nouns of the area this learning touched, following the **Seed goal** and **Scope of a seed** rules in `references/concepts-vocabulary.md`. The seed is scoped to the learning's area (the modules and domain the fix touched) and defines only terms investigated here — it does not reach for repo-wide nouns. This anchors the surfaced term so it does not dangle against undefined siblings. A repo-wide concept map is `spec-compound-refresh`'s bootstrap path, not this one.

**At creation, hold the qualifying bar conservatively for borderline terms.** A borderline term, or a class/table/file name dressed up as an entity, defers to a later run — clear core nouns are seeded, borderline ones wait. The conservatism is about quality, not count; updates to an existing file follow the normal criteria.

**When bootstrapping the file, start with this preamble under the `# Concepts` heading**, then add the qualifying entries below it:

> Shared domain vocabulary for this project — entities, named processes, and status concepts with project-specific meaning. Seeded with core domain vocabulary, then accretes as spec-compound and spec-compound-refresh process learnings; direct edits are fine. Glossary only, not a spec or catch-all.

**Refresh the coherence neighborhood of any entry you touch.** When adding or editing an entry, also inspect its *coherence neighborhood* — its cluster siblings and the terms it cross-references or that reference it. Within that neighborhood, do two things: fix glossary violations (implementation specifics — file paths, class names, function signatures, current-config values), and refresh entries the learning's own evidence shows have drifted. Bounds: neighborhood only, never a full-file audit; refresh only on evidence already in hand; if judging a neighbor would require investigation this learning did not do, flag it for `spec-compound-refresh` rather than editing on a guess. The test: after the edit, would a reader find the touched entry's siblings or referenced terms inconsistent with it? Broader audit is `spec-compound-refresh`'s job.

If no terms qualified after applying the reference's criteria, record that outcome explicitly in the success output (e.g., "Vocabulary capture: scanned, no qualifying terms"). Do not silently skip — the visible scan-and-no-result record is the audit signal that the reference was consulted.

**Prepare the vocabulary candidate silently in every mode — no user prompt in interactive, lightweight, or headless.** Vocabulary capture is a declared side effect of compounding, not a separate decision per run; the durable write still waits for the shared promotion decision and target-hash recheck. Lightweight mode reaches this through its own single-pass step (see Lightweight Mode), and runs an **update-only** version — it refines an existing `CONCEPTS.md` but defers creation/seeding to a Full run.

### Phase 2.45: Grounding Validation

The candidate (and any `CONCEPTS.md` candidate entries from Phase 2.4) may become permanent, trusted knowledge. Validate its claims against the tree before it compounds. **Read `references/grounding-validation.md` now** — it holds the adjudication rules and the validator prompt; the steps below are only the trigger.

1. **Mechanical claims check (every mode, including headless).** Do not run `git fetch` unless the current user or visible upstream handoff separately authorized network access and remote-ref mutation; otherwise use existing local refs and mark remote merge-state claims degraded when they cannot be confirmed. Then run the bundled validator against the candidate:

   ```bash
   SKILL_DIR="<absolute path of the directory containing the SKILL.md you just read>"
   bash "$SKILL_DIR/scripts/run-python.sh" "$SKILL_DIR/scripts/validate-doc-claims.py" <candidate-path>
   ```

   Exit 0 means nothing flagged. Exit 1 means flags to **adjudicate, not auto-fix** — each flagged path, SHA, link, or scaffold pattern is fixed, annotated as historical, or confirmed intentional per the reference's adjudication table. A doc may legitimately cite a path deleted by the very fix it documents; a flag is a question, not a failure. If the script cannot be resolved on this platform, apply the reference's manual checklist and say so in the output — never silently skip.

2. **Semantic grounding validator (Full and headless; lightweight skips this separate pass).** When the Dispatch Authorization Boundary is satisfied, dispatch one read-only generic subagent built from the prompt template in the reference, covering the learning candidate plus any `CONCEPTS.md` candidate entries added or edited this run. Otherwise apply that validator prompt inline, record the matching fallback reason, and do not claim independent semantic validation. In either path, verify code-behavior claims by quoting the defining source line, merge-state claims against remote truth (`gh` primary, git reachability fallback), and internal completeness of countable assertions. Apply verdicts per the reference, then re-run the mechanical check if the body changed.
