# Spec-First 开发指南

## 命令

```bash
bun install          # 安装依赖
bun test             # 运行免费测试 (browse + snapshot + skill 验证)
bun run test:evals   # 运行付费评估: LLM 评判 + E2E (基于 diff, ~$4/次)
bun run test:evals:all  # 运行所有付费评估,忽略 diff
bun run test:e2e     # 仅运行 E2E 测试 (基于 diff, ~$3.85/次)
bun run test:e2e:all # 运行所有 E2E 测试,忽略 diff
bun run eval:select  # 显示基于当前 diff 会运行哪些测试
bun run dev <cmd>    # 开发模式运行 CLI, 例如 bun run dev goto https://example.com
bun run build        # 生成文档 + 编译二进制
bun run gen:skill-docs  # 从模板重新生成 SKILL.md 文件
bun run skill:check  # 所有技能的健康仪表板
bun run dev:skill    # 监视模式: 自动重新生成 + 验证变更
bun run eval:list    # 列出 ~/.spec-first-dev/evals/ 中的所有评估运行
bun run eval:compare # 比较两次评估运行 (自动选择最近的)
bun run eval:summary # 聚合所有评估运行的统计
```

`test:evals` 需要 `ANTHROPIC_API_KEY`。Codex E2E 测试 (`test/codex-e2e.test.ts`)
使用 Codex 自己的 `~/.codex/` 配置中的认证 — 不需要 `OPENAI_API_KEY` 环境变量。
E2E 测试实时流式传输进度 (通过 `--output-format stream-json --verbose` 逐工具传输)。
结果持久化到 `~/.spec-first-dev/evals/` 并自动与上次运行进行比较。

**基于 diff 的测试选择:** `test:evals` 和 `test:e2e` 根据 `git diff` 相对于基础分支
自动选择测试。每个测试在 `test/helpers/touchfiles.ts` 中声明其文件依赖关系。
全局 touchfiles (session-runner, eval-store, llm-judge, gen-skill-docs) 的变更会
触发所有测试。使用 `EVALS_ALL=1` 或 `:all` 脚本变体强制运行所有测试。
运行 `eval:select` 预览将运行哪些测试。

## 测试

```bash
bun test             # 每次提交前运行 — 免费, <2s
bun run test:evals   # 发布前运行 — 付费, 基于 diff (~$4/次)
```

`bun test` 运行技能验证、gen-skill-docs 质量检查和 browse 集成测试。
`bun run test:evals` 通过 `claude -p` 运行 LLM-judge 质量评估和 E2E 测试。
创建 PR 前两者都必须通过。

## 项目结构

```
spec-first/
├── browse/          # 无头浏览器 CLI (Playwright)
│   ├── src/         # CLI + 服务器 + 命令
│   │   ├── commands.ts  # 命令注册表 (单一真实来源)
│   │   └── snapshot.ts  # SNAPSHOT_FLAGS 元数据数组
│   ├── test/        # 集成测试 + fixtures
│   └── dist/        # 编译的二进制
├── scripts/         # 构建 + DX 工具
│   ├── gen-skill-docs.ts  # 模板 → SKILL.md 生成器
│   ├── skill-check.ts     # 健康仪表板
│   └── dev-skill.ts       # 监视模式
├── test/            # 技能验证 + 评估测试
│   ├── helpers/     # skill-parser.ts, session-runner.ts, llm-judge.ts, eval-store.ts
│   ├── fixtures/    # 基准真值 JSON, 植入 bug fixtures, 评估基线
│   ├── skill-validation.test.ts  # 第 1 层: 静态验证 (免费, <1s)
│   ├── gen-skill-docs.test.ts    # 第 1 层: 生成器质量 (免费, <1s)
│   ├── skill-llm-eval.test.ts   # 第 3 层: LLM 作为评判者 (~$0.15/次)
│   └── skill-e2e-*.test.ts       # 第 2 层: 通过 claude -p 的 E2E (~$3.85/次, 按类别分割)
├── qa-only/         # /qa-only 技能 (仅报告的 QA, 无修复)
├── plan-design-review/  # /plan-design-review 技能 (仅报告的设计审计)
├── design-review/    # /design-review 技能 (设计审计 + 修复循环)
├── ship/            # Ship 工作流技能
├── review/          # PR 审查技能
├── plan-ceo-review/ # /plan-ceo-review 技能
├── plan-eng-review/ # /plan-eng-review 技能
├── office-hours/    # /office-hours 技能 (YC Office Hours — 创业诊断 + 构建者头脑风暴)
├── investigate/     # /investigate 技能 (系统化根因调试)
├── retro/           # 回顾技能
├── document-release/ # /document-release 技能 (发布后文档更新)
├── setup            # 一次性设置: 构建二进制 + 符号链接技能
├── SKILL.md         # 从 SKILL.md.tmpl 生成 (不要直接编辑)
├── SKILL.md.tmpl    # 模板: 编辑此文件, 运行 gen:skill-docs
├── ETHOS.md         # 构建者哲学 (煮干湖水, 先搜索后构建)
└── package.json     # browse 的构建脚本
```

