# Spec-First 流程节点 Skill 需求文档

> **版本**: v1.2 | **日期**: 2026-02-09 | **作者**: Leo + Claude
> **前置依赖**: spec-first-v5.md（需求规范）、技术方案文档、代码审查报告

---

## 0. 决策冻结（2026-02-09）

1. **唯一基线文档**：本文件 `docs/01需求文档/skill-requirements-v1.md` 为唯一基线。  
2. **交互入口形态**：采用外部 `/skill`（Codex/Claude 风格），不新增 `spec-first skill` CLI 命令组。  
3. **产物命名统一**：统一使用 `task_plan.md` 命名体系（不再引入 `tasks.md` 作为主命名）。

### 0.1 统一命名清单（Canonical）

| 领域 | 统一命名 |
|---|---|
| 任务规划 | `task_plan.md` |
| 需求文档 | `spec.md` |
| 设计文档 | `design.md` |
| 接口契约 | `api-contract.yaml` |
| 测试计划 | `test-plan.md` |
| 测试报告 | `test-report.md` |
| 追踪矩阵 | `traceability-matrix.yaml`（主）/ `traceability-matrix.md`（兼容） |

### 0.2 兼容映射（迁移期）

| 历史命名 | 统一命名 |
|---|---|
| `tasks.md` | `task_plan.md` |
| `api.md` | `api-contract.yaml` |
| `test-cases.md` | `test-plan.md` |

---

## 一、背景与问题

### 1.1 现状

Spec-First CLI（当前仓库版本 v0.1.0）已实现 **流程调度层**（状态机 + Gate + 裁剪引擎 + 追踪矩阵），但 **流程节点的业务执行能力** 为零——CLI 是"管理工具"而非"生产工具"。

```
当前能力矩阵：

                管理类（已实现）       生产类（未实现）          校验类（部分实现）
00_init         ✅ init 命令          ✅ 目录+三文件初始化      ✅ 内联校验
01_specify      ✅ stage 命令         ❌ 无 spec 编写辅助       ❌ SCA 未接入 Gate
02_design       ✅ stage 命令         ❌ 无 design 编写辅助     ❌ SCA 未接入 Gate
03_plan         ✅ stage 命令         ❌ 无任务拆解辅助         ❌ 覆盖率未接入 Gate
04_implement    ✅ stage 命令         ❌ 无代码追溯辅助         ❌ SCA 未接入 Gate
05_verify       ✅ stage 命令         ❌ 无测试设计辅助         ❌ SCA 未接入 Gate
06_wrap_up      ✅ stage 命令         ❌ 无归档辅助             ❌ 矩阵审计未接入
07_release      ✅ stage 命令         ❌ 无发布辅助             ❌ smoke 未接入
```

### 1.2 核心问题

| # | 问题 | 影响 |
|---|------|------|
| 1 | **用户无法"做事"** | CLI 只能"记账"（状态管理）和"查账"（覆盖率查询），不能辅助产出交付物 |
| 2 | **Gate 自动条件跑不通** | `GateEvaluator` 构造函数缺 `resolver` 参数，4 道 Gate 的 auto 条件全部失效 |
| 3 | **交付物模板缺失** | 16 个交付物中仅 2 个有模板（constitution.md、traceability-matrix），其余无模板 |
| 4 | **运行态三文件无工具支撑** | `task_plan.md` / `findings.md` / `progress.md` 需手动维护，无自动更新机制 |
| 5 | **Context Pack 可用性不足** | 已有实现入口，但命令层与模块签名存在漂移，稳定性不足 |
| 6 | **Session Catchup 可用性不足** | 已有实现入口，但接口对齐和恢复质量仍需补强 |

### 1.3 目标

为 8 个主流程阶段设计 **Skill**（类似 Claude Code `/skill` 的可调用交互式能力），使 CLI 从"流程调度器"升级为"流程执行辅助工具"。

### 1.4 设计原则

1. **规范对齐** — 每个 Skill 的输入/输出必须与 v5 规范的阶段定义完全对齐
2. **Gate 可校验** — 每个 Skill 产出的交付物必须能被 Gate 条件自动校验
3. **三文件联动** — 每个 Skill 执行过程中必须自动更新运行态三文件
4. **追踪矩阵维护** — 每个 Skill 必须自动维护追踪矩阵（调用 M2 TraceEngine）
5. **ID 自动注册** — 每个 Skill 必须自动注册 ID（调用 M2 IdRegistry）
6. **Context Pack 驱动** — 每个 Skill 以 Context Pack 为标准输入，确保跨 Agent 可委派
7. **人工确认** — AI 辅助生成的内容必须经人工确认后才写入

---

## 二、Skill 架构

### 2.1 Skill 与 v5 规范的映射关系

```
v5 规范定义                    Skill 实现
─────────────────────────────────────────────────────────
代理路由矩阵                →  Skill 路由（按阶段分派）
  oracle (01 Specify)       →  SK-01 spec-write
  sisyphus (02 Design)      →  SK-02 design-write
  librarian (02 Design)     →  SK-03 research
  do (03 Plan)              →  SK-04 task-decompose
  codeagent-wrapper (04)    →  SK-05 code-trace
  默认 Agent (05 Verify)    →  SK-06 test-design
  document-writer (06)      →  SK-07 archive

Context Pack 标准            →  Skill 统一输入格式
运行态三文件                 →  Skill 执行过程自动更新
Session Catchup             →  SK-SYS-01 session-catchup
Gate 条件                   →  SK-SYS-02 gate-check（接入 AutoConditionResolver）
```

### 2.2 Skill 执行模型

每个 Skill 遵循统一的执行流程：

```
┌─────────────────────────────────────────────────────┐
│                   Skill 执行流程                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  1. 加载 Context Pack（feature_meta + artifacts）     │
│     ↓                                                │
│  2. 校验前置条件（当前阶段、前置交付物是否存在）        │
│     ↓                                                │
│  3. 读取模板（templates/<stage>/<deliverable>.hbs）    │
│     ↓                                                │
│  4. AI 辅助生成内容（基于 Context Pack + 模板）        │
│     ↓                                                │
│  5. 人工确认（终端预览 → 用户确认/修改）               │
│     ↓                                                │
│  6. 写入交付物文件                                    │
│     ↓                                                │
│  7. 自动注册 ID（调用 IdRegistry.nextId）              │
│     ↓                                                │
│  8. 自动更新追踪矩阵（调用 MatrixManager.addRow）      │
│     ↓                                                │
│  9. 自动更新运行态三文件                               │
│     - progress.md: 记录完成状态                       │
│     - findings.md: 记录过程发现                       │
│     - task_plan.md: 更新规划状态                      │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### 2.3 Skill 分类

| 类型 | 说明 | 数量 |
|------|------|------|
| **阶段生产类** | 辅助用户产出阶段交付物（spec.md、design.md 等） | 7 |
| **系统基础类** | 基础设施能力（Context Pack、Session Catchup、Gate 接入） | 4 |
| **校验类** | 自动校验交付物质量（SCA 接入 Gate、覆盖率接入 Gate） | 2 |
| **修复类** | 修复现有 Bug（Gate resolver 接入、模板补全） | 2 |
| **合计** | | **15** |

### 2.4 Skill 全景图

```text
阶段            阶段生产类 Skill                系统/校验类 Skill
──────────────────────────────────────────────────────────────────────
00_init         (已实现)                        SK-SYS-01 context-pack
01_specify      SK-01 spec-write                SK-SYS-02 gate-check
02_design       SK-02 design-write              SK-SYS-03 session-catchup
                SK-03 research                  SK-SYS-04 runtime-files
