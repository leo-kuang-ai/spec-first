---
mode: deep
last_updated: 2026-03-08T12:00:44Z
generated_at: 2026-03-08T12:00:44Z
project: spec-first
platform_type: node-cli
---

# 本地环境搭建

## 安装与验证

- 官方 README 直接给出全局安装命令 `npm install -g spec-first`。 (`README.md:848` — `npm install -g spec-first` — [显式])
- 也支持 `pnpm add -g spec-first`。 (`README.md:850` — `pnpm add -g spec-first` — [显式])
- 安装完成后的首个验证动作是 `spec-first --version`。 (`README.md:854` — `spec-first --version` — [显式])
- 运行时要求 Node.js 20 LTS 及以上。 (`README.md:1693` — `Node.js | ≥ 20 LTS` — [显式])

## 初始化项目

- 快速上手从 `spec-first init --feat AUTH --mode N --size M --platforms h5,backend` 开始。 (`README.md:861` — `spec-first init --feat AUTH --mode N --size M --platforms h5,backend` — [显式])
- `init` 命令会解析 `--feat/--mode/--size/--platforms/--feature-id/--title/--bootstrap`。 (`src/cli/commands/init.ts:67` — `parseInitCliInput` — [显式])
- `init` 在需要时可触发宿主 bootstrap、hooks 安装和 AI hooks 注册。 (`src/cli/commands/init.ts:79` — `runBootstrapIfEnabled` — [显式])

## 更新与宿主集成

- 推荐使用 `spec-first update` 作为统一安装后刷新入口。 (`src/cli/commands/update.ts:38` — `用法: spec-first update` — [显式])
- `setup` 只是兼容别名，已被废弃。 (`src/cli/commands/setup.ts:11` — `@deprecated` — [显式])
- `update` 会执行 Skills 同步、MCP 配置补齐、Hooks 刷新与 Session Hook 注册。 (`src/cli/commands/update.ts:90` — `宿主集成刷新` — [显式])
- dry-run 可用于预览变更。 (`src/cli/commands/update.ts:42` — `--dry-run` — [显式])

## 可视化与诊断

- Viewer 可通过 `spec-first viewer [start|open|url]` 启动或复用。 (`src/cli/commands/viewer.ts:3` — `spec-first viewer [start|open|url]` — [显式])
- `viewer open --background` 是会话启动 hook 里的无阻塞路径。 (`src/cli/commands/viewer.ts:84` — `--background` — [显式])
- `doctor` 会检查 Feature 目录、`stage-state.json`、Git Hooks 与 Session Hook。 (`src/cli/commands/doctor.ts:131` — `checkFeatureDir` — [显式])
- 若 `~/.claude/settings.json` 不存在，doctor 会提示运行 `spec-first update` 安装 Session Hook。 (`src/cli/commands/doctor.ts:178` — `~/.claude/settings.json 不存在` — [显式])

## 开发者常用命令

- 构建：`npm run build`。 (`package.json:10` — `"build": "tsup"` — [显式])
- 类型检查：`npm run typecheck`。 (`package.json:11` — `"typecheck": "tsc --noEmit"` — [显式])
- 测试：`npm test` / `npm run test:coverage`。 (`package.json:12` — `"test": "vitest run"` — [显式])
- 本地 viewer：`npm run viewer:start` 或 `npm run viewer:bootstrap`。 (`package.json:19` — `viewer:start` — [显式])

## 环境判断

- 本项目本地搭建的关键难点不在数据库，而在宿主目录、MCP、Skills、Hooks 和会话注入是否正确落位。 (`src/shared/host-bootstrap.ts:73` — `detectHostPaths()` — [推断])
