---
spec_id: plan-2026-06-27-003-using-spec-first-functional-map
title: refactor: 收敛 using-spec-first SKILL 为功能地图为主面
type: refactor
plan_depth: standard
status: active
created: 2026-06-27
author: leokuang
origin: direct-user-request
---

# refactor: 收敛 using-spec-first SKILL 为功能地图为主面

## Summary

将 `skills/using-spec-first/SKILL.md` 从"路由器 + 治理执行混合体"(301 行)收敛为"功能地图为主面":把 **Routing Priority + Route Map** 作为唯一常驻路由面留在主文件,把治理执行 prose(双宿主翻译、dispatch 闸门、scope guards、Hard Rules、Routing Red Flags、scenario fingerprint、多会话、Codex startup reminder 等)下沉到 `references/*.md`,主文件只保留精简段 + 一行指针。

**不删内容、不破 evals 与 contract test。** 收敛靠"挪位不删字":被契约测试断言的字符串整体仍在 `using-spec-first` 包(SKILL + 7 references 的并集)内,只是从 SKILL 挪进已注册 reference;被直接钉死在 SKILL 的少数字符串(如 dispatch-boundary 测试的 4 行)保留在 SKILL。

## Direct Evidence

- target_repo: spec-first(当前仓库,单仓)
- source_refs:
  - `skills/using-spec-first/SKILL.md`(301 行,待收敛源)
  - `skills/using-spec-first/references/*.md`(7 个现有 reference)
  - `tests/unit/using-spec-first-contracts.test.js`(包并集 `containsAll` + reference 路径必现)
  - `tests/unit/spec-dispatch-boundary-contracts.test.js`(4 字符串直接钉死 SKILL)
  - `tests/unit/instruction-bootstrap.test.js`(managed block 行数上界 8-26)
  - `src/cli/instruction-bootstrap.js`(`buildBootstrapBlock` 代码硬编码,不从 SKILL 派生)
  - `CLAUDE.md` / `AGENTS.md` 的 `spec-first:bootstrap` managed block
- current_revision: `leo-2026-06-25-work-update` 分支 HEAD
- worktree_dirty: 是(存在与本计划无关的既有 M/?? 文件)
- discovery_methods: `rg` / `sed` / `ls` / 源码直读
- tests_or_logs: 未运行(Plan-Only,未执行测试)
- confidence: 高 — 测试影响面已逐条核对
- limitations: 未逐行读完 7 个 reference 全文;未运行测试套件验证(planning-only);未读 `routing-cases.json` 全量 case

## Problem Frame

`using-spec-first` 是 spec-first 唯一随 SessionStart 注入的触点,因此双宿主翻译、dispatch 闸门、source/runtime 边界、多会话披露等治理执行职责全堆进路由器,使 SKILL.md 膨胀到 301 行,读起来像"违规史档案"而非路标。用户要的是 (A) 方案:**功能地图当主面,治理 prose 下沉到 references,不删内容、不破 evals/test**。

## Goals

- SKILL.md 主面回到 ~80-110 行,以 Routing Priority + Route Map 为唯一常驻路由面。
- 治理执行 prose 整体下沉到 `references/*.md`,主文件只留精简段 + 一行指针。
- 契约测试与 evals 全绿:`using-spec-first-contracts.test.js`、`spec-dispatch-boundary-contracts.test.js`、`instruction-bootstrap.test.js`、`lint-skill-entrypoints.test.js`、`init-source-path-coverage.test.js` 等。
- managed block 与 bootstrap 不动(已确认解耦)。
- 双宿主(Claude `/spec:*` / Codex `$spec-*`)行为不变。

## Non-Goals

- 不删任何被测试断言的内容(只挪位)。
- 不改 `buildBootstrapBlock` 代码模板 / managed block 文案。
- 不改 evals fixture(`routing-cases.json` / `routing-discipline-cases.json` / `examples.json`)的 case 内容。
- 不重构 Route Map 的入口表本身(只搬位置)。
- 不引入新路由语义、不新增"不要做 X"硬规则。
- 不动其它 skill / agent / CLI 源码。

## Key Technical Decisions

### K1. 下沉策略 = 挪位不删字,优先落进已注册 reference

`using-spec-first-contracts.test.js` 的 `readUsingSpecFirstPackage()` 把 SKILL + 7 references 拼成**并集**再做 `containsAll`。因此把被断言字符串从 SKILL 挪进**已注册的 7 个 reference 之一**,并集不变,断言通过。新增 reference 文件需同步加入该测试的 `USING_SPEC_FIRST_REFERENCES` 数组(加法,非破坏)。

