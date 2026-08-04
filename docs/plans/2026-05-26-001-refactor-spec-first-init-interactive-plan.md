---
title: refactor: 把 spec-first init 重构为交互式分步引导命令
type: refactor
status: completed
date: 2026-05-26
spec_id: 2026-05-26-002-spec-first-init-interactive-rebuild
origin: docs/brainstorms/2026-05-26-002-spec-first-init-interactive-rebuild-requirements.md
completed: 2026-05-27
---

# refactor: 把 spec-first init 重构为交互式分步引导命令

> Completion note: 当前源码已完成交互式 `init` 重构、`buildInitPlan` / `applyInitPlan` 程序化入口、prompt 原语、README/测试/话术迁移。最终实现相对本计划 R1/R3 做过产品口径调整：没有删除所有 init flags，而是保留 `--claude` / `--codex` 跳过宿主选择、`-y` / `--yes` 用于 non-TTY/脚本默认初始化，以及 `-u` / `--lang` 作为程序化输入；后续应以当前源码和 README 的保留 flags 口径为准，不再按本计划早期"取消所有 flag"表述返工。

## Summary

抽出可测试的 init plan/apply 两层 API 重构现有 70+ 处测试调用，新增基于原生 readline 的零依赖 prompt 原语模块，重写 `init` 子命令为「TTY 检测 → 平台/身份/语言/批量目标 → 写出物预览 → 显式确认」六步交互流，同步更新 144 处现存 `--claude/--codex` 引导话术与 contract 测试断言。

---

## Problem Frame

当前 `spec-first init (--claude|--codex) [-u <name>] [--lang <zh|en>] [--dry-run] [--repo <child>|--all-repos]` 把所有产品维度都摊在 flag 平面上，对真人首次接入不友好（必须背 host flag）、`-u/--lang` 的 fallback 链是隐式静默路径用户看不到、`--dry-run` 这种「先看再决定」的能力必须先知道有这个 flag 才能用上。

origin requirements doc（`docs/brainstorms/2026-05-26-002-spec-first-init-interactive-rebuild-requirements.md`）已确认彻底重构方向：取消 init 子命令所有 flag、TTY 才能用、默认呈现写出物预览要求显式确认才落盘；其他子命令（doctor/clean/tasks/session）入口形态保持不变；init 落盘的写出物本体（runtime mirror、managed blocks、CHANGELOG bootstrap、SessionStart hook 等）保持等价。

本次工作的总改动面经 Phase 1 盘点 + doc-review 补充为约 **160+ 处**（Phase 1 初估 144 处，doc-review 又补出至少 5 类源文件、`scripts/npm-install-matrix-smoke.js:571-572` 真实 init 调用、`templates/claude/hooks/session-start` hook body 文案、若干 `skills/**/SKILL.md` 与 bootstrap scripts）：约 56 处测试调用（unit + smoke + contract + matrix install fixture）、47 处 CLI 引导话术（其中 doctor.js 30+ 处 fix 模板字符串是大头）、12 处 README、19 处 `templates/claude/commands/spec/*.md` boilerplate（已确认无共享 generator，需 19 处手改）、2 处 `templates/claude/hooks/session-start` hook body、约 13 处 `skills/**/SKILL.md` 与 references、2 处 `bootstrap-providers.{sh,ps1}` 脚本、6 处 release/install 脚本、6 处其他文档。U5 实施前必须重新 grep 一次全量、reconcile 已盘点清单。

---

## Requirements

> **R-id 局部说明：** 以下 R 是 plan 局部编号，括号注 origin R/F/AE 出处。plan R 不必与 origin R 一一对应——origin R3-R7（六步引导细节）在 plan 合并到 R2，因为 plan 关心的是流程契约整体，单步细节由 implementation units 接住。

- R1. 取消 init 子命令的所有 flag（`--claude`、`--codex`、`-u`、`--user`、`--lang`、`--dry-run`、`--repo`、`--all-repos` 及对应 `=` 形式）；保留 `--help`/`-h`；CLI 全局 `--version`/`-v` 不变（origin R1, R2）。
- R2. TTY 下按固定顺序展示六步引导：平台单选（无默认）→ 用户名输入（fallback 链预填）→ 语言单选（fallback 链预填）→ 批量目标（仅父 workspace 检测到 child repos 时）→ 写出物预览（含 destructive reset 显式标注）→ 确认/取消（origin R3, R4, R5, R6, R7）。
- R3. non-TTY 直接报错退出（exit 2），错误文案明确指向「请在交互式终端运行」；不提供任何 stdin pipe、env-var、`--non-interactive` 之类的 batch 兜底通路（origin R8）。
- R4. 确认后写出的内容、developer profile、CHANGELOG 作者解析、批量 init 的 advisory summary 与今天 `init --claude|--codex -u … --lang … [--all-repos|--repo X]` 等价；destructive 路径（`legacyStateDetected` 与 `inspectCurrentRuntimeDrift` 触发的 hard-reset）保持等价行为（origin R11, R12, R13）。
- R5. 约 160+ 处 `--claude/--codex` 引导话术全量更新为「运行 `spec-first init` 然后按引导选择」；覆盖范围在 U4/U5 的 Files 列表中显式枚举，包括 `templates/claude/hooks/session-start` 的 hook body 与 `skills/**/SKILL.md`、`scripts/bootstrap-providers.{sh,ps1}`（origin R14）。
- R6. 56+ 处依赖 flag 的 unit/smoke/tarball test、release-governance、`scripts/npm-install-matrix-smoke.js` 中的真实 init 调用全部改造，通过新抽出的 `buildInitPlan/applyInitPlan` 程序化入口验证 init 行为；不为测试单独引入 stdin pipe 兜底通路（origin R15）。

**Origin actors:** A1 真人开发者、A2 自动化场景。
**Origin flows:** F1 单仓首次 init、F2 父 workspace 多 child repos 批量 init、F3 non-TTY 拒绝。
**Origin acceptance examples:** AE1 (覆盖 R1)、AE2 (R3, R4, R5, R6, R9, R10, R11)、AE3 (R9, R10)、AE4 (R7, R13)、AE5 (R7, R13)、AE6 (R8)、AE7 (R2)。

---

## Scope Boundaries

- 不改 `doctor`、`clean`、`tasks`、`session`、`gitnexus-instruction`、`internal` 等其他子命令的入口形态。
- 不改 init 落盘内容本身（runtime mirror 同步、managed block 渲染、SessionStart hook、CHANGELOG bootstrap、`.gitignore` managed block 这些产物逻辑保持原样）。
- 不变更 CLI 全局 flag（`--help`、`-h`、`--version`、`-v`）的行为。
- 不改 `docs/archive/` 与历史 plan/audit 中对旧 flag 的引用——这些是历史快照不属于现行用法。
- 不引入运行时依赖（`@inquirer/prompts` 等已被本计划用户决策排除）。

---

## Graph Readiness

- target_repo: spec-first（cwd 即 git root）
- status: stale
- source_revision: 8dc7e77627d1f38286d91bf1f4af11831dd6a766
- current_revision: b39a80ea6a3ecbbfb68056b6ea0a9efdaa6c3482
- stale: true（current HEAD 比 graph-facts.source_revision 晚 4 个 commit；worktree 也有 dirty CHANGELOG.md 与新增 brainstorm）
- primary_providers: gitnexus
- degraded_providers: []
- fallback_capabilities: 直接源码读取 + Phase 1 Explore agent 盘点（已完成）
- runtime_mcp_evidence: not-attempted（本计划属于「lightweight planning + 直接源码证据」，未触发 MCP 调用）
- confidence: high（stale graph 影响极小：本计划全部基于直接源码读取，所有 144 处影响点已由 Explore agent 盘点出 repo-relative 路径与行号）
- limitations: graph-facts.json 反映的是 4 commits 之前的 source_revision；本计划不依赖 graph 提供的跨模块影响分析，所有 file/symbol 引用都是直接源码读取得来。

---

## Context & Research

