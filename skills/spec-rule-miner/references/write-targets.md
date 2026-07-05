# Write Targets

写入前读取本参考。目标是让独立规则文件成为 canonical full rules，让 `AGENTS.md` / `CLAUDE.md` 只负责引用，并避免破坏用户已有规则或 generated runtime mirrors。

## 默认目标

1. `docs/ai/project-rules.md`：写完整规则块，使用 HTML markers：

   ```markdown
   <!-- spec-rule-miner-start -->
   # Project Rules
   ...
   <!-- spec-rule-miner-end -->
   ```

2. `AGENTS.md`：默认写 pointer 到 `docs/ai/project-rules.md`，同样用 markers 包住。使用一句目标项目语言的说明，例如“本项目 AI 编码规则以 `docs/ai/project-rules.md` 为唯一来源，编码前必须阅读并遵守。”

3. `CLAUDE.md`：默认写 pointer 到 `docs/ai/project-rules.md`，同样用 markers 包住。优先使用宿主支持的 native import，例如 `@docs/ai/project-rules.md`；不确定时用一句目标项目语言的说明。

## 当前支持的额外工具

除非用户点名，不要猜测额外工具文件。默认只写 `docs/ai/project-rules.md`、`AGENTS.md` 和 `CLAUDE.md`。当前额外 host-native 写入目标只覆盖 spec-first 已支持且已确认的 surfaces：

| Tool | Path | 规则 |
| --- | --- | --- |
| Qoder | `.qoder/rules/project-rules.md` | pointer 到 `docs/ai/project-rules.md` |
| Cursor | `.cursor/rules/project-rules.mdc` | inline 场景写完整规则；非 inline 场景不默认写 |

Kiro 当前通过根目录 `AGENTS.md` 和 skill delivery 消费规则；不要写 `.kiro/steering/**`。Kiro steering 是 deferred surface，只有在 Kiro support 计划正式实现 steering 生成与 inclusion mode 后才可新增。

非当前 spec-first 支持的编程工具或 legacy 规则文件不作为写入目标。用户点名 `.cursorrules`、GitHub Copilot、Trae 或其他未支持工具时，说明该目标不在当前支持范围内，不猜路径、不写 pointer。

## Inline 场景

completion/inline 功能通常不会读取 `AGENTS.md` 或 pointer。用户明确要求 Cursor tab 等当前支持的 inline 场景时，写完整规则正文：

- Cursor：`.cursor/rules/project-rules.mdc`，frontmatter 必须在文件最前面，包含 `description`、`globs` 和 `alwaysApply: true`。

## 合并规则

- 文件不存在：创建父目录和文件，只写目标块或 pointer。
- 独立规则文件中 `spec-rule-miner-start` / `spec-rule-miner-end` markers 存在：只替换 markers 中间内容，保留文件其他部分。
- pointer 文件中 `spec-rule-miner-start` / `spec-rule-miner-end` markers 存在：只替换 markers 中间内容为 pointer，不把完整规则写进入口文件。
- legacy `rule-miner-start` / `rule-miner-end` markers 存在：如果在独立规则文件内，替换旧 markers 与其中内容为新的 `spec-rule-miner` marked block；如果在 `AGENTS.md` / `CLAUDE.md` 内，先把完整规则写入独立规则文件，再把入口文件中的旧块替换为 pointer，并在 summary 说明完成 legacy marker migration。
- markers 不存在且已有内容明显无关：追加 marked block，不删除用户内容。
- markers 不存在但内容像旧版规则挖掘输出：停止并询问“迁移到独立规则文件还是追加 pointer”，避免重复堆叠。
- frontmatter 文件：frontmatter 必须保持文件第一段；markers 放在 frontmatter 后。
- pointer 一律使用 repo-root-relative `docs/ai/project-rules.md`，不要写绝对路径。

## 禁止目标

Generated runtime 与 spec-first managed runtime state 不是规则目标：`.claude/`、`.codex/`、`.agents/skills/`、`.cursor/skills/`、`.cursor/spec-first/`、`.kiro/skills/`、`.kiro/agents/`、`.kiro/spec-first/`、`.qoder/skills/`、`.qoder/agents/`、`.qoder/spec-first/`。

`.cursor/rules/**` 与 `.qoder/rules/**` 是当前可选 host-native rule surfaces；只有用户明确点名或 inline 场景需要时才写。默认独立规则文件 `docs/ai/project-rules.md` 是普通 source 文档，不属于 generated runtime mirror。
