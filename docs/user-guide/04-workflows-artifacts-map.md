# `.spec-first/` 产物目录映射

本文说明当前 `spec-first` 会写入哪些 project-local runtime/control-plane 产物、它们由谁生成、后续如何被使用，以及哪些目录不应提交到 Git。

当前版本不再生成当前能力用的图谱 readiness 产物。App consistency audit 和 quality gate 等目录是可重建的执行产物。脚本负责写入确定性事实，LLM 根据这些事实判断下一步是否使用 bounded direct source reads、`rg`、ast-grep、git diff、tests/logs、用户证据或专项审查报告。

## 总览

| 目录 | 写入阶段 | 触发方式 | 主要作用 | 主要产物 |
| --- | --- | --- | --- | --- |
| `.spec-first/config/` | `spec-runtime-setup` setup facts 阶段 | `spec-runtime-setup` | 记录 host baseline、required MCP/helper readiness、candidate tools/resources、fallback 能力和 artifact path contract；不是 query-ready direct evidence 或 live MCP proof | `runtime-capabilities.json` |
| `.spec-first/workspace/` | parent workspace advisory 阶段 | 父 workspace 下的 `spec-runtime-setup` 或 `spec-first clean --workspace-orphans` | 保存 per-child setup/verify summary、setup-time scenario fingerprint 和 parent orphan quarantine | `project-config-bootstrap-summary.json`、`runtime-setup-summary.json`、`mcp-verify-summary.json`、`scenario-fingerprint-setup.json`、`parent-artifact-quarantine.json` |
| `.spec-first/app-audit/runs/<run-id>/` | `spec-app-consistency-audit` App 一致性审查阶段 | `spec-app-consistency-audit`；headless 自动化下亦可直接调用 `node skills/spec-app-consistency-audit/scripts/run-audit.js mode:headless base:<ref>` | 保存移动 App PRD / Figma / source / route / architecture / analytics / i18n 静态一致性审查证据；`issue_synthesis_status` 三态(`not_run` / `llm_provided` / `fixture_provided`)区分确定性 runner 产物与上游 LLM/fixture 注入的语义 issue；markdown 摘要由下游 Report Writer 产出，不由 runner 直接生成 | 由 runner 产出: `metadata.json`、`preflight.json`、`impact-facts.json`、`issues.json`、`audit-report.json`、`app-audit-context.json`、`merged-context.json`、`artifact-manifest.json`、`headless-envelope.txt`；由下游 Report Writer 产出: `app-consistency-audit.md`、`app-consistency-audit.summary.md` |
| `.spec-first/workflows/verification/<slug>/` | verification evidence 阶段 | 上游 verification 流程写入，`doctor` 读取 | 作为验证证据投递目录 | `verification-evidence.json` |
| `.spec-first/workflows/spec-work/<workspace-slug>/<run-id>/` | `spec-work` final verification / closeout 阶段 | 选定 checks 后真实执行命令并记录日志；durable trigger 命中时再由 source-owned producer 写 `run.json` | 保存 repo-relative redacted logs、`verification-run-summary.v1`、可选的脱敏 review evidence、structured claim limitation 与 conditional `spec-work-run-artifact/v2`。`workflow_integrated=true` 只表示 active shipping 确实调用 producer；不代表 task progress、approval、CI、merge、release 或 field outcome | `logs/*`、`verification-run-summary.json`、可选 `review/*`、条件式 `run.json` |
| `.spec-first/workflows/spec-debug/<workspace-slug>/<run-id>/` | `spec-debug` post-fix verification 阶段 | 修复后实际复跑 original reproducer、regression 与适用 broader checks | 保存 debug 自己执行命令的 redacted logs 与 run summary；Debug Summary / Post-Fix Quality 返回 summary ref、honest-closeout verdict 与 limitations。该 workflow 不写 spec-work run artifact | `logs/*`、`verification-run-summary.json` |
| `.spec-first/workflows/spec-code-review/<workspace-slug>/<run-id>/` | `spec-code-review` targeted command verification 阶段 | 仅当 review 自己实际执行 focused test/build/verification command 时写入 | 保存真实命令证据；persona、validator、cross-model finding 不会被伪装成 command result。无 targeted command 时 `coverage.verification_evidence` 为 `not-produced`，该 workflow 不写 spec-work run artifact | `logs/*`、`verification-run-summary.json`（条件式） |
| `.spec-first/workflows/quality-gates/ai-dev-quality-gate/` | AI Dev Quality Gate 阶段 | `npm run test:ai-dev:gate` | 记录质量门结果与失败主题，供后续诊断和知识沉淀 | `ai-dev-quality-gate-result.json`、`quality-feedback-topics.json`、JUnit 输出 |

