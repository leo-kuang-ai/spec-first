# Skill Input Contracts 最终规范

> 日期: 2026-03-24
> 范围: `skills/spec-first/skill-input-contracts.yaml`
> 目标: 形成单一规范，统一 skill 输入契约、运行时语义、项目场景判定、`first` 触发规则与 `verify` 决策逻辑

## 1. 目标与范围

本规范解决的不是“给每个 skill 尽可能多的上下文”，而是：

1. 让真正依赖项目语境的 skill 拿到最小充分上下文
2. 让工具型 / 治理型 skill 在上下文缺失时仍能稳定工作
3. 让 `SKILL.md` 注入说明、运行时行为与 YAML 契约保持一致
4. 让新项目 0-1、旧项目迭代和混合场景都能落入同一套规则

一句话总结：

> 静态契约表达默认依赖，运行时规则决定缺失时如何处理。

## 2. 核心问题

当前讨论暴露的核心矛盾是：

- `summary` 是重要认知资产
- 但新项目在没有代码时，无法先稳定产出 `summary`
- 如果把 `summary` 设成流程型 skill 的统一硬依赖，就会把新项目入口错误地推到 `/first`

因此不能走两条错误路线：

- 把 `first` 扩张成“无代码新项目问答器”
- 把所有流程型 skill 都做成“半个 first”，各自重复收集上下文

## 3. 核心原则

### 3.1 `required` 只表示硬依赖

进入 `required` 的条件只有一个：

- 缺失它时，skill 的核心判断会失真，或核心任务无法稳定完成

如果只是“有会更好”，必须降级到 `recommended` 或 `optional`。

### 3.2 `summary` 是认知资产，不是统一门禁

`summary` 的语义统一为：

- 项目结构、技术栈、模块边界、关键入口的认知摘要

它不是：

- 所有阶段都必须存在的前置门票
- 新项目需求定义的替代物
- “代码分析结果”的唯一别名

### 3.3 `first` 只负责认知生成

`first` 的职责边界是：

- 输入：已有代码、脚手架、项目结构、已有配置、可分析项目事实
- 输出：`summary` 及其他 runtime cognition 资产

`first` 不负责：

- 在空项目下替代 `spec`
- 通过问答生成需求骨架
- 为了满足契约而伪造项目认知

### 3.4 静态契约与运行时规则分离

`skill-input-contracts.yaml` 负责表达默认最小充分上下文。

运行时负责决定：

- 场景属于哪种项目状态
- 缺失上下文时是否阻断
- 是否进入降级路径
- 是否提示用户补齐认知资产

## 4. 输入契约运行时语义

### 4.1 `required`

当 `required` 产物缺失时：

- 默认阻断执行
- 或进入文档明确声明的降级分支
- 必须输出缺失项与建议动作

### 4.2 `recommended`

当 `recommended` 产物缺失时：

- 不阻断执行
- 将缺失项写入 `context_gaps`
- 在输出末尾一次性汇总提示，不做逐项频繁打断

### 4.3 `optional`

当 `optional` 产物缺失时：

- 默认静默处理
- 除非该 skill 有特别说明，否则不单独提示

### 4.4 `summary` 的特例

若 `summary` 缺失，且项目已存在可分析代码或脚手架事实：

- 不自动阻断 `code` / `review`
- `verify` 按场景规则决定是否趋向严格
- 统一建议运行 `/spec-first:first`

建议统一提示文案：

> 检测到项目已具备可分析事实，建议运行 `/spec-first:first` 补齐项目认知；后续 `/code`、`/review`、`/verify` 将获得更稳定的上下文支持。

## 5. 场景状态模型

为避免“新项目 / 旧项目”二元分类失真，运行时建议使用结构化状态模型。

### 5.1 状态字段

| 字段 | 值 |
|------|----|
| `project_origin` | `greenfield` \| `brownfield` |
| `codebase_maturity` | `empty` \| `scaffold` \| `active` \| `mature` |
| `change_scope` | `new_feature` \| `incremental` \| `refactor` |

### 5.2 判定顺序

建议按以下顺序确定状态：

1. 当前 Feature stage
2. `.spec-first/meta/config.yaml` 或等价状态文件
3. 仓库内是否存在可识别代码基线或脚手架
4. 仅在前 3 项不足时，才允许 agent 做保守推断

### 5.3 默认映射

| 场景 | 推荐状态 |
|------|----------|
| 新项目，还没代码 | `greenfield + empty + new_feature` |
| 新项目，已有脚手架 | `greenfield + scaffold + new_feature` |
| 旧项目增量需求 | `brownfield + mature + incremental` |
| 旧项目大重构 | `brownfield + mature + refactor` |
| 旧项目里新增一个大模块 | `brownfield + mature + new_feature` |

### 5.4 判定启发式（保守推断）

