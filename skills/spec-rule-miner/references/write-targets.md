# Write Targets

写入前读取本参考。目标是让 `AGENTS.md` 成为 canonical full rules，并避免破坏用户已有规则或 generated runtime mirrors。

## 默认目标

1. `AGENTS.md`：写完整规则块，使用 HTML markers：

   ```markdown
   <!-- spec-rule-miner-start -->
   # Project Rules
   ...
   <!-- spec-rule-miner-end -->
   ```

2. `CLAUDE.md`：默认写 pointer 到 `AGENTS.md`，同样用 markers 包住。优先使用宿主支持的 native import；不确定时用一句目标项目语言的说明，例如“本项目编码规则以根目录 `AGENTS.md` 为唯一来源，编码前必须阅读并遵守。”

## 用户指定的额外工具

除非用户点名，不要猜测额外工具文件。默认写 pointer，不复制全文：

| Tool | Path | 规则 |
| --- | --- | --- |
| Kiro | `.kiro/steering/project-rules.md` | frontmatter 第一行开始，至少包含 `inclusion: always` |
| Qoder | `.qoder/rules/project-rules.md` | pointer 到 `AGENTS.md` |
| GitHub Copilot | `.github/copilot-instructions.md` | pointer 到 `AGENTS.md` |
| Trae | `.trae/instructions.md` | pointer 到 `AGENTS.md` |
| Other | 用户给定路径 | 保留用户指定 frontmatter 或格式 |

## Inline 场景

completion/inline 功能通常不会读取 `AGENTS.md` 或 pointer。用户明确要求 Cursor tab、Copilot inline、legacy `.cursorrules` 等 inline 场景时，写完整规则正文：

- Cursor：`.cursor/rules/project-rules.mdc`，frontmatter 必须在文件最前面，包含 `description`、`globs` 和 `alwaysApply: true`。
- Legacy Cursor：`.cursorrules` 为纯文本；把 Markdown heading 转为大写标签，使用 `# --- spec-rule-miner-start ---` / `# --- spec-rule-miner-end ---` markers。

## 合并规则

- 文件不存在：创建父目录和文件，只写目标块或 pointer。
- `spec-rule-miner-start` / `spec-rule-miner-end` markers 存在：只替换 markers 中间内容，保留文件其他部分。
- legacy `rule-miner-start` / `rule-miner-end` markers 存在：替换旧 markers 与其中内容为新的 `spec-rule-miner` marked block，并在 summary 说明完成 legacy marker migration。
- markers 不存在且已有内容明显无关：追加 marked block，不删除用户内容。
- markers 不存在但内容像旧版规则挖掘输出：停止并询问“替换还是追加”，避免重复堆叠。
- frontmatter 文件：frontmatter 必须保持文件第一段；markers 放在 frontmatter 后。
- pointer 一律使用 repo-root-relative `AGENTS.md`，不要写绝对路径。

## 禁止目标

不要写入 generated runtime mirrors 或 spec-first managed runtime state：`.claude/`、`.codex/`、`.agents/skills/`、`.cursor/skills/`、`.cursor/spec-first/`、`.kiro/skills/`、`.kiro/agents/`、`.kiro/spec-first/`、`.qoder/skills/`、`.qoder/agents/`、`.qoder/spec-first/`。

`.cursor/rules/**`、`.kiro/steering/**`、`.qoder/rules/**` 是 host-native rule surfaces；只有用户明确点名或 inline 场景需要时才写。
