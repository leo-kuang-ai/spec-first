---
title: "Compound Engineering 仓库审计：CLI / plugin / skill / agent 四层结构"
date: 2026-03-28
category: developer-experience
problem_type: developer_experience
component: architecture
root_cause: "仓库同时包含 CLI 管道、plugin 打包、skill 编排和 persona agent，最清晰的审计视角是拆成四层。"
resolution_type: reference_map
severity: low
tags:
  - architecture
  - cli
  - plugin
  - skills
  - agents
  - onboarding
  - audit
---

# Compound Engineering 分层审计

## ASCII 图

```text
User
  |
  v
CLI 层 (src/)
  |-- convert / install / sync / list / plugin-path
  |-- parse Claude plugin or Claude home
  |-- select target registry + write output
  v
Plugin 层 (plugins/compound-engineering/)
  |-- .claude-plugin/plugin.json
  |-- AGENTS.md / README.md
  |-- agents/  skills/  hooks/  MCP config
  v
Skill 层 (skills/*/SKILL.md)
  |-- ce:* workflows orchestrate the work
  |-- branch into parallel subagents where useful
  v
Agent 层 (agents/*.md)
  |-- specialized persona reviewers / researchers / workflow helpers
  |-- return structured findings or text for synthesis
```

## 1) CLI 层

这一层是安装、转换和同步的入口。只要出现路径、目标选择或文件落盘异常，优先从这里审计。

| 命令 | 责任 | 主要文件 |
|---|---|---|
| `convert` | 把 Claude plugin 目录转换成其他目标格式 | `src/commands/convert.ts`, `src/parsers/claude.ts`, `src/targets/` |
| `install` | 解析 plugin 来源，然后转换并写入 | `src/commands/install.ts`, `src/parsers/claude.ts`, `src/targets/` |
| `sync` | 把 Claude home 配置同步到支持的平台 | `src/commands/sync.ts`, `src/parsers/claude-home.ts`, `src/sync/` |
| `list` | 列出 `plugins/` 下可用的 Claude plugins | `src/commands/list.ts` |
| `plugin-path` | 将某个分支检出到可复用缓存路径，供 `claude --plugin-dir` 使用 | `src/commands/plugin-path.ts` |

审计要点：

- `src/index.ts` 负责把子命令串起来。
- `convert` 和 `install` 共用 `src/targets/index.ts` 的目标注册表。
- `sync` 是单独的反向链路，从 `~/.claude` 同步到各目标平台。
- `plugin-path` 支持分支并有缓存，这对 worktree 和 PR 测试很重要。

## 2) Plugin 层

这一层是可分发的产品内容，也是被转换、安装或同步的对象。

| 面向 | 包含什么 | 为什么重要 |
|---|---|---|
| `plugins/compound-engineering/` | 主 plugin 包 | 核心产品面 |
| `plugins/coding-tutor/` | 次级 plugin 包 | 独立的 plugin 工作区 |
| `.claude-plugin/plugin.json` | plugin 清单 | 声明名称、版本、描述、MCP servers |
| `agents/` | persona 文件 | 可复用的子 agent，由 skill 调用 |
| `skills/` | 工作流编排器 | slash command 入口和 prompt 包 |
| `hooks/` | hook 配置 | 平台事件绑定 |
| `README.md` | 面向用户的清单和用法说明 | 数量、命令和安装说明 |
| `AGENTS.md` / `CLAUDE.md` | plugin 级指令 | 这个子树的开发规则 |

当前清单快照：

- Agents: `47`
- Skills: `41`
- MCP servers: `1` (`context7`)

审计备注：

- `README.md` 只是高层地图，真实清单以文件扫描结果为准。
- `sync` 属于 CLI 层，不是 skill 文件。
- beta / experimental skill 会用 `disable-model-invocation: true` 标记。

## 3) Skill 层

skill 是编排层。用户通过 slash command 触发它，每个 skill 决定是直接执行、提问、启动子 agent，还是做结果综合。

