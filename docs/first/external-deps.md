---
mode: deep
last_updated: 2026-03-08T12:00:44Z
generated_at: 2026-03-08T12:00:44Z
project: spec-first
platform_type: node-cli
---

# 外部依赖

## NPM 依赖

- 运行时依赖只有 `handlebars/js-yaml/semver/update-notifier` 四个基础包。 (`package.json:67` — `"dependencies"` — [显式])
- 工程依赖集中在 `eslint/typescript/vitest/tsup/prettier`。 (`package.json:54` — `"devDependencies"` — [显式])
- 项目通过 `pnpm.overrides` 强制覆盖 `rollup/minimatch/esbuild` 版本。 (`package.json:73` — `"pnpm": { "overrides"` — [显式])

## MCP 与宿主工具

- 必需 MCP 至少包含 `sequential-thinking/context7/serena/fetch/playwright-mcp`。 (`src/config/bootstrap-manifest.ts:53` — `REQUIRED_MCP_SERVERS` — [显式])
- 这些 MCP 同时给 Codex 与 Claude Code 定义了启动命令。 (`src/config/bootstrap-manifest.ts:21` — `RequiredMcpServer` — [显式])
- `serena` 通过 `uvx --from git+https://github.com/oraios/serena` 拉起。 (`src/config/bootstrap-manifest.ts:97` — `name: 'serena'` — [显式])
- `fetch` 通过 `uvx mcp-server-fetch` 集成。 (`src/config/bootstrap-manifest.ts:125` — `name: 'fetch'` — [显式])
- `playwright-mcp` 通过 `npx -y @playwright/mcp@latest` 集成。 (`src/config/bootstrap-manifest.ts:143` — `name: 'playwright-mcp'` — [显式])

## Skills 依赖

- bootstrap 清单要求至少存在 `find-skills` 与 `skill-creator` 两个技能。 (`src/config/bootstrap-manifest.ts:162` — `REQUIRED_SKILLS` — [显式])
- `find-skills` 缺失时可从 `https://github.com/vercel-labs/skills.git` 兜底拉取。 (`src/config/bootstrap-manifest.ts:168` — `repoUrl` — [显式])
- `skill-creator` 缺失时可从 `https://github.com/anthropics/skills.git` 兜底拉取。 (`src/config/bootstrap-manifest.ts:177` — `repoUrl` — [显式])

## 编辑器与旁路消费者

- 仓库包含一个 VS Code 扩展包，激活条件为工作区含 `.spec-first/config.yaml`。 (`packages/vscode-spec-first/package.json:7` — `activationEvents` — [显式])
- 扩展暴露 `specFirst.refreshIds` 命令。 (`packages/vscode-spec-first/package.json:13` — `"command": "specFirst.refreshIds"` — [显式])
- 可视化旁路依赖 Node `http` 服务实现。 (`scripts/stage-viewer/server.js:3` — `createServer` — [显式])

## 网络与系统依赖判断

- update 流程默认只做“存在性检查 + 缺失补齐”，刻意避免 `npx/uvx` 二进制探测引发网络阻塞。 (`src/cli/commands/update.ts:117` — `不做二进制探测` — [显式])
- host bootstrap 在非测试环境才会真正执行宿主修复。 (`src/shared/host-bootstrap.ts:63` — `SPEC_FIRST_SKIP_BOOTSTRAP` — [显式])
