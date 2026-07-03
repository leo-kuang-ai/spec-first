# 《基于 16 个思维模型的 Spec-First Skills 优化方案》质量审查与修复方案

- 审查时间：2026-07-03
- 审查对象：`docs/11-业界调研/spec-first-skills-优化方案-基于16个思维模型.md`（2285 行）
- 审查方法：以 `skills/*/SKILL.md`、`docs/contracts/*.md` 源码为事实依据，逐条核实文档断言，`wc -l` / `node` / `grep` 实测计数
- 审查结论：**内容层面事实准确性高，主要问题在结构与自洽性**——文档没有对自己应用它教给其他 skill 的精简原则

---

## 一、结论先行

本次审查确认 4 个需要修复的问题。按严重度与修复成本排序：

| 编号 | 问题 | 类型 | 严重度 | 修复成本 |
|---|---|---|---|---|
| ISSUE-1 | 过时结论物理保留 + 执行摘要未降级 + §七/§I.4 重复 | 结构自洽性 | 高 | 中 |
| ISSUE-2 | `context-governance.md` 预算机制断言与源码矛盾 | 事实错误 | 中 | 低 |
| ISSUE-3 | `knowledge_quality_gate` checklist 与"不新增第二套 gate"存在张力 | 表述歧义 | 中 | 低 |
| ISSUE-4 | 文档 2285 行自身违反其倡导的精简原则 | 可维护性 | 中 | 中 |

**已核实为准确、无需修改的部分**（不在本修复方案范围内）：所有行数统计、eval 样本数（spec-prd=111 / spec-plan=19 / spec-compound=10 / spec-code-review=9 / spec-debug=6 / spec-work=6 / using-spec-first=6 / spec-compound-refresh=4 / spec-optimize=4）、§G/§H 逐条源码断言（Stage 1 STOP gate、Stage 5 合成算法、Core Principles P2/P6/P7/P8、product-lens 8 条 trigger、L221 framing 原文、L488 治理规则、L579 re-scoping pitfall）、`Structured Promotion Gate` 标题、四个 `docs/contracts/*.md` 引用路径均真实存在。

**一条重要的元判断**：这份文档的自我纠错过程（初版 → §G 对抗性审查 → §H 修订 → §I/§J 二次修正）是真实可信的，不是免责声明式的走过场。它真的回源码改正了自己前期的错误（Stage 1/5 不能整块下沉、Core Principles 不能全删、product-lens 数错为 14 条）。因此本修复方案的目标不是推翻它，而是让文档的**结构**追上它已经达到的**内容质量**。

---

## 二、逐问题审查与修复方案

### ISSUE-1：过时结论物理保留 + 执行摘要未降级 + §七/§I.4 重复

#### 现状与证据

1. **执行摘要未降级**：L15-20 的 O1-O5 表格仍用最原始的乐观措辞（"减少因早期 OQ 未关闭导致的 plan 返工"、"把有限 review 资源投向最高风险 20%"），没有任何降级标注。而这些方向在 §G/§H 已被系统性下修（如整体精炼从 31% 降到 ~22%，多条 P0 从"零风险"降为"低风险候选需验证"）。读者读到 L15-20 时，接收到的是文档自己后来已否定的乐观口径。

2. **§七与§I.4 内容重复**：
   - §七"推荐首个实施切片"（L1057-1090）给出 `Progressive Disclosure Reference Extraction Pilot`，含首选试点表（code-review headless → plan HTD → using-spec-first）。
   - §I.4"推荐下一步"（L2154-2170）再次给出**同一个** `Progressive Disclosure Reference Extraction Pilot`，候选清单几乎一致。
   - 同一结论在一份文档里被完整写了两遍。

3. **过时结论物理保留**：§一~§六与附录 A-F 的初版乐观分析（"零风险删除"、"整体减少 31%"、"P0 立即落地"）在文中完整保留，只靠 §1.4、A-F 开头的"状态说明"和 §H 的降级来覆盖。

