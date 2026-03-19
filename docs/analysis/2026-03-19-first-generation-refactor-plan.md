# first 重构方案

> 日期：2026-03-19
> 目标：从 skill 本质出发，重构当前 `first`
> 约束：不改 runtime 资产合同，不改其他 skill 的上下文注入协议
> 策略：不考虑向下兼容，旧脚本化生成逻辑中该删除的部分直接删除

## 1. 结论先行

当前 `first` 的主要问题，不是文档数量，也不是某个 JSON 字段，而是系统主从关系反了：

- 设计上，`first` 应该是一个 skill
- 实现上，`first` 已经演化成一套 CLI 驱动的本地文档编译器

因此这次重构的本质不是“继续优化脚本”，而是：

**把 `first` 从脚本主导系统，重新拉回 skill 主导系统。**

重构后的主边界：

1. `SKILL.md + references` 重新成为主控层
2. 多 Agent 编排只在 `SKILL.md + references` 中定义
3. CLI 退回最小支撑层
4. runtime 保持机器真源地位
5. docs 只作为人类阅读产物

## 2. 当前实现复审结论

这次方案复审不是只看设计意图，而是对照了当前仓库实现。结论是：原方案方向成立，但低估了当前实现中 `docs/first` 的治理范围，也低估了 `first-context.ts` 的中枢作用。

### 2.1 当前实现里，docs 不只是“输出物”

当前仓库中，`docs/first` 不只是由 `first.ts -> first-bootstrap.ts -> first-doc-projection.ts` 生成。

至少下列模块也把 `docs/first` 当成正式输出集合来治理：

- `src/core/skill-runtime/first-context.ts`
- `src/core/skill-runtime/first-change-detector.ts`
- `src/core/skill-runtime/first-incremental-update.ts`
- `src/core/skill-runtime/first-governance.ts`
- `src/cli/commands/doctor.ts`
- `src/cli/commands/status.ts`
- `src/core/gate-engine/sca.ts`
- `skills/spec-first/00-first/references/testing-strategy.md`

因此，如果本次方案决定把 docs 降为“只做存在性检查”，就不能只改 `first-doc-projection.ts`，必须同步收缩这条 docs 输出治理链。

### 2.2 当前实现里，`first-context.ts` 才是真正的中枢

当前实现中，`first-context.ts` 不只是读上下文的辅助文件，它实际上承担了：

- runtime 健康判断
- git 变更检测
- rebuild artifact 判定
- docs refresh 触发
- runtime index 同步
- refresh mode 路由

因此，重构焦点不能只放在：

- `first-bootstrap.ts`
- `first-doc-projection.ts`

还必须把以下三者视为一个整体迁移单元：

- `src/core/skill-runtime/first-context.ts`
- `src/core/skill-runtime/first-bootstrap.ts`
- `src/core/skill-runtime/first-doc-projection.ts`

### 2.3 当前实现下，必须补进方案的同步修改面

如果坚持本方案目标，至少这些模块也必须进入正式执行清单：

- `src/cli/commands/init.ts`
- `src/cli/commands/doctor.ts`
- `src/cli/commands/status.ts`
- `src/core/gate-engine/sca.ts`
- `src/core/skill-runtime/first-change-detector.ts`
- `src/core/skill-runtime/first-context.ts`
- `src/core/skill-runtime/first-incremental-update.ts`
- `src/core/skill-runtime/first-governance.ts`
- `skills/spec-first/00-first/references/*`

### 2.4 当前实现下，必须直接落下的 3 个决策

1. `index.docsProjection` 继续存在，但只表示 docs 生成结果与存在状态  
当前 `doctor.ts` / `status.ts` / `sca.ts` / `first-change-detector.ts` 都依赖它。  
本次直接改语义，不再定义为文档真源。

2. `first-doc-projection.ts` 不再保留建模职责  
当前多个模块、references、测试都引用它。  
本次直接删除其中的建模与 fallback 逻辑；文件是否继续存在，只取决于是否还承担最终写盘职责。

3. `docs` 内容漂移不再是系统问题  
当前 `doctor.ts`、`status.ts`、`sca.ts` 都把 docs 漂移当系统错误。  
本次直接改判定逻辑：
- docs 缺失才报
- docs 内容漂移不再报