启发式判定只作为默认兜底，优先级低于显式配置、Feature stage 和状态文件。

| 状态字段 | 保守判定方法 |
|----------|-------------|
| `project_origin` | 若仓库主要由当前需求驱动创建、缺少既存业务代码和既存 Feature 痕迹，则偏向 `greenfield`；若已有持续演化的业务代码、既存模块和历史需求痕迹，则偏向 `brownfield` |
| `codebase_maturity` | 无业务代码、仅文档或空目录时偏向 `empty`；有框架骨架或初始化脚手架但业务实现很少时偏向 `scaffold`；已有可运行的业务代码但结构仍在快速变化时偏向 `active`；已有稳定模块边界和持续迭代痕迹时偏向 `mature` |
| `change_scope` | 若当前 Feature 目标是从无到有新增能力，偏向 `new_feature`；若主要是已有能力增强或局部修补，偏向 `incremental`；若目标是重组、替换或大面积调整现有实现，偏向 `refactor` |

补充约束：

- 数量阈值只能作为辅助信号，不能单独作为最终判定依据
- 结构特征优先于文件数量
- 若证据不足或冲突，应选择更保守、可降级的状态解释

### 5.5 运行时状态 Schema

为保证不同实现读取到同一组状态，建议将运行时状态落盘到统一位置。

建议文件：

- `.spec-first/meta/context-mode.yaml`

建议字段：

```yaml
project_origin: greenfield   # greenfield | brownfield
codebase_maturity: empty     # empty | scaffold | active | mature
change_scope: new_feature    # new_feature | incremental | refactor
source: explicit             # explicit | inferred
updated_by: init             # init | first | code | verify | manual
updated_at: 2026-03-24T12:00:00Z
```

字段约束：

- `project_origin`、`codebase_maturity`、`change_scope` 必须使用枚举值
- `source=explicit` 表示来自配置或用户确认
- `source=inferred` 表示来自运行时推断

更新责任建议：

- `init` 负责初始化默认状态
- `first` 可更新 `codebase_maturity`
- `code` 在首次落地产生代码后可把 `empty/scaffold` 推进为 `active`
- `verify` 只消费状态，不应静默重写高层分类

## 6. Skill 分类模型

### 6.1 上下文源 / 前置入口

| Skill | 契约策略 |
|------|----------|
| `first` | `skip_injection` |
| `init` | `skip_injection` |

说明：

- `first` 自己生成上下文，不消费自己产出的 `summary`
- `init` 必须允许在上下文未就绪时启动

### 6.2 工具型

| Skill | 契约 |
|------|------|
| `onboarding` | `required: []` |
| `feature` | `required: []` |
| `doctor` | `required: []` |

规则：

- 工具型 skill 必须允许冷启动
- `summary` 只作为弱增强，不可成为阻断条件

### 6.3 定义型

| Skill | 契约 |
|------|------|
| `spec` | `required: []` |
| `design` | `required: []` |
| `focus-requirements` | `required: []` |
| `spec-review` | `required: []` |

规则：

- 这组 skill 的职责是“从无到有定义”
- 它们本身就是新项目入口，不依赖已有代码认知

### 6.4 规划型

| Skill | 契约 |
|------|------|
| `task` | `required: []` |
| `plan` | `required: []` |
| `orchestrate` | `required: []` |
| `research` | `required: []` |

规则：

- 这组 skill 基于需求和设计产物工作
- 可以受益于 `summary`
- 不得被 `summary` 硬阻断

### 6.5 执行型

| Skill | 静态契约 |
|------|----------|
| `code` | `required: []`, `recommended` 包含 `summary` |
| `review` | `required: []`, `recommended` 包含 `summary` |
| `verify` | `required: []`, `recommended` 包含 `summary` |

规则：

- 这组 skill 强烈受益于项目认知
- 静态契约不把 `summary` 作为全局硬依赖
- 其中 `verify` 的严格程度由场景状态决定

### 6.6 恢复型 / 收尾型

| Skill | 契约 |
|------|------|
| `catchup` | `required: [summary]` |
| `archive` | `required: [summary]` |

规则：

- `catchup` 恢复的是已存在的项目 / Feature 会话上下文，不替代 `/first`
- 若缺少 `summary`，应优先引导补跑 `/spec-first:first`
- `archive` 需要对项目全貌形成稳定认知，保留硬依赖

### 6.7 治理型

| Skill | 契约 |
|------|------|
| `status` | `required: []` |
| `sync` | `required: []` |
| `analyze` | `required: []` |

规则：

- 治理型 skill 可被上下文增强
- 不能因为上下文缺失而失效

## 7. 项目流程与 `first` 触发

### 7.1 新项目 0-1 主链

```text
/spec
  -> /design
  -> /task
  -> /code
  -> /first（可选但强推荐）
  -> /verify
```

规则：

