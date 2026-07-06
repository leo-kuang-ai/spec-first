---
title: "feat: spec-first init 品牌视觉第二轮深化（厚重字形 + 细分隔线排版）"
type: feat
status: completed
date: 2026-05-30
spec_id: 2026-05-29-002-spec-first-init-ux-brand
origin: docs/brainstorms/2026-05-29-002-spec-first-init-ux-brand-requirements.md
---

# feat: spec-first init 品牌视觉第二轮深化（厚重字形 + 细分隔线排版）

## Summary

在已落地的第一轮品牌化基础上，做一次纯展示层的视觉深化：把 `src/cli/brand.js` 的 full art 从细笔画 standard ASCII 换成厚重 `ansi_shadow` block 字形，去掉 `╔═╗` 双线全包框，改为上下两条品牌色细分隔线（`─`）夹住 art 与品牌行，并让重复运行的一行 wordmark 同步到新风格。改动收敛在 `brand.js` 单一来源与其测试，三个消费端（`init` 首次、`-v`、postinstall）通过既有稳定签名自动继承，不触碰任何落盘逻辑、i18n 文案、颜色降级机制与交互骨架。

---

## Problem Frame

`spec-first init` 是用户接触框架的核心入口。第一轮（spec_id `2026-05-29-002`，已合入 commit `1fff99cc`）已闭合语言割裂、三套品牌皮、版本对齐、交互可发现性、preview 机器味、全程无色六处痛点：统一品牌模块 `src/cli/brand.js`、全套 prompt 本地化、按键提示与最小选择反馈、本地化带语义色 preview、计算式 padding 对齐。

第二轮（本计划）只针对 origin 文档 `Deferred to Planning` 中留给 plan 的一项视觉定稿做深化——用户在本轮 brainstorm 明确：现有 standard ASCII 字形**不够厚重**、`╔═╗` 双线全包框**不够现代**。经实物对比与字符集/对齐验证后选定：`ansi_shadow` 厚重 block 字形 + 上下细分隔线排版（see origin: `docs/brainstorms/2026-05-29-002-spec-first-init-ux-brand-requirements.md`，`Deferred to Planning` 第 1 项）。

本轮是纯展示层改动，不动 init 落盘流程与产物结构，延续 origin 的 Scope Boundaries。

---

## Requirements

- R1. full art 字形从 standard ASCII 换成厚重 `ansi_shadow` block 字形，字符集仅限 `█`(U+2588) 与 box-drawing(U+2550–U+255D)，6 行矩形等宽，在主流 macOS/Linux 等宽终端稳定渲染。
- R2. 去掉 `╔═╗` 双线全包框，改为上下两条细分隔线（`─`）夹住 art 与品牌行（版本行 + tagline 行）。
- R3. 分隔线宽度用计算式跟随实际内容宽度，不硬编码；版本号长度变化时上下分隔线长度保持稳定一致，不出现错位（延续 origin R11 的对齐稳定性目标）。
- R4. 重复运行 init 的一行轻量 wordmark 同步到新风格（如品牌色细线/品牌色前缀），与 full art 视觉语言一致；保持单行、不刷屏。
- R5. full art 与 wordmark 仍由 `src/cli/brand.js` 单一来源渲染，三处入口（`spec-first init` 首次、`spec-first -v`、postinstall）共享，不产生第二套副本。
- R6. 着色沿用现有品牌色 + 语义色体系：art / 分隔线用品牌色，版本行与 tagline 用次级（dim）色做层次；现有 `NO_COLOR` / 非 TTY / `TERM=dumb` / 管道降级机制不变，纯文本输出绝不泄漏 ANSI 转义序列。
- R7. tagline 文案不改，沿用现有 `AI coding harness for Claude Code & Codex`。
- R8. `spec-first -v` 输出仍包含可被 `tests/smoke/cli.sh` grep 的 `Spec-First v<version>` 版本 token（或同步更新该 smoke 断言），不破坏版本展示的可解析信号。

