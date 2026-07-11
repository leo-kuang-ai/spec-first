---
# Spec-First Workflow 架构全景

## 一、核心 Workflow 链路

```text
Codebase -> Spec -> Plan -> Tasks -> Code -> Review -> Knowledge
```

Context 不是顺序 workflow 节点，而是横切 evidence / harness layer：普通 workflow 通过 bounded source reads、`rg`、ast-grep、git diff、tests/logs、docs/solutions 和 runtime readiness facts 获取可验证上下文。

| 链路节点 | 对应 Workflow | 说明 |
| --- | --- | --- |
| Codebase | 终端 `spec-first update`、`spec-mcp-setup` | 建立运行时基线，修复 runtime drift |
| Spec | `spec-brainstorm`、`spec-prd`、`spec-ideate` | 需求探索与 PRD 产出 |
| Plan | `spec-plan` | 将需求转化为结构化实施计划 |
| Tasks | `spec-write-tasks` | 将计划编译为可执行任务包（可选派生层） |
| Code | `spec-work` | 系统化执行开发任务 |
| Review | `spec-code-review`、`spec-doc-review` | 结构化审查代码与文档；dispatch 可用且授权时使用多 persona，否则走 report-only / inline fallback |
| Knowledge | `spec-compound`、`spec-compound-refresh` | 沉淀可复用工程知识，刷新/合并/退役旧 learning，并按 workflow 本地能力检索历史上下文 |

## 二、Workflow -> Skill -> Prompt Asset 映射表

顶层 `agents/` 已退役。CE 迁入后的 agent/persona prompt 资产均存放在对应 skill 目录下，常见位置为 `skills/<skill>/references/agents/` 或 `skills/<skill>/references/personas/`。它们是 skill-local prompt assets，不再作为独立 runtime agent source 打包或安装。

