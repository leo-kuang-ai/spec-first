# 公开入口与 Skill 目录

本文是当前 `spec-first` **公开入口真相源的用户可读投影**。机器可读权威仍是：

- `src/cli/contracts/dual-host-governance/skills-governance.json`（`entry_surface` / 宿主投递）
- `skills/*/SKILL.md`（触发条件、边界、产物）
- `.agents/skills/using-spec-first/SKILL.md` 或源码 `skills/using-spec-first/SKILL.md`（入口路由语义）

撰写时以 `package.json` / `spec-first -v` 的版本为准（当前为 `1.13.2`）。入口有增减时优先改 governance 与 skill source，再同步本页。

## 1. 怎么选入口

不要背全表。先描述你在哪，再进**一个**最匹配入口：

1. 用户已明确点名安全的公开 workflow → 进那个
2. 环境/MCP/helper 未就绪、失败/回归、文档评审、skill 包治理 → 对应 on-ramp
3. 主链路：WHAT 未定 → 计划 HOW → 实现 → 审查 → 沉淀
4. 其余：直接回答、有界读取或小范围低风险编辑（Direct Lane）

路由治理入口：`using-spec-first`（standalone，不产生 workflow 产物；只选入口并移交控制权）。

## 2. 主链路（定义 WHAT → 交付 → 沉淀）

| 场景 | 公开入口 | 典型 durable 产物 |
| --- | --- | --- |
| 需要 0–1 个方向 / 候选想法 | `spec-ideate` | `docs/ideation/*-ideation.md` |
| 想法有了，问题框架 / 用户 / 成功标准未定 | `spec-brainstorm` | `docs/brainstorms/*-requirements.md` |
| 已有产品 PRD/材料，进入研发前澄清与 plan 准入 | `spec-prd` | `docs/brainstorms/*-requirements.md`（planning-readiness） |
| 批评已有需求 / 计划 / 任务文档 | `spec-doc-review` | 审查结论（通常会话内；可写入团队约定路径） |
| 结果清楚，HOW 未定 | `spec-plan` | `docs/plans/*-plan.md` |
| 大计划需要可执行 task pack（可选） | `spec-write-tasks` | `docs/tasks/*-tasks.md` |
| 计划 / brief / 具体工作可执行 | `spec-work` | 代码变更 + 可选 `.spec-first/workflows/spec-work/...` |
| diff / 分支 / PR 需要质量判断 | `spec-code-review` | PR/会话结论；临时 handoff 在 OS temp |
| 已验证解法值得保留 | `spec-compound` | `docs/solutions/**` 或 `CONCEPTS.md` |
| 刷新 / 合并 / 退役已有 learnings | `spec-compound-refresh` | 更新后的 `docs/solutions/**` |

主链路不是强制状态机：只进当前最合适的一步；handoff 由活跃 workflow 拥有。

## 3. 公开 workflow 命令（`entry_surface: workflow_command`）

宿主侧统一写作 `spec-*`。Claude 常见为 slash / command；Codex / Cursor / Kiro / Qoder 以各宿主 skill discovery 为准。

| 入口 | 一句话用途 | 何时用 / 不用 |
| --- | --- | --- |
| `spec-mcp-setup` | 安装、校验、刷新 required harness runtime 与 helper readiness facts | 首次 setup、MCP/helper 缺失、provider 配置变化；不是每次 plan/work 的硬前置 |
| `spec-ideate` | 生成并评估 grounded 候选方向 | 还没选定方向；选定后转 brainstorm，不要在 ideate 里写 plan |
| `spec-brainstorm` | 把模糊想法收敛成 requirements-only 统一计划输入 | 要定 WHAT；不要用来直接写代码或做技术选型 verdict |
| `spec-prd` | 棕地 PRD / 需求材料的研发澄清与 plan 准入 | 已有产品材料要进入 planning；不要替代 brainstorm 的从零 framing |
| `spec-doc-review` | 用角色透镜评审需求 / 计划 / 规格文档 | 文档质量改进；不是代码 review |
| `spec-plan` | 多步工作的结构化实现计划 | HOW 未定；不要在 plan 阶段偷偷大规模改代码 |
| `spec-write-tasks` | 从已 settled 的 plan 编译可选 task pack | 高复杂度 / 并行 / 交接；小计划可跳过 |
| `spec-work` | 按 plan / brief / 明确工作项端到端实现 | 可执行工作；开放式 bug 用 `spec-debug` |
| `spec-code-review` | 结构化代码审查（缺陷、回归、测试、规范） | PR 前或明确要 review；browser dogfood 用 `spec-dogfood` |
| `spec-debug` | 失败行为诊断环 | 报错、回归、失败测试、卡住的调查 |
| `spec-compound` | 把已验证解法沉淀为可复用知识 | 工作已验证后；不要把未验证猜测写进 durable knowledge |
| `spec-compound-refresh` | 对照当前代码库刷新 `docs/solutions` | 审计过时 / 重叠 / 漂移 learnings |
| `spec-optimize` | 指标驱动的迭代优化环 | 有可测目标的实验；不是普通 feature 实现 |
| `spec-dogfood` | 面向当前分支/PR 的 hands-off 浏览器 QA | 变更流的自主 dogfood；协作式 UI polish 用 `spec-polish` |
| `spec-polish` | 起 dev server、在浏览器里打磨 UI | 用户明确要 polish 时；默认 user-invoked |
| `spec-app-consistency-audit` | 移动 App PRD/Figma/源码静态一致性审查 | 进模拟器/真机/打包前；不是普通 code review 或 PRD 写作 |
| `spec-write-skill` | 创建 / 修改 / 迁移项目拥有的 Agent Skill package，或只读 readiness 校验 | skill 包治理；一次性问答、纯第三方安装、手改 generated runtime 不要走这里 |


