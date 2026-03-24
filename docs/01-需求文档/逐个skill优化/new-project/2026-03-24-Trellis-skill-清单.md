# Trellis Skill 清单

文档日期：2026-03-24  
来源目录：`/Users/kuang/xiaobu/Trellis/.claude/commands/trellis`

## 1. 结论

`Trellis` 当前在 `.claude/commands/trellis` 下共有 17 个命令型 skill。

它们整体可以分成 6 组：

- 会话启动与需求发现
- 开发前约束与实现检查
- 并行与任务编排
- 提交与收尾
- 规范沉淀与知识回写
- Trellis 自身扩展能力

## 2. 全量清单

| 命令 | 文件 | 主要功能 |
|---|---|---|
| `before-dev` | `before-dev.md` | 开发前读取相关 spec layer 和共享规范，强制先看指南再写代码 |
| `brainstorm` | `brainstorm.md` | 需求发现与 PRD 收敛，先建 task，再单问题澄清、研究、收敛 MVP |
| `break-loop` | `break-loop.md` | 对刚修完的 bug 做复盘分析，定位根因类别和预防机制 |
| `check-cross-layer` | `check-cross-layer.md` | 实现后做跨层检查，避免遗漏 API、数据流、配置、契约等联动影响 |
| `check` | `check.md` | 根据 spec 指南审查改动，跑 lint/typecheck 并修复违反规范之处 |
| `commit` | `commit.md` | 生成并执行 Conventional Commits 风格提交 |
| `create-command` | `create-command.md` | 新建 slash command，同时写入 `.cursor/commands` 与 `.claude/commands/trellis` |
| `create-manifest` | `create-manifest.md` | 基于上次 release 以来的提交生成 migration manifest / changelog 草稿 |
| `finish-work` | `finish-work.md` | 提交前检查，覆盖质量、测试、code-spec sync 等收尾项 |
| `improve-ut` | `improve-ut.md` | 按 unit-test spec 提升测试覆盖，补 UT / integration / regression |
| `integrate-skill` | `integrate-skill.md` | 把外部 Claude skill 融入 Trellis 项目的开发规范，而不是直接生成代码 |
| `onboard` | `onboard.md` | 新人 onboarding，解释 Trellis 工作流的原理、结构和实践方式 |
| `parallel` | `parallel.md` | 多 agent 并行开发的主编排器，在主仓库负责计划、分发、协调 |
| `publish-skill` | `publish-skill.md` | 将 marketplace skill 发布到 docs site，生成中英文详情页和导航 |
| `record-session` | `record-session.md` | 在任务完成并提交后归档任务、记录 session 总结和变更摘要 |
| `start` | `start.md` | 会话入口，读取 workflow、获取上下文、决定当前应该做什么 |
| `update-spec` | `update-spec.md` | 把实现、调试、讨论中学到的新契约回写到 code-spec 文档中 |

## 3. 分类说明

### 3.1 会话启动与需求发现

这组命令负责“从用户意图到可执行任务”的前半段。

- `/trellis:start`
  作用：初始化 AI 开发会话，读取 `.trellis/workflow.md`、获取当前任务和上下文。
- `/trellis:brainstorm`
  作用：做 requirements discovery，核心产物是 `prd.md`，不是 design doc。
- `/trellis:onboard`
  作用：给新人解释整个 Trellis 工作流为什么存在、怎么用、有哪些命令。

### 3.2 开发前约束与实现检查

这组命令负责“写代码前先看规范，写完后按规范检查”。

- `/trellis:before-dev`
  作用：开发前读取 package 对应的 spec layer 与共享 guide。
- `/trellis:check`
  作用：根据指南检查刚写的代码，并执行 lint/typecheck。
- `/trellis:check-cross-layer`
  作用：做跨层完整性检查，防止改了一层漏掉其他层。
- `/trellis:improve-ut`
  作用：补足测试覆盖，依据 unit-test specs 决定测什么、怎么测。
- `/trellis:finish-work`
  作用：提交前的总检查，包括质量、测试、code-spec sync。

### 3.3 并行与任务编排

这组命令负责把工作分配给多个 agent 或 task。

- `/trellis:parallel`
  作用：多 agent 编排器，本身不直接写代码，负责计划、分发、协调。

### 3.4 提交与收尾

这组命令负责把改动沉淀到 git 和 session 记录中。

- `/trellis:commit`
  作用：生成并执行规范化提交。
- `/trellis:record-session`
  作用：归档任务并记录本次 session 的总结、提交、文件更新等。
- `/trellis:create-manifest`
  作用：为 patch/minor release 生成 migration manifest 和 changelog 草稿。

### 3.5 规范沉淀与知识回写

这组命令负责把新知识更新到项目规范中。

- `/trellis:update-spec`
  作用：把实现中发现的可执行契约写回 code-spec。
- `/trellis:break-loop`
  作用：对 bug 修复做根因复盘，避免“修了又忘、忘了再犯”。

### 3.6 Trellis 自身扩展能力

这组命令不是做业务开发，而是扩展 Trellis 工作流本身。

- `/trellis:create-command`
  作用：生成新的 slash command。
- `/trellis:integrate-skill`
  作用：把外部 skill 翻译并纳入项目规范体系。
- `/trellis:publish-skill`
  作用：把 skill 发布到文档站点。

## 4. 最关键的几个命令

如果只看主链路，最核心的是这几个：

- `start`
  入口命令，负责把 session 拉到正确上下文里。
- `brainstorm`
  需求发现与 `prd.md` 收敛。
- `before-dev`
  开发前读规范。
- `check`
  实现后按规范校验。
- `finish-work`
  提交前总检查。
- `record-session`
  会话收尾和知识沉淀。

## 5. 和 spec-first 的对照价值

对 `spec-first` 最值得借鉴的 Trellis 命令有三类：

- `brainstorm`
  因为它是典型的 `brainstorm -> prd.md` 形态。
- `before-dev / check / finish-work`
  因为它把“写前读规范、写后做检查、提交前做收口”拆得很清楚。
- `update-spec / break-loop / record-session`
  因为它强调把经验和契约回写，而不是只完成一次性实现。

## 6. 原始目录

完整目录如下：

```text
/Users/kuang/xiaobu/Trellis/.claude/commands/trellis
├── before-dev.md
├── brainstorm.md
├── break-loop.md
├── check-cross-layer.md
├── check.md
├── commit.md
├── create-command.md
├── create-manifest.md
├── finish-work.md
├── improve-ut.md
├── integrate-skill.md
├── onboard.md
├── parallel.md
├── publish-skill.md
├── record-session.md
├── start.md
└── update-spec.md
```
