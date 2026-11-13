# Publish Approved Candidates

Publishes the approved learning into `docs/solutions/` only after candidate validation and the semantic promotion decision succeed. This reference follows `references/assembly.md` and any selected `references/enhancement.md` checks.

### Phase 2.47: Promotion Decision & Per-Target Atomic Publication

The orchestrator now makes the semantic promotion decision; scripts do not make it. Choose `promote` only when the problem is demonstrably resolved, the cited evidence is relevant to the claims, contradictions with current source are resolved in favor of source, and the invalidation condition describes a concrete re-check trigger. A transcript assertion such as “fixed” or “tests passed” is not outcome evidence. A separate reviewer is useful for high-risk material when dispatch is authorized, but is not a universal prerequisite for ordinary low-risk promotion; record whether semantic validation was independent or inline.

- On `skip`, leave every final durable path unchanged, best-effort remove the private candidates, and emit `Documentation skipped` with the failed semantic or evidence condition.
- On `promote`, first recompute the recorded existence/SHA-256 of every final target. If any target drifted, stop and rebuild/review the affected candidates against the new source; do not overwrite it. Prepare and validate every same-directory temporary file before the first rename. Publish an approved `CONCEPTS.md` candidate first and the primary learning last; each target replacement is atomic, but a multi-target run is not an all-or-nothing filesystem transaction. If a later rename fails after an earlier target was published, report the exact partial publication, keep the run incomplete, and do not emit `Documentation complete` or attempt an unverified overwrite.

The final `docs/solutions/**` path remains untouched until this phase. This is the durable `candidate -> review -> promote` boundary; scratch artifacts are not durable knowledge and are never returned as a successful deliverable.

失效条件沿用 `invalidation_condition`，不另建 `retire_when`。学习依赖外部 bug、工具/平台版本或依赖行为时，条件须写明可观察的变化及只读检查方式，例如上游 issue 的结论与已发布版本的 release notes。单独关闭 issue 不自动证明修复已发布或本项目已采用。删除 workaround、升级依赖后重跑测试等修改仓库的步骤放在正文，不能把检查条件写成自动变更授权。无此类外部依赖时仍记录本地可核查的失效触发条件；不可因上游字段可选而放松本地必填 promotion gate。