#### 根因分析

文档采用"追加式修订"（append-only revision）——每轮审查在文末追加新章节，而不回改前文。这在协作留痕上有价值，但产生了一个执行风险：**如果某个 agent 或人只读了前半部分就去执行，会拿着已被文档自己否定的方案去改 skill 源码**。这正是文档在 §J.6 批评其他 skill 时用的同一条标准（"同一约束重复表达不提升遵守率，只增加噪音"），文档没有对自己应用。

#### 修复方案

- **F1-a（执行摘要降级）**：改写 L15-20 的 O1-O5 表格"预期收益"列，把绝对化收益措辞改为"候选方向，收益待 eval 验证"，并在表格上方加一行指针：`> 本表为方向概览；每个方向的当前执行口径、降级结论和验证前置见 §H.14 / §H.15。`
- **F1-b（消除重复）**：§七与§I.4 二选一保留完整版，另一处改为一行指针。建议保留 §七（位置更靠近执行清单 §五），把 §I.4 改为：`推荐下一步见 §七「推荐首个实施切片」，此处不重复。`
- **F1-c（过时章节标注强化）**：在 §一顶部（紧跟标题）新增一个醒目的"阅读顺序"提示框，明确：执行者只需读 §一(方法论映射) + §G/§H/§I/§J + §H.14/§H.15；§二~§六与附录 A-F 是历史分析脉络，不得作为实施依据。（这是 ISSUE-4 折叠方案的轻量替代，若采用 ISSUE-4 的折叠则本项自动满足。）

#### 验证方式

- `grep -c "Progressive Disclosure Reference Extraction Pilot" 文档` 应从 2 降为 1（若保留 §七则 §I.4 的指针不再重复完整标题）。
- 人工确认 L15-20 表格不再出现未标注的绝对收益措辞。
- `git diff --check`、`npx jest tests/unit/changelog-format.test.js --runInBand`。

#### 优先级：P0（最高，直接影响执行安全）

---

### ISSUE-2：`context-governance.md` 预算机制断言与源码矛盾

#### 现状与证据

文档 L191（模型 4 公地悲剧 → "当前 skill 现状"）称：

> Context governance 合约（`docs/contracts/context-governance.md`）存在，但各 workflow 对上下文预算的使用**缺少明确的「预算申报」机制**

源码事实（`docs/contracts/context-governance.md`）反驳：

- L13：`在超出默认上下文预算时记录 reason，而不是静默读取全量目录。`
- L61：`如果因为预算或边界排除 context，应在输出或 coverage 中说明 excluded path 和 reason_code。`
- L82：`docs/contracts/context-bundle.md` 定义 `context-request.v1` / `context-bundle.v1` 的最小 envelope，含 `budget` / `budget_used` 字段。
- L121：明确的 `context_budget_exceeded` reason_code → `生成 compact summary + excluded_context，不 silent full-read`。

即预算申报机制**已经存在**（reason_code + budget accounting + excluded_context 字段），文档断言不成立。

#### 根因分析

这是模型 4（公地悲剧）章节为了论证"需要预算申报机制"而对现状做了不充分核实的描述。它与文档后期（§I.2、§六）反复强调的"reuse-first、不新增已存在的机制"原则自相矛盾——文档自己的核心原则就是"先查现有 surface 是否已满足"。

#### 修复方案

- **F2**：改写 L191-193 的"当前 skill 现状"，把"缺少预算申报机制"改为准确表述，例如：
  > Context governance 合约已定义预算申报机制（`context_budget_exceeded` reason_code、`budget`/`budget_used` accounting、`excluded_context` 字段）；当前缺口不在"是否有机制"，而在"各 workflow 是否一致地在 coverage 中申报预算使用"——这属于执行遵守度问题，应通过 eval/fresh-source 复核观察，而非新增 schema。
- 相应地，OPT-4.1（L195 起）本就已经正确地导向"复用现有 Structured Promotion Gate 而非新增"，此项修复让前置现状描述与该结论一致。

