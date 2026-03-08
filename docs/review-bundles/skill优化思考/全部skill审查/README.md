# 全部 Skill 审查总览

## 审查范围

- 本次只审查当前仓库内的 `skills/spec-first/*` 共 20 个技能。
- 背景基线来自 `docs/review-bundles/skill优化思考/skill-全流程/*.md` 四份文档。
- 代码基线来自 `src/core/skill-runtime/*`、`src/core/process-engine/init.ts`、`src/core/gate-engine/sca.ts`、`src/cli/commands/init.ts`、`src/cli/commands/doctor.ts`。
- 不把 `~/.codex` / `~/.agents` 下的会话技能纳入本轮“全链路优化”对象。

## 当前流程的最佳设计

- **Producer 层**：`00-first` 负责生成 runtime 真源，核心资产是 `.spec-first/runtime/first/index.json`、`summary.json`、`role-views.json`、`stage-views.json`；`docs/first/*` 只做投影视图。
- **Governor 层**：`01-init` 负责写入 `background_input_status`，`13-orchestrate` 负责输出 `full / degraded / blind` 与 `L1 / L2 / L3`、`risk_category`、`risk_signals`，`14-status`/`15-doctor`/`21-analyze` 负责展示、诊断、分析背景质量。
- **Consumer 层**：`00-onboarding` 优先消费 `role-views`；`03-spec`/`04-design`/`07-code`/`12-verify` 分别消费 `spec-view`/`design-view`/`code-view`/`verify-view`。
- **Peripheral 层**：`02-catchup`、`05-research`、`06-task`、`08-review`、`10-archive`、`11-plan`、`16-sync`、`17-feature`、`20-spec-review` 以本职职责为主，可复用治理信号，但不应强行膨胀为新的 stage-view 生产者。

## 总体结论

- **已基本成型**：runtime 真源、背景状态、编排风险分级、doctor/analyze 背景检查已经在真实代码里落地。
- **最大缺口**：多数 consumer skill 已在文档里声明读取 stage-view / role-view，但运行时注入目前只覆盖 `first` 与 `orchestrate`，尚未形成统一的 consumer 上下文注入链路；证据见 `src/core/skill-runtime/dispatcher.ts:411`、`src/core/skill-runtime/dispatcher.ts:421`、`src/core/skill-runtime/dispatcher.ts:428`，以及 `src/core/skill-runtime/first-context.ts:81` 的“只提供读取函数、不参与 skill 装配”。
- **最大漂移**：`00-first` 文档与测试存在两处标题级漂移，已直接导致 `tests/unit/first-skill-docs.test.ts` 失败；`12-verify` 文档想消费的字段与 producer 实际填充字段仍未完全闭环。
- **目录级漂移**：仓库根 `README.md` 仍保留 `08-code-review`、`09-test` 等旧口径，而 `skills/spec-first/README.md` 已切到 `08-review`、`12-verify`，需要统一。

## 测试基线

- 已运行：`pnpm vitest run tests/unit/first-skill-docs.test.ts tests/unit/first-context-stage-views.test.ts tests/unit/onboarding-skill-docs.test.ts tests/unit/init-runtime-readiness.test.ts tests/unit/spec-skill-docs.test.ts tests/unit/design-skill-docs.test.ts tests/unit/code-skill-docs.test.ts tests/unit/verify-skill-docs.test.ts tests/unit/orchestrate-args-parser.test.ts tests/unit/status-skill-docs.test.ts tests/unit/doctor-skill-docs.test.ts tests/unit/analyze-skill-docs.test.ts tests/unit/analyze-background-quality.test.ts`
- 结果：13 个测试文件中 12 个通过；仅 `tests/unit/first-skill-docs.test.ts` 失败，失败点为 `testing-strategy.md` 与 `detection-rules.md` 的 Phase 标题字样漂移。

## 优先级矩阵

### P0

- 建立统一的 consumer 背景注入入口，让 `00-onboarding`、`03-spec`、`04-design`、`07-code`、`12-verify` 真正拿到 role/stage view，而不是只在文档里要求。
- 修复 `00-first` 文档与测试的标题级漂移，恢复 `first-skill-docs` 测试为绿。
- 收口 `verify-view` 字段契约，统一 producer、projection、consumer 三端命名与填充策略。
- 修复仓库根 `README.md` 的旧 skill 口径。

### P1

- 给 `02-catchup`、`05-research`、`06-task`、`08-review`、`11-plan`、`20-spec-review` 增加最小背景治理协议：至少显式呈现 `background_input_status`，并说明各自使用哪类背景输入。
- 把 `detectBackgroundInputStatus` 这类已落地逻辑抽到可复用入口，避免各 skill 各写一套口径。

### P2

- 让 `10-archive` 在复盘中可选分析“背景质量债务”。
- 评估 `16-sync`、`17-feature` 是否需要只读展示背景摘要；如无明确收益，可保持轻量。

## 逐 skill 结论索引

- `00-first.md`
- `00-onboarding.md`
- `01-init.md`
- `02-catchup.md`
- `03-spec.md`
- `04-design.md`
- `05-research.md`
- `06-task.md`
- `07-code.md`
- `08-review.md`
- `10-archive.md`
- `11-plan.md`
- `12-verify.md`
- `13-orchestrate.md`
- `14-status.md`
- `15-doctor.md`
- `16-sync.md`
- `17-feature.md`
- `20-spec-review.md`
- `21-analyze.md`
