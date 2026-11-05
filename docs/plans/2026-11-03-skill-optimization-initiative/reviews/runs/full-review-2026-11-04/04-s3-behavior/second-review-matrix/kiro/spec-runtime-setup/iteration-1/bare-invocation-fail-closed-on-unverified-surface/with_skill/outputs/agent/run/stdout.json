Bare 调用已完成。汇报 readiness 结果如下。

## 执行结果

| 项 | 状态 |
| --- | --- |
| Required MCP/helper dependencies（baseline_ready） | **ready** |
| Generated runtime manifest | **current**（init 后 manifest 1.15.3 与 bundled 一致） |
| 总体 execution | **action-required**（`codegraph-init-failed`），exit code 1 |

说明两点环境修正（均落在隔离工作区内）：

1. 初次直接调用 `.claude/skills/spec-runtime-setup` 被 `host-invocation-surface-unverified` 阻断——该路径不是 Claude 的权威 surface（`.claude/spec-first/workflows`）。我把共置 skill 复制到 `.claude/spec-first/workflows/spec-runtime-setup` 后重新调用。
2. 随后 preflight 报告 runtime projection missing（`runtime-state-missing`），按其 headless next action 执行了 `spec-first init --claude -y -u skill-up --lang zh`（HOME 仍指向 `.eval-home`），projection 写入后重跑 bare 调用。

## MCP servers

- `sequential-thinking`、`context7`：ready（post-mutation probe 验证通过）
- `codegraph` MCP 条目：已安装并写入 host 配置（`.eval-home/.claude.json`，user scope），tool 状态 ready

## Helper tools

- 就绪：ast-grep、ffmpeg、gh、silicon、vhs
- `agent-browser`：skipped（manual setup incomplete，未请求，不阻断）
- `ast-grep-skill`：missing global skill（未请求，不阻断）

## Provider tools（artifact scope）

- **Graphify**：安装/初始化/构图/query probe 全部通过（`query_verified=true`），project-local hook 已安装并 verified；`readiness_status=unknown`（当轮无完整源码快照证据，图仅作 advisory candidate）。附两条提示：源码快照不完整需显式 refresh；graphify launcher 位于 `.eval-home/.local/bin`，不在原始 PATH（按 skill 边界未改 shell profile）。
- **CodeGraph**：**degraded**。包安装与 host 接线 ready，但 first generation 失败（`codegraph-init-failed`）。我手动复现确认原因：`codegraph init` 拒绝在目标目录初始化，判定它是 home 目录的父级（`it looks like a parent of your home directory`）——这是隔离 eval 环境下 `HOME=$PWD/.eval-home` 使项目根成为 HOME 父目录所致。降级路径 rg / ast-grep / direct source read 可用。

## Facts 写入

- `.spec-first/config/tool-facts.json` 与 `runtime-capabilities.json`：已写入（setup-facts-written）
- host readiness ledger：`.eval-home/.claude/spec-first/host-setup.json`（已写入）
- direct evidence 能力（rg、ast-grep、git diff、tests/logs、bounded reads）全部 true

## 结论与 next action

单项目 bare 收敛为 **partial**：除 CodeGraph 首次建图外的 registry baseline 全部 ready，generated runtime current。唯一 action-required 项是 CodeGraph init 被其 home 父级安全检查阻断——属隔离评测环境的路径拓扑副作用，而非依赖缺失；若要消除，可在真实 HOME 下重跑，或显式 `codegraph init --force`（setup 自身不会自动加 `--force`）。