| Workflow 命令 | Skill | 用途 | Skill-local prompt assets |
| --- | --- | --- | --- |
| `spec-brainstorm` | spec-brainstorm | 协作对话探索需求与方案，产出需求文档，交付给规划阶段 | `repo-profiler`、`slack-researcher` |
| `spec-prd` | spec-prd | 将增量需求或粗糙 PRD 转化为规范需求文档，供 spec-plan 消费 | 无 |
| `spec-ideate` | spec-ideate | 进入 brainstorm 前发散生成候选想法并批判性筛选，产出带排名的 ideation artifact | `learnings-researcher`、`web-researcher`、`issue-intelligence-analyst`、`slack-researcher`、`repo-profiler` |
| `spec-plan` | spec-plan | 为多步骤任务创建结构化实施计划，或对现有计划做深化审查 | `repo-research-analyst`、`learnings-researcher`、spec-flow-analyzer、`best-practices-researcher`、`framework-docs-researcher`、`web-researcher`、`git-history-analyzer`、`architecture-strategist`、`agent-native-planning-strategist`、`data-migration-reviewer`、`deployment-verification-agent`、`data-integrity-guardian`、`performance-oracle`、`security-sentinel`、`pattern-recognition-specialist`、`slack-researcher`、`repo-profiler` |
| `spec-write-tasks` | spec-write-tasks | 将已定稿的 spec-plan 编译为派生任务包，或验证现有任务包完整性 | 无 |
| `spec-work` | spec-work | 接收任务包或计划，系统化执行开发工作，保证质量交付 | `figma-design-sync`（UI 工作按需） |
| `spec-dogfood` | spec-dogfood | 对当前分支或 PR 做 diff-scoped browser dogfood QA，映射用户流、执行矩阵、小修复并产出 `docs/dogfood-reports/` 报告 | 无（`disable-model-invocation`） |
| `spec-code-review` | spec-code-review | 结构化代码审查；dispatch 可用且授权时使用多 persona，缺失时走 report-only / inline fallback；置信度门控，合并去重，可选自动修复 | `correctness-reviewer`、`testing-reviewer`、`maintainability-reviewer`、`agent-native-reviewer`、`learnings-researcher`、`security-reviewer`、`performance-reviewer`、`api-contract-reviewer`、`data-migration-reviewer`、`reliability-reviewer`、`adversarial-reviewer`、`previous-comments-reviewer`、`project-standards-reviewer`、`julik-frontend-races-reviewer`、`swift-ios-reviewer`、`deployment-verification-agent`、`repo-profiler` |
| `spec-doc-review` | spec-doc-review | 结构化文档审查；dispatch 可用且授权时使用多 persona，缺失时走 single-agent report-only fallback；发现一致性、可行性、范围、安全等问题，可选自动修复 | `coherence-reviewer`、`feasibility-reviewer`、`product-lens-reviewer`、`design-lens-reviewer`、`security-lens-reviewer`、`scope-guardian-reviewer`、`adversarial-document-reviewer` |
| `spec-debug` | spec-debug | 系统性排查 bug 根因，可选修复，适用于失败测试、运行时报错等场景 | `repo-profiler` |
| `spec-optimize` | spec-optimize | 指标驱动的迭代优化循环，并行实验，按评分保留改进方案 | `learnings-researcher`、`repo-research-analyst`、`repo-profiler` |
| `spec-compound` | spec-compound | 问题刚解决时，将解决方案沉淀到 docs/solutions/ | `performance-oracle`、`security-sentinel`、`data-integrity-guardian`、`pattern-recognition-specialist`、`best-practices-researcher`、`framework-docs-researcher`、`session-historian`、`repo-profiler` |
| `spec-compound-refresh` | spec-compound-refresh | 审查并刷新 docs/solutions/ 下已漂移的 learning 与 pattern 文档，更新/合并/替换/删除，维持知识库新鲜度 | 无具名 prompt asset（可用匿名 subagent 做调查与 replacement 的上下文隔离） |
| `spec-mcp-setup` | spec-mcp-setup | 安装、配置并验证 spec-first 工作流所需宿主运行时，建立就绪基线 | 无 |
| `spec-write-skill` | spec-write-skill | 创建、修改、迁移、修复或只读验证 project-owned Agent Skill；spec-first 治理按 project profile 加载 | 无 |
| `spec-app-consistency-audit` | spec-app-consistency-audit | 对移动 App 的 PRD、Figma、源码、路由、架构边界等做静态一致性审查 | 专家 prompts 位于 `skills/spec-app-consistency-audit/prompts/` |
| `spec-polish` | spec-polish | 启动 dev server、在浏览器打开功能并协作迭代改进 | 无（`disable-model-invocation`，浏览器迭代，不自动触发） |

## 三、Standalone Skill 的 Prompt Asset

| Skill | Skill-local prompt assets |
| --- | --- |
| spec-explain | `repo-profiler`、`work-recap-scout` |
| spec-pov | `project-grounding-scout`、`external-evidence-researcher`、`precedent-activity-scout`、`repo-profiler` |
| spec-resolve-pr-feedback | `pr-comment-resolver` |
| spec-simplify-code | `code-quality-reviewer`、`code-reuse-reviewer`、`efficiency-reviewer` |

## 四、备注

- **spec-write-tasks 是公开 workflow**，统一入口为 `spec-write-tasks`；它仍是 spec-plan 到 spec-work 之间的可选派生层，plan 始终是 single source of truth，task pack 是派生产物，不得反向扩展 plan 范围。
- **代码上下文默认走 direct evidence**：普通 workflow 使用 bounded source reads、`rg`、ast-grep、git diff、tests/logs 和用户提供证据，不依赖外部图谱 readiness 入口。
- **Prompt asset 激活分为三类**：always-on（如 code-review 的 correctness/testing/maintainability）；条件激活（按 diff 内容、文档信号或技术栈决定）；opt-in（如本地 Slack research prompt asset，需用户明确请求）。
- **dispatch 不可用时的降级行为**：`spec-code-review` 和 `spec-doc-review` 均定义了 dispatch 不可用时退化为单 agent 报告模式，不执行文档编辑或自动修复。
- **schema drift 已归并到 `data-migration-reviewer`**：不再保留独立 schema drift runtime agent。