## SKILL.md 工作流

SKILL.md 文件是从 `.tmpl` 模板**生成**的。要更新文档:

1. 编辑 `.tmpl` 文件 (例如 `SKILL.md.tmpl` 或 `browse/SKILL.md.tmpl`)
2. 运行 `bun run gen:skill-docs` (或 `bun run build`,它会自动执行)
3. 提交 `.tmpl` 和生成的 `.md` 文件

要添加新的 browse 命令: 将其添加到 `browse/src/commands.ts` 并重新构建。
要添加快照标志: 将其添加到 `browse/src/snapshot.ts` 中的 `SNAPSHOT_FLAGS` 并重新构建。

**SKILL.md 文件的合并冲突:** 永远不要通过接受任一侧来解决生成的 SKILL.md 文件
的冲突。相反: (1) 在 `.tmpl` 模板和 `scripts/gen-skill-docs.ts` (真实来源) 上
解决冲突, (2) 运行 `bun run gen:skill-docs` 重新生成所有 SKILL.md 文件, (3) 暂存
重新生成的文件。接受一侧的生成输出会静默删除另一侧的模板更改。

## 平台无关设计

技能绝不能硬编码特定框架的命令、文件模式或目录结构。相反:

1. **读取 CLAUDE.md** 获取项目特定配置 (测试命令、评估命令等)
2. **如果缺失,使用 AskUserQuestion** — 让用户告诉你或让 spec-first 搜索仓库
3. **将答案持久化到 CLAUDE.md** 这样我们就不必再次询问

这适用于测试命令、评估命令、部署命令和任何其他项目特定行为。
项目拥有其配置; spec-first 读取它。

## 编写 SKILL 模板

SKILL.md.tmpl 文件是 **Claude 读取的提示模板**,不是 bash 脚本。
每个 bash 代码块在单独的 shell 中运行 — 变量不会在块之间持久化。