03_plan         SK-04 task-decompose            SK-CHK-01 sca-gate
04_implement    SK-05 code-trace                SK-CHK-02 coverage-gate
05_verify       SK-06 test-design
06_wrap_up      SK-07 archive
07_release      (手动发布，CLI 辅助 checklist)
──────────────────────────────────────────────────────────────────────
修复类          SK-FIX-01 gate-resolver-fix
                SK-FIX-02 template-scaffold
```

### 2.5 依赖关系

```text
SK-FIX-01 gate-resolver-fix ──┐
SK-FIX-02 template-scaffold ──┤
SK-SYS-01 context-pack ───────┤
SK-SYS-04 runtime-files ──────┤
                               ▼
SK-01 spec-write ──→ SK-02 design-write ──→ SK-04 task-decompose
                     SK-03 research              │
                                                 ▼
                                           SK-05 code-trace
                                                 │
                                                 ▼
                                           SK-06 test-design
                                                 │
                                                 ▼
                                           SK-07 archive

横切依赖：
  SK-SYS-02 gate-check    ← 所有阶段转换时调用
  SK-SYS-03 session-catchup ← 任意阶段会话恢复时调用
  SK-CHK-01 sca-gate       ← Gate 1/2/3 自动条件
  SK-CHK-02 coverage-gate  ← Gate 2/3/4 自动条件
```

---

## 三、Skill 详细定义

> 按依赖顺序排列：修复类 → 系统基础类 → 校验类 → 阶段生产类

### 3.1 修复类 Skill（2 个）

#### SK-FIX-01 gate-resolver-fix

| 属性 | 值 |
|------|-----|
| **名称** | Gate Resolver 接入修复 |
| **类型** | 修复类（一次性） |
| **优先级** | P0 — 阻塞所有 Gate 自动条件 |
| **v5 映射** | UC-007 Gate 评估、Gate 1~4 自动条件 |

**问题根因**：

`src/commands/gate.ts:80` 调用 `new GateEvaluator(baseDir)` 仅传 1 个参数，但构造函数签名为 `constructor(specsDir: string, resolver: AutoConditionResolver)`，导致 `resolver` 为 `undefined`，4 道 Gate 的 20 个自动条件全部静默失败。

**修复方案**：

```
1. 实现 AutoConditionResolver 类
   - 位置：src/core/gate-engine/auto-condition-resolver.ts
   - 职责：根据条件类型调用对应检查逻辑
   - 条件类型：file_exists / sca_pass / coverage_threshold / test_pass

2. 修复 gate.ts 调用
   - 构造 resolver 实例并传入 GateEvaluator
   - const resolver = new AutoConditionResolver(baseDir);
   - const evaluator = new GateEvaluator(specsDir, resolver);

3. 补充 AutoConditionResolver 单元测试
   - 每种条件类型至少 2 个用例（通过/失败）
```

**验收标准**：
- `spec-gate check <featureId> --stage 01_specify` 能正确评估自动条件
- 4 道 Gate 的自动条件不再静默失败
- 新增测试 ≥ 8 个用例

---

#### SK-FIX-02 template-scaffold

| 属性 | 值 |
|------|-----|
| **名称** | 交付物模板补全 |
| **类型** | 修复类（一次性） |
| **优先级** | P0 — 阻塞所有阶段生产类 Skill |
| **v5 映射** | 各阶段交付物定义（v5 §4 各阶段活动表） |

**问题根因**：

v5 规范定义 16 个交付物，当前仅 2 个有 Handlebars 模板（`constitution.md`、`traceability-matrix`），其余 14 个无模板，阶段生产类 Skill 无法基于模板生成内容。

**需补全的模板清单**：

```
templates/
├── 01_specify/
│   ├── spec.md.hbs              # 需求规格（FR/NFR/AC）
│   └── clarify-log.md.hbs      # 需求澄清日志
├── 02_design/
│   ├── design.md.hbs            # 技术设计文档
│   ├── api-contract.yaml.hbs   # API 契约
│   └── research-note.md.hbs    # 技术调研笔记
├── 03_plan/
│   └── task-plan-detail.md.hbs # 任务拆解详情
├── 04_implement/
│   └── code-review-checklist.md.hbs  # 代码审查清单
├── 05_verify/
│   ├── test-plan.md.hbs        # 测试计划
│   └── test-report.md.hbs      # 测试报告
├── 06_wrap_up/
│   ├── archive-checklist.md.hbs # 归档清单
│   └── release-note.md.hbs     # 发布说明
└── 07_release/
    └── go-live-checklist.md.hbs # 上线清单
```

**模板设计规范**：
- 每个模板必须包含 YAML frontmatter（feature_id, stage, created_at）
- 模板变量来源于 Context Pack 的 `feature_meta` 字段
- 模板内嵌 ID 占位符（如 `{{next_id "FR"}}` ），由 Skill 执行时替换
- 模板内嵌追踪矩阵锚点（如 `<!-- trace: FR-{{feat_abbr}}-001 -->` ）

**验收标准**：
- 14 个模板文件全部创建
- 每个模板可被 Handlebars 正确编译
- 模板变量与 Context Pack schema 对齐
- 新增模板编译单元测试

### 3.2 系统基础类 Skill（4 个）

#### SK-SYS-01 context-pack

| 属性 | 值 |
|------|-----|
| **名称** | Context Pack 生成器 |
| **类型** | 系统基础类（横切） |
| **优先级** | P0 — 所有阶段生产类 Skill 的输入依赖 |
| **v5 映射** | v5 §5.3 Context Pack 标准、UC-023 Agent 委派 |

**功能描述**：

根据 v5 规范定义的 Context Pack YAML schema，自动采集当前 Feature 的上下文信息，生成标准化 YAML 输出。Context Pack 是所有 Skill 的统一输入格式，也是跨 Agent 委派的标准载荷。

**Context Pack Schema**（对齐 v5 §5.3）：

```yaml
context_pack:
  version: "1.0"
  feature_meta:
    feature_id: "AUTH"
    mode: "N"           # N=新建 / I=增量
    size: "M"           # S/M/L
    platform: "github"
    current_stage: "02_design"
    stage_status: "in_progress"
  artifacts:            # 已存在的交付物清单
    - path: "specs/AUTH/spec.md"
      type: "spec"
      last_modified: "2026-02-09T10:00:00Z"
    - path: "specs/AUTH/constitution.md"
      type: "constitution"
  constitution:         # 项目原则摘要（≤500 字）
    principles: ["规范即契约", "全链路追溯"]
  current_phase:
    stage: "02_design"
    pending_deliverables: ["design.md", "api-contract.yaml"]
    gate_conditions: [...]
  current_task:         # 当前任务（如有）
    task_id: "TASK-AUTH-003"
    description: "设计认证模块 API"
