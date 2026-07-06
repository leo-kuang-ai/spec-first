---
title: "Agent-native architecture governance hardening task pack"
type: "task-pack"
status: "derived"
date: "2026-06-12"
spec_id: "2026-06-12-007-agent-native-architecture-governance"
source_plan: "docs/plans/2026-06-12-007-refactor-agent-native-architecture-governance-plan.md"
source_plan_hash: "sha256:8455d1dcdcd3e907d013731a14e508d9ec40aab89941d419ce9534e23cdb1c74"
generated_by: "spec-write-tasks"
mode: "derived"
target_repo: "."
source_sections:
  - "Requirements"
  - "Scope Boundaries"
  - "Direct Evidence"
  - "Key Technical Decisions"
  - "Implementation Units"
  - "System-Wide Impact"
  - "Risks & Dependencies"
---

# Task Pack: Agent-Native Architecture Governance Hardening

## Overview

This task pack compiles the source plan into six serial execution slices. The split preserves the plan's source-first sequence: fix entry-surface governance, add the lightweight skill contract, centralize production guardrails, normalize taxonomy consumers, add eval/test readiness, then update release/docs/runtime handoff surfaces.

The pack is intentionally serial because the main skill and contract test file are touched by several units. Serial waves avoid unsafe same-wave file overlap and keep each task's done signal observable before the next layer depends on it.

## Source Summary

- **Source plan:** `docs/plans/2026-06-12-007-refactor-agent-native-architecture-governance-plan.md`
- **Task-ready branch:** `compile`. The plan has `spec_id`, six implementation units, clear requirements, file targets, dependency graph, test scenarios, runtime/source boundaries, and deep cross-module scope.
- **Consumed sections:** Requirements, Scope Boundaries, Direct Evidence, Context & Research, Key Technical Decisions, High-Level Technical Design, Implementation Units, System-Wide Impact, Risks & Dependencies, Documentation Plan, Operational / Rollout Notes.
- **Scope boundaries shaping split:** `agent-native-architecture` remains internal-only; generated runtime mirrors are not task-owned; provider-specific docs are advisory; public exposure, broader runtime catalog changes, and full model-graded benchmarks are follow-up work.
- **Implementation-time unknowns:** Whether README files mention this internal skill incorrectly; whether `skills/spec-code-review/SKILL.md` needs an edit after inspecting its pre-existing diff; whether `docs/项目审查/2026-06-12-agent-native-architecture-audit-report.md` needs a follow-up note.

## Traceability Matrix

| Source | Requirement / Acceptance | Task(s) | Validation |
| --- | --- | --- | --- |
| U1 | R1, R7 | T001 | Governance boundary tests and no nonexistent command references |
| U2 | R2, R3 | T002 | Contract-heading, failure-mode, and runtime/source-boundary tests |
| U3 | R3, R6 | T003 | Guardrails reference discoverability and provider-neutrality checks |
| U4 | R4 | T004 | Canonical taxonomy mapping and stale-name drift tests |
| U5 | R5, R6 | T005 | Eval fixture schema/readiness, known drift class coverage, and fresh-source eval status |
| U6 | R7 | T006 | CHANGELOG/docs/runtime impact closeout checks |

## Task Graph

- **T001** establishes the entry-surface boundary and removes false invocation paths.
- **T002** builds on T001 by adding the main skill's lightweight contract and failure modes.
- **T003** depends on T002 because guardrails must be wired through the skill contract and reference routing.
- **T004** depends on T002 and is serialized after T003 because it shares `skills/agent-native-architecture/SKILL.md`, `skills/agent-native-audit/SKILL.md`, and `tests/unit/agent-native-architecture-contracts.test.js`.
- **T005** depends on T003 and T004 because eval readiness should cover the final boundary, guardrail, and taxonomy shape.
- **T006** depends on all previous tasks because changelog/docs/runtime impact must describe the final source changes.

## Execution Waves

- **Wave 1:** T001
- **Wave 2:** T002
- **Wave 3:** T003
- **Wave 4:** T004
- **Wave 5:** T005
- **Wave 6:** T006

## Task Pack Contract

