# spec-first 参考文档（基线版）

## 1. 文档定位
- 本文是 `spec-first` 的执行参考，**以 As-Is 实现为准**。
- 基线来源：
  - `/Users/kuang/xiaobu/spec-first/docs/02-技术方案/prd-enhancement-final-plan.md`
  - `/Users/kuang/xiaobu/spec-first/skills/spec-first/03-spec/SKILL.md`
  - `/Users/kuang/xiaobu/spec-first/src/core/gate-engine/prd-validator.ts`
  - `/Users/kuang/xiaobu/spec-first/src/core/gate-engine/gate-evaluator.ts`

## 2. 当前标准流程（唯一口径）
- `spec-first init` 初始化 Feature 工作区
- `01_specify`：Phase 0 + Step 0-8
- `02_design` → `03_plan` → `04_implement` → `05_verify` → `06_wrap_up` → `07_release`

### 01_specify 内部流程
- Phase 0.1 任务锚定
- Phase 0.2 场景判定（greenfield/iteration）
- Phase 0.3 PRD 生成
- Phase 0.4 PRD 自检（C-PRD）
- Phase 0.5 PRD 用户确认
- Step 0 Ensure Task Exists
- Step 1 Auto-Context
- Step 2 Classify Complexity
- Step 3 Question Gate
- Step 4 Research-first（按复杂度）
- Step 5 Expansion Sweep（按复杂度）
- Step 6 Q&A Loop
- Step 7 ADR-lite（Complex）
- Step 8 Final Confirmation + Implementation Plan

## 3. 门禁与阈值
- `G-SPEC-00`：`prd.md` 存在且 `C-PRD >= 85%`
- `G-SPEC-01`：`spec.md` 存在
- `G-SPEC-02`：追踪矩阵存在 FR 行
- `G-SPEC-03`：Spec 质量分（C10）`>= 80%`

## 4. PRD 契约（必须满足）
### 必需章节
- `## 1. 业务目标`
- `## 2. 功能边界`
- `## 3. 约束条件`
- `## 4. 成功标准`

### 必需元信息
- `scenario`
- `scenario_reason`
- `evidence_paths`
- `complexity`

## 5. 关键产物
- `specs/{featureId}/stage-state.json`
- `specs/{featureId}/findings.md`
- `specs/{featureId}/task_plan.md`
- `specs/{featureId}/traceability-matrix.md`
- `specs/{featureId}/constitution.md`
- `specs/{featureId}/prd.md`
- `specs/{featureId}/spec.md`

## 6. 复杂度规则
- 四档：`Trivial / Simple / Moderate / Complex`
- 按多维度取最高档（受影响文件数、歧义点、方案分支、外部依赖）
- 复杂度决定 Step 执行深度（低复杂度可跳过部分步骤，但需写 `SKIPPED` 记录）

## 7. 当前已实现 vs 未实现
### 已实现
- Phase 0 + Step 0-8 流程规范
- C-PRD 校验与 85% 阈值
- PRD 契约校验与 Gate 接入
- Question Gate / Q&A Loop 机制
- `findings.md` 状态化维护规范

### 未实现（To-Be）
- `docx/xlsx/pdf` 解析
- 图片需求提取（Vision）
- `raw-requirement.md` / `image-requirements.md` 标准输入管道

## 8. 使用建议（实践）
- 先 `init`，再进入 `spec`，避免跳阶段。
- PRD 不达标不进入 FR/AC 收敛。
- 任何跳步都写 `findings.md` 审计记录。
- 严格区分 As-Is 与 To-Be，避免“文档先于实现”。


开发执行编排能力未纳入 prd-enhancement-final-plan.md 的 As-Is/
     见 SKILL.md:16
  2. MCP 工具链自动检测与降级策略：按文件/Git/数据库/部署/搜索/通知分类选择工具，缺失时走降级方案。
     见 SKILL.md:246
  3. 多 Agent 角色分工：主控 + 后端 + 前端 + 测试 + 文档 Agent。
     见 SKILL.md:287
  4. 并行调度机制：无依赖任务并行，有依赖任务按阶段串并结合。
     见 SKILL.md:308
  5. 标准化派单机制：每个子 Agent 有输入依赖、交付要求、工具授权、完成条件。
     见 SKILL.md:331
  6. 节点级执行回报模板：每个节点固定输出完成内容、文件清单、MCP 调用记录、测试结果、文档同步。
     见 SKILL.md:366
  7. 测试门控与质量要求：节点要求语法/类型/单测/接口测试/规范检查通过。
     见 SKILL.md:397
  8. 交付与收尾编排：最终统计、提交记录、文档交付、使用手册输出。
     见 SKILL.md:423
  9. 文档驱动与自动提交导向：强调全程文档驱动、测试门控、自动提交。
     见 README.md:19