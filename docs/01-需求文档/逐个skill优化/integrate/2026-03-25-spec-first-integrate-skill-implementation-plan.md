# Spec-First Integrate-Skill Report-Only MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为 `spec-first` 落地 `integrate-skill` 的 Phase 1 `report-only MVP`，支持本地 external skill 解析、分类、冲突检测、报告生成和 CLI/skill 门面接线，但不生成 guideline、examples 或 `skills-draft/`。

**Architecture:** 先实现 `source-resolver -> parser -> mapper -> conflict-detector -> planner -> report-generator` 这条最小闭环，再接上 `spec-first integrate-skill` CLI 与 `skills/integrate-skill/SKILL.md` 门面。所有写入只允许生成 `docs/reports/skill-integrations/*.md`，默认 source 缺失即阻断；只有显式 `--report-only --allow-missing-source` 才允许空报告骨架。

**Tech Stack:** Node.js 20, TypeScript, ESM, Vitest, existing spec-first CLI/router/runtime structure

---

### Task 1: PR1 — Add fixtures and failing parser/source tests

**Files:**
- Create: `tests/fixtures/external-skills/frontend-design/SKILL.md`
- Create: `tests/fixtures/external-skills/mcp-builder/SKILL.md`
- Create: `tests/fixtures/external-skills/webapp-testing/SKILL.md`
- Create: `tests/fixtures/external-skills/broken-skill/README.md`
- Create: `tests/unit/source-resolver.test.ts`
- Create: `tests/unit/external-skill-parser.test.ts`

**Step 1: Write the failing test**

- 在 `tests/unit/source-resolver.test.ts` 增加以下断言：
  - 显式 `--source` 指向有效目录时能解析出 `skillMdPath`
  - 缺少 `SKILL.md` 时返回 `SOURCE_INVALID` 或等价错误
  - source 不存在时返回 `SOURCE_NOT_FOUND`
  - 只有 `reportOnly + allowMissingSource` 时才允许生成“missing source”解析结果
- 在 `tests/unit/external-skill-parser.test.ts` 增加以下断言：
  - 可解析 frontmatter 中的 `name` / `description`
  - 可从正文提取 command 行
  - `frontend-design` 被提取出 frontend 相关关键词
  - `broken-skill` 结构不完整时返回 warnings，而不是静默成功

示例断言：

```ts
const resolved = resolveExternalSkillSource({
  skillName: 'frontend-design',
  source: FIXTURE_FRONTEND,
  reportOnly: false,
});
expect(resolved.skillMdPath).toContain('SKILL.md');

const parsed = parseExternalSkill(resolved);
expect(parsed.name).toBeTruthy();
expect(parsed.commands.length).toBeGreaterThan(0);
expect(parsed.parserWarnings).toEqual([]);
```

**Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/unit/source-resolver.test.ts tests/unit/external-skill-parser.test.ts`
Expected: FAIL，因为对应模块与 fixtures 尚不存在。

**Step 3: Write minimal implementation**

- 先只创建最小 fixture 内容：
  - `frontend-design` 带 frontmatter、command、frontend 关键词
  - `mcp-builder` 带 backend/MCP 关键词
  - `webapp-testing` 带 testing/playwright 关键词
  - `broken-skill` 故意不放 `SKILL.md`
- 暂不实现完整分类逻辑，只实现 source 和 parser 最小 contract 所需模块骨架：
  - `src/core/skill-integration/source-resolver.ts`
  - `src/core/skill-integration/external-skill-parser.ts`

**Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run tests/unit/source-resolver.test.ts tests/unit/external-skill-parser.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/fixtures/external-skills tests/unit/source-resolver.test.ts tests/unit/external-skill-parser.test.ts src/core/skill-integration/source-resolver.ts src/core/skill-integration/external-skill-parser.ts
git commit -m "test: add integrate-skill source and parser coverage"
```

---

### Task 2: PR2 — Add category mapper and conflict detector

**Files:**
- Create: `src/core/skill-integration/category-mapper.ts`
- Create: `src/core/skill-integration/conflict-detector.ts`
- Create: `tests/unit/category-mapper.test.ts`
- Create: `tests/unit/conflict-detector.test.ts`
- Read: `skills/*/SKILL.md`
- Read: `skills/AGENTS.md`

**Step 1: Write the failing test**

- 在 `tests/unit/category-mapper.test.ts` 增加以下断言：
  - `frontend-design` -> `category=frontend`, `primaryStage=design`, `relatedStages=['code']`
  - `mcp-builder` -> `category=backend`
  - `webapp-testing` -> `category=testing`, `primaryStage=verify`
  - 多个类别接近时会产生 warning
