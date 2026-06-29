---
title: "refactor: README 集成上手渐进披露重排"
type: refactor
status: completed
date: 2026-06-29
spec_id: 2026-06-29-001-readme-integration-onboarding-refactor
origin: docs/brainstorms/2026-06-29-001-readme-integration-onboarding-refactor-requirements.md
origin_grade: brainstorm
---

# refactor: README 集成上手渐进披露重排

## Summary

按"评估者 + 上手者"双读者把 `README.md` 与 `README.zh-CN.md` 重排为渐进披露结构（Hero 图 → 问题场景 → 怎么解+对比表 → Quickstart → 后段治理/CLI/贡献），并把 `Try The First Loop` 并入 Quickstart、`What Stays Repo-Local` 并入 `Operating Model`。重排只动信息架构，不改任何事实内容，并逐项保住 ~5 个测试文件守护的 verbatim 字符串与链接约束。

---

## Decision Brief

- **Recommended approach:** 纯章节重排 + 两处合并去重，逐文件原子提交；以"先建立 verbatim 守护清单、改完即跑对应最窄测试"的方式保真。
- **Key decisions:** 安装入口提到全文前 1/4（不可达则按需求文档放宽为前 1/3 且严格早于首次成功示例）；`What Stays Repo-Local` + artifact-trail 图并入 `Operating Model`；标题块痛点叙事收敛为一句话定位、其余移入"问题场景"小节。
- **Validation focus:** `context-governance` / `package-install` / `team-standards-governance` / `contract-drift`（capability probes）/ `check-release-continuity` 这组守护测试全过；`git diff --check` 无空白错误；双语结构镜像一致。
- **Largest risks / boundaries:** 重排过程中误删/移动 verbatim 守护字符串导致测试红；以及双语两份结构漂移。两者都由 U3 的最窄测试闭环兜底。

---

## Problem Frame

`README.md`（339 行）内容准确但章节按时间堆叠，从开源运营漏斗看有可定位摩擦：安装入口埋在约 27% 处、`Try The First Loop` 出现在安装之前的顺序矛盾、首屏 `$spec-brainstorm` 示例重复、安装前 4 个叙事节偏长（详见 origin）。`README.zh-CN.md` 结构对齐、问题相同。两份 README 是 GitHub / npm / 官网导流后的首要入口，这些摩擦直接拉长"落地 → 首次成功跑通"。本计划面向已存在产品的工程演化，只调整信息架构与上手路径。

---

## Requirements

- R1. 两份 README 首屏（安装前）按渐进披露排序：Title + 一句话定位 + badges + 中英切换 → Hero 图 → 紧凑"问题场景" → "怎么解"（价值 + 对比表）→ Quickstart。（见 origin R1）
- R2. "问题场景"小节紧凑；现标题块痛点叙事收敛为一句话定位、其余移入该小节，标题块与问题场景不重复同一痛点叙事。（见 origin R2）
- R3. Quickstart 上移至对比表之后、其余参考之前，安装入口落前 1/4（不可达则放宽为前 1/3 且严格早于任何首次成功示例）。（见 origin R3 + Success Criteria）
- R4. 合并 `Try The First Loop` 与 `Quickstart`，首屏只留一条首次成功示例，消除重复与"试循环在安装前"。（见 origin R4）
- R5. 后段保留并按渐进披露排序：Workflow Entry Points → Operating Model → Trust Model → Use spec-first when → Documentation → Runtime And CLI Reference → Development & Contributing；不删除事实内容。（见 origin R5）
- R5a. `What Stays Repo-Local`（含 artifact-trail 图及 SVG 源链接）并入后段 `Operating Model`；并入后 artifact-trail 与 runtime-model 两图均保留。三张受测试约束的 PNG 落点：Hero 图在首屏，artifact-trail 与 runtime-model 图在 `Operating Model`。（见 origin R5a）
- R6. 两份 README 章节结构与顺序一致；中文用中文标题、英文用英文标题；关键事实/链接/列表项在对应章节语义镜像，不引入新事实。（见 origin R6）
- R7. 重排不改变事实真相：workflow 入口清单、CLI 参数与命令、产物路径、prerequisites 与现有一致。（见 origin R7）
- R8. 原样保留测试与发布门禁守护的 verbatim 字符串、绝对 https 链接与 PNG 图片引用（清单见 Key Technical Decisions）。（见 origin R8）

**Origin actors:** A1 评估者, A2 上手者, A3 潜在贡献者/维护者
**Origin flows:** F1 评估路径, F2 首次跑通路径
**Origin acceptance examples:** AE1 (covers R3, R4), AE2 (covers R6), AE3 (covers R8)

