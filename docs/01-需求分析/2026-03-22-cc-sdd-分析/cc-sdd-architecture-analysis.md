# cc-sdd 项目架构篇

文档日期：2026-03-22
分析对象：`/Users/kuang/xiaobu/cc-sdd`
版本基线：`tools/cc-sdd/package.json` 中版本 `2.1.1`
分支基线：`main`

## 1. 项目一句话定义

`cc-sdd` 不是一个 skill 仓库，也不是一个 agent 运行时，而是一个“把 Kiro 风格 Spec-Driven Development 工作流安装到多种 AI coding agent 中”的 CLI 脚手架系统。

它由四部分组成：

1. 一个 `cc-sdd` CLI，用于读取 manifest、解析模板、规划文件写入并执行安装。
2. 一套多平台 agent 模板，负责生成各 agent 可识别的命令、提示词、agent 文档和项目记忆文件。
3. 一套共享的 `.kiro/settings` 规则与模板，用来承载 requirements / design / tasks / steering 的统一规范。
4. 一组围绕 manifest、渲染、安装和平台差异的自动化测试。

可以把它理解为：

```text
                 cc-sdd
                    |
   +----------------+----------------+-----------------+
   |                                 |                 |
CLI 安装器层                      模板分发层          Spec 工作流层
   |                                 |                 |
读取 manifest / 规划写入             针对不同 agent 生成文件   requirements/design/tasks/validation
   |                                 |                 |
把工作流装进项目目录                 让不同 agent 都能用      让团队走同一套 SDD 流程
```

## 2. 顶层目录结构

```text
cc-sdd/
├── README.md                             项目定位、安装方式、工作流说明
├── docs/                                 用户指南、命令参考、迁移说明
├── tools/cc-sdd/                         真正的 NPM 包与 CLI 源码
│   ├── src/                              CLI、manifest、template、plan 逻辑
│   ├── templates/                        多 agent 模板与 shared settings
│   ├── test/                             vitest 测试
│   ├── package.json                      NPM 包定义
│   └── README*.md                        包级文档
├── assets/                               说明图
└── .kiro/                                项目自身的 Kiro 配置
```

核心判断：

- 仓库核心不在顶层，而在 `tools/cc-sdd/` 这个可发布包。
- `templates/` 是内容资产核心，`src/` 是分发执行核心。
- `docs/` 不是附属说明，而是对外方法论的一部分，因为项目本质上在推广一套开发流程。
- 这个仓库提供的是“安装进用户项目里的工作流”，不是在自身仓库里直接运行的工作流。

### 2.1 核心命令/流程功能表

| 命令 / 流程 | 类别 | 主要功能 | 典型输入 | 典型输出 |
| --- | --- | --- | --- | --- |
| `cc-sdd --claude` | 安装分发 | 为 Claude Code 安装 11 个 `/kiro:*` 命令、shared settings 和 `CLAUDE.md` 快速说明 | 目标项目目录、语言选项 | `.claude/commands/kiro/*`、`.kiro/settings/*`、`CLAUDE.md` |
| `cc-sdd --claude-agent` | 安装分发 | 为 Claude Code Subagents 版本安装命令、9 个 subagents 和项目记忆文档 | 目标项目目录、语言选项 | `.claude/commands/kiro/*`、`.claude/agents/kiro/*`、`.kiro/settings/*` |
| `cc-sdd --codex` | 安装分发 | 为 Codex CLI 安装 prompt 命令和 shared settings | 目标项目目录、语言选项 | `.codex/prompts/*`、`.kiro/settings/*`、`AGENTS.md` |
| `cc-sdd --cursor` | 安装分发 | 为 Cursor 安装命令模板和 shared settings | 目标项目目录、语言选项 | `.cursor/commands/kiro/*`、`.kiro/settings/*` |
| `cc-sdd --gemini` | 安装分发 | 为 Gemini CLI 安装 TOML 命令和共享模板 | 目标项目目录、语言选项 | `.gemini/commands/kiro/*`、`.kiro/settings/*` |
| `cc-sdd --copilot` | 安装分发 | 为 GitHub Copilot 安装 prompt 文件和 shared settings | 目标项目目录、语言选项 | `.github/prompts/*`、`.kiro/settings/*` |
| `cc-sdd --qwen` | 安装分发 | 为 Qwen Code 安装命令和 shared settings | 目标项目目录、语言选项 | `.qwen/commands/kiro/*`、`.kiro/settings/*` |
| `cc-sdd --opencode` | 安装分发 | 为 OpenCode 安装命令模板和 shared settings | 目标项目目录、语言选项 | `.opencode/commands/*`、`.kiro/settings/*` |
| `cc-sdd --opencode-agent` | 安装分发 | 为 OpenCode agent 版安装命令、agent 提示词和 shared settings | 目标项目目录、语言选项 | `.opencode/commands/*`、`.opencode/agents/*`、`.kiro/settings/*` |
| `cc-sdd --windsurf` | 安装分发 | 为 Windsurf 安装 workflows 和 shared settings | 目标项目目录、语言选项 | `.windsurf/workflows/*`、`.kiro/settings/*` |
| `/kiro:steering` | SDD 工作流 | 建立项目记忆与上下文 | 现有项目、架构背景 | `.kiro/steering/*.md` |
| `/kiro:spec-init` | SDD 工作流 | 初始化某个 feature 的 spec 工作区 | feature 描述 | `.kiro/specs/<feature>/` |
| `/kiro:spec-requirements` | SDD 工作流 | 产出 requirements 文档 | feature 名称、用户澄清 | `requirements.md` |
| `/kiro:spec-design` | SDD 工作流 | 先研究再生成设计文档 | feature 名称、已有 requirements | `research.md`、`design.md` |
| `/kiro:spec-tasks` | SDD 工作流 | 将设计拆成可并行任务 | feature 名称、已有 design | `tasks.md` |
| `/kiro:spec-impl` | SDD 工作流 | 执行指定任务并做实现 | feature 名称、task ids | 代码修改、任务状态更新 |
| `/kiro:validate-gap` | 质量门禁 | 分析现有系统与需求之间的差距 | brownfield feature | `gap-report.md` |
| `/kiro:validate-design` | 质量门禁 | 检查设计与现有系统的兼容性 | design 文档、现有代码 | `design-validation.md` |
| `/kiro:spec-status` | 状态追踪 | 查看 feature 当前阶段、审批与任务状态 | feature 名称 | CLI 摘要 |
| `/kiro:spec-quick` | 宏命令 | 在 subagent 模式下串起 init → requirements → design → tasks | 新 feature 描述 | 一整套初始 spec 文档 |

