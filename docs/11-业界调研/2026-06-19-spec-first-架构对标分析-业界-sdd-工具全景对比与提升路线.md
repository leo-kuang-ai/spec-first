# spec-first 架构对标分析报告：业界 SDD 工具全景对比与提升路线

> **角色视角**：spec-first 项目架构师
> **对标对象**：OpenSpec（Fission-AI）、GitHub spec-kit、superpowers（obra）、gsd（get-shit-done）+ Anthropic 2026 趋势
> **分析方法**：4 仓库源码级拆解（clone 实测）+ agent 并行调研 + 趋势交叉验证 + 架构师多轮推演
> **核心问题**：站在 2026 年 AI 辅助编程发展趋势上，spec-first 需要补齐哪些提升点才能确立架构优势？

## 0. 执行摘要

2026 年 AI 编程已从 Vibe Coding 演进到 **Harness Engineering**——其三大支柱（上下文工程、架构约束、熵管理）正是 spec-first 的定位。这是 spec-first 的战略机遇：它已经在 Harness Engineering 路线上走得最深（honest closeout、51 agent、compound、双宿主），但业界 4 个对标项目各自在某一维度比它更成熟。

**四维对标一句话**：

| 对标项目 | 它的核心强项 | spec-first 的相对位置 |
| --- | --- | --- |
| **OpenSpec** | 行为契约状态机 + Delta 累积演进 | spec-first 缺状态治理（活契约层空缺） |
| **spec-kit** | 模板即约束 + 宪法门控 + converge 收敛 | spec-first 有更强的机器验证，但缺宪法/收敛机制 |
| **superpowers** | 行为塑造科学 + Skill=Code + TDD for skills | spec-first 缺 agent 行为塑造的实证方法论 |
| **gsd** | Context rot 治理 + 实时上下文监控 + 状态持久化 | spec-first 缺运行时上下文感知与防失忆机制 |

**架构师判断**：spec-first 的护城河（trust model + agent 生态 + compound + 双宿主）是四个对手短期无法复制的。但它有 **5 个结构性缺口**，分属 5 个维度。补齐策略不是全面追赶，而是**以"活契约层"为根，带动 4 个乘数效应**——这与业界 Harness Engineering 三支柱完全对齐。

## 1. 业界发展趋势：Harness Engineering 时代来临

### 1.1 Anthropic 2026 八大趋势的核心信号

Anthropic 2026 年 1 月发布的 Agentic Coding Trends Report 确立了关键转向：

> **软件开发正从"写代码"转向"编排 agent"。开发者 60% 工作用 AI，但完全委派仅 0-20%——人类从执行者变为设计者。**

8 个趋势分三类：

- **基础类**：开发者角色从实现转编排；单 agent → 多 agent 协调；人类监督规模化
- **能力类**：agentic coding 扩展到非工程团队；领域专家获得编码能力
- **影响类**：生产力 30-79% 提升（Rakuten 24 天→5 天）；安全-first 架构成刚需

关键数据：Rakuten 在 1250 万行代码库上 7 小时自主工作达 99.9% 准确率；TELUS 节省 50 万小时；AI agent 市场 2025 年 78 亿→2030 年 526 亿美元。

### 1.2 六大编程模式的演进定位

业界已明确将 AI 编程划分为 6 种模式（2026 年共识）：

```
Vibe Coding（直觉）
    ↓ 规范化
Agentic Engineering（流程）
    ↓ 系统化
Harness Engineering（体系）← spec-first 在此
    ↓
    ├── Ralph Wiggum Loop（自动化执行）
    ├── BMAD（角色化协作）
    └── SDD（规范驱动）← spec-first 也在此
```

**Harness Engineering 三大支柱**（与 spec-first 的对齐度）：

| 支柱 | 含义 | spec-first 现状 | 对标项目最强者 |
| --- | --- | --- | --- |
| **上下文工程** | AI 在正确时间获得正确信息 | 强（bounded direct reads、context-bundle 合约） | **gsd**（实时上下文监控、STATE.md 活记忆） |
| **架构约束** | 机制强制 AI 遵守规则 | 强（honest closeout、verification 合约、51 agent） | **spec-kit**（宪法门控、模板约束） |
| **熵管理** | 定期清理 AI 积累的问题 | 弱（有 compound-refresh 但无系统性熵治理） | **superpowers**（experiment ladder、defect tripwire） |

