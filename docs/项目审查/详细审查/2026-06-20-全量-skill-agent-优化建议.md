# 2026-06-20 全量 Skill / Agent 优化建议

## 结论

本轮按 `$yao-meta-skill` 的 skill engineering 方法，对当前 source 侧 `skills/` 与 `agents/` 做全量审查，并把每个 skill / agent 的优化建议追加沉淀到本文件。结论是：当前仓库的 public workflow 边界、双宿主治理记录和 source/runtime 边界整体成立；下一阶段最有价值的优化不是批量新增 skill/agent，而是降低大 workflow 初载成本、补齐内部 skill 的轻量 contract、把 eval fixture 规范化、统一 reviewer agent 输出/触发口径，并治理一批重叠或工具声明不清的旧 agent。

本文件是优化建议文档，不是自动修复计划，也不是 runtime 事实源。后续若要改 source，应按本仓 workflow 入口治理进入 `$spec-work` 或相关公开 workflow，并同步 `CHANGELOG.md` 与聚焦测试。

## 方法与证据边界

- Source-of-truth：`skills/`、`agents/`、`src/cli/contracts/dual-host-governance/`、相关 tests/docs。
- Generated runtime：`.claude/`、`.codex/`、`.agents/skills/` 未作为 source 修复目标。
- Deterministic facts：运行 `node skills/retired-skill-review/scripts/write-audit-artifacts.js --repo .`，产物位于 `.spec-first/audits/skill-review/latest/`，只作为 advisory evidence。
- 语义判断：按 `docs/10-prompt/结构化项目角色契约.md`、`skills/retired-skill-review/SKILL.md`、`$yao-meta-skill` 的 `skill-engineering-method` / `resource-boundaries` / `governance` / `output-eval-method` 做人工判断。
- 本轮覆盖：`36` 个 skill 目录、`51` 个 agent 文件。

## 全局优先级

| 优先级 | 建议 | 适用范围 | 理由 |
| --- | --- | --- | --- |
| P0 | 不接受 deterministic audit 对 generated runtime 的 P0 误报作为阻塞结论，但要修 audit 规则的误报分类 | `spec-compound`、`spec-mcp-setup`、`retired-skill-review` | 回源证据显示相关文本多为“不要手改 runtime mirror”或 setup/runtime regeneration 说明，不是默认把 generated runtime 当 source 修。脚本应区分 provider/runtime 写入、init regeneration 与 source patch。 |
| P1 | 为内部/standalone skill 补轻量 contract 摘要 | 内部 skill、helper skill、外部服务 skill | 大量内部 skill 缺 `When To Use` / `When Not To Use` / `Inputs` / `Outputs` / `Failure Modes` 明确段落，容易误触发或让下游 handoff 不清。 |
| P1 | 大 workflow 做 progressive disclosure | `spec-code-review`、`spec-plan`、`spec-optimize`、`spec-compound*`、`spec-work` | 多个 `SKILL.md` 超过 500 行，初载成本高；细节应迁到 `references/`，入口保留 trigger、边界、流程骨架、输出合同。 |
| P1 | 统一 reviewer agent 输出和 persona catalog 归属 | code-review/doc-review/research/deep-dive agents | 29 个 reviewer agent 已具备 hunting/guard section，但仍存在通用专家、workflow persona、旧 CE 同步 agent 重叠。需要按消费者明确 always-on / conditional / deep-dive / deprecated。 |
| P2 | 规范 eval fixture 格式 | 全部 production/library/governed skill | 许多 skill 有 `examples.json` 或 tests，但 deterministic eval readiness 仍报告 missing，说明 fixture 格式和 checker 期望未统一。 |
| P2 | 增加 package-level governance metadata 的最小方案 | 高复用 skill 与 public workflow | 目前仓库通过 `skills-governance.json` 治理 delivery；不必立即给每个 skill 加 Yao `manifest.json`，但可为 library/governed skill 补 owner、review cadence、maturity 的统一投影。 |

## Skill 逐项优化建议

