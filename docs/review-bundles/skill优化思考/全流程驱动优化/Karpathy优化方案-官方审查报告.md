# Karpathy 优化方案审查报告（2026-03-09）

> 范围：
> - `Trellis/docs/first/karpathy-optimization-plan.md`
> - `Trellis/docs/first/karpathy-optimization-feasibility.md`
> - `andrej-karpathy-skills/skills/karpathy-guidelines/SKILL.md`
> - 当前 `spec-first` 工程与 `skills/spec-first` 实现

---

## 1. 执行摘要

本次审查的核心结论是：**Karpathy 优化方向正确，但原始方案偏重；精简方案基本合理，且应进一步收敛为“3 个强改 + 1 个轻改 + 1 个暂缓”**。

`spec-first` 当前 Skill 体系并非普通文档系统，而是被 runtime 直接消费的行为契约：

- `src/core/skill-runtime/dispatcher.ts:383` 会直接加载 `SKILL.md`
- `src/core/skill-runtime/dispatcher.ts:411` 会在加载后执行 hard-gate 检查
- `src/core/skill-runtime/hard-gate.ts:26` 定义真实阻断错误
- `src/core/rules/truth-source.ts:13` 定义阶段与 Skill 的真相源映射

因此，对 `skills/spec-first/*/SKILL.md` 做优化是**合理且有效**的，但必须遵守两个约束：

1. **不能破坏现有 P0-P5 主流程语义**
2. **不能显著膨胀 prompt 体积与维护成本**

结合 `andrej-karpathy-skills` 的原始准则与当前 `spec-first` 实现，审查判断如下：

- **已被较强覆盖**：`Think Before Coding`、`Goal-Driven Execution`
- **明显缺口**：`Simplicity First`、`Surgical Changes`
- **最值得落地的位置**：`07-code`
- **适合轻量补充的位置**：`03-spec`、`08-review`
- **可做但不宜前置的位置**：`04-design`
- **当前不建议投入的位置**：`13-orchestrate`

---

## 2. 审查对象与基准

### 2.1 外部优化基准

Karpathy 准则的四个核心点来自 `andrej-karpathy-skills/skills/karpathy-guidelines/SKILL.md:13`：

1. `Think Before Coding`
2. `Simplicity First`
3. `Surgical Changes`
4. `Goal-Driven Execution`

其中最关键的行为约束是：

- 明确假设，不要默默选择
- 用最少代码解决问题，不做投机性抽象
- 只改必须改的内容，不顺手“优化”无关区域
- 以可验证成功标准驱动执行，而不是“看起来能工作”

### 2.2 本次被审查的 spec-first 关键 Skill

- `skills/spec-first/03-spec/SKILL.md`
- `skills/spec-first/04-design/SKILL.md`
- `skills/spec-first/07-code/SKILL.md`
- `skills/spec-first/08-review/SKILL.md`
- `skills/spec-first/13-orchestrate/SKILL.md`
- `skills/spec-first/SHARED.md`

### 2.3 审查基准

本次不以“是否能再写更多规则”为目标，而以以下 4 个标准判断优化方案是否合理：

1. **必要性**：是否填补真实空白，而不是重复已有机制
2. **兼容性**：是否与现有 runtime / test / governance 一致
3. **ROI**：新增复杂度是否值得
4. **可维护性**：是否会拉高文档漂移和测试负担

---

## 3. 当前实现现状判断

### 3.1 `Think Before Coding` 已有较强覆盖

`03-spec` 已经实现结构化歧义消解与动态澄清：

- `skills/spec-first/03-spec/SKILL.md:56` 规定了 `[NEEDS CLARIFICATION]` 触发条件
- `skills/spec-first/03-spec/SKILL.md:92` 定义了动态澄清问题生成流程
- `skills/spec-first/03-spec/SKILL.md:226` 定义了质量评分与阻断门槛

这意味着 `spec-first` 已具备：

- 不确定时停下来问
- 候选项式提问而不是模糊泛问
- 高风险缺失时阻断推进

**结论**：这一维度不是空白，只缺“隐含假设显性化”的补丁，不需要再引入完整的“多解释呈现守卫”。

### 3.2 `Goal-Driven Execution` 已有较强覆盖

`07-code` 和 `13-orchestrate` 已经具备强验证与证据链机制：

- `skills/spec-first/07-code/SKILL.md:100` 明确 TDD 铁律
- `skills/spec-first/07-code/SKILL.md:137` 定义根因调查驱动的调试流程
- `skills/spec-first/07-code/SKILL.md:232` 定义 code 入口 hard-gate
- `skills/spec-first/08-review/SKILL.md:11` 定义“先合规后质量”的两阶段审查
- `skills/spec-first/13-orchestrate/SKILL.md:146` 要求批量执行与检查点
- `skills/spec-first/13-orchestrate/SKILL.md:178` 要求 verify 通过且证据链完整后才能推进阶段