- 在 `tests/unit/conflict-detector.test.ts` 增加以下断言：
  - 当目标名已存在于 `skills/*` 时返回 `name-conflict`
  - 与现有 stage-bound skill 高重叠时返回 `capability-overlap`
  - 明显不兼容技术栈时返回 `tech-stack-mismatch`

示例断言：

```ts
const result = mapSkillCategory(frontendProfile);
expect(result.category).toBe('frontend');
expect(result.primaryStage).toBe('design');
expect(result.relatedStages).toEqual(['code']);
```

**Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/unit/category-mapper.test.ts tests/unit/conflict-detector.test.ts`
Expected: FAIL，因为模块不存在。

**Step 3: Write minimal implementation**

- `category-mapper.ts`
  - 只实现基于关键词和 command 的最小评分模型
  - 输出 `category / primaryStage / relatedStages / warnings`
- `conflict-detector.ts`
  - 只实现最小冲突检查：
    - `skills/<name>` 是否存在
    - profile 与现有 `design/code/review/verify/orchestrate` 描述的简单重叠
  - 暂不做复杂语义相似度

**Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run tests/unit/category-mapper.test.ts tests/unit/conflict-detector.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/core/skill-integration/category-mapper.ts src/core/skill-integration/conflict-detector.ts tests/unit/category-mapper.test.ts tests/unit/conflict-detector.test.ts
git commit -m "feat: add integrate-skill category and conflict checks"
```

---

### Task 3: PR3 — Add target config, planner, and report generator

**Files:**
- Create: `templates/skill-integration/targets.yaml`
- Create: `templates/skill-integration/report.md.hbs`
- Create: `src/core/skill-integration/integration-planner.ts`
- Create: `src/core/skill-integration/generators/report-generator.ts`
- Create: `src/core/skill-integration/fs-writer.ts`
- Create: `src/core/skill-integration/result-formatter.ts`
- Create: `tests/unit/integration-planner.test.ts`
- Create: `tests/unit/report-generator.test.ts`

**Step 1: Write the failing test**

- `tests/unit/integration-planner.test.ts`
  - `--report-only` 时强制 `mode=report-only`
  - `source` 缺失且未开启 `allowMissingSource` 时阻断
  - name conflict 且无 `--rename` 时阻断
  - 正常 profile 会规划出一个 report file write
- `tests/unit/report-generator.test.ts`
  - 生成内容包含：
    - Source
    - Skill summary
    - Category/stage
    - Conflicts
    - Review checklist
    - Recommendation

示例断言：

```ts
const plan = buildIntegrationPlan(input);
expect(plan.mode).toBe('report-only');
expect(plan.fileWrites).toHaveLength(1);
expect(plan.fileWrites[0].kind).toBe('report');
```

**Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/unit/integration-planner.test.ts tests/unit/report-generator.test.ts`
Expected: FAIL，因为 planner 和模板不存在。

**Step 3: Write minimal implementation**

- `targets.yaml` 只先覆盖 `frontend/backend/testing/documentation/workflow/generic`
- `integration-planner.ts`
  - 合并 source/profile/category/conflict 为最小 `IntegrationPlan`
  - Phase 1 只允许生成 report 写入
- `report-generator.ts`
  - 用 Handlebars 渲染 report 模板
- `fs-writer.ts`
  - 支持 `dryRun`
  - 统一返回 `written/skipped/previewed`

**Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run tests/unit/integration-planner.test.ts tests/unit/report-generator.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add templates/skill-integration/targets.yaml templates/skill-integration/report.md.hbs src/core/skill-integration/integration-planner.ts src/core/skill-integration/generators/report-generator.ts src/core/skill-integration/fs-writer.ts src/core/skill-integration/result-formatter.ts tests/unit/integration-planner.test.ts tests/unit/report-generator.test.ts
git commit -m "feat: add integrate-skill planning and report generation"
```

---

### Task 4: PR4 — Wire service layer and CLI command

**Files:**
- Create: `src/core/skill-integration/service.ts`
- Create: `src/cli/commands/integrate-skill.ts`
- Modify: `src/cli/index.ts`
- Create: `tests/unit/integrate-skill.test.ts`
- Modify: `tests/unit/cli-commands.test.ts`

**Step 1: Write the failing test**

- `tests/unit/integrate-skill.test.ts`
  - `handleIntegrateSkill` 能解析 `--source`
  - `--report-only --allow-missing-source` 允许空报告路径
  - 默认 source 缺失返回非 0
  - 成功路径打印 `Integration Result` 摘要