#### 验证方式

- 人工对照 `docs/contracts/context-governance.md` L13/L61/L82/L121 确认修订后表述与源码一致。
- `git diff --check`。

#### 优先级：P1（事实错误，但不影响最终执行结论，因为 OPT-4.1 结论本就正确）

---

### ISSUE-3：`knowledge_quality_gate` checklist 与"不新增第二套 gate"存在张力

#### 现状与证据

- OPT-4.1（L195 起）与 P0-5、K-2 反复强调"不能新增第二套 `knowledge_quality_gate` schema"，这个警告方向正确（源码 `skills/spec-compound/SKILL.md` L94 确认 `Structured Promotion Gate` 已存在）。
- 但 OPT-4.1 同时给出了一个四项 checklist：`has_reproducible_trigger` / `has_source_evidence` / `not_duplicate` / `generalizable_lesson`。
- 文档说这四项应作为"现有 gate 的可读 checklist / eval 观察点"，但**没有说清楚**这四项是：(a) 仅供 reviewer/LLM 人工判断的注意力提示，还是 (b) 最终要写入 `docs/solutions/` frontmatter schema 的字段。

若最终落到 frontmatter 校验，那就是在建一个新的结构化校验面——即使不叫"第二套 gate"，也与文档自己反对的方向存在张力。

#### 根因分析

文档在"用 checklist 表达期望"和"不新增 schema 字段"之间没有画出清晰边界。这与 AGENTS.md 的核心哲学直接相关：`Scripts enforce deterministic invariants; LLM decides semantic adequacy`——checklist 若是 LLM 语义判断提示则合规，若是 script 校验字段则需 consumer-proven 才能进 deterministic floor。

#### 修复方案

- **F3**：在 OPT-4.1 与 K-2 中明确标注这四项 checklist 的性质。建议定性为"reviewer/LLM 语义判断提示，不进入 frontmatter deterministic 校验"，并补一句：
  > 这四项是 promotion 时的语义自检提示，复用现有 `Structured Promotion Gate` 的判断语境，不新增 frontmatter 校验字段、不新增 checker。若未来确需 deterministic 校验，必须先证明现有 `schema.yaml`（`invalidation_condition` / `source_refs`）无法满足明确 consumer，再按 consumer-proven 路径推进。
- 该定性与 `skills/spec-compound/SKILL.md` L96-97 的现有契约（`references/schema.yaml` 为 canonical frontmatter contract）一致。

#### 验证方式

- 人工确认修订后 OPT-4.1 / K-2 明确区分"语义提示"vs"schema 字段"。
- 对照 `skills/spec-compound/SKILL.md` L94-97 确认不与现有 gate 冲突。

#### 优先级：P1（防止未来 agent 误将 checklist 实现为新 schema）

---

### ISSUE-4：文档 2285 行自身违反其倡导的精简原则

#### 现状与证据

- `wc -l` 实测文档 2285 行。
- 文档核心论点是"skill 主干过长损害 LLM 遵守率"（引 Lost in the Middle、Same Task More Tokens、AGENTS.md <150 行建议，批评 spec-code-review 1241 行超上限约 62 倍）。
- 但文档自身 2285 行，其中附录 A-F（初版 prompt 精炼分析）约占全文三分之一，且其结论已被 §G/§H 明确否定，却完整物理保留。
- 结果：任何执行者必须读完 A-F 的错误版本 → §G/§H 的修正版本 → §I/§J 的二次修正，才能拿到最终口径。这与文档自己在 §J 提出的 "L3 理念叙事应完全删除而非移入 reference" 是同构问题。

#### 根因分析

同 ISSUE-1，根因是"追加式修订"。区别在于 ISSUE-1 关注的是"结论正确性冲突"，ISSUE-4 关注的是"认知负担"——一份关于"如何减少认知负担"的报告本身成了高认知负担产物。

#### 修复方案（两个选项，二选一）

