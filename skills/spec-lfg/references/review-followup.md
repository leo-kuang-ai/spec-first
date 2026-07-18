# Review followup (LFG step 4–5)

`spec-code-review` is review-only. LFG applies eligible fixes itself; the apply
step must leave verified review fixes in the working tree until the
browser/cleanup gate closes.

## Step 4 — invoke review

```
spec-code-review mode:agent plan:<plan-path-from-step-1>
```

不要传递 `mode:autofix`。`mode:agent` 只输出一个 JSON object；只消费该对象，不读取 Markdown Actionable Findings summary。提取 `status`、`actionable_findings`、`findings`、`artifact_path`、`run_id`、`coverage.dispatch_reason_code` 与 `reviewers`。

应用任何 finding 前，要求 `status: complete`、`coverage.dispatch_reason_code` 为 null，且 reviewer coverage 不只是 `inline-fallback`。JSON 损坏或缺失、status 为 `failed`、`degraded`、`skipped` 或其他不完整时，保留有界 findings 并停止；不得进入 apply、browser、lifecycle、commit、push、PR、tracker 或 CI 步骤。

## Step 5 — apply review fixes locally

### What to apply

Apply a finding in the working tree only when **all** of the following hold:

1. **`suggested_fix` is present** — concrete change shape from the reviewer.
2. **`confidence` is `100`, or `75` with cross-persona agreement noted in the report** — do not apply anchor-50 findings.
3. **The fix is mechanical** — one coherent change, no contract/permission/security posture change, no new public API shape, no behavior change that needs product sign-off.
4. **Evidence still matches the code** at the cited `file:line` before editing.

Do not treat `autofix_class` as permission to auto-apply.

### What not to apply

- `autofix_class: manual` without a clear mechanical `suggested_fix`
- `autofix_class: advisory` — report-only
- `gated_auto` findings that change behavior, contracts, auth, or permissions
- Anything that needs a design conversation

### Execution

1. 只按以上标准过滤 JSON `actionable_findings`。
2. Apply eligible fixes in the working tree in severity order (`#` stable from the review).
3. Run targeted tests when `requires_verification: true` on any applied finding.
4. Leave verified review fixes in the working tree for the later shipping step.
   Do not stage, commit, push, file tracker items, or edit a PR before the
   browser/cleanup gate closes. If no eligible fixes were applied, note that
   explicitly.

## Step 7 — residual handoff

Residuals are actionable findings **not** applied in step 5 — not leftovers from in-skill autofix. Use the Actionable Findings summary / artifact from step 4.
