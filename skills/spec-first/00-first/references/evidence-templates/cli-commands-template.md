# CLI Commands 证据注入模板

## 注入规则

为每个 CLI 命令添加实现位置证据，格式：

```markdown
#### <command> - <description>

(`<file>:<line>` — `<key_code>` — `[显式]`)

**用法**:
\`\`\`bash
spec-first <command> [options]
\`\`\`

**功能**: <详细说明>

**选项**:
- `--option`: 说明 (`<file>:<line>` — `<code>` — `[显式]`)
```

## 证据位置映射

| 命令 | 实现文件 | 搜索策略 |
|------|---------|---------|
| init | src/cli/commands/init.ts | Serena: find_symbol "handleInit" |
| stage | src/cli/commands/stage.ts | Serena: find_symbol "handleStage" |
| id | src/cli/commands/id.ts | Serena: find_symbol "handleId" |
| gate | src/cli/commands/gate.ts | Serena: find_symbol "handleGate" |
| matrix | src/cli/commands/matrix.ts | Serena: find_symbol "handleMatrix" |
| rfc | src/cli/commands/rfc.ts | Serena: find_symbol "handleRfc" |
| defect | src/cli/commands/defect.ts | Serena: find_symbol "handleDefect" |
| metrics | src/cli/commands/metrics.ts | Serena: find_symbol "handleMetrics" |
| doctor | src/cli/commands/doctor.ts | Serena: find_symbol "handleDoctor" |
| golive | src/cli/commands/golive.ts | Serena: find_symbol "handleGolive" |
| ai | src/cli/commands/ai.ts | Serena: find_symbol "handleAi" |
| commit | src/cli/commands/commit.ts | Serena: find_symbol "handleCommit" |
| feature | src/cli/commands/feature.ts | Serena: find_symbol "handleFeature" |
| setup | src/cli/commands/setup.ts | Serena: find_symbol "handleSetup" |
| hooks | src/cli/commands/hooks.ts | Serena: find_symbol "handleHooks" |
| viewer | src/cli/commands/viewer.ts | Serena: find_symbol "handleViewer" |
| update | src/cli/commands/update.ts | Serena: find_symbol "handleUpdate" |
| uninstall | src/cli/commands/uninstall.ts | Serena: find_symbol "handleUninstall" |
| analyze | src/cli/commands/analyze.ts | Serena: find_symbol "handleAnalyze" |

## 实现策略

1. 使用 Serena MCP `find_symbol` 定位 handler 函数
2. 提取文件路径和行号
3. 提取函数签名作为关键代码片段
4. 标注证据类型为 `[显式]`

## 最低证据标准

- 每个命令必须有实现位置证据（1 处）
- 总计 19 个命令 = 19 处证据
