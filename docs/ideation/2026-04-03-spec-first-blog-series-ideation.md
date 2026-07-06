---
date: 2026-04-03
topic: spec-first-blog-series
focus: 输出连载博客
---

# Ideation: Spec-First 连载博客方向

## Codebase Context

`spec-first` 不是单点 CLI，而是一套面向 Claude Code 和 Codex 的中文优先 AI 工程工作流系统。仓库的核心叙事已经很明确：用 `doctor / init / clean` 管理运行时资产，用 `spec-*` 与 `spec-*` 提供稳定入口，用 `Stage-0`、`Ideate -> Brainstorm -> Plan -> Work -> Review -> Compound` 把 AI 编程从一次性对话升级为可安装、可治理、可复用的工程系统。

当前文档结构也支持“连续内容”而不是零散说明：`docs/05-用户手册/` 适合讲使用路径，`docs/08-版本更新/` 适合讲迭代故事，`docs/09-业界借鉴/` 已经形成外部知识输入索引，`docs/brainstorms/`、`docs/plans/`、`docs/solutions/` 则能把“想法 - 方案 - 修复 - 复盘”串成一条内容链。

最近几次更新给出了很好的博客切面：`mcp-setup` 解决环境落地门槛，`lang-governance` 把语言与 Changelog 规则写进治理层，`version-reminder` 让工具具备自我提醒能力，`spec-graph-bootstrap` 则把项目上下文生产和可靠性加固做成了 Stage-0 底座。再加上最近的解决方案文档里已经出现 Bash 3.2 兼容、MCP MySQL 一致性校验、PRD/worker 契约与失败恢复这些具体坑点，说明这个项目非常适合写成“工程化演进”的连载，而不是抽象的理念散文。

## Ranked Ideas

### 1. 从 Vibe Coding 到工程系统：Spec-First 的完整演进叙事
**Description:** 以“为什么一次性对话不够”为起点，串起 `spec-first` 的整体架构、工作流闭环、受管资产、双平台宿主和知识沉淀，作为整组连载的总纲。
**Rationale:** 这是最适合作为连载主标题的方向，能把项目的独特性一次讲清，也能给后续所有分篇提供统一框架。
**Downsides:** 容易写成宏大叙事，若每篇没有落到真实工件，会显得空。
**Confidence:** 94%
**Complexity:** Medium
**Status:** Unexplored

### 2. 冷启动到可用：`mcp-setup` + `doctor` + `init` 的首次成功路径
**Description:** 讲清用户如何从“刚装好”走到第一次真正可用，重点展开宿主检测、MCP 安装配置、平台分流、初始化与清理。
**Rationale:** 这是最贴近用户实际体验的系列，能直接回答“我为什么要装它、装完怎么用、为什么不会卡在环境里”。
**Downsides:** 容易偏操作指南，需要设计叙事结构，否则会像文档搬运。
**Confidence:** 91%
**Complexity:** Medium
**Status:** Unexplored

### 3. Stage-0 的真正价值：`spec-graph-bootstrap` 如何把上下文生产成底座
**Description:** 以 `spec-graph-bootstrap` 为主线，讲它如何把项目理解、层识别、数据库判断、PRD 合同、worker 分工和后续扩展变成可复用资产。
**Rationale:** 这是项目最有方法论味道的内容之一，也最容易形成“每篇一个真实问题”的连续专栏。
**Downsides:** 需要读者接受“上下文先于实现”的思路，前几篇门槛略高。
**Confidence:** 93%
**Complexity:** High
**Status:** Unexplored

### 4. 把治理写进工具：语言策略、Changelog 铁律和版本提醒
**Description:** 围绕 `lang-governance`、`CHANGELOG.md` 约束和 `version-reminder`，讲工具如何把“该做什么”变成自动执行的治理机制。
**Rationale:** 这一组非常适合写成“规范不是文档，而是执行层”的系列，既有产品价值，也有工程价值。
**Downsides:** 如果过于强调规则，可能被读者误解为纯内部治理，不够“好看”。
**Confidence:** 88%
**Complexity:** Medium
**Status:** Unexplored

### 5. 从修复到资产：`Review -> Compound -> docs/solutions` 的知识沉淀链
**Description:** 讲每次 review / bugfix / deep dive 如何沉淀成解决方案文档，最终反哺下一轮工作流，而不是让经验停留在聊天记录里。
**Rationale:** 这是一个很适合长期连载的主题，因为每个真实问题都能变成一篇“复盘+方法”的文章。
**Downsides:** 需要持续积累案例，短期内如果没有足够真实修复素材，连载深度会受限。
**Confidence:** 90%
**Complexity:** Medium
**Status:** Unexplored

### 6. Claude Code 和 Codex 的双宿主实践：同一套工作流如何跨平台落地
**Description:** 以 `spec-*` 和 `spec-*` 为切面，讲同一套工程工作流如何适配不同宿主、不同命令入口和不同 runtime 资产模型。
**Rationale:** 这是 `spec-first` 很独特的卖点，容易形成对外传播的辨识度。
**Downsides:** 平台差异写不好会显得分散，且需要同时照顾两个生态的读者。
**Confidence:** 84%
**Complexity:** Medium-High
**Status:** Unexplored

### 7. 可靠性不是附加题：从 Host Readiness Gate 到原子恢复
**Description:** 用 `spec-graph-bootstrap` 的加固、备份恢复、一致性校验、失败回滚和 Bash 兼容问题，讲一个 AI 工程工作流为什么必须把可靠性当主线。
**Rationale:** 这类内容很适合写成“工程底线”系列，能把项目从“会用”拉到“能长期运行”。
**Downsides:** 主题偏技术，传播面可能不如“从 Vibe Coding 到工程系统”大。
**Confidence:** 89%
**Complexity:** High
**Status:** Unexplored

## Recommended Serial Order

1. 从 Vibe Coding 到工程系统：Spec-First 的完整演进叙事
2. Stage-0 的真正价值：`spec-graph-bootstrap` 如何把上下文生产成底座
3. 冷启动到可用：`mcp-setup` + `doctor` + `init` 的首次成功路径
4. 把治理写进工具：语言策略、Changelog 铁律和版本提醒
5. 可靠性不是附加题：从 Host Readiness Gate 到原子恢复
6. 从修复到资产：`Review -> Compound -> docs/solutions` 的知识沉淀链
7. Claude Code 和 Codex 的双宿主实践：同一套工作流如何跨平台落地

## Rejection Summary

| # | Idea | Reason Rejected |
|---|------|-----------------|
| 1 | 单独围绕 `version-reminder` 写一整套连载 | 题材太窄，更适合作为“治理”系列中的一章，而不是独立主线 |
| 2 | 纯 AI 趋势评论 / 纯业界观点综述 | 容易和 `docs/09-业界借鉴/` 现有内容重叠，且缺少 `spec-first` 的仓库证据支撑 |

## Session Log
- 2026-04-03: Initial ideation — 7 candidates generated, 7 survived, 2 rejected from a larger candidate pool
- 2026-04-03: Review checkpoint — consolidated duplicate draft, kept the more specific blog-series artifact, and normalized the serial order to `总纲 -> Stage-0 -> 冷启动 -> 治理 -> 可靠性 -> 知识闭环 -> 双宿主`
- 2026-04-03: Export checkpoint — published a separate blog outline artifact for direct writing: `docs/ideation/2026-04-03-spec-first-blog-series-outline.md`
