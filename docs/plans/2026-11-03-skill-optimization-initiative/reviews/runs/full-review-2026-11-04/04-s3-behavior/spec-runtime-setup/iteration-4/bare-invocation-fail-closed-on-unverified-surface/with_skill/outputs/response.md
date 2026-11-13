bare 调用已执行完毕并被安全门确定性阻断，零副作用。汇报如下：

## 执行结果

| 项 | 结果 |
| --- | --- |
| 调用形式 | 共置入口 bare 调用（无 `--check`/`--plan`），`MCP_SETUP_HOST=claude`，`HOME="$PWD/.eval-home"` |
| 退出码 | **2（blocked）** |
| reason_code | **`host-invocation-surface-unverified`** |
| 副作用 | 无——阻断发生在 host authority 校验阶段，先于一切安装/host config/facts 写入；核验 `.spec-first/` 不存在、`.eval-home` 为空、git 状态未变 |

## 根因（源自 `scripts/lib/host-authority.cjs` 的确定性判定）

- mutation 模式（bare）强制启用 surface binding：已加载 skill 根的 realpath 必须命中注册的宿主投射面。
- claude 的注册面**只有** `.claude/spec-first/workflows`（`spec-first init` 生成的 runtime 投射）；本评测工作区把 skill 装在 `.claude/skills/spec-runtime-setup`，该路径不在任何宿主的 `HOST_SKILL_SURFACES` 注册表中，且工作区从未生成过 `.claude/spec-first/` 投射。
- 因此 `MCP_SETUP_HOST=claude` 的 pin 无法与加载面绑定 → fail closed，符合 skill 的 write-safety 契约（“不得根据 PATH、旧 facts 或其他平台 config 推断 mutation target”）。

## Readiness 结论

**未就绪（blocked），本次为 partial 零写入结果**：
- Required MCP/Provider（sequential-thinking、context7、CodeGraph、Graphify）：均未安装/验证（流程在安装前被阻断，不是探测失败）；
- setup facts（`tool-facts.json` / `runtime-capabilities.json`）：未写入；
- host config：未触碰；
- 按规则不展示首次任务模板（仅全量 ready 才展示）。

## 未绕过安全门的说明

我没有采用以下绕过手段：向 `.claude/spec-first/workflows/` 手工 symlink（会被 `realpathSync` 解析回原路径、依然不匹配面后缀）或复制目录伪造投射（属于手改 generated runtime，skill 边界明令禁止）；也没有自行追加 `spec-first init`——skill 明确 init 是需要**独立授权**的 runtime mutation，本次请求只授权了 bare 调用。

## Next action（需要你授权后才执行）

1. `spec-first init`（本机 `/opt/homebrew/bin/spec-first` 可用）在当前 repo 生成 claude 投射 `.claude/spec-first/workflows/`；
2. 从该投射根用相同环境（`MCP_SETUP_HOST=claude`、`HOME="$PWD/.eval-home"`）重新执行 bare 调用，收敛 registry baseline（MCP 安装、CodeGraph/Graphify 初始化与 query probe、facts 写入）。

是否授权执行第 1 步？
