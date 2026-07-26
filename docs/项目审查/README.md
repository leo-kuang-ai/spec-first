# 项目审查目录

本目录保留给需要长期沉淀的项目审查材料。

新增审查文档时，避免写入机器本地绝对路径或本地文件 URL；需要引用仓库文件时使用相对路径或稳定文档路径。

## Active Recommendations（当前未闭环建议指针）

最新审查及其衍生的 active recommendations 由下游 PRD / plan 承接，避免在历史报告里反复检索：

- **全局 Bug 审查报告**（最新，含第二轮复审）：审查见 [2026-07-26-全局bug审查报告.md](2026-07-26-全局bug审查报告.md)，执行状态见 [整改执行记录](2026-07-26-全局bug整改执行记录.md)；首轮 11 分区覆盖 src/cli 全部 + scripts/ + 108 个 skill 脚本，确认 9 条 P1、约 24 条 P2、约 20 条 P3；第二轮补漏（8 分区完成 6 个，skill-cjs 两分区因额度未复跑，第一轮覆盖仍有效）再新增 7 条 P2 与 9 条 P3，最严重为 runtime-tools-index 孤立 marker 条件触发的数据丢失、doctor 在 Windows 保留名目录崩溃、codex SessionStart 对含空格路径重复累积。五大根因模式：Windows spawn/path 系统性缺陷（evidence chain 与 update 在 Windows 不可用）、按名删除缺 ownership 检查（codex legacy 清理数据丢失类）、git C-quoted 中文路径失真、错误处理断层、确定性 gate 自身有洞。第二轮 verify subagent 因 403 额度全灭，确认改由主会话内联 node/bash 只读复现（8 处）。修复顺序建议以模式为单位分 5 个批次，Windows 清扫可并入 2026-07-05 Windows 计划。
- **项目战略与全流程验证报告**（最新）：审查见 [2026-07-26-项目战略与全流程验证报告.md](2026-07-26-项目战略与全流程验证报告.md)；确定性地板经实证验证扎实（typecheck/lint/unit/smoke/integration/mcp-setup/pack/tarball 安装 E2E 全过），但确认三项 P0：141 个未发版提交的发布债、STRATEGY.md 缺失与 Milestone 表超期、采纳漏斗为零（周下载约 247/62 star）。战略结论：新增能力默认冻结一季度，转向发版清偿、采纳最小闭环（P-friction 审计 + 首屏叙事重写）与两个差异化空白层（跨宿主 evidence gate 可独立采用形态、并行 agent 可信收敛 MVP）。LLM 语义层、preview 宿主、Windows、真发布链路未验证，相关结论保持 advisory。
- **Skill 关联关系系统审查**（最新增量刷新）：审查见 [2026-07-26-skill-flow-system-audit-refresh/](2026-07-26-skill-flow-system-audit-refresh/README.md)，当前工作树整改状态见 [SF-28～SF-35 闭环记录](2026-07-26-skill-flow-system-audit-refresh/remediation-execution-record.md)。审查在 `d939ee3c` 校准点确认 1 条 P1 与 7 条 P3；当前 source 已完成 package-local helper、producer/consumer fingerprint 对称、恢复诊断、source-command 归属、runner load safety、README token 写权和 readiness guard 整改，并以五宿主 sandbox init 与 fresh-source eval 复证。尚未 commit/push/PR，真实宿主 loader/field outcome 仍未验证。历史冻结账本见 [2026-07-18 批次](2026-07-18-skill-flow-system-audit-refresh/README.md)。
- **Review Token 消耗专项分析**（最新）：审查见 [2026-07-14-spec-review-token-consumption-analysis.md](2026-07-14-spec-review-token-consumption-analysis.md)；确认 `spec-doc-review` 的文档/公共 contract 多 persona 复制，以及 `spec-code-review` 的默认 full roster、逐 finding validator、完整 diff 重复读取、Codex 上下文继承与模型分层退化，是当前高消耗的主要结构性来源。建议先建立 run-level cost manifest，再依次收紧 validator、按风险重构 roster、隔离子 agent 上下文并实施 reviewer-specific slicing；现有 `docs/plans/2026-07-14-001-refactor-spec-doc-review-token-optimization-plan.md` 仅覆盖 doc-review prompt 分层，code-review 仍需独立收敛。
- **系统性项目审查与优化方案**（最新）：审查见 [2026-07-05-系统性项目审查与优化方案.md](2026-07-05-系统性项目审查与优化方案.md)；按 `docs/10-prompt/系统性项目审查方法.md` 重新裁决 06-15/07-02/07-03 历史 finding，确认 README/adoption-first 与五宿主 preview 已明显推进，但 P0 outcome evidence、P1 Windows workflow portability、P1 OSS governance、P1 enterprise adoption proof 与 P1 preview host honesty 仍需闭环或显式 deferred。已起三个 origin trace plan 承接或延期对应 finding：`docs/plans/2026-07-05-001-review-closure-outcome-ledger-plan.md`、`docs/plans/2026-07-05-002-windows-workflow-portability-plan.md`、`docs/plans/2026-07-05-003-oss-adoption-governance-plan.md`。
- **项目整体严格审查（历史快照）**：审查见 [2026-07-02-项目整体严格审查报告.md](2026-07-02-项目整体严格审查报告.md)；该报告按当时 source inventory 建立覆盖。2026-07-07 完整退役 standards governance 后，其 skill/agent/standards inventory 不再代表当前状态；当前 active recommendations 以 2026-07-05 系统性项目审查和后续 plan 为准。
- **AI 专家与工程效能综合审查**：审查见 [2026-07-02-ai-expert-engineering-effectiveness-review.md](2026-07-02-ai-expert-engineering-effectiveness-review.md)；核心建议是把下一阶段从继续堆机制转向证明真实工程效能，优先接通 workflow outcome 评测、采集真实用户摩擦数据、收敛 closeout/knowledge 证据闭环，并补齐 OSS/组织治理低成本信号。
- **spec-skill 体系健壮性/稳定性优化**：审查见 [2026-06-28-spec-skill-健壮性稳定性优化审查.md](2026-06-28-spec-skill-健壮性稳定性优化审查.md)；需求化为 PRD `docs/brainstorms/2026-06-28-002-spec-skill-robustness-stability-optimization-requirements.md`（40 条 requirement，R-01~R-40）。落地进度：Slice A'（R-01~R-04）、Slice B（R-40）、Slice C（R-05~R-12）、Slice D（R-24/R-25/R-26/R-37/R-38）已完成；Slice E（R-13~R-23、R-27~R-36/R-39）为 backlog。
- 其余历史报告的建议若仍 active，应在对应 PRD/plan 的 frontmatter `referenced_reviews` 中追溯，不在本 README 重复展开。