| Skill | 功能说明 | 当前证据 | 优化建议 | 优先级 |
| --- | --- | --- | --- | --- |
| `agent-native-architecture` | 提供 agent-native 架构 taxonomy、设计原则和生产护栏参考，供上游 workflow 作为内部架构 lens 使用。 | 328 行，16 个 references，已有完整 contract 与 eval examples，是内部 architecture reference。 | 保留为 canonical taxonomy，但把 `Why Now` 和长篇原则案例继续下沉到 references；入口只保留 taxonomy、路由表、输出边界和何时 handoff 到 public workflow。补 3-5 个 trigger/near-neighbor eval，防止它被当作普通 implementation workflow。 | P2 |
| `agent-native-audit` | 审查 agent-native 设计是否具备能力对等、上下文注入、工具粒度、生产护栏等关键条件。 | 291 行，无 references/scripts/evals；audit runner 报缺 `When To Use`、`When Not To Use`、`Outputs` 等 contract 段。 | 明确它是内部 review 方法还是 public audit 候选。如果继续保留，补轻量 contract summary、输入/输出表、failure modes，并复用 `agent-native-architecture` references，避免在入口重复展开 8 项原则。 | P1 |
| `changelog` | 辅助生成面向用户或社区的发布变更叙事，不替代本仓根 `CHANGELOG.md` 的 source 变更记录。 | 145 行，内部 skill，无 eval；内容偏“发布沟通文案”，与本仓根 `CHANGELOG.md` 强制格式不同。 | 明确与本仓 `CHANGELOG.md` 的关系：本仓 source change 必须先按根 changelog 格式记录，本 skill 只负责面向用户/社区的 narrative changelog。补 `When Not To Use`、输出格式、Discord webhook 隐私边界和 trigger cases。 | P1 |
| `feature-video` | 把已实现功能转成截图、GIF、录屏或终端演示等可分享的证明 artifact。 | 187 行，5 个 references，1 个 capture script；无 eval。 | 补 artifact contract：run directory、文件命名、截图/GIF/terminal recording 的输出清单和 PR handoff 文案。强化 secret/PII capture preflight，并增加 CLI-only、UI-only、before/after 三类 eval fixture。 | P1 |
| `frontend-design` | 提供前端产品界面设计原则、视觉检查和实现前的设计约束 lens。 | 259 行，无 references/scripts/evals；大量设计规则直接放在入口。 | 按 artifact/design doctrine 拆分为 `references/landing-pages.md`、`references/apps-dashboards.md`、`references/verification.md`；入口保留模式分类、视觉验证 gate 和 “existing design system first”。补 screenshot verification checklist 与 failure examples。 | P1 |
| `gemini-imagegen` | 通过 Gemini 相关 provider 脚本生成图片，并管理提示词、参考图和输出文件。 | 239 行，5 个 provider scripts；无 eval。 | 增加 provider credential、network、输出路径、覆盖写入、reference image privacy 的 failure modes。将 API 参数长表移到 references；用 mock runner 对 script 参数解析和输出文件合同做 smoke eval。 | P1 |
| `git-clean-gone-branches` | 清理远端已删除对应分支的本地 gone branches，并处理相关 worktree 风险。 | 64 行，1 个脚本；删除本地分支和 worktree，当前 contract 较短。 | 补 preview-first contract、删除确认边界、worktree 删除/保留策略、失败恢复说明。增加 shell test 覆盖“无 gone branch”“有 worktree”“remote 查询失败”。 | P1 |
| `git-commit` | 协助检查 diff、组织 staging 边界并生成符合仓库约定的 commit message。 | 123 行，无 scripts/evals；处理 staging 和 commit message。 | 补 `Inputs/Outputs/Failure Modes`，明确不会自动改 generated runtime、不会越过用户已 staged 内容、不在未完成验证时声称 ready。增加 message convention fixture，覆盖 conventional commits、仓库自定义前缀、拆分 logical commits。 | P1 |
| `git-commit-push-pr` | 串联 commit、push、PR 创建或 PR 描述更新等 GitHub 交付动作。 | 235 行，2 个 references，已有部分测试引用；覆盖 commit/push/PR/update description 多模式。 | 把 “description update only” 与 “full commit/push/PR” 拆成更清楚的 mode contract；补 parent workspace `target_repo` 边界、existing PR detection fallback、PR body update verification。 | P1 |
| `git-worktree` | 为公开 workflow 提供隔离 worktree 创建、检测和清理的 internal helper。 | 118 行，1 个脚本，internal helper；当前 worktree 中相关脚本已有未提交改动。 | 保持 internal-only，不暴露为用户入口。待当前 dirty work 收口后，补标准 contract summary；把 `--copy-env` 安全边界升级为 reviewer-visible trust note，并把 `detect --json` facts contract 写成稳定 schema 小节。 | P1 |
| `proof` | 生成或同步 Proof/HITL 证据链接，用于人工确认、身份归属和外部证明。 | 405 行，1 个 reference；含大量外部 API 细节。 | 将 endpoint、curl 示例、local bridge 细节迁到 references/scripts；入口保留 Proof/HITL 触发、identity attribution、baseToken mutation safety、输出 URL/本地同步合同。补 token/privacy/redaction failure modes。 | P1 |
| `report-bug` | 把本地问题整理成可审阅的 bug report 或 GitHub issue 草稿。 | 160 行，无 references/scripts/evals。 | 补输入/输出/失败合同，明确 bug report 目标是 spec-first plugin，不泛化到任意 repo；GitHub issue 创建必须 preview-first 并保护环境信息。增加 “用户只想本地草稿，不要提交 issue” near-neighbor。 | P1 |
| `resolve-pr-feedback` | 读取、判断、修复并回复 PR review feedback，必要时建议 resolve thread。 | 62 行，2 个 references，4 个 GitHub scripts，已有 tests。 | 入口过短但写权限高。补 contract summary、GitHub auth/permission failure、reply/resolve thread 的 verification gate，明确仅在 feedback valid 且修复已验证后才 resolve。 | P1 |
| `spec-app-consistency-audit` | 跨 PRD、Figma、源码、路由、组件、i18n、analytics 审查移动 App 一致性。 | 383 行，21 个 scripts，references/schemas/rule-packs 完整；deterministic audit 把 secret regex 防护误报为 security signal。 | 将 3 个 references 在入口显式挂载，避免 unused-reference signal。补 eval fixture（PRD/Figma/source missing、headless failure envelope、secret-path redaction）。同时修 `retired-skill-review` secret scanner，使“保护性 secret regex”不再算风险。 | P1 |
| `spec-brainstorm` | 在需求未定时协作澄清 WHAT，形成可继续进入 PRD/plan 的需求材料。 | 294 行，8 个 references；无 eval 目录。 | 补 normalized trigger/boundary eval，覆盖“idea generation -> spec-ideate”“clear plan request -> spec-plan”“single doc cleanup -> direct”。把 visual/html rendering 作为 conditional references，入口保留 requirements capture 与 handoff contract。 | P1 |
| `spec-code-review` | 对代码 diff/PR 做证据驱动的结构化 review、persona 合并和 finding 输出。 | 1141 行，9 个 references，1 个 script，1 个 eval examples；最大初载面。 | 拆入口：mode detection、interactive/headless/autofix、severity/action routing、reviewer catalog、tracker defer 都可进一步下沉到 references。保留核心 contract、evidence boundary、dispatch authorization、stage outline。把 examples 转成 normalized eval cases，并用 persona-catalog 作为单一 reviewer source。 | P1 |
| `spec-compound` | 把已验证的问题解决经验沉淀为 `docs/solutions/` durable knowledge。 | 630 行，assets/evals/references/scripts 较完整；audit P0 是 generated-runtime 排除文本误报。 | 不改 source/runtime 边界文本。建议修 audit scanner 的误报；本 skill 侧可把 promotion gate、YAML schema、session recall、knowledge taxonomy 下沉，入口保留 capture criteria、invalidations、frontmatter output。补 “不把未验证经验写入 docs/solutions” eval。 | P1 |
| `spec-compound-refresh` | 刷新、合并、替换或退役过期的 `docs/solutions/` 知识文档。 | 711 行，4 个 references，1 个 script；无 eval。 | 拆 action flows、schema、maintenance model 到 references；补 stale/overlap/delete/merge/update 四类 eval fixture。明确删除 docs/solutions 是 preview-first mutating action，并要求 invalidation condition 被保留或更新。 | P1 |
| `spec-debug` | 系统复现、定位、修复 bug 或测试失败，并保留 root-cause/verification 证据。 | 359 行，3 references，1 eval examples。 | 结构健康。下一步是把 examples 转成 normalized eval，覆盖 “已有失败日志”“无法复现”“用户要求直接修”“需要先收敛 root cause” 四类。补 hypothesis ledger 输出最小字段，方便后续 work/code-review 消费。 | P2 |
| `spec-dhh-rails-style` | 以 DHH/Rails 风格作为条件 lens 审视 Rails/Ruby 设计与实现取舍。 | 186 行，6 references，style skill；内部 delivery。 | 补轻量 contract summary 与 `When Not To Use`，明确它是 Rails/Ruby style lens，不覆盖项目自有 standards、不替代 `spec-code-review`。增加 route negatives：非 Ruby、通用 frontend、用户只问 DHH 观点。 | P2 |
| `spec-doc-review` | 对需求、计划、任务包或 Markdown 文档做结构化多视角审查。 | 299 行，8 references，1 eval examples；dispatch 边界已较清晰。 | 统一 doc-review agent 输出 schema 与 code-review finding shape 的映射；把 examples 转 normalized eval；确保 2 个未引用 references 要么入口挂载，要么删除/合并。补 “缺 subagent 授权 -> report-only fallback” regression case。 | P1 |
| `spec-ideate` | 围绕模糊机会点生成并批判评估 grounded ideas，输出可继续定义的方向。 | 410 行，3 references；无 eval。 | 补 idea-quality output eval：prior art、surprisingness、grounding、next workflow handoff。入口可继续瘦身，把 web/slack/research cache 细节放 references，只保留 phase outline 和 evidence boundary。 | P1 |
| `spec-mcp-setup` | 安装、检查和修复 spec-first harness、MCP、provider 与 runtime readiness。 | 172 行，44 个 scripts，2 references；setup 本身确实会写 provider/runtime artifacts。 | 不是 P0 阻塞；source 文本已说明 generated runtime 不是 source。建议补显式 `When To Use/When Not To Use/Outputs` headings 以满足本仓 audit 结构；将 provider/project writes 与 generated mirror source fixes 的区别写成固定术语，并修 audit 规则误报。对 `sudo` 建议输出补 “只打印建议、不自动执行” 证据。 | P1 |
| `spec-optimize` | 用指标、实验、评估和预算约束驱动多轮优化。 | 734 行，7 references，3 scripts；复杂实验 workflow。 | 入口过重。将 spec schema、judge prompt、parallel experiment mechanics 下沉；入口保留 admission/budget gate、measurement contract、artifact output、mutation boundary。补 deterministic smoke eval：hard metric、judge metric、budget exhaustion、failed experiment cleanup。 | P1 |
| `spec-plan` | 把清晰目标转成可执行技术方案，明确 scope、artifact、验证和 handoff。 | 757 行，10 references，1 eval examples；当前相关 reference 文件已有未提交改动。 | 待当前 dirty work 收口后再动。建议继续做 progressive disclosure：plan-only safety、canonical section、deepening workflow、visual/html rendering 各归 references；入口只保留 admission、output contract、handoff、artifact-summary。把 examples 转 normalized eval。 | P1 |
| `spec-polish-beta` | 启动本地应用并通过浏览器证据迭代 UI/交互 polish。 | 131 行，11 references，4 scripts，已有 tests；Beta 状态合理。 | 增加 Beta exit criteria：何时可升为 stable、最小浏览器验证证据、dev server cleanup、端口冲突处理。补 fixture eval 覆盖 Vite/Next/Rails/launch.json/port occupied。 | P2 |
| `spec-prd` | 面向既有系统编写、校准或验证 brownfield PRD 级需求。 | 165 行，4 references，1 script，1 eval examples；较紧凑。 | 保持当前轻量。补 brownfield PRD readiness eval：existing-system evidence、domain language drift、single-file PRD vs split topology、plan-ready / not-plan-ready 判定。 | P2 |
| `spec-release-notes` | 查询或总结近期 spec-first release changes，并给出版本/来源引用。 | 220 行，1 script，已有 tests。 | 补 network/API unavailable fallback、CHANGELOG-only fallback、current date/version boundary、输出 citation format。增加 query-mode eval，覆盖 “what changed recently” 与 “what happened to skill X”。 | P2 |
| `spec-sessions` | 检索和解释历史 coding-agent session，辅助恢复上下文和尝试记录。 | 256 行，4 scripts；无 eval。 | 补 privacy/redaction boundary，明确 session history 是 advisory recall，不是 confirmed truth。增加 eval：missing session dir、stale sessions、multi-host sessions、error extraction。 | P1 |
| `retired-skill-review` | 审计 skill source 的触发、边界、契约、eval、runtime governance 和安全风险。 | 259 行，10 references，12 scripts，4 eval files；本轮事实来源。 | 优先改进 false-positive taxonomy：runtime mention vs runtime patch、secret detection regex vs secret exfiltration、`sudo` command suggestion vs execution。增加 “输出到 docs/项目审查 的 report mode” 作为可选 future，不默认写 source。 | P1 |
| `spec-slack-research` | 从 Slack 组织讨论中提炼决策、约束和讨论脉络。 | 81 行，无 scripts/evals；依赖 Slack MCP。 | 补 MCP unavailable fallback、workspace identity verification、privacy/audience boundary、raw-message redaction、output schema。增加 near-neighbor：用户要直接 `slack:find` 原始列表时不触发 synthesis skill。 | P1 |
| `spec-work` | 执行已明确的实现任务，并守住 mutation、verification、handoff 和 changelog 纪律。 | 551 行，2 references，1 eval examples；执行主 workflow。 | 继续瘦入口，把 shipping workflow/tracker defer 细节转 references；保留 completion audit、mutation gate、verification/handoff contract。补 eval：clear task、unclear plan、dirty worktree、generated runtime boundary、completion audit failure。 | P1 |
| `spec-write-tasks` | 把已定计划编译成可执行 task pack，并保留 derived artifact 边界。 | 431 行，agents/evals/references 完整；standalone skill。 | 结构较成熟。下一步统一 eval fixture 与 `retired-skill-review` checker，确保 `boundary-cases` / `failure-cases` 被算入 readiness。补 derived artifact stale/invalidation cases，防止 task pack 变第二 source of truth。 | P2 |
| `test-browser` | 通过浏览器、截图和运行态检查验证本地 Web UI 或交互行为。 | 357 行，已有 tests，无 references/scripts；内部 browser test helper。 | 补 contract summary 和 output artifact contract（dev server URL、screenshots、failures、cleanup）。明确与当前 host browser tool / Playwright / agent-browser 的边界。增加 fixture：server already running、port occupied、route mapping unknown。 | P1 |
| `test-xcode` | 通过 Xcode/XcodeBuildMCP 验证 iOS/macOS 项目的 build、scheme 和模拟器运行。 | 209 行，无 tests/evals；依赖 XcodeBuildMCP。 | 补 XcodeBuildMCP unavailable fallback、simulator cleanup、scheme discovery failure、输出 summary schema。增加 static smoke tests，至少覆盖 frontmatter、required headings、no direct unsafe device mutation。 | P1 |
| `using-spec-first` | 作为 entry governor 判断当前请求应直接处理还是进入公开 `$spec-*` workflow。 | 348 行，2 eval files；entry governor。 | 保持为 standalone meta skill，不暴露为 command-backed workflow。建议继续把 scenario fingerprint 和 multi-session 细节压缩到 references，入口保留路由优先级、direct outcome、dispatch authorization 和 public route map。补 fresh-source routing cases 对 `$yao-meta-skill` 这类 standalone skill 的覆盖。 | P2 |

