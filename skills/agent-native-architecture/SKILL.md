---
name: agent-native-architecture
description: Build applications where agents are first-class citizens. Use this skill when designing autonomous agents, creating MCP tools, implementing self-modifying systems, or building apps where features are outcomes achieved by agents operating in a loop.
---

## Purpose

Internal architecture reference/helper for agent-native app design: parity, primitive tools, prompt-native features, shared workspaces, production guardrails, and improvement over time. For full-codebase agent-native architecture audits, read `references/audit-playbook.md` as the audit adapter.

## Canonical Taxonomy

Canonical taxonomy for adjacent audit/review/research assets: **Action parity**, **Primitive tools**, **Shared workspace**, **Context injection**, **Prompt-native features**, **Production guardrails**, **Eval readiness**. Local labels may vary, but must map back here.

## Invocation Boundary

`agent-native-architecture` is an internal architecture reference/helper, not a public `spec-*` workflow. Upstream workflows may read it as bounded context; do not imply a standalone public command.

## When To Use

- Agent-native design/review, primitive tools, MCP surfaces, dynamic capability discovery.
- Action parity, self-modification, prompt-native, shared-workspace, or production-readiness questions.

## When Not To Use

- Public entrypoint, replacement for `spec-plan`/`spec-work`/`spec-code-review`/`spec-doc-review`, provider-specific contract fields, or generated runtime mirror edits.

## Inputs

Bounded architecture question plus relevant source files, product surfaces, tool definitions, prompts, tests, workflow artifacts, and source-scoped advisory external facts.

## Outputs

Source-backed architecture guidance, checklists, capability maps, reference pointers, limitations, and required handoff to public `spec-*` workflows when this reference is not enough.

## Workflow

1. Confirm bounded context or ask one short clarification.
2. Read only the matching reference track.
3. Apply the canonical taxonomy and relevant guardrails.
4. Return source refs, limitations, and public workflow handoff when needed.

## Failure Modes

Generic advice from missing context; unsafe autonomy from weak approvals; provider overfit; invisible prompt drift from missing evals; generated-runtime edits instead of source.

## Reference Routing

Read only the track that matches the task:

- Overview: `references/agent-native-principles.md`
- Architecture/shared workspace: `references/architecture-patterns.md`, `references/files-universal-interface.md`, `references/shared-workspace-architecture.md`, `references/checklists.md`
- Tools/MCP/domain tools: `references/mcp-tool-design.md`, `references/from-primitives-to-domain-tools.md`
- Prompts/context/loop: `references/system-prompt-design.md`, `references/dynamic-context-injection.md`, `references/agent-execution-patterns.md`
- Action parity/full app audit: `references/action-parity-discipline.md`, `references/audit-playbook.md`
- Production autonomy or self-modification: `references/runtime-production-guardrails.md`, `references/self-modification.md`, `references/product-implications.md`
- Mobile/testing/refactoring: `references/mobile-patterns.md`, `references/agent-native-testing.md`, `references/refactoring-to-prompt-native.md`

Route and boundary examples live in `evals/examples.json`; use them for review/eval readiness, not as runtime state.

## Runtime/Source Boundary

The source of truth is `skills/agent-native-architecture/SKILL.md`, `references/`, `evals/examples.json`, and centralized governance in `src/cli/contracts/dual-host-governance/skills-governance.json`. Do not add a per-skill manifest as a second governance source. Generated runtime mirrors are not source-of-truth and must not be hand-edited as source fixes.