**结论**：这一维度已很强，再新增“目标驱动实现”章节大概率重复现有 TDD / evidence / verify 约束。

### 3.3 `Simplicity First` 与 `Surgical Changes` 仍是明显缺口

当前 `07-code` 强在流程纪律，但弱在“代码形态约束”。

虽然已有：

- 反合理化守卫
- TDD 强制入口
- 调试流程
- 3-Strike 升级机制

但仍缺少两类明确规则：

1. **防过度工程**：不加单次使用抽象、不加未要求配置、不处理不在规格内的假想场景
2. **防顺手优化**：不改相邻无关代码、不顺手统一风格、不删除历史死代码

这一判断与可行性文档的核心结论一致：`Simplicity First` 与 `Surgical Changes` 是当前最真实的空白。

---

## 4. 对原始优化方案的审查判断

### 4.1 原 9 项方案：方向对，但偏重

`Trellis/docs/first/karpathy-optimization-plan.md:24` 给出的总方向是成立的：Karpathy 准则应作为补充守卫而不是替代 spec-first 流程。

但原方案的问题也很明显：

- 在多个 Skill 中新增章节过多
- 有些章节与既有机制重叠度过高
- 有些建议会显著增加 Skill prompt 体积
- 新增 reference 文档数量偏多，不利于 catalog 治理

这会和当前 runtime 的实际消费方式形成张力：

- `src/core/skill-runtime/dispatcher.ts:383` 直接把 Skill 文本加载进 prompt
- `src/core/skill-runtime/prompt-assembler.ts:27` 明确对 prompt 前缀稳定性与体积敏感

**结论**：原 9 项方案不适合直接照搬。

### 4.2 精简 5 项方案：基本合理

`Trellis/docs/first/karpathy-optimization-feasibility.md:375` 已经把优先项压缩到 5 个：

- `07-code`: 代码简洁性守卫
- `07-code`: 代码修改边界守卫
- `03-spec`: 假设显性化守卫
- `08-review`: 审查范围守卫
- `04-design`: 设计简洁性守卫

同时删除或暂缓：

- `07-code`: 目标驱动实现
- `03-spec`: 多解释呈现守卫
- `13-orchestrate`: 编排简洁性守卫
- `04-design`: 默认多方案呈现守卫

这一轮裁剪是合理的，原因如下：

- 它避开了 `Goal-Driven Execution` 的重复建设
- 它保留了真正的空白项
- 它降低了文档与 reference 的维护负担
- 它更符合 `skills/spec-first/AGENTS.md:39` 对“新增规则不得破坏原流程语义”的要求

**结论**：精简方案可采纳，但还应进一步细化优先级和写法。

---

## 5. 分项审查结论

### 5.1 `07-code`：代码简洁性守卫 —— 强烈建议落地

**判断**：合理，且优先级最高。

原因：

- 当前 `07-code` 没有显式约束“最小实现”
- 现有 `code-standards.md` 偏代码风格，不是反过度工程守卫
- 这是 Karpathy 原则中与现状差距最大的部分之一

**建议写法**：

- 直接插入 `## When to Use` 后方
- 不要写成长篇原则说明
- 控制为“1 个原则 + 3 条自检 + 3 条反例”

**结论**：应做。

### 5.2 `07-code`：代码修改边界守卫 —— 强烈建议落地

**判断**：合理，且优先级最高。

原因：

- 当前 `07-code` 缺少对“顺手优化”的明确负约束
- 这类问题在现有流程纪律中不会自然被挡住
- 与 `Surgical Changes` 原始意图高度一致

**建议写法**：

- 明确“每个 diff 行必须能追溯到 TASK”
- 明确“只清理由本次修改导致的 orphan”
- 明确“发现历史问题可以记录，但不顺手修”

**结论**：应做。

### 5.3 `03-spec`：假设显性化守卫 —— 建议轻量落地

**判断**：合理，但不应扩张成独立大机制。

原因：

- `03-spec` 已经有高质量澄清机制
- 缺的是“隐含假设列表”，不是缺“提问能力”

**最佳位置**：

- 并入 `Phase 0.2` 质量扫描
- 输出一个简短的 `隐含假设清单`
- 每条标记为 `[ASSUMED]` 或 `[NEEDS CLARIFICATION]`

**结论**：应做，但只做轻补丁。

### 5.4 `08-review`：审查范围守卫 —— 建议落地

**判断**：合理，价值较高。

当前 `review` 已有：

- Stage 1 合规审查
- Stage 2 质量审查
- 层级参数与 cross-layer checklist

