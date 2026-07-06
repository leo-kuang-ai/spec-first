# 当前项目 skills 与 CE skills 核对报告

- 核对时间：2026-04-26 00:24:13
- 当前项目 skills：`/Users/kuang/xiaobu/spec-first/skills`
- CE skills：`/Users/kuang/xiaobu/compound-engineering-plugin/plugins/compound-engineering/skills`
- 核对原则：CE 存在对应项的 skill 以 CE 最新内容为基线；当前项目保留项仅限明确属于 spec-first 的项目能力或用户指定保留能力。

## 总览

| 项目 | 数量 | 结论 |
|---|---:|---|
| CE skill 总数 | 36 | 全部纳入映射核对 |
| 当前项目 skill 总数 | 41 | 36 个 CE 映射项 + 5 个当前保留项 |
| CE 未映射项 | 0 | 无 |
| 映射后当前缺失项 | 0 | 无 |
| 未登记的当前独有项 | 0 | 无 |

## CE 到当前项目映射核对

| # | CE skill | 当前项目 skill | 状态 | 文件数 CE→当前 | references CE→当前 | scripts CE→当前 | 迁移决策 |
|---:|---|---|---|---:|---:|---:|---|
| 1 | `ce-agent-native-architecture` | `agent-native-architecture` | 已集成 | 15→15 | 14→14 | 0→0 | 以 CE 为准覆盖后按 spec-first 命名适配 |
| 2 | `ce-agent-native-audit` | `agent-native-audit` | 已集成 | 1→1 | 0→0 | 0→0 | 以 CE 为准覆盖后按 spec-first 命名适配 |
| 3 | `ce-brainstorm` | `spec-brainstorm` | 已集成 | 5→5 | 4→4 | 0→0 | 以 CE 为准覆盖后按 spec-first 命名适配 |
| 4 | `ce-clean-gone-branches` | `git-clean-gone-branches` | 已集成 | 2→2 | 0→0 | 1→1 | 以 CE 为准覆盖后按 spec-first 命名适配 |
| 5 | `ce-code-review` | `spec-code-review` | 已集成 | 11→11 | 10→10 | 0→0 | 以 CE 为准覆盖后按 spec-first 命名适配 |
| 6 | `ce-commit` | `git-commit` | 已集成 | 1→1 | 0→0 | 0→0 | 以 CE 为准覆盖后按 spec-first 命名适配 |
| 7 | `ce-commit-push-pr` | `git-commit-push-pr` | 已集成 | 1→1 | 0→0 | 0→0 | 以 CE 为准覆盖后按 spec-first 命名适配 |
| 8 | `ce-compound` | `spec-compound` | 已集成 | 4→4 | 2→2 | 0→0 | 以 CE 为准覆盖后按 spec-first 命名适配 |
| 9 | `ce-compound-refresh` | `spec-compound-refresh` | 已集成 | 4→4 | 2→2 | 0→0 | 以 CE 为准覆盖后按 spec-first 命名适配 |
| 10 | `ce-debug` | `spec-debug` | 已集成 | 4→4 | 3→3 | 0→0 | 以 CE 为准覆盖后按 spec-first 命名适配 |
| 11 | `ce-demo-reel` | `feature-video` | 已集成 | 7→7 | 5→5 | 1→1 | 以 CE 为准覆盖后按 spec-first 命名适配 |
| 12 | `ce-dhh-rails-style` | `spec-dhh-rails-style` | 已集成 | 7→7 | 6→6 | 0→0 | 以 CE 为准覆盖后按 spec-first 命名适配 |
| 13 | `ce-doc-review` | `spec-doc-review` | 已集成 | 8→8 | 7→7 | 0→0 | 以 CE 为准覆盖后按 spec-first 命名适配 |
| 14 | `ce-frontend-design` | `frontend-design` | 已集成 | 1→1 | 0→0 | 0→0 | 以 CE 为准覆盖后按 spec-first 命名适配 |
| 15 | `ce-gemini-imagegen` | `gemini-imagegen` | 已集成 | 7→7 | 0→0 | 5→5 | 以 CE 为准覆盖后按 spec-first 命名适配 |
| 16 | `ce-ideate` | `spec-ideate` | 已集成 | 4→4 | 3→3 | 0→0 | 以 CE 为准覆盖后按 spec-first 命名适配 |
| 17 | `ce-optimize` | `spec-optimize` | 已集成 | 12→12 | 7→7 | 3→3 | 以 CE 为准覆盖后按 spec-first 命名适配 |
| 18 | `ce-plan` | `spec-plan` | 已集成 | 5→5 | 4→4 | 0→0 | 以 CE 为准覆盖后按 spec-first 命名适配 |
| 19 | `ce-polish-beta` | `spec-polish-beta` | 已集成 | 16→16 | 11→11 | 4→4 | 以 CE 为准覆盖后按 spec-first 命名适配 |
| 20 | `ce-pr-description` | `spec-pr-description` | 已集成 | 1→1 | 0→0 | 0→0 | 以 CE 为准覆盖后按 spec-first 命名适配 |
| 21 | `ce-proof` | `proof` | 已集成 | 2→2 | 1→1 | 0→0 | 以 CE 为准覆盖后按 spec-first 命名适配 |
| 22 | `ce-release-notes` | `spec-release-notes` | 已集成 | 2→2 | 0→0 | 1→1 | 以 CE 为准覆盖后按 spec-first 命名适配 |
| 23 | `ce-report-bug` | `report-bug` | 已集成 | 1→1 | 0→0 | 0→0 | 以 CE 为准覆盖后按 spec-first 命名适配 |
| 24 | `ce-resolve-pr-feedback` | `resolve-pr-feedback` | 已集成 | 5→5 | 0→0 | 4→4 | 以 CE 为准覆盖后按 spec-first 命名适配 |
| 25 | `ce-session-extract` | `spec-session-extract` | 已集成 | 3→3 | 0→0 | 2→2 | 以 CE 为准覆盖后按 spec-first 命名适配 |
| 26 | `ce-session-inventory` | `spec-session-inventory` | 已集成 | 3→3 | 0→0 | 2→2 | 以 CE 为准覆盖后按 spec-first 命名适配 |
| 27 | `ce-sessions` | `spec-sessions` | 已集成 | 1→1 | 0→0 | 0→0 | 以 CE 为准覆盖后按 spec-first 命名适配 |
| 28 | `ce-setup` | `spec-setup` | 已集成 | 3→3 | 1→1 | 1→1 | 以 CE 为准覆盖后按 spec-first 命名适配 |
| 29 | `ce-slack-research` | `spec-slack-research` | 已集成 | 1→1 | 0→0 | 0→0 | 以 CE 为准覆盖后按 spec-first 命名适配 |
| 30 | `ce-test-browser` | `test-browser` | 已集成 | 1→1 | 0→0 | 0→0 | 以 CE 为准覆盖后按 spec-first 命名适配 |
| 31 | `ce-test-xcode` | `test-xcode` | 已集成 | 1→1 | 0→0 | 0→0 | 以 CE 为准覆盖后按 spec-first 命名适配 |
| 32 | `ce-update` | `spec-update` | 已集成 | 1→1 | 0→0 | 0→0 | 以 CE 为准覆盖后按 spec-first 命名适配 |
| 33 | `ce-work` | `spec-work` | 已集成 | 3→3 | 2→2 | 0→0 | 以 CE 为准覆盖后按 spec-first 命名适配 |
| 34 | `ce-work-beta` | `spec-work-beta` | 已集成 | 4→4 | 3→3 | 0→0 | 以 CE 为准覆盖后按 spec-first 命名适配 |
| 35 | `ce-worktree` | `git-worktree` | 已集成 | 2→2 | 0→0 | 1→1 | 以 CE 为准覆盖后按 spec-first 命名适配 |
| 36 | `lfg` | `lfg` | 已集成 | 2→2 | 1→1 | 0→0 | 以 CE 为准覆盖后按 spec-first 命名适配 |

