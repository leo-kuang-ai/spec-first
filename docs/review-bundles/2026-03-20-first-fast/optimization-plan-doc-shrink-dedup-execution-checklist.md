# 00-first 文档瘦身与去重执行检查清单

> 本文件提供行号级执行提示，配合 `optimization-plan-doc-shrink-dedup-change-order.md` 与 `optimization-plan-doc-shrink-dedup-file-audit.md` 使用。
> 说明：以下行号基于当前 live 文件；若后续文件已变动，优先按章节标题定位，而不是死依赖数字行号。

## 1. 高风险文件

### 1.1 `SKILL.md`

必须保留：
- [SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/SKILL.md#L17) `默认模式`
- [SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/SKILL.md#L28) `正式边界`
- [SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/SKILL.md#L49) `主线程契约`
- [SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/SKILL.md#L57) `Reference 读取规则`
- [SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/SKILL.md#L70) `核心硬约束`
- [SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/SKILL.md#L81) `Common Mistakes`

仅允许收紧：
- [SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/SKILL.md#L36) `正式 contract`
- [SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/SKILL.md#L45) `最小执行流`

禁止：
- 禁止删除整段 `正式 contract`
- 禁止删除整段 `最小执行流`
- 禁止移动 `Reference 读取规则`

### 1.2 `execution-flow.md`

必须保留：
- [execution-flow.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/execution-flow.md#L17) 到 [execution-flow.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/execution-flow.md#L65) 的 Step 0-4
- [execution-flow.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/execution-flow.md#L67) 到 [execution-flow.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/execution-flow.md#L84) 的 CLI 最小支撑层

候选删除：
- [execution-flow.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/execution-flow.md#L6) `Skill 负责多 Agent 编排`
- [execution-flow.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/execution-flow.md#L7) `CLI 只负责最小支撑层`
- [execution-flow.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/execution-flow.md#L8) `runtime 是机器真源`

可选保留：
- [execution-flow.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/execution-flow.md#L5) `Skill 定义执行流`
- [execution-flow.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/execution-flow.md#L9) `docs 是人类阅读产物`

### 1.3 `subagent-architecture.md`

必须保留：
- [subagent-architecture.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/subagent-architecture.md#L9) `总并发上限为 3`
- [subagent-architecture.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/subagent-architecture.md#L45) 到 [subagent-architecture.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/subagent-architecture.md#L61) 输入输出边界
- [subagent-architecture.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/subagent-architecture.md#L63) 到 [subagent-architecture.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/subagent-architecture.md#L108) 波次与前置条件
- [subagent-architecture.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/subagent-architecture.md#L110) 到 [subagent-architecture.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/subagent-architecture.md#L135) 失败重试与交接边界

候选删除：
- [subagent-architecture.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/subagent-architecture.md#L5) `多 Agent 编排属于 Skill 层，不属于 CLI`
- [subagent-architecture.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/subagent-architecture.md#L7) `CLI 只做最小支撑与校验`

禁止：
- 禁止删除 [subagent-architecture.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/subagent-architecture.md#L9) 并发定义

## 2. 数据库三件套

### 2.1 `database-config.md`

必须保留：
- 状态语义
- schema 来源优先级
- 条件产出规则
- 多数据库收口
- 安全与输出约束

### 2.2 `database-conditional-projection.md`

必须保留：
- [database-conditional-projection.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/database-conditional-projection.md#L7) 到 [database-conditional-projection.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/database-conditional-projection.md#L18) 的能力边界
- [database-conditional-projection.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/database-conditional-projection.md#L20) 到 [database-conditional-projection.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/database-conditional-projection.md#L25) 的简版状态表
- 跳转到 `database-config.md` 的 owner 说明

候选删除：
- [database-conditional-projection.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/database-conditional-projection.md#L27) 到 [database-conditional-projection.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/database-conditional-projection.md#L42) 的完整证据来源与输出约束细节
- [database-conditional-projection.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/database-conditional-projection.md#L44) 到 [database-conditional-projection.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/database-conditional-projection.md#L55) 的凭证防护执行细则
- [database-conditional-projection.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/database-conditional-projection.md#L60) 到 [database-conditional-projection.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/database-conditional-projection.md#L62) 的 QA 尾注

### 2.3 `platform-document-mapping.md`

必须保留：
- 正式文档全集
- 端类型影响规则
- 内容侧重点
- 条件型能力判定的简表

候选删除：
- 与 `database-config.md` 重复的数据库状态正文

## 3. 主题主文件模板去重

适用文件：
- `structure-analysis.md`
- `api-and-dependencies.md`
- `conventions-and-setup.md`
- `domain-model-analysis.md`

统一动作：
- 收紧开头 `当前正式 contract` 前言
- 收紧 `执行提示见 xxx` 这类分工说明
- 删除末尾单独的 QA 尾注，改成更短的引用句
- 语言约束若与 `quality-assurance-rules.md` 完全同义，可压成一句短引用

必须保留：
- 主题划分
- 正式输出
- 分析要求
- 降级策略
- 冲突/边界处理

### 3.1 `structure-analysis.md`

必须保留：
- [structure-analysis.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/structure-analysis.md#L7) 到 [structure-analysis.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/structure-analysis.md#L70) 的主题主体
- [structure-analysis.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/structure-analysis.md#L72) 的 QA 引用句

仅允许收紧：
- [structure-analysis.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/structure-analysis.md#L3) 到 [structure-analysis.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/structure-analysis.md#L5) 的开头前言
- [structure-analysis.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/structure-analysis.md#L65) 的语言约束句

禁止：
- 禁止删除 `正式输出`、`分析要求`、`降级策略`、`冲突处理`

### 3.2 `api-and-dependencies.md`

必须保留：
- [api-and-dependencies.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/api-and-dependencies.md#L7) 到 [api-and-dependencies.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/api-and-dependencies.md#L65) 的主题主体
- [api-and-dependencies.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/api-and-dependencies.md#L67) 的 QA 引用句

仅允许收紧：
- [api-and-dependencies.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/api-and-dependencies.md#L3) 到 [api-and-dependencies.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/api-and-dependencies.md#L5) 的开头前言
- [api-and-dependencies.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/api-and-dependencies.md#L57) 到 [api-and-dependencies.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/api-and-dependencies.md#L60) 的语言约束句

禁止：
- 禁止删除 API、依赖、外部系统、降级策略主体

### 3.3 `conventions-and-setup.md`

必须保留：
- [conventions-and-setup.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/conventions-and-setup.md#L7) 到 [conventions-and-setup.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/conventions-and-setup.md#L57) 的主题主体
- [conventions-and-setup.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/conventions-and-setup.md#L59) 的 QA 引用句

仅允许收紧：
- [conventions-and-setup.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/conventions-and-setup.md#L3) 到 [conventions-and-setup.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/conventions-and-setup.md#L5) 的开头前言
- [conventions-and-setup.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/conventions-and-setup.md#L52) 的语言约束句

禁止：
- 禁止删除约定、环境、脚本、降级策略主体

### 3.4 `domain-model-analysis.md`

必须保留：
- [domain-model-analysis.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/domain-model-analysis.md#L7) 到 [domain-model-analysis.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/domain-model-analysis.md#L61) 的主题主体
- [domain-model-analysis.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/domain-model-analysis.md#L63) 的 QA 引用句

仅允许收紧：
- [domain-model-analysis.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/domain-model-analysis.md#L3) 到 [domain-model-analysis.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/domain-model-analysis.md#L5) 的开头前言
- [domain-model-analysis.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/domain-model-analysis.md#L62) 的语言约束句

禁止：
- 禁止删除实体、关系、状态机、降级策略主体

## 4. 当前不动文件

- `main-thread-contract.md`
- `evidence-pack-spec.md`
- `agent-output-schema.md`
- `testing-strategy.md`
- 全部 `agent-*.md` / `agents-*.md`

原因：
- 已经足够短，或承担唯一 contract，不适合作为本轮瘦身目标。
