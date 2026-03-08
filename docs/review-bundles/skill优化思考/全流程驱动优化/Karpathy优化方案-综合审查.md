# Karpathy 优化方案综合审查报告

> **审查范围**
> - Trellis 生成的优化方案（原始版 + 精简版）
> - `Karpathy优化方案-官方审查报告.md`
> - 当前 `spec-first` 工程代码与 `skills/spec-first`
> - `阶段自动流转方案-审查报告.md`

**审查日期**: 2026-03-09  
**综合结论**: ⚠️ **有条件通过**。方向正确，但当前文档不宜作为最终实施依据，需先收敛为“证据更硬、改动更小、落地更简单”的版本。

---

## 执行摘要

### 最终判断

本次综合审查认可原文的主方向：

1. `07-code` 是最值得优先补强的位置
2. `03-spec` 与 `08-review` 适合做轻量补丁
3. `13-orchestrate` 当前不值得优先投入

但不认可原文中以下过满结论直接作为实施口径：

- “spec-first 官方审查更准确” —— **方向上基本成立，但仍需补充运行时与治理层证据**
- “工作量 2 天” —— **可作为乐观估计，不应写成确定承诺**
- “零重复 / 0% 重复率” —— **表述过强，实际只能说重复风险低而非为零**

### 综合建议

**建议采纳“最小改动版 2+2 策略”**，而不是继续引入多个新章节：

- **第一优先级**：`07-code`
  - 代码简洁性守卫
  - 代码修改边界守卫
- **第二优先级**：轻量补丁
  - `08-review`：审查范围分级
  - `03-spec`：假设显性化
- **第三优先级**：`04-design`
  - 仅在清理现有结构重复后再评估是否补充
- **暂缓**：`13-orchestrate`

这一定义比“3 强 + 1 轻 + 1 缓”更利于实际执行，因为它明确了：

- **先修最真实空白**
- **优先改现有锚点，不新开大节**
- **优先降低 prompt 膨胀和测试漂移风险**

---

## 审查方法与证据基线

本次综合审查不只比较文档观点，而是按以下证据链交叉核验：

1. **Skill 真实内容**
   - `skills/spec-first/03-spec/SKILL.md`
   - `skills/spec-first/04-design/SKILL.md`
   - `skills/spec-first/07-code/SKILL.md`
   - `skills/spec-first/08-review/SKILL.md`
   - `skills/spec-first/13-orchestrate/SKILL.md`
   - `skills/spec-first/SHARED.md`

2. **Runtime 真实消费方式**
   - `src/core/skill-runtime/dispatcher.ts`
   - `src/core/skill-runtime/prompt-assembler.ts`
   - `src/core/skill-runtime/hard-gate.ts`
   - `src/core/ai-orchestrator/context-pack.ts`
   - `src/core/rules/truth-source.ts`

3. **测试与治理约束**
   - `tests/unit/skill-catalog.test.ts`
   - `tests/unit/code-skill-docs.test.ts`
   - `tests/unit/spec-skill-docs.test.ts`
   - `tests/unit/design-skill-docs.test.ts`
   - `tests/unit/phase1-enhancement-docs.test.ts`
   - `tests/unit/doc-governance-cleanup.test.ts`

4. **相关评审文档**
   - `Karpathy优化方案-官方审查报告.md`
   - `Karpathy优化方案-可行性分析.md`
   - `阶段自动流转方案-审查报告.md`

---

## 关键事实核验

### 1. `spec-first` 的 Skill 不是普通文档，而是 runtime 直接消费的行为契约

这是本次综合审查最重要的事实前提。

证据：

- `src/core/skill-runtime/dispatcher.ts:383`：runtime 直接加载 `SKILL.md`
- `src/core/skill-runtime/dispatcher.ts:392`：加载后会做 prompt assembly
- `src/core/skill-runtime/dispatcher.ts:398`：会执行 KV-Cache 稳定性检查
- `src/core/skill-runtime/dispatcher.ts:411`：会执行 hard-gate 检查

因此，Skill 优化必须同时满足：

1. **行为上有效**：能真正约束模型输出
2. **运行时上可承受**：不能显著放大 prompt 体积
3. **治理上可维护**：不能轻易触发文档/测试漂移

这意味着：

- 能少加一节，就不要多加一节
- 能改现有锚点，就不要新建大段重复规则
- 能做局部守卫，就不要泛化为“大原则复制”

### 2. prompt 与上下文预算确实是硬约束，不是抽象担忧

证据：

