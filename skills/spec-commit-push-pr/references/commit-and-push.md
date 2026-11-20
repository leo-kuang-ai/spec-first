# Committing and pushing

Commit and push only after the caller has separately established
`commit_authorization: authorized` and `landing_authorization: authorized`.
A `mode:pipeline` token, a green test suite, or a feature branch is not
permission.

Before staging, read the changed-file list and split only naturally distinct
concerns. Name every file explicitly. Never use `git add -A` or `git add .`.
Honor any `exclude:<paths>` supplied by the caller; exclusions override an overlapping owned-path list. Excluded paths remain
uncommitted and visible in the report. Capture the existing index and inspect
the actual proposed commit, not just the working-tree diff.

For whole files owned by this run, pass the same path list to the commit
command so unrelated staged paths remain outside it. A path-limited commit
includes the named files' working-tree contents: it does not preserve hunk
selection inside those files. If a file mixes user changes with this run's
changes, use the caller's verified hunk/index isolation strategy or stop that
group; never broaden scope to make the example work.

For a proposed hunk/index isolation procedure, verify the exact owned patch,
current HEAD/branch, existing index entries, working-tree bytes and applicable
hooks before mutation. Account for hook configuration and hook side effects;
do not bypass hooks to obtain a passing commit. Recheck the pinned branch,
HEAD and index immediately before committing; drift stops the operation.

An alternate-index commit and reconciliation of the real index are separate
effects. Preserve the pre-operation identity and intended patch until both
are confirmed. After interruption or an uncertain commit result, inspect
HEAD, parent, committed tree/message and the current index before retrying.
An already-created intended commit must not be duplicated. Reconcile only
the owned patch against an unchanged expected index; if hooks or another
writer changed the state, retain the actual commit and report the unresolved
reconciliation. Never reset/stash unrelated work or claim atomic recovery.

Write the message with the native file-write tool to a private temporary file.
Run stage and commit as separate argv calls, using only inspected owned paths:

```text
git add -- <owned-file-1> <owned-file-2>
git commit -F <message-file> -- <owned-file-1> <owned-file-2>
```

On the default branch, read `references/branch-creation.md` before staging.
In pipeline mode, unresolved carry-forward intent is a blocker, not permission
to guess or wait indefinitely. Preserve existing work on checkout failures.

Use the repository's Conventional Commit style. A fix for missing or broken
behavior uses `fix:`; a new user capability uses `feat:`. Keep each logical
group in its own commit when that improves attribution, and keep the number of
groups small.

When exactly one plan unit is already known for a commit, append its U-ID,
such as `(U3)`. Do not hunt for a plan or label a mixed-unit commit as one unit.

Preserve the authors and trailers on existing commits. If you port a branch, PR, or patch without landing it under its original author, copy the source author and existing co-author identities into `Co-authored-by: Name <email>` trailers. If an email is unavailable, credit the name in the body without guessing. Distinguish a direct port from a reference or independent rewriting; reading upstream material does not establish co-authorship. This rule does not authorize rewriting history.

Re-check the current branch, remote, and existing PR immediately before pushing. **Project publishing gate:** before the push, resolve every applicable pre-push or review-ready requirement from the project's active instructions and conventions already in context, plus any scoped instructions governing the committed paths; only evidence valid for the exact commit state being sent satisfies them — a check that passed an earlier tree does not carry over. Stop before the external write and report what is missing or failing; if no requirement applies, proceed. **Release-surface reconciliation:** when the staged paths touch CHANGELOG, version, or release-check files, the publishing gate explicitly includes the repo's release-governance checks (in this repo, `npm run test:release:governance`); report `release_governance_status: confirmed-by-caller | unconfirmed` in the push report — `unconfirmed` is a visible gap for the caller, never a permission to skip the gate or to run new suites from this helper. Push the live `HEAD` only after the caller's landing gate is still satisfied:

Resolve the selected push endpoint and head branch to the caller's intended head repository. Never infer them from the base remote or an ambient push configuration. Inspect `git remote get-url --push --all <push-remote>` and require a single matching authorized endpoint; ambiguous or additional destinations block the push. Use one explicit non-force refspec, excluding unrelated tags, mirrors and submodules:

```text
git -c remote.<push-remote>.mirror=false push --no-follow-tags --no-mirror --recurse-submodules=no -u <push-remote> HEAD:refs/heads/<head-branch>
```

A failed or unknown branch/remote probe blocks push. Do not treat an empty
working-tree diff as proof that all intended commits are already published.
If push fails, retain the actual local commit SHA and reason, report the
publication blocker, and do not claim the remote changed or start a watch.

`remote.<push-remote>.mirror=false` only overrides the current command and does not modify the repository configuration; some Git versions re-enable mirroring when reading remote configuration, so using `--no-mirror` alone is insufficient when used in conjunction with explicit refspecs. Pass the confirmed remote name as part of the `-c` parameter, without concatenating executable shell text.

For caller-owned feedback fixes, return the actual created commit SHA(s), selected push target, push exit/result and current remote PR/head identity. Preserve partial facts if pushing or reading back fails. Do not report publication merely because a commit exists. The caller verifies exact fix-SHA reachability in the actual head repository before any repaired-remote reply; this helper does not reply to or resolve review feedback.
