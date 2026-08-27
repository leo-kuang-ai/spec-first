---
title: "Skill 精简质量保障方案 - Quality Safeguards"
type: design
status: active
date: 2026-08-27
reviewed: 2026-08-27
evidence_tier: advisory
related:
  - docs/plans/2026-08-27-001-perf-skill-runtime-context-pilot-plan.md
  - docs/plans/2026-07-30-002-refactor-skill-system-progressive-disclosure-plan.md
  - docs/10-prompt/结构化项目角色契约.md
---

# Skill 精简质量保障方案 - Quality Safeguards

> 本文回答一个问题：**如何精简 Skill 的常驻上下文，而不降低 Skill 的行为质量。**
> 它是 `2026-08-27-001-perf-skill-runtime-context-pilot-plan.md`（下称 pilot plan）的 advisory 质量保障补充层：pilot plan 定义「做什么、何时做、promotion 门槛」，本文补充业界证据锚点与增量保障手段。**本文不改变 pilot plan 已冻结的 requirement、measurement profile、promotion table 与预算语义；引用 pilot plan 既有机制时只注明条目号，不复述。**
> 本文经三路对抗性审查（红队攻击、治理合规、证据核验）修订；审查记录见 7.3。文中机制未经本仓库实证，业界证据可信度分级见第 7 节。

---

## Goal Capsule

| 维度 | 决策 |
| --- | --- |
| 目标 | 为 Skill 入口精简（删 / 蒸馏 / 迁移到条件 references）提供不降低行为质量的可操作保障框架。 |
| 核心论点 | 精简是语义保持变换，不是文本编辑。质量保障的最低集合是四支柱（知识清单、到达保证、等价证明、可逆性）加支柱接口闭环——错误分类的知识可以在支柱间穿行而不触发任何防线，闭环本身必须是第五道不可省略的机制。 |
| 方法 | 第一性原理推导 + 三路业界调研（Anthropic 官方、业界产品、学术与经典方法论）+ 三路对抗性审查回写 + 80/20 杠杆分配。 |
| 主要输出 | 四支柱 + 接口闭环 × 五防线框架，对 pilot plan 的 8 项增量（第 4 节 D1-D8），其中带强制力的子集（D2、D4、D5 的冻结前条款）为本切片必做。 |
| 最大风险 | 等价证明层证据被高估：LLM-as-judge 的 verbosity bias 系统性惩罚精简版（强 judge 下显著减弱，见 2.2），且声明式 length control 无实证支持；未去偏的 judge 会把「更短」误判为「更差」。 |
| 边界 | 不改变 pilot plan 已冻结机制；本方案增量在 pilot 投资门的 TCO 约束内取舍（见 4 节 80/20 裁决）。 |

---

## 1. 问题定义与第一性原理

### 1.1 Skill 的本质与「质量」的定义

Skill 不是文档，是**行为的因**：向模型的任务决策现场注入操作性知识。质量定义为：

> **质量 = 对任务 T 的每个决策点 d，模型在 d 发生的时刻拥有做出正确决策所需的充分知识**（decision sufficiency per token，与角色契约一致）。

「降质」的操作定义：**存在某个决策点，承重知识缺失（被删错）、迟到（触发未命中）、或被稀释（淹没在低价值信息中）**。

### 1.2 精简操作的风险分解

| 操作 | 定义 | 风险本质 | 安全前提 |
| --- | --- | --- | --- |
| **删除（delete）** | 文本消失 | 知识需求被误判为不存在 | 需求确实不存在：重复（另有唯一 owner）、过期、或已被模型能力内化——「已内化」是语义判断，必须由独立证据支撑（见 3.2） |
| **蒸馏（distill）** | 更少 token 传递声称等价的知识 | 有损重写：限定词（禁止、例外、条件）被 silently 丢弃，且不被表面相似度发现（FIB，ACL 2023） | 逐条约束可验证在新文本中有承载点 |
| **迁移（relocate）** | 知识移到条件 reference，加载延迟 | 到达失败：触发不可判定、不命中或过晚；且 reference 内容读入后多落在上下文中部（位置效应），到达不等于行为等价 | 触发判定仅凭入口可见事实（pilot plan R6）；行为等价由整体 paired eval 承担（pilot plan U5），不由结构检查兜底 |

业界证据与三种操作对应：Anthropic 官方删除 80% system prompt 经同一套 coding evals 验证无 measurable loss（删除的安全前提是 overconstraining 与模型已内化，见 2.1）；prompt sensitivity 研究证明任何文本扰动本身即行为变量（见 2.2）。

### 1.3 四支柱及其接口闭环

四支柱的**必要性**可用反例论证（缺任何一个都可构造失败场景）：P1 知识清单（哪些知识承重——缺失则删掉「看似冗余」的 digest 校验规则）；P2 到达保证（知识会在决策点前到达——缺失则触发条件藏在 reference 内，判定时已越界）；P3 等价证明（变换前后行为分布等价——缺失则文本重排本身改变行为而无人验证）；P4 可逆性（错了能回——git 历史天然存在，真实风险是未冻结 baseline identity 或无回退路径声明，回归发现成本随时间上升）。

