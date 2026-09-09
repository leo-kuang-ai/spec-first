# Composing the title and body

Read `references/pr-description-writing.md` before composing. That reference
owns the value-first title/body structure, complete commit-range evidence,
existing-body preservation, and compression pass.

Classify evidence by runtime purpose. UI, CLI, API, workflow, ranking, and
deployment/config changes need a concise validation note or user-supplied
artifact when one exists. Inert docs, tests, release metadata, and pure
internal refactors do not require a demo. Never label test output as a demo or
invent a screenshot.

Resolve teaching and archival gates from the current repository config and
explicit invocation authority. Config eligibility does not authorize a write;
archive paths require an explicit accepted write set. Description-only and
report-only runs remain non-mutating. The body is written to a temporary file
and passed with `--body-file`; never pipe it through stdin or command
substitution.