**Origin actors:** A1（首次接入开发者，最受益于厚重 art 的品牌锚点）、A2（回头重置/修复开发者，靠新风格 wordmark 感知品牌但不被刷屏）、A3（自动化/non-TTY，降级行为与可解析信号不受影响）。
**Origin flows:** F1（首次安装与首次 init）、F2（重复运行 → wordmark）、F3（版本展示 `-v`）。
**Origin acceptance examples:** AE5（长版本号 `-v` 对齐稳定）、AE6（三处 full art 一致）、AE7（着色层次）、AE8（`NO_COLOR`/管道纯文本无转义）。

---

## Scope Boundaries

- 不改变 init 的落盘内容与底层流程（runtime asset 同步、managed block、developer profile、state、SessionStart hook、CHANGELOG bootstrap、`.gitignore` block、drift 检测、legacy hard reset、untrack 全部保持原样）。
- 不改 i18n 文案表 `src/cli/init-i18n.js`、不改 next-step 文案结构、不改交互 prompt 的光标/选中/确认渲染。
- 不改 tagline 文案、不引入用户可配置主题/调色板。
- 不引入新运行时依赖：art 以静态字符串内联在 `brand.js`（与现状一致）；`ansi_shadow` 字形仅在本次开发离线出图用于定稿，不进项目依赖；着色继续用原生 ANSI。
- 不做「首次会话主动引导上手」（onboarding task 播种）——那是另一方向，本轮不选。
- 不改 postinstall 与 `-v` 各自 art 下方的辅助文案块（「安装完成」「快速上手」等），仅替换共享的 art/分隔线渲染本体。

---

## Graph Readiness

- target_repo: spec-first（当前仓库根）
- status: stale
- source_revision: fc3d0ca649ee6739d16302608858e1ef4165fc9f
- current_revision: 1c079ede042e10cb730a65c301d790b9dbb41766
- stale: true（source_revision 与当前 HEAD 不一致，且 worktree_dirty=true）
- primary_providers: gitnexus（compiled facts 中 query_global_graph=true，但 facts 已 stale）
- degraded_providers: 无
- fallback_capabilities: bounded direct repo reads（已直接读取 brand.js / index.js / postinstall.js / commands/init.js / brand.test.js / cli.sh 全部相关源）
- runtime_mcp_evidence: not-used（lightweight 单模块展示改动，直接源码证据已足够）
- confidence: high（消费面已枚举确认仅 3 处，签名稳定）
- limitations: graph-facts.json stale；本计划为 docs-only-level 视觉改动，未刷新 graph；如后续需要 graph-backed 影响分析应先运行 `spec-graph-bootstrap`。

---

## Context & Research

### Relevant Code and Patterns

- `src/cli/brand.js` — 唯一品牌渲染来源。当前 `LOGO_LINES`（5 行 standard ASCII）、`TAGLINE`、`INNER_WIDTH=70`、`topBorder()`/`bottomBorder()`/`frameLine()`/`padRight()` 双线框 helper、`renderFullArt(version, opts)`、`renderWordmark(version, opts)`、`detectColorSupport()`、`colorize()`、`BrandColors`。本计划改动集中于此。
- `src/cli/index.js:190` — `printVersion()` 调用 `renderFullArt(pkg.version, { useColor: detectColorSupport() })`，其后拼接「快速上手」文案块。消费端，签名不变即自动继承新视觉。
- `bin/postinstall.js:11` — 调用 `renderFullArt(pkg.version, { useColor: detectColorSupport() })`，其后拼接「安装完成」文案块。消费端。
- `src/cli/commands/init.js:482-486` — `printInitBrandBanner()`：`hasAnyManagedState(root)` 为真时 `renderWordmark`，否则 `renderFullArt(...).trimEnd()`。「首次 vs 重复运行」判定信号已存在，无需新增。
- `BrandColors`（brand.js:1-8）：`brand=cyan(36)`、`write/remove/untrack/secondary(dim=2)`、`reset`。次级色 `secondary` 可直接用于版本行/tagline 分层。

### Institutional Learnings

- 未检索到 `docs/solutions/` 中与 ASCII art / 终端品牌渲染直接相关的条目；本轮以直接源码证据为准。
- origin 文档 Key Decisions 已确认：完整 art 仅首次/版本展示、重复运行降 wordmark；单一来源三处共享；着色限 logo+preview 且必须可降级。本轮严格延续。

### External References

