---
date: 2026-04-01
topic: runtime-language-governance
---

# Repo-Level Language Governance

## Problem Frame

`spec-first init` 当前实现是项目级初始化命令：它以当前工作目录作为 `projectRoot`，并把 commands、skills、agents、state.json、项目级 `.developer` 都写入当前仓库。`lang=zh|en` 也已记录在项目内 `.developer` 中。

目前缺失的是一条稳定的仓库级语言约束，导致回复语言、状态输出、生成文档、代码注释语言可能不一致。结合现有实现，最简单且最符合当前模型的方式，不是增加新的运行时注入链路，而是在 `spec-first init` 时根据当前项目 `.developer.lang` 生成或更新仓库级指令文件，把语言规则固化到当前仓库。

## Requirements

**语言来源与落盘**

- R1. `spec-first init --claude` 与 `spec-first init --codex` 在当前仓库执行时，分别读取本平台项目级 `.developer` 中的 `lang` 字段：Claude 读取 `.claude/spec-first/.developer`，Codex 读取 `.codex/spec-first/.developer`
- R2. 支持的语言值仅为 `zh` 和 `en`；当项目级 `.developer` 缺失、`lang` 缺失或值非法时，默认按 `zh` 处理
- R2a. `lang` 取值优先级：`--lang` CLI 参数 > `.developer.lang` > 默认值 `zh`；当 `--lang` 被显式传入时，同步将该值写回 `.developer`，保持状态一致；后续不带 `--lang` 重复执行 `init` 时，沿用上次写入 `.developer` 的值
- R3. `spec-first init` 必须在仓库根目录生成或更新仓库级语言规则文件，使该仓库后续会话遵循固定语言策略，而不是依赖每次运行时重新读取 `.developer`；当 `--lang` 变更时，必须同步更新 `CLAUDE.md` 或 `AGENTS.md` 中的语言策略管理段落，确保语言设置与指令文件始终一致
- R4. 写入目标文件按平台区分：`--claude` 写入 `CLAUDE.md`；`--codex` 写入 `AGENTS.md`；目标文件不存在时创建，已存在时追加
- R5. 写入操作必须幂等：扫描目标文件是否已有 spec-first 管理段落（以 HTML 注释标记 `<!-- spec-first:lang:start -->` / `<!-- spec-first:lang:end -->` 为边界），已有则就地替换段落内容，没有则在文件末尾追加；不覆盖用户在管理段落外的任何内容

**管理段落格式（R5 参考）**

写入 `CLAUDE.md` 或 `AGENTS.md` 的语言策略段落统一采用以下结构：

```markdown
<!-- spec-first:lang:start -->
**Language Policy (managed by spec-first):** Use Chinese (中文) for all responses,
documentation, and code comments. Code identifiers and technical terms remain in English.
<!-- spec-first:lang:end -->
```

`lang=en` 时，段落内容替换为英文版本；`lang=zh` 时为中文版本。标记本身不随语言变化。

**仓库治理规则**

- R6. `spec-first init` 必须在仓库级指令文件中写入 changelog 铁律：任何对项目源码的新增、删除、修改，必须同步在项目根目录 `CHANGELOG.md` 中添加一条记录；无此记录的代码变动，一律拒绝生成。此规则为 prompt-level 行为约束，作用于 AI 工具层
- R7. 若仓库根目录不存在 `CHANGELOG.md`，`spec-first init` 必须创建该文件，写入格式说明头部，并同时写入一条 bootstrap 初始化记录（作者取 `.developer.name`，版本取当前 spec-first 版本）；已存在则不覆盖
- R8. `CHANGELOG.md` 记录格式以仓库现行格式为准；对于由 `spec-first init` 首次创建的仓库，canonical 初始格式定义为 `- vX.Y.Z YYYY-MM-DD 作者: 一句话摘要`，用户可见变更末尾追加 `(user-visible)`

**`zh` 行为**

- R9. 当 `lang=zh` 时，回复、状态更新、生成文档、评审意见、计划说明等自然语言输出使用中文
- R10. 当 `lang=zh` 时，允许混用英文技术术语，不要求把常见技术词强行翻译成中文
- R11. 当 `lang=zh` 时，代码标识符（变量、函数、类、模块、文件名中的技术标识）保持英文
- R12. 当 `lang=zh` 时，新增代码注释使用中文，要求简洁清晰，不写空洞注释

**`en` 行为**

- R13. 当 `lang=en` 时，回复、状态更新、生成文档、评审意见、计划说明等自然语言输出使用英文
- R14. 当 `lang=en` 时，代码标识符保持英文
- R15. 当 `lang=en` 时，新增代码注释使用英文，要求简洁清晰

**边界与一致性**

- R16. 代码、命令、路径、配置键、环境变量名、API 名称、协议名和其他技术标识不因语言偏好而被翻译
- R17. 该治理作用于仓库后续会话输出行为，不要求把仓库中现有的静态模板、技能文档、代理文档整体改写成 `zh` 或 `en`
- R18. 不采用把语言规则复制到每份 skill 文档、agent 文档中的方式；应集中写入仓库级指令文件，避免重复维护和规则漂移

