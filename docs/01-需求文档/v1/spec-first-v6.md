# Spec-First 研发流程规范 v6.0（CLI + Skill 协同版）

> **版本**: v6.0  
> **日期**: 2026-02-09  
> **状态**: 当前协作模式基线（As-Is + To-Be）  
> **适用范围**: Feature 级需求交付（00_init → 08_done / 09_cancelled）

---

## 0. v6 决策冻结

1. **架构定位**：Spec-First 采用 `CLI（确定性） + 外部 Skill（交互式）` 双层协同。  
2. **Skill 形态**：采用外部 `/skill`（Codex/Claude 风格），不新增 `spec-first skill` 命令组。  
3. **状态流转主权**：所有阶段流转由 Skill 命令触发，CLI 仅提供底层原子能力支持。  
4. **命名基线**：统一命名以 `task_plan.md` 为任务规划主命名；历史 `tasks.md` 作为迁移兼容。  
5. **最小可落地集合**：当前先落地 3 个协同 Skill：`spec-first-plan` / `spec-first-verify` / `spec-first-orchestrate`。
6. **三层体系保留**：v6 必须保留 Layer 0/1/2 三层规范体系，并以“启动时合并”生成 Feature 实例规则。

---

## 1. 背景与问题

v5 规范完成了流程和治理框架，但当前代码现实是：

- CLI 已实现流程调度、校验、追踪、变更管理等确定性能力。
- 阶段内“产物生产”仍主要依赖人工，尚未形成每阶段可调用的生产型 Skill。
- 因此实际落地模式不是“全自动流水线”，而是“**CLI 兜底 + Skill 编排 + 人工决策**”。

v6 的目标不是再造一套新框架，而是把这套现实协作方式产品化、文档化、可复制化。

---

## 2. v6 产品定位

### 2.1 一句话定位

**Spec-First v6 是一套可执行的需求交付协同协议：CLI 负责可验证与可回放，Skill 负责交互编排与执行引导。**

### 2.2 目标

- 让团队用同一套流程完成“需求 → 设计 → 计划 → 实现 → 验证 → 收尾 → 发布”。
- 降低“只会记账不会做事”的使用门槛，提供可调用的协同入口。
- 保持跨平台可用（Claude Code CLI / Codex CLI）。

### 2.3 非目标

- 本版本不承诺 8 个阶段都具备自动生成型 Skill。
- 本版本不引入新的 CLI 命令组来承载 Skill。
- 本版本不替代人工评审与最终签核。

### 2.4 三层规范体系（必须启用）

```text
三层规范体系
┌─────────────────────────────────────────────────┐
│  Layer 0: 通用流程框架（7+3）                      │
│  所有团队、所有模式、所有规模共享                    │
│  定义：流程骨架、阶段定义、横切机制、追踪体系        │
├─────────────────────────────────────────────────┤
│  Layer 1: 模式 × 规模 规则                         │
│  Mode N (New Feature) / Mode I (Iteration)       │
│  Size S / M / L                                  │
│  定义：每种组合下的阶段行为和产出物深度              │
├─────────────────────────────────────────────────┤
│  Layer 2: 端特有规范                               │
│  APP / PC / H5 / Java Backend / ...              │
│  定义：各端的技术约束、质量标准、检查清单            │
│  各端独立维护，按需补录                             │
└─────────────────────────────────────────────────┘
```

三层职责定义：

- Layer 0 定义“做什么”（流程骨架 + 追踪规则）
- Layer 1 定义“怎么做”（模式差异、产出物深度）
- Layer 2 定义“做到什么标准”（端特有质量标准）

执行时合并规则：

- Feature 启动时，确定 `Mode + Size + 涉及端`
- 读取 Layer 0（全局基线）
- 应用 Layer 1（模式与规模裁剪）
- 合并 Layer 2（端规则叠加）
- 输出该 Feature 的定制化流程实例（Stage/Gate/Deliverables/Checklist）

### 2.5 Layer 1 行为矩阵（Mode × Size）

> 目的：把 Layer 0 的通用流程，裁剪成“当前 Feature 可执行版本”。

