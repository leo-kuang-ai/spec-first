# Authoring Workbench

Reading this reference occurs only after both qualification and confirmation of a single project-owned source owner have been completed, and when `base_operation=create|revise` and `effect=apply` are specified. It is the Markdown semantic envelope for this round of preview/closeout, not a persistent schema, general Skill IR, or scaffold writer.

## Tier A Short Path

The Design Record and pre-patch evaluation plan may be waived only if the revision involves typographical errors, counting adjustments, metadata/terminology corrections, or explicit removal of unreachable content or equivalent structural reorganization, and does not alter trigger, schema, contract, threshold, gate, roster, or model routing. It is still necessary to verify the owner, ensure that the current authorization covers the exact write set, generate and validate the mutation preview/write-set binding, and perform the narrowest structure validation. Any change in load behavior immediately returns to the complete authoring path.

## Minimum Design Record

Before substantial content writing, record the `Skill Design Record` in the minimal necessary format: recurring job and user-visible outcome, actual inputs, required outputs/consumers, positive and negative/near-neighbor cases, source owner, authority and side effects, primary failure mode, first verification target, and invalidation condition. Reuse already verified facts without redundantly copying them into tables; mark unknown items as risks or issues and do not speculate or fill in assumptions.

A `Desired Capability Map` should only be developed when there are multiple capability owners/consumers/runtime carriers, resource extraction/ deletion/ addition trade-offs, or high-risk/TCO decision-making scenarios. Only retain columns that affect decisions; select from `capability | owner | consumer | risk | source/runtime carrier | gate/eval | protected behavior | TCO | disposition`; when disposition is needed, use `keep|extract|remove|add`. No map is created and no `not_applicable` placeholder is output when these signals are absent. The script does not parse this record, nor does it make decisions on behalf of anyone.

## Shape And Module Decision

Explicitly record Skill shape together with supporting facts only when the shape causes a change in resource placement, eval family, or architecture; otherwise, use the simplest form that can explain the current patch and proceed. Optional forms include entry governor, knowledge/reference, deterministic setup/validation, artifact-producing workflow, prose/agentic workflow, long-horizon loop, or multi-agent/hybrid; they are decision aids, not script enums.

multi-agent/hybrid: First perform ArchitectureFit – do the subproblems have different evidence directions? Can they be merged? Is the coordination overhead less than the credible benefit gained? Is a single owner still maintained? When any component is insufficient, use a single agent plus on-demand specialists; do not create a fixed roster based on the number of agents provided by the user.

When the module/resource placement actually changes, reallocate the `SKILL.md` spine, triggered references, deterministic scripts, output assets, maintainer-only evaluations, target sidecar files, and project governance. Context topology, measurement, optimization, and lifecycle are loaded only when the corresponding signals are present; they do not affect consumers, risks, or delivery for unselected options, and individual entries are not required to be recorded.

## Eval And Topology Preview

For a restructure, place each moved block in the reference read by the step that executes it. Its former phase or neighboring paragraph does not determine ownership. Keep instructions that must act before a read in the body and put each required-read pointer before its consumer. If one block is misplaced, audit every block moved by that restructure; a corpus match alone cannot prove timely reachability. Remove duplicate rules from references when the body still owns them, then reread moved rules against their new neighbors for changed preconditions.

