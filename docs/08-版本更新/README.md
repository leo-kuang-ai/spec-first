# 版本更新

本目录用于记录 `spec-first` 近期的重要能力迭代。结合当前仓库版本信息，以下内容可作为 `v1.5.1` 阶段的核心更新摘要。

## 最近更新速览

> 说明：本文保留 benchmark / CRG Quality Gate 的历史演进记录，便于追溯版本背景；但这些条目中的 benchmark、`test:crg:gate`、`test:crg:benchmark-evidence` 与 `quality-gates/crg-benchmark-evidence` 已在当前实现中退役，不再构成现行操作面或质量门入口。


| 日期 | 类型 | 主题 | 价值 |
|------|------|------|------|
| 2026-06-21 | fix | `version-reminder-cooldown-short-circuit` | 版本提醒在 startup host scope 与 CLI package scope 内都会先检查 24h attempt gate，再决定是否触达网络；断网、慢网、已是最新或已提示都会暂停同 scope 的重复 lookup，startup 与 CLI 互不抑制，成功 `spec-first update` 会清理 CLI gate |
| 2026-06-15 | refactor | `retire-coding-guidelines-block` | `spec-first init` 不再向 `CLAUDE.md` / `AGENTS.md` 注入 `coding-guidelines` managed block；`init` / `clean` 仍会清除存量与孤立 block，`doctor` 移除对应检查项，`coding-guidelines` 模块瘦身为 removal-only，执行姿势交还给项目自身 instruction 维护，managed 区收敛为 `lang` → `bootstrap` 两层 |
| 2026-05-13 | refactor | `init-bootstrap-context-router` | 将 `spec-first init` 写入 `CLAUDE.md` / `AGENTS.md` 的 `spec-first:bootstrap` managed block 收敛为轻量 context router：根入口文档只保留 workflow 触发提醒、当前 host 入口边界、父 workspace 写入安全线、Codex startup/dispatch 边界和常用锚点，完整路由策略继续由 `skills/using-spec-first/SKILL.md` 维护 |
| 2026-04-21 | docs | `bootstrap-database-handoff-doc-sync` | 同步刷新 `spec-graph-bootstrap` source/mirror skill、solution learning 与 contract test 的数据库 handoff 口径：明确 `database-routing.json` 中 `candidate_readiness` 才是主信息面板，顶层 `recommended_action` / `blockers[]` 只是 compatibility projection，避免 prompt / 文档继续沿用旧的 route/fallback/provenance 真源叙事 |
| 2026-04-21 | refactor | `bootstrap-database-compatibility-projection` | 将 `database-routing.json` 顶层 `recommended_action` / `blockers[]` 明确降格为 compatibility projection：这两个字段继续保留以兼容旧消费方，但已经不再是主真源，而是从候选级 readiness / blockers facts 派生出来；真正的数据库 handoff 判断面继续收敛到 `candidate_readiness` |
| 2026-04-21 | refactor | `bootstrap-database-candidate-blockers` | 将数据库 handoff 的阻断语义进一步下放到候选级：现在具体哪个连接因为 route 不支持、工具缺失、env hints 不完整而被挡住，会直接写进 `candidate_readiness.candidates[].blockers[]`；顶层 `blockers[]` 只保留 repo 级 runtime 摘要，进一步减少脚本替 LLM 做全局阻断裁决 |
| 2026-04-21 | refactor | `bootstrap-database-candidate-readiness` | 将 `database-routing.json` 从全局聚合式 readiness 再收一层为“候选级事实面板”：现在每个连接候选都会显式暴露自己的 env keys、route availability 和 `can_readonly_introspect` 状态，`recommended_action` 只保留为保守摘要，不再承担隐藏选择器角色，更符合“轻 contract + 明确边界 + 让 LLM 决策” |
| 2026-04-21 | fix | `bootstrap-database-handoff-edge-cases` | 修复 `spec-graph-bootstrap` 数据库 handoff 的两个边界误判：schema-only 仓库不再因为缺少 live config 而丢失 `database_schema` 证据，多连接项目也不再因为次要连接 env 缺失而把整个仓库误降级成 `llm-inspect-repo`；新的语义更符合“给 LLM 提供真实 decision input，而不是全局并集式阻断” |
| 2026-04-21 | refactor | `bootstrap-database-cli-only-handoff` | 继续收缩 `spec-graph-bootstrap` 的数据库 handoff：`database-routing.json` 不再暴露 `mysql-mcp`，只保留与当前 hints 对齐的只读 CLI 能力；同时把 `recommended_action` 改成更保守的 readiness 判断，只有 route hint 与 env hints 同时满足时才推荐 live readonly introspection，否则明确回退 `llm-inspect-repo` 并给出 blocker |
| 2026-04-21 | refactor | `bootstrap-database-llm-handoff` | 将 `spec-graph-bootstrap` 的数据库模块从 rule-first / database worker 收缩为 LLM-first handoff：bootstrap 现在只输出 `fact-inventory.database[]`、`fact-inventory.database_schema[]` 和轻量 `database-routing.json`，把数据库识别、源码补读、是否做只读 introspection 的决策交还给 LLM；同时补齐 Spring Boot / Django / SQLAlchemy / Alembic 等 framework hints 与 schema path 识别，继续避免 narrative docs 伪造数据库事实 |
| 2026-04-21 | refactor | `bootstrap-database-evidence-first` | 为 `spec-graph-bootstrap` 的数据库识别链路引入 evidence-first contract：`fact-inventory` 新增多来源 `evidence_sources` 与独立 `database_schema` 静态证据层，`derive-bootstrap-facts` 开始从代码配置、migration 与文档化 ER 聚合数据库证据；同时进一步收紧 narrative docs 误报面，`doc-reference` 不再直接伪造连接候选，`config_source` 也按证据强度稳定指向更可信的代码/配置来源，让 LLM 拿到更真实的数据库 decision input |
| 2026-04-20 | feat | `stage0-topology-unified-bootstrap` | 为 `spec-graph-bootstrap` / `stage0-context` 收口统一 topology contract，正式支持 workspace 多独立 git 工程、单 git 多 module、单 git 单项目三类场景；同时把 `selection_subject / selected_contexts` 提升为解释型真源，保留 `selected_assets` 等兼容视图，继续遵循“轻 contract + 明确边界 + 让 LLM 决策” |
| 2026-04-20 | feat | `init-coding-guidelines` | `spec-first init` 现在会向用户项目的 `CLAUDE.md` / `AGENTS.md` 追加独立的 `coding-guidelines` managed block，并保持已有用户内容只追加不覆盖；`clean` 会移除该 block，`doctor` 会检查缺失或漂移状态，让 instruction file execution posture 也进入受管边界 |
| 2026-04-20 | feat | `spec-compound-dual-view` | 为 `spec-compound` / `spec-compound-refresh` 增加 `Human Summary + LLM Reuse Context` 单文件双视角 contract，保持 `docs/solutions/` 仍是唯一持久化目录；同时让 `learnings-researcher` 和 prompt mirror 直接消费这层结构，把“人类汇报视图”和“LLM 检索复用视图”统一收敛到同一份事实文档里 |
| 2026-04-20 | feat | `spec-review-three-axis-verdict` | 为 `spec-code-review` 增加 `Requirement Completion / Plan-Diff Fidelity / Code Intrinsic Quality` 三轴聚合视图，并明确 explicit/inferred/missing plan 的条件式输出，让 review 更快回答“需求做完没、实现偏计划没、代码本身质量如何” |
| 2026-04-19 | feat | `spec-work-run-artifact-contract` | 为 `spec-work` 增加 machine-truth `run.json` schema、可选 `closure-summary.md` 投影，以及 `spec-code-review` 消费上游 work artifact 的显式 handoff contract；先固定结构化闭环语义，不急着引入更重的 runtime 编排 |
| 2026-04-19 | feat | `sdd-riper-light-contracts-u1-u2` | 为 `spec-brainstorm/spec-plan/spec-work/spec-work-beta/spec-debug/spec-code-review` 引入轻量 loop anchors 与 freshness-driven reload contract：在关键节点复述当前理解 / 核心目标 / done evidence，并在 Stage-0 stale/partial/fallback 时先补读事实再动作，减少长会话偏航和旧上下文误判 |
| 2026-04-19 | fix | `runtime-truth-hardening` | 收紧 `doctor` 的 verification evidence 真源到 workflow artifacts contract，并把 schema/freshness 纳入 `verified` 判定；同时为 runtime command/skill/agent 增加内容级 drift 检查，并把 `init/clean --dry-run` 升级为 file-level operation preview，让诊断和预览更接近真实执行面 |
| 2026-04-18 | feat | `crg-benchmark-evidence` | 为 `CRG Quality Gate` 增加 `benchmark-evidence` PR job 和轻量聚合 artifact，形成 `regression-gate + benchmark-evidence` 的双轨组合；evidence 只收集事实，不发明新的 gate 状态 |
| 2026-04-18 | feat | `external-benchmark-fixture` | 为 review/repo-qa/context-efficiency benchmark 增加受控 `demo-store + wallet-suite` external fixture repo 样本，并让 runner 只在显式 `fixture_repo_root` 存在时切换输入根目录；继续保持证据层定位，不引入自动下载、自动同步或新 gate 状态 |
| 2026-04-18 | feat | `branch-protection-policy-baseline` | 新增 machine-readable `advisory` branch protection policy，明确 `AI Dev Quality Gate` 与 `CRG Quality Gate` 是建议保护 `main` 的 required checks；只提供治理真源与一致性守卫，不自动改 GitHub 设置，也不引入 gate 状态机 |
| 2026-04-18 | feat | `crg-benchmark-contract` | 为 benchmark/gate 增加轻量可比对 contract，显式输出 `benchmark_contract_version`、`analyzer_revision` 与输入 digest；让质量门表达“这次结果是否可比”，而不是发明更多流程状态 |
| 2026-04-18 | fix | `crg-flow-signals` | 收紧 CRG flow 风险输入：移除伪语义 `test_gap`、把安全关键词改为“强信号 + 安全路径弱信号”，并为 flow 相关输出显式补 `entry_confidence/entry_inference_reason`，让 LLM 拿到更干净的决策输入，而不是把启发式误当事实 |
| 2026-04-18 | feat | `stage0-real-machine-artifacts` | 为 bootstrap compiler 增加基于仓库文件系统的轻量 fact inference，开始真实产出 `fact-inventory.json / risk-signals.json / test-surface.json`，并让 human assets / routing / runBootstrap 主链消费这些事实输入；保持轻 contract，不把 bootstrap 演化成更厚的状态机 |
| 2026-04-18 | feat | `quality-feedback-loop` | 为 `AI Dev Quality Gate` 增加被动 `quality-feedback-topics.json` artifact，并让 `spec-compound` / `spec-compound-refresh` 把 `candidate_topics` 作为补充决策输入读取，形成轻量 feedback loop；仍然不自动触发回灌，也不引入 gate 状态机 |
| 2026-04-18 | feat | `runtime-ai-dev-gate-facts` | 将最近一次 `ai-dev-quality-gate-result` 作为可选顶层事实接入 runtime / telemetry / workflow docs，帮助 LLM 读取最近的 CI/gate 质量背景；同时明确多仓 workspace 不做聚合，避免发明额外状态语义 |
| 2026-04-18 | feat | `ai-dev-gate-result` | 为 `AI Dev Quality Gate` 新增独立 machine-readable result artifact 与 schema，CI 现在不仅“跑了 gate”，还会产出轻量结果快照供 LLM / 人消费；保持被动事实层，不引入 gate 状态机 |
| 2026-04-18 | feat | `ai-dev-quality-gate` | 新增 `AI Dev Quality Gate` workflow 与 `test:ai-dev:gate`，把 Stage-0 verification contracts 收成独立 CI 入口，并让现有 `CRG Quality Gate` 同步监听共享 verification contract 变更，使 Phase D 从“只有 evidence 真源”推进到“CI-ready gate baseline” |
| 2026-04-18 | feat | `stage0-verification-evidence` | 新增独立 `verification_evidence` contract，并让 `verification_gate_state` 基于真实 evidence reference 反映 `satisfied` gate / `evidence_locations` / `satisfied_required_gate_count`，把 runtime verification 输入从“只有建议和状态”推进到“事实 / 候选 / 证据 / 状态”四层轻量闭环 |
| 2026-04-18 | fix | `stage0-verification-contract-boundaries` | 将 `verifier_dispatch` 从 `verification_summary` 中抽离为顶层 contract，并让 `verification_gate_state` 只保留 gate ledger，不再混入 `handoff_posture` 这类路由建议，进一步收紧 runtime 边界，让 workflow/LLM 读到“事实 / 候选 / 状态”三层清晰输入 |
| 2026-04-18 | feat | `stage0-verifier-dispatch-and-gate-state` | 为 runtime verification summary 增加 stage-aware verifier candidates / blockers / manual gates，并拆出独立 `verification_gate_state`，让 workflow/LLM 拿到更完整但仍轻量的验证决策输入，而不是被固定执行树绑死 |
| 2026-04-18 | fix | `stage0-workspace-runtime-boundaries` | 收紧 Stage-0 workspace runtime contract：child git cwd 不再误退 `single-repo`，explicit / overview-only 路径只暴露稳定 boundary 字段，不再把 idle child baseline 伪装成当前改动 checklist，给 workflow/LLM 更干净的决策输入 |
| 2026-04-18 | feat | `verifier-registry-baseline` | 新增 verifier registry 真源，并把 `test-browser` / `test-xcode` 从 `verification-profile` 编译器的硬编码分支抽成 registry-backed capability metadata，为后续 stage-aware dispatch 留出稳定扩展位 |
| 2026-04-18 | feat | `stage0-runtime-telemetry-default` | `stage0-context` 现在会默认把 workflow telemetry 写入真实 workflow 目录，并保留 `verification_summary`，使 `spec-plan/spec-work/spec-work-beta/spec-code-review` 的 Stage-0 消费从“只读 runtime JSON”升级为“可追溯的默认运行闭环” |
| 2026-04-18 | feat | `workflow-stage0-runtime-preload` | 新增内部 CLI `stage0-context` 并把它接到 `spec-plan/spec-work/spec-work-beta/spec-code-review` 的默认运行链，让 Stage-0 / verification summary 不再停留在“workflow 文案要求手工读取”，而是每次运行自动注入 best-effort runtime JSON |
| 2026-04-18 | feat | `runtime-verification-summary-consumption` | 将 diff-aware verification recommendation 接到 `compileWorkspaceContext` 与 `spec-work/spec-work-beta/spec-code-review` 的运行时消费口径，workflow 直接按当前改动的 effective checklist 工作，docs-only 改动不再被 repo baseline 伪造必跑项污染 |
| 2026-04-18 | feat | `change-surface-verification-recommendation` | 为 `crg review-context` 新增 `change surface -> verification recommendation` 链路，输出 `impacted_*`、`recommended_*_verifications` 与 `confidence`，让系统从“仓库级能测什么”进一步收敛到“本次改动最少该验证什么” |
| 2026-04-18 | feat | `stage0-verification-profile` | 为 Stage-0 新增 `verification-profile` machine contract，并把 platform-aware verification summary 接进 `minimal-context` 与 `spec-plan/spec-work/spec-code-review/spec-work-beta`，让 workflow 从“泛化测试建议”升级为“默认验证矩阵 + required gate checklist” |
| 2026-04-18 | feat | `using-spec-first-sessionstart-bootstrap` | 为 `using-spec-first` 补齐双宿主 instruction bootstrap，并给 Claude 增加受管 `SessionStart` hook / `.claude/settings.json` matcher；`init / doctor / clean` 形成可安装、可诊断、可清理的最小闭环 |
| 2026-04-17 | feat | `spec-brainstorm-capability-upgrade` | `spec-brainstorm` 补齐 Current Work Pulse、Scope Decomposition、Preflight Self-Check、User Review Gate、Terminal State Lock 与 epic decomposition template，并让 `spec-plan` 消费 requirements frontmatter `epic`；同步补 smoke/integration 接线与 release-facing 文档 |
| 2026-04-17 | fix | `release-gate-hardening` | 默认 `test:release` 从“仅双宿主治理专项 smoke”恢复为“治理专项 smoke + 完整 tarball 安装回归”的总门禁，并给治理专项 smoke 增加 docs-side JSON/schema 不得进入 tarball 的负向断言，防止发布链路只守住新真源、不守旧真源回流 |
| 2026-04-16 | fix | `resolve-pr-feedback` | 恢复 `resolve-pr-feedback` skill 本体对全部 review feedback text 的宽口径不可信输入边界，保留 `cross_invocation` 四键输出与更深查询窗口，并补强 contract test，防止 future drift 回退到只覆盖 PR comment 的窄口径 |
| 2026-04-16 | fix | `dual-host-release-contract` | 将双宿主治理 machine-readable 真源迁移到 `src/cli/contracts/dual-host-governance/`，补齐默认 `test:release` 发布验证与 runtime/docs 边界闸门，消除 tarball 安装态治理断链 |
| 2026-04-16 | docs | `audit-consistency` | 修正全量同步审计文档中过期的 skill/agent 统计与 source-only 结论，补齐 `dhh-rails-style` 映射，并明确 agent 总览只统计 `agents/**/*.md`，避免把 helper scripts 混入 agent 口径 |
| 2026-04-16 | fix | `agent-audit-governance` | 修正主审计文档里 agent 差异统计 `11/12` 不一致，给不一致 Agent 列表补 `差异性质` 字段，并把 `workflow/lint` 的 `model: haiku` 固定模型例外纳入双宿主治理 contract |
| 2026-04-16 | fix | `agent-tail-optimization` | 收口 4 个 agent 尾项：`learnings-researcher` 的 schema/planning 引用改为中性表述，`best-practices-researcher` 的 Documentation 映射改为真实 skill 标识 `spec-compound`，`pr-comment-resolver` 与上游正文完全对齐，并把双宿主模型治理扩成“默认 inherit + `coherence-reviewer` 固定模型例外”闭环 |
| 2026-04-16 | fix | `agent-governance` | 修正 Agent 审计统计失真，补齐 `model: inherit` 的双宿主治理 contract，并把 `git-history-analyzer`、`issue-intelligence-analyst`、`session-historian`、`code-simplicity-reviewer`、`project-standards-reviewer` 的高频命名硬编码收口为中性模板，补 2 组专项 contract tests |
| 2026-04-16 | fix | `agent-parity` | 完成 `product-lens-reviewer`、`best-practices-researcher`、`pr-comment-resolver` 三项 P1 agent 对齐修复：恢复产品上下文/战略后果审查、补回 `dhh-rails-style` Ruby/Rails 映射与显式 skill attribution 模板、放宽 review feedback 的 untrusted input 安全边界，并补 3 组内容级 contract tests |
| 2026-04-16 | fix | `spec-only-skill-boundaries` | 完成 `agent-browser`、`orchestrating-swarms`、`rclone`、`reproduce-bug` 的职责边界深审，明确 browser substrate / Claude-host orchestration / transport substrate / issue-grounded investigation 分层，并补 3 个专项 contract tests 与审计完成态 |
| 2026-04-16 | test | `exact-same-skill-parity` | 对 `agent-native-architecture`、`andrew-kane-gem-writer`、`dspy-ruby`、`gemini-imagegen`、`git-clean-gone-branches` 完成上游目录级核对与 contract freeze，把“已追平但未证据化”的 skill 收口为可回归完成态 |
| 2026-04-16 | fix | `spec-update` | `spec-update` 的 CLI 探测改为“PATH 优先 + repo-local source checkout fallback”，修复在 `spec-first` 源码仓库内源码直跑时误报“当前 CLI 无法检查、建议全局重装”的问题 |
| 2026-04-16 | feat | `source-only-skill-parity` | 完成 `ce-debug`、`ce-update`、`ce-optimize`、`ce-sessions`、`ce-slack-research`、`ce-demo-reel` 六项上游 source-only 能力追平：新增 `spec-debug`、`spec-update`、`spec-optimize`、`spec-slack-research`，补齐 `feature-video` 分层证据采集、`session-historian` 脚本同步与 Claude/Codex runtime 打包守卫 |
| 2026-04-15 | feat | `spec-graph-bootstrap+crg` | 完成 Stage-0 后续 P1-P3 最小闭环：补齐 `plan/work minimal-context`、hybrid retrieval、AST-aware chunking、freshness/lint/contradictions、compiler 模块化、repo QA/context efficiency/regression benchmark、workflow telemetry、optional semantic rerank、workspace context 与知识治理能力 |
| 2026-04-15 | fix | `managed-state-upgrade` | 统一 legacy managed state 升级语义：`doctor` 会明确标记 legacy state 并指向 `init`，`init` 成为唯一支持的 hard-cut 升级入口，执行 managed hard reset 后全量重建运行时，`clean` 仅清理当前受管集合并保留用户自定义资产 |
| 2026-04-15 | feat | `spec-brainstorm` | `spec-brainstorm` 同步 `ce-brainstorm` 非 Slack 核心能力，并新增 source-driven supplemental context 路由：支持 Local Docs、Feishu Chat、Feishu Doc、GitHub URL、Docs URL、Web URL；同时补齐 `universal-brainstorming` / `visual-communication` references 与 contract/smoke 守卫 |
| 2026-04-14 | fix | `compound-core-workflows` | 修正 `spec-plan/references/plan-handoff.md` 中遗留的 `spec-doc-review mode:headless` 指令，使 planning handoff 与本地 `spec-doc-review` 非 headless contract 一致，避免自动化调用引用不存在模式 |
| 2026-04-14 | feat | `compound-core-workflows` | 完成 `compound-engineering-plugin` 核心链路批次 B-D 同步：`spec-plan` / `spec-brainstorm` 收口 repo-relative、mandatory spec-doc-review 与 reference 抽取；`spec-work` / `spec-work-beta` 收口 review/testing/delegation 约束并拆出 shipping/codex references；`spec-compound` / `spec-compound-refresh` 补 discoverability 检查、stack-aware reviewer 路由，并将 `docs/solutions/` 可发现性写回 `AGENTS.md` / `CLAUDE.md` |
| 2026-04-13 | refactor | `artifact-path` | CRG 图数据库从 `.spec-first-graph/` 迁移到 `.spec-first/graph/`；bootstrap 控制面从 `.context/spec-first/bootstrap/` 迁移到 `.spec-first/workflows/bootstrap/`；fingerprints.json 拆分为 `input-fingerprints.json`（graph 层）和 `artifact-manifest.json`（bootstrap 层）；ignore 文件从 `.spec-first-graphignore` 改名为 `.spec-firstignore` [breaking internal] |
| 2026-04-13 | docs | `install-experience` | 统一所有面向用户安装文档的 onboarding 顺序（安装 -> doctor -> init -> 重启 -> workflow）；修正 tree-sitter peer dep 版本方向描述错误（主包 0.21.0，grammar 要求更高版本）；将 peer warning 叙事从"预期行为"改为"已知兼容性噪音，本版本目标是消除"；FAQ 明确区分"安装成功确认"与"宿主内 workflow 可见"两个阶段 |
| 2026-04-12 | feat | `spec-graph-bootstrap` | `graph-bootstrap` 的 manifest、安装提示、README、用户手册与 smoke 断言统一升级为 graph-informed Phase 0-4 / 阶段2最小闭环语义，对外描述与 `SKILL.md`、阶段2文档收敛一致 |
| 2026-04-09 | feat | `spec-graph-bootstrap` | 新增阶段 1 安装集成入口，`bootstrap` 保持稳定默认入口，`graph-bootstrap` 以并行验证入口接入 Claude / Codex runtime、smoke 与文档链路 |
| 2026-04-08 | fix | `mcp-setup` | 收紧双宿主健壮性，Serena MCP 配置按宿主上下文校验，宿主歧义时不再默认 Claude |
| 2026-04-08 | docs | `mcp-setup` | 将技能命名统一为 `spec-mcp-setup`，Codex 直接调用格式改为 `spec-mcp-setup`，与其他 spec-* 技能保持一致 |
| 2026-04-08 | feat | `codex` | Codex init 曾短暂生成 `spec-*` compatibility command files；该产品面后续已撤回，当前 Codex 正式入口以 `spec-*` skills 为准 |
| 2026-04-08 | docs | `mcp-setup` | 增加更友好的执行进度提示，安装与验证脚本会显示当前宿主检查、逐项配置、标记写入和完成状态 |
| 2026-04-08 | feat | `mcp-setup` | 增加 Windows PowerShell 7+ 支持，补齐 detect/check/install/verify 的 .ps1 入口，并把技能合同改成按平台选择脚本 |
| 2026-04-08 | fix | `mcp-setup/spec-graph-bootstrap` | 让 MCP 安装与引导流程按当前宿主自适应，自动区分 Claude Code / Codex 的配置文件与 host-setup 标记路径，并补齐双宿主 unit 测试与文档同步 |
| 2026-04-08 | refactor | `graphify` | 全局删除 graphify skill、命令模板和运行时引用，移除 spec-first 中的 graphify 入口 |
| 2026-04-08 | fix | `mcp-setup/spec-graph-bootstrap` | 删除 GitNexus / ABCoder 安装链与 Full mode 引用，收缩为 Serena / Sequential Thinking / Context7 基础 MCP 套件，并同步重写 host schema、验证脚本和 PRD 模板 |
| 2026-04-01 | feat | `version-reminder` | CLI 执行真实命令前自动检查 npm 最新版本，有更新时输出提醒，降低用户使用旧版本的概率 |
| 2026-04-01 | feat | `lang-governance` | `spec-first init` 将语言和 Changelog 治理规则写入 CLAUDE.md/AGENTS.md，并修复 lang 优先级（项目 > 全局 > 默认） |
| 2026-04-01 | feat | `mcp-setup` | 把 MCP 工具安装、检测、配置合并为一条一键化路径，降低 Full mode 落地门槛 |
| 2026-03-31 | fix | `spec-graph-bootstrap` | 基于 review 结论补强原子备份、失败恢复、MCP 连接校验等关键可靠性能力 |
| 2026-03-31 | feat | `spec-graph-bootstrap` | 新增 Stage-0 上下文引导工作流，为后续 brainstorm / plan / work / review / compound 提供稳定上下文资产 |