规则:
- **使用自然语言处理逻辑和状态。** 不要使用 shell 变量在代码块之间传递
  状态。相反,告诉 Claude 要记住什么并在散文中引用它 (例如,"在步骤 0 中
  检测到的基础分支")。
- **不要硬编码分支名称。** 通过 `gh pr view` 或 `gh repo view` 动态检测
  `main`/`master`/等。对于针对 PR 的技能使用 `{{BASE_BRANCH_DETECT}}`。
  在散文中使用 "基础分支",在代码块占位符中使用 `<base>`。
- **保持 bash 块自包含。** 每个代码块应该独立工作。如果块需要来自先前
  步骤的上下文,在上面的散文中重述它。
- **将条件表达为英语。** 代替 bash 中的嵌套 `if/elif/else`,编写编号决策
  步骤: "1. 如果 X,执行 Y。2. 否则,执行 Z。"

## 浏览器交互

当你需要与浏览器交互 (QA、内部测试、cookie 设置) 时,使用 `/browse` 技能
或通过 `$B <command>` 直接运行 browse 二进制。永远不要使用
`mcp__claude-in-chrome__*` 工具 — 它们缓慢、不可靠,而且不是这个项目
使用的。

## Vendor 符号链接意识

开发 spec-first 时,`.claude/skills/spec-first` 可能是指回此工作目录的符号链接
(gitignored)。这意味着技能变更**立即生效** — 非常适合快速迭代,在大重构中
有风险,其中半成品的技能可能破坏其他同时使用 spec-first 的 Claude Code 会话。

**每个会话检查一次:** 运行 `ls -la .claude/skills/spec-first` 查看它是符号链接
还是真实副本。如果它是指向你的工作目录的符号链接,请注意:
- 模板更改 + `bun run gen:skill-docs` 立即影响所有 spec-first 调用
- 对 SKILL.md.tmpl 文件的破坏性更改可能破坏并发的 spec-first 会话
- 在大型重构期间,删除符号链接 (`rm .claude/skills/spec-first`) 以便使用
  `~/.claude/skills/spec-first/` 的全局安装

**对于计划审查:** 当审查修改技能模板或 gen-skill-docs 管道的计划时,考虑
更改是否应该在上线前隔离测试 (特别是如果用户在其他窗口中主动使用 spec-first)。

## 提交风格

**始终拆分提交。** 每个提交应该是单个逻辑更改。当你进行多次更改 (例如,
重命名 + 重写 + 新测试) 时,在推送前将它们拆分为单独的提交。每个提交应该
独立可理解和可回滚。

良好拆分的示例:
- 重命名/移动与行为更改分开
- 测试基础设施 (touchfiles, helpers) 与测试实现分开
- 模板更改与生成文件重新生成分开
- 机械重构与新功能分开

当用户说 "bisect commit" 或 "bisect and push" 时,将暂存/未暂存的更改
拆分为逻辑提交并推送。

## CHANGELOG 风格

CHANGELOG.md 是**给用户的**,不是贡献者的。像产品发布说明一样写它:

- 首先说明用户现在可以**做**什么以前做不到的。推销功能。
- 使用通俗语言,不是实现细节。"你现在可以..." 不是 "重构了..."
- **永远不要提到 TODOS.md、内部跟踪、评估基础设施或面向贡献者的细节。**
  这些对用户是不可见的,对他们毫无意义。
- 将贡献者/内部更改放在底部的单独 "For contributors" 部分。
- 每个条目应该让某人觉得 "哦不错,我想试试那个。"
- 不要行话: 说 "每个问题现在告诉你你在哪个项目和分支" 不是
  "AskUserQuestion 格式通过前导解析器在技能模板中标准化。"

## AI 工作压缩

在估计或讨论工作量时,始终显示人类团队和 CC+spec-first 时间:

| 任务类型 | 人类团队 | CC+spec-first | 压缩比 |
|---------|---------|-----------|-------------|
| 样板/脚手架 | 2 天 | 15 分钟 | ~100x |
| 编写测试 | 1 天 | 15 分钟 | ~50x |
| 功能实现 | 1 周 | 30 分钟 | ~30x |
| Bug 修复 + 回归测试 | 4 小时 | 15 分钟 | ~20x |
| 架构/设计 | 2 天 | 4 小时 | ~5x |
| 研究/探索 | 1 天 | 3 小时 | ~3x |

完整性很便宜。当完整实现是 "湖" (可实现) 而不是 "海洋" (多季度迁移) 时,
不要推荐捷径。参见技能前导中的完整性原则了解完整哲学。

## 先搜索后构建

在设计任何涉及并发、不熟悉的模式、基础设施或运行时/框架可能有内置的任何
解决方案之前:

1. 搜索 "{runtime} {thing} built-in"
2. 搜索 "{thing} best practice {current year}"
3. 检查官方运行时/框架文档

三层知识: 久经考验 (第 1 层)、新且流行 (第 2 层)、第一性原理 (第 3 层)。
最重视第 3 层。参见 ETHOS.md 了解完整的构建者哲学。

## 本地计划

贡献者可以在 `~/.spec-first-dev/plans/` 中存储长期愿景文档和设计文档。
这些仅限本地 (不签入)。在审查 TODOS.md 时,检查 `plans/` 中可能准备好
提升为 TODO 或实现的候选者。

## E2E 评估失败归因协议

当 E2E 评估在 `/ship` 或任何其他工作流期间失败时,**永远不要声称 "与我们的
更改无关" 而不证明它。** 这些系统有不可见的耦合 — 前导文本更改影响代理
行为,新助手更改时机,重新生成的 SKILL.md 转移提示上下文。

**在将失败归因于 "预先存在" 之前必需:**
1. 在 main (或基础分支) 上运行相同的评估并显示它也在那里失败
2. 如果它在 main 上通过但在分支上失败 — 这就是你的更改。追踪归因。
3. 如果你不能在 main 上运行,说 "未验证 — 可能相关也可能不相关" 并在
   PR 正文中将其标记为风险

没有凭证的 "预先存在" 是懒惰的主张。证明它或不要说它。

## 长时间运行的任务: 不要放弃

在运行评估、E2E 测试或任何长时间运行的后台任务时,**轮询直到完成**。
使用 `sleep 180 && echo "ready"` + `TaskOutput` 每 3 分钟循环一次。
永远不要切换到阻塞模式并在轮询超时时放弃。永远不要说 "我会在完成时收到通知"
并停止检查 — 保持循环进行,直到任务完成或用户告诉你停止。

完整的 E2E 套件可能需要 30-45 分钟。那是 10-15 个轮询周期。完成所有周期。
在每次检查时报告进度 (哪些测试通过,哪些正在运行,目前有任何失败)。
用户希望看到运行完成,不是你稍后会检查的承诺。

## 部署到活动技能

活动技能位于 `~/.claude/skills/spec-first/`。进行更改后:

1. 推送你的分支
2. 在技能目录中获取并重置: `cd ~/.claude/skills/spec-first && git fetch origin && git reset --hard origin/main`
3. 重新构建: `cd ~/.claude/skills/spec-first && bun run build`

或直接复制二进制: `cp browse/dist/browse ~/.claude/skills/spec-first/browse/dist/browse`

---

**中文版**: CLAUDE-CN.md
**English Version**: [CLAUDE.md](CLAUDE.md)
