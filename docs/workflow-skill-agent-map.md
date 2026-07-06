---
# Spec-First Workflow 架构全景

## 一、核心 Workflow 链路

```
Codebase → Spec → Plan → Tasks → Code → Review → Knowledge
```

Context 不是顺序 workflow 节点，而是横切 evidence / harness layer：普通 workflow 通过 bounded source reads、`rg`、ast-grep、git diff、tests/logs、docs/solutions 和 runtime readiness facts 获取可验证上下文。

| 链路节点 | 对应 Workflow | 说明 |
|---------|-------------|------|
| Codebase | 终端 `spec-first update`、`spec-mcp-setup` | 建立运行时基线，修复 runtime drift |
| Spec | `spec-brainstorm`、`spec-prd`、`spec-ideate` | 需求探索与 PRD 产出 |
| Plan | `spec-plan` | 将需求转化为结构化实施计划 |
| Tasks | `spec-write-tasks` | 将计划编译为可执行任务包（可选派生层） |
| Code | `spec-work` | 系统化执行开发任务 |
| Review | `spec-code-review`、`spec-doc-review` | 结构化审查代码与文档；dispatch 可用且授权时使用多 persona，否则走 report-only / inline fallback |
| Knowledge | `spec-compound`、`spec-compound-refresh`、`spec-sessions` | 沉淀可复用工程知识，刷新/合并/退役旧 learning，并检索历史会话作为 recall support |

---

## 二、Workflow → Skill → Agent 映射表