---

## Scope Boundaries

- 不改 `package.json` 的 `files`：`README.md` 仍打包，`README.zh-CN.md` 仍仅留仓库。
- 不改文档事实内容：workflow 入口数量/名称、CLI 参数、产物路径、版本事实均按现状；若发现事实漂移，记为单独事项，不在本次顺带纠偏。
- 不新增图示资产；沿用现有 Hero / artifact-trail / runtime-model 三张 PNG 及其 SVG 源链接。
- 不改官网（spec-first.cn）同步、`docs/05-用户手册` 任何文件、其它 docs。
- 不引入相对链接或 markdown 之外的新渲染产物（HTML 伴随文件）。

---

## Direct Evidence Readiness

- target_repo: spec-first（当前仓库根）
- evidence_sources: 直接源码读取（README.md 全文、plan-template.md）、rg、grep 守护测试断言、git status/diff
- source_refs: README.md, README.zh-CN.md, tests/unit/context-governance-contracts.test.js, tests/unit/package-install-contracts.test.js, tests/unit/team-standards-governance-contracts.test.js, tests/unit/fixtures/contract-capability-probes.js, scripts/check-release-continuity.cjs
- current_revision: d928dcfa
- worktree_status: README.md 与 README.zh-CN.md 已各有 1 行未提交新增（team-standards 条目，须保留）；需求文档已 add
- confidence: high（约束清单已源码逐条确认）
- limitations: memory 中提到的 `spec-first-flow.svg` raw URL 硬约束未在本轮 grep 复现，执行时需对全量 README 测试再确认；外部研究未做（约束已知，无需）

---

## Direct Evidence

- repo_scope: 单仓库，2 个 README 文件 + 守护测试
- source_reads_completed: README.md 全文；plan/brainstorm 模板；5 处守护断言源码
- source_reads_required: README.zh-CN.md 全文（执行时按节对照重排）
- commands_or_tools_used: `grep README tests/ scripts/`、逐文件断言提取、`git diff --stat`、`git status --porcelain`
- impact_on_plan: 把 origin 的 Deferred-to-Planning「核验实际守护测试集合」前置解决，形成 R8 的精确 verbatim 清单（见下）
- key_findings: 守护 README 内容的是 context-governance / package-install / team-standards-governance / contract-drift(capability probes) / check-release-continuity；其余 `grep README` 命中多为路径或无关引用
- limitations: 见上 limitations

---

## Context & Research

### Relevant Code and Patterns

- `README.md` 当前 12 个 H2 小节顺序（成文时）：See It In 90 Seconds, Try The First Loop, What Stays Repo-Local, Why spec-first?, Quickstart, Workflow Entry Points, Operating Model, Trust Model, Use spec-first when, Documentation, Runtime And CLI Reference, Development & Contributing。
- `README.zh-CN.md` 与之结构镜像，须同步重排。
- 重排是文档信息架构调整，无代码行为，不产生新测试文件；验证依赖既有守护测试。

### Institutional Learnings

- memory `readme-content-facts`：运营漏斗视角（倒金字塔、F-pattern、假设仅约 20% 读者、安装+首次成功置顶、去 superlative、单一对比表作可分享资产）。
- memory `readme-hard-constraints` + memory `concurrent-session-file-reverts`：另有进程会回退未暂存编辑，改完应 `git add` 保护。

### External References

- 无（约束与本地模式完全已知，按 Phase 1.2 判定跳过外部研究）。

---

## Key Technical Decisions

- **新章节顺序（两份镜像）**：`Title+一句话定位+badges+lang` → `Hero 图` → `问题场景` → `怎么解(价值+对比表)` → `Quickstart(含原 Try The First Loop)` → `Workflow Entry Points` → `Operating Model(含原 What Stays Repo-Local + artifact-trail 图)` → `Trust Model` → `Use spec-first when` → `Documentation` → `Runtime And CLI Reference` → `Development & Contributing`。
- **去重两处**：Try The First Loop → 并入 Quickstart；What Stays Repo-Local（+artifact-trail 图）→ 并入 Operating Model。理由见 origin Key Decisions。
- **保真做法**：先用下方清单核对，再"移动整段"而非"重写"，最大限度保留 verbatim。

**R8 verbatim / 约束守护清单（执行时逐条核对，改完跑对应测试）：**

