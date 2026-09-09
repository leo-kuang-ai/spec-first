# Classifying refresh outcomes and decisions

## Phase 2: Classify the Right Maintenance Action

After gathering evidence, assign one recommended action.

### Keep

The learning is still accurate and useful. Do not edit the file — report that it was reviewed and remains trustworthy. Only add `last_refreshed` if you are already making a meaningful update for another reason.

### Update

The core solution is still valid but references have drifted (paths, class names, links, code snippets, metadata). Apply the fixes directly.

### Consolidate

Choose **Consolidate** when Phase 1.75 identified docs that overlap heavily but are both materially correct. This is different from Update (which fixes drift in a single doc) and Replace (which rewrites misleading guidance). Consolidate handles the "both right, one subsumes the other" case.

**When to consolidate:**

- Two docs describe the same problem and recommend the same (or compatible) solution
- One doc is a narrow precursor and a newer doc covers the same ground more broadly
- The unique content from the subsumed doc can fit as a section or addendum in the canonical doc
- Keeping both creates drift risk without meaningful retrieval benefit

**When NOT to consolidate** (apply the Retrieval-Value Test from Phase 1.75):

- The docs cover genuinely different sub-problems that someone would search for independently
- Merging would create an unwieldy doc that harms navigation more than drift risk harms accuracy

**Consolidate vs Delete:** If the subsumed doc has unique content worth preserving (edge cases, alternative approaches, extra prevention rules), use Consolidate to merge that content first. If the subsumed doc adds nothing the canonical doc doesn't already say, skip straight to Delete.

The Consolidate action is: merge unique content from the subsumed doc into the canonical doc, then delete the subsumed doc. Not archive — delete. Git history preserves it.

### Replace

Choose **Replace** when the learning's core guidance is now misleading — the recommended fix changed materially, the root cause or architecture shifted, or the preferred pattern is different.

The user may have invoked the refresh months after the original learning was written. Do not ask them for replacement context they are unlikely to have — use agent intelligence to investigate the codebase and synthesize the replacement.

**Evidence assessment:**

By the time you identify a Replace candidate, Phase 1 investigation has already gathered significant evidence: the old learning's claims, what the current code actually does, and where the drift occurred. Assess whether this evidence is sufficient to write a trustworthy replacement:

- **Sufficient evidence** — you understand both what the old learning recommended AND what the current approach is. The investigation found the current code patterns, the new file locations, the changed architecture. → Proceed to write the replacement (see Phase 4 Replace Flow).
- **Insufficient evidence** — the drift is so fundamental that you cannot confidently document the current approach. The entire subsystem was replaced, or the new architecture is too complex to understand from a file scan alone. → Mark as stale in place:
   - Add `status: stale`, `stale_reason: [what you found]`, `stale_date: YYYY-MM-DD` to the frontmatter
   - Report what evidence you found and what is missing
   - Recommend the user run `spec-compound` after their next encounter with that area, when they have fresh problem-solving context

### Delete

Choose **Delete** when:

- The code or workflow no longer exists and the problem domain is gone
- The learning is obsolete and has no modern replacement worth documenting
- The learning is fully redundant with another doc (use Consolidate if there is unique content to merge first)
- There is no meaningful successor evidence suggesting it should be replaced instead

Action: delete the file. No archival directory, no metadata — just delete it. Git history preserves every deleted file if recovery is ever needed.

### Before deleting: check if the problem domain is still active

When a learning's referenced files are gone, that is strong evidence — but only that the **implementation** is gone. Before deleting, reason about whether the **problem the learning solves** is still a concern in the codebase:

- A learning about session token storage where `auth_token.rb` is gone — does the application still handle session tokens? If so, the concept persists under a new implementation. That is Replace, not Delete.
- A learning about a deprecated API endpoint where the entire feature was removed — the problem domain is gone. That is Delete.

Do not search mechanically for keywords from the old learning. Instead, understand what problem the learning addresses, then investigate whether that problem domain still exists in the codebase. The agent understands concepts — use that understanding to look for where the problem lives now, not where the old code used to be.

### Before deleting: check for inbound links

A doc that other files cite is load-bearing in a way the doc itself does not announce. Before classifying as Delete, search the repo's markdown content (other docs, plans, instruction files, READMEs) for citations of the file — not source code, where citations are rare and only appear in comments. The filename slug is usually unique enough that one query covers all citation sites.

Search efficiently:

