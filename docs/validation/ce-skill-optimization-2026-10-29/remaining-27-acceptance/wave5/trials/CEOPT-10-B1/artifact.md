The three declared lifecycle criteria are honored by the parent’s post-reload version B receipt. Keyboard focus remains unverified. This is an assessment of supplied evidence, not a completed worker browser run or a product readiness verdict.

Evidence comes from `wave5/page-lifecycle-receipt.json` and `wave5/feedback-fixture.json`. The former records actual parent-operated browser interaction with a synthetic local page; the latter is explicitly synthetic owner feedback, not an actual user message.

| Case / criterion | Disposition | Evidence and boundary |
|---|---|---|
| Initial version A | Historical observation only | The parent’s first snapshot shows “Ledger fixture A,” “Total: 12,” and “Add entry” disabled. It does not establish version B behavior. |
| Server replacement at the same origin | New server confirmed; current browser document not yet refreshed | Server A, PID `17621`, stopped. Server B, PID `17647`, started on port `57289`. Its HTTP response was `200`, with source hash `77455357199117a2ac6a6189ea13ac30cc2aa1ac078e711ae2fb608190bab96d` and version B content. Server identity and HTTP content alone do not prove the open tab has loaded B. |
| Snapshot after replacement, before reload | Stale version A document | The same browser session still reports “Ledger fixture A,” “Total: 12,” and a disabled button. This is evidence of a stale tab, not a failure of the newly served B document. |
| “Current version B must show Total: 18.” | **Honored after reload** | The parent’s successful reload is followed by a snapshot identifying “Ledger fixture B” and “Total: 18.” The image’s accessible label also becomes “Total 18.” |
| “Add entry must be enabled.” | **Honored after reload**, limited to enabled state | The B HTTP body contains a button without `disabled`; the post-reload browser snapshot reports “Add entry” without the disabled marker present in A. No click, entry creation, persistence, or downstream result was exercised. |
| “A prior version A observation is not acceptance for version B.” | **Honored** | B acceptance uses the post-reload B snapshot and matching server evidence. Neither the initial A snapshot nor the stale snapshot qualifies. |
| Synthetic feedback: “Keep the total18 value and enabled Add entry button.” | Consistent with observed B; preservation intent recorded | The post-reload snapshot supports the requested value and enabled state. This synthetic instruction does not establish real user approval or authorize changes. There is no basis for restoring A’s value or disabled state. |
| Synthetic feedback: “Review keyboard focus; do not claim it fixed from a screenshot alone.” | **Not-exercised** | There is no keyboard traversal, focus observation, keyboard activation, or before/after correction evidence. Enabled state and accessible labels do not prove correct focus behavior. No focus defect or fix can be asserted. |
| Browser-unavailable worker branch | New interaction **not run**; attributed receipt assessment remains possible | This worker performed only permitted file reads. It did not click, reload, capture screenshots, run tests, or delegate browser work. Parent receipts support only their recorded observations. |
| Cleanup | Recorded as successful by the parent | Browser close returned `0`; final cleanup records browser close `0` and server termination `-15`. These are attributed receipt facts, not worker-performed cleanup. |

The observed lifecycle is: load A → replace its server with B at the same origin → retain stale A DOM → reload → observe B. Resume evidence must therefore bind to the served version and document lifecycle, not merely the unchanged URL. The supplied receipt supports that distinction without suggesting a product-source fix.

The feedback identifies `spec-polish` as its workflow owner. Collaborative focus or visual refinement belongs with `spec-polish`; ordinary delegated browser verification belongs with `spec-test-browser`. `spec-dogfood` would be appropriate for a separately scoped, diff-based branch QA run. No workflow was invoked in this read-only assessment.

If browser execution is genuinely unavailable in a subsequent dogfood run, preserve the blocker and use the frozen skill’s prescribed disposition:

“Browser execution owner unavailable. Run `spec-runtime-setup` to inspect browser readiness, then rerun `spec-dogfood`. This does not block spec-first baseline.”

No direct browser fallback is justified. A subsequent authorized dogfood run would use `spec-test-browser` with `mode:pipeline` and an explicitly verified exact loopback origin. The historical parent receipt lists direct `agent-browser` commands; it supports the recorded page observations but does not prove execution through that owner’s wrapper or its exact-origin enforcement contract.

Remaining facets are explicitly unverified:

- **Keyboard accessibility:** focus order, visible focus, focus retention, and keyboard activation require fresh interaction evidence.
- **End-to-end behavior:** clicking “Add entry,” its destination, validation, saved data, and side effects have no supplied evidence. Classify expected effects and establish applicable authority before testing them.
- **Visual quality and responsiveness:** screenshot-save commands succeeded, but this worker did not inspect the image files. No visual, mobile-layout, chart-rendering, or Figma-match verdict follows.
- **Console and network health:** command exit codes and one successful HTTP response do not establish absence of browser console errors or failed requests.
- **Personas, paper cuts, and product alignment:** no product persona or strategy evidence was supplied. No persona-grounded experience verdict is warranted.
- **Other edge cases and regressions:** the stale-tab/reload case is covered; empty, error, boundary, permission, concurrency, and adjacent journey coverage are not established.
- **Branch QA completeness:** no verified PR/base/head, diff, dirty-file identities, branch matrix, or automated-suite result was supplied. Fixture source hashes bind the recorded fixture, not an entire product checkout.
- **Fixes and delivery:** no fixes, regression tests, commits, report-file writes, pushes, or PR actions occurred. No item qualifies as `Fixed`; no suite can be marked passed.

The evidence assessment is complete within the requested read-only scope. Version B’s total and enabled-button criteria pass on attributed post-reload evidence; focus remains open, and overall product or branch readiness is not established.
