# Agent Lifecycle Catalog

本文件是 `agents/*.agent.md` 的 source-level 使用地图，用于说明 51 个 agent 在什么场景下应被 workflow 或维护者选择。它不是运行时调度器，不替代 agent frontmatter，不授权新增自动 dispatch，也不改变 Claude/Codex generated runtime mirrors。

## Source And Boundary

| 项 | 说明 |
|---|---|
| Source refs | `agents/*.agent.md` frontmatter、`docs/workflow-skill-agent-map.md`、`docs/contracts/workflows/review-finding.md` |
| Authority | advisory catalog；agent 文件和 workflow prompt 仍是具体执行 source |
| Primary consumers include | `spec-code-review`、`spec-doc-review`、`spec-plan`、`spec-ideate`、`spec-compound`、`spec-sessions`、`spec-work` UI/Figma flows、`spec-polish-beta`、`spec-slack-research`、release/migration handoff、standalone/manual callers、agent 维护者 |
| Non-goals | 不做调度器、不删 agent、不强制 schema migration、不把 deep-dive agent 变 always-on、不新增 runtime state |

维护规则：

- 新增、删除或重命名 `agents/*.agent.md` 时同步更新本文件。
- 如果 workflow 实际 dispatch 规则与本文件冲突，先回源到对应 workflow skill 和 agent frontmatter，再修正本 catalog。
- `deprecated candidate` 只表示需要确认消费者或合并路径，不等于已经退役。
- reviewer 输出应尽量映射到 `review-finding.v1` 的共享字段；`spec-code-review` reviewer JSON 仍以 `skills/spec-code-review/references/findings-schema.json` 为准。

## Lifecycle Definitions

Lifecycle 是 per-consumer classification，不是 agent 的全局唯一属性。一个 agent 在某个 workflow 里可能是默认核心，在另一个 workflow 里仍是 conditional 或 deep-dive；遇到这种情况，catalog 行必须在“什么时候使用”或 note 中写清具体 consumer。

| Lifecycle | 含义 | 使用边界 |
|---|---|---|
| `always-on` | 至少一个列出的 consumer 默认会考虑或默认 dispatch；例如 full/default core review、默认 grounding path | 必须说明默认发生在哪个 consumer；scale-aware minimum set 或用户 opt-out 可以按 workflow 合同跳过 |
| `conditional` | 满足明确 diff、文档、技术栈、风险或用户请求信号时使用 | 需要 trigger；无触发信号时不派发 |
| `deep-dive` | 专项研究、专项审计、复杂背景调查或显式 opt-in 时使用 | 不作为普通 review 默认 reviewer |
| `deprecated candidate` | 消费者不清、能力与其他 agent 重叠或偏旧场景 | 保留 source，等待消费者回源后合并、降级或退役 |

## Shared Finding Shape

面向 downstream handoff 的 compact summary 应映射到 `review-finding.v1` 的共享字段，便于跨 workflow 合并、去重和后续处理。Workflow-specific reviewer return schema 不被本节替代：`spec-code-review` 仍使用 `skills/spec-code-review/references/findings-schema.json` 的 P0-P3 severity 与 0/25/50/75/100 confidence anchors，`spec-doc-review` 仍使用自己的 persona findings schema。

```json
{
  "schema_version": "spec-first.review-finding.v1",
  "finding_id": "F-001",
  "severity": "blocking|high|medium|low|info",
  "category": "requirements|architecture|code-quality|test|security|performance|ux|i18n|analytics|changelog|documentation",
  "title": "简洁的 finding 标题",
  "description": "问题是什么，以及为什么重要",
  "evidence": [
    {
      "type": "file|diff|test|external-tool|standard|requirement|compound|artifact",
      "path": "repo-relative/path",
      "anchor": "line、section、symbol、command 或 artifact key",
      "summary": "为什么这条 evidence 支持 finding"
    }
  ],
  "impact": "未解决时的具体风险",
  "recommendation": "最小可辩护修复或下一步动作",
  "owner": "review-fixer|downstream-resolver|human|release",
  "requires_verification": true,
  "requires_changelog": true,
  "confidence": "high|medium|low",
  "residual_status": "unresolved|applied|deferred|accepted|not_applicable",
  "extensions": {}
}
```

