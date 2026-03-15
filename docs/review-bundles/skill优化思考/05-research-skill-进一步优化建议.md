# 05-research skill 进一步优化建议

更新时间：2026-03-15  
适用对象：[`05-research/SKILL.md`](/Users/kuang/xiaobu/spec-first/skills/spec-first/05-research/SKILL.md)  
参考对象：

- [`oracle/SKILL.md`](/Users/kuang/xiaobu/omo-skills/oracle/SKILL.md)
- [`librarian/SKILL.md`](/Users/kuang/xiaobu/omo-skills/librarian/SKILL.md)

## 目的

这份文档的目标不是立即改代码，而是为 `05-research` 提供一份“下一轮优化的决策底稿”。

当前 `05-research` 已经完成了基础收敛：

- 已对齐 `02_design` 按需阶段定位
- 已对齐当前宿主工具边界
- 已建立 `research.md` / `findings.md` 的留痕机制
- 已补最小文档一致性测试

下一轮优化的重点，不再是修错，而是决定它要不要进一步吸收：

- `oracle` 的“判断框架”
- `librarian` 的“研究方法”

## 当前定位判断

`05-research` 当前最合理的定位是：

- `04-design` 的按需子 skill / companion skill
- 负责为设计决策提供外部证据、方案比较、风险说明
- 输出回流到：
  - `research.md`
  - `findings.md`
  - 最终服务 `design.md`

所以它不是：

- 独立主阶段 skill
- 泛技术顾问
- 纯资料搜集器

一句话定义：

**`05-research` 是 `04-design` 的证据型 research companion。**

## 与 oracle / librarian 的差异

### 和 oracle 的关系

[`oracle/SKILL.md`](/Users/kuang/xiaobu/omo-skills/oracle/SKILL.md) 更像“专家顾问”：

- 长于给出明确判断
- 长于做架构和技术决策
- 输出更像结论与建议

对 `05-research` 的借鉴价值主要在：

- 决策框架
- 推荐表达
- 风险提示

但它不适合直接替代 `05-research`，因为：

- 不绑定 spec-first 阶段
- 不绑定 `research.md`
- 不绑定 `findings.md`
- 不绑定 design 输入闭环

### 和 librarian 的关系

[`librarian/SKILL.md`](/Users/kuang/xiaobu/omo-skills/librarian/SKILL.md) 更像“研究方法专家”：

- 长于搜外部资料
- 长于整理来源
- 长于输出参考实现和链接
- 长于做来源分层与质量过滤

对 `05-research` 的借鉴价值更高，主要在：

- 研究任务分型
- 来源优先级
- 输出中的来源链接 / 版本 / 时效性
- 并行检索后再收敛

但它也不能直接替代 `05-research`，因为：

- 不承担推荐结论责任
- 不绑定当前 Feature 与阶段
- 不要求把结论回流到 design artifact

## 最佳方案建议

最优方向不是把 `05-research` 改成 `oracle` 或 `librarian`，而是：

- 保留 `05-research` 作为 design 阶段 research companion
- 吸收 `oracle` 的“判断框架”
- 吸收 `librarian` 的“研究方法”

可以理解成：

```text
05-research
  = spec-first 阶段约束
  + oracle 的判断力
  + librarian 的研究法
```

## 04-design -> 05-research 主从契约

这是这轮优化里最关键的协议，不应继续停留在抽象建议层。

推荐的明确契约如下：

### 触发方

- 主触发方：`04-design`
- 从属 skill：`05-research`

### 触发条件

当 `04-design` 满足以下任一条件时，可自动或按需触发 `05-research`：

1. 存在 2 个以上合理候选方案
2. 需要外部最佳实践或官方推荐作为设计依据
3. 安全 / 性能 / 成本结论无法仅靠本仓库现有上下文得出
4. 当前代码库或现有文档不足以支撑设计决策
5. 需要评估第三方服务、外部框架或外部集成方案

### 输出契约

`05-research` 触发后必须产出：

- `research.md`
  - 推荐方案
  - 备选方案
  - 证据路径
  - 风险与限制
  - 未验证假设
- `findings.md`
  - 本次 research 摘要
  - 证据路径
  - 下一步动作

### 回流契约

`04-design` 消费 `05-research` 输出时，至少要把以下信息回写到 `design.md`：

- 最终采用的方案
- 采用理由
- 关键风险
- 待验证项（如仍存在）

### 边界

- `05-research` 不直接生成 `design.md`
- `04-design` 不应绕过 `research.md` 直接引用外部资料做最终拍板
- `05-research` 是 design 的证据输入，不是 design 的替代者

## 建议优化项

