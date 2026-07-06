# spec-code-review 深度理解与改进分析

- **分析对象**：`skills/spec-code-review/`（SKILL.md 1242 行 + 9 个 references + `evals/examples.json` + `scripts/resolve-base.sh`）
- **分析日期**：2026-07-05
- **分析角色**：Spec-First Evolution Architect（已加载 `docs/10-prompt/结构化项目角色契约.md` v2.0 基线）
- **artifact 类型**：advisory（评审建议，非落地变更）。其中标注 `[confirmed]` 的观察由本会话直接读源确认；标注 `[advisory]` 的来自 references 消化 subagent（`provider_untrusted`），落地前须逐条 verify（re-read 具体行）。
- **核心判断问题**：这些改动是否让本 skill 从"能力更强"进一步走向"更可治理、可验证、可采纳、可维护"？

---

## 一、结论先行（TL;DR）

`spec-code-review` 已经是一个**高度成熟、深度工程化**的评审 harness——它内建了多 mode（interactive/autofix/report-only/headless）、Diff Boundary Review（scope/意图治理）、requirements verification、18 personas 分层选路、Graph-Assisted Impact、confidence anchors（0/25/50/75/100）、Stage 5b 独立 validator 二次验证、dedup/merge synthesis、mode-aware demotion、learnings/compound 知识闭环、project/team-standards 治理、tracker-defer、resource-governance-lens 与 rule-maturity 反馈。**它在能力覆盖上已经过剩，而非不足。**

因此，对这个系统而言，"再加一个检查维度/再加一次验证"是**反模式**（角色契约 §10：「再加一个能力」与「让已有能力可被采纳/试用/评估」冲突时选后者）。真正的改进杠杆在三个方向：

1. **收敛复杂度（可维护性/可采纳性）** —— 1242 行 stable prefix + 9 references 已积累术语漂移、旧设计残留、跨文件重复的"复杂度税"；确定性子过程仍留在 prose 里未下沉到脚本。
2. **兑现 Evaluation Harness（把 aspirational 推向 confirmed）** —— skill 每次运行都产出丰富质量 telemetry（validator drop、confidence 抑制、demotion 计数），但**没有跨运行聚合成漏判率/误报率**，validator/gate 的有效性无数据支撑。角色契约把「review 漏判率」列为 aspirational，禁止长期搁置。
3. **对冲宿主商品化（差异化锚点外显）** —— 宿主 primitive（内建 review、subagent、agent-team 原生协调）正在商品化，系统里部分机制属"会被商品化的重复层"，需显式区分差异化锚点与商品化风险区。

**最高性价比三项**：① 把 Stage 1 的 PR-base 确定性解析下沉脚本（deterministic floor 纪律的直接兑现）；② 把已在产的质量 telemetry 结构化为可聚合的 eval 信号 + 补交互行为回归 fixture；③ 修复 references 里一批具体的术语/设计不一致（见第五章，低成本、直接降复杂度税）。

---

## 二、系统画像

### 2.1 能力盘点（与前一份分析的 sanyuan `code-review-expert` 对照）

前一份分析对 sanyuan 版本提的"应新增测试维度、独立验证、意图对齐、机器可读输出、eval"——**本 skill 全部已内建**，且做得更深：

| sanyuan 版本缺的 | spec-code-review 的对应实现 |
|---|---|
| 测试维度 | `spec-testing-reviewer`（always-on core）+ first-class `test_gaps` Coverage |
| 独立验证降误报 | Stage 5b per-finding validator（refute-by-default，budget cap 15） |
| 意图/scope 对齐 | Stage 2 intent + Stage 2b plan requirements + Stage 2c Diff Boundary Review |
| 影响面 | Graph-Assisted Impact Review（`provider_untrusted` candidates + 直接证据确认） |
| 机器可读输出 | `references/findings-schema.json` + headless 结构化 envelope |
| eval | `evals/examples.json`（`workflow-eval-fixtures.v1`） |
| 置信度 | confidence anchors 0/25/50/75/100 + late confidence gate |
| 项目标准 | `spec-project-standards-reviewer` + `docs/standards/**` team-standards 治理 |