### Relevant Code and Patterns

- `src/cli/commands/init.js` — 当前 `runInit(argv)` / `parseInitArgs` / `runInitForProject` / `runInitForWorkspace` / `buildInitWritePlan` / `printInitDryRun` 的主入口。
- `src/cli/index.js:46-48` — top-level dispatch，`init` 子命令被路由到 `runInit(args.slice(1))`。
- `src/cli/adapters/claude.js`、`src/cli/adapters/codex.js`、`src/cli/adapters/base.js` — 双 host adapter 抽象，`getAdapter('claude'|'codex')` 是 init 选择 host 后的入口。
- `src/cli/developer.js:59-93` — `resolveDeveloperIdentity()` 已经实现 fallback 链解析，本计划复用以计算用户名/语言预填值（只读不写）。
- `src/cli/state.js` — `applyOperationPlan` / `mergeOperationPlans` / `summarizeOperationPlan`，可重用为 plan/apply 抽象层基础。
- `src/cli/commands/init.js:660-727` — `discoverChildGitRepos` / `addChildRepoCandidate`，本计划批量目标步骤直接复用，不重新实现探测策略。
- `src/cli/commands/doctor.js:200-1003` — 30+ 处 `` `Run \`spec-first init --${adapter.id}\` ...` `` 模板字符串是话术更新的最大集中区。
- `templates/claude/commands/spec/*.md:10` — 19 个 command template 的 boilerplate 行（`During \`spec-first init --claude\`, spec-first renders the runtime command...`）。

### Institutional Learnings

- `docs/plans/2026-04-20-012-feat-init-coding-guidelines-plan.md` — 上次往 init 注入 managed block 时已经把 `init` 视为「写出多块 managed content 的复合操作」；本计划的 plan/apply 拆层与那次的 managed block 抽象一致。
- 本仓库的双 host source/runtime governance 严格区分 `templates/`（source）与 `.claude/` `.codex/` `.agents/skills/`（runtime mirror）；本计划只改 source 层与文档/话术，不手改 runtime mirror。

### External References

- 不引入外部依赖；交互层全部用 Node.js 内置 `readline`、`process.stdin.setRawMode`、ANSI escape codes（Cursor up `\x1b[A`、Cursor down `\x1b[B`、Clear line `\x1b[2K` 等）。

---

## Key Technical Decisions

- **抽出 `buildInitPlan(input)` + `applyInitPlan(projectRoot, plan)` 两层 public API，再让 `runInit` 退化为 thin wrapper（交互层 → input → buildInitPlan → preview → applyInitPlan）**：把现有 `runInitForProject` / `runInitForWorkspace` / `buildInitWritePlan` 重组成显式两层。理由：让 70+ 处测试不再依赖 argv / 交互层即可验证 init 行为；保持 source/runtime 边界清晰；退一步说，即便未来引导层换形态，plan/apply 层也是稳定 contract。
- **prompt 实现采用原生 readline + raw mode + ANSI escape，不引入 `@inquirer/prompts` 等运行时依赖**：用户决策（详见 Phase 2）。代价是交互层代码量更大（约 200-300 行）、Windows 终端兼容需要谨慎；收益是保留 spec-first 当前的 zero-runtime-deps 特征。
- **TTY 判定 v1 采用 `process.stdin.isTTY === true`**：足够覆盖 macOS / Linux 主流终端、CI runner、tarball install 子进程；Windows ConPTY、Docker exec、SSH non-pty 等边缘情况列入 verification 实测。判定不通过即报错退出 2。
- **批量目标交互保持「全部 child / 单选某 child / 取消」三选一**：不引入「多选若干 child」能力——今天 `--repo` 也只支持单 child，origin doc 把多选明确划为 deferred research，本计划保持现状。
- **引导文案与错误文案沿用现有 `lang-policy` hard-code 风格（zh/en 两套硬编码字符串）**：不引入 i18n 表，与 init 原有 `printInitNextSteps`、CHANGELOG 模板等的 zh/en 双语处理保持一致；语言来源是引导第三步选择的 lang，预填仍走 fallback chain。
- **新引导话术统一为「Run `spec-first init` and choose <Claude Code|Codex> when prompted」**：替换现有的 `` Run `spec-first init --${adapter.id}` ``。doctor.js 集中区抽一个 helper（如 `formatInitFix(adapter, lang)`）以避免重复。

---

## Open Questions

### Resolved During Planning

- prompt 实现技术：原生 readline 自实现下拉（用户决策，详见 Key Technical Decisions）。
- 测试改造抽象：抽 `buildInitPlan` + `applyInitPlan` 两层 public API（详见 Key Technical Decisions 与 U1）。
- 批量目标多选 vs 单选：保持 origin 单选 + 全部 + 取消（详见 Key Technical Decisions）。
- 引导是否引入 i18n 表：不引入，沿用现有 hard-code zh/en 风格（详见 Key Technical Decisions）。
- 平台引导是否预选/默认：不预选，用户必须显式选择（origin R4 已确认）。
- 引导文案统一格式：`Run \`spec-first init\` and choose <Claude Code|Codex> when prompted`（zh: `运行 \`spec-first init\` 并按引导选择 <Claude Code|Codex>`）。

### Deferred to Implementation

- TTY 判定在 Windows ConPTY、Docker exec、SSH non-pty 等边缘场景的实测准确性：v1 用 `process.stdin.isTTY === true`，实测发现误判时再补判定规则（如 `process.stdout.isTTY` 与 stdin 任一不是 TTY 即拒绝）。
- ANSI 渲染在 Windows Legacy console（cmd.exe 非 ConPTY）的兼容：实施时跑一次 Windows smoke 看是否需要降级到 numbered prompt fallback。
- 取消（Ctrl+C / ESC）的恢复语义细节：是 immediate exit 还是触发统一的「已取消」退出路径。Ctrl+C 默认 SIGINT 在 raw mode 下不会自动结束 Node 进程，需要在 prompt helper 里显式监听并恢复 stdin / cooked mode 后再 exit。
- 批量目标交互在 child repos 数量较大（10+）时的渲染策略：保持线性列表还是分页。实施时先看真实仓库形态再决定。
- [from doc-review 2026-05-26][P2] **`formatInitFix(adapter, lang, intent)` helper 是否过早抽象** —— scope-guardian 提出，30+ doctor.js fix 文案可能 batch find-replace 已足够；helper 仅当出现 ≥2 类不同消费契约时才有 ROI。U4 实施时先 batch replace，看分布再决定是否抽 helper。
- [from doc-review 2026-05-26][P2] **U2 raw-mode + ANSI 复杂度 vs 目标必要性** —— scope-guardian 与 adversarial 都触及：origin R3-R7 没明说要方向键导航，numbered prompt 在大多数 terminal 下的 UX 也可接受。如果 U2 实施期发现 raw-mode 在主流终端上稳定性不足，降级到 readline line-mode + numbered options 是可接受的 fallback；不视为返工。
- [from doc-review 2026-05-26][P2] **TTY 检测在叙事中是「step 0」还是六步之外的 precondition** —— coherence reviewer 提出可能让读者困惑。本计划已在 U3 Approach 明确「TTY 检测是 step 0、在六步开始前」；U3 实施时 README/CHANGELOG/Help 文案保持一致即可。
- [from doc-review 2026-05-26][P2] **archive 与 legacy 测试目录是否豁免 R15** —— `tests/legacy/`、`tests/archive/` 实际是否存在、是否还在跑、是否纳入 R15 范围；U1 实施第一步 grep 时确认；若存在豁免，加 inline 注释 `/* Legacy test — preserved at original flag form */` 防误改。
- [from doc-review 2026-05-26][P2] **zh/en 文案对称性是否需要 contract test 强制** —— coherence reviewer 提出，47 处 CLI 文案改造后可能漂移。`tests/unit/using-spec-first-contracts.test.js` 已部分覆盖；U4 实施时确认是否所有新增 init guidance 文案都有 zh/en 对偶断言，必要时新增小覆盖测试。
- [from doc-review 2026-05-26][P2] **workspace 模式下 user/lang 单次收集 vs 各 child 独立 profile** —— adversarial 提出：今天每个 child 可有自己 `.developer` 文件，单次收集会覆盖各 child 的本地偏好。U3 实施时先看实际工作流：(a) 单次收集 + 应用到所有 child（简洁但丢 per-child preference）、(b) 收集后对比已有 child profile 不同时 ask user 是否覆盖。倾向 (a) 但留 work 阶段实测真实工作流后定。
- [from doc-review 2026-05-26][P2] **`buildInitPlan/applyInitPlan` 是否作为 package.json exports 公开** —— Documentation Notes 已经声明它是稳定 API 给 CI 用户用，但 SemVer 边界、是否 freeze contract 等细节留 work 阶段决定（最小要求：在 init-plan.test.js 中守住调用 signature 与返回字段）。
- [from doc-review 2026-05-26][P2] **取消后 partial preview 是否清屏** —— adversarial 提出 UX 细节：PromptCancelled 触发时 stdout 已经渲染了一部分预览，是否要 ANSI clear 重置回干净状态。U2 实施时按宿主反馈决定，倾向保留输出（让用户看到取消时正在看的内容）。
- [from doc-review 2026-05-26][P2] **是否给 CI 留 `SPEC_FIRST_INIT_NONINTERACTIVE=1` env-var escape valve** —— 多个 reviewer 重提：本计划坚守 brainstorm 决策不引入；但若 work 实施中发现内部 release-publish 链路无法走 in-process buildInitPlan（例如必须从 published bin 而非 source 跑），考虑把这一项升级为 plan 增量改动而非偷偷加 escape valve。
- [from doc-review 2026-05-26][FYI] **5 个 implementation unit 粒度合理** —— scope-guardian 确认 U1→U5 线性依赖与 atomic-commit 边界对齐；不需要拆得更细。observational only。

