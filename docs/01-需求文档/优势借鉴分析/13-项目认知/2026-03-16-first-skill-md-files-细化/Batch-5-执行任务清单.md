---
title: First Skill MD 重构 Batch 5 执行任务清单
date: 2026-03-16
author: Codex
status: proposal
version: 1.0
parent: ./实施批次清单.md
---

# First Skill MD 重构 Batch 5 执行任务清单

> Batch 5 目标：将 `tech-stack.md`、`api-docs.md`、`codebase-overview.md`、`domain-model.md` 收口为 runtime-first 体系中的剩余基础 canonical 投影视图。

---

## 一、范围

Batch 5 覆盖以下 4 个文件：

1. `docs/first/tech-stack.md`
2. `docs/first/api-docs.md`
3. `docs/first/codebase-overview.md`
4. `docs/first/domain-model.md`

这 4 个文件已经在终态方案中定义为基础 canonical docs，本批次负责把它们的投影契约、章节边界和运行时来源统一收口。

---

## 二、目标

Batch 5 完成后，文档层面必须达成以下结果：

1. 这 4 个文件不再具有遗留文档语义。
2. 这 4 个文件都具备明确 runtime 来源。
3. 这 4 个文件都正式进入 `first` 的认知资产体系。
4. 基础 canonical docs 的正式全集在实施层完整闭合。
5. 下游 skill 可稳定引用这些文档对应的 runtime truth。

---

## 三、任务拆解

### T5.1 收口 `tech-stack.md`

目标：

- 把技术栈文档收口为正式基础视图中的技术栈专题页

修改点：

1. 明确仅从 `steering.json` 投影
2. 章节收口为：
   - 语言与框架
   - 构建与测试
   - 核心技术组件
   - 技术约束
3. 删除任何“手工分析/旧 Agent 输出”的表述

完成标准：

- `tech-stack.md` 成为 `steering` 的正式专题视图

### T5.2 收口 `api-docs.md`

目标：

- 把 API 文档收口为正式契约视图

修改点：

1. 明确仅从 `api-contracts.json` 投影
2. 章节收口为：
   - 接口边界
   - 路由或入口
   - 参数与返回
   - handler / source
   - 外部边界
3. 明确它是人类可读视图，不是真源

完成标准：

- `api-docs.md` 正式进入 code/review/verify 消费链

### T5.3 收口 `codebase-overview.md`

目标：

- 把代码库概览收口为正式结构视图

修改点：

1. 明确仅从 `structure-overview.json` 投影
2. 章节收口为：
   - 模块划分
   - 关键目录
   - 入口关系
   - 阅读顺序
   - 改动导航入口
3. 删除“Quick 模式直接生成”的语义

完成标准：

- `codebase-overview.md` 成为结构认知正式视图

### T5.4 收口 `domain-model.md`

目标：

- 把领域模型文档收口为正式高语义视图

修改点：

1. 明确仅从 `domain-model.json` 投影
2. 章节收口为：
   - 核心实体
   - 概念边界
   - 关系
   - 关键业务对象
   - 风险与歧义点
3. 明确它是受约束归纳后的投影，而不是自由总结

完成标准：

- `domain-model.md` 正式进入 design/code/review/verify 消费链

### T5.5 清除迁移期遗留语义

目标：

- 清除这 4 个文件在文档体系中的迁移期遗留定位

修改点：

1. 在 `README.md` 中不再将其标记为 legacy
2. 在相关 references / mapping 中不再特殊处理
3. 在文档说明中统一改为专题正式视图

完成标准：

- 系统中不再把这 4 个文件描述为 legacy docs

---

## 四、删除项清单

Batch 5 中必须显式删除的旧内容包括：

1. `tech-stack/api-docs/codebase-overview/domain-model` 的历史遗留标记
2. 它们来自旧 Agent 直出文档的历史表述
3. `codebase-overview` 的 quick 直出语义

---

## 五、输入依赖

Batch 5 执行前应参考以下文档：

1. `2026-03-16-first-runtime-first-global-design.md`
2. `2026-03-16-first-skill-md-files-重构改造清单.md`
3. `2026-03-16-first-skill-md-files-细化/docs-first/tech-stack.md`
4. `2026-03-16-first-skill-md-files-细化/docs-first/api-docs.md`
5. `2026-03-16-first-skill-md-files-细化/docs-first/codebase-overview.md`
6. `2026-03-16-first-skill-md-files-细化/docs-first/domain-model.md`

---

## 六、输出结果

Batch 5 应产出：

1. 4 个基础 canonical docs 的正式投影契约
2. 一份验收记录，至少说明：
   - 每个文档的新 runtime 来源
   - 每个文档的历史遗留语义是否已清除
   - 每个文档是否已进入正式认知资产体系

---

## 七、验收问题

Batch 5 完成后，必须回答：

1. 这 4 个文档是否都具备明确 runtime 来源？
2. 它们是否都已经不再被描述为历史遗留文档？
3. `codebase-overview.md` 是否彻底移除了 quick 直出语义？
4. `api-docs.md` 与 `domain-model.md` 是否都已经明确依赖正式真源？

只要其中任一问题答案是否定，Batch 5 就不算完成。

---

## 八、结论

Batch 5 的本质不是“保留 4 个旧文档”，而是：

> **把剩余 4 个基础 canonical docs 收口到 runtime-first 正式体系中，使基础文档全集、投影契约和下游消费链完整闭合。**
