# spec-kit 架构分析

## 1. 一句话定义

`spec-kit` 的本质不是会话运行时，也不是 agent harness 本体，而是一个 **Spec-Driven Development 的项目引导器（bootstrap toolkit）**。  
它通过 `specify` CLI、模板、脚本、agent 命令注册、preset/extension 机制，把一套可移植的 spec-first 工作流安装到目标项目中。

可以先压缩成一句：

> `spec-kit = Python CLI + core scaffolding pack + agent command adapter + preset / extension distribution layer`

---

## 2. 定义层：它要解决什么问题

从 README 和 CLI 定位看，`spec-kit` 试图解决的不是“让 AI 在会话里更聪明”，而是：

- 把一套标准化的 spec-driven 开发流程植入项目
- 让不同 AI agent 都能获得同一组 `/speckit.*` 工作命令
- 让模板、命令、脚本能被组织级自定义，而不必 fork 核心仓库
- 让这套流程既能在线拉取，也能在离线 / 内网环境中完成初始化

因此它的中心动作不是“持续编排 agent”，而是：

1. 安装 `specify`
2. 执行 `specify init`
3. 在项目中落下 `.specify/`、agent 命令目录、脚本和模板
4. 后续由宿主 agent 按 `/speckit.constitution -> specify -> plan -> tasks -> implement` 流程推进

---

## 3. 架构层：核心组成部件

### 3.1 顶层结构

这个仓库当前的核心目录可以分成 7 类：

| 模块 | 作用 |
| --- | --- |
| `src/specify_cli/` | `specify` CLI 主实现，负责初始化、检查、catalog、preset、extension、agent 适配 |
| `templates/` | 核心 artifact 模板与命令模板 |
| `scripts/` | bash / powershell 工作流脚本，承担 feature 目录、plan 初始化、agent 上下文更新等确定性动作 |
| `presets/` | 可堆叠模板覆盖系统，允许按组织或场景改写核心流程 |
| `extensions/` | 命令扩展系统，为 `speckit.*` 增加额外能力 |
| `tests/` | 重点验证脚手架、catalog、preset、extension、agent 命令输出一致性 |
| `docs/` | 安装、升级、扩展、发布等外围说明文档 |

### 3.2 CLI 是真正入口

`pyproject.toml` 把 `specify = "specify_cli:main"` 暴露为唯一主入口。  
所以 `spec-kit` 的真正产品不是 markdown 模板本身，而是：

- 一个 Python CLI
- 一组可嵌入 wheel 的核心资源
- 一套针对不同 agent 的命令投递规则

这也说明它更像“安装器 / 引导器”，而不是“长期驻留的运行时服务”。

### 3.3 agent 适配层是关键中间层

`src/specify_cli/agents.py` 和 `src/specify_cli/__init__.py` 中维护了大规模 agent 映射：

- Claude
- Codex
- Gemini
- Cursor
- Copilot
- Windsurf
- Kimi
- Tabnine
- Kiro CLI
- Qwen / Roo / Amp / SHAI / Bob 等

它不是简单把一个模板复制到固定目录，而是做了统一抽象：

- 每个 agent 有自己的命令目录
- 每个 agent 的文件格式可能不同
- 参数占位符不同
- 某些 agent 需要 companion prompt 文件
- 某些 agent 走 `skills/<name>/SKILL.md` 结构而不是普通命令文件

所以 `spec-kit` 的关键价值之一，是把一套 spec workflow 翻译成不同宿主都可消费的命令资产。

### 3.4 preset / extension 是两种不同扩展面

仓库把可扩展性拆成两个平行系统：

#### preset

`src/specify_cli/presets.py` 负责管理 `preset.yml` 定义的模板包。  
它的目标是覆盖和重组工作流基础内容：

- artifact template
- command template
- script template

它是“改写默认流程和产物形态”的机制。

#### extension

`src/specify_cli/extensions.py` 负责管理 `extension.yml` 定义的功能扩展。  
它的重点是增加新的 `speckit.<extension>.<command>` 命令，并支持 hook 声明。

它是“在核心工作流外增加附加能力”的机制。

#### 两者差异

| 机制 | 主要作用 | 典型结果 |
| --- | --- | --- |
| preset | 覆盖模板、命令、脚本 | 改写 spec/plan/tasks/checklist 及命令行为 |
| extension | 新增命令与钩子 | 在流程中插入额外命令能力 |

### 3.5 offline core pack 是最新版本的重要升级

当前最新版本已经把核心资源打包进 wheel：

- 模板
- 命令模板
- bash / powershell 脚本
- release packaging 脚本

`pyproject.toml` 里通过 `tool.hatch.build.targets.wheel.force-include` 把这些内容嵌入 `specify_cli/core_pack`。

这意味着 `spec-kit` 现在不再单纯依赖网络下载远端模板仓库，而是能在：

- 离线环境
- 内网环境
- air-gapped 企业环境

中直接完成初始化。  
这是它从“在线模板初始化器”向“可发行工作流产品”迈出的关键一步。

---

## 4. 运行层：项目如何真正工作

### 4.1 主运行链路

`spec-kit` 的主运行链路可以抽象为：

```text
specify CLI
-> 选择 agent / script 变体
-> 从 core pack / 模板目录解析资源
-> 将命令写入 agent 对应目录
-> 将模板和脚本写入 .specify/
-> 用户在 agent 中调用 /speckit.* 命令推进 spec workflow
```

这说明它把“工作流运行”拆成了两段：

1. `specify init` 负责安装与布局
2. agent 会话负责消费这些布局好的命令和模板

### 4.2 产物结构

初始化后，项目里通常会形成这些关键区域：

