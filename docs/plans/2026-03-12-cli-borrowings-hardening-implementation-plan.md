# CLI Borrowings Hardening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 把 `CLI-Anything` 借鉴分析收敛成可执行的 `spec-first` 代码改造，优先补强真实证据链、安装态 CLI 子进程测试、analyze 差距分析摘要和验证证据落盘。

**Architecture:** 只增强现有 `gate / validate / analyze / tests / reports` 体系，不新增平行治理引擎，不复制 Python 目录结构。实现顺序按“底座能力 -> Gate 接线 -> CLI 用户视角测试 -> Analyze/报告收口”推进，每个 PR 都以测试先行和最小修改为准。

**Tech Stack:** Node.js 20, TypeScript, ESM, Vitest, existing CLI/runtime modules

---

### Task 1: PR1 — Enrich command evidence in `command-gate`

**Files:**
- Modify: `src/core/gate-engine/command-gate.ts`
- Create: `tests/unit/command-gate.test.ts`
- Read: `src/shared/fs-utils.ts`

**Step 1: Write the failing test**

- 在 `tests/unit/command-gate.test.ts` 增加以下断言：
  - 成功命令返回 `pass=true` 且保留 `stdout`。
  - 失败命令返回 `pass=false` 且保留失败摘要。
  - 返回结果包含 `exitCode` 与 `command` 字段。
  - 为后续 artifact 校验预留 `artifactPaths` 字段，默认存在且可为空。

示例断言：

```ts
const result = runCommandGate('node -e "console.log(\'ok\')"', TMP);
expect(result.pass).toBe(true);
expect(result.stdout).toContain('ok');
expect(result.exitCode).toBe(0);
expect(result.command).toContain('node -e');
expect(result.artifactPaths).toEqual([]);
```

**Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/unit/command-gate.test.ts`
Expected: FAIL，因为当前 `CommandExecutionResult` 只有 `pass/detail/stdout`，没有 `exitCode/command/artifactPaths`。

**Step 3: Write minimal implementation**

- 在 `src/core/gate-engine/command-gate.ts`：
  - 扩展 `CommandExecutionResult`：
    - `exitCode?: number`
    - `command?: string`
    - `artifactPaths?: string[]`
  - 成功和失败路径都补齐 `exitCode` 与 `command`。
  - 默认 `artifactPaths` 返回 `[]`，先不在本 PR 实现复杂 artifact 发现逻辑。
  - 保持现有安全边界：
    - 不放宽可执行白名单
    - 不支持新的 shell 运算符

**Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run tests/unit/command-gate.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/core/gate-engine/command-gate.ts tests/unit/command-gate.test.ts
git commit -m "feat: enrich command gate execution evidence"
```

---

### Task 2: PR2 — Wire fresh real-evidence checks into `gate-evaluator`

**Files:**
- Modify: `src/core/gate-engine/gate-evaluator.ts`
- Modify: `tests/unit/gate-evaluator.test.ts`
- Read: `src/core/gate-engine/command-gate.ts`
- Read: `tests/e2e/core-flow.test.ts`

**Step 1: Write the failing test**

- 在 `tests/unit/gate-evaluator.test.ts` 增加以下断言：
  - `04_implement` 阶段在 layer2 配置了真实命令且命令失败时，Gate 必须 FAIL。
  - `04_implement` 阶段在真实命令成功时，新增条件 PASS。
  - `05_verify` 阶段在指定产物文件缺失时，新增条件 FAIL。
  - 新条件的 `detail` 至少包含失败摘要或缺失产物路径。

建议命名：

```ts
it('should FAIL 04_implement when configured fresh evidence command fails', () => {});
it('should FAIL 05_verify when configured evidence artifact is missing', () => {});
```

**Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/unit/gate-evaluator.test.ts`
Expected: FAIL，因为当前 `04_implement` / `05_verify` 只校验覆盖率和合规性，没有真实命令证据条件。

**Step 3: Write minimal implementation**

- 在 `src/core/gate-engine/gate-evaluator.ts`：
  - 为 `04_implement` 增加一个最小条件，例如：
    - `G-IMPL-REAL-01`: configured fresh evidence command succeeds
  - 为 `05_verify` 增加一个最小条件，例如：
    - `G-VERIFY-REAL-01`: configured evidence artifacts exist
  - 读取当前已有的 layer2 / feature 上下文配置，不引入新的配置体系。
  - 仅支持最小字段：
    - `command`
    - `artifacts`
  - `detail` 中保留：
    - 执行命令摘要
    - 最后失败信息
    - 缺失文件路径

**Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run tests/unit/gate-evaluator.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/core/gate-engine/gate-evaluator.ts tests/unit/gate-evaluator.test.ts
git commit -m "feat: require fresh evidence in implement and verify gates"
```

---

### Task 3: PR3 — Make `validate all` surface real evidence

**Files:**
- Modify: `src/cli/commands/validate.ts`
- Modify: `tests/integration/validate-command.test.ts`
- Read: `src/core/gate-engine/gate-evaluator.ts`

**Step 1: Write the failing test**

- 在 `tests/integration/validate-command.test.ts` 增加以下断言：
  - `validate all <featureId>` 在 Gate 因真实证据条件失败时返回非零。
  - `validate all <featureId>` 在真实证据条件通过时返回成功。
  - `validate all <featureId>` 的输出包含简要 gate 结果摘要，而不是静默通过。

示例断言：

```ts
const result = handleValidate(['all', FEATURE_ID], { projectRoot: TEST_ROOT });
expect(result).toBe(2);
```

**Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/integration/validate-command.test.ts`
Expected: FAIL，因为当前 `validate all` 没有针对新证据条件做额外断言准备。

**Step 3: Write minimal implementation**

- 在 `src/cli/commands/validate.ts`：
  - 保持 `format -> matrix -> gate` 顺序不变。
  - 当 Gate 失败时，输出包含：
    - 当前阶段
    - 失败状态
    - Gate 结果摘要
  - 不复制 `gate check` 全量输出，只补必要摘要。
  - 若未来要写 `verification-evidence.md`，这里先只预留聚合点，不在本 PR 落盘。

**Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run tests/integration/validate-command.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/cli/commands/validate.ts tests/integration/validate-command.test.ts
git commit -m "feat: surface real evidence results in validate all"
```

---

### Task 4: PR4 — Add installed-style CLI subprocess E2E

**Files:**
- Create: `tests/e2e/cli-subprocess.test.ts`
- Modify: `package.json`
- Read: `tests/e2e/core-flow.test.ts`
- Read: `tests/e2e/error-paths.test.ts`

**Step 1: Write the failing test**

- 新建 `tests/e2e/cli-subprocess.test.ts`，覆盖以下场景：
  - `spec-first --help`
  - `spec-first init --feat ... --mode ... --size ... --platforms ...`
  - `spec-first validate format <featureId>`
  - 一个错误路径，例如缺少参数时返回非零

建议结构：

```ts
describe('CLI subprocess', () => {
  it('should print top-level help', () => {});
  it('should init a feature from subprocess', () => {});
  it('should fail with non-zero exit code on invalid args', () => {});
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/e2e/cli-subprocess.test.ts`
Expected: FAIL，因为文件不存在。

**Step 3: Write minimal implementation**

- 在 `tests/e2e/cli-subprocess.test.ts`：
  - 实现 `resolveCli()`：
    - 优先 `which('spec-first')`
    - fallback 到 `[process.execPath, 'dist/cli/index.js']`
  - 子进程调用统一使用 `spawnSync` 或 `execFileSync` 的封装
  - 每个测试在临时目录运行，不直接 import CLI handler
- 在 `package.json`：
  - 如有必要，补一个最小脚本帮助本地预构建，例如继续复用现有 `build`
  - 不新增新的测试框架或 runner

**Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run tests/e2e/cli-subprocess.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/e2e/cli-subprocess.test.ts package.json
git commit -m "test: add installed-style cli subprocess coverage"
```

---

### Task 5: PR5 — Upgrade `analyze` report and write verification evidence

**Files:**
- Modify: `src/core/gate-engine/sca.ts`
- Modify: `src/cli/commands/analyze.ts`
- Modify: `tests/unit/cli-commands.test.ts`
- Create: `tests/unit/analyze-report.test.ts`
- Create: `src/shared/verification-evidence.ts`
- Create: `tests/unit/verification-evidence.test.ts`
- Read: `src/shared/fs-utils.ts`

**Step 1: Write the failing test**

- 在 `tests/unit/cli-commands.test.ts` 增加以下断言：
  - `handleAnalyze` 生成的报告包含 `已满足 / 缺失项 / 风险 / 建议` 区块。
- 新建 `tests/unit/analyze-report.test.ts`：
  - 针对 `renderAnalysisReport` 或同类函数，断言新结构存在。
- 新建 `tests/unit/verification-evidence.test.ts`：
  - 验证证据摘要写入固定路径。
  - 输出包含命令、退出码、关键产物和结论。

**Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/unit/cli-commands.test.ts tests/unit/analyze-report.test.ts tests/unit/verification-evidence.test.ts`
Expected: FAIL，因为当前 analyze 报告结构不包含这些区块，`verification-evidence` 工具也不存在。

**Step 3: Write minimal implementation**

- 在 `src/core/gate-engine/sca.ts`：
  - 扩展分析报告渲染函数，新增 4 个稳定区块：
    - 已满足项
    - 缺失项
    - 风险项
    - 最小修复建议
  - 不修改现有 severity 计算规则。
- 在 `src/shared/verification-evidence.ts`：
  - 新增最小 helper，例如：

```ts
export interface VerificationEvidenceInput {
  commands: Array<{ command: string; exitCode: number }>;
  artifacts: string[];
  conclusion: 'PASS' | 'FAIL';
}
```

  - 输出到 `specs/<featureId>/reports/verification-evidence.md`
- 在 `src/cli/commands/analyze.ts`：
  - 保持 `analysis-report.md` 默认路径不变。
  - 仅增强渲染内容，不改 CLI 参数协议。

**Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run tests/unit/cli-commands.test.ts tests/unit/analyze-report.test.ts tests/unit/verification-evidence.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/core/gate-engine/sca.ts src/cli/commands/analyze.ts src/shared/verification-evidence.ts tests/unit/cli-commands.test.ts tests/unit/analyze-report.test.ts tests/unit/verification-evidence.test.ts
git commit -m "feat: enrich analyze report and write verification evidence"
```

---

### Task 6: Focused regression after all PRs

**Files:**
- Read: `package.json`

**Step 1: Run focused regression**

Run: `pnpm exec vitest run tests/unit/command-gate.test.ts tests/unit/gate-evaluator.test.ts tests/integration/validate-command.test.ts tests/e2e/cli-subprocess.test.ts tests/unit/cli-commands.test.ts tests/unit/analyze-report.test.ts tests/unit/verification-evidence.test.ts`
Expected: PASS

**Step 2: Run existing flow regression**

Run: `pnpm exec vitest run tests/e2e/core-flow.test.ts tests/e2e/error-paths.test.ts tests/unit/gate-cli.test.ts`
Expected: PASS

**Step 3: Run full verification**

Run: `pnpm test && pnpm typecheck && pnpm lint`
Expected: PASS

**Step 4: Validate diff scope**

Run: `git status --short`
Expected: 只包含本计划列出的文件，无无关漂移

**Step 5: Final commit check**

```bash
git log --oneline -5
```

Expected:

- 最近提交对应 5 个 PR 主题：
  - command evidence
  - gate fresh evidence
  - validate all evidence summary
  - cli subprocess coverage
  - analyze report + verification evidence