### P0. 保持当前主定位不变

不要改的部分：

- 仍然归属 `02_design` 按需 skill
- 仍然服务 `04-design`
- 仍然输出到 `research.md` / `findings.md`
- 仍然要求推荐结论、风险与未验证项

这是当前最关键的骨架，不建议动。

### P1. 增加“调研任务分型”

这是最值得从 `librarian` 借鉴的点。

建议在 [SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/05-research/SKILL.md) 中增加一个短章节：

#### 建议分型

1. `TYPE A: 方案选型`
- 目标：在多个候选方案中给出推荐
- 输出重点：
  - 候选方案
  - 对比矩阵
  - 推荐方案
  - 风险与依赖

2. `TYPE B: 最佳实践 / 实现参考`
- 目标：寻找官方推荐、开源模式、兼容实践
- 输出重点：
  - 官方来源
  - 参考实现
  - 版本范围
  - 适用边界

3. `TYPE C: 背景追溯 / 历史决策`
- 目标：解释为什么采用某方案、是否有历史包袱
- 输出重点：
  - 背景
  - 关键讨论
  - 反证据
  - 当前建议

价值：

- agent 更容易选对输出结构
- research 不会再“所有问题都套一个模板”
- 最适合放在 `SKILL.md` 的主文档层

### P2. 增加“决策框架”

这是最值得从 `oracle` 借鉴的点。

当前 `05-research` 已经有证据协议，但还缺“如何判断推荐顺序”的明确框架。

建议补一个简短的决策优先级：

1. 问题匹配度
2. 与现有栈兼容性
3. 长期维护成本
4. 风险与回滚成本
5. 证据强度

建议写法：

```text
在给出推荐前，先问自己：
- 哪个方案最直接解决当前问题？
- 哪个方案和现有技术栈最兼容？
- 哪个方案长期维护成本最低？
- 哪个方案回滚或替换成本最低？
- 哪个方案证据最强？
```

价值：

- research 不再只是“列材料”
- 能更稳定地产出明确推荐
- 最适合放在 `SKILL.md` 的主文档层

### P3. 增加“来源优先级”

这是从 `librarian` 借鉴的第二个高价值点。

当前 `05-research` 已经有：

- 证据强度
- 假设类型

但还缺：

- 先去哪找证据

建议放到 [evidence-types.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/05-research/references/evidence-types.md) 或新增 `source-priority.md`：

#### 推荐顺序

1. 官方文档 / 官方定价 / 官方白皮书
2. 官方示例 / 官方 GitHub 仓库
3. 高质量开源项目
4. 技术博客 / 案例研究
5. 社区问答

并明确：

- 越往后，越需要交叉验证
- 单一低可信来源不能支撑关键结论

价值：

- research 更可复用
- 不会因为信息过载导致搜索顺序失控
- 最适合放在 `references/evidence-types.md`

### P4. 增强对比模板的“可审计性”

这是从 `librarian` 借鉴的第三个高价值点。

当前 [tech-comparison-template.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/05-research/references/tech-comparison-template.md) 已经补了：

- `证据路径`
- `反证据`

后续还可以继续增强：

1. 增加 `版本/范围`
- 例如：适用于哪个版本、哪个环境

2. 增加 `时效性`
- 例如：证据时间点，避免旧资料误导

3. 增加 `推荐等级`
- 如：首选 / 备选 / 不推荐

建议矩阵形态：

```markdown
| 维度 | 方案 A | 方案 B |
|------|--------|--------|
| 成本 | ... | ... |
| 风险 | ... | ... |
| 成熟度 | ... | ... |
| 版本/范围 | ... | ... |
| 证据路径 | ... | ... |
| 反证据 | ... | ... |
| 时效性 | 2026-03 | 2025-11 |
```

### P5. 增加“输出分层”

这是同时借鉴 `oracle` 和 `librarian` 的地方。

建议让 `05-research` 的最终输出稳定成 3 层：

1. `推荐结论`
- 一句话推荐

2. `主要理由`
- 2-4 条最关键理由

3. `可追溯细节`
- 证据路径
- 反证据
- 未验证假设
- 下一步

价值：

- 对用户可读
- 对设计可消费
- 对审查可追溯
- 更适合通过 `references/tech-comparison-template.md` 承载，不建议主文档展开写太长

### P6. 明确“何时允许不推荐”

这是从 `oracle` 借鉴的一个重要原则。

默认规则应该是：

- research 必须给出首选方案

只有在这些情况下，才允许“不推荐 / 暂不决策”：

- 证据明显不足
- 候选方案都不满足硬约束
- 风险超出当前阶段可接受范围