**结论**：不能用评审 sanyuan 的框架来评审本 skill；本 skill 的问题是"成熟系统的复杂度与兑现问题"，不是"能力缺口问题"。

### 2.2 执行逻辑图（简化）

```text
$ARGUMENTS ─解析→ mode(interactive|autofix|report-only|headless) + base:/PR/branch/plan:
   │  Quick-review 短路: 有宿主 built-in review 就用它并停（否则进完整流水线）
   ▼
Stage 1 Scope   [confirmed: PR-base 解析是内联 prose bash ~40 行; resolve-base.sh 只覆盖 branch/standalone]
   PR skip 规则(closed/merged/trivial) · worktree 干净检查 · merge-base · UNTRACKED 处理
   ▼
Stage 2 Intent → 2b Plan(requirements R-ID/Unit) → 2c Boundary source(scope_boundary/authorized_scope_source)
   ▼
Stage 3 选 reviewer  scale-aware preflight(minimum 2-3 vs full core 4+2) + 8 conditional + 6 stack + migration
   3b 项目标准路径发现(仅传 path 给 project-standards persona)  · Graph 候选(provider_untrusted)
   ▼
Stage 4 Dispatch   runtime readiness preflight → dispatch capability gate → 有能力: 并行 subagent
   （无能力/禁用/不安全 → single-agent report-only fallback）  model tiering: correctness/security/adversarial 继承 session model
   ▼
Stage 5 Merge   validate → fingerprint dedup → 跨 reviewer 一致性升锚 → 分离 pre-existing
   → 归一 routing → 派生 finding_type → mode-aware demotion → late confidence gate(<75 抑制, P0@50+ 豁免) → 稳定编号
   ▼
Stage 5b Validator（仅 externalizing modes: headless/autofix/option C）  per-finding 独立复核, 反驳默认, drop 记 Coverage
   ▼
Stage 6 Synthesize  pipe-table findings + Requirements 完成度 + Coverage(boundary/graph/抑制计数/validator drop) + verdict
   ▼
After-Review  按 mode 路由：interactive A(逐条 walkthrough)/B(best-judgment)/C(bulk-preview→tracker-defer 建单)/D(report only)
   fixes_applied_count>0 才进 Step 5 next-steps(push/PR)
```

---

## 三、三大方向差距诊断

> 每条：**现状 → 问题 → 角色契约依据**。

### 方向 1：复杂度/可维护性/可采纳性

**D1.1 确定性子过程仍留在 prose 里 `[confirmed]`**
- 现状：Stage 1 的 PR-base 解析（`PR_BASE_REMOTE` 探测 → `git fetch` 多级 fallback → `merge-base`）是约 40 行内联 shell 写在 SKILL.md 里；`resolve-base.sh` 脚本只覆盖 branch/standalone 两条路径，PR 模式没走脚本。
- 问题：这是**纯确定性逻辑**，按核心哲学「scripts enforce deterministic invariants」本应下沉到脚本——留在 prose 里的代价是：无法单测、跨宿主复制粘贴易漂移、撑大 stable prefix。
- 依据：§3「Deterministic floor」；§4 职责边界表（脚本负责 git 状态/路径解析）；§10「script-owned facts > provider 内部耦合」。

**D1.2 stable prefix 体量与组合规则的 prose 密度**
- 现状：SKILL.md 1242 行整体作为 cache-friendly stable prefix 每次注入；mode × stage × option（A/B/C/D）× validator 是否运行 × `fixes_applied` gate 的组合规则全用 prose 表达。
- 问题：认知负荷与 drift 面大。**但这里必须克制**——把 prose 规则改写成硬状态机会违反「不画死状态图」。正确解法不是状态机，而是把其中**确定性子过程**（scope 解析、fingerprint dedup、confidence gate 计算、finding 排序编号）抽到 helper/script，语义路由判断继续留 prose。
- 依据：§3 禁止「用刚性状态图规定 workflow 路径」；§7 设计判断矩阵「确定性流程 vs 语义决策」。

