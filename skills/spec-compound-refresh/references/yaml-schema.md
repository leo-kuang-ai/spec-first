# YAML Frontmatter Schema

`schema.yaml` in this directory is the canonical contract for `docs/solutions/` frontmatter written by `spec-compound`.

Use this file as the quick reference for:
- required fields
- enum values
- validation expectations
- category mapping
- track classification (bug vs knowledge)

## Tracks

The `problem_type` determines which **track** applies. Each track has different required and optional fields.

| Track | problem_types | Description |
|-------|--------------|-------------|
| **Bug** | `build_error`, `test_failure`, `runtime_error`, `performance_issue`, `database_issue`, `security_issue`, `ui_bug`, `integration_issue`, `logic_error` | Defects and failures that were diagnosed and fixed |
| **Knowledge** | `best_practice`, `documentation_gap`, `workflow_issue`, `developer_experience`, `architecture_pattern`, `design_pattern`, `tooling_decision`, `convention` | Practices, patterns, conventions, decisions, workflow improvements, and documentation. Prefer the narrowest applicable value; `best_practice` is the fallback. |

## Required Fields (both tracks)

- **module**: Module or area affected
- **date**: ISO date in `YYYY-MM-DD`
- **problem_type**: One of the values listed in the Tracks table above
- **component**: One of `rails_model`, `rails_controller`, `rails_view`, `service_object`, `background_job`, `database`, `frontend_stimulus`, `hotwire_turbo`, `email_processing`, `brief_system`, `assistant`, `authentication`, `payments`, `development_workflow`, `testing_framework`, `documentation`, `tooling`
- **severity**: One of `critical`, `high`, `medium`, `low`

## Promotion Exit Fields

Every **new or materially rewritten learning**, in either track, must include:

- **source_refs**: A non-empty array of verifiable references that lets a later reader recover the evidence behind the learning. Prefer repo-relative source/test/doc paths, issue or PR identifiers, and other stable evidence references. Mechanical validation checks only that this is a non-empty array of non-empty strings; the author must judge whether the references are trustworthy and sufficient.
- **invalidation_condition**: A non-empty scalar or block string naming the concrete condition that requires the learning to be re-checked, revised, or retired. Mechanical validation checks only that content exists; the author must judge semantic adequacy.

Run `scripts/validate-frontmatter.py --promotion <doc-path>` after writing a new learning, materially rewriting an existing learning, or writing a replacement successor. Default validator mode remains parser-safety-only so untouched legacy docs are not forced through a bulk migration.

## Bug Track Fields

Required:
- **symptoms**: YAML array with 1-5 observable symptoms (errors, broken behavior)
- **root_cause**: One of `missing_association`, `missing_include`, `missing_index`, `wrong_api`, `scope_issue`, `thread_violation`, `async_timing`, `memory_leak`, `config_error`, `logic_error`, `test_isolation`, `missing_validation`, `missing_permission`, `missing_workflow_step`, `inadequate_documentation`, `missing_tooling`, `incomplete_setup`
- **resolution_type**: One of `code_fix`, `migration`, `config_change`, `test_fix`, `dependency_update`, `environment_setup`, `workflow_improvement`, `documentation_update`, `tooling_addition`, `seed_data_update`

## Knowledge Track Fields

No additional track-specific required fields beyond the shared fields and the promotion exit fields. All fields below are optional:

- **applies_when**: Conditions or situations where this guidance applies
- **symptoms**: Observable gaps or friction that prompted this guidance
- **root_cause**: Underlying cause, if there is a specific one
- **resolution_type**: Type of change, if applicable

## Optional Fields (both tracks)

- **related_components**: Other components involved
- **tags**: Search keywords, lowercase and hyphen-separated

## Optional Fields (bug track only)

- **rails_version**: Rails version in `X.Y.Z` format

## Backward Compatibility

Docs created before the track system may have `symptoms`/`root_cause`/`resolution_type` on knowledge-type problem_types. These are valid legacy docs:

- Bug-track fields present on a knowledge-track doc are harmless. Do not strip them during refresh unless the doc is being rewritten for other reasons.
- When creating **new** docs, follow the track rules above.
- Untouched legacy docs do not need promotion exit fields. A new learning, material rewrite, or replacement successor does.

## Category Mapping

- `build_error` -> `docs/solutions/build-errors/`
- `test_failure` -> `docs/solutions/test-failures/`
- `runtime_error` -> `docs/solutions/runtime-errors/`
- `performance_issue` -> `docs/solutions/performance-issues/`
- `database_issue` -> `docs/solutions/database-issues/`
- `security_issue` -> `docs/solutions/security-issues/`
- `ui_bug` -> `docs/solutions/ui-bugs/`
- `integration_issue` -> `docs/solutions/integration-issues/`
- `logic_error` -> `docs/solutions/logic-errors/`
- `developer_experience` -> `docs/solutions/developer-experience/`
- `workflow_issue` -> `docs/solutions/workflow-issues/`
- `best_practice` -> `docs/solutions/best-practices/`
- `documentation_gap` -> `docs/solutions/documentation-gaps/`
- `architecture_pattern` -> `docs/solutions/architecture-patterns/`
- `design_pattern` -> `docs/solutions/design-patterns/`
- `tooling_decision` -> `docs/solutions/tooling-decisions/`
- `convention` -> `docs/solutions/conventions/`

## Validation Rules

1. Determine the track from `problem_type` using the Tracks table.
2. All shared required fields must be present.
3. Bug-track required fields (`symptoms`, `root_cause`, `resolution_type`) must be present on bug-track docs.
4. Knowledge-track docs have no additional track-specific required fields beyond the shared and promotion exit fields.
5. New or materially rewritten learnings in either track must include non-empty `source_refs` and `invalidation_condition` promotion exit fields.
6. Bug-track fields on existing knowledge-track docs are harmless (see Backward Compatibility).
7. Enum fields must match the allowed values exactly.
8. Array fields must respect min/max item counts.
9. `date` must match `YYYY-MM-DD`.
10. `rails_version`, if present, must match `X.Y.Z` and only applies to bug-track docs.

## YAML Safety Rules

Strict YAML 1.2 parsers (`yq`, `js-yaml` strict, PyYAML) reject array items
that start with a reserved indicator character as unquoted scalars. When
writing items for any array-of-strings field (`source_refs`, `symptoms`,
`applies_when`, `tags`, `related_components`, or any future array field), wrap the value in
double quotes if it starts with any of:

`` ` ``, `[`, `*`, `&`, `!`, `|`, `>`, `%`, `@`, `?`

Also quote if the value contains the substring `": "` — that punctuation
confuses flow-style parsers.

Promotion exit strings must also be quoted when a common YAML parser could
implicitly type the plain token as a non-string value. This includes nulls,
booleans (`true`/`false` and the YAML 1.1 forms `yes`/`no`/`on`/`off`), numeric
literals such as `0b1010` or `0x10`, sexagesimal values such as `1:20`, and
date/timestamp values such as `2026-07-20`. Quoting preserves the required
`array[string]` / `string` shape across `js-yaml` and PyYAML consumers.

Example — before (breaks strict YAML):

    symptoms:
      - `sudo dscacheutil -flushcache` does not restore in-container mDNS

Example — after (parses cleanly):

    symptoms:
      - "`sudo dscacheutil -flushcache` does not restore in-container mDNS"

This rule applies to all array-of-strings frontmatter fields. Scalar string
fields like `description:` have their own quoting rules (see root
`AGENTS.md` under "YAML Frontmatter").
