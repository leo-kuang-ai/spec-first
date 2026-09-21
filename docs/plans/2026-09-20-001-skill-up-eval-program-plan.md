# skill-up Skill 测评运行方案（周期机制 v2）

- **observed_at**: 2026-09-20 14:03 (Asia/Shanghai)；`source_head: 36d19d95`；`worktree_state: dirty`（未提交的周期 1 文档与本方案本身）
- **工具**: skill-up CLI v0.12.0（2026-09-20 确认为上游最新 release）
- **角色**: 项目负责人（`docs/10-prompt/项目负责人工作契约.md`）；本方案服务 P8「持续评测与复盘机制」的行为回归层

## 0. 结论先行

本仓库**不需要从零设计 skill 测评**。2026-08-30 ~ 09-04 全量轮已建立完整方法论（skill-up 双引擎 + darwin 9 维 rubric + paired ×3 盲评）并沉淀 37 个 skill × 132 case 的回归资产，14 个真实缺陷经该闭环修复（见 `docs/validation/skill-evals/2026-09-03-full-suite-summary.md`）。

当前真正的缺口是**机制缺口而非资产缺口**（对齐周期 1 计划 P8 判定「统一周期触发、结果汇总、反指标复盘和能力处置闭环尚未证实」）：

1. **新鲜度缺口**：存量绿灯证据停留在 2026-09-02（个别 skill 09-04）；此后 36/37 个 skill 的 SKILL.md 发生变更（主要为 09-15/16 FSA2/FSA3 修复批次），历史全绿**不可再外推到当前 source**。
2. **覆盖缺口**：`spec-worktree`（registry 38 包之一）无 skill-up eval 套件；3 个 skill（`spec-doc-review` / `spec-work` / `spec-write-tasks`）case 文件位于 `evals/skillup/cases/` 迁移残留路径，与其余 34 个的 `evals/cases/` 不一致。
3. **触发缺口**：skill 源码变更后无确定性触发的回归规则；无分层预算控制；红灯后处置路径未成文。

本方案把一次性全量战役升级为**四层分层运行机制（T0–T3）**：确定性校验零成本高频跑，行为回归按变更触发与风险分层放量，深度改进轮只对真实缺陷启用。

## 1. 现状基线（2026-09-20 实测）

| 事实 | 值 | 取证方式 |
|---|---|---|
| eval 配置有效性 | **37/37 通过**（`skill-up validate`，0 失败） | 本日全量实跑 |
| case 总量 | **132**（分布：spec-project-rules 10、spec-plan 9 … spec-compound-refresh 等 5 个仅 1） | validate 输出汇总 |
| judge 构成 | script 为主 + rule_based 约 30 例；**0 agent_judge**（符合 skill-upper 反滥用守则） | case 文件 grep |
| 引擎配置 | 37 个 eval.yaml 全部 `engine.name: claude_code` | eval.yaml grep |
| 无套件 skill | `spec-worktree`（darwin 结构分 93.0 存在，无行为回归） | 目录核查 |
| 最近运行 | 全量轮收口 2026-09-01；增量 2026-09-04（spec-debug / spec-simplify-code / spec-test-browser / spec-work） | workspace `result.json` mtime |
| 09-04 后 SKILL.md 变更 | **36/37**（FSA2 R-5~R-12、FSA3 修复批次等） | `git log --since=2026-09-04` |
| 本机引擎 | `claude` / `codex` / `qodercli` CLI 均在 PATH；无 API key env、无 `~/.skill-up/credentials.yaml` | `command -v` + env 探测 |
| 证据保留 | workspace 产物（`skills/*-workspace/`）不入 git；结论记账于 `docs/validation/skill-evals/`（37 份报告 + `results.tsv` 70 行循环日志） | `git ls-files` |

**含义**：存量资产可复用性完好（配置层零红），但行为层证据整体 stale；任何「当前版本已通过行为回归」的 claim 在补跑前**不成立**。

## 2. Goals / Non-goals

**Goals**

- G-1: 建立确定性的**触发规则**：skill 源码变更 → 必跑 T0；行为相关变更 → T1 受影响面回归。
- G-2: 建立分层预算模型，使回归成本与风险相称，避免「要么不跑、要么全量」的二元困境。
- G-3: 关闭结果**汇总与处置闭环**：绿灯记账、红灯进入定位→修复→回归流程，修复 SKILL.md 必须经 paired 盲评。
- G-4: 修复存量覆盖缺口（spec-worktree 套件、路径漂移），使 38/38 包处于同一机制之下。