- 未做外部检索。`ansi_shadow` 字形产物已在本地用 pyfiglet 离线生成并完成字符集/对齐验证（仅出图用途，不进依赖）；终端渲染稳定性已通过字符集落在 U+2550–U+2588 主流覆盖区确认。

---

## Key Technical Decisions

- **字形选 `ansi_shadow` 而非 block/banner3-D/big_money**：`ansi_shadow` 是 Trellis 同家族厚重 block 字形（实心 █ + 立体阴影），`spec-first` 渲染为 6 行 × 69 宽，与现 70 内宽几乎一致，迁移成本低；其余候选要么过宽、要么含非 block 字符、要么行数过多。
- **art 静态内联而非引入 figlet 运行时生成**：origin 已确立「0 新增运行时依赖」基线；art 字符串固定，无需运行时生成。`LOGO_LINES` 直接替换为定稿后的 6 行 `ansi_shadow` 字符串。
- **去双线框、改上下细分隔线**：厚重字形塞进 `╔═╗` 全包框需逐行右 pad 且视觉更挤更旧（Trellis 因此放弃边框）。上下分隔线形态不需要右 pad，现代且实现简单。
- **分隔线宽度计算式跟随内容**：宽度取 `max(art 最大行宽, 版本行宽, tagline 行宽)`，分隔线 `'─'.repeat(width)`。版本号变长只影响版本行宽参与 max，上下两线始终等长，天然满足 R3/AE5，无需保留旧 `INNER_WIDTH` 硬编码与 `padRight` 全框逻辑。
- **着色分层**：分隔线 + art 用 `BrandColors.brand`；版本行 + tagline 用 `BrandColors.secondary`（dim）。复用现有 `colorize()` + `resolveUseColor()`，降级路径零改动。
- **wordmark 新风格取「品牌色细线前缀」最小形态**：如 `─ spec-first v<version>`（前缀短线 + 品牌色 wordmark），保持单行、与 full art 的分隔线语言呼应，避免重复运行刷屏。精确形态在实现时定稿。
- **smoke 断言策略**：优先让 `-v` 版本行保留 `Spec-First v<version>` 子串，使 `tests/smoke/cli.sh:107` 的 grep 无需改动；若新版式自然改写版本 token，则同步更新该断言。二选一在实现时按定稿版式决定。

---

## Open Questions

### Resolved During Planning

- 字形选型：已定 `ansi_shadow`（实物对比 + 字符集/对齐验证通过）。
- 边框/排版：已定上下细分隔线、去双线全包框（用户在 brainstorm 选定）。
- wordmark 是否同步：已定同步新风格。
- tagline 是否改：已定不改。
- 消费面是否扩散：已确认仅 3 处消费端，均走稳定签名，改动收敛于 brand.js。

### Deferred to Implementation

- wordmark 新风格的精确字符形态（短线前缀 vs 同色块前缀）——在 `brand.js` 实现时按渲染观感定稿，不影响其它单元。
- `-v` 版本行最终 token 形态与 smoke 断言的二选一——按定稿版式决定是否改 `tests/smoke/cli.sh:107`。
- art 6 行字符串的最终缩进对齐（左侧是否留 2 空格 padding）——实现时按整体观感微调，保持 6 行等宽。

---

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

新版 `renderFullArt` 输出形态（着色时分隔线/art 为品牌色，版本/tagline 为 dim；纯文本时同结构无转义）：

```text
──────────────────────────────────────────────────────────────────────
 ███████╗██████╗ ███████╗ ██████╗ ███████╗██╗██████╗ ███████╗████████╗
 ██╔════╝██╔══██╗██╔════╝██╔════╝ ██╔════╝██║██╔══██╗██╔════╝╚══██╔══╝
 ███████╗██████╔╝█████╗  ██║█████╗█████╗  ██║██████╔╝███████╗   ██║
 ╚════██║██╔═══╝ ██╔══╝  ██║╚════╝██╔══╝  ██║██╔══██╗╚════██║   ██║
 ███████║██║     ███████╗╚██████╗ ██║     ██║██║  ██║███████║   ██║
 ╚══════╝╚═╝     ╚══════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝
 Spec-First v1.2.3
 AI coding harness for Claude Code & Codex
──────────────────────────────────────────────────────────────────────
```