## 当前项目独有 / 外部 helper 核对

| # | 当前项目 skill | 状态 | 文件数 | 说明 |
|---:|---|---|---:|---|
| 1 | `agent-browser` | 外部化 | 0 | 不再作为本地 source skill 交付；浏览器自动化由 `spec-mcp-setup` 安装 external/upstream helper tool，命令仍为 `agent-browser`。 |
| 2 | `changelog` | 保留 | 1 | 当前项目独有 changelog 生成/维护入口，保留。 |
| 3 | `spec-graph-bootstrap` | 保留 | 6 | spec-first 核心 Stage-0 / CRG bootstrap 能力，保留。 |
| 4 | `spec-mcp-setup` | 保留 | 23 | 当前项目 MCP setup 真源入口，不由 CE ce-setup 覆盖。 |
| 5 | `using-spec-first` | 保留 | 1 | 当前项目 workflow 入口治理真源，保留。 |

## 内部文件差异提示

说明：下表只展示目录文件列表层面的差异。由于迁移后会进行 `ce-*` → `spec-*` / `git-*` 等命名适配，文件内容不要求逐字节一致；此处用于确认是否存在明显漏迁移或当前项目额外保留文件。

| CE skill | 当前项目 skill | CE 有但当前缺失 | 当前额外文件 |
|---|---|---|---|
| `ce-agent-native-architecture` | `agent-native-architecture` | 无 | 无 |
| `ce-agent-native-audit` | `agent-native-audit` | 无 | 无 |
| `ce-brainstorm` | `spec-brainstorm` | 无 | 无 |
| `ce-clean-gone-branches` | `git-clean-gone-branches` | 无 | 无 |
| `ce-code-review` | `spec-code-review` | 无 | 无 |
| `ce-commit` | `git-commit` | 无 | 无 |
| `ce-commit-push-pr` | `git-commit-push-pr` | 无 | 无 |
| `ce-compound` | `spec-compound` | 无 | 无 |
| `ce-compound-refresh` | `spec-compound-refresh` | 无 | 无 |
| `ce-debug` | `spec-debug` | 无 | 无 |
| `ce-demo-reel` | `feature-video` | 无 | 无 |
| `ce-dhh-rails-style` | `spec-dhh-rails-style` | 无 | 无 |
| `ce-doc-review` | `spec-doc-review` | 无 | 无 |
| `ce-frontend-design` | `frontend-design` | 无 | 无 |
| `ce-gemini-imagegen` | `gemini-imagegen` | 无 | 无 |
| `ce-ideate` | `spec-ideate` | 无 | 无 |
| `ce-optimize` | `spec-optimize` | 无 | 无 |
| `ce-plan` | `spec-plan` | 无 | 无 |
| `ce-polish-beta` | `spec-polish-beta` | 无 | 无 |
| `ce-pr-description` | `spec-pr-description` | 无 | 无 |
| `ce-proof` | `proof` | 无 | 无 |
| `ce-release-notes` | `spec-release-notes` | `scripts/list-plugin-releases.py` | `scripts/list-spec-releases.py` |
| `ce-report-bug` | `report-bug` | 无 | 无 |
| `ce-resolve-pr-feedback` | `resolve-pr-feedback` | 无 | 无 |
| `ce-session-extract` | `spec-session-extract` | 无 | 无 |
| `ce-session-inventory` | `spec-session-inventory` | 无 | 无 |
| `ce-sessions` | `spec-sessions` | 无 | 无 |
| `ce-setup` | `spec-setup` | 无 | 无 |
| `ce-slack-research` | `spec-slack-research` | 无 | 无 |
| `ce-test-browser` | `test-browser` | 无 | 无 |
| `ce-test-xcode` | `test-xcode` | 无 | 无 |
| `ce-update` | `spec-update` | 无 | 无 |
| `ce-work` | `spec-work` | 无 | 无 |
| `ce-work-beta` | `spec-work-beta` | 无 | 无 |
| `ce-worktree` | `git-worktree` | 无 | 无 |
| `lfg` | `lfg` | 无 | 无 |

## 结论

- CE 侧 36 个 skill 均已有当前项目映射，没有未映射或映射后缺失项。
- 当前项目 40 个本地 source skill 中，36 个对应 CE，4 个为当前项目明确保留项：`changelog`、`spec-graph-bootstrap`、`spec-mcp-setup`、`using-spec-first`；`agent-browser` 已调整为 external/upstream helper tool，不作为本地 source skill 计数。
- 目录级核对未发现未登记的当前独有 skill。后续如果继续深查，应按单个 skill 对脚本行为和文案适配做语义审查，而不是把 CE 与当前项目内容做字节级一致性要求。

## Agents 映射核对

- 核对时间：2026-04-26 00:36:33
- 当前项目 agents：`/Users/kuang/xiaobu/spec-first/agents`
- CE agents：`/Users/kuang/xiaobu/compound-engineering-plugin/plugins/compound-engineering/agents`
- 核对原则：CE `ce-*.agent.md` 迁移为当前项目 `spec-*.agent.md`；文件名、frontmatter `name` 与正文引用按 spec-first 命名体系适配。

### Agents 总览

| 项目 | 数量 | 结论 |
|---|---:|---|
| CE agent 总数 | 51 | 全部纳入映射核对 |
| 当前项目 agent 总数 | 51 | 与 CE agent 一一对应 |
| CE 映射后缺失项 | 0 | 无 |
| 当前项目独有 agent | 0 | 无 |
| 仅命名适配后仍存在正文差异 | 15 | 均已列入差异说明和逐 agent 内部引用审查，不作为漏迁移结论 |

### CE 到当前项目 agent 映射表

