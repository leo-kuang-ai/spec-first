# 第五批恢复运行（r2）环境合同记录

日期：2026-11-02。resume owner 在用户"自主推进"授权下记录。本文件只记录静态环境事实；逐次运行的模型/effort/token 见台账与 observations。

## 两组共同环境（每引擎内 A/B 一致）

- 隔离 wrapper：`_shared/isolated-run.sh`，HOME 指向全新隔离目录；PATH 原样传递（全局 CLI 对两组同样可见）；codex 侧只写裁剪 config.toml（model/model_provider/model_reasoning_effort/custom provider），claude_code 侧只注入 ANTHROPIC_* 与 CLAUDE_CODE_SUBAGENT_MODEL。
- staging：`/private/tmp/spec-first-review-batch5-20261102-v2`（stage.py 生成，validate 通过；r2 前重新 validate 四份配置均 ✓）。fixture 带真实 initial commit，运行后须核验 workspace HEAD 与 dirty diff。
- A 组挂载 Skill 来自仓库路径 `skills/spec-work`、`skills/spec-code-review`，与被审基线 `049e52744` 内容一致（HEAD `1aa272a60` 下 `skills/ src/ templates/` 相对其无 diff，resume 时复核）。冻结判据规定：只有读取挂载版 SKILL.md 及其引用才算 A 组加载；读全局安装目录不算。

## 全局安装 spec-first（两组均可用，须逐次记录是否被调用）

- 路径 `/opt/homebrew/bin/spec-first` → `/opt/homebrew/lib/node_modules/spec-first`，npm 安装 1.15.3（与仓库 package.json 同版本号但为发布版）。bin sha256 前缀 `fff16c394ce33df0`。
- 与仓库内容差异：`src` 8 项、`skills` 411 项、`templates`/`bin` 0 项（diff -rq 计数）。
- 关键身份核对：`skills/spec-work/SKILL.md`、`skills/spec-code-review/SKILL.md`、`skills/spec-work/scripts/`（含 working-tree-fingerprint.cjs）与仓库**逐字节一致**；差异集中在各 skill 的 `evals/` 资产与 spec-code-review 的部分 `references/`（约 26–27 项）。
- 结论：模型若调用全局 CLI，其 CLI 行为与 closeout 脚本语义与被审基线一致或近一致，但**不等于读取被审源码**；此类调用逐次记录，不作为 A 组 Skill 加载证据。原 GLM A（尝试4）属于此类，其收尾证据不能与 Codex A（沙箱内未调用）作因果比较——r2 通过每配置整跑 A/B 两腿消除该混叠。

## 引擎差异（不构成 A/B 内混叠，跨引擎不直接对比）

- codex 0.166.0：`--sandbox workspace-write`、工具网络关闭、approval never（rollout turn_context 实证）；模型 API 连接由 CLI 进程自身发出，不经工具沙箱。首次尝试的 DNS 失败是宿主平台联网权限问题，非沙箱配置差异；r2 启动前 qianxing.pro 与 open.bigmodel.cn 均 HTTPS 可达（http 200）。
- claude_code 2.1.311：skill-up 不加沙箱，工具可全网络与全盘（GLM A 曾调用全局 CLI 即证）；配置 glm-5.3[1M]。两腿同样无沙箱。
- 预算口径：r2 计划 4 配置 × 2 腿 = 8 次主模型运行（已批准 24 次中已耗 4，余 20 → r2 后余 12）；12M token 观测上限继续累计核查。

## 失效条件

上述任一身份/版本/可达性事实变化（全局 CLI 升级、staging 重建、fixture/SKILL hash 变化、provider 不可达）须重新记录组合后再跑；不能以本记录替代逐次运行核验。
