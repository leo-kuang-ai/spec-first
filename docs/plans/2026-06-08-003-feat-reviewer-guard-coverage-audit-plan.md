---
spec_id: 2026-06-08-003-reviewer-guard-coverage-audit
status: completed
plan_depth: standard
origin: docs/brainstorms/2026-06-08-002-brooks-lint-integration-two-skills-requirements.md
origin_identity: not-inherited（origin 为 legacy 无 spec_id 文档;本 plan 经多轮辩证 + deep-research 证据裁决已显著重构,requirements↔plan 为弱 trace）
evidence_base: docs/solutions/tooling-decisions/2026-06-08-brooks-lint-content-mechanisms-rejected.md（deep-research run wf_12fb0d5f-900）
supersedes: 本文件历经 reviewer-decay-vocabulary（词表，已被证据否决）→ guard-coverage-audit（审计机制）两版,本版基于实诊补入"真缺口"
---

# feat: 补齐高误报风险 reviewer 的 over-flag 守卫 + skill-review 守卫完整性维度

**Target repo:** spec-first（当前仓库）

---

## Problem Frame

### 出发点与证据裁决

出发点:以 brooks-lint 为参照系提升 spec-first review Agent 质量,约束是"确保最终实现能提升质量"。

经 deep-research(103 agents、5 角度、3 票对抗验证,见 evidence_base)外部证据裁决,五个候选机制分层明确:

| 机制 | 证据 | 裁决 |
|---|---|---|
| ④ 减少误报的聚焦/护栏 | **强(3-0 ×2)** | ✅ 唯一证据最强方向 |
| ② 维度分解原理 | 中(FLASK) | spec-first persona 已实现 |
| ③ 数值健康分 | 强反向(3-0 ×7) | ❌ 已归档否决 |
| ① 出处/角色锚定 | 强反向(3-0 ×5) | ❌ 已归档否决 |
| ⑤ 命名词表 | 强反向(3-0 ×6) | ❌ 已归档否决 |

①③⑤ 的否决已沉淀于 evidence_base。**本 plan 只做有强证据支撑的方向:④ 减少误报。**

### 本地实诊(确保是 spec-first 的真缺口,非外部外推)

证据证明"聚焦/护栏机制有效",但未证明"spec-first 缺它"。故对全部 29 个 reviewer agent 实诊 over-flag 守卫现状:

- **整体健全**:26/29 reviewer 有 "What you don't flag" 专门段;结构化 code/doc-review persona 另有统一的 confidence anchor(0/25/50/75/100 + advisory 路由,定义于 subagent-template)——降噪机制已强(注:原生输出 agent 如 code-simplicity 不共享该 anchor 契约)。（**修正了早期"守卫普遍不足"的错误判断**)
- **真缺口 = 3 个 reviewer 无守卫段,且恰是高误报风险类型**:
  - `spec-code-simplicity-reviewer`(守卫 0 / 专门段 0)— YAGNI/简化判断**高度主观、最易误报**
  - `spec-design-implementation-reviewer`(0 / 0)— Figma 视觉比对
  - `spec-cli-agent-readiness-reviewer`(守卫信号 3 但无专门段)— 守卫零散未成段
- **结构缺口**:无任何机制保证"声明审 X 维度的 reviewer 都有对应守卫"——缺口靠人肉 grep 才发现。

### 落点

机制④ 的 spec-first 形态 = **两件事**:(a) 补齐 3 个高误报风险 reviewer 的 over-flag 守卫段(直接降误报,证据方向直接对应);(b) 给 skill-review 加守卫完整性审计维度(保证未来不再悄悄出现守卫真空)。

## Goals

- **G1(直接降误报)**:为 3 个无守卫段的高误报风险 reviewer 补结构化 "What you don't flag" 段,内容基于各自职责的真实误报模式(非 brooks-lint 词表)。
- **G2(防回归)**:给 `retired-skill-review` 加一条 P2 审计维度,审出"声明审查维度但无对应 over-flag 守卫"的 reviewer。
- 两者方向均与最强证据(机制④ 降误报)一致;G1 直接提质,G2 保证不回退。

## Non-Goals