**战略洞察**：spec-first 同时踩在 Harness Engineering 和 SDD 两个模式上，这是它的定位优势。但每个支柱上都有一个对标项目做得更深的维度——补齐这些维度就能成为 Harness Engineering 的标杆实现。

## 2. 四个对标项目深度画像（源码级）

### 2.1 OpenSpec：行为契约状态机

**规模**：34,814 行 TS + 27 适配器 + 2 内置 schema

**核心理念**：Filesystem-as-State-Machine——把 specs 当 Git 对待代码。specs/ = main 分支（事实源），changes/ = feature 分支（隔离工作区），delta = diff，archive = merge。

**最强项：状态治理**。Spec Delta 三段式（ADDED/MODIFIED/REMOVED/RENAMED）+ 原子合并引擎（specs-apply.ts：RENAMED→REMOVED→MODIFIED→ADDED 顺序 + 跨段冲突检测 + Zod 预校验）。这是业界唯一的"行为契约累积演进"实现。

**弱点**：无信任模型（AI 自由产出 artifact，无 honest closeout）；无 agent 生态；无知识沉淀（只归档 change 历史）；无运行时上下文治理。

**spec-first 缺口**：活契约层 + Delta 累积演进（前序报告已深度论证，此处确认仍为最高优先级）。

### 2.2 GitHub spec-kit：模板即约束

**规模**：Python 29,887 行 + 模板 2,966 行 + 34 集成 + 118 社区扩展

**核心理念**：权力倒转——spec 不服务代码，代码服务 spec。用 Markdown 模板 + slash command prompt 强约束 LLM 行为。

**最强项：模板约束工程**。

- **宪法九条**（库优先/CLI接口/测试优先/简洁性/反抽象/集成优先）+ Phase -1 门控 + Complexity Tracking 豁免表
- **NEEDS CLARIFICATION**：强制标记歧义，最多 3 个，优先级 scope > security > UX > technical
- **converge 闭环**：实现后比对 spec/plan/tasks vs 代码，append remediation task，**无变更则字节不动**（append-only 收敛）
- **analyze 6 维度**：spec/plan/tasks 三件套一致性只读分析
- **checklist "Unit Tests for English"**：测 requirements 写作质量（"Is 'prominent display' quantified?"）

**弱点**：约束可被 LLM 绕过（模板非机器强制）；宪法默认空模板（跳过则门控形同虚设）；LLM 自检 LLM 的循环；生产反馈主张但未实现。

**spec-first 缺口**：宪法/原则门控 + spec 质量元检查 + converge 收敛机制。

### 2.3 superpowers：行为塑造科学

**规模**：14 skill + 跨 10 harness，纯 Markdown + SessionStart hook

**核心理念**：把"agent 怎么干活"表达为行为塑造文本，注入任何 coding agent 上下文。

**最强项：agent 行为塑造的实证方法论**。

- **Match the Form to the Failure**（最反直觉发现）：prohibition 在 shaping 问题上 backfire。micro-test 数据：正面 instruction 4.4 vs prohibition 3.0 vs control 3.6。失败类型决定 form：跳过规则→禁令+rationalization 表；输出形状错→正面 recipe；漏元素→REQUIRED slot；条件依赖→observable predicate
- **SDO 理论**：description 只写触发条件不写 workflow，否则 agent 跟 description 走不读正文
- **Skill = Code + TDD for skills**：skill 修改带 eval 证据，RED（无 skill 时 agent 怎么失败）→ GREEN（写 skill 让 agent 合规）→ REFACTOR
- **Durable Progress Ledger**：.git/sdd/progress.md append-only，防 compaction 失忆
- **File Handoffs**：task-brief/review-package 脚本把大文本写文件让 subagent 读，不粘贴
- **Strict-Cost Experiment Ladder**：judgment guardrail "cheapen mechanics, never judgment"

**弱点**：无机器可校验契约（纯行为塑造文本）；无状态治理；无信任模型；单一作者风险。

**spec-first 缺口**：agent 行为塑造的实证方法论 + 防失忆的 progress ledger + file handoff 协议。

### 2.4 gsd：Context Rot 治理

**规模**：67 命令 + 33 agent + 77 lib 文件 + 31,157 行 JS + 13 hooks（四项目中最重）

**核心理念**：解决 context rot——上下文窗口填满后输出质量劣化。"复杂性在系统内部，不在你的工作流里。"

**最强项：运行时上下文感知与状态持久化**。