不在 `.spec-first/` 下、但容易被误解的临时 handoff：

| 路径 | 写入阶段 | 触发方式 | 主要作用 | Git 边界 |
| --- | --- | --- | --- | --- |
| `<os-temp>/spec-first/spec-code-review/<run-id>/` | `spec-code-review` default / `mode:agent` run | 每次 review 解析一次 OS-native temp root；可写时由 review producer 返回 concrete `artifact_path` | 保存当前 run 的 `review.json`、persona/validator/cross-model JSON、metadata 和 default-mode report，供同一会话 caller 消费。普通 review 默认 report-only，`mode:agent` 始终 report-only；明确 review-and-fix 只改变本地 apply policy，commit 仍需独立授权 | 临时 session/orchestrator handoff，不提交；实际路径来自 `$TMPDIR` / `%TEMP%` 等当前 OS temp root。跨会话需要 detail 时，由 `spec-work` 只物化实际消费的脱敏 JSON/summary到自己的 run dir；失败则保留 structured summary + limitation，绝不持久化机器绝对 temp path |

不在 `.spec-first/` 下、但属于长期协作文档层的 durable artifacts：

| 路径 | 写入阶段 | 触发方式 | 主要作用 | Git 边界 |
| --- | --- | --- | --- | --- |
| `docs/ideation/*-ideation.md` | 主动想法探索与候选方向收敛 | `spec-ideate` | 保存候选想法、批判、排序、被拒原因和进入 brainstorm 的 handoff；不是 requirements、plan 或代码 | 通常提交，作为后续 brainstorm/plan 的背景输入 |
| `docs/plans/*-plan.md`（`artifact_readiness: requirements-only`） | 需求成型 | `spec-brainstorm` | 保存一个已选想法的问题框架、actors、flows、边界、非目标和验收样例 | 通常提交，由 `spec-plan` 原位深化为 implementation-ready |
| `docs/brainstorms/*-requirements.md` | 研发侧 clarified requirements / planning-readiness artifact | `spec-prd` | 保存产品 PRD 或需求材料进入研发前的 current-state evidence、Change Delta、owner 决策追踪、优先级、验收、Evidence And Assumptions；frontmatter 兼容使用历史字段 `artifact_kind: prd-requirements`，不代表替产品写 PRD，也不新增 `docs/prds/` | 通常提交，作为 plan 的上游输入；也可先进入 doc review |
| `docs/plans/*-plan.md` | 实施规划 | `spec-plan` | 保存实施单元、取舍、验证范围、风险、非目标和证据限制 | 通常提交，作为 work 或 write-tasks 的上游输入 |
| `docs/tasks/*-tasks.md` | 任务包派生 | `spec-write-tasks` | 保存从 plan 派生的 executable handoff、依赖、任务身份和 freshness contract | 视团队协作需要提交 |
| `docs/solutions/**/*` | 知识沉淀 | `spec-compound` / `spec-compound-refresh` | 保存已解决问题的可复用工程经验；refresh 负责过时/重叠/漂移清理 | 通常提交 |
| `docs/dogfood-reports/*-dogfood.md` | 分支/PR 浏览器 dogfood | `spec-dogfood` | 场景矩阵、修复记录、阻断项与 readiness 结论 | 通常提交；跨会话可 resume |
| `docs/ai/project-rules.md` | 项目约定挖掘 | `spec-rule-miner` | 从代码证据沉淀 AI coding 规则；`AGENTS.md`/`CLAUDE.md` 常写 pointer | 通常提交 |
| `docs/architecture.md` | 架构知识库挖掘/回写 | `spec-project-rules` | 从代码证据沉淀各端职责、依赖方向规则、shared 层复用契约与高价值隐式约定；`AGENTS.md`/`CLAUDE.md` 常写 pointer | 通常提交 |
| `STRATEGY.md` | 产品方向 | `spec-strategy` | 产品策略与 persona / metrics 等方向文档 | 通常提交 |
| `skills/**`（source） | Skill 包 create/revise | `spec-write-skill` | 项目拥有的 Agent Skill source；runtime 由 `spec-first init` 投影 | 提交 source；selected-host generated mirror 作为 checked-in delivery projection 默认也跟随目标项目提交，但不手改 mirror |