## 3. 重构目标

### 3.1 必须保留

本次必须保持不变：

- `.spec-first/runtime/first/*.json` 的资产名不变
- runtime JSON 的结构不变
- `readFirst*()` 读取接口不变
- `src/core/skill-runtime/context-resolver.ts` 的上下文解析协议不变
- `src/core/skill-runtime/dispatcher.ts` 的 skill 注入格式不变
- `docs/first` 的文档数量和文件名不变

### 3.2 必须改变

本次必须改变：

- `SKILL.md` 成为真正的主控描述
- 多 Agent 编排只保留在 skill 层
- CLI 只负责输入准备、结果落盘和检查
- runtime 做结构校验
- docs 只做存在性检查
- 删除旧生成链中的脚本化建模、兜底和兼容逻辑
- 收缩 docs canonical projection 治理链

### 3.3 明确不做

本次不做：

- 不改 runtime 合同
- 不改其他 skill 的消费方式
- 不保留旧生成路径兼容分支
- 不继续加厚 CLI 启发式分析能力
- 不让 docs 重新成为上下文注入输入

## 4. 核心设计原则

1. skill 主导，脚本支撑
2. 多 Agent 编排属于 `SKILL.md + references`，不在 `src` 中实现调度器
3. `src` 只负责最小输入准备、结果落盘和检查
4. runtime 是机器输入，docs 是人类阅读输出
5. runtime 必须结构正确，docs 只要求生成存在
6. docs 不反向参与上下文注入
7. 生成链只保留一条主路径，不保留 fallback 旁路
8. 缺少 skill handoff 时直接失败

## 5. 目标架构

```text
spec-first first
  -> SKILL.md 主控
    -> references/execution-flow.md
    -> references/subagent-architecture.md
    -> references/agents-*.md
  -> src 最小支撑层
    -> collect evidence / prepare inputs
    -> accept skill handoff results
    -> validate runtime assets
    -> write runtime/*.json
    -> write docs/first/*.md
    -> check docs existence
```

### 5.1 职责边界

- `SKILL.md`：定义目标、分工、依赖、约束、成功标准
- `references/*`：定义阶段、波次、Agent 规格、质量规则
- `src/cli/commands/first.ts`：触发 skill 支撑链路
- `first-bootstrap.ts`：优先消费 handoff 结果并串联落盘与检查
- `first-support-handoff.ts`：定义 skill 到最小支撑层的交接目录与读取/写盘协议
- `runtime 结果`：由 skill 层多 Agent 产出结构化资产，并交接到 handoff 目录
- `docs 结果`：由 skill 层多 Agent 产出 markdown 文档，并交接到 handoff 目录
- `src` 中的校验逻辑：只校验 runtime 合同与 docs 存在性

### 5.2 唯一生成路径

```text
skill definition
  -> skill-level multi-agent execution
  -> src input preparation
  -> runtime/docs results
  -> runtime validation
  -> runtime write
  -> docs write
  -> docs existence check
```

除这条路径之外，不再保留第二套 fallback 生成链；缺少 handoff 时最小支撑层直接失败。

## 6. runtime 与 docs 的边界

### 6.1 runtime 的角色

runtime 是后续 skill 的机器输入，必须保持合同稳定。

本次保留当前 9 个 runtime 资产不变：

- `summary.json`
- `steering.json`
- `conventions.json`
- `critical-flows.json`
- `entry-guide.json`
- `api-contracts.json`
- `structure-overview.json`
- `domain-model.json`
- `database-schema.json`

### 6.2 docs 的角色

docs 是人类阅读输出，不再要求是 runtime 的严格 projection。

本次保留当前 docs 集合不变：

- `docs/first/README.md`
- `docs/first/summary.md`
- `docs/first/steering.md`
- `docs/first/conventions.md`
- `docs/first/critical-flows.md`
- `docs/first/entry-guide.md`
- `docs/first/api-docs.md`
- `docs/first/codebase-overview.md`
- `docs/first/domain-model.md`
- `docs/first/architecture.md`
- `docs/first/call-graph.md`
- `docs/first/development-guidelines.md`
- `docs/first/external-deps.md`
- `docs/first/database-er.md`

