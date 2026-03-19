# Project Constitution

## Meta
- Version: 1.1.0
- Ratified: 2026-02-26
- Last Amended: 2026-03-05

## Clause P1 - 简洁至上（KISS）
- 方案与实现必须优先选择最简单、可维护的路径。
- 禁止过度工程化与不必要的防御性设计。
- 任何新增复杂度必须给出明确收益与替代方案对比。

## Clause P2 - 事实为本
- 结论必须基于可验证事实（代码、测试、日志、文档、命令输出）。
- 发现谬误时必须直接纠正，不得回避或粉饰。
- 争议以证据优先，避免主观推断驱动决策。

## Clause P3 - 输出语言与表达
- 默认输出语言为简体中文，除非用户明确要求其他语言。
- Thought、Implementation Plan、Task List 必须使用简体中文。
- 技术标识（如 API、CLI、文件路径、类型名）可保留英文原文。

## Clause P4 - 强制工作流
- 编码前必须完成：构思方案 -> 请求审核 -> 拆解任务 -> 逐项实现与自检。
- 必须在前期调研中澄清疑点，不得“带假设开工”。
- 任一前置环节未完成，不得进入实现阶段。

## Clause P5 - 代码变动铁律
- 任何源码新增/删除/修改后，必须执行强制自检并确认与需求对齐。
- 自检至少覆盖：需求对照、影响范围、关键测试（或等效验证）。
- 未完成自检，不得宣称“已完成”或“已修复”。

## Clause P6 - 变更记录与提交一致性
- 任何源码新增/删除/修改，必须同步在根目录 CHANGELOG.md 增加记录。
- 记录格式遵循仓库现行格式：`- vX.Y.Z YYYY-MM-DD 作者: 一句话摘要`，用户可见变更追加 `(user-visible)`。
- 每次代码提交应将 CLAUDE.md 一并纳入提交范围，确保协作规范与代码演进同步。

## Engineering Baseline
- Runtime: Node.js 20+
- Language: TypeScript ESM
- Quality: Unit test coverage >= 80%
- Merge Gate: no P0/P1 review findings before merge
- Process: API contract before implementation
- Traceability: TASK and PR must be traceable

## Amendment History

| Version | Date | Summary |
|---------|------|---------|
| 1.0.0 | 2026-02-26 | Add semantic constitution metadata for C11 |
| 1.1.0 | 2026-03-05 | Add KISS/fact-based workflow, Chinese output, mandatory self-check and changelog/CLAUDE submission rules |