- ❌ 不引入 brooks-lint 的 ①出处引用 / ③健康分 / ⑤命名词表(已带证据否决,见 evidence_base)。
- ❌ 不动已有守卫段的 26 个 reviewer(它们守卫健全,改动违反"精准修改")。
- ❌ 不改 confidence anchor 体系(实诊证明它已是健全的统一降噪层)。
- ❌ 不新增 agent、不加 review finding schema / 配置 / health score / 维度框架。U2 可新增一个轻量事实 artifact contract,但只承载脚本可确认的 reviewer guard coverage 布尔事实,不承载语义结论。
- ❌ 守卫完整性审计是 advisory P2 信号,非门禁(对齐 skill-review "signals not gates")。

---

## Direct Evidence

- target_repo: spec-first
- source_refs: 全部 `agents/spec-*-reviewer.agent.md`(29 个)、`skills/spec-code-review/references/subagent-template.md`、`skills/retired-skill-review/references/expert-audit-rubric.md`、`agents/spec-{code-simplicity,design-implementation,cli-agent-readiness}-reviewer.agent.md`
- current_revision: branch leo-2026-06-03-ceupdate(工作树含无关改动)
- worktree_dirty: true
- discovery_methods: 全量 grep 守卫密度实诊 + deep-research 外部证据
- key_findings:
  - 26/29 reviewer 有守卫段;结构化 persona 的 confidence anchor 统一在 subagent-template(原生输出 agent 不共享)
  - 3 个高误报风险 reviewer 缺守卫段:code-simplicity / design-implementation / cli-agent-readiness
  - 无机制保证守卫完整性(architecture-strategist 是 plan-only standalone,不在 code-review catalog,实诊已确认)
- confidence: 高——缺口由全量实诊确认,非抽样;改动目标明确
- limitations: "补守卫降误报"的因果由外部证据(机制④)间接支撑,无 spec-first 专属 before/after 误报基线;G1 效果由 fresh-source eval 定性验证,非量化

---

## Requirements Trace

- R1(降误报):3 个高误报 reviewer 获得职责对应的 over-flag 守卫 → U1
- R2(守卫质量):补的守卫基于真实误报模式、可被反证,非通用模板 → U1
- R3(防回归):skill-review 能审出守卫真空 → U2
- R4(不误伤对抗类):审计对职责即激进质疑的 reviewer 标 N/A → U2

---

## Key Technical Decisions

- **守卫内容来源**:不用 brooks-lint 词表(已否决),而是从各 reviewer 自身 "What you're hunting for" 声明的维度,反推"该维度下什么是合理的、不该 flag 的"。例:code-simplicity 的"YAGNI 违规"→守卫"有明确近期需求的抽象不算 YAGNI / 框架约定要求的结构不算过度设计"。
- **挂载点(G2)**:守卫完整性检查项加入 `expert-audit-rubric.md` 的 **P2** 段(质量信号,与 "progressive disclosure weak" 同级),配反证提示。U2 还需要把 reviewer guard coverage 事实写入 audit artifact 输出清单,让 rubric 判断有事实输入;是否修改 `SKILL.md` 取决于新增 artifact 是否需要进入 workflow Outputs / read step,不能只靠 rubric 文案隐式生效。
- **审计判定交给 LLM**:审计项描述信号,由 audit LLM 做"维度↔守卫对应 + 反证"语义判断,不写脚本机械计数(会误报),走现有 `signal→evidence→counter-evidence→decision` 链。

---

## Implementation Units

### U1. 补齐 3 个高误报风险 reviewer 的 over-flag 守卫段

**Goal:** 给 code-simplicity / design-implementation / cli-agent-readiness 补结构化 "What you don't flag" 段,直接降误报。
**Requirements:** R1, R2
**Dependencies:** 无
**Files:**
- `agents/spec-code-simplicity-reviewer.agent.md`(改:新增守卫段)
- `agents/spec-design-implementation-reviewer.agent.md`(改:新增守卫段)
- `agents/spec-cli-agent-readiness-reviewer.agent.md`(改:零散守卫归整为专门段)
**Approach:**

