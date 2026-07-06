你现在位于入门指南的第三页：[首次运行与成功信号](3-shou-ci-yun-xing-yu-cheng-gong-xin-hao)。本页只回答一个问题：**第一次跑 spec-first 时，怎样判断它真的可用了**。这里不展开宿主选择、完整工作流设计或长期维护命令；那些内容分别放在 [选择你的宿主：Claude Code、Codex、Cursor、Kiro 与 Qoder](4-xuan-ze-ni-de-su-zhu-claude-code-codex-cursor-kiro-yu-qoder)、[常用入口速查：从需求、计划、执行到审查](5-chang-yong-ru-kou-su-cha-cong-xu-qiu-ji-hua-zhi-xing-dao-shen-cha) 和 [日常维护命令：doctor、init、update、clean](8-ri-chang-wei-hu-ming-ling-doctor-init-update-clean)。Sources: [README.zh-CN.md](README.zh-CN.md#L30-L35), [README.zh-CN.md](README.zh-CN.md#L90-L111)

## 架构假设：第一次成功不是“AI 回答了”，而是“仓库留下了可检查产物”

从源码和用户文档可以验证一个核心模式：CLI 负责安装、检查和生成宿主 runtime；真正的 `spec-*` workflow 入口由 Claude Code、Codex、Cursor、Kiro 或 Qoder 在宿主会话中提供；第一次业务成功信号是 workflow 在仓库中写入 Markdown artifact，例如 `docs/brainstorms/YYYY-MM-DD-NNN-<topic>-requirements.md`。Sources: [src/cli/index.js](src/cli/index.js#L158-L175), [README.zh-CN.md](README.zh-CN.md#L90-L111)

```mermaid
flowchart TD
  A[终端：npm install -g spec-first] --> B[终端：spec-first doctor]
  B --> C[终端：spec-first init]
  C --> D[重启宿主或新开会话]
  D --> E[宿主会话：spec-brainstorm \"你的第一个任务\"]
  E --> F[仓库产物：docs/brainstorms/*.md]
  F --> G[成功信号：工作可检查、可移交、可继续 plan]
```

上图的关键边界是：`spec-first doctor` 和 `spec-first init` 是终端命令；`spec-brainstorm` 是初始化后在宿主会话中运行的 workflow 入口，不是 shell 命令。第一次先用 `spec-brainstorm`，因为它的职责是澄清 WHAT，并把 durable handoff 写到 `docs/brainstorms/`。Sources: [README.zh-CN.md](README.zh-CN.md#L90-L101), [skills/spec-brainstorm/SKILL.md](skills/spec-brainstorm/SKILL.md#L9-L29)

## 第 0 步：确认你站在正确位置

第一次运行前，终端应位于你要启用 spec-first 的项目仓库根目录；前置条件包括 Node.js `>=20.0.0`、Git 在 `PATH` 中、已安装至少一个受支持宿主，并且当前目录是你想初始化的项目。package 元数据也把 Node.js 引擎约束写为 `>=20.0.0`。Sources: [README.zh-CN.md](README.zh-CN.md#L40-L45), [package.json](package.json#L112-L114)

视觉上，第一次成功后的最小项目结构可以这样理解：Sources: [README.zh-CN.md](README.zh-CN.md#L74-L84), [README.zh-CN.md](README.zh-CN.md#L103-L111)

```text
your-project/
├── .claude/ 或 .codex/ 或 .cursor/ 或 .kiro/ 或 .qoder/
│   └── spec-first runtime assets        # init 生成，宿主读取
├── .agents/skills/                      # Codex 等宿主可能使用
├── .spec-first/                         # 状态、运行证据或 advisory 信息
└── docs/
    └── brainstorms/
        └── YYYY-MM-DD-NNN-topic-requirements.md  # 第一次业务成功产物
```

不要把 `.claude/`、`.codex/`、`.cursor/`、`.kiro/`、`.qoder/` 下的生成副本当作你第一次业务成功的唯一证明；它们说明 runtime 已安装，但真正的业务闭环信号是 workflow 产出的仓库文档。Sources: [README.zh-CN.md](README.zh-CN.md#L82-L84), [docs/05-用户手册/09-首次工作流走查.md](docs/05-用户手册/09-首次工作流走查.md#L181-L187)

## 第 1 步：安装并运行 doctor

先安装 CLI，然后立刻运行 `doctor`。在 macOS、Linux 或 Windows 终端中，核心命令都是先 `npm install -g spec-first`，再 `spec-first doctor`；官方快速开始把 `doctor` 定义为安装后的第一个检查命令。Sources: [README.zh-CN.md](README.zh-CN.md#L47-L72), [docs/05-用户手册/01-快速开始.md](docs/05-用户手册/01-快速开始.md#L40-L56)

```bash
npm install -g spec-first
spec-first doctor
```

`doctor` 的成功信号不是某一句固定文案，而是没有阻断错误：Node.js 检查应达到 20 或更新版本，Git 检查应能返回版本，runtime asset manifest 应能加载，并且已检测到的平台会继续检查宿主 CLI、managed state、runtime files、commands、skills 和 agents。Sources: [src/cli/commands/doctor.js](src/cli/commands/doctor.js#L106-L146), [src/cli/commands/doctor.js](src/cli/commands/doctor.js#L415-L423), [src/cli/commands/doctor.js](src/cli/commands/doctor.js#L443-L527)

| 看到的信号 | 含义 | 下一步 |
|---|---|---|
| `PASS Node.js` | Node 版本满足运行要求 | 继续看 Git 和 runtime manifest |
| `PASS Git` | Git 可被 CLI 调用 | 继续 `init` |
| `PASS runtime asset manifest` | npm 包内置 runtime 资产可读取 | 继续 `init` |
| `No spec-first platform detected in this project.` | 当前项目还没初始化宿主 runtime | 运行 `spec-first init` |
| `ERROR Node.js` 或 `ERROR Git` | 基础环境阻断 | 先修 Node 或 Git，再重新 `doctor` |

上表来自 `doctor` 的实现：无平台时会提示运行 `spec-first init`；Node 低于要求会提示安装 Node.js 20 或更新；Git 不可用会提示安装 Git 并确保在 `PATH` 中。Sources: [src/cli/commands/doctor.js](src/cli/commands/doctor.js#L57-L66), [src/cli/commands/doctor.js](src/cli/commands/doctor.js#L106-L146)

## 第 2 步：初始化宿主 runtime

运行 `spec-first init`，选择你实际使用的宿主，并确认开发者姓名与语言。当前 CLI 支持的初始化目标包括 Claude Code、Codex、Cursor、Kiro 和 Qoder；交互式运行需要 TTY，非交互脚本场景需要使用 `-y/--yes` 并配合默认或显式宿主参数。Sources: [src/cli/commands/init.js](src/cli/commands/init.js#L77-L113), [src/cli/commands/init.js](src/cli/commands/init.js#L126-L150)

```bash
spec-first init
```

如果你要脚本化首次运行，可以显式指定宿主、用户名和语言；`init` 参数解析支持 `--claude`、`--codex`、`--cursor`、`--kiro`、`--qoder`、`-y/--yes`、`--user`、`--lang zh|en`、`--repo` 和 `--all-repos` 等选项。Sources: [src/cli/commands/init.js](src/cli/commands/init.js#L264-L376)

```bash
spec-first init --claude -y --user "你的名字" --lang zh
```

初始化的成功信号是：CLI 生成计划、检查错误、写入对应宿主 runtime assets，并在成功后打印下一步提示；README 中也明确说明，init 会列出 `.claude/`、`.codex/`、`.agents/skills/`、`.cursor/`、`.kiro/` 或 `.qoder/` 下的生成路径，并确认 setup 完成。Sources: [src/cli/commands/init.js](src/cli/commands/init.js#L188-L254), [README.zh-CN.md](README.zh-CN.md#L74-L84)

| 初始化选择 | 初学者建议 | 成功后你应该看到什么 |
|---|---|---|
| 交互式 `spec-first init` | 第一次推荐 | 宿主多选、姓名、语言、写入预览与确认 |
| `spec-first init --claude -y --lang zh` | 已确定只用 Claude Code | `.claude/` 相关 runtime 写入 |
| `spec-first init --codex -y --lang zh` | 已确定只用 Codex | `.agents/skills/`、`.codex/` 相关 runtime 写入 |
| `spec-first init --cursor -y --lang zh` | 明确 opt-in Cursor preview | `.cursor/` 相关 runtime 写入 |
| `spec-first init --kiro -y --lang zh` | 明确使用 Kiro | `.kiro/` 相关 runtime 写入 |
| `spec-first init --qoder -y --lang zh` | 明确使用 Qoder | `.qoder/` 相关 runtime 写入 |

这些宿主名和默认行为来自 `INIT_PLATFORM_CHOICES`，而 README 对初始化产物路径给出了用户可见解释；本页只把它们作为首次成功检查点，不展开各宿主差异。Sources: [src/cli/commands/init.js](src/cli/commands/init.js#L77-L113), [README.zh-CN.md](README.zh-CN.md#L80-L86)

## 第 3 步：重启宿主或新开会话

`init` 完成后，重启 Claude Code、Codex、Cursor、Kiro 或 Qoder，或者新开一个宿主会话，让宿主加载刚生成的 runtime assets。这里最容易误解的一点是：后续 workflow 入口在宿主会话里运行，而不是在终端里运行。Sources: [README.zh-CN.md](README.zh-CN.md#L90-L101), [docs/05-用户手册/09-首次工作流走查.md](docs/05-用户手册/09-首次工作流走查.md#L36-L45)

如果宿主内看不到 workflow 入口，先不要急着改生成文件；重新运行 `spec-first init` 并完全重启宿主，是文档中给出的直接修复路径。Sources: [docs/05-用户手册/01-快速开始.md](docs/05-用户手册/01-快速开始.md#L190-L196), [src/cli/commands/doctor.js](src/cli/commands/doctor.js#L203-L252)

## 第 4 步：运行第一个 workflow

第一次业务运行建议从 `spec-brainstorm` 开始，因为它处理“已有一个任务想法，但行为、范围、用户、成功标准或交接上下文还不清楚”的情况；它的输出目标是 requirements doc 或 brief alignment summary，artifact 目录是 `docs/brainstorms/`。Sources: [skills/spec-brainstorm/SKILL.md](skills/spec-brainstorm/SKILL.md#L15-L29), [skills/spec-brainstorm/SKILL.md](skills/spec-brainstorm/SKILL.md#L33-L37)

```text
# 在 Claude Code、Codex、Cursor、Kiro 或 Qoder 会话中运行
spec-brainstorm "描述你的第一个任务"
```

一个合理的第一次任务可以很小，例如“为 CLI 首次用户改善 onboarding”。首次运行的目标不是立刻写代码，而是让需求、成功标准和后续计划边界进入仓库文档。Sources: [docs/05-用户手册/09-首次工作流走查.md](docs/05-用户手册/09-首次工作流走查.md#L1-L10), [docs/05-用户手册/09-首次工作流走查.md](docs/05-用户手册/09-首次工作流走查.md#L68-L90)

## 第 5 步：检查第一个成功信号

`spec-brainstorm` 完成后，检查仓库中是否出现类似下面的新文件：Sources: [README.zh-CN.md](README.zh-CN.md#L103-L111), [docs/05-用户手册/09-首次工作流走查.md](docs/05-用户手册/09-首次工作流走查.md#L76-L90)

```text
docs/brainstorms/YYYY-MM-DD-NNN-<topic>-requirements.md
```

这个文件就是第一次业务成功信号：它说明 AI 会话不只是给了你一段回答，而是把需求判断变成了仓库内可检查、可评审、可移交的 artifact。好的 brainstorm 文档应回答用户是谁、当前卡在哪里、本轮必须解决什么、哪些不在范围内、成功标准是什么，以及后续 planning 需要注意哪些边界。Sources: [README.zh-CN.md](README.zh-CN.md#L103-L111), [docs/05-用户手册/09-首次工作流走查.md](docs/05-用户手册/09-首次工作流走查.md#L82-L90)

| 成功层级 | 你检查什么 | 判断标准 |
|---|---|---|
| CLI 可用 | `spec-first doctor` | Node、Git、runtime manifest 没有阻断错误 |
| runtime 已安装 | `spec-first init` 后的生成路径 | 宿主 runtime assets 已写入项目 |
| 宿主已加载 | 新会话中能看到或调用 `spec-*` 入口 | workflow 入口由宿主提供 |
| 第一次业务闭环 | `docs/brainstorms/*.md` | requirements brief 已落仓库 |
| 可以继续推进 | brief 内容足够清楚 | 可进入 `spec-plan`，否则继续澄清 |

这些层级对应当前实现中的不同边界：`doctor` 检查基础环境和 runtime 健康，`init` 写入宿主 runtime assets，`spec-brainstorm` 写入 durable handoff，而后续 plan 才负责把 requirements 转为工程计划。Sources: [src/cli/commands/doctor.js](src/cli/commands/doctor.js#L443-L527), [src/cli/commands/init.js](src/cli/commands/init.js#L221-L254), [skills/spec-brainstorm/SKILL.md](skills/spec-brainstorm/SKILL.md#L9-L29), [docs/05-用户手册/09-首次工作流走查.md](docs/05-用户手册/09-首次工作流走查.md#L92-L115)

## 常见卡点与处理

如果第一次没有成功，先按“环境 → runtime → 宿主加载 → workflow 产物”的顺序排查，不要直接编辑 generated runtime copies。`doctor` 已经覆盖 Node、Git、runtime manifest、宿主 CLI、commands、skills、agents 等检查；`init` 可重建 runtime assets。Sources: [src/cli/commands/doctor.js](src/cli/commands/doctor.js#L434-L527), [src/cli/commands/init.js](src/cli/commands/init.js#L906-L916)

| 现象 | 最可能原因 | 处理 |
|---|---|---|
| `doctor` 提示 Node.js 错误 | Node 版本低于 20 | 安装 Node.js 20 或更新后重试 |
| `doctor` 提示 Git not found | Git 不在 `PATH` | 安装 Git，并重启 shell |
| `doctor` 提示当前项目没有平台 | 还没初始化 | 运行 `spec-first init` 并选择宿主 |
| 宿主里没有 `spec-*` | 宿主未加载新 runtime | 完全重启宿主或新开会话 |
| 有 runtime 文件但 workflow 不产出文档 | 可能用错入口或需求描述不足 | 用 `spec-brainstorm "明确任务"` 重新开始 |
| 看到 drifted 或 missing runtime assets | 生成副本缺失或漂移 | 重新运行 `spec-first init` 重建 |

这些处理方式都来自当前代码和文档的可验证行为：`doctor` 对 missing、drifted commands、skills、agents 给出重新 init 的修复建议；`spec-brainstorm` 在缺少 feature description 时会要求补充任务描述并停止。Sources: [src/cli/commands/doctor.js](src/cli/commands/doctor.js#L203-L303), [skills/spec-brainstorm/SKILL.md](skills/spec-brainstorm/SKILL.md#L72-L81)

## 第一次跑完后读什么

如果你已经看到 `docs/brainstorms/*.md`，下一步建议读 [常用入口速查：从需求、计划、执行到审查](5-chang-yong-ru-kou-su-cha-cong-xu-qiu-ji-hua-zhi-xing-dao-shen-cha)，确认不同任务应该从哪个入口开始；如果你还没确定宿主，回到 [选择你的宿主：Claude Code、Codex、Cursor、Kiro 与 Qoder](4-xuan-ze-ni-de-su-zhu-claude-code-codex-cursor-kiro-yu-qoder)；如果你想理解产物该不该提交，继续读 [产物目录与提交边界](6-chan-wu-mu-lu-yu-ti-jiao-bian-jie)。Sources: [README.zh-CN.md](README.zh-CN.md#L113-L123), [docs/05-用户手册/09-首次工作流走查.md](docs/05-用户手册/09-首次工作流走查.md#L169-L188)