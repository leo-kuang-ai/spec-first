# Spec-First v7.1 — Skill 指令体系

> **模块**: 辅助功能模块 #1 | **拆分自**: spec-first-v7.md L1032-1186
> **版本**: v7.1 | **更新**: 2026-02-09
> **变更**: 统一 `/spec-first:xxxx` 命名空间，消除双入口分裂

---

## 设计理念

Skill 是 Spec-First 双层架构中的 **驱动层**，以 `.md` 文件形式定义 AI Agent 在每个阶段的行为指令。Skill 负责流程编排与阶段流转触发，封装经过验证的最佳实践 prompt 和执行流程，消除个体 AI 使用差异。

**核心原则**：

1. **统一命名空间** — 所有 Skill 统一使用 `/spec-first:<skill-name>` 格式调用，无例外
2. **三层分类** — 阶段 Skill（Stage）、编排 Skill（Coordination）、工具 Skill（Utility）各司其职
3. **平台无关** — Skill 文件不依赖特定 AI 宿主语法，支持 Claude Code / Codex CLI 等多平台
4. **CLI 底层驱动** — Skill 编排流程，CLI 执行确定性操作，两层职责不交叉

---

## 统一用户入口路由模型

用户统一通过 `/spec-first:xxxx` 调用能力，入口分为两类：

- **Skill 路由**：调用对应 Skill（适用于生成、编排、交互引导）。
- **Runtime 路由**：直接路由到 CLI 原子命令（适用于状态变更、ID/Gate/RFC 等确定性操作）。

> 结论：`/spec-first:*` 是统一用户入口命名空间，不等于“只能调用 Skill”。

---

## Skill 文件规范

### 目录结构

所有 Skill 文件统一存放于 `.claude/commands/spec-first/` 目录：

```text
.claude/commands/spec-first/
├── catchup.md          # 会话恢复
├── spec.md             # 需求规格化
├── design.md           # 技术设计
├── research.md         # 技术调研
├── task.md             # 任务拆解
├── code.md             # 规范驱动开发
├── code-review.md      # 代码评审
├── test.md             # 测试设计
├── archive.md          # 归档复盘
├── plan.md             # 阶段规划编排
├── verify.md           # 校验与质量评估
├── orchestrate.md      # 全流程编排
├── init.md             # 引导式初始化
├── status.md           # 状态概览
├── doctor.md           # 环境诊断
└── sync.md             # 反向同步
```

**命名规则**：文件名即 Skill 标识（kebab-case），调用格式为 `/spec-first:<filename-without-ext>`。

### references/ 子目录机制

部分 Skill 需要引用外部审查清单、模板等参考资料。这些资料以 `references/` 子目录形式与 Skill 主文件共存于实现目录中：

```text
skills/spec-first/<NN>-<skill-name>/
├── SKILL.md                    # Skill 主文件（6 阶段执行指令）
└── references/                 # 审查参考清单（可选）
    ├── <checklist-1>.md
    └── <checklist-2>.md
```

**适用规则**：