**但必要性不等于充分性**（对抗审查确认的缺口）：四支柱各自成立时，一段被错误分类为 delete 的承重知识仍可依次穿行——P1 分类「合规」（delete 段不进受保护清单）、P2 天然 N/A、P3 无 case 可证且 ablation 可豁免、P4 可回但无信号触发回退。**因此支柱接口闭环是第五道不可省略的机制**（见 3.2 L2' 与 D 清单）：以 Protected Behavior Map 为段落级 hub 资产，让分类、obligation、case 引用、验证产出互相强制对齐，堵住跨支柱穿行路径。

pilot plan 已有机制覆盖四支柱：PBM→P1；R6+spine 清单→P2；fresh-source paired eval→P3；U1 baseline identity+rollback→P4。本方案的工作是把每根支柱做到业界证据支持的强度，并补上接口闭环。

### 1.4 80/20 杠杆分配

- **成本侧**：前两大入口占全部入口 bytes 的 23%（239,831/1,037,026），含 references 后占 Skill source（不含 evals）约 25%。收益集中于少数入口——pilot plan 只选两个 pilot 的理由成立。
- **风险侧**：承重文本（hard gate 段、约束句）是少数；大量字节是穷举式过程描述与重复。风险与收益集中于同一小集合，spine 内承重段不可动、spine 外长尾是精简主体——必须显式区分，这是 P1 存在的理由。
- **机制侧**：约 20% 的机制成本覆盖约 80% 的**已知**失败模式的构成是——超长入口回涨由 budget 确定性拦截；删除承重知识、限定词丢失、judge 误判由 D2/D4/D5 的强制子集拦截（语义分诊 + 双抽清单 + judge 纪律）；触发迟到由 R6 结构检查拦截。指令冲突与含糊主要靠 L0 语义分诊（advisory，工具化为 D8 长期项），**不是确定性拦截**。tokenizer 观测、cross-model gate、盲化 holdout 是长尾增强。
- 业界官方三问分诊（不用→删 / 啰嗦→收紧 / 复杂→下放）是 80/20 的操作化：先分诊、后动手。

---

## 2. 业界调研结论

三路独立调研的关键结论。全部来源与可信度分级见第 7 节；经证据审查 agent 实际回源核验的条目已按核验结果修正。

### 2.1 官方权威锚点：方向被背书，体量有 smell threshold

**最重要的单篇证据**（已回源核验原文）：Anthropic 官方 2026-07-24 博客——为 Claude Opus 5 / Fable 5 等模型**删除 Claude Code system prompt 超过 80%，同一套 coding evaluations 无 measurable loss**。官方承认此前「通过 system prompt、CLAUDE.md 与 skills 过度约束（overconstraining）了 Claude」，指导转向：(1) 规则→判断力；(2) 全部前置→渐进式披露（验证与 review 移入按需调用的 skills，CLAUDE.md/SKILL.md 做成「在恰当时机加载的文件树」）；(3) 重复指令→简洁工具描述。官方还发布了 `/doctor` 命令自动 rightsize skills 与 CLAUDE.md。**该文推荐的目标形态与本仓库「安全 spine + 条件 references」结构同构**（同构判断是本方案推断）；「官方先建基线再删」的时序亦为推断——原文证明的是删除后经 evals 验证。社区二手分析提示新精简规则不向后兼容旧模型（此点仅见二手来源）。

**官方体量口径**：Anthropic Agent Skills 官方文档给出 SKILL.md body **< 5k words**（约数千 token 量级；本仓库两个入口按英文 ~4 chars/token 估算为 29-31k tokens、按中文口径 1.5-3 bytes/token 实际更高——换算均为推断且对中文系统性失真，仅作数量级提示）；「< 500 行」在第三方转述中与 5k words 并列出现，官方原文因区域屏蔽未能直连核验。三级 progressive disclosure：metadata（~100 words 常驻）→ body（触发时加载）→ references（读取前零成本）；references 一层深、长文件加 TOC；触限三问分诊。**父计划 KTD30 已把该数字定性为 progressive-disclosure smell threshold 而非质量 gate（NG6：不以为完成标准）——本方案的 D1 遵循该语义，见第 4 节。**

**「只写模型不知道的」**（官方：「Claude is already very smart」）：领域专家系统性高估基础内容必要性。degrees of freedom：模型已具备→只写 end state；有推荐 pattern→写目标留细节（配 example）；每步须精确→显式步骤。

**长入口降质的三重官方依据**：instruction overload（指令冲突或被淹没）；context rot（退化主因是低价值信息占比而非长度）；冗长常驻文档「因与对话上下文竞争而获得降低的注意力」。三者共同指向：**入口越长，单条指令的有效权重越低——精简本身就是提权**。

