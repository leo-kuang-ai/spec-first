# Committing and pushing

Commit and push only after the caller has separately established
`commit_authorization: authorized` and `landing_authorization: authorized`.
A `mode:pipeline` token, a green test suite, or a feature branch is not
permission.

Before staging, read the changed-file list and split only naturally distinct
concerns. Name every file explicitly. Never use `git add -A` or `git add .`,
and pass the same path list to the commit command so earlier staged work and
unrelated generated files stay out. Honor any `exclude:<paths>` supplied by
the caller; excluded paths remain uncommitted and visible in the report.

Use the repository's Conventional Commit style. A fix for missing or broken
behavior uses `fix:`; a new user capability uses `feat:`. Keep each logical
group in its own commit when that improves attribution, and keep the number of
groups small.

Re-check the current branch and remote immediately before pushing. Push the
live `HEAD` only after the caller's landing gate is still satisfied:

```bash
git push -u origin HEAD
```

A failed or unknown branch/remote probe blocks push. Do not treat an empty
working-tree diff as proof that all intended commits are already published.
