---
date: 2026-04-01
topic: spec-graph-bootstrap-improvements
---

# spec-graph-bootstrap 改进需求

## Problem Frame

`spec-graph-bootstrap` 已完成实现并可正常执行。一次深度审查发现 6 项改进点：执行契约过于抽象、PRD 自检缺少主动触发语言、Phase 2→3 缺少质量门控、数据库过滤规则无参考 SQL、PRD 模板缺少填充示例、隐式设计模式未沉淀为可复用规范。

这些问题不阻塞执行，但会降低跨 session 执行的一致性，并限制设计模式向其他 workflow 复用。

审查来源：`docs/solutions/logic-errors/spec-graph-bootstrap-deep-review.md`

---

## Requirements

**执行契约（P1）**

- R1. 在 `SKILL.md` §3.2 增加"平台无关 Worker Dispatch Contract"小节，明确编排器向 worker 传递的最小信息集：task id、PRD 路径、文件所有权边界、执行护栏（不改源码、不跑 git）、完成回报格式（produced files + missing evidence）；无文件重叠的 worker 可并行；超过 20 分钟视为失败
- R2. 在 `references/prd-template.md` 的 Acceptance Criteria 之后增加简短 Self-Check 节，使用主动语气（"Before reporting completion, verify..."），覆盖：所有 owned file 已生成且非空、无占位符、引用了真实代码工件、未修改源码、`index.md` 只链接实际存在的文件；如检查失败须先修复再报告

**输出稳定性（P2）**

- R3. 在 `SKILL.md` Phase 2 末尾增加轻量 PRD Quality Gate，阻止上下文不足的 PRD 进入 Phase 3；检查项：Goal 具体且针对本任务、Context 包含来自 Phase 1 的具体项目证据（真实路径/类名/配置值）、Files to Fill 是精确路径而非抽象分类、Technical Notes 包含至少 1 条项目特有约束；未通过时补充 Context 再重跑检查，不引入人工审批环节
- R4. 在 `references/database-prd-template.md` §2.2 补充可选参考 SQL（"Reference SQL — optional"），覆盖后缀/前缀模式过滤和 stale 启发式查询；SQL 仅作参考，不替代现有启发式描述；注明不同 MySQL 版本元数据可用性差异
- R5. 在 `references/prd-template.md` 末尾增加一个精简填充示例（"Example — filled PRD"），示范 Goal、Context、Tools Available、Files to Fill、Technical Notes 五个字段应填充到何种具体程度；示例须来自一次真实 spec-graph-bootstrap 执行记录，不可完全虚构；可脱敏但须保留具体性（真实路径格式、真实类名格式）
- R6. 新建 `docs/02-架构设计/03-agent-workflow-patterns.md`，将以下隐式设计模式提取为显式规范：PRD Task Contract（主控生成合同、worker 只消费合同）、File Ownership Boundary（用输出文件边界替代口头职责边界）、Conditional Generation（检测驱动输出，不生成空模板）、Multi-Level Degradation（工具能力退化链）、Failure Recovery（rerun 时先 backup，成功后删除，失败时选择 restore 或 preserve partial）

---

## Success Criteria

- 同一 skill 在不同 session 运行时，worker dispatch 行为和完成报告格式一致
- worker 在报告完成前主动执行自检，可观察到修复行为
- Phase 3 dispatch 的所有 PRD 均通过 Quality Gate，不存在仅含泛化描述的上下文
- database worker 在 CLI/MCP 两种路径下对备份表过滤采用一致策略
- 新 contributor 通过阅读 PRD 模板示例即可理解"具体"的填写标准
- `03-agent-workflow-patterns.md` 作为可发现的规范文档存在；spec-code-review 等 workflow 可选择引用其中的模式

---

## Scope Boundaries

- 不修改 Phase 1 分析逻辑（Full/Enhanced/Basic 检测流程）
- 不修改 Phase 3 失败恢复逻辑（backup/restore 策略）；R6 对 Failure Recovery 模式的文档化提取不受此限制
- R6 仅提取现有模式，不新增任何 spec-graph-bootstrap 尚未实现的功能

---

## Key Decisions

- **平台无关 Dispatch Contract vs 写死 Agent API**：选择平台无关——spec-graph-bootstrap 同时支持 Claude 和 Codex 入口，写死某个宿主 API 会破坏跨平台能力
- **PRD 自检**：补充主动语气 Self-Check 节，而不是重写现有 Acceptance Criteria——后者内容正确，只缺主动触发语言
- **语言治理**：不引入动态语言识别机制（读取 .developer lang 字段），保持现有行为；复杂性收益比不合理

---

## Dependencies / Assumptions

- `docs/02-架构设计/` 目录已存在或由 R6 任务创建

---

## Outstanding Questions

### Deferred to Planning

- [Affects R4][Technical] PRD Quality Gate 检查失败时最多重试几次？是否需要明确上限？
- [Affects R6][Needs research] `docs/02-架构设计/` 是否已有目录结构约定，需确认编号（01、02、03）是否与现有文件冲突

---

## Next Steps

→ `spec-plan` 进行结构化实施规划
