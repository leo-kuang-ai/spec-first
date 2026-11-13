# r2 记录：S06 work × GLM 配对无效（B 组环境污染）

日期：2026-11-02。机器可读指标：[r2-observations-work-glm.json](r2-observations-work-glm.json)。环境合同：[environment-contract-r2.md](environment-contract-r2.md)。

## 有效性判定

| 核验项 | A（with_skill） | B（without_skill） |
|---|---|---|
| 判定 | **有效 A 样本**（保留，带环境 caveat） | **无效**——读取了目标 Skill |
| Skill 加载 | 原生 `Skill(spec-work, mode:return-to-caller ...)` 调用 + 挂载版 `.claude/skills/spec-work/` 下 10 个 reference 文件读取 + md5 校验回读；全局 skill 副本读取 0 次 | 无挂载；但按序搜索自有 workspace → `$HOME/.claude` → `which`/`npm ls -g` → `npm root -g`，**找到并读取全局安装的 `skills/spec-work/SKILL.md` 与 6 个 references**，随后调用全局 `spec-first` CLI 并照 Skill 产出 `.spec-first/` 收尾证据 |
| 业务结果（污染下记录，不作基线） | oracle 5/5、回归 11/11 | oracle 5/5、回归 11/11（已被 Skill 内容影响，不能当 B 基线） |
| 成本 | input 62,241 / output 22,096 / cache_read 1,239,424；455.4s；47 次工具调用 | input 57,802 / output 20,468 / cache_read 1,362,688；451.6s；53 次工具调用 |
| 全局 CLI 调用 | 有（`spec-first internal verification-*`、`honest-closeout validate`）——按环境合同记录，不作为加载证据 | 有（同上，且直接源于污染） |

## 污染机理与修复

- 根因：宿主全局安装 `/opt/homebrew/lib/node_modules/spec-first` 内嵌 `skills/spec-work`（SKILL.md 与被审基线逐字节一致），对有文件系统访问能力的引擎可见；GLM 的 B 组依提示词"若当前环境安装了 spec-work"系统性搜索并自取。Codex 的 B 组只检查 fixture 内 `.codex/skills`（其 skill 发现约定），未外搜——引擎间行为差异，不改变判据。
- B 的搜索路径清单（trace 实证）：自有 workspace、`$HOME/.claude/{skills,plugins}`、`which spec-work`、`npm ls -g`、`npm root -g` 子树（maxdepth 3）；未观察到全盘 `find /` 或跨 workspace 的 `/private/var/folders` 搜索。
- 修复（r3）：将全局安装包目录与 `/opt/homebrew/bin/spec-first` 符号链接整体移出上述搜索路径（移至 `~/.batch5-stash/`，先写恢复脚本），三对剩余运行（S06 GLM 重跑、S07 两对）统一在隐藏环境下执行，保持组内环境一致；运行后立即恢复并验证。此为宿主可逆临时变更，已记录窗口与恢复命令；不改被审 source、不改 fixture/oracle/判据。
- 残余风险（记录）：若 B 改用全盘 find，仍可能命中 A 腿遗留的临时 workspace 挂载副本；r2 未观察到该行为模式，若 r3 再污染则如实记无效并停止该方向，不追加无意义重试。

## 台账口径

消耗 2 次（第 7、8 次），其中 B 为无效样本计入 24 次上限、不另开免费额度（README 判读边界）。A 样本保留为"带全局 CLI caveat 的有效 A"；S06 GLM 有效配对以 r3 为准。