## Skill 深度审查追加（2026-06-20）

本节在上表基础上追加逐 skill 深审判断。字段含义：`定位判断` 是 LLM-owned semantic judgment；`事实信号` 来自 `skill-source-inventory.json`、`expert-scorecard.json`、`eval-readiness-report.json` 等 deterministic artifacts；`主要风险` 和 `优化动作` 是后续整改建议，不等同于已授权修改 source；`验证建议` 是进入 `$spec-work` 后应优先补的最窄证据。

### `agent-native-architecture`

- 定位判断：保留为 internal architecture taxonomy 和 agent-native 设计参照，不应成为 public workflow 或普通实现入口。
- 事实信号：contract headings 完整，16 个 references，1 个 eval file、6 个 normalized cases；entry 约 4.6k tokens，仍携带较长原则与 quick start。
- 主要风险：长篇理念材料留在入口会增加初载成本，也容易让 reviewer 把它当成“所有 agent 设计问题都先走这里”的强路由。
- 优化动作：入口保留 taxonomy、routing table、source/runtime 边界和 handoff；把 `Why Now`、Core Principles 长例、Quick Start 继续下沉到 references。
- 验证建议：补 near-neighbor eval，覆盖“普通实现请求应走 `spec-work`”“skill 质量审查应走 `retired-skill-review`”“runtime mirror 不可手改”。

### `agent-native-audit`

- 定位判断：它现在像 agent-native 体系的内部审查方法，但没有清楚说明与 `retired-skill-review`、`agent-native-architecture` 的分工。
- 事实信号：无 references/scripts/evals；deterministic audit 报缺 Purpose、When To Use、When Not To Use、Inputs、Outputs、Failure Modes。
- 主要风险：如果继续存在但不补边界，会成为第二套泛 audit 入口，和 skill-review / architecture reference 重叠。
- 优化动作：先裁决保留、合并还是退役；若保留，补轻量 contract summary，并明确只审 agent-native architecture choices，不审所有 skill/source 质量。
- 验证建议：增加 routing eval：skill 治理审查落到 `retired-skill-review`，agent-native app 架构审查才读取本 skill。

### `changelog`

- 定位判断：应是 narrative changelog / release communication helper，不是本仓根 `CHANGELOG.md` 强制格式的替代物。
- 事实信号：无 refs/scripts/evals；缺全部核心 contract headings；当前仓已有根 changelog 格式和作者读取规则。
- 主要风险：source change 时误用该 skill 生成营销式 changelog，会破坏根 changelog 的 compact evidence contract。
- 优化动作：补 `When Not To Use`，明确本仓 source change 先写根 `CHANGELOG.md`；本 skill 只负责面向用户、社区或 release notes 的二次叙事。
- 验证建议：增加 eval 覆盖“仓库 source 修改”“面向 Discord/社区公告”“仅查询历史版本”三种分流。

### `feature-video`

- 定位判断：这是高价值但高泄露风险的 artifact helper，核心是把功能证明转成视频/截图证据。
- 事实信号：5 个 references、1 个 capture script，无 eval；缺输入/输出/失败合同。
- 主要风险：录屏、终端和浏览器画面可能包含 secret、token、用户数据或本地路径；输出目录和 PR handoff 也未形成稳定 contract。
- 优化动作：补 artifact contract（run dir、文件命名、截图/GIF/terminal recording 清单、PR 文案），并加 secret/PII capture preflight。
- 验证建议：用 mock capture smoke 覆盖 CLI-only、UI-only、before/after、用户拒绝录制四类情形。

### `frontend-design`

- 定位判断：它是 frontend 设计 doctrine / implementation lens，不应覆盖已有设计系统或 `spec-polish-beta` 的浏览器迭代 workflow。
- 事实信号：无 refs/scripts/evals；入口约 3.7k tokens，承载大量设计规则；缺多项 contract headings。
- 主要风险：规则过密会让 agent 在未读取现有 UI 的情况下套用一套默认审美，破坏本仓“existing design system first”原则。
- 优化动作：拆成 `references/apps-dashboards.md`、`references/landing-pages.md`、`references/visual-verification.md`；入口只保留模式分类、证据要求和视觉验证 gate。
- 验证建议：补 eval 覆盖 dashboard、landing page、existing design system、无截图证据时必须降级。

### `gemini-imagegen`

- 定位判断：这是 provider-specific image generation helper，必须把 credentials、network、输出文件和 privacy 边界显式化。
- 事实信号：10 个 scripts，无 refs/evals；缺 Purpose、When To Use、Inputs、Outputs、Workflow、Failure Modes 等结构段。
- 主要风险：API key、reference image、输出覆盖、外部网络失败都属于高频失败面；当前入口不够支撑安全 handoff。
- 优化动作：补 provider credential contract、reference image privacy、输出路径/覆盖策略、失败 reason_code；把参数长表和 provider 细节迁入 references 或 scripts help。
- 验证建议：用 mock runner 验证参数解析、缺 credential、网络失败、目标文件已存在、reference image 输入五类。

