---
title: detection-rules.md 细化改造说明
---

# detection-rules.md

## 当前角色

项目类型与端类型识别规则。

## 当前问题

- 规则偏旧
- 未体现 LLM 自动识别 + schema 固化

## 改造动作

保留重写。

## 新定位

项目识别输出规范。

## Runtime 来源

为 `summary.json` 与 `steering.json` 提供识别字段。

## 章节建议

1. 项目主类型
2. 子类型
3. 交互边界
4. 多端混合判定
5. 证据优先级
6. 识别失败降级

## 验收标准

- 能覆盖 backend/admin/h5/app/cli/library/monorepo/mixed