---

## 2026-04-20 `feat(stage0-topology-unified-bootstrap)`

### 更新内容

这一步把 008 主计划里的拓扑统一方案真正落到 bootstrap/runtime 主链，解决三类项目形态的 Stage-0 命中与消费边界：

- 三类正式支持
  - 父目录下多个独立 git 工程
  - 单个 git 工程下多个 module
  - 单个 git 工程单项目
- 统一 machine-readable topology 真源
  - `fact-inventory.json` 新增 `topology`
  - `topology.units` 成为 monorepo / workspace 结构的稳定输入
- 统一运行时解释层
  - `stage0-context` 现在显式输出 `selection_subject` 与 `selected_contexts`
  - `selected_assets / fallback_reason / level / skipped_rules` 继续保留为兼容视图
- workspace / nested topology 收口
  - 非 git 聚合目录在未显式传入 `repoRoots` 时，可自动发现 child git repo 并进入 workspace bootstrap
  - workspace child repo 若自身是 monorepo，运行时可命中 module 级 subject，并同时携带 workspace overview + module scoped contexts
- 成功语义收紧
  - `context-routing.json` 与 `minimal-context/{plan,work,review}.json` 被提升为关键 control-plane outputs
  - compile-only 场景不再因为缺少调用方未提供的 `actualAssets` 被误判 incomplete；但真实运行场景若缺关键资产，会明确落到 `manifest.status=incomplete`
- 下游 workflow 同步消费
  - `spec-plan` / `spec-work` / `spec-work-beta` / `spec-code-review` / `spec-graph-bootstrap` 与对应 prompt mirror 已统一按新的 Stage-0 口径描述

### 为什么重要

这次改动不是引入新的 orchestrator，也不是把质量门变成多状态流转状态机，而是把“当前上下文到底命中了谁、为什么命中、可执行主体边界是什么”说清楚。LLM 拿到的是更诚实、更统一的决策输入，而不是更重的执行树。

### 关键文件

- 核心实现
  - `src/bootstrap-compiler/workspace-compiler.js`
  - `src/bootstrap-compiler/compile-minimal-context.js`
  - `src/bootstrap-compiler/compile-human-assets.js`
  - `src/bootstrap-compiler/compile-routing.js`
  - `src/bootstrap-compiler/compile-machine-artifacts.js`
  - `src/bootstrap-compiler/orchestrator.js`
  - `src/bootstrap-compiler/run-bootstrap.js`
  - `src/cli/commands/stage0-context.js`
- workflow / 文档契约
  - `skills/spec-plan/SKILL.md`
  - `skills/spec-work/SKILL.md`
  - `skills/spec-work-beta/SKILL.md`
  - `skills/spec-code-review/SKILL.md`
  - `skills/spec-graph-bootstrap/SKILL.md`
  - `docs/10-prompt/skills/*`

### 验证

- 新增 / 更新 topology 与 contract 回归：
  - `tests/unit/spec-graph-bootstrap-monorepo.test.js`
  - `tests/unit/workspace-nested-topology.test.js`
  - `tests/unit/verification-summary-topology.test.js`
  - `tests/unit/monorepo-topology.test.js`
  - `tests/unit/stage0-context-monorepo.test.js`
  - `tests/unit/workspace-context.test.js`
  - `tests/unit/stage0-context-command.test.js`
  - `tests/unit/spec-graph-bootstrap-compiler.test.js`
  - `tests/unit/spec-graph-bootstrap-contracts.test.js`
  - `tests/unit/workflow-stage0-consumption.test.js`
  - `tests/unit/spec-plan-contracts.test.js`
  - `tests/unit/spec-work-contracts.test.js`
  - `tests/unit/spec-review-contracts.test.js`
  - `tests/unit/spec-work-beta-contracts.test.js`
  - `tests/unit/asset-consistency.test.js`
  - `tests/unit/using-spec-first-runtime-contracts.test.js`

### 边界说明

- `selection_subject.kind=workspace` 只用于 overview/unresolved fallback，不作为常规 L0 执行主体
- 这次没有引入 docs 下新的 runtime 真源索引文件；workspace registry/routing 仍以 `.spec-first/workflows/bootstrap/<slug>/` 为 control-plane 真源
- 没有把 module 做成独立 repo 级产物目录，也没有引入任意深度递归拓扑推导


## 2026-04-20 `feat(init-coding-guidelines)`

> 已于 2026-06-15 退役：`spec-first init` 不再注入该 block；以下为历史记录。`init` / `clean` 仍会清除存量与孤立 block。

### 更新内容

这一步把 instruction file 里的“执行姿势”也纳入了 spec-first 的 managed boundary：

- `spec-first init` 会向用户项目的 `CLAUDE.md` / `AGENTS.md` 注入独立的 `coding-guidelines` managed block
- 初次接入时，如果用户已经有自己的 instruction 内容，spec-first 只会把 managed blocks 追加为连续 footer，不会覆盖整份文件
- 后续 re-init 只会原位替换 spec-first 自己的 marker-delimited blocks
- `spec-first clean` 会移除 `coding-guidelines` 和 `using-spec-first bootstrap`，但保留 `lang-policy`
- `spec-first doctor` 会把 `coding-guidelines` 作为受管 instruction contract 检查项，能够报告 missing / drifted 状态

### 主要变化

- instruction file managed block
  - `src/cli/coding-guidelines.js`
- init / clean / doctor 接线
  - `src/cli/commands/init.js`
  - `src/cli/commands/clean.js`
  - `src/cli/commands/doctor.js`
- 回归测试
  - `tests/unit/coding-guidelines.test.js`
  - `tests/unit/using-spec-first-runtime-contracts.test.js`
  - `tests/unit/doctor-json-contract.test.js`
  - `tests/smoke/cli.sh`

### 验证

- `npx jest tests/unit/coding-guidelines.test.js tests/unit/using-spec-first-runtime-contracts.test.js tests/unit/doctor-json-contract.test.js --runInBand`
- `npm run test:smoke`

### 版本意义

这一步的价值不是再加一层 workflow，而是把 instruction file 从“只有语言治理和入口治理”推进到“语言治理 + 入口治理 + 执行姿势治理”三层结构，同时仍保持：

- 轻 contract
- 只管理 marker 包围的内容
- 不接管用户整份 `CLAUDE.md` / `AGENTS.md`

## 2026-04-20 `feat(spec-review-three-axis-verdict)`

### 更新内容

这一步不是把 `spec-code-review` 变成第二个 gating engine，而是在现有 findings / overall verdict 主结构之外，增加一个更便于决策的聚合视图：

- `Requirement Completion`
- `Plan-Diff Fidelity`
- `Code Intrinsic Quality`

同时把 plan source 语义明确分成三类：

- `explicit`：可以进入阻断级判断
- `inferred`：只做 advisory，不单独阻断
- `missing`：只输出可成立的轴，不强行补 `N/A`

### 主要变化

- `spec-code-review` synthesis contract
  - `skills/spec-code-review/SKILL.md`
- review output template
  - `skills/spec-code-review/references/review-output-template.md`
- prompt docs mirror 同步
  - `docs/10-prompt/skills/spec-code-review/SKILL.md`
  - `docs/10-prompt/skills/spec-code-review/references/review-output-template.md`

### 验证

- `npx jest tests/unit/spec-review-contracts.test.js tests/unit/asset-consistency.test.js --runInBand`
- `npm run test:smoke`

### 版本意义

这一步让 review 的决策表达更快、更清楚：

- 需求有没有做完
- diff 是否忠于计划
- 代码本身质量是否过关

仍然保持 findings / severity / route / overall verdict 为主结构，不引入新的强编排状态。

## 2026-04-19 `feat(spec-work-run-artifact-contract)`

### 更新内容

这一步收口的是 `spec-work` 的执行闭环 contract，而不是新增执行器：

- 新增 `docs/contracts/workflows/spec-work-run-artifact.schema.json`
- 明确 `artifact_dir = .spec-first/workflows/spec-work/<slug>/<run-id>/`
- 固定 `run.json` 为唯一 machine truth
- 允许 `closure-summary.md` 作为同一份结构化事实的可读投影
- `spec-code-review` 新增显式 `work_run:<run-id>` / `work_artifact_dir:<path>` handoff 读取规则

这里刻意没有把仓库往更重的 runtime orchestrator 推。当前阶段先把：

- 字段边界
- 写入位置
- 显式 handoff
- 缺失时的降级语义
- consumer 读取范围

这些关键 contract 固定下来，再决定未来是否需要真正的 runtime 写入实现。

### 主要变化

- 新增 workflow contract schema
  - `docs/contracts/workflows/spec-work-run-artifact.schema.json`
- `spec-work` run artifact contract
  - `skills/spec-work/SKILL.md`
  - `skills/spec-work/references/shipping-workflow.md`
- `spec-code-review` upstream handoff contract
  - `skills/spec-code-review/SKILL.md`
- prompt docs mirror 同步
  - `docs/10-prompt/skills/spec-work/SKILL.md`
  - `docs/10-prompt/skills/spec-work/references/shipping-workflow.md`
  - `docs/10-prompt/skills/spec-code-review/SKILL.md`

### 验证

- `npx jest tests/unit/spec-work-contracts.test.js tests/unit/spec-review-contracts.test.js tests/unit/spec-work-run-artifact-contract.test.js tests/unit/runtime-contract-boundary.test.js tests/unit/asset-consistency.test.js --runInBand`
- `npm run test:smoke`

### 版本意义

这一步的价值是把“执行结束后留下什么真相、下游怎么接”讲清楚：

- `spec-work` 不再只靠会话记忆描述收口状态
- `spec-code-review` 可以显式接上游执行闭环上下文，而不是重新猜测
- 仍然遵守 `轻 contract + 明确边界 + 让 LLM 决策`

## 2026-04-19 `feat(sdd-riper-light-contracts-u1-u2)`

### 更新内容

这一步没有把 `sdd-riper` 的 RIPER 状态机搬进来，而是只吸收对当前主链最有价值的两类轻量约束：

- `spec-brainstorm`、`spec-plan`、`spec-work`、`spec-work-beta`、`spec-debug` 在关键节点增加轻量锚点，要求明确当前理解、核心目标、边界和完成证据
- `spec-plan`、`spec-work`、`spec-work-beta`、`spec-code-review` 在 Stage-0 出现 `freshness_stale`、`partial` 或更深降级时，先补读 plan / source / selected assets / 关键代码事实，再继续动作

收口原则保持不变：

- 不新增平行 workflow
- 不新增 `Verification` 之外的平行 done 字段
- 不把 stale/partial 变成硬阻塞
- `spec-work` 只保留 `interactive / non-interactive` 两层 mode 语义

### 主要变化

- workflow anchor contract
  - `skills/spec-brainstorm/SKILL.md`
  - `skills/spec-plan/SKILL.md`
  - `skills/spec-work/SKILL.md`
  - `skills/spec-work-beta/SKILL.md`
  - `skills/spec-debug/SKILL.md`
- freshness-driven reload contract
  - `skills/spec-plan/SKILL.md`
  - `skills/spec-work/SKILL.md`
  - `skills/spec-work-beta/SKILL.md`
  - `skills/spec-code-review/SKILL.md`