**Non-goals**

- 不新建评测平台或中心化 runner（skill-up CLI + 既有 `results.tsv` / `_template.md` 记账已足够；对齐「宿主/工具已有则 Adopt」）。
- 不在本周期执行全量 T2/T3（周期 1 计划 §5 B3 明确「复用并核对协议，不跑全量」；全量行为重跑属下周期或 owner 显式授权）。
- 不测评 skill-up 之外的层（收益假设复核归 cycle-1 B3 的 benchmarks/field protocol 轨道；逐 skill 语义审查归审查方案 v2 U9 轨道）。
- 不把 eval 结果外推为 field outcome 或 runtime_cost 结论（见 §7）。

## 3. 四层运行模型

### T0 — 确定性配置校验（零成本，每次变更必跑）

```bash
# 逐 skill（脚本化见 §3.5）；预期每个输出 ✓ eval.yaml is valid (loaded N case(s))
for d in skills/*/evals/eval.yaml; do skill-up validate "$d"; done
```

- **触发**: 任何 `skills/**` 变更后；可挂入现有 `npm run lint:skill-entrypoints` 同级的检查习惯（是否固化为 npm script 由实施批次决定）。
- **证据级别**: E1（source/contract 静态事实）。
- **出口**: 配置红 = 阻断该 skill 的一切运行层 claim，修复前不得引用其历史绿灯。

### T1 — 变更触发单引擎回归（默认行为层）

```bash
skill-up run skills/<skill>/evals/eval.yaml            # 默认 claude_code，本机登录态
skill-up run skills/<skill>/evals/eval.yaml --include-case-name "<case>"   # 失败复跑/聚焦
```

- **触发**: 该 skill 的 `SKILL.md`、`references/**`、`scripts/**` 或 `evals/**` 自上次绿灯后发生变更；或消费的共享契约（`docs/contracts/**`、`skills/_shared/**`）变更且被该 skill 引用闭包覆盖。
- **范围**: 仅受影响 skill 的既有 case 全集；不扩散。
- **引擎**: claude_code 单引擎（本机登录态；模型随本机配置，如实记录）。
- **证据级别**: E2（源码行为，单引擎）。
- **出口**: 全绿 → 记账收口；红灯 → §5 处置流程。

### T2 — 双引擎交叉回归（发版 / 周期触发）

```bash
skill-up run skills/<skill>/evals/eval.yaml --engine codex   # 第二引擎交叉
```

- **触发**: npm 发布前；或 T1 出现「修复后复跑」的 skill；或距上次双引擎绿灯超过一个评审周期（建议 4 周，随周期计划定档）。
- **范围**: 按风险分波（见 §6 批次），不要求一次全量 37 skill。
- **降级**: codex 429 限流时按 `_template.md` 经验记录降级（claude_code 先行、配额恢复补跑），不得静默省略第二引擎。
- **证据级别**: E2（双引擎交叉，语义覆盖强于单引擎）。

### T3 — 深度改进轮（仅缺陷/新 skill 启用）

- **触发**: T1/T2 暴露疑似真实行为缺陷；或新 skill 首评；或 owner 点名的深度审查。
- **组成**: darwin 9 维 rubric 结构评估 + 双引擎行为实测 + （若修改 SKILL.md）paired ×3 独立 judge 盲评 + 修复后回归。
- **纪律**: 全量轮已验证的流程与守则直接继承（`2026-09-03-full-suite-summary.md` §三 九条守则 + `_template.md` 七条断言经验）；改进决策 keep/revert 由 paired 盲评裁决，不由作者自评。
- **证据级别**: E2 + 结构评估；仍不外推 field。

### 3.5 职责分工（script-owned vs LLM-owned）

| 层 | 脚本/CLI 拥有 | LLM 拥有 |
|---|---|---|
| T0 | validate 退出码、case 计数 | 无（确定性） |
| T1/T2 | 运行、result.json、grading.json、耗时 | 红灯分型（eval 断言问题 vs skill 真实缺陷）、失败证据解读 |
| T3 | — | 9 维评分、case 设计、paired 盲评、keep/revert 建议 |
| 记账 | 时间戳、commit、分数、状态列 | 发现描述、处置决策、结论 |

