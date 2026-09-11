# Composing the title and body

Read `references/pr-description-writing.md` before composing. That reference
owns the value-first title/body structure, complete commit-range evidence,
existing-body preservation, and compression pass.

Classify evidence by runtime purpose. Classify by runtime purpose, not extension:
UI, CLI, API, workflow, ranking/scoring logic, deployment/config behavior need
a concise validation note or user-supplied artifact when one exists. Runtime
instructions and policy files are behavior-bearing even when written as Markdown
or YAML. Inert docs, tests, release metadata, and pure internal refactors do not
require a demo. Never label test output as a demo or invent a screenshot.

Preserve user-supplied evidence and existing Demo/Screenshots blocks unless the
user requested their removal or refresh. This helper does not launch a capture
workflow or upload artifacts. If requested evidence is missing, identify the
missing artifact; in pipeline mode return that limitation with actual test or
manual verification notes. Missing visuals alone do not block PR creation.

Resolve the repo root from current Git facts. Read
`<repo-root>/.spec-first/config.local.yaml` as YAML using a structured parser
when available. Only active, non-commented keys count. `pr_teaching_section:`
is off only for boolean `false`, otherwise on. When off, skip Step B2, the
concept section, trailer, offer, and archival. `pr_teaching_archive:` is eligible
only for boolean `true`, otherwise off. Keep this local config contract; do not
import the upstream CE config cascade.

A current-user `archive:on` invocation, or a visible upstream handoff with the
exact explainer paths, establishes `archive_authorization: authorized`;
config, teaching-section eligibility, commit authority, and landing authority do not.
`archive:off` disables archival. Eligibility alone never authorizes file writes;
the apply reference requires the exact accepted path set. Description-only and
description-update modes never archive repository files.

Use the existing plain-text Spec-First footer rules in the writing reference.
Do not introduce CE branding flags, badges, model slugs, or external image
requests. Complete Pre-A and Steps A through H for every composition mode.
The body is written to a temporary file and passed with `--body-file`; never
pipe it through stdin or command substitution.