| Workflow 命令 | Skill | 用途 | 调用的 Agent |
|-------------|-------|------|------------|
| `spec-brainstorm` | spec-brainstorm | 协作对话探索需求与方案，产出需求文档，交付给规划阶段 | spec-slack-researcher（工具可用且用户请求时） |
| `spec-prd` | spec-prd | 将增量需求或粗糙 PRD 转化为规范需求文档，供 spec-plan 消费 | 无 |
| `spec-ideate` | spec-ideate | 进入 brainstorm 前发散生成候选想法并批判性筛选，产出带排名的 ideation artifact | spec-learnings-researcher、spec-web-researcher（默认）；spec-issue-intelligence-analyst（用户引用 issue tracker 时）；spec-slack-researcher（opt-in） |
| `spec-plan` | spec-plan | 为多步骤任务创建结构化实施计划，或对现有计划做深化审查 | spec-repo-research-analyst、spec-learnings-researcher、spec-spec-flow-analyzer（条件）；spec-slack-researcher（opt-in）；spec-best-practices-researcher、spec-framework-docs-researcher（外部研究有价值时） |
| `spec-write-tasks` | spec-write-tasks | 将已定稿的 spec-plan 编译为派生任务包，或验证现有任务包完整性 | 无 |
| `spec-work` | spec-work | 接收任务包或计划，系统化执行开发工作，保证质量交付 | spec-figma-design-sync（UI 工作按需） |
| `spec-code-review` | spec-code-review | 结构化代码审查；dispatch 可用且授权时使用多 persona，缺失时走 report-only / inline fallback；置信度门控，合并去重，可选自动修复 | spec-correctness-reviewer、spec-testing-reviewer、spec-maintainability-reviewer、spec-project-standards-reviewer、spec-agent-native-reviewer、spec-learnings-researcher（默认核心）；spec-security-reviewer、spec-performance-reviewer、spec-api-contract-reviewer、spec-data-migrations-reviewer、spec-reliability-reviewer、spec-adversarial-reviewer、spec-cli-readiness-reviewer、spec-cli-agent-readiness-reviewer、spec-previous-comments-reviewer（条件 cross-cutting）；spec-dhh-rails-reviewer、spec-kieran-rails-reviewer、spec-kieran-python-reviewer、spec-kieran-typescript-reviewer、spec-julik-frontend-races-reviewer、spec-swift-ios-reviewer（stack-specific 条件）；spec-schema-drift-detector、spec-deployment-verification-agent（含迁移文件时） |
| `spec-doc-review` | spec-doc-review | 结构化文档审查；dispatch 可用且授权时使用多 persona，缺失时走 single-agent report-only fallback；发现一致性、可行性、范围、安全等问题，可选自动修复 | spec-coherence-reviewer、spec-feasibility-reviewer（always-on）；spec-product-lens-reviewer、spec-design-lens-reviewer、spec-security-lens-reviewer、spec-scope-guardian-reviewer、spec-adversarial-document-reviewer（条件激活） |
| `spec-debug` | spec-debug | 系统性排查 bug 根因，可选修复，适用于失败测试、运行时报错等场景 | 无（可派发匿名只读 sub-agent 并行调查） |
| `spec-optimize` | spec-optimize | 指标驱动的迭代优化循环，并行实验，按评分保留改进方案 | spec-learnings-researcher（Phase 0.3）；spec-repo-research-analyst（较大或陌生代码库时） |
| `spec-compound` | spec-compound | 问题刚解决时，通过并行子 agent 将解决方案沉淀到 docs/solutions/ | spec-performance-oracle（性能问题）；spec-security-sentinel（安全问题）；spec-data-integrity-guardian（数据库问题）；spec-code-simplicity-reviewer + 对应 kieran reviewer（代码密集型）；spec-pattern-recognition-specialist、spec-best-practices-researcher、spec-framework-docs-researcher（条件）；spec-session-historian（由 spec-sessions 间接调度） |
| `spec-compound-refresh` | spec-compound-refresh | 审查并刷新 docs/solutions/ 下已漂移的 learning 与 pattern 文档，更新/合并/替换/删除，维持知识库新鲜度 | 无具名 agent（用匿名 subagent 做调查与 replacement 的上下文隔离） |
| `spec-sessions` | spec-sessions | 搜索并综合历史 coding agent 会话，回答关于过去工作的问题 | spec-session-historian |
| `spec-slack-research` | spec-slack-research | 搜索 Slack 组织上下文，返回经解读的 research digest | spec-slack-researcher |
| `spec-mcp-setup` | spec-mcp-setup | 安装、配置并验证 spec-first 工作流所需宿主运行时，建立就绪基线 | 无 |
| `spec-skill-audit` | spec-skill-audit | 审计 skill 资产的源码质量、触发精度、边界契约与双宿主一致性 | 无 |
| `spec-write-skill` | spec-write-skill | 编写、改写、迁移或按 audit findings 修复 spec-first source skill | 无 |
| `spec-app-consistency-audit` | spec-app-consistency-audit | 对移动 App 的 PRD、Figma、源码、路由、架构边界等做静态一致性审查 | 无（专家判断由 skill-local prompts 承载） |
| `spec-release-notes` | spec-release-notes | 总结最近的 spec-first 发布，或带版本引用回答关于某次历史发布的具体问题 | 无（`disable-model-invocation`，纯检索，不自动触发） |
| `spec-polish-beta` | spec-polish-beta | [BETA] 启动 dev server、在浏览器打开功能并协作迭代改进 | 无（`disable-model-invocation`，浏览器迭代，不自动触发） |

---

## 三、所有 Agent 清单

