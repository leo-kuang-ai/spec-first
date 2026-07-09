# spec-app-consistency-audit

`spec-app-consistency-audit` 是移动 App 静态优先一致性审查 workflow。它用于在模拟器、真机、打包或自动化设备验证前，对 PRD、Figma 本地上下文、源码、页面路由、KMP / Clean Architecture、组件复用、analytics、i18n、工程质量和行业 lens 做交叉检查。

本 README 是 source package 内的维护者导航，不替代 [`SKILL.md`](./SKILL.md)、`scripts/`、`schemas/` 或 `references/` 中的执行契约。`spec-first init` 会把整个 skill package 作为 generated runtime support files 投影到宿主 runtime，但 runtime copy 不是新的 source of truth；冲突时以当前 source 契约、脚本和确定性测试为准，不手改 runtime mirror 修复行为。

## 适用场景

使用这个 skill，当任务目标是：

- 审查 App PRD / Figma / local source 是否一致。
- 在 runtime validation 前发现静态可证据化的产品、设计、架构、组件、埋点或 i18n 漂移。
- 让 `spec-code-review`、移动 QA、实现 owner 或 Report-Writer 消费结构化 app-audit artifacts。

不使用这个 skill，当任务目标只是：

- 普通 diff code review，走 `spec-code-review`。
- PRD 创建、改写或 planning-readiness validation，走 `spec-prd`。
- lint / test / build / simulator / real-device / Maestro / Appium / cloud-device 执行。
- 已实现页面的交互式 UI polish，走 `spec-polish`。
- skill / agent 质量审查，不属于本 App consistency audit；需要修改 source skill 时走 `spec-write-skill`，只审查时做 bounded source review。

## 快速入口

常见 headless 调用形态：

```bash
node skills/spec-app-consistency-audit/scripts/run-audit.js \
  mode:headless \
  base:main \
  source:app \
  prd:docs/prd.md \
  figma-context:.spec-first/input/figma-context.json
```

当前 v1 deterministic runner 只支持 `mode:headless`，并要求 `base:<git-ref>`。`mode:default` / `mode:report-only` 是长期语义契约，不代表当前 runner 已支持完整编排。

## 产物边界

Headless artifacts 写在：

```text
.spec-first/app-audit/runs/<run-id>/
```

核心产物包括 `metadata.json`、`preflight.json`、`impact-facts.json`、`app-audit-context.json`、`issues.json`、`audit-report.json`、`artifact-manifest.json` 和 `headless-envelope.txt`。

Runner 只产出确定性事实和 envelope：不调用 LLM、不生成语义 verdict、不发起 Figma 远程抓取、不修改产品源码、不手改 generated runtime mirrors。

## 维护入口

- [`SKILL.md`](./SKILL.md)：触发边界、mode contract、输出/证据/隐私边界。
- [`evals/examples.json`](./evals/examples.json)：trigger、near-neighbor boundary、failure、expected-output examples-as-context。
- [`evals/recorded-output-fixtures.json`](./evals/recorded-output-fixtures.json)：no-raw-issues、degraded-mode、code-review handoff 的最小 recorded output fixtures；不是 provider-backed model evidence。
- [`references/headless-runner.md`](./references/headless-runner.md)：16 步 runner 管线、fail-fast reason codes、artifact lifecycle。
- [`references/mode-output-contract.md`](./references/mode-output-contract.md)：详细 mode tokens、scope resolution、Figma materialization、output/writeback、issue protocol。
- [`references/evaluation-governance.md`](./references/evaluation-governance.md)：production-but-not-governed 状态、owner/review cadence、治理证据缺口。
- [`references/report-format.md`](./references/report-format.md)：Report-Writer 输出结构。
- [`references/pilot-validation.md`](./references/pilot-validation.md)：v0.2 readiness pilot record。
- [`references/ecc-source-lock.json`](./references/ecc-source-lock.json)：ECC-derived lenses 的只读 source lock。

## 验证

常用 focused checks：

```bash
npm run test:eval-fixtures
npx jest --runTestsByPath \
  tests/unit/spec-app-consistency-audit-entry.test.js \
  tests/unit/spec-app-consistency-audit-prompts.test.js \
  tests/unit/spec-app-consistency-audit-cli-e2e.test.js \
  --runInBand
```

`scripts/` 负责 deterministic facts；LLM / experts 负责 issue validity、severity、impact、recommendation 和 downstream handoff 判断。
