# Spec-First Skill 全局梳理（代码 + 文档联合版）

> 适用范围：`skills/spec-first/` 全量 skill、`src/` 运行时、`specs/{featureId}/` 过程产物、`docs/first/` 投影输出  
> 目标：为后续逐个优化 skill 节点提供一张“可执行、可校验、可追溯”的全局地图

## 1. 结论先行

Spec-First 不是“skill 文档集合”，而是一个分层的研发闭环系统。

- 第一层是 `skill`：定义意图、节点职责、输入输出、确认策略和成功标准
- 第二层是 `runtime`：把 skill 文档、背景资产、阶段状态、门禁条件和项目认知拼成可执行上下文
- 第三层是 `process`：用 `stage-state.json`、`gate-history.jsonl`、`todo-state.json`、`findings.md` 驱动推进
- 第四层是 `projection`：把 `.spec-first/runtime/first/*` 投影为 `docs/first/*`

当前代码的硬事实有三个：

- `docs/first/*` 是阅读输出，不是 machine truth
- `.spec-first/runtime/first/*` 才是项目级认知真源
- `stage advance` 不是“看起来可以”，而是必须过依赖检查 + gate 检查 + 阶段机合法转移

## 2. 代码真相源

下面这些文件决定了 skill 体系的真实行为，而不是仅仅决定“文档怎么写”。

| 文件 | 证明的事实 |
|---|---|
| `src/shared/skill-commands.ts` | skill 会被同步到用户级目录，且 Codex/Claude 的 skill 文件需要有效 frontmatter |
| `src/core/skill-runtime/dispatcher.ts` | `/spec-first:*` 的 skill 路由、runtime 路由、动态上下文注入、HARD-GATE、scope guard 都在这里发生 |
| `src/core/process-engine/stage-machine.ts` | 阶段转移是离散状态机，终态不可逆 |
| `src/core/process-engine/advance.ts` | `gate check -> stage history -> findings -> auto-skip` 的真实推进链 |
| `src/core/gate-engine/condition-registry.ts` | gate 条件定义来自这里：stage 级门禁、文档引用校验、C10、分析 CRITICAL、release 证据等 |
| `src/core/gate-engine/golive.ts` | 上线前检查不是 stage skill，而是 runtime 检查：Gate、SCA、安全、文档存在、release 证据 |
| `src/core/document-links.ts` | `document-links.yaml` 是产物之间的显式引用索引；缺引用会直接阻断或降级 |
| `src/core/task-plan/parser.ts` | `task_plan.md` 是结构化任务输入，依赖、traces、owner、状态都会被解析成图 |
| `src/core/skill-runtime/hard-gate.ts` | `code/orchestrate/design` 等高风险 skill 有运行时硬门禁和 worktree 约束 |
| `src/core/skill-runtime/confirm-policy.ts` | CLI 层有自己的确认策略矩阵，和 skill 文档里的 `confirm_policy` 不是同一层 |
| `src/core/skill-runtime/first-runtime-store.ts` | `00-first` 的 9 个 runtime 资产、index、docs projection、健康状态都由这里定义 |
| `src/core/skill-runtime/first-artifact-mapping.ts` | 变更文件 -> runtime 资产 -> docs 投影文档 的映射关系在这里集中管理 |
| `src/core/skill-runtime/context-resolver.ts` | skill 输入上下文的优先级是 runtime -> docs -> none，且 background 状态会影响推荐动作 |
| `src/core/skill-runtime/first-governance.ts` | `00-first` 在 wrap_up/done 阶段会做 project cognition 回写治理，不是纯展示 |
| `src/core/process-engine/next-step-decider.ts` | “建议下一步”与“实际推进”是两件事，且受 todo/gate/dependency/auto-loop 共同约束 |
| `src/config/bootstrap-manifest.ts` | `doctor/update` 的宿主依赖和必需 MCP / skills 来自 manifest，不是散落在 skill 文档里 |

## 3. 全局节点图

### 3.1 主链路

