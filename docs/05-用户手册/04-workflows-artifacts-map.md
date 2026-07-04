# `.spec-first/` 产物目录映射

本文说明当前 `spec-first` 会写入哪些 project-local runtime/control-plane 产物、它们由谁生成、后续如何被使用，以及哪些目录不应提交到 Git。

当前版本不再生成当前能力用的图谱 readiness 产物。App consistency audit、skill audit 和 quality gate 等目录是可重建的执行产物。脚本负责写入确定性事实，LLM 根据这些事实判断下一步是否使用 bounded direct source reads、`rg`、ast-grep、git diff、tests/logs、用户证据或专项审查报告。

## 总览

| 目录 | 写入阶段 | 触发方式 | 主要作用 | 主要产物 |
| --- | --- | --- | --- | --- |
| `.spec-first/config/` | `spec-mcp-setup` setup facts 阶段 | `spec-mcp-setup` | 记录 host baseline、required MCP/helper readiness、candidate tools/resources、fallback 能力和 artifact path contract；不是 query-ready direct evidence 或 live MCP proof | `runtime-capabilities.json` |
| `.spec-first/workspace/` | parent workspace advisory 阶段 | 父 workspace 下的 `spec-mcp-setup`、read-only resolver 或 `spec-first clean --workspace-orphans` | 保存跨 child repo 候选、批量维护 summary、scenario fingerprint 和 parent orphan quarantine | `project-config-bootstrap-summary.json`、`mcp-setup-summary.json`、`mcp-verify-summary.json`、`scenario-fingerprint-setup.json`、`scenario-fingerprint.json`、`parent-artifact-quarantine.json` |
| `.spec-first/audits/skill-audit/` | `spec-skill-audit` source skill audit 阶段 | `spec-skill-audit` 或直接运行 `write-audit-artifacts.js` | 保存 source skill inventory、scorecard、安全/治理/runtime drift 信号和改进计划 | `latest/skill-audit-summary.md`、`latest/skill-improvement-plan.md`、`latest/*.json`、`latest/patch-preview/*` |
| `.spec-first/app-audit/runs/<run-id>/` | `spec-app-consistency-audit` App 一致性审查阶段 | `spec-app-consistency-audit`；headless 自动化下亦可直接调用 `node skills/spec-app-consistency-audit/scripts/run-audit.js mode:headless base:<ref>` | 保存移动 App PRD / Figma / source / route / architecture / analytics / i18n 静态一致性审查证据；`issue_synthesis_status` 三态(`not_run` / `llm_provided` / `fixture_provided`)区分确定性 runner 产物与上游 LLM/fixture 注入的语义 issue；markdown 摘要由下游 Report Writer 产出，不由 runner 直接生成 | 由 runner 产出: `metadata.json`、`preflight.json`、`impact-facts.json`、`issues.json`、`audit-report.json`、`app-audit-context.json`、`merged-context.json`、`artifact-manifest.json`、`headless-envelope.txt`；由下游 Report Writer 产出: `app-consistency-audit.md`、`app-consistency-audit.summary.md` |
| `.spec-first/workflows/verification/<slug>/` | verification evidence 阶段 | 上游 verification 流程写入，`doctor` 读取 | 作为验证证据投递目录 | `verification-evidence.json` |
| `.spec-first/workflows/spec-work/<workspace-slug>/<run-id>/` | `spec-work` closeout evidence 阶段 | `spec-work` closeout durable evidence trigger 适用时，由 source-owned producer 写入 | 保存本次 work 的 compact run evidence、验证摘要、source refs 和可选 `direct_evidence_used` session-local direct source evidence evidence 摘要；`workflow_integrated=false` 仍表示完整 replay/retention lifecycle 未完成 | `run.json` |
| `.spec-first/workflows/quality-gates/ai-dev-quality-gate/` | AI Dev Quality Gate 阶段 | `npm run test:ai-dev:gate` | 记录质量门结果与失败主题，供后续诊断和知识沉淀 | `ai-dev-quality-gate-result.json`、`quality-feedback-topics.json`、JUnit 输出 |

不在 `.spec-first/` 下、但容易被误解的临时 handoff：