- prompt docs mirror 同步
  - `docs/10-prompt/skills/spec-brainstorm/SKILL.md`
  - `docs/10-prompt/skills/spec-plan/SKILL.md`
  - `docs/10-prompt/skills/spec-work/SKILL.md`
  - `docs/10-prompt/skills/spec-work-beta/SKILL.md`
  - `docs/10-prompt/skills/spec-debug/SKILL.md`
  - `docs/10-prompt/skills/spec-code-review/SKILL.md`

### 验证

- `npx jest tests/unit/spec-brainstorm-contracts.test.js tests/unit/spec-plan-contracts.test.js tests/unit/spec-work-contracts.test.js tests/unit/spec-work-beta-contracts.test.js tests/unit/spec-debug-contracts.test.js tests/unit/spec-review-contracts.test.js tests/unit/workflow-stage0-consumption.test.js tests/unit/asset-consistency.test.js --runInBand`
- `bash tests/integration/spec-brainstorm-flow.sh`
- `npm run test:smoke`

### 版本意义

这一步强化的是主链 workflow 的决策输入质量，不是新增编排层：

- 长会话里更容易守住当前目标和边界
- `spec-plan` 的 done 语义更容易被 `spec-work` 直接消费
- stale / partial Stage-0 不再被默认为高可信上下文

仍然遵守 `轻 contract + 明确边界 + 让 LLM 决策`。

> 历史说明补充：以下 2026-04-18 的 benchmark / CRG Quality Gate 小节保留为版本演进记录，但其引用的脚本、测试、workflow 与 benchmark 目录已在当前实现中删除；阅读时请将其视为历史事实，而不是当前仓库仍可执行的操作说明。

## 2026-04-18 `feat(crg-benchmark-contract)`

### 更新内容

这一步不是把质量门做得更重，而是把 benchmark 结果变得“可比较”：

- 每个 benchmark runner 都显式输出
  - `benchmark_contract_version`
  - `analyzer_revision`
  - `input_digest`
- regression gate 会额外判断：
  - 当前结果和 baseline 是否处在同一个 analyzer / 输入集合上
  - 如果不可比，明确返回 `baseline_incompatible`

这解决的是一个长期隐患：

- 之前分数可能变了，但无法区分是“质量退化”
- 还是“analyzer 代码 / benchmark case 集合变了”

### 主要变化

- benchmark metadata helper
  - [benchmark-metadata.js](../../benchmarks/shared/benchmark-metadata.js)
  - 用轻量 digest 生成 `context-routing-evaluator` 的 revision 指纹
- 三个 benchmark runner 补 metadata
  - [run-review-benchmark.js](../../benchmarks/review/run-review-benchmark.js)
  - [run-repo-qa.js](../../benchmarks/repo-qa/run-repo-qa.js)
  - [run-context-efficiency.js](../../benchmarks/context-efficiency/run-context-efficiency.js)
- regression gate 收口 comparability
  - [run-regression.js](../../benchmarks/regression/run-regression.js)
  - [baselines.json](../../benchmarks/regression/baselines.json)
  - [update-crg-baselines.js](../../scripts/update-crg-baselines.js)
- AI dev gate 透传 benchmark 可比性摘要
  - [run-ai-dev-quality-gate.js](../../scripts/run-ai-dev-quality-gate.js)

### 验证

- [regression-gate.test.js](../../tests/unit/regression-gate.test.js)
- [review-benchmark-smoke.test.js](../../tests/unit/review-benchmark-smoke.test.js)
- [repo-qa-benchmark-smoke.test.js](../../tests/unit/repo-qa-benchmark-smoke.test.js)
- [context-efficiency-benchmark-smoke.test.js](../../tests/unit/context-efficiency-benchmark-smoke.test.js)
- [ai-dev-quality-gate.test.js](../../tests/unit/ai-dev-quality-gate.test.js)

### 版本意义

这一步强化的是“benchmark 结果的解释力”，不是 gate 编排能力：

- 让 LLM / 人知道这次结果基于哪个 analyzer revision
- 让 baseline 比较有明确边界
- 保持轻 contract，不扩状态流转

---

## 2026-04-18 `feat(external-benchmark-fixture)`

### 更新内容

这一步补的是 benchmark 的“外部参照物”，不是把 gate 继续做厚：

- 为 review / repo-qa / context-efficiency 增加受控 `demo-store` 与 `wallet-suite` external fixture repo
- benchmark runner 只在 case/question 显式提供 `fixture_repo_root` 时切换输入根目录
- regression baseline 随输入摘要变化同步更新，继续保持“可比较的事实输入”语义

这样做的价值是：

- 不再只在 `spec-first` 自仓库里自证正确
- 给 `cross_community` / `peripheral_to_hub` 这类 CRG 信号调整提供外部样本证据
- 继续把 benchmark 保持在证据层，而不是引入自动下载、自动同步或多状态 gate 编排

### 主要变化

- 外部 fixture repo
  - [demo-store](../../tests/fixtures/benchmarks/demo-store)
  - [wallet-suite](../../tests/fixtures/benchmarks/wallet-suite)
- 三个 benchmark runner 支持可选 fixture 根目录
  - [run-review-benchmark.js](../../benchmarks/review/run-review-benchmark.js)
  - [run-repo-qa.js](../../benchmarks/repo-qa/run-repo-qa.js)
  - [run-context-efficiency.js](../../benchmarks/context-efficiency/run-context-efficiency.js)
- dataset 与 baseline 同步收口
  - [cases.json](../../benchmarks/review/cases.json)
  - [questions.json](../../benchmarks/repo-qa/questions.json)
  - [cases.json](../../benchmarks/context-efficiency/cases.json)
  - [baselines.json](../../benchmarks/regression/baselines.json)

### 验证

- [review-benchmark-smoke.test.js](../../tests/unit/review-benchmark-smoke.test.js)
- [repo-qa-benchmark-smoke.test.js](../../tests/unit/repo-qa-benchmark-smoke.test.js)
- [context-efficiency-benchmark-smoke.test.js](../../tests/unit/context-efficiency-benchmark-smoke.test.js)
- `npm run test:crg:gate`
- `npm run test:ai-dev:gate`

### 版本意义

这一步强化的是“外部可对照性”，不是新的质量门状态：

- benchmark 结果开始有自仓库之外的对照样本
- CRG 调参可以先看证据，再决定是否动默认门控
- 仍然遵守“轻 contract + 明确边界 + 让 LLM 决策”

---

## 2026-04-18 `feat(crg-benchmark-evidence)`

### 更新内容

这一步不是新增 blocker，而是把 PR 上的 benchmark 证据链补完整：

- 当时的 `CRG Quality Gate` workflow 除了 `regression-gate`，还会跑 `benchmark-evidence`
- 当时新增 `test:crg:benchmark-evidence`，把 review / repo-qa / context-efficiency 三类 benchmark 收成一份轻量聚合 artifact
- evidence artifact 只表达 benchmark contract、input digest、summary 与 artifact path，不扩成新的 gate 状态机

### 主要变化

- benchmark evidence runner
  - [run-crg-benchmark-evidence.js](../../scripts/run-crg-benchmark-evidence.js)
- workflow 双轨组合
  - [crg-quality-gate.yml](../../.github/workflows/crg-quality-gate.yml)
  - `regression-gate` 继续负责 blocker
  - `benchmark-evidence` 负责上传 evidence artifact
- package script
  - [package.json](../../package.json)
  - `npm run test:crg:benchmark-evidence`
- 守卫测试
  - [crg-benchmark-evidence.test.js](../../tests/unit/crg-benchmark-evidence.test.js)
  - [ai-dev-quality-gate.test.js](../../tests/unit/ai-dev-quality-gate.test.js)
  - [verification-gate.integration.test.js](../../tests/integration/verification-gate.integration.test.js)

### 验证

- `npx jest tests/unit/crg-benchmark-evidence.test.js tests/unit/ai-dev-quality-gate.test.js tests/integration/verification-gate.integration.test.js --runInBand`
- `npm run test:crg:benchmark-evidence`

### 版本意义

这一步把 PR 里的 benchmark 信号分成两层：

- 需要阻断回退的，继续走 `regression-gate`
- 需要给人和 LLM 看证据的，走 `benchmark-evidence`

仍然遵守“轻 contract + 明确边界 + 让 LLM 决策”，没有把质量门做成多状态流转系统。

---

## 2026-04-18 `fix(crg-flow-signals)`

### 更新内容

这一步针对的不是“让 CRG 更复杂”，而是把当前最会误导 LLM 的 flow 信号先收窄：

- `flows` 的 `criticality` 不再把 `flow 内 is_test 占比` 伪装成测试覆盖缺口
- 安全信号从宽泛关键词改成：
  - 强信号直接命中
  - 弱信号只有在 `auth/security/crypto` 等安全路径语境里才生效
- `flows/context/flow/affected-flows` 相关输出显式补：
  - `entry_confidence`
  - `entry_inference_reason`

目标不是替 LLM 下判断，而是把“这是启发式，不是事实”的边界说清楚。

### 主要变化

- flow scoring 收口
  - [flows.js](../../src/crg/flows.js)
  - 删除伪语义 `test_gap`
  - `criticality` 改为只依赖：
    - `file_spread`
    - `depth_score`
    - `security_score`
    - `external_score`
- 安全信号降噪
  - [constants.js](../../src/crg/constants.js)
  - [changes.js](../../src/crg/changes.js)
  - 普通 `request/http/query` 命名不再默认被抬成安全风险
  - `validate/verify/sign/connect/sql` 等弱信号只有在安全路径语境里才放大
- flow 输出边界显式化
  - [flows.js](../../src/crg/commands/flows.js)
  - [flow.js](../../src/crg/commands/flow.js)
  - [affected-flows.js](../../src/crg/commands/affected-flows.js)
  - [context.js](../../src/crg/cli/context.js)

### 验证

- [crg-flows-scoring.test.js](../../tests/unit/crg-flows-scoring.test.js)
- [crg-changes.test.js](../../tests/unit/crg-changes.test.js)
- [crg-characterization.test.js](../../tests/unit/crg-characterization.test.js)
- [crg-cli-v1.test.js](../../tests/contracts/crg-cli-v1.test.js)
- `bash tests/e2e/crg-all-commands.sh`

### 版本意义

这一步本质上是在给 LLM 更干净、更可解释的 flow 输入：

- 少一点伪覆盖语义
- 少一点 Web 高频词噪声
- 多一点“这是启发式入口”的边界提示

依然遵守：

- 轻 contract
- 明确边界
- 让 LLM 决策

---

## 2026-04-18 `feat(branch-protection-policy-baseline)`

### 更新内容

这一步做的不是“自动配置 GitHub branch protection”，而是先把 branch protection 语义收成 machine-readable 的 advisory policy。

这样系统里第一次有了一个明确的治理真源，回答：

- `main` 分支建议保护哪些 required checks
- 这些 checks 对应哪个 workflow / job / command
- 它们覆盖哪些质量面

但依然坚持边界：

- 不自动修改 GitHub 设置
- 不把 branch protection 变成 runtime 编排状态
- 不发明新的 gate 流转状态机

### 主要变化

- 新增 advisory policy 真源
  - [branch-protection-policy.json](../../src/cli/contracts/quality-gates/branch-protection-policy.json)
  - [branch-protection-policy.schema.json](../../src/cli/contracts/quality-gates/branch-protection-policy.schema.json)
  - 当时表达的 GitHub `main` 分支建议 required checks：
    - `AI Dev Quality Gate`
    - `CRG Quality Gate`
- workflow 触发面补盲（历史）
  - [ai-dev-quality-gate.yml](../../.github/workflows/ai-dev-quality-gate.yml)
  - [crg-quality-gate.yml](../../.github/workflows/crg-quality-gate.yml)
  - 现在会覆盖：
    - quality-gate governance contracts
    - quality-gate schemas
    - workflow 自身文件修改
    - branch protection policy test
- 守卫测试补齐
  - [branch-protection-policy.test.js](../../tests/unit/branch-protection-policy.test.js)
  - [ai-dev-quality-gate.test.js](../../tests/unit/ai-dev-quality-gate.test.js)
  - [verification-gate.integration.test.js](../../tests/integration/verification-gate.integration.test.js)

### 版本意义

这一步完成的是 branch protection 的“治理基线”，不是“宿主自动化编排”：

- 给 LLM / 人更明确的治理输入
- 让 required checks 有机器可读真源
- 但不越界去控制宿主平台或当前任务流转

---

## 2026-04-18 `feat(quality-feedback-loop)`

### 更新内容

这一步补的不是新的 gate 状态，也不是自动回灌编排，而是一个更轻的 feedback bridge：

- `AI Dev Quality Gate` 现在会额外产出
  - `quality-feedback-topics.json`
- `spec-compound` 与 `spec-compound-refresh`
  - 可以把其中的 `candidate_topics` 当作补充输入读取
  - 但不能把它当成 primary truth、自动任务队列或 workflow state

这样做的目标是把高价值失败模式变成更容易被 LLM 检索和复用的输入，同时继续保持：

- 轻 contract
- 明确边界
- 让 LLM 决策

### 主要变化

- 新增被动 feedback artifact
  - [quality-feedback.js](../../src/context-routing/quality-feedback.js)
  - [quality-feedback-topics.schema.json](../../docs/contracts/quality-gates/quality-feedback-topics.schema.json)
  - [run-ai-dev-quality-gate.js](../../scripts/run-ai-dev-quality-gate.js)
  - `AI Dev Quality Gate` 运行后会额外写出：
    - `.spec-first/workflows/quality-gates/ai-dev-quality-gate/quality-feedback-topics.json`
- compound / refresh 只做补充读取
  - [spec-compound/SKILL.md](../../skills/spec-compound/SKILL.md)
  - [spec-compound-refresh/SKILL.md](../../skills/spec-compound-refresh/SKILL.md)
  - [docs/10-prompt/skills/spec-compound/SKILL.md](../../docs/10-prompt/skills/spec-compound/SKILL.md)
  - [docs/10-prompt/skills/spec-compound-refresh/SKILL.md](../../docs/10-prompt/skills/spec-compound-refresh/SKILL.md)
  - 明确要求：
    - 只作为 supplementary hints
    - 不自动触发 `spec:compound-refresh`
    - 不把 gate 失败解释成 workflow 流转状态
- 测试补齐
  - [quality-feedback.test.js](../../tests/unit/quality-feedback.test.js)
  - [spec-compound-contracts.test.js](../../tests/unit/spec-compound-contracts.test.js)
  - [ai-dev-quality-gate.test.js](../../tests/unit/ai-dev-quality-gate.test.js)

### 版本意义

这一步让“验证结果 -> 可复用经验输入”的链路第一次闭合，但闭合方式仍然是被动、可读、可引用的：

- 不自动编排
- 不新增强状态流转
- 不把 quality gate 变成总控状态机

所以它更像是一个让 LLM 做更好判断的事实桥，而不是一个更重的 orchestrator。

---

## 2026-04-18 `feat(runtime-ai-dev-gate-facts)`

### 更新内容

在有了独立 `ai-dev-quality-gate-result` artifact 之后，这一步继续做的不是新增 gate 流程控制，而是把这个 artifact 作为可选顶层事实暴露给 runtime。

这样做的目的很简单：

- 让 workflow / LLM 能读到“最近一次 CI/gate 的事实背景”
- 但不让这个结果反向主导当前任务的编排

因此这一步有两个明确边界：

- `ai_dev_quality_gate_result` 只是被动事实快照
- 多仓 workspace 先保持 `null`，不发明聚合语义

### 主要变化

- runtime 开始暴露最近 gate 结果
  - [quality-gate-result.js](../../src/context-routing/quality-gate-result.js)
  - [workspace-compiler.js](../../src/bootstrap-compiler/workspace-compiler.js)
  - [stage0-context.js](../../src/cli/commands/stage0-context.js)
  - [telemetry.js](../../src/context-routing/telemetry.js)
  - 单仓场景下会读取最近一次：
    - `ai-dev-quality-gate-result.json`
- workspace 边界保持克制
  - [workspace-context.test.js](../../tests/unit/workspace-context.test.js)
  - 多仓 workspace 当前显式返回 `null`
  - 不做 pass/fail 聚合，不做 child 优先级裁决
- workflow 文案同步收口
  - [spec-plan/SKILL.md](../../skills/spec-plan/SKILL.md)
  - [spec-work/SKILL.md](../../skills/spec-work/SKILL.md)
  - [spec-work-beta/SKILL.md](../../skills/spec-work-beta/SKILL.md)
  - [spec-code-review/SKILL.md](../../skills/spec-code-review/SKILL.md)
  - [docs/10-prompt/skills/spec-plan/SKILL.md](../../docs/10-prompt/skills/spec-plan/SKILL.md)
  - [docs/10-prompt/skills/spec-work/SKILL.md](../../docs/10-prompt/skills/spec-work/SKILL.md)
  - [docs/10-prompt/skills/spec-work-beta/SKILL.md](../../docs/10-prompt/skills/spec-work-beta/SKILL.md)
  - [docs/10-prompt/skills/spec-code-review/SKILL.md](../../docs/10-prompt/skills/spec-code-review/SKILL.md)
  - 统一强调：
    - 这是最近 gate 的事实快照
    - 不是 workflow 状态机
    - 不能被解释成自动阻断规则

### 版本意义

这一步让 LLM 拿到更高质量的质量背景输入，但依然保持“轻 contract + 明确边界 + 让 LLM 决策”：

- 有事实
- 无编排
- 无额外状态机

---

## 2026-04-18 `feat(ai-dev-gate-result)`

### 更新内容

在已经接上 `AI Dev Quality Gate` 之后，这一步继续收口的重点不是新增更多 gate 语义，而是把 gate 结果本身变成可消费的 machine-readable artifact。

这里刻意保持边界很窄：

- 结果只回答这次 gate 跑了什么、哪些通过、哪些失败、结果文件在哪
- 不回答下一步该怎么流转
- 不引入 `queued / running / retrying / approved` 这类状态机字段

### 主要变化

- 新增 gate result schema
  - [ai-dev-quality-gate-result.schema.json](../../docs/contracts/quality-gates/ai-dev-quality-gate-result.schema.json)
  - 只包含：
    - `passed`
    - `checks`
    - `failures`
    - `artifact_path`
    - 轻量 summary
- 新增 runner
  - [run-ai-dev-quality-gate.js](../../scripts/run-ai-dev-quality-gate.js)
  - `test:ai-dev:gate` 现在统一由该脚本执行
  - 会写出：
    - `.spec-first/workflows/quality-gates/ai-dev-quality-gate/ai-dev-quality-gate-result.json`
    - Stage-0 contracts suite JSON
    - CRG regression JSON
