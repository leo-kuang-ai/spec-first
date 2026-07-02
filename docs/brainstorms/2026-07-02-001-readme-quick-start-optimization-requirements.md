---
date: 2026-07-02
topic: readme-quick-start-optimization
spec_id: 2026-07-02-001-readme-quick-start-optimization
---

# README 快速上手优化

## 摘要

优化 `README.md` 结构与内容，将"读到 README → 成功运行第一个 workflow → 验证 repo 下产物"这条路径压缩到最短：价值前置、Quickstart 直达、深度内容后置。保持全部测试硬约束字符串和链接格式不变。

---

## Problem Frame

当前 README 信息完整，但对首次接触的用户而言认知负担偏重：进入 Quickstart 前需要经过概念图说明、问题陈述、价值对比表等多个章节。用户在决定"要不要试"之前看到了大量"为什么"，而真正的"怎么做 + 5 分钟验证成功"路径藏在这些背景内容之后。

目标是让首次接触的用户更快完成第一次闭环（安装 → init → 运行 workflow → 看到产物文件），其余架构/治理内容保留给已经跑通后想深入的用户。

---

## Actors

- A1. **首次评估用户** — 刚看到 README，还未决定是否安装，需要在首屏判断"这值不值得试"
- A2. **新用户** — 已决定试用，按照 Quickstart 执行到第一次成功

---

## Requirements

**首屏价值**

- R1. 首屏（首次滚动前可见区域）必须包含：spec-first 是什么、它解决什么具体问题、以及一个成功场景的具体描述
- R2. 首屏的成功场景描述必须是可验证的具体结果（例如 repo 下出现的文件路径），而非纯抽象价值主张

**Quickstart 路径**

- R3. Quickstart 章节必须出现在"The Problem"和"Why spec-first"等背景章节**之前**，紧接首屏内容
- R4. Quickstart 步骤必须是线性无歧义的完整路径：安装 → `spec-first doctor` → `spec-first init` → 重启 host → 运行推荐 workflow → 验证产物
- R5. 每个关键 Quickstart 步骤必须跟随"期望看到什么"的成功标志描述
- R6. Quickstart 必须推荐一个具体的"第一个 workflow"（不让用户自选），推荐 `/spec:brainstorm` 或 `$spec-brainstorm`
- R7. Quickstart 结尾必须明确说明第一次成功的验证方式（在 repo 下检查具体产物路径）

**深度内容后置**

- R8. "Operating Model"、"Trust Model"、"Use spec-first when" 等架构/治理章节必须位于 Quickstart 和首次成功路径之后
- R9. "Workflow Entry Points" 完整入口表格保留，但在 Quickstart 附近需有一个精简的"首次推荐"引导，不强迫用户在 18 个入口中自选

**测试约束合规**

- R10. 必须保留以下硬约束字符串（测试依赖）：
  - `What is excluded from ordinary context`
  - `https://raw.githubusercontent.com/sunrain520/spec-first/main/docs/assets/readme/spec-first-flow.svg`
  - `https://github.com/sunrain520/spec-first/blob/main/README.zh-CN.md`
  - `https://github.com/sunrain520/spec-first/blob/main/docs/05-%E7%94%A8%E6%88%B7%E6%89%8B%E5%86%8C/README.md`
  - 匹配 `/plans\s*->\s*tasks\s*->\s*work/` 的文本
  - `MCP/helper readiness`
  - `docs/contracts/source-runtime-customization-boundary.md`
- R11. 所有链接必须使用绝对 HTTPS URL，禁止相对路径（`](./` 或 `](../`）
- R12. 图片必须展示为 PNG，SVG 保留为 `<sub>` 说明中的源文件链接

---

## Acceptance Examples

- AE1. **Covers R1, R2.** Given 首次访问用户打开 README，when 他们只看首屏内容，then 他们能用一句话说出"spec-first 是什么"以及"成功后我会在 repo 里看到什么文件"。

- AE2. **Covers R3, R4, R5, R6, R7.** Given 用户决定试用并按 Quickstart 执行，when 他们依序完成所有步骤，then 他们能在约 5 分钟内在 `docs/brainstorms/` 下看到第一个 `.md` 产物文件，且每一步都有成功标志可对照。

- AE3. **Covers R10, R11, R12.** Given README 被重构后，when 测试套件运行，then 所有硬约束字符串测试通过，且不存在相对路径链接。

---

## Success Criteria

- 新用户从打开 README 到运行第一个 workflow 并验证产物的路径中，不需要向上滚动或在多个章节之间跳转才能找到下一步
- 执行者（planner 或人工）能明确知道哪些章节前移、哪些后置、哪些硬约束不可动

---

## Scope Boundaries

- README.zh-CN.md 同步（先确认 EN 版本，ZH 后续对齐）
- 新增演示视频或交互式教程
- 修改 CLI 实际行为（doctor、init 输出内容）
- 删除深度治理/架构内容（保留，但后置）
- Documentation 章节之外的外链文档内容

---

## Key Decisions

- **Quickstart 前置**：移至背景章节（The Problem、Why spec-first）之前，因为已感兴趣的用户首先需要"怎么做"，背景可在成功后补读。
- **推荐单一首次 workflow**：Quickstart 使用 `/spec:brainstorm` 而非完整入口表格，降低选择成本，brainstorm 产物最直观可验证。
- **硬约束不可妥协**：测试依赖的字符串和链接格式是非谈判性约束，所有结构调整必须在这些约束内进行。

---

## Outstanding Questions

### Deferred to Planning

- [Affects R6][Needs research] "See It In 90 Seconds" 部分是否替换或补充为终端录屏？当前为静态流程图
- [Affects R9][Technical] Workflow Entry Points 完整表格是否用 `<details>` 折叠块处理（GitHub markdown 支持），以减少线性阅读负担
