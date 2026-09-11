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

### Provider 安装身份的证据范围

Graphify 的 `provider-readiness.v2.provider_identity` 保留已解析的 package/version、command/interpreter、installer 及 `inventory_sha256`。清单按稳定顺序计算摘要，不输出完整包列表；空、非法或超出 10000 项的清单为 null。图 apply 发布前重新检查实际 interpreter 的 distribution 身份，版本不符降为 degraded。CLI 保留该兼容增量字段，不用 plan 中的 pin 补造观测。

这些字段说明此次 probe 观察到的安装环境；它们不是安装字节完整性证明，也不单独证明当前图、scope receipt 或宿主 MCP 会话可用。doctor 在 source snapshot 与 TTL 通过后，复用 Provider 只读 resolver 核对当前 Graphify 身份；已知字段变化或实际版本不符标为 stale，缺身份、缺 inventory 摘要或 probe 失败标为 unknown。探测不安装、不构图、不 query，也不执行 facts 中记录的 command。普通 normalizer 只保留历史观测，不自行启动探针。

doctor 同样核对 CodeGraph 当前安装身份；该检查不证明 CodeGraph database 已绑定构建时源码，不能代替完整 U8 验证。Provider 身份与 source snapshot 均为分步观测，不是跨文件和进程的原子快照。

当前身份探测共享 5 秒命令预算，超限为 unknown；进程终止开销及同步文件读取不属于严格墙钟上限。探针跳过 npm collision 诊断并禁止 Python bytecode 写入；隔离真实 Python 导入测试验证 HOME/package 树无新增文件，该约束不是任意第三方程序的副作用沙箱。launcher 启动失败或超时为 unknown，只有成功输出版本不符等已知身份变化才标为 stale。

Graphify artifact scope 的 doctor 检查复用既有 `graphify-scope-provenance.v1` reader。`provider-readiness.v2.first_generation.scope_provenance` 兼容增加可选 `graph_sha256`，记录已验证 receipt 中的摘要；normalizer 保留该证据。doctor 比较历史摘要、当前 receipt 与当前 graph.json，图单独变化或图与 receipt 同时变化均不能沿用历史 query 证据。旧 facts 缺摘要、缺 scope 或旧/缺失 receipt 降为 unknown；已知图/scope 不符为 stale。installation scope 不查图。

doctor 的 receipt/graph 读取使用 no-follow/nonblocking fd、普通单链接文件检查、读前后身份复核和实际读取上限（receipt 64 KiB、graph 64 MiB）；超限或读取期间变化均保留 unknown。此限制不改变现有安装/构图路径的文件读取策略，也不证明图语义。

构图/refresh 前后复用 setup source snapshot 的有界内容采集；仅当两次完整内容身份一致，既有 receipt 才保存 `source_snapshot`（v2 的 schema_version/source_kind/source_content_sha256 三字段）。该身份覆盖整个执行 repo/folder 的既定 source 范围，而非猜测图实际读取了哪些文件。host/registry/root 仍由 tool-facts 的完整快照校验。

旧 receipt 没有源码绑定时，verify 只能保留 unknown；必须显式生成/refresh 才能写入新绑定，不能通过重新发布 facts 补造。无 HEAD、超预算或不安全源码导致无法采集时，即使图/query 成功也保持 unknown；已确认构图期间源码变化则记录 `graphify-source-changed-during-generation` 并降为 degraded。doctor 比较历史绑定、当前 receipt 和当前源码，源码变化后的旧图不能因 facts 更新时间较新而变 fresh。前后采样仍非原子快照，不保证期间没有短暂变化。

### CodeGraph 当前安装身份

`provider-readiness.v2.provider_identity` 复用同一兼容字段，记录 npm resolver 实际解析的 package/version/installer/command 与 `inventory_sha256`。摘要只覆盖主包和平台包的路径、名称、版本，以及实际入口与固定启动参数；不包含业务 argv，不证明安装后二进制、传递依赖或数据库内容完整性。它与 `dependency_identity` 的顶层下载归档校验是两种不同证据。