- `src/core/skill-runtime/prompt-assembler.ts:30`：强调稳定前缀有利于 KV-Cache
- `src/core/skill-runtime/prompt-assembler.ts:35`：模板前 500 字符应保持稳定
- `src/core/ai-orchestrator/context-pack.ts:61`：control zone 有 2KB 限制
- `skills/spec-first/AGENTS.md:44`：Context Pack 建议控制在 2KB 以内

因此，“继续新增章节”虽然看起来容易写，但并不是最优实施方式。对当前工程来说，**更好的策略是把 guard 嵌入已有高权重段落和模板**。

### 3. `SHARED.md` 已存在，但当前更偏治理层而非 runtime 自动拼装层

证据：

- `skills/spec-first/SHARED.md` 已存在，说明项目有“共享规则”意识
- 但本次核验中，未发现 runtime 自动把 `SHARED.md` 合并进各 Skill prompt 的直接证据
- `src/core/skill-runtime/dispatcher.ts:383` 当前直接加载的是单个 `SKILL.md`

因此，官方审查里“把通用守卫上提到 `SHARED.md`”这个建议，**在治理层合理，在当前运行时层并不等于立即生效**。

综合判断：

- **短期落地**：应优先改具体 Skill 文件
- **中期治理**：再考虑如何把共享守卫稳定接入 runtime

---

## 对目标文档的综合判断

### 1. 目标文档判断正确的部分

#### 1.1 `07-code` 确实是最值得优先补强的位置

当前 `07-code` 已有很强的流程纪律：

- 反合理化守卫：`skills/spec-first/07-code/SKILL.md:63`
- 根因调查驱动调试：`skills/spec-first/07-code/SKILL.md:137`
- code 入口 hard-gate：`skills/spec-first/07-code/SKILL.md:232`
- TDD 强制入口：`skills/spec-first/07-code/SKILL.md:245`
- diff 预览模板：`skills/spec-first/07-code/SKILL.md:468`

但它现在的强项主要是：

- **流程纪律**
- **证据链**
- **验证闭环**

它的薄弱点确实是：

- 缺少“最小实现”类形态约束
- 缺少“别顺手改无关区域”的边界约束

所以目标文档把 `07-code` 放在第一优先级，判断正确。

#### 1.2 `03-spec` 不缺澄清能力，但缺“显性化假设”

证据：

- 结构化歧义消解：`skills/spec-first/03-spec/SKILL.md:58`
- 动态澄清问题生成：`skills/spec-first/03-spec/SKILL.md:92`
- `Phase 0.2` 质量扫描：`skills/spec-first/03-spec/SKILL.md:172`

当前 `03-spec` 已经能：

- 标出不明确项
- 候选式提问
- 多轮澄清
- 高风险信息不足时阻断

因此，“多解释呈现守卫”并不是当前最真实的缺口；真正缺的是：

- **把默认采用的前提显性写出来**
- **把不可确认的前提转成 `[NEEDS CLARIFICATION]`**

目标文档把这项降为轻量补丁，判断基本正确。

#### 1.3 `08-review` 适合做轻量边界收口

证据：

- 两阶段审查协议：`skills/spec-first/08-review/SKILL.md:13`
- Stage 2 质量审查：`skills/spec-first/08-review/SKILL.md:21`
- layer 选择机制：`skills/spec-first/08-review/SKILL.md:53`

当前 `review` 最大问题不是“没有流程”，而是：

- Stage 2 给出的建议缺少明确边界分级

因此，“审查范围守卫”更适合写成：

- `MUST FIX`
- `SHOULD FIX`
- `OUT OF SCOPE`

而不是重写全部 checklist。目标文档对此判断是对的。

#### 1.4 `13-orchestrate` 当前收益不高

证据：

- 证据铁律：`skills/spec-first/13-orchestrate/SKILL.md:104`
- 上下文裁剪规则：`skills/spec-first/13-orchestrate/SKILL.md:111`
- 批量执行与检查点：`skills/spec-first/13-orchestrate/SKILL.md:146`
- 风险口径：`skills/spec-first/13-orchestrate/SKILL.md:215`

当前 orchestrate 已经不算“无序编排”，它已有：

- 批次
- 检查点
- 风险分级
- 新鲜证据推进

所以现在继续补“编排简洁性守卫”，确实不如先补 `07-code` 来得直接。

---

### 2. 目标文档存在的问题

#### 2.1 结论强度偏高，容易误导后续实施

当前文档的问题不是结论方向错，而是语气过满。典型包括：

- “spec-first 官方审查更准确”
- “工作量 2 天”
- “零重复”

这些表述会带来两个风险：

1. **过度承诺**：给实施者造成“方案已完全收敛”的错觉
2. **压缩设计空间**：让后续实现不敢做必要调整

更合适的表述应该是：