```text
00-first
  ├─> 00-onboarding
  ├─> 01-init
  └─> 02-catchup

01-init
  ├─ project-onboarding
  ├─ brownfield-baseline
  └─ feature-init

feature-init
  ├─> 03-spec
  │     └─> 20-spec-review
  ├─> 04-design
  │     └─> 05-research (按需 companion)
  ├─> 06-task
  ├─> 07-code
  │     └─> 08-review
  ├─> 12-verify
  └─> 10-archive

stage route:
00_init -> 01_specify -> 02_design -> 03_plan -> 04_implement -> 05_verify -> 06_wrap_up -> 07_release -> 08_done
                                              \___________________________________________/
                                                           09_cancelled 为终态分支
```

### 3.2 控制面与治理面

```text
11-plan -> 13-orchestrate -> 12-verify -> stage advance
   |             |               |
   |             |               +--> release / done 前的证据铁律
   |             +--> todo-runner / batch-executor / checkpoint
   +--> findings.md 计划摘要

14-status -> 当前阶段 + 覆盖率 + 健康分 + background layers
15-doctor -> 宿主 / MCP / skills / config / gate health
16-sync   -> document-links.yaml 回填与断链修复
17-feature -> .spec-first/current 的当前指针
21-analyze -> spec/design/task/document-links 一致性报告
focus-requirements -> owner-scoped PRD / side requirements / handoff summary
```

## 4. 节点分层与关系

### 4.1 入口与认知层

| Skill | 定位 | 输入 | 主要产物 | Gate / 校验 | 下游消费 |
|---|---|---|---|---|---|
| `00-first` | 项目级认知母机 | 源码、配置、依赖、runtime/docs 资产 | `.spec-first/runtime/first/*` + `docs/first/*` | `checkFirstUpdateContext` / `validateFirstRuntime` / `checkFirstDocsExistence` | `02-catchup`、`14-status`、`13-orchestrate`、`01-init`、`20-spec-review`、`21-analyze` |
| `00-onboarding` | 新用户引导与学习路径推荐 | `docs/onboarding/*`、`00-first` 资产 | 学习路径说明 | 问答流程必须使用 `AskUserQuestion` | 人类用户下一步操作 |
| `01-init` | 初始化 Feature 工作区 | 项目状态、平台、模式、规模、feature 参数、`first` 背景输入 | `stage-state.json`、`constitution.md`、`prd.md`、`task_plan.md`、`document-links.yaml`、`findings.md`、按需 `impact-analysis.md` | 三轨道路由、`backgroundInputStatus`、注册表锁、stage 骨架写入 | `03-spec` / `20-spec-review` / `04-design` |
| `focus-requirements` | 已审需求的 owner 收敛 | reviewed source requirement、owner、workspace 列表 | `docs/requirements/focus-requirements.md`、`handoff/side-requirements.md`、`handoff/handoff-summary.md` | `Owner Scope / In Scope / Out of Scope / Dependencies / Open Questions` 必须清晰 | downstream review / execution |

### 4.2 需求到设计到任务链

| Skill | 定位 | 输入 | 主要产物 | Gate / 校验 | 下游消费 |
|---|---|---|---|---|---|
| `03-spec` | 把原始需求转成 FR + AC | 用户需求、`prd.md`、`constitution.md`、`00-first` 资产 | `spec.md`、`document-links.yaml`、ID 注册 | 质量门禁、`Question Gate`、`C10`、宪法检查、`docs links validate` | `20-spec-review`、`04-design`、`06-task` |
| `20-spec-review` | `spec.md` 质量审查 | `spec.md`、`constitution.md`、`document-links.yaml`、`00-first` 认知资产 | `checklists/spec-review.md` | `C10 >= 80%`，低于阈值即阻断风险 | `04-design` |
| `04-design` | FR -> DS 设计映射 | `spec.md`、`constitution.md`、`05-research` 结论（按需） | `design.md`、`contracts/*.yaml`、更新 `document-links.yaml` | HARD-GATE：阶段必须是 `02_design` 且 `spec.md` 存在；宪法一致性检查 | `05-research`、`06-task` |
| `05-research` | 技术调研 / 证据收敛 | `04-design` 的候选方案、外部资料、官方文档 | `research.md`、`findings.md` | 证据协议、`[NEEDS VERIFICATION]` 标记、工具降级策略 | `04-design` |
| `06-task` | FR/DS -> TASK 可执行拆解 | `spec.md`、`design.md`、`document-links.yaml` | `task_plan.md`、`checklist.md`、`findings.md` | 任务粒度 2-4h、依赖 DAG、`C3=100%`、阶段必须是 `03_plan` | `07-code`、`11-plan`、`13-orchestrate` |