## 用途总览

| 目录类型 | 主要作用 | 典型后续用途 |
| --- | --- | --- |
| `docs/ideation/` | 候选方向与想法排序 | `spec-brainstorm` 选择一个想法继续成型；维护者回看被拒绝方向与取舍理由 |
| `docs/brainstorms/` | `spec-prd` 的研发侧 clarified requirements | `spec-plan`、doc review、后续维护者复核 Change Delta、owner 决策和 evidence posture |
| `docs/plans/` / `docs/tasks/` | requirements-only / implementation-ready plans 与可执行任务交接 | `spec-plan`、`spec-work`、`write-tasks` public workflow、code/doc review；计划中的 evidence posture 说明 direct source reads、验证命令、限制和源码验证要求 |
| `docs/solutions/` | 可复用工程知识 | 后续 brainstorm/plan/work/debug/review 复用经验 |
| `config/` | setup-owned machine facts | runtime-setup 前置校验、host readiness 指针、required helper readiness、candidate `native_tools[]` / `native_resources[]`、fallback 能力判断 |
| `workspace/` | parent workspace advisory summaries | 多仓父目录下展示 child repo 候选、scenario fingerprint、批量维护结果和 parent orphan quarantine；不作为 repo-local truth |
| `app-audit/runs/` | App consistency audit execution artifacts | 评审者读取静态一致性报告、degraded modes、issues 和 runtime follow-up 建议 |
| `verification/*` | 验证证据投递目录 | `doctor` 校验与汇总 |
| `workflows/spec-work/*` | Work run evidence | source-owned `spec-work-run-artifact read|prune`、显式 shipping/resume handoff 与维护者使用；缺失、not-readable 或 scope mismatch 时保留 unavailable/stale，不自动提升为 source authority |
| `quality-gates/*` | 质量门机器结果 | gate 结果留痕与失败主题沉淀 |
| `<os-temp>/spec-first/spec-code-review/*` | Code review 临时 handoff | 当前 run 的 reviewer/orchestrator 协调，不作为 repo-local durable artifact |

## 阶段 → 读取方速查

| 产物目录 | 主要读取方 | 读取发生阶段 | 读取目的 |
| --- | --- | --- | --- |
| `config/` | `spec-runtime-setup`、`doctor`、相关 workflow | runtime-setup preflight / host readiness selection | 校验 baseline、required helper readiness、artifact path contract 和 fallback 能力；不把 discovery facts 当 query-ready evidence |
| `workspace/` | 父 workspace 下的 LLM workflow、维护者 | workspace 只读定位或批量维护后 | 查看 child repo 候选、per-child setup summary 和 next action；不替代 child repo source truth |
| `app-audit/runs/<run-id>` | 评审者、`spec-code-review` headless 调用、后续 QA / runtime validation | App 一致性审查后 | 查看 PRD/Figma/source 一致性问题、证据链、降级范围和运行时验证建议 |
| `verification/<slug>` | `src/cli/commands/doctor.js` | `doctor` 检查阶段 | 校验 verification evidence 是否存在、有效、足够新 |
| `quality-gates/ai-dev-quality-gate` | `scripts/run-ai-dev-quality-gate.js`、`src/verification/quality-feedback.js` | AI gate 执行后 | 记录 gate 结果并提取失败主题 |
| `workflows/spec-work/<workspace-slug>/<run-id>` | source-owned reader、shipping handoff、维护者 | work closeout 后 | 在显式 target repo/workspace/run 选择下读取 compact work evidence、验证摘要和可选 `direct_evidence_used`；不得把 run artifact 当作 source scope authority |

## 1. config/

| 项目 | 内容 |
| --- | --- |
| 阶段 | Required Harness Runtime setup facts |
| 触发 | `spec-runtime-setup` |
| 目录形状 | `.spec-first/config/` |
| 关键源码 | `skills/spec-runtime-setup/scripts/setup.cjs`、`skills/spec-runtime-setup/scripts/lib/facts.cjs`、`skills/spec-runtime-setup/scripts/lib/configured-dependencies.cjs` |
| 事实边界 | setup-owned config facts；不是 runtime-setup 的结果真相源 |