- **F4-方案A（推荐，彻底）**：把附录 A-F 整体抽离到独立归档文件 `docs/11-业界调研/spec-first-skills-优化方案-附录A-F-历史初版.md`，主文档在原位置留一行指针：`> 附录 A-F（初版 prompt 精炼分析）已被 §G/§H 修正，移至独立归档文件；仅供追溯，不作为实施依据。` 主文档预计从 2285 行降到约 1300-1500 行。这直接实践了文档 §J 的 L2/L3 分层原则（历史脉络 = 可外置的低频内容）。
- **F4-方案B（保守，最小改动）**：不移动内容，只在文档顶部新增"执行者阅读路径"导航（同 F1-c），并在每个已被否定的附录小节标题后加 `（历史初版，已被 §H.x 修正，勿据此实施）` 后缀。改动小但文档仍是 2285 行。

**建议**：若接受一次性结构调整，选方案 A；若要求最小 diff、优先留痕，选方案 B。方案 A 更符合文档自身倡导的原则。

#### 验证方式

- 方案 A：`wc -l 主文档` 应显著下降（目标 <1500）；`wc -l 归档文件` 应包含被移出的 A-F 内容；`grep` 确认主文档在原位置有指针；两文件内容合计无丢失（可用 `git diff` 逐段核对）。
- 方案 B：`grep -c "历史初版，已被" 文档` ≥ A-F 小节数。
- 两方案均需 `git diff --check`、`npx jest tests/unit/changelog-format.test.js --runInBand`。

#### 优先级：P2（可维护性问题，不影响事实正确性；建议与 F1-c 合并处理）

---

## 三、修复执行顺序（最小可维护）

遵循 AGENTS.md 的"最小 durable mechanism 优先、docs-only 变更保持窄范围"：

1. **第一步（P0，必做）**：ISSUE-1 的 F1-a（执行摘要降级）+ F1-b（消除 §七/§I.4 重复）。这是唯一直接影响"执行者会不会照过时方案改源码"的问题。
2. **第二步（P1，必做）**：ISSUE-2 的 F2（预算机制断言纠正）+ ISSUE-3 的 F3（checklist 性质澄清）。两处都是小范围文字修订，一次改完。
3. **第三步（P2，可选，建议做）**：ISSUE-4——若采用方案 A（折叠 A-F），F1-c 自动被满足；若采用方案 B，则 F1-c 与 B 合并为顶部导航 + 小节后缀。

**边界纪律**：

- 全程 docs-only，不改任何 `skills/`、`src/cli/`、`templates/`、generated runtime mirrors。
- 不新增 schema、checker、字段——本修复方案的所有动作都是"改文字表述"和"移动/标注已有内容"。
- 每次改动后按 CHANGELOG 现行格式追加一条 `docs(research)` 记录，标注 docs-only 与验证命令。

**验证命令基线**（每步收尾运行）：

```bash
git diff --check -- CHANGELOG.md docs/11-业界调研/spec-first-skills-优化方案-基于16个思维模型.md
rg -n "[ \t]+$" docs/11-业界调研/spec-first-skills-优化方案-基于16个思维模型.md || true
npx jest tests/unit/changelog-format.test.js --runInBand
```

---

## 四、本修复方案未覆盖的事项（诚实降级）

- **未核实文档 §二~§六中每一条"当前 skill 现状"断言**：本次重点核实了被 §G/§H 复核的 skill（spec-plan / spec-work / spec-debug / spec-code-review / spec-doc-review / using-spec-first）以及 ISSUE-2 涉及的 context-governance。文档自己也承认 spec-compound / spec-compound-refresh / spec-optimize 的估计"§G/§H 未复核，为待验证"——这些 skill 的现状断言未在本次逐条核实，若要严格执行"以代码为事实依据"，应作为后续独立审查项。
- **本修复方案是 advisory 产物**：它是对文档的 LLM 语义审查结论，修复动作本身仍需人工确认后再落地。三个 P0/P1 修复点的源码依据已在上文逐条给出，可直接复核。
