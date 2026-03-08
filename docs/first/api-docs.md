---
mode: deep
last_updated: 2026-03-08T12:00:44Z
generated_at: 2026-03-08T12:00:44Z
project: spec-first
platform_type: node-cli
---

# 接口规范

## 接口形态

- 当前稳定接口面是 CLI，而不是 HTTP / RPC 服务。 (`src/cli/index.ts:30` — `registerCommand('id'` — [显式])
- 顶层命令由统一路由器注册和分发。 (`src/cli/router.ts:21` — `registerCommand` — [显式])
- CLI 顶层帮助格式固定为 `spec-first <command> <subcommand> [args] [--flags]`。 (`src/cli/router.ts:78` — `用法：spec-first <command> <subcommand> [args] [--flags]` — [显式])

## 顶层命令面

- CLI 至少暴露 `id/matrix/init/stage/rfc/defect/metrics/doctor/gate/golive/done/ai/commit/feature/setup/hooks/viewer/update/uninstall/analyze/trace/validate`。 (`src/cli/index.ts:30` — `registerCommand('id'` — [显式])
- `viewer` 子命令固定为 `start|open|url`。 (`src/cli/commands/viewer.ts:11` — `type ViewerSubcommand = 'start' | 'open' | 'url'` — [显式])
- `metrics` 额外支持 `coverage/report/health` 三类子命令。 (`src/cli/commands/metrics.ts:27` — `case 'coverage'` — [显式])
- `ai` 额外支持 `context/catchup/stats`。 (`src/cli/commands/ai.ts:14` — `case 'context'` — [显式])

## 参数与错误规范

- 未提供顶层命令时返回帮助并退出成功。 (`src/cli/router.ts:37` — `if (!cmd || cmd === '--help'` — [显式])
- 未知顶层命令统一返回 `VALIDATION_ERROR`。 (`src/cli/router.ts:47` — `未知命令` — [显式])
- 错误被路由层统一捕获并映射为 `UNKNOWN_ERROR`。 (`src/cli/router.ts:68` — `try { return await entry.handler` — [显式])
- 退出码统一定义在共享类型中：`0/1/2/3/4/5` 对应成功、门禁失败、校验失败、配置失败、IO 失败和未知错误。 (`src/shared/types.ts:43` — `export enum ExitCode` — [显式])
- 值型 flag 使用 `--flag value` 风格解析。 (`src/cli/parse-utils.ts:8` — `parseFlag(args, flag)` — [显式])
- 重复 flag 支持聚合为数组。 (`src/cli/parse-utils.ts:22` — `parseFlagAll` — [显式])

## 命名、时间与契约约定

- 时间戳普遍使用 `new Date().toISOString()`，因此接口输出与持久化字段统一为 ISO 8601 UTC。 (`src/core/change-mgr/rfc.ts:78` — `const now = new Date().toISOString()` — [显式])
- 阶段命名使用固定枚举值 `00_init` 到 `09_cancelled`。 (`src/shared/types.ts:7` — `export enum Stage` — [显式])
- ID 类型覆盖 `FR/DS/TASK/TC/RFC/REQ/SYS/ARCH/MOD/ATP/STP/ITP/UTP`。 (`src/shared/types.ts:27` — `export type NextIdType` — [显式])
- `metrics coverage` 是已知的机器可读输出入口，因为支持 `--json`。 (`src/cli/commands/metrics.ts:41` — `const jsonFlag = args.includes('--json')` — [显式])

## 认证 / 分页 / 服务端约束

- 当前接口面运行于本地 CLI，未定义服务端认证协议。 (`package.json:6` — `bin` — [推断])
- 当前接口面不涉及分页语义，输出规模主要由 Feature 或命令过滤参数控制。 (`src/cli/commands/metrics.ts:42` — `args.find(a => !a.startsWith('--'))` — [推断])
- 当前仓库未展示统一 HTTP 错误码或 REST 响应 envelope。 (`src/cli/index.ts:30` — 顶层均为命令注册 — [推断])
