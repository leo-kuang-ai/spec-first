已按 `--check` 只读诊断完成（未安装任何工具、未改 host 配置、未写 setup facts）。当前夹具项目状态：

## 执行结果

| 项目 | 状态 |
| --- | --- |
| Required MCP 依赖 | 未验证（codegraph / context7 / sequential-thinking 均 `host-config-not-verified`） |
| 基线就绪（baseline_ready） | unknown |
| Generated runtime manifest | unknown（`runtime-capabilities-missing`） |

## MCP servers
- `codegraph`、`context7`、`sequential-thinking`：均为 **unknown（host-config-not-verified）**——本轮只读检查未验证 host 配置，不代表已配置或缺失的结论。

## 工具
- **degraded**：`agent-browser`（`agent-browser-capability-probe-invalid`，capability probe 输出无效，需检查 spec-test-browser probe）
- **ready**：`ast-grep`、`ffmpeg`、`gh`、`silicon`、`vhs`、`ast-grep-skill`

## Provider 状态
| Provider | readiness | scope / probe |
| --- | --- | --- |
| codegraph | unknown（project-not-initialized） | installation-incomplete / query-unverified |
| graphify | unknown（project-not-initialized） | installation-incomplete / query-unverified |

## 项目设置与事实
- Git 仓库：是
- 示例配置 `config.local.example.yaml`：missing
- 本地配置：**defaults-active**（无本地覆盖，默认值生效，非阻断项）
- `.spec-first/*.local.yaml` gitignore 覆盖：missing
- setup facts（`tool-facts.json` / `runtime-capabilities.json`）：均 missing（本轮不写入）

## 后续操作（仅列出，未执行）
1. `spec-runtime-setup --project-config` — 预览并写入项目本地配置（example/local override/gitignore）。
2. 标准完整 `spec-runtime-setup` — 收敛 required baseline + CodeGraph/Graphify；如只需刷新事实可用 `--verify-only`（会写入事实文件）。

当前完整 setup **未就绪**（Provider 未初始化、facts 缺失）。按你的要求本轮保持纯诊断；需要安装或修复时告诉我执行哪一步即可。
