# CLI / DevTool Surface template

> Used in combination with `00-generic.md`, this product contract supplements only the command entry point, parameter semantics, preview/mutation, output, error recovery, upgrade, and runtime projection. Frontmatter and readiness are provided by `references/prd-output-template.md`.
>
> All human-related questions are only directed to the currently executing conversation user.

## Tool property confirmation

| Dimension | content |
| --- | --- |
| Tool type | CLI / script / workflow / agent-facing command / runtime projection |
| Target users | Developer / Reviewer / CI / Local agent / Other |
| Public entry point | command / parameter / skill / workflow / npm script |
| Supported platforms | List the actual supported operating systems and host environments for the target product, based on current registry/official contract provisions. |
| Adverse effects | Read-only / Write file / Delete / Host config / External call |
| consumer | Humans / shell / CI / downstream workflow / parser |

## Command and parameter semantics

| Entry point | Parameters / Configuration | Default value | Required condition | Invalid value result | Example |
| --- | --- | --- | --- | --- | --- |
| | | | | | |

Clarify parameter precedence, environment variables, configuration files, interactive/non-interactive modes, and exit code. Do not specify parser library or function implementations in the PRD.

## Preview / Mutation Boundary

| Action | Default behavior | preview output | Confirmation point | Actual side effects | Recoverable mode |
| --- | --- | --- | --- | --- | --- |
| | | | | | |

Writes that can preview-first must not perform silent write. Deletion, coverage, host runtime modification, and hazardous commands must have clear mutation boundaries.

## Output and consumption side

| Output face | Format | Required fields / Meaning | consumer | Stability / versioning |
| --- | --- | --- | --- | --- |
| stdout | human / JSON / NDJSON | | | |
| stderr | error / warning / degraded | | | |
| artifact | path / schema / freshness | | | |
| exit code | 0 / non-zero meaning | | | |

Distinguish advisory, confirmed, generated, and degraded; do not let transcript declarations substitute for outcome evidence.

## Errors, Degradation and Recovery

| Failure scenarios | User-visible results | reason_code | Whether to continue | Recovery action | Residual state |
| --- | --- | --- | --- | --- | --- |
| Dependency missing | | | | | |
| Insufficient permissions | | | | | |
| Partial write | | | | | |
| Configuration conflict | | | | | |
| provider is unavailable | | | | | |

Downgrade must be clear: explain unenforced gates, reasons, limitations, and continuation conditions; do not elevate advisory facts to confirmed truths.

## Multi-host and runtime projection

| Host | source | generated runtime | Support / Degradation | Verification method |
| --- | --- | --- | --- | --- |
| Fill in each host row according to the actual target host | | | | |

When involving spec-first, verify the current supported platform set via `getSupportedPlatforms()` (currently includes Claude, Codex, Cursor, Kiro, Qoder, OpenCode, ZCode, Pi); validate only the target platforms relevant to the current requirement and shared impact areas, and do not treat template examples as indicative of a fixed, complete support set.

Source-first: Modify source/generator first, then run the formal init; do not manually edit generated mirrors.

## Upgrade / Compatibility

Clarify product outcomes for old configurations, old commands, old artifact, old runtime, and unsupported platforms; clearly define migration, warning, failure, and rollback boundaries when breaking changes are involved.

## CLI/DevTool supplementary acceptance

- Default parameters, explicit parameters, invalid parameters, and mutually exclusive parameters.
- The mutation is consistent after preview and confirm.
- stdout/stderr/JSON/exit code can be reliably read by the consumer.
- No silent residue on partial failure; clear recovery path.
- Target host source/runtime projection validation is verified within the currently supported scope, differentiating between generation validation, host loading, and actual task performance.

## CLI/DevTool pending issues for closure candidacy

Here it only prompts candidate gaps and does not generate a second set of OQ schema. Decisions regarding changes to public entry points, default behaviors, side effects, output contract, compatibility, or recovery are moved to the canonical `Outstanding Questions` in the output contract; module splitting, dependency libraries, and internal functions are placed in `spec-plan`.