## 审查索引（按日期倒序）

| 日期 | 审查文档 | 主题 |
| --- | --- | --- |
| 2026-07-26 | [Skill 流转系统 SF-28～SF-35 整改闭环记录](2026-07-26-skill-flow-system-audit-refresh/remediation-execution-record.md) | 当前工作树逐项 disposition、五宿主 sandbox fingerprint 复证、fresh-source eval 与 claim ceiling |
| 2026-07-26 | [全局 Bug 整改执行记录](2026-07-26-全局bug整改执行记录.md) | 以当前 source 和回归证据处置 07-26 全局 Bug 报告：P1/P2 source owner 整改与 P3 补证条件 |
| 2026-07-26 | [Skill 关联关系系统审查增量刷新](2026-07-26-skill-flow-system-audit-refresh/README.md) | 对 07-18 校准点后 review-remediation 批次的增量裁决：0 REGRESSED、1 P1（LFG 6.5 helper 投射路径）、7 P3、6 类 fresh-source 语义场景 |
| 2026-07-26 | [全局 Bug 审查报告](2026-07-26-全局bug审查报告.md) | CLI 逻辑与全部脚本的分区 bug 审查（两轮）：首轮 9 P1 / 24 P2 / 20 P3，第二轮补漏再增 7 P2 / 9 P3，五大根因模式与分批修复顺序 |
| 2026-07-26 | [项目战略与全流程验证报告](2026-07-26-项目战略与全流程验证报告.md) | 定位/业界格局/战略与发布、安装、执行、skill 体系、产物的全流程实证验证：8 验证面判级、P0-P2 优化清单与分阶段行动 |
| 2026-07-18 | [Skill 关联关系系统审查当前快照刷新](2026-07-18-skill-flow-system-audit-refresh/README.md) | 基于 07-17 全量审查的冻结快照并叠加 current-source/docs 修复：11 个 P1 关闭、P1 队列清空 |
| 2026-07-17 | [Skill 关联关系系统审查](2026-07-17-skill-flow-system-audit/README.md) | 35 个 governed Skill、275 个 source 文件、157 个 canonical mention pair 的 route/handoff/consumer/authority/failure/internal-helper 全量审查 |
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
