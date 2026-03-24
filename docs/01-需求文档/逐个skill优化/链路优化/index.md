# 链路优化文档索引

本目录收纳 `spec-first` 的 ID / Gate / 最小流程 / 收敛方案文档，便于集中阅读和后续迭代。

## 当前主文档

1. [2026-03-24-spec-first-节点化重构PRD.md](./2026-03-24-spec-first-节点化重构PRD.md)

这份 PRD 定义了新的目标态：

- 去掉全流程 ID 关联
- 去掉产物 ID
- 去掉流程之间的 gate
- 去掉 ID 关联矩阵
- 保留 `8+2` 节点流转
- 将职责切分为：
  - `skill` 负责本节点 checklist
  - `orchestrate` 负责跨节点 readiness-check

## 阅读顺序

1. [2026-03-24-spec-first-节点化重构PRD.md](./2026-03-24-spec-first-节点化重构PRD.md)
2. [spec-first-产物ID与Gate关系梳理.md](./spec-first-产物ID与Gate关系梳理.md)
3. [spec-first-最小保留流程图.md](./spec-first-最小保留流程图.md)
4. [2026-03-23-产物ID与Gate收敛方案.md](./2026-03-23-产物ID与Gate收敛方案.md)
5. [2026-03-23-产物ID与Gate收敛详细实施方案.md](./2026-03-23-产物ID与Gate收敛详细实施方案.md)
6. [spec-first-第一批直接迁移实施方案.md](./spec-first-第一批直接迁移实施方案.md)

## 文档说明

- [2026-03-24-spec-first-节点化重构PRD.md](./2026-03-24-spec-first-节点化重构PRD.md)

  新的目标态 PRD，定义“去 ID / 去 gate / 去 matrix，保留 8+2 节点状态机与两层职责分离”的重构方向。

- [spec-first-产物ID与Gate关系梳理.md](./spec-first-产物ID与Gate关系梳理.md)

  梳理产物 ID 体系、ID 之间的关联关系，以及 gate 关系。

- [spec-first-最小保留流程图.md](./spec-first-最小保留流程图.md)

  只保留 `skill` 节点、主交付链、单一 `stage-gate`、缺陷回流和 RFC 豁免的最小流程图。

- [2026-03-23-产物ID与Gate收敛方案.md](./2026-03-23-产物ID与Gate收敛方案.md)

  ID / Gate 收敛方案的目标态定义和实施路径。

- [2026-03-23-产物ID与Gate收敛详细实施方案.md](./2026-03-23-产物ID与Gate收敛详细实施方案.md)

  更细的改造方案，按 Phase 和 Task 拆成可执行步骤。

- [spec-first-第一批直接迁移实施方案.md](./spec-first-第一批直接迁移实施方案.md)

  基于 GSD 的第一批直接迁移内容，输出文件级任务清单和验收命令。

## 当前重点

- 先看 [`2026-03-24-spec-first-节点化重构PRD.md`](./2026-03-24-spec-first-节点化重构PRD.md)，它定义了新的目标态。
- 再看 [`spec-first-产物ID与Gate关系梳理.md`](./spec-first-产物ID与Gate关系梳理.md)，理解当前系统的复杂度来源。
- 再看 [`spec-first-最小保留流程图.md`](./spec-first-最小保留流程图.md)，评估哪些链路仍值得保留。
- 最后参考历史收敛方案和直接迁移方案，决定需要删除还是重写的部分。

## GSD 借鉴材料

- [spec-first-迁移优先级表.md](./spec-first-迁移优先级表.md)

  从 GSD 提炼出的 `spec-first` 迁移优先级表，按 P0-P3 给出落地顺序。

- [spec-first-第一批直接迁移实施方案.md](./spec-first-第一批直接迁移实施方案.md)

  P0 直接迁移的文件级任务清单和验收命令。

- [GSD流程与ID分析及借鉴.md](./GSD流程与ID分析及借鉴.md)

  从 `get-shit-done` 视角梳理主流程、ID 关系、文件真相源，以及可借鉴的设计点。

- [spec-first-迁移清单.md](./spec-first-迁移清单.md)

  从 `get-shit-done` 提炼出的 `spec-first` 可迁移清单，适合作为后续改造参考。
