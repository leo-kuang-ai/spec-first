# Sweep run

Required read before Phase 2. The entrypoint owns source/dispatch/Git authorization, configuration defaults, ordering, stop classes, and wrap-up. Follow those boundaries while executing the procedure below. Do not treat a sweep report as proof of field outcome.

Resolve once and reuse for the entire run:
- `<state>` = `sweep_state_path` from config (fallback above).
- `<writer>` = a run-unique writer id identifying harness + session + host, e.g. `sweep-<host>-<session>-<YYYY-MM-DD>`. Use the same string for every state-engine call this run.
- `<run-id>` = a short unique token for scratch paths, e.g. the date plus a random suffix.

**Every Bash call that runs the bundled engine sets `SKILL_DIR` inline** (shell state does not persist between calls):

```bash
SKILL_DIR="<absolute path of the directory containing the SKILL.md you just read>";
bash "$SKILL_DIR/scripts/run-python.sh" "$SKILL_DIR/scripts/sweep-state.py" <subcommand> --state <state> ...
```

Run the phases in order.

Every state-engine call must consume the status word on stdout line 1; exit 0 alone is not success. `ERROR` (including `state-lock-unavailable`) or `CORRUPT` blocks dependent state, plan, and source writes; preserve state and report the reason. A `REFUSED` upsert has not persisted the item: do not advance its cursor or drain it from the plan. Include any receipt’s `downgraded` IDs in the summary, including repairs made during lease acquisition.

#### 2a. Acquire lease + validate