Provider 在前序 version/status/query 后，通过安全平台入口执行一次最多 5 秒的 `--version`，前后重新解析安装元数据。身份确认后才发布；已知版本/身份变化降为 degraded，未识别 native 安装、缺包或探针失败降为 unknown，原有失败不被覆盖，保留实际 lifecycle。后续 host 配置确认不能把缺少身份的 unknown 升回 fresh。5 秒是子进程预算，不是同步文件读取或任意程序副作用的沙箱保证。

doctor 只从当前环境解析命令，不执行历史 facts 中的 command。当前已知身份变化为 stale，旧 facts 缺身份或当前无法确认则 unknown；source/TTL 或前一个 Provider 已失效时停止后续比较，不能据此声称逐个 Provider 都完成了当前探测。非 npm native 安装继续保留使用路径，但没有可确认的安装身份时不能支持历史 fresh。

### Evidence 发布失败

`write_result` 表达最后一次 canonical facts 发布结果。首次 facts 写入成功后，回填 scenario 状态的第二次写入仍是实际发布：失败时 `complete=false`、退出码非零，`execution_summary.overall_status=action-required`；无更早的 Provider/baseline 主失败时 reason 为 `scenario-fingerprint-ledger-update-failed`。已存在的主失败保留在顶层，发布失败仍由 `write_result` 和 scenario limitation 表达。host ledger 只在最终 facts 发布成功后写入。

scenario fingerprint 的生成失败仍是 advisory；如果其失败状态成功写入 canonical facts，不因此阻断 setup。默认 writer 对成对 facts 的写入失败执行既有 best-effort 恢复；失败返回不声称事务回滚已获全局原子保证。

Provider 的路径与 action-plan 预检先于 baseline 安装、host 配置和 facts 写入。被阻止时沿用既有 setup error envelope，保留原始 reason，不生成一份看似已执行的 Provider facts。preflight 不作为安装后的执行计划缓存；依赖变化后仍由对应 Provider 重新规划。


### Workspace 构图预算与中断

显式 workspace graph build 默认最多处理 32 个 confirmed repos，并共用 15 分钟命令预算；每个子进程 timeout 不超过剩余预算。Provider 子进程 SIGINT/SIGTERM 传播为 `workspace-build-cancelled`，进程超时优先为 `workspace-build-timeout`，不会继续启动后续 Provider、merge、routing 或 hook。失败恢复与 lease 清理仍允许运行，预算不是同步文件 IO 或进程终止开销的严格墙钟沙箱。

最终 state 写入后仍在 lease 内复核预算/取消，已写出的 complete 必须纠正为 partial。纠正写入失败时返回 failed write result 并保留自有 lease，让 status 识别未收口；不把内存中的 partial 当作已成功落盘。正常纠正和 Provider init 回滚成功后释放 lease，允许重试。原位 refresh 不具备 init 的整库备份回滚保证；整个 setup 进程直接收到 SIGINT、Windows 信号行为和子进程树清理尚需独立验证。


### CodeGraph 索引完整性

索引状态使用原生 `status --json`，要求 initialized、version、projectPath/indexPath、worktreeMismatch、pendingChanges 和 index 字段有效。只有 `index.state=complete`、无待解析引用/待处理文件、不建议重建且路径吻合时，才进入 query 验证。旧 `state:null` 不直接支持 ready；显式 apply 使用原生 `index -f` 重建并再次验证。字段缺失、未知文本、非法 JSON 和工作树错配均不支持 indexed。

此项只修复状态误判，不使原生 status/query 变为只读：CodeGraph 1.6.0 打开数据库时可能执行恢复和迁移。只读 artifact verify 路径仍待迁移到绑定源码、安装身份及 DB/WAL 的证据回读；当前不能声明这一边界已完成。