| 路径 | 写入阶段 | 触发方式 | 主要作用 | Git 边界 |
| --- | --- | --- | --- | --- |
| `<os-temp>/spec-first/spec-code-review/<run-id>/` | `spec-code-review` interactive / autofix / headless run | `spec-code-review`，report-only 除外 | 保存当前 run 的 reviewer JSON、detail enrichment、safe_auto 结果和 residual handoff，供 orchestrator 当前会话读取 | 临时 session/orchestrator handoff，不提交；实际路径由当前 OS temp root 解析，例如 macOS/Linux `$TMPDIR` 或 Windows `%TEMP%`；需要长期保留时只通过 PR Known Residuals 或 `docs/residual-review-findings/<branch-or-head-sha>.md` 写 concise summary |

不在 `.spec-first/` 下、但属于长期协作文档层的 durable artifacts：

| 路径 | 写入阶段 | 触发方式 | 主要作用 | Git 边界 |
| --- | --- | --- | --- | --- |
| `docs/ideation/*-ideation.md` | 主动想法探索与候选方向收敛 | `spec-ideate` | 保存候选想法、批判、排序、被拒原因和进入 brainstorm 的 handoff；不是 requirements、plan 或代码 | 通常提交，作为后续 brainstorm/plan 的背景输入 |
| `docs/brainstorms/*-requirements.md` | 需求成型 | `spec-brainstorm` | 保存一个已选想法的问题框架、actors、flows、边界、非目标和验收样例 | 通常提交，作为 plan 的上游输入 |
| `docs/brainstorms/*-requirements.md` | 研发侧 clarified requirements / planning-readiness artifact | `spec-prd` | 保存产品 PRD 或需求材料进入研发前的 current-state evidence、Change Delta、owner 决策追踪、优先级、验收、Evidence And Assumptions；frontmatter 兼容使用历史字段 `artifact_kind: prd-requirements`，不代表替产品写 PRD，也不新增 `docs/prds/` | 通常提交，作为 plan 的上游输入；也可先进入 doc review |
| `docs/plans/*-plan.md` | 实施规划 | `spec-plan` | 保存实施单元、取舍、验证范围、风险、非目标和证据限制 | 通常提交，作为 work 或 write-tasks 的上游输入 |
| `docs/tasks/*-tasks.md` | 任务包派生 | `spec-write-tasks` | 保存从 plan 派生的 executable handoff、依赖、任务身份和 freshness contract | 视团队协作需要提交 |
| `docs/solutions/**/*` | 知识沉淀 | `spec-compound` | 保存已解决问题的可复用工程经验 | 通常提交 |

## 用途总览

| 目录类型 | 主要作用 | 典型后续用途 |
| --- | --- | --- |
| `docs/ideation/` | 候选方向与想法排序 | `spec-brainstorm` 选择一个想法继续成型；维护者回看被拒绝方向与取舍理由 |
| `docs/brainstorms/` | 需求成型 brief 与研发侧 clarified requirements | `spec-plan`、doc review、后续维护者复核 scope、acceptance examples、Change Delta、owner 决策和 evidence posture |
| `docs/plans/` / `docs/tasks/` | 计划与可执行任务交接 | `spec-work`、`write-tasks` public workflow、code/doc review；计划中的 evidence posture 说明 direct source reads、验证命令、限制和源码验证要求 |
| `docs/solutions/` | 可复用工程知识 | 后续 brainstorm/plan/work/debug/review 复用经验 |
| `config/` | setup-owned machine facts | mcp-setup 前置校验、host readiness 指针、required helper readiness、candidate `native_tools[]` / `native_resources[]`、fallback 能力判断 |
| `workspace/` | parent workspace advisory summaries | 多仓父目录下展示 child repo 候选、scenario fingerprint、批量维护结果和 parent orphan quarantine；不作为 repo-local truth |
| `audits/skill-audit/` | skill audit execution artifacts | 维护者读取审计摘要、P0/P1 evidence、score signals 和改进计划 |
| `app-audit/runs/` | App consistency audit execution artifacts | 评审者读取静态一致性报告、degraded modes、issues 和 runtime follow-up 建议 |
| `verification/*` | 验证证据投递目录 | `doctor` 校验与汇总 |
| `workflows/spec-work/*` | Work run evidence | 后续 `spec-code-review` 可通过 source-owned reader best-effort 读取 `direct_evidence_used`；缺失、not-readable 或 scope mismatch 时只在 Coverage 记录 unavailable/stale |
| `quality-gates/*` | 质量门机器结果 | gate 结果留痕与失败主题沉淀 |
| `<os-temp>/spec-first/spec-code-review/*` | Code review 临时 handoff | 当前 run 的 reviewer/orchestrator 协调，不作为 repo-local durable artifact |

## 阶段 → 读取方速查