| 组合 | 阶段行为策略 | 产出物深度（最小要求） | Gate 策略 | 典型协作模式 |
|---|---|---|---|---|
| `Mode N + Size S` | 保持 00-07 全流程，允许轻量化内容 | `spec.md`（核心 FR/NFR）、`design.md`（关键方案）、`task_plan.md`（任务清单级）、`test-report.md`（核心路径） | 强制关键 Gate；允许部分人工说明替代详尽证据 | `/plan` + 人工执行 + `/verify quick` |
| `Mode N + Size M` | 00-07 标准流程，不跳阶段 | `spec.md`、`design.md`、`api-contract.yaml`（如有接口）、`task_plan.md`（含依赖）、`test-plan.md`、`test-report.md` | 标准 Gate 全量执行 | `/plan` -> 执行 -> `/verify full` |
| `Mode N + Size L` | 强化 Design/Plan/Verify，强调跨端与评审 | `spec.md`（含边界与异常）、`design.md`（模块/时序/容量）、`api-contract.yaml`（必须）、`task_plan.md`（里程碑+风险）、完整测试产物 | Gate 全量 + 架构/测试签核证据必需 | `/orchestrate` + 分工协作 + full verify |
| `Mode I + Size S` | 以增量改动为主，收缩非必要文档 | `spec.md`（变更 delta）、`design.md`（受影响章节）、`task_plan.md`（增量任务）、`test-report.md`（回归结果） | 重点检查变更影响与回归结果 | `/plan`（增量）+ `/verify quick` |
| `Mode I + Size M` | 保持标准流程，但以“受影响范围”驱动 | `spec.md`（delta+兼容性）、`design.md`（变更方案）、`task_plan.md`（含回滚任务）、`test-plan.md`（回归范围） | 标准 Gate + 变更影响校验 | `/plan` + `/verify full` + `stage advance` |
| `Mode I + Size L` | 强化风险治理、回归与发布控制 | `spec.md`（全量影响分析）、`design.md`（演进/迁移策略）、`api-contract.yaml`（版本化）、`task_plan.md`（并行与依赖）、完整验证与发布材料 | 最严格 Gate；发布前必须完成完整回归与签核 | `/orchestrate` 主导 + 多角色联合签核 |

补充约束：

- `task_plan.md` 为 v6 主命名；若团队历史仍使用 `tasks.md`，需在 Feature 目录内声明映射关系并保持单一真源。
- `Mode I` 必须显式记录“受影响范围”和“回归范围”，不得仅提交代码不更新规范。

---

## 3. 协同架构（CLI + Skill + 人）

```text
┌────────────────────────────────────────────────────────┐
│                    人类（PM/TL/Dev/QA）                │
│  决策、确认、签核                                      │
└───────────────┬────────────────────────────────────────┘
                │
┌───────────────▼────────────────────────────────────────┐
│                Skill 层（外部 /skill）                  │
│  /plan  /verify  /orchestrate                          │
│  spec-first-plan / spec-first-verify / spec-first-orchestrate
│  作用：交互式编排、步骤引导、结果汇总                    │
└───────────────┬────────────────────────────────────────┘
                │ 调用
┌───────────────▼────────────────────────────────────────┐
│                 CLI 层（spec-first）                    │
│  init/stage/id/gate/matrix/metrics/rfc/defect/ai/doctor│
│  作用：状态机推进、规则校验、结果可回放                  │
└────────────────────────────────────────────────────────┘
```

### 3.1 职责边界

| 层 | 负责 | 不负责 |
|---|---|---|
| CLI | 原子状态变更执行、Gate/Matrix/Metrics、ID与变更数据 | 主交互编排、需求推理 |
| Skill | 任务编排、交互引导、统一命令串联、阶段流转触发 | 直接写阶段状态文件 |
| 人 | 目标确认、取舍、质量签核 | 机械重复校验 |

---

## 4. 当前能力基线（As-Is）

### 4.1 CLI 能力（已实现）

来自 `src/index.ts` 的 10 个命令组：

1. `spec-first init`
2. `spec-first stage`（`current/advance/cancel`）
3. `spec-first id`（`next/validate/list`）
4. `spec-first gate`（`check/conditions/history`）
5. `spec-first matrix`（`check/export`）
6. `spec-first metrics`（`coverage/report`）
7. `spec-first rfc`（`create/submit/transition/list/get`）
8. `spec-first defect`（`register/update/list/get/escape-rate`）
9. `spec-first ai`（`context/catchup/stats`）
10. `spec-first doctor`

