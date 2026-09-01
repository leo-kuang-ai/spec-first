---
title: Windows workspace select exits because arrow tokens are parsed as Escape
date: 2026-07-07
category: docs/solutions/logic-errors
module: CLI prompts
problem_type: logic_error
component: tooling
symptoms:
  - Windows users can highlight parent workspace or all child repositories in `spec-first init`, then the command exits without applying init.
  - The same workspace selection flow works on macOS.
  - `select(requireExplicit)` rejects with `PromptCancelled` when the input stream closes after an unrecognized Windows arrow sequence.
root_cause: logic_error
resolution_type: code_fix
severity: medium
domain: cross-platform CLI prompt input
pattern: normalize terminal arrow-key variants before cancel detection
rejected_alternatives:
  - Treating the workspace target selection as broken was rejected because prompt override tests proved both parent-only and all-repos targets returned valid target objects.
  - Special-casing `spec-first init` workspace selection was rejected because the fault was in the shared prompt tokenizer and affected any explicit select prompt.
applicable_versions:
  - spec-first 1.13.1
invalidation_condition: This learning is stale if prompt input handling switches to a maintained terminal UI library or `select` no longer treats a bare Escape token as cancellation.
source_refs:
  - src/cli/prompts/index.js
  - tests/unit/prompts.test.js
  - tests/unit/init-interactive.test.js
tags:
  - windows
  - cli-prompts
  - tokenizer
  - workspace-init
  - cross-platform
---

# Windows workspace select exits because arrow tokens are parsed as Escape

## Problem

In a parent multi-repo workspace on Windows, `spec-first init` showed the workspace target menu and let the user move to either parent-only or all-repos, but pressing Enter exited without applying init. macOS did not show the same behavior.

## Symptoms

- The prompt displayed options such as parent workspace, all child repos, individual child repos, and cancel.
- Choosing parent workspace or all child repos returned to the shell instead of continuing to preview/apply init.
- The command did not fail with a visible stack trace because `runInit` catches `PromptCancelled` and returns the localized cancelled path with exit code 0.

## What Didn't Work

- Debugging the workspace target value first was insufficient. `collectInteractiveInitTarget` already returns valid target objects for both parent-only and all-repos, and existing `init-interactive` tests cover those branches through prompt overrides.
- Looking only at `buildInitPlan` or `applyWorkspaceInitPlan` missed the trigger. Those paths execute after target selection, but the Windows failure happened inside the shared prompt primitive before target selection resolved.

## Solution

Fix the shared prompt tokenizer instead of the workspace init flow. `select(requireExplicit)` should receive the same normalized up/down tokens regardless of whether the terminal sends classic ANSI, VT/SS3, Windows-style CSI parameters, or legacy key codes.

Before, tokenization only recognized two exact strings:

```javascript
if (text.startsWith('\x1b[A', index) || text.startsWith('\x1b[B', index)) {
  tokens.push(text.slice(index, index + 3));
  index += 2;
  continue;
}
```

That meant a Windows-style sequence such as `\x1b[0B` was split into `\x1b`, `[`, `0`, `B`. The first token is a bare Escape, so `containsCancel(text)` treated it as a user cancellation.

The fix introduces a tokenizer helper that normalizes supported arrow variants to the existing internal `\x1b[A` / `\x1b[B` tokens:

```javascript
const arrowToken = readArrowToken(text, index);
if (arrowToken) {
  tokens.push(arrowToken.token);
  index += arrowToken.length - 1;
  continue;
}
```

The helper handles:

- `\x1b[A` and `\x1b[B`
- CSI variants with parameters, such as `\x1b[0B`
- SS3 variants, such as `\x1bOA` and `\x1bOB`
- legacy Windows key prefixes, such as `\x00H` and `\x00P`

The bare `Esc` cancellation behavior remains intact because only recognized arrow sequences are normalized.

## Why This Works

The causal chain was:

1. The workspace target prompt uses `select(..., { requireExplicit: true })`, so no option is selected until a recognized arrow key moves the cursor.
2. Windows can emit arrow-key byte sequences that are not exactly `\x1b[A` or `\x1b[B`.
3. The old tokenizer split those sequences one byte at a time.
4. The first byte, `\x1b`, matched the cancellation rule for a bare Escape token.
5. `select` rejected with `PromptCancelled`; `runInit` caught it and returned the localized cancelled path with exit code 0.

Normalizing arrow-key variants before cancel detection preserves the prompt contract: directional input moves the selection, while an actual bare Escape still cancels.

## Prevention

- When a prompt relies on raw terminal input, regression tests should include terminal byte variants, not just the sequence produced by the developer's local machine.
- For explicit-selection prompts, include at least one test with `requireExplicit: true`; otherwise the default selected index can hide navigation-token bugs.
- Keep platform-specific fixes at the shared input layer when multiple prompt surfaces consume the same primitive.

The focused regression is `select supports Windows and alternate arrow key sequences` in `tests/unit/prompts.test.js`. The broader guard is `tests/unit/init-interactive.test.js`, which confirms parent workspace and all-repos init branches still work after prompt input changes.

## Related Issues

- No related issue was searched in lightweight mode.