```json
{
  "schema_version": "task-pack/v1",
  "execution_waves": [
    {
      "wave": 1,
      "tasks": ["T001"]
    },
    {
      "wave": 2,
      "tasks": ["T002"]
    },
    {
      "wave": 3,
      "tasks": ["T003"]
    },
    {
      "wave": 4,
      "tasks": ["T004"]
    },
    {
      "wave": 5,
      "tasks": ["T005"]
    },
    {
      "wave": 6,
      "tasks": ["T006"]
    }
  ],
  "tasks": [
    {
      "task_id": "T001",
      "source_unit": "U1",
      "requirement_refs": ["R1", "R7"],
      "goal": "Align agent-native architecture and audit invocation prose with internal-only governance and remove nonexistent public command references.",
      "dependencies": [],
      "files": [
        "skills/agent-native-architecture/SKILL.md",
        "skills/agent-native-audit/SKILL.md",
        "tests/unit/agent-native-architecture-contracts.test.js"
      ],
      "context_refs": [
        "docs/plans/2026-06-12-007-refactor-agent-native-architecture-governance-plan.md#U1-Fix-invocation-and-governance-boundary",
        "src/cli/contracts/dual-host-governance/skills-governance.json",
        "docs/solutions/architecture-patterns/workflow-entrypoint-exposure-contract-2026-04-26.md",
        "docs/solutions/workflow-issues/host-entrypoint-mapping-source-boundary-2026-04-29.md"
      ],
      "entry_hint": "Start by comparing the target skills against their governance records, then update only source prose and focused contract tests.",
      "test_focus": "Internal-only governance is reflected in source prose, audit helper instructions, and contract tests; nonexistent public command references are rejected.",
      "done_signal": "The focused contract test suite fails if `/agent-native-architecture` returns, if action parity is mapped to option 1, or if governance no longer matches the skill boundary.",
      "parallelizable": false,
      "risk_note": "Accidentally promoting this helper to a public entrypoint would expand scope beyond the source plan.",
      "review_gate": "required",
      "review_focus": "Check dual-host entry-surface governance, no public command implication, and no edits to generated runtime mirrors.",
      "stop_if": "A public `spec-*` or `spec-*` entrypoint, command template, or host-delivery change is needed to make the prose coherent.",
      "wave": 1
    },
    {
      "task_id": "T002",
      "source_unit": "U2",
      "requirement_refs": ["R2", "R3"],
      "goal": "Add lightweight contract sections, failure modes, and runtime/source boundary language to the agent-native architecture skill without turning it into a heavyweight workflow.",
      "dependencies": ["T001"],
      "files": [
        "skills/agent-native-architecture/SKILL.md",
        "tests/unit/agent-native-architecture-contracts.test.js"
      ],
      "context_refs": [
        "docs/plans/2026-06-12-007-refactor-agent-native-architecture-governance-plan.md#U2-Add-lightweight-workflow-contract-sections-to-the-architecture-skill",
        "skills/spec-plan/SKILL.md#Workflow-Contract-Summary",
        "docs/10-prompt/结构化项目角色契约.md",
        "docs/solutions/architecture-patterns/rebar-structure-skill-simplification-pattern-2026-06-04.md"
      ],
      "entry_hint": "Use the existing skill as the spine; add compact contract sections before broad reference content instead of moving all reference details into SKILL.md.",
      "test_focus": "Required contract sections, failure modes, and generated runtime source-boundary language are present while the five core principles and route index remain intact.",
      "done_signal": "Contract tests cover Purpose, Invocation Boundary, When To Use, When Not To Use, Inputs, Outputs, Workflow, Failure Modes, Runtime/Source Boundary, and preservation of core principles.",
      "parallelizable": false,
      "risk_note": "Over-expanding the SKILL.md body would violate the plan's steel-frame/light-contract direction.",
      "review_gate": "required",
      "review_focus": "Check that new sections guide consumption without becoming a workflow state machine or duplicating reference material.",
      "stop_if": "The implementation needs to redesign the skill's reference tree or remove existing route options to fit the contract sections.",
      "wave": 2
    },
    {
      "task_id": "T003",
      "source_unit": "U3",
      "requirement_refs": ["R3", "R6"],
      "goal": "Create and wire a provider-neutral production guardrails reference covering sandbox, authority, secrets, approval, audit/tracing, rollback, HITL, and eval readiness.",
      "dependencies": ["T002"],
      "files": [
        "skills/agent-native-architecture/references/runtime-production-guardrails.md",
        "skills/agent-native-architecture/SKILL.md",
        "skills/agent-native-architecture/references/checklists.md",
        "skills/agent-native-architecture/references/mcp-tool-design.md",
        "skills/agent-native-architecture/references/agent-native-testing.md",
        "skills/agent-native-architecture/references/product-implications.md",
        "skills/agent-native-architecture/references/self-modification.md",
        "tests/unit/agent-native-architecture-contracts.test.js"
      ],
      "context_refs": [
        "docs/plans/2026-06-12-007-refactor-agent-native-architecture-governance-plan.md#U3-Add-production-guardrails-reference-and-wire-it-into-existing-references",
        "skills/agent-native-architecture/references/product-implications.md#Approval-and-User-Agency",
        "skills/agent-native-architecture/references/self-modification.md#Required-Guardrails",
        "skills/agent-native-architecture/references/agent-native-testing.md#Failure-Recovery-Tests"
      ],
      "entry_hint": "Draft the new guardrails reference first, then add small cross-links from the main skill, checklist, testing, product, tool-design, and self-modification references.",
      "test_focus": "Guardrails are discoverable from the main skill and checklist, include production safety categories, and avoid provider-specific contract fields.",
      "done_signal": "Contract tests fail if the guardrails reference is missing, unlinked from the main path, or does not cover explicit production-readiness categories.",
      "parallelizable": false,
      "risk_note": "Copying provider-specific SDK fields into spec-first prose would create a moving external contract and undermine provider neutrality.",
      "review_gate": "required",
      "review_focus": "Check provider-neutral safety posture, no comprehensive-security overclaims, and minimal duplication across existing references.",
      "stop_if": "The guardrails design requires adding a new schema, runtime provider integration, public command, or product behavior not declared by the source plan.",
      "wave": 3
    },
    {
      "task_id": "T004",
      "source_unit": "U4",
      "requirement_refs": ["R4"],
      "goal": "Normalize the canonical agent-native taxonomy across the architecture skill, audit helper, reviewer agent, best-practices researcher, and code-review persona references.",
      "dependencies": ["T002", "T003"],
      "files": [
        "skills/agent-native-architecture/SKILL.md",
        "skills/agent-native-audit/SKILL.md",
        "agents/spec-agent-native-reviewer.agent.md",
        "agents/spec-best-practices-researcher.agent.md",
        "skills/spec-code-review/SKILL.md",
        "skills/spec-code-review/references/persona-catalog.md",
        "tests/unit/agent-native-architecture-contracts.test.js"
      ],
      "context_refs": [
        "docs/plans/2026-06-12-007-refactor-agent-native-architecture-governance-plan.md#U4-Normalize-taxonomy-across-audit-helper-reviewer-agent-and-researcher-mapping",
        "agents/spec-agent-native-reviewer.agent.md#Core-Principles",
        "agents/spec-best-practices-researcher.agent.md#Phase-1-Check-Available-Skills-FIRST",
        "skills/spec-code-review/references/persona-catalog.md"
      ],
      "entry_hint": "Fix the stale researcher mapping and add short adapter language where consumer assets intentionally use review-specific labels.",
      "test_focus": "Adjacent assets refer to the actual `agent-native-architecture` source and either use the canonical taxonomy or explicitly map their local categories to it.",
      "done_signal": "Contract tests reject the stale `spec-agent-native-architecture` name and catch unmapped divergent principle lists across audit/reviewer/researcher assets.",
      "parallelizable": false,
      "risk_note": "`skills/spec-code-review/SKILL.md` was dirty at planning time but may since have been committed; re-check its diff at execution time (it may be empty), preserve any unrelated changes, and prefer `persona-catalog.md` if it is sufficient.",
      "review_gate": "required",
      "review_focus": "Check canonical-source wording, consumer-specific exception preservation, and no unrelated edits to the code-review skill if its diff is non-empty at execution time.",
      "stop_if": "Normalizing taxonomy requires changing code-review reviewer selection, output schema, or review workflow behavior beyond wording/mapping.",
      "wave": 4
    },
    {
      "task_id": "T005",
      "source_unit": "U5",
      "requirement_refs": ["R5", "R6"],
      "goal": "Add eval readiness fixtures and stronger unit tests for trigger boundaries, guardrails, failure modes, provider-neutrality, and generated-runtime source boundaries.",
      "dependencies": ["T003", "T004"],
      "files": [
        "skills/agent-native-architecture/evals/examples.json",
        "tests/unit/agent-native-architecture-eval-readiness.test.js",
        "tests/unit/agent-native-architecture-contracts.test.js"
      ],
      "context_refs": [
        "docs/plans/2026-06-12-007-refactor-agent-native-architecture-governance-plan.md#U5-Add-evalreadiness-fixtures-and-strengthen-contract-tests",
        "docs/solutions/workflow-issues/routing-skill-eval-methodology-2026-06-08.md",
        "docs/contracts/workflows/fresh-source-eval-checklist.md",
        "skills/spec-write-tasks/evals/expected-behavior-cases.json"
      ],
      "entry_hint": "Define the eval fixture categories first, then write a focused readiness test that enforces coverage without invoking model-graded benchmarks.",
      "test_focus": "Eval fixtures cover internal-only invocation, public-route refusal/redirect, production guardrail routing, action parity audit mapping, provider-neutral external absorption, X/Twitter limitation handling, and runtime boundary failures.",
      "done_signal": "A new readiness test validates fixture schema and required coverage tags, the existing contract test covers known prompt drift classes, and fresh-source eval is recorded as passed or explicitly not run with reason.",
      "parallelizable": false,
      "risk_note": "Eval fixtures must not become a second implementation plan or encode provider-specific SDK expectations.",
      "review_gate": "required",
      "review_focus": "Check fixture coverage, no provider lock-in, and compatibility with fresh-source eval expectations.",
      "stop_if": "Executable eval readiness requires a new benchmark runner, model-graded harness, or durable artifact schema not declared by the source plan.",
      "wave": 5
    },
    {
      "task_id": "T006",
      "source_unit": "U6",
      "requirement_refs": ["R7"],
      "goal": "Update changelog and any necessary docs or audit follow-up notes, then record runtime regeneration and current-session cache impact for the source changes.",
      "dependencies": ["T001", "T002", "T003", "T004", "T005"],
      "files": [
        "CHANGELOG.md",
        "docs/项目审查/2026-06-12-agent-native-architecture-audit-report.md",
        "README.md",
        "README.zh-CN.md"
      ],
      "context_refs": [
        "docs/plans/2026-06-12-007-refactor-agent-native-architecture-governance-plan.md#U6-Update-docs-changelog-and-runtime-impact-guidance",
        "docs/plans/2026-06-12-007-refactor-agent-native-architecture-governance-plan.md#Documentation-Plan",
        "docs/plans/2026-06-12-007-refactor-agent-native-architecture-governance-plan.md#Operational--Rollout-Notes",
        "docs/solutions/workflow-issues/modify-source-not-artifacts-2026-04-13.md"
      ],
      "entry_hint": "Inspect whether README files or the audit report currently mention the internal skill before editing them; CHANGELOG is required for source changes.",
      "test_focus": "Release/docs surface truthfully states internal-only scope, source/runtime regeneration impact, and whether README/audit-report edits were necessary.",
      "done_signal": "CHANGELOG records the skill/agent/test changes, optional docs edits are justified by existing references, and closeout distinguishes source verification from `spec-first init` runtime regeneration.",
      "parallelizable": false,
      "risk_note": "Advertising the internal helper in README would contradict the source plan's public-exposure non-goal.",
      "review_gate": "required",
      "review_focus": "Check changelog user-visible labeling, README restraint, and source/runtime closeout honesty.",
      "stop_if": "Docs updates require changing public positioning, adding a new public skill entry, or running `spec-first init` without explicit workflow/user authorization.",
      "wave": 6
    }
  ]
}
```