- `tests/unit/cli-commands.test.ts`
  - `registerCommand('integrate-skill', ...)` 后可正常 dispatch

示例断言：

```ts
const code = handleIntegrateSkill([
  'frontend-design',
  '--source',
  FIXTURE_FRONTEND,
  '--report-only',
]);
expect(code).toBe(0);
```

**Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/unit/integrate-skill.test.ts tests/unit/cli-commands.test.ts`
Expected: FAIL，因为命令尚未注册。

**Step 3: Write minimal implementation**

- `service.ts`
  - 顺序调用 resolver/parser/mapper/conflict/planner/report-generator/fs-writer
- `src/cli/commands/integrate-skill.ts`
  - 只实现参数解析、调用 service、打印结果
- `src/cli/index.ts`
  - 注册 `integrate-skill`
- 仍然只支持 report-only 写入；即使传入 `--target guideline|draft|both`，Phase 1 也只允许 planner 输出 report，并在结果中提示“后续 phase 才支持更多产物”

**Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run tests/unit/integrate-skill.test.ts tests/unit/cli-commands.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/core/skill-integration/service.ts src/cli/commands/integrate-skill.ts src/cli/index.ts tests/unit/integrate-skill.test.ts tests/unit/cli-commands.test.ts
git commit -m "feat: wire integrate-skill cli report-only flow"
```

---

### Task 5: PR5 — Add skill facade and end-to-end report-only coverage

**Files:**
- Create: `skills/integrate-skill/SKILL.md`
- Create: `tests/integration/integrate-skill-command.test.ts`
- Modify: `src/shared/skill-commands.ts`
- Read: `src/cli/commands/skill.ts`

**Step 1: Write the failing test**

- `tests/integration/integrate-skill-command.test.ts`
  - 从 fixture source 运行 `handleIntegrateSkill` 后，真实写出 `docs/reports/skill-integrations/*.md`
  - `--dry-run` 不落盘
  - `--report-only --allow-missing-source` 写出空报告骨架
- 如当前 catalog discovery 依赖 `skills/*/SKILL.md`，补一个最小断言，确保 `integrate-skill` 会被扫描到

**Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/integration/integrate-skill-command.test.ts`
Expected: FAIL，因为 facade 和集成写入链路尚未完整。

**Step 3: Write minimal implementation**

- `skills/integrate-skill/SKILL.md`
  - 只做门面说明和 CLI 调用约束
- `src/shared/skill-commands.ts`
  - 若 discovery 对新 skill 有特殊过滤，最小补齐
- `tests/integration/integrate-skill-command.test.ts`
  - 使用临时目录作为 project root
  - 断言 report 文件内容包含关键节

**Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run tests/integration/integrate-skill-command.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add skills/integrate-skill/SKILL.md tests/integration/integrate-skill-command.test.ts src/shared/skill-commands.ts
git commit -m "feat: add integrate-skill facade and integration coverage"
```

---

### Task 6: Final Verification and Evidence

**Files:**
- Read: `docs/01-需求文档/逐个skill优化/integrate/2026-03-25-spec-first-integrate-skill-design.md`
- Read: `docs/01-需求文档/逐个skill优化/integrate/2026-03-25-spec-first-integrate-skill-technical-design.md`

**Step 1: Run focused unit and integration suites**

Run:

```bash
pnpm exec vitest run \
  tests/unit/source-resolver.test.ts \
  tests/unit/external-skill-parser.test.ts \
  tests/unit/category-mapper.test.ts \
  tests/unit/conflict-detector.test.ts \
  tests/unit/integration-planner.test.ts \
  tests/unit/report-generator.test.ts \
  tests/unit/integrate-skill.test.ts \
  tests/integration/integrate-skill-command.test.ts
```

Expected: PASS

**Step 2: Run full test suite**

Run: `pnpm test`
Expected: PASS

**Step 3: Run build**

Run: `pnpm -s build`
Expected: PASS

**Step 4: Manual smoke test**

Run:

```bash
node dist/cli/index.js integrate-skill frontend-design \
  --source tests/fixtures/external-skills/frontend-design \
  --report-only \
  --yes
```

Expected:
- exit code = 0
- 生成 `docs/reports/skill-integrations/YYYY-MM-DD-frontend-design.md`
- 输出含 `Integration Result: SUCCESS`

**Step 5: Commit**

```bash
git add src tests skills templates docs/01-需求文档/逐个skill优化/integrate
git commit -m "feat: add integrate-skill report-only mvp"
```

---

Plan complete and saved to `docs/01-需求文档/逐个skill优化/integrate/2026-03-25-spec-first-integrate-skill-implementation-plan.md`. Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