### 核心工作流

| Skill | 作用 |
|---|---|
| `ce:brainstorm` | 探索问题并写出需求 |
| `ce:compound` | 把已解决的问题沉淀成长期知识 |
| `ce:ideate` | 生成并筛选改进想法 |
| `ce:plan` | 把需求转成实现计划 |
| `ce:review` | 并行 code review 并合并结果 |
| `ce:work` | 执行已批准的计划 |

### 实验性 / 邻接工作流

| Skill | 作用 |
|---|---|
| `agent-native-audit` | 审计 agent-native 架构 |
| `ce:compound-refresh` | 刷新过时的 learnings 和 pattern docs |
| `ce:work-beta` | 带 delegate 的实验性执行版 |
| `lfg` | 全自动工程工作流 |
| `slfg` | swarm 模式自动工作流 |

### Git 工作流

| Skill | 作用 |
|---|---|
| `git-clean-gone-branches` | 清理远端已消失的分支 |
| `git-commit` | 创建语义明确的 commit |
| `git-commit-push-pr` | commit、push 并开 PR |
| `git-worktree` | 管理隔离 worktree |

### 工作流工具

| Skill | 作用 |
|---|---|
| `changelog` | 生成面向发布的 changelog |
| `deploy-docs` | 校验并准备文档部署 |
| `feature-video` | 录制特性演示视频 |
| `onboarding` | 生成贡献者 onboarding 文档 |
| `reproduce-bug` | 根据 issue 复现 bug |
| `report-bug-ce` | 给插件本身报 bug |
| `resolve-pr-feedback` | 并行处理 PR 评论 |
| `test-browser` | 跑浏览器相关测试 |
| `test-xcode` | 跑 iOS 模拟器测试 |
| `todo-resolve` | 批量解决 todo |
| `todo-triage` | 对 todo 做优先级和分类 |

### 开发框架

| Skill | 作用 |
|---|---|
| `agent-native-architecture` | 构建 prompt-native agent 系统 |
| `andrew-kane-gem-writer` | 按 Andrew Kane 风格写 Ruby gem |
| `dhh-rails-style` | 按 DHH 风格写 Rails 代码 |
| `dspy-ruby` | 构建 DSPy.rb LLM 系统 |
| `frontend-design` | 构建高质量前端界面 |

### Review 与质量

| Skill | 作用 |
|---|---|
| `claude-permissions-optimizer` | 优化 Claude 权限白名单 |
| `document-review` | 并行 persona 审核文档/计划 |
| `setup` | 项目级 setup 占位 |

### 内容与协作

| Skill | 作用 |
|---|---|
| `every-style-editor` | 按 Every 风格编辑文案 |
| `proof` | 协作式 markdown 编辑 |
| `todo-create` | 持久化文件 todo 跟踪 |

### 自动化与工具

| Skill | 作用 |
|---|---|
| `agent-browser` | 浏览器自动化 CLI |
| `gemini-imagegen` | 图片生成与编辑 |
| `orchestrating-swarms` | 多 agent swarm 编排指南 |
| `rclone` | 云存储同步和上传 |

skill 层审计要点：

- `ce:*` skill 是主要工作流面。
- 有些 skill 故意只做 beta，不会自动触发。
- skill 通常负责编排其他 agent，不是最终推理层。
- `ce:review` 和 `ce:compound` 是最重要的多 agent 枢纽。

## 4) Agent 层

agent 是可复用 persona，通常不直接给用户调用，而是由 skill 作为子 agent 启动。

### Review