**各产品分层实践**：Cursor 单 rule <500 行 + 四类激活（Always / glob / Agent-requested description / Manual）；GitHub Copilot 单文件 ~1,000 行上限 + `applyTo` glob 分层；OpenAI GPTs instructions 硬限 8,000 字符且「knowledge 文件不承载首屏行为」；Windsurf workspace ≤12k / global ≤6k 字符（业界最激进硬上限）；Cline Conditional Rules（`paths` glob）；Roo Code 按 mode 分目录。**六家均提供「激活条件 + 分层」机制**（注意：各家仍保留常驻单一入口用于首屏行为，本方案不做「无一保留单一大文件」的全称判断）。

**GPT-5 警示**（OpenAI Cookbook）：新代模型「以手术精度遵循指令」，**矛盾指令的伤害比旧模型更大**。公开案例：Cursor 删除 `<maximize_context_understanding>`（Be THOROUGH）前缀后小任务性能回升。

### 2.2 学术证据：风险量化与验证纪律

**精简是行为变量，必须统计化验证**：prompt sensitivity 研究证明，文本分类任务上在 prompt 末尾加一个空格**可能**改变模型答案（可能性级表述，实验域为分类非 agent 场景）；语义相近的「cousin prompts」使 46 个模型 instruction following 最高下降 61.8%（最差为 Qwen3-0.6B 小模型；GPT-3.5 亦达 54.7%）；相关信息位于长上下文中部时准确率显著下降（U 形曲线，实验尺度为数千至数十万 token——外推到精简后数百行 spine 未经验证，见 7.2）；32K token 上下文时 13 个模型中 11 个跌破短上下文基线的 50%（NoLiMa，当前 arXiv 版本）。含义：(a) 「不降质」是统计命题——固定任务集、多次采样、报告分布；(b) 精简常驻 spine 直接扩大任务上下文的有效预算。

**LLM-as-judge 的偏差与去偏（对精简验证构成直接威胁）**：
- **verbosity bias**：judge 系统性偏好更长回答——**精简版天然更短，未去偏的 judge 会把「更短」误判为「更差」**。关键限定（MT-Bench 实验）：**judge 强度是主要变量——GPT-4 级 judge 对 verbosity 攻击的失败率 8.7%，弱 judge 达 91.3%**。
- 经文献验证的缓解手段：**swap 且双序一致才算 win**（both-orders-win，严于「取平均」）、**reference-guided judge**（judge 先独立作答再评分）、few-shot、微调。**rubric 声明「长度不是质量维度」这类声明式干预不在已验证手段之列**——本方案将其降格为辅助（见 D5）。
- **position bias**：系统性误差，双序对冲是文献验证过的手段。
- **self-preference bias**：同族模型互评系统性抬分——judge 应避免与被测 skill 同模型，同族时结论降级。

**不走 token 压缩路线**：LLMLingua 系列的失效模式是结构性的——压缩悬崖（超阈值性能急剧崩落）、信息缺失诱发幻觉、删除不可逆（小模型统计代理决定取舍）。与结构化分层的本质区别：token 压缩是「单次输入内部的有损重写」；分层是「无损重构加载时机」。**分层的残余风险须诚实列出**：触发描述的语义路由失败率只能靠 L4 read ledger 观测（可能不可观测降级）；reference 读入内容同样受位置效应与 context rot 影响；按需读取增加轮次与注意力碎片化成本。可确定性检查的是**触发条件的可判定性结构**，不是路由行为成功率。

### 2.3 经典软件工程方法论迁移

| 方法论 | 来源 | 迁移形态 |
| --- | --- | --- |
| Characterization / golden master tests | Feathers《Working Effectively with Legacy Code》 | 大入口 Skill 即 legacy code：精简前用旧 skill 跑固定任务集留存**行为断言**基线（gate 触发、拒绝越权、schema 合法——非逐字输出） |
| Behavior-preserving refactoring（小步 + 测试保护） | Fowler | 一次一段 / 一层拆分，每步跑基线，禁大爆炸重写 |
| Differential testing | 编译器验证（Csmith, PLDI 2011） | 新旧 skill 同任务对比；关键教训：**任务必须良定义**——每任务预定义可接受输出空间，否则 diff 不可判定 |
| Profile-first（97/3 法则） | Knuth 1974 | footprint-first：脚本测各段占用与触发频率（确定性事实），数据决定删什么 |
| Ablation study | ML 实验方法论 | leave-one-section-out 承重测试：删除候选段先测「完整版 vs 减去该段」；从 footprint 最高段开始 |
| Canary / Parallel Change | Fowler 持续交付 | expand（新旧并存于 git baseline）→ migrate（candidate 投影使用）→ contract（非空观测 + 无回退信号后才清理）；不可逆 gate 必须在 migrate 前位于 spine（= pilot plan R9/KTD4 已有纪律，此处仅引） |
| NLI/entailment 蕴含检查 | 摘要保真研究（FIB 等） | 蒸馏段逐条过**约束清单**：原文每条 MUST/禁止/条件在新文中有承载点；FIB 证明逐字重叠会劫持忠实性判断 |

