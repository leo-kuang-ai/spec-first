# 00-first 文档瘦身与去重逐文件审查清单

> 范围：`skills/spec-first/00-first` 下全部 `21` 个 Markdown 文件。
> 目标：逐文件判断哪些内容可以删、哪些内容必须保留、哪些文件应作为 canonical owner。
> 原则：不改 runtime / CLI / wave 语义，不削弱质量门禁，不删除唯一调度入口。
> 关系说明：本文件是**分析基线**；执行批次与改动顺序见 `optimization-plan-doc-shrink-dedup-change-order.md`；行号级操作清单见 `optimization-plan-doc-shrink-dedup-execution-checklist.md`。

## 1. 全局判断

### 1.1 最佳方案

最佳方案不是“统一压短所有文档”，而是：

- 保留核心主合同与 owner 文档为权威来源
- 保留 5 份 agent 执行提示文档为轻壳
- 对 4 份主题主文件做局部去重
- 对数据库 3 件套做主次收口
- 对 `SKILL.md` 只做轻量去重，不做结构性压缩
- 保持 `testing-strategy.md` 独立完整，不参与瘦身主战场

### 1.2 建议的 canonical owner 列表

| 规则类别 | canonical owner |
|---|---|
| Skill 入口 / 读取规则 | `SKILL.md` |
| 执行步骤顺序 | `execution-flow.md` |
| 波次 / 并发 / 失败重试 | `subagent-architecture.md` |
| 主线程最小上下文 / 并发引用 | `main-thread-contract.md` |
| 证据包结构 | `evidence-pack-spec.md` |
| Agent 输出结构 | `agent-output-schema.md` |
| 统一证据门禁 | `quality-assurance-rules.md` |
| 数据库条件产出规则 | `database-config.md` |
| 端类型 taxonomy | `detection-rules.md` |
| 文档全集与内容侧重点 | `platform-document-mapping.md` |
| 测试回归基线 | `testing-strategy.md` |
| Agent 执行提示（5 份） | 各 `agent-*.md` / `agents-*.md` 文件（轻壳，只保留任务范围/输入/输出/缺口标记） |

## 2. 可统一去重的重复块

这次逐文件检查后，最适合统一下沉的重复块主要有 4 类：

1. 主题文档开头的前言：
   - `当前正式 contract：单一标准模式 runtime-first`
   - `执行提示见 xxx，两者分工不同`

2. 主题文档尾部的 QA 尾注：
   - `通用证据格式、抽样流程、违规判定：见 quality-assurance-rules.md`

3. 主题文档中的语言约束重复句：
   - `默认中文输出，路径/命令/代码标识符保留英文`

4. “docs 不回灌真源”类重复约束：
   - 保留在主合同和主题主文件中一次即可，执行提示文件只保留一句短约束。

这些块可以统一收口，但不能影响各主题正文本身。

## 3. 逐文件审查

### 3.1 `SKILL.md`

- 定位：Skill 入口与读取规则 owner
- 当前长度：88 行
- 判断：**不可压缩为纯索引页**
- 必须保留：
  - 默认模式 `deep`
  - 正式边界
  - 主线程契约索引
  - `Reference` 读取规则表
  - Common Mistakes