**前置事实(审查纠正,必读):** 这 3 个目标 agent 是**原生输出 agent,不共享结构化 JSON persona 的 confidence anchor 契约**(已核实:code-simplicity 输出 markdown Simplification Analysis;design-implementation 输出 ✅/Minor/Major discrepancy;cli-agent-readiness 用 Blocker/Friction/Optimization)。**守卫的"命中则降级"必须用各 agent 自己的输出契约表达,不能套 confidence 0/25/advisory。** 早期 plan 说"所有 reviewer 共享 confidence anchor"是错的——那只适用于 code/doc-review 的结构化 persona。

- 每个 reviewer 加一个 "What you don't flag" 段,3-5 条,基于该 reviewer 声明维度的真实误报模式,**降级动作用各自原生契约表达**:
  - code-simplicity:有近期消费者的抽象不算 YAGNI / 框架约定结构不算过度设计 / 测试替身/适配器不算多余间接 / 可读性优先于行数的展开不算复杂。→ 命中则**不列入 Simplification Analysis**。
  - design-implementation:设计稿未规定的实现细节不算偏差 / 响应式断点的合理差异不算 fidelity 问题 / 占位数据不算实现错误。→ 命中则**不列为 Minor/Major discrepancy**。
  - cli-agent-readiness:把现有零散守卫信号(3 处)归整成专门段。→ 命中则**评为 None/Observation,不升为 Blocker/Friction/Optimization**。
- 参照现有 reviewer 的守卫段写法,但**风格对齐各 agent 自身输出格式**,不强行统一成 schema 化 persona 的写法。
**Patterns to follow:** 同类原生输出 agent 的 "What you don't flag" 段(若有);结构化 persona 的 confidence-anchor 守卫写法**不适用**于这 3 个。
**Test scenarios:** Test expectation: none -- agent prose,降误报效果由 U3 fresh-source eval 验证(无量化误报基线)。
**Verification:** 3 个 reviewer 各含 "What you don't flag" 专门段;守卫基于自身职责 + 用各自原生输出契约表达降级(无 confidence anchor 误植);未改动其余 26 个 reviewer。

### U2. skill-review 增守卫完整性 P2 审计维度(rubric + 确定性事实输入)

**Goal:** 让 skill-review 能审出"声明审查维度但无对应 over-flag 守卫"的 reviewer,防未来回归。
**Requirements:** R3, R4
**Dependencies:** 无（与 U1 独立，可并行）

**前置事实(审查纠正,必读):** skill-review 的确定性采集器 `collect-skill-facts.js` 的 `resolveSkillDirs` **只枚举 `skills/`,完全不扫 `agents/`**(已核实 collect-skill-facts.js:73)。SKILL.md 流程也是"先跑 write-audit-artifacts.js 产出 facts,再套 rubric"(SKILL.md:166)。**因此只改 rubric 文案,审计 LLM 拿不到 reviewer-agent inventory,新 P2 维度无输入、防回归落空。** rubric 改动必须配一个最小的 agent guard-coverage 事实采集,否则 G2 不成立。

