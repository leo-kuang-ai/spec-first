# Skill / Agent 详细审查报告索引

## 1. 审查说明

本目录基于 `../2026-06-20-全量-skill-agent-优化建议.md` 生成逐项详细审查报告。每份单项报告都按三个视角合议：`$yao-meta-skill`、`$skill-creator:skill-creator`、spec-first 项目架构师，并区分事实、推断、假设和待验证项。

本次审查只写 source 文档，不修改 `skills/`、`agents/`、CLI 或 generated runtime mirrors。

> 2026-07-08 freshness note：本目录是 2026-07-02 之前 skill/agent inventory 的历史审查证据。2026-07-07 完整退役 standards governance 后，涉及 standards governance skill 与 standards reviewer 的单项报告不再代表当前 source。

## 2. 报告清单

| 序号 | 类型 | 名称 | 报告文件 | 最终建议 | 优先级 |
|---|---|---|---|---|---|
| 1 | Skill | `agent-native-architecture` | `skill/Skill-01-agent-native-architecture-详细审查报告.md` | 优化 | P2 |
| 2 | Skill | `agent-native-audit` | `skill/Skill-02-agent-native-audit-详细审查报告.md` | 重构 | P1 |
| 3 | Skill | `changelog` | `skill/Skill-03-changelog-详细审查报告.md` | 优化 | P1 |
| 4 | Skill | `feature-video` | `skill/Skill-04-feature-video-详细审查报告.md` | 优化 | P1 |
| 5 | Skill | `frontend-design` | `skill/Skill-05-frontend-design-详细审查报告.md` | 优化 | P1 |
| 6 | Skill | `gemini-imagegen` | `skill/Skill-06-gemini-imagegen-详细审查报告.md` | 优化 | P1 |
| 7 | Skill | `git-clean-gone-branches` | `skill/Skill-07-git-clean-gone-branches-详细审查报告.md` | 优化 | P1 |
| 8 | Skill | `git-commit` | `skill/Skill-08-git-commit-详细审查报告.md` | 优化 | P1 |
| 9 | Skill | `git-commit-push-pr` | `skill/Skill-09-git-commit-push-pr-详细审查报告.md` | 优化 | P1 |
| 10 | Skill | `git-worktree` | `skill/Skill-10-git-worktree-详细审查报告.md` | 优化 | P1 |
| 11 | Skill | `proof` | `skill/Skill-11-proof-详细审查报告.md` | 优化 | P1 |
| 12 | Skill | `report-bug` | `skill/Skill-12-report-bug-详细审查报告.md` | 优化 | P1 |
| 13 | Skill | `resolve-pr-feedback` | `skill/Skill-13-resolve-pr-feedback-详细审查报告.md` | 优化 | P1 |
| 14 | Skill | `spec-app-consistency-audit` | `skill/Skill-14-spec-app-consistency-audit-详细审查报告.md` | 优化 | P1 |
| 15 | Skill | `spec-brainstorm` | `skill/Skill-15-spec-brainstorm-详细审查报告.md` | 优化 | P1 |
| 16 | Skill | `spec-code-review` | `skill/Skill-16-spec-code-review-详细审查报告.md` | 重构 | P1 |
| 17 | Skill | `spec-compound` | `skill/Skill-17-spec-compound-详细审查报告.md` | 重构 | P1 |
| 18 | Skill | `spec-compound-refresh` | `skill/Skill-18-spec-compound-refresh-详细审查报告.md` | 重构 | P1 |
| 19 | Skill | `spec-debug` | `skill/Skill-19-spec-debug-详细审查报告.md` | 优化 | P2 |
| 20 | Skill | `spec-dhh-rails-style` | `skill/Skill-20-spec-dhh-rails-style-详细审查报告.md` | 优化 | P2 |
| 21 | Skill | `spec-doc-review` | `skill/Skill-21-spec-doc-review-详细审查报告.md` | 优化 | P1 |
| 22 | Skill | `spec-ideate` | `skill/Skill-22-spec-ideate-详细审查报告.md` | 优化 | P1 |
| 23 | Skill | `spec-mcp-setup` | `skill/Skill-23-spec-mcp-setup-详细审查报告.md` | 优化 | P1 |
| 24 | Skill | `spec-optimize` | `skill/Skill-24-spec-optimize-详细审查报告.md` | 重构 | P1 |
| 25 | Skill | `spec-plan` | `skill/Skill-25-spec-plan-详细审查报告.md` | 重构 | P1 |
| 26 | Skill | `spec-polish-beta` | `skill/Skill-26-spec-polish-beta-详细审查报告.md` | 优化 | P2 |
| 27 | Skill | `spec-prd` | `skill/Skill-27-spec-prd-详细审查报告.md` | 优化 | P2 |
| 28 | Skill | `spec-release-notes` | `skill/Skill-28-spec-release-notes-详细审查报告.md` | 优化 | P2 |
| 29 | Skill | `spec-sessions` | `skill/Skill-29-spec-sessions-详细审查报告.md` | 优化 | P1 |
| 30 | Skill | `retired-skill-review` | `skill/Skill-30-retired-skill-review-详细审查报告.md` | 优化 | P1 |
| 31 | Skill | `spec-slack-research` | `skill/Skill-31-spec-slack-research-详细审查报告.md` | 优化 | P1 |
| 32 | Skill | `spec-work` | `skill/Skill-32-spec-work-详细审查报告.md` | 重构 | P1 |
| 33 | Skill | `spec-write-tasks` | `skill/Skill-33-spec-write-tasks-详细审查报告.md` | 优化 | P2 |
| 34 | Skill | `test-browser` | `skill/Skill-34-test-browser-详细审查报告.md` | 优化 | P1 |
| 35 | Skill | `test-xcode` | `skill/Skill-35-test-xcode-详细审查报告.md` | 优化 | P1 |
| 36 | Skill | `using-spec-first` | `skill/Skill-36-using-spec-first-详细审查报告.md` | 优化 | P2 |
| 37 | Agent | `spec-adversarial-document-reviewer` | `agent/Agent-01-spec-adversarial-document-reviewer-详细审查报告.md` | 优化 | P2 |
| 38 | Agent | `spec-adversarial-reviewer` | `agent/Agent-02-spec-adversarial-reviewer-详细审查报告.md` | 优化 | P2 |
| 39 | Agent | `spec-agent-native-reviewer` | `agent/Agent-03-spec-agent-native-reviewer-详细审查报告.md` | 优化 | P2 |
| 40 | Agent | `spec-ankane-readme-writer` | `agent/Agent-04-spec-ankane-readme-writer-详细审查报告.md` | 废弃 | P1 |
| 41 | Agent | `spec-api-contract-reviewer` | `agent/Agent-05-spec-api-contract-reviewer-详细审查报告.md` | 优化 | P2 |
| 42 | Agent | `spec-architecture-strategist` | `agent/Agent-06-spec-architecture-strategist-详细审查报告.md` | 优化 | P1 |
| 43 | Agent | `spec-best-practices-researcher` | `agent/Agent-07-spec-best-practices-researcher-详细审查报告.md` | 优化 | P1 |
| 44 | Agent | `spec-cli-agent-readiness-reviewer` | `agent/Agent-08-spec-cli-agent-readiness-reviewer-详细审查报告.md` | 重构 | P1 |
| 45 | Agent | `spec-cli-readiness-reviewer` | `agent/Agent-09-spec-cli-readiness-reviewer-详细审查报告.md` | 优化 | P2 |
| 46 | Agent | `spec-code-simplicity-reviewer` | `agent/Agent-10-spec-code-simplicity-reviewer-详细审查报告.md` | 优化 | P2 |
| 47 | Agent | `spec-coherence-reviewer` | `agent/Agent-11-spec-coherence-reviewer-详细审查报告.md` | 优化 | P2 |
| 48 | Agent | `spec-correctness-reviewer` | `agent/Agent-12-spec-correctness-reviewer-详细审查报告.md` | 优化 | P2 |
| 49 | Agent | `spec-data-integrity-guardian` | `agent/Agent-13-spec-data-integrity-guardian-详细审查报告.md` | 优化 | P1 |
| 50 | Agent | `spec-data-migration-expert` | `agent/Agent-14-spec-data-migration-expert-详细审查报告.md` | 优化 | P1 |
| 51 | Agent | `spec-data-migrations-reviewer` | `agent/Agent-15-spec-data-migrations-reviewer-详细审查报告.md` | 优化 | P2 |
| 52 | Agent | `spec-deployment-verification-agent` | `agent/Agent-16-spec-deployment-verification-agent-详细审查报告.md` | 优化 | P1 |
| 53 | Agent | `spec-design-implementation-reviewer` | `agent/Agent-17-spec-design-implementation-reviewer-详细审查报告.md` | 优化 | P1 |
| 54 | Agent | `spec-design-iterator` | `agent/Agent-18-spec-design-iterator-详细审查报告.md` | 优化 | P1 |
| 55 | Agent | `spec-design-lens-reviewer` | `agent/Agent-19-spec-design-lens-reviewer-详细审查报告.md` | 优化 | P2 |
| 56 | Agent | `spec-dhh-rails-reviewer` | `agent/Agent-20-spec-dhh-rails-reviewer-详细审查报告.md` | 优化 | P2 |
| 57 | Agent | `spec-feasibility-reviewer` | `agent/Agent-21-spec-feasibility-reviewer-详细审查报告.md` | 优化 | P2 |
| 58 | Agent | `spec-figma-design-sync` | `agent/Agent-22-spec-figma-design-sync-详细审查报告.md` | 重构 | P1 |
| 59 | Agent | `spec-framework-docs-researcher` | `agent/Agent-23-spec-framework-docs-researcher-详细审查报告.md` | 优化 | P1 |
| 60 | Agent | `spec-git-history-analyzer` | `agent/Agent-24-spec-git-history-analyzer-详细审查报告.md` | 优化 | P2 |
| 61 | Agent | `spec-issue-intelligence-analyst` | `agent/Agent-25-spec-issue-intelligence-analyst-详细审查报告.md` | 优化 | P1 |
| 62 | Agent | `spec-julik-frontend-races-reviewer` | `agent/Agent-26-spec-julik-frontend-races-reviewer-详细审查报告.md` | 优化 | P2 |
| 63 | Agent | `spec-kieran-python-reviewer` | `agent/Agent-27-spec-kieran-python-reviewer-详细审查报告.md` | 优化 | P2 |
| 64 | Agent | `spec-kieran-rails-reviewer` | `agent/Agent-28-spec-kieran-rails-reviewer-详细审查报告.md` | 优化 | P2 |
| 65 | Agent | `spec-kieran-typescript-reviewer` | `agent/Agent-29-spec-kieran-typescript-reviewer-详细审查报告.md` | 优化 | P2 |
| 66 | Agent | `spec-learnings-researcher` | `agent/Agent-30-spec-learnings-researcher-详细审查报告.md` | 优化 | P2 |
| 67 | Agent | `spec-maintainability-reviewer` | `agent/Agent-31-spec-maintainability-reviewer-详细审查报告.md` | 优化 | P2 |
| 68 | Agent | `spec-pattern-recognition-specialist` | `agent/Agent-32-spec-pattern-recognition-specialist-详细审查报告.md` | 合并 | P1 |
| 69 | Agent | `spec-performance-oracle` | `agent/Agent-33-spec-performance-oracle-详细审查报告.md` | 重构 | P1 |
| 70 | Agent | `spec-performance-reviewer` | `agent/Agent-34-spec-performance-reviewer-详细审查报告.md` | 优化 | P2 |
| 71 | Agent | `spec-pr-comment-resolver` | `agent/Agent-35-spec-pr-comment-resolver-详细审查报告.md` | 优化 | P1 |
| 72 | Agent | `spec-previous-comments-reviewer` | `agent/Agent-36-spec-previous-comments-reviewer-详细审查报告.md` | 优化 | P2 |
| 73 | Agent | `spec-product-lens-reviewer` | `agent/Agent-37-spec-product-lens-reviewer-详细审查报告.md` | 优化 | P2 |
| 74 | Agent | `spec-project-standards-reviewer` | `agent/Agent-38-spec-project-standards-reviewer-详细审查报告.md` | 优化 | P2 |
| 75 | Agent | `spec-reliability-reviewer` | `agent/Agent-39-spec-reliability-reviewer-详细审查报告.md` | 优化 | P2 |
| 76 | Agent | `spec-repo-research-analyst` | `agent/Agent-40-spec-repo-research-analyst-详细审查报告.md` | 重构 | P1 |
| 77 | Agent | `spec-schema-drift-detector` | `agent/Agent-41-spec-schema-drift-detector-详细审查报告.md` | 优化 | P1 |
| 78 | Agent | `spec-scope-guardian-reviewer` | `agent/Agent-42-spec-scope-guardian-reviewer-详细审查报告.md` | 优化 | P2 |
| 79 | Agent | `spec-security-lens-reviewer` | `agent/Agent-43-spec-security-lens-reviewer-详细审查报告.md` | 优化 | P2 |
| 80 | Agent | `spec-security-reviewer` | `agent/Agent-44-spec-security-reviewer-详细审查报告.md` | 优化 | P1 |
| 81 | Agent | `spec-security-sentinel` | `agent/Agent-45-spec-security-sentinel-详细审查报告.md` | 合并 | P1 |
| 82 | Agent | `spec-session-historian` | `agent/Agent-46-spec-session-historian-详细审查报告.md` | 优化 | P2 |
| 83 | Agent | `spec-slack-researcher` | `agent/Agent-47-spec-slack-researcher-详细审查报告.md` | 优化 | P1 |
| 84 | Agent | `spec-spec-flow-analyzer` | `agent/Agent-48-spec-spec-flow-analyzer-详细审查报告.md` | 优化 | P2 |
| 85 | Agent | `spec-swift-ios-reviewer` | `agent/Agent-49-spec-swift-ios-reviewer-详细审查报告.md` | 优化 | P2 |
| 86 | Agent | `spec-testing-reviewer` | `agent/Agent-50-spec-testing-reviewer-详细审查报告.md` | 优化 | P2 |
| 87 | Agent | `spec-web-researcher` | `agent/Agent-51-spec-web-researcher-详细审查报告.md` | 重构 | P1 |

## 3. 全局终审报告

- `99-全局终审报告.md`

## 4. 推荐阅读顺序

1. 先读 `00-审查清单.md`，确认覆盖范围和原报告位置。
2. 再读 `99-全局终审报告.md`，理解全局问题分布和路线图。
3. 按 P0/P1 优先读单项报告，尤其是 `retired-skill-review`、高权限 helper、`spec-code-review`、`spec-plan`、`spec-work` 和 Agent lifecycle 相关对象。
4. 最后读 P2 对象，作为中期 progressive disclosure、eval fixture 和 catalog 清理依据。

## 5. 后续优化建议

- 不要把本目录报告当作已授权 source 修改；每批实施仍需进入相应 workflow。
- P1 修改应同步 `CHANGELOG.md`、focused tests、必要的 fresh-source eval 说明。
- 涉及外部 API/MCP/current docs 的对象，实施前必须浏览官方或 primary source；无法验证的内容保留为待验证项。
- 废弃/合并候选必须先做消费者回源，避免删除仍被 workflow 使用的对象。
