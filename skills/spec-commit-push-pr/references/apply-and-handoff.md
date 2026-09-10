# Apply And Handoff

Read this reference before Step 7. The entry owns mode, authorization, and the
Step 8 decision/watch handoff. This reference owns PR application and archival.

## Resolve The Apply Route

- Description-only: print the composed title and body, then return through
  Step 8 without mutation. A later explicit apply request supplies new intent.
- Description-update: resolve the exact PR, compose using its URL and current
  body, then compare and apply under existing landing authority.
- Full workflow with a new PR candidate: immediately re-read branch, remote,
  and the base-repo PR query from `context.md`. Match head owner and branch.
  A matching PR switches to the existing-PR route; confirmed absence allows
  create. Non-zero, malformed, or ambiguous results block creation.
- Full workflow with an existing PR: report its URL after any authorized push.
  Rewrite only when the user or caller already requests it, or an interactive
  user accepts the rewrite offer. Pipeline mode defaults to no rewrite. A
  declined rewrite skips composition, archival, and edit, then returns Step 8.

Re-read the current title/body before editing. Identical content is a no-op.
A branding-only delta without an explicit request for that change is also a
no-op. Otherwise present the proposed title, its length, the first two summary
sentences, and body line count. Apply under already established update intent;
ask only for an unresolved decision. If the user declines, retain the current
body. Do not apply a body composed against a different PR or stale scope.

## Explainer Archival

Archive only in full workflow with archive eligibility on,
`archive_authorization: authorized`, a composed `## New concepts` section, and
a body this run will apply. Before any file or directory write, show the exact
repo-relative `docs/explainers/YYYY-MM-DD-<concept-slug>.md` paths, including
existing files to overwrite, and verify they belong to the accepted write set.
An explicit archive request covers deriving new concept paths; an overwrite
outside its established scope requires a separate decision. Missing authority
or unresolved scope skips archival with `archive_authorization_missing` and
does not block the PR. Resolve paths from the repository root, never the CWD.

1. Run `git check-ignore -q <path>` for every proposed path. Exit 0 means ignored:
   skip archival without writing or force-adding. Exit 1 means not ignored;
   another exit is a failed probe and also prevents the archive write.
2. Write one file per concept with YAML `title`, `date`, `input_shape: concept`,
   `subject`, and the teaching content. Preserve existing files outside the
   accepted overwrite scope.
3. Stage and commit only those paths under `commit-and-push.md`'s index rules,
   then push after its fresh-state checks. Use `docs(explainer): teach <concept>`
   or the project-language equivalent. A no-change result requires checking
   that the intended contents are already committed and remotely available;
   it does not by itself prove publication.
4. Obtain each head-branch blob URL from the actual repository host, for example
   `gh browse -n -b <head-branch> -- <path>` with the head repo selected. Do not
   hardcode github.com. Link only confirmed published files, then rewrite the
   temporary PR body with the final content.

If write, commit, push, or URL resolution fails, preserve the actual local state,
report the limitation, and continue the PR route without an unverified link.
Never claim the archive succeeded or discard an existing user's file.

## Apply With A Body File

Create a private temporary file using the host's native temporary-file API and
write the literal Markdown through its file-write tool. Validate non-empty
content and absence of placeholder text before invoking `gh`. Never use stdin,
`--body-file -`, a heredoc, shell substitution, or inline shell interpolation
for arbitrary body text. Pass the title as one literal argument, with proper
shell quoting only if the tool requires a shell command.

```text
gh pr create --title <literal-title> --body-file <private-body-file>
gh pr edit <confirmed-pr-url> --title <literal-title> --body-file <private-body-file>
gh pr view <confirmed-pr-url> --json title,body,url,headRefOid,baseRefName
```

These are separate calls. Keep the target base repository explicit on forks or
enterprise hosts. Read the exit code and structured response of each call.
After create/edit, verify that the remote title/body match the intended content;
a returned URL alone is insufficient. If a write result is unknown, query the
PR state before any retry to avoid duplicate creation. Clean up only this run's
temporary files after verification or after preserving necessary failure evidence.

## Return To The Caller

Continue Step 8 with the actual PR and publication facts, inherited decisions,
and limitations. A successfully applied body with New concepts enables its
trailer; a skipped rewrite does not. For its interactive offer, name the
`spec-explain` skill and the concept as input. Use the active host's catalog
to resolve invocation; do not invent a command entrypoint for a standalone skill.

This helper does not own a PR stack, a babysit product, or an automatic watch.
Do not import `gh stack submit`, CE babysit flags, or merge posture. Return the
existing `watch_handoff` to the authorized LFG owner, which owns its bounded
watch and final completion gate.