```

**数据采集来源**：

| 字段 | 采集来源 | 调用模块 |
|------|---------|---------|
| `feature_meta` | `stage-state.json` | M1 StageMachine.getFeatureState() |
| `artifacts` | `specs/<featureId>/` 目录扫描 | 文件系统 |
| `constitution` | `specs/<featureId>/constitution.md` 解析 | parsers/markdown-parser |
| `current_phase` | Gate 条件定义 + 交付物检查 | M3 GateEvaluator |
| `current_task` | `specs/<featureId>/task_plan.md` 解析 | parsers/markdown-parser |

**执行步骤**：

1. 读取 `stage-state.json` 获取 feature_meta
2. 扫描 `specs/<featureId>/` 目录，列出已有交付物
3. 解析 `constitution.md` 提取原则摘要（截断至 500 字）
4. 根据当前阶段，计算 pending_deliverables 和 gate_conditions
5. 解析 `task_plan.md` 提取当前活跃任务
6. 组装 YAML 并输出

**输出**：
- 标准输出：YAML 格式 Context Pack（≤2KB）
- 可选写入：`specs/<featureId>/.context-pack.yaml`

**验收标准**：
- Context Pack 生成 ≤ 100ms
- 输出 YAML 大小 ≤ 2KB
- 所有字段与 v5 schema 对齐
- 缺失交付物时 artifacts 列表正确反映空状态

---

#### SK-SYS-02 gate-check

| 属性 | 值 |
|------|-----|
| **名称** | Gate 自动校验 |
| **类型** | 系统基础类（横切） |
| **优先级** | P0 — 阶段转换的必经路径 |
| **v5 映射** | v5 §3.2 Quality Gate、UC-007 Gate 评估 |
| **依赖** | SK-FIX-01 gate-resolver-fix（前置修复） |

**功能描述**：

封装 `spec-gate check` 命令为 Skill 可调用接口，接入已修复的 `AutoConditionResolver`，实现 4 道 Gate 的 20 个条件全自动评估。每次阶段转换前自动触发。

**4 道 Gate 条件矩阵**（对齐 v5 §3.2）：

```text
Gate 1 — Design Ready（01_specify → 02_design）
  auto: spec.md 存在 ∧ constitution.md 存在 ∧ SCA_design PASS
  manual: PM 签核需求完整性

Gate 2 — Code Ready（03_plan → 04_implement）
  auto: design.md 存在 ∧ task_plan.md 存在 ∧ 任务覆盖率 ≥ 80%
  manual: Tech Lead 签核设计合理性

Gate 3 — Release Ready（05_verify → 06_wrap_up）
  auto: 测试覆盖率 ≥ 80% ∧ SCA_code PASS ∧ 全部 TC PASS
  manual: QA Lead 签核测试充分性

Gate 4 — Go Live（06_wrap_up → 07_release）
  auto: 归档清单完整 ∧ release-note.md 存在 ∧ 追踪矩阵审计 PASS
  manual: Peer Review 签核
```

**执行步骤**：

1. 加载 Context Pack 获取当前阶段
2. 确定目标 Gate（当前阶段对应的出口 Gate）
3. 逐条评估 auto 条件（调用 AutoConditionResolver）
4. 汇总评估结果（PASS / FAIL / WARN）
5. 写入 `gate-history.jsonl`
6. 输出评估报告（表格格式）
7. 若全部 auto PASS，提示用户完成 manual 条件

**输出**：
- 终端：Gate 评估报告（条件 × 结果表格）
- 文件：`gate-history.jsonl` 追加一条记录
- 运行态：`progress.md` 更新 Gate 状态

**验收标准**：
- 4 道 Gate 的 auto 条件全部可自动评估
- Gate 评估结果与 `gate-history.jsonl` 记录一致
- FAIL 时输出明确的失败原因和修复建议
- 评估耗时 ≤ 500ms

---

#### SK-SYS-03 session-catchup

| 属性 | 值 |
|------|-----|
| **名称** | 会话恢复 |
| **类型** | 系统基础类（横切） |
| **优先级** | P1 — 提升开发体验 |
| **v5 映射** | v5 §5.4 Session Catchup、UC-024 会话恢复 |

**功能描述**：

当用户执行 `/clear` 或新开会话时，自动恢复当前 Feature 的完整上下文。基于 v5 UC-024 定义的 8 步恢复流程，按当前阶段动态加载所需文件，确保 Agent 无需用户手动提供背景即可继续工作。

**8 步恢复流程**（对齐 v5 UC-024）：

```text
Step 1: 读取 stage-state.json → 确定 current_stage
Step 2: 读取 constitution.md → 加载项目原则
Step 3: 读取 progress.md → 了解整体进度
Step 4: 读取 findings.md → 了解已知问题
Step 5: 按 current_stage 动态加载交付物（见下方矩阵）
Step 6: 读取 task_plan.md → 定位当前任务
Step 7: 读取 traceability-matrix → 了解追踪状态
Step 8: 生成恢复摘要 → 输出给用户确认
```

**动态文件加载矩阵**（按 current_stage）：

| current_stage | 必须加载 | 可选加载 |
|---------------|---------|---------|
| 01_specify | constitution.md | — |
| 02_design | spec.md | clarify-log.md |
| 03_plan | spec.md, design.md | api-contract.yaml |
| 04_implement | task_plan.md, design.md | spec.md |
| 05_verify | task_plan.md, spec.md | test-plan.md |
| 06_wrap_up | 全部已有交付物 | — |

**输出**：
- 终端：恢复摘要（当前阶段、进度、待办任务、已知问题）
- 内存：Context Pack 缓存（供后续 Skill 使用）

**验收标准**：
- 恢复流程 ≤ 500ms（v5 SLA）
- 恢复摘要包含：当前阶段、完成百分比、下一步建议
- 缺失文件时优雅降级（跳过并提示）
- 恢复后可直接调用阶段生产类 Skill

---

#### SK-SYS-04 runtime-files

| 属性 | 值 |
|------|-----|
| **名称** | 运行态三文件自动维护 |
| **类型** | 系统基础类（横切） |
| **优先级** | P0 — 所有 Skill 执行过程的副作用依赖 |
| **v5 映射** | v5 §5.2 运行态三文件、UC-025 进度追踪 |

**功能描述**：

提供运行态三文件（`task_plan.md` / `findings.md` / `progress.md`）的程序化读写 API，供所有 Skill 在执行过程中自动更新。当前这三个文件需手动维护，本 Skill 将其升级为自动化。

**三文件职责**（对齐 v5 §5.2）：

| 文件 | 职责 | 更新时机 |
|------|------|---------|
| `task_plan.md` | 任务规划与状态追踪 | SK-04 生成、SK-05/06 更新状态 |
| `findings.md` | 过程发现与决策记录 | 任意 Skill 执行中发现问题时追加 |
| `progress.md` | 整体进度与里程碑 | 每个 Skill 完成时更新 |

**API 设计**：

```typescript
class RuntimeFiles {
  // task_plan.md 操作
  addTask(featureId: string, task: TaskEntry): void;
  updateTaskStatus(featureId: string, taskId: string, status: TaskStatus): void;
  getActiveTasks(featureId: string): TaskEntry[];