## 3. 核心设计思想

### 3.1 项目的核心不是“会写文档”，而是“会安装方法”

`cc-sdd` 的核心思想不是在仓库里直接执行 requirements/design/tasks，而是：

- 先把一套方法和模板安装到用户项目里。
- 再让用户自己的 agent 在该项目中按 `/kiro:*` 命令运行。

所以它更像：

```text
方法论发行器
  -> 把统一 SDD 工作流投放到项目目录
  -> 由用户的 agent 在本地项目中执行该工作流
```

### 3.2 用 manifest 驱动多平台分发

`src/index.ts` 的主链路是：

```text
解析参数
  -> 选择 agent
  -> 解析 manifest 路径
  -> 读取 manifest
  -> 结合上下文处理 artifacts
  -> 计算文件操作
  -> 按冲突策略写入项目目录
```

Manifest 的表达能力很清晰：

- `staticDir`
- `templateFile`
- `templateDir`
- `when.agent`
- `when.os`

也就是说，这个系统没有写死“每个平台该复制哪些文件”，而是把这件事抽象成可声明的安装计划。

### 3.3 共享设置层是工作流的单一真相源

`templates/shared/settings/` 下放的是：

- `templates/specs/*`
- `templates/steering/*`
- `rules/*`

这意味着 requirements / design / tasks / steering 的核心方法论其实不在某个 agent 目录下，而在 shared settings 里。

不同 agent 目录主要负责：

- 命令入口形式
- 文档文件名
- 语法适配
- 是否有 subagents

真正跨平台共享的是 `.kiro/settings` 这一层。

### 3.4 Agent 适配是外层壳，Kiro 方法是内层核

从 README 和模板目录看，项目显然受 Kiro methodology 启发。

它的关键结构是：

```text
Agent-specific shell
  + shared Kiro settings
  + unified command semantics
  = portable spec-driven workflow
```

所以从本质上说，cc-sdd 不是“为 8 个 agent 分别造 8 套流程”，而是“把同一套 Kiro 风格流程翻译成 8 种宿主格式”。

## 4. 项目运行主链路

### 4.1 安装 / setup 链路

用户执行：

```bash
npx cc-sdd@latest --claude --lang en
```

CLI 发生的事情大致是：

```text
解析 CLI 参数
  -> 如果未指定 agent 且在 TTY 中，则交互选择 agent
  -> 合并用户配置和运行时平台
  -> 确定 manifest
  -> planFromFile()
  -> buildFileOperations()
  -> summarizeCategories()
  -> determineCategoryPolicies()
  -> executeProcessedArtifacts()
```

设计含义：

- 这不是简单 `cp -R templates target`。
- 它在安装前会做规划、摘要、分类、冲突处理和可选备份。

### 4.2 Manifest 规划链路

核心函数 `planFromFile()` 的逻辑是：

```text
loadManifest()
  -> JSON 校验
  -> contextFromResolved()
  -> processManifest()
  -> 得到 ProcessedArtifact[]
```