### 4.3 实现与质量链

| Skill | 定位 | 输入 | 主要产物 | Gate / 校验 | 下游消费 |
|---|---|---|---|---|---|
| `07-code` | 按 TASK 执行实现 | `task_plan.md`、`design.md`、`backgroundInputStatus`、`todo-state.json` | 源码、测试、`batch-report.md`、`batch-checkpoint.json`、`findings.md` | 阶段必须是 `04_implement`、`design.md`/`task_plan.md` 必须存在、TDD 守卫、worktree 风险守卫 | `08-review`、`12-verify` |
| `08-review` | 先合规再质量审查 | 代码 diff、traces、TDD 证据、`code-view` 背景 | `findings.md` | Stage 1 合规通过后才可 Stage 2；发现按 `MUST FIX / SHOULD FIX / OUT_OF_SCOPE` 分层 | `12-verify`、`13-orchestrate` |
| `12-verify` | 阶段验收与证据核验 | Gate、metrics、docs links、verify-view、`findings.md` | `findings.md`、验证报告 | 五步 Gate Function：IDENTIFY -> RUN -> READ -> VERIFY -> ONLY THEN | `13-orchestrate`、`stage advance` |
| `10-archive` | 复盘、归档、发布交接 | 运行态文件、Gate 历史、覆盖率总结、release evidence | `retro.md`、归档后的运行态文件 | `06_wrap_up` 阶段、组合门槛、`gate check`、`stage advance` 到 `07_release` | `07_release`、`08_done` |

### 4.4 编排、状态、同步与环境层

| Skill | 定位 | 输入 | 主要产物 | Gate / 校验 | 下游消费 |
|---|---|---|---|---|---|
| `11-plan` | 生成执行计划与风险视图 | 当前阶段、`gate/metrics`、`todo`、`findings` | `findings.md` | 计划摘要完整、风险已评估、下一步明确 | `13-orchestrate` |
| `13-orchestrate` | 主编排调度器 | stage-state、Gate 历史、task plan、todo state、背景治理信号 | `findings.md` | 只能在 verify 通过后推进；批次收口、检查点、fresh context 约束 | `stage advance` |
| `14-status` | 状态仪表盘 | stage-state、task plan、runtime/docs 背景层、文档指标 | 状态视图 | background layers、健康分、风险项、下一步建议必须齐全 | 人类决策 / `11-plan` / `13-orchestrate` |
| `15-doctor` | 宿主与工具链诊断 | Node、Git、hooks、MCP、skills、config、gate 降级状态 | 诊断报告；默认不写项目产物 | `bootstrap-manifest.ts` 驱动，默认 dry-run，`--fix --yes` 才修复 | 运维/环境修复 |
| `16-sync` | 文档关联与状态同步 | `document-links.yaml`、stage 产物、findings、`00-first` 认知资产 | `document-links.yaml`、`findings.md` | 断链、缺失引用、同步审计 | `12-verify`、`14-status`、`13-orchestrate` |
| `17-feature` | Feature 指针管理 | feature 列表、current 指针 | `.spec-first/current` | 切换后必须建议 `catchup` 重载上下文 | 依赖自动定位的所有 skill |
| `21-analyze` | 跨产物一致性分析 | `spec.md`、`design.md`、`task_plan.md`、`document-links.yaml`、background layers | `reports/analysis-report.md` | `CRITICAL` 返回非 0，报告必须分级 | `12-verify`、`13-orchestrate` |

## 5. 过程产物与内容关联关系

### 5.1 产物骨架图

```text
stage-state.json
  ├─> currentStage / stageStatus / history / terminal
  ├─> 驱动 stage machine
  └─> 被 status / orchestrate / verify / gate / advance 读取

document-links.yaml
  ├─> 声明 spec / design / task_plan / reports / retro / 其他引用
  ├─> 供 docs-links.validate / gate / sync 使用
  └─> 决定“引用是否断链”

findings.md
  ├─> 计划摘要
  ├─> 风险与阻塞
  ├─> Gate 警告 / WAIVER
  ├─> TDD 证据
  └─> 各类 skill 的最终审计留痕

task_plan.md
  ├─> Task DAG / owner / traces / depends_on / status
  ├─> 供 code / review / orchestrate / status / todo-runner 使用
  └─> 是实现链的事实来源

gate-history.jsonl
  ├─> gate_eval
  ├─> stage_advance
  ├─> release_auto_skip
  └─> 供 status / archive / go-live 读取历史

todo-state.json
  ├─> pending / in_progress / blocked / done
  ├─> auto-loop 状态
  └─> 供 orchestrate / code / status 使用
```