- 新项目入口是 `/spec`，不是 `/first`
- `/code` 允许承担“第一次把定义与设计落成代码”的职责
- 一旦出现足够可分析事实，应尽快补跑 `/first`

### 7.2 旧项目迭代主链

```text
/first（若缺失 summary）
  -> /code / /review / /verify
```

规则：

- 对有成熟代码基线的项目，`summary` 缺失通常意味着认知资产未补齐
- 因此 `code` / `review` / `verify` 应强烈偏向先补齐 `/first`

### 7.3 `first` 触发规则

不建议用固定文件数阈值判定，而应采用“事件触发 + 保守启发式”。

建议触发事件：

- `/code` 产生了新的代码文件或核心目录
- 检测到脚手架生成完成
- 进入 `/review` 或 `/verify` 前发现 `summary` 缺失
- 仓库中已经出现应用入口、路由、服务层、配置文件等可分析结构

### 7.4 自动提示规则

满足以下条件时，应提示运行 `/spec-first:first`：

1. `summary` 当前缺失
2. 且已检测到可分析项目事实存在

建议的检查时机：

- `/code` 执行完成后
- `/review` 开始前
- `/verify` 开始前或结束后

“可分析项目事实”可包括但不限于：

- 出现新的源代码文件或核心目录
- 检测到脚手架初始化完成
- 存在应用入口、路由、服务层、核心配置等结构
- 仓库已有可识别的既存代码基线

提示策略建议：

- 首次满足条件时使用强提示
- 同一 Feature 在 `summary` 仍缺失的情况下，后续仅做轻提示，避免反复打断
- 若当前处于 `verify` 严格场景，可将提示升级为阻断前置

去重粒度建议：

- 以当前 Feature 为单位去重
- 去重状态可记录到 `.spec-first/meta/context-mode.yaml` 或等价运行时状态文件
- 当 `summary` 生成完成后，去重状态应自动清空

## 8. `verify` 决策矩阵

### 8.1 静态契约

```yaml
verify:
  required: []
  recommended: [summary, critical-flows, conventions, entry-guide]
  optional: [database-schema]
```

### 8.2 场景矩阵

| 场景状态 | `summary` 缺失时行为 |
|----------|----------------------|
| `greenfield + empty + new_feature` | 不阻断，执行轻量验证或阶段验证 |
| `greenfield + scaffold + new_feature` | 不阻断，但强推荐 `/first` |
| `greenfield + active + new_feature` | 不阻断，但应强推荐 `/first`，并在输出中标记认知资产缺口 |
| `brownfield + active + incremental` | 强提示 `/first`，允许降级验证，但需输出风险提示 |
| `brownfield + active + refactor` | 默认强提示 `/first`，高风险改动时可趋向阻断 |
| `brownfield + mature + incremental` | 强提示 `/first`，严格场景可阻断 |
| `brownfield + mature + refactor` | 默认趋向阻断 |
| `brownfield + mature + new_feature` | 默认强提示 `/first`；若触碰共享域模块、主入口、数据库 schema 或跨模块公共契约，可趋向严格 |

### 8.3 核心存量模块判定规则

满足以下**任一**条件视为”核心存量模块”：

| 判定维度 | 规则 | 示例 |
|---------|------|------|
| **显式标记** | 在 `.spec-first/meta/project-state.yaml` 的 `core_modules` 字段中被列出 | `src/core/auth/` |
| **目录位置** | 位于 `src/core/`、`src/lib/core/`、`internal/core/` 等明确标记为核心的目录 | `src/core/payment/` |
| **领域特征** | 涉及认证、授权、支付、数据持久化、安全审计等关键链路 | 认证服务、支付网关 |
| **依赖密度** | 被项目中 ≥ 5 个其他模块直接 import/require | 共享工具库被多处引用 |
| **入口特征** | 是应用主入口、路由注册点、服务启动点 | `app.ts`、`routes/index.ts` |

**判定优先级**：

1. 显式标记（`core_modules` 字段）— 最高优先级
2. 目录位置
3. 领域特征
4. 入口特征
5. 依赖密度

**运行时行为**：

- 若当前 Feature 的变更文件列表与核心模块有交集 → `verify` 趋向严格
- 输出提示：”本次变更涉及核心存量模块 [模块名]，建议确保 `summary` 已就绪后再执行严格验证”

### 8.4 统一规则

- 新项目早期阶段，缺少 `summary` 不得直接阻断
- 旧项目成熟代码基线下，缺少 `summary` 应被视为高优先级认知缺口
- 若用户明确要求继续，可降级执行，但必须输出”认知资产不完整”的风险提示

## 9. 混合场景处理

