# V2-02 Skill 运行时与路由

> **对齐需求**: aux-01-skill-system · core-01-overview · core-06-case
> **版本**: v2.1 | **日期**: 2026-02-10 | **原则**: KISS

---

## 1. 目标

统一 `/spec-first:*` 入口，支持两类路由：

1. **Skill 路由** — 加载 `.md` Skill 文件，进入 6 阶段执行模型（Phase 0-5）
2. **Runtime 路由** — 直接映射 CLI 原子命令（状态变更/查询）

---

## 2. 路由模型

### 2.1 路由分类表

| 路由类型 | 命令集 | 执行方式 |
|---------|--------|---------|
| **Skill 路由** | init, catchup, spec, design, research, task, code, code-review, test, archive, plan, verify, orchestrate, status, doctor, sync | 加载 Skill `.md` → 6 阶段模型 |
| **Runtime 路由** | stage, id, gate, matrix, rfc, defect, metrics, feature, commit, golive | 直接映射 `spec-first <cmd> <args>` |

### 2.2 路由判定流程

```text
用户输入: /spec-first:<cmd> [args]
  │
  ├─ cmd ∈ RUNTIME_COMMANDS → 解析 args → 调用 CLI `spec-first <cmd> <args>`
  │   (stage, id, gate, matrix, rfc, defect, metrics, feature, commit, golive)
  │
  └─ cmd ∈ SKILL_COMMANDS   → 定位 Skill 文件 → 进入 6 阶段执行模型
```

### 2.3 Skill 文件定位

```text
路径: skills/spec-first/<NN>-<cmd>/SKILL.md
示例: skills/spec-first/01-spec/SKILL.md
```

Skill 文件不存在时返回错误：`SKILL_NOT_FOUND: /spec-first:<cmd> 对应的 Skill 文件不存在`。

### 2.4 Skill 开发态→部署态映射

| 维度 | 开发态 | 部署态（npm 包安装后） |
|------|--------|----------------------|
| 路径 | `skills/spec-first/<NN>-<cmd>/SKILL.md` | `node_modules/spec-first/skills/spec-first/<NN>-<cmd>/SKILL.md` |
| 加载方式 | 源码目录直接读取 | `require.resolve` 定位包内资源 |
| 优先级 | 项目本地 `skills/` 优先（允许用户覆盖内置 Skill） | 包内 Skill 作为 fallback |

**解析顺序**：Skill Dispatcher 按以下顺序查找 SKILL.md：

```text
1. <projectRoot>/skills/spec-first/<NN>-<cmd>/SKILL.md  （本地覆盖）
2. <packageRoot>/skills/spec-first/<NN>-<cmd>/SKILL.md  （内置默认）
3. 均不存在 → SKILL_NOT_FOUND
```

**构建约束**：`tsup.config.ts` 需将 `skills/` 目录纳入 `assets`，确保 npm 发布时包含 Skill 文件。

---

## 3. 6 阶段执行模型（Phase 0-5）

每个 Skill 路由命令遵循统一的 6 阶段流程（Phase 0-5）：

```text
Phase 0 — Feature 定位
  ├── 用户传入 <featureId> → 直接使用
  └── 未传入 → 读取 .spec-first/current
        ├── 存在 → 使用，提示 "当前 Feature: <id>"
        └── 不存在 → 提示执行 /spec-first:init

Phase 1 — 上下文加载
  └── 调用 CLI: spec-first ai context <featureId>
      → 获取 Context Pack（control + references）

Phase 2 — AI 推理生成
  └── 根据 Skill 指令 + Context Pack 生成内容

Phase 3 — 用户确认（受 confirm_policy 控制）
  └── 展示生成内容 → [Critique & Refine] 循环

Phase 4 — 写入产出物
  ├── 写入目标文件
  └── 调用 CLI: spec-first id next <type> <abbr>（注册新 ID）

Phase 5 — 副作用执行
  ├── CLI: spec-first matrix check <featureId>
  ├── CLI: spec-first gate check <featureId>
  └── 更新运行态三文件（progress.md / findings.md / task_plan.md）
```

**强制约束**：
- Phase 3 不可跳过（除非 confirm_policy = auto 且满足白名单条件）
- Phase 4 中新 ID 必须通过 `spec-first id next` 注册，禁止手动编造
- Phase 5 中 Gate FAIL 时提示用户修正，不自动跳过

### 3.1 可测试状态机定义

> 将 6 阶段执行模型提取为确定性 TypeScript 状态机，使编排逻辑可编写单元测试。

```typescript
// src/core/skill-runtime/phase-machine.ts
type Phase = 'P0_LOCATE' | 'P1_CONTEXT' | 'P2_GENERATE' | 'P3_CONFIRM' | 'P4_WRITE' | 'P5_SIDE_EFFECT' | 'DONE' | 'ABORTED';

interface PhaseTransition {
  from: Phase;
  to: Phase;
  guard?: (ctx: SkillContext) => boolean;
}

const PHASE_TRANSITIONS: PhaseTransition[] = [
  { from: 'P0_LOCATE',      to: 'P1_CONTEXT' },
  { from: 'P1_CONTEXT',     to: 'P2_GENERATE' },
  { from: 'P2_GENERATE',    to: 'P3_CONFIRM' },
  { from: 'P3_CONFIRM',     to: 'P4_WRITE',       guard: confirmationGuard },
  { from: 'P3_CONFIRM',     to: 'P2_GENERATE' },  // 修改意见 → 重生成
  { from: 'P3_CONFIRM',     to: 'ABORTED' },       // 用户拒绝
  { from: 'P4_WRITE',       to: 'P5_SIDE_EFFECT' },
  { from: 'P5_SIDE_EFFECT', to: 'DONE' },
];

// Phase 3 确认守卫：未收到确认口令时阻断向 P4 转换
function confirmationGuard(ctx: SkillContext): boolean {
  return ctx.confirmResult === 'approved';
}
```