### 5.2 `00-first` 的 9 个 runtime 资产

`FIRST_RUNTIME_ARTIFACTS` 明确了项目级认知真源：

- `summary.json`
- `steering.json`
- `conventions.json`
- `critical-flows.json`
- `entry-guide.json`
- `api-contracts.json`
- `structure-overview.json`
- `domain-model.json`
- `database-schema.json`

这些资产再投影成 `docs/first/*`：

- `summary.json` -> `docs/first/README.md`、`docs/first/summary.md`
- `steering.json` -> `docs/first/README.md`、`docs/first/steering.md`
- `conventions.json` -> `docs/first/conventions.md`、`docs/first/development-guidelines.md`
- `critical-flows.json` -> `docs/first/critical-flows.md`、`docs/first/call-graph.md`
- `entry-guide.json` -> `docs/first/entry-guide.md`
- `api-contracts.json` -> `docs/first/api-docs.md`
- `structure-overview.json` -> `docs/first/codebase-overview.md`、`docs/first/architecture.md`、`docs/first/external-deps.md`
- `domain-model.json` -> `docs/first/domain-model.md`
- `database-schema.json` -> `docs/first/database-er.md`（条件生成）

### 5.3 内容关系图

```text
code / config / tests / git changes
   -> first-change-detector
   -> first-artifact-mapping
   -> runtime assets (.spec-first/runtime/first/*)
   -> first-doc-projection
   -> docs/first/*
   -> context-resolver / status / catchup / orchestrate

spec.md
   -> design.md
   -> task_plan.md
   -> code / review / verify / archive

task_plan.md
   -> todo-state.json
   -> batch executor
   -> code / orchestrate / status

document-links.yaml
   -> docs-links validate
   -> gate check
   -> sync

findings.md
   -> plan / review / verify / orchestrate / archive / advance 审计留痕
```

## 6. 节点推进逻辑

### 6.1 代码执行链

1. `spec-first <cmd>` 先走 `router` 或 `dispatcher`
2. skill 路由会读取 skill 文件，并注入 runtime notice
3. `HARD-GATE` 先确认阶段与前置产物
4. `scope-guard` 再限制修改范围
5. skill 正文再根据背景资产、任务计划和引用索引生成内容
6. 产物写盘后，`docs-links` / `gate` / `status` / `advance` 才有资格推进

### 6.2 阶段推进链

```text
00_init
  -> stage-state.json + constitution.md
  -> 01_specify

01_specify
  -> spec.md / checklists/spec-review.md / C10
  -> 02_design

02_design
  -> design.md / contracts/*.yaml / research.md
  -> 03_plan

03_plan
  -> task_plan.md / checklist.md / analysis-report.md
  -> 04_implement

04_implement
  -> code + tests + review
  -> 05_verify

05_verify
  -> test-report.md / security-scan.md / gate evidence
  -> 06_wrap_up

06_wrap_up
  -> retro.md / release evidence
  -> 07_release

07_release
  -> runtime go-live checks
  -> 08_done
```

### 6.3 当前实现里的重要细节

- `stage-machine.ts` 只管合法转移
- `advance.ts` 才会实际执行 `dependency-check -> gate-check -> history write -> findings audit`
- `advance.ts` 在 `07_release` 会自动收口到 `08_done`
- 所以文档中的“发布阶段”不等于一个独立的 skill 文件，而是 runtime route `golive`

## 7. 校验规则

### 7.1 门禁分层