---

## Output Structure

```text
src/cli/
├── commands/
│   └── init.js              # 重构：移除 parseInitArgs flag、改为交互入口；保留 buildInitWritePlan 内部细节
├── prompts/                 # 新增模块
│   ├── index.js             # 导出 select / textInput / confirm / requireTty
│   └── tty.js               # TTY 判定 helper（独立以便 mock）
├── init-plan.js             # 新增：抽出 buildInitPlan / applyInitPlan public API
├── developer.js             # 文案更新（line 79 错误消息）
├── lang-policy.js           # 文案更新（line 87, 103 注释）
├── adapters/
│   └── claude.js            # 文案更新（line 134, 150, 288, 299 fix 文案）
└── commands/
    ├── doctor.js            # 30+ 处 fix 文案集中更新（抽 helper）
    ├── clean.js             # 4 处 fix 文案
    └── ...

tests/unit/
├── prompts.test.js          # 新增：prompt 原语单元测试（mock stdin/stdout）
├── init-plan.test.js        # 新增：buildInitPlan / applyInitPlan 单元测试
├── init-interactive.test.js # 新增：runInit 交互流（mock prompt 模块）
└── ...                      # 25+ 现有 unit test 改造为调用 buildInitPlan/applyInitPlan
```

---

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

### 引导主流程数据流

```
runInit(argv)
  ├─ if argv.includes(--help) → printHelp; exit 0
  ├─ if argv.length > 0       → "unknown option" error; exit 2
  ├─ requireTty()             → 否则 "需要交互式终端" error; exit 2
  │
  ├─ collectInteractiveInput(projectRoot, cwdGitRoot, candidates):
  │   ├─ platform   = select("选择平台", [Claude Code, Codex])
  │   ├─ adapter    = getAdapter(platform)
  │   ├─ defaults   = resolveDeveloperIdentity(projectRoot, {}, adapter) // 只读 fallback
  │   ├─ name       = textInput("用户名", { default: defaults.name })
  │   ├─ lang       = select("语言", [zh, en], { default: defaults.lang })
  │   ├─ if cwdGitRoot is null && candidates.length >= 1:
  │   │     target = select("批量目标", [全部 child / 单选 / 取消])
  │   │     if 取消 → return null
  │   │   else:
  │   │     target = { mode: 'single-repo', projectRoot: cwdGitRoot ?? cwd }
  │   └─ return { platform, adapter, name, lang, target }
  │
  ├─ plan = buildInitPlan({ projectRoot, ...input })   // 与 buildInitWritePlan 等价
  ├─ printInitPreview(plan)                            // 重用 printInitDryRun 的 plan summary
  ├─ confirmed = confirm("是否执行以上变更？", { default: true })
  ├─ if !confirmed → console.log("已取消"); exit 0
  └─ applyInitPlan(projectRoot, plan); printSuccess(...)
```

### prompt 原语接口（不是实现）

```text
requireTty(): { ok: true } | { ok: false, reason: 'no-stdin-tty' | 'no-stdout-tty' }

select(question, options, { default?: index, hint?: string }): Promise<value>
  // 显示 question；当前高亮项可用 ↑/↓ 切换；Enter 确认；Ctrl+C / ESC 抛 PromptCancelled

textInput(question, { default?: string, validate?: fn }): Promise<string>
  // 默认值用 [灰色] 显示；Enter 直接接受默认值；输入新值即覆盖

confirm(question, { default?: boolean }): Promise<boolean>
  // y/n 单字符（大小写无关），Enter 即默认值；Ctrl+C / ESC 抛 PromptCancelled
```

PromptCancelled 在 runInit 顶层捕获 → 恢复 stdin cooked mode → 打印「已取消」→ exit 0。

---

## Implementation Units

### U1. 抽出 buildInitPlan / applyInitPlan 两层 API + 改造现有 unit tests

**Goal:** 把 init 的 plan-build 与 plan-apply 抽成独立、不依赖 argv / 不依赖交互层的 public API；现有 27 处 `runInit([...])` unit test 调用改为通过新 API 验证；CLI 对外行为保持 100% 不变。

**Requirements:** R6（部分），R4（间接：保证写出物等价的可测试基线）。

**Dependencies:** 无（这是基线重构）。

**Files:**
- Create: `src/cli/init-plan.js`
- Modify: `src/cli/commands/init.js`（导出 buildInitPlan / applyInitPlan，runInit 临时仍走旧 argv 路径以保 unit test 中转期通过）
- Modify: `package.json`（新增 `exports` 字段，显式暴露 `./src/cli/init-plan.js` 作为对外稳定子路径；保留默认 `./bin/spec-first.js` 入口；其他子模块默认私有，仅 init-plan 公开。`files` 字段当前已包含 `src/`，使 init-plan.js 自动进入 published tarball——无需变更 `files`）
- Test: `tests/unit/init-plan.test.js`（新增，覆盖 buildInitPlan 在 single-repo / all-repos / dry-run 分支下产出与今天 buildInitWritePlan 等价）
- Test: `tests/unit/init-plan-exports.test.js`（新增 contract test，断言 `package.json.exports['./src/cli/init-plan']` 字段存在并指向正确 path、且 `require('spec-first/src/cli/init-plan')` 可解析为 `{ buildInitPlan, applyInitPlan }`；该测试同时是 U5 tarball install fixture 验证的可重用断言）
- Modify: `tests/unit/init-dry-run.test.js`、`tests/unit/clean-dry-run.test.js`、`tests/unit/runtime-hook-permissions.test.js`、`tests/unit/browser-helper-tool-contracts.test.js`、`tests/unit/doctor-runtime-tools.test.js`（27 处 runInit 调用改为 buildInitPlan + applyInitPlan）