## Task Cards

- T001
  source_unit: U1
  requirement_refs: R1, R7
  goal: Align agent-native architecture and audit invocation prose with internal-only governance and remove nonexistent public command references.
  dependencies: none
  files:
    - `skills/agent-native-architecture/SKILL.md`
    - `skills/agent-native-audit/SKILL.md`
    - `tests/unit/agent-native-architecture-contracts.test.js`
  context_refs:
    - `docs/plans/2026-06-12-007-refactor-agent-native-architecture-governance-plan.md#U1-Fix-invocation-and-governance-boundary`
    - `src/cli/contracts/dual-host-governance/skills-governance.json`
    - `docs/solutions/architecture-patterns/workflow-entrypoint-exposure-contract-2026-04-26.md`
    - `docs/solutions/workflow-issues/host-entrypoint-mapping-source-boundary-2026-04-29.md`
  entry_hint: Start by comparing the target skills against their governance records, then update only source prose and focused contract tests.
  test_focus: Internal-only governance is reflected in source prose, audit helper instructions, and contract tests; nonexistent public command references are rejected.
  done_signal: The focused contract test suite fails if `/agent-native-architecture` returns, if action parity is mapped to option 1, or if governance no longer matches the skill boundary.
  parallelizable: false
  risk_note: Accidentally promoting this helper to a public entrypoint would expand scope beyond the source plan.
  review_gate: required
  review_focus: Check dual-host entry-surface governance, no public command implication, and no edits to generated runtime mirrors.
  stop_if: A public `spec-*` or `spec-*` entrypoint, command template, or host-delivery change is needed to make the prose coherent.
  wave: 1

