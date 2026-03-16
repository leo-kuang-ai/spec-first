---
title: database-config.md 细化改造说明
---

# database-config.md

## 当前角色

数据库分析相关配置说明。

## 当前问题

- 旧定位偏数据库直连或旧 Agent 逻辑

## 改造动作

保留重写。

## 新定位

条件型数据库能力规范。

## Runtime 来源

服务 `database-schema.json` / `database-er.md`。

## 章节建议

1. 数据库适用性判定
2. 支持的 schema 来源
3. 抽取优先级
4. 不适用场景
5. 条件生成规则

## 验收标准

- 明确哪些项目不生成 `database-er.md`