- 可删：
  - [SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/SKILL.md#L36) `正式 contract` 段中与下列文件逐字重复的解释句
  - [SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/SKILL.md#L45) `最小执行流` 段中的导航性重复句
- 建议动作：**轻量修剪**
- 风险级别：`HIGH`
- 原因：一旦误删读取规则表，agent 入口导航会实质退化

**当前建议**
- 必保留 [SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/SKILL.md#L57) `Reference 读取规则`
- 仅允许把 [SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/SKILL.md#L47) 中“详细执行流见 ...”后的重复解释压成一句短引用
- 仅允许把 [SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/SKILL.md#L38) 到 [SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/SKILL.md#L43) 中与 `subagent-architecture.md`、`execution-flow.md` 已明确声明的说明句收紧；不得整段删除

### 3.2 `references/execution-flow.md`

- 定位：执行流 owner
- 当前长度：90 行
- 判断：**只做局部去重**
- 必须保留：
  - 总体步骤 `0 -> -1 -> 1 -> 2 -> 3 -> 4`
  - Serena 激活
  - evidence pack 收集
  - runtime/docs 分发
  - 最终写入
  - CLI 最小支撑边界
- 可删：
  - [execution-flow.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/execution-flow.md#L5) `Skill 定义执行流`
  - [execution-flow.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/execution-flow.md#L6) `Skill 负责多 Agent 编排`
  - [execution-flow.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/execution-flow.md#L7) `CLI 只负责最小支撑层`
  - [execution-flow.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/execution-flow.md#L8) `runtime 是机器真源`
- 建议动作：**仅删重复总原则，不动主体步骤**
- 风险级别：`HIGH`

**审查修正**
- 真正建议删除的是其中与 [subagent-architecture.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/subagent-architecture.md#L5) 到 [subagent-architecture.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/subagent-architecture.md#L7) 完全同义的 3 条：多 Agent 编排、CLI 最小支撑、runtime 真源。
- [execution-flow.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/execution-flow.md#L5) `Skill 定义执行流` 是否保留可视编辑效果决定，不属于必须删除项。

### 3.3 `references/subagent-architecture.md`

- 定位：波次、并发、失败重试 owner
- 当前长度：135 行
- 判断：**不可做激进瘦身**
- 必须保留：
  - `总并发上限为 3`
  - Wave 1-5
  - 输入/输出边界
  - 波次前置条件
  - 失败与重试
  - Skill/CLI 交接边界
- 可删：
  - [subagent-architecture.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/subagent-architecture.md#L5) 到 [subagent-architecture.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/subagent-architecture.md#L7) 中与执行流完全重复的总原则句
- 建议动作：**保守去重**
- 风险级别：`HIGH`

**审查修正**
- [subagent-architecture.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/subagent-architecture.md#L9) 并发上限定义绝对保留
- [subagent-architecture.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/subagent-architecture.md#L63) 到 [subagent-architecture.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/subagent-architecture.md#L108) 一律不动

### 3.4 `references/main-thread-contract.md`

- 定位：主线程最小上下文 owner
- 当前长度：50 行
- 判断：**不建议继续压缩**
- 必须保留：
  - Feature / wave / asset 最小保留规则
  - 并发引用指向 `subagent-architecture.md`
  - 重试规则
  - 验收条件
  - 禁止保留长证据正文
- 可删：
  - 几乎无
- 建议动作：**不改或仅字句收紧**
- 风险级别：`MEDIUM`

### 3.5 `references/evidence-pack-spec.md`

- 定位：证据包结构 owner
- 当前长度：76 行
- 判断：**不建议收缩主体**
- 必须保留：
  - 目录结构
  - `shared/summary.json` / `shared/context.json`
  - runtime/docs 可读范围
  - 最小必读层
  - 最小充分性判断
- 可删：
  - 局部重复解释句
- 建议动作：**只做措辞去重**
- 风险级别：`MEDIUM`

### 3.6 `references/agent-output-schema.md`

- 定位：Agent 输出结构 owner
- 当前长度：60 行
- 判断：**无需瘦身**
- 必须保留：
  - 字段定义
  - 状态枚举
  - 失败表达
  - 输出约束
- 可删：
  - 基本无
- 建议动作：**不改**
- 风险级别：`LOW`

### 3.7 `references/quality-assurance-rules.md`

- 定位：统一 QA 门禁 owner
- 当前长度：99 行
- 判断：**只能收口重复，不可弱化**
- 必须保留：
  - 中文输出契约
  - 证据标注格式
  - 抽样验证
  - 最低要求矩阵
  - 主线程消费边界
- 可删：
  - 与专题文档重复的语言说明，不在本文件内处理
- 建议动作：**作为去重汇聚点保留完整**
- 风险级别：`HIGH`

### 3.8 `references/database-config.md`

- 定位：数据库规则 owner
- 当前长度：89 行
- 判断：**应增强 owner 地位，不应缩成摘要**
- 必须保留：
  - 状态语义
  - schema 来源优先级
  - 条件产出
  - 多数据库收口
  - 安全约束
- 可删：
  - 与 `database-conditional-projection.md` 重复的“docs 产出存在性概述”句
- 建议动作：**保留主体，吸收重复语义**
- 风险级别：`HIGH`

### 3.9 `references/database-conditional-projection.md`

- 定位：数据库条件投影说明
- 当前长度：62 行
- 判断：**存在明显可收缩空间**
- 必须保留：
  - 数据库是条件型能力
  - `database-er.md` 的存在条件
  - 简版状态表（3 行）
  - 降级语义的快速说明
- 可删：
  - 完整证据来源列表
  - 完整凭证防护细则
  - 完整质量保障尾注
- 建议动作：**压缩成“概览 + 跳转”文件**
- 风险级别：`MEDIUM`

**审查修正**
- 与 `optimization-plan-doc-shrink-dedup-change-order.md` 对齐：保留简版状态表，不保留完整扩展说明

### 3.10 `references/platform-document-mapping.md`

- 定位：文档全集与内容侧重点 owner
- 当前长度：74 行
- 判断：**保留主题，但禁止承载数据库主规则**
- 必须保留：
  - 正式 docs 全集
  - 主类型 -> 内容侧重点
  - `database-er.md` 适用性概览
- 可删：
  - 与 `database-config.md` 重复的状态细节
- 建议动作：**保留映射，删数据库正文**
- 风险级别：`MEDIUM`

### 3.11 `references/detection-rules.md`

- 定位：端类型 taxonomy owner
- 当前长度：141 行
- 判断：**长，但大多有效，不适合大砍**
- 必须保留：
  - 识别目标
  - 证据优先级
  - 主类型识别
  - 子类型识别
  - mixed / monorepo 边界
  - 识别失败降级
- 可删：
  - 少量重复的“正式 docs 不裁剪”解释句，可移交给 `platform-document-mapping.md`
- 建议动作：**局部措辞去重，不动主体**
- 风险级别：`MEDIUM`

### 3.12 `references/testing-strategy.md`

- 定位：测试回归 owner
- 当前长度：132 行
- 判断：**不在本轮瘦身主战场**
- 必须保留：
  - runtime/docs/CLI/条件产出/治理回归覆盖
  - 触发条件
  - 推荐测试文件
  - 最低断言
- 可删：
  - 基本无
- 建议动作：**不改**
- 风险级别：`LOW`

### 3.13 `references/structure-analysis.md`

- 定位：结构分析主题主文件
- 当前长度：75 行
- 判断：**适合局部模板去重**
- 必须保留：
  - 主题划分
  - 正式输出
  - 证据来源
  - 最低要求
  - 降级策略
- 可删：
  - 前言中的通用 contract 说明
  - 末尾 QA 尾注
- 建议动作：**保留主题正文，收缩头尾模板**
- 风险级别：`MEDIUM`

### 3.14 `references/api-and-dependencies.md`

- 定位：API/依赖主题主文件
- 当前长度：70 行
- 判断：**适合局部模板去重**
- 必须保留：
  - 主题划分
  - 正式输出
  - API 分析要求
  - 外部依赖分析要求
  - 降级策略
- 可删：
  - 前言模板
  - 末尾 QA 尾注
  - 语言默认输出的通用句
- 建议动作：**保留正文，统一头尾**
- 风险级别：`MEDIUM`

### 3.15 `references/conventions-and-setup.md`

- 定位：规范与环境主题主文件
- 当前长度：62 行
- 判断：**适合局部模板去重**
- 必须保留：
  - 主题划分
  - 正式输出
  - 规范分析要求
  - 本地环境分析要求
  - 降级策略
- 可删：
  - 前言模板
  - 末尾 QA 尾注
  - 通用中文输出句
- 建议动作：**保留正文，去模板**
- 风险级别：`MEDIUM`

### 3.16 `references/domain-model-analysis.md`

- 定位：领域模型主题主文件
- 当前长度：66 行
- 判断：**适合局部模板去重**
- 必须保留：
  - 输入来源
  - 正式输出
  - schema 约束
  - 冲突处理
  - 文档产出要求
- 可删：
  - 前言模板
  - 末尾 QA 尾注
  - 通用中文输出句
- 建议动作：**保留正文，去模板**
- 风险级别：`MEDIUM`

### 3.17 `references/agents-code-analysis.md`

- 定位：代码分析执行提示
- 当前长度：28 行
- 判断：**不应继续压**
- 必须保留：
  - 任务范围
  - 输入证据
  - 输出约束
  - 缺口标记
- 可删：
  - 几乎无
- 建议动作：**不改**
- 风险级别：`LOW`

### 3.18 `references/agents-api-deps.md`

- 定位：API/依赖执行提示
- 当前长度：26 行
- 判断：**不应继续压**
- 建议动作：**不改**
- 风险级别：`LOW`

### 3.19 `references/agent-guidelines-setup.md`

- 定位：规范/环境执行提示
- 当前长度：26 行
- 判断：**不应继续压**
- 建议动作：**不改**
- 风险级别：`LOW`

### 3.20 `references/agent-domain-model.md`

- 定位：领域模型执行提示
- 当前长度：26 行
- 判断：**不应继续压**
- 建议动作：**不改**
- 风险级别：`LOW`

### 3.21 `references/agent-database.md`

- 定位：数据库执行提示
- 当前长度：26 行
- 判断：**不应继续压**
- 建议动作：**不改**
- 风险级别：`LOW`

## 4. 最佳执行批次

### Batch A: 只做模板去重

文件：
- `api-and-dependencies.md`
- `conventions-and-setup.md`
- `domain-model-analysis.md`
- `structure-analysis.md`

动作：
- 收缩前言模板
- 收缩 QA 尾注
- 保留主题正文

### Batch B: 收口数据库三件套

文件：
- `database-conditional-projection.md`
- `database-config.md`
- `platform-document-mapping.md`

动作：
- 确立 `database-config.md` 为唯一数据库规则 owner
- 其余两份只保留概览与映射

### Batch C: 主合同轻量去重

文件：
- `SKILL.md`
- `execution-flow.md`
- `subagent-architecture.md`

动作：
- 仅删逐字/强同义重复句
- 不动核心结构

## 5. 不建议现在动的文件

- `main-thread-contract.md`
- `evidence-pack-spec.md`
- `agent-output-schema.md`
- `testing-strategy.md`
- 所有 `agent-*` / `agents-*` 执行提示文件

原因：
- 已经足够短，或承担唯一 contract，不值得再压。

## 6. 最终建议

这次最优方案是：

1. **先动 Batch A**
2. **再做 Batch B**
3. **最后谨慎处理 Batch C**

不要反过来从 `SKILL.md` 和主合同先下手。  
真正的重复主要在主题文档的“头尾模板”，不是在核心 contract 主体里。