### 2.4 业界共识、分歧与空白

- **共识**：分层加载方向正确；先建 eval 基线再精简、确定性门禁 + 语义评判组合；观测驱动迭代（reference 被反复回读→上移 spine；被忽略→删除候选）。
- **分歧/边界**：Anthropic 新精简规则**不向后兼容旧模型**（二手来源）——cross-model gate 必要性的佐证；官方体量数字是当前代锚点而非常数。
- **空白**：无公开的企业级「prompt 精简翻车」postmortem；无删除长期效应的纵向数据。**本仓库必须自建证据，不能引用业界兜底。**

---

## 3. 质量保障框架：四支柱 + 接口闭环 × 五防线

### 3.0 总架构

```text
变更前          变更中               变更后
L0 分诊与预算 → L1 静态结构验证 → L2 行为基线 → L3 变换验证 → L4 发布与观测
(该不该动)      (结构上安全)         (有基线可比)   (行为等价)     (错了能回、持续观测)

接口闭环（贯穿）：PBM 作为段落级 hub——分类 × obligation × case 引用 × 验证产出强制对齐
```

### 3.1 L0 分诊与预算（变更前）

1. **预算语义（遵循父计划 KTD30/NG6）**：官方 <5k words / <500 行作为 **smell threshold**——超出时必须解释热路径必要性或进入精炼，不为数字迁出承重 gotcha；不与 pilot plan 已冻结的 35%/25% 目标构成第二套数字；budget fail 线由 pilot plan U1 冻结，本方案不改变。
2. **三问分诊 + 第四问**：官方三问（从不使用→删 / 啰嗦→收紧 / 复杂→下放）之外增加第四问：**该段是否对应 hard exit 或不可逆动作的守门知识（低频高危）？**此类段禁止走「从不使用」删除通道（冷路径观测频率天然为零但触发时承重），只能走迁移 + 触发判定。
3. **删除优先级序**（业界证据合成，从最安全到不可删）：(1) 互相矛盾的指令（GPT-5 证据）；(2) 为旧模型防御最坏情况的护栏（受 cross-model 边界约束）；(3) 模型已内化的通用知识（degrees of freedom 为 High）；(4) repo-specific gotchas 与全部 hard gate——**永不进入删除候选**。**「矛盾」删除候选须附双证据**（两条款原文 + 各自 scope 边界说明）并经第二读者（fresh-source reviewer）确认非 scope 正交；只删单方时在 spine 留 scope 声明。
4. **degrees of freedom 审查**：safety gate 段 = Low freedom；路由段 = Medium（pattern + 一个 example）；无 Low/Medium 依据的穷举段 = High freedom。
5. **时效性内容外移**：由 LLM 分诊判断；脚本最多输出含时效词（latest/new/current）的行位置作为 **advisory 线索，不构成外移依据**（关键词不裁决语义——响亮约定，未强制）。

### 3.2 L1 静态结构验证（确定性防线）

pilot plan 已覆盖（引用不复述）：R6 触发可判定性、R9 spine 保留清单、budget 防回涨、六宿主投影（以 `getSupportedPlatforms()` 实时探测为准）。本方案补充：

1. **承重指令位置（advisory drift）**：hard gate 段不宜埋于长 spine 中部（U 形曲线提示；该外推未经验证，见 7.2）。只输出位置事实，不强制、不设区段化伪精确参数。
2. **reference 结构规则**：一层深、长文件 TOC——嵌套深度一层是确定性可判定的，可固化进 entrypoint lint。
3. **孤儿 reference 检测（确定性，提进本切片）**：触发路径存在性是图遍历，纯确定性、低成本——迁移出的 reference 若无任何入口触发路径指向，lint 应报 drift。
4. **rightsize 审计（长期，Adopt/Wrap 优先）**：官方 `/doctor` 已提供 rightsize 能力（Claude 宿主、作用于 runtime 层）——对 Claude 宿主优先 **Adopt/Wrap 官方输出**为 advisory facts（标注 provenance/freshness）；仅跨宿主、作用于 `skills/` source 层、可进 CI 的子项（跨 skill 重复段候选、孤儿 reference）走自研 lint facts；「冲突指令候选」需维护语义反义词典、误报率预期高，单独评估是否保留。全部输出为事实候选，语义裁决留给人/LLM（响亮约定：未强制）。

### 3.3 L2 行为基线（characterization / golden master）+ 接口闭环

pilot plan U2 已定义 fixture corpus 与 manifest 纪律（引用不复述）。本方案补充**任务集设计纪律与接口闭环**：

