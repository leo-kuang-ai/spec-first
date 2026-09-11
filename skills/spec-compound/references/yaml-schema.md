# YAML Frontmatter Schema

`schema.yaml` in this directory is the canonical contract for `docs/solutions/` frontmatter written by `spec-compound`.

Use this file as the quick reference for:
- required fields
- enum values
- validation expectations
- category mapping
- track classification (bug vs knowledge)

## Classification Contract v2

Use closed responsibility-based enums for new learnings. Select the owning boundary, not the host name or a concrete class; put the precise project/module name in `module` and searchable details in `tags`. Scripts check mechanical facts; classification remains an evidence-grounded author judgment.

| Component | Owning responsibility |
| --- | --- |
| `cli` | Commands, argument handling, user-facing CLI output |
| `workflow` | Spec, plan, tasks, work, review and their handoffs |
| `skill` | Skill instructions and local prompt assets |
| `runtime` | Host projection, initialization and source/runtime synchronization |
| `provider` | External tool adapters and readiness facts |
| `contract` | Artifact schemas and producer/consumer agreements |
| `verification` | Evidence admission, checks and completion claims |
| `knowledge` | Learning capture, retrieval and vocabulary |
| `governance` | Authority, ownership and project rules |
| `application_code` | User-project domain/application implementation |
| `development_workflow` | Cross-cutting engineering practices |
| `testing_framework` | Test and evaluation infrastructure |
| `documentation` | Documentation content and discoverability |
| `tooling` | Supporting scripts not owned by a more specific boundary |

For example, a projection copying obsolete assets is `runtime` / `source_runtime_drift`; a consumer reading an incompatible artifact is `contract` / `contract_drift`; an agent asserting behavior from old session notes is `knowledge` / `stale_context`. Choose the demonstrated cause, not merely the affected area.

Untouched existing docs keep their path and remain readable, including legacy component/root-cause values and `rails_version`. New docs use v2. Every material rewrite re-evaluates all classification fields against current evidence and uses v2 enums, while preserving the path and unrelated metadata and adding promotion fields. Do not mechanically map every legacy term or migrate unrelated docs. In particular, a class named `assistant` does not establish a workflow owner.

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
- **component**: One of the closed values in Classification Contract v2 above; `schema.yaml` is canonical.
- **severity**: One of `critical`, `high`, `medium`, `low`

## Promotion Exit Fields

Every **new or materially rewritten learning**, in either track, must include:

- **source_refs**: A non-empty array of verifiable references that lets a later reader recover the evidence behind the learning. Prefer repo-relative source/test/doc paths, issue or PR identifiers, and other stable evidence references. Mechanical validation checks only that this is a non-empty array of non-empty strings; the author must judge whether the references are trustworthy and sufficient.
- **invalidation_condition**: A non-empty scalar or block string naming the concrete condition that requires the learning to be re-checked, revised, or retired. Mechanical validation checks only that content exists; the author must judge semantic adequacy.

Run `scripts/validate-frontmatter.py --promotion <doc-path>` after writing a new learning, materially rewriting an existing learning, or writing a replacement successor. Default validator mode remains parser-safety-only so untouched legacy docs are not forced through a bulk migration.

## Bug Track Fields

Required:
- **symptoms**: YAML array with 1-5 observable symptoms (errors, broken behavior)
- **root_cause**: One of `contract_drift`, `source_runtime_drift`, `stale_context`, `wrong_api`, `ownership_violation`, `concurrency`, `data_integrity`, `async_timing`, `memory_leak`, `config_error`, `logic_error`, `test_isolation`, `missing_validation`, `missing_permission`, `missing_workflow_step`, `inadequate_documentation`, `missing_tooling`, `incomplete_setup`
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

- **framework_version**: Observed framework or runtime and version, for example `node 22.4.0`.

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
10. `framework_version`, if present, names the observed framework/runtime and only applies to bug-track docs; legacy `rails_version` remains readable.

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