宽度计算（替换旧 `INNER_WIDTH=70` 全框模型）：

```text
contentWidth = max(maxArtLineWidth, ('Spec-First v'+version).width, TAGLINE.width)
divider = '─'.repeat(contentWidth)   // 版本号变长 → contentWidth 变大 → 上下两线同步等长，无错位
```

wordmark（重复运行，单行，方向示意）：

```text
─ spec-first v1.2.3
```

---

## Implementation Units

### U1. 替换 brand.js 字形、边框模型与着色分层

**Goal:** 在单一来源 `src/cli/brand.js` 内完成视觉深化：厚重 `ansi_shadow` art、上下细分隔线、计算式宽度、品牌/次级色分层；移除旧双线框 helper 与 `INNER_WIDTH` 硬编码。

**Requirements:** R1, R2, R3, R5, R6, R7

**Dependencies:** None

**Files:**
- Modify: `src/cli/brand.js`

**Approach:**
- 将 `LOGO_LINES` 替换为定稿的 6 行 `ansi_shadow` block 字符串（字符集仅 `█` + box-drawing）。
- 删除 `topBorder()`/`bottomBorder()`，`frameLine()`/`padRight()` 全框 padding 逻辑与 `INNER_WIDTH` 常量。
- 新增 `computeContentWidth()`（取 art 最大行宽 / 版本行 / tagline 三者 max）与分隔线渲染：`'─'.repeat(width)`，着色用 `BrandColors.brand`。
- `renderFullArt` 重组为：上分隔线 → art（品牌色）→ 版本行（secondary）→ tagline（secondary）→ 下分隔线，行间不再用全框包裹；保留前导空格缩进与 `trimEnd` 兼容现有消费端。
- 着色全部经现有 `colorize()` + `resolveUseColor()`，降级路径（`NO_COLOR`/非 TTY/`TERM=dumb`/`FORCE_COLOR`）不改。

**Patterns to follow:**
- 现有 `colorize()` / `resolveUseColor()` / `detectColorSupport()` 的着色与降级写法（brand.js:20-70）。
- `BrandColors.brand`（分隔线/art）与 `BrandColors.secondary`（版本/tagline）。

**Test scenarios:**
- Happy path：`renderFullArt('1.2.3', {useColor:false})` 输出含上下两条 `─` 分隔线、6 行 art、版本行、tagline；不含 `╔`/`╗`/`║`/`╚`/`╝`。
- Covers AE8. Edge case：`{useColor:false}` 输出不含任何 ANSI 转义序列（`/\x1B\[/` 不匹配）。
- Covers AE5. Edge case：对短版本 `1.2.3` 与长版本 `10.20.30-beta.5` 分别渲染，两次输出的上、下分隔线长度各自相等，且上下两线等长（计算式宽度稳定）。
- Edge case：`renderFullArt(undefined)` / 空版本回退到 `unknown`，不抛错、结构完整。
- Happy path：`{useColor:true}` 时 art/分隔线含品牌色码、版本行/tagline 含 secondary(dim) 码，整体以 reset 收尾。
- Edge case：art 6 行可见宽度全部相等（矩形对齐）。

**Verification:**
- `renderFullArt` 纯文本输出为「分隔线包裹的厚重 block art + 分层品牌行」，无双线框字符，长短版本号对齐稳定。

---

### U2. wordmark 同步新风格

**Goal:** `renderWordmark` 升级到与 full art 一致的视觉语言（品牌色细线前缀），保持单行、不刷屏。

**Requirements:** R4, R5, R6

**Dependencies:** U1

**Files:**
- Modify: `src/cli/brand.js`

**Approach:**
- `renderWordmark(version, opts)` 在现有 `spec-first v<version>` 基础上加品牌色短线前缀（如 `─ `），`spec-first` 维持品牌色，`v<version>` 维持默认/次级色。
- 单行输出，复用 `resolveUseColor()` 降级；纯文本时前缀线降级为可读 `─`，无转义。

**Patterns to follow:**
- 现有 `renderWordmark`（brand.js:60-63）的单行 + `colorize` 写法。