| 产物目录 | 主要读取方 | 读取发生阶段 | 读取目的 |
| --- | --- | --- | --- |
| `config/` | `spec-mcp-setup`、`doctor`、相关 workflow | mcp-setup preflight / host readiness selection | 校验 baseline、required helper readiness、artifact path contract 和 fallback 能力；不把 discovery facts 当 query-ready evidence |
| `workspace/` | 父 workspace 下的 LLM workflow、维护者 | workspace 只读定位或批量维护后 | 查看 child repo 候选、per-child setup summary 和 next action；不替代 child repo source truth |
| `audits/skill-audit` | 维护者、`spec-skill-audit` 后续 LLM 审查 | skill 审计后 | 查看 deterministic facts、score signals、P0/P1 evidence 和 patch preview 建议 |
| `app-audit/runs/<run-id>` | 评审者、`spec-code-review` headless 调用、后续 QA / runtime validation | App 一致性审查后 | 查看 PRD/Figma/source 一致性问题、证据链、降级范围和运行时验证建议 |
| `verification/<slug>` | `src/cli/commands/doctor.js` | `doctor` 检查阶段 | 校验 verification evidence 是否存在、有效、足够新 |
| `quality-gates/ai-dev-quality-gate` | `scripts/run-ai-dev-quality-gate.js`、`src/verification/quality-feedback.js` | AI gate 执行后 | 记录 gate 结果并提取失败主题 |
| `workflows/spec-work/<workspace-slug>/<run-id>` | `spec-code-review`、shipping handoff、维护者 | work closeout 后 | 读取 compact work evidence、验证摘要和可选 `direct_evidence_used`；不得把 run artifact 当作 source scope authority |

## 1. config/

| 项目 | 内容 |
| --- | --- |
| 阶段 | Required Harness Runtime setup facts |
| 触发 | `spec-mcp-setup` |
| 目录形状 | `.spec-first/config/` |
| 关键源码 | `skills/spec-mcp-setup/scripts/write-setup-facts.*`、`skills/spec-mcp-setup/scripts/verify-tools.*` |
| 事实边界 | setup-owned config facts；不是 mcp-setup 的结果真相源 |

### 写入内容

| 文件 | 角色 |
| --- | --- |
| `runtime-capabilities.json` | host ledger 指针、baseline 摘要、required helper readiness 和 fallback tool 能力 |

`spec-mcp-setup` 写入 setup-owned facts，但不把自然语言 setup 输出当成后续 workflow 的源码证据真相源。

## Parent workspace advisory summaries

| 项目 | 内容 |
| --- | --- |
| 阶段 | parent workspace advisory summaries |
| 触发 | 父 workspace 下运行 `spec-mcp-setup` 或显式只读定位 |
| 目录形状 | `.spec-first/workspace/` |
| 关键源码 | `skills/spec-mcp-setup/scripts/*` |
| 事实边界 | advisory workspace facts；不是任何 child repo 的 canonical truth |

### 写入内容

| 文件 | 角色 |
| --- | --- |
| `project-config-bootstrap-summary.json` | 父 workspace 下 project config bootstrap 的 per-child 汇总 |
| `mcp-setup-summary.json` | 父 workspace 下 install-mcp 的 per-child 汇总 |
| `mcp-verify-summary.json` | 父 workspace 下 verify-tools 的 per-child readiness 汇总；`parent_workspace_pollution_count` 记录本次 parent orphan quarantine 命中数 |
| `scenario-fingerprint-setup.json` | `developer-scenario-fingerprint-setup.v1`，setup-time 场景事实；包含 topology、worktree、complexity dimensions、foreign residual indicators 和 advisory limitations |
| `scenario-fingerprint.json` | `developer-scenario-fingerprint.v1`，合并 setup layer、dirty child count、build-target coverage 和 freshness signals |
| `parent-artifact-quarantine.json` | `parent-artifact-quarantine.v1`，父 workspace 下 repo-local retired residue 的 advisory quarantine；`spec-first clean --workspace-orphans` 默认只预览，`--confirm` 才删除受支持的 quarantined parent orphan 路径 |

`workspace/` 只帮助 LLM 或维护者看清候选和批量维护结果。它不能替代 child repo 内的 `.spec-first/config/`、当前源码、git diff、tests/logs、ast-grep 或 bounded direct source reads。

## Spec-work run evidence

`spec-work` 的 run artifact 写入 `.spec-first/workflows/spec-work/<workspace-slug>/<run-id>/run.json`。它是 closeout evidence，不是 plan/task 的 source authority；当前 contract 标记 `producer_available=true` 且 `workflow_integrated=false`，表示 producer 可写 schema-aligned payload，但完整 replay/retention lifecycle 仍是后续工作。