### 6.3 允许与禁止

允许：

- docs 比 runtime 更详细
- docs 使用更自然的文档组织方式
- README 由 skill 层 Agent 或最小支撑层汇总生成

禁止：

- docs 反向作为上下文注入输入
- docs 成为 runtime 结构校验前提
- docs 内容漂移被继续解释为系统错误

## 7. 目标文件结构

### 7.1 保留并重构的文件

- `src/cli/commands/first.ts`
- `src/core/skill-runtime/first-bootstrap.ts`
- `src/core/skill-runtime/first-doc-projection.ts`
- `src/core/skill-runtime/first-artifact-mapping.ts`
- `skills/spec-first/00-first/SKILL.md`
- `skills/spec-first/00-first/references/*`

### 7.2 新增文件

- 无强制新增执行器文件
- 如有必要，只新增“输入准备 / runtime 校验 / docs 存在性检查”类辅助文件

### 7.3 明确不改的文件

- `src/core/skill-runtime/first-runtime-types.ts`
- `src/core/skill-runtime/first-runtime-store.ts`
- `src/core/skill-runtime/context-resolver.ts`
- `src/core/skill-runtime/dispatcher.ts`

### 7.4 必须同步收缩的治理链文件

- `src/core/skill-runtime/first-context.ts`
- `src/core/skill-runtime/first-change-detector.ts`
- `src/core/skill-runtime/first-incremental-update.ts`
- `src/core/skill-runtime/first-governance.ts`
- `src/cli/commands/doctor.ts`
- `src/cli/commands/status.ts`
- `src/core/gate-engine/sca.ts`

## 8. Skill 层 Agent 划分

### 8.1 runtime agents

- `summary-steering`：产出 `summary.json`、`steering.json`
- `conventions-entry-guide`：产出 `conventions.json`、`entry-guide.json`
- `critical-flows`：产出 `critical-flows.json`
- `api-contracts`：产出 `api-contracts.json`
- `structure-overview`：产出 `structure-overview.json`
- `domain-model`：产出 `domain-model.json`
- `database-schema`：产出 `database-schema.json`

### 8.2 docs agents

- `overview-docs`：产出 `README.md`、`summary.md`、`steering.md`
- `engineering-docs`：产出 `conventions.md`、`development-guidelines.md`、`entry-guide.md`
- `flow-docs`：产出 `critical-flows.md`、`call-graph.md`
- `api-docs`：产出 `api-docs.md`、`external-deps.md`
- `structure-docs`：产出 `codebase-overview.md`、`architecture.md`
- `model-docs`：产出 `domain-model.md`、`database-er.md`

### 8.3 关键规则

- runtime agents 直接返回当前 runtime 合同对应的 JSON
- docs agents 直接返回最终 markdown
- skill 层负责 Agent 波次、依赖和重试
- `src` 不在接收结果后再次重建模
- `src` 只负责 runtime 校验和 docs 存在性检查

## 9. 需要删除或降级的旧逻辑

### 9.1 直接删除

- `first-doc-projection.ts` 内所有 `buildSynthetic*` 函数
- projection 中依赖 synthetic 结果的 fallback 分支
- “读不到 asset 时自动拼一个近似 asset”的逻辑
- 为旧半成品输出服务的兜底渲染逻辑

### 9.2 直接重写或删除

- `first-doc-projection.ts`
  - 不再承担建模职责
  - 若只剩 docs 写盘职责则保留，否则直接删除
- `first-bootstrap.ts`
  - 不再承担本地 builder 式建模
  - 改成 skill 支撑入口
- `first-context.ts`
  - 不再承担刷新/重建中枢
  - 收缩为运行态协调层
- `first-incremental-update.ts`
  - 删除依赖旧建模边界的分支
- `first-governance.ts`
  - 删除依赖旧刷新路径的分支

### 9.3 必须同步改判定逻辑的模块

- `doctor.ts`
  - 不再把 docs drift 作为 WARNING
- `status.ts`
  - 不再输出 docs drift 语义
- `sca.ts`
  - 不再把 docs drift 作为 finding
- `first-change-detector.ts`
  - 不再把 health 范围定义为 `runtime truth + canonical projection docs`