- workflow 上传结果 artifact
  - [ai-dev-quality-gate.yml](../../.github/workflows/ai-dev-quality-gate.yml)
  - CI 中会把 `.spec-first/workflows/quality-gates/ai-dev-quality-gate/` 整体上传
- 测试补齐
  - [ai-dev-quality-gate.test.js](../../tests/unit/ai-dev-quality-gate.test.js)
  - [verification-gate.integration.test.js](../../tests/integration/verification-gate.integration.test.js)

### 版本意义

这一步的真正价值是：LLM 和人现在都可以基于 gate 的事实结果做判断，而不是只能看 CI 红绿灯或 workflow 文案。

但它仍然只是“被动结果快照”，不是编排状态机。这一点会继续保持。

---

## 2026-04-18 `feat(ai-dev-quality-gate)`

### 更新内容

在补齐 `verification_evidence` 之后，这一步继续推进 Phase D，但仍然坚持轻量边界：先把 CI 可消费入口建立起来，而不是直接在 repo 里硬编码 branch protection 或重型 verifier 自动执行。

这次新增的是：

- 独立 package script：`test:ai-dev:gate`
- 独立 GitHub workflow：`AI Dev Quality Gate`
- 独立 integration guard：锁定 workflow 与 package script 接线

目标是让仓库开始具备一个稳定的 AI-dev quality gate 基线，能自动检查：

- Stage-0 contract 完整性
- verification profile / verifier registry 基线
- workflow verification contract 边界
- CRG regression benchmark

### 主要变化

- 新增 CI-ready gate 入口
  - [package.json](../../package.json)
  - 新增：
    - `test:ai-dev:gate`
  - `test:integration` 现在会先跑：
    - [tests/integration/verification-gate.integration.test.js](../../tests/integration/verification-gate.integration.test.js)
- 新增 GitHub workflow
  - [ai-dev-quality-gate.yml](../../.github/workflows/ai-dev-quality-gate.yml)
  - 只在 Stage-0 / verification contract / workflow contract 相关面变动时触发
  - 运行 `npm run test:ai-dev:gate`
- 现有 CRG gate 同步监听共享 verification contracts
  - [crg-quality-gate.yml](../../.github/workflows/crg-quality-gate.yml)
  - 新增对以下变化面的监听：
    - `src/cli/commands/stage0-context.js`
    - `docs/contracts/spec-graph-bootstrap/**`
    - `docs/contracts/verifiers/**`
- 新增最小 integration 守卫
  - [verification-gate.integration.test.js](../../tests/integration/verification-gate.integration.test.js)
  - 锁定：
    - workflow 名称
    - paths 触发面
    - `npm run test:ai-dev:gate` 接线
    - `crg-quality-gate` 对共享 contract 的监听面

### 版本意义

这一步的意义不是“CI 已经完全替代人工判断”，而是把 Phase D 从“只有 evidence 真源”推进到“CI-ready gate baseline”。

也就是说，仓库现在已经有：

- verification evidence 真源
- verification gate state 真源
- 独立 AI-dev quality gate 入口

但在本轮范围内，真正需要补的主链已经完成：

- branch protection 已先收口为 advisory policy baseline
- optional/required gate 的仓库级强制策略暂不进入本轮范围
- compound / Stage-0 feedback loop 已通过被动 `quality-feedback-topics` bridge 建成轻量闭环

---

## 2026-04-18 `feat(stage0-verification-evidence)`

### 更新内容

这次补的不是新的重型 verifier 编排层，而是 Phase D 的最小前置件：独立 `verification_evidence` contract。

目标很明确：

- 不让 `verification_gate_state` 继续只有空的 `evidence_locations`
- 不把 evidence 再塞回 `verification_summary` 或 `verifier_dispatch`
- 只把“已经拿到的证据引用”作为事实暴露给 workflow / LLM

这符合当前持续收紧的设计原则：

- `verification_summary` 回答当前改动要关注什么
- `verifier_dispatch` 回答有哪些 verifier 候选与 blocker
- `verification_evidence` 回答已经拿到了哪些证据引用
- `verification_gate_state` 回答 gate 现在是 `planned / pending / blocked / satisfied / not-needed` 中的哪一种

### 主要变化

- 新增独立 evidence contract
  - [docs/contracts/verifiers/verification-evidence.schema.json](../../docs/contracts/verifiers/verification-evidence.schema.json)
  - [src/context-routing/verification-evidence.js](../../src/context-routing/verification-evidence.js)
  - contract 只表达：
    - `evidence_ref`
    - `verifier`
    - `gate_ids`
    - `evidence_type`
    - `artifact_path`
    - `captured_at`
    - `status`
- gate state 开始消费真实 evidence reference
  - [src/context-routing/verification-gate-state.js](../../src/context-routing/verification-gate-state.js)
  - [docs/contracts/verifiers/verification-gate-state.schema.json](../../docs/contracts/verifiers/verification-gate-state.schema.json)
  - 有真实 evidence 时：
    - 对应 gate 的 `evidence_locations` 不再为空
    - 对应 gate 状态会变成 `satisfied`
    - `ci_gate.satisfied_required_gate_count` 会按真实证据累计
  - 但如果只满足部分 required gates，整体状态仍保持 `pending`，不伪造“全量已验证”
- runtime / telemetry / workflow 文档同步收口
  - [src/bootstrap-compiler/workspace-compiler.js](../../src/bootstrap-compiler/workspace-compiler.js)
  - [src/cli/commands/stage0-context.js](../../src/cli/commands/stage0-context.js)
  - [src/context-routing/telemetry.js](../../src/context-routing/telemetry.js)
  - [skills/spec-plan/SKILL.md](../../skills/spec-plan/SKILL.md)
  - [skills/spec-work/SKILL.md](../../skills/spec-work/SKILL.md)
  - [skills/spec-work-beta/SKILL.md](../../skills/spec-work-beta/SKILL.md)
  - [skills/spec-code-review/SKILL.md](../../skills/spec-code-review/SKILL.md)
  - [docs/10-prompt/skills/spec-plan/SKILL.md](../../docs/10-prompt/skills/spec-plan/SKILL.md)
  - [docs/10-prompt/skills/spec-work/SKILL.md](../../docs/10-prompt/skills/spec-work/SKILL.md)
  - [docs/10-prompt/skills/spec-work-beta/SKILL.md](../../docs/10-prompt/skills/spec-work-beta/SKILL.md)
  - [docs/10-prompt/skills/spec-code-review/SKILL.md](../../docs/10-prompt/skills/spec-code-review/SKILL.md)
  - workflow 文案现在明确把 `verification_evidence` 当成独立事实层，而不是 dispatch 指令
- 回归测试补齐
  - [tests/unit/verification-evidence.test.js](../../tests/unit/verification-evidence.test.js)
  - [tests/unit/verification-gate-state.test.js](../../tests/unit/verification-gate-state.test.js)
  - [tests/unit/stage0-context-command.test.js](../../tests/unit/stage0-context-command.test.js)
  - [tests/unit/workspace-context.test.js](../../tests/unit/workspace-context.test.js)
  - [tests/unit/workflow-telemetry.test.js](../../tests/unit/workflow-telemetry.test.js)
  - [tests/unit/spec-plan-contracts.test.js](../../tests/unit/spec-plan-contracts.test.js)
  - [tests/unit/spec-work-contracts.test.js](../../tests/unit/spec-work-contracts.test.js)
  - [tests/unit/spec-work-beta-contracts.test.js](../../tests/unit/spec-work-beta-contracts.test.js)
  - [tests/unit/spec-review-contracts.test.js](../../tests/unit/spec-review-contracts.test.js)
  - [tests/unit/workflow-stage0-consumption.test.js](../../tests/unit/workflow-stage0-consumption.test.js)

### 版本意义

这一步不是“自动执行验证”，而是先把验证证据变成 machine-readable 真源。这样后续无论接 CI gate、branch protection，还是把验证经验回灌到 compound，都建立在真实 evidence reference 之上，而不是建立在 workflow 文案或会话文本之上。

---

## 2026-04-18 `fix(stage0-verification-contract-boundaries)`

### 更新内容

在补齐 `verifier_dispatch` 与 `verification_gate_state` 之后，这一轮继续把 runtime contract 收窄成更清晰的三层：

- `verification_summary` 只保留“当前改动事实 + repo baseline”
- `verifier_dispatch` 只保留 verifier 候选、manual gate 与 blocker
- `verification_gate_state` 只保留 gate ledger，不再混入 handoff / dispatch 建议

目标是减少 runtime 帮 workflow/LLM 预先决定“应该怎么走”的倾向，改成只提供更高质量、更低耦合的决策输入。

### 主要变化

- `verification_summary` 不再内联 dispatch posture
  - [src/context-routing/verification-summary.js](../../src/context-routing/verification-summary.js)
  - `plan/work/review` summary 都只输出：
    - verification facts
    - recommended/effective gate lists
    - repo baseline / confidence / fallback
- 顶层统一新增 `verifier_dispatch`
  - [src/bootstrap-compiler/workspace-compiler.js](../../src/bootstrap-compiler/workspace-compiler.js)
  - [src/cli/commands/stage0-context.js](../../src/cli/commands/stage0-context.js)
  - [src/context-routing/telemetry.js](../../src/context-routing/telemetry.js)
  - `compileWorkspaceContext()`、`stage0-context`、workflow telemetry 现在统一输出：
    - `verification_summary`
    - `verifier_dispatch`
    - `verification_gate_state`
- `verification_gate_state` 去掉 `handoff_posture`
  - [src/context-routing/verification-gate-state.js](../../src/context-routing/verification-gate-state.js)
  - [docs/contracts/verifiers/verification-gate-state.schema.json](../../docs/contracts/verifiers/verification-gate-state.schema.json)
  - gate state 只表示：
    - `overall_status`
    - `required_gates`
    - `optional_evidence`
    - `blockers`
    - `ci_gate`
- workflow 文档消费口径同步收敛
  - [skills/spec-plan/SKILL.md](../../skills/spec-plan/SKILL.md)
  - [skills/spec-work/SKILL.md](../../skills/spec-work/SKILL.md)
  - [skills/spec-work-beta/SKILL.md](../../skills/spec-work-beta/SKILL.md)
  - [skills/spec-code-review/SKILL.md](../../skills/spec-code-review/SKILL.md)
  - [docs/10-prompt/skills/spec-plan/SKILL.md](../../docs/10-prompt/skills/spec-plan/SKILL.md)
  - [docs/10-prompt/skills/spec-work/SKILL.md](../../docs/10-prompt/skills/spec-work/SKILL.md)
  - [docs/10-prompt/skills/spec-work-beta/SKILL.md](../../docs/10-prompt/skills/spec-work-beta/SKILL.md)
  - [docs/10-prompt/skills/spec-code-review/SKILL.md](../../docs/10-prompt/skills/spec-code-review/SKILL.md)
  - workflow 统一按：
    - `verification_summary` 读事实与 baseline
    - `verifier_dispatch` 读候选 verifier / blockers
    - `verification_gate_state` 读 pending-vs-blocked ledger
- 回归测试补强
  - [tests/unit/stage0-context-command.test.js](../../tests/unit/stage0-context-command.test.js)
  - [tests/unit/workspace-context.test.js](../../tests/unit/workspace-context.test.js)
  - [tests/unit/workflow-telemetry.test.js](../../tests/unit/workflow-telemetry.test.js)
  - [tests/unit/verification-gate-state.test.js](../../tests/unit/verification-gate-state.test.js)
  - [tests/unit/spec-work-contracts.test.js](../../tests/unit/spec-work-contracts.test.js)
  - [tests/unit/spec-work-beta-contracts.test.js](../../tests/unit/spec-work-beta-contracts.test.js)
  - [tests/unit/spec-review-contracts.test.js](../../tests/unit/spec-review-contracts.test.js)
  - [tests/unit/workflow-stage0-consumption.test.js](../../tests/unit/workflow-stage0-consumption.test.js)

### 版本意义

这次修正不是再加一层 contract，而是把已有 contract 做薄。对后续 AI 辅助开发来说，这能明显减少“状态字段、建议字段、事实字段混在一起”带来的误读，让 workflow 和 LLM 更容易基于事实做自主判断。

---

## 2026-04-18 `feat(stage0-verifier-dispatch-and-gate-state)`

### 更新内容

在已有 `verification-profile` 和 diff-aware `verification_summary` 的基础上，再往前补一层“轻 contract，不替 workflow/LLM 做死决策”的 runtime handoff。现在 Stage-0 不仅会告诉 workflow “这次改动建议验证什么”，还会结构化告诉它：

- 哪些 verifier 是候选项
- 哪些 gate 需要人工兜底
- 哪些前置条件阻塞了 verifier
- 当前 required / optional gate 整体处于 `planned / pending / blocked / not-needed` 的哪种状态

这一步的目标不是把执行顺序硬编码进 runtime，而是把 verifier capability、verifier dispatch 和 gate state 分层表达，让 LLM 有更好的输入去做自主决策。

### 主要变化

- runtime 新增独立 `verifier_dispatch`
  - [src/context-routing/verification-summary.js](../../src/context-routing/verification-summary.js)
  - `work` / `review` / `plan` 场景统一暴露：
    - `handoff_posture`
    - `dispatch_candidates`
    - `manual_required_verifications`
    - `manual_optional_verifications`
    - `dispatch_blockers`
  - `dispatch_candidates` 只表达“有哪些 verifier 候选、当前是 dispatch-ready / manual-handoff / blocked”，不表达固定执行顺序
- verifier registry capability metadata 扩到可用于 dispatch 推断
  - [src/context-routing/verifier-registry.js](../../src/context-routing/verifier-registry.js)
  - [docs/contracts/verifiers/verifier-registry.schema.json](../../docs/contracts/verifiers/verifier-registry.schema.json)
  - 新增能力字段：
    - `supported_gate_kinds`
    - `supported_evidence_types`
    - `availability_checks`
  - 通过 `buildVerifierDispatchPosture()` 把 gate catalog、平台面、宿主前置条件映射成 runtime 候选 verifier / blocker
- 拆出独立 `verification_gate_state` contract
  - [src/context-routing/verification-gate-state.js](../../src/context-routing/verification-gate-state.js)
  - [docs/contracts/verifiers/verification-gate-state.schema.json](../../docs/contracts/verifiers/verification-gate-state.schema.json)
  - 统一输出：
    - `overall_status`
    - `required_gates`
    - `optional_evidence`
    - `blockers`
    - `ci_gate`
  - 每个 gate 都会标明 `status / fulfillment_mode / verifier / expected_evidence`
- runtime 输出链打通
  - [src/bootstrap-compiler/workspace-compiler.js](../../src/bootstrap-compiler/workspace-compiler.js)
  - [src/cli/commands/stage0-context.js](../../src/cli/commands/stage0-context.js)
  - [src/context-routing/telemetry.js](../../src/context-routing/telemetry.js)
  - `compileWorkspaceContext()`、`stage0-context` 与 telemetry record 现在都会带上：
    - `verification_summary`
    - `verifier_dispatch`
    - `verification_gate_state`
- workflow 文档消费口径同步
  - [skills/spec-work/SKILL.md](../../skills/spec-work/SKILL.md)
  - [skills/spec-work-beta/SKILL.md](../../skills/spec-work-beta/SKILL.md)
  - [skills/spec-code-review/SKILL.md](../../skills/spec-code-review/SKILL.md)
  - [docs/10-prompt/skills/spec-work/SKILL.md](../../docs/10-prompt/skills/spec-work/SKILL.md)
  - [docs/10-prompt/skills/spec-work-beta/SKILL.md](../../docs/10-prompt/skills/spec-work-beta/SKILL.md)
  - [docs/10-prompt/skills/spec-code-review/SKILL.md](../../docs/10-prompt/skills/spec-code-review/SKILL.md)
  - workflow 约定改成：
    - 把 `dispatch_candidates` 当成 verifier 候选，不当成强制 dispatch 树
    - 把 `manual_required_verifications` 当成仍需人工处理的 gate
    - 把 `dispatch_blockers` 当成真实前置阻塞项
    - 把 `verification_gate_state` 当成 pending-vs-blocked ledger
- 守卫测试补齐
  - [tests/unit/verifier-registry.test.js](../../tests/unit/verifier-registry.test.js)
  - [tests/unit/verification-gate-state.test.js](../../tests/unit/verification-gate-state.test.js)
  - [tests/unit/spec-work-contracts.test.js](../../tests/unit/spec-work-contracts.test.js)
  - [tests/unit/spec-work-beta-contracts.test.js](../../tests/unit/spec-work-beta-contracts.test.js)
  - [tests/unit/spec-review-contracts.test.js](../../tests/unit/spec-review-contracts.test.js)
  - [tests/unit/workflow-stage0-consumption.test.js](../../tests/unit/workflow-stage0-consumption.test.js)
  - [tests/unit/workflow-telemetry.test.js](../../tests/unit/workflow-telemetry.test.js)
  - [tests/unit/stage0-context-command.test.js](../../tests/unit/stage0-context-command.test.js)

### 保持的边界

- 没有在 runtime 里新增“先跑哪个 verifier、失败后切到哪个 verifier”的硬编码 orchestration
- `verifier_dispatch` 回答的是 capability / readiness / blockers，不是固定 skill dispatch tree
- `verification_gate_state` 先表达 pending / blocked / not-needed，不伪造“已完成”状态
- repo-specific test command 仍然留在 repo 级 contract，不塞进 verifier registry 变成另一套 workflow 编排系统

### 版本意义

这次更新把 Stage-0 verification handoff 从“推荐哪些验证”推进到“把验证决策输入组织得更适合 LLM 使用”：

- `spec-work` 能区分“有 verifier 可接”与“只能人工兜底”的 gate
- `spec-code-review` 能明确看到哪些 verification gap 被 blocker 卡住，而不是只看到一串建议项
- telemetry 和 runtime JSON 对验证状态的描述终于统一，不再分裂成“文档里有、产物里没有”
- 整体依然保持轻 contract，避免过度设计和强耦合，给后续多语言、多端 verifier 扩展留下空间

## 2026-04-18 `feat(verifier-registry-baseline)`

### 更新内容

把现有平台 verifier 的能力描述从 `compile-verification-profile.js` 里的硬编码条件分支收口成一份独立 registry。这样 `verification-profile` 继续负责 repo 级画像，但“有哪些 verifier、覆盖哪些平台、需要什么前置条件、能产出什么证据”开始有单独真源，不再混在 profile 编译器逻辑里。

### 主要变化

- 新增 verifier registry contract 与 runtime helper
  - [docs/contracts/verifiers/verifier-registry.schema.json](../../docs/contracts/verifiers/verifier-registry.schema.json)
  - [src/context-routing/verifier-registry.js](../../src/context-routing/verifier-registry.js)
  - 目前先纳入：
    - `test-browser`
    - `test-xcode`
