# 项目审查目录

本目录保留给需要长期沉淀的项目审查材料。

新增审查文档时，避免写入机器本地绝对路径或本地文件 URL；需要引用仓库文件时使用相对路径或稳定文档路径。

## Active Recommendations（当前未闭环建议指针）

最新审查及其衍生的 active recommendations 由下游 PRD / plan 承接，避免在历史报告里反复检索：

- **spec-skill 体系健壮性/稳定性优化**（最新）：审查见 [2026-06-28-spec-skill-健壮性稳定性优化审查.md](2026-06-28-spec-skill-健壮性稳定性优化审查.md)；需求化为 PRD `docs/brainstorms/2026-06-28-002-spec-skill-robustness-stability-optimization-requirements.md`（40 条 requirement，R-01~R-40）。落地进度：Slice A'（R-01~R-04）、Slice B（R-40）、Slice C（R-05~R-12）、Slice D（R-24/R-25/R-26/R-37/R-38）已完成；Slice E（R-13~R-23、R-27~R-36/R-39）为 backlog。
- 其余历史报告的建议若仍 active，应在对应 PRD/plan 的 frontmatter `referenced_reviews` 中追溯，不在本 README 重复展开。

## 审查索引（按日期倒序）

| 日期 | 审查文档 | 主题 |
| --- | --- | --- |
| 2026-06-28 | [spec-skill-健壮性稳定性优化审查](2026-06-28-spec-skill-健壮性稳定性优化审查.md) | skill 体系健壮性/稳定性/确定性 gate 加固（最新，已转 PRD） |
| 2026-06-20 | [using-spec-first-skill-optimization-suggestions](2026-06-20-using-spec-first-skill-optimization-suggestions.md) | using-spec-first 入口路由优化建议 |
| 2026-06-20 | [spec-skill-audit-skill-optimization-suggestions](2026-06-20-spec-skill-audit-skill-optimization-suggestions.md) | spec-skill-audit 优化建议 |
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