### K2. Dispatch Boundaries 不能整段下沉,4 行钉死 SKILL

`spec-dispatch-boundary-contracts.test.js` 直接 `read('skills/using-spec-first/SKILL.md')` 断言以下 4 段必须在 SKILL 本体:

- `Workflow Dispatch Admission`
- `It does not by itself override host-level subagent tool contracts.`
- `current request explicitly asks for subagents, delegated work, parallel agents, persona reviewer dispatch`
- `visible parent request or handoff evidence includes explicit subagent/delegation/parallel/persona wording`

→ Dispatch Boundaries 在 SKILL 保留一个含这 4 行的精简 stub + 指针;详细 elaboration 下沉到新 reference `dispatch-boundaries.md`(见 K4)。

### K3. managed block / bootstrap 完全不动

`buildBootstrapBlock` 是 `src/cli/instruction-bootstrap.js` 的代码硬编码模板,不从 SKILL.md 派生;`instruction-bootstrap.test.js` 断言的是 block 本身(行数 8-26、四段措辞),与 SKILL 长度无关。SKILL 缩减后,managed block 内"完整路由表…仍在 `skills/using-spec-first/SKILL.md`"指针仍成立(因 Route Map 仍在 SKILL)。→ **managed block 与 bootstrap 代码零改动**。

### K4. 新增 1 个 reference:`scope-guards.md`;Dispatch 详细进新 reference `dispatch-boundaries.md`

Scope Guards(Already In Workflow / Subagent / Substantial Work / Lightweight Direct Outcomes / Spec-First Self-Work,约 50 行)无现成对应 reference,是最大块治理 prose → 新建 `references/scope-guards.md` 承接。Dispatch 详细 elaboration(超出 K2 钉死 4 行的部分)新建 `references/dispatch-boundaries.md` 承接。两者均需加入测试的 `USING_SPEC_FIRST_REFERENCES` 数组。

> 备选(不采用):把 Scope Guards 折进现有 `output-risk-profile.md`。否决理由:语义不契合(output-risk 讲输出失败模式,scope-guards 讲准入豁免),且单一 reference 单一职责更可维护。

### K5. 主文件保留段(功能地图骨架)

保留并精简:intro 身份段、Contract Summary 表(身份契约,测试名即 "entry-governor contract")、Reference Files 列表(测试要求 7+ 路径全在 SKILL)、Source Of Truth And Runtime Surface(精简,身份 + faithful-subset 指针)、Decision Output Contract(精简)、Dispatch Boundaries stub(K2 的 4 行 + 指针)、**Routing Rules = Routing Priority + Route Map(核心,完整保留)**、Exit Condition。

## 搬迁映射表(Source SKILL 段 → 目标 reference)

| SKILL.md 现有段 | 处置 | 目标 |
|---|---|---|
| intro 身份段(6-13) | 保留精简 | SKILL(留) |
| Contract Summary 表(15-28) | 保留 | SKILL(留,身份契约) |
| Examples As Context(30-36) | 保留精简 | SKILL(留) |
| Reference Files(38-48) | 保留并追加 2 个新 reference 路径 | SKILL(留) |
| Source Of Truth And Runtime Surface(50-58) | 精简留身份段;runtime repair 细节下沉 | SKILL(留精简)+ `maintenance-and-fresh-source-eval.md`(细节) |
| Scope Guards / If You Are Already In A Workflow(62-66) | 下沉 | **新 `scope-guards.md`** |
| Scope Guards / If You Are A Subagent(68-70) | 下沉 | **新 `scope-guards.md`** |
| Scope Guards / What Counts as Substantial Work(72-88) | 下沉 | **新 `scope-guards.md`** |
| Scope Guards / Lightweight Direct Outcomes(90-98) | 下沉 | **新 `scope-guards.md`** |
| Scope Guards / Spec-First Self-Work(100-115) | 下沉 | **新 `scope-guards.md`** |
| Multi-Session Awareness(117-125) | 下沉(已重复) | `multi-session-awareness.md` |
| Decision Output Contract(127-137) | 保留精简 | SKILL(留精简) |
| Skill Trigger vs Workflow Admission(139-143) | 下沉 | **新 `scope-guards.md`** |
| User Next-Step Guide Mode(145-161) | 下沉详细,留 1 行指针 | `user-next-step-guide-mode.md` |
| Scenario Fingerprint Routing(163-167) | 下沉(已重复) | `scenario-fingerprint-routing.md` |
| Routing Rules / Explicit Route Normalization(173-179) | 保留 | SKILL(留,路由面) |
| Routing Rules / Routing Priority(181-194) | 保留 | SKILL(留,路由面核心) |
| Routing Rules / Route Map(196-221) | 保留 | SKILL(留,路由面核心) |
| Parent Workspace Direct Reads(225-227) | 下沉 | **新 `scope-guards.md`** |
| Workflow Dispatch Admission(231-241) | 留 K2 的 4 行 stub + 指针;详细下沉 | SKILL(留 stub)+ **新 `dispatch-boundaries.md`**(详细) |
| Host Surface(243-250) | 下沉 | **新 `dispatch-boundaries.md`** |
| Codex Startup Reminder Boundary(252-262) | 下沉(已重复) | `codex-startup-reminder-boundary.md` |
| Injection Behavior(264-271) | 保留精简 | SKILL(留精简) |
| Hard Rules(273-284) | 下沉 | `routing-red-flags.md` |
| Routing Red Flags(286-288) | 下沉(已重复) | `routing-red-flags.md` |
| Artifact And Evidence Boundaries(290-296) | 保留精简 | SKILL(留精简) |
| Exit Condition(298-301) | 保留 | SKILL(留) |