### 4.2 Skill 能力（最小集合）

- `/.claude/commands/plan.md`
- `/.claude/commands/verify.md`
- `/.claude/commands/orchestrate.md`
- `/.claude/skills/spec-first-plan/SKILL.md`
- `/.claude/skills/spec-first-verify/SKILL.md`
- `/.claude/skills/spec-first-orchestrate/SKILL.md`

### 4.3 Hook/校验配套

- Session hooks：`/.claude/hooks/hooks.json` + `session-start.js` + `session-end.js`
- CI 校验：`scripts/ci/validate-skills.js`、`scripts/ci/validate-commands.js`
- 统一校验命令：`pnpm validate:ai-assets`

### 4.4 已知缺口（截至 2026-02-09）

- 阶段生产类 Skill（spec/design/task/test/archive）尚未落地。
- CLI 命令层与部分核心模块签名存在漂移，`pnpm typecheck` 当前不通过。
- Gate 自动条件解析器注入链路未完成，Gate 自动评估仍有风险。

---

## 5. 主流程协同规范（00-09）

| 阶段 | 阶段目标 | 必选 CLI | 推荐 Skill | 核心产物（v6 命名） | 退出条件 |
|---|---|---|---|---|---|
| `00_init` | 建立 Feature 工作区 | `spec-first init` | `/orchestrate`（可选） | `spec.md`、`design.md`、`task_plan.md`（初始化） | 工作区与状态文件可读 |
| `01_specify` | 需求结构化 | `id next/validate`、`matrix check` | `/plan` | `spec.md` | 需求条目可追踪 |
| `02_design` | 技术方案收敛 | `id next`、`matrix check` | `/plan` | `design.md`、`api-contract.yaml` | 设计可实现、可验证 |
| `03_plan` | 任务编排与依赖 | `metrics coverage`、`matrix check` | `/plan` | `task_plan.md` | 任务覆盖率达标 |
| `04_implement` | 规范驱动实现 | `stage current`、`id validate` | `/orchestrate` | 代码 + 追踪引用 | 代码与需求链路连通 |
| `05_verify` | 测试与质量结论 | `metrics coverage`、`gate check` | `/verify` | `test-plan.md`、`test-report.md` | `verify=READY` |
| `06_wrap_up` | 收尾归档与复盘 | `matrix check`、`metrics report` | `/verify` | 归档文档、复盘记录 | 矩阵与报告闭合 |
| `07_release` | 发布前确认 | `gate check`、`stage advance` | `/orchestrate` | release 记录 | 发布条件满足 |
| `08_done` | 主流程终态 | `stage current` | 无 | 终态归档 | 状态稳定 |
| `09_cancelled` | 终止流程 | `stage cancel` | 无 | 取消原因记录 | 终态稳定 |

> 说明：`/orchestrate` 是编排入口，不替代阶段内专业产出能力。

---

## 6. 标准执行流程（单需求）

### 6.1 分步模式（推荐）

```bash
# 1) 初始化
/spec-first:init --feat AUTH --mode N --size M --platform github --feature-id FEAT-AUTH-001

# 2) 看当前阶段
/spec-first:stage-current FEAT-AUTH-001

# 3) 规划
/plan FEAT-AUTH-001 "实现用户认证需求"
# 或 /skill spec-first-plan FEAT-AUTH-001 "实现用户认证需求"

# 4) 执行阶段工作（人工 + 团队定制技能）

# 5) 校验
/verify FEAT-AUTH-001 full
# 或 /skill spec-first-verify FEAT-AUTH-001 full

# 6) 推进阶段
/spec-first:stage-advance FEAT-AUTH-001

# 7) 循环 3-6，直到 08_done
```

### 6.2 一键编排模式

```bash
/orchestrate FEAT-AUTH-001 "实现用户认证需求"
# 或 /skill spec-first-orchestrate FEAT-AUTH-001 "实现用户认证需求"
```

---

## 7. v6 需求定义（FR/NFR）

### 7.1 功能需求（FR）

