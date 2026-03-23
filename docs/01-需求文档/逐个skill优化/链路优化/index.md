# 链路优化文档索引

本目录收纳 `spec-first` 的 ID / Gate / 最小流程 / 收敛方案文档，便于集中阅读和后续迭代。

## 阅读顺序

1. [spec-first-第一批直接迁移实施方案.md](./spec-first-第一批直接迁移实施方案.md)
2. [spec-first-产物ID与Gate关系梳理.md](./spec-first-产物ID与Gate关系梳理.md)
3. [spec-first-最小保留流程图.md](./spec-first-最小保留流程图.md)
4. [2026-03-23-产物ID与Gate收敛方案.md](./2026-03-23-产物ID与Gate收敛方案.md)
5. [2026-03-23-产物ID与Gate收敛详细实施方案.md](./2026-03-23-产物ID与Gate收敛详细实施方案.md)

## 文档说明

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

- 如果你要开始直接迁移，先看 [`spec-first-第一批直接迁移实施方案.md`](./spec-first-第一批直接迁移实施方案.md)。
- 先看 [`spec-first-产物ID与Gate关系梳理.md`](./spec-first-产物ID与Gate关系梳理.md)，它是后续优化链路的事实总图。
- 再看 [`spec-first-最小保留流程图.md`](./spec-first-最小保留流程图.md)，它定义了最小保留边界。
- 最后看两份收敛方案，了解已完成的改造路径和兼容策略。

## GSD 借鉴材料

- [spec-first-迁移优先级表.md](./spec-first-迁移优先级表.md)

  从 GSD 提炼出的 `spec-first` 迁移优先级表，按 P0-P3 给出落地顺序。

- [spec-first-第一批直接迁移实施方案.md](./spec-first-第一批直接迁移实施方案.md)

  P0 直接迁移的文件级任务清单和验收命令。

- [GSD流程与ID分析及借鉴.md](./GSD流程与ID分析及借鉴.md)

  从 `get-shit-done` 视角梳理主流程、ID 关系、文件真相源，以及可借鉴的设计点。

- [spec-first-迁移清单.md](./spec-first-迁移清单.md)

  从 `get-shit-done` 提炼出的 `spec-first` 可迁移清单，适合作为后续改造参考。
