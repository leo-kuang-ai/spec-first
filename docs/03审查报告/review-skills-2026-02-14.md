# Skills 审查报告（对齐 v2/v7.1 Skill 体系与当前 CLI 实现）

> 日期：2026-02-14  
> 仓库：`/Users/kuang/xiaobu/spec-first`  
> 审查输入：  
> - `docs/01需求文档/v2/auxiliary/aux-01-skill-system.md`（Skill 指令体系）  
> - `docs/02技术方案/V2/v2-01/v2-03/v2-05/v2-06/v2-08`（路由模型、CLI 命令、ID/矩阵/Gate/Context Pack）  
> 审查范围：`skills/spec-first/**` + `src/core/skill-runtime/dispatcher.ts`

---

## 🎯 结论

当前 Skills **“看起来齐全，但大部分不可用”**：主要问题不是内容质量，而是 **命名冲突 + 路由优先级 + CLI 命令漂移**，导致 `/spec-first:*` 入口会解析到旧版（v5）Skill 或引用不存在的 CLI 子命令，直接破坏可用性与确定性。

---

## 📊 现状概述（清单与可用性）

### 1) skills/spec-first 目录现状

- SKILL 总数：24 个目录（含重复 skillName：`archive`×2、`research`×2、`catchup` 也被 `session-catchup` 影子覆盖）
- 两套风格并存：
  - **Legacy v5 风格**（带 YAML frontmatter，命令形态 `spec-ai/spec-id/spec-matrix/...`）：8 个
  - **v7.1 Draft 风格**（`# Skill: xxx`，列出 Phases/CLI Dependencies）：16 个

### 2) 当前代码实际的 Skill 解析行为（关键事实）

`src/core/skill-runtime/dispatcher.ts` 的解析规则是：

1. **Runtime 命令优先**：若 skillName ∈ `RUNTIME_COMMANDS`，直接走 CLI，不会加载 Skill 文件。  
2. **Skill 文件解析“遇到第一个后缀匹配就返回”**：存在同名后缀（如 `07-archive` 与 `10-archive`）时，较小序号通常会被优先解析，导致新版本 Skill 被旧版本覆盖。

因此，下表是“用户实际会命中的 Skill 文件”，不是目录里“看起来存在”的 Skill。

---

## ✅ 代码实现的 Skills 列表（按当前路由可触达的入口）

> 表中“解析到的 SKILL.md”基于当前 `readdirSync` 顺序（本机实测：`archive→07-archive`、`research→03-research`、`catchup→00-session-catchup`）。

| 用户入口 | 路由 | 实际解析到的 SKILL.md | 可执行性结论 | 主要阻断点 |
|---|---|---|---|---|
| `/spec-first:init` | Runtime | （不会加载 Skill） | ✅ 可用（CLI）/ ❌ 不符合 aux-01 期望（引导式 Skill） | `init` 被放入 `RUNTIME_COMMANDS`，Skill 形同虚设 |
| `/spec-first:doctor` | Runtime | （不会加载 Skill） | ✅ 可用（CLI）/ ❌ 不符合 aux-01 期望（Utility Skill） | `doctor` 被放入 `RUNTIME_COMMANDS` |
| `/spec-first:catchup` | Skill | `skills/spec-first/00-session-catchup/SKILL.md` | ❌ 不可用 | 依赖 `spec-ai`（不存在）；且交付物命名为 v5（tasks.md 等） |
| `/spec-first:spec` | Skill | `skills/spec-first/03-spec/SKILL.md` | ❌ 不可用 | 引用 `spec-first id generate` / `spec-first matrix update`（不存在） |
| `/spec-first:design` | Skill | `skills/spec-first/04-design/SKILL.md` | ❌ 不可用 | 引用 `spec-first id generate` / `spec-first matrix update`（不存在） |
| `/spec-first:research` | Skill | `skills/spec-first/03-research/SKILL.md` | ❌ 不可用 | 依赖 `spec-ai`（不存在） |
| `/spec-first:task` | Skill | `skills/spec-first/06-task/SKILL.md` | ❌ 不可用 | 引用 `spec-first id generate` / `spec-first matrix update`（不存在） |
| `/spec-first:code` | Skill | `skills/spec-first/07-code/SKILL.md` | ❌ 不可用（缺关键原子能力） | `spec-first matrix update` 不存在；无法完成“写回矩阵/状态” |
| `/spec-first:code-review` | Skill | `skills/spec-first/08-code-review/SKILL.md` | ✅ 基本可用 | 依赖命令存在；但“更新 TASK 状态”无原子命令支撑 |
| `/spec-first:test` | Skill | `skills/spec-first/09-test/SKILL.md` | ❌ 不可用 | `spec-first id generate TC` / `spec-first matrix update` 不存在 |
| `/spec-first:archive` | Skill | `skills/spec-first/07-archive/SKILL.md` | ❌ 不可用 | 依赖 `spec-ai/spec-metrics/spec-gate`（均非当前 CLI） |
| `/spec-first:plan` | Skill | `skills/spec-first/11-plan/SKILL.md` | ✅ 基本可用 | 偏“输出建议”，不涉及缺失 CLI |
| `/spec-first:verify` | Skill | `skills/spec-first/12-verify/SKILL.md` | ⚠️ 表面可用，语义不可信 | `gate check` 目前未纳入 SCA/安全等文档要求；verify 报告会失真 |
| `/spec-first:orchestrate` | Skill | `skills/spec-first/13-orchestrate/SKILL.md` | ⚠️ 依赖链不稳 | 依赖 `verify/gate` 的语义正确性；推进前置验证可能误判 |
| `/spec-first:status` | Skill | `skills/spec-first/14-status/SKILL.md` | ✅ 可用 | 只读聚合展示为主 |
| `/spec-first:sync` | Skill | `skills/spec-first/16-sync/SKILL.md` | ❌ 不可用 | `spec-first matrix update` 不存在；无法“反向同步”落地 |

