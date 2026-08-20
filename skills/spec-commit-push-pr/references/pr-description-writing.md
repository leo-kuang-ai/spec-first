# PR Description Writing

How to resolve the right commit range and compose a PR title and body. Loaded on demand by `spec-commit-push-pr` callers — do not load earlier.

Step Pre-A resolves the commit range, diff, and (for existing PRs) the current PR body. Steps A through H assume Pre-A's outputs are in context.

---

## Core principle

The diff is already visible on GitHub. The description exists to explain what the diff cannot show: what was impossible before and is now possible, what was broken and is now fixed, and which shape changed. Cut any sentence a reader could reconstruct from the diff itself.

- Bad: "Adds `branch-creation.md`, modifies `spec-commit-push-pr/SKILL.md`, and updates contract tests."
- Good: "Default-branch shipping now verifies a fresh base before any PR work touches the branch."

If the lead sentence describes what was moved, renamed, or added rather than what is now possible or fixed, rewrite it. This applies to every section, not just the opening. Restating the diff is the default failure mode this reference exists to prevent.

For user-facing bugs, run an extra before/after pass before writing the mechanism: name what the user would have seen before and what they now see instead. Only then mention the technical cause or fix, and only if it helps the reviewer understand risk.

---

## Step Pre-A: Resolve the PR commit range and diff

Determine which commits and diff the description should cover. Run this first; Steps A and beyond assume the commit list and full diff are in context.

### Mode

- **Current-branch mode.** Describe HEAD vs the repo's default base. Used when the caller has no explicit PR reference (Step 6 of spec-commit-push-pr's full workflow; description-only mode without a PR ref).
- **PR mode.** Describe a specific PR's commit range. Used by DU-3 (the existing PR on the current branch) and description-only mode (the user pasted a PR URL/number). The PR ref may be a bare number, `#NN`, `pr:NN`, or a full URL — the caller passes it to `gh pr view <ref>` directly. (`gh pr view` accepts numbers and URLs natively; `#NN` and `pr:NN` need the `#` or `pr:` stripped before passing.)

### Resolve PR metadata (PR mode and current-branch-with-existing-PR)

```bash
gh pr view [<ref>] --json baseRefName,headRefOid,baseRefOid,headRepository,headRepositoryOwner,isCrossRepository,url,body,state
```

If the returned `state` is not `OPEN`, report `"PR <number> is <state>; cannot generate description"` and exit gracefully — do not invent a description.

### Detect the base branch and remote

For PR mode (or current-branch mode with an existing PR), use `baseRefName` from the metadata above. For current-branch mode without an existing PR, resolve in priority order:

1. **Caller-supplied base** (if the caller passed `base:<ref>`) — use verbatim. The ref must resolve locally.
2. **Repo default branch** — `git rev-parse --abbrev-ref origin/HEAD`, strip `origin/` prefix.
3. **GitHub metadata** — `gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name'`.
4. **Common names** — try `main`, `master`, `develop`, `trunk` in order via `git rev-parse --verify origin/<candidate>`.

If none resolve, ask the user to specify the base branch.

For the **base remote**, parse `owner/repo` from the PR URL (or use the repo of the current checkout in current-branch mode without a PR) and match against `git remote -v` fetch URLs (handle both `git@github.com:owner/repo` and `https://github.com/owner/repo` forms; strip `.git`). The matching remote name is `<base-remote>`. **If no remote matches** (fork-based PR with no `upstream` remote), do NOT default to `origin` — `origin` would diff against the wrong base. Skip directly to Case B.

### Case A — base remote matched, attempt local git

**Only fetch when the refs aren't already local.** Skipping the fetch when refs resolve locally preserves offline / restricted-network / expired-auth workability — a common case when re-running the skill on a branch that's already been fetched recently.

```bash
PR_HEAD_SHA=<headRefOid>   # for current-branch mode, use HEAD instead

if ! git rev-parse --verify <base-remote>/<baseRefName> >/dev/null 2>&1 \
  || ! git rev-parse --verify $PR_HEAD_SHA >/dev/null 2>&1; then
  git fetch --no-tags <base-remote> <baseRefName> $PR_HEAD_SHA
fi

MERGE_BASE=$(git merge-base <base-remote>/<baseRefName> $PR_HEAD_SHA) \
  && echo '=== COMMITS ===' && git log --oneline "$MERGE_BASE..$PR_HEAD_SHA" \
  && echo '=== DIFF ===' && git diff "$MERGE_BASE...$PR_HEAD_SHA"
```