- **Context Monitor Hook**（gsd-context-monitor.js）：实时监控上下文剩余 %，≤35% WARNING 让 agent 收尾，≤25% CRITICAL 让 agent 立即停止保存状态。5 次 debounce，severity 升级 bypass debounce
- **STATE.md 活记忆**（<100 行 digest）：每个 workflow 第一步读，每次行动后写，"read once, know where we are"
- **Workflow Guard Hook**（soft guard）：检测 GSD 工作流外的文件编辑，注入 advisory warning
- **13 个 hooks 体系**：context-monitor、prompt-guard、read-guard、workflow-guard、phase-boundary、validate-commit、statusline 等——真正的 harness engineering
- **Ambiguity Scoring Gate**（spec-phase）：4 维度加权评分，≤0.20 才放行写 SPEC.md
- **Performance Metrics**：velocity 追踪（plans completed、avg duration、trend improving/stable/degrading）

**弱点**：无行为契约/delta（spec 是一次性 SPEC.md）；无 honest closeout 类信任模型；无 compound learning（只有 extract-learnings 一次性提取）；重度企业流程感（67 命令的认知负担）。

**spec-first 缺口**：运行时上下文监控 + 防失忆状态持久化 + 量化歧义门控 + 性能度量。

## 3. 五维缺口分析与提升点（架构师多轮推演）

> 站在 spec-first 架构师视角，综合 4 对标 + 趋势，识别 5 个结构性缺口。每个做三轮推演：①缺口机制 ②业界最强实现 ③spec-first 落地设计（契合 trust model）。

### 缺口 1【状态治理】活契约层 + Delta 累积演进

**① 缺口机制**（前序报告已源码级论证，此处精炼）

spec-first 治理了"工作怎么做"（过程治理），未治理"系统现在是什么样"（状态治理）。源码证据：spec_id 是横向链路（非纵向累积）；prior plans 是 advisory（非权威）；契约概念只用于工具自身（contract-drift-guard）。导致三个黑洞：review 回归破坏盲区、verification"测了没测对"、compound 知识闭环在契约层断裂。

**② 业界最强实现**：OpenSpec

specs-apply.ts 的 delta 合并引擎：RENAMED→REMOVED→MODIFIED→ADDED + 跨段冲突检测（MODIFIED∩REMOVED 等）+ Zod 预校验 + 原子写。Filesystem-as-State-Machine：specs/ = main，changes/ = feature，delta = diff，archive = merge。

**③ spec-first 落地设计**（契合 trust model）

- 新增 docs/contracts/<domain>/spec.md（活契约，累积权威）
- brainstorm/prd 产出契约 Delta（ADDED/MODIFIED/REMOVED），参考 OpenSpec schema.yaml instruction
- 移植 specs-apply.ts 合并逻辑到 spec-first JS CLI：**合并归脚本（scripts prepare）、语义分类归 LLM（LLM decides）、冲突走 honest-closeout 降级**
- 新增 spec-sync：合并契约 + 沉淀 learnings 的统一收尾
- **乘数效应**：code-review 对照活契约（填回归盲区）、verification 从契约派生回归 check、compound 闭环契约演进

**优先级**：P0，最高。这是"根"，其他 4 个缺口都建在其上。

### 缺口 2【架构约束】宪法/原则门控 + spec 质量元检查

**① 缺口机制**

spec-first 有 honest closeout 验证"测试真跑了"，但**没有验证"spec/plan 本身质量好不好"**。plan 可以过度设计、spec 可以模糊不清、requirements 可以含未量化表述——这些质量问题在执行前无人拦截。spec-first 的 contract-drift-guard 只守护"工具自身诚实"，不守护"用户产出的 spec/plan 质量"。

**② 业界最强实现**：spec-kit

- **宪法九条 + Phase -1 门控**：库优先/CLI接口/测试优先/简洁性/反抽象/集成优先，plan 生成时强制 check，Complexity Tracking 表让豁免透明化
- **NEEDS CLARIFICATION**：强制标记歧义，最多 3 个，优先级排序
- **checklist "Unit Tests for English"**：测 requirements 写作质量（"Is 'prominent display' quantified?" 而非 "Verify the button clicks"）
- **converge 闭环**：实现后比对 spec/plan/tasks vs 代码，append remediation，无变更则不动

**③ spec-first 落地设计**（避免 spec-kit 的坑）