**Files:**
- `skills/retired-skill-review/scripts/collect-skill-facts.js`(改:新增 reviewer-agent guard-coverage 事实采集)或新增一个小脚本,由 `write-audit-artifacts.js` 调用
- `skills/retired-skill-review/scripts/write-audit-artifacts.js`(改:写出 reviewer guard coverage artifact,或把扩展字段并入既有 inventory)
- `skills/retired-skill-review/SKILL.md`(按 artifact 选择更新 Outputs / read step,确保 workflow 实际消费该事实)
- `skills/retired-skill-review/references/expert-audit-rubric.md`(改:P2 加检查项)
- `tests/unit/skill-review-scripts.test.js`(改:覆盖 reviewer guard coverage 事实采集/写出)
**Approach:**
- **确定性事实(脚本,Scripts-prepare)**:采集 `agents/spec-*-reviewer.agent.md` 的最小事实清单——每个 reviewer 的:文件名、是否存在 "What you're hunting for"(或等价声明段)、是否存在 "What you don't flag" 守卫段、是否在 code-review/doc-review persona catalog(vs plan-only standalone)。**只产出存在性/布尔事实,不做语义判断、不计数阈值。**
- **Artifact contract**:优先新增 `reviewer-guard-coverage-report.json`(schema version 例如 `spec-first.reviewer-guard-coverage-report.v1`,producer=`retired-skill-review/scripts`,consumer=`retired-skill-review` rubric review)。若选择并入 `skill-source-inventory.json`,必须明确字段与版本/consumer,并补对应 contract test。两种路径都不新增 review finding schema。
- **语义判断(rubric/LLM,LLM-decides)**:P2 段新增一条——review-style agent 声明了审查维度但 over-flag 守卫段缺失/不覆盖 → advisory 完整性信号,建议补守卫,非自动改写。LLM 基于上面的事实清单做"维度↔守卫是否对应"判断。
- 配反证(对齐 Decision Evidence Rule):职责即激进质疑的 agent(adversarial 类)可合理省略守卫,标 N/A 而非 flag。
- **边界**:脚本采集严格遵守 Scripts-prepare/LLM-decides——不让脚本机械计数守卫条数得结论(会误报),只给存在性事实。
**Patterns to follow:** `collect-skill-facts.js` 现有事实采集结构;expert-audit-rubric P2 现有条目 + Decision Evidence Rule 的 signal→evidence→counter-evidence→decision。
**Test scenarios:**
- fixture 单测:一个缺 guard reviewer 标 `has_guard_section=false`;一个已有 guard reviewer 标 true;一个 adversarial/N/A reviewer 事实仍只标布尔,是否 N/A 交给 rubric/LLM 判断。
- 当前 repo 最终状态验证:U1 完成后 29/29 reviewer 应有 "What you don't flag" 段;防回归能力由 fixture 单测证明,不要求最终 source 保留 3 个缺口。
- Test expectation: 给采集脚本与 artifact 写出补最小单测(reviewer 列表非空、布尔字段正确、artifact 出现在 audit run files / Outputs 中),对齐仓库 tests/unit 习惯。
**Verification:** 脚本产出 reviewer guard-coverage 事实 artifact;P2 含守卫完整性检查项 + 反证提示;rubric 判断有事实输入支撑;当前 repo 最终 29/29 reviewer 有守卫段。

### U3. 验证、runtime 同步与文档

**Goal:** 验证 U1/U2 有效、同步双宿主 runtime、更新 CHANGELOG。
**Requirements:** 全部(收口)
**Dependencies:** U1, U2
**Files:**
- `CHANGELOG.md`(改)
- `.claude/` / `.codex/` / `.agents/skills/`(经 `spec-first init` 重新生成,不手改)
**Approach:**
- **fresh-source eval**(agent/skill prose 受会话缓存影响,按 `docs/contracts/workflows/fresh-source-eval-checklist.md`):
  - U1:对 code-simplicity reviewer 注入改后源文件,喂一段"有近期消费者的抽象",验证它**不**误报为 YAGNI(守卫生效);喂一段真 YAGNI,验证仍正常 flag(守卫不过度抑制召回——回应研究 openQuestion"护栏多严才净正收益")。
  - U2:用 fixture 或临时改前 source snippet 让 reviewer-guard coverage fact 显示缺口,再用改后 rubric 审缺 guard code-simplicity fixture → 报守卫缺口;审 adversarial-reviewer fixture → 不报(反证 N/A)。不要依赖最终 source 上 code-simplicity 仍缺 guard。
  - 无法 dispatch 时记录未执行原因。
- **runtime 同步**:Claude 命令模板会把 `skills/retired-skill-review/SKILL.md` 渲染为 runtime workflow(templates/claude/commands/spec/skill-review.md:10),且 Claude runtime 当前**已存在** `.claude/spec-first/workflows/retired-skill-review/references/expert-audit-rubric.md`——**rubric 在 Claude 宿主会被投影,早期 plan "Claude 不 mirror references / G2 可能 Codex-only" 的担忧是反事实,已删除**。正确动作:改 source 后 `spec-first init`,用 `spec-first doctor --claude/--codex` 确认 source 改动已投影到两宿主对应 runtime root 且无 drift(包括 U2 新增的采集脚本所属路径)。
- 更新 `CHANGELOG.md`(作者读 `~/.spec-first/.developer`),3 个 reviewer 降误报 + skill-review 新维度均属用户可见,标 `(user-visible)`。
**Patterns to follow:** CLAUDE.md "Agent 与 Skill 变更验证"、"文档与 Changelog"。
**Test scenarios:**
- fresh-source eval U1:合理抽象不误报 + 真 YAGNI 仍召回 → 通过
- fresh-source eval U2:报 code-simplicity 缺口 + 不误报 adversarial → 通过
- `spec-first doctor` 双宿主无 drift(含 U2 采集脚本与 rubric 均投影到 Claude/Codex runtime root)
**Verification:** eval 通过(或记录未执行原因);doctor 双宿主 clean、source 改动已投影;CHANGELOG 有 user-visible 记录。

