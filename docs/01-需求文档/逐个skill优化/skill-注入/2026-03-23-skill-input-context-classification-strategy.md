# Skill 输入上下文分类与配置策略

## 背景

当前 `skills/spec-first/skill-input-contracts.yaml` 已经承担两个职责：

1. 生成各个 `SKILL.md` 的“输入上下文”章节
2. 为运行时 `context-resolver.ts` 提供 skill 所需上下文契约

因此，这份配置不能只按“看起来信息越多越好”来设计，而应按 skill 的能力属性来决定是否需要项目上下文、需要哪些上下文、缺失时是否应阻塞执行。

本文从高质量研发体系视角，对现有 skill 做分类，并给出配置策略。

## 第一原则

### 1. 只注入会改变决策质量的上下文

上下文不是越多越好。多余上下文会带来三类问题：

- 噪音上升，降低模型聚焦能力
- 把工具型 skill 错误地绑到项目状态上
- 让本可稳定执行的 skill 因项目资产缺失而退化

### 2. 区分“工具能力”和“研发流程”

同样叫 skill，本质并不相同：

- 有些 skill 是工具，关注的是动作本身
- 有些 skill 是流程节点，关注的是当前项目、当前 feature、当前阶段的正确推进

这两类 skill 不应使用同一套上下文设计思路。

### 3. required 只保留真正的硬依赖

`required` 应满足一个严格标准：

- 缺少它时，skill 的核心判断会失真
- 缺少它时，skill 不能稳定地产出高质量结果

如果只是“有会更好”，应该进入 `recommended` 或 `optional`，而不是进入 `required`。

## 分类框架

### A. 工具型 Skill

定义：
聚焦某个能力动作本身，不应过度依赖项目内容。

特征：

- 没有项目上下文时也应可启动
- 输入重点是命令目标，不是项目业务细节
- 项目上下文只能作为增强项，不能成为门槛

典型 skill：

- `onboarding`
- `init`
- `feature`
- `doctor`

配置策略：

- 默认不设置 `required`
- `summary` 只作为 `recommended` 或 `optional`
- 尽量避免引入 `critical-flows`、`domain-model`、`api-contracts` 这类重业务资产

### B. 研发流程型 Skill

定义：
直接参与需求、设计、拆解、实现、验收、归档等阶段推进。

特征：

- 结果强依赖当前项目与 feature 语境
- 如果缺少项目概览，输出会显著失真
- 上下文输入直接影响阶段判断、方案质量、落地路径和风险识别

典型 skill：

- `catchup`
- `spec`
- `spec-review`
- `design`
- `research`
- `task`
- `plan`
- `orchestrate`
- `code`
- `review`
- `verify`
- `archive`

配置策略：

- `summary` 通常作为共同 `required`
- `critical-flows` 应作为多个关键节点的高优先级补充项
- `entry-guide` / `structure-overview` 主要服务“怎么落到代码”
- `conventions` 主要服务“怎么按团队标准执行”

### C. 质量增强型 Skill

定义：
不一定依赖项目上下文才能运行，但上下文会显著提升结果可信度和针对性。

典型 skill：

- `onboarding`
- `research`
- `status`
- `analyze`
- `sync`
- `doctor`

配置策略：

- 不轻易设置 `required`
- 把真正能提升质量的资产放进 `recommended`
- 可把轻量级项目概览放进 `optional`

### D. 元治理 / 系统管理型 Skill

定义：
关注环境、状态、配置、系统健康，而不是具体业务决策。

典型 skill：

- `doctor`
- `feature`
- `sync`
- `status`

配置策略：

- 优先使用轻量上下文
- 除非确实涉及项目状态判断，否则避免业务语义资产

## 逐个 Skill 判断

### 1. 应明显去项目化的 Skill

#### onboarding

核心职责：
教用户“spec-first 怎么用”，而不是分析用户项目。

结论：

- 不应依赖 `first` 产物
- 不应要求 `steering`、`entry-guide`、`structure-overview`
- `summary` 最多作为补充，用于判断项目类型并给出更贴近场景的使用建议

推荐配置：

```yaml
onboarding:
  required: []
  recommended: []
  optional: [summary]
```

#### init

核心职责：
初始化 workspace、定位项目根、建立流程入口。

结论：

- 本质是流程入口工具
- 不应依赖 first 产物
- 应继续保留在 `skip_injection`

#### feature

核心职责：
列出 / 查询 / 切换 feature。

结论：

- 这是典型管理型工具
- 项目上下文不是主输入
- 如果需要增强用户体验，`summary` 可作为 `optional`，但不建议提升

建议方向：