领域 agent 可以保留自己的专业字段，但 downstream mapped summary 不能省略 evidence、impact、recommendation 和 confidence。没有直接 source/test/log/contract evidence 的结论不能映射成 high-confidence finding；应留在 workflow-specific advisory、residual risk、deferred question 或 `extensions` 中。

## Lifecycle Catalog

| Agent | Lifecycle | 主要消费者 | 什么时候使用 | 不该什么时候使用 | Output contract status | Overlap / lifecycle note |
|---|---|---|---|---|---|---|
| `spec-adversarial-document-reviewer` | `conditional` | `spec-doc-review` | 文档超过 5 个需求/实现单元、含重大架构决策、高风险领域或新抽象 | 低风险 copy edit 或单点文案修正 | doc-review finding，映射 `review-finding.v1` | 与 product/scope/security lens 分工：它挑战假设和决策承压能力 |
| `spec-adversarial-reviewer` | `conditional` | `spec-code-review` | diff 较大或触及 auth、payments、data mutation、external API 等高风险域 | 小型机械改动或无行为变化文档改动 | code-review reviewer schema | 与 correctness 不重复；它构造失败场景 |
| `spec-agent-native-reviewer` | `always-on` | `spec-code-review`、agent-native 审查 | `spec-code-review` full/default core 默认调度；也可用于 UI action、agent tools、system prompts 或 agent parity 专项审查 | scale-aware minimum set 可跳过；无 agent/user parity surface 时通常应返回无 finding | code-review reviewer schema | 与 CLI readiness 分工：它看 action/context parity |
| `spec-ankane-readme-writer` | `deprecated candidate` | 手动文档写作 | 明确 Ruby gem README 且需要 Ankane 风格 | 普通 README、spec-first README、review persona | prose only | 消费者不清；新增使用前先确认是否仍需独立 agent |
| `spec-api-contract-reviewer` | `conditional` | `spec-code-review` | API routes、request/response types、serialization、versioning、exported signatures 变化 | internal-only helper 或无 public contract 变化 | code-review reviewer schema | 与 schema drift 分工：它看 consumer-facing contract |
| `spec-architecture-strategist` | `deep-dive` | `spec-plan`、专项 review | 新服务、结构重构、跨模块边界、长期设计取舍 | 小修小补或已有 plan 明确的执行任务 | prose / decision findings | 与 maintainability 重叠；仅在架构取舍足够重大时使用 |
| `spec-best-practices-researcher` | `deep-dive` | `spec-plan`、`spec-compound`、research phase | 需要外部最佳实践、社区惯例或实现 guidance | 当前 source 足以判断，或用户不需要外部资料 | research digest | 与 framework-docs 分工：它看 broader patterns，不只官方版本文档 |
| `spec-cli-agent-readiness-reviewer` | `deep-dive` | CLI 专项审查、`spec-code-review` 条件深审 | CLI source/plan/spec 需要完整 agent-readiness rubric | 普通 CLI diff 默认审查 | specialized readiness findings | 与 `spec-cli-readiness-reviewer` 重叠；它是深审版 |
| `spec-cli-readiness-reviewer` | `conditional` | `spec-code-review` | CLI command definitions、argument parsing、handler implementation 变化 | 非 CLI 改动 | code-review reviewer schema | 普通 code-review 条件 persona |
| `spec-code-simplicity-reviewer` | `conditional` | `spec-code-review`、`spec-compound` | 实现完成后怀疑 YAGNI、过度抽象或可删除复杂度 | 需求本身要求完整框架或设计已被确认 | review/simplification findings | 可作为 final pass；不应替代 maintainability |
| `spec-coherence-reviewer` | `always-on` | `spec-doc-review` | requirements、plan、task-pack、review 报告内部一致性审查 | 代码 diff review | doc-review finding，映射 `review-finding.v1` | doc-review 基础 persona |
| `spec-correctness-reviewer` | `always-on` | `spec-code-review` | 行为、状态、边界条件、错误传播和 intent-vs-implementation 检查 | 纯文档改动或无行为变化 | code-review reviewer schema | code-review 基础 persona |
| `spec-data-integrity-guardian` | `deep-dive` | `spec-compound`、专项数据审查 | 资金、订单、隐私、持久化状态一致性或生产数据安全 | 普通 UI/文档改动 | prose / data risk findings | 与 data migration reviewers 重叠；偏数据完整性专项 |
| `spec-data-migration-expert` | `deep-dive` | 专项 migration review | 高风险 backfill、ID mapping、enum conversion、production data transformation | 简单 migration diff 默认审查 | migration risk findings | 与 `spec-data-migrations-reviewer` 分层：expert 是专项深审 |
| `spec-data-migrations-reviewer` | `conditional` | `spec-code-review` | migration files、schema changes、data transformations、backfill scripts | 无数据结构或生产数据影响 | code-review reviewer schema | 普通 migration 条件 persona |
| `spec-deployment-verification-agent` | `deep-dive` | release / migration handoff | 需要 Go/No-Go checklist、rollback、monitoring、SQL verification queries | 普通本地代码 review | deployment checklist | 应保持 read-only verification posture |
| `spec-design-implementation-reviewer` | `conditional` | UI review、`spec-polish-beta` 类流程 | 有 live UI、screenshots 或 Figma facts，可比较实现和设计 | 无视觉 evidence 时只能输出 insufficient evidence | visual review prose | 与 design-lens 分工：它审实现还原 |
| `spec-design-iterator` | `deep-dive` | UI polish / design iteration | 用户要求迭代优化，或 1-2 次设计尝试后仍不理想 | 默认文档/代码 review | iteration summary | 不应作为默认 reviewer；需要明确 stop criteria |
| `spec-design-lens-reviewer` | `conditional` | `spec-doc-review` | 文档涉及 IA、交互状态、用户流、响应式或 accessibility | 后端-only 或无用户体验决策 | doc-review finding，映射 `review-finding.v1` | 与 implementation reviewer 分工：它看计划层设计缺口 |
| `spec-dhh-rails-reviewer` | `conditional` | `spec-code-review` | Rails diff 引入架构选择、抽象或可能违背框架路线 | 非 Rails 项目或已确认本地标准冲突 | code-review reviewer schema | style lens 不能覆盖 confirmed project standards |
| `spec-feasibility-reviewer` | `always-on` | `spec-doc-review` | plan/task/requirements 的可实现性、依赖缺口、迁移风险 | 已经明确的小型执行任务 | doc-review finding，映射 `review-finding.v1` | doc-review 基础 persona |
| `spec-figma-design-sync` | `deep-dive` | UI/Figma sync 工作 | 有 Figma design source 且要同步实现 | 无 Figma/source evidence | visual diff / fix summary | 外部工具边界强；需要 evidence/fallback |
| `spec-framework-docs-researcher` | `conditional` | `spec-plan`、research phase | 需要官方文档、版本约束、framework-specific implementation pattern | 本地代码和已有 docs 已足够 | research digest with sources | 与 best-practices 分工：优先官方/版本资料 |
| `spec-git-history-analyzer` | `deep-dive` | planning/review research | 需要历史决策、演变原因、blame/log evidence | 当前 source 已能回答 | history digest | history 是 advisory，不是 current truth |
| `spec-issue-intelligence-analyst` | `deep-dive` | `spec-ideate`、issue research | 需要 GitHub issue landscape、用户痛点、趋势 | 单个 bugfix 或没有 issue tracker 上下文 | issue intelligence digest | 需 GitHub auth/privacy/rate-limit 边界 |
| `spec-julik-frontend-races-reviewer` | `conditional` | `spec-code-review` | async UI、Stimulus/Turbo lifecycle、DOM timing-sensitive behavior | 非前端状态流 | code-review reviewer schema | 专注 race / janky UI failure modes |
| `spec-kieran-python-reviewer` | `conditional` | `spec-code-review` | Python diff | 非 Python 改动 | code-review reviewer schema | stack-specific lens |
| `spec-kieran-rails-reviewer` | `conditional` | `spec-code-review` | Rails application code diff | 非 Rails 改动 | code-review reviewer schema | 与 DHH reviewer 分工：清晰度/规范 vs opinionated Rails philosophy |
| `spec-kieran-typescript-reviewer` | `conditional` | `spec-code-review` | TypeScript / JavaScript diff | 非 TS/JS 改动 | code-review reviewer schema | stack-specific lens |
| `spec-learnings-researcher` | `always-on` | `spec-ideate`、`spec-code-review`、`spec-plan`、`spec-work` | `spec-code-review` full/default core 默认调度；`spec-ideate` repo/elsewhere-software grounding 默认调度；`spec-plan`/`spec-work` 在历史经验相关时使用 | `spec-ideate` elsewhere-non-software 默认跳过；经验不能替代当前 source evidence | learning recall digest | recall is advisory；必须回源确认；同一 agent 在不同 consumer 中 lifecycle 不同 |
| `spec-maintainability-reviewer` | `always-on` | `spec-code-review`、`spec-doc-review`（minimum-set posture） | 结构质量、复杂度、耦合、命名、死代码、抽象债；`spec-doc-review` minimum-set posture（低风险文档审查）和 full-set 均默认包含 | `spec-code-review` 中纯文档改动不适用；`spec-doc-review` 中非 minimum-set 且非 full-set 场景不触发 | code-review reviewer schema | code-review 基础 persona；doc-review minimum-set 的默认成员，full-set 也包含 |
| `spec-pattern-recognition-specialist` | `deprecated candidate` | `spec-compound`、专项 pattern review | 多处重复模式、抽象候选、命名一致性研究 | 单点修复或已有 maintainability finding 足够 | prose / pattern findings | 与 learnings/architecture/maintainability 重叠，需确认消费者 |
| `spec-performance-oracle` | `deep-dive` | `spec-compound`、专项性能审查 | 明确性能瓶颈、算法复杂度、数据库/内存/扩展性专项 | 普通 code review 默认触发 | performance analysis | 与 performance reviewer 分层：oracle 是深审 |
| `spec-performance-reviewer` | `conditional` | `spec-code-review` | database queries、loop-heavy transforms、cache、I/O-intensive paths | 非性能相关改动 | code-review reviewer schema | 普通性能条件 persona |
| `spec-pr-comment-resolver` | `conditional` | `resolve-pr-feedback` | 处理一个 PR review feedback item 并准备 reply text | 无 PR feedback 上下文 | structured reply summary | 不是通用 code reviewer |
| `spec-previous-comments-reviewer` | `conditional` | `spec-code-review` | PR 有既有 review comments 或 threads，需要检查是否复发/已处理 | 无历史 comments | code-review reviewer schema | 依赖 PR/comment facts |
| `spec-product-lens-reviewer` | `conditional` | `spec-doc-review` | 文档包含可挑战的产品前提、战略取舍、用户影响 | 已确认的纯执行任务 | doc-review finding，映射 `review-finding.v1` | 不用产品偏好覆盖 owner decision |
| `spec-project-standards-reviewer` | `always-on` | `spec-code-review` | 对照 AGENTS/CLAUDE、directory rules、confirmed `docs/standards` | 无 confirmed active standards 时只可说明未适用 | code-review reviewer schema | code-review 基础 persona，但 standards 必须 confirmed/scope matched |
| `spec-reliability-reviewer` | `conditional` | `spec-code-review` | error handling、retries、timeouts、health checks、background jobs、async handlers | 无运行时 failure mode 变化 | code-review reviewer schema | 专注生产可靠性 |
| `spec-repo-research-analyst` | `deep-dive` | `spec-plan`、research phase | 新代码库上手、结构/约定/影响面研究 | 已定位文件的小改 | repo research digest | 不应代替 bounded direct reads 的最终证据 |
| `spec-schema-drift-detector` | `conditional` | `spec-code-review` | PR 含 database schema changes，需要核对 schema drift | 非 DB schema/migration 改动 | drift finding | 与 API contract 分工：它看 schema.rb 与 migrations 对齐 |
| `spec-scope-guardian-reviewer` | `conditional` | `spec-doc-review` | minimum-set（when scope is relevant）和 full-set 均包含；"scope relevant"门槛极低（plan 有 12 个需求即触发），实践中几乎总触发 | scope 明确不相关时可跳过；minimum-set 之外的场景需显式判断 | doc-review finding，映射 `review-finding.v1` | 与 adversarial/product lens 分工：它看 right-sizing；minimum-set 默认成员（有条件），门槛极低，lifecycle 保持 conditional 但实践接近 always-on |
| `spec-security-lens-reviewer` | `conditional` | `spec-doc-review` | plan/requirements 涉及 auth/authz、data exposure、API attack surface | 普通实现细节或无安全面 | doc-review finding，映射 `review-finding.v1` | 计划层安全，不是代码漏洞审计 |
| `spec-security-reviewer` | `conditional` | `spec-code-review` | auth middleware、public endpoints、user input、permission checks、secrets | 无安全边界变化 | code-review reviewer schema | 普通安全条件 persona |
| `spec-security-sentinel` | `deprecated candidate` | `spec-compound`、安全专项审计 | 明确安全专项审计或 knowledge capture | 默认 code review | prose / security audit findings | 与 `spec-security-reviewer`、`spec-security-lens-reviewer` 重叠，需确认是否合并为 deep-dive |
| `spec-session-historian` | `conditional` | `spec-sessions` | `spec-sessions` 已提取 session skeleton/error files，需要综合历史会话 | 直接无输入 dispatch，或当前 source 可证明事实时优先 source | session synthesis prose | 不直接作为普通 reviewer |
| `spec-slack-researcher` | `deep-dive` | `spec-slack-research`、opt-in research | 用户明确要求 Slack/组织上下文，或 workflow opt-in | 无组织上下文授权或无需外部组织事实 | Slack research digest | 需 workspace identity / privacy boundary |
| `spec-spec-flow-analyzer` | `deep-dive` | `spec-plan`、flow analysis | spec/plan/feature description 需要用户流完整性、edge case discovery | 普通 code review | flow analysis findings | 可作为 plan research，不是 implementation reviewer |
| `spec-swift-ios-reviewer` | `conditional` | `spec-code-review` | Swift、SwiftUI、UIKit、iOS entitlements、privacy manifests、Core Data、SPM、pbxproj semantic changes | 非 iOS/Swift 改动 | code-review reviewer schema | stack-specific lens |
| `spec-testing-reviewer` | `always-on` | `spec-code-review` | 测试覆盖、弱断言、脆弱测试、缺失 error/edge path | 纯文档改动 | code-review reviewer schema | code-review 基础 persona |
| `spec-web-researcher` | `always-on` | `spec-ideate`、research phase | `spec-ideate` repo/elsewhere grounding 默认调度；其他 research phase 在需要外部 prior art、竞品、市场信号、跨域类比或高时效 web context 时使用 | 用户明确要求 no external research / skip web research 时跳过；本地事实问题优先用 source evidence | external research digest | 外部事实必须带来源和 recency 限制；同一 agent 在非 ideate research 中可视为 deep-dive |