| # | CE agent | 当前项目 agent | 状态 | frontmatter name CE→当前 | 文件大小 CE→当前 | 命名归一后是否一致 |
|---:|---|---|---|---|---:|---|
| 1 | `ce-adversarial-document-reviewer.agent.md` | `spec-adversarial-document-reviewer.agent.md` | 已集成 | `ce-adversarial-document-reviewer`→`spec-adversarial-document-reviewer` | 8558→8634 | 否 |
| 2 | `ce-adversarial-reviewer.agent.md` | `spec-adversarial-reviewer.agent.md` | 已集成 | `ce-adversarial-reviewer`→`spec-adversarial-reviewer` | 8357→8381 | 否 |
| 3 | `ce-agent-native-reviewer.agent.md` | `spec-agent-native-reviewer.agent.md` | 已集成 | `ce-agent-native-reviewer`→`spec-agent-native-reviewer` | 9651→9653 | 是 |
| 4 | `ce-ankane-readme-writer.agent.md` | `spec-ankane-readme-writer.agent.md` | 已集成 | `ce-ankane-readme-writer`→`spec-ankane-readme-writer` | 2605→2607 | 是 |
| 5 | `ce-api-contract-reviewer.agent.md` | `spec-api-contract-reviewer.agent.md` | 已集成 | `ce-api-contract-reviewer`→`spec-api-contract-reviewer` | 3685→3687 | 是 |
| 6 | `ce-architecture-strategist.agent.md` | `spec-architecture-strategist.agent.md` | 已集成 | `ce-architecture-strategist`→`spec-architecture-strategist` | 3533→3535 | 是 |
| 7 | `ce-best-practices-researcher.agent.md` | `spec-best-practices-researcher.agent.md` | 已集成 | `ce-best-practices-researcher`→`spec-best-practices-researcher` | 6976→6996 | 否 |
| 8 | `ce-cli-agent-readiness-reviewer.agent.md` | `spec-cli-agent-readiness-reviewer.agent.md` | 已集成 | `ce-cli-agent-readiness-reviewer`→`spec-cli-agent-readiness-reviewer` | 22979→22981 | 是 |
| 9 | `ce-cli-readiness-reviewer.agent.md` | `spec-cli-readiness-reviewer.agent.md` | 已集成 | `ce-cli-readiness-reviewer`→`spec-cli-readiness-reviewer` | 6104→6108 | 是 |
| 10 | `ce-code-simplicity-reviewer.agent.md` | `spec-code-simplicity-reviewer.agent.md` | 已集成 | `ce-code-simplicity-reviewer`→`spec-code-simplicity-reviewer` | 3344→3340 | 否 |
| 11 | `ce-coherence-reviewer.agent.md` | `spec-coherence-reviewer.agent.md` | 已集成 | `ce-coherence-reviewer`→`spec-coherence-reviewer` | 6481→6517 | 否 |
| 12 | `ce-correctness-reviewer.agent.md` | `spec-correctness-reviewer.agent.md` | 已集成 | `ce-correctness-reviewer`→`spec-correctness-reviewer` | 3875→3877 | 是 |
| 13 | `ce-data-integrity-guardian.agent.md` | `spec-data-integrity-guardian.agent.md` | 已集成 | `ce-data-integrity-guardian`→`spec-data-integrity-guardian` | 3181→3183 | 是 |
| 14 | `ce-data-migration-expert.agent.md` | `spec-data-migration-expert.agent.md` | 已集成 | `ce-data-migration-expert`→`spec-data-migration-expert` | 4164→4166 | 是 |
| 15 | `ce-data-migrations-reviewer.agent.md` | `spec-data-migrations-reviewer.agent.md` | 已集成 | `ce-data-migrations-reviewer`→`spec-data-migrations-reviewer` | 5045→5047 | 是 |
| 16 | `ce-deployment-verification-agent.agent.md` | `spec-deployment-verification-agent.agent.md` | 已集成 | `ce-deployment-verification-agent`→`spec-deployment-verification-agent` | 4938→4940 | 是 |
| 17 | `ce-design-implementation-reviewer.agent.md` | `spec-design-implementation-reviewer.agent.md` | 已集成 | `ce-design-implementation-reviewer`→`spec-design-implementation-reviewer` | 4330→4332 | 是 |
| 18 | `ce-design-iterator.agent.md` | `spec-design-iterator.agent.md` | 已集成 | `ce-design-iterator`→`spec-design-iterator` | 9193→9195 | 是 |
| 19 | `ce-design-lens-reviewer.agent.md` | `spec-design-lens-reviewer.agent.md` | 已集成 | `ce-design-lens-reviewer`→`spec-design-lens-reviewer` | 3667→3703 | 否 |
| 20 | `ce-dhh-rails-reviewer.agent.md` | `spec-dhh-rails-reviewer.agent.md` | 已集成 | `ce-dhh-rails-reviewer`→`spec-dhh-rails-reviewer` | 3326→3328 | 是 |
| 21 | `ce-feasibility-reviewer.agent.md` | `spec-feasibility-reviewer.agent.md` | 已集成 | `ce-feasibility-reviewer`→`spec-feasibility-reviewer` | 4316→4386 | 否 |
| 22 | `ce-figma-design-sync.agent.md` | `spec-figma-design-sync.agent.md` | 已集成 | `ce-figma-design-sync`→`spec-figma-design-sync` | 8141→8143 | 是 |
| 23 | `ce-framework-docs-researcher.agent.md` | `spec-framework-docs-researcher.agent.md` | 已集成 | `ce-framework-docs-researcher`→`spec-framework-docs-researcher` | 5628→5630 | 是 |
| 24 | `ce-git-history-analyzer.agent.md` | `spec-git-history-analyzer.agent.md` | 已集成 | `ce-git-history-analyzer`→`spec-git-history-analyzer` | 3134→3128 | 否 |
| 25 | `ce-issue-intelligence-analyst.agent.md` | `spec-issue-intelligence-analyst.agent.md` | 已集成 | `ce-issue-intelligence-analyst`→`spec-issue-intelligence-analyst` | 14693→14697 | 是 |
| 26 | `ce-julik-frontend-races-reviewer.agent.md` | `spec-julik-frontend-races-reviewer.agent.md` | 已集成 | `ce-julik-frontend-races-reviewer`→`spec-julik-frontend-races-reviewer` | 3574→3576 | 是 |
| 27 | `ce-kieran-python-reviewer.agent.md` | `spec-kieran-python-reviewer.agent.md` | 已集成 | `ce-kieran-python-reviewer`→`spec-kieran-python-reviewer` | 3234→3236 | 是 |
| 28 | `ce-kieran-rails-reviewer.agent.md` | `spec-kieran-rails-reviewer.agent.md` | 已集成 | `ce-kieran-rails-reviewer`→`spec-kieran-rails-reviewer` | 3175→3177 | 是 |
| 29 | `ce-kieran-typescript-reviewer.agent.md` | `spec-kieran-typescript-reviewer.agent.md` | 已集成 | `ce-kieran-typescript-reviewer`→`spec-kieran-typescript-reviewer` | 2933→2935 | 是 |
| 30 | `ce-learnings-researcher.agent.md` | `spec-learnings-researcher.agent.md` | 已集成 | `ce-learnings-researcher`→`spec-learnings-researcher` | 16144→16440 | 否 |
| 31 | `ce-maintainability-reviewer.agent.md` | `spec-maintainability-reviewer.agent.md` | 已集成 | `ce-maintainability-reviewer`→`spec-maintainability-reviewer` | 4084→4086 | 是 |
| 32 | `ce-pattern-recognition-specialist.agent.md` | `spec-pattern-recognition-specialist.agent.md` | 已集成 | `ce-pattern-recognition-specialist`→`spec-pattern-recognition-specialist` | 3593→3595 | 是 |
| 33 | `ce-performance-oracle.agent.md` | `spec-performance-oracle.agent.md` | 已集成 | `ce-performance-oracle`→`spec-performance-oracle` | 4482→4484 | 是 |
| 34 | `ce-performance-reviewer.agent.md` | `spec-performance-reviewer.agent.md` | 已集成 | `ce-performance-reviewer`→`spec-performance-reviewer` | 3875→3877 | 是 |
| 35 | `ce-pr-comment-resolver.agent.md` | `spec-pr-comment-resolver.agent.md` | 已集成 | `ce-pr-comment-resolver`→`spec-pr-comment-resolver` | 10885→10887 | 是 |
| 36 | `ce-previous-comments-reviewer.agent.md` | `spec-previous-comments-reviewer.agent.md` | 已集成 | `ce-previous-comments-reviewer`→`spec-previous-comments-reviewer` | 3720→3722 | 是 |
| 37 | `ce-product-lens-reviewer.agent.md` | `spec-product-lens-reviewer.agent.md` | 已集成 | `ce-product-lens-reviewer`→`spec-product-lens-reviewer` | 7403→7517 | 否 |
| 38 | `ce-project-standards-reviewer.agent.md` | `spec-project-standards-reviewer.agent.md` | 已集成 | `ce-project-standards-reviewer`→`spec-project-standards-reviewer` | 7303→7248 | 否 |
| 39 | `ce-reliability-reviewer.agent.md` | `spec-reliability-reviewer.agent.md` | 已集成 | `ce-reliability-reviewer`→`spec-reliability-reviewer` | 3768→3770 | 是 |
| 40 | `ce-repo-research-analyst.agent.md` | `spec-repo-research-analyst.agent.md` | 已集成 | `ce-repo-research-analyst`→`spec-repo-research-analyst` | 14697→14699 | 是 |
| 41 | `ce-schema-drift-detector.agent.md` | `spec-schema-drift-detector.agent.md` | 已集成 | `ce-schema-drift-detector`→`spec-schema-drift-detector` | 4393→4401 | 是 |
| 42 | `ce-scope-guardian-reviewer.agent.md` | `spec-scope-guardian-reviewer.agent.md` | 已集成 | `ce-scope-guardian-reviewer`→`spec-scope-guardian-reviewer` | 4052→4136 | 否 |
| 43 | `ce-security-lens-reviewer.agent.md` | `spec-security-lens-reviewer.agent.md` | 已集成 | `ce-security-lens-reviewer`→`spec-security-lens-reviewer` | 3749→3821 | 否 |
| 44 | `ce-security-reviewer.agent.md` | `spec-security-reviewer.agent.md` | 已集成 | `ce-security-reviewer`→`spec-security-reviewer` | 4054→4056 | 是 |
| 45 | `ce-security-sentinel.agent.md` | `spec-security-sentinel.agent.md` | 已集成 | `ce-security-sentinel`→`spec-security-sentinel` | 4061→4063 | 是 |
| 46 | `ce-session-historian.agent.md` | `spec-session-historian.agent.md` | 已集成 | `ce-session-historian`→`spec-session-historian` | 14604→14068 | 否 |
| 47 | `ce-slack-researcher.agent.md` | `spec-slack-researcher.agent.md` | 已集成 | `ce-slack-researcher`→`spec-slack-researcher` | 12240→12260 | 否 |
| 48 | `ce-spec-flow-analyzer.agent.md` | `spec-spec-flow-analyzer.agent.md` | 已集成 | `ce-spec-flow-analyzer`→`spec-spec-flow-analyzer` | 5115→5117 | 是 |
| 49 | `ce-swift-ios-reviewer.agent.md` | `spec-swift-ios-reviewer.agent.md` | 已集成 | `ce-swift-ios-reviewer`→`spec-swift-ios-reviewer` | 11311→11313 | 是 |
| 50 | `ce-testing-reviewer.agent.md` | `spec-testing-reviewer.agent.md` | 已集成 | `ce-testing-reviewer`→`spec-testing-reviewer` | 4149→4151 | 是 |
| 51 | `ce-web-researcher.agent.md` | `spec-web-researcher.agent.md` | 已集成 | `ce-web-researcher`→`spec-web-researcher` | 8507→8515 | 是 |