| 约束（须原样保留/满足） | 守护处 |
|---|---|
| EN 含 `What is excluded from ordinary context` | context-governance-contracts.test.js:129 |
| ZH 含 `普通上下文排除什么` | context-governance-contracts.test.js:130 |
| `package.json` `files` 含 `README.md`、不含 `README.zh-CN.md` | package-install-contracts.test.js:153-154 |
| EN 含 `https://github.com/sunrain520/spec-first/blob/main/README.zh-CN.md` | package-install-contracts.test.js:158 |
| EN 含 `https://github.com/sunrain520/spec-first/blob/main/docs/05-%E7%94%A8%E6%88%B7%E6%89%8B%E5%86%8C/README.md` | package-install-contracts.test.js:159 |
| EN 无相对链接/图片（不匹配 `](./` / `](../`），全绝对 https | package-install-contracts.test.js（"absolute repository links" 用例） |
| ZH 含 `团队开发规范合同` | team-standards-governance-contracts.test.js:361 |
| EN 含 ``团队开发规范可以放在 `docs/contracts/team-standards.md` 与 `docs/standards/**` `` | team-standards-governance-contracts.test.js:362 |
| 两份均匹配 `/plans\s*->\s*tasks\s*->\s*work/` | contract-capability-probes.js:47-48 |
| 两份均含 `MCP/helper readiness` | contract-capability-probes.js:132-133 |
| 两份均含 `docs/contracts/source-runtime-customization-boundary.md` | check-release-continuity.cjs |
| 图片以 PNG 显示、SVG 作 `<sub>` 源链接；runtime-model 图 `<sub>` caption 保留 `plans -> tasks -> work` | 同上 flow probe + memory readme-hard-constraints |
| 两份 README 各 1 行已存在 team-standards 新增不得丢失 | 本地 git diff（执行前 `git diff` 确认） |

---

## Open Questions

### Resolved During Planning

- 实际守护 README 的测试集合是哪些？→ 已核验，见 R8 清单（origin Deferred-to-Planning 第 2 项闭合）。
- artifact-trail 小节/图去向？→ 并入 Operating Model（origin R5a）。

### Deferred to Implementation

- "问题场景"小节最终措辞与长度（几行/是否含子标题）：按渲染效果定稿（origin Deferred 第 1 项）。
- 后段各节是否顺带轻量去 superlative：默认本次只动顺序与两处合并，不顺带改写措辞，除非移动整段时顺手剔除明显空话；大范围措辞优化留作单独事项（origin Deferred 第 3 项）。
- `spec-first-flow.svg` raw URL 是否为硬约束：执行时以全量 README 测试结果为准。

---

## Implementation Units

### U1. 重排 README.md（英文）

**Goal:** 将 `README.md` 重排为渐进披露结构，合并 Try The First Loop 与 What Stays Repo-Local，收敛标题块痛点叙事，保住全部 EN 侧 verbatim 约束。

**Requirements:** R1, R2, R3, R4, R5, R5a, R7, R8

**Dependencies:** None

**Files:**
- Modify: `README.md`

**Approach:**
- 按 Key Technical Decisions 的新顺序移动整段而非重写；标题块痛点段收敛为一句话定位，其余并入"问题场景"小节。
- Try The First Loop 整段并入 Quickstart，首屏只留一条首次成功示例。
- What Stays Repo-Local 段（含 artifact-trail PNG + SVG `<sub>`）整体并入 Operating Model。
- 改前先 `git diff README.md` 记下已存在的 1 行 team-standards 新增，确保重排后仍在。

**Execution note:** 先对照 R8 清单逐条定位 verbatim 锚点，再移动；改完立即 `git add README.md` 防并发回退（见 institutional learnings）。

**Patterns to follow:**
- 现有 PNG+`<sub>`(SVG 源) 图片范式；现有绝对 https 链接范式。

**Test scenarios:**
- 验收 AE1（Covers R3, R4）：从顶部读，安装命令出现在任何"运行 workflow"示例之前；首屏无两处相同首次成功示例。
- 保真：R8 清单 EN 侧每条 verbatim/链接重排后仍在；无相对链接。
- 无新测试文件（docs 重排，验证用既有守护测试，见 U3）。

**Verification:**
- 新章节顺序符合 KTD；EN verbatim 清单全部命中；安装入口位于前 1/4（或按 R3 放宽并在该处达成）。

---

### U2. 重排 README.zh-CN.md（中文，镜像 U1）

**Goal:** 按 U1 定稿的结构重排中文 README，保持双语结构与内容语义镜像，保住全部 ZH 侧 verbatim 约束。