**Test scenarios:**
- Happy path：`renderWordmark('1.2.3', {useColor:false})` 返回单行（不含换行），含 `spec-first` 与 `v1.2.3`，含新前缀字符 `─`。
- Covers AE8. Edge case：`{useColor:false}` 输出无 ANSI 转义序列。
- Happy path：`{useColor:true}` 时 `spec-first` 部分含品牌色码并以 reset 收尾。
- Edge case：空/缺省版本回退 `unknown`，仍单行不抛错。

**Verification:**
- 重复运行 init 时打印单行带品牌色前缀的 wordmark，与 full art 视觉呼应，不出现多行 art。

---

### U3. 更新 brand 单测与受影响 smoke 断言

**Goal:** 让测试反映新版式：重写 brand.test.js 中基于「全框等宽」的对齐断言为「分隔线宽度稳定」断言；核对并按需更新 `-v` smoke 版本 token 断言。

**Requirements:** R3, R8

**Dependencies:** U1, U2

**Files:**
- Modify: `tests/unit/brand.test.js`
- Modify (按需): `tests/smoke/cli.sh`

**Approach:**
- `brand.test.js:73-82` 的 `'... aligned across version lengths'`：旧断言要求「每行 length 全相等」（全框不变式），新版式 art 行与品牌文本行宽度本就不等，必须改为：(a) 上、下分隔线各自由 `─` 组成且二者等长；(b) 短/长版本号下分隔线长度随内容稳定（长版本 ≥ 短版本，且每次上下线一致）；(c) art 6 行彼此等宽。
- 保留并复用现有 `withColorEnv` / `visibleLines` / `ANSI_PATTERN` 工具与 `NO_COLOR`/`FORCE_COLOR` 用例（这些机制本轮不变）。
- 新增/调整断言覆盖 U1、U2 的 Test scenarios（无双线框字符、wordmark 前缀、着色分层）。
- 核对 `tests/smoke/cli.sh:107` 的 `grep -q "Spec-First v${expected_version}"`：若 U1 定稿版本行保留该子串则不改；若版式改写了 token，则同步更新该 grep。

**Patterns to follow:**
- `tests/unit/brand.test.js` 现有 `describe('brand rendering')` 结构、`withColorEnv`、`visibleLines`、`ANSI_PATTERN`。

**Test scenarios:**
- 本单元即测试本身；验证标准为新断言准确反映新版式且 `npm run test:unit` 通过。
- Happy path：`npm run test:unit` 中 brand 套件全绿。
- Happy path：`npm run test:smoke`（或至少 `tests/smoke/cli.sh`）中 `-v` 版本断言通过。

**Verification:**
- brand 单测断言新版式（分隔线稳定 + 无双线框 + 着色分层 + wordmark 前缀），smoke `-v` 版本 token 断言通过。

---

### U4. 同步 CHANGELOG（user-visible）

**Goal:** 按仓库格式与全局 developer profile 记录本轮用户可见视觉变更。

**Requirements:** R1, R2, R4（用户可见呈现变化）

**Dependencies:** U1, U2

**Files:**
- Modify: `CHANGELOG.md`

**Approach:**
- 在 `CHANGELOG.md` 现行格式下新增一条，描述 `spec-first init` / `-v` / postinstall 品牌 art 升级为厚重 block 字形 + 细分隔线排版、wordmark 同步新风格，标注 `(user-visible)`。
- `作者` 读取 `~/.spec-first/.developer` 全局 profile；缺失时按 CLAUDE.md 指引先 `spec-first init` 选择开发者再补。
- 按语言设置用中文撰写条目。

**Patterns to follow:**
- `CHANGELOG.md` 现有条目格式与作者/`(user-visible)` 标注约定（见 CLAUDE.md「Changelog」节）。

**Test scenarios:**
- Test expectation: none -- docs-only 变更，无行为可测；正确性由格式与作者字段人工核对保证。

**Verification:**
- `CHANGELOG.md` 含本轮视觉变更条目，含作者、`(user-visible)` 标注，格式与现行条目一致。

---

## System-Wide Impact