**D1.3 可采纳性：onboarding 成本高 `[confirmed]`**
- 现状：理解本 skill 需要同时在脑中装入 6 stage + 4 mode + 三层 persona + 5 条 after-review 终结路径 + 9 references 的交叉引用。
- 问题：角色契约把"可采纳性"列为一等守护结果；这么高的理解门槛降低了 harness 价值被识别/试用/评估的概率。缺一张把这些关系收拢的 orientation map。
- 依据：§1「可采纳性/可外部验证性/表达可信度与能力建设同属一等结果」。

### 方向 2：Evaluation Harness 兑现（aspirational → confirmed）

**D2.1 质量机制无有效性数据 `[confirmed]`**
- 现状：Stage 5b validator、late confidence gate、mode-aware demotion 都在做质量控制，且每次运行把抑制计数、validator drop 计数+reason、demotion 计数、over-budget skips 写进 Coverage。
- 问题：这些是**单次运行的 prose telemetry，没有跨运行聚合**。于是无法回答：validator 到底误杀了多少真 bug？confidence<75 gate 压掉的里有多少是真漏判？这是典型的「机制就位、执行面空转」——角色契约 §10 明确禁止把 aspirational 长期搁置。
- 依据：§2 Evaluation Harness「review 漏判率 (aspirational)」；§10 aspirational 推进义务「新增 aspirational 能力必须回答它如何从 aspirational 变 confirmed」。

**D2.2 eval fixture 只覆盖路由/边界，不覆盖交互行为与检出能力 `[advisory]`**
- 现状：`evals/examples.json` 是 examples-as-context（trigger/boundary/scope/graph 断言），显式声明"不是 deterministic router"。
- 问题：没有"已知缺陷 diff → 期望检出/期望 severity"的回归 fixture，也没有覆盖 walk-through 逐条决策、tracker-defer 建单/失败、bulk-preview 确认门、unified completion report 的行为断言。改 SKILL.md/persona 时缺回归基线。
- 依据：§2 Evaluation Harness eval fixture 基础设施（`test:eval-fixtures`）；角色契约把它列为已就位、待推进的机制。

### 方向 3：宿主商品化对冲（战略）

**D3.1 差异化锚点 vs 商品化风险区未显式标注 `[confirmed]`**
- 现状：Quick-review 短路已承认"有 built-in 就让位"；但整个系统没有显式标注哪些 stage 属于"宿主会商品化、应逐步让位"的层。
- 判断（本分析给出）：
  - **差异化锚点（宿主不会有，必须自持）**：Diff Boundary Review（scope 治理）、requirements/plan 对齐、learnings/compound 知识闭环、project/team-standards 治理、跨 Claude/Codex/Kiro 一致契约、source/runtime 边界感知、confidence-gated + validator 的证据纪律。
  - **商品化风险区（宿主正在或将提供）**：通用多 persona 并行、dedup、严重度分级、`bounded parallel dispatch` 自造 scheduler（agent-team 原生协调会取代）。
- 问题：不显式区分，长期会持续投入维护"会被免费提供"的重复层。
- 依据：§7「这是否在重建宿主即将免费提供的能力？价值应上移到宿主不拥有的层」；§3「差异化锚点优先放在 standards-native」。

---

## 四、改进清单（按「新增 / 补充 / 学习 / 提升」组织）

> 优先级 P0(最高价值)/P1/P2；成本 低/中/高。所有涉及 skill prose 语义的改动落地时须按 CLAUDE.md「Agent 与 Skill 变更验证」做 fresh-source eval。

### 4.1 新增

| # | 建议 | 方向 | 优先级 | 成本 |
|---|------|------|--------|------|
| N1 | **可聚合质量 telemetry 落点**：把 Coverage 已在产的 validator drop / confidence 抑制 / demotion 计数，定义成跨运行可累积的 machine-readable 记录（复用 `spec-first internal` 类脚本面而非 LLM 自写），作为漏判率/误报率的数据来源。 | 2 | P0 | 中 |
| N2 | **检出能力回归 fixture**：在 `evals/` 增补"已知缺陷 diff + 期望检出 severity"用例（区别于 examples-as-context），接入 `test:eval-fixtures`，作为改 SKILL.md/persona 的回归基线。 | 2 | P1 | 中 |
| N3 | **一页 orientation map**：在 skill 内新增一张把 6 stage × 4 mode × 三层 persona × 5 终结路径收拢的导航图，降低 onboarding 与维护成本（不改行为，纯可采纳性投资）。 | 1 | P1 | 低 |

