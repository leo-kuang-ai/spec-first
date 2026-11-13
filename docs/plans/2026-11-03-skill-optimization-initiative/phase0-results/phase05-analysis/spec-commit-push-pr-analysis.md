# Skill 深度分析报告：spec-commit-push-pr

**分析者**：全量自主优化执行者（GLM-5.3 @ zcode）
**分析日期**：2026-11-04
**源码范围**：SKILL.md（132 行）+ 6 references（754 行）
**基线**：S 系列 post-fix（S18 受控 push 合同修复在位，5 项测试，2026-11-02）；T06 audit 修复 spec-commit 提交边界（36d19d95，2026-09-18）

---

## Step 1: 源码结构与流程

```text
Mode detection（description-only / description-update / full；mode:pipeline 抑制交互）
  Step 1 分支与 PR 状态（context.md：探测、exit-code 解释、fork/detached-HEAD 陷阱）
  Step 2 约定推断（项目指令 → 近期提交 → Conventional Commits）
  Step 3 既有 PR 路由
  Step 4 分支/暂存/提交 🔴（禁止 git add -A/.；exact-path 排除；逻辑分组；index 隔离）
  Step 5 Push（推前重验 live 分支/remote/PR；本地成功≠推送成功）
  Step 6 PR 标题与正文（compose A-H + teaching/archive 规则）
  Step 7 创建/更新 PR（--body-file；读回验证）
  Step 8 报告（needs-human 残留原样回传；watch_handoff 事实性交接）
```

**授权边界（设计核心）**：internal-only helper；`workflow invocation does not authorize commit/push/PR`；commit_authorization 与 landing_authorization 必须由用户或可见上游 handoff 建立。

## Step 2: 设计意图与关键核查

1. **验证职责显式归上游**：commit-and-push.md:5「a green test suite ... is not authority」；本 skill 校验 git 状态（分支/remote/PR 身份、推送读回），**从不运行仓库测试/治理套件**（grep 证实：无 test-run/verif-suite 职责）。
2. 授权边界、exact-path 暂存纪律、watch_handoff 无新授权——与仓内 mutation-enforcement 合同一致，S18 修复后受控 push 合同完整。

## Step 3: Phase 0 归因验证

**Phase 0 证据（唯一实例）**：T01 FP-CICD-1——PR #57 首次 CI 误阻断（release continuity 检查硬编码 'OpenCode preview' vs brand.js 动态生成）→ 本地复现 → fix 提交 1bb558e0 + 新增正负例单测。返工 1 次，根因判 tooling（存量检查债）。

**验证结论：⚠️ 归因部分准确，链路补全**。完整链路：
1. plan 的 Verification Contract 显式延迟 release 治理（「后续如发布，另按 release 合同验包」）——但 CI（ai-dev-gate）在 PR 上强制执行；
2. **spec-plan 对账缺口 (b)**（Phase 0.5 已定位）：触碰 CHANGELOG/release 面文件却未把 release-governance 套件纳入计划命令——主修复点已由 spec-plan P0 方案覆盖；
3. spec-work 按 plan 命令执行（无独立发现职责——待 Explore 核查）；
4. 本 skill 提交/推送前**无「staged 文件 ↔ 仓库治理套件」对账**——CI 成为该缺口的最终兜底，代价是往返返工。

skill 归因维持非主因；新增发现：**本 skill 是该缺口链条上最后一个可拦截点，但按设计不做验证**。

## Step 4: 问题清单与方案

| # | 问题 | 分类 | 频率 | 证据 | 方案 |
|---|---|---|---|---|---|
| P-CPPR-1 | 提交/推送前无「staged 文件触碰 release 面（CHANGELOG/version/发布脚本）→ 确认治理套件已跑」的对账披露 | 合同缺口（advisory 级，非新验证门） | 1/9（11%） | T01 FP-CICD-1；grep 证实无此职责 | 方案见下 |
| P-CPPR-2 | 无（S18/T06 修复在位；其余面干净） | —— | —— | —— | 不修改 |

**P-CPPR-1 方案（advisory 披露，非门禁）**：在 commit-and-push.md 暂存段增加一条：staged 路径包含 CHANGELOG/版本/发布检查相关文件时，报告 `release_governance_status: confirmed-by-caller | unconfirmed`（从上游验证证据读取；不自行运行套件、不阻断、不扩大授权）。预期效果：CI 前最后时点的缺口可见性；与 spec-plan P0 修复构成纵深。投入 ~2h（prose + 若有合同测试同步）。**依赖说明**：主修复是 spec-plan P0（把治理命令放进计划）；本项为 defense-in-depth，若预算紧张可降级为 P2。

**评分预估**（阶段 2 正式计算）：frequency 5（1/9=11%）、severity 10（导致返工）、fixability 10（≤4h）、roi 6（窗口内 1 例 ≈1-2h 成本，30 任务/6 月外推 3-4 例；主修复已覆盖大部分，本项边际 ROI ≈1-1.5）→ score ≈ 7.6-8.0，**P1 边界**。

---

**结论**：skill 本体治理良好；唯一证据缺口是链条末端的 release 面对账披露（advisory 级），主修复点在 spec-plan（Phase 0.5 P0）。