1. **规模按类分配**：覆盖 pilot plan U2 的 11 类路径（default、task-mode、agent-mode、apply-authorized、artifact-available、deep-plan、requirements-only enrichment、high-risk、HTML、长会话重入、near-neighbor non-trigger）× development/holdout 双 split——**每类每 split ≥2-3 条**（统计纪律要求每类可估计分布），起步规模 44-66 条，「多样化条目优先于近似重复」。
2. **任务良定义纪律**（Csmith 教训）：每任务预定义可接受输出空间。断言三层：code-graded（gate 触发/拒绝越权/exit code/schema/文件存在性——确定性，官方明确优于 LLM judge）；LLM-judged（仅主观维度，过 3.4 纪律）；人工 anchor（校准用）。
3. **接口闭环（PBM hub，堵跨支柱穿行）**：Protected Behavior Map 升级为段落级机器可读资产，字段含：段落位置、分类（pilot plan R8 五类）、obligation 标记、case 引用、ablation/约束清单引用。强制校验（进 U1/U2 contract tests）：
   - **U1 obligation 清单与 PBM 全部非 delete 段落做覆盖率断言**：每段对应 obligation 或显式 N/A 理由——防 obligation 清单写窄后条件协议大量移出而 drift 不触发；
   - **每类段落的 case 映射**：delete 段必须有「已内化证据」引用或一条判别 case（该知识缺失时行为应劣化）；非 delete 承重段至少一条 case 的 rubric 含「对应知识被正确应用」维度——防任务集只做路径级浅覆盖；
   - **回流与 holdout 准入**：生产失败回流经独立于实施者的审核；**实施者曾接触的任何 case（含 dogfood 回流）一律进 development**，不得作为轮换 holdout（provenance：来源任务、接触时间为 manifest 必填）。
4. **基线捕获行为断言而非逐字输出**；跨期比较 pin 同一数据集版本（pilot plan bundle hash 机制已强制）。

### 3.4 L3 变换验证（paired + ablation + judge 纪律）

pilot plan U5 已定义 paired eval 主体（identity 冻结、holdout、非补偿门禁——引用不复述）。本方案补充四项：

1. **judge 纪律（修订版，按 MT-Bench 证据校准）**：
   - **swap = both-orders-win**：pairwise 判定双序各跑一次，双序一致才算 win，不一致判 tie（严于取平均）；blind pass/fail 模式也要求 judge 输出**逐维度评分**且每维度锚定具体行为证据（「指出该例外条件」而非「覆盖所需信息」），使变浅可归因；
   - **judge 强度选型**：优先强 judge（GPT-4 级 verbosity 攻击失败率 8.7% vs 弱 judge 91.3%）；**同族 judge 的通过上限为 `concerns`**，不得支撑 `source-structure-experiment` 及以上 outcome，结果中标注；
   - **anchor 校准带数值门槛**：judge 对人工 anchor cases 一致率 ≥85% 才扩量；anchor 由非实施者标注或冻结自历史真实任务；
   - **声明式 length control 降格为辅助**（无实证支持）：rubric 可注明「长度不是质量维度」，但不得作为唯一防线；可选启用 reference-guided 判定（judge 先独立作答再评分）。
   - **时机前置（硬条件）**：上述写入 rubric/判定协议的条款必须在 **U2 冻结 rubric bundle hash 之前**并入；swap 次数必须在 **U1 冻结重复策略时**计入采样计划；冻结后不得追加。swap（judge 评分位置顺序）与 pilot plan R12 的交叉/随机顺序（baseline/candidate 执行顺序）是正交维度，不互相替代。
2. **leave-one-section-out ablation**（继承并细化父计划 R42——其范围为「删除、合并或压短」的承重候选）：
   - **范围**：删除候选、合并候选、相对 baseline **累计**压短 >50% 的段（累计口径防拆轮规避）；纯迁移段免做段落级 ablation——其行为等价由 U5 整体 paired eval 覆盖（**注意：不是由到达保证兜底**，见 1.2）；
   - **未测段的硬后果**：ablation budget 用尽时未测段只能保留为**可逆 candidate 或不删**（接父计划 R42），不得进入 final candidate；未测段比例 >30% 时该 pilot outcome 上限压到 `revise`（此规则由 U1 写入 promotion decision table 的 evidence axes）；
   - **中间臂身份纪律**：ablation 臂（完整版减一段）的 package hash 与运行顺序预注册进 U2 冻结范围；
   - 成对删除查交互效应（O(n²)）**降为 P3 显式可选项**，默认不做。
3. **蒸馏约束清单（双抽版）**：范围覆盖**删除候选与蒸馏候选**（纯删除不豁免——防「已内化」伪装）；原文 MUST/禁止/例外/条件由**实施者与一名 fresh-source reviewer 各自独立抽取**，一致率低于阈值即逐条仲裁；脚本可先输出指令句候选位置作为提示（确定性 fact），人做语义筛选；删除段的约束清单非空即**禁止走「已内化」通道**，强制进 ablation 名单。清单与 case 断言互为来源（一份资产两用）。
4. **统计纪律**：同任务多次采样，报告分布（中位、最坏分层）；差异小于预注册噪声区间判 tie。「受保护 case」的失败默认 P1 起步，降级需独立于实施者的 reviewer 举证；噪声区间计算方法在 U1 冻结时预注册。