### `git-clean-gone-branches`

- 定位判断：这是 mutating git cleanup helper，风险不在体量，而在删除动作必须 preview-first。
- 事实信号：1 个 script，入口短，无 eval；缺 Purpose、When To Use、When Not To Use、Inputs、Outputs、Failure Modes。
- 主要风险：删除本地分支或关联 worktree 一旦误判，会直接造成用户工作丢失或恢复成本上升。
- 优化动作：把 dry-run/preview 设为默认 contract，确认后才删除；明确 worktree 删除/保留策略和 remote 查询失败 fallback。
- 验证建议：补 shell/Jest fixture 覆盖无 gone branch、有 gone branch、有 worktree、remote 不可达、用户未确认。

### `git-commit`

- 定位判断：这是 commit helper，不是工作完成判定器；它只能消费已确认的 diff/验证证据。
- 事实信号：无 scripts/evals；缺核心 contract headings；scorecard 对 input/output contract 给出弱信号。
- 主要风险：可能越过用户已有 staged 内容、自动 stage 过宽、或在验证不足时生成“ready”语义 commit。
- 优化动作：补 staging boundary、existing staged preservation、commit message convention、未验证时的 honest wording；明确不手改 generated runtime mirrors。
- 验证建议：增加 fixture 覆盖 already-staged、partial staging、Conventional Commit、仓库自定义任务前缀、需拆分 commits。

### `git-commit-push-pr`

- 定位判断：这是多模式 release helper，覆盖 commit/push/PR create/update，必须把 authority mode 拆清。
- 事实信号：2 个 references，无 eval；缺 Purpose、When To Use、When Not To Use、Inputs、Outputs、Workflow、Failure Modes。
- 主要风险：commit、push、PR 创建和 PR body 更新混在一个入口里，容易在用户只想更新描述时执行更大副作用。
- 优化动作：拆 `description-update-only`、`commit-only`、`commit-push`、`full-pr` mode contract；补 parent workspace `target_repo` 和 existing PR detection fallback。
- 验证建议：用本地 git fixture 验证 mode selection；网络/GitHub 行为用 mock 或 dry-run facts，不依赖真实 push。

### `git-worktree`

- 定位判断：保持 internal helper，只由公开 workflow 委托；不应出现在用户 public entrypoint 菜单。
- 事实信号：1 个 script，无 eval；score 56；deterministic report 对 output contract、security posture、trigger precision 给出低分信号。
- 主要风险：`--copy-env`、linked worktree、submodule、separate git dir 等边界复杂；若用户直接调用，容易绕过目标 repo 和 secret 保护。
- 优化动作：补 contract summary、internal-only 边界、`detect --json` schema、env copy trust note；把 create 前 fail-closed 条件写成稳定事实合同。
- 验证建议：扩展既有 `git-worktree-contracts`，覆盖 env copy opt-in、linked worktree 拒绝、not-git-repo、separate git dir。

### `proof`

- 定位判断：Proof 是 HITL / external evidence helper，高价值在身份归属和可分享证据，不在把 endpoint 细节塞进入口。
- 事实信号：1 个 reference，无 eval；入口约 6.1k tokens；缺全部核心 contract headings。
- 主要风险：token、baseToken mutation、本地 bridge、外部 URL 都涉及隐私和权限；入口过重也会扩大误触发面。
- 优化动作：入口保留触发、身份归属、privacy/redaction、输出 URL/同步合同；endpoint、curl、bridge 操作迁到 references/scripts。
- 验证建议：补 no-token-leak、missing bridge、user requests draft-only、external publish denied、output URL contract 五类 eval。

### `report-bug`

- 定位判断：它应聚焦 spec-first/plugin 生态 bug report，不应泛化成任意仓库 issue creator。
- 事实信号：无 refs/scripts/evals；缺全部核心 contract headings。
- 主要风险：直接创建 GitHub issue 会泄露本地路径、环境信息、private repo 细节；也可能把本地草稿需求误发布。
- 优化动作：补 preview-first issue draft、target repo boundary、redaction checklist、用户确认后才提交的 mutating gate。
- 验证建议：增加 eval 覆盖“只要本地草稿”“要提交 GitHub issue”“非 spec-first 仓库 bug”“包含敏感日志”。

### `resolve-pr-feedback`

- 定位判断：这是高权限 GitHub feedback resolver，入口虽然短，但副作用强。
- 事实信号：2 个 references、4 个 scripts，无 eval；缺全部核心 contract headings。
- 主要风险：如果没有先判断 feedback 是否有效、修复是否验证，就 reply/resolve thread，会制造 false closure。
- 优化动作：补 validity triage、fix/verify/reply/resolve 四段 contract；明确 agent 只能建议 reply/resolve，最终 mutation 由父 workflow 授权。
- 验证建议：mock GitHub scripts 覆盖 invalid feedback、accepted feedback、partial fix、verification failed、thread resolve denied。

### `spec-app-consistency-audit`

- 定位判断：这是 mobile app 一致性审查 workflow，脚本面完整，下一步重点是 failure envelope 和 eval。
- 事实信号：3 个 references、22 个 scripts，无 eval；contract headings 完整；audit 对 security signal 有误报可能。
- 主要风险：PRD/Figma/source 任一缺失时容易降级不清；secret regex 防护被 scanner 当风险会污染优先级。
- 优化动作：在入口显式挂载关键 references；补 missing PRD/Figma/source、headless failure、secret-path redaction 的 eval；同步修 scanner 对保护性 regex 的分类。
- 验证建议：运行 focused script smoke，验证每类 missing input 都输出 reason_code 而非 freeform 失败。

### `spec-brainstorm`

- 定位判断：这是 WHAT discovery workflow，不是 ideation、PRD、plan 或 direct doc cleanup 的万能入口。
- 事实信号：8 个 references，无 eval；入口约 7.6k tokens；deterministic checker 报缺 Purpose heading。
- 主要风险：边界不够硬时会把明确执行计划、单文档整理或 0-1 idea generation 都吸进 brainstorm。
- 优化动作：补 normalized routing eval；入口保留 requirements capture、handoff、artifact boundary；visual/html rendering 作为 conditional references。
- 验证建议：覆盖 “idea generation -> spec-ideate”“brownfield PRD -> spec-prd”“clear plan request -> spec-plan”“single doc cleanup -> direct”。

### `spec-code-review`

- 定位判断：这是核心 code-review workflow，当前问题不是能力不足，而是入口承载过多 orchestration 和 persona 细节。
- 事实信号：9 个 references、1 个 script、1 个 eval file；约 29.4k tokens，是最大入口面之一。
- 主要风险：mode detection、interactive/headless/autofix、tracker defer、persona catalog 分散在入口会抬高 review 启动成本，并增加 reviewer 口径漂移。
- 优化动作：入口保留 evidence rule、severity/action contract、dispatch authorization、stage outline；把 mode tables、persona catalog、tracker defer、examples 下沉。
- 验证建议：把 examples 转成 normalized eval，新增 persona-catalog drift test 和缺 subagent 授权 fallback case。

### `spec-compound`

- 定位判断：这是 Knowledge Harness 的 promotion workflow；核心价值是防止未验证经验进入 durable knowledge。
- 事实信号：3 个 references、1 个 script、1 个 eval file；contract headings 完整；audit P0 runtime finding 语义上更像 scanner false positive。
- 主要风险：entry 约 10.4k tokens，promotion gate、YAML schema、session recall、taxonomy 混在入口，容易弱化“ verified + reusable + invalidation condition”的硬边界。
- 优化动作：不改 source/runtime 边界文本；优先修 audit scanner 的 runtime mention false positive；入口瘦身到 capture criteria、promotion gate、frontmatter output。
- 验证建议：增加 “未验证经验不得写入 `docs/solutions/`”“generated runtime 只作 evidence 不 patch” 两类 eval。

### `spec-compound-refresh`

