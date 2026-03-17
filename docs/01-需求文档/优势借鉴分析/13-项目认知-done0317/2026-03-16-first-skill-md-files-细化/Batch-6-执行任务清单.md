---
title: First Skill MD 重构 Batch 6 执行任务清单
date: 2026-03-16
author: Codex
status: proposal
version: 1.0
parent: ./实施批次清单.md
---

# First Skill MD 重构 Batch 6 执行任务清单

> Batch 6 目标：将高认知价值的专题型文档正式接入 runtime-first 流程，使它们成为稳定的专题阅读层，而不是旧式旁路分析文档。

---

## 一、范围

Batch 6 覆盖以下 5 个专题型文档：

1. `docs/first/architecture.md`
2. `docs/first/call-graph.md`
3. `docs/first/external-deps.md`
4. `docs/first/local-setup.md`
5. `docs/first/development-guidelines.md`

这些文件不作为最小 canonical assets，但作为高价值专题投影视图，应进入正式生成链。

---

## 二、目标

Batch 6 完成后，文档层面必须达成以下结果：

1. 这 5 个专题文档都具备明确的 runtime 来源。
2. 这 5 个专题文档不再依赖自由生成。
3. `architecture`、`external-deps`、`local-setup`、`development-guidelines` 默认生成。
4. `call-graph` 按条件生成。
5. 专题文档与基础 canonical docs 形成互补，而不是重复。

---

## 三、任务拆解

### T6.1 接入 `architecture.md`

目标：

- 建立架构专题视图

修改点：

1. 明确 runtime 来源：
   - `structure-overview.json`
   - `steering.json`
   - `critical-flows.json`
2. 章节收口为：
   - 系统概览
   - 技术边界
   - 结构边界
   - 关键协作关系
   - 架构风险
3. 明确其与 `steering.md`、`codebase-overview.md` 的分工

完成标准：

- `architecture.md` 默认生成
- 不与基础文档重复堆砌

### T6.2 接入 `call-graph.md`

目标：

- 建立调用链专题视图

修改点：

1. 明确 runtime 来源：
   - `critical-flows.json`
   - `change-map.json`
   - `structure-overview.json`
2. 章节收口为：
   - 入口清单
   - 关键调用链
   - 高风险扩散点
3. 明确条件生成规则：
   - 证据不足时不生成
   - 生成失败可降级为空状态而不阻断整体流程

完成标准：

- `call-graph.md` 被清晰定义为条件生成专题文档

### T6.3 接入 `external-deps.md`

目标：

- 建立外部依赖专题视图

修改点：

1. 明确 runtime 来源：
   - `summary.json`
   - `steering.json`
   - `conventions.json`
2. 章节收口为：
   - 第三方依赖
   - 外部服务
   - 集成边界
   - 风险提示
3. 区分“外部依赖”与“内部依赖”

完成标准：

- `external-deps.md` 默认生成
- 对老项目风险识别有直接价值

### T6.4 接入 `local-setup.md`

目标：

- 建立本地环境与启动专题视图

修改点：

1. 明确 runtime 来源：
   - `entry-guide.json`
   - `conventions.json`
   - `steering.json`
2. 章节收口为：
   - 环境要求
   - 安装步骤
   - 启动步骤
   - 常见问题
3. 强化“新手可直接使用”的要求

完成标准：

- `local-setup.md` 默认生成
- 新手开发者可直接据此起步

### T6.5 接入 `development-guidelines.md`

目标：

- 建立开发规范专题视图

修改点：

1. 明确 runtime 来源：
   - `conventions.json`
2. 章节收口为：
   - 代码规范
   - 测试规范
   - 配置规范
   - 提交流程
3. 与 `conventions.md` 做清晰分工：
   - `conventions.md` 负责总览
   - `development-guidelines.md` 负责专题展开

完成标准：

- `development-guidelines.md` 默认生成
- 与 `conventions.md` 互补而不冲突

### T6.6 建立专题文档一致性规则

目标：

- 确保专题文档与基础文档之间边界稳定

修改点：

1. 定义“总览 vs 专题”的内容边界
2. 明确专题文档不能引入新事实
3. 明确专题文档可以做的仅包括：
   - 结构重组
   - 信息聚合
   - 人类可读表达优化

完成标准：

- 专题文档不再成为旁路真相

---

## 四、删除项清单

Batch 6 中必须显式删除的旧内容包括：

1. 将专题文档视为独立分析真相的旧表述
2. 将专题文档与 Agent 直出绑定的旧语义
3. 不区分默认生成和条件生成的旧描述

---

## 五、输入依赖

Batch 6 执行前应参考以下文档：

1. `2026-03-16-first-runtime-first-global-design.md`
2. `2026-03-16-first-skill-md-files-重构改造清单.md`
3. `2026-03-16-first-skill-md-files-细化/docs-first/architecture.md`
4. `2026-03-16-first-skill-md-files-细化/docs-first/call-graph.md`
5. `2026-03-16-first-skill-md-files-细化/docs-first/external-deps.md`
6. `2026-03-16-first-skill-md-files-细化/docs-first/local-setup.md`
7. `2026-03-16-first-skill-md-files-细化/docs-first/development-guidelines.md`
8. `2026-03-16-first-skill-md-files-细化/Batch-3-执行任务清单.md`

---

## 六、输出结果

Batch 6 应产出：

1. 5 个专题文档的正式投影契约
2. 一份验收记录，至少说明：
   - 每个文档的 runtime 来源
   - 每个文档的生成策略
   - 每个文档与基础 docs 的边界

---

## 七、验收问题

Batch 6 完成后，必须回答：

1. 这 5 个专题文档是否都具备明确 runtime 来源？
2. `call-graph.md` 是否已经明确为条件生成？
3. `architecture.md`、`external-deps.md`、`local-setup.md`、`development-guidelines.md` 是否都已定义为默认生成？
4. 是否还存在专题文档引入新事实的空间？

只要其中任一问题答案是否定，Batch 6 就不算完成。

---

## 八、结论

Batch 6 的本质不是“恢复旧专题文档”，而是：

> **把旧专题文档的认知价值保留下来，同时彻底消除它们作为旁路真相的历史角色。**

完成 Batch 6 后，`first` 将拥有一层可持续维护的专题阅读层，显著增强新手接手老项目时的理解效率。
