# Skill 深度分析报告：spec-work

**分析者**：全量自主优化执行者（GLM-5.3 @ zcode）
**分析日期**：2026-11-04
**源码范围**：SKILL.md（126 行）+ 14 references（1747 行）+ agents/
**方法**：核心合同文件全文阅读 + 独立只读探查 agent 全量清点（已抽查核实关键行）+ Phase 0 归因对照
**基线**：S 系列 post-fix（S06 F-S06-01/02 修复在位，61 项测试；行为 A/B 两模型 n=2 饱和无差异，2026-11-02）

---

## Step 1: 源码结构与验证门

```text
intake（input-triage/work-intake：metadata→Goal Capsule→Verification Contract→DoD→U-ID 定向读）
  → execution loop（scope/dirty 事实捕获 → 实现前 Test Discovery → 单元执行 → task-review 门）
  → review-followup（两轮上限；eligibility 仅按 JSON 字段）
  → shipping（Required-Proof Reconciliation → check 选择 → Final Validation → Quality Checklist）
  → closeout（verification-run-summary + honest-closeout；plan-status complete 是唯一 lifecycle 写点）
```

**强门已存在**：Required-Proof Reconciliation（shipping-workflow.md:30-34，required intent→result 语义对账，遗漏即阻断）；「planned command 非 run evidence」（:54）；closeout 顺序门（SKILL.md:28，failed verification 是唯一脚本强制 exit）。

## Step 2: 设计意图

- 验证执行 owner：按 plan Verification Contract 执行并对账 proof intent；check 选择输入含「changed surface」（L54）但不枚举类别。
- Workers never commit；dirty 保护纪律完备（不触碰/不暂存他人未提交工作）。
- worktree 隔离为条件触发（dispatch/isolation 需要），「Ordinary inline work does not require a new worktree」（execution-strategy.md:50）。

## Step 3: 对账类缺口核查（Phase 0.5 镜头，全量 grep + 人工核读）

| 对账义务 | 状态 | 证据 |
|---|---|---|
| (a) 触碰文件 ↔ plan 命令覆盖 | **缺失** | 「Implementation Commands」全 skill 0 命中；最近邻是 intent→result 对账（方向相反）与 changed-surface 提示（无类别） |
| (b) 按断言目标发现既有合同测试 | **部分存在，类别缺失** | Test Discovery 三步（feedback-and-tests.md:100-102：plan 声明→import/引用/命名→跨层 contract/smoke）；**无「按断言的目标路径反查测试」（grep 触碰路径出现在哪些测试中）类别**；entry-governance/byte-budget/projection 0 命中 |
| (c) 逐项 DoD 对账 | 仅 goal 路径有 | execution-engines.md:82（goal 引擎逐行 DoD）；inline loop 与 shipping 只有 task-complete + Requirements 级检查 |
| (d) 无关 dirty 工作区 → 隔离建议 | **缺失** | 仅保护性纪律（execution-strategy.md:40-44 等 6 处）；无「存在无关 dirty 且需干净验证/提交时提示 spec-worktree 选项」 |
| (e) CHANGELOG/version 触碰 → release 治理 | **缺失** | 0 命中；changelog 仅出现在 carve-out 与 mutation-scope 列表 |

## Step 4: Phase 0 归因验证

1. **T01 FP-VAL-2（2 断言回归，字节预算）**：⚠️ 归因维持（skill+model 各半），机制补全——Test Discovery 第 2 步按 import/命名找测试，抓不到「按字节断言 SKILL.md 的合同测试」（无 import 关系）；plan 命令也不含它（spec-plan 缺口）。**双重缺口实证**。
2. **T04 S20 入口体积回归**（23f4dffe 补修）：同类实例——字节预算合同回归靠事后发现。频率合计 2/9。
3. **T05 FP-T05-1（工作区并行争用，P1）**：⚠️ 部分修正——原判 external 主维持，但 skill 侧缺口 (d) 成立：保护纪律防止误暂存，却从不提示隔离选项（spec-worktree 存在且为内部 helper）；「ordinary inline work 不需要 worktree」对单任务成立，对「checkout 已有他人未提交工作」场景没有出口指引。skill 辅因从「轻」上调为「中」。
4. T01/T10 的 spec-work 执行面本身干净（无归因修正）。

## Step 5: 问题清单与方案

| # | 问题 | 分类 | 频率 | 方案 | 投入 | 预期 |
|---|---|---|---|---|---|---|
| P-WORK-1 | Test Discovery 缺「按断言目标反查」类别：对 touched paths 在 tests/ 内 grep 反查管辖测试（含 prose 合同测试），命中的套件纳入 check 选择 | 合同缺口（确定性可描述） | 2/9 | feedback-and-tests.md Test Discovery 增第 2.5 步 + shipping L54 check 选择补类别 | ~2h | T01/T04 类回归在执行期被捕获，不再靠专家全量/CI 兜底 |
| P-WORK-2 | shipping check 选择无「release 面文件 → release-governance 套件」类别 | 合同缺口（轻） | 1/9 | shipping-workflow.md L54 补一句类别枚举 | ~1h | FP-CICD-1 类 CI 误阻断在本地提前发现 |
| P-WORK-3 | 无关 dirty 工作区无隔离选项提示 | 合同缺口（advisory） | 2/9 | execution-strategy.md/workspace-setup.md 增 advisory：检测到非本任务 dirty 且需干净验证或分批提交时，提示 spec-worktree 选项与不隔离的风险（不强制、不自动创建） | ~1.5h | M1 类争用显性化，owner 可选择隔离 |
| P-WORK-4 | inline loop 无逐项 DoD 对账（仅 goal 路径有） | 观察 | 0/9 实例 | 不修改（ROI<1，Rule 1 跳过；goal 路径已有覆盖） | —— | —— |

**与 settled decision 相容性**：三项均为窄类别枚举/advisory 提示，非通用框架、不删证据出口。P-WORK-1 与 spec-plan P0 构成同缺口的双侧修复（plan 侧生成命令、work 侧独立反查兜底，覆盖 bare-prompt 与手写 plan 路径）。
