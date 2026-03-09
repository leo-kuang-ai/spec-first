# Closure Hardening Minimal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 以 3 个最小 PR，把 `validate`、`confirm policy`、`golive` 三个关键断点收口成更硬的研发闭环。

**Architecture:** 复用现有 `checkMatrix`、`evaluateGate`、`evaluatePolicy`、`checkGoLive`，只在 CLI 聚合层与放行判定层补接线，不新增新的治理引擎。命令边界保持单一职责：`validate` 做收口，`router` 做确认，`golive` 做证据放行。

**Tech Stack:** Node.js 20, TypeScript, Vitest, existing CLI/runtime modules

---

### Task 1: PR1 — `validate` 收口

**Files:**
- Modify: `src/cli/commands/validate.ts`
- Modify: `tests/integration/validate-command.test.ts`
- Read: `src/core/trace-engine/matrix.ts`
- Read: `src/core/gate-engine/gate-evaluator.ts`

**Step 1: Write the failing test**

- 在 `tests/integration/validate-command.test.ts` 增加以下断言：
  - `validate matrix <featureId>` 在断链矩阵下返回失败。
  - `validate matrix <featureId>` 在矩阵完整时返回成功。
  - `validate all <featureId>` 会同时覆盖 `format + matrix + gate`。
  - `validate all <featureId>` 任一子项失败时返回非零退出码。

**Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/integration/validate-command.test.ts`
Expected: FAIL，因为当前 `validate matrix` 仍是占位实现，`validate all` 也只是 `format` 的别名。

**Step 3: Write minimal implementation**

- 在 `src/cli/commands/validate.ts`：
  - `handleMatrixValidation` 调用 `checkMatrix(featureId, projectRoot)`。
  - 若存在 `orphans`、`brokenChains` 或 `vModelPairs`，返回 `ExitCode.VALIDATION_ERROR`。
  - `handleAllValidation` 顺序调用：
    1. `handleFormatValidation`
    2. `handleMatrixValidation`
    3. `evaluateGate`
  - 输出简洁摘要，不复制 `gate check` 的完整展示。
- 保持 `validate` 只做 orchestration，不新增新的校验真源。

**Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run tests/integration/validate-command.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/cli/commands/validate.ts tests/integration/validate-command.test.ts
git commit -m "feat: make validate a real acceptance funnel"
```

---

### Task 2: PR2 — `confirm policy` 落地

**Files:**
- Modify: `src/cli/router.ts`
- Modify: `src/cli/index.ts`
- Modify: `src/cli/parse-utils.ts`
- Modify: `tests/unit/router.test.ts`
- Modify: `tests/integration/skill-integration.test.ts`
- Read: `src/core/skill-runtime/confirm-policy.ts`

**Step 1: Write the failing test**

- 在 `tests/unit/router.test.ts` 增加以下断言：
  - 写命令在 `policy=strict` 且无 `--yes` 时被阻断。
  - 写命令在 `policy=strict` 且有 `--yes` 时允许执行。
  - 读命令不受 `--yes` 影响。
- 在 `tests/integration/skill-integration.test.ts` 增加一条轻量断言：
  - `evaluatePolicy` 的结果与 CLI 实际阻断行为一致，不再只是“纯函数存在”。

**Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/unit/router.test.ts tests/integration/skill-integration.test.ts`
Expected: FAIL，因为当前 router 只计算 policy，但不会阻断执行。

**Step 3: Write minimal implementation**

- 在 `src/cli/index.ts` 为顶层命令增加最小元数据：是否为写命令。
- 在 `src/cli/router.ts`：
  - 增加 `--yes` 检测与消费。
  - 对写命令执行确认策略。
  - 若 `policy !== 'auto'` 且未提供 `--yes`，返回 `ExitCode.VALIDATION_ERROR`。
  - 错误信息必须包含：当前 policy、命令名、重试方式。
- 在 `src/cli/parse-utils.ts` 只补最小 flag 辅助函数；不要引入新的 parser 框架。
- `policy` 上下文最小化读取：
  - `init` 从参数解析 `mode/size`。
  - 其它带 `featureId` 的写命令读取 `specs/<featureId>/stage-state.json`。
  - 无法解析上下文时，保守降级为 `strict`。
- 本 PR 不尝试推断 `hasNfrSec` / `hasNewExternalApi`，保持实现最小。

**Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run tests/unit/router.test.ts tests/integration/skill-integration.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/cli/router.ts src/cli/index.ts src/cli/parse-utils.ts tests/unit/router.test.ts tests/integration/skill-integration.test.ts
git commit -m "feat: enforce confirm policy for mutating commands"
```

---

### Task 3: PR3 — `golive` 证据强制化

**Files:**
- Modify: `src/core/gate-engine/golive.ts`
- Modify: `tests/unit/gate-cli.test.ts`
- Modify: `tests/unit/release-flow-governance.test.ts`
- Read: `src/core/template/artifact-checker.ts`

**Step 1: Write the failing test**

- 在 `tests/unit/gate-cli.test.ts` 增加断言：
  - 缺少 `reports/security-scan.md` 时，`GL-03` 必失败。
  - 只有同时补齐安全报告与 release evidence 时，`golive` 才可能通过对应检查。
- 在 `tests/unit/release-flow-governance.test.ts` 增加断言：
  - `golive` 的失败不再只来自 `GL-05`，缺少安全报告时 `GL-03` 也必须失败。

**Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/unit/gate-cli.test.ts tests/unit/release-flow-governance.test.ts`
Expected: FAIL，因为当前缺失 `security-scan.md` 会被按通过处理。

**Step 3: Write minimal implementation**

- 在 `src/core/gate-engine/golive.ts`：
  - 将 `GL-03` 改为“缺失 `reports/security-scan.md` 直接失败”。
  - 缺文件时 `detail` 明确输出 `missing: reports/security-scan.md`。
  - 保持已有 `GL-01`、`GL-02`、`GL-04`、`GL-05` 逻辑不动。
- 不修改 `gate` 主评估器，不新增新的 `GL-*` 条目。
- 不扩大到 perf/uat 等额外证据，严格控制范围。

**Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run tests/unit/gate-cli.test.ts tests/unit/release-flow-governance.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/core/gate-engine/golive.ts tests/unit/gate-cli.test.ts tests/unit/release-flow-governance.test.ts
git commit -m "feat: require security evidence before golive"
```

---

### Task 4: Focused regression after 3 PRs

**Files:**
- Read: `package.json`

**Step 1: Run focused regression**

Run: `pnpm exec vitest run tests/integration/validate-command.test.ts tests/unit/router.test.ts tests/integration/skill-integration.test.ts tests/unit/gate-cli.test.ts tests/unit/release-flow-governance.test.ts`
Expected: PASS

**Step 2: Run full verification**

Run: `pnpm test && pnpm typecheck && pnpm lint`
Expected: PASS

**Step 3: Validate diff scope**

Run: `git status --short`
Expected: 只包含本计划列出的文件，无无关漂移

**Step 4: Final commit check**

```bash
git log --oneline -3
```

Expected:

- 最近 3 个提交分别对应 `validate`、`confirm policy`、`golive` 三个 PR 主题。