### Agent 正文差异说明

| CE agent | 当前项目 agent | 差异说明 |
|---|---|---|
| `ce-adversarial-document-reviewer.agent.md` | `spec-adversarial-document-reviewer.agent.md` | 当前项目将 spec-doc-review shared rubric 引用明确为 `skills/spec-doc-review/references/subagent-template.md`，并把 peer persona signal 改为 `spec-*` agent identity。 |
| `ce-adversarial-reviewer.agent.md` | `spec-adversarial-reviewer.agent.md` | 当前项目修正旧简称 `security-reviewer` / `performance-reviewer` 为真实 `spec-security-reviewer` / `spec-performance-reviewer`。 |
| `ce-best-practices-researcher.agent.md` | `spec-best-practices-researcher.agent.md` | 当前项目按实际 skill 名称修正引用：`frontend-design`、`gemini-imagegen`、`git-worktree`；属于命名适配。 |
| `ce-code-simplicity-reviewer.agent.md` | `spec-code-simplicity-reviewer.agent.md` | 当前项目将受保护文档说明从 CE artifact 改为 spec-first workflow artifact，并使用 Claude workflow 入口 `spec-plan`、`spec-work`。 |
| `ce-coherence-reviewer.agent.md` | `spec-coherence-reviewer.agent.md` | 当前项目将 shared rubric 引用明确为 `skills/spec-doc-review/references/subagent-template.md`。 |
| `ce-design-lens-reviewer.agent.md` | `spec-design-lens-reviewer.agent.md` | 当前项目将 shared rubric 引用明确为 `skills/spec-doc-review/references/subagent-template.md`。 |
| `ce-feasibility-reviewer.agent.md` | `spec-feasibility-reviewer.agent.md` | 当前项目将 shared rubric / false-positive catalog 引用明确为 `skills/spec-doc-review/references/subagent-template.md`。 |
| `ce-git-history-analyzer.agent.md` | `spec-git-history-analyzer.agent.md` | 当前项目将受保护文档说明从 CE artifact 改为 spec-first workflow artifact，并使用 Claude workflow 入口 `spec-plan`。 |
| `ce-learnings-researcher.agent.md` | `spec-learnings-researcher.agent.md` | 当前项目补充 `docs/solutions` 双视图复用说明，将 CE module 查询适配为 `spec-first`，并将调用方引用改为中性 workflow 名称，避免混淆 Claude `spec-*` 与 Codex `spec-*` 入口。 |
| `ce-product-lens-reviewer.agent.md` | `spec-product-lens-reviewer.agent.md` | 当前项目将 shared rubric / false-positive catalog 引用明确为 `skills/spec-doc-review/references/subagent-template.md`，并把 peer persona 引用改为 `spec-*` identity。 |
| `ce-project-standards-reviewer.agent.md` | `spec-project-standards-reviewer.agent.md` | 当前项目将 cross-reference 检查口径改为扁平 `spec-*.agent.md` identity，属于 agent 目录结构适配。 |
| `ce-scope-guardian-reviewer.agent.md` | `spec-scope-guardian-reviewer.agent.md` | 当前项目将 shared rubric 引用明确为 `skills/spec-doc-review/references/subagent-template.md`，并把 peer persona 引用改为 `spec-*` identity。 |
| `ce-security-lens-reviewer.agent.md` | `spec-security-lens-reviewer.agent.md` | 当前项目将 shared rubric / false-positive catalog 引用明确为 `skills/spec-doc-review/references/subagent-template.md`。 |
| `ce-session-historian.agent.md` | `spec-session-historian.agent.md` | 当前项目按仅支持 Claude Code / Codex 的 host 边界移除 Cursor 会话源说明，并要求 `spec-session-inventory` 显式传入 `claude` / `codex` 平台参数。 |
| `ce-slack-researcher.agent.md` | `spec-slack-researcher.agent.md` | 当前项目将示例中的旧 `/spec-ideate` 写法修正为 Claude workflow 入口 `spec-ideate`。 |

