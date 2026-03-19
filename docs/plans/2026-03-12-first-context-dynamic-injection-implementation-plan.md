# First Context Dynamic Injection Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 打通 `spec-first:first` 到后续 skill 的真实自动上下文注入链路，并让 `backgroundInputStatus` 在补跑 `first` 后持续同步。

**Architecture:** 先新增 `spec-first skill render` 并切换宿主入口，优先修复“真实 skill 调用未接线”的主断点；再引入 V1 精简版 `Context Resolver` 收口背景读取；随后让 `dispatcher` 迁移到 resolver；最后让 `first` 成功后刷新 `stage-state.json` 中缓存化的 `backgroundInputStatus`。实现过程保持现有 runtime truth 模型与 docs 降级路径不变。

**Tech Stack:** TypeScript, Node.js CLI, Vitest, spec-first runtime truth source, Claude/Codex skill registration

---

### Task 1: Add `spec-first skill render`

**Files:**
- Create: `src/cli/commands/skill.ts`
- Modify: `src/cli/index.ts`
- Test: `tests/integration/skill-render.test.ts`

**Step 1: Write the failing CLI integration test**

Create `tests/integration/skill-render.test.ts`:

```ts
it('renders dynamic skill content for spec', () => {
  const exitCode = handleSkill(['render', 'spec', '--feature', FEATURE_ID]);
  expect(exitCode).toBe(0);
  // capture stdout in test helper and assert:
  // - contains original skill body
  // - contains spec-runtime-context
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/integration/skill-render.test.ts`

Expected: FAIL with unknown command or missing handler.

**Step 3: Implement the command**

Create `src/cli/commands/skill.ts` with:

- `handleSkill(args)`
- supported subcommand: `render`
- resolve skill path with `resolveSkillPath(...)`
- render final content with `loadSkill(skillPath, { projectRoot: process.cwd() })`
- print rendered content to stdout

Register in [`src/cli/index.ts`](/Users/kuang/xiaobu/spec-first/src/cli/index.ts):

```ts
registerCommand('skill', '动态渲染 skill 内容', handleSkill);
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/integration/skill-render.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/cli/commands/skill.ts src/cli/index.ts tests/integration/skill-render.test.ts
git commit -m "feat: add dynamic skill render command"
```

### Task 2: Switch Host Skill Registration to Dynamic Proxies

**Files:**
- Modify: `src/shared/skill-commands.ts`
- Test: `tests/unit/skill-command-registration.test.ts`

**Step 1: Write the failing registration tests**

Create or extend `tests/unit/skill-command-registration.test.ts` with assertions that:

```ts
it('writes claude command files that invoke dynamic skill render', () => {
  const content = readFileSync(generatedClaudeCommand, 'utf-8');
  expect(content).toContain('spec-first skill render spec');
});

it('writes codex wrapper skills instead of raw copied body', () => {
  const content = readFileSync(join(generatedCodexSkill, 'SKILL.md'), 'utf-8');
  expect(content).toContain('spec-first skill render');
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/skill-command-registration.test.ts`

Expected: FAIL because current registration still emits static skill wrappers or raw copies.

**Step 3: Implement dynamic proxy registration**

In `src/shared/skill-commands.ts`:

- change Claude command rendering to call `spec-first skill render <skill>`
- keep current command path structure: `.claude/commands/spec-first/<skill>.md`
- for Codex:
  - preserve directory structure under `spec-first/<skill>`
  - replace copied `SKILL.md` body with a small wrapper that points to dynamic render
  - keep frontmatter valid

Do not remove skill assets other than the rendered entry body; preserve references and metadata files as needed.

**Step 4: Run registration tests**

Run: `pnpm vitest run tests/unit/skill-command-registration.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/shared/skill-commands.ts tests/unit/skill-command-registration.test.ts
git commit -m "refactor: register dynamic skill proxies"
```

### Task 3: Add Context Resolver