| 校验器 | 位置 | 检查什么 | 典型阻断 |
|---|---|---|---|
| HARD-GATE | `skill-runtime/hard-gate.ts` | 阶段是否正确、前置文件是否存在、是否需要 worktree | 阶段不对、`spec.md`/`design.md`/`task_plan.md` 缺失、高风险未隔离 |
| 依赖检查 | `process-engine/dependency-checker.ts` | 下一阶段依赖文件、npm scripts、env vars | 缺文件、空文件、脚本缺失、环境变量缺失 |
| Gate 条件 | `gate-engine/condition-registry.ts` + `gate-evaluator.ts` | stage 级条件、文档存在、引用完整、C10、分析 CRITICAL、release 证据 | 任何 blocking 失败都会让 `PASS` 变 `FAIL` |
| 文档关联 | `document-links.ts` | `document-links.yaml` 结构、引用闭环、文件存在性 | 断链、重复路径、缺失文档 |
| `first` runtime 校验 | `first-runtime-validator.ts` + `first-docs-check.ts` | 9 个 runtime 资产和 docs 投影是否完整 | 缺 summary / steering / conventions / critical flows 等 |
| 上线前检查 | `gate-engine/golive.ts` | 最近 gate、SCA、安全、文档、release 证据 | 任一项不通过就不允许 go-live |
| 一致性分析 | `21-analyze` / `gate-engine/sca.ts` | spec/design/task/link/bkg 的跨产物冲突 | `CRITICAL` 直接返回非 0 |

### 7.2 gate 的真实语义

`gate check` 不是单一条件，而是“当前阶段的条件集合”：

- `00_init`：Feature 目录、mode/size/platforms、stage-state
- `01_specify`：`spec.md`、`document-links.yaml`、`C10`
- `02_design`：`design.md`、设计引用、宪法一致性
- `03_plan`：`task_plan.md`、引用完整、`CRITICAL` 为 0
- `04_implement`：声明文档存在
- `05_verify`：测试报告、安全扫描
- `06_wrap_up`：`retro.md`、release evidence
- `07_release`：release 证据

其中：

- `PASS` 表示所有阻断项通过
- `PASS_WITH_WAIVER` 表示存在受控豁免
- `FAIL` 表示不能推进

### 7.3 背景质量规则

`background_input_status` 由 `skills/spec-first/shared/background-quality-contract.md` 统一定义：

- `full`：背景输入完整
- `degraded`：部分可用
- `blind`：关键背景缺失

展示层必须同时输出：

- `background_input_status`
- `runtime 真源`
- `docs 输出`
- `同步状态`

最低严重度底线：

- `blind` 或 `runtime 真源 missing` -> 不得低于 `HIGH`
- `docs 输出 missing` -> 不得低于 `MEDIUM`
- `同步状态 attention` -> 不得低于 `MEDIUM`

### 7.4 编排治理规则

`11-plan` 和 `13-orchestrate` 额外受 `orchestration-governance-contract.md` 约束：

- `dependencyStrength`: `L1 / L2 / L3`
- `riskCategory`: `formal-design-review / high-risk-implementation / pre-release-verification`
- `riskSignals`: 高风险信号列表
- `recommendedAction`: `proceed / review-risk / backfill-first`

要点：

- `blind` 时必须优先建议补跑 `/spec-first:first`
- `degraded + L2/L3` 时不能静默推进
- `13-orchestrate` 要把治理字段投影成展示层 snake_case

### 7.5 `review` / `verify` / `archive` 的特别规则

`08-review`：

- 先合规，后质量
- Stage 1 没过，Stage 2 结论无效
- 发现必须分成 `MUST FIX / SHOULD FIX / OUT_OF_SCOPE`

`12-verify`：

- 必须用新鲜命令输出
- 必须完整读取结果，不可只看结论
- 必须把失败项和建议落盘到 `findings.md`

`10-archive`：

- 不只是写复盘，还要把知识回写分清 `global` 与 `feature-override`
- 归档通过后才能走到 `07_release`

## 8. 卡点清单

以下是后续逐个优化 skill 时最常见、也是最应该先修的卡点。

### 8.1 认知层卡点

- `00-first` runtime 不健康，导致后续 skill 只能拿到 `docs` 或 `none` 级背景
- `docs/first/*` 缺失或过时，导致 `catchup/status/orchestrate` 的背景解释失真
- `.spec-first/current` 不一致，导致自动定位错 Feature

### 8.2 需求链卡点

