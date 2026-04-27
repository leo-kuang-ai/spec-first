---
spec_id: changelog-iron-law
title: Changelog 铁律
source: extracted
confirmation_status: inferred
lifecycle_status: active
level: L2
scope:
  - repo
  - governance
priority: 90
severity: high
confidence: high
status: active
---

# Changelog 铁律

## Agent 摘要

- 每次源码变更都必须在 CHANGELOG.md 中有对应记录。
- CHANGELOG 格式受机器测试约束，偏离格式的条目会导致 `tests/unit/changelog-format.test.js` 失败。
- 作者身份必须来自宿主的 developer profile 文件，不可随意填写。
- 用户可见变更须显式标注。

## 规则

### RULE-CHANGELOG-001 每次代码变更须有 CHANGELOG 记录

- 状态: inferred
- 范围: repo/governance
- 严重性: high
- 规则: 对项目源码的任何新增、删除或修改，必须在同一次提交或 PR 中附上 CHANGELOG.md 条目，缺少此记录的代码变动一律拒绝合入。
- 验证方式: 合入前确认 CHANGELOG.md 包含对应条目。

### RULE-CHANGELOG-002 使用规范的 CHANGELOG 格式

- 状态: inferred
- 范围: repo/governance
- 严重性: high
- 规则: 每条记录必须遵循格式 `- vX.Y.Z YYYY-MM-DD HH:MM:SS 作者: 变更摘要`，日期时间必须为 `YYYY-MM-DD HH:MM:SS`。
- 验证方式: `tests/unit/changelog-format.test.js` 验证格式头部说明是否完整。

### RULE-CHANGELOG-003 作者须来自宿主 developer profile

- 状态: inferred
- 范围: repo/governance
- 严重性: medium
- 规则: 作者字段必须使用项目级 developer profile 文件中的值；若 profile 缺失，须先运行对应宿主的 `spec-first init` 命令（带 user 和 lang 参数）。
- 验证方式: 确认作者与宿主 profile 文件匹配。

### RULE-CHANGELOG-004 用户可见变更须标注

- 状态: inferred
- 范围: repo/governance
- 严重性: low
- 规则: 影响用户可见行为、命令面或输出格式的变更，必须在 CHANGELOG 条目末尾追加 `(user-visible)`。
- 验证方式: 对照用户可见变更类型（命令、输出格式、安装行为、workflow 输入）检查条目。
