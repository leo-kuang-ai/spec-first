# Full Flow Governance Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make `spec-first` follow a single executable governance model across Skill docs, runtime guards, gate evaluation, and CLI routing.

**Architecture:** First centralize stage/layer governance into one runtime registry, then align `test` / `code-review` / `verify` semantics with that registry, remove Gate dependence on Skill prose, and finally upgrade evidence and orchestration toward a state-driven model. The work is split into P0/P1/P2 so the team can stop after each phase with a coherent system.

**Tech Stack:** TypeScript, Vitest, Markdown skill assets, Node.js 20, ESM

---

### Task 1: P0 建立统一治理注册表

**Files:**
- Create: `src/core/skill-runtime/skill-governance.ts`
- Modify: `src/core/skill-runtime/hard-gate.ts`
- Modify: `src/core/skill-runtime/dispatcher.ts`
- Modify: `src/shared/skill-commands.ts`
- Test: `tests/unit/hard-gate.test.ts`
- Test: `tests/unit/skill-runtime.test.ts`

**Step 1: Write the failing test**

Add assertions for:
- stage-bound skill mappings come from one exported registry
- `code-review` allowed layers are centrally defined
- `verify` allowed layers are centrally defined

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/hard-gate.test.ts tests/unit/skill-runtime.test.ts`
Expected: FAIL because stage/layer governance is still duplicated inside `hard-gate.ts` and `dispatcher.ts`.

**Step 3: Write minimal implementation**

Create `skill-governance.ts` and export:

```ts
export const SKILL_STAGE_BINDINGS = { /* ... */ };
export const SKILL_LAYER_BINDINGS = { /* ... */ };
export const COMMAND_FAMILIES = { /* ... */ };
```

Then update `hard-gate.ts`, `dispatcher.ts`, and `skill-commands.ts` to consume it.

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/hard-gate.test.ts tests/unit/skill-runtime.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/core/skill-runtime/skill-governance.ts src/core/skill-runtime/hard-gate.ts src/core/skill-runtime/dispatcher.ts src/shared/skill-commands.ts tests/unit/hard-gate.test.ts tests/unit/skill-runtime.test.ts
git commit -m "refactor: centralize skill governance rules"
```

### Task 2: P0 收紧 `test` / `code-review` / `verify` 语义边界

**Files:**
- Modify: `skills/spec-first/08-code-review/SKILL.md`
- Modify: `skills/spec-first/09-test/SKILL.md`
- Modify: `skills/spec-first/12-verify/SKILL.md`
- Modify: `skills/spec-first/README.md`
- Modify: `src/core/skill-runtime/dispatcher.ts`
- Modify: `src/core/skill-runtime/hard-gate.ts`
- Test: `tests/unit/skill-runtime.test.ts`
- Test: `tests/unit/hard-gate.test.ts`

**Step 1: Write the failing test**

Add assertions for:
- `code-review --layer completion` is rejected
- `verify` only accepts `completion`
- `test` is no longer stage-bound to `05_verify`

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/skill-runtime.test.ts tests/unit/hard-gate.test.ts`
Expected: FAIL because runtime still accepts `code-review --layer completion` and still binds `test` to `05_verify`.

**Step 3: Write minimal implementation**

- Remove `completion` from `code-review` allowed layers
- Rebind `test` to the planned target stage in the central governance registry
- Update the three Skill docs and `skills/spec-first/README.md` to match runtime semantics

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/skill-runtime.test.ts tests/unit/hard-gate.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add skills/spec-first/08-code-review/SKILL.md skills/spec-first/09-test/SKILL.md skills/spec-first/12-verify/SKILL.md skills/spec-first/README.md src/core/skill-runtime/dispatcher.ts src/core/skill-runtime/hard-gate.ts tests/unit/skill-runtime.test.ts tests/unit/hard-gate.test.ts
git commit -m "refactor: align review verify and test stage semantics"
```

