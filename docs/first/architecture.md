# 架构设计

## 架构模式

**分层 CLI 架构（Layered CLI Architecture）**

```
┌─────────────────────────────────────────────────────┐
│                   CLI Layer                         │
│         命令解析、路由分发、用户交互                  │
├─────────────────────────────────────────────────────┤
│                   Core Layer                        │
│         核心业务逻辑（14 个模块）                    │
├─────────────────────────────────────────────────────┤
│                   Shared Layer                      │
│         共享类型与工具函数                          │
├─────────────────────────────────────────────────────┤
│                   Skills Layer                      │
│         AI Skill 定义（独立）                       │
└─────────────────────────────────────────────────────┘
```

## 核心设计

### 1. Stage 状态机

**设计目标**：确保开发流程有序，防止阶段回退导致混乱。

**状态图**：

```
00_init ──→ 01_specify ──→ 02_design ──→ 03_plan ──→ 04_implement
                                                        │
                                                        ↓
08_done ←── 07_release ←── 06_wrap_up ←── 05_verify ←──┘
    │
    └── 任意阶段 ──→ 09_cancelled
```

**关键特性**：
- 单向不可逆流转
- Gate 校验强制
- 终态保护（DONE, CANCELLED）

**实现**：`src/core/process-engine/stage-machine.ts`

---

### 2. 三层 Skill 路由

**设计目标**：支持复合命令映射，解耦 CLI 与 Skill 定义。

**路由流程**：

```
用户输入 → Semantic Map（复合命令映射）
         → Runtime Route（RUNTIME_COMMANDS 集合）
         → Skill File（resolveSkillPath()）
```

**示例**：

```
"rfc approve" → CLI + 参数 → spec-first rfc approve
"code" → Skill 路由 → skills/spec-first/07-code/SKILL.md
```

**实现**：`src/core/skill-runtime/dispatcher.ts`

---

### 3. Gate 门禁系统

**设计目标**：保障阶段质量，防止不合规推进。

**规则分类**：

| 类型 | 数量 | 行为 |
|------|------|------|
| Blocking | 16 | 失败则整体 FAIL |
| Warning | 3 | 失败仅警告，不阻塞 |

**条件示例**：

| 阶段 | 条件 ID | 说明 |
|------|---------|------|
| 00_init | G-INIT-01 | Feature 目录存在 |
| 01_specify | G-SPEC-01 | spec.md 存在 |
| 02_design | G-DESIGN-01 | design.md 存在 |
| 03_plan | G-PLAN-01 | task_plan.md 存在 |
| 04_implement | G-IMPL-01 | C6 覆盖率 ≥ 阈值 |

**豁免机制**：RFC 可临时豁免特定条件。

**实现**：`src/core/gate-engine/`

---

### 4. 追溯引擎

**设计目标**：支持从需求到代码的完整追溯。

**ID 体系（14 类）**：

```
业务链路：FR → DS → TASK → TC
                    ↓
V-Model：REQ → SYS → ARCH → MOD
         ATP → STP → ITP → UTP
```

**覆盖率矩阵**：

| 指标 | 计算 |
|------|------|
| C3 | TASK 覆 FR（传递） |
| C4 | TC 覆 FR（直接） |
| C6 | TASK 已实现 |
| C8 | TASK 有上游 |
| C9 | TC 有上游 FR |

**实现**：`src/core/trace-engine/`

---

### 5. 文件系统存储

**设计目标**：无需数据库，便于版本控制和审计。

**存储结构**：

```
specs/{featureId}/
├── stage-state.json        # 阶段状态
├── traceability-matrix.md  # 追踪矩阵
├── prd.md                  # PRD
├── spec.md                 # 需求规格
├── design.md               # 技术设计
├── task_plan.md            # 任务计划
└── findings.md             # 决策记录

.spec-first/
├── current                 # 当前 Feature ID
├── constitution.md         # 项目宪法
└── runtime/first/          # 项目认知 runtime
```

**优势**：
- Git 可追踪
- 人类可读
- 无外部依赖

---

## 模块依赖

```
cli/
  └──→ core/ (所有模块)
        └──→ shared/ (类型、工具)

skills/ (独立定义)
  └──→ 被 skill-runtime 加载
```

---

## 扩展点

1. **新增 Skill** — 在 `skills/spec-first/NN-name/` 添加 SKILL.md
2. **新增 Gate 条件** — 在 `GATE_CONDITIONS` 表添加定义
3. **新增追溯 ID 类型** — 扩展 `NextIdType` 联合类型
4. **新增 CLI 命令** — 在 `src/cli/commands/` 添加 handler

---

## 证据来源

- Stage 枚举 (`src/shared/types.ts:7-18`) — 显式
- Gate 条件 (`src/core/gate-engine/condition-registry.ts:41`) — 显式
- Skill 路由 (`src/core/skill-runtime/dispatcher.ts`) — 显式
- 存储结构 (`specs/` 目录) — 显式