  // findings.md 操作
  addFinding(featureId: string, finding: FindingEntry): void;
  getFindings(featureId: string, filter?: FindingFilter): FindingEntry[];

  // progress.md 操作
  updateProgress(featureId: string, update: ProgressUpdate): void;
  getProgress(featureId: string): ProgressSummary;
  addMilestone(featureId: string, milestone: MilestoneEntry): void;
}
```

**文件格式规范**：

`progress.md` 结构：
```markdown
# Progress — {featureId}
## 当前状态
- 阶段: 02_design (in_progress)
- 整体进度: 35%
## 里程碑
| 里程碑 | 状态 | 完成时间 |
|--------|------|---------|
| Gate 1 Design Ready | ✅ PASS | 2026-02-09 |
## 阶段完成记录
- [x] 00_init — 2026-02-08
- [x] 01_specify — 2026-02-09
- [ ] 02_design — in_progress
```

**验收标准**：
- 三文件读写 API 全部实现
- Markdown 格式解析/生成正确（表格、列表、checkbox）
- 并发写入安全（文件锁或原子写入）
- 每个 Skill 完成后 progress.md 自动更新

### 3.3 校验类 Skill（2 个）

#### SK-CHK-01 sca-gate

| 属性 | 值 |
|------|-----|
| **名称** | SCA 一致性校验接入 Gate |
| **类型** | 校验类（横切） |
| **优先级** | P1 — Gate 1/2/3 自动条件依赖 |
| **v5 映射** | v5 §3.3 Spec-Consistency-Analysis、3 个 SCA 检查点 |
| **依赖** | SK-FIX-01（Gate resolver 已修复） |

**功能描述**：

将已实现的 `SCAEngine`（M3 模块）接入 Gate 自动条件评估链路。v5 规范定义 3 个 SCA 检查点，当前 SCA 引擎已实现但未与 Gate 条件关联。

**3 个 SCA 检查点**（对齐 v5 §3.3）：

| 检查点 | 触发 Gate | 校验内容 |
|--------|----------|---------|
| `sca_design` | Gate 1 | spec.md 中的 FR/NFR 是否在 design.md 中有对应设计 |
| `sca_code` | Gate 3 | design.md 中的 DS/API 是否在代码中有对应实现 |
| `sca_test` | Gate 3 | spec.md 中的 AC 是否在测试用例中有对应 TC |

**接入方案**：

```text
AutoConditionResolver 扩展：
  条件类型 "sca_pass" → 调用 SCAEngine.runCheck(checkpoint, featureId)
  返回值：{ pass: boolean, report: SCAReport }

Gate 条件注册：
  Gate 1: { type: "sca_pass", checkpoint: "sca_design" }
  Gate 3: { type: "sca_pass", checkpoint: "sca_code" }
  Gate 3: { type: "sca_pass", checkpoint: "sca_test" }
```

**执行步骤**：

1. Gate 评估时遇到 `sca_pass` 类型条件
2. AutoConditionResolver 调用 `SCAEngine.runCheck()`
3. SCA 引擎执行增量/全量一致性校验
4. 返回校验结果（PASS/FAIL + 不一致项列表）
5. 结果写入 Gate 评估报告

**验收标准**：
- 3 个 SCA 检查点全部接入 Gate 自动条件
- SCA FAIL 时 Gate 评估结果为 FAIL，并输出不一致项
- 增量模式（git diff）正常工作
- SCA 校验耗时 ≤ 2s

---

#### SK-CHK-02 coverage-gate

| 属性 | 值 |
|------|-----|
| **名称** | 覆盖率接入 Gate |
| **类型** | 校验类（横切） |
| **优先级** | P1 — Gate 2/3/4 自动条件依赖 |
| **v5 映射** | v5 §3.4 覆盖率算法、9 项覆盖率指标 |
| **依赖** | SK-FIX-01（Gate resolver 已修复）、M2 CoverageCalculator |

**功能描述**：

将已实现的 `CoverageCalculator`（M2 模块）接入 Gate 自动条件评估链路。v5 规范定义 9 项覆盖率指标，其中 3 项作为 Gate 通过条件。

**Gate 覆盖率条件**（对齐 v5 §3.4）：

| Gate | 条件 | 阈值 | 覆盖率指标 |
|------|------|------|-----------|
| Gate 2 | 任务覆盖率 | ≥ 80% | C1: TASK 覆盖 FR |
| Gate 3 | 测试覆盖率（FR 级） | ≥ 80% | C2: TC 覆盖 FR |
| Gate 3 | 测试覆盖率（AC 级） | ≥ 70% | C3: TC 覆盖 AC |
| Gate 4 | 追踪矩阵审计 | 孤儿率 ≤ 5% | C9: 孤儿项率 |

**接入方案**：

```text
AutoConditionResolver 扩展：
  条件类型 "coverage_threshold" → 调用 CoverageCalculator.getCoverage()
  参数：{ metric: "C1"|"C2"|"C3"|"C9", threshold: number }
  返回值：{ pass: boolean, actual: number, threshold: number }