---

## 🔎 逐个 Skill 审查（目录级别：存在但当前不可用的也计入）

### A. Legacy v5 风格（8 个）：整体不兼容当前 CLI / v2 ID 模型

这些 Skill 共同问题：
- 引用 `spec-ai/spec-id/spec-metrics/spec-matrix/spec-gate`（当前 CLI 不存在该命名空间）
- 交付物与 v2 目录结构漂移明显：`tasks.md/checklist.md/tests/*.test.md/retro.md` 等与 v2 的 `task_plan.md`、`reports/*`、`traceability-matrix.md` 不一致
- ID 模型与 v2-05 冲突：把 NFR/API 作为独立 ID

逐个结论：
- `00-session-catchup`：**被 `/spec-first:catchup` 实际命中**，但依赖 `spec-ai` → 直接不可用（P0）。
- `01-spec-write`：依赖 `spec-id next NFR`（v2 禁止独立 NFR ID），且命令名不匹配（P0）。
- `02-design-write`：依赖 `spec-id next API`（v2 不独立编号 API），命令名不匹配（P0）。
- `03-research`：**被 `/spec-first:research` 实际命中**，依赖 `spec-ai`（P0）。
- `04-task-decompose`：依赖 `spec-metrics/spec-id/spec-matrix`（P0），且产物为 `tasks.md` 非 v2 运行态 `task_plan.md`。
- `05-code-trace`：依赖 `spec-ai/spec-matrix`（P0）；且“Skill 不介入代码编写”与 v7.1 Skill 定位不一致。
- `06-test-design`：依赖 `spec-id/spec-metrics/spec-matrix`（P0），产物命名也与 v2 不一致。
- `07-archive`：**被 `/spec-first:archive` 实际命中**，依赖 `spec-gate`（P0）。

### B. v7.1 Draft 风格（16 个）：大量引用不存在的原子命令

共同问题：
- 多个 Skill 依赖 `spec-first id generate ...`（当前实现是 `spec-first id next ...`）
- 多个 Skill 依赖 `spec-first matrix update`（当前 CLI 只有 `check/export`，没有 update）
- 多个 Skill 输出文件名漂移：`fr-spec.md`、`design-spec.md`、`archive-summary.md` 等未被技术方案认可/未有模板支撑

