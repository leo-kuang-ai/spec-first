# Output Mode And Artifact Paths

This owner controls prompt tokens, output/config precedence, renderer selection, and point-of-use path resolution. Read it in full at Phase 0.0 and re-read it where pending values become necessary. Resolve reference paths from the `spec-plan` skill root.

Plans use `docs/plans/`; learnings use `docs/solutions/`. Resolve the target repository only when first composing one of these paths, including a learnings read. An explicit supplied plan path can be inspected without Git discovery. Preserve fixed local paths and `.spec-first/config.local.yaml`; no foreign artifact-root configuration is introduced. File references inside plans are repo-relative; paths printed to the user are absolute.

#### 0.0 Resolve Output Mode

Resolve immediate prompt and in-context preferences first. Defer repository-backed configuration and defaults until an artifact-producing route is known; settle them before renderer selection or artifact-path composition. A terminal no-artifact route never probes configuration for an unused format. Output mode is **exclusive** — the plan is written as either markdown (`.md`) OR HTML (`.html`), never both. Precedence: in-prompt request > user-stated preference > config > default (`md`), with a hard pipeline-mode override.

**Read config only at its point of use.** Resolve `<repo-root>` at runtime by running `git rev-parse --show-toplevel` with the shell tool. Then read `<repo-root>/.spec-first/config.local.yaml` with the native file-read tool. If the root cannot be resolved (not a git repo) or the file does not exist, fall through to the defaults below.

Resolution steps:

1. **In-prompt request.** Reason over the user's prompt for this run for a request about *this document's* output format, expressed either as the `output:` shorthand or in plain language ("make the plan a webpage", "I want this in HTML"). On an explicit format, match it case-insensitively to `md`/`html`, and ignore the `output:` shorthand token when reading the rest of the prompt as the feature description. Distinguish a request about the document's format from a format named as subject matter: "add an HTML export feature" or "plan the CSV importer" is the work, not a doc-format request — do not switch on it.
   - `output:` alone (no value) → no-op, fall through to step 2.
   - `output:<unknown>` (e.g., `output:pdf`) → drop the token, fall through to step 2, and remember to emit a one-line note in the final delivery summary after final resolution: `Ignored unknown output: value '<value>' — using <resolved_format> instead.` where `<resolved_format>` is the value `OUTPUT_FORMAT` actually resolved to after the remaining precedence steps. Do not hardcode `md` in the note — that misleads users when config has set HTML.
2. **User-stated preference.** If this prompt holds no format request, honor an output-format preference (markdown vs HTML) the user established earlier — earlier in this session, in your memory, or written into their active instructions — that is already in your context (match `md`/`html` case-insensitively). A remembered preference is more current than the rarely-edited config, so it **overrides** the config in step 3. Do not open or search instruction files to find it — act only on a preference already present in your context; if none is, fall through to the config.
3. **Config.** If steps 1-2 did not resolve and the configuration read at this boundary has an **active (non-commented)** `plan_output:` key whose value matches `md` or `html` (case-insensitive), use it. Missing, invalid, or commented values fall through silently. Commented template examples are not settings.
4. **Default.** Otherwise `OUTPUT_FORMAT=md`.
5. **Pipeline override.** When invoked from LFG or any `disable-model-invocation` context, force `OUTPUT_FORMAT=md` regardless of steps 1-4. `spec-work` and other automated downstream consumers parse markdown reliably; HTML in pipeline runs is unnecessary friction.

**Token-parsing convention:** only literal-prefix flag tokens (`output:`, `mode:`, the exact `confirm:auto`/`confirm:ask` forms, `delegate:` where applicable) are consumed and stripped. Other `<word>:<word>` tokens — including conventional commit prefixes like `feat:`, `fix:`, `chore:`, and any unrecognized `confirm:<value>` (e.g., a `confirm: delete-account modal` feature description) — pass through verbatim.

**On an artifact-producing route, load the format-rendering reference only after the value settles.** Section content is the same in either format; presentation differs. Both references are paired with `references/plan-sections.md`, which describes what the plan contains regardless of format.

- When `OUTPUT_FORMAT=md`, read `references/markdown-rendering.md` for format principles.
- When `OUTPUT_FORMAT=html`, read `references/html-rendering.md` for format principles.

**Resolve the scoping-confirmation setting.** Resolve immediate prompt and contextual signals first; defer configuration/defaults until the scoping gate actually needs them. Before that gate fires, determine `SKIP_SCOPING_CONFIRM` (boolean, default `false`). `references/intake.md` owns the skip's scope at Phase 0.7; `references/final-review.md` applies the same boundary at Phase 5.1.5. Product blockers remain blocking. Precedence mirrors output mode:

1. **In-prompt request.** `confirm:auto` skips the gate for this run; `confirm:ask` forces it on for this run. Honor an equivalent plain-language instruction the same way ("just write it, don't ask me to confirm" → skip; "ask me before writing the plan" → ask). Consume and strip the token **only** for the two recognized values `confirm:auto` and `confirm:ask`. A bare `confirm:` or any other value (e.g., `confirm:delete-account`) is **not** a flag — leave it verbatim in the feature description and fall through (this is narrower than `output:`, which strips unknown values: `confirm` has only two valid values, and a description can legitimately begin with a word like "confirm:").
2. **User-stated preference.** Honor a scoping-confirmation preference the user established earlier — earlier in this session, in your memory, or written into their active instructions — that is already in your context (e.g., a remembered "stop asking me to confirm plan scope"). A remembered preference overrides the config key. Do not open or search instruction files to find it — act only on a preference already present in your context.
3. **Config.** An **active (non-commented)** `plan_skip_scoping_confirm:` key matching `true`/`false`. Commented (`#`-prefixed) or invalid values fall through silently.
4. **Default.** Otherwise `ask` — the gate fires per the existing tier rules.

Pipeline / `disable-model-invocation` runs already skip the chat confirmation (headless mode), so this setting is moot there.
