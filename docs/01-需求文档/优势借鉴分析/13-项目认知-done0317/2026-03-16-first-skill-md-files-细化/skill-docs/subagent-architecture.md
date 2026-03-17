---
title: subagent-architecture.md 细化改造说明
---

# subagent-architecture.md

## 当前角色

描述内部并发和任务分工。

## 当前问题

- 仍以 Agent A/B/C 对应 markdown 产物
- 无法体现脚本与 LLM 的新分工

## 改造动作

保留重写。

## 新定位

资产生成任务编排文档。

## Runtime 来源

描述各 runtime 资产由哪类任务生成。

## 章节建议

1. 脚本抽取任务
2. LLM 识别任务
3. LLM 受约束归纳任务
4. 投影任务
5. 校验任务
6. 并发与失败降级

## 验收标准

- 任务单位从“文档”改为“资产”
- 明确脚本/LLM 边界
