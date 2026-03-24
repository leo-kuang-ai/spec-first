# 00-first References 重构提案

> 目标：收敛 `00-first` 的 reference 结构，保留能力，减少重复，降低维护成本。

## 1. 背景

`first` 的职责是完成项目首次认知、证据包构建、runtime 真源建立、docs 产物生成，以及主线程与多 Agent 的协同约束。

当前 `references/` 能力足够，但文档结构存在以下问题：

- 同一类契约被拆成多份同构文档。
- 执行提示和主题规范边界过细。
- 质量规则、测试策略、证据规则之间开始重叠。
- 新增主题时容易复制模板，导致术语漂移。

本提案的目标不是削弱 `first`，而是把它收敛成“强能力、弱重复、清边界”的结构。

## 2. 结论

`00-first` 的能力设计本身合理，过度设计主要出现在文档分层，而不是流程能力本身。

- 能力必须保留：项目识别、证据包、runtime 真源、docs 输出、多 Agent 并发、波次控制、失败重试、质量门禁。
- 需要优化：主题文档双份化、契约分散化、重复模板化、分类与映射分裂化。

## 3. 现状问题

### 3.1 重复模板过多

多个 reference 文件都在使用几乎相同的骨架：

- 任务范围
- 输入证据
- 输出约束
- 缺口标记

例如：

- `agents-code-analysis.md`
- `agents-api-deps.md`
- `agent-guidelines-setup.md`
- `agent-database.md`
- `agent-domain-model.md`

### 3.2 契约拆分过细

以下文档都在描述主线程、证据包、输出格式或验收：

- `execution-flow.md`
- `subagent-architecture.md`
- `main-thread-contract.md`
- `evidence-pack-spec.md`
- `agent-output-schema.md`
- `quality-assurance-rules.md`
- `testing-strategy.md`

### 3.3 主题文档双份化

多个主题被拆成“执行提示 + 主题规范”两份：

- 代码结构分析
- API 与外部依赖
- 规范与本地环境
- 数据库
- 领域模型

### 3.4 数据库能力拆分过多

数据库相关能力被拆为：

- 执行提示
- 条件型产物
- 配置与适用性规范

它们本质属于同一能力域。

### 3.5 交叉引用未同步收口

迁移时如果只改正文不改引用，会导致：

- `references/` 内部出现旧文件名残留。
- `SKILL.md` 的 `Reference 读取规则` 与实际目录不一致。
- 删除旧文件后，部分引用链断裂。

高风险引用链示例：

| 被引用文件 | 主要引用者 | 迁移动作 |
|-----------|-----------|----------|
| `platform-document-mapping.md` | `api-and-dependencies.md`、`database-config.md` | 改为引用新的项目分类与映射主文档 |
| `database-config.md` | `database-conditional-projection.md`、`platform-document-mapping.md` | 改为引用新的数据库能力主文档 |
| 各 `agent-*.md` | 对应的主题规范文件 | 改为引用合并后的统一主题主文档 |

这类引用必须在删除旧文件前全部更新完毕。

## 4. 重构原则

- 主干优先：保留真正承担流程职责的文档。
- 同域收口：同一能力域尽量只保留一份正式主文档。
- 模板抽象：重复 prompt 骨架应抽成模板。
- 不改能力边界，只改文档结构。

## 5. 推荐保留

建议保留为主干的文档：

- `SKILL.md`
- 执行流程主文档
- 主线程契约主文档
- 证据包规范主文档
- 质量与验证主文档
- 项目分类与文档映射主文档
- 数据库能力主文档
- 主题文档模板

## 6. 推荐合并

### 6.1 执行流程 + Agent 架构

合并：

- `execution-flow.md`
- `subagent-architecture.md`

目标：

- 统一主线程流程、Agent 分组、波次、并发上限、失败重试、交接边界。

### 6.2 主线程契约 + 证据包 + 输出格式

合并：

- `main-thread-contract.md`
- `evidence-pack-spec.md`
- `agent-output-schema.md`

目标：

- 统一主线程保留什么、证据包怎么传、Agent 输出格式是什么。

### 6.3 质量规则 + 测试策略

合并：

- `quality-assurance-rules.md`
- `testing-strategy.md`

目标：

- 统一证据标注、抽样验证、测试层次、回归触发条件、验收标准。

### 6.4 项目识别 + 文档映射

合并：

- `detection-rules.md`
- `platform-document-mapping.md`

目标：

- 统一项目类型识别、子类型识别、端类型影响与条件型文档策略。

### 6.5 数据库能力域

合并：

- `agent-database.md`
- `database-conditional-projection.md`
- `database-config.md`

目标：

- 统一数据库识别、执行提示、条件型产物、配置优先级、安全边界。

### 6.6 主题分析双文件

合并以下组合：

- `agents-code-analysis.md` + `structure-analysis.md`
- `agents-api-deps.md` + `api-and-dependencies.md`
- `agent-guidelines-setup.md` + `conventions-and-setup.md`
- `agent-domain-model.md` + `domain-model-analysis.md`

目标：

- 保留统一结构，删除 prompt / contract 重复。

## 7. 推荐删除

若上述合并落地，以下旧文件可退役：

- `agents-code-analysis.md`
- `agents-api-deps.md`
- `agent-guidelines-setup.md`
- `agent-domain-model.md`
- `agent-database.md`
- `structure-analysis.md`
- `api-and-dependencies.md`
- `conventions-and-setup.md`
- `domain-model-analysis.md`
- `database-conditional-projection.md`
- `database-config.md`
- `platform-document-mapping.md`

`agent-output-schema.md` 可根据最终合并结果决定是否保留为独立附件。

删除前置条件：

- `references/` 内部交叉引用已更新完毕。
- `SKILL.md` 的 `Reference 读取规则` 已重写。
- 所有旧文件引用者都已切换为新主文档名。

## 8. 推荐新增

### 8.1 first-routing-guide.md

用途：

- 说明 `first`、`catchup`、`project-onboarding`、`brownfield-baseline`、`feature-init` 的选择条件。

### 8.2 topic-agent-template.md

用途：

- 抽象所有主题 prompt 的共通骨架，避免复制粘贴。

## 9. 推荐最终目录

```text
references/
  execution-and-agent-architecture.md
  main-thread-and-evidence-contract.md
  quality-and-verification.md
  project-classification-and-doc-mapping.md
  database-analysis-contract.md
  first-routing-guide.md
  topic-agent-template.md
```

> 注：这里写的是收敛后的逻辑分层，不是当前仓库的唯一物理文件名。当前已落地的 canonical 文件名分别是 `quality-assurance-rules.md`、`platform-document-mapping.md`、`database-analysis.md`，其职责与本提案中的目标层一致。

可选保留：

- `agent-output-schema.md`

## 10. 最终判断

`00-first` 的能力设计合理，当前需要的是文档结构减法，而不是继续增加文档数量。

最佳方向：

- 保留主干。
- 合并同域。
- 删除重复。
- 抽出模板。
- 补入口决策。