**Approach:**
- `buildInitPlan({ projectRoot, platform, name, lang, target, gitRootTopology })`：
  - 内部仍调用今天 `runInitForProject` 中 plan-计算部分（state read、preview state、preSyncPlan、initWritePlan、destructiveResetPlan 判定）
  - 返回结构化 plan 对象：`{ destructiveResetPlan, preSyncPlan, initWritePlan, untrackDiagnostic, isDryRun, summary, errors, diagnostics }`
  - **不**写任何文件、不打印任何 console；今天 `runInitForProject` 中的 `console.warn('Detected legacy spec-first state...')` / `console.warn('Detected current spec-first runtime drift...')` 等诊断输出改为 `diagnostics: [{ level: 'warn', code: 'legacy_state_detected', message }, { level: 'warn', code: 'current_runtime_drift', reasons }, ...]`，由 `runInit` / 后续调用方在打印或 preview 阶段统一渲染
  - workspace 模式下返回 `{ parent_plan, child_plans: [{ candidate, destructive_reset_plan, pre_sync_plan, init_write_plan, diagnostics }], advisory_summary }`，每个 child 的 destructive_reset 状态独立记录
- `applyInitPlan(projectRoot, plan)`：
  - 内部调用 applyOperationPlan / restoreRuntimeRollbackBackup 等已有逻辑
  - 返回 `{ exit_code, runtime_untrack }`，与今天 runInitForProject 末尾的 return value 等价
  - workspace 模式下顺序应用 parent → child0 → child1 → ...；任一 child apply 抛错时，仍按今天的 `overall_status='partial'` 合约写入 advisory summary，不让前面 child 的写出物撤销
- `runInit(argv)` 在 U1 阶段保持向后兼容：parseInitArgs → 计算 input → buildInitPlan → 打印 diagnostics + applyInitPlan，等价于今天的合并逻辑。**这是 U1 → U3 的过渡形态，U3 完成后 parseInitArgs 的 flag 解析必须删除（U3 Verification 加门控验证）**。
- **API audit checkpoint（强制 sub-task）：在抽 buildInitPlan/applyInitPlan 前先 grep 全部 56+ test 调用站点，确认每条 test scenario 都能通过 plan/apply API 验证；任意 case 不能直接转换的，单独记录并提议 alternative testing strategy（如 stdin-script harness、plan-only mocking）。这把原 Deferred to Implementation 的「testing-only stdin script harness」决策升级为 U1 阶段必须解的问题，避免 U3 后期发现 buildInitPlan/applyInitPlan 不够而返工。**

**Patterns to follow:**
- 现有 `mergeOperationPlans` / `summarizeOperationPlan` / `applyOperationPlan` 模式（state.js）。
- 复用现有 `validateClaudeSettingsFile`、`createRuntimeRollbackBackup`、`restoreRuntimeRollbackBackup` 不改名也不改语义。

**Test scenarios:**
- Happy path: 在临时项目运行 `buildInitPlan({ platform: 'claude', name: 'kuang', lang: 'zh', target: { mode: 'single-repo', projectRoot } })`，断言 plan.summary 含正确数量的 write_file / ensure_dir 操作；applyInitPlan 后 `.claude/`、`CLAUDE.md`、`CHANGELOG.md` 等存在且内容与今天 `runInit(['--claude','-u','kuang','--lang','zh'])` 等价。
- Happy path: codex platform 等价对照测试。
- **Happy path: byte-for-byte 等价的自动化断言。** 在 fixture 项目分别跑两份产物——一份通过新 `buildInitPlan + applyInitPlan`，一份通过旧 `runInit(['--claude','-u','kuang','--lang','zh'])`——计算 `.claude/`、`.codex/`、`CLAUDE.md`、`AGENTS.md`、`CHANGELOG.md`、`.developer`、`state.json` 的 SHA256 hash，断言两份等价。Covers AE2 直接证据。
- Edge case: `target.mode === 'all-repos'` 时 buildInitPlan 返回的结构里包含每个 child 的子 plan + 父 advisory summary 路径；其中一个 child 触发 destructive reset、另一 child 不触发时，结构正确区分。
- Edge case: dry run 模式（`isDryRun: true`）下 buildInitPlan 返回 plan + 不调 applyInitPlan 时磁盘未变。
- Edge case: **`inspectCurrentRuntimeDrift.detected === true` 时 buildInitPlan 返回 plan 含 `destructiveResetPlan`，且 `diagnostics` 含 `code: 'current_runtime_drift'` + reasons 数组**；applyInitPlan 走 backup → reset → preSync → write 顺序，发生异常自动恢复。
- Edge case: **`legacyStateDetected === true` 时（fixture 中放一份合法 legacy state JSON）buildInitPlan 返回 plan 含 destructiveResetPlan + diagnostics 含 `code: 'legacy_state_detected'`**。这条与上一条共同覆盖原计划缺失的 destructive 路径测试。
- Error path: `validateClaudeSettingsFile` 失败时 buildInitPlan 返回 `errors[]` 含明确 reason，不抛异常打断调用方。
- Integration: legacy state hard-reset 分支——buildInitPlan 在检测 legacy 状态时返回 plan 含 `destructiveResetPlan`；applyInitPlan 走 backup → reset → preSync → write 顺序，发生异常自动恢复。
- Integration: **State coupling guard.** 在 buildInitPlan 返回 plan 后、applyInitPlan 调用前，故意 mutate fixture 中某个 runtime mirror 文件；断言 applyInitPlan 仍写入 buildInitPlan 计算时锁定的内容（hash 与 buildInitPlan 一致），证明 plan 已 fully materialize 不会在 apply 时再次读盘计算 assetSync。
- Covers AE2（直接，通过 byte-for-byte hash 断言）；Covers AE4 与 AE5 的等价基线。

**Verification:**
- `npm run test:unit` 全部通过；改造后的 27 处 unit test 不再 import `runInit`，全部通过 buildInitPlan/applyInitPlan 验证 init 写出物。
- byte-for-byte 等价已经通过新增的自动化测试断言（不再依赖手动 diff）。
- API audit checkpoint 完成：56+ test 调用站点已分类，0 条因 plan/apply 抽象不足而 deferred。

---

### U2. 实现 prompt 交互原语 + 单元测试

**Goal:** 提供 `requireTty`、`select`、`textInput`、`confirm` 四个零依赖、可 mock 的 prompt 原语；用单元测试覆盖按键路径、默认值、取消语义。

**Requirements:** R2, R3。

**Dependencies:** 无。

**Files:**
- Create: `src/cli/prompts/index.js`、`src/cli/prompts/tty.js`
- Test: `tests/unit/prompts.test.js`（新增）

**Approach:**
- 用 `node:readline` + `process.stdin.setRawMode(true)` 监听 keypress；ANSI 渲染当前选中态。
- 全部 prompt 函数返回 Promise；统一的 `PromptCancelled` 错误用于 Ctrl+C / ESC。
- `requireTty()` 单独抽出，返回 `{ ok, reason }`，让 init 调用方用一个 if 判定即报错退出，便于测试 mock。
- 输入流默认从 `process.stdin` / 输出流默认到 `process.stdout`，支持依赖注入（`{ input, output }` 选项）以便单元测试用 `stream.PassThrough` mock。
- 退出前必须恢复 stdin cooked mode 与光标可见性，避免引导被中断后终端不可用。

**Test scenarios:**
- Happy path: `select("X", ['A','B','C'])`，注入 ↓↓Enter 字节序列，断言返回 `'C'`。
- Happy path: `textInput("X", { default: 'kuang' })`，注入 Enter 直接返回 `'kuang'`；注入 `'leo\n'` 返回 `'leo'`。
- Happy path: `confirm("X", { default: true })` 注入 Enter 返回 `true`；注入 `'n\n'` 返回 `false`。
- Edge case: `select` defaultIndex 越界时回落到 0。
- Edge case: `requireTty` 在 mock 的 non-TTY stream 上返回 `{ ok: false, reason: 'no-stdin-tty' }`。
- Error path: `select`/`textInput`/`confirm` 收到 Ctrl+C（`\x03`）抛 `PromptCancelled`；调用方捕获后 stdin 仍恢复 cooked mode（用 spy 验证 setRawMode(false) 被调）。
- **Error path: SIGTERM 中断。** 在 prompt 进行中向当前进程发送 `SIGTERM`（用 `process.emit('SIGTERM')` 模拟）；断言 prompt 模块注册的 SIGTERM handler 被调用，setRawMode(false) 与 cursor-show ANSI 输出已在退出前执行（spy 验证清理顺序）。
- **Error path: SIGHUP 中断。** 同上但发送 `SIGHUP`，断言相同的 cleanup 路径被走过（终端断连场景）。
- **Error path: stdin EOF.** 在 prompt 进行中关闭 mock 的 input stream（`input.push(null)`），断言 prompt 抛 `PromptCancelled` 或 `PromptAborted`，cleanup 仍跑（不能让 setRawMode(true) 残留）。
- Integration: 多个 prompt 串行调用（select → textInput → confirm）后 stdin 恢复正常 cooked mode（无遗留 listeners）。
- Integration: `process.on('exit')` 兜底——人为不触发任何 cleanup handler 直接 `process.exit(1)` 时，注册的 exit handler 仍恢复 cooked mode 与 cursor-show（防御 SIGKILL 之外所有可观测的异常退出路径）。

