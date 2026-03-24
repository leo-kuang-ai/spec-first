# 00-first 总体执行策略

> 目标：把 `first` 定义成项目的上下文初始化器与索引分发中心，而不是一次性分析终点。

## 1. 总目标

`first` 的职责不是一次性讲完所有事实，而是为后续 skill 建立一个稳定、可消费、可刷新、可审计的上下文底座。

它要解决四件事：

1. 什么时候执行 `first`
2. 执行时读哪些 references
3. 生成后 AI 怎么用
4. 什么时候需要重新执行

## 2. 什么时候执行 first

### 2.1 必须执行

- 新仓库首次接入
- `.spec-first` 缺失或不完整
- runtime 真源缺失、过期或损坏
- docs 产物缺失，无法建立后续 skill 的输入边界
- 大范围重构后，原上下文不再可信
- 切换到新的 Feature，但没有可用的上下文索引
- 长时间中断后恢复工作，且当前认知已明显过期

### 2.2 不应该执行

- 当前 runtime 真源完整
- docs 与 runtime 同步正常
- 只是继续同一个 Feature 的后续阶段
- 只需要恢复上下文，不需要重建上下文

这类场景应优先用 `catchup`，不是重跑 `first`。

### 2.3 判断原则

如果你回答下面任一问题时没有可靠答案，就该执行 `first`：

- 这个项目是什么类型？
- 当前 Feature 是什么？
- 哪些文档是主干？
- 哪些文档已经弃用？
- runtime 真源在哪里？
- 后续 skill 应该读什么？

## 3. 执行时读哪些 references

`first` 不应把所有 reference 一股脑读完，而应按“最小必读层 -> 主题层 -> 条件层”逐层加载。

### 3.1 最小必读层

执行 `first` 时,最少要读:

- `execution-and-agent-architecture.md`
- `main-thread-and-evidence-contract.md`
- `quality-assurance-rules.md`

这层定义:
- 主线程怎么跑
- Agent 怎么分工
- 证据包怎么传
- 输出怎么长
- 质量边界是什么

### 3.2 主题层

根据项目类型和本轮 wave,再读对应主题:

- `code-structure-analysis.md`
- `api-and-dependencies-analysis.md`
- `conventions-and-setup-analysis.md`
- `domain-model-analysis.md`
- `database-analysis.md`
- `testing-strategy.md`
- `detection-rules.md`
- `platform-document-mapping.md`

### 3.3 条件层

只在条件满足时读取：

- 数据库相关文档：仅当 `databaseSchema.status === healthy` 或正在判定数据库能力时加载
- 条件型文档：仅当 runtime 判定成立时才产出或读取
- 低频映射文档：仅在补充映射时加载

### 3.4 读取顺序原则

```text
SKILL / Registry
  -> 主线程契约
  -> 证据包
  -> 主题层 references
  -> 条件层 references
  -> 产出 runtime truth / docs outputs
```

原则：
- 先读规则，再读内容
- 先读主干，再读主题
- 先读 active，再读 deprecated
- 不把旧文件直接当正式真源

## 4. 生成后 AI 怎么用

`first` 的输出不是终点，而是后续 skill 的输入索引。

### 4.1 输出应包含什么

至少包含两类东西：

#### A. 文档索引
- 哪些文档是 active
- 哪些文档已 deprecated
- 哪些文档是主干
- 哪些文档是条件型
- 哪些文档属于哪个层级

#### B. 证据摘要
- 当前项目类型
- 当前 Feature
- runtime 真源状态
- docs 产物状态
- 关键缺口
- 待确认项

### 4.2 后续 AI 的消费方式

后续 skill 不应：
- 自己重新猜文档主次
- 自己扫描全目录决定该读什么
- 把 `first` 的索引当成事实本身

而应：
1. 读取 `first` 的索引
2. 根据索引挑选当前任务相关文档
3. 再结合 runtime 真源和已确认 docs 做本技能分析

### 4.3 正确消费链路

```text
first 产出 index / registry / runtime 摘要
  -> 后续 skill 读取 index
  -> 依据 active 文档加载上下文
  -> 再执行具体分析 / 设计 / 任务拆解 / 实现 / 验证
```

### 4.4 收益

- 降低上下文噪音
- 避免读错旧文档
- 避免各 skill 认知不一致
- 提升 spec / design / task / code / verify 的衔接质量

## 5. 什么时候需要重新执行

### 5.1 必须重新执行

- `.spec-first` 结构变化
- registry / index 变化
- runtime 真源重新生成或大面积失效
- docs 主干文档重构
- 主题文档合并、删除、弃用
- 项目结构发生显著变化
- Feature 切换到新上下文块
- 上下文过期到无法可靠继续

### 5.2 应该部分刷新

- 只改了少量 docs
- 只新增了一个主题文档
- 只做了某个 skill 节点的局部优化
- 只是补充了一条索引记录
- 仅有 runtime 某个资产更新，但主结构不变

### 5.3 刷新分级

#### Full Refresh

适用：
- 目录结构变化
- 主题文档大重构
- runtime/docs 双侧都变了

行为：
- 重新执行 `first`
- 重建索引
- 重建证据包
- 重新生成上下文摘要

#### Partial Refresh

适用：
- 只改了部分主题文档
- 只新增/弃用少量文档
- 只需更新 registry

行为：
- 更新索引
- 局部补充证据
- 不重建全部上下文

#### No Refresh

适用：
- 继续同一任务链
- 上下文仍可信
- 只是在同一 Feature 内推进后续阶段

行为：
- 直接进入对应 skill
- 读取现有索引和证据包

## 6. 最终策略图

```text
[输入决策]
  当前上下文是否可信？
    ├─ 否 -> 执行 first
    └─ 是 -> 进入 catchup / 后续 skill

[first 执行]
  读取最小必读层
  -> 读取主题层
  -> 读取条件层
  -> 生成 registry / index / evidence summary

[输出消费]
  后续 skill 读取 registry / index
  -> 选择 active 文档
  -> 结合 runtime truth 分析 / 设计 / 实现 / 验证

[刷新策略]
  目录或契约大改 -> Full Refresh
  局部文档更新 -> Partial Refresh
  上下文仍可信 -> No Refresh
```

## 7. 最终判断

`first` 负责建立“谁是上下文入口、谁是正式真源、谁该被后续 skill 消费”的稳定契约。  
后续 skill 不再自造认知体系，而是消费 `first` 给出的索引和证据边界。