### Agents 结论

- CE 侧 51 个 agent 均已在当前项目中以 `spec-*` 文件名和 `spec-*` identity 集成。
- 当前项目没有未登记的独有 agent，也没有 CE 映射后缺失的 agent。
- 仍有正文差异的 agent 已在差异说明表中列明，均属于 spec-first 命名、目录结构或项目知识格式适配，不影响 CE agent 能力集成结论。


## 逐 Agent 内部引用审查

- 审查时间：2026-04-26 01:08:00
- 审查范围：`agents/*.agent.md` 共 51 个文件，逐个读取 frontmatter 与正文中的 skill、agent、脚本、目录、命令入口、宿主路径引用。
- 审查口径：以当前 `agents/*.agent.md` 文档内容为事实；脚本负责枚举与查重，语义判断由人工逐项确认。
- 验证结论：frontmatter name 全部与文件名 stem 一致；未发现 `ce-*`、`compound-engineering`、`/ce:*`、`$ce-*` 残留；未发现缺失的真实 skill、agent、script 引用。
- Host 边界复审：当前项目 agent 文档只允许 Claude Code / Codex 作为支持宿主；unsupported platforms 只能以拒绝说明出现，不能作为默认搜索源或可执行入口。

| # | Agent | Frontmatter | Skill / command refs | Agent refs | Path / script refs | 结论 |
|---:|---|---|---|---|---|---|
| 1 | `spec-adversarial-document-reviewer.agent.md` | 通过 | 无 | 通过：peer personas 全部为 `spec-*` | 通过：`skills/spec-doc-review/references/subagent-template.md` 存在 | 已修正 spec-doc-review rubric 路径与 peer persona signal。 |
| 2 | `spec-adversarial-reviewer.agent.md` | 通过 | 无 | 通过：reviewer 互指全部为 `spec-*` | 无 | 已修正 `spec-security-reviewer` / `spec-performance-reviewer`。 |
| 3 | `spec-agent-native-reviewer.agent.md` | 通过 | 无 | 无 | 通过：`agents/*.md`、`skills/*/SKILL.md` 为通配契约 | 通配路径是宿主插件资产约定，不要求字面文件存在。 |
| 4 | `spec-ankane-readme-writer.agent.md` | 通过 | 无 | 无 | 无 | 未发现 skill、脚本、目录或命令引用问题。 |
| 5 | `spec-api-contract-reviewer.agent.md` | 通过 | 无 | 无 | 无 | 未发现 skill、脚本、目录或命令引用问题。 |
| 6 | `spec-architecture-strategist.agent.md` | 通过 | 无 | 无 | 无 | 未发现 skill、脚本、目录或命令引用问题。 |
| 7 | `spec-best-practices-researcher.agent.md` | 通过 | 通过：`agent-native-architecture`、`frontend-design`、`gemini-imagegen`、`git-worktree` 均存在 | 无 | 通过：`.claude/.codex/.agents` runtime 与 home skill 目录为搜索范围 | 已在前序迁移中修正为当前 skill 名。 |
| 8 | `spec-cli-agent-readiness-reviewer.agent.md` | 通过 | 无 | 无 | 通过：`src/cli/` 存在；其他入口为跨项目候选 | 候选入口目录用于被审项目扫描，不要求当前仓库全部存在。 |
| 9 | `spec-cli-readiness-reviewer.agent.md` | 通过 | 无 | 无 | 无 | 未发现 skill、脚本、目录或命令引用问题。 |
| 10 | `spec-code-simplicity-reviewer.agent.md` | 通过 | 通过：`spec-plan`、`spec-work` 为 Claude workflow 入口 | 无 | 通过：`docs/plans/*.md`、`docs/solutions/*.md` 为保护通配 | 已修正 CE artifact 残留为 spec-first workflow artifact。 |
| 11 | `spec-coherence-reviewer.agent.md` | 通过 | 无 | 无 | 通过：`skills/spec-doc-review/references/subagent-template.md` 存在 | 已修正 shared rubric 路径。 |
| 12 | `spec-correctness-reviewer.agent.md` | 通过 | 无 | 无 | 无 | 未发现 skill、脚本、目录或命令引用问题。 |
| 13 | `spec-data-integrity-guardian.agent.md` | 通过 | 无 | 无 | 无 | 未发现 skill、脚本、目录或命令引用问题。 |
| 14 | `spec-data-migration-expert.agent.md` | 通过 | 无 | 无 | 无 | 未发现 skill、脚本、目录或命令引用问题。 |
| 15 | `spec-data-migrations-reviewer.agent.md` | 通过 | 无 | 无 | 无 | 未发现 skill、脚本、目录或命令引用问题。 |
| 16 | `spec-deployment-verification-agent.agent.md` | 通过 | 无 | 无 | 无 | 未发现 skill、脚本、目录或命令引用问题。 |
| 17 | `spec-design-implementation-reviewer.agent.md` | 通过 | 无 | 无 | 无 | 未发现 skill、脚本、目录或命令引用问题。 |
| 18 | `spec-design-iterator.agent.md` | 通过 | 无 | 无 | 无 | 未发现 skill、脚本、目录或命令引用问题。 |
| 19 | `spec-design-lens-reviewer.agent.md` | 通过 | 无 | 无 | 通过：`skills/spec-doc-review/references/subagent-template.md` 存在 | 已修正 shared rubric 路径。 |
| 20 | `spec-dhh-rails-reviewer.agent.md` | 通过 | 无 | 无 | 无 | 未发现 skill、脚本、目录或命令引用问题。 |
| 21 | `spec-feasibility-reviewer.agent.md` | 通过 | 无 | 无 | 通过：`skills/spec-doc-review/references/subagent-template.md` 存在 | 已修正 shared rubric / false-positive catalog 路径。 |
| 22 | `spec-figma-design-sync.agent.md` | 通过 | 无 | 无 | 无 | 未发现 skill、脚本、目录或命令引用问题。 |
| 23 | `spec-framework-docs-researcher.agent.md` | 通过 | 无 | 无 | 无 | 未发现 skill、脚本、目录或命令引用问题。 |
| 24 | `spec-git-history-analyzer.agent.md` | 通过 | 通过：`spec-plan` 为 Claude workflow 入口 | 无 | 通过：`docs/plans/`、`docs/solutions/` 存在 | 已修正 CE artifact 残留为 spec-first workflow artifact。 |
| 25 | `spec-issue-intelligence-analyst.agent.md` | 通过 | 无 | 无 | 无 | 未发现 skill、脚本、目录或命令引用问题。 |
| 26 | `spec-julik-frontend-races-reviewer.agent.md` | 通过 | 无 | 无 | 无 | 未发现 skill、脚本、目录或命令引用问题。 |
| 27 | `spec-kieran-python-reviewer.agent.md` | 通过 | 无 | 无 | 无 | 未发现 skill、脚本、目录或命令引用问题。 |
| 28 | `spec-kieran-rails-reviewer.agent.md` | 通过 | 无 | 无 | 无 | 未发现 skill、脚本、目录或命令引用问题。 |
| 29 | `spec-kieran-typescript-reviewer.agent.md` | 通过 | 无 | 无 | 无 | 未发现 skill、脚本、目录或命令引用问题。 |
| 30 | `spec-learnings-researcher.agent.md` | 通过 | 通过：workflow 引用使用中性 `spec-*` 名称，不混用 host 命令入口 | 无 | 通过：`docs/solutions/` 存在；`docs/solutions/patterns/critical-patterns.md` 明确可选 | 已修正 `compound-engineering` module 查询为 `spec-first`，并清理旧 `/spec-*` 写法。 |
| 31 | `spec-maintainability-reviewer.agent.md` | 通过 | 无 | 无 | 无 | 未发现 skill、脚本、目录或命令引用问题。 |
| 32 | `spec-pattern-recognition-specialist.agent.md` | 通过 | 无 | 无 | 无 | 未发现 skill、脚本、目录或命令引用问题。 |
| 33 | `spec-performance-oracle.agent.md` | 通过 | 无 | 无 | 无 | 未发现 skill、脚本、目录或命令引用问题。 |
| 34 | `spec-performance-reviewer.agent.md` | 通过 | 无 | 无 | 无 | 未发现 skill、脚本、目录或命令引用问题。 |
| 35 | `spec-pr-comment-resolver.agent.md` | 通过 | 无 | 无 | 通过：测试路径为跨项目示例 | 示例命令不绑定当前仓库测试文件。 |
| 36 | `spec-previous-comments-reviewer.agent.md` | 通过 | 无 | 无 | 无 | 未发现 skill、脚本、目录或命令引用问题。 |
| 37 | `spec-product-lens-reviewer.agent.md` | 通过 | 无 | 通过：peer personas 全部为 `spec-*` | 通过：`skills/spec-doc-review/references/subagent-template.md` 存在 | 已修正 shared rubric 路径与 peer persona 引用。 |
| 38 | `spec-project-standards-reviewer.agent.md` | 通过 | 无 | 通过：要求 flat `spec-*.agent.md` identity | 通过：示例路径已改为 `packages/example/AGENTS.md` | 已修正 CE 插件路径示例。 |
| 39 | `spec-reliability-reviewer.agent.md` | 通过 | 无 | 无 | 无 | 未发现 skill、脚本、目录或命令引用问题。 |
| 40 | `spec-repo-research-analyst.agent.md` | 通过 | 无 | 无 | 通过：`src/` 存在；`src/routes/`、`src/api/`、`src/models/` 为跨项目候选 | 候选目录用于目标仓库研究，不要求当前仓库全部存在。 |
| 41 | `spec-schema-drift-detector.agent.md` | 通过 | 无 | 通过：`spec-data-migration-expert`、`spec-data-integrity-guardian` 均存在 | 无 | 后续 agent 串联引用正确。 |
| 42 | `spec-scope-guardian-reviewer.agent.md` | 通过 | 无 | 通过：peer personas 全部为 `spec-*` | 通过：`skills/spec-doc-review/references/subagent-template.md` 存在 | 已修正 shared rubric 路径与 peer persona 引用。 |
| 43 | `spec-security-lens-reviewer.agent.md` | 通过 | 无 | 通过：`spec-coherence-reviewer` 存在 | 通过：`skills/spec-doc-review/references/subagent-template.md` 存在 | 已修正 shared rubric / false-positive catalog 路径。 |
| 44 | `spec-security-reviewer.agent.md` | 通过 | 无 | 无 | 无 | 未发现 skill、脚本、目录或命令引用问题。 |
| 45 | `spec-security-sentinel.agent.md` | 通过 | 无 | 无 | 无 | 未发现 skill、脚本、目录或命令引用问题。 |
| 46 | `spec-session-historian.agent.md` | 通过 | 通过：仅调用 `spec-session-inventory` / `spec-session-extract`，并显式限制 `claude`、`codex` 平台 | 无 | 通过：`~/.claude`、`~/.codex`、`~/.agents` 为受支持宿主会话目录 | 已移除 Cursor 会话源正文，保留对 unsupported platforms 的拒绝说明。 |
| 47 | `spec-slack-researcher.agent.md` | 通过 | 通过：Claude 示例使用 `spec-ideate` | 通过：自引用 `spec-slack-researcher` 存在 | 无 | 示例文案已使用 `spec-slack-researcher`，并修正旧 `/spec-ideate` 写法。 |
| 48 | `spec-spec-flow-analyzer.agent.md` | 通过 | 无 | 无 | 无 | 未发现 skill、脚本、目录或命令引用问题。 |
| 49 | `spec-swift-ios-reviewer.agent.md` | 通过 | 无 | 无 | 无 | 未发现 skill、脚本、目录或命令引用问题。 |
| 50 | `spec-testing-reviewer.agent.md` | 通过 | 无 | 无 | 无 | 未发现 skill、脚本、目录或命令引用问题。 |
| 51 | `spec-web-researcher.agent.md` | 通过 | 无 | 无 | 无 | 未发现 skill、脚本、目录或命令引用问题。 |

