---
date: 2026-06-29
topic: readme-integration-onboarding-refactor
spec_id: 2026-06-29-001-readme-integration-onboarding-refactor
---

# README 集成上手重构

## Summary

把 `README.md` 与 `README.zh-CN.md` 按"评估者 + 上手者"双读者重排为渐进披露结构：首屏用 Hero 图 + 紧凑问题场景 + 怎么解(含对比表)同时回答"这是什么/为何值得试",紧随其后给出可跑通的 Quickstart,完整 Workflow 入口、Operating Model、Trust Model、CLI/文档/贡献细节下沉到后半段。

---

## Problem Frame

当前 `README.md`（339 行）经过几轮整理后内容准确，但从开源运营漏斗视角仍有可定位的"集成上手"摩擦（以下行号/占比为本需求成文时点的快照,落地时以节名为准、行号会随编辑漂移）：

- **安装入口埋得太深。** 真正的 `npm install -g spec-first` 在 `Quickstart` 节（成文时约全文 27% 处）。运营常识是"安装 + 首次成功"应落在前 1/5,落地用户却要先翻过 `See It In 90 Seconds` → `Try The First Loop` → `What Stays Repo-Local` → `Why spec-first?` 四个小节。
- **顺序自相矛盾。** `Try The First Loop` 节让用户运行 `spec-brainstorm`,但此处尚未介绍安装——"试第一个循环"出现在"怎么装"之前。
- **首屏内容重复。** `Try The First Loop` 与 `Quickstart` 都演示同一条首次成功示例,首屏宝贵空间被重复占用。
- **价值铺陈偏长。** 安装前有 4 个叙事/价值小节,对"已决定试"的用户是延迟,对"还在评估"的用户又偏冗长。

`README.zh-CN.md`（340 行）结构与英文版对齐,存在相同问题。两份 README 是开源用户的首要入口页（GitHub / npm / 官网导流后的落点）,这些摩擦直接拉长"落地 → 首次成功跑通"的时间。

本次重构面向已存在产品的工程演化：目标读者（开源开发者）与产品定位已settled,改动只调整信息架构与上手路径,不改变产品边界或事实内容。

---

## Actors

- A1. 评估者：首次接触 spec-first 的开源开发者,从 GitHub / npm / 官网进入,想在 30 秒内判断是否值得安装。需要先看到"这是什么 + 解决什么痛点 + 与 agent 编排工具的差异"。
- A2. 上手者：已基本认同价值、用 Claude Code 或 Codex 的开发者,卡点在"怎么最快装好并跑通第一个 workflow"。需要一条无歧义、可复制的安装—init—重启—首个 workflow 路径。
- A3. 潜在贡献者 / 维护者：需要确认 source-of-truth、generated runtime、测试与文档入口,但不是首屏第一优先级读者,相关内容可下沉后段。

---

## Key Flows

- F1. 评估路径（A1）
  - **Trigger:** A1 打开 `README.md` 或 `README.zh-CN.md`。
  - **Actors:** A1
  - **Steps:** 看到一句话定位 + Hero 图 → 紧凑"问题场景"建立共鸣 → "怎么解"含对比表建立差异化认知与轻量信任 → 自然滚动到 Quickstart。
  - **Outcome:** A1 在前 1/4 篇幅内即可判断 spec-first 是否契合自己的 AI coding workflow。
  - **Covered by:** R1, R2, R3, R7, R8

- F2. 首次跑通路径（A2）
  - **Trigger:** A2 决定安装并初始化当前宿主。
  - **Actors:** A2
  - **Steps:** 在 Quickstart 节确认 prerequisites → 复制安装命令 → 运行 `doctor` → `spec-first init` 选宿主 → 重启宿主 → 在宿主会话运行第一个公开 workflow → 看到 `docs/brainstorms/` 产物与下一步。
  - **Outcome:** A2 沿单一连续路径完成一次可验证上手,不需要在首屏来回跳节,也不会先遇到"试循环"再回头找安装。
  - **Covered by:** R3, R4, R5, R8

---

## Requirements

**首屏与章节顺序**

