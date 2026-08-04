# R29/R30 Multi-Round Suppression and Fix-Landed Verification

This is a **cold-path reference** for the synthesis pipeline. Load only in round 2+ (decision primer is non-empty).

---

## R29 Rejected-Finding Suppression (Round 2+)

When the orchestrator is running round 2+ on the same document in the same session, the decision primer carries forward every prior-round Skipped, Deferred, and Acknowledged finding. Synthesis suppresses re-raised rejected findings rather than re-surfacing them to the user. Acknowledged is treated as a rejected-class decision here: the user saw the finding, chose not to act on it — equivalent to Skip for suppression purposes.

For each current-round finding, compare against the primer's rejected list:

- **Matching predicate:** `normalize(section) + normalize(title)` fingerprint augmented with evidence-substring overlap check (>50%). If a current-round finding matches a prior-round rejected finding on fingerprint AND evidence overlap, drop the current-round finding.
- **Materially-different exception:** if the current document state has changed around the finding's section since the prior round (e.g., the section was edited and the evidence quote no longer appears in the current text), treat the finding as new.
- **On suppression:** record the drop in Coverage with a "previously rejected, re-raised this round" note.

This rule runs at synthesis time, not at the persona level. Personas have a soft instruction via the subagent template's `{decision_primer}` variable to avoid re-raising rejected findings, but the orchestrator is the authoritative gate.

## R30 Fix-Landed Matching Predicate

When the orchestrator is running round 2+ on the same document, synthesis verifies that prior-round Applied findings actually landed. For each current-round finding whose `normalize(section) + normalize(title)` fingerprint matches a prior-round Applied finding (same fingerprint as 3.3 dedup), branch by evidence overlap:

- **Strong match — evidence overlap >50% with the prior-round evidence: fix-landed regression.** The current-round finding is quoting the same problematic text the prior-round fix was supposed to remove. Flag as "fix did not land" in the report rather than surfacing as a new finding. Include the prior-round finding's title and the current-round persona's evidence.

- **Weak match — evidence overlap ≤50%: not a fix-landed regression.** Low evidence overlap means the prior problematic text is no longer being quoted. Do not suppress solely on fingerprint match. If the current-round item is explicitly a non-actionable verification observation (title or `why_it_matters` says the prior finding landed correctly and asks for no change), suppress it and record `Verified: round-{N} '{title}' landed correctly` in Coverage. Otherwise, treat the finding as new.

  **Materially-different exception.** If the current-round finding's `why_it_matters` describes a substantively different concern than the prior-round finding — even though the section/title fingerprint matches — treat it as a new finding.

- **Section renames count as different locations.** If the section name has changed between rounds, treat the new section as a different location and the current-round finding as new — neither branch fires.

- **No fingerprint match:** not a verification candidate; the finding flows through normally to 3.3 dedup and onward routing.