### 逐 Agent 审查修正项

| 类型 | 文件 | 修正 |
|---|---|---|
| CE 残留 | `agents/spec-code-simplicity-reviewer.agent.md` | `compound-engineering pipeline artifacts` 改为 `spec-first workflow artifacts`，并将 workflow 入口改为 `spec-plan`、`spec-work`。 |
| CE 残留 | `agents/spec-git-history-analyzer.agent.md` | `compound-engineering pipeline artifacts` 改为 `spec-first workflow artifacts`，并将 workflow 入口改为 `spec-plan`。 |
| CE 残留 | `agents/spec-learnings-researcher.agent.md` | `module:.*(compound-engineering|skill-design)` 改为 `module:.*(spec-first|skill-design)`。 |
| CE 路径示例 | `agents/spec-project-standards-reviewer.agent.md` | `plugins/compound-engineering/AGENTS.md` 示例改为 `packages/example/AGENTS.md`。 |
| Agent 互指 | `agents/spec-adversarial-reviewer.agent.md` | `security-reviewer`、`performance-reviewer` 改为 `spec-security-reviewer`、`spec-performance-reviewer`。 |
| Agent 互指 | `agents/spec-adversarial-document-reviewer.agent.md`、`agents/spec-product-lens-reviewer.agent.md`、`agents/spec-scope-guardian-reviewer.agent.md` | `product-lens`、`scope-guardian`、`security-lens`、`design-lens` 等 peer shorthand 改为真实 `spec-*` agent identity。 |
| Reference 路径 | `agents/spec-adversarial-document-reviewer.agent.md`、`agents/spec-coherence-reviewer.agent.md`、`agents/spec-design-lens-reviewer.agent.md`、`agents/spec-feasibility-reviewer.agent.md`、`agents/spec-product-lens-reviewer.agent.md`、`agents/spec-scope-guardian-reviewer.agent.md`、`agents/spec-security-lens-reviewer.agent.md` | `subagent-template.md` 改为存在的 `skills/spec-doc-review/references/subagent-template.md`。 |
| Host 边界 | `agents/spec-session-historian.agent.md` | 搜索范围从 Claude Code / Codex / Cursor 收敛为仅 Claude Code / Codex，并要求 inventory 调用显式传 `claude` / `codex`，避免默认扫入 unsupported platform。 |
| Workflow 入口 | `agents/spec-learnings-researcher.agent.md`、`agents/spec-slack-researcher.agent.md`、`agents/spec-session-historian.agent.md` | 清理旧 `/spec-*` 写法；Claude 示例使用 `spec-*`，跨宿主语境使用中性 workflow 名称。 |