### Task 3: P0 让 Gate 脱离 Skill 文档逻辑耦合

**Files:**
- Modify: `src/core/gate-engine/gate-evaluator.ts`
- Test: `tests/unit/gate-evaluator.test.ts`
- Create: `tests/unit/skill-governance-docs.test.ts`

**Step 1: Write the failing test**

Add assertions for:
- C11 does not fail solely because `03-spec/04-design/08-code-review` Skill 文档缺少引用文字
- 文档引用完整性改由单独 docs/catalog 测试负责

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/gate-evaluator.test.ts tests/unit/skill-governance-docs.test.ts`
Expected: FAIL because `gate-evaluator.ts` still treats Skill doc references as part of C11.

**Step 3: Write minimal implementation**

- Remove Skill prose checks from `evaluateConstitutionAuthorityMapping`
- Keep constitution metadata and feature/global constitution consistency inside Gate
- Move doc/reference checks into a dedicated docs governance test

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/gate-evaluator.test.ts tests/unit/skill-governance-docs.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/core/gate-engine/gate-evaluator.ts tests/unit/gate-evaluator.test.ts tests/unit/skill-governance-docs.test.ts
git commit -m "refactor: decouple gate rules from skill document prose"
```

### Task 4: P1 引入结构化证据账本

**Files:**
- Create: `src/core/skill-runtime/evidence-ledger.ts`
- Modify: `src/core/skill-runtime/hard-gate.ts`
- Modify: `src/core/process-engine/advance.ts`
- Modify: `skills/spec-first/07-code/SKILL.md`
- Modify: `skills/spec-first/08-code-review/SKILL.md`
- Modify: `skills/spec-first/12-verify/SKILL.md`
- Test: `tests/unit/hard-gate.test.ts`
- Test: `tests/e2e/core-flow.test.ts`

**Step 1: Write the failing test**

Add assertions for:
- TDD RED can be read from a structured ledger entry
- plan approval can be read from a structured ledger entry
- `findings.md` is no longer the only machine-readable source

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/hard-gate.test.ts tests/e2e/core-flow.test.ts`
Expected: FAIL because evidence is still parsed only from `findings.md`.

**Step 3: Write minimal implementation**

Create a JSONL ledger API:

```ts
type EvidenceEntry =
  | { type: 'tdd_red'; taskId: string; command: string; exitCode: number; timestamp: string }
  | { type: 'plan_approved'; approver: string; timestamp: string }
  | { type: 'review_result'; layer: string; result: 'pass' | 'fail'; timestamp: string };
```

Update `hard-gate.ts` to prefer the ledger and only fallback to `findings.md` during migration.

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/hard-gate.test.ts tests/e2e/core-flow.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/core/skill-runtime/evidence-ledger.ts src/core/skill-runtime/hard-gate.ts src/core/process-engine/advance.ts skills/spec-first/07-code/SKILL.md skills/spec-first/08-code-review/SKILL.md skills/spec-first/12-verify/SKILL.md tests/unit/hard-gate.test.ts tests/e2e/core-flow.test.ts
git commit -m "feat: add structured governance evidence ledger"
```

### Task 5: P1 收敛命令家族与 Skill 心智

**Files:**
- Modify: `src/cli/commands/feature.ts`
- Modify: `src/core/skill-runtime/dispatcher.ts`
- Modify: `skills/spec-first/README.md`
- Modify: `skills/spec-first/17-feature-list/SKILL.md`
- Modify: `skills/spec-first/18-feature-switch/SKILL.md`
- Modify: `skills/spec-first/19-feature-current/SKILL.md`
- Modify: `skills/spec-first/02-catchup/SKILL.md`
- Modify: `skills/spec-first/11-plan/SKILL.md`
- Modify: `skills/spec-first/14-status/SKILL.md`
- Test: `tests/unit/skill-runtime.test.ts`

**Step 1: Write the failing test**

