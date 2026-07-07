本页是你当前所在的 **Quick Start** 页面，目标是在最短路径内完成三件事：安装 `spec-first` CLI、为一个受支持宿主生成运行时、在宿主会话里运行第一个 `spec-*` 工作流并看到仓库内产物。这里不展开完整架构、团队治理或多仓库策略；这些内容会在后续页面继续阅读。Sources: [README.zh-CN.md](README.zh-CN.md#L36-L45), [src/cli/index.js](src/cli/index.js#L158-L174)

## 先理解：Quick Start 的最小架构假设

`spec-first` 的快速上手路径可以理解为一条很简单的链路：你安装 npm 包得到 `spec-first` 命令；在项目根目录运行 `spec-first init`；CLI 把仓库里的 source assets 投射成 Claude Code、Codex、Kiro、Qoder 或 Cursor 可加载的 generated runtime assets；随后你在宿主会话里调用 `spec-*` 工作流，工作流把需求、计划、任务、评审或经验沉淀为仓库内 artifact。Sources: [package.json](package.json#L2-L8), [README.zh-CN.md](README.zh-CN.md#L193-L199), [src/cli/index.js](src/cli/index.js#L165-L174)

```mermaid
flowchart LR
  A[安装 spec-first CLI] --> B[在项目根目录运行 doctor]
  B --> C[运行 spec-first init]
  C --> D[生成宿主 runtime assets]
  D --> E[重启 Claude Code / Codex / Kiro / Qoder / Cursor]
  E --> F[在宿主会话运行 spec-brainstorm]
  F --> G[检查 docs/brainstorms/ 下的新 artifact]
```

这张图只覆盖 Quick Start 的第一圈闭环：安装、检查、初始化、重启宿主、运行第一个 workflow、检查产物。更完整的生命周期会继续走向 plan、tasks、work、review 和 knowledge，但本页只要求你先确认第一个可检查 artifact 能落地。Sources: [README.zh-CN.md](README.zh-CN.md#L94-L111), [skills/spec-brainstorm/SKILL.md](skills/spec-brainstorm/SKILL.md#L24-L37)

## 你需要准备什么

开始前请确认你有 Node.js `>=20.0.0`、npm、Git，以及至少一个已安装的宿主：Claude Code、Codex、Kiro、Qoder 或 Cursor。`package.json` 明确声明 CLI 入口是 `bin/spec-first.js`，Node 引擎要求是 `>=20.0.0`；`doctor` 命令会检查 Node.js 和 Git，并在宿主 CLI 不可验证时给出 warning 或修复建议。Sources: [package.json](package.json#L6-L8), [package.json](package.json#L112-L114), [src/cli/commands/doctor.js](src/cli/commands/doctor.js#L106-L145), [src/cli/commands/doctor.js](src/cli/commands/doctor.js#L148-L200)

| 准备项 | 为什么需要 | 如何确认 |
|---|---|---|
| Node.js `>=20.0.0` | 运行 `spec-first` CLI | `node -v`，或让 `spec-first doctor` 检查 |
| npm | 全局安装 npm 包 | `npm -v` |
| Git | `doctor`、setup 与工作流会读取仓库事实 | `git --version`，或让 `spec-first doctor` 检查 |
| 一个受支持宿主 | 工作流入口由宿主在 `init` 后提供 | Claude Code、Codex、Kiro、Qoder 或 Cursor |
| 项目仓库根目录 | runtime assets 与 workflow artifacts 写入当前项目 | 在目标项目根目录执行命令 |

Sources: [README.zh-CN.md](README.zh-CN.md#L40-L45), [src/cli/commands/doctor.js](src/cli/commands/doctor.js#L42-L65), [src/cli/commands/doctor.js](src/cli/commands/doctor.js#L106-L145)

## Step 1：安装 CLI

在 macOS、Linux 或 Windows 终端里安装全局 npm 包，然后立刻运行 `doctor`。`README.zh-CN.md` 将这一步定义为快速开始的第一步；CLI 帮助也把 `doctor` 描述为检查环境、runtime asset manifest 和 managed runtime assets 的命令。Sources: [README.zh-CN.md](README.zh-CN.md#L47-L72), [src/cli/index.js](src/cli/index.js#L165-L169)

```bash
npm install -g spec-first
spec-first doctor
```

如果你在 Windows 上使用 PowerShell 或 `cmd.exe`，安装命令仍然是 `npm install -g spec-first`，之后运行 `spec-first doctor`；项目 README 对 PowerShell 与 cmd.exe 都给出了同样的快速开始命令。Sources: [README.zh-CN.md](README.zh-CN.md#L56-L70)

## Step 2：初始化宿主 runtime

在你要启用 `spec-first` 的项目根目录运行 `spec-first init`。交互式初始化会让你选择宿主、确认开发者姓名与语言，然后预览写入内容；当前 CLI 支持的初始化宿主包括 Claude Code、Codex、Cursor、Kiro 与 Qoder。Sources: [README.zh-CN.md](README.zh-CN.md#L74-L88), [src/cli/commands/init.js](src/cli/commands/init.js#L77-L113), [src/cli/commands/init.js](src/cli/commands/init.js#L178-L231)

```bash
spec-first init
```

如果你要脚本化初始化，`init` 支持显式宿主参数，例如 `--claude`、`--codex`、`--cursor`、`--kiro`、`--qoder`，也支持 `-y/--yes`；但非交互模式需要满足 CLI 的身份默认值要求，否则会返回错误。Sources: [src/cli/index.js](src/cli/index.js#L165-L169), [src/cli/commands/init.js](src/cli/commands/init.js#L126-L149), [README.zh-CN.md](README.zh-CN.md#L80-L86)

| 你使用的宿主 | 初始化方式 | 生成位置的快速理解 |
|---|---|---|
| Claude Code | `spec-first init` 后选择 Claude Code，或使用 `--claude` | 生成 `.claude/` 相关 runtime |
| Codex | `spec-first init` 后选择 Codex，或使用 `--codex` | 生成 `.codex/` 与 `.agents/skills/` 相关 runtime |
| Kiro | 选择 Kiro，或使用 `--kiro` | 生成 `.kiro/` 相关 runtime |
| Qoder | 选择 Qoder，或使用 `--qoder` | 生成 `.qoder/` 相关 runtime |
| Cursor | 显式选择 Cursor，或使用 `--cursor` | 生成 `.cursor/skills/**` 与 `.cursor/spec-first/**`；当前是 generated-runtime preview |

Sources: [README.zh-CN.md](README.zh-CN.md#L80-L88), [README.zh-CN.md](README.zh-CN.md#L197-L199), [src/cli/commands/init.js](src/cli/commands/init.js#L77-L113)

## Step 3：重启宿主

`spec-first init` 写入的是宿主要加载的 runtime assets，所以初始化完成后请重启宿主或打开一个新会话。注意：`spec-brainstorm` 这类 workflow 入口不是 shell 命令，而是在 Claude Code、Codex、Kiro、Qoder 或 Cursor 会话里运行。Sources: [README.zh-CN.md](README.zh-CN.md#L90-L101), [src/cli/index.js](src/cli/index.js#L174-L174)

## Step 4：运行第一个 workflow

第一次建议从 `spec-brainstorm` 开始，因为它的职责是澄清“要做什么”，并把可移交的需求 brief 写入 `docs/brainstorms/`。在宿主会话中输入下面的内容，把引号里的文字换成你的真实任务。Sources: [README.zh-CN.md](README.zh-CN.md#L94-L111), [skills/spec-brainstorm/SKILL.md](skills/spec-brainstorm/SKILL.md#L9-L12), [skills/spec-brainstorm/SKILL.md](skills/spec-brainstorm/SKILL.md#L21-L29)

```text
spec-brainstorm "描述你的第一个任务"
```

`spec-brainstorm` 适合已有一个用户提出的问题、功能或改进方向，但行为、范围、用户、成功标准或交接上下文还不清楚的场景；如果已经是明确实现、debug、review 或 setup，就应该走其他入口。Sources: [skills/spec-brainstorm/SKILL.md](skills/spec-brainstorm/SKILL.md#L15-L20), [skills/spec-brainstorm/SKILL.md](skills/spec-brainstorm/SKILL.md#L39-L53)

## Step 5：检查第一个 artifact

运行完成后，在仓库里检查是否出现类似下面的文件。这个文件就是你的第一份可检查、可移交的仓库内产物；它证明这次 AI coding 对话没有只停留在聊天窗口里，而是留下了可复用的工程记录。Sources: [README.zh-CN.md](README.zh-CN.md#L103-L111), [skills/spec-brainstorm/SKILL.md](skills/spec-brainstorm/SKILL.md#L24-L29)

```text
docs/brainstorms/YYYY-MM-DD-NNN-<topic>-requirements.md
```

## Quick Start 后你会看到的项目结构

完成第一圈后，你不一定会看到所有目录都有新文件；最小成功信号是 `docs/brainstorms/` 下出现第一个需求 artifact。随着后续 workflow 推进，项目可能继续积累 plans、tasks、review findings、solutions，以及由宿主加载的 generated runtime assets。Sources: [README.zh-CN.md](README.zh-CN.md#L125-L141), [README.zh-CN.md](README.zh-CN.md#L193-L199)

```text
your-project/
├── docs/
│   ├── brainstorms/      # 第一个 spec-brainstorm artifact 通常在这里
│   ├── plans/            # 后续 spec-plan 产物
│   ├── tasks/            # 后续 spec-write-tasks 产物
│   └── solutions/        # 后续 spec-compound 经验沉淀
├── .claude/              # Claude Code generated runtime，按选择生成
├── .codex/               # Codex generated runtime，按选择生成
├── .agents/skills/       # Codex / skill runtime mirror，按选择生成
├── .cursor/              # Cursor generated-runtime preview，按选择生成
├── .kiro/                # Kiro generated runtime，按选择生成
├── .qoder/               # Qoder generated runtime，按选择生成
└── .spec-first/          # 部分 workflow / state / evidence 相关输出
```

这些 runtime copies 是可重建镜像，不是你应该手工维护的 source truth；如果 runtime 漂移或宿主看不到入口，优先重新运行 `spec-first init` 并重启宿主。Sources: [README.zh-CN.md](README.zh-CN.md#L197-L199), [docs/05-用户手册/01-快速开始.md](docs/05-用户手册/01-快速开始.md#L180-L199)

## 常见第一步选择

如果你的第一个任务不是“从模糊想法开始”，可以按下面的表选择入口。Quick Start 只要求你先跑通一个入口；更完整的路由规则请继续阅读后续页面。Sources: [README.zh-CN.md](README.zh-CN.md#L113-L123), [src/cli/index.js](src/cli/index.js#L174-L174)

| 你的第一个任务是…… | 建议入口 |
|---|---|
| 粗略想法、功能方向或产品变化 | `spec-brainstorm` |
| 已有 PRD、需求笔记或 brownfield change request | `spec-prd` |
| bug、失败测试、堆栈或异常行为 | `spec-debug` |
| 已定计划、task pack 或范围明确的实现请求 | `spec-work` |
| 需要审查文档、计划、task pack、diff 或实现 | `spec-doc-review` 或 `spec-code-review` |

Sources: [README.zh-CN.md](README.zh-CN.md#L113-L123)

## 如果没有成功

如果 `spec-first doctor` 没有检测到任何平台，它会提示你运行 `spec-first init` 并选择 Claude Code、Codex、Cursor、Kiro 或 Qoder；如果检查到错误，`doctor` 会返回错误状态并打印对应 fix。Sources: [src/cli/commands/doctor.js](src/cli/commands/doctor.js#L52-L65), [src/cli/commands/doctor.js](src/cli/commands/doctor.js#L68-L103)

| 现象 | 先做什么 |
|---|---|
| `doctor` 提示 Node.js 版本太低 | 安装 Node.js 20 或更新版本 |
| `doctor` 提示 Git not found | 安装 Git 并确保它在 `PATH` 中 |
| 宿主里看不到 `spec-*` 入口 | 重新运行 `spec-first init`，然后完全重启宿主 |
| 不确定当前项目是否初始化过 | 在项目根目录再次运行 `spec-first doctor` |
| Cursor 相关行为不符合预期 | 记住 Cursor 当前是 generated-runtime preview，不应当作完整 loader validation 已完成的宿主支持 |

Sources: [src/cli/commands/doctor.js](src/cli/commands/doctor.js#L106-L145), [src/cli/commands/doctor.js](src/cli/commands/doctor.js#L148-L200), [docs/05-用户手册/01-快速开始.md](docs/05-用户手册/01-快速开始.md#L180-L199), [README.zh-CN.md](README.zh-CN.md#L86-L88)

## 下一步阅读

你现在已经完成 Quick Start 的目标：安装 CLI、初始化宿主 runtime、运行第一个工作流，并知道去哪里检查第一个 artifact。建议下一步按目录顺序继续阅读：[安装前置条件与宿主选择](3-an-zhuang-qian-zhi-tiao-jian-yu-su-zhu-xuan-ze)，然后阅读 [首次初始化：为 Claude Code、Codex、Kiro、Qoder 与 Cursor 生成运行时](4-shou-ci-chu-shi-hua-wei-claude-code-codex-kiro-qoder-yu-cursor-sheng-cheng-yun-xing-shi)，最后进入 [运行第一个需求工作流并检查仓库产物](5-yun-xing-di-ge-xu-qiu-gong-zuo-liu-bing-jian-cha-cang-ku-chan-wu)。Sources: [README.zh-CN.md](README.zh-CN.md#L36-L45), [README.zh-CN.md](README.zh-CN.md#L103-L123)

如果你想直接理解主链路，可以继续读 [从想法到代码的主链路：Spec → Plan → Tasks → Code → Review → Knowledge](7-cong-xiang-fa-dao-dai-ma-de-zhu-lian-lu-spec-plan-tasks-code-review-knowledge)；如果你只想知道不同任务该选哪个入口，请读 [工作流入口路由：什么时候使用 brainstorm、prd、debug、work 或 review](8-gong-zuo-liu-ru-kou-lu-you-shi-yao-shi-hou-shi-yong-brainstorm-prd-debug-work-huo-review)。Sources: [README.zh-CN.md](README.zh-CN.md#L143-L160), [skills/spec-brainstorm/SKILL.md](skills/spec-brainstorm/SKILL.md#L39-L53)