# Spec-First 流程节点 Skill 化需求文档 v1.0

> 版本: v1.0  
> 日期: 2026-02-09  
> 状态: Draft  
> 范围: 将当前“流程调度+校验”CLI 补齐为“可执行的阶段能力”

---

## 1. 背景与问题定义

当前实现的能力重心是流程调度与校验：

1. 已有: 阶段状态机、ID 生成校验、矩阵校验、覆盖率计算、RFC/缺陷状态管理。  
2. 缺失: 各阶段产出物的生成与填充能力（spec/design/tasks/tests/release 等）。  
3. 关键阻塞: Gate `auto` 条件 resolver 未正确接入，导致 Gate 自动评估不可用。

结果是：工具可“记账/查账”，但不能“做事”。

---

## 2. 目标

将 `01_specify` 到 `07_release` 的核心人工步骤 Skill 化，实现：

1. 每阶段有可调用 Skill，能产出阶段核心文档/数据。  
2. Skill 输出可直接被现有 CLI 校验（`matrix/metrics/gate/stage`）。  
3. 流程从“人工编写+人工补链路”升级为“Skill 生成+CLI 校验放行”。

---

## 3. 非目标

1. 不替代现有 CLI 状态机与持久化逻辑。  
2. 不引入 Web 服务化架构。  
3. 不在本版本实现跨项目知识库/模型训练能力。

---

## 4. 设计原则

1. **CLI 权威**: 状态变更与质量判定仍由 CLI 完成。  
2. **Skill 负责执行**: Skill 负责“生成/更新产物”，不直接改状态。  
3. **阶段最小闭环**: 每个阶段至少实现“输入校验 -> 产物生成 -> 自检建议”。  
4. **可审计**: Skill 生成结果需可追踪到输入与模板版本。  

---

## 5. Skill 体系总览（按流程节点）

| Skill ID | 阶段 | Skill 名称（建议） | 当前缺口 | 优先级 |
|---|---|---|---|---|
| SK-01 | 01_specify | `spec-first-specify-assistant` | 无 spec 生成/FR-NFR 抽取 | P0 |
| SK-02 | 02_design | `spec-first-design-assistant` | 无 design/contract 生成 | P0 |
| SK-03 | 03_plan | `spec-first-plan-assistant` | 无任务拆解与 tasks 生成 | P0 |
| SK-04 | 04_implement | `spec-first-implement-assistant` | 无 TASK->代码改动关联辅助 | P1 |
| SK-05 | 05_verify | `spec-first-verify-assistant` | 无测试用例/报告生成 | P0 |
| SK-06 | 06_wrapup | `spec-first-wrapup-assistant` | 无归档/矩阵收敛辅助 | P1 |
| SK-07 | 07_release | `spec-first-release-assistant` | 无发布说明/清单生成 | P1 |

---

## 6. 跨阶段基础 Skill（必须先补）

| Skill ID | 名称（建议） | 作用 | 优先级 |
|---|---|---|---|
| SK-X1 | `spec-first-gate-resolver` | 为 Gate auto 条件提供可执行 resolver（覆盖率/SCA/安全/矩阵） | P0 |
| SK-X2 | `spec-first-template-scaffold` | 提供阶段产物模板初始化（spec/design/tasks/test/release） | P0 |
| SK-X3 | `spec-first-trace-autofill` | 根据文档自动回填 traceability-matrix 关联列 | P0 |
| SK-X4 | `spec-first-workflow-orchestrator` | 将阶段 Skill 串联为交互式工作流 | P1 |

说明：`SK-X1` 是所有阶段 Gate 放行的前置依赖。

---

## 7. 分阶段功能需求

## 7.1 SK-01 `spec-first-specify-assistant`（01_specify）

**输入**:

1. 原始需求输入（PRD 草稿/会议纪要/变更说明）。  
2. Feature 元数据（featureId、mode、size、feat 缩写）。  

**能力要求**:

1. 生成或更新 `spec.md`（结构化章节）。  
2. 抽取并编号 FR/NFR。  
3. 标记澄清项并生成澄清清单。  
4. 输出 `id` 生成建议清单，支持调用 `spec-first id next`。  

**输出**:

1. `spec.md`。  
2. `specify-findings.md`（可选）。  

**验收标准**:

1. `spec.md` 中 FR/NFR 覆盖输入需求主线。  
2. 可通过 `spec-first id validate` 校验。  

## 7.2 SK-02 `spec-first-design-assistant`（02_design）

**能力要求**:

1. 基于 `spec.md` 生成 `design.md` 章节骨架。  
2. 生成 `contracts/*.yaml` 初稿（含 API ID 映射）。  
3. 生成 `data-model.md` 初稿。  

**验收标准**:

1. Design 文档中可追踪到 FR/NFR。  
2. SCA 设计检查具备可评估输入。

## 7.3 SK-03 `spec-first-plan-assistant`（03_plan）

**能力要求**:

1. 生成 `tasks.md`，每个 TASK 含 traces。  
2. 生成 `checklist.md`。  
3. 标注并行任务与依赖关系。  