### 3.5 L4 发布与观测（canary 式落地 + 降级最小义务）

1. **expand-contract 节奏**：expand（旧入口在 git baseline）→ migrate（candidate 投影、dogfood 使用）→ contract（**前置条件：至少一轮非空观测或最小人工抽样完成且无回退信号**；观测渠道全部为空时 contract 阶段不可达——推迟清理而非默认通过）。不可逆 gate 在 migrate 前位于 spine（pilot plan R9 已有）。
2. **观测回路**：overreliance（reference 被反复回读→内容应上移 spine）、ignored（从不被读→删除/合并候选或触发描述不清）、错时机（读取晚于对应动作→触发或路由需修）。read ledger 不可观测时记录 `reference_read_status=unobservable` 并**附带最小义务**：人工抽样规定最小规模（如每 reference 每 N 次真实任务 ≥1 次定向触发）与 owner——降级不是休眠通道。
3. **invalidation 判定独立化**：模型换代/宿主 loader 变化后「受影响 tier」的判定需 fresh-source reviewer 复核，不得由实施者单方出具「不影响」。

### 3.6 防线 × 失败模式覆盖矩阵

**前提声明**：本矩阵覆盖的是「已知失败模式」，且**以 PBM 分类正确为前提**——支柱接口闭环（3.3.3）防御的正是这个前提本身；分类正确性的独立校验因此是全矩阵的先决条件。

| 已知失败模式 | 拦截防线 | 属性 |
| --- | --- | --- |
| 精简删掉承重知识 | L0 第四问 + D4 双抽清单 + D3 ablation + 接口闭环 | 混合 |
| 承重段被伪装为「已内化」 | D4（清单非空禁走已内化）+ 强制 ablation 名单 | 混合 |
| 冷路径守门知识被「从不使用」误删 | L0 第四问（禁走删除通道） | 语义约定 |
| 蒸馏丢失限定词 | L3 约束清单双抽 | 混合 |
| 触发不可判定 / 迟到 | L1（pilot plan R6）+ L4 错时机信号 | 确定性 + 观测 |
| 文本扰动本身改变行为 | L2 基线 + L3 paired 统计纪律 | 混合 |
| 知识被稀释（保留但淹没） | L0 分诊 + budget（防回涨侧） | 语义约定（部分） |
| 承重指令埋中部 | L1.1 位置 advisory | advisory |
| 指令冲突 / 含糊 | L0 语义分诊（D8 长期工具化） | 语义约定 |
| judge 偏向长文 / 位置 / 同族 | L3 judge 纪律（both-orders、强 judge、anchor 门槛） | 混合 |
| 任务不良定义致 diff 不可判 | L2 良定义纪律 | 语义约定 |
| 拆过头（应常驻的被移出） | L4 overreliance 信号 + 降级最小义务 | 观测 |
| 回归发现太晚 | L4 contract 前置观测 + 非补偿门禁 | 混合 |
| 入口回涨 | L1 budget | 确定性 |
| PBM 错误分类穿行支柱 | 接口闭环（3.3.3 覆盖率断言 + case 映射） | 确定性 + 语义 |
| obligation 清单写窄 | U1-PBM 覆盖率断言 | 确定性 |
| 观测/抽样走过场 | L4 降级最小义务 + contract 前置条件 | 制度约定 |
| 双 pilot 同会话并置的相互影响 | **已知未覆盖**——登记为后续 exploratory case 候选 | 未设防（显式承认） |

---

## 4. 对 pilot plan 的增量清单（delta）

以下 8 项是本方案对 pilot plan 的净增量，**不改变其已冻结机制**（与冻结面的交互已在各条内声明时机前置条件）。优先级：P1 = 本切片必做（强制子集）；P2 = pilot 通过后、推广前；P3 = 长期/可选。

