# 3.5c Premise-Dependency Chain Linking

This is a **cold-path reference** for the synthesis pipeline. Load only when, after 3.5b, any P0 or P1 manual finding has a framing-level section AND a premise-challenge signal in its title or `why_it_matters`.

---

Document reviews often produce fanout: a single premise challenge ("is this work justified?") generates downstream findings that all evaporate if the premise is rejected. Surfacing each as an independent decision forces the user to re-litigate the same root question N times. This step links dependent findings to their root so presentation can group them and the walk-through can cascade a single root decision across the chain.

Run this step after 3.5b (recommended_action normalized) and before 3.6 (auto-promotion), operating on the merged finding set.

## Step 1: Identify Roots

A finding is a candidate root when ALL of the following hold:

- Severity is `P0` or `P1` (premise-level issues carry high priority by nature)
- `autofix_class` is `manual` (the root itself requires judgment)
- `why_it_matters` or `title` contains a premise-challenge signal. **Match by shape (substring/contains), not exact string.** Signal shapes to recognize (and their common variants):
  - `premise unsupported` / `premise is unsupported`
  - `justification missing` / `justification is missing` / `no justification`
  - `do-nothing baseline not evaluated` / `do-nothing baseline` / `baseline not evaluated`
  - `is X justified` / `is the X justified` / `justification for X`
  - `unsupported by evidence` / `not supported by evidence` / `lacks evidence`
  - `is the proposed solution the right approach` / `is this the right approach` / `right approach`
  - **OR** the finding explicitly questions whether a named component should exist ("does X need to exist", "should X be built", "is X necessary", "questioning whether X should exist")
- The finding's `section` is framing-level (Problem Frame, Summary, Overview, Why, Motivation, Goals, Background, Context, Rationale) OR the finding explicitly questions whether a named component should exist

If multiple candidates match, elevate ALL of them. The criteria above (P0/P1, manual, framing-level section, premise-challenge signal) are restrictive enough that this list will be short for any well-formed document.

**Peer vs nested test.** Two candidate roots are peers when accepting root A's proposed fix would not resolve root B's concern (and vice versa). They are nested when one root's fix would moot the other — in which case the subsumed candidate becomes a dependent of the surviving root, not a peer root. Apply the test symmetrically: check both directions before deciding.

**Surviving-root selection under asymmetric subsumption.** When nested, the surviving root is the one whose fix moots the other — **not** the one with higher confidence. Confidence determines strength, not scope.

**Sanity diagnostic.** If more than 3 candidates match, reconsider whether the criteria are being applied correctly. Do not silently drop candidates; either confirm each one independently meets the criteria (and surface them all), or tighten the application of the criteria.

If none match, skip the rest of this step — no chains exist.

## Step 2: Identify Dependents

For each candidate root, scan the remaining findings for dependents. The predicate must match the cascade trigger in `references/walkthrough.md` — dependents cascade when the user rejects (Skip/Defer) the root:

- The root challenges a foundational premise about a named component (questioning whether it should exist, whether the proposed approach is correct, or whether the work is justified)
- The candidate's `suggested_fix` modifies, adds detail to, or constrains that same component
- The candidate's concern would dissolve if the root's premise is rejected

Test with the substitution check: "If the user rejects the root (Skip/Defer), does the dependent's finding still describe an actionable concern the user would want to engage with this round?" If no — the dependent's premise dissolves alongside the root's — it is a dependent. If yes, it is not.

## Step 3: Independence Safeguard

Even when a finding's target component is addressed by the root, do NOT link if:

- The dependent identifies a problem that would exist regardless of the root's resolution (operational obligations — rollback plans, error handling, test coverage)
- The dependent's `why_it_matters` cites evidence (codebase fact, framework convention, production data) that stands on its own
- The dependent is `safe_auto` — it has one clear correct fix and should apply regardless

When uncertain, default to NOT linking.

## Step 4: Annotate

On each dependent, record `depends_on: <root_finding_id>` (use section + normalized title as the id). On each root, record `dependents: [<dependent_ids>]`. Cap `dependents` at 6 entries per root — if more than 6 candidates link, keep the top 6 by severity, then confidence anchor (descending), then document order; leave the rest unlinked.

Do NOT reclassify, re-route, or change the confidence anchor of any finding in this step. Linking is purely annotative.

## Step 5: Report in Coverage

Add a line to the coverage summary: `Chains: N root(s) with M total dependents`. When N = 0, omit the line.

**Count invariant.** `M` is the number of findings with `depends_on` set after Step 4 completes — the final linked count. If a finding appears in a root's `dependents` array, it MUST appear nested under that root in the presentation and MUST NOT appear at its own severity position.

## Worked Examples

### Example A (rename-shape)

Review of a refactor plan surfaces 11 findings. One is P0 manual "Rename premise unsupported by user-facing evidence" in Problem Frame — a candidate root. Scanning the other 10:

- P1 manual "Alias mechanism unjustified scope" — root proposes scoping down; dependent's fix proposes dropping alias infrastructure. Linked.
- P2 manual "AliasedCommand abstraction overkill" — abstraction dissolves if alias dropped. Linked.
- P2 manual "Rename forecloses dual-mode future" — concern only exists if rename proceeds. Linked.
- P2 manual "Identity drift: command vs artifact names" — naming asymmetry only exists if rename proceeds. Linked.
- P1 manual "Migration lacks rollback strategy" — migration needs rollback regardless of scope. NOT linked (independence safeguard).
- P0 gated_auto "Deployment-ordering between migration and code" — concrete fix user confirms regardless. NOT linked (safeguard: gated_auto).

Result: 1 root + 4 dependents.

### Example B (auth-shape)

Review of a plan to introduce a new session-management middleware. One finding is P1 manual "Middleware rewrite premise unsupported" in Problem Frame. Scanning:

- P2 manual "Middleware abstraction boundary unclear vs existing request context" — the boundary only matters if the middleware is built. Linked.
- P2 manual "Rollout strategy for new session store not specified" — rollout only matters if the new store ships. Linked.
- P1 gated_auto "CSRF token regeneration missing on session rotation" — real security gap, independent of whether the middleware is the right approach. NOT linked.
- P2 manual "Existing session timeout behavior not captured in tests" — pre-existing test coverage gap. NOT linked (independence safeguard).

Result: 1 root + 2 dependents.