For current-branch mode, `$PR_HEAD_SHA` is `HEAD` which is always local, so only the base ref needs fetching. Using the explicit `$PR_HEAD_SHA` in downstream commands avoids `FETCH_HEAD`'s multi-ref ordering problem.

If `git merge-base` itself fails (shallow clone with insufficient history, or genuinely unrelated histories), do not press on — fall through to Case B and let the API path produce the diff and commits.

### Case A inner fallback — SHA fetch rejected

Some GHES configurations disallow fetching non-tip SHAs. If the SHA fetch is rejected (PR mode only — current-branch mode uses HEAD which is always local), fall back to fetching the PR head via `refs/pull/<number>/head`:

```bash
git fetch --no-tags <base-remote> "refs/pull/<number>/head"
PR_HEAD_SHA=$(awk '/refs\/pull\/[0-9]+\/head/ {print $1; exit}' "$(git rev-parse --git-dir)/FETCH_HEAD")
```

Then re-run the merge-base + log + diff with the new `$PR_HEAD_SHA`.

### Case B — API only

Use Case B when:
- No local remote matches the PR's base repo (fork-PR, cross-repo PR), OR
- Case A's fetches all fail (offline, restricted network, expired auth, GHES quirks blocking both SHA and `refs/pull/N/head`).

Skip local git entirely:

```bash
gh pr diff <ref>
gh pr view <ref> --json commits --jq '.commits[] | [.oid[0:7], .messageHeadline] | @tsv'
```

Note in the user-facing output that the API fallback was used.

### Empty range

If the resulting commit list is empty (HEAD already merged into the base, or the branch has no unique commits), report `"No commits to describe"` and exit gracefully — do not invent a description.

---

## Step A: Classify commits

Scan the commit list and classify each commit:

- **Feature commits** -- implement the PR's purpose (new functionality, intentional refactors, design changes). These drive the description.
- **Fix-up commits** -- iteration work (code review fixes, lint fixes, test fixes, rebase resolutions, style cleanups). Invisible to the reader.

When sizing the description, mentally subtract fix-up commits: a branch with 12 commits but 9 fix-ups is a 3-commit PR.

---

## Step B: Decide on evidence

Decide whether to include an evidence section in the body.

**Evidence is useful** when the diff changes behavior or makes a material claim a reviewer cannot establish from the diff alone: UI, CLI output, API behavior with runnable code, generated artifacts, workflow output, ranking or scoring logic, deployment/config behavior, migrations, performance, or compatibility.

**Evidence is normally unnecessary** for:
- Inert documentation, changelog-only edits, release metadata, test-only changes, or pure internal refactors with no material reviewer claim
- Behavior requiring unavailable credentials, paid/cloud services, bot tokens, deploy-only infrastructure, or hardware not provided

Classify files by runtime purpose, not extension. Markdown or YAML may be inert prose, but it may also be runtime agent instructions, configuration, generated product content, policy code, or deployment behavior. Do not auto-skip evidence merely because a change is labeled docs-only or uses a prose-oriented extension.

**Decision logic:**

1. **Existing PR body contains a `## Demo` or `## Screenshots` section with image embeds:** preserve it verbatim unless the user's focus asks to refresh or remove it. Include the preserved block in the body.
2. **No existing evidence block:** omit the evidence section entirely unless the caller already captured evidence and passed it in.

Do not label test output as "Demo" or "Screenshots". Place any preserved evidence block before the Spec-First footer.

---

## Step B2: Judge new concepts

Decide whether the change introduces a concept: a pattern, technique, library, or domain idea that a reader of this repo would plausibly not know. Skip this step entirely when the skill's concept teaching gate is off.

**Gather candidates from the diff first.** Read the Pre-A diff for concept-shaped novelty: a dependency put to first real use, a technique the diff visibly introduces, or a domain idea the code now encodes. Most PRs surface no candidate; stop there and compose no section. Absence is the common case, and this path costs zero extra tool calls.

**Check each candidate against the base ref, never the working tree.** The working tree contains this PR's own code, so grepping it finds the concept you just added and wrongly concludes it is already established. Check the base instead, using the base resolved in Pre-A:

```bash
git grep -il -e "<term>" "<base-remote>/<base>" | head -5
```

Run one call per candidate. Candidates cap at two, so the cost stays bounded. Empty output means the concept is absent from the base.

A candidate is teachable only when it is both new to this codebase in this PR and transferable beyond it. Never teach routine use of an already-established repo pattern, ordinary refactors, renames, dependency bumps, or project-internal plumbing with no transferable idea. When in doubt, omit; a missing section costs little, while a patronizing one trains readers to skip the feature.