---

## Risks & Mitigations

| 风险 | 缓解 |
|---|---|
| 补的守卫过度抑制召回(降误报反伤真问题) | U3 eval 双向验证:合理项不报 + 真问题仍报;守卫命中时按各自原生输出契约不列入 Simplification Analysis / 不列为 Minor-Major discrepancy / 不升为 Blocker-Friction-Optimization,而非硬抑制 |
| G2 审计无 reviewer-agent 事实输入(采集器只扫 skills/,不扫 agents/) | U2 配最小 agent guard-coverage 采集脚本;只产存在性事实,LLM 判断对应关系 |
| G2 rubric 改动未投影到 runtime | U3 `spec-first init` + doctor 双宿主确认 source 已投影、无 drift |
| 守卫内容写成通用模板(失去针对性) | U1 要求基于各 reviewer 自身声明维度反推,参照最成熟的 testing-reviewer 守卫 |
| 审计误报对抗类 reviewer | U2 内置反证 N/A;U3 专项验证 |

## Assumptions

- 假设"补 over-flag 守卫降误报"成立——由机制④ 外部证据(强,3-0 ×2)间接支撑,无 spec-first 专属量化基线;接受为有证据的方向性假设,效果定性验证。
- 假设 3 个目标 reviewer 确为高误报风险——由职责性质(YAGNI/视觉/CLI 主观判断)+ 守卫真空双重佐证。
- 假设 expert-audit-rubric 是 audit 运行时实际读取的清单(SKILL References 段佐证)。

## Key Decisions(决策账)

| question | recommended | chosen | source | consequence |
|---|---|---|---|---|
| brooks-lint 五机制取舍 | 只做④降误报,否①③⑤ | 同 | deep-research 证据 | ①③⑤ 归档否决 |
| 降误报具体做什么 | 补真空守卫 + 审计防回归 | 同 | 全量实诊 | 只动 3 个真空 reviewer |
| 是否动已有守卫的 26 个 reviewer | 不动 | 不动 | 实诊(守卫健全) | 精准修改 |
| 守卫内容来源 | 各 reviewer 职责反推 | 同 | 否决词表后 | 非 brooks-lint 词表 |
| G2 挂载点 | reviewer guard coverage facts + expert-audit P2 rubric | 同 | 审查纠正后的执行性风险 | facts 由脚本准备,语义对应由 LLM 判断;SKILL.md 视 artifact 输出/读取需要更新 |

## Planning Handoff Summary

- **Goal:** (G1) 补 3 个高误报风险 reviewer 的 over-flag 守卫降误报;(G2) skill-review 加守卫完整性审计防回归。
- **Scope:** 改 3 个 reviewer agent + skill-review reviewer guard coverage 采集/写出脚本 + audit rubric + 必要的 `skills/retired-skill-review/SKILL.md` Outputs/read-step 更新 + focused unit tests + CHANGELOG + 验证。不动其余 26 reviewer、不动 confidence 体系、不引入 brooks-lint 内容机制。
- **Evidence base:** deep-research 裁定机制④(降误报)是唯一强证据方向;①③⑤ 已带证据否决(docs/solutions/)。
- **Validation focus:** fresh-source eval 双向(合理项不误报 + 真问题仍召回)+ 双宿主 drift + **Claude 宿主确认 G2 生效**。
- **核心特质:** 这是整轮探讨中唯一"方向有外部强证据 + 缺口经本地全量实诊确认 + 可回退"的方案——满足"确保提升质量"约束(降误报有证据、缺口真实存在)。
- **Next action:** `$spec-work` 执行(范围小、可回退)。
