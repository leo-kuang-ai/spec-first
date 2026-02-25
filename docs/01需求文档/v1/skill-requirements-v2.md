# Spec-First Skill 需求文档（跨平台 Agent 指令方案）

> **版本**: v2.0 | **日期**: 2026-02-09 | **作者**: Leo + Claude
> **前置依赖**: spec-first-v5.md（v5.0 final）、spec-first CLI v0.7.0
> **适用平台**: Claude Code CLI、Codex CLI

---

## 0. 决策记录

| # | 决策 | 理由 |
|---|------|------|
| D1 | Skill = **.md 指令文件**，非 TypeScript 模块 | AI 能力由平台提供，不自建调用链 |
| D2 | 跨平台：Claude Code `/skill` + Codex `AGENTS.md` | 同一份 .md 文件，两个平台零适配 |
| D3 | 确定性操作由 **已有 CLI 命令** 承担 | `spec-first` CLI 已实现 10 个命令，Skill 通过 Bash 调用 |
| D4 | 不新增 Handlebars 模板 | AI Agent 直接按规范生成内容，模板引擎多余 |
| D5 | 修复类任务（SK-FIX）从 Skill 清单移除 | 代码 bug 修复是开发任务，不是 Skill |

---

## 一、背景与目标

### 1.1 现状

Spec-First CLI v0.7.0 已实现 **流程调度层**（10 个命令、7 个核心模块、447 个测试），但流程节点的 **业务执行能力** 为零。

```
已有 CLI 命令（确定性工具）：
  spec-first init       — 初始化 Feature 工作区
  spec-id next/validate — ID 生成与校验
  spec-gate check       — Gate 条件评估
  spec-matrix check     — 追踪矩阵校验
  spec-metrics coverage — 覆盖率计算
  spec-stage transition — 阶段转换
  spec-rfc / spec-defect — 变更与缺陷管理
  spec-ai context       — Context Pack 生成
  spec-first doctor     — 环境诊断

缺失的能力（AI 辅助生产）：
  ❌ 无 spec.md 编写辅助
  ❌ 无 design.md 编写辅助
  ❌ 无任务拆解辅助
  ❌ 无测试设计辅助
  ❌ 无代码追溯辅助
  ❌ 无归档辅助
  ❌ 无会话恢复辅助
```

### 1.2 核心洞察

缺失的能力本质上都是 **AI 推理任务**（理解需求→生成结构化文档→校验一致性）。用户已经在 Claude Code 或 Codex 中工作，**AI Agent 本身就是最佳执行引擎**。

因此：
- **不需要**在 TypeScript 中自建 AI 调用链
- **不需要** Handlebars 模板引擎（AI 直接按规范生成）
- **不需要** BaseSkill/SkillRunner 运行时框架
- **只需要** .md 指令文件告诉 AI Agent "做什么、怎么做、做完后调什么 CLI 命令"

### 1.3 目标

为 7 个阶段生产活动 + 1 个会话恢复场景，编写 **跨平台 Skill 指令文件**（.md），使任何支持文件读写和命令执行的 AI Agent 都能辅助用户完成 Spec-First 全流程。

### 1.4 设计原则

| # | 原则 | 说明 |
|---|------|------|
| 1 | **平台无关** | Skill 指令文件不依赖特定 AI Agent 的私有 API |
| 2 | **CLI 为锚** | 所有确定性操作（ID 注册、Gate 校验、矩阵更新）通过已有 CLI 命令完成 |
| 3 | **规范即 Prompt** | v5 规范的阶段定义、交付物格式、Gate 条件直接嵌入 Skill 指令 |
| 4 | **人在回路** | AI 生成内容后必须展示给用户确认，确认后才写入文件和调用 CLI |
| 5 | **最小上下文** | 每个 Skill 只加载当前阶段必需的文件，避免 token 浪费 |

---

## 二、架构设计

### 2.1 整体架构

```text
┌──────────────────────────────────────────────────────┐
│                  用户（开发者）                         │
│          在 Claude Code 或 Codex 中工作                │
└──────────┬───────────────────────────┬───────────────┘
           │                           │
     ┌─────▼──────┐             ┌──────▼──────┐
     │ Claude Code │             │  Codex CLI  │
     │  /skill     │             │  AGENTS.md  │
     └─────┬──────┘             └──────┬──────┘
           │                           │
           │    加载同一份 .md 文件      │
           └───────────┬───────────────┘
                       ▼
        ┌──────────────────────────────┐
        │    Skill 指令文件（.md）       │
        │                              │
        │  ┌────────────────────────┐  │
        │  │ § 角色与目标            │  │
        │  │ § 上下文加载（读哪些文件）│  │
        │  │ § 执行步骤              │  │
        │  │ § 输出规范（交付物格式） │  │
        │  │ § 完成后动作（CLI 调用） │  │
        │  └────────────────────────┘  │
        └──────────────┬───────────────┘
                       │
              AI Agent 执行：
              ├─ 读文件（Read）
              ├─ 写文件（Write）
              └─ 调 CLI（Bash）
                       │
                       ▼
        ┌──────────────────────────────┐
        │    spec-first CLI v0.7.0     │
        │                              │
        │  spec-id next FR AUTH        │
        │  spec-gate check AUTH        │
        │  spec-matrix check AUTH      │
        │  spec-metrics coverage AUTH  │
        │  spec-stage transition AUTH  │
        └──────────────────────────────┘
```