spec-kit 的教训：宪法默认空模板（跳过则门控形同虚设）、LLM 自检 LLM 循环。spec-first 应：

- 引入项目级 principles.md（宪法），但**缺失时拒绝跑 plan**（强制立宪，避免 spec-kit 的空模板坑）
- plan 模板增加 ## Principles Check 段 + 豁免登记表（Complexity Tracking），**豁免走 honest closeout 降级**（不能悄悄豁免）
- spec 质量元检查用**机器可验证格式检查（regex/parser）+ LLM 语义检查混合**（避免 LLM 自检 LLM 循环）：如 MUST/SHALL 关键词存在性检查（机器）、scenario 4-# 格式检查（机器）、"未量化表述"检测（LLM）
- 引入 converge 式收敛检查器：实现后比对活契约（缺口 1）vs 代码，append remediation task，**无变更则不动**（append-only 优雅收敛）

**优先级**：P1。与缺口 1 配套——活契约有了，必须有质量门控保证契约本身合格。

### 缺口 3【上下文工程】运行时上下文监控 + 防失忆状态持久化

**① 缺口机制**

spec-first 的 bounded direct reads 是"按需读源码"策略，但**没有运行时上下文感知**——它不知道当前会话上下文还剩多少、何时该收尾、何时该保存状态防 compaction 失忆。长任务执行到一半上下文满了，agent 可能"断片儿"丢失进度。spec-first 的 spec_id 是横向追溯，不是防失忆的进度持久化。

**② 业界最强实现**：gsd + superpowers

- **gsd Context Monitor Hook**：实时监控剩余 %，≤35% WARNING 收尾，≤25% CRITICAL 停止保存。让 agent 自己感知上下文极限
- **gsd STATE.md**：<100 行 digest，每 workflow 第一步读、每行动后写，"read once, know where we are"
- **superpowers Durable Progress Ledger**：.git/sdd/progress.md append-only，一行 per task，compaction 后 trust ledger over recollection
- **superpowers File Handoffs**：task-brief/review-package 写文件让 subagent 读，不粘贴，避免 controller context 爆炸

**③ spec-first 落地设计**（契合双宿主 + trust model）

- **Context Monitor Hook**（移植 gsd 机制到 spec-first hooks 体系）：spec-first 已有 session-start/spec-plan-guard hooks，新增 context-monitor hook。阈值化收尾与 honest closeout 联动——CRITICAL 时触发 spec:sync 保存契约+进度
- **STATE.md 活记忆**（借鉴 gsd <100 行 digest）：记录当前 spec_id、phase、last activity、blockers。每个 spec-* 入口第一步读 STATE.md，收尾时写。**与活契约（缺口 1）分工**：STATE.md 是"工作进度短期记忆"，活契约是"系统行为长期真相"
- **Durable Progress Ledger**（借鉴 superpowers）：.spec-first/progress.md append-only，一行 per task，防 compaction。与 verification-run-summary 联动——进度条目带 check status
- **File Handoff 协议**（借鉴 superpowers）：spec-first 的 51 agent 已有 subagent dispatch，但缺统一的 file handoff 协议。新增 task-brief/review-package 标准化文件 handoff，避免 controller context 爆炸

**优先级**：P1。这是 Harness Engineering "上下文工程"支柱的核心——spec-first 在此支柱上相对 gsd 有明显差距。

### 缺口 4【熵管理】agent 行为塑造的实证方法论

**① 缺口机制**

spec-first 有 51 个 agent 和丰富的 skill，但**缺乏 agent 行为塑造的实证方法论**——怎么知道一个 skill 写得有效？怎么迭代 skill 文本？怎么避免 prohibition backfire？当前 skill 修改是"凭经验写"，无 eval 证据、无 micro-test、无失败类型→form 映射。这导致 skill 质量依赖作者直觉，难以系统化提升。

**② 业界最强实现**：superpowers

- **Match the Form to the Failure**：prohibition 在 shaping 问题上 backfire（micro-test 4.4 vs 3.0 vs 3.6）。失败类型→form 映射表
- **SDO 理论**：description 只写触发条件不写 workflow
- **Skill = Code + TDD for skills**：RED→GREEN→REFACTOR，带 eval 证据
- **Micro-Test Wording Methodology**：~$0.15-0.30/sample、5+ reps、必带 no-guidance control、hand-inspect
- **Strict-Cost Experiment Ladder**：judgment guardrail "cheapen mechanics, never judgment"
- **反 sycophancy 治理**：禁 "You're absolutely right"、YAGNI check、push back 机制