- `verification-profile` 编译器改为复用 registry-backed hints
  - [src/bootstrap-compiler/compile-verification-profile.js](../../src/bootstrap-compiler/compile-verification-profile.js)
  - `test-browser` / `test-xcode` 不再由 profile 编译器自己手写分支拼装
  - `repo-test-command` 仍保留为 repo-specific dynamic hint，不进入 registry 充当业务命令真源
- skill / docs mirror 补齐 registry metadata
  - [skills/test-browser/SKILL.md](../../skills/test-browser/SKILL.md)
  - [skills/test-xcode/SKILL.md](../../skills/test-xcode/SKILL.md)
  - [docs/10-prompt/skills/test-browser/SKILL.md](../../docs/10-prompt/skills/test-browser/SKILL.md)
  - [docs/10-prompt/skills/test-xcode/SKILL.md](../../docs/10-prompt/skills/test-xcode/SKILL.md)
- 守卫测试补齐
  - [tests/unit/verifier-registry.test.js](../../tests/unit/verifier-registry.test.js)
  - [tests/unit/test-browser-contracts.test.js](../../tests/unit/test-browser-contracts.test.js)
  - [tests/unit/test-xcode-contracts.test.js](../../tests/unit/test-xcode-contracts.test.js)

### 保持的边界

- 本轮没有让 workflow 自动执行 `test-browser` / `test-xcode`
- registry 只回答 verifier capability，不回答 repo-specific command
- `verification-profile` 里的 `verifier_hints` 仍是消费视图，不是 registry 的替身

### 版本意义

这一步把 verification control plane 再拆干净了一层：

- repo profile 负责“仓库默认怎么验证”
- verifier registry 负责“有哪些 verifier 能验证这些平台面”

后续要接 Android / Desktop verifier，或者给 `spec-work/spec-code-review` 做 stage-aware dispatch，就不需要继续往 profile 编译器里堆条件分支。

## 2026-04-18 `feat(stage0-runtime-telemetry-default)`

### 更新内容

把之前只存在于 helper 层的 workflow telemetry 真正接进默认运行链。现在 `stage0-context` 在输出 runtime Stage-0 JSON 的同时，会 best-effort 把本次运行的 telemetry 写到对应 workflow 目录下，而不是再依赖调用方额外拼第二段 telemetry helper。

这一步解决的是：

`Stage-0 runtime consumption -> structured telemetry`

这条链的最后一段。之前 workflow 文案里已经写了“默认写 telemetry”，但实现上仍然停留在“有 helper、没默认接入”；这次把它补成真实闭环。

### 主要变化

- `stage0-context` 默认写 telemetry
  - [src/cli/commands/stage0-context.js](../../src/cli/commands/stage0-context.js)
  - 新增可选 `--workflow <id>`
  - 默认仍按 `stage` 映射：
    - `plan -> spec-plan`
    - `work -> spec-work`
    - `review -> spec-code-review`
  - `spec-work-beta` 显式传 `--workflow spec-work-beta`，避免 telemetry 被误记到 stable `spec-work`
- telemetry record 扩展 runtime 可观测字段
  - [src/context-routing/telemetry.js](../../src/context-routing/telemetry.js)
  - 新增：
    - `level`
    - `verification_summary`
  - 这样 telemetry 不仅知道“选了哪些资产”，也知道“本次 effective verification checklist 是什么”
- workflow source / docs mirror 同步传真实 workflow id
  - [skills/spec-plan/SKILL.md](../../skills/spec-plan/SKILL.md)
  - [skills/spec-work/SKILL.md](../../skills/spec-work/SKILL.md)
  - [skills/spec-work-beta/SKILL.md](../../skills/spec-work-beta/SKILL.md)
  - [skills/spec-code-review/SKILL.md](../../skills/spec-code-review/SKILL.md)
  - [docs/10-prompt/skills/spec-plan/SKILL.md](../../docs/10-prompt/skills/spec-plan/SKILL.md)
  - [docs/10-prompt/skills/spec-work/SKILL.md](../../docs/10-prompt/skills/spec-work/SKILL.md)
  - [docs/10-prompt/skills/spec-work-beta/SKILL.md](../../docs/10-prompt/skills/spec-work-beta/SKILL.md)
  - [docs/10-prompt/skills/spec-code-review/SKILL.md](../../docs/10-prompt/skills/spec-code-review/SKILL.md)
- 守卫测试补齐
  - [tests/unit/stage0-context-command.test.js](../../tests/unit/stage0-context-command.test.js)
  - [tests/unit/workflow-telemetry.test.js](../../tests/unit/workflow-telemetry.test.js)
  - [tests/unit/workflow-stage0-consumption.test.js](../../tests/unit/workflow-stage0-consumption.test.js)
  - [tests/unit/spec-plan-contracts.test.js](../../tests/unit/spec-plan-contracts.test.js)
  - [tests/unit/spec-work-contracts.test.js](../../tests/unit/spec-work-contracts.test.js)
  - [tests/unit/spec-work-beta-contracts.test.js](../../tests/unit/spec-work-beta-contracts.test.js)
  - [tests/unit/spec-review-contracts.test.js](../../tests/unit/spec-review-contracts.test.js)
  - [tests/smoke/cli.sh](../../tests/smoke/cli.sh)

### 保持的边界

- 没有再新增第二个内部 CLI，如 `stage0-telemetry`
- telemetry 仍然是 local runtime artifact，不是新的 tracked source-of-truth
- `stage0-context` 的 JSON 输出 contract 不变，workflow 仍以 evaluator / runtime summary 为真源

### 版本意义

这次更新把 Stage-0 运行时增强从“文档约定 + helper 能力”推进到“默认执行行为 + 可追溯产物”。结果上，`spec-first` 在以下方面更稳了一步：

- `spec-plan/spec-work/spec-work-beta/spec-code-review` 的 Stage-0 预载现在都有真实运行记录
- telemetry 可以直接解释当前运行为什么拿到这组上下文、处于哪个 degrade level、以及本次 verification summary 是什么
- 后续做 status / benchmark / verifier completeness 审查时，不需要再补第二套运行时采样逻辑

## 2026-04-18 `feat(stage0-verification-profile)`

### 更新内容

为 `spec-graph-bootstrap` 的 Stage-0 control plane 增加一份新的 machine-readable contract：`verification-profile.json`，并把其中最小必要的验证摘要接到 `minimal-context` 与 `spec-plan` / `spec-work` / `spec-code-review` / `spec-work-beta` 的统一消费口径上。

这次更新解决的不是“多加几个测试命令提示”，而是把：

`repo facts -> verification profile -> workflow handoff`

这条桥补上。之后 workflow 不再只能泛化地说“自己补测试”，而能基于仓库事实拿到默认验证矩阵、必跑 gate 和补充验证建议。

### 主要变化

- Stage-0 新增 verification profile contract
  - [docs/contracts/spec-graph-bootstrap/verification-profile.schema.json](../../docs/contracts/spec-graph-bootstrap/verification-profile.schema.json)
  - [src/bootstrap-compiler/compile-verification-profile.js](../../src/bootstrap-compiler/compile-verification-profile.js)
  - [src/bootstrap-compiler/schema-loader.js](../../src/bootstrap-compiler/schema-loader.js)
  - 统一输出：
    - `platforms`
    - `languages`
    - `detected_test_frameworks`
    - `required_gates`
    - `optional_gates`
    - `verifier_hints`
    - `environment_prerequisites`
    - `fallback_reason`
- compiler / orchestrator / bootstrap 主链打通
  - [src/bootstrap-compiler/compile-machine-artifacts.js](../../src/bootstrap-compiler/compile-machine-artifacts.js)
  - [src/bootstrap-compiler/orchestrator.js](../../src/bootstrap-compiler/orchestrator.js)
  - [src/bootstrap-compiler/run-bootstrap.js](../../src/bootstrap-compiler/run-bootstrap.js)
  - `runBootstrap()` 现在会稳定写出 `verification-profile.json`
  - `artifact-manifest.json` 也把它视为正式 control-plane output
- minimal-context 暴露 verification summary
  - [src/bootstrap-compiler/compile-minimal-context.js](../../src/bootstrap-compiler/compile-minimal-context.js)
  - [docs/contracts/spec-graph-bootstrap/minimal-context.schema.json](../../docs/contracts/spec-graph-bootstrap/minimal-context.schema.json)
  - `plan` 暴露：
    - `platform_focus`
    - `required_verifications`
  - `work` 暴露：
    - `platform_focus`
    - `required_verifications`
    - `optional_verifications`
  - `review` 暴露：
    - `platform_focus`
    - `verification_gaps_to_check`
- workflow handoff 改为显式消费 verification summary
  - [skills/spec-plan/SKILL.md](../../skills/spec-plan/SKILL.md)
  - [skills/spec-work/SKILL.md](../../skills/spec-work/SKILL.md)
  - [skills/spec-work-beta/SKILL.md](../../skills/spec-work-beta/SKILL.md)
  - [skills/spec-code-review/SKILL.md](../../skills/spec-code-review/SKILL.md)
  - [docs/10-prompt/skills/spec-plan/SKILL.md](../../docs/10-prompt/skills/spec-plan/SKILL.md)
  - [docs/10-prompt/skills/spec-work/SKILL.md](../../docs/10-prompt/skills/spec-work/SKILL.md)
  - [docs/10-prompt/skills/spec-work-beta/SKILL.md](../../docs/10-prompt/skills/spec-work-beta/SKILL.md)
  - [docs/10-prompt/skills/spec-code-review/SKILL.md](../../docs/10-prompt/skills/spec-code-review/SKILL.md)
  - workflow 继续以 `selected_assets / fallback_reason / level / skipped_rules` 为 Stage-0 真源
  - 不允许每个 workflow 自己绕过 evaluator 去直接读取 `verification-profile.json`
- sample / fixture / 合同测试补齐
  - [tests/fixtures/bootstrap/spec-first-bootstrap-sample.js](../../tests/fixtures/bootstrap/spec-first-bootstrap-sample.js)
  - [tests/unit/spec-graph-bootstrap-contracts.test.js](../../tests/unit/spec-graph-bootstrap-contracts.test.js)
  - [tests/unit/spec-graph-bootstrap-compiler.test.js](../../tests/unit/spec-graph-bootstrap-compiler.test.js)
  - [tests/unit/spec-plan-contracts.test.js](../../tests/unit/spec-plan-contracts.test.js)
  - [tests/unit/spec-work-contracts.test.js](../../tests/unit/spec-work-contracts.test.js)
  - [tests/unit/spec-work-beta-contracts.test.js](../../tests/unit/spec-work-beta-contracts.test.js)
  - [tests/unit/spec-review-contracts.test.js](../../tests/unit/spec-review-contracts.test.js)
  - [tests/unit/workflow-stage0-consumption.test.js](../../tests/unit/workflow-stage0-consumption.test.js)

### 保持的边界

- 本轮还没有做 diff-aware 的 `change surface -> required/optional verification recommendation`
- 本轮还没有把 `test-browser` / `test-xcode` 自动编排进 `spec-work`
- `minimal-context` 只暴露 verification summary，不复制整份 profile
- `verification-profile` 仍是 repo 级画像，不是本次改动级 recommendation

### 版本意义

这次更新把“验证”正式提升为 Stage-0 control plane 的第一等事实，而不再只是 workflow prose。结果上，`spec-first` 往“更高质量辅助 AI 开发”的方向前进了一步：

- 计划阶段能看到默认验证矩阵
- 执行阶段能先建立 required gate checklist
- 评审阶段能显式检查 verification gap
- 跨语言、多端扩展以后也有统一的 handoff 落点，而不是为每个平台复制一套 workflow

## 2026-04-18 `feat(change-surface-verification-recommendation)`

### 更新内容

在已有 repo 级 `verification-profile.json` 之上，继续补上“本次改动最少该验证什么”这层桥。现在 `crg review-context` 不再只输出 `affected_nodes`、`candidate_tests` 和 `review_guidance`，还会给出结构化的改动面验证建议。

### 主要变化

- 新增 change-surface helper
  - [src/context-routing/change-surface.js](../../src/context-routing/change-surface.js)
  - 基于 `changedFiles` + repo 级 `verification-profile`
  - 输出：
    - `impacted_modules`
    - `impacted_languages`
    - `impacted_platforms`
    - `recommended_required_verifications`
    - `recommended_optional_verifications`
    - `confidence`
- runtime loader 暴露 verification profile
  - [src/context-routing/loader.js](../../src/context-routing/loader.js)
  - `loadBootstrapRuntimeState()` 现在会一并返回 `verificationProfile`
- `crg review-context` 接上 recommendation 主链
  - [src/crg/commands/review-context.js](../../src/crg/commands/review-context.js)
  - 输出 JSON 中新增 `impacted_*` 与 `recommended_*_verifications`
  - `review_guidance` 中新增：
    - `RECOMMENDED_REQUIRED: ...`
    - `RECOMMENDED_OPTIONAL: ...`
    - `VERIFICATION_CONFIDENCE: ...`
- 测试与 contract 守卫补齐
  - [tests/unit/change-surface.test.js](../../tests/unit/change-surface.test.js)
  - [tests/unit/review-context.test.js](../../tests/unit/review-context.test.js)
  - [tests/contracts/crg-cli-v1.test.js](../../tests/contracts/crg-cli-v1.test.js)
  - [tests/e2e/crg-all-commands.sh](../../tests/e2e/crg-all-commands.sh)

### 保持的边界

- 目前 recommendation 仍建立在 repo 级 `verification-profile` 之上，不是更细粒度的 AST / symbol 级验证图
- docs-only / prompt-only 改动会显式降级，不伪造 required verification
- 这一步还没有把 recommendation 自动下发给 `spec-work` / `spec-code-review` 去执行 verifier，只先把 machine-readable bridge 建起来

### 版本意义

这次更新把系统从“知道仓库理论上有哪些验证方式”推进到“能对当前改动给出最小验证建议”。它对后续两件事直接铺路：

- `spec-work` 基于改动面生成 required gate checklist
- `spec-code-review` 基于改动面检查 verification completeness

## 2026-04-18 `fix(stage0-workspace-runtime-boundaries)`

### 更新内容

把 Stage-0 runtime 在 workspace 场景下的边界重新收紧，避免把“路径推断错误”或“作用域过宽的 baseline”继续下发给 workflow / LLM。当 runtime contract 过重、过宽时，LLM 拿到的不是更强上下文，而是更脏的决策输入；这次修复的目标就是把 contract 收回到稳定边界内。

### 主要变化

- child git repo 默认入口改为优先命中 ancestor workspace
  - [src/context-routing/entry-resolver.js](../../src/context-routing/entry-resolver.js)
  - `resolveStage0Entry()` 现在在无显式 `repoRoots` 时，会先检查 ancestor workspace registry，再决定是否退回 `single-repo`
  - 修复真实 child git repo 从 `cwd` 进入时，被错误短路成 `git-root -> single-repo` 的问题
  - 同时把绝对路径规范化收紧为 canonical realpath，消除 macOS `/var` vs `/private/var` 这类等价路径导致的 child 匹配静默 miss
- explicit multi-repo workspace contract 补齐稳定语义字段
  - [src/bootstrap-compiler/workspace-compiler.js](../../src/bootstrap-compiler/workspace-compiler.js)
  - `workspace-explicit` 路径现在也会稳定输出：
    - `workspace_slug`
    - `matched_child_slugs`
    - `fallback_reason`
    - `level`
  - 让 `stage0-context` 的 JSON 输出与 telemetry 口径一致，不再出现“telemetry 有 workspace 语义、runtime JSON 却丢字段”的分叉
- workspace overview-only 不再伪造 child verification checklist
  - [src/bootstrap-compiler/workspace-compiler.js](../../src/bootstrap-compiler/workspace-compiler.js)
  - 当 runtime 只选中了 workspace overview、未命中任何 child repo 时，`verification_summary` 不再聚合 idle child 的 baseline
  - 保持 contract 轻量：只把当前 selection scope 内真实成立的 verification 信息下发给 workflow
- review-context 自动解析 workspace child 的 profile 锚点
  - [src/context-routing/change-surface.js](../../src/context-routing/change-surface.js)
  - `summarizeChangeSurface()` 现在会在需要时自动解析 workspace child 的 `slug + artifactAnchorRoot`
  - 修复 [src/crg/commands/review-context.js](../../src/crg/commands/review-context.js) 在 workspace child repo 下读不到正确 `verification-profile.json`，从而把 recommendation 静默降成空数组的问题
- 回归测试补齐
  - [tests/unit/stage0-context-command.test.js](../../tests/unit/stage0-context-command.test.js)
  - [tests/unit/workspace-context.test.js](../../tests/unit/workspace-context.test.js)
  - [tests/unit/review-context.test.js](../../tests/unit/review-context.test.js)

### 保持的边界

- 这次修复没有把 runtime contract 再做厚；相反，是把 contract 收紧到“稳定、可解释、和当前 selection scope 一致”的最小集合
- 仍然保留 `verification_summary` / `verification_gate_state` 作为 machine-readable 输入，但不再在 workspace overview-only 场景替 LLM 做过度推断
- verifier 的具体执行策略仍由 workflow / LLM 在拿到更干净的输入后自行决策，不在这个层面硬编码更多分支

### 版本意义

这次修复不是新加功能，而是把已有 Stage-0 runtime contract 从“看起来信息更多”校正成“信息更准、更轻、更可用于决策”：

- workspace child repo 默认入口终于能拿到正确的 child context，而不是错误的单仓 fallback
- workflow 不会再把未选中的 child baseline 当成当前改动的必跑 gate
- `review-context` 在 workspace child repo 下能给出真实的 verification recommendation，而不是静默降级为空

## 2026-04-18 `feat(runtime-verification-summary-consumption)`

### 更新内容

把前一阶段的 `change surface -> verification recommendation` 真正接到 workflow 运行时消费口径。`compileWorkspaceContext()` 现在会为 `work` / `review` 生成一份 runtime `verification_summary`，将“当前改动的 effective checklist”和“仓库级 baseline”分开表达。

这次更新解决的核心问题不是“再加一个 recommendation 字段”，而是让 workflow 真正知道：

`当前这次改动要不要跑这些验证`

而不是在 docs-only / prompt-only 变更里被 repo 级 baseline 误导。

### 主要变化

