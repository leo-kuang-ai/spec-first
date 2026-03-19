# Plan / Orchestrate Simplification Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 收敛 `plan` 与 `orchestrate` 的职责边界，保留 `plan` 作为轻量决策层，同时把 `orchestrate` 固化为唯一编排与阶段推进入口。

**Architecture:** 先锁定当前代码事实和文档边界，避免“文档层约定”继续伪装成“代码层事实”；随后收敛 `11-plan` / `13-orchestrate` / 共享治理 contract 的表述，并同步 `context-resolver` 与 `dispatcher` 的运行时契约；最后引入可选的 `orchestrate --plan-only` 入口，只在测试和文档都稳定后再评估 `plan` 是否具备退场条件。

**Tech Stack:** TypeScript, Vitest, Markdown skill docs, Spec-First runtime

---

### Task 1: 锁定 `plan` / `orchestrate` 的代码事实与文档边界

**Files:**
- Modify: `tests/unit/plan-skill-docs.test.ts`
- Modify: `tests/unit/orchestrate-skill-docs.test.ts`
- Modify: `tests/unit/skill-runtime.test.ts`
- Modify: `tests/unit/context-resolver.test.ts`
- Read: `src/core/skill-runtime/dispatcher.ts`
- Read: `src/core/skill-runtime/context-resolver.ts`
- Read: `skills/spec-first/11-plan/SKILL.md`
- Read: `skills/spec-first/13-orchestrate/SKILL.md`

**Step 1: 为文档边界写失败测试**

补断言覆盖以下事实：

- `11-plan` 明确为“计划与风险摘要”，不推进阶段。
- `13-orchestrate` 明确为“编排与阶段推进”，不声称代码层自动调用 `plan`。
- `13-orchestrate` 的文字层与流程图层不能再对 `plan` 是否为主链必经节点给出矛盾表达。

**Step 2: 为运行时边界写失败测试**

补断言覆盖以下事实：

- `dispatchCommand('/spec-first:orchestrate ...')` 不会转发到 `plan`。
- `dispatchCommand('/spec-first:plan ...')` 仍然保留独立路由。
- `context-resolver` 对 `plan` 和 `orchestrate` 的背景契约可以共享，但不能推导出“自动消费 plan 摘要”的行为。

**Step 3: 运行定向测试确认失败点**

Run:
```bash
pnpm -s vitest run tests/unit/plan-skill-docs.test.ts tests/unit/orchestrate-skill-docs.test.ts tests/unit/skill-runtime.test.ts tests/unit/context-resolver.test.ts
```

Expected:
- 新增断言先失败
- 失败点集中在当前文档和运行时边界不一致的部分

**Step 4: 用最小断言收口**

测试不要去锁实现细节，只锁边界：

- “不自动调用”
- “独立路由仍存在”
- “职责不重叠”
- “文档表述不互相打架”

**Step 5: 再次运行测试确认基线**

Run:
```bash
pnpm -s vitest run tests/unit/plan-skill-docs.test.ts tests/unit/orchestrate-skill-docs.test.ts tests/unit/skill-runtime.test.ts tests/unit/context-resolver.test.ts
```

Expected:
- 文档/运行时边界测试通过

---

### Task 2: 收敛 `11-plan`，把它压成轻量决策层

**Files:**
- Modify: `skills/spec-first/11-plan/SKILL.md`
- Modify: `skills/spec-first/11-plan/references/findings-schema.md`
- Modify: `skills/spec-first/11-plan/references/risk-assessment.md`
- Test: `tests/unit/plan-skill-docs.test.ts`

**Step 1: 收敛主文档职责**

修改 `11-plan/SKILL.md`：

- 明确 `plan` 是可选的决策摘要层，不是主链必经门。
- 删除“会被 `orchestrate` 自动消费”的强表述。
- 保留输出：`Target Stage`、`Next Action`、`Blockers`、`Risk Level`、`Suggested Command`。

**Step 2: 收敛 findings schema**

修改 `findings-schema.md`：

- `Plan Summary` 只保留当前有效摘要。
- 不引入“执行控制”字段。
- 保证 `Suggested Command` 是可立即执行命令。

**Step 3: 收敛风险指南**

修改 `risk-assessment.md`：

- 保留 plan 后的风险复盘语义。
- 删除会暗示 `plan` 是推进前强制门禁的表述。
- 保证风险输出服务于“下一步建议”，而不是第二套 stage gate。

