# OpenSpec 项目架构篇

文档日期：2026-03-22
分析对象：`/Users/kuang/xiaobu/OpenSpec`
版本基线：`package.json` 中版本 `1.2.0`
分支基线：`main`

## 1. 项目一句话定义

`OpenSpec` 不是一个单纯的 specs 文档模板仓库，而是一个“把 spec-driven workflow 变成可执行 CLI、可编辑模板、可适配多 AI 工具命令”的 AI-native 规格开发系统。

它由四部分组成：

1. 一个 `openspec` CLI，负责初始化、更新、列出、查看、验证、归档和配置。
2. 一个 schema + artifact graph 内核，用来定义 proposal/specs/design/tasks 等工件以及依赖关系。
3. 一个 command / skill generation 系统，把同一套 workflow 翻译到 20+ AI 工具。
4. 一个 `openspec/` 项目目录约定，用于承载变更、规格、配置和自身的规格开发。

可以把它理解为：

```text
                 OpenSpec
                    |
   +----------------+----------------+------------------+
   |                                 |                  |
CLI 工作流层                      Artifact 内核层      多工具适配层
   |                                 |                  |
init/update/list/view/apply/archive  schema + graph     Claude/Codex/Cursor/Gemini...
   |                                 |                  |
驱动规格生命周期                     定义工件与依赖       让不同工具共享同一工作流
```

## 2. 顶层目录结构

```text
OpenSpec/
├── README.md                              项目定位、快速开始、OPSX 入口
├── package.json                           NPM 包与 CLI 入口
├── src/                                   CLI、commands、core 逻辑
├── schemas/                               内置 schema 与默认模板
├── openspec/                              仓库自身的 OpenSpec 工作区
│   ├── config.yaml                        项目级 schema/context/rules
│   ├── changes/                           变更提案与归档
│   ├── specs/                             正式规格
│   └── explorations/                      研究与工作流探索
├── docs/                                  使用指南、命令文档、OPSX 说明
├── test/                                  CLI、commands、schema、workflow 测试
├── scripts/                               postinstall、构建、测试辅助
└── bin/openspec.js                        CLI 启动入口
```

核心判断：

- `src/core/` 是系统核心，不是 `docs/`。
- `openspec/` 目录不是示例，而是仓库自己用 OpenSpec 管理自身演进的证据。
- `schemas/` + `src/core/artifact-graph/` 决定了 OpenSpec 的“规格系统”属性。
- `src/core/command-generation/` 说明它不是只服务一个 agent，而是多工具 workflow 发行器。

### 2.1 核心命令 / 工作流功能表

| 命令 / 工作流 | 类别 | 主要功能 | 典型输入 | 典型输出 |
| --- | --- | --- | --- | --- |
| `openspec init` | 初始化 | 在项目中建立 OpenSpec 目录、命令、skills 和配置 | 项目路径、目标 AI tools、profile | `openspec/` 目录、工具命令、技能文件 |
| `openspec update` | 更新 | 刷新已配置工具的命令 / skills / profile 内容 | 项目路径、force 标志 | 更新后的工具文件 |
| `openspec list` | 查询 | 列出 active changes 或 specs | 当前项目 | 变更或规格列表 |
| `openspec view` | 查询 | 交互式 dashboard 查看 specs 和 changes | 当前项目 | 交互式视图 |
| `openspec change show/validate` | 查询校验 | 显示或校验 change proposal | change 名称 | Markdown/JSON 输出、校验结果 |
| `openspec archive` | 生命周期 | 完成后归档 change | change 名称 | archived change |
| `openspec config` | 配置 | 调整 profile / delivery / global config | profile、工具设置 | 配置更新 |
| `openspec schema` | 架构 | 查看 / 管理 schema 相关信息 | schema 名称 | schema 信息 |
| `/opsx:propose` | 新工作流 | 一次性创建 change 并生成 proposal/design/specs/tasks 等 artifacts | 需求描述或 change 名称 | 完整 planning artifacts |
| `/opsx:apply` | 新工作流 | 按 tasks 实施变更并同步 artifacts | 当前变更 | 代码与 task 更新 |
| `/opsx:archive` | 新工作流 | 变更完成后归档并同步 specs | 当前变更 | archive 结果 |
| `/opsx:explore` | 新工作流 | 在立项前自由探索问题、选项和约束 | 初步想法 | 探索结论，过渡到 propose |
| `openspec status --change <name> --json` | Artifact 工作流 | 返回 artifact 状态、依赖和 applyRequirements | change 名称 | artifact 状态 JSON |
| `openspec instructions <artifact> --change <name> --json` | Artifact 工作流 | 生成某一工件的 instructions、template、rules、context | artifact id、change 名称 | 可执行 artifact 指令包 |