### 2.2 Skill 清单（8 个）

v1 定义了 15 个 Skill（7 生产 + 4 系统 + 2 校验 + 2 修复）。按新架构精简：

| v1 Skill | v2 处置 | 理由 |
|----------|--------|------|
| SK-01~07（7 个阶段生产类） | **保留 → 7 个 .md 指令文件** | 核心价值，AI 推理任务 |
| SK-SYS-01 context-pack | **降级 → Skill 内嵌步骤** | 已有 `spec-ai context` 命令，Skill 内直接调用 |
| SK-SYS-02 gate-check | **降级 → Skill 内嵌步骤** | 已有 `spec-gate check` 命令 |
| SK-SYS-03 session-catchup | **保留 → 1 个 .md 指令文件** | 会话恢复需 AI 理解上下文，非纯 CLI 能完成 |
| SK-SYS-04 runtime-files | **降级 → Skill 内嵌步骤** | 三文件更新是每个 Skill 的副作用，不独立 |
| SK-CHK-01 sca-gate | **删除** | 已有 `spec-gate check` 内置 SCA 校验 |
| SK-CHK-02 coverage-gate | **删除** | 已有 `spec-metrics coverage` 命令 |
| SK-FIX-01 gate-resolver | **移出 → 开发任务** | 代码 bug，不是 Skill |
| SK-FIX-02 template-scaffold | **删除** | AI 直接生成，不需要模板 |

**最终清单：8 个 Skill 指令文件**

```text
skills/
├── 01-spec-write.md        # 需求规格编写
├── 02-design-write.md      # 技术设计编写
├── 03-research.md          # 技术调研
├── 04-task-decompose.md    # 任务拆解
├── 05-code-trace.md        # 代码追溯
├── 06-test-design.md       # 测试设计
├── 07-archive.md           # 归档与复盘
└── 00-session-catchup.md   # 会话恢复
```

### 2.3 Skill 统一执行模型

每个 Skill .md 文件内部遵循相同的 5 阶段执行流程：

```text
Phase 1 — 上下文加载
  AI Agent 读取指令文件中指定的输入文件
  调用: spec-ai context <featureId> (获取 Context Pack)
  调用: Read 工具读取阶段相关交付物

Phase 2 — AI 推理生成
  AI Agent 根据指令文件中的规范要求生成内容
  （此阶段无 CLI 调用，纯 AI 推理）

Phase 3 — 用户确认
  AI Agent 将生成内容展示给用户
  用户确认 / 要求修改 / 拒绝
  （AI Agent 原生交互能力，无需自建）

Phase 4 — 写入交付物
  调用: Write 工具写入目标文件
  调用: spec-id next <type> <feat> (注册新 ID)

Phase 5 — 副作用执行
  调用: spec-matrix check <featureId> (更新追踪矩阵)
  调用: spec-gate check <featureId> --stage <stage> (校验 Gate)
  AI Agent 更新运行态三文件 (stage-state.json / findings.md / task_plan.md)
```

**与 v1 执行模型的关键差异**：

| 步骤 | v1（TypeScript 模块） | v2（.md 指令文件） |
|------|---------------------|-------------------|
| 上下文加载 | 程序化调用 ContextPack 类 | AI Agent 读文件 + 调 CLI |
| 内容生成 | 调 Claude API + Handlebars 模板 | **AI Agent 自身推理** |
| 用户确认 | 自建终端预览+确认流程 | **AI Agent 原生交互** |
| 写入文件 | 程序化 writeFileAtomic | AI Agent Write 工具 |
| 副作用 | 程序化调用各模块 API | AI Agent 调 CLI 命令 |

---

## 三、跨平台适配策略

### 3.1 平台能力对比

| 能力 | Claude Code CLI | Codex CLI |
|------|----------------|-----------|
| 指令加载 | `/skill` 注册 .md 文件 | `SKILL.md` + `AGENTS.md` 目录作用域 |
| 文件读写 | Read / Write 工具 | 内置文件操作 |
| 命令执行 | Bash 工具 | 内置 shell 执行 |
| 用户交互 | 原生对话 | 原生对话 |
| 上下文范围 | 手动加载 | AGENTS.md 自动加载（目录树作用域） |

