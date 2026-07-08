# Evaluation Rubric

The **orchestrator** applies this rubric before any resolver is dispatched. This is the legitimacy gate: judgment happens in the one context that holds every thread, actionable PR comment, and actionable review body at once. Resolver agents implement approved work; they do not decide whether feedback is worth fixing.

The output of applying this rubric is a verdict per item, sorted into:

- **fix-list** -- `fixed` / `fixed-differently` intent; dispatched to resolvers or handled sequentially.
- **reply-list** -- `replied` / `not-addressing` / `declined`; reply text composed by the orchestrator before any code mutation.
- **human-list** -- `needs-human`; `decision_context` composed by the orchestrator.

## Default To Fixing

Most review feedback -- across P0-P2, nitpicks included -- is correct and worth fixing. Work the list and fix: verdict `fixed`, or `fixed-differently` when a better approach than the suggestion is the right call. Judge every item on its merits regardless of source (human reviewer or review bot) or form (inline thread, formal review body, or top-level comment).

The checks below are tripwires, not a gate to deliberate on per item. When nothing trips, mark it to fix and move on. "I'm uneasy" is not a tripwire; "I read the callers and this breaks X" is.

## How Deep To Read

Read enough to decide the verdict, no more:

- **Clear nit or clearly-valid finding** (typo, a bug the diff already shows, naming, a missing guard the comment pinpoints) -> the comment plus the line already in the diff is enough. Mark to fix.
- **Contestable finding, or code that looks deliberate** (the finding asserts a bug where the code reads intentional, touches an invariant, or contradicts a nearby pattern) -> deep-read before accepting: open the referenced file, read the callers, check for the invariant or test that would make the reviewer wrong.
- **Recover author intent before overriding deliberate-looking code.** Use `git log`, `git blame`, the PR description, and surrounding code when needed. Weigh the author's intent against the finding rather than assuming the reviewer saw more.
- **Dedup reads by file.** Multiple threads on the same file should be judged together after one source read.

## Cross-Item Reasoning

When judging more than one item, use the full batch:

- **Cluster by root assumption.** If one source, often a bot, makes the same kind of claim across several threads and one instance does not hold, scrutinize the siblings.
- **Converging requests are a strong fix signal.** The same change requested by multiple independent reviewers rarely warrants a divert.

## Diverts

Divert from fixing only on a concrete signal:

- **The finding does not hold** -- source evidence shows the issue does not exist or is already handled -> `not-addressing`, with evidence.
- **The concern is no longer relevant** -- the code at this location changed since the review -> `not-addressing`.
- **The fix would make the code worse** -- it violates active project instructions, adds dead defensive code, suppresses errors that should propagate, introduces premature abstraction, or restates code in comments -> `declined`, citing the specific harm.
- **The change buys nothing real** -- a cosmetic preference or immaterial edit with no benefit to correctness, clarity, or maintainability -> `replied`. Small real improvements still get fixed; the skip bar is "no benefit."
- **The change is risky and cannot be bounded** -- it touches a hot path, a relied-on boundary, or thinly-tested code, and the benefit does not justify the risk after investigation -> `needs-human`.
- **It is a question, not a change request** -- answerable from code -> `replied`; dependent on product/business judgment -> `needs-human`.

## Outdated Threads

For `isOutdated=true`, the diff hunk shifted. Start from the first available location field: `line`, `startLine`, `originalLine`, `originalStartLine`. If no location resolves to current content matching the comment, extract an anchor from the comment (symbol, identifier, or distinctive phrase) and search the **same file** once. Do not search other files.

Outcomes:

- Anchor found in the file -> re-evaluate there. If it is a fix, pass the resolved location/anchor to the resolver.
- Anchor not found and the comment describes concrete in-place code -> `not-addressing`, with evidence.
- Anchor not found and the comment suggests the code moved elsewhere -> `needs-human`; choosing the new location is a user/author judgment.

## Reply Text

Compose reply text for reply-list and human-list items before mutation. Quote the specific sentence being addressed, not the whole comment if it is long.

For `replied`:

```markdown
> [quote the relevant part of the reviewer's comment]

[Direct answer, explanation of the design decision, or brief reason no change is warranted]
```

For `not-addressing`:

```markdown
> [quote the relevant part of the reviewer's comment]

Not addressing: [reason with evidence, e.g., "null check already exists at line 85"]
```

For `declined`:

```markdown
> [quote the relevant part of the reviewer's comment]

Declined: [specific harm cited, e.g., "this would add a defensive null check the type system already guarantees" or "violates AGENTS.md's no-premature-abstraction guidance"]
```

For `needs-human`, the **reply_text** posted to the thread should sound like the PR author, not AI process boilerplate:

```markdown
> [quote the relevant part of the reviewer's comment]

[Natural acknowledgment, e.g., "Good question -- this is a tradeoff between X and Y. I need to align on it before making the call."]
```

The **decision_context** presented to the user, not posted, carries the depth:

```markdown
## What the reviewer said
[Quoted feedback -- the specific ask or concern]

## What I found
[What you investigated and discovered. Reference specific files, lines, and code.]

## Why this needs your decision
[The specific ambiguity. Not "this is complex" -- what exactly are the competing concerns?]

## Options
(a) [First option] -- [tradeoff]
(b) [Second option] -- [tradeoff]

## My lean
[A recommendation and why, or what additional context would tip the decision.]
```