**Verification:**
- `npm run test:unit` 通过新增的 `prompts.test.js`。
- 手动跑 `node -e "require('./src/cli/prompts').select(...)"` 在 macOS Terminal、iTerm2 至少各跑一次，能正确显示并响应键盘。

---

### U3. 重构 init 命令为交互式入口

**Goal:** 把 `runInit` 改为「TTY 检测 → 六步引导 → buildInitPlan → preview → confirm → applyInitPlan」；移除全部 init flag 解析（保留 `--help`）；non-TTY 报错退出 2。

**Requirements:** R1, R2, R3, R4。

**Dependencies:** U1（buildInitPlan/applyInitPlan 已可用）、U2（prompt 原语已可用）。

**Files:**
- Modify: `src/cli/commands/init.js`（移除 parseInitArgs、新增 collectInteractiveInput、改 runInit 主流程）
- Test: `tests/unit/init-interactive.test.js`（新增）
- Modify: `tests/smoke/cli.sh`（init 调用拆为两条：① 直接 spawn `spec-first init` 在 non-TTY 子进程中并 grep 期望的「需要交互式终端」错误 + 非 0 退出码；② 用 Node 直接 `require` `src/cli/init-plan.js` 调 `buildInitPlan/applyInitPlan` 验证写出物。**绝对不引入 stdin pipe 注入引导答案的兜底通路**——这与 R3 直接冲突）

**Approach:**
- `parseInitArgs` **彻底删除 flag 解析**（含 `--claude`、`--codex`、`-u`、`--user`、`--lang`、`--dry-run`、`--repo`、`--all-repos` 与 `=` 形式）；只识别 `--help`/`-h`。其他任何 token 一律推入 `unknown`，runInit 顶层报 "unknown option <X>: spec-first init no longer accepts options" 后 exit 2。U1 中保留的旧 argv 中转路径在 U3 落地后必须删除。
- 主流程：
  1. `requireTty()` → `{ ok: false }` 时打印 zh/en 双语错误（按 lang-policy 当前默认 zh）+ exit 2
  2. 探测 cwdGitRoot 与 candidates（复用 `findGitRoot` / `discoverChildGitRepos`）
  3. **`resolveDeveloperDefaults(projectRoot, adapter)` 新 helper**——non-throwing variant，返回 `{ name: '' | string, lang: 'zh' | 'en' | '' }`。复用现有 `readDeveloperFile` / `readGitUserName`，但抛错时返回空值而不是抛异常（避免今天 `resolveDeveloperIdentity` 在 fallback 链全空时直接 throw 阻塞 prompt）；现有 `resolveDeveloperIdentity` 保持不变，继续在 buildInitPlan 内部用于 post-confirm 的最终解析与校验。
  4. `collectInteractiveInput(...)` 串行执行四到五步 prompt：platform select → name textInput（pre-fill = defaults.name）→ lang select（pre-fill = defaults.lang || 'zh'）→（仅父 workspace 检测到 child repos 时）batch target select
  5. 计算 `target` 后调 `buildInitPlan`
  6. `printInitPreview(plan)` 直接复用现有 `printInitDryRun` 的输出格式（保持 dry-run smoke test 期望文案的子集稳定）；preview 中**任何 destructive 操作（hard reset、remove_dir、prune_command）必须显式标注**（如 `🗑 destructive: <reason>`），让用户在 confirm 前看清；workspace 模式 preview 按 child 分块展示，每个 child 显式标注其 destructive_reset 状态
  7. `confirm("是否执行以上变更？", { default: true })`
  8. 取消 → `console.log('已取消'); return 0`；确认 → `applyInitPlan` + 渲染 plan.diagnostics（warn/info）+ 后续打印（沿用 `runInitForProject` 末尾的 success 日志）
- 顶层捕获 `PromptCancelled` → 恢复 stdin → 打印「已取消」→ exit 0。
- **workspace 模式 confirm 是单次「apply all」**——预览阶段已经把每 child 的 destructive 标注暴露，不再 per-child 二次确认；用户若要单选某 child，应在 batch target 步骤选「单选」。
- **删除门控（U3 Verification）**：`grep -rn 'parseInitArgs.*claude\|parseInitArgs.*codex\|parseInitArgs.*--repo\|parseInitArgs.*--all-repos' src/cli/commands/init.js` 必须 0 命中，否则 U3 未完成。

**Patterns to follow:**
- 现有 `printInitDryRun` 的输出格式（保持 preview 文案稳定，便于 smoke 测试 grep）。
- 现有 `runInitForWorkspace` 的 advisory summary 写出与日志格式（不改）。

**Test scenarios:**
- Happy path: mock prompt 模块返回 `{ platform: 'claude', name: 'kuang', lang: 'zh', target }`，runInit 在 fixture 项目中运行后 `.claude/`、`CLAUDE.md`、`CHANGELOG.md` 等写出与 U1 buildInitPlan 单测产物等价。Covers AE2.
- Happy path: 同上但 codex platform。
- Edge case: 用户在 confirm 步骤选「取消」，磁盘未变；exit code 0。Covers AE3.
- Edge case: 父 workspace 检测到 2 个 child repos，mock prompt 返回「全部」选项，buildInitPlan 收到 `target.mode === 'all-repos'`，applyInitPlan 后两 child + 父 advisory summary 都写出。Covers AE4.
- Edge case: 同上但选「单选 child0」，applyInitPlan 后只 child0 + 父 advisory summary 写出，child1 未变。Covers AE5.
- Error path: stdin 不是 TTY（mock `process.stdin.isTTY = false`）时 runInit 立即报错并 exit 2，磁盘未变。Covers AE6.
- Error path: argv 含任何非 `--help` 的 token 时报 "unknown option" + exit 2。Covers AE1.
- Error path: argv 含 `--help` 时打印新 help 文案（不再列 flag 表，改为说明引导步骤与 non-TTY 行为）+ exit 0。Covers AE7（部分）。
- Integration: 用户在中途 Ctrl+C 中断 prompt，runInit 顶层捕获 PromptCancelled，stdin 恢复 cooked mode，打印「已取消」，exit 0；磁盘未变。

**Execution note:** 这一步行为变化最大，建议先把 `tests/unit/init-interactive.test.js` 的 7-8 个测试场景写出来再实现 runInit 改造，让测试驱动主流程的边界与错误路径。

**Verification:**
- `npm run test:unit` 包含 init-interactive 全部通过。
- `npm run test:smoke` 中改造后的 `tests/smoke/cli.sh` 通过；smoke 中的「init non-TTY 报错」与「buildInitPlan 写出物等价」两类断言都覆盖。
- 手动在交互式终端跑一次 `spec-first init`，确认六步引导可走通且生成的产物正确。
- **删除门控**：`grep -rn 'parseInitArgs.*claude\|parseInitArgs.*codex\|parseInitArgs.*--repo\|parseInitArgs.*--all-repos' src/cli/commands/init.js` 0 命中；`grep -E '\\-\\-(claude|codex|repo|all-repos|dry-run|user|lang)\\b' src/cli/commands/init.js | grep -v "(unknown option|legacy|deprecated|comment)"` 也 0 命中（旧 flag 路径完全删除）。