预计 SKILL.md 收敛至 ~90-110 行。

## Context & Research

### 契约测试影响面(逐条核对)

1. **`using-spec-first-contracts.test.js` — test: `source skill defines the entry-governor contract`**
   机制:`readUsingSpecFirstPackage()` = SKILL + 7 references 并集,`containsAll` 长串。
   影响:把字符串挪进**已注册 reference** → 通过;挪进**新 reference** → 必须把新文件加入 `USING_SPEC_FIRST_REFERENCES` 数组,否则并集看不到 → 断言失败。
   措置:新增 `scope-guards.md` / `dispatch-boundaries.md` 时同步加数组(加法)。

2. **`using-spec-first-contracts.test.js` — test: `references are source package assets`**
   机制:读**仅 SKILL**,断言 7 个 reference 路径全在 SKILL。
   影响:新增 2 个 reference → SKILL 的 Reference Files 段必须追加这 2 个路径;测试数组也加。
   措置:同步追加。

3. **`spec-dispatch-boundary-contracts.test.js`**
   机制:直接读 SKILL 断言 4 字符串(见 K2)。
   影响:Dispatch Boundaries 不能整段走。
   措置:留 stub(K2)。

4. **`instruction-bootstrap.test.js`**
   机制:断言代码生成的 managed block,与 SKILL 解耦。
   影响:无。
   措置:不动。

5. **`lint-skill-entrypoints.test.js` / `init-source-path-coverage.test.js` / `skills-governance.json`**
   机制:治理在 skill 目录粒度,不枚举 reference 文件。
   影响:新增 reference 文件安全。
   措置:无需注册。

6. **evals(`routing-cases.json` / `routing-discipline-cases.json` / `examples.json`)**
   机制:`source_refs` 仅标注 provenance;case 由 LLM eval 判,非对 SKILL 行内容的字符串断言。
   影响:无。
   措置:不动 fixture。

### 现有 reference 承接能力

- `routing-red-flags.md`:单标题 `# Routing Red Flags`,有空间吸收 Hard Rules(10 条)。
- `codex-startup-reminder-boundary.md` / `scenario-fingerprint-routing.md` / `multi-session-awareness.md` / `user-next-step-guide-mode.md`:已承载对应详细内容,SKILL 现段多为重复,删 SKILL 重复 + 留指针即可。
- `output-risk-profile.md` / `maintenance-and-fresh-source-eval.md`:不动(output-risk 不承接 scope;maintenance 可承接 runtime-repair 细节)。

## Implementation Units

### U1. 新建 `references/scope-guards.md` 承接 Scope Guards 全量内容

- **Goal**:把 SKILL 的 Scope Guards 五小节 + Skill Trigger vs Workflow Admission + Parent Workspace Direct Reads 整体迁入新 reference。
- **Requirements**:承接并集中的相关断言字符串(如 `If You Are Already In A Workflow`、`If You Are A Subagent`、`Lightweight Direct Outcomes`、`Spec-First Self-Work`、`clearly scoped, single-point, low-risk code/prose/config edits`、`reclassify it at that point and route normally`、`Parent Workspace Direct Reads`、`explicit target_repo / per-child scope`、`A skill trigger is source/methodology loading`、`do not convert it into public workflow admission` 等)。
- **Dependencies**:无
- **Files**:
  - 创建 `skills/using-spec-first/references/scope-guards.md`
  - 修改 `tests/unit/using-spec-first-contracts.test.js`(把 `scope-guards.md` 加入 `USING_SPEC_FIRST_REFERENCES` 数组)