- 定位判断：这是 durable knowledge maintenance workflow，风险比普通 docs refresh 高，因为它可能合并、替换或删除历史经验。
- 事实信号：4 个 references、1 个 script，无 eval；入口约 13.2k tokens；deterministic checker 报缺 Purpose。
- 主要风险：删除/合并 `docs/solutions/` 如果缺 preview-first 和 invalidation tracking，会破坏 Knowledge Harness 的可追溯性。
- 优化动作：把 action flows、schema、maintenance model 下沉；入口保留 read stale evidence、decide action、preview mutation、preserve invalidation 的 contract。
- 验证建议：新增 stale/update/merge/delete/replace 五类 eval，特别覆盖“删除必须先 preview 且保留替代理由”。

### `spec-debug`

- 定位判断：结构较健康；下一步应把 root-cause evidence 和 hypothesis ledger 更机器可消费。
- 事实信号：3 个 references、1 个 eval file、5 个 normalized cases；score 80。
- 主要风险：debug workflow 容易在无法复现时直接修，或把 advisory signal 写成 confirmed root cause。
- 优化动作：补 hypothesis ledger 最小字段（symptom、evidence、counter-evidence、decision、verification）；把 examples 规范成 eval cases。
- 验证建议：覆盖已有失败日志、无法复现、用户要求直接修、需要先定位根因、修复后验证失败。

### `spec-dhh-rails-style`

- 定位判断：这是 Rails/Ruby style lens，不应覆盖项目本地 standards，也不应替代 code-review。
- 事实信号：6 个 references，无 eval；缺全部核心 contract headings。
- 主要风险：personality/style lens 若缺 negative boundary，容易对非 Rails 或已有强约定项目提出偏好型建议。
- 优化动作：补 `When Not To Use`、Inputs/Outputs、project standards precedence；明确只在 Rails/Ruby 且用户需要 DHH/Rails 风格判断时启用。
- 验证建议：增加 non-Rails、Rails with local standard conflict、general frontend、用户只问观点四类 negative cases。

### `spec-doc-review`

- 定位判断：文档审查 workflow 边界相对清晰，重点是 persona 输出 schema 和 dispatch fallback 稳定性。
- 事实信号：8 个 references、1 个 eval file、5 个 normalized cases；score 80。
- 主要风险：doc-review personas 与 code-review findings 字段不完全对齐，merge/dedup 时可能丢 severity、evidence 或 confidence。
- 优化动作：统一 finding id、severity/impact、evidence、confidence、recommendation 最小字段；把缺 subagent 授权 fallback 写入 regression case。
- 验证建议：normalized eval 覆盖 report-only、multi-persona authorized、dispatch_authorization_missing、low-risk doc no-finding。

### `spec-ideate`

- 定位判断：这是 idea generation / grounded options workflow，不是 PRD、plan 或普通 web research。
- 事实信号：3 个 references，无 eval；入口约 10.6k tokens；deterministic checker 报缺 Purpose。
- 主要风险：如果 grounding、surprisingness 和 next workflow handoff 不明确，输出会变成泛建议列表，难以进入 PRD/plan。
- 优化动作：入口瘦身到 phase outline、evidence boundary、idea-quality rubric；web/slack/cache 细节迁 references。
- 验证建议：新增 eval 覆盖 prior-art grounded、no-current-info fallback、idea-to-PRD handoff、user asks direct implementation。

### `spec-mcp-setup`

- 定位判断：这是 setup/runtime readiness workflow，确实会写 provider/runtime artifacts，但不是把 generated mirrors 当 source 修。
- 事实信号：2 个 references、44 个 scripts，无 eval；score 48；audit P0 runtime findings 需要语义复核。
- 主要风险：provider/project writes、generated runtime regeneration、source patch 三者如果术语不清，会让 scanner 和用户都误判风险；`sudo` 建议也必须是“只打印建议”。
- 优化动作：补显式 Purpose/When To Use/When Not To Use/Inputs/Outputs/Failure Modes；定义 provider runtime write、generated mirror regeneration、source fix 三个术语；修 scanner false positive。
- 验证建议：运行 `npm run test:mcp-setup` 和 scanner fixture，覆盖 runtime mention、init regeneration、sudo suggestion、secret regex protection。

### `spec-optimize`

- 定位判断：这是 metric-driven optimization workflow，核心 contract 是 measurement first、budget gate 和 experiment cleanup。
- 事实信号：7 个 references、3 个 scripts，无 eval；入口约 10.4k tokens；deterministic checker 报缺 Purpose。
- 主要风险：未先定义 hard metric / judge metric 时，parallel experiments 会变成无界试错；失败实验也可能留下脏工作树。
- 优化动作：入口保留 admission/budget gate、measurement contract、artifact output、mutation boundary；judge prompt、parallel mechanics、schema 下沉。
- 验证建议：补 eval 覆盖 hard metric、LLM-as-judge metric、budget exhausted、experiment failed cleanup、measurement unavailable。

### `spec-plan`

- 定位判断：这是 HOW planning workflow，不应让 plan artifact 变成第二 source of truth 或执行状态机。
- 事实信号：10 个 references、1 个 eval file、5 个 normalized cases；入口约 16.6k tokens；当前 worktree 有相关未提交改动，后续 source 修改需先避让。
- 主要风险：canonical sections、deepening workflow、visual rendering、handoff 细节堆在入口，容易增加 plan 噪音和漂移面。
- 优化动作：继续 progressive disclosure：入口只保留 admission、output contract、source inheritance、handoff、artifact summary；细节归 references。
- 验证建议：把 examples 转 normalized eval，覆盖 plan-only、安全边界、dirty worktree、existing review origin、task handoff。

### `spec-polish-beta`

- 定位判断：Beta 标识合理；它应聚焦 browser-visible UI polish，不替代通用 frontend-design 或 implementation workflow。
- 事实信号：11 个 references、4 个 scripts，无 eval；入口紧凑但缺 Purpose heading。
- 主要风险：dev server 生命周期、端口冲突、browser evidence、cleanup 如果不稳定，会让 polish loop 留下后台进程或不可复现截图。
- 优化动作：补 Beta exit criteria、dev server cleanup、port occupied fallback、minimum visual evidence；明确什么时候 handoff 回 `spec-work`。
- 验证建议：fixture 覆盖 Vite、Next、Rails、launch.json、server already running、port occupied。

### `spec-prd`

- 定位判断：当前是较健康的 brownfield PRD workflow，应保持轻量，不新增第二套 PRD topology。
- 事实信号：4 个 references、2 个 scripts、1 个 eval file，50 个 normalized cases；score 84；当前已有并行未提交 source/test 改动。
- 主要风险：继续扩张入口会抵消它现在的优势；readiness checker 的事实输出也不能替代 LLM 对 plan-ready 的语义裁决。
- 优化动作：保持入口轻量；补 brownfield readiness eval 和 output eval，不把 `docs/prds/` 作为新 source 目录。
- 验证建议：复用 `tests/unit/spec-prd-contracts.test.js`，新增 existing-system evidence、domain-language drift、plan-ready/not-ready 判定 fixture。

### `spec-release-notes`

- 定位判断：这是 release-note query/summarization workflow，必须处理 current version/date 和 source citation。
- 事实信号：3 个 scripts，无 eval；score 79；deterministic checker 报缺 Purpose。
- 主要风险：用户问“最近/最新”时若不核对当前 changelog/package 事实，会输出 stale release note。
- 优化动作：补 network/API unavailable fallback、CHANGELOG-only fallback、current date/version boundary、citation format。
- 验证建议：增加 query-mode eval，覆盖 “what changed recently”“what changed in skill X”“package version mismatch”“no network”。

### `spec-sessions`

- 定位判断：这是 session recall workflow；session history 只能是 advisory recall，不是 confirmed current source truth。
- 事实信号：7 个 scripts，无 eval；score 70；deterministic checker 报缺 Purpose。
- 主要风险：历史 session 可能 stale、包含隐私或跨 host 语境；若直接当事实会污染当前决策。
- 优化动作：补 privacy/redaction boundary、freshness/confidence 字段、current-source verification handoff；输出 schema 区分 remembered、confirmed、unresolved。
- 验证建议：补 missing session dir、stale sessions、multi-host sessions、private path redaction、error extraction eval。

### `retired-skill-review`

