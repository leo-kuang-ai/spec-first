---
title: agents-api-deps.md 细化改造说明
---

# agents-api-deps.md

## 当前角色

API 与依赖分析规范。

## 当前问题

- 仍按旧 B/C1 产出 `api-docs`、`external-deps`

## 改造动作

保留重写。

## 新定位

API 契约与外部依赖分析规范。

## Runtime 来源

`api-contracts.json` 和 `external-deps.md` 的来源规则。

## 章节建议

1. 接口边界识别
2. 契约抽取字段
3. 外部依赖识别
4. 条件与例外
5. 投影规则

## 验收标准

- `api-docs.md` 只从 `api-contracts.json` 投影