T0/T1 的「跑与不跑」是确定性规则（§4 触发表）；红灯后的「是不是缺陷、怎么修」是语义判断。

## 4. 触发与记账规则

### 触发判定（确定性）

| 变更面 | 必跑 | 记账 |
|---|---|---|
| `skills/<s>/evals/**` | T0 + T1（该 skill） | results.tsv 加 regression 行 |
| `skills/<s>/{SKILL.md,references/**,scripts/**}` | T0（全量，防共享面回归）+ T1（该 skill） | 同上 |
| `docs/contracts/**`、`skills/_shared/**` 被引用闭包覆盖 | T0 + T1（引用方 skill 集） | 触发原因写明闭包依据 |
| 无 skill 面变更的 docs-only | 无 | — |

### 记账格式（续用 `results.tsv`，列已兼容）

```text
<timestamp>\t<commit>\t<skill>\t<old_score>-\t<status>\t<dim>\t<note>\t<eval_mode>
# status 取值沿用既有词表：baseline / pass / regression / keep / cross-engine
# regression 行 note 必须含：engine、iteration 号、失败 case、分型结论（eval-fix vs skill-defect）
```

### 新鲜度声明（每 skill 一行，随回归更新）

```yaml
# eval-freshness（建议随 results.tsv 维护或在各 skill 报告头部）
skill: <name>
last_green: { engine: claude_code, at: 2026-09-20T14:00+08:00, source_head: <commit> }
current_head: <commit>
drift: clean | changed(untested) | red
```

**规则**：`drift: changed(untested)` 的 skill 不得在文档或对外 claim 中引用历史绿灯作为当前行为证据（对齐角色契约「信任只覆盖证据直接支持的 claim」）。

## 5. 红灯处置闭环

```text
T1/T2 红灯
  ├─ 分型 A：eval 断言问题（环境盲区/语言假设/词表长尾）
  │    → 修 case（保留核心不变量断言，不得为绿灯弱化——_template.md 第 5 条）
  │    → 复跑至绿，记 eval-fix
  ├─ 分型 B：skill 真实行为缺陷
  │    → 进入 T3：定位 → 修 SKILL.md（最小 diff）
  │    → paired ×3 独立 judge 盲评（3-0 keep 才保留；全量轮 13 轮先例）
  │    → 失败 case 复跑 + 全 case 回归 + 双引擎交叉（codex 补测）
  │    → runtime MIRROR-SYNCED（bin/spec-first.js init）+ CHANGELOG
  └─ 分型 C：环境阻塞（配额/凭据/沙箱）
       → 记 blocked + reason code，不冒充失败也不冒充通过；条件恢复后补跑
```

**修复纪律**（继承全量轮实证守则，写入本方案以脱离对历史报告的依赖）：路由修复须双层落点（合同摘要 + 执行 Phase 入口）；排除语义自带路由目的地；用户施压不是写权限；副作用断言锚文件系统而非输出措辞。

## 6. 首批落地批次（设计即预算；执行状态如实标注）

| 批次 | 内容 | 预算 | 状态 |
|---|---|---|---|
| **P-A 确定性收口** | ① T0 全量 38 包 ② 统一 3 个漂移路径 `evals/skillup/cases/` → `evals/cases/` ③ 补 `spec-worktree` 最小套件（2 case：detect-first 创建链+主 checkout 不动锚；非 git 目录 fail-closed） | — | **①②③ done（2026-09-21：路径统一 0 残留、worktree 套件 2/2 PASS it-2，暴露 script unborn 处理缺口 2 条新发现入报告）** |
| **P-B T1 回归 pilot** | 7 个高风险 skill 单引擎回归：审查方案 v2 Batch A 五 gate/readiness owner（`spec-work` 7 case、`spec-code-review` 4、`spec-runtime-setup` 2、`spec-compound` 2、`spec-handoff` 1）+ FSA3 修复直接涉及（`spec-commit` 2、`autoresearch` 3）= 21 case | ~21 case × 1–8min ≈ **0.5–2h** 本机 claude 登录态 | designed-not-run |
| **P-C 长尾分波 T1/T2** | 其余 30 skill 按 C1（mutation/外部副作用：commit-push-pr、dogfood、test-browser、project-rules、app-consistency-audit、sweep）→ Batch B 核心 workflow → C2 低频 standalone 顺序分波；双引擎交叉仅对 P-B/P-C 红灯修复项与发布面启用 | 每波 1–3h；全量 132 case 单引擎粗估 4–8h，双引擎翻倍 | designed-not-run；**对齐周期 1「不跑全量」，执行需下周期排期或 owner 显式授权** |
| **P-D 机制固化** | 触发表（§4）与新鲜度声明并入 `docs/validation/skill-evals/README.md`；T0 是否固化为 npm script / git hook 由 P-A②③ 完成后按 80/20 裁决 | 0.5h 文档 | designed-not-run |