**Step 4: 运行文档测试**

Run:
```bash
pnpm -s vitest run tests/unit/plan-skill-docs.test.ts
```

Expected:
- `plan` 被识别为轻量决策层
- 文档不再暗示自动推进或自动调度

**Step 5: 提交**

```bash
git add skills/spec-first/11-plan/SKILL.md skills/spec-first/11-plan/references/findings-schema.md skills/spec-first/11-plan/references/risk-assessment.md tests/unit/plan-skill-docs.test.ts
git commit -m "docs: narrow plan to advisory decision layer"
```

---

### Task 3: 收敛 `13-orchestrate`，把它固化为唯一编排与阶段推进入口

**Files:**
- Modify: `skills/spec-first/13-orchestrate/SKILL.md`
- Modify: `skills/spec-first/13-orchestrate/references/skill-mapping.md`
- Modify: `skills/spec-first/13-orchestrate/references/output-format.md`
- Test: `tests/unit/orchestrate-skill-docs.test.ts`
- Test: `tests/unit/orchestrate-stage-integration.test.ts`

**Step 1: 修正文档主链**

修改 `13-orchestrate/SKILL.md`：

- 把“`plan -> skill -> verify -> advance`”改为“编排计划生成 -> 目标 skill 调度 -> verify -> advance”。
- 明确 `plan` 是可选输入摘要，不是代码层必经节点。
- 保留 `orchestrate` 作为唯一编排与阶段推进入口。

**Step 2: 修正映射表**

修改 `references/skill-mapping.md`：

- 保留 Stage -> Skill 映射。
- 把“标准流程”从 `plan -> skill -> verify -> advance` 改成不误导实现的表述。
- 在“详细”说明中标注：若存在 `plan` 摘要，则作为参考输入，而不是自动调度的前置步骤。

**Step 3: 修正输出格式**

修改 `references/output-format.md`：

- 在编排计划输出中体现 `Next Action`、`Blockers`、`Risk Level`、`Suggested Command`。
- 不再暗示 `orchestrate` 先执行一个独立 `plan` skill。

**Step 4: 运行测试**

Run:
```bash
pnpm -s vitest run tests/unit/orchestrate-skill-docs.test.ts tests/unit/orchestrate-stage-integration.test.ts
```

Expected:
- `orchestrate` 文档与映射表一致
- 流程图、主链描述、Stage 映射三者一致

**Step 5: 提交**

```bash
git add skills/spec-first/13-orchestrate/SKILL.md skills/spec-first/13-orchestrate/references/skill-mapping.md skills/spec-first/13-orchestrate/references/output-format.md tests/unit/orchestrate-skill-docs.test.ts tests/unit/orchestrate-stage-integration.test.ts
git commit -m "docs: align orchestrate as sole orchestration entry"
```

---

### Task 4: 收敛共享治理 contract，并把 `context-resolver` 的 `plan` 契约同步压薄

**Files:**
- Modify: `skills/spec-first/shared/orchestration-governance-contract.md`
- Modify: `src/core/skill-runtime/context-resolver.ts`
- Test: `tests/unit/context-resolver.test.ts`
- Test: `tests/unit/control-plane-governance.test.ts`

**Step 1: 收敛 contract**

修改 `orchestration-governance-contract.md`：

- 保留共享字段：`backgroundInputStatus`、`dependencyStrength`、`riskCategory`、`riskSignals`、`recommendedAction`。
- 明确 `plan` 只承接治理输入，不投影为推进控制。
- 明确 `orchestrate` 负责用户可见决策与推进动作。

**Step 2: 调整 `context-resolver.ts`**

修改 `context-resolver.ts`：

- 保持 `plan` 在 `BACKGROUND_SKILLS` 中，先不删除路由。
- 收窄 `plan` 的 `SKILL_INPUT_MATRIX` 语义说明，使其与轻量决策层一致。
- 确认 `plan` 与 `orchestrate` 的资产契约共享但不混淆职责。

**Step 3: 测试锁边界**

在测试里覆盖：

- `plan` 仍可解析 background assets。
- `plan` 的上下文不会被测试认定为推进语义。
- `orchestrate` 继续承担治理输出职责。

**Step 4: 运行测试**

Run:
```bash
pnpm -s vitest run tests/unit/context-resolver.test.ts tests/unit/control-plane-governance.test.ts tests/unit/skill-runtime.test.ts
```

