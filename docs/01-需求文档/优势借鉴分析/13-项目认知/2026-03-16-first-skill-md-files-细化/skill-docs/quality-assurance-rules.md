---
title: quality-assurance-rules.md 细化改造说明
---

# quality-assurance-rules.md

## 当前角色

定义 first 的质量要求。

## 当前问题

- 旧 QA 仍偏 Agent 文档输出
- 缺乏 runtime、projection、LLM 约束分层

## 改造动作

保留重写。

## 新定位

runtime-first 统一质量规范。

## Runtime 来源

覆盖全部正式资产与投影视图。

## 章节建议

1. 真源质量
2. 识别质量
3. 归纳质量
4. 投影一致性
5. 条件型资产质量
6. Gate 规则

## 验收标准

- 明确 orphan / projection / ghost / roundtrip / consumption gates
