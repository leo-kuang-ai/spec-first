# Committing and pushing

Commit and push only after the caller has separately established
`commit_authorization: authorized` and `landing_authorization: authorized`.
A `mode:pipeline` token, a green test suite, or a feature branch is not
permission.

Before staging, read the changed-file list and split only naturally distinct
concerns. Name every file explicitly. Never use `git add -A` or `git add .`.
Honor any `exclude:<paths>` supplied by the caller; excluded paths remain
uncommitted and visible in the report. Capture the existing index and inspect
the actual proposed commit, not just the working-tree diff.

For whole files owned by this run, pass the same path list to the commit
command so unrelated staged paths remain outside it. A path-limited commit
includes the named files' working-tree contents: it does not preserve hunk
selection inside those files. If a file mixes user changes with this run's
changes, use the caller's verified hunk/index isolation strategy or stop that
group; never broaden scope to make the example work.

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

Re-check the current branch, remote, and existing PR immediately before pushing. **Project publishing gate:** before the push, resolve every applicable pre-push or review-ready requirement from the project's active instructions and conventions already in context, plus any scoped instructions governing the committed paths; only evidence valid for the exact commit state being sent satisfies them — a check that passed an earlier tree does not carry over. Stop before the external write and report what is missing or failing; if no requirement applies, proceed. Push the live `HEAD` only after the caller's landing gate is still satisfied:

```bash
git push -u origin HEAD
```

A failed or unknown branch/remote probe blocks push. Do not treat an empty
working-tree diff as proof that all intended commits are already published.
If push fails, retain the actual local commit SHA and reason, report the
publication blocker, and do not claim the remote changed or start a watch.
