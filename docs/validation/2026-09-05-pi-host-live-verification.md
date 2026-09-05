# pi Host Live Verification — Skills Discovery & Trust Gate（2026-09-05）

- **验证对象：** pi（`@earendil-works/pi-coding-agent` 0.85.0，macOS arm64，`/opt/homebrew/bin/pi`）
- **计划：** `docs/plans/2026-09-04-002-feat-pi-host-support-plan.md` U4
- **验证环境：** 一次性 sandbox git 仓库 `/tmp/pi-live-verify-ar5O`（`spec-first init --pi -y -u pitest --lang en --no-sync-user-language`，38 skills 投影至 `.agents/skills/`）
- **方法：** `pi --mode rpc --no-session [-a]`，通过 RPC `get_commands` 列出已注册命令（无需模型调用）；对照三种运行形态。
- **驱动脚本：** `/tmp/pi-rpc-verify.cjs`（本机临时件，逻辑内联记录于下，不随仓库分发）

## 结论

| 验证项 | 结果 | 证据 |
| --- | --- | --- |
| 项目 skills 发现（共享投影） | **live 通过** | `-a` 下 `get_commands` 返回 84 个 skill 命令 = 46 全局（`~/.agents/skills/`）+ **38 项目级**（路径逐一指向 `<sandbox>/.agents/skills/<name>/SKILL.md`，`sourceInfo.scope: "project"`）；`skill:spec-work`、`skill:using-spec-first` 均在场 |
| 上溯发现（cwd → git 根） | **live 通过** | 从嵌套子目录 `packages/api/` 启动同样返回 84 skills，项目级路径仍解析到仓库根的 `.agents/skills/` |
| trust 门控 | **live 通过** | 无信任（默认，非 TTY）：仅 46 全局 skills，**项目 38 个完全缺席**（`skill:spec-work` 不存在）；`-a`（--approve）：恰好解锁 38 个项目 skills。门控语义与官方文档逐条一致 |
| `/skill:` 命令注册面 | **live 通过（结构面）** | 全部 38 个 skills 以 `skill:<name>` 形式注册为可调用命令（`get_commands` 的 `source: "skill"` 条目） |
| `/skill:` 模型中介调用 | **未执行** | 验证环境无任何 provider 凭据（`pi -p` 报 `No API key found`；环境变量与 `~/.pi/agent/auth.json` 均空） |
| AGENTS.md 注入 | **docs-verified（未 live）** | 注入只在模型中介会话中物化（system prompt / session transcript），无凭据不可观测；0.85.0 本地文档确认发现语义与 `--no-context-files` 开关 |
| 同名遮蔽方向 | 无冲突可观测 | 本机全局 `~/.agents/skills/`（46 个，如 agent-browser、ast-grep）与 spec-* 项目 skills 无同名交集；全局先于项目的加载顺序维持文档推断 |

## 关键命令与输出摘录

```text
$ pi --version
0.85.0

# A) 无信任（默认）——项目 skills 被门控
$ node /tmp/pi-rpc-verify.cjs /tmp/pi-live-verify-ar5O
total_commands=47 skills=46
agents_skills_projection_entries=46   # 全部指向 ~/.agents/skills/
skill:spec-work present=false

# B1) -a 信任（仓库根启动）
$ node /tmp/pi-rpc-verify.cjs /tmp/pi-live-verify-ar5O -a
total_commands=85 skills=84
skill:spec-work present=true path=/private/tmp/pi-live-verify-ar5O/.agents/skills/spec-work/SKILL.md
skill:using-spec-first present=true path=/private/tmp/pi-live-verify-ar5O/.agents/skills/using-spec-first/SKILL.md
# 84 - 46 = 38 == spec-first init --pi 投影数

# B2) -a 信任（嵌套子目录 packages/api 启动）→ 同样 84，路径仍指向仓库根投影
```

`get_commands` 原始响应样例（节选）：

```json
{"name":"skill:autoresearch","source":"skill","sourceInfo":{
  "path":"/private/tmp/pi-live-verify-ar5O/.agents/skills/autoresearch/SKILL.md",
  "source":"auto","scope":"project","origin":"top-level",
  "baseDir":"/private/tmp/pi-live-verify-ar5O/.agents"}}
```

## 安装方式与版本锚定

- 安装：`npm install -g --ignore-scripts @earendil-works/pi-coding-agent`（计划 U4 授权的系统级变更，验证环境执行）
- 版本：0.85.0；文档核验源为该版本包内 `docs/skills.md`（发现来源清单、SKILL.md 目录递归发现、trust 门控、遮蔽顺序）与 `docs/rpc.md`（get_commands 协议）
- 已知包面现象：包根 `require()` 会经静态导入链拉到未声明的 `@earendil-works/pi-server` 而失败；CLI 主路径（`pi`/RPC）不受影响

## 证据等级决定（KTD6 演进）

- `supportState`：**维持 `preview`**——模型中介的 `/skill:` 调用与 AGENTS.md 注入未 live 验证（沿用 zcode 先例：live 发现证据 + 保持 preview）
- `evidenceClaim`：`pi_official_docs_verified` → **`skills_discovery_and_trust_live_verified`**
- `testedVersions`：`[]` → **`['0.85.0']`**（doctor `loader_evidence` 随之翻真，与「loader 已被真实执行」一致）
- 升级 `active` 的剩余条件：在具备 provider 凭据的环境完成一次真实 `/skill:<name>` 调用并观测 AGENTS.md 注入

## 失效条件

pi 重大版本变更或 skills 发现/trust 语义变更时重评（计划 Evidence & Limitations 同款 invalidation condition）。
