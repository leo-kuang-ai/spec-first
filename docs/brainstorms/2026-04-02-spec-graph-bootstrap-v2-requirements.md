---
date: 2026-04-02
topic: spec-graph-bootstrap-v2
---

# spec-graph-bootstrap v2 需求

## Problem Frame

`spec-graph-bootstrap v1` 能生成理解类上下文（summary、architecture、pitfalls、layers、database），但不包含研发质量资产：没有独立的规则层（什么不能写错）、没有独立的模式层（最该抄什么）、没有决策层（为什么这样做）。缺少这些资产导致后续节点无法直接定位"什么不能写错"和"最该抄什么"，被迫从零推断，原创比例居高不下，同时面临低一致性和易踩规则坑的问题。

v2 的目标是重写 `SKILL.md`，在不向下兼容 v1 的前提下，将 Stage-0 升级为能稳定生产研发质量资产的工具。

---

## Requirements

**资产族（新增固定产物）**

- R1. 固定产物新增 `rules/`：至少包含 `index.md`、`coding-rules.md`、`integration-rules.md`
- R2. 固定产物新增 `patterns/`：至少包含 `index.md`、`review-hotspots.md`
- R3. 固定产物新增 `decisions/`：至少包含 `index.md`、`key-decisions.md`
- R4. v1 条件产物（`layers/`、`database/`、`guides/`）保留，激活信号和文件 ownership 不变

**执行模型**

- R5. 采用两阶段模型：Phase 1（全局分析 + PRD 生成）→ Phase 2（并行生产 + Assembly）
- R6. Phase 1 产出 `phase1-snapshot.md`（字段：Project Snapshot、Rule Candidates、Pattern Candidates、Decision Candidates、Risk Candidates、Activated Workers）；不写 `docs/contexts/` 下的任何文件
- R7. Phase 1 结束后 orchestrator 为每个激活的 worker 生成 PRD 合同（6 字段：Goal、Files、Candidate Signals、Required Evidence、Task Entry Expectations、Confidence Policy）

**Worker 模型**

- R8. 6 个固定 worker，各自独占写入：`summary-context`→`00-summary.md`、`architecture-context`→`architecture/*.md`、`rules-context`→`rules/*.md`、`patterns-context`→`patterns/*.md`、`decisions-context`→`decisions/*.md`、`pitfalls-context`→`pitfalls/*.md`
- R9. 条件 worker 激活信号和独占文件如下（与 v1 保持一致）：

  | 触发信号 | Worker | 独占文件 |
  |---------|--------|---------|
  | 前端框架（React/Vue 等） | `frontend-context` | `layers/frontend/index.md` |
  | 服务端框架（Express/Django 等） | `backend-context` | `layers/backend/index.md` |
  | Android/iOS/RN/Flutter | `mobile-context` | `layers/mobile/index.md` |
  | Electron/Tauri | `desktop-context` | `layers/desktop/index.md` |
  | bin 字段 / cobra/click 等 | `cli-context` | `layers/cli/index.md` |
  | 跨层共享目录 | `shared-context` | `layers/shared/index.md` |
  | Prisma/dbt/Airflow 等 | `data-context` | `layers/data/index.md` |
  | MySQL 可连接 / schema 文件存在 | `database-context` | `database/database-er.md`、`database/write-sensitive-areas.md` |
  | 激活层数 ≥ 3 | `guides-context` | `guides/index.md` |

- R10. 每个 worker 只读自己的 PRD，只写 PRD `Files` 声明的文件；禁止修改源码、禁止执行 git 命令

**文档质量**

- R11. `rules/`、`patterns/`、`decisions/` 下的所有文档须有 `When To Read` 章节（遇到什么任务先看我）
- R12. 高价值结论标注 `Verified / Inferred / Unknown`；禁止无路径证据的强事实陈述
- R13. 规则文档区分 `Must / Should / Avoid`；模式文档说明可替换部分和不变部分
- R14. 文档末尾写 `Generated At` 和 `Potentially Stale Areas`；禁止占位符（`[TODO]`、`TBD`、`[待补充]`）

**Assembly 与 Rerun**

- R15. Assembly 执行 3 项检查：完整性（PRD Files 中声明的文件是否全部存在）、无占位符、核心文档有 `When To Read`（检查 rules/index.md、patterns/index.md、decisions/index.md、rules/coding-rules.md、patterns/review-hotspots.md、decisions/key-decisions.md）
- R16. `README.md` 无论 assembly 结果如何都写；有失败项时在 README 中标注 `⚠ 未生成`，并写 `assembly-report.md`
- R17. Rerun 前全量备份到 `.context/spec-first/bootstrap/backup/<timestamp>/`；单个 worker 失败时从 backup 恢复该 worker 对应文件（恢复时以对应 worker 的 PRD Files 字段作为文件映射来源）；全量失败时全量恢复

**SKILL.md 交付**

- R18. 按 Phase A 范围全量重写 `SKILL.md` 为 v2 设计（不扩展 v1，不保留 v1 逻辑）；`references/prd-template.md` 更新为 v2 5 字段 PRD 格式

---

## Success Criteria

- `rules/coding-rules.md` 包含 ≥ 3 条有文件路径证据的硬性规则，无框架常识
- `patterns/review-hotspots.md` 包含 ≥ 3 个有参考实现路径的模式
- `decisions/key-decisions.md` 包含 ≥ 2 个有"为什么"说明的决策
- 所有固定文档有 `When To Read` 章节（rules/patterns/decisions 的 index.md 和核心文档）
- Assembly 3 项检查无失败项（无占位符告警）
- Phase 1 候选信号达到最低门槛：Rule Candidates ≥ 3 条、Pattern Candidates ≥ 2 条、Decision Candidates ≥ 1 条

---

## Scope Boundaries

- Phase A 只交付固定产物的新增（rules/、patterns/、decisions/）；专题化 patterns（screen-flow、api-integration 等）延后到 v2.1
- 条件 rules（domain-constraints、testing-rules、data-rules）延后到 v2.1
- v1 改进清单（R1-R6，2026-04-01 brainstorm）被 v2 新设计取代，不单独实施
- 不保留向下兼容；现有 v1 context 目录在 rerun 时备份后全量重新生成

---

## Key Decisions

- **SKILL.md 策略 → 重写**：不扩展现有 SKILL.md，也不并存 v1/v2 两个 skill；直接重写为 v2
- **向下兼容 → 放弃**：v2 不处理 v1 遗留格式，rerun 时直接覆盖（有备份保护）
- **v1 改进清单 → 取代**：v2 PRD 合同、assembly 检查、worker 边界已覆盖 R1-R6 意图，不单独实施

---

## Outstanding Questions

### Deferred to Planning

- [Affects R5][Technical] Phase 1 分析模式如何处理：v1 有 Full/Enhanced/Basic 三档（GitNexus + ABCoder / Serena / 纯文本）；v2 精简方案建议二档（ABCoder / Grep+Read）；规划时确认是否保留 Serena MCP 支持。⚠ **规划阻断依赖**：分析模式直接决定 Candidate Signals 质量，规划期 P0 优先解决
- [Affects R8][Technical] 固定 worker 的 dispatch 机制：v1 使用 Codex agent 或 Claude subagent 并行；v2 是否沿用同一机制？
- [Affects R18][Technical] `references/` 目录中 `database-prd-template.md` 是否保留？v2 中 database worker 的 PRD 是否仍需独立模板？

---

## Next Steps

→ `spec-plan` 进行结构化实施规划
