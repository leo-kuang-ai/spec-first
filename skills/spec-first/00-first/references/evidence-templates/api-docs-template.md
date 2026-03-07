# API Docs 证据注入模板

## 注入规则

为每个 CLI 命令添加实现位置证据。

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

## 注入模板

```markdown
#### init - 初始化 Feature 工作区

(`src/cli/commands/init.ts:{{line}}` — `export async function handleInit()` — `[显式]`)

```bash
spec-first init [options]
```

初始化新的 Feature 工作区，创建目录结构和配置文件。
```

## 实现策略

使用 Serena MCP 的 `find_symbol` 工具定位每个命令的 handler 函数，提取文件路径和行号。
