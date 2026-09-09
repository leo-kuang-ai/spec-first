# Lightweight Mode

Before preparing candidates, read the private-scratch setup in `references/research.md`, candidate validation in `references/assembly.md`, and the shared publication rules in `references/promotion.md`. Read only those named sections; this does not activate Full research, session history, enhancement, or independent validation.

### Lightweight Mode

<critical_requirement>
**Single-pass alternative — same documentation, fewer tokens.**

This mode skips parallel subagents entirely. The orchestrator performs all work in a single pass, producing the same solution document without cross-referencing or duplicate detection.

Headless mode forces Full and does not enter Lightweight — automations get the cross-reference and overlap detection benefits without the interactive overhead.

Lightweight is valid only when the mode-selection eligibility above is satisfied. Security/authorization, data-integrity, migration/release, privacy/compliance, or irreversible-mutation learnings never enter Lightweight merely because context is tight.
</critical_requirement>

The orchestrator (main conversation) performs ALL of the following in one sequential pass:

1. **Extract from conversation**: Identify the problem and solution from conversation history. Also scan the "user's auto-memory" block injected into your system prompt, if present (Claude Code only) -- use any relevant notes as supplementary context alongside conversation history. Tag any memory-sourced content incorporated into the final doc with "(auto memory [claude])". Before asserting how code behaves (enum values, status semantics, limits, defaults), Read the defining line at the current tree — soften or attribute any claim you cannot verify. Cite PR numbers over bare commit SHAs, and phrase unmerged fixes as pending
2. **Classify**: Read `references/schema.yaml` and `references/yaml-schema.md`, then determine track (bug vs knowledge), category, and filename
3. **Prepare minimal candidate**: create and verify an owner-private scratch directory using the Full-mode scratch rules, then assemble `<private-scratch-dir>/learning-candidate.md` using the appropriate track template from `assets/resolution-template.md`. Record the intended final path and its current existence/SHA-256, but do not create or modify that path yet. Include:
   - YAML frontmatter with track-appropriate fields, a grounded non-empty `source_refs` array, and a concrete non-empty `invalidation_condition`, applying the YAML-safety quoting rule for array items (see `references/yaml-schema.md` > YAML Safety Rules)
   - Bug track: Problem, root cause, solution with key code snippets, one prevention tip
   - Knowledge track: Context, guidance with key examples, one applicability note
4. **Vocabulary candidate (update-only)**: if `CONCEPTS.md` exists at repo root, read `references/concepts-vocabulary.md`, then scan the learning candidate and the conversation for qualifying terms and prepare any refinement as `<private-scratch-dir>/concepts-candidate.md` (same criteria as Phase 2.4). Record the original SHA-256 and leave the final file untouched. Do **not** bootstrap or seed in lightweight mode — if `CONCEPTS.md` does not exist, defer creation to a Full run, which owns seeding. Record the outcome in the output (e.g., "Vocabulary: 1 entry refined" or "scanned, no qualifying terms"). If you prepared a refinement and a quick read of `AGENTS.md`/`CLAUDE.md` shows `CONCEPTS.md` is not surfaced there, add the discoverability tip to the output below — lightweight **tips**, it does not edit instruction files (a Full run owns that edit).
5. **Mechanical promotion gate**: run the same mechanical promotion validation as Phase 2 step 6 against the learning candidate. If the script is unavailable, apply that step's four-item manual checklist; do not silently skip or declare completion with either field absent:
   ```bash
   if [ -n "${SKILL_DIR:-}" ] && [ -f "$SKILL_DIR/scripts/validate-frontmatter.py" ]; then
     bash "$SKILL_DIR/scripts/run-python.sh" "$SKILL_DIR/scripts/validate-frontmatter.py" --promotion <candidate-path>
   else
     echo "Bundled validate-frontmatter.py not resolvable on this platform; applying the parser-safety and promotion checklist manually."
   fi
   ```
6. **Mechanical claims check**: run `scripts/validate-doc-claims.py` against the candidate exactly as in Phase 2.45 step 1 (same `SKILL_DIR` anchor, same adjudicate-not-auto-fix rule — read `references/grounding-validation.md` for the adjudication table when it flags anything).
7. **Semantic promotion decision and publication**: apply Phase 2.47 inline. Reconfirm that the learning remains low-risk, resolved, source-grounded, and backed by verification evidence; judge source relevance and invalidation adequacy rather than treating mechanical validation as semantic approval. Only a `promote` decision may publish the candidate through the per-target atomic boundary. Any failed check, target drift, or unresolved contradiction leaves final paths unchanged and emits `Documentation skipped`.
8. **Skip optional candidate enhancement** (Phase 2.46) and the separate semantic grounding validator (Phase 2.45 step 2) to conserve context. This does not skip the orchestrator's semantic promotion decision.

**Lightweight output:**
```
✓ Documentation complete (lightweight mode)

File created:
- docs/solutions/[category]/[filename].md

[If discoverability check found instruction files don't surface the knowledge store:]
Tip: Your AGENTS.md/CLAUDE.md doesn't surface docs/solutions/ to agents —
a brief mention helps all agents discover these learnings.

[If CONCEPTS.md was refined this run and isn't surfaced in the instruction files:]
Tip: Your AGENTS.md/CLAUDE.md doesn't surface CONCEPTS.md —
a one-line mention helps agents find the shared vocabulary.

Note: This was created in lightweight mode. For richer documentation
(cross-references, detailed prevention strategies, specialized reviews,
semantic grounding validation), re-run spec-compound in a fresh session.
```

**No subagents are launched. No parallel tasks. The solution doc is the one deliverable** (Phase 2.4's update-only vocabulary capture may also refine an existing `CONCEPTS.md`).

In lightweight mode, the overlap check is skipped (no Related Docs Finder subagent). This means lightweight mode may create a doc that overlaps with an existing one. That is acceptable — `spec-compound-refresh` will catch it later. Only suggest `spec-compound-refresh` if there is an obvious narrow refresh target. Do not broaden into a large refresh sweep from a lightweight session.

---
