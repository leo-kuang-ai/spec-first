---
name: spec-prototype
description: Build a throwaway prototype to answer an unresolved product behavior or visual question before implementation. Use when the question needs a runnable artifact and a human must experience it; do not use for product discovery (route those to spec-ideate or spec-brainstorm), routine polish, production implementation, or unattended runs.
argument-hint: "[question, brainstorm path, or plan path]"
---

# Prototype

Build the smallest runnable artifact that can honestly answer the named question, then hand the decision to the person who will use it.

Do not fake the dimension being tested. Modality, fidelity, and medium follow from that rule. A behavior question is settled by driving the artifact; a visual question is settled by seeing the rendered result. For visual questions, read `references/craft-floor.md`; a behavior question does not load that floor.

This is a throwaway exploration, never the production implementation. The web is the default substrate regardless of the product stack. Do not start when there is no human available to experience the result, when the question is undefined, or in unattended/pipeline mode; return `blocked-human-experience-required`. A direction-exploration request ("explore directions", "what should we build next") is product discovery, not an undefined prototype question: name `spec-ideate` or `spec-brainstorm` as the destination and route out instead of interviewing for a testable question.

## Run-Local Phases

These labels describe the current invocation and its allowed exit; they are not a persisted workflow state machine.

| Phase | Allowed action and user-visible output | Exit condition |
| --- | --- | --- |
| `entry` | Resolve the named question and current owner. | Question is bounded enough to scope, otherwise `unresolved`. |
| `scoping` | Choose behavior/visual modality, throwaway root, options and limitations. | Present the exact prototype question and requested side effects. |
| `awaiting-go-ahead` | Ask before creating files or starting a server. | Explicit go-ahead, or `abandoned`. |
| `building` | Create only the throwaway artifact; do not write production source. | Runnable focused artifact exists, or `unresolved`. |
| `preview-running` | Serve only on explicit loopback and return the local URL. | Human can inspect it, then stop or move to decision. |
| `awaiting-human-decision` | Report options and observed limitations without inferring a winner. | Human selects a direction, leaves it unresolved, or abandons it. |
| `decided` | Write `decisions.md` and hand the decision to `spec-brainstorm` or `spec-plan`. | Decision artifact is written from the human choice. |
| `unresolved` | Preserve the question, artifact path and limitation; do not write `decisions.md`. | Return to the current product owner. |
| `abandoned` | Stop owned preview resources and report that no decision was recorded. | End without production write-back. |

## Boundaries

- Use an isolated directory under `.context/compound-engineering/ce-prototype/<date>-<slug>/` only when `git check-ignore` and ownership/symlink checks pass; otherwise use a private OS temporary root. Never delete a kept prototype.
- Ask for a go-ahead before creating or serving the artifact. Keep credentials out of files, arguments, logs, and handoff artifacts.
- Preview may bind only to `127.0.0.1` or `::1`. CSP blocks external loads/connects; a stop request signals a process only after its PID, root, script and instance identity all match, otherwise it returns a blocked reason.
- After the user experiences the artifact, write `decisions.md` only when a choice is actually made. Include the question, prototype path, winner, rejected options, adjustments, and open questions.
- On apply, hand off to the existing `spec-brainstorm` or `spec-plan` owner. Do not create `spec-proof`, upload an external document, or write production code.

## Output

Return the artifact path, the human decision state, the next owner, and limitations. A passing local check is not a user decision or a production outcome.