## 10. 各文件重构动作

### 10.1 `skills/spec-first/00-first/SKILL.md` 与 references

目标：

- 重新成为 `first` 的主控中心
- 明确记录多 Agent 编排
- 不再让 CLI 反向决定 skill 如何工作

要求：

- `SKILL.md` 定义输入、输出、成功标准
- `execution-flow.md` 定义主线程阶段
- `subagent-architecture.md` 定义波次、依赖、超时
- `agents-*.md` 定义每类 Agent 的输入、证据、输出要求

### 10.2 `first-bootstrap.ts`

目标：

- 只负责 skill 支撑
- 不直接构造 markdown
- 不再塞入本地建模逻辑

执行顺序：

1. 采集证据
2. 接收 runtime 结果
3. runtime 校验与写盘
4. 接收 docs 结果
5. docs 写盘与存在性检查

### 10.3 `first-context.ts`

目标：

- 从“刷新/重建中枢”收缩成“运行态协调层”

必须移出：

- git 变更驱动的 rebuild 逻辑
- docs refresh 触发
- runtime 重建判定

保留：

- 与 background input 状态同步直接相关的协调能力

### 10.4 `first-artifact-mapping.ts`

目标：

- 保留最小映射关系，方便任务分发和产物定位
- 不再把 mapping 当 strict projection contract

保留：

- `FIRST_RUNTIME_ARTIFACTS`
- `matchArtifactsByChangedFile`
- `matchRuntimeArtifactsByChangedFile`

直接删除：

- docs 作为 projection registry 的强绑定语义
- `BASE_PROJECTION_DOCS` / `FORMAL_TOPIC_PROJECTION_DOCS` / `CONDITIONAL_PROJECTION_DOCS` 这类治理性语义

### 10.5 `doctor.ts` / `status.ts` / `sca.ts` / `first-change-detector.ts`

目标：

- 从“检查 docs 漂移”改为“检查 docs 是否缺失”

## 11. 校验策略

### 11.1 runtime 校验

runtime 必须做结构校验，因为它是程序输入。

校验范围：

- 文件存在
- JSON 可解析
- 必需字段存在
- 字段类型正确
- 条件型资产状态合法

### 11.2 docs 校验

docs 只做存在性检查，不做格式检查。

校验范围：

- 目标文件是否生成
- 条件型文件在条件满足时是否生成

不做：

- markdown schema 校验
- 风格一致性校验
- 内容漂移判定

## 12. 测试方案

建议新增或重写：

- `tests/unit/first-runtime-validator.test.ts`（若新增该文件）
- `tests/unit/first-evidence-pack.test.ts`（若新增该文件）
- `tests/unit/first-docs-check.test.ts`（若新增该文件）

还需要补的回归重点：

1. runtime 合同不变
2. `context-resolver` 仍能成功读取 runtime
3. `dispatcher` 的 `first-runtime-context` 注入格式不变
4. Agent 返回 JSON 不符合 schema 时最小支撑层明确失败
5. docs 只做存在性检查，不做格式校验
6. `doctor/status/sca/first-change-detector` 不再把 docs drift 当系统错误

## 13. 风险与控制

主要风险：

1. 去掉 projection fallback 后，可能暴露 Agent 输出不足
2. `first-context.ts`、`first-incremental-update.ts`、`first-governance.ts` 的耦合点比直觉更广
3. skill 层与 `src` 支撑层边界不清，会再次脚本化
4. runtime 与 docs 双生成后，内容可能漂移
5. 如果 `docs drift` 旧语义未同步移除，会导致新旧边界冲突

控制方式：

- 先冻结 runtime 合同
- 先重写 skill 主控层，再落地 CLI 实现
- 先收紧 `src` 支撑边界，再接 skill 层结果
- 通过回归测试锁住 skill 注入协议

## 14. 实施顺序

### 14.1 冻结边界

- 冻结 runtime 合同
- 冻结 docs 集合
- 冻结 skill 注入边界
- 明确 `index.docsProjection` 的新语义

### 14.2 重写 skill 主控层

- 更新 `skills/spec-first/00-first/SKILL.md`
- 更新 `references/execution-flow.md`
- 更新 `references/subagent-architecture.md`
- 更新 `references/agents-*.md`