## 3. 核心设计思想

### 3.1 “fluid not rigid” 是架构层原则，不只是文案

README 一开头就把哲学写成：

- fluid not rigid
- iterative not waterfall
- built for brownfield

这在 `docs/opsx.md` 里被具体化成了 OPSX workflow：

- actions, not phases
- dependencies are enablers, not forced sequence

所以 OpenSpec 的架构目的不是把开发强制切成僵硬阶段，而是：

- 用 artifacts 提供结构
- 用 dependencies 告诉你下一步可能做什么
- 允许你来回修订 proposal/specs/design/tasks

### 3.2 规格不只是 Markdown 文件，而是 artifact graph

`src/core/artifact-graph/` 明确把系统建模成：

- artifact schema
- dependency graph
- completed / blocked state detection
- instruction loading
- change context generation

也就是说，OpenSpec 真正管理的不是“几个 md 模板”，而是：

```text
proposal -> specs -> design -> tasks -> apply
```

这样一个可计算的 artifact graph。

### 3.3 把 workflow prompt 从代码里抽出来

`docs/opsx.md` 对 legacy workflow 的批评很明确：

- instructions hardcoded
- all-or-nothing
- black box

新的 OPSX 把这件事重构成：

- schema.yaml
- templates/*.md
- artifact instructions

再通过 `openspec instructions ... --json` 提供给 agent。

这意味着 OpenSpec 的核心取舍是：

- 让工作流 prompt 可读、可改、可测试
- 而不是藏在 TypeScript 条件分支里

### 3.4 多 AI 工具只是外壳，workflow 才是内核

`src/core/command-generation/adapters/` 下有大量 adapter：

- `claude`
- `codex`
- `cursor`
- `gemini`
- `github-copilot`
- `opencode`
- `kiro`
- `continue`
- `windsurf`
- `qwen`
- 以及更多

`generator.ts` 的角色非常简单：接受 tool-agnostic `CommandContent`，交给不同 adapter 生成对应文件路径和格式。

这表明 OpenSpec 的核心设计是：

```text
统一 workflow 内容
  -> adapter 翻译
  -> 不同 AI 工具落地
```

而不是为每个工具重新发明一套工作流。

### 3.5 项目配置是可注入的，不是隐藏常量

`src/core/project-config.ts` 支持：

- `schema`
- `context`
- `rules`

并且会在生成 instructions 时注入到 artifact 流程中。

因此项目级知识不是系统 prompt 黑箱，而是：

- `openspec/config.yaml`
- 可以直接改
- 会立即影响 artifact 指令

## 4. 项目运行主链路

### 4.1 初始化链路

`openspec init` 的职责不是只建目录，它会：

```text
验证 project path
  -> 检查 openspec 目录是否已存在
  -> 清理 legacy artifacts（如需要）
  -> 检测项目中可用 AI tools
  -> 迁移到 profile system（如需要）
  -> 交互式欢迎和工具选择
  -> 创建 openspec 目录结构
  -> 生成 skills 和 commands
  -> 创建 config.yaml
```

所以 `init` 的本质是：为当前项目“安装 OpenSpec workflow shell”。

### 4.2 更新链路

`openspec update` 的职责是：

```text
检查 openspec 是否存在
  -> 读取 global config（profile / delivery）
  -> 迁移旧配置
  -> 发现已配置 tools
  -> 检测版本状态和 profile drift
  -> 只更新需要更新的 tools
  -> 删除已取消选择的 commands/skills
```

这说明它不是简单“覆盖重写”，而是带状态感知的同步器。

### 4.3 Artifact 工作流链路

OPSX 的核心运行方式不是固定命令链，而是：

```text
/opsx:propose
  -> openspec new change "<name>"
  -> openspec status --change "<name>" --json
  -> 根据 artifacts 的 ready / dependencies / applyRequires
  -> 逐个 openspec instructions <artifact> --change "<name>" --json
  -> agent 生成各 artifact
  -> 直到 apply-ready
```

这是一个非常关键的结构点：

- CLI 提供 machine-readable 状态
- agent 消费状态并推进工作流
- artifacts 之间的依赖由系统计算，而不是写死在 prompt 中

### 4.4 命令生成链路

命令生成主链路大致是：

```text
定义 workflow templates
  -> 生成 tool-agnostic CommandContent
  -> 选择 adapter
  -> 生成 tool-specific files
```

这就是为什么 OpenSpec 能支持 20+ tools 而不至于完全分叉。

## 5. OPSX 与旧工作流

### 5.1 旧工作流的问题

根据 `docs/opsx.md`，旧工作流的问题包括：

- instructions hardcoded
- one big command
- fixed structure
- difficult to experiment

### 5.2 OPSX 的新思路

OPSX 的关键变化是：

- 从 phase-based 走向 action-based
- 从 monolithic command 走向 artifact-guided workflow
- 从 package 内硬编码 prompt 走向 schema + template + instructions

这使 OpenSpec 从“CLI 生成几份文档”变成“可持续调优的 workflow engine”。

### 5.3 核心自动化模式

| 阶段 | 自动化动作 | 人工介入点 | 产物 |
| --- | --- | --- | --- |
| change 初始化 | 创建 change 目录和元数据 | 确定 change 名称 | `openspec/changes/<name>/` |
| artifact 依赖分析 | 通过 `status --json` 计算哪些 artifact ready | 审核生成顺序 | artifact 状态图 |
| instructions 生成 | 为指定 artifact 生成 context/rules/template/instruction/outputPath | 修改 context/rules/schema | artifact-specific instruction pack |
| agent 生成内容 | 根据 instruction pack 写 proposal/specs/design/tasks | 审批内容和修订 | artifact 文件 |
| apply-ready 检查 | 判断 `applyRequires` 是否都完成 | 决定是否开始实现 | 可实施状态 |
| archive | 完成后归档变更并更新 specs | 审批归档 | archived change |

## 6. `openspec/` 目录本身的意义

这是和很多同类项目不同的地方。

仓库内部已经在用自己的系统管理自己：

- `openspec/config.yaml`
- `openspec/changes/*`
- `openspec/specs/*`
- `openspec/explorations/*`

这说明 OpenSpec 的定位不是“文档给别人看”，而是：

- 先在自己身上 dogfood
- 自己的变更也走同一套 specs/change workflow

这为架构判断提供了很强证据：它是一个真正的 workflow system，而不是 marketing shell。

## 7. 测试与可验证性

### 7.1 测试范围较完整

`test/` 覆盖了：

- commands
- telemetry
- prompts
- artifact workflow
- completion
- config profile
- schema
- cli e2e
- source specs normalization

这说明它测试的对象不只是 CLI 参数，而包括：

- workflow 输出
- artifact 状态推进
- 交互式命令行为
- schema 和模板规范

### 7.2 测试重点是“workflow correctness”

和 `cc-sdd` 偏安装正确性不同，OpenSpec 更在乎：

- CLI 是否生成对的 artifact
- status/instructions 是否能正确驱动 workflow
- command generation 是否符合预期
- interactive flow 是否顺畅

## 8. 项目最关键的工程取舍

### 8.1 选择“artifact graph”而不是静态阶段机

这让系统可以：

- fluid
- iterative
- brownfield-friendly

但代价是实现更复杂，需要状态计算和依赖解析。

### 8.2 选择“workflow 可编辑”而不是“prompt 硬编码”

这是 OPSX 最重要的工程升级。

它带来的好处是：

- 更容易实验
- 更容易定制
- 更容易调试差输出

### 8.3 选择“多工具 adapter”而不是绑定单一平台

OpenSpec 不像 Kiro 那样绑定 IDE，也不像某些 skill 包只服务 Claude。

它真正追求的是：

- workflow portability
- tool-neutral semantics
- adapter-based delivery

### 8.4 选择“项目配置注入”而不是“全局模板写死”

`openspec/config.yaml` 允许每个项目把：

- schema
- context
- rules

注入到 instructions 中，这让 OpenSpec 更适合团队和 brownfield 场景。

## 9. 如何理解整个项目

如果用一句更工程化的话总结：

```text
OpenSpec = spec-driven CLI
         + artifact graph engine
         + editable workflow templates
         + multi-tool command/skill generator
         + project-local spec workspace
```

如果用组织结构来理解：

```text
用户项目
 |
 +--> CLI 层: init / update / list / view / validate / archive / config
 |
 +--> Artifact 内核: proposal / specs / design / tasks / applyRequires
 |
 +--> 配置层: openspec/config.yaml
 |
 +--> 适配层: Claude / Codex / Cursor / Gemini / Copilot / OpenCode / ...
 |
 +--> 工作区: openspec/changes + openspec/specs + openspec/explorations
```

## 10. 结论

这个仓库的真正价值不在“多几个 slash command”，而在它把 spec-driven development 变成了一个：

- 可执行的 CLI
- 可计算的 artifact graph
- 可编辑的 workflow prompt 系统
- 可适配多 AI 工具的命令生成器
- 可在项目内长期运行的规格工作区

所以从本质上说：

- `skills` 更像 workflow 素材库。
- `superpowers` 更像 coding agent 流程框架。
- `cc-sdd` 更像 spec-driven workflow 安装器。
- `planning-with-files` 更像持久化工作记忆 skill。
- `everything-claude-code` 更像 agent harness performance platform。
- `OpenSpec` 则更像 “artifact-guided spec workflow engine”。
