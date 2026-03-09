# Background Quality Contract Minimal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 以最小补丁落地 `background quality` 共享 contract 与共享测试，统一关键 skill 的背景字段、枚举和最小语义边界，避免后续手工漂移。

**Architecture:** 先建立共享 contract 与共享测试，再让关键生产者/消费者 skill 对齐该契约。保持 runtime 内部命名不大改，采用“内部 camelCase / 输出 snake_case”双层规则，避免无关重构。

**Tech Stack:** Node.js 20, TypeScript, Vitest, Markdown skills docs

---

### Task 1: 建立 shared contract 文档与失败测试

**Files:**
- Create: `skills/spec-first/shared/background-quality-contract.md`
- Create: `tests/unit/background-quality-contract.test.ts`
- Read: `docs/plans/2026-03-09-background-quality-contract-minimal-design.md`
- Read: `skills/spec-first/01-init/SKILL.md`
- Read: `skills/spec-first/08-review/SKILL.md`
- Read: `skills/spec-first/12-verify/SKILL.md`
- Read: `skills/spec-first/14-status/SKILL.md`
- Read: `skills/spec-first/21-analyze/SKILL.md`

**Step 1: Write the failing test**

- 新增 `tests/unit/background-quality-contract.test.ts`
- 先定义最小断言：
  - shared contract 文件存在
  - contract 包含 canonical output fields：`background_input_status`、`runtime 真源`、`docs 投影视图`、`同步状态`
  - contract 包含枚举：
    - `full / degraded / blind`
    - `healthy / degraded / missing`
    - `synced / stale / drifted`
    - `in_sync / stale / drifted`
  - contract 包含命名分层规则：内部 `backgroundInputStatus`，输出 `background_input_status`

**Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/unit/background-quality-contract.test.ts`
Expected: FAIL，因为 shared contract 文件与测试尚未存在。

**Step 3: Write minimal implementation**

- 新建 `skills/spec-first/shared/background-quality-contract.md`
- 只写最小内容：
  - 背景质量定义
  - 命名分层规则
  - 四个输出字段
  - 四组枚举
  - 最小语义解释
  - 严重度底线
- 不引入流程图、长篇解释或模板引擎设想。

**Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run tests/unit/background-quality-contract.test.ts`
Expected: PASS

---

### Task 2: 对齐 `01-init` 与 `08-review` 的契约边界

**Files:**
- Modify: `skills/spec-first/01-init/SKILL.md`
- Modify: `skills/spec-first/08-review/SKILL.md`
- Modify: `tests/unit/background-quality-contract.test.ts`
- Test: `tests/unit/review-skill-docs.test.ts`

**Step 1: Extend the failing test**

在 `tests/unit/background-quality-contract.test.ts` 中新增断言：

- `01-init` 文档显式把背景状态定义锚定到 shared contract
- `01-init` 的枚举说明与 contract 一致
- `08-review` 明确区分：
  - 输入元数据可用 `backgroundInputStatus`
  - 用户可见文档输出 canonical name 为 `background_input_status`

**Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/unit/background-quality-contract.test.ts tests/unit/review-skill-docs.test.ts`
Expected: FAIL，因为当前 `08-review` 只有输入字段说明，没有明确声明输出层 canonical naming。

**Step 3: Write minimal implementation**

- 在 `skills/spec-first/01-init/SKILL.md` 增加 shared contract 引用或“背景状态遵循 shared contract”说明
- 在 `skills/spec-first/08-review/SKILL.md` 增加一小节，明确：
  - `backgroundInputStatus` 仅为输入层字段
  - 如需要面向用户展示背景状态，统一使用 `background_input_status`
- 保持其它审查流程不改。

**Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run tests/unit/background-quality-contract.test.ts tests/unit/review-skill-docs.test.ts`
Expected: PASS

---

### Task 3: 对齐 `12-verify` 的报告字段义务

**Files:**
- Modify: `skills/spec-first/12-verify/SKILL.md`
- Modify: `skills/spec-first/12-verify/references/verify-report-template.md`
- Modify: `tests/unit/background-quality-contract.test.ts`
- Test: `tests/unit/verify-skill-docs.test.ts`

**Step 1: Extend the failing test**

在 `tests/unit/background-quality-contract.test.ts` 中新增断言：

- `12-verify` 的文档或模板至少包含 `background_input_status`
- 若模板列出背景字段，命名必须遵守 shared contract
- `12-verify` 文档需说明高风险验证会提升背景依赖强度

**Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/unit/background-quality-contract.test.ts tests/unit/verify-skill-docs.test.ts`
Expected: 若当前字段或说明不完整则 FAIL；否则至少应验证新共享测试正确读取现状。

**Step 3: Write minimal implementation**

- 如 `12-verify` 主文档尚未引用 shared contract，则增加一行引用说明
- 如模板字段命名与 contract 不一致，则做最小修补
- 不要求 `verify` 在 V1 输出完整四字段背景结论块，只要求不脱离 contract。

**Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run tests/unit/background-quality-contract.test.ts tests/unit/verify-skill-docs.test.ts`
Expected: PASS

---