Add assertions for:
- `feature` remains the primary CLI family
- deprecated feature sub-skills clearly hand off to `spec-first feature ...`
- context-related skills describe non-overlapping responsibilities

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/skill-runtime.test.ts`
Expected: FAIL because skill docs and runtime routing still present fragmented command mental models.

**Step 3: Write minimal implementation**

- Keep `feature list/current/switch` as the canonical CLI path
- Turn `17/18/19` into thin wrappers or deprecation shims
- Reorganize `catchup/status/plan` docs around `recover / observe / decide`

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/skill-runtime.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/cli/commands/feature.ts src/core/skill-runtime/dispatcher.ts skills/spec-first/README.md skills/spec-first/17-feature-list/SKILL.md skills/spec-first/18-feature-switch/SKILL.md skills/spec-first/19-feature-current/SKILL.md skills/spec-first/02-catchup/SKILL.md skills/spec-first/11-plan/SKILL.md skills/spec-first/14-status/SKILL.md tests/unit/skill-runtime.test.ts
git commit -m "refactor: converge feature and context command families"
```

### Task 6: P2 把 `orchestrate` 升级为状态驱动编排器

**Files:**
- Modify: `src/core/skill-runtime/orchestrate-args.ts`
- Modify: `src/core/skill-runtime/dispatcher.ts`
- Modify: `src/core/process-engine/feature.ts`
- Modify: `skills/spec-first/13-orchestrate/SKILL.md`
- Modify: `skills/spec-first/13-orchestrate/references/skill-mapping.md`
- Test: `tests/unit/skill-runtime.test.ts`
- Test: `tests/e2e/core-flow.test.ts`

**Step 1: Write the failing test**

Add assertions for:
- orchestrate recommendations depend on current stage plus available evidence
- orchestrate no longer hardcodes review/test suggestions that violate current governance rules

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/skill-runtime.test.ts tests/e2e/core-flow.test.ts`
Expected: FAIL because orchestration behavior is still dominated by stage-linear mapping.

**Step 3: Write minimal implementation**

- compute next-step recommendations from stage + gate + evidence
- keep `--auto` behavior, but stop encoding obsolete layer/stage assumptions
- update orchestrate docs to explain state-driven decisions

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/skill-runtime.test.ts tests/e2e/core-flow.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/core/skill-runtime/orchestrate-args.ts src/core/skill-runtime/dispatcher.ts src/core/process-engine/feature.ts skills/spec-first/13-orchestrate/SKILL.md skills/spec-first/13-orchestrate/references/skill-mapping.md tests/unit/skill-runtime.test.ts tests/e2e/core-flow.test.ts
git commit -m "feat: make orchestrate state driven"
```

### Task 7: 全链路回归与审查归档

**Files:**
- Create: `docs/04-审查报告/2026-03-07-full-flow-governance-review.md`
- Test: `tests/unit/hard-gate.test.ts`
- Test: `tests/unit/skill-runtime.test.ts`
- Test: `tests/unit/gate-evaluator.test.ts`
- Test: `tests/unit/stage-machine.test.ts`
- Test: `tests/e2e/core-flow.test.ts`

**Step 1: Run focused regression suite**

Run: `npx vitest run tests/unit/hard-gate.test.ts tests/unit/skill-runtime.test.ts tests/unit/gate-evaluator.test.ts tests/unit/stage-machine.test.ts tests/e2e/core-flow.test.ts`
Expected: PASS

**Step 2: Review Git diff and affected files**

Run: `git diff --stat`
Expected: governance-related files only, no unrelated churn.

**Step 3: Write the review report**

Record:
- completed P0/P1/P2 items
- residual risks
- deferred work
- operational guidance for future skill changes

**Step 4: Commit**

```bash
git add docs/04-审查报告/2026-03-07-full-flow-governance-review.md
git commit -m "docs: record full flow governance review"
```