## Overlap Groups To Watch

| Group | Agents | 建议 |
|---|---|---|
| Security | `spec-security-reviewer`, `spec-security-lens-reviewer`, `spec-security-sentinel` | 保持 code/doc/deep-dive 三层；确认 `sentinel` 是否仍需独立，否则降为 deprecated candidate |
| Performance | `spec-performance-reviewer`, `spec-performance-oracle` | reviewer 做条件 code review，oracle 只做专项深审或 compound |
| CLI readiness | `spec-cli-readiness-reviewer`, `spec-cli-agent-readiness-reviewer` | 普通 diff 用 reviewer，专项 CLI agent-readiness audit 用 deep-dive |
| Data migration | `spec-data-migrations-reviewer`, `spec-data-migration-expert`, `spec-data-integrity-guardian`, `spec-deployment-verification-agent` | 按普通 migration review、生产数据深审、数据完整性、部署验证四层分工 |
| Design/Figma | `spec-design-lens-reviewer`, `spec-design-implementation-reviewer`, `spec-design-iterator`, `spec-figma-design-sync` | plan lens、implementation visual check、iteration loop、Figma sync 分开，缺视觉 evidence 时降级 |
| Research | `spec-best-practices-researcher`, `spec-framework-docs-researcher`, `spec-web-researcher`, `spec-slack-researcher`, `spec-issue-intelligence-analyst`, `spec-repo-research-analyst`, `spec-git-history-analyzer`, `spec-session-historian`, `spec-learnings-researcher` | 明确事实来源和 authority；外部/历史/组织/learning 都是 advisory，当前 source/test/log 仍是最终确认依据 |
| Style / stack lens | `spec-dhh-rails-reviewer`, `spec-kieran-rails-reviewer`, `spec-kieran-python-reviewer`, `spec-kieran-typescript-reviewer`, `spec-swift-ios-reviewer`, `spec-julik-frontend-races-reviewer` | 按技术栈触发；本地 confirmed standards 优先于个人风格 lens |