- 定位判断：这是本轮事实来源，整体最成熟；下一步主要是降低 false-positive taxonomy。
- 事实信号：10 个 references、20 个 scripts、4 个 eval files，4 个 normalized cases；contract headings 完整；score 86。
- 主要风险：runtime mention vs runtime patch、secret-detection regex vs secret exfiltration、`sudo` suggestion vs execution 的误分会制造虚假 P0/P1。
- 优化动作：修 scanner taxonomy；增加 report-to-docs mode 作为显式 opt-in future，不默认写 source 文档；继续把 score 标注为 review signal。
- 验证建议：新增 false-positive regression fixtures，并用本次 `spec-compound` / `spec-mcp-setup` 片段做回归样本。

### `spec-slack-research`

- 定位判断：这是 Slack organizational context synthesis workflow，不是 raw message search 或聊天记录导出工具。
- 事实信号：无 refs/scripts/evals；入口短，score 79；deterministic checker 报缺 Purpose。
- 主要风险：workspace 身份、频道隐私、raw message redaction 和 audience boundary 若缺失，会把组织上下文研究变成敏感聊天转储。
- 优化动作：补 MCP unavailable fallback、workspace identity verification、private channel limitation、raw-message redaction、output schema。
- 验证建议：eval 覆盖 no Slack MCP、private channel unavailable、user asks raw list、decision/constraint synthesis、redaction required。

### `spec-work`

- 定位判断：这是执行主 workflow，入口应守住 mutation gate、verification gate 和 handoff，而不是承载所有实现细节。
- 事实信号：2 个 references、1 个 eval file、5 个 normalized cases；入口约 13.8k tokens；score 80。
- 主要风险：执行 workflow 最容易发生“任务看似清楚但验收/验证不足”的 false completion，或误碰 generated runtime mirrors。
- 优化动作：入口瘦身到 admission、mutation boundary、completion audit、verification/handoff contract；shipping/tracker defer 细节迁 references。
- 验证建议：补 eval 覆盖 clear task、unclear plan、dirty worktree、generated runtime boundary、completion audit failure。

### `spec-write-tasks`

- 定位判断：这是成熟的 standalone plan-to-task-pack compiler；应继续防止 task pack 变成第二 source of truth。
- 事实信号：2 个 references、5 个 eval files，19 个 normalized cases；contract headings 完整；score 81。
- 主要风险：derived artifact 如果缺 stale/invalidation 规则，会在 plan/PRD 更新后继续被执行。
- 优化动作：统一 eval fixture 格式，让 `boundary-cases` / `failure-cases` 被 `retired-skill-review` readiness checker 稳定识别；补 derived artifact invalidation 条款。
- 验证建议：新增 plan changed after task-pack、missing acceptance source、over-specified task、handoff to doc-review 四类 eval。

### `test-browser`

- 定位判断：这是 internal browser verification helper，不是 public workflow；输出应是可复查的 visual/runtime evidence。
- 事实信号：无 refs/scripts/evals；缺 Purpose、When To Use、When Not To Use、Inputs、Outputs、Failure Modes；score 56。
- 主要风险：dev server URL、screenshots、route mapping、cleanup 不清会让视觉验证不可复现或遗留进程。
- 优化动作：补 contract summary、output artifact contract、server lifecycle、screenshot path、failure summary；明确与 host browser tool / Playwright 的边界。
- 验证建议：fixture 覆盖 server already running、port occupied、route unknown、blank screenshot、cleanup failure。

### `test-xcode`

- 定位判断：这是 Xcode/iOS verification helper，核心风险是外部 MCP 可用性和 simulator/device 副作用。
- 事实信号：无 refs/scripts/evals；缺核心 contract headings；score 63。
- 主要风险：XcodeBuildMCP 不可用、scheme discovery 失败、simulator cleanup、真实设备 mutation 都需要明确降级。
- 优化动作：补 MCP unavailable fallback、scheme discovery contract、simulator cleanup、no unsafe device mutation、summary schema。
- 验证建议：先加 static smoke tests，覆盖 frontmatter、required headings、no direct unsafe mutation；再补 MCP mock eval。

### `using-spec-first`

- 定位判断：它是 entry governor，不是 command-backed workflow；低分主要来自结构 checker 对长路由文档的保守信号，不代表应改成 public command。
- 事实信号：2 个 eval files，16 个 normalized cases；入口约 8.2k tokens；score 57；deterministic checker 报缺 headings，但文内已有 Contract Summary。
- 主要风险：scenario fingerprint、multi-session、route map、dispatch authorization 全在入口会让治理文档继续膨胀；过度路由风险始终高于能力不足风险。
- 优化动作：保持 standalone meta skill；把 scenario/multi-session 细节压缩或迁 references；入口保留 direct outcomes、routing priority、dispatch authorization、public route map。
- 验证建议：补 fresh-source routing cases，覆盖 `$yao-meta-skill` standalone、lightweight direct edit、explicit `$retired-skill-review`、parent workspace target_repo。

## Agent 全局建议

| 优先级 | 建议 | 理由 |
| --- | --- | --- |
| P1 | 为 51 个 agent 建立 lifecycle 分类：always-on reviewer、conditional reviewer、deep-dive analyst、orchestrator helper、deprecated候选。 | 当前有些 agent 只被治理文件或历史 docs 引用，缺少清晰消费者。分类后才知道该强化、合并还是退役。 |
| P1 | code-review/doc-review persona 输出 schema 对齐。 | 上游 merge/dedup 需要稳定字段；doc-review persona 可不完全使用 code-review schema，但至少要有 finding id、severity/impact、evidence、confidence、recommendation。 |
| P1 | 重叠角色合并或明确分层。 | `security-reviewer` / `security-sentinel` / `security-lens`，`performance-reviewer` / `performance-oracle`，`data-*`，`CLI readiness` 多组存在职责重叠。 |
| P2 | 为工具声明为空但要求浏览器、Figma、Web、GitHub、Slack 的 agent 增加 host capability boundary。 | agent 本身没有工具时，必须由 orchestrator 提供截图、Figma payload、搜索结果或 MCP facts，不能暗示 agent 可自行获取。 |
| P2 | 给旧 agent 补 `What you don't flag`、confidence calibration、output format。 | 这能降低误报和不可合并输出，尤其是 challenge-style 和 specialist-style agent。 |

## Agent 逐项优化建议