- T002
  source_unit: U2
  requirement_refs: R2, R3
  goal: Add lightweight contract sections, failure modes, and runtime/source boundary language to the agent-native architecture skill without turning it into a heavyweight workflow.
  dependencies: T001
  files:
    - `skills/agent-native-architecture/SKILL.md`
    - `tests/unit/agent-native-architecture-contracts.test.js`
  context_refs:
    - `docs/plans/2026-06-12-007-refactor-agent-native-architecture-governance-plan.md#U2-Add-lightweight-workflow-contract-sections-to-the-architecture-skill`
    - `skills/spec-plan/SKILL.md#Workflow-Contract-Summary`
    - `docs/10-prompt/结构化项目角色契约.md`
    - `docs/solutions/architecture-patterns/rebar-structure-skill-simplification-pattern-2026-06-04.md`
  entry_hint: Use the existing skill as the spine; add compact contract sections before broad reference content instead of moving all reference details into SKILL.md.
  test_focus: Required contract sections, failure modes, and generated runtime source-boundary language are present while the five core principles and route index remain intact.
  done_signal: Contract tests cover Purpose, Invocation Boundary, When To Use, When Not To Use, Inputs, Outputs, Workflow, Failure Modes, Runtime/Source Boundary, and preservation of core principles.
  parallelizable: false
  risk_note: Over-expanding the SKILL.md body would violate the plan's steel-frame/light-contract direction.
  review_gate: required
  review_focus: Check that new sections guide consumption without becoming a workflow state machine or duplicating reference material.
  stop_if: The implementation needs to redesign the skill's reference tree or remove existing route options to fit the contract sections.
  wave: 2

