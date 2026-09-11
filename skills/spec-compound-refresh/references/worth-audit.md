# Optional Worth Audit

Read only when the user asks to assess the continued value of accurate learnings
or to remove content recoverable elsewhere. Accuracy remains the first judgment;
worth is an additional lens, not another workflow or a new classification enum.

## Select The Lens And Resolve Authority

- A drift-only request leaves the lens `off` and does not search for reasons to
  cut accurate content.
- An explicit request to audit recoverability enables investigation, not writes.
  An explicit request to prune recoverable content in a named scope authorizes
  those bounded local cuts. Existing session authority persists; do not ask for
  the same approval again.
- If a generic cleanup request is ambiguous, explain the distinction between
  fixing drift and cutting accurate but recoverable content. Ask only for that
  scope-changing choice in interactive mode; otherwise leave worth actions
  `recommended-only`. Continue independently authorized accuracy maintenance.
- In non-interactive mode, all worth-based Delete/Update actions are
  `recommended-only`, with quoted recovery evidence. Never relabel them as
  accuracy-based actions to bypass this boundary.

Report `Worth lens: off | audit-only | authorized | recommended-only`, explaining
scope and the source of authority when cuts are authorized. These are report
labels, not persistent workflow state or proof of user approval.

## Recoverability Needs Positive Evidence

A learning earns its place when it preserves durable project reasoning not
readily recoverable from code, tests, types, comments, or existing documentation,
and losing it would plausibly cause recurrence, material risk, or substantial
rediscovery. Completion, effort, age, and diff size do not establish value.

For each claim needed to avoid repeating a mistake or an investigation, find
an in-repo artifact whose own text states that reasoning. Record its path,
location, and quoted reasoning, or mark the claim not recoverable. A related
filename, passing test, or implementation mechanism without the reason is not
coverage. Preserve unique measurements, cross-file invariants, and rejected
alternatives no surviving artifact records. Unverifiable is not false: absent
corroboration is a verification gap, not evidence that a claim is dispensable.

Use that same claim-by-claim task in authorized investigation workers or inline.
The selected scope bounds the learnings being judged; recovery search may read
otherwise unnamed guidance across the target repository. It never authorizes
editing that guidance, inspecting another repository, or expanding the deletion
scope. The recovering artifact must survive this run: two docs cannot justify
each other's deletion. Recheck recovery evidence before publication if changed.

## Route And Prepare

Apply accuracy classification first. Assess worth on the accurate content that
would survive the proposed action; combine both into one final candidate when
worth edits are authorized, otherwise keep the worth recommendation separate.

| Evidence | Worth action |
| --- | --- |
| All meaningful claims explicitly recoverable; inbound citations absent or decorative | Delete recommendation, or authorized deletion with quoted artifacts |
| Some claims recoverable | Update retaining unique reasoning, with a short pointer where removed context is needed |
| No claims recoverable or recovery evidence uncertain | Keep the accurate content and report verification gaps |

Substantive inbound citations block worth-based deletion or shortening that
would remove content those readers rely on. Preserve that content or propose
an explicitly scoped citation migration to a verified surviving artifact;
do not treat a quoted recovery source as an automatic redirect. Mixed or unclear
citations remain recommendations. Pure session narration or a change list may
justify a Delete recommendation only after verifying it contains no unique
reasoning and no dependent substantive citations; do not infer this from its title.

For authorized worth actions, use the matching flow and `references/publication.md`.
Substantive shortening is a material rewrite: re-evaluate classification under
v2 and pass the promotion gate. A changed recommendation still requires Replace,
not a worth-based Update. Keep ordinary accuracy-based Delete evidence separate
from worth-based recovery evidence in the report.

Every worth verdict lists the affected claims and surviving artifacts with
quotes. Audit-only and recommended-only runs keep accurate durable content
unchanged, even when other accuracy repairs successfully publish.
