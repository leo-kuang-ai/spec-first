# 2026-03-20 First Subagent Review Bundle

这个目录只承载本次 `first` 主线程上下文收缩的设计与实施说明。

## 核心文档

- [设计文档](./2026-03-20-first-main-thread-context-reduction-design.md)
- [实施计划](./2026-03-20-first-main-thread-context-reduction-implementation-plan.md)

## Canonical Contracts

运行时合同不放在 review bundle 中,而是放在 skill 的 canonical references 里:

- [main-thread-and-evidence-contract](../../../skills/spec-first/00-first/references/main-thread-and-evidence-contract.md)
- [execution-and-agent-architecture](../../../skills/spec-first/00-first/references/execution-and-agent-architecture.md)

## 范围说明

- review bundle 只用于评审、对齐和实施记录
- runtime contract 以 `skills/spec-first/00-first/references/` 为 canonical source
- 低频补充文档不在本轮热路径压缩范围内