- `references/` 为可选目录，仅当 Skill 需要引用结构化参考资料时创建
- 参考资料为通用工程最佳实践时，可从外部项目原样复用，不做 Spec-First 特化改动
- Skill 主文件（SKILL.md）中通过相对路径引用：`参考 references/<filename>.md`
- 当前使用 `references/` 的 Skill：`code-review`（含 4 份审查清单，详见 [`code-review-integration.md` 第八章](../../02技术方案/V2/code-review-integration.md#八skill-文件结构与参考清单)）

### 文件格式

每个 Skill 文件遵循统一格式：

```yaml
---
name: spec-first:<skill-name>    # 完整命令标识
description: <one-line-desc>      # 一句话描述
category: stage | coordination | utility
stage: <stageId>                  # 对应阶段（utility 类可省略）
---
```

文件体为 Markdown 格式的指令内容，包含：角色定义、上下文加载步骤、执行步骤、输出规范、完成后动作。

---

## 16 个 Skill 完整定义

### A. 阶段 Skill（Stage）— 9 个

每个阶段 Skill 对应流程中的一个具体阶段，封装该阶段的 AI 辅助最佳实践。

| 命令 | 名称 | 对应阶段 | 职责 |
|------|------|---------|------|
| `/spec-first:catchup` | 会话恢复 | 任意阶段 | 会话中断后恢复上下文，同步追踪产物 |
| `/spec-first:spec` | 需求规格化 | 01_specify | 辅助生成结构化 spec.md，分配 FR/NFR ID |
| `/spec-first:design` | 技术设计 | 02_design | 辅助生成 design.md、contracts/、data-model.md |
| `/spec-first:research` | 技术调研 | 02_design | 辅助技术可行性调研，生成 research.md |
| `/spec-first:task` | 任务拆解 | 03_plan | 辅助生成 task_plan.md，分配 TASK ID |
| `/spec-first:code` | 规范驱动开发 | 04_implement | 辅助按 TASK 编码，确保追踪注释 |
| `/spec-first:code-review` | 代码评审 | 04_implement | 对实现进行追踪合规与质量审查，生成 `reports/code-review-report.md` |
| `/spec-first:test` | 测试设计 | 05_verify | 辅助生成测试用例，计算测试覆盖率 |
| `/spec-first:archive` | 归档复盘 | 06_wrap_up | 执行归档审计，生成复盘报告 |

### B. 编排 Skill（Coordination）— 3 个

编排 Skill 是多阶段的高层指挥官，内部按需调度阶段 Skill，用户日常优先使用此类。

| 命令 | 名称 | 编排范围 | 职责 |
|------|------|---------|------|
| `/spec-first:plan` | 阶段规划 | 01_specify → 03_plan | 编排需求→设计→任务拆解，依次调度 `:spec` → `:design` → `:task` |
| `/spec-first:verify` | 校验评估 | 05_verify → 06_wrap_up | 编排测试→归档，依次调度 `:test` → `:archive` |
| `/spec-first:orchestrate` | 全流程编排 | 00_init → 06_wrap_up | 端到端编排，按阶段状态机自动调度对应 Skill |

### C. 工具 Skill（Utility）— 4 个

工具 Skill 提供跨阶段的辅助能力，AI 在其中增加交互引导和智能诊断价值。

| 命令 | 名称 | 职责 |
|------|------|------|
| `/spec-first:init` | 引导式初始化 | 无参交互式命令；引导用户选择 mode/size/platforms，调用 `spec-first init` 创建 Feature |
| `/spec-first:status` | 状态概览 | 聚合 stage-state + progress + metrics，输出健康度摘要 + 三类告警（缺文件/阶段不一致/关键文件过旧，仅告警不阻断） |
| `/spec-first:doctor` | 环境诊断 | 调用 `spec-first doctor`，对异常项给出 AI 修复建议 |
| `/spec-first:sync` | 反向同步 | 扫描代码与文档偏差，辅助生成 RFC 或自动更新文档（Hotfix 模式） |

---

## Skill 编排关系

编排 Skill 内部按阶段状态机调度阶段 Skill，形成层级调用链：

```text
/spec-first:orchestrate（全流程编排）
  │
  ├── /spec-first:init        → 00_init
  ├── /spec-first:plan（阶段规划编排）
  │     ├── /spec-first:spec      → 01_specify
  │     ├── /spec-first:design    → 02_design
  │     ├── /spec-first:research  → 02_design（可选）
  │     └── /spec-first:task      → 03_plan
  ├── /spec-first:code        → 04_implement（实现）
  ├── /spec-first:code-review → 04_implement（评审）
  ├── /spec-first:verify（校验评估编排）
  │     ├── /spec-first:test      → 05_verify
  │     └── /spec-first:archive   → 06_wrap_up
  └── Gate advance            → 07_release

/spec-first:catchup（任意阶段可独立调用）
/spec-first:status（任意阶段可独立调用）
/spec-first:doctor（任意阶段可独立调用）
/spec-first:sync（任意阶段可独立调用）
```

**调用优先级**：日常使用优先用编排 Skill（`:plan` / `:verify` / `:orchestrate`），仅需单阶段精细操作时才直接调用阶段 Skill。

---

## 命令速查表

| 命令 | 调用示例 | 类别 |
|------|---------|------|
| `/spec-first:init` | `/spec-first:init` | Utility |
| `/spec-first:catchup` | `/spec-first:catchup <featureId>` | Stage |
| `/spec-first:spec` | `/spec-first:spec <featureId>` | Stage |
| `/spec-first:design` | `/spec-first:design <featureId>` | Stage |
| `/spec-first:research` | `/spec-first:research <featureId> "<topic>"` | Stage |
| `/spec-first:task` | `/spec-first:task <featureId>` | Stage |
| `/spec-first:code` | `/spec-first:code <featureId> [--task <taskId>]` | Stage |
| `/spec-first:code-review` | `/spec-first:code-review <featureId> [--task <taskId>]` | Stage |
| `/spec-first:test` | `/spec-first:test <featureId>` | Stage |
| `/spec-first:archive` | `/spec-first:archive <featureId>` | Stage |
| `/spec-first:plan` | `/spec-first:plan <featureId> "<task>"` | Coordination |
| `/spec-first:verify` | `/spec-first:verify <featureId> [quick\|full]` | Coordination |
| `/spec-first:orchestrate` | `/spec-first:orchestrate <featureId> "<task>"` | Coordination |
| `/spec-first:status` | `/spec-first:status <featureId>` | Utility |
| `/spec-first:doctor` | `/spec-first:doctor` | Utility |
| `/spec-first:sync` | `/spec-first:sync <file_path>` | Utility |

#### `/spec-first:verify` quick / full 检查范围差异

| 维度 | `quick`（默认） | `full` |
|------|----------------|--------|
| SCA 范围 | 增量（仅本次变更涉及的产物） | 全量（所有产物） |
| Gate 条件 | 当前阶段 Exit Gate | 当前 + 所有已通过阶段回归 |
| 引用深度 | `depth=1`（直接邻居） | `depth=2`（二级关联） |
| 覆盖率计算 | 仅当前阶段相关指标 | 全部 9 项覆盖率 |
| 适用场景 | 日常开发中快速校验 | 阶段切换前 / PR 合并前 |

> 未指定时默认 `quick`。`/spec-first:orchestrate` 在阶段推进前自动使用 `full`。

### Runtime 路由命令（非 Skill）

| 用户入口 | 路由目标（CLI） | 用途 |
|------|---------|------|
| `/spec-first:stage current --feature <featureId>` | `spec-first stage current <featureId>` | 查询当前阶段 |
| `/spec-first:stage advance --feature <featureId>` | `spec-first stage advance <featureId>` | 推进阶段 |
| `/spec-first:stage cancel --feature <featureId> --reason "<reason>"` | `spec-first stage cancel <featureId> --reason "<reason>"` | 取消 Feature |
| `/spec-first:id ...` | `spec-first id ...` | ID 生成/校验/查询 |
| `/spec-first:gate ...` | `spec-first gate ...` | Gate 校验 |
| `/spec-first:matrix ...` | `spec-first matrix ...` | 追踪矩阵校验/导出 |
| `/spec-first:rfc ...` | `spec-first rfc ...` | 变更管理 |
| `/spec-first:defect ...` | `spec-first defect ...` | 缺陷管理 |

> Skill 命令参数以自然语言为主；Runtime 路由命令参数遵循 CLI 命令签名。

---

## 3 分钟上手（Daily Path）

日常使用默认走最小路径，避免用户记忆全部 16 个 Skill：

1. 初始化（首次或切换 Feature）：`/spec-first:init`
2. 规划：`/spec-first:plan <featureId> "<task>"`
3. 实现：`/spec-first:code <featureId> [--task <taskId>]`
4. 评审：`/spec-first:code-review <featureId> [--task <taskId>]`
5. 校验：`/spec-first:verify <featureId> [quick|full]`

> 默认顺序：`plan → code（+code-review）→ verify`

**扩展命令触发条件**：

| 场景 | 建议命令 |
|------|---------|
| 会话中断/上下文丢失 | `/spec-first:catchup` |
| 手工改动后需回填文档 | `/spec-first:sync <file_path>` |
| 需求/设计正式变更 | `/spec-first:rfc ...` |
| 首次环境诊断 | `/spec-first:doctor` |
| 查看健康度与阶段状态 | `/spec-first:status` |

---

## 6 阶段执行模型

每个阶段 Skill 遵循相同的 6 阶段执行流程（Phase 0-5）：

```text
Phase 0 — Feature 定位
  ├── 用户显式传入 <featureId> → 直接使用
  └── 未传入 → 读取 .spec-first/current
        ├── 存在 → 使用当前 Feature，提示 "当前 Feature: <id>"
        └── 不存在 → 提示用户执行 /spec-first:init（初始化 Feature）

Phase 1 — 上下文加载
  ├── spec-first ai context <featureId>（获取 Context Pack）
  └── 读取阶段相关交付物

Phase 2 — AI 推理生成
  └── 根据 Skill 指令生成内容（纯 AI 推理，无 CLI 调用）

Phase 3 — 用户确认与交互式修正
  ├── 展示生成内容
  └── 进入 [Critique & Refine] 循环：
        ├── 询问 "是否接受？(Y/N) 或输入修改意见"
        ├── 若输入 "Y" → 进入 Phase 4
        └── 若输入意见 → 根据意见重新生成 → 再次展示 → 循环 Phase 3

Phase 4 — 写入交付物
  ├── 写入目标文件
  └── spec-first id next <type> <abbr>（注册新 ID）

Phase 5 — 副作用执行
  ├── spec-first matrix check <featureId>（更新追踪矩阵）
  ├── spec-first gate check <featureId>（校验 Gate）
  └── 更新运行态三文件（stage-state.json / findings.md / task_plan.md）
```

**强制约束**：

- Phase 3 不可跳过：AI 生成内容后必须展示给用户确认，确认后才写入文件
- Phase 4 中所有新 ID 必须通过 `spec-first id next` 注册，禁止手动编造
- Phase 5 中 Gate 校验失败时，提示用户修正而非自动跳过

### Phase 3 交互协议（强制）

为避免"用户反馈无法收敛"导致流程失效，所有 Skill 在 Phase 3 必须执行统一交互协议：

1. **确认口令标准化**：接受 `Y` / `确认` / `approve`（大小写不敏感）作为唯一放行信号。
2. **拒绝口令标准化**：接受 `N` / `拒绝` / `abort`，终止本轮并返回上一级命令，不写入任何文件。
3. **修改闭环**：用户输入任意修改意见时，必须完整重生成并重新展示，不得只做局部口头承诺。
4. **落盘前置条件**：未收到确认口令前，严禁进入 Phase 4（文件写入）和 Phase 5（副作用执行）。
5. **最大修订轮次**：默认最多 5 轮；超过后必须提示用户二选一：
   - 继续修订（重置轮次并保留历史意见）。
   - 终止并输出当前差异摘要（不落盘）。
6. **审计记录**：每轮用户反馈需追加写入 `findings.md`（含轮次、差异摘要、最终决策）。

### confirm_policy（受控快速通道）

为平衡效率与治理，Phase 3 支持三档确认策略：

| 策略 | 行为 | 默认值 |
|------|------|-------|
| `strict` | 全量人工确认，不满足确认口令则不落盘 | ✅ 默认 |
| `assisted` | AI 预填确认建议，用户一键确认后落盘 | 可选 |
| `auto` | 满足低风险白名单时自动确认并继续执行 | 可选（受限） |

`auto` 仅在以下条件全部满足时可用：

1. `Mode I`（迭代模式）
2. `Size S`
3. 非安全关键（无 `NFR-SEC-*` 新增/变更）
4. 不新增外部接口（无新增公开 API 契约）

任一条件不满足，必须自动降级为 `strict`。

`auto` 执行后必须写入审计记录（`findings.md`）：

- 触发规则（命中白名单条件明细）
- 风险等级（低/中/高）
- 回滚点（对应 commit/PR 或产物快照定位）

### confirm_policy 决策矩阵（自动判定）

平台侧必须基于 `Mode / Size / NFR-SEC / 外部接口变更` 四个维度自动判定 `confirm_policy`：

| Mode | Size | NFR-SEC 新增/变更 | 新增外部接口 | 判定策略 | 说明 |
|------|------|------------------|-------------|---------|------|
| I | S | 否 | 否 | `auto` | 唯一允许自动确认的低风险白名单 |
| I | S | 是 | 否 | `strict` | 安全关键变更，禁止自动确认 |
| I | S | 否 | 是 | `strict` | 对外契约变化，禁止自动确认 |
| I | M/L | 任意 | 任意 | `assisted` | 中大规模迭代默认保留人工确认 |
| N | 任意 | 任意 | 任意 | `strict` | 新功能开发默认全量人工确认 |

**判定优先级**（从高到低）：

1. 命中安全关键或外部接口变更 → 强制 `strict`
2. 其余场景若为 `Mode I + Size S` → `auto`
3. 其余 `Mode I` 场景 → `assisted`
4. `Mode N` 一律 `strict`

---

## 跨平台兼容

Skill 文件设计为平台无关，支持多种 AI 宿主：

| 宿主 | Skill 目录 | 调用方式 |
|------|-----------|---------|
| **Claude Code** | `.claude/commands/spec-first/` | `/spec-first:<skill-name>` |
| **Codex CLI** | 同目录（符号链接或复制） | 自动识别 `SKILL.md` 格式 |
| **其他 Agent** | 按宿主约定映射 | 通过 Context Pack 传递指令 |

**兼容性约束**：

- Skill 文件中不得使用任何平台特有语法
- CLI 命令调用统一使用 Bash 代码块，所有平台均可执行
- 交互确认统一使用自然语言提示，不依赖特定 UI 组件

---

## Context Pack 标准

跨 Agent 委派时，必须携带统一格式的上下文包，确保任意 Agent 可恢复完整语境。

```yaml
# context-pack.yaml — 跨 Agent 统一输入格式（Control + References）
context_pack:
  version: "2.0"
  control:
    feature_meta:
      id: "FSREQ-20260209-AUTH-001"
      title: "用户认证模块"
      mode: N
      size: S
      platforms: [h5, java-backend]
    constitution: "constitution.md"
    current_phase: "04_implement"
    current_task: "TASK-AUTH-001"
    artifacts:
      matrix: "specs/<featureId>/traceability-matrix.md"
      progress: "specs/<featureId>/stage-state.json"
  references:
    - path: "specs/<featureId>/spec.md"
      selector: "FR-AUTH-*"
      reason: "current_task_related"
      checksum: "<sha256>"
      mtime: "2026-02-09T10:30:00Z"
    - path: "specs/<featureId>/design.md"
      selector: "DS-AUTH-*"
      reason: "current_task_related"
      checksum: "<sha256>"
      mtime: "2026-02-09T10:31:00Z"
```

**强制约束**：

- 每次 Agent 委派必须生成 Context Pack，禁止口头传递上下文
- `control.artifacts` 路径必须指向实际存在的文件
- `control.current_phase` 和 `control.current_task` 必须与 `stage-state.json` 记录一致
- `platforms` 必须与 `--platforms` 参数共享同一枚举，使用 kebab-case 并按字典序输出
- `references` 中每个条目必须包含 `path`、`selector`、`reason`、`checksum`、`mtime`

### Context Slicing（动态剪裁策略）

为防止 Context Pack 超出 Token 限制，CLI `spec-first ai context` 必须支持基于阶段的动态剪裁（Slicing）：

| 阶段 | 核心上下文 (L1) | 活跃上下文 (L2) | 聚焦上下文 (L3) |
|------|---------------|----------------|----------------|
| **01 Specify** | Constitution | 历史 Spec (Mode I) | 当前编辑的 FR/NFR |
| **02 Design** | Constitution + Spec | 现有架构文档 | 当前 FR 关联的 DS/API |
| **04 Implement** | Constitution | Spec + Design + Contracts | **Current TASK** + 关联 FR/AC + 关联 API |
| **05 Verify** | Constitution | Spec + Design + Task Plan | **Current TC** + 关联 FR/AC |

**剪裁算法**：
1. **L1 全局加载**：始终加载 Constitution 及 Project Meta。
2. **L2 阶段加载**：仅加载当前阶段强依赖的上游产出物（如 Code 阶段仅需 API 定义，无需 Design 演进历史）。
3. **L3 邻居加载**：基于 `traceability-matrix.md` 的引用关系，仅提取与 Current ID 直接关联的上下游条目（Depth=1）。

**预算与降级规则**：

- **硬限制**：`control` 体积必须 `<2KB`；超限视为构建失败。
- **推荐预算**：推理上下文总预算默认 8K tokens；其中 L1 ≤ 20%，L2 ≤ 30%，L3 ≥ 50%。
- **超限降级顺序**：
  1. 裁剪 L2 非强依赖内容（优先移除历史演进记录）。
  2. L3 从全量条目降为 Top-N（按 `当前阶段相关性 > 最近变更时间 > 风险等级` 排序）。
  3. 仍超限时，`control` 仅保留 ID 列表 + 摘要，正文通过 `references` 按需拉取。

### Context Reference（按需读取机制）

为避免复杂 Feature（尤其 Size L）一次性打包丢失关键信息，接收端 Agent 必须支持 `references` 按需读取：

1. 先加载 `control`，恢复当前阶段与当前任务。
2. 根据 `references` 的 `reason + selector` 拉取最小必要片段。
3. 读取后校验 `checksum` 与 `mtime`，不一致时触发重新索引。

**规模策略**：

| 规模 | 默认策略 | 说明 |
|------|---------|------|
| S | inline-first | 优先 `control` + 少量引用 |
| M | hybrid | `control` + 关键引用并行 |
| L | references-first | `control` 仅保留索引，正文全部按需读取 |

**引用读取约束**：

- 默认 `max_refs=20`（S/M），`max_refs=50`（L）
- 默认 `depth=1`（仅直接邻居）；仅在 `full` 校验时可提升到 `depth=2`
- 引用排序：`当前阶段相关性 > 最近变更时间 > 风险等级`

---

## Session Catchup 机制（轻量版）

> 统一入口：`/spec-first:catchup <featureId>`。

**触发条件**：会话中断后手动调用；编排 Skill 检测到上下文缺失时可提示调用。

**恢复流程**（轻量 6 步）：

1. 读取 `stage-state.json`（当前阶段）
2. 读取 `task_plan.md`（当前规划状态）
3. 读取 `stage-state.json`（已完成进度）
4. 读取 `findings.md`（关键发现）
5. 定位当前阶段和当前 TASK，并标记缺失文件
6. 输出恢复摘要到终端，继续执行

**边界约束**：

- `MUST` 使用文件恢复单通道（`stage-state.json` + 运行态三文件）。
- `MUST NOT` 扫描 transcript/会话日志进行恢复。
- `MUST` 在恢复摘要中输出缺失文件清单。

**恢复后校验（轻量）**：仅输出三类告警（缺文件、阶段不一致、关键文件过旧），默认不阻断阶段推进。

---

*aux-01-skill-system.md 完成 — 下一篇：[aux-02-cli-system.md](aux-02-cli-system.md)*
