# Supported MCP Tools

本文总结当前 `spec-runtime-setup` registry。Machine source of truth 是 `skills/spec-runtime-setup/setup-registry.json`，schema version 为 `setup-registry.v11`；generated host 从 loaded skill root 消费其共置 runtime projection。

## Current Required Tools

| Tool | Required | Category | Host config | Command |
| --- | --- | --- | --- | --- |
| Sequential Thinking | Yes | `mcp` | Yes | `npx -y @modelcontextprotocol/server-sequential-thinking@2026.8.31` |
| Context7 | Yes | `mcp` | Yes | `npx -y @upstash/context7-mcp@4.0.7` |
| CodeGraph | Yes, standard setup | `mcp` | Yes | `codegraph serve --mcp` |
| Graphify | Yes, standard setup | `provider-cli` | Project skill/hook | `graphify` |

## Setup Rules

- 默认 setup 覆盖 CodeGraph/Graphify 安装与 host 接线；普通 plan/verify 使用 installation scope，显式 `--only <graph-id>` 才进入图产物路径。
- 统一 registry 区分 `tools`、`helpers` 与 `providers`，同时集中管理 dependency pin、host target、platform override、install safety 与 artifact contract。
- MCP tools must define deterministic install, host config, detection, summary, and uninstall metadata.
- always-required MCP 使用 registry 固定版本；可选 helper 仍可按已登记策略保留 latest，不能据此宣称所有依赖可复现。
- required npm warmup 先运行 `npm pack --ignore-scripts --json`，校验实际归档 SHA-512，并核对 npm 返回的 name/version/filename/integrity；通过后以 `npx -y file:<已校验归档> --help` 执行。摘要、版本或归档结构不符均阻断执行；不使用镜像重试掩盖完整性错误。下载和执行失败仍保留原有来源与重试 facts。
- Warmup cache 位于 target 的 `.spec-first/cache/mcp-warmup/<host>/<platform>/`。`mcp-warmup-cache.v2` 绑定 command hash 与 registry 的 package/version/integrity/source 摘要，保留成功来源及完整 dependency_identity；旧格式、异常时间或身份不匹配不复用。实际重试前移除旧成功 receipt，失败/中断不能回退为旧 ready。缓存命中 attempts 为空，不冒充本次重新执行。
- `tool-facts.v2.items[].dependency_identity` 是兼容增量，`integrity_status=verified` 仅覆盖 `verification_scope=top-level-package-archive`。缓存的 dependency_sha256 只是声明身份摘要；归档实际校验依据是 identity.integrity。以上不证明传递依赖已锁定、用户现有 npx 缓存可信、宿主 MCP 会话可调用或业务任务完成。
- `--verify-only` / `--refresh-facts` 会重新验证并刷新 setup-owned facts，但不执行安装或 host config 写入。
- Supported host MCP config targets:
  - Claude Code: managed/user JSON `mcpServers`.
  - Codex: user/system TOML `mcp_servers` sections.
  - Kiro: workspace `.kiro/settings/mcp.json` by default; user `~/.kiro/settings/mcp.json` only with `--user-scope` or `KIRO_USER_SCOPE=1`.
  - Qoder: local `.qoder/settings.local.json` by default; user `~/.qoder/settings.json` only with `--user-scope` or `QODER_USER_SCOPE=1`.
  - Cursor：默认写 project `.cursor/mcp.json`；只有使用 `--user-scope` 才写 user `~/.cursor/mcp.json`。
- Claude、Kiro、Qoder 与 Cursor config 使用 JSON `mcpServers`；Codex 使用 bounded TOML section editing。两者都保留无关 entry、拒绝有歧义或无效输入，并要求 secret-like value 保持为 environment reference。

## Runtime 入口

先解析 loaded skill directory，再使用公开 mode argument 调用 `node <loaded-skill-root>/scripts/setup.cjs`。项目 cwd 绝不能作为 support-file lookup root。`scripts/check-health` 只是 `--check` 的 Node compatibility shim；Windows 直接使用同一 `setup.cjs` 入口，不存在 platform-specific companion。

## Required Helper Tools

ffmpeg and ast-grep guidance are required setup helpers；ffmpeg is baseline-blocking，`agent-browser` remains report-only/non-blocking for workflows that need browser automation. Each helper is not an MCP server, has no host config write, and is reported under `"helper_tools"` in setup-owned facts.

## Project Setup Facts

Setup writes project-local facts under `.spec-first/config/` when target writes are allowed:

- `tool-facts.json`: setup-owned tool and helper readiness facts.
- `runtime-capabilities.json`: setup-owned direct evidence posture and host ledger pointer.

These files are setup facts, not semantic code evidence. Downstream workflows decide what source files, tests, logs, or docs are relevant for the user's task.

## Handoff

After setup:

- If any row is `action-required`, fix that row and rerun setup.
- If a parent workspace target is ambiguous, choose a child repo and rerun with `--repo <child>`.
- If required runtime is ready, continue to the workflow that matches the user intent: plan, work, review, debug, or docs.

### CodeGraph 安装归档证据

CodeGraph 1.6.0 的顶层 npm 归档在 source registry 固定 SHA-512 和来源标识。baseline 阶段跳过由 registry Provider 拥有的 package 安装，统一 setup dependency 阶段与直接 Provider apply 共用 required npm warmup 的归档验证 owner：先 `npm pack --ignore-scripts --json`，核对实际字节和 name/version，再将同一 `file:<archive>` 交给 `npm install -g`；校验错误不会进入安装。安装后仍检查实际命令版本，不能以 npm 退出码 0 代替 readiness。

`tool-facts.v2.provider_readiness[].dependency_identity` 保留 package/version/source/integrity、`installer=npm-pack+npm-install`、`integrity_status=verified` 与 `verification_scope=top-level-package-archive`；CLI normalizer 保留有效身份，拒绝扩大后的范围。该字段是兼容增量，旧 facts 或已安装且本次未安装的 Provider 不补造历史安装证据。原 warmup cache 仍只接受 `npm-pack+npx`。临时归档在成功或失败后清理；不会产生 Provider 安装成功缓存。

这一证据只覆盖顶层 shim 包，不证明 optional 平台包、传递依赖、安装后文件或当前宿主 MCP 会话可信；实际下载/重试来源另由 install_source、mirror_used 和 attempts 记录。平台 bundle 的完整性与当前身份验证继续按计划单独闭环。

### CodeGraph npm launcher 的只读边界

官方 1.6.0 npm shim 在平台包缺失时会 self-heal 下载；即使设置 CODEGRAPH_NO_DOWNLOAD，命中历史 bundle 后仍会清理旧 cache。Runtime Setup 的普通真实 runner（含 sync worker）和 workspace 默认 runner 通过 Provider-owned `codegraph-launcher.cjs` 解析已安装、版本匹配的平台包，直接运行其入口；Windows 使用平台 node.exe 与独立 argv prefix，避免执行 npm .cmd wrapper。缺包或身份不符返回结构化失败和显式安装修复指引，不回退 shim 或 self-heal cache。异步 workspace 记录的绝对命令也在实际启动时重新解析。

该检查只识别 npm 已知安装布局，保留非 npm native launcher 与非 CodeGraph 命令的既有行为；它不是任意 shell/JS 的副作用沙箱。DI runner 的替身测试不证明真实启动边界；独立隔离执行覆盖默认 runner。manifest/version 匹配不等于归档字节校验，平台包及传递依赖的供应链证明不能由此推导。