- Prefer the platform's native content-search tool (e.g., Grep in Claude Code) over shell. Drop to shell when materially better for the case.
- Search the filename slug (without `.md`); narrow to the full path only if matches are noisy.
- Read context lines around each match (e.g., Grep's `-B`/`-A`), not whole files.

**Inbound links inform the classification, not the cleanup.** Removing a citation is always mechanical (drop the parenthetical, the bare entry, or the deferring clause). The judgment is upstream: given these citations, is Delete still right, or is Replace closer to right?

Classify each citation by what it does in its citing context:

- **Decorative** — principle stated inline, citation is a "see also" pointer or bare attribution. Delete is fine; clean up citations in the same refresh change set.
- **Substantive** — citing doc relies on the cited doc to provide content not stated inline (e.g., "see X for details on Y" with no inline Y). Signal Replace — write a successor at the same path, or **Keep with narrowed scope** if the doc's actual content is broader than its title implies.
- **Mixed or unclear** — stale-mark.

In headless mode, Delete + decorative cleanup is fine. Any substantive citation, or any genuine ambiguity, downgrades to stale-marking — writing a Replace successor is judgment-heavy and should not happen unattended.

**Auto-delete only when all three hold:**

- The implementation is gone (or fully superseded by a clearly better successor, or the doc is plainly redundant).
- The problem domain is gone — the app no longer deals with what the learning addresses.
- Inbound links are absent or unambiguously decorative.

If any condition fails, classify as Replace, Update, Consolidate, or stale-mark per the rules above. Do not delete a learning whose problem domain is still active or whose principles are cited substantively — fill the gap with a replacement instead.

## Pattern Guidance

Apply the same five outcomes (Keep, Update, Consolidate, Replace, Delete) to pattern docs, but evaluate them as **derived guidance** rather than incident-level learnings. Key differences:

- **Keep**: the underlying learnings still support the generalized rule and examples remain representative
- **Update**: the rule holds but examples, links, scope, or supporting references drifted
- **Consolidate**: two pattern docs generalize the same set of learnings or cover the same design concern — merge into one canonical pattern
- **Replace**: the generalized rule is now misleading, or the underlying learnings support a different synthesis. Base the replacement on the refreshed learning set — do not invent new rules from guesswork
- **Delete**: the pattern is no longer valid, no longer recurring, or fully subsumed by a stronger pattern doc with no unique content remaining

## Phase 3: Ask for Decisions

### Headless mode

**Skip this entire phase. Do not ask any questions. Do not present options. Do not wait for input.** Proceed directly to Phase 4 and execute all actions based on the classifications from Phase 2:

- Unambiguous Keep, Update, Consolidate, auto-Delete, and Replace (with sufficient evidence) → execute directly
- Ambiguous cases → mark as stale
- Then generate the report (see Output Format)

### Interactive mode

Most Updates and Consolidations should be applied directly without asking. Only ask the user when:

- The right action is genuinely ambiguous (Update vs Replace vs Consolidate vs Delete)
- You are about to Delete a document **and** the evidence is not unambiguous (see auto-delete criteria in Phase 2). When auto-delete criteria are met, proceed without asking.
- You are about to Consolidate and the choice of canonical doc is not clear-cut
- You are about to create a successor via Replace

Do **not** ask questions about whether code changes were intentional, whether the user wants to fix bugs in the code, or other concerns outside doc maintenance. Stay in your lane — doc accuracy.

#### Question Style

Always present choices using the platform's blocking question tool: `AskUserQuestion` in Claude Code (call `ToolSearch` with `select:AskUserQuestion` first if its schema isn't loaded), `request_user_input` in Codex. Fall back to numbered options in plain text only when no blocking tool exists in the harness or the call errors (e.g., Codex edit modes) — not because a schema load is required. Never silently skip the question.

Question rules:

- Ask **one question at a time**
- Prefer **multiple choice**
- Lead with the **recommended option**
- Explain the rationale for the recommendation in one concise sentence
- Avoid asking the user to choose from actions that are not actually plausible

#### Focused Scope

For a single artifact, present:

- file path
- 2-4 bullets of evidence
- recommended action

Then ask:

```text
This [learning/pattern] looks like a [Keep/Update/Consolidate/Replace/Delete].

Why: [one-sentence rationale based on the evidence]

What would you like to do?

1. [Recommended action]
2. [Second plausible action]
3. Skip for now
```

Do not list all five actions unless all five are genuinely plausible.

#### Batch Scope

For several learnings:

1. Group obvious **Keep** cases together
2. Group obvious **Update** cases together when the fixes are straightforward
3. Present **Consolidate** cases together when the canonical doc is clear
4. Present **Replace** cases individually or in very small groups
5. Present **Delete** cases individually unless they are strong auto-delete candidates

Ask for confirmation in stages:

1. Confirm grouped Keep/Update recommendations
2. Then handle Consolidate groups (present the canonical doc and what gets merged)
3. Then handle Replace one at a time
4. Then handle Delete one at a time unless the deletion is unambiguous and safe to auto-apply

#### Broad Scope

If the user asked for a sweeping refresh, keep the interaction incremental:

1. Narrow scope first
2. Investigate a manageable batch
3. Present recommendations
4. Ask whether to continue to the next batch

Do not front-load the user with a full maintenance queue.
