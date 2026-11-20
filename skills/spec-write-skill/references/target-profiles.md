# Target Profiles

Read only when the target host's metadata, invocation, or packaging will change the delivery. Target profile is a conditional fact accompanied by source and constraints, not a portable contract.

## Open Agent Skills Portable Floor

- Package root contains `SKILL.md`.
- Frontmatter must include at least `name` and `description`.
- `name` uses kebab-case; description expresses the intended trigger and neighboring boundaries.
- Runtime dependencies come only from package resources that are explicitly referenced.
- Unknown extension fields are retained and reported by default; they are not deleted without target evidence.

The portable validator can only verify a subset of YAML supported by the current Skill's declaration. Legal but unsupported YAML returns `incomplete`, without falsely reporting as invalid.

## Codex Profile

Evidence record:

- target: Codex
- source: `https://developers.openai.com/codex/skills`
- local_source: `skills/spec-write-skill/agents/openai.yaml`
- checked_at: 2026-07-12
- verification: `npx jest --runTestsByPath tests/unit/spec-write-skill-contracts.test.js tests/unit/plugin-modules.test.js tests/smoke/cli-smoke.test.js --runInBand`
- limitations: Currently only confirms the Codex-facing sidecar and implicit invocation policy for project package; this field is not extended to other host standards or execution sandbox implementations.
- invalidation_condition: Revalidate and downgrade previous facts when changes occur in Codex official metadata schema, sidecar path, policy key, or runtime projection behavior.

Confirmed source indicates that project packages can provide `agents/openai.yaml` as Codex-facing metadata. `spec-write-skill` Self usage:

```yaml
policy:
  allow_implicit_invocation: false
```

This field only restricts invocation, not equal to execution safety. When involving shell, network, secret, outbound transmission, or irreversible actions, minimum privileges, allowed scopes, confirmation points, and failure behaviors must still be defined in the Skill contract.

## Other Targets

Claude, Cursor, Kiro, Qoder, or other hosts will only add delta when direct evidence is provided in the current project source, official documentation, or the actual packaging result. When there is no confirmed delta:

- Maintain a single portable package;
- Report target readiness as `degraded`;
- Does not translate or activate Codex metadata into equivalent configurations for other hosts; the package is ignored by non-Codex consumers even if it carries the sidecar.
- Do not invent adapter, projection engine, or target-specific sidecar.

## Profile Evidence

Record the following when adding a target rule: target, source URL/path, checked_at, affected fields/files, verification command, limitations, and failure conditions. Expired or unresolvable sources are downgraded to advisory.

## Target Payload Smoke

Call the bundled `inspect-context.cjs` target payload smoke only after direct target evidence has matched and the temporary payload has been prepared by the host/target staging owner:

```bash
node "$SKILL_DIR/scripts/inspect-context.cjs" --payload-smoke <temporary-payload-dir> \
  --runtime-file-set <run-local-runtime-file-set.json> --json
```

It does not create, copy, or execute payload: the `runtime_file_set` must explicitly declare path, consumer, and source-derived `expected_sha256` (reference to `SKILL.md`, selected runtime script/asset, target sidecar, or metadata), and must maintain a bidirectional closure with the actual payload. target readiness is `not-ready` when payload lacks declaration of runtime reference, contains `evals/`, `reports/`, repository-local documentation, or secret-like paths, or when there is drift in metadata/runtime files; it is `degraded` when dynamic dependencies cannot be statically declared. True invocation/init/publish or target-provided validator still requires separate authorization and evidence; smoke cannot infer host feature parity on other hosts.