### 14.3 删除旧脚本化逻辑

- 删除 `first-doc-projection.ts` 的 synthetic 和 fallback
- 删除 CLI 主链中的本地建模旁路
- 同步移除 docs drift 的旧语义

### 14.4 建立 skill 支撑骨架

- 视需要新增输入准备、runtime 校验、docs 存在性检查辅助模块
- 明确 `src` 只接收结果，不实现 Agent 调度

### 14.5 重写 first 主链

- 让 `first-bootstrap.ts` 改成 skill 支撑入口
- runtime 与 docs 都改为由 skill 层多 Agent 生成
- 收缩 `first-context.ts` 的中枢职责

### 14.6 清理治理链

- 清理 `doctor.ts`
- 清理 `status.ts`
- 清理 `sca.ts`
- 清理 `first-change-detector.ts`
- 清理 `first-incremental-update.ts`
- 清理 `first-governance.ts`
- 清理过时 references 和测试

### 14.7 回归验证

- 跑 runtime 合同回归
- 跑上下文注入回归
- 运行一次 `spec-first first --force`
- 对照 `docs/first` 输出做人工 review

## 15. 推荐执行顺序

1. 先冻结 runtime 合同与 docs 合同
2. 先重写 `skills/spec-first/00-first/SKILL.md` 与 references
3. 再删除 `first-doc-projection.ts` 的 synthetic 和 fallback 逻辑
4. 明确 `index.docsProjection` 的新语义
5. 如有必要，新增 `first-evidence-pack.ts` / `first-runtime-validator.ts` / `first-docs-check.ts`
6. 重写 `first-bootstrap.ts`，并同步收缩 `first-context.ts`
7. 缩减 `first-artifact-mapping.ts`
8. 清理 `doctor.ts` / `status.ts` / `sca.ts` / `first-change-detector.ts`
9. 清理 `first-incremental-update.ts` / `first-governance.ts`
10. 补测试
11. 运行一次 `spec-first first --force`
12. 做人工 review

## 16. 验收标准

完成后应满足：

1. `docs/first` 文件数量和文件名不变
2. `.spec-first/runtime/first/*.json` 资产名和结构不变
3. `readFirst*()` 接口不变
4. `context-resolver.ts` 不需要改调用方式
5. `dispatcher.ts` 的 `first-runtime-context` 注入格式不变
6. `first` 的唯一生成路径为 skill 主导的多 Agent 编排
7. runtime 做结构校验，docs 只做存在性检查
8. `doctor/status/sca` 不再把 docs drift 当系统错误
9. `first` 从脚本主导系统重新回到 skill 主导系统

## 17. 逐文件任务清单

本节用于直接指导开发。每个文件都明确到 4 类动作之一：

- 删除
- 重写
- 收缩
- 新增

### 17.1 Skill 层

#### `skills/spec-first/00-first/SKILL.md`

动作：重写

目标：

- 明确定义 `first` 的唯一主路径为多 Agent 编排
- 删除所有“CLI 会自动分析并生成 canonical projection”的叙事
- 明确 runtime 与 docs 是两套产物：
  - runtime 给机器消费
  - docs 给人阅读

必须完成：

- 定义唯一模式为 deep，且默认就是 deep
- 定义 runtime agents 与 docs agents
- 定义 skill 层与最小支撑层职责边界
- 定义成功标准、失败条件、重试原则

删除：

- 任何把 CLI 写成主要认知生成器的描述
- 任何把 docs 定义成 runtime 严格 projection 的描述

#### `skills/spec-first/00-first/references/execution-flow.md`

动作：重写

目标：

- 明确 skill 层执行顺序，以及与最小支撑层的交接点

必须完成：

1. collect evidence pack
2. dispatch runtime agents
3. dispatch docs agents
4. 产出 runtime 结果并交接给最小支撑层
5. 产出 docs 结果并交接给最小支撑层

删除：

- 本地 builder / refresh-docs-from-runtime 主链
- projection fallback 流程

#### `skills/spec-first/00-first/references/subagent-architecture.md`

动作：重写

目标：