| Agent | 功能说明 | 当前证据 | 优化建议 | 优先级 |
| --- | --- | --- | --- | --- |
| `spec-adversarial-document-reviewer` | 从反方视角挑战文档前提、假设、风险遗漏和论证漏洞。 | doc-review conditional persona，92 行，挑战 premise/assumption。 | 补明确输出 schema，区分 “premise challenge” 与普通文档质量 finding；加 N/A guard，避免对低风险小文档强行制造阻塞。 | P2 |
| `spec-adversarial-reviewer` | 在 code review 中主动寻找隐藏失败模式、边界条件和反例。 | code-review conditional persona，112 行，已有 output/guard。 | 增加 failure-scenario examples 和 direct evidence rule：构造风险可以宽，但最终 finding 必须回到 diff/source/test/log 证据。 | P2 |
| `spec-agent-native-reviewer` | 审查 agent-native 能力对等、上下文传递、工具设计和 guardrail。 | code-review persona，184 行，关注 action/context parity。 | 明确与 `spec-cli-readiness-reviewer` 的边界：agent-native 看用户能力 parity，CLI readiness 看 command surface；补输出字段与 violation examples 的映射。 | P2 |
| `spec-ankane-readme-writer` | 以简洁工程表达重写 README 或项目介绍文案。 | 51 行，工具为空，主要被治理/历史 docs 引用。 | 判断是否仍需保留为 agent。如果保留，接入 docs workflow 或 README 生成入口；否则标为 deprecated 候选，避免 catalog 噪声。 | P1 |
| `spec-api-contract-reviewer` | 检查 API/schema/exported contract 的兼容性、版本化和调用方影响。 | code-review conditional persona，53 行。 | 补 breaking/non-breaking API examples，明确 schema/type/exported API 与 internal helper 的区分；增加 versioning / serialization false-positive guard。 | P2 |
| `spec-architecture-strategist` | 评估架构取舍、模块边界、演进路径和系统性风险。 | 58 行，通用 architecture reviewer，输出/置信度弱。 | 明确消费者是 plan deepening 还是 code review；补 output schema、confidence calibration、与 `spec-maintainability-reviewer` 的边界。 | P1 |
| `spec-best-practices-researcher` | 调研外部最佳实践并结合本地约束给出可采纳建议。 | 120 行，含 WebFetch/WebSearch/Context7。 | 按当前高时效资料规则强调官方/primary source 优先、必须浏览确认最新事实、引用限制；输出要区分 official docs、community examples、local fit。 | P1 |
| `spec-cli-agent-readiness-reviewer` | 深审 CLI 是否适合 agent 调用、自动化、错误处理和证据输出。 | 427 行，重型 CLI rubric。 | 将 7 原则长 rubric 下沉为 reference；保留 severity/output schema。明确它是 deep audit agent，`spec-cli-readiness-reviewer` 是 code-review 条件 persona。 | P1 |
| `spec-cli-readiness-reviewer` | 在 code review 中快速检查 CLI surface、参数、输出和自动化可用性。 | 74 行，code-review conditional persona。 | 与上一个 agent 共享 rubric 摘要和 finding schema，避免两套 CLI readiness 口径漂移；补触发阈值和非 CLI diff negative cases。 | P2 |
| `spec-code-simplicity-reviewer` | 从 YAGNI/简化视角检查实现是否过度复杂或抽象过早。 | 96 行，YAGNI final pass，已有 artifact 不删除 guard。 | 增加 confidence calibration 和 code-review compatible output schema；避免与 `spec-maintainability-reviewer` 重复，可作为 final simplification pass 而非 always-on。 | P2 |
| `spec-coherence-reviewer` | 审查文档结构、逻辑连贯性、术语一致性和读者路径。 | doc-review persona，76 行，model=haiku。 | 补结构化 finding 输出模板；把 safe_auto patterns 与 bulk preview 的关系写清，防止 doc-review 直接改 source 文档时越权。 | P2 |
| `spec-correctness-reviewer` | 检查代码正确性、状态流、边界条件和错误传播。 | always-on code-review persona，53 行。 | 补 examples：logic bug、edge case、state mismatch、error propagation；强调 P2/P3 不能仅凭猜测，必须有 source/test/log 证据。 | P2 |
| `spec-data-integrity-guardian` | 从数据完整性、约束、迁移和恢复角度识别风险。 | 72 行，通用数据安全 reviewer，缺输出/guard。 | 与 `spec-data-migrations-reviewer` / `spec-data-migration-expert` 做分层：guardian 可作为 plan/deep-dive lens，code-review 条件 persona 只保留一个。补 output 和 false-positive guard。 | P1 |
| `spec-data-migration-expert` | 深审生产数据迁移、回填、回滚、只读验证和运行手册。 | 99 行，data migration expert。 | 明确适用场景是 backfill/production data 深审，不替代普通 migration reviewer。补 read-only SQL / no production mutation / rollback evidence 输出合同。 | P1 |
| `spec-data-migrations-reviewer` | 在 code review 中检查 migration diff、schema drift 和数据兼容风险。 | code-review conditional persona，71 行。 | 结构健康。补与 deployment verification 的 handoff 条件：何时需要 Go/No-Go checklist、何时只是 reviewer finding。 | P2 |
| `spec-deployment-verification-agent` | 为高风险发布准备 Go/No-Go 验证清单、监控窗口和回滚证据。 | 161 行，高风险部署 checklist，缺 `What not to flag`。 | 强化安全边界：只生成 read-only verification queries 和 runbook，不执行生产 SQL。补 Go/No-Go output schema、rollback owner、monitoring window 与 confidence。 | P1 |
| `spec-design-implementation-reviewer` | 对照设计稿、截图或 DOM 证据检查实现与设计的一致性。 | 104 行，工具为空，但任务需要 live UI/Figma。 | 明确它必须消费 orchestrator 提供的 screenshots/Figma facts，不能自行假设可访问设计稿。若没有 browser/Figma evidence，输出应为 `insufficient_visual_evidence`。 | P1 |
| `spec-design-iterator` | 基于截图反馈循环提出 UI polish 改进和下一轮验证点。 | 200 行，工具为空，要求 screenshot-analyze-improve loops。 | 增加 stop criteria、max iteration、before/after evidence 和 no-tool fallback。建议由 `frontend-design` 或 `spec-polish-beta` orchestration 调用，不直接作为用户入口。 | P1 |
| `spec-design-lens-reviewer` | 在文档审查中检查设计决策、用户流程和视觉验收是否充分。 | doc-review conditional persona，49 行。 | 补 output schema，明确 design decision gaps 与实现视觉问题分离；实现视觉问题应交给 browser/figma verification，不由 plan lens 确认。 | P2 |
| `spec-dhh-rails-reviewer` | 用 DHH/Rails lens 审查 Rails 实现是否符合简洁和框架惯用法。 | Rails conditional persona，50 行。 | 增加 “project standards win over personality/style lens” guard；当 Rails app 自有约定冲突时，报告 tradeoff 而不是强制 DHH 风格。 | P2 |
| `spec-feasibility-reviewer` | 审查方案可行性、依赖不确定性、实现风险和开放问题。 | doc-review persona，45 行。 | 补 output schema 与 evidence ladder：source-backed feasibility issue、dependency uncertainty、open question 三类分开，避免把不确定性当阻塞。 | P2 |
| `spec-figma-design-sync` | 分析 Figma、截图与实现差异，并建议设计同步修复路径。 | 175 行，工具为空，声称检测并修复 Figma diff。 | 需要治理裁决：若 host 不提供 Figma/browser tool，应降级为 orchestrator helper 或 deprecate；补输入 contract（Figma payload、screenshots、DOM evidence）和 no-evidence fallback。 | P1 |
| `spec-framework-docs-researcher` | 查阅官方框架文档和版本特定资料，提供 primary-source guidance。 | 97 行，含 web/context7 tools。 | 与 `spec-best-practices-researcher` 分工：framework-docs 负责 official/version-specific docs，best-practices 负责 broader patterns。补高时效浏览与 source attribution 规则。 | P1 |
| `spec-git-history-analyzer` | 从 git history 中提取演变时间线、历史决策和当前判断线索。 | 48 行，git archaeology，输出弱。 | 补 command safety、range selection、output schema（timeline、decision evidence、uncertainty）和 “history is context, not current truth” guard。 | P2 |
| `spec-issue-intelligence-analyst` | 分析 GitHub issue 主题、趋势、用户痛点和规划信号。 | 213 行，GitHub MCP issue analysis。 | 补 GitHub auth/rate-limit fallback、private issue privacy、raw issue redaction、trend confidence。将 output schema 与 ideate/plan handoff 对齐。 | P1 |
| `spec-julik-frontend-races-reviewer` | 专门检查前端异步、生命周期、竞态和 UI 状态错序风险。 | frontend async race conditional persona，53 行。 | 补 direct evidence rule：race finding 需 cite lifecycle/async source path 或 test gap。增加 Turbo/Stimulus/React/Vue near-neighbor examples。 | P2 |
| `spec-kieran-python-reviewer` | 以 Python 语言和生态惯例 lens 审查清晰度、类型和可维护性。 | language-specific conditional persona，51 行。 | 明确它是 style/quality lens，不能覆盖 project standards；补 Python version / typing mode / framework convention evidence。 | P2 |
| `spec-kieran-rails-reviewer` | 以 Rails 清晰度和可维护性 lens 审查模型、控制器和约定使用。 | Rails-specific conditional persona，51 行。 | 与 `spec-dhh-rails-reviewer` 的触发差异需要 catalog 化：Kieran lens 偏 clarity/maintainability，DHH lens 偏 Rails/DHH style。 | P2 |
| `spec-kieran-typescript-reviewer` | 以 TypeScript 类型安全、配置和本地模式 lens 审查实现。 | TypeScript conditional persona，51 行。 | 补 TS config evidence rule，避免在未读取 `tsconfig`/local patterns 时提出过泛 type-safety finding。 | P2 |
| `spec-learnings-researcher` | 检索 `docs/solutions/` 中可复用经验并评估 freshness/invalidation。 | 279 行，docs/solutions recall agent，结构较完整。 | 增加 stale/invalidation handling：命中旧 learning 时要报告 freshness、invalidation condition、是否与当前 source 矛盾。可考虑把长方法迁 references。 | P2 |
| `spec-maintainability-reviewer` | 检查代码可维护性、局部模式一致性、复杂度和未来修改成本。 | always-on code-review persona，78 行，model=sonnet。 | 增加 direct evidence wording，明确 maintainability finding 也要落到 file/line、current consumers、local pattern 证据；避免仅凭偏好评价。 | P2 |
| `spec-pattern-recognition-specialist` | 识别跨文件重复模式、抽象机会和系统性一致性问题。 | 59 行，通用 pattern specialist，缺 output/guard。 | 与 maintainability/project-standards 重叠明显。建议合并为 deep-dive lens 或补 consumer/output/negative boundary，否则列为 deprecated 候选。 | P1 |
| `spec-performance-oracle` | 做深度性能分析、测量计划和瓶颈假设验证。 | 112 行，通用 performance analyst，guard 弱。 | 与 `spec-performance-reviewer` 分层：reviewer 负责 code-review 条件 finding，oracle 负责 deep performance investigation。补测量优先、no benchmark no confirmed perf claim、output schema。 | P1 |
| `spec-performance-reviewer` | 在 code review 中识别明显性能回退、N+1、无界循环和缓存风险。 | code-review conditional persona，55 行。 | 结构健康。补 benchmark/test candidate 分类，避免所有性能担忧都变 confirmed finding。 | P2 |
| `spec-pr-comment-resolver` | 判断 PR comment 是否有效，并生成修复摘要、验证说明和回复建议。 | 142 行，工具为空，由 `resolve-pr-feedback` spawn。 | 明确 mutating authority 来自父 workflow；agent 输出应包含 validity、fix summary、verification、reply text、thread resolve recommendation，不自行 resolve。 | P1 |
| `spec-previous-comments-reviewer` | 核对当前 diff 是否回应了历史 review comments 或遗留反馈。 | code-review conditional persona，69 行。 | 补 GitHub unavailable fallback：没有 review thread evidence 时报告 limitation，不猜测 prior feedback 是否 resolved。 | P2 |
| `spec-product-lens-reviewer` | 从产品目标、用户价值和范围收益角度审查文档或方案。 | doc-review persona，73 行。 | 补 output schema；明确 product lens 可以挑战 goal/work alignment，但不能凭产品偏好覆盖已确认 owner decision。 | P2 |
| `spec-project-standards-reviewer` | 对照项目本地标准、AGENTS/CLAUDE 指令和既有模式审查偏离。 | always-on code-review persona，85 行。 | 强化 Host Instruction Reuse Policy：不要每次重读 AGENTS/CLAUDE，优先使用已加载标准或 precise source refs；finding 需 cite concrete standard。 | P2 |
| `spec-reliability-reviewer` | 检查可靠性、超时、重试、后台任务、健康检查和降级行为。 | code-review conditional persona，53 行。 | 增加 failure-mode fixture：timeout/retry/background job/health check；输出区分 reliability bug、test candidate、rollout concern。 | P2 |
| `spec-repo-research-analyst` | 快速研究仓库结构、关键模块、约定和上手/影响范围。 | 264 行，repo onboarding/research agent。 | 初载偏大。拆 output template 和 methodology 到 references；增加 bounded read budget、provider_untrusted graph facts 标记、research summary schema。 | P1 |
| `spec-schema-drift-detector` | 检查 Rails schema.rb 或数据库 schema 与 migration/source 的漂移。 | 143 行，Rails `schema.rb` drift detector。 | 明确 Rails-only / schema.rb-only；与 data migrations reviewer 的触发关系写进 persona catalog。补非 Rails negative cases 和 db/structure.sql fallback。 | P1 |
| `spec-scope-guardian-reviewer` | 守住需求/计划范围，识别 scope creep、过度设计和非目标工作。 | doc-review persona，61 行。 | 结构健康。补 output schema 和 “scope increase may be justified by role contract/adoption evidence” counter-evidence，避免过度压缩。 | P2 |
| `spec-security-lens-reviewer` | 在文档审查中标出安全风险、缺失验证和需要后续确认的问题。 | doc-review security lens，41 行。 | 补 plan-level security output schema，明确它不能声明实现安全通过，只能标计划风险、open questions、required verification。 | P2 |
| `spec-security-reviewer` | 在 code review 中检查安全漏洞、secret 处理、供应链和不可信输入。 | code-review conditional persona，55 行。 | 增加 provider-output-as-instruction、supply-chain、secret handling cases；与 `spec-security-sentinel` 分层。 | P1 |
| `spec-security-sentinel` | 做更宽的安全深审、威胁建模和误报校准。 | 95 行，通用 security audit，输出/置信弱。 | 作为 deep-dive security audit 保留或合并；补 OWASP/security output schema、false-positive guard、no secret exfiltration rule。 | P1 |
| `spec-session-historian` | 整理历史 session 事实、尝试路径、限制和可复用上下文。 | 91 行，sessions workflow helper。 | 结构清晰。补隐私/redaction 和 stale-session confidence；强调 session recall 是 advisory，不替代当前 source evidence。 | P2 |
| `spec-slack-researcher` | 从 Slack 搜索结果中综合组织决策、约束和讨论脉络。 | 152 行，Slack MCP researcher。 | 补 no raw message dump、workspace identity required、private channel limitation、audience boundary。输出要给 decisions/constraints/discussion arcs，不给聊天记录列表。 | P1 |
| `spec-spec-flow-analyzer` | 分析 spec/user-flow 是否闭合，区分流程缺口、需求缺口和开放问题。 | 88 行，spec/user-flow analyzer。 | 与 `spec-prd`、doc-review design/product lens 有交集。补 consumer boundary、output schema，并区分 flow gap、requirement gap、open question。 | P2 |
| `spec-swift-ios-reviewer` | 审查 Swift/iOS 代码、生命周期、并发、构建和平台惯例。 | Swift/iOS code-review persona，108 行。 | 结构健康。补 Xcode/test-xcode handoff：何时需要 simulator/build verification、何时仅 code finding。 | P2 |
| `spec-testing-reviewer` | 检查测试覆盖是否匹配行为变更、风险和本地测试模式。 | always-on code-review persona，57 行。 | 补 “missing tests” finding 的 evidence ladder：changed behavior、existing test pattern、observable risk、suggested focused test。避免泛泛要求更多测试。 | P2 |
| `spec-web-researcher` | 基于外部 Web 证据做研究综合，并标注 freshness 和 source quality。 | 136 行，tools 为空但描述 web research。 | 明确由 orchestrator 提供 web search/fetch evidence，或给 agent 声明合适工具；补 citation/freshness/source quality rubric，以及 no-current-info fallback。 | P1 |