### 4.2 补充

| # | 建议 | 方向 | 优先级 | 成本 |
|---|------|------|--------|------|
| S1 | **PR-base 解析下沉脚本**：把 Stage 1 内联的 PR-base fallback bash 整体并入 `resolve-base.sh`（或新增 `resolve-scope.sh`），让四条 scope 路径（base:/PR/branch/standalone）统一走脚本，SKILL.md 只留调用 + 语义分支；补脚本单测。 | 1 | P0 | 中 |
| S2 | **抽取其余确定性子过程**：fingerprint dedup（`normalize(file)+line_bucket(±3)+normalize(title)`）、confidence gate、finding 排序编号是确定性的，可抽成 helper 供 synthesis 调用，减少 prose 中对"机械步骤"的自然语言复述。 | 1 | P1 | 中 |
| S3 | **aspirational 激活路径显式化**：在 skill 或角色契约 §2 对应处，明确"漏判率/误报率在什么数据量、什么条件下从 aspirational 变 confirmed"，兑现 §10 推进义务。 | 2 | P1 | 低 |
| S4 | **差异化锚点 vs 商品化风险区标注**：在 skill 设计判断处显式记录两个清单（见 D3.1），为"宿主 built-in review/agent-team 成熟时哪些 stage 让位"预留决策。 | 3 | P1 | 低 |

### 4.3 学习 / 借鉴

| # | 借鉴来源 | 可迁移做法 | 方向 | 优先级 |
|---|---------|-----------|------|--------|
| L1 | 宿主 **agent-team 原生协调**（§7 点名的商品化 primitive） | `bounded parallel dispatch` 自造 scheduler 可在宿主提供原生协调时逐步让位，减少自持并发管理代码。 | 3 | P2 |
| L2 | 宿主 **built-in review / in-loop review** | 沿 Quick-review 短路思路，把"通用多 persona + dedup"视为可让位层，spec-first 只保留治理/证据/知识差异化壳。 | 3 | P2 |
| L3 | CodeRabbit / Graphite 类 PR 工具 | review-output-template 顶部可加一句"本次改动在做什么"的 change walkthrough（现有 header 有 Scope/Intent 但无变更概述），提升报告可读性。落地前 verify 现模板是否已隐含。 | 1 | P2 |

### 4.4 提升

| # | 建议 | 方向 | 优先级 |
|---|------|------|--------|
| P1 | **统一 confidence 术语**：`confidence`(schema)/`Confidence-first`(output-template、walkthrough)/`Confidence: <score>`(tracker-defer) 三名指同一 0/25/50/75/100 anchor，统一为单一术语，消除 term drift。`[advisory]` | 1 | P1 |
| P2 | **清除旧设计残留**（见第五章）：in-session sink、bulk-preview 多桶措辞、diff-scope "three tiers"、walkthrough step 号漂移等。`[advisory]` | 1 | P1 |
| P3 | **消除跨文件逐字重复**：blocking-question-tool 段落与匹配指纹公式在多个 reference 逐字重复，抽成单一被引用锚点，降维护面。`[advisory]` | 1 | P2 |
| P4 | **eval fixture 结构对齐**：`examples.json` 前 5 case 无 `expected_*`、后 4 case `input` 与 `diff_or_input` 冗余重复、`source_refs` 未含实际断言到的 reference——补齐结构与 source_refs。`[advisory]` | 2 | P2 |

---

## 五、具体一致性修复清单（references，`[advisory]`，落地须逐条 re-read 确认）

以下来自 references 消化 subagent（`provider_untrusted`），是 refactor 长期迭代积累的复杂度税的直接证据。它们低成本、可核对，是"收敛复杂度"最快的抓手。落地前须打开对应文件核对行号与措辞。