---

### U4. CLI 引导话术全量更新（doctor / clean / adapter / index / developer / lang-policy / postinstall + contract test 断言）

**Goal:** 把 144 处中的 47 处 CLI 内引导话术 + 与之配套的 contract test 期望字符串全量更新为新格式（`Run \`spec-first init\` and choose <Claude Code|Codex> when prompted` / 中文等价），保证 doctor、clean、adapter fix 等所有用户可见的下一步指令不再出现 `--claude/--codex` flag。

**Requirements:** R5。

**Dependencies:** U3（新引导话术依赖于 init 已经是交互式）。

**Files:**
- Modify: `src/cli/commands/doctor.js`（30+ 处 fix 模板字符串；建议抽 `formatInitFix(adapter, options)` helper 集中渲染）
- Modify: `src/cli/commands/clean.js`（4 处 init 引导）
- Modify: `src/cli/adapters/claude.js`（4 处 fix 文案）
- Modify: `src/cli/index.js`（help / version / printHelp 中的 init 用法行）
- Modify: `src/cli/developer.js`（line 79 错误消息）
- Modify: `src/cli/lang-policy.js`（line 87, 103 zh/en 注释）
- Modify: `bin/postinstall.js`（欢迎消息中的「下一步」）
- Modify: `tests/unit/readme-language-split.test.js`、`tests/unit/using-spec-first-contracts.test.js`、`tests/unit/repository-guidance-contracts.test.js`、`tests/unit/spec-update-contracts.test.js`、`tests/unit/user-manual-contracts.test.js`、`tests/unit/spec-app-consistency-audit-entry.test.js`、`tests/unit/spec-graph-bootstrap-contracts.test.js`、`tests/unit/runtime-contract-boundary.test.js`、`tests/unit/claude-settings.test.js`、`tests/unit/package-install-contracts.test.js`、`tests/unit/version-reminder.sh`、`tests/unit/npm-install-matrix-smoke.test.js`（contract test 中所有 expect `spec-first init --claude/--codex …` 断言更新为新文案）

**Approach:**
- 先在 `src/cli/commands/doctor.js` 顶部抽 `formatInitFix(adapter, lang, intent)` helper（intent 为 'install' / 'resync' / 'restore-block' 等粗分类），让 30+ 处 fix 走同一渲染入口；这样后续若再调话术只改一处。
- 其他文件直接替换字符串。中文版本沿用现有 lang-policy zh 风格，英文沿用现有 lang-policy en 风格。
- contract test 改造原则：只改期望文案（不改测试拓扑），grep 旧字符串确保全部命中后再批量改。

**Patterns to follow:**
- 现有 `printInitNextSteps(platform, lang)` 的 zh/en 双语模式（src/cli/commands/init.js:513）。

**Test scenarios:**
- Happy path: doctor 在缺失 `.claude/spec-first/` state 的项目运行后输出含 `运行 \`spec-first init\` 并按引导选择 Claude Code`（zh）或 `Run \`spec-first init\` and choose Claude Code when prompted`（en），不含 `--claude/--codex` 字样。
- Happy path: clean 在没初始化的项目运行返回 1，stderr 含新文案。
- Edge case: claude adapter 检测到 SessionStart hook 漂移时 fix 文案不再出现 `--claude` flag。
- Integration: postinstall.js 输出含新文案（其本身不会自动跑 init）。
- Contract test: `grep -r "spec-first init --claude" tests/unit | wc -l == 0`（除外历史断言被显式标注为旧版的）。

**Verification:**
- `npm run test:unit` 全部通过。
- `grep -rn 'spec-first init --claude\|spec-first init --codex' src/cli bin scripts tests` 在 src/test 范围只剩明确说明「历史/legacy」的引用（如有）；运行时输出与 fix 文案均无新增 flag 引用。

---

### U5. Templates / hooks / skills / README / smoke / CHANGELOG 全量话术更新

**Goal:** 更新 19 个 command template boilerplate、Claude SessionStart hook body、多个 `skills/**/SKILL.md` 与 references、bootstrap 脚本、README 双语、smoke + tarball-install + matrix install 测试脚本、CHANGELOG.md 与 release-related 脚本话术；让外部用户、下游 spec-first 仓使用者通过 README/template/install 输出看到的下一步指令统一为交互式形态。

**Requirements:** R5（外部话术），R4（间接：通过 in-process buildInitPlan/applyInitPlan 跑 matrix install fixture 后写出物等价）。

**Dependencies:** U4（保持术语一致），U3（smoke 测试需要 init 已经是交互式），U1（matrix install fixture 改造依赖 buildInitPlan API）。

**Files:**
- Modify: `templates/claude/commands/spec/debug.md`、`mcp-setup.md`、`release-notes.md`、`work.md`、`slack-research.md`、`compound.md`、`doc-review.md`、`graph-bootstrap.md`、`code-review.md`、`app-consistency-audit.md`、`skill-review.md`、`optimize.md`、`compound-refresh.md`、`plan.md`、`sessions.md`、`update.md`、`polish-beta.md`、`ideate.md`、`brainstorm.md`（19 个 boilerplate 行；**已确认无共享 generator——逐个手改**）
- Modify: `templates/claude/hooks/session-start`（hook body 中的 `Run \`spec-first init --claude\``，约 2 处；该文件作为 SessionStart hook 内容直接渲染给每个 Claude 用户）
- Modify: `skills/spec-update/SKILL.md`（约 6 处 init flag 引用）
- Modify: `skills/using-spec-first/SKILL.md`（约 4 处）
- Modify: `skills/retired-skill-review/SKILL.md`（约 1 处）+ `skills/retired-skill-review/references/source-vs-runtime-contract.md`
- Modify: `skills/spec-graph-bootstrap/SKILL.md`（约 2 处）
- Modify: `skills/spec-graph-bootstrap/scripts/bootstrap-providers.sh`（line 373 stderr 输出）
- Modify: `skills/spec-graph-bootstrap/scripts/bootstrap-providers.ps1`（lines 724、740 stderr 输出，注意 PowerShell 字符串引号兼容性）
- Modify: `README.md`（6 处 init 用法示例 + 表格行 + runtime disposability 说明 + source 修改后的建议 + 新增 Migration 章节，提供 in-process buildInitPlan 调用样例给 CI 用户）
- Modify: `README.zh-CN.md`（6 处对应位置 + Migration 章节中文版）
- Modify: `tests/smoke/cli.sh`（init 调用改为：① grep non-TTY 报错；② Node 直接 `require` `src/cli/init-plan.js` 调 `buildInitPlan/applyInitPlan` 验证写出物）
- Modify: `tests/smoke/install-tarball.sh`、`tests/smoke/install-local.sh`（grep 字符串改造为新文案）
- Modify: `scripts/npm-install-matrix-smoke.js`：除了原计划提到的 dry-run marker（line 312）和 dry-run 验证消息（lines 403-404）之外，**还要改第 571-572 行的真实 `runInstalledBin(['init', '--claude', '-u', 'matrix', '--lang', 'en'])` 与 codex 对应行**——把这两处子进程 spawn 替换为 `require()` unpacked tarball 中的 `src/cli/init-plan.js` 然后调 `buildInitPlan({...})` + `applyInitPlan(...)`，重新定义 `expectedMarker`/`reason_code` 合约（这是 release evidence schema 变化，需要在 CHANGELOG 与 docs 显式说明）
- Modify: `scripts/generate-runtime-capability-catalog.js`（line 218、269 的 init 说明 zh/en）
- Modify: `CHANGELOG.md`（追加 (user-visible) entry：标注 release evidence schema 变化、外部 CI 用户的 migration 路径、host developer profile 解析按 CLAUDE.md 规则处理）