### 3.2 Codex SKILL.md 原生格式

Codex CLI 已原生支持 Skill 系统，标准目录结构：

```text
skill-name/
├── SKILL.md              # 必需：YAML frontmatter + Markdown 指令
│   ├── YAML frontmatter  # name（必需）、description（必需）
│   └── Markdown body     # 指令正文
├── agents/               # 推荐：UI 元数据
│   └── openai.yaml
└── Bundled Resources     # 可选
    ├── scripts/          # 可执行脚本（Python/Bash）
    ├── references/       # 参考文档（按需加载到上下文）
    └── assets/           # 输出资源（模板、图标等）
```

### 3.3 统一适配方案

**核心策略**：以 Codex `SKILL.md` 格式为主格式，Claude Code 通过 `/skill` 加载同一文件。

```text
skills/spec-first/
├── 00-session-catchup/
│   ├── SKILL.md                # Codex 原生格式（YAML frontmatter + 指令）
│   └── references/
│       └── catchup-matrix.md   # 动态加载矩阵参考
├── 01-spec-write/
│   ├── SKILL.md
│   └── references/
│       └── spec-format.md      # spec.md 格式规范参考
├── 02-design-write/
│   ├── SKILL.md
│   └── references/
│       └── design-format.md
├── 03-research/
│   └── SKILL.md
├── 04-task-decompose/
│   ├── SKILL.md
│   └── references/
│       └── task-format.md
├── 05-code-trace/
│   └── SKILL.md
├── 06-test-design/
│   ├── SKILL.md
│   └── references/
│       └── test-format.md
├── 07-archive/
│   └── SKILL.md
└── AGENTS.md                   # 全局指令：项目约定、CLI 命令清单
```

**平台加载方式**：

| 平台 | 加载方式 | 说明 |
|------|---------|------|
| Codex CLI | 原生 Skill 系统 | 自动识别 `SKILL.md`，`AGENTS.md` 自动加载 |
| Claude Code | `/skill spec-first/<name>` | 读取对应目录的 `SKILL.md` 作为指令 |

### 3.4 SKILL.md 文件格式规范

每个 SKILL.md 遵循统一格式：

```yaml
---
name: spec-first/spec-write
description: 辅助用户编写 spec.md 需求规格文档
---
```

```markdown
# 角色与目标

你是 Spec-First 流程的需求分析助手。你的任务是...

# 上下文加载

读取以下文件：
1. 运行 `spec-ai context <featureId>` 获取 Context Pack
2. 读取 `specs/<featureId>/constitution.md`
3. ...

# 执行步骤

## Step 1: ...
## Step 2: ...

# 输出规范

生成的文件必须符合以下格式：...

# 完成后动作

执行以下 CLI 命令：
1. `spec-id next FR <featAbbr>`
2. `spec-matrix check <featureId>`
3. `spec-gate check <featureId> --stage 01_specify`
```

---

## 四、8 个 Skill 详细定义

> 每个 Skill 定义包含：目标、输入文件、执行步骤、输出交付物、CLI 调用清单。
> 交付物文件名严格对齐 v5 规范（L2209-2229）。

### 4.1 SK-00 session-catchup（会话恢复）

| 属性 | 值 |
|------|-----|
| **文件** | `skills/spec-first/00-session-catchup/SKILL.md` |
| **触发场景** | 新开会话、`/clear` 后、切换 Feature 时 |
| **v5 映射** | UC-024 Session Catchup |

**输入文件**（按 v5 UC-024 优先级排序）：

```text
Step 1: specs/<featureId>/task_plan.md       → 定位当前任务（最高优先级）
Step 2: specs/<featureId>/stage-state.json        → 整体进度
Step 3: specs/<featureId>/findings.md        → 已知问题
Step 4: specs/<featureId>/constitution.md    → 项目原则
Step 5: specs/<featureId>/spec.md            → 需求上下文
Step 6: 按 current_phase 动态加载阶段交付物（见下方矩阵）
Step 7: specs/<featureId>/traceability-matrix.md → 追踪状态
Step 8: 生成恢复摘要 → 输出给用户确认
```

**动态加载矩阵**（对齐 v5 UC-024）：