- R1. 两份 README 首屏（安装之前）按此渐进披露顺序组织：Title + 一句话定位 + badges + 中英切换 → Hero 图 → 紧凑"问题场景"小节 → "spec-first 怎么解"（价值 + 对比表）→ Quickstart。
- R2. "问题场景"小节紧凑（建议不超过一屏内的一节）,只陈述 AI coding 决策/证据/评审随对话消失的痛点,不展开实现细节。现标题块中那段痛点叙事（成文时 `README.md` 标题段的 "AI can write code quickly; the risky part is..." 一段）应收敛为标题处的一句话定位,其余痛点表述移入本"问题场景"小节,**不得在标题块与问题场景小节重复出现同一痛点叙事**（否则即为本次要消除的"首屏重复"的变体）。
- R3. Quickstart 上移至对比表之后、其余参考内容之前,使安装入口落在全文前 1/4,且首次成功路径连续可读。
- R4. 合并现有 `Try The First Loop` 与 `Quickstart`,首屏只保留一条首次成功示例(`spec-brainstorm` / `spec-brainstorm` 之一为主,另一宿主形态可并列展示),消除重复演示与"试循环在安装前"的顺序矛盾。
- R5. 后半段保留并按渐进披露排序：Workflow Entry Points → Operating Model → Trust Model → Use spec-first when → Documentation → Runtime And CLI Reference → Development & Contributing；不删除其承载的事实内容。
- R5a. 现有 `What Stays Repo-Local` 小节（含 `spec-first-artifact-trail.png` 及其 SVG 源链接）不进首屏：其"产物随仓库留存"的内容与 artifact-trail 配图并入后段 `Operating Model` 小节（该节本就承载 artifact roots 与 runtime-model 图）,作为一次去重。并入后 artifact-trail 与 runtime-model 两张图均保留、承载事实不删除。三张受测试约束的 PNG 落点由此明确：Hero 图在首屏,artifact-trail 与 runtime-model 图在后段 `Operating Model`。

**双语一致性**

- R6. `README.md`（英文）与 `README.zh-CN.md`（中文）采用相同的新章节结构与顺序；中文版用中文标题,英文版用英文标题,正文翻译对应关系沿用现有,关键事实、链接和列表项应在对应章节内保持语义镜像,不借机引入新事实内容。

**事实与约束保真**

- R7. 重排不改变文档承载的事实真相：Workflow 入口清单、CLI 参数与命令、产物路径、prerequisites 与现有事实保持一致。
- R8. 重排必须原样保留测试与发布门禁守护的 verbatim 字符串、绝对 https 链接与 PNG 图片引用（详见 Dependencies / Assumptions）；不得将这些视作可自由改写的文案。

---

## Acceptance Examples

- AE1. **Covers R3, R4.** 当 A2 从顶部开始阅读时,在到达任何"运行 workflow"示例之前已先看到 `npm install -g spec-first`;首屏不再出现两处相同的首次成功示例（无论该示例最终用何文案）。
- AE2. **Covers R6.** 当并排比较两份 README 时,两者章节标题数量与顺序完全一致；关键事实、链接和列表项出现在对应章节内,只允许语言表达差异,不允许一边新增或遗漏当前事实。
- AE3. **Covers R8.** 当重排后的 `README.md` 跑现有 README 相关测试(verbatim 字符串、无相对链接、PNG 图、pinned 绝对 URL)时全部通过;`README.zh-CN.md` 仍含 `普通上下文排除什么`。

---

## Success Criteria

- 第一次接触的读者按从上到下顺序阅读,可不跳节地完成"看懂是什么 → 评估价值 → 安装 → 初始化 → 运行第一个 workflow"的心智路径。安装入口目标落在前 1/4（与 Key Decisions"保价值、安装略靠后但仍在前 1/4"一致）；落地时按实际行号占比核验,若"保价值"首屏（问题场景 + 对比表）使其无法达到前 1/4,则显式放宽为"前 1/3 且严格早于任何首次成功示例",不得为凑数字牺牲对比表。
- 下游 `spec-plan` / 执行者拿到本文档后,无需再发明 README 的目标读者、章节顺序或保真约束即可直接规划落地;重排后所有现有 README 测试与发布门禁通过,`CHANGELOG.md` 已按用户可见变更更新。

