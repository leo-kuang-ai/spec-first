---
title: execution-flow.md 细化改造说明
---

# execution-flow.md

## 当前角色

描述 `first` 的执行流程。

## 当前问题

- 旧流程仍按 Agent 文档生成组织
- runtime、projection、health 的闭环不够明确

## 改造动作

保留重写。

## 新定位

统一执行主流程文档。

## Runtime 来源

描述 `summary`、`steering`、`conventions`、`change-map` 等资产的生成顺序。

## 章节建议

1. 证据收集
2. 项目识别与 schema 固化
3. 结构化资产生成
4. 条件型资产判定
5. docs projection
6. index / health / refresh
7. context slices 输出

## 验收标准

- 无 quick/deep 分叉
- 无旧 Agent 波次口径
- 明确 projection 不是真源
