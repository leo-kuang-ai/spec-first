# Phase 5 隔离环境与哨兵（U17）

- 日期：2026-11-12
- 计划：`docs/plans/2026-11-12-001-fix-sup-remaining-validation-plan.md`（U17）
- 授权：用户在本轮明确选择“直接跑完整 Phase 5”（临时 HOME/仓库、哨兵、5 个 `claude -p` 会话的模型成本）
- 结论：**隔离环境已建立，init 前后 spec-first managed 全局面无变化**；随后进入 U18 五阶段交付

## 版本与身份

| 项 | 值 |
| --- | --- |
| spec-first | v1.15.3（`node bin/spec-first.js --version`） |
| Node | v22.22.3 |
| Git | 2.54.0 (Apple Git-157) |
| Claude Code | 2.1.322 |

## 隔离布局

临时根：`/tmp/sup-phase5-20261112-101028`（不纳入仓库，验证结束后清理）

```text
/tmp/sup-phase5-20261112-101028/
├── repo/        # 临时仓库（mini-ledger 夹具，含 baseline commit 9a29966）
├── home/        # 临时 HOME（init 的全局写入落点，仅 .spec-first/.developer）
└── evidence/    # 哨兵、init 日志、生成物 manifest
```

- 临时仓库基线：从 `skills/spec-work/evals/fixtures/repos/mini-ledger-guarded2` 复制，移除 `prepare-eval.cjs`（评测专用），`git init` + 单 commit `9a29966 baseline mini-ledger`。
- 临时 HOME：`init -y` 因缺少 developer profile 无法确定姓名（退出码 2，日志已留存），改用 `-u phase5-eval` 显式传入；该姓名只写入临时 HOME，不触碰真实 `~/.spec-first/.developer`。

## 隔离初始化

```bash
cd /tmp/sup-phase5-20261112-101028/repo
HOME=/tmp/sup-phase5-20261112-101028/home \
  node /Users/kuang/xiaobu/spec-first/bin/spec-first.js init --claude -y -u phase5-eval
```

- 退出码：0
- 结果：`1/1` 宿主 projection 写入；Claude Code 17 commands、21 skills、hook 已更新；`.gitignore` managed block 更新；创建 `CHANGELOG.md`、`CLAUDE.md`
- 生成物：`.claude/` 共 637 个文件，7.6M；manifest `claude-manifest.sha256` 共 637 行，manifest 自身 SHA-256 `44fc172893b76d2ef5456e6cbd1d6fafecec2d3d2c4cb5968d0a9240535455f3`
- `.claude/settings.json` SHA-256：`46c6b2f3e373cbcbaaaed53f4d827729fed4519421de6d153380c0b83e35666d`（含 SessionStart / UserPromptExpansion / PreToolUse / Stop 四个 hook 段）
- 临时仓库 Git 状态：`.claude/`、`.gitignore`、`CHANGELOG.md`、`CLAUDE.md` 均为未跟踪（init 按合同不修改 Git index）

## 哨兵

哨兵脚本记录：`~/.claude/settings.json`、`~/.claude/settings.local.json`、`~/.claude.json` 的 SHA-256 与 mtime；`~/.spec-first` 下所有文件的逐文件 SHA-256。

| 面 | before | after | 判定 |
| --- | --- | --- | --- |
| `~/.claude/settings.json` | `49e66812…763a4` / mtime 09:42:37 / 9665B | 同上 | 未变化 |
| `~/.claude/settings.local.json` | absent | absent | 未变化 |
| `~/.spec-first/**`（5 个文件） | `2652abe…` 等 | 逐项相同 | 未变化 |
| `~/.claude.json` | `20512b7…` / mtime 10:10:29 | 未纳入比对 | observed：宿主自身会话状态，非 spec-first managed 面 |

比对命令：`diff -u sentinel-before.txt sentinel-after.txt` → 唯一差异是首行时间戳；exit 0。

## 会话配置（U18）

每个阶段独立 `claude -p` 会话，配置一致：

```bash
cd /tmp/sup-phase5-20261112-101028/repo
claude -p --no-session-persistence --setting-sources project \
  --strict-mcp-config \
  --permission-mode dontAsk \
  --allowedTools "Bash(git *),Bash(node *),Bash(npm *),Bash(ls *),Bash(cat *),Bash(rg *),Bash(find *),Bash(mkdir *),Bash(shasum *),Read,Write,Edit,Glob,Grep,Skill,TodoWrite" \
  --output-format stream-json --verbose "<stage prompt>"
```

- 未使用 `--dangerously-skip-permissions`：本轮没有 OS 级沙箱或专用账户，按 KTD11 改用 `dontAsk` + 命令 allowlist；未列入 allowlist 的工具会被自动拒绝，届时按权限失败记录，不做人工补写。
- 未授予 `Task`：无 worker dispatch 授权，专家/子代理只能 inline 降级。
- `--setting-sources project` + `--strict-mcp-config`：只加载临时仓库的 `.claude` 配置，不加载用户级设置与 MCP server。
- 会话使用真实 HOME 以保留 `claude` 认证；因此 `~/.claude.json` 等宿主状态变化归为 observed，spec-first managed 面（`~/.spec-first`、`~/.claude/settings.json`）由哨兵守护。

## 停止条件与限制

- 任一阶段：spec-first managed 全局面被写入、临时根之外出现本任务写入、或会话超时/权限失败 → 立即停止，保留已有产物，状态记 blocked/partial。
- 临时仓库不阻止读取临时根之外的文件；“cwd 在临时仓库”不等于 OS 级隔离。本轮隔离只覆盖写入面与配置加载面。
- 各阶段 prompt、输出、退出码与工具调用摘要写入同目录 `stage-*.jsonl`（归档时 gzip）／`stage-*.md`，由 U19 汇总。
