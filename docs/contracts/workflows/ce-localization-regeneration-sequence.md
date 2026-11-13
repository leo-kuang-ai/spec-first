# CE Localization Regeneration Sequence

本手册定义 CE localization 证据链的显式刷新与验证顺序。历史批次的内部完整性、当前 producer 正确性与当前源码是否已被该批次审查覆盖，是三个不同结论。

## When to run

canonical source 变化会使“当前 CE 闭环已完成”的声明过期，但不会使自洽的历史审查记录失去历史意义。普通 unit 回归检查当前 producer 的精确文件集合/owner/hash/关系，以及历史 artifacts 对其记录的 source binding 的完整性；不要求每次新增 eval 都重签历史语义审查。

只有明确刷新 CE 批次或声明其覆盖当前源码时，才执行下列完整链路，并必须通过 `node scripts/check-ce-localization-review.cjs --verify-closeout`。该显式出口仍对当前 inventory、source hash、语义 receipts 与裁决绑定严格校验；unit 通过不能替代它。禁止为日常回归变绿而批量重绑旧 verdict、静默 refresh 或忽略 current drift。

影响 snapshot 的 canonical roots 包括 `skills/**`、`tests/**`、`scripts/**`、`src/**`、`templates/**`、根 instruction/README/CHANGELOG/package 文件以及未排除的 `docs/**`。

**排除范围：** 以 `scripts/check-ce-upstream-reconciliation.cjs` 的 `isRunOutput()` 和快照内的 `scope_contract.excluded_run_outputs` 为准：仅列出的 V2 工件、`docs/validation/2026-08-19-ce-post-3-20-ledger-patches/**` 与 `docs/validation/ce-localization/**` 被排除。其他 `docs/validation/**`（包括 FSA2 报告和评测清单）仍进入快照，须在最后一次重建链前写完；不能笼统认定整个 validation 目录不会使快照过期。

## Hard ordering rule

> 显式刷新当前 CE 批次时，先完成所有 canonical edits，再执行步骤 1。此后新的源码修改使 current binding 过期；保留历史批次，需重新声明当前闭环时再按差异补证据，不自动伪造复核。

## Sequence

1. `node scripts/check-ce-localization-review.cjs --refresh` — regenerates inventory/coverage with the current dirty manifest.
2. `node scripts/check-ce-upstream-reconciliation.cjs --refresh --prepare-adjudication --ce-repo <compound-engineering-plugin checkout> --base 5c7cb347d0686663743b87cd7227246ba24f7fa7 --head 956087b3e1dd7ccc03df32cee9e7c044dfbe75cf` — regenerates the adjudication **input** (both steps 1–2 must run; their snapshots only agree when both are fresh).
3. LLM adjudication stamp: `target_source_snapshot` must byte-equal `skill-inventory.json`'s `source_snapshot`, `input_artifact_sha256 = sha256(JSON.stringify(input, null, 2) + '\n')`. Policy (`assertCurrentUpstreamBinding`) forbids pure script rebinding — the 517 record decisions must carry a fresh-source verification pass (existence of local refs/owners/tests; upstream refs via `git cat-file` at the pinned head — note the dual-repo semantics of `source_refs`); re-stamping verified decisions is the accepted carry-over, record the method in `review_context`.
4. Review delta: rebuild `reviewed_paths` to exactly the current lane gaps (`collectReviewGaps(openai, deterministic)` + anthropic; schema requires per-path dual-lens verdicts, sha256/bytes/lines) and rebind `source_binding` (6 values from the same deterministic build). `execution_context` is schema-frozen to the inline constant set — disclose the actual review method in `limitations`.
5. `node scripts/generate-ce-localization-closeout.cjs --review-delta docs/validation/ce-localization/review/deltas/<delta>.json`.
6. 先运行两份 CE unit 验证 producer 和证据校验机制，再运行 `node scripts/check-ce-localization-review.cjs --verify-closeout` 验证本次刷新是否实际绑定当前 source。以 exit code 和详细错误判断，不把当前数量写成下一组 unit 常数，也不把结构化计数当作语义复核证明。

## Commit cadence implication

提交会改变 HEAD，可能使严格 current binding 过期；交付应明确记录被审 source snapshot 及后续变化。历史批次内部完整性可继续验证，普通 unit 不应仅因 HEAD/文件数量演进变红。若提交后的当前 CE 完成声明是验收条件，必须重新运行显式验证并对真实差异补证据；不能把长期保持 dirty 或不断重签旧 verdict 当作正常交付策略。