**Approach:**
- 19 个 templates **已确认无共享 generator**（U5 实施前已用 `grep -rn 'During \`spec-first init' src/cli scripts` 验证）。逐个手改 19 个 boilerplate 行；同时新增一条 contract test：断言所有 19 个 boilerplate 行匹配单一 canonical string，防止未来漂移。
- README 双语保持中英文行号对应；每条改动同步两侧。Migration 章节明确：(a) 普通用户无需变更；(b) CI/non-TTY 用户必须改为 `require('spec-first/src/cli/init-plan')` 程序化调用，附 1-2 行示例；(c) 不提供 env-var escape valve（坚守 brainstorm 决策）。
- smoke test 改造方式：原来 grep `spec-first init --claude` 的位置改为 grep 新文案；原来 spawn `init --claude --dry-run -u kuang --lang en` 的位置改为通过 Node 直接 require `src/cli/init-plan.js` 调 `buildInitPlan(...)` 验证写出物（与 U1 unit test 同思路）。
- npm-install-matrix-smoke 的 init evidence 合约重设：删除 `expectedMarker: 'Dry run: spec-first init (claude)'` 的字符串期望；改为「调 buildInitPlan(...) 后 plan.summary 含 write_file >= N」的结构化期望，并在 release artifact 文档（如 INIT_CLAUDE_DRY_RUN_LOG_FILE 注释或 docs/contracts/release-package-evidence.schema.json）中同步更新。
- CHANGELOG 按仓库现行格式；author 解析按 **AGENTS.md / CLAUDE.md「Changelog」节** 的 host-aware 规则——**当前 host 是 Codex 时先读 `.codex/spec-first/.developer`、当前 host 是 Claude 时先读 `.claude/spec-first/.developer`**；当前 host profile 缺失时 fallback 到 sibling host profile，再 fallback 到 `git config user.name`；不阻塞 U5 落地。U5 实施期对 host 的判定走当前会话的 host profile 路径（如本计划写入时由 Codex 主导，则 author 优先 `.codex/spec-first/.developer`）。
- **U5 落地前 reconcile + allowlist**：先 `grep -rn 'spec-first init --claude\|--codex' . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.claude --exclude-dir=.codex --exclude-dir=.agents --exclude-dir=docs/archive` 拿到全集，按下方 allowlist 分类后与本计划 Files 列表对账；新发现的「必改」位置就地补入 U5 范围。Phase 1 的 144 处估计与 doc-review 补充的 16 处可能仍有遗漏。
  - **必改（现行用法）**：`AGENTS.md`、`CLAUDE.md`、`README.md`、`README.zh-CN.md`、`CHANGELOG.md`、`docs/05-用户手册/**`（含 `01-快速开始.md`、`09-首次工作流走查.md`、`10-产物目录.md` 等所有现行手册）、`docs/contracts/**`（现行 contract 规范）、`docs/10-prompt/**`、`templates/**`、`skills/**/SKILL.md` 与 references、`agents/**`、`src/**`、`bin/**`、`scripts/**`、`tests/unit/**`、`tests/smoke/**`、`tests/integration/**`、`tests/e2e/**`。
  - **可豁免（历史 / 快照 / 引用旧形态作为论据的位置）**：`docs/archive/**`、`docs/brainstorms/**`（历史 requirements doc 含本计划 origin，但 origin 引用旧 flag 是描述「问题域」必需）、`docs/plans/**` 的历史计划（含本计划自身——本计划在 Problem Frame、Risks、Open Questions 中描述旧 flag 形态是必需）、`docs/2026-05-*/**` 之类的 audit/review 历史目录、`docs/solutions/**` 中明确标注为 historical 的条目。
  - **判别原则**：现行 docs/contracts/templates/skills/scripts 中作为「下一步指令 / 用法示例 / fix 提示」用途的 init flag 引用必须改；以「历史描述、问题陈述、原始 origin 引用」用途存在的可保留。如果某处文本自身在历史目录但写法是「最新用法示例」，应迁出或修正。

**Patterns to follow:**
- 现有 README 双语行号对应风格。
- 现有 CHANGELOG 条目格式（参见 CHANGELOG.md 当前最新一条）。

**Test scenarios:**
- Happy path: `npm run test:smoke` 全部通过。
- Happy path: `npm run lint:skill-entrypoints` 通过（如果 templates 改动触发 lint）。
- Happy path: tarball install 测试通过（`scripts/release-publish.cjs --dry-run` 等若有间接验证）；`npm-install-matrix-smoke.js` 的两处真实 init 调用改为 in-process buildInitPlan 后仍然报告每个 host 的写出物等价。
- Edge case: `tests/unit/readme-language-split.test.js` 通过新断言（应该已经在 U4 改完）。
- Contract test: 新增的 19-template canonical-string 断言通过。
- Contract test (verification): `grep -rn 'spec-first init --claude\|spec-first init --codex' . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.claude --exclude-dir=.codex --exclude-dir=.agents --exclude-dir=docs/archive` 在「现行用法」位置全部 0 命中（archive 与历史 plan/audit 保持不动；`docs/plans/` 历史计划除外，但本计划自身可保留对旧形态的引用）。
- Verification: `npm pack --dry-run` 后用 `tar -xzOf` 抽取 packaged `bin/postinstall.js` 与 `templates/claude/hooks/session-start`，grep `init --claude\|init --codex` 0 命中——确保发布产物里没有旧 flag 字串。
- Verification (tarball-install require path): `tests/smoke/install-tarball.sh` 中新增断言：`node -e "const m = require('spec-first/src/cli/init-plan'); if (typeof m.buildInitPlan !== 'function' || typeof m.applyInitPlan !== 'function') process.exit(1)"` 在 packaged tarball install 后必须返回 0。这是 README Migration 章节给 CI 用户的 require path 在发布产物中真实可达的契约证据。

**Verification:**
- `npm test`（覆盖 unit + smoke + integration + graph-bootstrap）通过。
- 手动检查 README 渲染（GitHub markdown）的 init 用法行符合「运行 spec-first init 然后按引导」的新形态。
- CHANGELOG entry 写入并通过 `scripts/check-release-continuity.cjs` 之类的 release 校验（若有）。

---

## System-Wide Impact