**Requirements:** R1, R2, R3, R4, R5, R5a, R6, R7, R8

**Dependencies:** U1

**Files:**
- Modify: `README.zh-CN.md`

**Approach:**
- 以 U1 的最终章节顺序为模板逐节镜像；中文标题、中文正文，沿用现有翻译对应。
- 同样并入 Try The First Loop、What Stays Repo-Local；收敛标题块痛点叙事。
- 保留已存在的 1 行 team-standards 中文新增。

**Execution note:** 改完立即 `git add README.zh-CN.md`。

**Patterns to follow:**
- U1 重排后的 `README.md` 章节骨架与图片/链接范式。

**Test scenarios:**
- 验收 AE2（Covers R6）：两份 README 章节标题数量与顺序一致，仅语言差异；关键事实/链接/列表项在对应章节出现，无一边新增或遗漏。
- 保真：ZH 侧 `普通上下文排除什么`、`团队开发规范合同`、flow 正则、`MCP/helper readiness`、source-runtime boundary 链接重排后仍在。

**Verification:**
- 两份结构镜像一致；ZH verbatim 清单全部命中。

---

### U3. 守护测试验证 + CHANGELOG

**Goal:** 以最窄测试集合证明两份 README 重排未破坏任何守护契约，并按用户可见变更更新 CHANGELOG。

**Requirements:** R6, R8（验证闭环）

**Dependencies:** U1, U2

**Files:**
- Modify: `CHANGELOG.md`

**Approach:**
- 跑 R8 清单对应测试与 `git diff --check`；任一红则回到 U1/U2 修复对应 verbatim/结构，不改测试迁就。
- 通过后按仓库格式追加 CHANGELOG 条目（`(user-visible)`，作者按 host developer profile）。
- 注意：README 测试可能受会话缓存无关（脚本/测试读磁盘 source），可常规运行。

**Test scenarios:**
- Happy path：`npx jest tests/unit/context-governance-contracts.test.js tests/unit/package-install-contracts.test.js tests/unit/team-standards-governance-contracts.test.js tests/unit/contract-drift-guard.test.js` 全过。
- Happy path：`node scripts/check-release-continuity.cjs`（或其测试入口）通过 readme-source-runtime-boundary-links 守护。
- 边界：`git diff --check` 无行尾空白错误；`npx jest tests/unit/changelog-format.test.js` 通过。
- 兜底：若不确定全量守护，跑 `npm run test:unit` 收口。

**Verification:**
- 上述测试全部通过；CHANGELOG 含本次条目；工作树仅含预期的 README/CHANGELOG 改动。

---

## System-Wide Impact

- **API surface parity:** README.md 与 README.zh-CN.md 必须同结构（R6/AE2）——任一改动需在两份镜像。
- **Surface coverage:** README.md（EN，打包进 npm）→ in-scope；README.zh-CN.md（ZH，仅仓库）→ in-scope；docs/05-用户手册及其它 docs → out-of-scope（不在本次）；官网同步 → out-of-scope（test:release:website 审 source facts 而非 README prose）。
- **Unchanged invariants:** 所有 workflow 入口、CLI 参数、产物路径、`package.json` files、三张 PNG 资产及其 URL、全部 R8 verbatim 字符串均不变，仅位置可变。

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| 重排误删/改写 verbatim 守护字符串致测试红 | U3 跑精确守护清单；U1/U2 用"移动整段不重写"策略 + 改前定位锚点 |
| 双语结构漂移（一边漏并节或漏链接） | U2 以 U1 定稿为模板逐节镜像；AE2 验证结构一致 |
| 并发进程回退未暂存编辑 | 每个 U 改完立即 `git add`（institutional learning） |
| "前 1/4"目标不可达 | 按 R3 放宽为"前 1/3 且严格早于首次成功示例"，不为凑数字砍对比表 |
| 顺带改写措辞引入事实漂移 | 默认只动顺序与两处合并；大范围去 superlative 留单独事项 |

---

## Sources & References

- **Origin document:** [docs/brainstorms/2026-06-29-001-readme-integration-onboarding-refactor-requirements.md](docs/brainstorms/2026-06-29-001-readme-integration-onboarding-refactor-requirements.md)
- Related code: `README.md`, `README.zh-CN.md`, `CHANGELOG.md`
- Guards: `tests/unit/context-governance-contracts.test.js`, `tests/unit/package-install-contracts.test.js`, `tests/unit/team-standards-governance-contracts.test.js`, `tests/unit/fixtures/contract-capability-probes.js`, `scripts/check-release-continuity.cjs`
</content>