- T003
  source_unit: U3
  requirement_refs: R3, R6
  goal: Create and wire a provider-neutral production guardrails reference covering sandbox, authority, secrets, approval, audit/tracing, rollback, HITL, and eval readiness.
  dependencies: T002
  files:
    - `skills/agent-native-architecture/references/runtime-production-guardrails.md`
    - `skills/agent-native-architecture/SKILL.md`
    - `skills/agent-native-architecture/references/checklists.md`
    - `skills/agent-native-architecture/references/mcp-tool-design.md`
    - `skills/agent-native-architecture/references/agent-native-testing.md`
    - `skills/agent-native-architecture/references/product-implications.md`
    - `skills/agent-native-architecture/references/self-modification.md`
    - `tests/unit/agent-native-architecture-contracts.test.js`
  context_refs:
    - `docs/plans/2026-06-12-007-refactor-agent-native-architecture-governance-plan.md#U3-Add-production-guardrails-reference-and-wire-it-into-existing-references`
    - `skills/agent-native-architecture/references/product-implications.md#Approval-and-User-Agency`
    - `skills/agent-native-architecture/references/self-modification.md#Required-Guardrails`
    - `skills/agent-native-architecture/references/agent-native-testing.md#Failure-Recovery-Tests`
  entry_hint: Draft the new guardrails reference first, then add small cross-links from the main skill, checklist, testing, product, tool-design, and self-modification references.
  test_focus: Guardrails are discoverable from the main skill and checklist, include production safety categories, and avoid provider-specific contract fields.
  done_signal: Contract tests fail if the guardrails reference is missing, unlinked from the main path, or does not cover explicit production-readiness categories.
  parallelizable: false
  risk_note: Copying provider-specific SDK fields into spec-first prose would create a moving external contract and undermine provider neutrality.
  review_gate: required
  review_focus: Check provider-neutral safety posture, no comprehensive-security overclaims, and minimal duplication across existing references.
  stop_if: The guardrails design requires adding a new schema, runtime provider integration, public command, or product behavior not declared by the source plan.
  wave: 3

