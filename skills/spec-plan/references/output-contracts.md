# Planning Output Contracts

## Owned

Classify low-risk solo planning output as Direct, Chat brief, or Durable before expensive research or dispatch.

## Not Owned

Product decisions, implementation, repository mutation, or execution authorization.

## Trigger

Read when the output-contract gate in `spec-plan/SKILL.md` selects Direct or Chat brief.

## Fallback

If the classification is uncertain, choose Durable and continue the normal planning workflow.

**Direct** is a one-pass result with no user decision and no risk surface. **Chat brief** allows at most one decision and no risk surface. **Durable** is required for ambiguity, multi-pass verification, user-requested files or plans, pipeline/headless execution, existing-plan continuation, or authentication, payment, migration, and external contracts.

Two chat tiers only conclude current **planning output**: deliver in brief text, no child agents dispatched, no confidence checks or document review run; unless explicitly requested, no files are written to `docs/plans/`. `spec-plan` always does not execute code. The "one-time statement and verification" of Direct only validates the existing facts upon which the plan is based, and does not include modifying `src/`, starting services, or running the implementation tests. When the user authorizes "plan then execute", the authorization only avoids repeated prompts; a genuine entry into `spec-work` or returning the previous executing caller that was already running is required. The same planning session or writable tool itself is not considered the executing owner. When no callable `spec-work` is present, verify the canonical execution owner source file of the currently installed package, or confirm that the user has explicitly specified and validated an authoritative canonical source; the mere existence of generated runtime images such as those in `.agents/skills/` does not imply that the source code has been loaded or that the execution owner has been entered. If only such images are available and no viable execution paths exist, the delivery planning results and clear implementation not yet started, handover blockages, and recovery paths shall not be taken on responsibility by oneself.

**Direct result.** Use a few sentences to describe what's changed, where to modify, and how to verify during the implementation phase. If only requesting a plan, a post-delivery optional prompt `spec-work` or user-driven modifications may be provided; if the same request has been authorized for subsequent execution, the result is handover of input, with the owner boundary directly handed over as described above, and the planning statement does not constitute completion of the entire task.

**Chat brief result.****In chat, provide a summary of changes and rationale, implementation of unit with files and test expectations; list a decision line only when a requested or brainstormed summary has been finalized and implemented.**When requesting a plan only, optional prompts include saving as brief or passing to `spec-work`; upon authorization for execution, proceed directly. Both results of chat segmentation can serve as input for `spec-work` sessions; execution of the owner cannot be invoked or loaded, and planning handover blocking remains in effect, without automatic code modification by the planner upon user saying "continue".

## Saving a chat-tier result

A request to save anything this reference cannot produce — another output format, or the full durable-plan floor — is a Durable request whenever it arrives: re-enter the Durable workflow, which owns renderer and artifact rules. Otherwise write the result as a plain Markdown file under `docs/plans/` using the plan filename shape, with frontmatter `title`, `type`, `date`, and `execution: code` for a code deliverable. Reserve the path with exclusive creation; on collision retry with the smallest available numeric suffix before the extension, never overwriting an existing file. Do not set `artifact_contract` or `artifact_readiness`: a saved brief does not carry the unified-plan floor, and labeling it implementation-ready would misinform `spec-work` and `spec-lfg`. `spec-work` treats a saved brief as a legacy plan (no contract field, normal code lifecycle).