### 写入内容

| 文件 | 角色 |
| --- | --- |
| `runtime-capabilities.json` | host ledger 指针、baseline 摘要、required helper readiness 和 fallback tool 能力 |

`spec-runtime-setup` 写入 setup-owned facts，但不把自然语言 setup 输出当成后续 workflow 的源码证据真相源。

## Parent workspace advisory summaries

| 项目 | 内容 |
| --- | --- |
| 阶段 | parent workspace advisory summaries |
| 触发 | 父 workspace 下运行 `spec-runtime-setup` 或显式只读定位 |
| 目录形状 | `.spec-first/workspace/` |
| 关键源码 | `skills/spec-runtime-setup/scripts/setup.cjs`、`skills/spec-runtime-setup/scripts/lib/project-config.cjs`、`skills/spec-runtime-setup/scripts/lib/facts.cjs` |
| 事实边界 | advisory workspace facts；不是任何 child repo 的 canonical truth |

### 写入内容

| 文件 | 角色 |
| --- | --- |
| `project-config-bootstrap-summary.json` | 父 workspace 下 project config bootstrap 的 per-child 汇总 |
| `runtime-setup-summary.json` | 父 workspace 下显式 provider setup 的 per-child 汇总 |
| `mcp-verify-summary.json` | 父 workspace 下统一 Node verify path 的 per-child readiness 汇总；`parent_workspace_pollution_count` 记录本次 parent orphan quarantine 命中数 |
| `scenario-fingerprint-setup.json` | `developer-scenario-fingerprint-setup.v1`，setup-time 场景事实；包含 topology、worktree、complexity dimensions、foreign residual indicators 和 advisory limitations |
| `parent-artifact-quarantine.json` | `parent-artifact-quarantine.v1`，父 workspace 下 repo-local retired residue 的 advisory quarantine；`spec-first clean --workspace-orphans` 默认只预览，`--confirm` 才删除受支持的 quarantined parent orphan 路径 |

`workspace/` 只帮助 LLM 或维护者看清候选和批量维护结果。它不能替代 child repo 内的 `.spec-first/config/`、当前源码、git diff、tests/logs、ast-grep 或 bounded direct source reads。

## Spec-work run evidence

`spec-work` 的 run artifact 写入 `.spec-first/workflows/spec-work/<workspace-slug>/<run-id>/run.json`。它是 closeout evidence，不是 plan/task 的 source authority；producer 始终 `producer_available=true`。`workflow_integrated=true` 只在 `spec-work` closeout 因 durable trigger 调用 producer 时成立，触发原因包括 `trigger-task-pack`、`trigger-not-run-validation`、`trigger-deferred-follow-up` 和 `trigger-substantive-work`；如果一个已存在的 artifact 标记 `workflow_integrated=false`，它表示非 integrated/write-side 状态，不表示 active shipping 已调用 producer。无 durable trigger 时，shipping closeout 不调用 producer，也不写 `run.json`。同一 workspace/run-id 不可覆盖；source-owned `read|prune` consumer 支持当前 v2 与 legacy v1 artifact，retention status 仍明确标记为 `lifecycle-deferred`。

当前没有 workflow 自动发现或隐式消费 `spec-work` run artifact；需要使用时必须通过 source-owned reader 或显式 handoff 选择 target repo、workspace 和 run。Artifact 仍只是 advisory closeout evidence，不能替代 source plan、task pack、当前源码或验证摘要。

`direct_evidence_used` 是 optional compact summary，可由 plan intake 或 work closeout 提供。v2 只保存 `source_refs`、`checks_or_logs`、`repo_scope`、`limitations` 和 `redaction_status`，不保存 raw provider output、源码摘录或 credentialed URL。Capability-class advisory candidates 的查询与采纳/拒绝摘要落 `provider_untrusted.summaries[]`；经回源确认的内容再落 `direct_evidence_used`，未确认候选只能作为 limitation。`graph_evidence_used` 仅保留 v1 read/prune 兼容，不是新的 v2 producer 字段。

## Code review temporary handoff

`spec-code-review` 的 full-detail run artifact 写到当前 OS temp root 下的 `<os-temp>/spec-first/spec-code-review/<run-id>/`，不是 `.spec-first/` 目录，也不是 repo-local durable truth。实际 `<os-temp>` 由运行环境解析，例如 macOS/Linux 的 `$TMPDIR` 或 Windows 的 `%TEMP%`。它的用途是让当前 session 中的 orchestrator、headless caller 或 shipping workflow 读取 reviewer JSON、detail enrichment、autofix residuals 和 metadata。