- **Interaction graph:** 改动入口为 `renderFullArt` / `renderWordmark` 两个导出函数；消费端 `src/cli/index.js`（`-v`）、`bin/postinstall.js`、`src/cli/commands/init.js`（首次/重复）均走稳定签名，无需改消费端代码。
- **Error propagation:** 渲染为纯字符串拼接，无 I/O、无抛错路径变化；空版本回退 `unknown` 行为保留。
- **State lifecycle risks:** 无。本轮不触碰 init 落盘、state、hash、managed block、untrack、drift 等任何状态写入路径。
- **API surface parity:** `renderFullArt(version, opts)` / `renderWordmark(version, opts)` 签名与返回类型不变，三处消费端一致继承新视觉，满足 origin AE6（三处一致）。
- **Integration coverage:** smoke `tests/smoke/cli.sh` 对 `-v` 输出、`tests/smoke/install-tarball.sh` 对安装路径的既有覆盖即跨层验证点；U3 确保 `-v` 版本 token 断言不被新版式破坏。
- **Unchanged invariants:** init 全部落盘产物、i18n 文案、next-step、交互 prompt 渲染、颜色降级判定（`NO_COLOR`/isTTY/`TERM`/`FORCE_COLOR`）、non-TTY 拒绝路径、tagline 文案——本轮逐项保持不变。

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| `ansi_shadow` 字形在个别终端/字体下 box-drawing 与 `█` 渲染不齐 | 字符集已验证全部落在 U+2550–U+2588 主流等宽覆盖区；art 静态 6 行已验证矩形等宽；如个别终端异常，问题局限于视觉、不影响功能与可解析信号。 |
| 新版式破坏 `tests/smoke/cli.sh` 的 `Spec-First v<version>` grep | U1 优先保留该子串；U3 显式核对并按需同步该断言，二选一在实现时定稿。 |
| brand.test.js 旧「全行等宽」断言对新版式失效被误判为回归 | U3 明确重写该断言为「分隔线稳定 + art 行等宽」，避免假阳性。 |
| 误把 graph-facts.json stale 当作需要在本计划内刷新 | 本计划为 lightweight 展示改动，Graph Readiness 已标 stale 并用 bounded direct reads；不在 plan/work 内跑 graph-bootstrap。 |

---

## Documentation / Operational Notes

- CHANGELOG 由 U4 处理（user-visible）。
- README / README_CN 当前未内嵌该 art 截图，无需改；若后续补品牌截图属独立任务。
- 无 rollout / 监控 / 迁移影响——纯展示层、无状态、无依赖变更。

## Completion Evidence

- completed_at: 2026-06-08
- implementation_scope: `src/cli/brand.js` 已使用 6 行厚重 block art、上下 `─` 分隔线、计算式宽度和单行 `renderWordmark` 前缀；`tests/unit/brand.test.js` 已覆盖分隔线稳定、无 ANSI 泄漏、wordmark 单行前缀与颜色降级。
- changelog_ref: `CHANGELOG.md` 已有 2026-05-30 `feat(brand)` 用户可见实现记录；本次补 2026-06-08 `docs(plan)` 状态收尾记录。
- verification:
  - `npx jest tests/unit/brand.test.js --runInBand`：passed（7 tests）
  - `bash tests/smoke/cli.sh`：passed（help/version、init、doctor、clean 等 smoke checks）
- generated_runtime_status: not touched；本计划为 source plan 状态收尾，不手改 `.claude/`、`.codex/`、`.agents/skills/` runtime mirrors。

---

## Sources & References

- **Origin document:** [docs/brainstorms/2026-05-29-002-spec-first-init-ux-brand-requirements.md](docs/brainstorms/2026-05-29-002-spec-first-init-ux-brand-requirements.md)
- 第一轮 plan（已合入，本轮在其上深化）：`docs/plans/2026-05-29-002-feat-spec-first-init-ux-brand-plan.md`
- 相关源：`src/cli/brand.js`、`src/cli/index.js:190`、`bin/postinstall.js:11`、`src/cli/commands/init.js:482`
- 相关测试：`tests/unit/brand.test.js`、`tests/smoke/cli.sh:107`
- 参考项目：`/Users/kuang/xiaobu/Trellis`（`packages/cli/src/commands/init.ts` figlet 厚重字形 + 无边框排版，作为视觉方向参照）