| 混合场景 | 处理原则 |
|----------|----------|
| 旧项目 + 新模块 | 不把它误判成纯新项目；默认沿用旧项目认知，`summary` 强推荐 |
| 新项目 + 脚手架 | 已有可分析事实，强推荐尽快跑 `/first` |
| 大规模重构 | 以 `refactor` 处理，`verify` 趋向严格 |

原则上，不再通过添加零散特例解决问题，而是统一映射到状态模型。

## 10. 各 Skill 最终配置建议

| Skill | 分类 | required | recommended | optional |
|------|------|----------|-------------|----------|
| `first` | 上下文源 | `skip_injection` | - | - |
| `init` | 前置入口 | `skip_injection` | - | - |
| `onboarding` | 工具型 | `[]` | `[]` | `[summary]` |
| `feature` | 工具型 | `[]` | `[]` | `[summary]` |
| `doctor` | 工具型 | `[]` | `[]` | `[summary]` |
| `spec` | 定义型 | `[]` | `[domain-model, conventions, critical-flows]` | `[]` |
| `design` | 定义型 | `[]` | `[summary, structure-overview, api-contracts, critical-flows, conventions]` | `[steering]` |
| `focus-requirements` | 定义型 | `[]` | `[summary, domain-model, critical-flows, conventions]` | `[entry-guide]` |
| `spec-review` | 定义型 | `[]` | `[domain-model, conventions, critical-flows]` | `[]` |
| `task` | 规划型 | `[]` | `[summary, entry-guide, critical-flows, structure-overview, conventions]` | `[api-contracts]` |
| `plan` | 规划型 | `[]` | `[summary, entry-guide, critical-flows, structure-overview, conventions]` | `[api-contracts]` |
| `orchestrate` | 规划型 | `[]` | `[summary, entry-guide, critical-flows, structure-overview, conventions]` | `[api-contracts]` |
| `research` | 规划型 | `[]` | `[summary, critical-flows, api-contracts, domain-model]` | `[]` |
| `code` | 执行型 | `[]` | `[summary, conventions, entry-guide, structure-overview, critical-flows]` | `[api-contracts]` |
| `review` | 执行型 | `[]` | `[summary, conventions, entry-guide, structure-overview, critical-flows]` | `[api-contracts]` |
| `verify` | 执行型 | `[]` | `[summary, critical-flows, conventions, entry-guide]` | `[database-schema]` |
| `catchup` | 恢复型 | `[summary]` | `[entry-guide, structure-overview, steering, conventions]` | `[]` |
| `archive` | 收尾型 | `[summary]` | `[structure-overview, domain-model]` | `[]` |
| `status` | 治理型 | `[]` | `[summary]` | `[critical-flows, structure-overview, domain-model]` |
| `sync` | 治理型 | `[]` | `[summary]` | `[entry-guide, structure-overview, api-contracts]` |
| `analyze` | 治理型 | `[]` | `[summary, critical-flows, structure-overview]` | `[domain-model]` |

## 11. YAML 骨架与约束

```yaml
auto_inject: true

skip_injection:
  - first
  - init

defaults:
  required: []
  recommended: []
  optional: []
```

说明：

- `defaults.required` 必须为 `[]`
- 不能再保留“流程型统一 `required: [summary]`”的旧默认值
- 各 skill 的完整配置见第 10 节表格
- 新增 skill 必须显式声明主分类与契约；缺失分类时，注入流程应失败而不是静默继承空上下文

## 12. 落地影响

本规范落地后，需要同步更新：

1. `skills/spec-first/skill-input-contracts.yaml`
2. 自动注入后的各个 `SKILL.md`
3. `first` 的职责说明文档
4. `init` / `plan` / `verify` / `catchup` 等入口文案
5. 运行时状态 schema 与读写逻辑
6. `context_gaps` 聚合输出能力
7. `first` 提示去重状态

## 13. 验证标准

1. 新项目在没有 `summary` 时，可以正常执行 `/spec`、`/design`、`/task`
2. `plan` / `orchestrate` / `research` 不再因缺少 `summary` 被硬阻断
3. `code` / `review` 在没有 `summary` 时允许降级工作，并在末尾汇总 `context_gaps`
4. 新项目 0-1 中，`/code` 可以先于 `/first` 承担首次实现
5. `first` 在出现可分析事实后会被稳定提示
6. `verify` 在新项目早期不阻断，在成熟旧项目中更严格
7. `catchup` / `archive` 继续保留 `summary` 硬依赖

## 14. 最终结论

最终采用的不是“`verify` 永远硬依赖 `summary`”，也不是“`verify` 永远不依赖 `summary`”，而是：

- 在静态契约层，`verify` 不把 `summary` 设为全局硬依赖
- 在运行时层，按结构化场景状态决定严格程度

这使系统同时满足四个目标：

- 新项目入口不被认知资产卡死
- `first` 保持单一职责
- `summary` 保留为核心认知资产
- 混合场景和旧项目迭代场景下的验证质量不被削弱