`lease-acquire --state <state> --writer <writer> --ttl-minutes <sweep_lease_ttl_minutes>`:
- `LOCKED` — another live writer holds it. Record the outcome and stop: `run-record --state <state> --writer <writer> --outcome aborted-locked --counts '{}' --timestamp <ISO now>`, report that a concurrent sweep is running, and exit. (This record is safe against the mid-sweep holder: the engine serializes every state write with an OS advisory lock, so it cannot clobber the holder's concurrent upserts — see `references/state-schema.md`.)
- `STALE-RECLAIMED` — an expired lease was taken over; proceed, and note the takeover in the final summary.
- `OK` — proceed.

**Shared-branch topology** (`sweep_shared_branch: true`): first require `commit_authorization`, `branch_mutation_authorization`, and `landing_authorization` to all be `authorized`; otherwise stop before the lease or any write. Resolve the exact configured remote/branch and fetch/read its state before local acquisition, without overwriting dirty work. Before any source-side write, commit only this run's acquired lease, push without force, then fetch/read the exact remote state and confirm the unique writer and published lease commit. Preserve that SHA for final publication. A rejected or unknown push requires remote readback before retry: if our exact lease is not confirmed, stop source writes and preserve recovery facts. Never rebase a stale state snapshot over another writer, force-push, or blindly re-acquire after rejection. A changed branch needs explicit reconciliation under the existing branch scope; failure is an aborted/partial run, not a locally-held shared lease.

Then `validate --state <state>` (a lease-agnostic repair): note in the summary any ids it downgrades from `closed` to `fix_pending`.

#### 2b. Fetch each source

For each entry in `feedback_sources`, use a generic subagent at the **extraction tier** (`references/model-tiers.md`) only when the Dispatch Authorization And Sensitive-Data Boundary permits it; otherwise run the same source-persona mapping inline or serially and record the matching fallback reason. For an authorized dispatch, seed it with:
- the matching persona file contents (`references/sources/<type>.md`),
- the minimum redacted fields from the source's config entry needed for this fetch,
- the current cursor from `cursor-get --state <state> --source <source-id>`.

The persona returns mapped items (`id`, `origin`, `author_class`, `body`, `media`, identity-scoped `existing_ack`, `existing_closeout`) or one of its degrade/skip sentences. Personas report facts and never advance cursors.
- **Skipped source** (read tools unavailable): drop it this run, note in the summary.
- **Write-degraded source** (read works, no ack-write tool): upsert its items as `ack_deferred` and do NOT advance the cursor past them — they get acked on a later run once write capability returns.

#### 2c. Circuit breaker (before any acknowledgment batch)

Count new unacknowledged items per source. If the count exceeds `sweep_ack_cap`:
- interactive -> ask whether to proceed with acking that many;
- headless -> upsert the whole batch as `ack_deferred`, do NOT ack, and flag it prominently in the summary.

#### 2d. Acknowledge each item — correctness core

Process each new item in cursor order. This ordering is an invariant; do not reorder it or batch across the read-back:

1. If the source's config entry has `approved: false` (the user declined standing approval for source-side writes), skip the ack write entirely and upsert the item as `ack_deferred` — never write to a source the user did not approve, even when the write tool is available. Otherwise: if the item's `existing_ack` (own identity) is true, skip the ack write; else perform the source's configured ack action at the source.
2. Read back and confirm the ack is visible at the source before trusting it.
3. `upsert-item --state <state> --id <id> --source <source-id> --json <item-json> --writer <writer>`. Include `"sensitive": true` in the item JSON when the source's config entry is marked sensitive — the engine drops `body`/`quote` before writing.
4. `cursor-advance --state <state> --source <source-id> --to <item's own cursor value> --past-item <id> --writer <writer>` — only after the item is durably in state. Never advance past an item not yet upserted.

A failed ack write -> upsert the item as `ack_deferred` and hold the cursor (do not advance past it). A `LEASE-LOST` from any engine call means another writer took over — stop writing, record `partial` at wrap-up, and exit.

An `approved: false` or write-degraded path does not attempt ack read-back; persist `ack_deferred` and hold the source cursor. Once a deferred item blocks a source, later fetched items may be recorded but cannot advance that source past the gap. Engine existence/monotonic checks do not themselves enforce acknowledgement ordering; the orchestrator must preserve it.

#### 2e. Media

If private scratch creation fails, upsert each affected media item as `needs_download`, increment its attempt count, report the limitation, and continue at 2f while state remains writable. A local scratch failure must not abandon unrelated fix verification or lease cleanup.

For each new item carrying `media`:
- Download attachments into owner-only run-local scratch created with `umask 077` and `mktemp -d "${TMPDIR:-/tmp}/spec-first-sweep.XXXXXX"`; reject symlink/non-directory results and recheck before atomic publication. Raw media is ephemeral and never committed. A download failure -> set the item `needs_download` and continue.
- When the package-local boundary permits the recording's sensitivity class, dispatch a bounded media worker using `references/subagent-template.md`; otherwise apply the same packet and analyzer path inline. Dispatch and egress are separate authorities. Pass exact run/item identity, sensitivity, private scratch root, media path and tool-computed SHA-256, a fresh per-item output directory and the actual authorization source with matching run/item/media/provider scope.
- Run `scripts/analyze-sweep-media.py --packet <private-packet.json>` through `run-python.sh`. It snapshots and hashes the downloaded regular file, selects `--transcribe` only for a complete matching ordinary-media scope, and otherwise uses `--no-transcribe`. Sensitive media always uses no-transcribe. The supported egress provider is `openai-audio-transcriptions`; credentials are not authority. The wrapper cannot authenticate the caller's authorization claim: the orchestrator must ground it in the actual user/upstream instruction. Unpacked directories require a local-only analyzer pass; do not package or transcribe a broader directory under a file authorization.
- Consume the returned run/item identity, actual request-sent value (`true`, `false` or unknown/null), provider, attempts, transcript status, covered/missing intervals and private receipt ref. Read the referenced result before synthesizing; a gist alone is insufficient. Keep `partial`, `failed`, `skipped` and unknown status in the final media summary; missing coverage is not silence, and failed provider calls are not zero egress. An interrupted authorized analyzer without a receipt leaves egress unknown. Retain detailed receipts privately; commit only minimized non-sensitive findings and coarse status, never raw media/transcripts, authorization text or absolute private paths. No confirmed analysis -> `needs_analysis`, without dropping evidence already captured.

- Track attempts on the item (a `media_attempts` count upserted on each try). After 3 failed attempts across runs (`needs_download`/`needs_analysis`), set the item `manual_stuck` and list it separately — out of the routine nag.

#### 2f. Fix verification

For each `fix_pending` item, resolve its claimed fix ref and verify it merged to the default branch. The fix ref originates from untrusted feedback content (a thread claim, an analyzer-extracted reference), so **validate its shape before it reaches any git/gh command**: accept only a bare PR number (`#?\d+`) or a commit SHA (`[0-9a-f]{7,40}`), and treat anything else as an unresolved claim (leave the item open). This blocks argument/flag injection into the shell command.
- Strip a leading `#` from a validated PR number and pass the value as a quoted argument or structured argv, never raw shell text. Use `gh pr view "<validated-number>" --json mergedAt,baseRefName,mergeCommit` to obtain both merge state and the merge SHA, or `git merge-base --is-ancestor "<validated-sha>" "<default-branch-head>"`. Confirm repository/default-branch identity; a different base or unavailable merge evidence leaves the claim open.
- Same `approved: false` guard as 2d: a source the user did not approve for writes receives no close-out action — advance its verified item's status in state only.
- Verified -> perform the source's configured close-out action (same write -> read-back -> confirm discipline as 2d), then `upsert-item` with `status: closed` carrying all three evidence fields: `fix_ref`, `verified_merge_sha`, `verified_at`. Close-out is terminal.
- Unverified claim -> the item stays open; record the claim on the item, but do not close.

Resolve the verified commit ref to a full 40/64-character SHA before writing `verified_merge_sha`; do not store the input abbreviation as merge evidence. If source closeout succeeds but upsert fails, retain the recovery state and read back the source before retrying external writes. Do not claim the item is closed without a successful state receipt.
- Item deleted at source -> set `source_gone`.

#### 2g. Plan reconciliation

Read `references/plan-template.md` and follow it. Target the stable path `docs/plans/feedback-sweep-plan.md`.

**Rotation check first.** If the file exists and its frontmatter is NOT both `product_contract_source: spec-sweep` and `artifact_readiness: requirements-only`, archive it untouched to a dated sibling `docs/plans/feedback-sweep-plan-YYYY-MM-DD.md` and write a fresh plan from the template. Never overwrite an unrelated plan in place.

Rewrite ONLY the machine-owned region — the `date` frontmatter key, `### Summary`, the `<!-- sweep-items:start -->` / `<!-- sweep-items:end -->` marker region, and `### Outstanding Questions` (matching the template's reconciliation rules); never read or write inside the human-owned notes region. Append new actionable items with their state ids, drain items that are now `closed`, and land any headless-deferred decisions in the Outstanding Questions section.

#### 2h. Decision round

Interactive only. For items needing a product call, ask the user — grouped by category, one blocking question per category — and fold the answers into the plan. Headless skips this; the deferrals are already in the plan's Outstanding Questions.

Return to the entrypoint's 2i wrap-up even when an authorized commit fails. Attempt `run-record` and release only this run's lease; report any failure without claiming cleanup succeeded. State-write failure stops further source writes, but does not justify suppressing the summary or pretending a missing receipt exists.