| # | 增量 | 内容与强制力 | 集成点 | 优先级 | TCO |
| --- | --- | --- | --- | --- | --- |
| D1 | spine smell threshold | 引用父计划 KTD30/NG6 语义：官方 <5k words/<500 行为 smell 提示，**不进 investment gate 硬估算、不与 35%/25% 构成第二套数字、不改变 budget fail 线**；仅当 U1 尚未冻结时作为 advisory 提示并入，否则列入下一 profile revision | U1（时机条件） | P1 | 近零 |
| D2 | 删除分诊纪律 | 第四问 + 优先级序 + 矛盾候选双证据/第二读者 + 「已内化」强制 ablation 名单 | U3/U4 Approach | P1 | 低（分诊评审） |
| D3 | ablation 承重测试 | 范围=删除/合并/累计压短>50%；未测段→可逆 candidate 或不删；未测>30% 压 `revise`（进 promotion axes）；ablation 臂入 U2 冻结；成对删除降 P3 | U2（冻结）+ U5（执行） | P1（限删除候选，footprint 降序，budget 上限） | 中 |
| D4 | 约束清单双抽 | 覆盖删除+蒸馏候选；双盲双抽 + 一致率仲裁；清单非空禁走「已内化」；进 promotion axes | U2/U3/U4 | P1 | 低-中 |
| D5 | judge 纪律 | **本切片强制子集**：anchor 校准（≥85% 门槛，冻结前）+ 强 judge 选型 + 同族上限 `concerns` + rubric 冻结前并入 length-control 辅助条款；swap/双序与逐维度评分限定高承重 pairwise case；reference-guided 可选 | U1（采样计划）/ U2（rubric hash 冻结前） | P1（强制子集）/ P2（全量 swap） | 低（强制子集）/ 中（全量） |
| D6 | 观测回路 + 降级最小义务 | 三类信号口径；unobservable 附最小抽样义务；contract 前置非空观测 | U7 后运营 | P2 | 低 |
| D7 | golden master 规模纪律 | 每类每 split ≥2-3 条（44-66 起步）；回流独立审核；holdout 准入 provenance（实施者接触过的一律 development） | U2 | P1 | 已大半在 pilot plan 内 |
| D8 | rightsize 审计（Adopt/Wrap 优先） | Claude 宿主 Adopt/Wrap 官方 `/doctor` 输出；仅跨宿主 source 层子项自研（含孤儿 reference 已提进 L1.3 本切片）；冲突候选单独评估 | 长期 | P3 | 激活条件：两个 pilot closeout 证明人工分诊重复成本超阈值后立项 |

**80/20 裁决（含 TCO 自评）**：本切片 P1 收敛为 D1、D2、D4、D5 强制子集、D7 纪律、D3（限删除候选 + footprint 降序 + budget 上限）——这些直接堵已证实的失败模式（矛盾指令、限定词丢失、verbosity bias、分类穿行），合计增量成本可控；D5 全量 swap 与成对删除延后（O(n²)/采样翻倍成本，pilot 阶段以 R42 可逆纪律兜底）。**本清单自身按 pilot plan U1 投资门的 TCO 口径自评：若叠加后治理成本吞掉 pilot 收益，按上句收敛执行，不追加。**

---

## 5. 实施路线

- **H1（本切片内，全部发生在对应冻结动作之前）**：D5 的 rubric/采样条款在 U2 冻结 rubric bundle hash、U1 冻结重复策略**之前**并入；D3 的 ablation 臂清单与 D4 的双抽协议在 U2 冻结范围；D1 仅在 U1 未冻结时并入 advisory 提示。验收：eval validation artifact 记录 judge 纪律执行与 ablation/双抽结果。
- **H2（pilot 结束后、推广前）**：D6 观测回路（依赖 read ledger 可观测性探测结果）；按 pilot plan promotion 阶梯决定 tokenizer 观测与 cross-model gate。验收：观测信号有口径、owner 与最小义务。
- **H3（长期，显式激活条件）**：D8 rightsize 工具化（激活条件见 D 表）；盲化 holdout；官方锚点随模型代际重校准。

---

## 6. 风险与缓解（本方案自身的风险）

| 风险 | 缓解 |
| --- | --- |
| advisory 方法论，未经本仓库实证 | 第 7 节分级；P1 强制子集随 pilot 实证后升格；未实证部分不得作为 promotion 证据 |
| 接口闭环的强制力依赖 contract tests 落地 | D 清单将覆盖率断言/case 映射写入 U1/U2 contract tests（确定性）；落地前 3.6 矩阵保持「前提声明」 |
| ablation/双抽/judge 纪律叠加推高治理成本 | 80/20 裁决收敛 P1 强制子集；TCO 吞掉收益时按第 4 节收敛条款执行 |
| 官方体量数字单位与换算失真（words→tokens、中文 tokenizer） | 已按核验修正为 words 并标注推断与失真方向；不进 investment gate 数值 |
| length control 声明式干预无实证 | 降格辅助；防线主力为强 judge 选型 + both-orders-win + 逐维度锚定 + anchor 校准 |
| 观测依赖 read ledger，宿主常态不可观测 | 降级附最小义务；contract 前置非空观测；不可观测即诚实记录 |
| 「模型已内化」误判 | D4 清单非空禁走已内化 + 强制 ablation + 双抽；跨模型场景收敛为 Low freedom |
| 双 pilot 并置相互影响 | 显式登记为已知未覆盖；列为后续 exploratory case 候选 |

---

## 7. 证据与限制

### 7.1 关键来源（按可信度分级；标注 ✓ 者经证据审查 agent 实际回源核验）