- 定义 Agent 波次、依赖和并发关系

必须完成：

- runtime agents 的波次与并发度
- docs agents 的波次与并发度
- 超时、重试、失败回收规则
- skill 层结果合并规则

#### `skills/spec-first/00-first/references/agents-*.md`

动作：重写

目标：

- 为每类 Agent 写死输入、证据、输出格式

必须完成：

- runtime agents 输出当前 runtime schema 对应 JSON
- docs agents 输出最终 markdown
- 每类 Agent 的证据来源与禁止推断边界

### 17.2 CLI 入口与主控

#### `src/cli/commands/first.ts`

动作：重写

目标：

- 入口只负责触发 `first` 的最小支撑链路
- 不再自己决定 bootstrap / refresh-docs-from-runtime / fallback 路径

必须完成：

- 清理旧帮助文案中的 canonical projection 叙事
- 统一改成“运行 first skill 最小支撑链路”
- 调用新的最小支撑入口

删除：

- 本地 builder 驱动分支
- “从 runtime 刷 projection docs” 主叙事

#### `src/core/skill-runtime/first-bootstrap.ts`

动作：重写

目标：

- 改成最小 skill 支撑入口
- 不再承担本地建模职责

必须完成：

- 接收 project root / mode / options
- 调 evidence pack
- 接收 skill 层 runtime/docs 结果
- 调 runtime validator（若保留为独立模块）
- 写 runtime
- 写 docs
- 调 docs existence check（若保留为独立模块）

删除：

- 本地 summary / conventions / critical flows 等建模逻辑
- docs projection 驱动逻辑
- fallback refresh 分支

#### `src/core/skill-runtime/first-evidence-pack.ts`

动作：按需新增

目标：

- 生成统一证据包，作为 skill 层 Agent 的共享输入

必须完成：

- 收集目录结构、关键配置、关键源码摘要、依赖信息、入口信息
- 输出稳定的 evidence pack 结构

删除：

- 零散分布在 bootstrap / context / projection 里的重复证据采集逻辑

### 17.3 Runtime 校验与 docs 检查

#### `src/core/skill-runtime/first-runtime-validator.ts`

动作：按需新增

目标：

- 对 9 个 runtime 资产做结构校验

必须完成：

- JSON 可解析
- 必填字段存在
- 字段类型正确
- 条件型状态合法

禁止：

- 校验 docs
- 做文档风格检查

#### `src/core/skill-runtime/first-docs-check.ts`

动作：按需新增

目标：

- 只检查 docs 是否存在

必须完成：

- 检查固定 docs 集合是否生成
- 对条件型 docs 做条件存在判断

禁止：

- markdown 格式检查
- 风格一致性检查
- 内容漂移检查

### 17.4 旧 docs projection 与映射层

#### `src/core/skill-runtime/first-doc-projection.ts`

动作：删除或极限收缩

判定规则：

- 如果这个文件只剩“把 docs agent 输出写到固定路径”这一件事，可以保留
- 如果仍然承担建模、推断、拼装职责，直接删除

必须删除：

- 所有 `buildSynthetic*`
- 所有 fallback asset 构造
- 所有 projection-driven 建模逻辑
- 所有“缺 asset 就拼近似内容”的逻辑

#### `src/core/skill-runtime/first-artifact-mapping.ts`

动作：重写

目标：

- 只保留最小映射能力，服务于产物定位和任务分发

保留：

- `FIRST_RUNTIME_ARTIFACTS`
- 基于变更文件定位 runtime artifact 的能力

删除：

- docs 作为 strict projection registry 的定义
- `BASE_PROJECTION_DOCS`
- `FORMAL_TOPIC_PROJECTION_DOCS`
- `CONDITIONAL_PROJECTION_DOCS`
- 任何 docs canonical truth 语义

### 17.5 当前治理链清理

#### `src/core/skill-runtime/first-context.ts`

动作：重写

目标：

- 从“刷新/重建中枢”收缩成“运行态协调层”

保留：

- 与 background input 读取直接相关的状态协调

删除：

- docs refresh 触发
- runtime rebuild 判定
- git 变更驱动的重建逻辑
- index 同步中的 docs projection 治理语义

#### `src/core/skill-runtime/first-change-detector.ts`