| 路径 | 作用 |
| --- | --- |
| `.specify/templates/` | 工作流使用的核心模板 |
| `.specify/scripts/` | shell / powershell 的确定性辅助脚本 |
| `.specify/presets/` | 已安装 preset |
| `.specify/extensions/` | 已安装 extension |
| `.claude/commands/`、`.codex/prompts/` 等 | 宿主 agent 可直接调用的 `speckit.*` 命令 |

所以 `spec-kit` 的状态中心不是 daemon 内存，也不是数据库，而是 **项目目录中的脚手架文件树**。

### 4.3 脚本层的功能

`scripts/bash/` 与 `scripts/powershell/` 提供了对称脚本实现，主要承担确定性、不适合交给 LLM 自由发挥的动作：

| 脚本 | 功能 |
| --- | --- |
| `check-prerequisites` | 检查 git、agent CLI、环境前置条件 |
| `create-new-feature` | 生成 feature 编号、分支名、spec 目录，支持自动编号与时间戳命名 |
| `setup-plan` | 初始化计划文件与特性目录上下文 |
| `update-agent-context` | 刷新 agent 所需的项目上下文文件 |
| `common` | 提供路径解析、模板定位、分支校验等公共函数 |

这些脚本说明 `spec-kit` 并不完全依赖自然语言流程，它把关键路径里的可重复动作固化成了脚本。

### 4.4 模板层的功能

`templates/` 里同时存在两类资产：

| 类型 | 文件 | 作用 |
| --- | --- | --- |
| artifact 模板 | `spec-template.md`、`plan-template.md`、`tasks-template.md`、`constitution-template.md`、`checklist-template.md` | 规定各阶段产物结构 |
| command 模板 | `templates/commands/*.md` | 规定 agent 在各阶段如何行动 |

因此 `spec-kit` 不是只定义“产物长什么样”，也定义“agent 生成产物时该怎么做”。

### 4.5 会话自动化边界

`spec-kit` 里当然有 workflow automation，但它不是 `superpowers` 或 `planning-with-files` 那种会话治理系统。

它的自动化边界是：

- 强在初始化自动化
- 强在模板分发自动化
- 强在 agent 命令注册自动化
- 中等强度在 feature/plan 等脚本自动化
- 弱在运行时会话状态管理
- 几乎没有持续驻留式 orchestration

换句话说，它自动化的是“把工作流装进项目”，不是“在整个会话周期里持续接管 agent”。

---

## 5. 校验层：测试在验证什么

`tests/` 的设计非常能说明这个项目的工程重心。

### 5.1 重点不是业务测试，而是发行与脚手架正确性

当前测试重点集中在：

- agent 配置一致性
- AI skills/frontmatter 一致性
- extension manifest 校验与安装卸载
- preset manifest、catalog、resolver 与优先级
- branch numbering / timestamp branch 命名
- merge 逻辑
- core pack scaffold 与 release 产物逐字节一致性

尤其 `test_core_pack_scaffold.py` 很关键，它验证：

- 每种 agent 输出目录是否正确
- 命令文件数量是否与模板一致
- 占位符是否被正确替换
- markdown / toml 格式是否符合目标 agent 预期
- 脚手架结果是否与 release 脚本打包结果逐字节一致

这说明它的测试目标不是“AI 是否表现得聪明”，而是：

> “这套工作流资产能否稳定、正确、可发行地被安装到不同 agent 和不同环境中”

---

## 6. 编排层：整体协作关系

可以把 `spec-kit` 的整体协作关系压缩成下面这张图：

```text
specify CLI
-> core pack / templates / scripts
-> agent adapter
-> preset resolver
-> extension manager
-> write scaffold into target project
-> host agent consumes /speckit.* commands
-> project follows constitution/specify/plan/tasks/implement lifecycle
```

这也说明一个关键点：

`spec-kit` 的核心编排点发生在 **安装时**，不是 **执行时**。

---

## 7. 与前面几个项目的定位差异

放到这组项目里看，`spec-kit` 的位置很明确：

| 项目 | 本质定位 |
| --- | --- |
| `skills` | workflow 素材库 / skill 仓库 |
| `superpowers` | 会话级流程纪律框架 |
| `cc-sdd` | 多 agent spec workflow 安装器 |
| `planning-with-files` | 持久化工作记忆 skill |
| `everything-claude-code` | 多层 agent harness 系统 |
| `OpenSpec` | artifact-guided spec workflow engine |
| `spec-kit` | spec-driven 项目引导器与模板分发系统 |

如果和 `OpenSpec` 对比：

- `OpenSpec` 更像一个在项目内持续运转的 workflow engine
- `spec-kit` 更像一个把 workflow 脚手架植入项目的 bootstrap toolkit

如果和 `cc-sdd` 对比：

- 两者都带安装器属性
- 但 `cc-sdd` 更偏多 agent 模板发行
- `spec-kit` 更偏标准化命令、模板、脚本、preset/extension 的统一生态

---

## 8. 最终判断

### 8.1 结论

`spec-kit` 不应被理解成“一个 prompt 仓库”或“一个 AI agent runtime”。  
它更准确的定义是：

> 一个面向 Spec-Driven Development 的跨 agent 脚手架平台。

它做的事情包括：

- 用 Python CLI 提供统一入口
- 用 core pack 提供可离线分发的标准资产
- 用 agent adapter 兼容多种宿主
- 用模板与命令定义 workflow
- 用脚本承接确定性动作
- 用 presets / extensions 提供组织级可扩展性

### 8.2 用最短一句话总结

```text
spec-kit 不是运行 AI 的系统，而是把 spec-driven 工作流安装进项目和 agent 的系统。
```

### 8.3 再压缩成公式

```text
spec-kit = specify CLI
         + embedded core pack
         + multi-agent command registration
         + template/script scaffolding
         + preset/extension ecosystem
```