- runtime verification summary overlay
  - [src/context-routing/verification-summary.js](../../src/context-routing/verification-summary.js)
  - [src/bootstrap-compiler/workspace-compiler.js](../../src/bootstrap-compiler/workspace-compiler.js)
  - `compileWorkspaceContext()` 现在会稳定输出 `verification_summary`
  - `work` 场景输出：
    - `source`
    - `required_verifications`
    - `optional_verifications`
    - `recommended_required_verifications`
    - `recommended_optional_verifications`
    - `repo_required_verifications`
    - `repo_optional_verifications`
  - `review` 场景输出：
    - `source`
    - `verification_gaps_to_check`
    - `recommended_required_verifications`
    - `recommended_optional_verifications`
    - `repo_verification_gaps_to_check`
- workflow contract 改为优先消费 effective runtime summary
  - [skills/spec-work/SKILL.md](../../skills/spec-work/SKILL.md)
  - [skills/spec-work-beta/SKILL.md](../../skills/spec-work-beta/SKILL.md)
  - [skills/spec-code-review/SKILL.md](../../skills/spec-code-review/SKILL.md)
  - [docs/10-prompt/skills/spec-work/SKILL.md](../../docs/10-prompt/skills/spec-work/SKILL.md)
  - [docs/10-prompt/skills/spec-work-beta/SKILL.md](../../docs/10-prompt/skills/spec-work-beta/SKILL.md)
  - [docs/10-prompt/skills/spec-code-review/SKILL.md](../../docs/10-prompt/skills/spec-code-review/SKILL.md)
  - `spec-work` / `spec-work-beta` 以 runtime `verification_summary.required_verifications / optional_verifications` 作为本次运行的 effective checklist
  - `spec-code-review` 以 runtime `verification_summary.verification_gaps_to_check` 作为本次 review 的 effective gap checklist
  - 当 `source === 'change-surface'` 且 effective list 为空时，不得把 `repo_*` baseline 回填成当前改动的必跑项
- 守卫测试补齐
  - [tests/unit/workspace-context.test.js](../../tests/unit/workspace-context.test.js)
  - [tests/unit/spec-work-contracts.test.js](../../tests/unit/spec-work-contracts.test.js)
  - [tests/unit/spec-work-beta-contracts.test.js](../../tests/unit/spec-work-beta-contracts.test.js)
  - [tests/unit/spec-review-contracts.test.js](../../tests/unit/spec-review-contracts.test.js)
  - 新增 workspace 多 repo docs-only 场景守卫，防止后续把 repo baseline 误当成 effective checklist

### 保持的边界

- 目前仍没有自动执行 `test-browser` / `test-xcode` / 语言栈 verifier，只是先把 checklist 正确下发给 workflow
- `repo_required_verifications`、`repo_optional_verifications`、`repo_verification_gaps_to_check` 仍然保留，但它们是 baseline / explainability 字段，不等于当前改动的 effective gate
- recommendation 仍以 changed file surface 为主，不是 AST / symbol 级 verification graph

### 版本意义

现在系统从“能算出 verification recommendation”进一步变成“workflow 真正按 recommendation 工作”：

- `spec-work` 能对本次改动形成有效的 required/optional checklist
- `spec-code-review` 能对本次 diff 形成有效的 verification gap checklist
- docs-only / prompt-only 改动不会再被 repo 级 baseline 污染，减少过度验证与错误 gate

## 2026-04-18 `feat(workflow-stage0-runtime-preload)`

### 更新内容

把 Stage-0 / verification summary 从“workflow 文案要求手工读取 control plane 文件”推进成默认 runtime 注入。现在 `spec-plan`、`spec-work`、`spec-work-beta`、`spec-code-review` 在运行时都会 best-effort 调用内部 CLI `stage0-context`，拿到一份基于 `compileWorkspaceContext()` 的预解析 JSON。

这一步的意义是把“helper 已经存在”推进到“workflow 真正会默认消费”：

- `plan/work/review` 不再只在 SKILL 文本里描述应该怎么读 Stage-0
- runtime 每次执行都会先拿到一份结构化 Stage-0 summary
- 降级时返回 sentinel，不中断主工作流

### 主要变化

- 新增内部 CLI 命令
  - [src/cli/commands/stage0-context.js](../../src/cli/commands/stage0-context.js)
  - [src/cli/index.js](../../src/cli/index.js)
  - `spec-first stage0-context --stage <plan|work|review> --format json`
  - 底层直接调用 [src/bootstrap-compiler/workspace-compiler.js](../../src/bootstrap-compiler/workspace-compiler.js)
  - 对 `work/review` 会 best-effort 推断当前 git diff changed files，优先输出 diff-aware `verification_summary`
- workflow 默认 runtime 注入
  - [skills/spec-plan/SKILL.md](../../skills/spec-plan/SKILL.md)
  - [skills/spec-work/SKILL.md](../../skills/spec-work/SKILL.md)
  - [skills/spec-work-beta/SKILL.md](../../skills/spec-work-beta/SKILL.md)
  - [skills/spec-code-review/SKILL.md](../../skills/spec-code-review/SKILL.md)
  - [docs/10-prompt/skills/spec-plan/SKILL.md](../../docs/10-prompt/skills/spec-plan/SKILL.md)
  - [docs/10-prompt/skills/spec-work/SKILL.md](../../docs/10-prompt/skills/spec-work/SKILL.md)
  - [docs/10-prompt/skills/spec-work-beta/SKILL.md](../../docs/10-prompt/skills/spec-work-beta/SKILL.md)
  - [docs/10-prompt/skills/spec-code-review/SKILL.md](../../docs/10-prompt/skills/spec-code-review/SKILL.md)
  - 四条 workflow 都新增了 `!` command 预载块，默认读取 runtime Stage-0 JSON
  - 若命令不可用，则返回 `__SPEC_FIRST_STAGE0_CONTEXT_UNAVAILABLE__` 并继续按原 contract 降级，不阻断执行
- 守卫测试补齐
  - [tests/unit/stage0-context-command.test.js](../../tests/unit/stage0-context-command.test.js)
  - [tests/unit/spec-plan-contracts.test.js](../../tests/unit/spec-plan-contracts.test.js)
  - [tests/unit/spec-work-contracts.test.js](../../tests/unit/spec-work-contracts.test.js)
  - [tests/unit/spec-work-beta-contracts.test.js](../../tests/unit/spec-work-beta-contracts.test.js)
  - [tests/unit/spec-review-contracts.test.js](../../tests/unit/spec-review-contracts.test.js)
  - [tests/unit/workflow-stage0-consumption.test.js](../../tests/unit/workflow-stage0-consumption.test.js)
  - [tests/smoke/cli.sh](../../tests/smoke/cli.sh)

### 保持的边界

- `stage0-context` 是内部 runtime helper，不是新的用户工作流入口
- 本轮仍未自动执行平台 verifier；只负责把正确的 Stage-0 / verification summary 注入工作流上下文
- 无法推断 git diff 时，继续回退到 repo 级 Stage-0 baseline，而不是伪造 diff-aware recommendation

### 版本意义

这次更新把 Stage-0 主链从“有 compiler、有 evaluator、有 helper”推进到“默认运行时真消费”：

- AI 在 `plan/work/review` 开始前就能拿到结构化 Stage-0 JSON
- `verification_summary` 从 contract 字段真正变成 runtime context
- 后续无论是 verifier 自动调度还是 telemetry 默认接线，都有了一个稳定的 runtime 注入点

## 2026-04-18 `feat(using-spec-first-sessionstart-bootstrap)`

### 更新内容

`using-spec-first` 从“仅有 runtime skill 安装”升级为真正的宿主级入口治理层：

- Claude 现在会在项目内安装 repo-root instruction bootstrap、`.claude/hooks/session-start` 与受管 `.claude/settings.json` matcher
- Codex 现在会在 `AGENTS.md` 中写入对应的 instruction bootstrap，但不会伪造不存在的 hook 机制
- `init / doctor / clean` 三条主链同时认识这批新资产，形成最小可用的生命周期闭环

### 主要变化

- 双宿主 instruction bootstrap
  - 新增 `src/cli/instruction-bootstrap.js`
  - 在 `CLAUDE.md` / `AGENTS.md` 中幂等维护 `<!-- spec-first:bootstrap:* -->` 区块
  - block 只保留轻量入口治理提示，不复制完整 workflow 决策树
- Claude SessionStart 最小闭环
  - 新增 `templates/claude/hooks/session-start`
  - 新增 `src/cli/claude-settings.js`
  - 在项目 `.claude/settings.json` 写入受管 SessionStart matcher（`startup|resume|clear|compact`）与对应 `hooks` 入口
- `init / doctor / clean` 接入
  - `src/cli/commands/init.js` 首装路径前置 settings preflight，非法时立刻报错且不创建 `.claude/commands/spec`
  - `src/cli/commands/doctor.js` 识别 bootstrap 块与 hook 安装状态
  - `src/cli/commands/clean.js` 能按受管模式清理 bootstrap/hook/settings 副本
- 回归守卫
  - 新增 `tests/unit/instruction-bootstrap.test.js`、`tests/unit/claude-settings.test.js`
  - 扩展 `tests/unit/using-spec-first-runtime-contracts.test.js` 与 `tests/smoke/cli.sh` 断言受管 SessionStart matcher 与 hook 文件

### 保持的边界

- 不为 Codex 伪造 hook 机制
- 不强制把 workflow 决策树灌入 `CLAUDE.md`/`AGENTS.md`
- 不改变 runtime skill discovery 与双宿主治理 contract

### 版本意义

`using-spec-first` 的安装、诊断、清理首次形成最小可用闭环；仓库也把"哪些文件由 spec-first 管理、可以安全覆写"这条边界在 hook / settings 层落了实。

---

## 2026-04-17 `fix(release-gate-hardening)`

### 更新内容

继续收口双宿主治理发布链路的最后两个遗漏点：默认 `test:release` 不能只跑专项 smoke，治理专项 smoke 也不能只断言新真源存在而放过旧真源回流。

### 主要变化

- release 总门禁恢复完整覆盖
  - [package.json](../../package.json) 中默认 `npm run test:release`
  - 现在串联：
    - `npm run test:release:governance`
    - `npm run test:release:install`
  - 这样双宿主治理专项验证和既有 `install-tarball.sh` 完整安装回归重新回到同一个默认发布门禁
- 治理专项 smoke 增加负向断言
  - [tests/smoke/release-dual-host-governance.sh](../../tests/smoke/release-dual-host-governance.sh)
  - 除继续断言 tarball 必须包含：
    - `package/src/cli/contracts/dual-host-governance/skills-governance.json`
    - `package/src/cli/contracts/dual-host-governance/skills-governance.schema.json`
  - 现在还显式阻断 tarball 再次包含：
    - `package/docs/contracts/dual-host-governance/skills-governance.json`
    - `package/docs/contracts/dual-host-governance/skills-governance.schema.json`
- 回归守卫同步补强
  - [tests/unit/dual-host-governance-contracts.test.js](../../tests/unit/dual-host-governance-contracts.test.js)
  - 新增默认 release gate 组合脚本断言，并冻结治理专项 smoke 对 docs-side machine-readable assets 的负向检查要求
- 安装回归脚本健壮性修复
  - [tests/smoke/install-tarball.sh](../../tests/smoke/install-tarball.sh)
  - 修复未知 `tree-sitter` 包分支中 `$pkg` 紧跟全角括号触发 `set -u` 的变量展开错误，确保完整 tarball 安装回归能稳定跑完

### 版本意义

这次不是新增产品能力，而是把“发布链路已修复”从局部正确收口成完整正确。现在默认 release gate 同时防两类回归：

- 新 runtime 真源没有进入 tarball
- 旧 docs-side machine-readable 真源重新混入 tarball

这样后续继续调整双宿主治理 contract 时，发布前能同时看住“该有的文件在”和“不该有的文件不在”。

---

## 2026-04-17 `feat(spec-brainstorm-capability-upgrade)`

### 更新内容

围绕 `spec-brainstorm` 做一次流程纪律升级，把此前“已追平 `ce-brainstorm`、但仍缺少 superpowers 式 guardrails”的状态，收口为可回归的 workflow contract。

### 主要变化

- `spec-brainstorm` 主流程升级
  - [skills/spec-brainstorm/SKILL.md](../../skills/spec-brainstorm/SKILL.md)
  - 新增：
    - `0.1a Current Work Pulse`
    - `0.3a Scope Decomposition`
    - `3.4 Preflight Self-Check`
    - `3.6 User Review Gate`
    - `Phase 4: Handoff and Terminal State Lock`
  - 明确 HARD-GATE 与“简单需求也不能跳过对齐”的反模式声明
- brainstorm reference 收口
  - [skills/spec-brainstorm/references/requirements-capture.md](../../skills/spec-brainstorm/references/requirements-capture.md)
  - [skills/spec-brainstorm/references/decomposition-capture.md](../../skills/spec-brainstorm/references/decomposition-capture.md)
  - [skills/spec-brainstorm/references/handoff.md](../../skills/spec-brainstorm/references/handoff.md)
  - 新增 epic decomposition 文档模板
  - requirements capture 增加分节确认、design-for-isolation、targeted improvements、preflight 检查与 `epic` frontmatter contract
  - handoff 增加 Terminal State Lock 三层模型、escape hatch 与 Proof 边界
- `spec-plan` 补 epic consumer prompt contract
  - [skills/spec-plan/SKILL.md](../../skills/spec-plan/SKILL.md)
  - 当 requirements doc frontmatter 存在 `epic` 时，planning 会按 `docs/brainstorms/*-<epic>-decomposition.md` 读取补充上下文
  - epic doc 缺失时只 warning + continue，不阻断 planning
  - 本轮仍不把 epic consumer 下放到 `spec-work`
- 测试与默认入口
  - [tests/unit/spec-brainstorm-contracts.test.js](../../tests/unit/spec-brainstorm-contracts.test.js)
  - [tests/unit/spec-plan-contracts.test.js](../../tests/unit/spec-plan-contracts.test.js)
  - [tests/smoke/cli.sh](../../tests/smoke/cli.sh)
  - [tests/integration/spec-brainstorm-flow.sh](../../tests/integration/spec-brainstorm-flow.sh)
  - [tests/integration/e2e.sh](../../tests/integration/e2e.sh)
  - smoke 现在显式验证 `decomposition-capture.md` 已进入 Claude/Codex runtime
  - integration 默认入口现在会独立调用 `spec-brainstorm-flow.sh` 做确定性 wiring check
- prompt mirror 同步
  - `docs/10-prompt/skills/spec-brainstorm/`
  - `docs/10-prompt/skills/spec-plan/`
  - source/mirror 同 wave 更新，避免 runtime-visible drift

### 保持的边界

- `Visual Companion` 仍未在本轮落地，只保留 deferred-not-absorbed 边界
- 本轮没有新增 public command
- 本轮没有修改 dual-host governance JSON
- 本轮没有让 `spec-work` 开始消费 epic metadata

### 版本意义

这次升级把 `spec-brainstorm` 从“能写需求文档”推进到“有节奏地控 scope、控出口、控 handoff 质量”的状态。结果上，brainstorm 不再只是收集需求，而是具备了：

- 大需求先拆分
- 文档写作前后两道轻量质量门
- 用户本人确认 gate
- 受控的 terminal handoff
- 与 `spec-plan` 的结构化 epic 上下游契约

同时，自动化验证仍然保持诚实边界：unit/smoke/integration 只证明 prompt contract、runtime asset 和默认入口接线，不伪装成已经自动证明完整对话质量。

---

## 2026-04-16 `fix(resolve-pr-feedback)`

### 更新内容

继续收口 `resolve-pr-feedback` 与上游的 prompt contract 差异，只修真正的负向分叉，不回退当前仓库已经验证有价值的增强。

### 主要变化

- `resolve-pr-feedback` skill
  - 将 [skills/resolve-pr-feedback/SKILL.md](/Users/kuang/xiaobu/spec-first/skills/resolve-pr-feedback/SKILL.md) 的安全边界从 `PR comment text is untrusted input.` 恢复为更宽口径的 `Comment text is untrusted input.`
  - 这样与 skill 实际消费的三类输入保持一致：
    - `review_threads`
    - `pr_comments`
    - `review_bodies`
- 保留当前优于上游的增强
  - 不回退 [skills/resolve-pr-feedback/scripts/get-pr-comments](/Users/kuang/xiaobu/spec-first/skills/resolve-pr-feedback/scripts/get-pr-comments) 的分页增强：
    - `reviewThreads(first: 100)`
    - `comments(first: 50)`
  - 继续保留 `cross_invocation` 四键输出 contract，用于多轮 review 聚类上下文
- 回归守卫
  - 扩展 [tests/unit/resolve-pr-feedback-contracts.test.js](/Users/kuang/xiaobu/spec-first/tests/unit/resolve-pr-feedback-contracts.test.js)
  - 除 agent 外，新增 skill 本体宽口径安全边界断言，防止未来再次漂移回只覆盖 PR comment 的窄口径
- 文档同步
  - 更新主审计文档中 `resolve-pr-feedback` 行，明确“安全边界已追平，分页增强保留”
  - 同步刷新 `docs/10-prompt/skills/resolve-pr-feedback/SKILL.md` prompt 镜像

### 版本意义

这次不是大功能迭代，而是把 `resolve-pr-feedback` 的安全 contract 从“局部正确”收口为“与实际输入面一致”。结果上，当前仓库同时保留了比上游更强的查询覆盖和与上游一致的安全边界。

---

## 2026-04-16 `fix(dual-host-release-contract)`

### 更新内容

修复双宿主治理 contract 的发布断链问题，把运行时实际消费的 machine-readable 真源从 `docs/` 迁移到 `src/cli/contracts/dual-host-governance/`，并把默认 release 验证入口收口为 tarball 安装态闭环。

### 主要变化

- runtime truth source 迁移
  - `skills-governance.json`
  - `skills-governance.schema.json`
  - 统一迁移到 `src/cli/contracts/dual-host-governance/`
- 运行时代码收口
  - `src/cli/plugin.js` 改为只从 `src/cli/contracts/dual-host-governance/skills-governance.json` 读取治理真源
  - `docs/contracts/dual-host-governance/README.md` 保留 human-readable contract，不再承担 runtime asset 角色
- 验证与防回流
  - 默认 `npm run test:release` 改为聚焦双宿主治理 tarball 验证
  - 新增 runtime/docs 边界单测，禁止 `src/cli/` 再次直接依赖 docs-side machine-readable contract
  - `skills-governance` contract test 显式锁定 `getSkillsGovernancePath()` 的新落位

### 版本意义

这次修复解决的不是产品面文案，而是安装态闭环。现在源码态、tarball 内容和安装后 CLI 运行态重新指向同一份治理真源，后续再改双宿主分发逻辑时，不会出现“本地源码可跑、发布包缺文件”的结构性断链。

## 2026-04-16 `docs(audit-consistency)`

### 更新内容

继续收口主审计文档的统计口径，解决“总表是对的，但摘要段与最终判定还残留旧数字和旧结论”的问题。