- **Interaction graph:** init 是 doctor / clean / postinstall / template `During` boilerplate 等多处「下一步指令」的目标；本次重构后所有这些位置的指引语义统一变为「运行 `spec-first init` 然后按引导选择」，没有新增交互入口或 callback。
- **Error propagation:** non-TTY 报错从「parse 失败提示 usage」变为「环境检测失败 exit 2」；调用方（postinstall、CI script）若误判 TTY 仍能拿到非 0 退出码，行为可观测。
- **State lifecycle risks:** init 的写出物本体不变，hard-reset / runtime drift / untrack 三条 state lifecycle 路径全部走 buildInitPlan + applyInitPlan，与今天等价；交互层不直接读写 state file。
- **API surface parity:** clean、doctor、tasks、session 的子命令入口形态保持不变；只更新它们引用 init 的话术。`spec-first init --help`、`--version`、根 `--help` 等 CLI universal flag 不变。
- **Integration coverage:** smoke test 改造为通过新 `buildInitPlan` 写出物验证；tarball install / npm-install-matrix 中原来依赖 `init --dry-run` 的部分改为 Node 直接调用 buildInitPlan/applyInitPlan，在 non-TTY 子进程里也能跑。
- **Unchanged invariants:** runtime mirror（`.claude/`、`.codex/`、`.agents/skills/`）、managed blocks（CLAUDE.md / AGENTS.md 中的 spec-first 注入块）、`.spec-first/` 状态目录、SessionStart hook、CHANGELOG bootstrap 模板——这些 init 落盘内容本身在本计划下保持一致；本计划只换入口形态。

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| 原生 readline + raw mode 在 Windows Legacy console（cmd.exe 非 ConPTY）渲染异常 | U2 单元测试覆盖 ANSI 字节流；实施期跑一次 Windows 10/11 + ConPTY/Legacy 各一回手动验收；必要时降级为 numbered prompt fallback（已纳入 Deferred to Implementation） |
| `process.stdin.isTTY` 在 Docker exec、SSH non-pty、tmux 中误判 | v1 用 `isTTY === true` 严格判定；实测发现误判时补「stdin 与 stdout 任一 isTTY 不为 true 即拒绝」规则；记录用户反馈复测 |
| 70+ 测试改造涉及面大，可能漏掉某个 contract 断言导致 CI 误绿 | U4 中先 `grep -rn 'spec-first init --claude\|--codex' tests/` 收集全集；每个 unit 改造后立即跑 `npm run test:unit` 确保覆盖 |
| 19 个 command template boilerplate 行可能有共享生成器，逐个改易错过 | U5 实施前先 `grep -l 'During \`spec-first init'` + 检查 src/cli/templates、scripts 是否有渲染逻辑；优先改 source generator |
| Ctrl+C 中断后 stdin 留在 raw mode 导致终端行不可用 | U2 顶层 try/finally 确保 setRawMode(false) 与光标恢复；单元测试用 spy 验证；prompt helper 暴露 PromptCancelled 让 runInit 顶层处理后再 exit |
| smoke / tarball install 测试是 non-TTY 环境，之前依赖 `init --claude --dry-run` 的预览能力消失 | U5 改造为 Node 直接调用 buildInitPlan/applyInitPlan（U1 已暴露 public API），不需要走 CLI 入口；smoke 仅验证 CLI 在 non-TTY 下正确报错 |
| 改 doctor.js 30+ fix 文案时遗漏某个分支 | U4 抽 `formatInitFix(adapter, lang, intent)` helper 集中所有 fix 渲染，逐处替换为 helper 调用；grep `Run \`spec-first init --` 收尾检查 0 命中 |
| 引导文案 zh/en 风格漂移 | 在 U2 / U3 / U4 中统一沿用 `printInitNextSteps` 与 lang-policy 现有 zh/en 双语风格；不引入 i18n 表 |
| **postinstall.js 与 init flag 移除 release 序错** —— 安装欢迎文案过期会让所有新装用户复制粘贴的命令立即报错 | postinstall.js wording 必须与 init flag 移除同 release 落地（U4 强制覆盖）；新增 verification step：`npm pack --dry-run` 后抽取 packaged postinstall.js 与 hooks/session-start，grep `init --claude\|init --codex` 必须 0 命中，否则发布阻断 |
| **`scripts/npm-install-matrix-smoke.js` 真实 init 调用未替换** —— 第 571-572 行子进程 spawn 的 `init --claude/--codex` 在新 CLI 下必崩，导致发布前 CI 永远失败 | U5 强制把这两行改为 in-process buildInitPlan；release evidence schema（INIT_CLAUDE_DRY_RUN_LOG_FILE 与可能的 release-package-evidence.schema.json）同步更新；CHANGELOG 标注合约变化 |
| **plan 文件清单仍可能遗漏** —— Phase 1 与 doc-review 总计算约 160+ 处，但仍可能漏 audits / agents / docs/contracts / 嵌入示例等隐藏面 | U5 实施第一步必须 reconcile grep 全集与计划 Files 列表；任意新发现就地补入 scope；不在 plan 阶段假定计数终结 |
| **`resolveDeveloperIdentity({}, ...)` 抛错阻塞 prompt 预填** —— 在 fallback 链全空时今天会 throw，会阻断引导第二步 | U3 新增 `resolveDeveloperDefaults` non-throwing helper 用于 prompt 预填；现有 `resolveDeveloperIdentity` 仍用于 post-confirm 最终解析；两条路径职责分明 |
| **SIGTERM/SIGHUP/EOF 等非 Ctrl+C 取消通路未覆盖** —— raw mode 下父进程被 kill 会让终端留在 raw mode、光标隐藏 | U2 顶层注册 `process.on('SIGTERM')` / `'SIGHUP'` / `'exit')` handlers，无条件恢复 stdin cooked mode + 显示光标；prompts.test.js 加 SIGTERM 模拟测试断言 cleanup 跑了 |
| **Workspace 模式 partial-fail 与 destructive reset 显式确认** —— per-child destructive reset 必须在 preview 中显式标注；某 child apply 抛错时父 advisory summary 仍记录 partial 结果（与今天 `runInitForWorkspace` 等价） | U1 + U3 落实：buildInitPlan 返回 `{ parent_plan, child_plans, advisory_summary }`；preview 按 child 分块 + 标注 destructive；apply 序列化按 parent → child0 → ...，任一抛错仍写 advisory summary |

---

## Documentation / Operational Notes

- **CHANGELOG（必更）**：本次改动是用户可见的 CLI 行为变化，必须在 `CHANGELOG.md` 追加 `(user-visible)` 条目，按当前 host developer profile 解析作者（CLAUDE.md「Changelog」节）。CHANGELOG 必须显式提及 release evidence schema 变化（npm-install-matrix-smoke evidence 合约调整）。
- **README 双语**：用法表、CLI 引用、运行示例必须中英同步更新（U5）；新增 Migration 章节同时维护 zh/en。
- **Migration note for users**：在 README、CHANGELOG 中明确「v<新版本> 起，`spec-first init` 不再接受 `--claude/--codex` 等 flag；请在交互式终端运行并按引导选择」。
- **External CI users（重要）**：本计划坚守 brainstorm 的「non-TTY 一律拒绝、不提供 flag/env-var/pipe escape valve」决策。CI / non-TTY 用户必须改为程序化调用：在 README Migration 章节给出最小可工作样例：
  ```js
  // CI / 容器内首次安装后初始化（替代旧的 `spec-first init --claude -u <name> --lang zh`）
  const { buildInitPlan, applyInitPlan } = require('spec-first/src/cli/init-plan');
  const plan = buildInitPlan({
    projectRoot: process.cwd(),
    platform: 'claude',
    name: process.env.DEVELOPER_NAME,
    lang: 'zh',
    target: { mode: 'single-repo', projectRoot: process.cwd() },
  });
  applyInitPlan(process.cwd(), plan);
  ```
  该 API 自本计划起作为 spec-first 内部稳定接口对外暴露（package.json `exports` 显式列出）；contract 由 `init-plan.test.js` 守护。
- **release evidence schema 变化（重要）**：`scripts/npm-install-matrix-smoke.js` 的 init evidence 合约由「字符串 dry-run marker」改为「buildInitPlan plan.summary 结构化期望」；下游消费 `INIT_CLAUDE_DRY_RUN_LOG_FILE` 的 release-publish 工具与 `docs/contracts/release-package-evidence.schema.json` 都要同步更新。
- **runtime drift 处理**：本计划完成后，用户首次重启 Claude/Codex 时会看到 source/runtime drift（因 source 已改但 runtime mirror 未刷新）。这是预期，提示用户运行 `spec-first init` 即可触发交互式刷新。

---

## Sources & References

- **Origin document:** [docs/brainstorms/2026-05-26-002-spec-first-init-interactive-rebuild-requirements.md](docs/brainstorms/2026-05-26-002-spec-first-init-interactive-rebuild-requirements.md)
- Related code: `src/cli/commands/init.js`、`src/cli/commands/doctor.js`、`src/cli/commands/clean.js`、`src/cli/adapters/`、`src/cli/developer.js`、`src/cli/lang-policy.js`、`bin/postinstall.js`、`templates/claude/commands/spec/`
- Related tests: `tests/unit/init-dry-run.test.js`、`tests/unit/clean-dry-run.test.js`、`tests/unit/runtime-hook-permissions.test.js`、`tests/unit/doctor-runtime-tools.test.js`、`tests/unit/readme-language-split.test.js`、`tests/unit/using-spec-first-contracts.test.js` 等
- Related plans: `docs/plans/2026-04-20-012-feat-init-coding-guidelines-plan.md`（init managed block 抽象基线）
- Project standards: `CLAUDE.md`、`docs/10-prompt/结构化项目角色契约.md`、`docs/contracts/context-governance.md`
