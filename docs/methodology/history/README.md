# docs/methodology/history

本目录是历史 prompt 快照,**不是 runtime source-of-truth**,可能落后于当前 `skills/`、skill-local prompt assets、`templates/`。与当前运行时行为冲突时,以仓库根目录下的 source-of-truth 为准。

## 两条谱系

按「基线谱系」归类——每个子目录是某个当前基线(在上一级 `docs/methodology/`)的前身,而非任意主题分桶:

| 子目录 | 内容 | 是谁的前身 |
|--------|------|-----------|
| `review-methods/` | 全面项目审查、项目审查、审查 agent/skill/token | `../系统性项目审查方法.md` |
| `role-governance/` | 项目角色、项目owner角色、项目治理、项目治理-agent、自我进化 | `../结构化项目角色契约.md` |

## 旧路径引用说明

这些文件于 2026-06-15 从当时的 `docs/10-prompt/` 顶层迁入 `历史快照/`。2026-10-31 目录统一为 `docs/methodology/history/`，两个子目录分别改为 `review-methods/` 和 `role-governance/`。

冻结历史文档（CHANGELOG、已完成或取代的 dated plans、历史 review/validation）中的旧路径保留当时语境；当前索引与消费者使用新路径。文件级映射见 [命名迁移记录](../../archive/migrations/2026-10-31-docs-naming.md)。

## 复用边界

- 这些是单视角 prompt 快照,可作为 `../系统性项目审查方法.md` 中 fan-out worker 的单路注入内容,但不作为当前 workflow contract。
- 引用其中结论前,须对照当前 `skills/`、`docs/contracts/`、tests 核实。