### 主要变化

- 主审计文档
  - 修正 `agent` 完全一致数量：`34` → `38`
  - 删除把 `ce-update`、`ce-debug`、`ce-optimize`、`ce-sessions`、`ce-slack-research` 误判为“上游独有”的旧结论
  - 将真正仍属上游独有的内容收口为：
    - repo-owned `dhh-rails-style` skill
    - 多目标 plugin 同步/转换平台
    - `scripts/release/*.ts` 发布子系统
- Skill 全量映射表
  - 补齐漏掉的 `dhh-rails-style` 行，显式标记为 `仅上游存在`
  - 说明当前仓库已不保留 repo-owned skill 源码，仅在 `best-practices-researcher` 的 Rails/Ruby curated mapping 中保留 discoverability
- 统计口径
  - 明确 `Agent 全量映射表` 与总览里的 `49 / 57` 只统计 `agents/**/*.md`
  - `agents/research/session-history-scripts/` 下的 4 个 helper scripts 不计入 agent 数，避免和 markdown agent 混算
- 可读性
  - 在 skill / agent 字段说明里补充“`代码修复状态 = 已完成` 不等于字节级一致”，降低“有差异但已完成”带来的阅读歧义

### 版本意义

这次更新不涉及新功能，而是把主审计文档从“局部正确”收口为“摘要、总表、最终判定三层一致”。后续再据此做 skill/agent 追平决策时，统计口径不会再误导优先级判断。

## 2026-04-16 `fix(agent-audit-governance)`

### 更新内容

继续收口 agent 侧治理和审计口径，解决“统计数字不一致”和“差异存在但并不等于待修复”这两类容易误导后续判断的问题。

### 主要变化

- 主审计文档
  - 修正最终判定段里 `直接对应但有差异 agent` 的数量，从 `12` 收口为与前文一致的 `11`
  - 给“不一致 Agent 列表”补充 `差异性质` 字段，显式区分：
    - `宿主策略分叉`
    - `命名/中性化保留`
    - `spec-only 增量`
- 双宿主模型治理
  - 在 `docs/contracts/dual-host-governance/README.md` 中把 `workflow/lint` 纳入固定模型例外
  - 依据是 [agents/workflow/lint.md](/Users/kuang/xiaobu/spec-first/agents/workflow/lint.md) 的真实职责：围绕 `standardrb`、`erblint`、`brakeman` 做低成本工具编排与结果归纳
- 回归守卫
  - 新增 `tests/unit/agent-audit-contracts.test.js`
  - 扩展 `tests/unit/agent-model-governance-contracts.test.js`

### 版本意义

这次修复解决的是“审计怎么看”和“治理怎么落”之间的最后一层缝隙。现在主审计表不会再把 intentional divergence 和待修复缺口混为一谈，固定模型 agent 的治理边界也从单点特例扩展成了更完整的规则集合。

## 2026-04-16 `fix(agent-tail-optimization)`

### 更新内容

对上一轮 agent 审查收尾阶段识别出来的 4 个尾项做一次代码级收口，不追求机械回退上游，而是按当前仓库真实运行面和治理面做更优解。

### 主要变化

- `learnings-researcher`
  - 保留 `critical-patterns` 可选读取与 `applies_when` 双轨 schema 支持
  - 把 schema reference 与 planning handoff 从硬编码路径 / command 名，收口为 project-neutral wording
- `best-practices-researcher`
  - 保留 `dhh-rails-style` / `andrew-kane-gem-writer` / `dspy-ruby` 的 Ruby/Rails curated discovery
  - 将 `Documentation` 映射从 `spec:compound` 调整为真实 skill 标识 `spec-compound`
- `pr-comment-resolver`
  - 补齐最后一处 `cross-invocation cluster` 排版差异
  - 当前与上游同路径 agent 正文重新对齐
- `dual-host-governance`
  - 在 `Agent 模型选择 Contract` 中补充“固定模型例外”闭环
  - 先纳入 `coherence-reviewer`，依据 `spec-doc-review` 的 always-on 调度关系与 `model: haiku` frontmatter 固化
- 审计 / 回归
  - 更新 `Agent 全量映射表`、不一致 agent 统计与 3 份专项分析文档
  - 新增 / 扩展 4 组 contract tests，并与 `spec-compound`、`spec-doc-review` 回归一起验证

### 版本意义

这批收尾不是补大功能，而是把“看起来只差一点”的尾项收成可长期维护的治理状态。结果上，agent 侧少了一条无意义 byte diff，多了一条有证据的固定模型例外规则，剩余 intentional divergence 也从“口头说明”变成了可回归的 contract。

## 2026-04-16 `feat(skill-boundaries)`

### 更新内容

围绕 4 个 `spec-only` skill 做一次“不是补功能，而是收边界”的专项治理，解决它们在当前仓库里最容易持续漂移的点：职责分层不够显式、近邻 skill 关系靠人记忆、完成态缺少 contract 证据。

### 主要变化

- `agent-browser`
  - 深审确认其定位应保持为 browser substrate，而不是并入 `test-browser`、`feature-video` 或 `reproduce-bug`
  - 审计表回写为“深审复核通过”，继续以现有 `agent-browser-contracts.test.js` 作为稳定接口守护
- `orchestrating-swarms`
  - 在 `skills/orchestrating-swarms/SKILL.md` 顶部新增宿主边界声明，明确它是 Claude Code host-specific orchestration guide
  - 在 `skills/spec-work/SKILL.md` 和 `skills/spec-work-beta/SKILL.md` 的 Swarm Mode 小节补显式路由：需要 `Teammate(...)` / inbox / persistent teammate 时，转到 `orchestrating-swarms`
  - 新增 `tests/unit/orchestrating-swarms-contracts.test.js`
- `rclone`
  - 在 `skills/rclone/SKILL.md` 补 transport boundary，明确它不替代 `deploy-docs` 与 `feature-video`
  - 把 `skills/rclone/scripts/check_setup.sh` 提升为主 setup check 入口，并补 `sync` 删除远端文件的显式风险提示
  - 新增 `tests/unit/rclone-contracts.test.js`
- `reproduce-bug`
  - 在 `skills/reproduce-bug/SKILL.md` 补 issue-grounded entrypoint 边界，明确新建 issue 用 `/report-bug`，进入完整 debug/fix 用 `spec-debug`
  - 调整 close-out 选项，把“继续修复”改成显式 handoff 到 `spec-debug`
  - 新增 `tests/unit/reproduce-bug-contracts.test.js`
- 审计治理
  - `docs/业界分析/9.spec-first-vs-compound-engineering-plugin-全量同步审计-2026-04-14.md`
  - 4 个目标 skill 的 `代码修复状态` 已回写为完成态，并记录各自的分层结论

### 版本意义

这批改动提升的不是功能广度，而是控制面的可维护性。现在仓库里这 4 个 `spec-only` skill 的职责层级更清楚了：`agent-browser` 是底层浏览器执行面，`orchestrating-swarms` 是 Claude-host team orchestration，`rclone` 是通用远端传输，`reproduce-bug` 是 issue-grounded 调查入口。后续如果发生漂移，新的 contract tests 会第一时间把它打出来。

## 2026-04-16 `feat(source-only-skill-parity)`

### 更新内容

完成对上游 `compound-engineering-plugin` 中 6 个 source-only skill 的能力补齐，并按 `spec-first` 的 Claude/Codex 双宿主分发模型做本地化落地，而不是机械照搬上游 marketplace / cache 假设。

### 主要变化

- 新增命令型 workflow
  - 新增 `skills/spec-debug/` 与 `templates/claude/commands/spec/debug.md`
  - 新增 `skills/spec-update/` 与 `templates/claude/commands/spec/update.md`
  - `.claude-plugin/plugin.json` 新增 `debug` / `update` / `setup` 接线，Claude/Codex runtime smoke 一并覆盖
- source-only skill 追平
  - `ce-optimize` -> `skills/spec-optimize/`
  - `ce-slack-research` -> `skills/spec-slack-research/` + `agents/research/slack-researcher.md`
  - `ce-sessions` 继续落在 `skills/spec-sessions/`，并补齐 `agents/research/session-history-scripts/extract-skeleton.py` 的 Cursor transcript 解析一致性
  - `ce-demo-reel` 能力并入 `skills/feature-video/`，形成“分层证据采集 + GitHub 原生视频上传”双模式
- 验证与打包守卫
  - 新增 `spec-debug`、`spec-update`、`spec-optimize`、`spec-slack-research`、`feature-video`、`session-history-scripts` 合同测试
  - `tests/smoke/cli.sh` 明确断言新命令、新 skill、agent 与 evidence assets 已进入 Claude/Codex runtime 与 `npm pack`

### 审查期补充修复

- `spec-update`
  - `Current CLI version` 探测改为 `spec-first --version` 优先，失败时在 `spec-first` 源码仓库内 fallback 到 `node bin/spec-first.js --version`
  - `CLI availability gate` 只有在 PATH 与 repo-local source checkout 两路探测都失败时才建议 `npm install -g spec-first@latest`
  - `tests/unit/spec-update-contracts.test.js` 新增源码直跑场景守卫，防止后续回归到“只认全局安装”

### 版本意义

这批补齐解决的是“核心 workflow 已同步，但用户可感知入口仍有缺口”的问题。现在 `spec-first` 在不引入上游多宿主插件平台的前提下，已经具备等价的 debug、update、optimization、sessions、Slack research 和 demo evidence 闭环。

## 2026-04-16 `test(exact-same-skill-parity)`

### 更新内容

对 5 个在源码层已经与上游保持一致、但审计表仍标记为 `未开始` 的 skill 做完成态收口。

### 主要变化

- 上游代码事实核对
  - `agent-native-architecture`
  - `andrew-kane-gem-writer`
  - `dspy-ruby`
  - `git-clean-gone-branches`
  - 以上 4 个 skill 执行目录级 `diff -qr` 均无差异
  - `gemini-imagegen` 也与上游源码一致，唯一差异为当前工作区存在未跟踪 `__pycache__/`，不属于源码能力差异
- contract freeze
  - 新增 5 个专项守卫测试
  - 覆盖 skill identity、核心能力锚点、Claude/Codex runtime transform、脚本/asset/reference 存在性与关键语义
- 审计与治理收口
  - `Skill 全量映射表` 中上述 5 个 skill 的 `代码修复状态` 已更新为完成态
  - 新增专项归档文档，记录“无需再改 skill 正文，只需冻结 contract”的结论

### 版本意义

这批工作解决的不是功能缺失，而是“已追平能力没有被证据化”的维护风险。现在这 5 个 skill 的完成态有了明确的上游核对依据和本地回归守卫，后续若发生漂移，可以被单测直接发现。

## 2026-04-15 `feat(spec-graph-bootstrap+crg)`

### 更新内容

围绕 `spec-graph-bootstrap` 与 `src/crg` 完成 Stage-0 后续能力闭环，把此前只覆盖 `P0` 的最小消费链，扩展为可迭代的 machine-first context platform。

### 主要变化

- `minimal-context`
  - 补齐 `plan.json`、`work.json`
  - `review/plan/work` 三类 workflow 都有明确的 machine-first task card
- retrieval / indexing
  - 新增 hybrid retrieval v1：`seed -> expand -> rerank -> pack`
  - 引入 AST-aware chunking v1，并让 retrieval 可返回 chunk 级上下文
  - 支持 optional semantic rerank，默认不破坏 lexical + graph 主链
- Stage-0 compiler / governance
  - 新增 `freshness / lint / contradictions`
  - 拆分 compiler：machine artifacts、human assets、routing 三层
  - 新增 ownership / review queue 治理能力
- benchmark / regression
  - 新增 `repo-qa`、`context-efficiency`、`regression gate`
  - `workflow telemetry` 记录 selected assets / skipped rules / fallback reason / freshness status
- workspace
  - 支持跨 repo workspace context 聚合与优雅降级

### 版本意义

这次更新的核心不是“再多产一些文档”，而是把 Stage-0 从一次性 bootstrap 输出，推进成一个可验证、可回归、可治理、可跨仓库扩展的上下文分发底座。后续无论是 `spec-plan`、`spec-work`、`spec-code-review`，还是更高层的 benchmark/regression 演进，都有了统一的 machine-first contract 和最小实现骨架。

---

## 2026-04-15 `fix(managed-state-upgrade)`

### 更新内容

统一 `doctor / init / clean` 对 legacy managed state 的处理语义，并同步更新 README 与用户手册，避免用户从不同文档读到相互冲突的升级路径。

### 主要变化

- `doctor`
  - 若发现旧版 `state.json` 形状，会明确报告 `legacy managed state detected`
  - 修复建议统一收敛到重新执行 `spec-first init --claude|--codex`
- `init`
  - 成为唯一支持的 legacy 升级入口
  - 检测到 legacy state 时，先执行 managed hard reset，再按当前版本全量重建运行时
- `clean`
  - 只删除当前受管集合
  - 保留未受管的自定义 skills / agents
  - 不再承担 legacy 迁移职责
- 文档
  - README、快速开始、核心概念、FAQ、本地源码安装指南全部同步到同一口径
  - 修正 Claude workflow skill 实际目录为 `.claude/spec-first/workflows/`
  - 修正当前运行时数量说明为 `45` 个 skills、`54` 个 agents、`4` 个 agent support files

### 版本意义

这次更新解决的不是单条命令行为，而是用户升级路径的认知分叉问题。当前口径非常明确：看到 legacy state，不要手工清目录，不要先跑 `clean`，直接重新运行 `init`。这样既能保证 hard-cut 升级一致性，也能最大程度保护用户自定义运行时资产。

---

## 2026-04-15 `feat(spec-brainstorm)`

### 更新内容

`spec-brainstorm` 完成对上游 `ce-brainstorm` 非 Slack 核心能力的同步，并在 `spec-first` 当前产品边界内新增 supplemental context 路由能力。

### 主要变化

- 同步上游 brainstorm 核心能力
  - 非软件任务分流
  - 先问用户已有想法
  - 至少一个非显然角度
  - 先展示方案，再给推荐
  - requirements visual communication guidance
- 新增 supplemental context adapters
  - `local-doc-reader`
  - `github-context-reader`
  - `docs-context-reader`
  - `web-context-reader`
- 新增 references
  - `skills/spec-brainstorm/references/universal-brainstorming.md`
  - `skills/spec-brainstorm/references/visual-communication.md`
- contract 收口
  - supplemental context 改为 `opt-in / source-driven`
  - 冻结 `research digest.status` 枚举
  - 明确 `find-skills` 只是 environment-optional fallback
  - 锁定 Claude / Codex 双宿主 runtime 命名与 agent 引用适配差异
- 测试与打包守卫
  - 新增 `tests/unit/spec-brainstorm-contracts.test.js`
  - smoke 覆盖新 references、new research agents 和 runtime transform 结果

### 版本意义

这次更新把 `spec-brainstorm` 从“只读 repo 内上下文”的基础态，升级成“可显式接入外部上下文”的增强态，但仍保持 `spec-first` 当前边界：不引入 Slack、不新增 public command、不假设所有外部工具默认存在。这样后续 brainstorm 可以在不破坏 Claude/Codex 双宿主分发模型的前提下，稳定消费本地文档、飞书、GitHub、网页和文档链接上下文。

---

## 2026-04-14 `feat(compound-core-workflows)`

### 更新内容

完成 `compound-engineering-plugin` 核心工作流同步计划的批次 B-D，实现从“只完成批次 A”升级到“核心链路全闭环”。

### 主要变化

- `spec-plan` / `spec-brainstorm`
  - 强制 repo-relative 路径
  - 把 late-sequence 内容拆到 reference 文件
  - 收口 `spec-doc-review` 的 mandatory handoff 规则
- `spec-work` / `spec-work-beta`
  - 默认强制 code review
  - 增加 `Test Discovery` 与 testing-gap 收口
  - `spec-work-beta` 新增 Codex delegation 参数解析、配置解析与 reference 化 delegation workflow
  - Phase 3-4 shipping 流程从主文件抽成 reference，降低主 skill token 负担
- `testing-reviewer`
  - 增加“行为变化但零测试变更”审查项
- `spec-compound` / `spec-compound-refresh`
  - 补 discoverability check
  - `spec-compound` 改成按主栈路由 `kieran-* reviewer`，移除不存在 reviewer 的引用
  - `"What's next?"` 明确要求使用 blocking question tool
- 仓库治理
  - `AGENTS.md` / `CLAUDE.md` 新增 `docs/solutions/` 可发现性说明
  - 同步矩阵与审查报告可直接作为后续继续追上游的基线

### 版本意义

这次更新把 `spec-first` 与上游 `compound-engineering-plugin` 的核心 workflow 契约重新拉齐到同一层级：planning 更结构化，execution 更稳，knowledge compounding 更容易被后续 agent 发现和复用。对后续继续追上游更新而言，这意味着同步工作已经从“零散补丁”升级为“有基线、有 handoff、有审查记录”的可持续状态。

### 审查期补充修复

- 修正 `skills/spec-plan/references/plan-handoff.md` 中遗留的 `spec-doc-review mode:headless` 指令
- 明确自动化 / `disable-model-invocation` 场景下：
  - 若调用方能承接交互式 `spec-doc-review`，则继续以普通 `spec-doc-review` 路径运行
  - 若调用方不能承接交互，则返回 `Interactive spec-doc-review still required before execution handoff.`，不再伪称 review 已完成

这条修复把 planning handoff 与当前 `spec-doc-review` 的本地非 headless 路线重新收口，避免后续自动化调用引用不存在的模式。

---

## 2026-04-13 `docs(install-experience)`

### 更新内容

统一所有面向用户的安装文档，使 onboarding 口径一致。这是安装体验治理的文档层改动，不涉及代码变更。

### 主要变化

- 统一 canonical onboarding 顺序为：安装 CLI -> `spec-first doctor` -> `spec-first init --claude|--codex` -> 重启宿主 -> 使用 workflow
- 修正 `06-本地源码安装.md` 中 tree-sitter peer dependency 版本方向描述错误（旧文档错误地写成"主包 ~0.22.0 vs grammar 要 ^0.21.x"，实际方向是主包 0.21.0，grammar 要求 ^0.22.1 以上）
- 将 peer warning 叙事从"预期行为，可忽略"改为"已知兼容性噪音，本版本目标是消除"
- `04-常见问题.md` 明确区分"安装成功确认"与"宿主内 workflow 可见"是两个阶段
- 明确 `postinstall` 不是稳定欢迎页，`spec-first -v` 才是稳定入口
- README 中 warning 相关文案同步更新

### 版本意义

这次改动解决的是新用户在安装过程中遇到 peer dependency 警告时的困惑问题，以及不同文档之间 onboarding 顺序不一致导致的认知分叉。修正版本方向描述错误可以避免误导用户理解依赖关系。