1. **confidence 术语三名并存**：同一 anchor 在 `findings-schema.json`(`confidence`)、`review-output-template.md`/`walkthrough.md`(`Confidence-first`)、`tracker-defer.md`(`Confidence: <score>`) 三种叫法。→ 统一。
2. **in-session sink 悬挂引用**：`tracker-defer.md` 已删除 in-session fallback tier，但 `walkthrough.md` completion report minimum fields（约 line 210）仍写 "tracker URL **or in-session task reference**"。→ 删悬挂引用。
3. **bulk-preview 多桶残留**：文件定义为单 call-site（option C）、单桶、两选项，却残留 "grouped by action / bucket headers appear only when non-empty / `Acknowledging (N):` advisory bucket" 多入口旧措辞。→ 清残留。
4. **diff-scope "three tiers" vs 四小节**：标题声明 "one of three tiers"，正文列 Primary/Secondary/Boundary/Pre-existing 四个。→ 明确 Boundary 是 tier 还是横切 check。
5. **walkthrough step 号漂移**：Entry 引 "Stage 5 step 7b"，No-sink adaptation 引 "step 6b"。→ 对齐 SKILL.md Stage 5 实际 sub-step 号。
6. **逐字重复段落**：blocking-question-tool 处理（AskUserQuestion/ToolSearch/never silently skip）几乎逐字出现在 walkthrough、tracker-defer、bulk-preview 三处。→ 抽单一锚点被引用。
7. **匹配/指纹公式重复**：`file + line_bucket(±3) + normalize(title)`（detail enrichment）与 finding_id fingerprint `normalize(file)+line_bucket(±3)+normalize(title)` 在两文件重复且措辞略异（`file` vs `normalize(file)`）。→ 统一定义 + 单处引用。
8. **output-template machine field 与 prose 同义重复**：`test_gaps` vs `Testing gaps:`、`residual_risks` vs `Residual risks:` 并存。→ 明确哪个是权威渲染。
9. **eval case 结构不对称 + input 冗余**：前 5 case 无 `expected_*`、后 4 phase-a case 的 `input` 与 `diff_or_input` 内容完全相同。→ 对齐结构、去冗余。
10. **eval source_refs 不全**：`examples.json` `source_refs` 只列 SKILL.md + review-output-template.md，却断言了 subagent-template/diff-scope 定义的 graph/boundary 行为。→ 补全 source_refs。

> 注：以上均为 references 文本一致性问题，属 source 层；修完后如影响 generated runtime，需 `spec-first init` 重新生成，不手改 `.claude/`、`.codex/`、`.agents/skills/`。

---

## 六、80/20 落地路线

**第一批（P0，收敛复杂度 + 兑现验证，最高性价比）**
- S1 PR-base 解析下沉脚本（deterministic floor 纪律）
- N1 可聚合质量 telemetry 落点（漏判率/误报率数据源）
- 第五章第 1–5 项一致性修复（低成本、直接降复杂度税）

**第二批（P1，可采纳性 + 战略外显）**
- N2 检出能力回归 fixture / S2 抽取确定性子过程 / N3 orientation map
- S3 aspirational 激活路径 / S4 差异化锚点标注
- P1/P2 术语统一与旧设计残留清除 + 第五章第 6–8 项

**第三批（P2，商品化对冲 + 打磨）**
- L1/L2 让位宿主原生能力的路径设计 / L3 change walkthrough
- P3/P4 跨文件去重 + eval 结构对齐 + 第五章第 9–10 项

---

## 七、承载与 owner 决策：无需新增 agent

**结论：本方案的全部改进都不需要新增常驻 agent。** 新增 agent 反而与本方案的核心目标（方向 1 收敛复杂度）直接相悖。

判据（角色契约）：
- **§4 职责边界**：新增 agent 只在"引入新的语义判断维度"时才成立。本方案改进要么是确定性工作（归 scripts/tools），要么是文本/数据编辑（归 prose/fixture），没有一项引入新语义维度。现有 18 personas + Stage 5b validator + spec-first agents 已把评审语义角色覆盖满，"新增 persona"本身已列为反模式（见第八章）。
- **§10「更小可维护方案 > 更完整设计」**：方向 1 就是收敛复杂度；加 agent 是增复杂度，方向相反。
- **§7「是否在重建宿主即将免费提供的能力」**：subagent / agent-team 正在商品化，自造新 agent 恰是应避免的方向。
- **§4「脚本做确定性工作，LLM 做语义判断」**：把 telemetry 聚合、fixture 对比这类确定性工作交给 agent，是让 LLM 干脚本的活——反向违规。