**Files:**
- Create: `src/core/skill-runtime/context-resolver.ts`
- Modify: `src/core/skill-runtime/first-context.ts`
- Modify: `src/core/skill-runtime/dispatcher.ts`
- Test: `tests/unit/context-resolver.test.ts`

**Step 1: Write the failing resolver tests**

Create `tests/unit/context-resolver.test.ts` with cases for:

```ts
it('returns runtime context when first runtime is healthy', () => {
  const result = resolveSkillContext(TEST_ROOT, 'spec', FEATURE_ID);
  expect(result.source).toBe('runtime');
  expect(result.backgroundInputStatus).toBe('full');
  expect(result.stageViewSummary).toBeTruthy();
});

it('falls back to docs context when runtime is unavailable', () => {
  const result = resolveSkillContext(TEST_ROOT, 'design', FEATURE_ID);
  expect(result.source).toBe('docs');
  expect(result.backgroundInputStatus).toBe('degraded');
});

it('returns none when both runtime and docs are unavailable', () => {
  const result = resolveSkillContext(TEST_ROOT, 'code', FEATURE_ID);
  expect(result.source).toBe('none');
  expect(result.backgroundInputStatus).toBe('blind');
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/context-resolver.test.ts`

Expected: FAIL with missing module/function errors for `context-resolver.ts`.

**Step 3: Write minimal resolver implementation**

Create `src/core/skill-runtime/context-resolver.ts` with:

- `resolveSkillContext(projectRoot, skillName, featureId?)`
- `resolveFeatureId(projectRoot, explicitFeatureId?)`
- runtime-first lookup using:
  - `readFirstRuntimeIndex`
  - `readFirstRuntimeSummary`
  - `readFirstRoleViews`
  - `readFirstStageViews`
- docs fallback using parsing helpers currently embedded in `dispatcher.ts`
- normalized output:
  - `source`
  - `backgroundInputStatus`
  - `stageViewSummary`
  - `roleViewSummary`
  - `firstSummaryLite`
  - `missingAssets`
  - `recommendedAction`

**Step 4: Export reusable helpers instead of duplicating parsing**

Move or extract the stage/role docs parsing helpers currently inside [`src/core/skill-runtime/dispatcher.ts`](/Users/kuang/xiaobu/spec-first/src/core/skill-runtime/dispatcher.ts) so resolver can use them without circular imports.

**Step 5: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/context-resolver.test.ts`

Expected: PASS

**Step 6: Commit**

```bash
git add src/core/skill-runtime/context-resolver.ts src/core/skill-runtime/first-context.ts src/core/skill-runtime/dispatcher.ts tests/unit/context-resolver.test.ts
git commit -m "feat: add first context resolver"
```

### Task 4: Route Dispatcher Through Resolver

**Files:**
- Modify: `src/core/skill-runtime/dispatcher.ts`
- Test: `tests/unit/skill-runtime.test.ts`
- Test: `tests/unit/dispatcher-first-runtime.test.ts`

**Step 1: Write/adjust failing dispatcher tests**

Extend existing tests to verify:

```ts
it('injects spec context using resolver output', () => {
  const content = loadSkill(skillPath, { projectRoot: TMP });
  expect(content).toContain('spec-runtime-context');
  expect(content).toContain('background_input_status: full');
});