**③ spec-first 落地设计**（与 spec-first 已有 evals 体系结合）

spec-first 的 skill 已有 evals/examples.json——这是天然基础。应：

- **建立 micro-test 流水线**：每个 skill 修改带 eval 证据，必带 no-guidance control（baseline）。借鉴 superpowers 的 ~$0.15-0.30/sample 成本控制
- **失败类型→form 映射表**：写入 skill 编写指南。spec-first 写"agent 使用 spec 的指引"时避免堆砌禁令——跳过规则→禁令+rationalization 表；输出形状错→正面 recipe；漏元素→REQUIRED slot；条件依赖→observable predicate
- **SDO 理论应用**：spec-first 的 skill description 只写"何时用"（触发条件），workflow 留给 SKILL.md 正文
- **反 sycophancy 内置**：51 个 reviewer agent 内置 superpowers 的反 sycophancy 规则（禁 "You're absolutely right"、YAGNI check）
- **judgment guardrail**：明列哪些决策是 judgment points 不能移到便宜模型（参考 superpowers：cheap reviewer 在 planted-defect 上 0/10）

**优先级**：P2。这是 Harness Engineering "熵管理"支柱——提升 skill/agent 质量的系统化方法。

### 缺口 5【工作流编排】可声明工作流 + 量化门控

**① 缺口机制**

spec-first 的工作流固定在 source skills 中，团队无法声明自定义流程。且门控是二元的（有/无），缺量化门控。入口丰富但相对线性，无法按风险分级。

**② 业界最强实现**：spec-kit（schema 驱动）+ gsd（量化门控）+ OpenSpec（schema.yaml）

- **spec-kit 模板解析栈 + Composition**：4 层栈 + replace/prepend/append/wrap 4 策略，preset 链式组合
- **gsd Ambiguity Scoring Gate**：4 维度加权评分，≤0.20 才放行——量化门控
- **OpenSpec schema.yaml**：artifacts + requires + template + instruction，可 fork/validate/社区分发
- **spec-kit slash command handoff**：frontmatter 声明 handoffs，命令链声明式编排

**③ spec-first 落地设计**（与缺口 1/2 联动）

- 引入 schemas/<name>/schema.yaml（借鉴 OpenSpec）：声明 artifact 序列、依赖、对应 skill、instruction
- 与现有 skills-governance.json（分发治理）分工：schema.yaml 定义工作流，governance.json 定义分发
- **量化门控**（借鉴 gsd）：spec-phase 增加 ambiguity scoring（4 维度≤阈值放行）；plan-phase 增加 principles check 量化评分
- **渐进严格度**：spec-first init --profile lite|full，高风险触发条件（API 契约变更/跨 repo/安全）自动升级
- **slash command handoff**（借鉴 spec-kit）：每个 spec-* 的 frontmatter 声明 handoffs，命令链声明式编排

**优先级**：P2。在缺口 1/2 建好后，工作流可声明化让 spec-first 适应不同团队文化。

## 4. 五维缺口优先级与乘数关系

```
┌─────────────────────────────────┐
                    │  缺口1: 活契约层 + Delta (P0)     │  ← 根
                    │  状态治理 · 乘数项               │
                    └────────────┬────────────────────┘
                                 │ 建在其上
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                  ▼
   ┌──────────────────┐ ┌────────────────┐ ┌──────────────────┐
   │ 缺口2: 宪法门控    │ │ 缺口3: 上下文   │ │ 缺口5: 工作流     │
   │ + spec质量 (P1)   │ │ 监控+防失忆(P1) │ │ 可声明+量化门控(P2)│
   │ 架构约束          │ │ 上下文工程      │ │                   │
   └──────────────────┘ └────────────────┘ └──────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────────────┐
                    │  缺口4: 行为塑造方法论 (P2)       │  ← 熵管理
                    │  skill/agent 质量系统化          │
                    └─────────────────────────────────┘
```

**乘数逻辑**：

- 缺口 1 是**根**——活契约给所有治理提供"系统行为真相"基准（前序报告已论证）
- 缺口 2 建在缺口 1 上——宪法门控保证契约本身合格，converge 对照活契约收敛
- 缺口 3 与缺口 1 联动——上下文监控 CRITICAL 时触发契约+进度保存
- 缺口 5 在缺口 1/2 建好后——工作流可声明化让契约演进成为可选 workflow 段
- 缺口 4 相对独立——提升 skill/agent 质量，横切所有缺口