`processManifest()` 负责：

- 判断 agent 是否匹配
- 判断 OS 是否匹配
- 用 `{{AGENT}}`、`{{KIRO_DIR}}`、`{{AGENT_DOC}}` 等占位符替换路径
- 产出标准化的 artifact 列表

这一步把“声明式安装计划”转成“具体文件操作前的逻辑计划”。

### 4.3 文件执行链路

`executeProcessedArtifacts()` 的逻辑是：

```text
遍历每个 FileOperation
  -> 判断目标是否已存在
  -> 结合 overwrite / skip / append 策略决定动作
  -> 必要时先做 backup
  -> write 或 append
  -> 统计 written / skipped
```

值得注意的设计点：

- 支持 category 级冲突策略，而不是只在文件级别决策。
- 对 project memory 文档支持 `append`，不是只有覆盖或跳过。
- 支持 `--dry-run`，先看计划再执行。

### 4.4 安装后的运行链路

安装完成后，真正的运行不再发生在 `cc-sdd` CLI 内，而在用户项目中：

```text
用户在项目里调用 /kiro:* 命令
  -> agent 读取安装好的命令模板
  -> 使用 .kiro/settings 里的 rules/templates
  -> 在 .kiro/specs/<feature>/ 下生成 specs
  -> 按 requirements/design/tasks/impl/validate/status 推进
```

因此：

- `cc-sdd` 是安装器。
- 被安装进项目的 prompt/template 才是实际执行体。

## 5. 多 agent 模板系统

### 5.1 Agent registry 是分发路由表

`src/agents/registry.ts` 定义了每个 agent 的：

- label
- description
- alias flags
- recommended models
- layout
- commands
- manifestId
- completion guide

这相当于项目里的“目标平台目录”：

```text
用户选择 --codex
  -> registry 返回 codex 的 layout / commands / manifestId
  -> CLI 决定写入 .codex/prompts 和 AGENTS.md
```

### 5.2 Manifest 是平台装配说明书

例如 `templates/manifests/claude-code.json` 表达的是：

- 把 `templates/agents/claude-code/commands` 装到 `.claude/commands/kiro`
- 把 `CLAUDE.md` 模板写到项目根目录
- 把 shared settings 装到 `.kiro/settings`

也就是说，一个 manifest 就能完整描述“某个 agent 版本应该拿到哪些资产”。

### 5.3 模板目录结构体现了“外壳 + 内核”分层

模板目录有两大块：

1. `templates/agents/<agent>/...`
   - 命令文件
   - docs/AGENTS.md 或 CLAUDE.md
   - 对于 agent 版还包括子代理 prompt

2. `templates/shared/settings/...`
   - requirements/design/tasks/research/init 模板
   - steering 模板
   - 各类 rules

这是典型的：

```text
agent-specific shell
  + shared workflow core
```

### 5.4 subagent 版本是增强分支

`--claude-agent` 和 `--opencode-agent` 比普通版本多出：

- `spec-quick`
- agent library
- 9 个子代理定义

`docs/guides/claude-subagents.md` 明确说明：

- `spec-quick` 会顺序串起 init / requirements / design / tasks
- 可以 interactive 或 `--auto`
- 会在每一步产出并允许人工 review

这说明 cc-sdd 不只是安装静态命令，还支持“宏命令 + subagent orchestration”。

## 6. 会话流程自动化

### 6.1 自动化主要发生在“安装后的命令体系”中

和 `superpowers` 不同，cc-sdd 本身不在会话启动时注入纪律，也不控制 agent 的所有行为。

它的自动化在于：

- 预先安装一套 `/kiro:*` 命令
- 让这些命令把 agent 会话推进到统一的 spec-driven 阶段

抽象如下：

```text
先用 cc-sdd 安装工作流
  -> 用户在项目内调用 /kiro:* 命令
  -> 命令按照模板和 rules 产出文档
  -> 文档继续驱动后续命令
```

### 6.2 典型流程表

| 阶段 | 命令 | 自动化动作 | 人工介入点 | 产物 |
| --- | --- | --- | --- | --- |
| 项目记忆 | `/kiro:steering` | 收集架构、规则、领域知识 | 审阅和补充 | `.kiro/steering/*.md` |
| Feature 初始化 | `/kiro:spec-init` | 创建 spec 工作区和骨架文件 | 指定 feature 描述 | `.kiro/specs/<feature>/` |
| 需求阶段 | `/kiro:spec-requirements` | 追问并整理 requirements | 回答澄清问题、审批 | `requirements.md` |
| 设计阶段 | `/kiro:spec-design` | 先研究，再形成 design | 审批设计 | `research.md`、`design.md` |
| 任务拆解 | `/kiro:spec-tasks` | 生成带并行波次标签的任务列表 | 审阅任务粒度 | `tasks.md` |
| 实现阶段 | `/kiro:spec-impl` | 按任务执行实现 | 选择 task ids 或审批实现 | 代码和状态更新 |
| 质量门禁 | `/kiro:validate-gap`、`/kiro:validate-design` | 分析需求差距和设计兼容性 | 决定是否修设计或需求 | validation 文档 |
| 状态追踪 | `/kiro:spec-status` | 汇总当前 spec 进度 | 无 | CLI 状态摘要 |
| 快速编排 | `/kiro:spec-quick` | 串起 init → req → design → tasks | 每阶段审批或 `--auto` | 完整初始 spec |

