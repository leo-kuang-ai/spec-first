# spec-first 项目认知报告

> 调查日期：2026-10-27  
> 调查范围：`/Users/kuang/xiaobu/spec-first` 只读源码、合同、文档、测试与 Git 状态  
> 证据口径：除本报告外未修改文件；generated runtime mirror 未作为源码依据；Graphify 仅用于 advisory 导航，关键结论均回到源码、合同、测试或 Git 事实确认。

## 一、结论摘要

`spec-first` 是一个仓库原生、跨 AI coding 宿主投射的 **AI-enhanced SDLC / SDD workflow harness**。它要解决的问题不是“让模型生成更多代码”，而是把一次容易丢失意图、范围、证据和经验的 AI coding 会话，变成由项目拥有、可追踪、可验证、可复用的可信变更。它覆盖的是一次需求到可信变更的工程闭环，不负责统一接管发布排期、部署、生产运维或完整 AI-DLC 生命周期。[README.md:5-9](../../README.md#L5-L9)；[结构化项目角色契约.md:33-39](../../docs/10-prompt/结构化项目角色契约.md#L33-L39)

项目面向已经使用 Claude Code、Codex、Kiro、Qoder、Cursor、OpenCode、ZCode 或 Pi，并希望跨会话/跨宿主保留意图、计划、验证证据和工程知识的开发者与团队。README 给出的适用条件是：已有 AI coding 宿主、需要跨会话或跨宿主交接、需要计划/review/验证证据、希望沉淀合格经验；战略文档中“个人/资深开发者为主要使用者、平台/技术负责人负责推广治理”的表述仍属于 Working Positioning Baseline 的 `hypothesis`，不能当作已完成用户研究。[README.md:229-241](../../README.md#L229-L241)；[docs/strategic-review/README.md:6](../../docs/strategic-review/README.md#L6)

核心价值由三方分工建立：宿主提供模型、工具、权限和执行 primitive；spec-first 连接 intent、context、scope、artifact、claim、evidence、handoff 与 knowledge；项目 owner 决定价值、授权副作用并作最终语义验收。[README.md:35-48](../../README.md#L35-L48)

核心链路是：

```text
Codebase -> Spec -> Plan -> Tasks -> Code -> Review -> Knowledge
```

它并非由一个中心流程引擎实现，而由四类资产组合完成：

1. `skills/**/SKILL.md` 定义语义 workflow、阶段边界、授权和 handoff；
2. `templates/` 与 adapter 把同一语义投射为各宿主可发现的 command/skill/runtime；
3. `src/cli/` 管理安装、检查、清理、task/plan 确定性辅助、证据 writer/validator；
4. `docs/contracts/`、schema 与 `tests/` 固定 artifact、gate、consumer、source/runtime 和证据边界。

当前工程基础较强，尤其是 source/runtime 分离、确定性 plan/apply、精确 managed-state 所有权、回滚、跨宿主枚举漂移守卫、结构化 verification/closeout 合同和多层测试。但真实宿主 loader/invocation、真实任务和 field outcome 证据仍明显弱于结构/合同证据；Cursor、OpenCode、Kiro、Qoder、ZCode、Pi 的支持强度不等价。当前工作区还在推进新一轮 CE 上游同步，正式逐路径语义裁决为 0，producer 仍被旧的 517-path 常量阻塞，因此不能把冻结清单或 implementation-ready 方案解释为同步完成。

---

## 二、证据与已确认事实

### 2.1 产品问题、目标用户和核心价值

**源码已确认事实**

- 项目口号是“把 AI coding 会话变成可信、由项目拥有的变更”；产品定位明确限制在 AI-enhanced SDLC / SDD workflow harness。[README.md:5-9](../../README.md#L5-L9)
- 第一性原理认为“代码不再稀缺，可信变更仍然稀缺”，瓶颈转向正确意图、有效上下文、可靠反馈、验证能力和人的注意力。[结构化项目角色契约.md:11-24](../../docs/10-prompt/结构化项目角色契约.md#L11-L24)
- 项目用两个公式描述价值：`可信变更 = 清晰意图 × 有效上下文 × 有界执行 × 可核验证据`，`系统复利 = 可信变更 × 可失效学习`。[结构化项目角色契约.md:23-26](../../docs/10-prompt/结构化项目角色契约.md#L23-L26)
- `quality-adjusted throughput` 只计入通过正确性、安全、审查和必要验证的变更，并扣除澄清、返工、冲突、验证、回滚和维护成本；代码量、token、agent 数和 artifact 数不能单独代表价值。[结构化项目角色契约.md:37-39](../../docs/10-prompt/结构化项目角色契约.md#L37-L39)
- 用户可见的项目证据包括：`docs/plans/` 中的意图和计划、task pack 与 source/runtime 边界、真实命令/退出码/日志/verification summary、`docs/solutions/` 中带来源和失效条件的知识。[README.md:41-48](../../README.md#L41-L48)

**调查者判断**

- 项目的差异化不在“更强的 agent orchestration”，而在项目拥有的 intent/evidence/governance/knowledge 协议，以及跨宿主可重建投射。
- 最适合的早期用户是已经遇到跨会话失忆、审查负担、证据断裂或多宿主迁移问题的资深开发者/技术团队。只需要一次性 prompt、拒绝在仓库保存 artifacts、或需要完整交付/运维平台的用户并非目标人群。

### 2.2 核心哲学与架构边界

#### Scripts/tools、LLM/agents、human/owner

**源码已确认事实**

- Scripts/tools 负责文件发现、路径解析、Git 状态、schema、hash、dependency/readiness、runtime drift、`reason_code`、artifact path、raw log 和 exit code 等可机械判定事实；LLM/agents 负责需求理解、架构取舍、任务拆分、影响面、review、风险、fallback 和 handoff；human/project owner 裁决价值、高风险和不可逆取舍。[AGENTS.md:64-79](../../AGENTS.md#L64-L79)；[结构化项目角色契约.md:68-71](../../docs/10-prompt/结构化项目角色契约.md#L68-L71)
- 外部 provider 默认只给带 provenance/freshness/limitations 的 advisory 候选。Graph、MCP、浏览器、包管理器或 shell 输出都不拥有 scope、finding、root cause、mutation 或 workflow state 权威。[docs/contracts/ai-coding-harness.md:38-55](../../docs/contracts/ai-coding-harness.md#L38-L55)

#### 五类 gate

- `gate the exits, not the thinking`：硬 gate 只守 mutation、verification claim、source/runtime、handoff/context reset、knowledge promotion；需求是否清楚、计划是否合理、finding 是否成立等语义判断不应被脚本硬编码成状态机。[结构化项目角色契约.md:72-79](../../docs/10-prompt/结构化项目角色契约.md#L72-L79)；[AGENTS.md:80-82](../../AGENTS.md#L80-L82)
- 没有宿主 blocking primitive 时，gate 必须降级为明确的 loud convention，不能把 prose 伪装成已强制的运行时门。

#### Source-of-truth 与 generated runtime

- 行为真相源包括 `CLAUDE.md`、`AGENTS.md`、`skills/`、`templates/`、`src/cli/`、`src/cli/contracts/**`、`docs/`、README、CHANGELOG、`package.json`。`.claude/`、`.codex/`、`.agents/skills/`、`.cursor/`、`.kiro/`、`.qoder/`、`.opencode/` 下的受管 runtime 是派生投影，不得作为 source fix。[AGENTS.md:101-151](../../AGENTS.md#L101-L151)；[source-runtime-customization-boundary.md:7-29](../../docs/contracts/source-runtime-customization-boundary.md#L7-L29)
- 目标仓库中的 host root 是 mixed-ownership surface。删除权限来自精确 managed state、managed-slice identity 或显式 legacy allowlist，不能根据 `spec-*` 前缀推断所有权。[source-runtime-customization-boundary.md，Generated Runtime Mirrors 章节](../../docs/contracts/source-runtime-customization-boundary.md#generated-runtime-mirrors)

#### Artifact、evidence、consumer

- Artifact 类型需区分 advisory、confirmed、generated、degraded；artifact 存在本身不证明结果。[AGENTS.md:80-82](../../AGENTS.md#L80-L82)
- `artifact-summary.v1` 是 summary-first handoff：producer 提供目标、范围、结论、风险、证据路径和 full-read trigger；consumer 先读摘要，仅在 trigger 命中时展开全文。[artifact-summary.md:21-78](../../docs/contracts/artifact-summary.md#L21-L78)
- `context-bundle.v1` 传递 related paths、artifact summaries、evidence paths、排除理由和预算；helper 只规范化路径、做 containment 和预算事实，不搜索仓库或判断语义相关性。[context-bundle.md:43-104](../../docs/contracts/context-bundle.md#L43-L104)
- `verification-run-summary.v1` 要求 `passed` 必须同时有 `ran=true`、`exit_code=0` 和 repo-relative 脱敏日志引用；未运行、失败和 degraded 有独立状态。[verification-run-summary.md:14-29](../../docs/contracts/verification/verification-run-summary.md#L14-L29)
- `honest-closeout.v1` 校验 claim 与 evidence 的结构关系。当前 consumer 是 `spec-work`、`spec-debug`、`spec-code-review`；只有 `spec-work` 可条件性写 `spec-work-run-artifact/v2`。[honest-closeout.md:4-24](../../docs/contracts/workflows/honest-closeout.md#L4-L24)
- 新增或实质改写的 `docs/solutions/**` 必须含可回源 `source_refs` 和 `invalidation_condition`，并经过 candidate -> review -> promote；脚本只检查结构，LLM/human 判断是否真的可复用、证据是否充分。[knowledge-harness.md:56-76](../../docs/contracts/knowledge/knowledge-harness.md#L56-L76)

### 2.3 主链路如何落到代码、Skills、Contracts 和 Tests

| 链路节点 | Canonical owner 与产物 | 确定性支撑/主要 consumer |
|---|---|---|
| Codebase | 当前源码、测试、合同、项目文档；Graphify/code graph 只做导航候选 | `context-bundle`、source reads、project graph contract；plan/work/review 必须回源 |
| Spec | `spec-brainstorm` 产生 requirements-only unified plan；brownfield `spec-prd` 产生 `docs/brainstorms/*-requirements.md` | product owner 确认 WHAT；PRD finalizer/checker 只拥有 machine fields；consumer 是 `spec-plan`/`spec-doc-review` |
| Plan | `spec-plan` 将需求或描述深化为 `artifact_readiness: implementation-ready` 的 unified plan，不执行代码或测试 | Product Contract 保持 WHAT；LLM 基于当前源码决定 HOW；consumer 是 `spec-write-tasks`、`spec-work`、reviewer |
| Tasks | `spec-write-tasks` 是可选派生层，`docs/tasks/` task pack 不替代 source plan | `spec-first tasks hash/validate` 校验 source-plan path、body hash、freshness、结构；语义拆分质量仍由 LLM/reviewer 判断 |
| Code | `spec-work` 读取 settled plan/task pack，修改 canonical source，执行局部验证和 review/fix loop | `verification-run-summary`、`honest-closeout`、条件性 `spec-work-run-artifact/v2`；commit/landing 分开授权 |
| Review | `spec-code-review` 默认 report-only，基于 diff、意图、测试和风险 persona 形成 structured findings | `mode:agent` 永不修改；provider/peer 结果不能直接成为 finding；consumer 是 spec-work、LFG、人类 reviewer |
| Knowledge | `spec-compound` 捕获一个已解决且已验证的问题；`spec-compound-refresh` 维护旧 learning | `validate-frontmatter.py --promotion` 提供确定性地板；plan/work/debug/review 召回时仍按 advisory 处理并回源 |

关键 workflow 合同可从以下入口确认：`skills/spec-brainstorm/SKILL.md:19`、`skills/spec-prd/SKILL.md:27`、`skills/spec-plan/SKILL.md:20-32`、`skills/spec-write-tasks/SKILL.md:89-119`、`skills/spec-work/SKILL.md:19-28`、`skills/spec-code-review/SKILL.md:15-23`、`skills/spec-compound/SKILL.md:16-25`。

模板不是行为真相的第二份副本。以 `templates/claude/commands/spec/plan.md`、`work.md`、`code-review.md` 为例，模板只保存 command frontmatter，`init` 时把它与对应 `skills/spec-*/SKILL.md` 正文合成 runtime command；行为变更应修改 paired skill。[templates/claude/commands/spec/plan.md:2-13](../../templates/claude/commands/spec/plan.md#L2-L13)

### 2.4 CLI 入口、主要命令、关键模块和数据流

#### 入口与命令

- `bin/spec-first.js` 先执行 Node 版本检查，再把 argv 交给 `src/cli/index.js#runCli`，统一设置退出码和异常输出。
- `runCli` 当前分派：`doctor`、`quickstart`、`init`、`update`、`clean`、`tasks`、`plans`、`repair-worktree`、`session`、`internal`，并处理 version/startup reminder。[src/cli/index.js:30](../../src/cli/index.js#L30)
- 实际运行 `node /Users/kuang/xiaobu/spec-first/bin/spec-first.js --help` 已确认上述命令面和八个 host flag。宿主 workflow 入口在 `init` 后由宿主加载，不是 shell 子命令。

#### 初始化数据流

```text
bin/spec-first.js
  -> runCli(argv)
  -> runInit(argv)
  -> parse/collect target + hosts + developer/lang
  -> buildInitPlans()（每宿主一份）
  -> buildProjectInitPlan()/buildWorkspaceInitPlan()
  -> loadPluginManifest() + loadSkillsGovernance()
  -> buildFilteredAssetSet(host)
  -> planBundledAssetSync() + adapter.planRuntimeFilesSync()
  -> 合并 instruction/state/gitignore/changelog/runtime operation plan
  -> dry-run/preview/确认
  -> applyProjectInitPlan() / applyWorkspaceInitPlan()
  -> state.json + summary；失败时回滚受管 runtime
```

- Plugin manifest 不是静态复制清单，而是从 `package.json`、`src/cli/contracts/dual-host-governance/skills-governance.json`、`templates/claude/commands/spec`、`skills/`、`agents/` 动态构建。[src/cli/plugin-manifest.js:22-100](../../src/cli/plugin-manifest.js#L22-L100)
- `buildFilteredAssetSet` 根据每条 skill 的 `entry_surface` 和 `host_delivery.<host>` 决定 command、workflow skill、standalone skill、internal skill 与 skipped 集合。[src/cli/plugin-governance.js:11](../../src/cli/plugin-governance.js#L11)
- `planBundledAssetSync` 先构建纯 operation plan，不直接写；`buildProjectInitPlan` 再加入 adapter runtime、受管 instruction、state、gitignore 和必要的初始 changelog。[src/cli/plugin-sync.js:88](../../src/cli/plugin-sync.js#L88)；[src/cli/commands/init-project-plan.js:100](../../src/cli/commands/init-project-plan.js#L100)
- `applyProjectInitPlan` 对普通刷新和 destructive reset 都建立临时备份；写入异常会尝试恢复并保留明确 rollback 状态。[src/cli/commands/init-apply.js:16-82](../../src/cli/commands/init-apply.js#L16-L82)
- `state.js#applyOperationPlan` 对每个 operation 做项目根 containment 和 symlink escape 检查；managed state 精确记录 commands/skills/workflowSkills/agents/support files。[src/cli/state.js:125-137](../../src/cli/state.js#L125-L137)；[src/cli/state.js:618-662](../../src/cli/state.js#L618-L662)

#### 其他命令职责

- `quickstart` 是 doctor 环境探针与 init 的 thin glue：唯一宿主自动转入 init，零个或多个宿主回到交互选择，不模拟宿主 workflow。
- `doctor` 只读检查 Node/Git、manifest、managed runtime、drift、host support 和 readiness evidence，并明确“projection 成功不等于宿主加载或任务成功”。
- `clean` 依据精确 state/slice 删除受管内容；共享 `.agents/skills` 和 `AGENTS.md` 有其他宿主 consumer 或所有权不确定时保留。
- `update` 全局升级 npm 包，再由新进程只刷新当前项目已有宿主；无法确认范围时给出 fallback，不自行安装新宿主。
- `tasks` 提供 source-plan body hash 与 task-pack identity/freshness/structure 校验；不判断业务范围或任务拆分质量。[src/cli/commands/tasks.js:11](../../src/cli/commands/tasks.js#L11)
- `plans audit` 只读扫描 Markdown plan lifecycle，并明确 `completed` 不证明 tests/CI/merge/release/field outcome。[src/cli/commands/plans.js:17](../../src/cli/commands/plans.js#L17)
- `internal` 暴露 context bundle、scenario fingerprint、secret deny、verification profile/run summary、honest closeout、spec-work run artifact、plan status 等确定性 helper。
- `session` 是 `.spec-first/sessions/*.json` 上的 opt-in advisory 协议，不是硬锁。

### 2.5 支持宿主及 runtime 生成机制

**源码已确认事实**

- `getSupportedPlatforms()` 从 adapter map 返回八个宿主：Claude Code、Codex、Cursor、Kiro、Qoder、OpenCode、ZCode、Pi；`PLATFORM_REGISTRY` 记录每个宿主的 runtime root、surface ownership、detection 和 hook capability。[src/cli/adapters/index.js:40-42](../../src/cli/adapters/index.js#L40-L42)；[src/cli/adapters/platform-registry.js:3](../../src/cli/adapters/platform-registry.js#L3)
- 当前 catalog：38 个 bundled source skills，分成 17 个 `workflow_command`、17 个 `standalone_skill`、4 个 `internal_only`；顶层 bundled agents 为 0。Claude/Qoder/OpenCode 投射 17 个 command；其余宿主主要通过 skill discovery 暴露统一 `spec-*` 入口。[runtime-capabilities.md:17-38](../../docs/catalog/runtime-capabilities.md#L17-L38)
- 宿主枚举不是完全单点：adapter registry、Runtime Setup registry/schema、host authority、routing、receipt schema 等多个站点必须一致。`tests/unit/host-enumeration-drift-guard.test.js` 将十个站点的集合等价变成 CI 不变量。[host-enumeration-drift-guard.test.js:15-50](../../tests/unit/host-enumeration-drift-guard.test.js#L15-L50)
- Adapter 负责 command filename、skill/agent 内容变换、宿主路径重写、host pin、额外 hook/pointer/config 计划和 runtime inspection；`plugin-sync.js` 复制 skill support files 时排除 maintainer-only `evals/` 和根 README。

**支持强度上限**

- Claude Code、Codex：README 标为主要支持、推荐起点。
- Kiro、Qoder：opt-in preview；Kiro adapter 还明确报告缺少版本绑定 loader 证据。
- Cursor、OpenCode：`generated_runtime_preview`，确定性投射存在，但 loader discovery/invocation 未确认。
- ZCode、Pi：opt-in preview，只有部分实机能力证据。[README.md:216-227](../../README.md#L216-L227)；[runtime-capabilities.md，Cursor/OpenCode Preview Status](../../docs/catalog/runtime-capabilities.md#cursor-preview-status)

因此，“能生成 runtime”“宿主能发现入口”“真实 workflow 成功”是三个不同层级，不能互相推导。

### 2.6 测试、构建、发布和验证

**工程规模与测试分层**

- Git 跟踪范围统计：38 个 `skills/*/SKILL.md`、240 个 unit test 文件、1 个 smoke test 文件、19 个 integration test 文件、93 个 `src/cli/**` 文件、81 个 docs/CLI contract 文件、28 个 template 文件。
- `npm test` 顺序执行 unit、smoke、integration；runner 为每条命令提供默认 15 分钟超时，Jest 使用 `--runInBand`。[scripts/run-test-suite.cjs:122-158](../../scripts/run-test-suite.cjs#L122-L158)
- `npm run typecheck` 实际是 `node scripts/typecheck-js.js`，以 `node --check` 检查 CLI 和脚本语法；这是 JavaScript 语法检查，不是 TypeScript 类型系统。
- `npm run build` 是 `npm pack --dry-run`，证明发布包可打包及文件清单，不证明安装、跨平台或用户旅程。[package.json:15-41](../../package.json#L15-L41)；[runtime-capabilities.md:184-190](../../docs/catalog/runtime-capabilities.md#L184-L190)
- Smoke test 在隔离 HOME/USERPROFILE 沙箱中验证 help、dry-run 零写入、multi-host init、global profile 失败 fail-closed，以及从 tarball 安装后为 registry 全部宿主生成并由 doctor 检查 runtime。[tests/smoke/cli-smoke.test.js:79-176](../../tests/smoke/cli-smoke.test.js#L79-L176)
- CI 的 npm install matrix 覆盖 Ubuntu/macOS/Windows 与 Node 20/22/24；Windows 专项覆盖 Node 20/22、typecheck、Runtime Setup 合同、`npm test`、build、全局安装和 cmd shim。[npm-install-matrix.yml:14-48](../../.github/workflows/npm-install-matrix.yml#L14-L48)；[windows-compatibility.yml:39-91](../../.github/workflows/windows-compatibility.yml#L39-L91)
- Skill Entry Gate 执行 skill entrypoint lint、eval fixture contracts、release governance；AI Dev Quality Gate 执行聚焦 workflow/runtime contract suite，并保存 `.spec-first/workflows/quality-gates/` 证据。

**发布路径**

- `npm run test:release` 运行 release continuity 后执行 `npm pack --dry-run`。
- `release:publish` 在写版本号前要求干净 Git 状态，运行 release 与 website sync 校验，生成 tarball并发布 npm；发布成功后在未跳过 gate 时提交 `package.json` 并打 tag。npm 发布成功但 Git 记录失败时不会假装回滚已发布包，而是非零退出并给补救命令。[scripts/release-publish.cjs:88-170](../../scripts/release-publish.cjs#L88-L170)

### 2.7 当前仓库状态、近期演化和未决事项

#### Git 与工作区事实（报告写入前快照）

- 当前分支：`feat/onboarding-workflow-routing-ux`。
- 跟踪分支：`github/feat/onboarding-workflow-routing-ux`，ahead/behind 为 `0/0`。
- HEAD：`59cb4cb1`，提交信息为 `fix(routing): 裁决活跃 workflow 执行中失败信号的入口归属并落地三专家复核收尾`。
- 远端：`github -> https://github.com/leo-kuang-ai/spec-first.git`。
- 已跟踪修改：`CHANGELOG.md`、`docs/validation/skill-evals/README.md`，`git diff --stat` 为 9 行新增，`git diff --check` 通过。
- 未跟踪：`docs/plans/2026-10-27-001-refactor-ce-upstream-sync-technical-scheme.md`、`docs/validation/ce-pull-2026-10-27/`、`docs/validation/skill-evals/2026-10-27-workspace-cleanup.json`。
- 没有看到 `src/cli/`、`skills/` 或 `templates/` 的当前 dirty 修改；当前未提交工作主要是计划、验证和 changelog 证据。

#### 近期演化方向

- 2026-10-09 至 10-26 的主线是 onboarding/首次任务路径、doctor 恢复建议、workflow 路由，以及“活跃 workflow 内失败由当前 owner 的反馈回路处理，不重新触发入口路由”的语义收口。[CHANGELOG.md:7-14](../../CHANGELOG.md#L7-L14)
- 2026-10-27 的工作重点转为：清理 skill eval 临时 workspace，并为 CE 新上游窗口建立 snapshot、逐路径 facts、adjudication、owner mapping 和 verification 的 source-first 同步方案。
- 当前 CE 方案已经冻结 161 commits/1,023 paths，但旧 producer 仍以 `FULL_WINDOW_FACTS=517` 阻塞；正式逐路径 adjudication 为 0，owner 实施、runtime projection 和实现验证均未开始。[CE 同步方案:347-362](../../docs/plans/2026-10-27-001-refactor-ce-upstream-sync-technical-scheme.md#L347-L362)

#### Graphify readiness

- `graphify-out/graph.json` 存在，`/Users/kuang/.local/bin/graphify` 可执行，`.graphify/` 不存在，因此没有双 root 冲突。
- 已执行 Graphify `query`、`path`、`explain`，它将 `src/cli/index.js`、adapter registry、init plan/apply、plugin sync、contract 和 tests 定向为核心位置；这些输出只作为 `provider_untrusted` 导航。
- 图基线文件记录 `head_sha=c0803ab5...`，该提交是当前 HEAD 的祖先，但落后 20 个 commit；因此本次未把 Graphify 当作 current architecture truth。[spec-first-graph-baseline.json:3](../../graphify-out/spec-first-graph-baseline.json#L3)

---

## 三、调查者判断、显著风险与未确认范围

### 3.1 主要优势

1. **边界设计清晰。** 项目始终把事实、语义判断和授权分离，并把 source/runtime、provider、artifact、consumer 明确建模。
2. **运行时生成机制可审计。** 动态 manifest、governance registry、host adapter、operation plan、managed state、preview-first、回滚与 drift inspection 构成完整生成链。
3. **验证声明有结构化落点。** verification summary、honest closeout、task-pack hash、plan lifecycle audit 和 run artifact 共同限制“模型说完成了”这种无证据结论。
4. **跨宿主语义一致性优先于目录一致性。** 同一 canonical skill 可按宿主能力投射为 command 或 skill，并允许 degraded/lossy，而不是伪造 feature parity。
5. **测试不仅测 happy path。** 现有测试明显重视零写入、脏工作区、共享所有权、symlink escape、回滚、Windows、package tarball 和旧 runtime 迁移。

### 3.2 显著风险和未决事项

1. **结构证据强，field evidence 弱。** 当前战略索引明确写明 FSA3 整体仍是 `incomplete`、claim ceiling C1，真实宿主 loader/invocation、真实任务和 comparator 仍为 `not-run`。[docs/strategic-review/README.md:6-8](../../docs/strategic-review/README.md#L6-L8)
2. **宿主支持成熟度不一致。** 八宿主都在 registry 中并能生成投影，但 Kiro/Qoder/Cursor/OpenCode/ZCode/Pi 均存在 loader、hook、trust 或版本绑定证据缺口。公共文案必须继续区分“投影已生成”与“宿主已加载/任务成功”。
3. **Graphify 当前 stale。** 图落后 20 commits，适合作为导航，不适合作为当前依赖或影响面结论。需要图级 currentness claim 时，应由有权限的流程运行 `spec-runtime-setup --only graphify --refresh`，本次只读调查未执行。
4. **CE 同步工具仍绑定历史分母。** 新窗口事实已经增长到 1,023 paths，但 reconciliation producer 仍绑定 517，正式裁决未开始。这是当前最明确的工程阻塞点，且方案正确地要求先修 deterministic producer，再进入语义 adoption。
5. **文档/包元数据有可见不一致。** `package.json` 的 description 只列 Claude/Codex/Kiro/Qoder/Cursor/OpenCode，遗漏 ZCode/Pi，而 README、adapter registry 和 capability catalog 已是八宿主；`package.json` repository/homepage/bugs 指向 `sunrain520/spec-first`，当前 Git remote 与 README badge/link 主要指向 `leo-kuang-ai/spec-first`。[package.json:4](../../package.json#L4)；[package.json:102-109](../../package.json#L102-L109)。这会影响 npm 消费者对支持范围和官方仓库的判断，需 owner 明确哪个 URL 是 canonical 后统一。
6. **治理复杂度本身是成本。** 38 个 skills、多个 schema/receipt、host-specific rewrite、五类 gate 和大量 evidence 资产提高了正确性，但也增加首次理解、修改闭包和验证成本。项目自身已经把“采纳门槛、价值外显、能力兑现”识别为核心挑战；新增 contract 前应继续坚持已有 consumer 与退役条件门槛。[docs/strategic-review/README.md:154-189](../../docs/strategic-review/README.md#L154-L189)

### 3.3 本次未检查或无法确认

- 未运行 `npm test`、`npm run build`、`npm run test:release` 或真实宿主 journey，因此不声明当前工作区测试全绿、tarball 可发布、宿主已加载或 field outcome 成立。
- 未逐个完整阅读 38 个 Skill 的全部 reference/script 闭包；本次重点阅读了主链路 owners、runtime setup/host registry、artifact/evidence contracts 和代表性测试。
- 未审查 `docs/validation/ce-pull-2026-10-27/` 内每个证据文件的语义正确性；只将其作为当前 WIP 状态，并以方案中明确的 partial/degraded 上限表述。
- 未检查 npm registry 当前发布版本、GitHub CI 远端运行结果或外部网站同步状态。

---

## 四、新贡献者推荐阅读顺序

1. **`docs/10-prompt/结构化项目角色契约.md`**：先建立第一性原理、使命、权威和五项不可违反原则。
2. **`README.md`**：理解用户问题、快速开始、workflow 能力地图和宿主支持口径。
3. **`AGENTS.md`**：掌握仓库工作纪律、source/runtime 清单、验证命令、任务分级、CHANGELOG 和多宿主影响要求。
4. **`docs/contracts/ai-coding-harness.md`**：用 Context/Execution/Evidence/Evaluation/Governance/Knowledge 六层地图理解整体架构。
5. **`docs/contracts/source-runtime-customization-boundary.md`**：明确哪些能改、哪些只能重生成、mixed ownership 和 provider evidence 边界。
6. **主链路 Skills**：依次读 `skills/spec-brainstorm/SKILL.md`、`skills/spec-prd/SKILL.md`、`skills/spec-plan/SKILL.md`、`skills/spec-write-tasks/SKILL.md`、`skills/spec-work/SKILL.md`、`skills/spec-code-review/SKILL.md`、`skills/spec-compound/SKILL.md`。先读每个 `Workflow Contract Summary`，再按触发条件读 references。
7. **`src/cli/index.js` 与 `bin/spec-first.js`**：理解 package CLI 与宿主 workflow 的边界。
8. **`src/cli/plugin-manifest.js`、`plugin-governance.js`、`plugin-sync.js`**：理解 canonical asset 如何被发现、筛选和投射。
9. **`src/cli/adapters/index.js`、`platform-registry.js`、`adapters/base.js` 与一个主要 adapter**：理解跨宿主差异如何被封装。
10. **`src/cli/commands/init.js`、`init-project-plan.js`、`init-apply.js`、`state.js`、`doctor.js`**：顺着 plan -> preview -> apply -> state -> inspect 数据流阅读。
11. **证据合同**：`verification-run-summary.md`、`honest-closeout.md`、`artifact-summary.md`、`context-bundle.md`、`knowledge-harness.md`。
12. **测试入口**：`package.json`、`scripts/run-test-suite.cjs`、`tests/smoke/cli-smoke.test.js`、`tests/unit/host-enumeration-drift-guard.test.js`、与拟改模块同名的 unit/integration tests。
13. **`docs/catalog/runtime-capabilities.md` 与 `CHANGELOG.md` 顶部**：最后确认当前 delivery surface、证据上限和近期演化；前者是 generated catalog，不是第二 truth source。

---

## 五、最终结论与建议

### 最终结论

`spec-first` 已经不是一组 prompts，而是一套以项目为权威、以可信变更为目标的跨宿主工程协议和 CLI 投射系统。它最成熟的部分是 source/runtime 治理、确定性不变量、artifact/evidence 合同和本地测试；最需要继续兑现的是首次价值、真实宿主行为、真实任务收益和多宿主能力声明。当前仓库的近期方向与这一判断一致：先修 onboarding/路由，再通过审计、eval 和 CE 同步机制补足证据闭环，而不是继续无边界增加 agent 或 workflow。

### 建议

1. **先完成当前 CE producer 适配，再做语义同步。** 保持 U0 -> U1 -> adjudication -> owner-local implementation -> verification 的顺序，不手工绕过 517/1,023 分母冲突。
2. **把 field evidence 作为下一阶段最高优先级。** 为 Claude/Codex 的 golden path 和 preview hosts 的版本绑定 loader/invocation 建立小规模、可复现 journey；不要用 package projection test 替代真实宿主证据。
3. **统一公共元数据。** 由 owner 确认 canonical GitHub 仓库，并同步 `package.json` description/repository/homepage/bugs、README badge/link 和发布校验。
4. **继续压制 contract 增殖。** 新 schema/helper 必须明确 consumer、失败模式、退役条件，并证明现有 artifact-summary/context-bundle/verification contracts 无法承载。
5. **刷新 Graphify 只在需要 current graph claim 时执行。** 当前图仍可导航；涉及依赖、影响面或架构结论时继续以源码和测试确认，不能把 stale graph 升格为事实。
6. **贡献者修改时从 owning boundary 切入。** Workflow 行为改 `skills/`，投射逻辑改 `src/cli`/adapter/template，合同改 `docs/contracts`/schema，最后补最窄测试和 CHANGELOG；只有授权范围包含 runtime refresh 时才运行 `spec-first init`。

## 六、本次调查验证记录

已执行且成功：

- 读取角色契约、README、AGENTS、CONTRIBUTING、package、CLI、主链路 Skills、关键 contracts、runtime catalog、代表性 tests/CI 和当前 WIP 文档；
- `git -C /Users/kuang/xiaobu/spec-first status --short --branch`；
- `git -C /Users/kuang/xiaobu/spec-first log -8 ...`；
- 分支 upstream ahead/behind、`git diff --stat`、`git diff --name-status`、`git diff --check`；
- `node /Users/kuang/xiaobu/spec-first/bin/spec-first.js --help`；
- Graphify artifact/CLI/legacy-root readiness 检查；
- Graphify `query`、`path`、`explain` advisory 导航；
- Graph baseline 与当前 HEAD 的祖先关系及 20-commit 差距确认；
- Git 跟踪文件规模统计。

未执行：完整测试、构建、发布、`spec-first init`、server restart、commit、stage、clean、runtime refresh 或任何源码修改。
