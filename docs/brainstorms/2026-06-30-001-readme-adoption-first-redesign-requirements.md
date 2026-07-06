---
date: 2026-06-30
topic: readme-adoption-first-redesign
spec_id: 2026-06-30-001-readme-adoption-first-redesign
---

# README Adoption-First Redesign

## Summary

在上一轮 README 集成上手重构之后，继续把 `README.md` 与 `README.zh-CN.md` 优化为 adoption-first 开源入口页：前半段优先帮助首次读者判断“这是否值得试用”，用价值主张、真实效果、快速上手和可信证据建立转化路径；治理、runtime、完整工作流和贡献细节后移为渐进披露内容。

---

## Problem Frame

当前 README 已经覆盖安装、workflow、runtime、trust model 和贡献路径，且上一轮重排已经修复了安装入口过深与首次示例重复的问题。但从开源运营和采用转化视角看，README 仍需要更明确地区分“首次评估者的 30-90 秒判断路径”和“深入采用者/贡献者的完整文档路径”。

本次 brainstorm 的核心选择是 **adoption-first**：先让新用户快速看懂 spec-first 的实际收益、适用边界和首次成功路径，再把更完整的治理和架构内容下沉。这个方向参考 GitHub README docs、Open Source Guides、npm README docs 与 Make a README 的共同原则：README 应先说明项目是什么、为什么有用、如何安装使用、如何获得帮助和如何参与，而不是在入口页承载全部深度文档。

本次不是重做产品边界，也不是继续堆叠更多能力说明。目标是让 spec-first 的差异化在开源入口处更容易被识别、试用和评估：repo-backed evidence loop、Claude Code/Codex 双宿主、scripts enforce deterministic invariants and prepare facts、LLM judges semantic adequacy above that floor、evidence stays in the repo。

---

## Actors

- A1. 首次评估者：从 GitHub、npm 或官网进入 README，希望在 30-90 秒内判断 spec-first 是否值得安装试用。
- A2. 试用者：已经认可问题，但需要一条短、连续、可信的安装到首个 workflow 路径。
- A3. 团队采纳评估者：关心 spec-first 是否可被团队信任，重点看 evidence loop、验证边界、source/runtime 纪律和适用/不适用场景。
- A4. 潜在贡献者：需要开发、测试、source-of-truth 与 runtime 投影信息，但不是首屏优先读者。

---

## Key Flows

- F1. 首次评估路径
  - **Trigger:** A1 打开 README。
  - **Actors:** A1
  - **Steps:** 看到一句话定位与可信状态 → 看到实际效果或最短 workflow 产物示例 → 理解 spec-first 解决的具体痛点 → 判断它与普通 prompt pack / agent orchestration 工具的差异 → 进入 Quickstart。
  - **Outcome:** A1 不需要读完治理细节，就能判断是否值得安装。
  - **Covered by:** R1, R2, R3, R4, R10

- F2. 首次试用路径
  - **Trigger:** A2 决定尝试 spec-first。
  - **Actors:** A2
  - **Steps:** 确认 prerequisites → 复制安装与 doctor 命令 → 运行 `spec-first init` → 重启当前 host → 运行第一个 `spec-*` 或 `spec-*` workflow → 看到 repo-local artifact。
  - **Outcome:** A2 从 README 获得一次可复制的 first success path。
  - **Covered by:** R5, R6, R7, R10

- F3. 信任评估路径
  - **Trigger:** A3 想判断是否适合团队使用。
  - **Actors:** A3
  - **Steps:** 先读 adoption-first 摘要 → 查看 “why trust it” 摘要 → 进入 Trust Model / Operating Model / docs contracts 深入链接 → 理解哪些能力是 confirmed，哪些是 advisory 或 degraded。
  - **Outcome:** A3 能把 spec-first 视为工程 harness，而不是夸大自动化承诺的 agent collection。
  - **Covered by:** R8, R9, R10

---

## Requirements

**Opening and Positioning**

- R1. README 前半段必须围绕 adoption-first 决策路径组织：是什么、解决什么痛点、为什么不同、看到什么效果、如何快速试用。
- R2. 首屏定位应保留 “AI Coding Harness for Claude Code and Codex” 的核心表达，但要紧跟一句结果导向解释，说明 spec-first 把一次性 AI coding chat 转成 repo-backed engineering loop。
- R3. “The Problem / 你遇到的问题” 应保持紧凑，聚焦决策、证据、review trail 和 learning 随聊天窗口消失的风险，不展开 runtime 或 provider 细节。
- R4. “Why spec-first?” 或等价价值段落应优先呈现差异化对比：普通 prompt pack、agent orchestration、standalone app 与 spec-first 的区别；对比重点放在 artifact/evidence/governance/knowledge loop，而不是 agent 数量。

**Demo and First Success**

- R5. README 必须在深入架构之前展示可感知的实际效果：优先使用现有图示和最短 workflow 产物路径；若未来有终端录屏/GIF，可替换当前 demo slot，但不得破坏 Quickstart 顺序。
- R6. Quickstart 应继续维持连续试用路径：prerequisites → install → doctor → init → restart host → first workflow → expected repo-local artifact。
- R7. 首次 workflow 示例必须同时照顾 Claude Code 与 Codex，但避免重复两套长篇教程；可用并列表达或短表格承载 host 差异。