---

## Scope Boundaries

- 不改 `package.json` 的 `files`：`README.md` 仍打包进 npm tarball,`README.zh-CN.md` 仍仅留仓库。
- 不改文档事实内容：workflow 入口数量/名称、CLI 参数、产物路径、版本事实均按现状,不在本次重构中更新或纠偏(若发现事实漂移,记为单独事项)。
- 不新增图示资产；沿用现有 Hero / artifact-trail / runtime-model 三张 PNG（及其 SVG 源链接）。
- 不改官网（spec-first.cn）同步与 `docs/05-用户手册` 任何文件。
- 不引入相对链接或 markdown 之外的新渲染产物（如 HTML 伴随文件）。

---

## Key Decisions

- 选"保价值"首屏而非"极简"首屏：保留一节问题场景 + 对比表服务评估者,代价是安装位置比纯极简略靠后(仍在前 1/4)。理由：用户在双读者权衡中明确选择保价值,且对比表是既有的可分享资产。
- 合并 `Try The First Loop` 进 Quickstart 而非保留两节：首屏空间有限,重复示例与顺序矛盾是当前最具体的漏斗 bug,合并一次解决两个问题。
- `What Stays Repo-Local` 并入后段 `Operating Model` 而非进首屏或独立保留：两节都讲 artifact roots / 产物留存,合并去重并让 artifact-trail 配图有确定落点(见 R5a),首屏不再被第三张图拖长。理由：首屏已有 Hero 图 + 对比表,再加一图会稀释"评估 + 上手"的前 1/4 预算。
- 留在 brainstorm 产出需求文档而非直接动手：本次有多份历史 README brainstorm,沉淀一份当前决策可供 plan/执行与未来回溯,避免重排意图只活在对话里。

---

## Dependencies / Assumptions

以下约束基于记忆 [[readme-hard-constraints]] 与 [[readme-content-facts]],落地前需对当前测试再核验（记忆为 14 天前观察）：

- `README.md`（EN）须含 verbatim：`What is excluded from ordinary context`；pinned 绝对 URL `https://raw.githubusercontent.com/sunrain520/spec-first/main/docs/assets/readme/spec-first-flow.svg`、`https://github.com/sunrain520/spec-first/blob/main/README.zh-CN.md`、`https://github.com/sunrain520/spec-first/blob/main/docs/05-%E7%94%A8%E6%88%B7%E6%89%8B%E5%86%8C/README.md`；不得出现相对链接/图片（不匹配 `](./` 或 `](../`),全部绝对 https。
- `README.zh-CN.md`（ZH）须含 `普通上下文排除什么`。
- 两份 README 均须含匹配 `/plans\s*->\s*tasks\s*->\s*work/` 的文本、`MCP/helper readiness`、`docs/contracts/source-runtime-customization-boundary.md`。
- 两份 README 中现有 team standards 相关事实不得丢失或错位：`docs/contracts/team-standards.md`、`docs/standards/**`、团队开发规范合同/索引/用户手册等当前可见内容需在重排后保持语义对应。
- 图片以 PNG 显示（`![..](..png)`）,SVG 作为可编辑源链接放在 `<sub>` caption；runtime-model 图的 `<sub>` caption 须保留 `plans -> tasks -> work`。
- `package.json` 的 `files` 须含 `README.md`、不含 `README.zh-CN.md`；`docs/assets/readme/` 不在 `files` 内。
- CHANGELOG 作者按 host developer profile（记忆记为 `leokuang`,以落地时实际 profile 为准）。

---

## Outstanding Questions

### Resolve Before Planning

- （无）首屏骨架、双读者优先级、保真约束已在对话中确定。

### Deferred to Planning

- [Affects R1, R2][Technical] "问题场景"小节的最终措辞与长度（几行/是否含一个小标题）在落地时按渲染效果定稿。
- [Affects R8][Technical] 落地前用最窄命令核验当前实际守护 README 的测试集合（contract / package-install / contract-drift 等），以记忆为线索而非最终事实。
- [Affects R5][Technical] 后半段各节是否需要在重排中顺带做轻量措辞收紧（去 superlative），还是严格只动顺序,留待 plan 决定粒度。