- T004
  source_unit: U4
  requirement_refs: R4
  goal: Normalize the canonical agent-native taxonomy across the architecture skill, audit helper, reviewer agent, best-practices researcher, and code-review persona references.
  dependencies: T002, T003
  files:
    - `skills/agent-native-architecture/SKILL.md`
    - `skills/agent-native-audit/SKILL.md`
    - `agents/spec-agent-native-reviewer.agent.md`
    - `agents/spec-best-practices-researcher.agent.md`
    - `skills/spec-code-review/SKILL.md`
    - `skills/spec-code-review/references/persona-catalog.md`
    - `tests/unit/agent-native-architecture-contracts.test.js`
  context_refs:
    - `docs/plans/2026-06-12-007-refactor-agent-native-architecture-governance-plan.md#U4-Normalize-taxonomy-across-audit-helper-reviewer-agent-and-researcher-mapping`
    - `agents/spec-agent-native-reviewer.agent.md#Core-Principles`
    - `agents/spec-best-practices-researcher.agent.md#Phase-1-Check-Available-Skills-FIRST`
    - `skills/spec-code-review/references/persona-catalog.md`
  entry_hint: Fix the stale researcher mapping and add short adapter language where consumer assets intentionally use review-specific labels.
  test_focus: Adjacent assets refer to the actual `agent-native-architecture` source and either use the canonical taxonomy or explicitly map their local categories to it.
  done_signal: Contract tests reject the stale `spec-agent-native-architecture` name and catch unmapped divergent principle lists across audit/reviewer/researcher assets.
  parallelizable: false
  risk_note: `skills/spec-code-review/SKILL.md` was dirty at planning time but may since have been committed; re-check its diff at execution time (it may be empty), preserve any unrelated changes, and prefer `persona-catalog.md` if it is sufficient.
  review_gate: required
  review_focus: Check canonical-source wording, consumer-specific exception preservation, and no unrelated edits to the code-review skill if its diff is non-empty at execution time.
  stop_if: Normalizing taxonomy requires changing code-review reviewer selection, output schema, or review workflow behavior beyond wording/mapping.
  wave: 4

- T005
  source_unit: U5
  requirement_refs: R5, R6
  goal: Add eval readiness fixtures and stronger unit tests for trigger boundaries, guardrails, failure modes, provider-neutrality, and generated-runtime source boundaries.
  dependencies: T003, T004
  files:
    - `skills/agent-native-architecture/evals/examples.json`
    - `tests/unit/agent-native-architecture-eval-readiness.test.js`
    - `tests/unit/agent-native-architecture-contracts.test.js`
  context_refs:
    - `docs/plans/2026-06-12-007-refactor-agent-native-architecture-governance-plan.md#U5-Add-evalreadiness-fixtures-and-strengthen-contract-tests`
    - `docs/solutions/workflow-issues/routing-skill-eval-methodology-2026-06-08.md`
    - `docs/contracts/workflows/fresh-source-eval-checklist.md`
    - `skills/spec-write-tasks/evals/expected-behavior-cases.json`
  entry_hint: Define the eval fixture categories first, then write a focused readiness test that enforces coverage without invoking model-graded benchmarks.
  test_focus: Eval fixtures cover internal-only invocation, public-route refusal/redirect, production guardrail routing, action parity audit mapping, provider-neutral external absorption, X/Twitter limitation handling, and runtime boundary failures.
  done_signal: A new readiness test validates fixture schema and required coverage tags, the existing contract test covers known prompt drift classes, and fresh-source eval is recorded as passed or explicitly not run with reason.
  parallelizable: false
  risk_note: Eval fixtures must not become a second implementation plan or encode provider-specific SDK expectations.
  review_gate: required
  review_focus: Check fixture coverage, no provider lock-in, and compatibility with fresh-source eval expectations.
  stop_if: Executable eval readiness requires a new benchmark runner, model-graded harness, or durable artifact schema not declared by the source plan.
  wave: 5