动作：重写

目标：

- 只关注 runtime 健康和必要缺失

删除：

- `runtime truth + canonical projection docs` 这种 health 范围定义
- docs drift 相关 finding

#### `src/core/skill-runtime/first-incremental-update.ts`

动作：删除或重写

判定规则：

- 如果仍然服务于旧 projection refresh 链，直接删除
- 如果仍有必要保留，只能保留 runtime/docs 结果级别的最小增量处理

必须删除：

- `refreshFirstDocsFromRuntime` 驱动链
- 旧 projection refresh 逻辑

#### `src/core/skill-runtime/first-governance.ts`

动作：重写

目标：

- 删除对 docs canonical projection 的治理

保留：

- 与 runtime 资产状态、生成结果状态有关的最小治理

删除：

- formal topic projection 语义
- docs drift 治理
- 旧 refresh 路径耦合

### 17.6 其他受影响命令与检查链

#### `src/cli/commands/init.ts`

动作：收缩

目标：

- 继续只检查 runtime readiness
- 不把 docs 作为 readiness 前提

#### `src/cli/commands/doctor.ts`

动作：重写

目标：

- 检查 runtime 结构问题
- 检查 docs 缺失

删除：

- docs drift warning
- “重新生成 projection docs” 叙事

#### `src/cli/commands/status.ts`

动作：重写

目标：

- 输出 runtime 状态与 docs existence 状态

删除：

- docs drift 语义
- docsProjection 作为 canonical sync 状态的解释

#### `src/core/gate-engine/sca.ts`

动作：重写

目标：

- 不再把 docs drift 作为 finding

保留：

- runtime 缺失或 runtime 非法的 finding

### 17.7 不应修改的核心合同文件

#### `src/core/skill-runtime/first-runtime-types.ts`

动作：不改结构合同

要求：

- 不改 9 个 runtime 资产的 schema

#### `src/core/skill-runtime/first-runtime-store.ts`

动作：只做必要适配

要求：

- 不改 runtime 读写合同
- 只允许接入新的最小支撑写盘路径

#### `src/core/skill-runtime/context-resolver.ts`

动作：不改调用协议

要求：

- 继续从 runtime 读取背景

#### `src/core/skill-runtime/dispatcher.ts`

动作：不改注入协议

要求：

- 继续注入 `first-runtime-context`

### 17.8 测试文件任务

#### 需要新增

- `tests/unit/first-evidence-pack.test.ts`（若新增该文件）
- `tests/unit/first-runtime-validator.test.ts`（若新增该文件）
- `tests/unit/first-docs-check.test.ts`（若新增该文件）

#### 需要重写

- 与 `first-context.ts` 相关的单测
- 与 `doctor.ts` / `status.ts` / `sca.ts` docs drift 语义相关的单测

#### 需要删除

- 任何验证 synthetic projection fallback 的测试
- 任何验证 docs canonical projection drift 的测试

## 18. 建议开发顺序

1. 重写 `SKILL.md` 与 `references/*`
2. 如有必要，新增 `first-evidence-pack.ts`
3. 如有必要，新增 `first-runtime-validator.ts`
4. 如有必要，新增 `first-docs-check.ts`
5. 重写 `first.ts`
6. 重写 `first-bootstrap.ts`
7. 合并处理 `first-context.ts` 与 `first-doc-projection.ts`，先去掉旧依赖，再删除或极限收缩 projection 文件
8. 重写 `first-artifact-mapping.ts`
9. 重写 `first-change-detector.ts`
10. 删除或重写 `first-incremental-update.ts`
11. 重写 `first-governance.ts`
12. 重写 `doctor.ts`
13. 重写 `status.ts`
14. 重写 `sca.ts`
15. 补测试
16. 运行一次 `spec-first first --force`
17. 做人工 review

## 19. 最终判断

这次重构最重要的，不是把某个脚本写得更优雅，而是重新恢复系统主次关系：

- skill 负责定义
- Agent 负责生成
- CLI 负责支撑
- runtime 负责机器真源
- docs 负责人工阅读

只要这个边界恢复，`first` 才会重新像一个 skill，而不是继续演化成一套越来越重的脚本系统。