In the `gh` fallback path (fork PR, no local base refs), judge from diff context alone and lean conservative: compose the section only when the concept is unmistakably new.

- Bad: teaching "dependency injection" because a PR added one constructor argument in a codebase full of DI.
- Good: teaching infinite scroll on the PR that replaces pagination with it for the first time.

**Compose the section** under the heading `## New concepts` for at most 2 concepts. When more qualify, teach the most load-bearing concepts and name the rest in one sentence. Per concept, write roughly 10-25 lines covering:

1. **What it is**: the concept in plain words, no jargon dependency.
2. **Why here**: why it was chosen over the obvious alternative this PR could have used.
3. **One example from this PR**: how the shipped behavior exercises the concept.
4. **When not to use it**: one sentence on the boundary.

Format by material:

| Material | Show |
|----------|------|
| Architecture, relationships, boundaries | Fenced `mermaid` block (`flowchart TB`) |
| Code behavior, a diff's mechanics | Fenced code block with a one-line why comment above |
| A comparison or trade-off | Pipe-delimited table, prose verdict underneath |

Lead with the point, then the mechanism, then the caveat. Dense is good; long is not. Never hand-draw box-drawing or ASCII diagrams. The section is additive to Step D's sizing: a small PR that introduces a heavy concept still gets the section, and the section never counts against the base description's size rows.

**Rewrite preservation:** when rewriting an existing PR body, preserve an existing `## New concepts` section and any explainer-doc link verbatim, same as `## Demo`, unless the user's focus asks to refresh the concepts. Description-only and description-update runs never write repo files.

**Archival hook:** when `spec-commit-push-pr` confirms the apply and `pr_teaching_archive` is on in full workflow, the teaching content is also written to `docs/explainers/` and linked from the section. The commit-and-push transition and doc frontmatter live in `SKILL.md` Step 7.

---

## Step C: Frame the narrative

Articulate the PR's narrative frame:

1. **Before**: What was broken, limited, or impossible? (One sentence.)
2. **After**: What's now possible or improved? (One sentence.)
3. **Scope rationale** (only if 2+ separable-looking concerns): Why do these ship together? (One sentence.)

This frame becomes the opening. For small+simple PRs, the "after" sentence alone may be the entire description.

---

## Step D: Size by reviewer decision cost

Size the description by how much a reviewer cannot establish from the diff alone, not by changed-line count, file extension, or visual surface. A small ranking-logic or deployment edit may carry more uncertainty than a large mechanical rename.

Before sizing, name the change's **material claims**: what became possible, what was fixed, what risk changed, and which design decision the reviewer must assess. Note which claims the diff alone cannot establish. Surface those claims and the evidence or residual uncertainty that changes confidence; leave reconstructable mechanics implicit.

Decision cost sets what to surface, not permission to write more. Reviewer uncertainty may move a change at most one row in the table below. A small high-uncertainty diff earns a sharper lead and a concise validation caveat, not a multi-section essay. Prefer the shortest description that still lets a reviewer decide.

Evidence can include benchmarks, API captures, migration or rollback exercises, logs, compatibility matrices, security analysis, evals, manual probes, and rollout results. Include a result only when it changes confidence in a material claim. Keep demonstrated results distinct from assumptions and mixed or negative outcomes.

Subtract fix-up commits when sizing. Large PRs need more selectivity, not more content.

| Change profile | Description approach |
|---|---|
| Small + simple (typo, config, dep bump) | 1-2 sentences, no headers. Under ~300 characters. |
| Small + non-trivial (bugfix, behavioral change) | Short narrative, ~3-5 sentences. No headers unless two distinct concerns. |
| Medium feature or refactor | Narrative frame (before/after/scope), then what changed and why. Call out design decisions. |
| Large or architecturally significant | Narrative frame + up to 3-5 design-decision callouts + 1-2 sentence test summary + key docs links. Target ~100 lines, cap ~150. For PRs with many mechanisms, use a Summary-level table to list them; do NOT create an H3 subsection per mechanism. Reviewers scrutinize decisions, not inventories — the diff and spec files carry the detail. If you find yourself writing 10+ subsections, consolidate to a table. |
| Performance improvement | Include before/after measurements if available. Markdown table works well. |

The table is calibration, not a diff-size formula. When in doubt, choose the shortest row that still carries the decision-relevant context, evidence, and residual uncertainty.

---

## Step E: Apply writing principles

### Writing voice

If the repo has documented style preferences in context, follow those. Otherwise:

- Active voice. No em dashes or `--` substitutes; use periods, commas, colons, or parentheses.
- Vary sentence length. Never three similar-length sentences in a row.
- Do not make a claim and immediately explain it. Trust the reader.
- Plain English. Technical jargon fine; business jargon never.
- No filler: "it's worth noting", "importantly", "essentially", "in order to", "leverage", "utilize."
- Digits for numbers ("3 files"), not words ("three files").

### Writing principles

- **Lead with value**: Open with what's now possible or fixed, not what was moved around. The subtler failure is leading with the mechanism ("Replace the hardcoded capture block with a tiered skill") instead of the outcome ("Evidence capture now works for CLI tools and libraries, not just web apps"). For user-facing bugs, lead with the visible before/after before naming the implementation mechanism.
- **No orphaned opening paragraphs**: If the description uses `##` headings anywhere, the opening must also be under a heading (e.g., `## Summary`). For short descriptions with no sections, a bare paragraph is fine.
- **Describe the net result, not the journey**: The description covers the end state, not how you got there. No iteration history, debugging steps, intermediate failures, or bugs found and fixed during development. This applies equally when regenerating for an existing PR: rewrite from the current state, not as a log of what changed since the last version. Exception: process details critical to understand a design choice.
- **When commits conflict, trust the final diff**: The commit list is supporting context, not the source of truth. If commits describe intermediate steps later revised or reverted, describe the end state from the full branch diff.
- **Explain the non-obvious**: If the diff is self-explanatory, don't narrate it. Spend space on things the diff doesn't show: why this approach, what was rejected, what the reviewer should watch.
- **Use structure when it earns its keep**: Headers, bullets, and tables aid comprehension, not mandatory template sections.
- **Markdown tables for data**: Before/after comparisons, performance numbers, or option trade-offs communicate well as tables.
- **No empty sections**: If a section doesn't apply, omit it. No "N/A" or "None."
- **Test plan — only when non-obvious**: Include when testing requires edge cases the reviewer wouldn't think of, hard-to-verify behavior, or specific setup. Omit when "run the tests" is the only useful guidance. When the branch adds test files, name them with what they cover.
- **No Commits section**: GitHub already shows the commit list in its own tab. A Commits section in the PR body duplicates that without adding context. Omit unless the commits need annotations explaining their ordering or shipping rationale.
- **No Review / process section**: Do not include a section describing how the reviewer should review (checklists of things to look at, process bullets). Process doesn't help the reviewer evaluate code. Call out specific non-obvious things to scrutinize inline with the change that warrants it.

### Visual communication

Include a visual aid only when the change is structurally complex enough that a reviewer would struggle to reconstruct the mental model from prose alone.

**The core distinction — structure vs. parallel variation:**

- Use a **Mermaid diagram** when the change has **topology** — components with directed relationships (calls, flows, dependencies, state transitions, data paths). Diagrams express "A talks to B, B talks to C, C does not talk back to A" in a way tables cannot.
- Use a **markdown table** when the change has **parallel variation of a single shape** — N things that share the same attributes but differ in their values. Tables express "option 1 costs X, option 2 costs Y, option 3 costs Z" cleanly.

Architecture changes are almost always topology (components + edges), so Mermaid is usually the right call — a table of "components that interact" loses the edges and becomes a flat list. Reserve tables for genuinely parallel data: before/after measurements, option trade-offs, flag matrices, config enumerations.

**When to include (prefer Mermaid, not a table, for architecture/flow):**

| PR changes... | Visual aid |
|---|---|
| Architecture touching 3+ interacting components (the components have *directed relationships* — who calls whom, who owns what, which skill delegates to which) | **Mermaid** component or interaction diagram. Do not substitute a table — tables cannot show edges. |
| Multi-step workflow or data flow with non-obvious sequencing | **Mermaid** flow diagram |
| State machine with 3+ states and non-trivial transitions | **Mermaid** state diagram |
| Data model changes with 3+ related entities | **Mermaid** ERD |
| Before/after performance or behavioral measurements (same metric, different values) | **Markdown table** |
| Option or flag trade-offs (same attributes evaluated across variants) | **Markdown table** |
| Feature matrix / compatibility grid | **Markdown table** |

**When in doubt, ask: "Does the information have edges (A → B) or does it have rows (attribute × variant)?"** Edges → Mermaid. Rows → table. Architecture has edges almost by definition.

**When to skip any visual:**
- Sizing routes to "1-2 sentences"
- Prose already communicates clearly
- The diagram would just restate the diff visually
- Mechanical changes (renames, dep bumps, config, formatting)

**Format details:**
- **Mermaid** (default for topology). 5-10 nodes typical, up to 15 for genuinely complex changes. Use `TB` direction. Source should be readable as fallback.
- **ASCII diagrams** for annotated flows needing rich in-box content. 80-column max.
- **Markdown tables** for parallel-variation data only.
- Place inline at point of relevance, not in a separate section.
- Prose is authoritative when it conflicts with a visual.