**验收标准**:

1. TASK 可映射 FR/NFR。  
2. `spec-first matrix check` 可通过结构校验。

## 7.4 SK-04 `spec-first-implement-assistant`（04_implement）

**能力要求**:

1. 根据 TASK 输出实现建议和提交粒度。  
2. 生成 PR 描述模板（含 TASK/FR 关联字段）。  
3. 提供 commit message 模板建议。  

**验收标准**:

1. 产出可直接用于 PR 和 Code Review。  
2. 提交信息可被 hook 规则接受。

## 7.5 SK-05 `spec-first-verify-assistant`（05_verify）

**能力要求**:

1. 基于 AC/NFR 生成测试用例草案（UT/IT/E2E）。  
2. 生成 `test-report.md`、`security-report.md` 模板。  
3. 给出未覆盖需求清单并建议补测。  

**验收标准**:

1. 与 `metrics coverage` 输出一致，未覆盖项可回溯。  
2. 测试报告结构满足 Gate 检查输入要求。

## 7.6 SK-06 `spec-first-wrapup-assistant`（06_wrap_up）

**能力要求**:

1. 汇总阶段证据生成 `retro.md`。  
2. 检查并补全矩阵状态字段（draft/in_progress/verified 等）。  
3. 生成归档清单。  

## 7.7 SK-07 `spec-first-release-assistant`（07_release）

**能力要求**:

1. 生成 `release-notes.md`。  
2. 生成 smoke checklist 和发布确认清单。  
3. 生成观察窗口记录模板。

---

## 8. 跨阶段关键需求（FR）

| FR ID | 需求 |
|---|---|
| FR-SKILL-001 | 每个阶段至少提供一个可调用 Skill，覆盖核心产出物生成。 |
| FR-SKILL-002 | Skill 输出文件必须与现有目录约定兼容。 |
| FR-SKILL-003 | Skill 与 CLI 集成，状态推进由 `spec-first stage` 执行。 |
| FR-SKILL-004 | Gate auto resolver 完整接入，`gate check` 可执行 auto 条件。 |
| FR-SKILL-005 | 支持 Mode N / Mode I 差异化生成策略。 |
| FR-SKILL-006 | Skill 运行需生成执行摘要，便于审计与复盘。 |

---

## 9. 非功能需求（NFR）

| NFR ID | 要求 |
|---|---|
| NFR-SKILL-001 | 单次 Skill 执行在本地环境可重入，失败可重试。 |
| NFR-SKILL-002 | 生成结果默认可人工编辑，避免覆盖手工修改。 |
| NFR-SKILL-003 | 明确输出“哪些内容是 AI/Skill 生成”。 |
| NFR-SKILL-004 | Skill 不应直接修改 `stage-state.json`。 |

---

## 10. 集成方案（与现有 CLI）

Skill 与 CLI 的责任边界：

1. Skill：生成/更新阶段产物。  
2. CLI：执行校验、计算指标、推进状态。  

建议执行链路：

1. 调用阶段 Skill 生成产物。  
2. `spec-first matrix check` + `spec-first metrics coverage`。  
3. `spec-first gate check`。  
4. `spec-first stage advance`。  

---

## 11. 里程碑与优先级

### Milestone P0（先可用）

范围：

1. SK-X1、SK-X2、SK-X3  
2. SK-01、SK-02、SK-03、SK-05

目标：

1. 让 `01/02/03/05` 四阶段具备实用“做事能力”。  
2. `gate check` auto 条件可执行。  

### Milestone P1（再完善）

范围：

1. SK-04、SK-06、SK-07、SK-X4

目标：

1. 主流程从 `00` 到 `08` 的节点能力完整。  
2. 形成交互式 workflow 体验。

---

## 12. 验收口径

项目级验收（满足即通过）：

1. 通过 Skill + CLI 可以在一个 Feature 中完整走完 `00_init -> 08_done`。  
2. 每个阶段至少有 1 个可复用 Skill，被 2 名以上开发者独立复现。  
3. 不依赖手工创建空白模板文件。  
4. Gate 自动条件可稳定执行（不需要 `--force` 作为常态）。

---

## 13. 风险与依赖

主要风险：

1. Skill 与 CLI 输出契约不一致。  
2. 模板更新导致回归问题。  
3. Gate 条件增加后 resolver 维护成本上升。  

关键依赖：

1. 现有 M1/M2/M3 模块接口稳定。  
2. 阶段产出物路径与命名约定冻结。  

---

## 14. 附录：建议 Skill 命名与目录

建议命名（kebab-case）：

1. `spec-first-specify-assistant`
2. `spec-first-design-assistant`
3. `spec-first-plan-assistant`
4. `spec-first-implement-assistant`
5. `spec-first-verify-assistant`
6. `spec-first-wrapup-assistant`
7. `spec-first-release-assistant`
8. `spec-first-gate-resolver`
9. `spec-first-template-scaffold`
10. `spec-first-trace-autofill`

建议目录：

`$CODEX_HOME/skills/<skill-name>/SKILL.md`