### 逐 Agent 审查例外说明

| 文件 | 表面现象 | 处理结论 |
|---|---|---|
| `agents/spec-agent-native-reviewer.agent.md` | `agents/*.md`、`skills/*/SKILL.md` 是通配路径 | 保留；这是插件资产结构约定，不是缺失文件。 |
| `agents/spec-best-practices-researcher.agent.md` | `.claude/skills/**/SKILL.md`、`.codex/skills/**/SKILL.md` 是 runtime 搜索范围 | 保留；`.claude` / `.codex` 是生成资产路径，文档是在说明跨宿主搜索策略。 |
| `agents/spec-learnings-researcher.agent.md` | `docs/solutions/patterns/critical-patterns.md` 当前不存在 | 保留；正文明确写了 “If exists”，是可选约定。 |
| `agents/spec-repo-research-analyst.agent.md` | `src/routes/`、`src/api/`、`src/models/` 当前不存在 | 保留；这些是被研究项目的候选目录，不是当前仓库硬依赖。 |
| `agents/spec-session-historian.agent.md` | `~/.claude`、`~/.codex`、`~/.agents` home 路径 | 保留；这些是 Claude Code / Codex 支持范围内的宿主会话历史查找路径。 |


## 逐 Skill Host 边界审查

- 审查时间：2026-04-26 01:43:00
- 审查范围：`skills/*` 共 40 个本地 source skill，包括 `SKILL.md`、`references/`、`scripts/`、`assets/` 中的文本与脚本引用；`agent-browser` 已外部化，由 `spec-mcp-setup` 安装 upstream/global helper。
- Host 边界：当前项目只支持 Claude Code 与 Codex；Gemini API image generation、Gemini Code Assist review bot 识别不属于宿主支持面，允许保留。
- 验证结论：未发现 Cursor、Pi、OpenCode、Kilo、Gemini CLI 等 unsupported host 的可执行入口、默认搜索源或 question/subagent tool 说明；未发现真实旧 `/spec-*` workflow 命令写法残留。
- 例外说明：`spec-setup` / `spec-mcp-setup` 中检测 `compound-engineering.local.md` 与 `.compound-engineering/config.local.yaml` 属于 legacy config 迁移诊断，不是 CE 运行入口。