持久化边界：

- `mode:report-only` 不写 temp artifact。
- interactive、autofix 和 headless mode 写 OS temp artifact，但它默认不提交、不承诺长期保留。
- 如果 shipping 阶段接受 residual findings，PR 描述应写 `Known Residuals`；无 PR 提交路径才写 `docs/residual-review-findings/<branch-or-head-sha>.md` 这类 concise durable summary。
- 不默认把 full-detail per-reviewer JSON bundle 复制进 `docs/` 或 `.spec-first/`。


## 6. app-audit/runs/

| 项目 | 内容 |
| --- | --- |
| 阶段 | App consistency audit |
| 触发 | `spec-app-consistency-audit` |
| 目录形状 | `.spec-first/app-audit/runs/<run-id>/`，并可带 `latest-summary.json` 指针 |
| 关键源码 | `skills/spec-app-consistency-audit/scripts/*` |
| 事实边界 | 审计执行产物；不是 source truth，不进入 Git |

### 写入内容

| 文件 | 角色 |
| --- | --- |
| `metadata.json` | run id、scope、head sha、diff hash、worktree fingerprint 和审查模式 |
| `artifact-manifest.json` | 本次 run 写出的 artifact 清单、hash 和 path contract |
| `preflight.json` | 输入可用性、degraded modes、Figma reference/context 状态 |
| `impact-facts.json` | source、diff、route、interaction 和候选影响面机器事实 |
| `app-audit-context.json` | LLM 专家使用的聚合上下文和 capability coverage |
| `issues.json` | 通过 deterministic evidence gate 后的结构化 issue 集合 |
| `audit-report.json` | 机器可读审查报告 |
| `app-consistency-audit.md` | 面向用户的静态一致性审查报告 |

协作规则：

- `.spec-first/app-audit/` 默认不进入 Git，报告需要共享时应摘录结论或另存为团队约定的 durable doc。
- `figma-context:<path>` 才是可抽取 evidence；`figma-ref:<id-or-url>` 只是 reference。
- Figma MCP 是宿主可选能力，用来 materialize 本地 JSON，不属于 required harness setup。
- `mode:headless` 供 `spec-code-review` 等父流程消费；`mode:report-only` 不写 run artifacts。

## 7. verification/&lt;slug&gt;

| 项目 | 内容 |
| --- | --- |
| 阶段 | verification evidence 证据层 |
| 触发 | 上游 verification 流程写入 |
| 目录形状 | `.spec-first/workflows/verification/<slug>/` |
| 关键消费源码 | `src/cli/commands/doctor.js` |
| 关键文件 | `verification-evidence.json` |

这个目录是验证证据投递目录。`doctor` 可读取并校验 evidence 文件，帮助判断运行时验证是否可信。

## 8. quality-gates/ai-dev-quality-gate

| 项目 | 内容 |
| --- | --- |
| 阶段 | AI Dev Quality Gate |
| 触发 | `npm run test:ai-dev:gate` |
| 目录形状 | `.spec-first/workflows/quality-gates/ai-dev-quality-gate/` |
| 关键源码 | `scripts/run-ai-dev-quality-gate.js`、`src/verification/quality-feedback.js` |

### 写入内容

| 文件 | 说明 |
| --- | --- |
| `ai-dev-quality-gate-result.json` | quality gate 主结果 |
| `quality-feedback-topics.json` | 失败主题，供后续知识沉淀参考 |
| JUnit 输出 | 单测/契约测试的机器可读结果 |

## 9. Git 边界

- `.spec-first/config/`、`.spec-first/workspace/`、`.spec-first/audits/`、`.spec-first/app-audit/` 与 `.spec-first/workflows/` 默认不进入 Git。
- `docs/ideation/`、`docs/brainstorms/`、`docs/plans/`、`docs/tasks/` 和 `docs/solutions/` 才是长期协作文档层。
- setup facts 是当前工具状态的投影，不要把它改造成第二套手工维护事实源。
- 若 local evidence facts stale、blocked 或 degraded，下游 workflow 应说明限制，并回退到 bounded direct repo reads、git diff、tests/logs 或用户提供证据。