各改进的正确承载体（没有一项是 agent）：

| 改进 | 承载体 | 为什么不是 agent |
|------|--------|-----------------|
| S1 PR-base 解析下沉 | `scripts/resolve-base.sh`（脚本 + 单测） | 纯确定性 git 逻辑 |
| S2 dedup/gate/编号抽取 | synthesis helper / 脚本 | 确定性计算，非语义 |
| N1 可聚合质量 telemetry | `spec-first internal` CLI 面 + schema | machine-readable facts 是脚本产物 |
| N2 检出回归 fixture | `evals/*.json` + `test:eval-fixtures` | 数据 + 确定性对比；ground truth 由人标 |
| N3 orientation map | skill 内一张导航图 | 文档 |
| S3/S4 激活路径·锚点标注 | SKILL.md / 角色契约 prose | 文档 |
| L1/L2 让位宿主原生能力 | 战略决策 / 设计判断记录 | 文档 |
| 第五章 10 项一致性修复 | references prose 编辑 | 文本去漂移 |

**易误判点澄清**：N1/N2 看起来像"要个 eval agent"，其实不是。指标聚合（漏判率 = drop 计数 / 总数）是确定性统计，脚本做；"某 finding 是否真漏判"这一语义判断属于 fixture 的 ground truth 标注（一次性人工/评审），不是 runtime 常驻 agent。

**何时才真需要新 agent（当前都不满足）**：只有当出现现有 personas 覆盖不到的、稳定复现的新语义评审维度（如引入一门全新技术栈需要专门 lens）时才该加；即便如此，也应优先复用现有 conditional persona 机制，而非造新体系。

**执行手段 vs 常驻资产（不要混淆）**：落地这些改动时可以派**临时 subagent** 并行改 references、跑 fresh-source eval——那是一次性 worker，用完即弃，**不**往 `agents/` 增加常驻 profile。这与"新增 agent 资产"是两回事。

---

## 八、主动不做的事（反模式清单）

以下都会违反角色契约「更清晰边界 > 更强能力」「更小可维护方案 > 更完整设计」，**主动不做**：

- ❌ 新增 persona / 新检查维度 / 新 mode —— 覆盖已过剩，边际价值低、复杂度成本高。
- ❌ 把 mode×option 的 prose 规则改写成硬状态机 —— 违反「不画死状态图」，把语义路由脚本化。
- ❌ 为"更全面"再加一层 orchestration —— §10「再加一个能力 vs 让已有能力可被采纳」选后者。
- ❌ 把 Graph/validator 的 advisory candidate 当 confirmed —— 违反证据纪律。

---

## 九、验证与落地要求

- 本文档是 advisory 分析，未改动 skill 行为；`[advisory]` 项落地前须逐条 re-read 对应 reference 行确认（provider_untrusted 纪律）。
- 任何 SKILL.md / references / persona prose 的落地改动，须按 CLAUDE.md「Agent 与 Skill 变更验证」做 fresh-source eval（checklist 见 `docs/contracts/workflows/fresh-source-eval-checklist.md`），并跑 `npm run lint:skill-entrypoints`、相关 contract/unit tests、`npm run test:mcp-setup`（若触及 runtime projection）。
- S1/S2 脚本下沉须补脚本单测；N1/N2 telemetry 与 fixture 须接入 `test:eval-fixtures` 并考虑 Claude/Codex/Kiro 三宿主。
- 涉及 findings-schema.json 的字段变更须版本化并跑 downstream consumer tests。

## 十、一句话总评

sanyuan 版本的问题是"能力不够"；spec-code-review 的问题是"成熟系统如何优雅地承重"——**它已经足够强，接下来的杠杆是让它更薄、更可验证、更能在宿主商品化浪潮中守住自己不可替代的治理/证据/知识差异化，而不是更全。**
