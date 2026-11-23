# Refresh report

## Output Format

Deliver a full Markdown report by default. If the caller explicitly requests JSON only, use the requested fields and the same evidence standard. Lead with what readers can still rely on, which guidance or references changed, and whether this run actually edited any files. Complete the discoverability check first. Never present an unpublished candidate as current guidance.

Count an action under `Updated`, `Consolidated`, `Replaced`, `Deleted`, or `Marked stale` only if it completed this run and was verified at its final paths. List the effects of partial publication by path without counting the group as complete. `Kept` counts files reviewed without edits, not publications.

```text
Compound Refresh Summary
========================
Scanned: N learnings
Worth lens: off | audit-only | authorized | recommended-only

Kept: X
Updated: Y
Consolidated: C
Replaced: Z
Deleted: W
Skipped: V
Marked stale: S

CONCEPTS.md: <scanned, no qualifying terms | created with N entries (M seeded) | updated — N added, N refined, N folded, N scrubbed, N retired | repo-wide map created with N entries | changes recommended, not published | partial publication>
```

Then for EVERY file processed, list:
- The file path
- The classification (Keep/Update/Consolidate/Replace/Delete/Stale)
- What evidence was found -- tag any memory-sourced findings with "(auto memory [claude])" to distinguish them from codebase-sourced evidence
- What action was taken (or recommended)
- For an Update, show the old and current references or guidance and explain what changes for the reader. For a recommendation, say what *would* change and make clear that the original is still in place. Identify sources and recheck conditions for unique guidance retained in a successor.
- For Consolidate: which doc was canonical, what unique content was merged, what was deleted
- For worth-based actions: affected claims and recovering artifacts with quoted reasoning; distinguish accuracy repairs from worth-based cuts
- For implementation conflicts: the still-governing evidence and conflicting implementation path, reported as a potential regression without claiming a code fix

Applied means verified durable publication, not candidate preparation or a successful scratch write. For partial publication, list exact published/deleted/unchanged/pending paths, verification gaps, and retained recovery material. Keep the dependent action incomplete; do not count it as a completed replacement, consolidation, or split. Identify whether validation used tools or a disclosed manual fallback and whether semantic review was inline or independent.

For **Keep** outcomes, list them under a reviewed-without-edits section so the result is visible without creating git churn.

Example: a read-only check finds `docs/solutions/new.md` published before this run, but `docs/solutions/catalog.md` still points to `docs/solutions/old.md`. Report `status: partial`, no changes or deletions this run, and `Replaced: 0`. Repair and verify the catalog before removing the original. The new file's existence alone does not tell readers to switch.

### Headless mode report

In headless mode, the report is the sole deliverable — there is no user present to ask follow-up questions, so the report must be self-contained and complete. **Print the full report. Do not abbreviate, summarize, or skip sections.**

Split actions into two sections:

**Applied** (published and all dependent checks complete):
- For each **Updated** file: the file path, what references were fixed, and why
- For each **Consolidated** cluster: the canonical doc, what unique content was merged from each subsumed doc, and the subsumed docs that were deleted
- For each **Replaced** file: what the old learning recommended vs what the current code does, and the path to the new successor
- For each **Deleted** file: the file path and why it was removed (problem domain gone, fully redundant, etc.)
- For each **Marked stale** file: the file path, what evidence was found, and why it was ambiguous

**Recommended** (actions that could not be written — e.g., permission denied):
- Same detail as above, but framed as recommendations for a human to apply
- Include enough context that the user can apply the change manually or re-run the skill interactively
- Include worth audit actions without cut authority, all non-interactive worth actions, validation failures, and concurrent target drift even when no write was attempted

Also include recommend-only work even when all attempted writes succeeded:
relocations with the target and failed gate condition, split boundaries,
category-shape observations, named guidance conflicts, discoverability changes,
and unverifiable claims with their verification gaps. A successful write does
not close these recommendations. If no writes succeed (e.g., read-only
invocation), all proposed mutations appear under Recommended and the report
becomes a maintenance plan. Keep partial actions distinct from completed ones.

**Legacy cleanup** (if `docs/solutions/_archived/` exists):
- List archived files found and recommend disposition: restore (if still relevant), delete (if truly obsolete), or consolidate (if overlapping with active docs)