Even a behavior-preserving Tier A restructure must apply the size and pin audit in [Authoring Method](authoring-method.md#size-restructure-checkpoints) and the applicable evaluation guidance in [Evaluation Design](evaluation-design.md#restructure-coverage). This does not require the full Design Record for Tier A.

Only full apply needs a pre-patch eval plan. For a new Skill, cover a positive case, a negative or near-neighbor case, and the main failure mode. For a revision, pin the previous version and identify the behavior it must preserve. Map each required behavior as `protected_behavior -> source carrier -> contract assertion -> semantic eval case`. Passing the existing suite does not establish coverage for new behavior.

Expand the package topology preview only when changes occur in file sets, resource placement, or runtime carrier; distinguish between spine, triggered references, scripts, assets, maintainer-only evals, target sidecar, and project governance; a single-file revise reports only changed surfaces. New or modified runtime references must still record consumer, trigger condition, must-read, fallback, and eval case; runtime closure must not be claimed when conditions are not met.

## Preview Handoff

Separate semantic preview from private manifest. manifest carries only the canonical/authorized root, snapshot, would-change (path, before hash, after hash, collision disposition, optionally `supporting: true`), preserve/generated/not-touch, planned side effects, and residual risks; do not include the Design Record body in the machine contract. `supporting: true`'s boundary:

- Declare authorized root-level paths outside of `canonical_source_root` (e.g., tests, docs, root CHANGELOG, and other repository-level files that are inevitably touched by deliveries).
- Bound to snapshot, write set, dirty-overlap, and receipt in the same way as canonical paths; exempt only from canonical containment.
- snapshot must cover the canonical `SKILL.md`, all existing declaration paths (including supporting paths), and the entry hash of the most recent existing parent directory of a new file.

The host scope must also provide preview-time dirty paths; any dirty path that is to be rewritten must individually record its current hash, replace/preserve disposition in the manifest, and explicitly indicate that the replacement has been acknowledged or reconfirmed by the current request.

In the host-created private temporary directory, save the run-local manifest/scope/write-set as a directory with permission `0700` and an exclusive-create file with permission `0600`. Call:

```bash
node "$SKILL_DIR/scripts/validate-authoring-preview.cjs" <manifest.json> \
  --authorized-root <confirmed-root> --allowed-paths <scope.json> --write-set <write-set.json> --json
```

The script only verifies structure, hash, containment, snapshot, collision, scope, and write-set binding. The `authorization_claim` is merely a structural field; the host must verify that the exact write set remains within the current authorization, and re-verification is required only when the root/scope is expanded, an uncovered dirty overwrite occurs, or new external/network/high-risk side effects are introduced. A canonical source may only be written when both the host can use atomic conditional patch primitives (expected-old-hash / expected-nonexistence) and symlink/ancestor substitution is rejected. Mutation readiness is `not-ready` when the primitive or exact pre-write binding is missing, and application stops; final recheck or loud convention must not mask TOCTOU. The write-after receipt must carry the actual changed/unchanged paths produced by the primitive, and then verify each path individually against the after hash; a missing actual path list shall prevent completion of the declaration. partial failure reports the current diff, failure reason, and rollback preview, but does not automatically rollback.

**Single-file preview.** Suppose `example-skill/SKILL.md` exists and has no pending edits. The host has verified the exact write set and its ability to apply an atomic conditional patch. Supply the canonical absolute repository path as `root`, the existing file bytes as `before`, and the proposed bytes as `after`. This example builds the three JSON inputs for the command above. It does not establish authorization or write a file.

```js
const path = 'example-skill/SKILL.md';
const sha = bytes => require('node:crypto').createHash('sha256').update(bytes).digest('hex');
const change = { path, before_sha256: sha(before), after_sha256: sha(after) };
const writeSet = [change];
const scope = { paths: [path], dirty_paths: [], pre_write_binding: true, conditional_patch_primitive: 'atomic-expected-hash' };
const manifest = {
  schema_version: 'spec-write-skill.authoring-preview/v1', target_repo_root: root,
  authorized_root: '.', canonical_source_root: 'example-skill', requested_effect: 'apply', authorization_claim: 'ready',
  source_snapshot: { files: [{ path, sha256: change.before_sha256 }] },
  would_change: [{ ...change, collision_disposition: 'replace' }], preserve: [], generated: [], not_touch: [],
  planned_side_effects: [], residual_risks: [],
};
({ manifest, scope, writeSet });
```

After the write, pass the host's actual receipt to `verifyWriteReceipt({ preview, root, writeSet, patch_receipt })` from the same module. Without a receipt, it returns `actual_change_list_unavailable` and `completion_claim_allowed: false` even if the preview passed. Do not construct a receipt from this example.