- 官方审查 **方向更准确**，但还需补足运行时与治理层证据
- 工作量 **预计 2–3 天**，视测试联动而定
- 重复风险 **较低但非零**

#### 2.2 “综合审查”实质上更像“官方审查摘要”

目标文档在结构上更偏向“接受官方审查并转述”，而不是重新综合三类输入：

- Trellis 原始方案
- spec-first 官方审查
- 当前代码与 runtime 约束

它缺少一张真正的“结论—证据—限制条件”映射表，因此可追溯性还不够硬。

#### 2.3 对 `SHARED.md` 的实施意义没有说明清楚

官方审查提到了“共享守卫上提”，这是治理方向上的好建议；但目标文档没有指出：

- 当前 runtime 是否真的消费 `SHARED.md`
- 若没有，短期实施应改哪里
- 共享层和局部层如何分工

这会导致后续实施者误以为“改 `SHARED.md` 就等于改了运行时行为”。

#### 2.4 对测试漂移的评估仍然偏轻

目标文档只强调了 `tests/unit/skill-catalog.test.ts` 一类约束，但实际受影响的测试面更广，包括：

- `tests/unit/code-skill-docs.test.ts`
- `tests/unit/spec-skill-docs.test.ts`
- `tests/unit/design-skill-docs.test.ts`
- `tests/unit/phase1-enhancement-docs.test.ts`
- `tests/unit/doc-governance-cleanup.test.ts`

因此，任何文档治理变更都应被视为：

- **低代码改动**
- 但**非低风险改动**

#### 2.5 对“使用简单”的追求还不够彻底

目标文档仍然采用“新增章节”的思维，这对阅读者很清晰，但对 runtime 和维护者不一定最优。

对当前项目，更简单的落地方式应该是：

- 在已有高权重段落内补 3–8 行规则
- 在已有模板中补 1–2 个自检字段
- 避免再新增独立概念块

这比“再开一个守卫章节”更符合使用简单、维护简单、运行时简单。

---

## 四个维度的最终审查结论

### 1. Think Before Coding

**综合结论**: 已有强覆盖，适合补丁，不适合重构。

证据：

- `skills/spec-first/03-spec/SKILL.md:58`
- `skills/spec-first/03-spec/SKILL.md:92`
- `skills/spec-first/03-spec/SKILL.md:172`

最终判断：

- ✅ 保留“假设显性化”
- ❌ 不建议增加“多解释呈现守卫”作为独立投入项

### 2. Goal-Driven Execution

**综合结论**: 已有很强覆盖，不建议作为当前补强重点。

证据：

- `skills/spec-first/07-code/SKILL.md:100`
- `skills/spec-first/07-code/SKILL.md:137`
- `skills/spec-first/07-code/SKILL.md:232`
- `skills/spec-first/08-review/SKILL.md:13`
- `skills/spec-first/13-orchestrate/SKILL.md:104`

最终判断：

- ❌ 不建议新增“目标驱动实现”章节

### 3. Simplicity First

**综合结论**: 是当前最真实的缺口之一，优先级最高。

证据：

- 当前 `07-code` 有流程纪律，但缺少最小实现约束
- `04-design` 虽有系统级 HOW 边界，但对“投机性扩展”约束仍弱，见 `skills/spec-first/04-design/SKILL.md:26`

最终判断：

- ✅ `07-code`：应做
- ⚠️ `04-design`：可做，但排后
- ❌ `13-orchestrate`：暂缓

### 4. Surgical Changes

**综合结论**: 是当前最真实的缺口之一，优先级最高。

证据：

- 当前 `07-code` 虽有变更影响检查与 diff 预览，但仍缺少“每类改动都必须直接追溯到 TASK/FR/DS”的明确守卫
- `skills/spec-first/07-code/SKILL.md:317`
- `skills/spec-first/07-code/SKILL.md:468`

最终判断：

- ✅ `07-code` 应补“修改边界守卫”

---

## 推荐落地方案（修订版）

### Phase A：立即做（最小补丁，先解决真实空白）

#### A1. `07-code`：代码简洁性守卫

**不建议新开大节**，优先并入以下锚点：

- `skills/spec-first/07-code/SKILL.md` 的 `反合理化守卫`
- `skills/spec-first/07-code/SKILL.md` 的 `P3 diff 预览模板`

**建议补充内容**：

- 不为单次使用创建抽象
- 不增加 TASK 未要求的配置项
- 不为假想 future case 预埋复杂结构
- diff 预览中显式说明“本次是否存在超出 TASK 的附加设计”

#### A2. `07-code`：代码修改边界守卫

**不建议新开大节**，优先并入：

