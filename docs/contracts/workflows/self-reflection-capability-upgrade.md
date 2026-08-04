# Self-Reflection Capability Upgrade Contract

本文件是 spec-first 自我审视与能力升级的 source-level 轻量 contract。它把 Cycle 0 接受的 CUD-001..005 固化为可复用报告结构和 handoff 边界。

它不是新 workflow、command、skill、agent、runtime state machine 或自动 rewrite 系统。

它服务 `docs/contracts/ai-coding-harness.md` 中的 Evaluation Harness 和 Knowledge Harness：评估能力是否真的改善，再把已验证经验沉淀给下一轮。

## Scope

Use this contract when spec-first inspects itself, decides whether capability upgrades are needed, absorbs external/local best practices, hands accepted upgrades to planning, verifies through review, and feeds compound knowledge into the next cycle.

The stable loop is:

```text
自我审视
  -> 能力缺口
  -> 能力升级决策
  -> 最佳实践吸收
  -> plan handoff
  -> review 验证
  -> compound 沉淀
  -> 下一轮自我审视
```

## Non-goals

- Do not add `spec-evolve` by default.
- Do not add a self-reflection agent profile without a named repeated gap.
- Do not build auto-rewrite or auto-upgrade behavior.
- Do not add scripts that decide capability gaps, CUD status, priority, or semantic effectiveness.
- Do not hand-edit `.claude/`、`.codex/`、`.agents/skills/` runtime mirrors.
- Do not treat external projects, GitHub popularity, local reference repos, or generated runtime artifacts as spec-first source truth.
- Do not require compound before there is review or dogfood evidence worth reusing.

## Source And Runtime Boundary

Current source-of-truth inputs:

- `docs/10-prompt/结构化项目角色契约.md`
- `docs/10-prompt/历史快照/角色治理演化-历史/自我进化.md`
- `AGENTS.md` / `CLAUDE.md`
- `skills/`
- `agents/`
- `src/cli/contracts/`
- `docs/contracts/`
- `docs/solutions/`

Cycle artifacts are reviewable evidence, not long-term truth by themselves:

- current cycle reports under `docs/<YYYY-MM-DD>-self-reflection-upgrade/`

Generated/runtime inputs are evidence only:

- `.spec-first/audits/`
- `.spec-first/workflows/`
- `.claude/`
- `.codex/`
- `.agents/skills/`

If source and runtime disagree, source wins. Runtime drift repair uses `spec-first init` only after source validation and only when runtime repair is in scope; choose the target host when prompted.

## Script-Owned Facts And LLM-Owned Judgment

Scripts/tools may prepare:

- file lists
- git commit / branch / dirty state
- artifact timestamps and hashes
- external-tool readiness facts
- schema/shape checks
- command availability and exit codes

LLM/reviewers decide:

- whether a capability gap is real
- whether evidence is strong enough
- whether a CUD is Accepted / Skipped / Deferred
- whether a best practice applies
- whether a plan/review/compound handoff is sufficient
- whether next cycle should revisit a decision

Structural checks may fail a report for missing required fields. They must not decide semantic quality or upgrade priority.

## Required Report Set

Each cycle should write one directory:

```text
docs/<YYYY-MM-DD>-self-reflection-upgrade/
  00-summary.md
  01-composition-baseline.md
  02-capability-gaps.md
  03-industry-github-best-practices.md
  04-capability-upgrade-decisions.md
  05-prioritized-roadmap.md
  06-next-self-reflection-input.md
  07-continuous-iteration-loop.md
```

Every file needs frontmatter:

```yaml
generated_at:
source_commit:
branch:
dirty_state:
reviewed_inputs:
```

If a cycle intentionally writes fewer files, `00-summary.md` must explain why and name the omitted files.

## Evidence Intake

Every external or local practice used for upgrade reasoning should be normalized before it influences CUDs.

| Field | Meaning |
|---|---|
| `source_id` | Stable local id, e.g. `BP-001` or `LOCAL-003` |
| `source_type` | `official_docs`、`github_repo`、`local_reference`、`prior_report`、`compound_doc`、`runtime_artifact` |
| `source_path_or_url` | URL or repo-relative/local path |
| `freshness` | `current`、`recent`、`stale`、`unknown` |
| `evidence_quality` | `strong`、`medium`、`weak` |
| `linked_gap` | Capability gap id, or `none` |
| `applicable_practice` | What can be learned |
| `counter_signal` | Why not copy it directly |
| `decision_use` | `accepted_principle`、`watchlist`、`skipped`、`deferred` |

Rules:

- External practices are watchlist items until linked to a current gap.
- A GitHub star count is never a capability argument by itself.
- Local reference projects are evidence, not source truth.
- Counter-signals are required for any practice that could introduce runtime, agent, script, or command surface area.

## External-Tool Freshness Classification

Self-reflection reports must classify external-tool evidence before using it:

| Status | Meaning | Allowed use |
|---|---|---|
| `current` | artifact/source revision matches current worktree context | primary supporting evidence |
| `stale` | artifact revision or generated timestamp lags current source | advisory only; require fallback source reads |
| `partial` | tool ran but lacks relevant scope or fields | pointers only; require fallback evidence |
| `unavailable` | tool/artifact missing or failed | do not rely on it |
| `not-used` | external-tool evidence was not relevant | no claim |

Reports must state:

- external-tool artifact path
- artifact generated time when available
- recorded source revision when available
- current source revision
- fallback evidence used
- confidence and limitations

## Capability Gap Contract

Each capability gap should include:

- `gap_id`
- `title`
- `evidence`
- `evidence_strength: strong | medium | weak`
- `current_behavior`
- `capability_missing`
- `why_existing_workflow_is_not_enough`
- `impact`
- `candidate_upgrade_level: L0 | L1 | L2 | L3 | L4`
- `counter_signal`
- `decision_candidate: Accepted | Skipped | Deferred | No-CUD`

Do not invent gaps to satisfy format. No-CUD is valid when existing skills are enough.

## CUD Contract

Every Capability Upgrade Decision should include:

- `cud_id`
- `decision: Accepted | Skipped | Deferred | No-CUD`
- `linked_gap`
- `upgrade_proposal`
- `evidence_strength`
- `counter_signal`
- `why_now`
- `why_not_existing_workflow`
- `upgrade_level`
- `best_practice_links`
- `plan_handoff_target`
- `review_expected_by`
- `fresh_source_eval_required: yes | no | conditional`
- `runtime_regeneration_required: yes | no | conditional`
- `compound_expected: yes | no | after_review`
- `effectiveness_check`
- `residual_risk`
- `next_cycle_input`

Accepted CUDs are plan input, not implementation approval. `spec-plan` may accept, revise, reject, defer, or request more evidence.

Skipped and Deferred decisions should still include a next-cycle trigger, so future cycles know when to revisit them.

## CUD Lifecycle Vocabulary

Use these report-level statuses for continuity. They are not a state machine.

| Status | Meaning |
|---|---|
| `accepted_pending_plan` | self-reflection accepted the CUD, no plan yet |
| `planned` | `spec-plan` produced an implementation plan or rejected the CUD with rationale |
| `implemented_pending_review` | source changes exist, review not complete |
| `review_validated` | review confirmed the change satisfies the intended CUD |
| `review_rejected` | review found the change ineffective, risky, or over-scoped |
| `compounded` | reusable lesson was captured after evidence |
| `superseded` | later CUD or source change replaced it |

Reports may use prose instead of machine-readable YAML, but the vocabulary should stay stable enough for humans to compare cycles.

## Plan Handoff

Only Accepted CUDs that need a source change enter roadmap and plan handoff.

Plan handoff must include:

- linked CUD ids
- source-of-truth files likely to change
- explicit non-goals
- validation expectations
- whether skill/agent prose behavior changes
- whether runtime regeneration might be needed
- whether compound is expected after review

Plan handoff must not include implementation code or script-generated semantic decisions.

## Review Expectations

Choose the narrowest review surface:

| Change type | Review path |
|---|---|
| docs/report/contract only | `spec-doc-review` or single-agent report-only fallback |
| skill source prose | bounded source review plus fresh-source eval when semantic behavior matters |
| agent source prose | fresh-source eval and relevant doc/code review |
| CLI/scripts/tests | `spec-code-review` and targeted tests |
| runtime generation | source tests plus host runtime regeneration checks |

Fresh-source eval is required when a source prose change could affect skill/agent routing, behavior, host entrypoints, runtime projection, or generated runtime behavior. It is not required for pure report artifacts unless the report claims to validate changed skill/agent behavior.

If subagent/reviewer dispatch is unavailable, explicitly disabled, or unsafe in the current host runtime, record `fresh_source_eval: not_run` or `single_agent_report_only_fallback: true`; do not claim the stronger gate passed.

## Compound Expectations

Compound only after at least one of these exists:

- reviewed source change
- repeated cycle evidence
- dogfood evidence that a pattern changed behavior
- review finding that should become future guidance

Do not compound:

- unreviewed CUDs
- speculative watchlist practices
- external project summaries with no spec-first gap linkage
- report format alone

Compound docs should link back to the CUD, plan, review evidence, and affected source contract.

## 30-Cycle Loop

The 30-cycle loop is a long-running inspection track, not an instruction to make 30 automatic edits.

| Rounds | Main question |
|---|---|
| 1-3 | Did Accepted CUDs reach plan and review without bloat? |
| 4-6 | Did review validate effectiveness, or only format? |
| 7-9 | Did compound produce reusable guidance? |
| 10-12 | Are repeated gaps disappearing? |
| 13-15 | Are skipped items still correctly skipped? |
| 16-18 | Do deferred L3 ideas now have evidence? |
| 19-21 | Is external practice intake still disciplined? |
| 22-24 | Are source/runtime boundaries still clear? |
| 25-27 | Did developer speed or quality improve? |
| 28-30 | Should this remain report-only, become a template, or be paused until triggered? |

Each cycle should record what changed since the prior cycle. If nothing changed, the cycle should say so and avoid new upgrades.

## Minimum Validation Checklist

Before closing a self-reflection cycle:

- report directory exists
- required report files exist or omissions are explained
- frontmatter fields exist in every report
- every Accepted CUD links to a current capability gap
- every roadmap item links only to Accepted CUDs
- external-tool evidence has freshness status
- plan handoff exists for implementation-oriented Accepted CUDs
- review expectation is named
- compound expectation is named
- generated runtime directories were not hand-edited
- `CHANGELOG.md` is updated for source changes

## Cycle 0 CUD Mapping

| CUD | Fix in this contract |
|---|---|
| CUD-001 | Required report set, source/runtime boundary, loop scope |
| CUD-002 | Evidence intake table and rules |
| CUD-003 | CUD contract, lifecycle vocabulary, plan/review/compound handoff |
| CUD-004 | External-tool freshness classification |
| CUD-005 | Review expectations and fresh-source eval boundary |

Skipped/deferred items remain intentionally unimplemented:

- CUD-006 `spec-evolve`: skipped.
- CUD-007 self-reflection agent profile: skipped.
- CUD-008 L3 eval harness: deferred.
- CUD-009 heavy self-correcting memory runtime: deferred.