| # | Skill | Host 边界状态 | 结论 / 修正 |
|---:|---|---|---|
| 1 | `agent-browser` | 不适用 | 已从本地 source skill 删除；由 `spec-mcp-setup` 安装 external/upstream helper tool。 |
| 2 | `agent-native-architecture` | 通过 | 未发现 unsupported host、旧 question tool 或旧 `/spec-*` 入口问题。 |
| 3 | `agent-native-audit` | 通过 | 修正 subagent primitive 说明，仅保留 Claude Code Agent 与 Codex spawn_agent。 |
| 4 | `changelog` | 通过 | 未发现 unsupported host、旧 question tool 或旧 `/spec-*` 入口问题。 |
| 5 | `spec-doc-review` | 通过 | 修正 blocking question 与 subagent primitive 说明，仅保留 Claude Code / Codex。 |
| 6 | `feature-video` | 通过 | 修正 blocking question 说明，仅保留 Claude Code / Codex。 |
| 7 | `frontend-design` | 通过 | 修正 blocking question 说明，仅保留 Claude Code / Codex。 |
| 8 | `gemini-imagegen` | 通过 | 未发现 unsupported host、旧 question tool 或旧 `/spec-*` 入口问题。 |
| 9 | `git-clean-gone-branches` | 通过 | 修正 blocking question 说明，仅保留 Claude Code / Codex。 |
| 10 | `git-commit` | 通过 | 修正 blocking question 说明，仅保留 Claude Code / Codex。 |
| 11 | `git-commit-push-pr` | 通过 | 修正 blocking question 说明，仅保留 Claude Code / Codex。 |
| 12 | `git-worktree` | 通过 | 未发现 unsupported host、旧 question tool 或旧 `/spec-*` 入口问题。 |
| 13 | `lfg` | 通过 | 修正 tracker defer blocking question 说明，仅保留 Claude Code / Codex。 |
| 14 | `proof` | 通过 | 修正 HITL review blocking question 与 subagent 说明，仅保留 Claude Code / Codex。 |
| 15 | `report-bug` | 通过 | 修正 blocking question 说明，并将 Agent Platform 字段限制为 Claude Code 或 Codex。 |
| 16 | `resolve-pr-feedback` | 通过 | 修正 blocking question 说明，仅保留 Claude Code / Codex；保留 Gemini Code Assist 作为 review bot 文本识别，不作为宿主支持。 |
| 17 | `spec-brainstorm` | 通过 | 修正 blocking question 说明与 workflow 入口语法；Claude command 使用 `spec-*`。 |
| 18 | `spec-compound` | 通过 | 修正 blocking question、session history host 范围与 workflow 入口语法；session history 仅 Claude Code / Codex。 |
| 19 | `spec-compound-refresh` | 通过 | 修正 blocking question 说明，仅保留 Claude Code / Codex。 |
| 20 | `spec-debug` | 通过 | 修正 blocking question 说明与 workflow 入口语法；Claude command 使用 `spec-*`。 |
| 21 | `spec-dhh-rails-style` | 通过 | 未发现 unsupported host、旧 question tool 或旧 `/spec-*` 入口问题。 |
| 22 | `spec-graph-bootstrap` | 通过 | 未发现 unsupported host、旧 question tool 或旧 `/spec-*` 入口问题。 |
| 23 | `spec-ideate` | 通过 | 修正 blocking question 说明与 post-ideation workflow 入口语法；Claude command 使用 `spec-*`。 |
| 24 | `spec-mcp-setup` | 通过 | 未发现 unsupported host、旧 question tool 或旧 `/spec-*` 入口问题。 |
| 25 | `spec-optimize` | 通过 | 修正 blocking question 说明，并将旧 `/spec-optimize` 口径改为 standalone skill 名称。 |
| 26 | `spec-plan` | 通过 | 修正 blocking question 说明与 handoff 入口语法；Claude command 使用 `spec-*`。 |
| 27 | `spec-polish-beta` | 通过 | 移除 Cursor / VS Code IDE handoff 口径，保留 Claude Code browser hint 与 Codex/terminal URL 输出。 |
| 28 | `spec-pr-description` | 通过 | 修正 harness badge lookup，仅保留 Claude Code / Codex。 |
| 29 | `spec-release-notes` | 通过 | 未发现 unsupported host、旧 question tool 或旧 `/spec-*` 入口问题。 |
| 30 | `spec-code-review` | 通过 | 修正 blocking question 说明，仅保留 Claude Code / Codex。 |
| 31 | `spec-session-extract` | 通过 | 移除 Cursor session extract 文档与脚本解析分支，仅保留 Claude Code / Codex。 |
| 32 | `spec-session-inventory` | 通过 | 移除 Cursor session discovery / metadata 文档与脚本分支，仅保留 Claude Code / Codex。 |
| 33 | `spec-sessions` | 通过 | 修正 blocking question 说明与 Claude command 入口语法。 |
| 34 | `spec-setup` | 通过 | 修正 blocking question 说明，仅保留 Claude Code / Codex。 |
| 35 | `spec-slack-research` | 通过 | 修正 blocking question 说明，并将旧 `/spec-slack-research` 改为 standalone skill 名称。 |
| 36 | `spec-update` | 通过 | 修正旧 `/spec-update` 用户提示为 Claude command `spec-update`，保留真实 skill 路径 `spec-update`。 |
| 37 | `spec-work` | 通过 | 修正 workflow 入口语法；Claude command 使用 `spec-*`。 |
| 38 | `spec-work-beta` | 通过 | 修正 blocking question、delegation gate 与 workflow 入口语法，仅保留 Claude Code / Codex。 |
| 39 | `test-browser` | 通过 | 修正 blocking question 说明，仅保留 Claude Code / Codex。 |
| 40 | `test-xcode` | 通过 | 未发现 unsupported host、旧 question tool 或旧 `/spec-*` 入口问题。 |
| 41 | `using-spec-first` | 通过 | 未发现 unsupported host、旧 question tool 或旧 `/spec-*` 入口问题。 |

### 逐 Skill Host 边界修正项

| 类型 | 范围 | 修正 |
|---|---|---|
| Blocking question tool | 多数交互型 skills 与 references | 删除 Gemini / Pi 的 `ask_user`、`pi-ask-user` 说明，仅保留 Claude Code `AskUserQuestion` 与 Codex `request_user_input`。 |
| Subagent primitive | `skills/agent-native-audit/SKILL.md`、`skills/spec-doc-review/SKILL.md`、`skills/proof/references/hitl-review.md` | 删除 Pi subagent 说明，仅保留 Claude Code Agent/Task 与 Codex `spawn_agent`。 |
| Session history | `skills/spec-session-inventory/**`、`skills/spec-session-extract/**`、`skills/spec-compound/SKILL.md` | 移除 Cursor discovery / metadata / skeleton / errors 支持；session history 收敛为 Claude Code + Codex。 |
| Polish beta | `skills/spec-polish-beta/**` | 移除 Cursor / VS Code browser handoff 与 launch schema 泛 IDE 叙事；保留 Claude Code browser hint 与 Codex/terminal URL 输出。 |
| Workflow entrypoints | 多个 workflow skills 与 references | 命令型 Claude 入口统一为 `spec-*`；非 command-backed standalone skill 使用 skill 名称，不写成 slash command。 |
| PR/report metadata | `skills/spec-pr-description/SKILL.md`、`skills/report-bug/SKILL.md` | harness/platform 示例收敛为 Claude Code 与 Codex。 |

### 逐 Skill Host 边界例外说明

| 文件 / 范围 | 表面现象 | 处理结论 |
|---|---|---|
| `skills/gemini-imagegen/**` | 多处出现 Gemini | 保留；这是 Google Gemini API 图像生成能力，不是 agent host 支持面。 |
| `skills/resolve-pr-feedback/SKILL.md` | 出现 Gemini Code Assist | 保留；这是 PR review bot wrapper 识别逻辑，不是宿主运行入口。 |
| `skills/spec-setup/scripts/check-health`、`skills/spec-mcp-setup/scripts/check-health` | 出现 `compound-engineering.local.md` / `.compound-engineering/config.local.yaml` | 保留；这是 legacy config 迁移诊断，帮助用户识别旧 CE 配置，不代表当前项目支持 CE host。 |
| `skills/spec-update/SKILL.md` | 出现 `skills/spec-update` 路径 | 保留；这是 Claude marketplace cache 中真实 skill 目录名，不是旧 slash command。 |