Gate 条件注册：
  Gate 2: { type: "coverage_threshold", metric: "C1", threshold: 80 }
  Gate 3: { type: "coverage_threshold", metric: "C2", threshold: 80 }
  Gate 3: { type: "coverage_threshold", metric: "C3", threshold: 70 }
  Gate 4: { type: "coverage_threshold", metric: "C9", threshold: 5, operator: "lte" }
```

**验收标准**：
- 4 项覆盖率条件全部接入 Gate 自动评估
- 覆盖率不达标时输出：当前值、阈值、差距、未覆盖项列表
- 覆盖率计算 ≤ 50ms（v5 SLA）
- Gate 4 孤儿率使用 `≤` 而非 `≥` 比较

### 3.4 阶段生产类 Skill（7 个）

#### SK-01 spec-write

| 属性 | 值 |
|------|-----|
| **名称** | 需求规格编写辅助 |
| **类型** | 阶段生产类 |
| **所属阶段** | 01_specify |
| **v5 映射** | v5 §4.1 Specify 阶段、Agent: oracle |
| **触发命令** | `/skill spec-first/spec-write <featureId>` |
| **依赖** | SK-SYS-01 context-pack, SK-FIX-02 template-scaffold |

**功能描述**：

辅助用户编写 `spec.md` 需求规格文档。基于 Context Pack 中的项目原则和已有信息，通过交互式问答引导用户定义 FR（功能需求）、NFR（非功能需求）、AC（验收标准），并自动注册 ID、更新追踪矩阵。

**输入**（Context Pack 字段）：
- `feature_meta`: featureId, mode, size
- `constitution`: 项目原则（约束 spec 范围）
- `artifacts`: 已有交付物（判断是否为增量模式）

**交互流程**：

```text
1. 加载 Context Pack + spec.md.hbs 模板
2. 交互式引导：
   a. 功能概述（一句话描述）
   b. FR 定义（逐条添加，每条含：描述、优先级、关联 NFR）
   c. NFR 定义（逐条添加，每条含：维度、指标、阈值）
   d. AC 定义（每个 FR 至少 1 条 AC）
   e. 约束与假设
3. AI 辅助：基于 FR 自动建议关联 NFR 和 AC
4. 预览生成的 spec.md
5. 用户确认/修改
6. 写入文件 + 注册 ID + 更新矩阵
```

**输出交付物**：
- `specs/<featureId>/spec.md` — 需求规格文档
- 可选：`specs/<featureId>/clarify-log.md` — 需求澄清日志

**自动副作用**：
- IdRegistry: 注册所有 FR-xxx、NFR-xxx ID
- MatrixManager: 为每个 FR/NFR 添加追踪矩阵行（status=Planned）
- RuntimeFiles: progress.md 更新 01_specify 完成状态
- RuntimeFiles: findings.md 记录需求澄清过程中的发现

**满足的 Gate 条件**：
- Gate 1: `spec.md 存在` ✅

**验收标准**：
- 生成的 spec.md 包含至少 1 个 FR、1 个 NFR、每个 FR 至少 1 个 AC
- 所有 ID 格式符合 `TYPE-FEAT-NNN` 规范
- 追踪矩阵行数 = FR 数 + NFR 数
- 增量模式下保留已有 FR/NFR，仅追加新增

---

#### SK-02 design-write

| 属性 | 值 |
|------|-----|
| **名称** | 技术设计编写辅助 |
| **类型** | 阶段生产类 |
| **所属阶段** | 02_design |
| **v5 映射** | v5 §4.2 Design 阶段、Agent: sisyphus |
| **触发命令** | `/skill spec-first/design-write <featureId>` |
| **依赖** | SK-01 spec-write（spec.md 必须存在） |

**功能描述**：

辅助用户编写 `design.md` 技术设计文档和 `api-contract.yaml` API 契约。基于 spec.md 中的 FR/NFR，通过交互式引导生成设计方案，自动注册 DS/API ID，建立 FR→DS→API 追踪链。

**输入**（Context Pack 字段）：
- `feature_meta`: featureId, mode, size, platform
- `artifacts.spec.md`: FR/NFR 列表（设计的输入依据）
- `constitution`: 技术约束（架构原则、技术栈限制）

**交互流程**：

```text
1. 加载 Context Pack + 解析 spec.md 中的 FR/NFR
2. 交互式引导：
   a. 架构概述（整体方案一句话）
   b. 逐个 FR 设计：
      - 选择设计模式/方案
      - 定义 DS（设计决策），关联 FR
      - 定义 API（如有），关联 DS
   c. NFR 应对策略（每个 NFR 的技术方案）
   d. 数据模型设计（如有）
   e. 风险与替代方案
3. AI 辅助：基于 FR 自动建议设计方案和 API 定义
4. 预览生成的 design.md + api-contract.yaml
5. 用户确认/修改
6. 写入文件 + 注册 ID + 更新矩阵
```

**输出交付物**：
- `specs/<featureId>/design.md` — 技术设计文档
- `specs/<featureId>/api-contract.yaml` — API 契约（如有 API）

**自动副作用**：
- IdRegistry: 注册所有 DS-xxx、API-xxx ID
- MatrixManager: 为每个 DS/API 添加追踪矩阵行，关联对应 FR
- RuntimeFiles: progress.md 更新 02_design 完成状态

**满足的 Gate 条件**：
- Gate 1: `design.md 存在` ✅（部分，Gate 1 还需 SCA_design PASS）

**验收标准**：
- 每个 FR 至少关联 1 个 DS
- DS→FR 追踪链完整（无孤儿 DS）
- API 契约格式符合 OpenAPI 3.0 规范
- 增量模式下保留已有设计，仅追加新增

---

#### SK-03 research

| 属性 | 值 |
|------|-----|
| **名称** | 技术调研辅助 |
| **类型** | 阶段生产类 |
| **所属阶段** | 02_design |
| **v5 映射** | v5 §4.2 Design 阶段、Agent: librarian |
| **触发命令** | `/skill spec-first/research <featureId>` |
| **依赖** | SK-01 spec-write（spec.md 提供调研方向） |

**功能描述**：

辅助用户进行技术调研，产出 `research-note.md` 调研笔记。当设计阶段遇到技术选型、方案对比、可行性验证等需求时，通过结构化模板引导用户记录调研过程和结论。

**输入**（Context Pack 字段）：
- `feature_meta`: featureId
- `artifacts.spec.md`: NFR 列表（调研通常围绕 NFR 展开）
- `artifacts.design.md`: 已有设计（如有，识别待调研点）

**交互流程**：

```text
1. 加载 Context Pack + research-note.md.hbs 模板
2. 交互式引导：
   a. 调研主题（一句话描述）
   b. 调研背景（为什么需要调研）
   c. 候选方案列表（≥2 个）
   d. 每个方案的评估维度（性能、成本、复杂度、社区活跃度等）
   e. 对比矩阵填写
   f. 结论与建议