- **Approach**:逐字搬迁,保留小标题层级;不重写措辞(保断言)。新 reference 顶部加一行"本文件承接 SKILL 主面的 scope guards 详细规则"说明。
- **Patterns to follow**:对齐现有 reference(如 `routing-red-flags.md`)的 `# Title` + 小节风格。
- **Test scenarios**:
  - 并集断言:搬迁后 `readUsingSpecFirstPackage()` 仍含上述每条字符串
  - 数组覆盖:`scope-guards.md` 加入数组后 `references are source package assets` 测试对新条目 `existsSync` 通过
- **Verification**:`npm run test:unit -- using-spec-first-contracts` 绿。

### U2. 新建 `references/dispatch-boundaries.md` 承接 Dispatch 详细

- **Goal**:把 Workflow Dispatch Admission / Host Surface 的**详细 elaboration**(超出 K2 钉死 4 行的部分)迁入新 reference;SKILL 只留含 4 钉死行的 stub + 指针。
- **Requirements**:并集仍含 `Workflow Dispatch Admission`、`call spawn_agent only when...`、`Some public workflows prefer multi-persona...`、`$spec-doc-review multi-persona document reviewers`、`record dispatch_authorization_missing`、`If the user names spec-doc-review...without the $ prefix`、`follow that workflow's documented fallback`、`Codex workflow entrypoints use $spec-*`、`Claude workflow entrypoints use /spec:*`、`$spec-doc-review means the document-review workflow` 等。
- **Dependencies**:U1(同批改测试数组)
- **Files**:
  - 创建 `skills/using-spec-first/references/dispatch-boundaries.md`
  - 修改 `tests/unit/using-spec-first-contracts.test.js`(加 `dispatch-boundaries.md` 入数组)
- **Approach**:SKILL 保留一个"Workflow Dispatch Admission"小节,内含 K2 的 4 行 + "详细规则见 `references/dispatch-boundaries.md`"指针;其余迁入新 reference。
- **Test scenarios**:
  - `spec-dispatch-boundary-contracts.test.js` 4 钉死行仍在 SKILL → 通过
  - 并集仍含全部 dispatch 相关字符串 → 通过
- **Verification**:`npm run test:unit -- spec-dispatch-boundary-contracts using-spec-first-contracts` 绿。

### U3. 下沉已有对应 reference 的重复段

- **Goal**:删 SKILL 中与现有 reference 重复的段,各留 1 行指针。
- **Requirements**:并集不变。
- **Dependencies**:U1、U2(测试数组已扩)
- **Files**:
  - 修改 `skills/using-spec-first/SKILL.md`
  - 不动 `references/multi-session-awareness.md` / `scenario-fingerprint-routing.md` / `codex-startup-reminder-boundary.md` / `user-next-step-guide-mode.md`(已含内容)
- **Approach**:
  - Multi-Session Awareness → 留 `spec-first session list` 一行 + 指针 `multi-session-awareness.md`
  - Scenario Fingerprint Routing → 留 1 行指针 `scenario-fingerprint-routing.md`
  - Codex Startup Reminder Boundary → 留 1 行指针 `codex-startup-reminder-boundary.md`
  - User Next-Step Guide Mode → 留输出格式骨架 + 指针 `user-next-step-guide-mode.md`(注意并集要求 `推荐入口:` / `理由:` / `下一步:` 三行模板在包内;确认是否已在 reference,若仅在 SKILL 则连同模板下沉)
- **Test scenarios**:
  - 并集断言全通过(各段被断言字符串仍在对应 reference)
  - `references are source package assets`:SKILL 仍含全部 9 个 reference 路径(7 旧 + 2 新)
- **Verification**:`npm run test:unit -- using-spec-first-contracts` 绿。

### U4. 下沉 Hard Rules + Routing Red Flags 到 `routing-red-flags.md`

- **Goal**:把 Hard Rules(10 条)与 Routing Red Flags 段迁入 `routing-red-flags.md`。
- **Requirements**:并集仍含每条 Hard Rule 字符串(`Do **not** make spec-brainstorm the universal default front door`、`Do **not** adopt the using-superpowers rule`、`Do **not** write Codex entrypoints as /spec:*`、`Do **not** write Claude workflow entrypoints as $spec-*`、`Do **not** expose internal-only skills as user entrypoints`、`git-worktree`、`Do not chain multiple workflows automatically` 等)。
- **Dependencies**:U3
- **Files**:
  - 修改 `skills/using-spec-first/references/routing-red-flags.md`(追加 Hard Rules 小节)
  - 修改 `skills/using-spec-first/SKILL.md`(删原段,留 1 行指针)
