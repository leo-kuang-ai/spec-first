---
scenario: "iteration"
scenario_reason: "优化现有 spec-first:spec 命令流程，从简单的 P0-P5 基线升级为结构化的 Phase 0 + Step 0-8 流程"
evidence_paths: ["specs/FSREQ-20260305-SPECOPT-001/task_plan.md", "skills/spec-first/03-spec/SKILL.md"]
complexity: "Complex"
created_at: "2026-03-05T01:51:33.434Z"
last_updated: "2026-03-05T04:26:00.000Z"
---

# PRD: spec-first:spec 命令优化

## 1. 业务目标

### 1.1 当前问题

**现有 spec-first:spec 命令存在以下问题**：

1. **需求理解不足**：直接进入 FR 定义，缺少 PRD 作为需求理解基础，导致需求澄清不充分
2. **流程僵化**：所有需求都走相同流程，无法根据复杂度（Trivial/Simple/Moderate/Complex）调整执行深度
3. **问题澄清低效**：缺少结构化的问题分类（Blocking/Preference）和优先级机制（范围>安全>合规>UX>技术偏好）
4. **技术决策缺失**：复杂需求的技术选型没有 ADR 记录依据，后续难以追溯决策理由
5. **会话恢复困难**：中断后难以快速恢复到具体 Step，缺少 Step 级别的状态头
6. **质量门禁不完整**：缺少 PRD 质量评分（C-PRD）和阻断机制（G-SPEC-00）

### 1.2 改进目标

将 `/spec-first:spec` 升级为**可执行的结构化需求定义流程**，实现：

1. **PRD 前置**：Phase 0 强制产出 PRD，建立需求理解基础（greenfield/iteration 双模板）
2. **复杂度分流**：四档复杂度自动裁剪执行深度（Trivial 跳过 Step 3-7，Simple 跳过 Step 4-5/7，Moderate 跳过 Step 7，Complex 全量执行）
3. **结构化澄清**：Question Gate（先推导再提问）+ Expansion Sweep（发散扫描）+ Q&A Loop（收敛确认）三阶段
4. **技术决策记录**：Complex 需求强制产出 ADR-lite（候选方案对比 + 决策依据 + 预期后果）
5. **Step 级恢复**：findings.md 状态头支持精确恢复（current_step/completed_steps/skipped_steps/next_step）
6. **质量门禁**：PRD 完整性校验 + C-PRD 评分（>=85%）阻断不合格输入

---

## 2. 功能边界

### 2.1 变更范围

**核心变更**：

1. **Skill 重构**：`skills/spec-first/03-spec/SKILL.md` v1.0.0 → v2.0.0（213 行 → 472 行）
2. **参考文档**：新增 9 个 references/（PRD 模板 2 个 + 规则文档 3 个 + 其他模板 4 个）
3. **引擎增强**：
   - 新增 `prd-validator.ts`（PRD 章节校验 + 场景校验 + C-PRD 评分）
   - 增强 `gate-evaluator.ts`（新增 G-SPEC-00 门禁）
   - 增强 `artifact-checker.ts`（纳入 prd.md 为 01_specify 必需产物）
   - 增强 `sca.ts`（纳入 PRD 产物检查）
   - 增强 `matrix.ts`（新增 PRD→FR 映射检查）
   - 增强 `catchup.ts`（接入 Step 级状态恢复）
   - 增强 `init.ts`（可选预置 prd.md 骨架）

### 2.2 影响分析

**受影响模块**：

| 模块 | 变更类型 | 影响程度 |
|------|---------|---------|
| spec skill | 重构 | 高 - 流程完全重构 |
| gate-engine | 增强 | 中 - 新增 PRD 门禁 |
| trace-engine | 增强 | 中 - 新增 PRD→FR 映射 |
| ai-orchestrator | 增强 | 低 - 读取状态头 |
| process-engine | 增强 | 低 - 可选预置 PRD |

**回归风险**：

- **低风险**：现有 spec.md 格式保持兼容，追溯矩阵仅新增 PRD→FR 映射
- **中风险**：G-SPEC-00 门禁可能阻断缺少 PRD 的旧 Feature（需迁移指南）

---

## 4. 成功标准

### 4.1 功能标准

- ✓ Phase 0 可生成 greenfield 和 iteration 两种 PRD
- ✓ Step 2 可正确判定四档复杂度
- ✓ Step 3-7 按复杂度执行
- ✓ Step 8 可生成最终确认包

### 4.2 质量标准