3. AI 辅助：基于调研主题自动搜索相关技术文档和最佳实践
4. 预览生成的 research-note.md
5. 用户确认/修改
6. 写入文件
```

**输出交付物**：
- `specs/<featureId>/research-note.md` — 技术调研笔记

**自动副作用**：
- RuntimeFiles: findings.md 追加调研结论摘要
- RuntimeFiles: progress.md 记录调研完成

**满足的 Gate 条件**：
- 无直接 Gate 条件（调研为可选活动，但其结论支撑 design.md 质量）

**验收标准**：
- 调研笔记包含至少 2 个候选方案的对比
- 对比矩阵至少 3 个评估维度
- 结论明确推荐方案并说明理由

---

#### SK-04 task-decompose

| 属性 | 值 |
|------|-----|
| **名称** | 任务拆解辅助 |
| **类型** | 阶段生产类 |
| **所属阶段** | 03_plan |
| **v5 映射** | v5 §4.3 Plan 阶段、Agent: do |
| **触发命令** | `/skill spec-first/task-decompose <featureId>` |
| **依赖** | SK-02 design-write（design.md 必须存在） |

**功能描述**：

基于 spec.md 和 design.md，将 FR/DS 自动拆解为可执行的 TASK，生成 `task_plan.md`（运行态三文件之一）。每个 TASK 关联对应的 FR/DS，建立 FR→DS→TASK 追踪链，并计算任务覆盖率（C1）。

**输入**（Context Pack 字段）：
- `artifacts.spec.md`: FR 列表（拆解的需求来源）
- `artifacts.design.md`: DS 列表（拆解的设计来源）
- `feature_meta`: mode, size（影响拆解粒度）

**交互流程**：

```text
1. 加载 Context Pack + 解析 spec.md 和 design.md
2. 自动生成任务拆解建议：
   a. 每个 DS 拆解为 1~N 个 TASK
   b. 每个 TASK 包含：描述、关联 DS、预估规模（S/M/L）、依赖关系
3. 用户审核/调整：
   a. 合并或拆分 TASK
   b. 调整优先级和依赖
   c. 补充遗漏的 TASK
4. 计算任务覆盖率（C1 = 被 TASK 覆盖的 FR 数 / 总 FR 数）
5. 若 C1 < 80%，提示用户补充 TASK
6. 预览 task_plan.md
7. 用户确认 → 写入文件
```

**输出交付物**：
- `specs/<featureId>/task_plan.md` — 任务规划（运行态三文件）

**自动副作用**：
- IdRegistry: 注册所有 TASK-xxx ID
- MatrixManager: 为每个 TASK 添加追踪矩阵行，关联对应 DS/FR
- RuntimeFiles: progress.md 更新 03_plan 完成状态
- CoverageCalculator: 计算并输出 C1 任务覆盖率

**满足的 Gate 条件**：
- Gate 2: `task_plan.md 存在` ✅
- Gate 2: `任务覆盖率 ≥ 80%` ✅（通过 SK-CHK-02 校验）

**验收标准**：
- 每个 FR 至少被 1 个 TASK 覆盖
- TASK→DS→FR 追踪链完整
- 任务覆盖率 C1 ≥ 80%（Gate 2 条件）
- task_plan.md 格式符合运行态三文件规范

---

#### SK-05 code-trace

| 属性 | 值 |
|------|-----|
| **名称** | 代码追溯辅助 |
| **类型** | 阶段生产类 |
| **所属阶段** | 04_implement |
| **v5 映射** | v5 §4.4 Implement 阶段、Agent: codeagent-wrapper |
| **触发命令** | `/skill spec-first/code-trace <featureId>` |
| **依赖** | SK-04 task-decompose（task_plan.md 必须存在） |

**功能描述**：

在编码阶段辅助开发者维护代码与需求的追踪关系。不生成代码本身（代码由开发者或 Code Agent 编写），而是：(1) 提供当前 TASK 的上下文（关联的 FR/DS/API），(2) 在代码提交时自动校验 commit message 中的 TASK ID，(3) 更新 task_plan.md 中的任务状态。

**输入**（Context Pack 字段）：
- `current_task`: 当前活跃 TASK 信息
- `artifacts.task_plan.md`: 任务列表及状态
- `artifacts.design.md`: DS/API 定义（代码实现的参考）

**交互流程**：

```text
1. 加载 Context Pack + 定位当前 TASK
2. 展示当前 TASK 上下文：
   - TASK 描述
   - 关联的 FR（需求来源）
   - 关联的 DS（设计方案）
   - 关联的 API（接口定义，如有）
3. 开发者编码（CLI 不介入）
4. 提交时校验：
   - commit message 包含 TASK ID（如 "feat(TASK-AUTH-003): ..."）
   - 变更文件与 TASK 关联的模块一致
5. 更新 task_plan.md 中该 TASK 状态为 Implemented
6. 更新追踪矩阵中该 TASK 行的 status
```

**输出交付物**：
- 无新文件（更新已有文件）

**自动副作用**：
- RuntimeFiles: task_plan.md 更新 TASK 状态（Planned → Implemented）
- MatrixManager: 更新追踪矩阵行 status
- RuntimeFiles: progress.md 更新实现进度百分比

**满足的 Gate 条件**：
- Gate 3 前置：所有 TASK 状态为 Implemented（间接条件）

**验收标准**：
- TASK 上下文展示包含完整的 FR→DS→TASK 追踪链
- commit message 校验正确识别 TASK ID
- task_plan.md 状态更新正确
- 支持批量更新多个 TASK 状态

---

#### SK-06 test-design

| 属性 | 值 |
|------|-----|
| **名称** | 测试设计辅助 |
| **类型** | 阶段生产类 |
| **所属阶段** | 05_verify |
| **v5 映射** | v5 §4.5 Verify 阶段、默认 Agent |
| **触发命令** | `/skill spec-first/test-design <featureId>` |
| **依赖** | SK-01 spec-write（spec.md 中的 AC 是测试来源） |

**功能描述**：

基于 spec.md 中的 FR/AC（验收标准），辅助用户设计测试用例（TC），生成 `test-plan.md` 和 `test-report.md`。每个 TC 关联对应的 FR/AC，建立 FR→AC→TC 追踪链，并计算测试覆盖率（C2/C3）。

**输入**（Context Pack 字段）：
- `artifacts.spec.md`: FR 列表 + 每个 FR 的 AC 列表
- `artifacts.task_plan.md`: TASK 列表（了解实现范围）
- `feature_meta`: mode（增量模式只需覆盖变更部分）

**交互流程**：

```text
1. 加载 Context Pack + 解析 spec.md 中的 FR/AC
2. 自动生成测试用例建议：
   a. 每个 AC 至少生成 1 个 TC
   b. 每个 TC 包含：前置条件、操作步骤、预期结果、关联 AC
   c. 自动建议边界条件和异常场景 TC