## 建议落地顺序

1. 先修 `retired-skill-review` deterministic scanner 的误报分类：runtime mention、provider runtime writes、secret regex 防护、sudo suggestion 输出。
2. 为内部/高权限 helper skill 补轻量 contract：`git-worktree`、`git-clean-gone-branches`、`resolve-pr-feedback`、`proof`、`gemini-imagegen`、`test-browser`、`test-xcode`。
3. 对大 workflow 做 progressive disclosure：先从 `spec-code-review`、`spec-plan`、`spec-work` 三个最高频入口开始。
4. 统一 reviewer persona catalog 与 output schema：先处理 code-review/doc-review 已在 catalog 的 29 个 reviewer，再清理非 catalog 旧 agent。
5. 规范 eval fixture，让现有 `examples.json` 被 `retired-skill-review` readiness checker 正确识别，再补缺口。

## 本轮验证与限制

- 已执行：`node skills/retired-skill-review/scripts/write-audit-artifacts.js --repo .`。
- 已回源：`skills/` 清单、`agents/` 清单、`retired-skill-review` summary/plan/guard/eval reports、`spec-compound` 与 `spec-mcp-setup` runtime-governance 误报片段。
- 未执行 fresh-source subagent eval：本次目标是写优化建议文档，未授权 subagents/personas；建议后续对具体 source 修改再跑 fresh-source eval。
- 未修改 generated runtime mirrors；`.spec-first/audits/skill-review/**` 是 gitignored 执行产物，不作为本文件 source。
