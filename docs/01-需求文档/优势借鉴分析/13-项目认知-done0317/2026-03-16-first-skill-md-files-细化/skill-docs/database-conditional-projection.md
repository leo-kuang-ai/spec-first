---
title: database-conditional-projection.md 细化改造说明
---

# database-conditional-projection.md

## 当前角色

数据库分析规范。

## 当前问题

- 仍按旧 D/E 直接生成 ER 文档

## 改造动作

保留重写。

## 新定位

条件型数据库认知能力规范。

## Runtime 来源

`database-schema.json`

## 章节建议

1. 适用性检测
2. schema 抽取来源
3. 关系识别
4. 条件生成规则
5. `database-er.md` 投影规则

## 验收标准

- 仅在条件满足时生成 `database-er.md`
