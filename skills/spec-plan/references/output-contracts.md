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

Both chat tiers close the run on their own: deliver the result in chat in plain sentences, dispatch no subagent, run no confidence check or document review, and write nothing under `docs/plans/` unless the user asks for a file. `spec-plan` still never implements; execution starts only when the user grants implementation authority.

**Direct result.** State what changes, where, and how it is verified, in a few sentences, then offer the handoff in one line: hand it to `spec-work` or the user makes the change. A Direct result is complete when the statement and the offer are in chat.

**Chat brief result.** Deliver in chat: a summary of what changes and why, the implementation units with their files and test expectations, and one decisions line only when the request or a brainstorm summary settled a choice the implementer must honor. Close with one line offering to save the brief to a file or hand it to `spec-work`. A Chat brief is complete when the brief and that offer are in chat. "Proceed" after either chat tier hands the statement or brief to `spec-work` as its work prompt; `spec-work`'s session-carried resolution accepts an in-conversation brief as that input.

## Saving a chat-tier result

A request to save anything this reference cannot produce — another output format, or the full durable-plan floor — is a Durable request whenever it arrives: re-enter the Durable workflow, which owns renderer and artifact rules. Otherwise write the result as a plain Markdown file under `docs/plans/` using the plan filename shape, with frontmatter `title`, `type`, `date`, and `execution: code` for a code deliverable. Reserve the path with exclusive creation; on collision retry with the smallest available numeric suffix before the extension, never overwriting an existing file. Do not set `artifact_contract` or `artifact_readiness`: a saved brief does not carry the unified-plan floor, and labeling it implementation-ready would misinform `spec-work` and `spec-lfg`. `spec-work` treats a saved brief as a legacy plan (no contract field, normal code lifecycle).