---

## 2026-04-12 `feat(spec-graph-bootstrap)`

### 更新内容

`spec-graph-bootstrap` 的对外契约已经从“阶段 1 并行验证入口”收敛到“graph-informed Phase 0-4 入口”。这次更新不改变 `bootstrap` 仍是默认稳定入口，但明确 `graph-bootstrap` 已承担阶段2最小闭环职责：事实抽取、控制面产物生成、文档生成和路由生成。

### 主要变化

- `.claude-plugin/plugin.json` 中 `graph-bootstrap` 的描述更新为 Phase 0-4 fact extraction
- `install-local.sh` 与对应 smoke 断言改为输出阶段2最小闭环语义
- README 与用户手册不再把 `graph-bootstrap` 描述为“仅用于安装集成验证”
- 双入口并行期的对外说明统一为：`bootstrap` 默认稳定，`graph-bootstrap` 负责 graph-informed 阶段2闭环

### 版本意义

这次改动解决的是“实现已到阶段2，但包装层和说明层仍停留在阶段1”的认知错位问题。用户现在看到的命令描述、安装提示和文档说明，终于与 `skills/spec-graph-bootstrap/SKILL.md` 的真实执行合同一致。

---

## 2026-04-09 `feat(spec-graph-bootstrap)`

### 更新内容

新增 `spec-graph-bootstrap` 的阶段 1 安装集成能力。新入口现已进入打包、`init`、`clean`、smoke、install-local 和文档说明链路，但仍以“并行验证入口”身份上线，完成验证后收敛为当前主要 Stage-0 入口。

### 主要变化

- 新增 `skills/spec-graph-bootstrap/` 源资产与 `templates/claude/commands/spec/graph-bootstrap.md`
- `.claude-plugin/plugin.json` 新增 `graph-bootstrap` command 定义
- Claude / Codex runtime 现在都会安装 `graph-bootstrap` command 与 `spec-graph-bootstrap` skill
- smoke 与 install-local 验证现在覆盖双入口并行期资产
- README、用户手册、版本更新文档统一声明：`bootstrap` 仍是默认稳定入口，`graph-bootstrap` 仅作阶段 1 并行验证

### 版本意义

这次改动先把新 Stage-0 入口安全接入现有安装与治理框架，不提前承诺 graph-informed bootstrap 能力。它解决的是“可安装、可发现、可调用”，不是“已完成迁移”。

---

## 2026-04-08 `fix(mcp-setup)`

### 更新内容

`mcp-setup` 的宿主判定和 Serena 配置现在按宿主上下文精确校验，避免把 Claude/Codex 混淆后误判为已配置。

### 主要变化

- 宿主歧义时不再默认 Claude，必须显式指定 `MCP_SETUP_HOST`
- Serena 的 `mcp_config` 通过宿主上下文参数展开后再做检测和验证
- `detect-tools` / `verify-tools` 的 Bash 与 PowerShell 路径保持一致

### 版本意义

这次改动主要修复边界条件下的误判问题，提升多宿主、多平台场景下的安装可靠性。

---

## 2026-04-08 `docs(mcp-setup)`

### 更新内容

`mcp-setup` 技能命名现在统一为 `spec-mcp-setup`，Codex 侧直接调用格式改为 `spec-mcp-setup`，与其他 `spec-*` 技能保持一致。

### 主要变化

- 技能 frontmatter `name` 改为 `spec-mcp-setup`
- Codex 直接调用文案改成 `spec-mcp-setup`
- 相关测试断言同步更新，避免命名再回退到旧格式

### 版本意义

这次改动只做命名统一，不改变安装行为，但能减少认知分叉。

---

## 2026-04-08 `feat(codex)`

### 更新内容

Codex 侧的 `spec-first init` 曾短暂生成 `spec-*` compatibility command files，尝试和 Claude 侧保持一致的命令可见性与诊断体验。

> 当前状态：该产品面后续已撤回。当前 Codex 正式入口以 `spec-*` skills 和 `.agents/skills/` discovery 为准；`.codex/commands/spec/` 只作为旧版本遗留清理目标。

### 主要变化

- `CodexAdapter` 当时从不生成命令，改为生成 `.codex/commands/spec/`
- `doctor` 当时会在 Codex 平台检查命令目录是否存在
- smoke 测试同步验证 Codex init、doctor、clean 的命令链路
- 用户文档当时更新为 Codex 也会出现 `spec-*` 命令入口

### 版本意义

这次改动把 Codex 的工作流入口从“仅 skills”扩展为“commands + skills”，降低了跨平台认知差异；后续治理结论认为这会制造第二产品面，因此已回到“Codex 使用 `spec-*` skills，Claude 使用 `spec-*` commands”的边界。

---

## 2026-04-08 `docs(mcp-setup)`

### 更新内容

`mcp-setup` 的执行阶段增加了更友好的进度提示，用户在安装和验证时能更清楚地看到当前宿主、正在配置的工具、标记写入和完成状态。

### 主要变化

- 安装协调脚本会先提示当前宿主检查，再逐项说明正在写入的工具
- 验证脚本会先输出基础工具状态，再提示宿主就绪标记的写入位置
- 技能文档同步描述这些进度提示，避免用户误以为流程停住

### 版本意义

这次改动不改变功能路径，但显著降低了安装过程中的不确定感和等待焦虑。

---

## 2026-04-08 `feat(mcp-setup)`

### 更新内容

`mcp-setup` 现在除了 bash 入口，还提供了 Windows PowerShell 7+ 的 `.ps1` 入口，覆盖依赖检测、宿主识别、工具检测、安装协调和宿主验证。

### 主要变化

- 新增 `check-deps.ps1`、`detect-host.ps1`、`detect-tools.ps1`、`install-coordinator.ps1`、`verify-tools.ps1`
- `mcp-setup` 技能文档改成按平台选择脚本
- `check-deps` 的 Windows 兜底建议改为 `winget`
- 单元测试补充 Windows 脚本文件存在性断言

### 版本意义

这次改动把 `mcp-setup` 从 Unix-only 扩展到了 Windows PowerShell 入口，降低了 Windows 用户必须依赖 Git Bash/WSL 的门槛。

---

## 2026-04-08 `fix(mcp-setup+spec-graph-bootstrap)`

### 更新内容

`mcp-setup` 和 `spec-graph-bootstrap` 现在按当前宿主自适应处理 MCP 配置与就绪标记，Claude Code 和 Codex 会分别使用各自的配置文件与 `host-setup.json` 路径。

### 主要变化

- `mcp-setup` 自动识别宿主并写入对应的 MCP 配置文件
- `verify-tools.sh` 输出宿主字段与 v4 schema 的 `host-setup.json`
- `spec-graph-bootstrap` 按宿主选择 marker 和 `mcp list` 探针
- unit tests 增加 Claude / Codex 双宿主覆盖

### 版本意义

这次改动把 MCP 工具安装与后续引导彻底从 Claude-only 变成了双宿主一致的流程，减少了在 Codex 会话中误读 Claude 配置的风险。

---

## 2026-04-08 `refactor(graphify)`

### 更新内容

删除 `graphify` skill、命令模板、测试和运行时引用，移除 `spec-first` 中对 graphify 的安装与分析入口。

### 主要变化

- 删除 `skills/graphify/`
- 删除 `templates/claude/commands/spec/graphify.md`
- 删除 `tests/unit/graphify-skill.sh`
- 从 `.claude-plugin/plugin.json`、`package.json`、`tests/smoke/cli.sh`、`CLAUDE.md` 中移除 graphify 入口

### 版本意义

`spec-first` 现在只保留当前仓库实际支持的技能与工作流。删除 graphify 后，不会再有用户通过旧命令进入已废弃的 graphify 路径。

---

## 2026-04-01 `feat(version-reminder)`

### 更新内容

在执行 `doctor`、`init`、`clean`、`update` 等真实命令前，CLI 会先经过 package-level 24h gate；gate 允许时再异步向 npm registry 查询 `spec-first` 的最新版本，若当前版本落后则通过 stderr 输出一行更新提醒，并统一引导用户运行 `spec-first update`。`--help` 和 `--version` 不触发检查，避免打扰只需信息查询的场景。会话启动路径还会通过 `startup-reminder` 对 Claude/Codex/Qoder runtime 版本做只读提醒；Qoder CLI 1.0.41 的 settings/command 协议已确认，但 settings entry 在 authenticated event execution 与 shared-loader safety 完成前仍保持 degraded-by-design，只有宿主真实触发 managed `SessionStart` hook 时才会展示。

### 主要能力

- 版本比较实现零依赖：
  内置 `compareVersions` / `parseVersion`，完整支持 semver 核心版本号与预发布标识（`-beta.1` 等），无需引入 semver 包
- 查询有超时保护：
  默认 2000 ms 超时，超时或网络失败时静默跳过，不阻塞命令执行
- 网络调用前有 24h attempt gate：
  startup reminder 使用 host scope（`startup.claude` / `startup.codex` / `startup.qoder`）并分别写入 `~/.claude/spec-first/startup-version-reminder.json`、`~/.codex/spec-first/startup-version-reminder.json` 或 `~/.qoder/spec-first/startup-version-reminder.json`；CLI reminder 使用 package scope（`cli.package`）并写入 `~/.spec-first/version-reminder.json`。每个 scope 内的任意 attempt 结果都会暂停 24h 内重复 lookup，包括已提示、已是最新、网络失败或慢网超时前的 attempt。状态可写时，同 scope attempt 会先通过短时本地 lock 完成 claim，避免并发进程同时进入 lookup。
- startup 与 CLI scope 分离：
  后台 startup/offline attempt 不会抑制用户显式运行的 `doctor` / `update` 检查；CLI attempt 也不会抑制后续 session-start startup 检查。成功执行 `spec-first update` 后会清理 CLI package gate。
- 支持显式禁用与自动化跳过：
  设置 `SPEC_FIRST_NO_UPDATE_NOTIFIER=1` 会禁用 CLI 与 startup 两条提醒路径，并且不会写入 attempt state 或触发网络查询。普通 CLI reminder 在 `CI=true` 或 stderr 非 TTY 时默认跳过；startup reminder 只尊重显式 opt-out，不把 host hook 的非 TTY 输出误判为自动化跳过。
- 支持测试环境 override：
  通过 `SPEC_FIRST_VERSION_REMINDER_LATEST` 环境变量注入版本，测试无需真实网络请求
- 提醒输出到 stderr：
  不干扰命令的 stdout 输出，脚本管道场景不受影响

### 节流边界

这次节流保护的是网络 lookup 成本和慢网延迟，不承诺 session-start hook 在 cooldown 内完全不启动 helper 进程。现有 1200 ms session-start spawn cap 是有意的启动延迟保护；runtime drift detection 仍由 `doctor` / `init` 负责，不放进 session-start 检查。代价是全新 release 最多可能延迟一个窗口才提示，一次临时离线也会让同 scope 检查暂停一个窗口。短时 lock 只保护状态目录可写的本地并发；若 lock/state 不可写，提醒逻辑会 fail-open，不阻断真实 CLI 命令。

### 交付物

- `src/cli/version-reminder.js` — 版本查询、比较、格式化与提醒核心逻辑
- `src/cli/index.js` — 集成点，真实命令前 await 提醒检查；子命令 `--help` / `-h` 跳过提醒 gate
- `tests/unit/version-reminder.sh` 与 `tests/unit/version-reminder-contracts.test.js` — 覆盖版本比较、格式化、attempt gate、并发 lock、CLI 接线、静默超时等场景

### 版本意义

已安装 CLI 的用户在日常使用中会自然得到更新提示，无需手动查询版本差异。对于频繁迭代的工具型项目，这类低成本的自我更新通知能有效减少用户长期停留在旧版本的情况。

---

## 2026-04-01 `feat(lang-governance)`

### 更新内容

`spec-first init` 新增两项写入能力：将语言偏好与 Changelog 治理规则以受管理块的形式写入项目的 `CLAUDE.md`（Claude 平台）或 `AGENTS.md`（Codex 平台），并修复了 lang 优先级顺序。

### 主要能力

- 幂等写入语言治理块：
  通过 `<!-- spec-first:lang:start -->` / `<!-- spec-first:lang:end -->` 标记管理，支持多次 `init` 时安全覆盖，不影响用户自行添加的其他内容
- 写入 Changelog 铁律：
  在受管理块中注入"任何源码变更必须同步在 `CHANGELOG.md` 中记录，否则拒绝生成"的 prompt 层约束
- 修正 lang 优先级：
  `--lang` CLI 参数 > 当前项目 `.developer` 的 lang > 全局 `~/.spec-first/.developer` 的 lang > 默认 `zh`；重复 `init` 时项目已有语言设置不会被全局配置意外覆盖
- 自动引导 CHANGELOG：
  若项目根目录缺少 `CHANGELOG.md`，`init` 会创建格式头和初始 bootstrap 条目；已存在时不触碰

### 交付物

- `src/cli/lang-policy.js` — 受管理块写入与幂等更新逻辑
- `src/cli/developer.js` — lang 优先级修复 + 设计意图注释
- `src/cli/commands/init.js` — 集成 `writeLangPolicy` 与 `bootstrapChangelog`
- `tests/unit/lang-policy.sh` — 语言治理块写入、幂等性、多语言切换等场景
- `tests/unit/developer.sh` — lang fallback 4 个优先级场景

### 版本意义

语言治理落地后，项目的 AI 工具不再需要依赖用户记忆或手动配置来保持语言一致性。规则由 `spec-first init` 写入指令文件，每次会话自动生效。Changelog 铁律的引入则让代码变更历史的维护从"最佳实践"升格为"可执行的 AI 层约束"。

---

## 2026-04-01 `feat(mcp-setup)`

### 更新内容

新增 `skills/mcp-setup`，提供面向 `spec-first` 工作流的 MCP 工具一键安装与配置能力。该能力覆盖依赖检查、工具探测、配置合并、可选工具安装和最终验证，目标是把原本分散的环境准备工作收敛成一条标准化流程。

### 主要能力

- 支持安装和配置 6 个 MCP 相关工具：
  `Serena`、`GitNexus`、`ABCoder`、`Sequential Thinking`、`Context7`，以及可选的 `Playwright MCP`
- 提供依赖检测与分层处理：
  自动检查 `node`、`go`、`uv`、`jq`，区分可直接安装与需要风险提示的依赖
- 支持幂等安装与配置探测：
  已存在的工具会被自动跳过，避免重复写入
- 提供原子化配置合并：
  通过备份、加锁、`jq` 校验和原子替换，把 `~/.claude.json` 的配置变更风险降到最低
- 支持安装后验证：
  会重新探测工具状态，并输出完整安装结果

### 交付物

- `skills/mcp-setup/SKILL.md`
- `skills/mcp-setup/mcp-tools.json`
- `skills/mcp-setup/scripts/check-deps.sh`
- `skills/mcp-setup/scripts/detect-tools.sh`
- `skills/mcp-setup/scripts/install-coordinator.sh`

### 版本意义

这次迭代解决的不是单个 skill 的功能问题，而是 `spec-first` Full mode 的环境落地问题。它把 MCP 准备过程标准化之后，`spec-graph-bootstrap` 等后续工作流就有了更低的使用门槛和更稳定的前置条件。

---

## 2026-03-31 `fix(spec-graph-bootstrap)`

### 更新内容

在 `spec-graph-bootstrap` 首版上线后，围绕 review 反馈进行了一轮可靠性加固，重点补齐“上下文生成流程是否足够安全、可恢复、可验证”这条链路。

### 主要改进

- 补强备份原子性：
  写入前使用时间戳目录备份，并通过文件数校验避免半覆盖状态
- 明确部分失败策略：
  `summary-context` 失败时整体验证回滚，其他 worker 失败时保留部分产物并显式报告
- 强化超时约束：
  为 worker 执行增加 20 分钟建议时限，避免子任务无限拖延
- 修正 MCP 校验方式：
  改为通过 `execute_query("SELECT 1")` 判断真实数据库连通性，而不是仅判断服务存在
- 优化无阻塞 slug 决策：
  多候选上下文目录时自动选取并在总结中说明，避免人工确认卡住流程

### 版本意义

这次修复说明 `spec-graph-bootstrap` 已经从“能跑”推进到“可作为长期工作流底座来跑”。对于要把上下文文档持续沉淀到项目内的场景，这类可靠性补强比新增表面功能更关键。

---

## 2026-03-31 `feat(spec-graph-bootstrap)`

### 更新内容

新增 `skills/spec-graph-bootstrap`，把它定义为 `spec-first` 五阶段主流程之前的 Stage-0 支撑工作流。它负责分析目标项目，并在 `docs/contexts/<slug>/` 下生成可长期复用的项目上下文资产。

### 主要能力

- 引入 Stage-0 上下文引导模型：
  在 brainstorm / plan / work / review / compound 之前，先沉淀项目级稳定上下文
- 支持三档分析模式：
  `Full`、`Enhanced`、`Basic`，根据 `GitNexus`、`ABCoder`、`Serena` 等工具可用性自动降级
- 支持仓库结构与分层识别：
  自动识别前端、后端、移动端、桌面端、CLI、shared、data 等层
- 支持数据库配置检测：
  面向 MySQL 提供配置识别、连通性验证和数据库上下文生成入口
- 支持 PRD 任务合同与 worker 执行模型：
  先生成任务 PRD，再由子 agent 按文件所有权分工产出上下文文档
- 提供上下文模板资产：
  包含通用 PRD 模板和数据库 PRD 模板，便于后续稳定复用

### 交付物

- `skills/spec-graph-bootstrap/SKILL.md`
- `skills/spec-graph-bootstrap/references/prd-template.md`
- `skills/spec-graph-bootstrap/references/database-prd-template.md`

### 版本意义

`spec-graph-bootstrap` 的引入，补上了 `spec-first` 过去在“冷启动项目理解”上的空档。它不是新增一个普通 skill，而是在五阶段流程之前增加了一个可复用的项目上下文生产层，让后续每次需求分析都能站在更稳定的基础上开展。

---

## 总结

这几个迭代串起来，可以看出 `spec-first` 当前版本的演进方向很明确：

- 先用 `spec-graph-bootstrap` 补齐项目上下文基础设施
- 再用 review 驱动的修复把这套基础设施做稳
- 用 `mcp-setup` 把所需工具链安装配置标准化
- 用 `lang-governance` 让语言和变更治理规则通过指令文件自动生效
- 用 `version-reminder` 让已安装用户在日常使用中自然得到版本更新提示

整体上，这一轮更新不是零散加功能，而是在继续把 `spec-first` 从”技能集合”推进成”可落地、可复用、可持续演进的工程工作流系统”。