**测试策略**：
- 状态机转换规则可编写确定性单元测试（不依赖 AI 推理）
- `confirmationGuard` 可独立测试（mock `SkillContext`）
- Phase 2 的 AI 生成内容通过快照测试验证格式稳定性（非语义正确性）

### 4.1 三档策略

| 策略 | 行为 | 默认 |
|------|------|------|
| `strict` | 全量人工确认，未确认不落盘 | ✅ 默认 |
| `assisted` | AI 预填确认建议，用户一键确认 | 可选 |
| `auto` | 满足低风险白名单时自动确认 | 受限可选 |

### 4.2 自动判定矩阵

输入四维度：Mode、Size、NFR-SEC 新增/变更、新增外部接口。

| Mode | Size | NFR-SEC 变更 | 新增外部接口 | 判定 |
|------|------|-------------|-------------|------|
| I | S | 否 | 否 | `auto` |
| I | S | 是 | — | `strict` |
| I | S | — | 是 | `strict` |
| I | M/L | 任意 | 任意 | `assisted` |
| N | 任意 | 任意 | 任意 | `strict` |

**判定优先级**：安全关键/外部接口变更 → 强制 `strict` > Mode I + Size S → `auto` > 其余 Mode I → `assisted` > Mode N → `strict`。

### 4.3 auto 审计要求

`auto` 执行后必须写入 `findings.md`：

```markdown
## Auto-Confirm Audit
- **触发条件**: Mode I, Size S, 无 NFR-SEC, 无新增外部接口
- **风险等级**: 低
- **回滚点**: commit <sha> / PR #<number>
- **时间**: <ISO8601>
```

---

## 5. Phase 3 交互协议

### 5.1 确认口令

| 动作 | 接受输入（大小写不敏感） |
|------|----------------------|
| 确认放行 | `Y` / `确认` / `approve` |
| 拒绝终止 | `N` / `拒绝` / `abort` |
| 修改意见 | 任意其他文本 |

### 5.2 修改闭环规则

1. 用户输入修改意见 → 完整重生成 → 重新展示 → 再次确认
2. 最大修订轮次：**5 轮**
3. 超过 5 轮 → 提示二选一：继续修订（重置轮次）或终止（不落盘）
4. 每轮反馈追加写入 `findings.md`（轮次、差异摘要、最终决策）

### 5.3 落盘前置条件

未收到确认口令前，**严禁**进入 Phase 4（文件写入）和 Phase 5（副作用执行）。

---

## 6. Skill 编排关系

### 6.1 编排 Skill 调度阶段 Skill

```text
/spec-first:orchestrate（全流程）
  ├── /spec-first:init        → 00_init
  ├── /spec-first:plan（阶段规划）
  │     ├── /spec-first:spec      → 01_specify
  │     ├── /spec-first:design    → 02_design
  │     ├── /spec-first:research  → 02_design（可选）
  │     └── /spec-first:task      → 03_plan
  ├── /spec-first:code        → 04_implement
  ├── /spec-first:code-review → 04_implement
  ├── /spec-first:verify（校验评估）
  │     ├── /spec-first:test      → 05_verify
  │     └── /spec-first:archive   → 06_wrap_up
  └── Gate advance → 07_release
```

### 6.2 独立 Skill（任意阶段可调用）

`catchup`、`status`、`doctor`、`sync` — 不受阶段状态机约束。

### 6.3 日常最小路径

```text
/spec-first:init → /spec-first:plan → /spec-first:code
  → /spec-first:code-review → /spec-first:verify
```

---

## 7. verify quick / full 差异

| 维度 | `quick`（默认） | `full` |
|------|----------------|--------|
| SCA 范围 | 增量（本次变更涉及的产物） | 全量（所有产物） |
| Gate 条件 | 当前阶段 Exit Gate | 当前 + 所有已通过阶段回归 |
| 引用深度 | `depth=1` | `depth=2` |
| 覆盖率计算 | 当前阶段相关指标 | 全部 C1-C9 九项 |
| 适用场景 | 日常开发快速校验 | 阶段切换前 / PR 合并前 |

`/spec-first:orchestrate` 在阶段推进前自动使用 `full`。

---

## 8. 错误处理

| 场景 | 处理 |
|------|------|
| 未定位 Feature | 提示执行 `/spec-first:init` |
| Skill 文件不存在 | 返回 `SKILL_NOT_FOUND` |
| Gate FAIL | 阻断阶段推进，返回修复建议 |
| Phase 3 未确认 | 禁止写文件，保持当前状态 |
| Runtime 路由参数错误 | 返回 CLI `VALIDATION_ERROR` + 用法提示 |
| Context Pack 构建失败 | 返回 `CONTEXT_BUILD_ERROR`，提示检查产出物完整性 |

---

## 9. 最小实现清单

1. 命令解析器（namespace + subcommand + args 拆分）
2. Skill Dispatcher（加载 `.md` → 注入 Context Pack → 启动 6 阶段模型）
3. Runtime Dispatcher（args → CLI 命令映射 → 执行 → 返回结果）
4. confirm_policy Evaluator（四维度输入 → 策略输出）
5. Phase 3 交互循环（确认/拒绝/修改 → 轮次控制 → 审计记录）
6. 统一错误码映射（Skill 错误 + CLI 错误 → 用户友好提示）
