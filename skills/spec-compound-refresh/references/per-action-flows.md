# Per-Action Flows

Read this reference when executing Phase 4. Find the section matching the action classified in Phase 2 and confirmed in Phase 3 (Keep, Update, Consolidate, Replace, or Delete) and follow that flow.

## Keep Flow

No file edit by default. Summarize why the learning remains trustworthy.

## Update Flow

Apply in-place edits only when the solution is still substantively correct.

Examples of valid in-place updates:

- Rename `app/models/auth_token.rb` reference to `app/models/session_token.rb`
- Update `module: AuthToken` to `module: SessionToken`
- Fix outdated links to related docs
- Refresh implementation notes after a directory move

Examples that should **not** be in-place updates:

- Fixing a typo with no effect on understanding
- Rewording prose for style alone
- Small cleanup that does not materially improve accuracy or usability
- The old fix is now an anti-pattern
- The system architecture changed enough that the old guidance is misleading
- The troubleshooting path is materially different

Those cases require **Replace**, not Update.

## Consolidate Flow

The orchestrator handles consolidation directly (no subagent needed — the docs are already read and the merge is a focused edit). Process Consolidate candidates by topic cluster. For each cluster identified in Phase 1.75:

1. **Confirm the canonical doc** — the broader, more current, more accurate doc in the cluster.
2. **Extract unique content** from the subsumed doc(s) — anything the canonical doc does not already cover. This might be specific edge cases, additional prevention rules, or alternative debugging approaches.
3. **Merge unique content** into the canonical doc in a natural location. Do not just append — integrate it where it logically belongs. If the unique content is small (a bullet point, a sentence), inline it. If it is a substantial sub-topic, add it as a clearly labeled section.
4. **Run the promotion gate on the canonical doc** — preserve or add grounded non-empty `source_refs` and a concrete non-empty `invalidation_condition`, then run:

   ```bash
   SKILL_DIR="<absolute path of the directory containing the spec-compound-refresh SKILL.md you read>"
   bash "$SKILL_DIR/scripts/run-python.sh" "$SKILL_DIR/scripts/validate-frontmatter.py" --promotion <canonical-learning-path>
   ```

   Exit 1 blocks the consolidation exit until the canonical learning is repaired and the command passes. If the validator is unavailable, apply the four-item manual promotion checklist in Replace step 3 and state `validator unavailable: <reason>`; do not silently downgrade to the old parser-safety-only checklist. The orchestrator still judges provenance credibility and invalidation adequacy.
5. **Run the mechanical claims check** on the canonical doc (step 4 of the Replace flow below) — merged content brings its citations with it, and consolidation is where cross-references most often dangle.
6. **Update cross-references** — if any other docs reference the subsumed doc, update those references to point to the canonical doc.
7. **Delete the subsumed doc only after steps 4-6 pass.** Do not archive it, do not add redirect metadata — just delete the file. Git history preserves it.

If a doc cluster has 3+ overlapping docs, process pairwise: consolidate the two most overlapping docs first, then evaluate whether the merged result should be consolidated with the next doc.

**Structural edits beyond merge:** Consolidate also covers the reverse case. If one doc has grown unwieldy and covers multiple distinct problems that would benefit from separate retrieval, it is valid to recommend splitting it. Only do this when the sub-topics are genuinely independent and a maintainer might search for one without needing the other. Every newly written split learning must use `references/schema.yaml` / `assets/resolution-template.md` and pass `--promotion`; validate all successors before deleting or truncating the original.

## Replace Flow

Process Replace candidates **one at a time, sequentially**. An authorized subagent may draft a replacement to protect the main context window; otherwise the orchestrator drafts it inline. The orchestrator is always the sole writer of the tracked successor.

When a replacement is needed, read the documentation contract files and use their contents in the replacement subagent's task prompt or the inline fallback:

- `references/schema.yaml` — frontmatter fields, enum values, and promotion exit fields
- `references/yaml-schema.md` — category mapping, YAML safety, and promotion semantics
- `assets/resolution-template.md` — section structure

Do not let replacement subagents or inline fallback invent frontmatter fields, enum values, or section order from memory.

**When evidence is sufficient:**

1. When dispatch is authorized and capable, spawn a single subagent to draft the replacement learning; otherwise compose the same draft inline. Provide:
   - The old learning's full content
   - A summary of the investigation evidence (what changed, what the current code does, why the old guidance is misleading)
   - The target path and category (same category as the old learning unless the category itself changed)
   - The relevant contents of the three support files listed above