## Success Criteria

- 在当前仓库执行 `spec-first init` 后，可观察到根级 `AGENTS.md` 或兼容用 `CLAUDE.md` 中存在明确语言策略段落
- 在当前仓库执行 `spec-first init` 后，可观察到根级 `AGENTS.md` 或兼容用 `CLAUDE.md` 中存在明确 changelog 铁律
- 当仓库原本不存在 `CHANGELOG.md` 时，执行 `spec-first init` 后会生成该文件，并包含标准记录格式说明
- 当 `lang=zh` 时，后续回复、文档、状态更新为中文，代码注释为中文，代码标识符保持英文
- 当 `lang=en` 时，后续回复、文档、状态更新为英文，代码注释为英文，代码标识符保持英文
- 重新执行 `spec-first init --lang en`（或 `--lang zh`）时，`.developer.lang`、`CLAUDE.md` / `AGENTS.md` 语言策略段同步更新，三者始终保持一致
- 后续代码生成或修改流程若未同步更新 `CHANGELOG.md`，会因仓库规则而被拒绝生成
- 现有静态 skill / agent Markdown 资产无需成批改写，语言治理仍能稳定生效

## Scope Boundaries

- 不要求把仓库里现有中文文档翻译成英文，也不要求把现有英文文档翻译成中文
- 不引入多语言扩展范围之外的语言值；本阶段仅支持 `zh` 与 `en`
- 不改变 `.developer` 的现有存储格式，只消费现有 `lang` 字段
- 不在每次 workflow 执行时重新读取 `.developer` 并动态覆盖语言；语言切换通过重新执行 `spec-first init` 完成

## Key Decisions

- **仓库级固化而非运行时动态注入**：选择在 `spec-first init` 时把语言规则写入仓库级指令文件，而不是增加新的运行时读取与注入链路。当前 `init` 已明确是项目级命令，这条路径更符合现有架构，也更简单
- **平台各读各的项目级 `.developer`**：Claude 只读自己的 `.claude/spec-first/.developer`，Codex 只读自己的 `.codex/spec-first/.developer`，避免跨平台状态耦合
- **默认回退到 `zh`**：语言信息缺失或无效时默认中文，和现有 `.developer` 初始化逻辑保持一致
- **代码与自然语言分治**：自然语言输出遵循 `lang`；代码标识符始终英文；代码注释跟随 `lang`
- **平台各写各的指令文件**：`--claude` 只写 `CLAUDE.md`，`--codex` 只写 `AGENTS.md`，不做跨平台同步，避免双源定义与状态耦合
- **追加写入但幂等**：目标文件不存在时创建；已存在时以 `<!-- spec-first:lang:start/end -->` 标记锁定管理段落，首次追加、后续就地更新，不重复累积
- **语言变更同步**：`--lang` 变更后重新执行 `init`，除更新 `.developer` 外，必须同步更新 `CLAUDE.md` / `AGENTS.md` 管理段落内容，保证指令文件与实际语言设置不漂移
- **先定义 changelog 规范再强制执行**：仓库当前没有 `CHANGELOG.md`，因此由 `init` 首次创建并定义初始 canonical 格式，随后再把“无 changelog 记录则拒绝生成”作为强约束写入仓库级指令文件
- **采用版本化 changelog 条目格式**：bootstrap 生成的默认格式使用 `- vX.Y.Z YYYY-MM-DD 作者: 一句话摘要`，与仓库级铁律中的示例保持一致
- **治理范围覆盖全工作流**：不只修补某个单独 skill，而是作为 `spec-first` 的统一仓库级约束作用于全部 workflow / skill / agent

## Dependencies / Assumptions

- `spec-first init` 会继续作为仓库级生成入口，负责同步或更新受管资产
- 现有 `.developer` 生命周期继续由 `spec-first init`、`doctor`、`clean` 管理

## Outstanding Questions

### Deferred to Planning

（无待定技术问题，所有决策已收口）

### Resolved

- [R4/R5] **写入策略**：`--claude` 写 `CLAUDE.md`，`--codex` 写 `AGENTS.md`；文件不存在则创建，已存在则幂等写入（标记段落内替换，无标记则末尾追加）
- [R4] **Claude 兼容层**：`CLAUDE.md` 仅在 `--claude` 路径下生成；`--codex` 只生成 `AGENTS.md`，不做跨平台同步
- [R7] **CHANGELOG 初始内容**：创建时写入格式说明头部 + 一条 bootstrap 记录，而非仅写格式说明；文件已存在则不覆盖
- [R8] **CHANGELOG 格式**：默认 canonical 格式使用版本化单行条目（`- vX.Y.Z YYYY-MM-DD 作者: 摘要`），用户可见变更末尾追加 `(user-visible)`
- [R2a] **`--lang` 优先级**：CLI `--lang` > `.developer.lang` > 默认 `zh`；`--lang` 传入时同步回写 `.developer`，保持状态一致
- [R6] **changelog 约束表述**：采用 prompt-level 铁律指令（无 changelog 记录则拒绝生成），而非声称外部系统层拦截

## Next Steps

→ `spec-plan` for structured implementation planning