it('falls back to docs when runtime is degraded', () => {
  const content = loadSkill(skillPath, { projectRoot: TMP });
  expect(content).toContain('data_source: docs');
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/skill-runtime.test.ts tests/unit/dispatcher-first-runtime.test.ts`

Expected: FAIL because dispatcher still uses legacy inline notice-building logic.

**Step 3: Replace notice builders with resolver-backed formatting**

In `src/core/skill-runtime/dispatcher.ts`:

- keep `loadSkill()` as the central injection point
- replace repeated runtime/docs health checks with:
  - `resolveSkillContext(projectRoot, skillName, featureId?)`
- add a small formatter layer:
  - `formatStageRuntimeNotice(...)`
  - `formatRoleRuntimeNotice(...)`
  - `formatPlanRuntimeNotice(...)`

Do not remove current notice names; preserve existing markers like:

- `spec-runtime-context`
- `design-runtime-context`
- `code-runtime-context`
- `review-runtime-context`
- `verify-runtime-context`

**Step 4: Run tests to verify behavior parity**

Run: `pnpm vitest run tests/unit/skill-runtime.test.ts tests/unit/dispatcher-first-runtime.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/core/skill-runtime/dispatcher.ts tests/unit/skill-runtime.test.ts tests/unit/dispatcher-first-runtime.test.ts
git commit -m "refactor: route runtime notices through context resolver"
```

### Task 5: Sync `backgroundInputStatus` After `first`

**Files:**
- Create: `src/core/skill-runtime/background-status-sync.ts`
- Modify: `src/cli/commands/first.ts`
- Modify: `src/core/process-engine/init.ts`
- Test: `tests/unit/background-status-sync.test.ts`

**Step 1: Write the failing sync tests**

Create `tests/unit/background-status-sync.test.ts`:

```ts
it('updates existing feature stage-state files after first succeeds', () => {
  syncBackgroundInputStatus(TEST_ROOT);
  const state = readJson(stageStatePath);
  expect(state.backgroundInputStatus).toBe('full');
});

it('does not overwrite unrelated stage-state fields', () => {
  syncBackgroundInputStatus(TEST_ROOT);
  const state = readJson(stageStatePath);
  expect(state.currentStage).toBe('02_design');
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/background-status-sync.test.ts`

Expected: FAIL with missing module/function.

**Step 3: Implement the sync module**

Create `src/core/skill-runtime/background-status-sync.ts` with:

- `syncBackgroundInputStatus(projectRoot)`
- scan `specs/*/stage-state.json`
- compute new status via `detectBackgroundInputStatus(projectRoot)`
- patch only:
  - `backgroundInputStatus`
  - `updatedAt`

Then wire it into [`src/cli/commands/first.ts`](/Users/kuang/xiaobu/spec-first/src/cli/commands/first.ts) after successful bootstrap/refresh.

**Step 4: Run tests**

Run: `pnpm vitest run tests/unit/background-status-sync.test.ts`

Expected: PASS

**Step 5: Add a narrow regression in init-related tests if needed**

Ensure init still writes an initial value, but later sync can refresh it.

**Step 6: Commit**

```bash
git add src/core/skill-runtime/background-status-sync.ts src/cli/commands/first.ts src/core/process-engine/init.ts tests/unit/background-status-sync.test.ts
git commit -m "feat: sync background input status after first"
```

### Task 6: Run Full Verification

**Files:**
- Modify: `docs/plans/2026-03-12-first-context-dynamic-injection-design.md`
- Modify: `CHANGELOG.md`

**Step 1: Run targeted tests**

Run:

```bash
pnpm vitest run \
  tests/unit/context-resolver.test.ts \
  tests/unit/skill-runtime.test.ts \
  tests/unit/dispatcher-first-runtime.test.ts \
  tests/unit/skill-command-registration.test.ts \
  tests/unit/background-status-sync.test.ts \
  tests/integration/skill-render.test.ts
```

Expected: all PASS

**Step 2: Run broad safety checks**

Run:

```bash
pnpm test
pnpm typecheck
```

Expected:
- `pnpm test`: PASS
- `pnpm typecheck`: PASS

**Step 3: Update docs**

In the design doc, append a short implementation status section:

- resolver implemented
- dispatcher migrated
- dynamic proxies enabled
- background sync enabled

Also add a concise `CHANGELOG.md` entry.

**Step 4: Commit**

```bash
git add docs/plans/2026-03-12-first-context-dynamic-injection-design.md CHANGELOG.md
git commit -m "docs: record first context dynamic injection rollout"
```