- `skills/spec-first/07-code/SKILL.md:317` 的变更影响检查
- `skills/spec-first/07-code/SKILL.md:468` 的 diff 预览模板

**建议补充内容**：

- 每个变更文件必须说明与 TASK / FR / DS 的直接关联
- 明确标记哪些改动是“必要改动”，哪些是“顺带改动”
- 若存在顺带改动，默认视为风险项，要求回退或单列说明

### Phase B：轻量补齐（不引入新复杂度）

#### B1. `08-review`：审查范围分级

直接插入 `Stage 2` 前或紧跟其后，增加一段 6–10 行规则：

- `MUST FIX`：违反 TASK / FR / DS / Constitution / 新鲜证据要求
- `SHOULD FIX`：明显质量问题但不阻断当前交付
- `OUT OF SCOPE`：脱离当前需求边界的建议

#### B2. `03-spec`：假设显性化

直接并入 `skills/spec-first/03-spec/SKILL.md:172` 的 `Phase 0.2` 质量扫描报告模板：

- 输出 `隐含假设清单`
- 每条标记为 `[ASSUMED]` 或 `[NEEDS CLARIFICATION]`
- 仅保留会影响 FR / AC / NFR 的假设

### Phase C：延后评估

#### C1. `04-design`：设计简洁性守卫

当前方向是对的，但不建议立刻实施。

原因：

- 设计阶段已有系统级 HOW 边界
- 当前文件本身已有结构重复，应先收敛文档结构
- 先观察 `07-code` 两项 guard 的收益更划算

#### C2. `13-orchestrate`：继续暂缓

不建议现在投入。

原因：

- 当前编排约束已不弱
- 新增 guard 的收益不如 `07-code` 直接
- 更容易与既有编排规则重叠

---

## 与阶段自动流转方案的关系

这部分是原文缺失、但综合审查必须补上的。

`阶段自动流转方案-审查报告.md` 已经给出更稳妥的协同顺序：

1. 先做 `07-code` 的质量补强
2. 再做阶段流转最小闭环
3. 再补 `03-spec` 与 `08-review`

这一顺序的好处是：

- 先提升单个 Skill 输出质量
- 再提升 Skill 之间的串联效率
- 避免在质量基线尚未稳定时放大自动化链路

综合建议：

- **先做 `07-code` 两项 guard**
- **之后优先做阶段流转的最小可用闭环**
- **最后补 `03-spec` 与 `08-review` 轻量 guard**

如果团队当下目标是“先把单点质量打稳”，也可以采用简化顺序：

1. `07-code`
2. `08-review`
3. `03-spec`
4. 阶段自动流转

两种顺序都成立，但都比“同时铺开 4–5 个 Skill 大改”更稳健。

---

## 风险清单

### 1. Prompt 膨胀风险

若继续新增多个独立章节，会直接增加：

- token 成本
- 前缀不稳定性
- 规则噪音

### 2. 测试漂移风险

Skill 文档不是“随便改的说明书”，它已经被多组测试显式约束。

### 3. 共享层误用风险

若误把 `SHARED.md` 当作 runtime 自动生效层，容易导致：

- 改了共享文档，但模型行为没变
- 治理层和运行时层认知错位

### 4. 方案过度工程风险

若为了解决“过度工程”而引入太多新 guard，本身会制造另一种过度工程。

---

## 最终结论

### 审查结论

`Karpathy优化方案-综合审查.md` 当前版本：

- ✅ **方向正确**
- ✅ **优先级大体合理**
- ⚠️ **证据链不够硬**
- ⚠️ **结论表述偏满**
- ⚠️ **落地策略还不够“最小改动”**

因此，本次综合审查给出结论：**有条件通过**。

### 最终推荐方案

采用以下执行口径替代原文中的强结论：

1. **优先在 `07-code` 内做最小增量补丁**，补“简洁性 + 边界”两项 guard
2. **`08-review` 与 `03-spec` 只做轻量嵌入，不新开大章**
3. **`04-design` 延后到结构收敛之后再评估**
4. **`13-orchestrate` 继续暂缓**
5. **若未来要上提 `SHARED.md`，先补 runtime 接线方案，再谈共享守卫治理**

### 一句话总结

**Karpathy 方向值得采纳，但当前最优解不是“继续加章节”，而是沿着 `07-code` / `08-review` / `03-spec` 的现有锚点做最小补丁，以更小改动获得更高质量、更强健流程和更简单使用体验。**

---

**审查状态**: ✅ 完成  
**结论等级**: ⚠️ 有条件通过  
**推荐动作**: 先落地 `07-code` 最小补丁版 guard，再视效果扩展到 `08-review` 与 `03-spec`
