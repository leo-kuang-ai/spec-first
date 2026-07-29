# OpenCode 1.18.7 Host Support 验证

## 结论

本轮确认 OpenCode 1.18.7 能发现并加载 spec-first 的 command 与 Skill，能解析 35 条精确 Skill allow、5 条危险工具 `ask`，并能通过 `context7` 建立真实 MCP transport。Runtime Setup 的 project/user target、JSONC fail-closed、permission conflict、exact-entry uninstall、Codex/OpenCode coexistence 与 consumer-aware clean 均取得真实 fixture 证据。

当前最大诚实声明仍为 `generated_runtime_preview`，`testedVersions` 保持空数组。阻断晋升的直接原因是：

- `sequential-thinking` MCP transport 在 OpenCode 的 30 秒窗口内超时；
- 隔离环境没有 provider credential，且本轮没有额外的外部模型通信授权，因此未触发真实的危险工具 permission prompt；resolved config 不能替代 enforcement outcome；
- loader/config journey 发现并修正了 OpenCode 1.18.7 的真实 config precedence：project config 后加载并高于 user config。修复已进入 canonical registry 与聚焦回归，但这一发现本身要求保持谨慎 claim。

因此不修改 `src/cli/adapters/opencode.js` 的 evidence metadata。

## 身份与范围

- capture time: `2026-07-30T02:54:26+08:00`
- executable: `/opt/homebrew/Cellar/opencode/1.18.7/bin/opencode`
- version: `1.18.7`
- executable SHA-256: `4266cf16e70a4c36ac6f0a5e0310dbab6cae84f3befddc6626193efc4fcdc1cf`
- source HEAD: `20ec3331133345794d1781c9b6b50be2c1d78762`
- branch: `leo-2026-07-27-opencode`
- fixture root: `/tmp/spec-first-opencode-u6.GcPGUY`
- primary project fixture: `/tmp/spec-first-opencode-u6.GcPGUY/project`
- user-scope fixture: `/tmp/spec-first-opencode-u6.GcPGUY/user-scope-project`
- isolation: dedicated HOME/XDG config/data/cache roots; no real user OpenCode config was targeted
- redaction status: `passed`; artifacts contain no credential、token、完整 command/Skill body 或模型响应

当前 source 包含未提交工作树变更。承重 source 文件的 SHA-256 记录在 `observations.json`；最终工作树 identity 由 `spec-work` closeout fingerprint 另行生成，不能用 HEAD 单独代表本轮 source。

## 观察结果

### Command loader

- recoverable minimal probe 只保留 `spec/work` command；验证后恢复 `17` 个 command 文件。
- OpenCode 返回 key `spec/work`，description 为 `Run the Spec-First execution workflow`。
- loaded template 包含 `.opencode/skills/spec-work` support-root marker 与 `# Work Execution Command`。
- 去除 frontmatter、统一换行并 trim 后，loaded template 与 generated command body SHA-256 均为 `c51aa2225159825a8944b019b43cd848c95bae4e8fc9ce565a91facada7f8c18`。

### Skill loader 与 coexistence

- `.opencode/skills/spec-work` 与 `.agents/skills/spec-work` 同时存在。
- minimal probe 返回 OpenCode built-in `customize-opencode` 与一个 `spec-work`；`spec-work` selected location 为 `.opencode/skills/spec-work/SKILL.md`，没有 same-name duplicate ambiguity。
- loaded body、OpenCode projection body 与 Codex projection body SHA-256 均为 `b9b9d56dee5f69b078bdb3c281024a1e79266c19538d5978d484cd35d53c1037`。
- 验证后恢复 OpenCode `35` 个 Skill 目录与 Codex `.agents/skills` `35` 个目录。

### Config、MCP 与 permission

