# 项目审查目录

本目录保留给需要长期沉淀的项目审查材料。

新增审查文档时，避免写入机器本地绝对路径或本地文件 URL；需要引用仓库文件时使用相对路径或稳定文档路径。

## Active Recommendations（当前未闭环建议指针）

最新审查及其衍生的 active recommendations 由下游 PRD / plan 承接，避免在历史报告里反复检索：

- **Review Token 消耗专项分析**（最新）：审查见 [2026-07-14-spec-review-token-consumption-analysis.md](2026-07-14-spec-review-token-consumption-analysis.md)；确认 `spec-doc-review` 的文档/公共 contract 多 persona 复制，以及 `spec-code-review` 的默认 full roster、逐 finding validator、完整 diff 重复读取、Codex 上下文继承与模型分层退化，是当前高消耗的主要结构性来源。建议先建立 run-level cost manifest，再依次收紧 validator、按风险重构 roster、隔离子 agent 上下文并实施 reviewer-specific slicing；现有 `docs/plans/2026-07-14-001-refactor-spec-doc-review-token-optimization-plan.md` 仅覆盖 doc-review prompt 分层，code-review 仍需独立收敛。
- **系统性项目审查与优化方案**（最新）：审查见 [2026-07-05-系统性项目审查与优化方案.md](2026-07-05-系统性项目审查与优化方案.md)；按 `docs/10-prompt/系统性项目审查方法.md` 重新裁决 06-15/07-02/07-03 历史 finding，确认 README/adoption-first 与五宿主 preview 已明显推进，但 P0 outcome evidence、P1 Windows workflow portability、P1 OSS governance、P1 enterprise adoption proof 与 P1 preview host honesty 仍需闭环或显式 deferred。已起三个 origin trace plan 承接或延期对应 finding：`docs/plans/2026-07-05-001-review-closure-outcome-ledger-plan.md`、`docs/plans/2026-07-05-002-windows-workflow-portability-plan.md`、`docs/plans/2026-07-05-003-oss-adoption-governance-plan.md`。
- **项目整体严格审查（历史快照）**：审查见 [2026-07-02-项目整体严格审查报告.md](2026-07-02-项目整体严格审查报告.md)；该报告按当时 source inventory 建立覆盖。2026-07-07 完整退役 standards governance 后，其 skill/agent/standards inventory 不再代表当前状态；当前 active recommendations 以 2026-07-05 系统性项目审查和后续 plan 为准。
- **AI 专家与工程效能综合审查**：审查见 [2026-07-02-ai-expert-engineering-effectiveness-review.md](2026-07-02-ai-expert-engineering-effectiveness-review.md)；核心建议是把下一阶段从继续堆机制转向证明真实工程效能，优先接通 workflow outcome 评测、采集真实用户摩擦数据、收敛 closeout/knowledge 证据闭环，并补齐 OSS/组织治理低成本信号。
- **spec-skill 体系健壮性/稳定性优化**：审查见 [2026-06-28-spec-skill-健壮性稳定性优化审查.md](2026-06-28-spec-skill-健壮性稳定性优化审查.md)；需求化为 PRD `docs/brainstorms/2026-06-28-002-spec-skill-robustness-stability-optimization-requirements.md`（40 条 requirement，R-01~R-40）。落地进度：Slice A'（R-01~R-04）、Slice B（R-40）、Slice C（R-05~R-12）、Slice D（R-24/R-25/R-26/R-37/R-38）已完成；Slice E（R-13~R-23、R-27~R-36/R-39）为 backlog。
- 其余历史报告的建议若仍 active，应在对应 PRD/plan 的 frontmatter `referenced_reviews` 中追溯，不在本 README 重复展开。

## 审查索引（按日期倒序）