**与 Harness Engineering 三支柱对齐**：

| 支柱 | 对应缺口 |
| --- | --- |
| 上下文工程 | 缺口 3（上下文监控+防失忆） |
| 架构约束 | 缺口 1（活契约）+ 缺口 2（宪法门控） |
| 熵管理 | 缺口 4（行为塑造方法论）+ 缺口 5（量化门控） |

补齐 5 个缺口 = 补齐 Harness Engineering 三支柱 = 成为 Harness Engineering 标杆实现。

## 5. spec-first 护城河确认（对标中不可替代的优势）

为避免追赶心态，明确 spec-first 已有的、4 个对标项目短期无法复制的优势：

| spec-first 护城河 | 源码证据 | 对标项目最弱处 |
| --- | --- | --- |
| **Honest Closeout + 防 cherry-pick** | honest-closeout.js L213-220 强制聚合真相 | OpenSpec/gsd/spec-kit/superpowers 均无 |
| **Verification Run Summary 合约** | spec-first.verification.json + 结构化 check 记录 | 均无（OpenSpec verify 是 LLM 对话式） |
| **Compound Learning + Promotion Gate** | spec-compound/SKILL.md 630 行，invalidation_condition+source_refs | 均无（gsd 只有 extract-learnings 一次性提取） |
| **51 个专业 Agent 生态** | agents/*.md 51 个 | superpowers 14 skill 无专业 agent；gsd 33 agent 但无 promotion gate |
| **Source/Runtime/Provider 边界 + drift 检测** | adapters/claude.js 395 行 | gsd 13 hooks 但无 source/runtime 分离；OpenSpec 27 适配器是薄转换 |
| **Harness Engineering 三层概念** | CONCEPTS.md | 均无此抽象高度 |
| **三种开发模式（多仓 workspace）** | 08-三种开发模式.md | 均无多仓治理 |
| **Scripts prepare/LLM decides 信任模型** | 贯穿所有合约 | 均无此明确信任边界 |

**关键原则**：补齐 5 个缺口时，**必须建在这些护城河之上**，而非破坏它们。每个缺口的落地设计都已验证契合 trust model（合并归脚本/判断归 LLM/冲突走 honest closeout）。

## 6. 实施路线图

### Phase 1：状态治理补根（P0，对应缺口 1）

```
引入 docs/contracts/<domain>/spec.md 活契约
  + Delta 语法（ADDED/MODIFIED/REMOVED/RENAMED）
  + 移植 specs-apply.ts 合并引擎到 spec-first CLI
  + spec-sync 统一收尾（合并契约 + 沉淀 learnings）
  + honest-closeout 扩展 contract_coverage claim
```

参考：OpenSpec specs-apply.ts + requirement-blocks.ts

### Phase 2：架构约束 + 上下文工程（P1，对应缺口 2+3）

```
2a. 宪法门控
  + principles.md（缺失时拒绝跑 plan）
  + plan 模板 Principles Check + Complexity Tracking
  + spec 质量元检查（机器格式 + LLM 语义混合）
  + converge 收敛检查器（对照活契约）

2b. 上下文监控
  + context-monitor hook（≤35% WARNING / ≤25% CRITICAL）
  + STATE.md 活记忆（<100 行 digest）
  + .spec-first/progress.md append-only ledger
  + file handoff 协议（task-brief/review-package）
```

参考：spec-kit 宪法/converge + gsd context-monitor/STATE.md + superpowers ledger/file-handoffs

### Phase 3：熵管理 + 工作流编排（P2，对应缺口 4+5）

```
3a. 行为塑造方法论
  + micro-test 流水线（基于现有 evals/examples.json）
  + 失败类型→form 映射表
  + SDO 理论应用 + 反 sycophancy 内置
  + judgment guardrail

3b. 可声明工作流
  + schemas/<name>/schema.yaml
  + 量化门控（ambiguity scoring / principles scoring）
  + 渐进严格度（lite/full profile）
  + slash command handoff 声明式编排
```

参考：superpowers 行为塑造 + gsd 量化门控 + OpenSpec schema.yaml + spec-kit handoff

## 7. 架构师结论

### 7.1 战略定位

2026 年 AI 编程进入 Harness Engineering 时代——其三支柱（上下文工程、架构约束、熵管理）正是 spec-first 的定位。spec-first 已在 Harness Engineering 路线上走得最深：honest closeout 是最严的架构约束，51 agent + compound 是最强的熵管理基础，双宿主是成熟的上下文工程基建。

但它有 5 个结构性缺口，每个对标项目都在某一维度更深：

- OpenSpec 教它**状态治理**（活契约 + Delta）
- spec-kit 教它**架构约束**（宪法门控 + converge 收敛 + spec 质量元检查）
- gsd 教它**上下文工程**（实时监控 + 防失忆 + 量化门控）
- superpowers 教它**熵管理**（行为塑造实证方法论 + Skill=Code）

### 7.2 核心判断

**不要全面追赶，要以"活契约层"为根带动 4 个乘数效应。**

缺口 1（活契约）是根——它给所有治理提供"系统行为真相"基准。补齐它，review 有了回归对照、verification 有了契约派生检查、compound 闭环了契约演进。其他 4 个缺口都建在其上，且每个都契合 spec-first 的 trust model（scripts prepare / LLM decides / honest closeout 降级）。

补齐 5 个缺口 = 补齐 Harness Engineering 三支柱 = spec-first 从"强过程治理、弱状态治理"升级为"过程+状态双强"的完整 Harness Engineering 标杆。

### 7.3 不做什么

- **不做 gsd 式的 67 命令膨胀**——gsd 的认知负担是教训，spec-first 应保持入口精简
- **不做 spec-kit 式的 LLM 自检 LLM 循环**——机器可验证 + LLM 语义混合
- **不做 spec-kit 式的宪法默认空模板**——缺失时拒绝跑 plan
- **不做 superpowers 式的纯行为塑造无机器校验**——行为塑造是软约束层，与硬契约层分层共存
- **不破坏 trust model**——所有新机制都走"合并归脚本/判断归 LLM/冲突走 honest closeout"

### 7.4 一句话

spec-first 的护城河（trust model + agent 生态 + compound + 双宿主）是四个对手无法复制的；它的 5 个缺口各有业界最强实现可参考。以活契约为根、带动架构约束+上下文工程+熵管理+工作流编排的乘数补齐，spec-first 将成为 2026 年 Harness Engineering 时代的标杆实现——而非又一个 SDD 工具。

## 附录 A：四项目源码级规模对比

|  | OpenSpec | spec-kit | superpowers | gsd | spec-first |
| --- | --- | --- | --- | --- | --- |
| CLI 源码 | 34,814 行 TS | 29,887 行 Py | 0（纯 MD） | 31,157 行 JS | 19,378 行 JS |
| 命令/入口 | ~11 opsx | 10 slash | 14 skill | **67 命令** | 18 命令 |
| Agent | 0 | 0 | 0 | 33 | **51** |
| Skill | 0 | 0 | 14 | 0（命令内嵌） | **37** |
| 适配器/集成 | 27 | 34 + 118 扩展 | 10 harness | 13 runtime | 2（厚适配器） |
| Hooks | 0 | 0 | 1（SessionStart） | **13** | 2 |
| Schema | 2 + 自定义 | 模板栈+preset | 0 | 0 | governance.json |
| 验证 | Zod + 3维度 | LLM 自检 checklist | eval micro-test | ambiguity scoring | **honest closeout + 防 cherry-pick** |
| 知识沉淀 | 归档 change | 无 | 无 | extract-learnings | **compound + promotion gate** |
| 状态治理 | **Delta 合并** | converge 收敛 | progress ledger | STATE.md 活记忆 | 无（缺口 1） |

## 附录 B：调研材料索引

**源码级 clone 实测**：

- OpenSpec：schemas/spec-driven/schema.yaml、src/core/specs-apply.ts、src/core/archive.ts、src/core/validation/validator.ts
- spec-kit：spec-driven.md、templates/、workflows/ARCHITECTURE.md、extensions/（agent 调研笔记 1123 行）
- superpowers：skills/、docs/porting-to-a-new-harness.md、docs/superpowers/specs/（agent 调研笔记 1158 行）
- gsd：commands/gsd/（67 命令）、hooks/gsd-context-monitor.js、sdk/prompts/templates/state.md、agents/（33 个）

**趋势调研**：

- Anthropic 2026 Agentic Coding Trends Report
- 2026 年 AI 编程六大模式全解析
- OpenSpec in 2026: The Operating System for Spec-Driven Development