- OpenCode resolved config 包含 `user-owned`、`sequential-thinking`、`context7` 三个 MCP key；用户字段 `$schema`、`autoupdate:false`、`tool_output` 与 disabled `user-owned` server 保留。
- `context7` transport 为 `connected`；`sequential-thinking` 为 `failed`，原因是 `Operation timed out after 30000ms`。
- resolved permission 包含 `35` 个 exact governed Skill `allow`；`bash`、`edit`、`task`、`webfetch`、`websearch` 均为 `ask`。
- 把 user-scope `permission.bash` 改为冲突值 `allow` 后，repair 返回 `host-config-opencode-permission-conflict`，`conflict_fields=[permission.bash]`，文件 SHA-256 前后不变。
- permission enforcement prompt 未运行，不能把 resolved config 晋升为 host field outcome。

### Precedence 与 user scope

OpenCode loader 日志显示顺序为 user config → project config，因此 project scope 的优先级高于 user scope。初版 registry 的相反顺序会把 user config 误判成 project effective target；本轮已将 canonical registry 修正为：

- project JSON `100`，project JSONC guard `110`
- user JSON `50`，user JSONC guard `60`

重新投射后：

- 已有 project config 时，显式 `--user-scope` 返回 `host-config-higher-precedence-current`，不会写 XDG JSON；
- 无 project config 的独立 fixture 只有在显式 `--user-scope` 下写入 `${XDG_CONFIG_HOME}/opencode/opencode.json`，project `opencode.json` 未创建；
- project `opencode.jsonc` 存在时，project JSON mutation 返回 `host-config-jsonc-precedence-blocked`，JSON/JSONC/XDG config 哈希均保持不变，未残留 lock/temp/backup。

### Exact-entry uninstall 与 clean lifecycle

- 精确删除 `context7` 返回 `host-config-removed`、`post_write_verified=true`；`sequential-thinking` 与 40 条 permission rules 保留。
- 将 `context7.command` 改为冲突值后，删除返回 `host-config-uninstall-conflict`、`conflict_fields=[command]`，文件 SHA-256 前后不变；显式 repair 可恢复 expected entry。
- Codex/OpenCode 共存时，`clean --opencode` 保留 Codex runtime 与 `AGENTS.md` managed content；重新 init 后，`clean --codex` 保留 OpenCode runtime 与同一 `AGENTS.md` 哈希。
- 最后一个 confirmed consumer 执行 `clean --opencode` 后，两宿主 state 均不存在，`AGENTS.md` managed content 被移除；fixture 中保留一个 0-byte `AGENTS.md` 文件，未把“空文件仍存在”表述成整文件删除。

## Source 修正与验证

U6 真实 loader order 触发了 plan 内 KTD12/U4 已授权的必要 source 修正：调整 OpenCode project/user precedence，并补充 registry 与 host-config 回归。聚焦验证：

```text
npx jest tests/unit/mcp-setup-host-config.test.js tests/unit/mcp-setup-registry.test.js --runInBand
2 suites passed / 44 tests passed
```

本文件不是完整 shipping closeout。全量 unit/smoke/integration/MCP setup/build、`spec-code-review`、structured closeout 与 plan lifecycle 由后续 `spec-work` tail 负责。

## 限制与失效条件

- `sequential-thinking` transport 超时；网络、npm cache、package release 或 OpenCode timeout 改变后必须重跑。
- 未经显式外部模型通信授权，未执行 provider-backed permission prompt；取得授权与 credential 后需分别观察 exact Skill allow 和危险工具 ask/deny outcome。
- OpenCode 版本、config merge/load order、Skill discovery roots、command key normalization、permission schema/order 或 MCP timeout 变化时，本证据失效。
- 本轮第一次 fixture init 因 cwd 误指向 source repo，曾通过 source-owned `init` 刷新当前仓库 ignored runtime；没有 tracked diff，也没有手改 generated runtime。后续旅程均在隔离 fixture cwd 执行。
- minimal loader probe 临时收窄 generated runtime 后已恢复 `17/35/35` 全量资产；其目的仅是规避 OpenCode 约 64 KiB debug JSON 截断，不改变 source claim。

## 证据文件

- `observations.json`：bounded derived facts、hash、reason code 与 claim decision
- `raw-loader-order.txt`：经过路径收敛的 loader 顺序原始行
- `raw-mcp-list.txt`：经过 ANSI 清理的 MCP transport 结果
- `SHA256SUMS`：本目录 artifact 完整性清单