3. 用户审核/调整：
   a. 补充遗漏的 TC
   b. 调整 TC 优先级
   c. 标记自动化/手动
4. 计算测试覆盖率：
   - C2 = 被 TC 覆盖的 FR 数 / 总 FR 数
   - C3 = 被 TC 覆盖的 AC 数 / 总 AC 数
5. 若 C2 < 80% 或 C3 < 70%，提示用户补充 TC
6. 预览 test-plan.md
7. 用户确认 → 写入文件
```

**输出交付物**：
- `specs/<featureId>/test-plan.md` — 测试计划
- `specs/<featureId>/test-report.md` — 测试报告（初始化为空模板，执行后填充）

**自动副作用**：
- IdRegistry: 注册所有 TC-xxx ID
- MatrixManager: 为每个 TC 添加追踪矩阵行，关联对应 FR/AC
- RuntimeFiles: progress.md 更新 05_verify 完成状态
- CoverageCalculator: 计算并输出 C2/C3 测试覆盖率

**满足的 Gate 条件**：
- Gate 3: `测试覆盖率（FR 级）≥ 80%` ✅（C2）
- Gate 3: `测试覆盖率（AC 级）≥ 70%` ✅（C3）
- Gate 3: `全部 TC PASS` ✅（test-report.md 中记录）

**验收标准**：
- 每个 AC 至少被 1 个 TC 覆盖
- TC→AC→FR 追踪链完整
- C2 ≥ 80%、C3 ≥ 70%（Gate 3 条件）
- test-plan.md 包含自动化/手动标记

---

#### SK-07 archive

| 属性 | 值 |
|------|-----|
| **名称** | 归档辅助 |
| **类型** | 阶段生产类 |
| **所属阶段** | 06_wrap_up |
| **v5 映射** | v5 §4.6 Wrap-up 阶段、Agent: document-writer |
| **触发命令** | `/skill spec-first/archive <featureId>` |
| **依赖** | SK-06 test-design（测试完成后才归档） |

**功能描述**：

辅助用户完成 Feature 归档，生成 `archive-checklist.md`（归档清单）和 `release-note.md`（发布说明）。自动审计追踪矩阵完整性，检查所有交付物是否齐全，计算孤儿项率（C9）。

**输入**（Context Pack 字段）：
- `artifacts`: 全部已有交付物列表
- `feature_meta`: featureId, mode, size
- 追踪矩阵完整数据

**交互流程**：

```text
1. 加载 Context Pack + 扫描全部交付物
2. 自动生成归档清单：
   a. 逐项检查 v5 规范定义的必需交付物
   b. 标记已完成 / 缺失 / 不适用
   c. 计算归档完成率
3. 追踪矩阵审计：
   a. 检查孤儿项（有实现无需求、有测试无需求）
   b. 计算孤儿项率 C9
   c. 检查所有 FR 的 status 是否为 Verified/Accepted
4. 生成发布说明：
   a. 功能摘要（基于 FR 列表）
   b. 变更列表（基于 TASK 列表）
   c. 已知问题（基于 findings.md）
   d. 升级说明（如有 API 变更）
5. 预览 archive-checklist.md + release-note.md
6. 用户确认 → 写入文件
```

**输出交付物**：
- `specs/<featureId>/archive-checklist.md` — 归档清单
- `specs/<featureId>/release-note.md` — 发布说明

**自动副作用**：
- MatrixManager: 执行追踪矩阵审计，输出审计报告
- CoverageCalculator: 计算 C9 孤儿项率
- RuntimeFiles: progress.md 更新 06_wrap_up 完成状态

**满足的 Gate 条件**：
- Gate 4: `归档清单完整` ✅
- Gate 4: `release-note.md 存在` ✅
- Gate 4: `追踪矩阵审计 PASS`（孤儿率 ≤ 5%）✅

**验收标准**：
- 归档清单覆盖 v5 规范定义的所有必需交付物
- 孤儿项率 C9 ≤ 5%（Gate 4 条件）
- 发布说明包含功能摘要、变更列表、已知问题
- 缺失交付物明确标记并给出补救建议

---

## 四、实施优先级与分期计划

### 4.1 分期策略

按依赖关系和业务价值分 4 期实施：

```text
Sprint 1 — 基础修复与基础设施（阻塞项清除）
  ├── SK-FIX-01 gate-resolver-fix     ← 解除 Gate 自动条件阻塞
  ├── SK-FIX-02 template-scaffold     ← 解除模板缺失阻塞
  ├── SK-SYS-01 context-pack          ← 所有 Skill 的输入基础
  └── SK-SYS-04 runtime-files         ← 所有 Skill 的副作用基础

Sprint 2 — 校验接入与会话恢复
  ├── SK-SYS-02 gate-check            ← Gate 自动评估可用
  ├── SK-SYS-03 session-catchup       ← 会话恢复可用
  ├── SK-CHK-01 sca-gate              ← SCA 接入 Gate
  └── SK-CHK-02 coverage-gate         ← 覆盖率接入 Gate

Sprint 3 — 核心阶段生产 Skill
  ├── SK-01 spec-write                ← 01_specify 阶段可用
  ├── SK-02 design-write              ← 02_design 阶段可用
  ├── SK-03 research                  ← 02_design 调研可用
  └── SK-04 task-decompose            ← 03_plan 阶段可用

Sprint 4 — 后段阶段生产 Skill
  ├── SK-05 code-trace                ← 04_implement 阶段可用
  ├── SK-06 test-design               ← 05_verify 阶段可用
  └── SK-07 archive                   ← 06_wrap_up 阶段可用
