# spec-first skill 文档索引

本目录收纳 `spec-first` 的 skill 全局梳理、节点深挖、以及逐个 skill 优化的基础材料。

链路优化相关的文档已单独移动到 [`../链路优化/`](../链路优化/index.md)。

## 阅读顺序

1. [spec-first-技能全局梳理.md](./spec-first-技能全局梳理.md)
2. [spec-first-节点五栏拆解.md](./spec-first-节点五栏拆解.md)
3. [spec-first-00-first-深挖问题修改验证.md](./spec-first-00-first-深挖问题修改验证.md)
4. [spec-first-03-04-06-07-12-深挖问题修改验证.md](./spec-first-03-04-06-07-12-深挖问题修改验证.md)
5. [spec-first-产物ID与Gate关系梳理.md](../链路优化/spec-first-产物ID与Gate关系梳理.md)
6. [spec-first-最小保留流程图.md](../链路优化/spec-first-最小保留流程图.md)
7. [2026-03-23-id-gate-convergence-plan.md](../链路优化/2026-03-23-id-gate-convergence-plan.md)
8. [2026-03-23-id-gate-convergence-detailed-implementation-plan.md](../链路优化/2026-03-23-id-gate-convergence-detailed-implementation-plan.md)

## 文档说明

### 全局梳理

- [spec-first-技能全局梳理.md](./spec-first-技能全局梳理.md)

  从全局视角梳理 skill 节点、产物、gate、卡点、过程产物关联，以及后续优化方向。

### 节点拆解

- [spec-first-节点五栏拆解.md](./spec-first-节点五栏拆解.md)

  把每个节点拆成 `输入 / 输出 / gate / 卡点 / 优化项` 五栏。

- [spec-first-00-first-深挖问题修改验证.md](./spec-first-00-first-深挖问题修改验证.md)

  深挖 `00-first` 的入口边界、真源层、投影层、校验层、增量更新层和背景状态。

- [spec-first-03-04-06-07-12-深挖问题修改验证.md](./spec-first-03-04-06-07-12-深挖问题修改验证.md)

  深挖 `03-spec`、`04-design`、`06-task`、`07-code`、`12-verify` 五个节点。

### 产物与 Gate

- [spec-first-产物ID与Gate关系梳理.md](../链路优化/spec-first-产物ID与Gate关系梳理.md)

  深度梳理文档产物的 ID 体系、ID 之间的关联关系、以及 gate 关系。

- [spec-first-最小保留流程图.md](../链路优化/spec-first-最小保留流程图.md)

  只保留 `skill` 节点、主交付链、单一 `stage-gate`、缺陷回流和 RFC 豁免的最小流程图。

### 收敛方案

- [2026-03-23-id-gate-convergence-plan.md](../链路优化/2026-03-23-id-gate-convergence-plan.md)

  ID / Gate 收敛方案的目标态定义和实施路径。

- [2026-03-23-id-gate-convergence-detailed-implementation-plan.md](../链路优化/2026-03-23-id-gate-convergence-detailed-implementation-plan.md)

  更细的改造方案，按 Phase 和 Task 拆成可执行步骤。

## 当前重点

如果你是为了后续逐个优化 skill 节点，优先看这三份：

1. [spec-first-技能全局梳理.md](./spec-first-技能全局梳理.md)
2. [spec-first-节点五栏拆解.md](./spec-first-节点五栏拆解.md)
3. [spec-first-产物ID与Gate关系梳理.md](../链路优化/spec-first-产物ID与Gate关系梳理.md)

## 状态标记

### 已完成

- [spec-first-技能全局梳理.md](./spec-first-技能全局梳理.md)
- [spec-first-节点五栏拆解.md](./spec-first-节点五栏拆解.md)
- [spec-first-00-first-深挖问题修改验证.md](./spec-first-00-first-深挖问题修改验证.md)
- [spec-first-03-04-06-07-12-深挖问题修改验证.md](./spec-first-03-04-06-07-12-深挖问题修改验证.md)
- [spec-first-产物ID与Gate关系梳理.md](../链路优化/spec-first-产物ID与Gate关系梳理.md)
- [spec-first-最小保留流程图.md](../链路优化/spec-first-最小保留流程图.md)
- [2026-03-23-id-gate-convergence-plan.md](../链路优化/2026-03-23-id-gate-convergence-plan.md)
- [2026-03-23-id-gate-convergence-detailed-implementation-plan.md](../链路优化/2026-03-23-id-gate-convergence-detailed-implementation-plan.md)

### 收敛方案

- 这两份文档已归入“已完成”状态，作为收敛方案的历史入口保留在上方列表。

### 代码落地进度

- Phase 0: 已完成，回归基线已建立。
- Phase 1: 已完成，gate taxonomy / gate 输出口径已收敛。
- Phase 2: 已完成，ID taxonomy 已共享化。
- Phase 3: 已完成主链路收敛，关系图 helper 已落地，defect 回流校验已闭合。
- Phase 4: 已完成消费端表述对齐。
- Phase 5: 进行中，文档术语统一与收尾回归继续推进。

### 待补关注点

- `TaskNode` 相关关系展示仍以窄结构为主，补充链路只在视图层展开。
- `skills/spec-first` 的术语统一按需分批替换，避免机械全量改写。