| Agent | 作用 |
|---|---|
| `adversarial-reviewer` | 通过构造失败链来打破实现 |
| `agent-native-reviewer` | 检查 agent / 用户动作是否对等 |
| `api-contract-reviewer` | 发现 API / schema 破坏 |
| `architecture-strategist` | 审查架构形态 |
| `cli-agent-readiness-reviewer` | 判断 CLI 是否真正适合 agent |
| `code-simplicity-reviewer` | 找出 YAGNI 违背和无谓复杂度 |
| `correctness-reviewer` | 找逻辑和边界 bug |
| `data-integrity-guardian` | 保护迁移和持久化数据 |
| `data-migration-expert` | 验证数据映射和回填 |
| `data-migrations-reviewer` | 审查迁移安全性 |
| `deployment-verification-agent` | 生成上线检查清单 |
| `dhh-rails-reviewer` | 用 DHH 约定审查 Rails 改动 |
| `julik-frontend-races-reviewer` | 检测前端异步竞态 |
| `kieran-python-reviewer` | 审查 Python 改动 |
| `kieran-rails-reviewer` | 审查 Rails 应用代码 |
| `kieran-typescript-reviewer` | 审查 TypeScript 代码 |
| `maintainability-reviewer` | 找耦合、死代码、命名问题 |
| `pattern-recognition-specialist` | 识别重复模式和反模式 |
| `performance-oracle` | 查找性能瓶颈 |
| `performance-reviewer` | 审查运行时性能风险 |
| `project-standards-reviewer` | 执行仓库级规范 |
| `reliability-reviewer` | 检查重试、超时和失败模式 |
| `schema-drift-detector` | 检测无关 schema 漂移 |
| `security-reviewer` | 找可利用漏洞 |
| `security-sentinel` | 做更深的安全审计 |
| `testing-reviewer` | 找覆盖缺口和脆弱测试 |

### 文档审查

| Agent | 作用 |
|---|---|
| `adversarial-document-reviewer` | 挑战计划中的前提假设 |
| `coherence-reviewer` | 找矛盾和术语漂移 |
| `design-lens-reviewer` | 发现缺失的设计决策 |
| `feasibility-reviewer` | 判断计划能否真正落地 |
| `product-lens-reviewer` | 挑战范围和问题定义 |
| `scope-guardian-reviewer` | 抵制不必要的复杂度 |
| `security-lens-reviewer` | 找计划层面的安全缺口 |

### 研究

| Agent | 作用 |
|---|---|
| `best-practices-researcher` | 收集外部最佳实践 |
| `framework-docs-researcher` | 拉取官方框架文档 |
| `git-history-analyzer` | 读取 git 历史背景 |
| `issue-intelligence-analyst` | 把 GitHub issues 聚成主题 |
| `learnings-researcher` | 搜索内部 solutions 知识 |
| `repo-research-analyst` | 梳理仓库结构和约定 |

### 设计

| Agent | 作用 |
|---|---|
| `design-implementation-reviewer` | 对照 Figma 比较实现 |
| `design-iterator` | 迭代式优化 UI 输出 |
| `figma-design-sync` | 将 web 实现同步到 Figma |

### 文档

| Agent | 作用 |
|---|---|
| `ankane-readme-writer` | 生成 Ankane 风格 README |

### 工作流

| Agent | 作用 |
|---|---|
| `bug-reproduction-validator` | 通过复现验证 bug 报告 |
| `lint` | 对 Ruby / ERB 文件执行 lint |
| `pr-comment-resolver` | 解决单条 PR review 线程 |
| `spec-flow-analyzer` | 找 spec 中缺失的用户流 |

agent 层审计要点：

- 大多数 review agent 使用 `Read`、`Grep`、`Glob`、`Bash`。
- 大部分 persona 采用 `inherit` model，少数轻量角色用 `haiku`。
- `ce:review` 会从 review 层动态挑选 reviewer。
- `document-review` 和 `ce:compound` 是主要的多 agent 文档工作流。

## 跨层审计链路

| 从 | 到 | 需要验证什么 |
|---|---|---|
| CLI | Plugin | 命令是否解析到正确的 source tree 和 manifest？ |
| Plugin | Skill | skill 名称是否能映射到真实 `SKILL.md` 和预期 frontmatter？ |
| Skill | Agent | skill 是否启动了正确 persona，并传入足够上下文？ |
| Agent | Synthesizer | orchestrator 合并结果时是否丢信号？ |