```yaml
feature:
  required: []
  recommended: []
  optional: [summary]
```

#### doctor

核心职责：
诊断宿主、MCP、skills、runtime/docs 健康状态。

结论：

- 偏系统诊断，不应被业务上下文绑死
- 当前配置中 `summary`、`conventions`、`entry-guide`、`structure-overview` 偏重
- 如果 doctor 需要诊断 runtime 资产健康，可以保留轻量项目摘要，但不应做重业务依赖

建议方向：

```yaml
doctor:
  required: []
  recommended: []
  optional: [summary]
```

## 2. 明确需要项目上下文的流程型 Skill

### catchup

恢复上下文本身就是项目认知动作，应保留：

- `required: [summary]`
- `recommended: [entry-guide, structure-overview, steering, conventions]`

### spec / spec-review

这两个节点的本质是需求收敛和质量审查，至少需要：

- `summary`

强烈建议：

- `domain-model`
- `conventions`
- `critical-flows`

原因：

- 没有 `domain-model`，需求边界容易漂
- 没有 `critical-flows`，验收与流程约束容易虚化
- 没有 `conventions`，产出格式和团队标准容易偏离

### design

设计阶段是最依赖上下文的节点之一。

推荐重点：

- `summary` 作为 `required`
- `structure-overview`
- `api-contracts`
- `critical-flows`
- `conventions`

`steering` 是否进入 `recommended`，取决于产品约束是否经常影响技术决策。如果该项目设计常受业务方向驱动，建议把 `steering` 提升一档。

### research

研究不是泛化调研，而是围绕当前项目约束做定向调研。

推荐重点：

- `summary`
- `critical-flows`
- `api-contracts`
- `domain-model`

### task / plan / orchestrate

这三者都属于“阶段控制层”，应优先服务于落地与编排。

推荐重点：

- `summary`
- `entry-guide`
- `critical-flows`
- `structure-overview`
- `conventions`
- `api-contracts` 作为补充项

### code / review

这两个节点最需要的是：

- `summary`
- `conventions`
- `entry-guide`
- `structure-overview`
- `critical-flows`

原因：

- `conventions` 决定实现和审查标准
- `entry-guide` / `structure-overview` 决定落点质量
- `critical-flows` 决定是否识别出流程回归风险

### verify

验收阶段最怕“只验证表面，不验证流程”。

推荐重点：

- `summary`
- `critical-flows`
- `conventions`
- `entry-guide`
- `database-schema` 作为条件型补充项

### archive

归档阶段需要足够上下文支撑复盘和交接，但不应过重。

推荐重点：

- `summary`
- `structure-overview`
- `domain-model`

## 当前配置的总体评价

当前配置已经比初版更合理，尤其是：

- `onboarding` 已从重项目依赖中抽离
- 多个流程型节点补充了 `critical-flows`
- `code` / `review` / `task` / `plan` / `orchestrate` 都更重视 `conventions`

但仍有两个优化方向：

### 1. 工具型 skill 还可以进一步减重

优先关注：

- `doctor`
- `feature`

这两个节点目前仍带有偏重的项目上下文倾向。

### 2. 运行时目前不区分 recommended 与 optional

虽然 YAML 中分了三层：

- `required`
- `recommended`
- `optional`

但当前运行时实现会把 `recommended` 和 `optional` 合并为同一批“非必需上下文”。因此：

- 文档层面，三层是清晰的
- 运行时层面，真正有硬约束意义的只有 `required`

这意味着当前最重要的设计动作不是细抠 `recommended` 和 `optional` 的边界，而是：

- 把不该进 `required` 的项清出去
- 确保真正流程型节点的 `required` 足够准确

## 建议的配置原则

后续维护 `skill-input-contracts.yaml` 时，建议统一遵守以下规则：

### 规则 1

如果缺少某项上下文，skill 仍能稳定完成核心目标，则不要放入 `required`。

### 规则 2

工具型 skill 默认先从“无项目上下文”开始设计，再决定是否增加轻量增强项。

### 规则 3

流程型 skill 默认先从“最小充分项目上下文”开始设计，再逐步补充真正影响阶段判断的资产。

### 规则 4

不要因为某项信息“有帮助”就加入；只有当它会显著提升决策质量、落地质量或风险识别能力时才加入。

## 推荐后续动作

1. 保持 `onboarding` 的去项目化设计，不再回退为重上下文入口。
2. 评估 `doctor` 和 `feature` 是否进一步减重为弱上下文 skill。
3. 如果后续需要让 `recommended` 与 `optional` 在运行时也有不同优先级，再扩展 `context-resolver.ts` 的契约解析逻辑。