逐个结论（只列“是否可按当前系统执行”的判定点）：
- `01-init`：**不可用 + 且不可达**（`/spec-first:init` 被 Runtime 覆盖）；还依赖 `spec-first id generate Feature`（不存在）。
- `02-catchup`：内容可用，但 **被 00-session-catchup 覆盖**，实际不可达。
- `03-spec`：不可用（`id generate FR`、`matrix update` 不存在）；输出 `fr-spec.md` 与 v2 不一致。
- `04-design`：不可用（`id generate DS`、`matrix update` 不存在）；输出 `design-spec.md` 与 v2 不一致。
- `05-research`：命令可用（`spec-first ai context`），但 **被 03-research 覆盖**，实际不可达。
- `06-task`：不可用（`id generate TASK`、`matrix update` 不存在）。
- `07-code`：不可用（依赖 `matrix update`）；且“auto-inject traces trailer”依赖 hooks/commit 生态完整性。
- `08-code-review`：命令存在且 references 齐全（相对可用）；但“更新 TASK 状态”缺少确定性 CLI 原子命令。
- `09-test`：不可用（`id generate TC`、`matrix update` 不存在）。
- `10-archive`：命令可用（`metrics report/gate check/stage advance`），但 **被 07-archive 覆盖**，实际不可达。
- `11-plan`：可用（只读 + 写 progress 建议），但写入行为缺少统一模板/审计约束。
- `12-verify`：可用（命令存在），但结果会被 Gate/SCA 当前实现差距污染（语义可信度问题）。
- `13-orchestrate`：可用（命令存在），但依赖 verify/gate 语义正确；否则编排会“自信地推进错误阶段”。
- `14-status`：可用（只读聚合）。
- `15-doctor`：内容可用，但 **不可达**（`/spec-first:doctor` Runtime 覆盖）。
- `16-sync`：不可用（`matrix update` 不存在），无法落地“反向同步”。

---

## ⚠️ 系统性问题（根因）

1) **SkillName 冲突导致“解析到错误版本”**（P0）  
- `catchup`、`research`、`archive` 都会解析到旧版 Skill，导致核心 Daily Path 入口直接不可用。

2) **Runtime/Skill 路由边界与 aux-01 文档不一致**（P0）  
- aux-01 期望 `init/doctor` 作为 Skill；当前实现强制走 Runtime，Skill 文件形同无效配置。

3) **Skill 依赖的原子能力缺失（matrix update / id generate）**（P0）  
- Skill 文件写得再好，也无法“确定性落盘”。这是“Skill 层与 CLI 层契约”未对齐。

4) `skills/spec-first/AGENTS.md` 全局指令严重过期（P1）  
- 宣称 Commander.js、spec-id/spec-ai、独立 NFR/API/ADR 等，与 `v2-05/v2-03` 冲突，会持续误导新增 Skill。

---

## 📋 行动清单（按优先级）

### P0（先让 `/spec-first:*` 入口可用）
1) **消除 skillName 冲突**：保证每个 `<skill-name>` 在 `skills/spec-first/` 下唯一；建议按 aux-01 目录结构重排（`01-catchup/02-spec/.../16-sync`）。  
2) **调整路由边界**：从 `RUNTIME_COMMANDS` 移除 `init` 与 `doctor`（按 aux-01 走 Skill 路由，由 Skill 内部调用 CLI）。  
3) **统一命令签名**：Skill 全面替换 `id generate` → `id next`；删除 `spec-*` 旧命令形态。  
4) **补齐缺失原子能力或回收 Skill 期望**：  
   - 要么实现 `spec-first matrix update`（确定性更新矩阵行），  
   - 要么修改 Skill：不再宣称会写回矩阵（但这会破坏 traceability 的闭环目标）。

### P1（让 Skill 与 v2/v7.1 规范“可维护”）
5) 统一产物命名：`spec.md/design.md/task_plan.md/reports/*/retro.md` 等与 v2 技术方案一致；避免 `fr-spec.md/design-spec.md` 产生第二套真相源。  
6) 修订 `skills/spec-first/AGENTS.md`：以 `v2-03/v2-05` 为准，删除 Commander.js/spec-id/NFR-xxx/API-xxx 等冲突内容。  
7) 对齐 aux-01：补齐 YAML frontmatter 与 6 阶段执行模型的字段（尤其是参数约定与 confirm_policy 的契约）。

### P2（体验与工程化）
8) 增加“Skill 解析自检”测试：对所有 `/spec-first:<skill>` 做解析快照，确保不会回退到旧版或走错 Runtime。  
9) 增加构建脚本：按 aux-01 “部署态映射”自动展平到宿主目录（否则多端宿主无法一致加载）。

---

## ✅ 已阅读清单

- `docs/01需求文档/v2/auxiliary/aux-01-skill-system.md`
- `docs/02技术方案/V2/v2-01-总体技术架构.md`
- `src/core/skill-runtime/dispatcher.ts`
- `skills/spec-first/**/SKILL.md`