```

### 4.2 各 Sprint 验收标准

| Sprint | 里程碑 | 核心验收标准 |
|--------|--------|-------------|
| Sprint 1 | **基础可用** | Gate auto 条件不再静默失败；Context Pack 可生成；14 个模板可编译；三文件 API 可调用 |
| Sprint 2 | **校验闭环** | `spec-gate check` 全自动评估；SCA 3 个检查点接入；覆盖率 4 项指标接入；Session Catchup ≤ 500ms |
| Sprint 3 | **前段生产** | 01→02→03 三个阶段可通过 Skill 产出交付物；Gate 1/2 可自动通过；追踪矩阵自动维护 |
| Sprint 4 | **全链路闭环** | 04→05→06 三个阶段可通过 Skill 产出交付物；Gate 3/4 可自动通过；完整 Feature 生命周期可走通 |

### 4.3 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| AI 辅助生成质量不可控 | 生成的 spec/design 质量差，用户需大量修改 | 设计原则 7（人工确认）兜底；模板约束输出结构；迭代优化 prompt |
| Context Pack 超 2KB 限制 | 大型 Feature 的上下文信息过多 | constitution 摘要截断；artifacts 只列路径不含内容；分层加载 |
| SCA 增量模式 git diff 不准 | 增量校验遗漏不一致项 | 提供全量模式 fallback；Gate 前强制全量校验 |
| 追踪矩阵性能瓶颈 | 大量 ID 时矩阵操作变慢 | 矩阵缓存机制；批量操作 API；YAML 格式优于 Markdown |

---

## 五、技术实现方案

### 5.1 Skill 运行时架构

```text
┌────────────────────────────────────────────────────────────┐
│                  外部 Skill 入口层（/skill）                │
│  /skill spec-first/<skill-name> <featureId> [options]     │
├────────────────────────────────────────────────────────────┤
│                Skill Package（SKILL.md + scripts）          │
│  1. 解析用户输入与阶段上下文                                │
│  2. 调用 Context Pack / Catchup 能力                        │
│  3. 交互式生成（模板 + AI + 人工确认）                      │
│  4. 写入交付物并调用 CLI 完成校验与推进                     │
├────────────────────────────────────────────────────────────┤
│                 CLI 能力层（保持权威）                      │
│  spec-first stage / gate / id / matrix / metrics / ai      │
│  - 状态推进、Gate 判定、覆盖率计算、追踪矩阵校验            │
├────────────────────────────────────────────────────────────┤
│              核心模块层（已实现，Skill 调用）               │
│  M1 ProcessEngine  M2 TraceEngine  M3 GateEngine           │
│  M4 ChangeMgr      M5 AIOrchestrator  M6 MetricsEngine     │
└────────────────────────────────────────────────────────────┘
```

### 5.2 新增文件结构

```text
$CODEX_HOME/skills/
└── spec-first/
    ├── spec-write/
    │   ├── SKILL.md
    │   └── scripts/run.sh
    ├── design-write/
    ├── research/
    ├── task-decompose/
    ├── code-trace/
    ├── test-design/
    └── archive/

repo/
├── templates/                      # 14 个模板文件（SK-FIX-02 补全）
├── src/core/                       # 既有核心引擎（被 Skill 调用）
└── tests/integration/skills/       # 外部 Skill 端到端集成测试
```

### 5.3 外部 `/skill` 调用设计

统一使用外部 Skill 入口，Skill 内部编排现有 CLI 命令：

```text
/skill spec-first/<skill-name> <featureId> [options]

示例：
  /skill spec-first/spec-write FEAT-AUTH-001
  /skill spec-first/design-write FEAT-AUTH-001
  /skill spec-first/task-decompose FEAT-AUTH-001
  /skill spec-first/test-design FEAT-AUTH-001

通用选项：
  --dry-run          预览模式，不写入文件
  --no-confirm       跳过人工确认（CI 场景）
  --format <fmt>     输出格式（terminal | json | markdown）
  --verbose          详细输出
```

Skill 编排 CLI 的标准链路：
1. 生成/更新交付物（Skill 内部执行）。  
2. 执行 `spec-first matrix check <featureId>`。  
3. 执行 `spec-first metrics coverage <featureId>`。  
4. 执行 `spec-first gate check <featureId>`。  
5. 通过后执行 `spec-first stage advance <featureId>`。

### 5.4 与代码审查报告的交叉修复

Skill 开发过程中同步修复代码审查报告中的相关问题：

| 审查问题 | 关联 Skill | 修复方式 |
|---------|-----------|---------|
| P0-2: GateEvaluator 构造函数缺 resolver | SK-FIX-01 | 实现 AutoConditionResolver 并修复调用 |
| P0-4: handleError 重复 10 处 | Skill 适配层 | Skill 适配脚本统一错误处理与输出协议 |
| P1-5: 8 处 JSON.parse 无保护 | SK-SYS-04 | RuntimeFiles 使用 safeJsonParse |
| P1-8: 4 个命令缺单元测试 | Sprint 2 | Skill 测试覆盖 gate/matrix/metrics |
| P2-7: Gate 条件硬编码 | SK-SYS-02 | Gate 条件外部化为配置 |

---

## 六、总结

### 6.1 交付物总览

| 类别 | 数量 | 明细 |
|------|------|------|
| Skill 实现 | 15 | 7 阶段生产 + 4 系统 + 2 校验 + 2 修复 |
| 新增模板 | 14 | 覆盖 01~07 阶段全部交付物 |
| 新增源文件 | ~20 | 外部 Skill 包目录 + 适配脚本 + 集成测试 |
| 新增测试文件 | ~15 | 单元测试 + 集成测试 |

### 6.2 预期收益

完成全部 15 个 Skill 后，CLI 能力矩阵变化：

```text
                管理类           生产类              校验类
00_init         ✅ → ✅         ✅ → ✅             ✅ → ✅
01_specify      ✅ → ✅         ❌ → ✅ SK-01       ❌ → ✅ SCA Gate
02_design       ✅ → ✅         ❌ → ✅ SK-02/03    ❌ → ✅ SCA Gate
03_plan         ✅ → ✅         ❌ → ✅ SK-04       ❌ → ✅ Coverage Gate
04_implement    ✅ → ✅         ❌ → ✅ SK-05       ❌ → ✅ SCA Gate
05_verify       ✅ → ✅         ❌ → ✅ SK-06       ❌ → ✅ Coverage Gate
06_wrap_up      ✅ → ✅         ❌ → ✅ SK-07       ❌ → ✅ 矩阵审计
07_release      ✅ → ✅         ❌ → ⚠️ checklist   ❌ → ✅ smoke
```

### 6.3 版本规划

- **v0.8.0** — Sprint 1 完成（基础修复 + 基础设施）
- **v0.9.0** — Sprint 2 完成（校验闭环 + 会话恢复）
- **v1.0.0** — Sprint 3 完成（前段阶段生产 Skill，01→03 可走通）
- **v1.1.0** — Sprint 4 完成（全链路闭环，完整 Feature 生命周期）

---

> **文档完成** | 共定义 **15 个 Skill**（SK-01~07 + SK-SYS-01~04 + SK-CHK-01~02 + SK-FIX-01~02）| 分 4 个 Sprint 实施