## 4. Standalone skills（`entry_surface: standalone_skill`）

不包装成 command-backed 主链路节点；按意图直接调用。部分宿主仅用户显式触发。

| 入口 | 一句话用途 |
| --- | --- |
| `using-spec-first` | 入口治理：选一个下一步入口，不创建 artifact |
| `spec-explain` | 把概念 / diff / 想法 / 近期工作做成面向你的 dense explainer |
| `spec-pov` | 对外部输入给出**项目语境下的**采纳 / 否决 verdict |
| `spec-strategy` | 创建或更新 `STRATEGY.md` |
| `spec-simplify-code` | 在行为不变前提下简化近期改动 |
| `spec-rule-miner` | 从代码证据挖掘项目约定，写入 `docs/ai/project-rules.md` 等 |
| `spec-product-pulse` | 按时间窗从配置信号生成产品 pulse 报告 |
| `spec-sweep` | 扫配置的反馈源（如 Slack、GitHub Issues） |
| `spec-riffrec-feedback-analysis` | 分析 Riffrec / 音视频反馈采集 |
| `spec-promote` | 为已上线特性起草发布 / 推广文案 |
| `spec-lfg` | **仅在用户明确要求时**跑从规划到绿 PR 的全自动管线 |

## 5. Internal helpers（`entry_surface: internal_only`）

**不是用户主入口。** 由公开 workflow 在需要时委托；用户手册不鼓励直接调用。

| Skill | 角色 |
| --- | --- |
| `spec-worktree` | 为并行 feature / PR review 准备隔离 worktree |
| `spec-commit` | 结构化 commit message |
| `spec-commit-push-pr` | commit + push + 开 PR / 刷新 PR 描述 |
| `spec-resolve-pr-feedback` | 处理 PR review 反馈 |
| `spec-proof` | Proof editor 协作审阅环 |
| `spec-test-browser` | 针对分支/PR 影响面的浏览器测试 |
| `spec-test-xcode` | iOS 模拟器构建与测试 |

## 6. Agent 与 skill 的关系（用户需要知道的）

- **Skill**：公开或内部的能力包（`SKILL.md` + 可选 scripts / references / agents）。
- **Agent（helper）**：写在 `skills/<skill>/references/agents/*.md` 的**可委派角色提示**；由宿主 subagent / worker 在 workflow 内按需加载，不是第二套用户 slash 命令清单。
- **Generated runtime**：`spec-first init` 把 source skills/agents 投影到 `.claude/`、`.agents/skills/`、`.codex/`、`.cursor/`、`.kiro/`、`.qoder/` 等；**source-of-truth 是 `skills/`**，不要手改 mirror。
- 常见 helper 主题（随 skill 存在，非完整清单）：`repo-profiler`、`learnings-researcher`、`web-researcher`、`architecture-strategist`、`security-sentinel`、`figma-design-sync`、`media-analyzer` 等。

用户侧正确用法：调用公开 `spec-*` / standalone skill；agent 由该 skill 自己决定是否委派。

## 7. 终端 CLI（与 skill 并列）

| 命令 | 用途 |
| --- | --- |
| `spec-first doctor [--host]` | 检查 CLI / managed runtime / 宿主投递健康 |
| `spec-first init [--host] [-y]` | 从 source 生成 / 刷新宿主 runtime |
| `spec-first update` | 升级 npm 包并触发 fresh init 刷新 |
| `spec-first clean --<host>` | 移除该宿主下 spec-first managed assets |
| `spec-first repair-worktree` | worktree pointer 修复指引 |
| `spec-first tasks …` / `spec-first session …` | task pack 确定性校验；opt-in 多 actor 会话 advisory |

环境健康优先 `doctor` / `init` / `update` / `clean`；MCP 与 helper readiness 用 `spec-mcp-setup`。

## 8. 与其他手册章节的关系

| 你想… | 去读 |
| --- | --- |
| 第一次装起来 | [快速开始](./01-快速开始.md) |
| 第一次走主链路 | [首次工作流走查](./09-首次工作流走查.md) |
| 理解 source / runtime / evidence | [核心概念](./02-核心概念.md) |
| 看产物写在哪、能不能提交 | [Workflows 与产物地图](./04-workflows-artifacts-map.md)、[产物目录](./10-产物目录.md) |
| `spec-prd` 细节 | [23-spec-prd 当前执行逻辑](./23-spec-prd当前执行逻辑.md) |
| 排障 | [常见问题](./04-常见问题.md) |

## 9. 维护约定

1. 新增 / 退役公开 skill：先改 `skills/` + `skills-governance.json`，再更新本页与 README 入口列表。
2. 禁止把 `internal_only` 写成「请用户直接运行」。
3. 只记录当前 `skills/` + governance 中存在的入口；不要在手册中保留已删除 skill/agent 的名称、路径或迁移对照。
4. 宿主差异只写 delivery 差异；面向用户的入口名保持 `spec-*` 统一。