### Task 4: 对齐 `14-status` 与 `21-analyze` 的完整背景输出

**Files:**
- Modify: `skills/spec-first/14-status/SKILL.md`
- Modify: `skills/spec-first/14-status/references/status-dashboard-template.md`
- Modify: `skills/spec-first/14-status/references/risk-indicators.md`
- Modify: `skills/spec-first/21-analyze/SKILL.md`
- Modify: `skills/spec-first/21-analyze/references/analysis-rules.md`
- Modify: `skills/spec-first/21-analyze/references/report-format.md`
- Modify: `tests/unit/background-quality-contract.test.ts`
- Test: `tests/unit/status-skill-docs.test.ts`
- Test: `tests/unit/analyze-skill-docs.test.ts`
- Test: `tests/unit/analyze-background-quality.test.ts`

**Step 1: Extend the failing test**

在 `tests/unit/background-quality-contract.test.ts` 中新增断言：

- `14-status` 的背景状态卡片必须包含四字段：
  - `background_input_status`
  - `runtime 真源`
  - `docs 投影视图`
  - `同步状态`
- `21-analyze` 的 `## 背景质量结论` 必须包含四字段与 `建议动作`
- `21-analyze` 的严重度规则不得弱于 shared contract 底线

**Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/unit/background-quality-contract.test.ts tests/unit/status-skill-docs.test.ts tests/unit/analyze-skill-docs.test.ts tests/unit/analyze-background-quality.test.ts`
Expected: FAIL，如果 `status` 或 `analyze` 的文档、模板、示例仍有 contract 漂移。

**Step 3: Write minimal implementation**

- `14-status`：补 shared contract 引用；确保状态卡片字段不漂移
- `21-analyze`：补 shared contract 引用；确保规则、模板、示例对齐 contract
- 仅修补背景质量相关内容，不顺手改其它文案风格

**Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run tests/unit/background-quality-contract.test.ts tests/unit/status-skill-docs.test.ts tests/unit/analyze-skill-docs.test.ts tests/unit/analyze-background-quality.test.ts`
Expected: PASS

---

### Task 5: 做 focused verification，确认共享测试与现有 skill 测试协同工作

**Files:**
- Read: `tests/unit/background-quality-contract.test.ts`
- Read: `docs/plans/2026-03-09-background-quality-contract-minimal-design.md`
- Read: `docs/plans/2026-03-09-background-quality-contract-minimal-implementation-plan.md`

**Step 1: Run focused verification**

Run: `pnpm exec vitest run tests/unit/background-quality-contract.test.ts tests/unit/review-skill-docs.test.ts tests/unit/verify-skill-docs.test.ts tests/unit/status-skill-docs.test.ts tests/unit/analyze-skill-docs.test.ts tests/unit/analyze-background-quality.test.ts`
Expected: PASS

**Step 2: Review for overlap and YAGNI**

手工检查：

- shared test 是否只测“共享 contract”，没有重复覆盖每个 skill 的局部细节
- 各 skill-docs test 是否仍聚焦本 skill 特有语义
- 是否引入了不必要的新字段或新状态枚举

**Step 3: Commit**

```bash
git add skills/spec-first/shared/background-quality-contract.md skills/spec-first/01-init/SKILL.md skills/spec-first/08-review/SKILL.md skills/spec-first/12-verify/SKILL.md skills/spec-first/12-verify/references/verify-report-template.md skills/spec-first/14-status/SKILL.md skills/spec-first/14-status/references/status-dashboard-template.md skills/spec-first/14-status/references/risk-indicators.md skills/spec-first/21-analyze/SKILL.md skills/spec-first/21-analyze/references/analysis-rules.md skills/spec-first/21-analyze/references/report-format.md tests/unit/background-quality-contract.test.ts docs/plans/2026-03-09-background-quality-contract-minimal-design.md docs/plans/2026-03-09-background-quality-contract-minimal-implementation-plan.md
git commit -m "test: add shared background quality contract governance"
```

---

### Task 6: Run full regression before completion

**Files:**
- Read: `package.json`

**Step 1: Run full test suite**

Run: `pnpm test`
Expected: PASS with all existing unit/integration suites green

**Step 2: Validate no unrelated drift**

Run: `git status --short`
Expected: 只包含本计划涉及文件，无无关修改

**Step 3: Final commit**

```bash
git add skills/spec-first/shared/background-quality-contract.md skills/spec-first/01-init/SKILL.md skills/spec-first/08-review/SKILL.md skills/spec-first/12-verify/SKILL.md skills/spec-first/12-verify/references/verify-report-template.md skills/spec-first/14-status/SKILL.md skills/spec-first/14-status/references/status-dashboard-template.md skills/spec-first/14-status/references/risk-indicators.md skills/spec-first/21-analyze/SKILL.md skills/spec-first/21-analyze/references/analysis-rules.md skills/spec-first/21-analyze/references/report-format.md tests/unit/background-quality-contract.test.ts docs/plans/2026-03-09-background-quality-contract-minimal-design.md docs/plans/2026-03-09-background-quality-contract-minimal-implementation-plan.md
git commit -m "docs: align background quality contract across core skills"
```