- **spec-adversarial-document-reviewer** — 条件性文档审查 persona，文档规模大或涉及重大架构决策时激活，挑战前提假设并压力测试决策
- **spec-adversarial-reviewer** — 条件性代码审查 persona，diff 较大或涉及 auth/支付/数据变更等高风险域时激活，主动构造失败场景
- **spec-agent-native-reviewer** — 审查代码确保 agent-native 对等性——用户能做的操作，agent 也应能做
- **spec-ankane-readme-writer** — 按 Ankane 风格模板创建或更新 Ruby gem README，使用祈使语气和简洁散文
- **spec-api-contract-reviewer** — 条件性代码审查 persona，diff 涉及 API 路由/请求响应类型/序列化/版本控制时激活，检查合约破坏性变更
- **spec-architecture-strategist** — 从架构视角分析代码变更的模式合规性与设计完整性，适用于 PR 审查、新增服务或结构重构评估
- **spec-best-practices-researcher** — 研究并综合任何技术或框架的外部最佳实践、文档与示例，获取行业标准和社区规范
- **spec-cli-agent-readiness-reviewer** — 使用基于严重度的评估标准审查 CLI 源码/计划/规范的 AI agent 就绪度
- **spec-cli-readiness-reviewer** — 条件性代码审查 persona，diff 涉及 CLI 命令定义/参数解析时激活，审查 CLI 对自主 agent 的可用性
- **spec-code-simplicity-reviewer** — 实现完成后的最终审查，识别 YAGNI 违规和简化机会，确保代码尽可能简单最小
- **spec-coherence-reviewer** — 审查规划文档的内部一致性——章节间矛盾、术语漂移、结构问题和歧义
- **spec-correctness-reviewer** — 始终开启的代码审查 persona，检查逻辑错误、边界条件、状态管理 bug、错误传播失败和意图与实现不符
- **spec-data-integrity-guardian** — 审查数据库迁移、数据模型和持久化数据代码的安全性，检查迁移安全、数据约束、事务边界和隐私合规
- **spec-data-migration-expert** — 验证数据迁移、回填和生产数据转换的真实性，适用于涉及 ID 映射、列重命名、枚举转换或 schema 变更的 PR
- **spec-data-migrations-reviewer** — 条件性代码审查 persona，diff 涉及迁移文件/schema 变更/数据转换时激活，审查数据完整性和迁移安全
- **spec-deployment-verification-agent** — 生成 Go/No-Go 部署检查清单，包含 SQL 验证查询、回滚程序和监控计划，适用于涉及生产数据变更的 PR
- **spec-design-implementation-reviewer** — 对比线上 UI 实现与 Figma 设计，提供差异详细反馈，验证设计还原度
- **spec-design-iterator** — 通过 N 轮截图-分析-改进循环迭代优化 UI 设计，设计修改经多次尝试后仍未到位时主动使用
- **spec-design-lens-reviewer** — 审查规划文档中缺失的设计决策——信息架构、交互状态、用户流程和 AI slop 风险
- **spec-dhh-rails-reviewer** — 条件性代码审查 persona，Rails diff 引入可能与框架冲突的架构选择时激活，从 DHH 强主张视角审查
- **spec-feasibility-reviewer** — 评估规划文档中技术方案的可行性——架构冲突、依赖缺口、迁移风险和可实现性
- **spec-figma-design-sync** — 检测并修复 Web 实现与 Figma 设计之间的视觉差异，迭代同步实现与 Figma 规范
- **spec-framework-docs-researcher** — 收集框架/库/依赖的完整文档和最佳实践，获取官方文档、版本特定约束或实现模式
- **spec-git-history-analyzer** — 对 git 历史进行考古分析，追踪代码演变、识别贡献者并理解代码模式的存在原因
- **spec-issue-intelligence-analyst** — 获取并分析 GitHub Issues，呈现重复主题、痛点模式和严重性趋势，理解项目 issue 全貌
- **spec-julik-frontend-races-reviewer** — 条件性代码审查 persona，diff 涉及异步 UI 代码/Stimulus-Turbo 生命周期/DOM 时序时激活，审查竞态条件
- **spec-kieran-python-reviewer** — 条件性代码审查 persona，diff 涉及 Python 代码时激活，以 Kieran 的严格标准审查 Pythonic 清晰度和类型提示
- **spec-kieran-rails-reviewer** — 条件性代码审查 persona，diff 涉及 Rails 应用代码时激活，以 Kieran 的严格标准审查 Rails 规范和可维护性
- **spec-kieran-typescript-reviewer** — 条件性代码审查 persona，diff 涉及 TypeScript 代码时激活，以 Kieran 的严格标准审查类型安全和清晰度
- **spec-learnings-researcher** — 在 docs/solutions/ 中按 frontmatter 元数据检索适用的历史经验，在实现功能前获取制度性知识
- **spec-maintainability-reviewer** — 始终开启的代码审查 persona，检查过早抽象、不必要间接、死代码、模块耦合和命名晦涩问题
- **spec-pattern-recognition-specialist** — 分析代码中的设计模式、反模式、命名规范和重复，验证新代码是否遵循已有模式
- **spec-performance-oracle** — 分析代码的性能瓶颈、算法复杂度、数据库查询、内存使用和可扩展性
- **spec-performance-reviewer** — 条件性代码审查 persona，diff 涉及数据库查询/循环密集转换/缓存层/IO 密集路径时激活，审查运行时性能
- **spec-pr-comment-resolver** — 评估并解决一个或多个相关 PR 审查线程，返回含回复文本的结构化摘要
- **spec-previous-comments-reviewer** — 条件性代码审查 persona，PR 已有审查评论时激活，检查当前 diff 是否已解决先前反馈
- **spec-product-lens-reviewer** — 以高级产品负责人视角审查规划文档，挑战前提声明并评估战略影响
- **spec-project-standards-reviewer** — 始终开启的代码审查 persona，对照项目自身 CLAUDE.md 和 AGENTS.md 标准审查变更
- **spec-reliability-reviewer** — 条件性代码审查 persona，diff 涉及错误处理/重试/熔断/超时/后台任务时激活，审查生产可靠性
- **spec-repo-research-analyst** — 对仓库结构、文档、规范和实现模式进行全面研究，适用于新代码库上手或理解项目规范
- **spec-schema-drift-detector** — 通过对比包含的迁移文件，检测 PR 中不相关的 schema.rb 变更
- **spec-scope-guardian-reviewer** — 审查规划文档的范围对齐性和不必要复杂度，挑战无必要抽象和超出目标的范围
- **spec-security-lens-reviewer** — 在计划层面评估规划文档的安全缺口——认证授权假设、数据暴露风险、API 面漏洞
- **spec-security-reviewer** — 条件性代码审查 persona，diff 涉及 auth 中间件/公开端点/用户输入处理时激活，审查可利用漏洞
- **spec-security-sentinel** — 执行安全审计，检查漏洞、输入验证、认证授权、硬编码密钥和 OWASP 合规
- **spec-session-historian** — 综合先前 Claude Code 和 Codex coding-agent 会话中关于同一问题的发现，由 spec-sessions 编排器调用
- **spec-slack-researcher** — 在 Slack 中搜索与当前任务相关的组织上下文——决策、约束和未文档化的讨论
- **spec-spec-flow-analyzer** — 分析规范和功能描述的用户流程完整性与缺口识别，用于流程分析、边缘用例发现或需求验证
- **spec-swift-ios-reviewer** — 条件性代码审查 persona，diff 涉及 Swift 文件/SwiftUI 视图/UIKit 控制器等时激活，审查 SwiftUI 正确性和 Swift 并发
- **spec-testing-reviewer** — 始终开启的代码审查 persona，审查测试覆盖缺口、弱断言、脆性测试和缺失的边缘用例覆盖
- **spec-web-researcher** — 执行迭代式 web 研究并返回结构化外部基础信息（先验技术、相邻方案、市场信号、跨领域类比）