Expected:
- 共享治理字段仍稳定
- `plan` 的背景契约变轻但未失效

**Step 5: 提交**

```bash
git add skills/spec-first/shared/orchestration-governance-contract.md src/core/skill-runtime/context-resolver.ts tests/unit/context-resolver.test.ts tests/unit/control-plane-governance.test.ts
git commit -m "refactor: narrow plan context and shared governance contract"
```

---

### Task 5: 为 `orchestrate --plan-only` 预留模式入口

**Files:**
- Modify: `src/core/skill-runtime/orchestrate-args.ts`
- Modify: `src/core/skill-runtime/dispatcher.ts`
- Test: `tests/unit/orchestrate-args-parser.test.ts`
- Test: `tests/unit/skill-runtime.test.ts`
- Optional Doc: `skills/spec-first/13-orchestrate/SKILL.md`

**Step 1: 写失败测试**

新增断言覆盖：

- `--plan-only` 是合法 orchestrate flag。
- `--plan-only` 不触发自动推进。
- `--plan-only` 与 `--auto` / `--auto-advance` 的组合规则明确可判。

**Step 2: 扩展参数协议**

修改 `orchestrate-args.ts`：

- 为 `OrchestrateArgs` 增加 `planOnly?: true`。
- 更新 flag 白名单和校验逻辑。
- 保持 `resume` 必须依附 `--auto` 的现有约束。

**Step 3: 调整 dispatcher**

修改 `dispatcher.ts`：

- 让 `orchestrate` 的 runtime notice 能看到 `planOnly` 模式。
- 不实现真实子 skill 调度切换，只补齐模式入口和上下文注释。
- 避免在这一轮引入新的自动执行语义。

**Step 4: 运行测试**

Run:
```bash
pnpm -s vitest run tests/unit/orchestrate-args-parser.test.ts tests/unit/skill-runtime.test.ts
```

Expected:
- 参数解析稳定
- `plan-only` 模式不会破坏既有 `auto` / `auto-advance`

**Step 5: 提交**

```bash
git add src/core/skill-runtime/orchestrate-args.ts src/core/skill-runtime/dispatcher.ts tests/unit/orchestrate-args-parser.test.ts tests/unit/skill-runtime.test.ts skills/spec-first/13-orchestrate/SKILL.md
git commit -m "feat: add orchestrate plan-only mode scaffold"
```

---

### Task 6: 补试运行判定与收尾文档

**Files:**
- Modify: `docs/analysis/流程审查/2026-03-19-spec-first-plan-orchestrate-simplification-proposal.md`
- Create: `docs/analysis/流程审查/2026-03-19-plan-orchestrate-simplification-implementation-report.md`
- Read/Test: `tests/unit/plan-skill-docs.test.ts`
- Read/Test: `tests/unit/orchestrate-skill-docs.test.ts`
- Read/Test: `tests/unit/orchestrate-args-parser.test.ts`
- Read/Test: `tests/unit/context-resolver.test.ts`
- Read/Test: `tests/unit/skill-runtime.test.ts`

**Step 1: 跑定向回归**

Run:
```bash
pnpm -s vitest run tests/unit/plan-skill-docs.test.ts tests/unit/orchestrate-skill-docs.test.ts tests/unit/orchestrate-args-parser.test.ts tests/unit/context-resolver.test.ts tests/unit/skill-runtime.test.ts tests/unit/control-plane-governance.test.ts
```

Expected:
- 文档边界、参数入口、context-resolver 契约全部通过

**Step 2: 跑整体验证**

Run:
```bash
pnpm -s vitest run
```

Expected:
- 全量单测通过
- 无新增 skill 路由退化

**Step 3: 形成收尾报告**

在实现报告里明确：

- 已完成：哪些职责收敛已经落地
- 未完成：哪些仍停留在 mode 入口或文档约定层
- 观察指标：当前只能依赖 `findings.md` / `stage-state.json` / `gate-history.jsonl`
- 下一步：是否进入 `plan` 退场试运行窗口

**Step 4: 提交**

```bash
git add docs/analysis/流程审查/2026-03-19-spec-first-plan-orchestrate-simplification-proposal.md docs/analysis/流程审查/2026-03-19-plan-orchestrate-simplification-implementation-report.md
git commit -m "docs: record plan orchestrate simplification rollout"
```