**官方文档 / 官方博客**：Anthropic「The new rules of context engineering for Claude 5 generation models」（✓ claude.com/blog/...，2026-07-24，删 80%/no measurable loss/overconstraining//doctor 原文核验一致）；Agent Skills overview + best practices（platform.claude.com——**官方页面区域屏蔽，<5k words/~100 words 经第三方多来源交叉，<500 行未能直连核验**）；「Effective context engineering for AI agents」（context rot/instruction overload）；「Equipping agents for the real world」；develop-tests +「Demystifying evals」（eval 谱系/self-preference/tracer bullets）；prompt caching 文档（前缀语义/0.1x 读价）；Cursor docs（500 行/四类激活）；GitHub Copilot tutorial（~1,000 行）；OpenAI GPT-5 Cookbook ✓（矛盾指令/THOROUGH 案例）；Windsurf/Cline/Roo Code docs；promptfoo/Langfuse/Braintrust 工程指南（golden dataset 20-50 条起步为通用建议，本方案按覆盖约束改为按类分配）。

**同行评审论文**：Lost in the Middle（TACL 2024, arXiv:2307.03172）；Butterfly Effect（✓ arXiv:2401.03729，「can cause」可能性级、文本分类域）；NoLiMa（✓ arXiv:2502.05167，当前版本 13 模型/32K 时 11 个跌破 50%）；IFEval++（✓ arXiv:2512.14754，46 模型 up to 61.8%，最差 Qwen3-0.6B，GPT-3.5 为 54.7%）；MT-Bench（✓ arXiv:2306.05685，GPT-4 judge verbosity 失败率 8.7% vs 弱 judge 91.3%；both-orders-win/reference-guided 为验证过的缓解）；self-preference（FAccT 2024）；position bias 系统研究（IJCNLP-AACL 2025）；FIB（ACL 2023 Findings）；LLMLingua 系列 + 压缩失效实证；Csmith（PLDI 2011）；Meyes ablation（arXiv:1901.08644）。

**经典书籍 / 工程实践**：Feathers；Fowler（refactoring/CanaryRelease/ParallelChange）；Knuth 1974（经二手交叉确认）。

### 7.2 本方案的推断清单（非任何来源原文）

- 四支柱「必要性」论证与接口闭环设计；3.6 矩阵对「已知失败模式」的覆盖声明（前提：PBM 分类正确 + 已知清单不完备）；
- U 形位置效应外推到数百行 spine（原始证据为数千至数十万 token 尺度）；
- 「Anthropic 先建基线再删」的时序推断；「官方推荐形态与本仓库结构同构」的映射判断；
- tokens 换算（英文 ~4 chars/token；中文 1.5-3 bytes/token）——对中文为主内容系统性失真，仅作数量级提示，不进 investment gate 数值；
- 「23%/25%」口径（25% 不含 evals；含 evals 为 20.85%）；
- 80/20 机制成本/收益占比（定性判断）；
- 「业界全部实践是四支柱的具体化」不做此全称声明（仅说业界实践与四支柱一致）。

### 7.3 审查记录与未验证项

本文经三路对抗性审查后修订：**红队攻击**（13 条防线攻击 + 7 条 delta 攻击 + 四支柱穿行路径构造——催生第四问、双抽、未测段硬后果、降级最小义务、接口闭环）、**治理合规**（发现 D1 与父计划 KTD30/NG6 冲突的 P0 问题、D3 单元顺序与 R42 义务衔接、D5 冻结时机、D8 演化判断、重复压缩）、**证据核验**（实际回源 6 项，修正 words/tokens 单位、NoLiMa 11/13、61.8% 归属、全称判断降格、length control 证据不足降格）。

未验证项：官方 best-practices 页面未能直连（区域屏蔽，经第三方交叉）；「官方 <500 行」出处存疑；无业界精简翻车 postmortem 可引；本方案全部机制未经本仓库实证。

---

## 8. 结论

1. **方向有官方背书**：Anthropic 删 80% system prompt 经 evals 验证无 measurable loss（已回源核验），其推荐的渐进披露形态与本仓库目标**结构同构**（映射为本仓库设计，见 7.2）；六家主流产品均提供分层激活机制。**方向可信，数字与细节须自建。**
2. **风险已被量化且可防御，但防线强度须按证据校准**：verbosity bias 在弱 judge 下致命、强 judge 下显著减弱——judge 选型与 both-orders-win 是实证支持的主力，声明式 length control 只是辅助；「不降质」是统计命题。
3. **框架收敛于「四支柱 + 接口闭环 × 五防线」**：对抗审查证明四支柱必要性成立但不充分——支柱接口（分类→obligation→case→验证产出）的强制闭环是防「合法蒙混」的关键增量，本方案以 PBM hub 资产 + contract tests 覆盖率断言实现。
4. **诚实的边界**：本方案是 advisory 方法论；已知的未设防面（双 pilot 并置影响、分类正确性的残余风险、观测不可观测常态）在第 3.6/6 节显式登记；所有「已验证」声明必须来自本仓库 pilot 证据，按四轴证据阶梯报告，低层证据不得报告为高层证据。