但它没有明确声明：**Stage 2 的建议是否必须锚定到 TASK / FR / Constitution 范围内**。

因此增加“`MUST FIX / SHOULD FIX / OUT OF SCOPE`”的边界是有价值的。

**注意**：

- 第一版不要去重构所有 checklist 格式
- 先在 `08-review/SKILL.md` 中加 Stage 2 前自检规则即可

**结论**：应做。

### 5.5 `04-design`：设计简洁性守卫 —— 可做，但降一级优先级

**判断**：方向正确，但收益不如 `07-code` 和 `08-review` 直接。

原因：

- `04-design` 已经通过“系统级 HOW / 禁止实现级 HOW / 依据不足必须澄清”抑制了一部分过度设计
- 真实缺口是“投机性扩展层”与“与 FR 无关的架构复杂度”

**建议写法**：

- 用“不得超出 FR 引入投机性层次”替代口号化表述
- 避免把轻量 guard 写成架构教条

**结论**：可做，但放在第二批。

### 5.6 `13-orchestrate`：编排简洁性守卫 —— 当前不建议投入

**判断**：不建议现在做。

原因：

- orchestrate 已有批次、检查点、风险分类、推进证据要求
- 此处复杂度的收益相对有限
- 新增规则容易与既有编排约束重叠

**结论**：暂缓。

---

## 6. 推荐落地方案

### 6.1 最终建议：3 个强改 + 1 个轻改 + 1 个暂缓

#### 第一批（立即做）

1. `07-code`：代码简洁性守卫
2. `07-code`：代码修改边界守卫
3. `08-review`：审查范围守卫

#### 第二批（轻量补充）

4. `03-spec`：假设显性化守卫

#### 第三批（可选）

5. `04-design`：设计简洁性守卫

#### 暂缓项

- `07-code`：目标驱动实现
- `03-spec`：多解释呈现守卫
- `04-design`：默认多方案呈现守卫
- `13-orchestrate`：编排简洁性守卫

### 6.2 结构建议

不要把 Karpathy 原则整段复制到每个 Skill。更合理的结构是：

1. 在 `skills/spec-first/SHARED.md` 中新增一个**简洁版共享守卫**
2. 在 `07-code` / `08-review` / `03-spec` 中只补充各自专属规则
3. 尽量复用现有 `references/`，少新增独立文档

这一点也与精简可行性分析中的建议一致：将通用守卫上提到共享层，而不是在各 Skill 重复展开。

---

## 7. 风险与约束

### 风险 1：Skill 文档膨胀

由于 Skill 文本会直接进入 runtime prompt，章节过多会带来：

- 更高 token 成本
- 更低前缀稳定性
- 更高的“规则噪音”

因此新增规则必须短、小、可执行。

### 风险 2：测试漂移

当前 Skill 文档已经被测试显式约束：

- `tests/unit/skill-catalog.test.ts:45`
- `tests/unit/code-skill-docs.test.ts:12`
- `tests/unit/spec-skill-docs.test.ts:14`
- `tests/unit/design-skill-docs.test.ts:14`
- `tests/unit/analyze-skill-docs.test.ts:13`

这意味着任何文档级治理变更都应该配套更新测试，否则容易形成“文档改了但 catalog 规则没同步”的漂移。

### 风险 3：共享层与局部层职责混乱

如果把过多具体规则都放入 `SHARED.md`，会稀释局部 Skill 的执行边界；如果全部下沉到局部 Skill，又会造成重复和不一致。

**建议边界**：

- `SHARED.md`：只放通用原则
- `07-code` / `08-review` / `03-spec`：只放与本阶段直接相关的守卫

---

## 8. 最终结论

本次优化方案的总体方向是正确的，但必须建立在对 `spec-first` 现有能力的准确盘点之上。

**最终判断**：

- `spec-first` 不需要大规模引入 Karpathy 体系
- `spec-first` 已经较强覆盖 `Think Before Coding` 和 `Goal-Driven Execution`
- 真正需要补的是 `Simplicity First` 与 `Surgical Changes`
- 最值得做的是 `07-code` 的两项 guard
- `03-spec` 与 `08-review` 适合轻量补齐
- `04-design` 可做但不应前置
- `13-orchestrate` 当前不值得投入

因此，**“精简 5 项方案”是合理基线，但更优执行版本应收敛成“3 个强改 + 1 个轻改 + 1 个暂缓”**。

---

## 9. 推荐下一步

1. 先修改 `skills/spec-first/07-code/SKILL.md`
2. 再补 `skills/spec-first/08-review/SKILL.md`
3. 然后把 `03-spec` 的假设显性化并入 `Phase 0.2`
4. 最后视效果决定是否补 `04-design`
5. 同步更新相应的 unit tests，避免 Skill 文档治理漂移