2. The subagent returns draft content or a run-local scratch reference; it must not write the tracked successor, stage, commit, or delete. Inline fallback produces the same draft. The orchestrator writes the new tracked learning using the support files as the source of truth: `references/schema.yaml` for frontmatter fields, enum values, and promotion exit fields; `references/yaml-schema.md` for category mapping, YAML-safety rules, and semantic guidance; and `assets/resolution-template.md` for section order. Every successor must carry grounded non-empty `source_refs` and a concrete non-empty `invalidation_condition`.
3. **Validate parser-safety and the promotion exit contract of the successor frontmatter.** Promotion mode catches malformed `---` delimiter lines, unquoted ` #` in scalar values (silent comment truncation), unquoted `: ` in scalar values (silent mapping confusion), and mechanically requires non-empty top-level `source_refs` plus `invalidation_condition`. Resolve the bundled validator through the loaded skill directory, not a project-relative `skills/` path:

   ```bash
   SKILL_DIR="<absolute path of the directory containing the spec-compound-refresh SKILL.md you read>"
   bash "$SKILL_DIR/scripts/run-python.sh" "$SKILL_DIR/scripts/validate-frontmatter.py" --promotion <new-learning-path>
   ```

   Exit 0 means the mechanical promotion gate passed; exit 1 means stderr names the offending field(s) — repair the frontmatter and re-run until exit 0. Do not declare success while validation fails. Default validator mode remains parser-safety-only for legacy compatibility; `--promotion` adds only the two promotion field shapes and does not judge reference credibility or invalidation adequacy. It does not flag YAML reserved-indicator characters (those produce loud parser errors downstream rather than silent corruption — out of scope). Uses Python 3 stdlib only (no PyYAML or other deps).

   If `run-python.sh` cannot resolve a runnable Python 3 interpreter or the script cannot be located from the skill runtime directory, do not silently skip: state `validator unavailable: <reason>` and manually verify exactly this mechanical scope before deleting the old learning:
   - the frontmatter opens and closes with exact `---` lines;
   - no unquoted top-level scalar value contains ` #` or `: `;
   - `source_refs` appears exactly once as a top-level non-empty block or flow array whose items are non-empty strings; plain tokens that common YAML parsers type as null, boolean, number, sexagesimal, date, or timestamp do not count as strings and must be quoted;
   - `invalidation_condition` appears exactly once as a top-level non-empty scalar or block string, with the same implicit-type quoting rule for plain scalar values.

   The orchestrator still judges whether the references are trustworthy and whether the invalidation condition is semantically sufficient. Do not delete the old learning until either the script passes or the complete manual gate is satisfied.
4. **Run the mechanical claims check on the successor doc.** The bundled `scripts/validate-doc-claims.py` flags cited repo paths missing from the tree, commit SHAs that do not resolve or are unreachable, relative doc links that do not resolve, and dangling drafting scaffold ("Learning 3", unresolved `{{...}}` tokens):

   ```bash
   SKILL_DIR="<absolute path of the directory containing the SKILL.md you just read>"
   bash "$SKILL_DIR/scripts/run-python.sh" "$SKILL_DIR/scripts/validate-doc-claims.py" <new-learning-path>
   ```

   Exit 1 flags are **adjudication input, not failures** — a successor doc describing removed code legitimately cites paths that no longer exist. Resolve each flag by fixing the citation, annotating it as historical, or confirming it intentional; always fix scaffold flags. If the script is not resolvable on this platform, scan the body for those same patterns manually and say so in the report.
5. After the draft is integrated and validations complete, the orchestrator deletes the old learning file. The new learning's frontmatter may include `supersedes: [old learning filename]` for traceability, but this is optional — git history provides the same information when a later authorized commit is created.

**When evidence is insufficient:**

1. Mark the learning as stale in place:
   - Add to frontmatter: `status: stale`, `stale_reason: [what you found]`, `stale_date: YYYY-MM-DD`
2. Report what evidence was found and what is missing
3. Recommend the user run `spec-compound` after their next encounter with that area

## Delete Flow

Delete only when a learning is clearly obsolete, redundant (with no unique content to merge), or its problem domain is gone. Do not delete a document just because it is old — age alone is not a signal.

Before unlinking the file, run a final inbound-link check across the repo's markdown content to catch any references missed during Phase 1 investigation. Prefer the platform's native content-search tool (e.g., Grep in Claude Code) for efficiency; use ranged or context-line reads around matches rather than loading whole files.

Each match is a citation that will dangle after delete. Cleanup is mechanical — Phase 2 already classified the citations and confirmed Delete was right. Don't re-litigate.

If any citation surfaces here that wasn't seen in Phase 1 and is anything other than unambiguously decorative (substantive or mixed/unclear), stop and reclassify: headless mode stale-marks; interactive mode asks the user whether Replace fits. Only proceed with cleanup when all late-discovered citations are unambiguously decorative.