---

## 四、备注

- **spec-write-tasks 是公开 workflow**，统一入口为 `spec-write-tasks`；它仍是 spec-plan 到 spec-work 之间的可选派生层，plan 始终是 single source of truth，task pack 是派生产物，不得反向扩展 plan 范围。
- **代码上下文默认走 direct evidence**：普通 workflow 使用 bounded source reads、`rg`、ast-grep、git diff、tests/logs 和用户提供证据，不依赖外部图谱 readiness 入口。
- **Agent 激活分为三类**：always-on（如 spec-correctness-reviewer、spec-coherence-reviewer）；条件激活（按 diff 内容、文档信号或技术栈决定）；opt-in（如 spec-slack-researcher，需用户明确请求）。
- **dispatch 不可用时的降级行为**：spec-code-review 和 spec-doc-review 均定义了 dispatch 不可用时退化为单 agent 报告模式，不执行文档编辑或自动修复。
- **spec-session-historian** 不由 spec-compound 直接 dispatch，而是通过 spec-sessions skill 间接调度（Phase 1 Session History Enrichment）。
- **spec-ankane-readme-writer、spec-architecture-strategist、spec-data-migration-expert、spec-deployment-verification-agent、spec-design-implementation-reviewer、spec-design-iterator、spec-git-history-analyzer、spec-issue-intelligence-analyst、spec-performance-oracle、spec-pr-comment-resolver、spec-security-sentinel** 等 agent 存在于 agents/ 目录中，但当前 skill scan 未显示有 workflow 直接 dispatch 它们，属于可独立调用的 standalone agent 或由用户/其他上下文触发。