| current_phase | 必须加载 | 可选加载 |
|---------------|---------|---------|
| 01_specify | constitution.md | — |
| 02_design | spec.md | research.md |
| 03_plan | spec.md, design.md | contracts/*.yaml |
| 04_implement | tasks.md, design.md | spec.md |
| 05_verify | tasks.md, spec.md | tests/*.test.md |
| 06_wrap_up | 全部已有交付物 | — |

**输出**：恢复摘要（当前阶段、完成百分比、下一步建议），无文件写入。

**CLI 调用**：`spec-ai context <featureId>`（获取 Context Pack）。

---

### 4.2 SK-01 spec-write（需求规格编写）

| 属性 | 值 |
|------|-----|
| **文件** | `skills/spec-first/01-spec-write/SKILL.md` |
| **所属阶段** | 01_specify |
| **v5 映射** | §4.1 Specify 阶段、Agent: oracle |
| **前置条件** | Feature 已初始化（`spec-first init` 已执行） |

**输入文件**：

1. `spec-ai context <featureId>` → Context Pack
2. `specs/<featureId>/constitution.md` → 项目原则（约束 spec 范围）
3. 已有 `specs/<featureId>/spec.md`（增量模式下读取）

**执行步骤**：

```text
Step 1: 加载 Context Pack，确认 featureId、mode、size
Step 2: 交互式引导用户定义需求：
        a. 功能概述（一句话描述）
        b. FR 定义（逐条：描述、优先级、关联 NFR）
        c. NFR 定义（逐条：维度、指标、阈值）
        d. AC 定义（每个 FR 至少 1 条验收标准）
        e. 约束与假设
Step 3: AI 基于 FR 自动建议关联 NFR 和 AC
Step 4: 生成 spec.md 完整内容，展示给用户确认
Step 5: 用户确认后写入文件
Step 6: 为每个 FR/NFR 调用 spec-id next 注册 ID
Step 7: 调用 spec-matrix check 更新追踪矩阵
Step 8: 更新 stage-state.json 记录 01_specify 进度
```

**输出交付物**（对齐 v5 文件命名）：

- `specs/<featureId>/spec.md` — 需求规格文档（FR/NFR/AC）

**CLI 调用清单**：

| 步骤 | 命令 | 用途 |
|------|------|------|
| Step 1 | `spec-ai context <featureId>` | 获取 Context Pack |
| Step 6 | `spec-id next FR <featAbbr>` | 注册 FR ID |
| Step 6 | `spec-id next NFR <featAbbr>` | 注册 NFR ID |
| Step 7 | `spec-matrix check <featureId>` | 校验追踪矩阵 |

**满足的 Exit Gate 条件**（01_specify Exit Gate）：

- spec.md 存在 ✅
- 所有 FR/NFR 已分配 ID ✅
- 无歧义标记 ✅（AI 生成时确保）

---

### 4.3 SK-02 design-write（技术设计编写）

| 属性 | 值 |
|------|-----|
| **文件** | `skills/spec-first/02-design-write/SKILL.md` |
| **所属阶段** | 02_design |
| **v5 映射** | §4.2 Design 阶段、Agent: sisyphus |
| **前置条件** | spec.md 已存在 |

**输入文件**：

1. `spec-ai context <featureId>` → Context Pack
2. `specs/<featureId>/spec.md` → FR/NFR 列表（设计输入）
3. `specs/<featureId>/constitution.md` → 技术约束
4. 已有 `specs/<featureId>/design.md`（增量模式下读取）

**执行步骤**：

```text
Step 1: 加载 Context Pack + 解析 spec.md 中的 FR/NFR
Step 2: 交互式引导：
        a. 架构概述（整体方案一句话）
        b. 逐个 FR 设计：选择方案、定义 DS（设计决策）、关联 FR
        c. 定义 API（如有），关联 DS
        d. NFR 应对策略
        e. 数据模型设计（M/L 规模必需）
        f. 风险与替代方案
Step 3: AI 基于 FR 自动建议设计方案和 API 定义
Step 4: 生成 design.md + contracts/*.yaml + data-model.md，展示给用户
Step 5: 用户确认后写入文件
Step 6: 为每个 DS/API 调用 spec-id next 注册 ID
Step 7: 调用 spec-matrix check 更新追踪矩阵
Step 8: 更新 stage-state.json 记录 02_design 进度
```

**输出交付物**（对齐 v5 文件命名）：

- `specs/<featureId>/design.md` — 技术设计文档
- `specs/<featureId>/contracts/*.yaml` — API 契约（如有 API）
- `specs/<featureId>/data-model.md` — 数据模型（M/L 规模必需，S 可选）
- `specs/<featureId>/adr/NNN-*.adr.md` — 架构决策记录（按需）

**CLI 调用清单**：

| 步骤 | 命令 | 用途 |
|------|------|------|
| Step 1 | `spec-ai context <featureId>` | 获取 Context Pack |
| Step 6 | `spec-id next DS <featAbbr>` | 注册 DS ID |
| Step 6 | `spec-id next API <featAbbr>` | 注册 API ID |
| Step 7 | `spec-matrix check <featureId>` | 校验追踪矩阵 |

**满足的 Exit Gate 条件**（02_design Exit Gate）：

- design.md 存在 ✅
- API 覆盖率 = 100% ✅（每个需接口的 FR 有对应 API）
- 设计评审 + Baseline Locking ✅（用户确认即视为评审通过）

---

### 4.4 SK-03 research（技术调研）

| 属性 | 值 |
|------|-----|
| **文件** | `skills/spec-first/03-research/SKILL.md` |
| **所属阶段** | 02_design（可选活动） |
| **v5 映射** | §4.2 Design 阶段、Agent: librarian |
| **前置条件** | spec.md 已存在（提供调研方向） |

**输入文件**：

1. `spec-ai context <featureId>` → Context Pack
2. `specs/<featureId>/spec.md` → NFR 列表（调研通常围绕 NFR）
3. 已有 `specs/<featureId>/design.md`（如有，识别待调研点）

**执行步骤**：

```text
Step 1: 加载 Context Pack + 解析 spec.md 中的 NFR
Step 2: 交互式引导：
        a. 调研主题（一句话描述）
        b. 调研背景（为什么需要调研）
        c. 候选方案列表（≥2 个）
        d. 每个方案的评估维度（性能、成本、复杂度、社区活跃度等）
        e. 对比矩阵填写
        f. 结论与建议
Step 3: AI 基于调研主题搜索相关技术文档和最佳实践
Step 4: 生成 research.md，展示给用户确认
Step 5: 用户确认后写入文件
Step 6: 更新 findings.md 追加调研结论摘要
Step 7: 更新 stage-state.json 记录调研完成
```

**输出交付物**（对齐 v5 文件命名）：

- `specs/<featureId>/research.md` — 技术调研笔记

**CLI 调用清单**：

| 步骤 | 命令 | 用途 |
|------|------|------|
| Step 1 | `spec-ai context <featureId>` | 获取 Context Pack |

**满足的 Exit Gate 条件**：无直接 Gate 条件（调研为可选活动，结论支撑 design.md 质量）。

---

### 4.5 SK-04 task-decompose（任务拆解）

| 属性 | 值 |
|------|-----|
| **文件** | `skills/spec-first/04-task-decompose/SKILL.md` |
| **所属阶段** | 03_plan |
| **v5 映射** | §4.3 Plan 阶段、Agent: do |
| **前置条件** | spec.md + design.md 已存在 |

**输入文件**：

1. `spec-ai context <featureId>` → Context Pack
2. `specs/<featureId>/spec.md` → FR 列表（拆解的需求来源）
3. `specs/<featureId>/design.md` → DS 列表（拆解的设计来源）

**执行步骤**：

```text
Step 1: 加载 Context Pack + 解析 spec.md 和 design.md
Step 2: 自动生成任务拆解建议：
        a. 每个 DS 拆解为 1~N 个 TASK
        b. 每个 TASK 包含：描述、关联 DS、预估规模（S/M/L）、依赖关系
Step 3: 用户审核/调整：合并或拆分 TASK、调整优先级和依赖
Step 4: 生成验证清单 checklist.md（每个 TASK 的验证条件）
Step 5: 计算 Task 覆盖率（被 TASK 覆盖的 FR 数 / 总 FR 数）
        若 < 100%，提示用户补充 TASK
Step 6: 生成 tasks.md + checklist.md，展示给用户确认
Step 7: 用户确认后写入文件
Step 8: 为每个 TASK 调用 spec-id next 注册 ID
Step 9: 调用 spec-matrix check 更新追踪矩阵
Step 10: 更新 stage-state.json 记录 03_plan 进度
```

**输出交付物**（对齐 v5 文件命名）：

- `specs/<featureId>/tasks.md` — 任务拆解文档（阶段交付物）
- `specs/<featureId>/checklist.md` — 验证清单

**CLI 调用清单**：

| 步骤 | 命令 | 用途 |
|------|------|------|
| Step 1 | `spec-ai context <featureId>` | 获取 Context Pack |
| Step 5 | `spec-metrics coverage <featureId>` | 计算 Task 覆盖率 |
| Step 8 | `spec-id next TASK <featAbbr>` | 注册 TASK ID |
| Step 9 | `spec-matrix check <featureId>` | 校验追踪矩阵 |

**满足的 Exit Gate 条件**（03_plan Exit Gate）：

- tasks.md 存在 ✅
- Task 覆盖率 = 100% ✅
- Task 合规率 = 100% ✅（每个 TASK 关联 DS/FR）

---

### 4.6 SK-05 code-trace（代码追溯）

| 属性 | 值 |
|------|-----|
| **文件** | `skills/spec-first/05-code-trace/SKILL.md` |
| **所属阶段** | 04_implement |
| **v5 映射** | §4.4 Implement 阶段、Agent: codeagent-wrapper |
| **前置条件** | tasks.md 已存在 |

**输入文件**：

1. `spec-ai context <featureId>` → Context Pack（含 current_task）
2. `specs/<featureId>/tasks.md` → 任务列表及状态
3. `specs/<featureId>/design.md` → DS/API 定义（代码实现参考）
4. `specs/<featureId>/contracts/*.yaml` → API 契约（如有）

**执行步骤**：

```text
Step 1: 加载 Context Pack + 定位当前 TASK
Step 2: 展示当前 TASK 上下文：
        - TASK 描述、关联的 FR（需求来源）
        - 关联的 DS（设计方案）、关联的 API（接口定义）
Step 3: 开发者编码（Skill 不介入代码编写）
Step 4: 开发者完成后，校验 PR 合规率：
        - commit message 包含 TASK ID
        - 变更文件与 TASK 关联的模块一致
Step 5: 更新 tasks.md 中该 TASK 状态为 Implemented
Step 6: 调用 spec-matrix check 更新追踪矩阵
Step 7: 更新 stage-state.json 记录实现进度
```

**输出交付物**：无新文件（更新已有 tasks.md 状态）。

**CLI 调用清单**：

| 步骤 | 命令 | 用途 |
|------|------|------|
| Step 1 | `spec-ai context <featureId>` | 获取 Context Pack |
| Step 6 | `spec-matrix check <featureId>` | 校验追踪矩阵 |

**满足的 Exit Gate 条件**（04_implement Exit Gate）：

- PR 合规率 = 100% ✅（每个 PR 关联 TASK ID）
- 代码覆盖率 ≥ 80% ✅（由 CI 校验，非 Skill 职责）

---

### 4.7 SK-06 test-design（测试设计）

| 属性 | 值 |
|------|-----|
| **文件** | `skills/spec-first/06-test-design/SKILL.md` |
| **所属阶段** | 05_verify |
| **v5 映射** | §4.5 Verify 阶段、Agent: tester |
| **前置条件** | spec.md 已存在（AC 是测试来源） |

**输入文件**：

1. `spec-ai context <featureId>` → Context Pack
2. `specs/<featureId>/spec.md` → FR 列表 + 每个 FR 的 AC 列表
3. `specs/<featureId>/tasks.md` → TASK 列表（了解实现范围）

**执行步骤**：

```text
Step 1: 加载 Context Pack + 解析 spec.md 中的 FR/AC
Step 2: 自动生成测试用例建议：
        a. 每个 AC 至少生成 1 个 TC
        b. 每个 TC 包含：前置条件、操作步骤、预期结果、关联 AC
        c. 自动建议边界条件和异常场景 TC
Step 3: 用户审核/调整：补充遗漏 TC、调整优先级、标记自动化/手动
Step 4: 计算 Test 覆盖率：
        - Test 覆盖率(FR级) = 被 TC 覆盖的 FR 数 / 总 FR 数（目标 = 100%）
        - Test 覆盖率(AC级) = 被 TC 覆盖的 AC 数 / 总 AC 数（目标 ≥ 90% M/L）
        若不达标，提示用户补充 TC
Step 5: 生成 tests/*.test.md，展示给用户确认
Step 6: 用户确认后写入文件
Step 7: 为每个 TC 调用 spec-id next 注册 ID
Step 8: 调用 spec-matrix check 更新追踪矩阵
Step 9: 更新 stage-state.json 记录 05_verify 进度
```

**输出交付物**（对齐 v5 文件命名）：

- `specs/<featureId>/tests/*.test.md` — 测试用例文件（每个 FR 或模块一个）
- `specs/<featureId>/reports/test-report.md` — 测试报告（初始化模板，执行后填充）
- `specs/<featureId>/reports/security-scan.md` — 安全扫描报告（如需）
- `specs/<featureId>/reports/uat-signoff.md` — 验收签核记录（如需）

**CLI 调用清单**：

| 步骤 | 命令 | 用途 |
|------|------|------|
| Step 1 | `spec-ai context <featureId>` | 获取 Context Pack |
| Step 4 | `spec-metrics coverage <featureId>` | 计算 Test 覆盖率 |
| Step 7 | `spec-id next TC <featAbbr>` | 注册 TC ID |
| Step 8 | `spec-matrix check <featureId>` | 校验追踪矩阵 |

**满足的 Exit Gate 条件**（05_verify Exit Gate）：

- Test 覆盖率(FR级) = 100% ✅
- TC 合规率 = 100% ✅（每个 TC 关联 AC/FR）
- UAT Sign-off ✅（用户确认）

---

### 4.8 SK-07 archive（归档与复盘）

| 属性 | 值 |
|------|-----|
| **文件** | `skills/spec-first/07-archive/SKILL.md` |
| **所属阶段** | 06_wrap_up |
| **v5 映射** | §4.6 Wrap-up 阶段、Agent: document-writer |
| **前置条件** | 测试完成（05_verify Exit Gate 已通过） |

**输入文件**：

1. `spec-ai context <featureId>` → Context Pack
2. `specs/<featureId>/` 全部已有交付物（归档审计）
3. `specs/<featureId>/traceability-matrix.md` → 追踪矩阵（审计完整性）
4. `specs/<featureId>/findings.md` → 过程发现（复盘素材）

**执行步骤**：

```text
Step 1: 加载 Context Pack + 扫描全部交付物
Step 2: 自动执行归档审计（v5 定义的 19 项归档清单）：
        a. 逐项检查必需交付物是否存在
        b. 标记已完成 / 缺失 / 不适用
        c. 计算归档完成率
Step 3: 追踪矩阵审计：
        a. 检查孤儿项（有实现无需求、有测试无需求）
        b. 计算孤儿项率（目标 = 0%）
        c. 检查所有 FR 的 status 是否为 Accepted
Step 4: 生成复盘报告 retro.md：
        a. 功能摘要（基于 FR 列表）
        b. 过程回顾（基于 findings.md）
        c. 经验教训
        d. 改进建议
Step 5: 展示归档审计结果 + retro.md 给用户确认
Step 6: 用户确认后写入文件
Step 7: 调用 spec-gate check 校验 06_wrap_up Exit Gate
Step 8: 更新 stage-state.json 记录 06_wrap_up 完成
```

**输出交付物**（对齐 v5 文件命名）：

- `specs/<featureId>/retro.md` — 复盘报告

**CLI 调用清单**：

| 步骤 | 命令 | 用途 |
|------|------|------|
| Step 1 | `spec-ai context <featureId>` | 获取 Context Pack |
| Step 3 | `spec-metrics coverage <featureId>` | 计算孤儿项率 |
| Step 7 | `spec-gate check <featureId> --stage 06_wrap_up` | 校验 Exit Gate |

**满足的 Exit Gate 条件**（06_wrap_up Exit Gate）：

- 实现覆盖率 = 100% ✅
- 矩阵全 Accepted ✅
- 文档完整性 ✅（归档审计通过）
- retro.md 存在 ✅

---

## 五、CLI 命令依赖总览

### 5.1 Skill × CLI 命令矩阵

每个 Skill 调用的 CLI 命令汇总（✅ = 必须调用，○ = 按需调用）：

| CLI 命令 | SK-00 | SK-01 | SK-02 | SK-03 | SK-04 | SK-05 | SK-06 | SK-07 |
|----------|-------|-------|-------|-------|-------|-------|-------|-------|
| `spec-ai context` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `spec-id next` | — | ✅ | ✅ | — | ✅ | — | ✅ | — |
| `spec-matrix check` | — | ✅ | ✅ | — | ✅ | ✅ | ✅ | ○ |
| `spec-metrics coverage` | — | — | — | — | ✅ | — | ✅ | ✅ |
| `spec-gate check` | — | ○ | ○ | — | ○ | — | ○ | ✅ |
| `spec-stage transition` | — | ○ | ○ | — | ○ | — | ○ | ○ |

### 5.2 CLI 命令调用频率

| 命令 | 调用频率 | 说明 |
|------|---------|------|
| `spec-ai context` | **每个 Skill 必调** | Context Pack 是统一输入 |
| `spec-id next` | 4 个 Skill 调用 | SK-01/02/04/06 注册新 ID |
| `spec-matrix check` | 5 个 Skill 调用 | 除 SK-00/03 外均需更新矩阵 |
| `spec-metrics coverage` | 3 个 Skill 调用 | SK-04/06/07 需计算覆盖率 |
| `spec-gate check` | 按需调用 | 阶段转换前校验 |
| `spec-stage transition` | 按需调用 | Gate 通过后推进阶段 |

---

## 六、前置修复项

> Skill 指令文件依赖 CLI 命令正常工作。以下是代码审查报告中影响 Skill 执行的必修项。

### 6.1 P0 — 阻塞 Skill 执行（2 项）

| # | 问题 | 影响的 Skill | 修复方案 |
|---|------|------------|---------|
| 1 | **featureId 路径遍历漏洞** — 无边界校验，可逃逸 specs/ 目录 | 全部 8 个 | 新增 `sanitizeFeatureId()` + 所有入口调用 |
| 2 | **CLI 参数缺格式白名单校验** — featureId 无前置校验 | 全部 8 个 | 命令层增加正则白名单 `/^[a-zA-Z0-9_-]+$/` |

### 6.2 P1 — 影响 Skill 质量（3 项）

| # | 问题 | 影响的 Skill | 修复方案 |
|---|------|------------|---------|
| 1 | **8 处 JSON.parse 无保护** — 文件损坏时抛原生 SyntaxError | SK-00 session-catchup | 封装 `safeJsonParse<T>()` |
| 2 | **handleError 重复 10 处** — 错误处理不统一 | 全部（CLI 调用失败时） | 提取到 `shared/cli-utils.ts` |
| 3 | **4 个命令缺单元测试** — gate/matrix/metrics/doctor | SK-04/06/07（依赖这些命令） | 补充命令层测试 |

### 6.3 修复优先级

```text
P0-1 路径遍历 ──┐
P0-2 参数校验 ──┤── 必须在 Skill 上线前修复
                │
P1-1 JSON.parse ┤── 建议在 Sprint 1 同步修复
P1-2 handleError┤
P1-3 命令测试 ──┘── 可与 Skill 开发并行
```

---

## 七、实施计划

### 7.1 分期策略

按依赖关系分 3 期实施：

```text
Sprint 0 — 前置修复（阻塞项清除）
  ├── P0-1 featureId 路径遍历修复
  ├── P0-2 CLI 参数白名单校验
  └── P1-1~3 质量修复（可并行）

Sprint 1 — 核心 Skill（前段流程可走通）
  ├── 00-session-catchup.md    ← 会话恢复
  ├── 01-spec-write.md         ← 01_specify 可用
  ├── 02-design-write.md       ← 02_design 可用
  ├── 03-research.md           ← 02_design 调研可用
  └── 04-task-decompose.md     ← 03_plan 可用

Sprint 2 — 后段 Skill（全链路闭环）
  ├── 05-code-trace.md         ← 04_implement 可用
  ├── 06-test-design.md        ← 05_verify 可用
  └── 07-archive.md            ← 06_wrap_up 可用
```

### 7.2 各 Sprint 验收标准

| Sprint | 里程碑 | 核心验收标准 |
|--------|--------|-------------|
| Sprint 0 | **安全基线** | 路径遍历漏洞修复；参数校验到位；JSON.parse 有保护 |
| Sprint 1 | **前段可用** | 01→02→03 三个阶段可通过 Skill 产出交付物；Session Catchup 可恢复上下文 |
| Sprint 2 | **全链路闭环** | 04→05→06 三个阶段可通过 Skill 产出交付物；完整 Feature 生命周期可走通 |

### 7.3 Skill 验证方法

每个 Skill .md 文件的验证流程：

```text
1. 在 Claude Code CLI 中通过 /skill 加载并执行完整流程
2. 在 Codex CLI 中通过 SKILL.md 加载并执行完整流程
3. 验证输出交付物文件名与 v5 规范对齐
4. 验证 CLI 命令调用正确（ID 注册、矩阵更新、Gate 校验）
5. 验证 Exit Gate 条件可通过
```

---

## 八、总结

### 8.1 交付物总览

| 类别 | 数量 | 明细 |
|------|------|------|
| Skill 指令文件 | 8 | 7 阶段生产 + 1 会话恢复 |
| references 参考文件 | 5 | spec/design/task/test/catchup 格式参考 |
| AGENTS.md | 1 | 全局指令（项目约定、CLI 命令清单） |
| 前置修复 | 5 | 2 P0 + 3 P1（代码审查报告关联项） |

### 8.2 与 v1 的关键差异

| 维度 | v1（15 个 TypeScript 模块） | v2（8 个 .md 指令文件） |
|------|---------------------------|------------------------|
| 实现形态 | TypeScript 类 + Handlebars 模板 | **Markdown 指令文件** |
| 运行时 | 自建 SkillRunner 调度器 | **AI Agent 原生能力** |
| AI 调用 | 程序化调 Claude API | **AI Agent 自身推理** |
| 跨平台 | 仅 Claude Code | **Claude Code + Codex CLI** |
| Skill 数量 | 15（含修复/校验/系统） | **8（纯生产 + 会话恢复）** |
| 新增代码量 | ~20 个源文件 + ~15 个测试 | **0 行代码**（纯 .md 文件） |
| 维护成本 | TypeScript 编译 + 测试 + 发版 | **编辑 .md 文件即生效** |

### 8.3 预期收益

完成全部 8 个 Skill 后，CLI 能力矩阵变化：

```text
                管理类           生产类              校验类
00_init         ✅ → ✅         ✅ → ✅             ✅ → ✅
01_specify      ✅ → ✅         ❌ → ✅ SK-01       ✅ → ✅
02_design       ✅ → ✅         ❌ → ✅ SK-02/03    ✅ → ✅
03_plan         ✅ → ✅         ❌ → ✅ SK-04       ✅ → ✅
04_implement    ✅ → ✅         ❌ → ✅ SK-05       ✅ → ✅
05_verify       ✅ → ✅         ❌ → ✅ SK-06       ✅ → ✅
06_wrap_up      ✅ → ✅         ❌ → ✅ SK-07       ✅ → ✅
07_release      ✅ → ✅         ❌ → ⚠️ checklist   ✅ → ✅
```

---

> **文档完成** | 共定义 **8 个 Skill 指令文件** | 跨平台：Claude Code + Codex CLI | 零新增代码