`direct_evidence_used` 是 optional compact summary，用于把 `spec-work` 从 plan envelope 消费到的 direct source evidence evidence 传递给下游 `spec-code-review`。它只保存 `capabilities_used`、`evidence_grade`、`evidence_posture`、`freshness_state`、`repo_scope`、`graph_findings_applied`、`graph_findings_as_risk_only`、`source_reads_validated` 和 `redaction_status`，不保存 raw provider output、源码摘录或 credentialed URL。Capability-class advisory candidates 的查询与采纳/拒绝摘要落 `provider_untrusted.summaries[]`；经回源确认的内容再落 `direct_evidence_used`，未确认候选只能作为 limitation。`spec-code-review` 读取失败、artifact scope 不匹配或字段缺失时，应在 Coverage 的 `direct evidence:` 行记录 unavailable/stale 并继续 direct source reads。

## Code review temporary handoff

`spec-code-review` 的 full-detail run artifact 写到当前 OS temp root 下的 `<os-temp>/spec-first/spec-code-review/<run-id>/`，不是 `.spec-first/` 目录，也不是 repo-local durable truth。实际 `<os-temp>` 由运行环境解析，例如 macOS/Linux 的 `$TMPDIR` 或 Windows 的 `%TEMP%`。它的用途是让当前 session 中的 orchestrator、headless caller 或 shipping workflow 读取 reviewer JSON、detail enrichment、autofix residuals 和 metadata。

持久化边界：

- `mode:report-only` 不写 temp artifact。
- interactive、autofix 和 headless mode 写 OS temp artifact，但它默认不提交、不承诺长期保留。
- 如果 shipping 阶段接受 residual findings，PR 描述应写 `Known Residuals`；无 PR 提交路径才写 `docs/residual-review-findings/<branch-or-head-sha>.md` 这类 concise durable summary。
- 不默认把 full-detail per-reviewer JSON bundle 复制进 `docs/` 或 `.spec-first/`。

## 2. audits/skill-audit/

| 项目 | 内容 |
| --- | --- |
| 阶段 | source skill audit |
| 触发 | `spec-skill-audit`，或直接运行 `node skills/spec-skill-audit/scripts/write-audit-artifacts.js --repo .` |
| 目录形状 | `.spec-first/audits/skill-audit/<run-id>/` 与 `.spec-first/audits/skill-audit/latest/` |
| 关键源码 | `skills/spec-skill-audit/scripts/write-audit-artifacts.js` |
| 事实边界 | 审计执行产物；不是 source truth，不进入 Git |

### 写入内容

| 文件 | 角色 |
| --- | --- |
| `skill-source-inventory.json` | source skill inventory、frontmatter、heading、declared input/output 和资源目录事实 |
| `skill-audit-report.json` | P0/P1/P2/P3 finding 聚合，P0/P1 必须保留 signal、evidence、counter-evidence、decision、reason、recommendation、confidence |
| `expert-scorecard.json` | 12 维评分信号；评分是 review signal，不是 gate |
| `security-risk-report.json` | remote script、secret access、runtime hand-edit、destructive command 等安全信号 |
| `promise-implementation-report.json` | 文档承诺、CLI 参数和脚本实际写出产物的一致性信号 |
| `governance-drift-report.json` | `skills/` 与 dual-host governance contract 的漂移信号 |
| `runtime-drift-report.json` | 生成 runtime 缺失或漂移信号；修复方式是重新 `spec-first init` |
| `trigger-routing-report.json` | trigger wording 和 workflow reference 的确定性信号 |
| `boundary-overlap-matrix.json` | skill 职责重叠候选；最终是否冲突由 LLM 判断 |
| `skill-audit-summary.md` | 面向维护者的摘要入口 |
| `skill-improvement-plan.md` | 按 P0/P1/P2 分层的改进计划 |
| `patch-preview/*` | 仅在显式传 `--patch-preview` 时生成的建议，不会修改源码 |

协作规则：

- `.spec-first/audits/` 已被 `.gitignore` 忽略，提交时不带这些产物
- 需要审单个 skill 时使用 `--target skills/<skill-name>` 或宿主入口后跟 `skills/<skill-name>`
- runtime drift finding 的修复方式是 `spec-first init` 并选择目标宿主，不是手改 `.claude/`、`.codex/`、`.agents/skills/`

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