否则 research 很容易退化成：

- 罗列信息
- 不做判断
- 把决策压力丢回用户

### P6.5. 主文档与 references 的落点分配

为避免再次把 `05-research` 主文档写重，建议明确分层：

#### 放在 `SKILL.md`

- `05-research` 的定位
- `04-design -> 05-research` 主从关系
- 调研任务分型
- 决策框架
- 输出契约与回流契约

#### 放在 `references/evidence-types.md`

- 来源优先级
- 证据强度
- 来源可信度
- 反证据原则

#### 放在 `references/tech-comparison-template.md`

- 对比矩阵字段
- 证据路径字段
- 反证据字段
- 版本/范围
- 时效性
- 推荐等级

#### 放在 `references/coordination-conventions.md`

- 操作分工
- 高风险结论确认边界
- 非 `02_design` 阶段调用的处理方式

### P7. 让 04-design 明确触发 research 的条件

这不是 `05-research` 单边优化能完全解决的，但必须一并考虑。

建议在 `04-design` 中明确：

#### 自动或按需触发 `05-research` 的场景

- 新技术栈选型
- 第三方服务对比
- 安全 / 性能 / 成本需要外部证据
- 当前代码库无法给出足够依据
- 存在 2 个以上合理候选方案

这样 `05-research` 才能真正成为 `04-design` 的 companion，而不是孤立工具。

## 不建议做的优化

### 1. 不要改成纯咨询 skill

不要把 `05-research` 改成像 `oracle` 一样的泛顾问 skill。

原因：

- 会失去阶段约束
- 会削弱产物闭环
- 会和 `04-design` 职责混淆

### 2. 不要改成纯资料收集 skill

不要把 `05-research` 改成像 `librarian` 一样只做资料检索。

原因：

- research 在 spec-first 里必须给出推荐结论
- 不能只提供链接，不做判断

### 3. 不要继续扩张主文档

下一轮优化不建议继续把所有新规则加进主文档。

更好的做法是：

- 主文档只加：
  - 任务分型
  - 决策框架
  - 输出分层
- 详细规则放 reference

## 推荐实施顺序

### 第 1 步

在 [SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/05-research/SKILL.md) 增加：

- 调研任务分型
- 决策框架
- 输出分层

### 第 2 步

在 [evidence-types.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/05-research/references/evidence-types.md) 增加：

- 来源优先级
- 低可信来源的使用限制

### 第 3 步

继续增强 [tech-comparison-template.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/05-research/references/tech-comparison-template.md)：

- 版本/范围
- 时效性
- 推荐等级

### 第 4 步

同步更新 `04-design`：

- 明确自动/按需触发 `05-research` 的规则
- 明确 research 输出如何回流到 `design.md`

## 决策建议

如果只做一轮小步快跑优化，我建议优先做这三件事：

1. 给 `05-research` 增加调研任务分型
2. 给 `evidence-types.md` 增加来源优先级
3. 给 `04-design` 增加触发 `05-research` 的明确规则

这是当前收益最高、风险最低的一组改动。

## 实施影响与验证

为了让这份建议文档具备执行性，建议在真正实施时按下面范围落地。

### 预计影响文件

- [05-research/SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/05-research/SKILL.md)
- [05-research/references/evidence-types.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/05-research/references/evidence-types.md)
- [05-research/references/tech-comparison-template.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/05-research/references/tech-comparison-template.md)
- [04-design/SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/04-design/SKILL.md)

### 建议新增或更新的测试

- [research-skill-docs.test.ts](/Users/kuang/xiaobu/spec-first/tests/unit/research-skill-docs.test.ts)
  - 增加任务分型、主从定位、证据规则锚点断言
- `design` 相关文档测试
  - 增加 `04-design` 对 `05-research` 触发条件与回流契约的断言

### 建议验证命令

```bash
pnpm vitest run tests/unit/research-skill-docs.test.ts
pnpm vitest run tests/unit/design-skill-docs.test.ts
pnpm vitest run tests/unit/artifact-checker.test.ts
```

### 验收标准

- `05-research` 明确为 `04-design` 的 research companion
- `04-design` 明确 research 触发条件
- `05-research` 明确输出契约与回流契约
- 任务分型、决策框架、来源优先级有单一真理源
- 文档一致性测试通过

## 最终结论

`05-research` 的最佳未来形态不是 `oracle`，也不是 `librarian`，而是：

- 以 spec-first 阶段约束为骨架
- 以 `oracle` 的判断框架增强推荐质量
- 以 `librarian` 的研究方法增强证据质量

这才是最适合当前仓库和全流程的方案。  