### 6.3 自动化闭环边界

cc-sdd 的闭环不是“从想法到最终 merge 的完整闭环”，而是“从工作流安装到 spec 产出与阶段推进的闭环”。

也就是说：

- 它能闭环 requirements/design/tasks/validation/status 这部分。
- 但它不负责统一的 code review、branch finish、session discipline、browser runtime 之类的系统层能力。

## 7. 测试与可验证性

### 7.1 测试对象是安装逻辑与模板渲染正确性

`tools/cc-sdd/test/` 下的测试覆盖了：

- `args` 解析
- `config` merge
- `os` 解析
- `agentLayout`
- `manifestLoader`
- `manifestPlanner`
- `manifestProcessor`
- `renderer`
- `planExecutor`
- `cli dry-run/apply`
- 各 real manifest 对应的平台安装结果

这说明它的测试重点不是“agent 会不会按 prompt 做事”，而是：

- CLI 是否把正确文件装到正确位置
- 占位符是否被正确替换
- 各 agent manifest 是否仍然有效

### 7.2 real manifest 测试很关键

例如 `realManifestClaudeCode.test.ts` 会实际：

- 运行 `runCli --dry-run`
- 检查 dry-run 输出中是否出现正确的安装计划
- 运行 apply
- 检查 `CLAUDE.md`、命令文件、settings 文件是否真的写入目标目录

这说明项目把“模板发行正确性”作为核心回归保障。

## 8. 项目最关键的工程取舍

### 8.1 选择“安装器”而不是“运行时”

这是整个项目最重要的取舍。

- 好处是轻量、通用、易分发、易适配多 agent。
- 代价是安装完成后，真正的执行质量依赖各宿主 agent 自己。

### 8.2 选择“声明式 manifest”而不是硬编码安装逻辑

这样做的收益很大：

- 新增一个 agent 时，主要扩展 manifest 和模板。
- CLI 核心逻辑保持稳定。
- 测试可以针对每个 manifest 单独做真实校验。

### 8.3 选择“共享 settings 内核 + agent 外壳”

这让项目避免了为每个平台维护完全不同的内容树。

真正共享的是：

- requirements 模板
- design 模板
- tasks 模板
- steering 模板
- rules

平台差异只存在于命令入口和包装文档。

### 8.4 选择“质量门禁内置到方法论”

`validate-gap` 和 `validate-design` 说明项目不是只追求“快出文档”，而是想把 brownfield 风险管理内置到 spec-driven 流程里。

这比普通的“requirements -> tasks -> impl”更完整。

## 9. 如何理解整个项目

如果用一句更工程化的话总结：

```text
cc-sdd = 多 agent 模板安装器
       + manifest 驱动的文件分发系统
       + shared Kiro-style settings 内核
       + spec-driven development 命令体系
       + 模板发行正确性测试
```

如果用组织结构来理解：

```text
用户项目
 |
 +--> 安装层: cc-sdd CLI
 |
 +--> 平台外壳: Claude / Codex / Cursor / Gemini / Copilot / OpenCode / Windsurf / Qwen
 |
 +--> 共享内核: .kiro/settings/templates + .kiro/settings/rules
 |
 +--> 生命周期命令: steering / spec-init / requirements / design / tasks / impl / validate / status
 |
 +--> 产物层: .kiro/steering + .kiro/specs/<feature>
```

## 10. 结论

这个仓库的真正价值不在某个单一 prompt，也不在 agent 自身运行时，而在它把 Kiro 风格 Spec-Driven Development 抽象成了一套可安装、可跨平台迁移、可测试验证的工作流发行系统：

- 有统一的 spec-driven 生命周期。
- 有 manifest 驱动的分发机制。
- 有共享 settings 内核。
- 有多 agent 外壳适配。
- 有质量门禁命令。
- 有围绕安装正确性的自动化测试。

所以从本质上说：

- `skills` 更像 workflow 素材库。
- `superpowers` 更像 coding agent 的流程框架。
- `cc-sdd` 更像 spec-driven workflow 的多平台安装器。
- `gstack` 则更接近带运行时能力的软件工程操作系统。
