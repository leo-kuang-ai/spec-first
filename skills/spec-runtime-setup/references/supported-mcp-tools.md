# Supported MCP Tools

This article summarizes the current `spec-runtime-setup` registry. The machine source of truth is `skills/spec-runtime-setup/setup-registry.json`, with schema version `setup-registry.v11`; the generated host consumes its co-located runtime projection from the loaded skill root.

## Current Required Tools

| Tool | Required | Category | Host config | Command |
| --- | --- | --- | --- | --- |
| Sequential Thinking | Yes | `mcp` | Yes | `npx -y @modelcontextprotocol/server-sequential-thinking@2026.8.31` |
| Context7 | Yes | `mcp` | Yes | `npx -y @upstash/context7-mcp@4.0.7` |
| CodeGraph | Yes, standard setup | `mcp` | Yes | `codegraph serve --mcp` |
| Graphify | Yes, standard setup | `provider-cli` | Project skill/hook | `graphify` |

## Setup Rules

- See [Installation and Graph Readiness](../SKILL.md#installation-and-graph-readiness) for default scopes. With no flags, setup prepares the full artifact baseline in a single project but only diagnoses a multi-repository parent. Ordinary plan and verify calls use installation scope; `--only <graph-id>` and `--requirement-workspace` retain artifact scope.
- Unified registry differentiates between `tools`, `helpers`, and `providers`, while centrally managing dependency pinning, host targeting, platform override, install safety, and artifact contract.
- MCP tools must define deterministic install, host config, detection, summary, and uninstall metadata.
- always-required MCP uses a fixed version via registry; optional helper may still retain latest based on registered policies, and thus cannot be claimed that all dependencies are reproducible.
- required npm warmup: first run `npm pack --ignore-scripts --json`, verify the actual archive's SHA-512, and confirm the name/version/filename/integrity returned by npm; after verification, execute with `npx -y file:<validated-archive> --help`. Summary, version, or archiving structure mismatches will halt execution; mirror retry is not used to mask integrity errors. Download and execution failure still retains the original source and retry facts.
- Warmup cache is located at target's `.spec-first/cache/mcp-warmup/<host>/<platform>/`. `mcp-warmup-cache.v2` binds command hash to the registry package/version/integrity/source digest, retaining successful sources and complete dependency_identity; it does not reuse outdated formats, abnormal timestamps, or mismatched identities. Remove the old successful receipt before actual retry; on failure/interruption, do not rollback to the old ready state. Cache hit attempts is empty; do not pretend to reexecute this time.
- `tool-facts.v2.items[].dependency_identity` is compatible with incremental processing, and `integrity_status=verified` applies only to `verification_scope=top-level-package-archive`. The cached dependency_sha256 is merely a declared identity digest; actual archive verification is based on identity.integrity. The above does not prove that the propagation dependency has been locked, that the user's npx cache is trustworthy, that the host MCP session is callable, or that the business task has been completed.
- `--verify-only` / `--refresh-facts` will re-verify and refresh setup-owned facts, but will not perform installation or host config writes.
- Supported host MCP config targets:
  - Claude Code: managed/user JSON `mcpServers`.
  - Codex: user/system TOML `mcp_servers` sections.
  - Kiro: workspace `.kiro/settings/mcp.json` by default; user `~/.kiro/settings/mcp.json` only with `--user-scope` or `KIRO_USER_SCOPE=1`.
  - Qoder: local `.qoder/settings.local.json` by default; user `~/.qoder/settings.json` only with `--user-scope` or `QODER_USER_SCOPE=1`.
  - Cursor: writes to project `.cursor/mcp.json` by default; writes to user `~/.cursor/mcp.json` only when using `--user-scope`.
- Claude, Kiro, Qoder, and Cursor use JSON `mcpServers`; Codex uses bounded TOML section editing. Both retain irrelevant entries, reject ambiguous or invalid inputs, and require secret-like values to remain as environment references.

## Runtime entry point

First parse the loaded skill directory, then use the public mode argument to invoke `node <loaded-skill-root>/scripts/setup.cjs`. The project cwd must never be used as the root for support-file lookup. `scripts/check-health` is merely a Node compatibility shim for `--check`; Windows directly uses the same `setup.cjs` entry point, with no platform-specific companion.

## Required Helper Tools

Helper readiness is demand-driven: ffmpeg is required only for selected media work and is not baseline-blocking. ast-grep guidance supports structural navigation; `agent-browser` remains report-only/non-blocking for ordinary workflows, and browser execution still requires its own readiness checks. Each helper is not an MCP server, has no host config write, and is reported under `"helper_tools"` in setup-owned facts.

## Project Setup Facts

Setup writes project-local facts under `.spec-first/config/` when target writes are allowed:

- `tool-facts.json`: setup-owned tool and helper readiness facts.
- `runtime-capabilities.json`: setup-owned direct evidence posture and host ledger pointer.

These files are setup facts, not semantic code evidence. Downstream workflows decide what source files, tests, logs, or docs are relevant for the user's task.

## Handoff

After setup:

- If any row is `action-required`, fix that row and rerun setup.
- If a parent workspace target is ambiguous, choose a child repo and rerun with `--repo <child>`.
- If required runtime is ready, continue to the workflow that matches the user intent: plan, work, review, debug, or docs.

### CodeGraph installation archive evidence

The top-level npm archive for CodeGraph 1.6.0 has a fixed SHA-512 and source identifier in the source registry. Skip installation of packages owned by registry Provider during the baseline phase; share the same setup dependency phase and direct Provider apply for required npm warmup archive validation. Owner: first run `npm pack --ignore-scripts --json` to verify actual byte count and name/version, then pass the same `file:<archive>` to `npm install -g`; validation errors will prevent installation. After installation, still verify the actual command version; do not substitute readiness with a npm exit code of 0.

`tool-facts.v2.provider_readiness[].dependency_identity` retains package/version/source/integrity, `installer=npm-pack+npm-install`, `integrity_status=verified`, and `verification_scope=top-level-package-archive`; the CLI normalizer retains valid identities and rejects expanded scopes. This field supports incremental processing; historical installation evidence is not generated for old facts or existing providers that were previously installed but are not installed in this deployment. The original warmup cache still only accepts `npm-pack+npx`. Temporary archiving is cleaned up after success or failure; no Provider installation success cache is generated.

This evidence only covers the top-level shim package and does not prove the trustworthiness of optional platform packages, transitively depended packages, post-installation files, or the current host MCP session; the actual download/ retry source is separately recorded by install_source, mirror_used, and attempts. The integrity of the platform bundle and the current authentication continue to be independently closed in accordance with plan.

### Read-only boundary of CodeGraph npm launcher

Official 1.6.0 npm shim will automatically download when platform packages are missing; even if CODEGRAPH_NO_DOWNLOAD is set, cached bundles will still be cleaned after a historical bundle is hit. The regular real runner (including sync worker) and workspace default runner of Runtime Setup parse the platform package that is installed and version-matched via Provider-owned `codegraph-launcher.cjs`, directly running its entry point; Windows uses the platform node.exe with an independent argv prefix, avoiding execution of the npm .cmd wrapper. Return a structured failure with explicit repair instructions for package missing or identity mismatch; do not rollback the shim or self-heal the cache. The absolute commands for asynchronous workspace are also re-parsed at actual startup time.

This check only identifies npm-known installation layouts and retains existing behavior for non-npm native launchers and non-CodeGraph commands; it is not an arbitrary shell/JS side-effect sandbox. The DI runner's substitute test does not verify the actual startup boundary; the independent, isolated execution covers the default runner. manifest/version match does not equal archive byte verification; supply chain proofs for platform packages and transit dependencies cannot be inferred from this.

### Scope of evidence for provider installation identity

Graphify's `provider-readiness.v2.provider_identity` retains the resolved package/version, command/interpreter, installer, and `inventory_sha256`. The list is processed in a stable order to compute a summary, without outputting the full list of packages; if the list is empty, invalid, or exceeds 10,000 items, it returns null. Figure: apply checks the actual interpreter's distribution identity before release; if version mismatch, it is downgraded to degraded. CLI retains the compatibility increment field and does not generate observation records using the pin field in the plan.

These fields describe the installation environment observed during this probe; they do not constitute a byte-level integrity proof of the installation, nor do they individually prove the availability of the current graph, scope receipt, or host MCP session. After the doctor checks the source snapshot and TTL, it reuses the provider's read-only resolver to verify the current Graphify identity; if any known fields have changed or the actual version does not match, it marks the entry as stale; if the identity is missing, the inventory summary is missing, or the probe fails, it is marked as unknown. Detects no installation, no composition, no query, and does not execute any command recorded in the facts. The normalizer only retains historical observations and does not initiate probes on its own.

Doctor also verifies the current installation identity of CodeGraph; this check does not prove that the CodeGraph database has been bound to the source code at build time, and cannot replace full U8 validation. The provider identity and the source snapshot are both step-wise observations and are not atomic snapshots across files and processes.

Current identity probing shares a 5-second command budget; overflow is marked as unknown; process termination overhead and synchronized file reading do not count toward the strict wall-clock limit. The probe bypasses npm collision diagnosis and disables Python bytecode writing; isolates real Python import testing to verify no new files are added in the HOME/package tree, ensuring this constraint is not a side effect of arbitrary third-party programs within the sandbox. launcher failure or timeout is marked as unknown; it is only marked as stale if a known identity change such as version mismatch occurs upon success.

Graphify artifact scope's doctor checks reuse the existing `graphify-scope-provenance.v1` reader. `provider-readiness.v2.first_generation.scope_provenance` supports optional addition of `graph_sha256`, recording the digest from the verified receipt; the normalizer retains this evidence. doctor compares historical summary, current receipt, and current graph.json; evidence from historical queries cannot be reused if either the graph changes alone or both the graph and the receipt change. Old facts lacking summary, scope, or missing/received receipt are downgraded to unknown; known graph or scope mismatches are marked as stale. Installation scope does not involve verifying graph artifacts.

doctor's receipt/graph read operation uses no-follow/nonblocking fd, regular singly-linked file checks, pre- and post-read identity verification, and actual read limits (receipt 64 KiB, graph 64 MiB); any overflow or variation during read is retained as unknown. This restriction does not alter the existing file reading policies for installed/installed paths, nor does it validate graph semantics.

Composition/refresh reuses the bounded content collection from setup source snapshot; `source_snapshot` is only preserved if the complete content identity is consistent between the two instances, as evidenced by matching receipt values for the three fields: schema_version, source_kind, and source_content_sha256 (v2). This identity covers the predefined source scope of the executed repo/folder, rather than speculating which files were actually read. host/registry/root is still verified by a complete snapshot from tool-facts.

When an old receipt has no source code binding, the verify step can only retain unknown; new bindings must be explicitly generated or refreshed to be written in, and cannot be created by simply re-publishing facts. When there is no HEAD, budget overrun, or insecure source code causing failure in collection, even if the graph/query succeeds, it remains unknown; if source code changes during graph construction, record `graphify-source-changed-during-generation` and downgrade to degraded. doctor compares historical bindings, current receipt, and current source code; the old graph after source code changes cannot become fresh merely because the facts update time is newer. Before-and-after sampling is still not an atomic snapshot and does not guarantee no transient changes during the period.

### CodeGraph current installed identity

`provider-readiness.v2.provider_identity` reuses the same compatibility field to record the npm resolver's actual package/version/installer/command and `inventory_sha256`. The summary only covers the path, name, and version of the main and platform packages, as well as the actual entry point and fixed startup parameters; it does not include business argv, nor does it verify the integrity of installed binaries, passed dependencies, or database contents. It provides a different form of evidence from the top-level download archive verification of `dependency_identity`.

After the Provider performs a prior version/status/query, it executes a `--version` command through the security platform entry point, with a maximum duration of 5 seconds, and then re-parses the installation metadata before and after. Publish only after identity verification; known version/identity changes are downgraded to degraded, unknown for native installations not recognized, missing packages, or probe failures, existing failures are not overridden and the actual lifecycle is retained. Subsequent host configuration confirms that missing identity unknown entries cannot be elevated back to fresh. 5 seconds is the budget for child processes, not a sandbox guarantee against synchronous file reads or side effects of any program.

doctor parses commands only from the current environment and does not execute commands from historical facts. Current identity change is stale; old facts lack identity or current identity cannot be confirmed, resulting in unknown; comparison stops when source/TTL or the previous provider is invalid, and it cannot be claimed that each provider has completed the current probe. Non-NPM native installation continues to preserve the path, but historical fresh behavior is not supported when a verifiable installation identity cannot be established.

### Evidence publication failed

The `write_result` expression represents the result of the last canonical facts publication. After the first successful facts write, the second scenario status write is still considered a actual release: when it fails, `complete=false` and the exit code is non-zero, `execution_summary.overall_status=action-required`; when there is no earlier Provider/baseline principal failure, the reason is `scenario-fingerprint-ledger-update-failed`. Existing master failures are retained at the top level; publication failures are still expressed through `write_result` and scenario limitations. The host ledger is written only after the final facts are successfully published.

The generation of scenario fingerprint still remains advisory; if its failed state is successfully written to canonical facts, setup is not thereby blocked. The default writer performs best-effort recovery upon failure to write paired facts; failure returns without asserting transaction rollback or global atomicity guarantees.

The Provider's path and action-plan pre-check occur before baseline installation, host configuration, and facts writing. When blocked, retain the existing setup error envelope, preserve the original reason, and do not generate a seemingly executed Provider facts. preflight is not cached as part of the post-installation execution plan; after dependency changes, the corresponding provider will re-plan accordingly.


### Workspace Composition Budget and Interruption

The explicit workspace graph build defaults to processing at most 32 confirmed repos, sharing a 15-minute command budget; each subprocess timeout does not exceed the remaining budget. The Provider subprocess propagates SIGINT/SIGTERM as `workspace-build-cancelled`; process timeout takes precedence over `workspace-build-timeout`, and no further Provider, merge, routing, or hook will be initiated. Failure recovery and lease cleanup are still enabled to run, and the budget is not a strict wall-clock limit on sandbox overhead due to synchronous file I/O or process termination.

After the final state is written, if budget review/cancellation occurs within the lease period, any written complete status must be corrected to partial. Return failed write result when write fails, retain the own lease, and ensure status detects unacknowledged receipt; do not treat partial data in memory as successfully persisted to disk. Release the lease after normal correction and successful Provider init rollback, allowing retry. In-place refresh does not guarantee whole-database backup rollback assurance as provided by init; the entire setup process's response to SIGINT, Windows signal handling, and subtree cleanup requires independent validation.


### CodeGraph Index Integrity

Index status uses the native `status --json`, requiring the initialized, version, projectPath/indexPath, worktreeMismatch, pendingChanges, and index fields to be valid. Only proceed to query validation when `index.state=complete`, there are no pending reference resolutions or pending files to process, reconstruction is not recommended, and the path matches. Old `state:null` does not directly support ready; explicit apply requires using the native `index -f` to rebuild and verify again. Missing fields, unknown text, invalid JSON, and work tree mismatches are not supported for indexed.

This fix only corrects status misjudgment and does not make the original status/query read-only: When CodeGraph 1.6.0 opens the database, it may perform recovery and migration. The read-only artifact verify path still awaits migration to be tied with source code, installation identity, and DB/WAL evidence readback; this boundary cannot currently be declared complete.


### CodeGraph artifact evidence (read-only consumption)

Explicitly apply the artifact after the status/query completes by publishing `codegraph-artifact-evidence.v1`, binding the current source snapshot, npm installation identity, `.codegraph/codegraph.db`, and the stable SHA-256 of the WAL/journal sidecar, along with `query_verified`. `--verify-only`: Does not invoke native status/query; reads only the unique historical evidence from facts, re-samples the file set, source code, and installation identity, and verifies TTL, root path, and byte consistency. Missing evidence, sidecar drift, concurrent sampling, identity/source code changes, and expiration are each downgraded to unknown/stale; evidence cannot be generated by re-writing facts.

This evidence limits the claim of CodeGraph database currentness but does not prove semantic graph correctness, MCP server reachability, or cross-host site benefits.