- ✓ G-SPEC-00 门禁可阻断缺少 PRD 的 Feature
- ✓ C-PRD < 85% 可阻断不合格 PRD
- ✓ 追溯矩阵可检查 PRD→FR 映射
- ✓ 单元测试覆盖率 >= 75%

### 4.3 验收标准

- ✓ 四档复杂度 + 两类场景抽样通过
- ✓ 所有新增/修改的单元测试通过
- ✓ 集成测试通过

---

## 3. 约束条件

### 3.1 技术约束

- Node.js 20+
- TypeScript ESM
- 单元测试覆盖率 >= 75%
- 保持现有 CLI 命令接口不变

### 3.2 流程约束

- Phase 0 必须完成才能进入 Step 0
- 跳过的 Step 必须在 findings.md 记录 SKIPPED + 理由
- C-PRD < 85% 必须阻断
- 每个 FR 至少有 1 条 REQ-PRD-* upstream 引用

### 3.3 兼容性约束

- 支持旧 Feature 渐进式迁移
- PRD 模板支持 Handlebars 变量替换
- findings.md 状态头可读性强，支持人工编辑

---

## 4. 成功标准

### 4.1 功能标准

- ✓ Phase 0 可生成 greenfield 和 iteration 两种 PRD
- ✓ Step 2 可正确判定四档复杂度（Trivial/Simple/Moderate/Complex）
- ✓ Step 3 Question Gate 可按优先级提问（范围>安全>合规>UX>技术偏好）
- ✓ Step 4 可触发 research skill（Moderate+ 且有技术选型时）
- ✓ Step 5 可识别边界/失败场景/NFR（Simple+ 时）
- ✓ Step 6 可逐个确认 FR/AC（一问一答）
- ✓ Step 7 可生成 ADR-lite（Complex 且有多方案时）
- ✓ Step 8 可生成最终确认包（Goal/Requirements/AC/DoD/OOS）

### 4.2 质量标准

- ✓ G-SPEC-00 门禁可阻断缺少 PRD 的 Feature
- ✓ C-PRD < 85% 可阻断不合格 PRD
- ✓ 追溯矩阵可检查 PRD→FR 映射（每个 FR 至少 1 条 REQ-PRD-*）
- ✓ catchup 可读取 findings.md 状态头并恢复到具体 Step
- ✓ 单元测试覆盖率 >= 75%

### 4.3 验收标准

- ✓ 四档复杂度 + 两类场景（greenfield/iteration）抽样通过
- ✓ 所有新增/修改的单元测试通过
- ✓ 集成测试通过（prd-validator + gate-evaluator + artifact-checker）

---

## 5. 实施计划

详见 `task_plan.md`：

- **M0**: 初始化 Feature 工作区（TASK-SPECOPT-000）✅ 已完成
- **M1**: 规则与模板重构（TASK-SPECOPT-001~005, 014）✅ 已完成
- **M2**: 引擎与门禁实现（TASK-SPECOPT-006~011, 015）✅ 已完成
- **M3**: 回归验证与抽样（TASK-SPECOPT-012~013）✅ 已完成

**当前状态**：所有任务已完成，进入需求规格阶段（01_specify）

---

## 6. 附录

### 6.1 术语表

| 术语 | 定义 |
|------|------|
| PRD | Product Requirements Document，产品需求文档 |
| FR | Functional Requirement，功能需求 |
| AC | Acceptance Criteria，验收标准 |
| NFR | Non-Functional Requirement，非功能需求 |
| ADR | Architecture Decision Record，架构决策记录 |
| C-PRD | PRD 完整性评分（Completeness of PRD），0-100 分 |
| G-SPEC-00 | 需求规格阶段的 PRD 质量门禁（C-PRD >= 85%） |

### 6.2 参考资料

- `skills/spec-first/03-spec/SKILL.md` (v2.0.0)
- `skills/spec-first/03-spec/references/complexity-classification.md`
- `skills/spec-first/03-spec/references/prd-template-greenfield.md`
- `skills/spec-first/03-spec/references/prd-template-iteration.md`
- `skills/spec-first/03-spec/references/question-gate-rules.md`
- `skills/spec-first/03-spec/references/expansion-sweep-rules.md`
- `skills/spec-first/03-spec/references/convergence-qa-rules.md`
- `skills/spec-first/03-spec/references/adr-lite-template.md`
- `skills/spec-first/03-spec/references/final-confirmation-template.md`
- `skills/spec-first/03-spec/references/findings-state-header.md`