Verify generated diagrams against the change before including.

### Numbering and references

Never prefix list items with `#` in PR descriptions — GitHub interprets `#1`, `#2` as issue references and auto-links them.

When referencing actual GitHub issues or PRs, use `org/repo#123` or the full URL. Never use bare `#123` unless verified.

### Applying user focus

If the user provided a focus hint (e.g., "emphasize the benchmarks", "this needs to read as a migration not a feature"), incorporate it alongside the diff-derived narrative. Treat focus as steering, not override: do not invent content the diff does not support, and do not suppress important content the diff demands simply because focus did not mention it. When focus and diff materially disagree (e.g., focus says "include benchmarking" but the diff has no benchmarks), surface the conflict to the user rather than fabricating content.

---

## Step F: Compose the title

Title format: `type: description` or `type(scope): description`.

- **Type** is chosen by intent, not file extension or diff shape. `feat` for new functionality, `fix` for a bug fix, `refactor` for a behavior-preserving change, `docs` for doc-only, `chore` for tooling/maintenance, `perf` for performance, `test` for test-only. Where `fix` and `feat` could both seem to fit, default to `fix`: a change that remedies broken or missing behavior is `fix` even when implemented by adding code. Reserve `feat` for capabilities the user could not previously accomplish. The user may override.
- **Scope** (optional) is the narrowest useful label: a skill/agent name, CLI area, or shared area. Omit when no single label adds clarity.
- **Description** is imperative, lowercase, under 72 characters total. No trailing period.
- If the repo has commit-title conventions visible in recent commits, match them.

Breaking changes use `!` (e.g., `feat!: ...`) or document in the body with a `BREAKING CHANGE:` footer. Do not apply either marker without explicit user confirmation — they trigger automated major-version bumps in some release tooling.

---

## Step G: Compose the body

Assemble the body in this order:

1. **Opening** -- the narrative frame from Step C, at the depth chosen in Step D. Under a heading (e.g., `## Summary`) if the description uses any `##` headings elsewhere; a bare paragraph otherwise.
2. **Body sections** -- only the sections that earn their keep for this change: what changed and why, design decisions, tables for data, visual aids when complexity warrants. Skip empty sections entirely.
3. **Test plan** -- only when non-obvious per the writing principles. Omit otherwise.
4. **New concepts section** -- only when Step B2 produced one or preserved one from the existing PR body.
5. **Evidence block** -- only the preserved or freshly captured block from Step B, if one exists. Do not fabricate or placeholder.
6. **Spec-First footer** -- append the plain-text footer separated by a `---` rule. Skip if regenerating an existing body that already contains the footer.

**Footer:**

```markdown
---

Built with [Spec-First](https://github.com/sunrain520/spec-first)
```

The footer contains no externally loaded image and does not publish the harness or model slug. The repository link is navigated only when a reader chooses it; rendering the PR body makes no third-party image request.

---

## Step H: Compression pass

Before applying, audit the body against the material claims from Step D:

- Is every claim the diff cannot establish present, and is any claim the diff does show restated needlessly?
- Is decision-changing evidence stated as a result rather than collapsed into an unexplained "tests passed"?
- Are demonstrated results, assumptions, and mixed or negative outcomes clearly distinguished?

Then apply these cuts:

- If any body section restates content already in the `## Summary`, remove it. The Summary plus the diff should carry the reader.
- If "Testing" or "Test plan" has more than 2 paragraphs, compress to bullets.
- If a "Commits" section enumerates the commit log, remove it — GitHub shows it in its own tab.
- If a "Review" or process-oriented section lists how to review, remove it. Move any truly non-obvious review hints inline with the relevant change.
- If the body has 5+ H3 subsections that each describe one mechanism, consolidate them into a single table row per mechanism under one header. Reserve prose H3 callouts for 2-3 genuine design decisions.
- If the body exceeds the sizing-table target by more than 30%, compress the longest non-Summary section by half.
- If any other sentence or section can be cut without lowering reviewer confidence, cut it. Do not remove required footer content or a required `## New concepts` section solely to shorten the narrative.

**Value-lead check.** Re-read the first sentence of the Summary. If it describes what was moved around, renamed, or added ("This PR introduces three-tier autofix..."), rewrite to lead with what's now possible or what was broken and is now fixed ("Document reviews previously produced 14+ findings requiring user judgment; this PR cuts that to 4-6.").

Large PRs benefit from selectivity, not comprehensiveness.