- `spec.md` 质量不足，`C10` 不达标
- `document-links.yaml` 未把 `spec.md / design.md / task_plan.md` 明确串起来
- `design.md` 把“未来可能需要”当成当前必须，产生投机性层次
- `task_plan.md` 过粗，无法被 `code` 的批量执行器消化

### 8.3 实现链卡点

- `task_plan.md` 存在 blocked/循环依赖
- `07-code` 需要 worktree，但当前没有隔离工作区
- 变更过大却没有分层批次，导致上下文包和证据链失控
- `08-review` 没有新鲜 traces / TDD 证据
- `12-verify` 只看结果不看证据，或者只看历史不看当前会话

### 8.4 门禁与同步卡点

- `document-links.yaml` 断链
- `gate check` 失败但尝试强推 `stage advance`
- `analysis-report.md` 里存在 `CRITICAL`
- release evidence 不齐（尤其是 `smoke-test-report.md` 与 `release-note.md`）
- `findings.md` 没有把决策、阻塞、下一步落盘

### 8.5 环境与宿主卡点

- `doctor` 发现 MCP / skills / hooks 不完整
- Claude / Codex / Gemini / Cursor 的宿主 bootstrap 不一致
- manifest 变更但 host bootstrap 未同步

## 9. 优化优先级建议

如果后续要“逐个优化 skill 节点”，建议按下面顺序做：

1. 先把 truth source 固化：`README.md`、`AGENTS.md`、`SHARED.md`、runtime 真源、`document-links.yaml`
2. 再收敛入口层：`00-first`、`00-onboarding`、`01-init`、`17-feature`
3. 然后收紧主链路：`03-spec` -> `04-design` -> `06-task` -> `07-code` -> `08-review` -> `12-verify` -> `10-archive`
4. 再强化编排/治理：`11-plan`、`13-orchestrate`、`14-status`、`16-sync`
5. 最后补外围质量技能：`20-spec-review`、`21-analyze`、`15-doctor`、`02-catchup`、`focus-requirements`

### 建议重点修的三类问题

- **重复语义**：多个 skill 都在说“确认策略 / gate / next steps”，但层级不完全一致
- **产物真源冲突**：`docs` 输出和 `runtime` 真源的边界必须继续收紧
- **推进信号混淆**：`suggest next`、`ready to advance`、`auto advance`、`stage advance` 要分层清楚

## 10. 逐节点一句话索引

- `00-first`：项目认知母机，输出 runtime 真源和 docs 投影
- `00-onboarding`：把用户导向合适的学习路径
- `01-init`：把项目状态初始化成可推进的 Feature 工作区
- `02-catchup`：把中断后的会话上下文恢复出来
- `03-spec`：把需求转成 FR + AC + 可追踪 spec
- `20-spec-review`：给 spec 做质量审查
- `04-design`：把 FR 映射为 DS 与接口/数据/一致性策略
- `05-research`：在设计前补证据、补调研、补外部最佳实践
- `06-task`：把设计拆成可执行 TASK DAG
- `07-code`：按 TASK 执行实现，支持批量/子 agent
- `08-review`：先合规后质量审查代码变更
- `12-verify`：用新鲜证据执行阶段验收
- `10-archive`：把交付证据归档并沉淀复盘
- `11-plan`：先做计划和风险评估
- `13-orchestrate`：主编排调度器，驱动 plan -> skill -> verify -> advance
- `14-status`：输出当前状态仪表盘
- `15-doctor`：诊断宿主、MCP、skills 和环境健康
- `16-sync`：同步文档关联与状态
- `17-feature`：管理当前 Feature 指针
- `21-analyze`：跨产物一致性分析
- `focus-requirements`：把已审需求收敛成 owner-scoped PRD

## 11. 结尾判断

从代码视角看，当前 Spec-First 已经不是“一个 skill 一个文件”的简单结构，而是：

- `skill` 文档层
- `runtime` 上下文层
- `process` 推进层
- `gate` 校验层
- `projection` 输出层

后续优化不应该先改“文档措辞”，而应该先改：

1. 节点之间的真源关系
2. 产物之间的依赖闭环
3. gate 的阻断条件是否真的可执行
4. 背景层和同步层是否能稳定提供高置信输入

只有这四件事先收紧，逐个优化 skill 节点才会真正提升流程质量，而不是只改出更漂亮的 prompt。