**Trust and Progressive Disclosure**

- R8. Trust Model 应作为“为什么可被团队信任”的渐进披露段落，不应在前半段压过上手路径；但必须保留 scripts/LLM 边界、source/runtime 边界、verification/honest closeout 和 provider evidence boundary。
- R9. Operating Model 应承载 repo-local artifacts、generated runtime assets 与 source-of-truth 解释；它是深入理解区，不是首屏价值区。
- R10. README 必须诚实区分 confirmed capability、advisory evidence 和 aspirational/needs-evidence 方向；不得把机制就位写成效果已被外部验证。

**Bilingual and Package Surface**

- R11. `README.md` 与 `README.zh-CN.md` 应保持章节结构镜像；英文版服务 GitHub/npm 国际入口，中文版服务中文用户手册入口，两者关键信息量对等。
- R12. 英文 README 作为 npm package README 的主入口，应避免依赖中文文档才能完成首次试用；中文深度文档链接可保留为深入资源，但第一条试用路径必须英文自洽。
- R13. README 不应引入新的 source-of-truth surface；深度内容通过现有 docs/contracts、user manual、runtime capability catalog、contributing/security/license 链接承接。

---

## Acceptance Examples

- AE1. **Covers R1, R2, R5.** 当首次评估者只阅读 README 前半段时，能复述 spec-first 是什么、为什么与普通 prompt/agent orchestration 不同、以及试用后会在仓库里得到什么产物。
- AE2. **Covers R6, R7.** 当试用者只按 Quickstart 执行时，不需要跳转到中文手册即可完成安装、init、重启 host 和第一个 workflow。
- AE3. **Covers R8, R10.** 当团队评估者阅读 Trust Model 时，不会看到“AI 自动保证正确”类承诺；完成声明、验证证据和 provider evidence 均保持边界清楚。
- AE4. **Covers R11, R12.** 当并排比较 `README.md` 与 `README.zh-CN.md` 时，两者章节顺序一致、核心事实对等；英文 README 的首次试用链路不依赖中文页面才能理解。

---

## Success Criteria

- 新用户在 30-90 秒内能判断 spec-first 是否值得安装试用。
- Quickstart 能独立支撑一次 first success path，并让用户看到 repo-local artifact。
- README 前半段更像开源 adoption funnel，后半段仍能支撑团队信任评估和贡献者深入理解。
- 重设计不删除现有测试守护的 README 事实、链接、图片引用、host entrypoint、CLI 参数或 source/runtime 边界。

---

## Scope Boundaries

- 不在本次需求中直接改 README；本文件只定义 WHAT，实施交给后续 `spec-plan` / `spec-work`。
- 不新增 Roadmap、赞助、社区群、营销落地页或官网改版。
- 不新增 product capability、workflow entrypoint、CLI 命令或 runtime surface。
- 不把 generated runtime mirrors 当作 source 修改。
- 不夸大外部验证；如果缺少真实用户 adoption 数据，只能写成定位假设或 future evidence need。
- 不删除现有 `README.md` / `README.zh-CN.md` 的关键深度入口，只调整信息架构和前后顺序。

---

## Key Decisions

- 选择 adoption-first 作为 README 第一优化目标：用户明确选择“新用户决策与试用转化”优先，而不是 trust-first 或 contributor-first。
- 采用渐进披露而非删减深度内容：spec-first 的治理与证据边界是差异化资产，但应该在用户理解价值和试用路径之后展开。
- 保留“AI Coding Harness”定位：这是当前 README、`package.json` 描述与角色契约共同支撑的核心定位，不改成更泛的 agent/workflow/prompt 工具。
- 把 best practice 当作信息架构参考，不当作外部权威替代源码事实：README 能写什么仍以当前 repo source、docs、tests 和 CLI 能力为准。

---

## Dependencies / Assumptions

- Prior art: `docs/brainstorms/2026-06-29-001-readme-integration-onboarding-refactor-requirements.md` 已覆盖上一轮“评估者 + 上手者”结构重排；本需求是后续 adoption-first 二次设计，不覆盖其历史决策。
- Source evidence: `README.md`、`README.zh-CN.md`、`package.json`、`docs/10-prompt/结构化项目角色契约.md`、`docs/11-业界调研/2026-06-20-ai-coding-team-adoption-and-spec-first-gap-research.md` 支撑当前定位与外部可采纳性问题。
- External best-practice references: GitHub README docs、Open Source Guides、npm README docs、Make a README。它们只作为 README 信息架构参考，不作为 spec-first 能力事实来源。
- 实施时需重新核验当前 README tests 与发布门禁；本 brainstorm 未运行 README contract test。

---

## Outstanding Questions

### Resolve Before Planning

- （无）adoption-first 优先级、首屏目标、信任内容后移和不新增产品能力的边界已确定。

### Deferred to Planning

- [Affects R5][Technical] 当前 demo slot 是否继续使用图示，还是补一个短 terminal transcript，占位选择由 planning 基于现有资产和测试约束决定。
- [Affects R11, R12][Technical] 双语 README 是否逐段镜像，还是保持章节镜像但允许中文链接更丰富，由 planning 基于当前文档生态决定。
- [Affects R8, R10][Needs research] 是否需要加入一个极短 “What it does not do” 段落来降低误解，由 planning 评估篇幅与转化影响。