| 日期 | 审查文档 | 主题 |
| --- | --- | --- |
| 2026-07-14 | [Review Token 消耗专项分析](2026-07-14-spec-review-token-consumption-analysis.md) | `spec-doc-review` / `spec-code-review` 的 prompt、persona、上下文复制、validator 与 Codex dispatch 成本分析 |
| 2026-07-06 | [真实状态与提升优先级](2026-07-06-真实状态与提升优先级.md) | 当前真实状态、提升优先级和 adoption/value evidence 缺口 |
| 2026-07-06 | [Skill Prompt 精简优化方案](2026-07-06-skill-prompt-精简优化方案.md) | skill prompt token 成本、activation index 与 active body 分层优化 |
| 2026-07-05 | [系统性项目审查与优化方案](2026-07-05-系统性项目审查与优化方案.md) | 按系统性项目审查方法裁决历史 finding，输出项目事实、行业对标、短板、roadmap 与 P0/P1 origin trace plan |
| 2026-07-05 | [Windows PowerShell 修复计划](2026-07-05-windows-powershell-fix-plan.md) | Windows PowerShell 兼容性专项审查的修复计划与优先级 |
| 2026-07-05 | [Windows PowerShell 兼容性审查](2026-07-05-windows-powershell-compat-review.md) | Windows 安装、shim、doctor、init、workflow helper 与 CI 覆盖的兼容性审查 |
| 2026-07-05 | [Windows PowerShell 兼容性问题清单](2026-07-05-windows-powershell-compat-issues.md) | Windows PowerShell 兼容性待处理问题分级清单 |
| 2026-07-03 | [Windows PowerShell 修复计划](2026-07-03-windows-powershell-fix-plan.md) | Windows PowerShell 兼容性专项审查的修复计划与优先级 |
| 2026-07-03 | [Windows PowerShell 兼容性审查](2026-07-03-windows-powershell-compat-review.md) | Windows 安装、shim、doctor、init、workflow helper 与 CI 覆盖的兼容性审查 |
| 2026-07-03 | [Windows PowerShell 兼容性问题清单](2026-07-03-windows-powershell-compat-issues.md) | Windows PowerShell 兼容性待处理问题分级清单 |
| 2026-07-02 | [项目整体严格审查报告](2026-07-02-项目整体严格审查报告.md) | 历史快照；按当时项目整体审查逻辑覆盖 Harness、横向能力、纵向流程、skill/agent、产物、上下文、门禁、Evidence、Benchmark、Knowledge、工程效能与开源传播 |
| 2026-07-02 | [AI 专家与工程效能综合审查](2026-07-02-ai-expert-engineering-effectiveness-review.md) | 任务建模、上下文治理、执行控制、评测反馈、知识进化与工程效能综合评估 |
| 2026-06-28 | [spec-skill-健壮性稳定性优化审查](2026-06-28-spec-skill-健壮性稳定性优化审查.md) | skill 体系健壮性/稳定性/确定性 gate 加固（已转 PRD） |
| 2026-06-20 | [using-spec-first-skill-optimization-suggestions](2026-06-20-using-spec-first-skill-optimization-suggestions.md) | using-spec-first 入口路由优化建议 |
| 2026-06-20 | [retired-skill-review-skill-optimization-suggestions](2026-06-20-retired-skill-review-skill-optimization-suggestions.md) | retired-skill-review 优化建议 |
| 2026-06-20 | [spec-prd-skill-optimization-suggestions](2026-06-20-spec-prd-skill-optimization-suggestions.md) | spec-prd 优化建议 |
| 2026-06-15 | [项目Review与优化方案](2026-06-15-项目Review与优化方案.md) | 项目 review 与优化方案 |
| 2026-06-15 | [行业对标研究档案](2026-06-15-行业对标研究档案.md) | 行业对标研究 |
| 2026-06-14 | [达成度与闭环审查报告](2026-06-14-达成度与闭环审查报告.md) | 达成度与闭环审查 |
| 2026-06-14 | [06-10-P1-闭环裁决](2026-06-14-06-10-P1-闭环裁决.md) | P1 闭环裁决 |
| 2026-06-12 | [agent-native-architecture-audit-report](2026-06-12-agent-native-architecture-audit-report.md) | agent-native 架构审计 |
| 2026-06-11 | [契约对照全项目审计报告](2026-06-11-契约对照全项目审计报告.md) | 契约对照全项目审计 |
| 2026-06-10 | [全项目综合审查报告](2026-06-10-全项目综合审查报告.md) | 全项目综合审查 |
| 2026-05-30 | [全量战略体检-skill-agent-cli](2026-05-30-全量战略体检-skill-agent-cli.md) | skill/agent/CLI 战略体检 |
| 2026-05-30 | [codex-100轮审查后当前优化点](2026-05-30-codex-100轮审查后当前优化点.md) | codex 100 轮审查优化点 |
| 2026-05-30 | [codex-全面审查-自我进化](2026-05-30-codex-全面审查-自我进化.md)（[result](2026-05-30-codex-全面审查-自我进化-result.md)） | codex 全面审查与自我进化 |
| 2026-05-30 | [全面审查-自我进化](2026-05-30-全面审查-自我进化.md)（[result](2026-05-30-全面审查-自我进化-result.md)） | 全面审查与自我进化 |
| 2026-05-07 | [skill-agent-prompt-expert-review](2026-05-07-skill-agent-prompt-expert-review.md) | skill/agent prompt 专家审查 |
| 2026-05-07 | [source-code-comprehensive-review](2026-05-07-source-code-comprehensive-review.md) | 源码综合审查 |

新增审查文档时，同步在本索引追加一行，并在 Active Recommendations 段更新最新审查指针。