## 工作流与产物

### 通用流程

```text
用户输入
  |
  v
CLI / plugin 入口
  |
  v
选择 skill
  |
  +-----------------------------+
  |                             |
  v                             v
读上下文 / 读文档 / 读 diff     需要提问时等待用户
  |
  v
启动 agent 子任务
  |
  v
并行 / 串行执行
  |
  v
skill 汇总结果
  |
  v
输出最终产物
```

### 分层流程

```text
┌──────────────────────────────────────────────────────────────┐
│ 1. 入口层                                                    │
│ 用户 / CLI / plugin                                          │
│ 产物：命令参数、上下文、目标 skill                            │
└──────────────────────────────────────────────────────────────┘
                           |
                           v
┌──────────────────────────────────────────────────────────────┐
│ 2. Skill 编排层                                              │
│ 读取输入、判定流程、选择 agent、决定并行或串行                │
│ 产物：执行策略、任务拆分、待调用 agent 列表                   │
└──────────────────────────────────────────────────────────────┘
                           |
                           v
┌──────────────────────────────────────────────────────────────┐
│ 3. Agent 执行层                                              │
│ 专业 persona 分别做分析、审查、研究、提炼                    │
│ 产物：JSON / 文本结果 / finding / 证据 / 建议                 │
└──────────────────────────────────────────────────────────────┘
                           |
                           v
┌──────────────────────────────────────────────────────────────┐
│ 4. Skill 汇总层                                              │
│ 合并结果、去重、筛选、排序、必要时再触发后续 workflow          │
│ 产物：最终报告 / 文档 / 计划 / 解决方案 / TODO                │
└──────────────────────────────────────────────────────────────┘
```

### 各阶段产物

| 阶段 | 产物 |
|---|---|
| 入口层 | 命令参数、目标上下文、当前 branch / diff / 文档路径 |
| Skill 决策层 | 任务拆分、执行策略、agent 列表、是否并行、是否提问 |
| Agent 执行层 | 结构化 findings、研究笔记、对比结论、证据、建议 |
| Skill 汇总层 | 最终输出文档、review 报告、plan、knowledge doc、todo、后续动作 |

### `ce:review` 的阶段产物

```text
diff/base
  -> 选 reviewer
  -> 并行 subagents
  -> 每个 agent 输出 JSON findings
  -> skill 去重/合并/过滤
  -> 最终 review report
```

| 阶段 | 产物 |
|---|---|
| Stage 1: scope | `BASE:`、文件列表、diff、`UNTRACKED:` |
| Stage 3: 选人 | reviewer team 清单 |
| Stage 4: subagents | 每个 reviewer 的 JSON findings |
| Stage 5: merge | 去重后的 findings、残余风险、测试缺口 |
| Stage 6: synthesize | 最终 review 报告、结论、修复/残余工作 |

### `ce:compound` 的阶段产物

```text
问题上下文
  -> 3 个并行 subagents
  -> 合并结果
  -> 写 docs/solutions/
  -> 必要时触发 compound-refresh
```

| 阶段 | 产物 |
|---|---|
| Context Analyzer | 前置分类结果、frontmatter 骨架、目标目录、文件名建议 |
| Solution Extractor | 问题描述、根因、解决方案、预防策略、测试建议 |
| Related Docs Finder | 相关文档链接、overlap 评估、刷新候选 |
| Assembly & Write | 最终 `docs/solutions/...md` 文件 |
| Refresh Check | 是否触发 `ce:compound-refresh` 的判断 |
| Final | 已写入的知识文档 / 更新后的旧文档 |

## 建议阅读顺序

如果你在审计一个行为问题，建议按这个顺序读：

1. CLI 入口和命令绑定
2. Plugin manifest 和清单
3. Skill 编排文档
4. Agent persona 文件

如果你审计的是 review / 知识沉淀流程，直接从 skill 层开始，再看它启动的 agent。