| ID | 需求 |
|---|---|
| `FR-SF6-001` | 系统必须提供 CLI + Skill 双入口协同模式。 |
| `FR-SF6-002` | 阶段状态变更必须只能通过 CLI `stage` 命令执行。 |
| `FR-SF6-003` | 系统必须提供 `/plan`、`/verify`、`/orchestrate` 三个协同 Skill 入口。 |
| `FR-SF6-004` | `/verify` 必须串联 `stage current`、`matrix check`、`metrics coverage`、`gate check`（`full` 模式可含 `doctor`）。 |
| `FR-SF6-005` | 系统必须支持 `pnpm validate:ai-assets` 校验 Skill/Command 资产完整性。 |
| `FR-SF6-006` | 主流程必须支持 `00_init -> 08_done` 与 `09_cancelled` 两类终态。 |
| `FR-SF6-007` | 文档必须明确协同边界：CLI 负责确定性，Skill 负责编排，人负责确认与签核。 |

### 7.2 非功能需求（NFR）

| ID | 需求 |
|---|---|
| `NFR-SF6-001` | Skill 指令文件需跨平台可用（Claude/Codex）。 |
| `NFR-SF6-002` | CLI 校验结果需可回放（可通过命令重复执行得到一致结论）。 |
| `NFR-SF6-003` | 协同流程应支持失败可恢复（失败后可从当前阶段继续）。 |
| `NFR-SF6-004` | Skill 运行不应直接修改状态文件，避免隐藏副作用。 |
| `NFR-SF6-005` | 命令与 Skill 资产应具备最小自动校验能力（CI 可检）。 |

---

## 8. 验收标准（DoD）

### 8.1 流程级验收

- 能在单个 Feature 上完成一次完整闭环：`00_init -> ... -> 08_done`。
- `09_cancelled` 路径可单独验证并稳定落终态。

### 8.2 协同级验收

- `/plan` 输出中包含可执行 CLI 命令，不是纯概念描述。
- `/verify <featureId> full` 能输出 `READY/NOT READY` 明确结论。
- `/orchestrate` 能执行 `plan -> execute -> verify -> stage advance` 的逻辑闭环（含停止条件）。

### 8.3 资产级验收

- `pnpm validate:ai-assets` 通过。
- `/.claude/commands/*`、`/.claude/skills/*`、`/.claude/hooks/*` 文件可读可执行。

---

## 9. 路线图（v6.x）

### M1（已落地）：协同最小集合

- 3 个协同 Skill（plan/verify/orchestrate）
- Session hooks + CI 校验
- 使用手册与 CLI 参考手册对齐

### M2（进行中）：阶段生产技能化

- 补齐阶段产出 Skill：`spec-write/design-write/task-decompose/test-design/archive`
- 将“手工主导”升级为“Skill 主导 + 人工确认”

### M3（待启动）：核心校验链路修复

- 修复 Gate 自动条件解析链路
- 修复命令层与核心模块签名漂移（以 `pnpm typecheck` 归零为里程碑）
- 让 `stage advance` 的 Gate 评估稳定可用

---

## 10. 风险与约束

1. **能力错觉风险**：有 Skill 入口不代表阶段生产能力已完备，需明确当前是“协同骨架版”。  
2. **一致性风险**：命名与历史文档（如 `tasks.md`）并存期可能引起执行偏差。  
3. **校验可信度风险**：Gate 自动条件链路未修复前，`--force` 可能被滥用。  
4. **维护风险**：若 `.claude` 资产与 CLI 演进不同步，协同体验会退化。

---

## 11. 附录：协同命令速查

### 11.1 CLI

```bash
spec-first init ...
spec-first stage current|advance|cancel ...
spec-first id next|validate|list ...
spec-first gate check|conditions|history ...
spec-first matrix check|export ...
spec-first metrics coverage|report ...
spec-first rfc ...
spec-first defect ...
spec-first ai context|catchup|stats ...
spec-first doctor
```

### 11.2 Skill

```bash
/plan <featureId> "<task>"
/verify <featureId> [quick|full]
/orchestrate <featureId> "<task>"

/skill spec-first-plan <featureId> "<task>"
/skill spec-first-verify <featureId> [quick|full]
/skill spec-first-orchestrate <featureId> "<task>"
```

---

**v6 结论**：

Spec-First 的当前正确打开方式是：
**用 CLI 保证流程正确性，用 Skill 提升执行效率，用人保证业务正确性。**
