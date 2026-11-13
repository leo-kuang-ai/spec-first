# Skill 深度分析报告：spec-code-review

**分析者**：全量自主优化执行者（GLM-5.3 @ zcode）
**分析日期**：2026-11-04
**源码范围**：SKILL.md（76 行）+ 13 references + personas（1798 行）
**方法**：核心合同文件全文阅读 + 独立只读探查 agent 全量清点（关键行已抽查核实）+ Phase 0 归因对照
**基线**：S 系列 post-fix（S07 修复在位，84 项测试；行为 A/B 检出饱和 3/3 双组、无误报，2026-11-02）

---

## Step 1: 源码结构与验证门

```text
modes（default/agent；report-only 默认，agent 永不变异）
  → scope/diff-scope（task-context 校验、per-file provenance、快照冻结、空 diff 早退）
  → select-and-route（lite-roster 全条件门、silent-pass 对抗镜头、persona 条件选择）
  → dispatch-reviewers（fast-pass 锚点封顶、75/100 first_evidence 强制、跨模型 fail-closed）
  → finish-review（quote-the-line 门、置信门、验证预算、Requirements Completeness、Quality Gates 六条、verdict 规则）
  → Stage 5c apply（三条件准入；apply 后跑受影响测试；不授权 commit）
```

## Step 2: 设计意图

- 检测 owner（不是验证执行 owner）：command evidence 只记 review 自己跑过的命令（finish-review.md:122），「诚实的 not-produced 不是失败」（:124）——与 spec-work 的 closeout 链分工明确，review 不复跑 plan 验证。
- S 系列行为评测证明检出能力饱和；本 skill 的核心质量有实证。

## Step 3: 对账类缺口核查（全量 grep + 人工核读）

| 对账义务 | 状态 | 证据 |
|---|---|---|
| plan R-ID/U-ID ↔ diff 存在性 | **存在且强** | finish-review.md:199-202 checklist（met/not addressed/partially addressed）+ :209 verdict 规则（explicit plan 未覆盖 → Not ready） |
| (a) DoD/验收条件逐项 ↔ 交付 | 缺失（DoD 0 命中） | 仅 R/U 级；DoD 全 skill 0 命中 |
| (b) plan test-scenarios ↔ diff 中新增/修改的测试代码 | **缺失（0 命中）** | testing_gaps 来自 reviewer 输出，不对账 plan scenarios |
| (c) 触碰文件 ↔ repo 合同测试是否已跑 | **缺失（0 命中）** | contract test/entry-governance/byte-budget/projection 全 0 |
| (d) 复核 plan Verification Contract 命令已跑 | 缺失（by-design） | :124 明示诚实缺位合法；验证执行归 spec-work closeout 链 |

## Step 4: Phase 0 归因验证

- Phase 0 中 review 阶段整体表现强（T01 独立 reviewer 捕获 1 P2、三专家捕获 2 回归；T10 三 reviewer 阻断未就绪方案）——无归因修正。
- **T01 双回归时序补全**：独立 reviewer（27 文件）未捕获字节预算回归 → 三专家全量运行才捕获。若 reviewer 有 (c) 类披露义务（「diff 触碰 SKILL.md → 核对 byte-budget 合同套件是否在已跑清单，未跑则记入 coverage 限制」），回归可提前一轮。但这是效率问题非能力问题（检出饱和实证在案）。

## Step 5: 问题清单与方案

| # | 问题 | 分类 | 频率 | 方案 | 投入 | 预期 |
|---|---|---|---|---|---|---|
| P-CR-1 | coverage 无「管辖触碰文件的 repo 合同套件是否已跑」披露 | 合同缺口（披露级，非门禁） | 2/9 | finish-review Coverage 段（第 10 节）增一行：diff 触碰文件按 tests/ 反查存在管辖合同套件时，记录其已跑/未跑状态；未跑记为 coverage 限制（不改 verdict 规则、不复跑命令） | ~1.5h | T01 类回归提前一轮暴露；与 P-WORK-1 同类纵深 |
| P-CR-2 | (b) test-scenario↔测试代码对账缺失 | 观察 | 0/9 实例 | 不修改（ROI<1，Rule 1 跳过） | —— | —— |
| P-CR-3 | (a) DoD 逐项对账缺失 | 观察 | 0/9 实例（R/U 级已覆盖主风险） | 不修改（ROI<1） | —— | —— |

**与 settled decision 相容性**：P-CR-1 为披露级（不新增门禁、不动 verdict、不删证据出口）；检测能力面不动（行为饱和实证在案）。