**执行前置条件**：P-B/P-C 需本机 `claude` CLI 登录态可用（当前无 API key env，走 CLI 登录态路径，与全量轮一致）；发布类 skill（spec-commit 等）case 已按 `_template.md` eval 安全守则设计（无发布动词、副作用锚文件系统），复跑前抽查确认。

## 7. 证据边界与 claim ceiling

| 层 | 证据范围（契约 §6.1） | 可以 claim | 不可以 claim |
|---|---|---|---|
| T0 | E1 | 「配置有效、N case 可加载」 | 任何行为或价值结论 |
| T1 | E2 单引擎 | 「该 skill 在 X 引擎下对既有 case 行为符合预期」 | 跨引擎一致、真实任务质量 |
| T2 | E2 双引擎 | 「双引擎下行为符合预期」（语义覆盖增强） | field outcome、runtime_cost 收益 |
| T3 | E2 + 结构评估 | 「缺陷已修复且经独立盲评 keep」 | 业界领先、用户提效 |

全量轮的结构性残留（同形输入边界的近邻路由不稳定，lfg/audit/dogfood/rule-miner/pov 带条件通过）**继续有效**：文本层修复已达瓶颈的判断不因本方案改变，上游路由（using-spec-first 入口层）仍是正确解法；这些 skill 的回归 case 保留原断言强度。

## 8. Risks / anti-patterns

- **为绿灯弱化断言**：修 case 只允许修环境盲区与语言假设，核心不变量（正确目标、错误目标排除、副作用边界）必须保留——分型 A 的边界由 paired 或人工复核把关。
- **历史绿灯外推**：36/37 skill 处于 `changed(untested)`，在 P-B/P-C 完成前引用 09-02 绿灯支持当前 source 的 claim 即违规。
- **发布类 eval 安全**：复用全量轮 spec-lfg 教训——prompt 禁发布动词、沙箱可能继承宿主 gh/git 登录态、对抗样本一次性使用后移出回归集。
- **配额与限流**：codex 429 降级必须记录并补跑，不得静默单引擎收口。
- **workspace 膨胀**：`*-workspace/` 不入 git（维持现状）；收敛时按 iteration 保留最新 + 关键失败轮，其余可清理，结论以 results.tsv + 报告为准。
- **过度机制化**：不建 dashboard、不建中心化状态机；触发表是响亮约定（loud convention）而非硬 gate——在缺 runtime 强制能力时显式声明未强制（对齐 AGENTS.md gate 降级纪律）。

## 9. 与其他轨道的关系

| 轨道 | 层 | 关系 |
|---|---|---|
| cycle-1 B3（benchmarks/agentic + CE field protocol） | 收益假设 / field | 互补：本方案管行为回归，B3 管相对收益与现场；共享「证据分层 + 不外推」纪律 |
| 审查方案 v2 U9（逐 skill receipt） | 语义审查 | 本方案 T1/T2 产物（result.json、分型结论）可作为 U9 行为证据输入；U9 不依赖本方案 |
| `spec-optimize` measurement-admission | 度量准入 | 本方案不涉及收益 metric 准入，避免重叠 |

## 10. 已执行验证 / 未执行声明

**已执行（2026-09-20，本方案写作过程）**：skill-up v0.12.0 与上游最新一致；T0 全量 validate 37/37 通过（132 case 计数与 FSA2 F-6 存档一致）；spec-worktree 无套件、3 skill 路径漂移、36/37 skill 09-04 后变更、最近运行时间分布、引擎与凭据可用性均实测取证（§1 表）。

**未执行**：任何 T1/T2/T3 模型运行；spec-worktree 套件补建与路径统一（P-A ②③，涉及 skills/ 源面变更，按批次执行）；npm script / hook 固化（P-D）。本方案是机制设计 + 现状基线，不构成任何 skill 当前版本的行为通过声明。