- T006
  source_unit: U6
  requirement_refs: R7
  goal: Update changelog and any necessary docs or audit follow-up notes, then record runtime regeneration and current-session cache impact for the source changes.
  dependencies: T001, T002, T003, T004, T005
  files:
    - `CHANGELOG.md`
    - `docs/项目审查/2026-06-12-agent-native-architecture-audit-report.md`
    - `README.md`
    - `README.zh-CN.md`
  context_refs:
    - `docs/plans/2026-06-12-007-refactor-agent-native-architecture-governance-plan.md#U6-Update-docs-changelog-and-runtime-impact-guidance`
    - `docs/plans/2026-06-12-007-refactor-agent-native-architecture-governance-plan.md#Documentation-Plan`
    - `docs/plans/2026-06-12-007-refactor-agent-native-architecture-governance-plan.md#Operational--Rollout-Notes`
    - `docs/solutions/workflow-issues/modify-source-not-artifacts-2026-04-13.md`
  entry_hint: Inspect whether README files or the audit report currently mention the internal skill before editing them; CHANGELOG is required for source changes.
  test_focus: Release/docs surface truthfully states internal-only scope, source/runtime regeneration impact, and whether README/audit-report edits were necessary.
  done_signal: CHANGELOG records the skill/agent/test changes, optional docs edits are justified by existing references, and closeout distinguishes source verification from `spec-first init` runtime regeneration.
  parallelizable: false
  risk_note: Advertising the internal helper in README would contradict the source plan's public-exposure non-goal.
  review_gate: required
  review_focus: Check changelog user-visible labeling, README restraint, and source/runtime closeout honesty.
  stop_if: Docs updates require changing public positioning, adding a new public skill entry, or running `spec-first init` without explicit workflow/user authorization.
  wave: 6

## Orientation Evidence

- **provider:** direct-repo-reads
- **posture:** bounded
- **evidence_refs:**
  - `docs/plans/2026-06-12-007-refactor-agent-native-architecture-governance-plan.md`
  - `skills/spec-write-tasks/SKILL.md`
  - `skills/spec-write-tasks/references/task-pack-schema.md`
  - `skills/spec-write-tasks/references/task-quality-guide.md`
  - `docs/tasks/2026-06-12-002-fix-graphify-runtime-visibility-tasks.md`
  - `spec-first tasks hash docs/plans/2026-06-12-007-refactor-agent-native-architecture-governance-plan.md`
- **limitations:**
  - No implementation source edits or tests were run while compiling this derived task pack.
  - The task pack trusts the source plan's file targets and does not re-audit every target file.
  - The current worktree is dirty; implementation must inspect touched files immediately before edits and preserve unrelated changes.

## Validation Notes

- `spec_id` is copied from the source plan.
- `source_plan_hash` was generated with `spec-first tasks hash docs/plans/2026-06-12-007-refactor-agent-native-architecture-governance-plan.md`.
- Task pack value is high because the plan is deep, cross-module, source/runtime-sensitive, and contains overlapping file ownership that benefits from serialized waves.
- The deterministic validator proves identity, freshness, and `Task Pack Contract` structure only. It does not prove semantic task quality.
- All task-owned files are source-of-truth paths; generated runtime mirrors such as `.claude/**`, `.codex/**`, and `.agents/skills/**` are intentionally excluded.
- Because several tasks use `review_gate: required` and touch skill governance, source/runtime boundaries, and workflow prose, this task pack should receive a document review before execution.

## Regeneration Rules

- Regenerate this task pack if the source plan body changes and `source_plan_hash` no longer matches.
- Regenerate rather than patch in place if implementation units are added, removed, split, or materially reordered.
- Return to `spec-plan` if execution reveals a missing public-entrypoint decision, new contract/schema requirement, or source/runtime scope conflict not declared in the source plan.