- **Approach**:`routing-red-flags.md` 现有 `# Routing Red Flags`,追加 `## Hard Rules` 小节承接 10 条;SKILL 留指针。
- **Test scenarios**:
  - 并集含全部 Hard Rule 字符串 → 通过
  - `lint-skill-entrypoints` 仍禁 `/spec:using-spec-first` → 通过
- **Verification**:`npm run test:unit -- using-spec-first-contracts lint-skill-entrypoints` 绿。

### U5. 收敛 SKILL 主面 + 同步 Runtime Mirror

- **Goal**:SKILL.md 最终化为功能地图骨架(K5),并让 generated runtime mirror 跟上。
- **Requirements**:SKILL 保留 intro / Contract Summary / Reference Files(9 路径)/ Source Of Truth 精简 / Decision Output Contract 精简 / Dispatch stub / **Routing Priority + Route Map** / Injection Behavior 精简 / Artifact Boundaries 精简 / Exit Condition。
- **Dependencies**:U1-U4
- **Files**:
  - 修改 `skills/using-spec-first/SKILL.md`(最终裁剪,目标 ~90-110 行)
  - 更新 `CHANGELOG.md`(source 变更必更)
  - 重新生成 runtime mirror:`spec-first init`(选定目标 host),同步 `.claude/skills/using-spec-first/` 与 `.agents/skills/using-spec-first/`(若有 Codex)
- **Approach**:裁剪后再通读一遍,确保每个被测试断言的字符串要么在 SKILL 要么在已注册 reference;Route Map 表完整不动。
- **Test scenarios**:
  - 全量契约 + 入口治理测试绿
  - `spec-first doctor --claude` / `--codex` 报 source/runtime 一致
- **Verification**:`npm run test:unit`、`npm run test:smoke`、`npm run lint:skill-entrypoints` 绿。

## Test Plan

主验证命令(由窄到宽):

1. `npm run test:unit -- using-spec-first-contracts`(包并集 + reference 路径)
2. `npm run test:unit -- spec-dispatch-boundary-contracts`(4 钉死行)
3. `npm run test:unit -- instruction-bootstrap`(managed block 解耦确认)
4. `npm run test:unit -- lint-skill-entrypoints init-source-path-coverage`(治理 + 覆盖)
5. `npm run test:unit`(全量单测)
6. `npm run test:smoke`(CLI/init/doctor)
7. `spec-first doctor --claude` 与 `--codex`(runtime 一致)

fresh-source eval(行为语义验证,按 CLAUDE.md Agent/Skill 变更验证要求):把收敛后的 SKILL + references 注入一个全新通用 subagent,验证路由姿态不漂移(单点准入、不自动串联、轻量豁免、双宿主入口拼写)。若宿主无 dispatch primitive 则记录未执行原因,不得声称通过。

## Risks

- **R1 并集断言漏迁**:某条 `containsAll` 字符串既不在 SKILL 也不在已注册 reference → 测试红。**缓解**:搬迁映射表逐条对照断言清单;每迁一段跑一次 `using-spec-first-contracts`。
- **R2 新 reference 未加测试数组**:并集看不到新文件内容 → 断言红。**缓解**:U1/U2 同步改数组。
- **R3 钉死 SKILL 的 4 行被误删**:dispatch 测试红。**缓解**:K2 明确 stub 保留;U2 单测先验。
- **R4 Runtime mirror 漂移**:source 改了未 `spec-first init` → doctor 报不一致。**缓解**:U5 末尾 `spec-first init` + doctor 验证。
- **R5 行为语义漂移(测试覆盖不到)**:prose 下沉后 LLM 路由姿态变化但契约测试不报。**缓解**:U5 fresh-source eval。

## Deferred to Follow-Up Work

- 评估是否进一步把 Contract Summary 表本身也下沉(当前保留为身份契约,未动)。
- 评估 `output-risk-profile.md` 是否需要同步更新(当前不动)。
- 是否把"路由"与"治理准入"拆成两个 skill(牵动 SessionStart 注入,契约级,不在本计划)。

## Assumptions

- 现有 7 个 reference 已含其主题详细内容,SKILL 现段多为重复指针性复述(U3 假设;实施时逐段核对,若某段 detail 仅在 SKILL 则连同 detail 下沉而非删)。
- `buildBootstrapBlock` 代码模板不在本计划修改范围(K3)。
- 不新增路由语义、不新增硬规则(Non-Goals)。
