# Skill 审查报告

> **日期**: 2026-02-14 | **审查人**: Leo + Claude | **状态**: 最终结论（已复核，覆盖初审不严谨点）

---

## 一、审查范围

| 类别 | 数量 | 路径 |
|------|------|------|
| 当前 Skill（v2） | 16 | `skills/spec-first/01-init` ~ `16-sync` |
| Legacy Skill（v1） | 8 | `skills/spec-first/00-session-catchup` ~ `07-archive` |
| 共享上下文 | 1 | `skills/spec-first/AGENTS.md` |
| 路由分发器 | 1 | `src/core/skill-runtime/dispatcher.ts` |

交叉参照：`src/shared/types.ts`（ID类型定义）、`src/cli/commands/*.ts`（实际 CLI 命令）、`docs/03开发任务/`（任务文档）

---

## 🎯 最终结论（以此为准）

结论：本文 “P0/P1/P2” 所列问题 **均可在当前仓库复现**，并且属于“系统性不可用”而非“文档小瑕疵”。最致命根因是：

1. **SkillName 冲突/影子覆盖**：`/spec-first:catchup|research|archive` 会被 legacy 版本抢占解析（见 P0-4），入口直接不可用。  
2. **Skill ↔ CLI 契约漂移**：多个 v2 Skill 调用不存在子命令（`spec-first id generate`、`spec-first matrix update`），即使可达也会失败（见 P0-1/P0-2）。  
3. **路由边界偏差**：`init/doctor` 被 dispatcher 强制走 Runtime，Skill 文件不可达（见 P0-5）。

同时，本版本修正 2 处初审表述错误（以免误导修复方向）：
- “`spec-first id generate` 被 6 个 v2 Skill 引用”应为 **5 个**（表格本身列的是 5 个）。  
- Dispatcher “`golive` 路由不正确”这一条 **撤销**：CLI 已注册顶层 `golive` 命令（见 `src/cli/index.ts`），只是实现文件复用 `src/cli/commands/gate.ts`。

---

## 二、问题汇总

| 级别 | 数量 | 说明 |
|------|------|------|
| P0（阻断性） | 5 | 运行时必崩或 Skill 不可达（含影子覆盖） |
| P1（功能性） | 5 | 语义不一致 — 与代码实现脱节 |
| P2（规范性） | 4 | 文档过时 — 不影响运行但误导开发 |

---

## 三、P0 问题（阻断性）

### P0-1: 5 个 v2 Skill 引用不存在的 CLI 命令 `spec-first id generate`

实际 CLI 命令是 `spec-first id next <type> <abbr> --feature <featureId>`，不存在 `id generate` 子命令。

| Skill | 引用的错误命令 | 应改为 |
|-------|---------------|--------|
| 01-init | `spec-first id generate Feature` | Feature ID 由 `spec-first init` 内部生成，无需单独调用 |
| 03-spec | `spec-first id generate FR` | `spec-first id next FR <abbr> --feature <featureId>` |
| 04-design | `spec-first id generate DS` | `spec-first id next DS <abbr> --feature <featureId>` |
| 06-task | `spec-first id generate TASK` | `spec-first id next TASK <abbr> --feature <featureId>` |
| 09-test | `spec-first id generate TC` | `spec-first id next TC <abbr> --feature <featureId>` |

---

### P0-2: 6 个当前 Skill 引用不存在的 CLI 命令 `spec-first matrix update`

实际 CLI 只有 `matrix check` 和 `matrix export`，不存在 `matrix update` 子命令。

补充（避免“误删 update 逻辑”导致闭环退化）：  
`id next` 仅覆盖“新增一行（Planned）”的写入；但 v2 追踪闭环还需要确定性写回 `title/status/upstream/downstream`（例如 FR→DS/TASK/TC 映射、状态推进、回填信息）。因此本问题的修复不应简单替换成 `matrix check`，应二选一：
- A) 实现 `spec-first matrix update`（推荐，契合 v2-05/v2-06 的工具链目标）；或  
- B) 回收 Skill 对“写回矩阵”的承诺（代价：traceability 闭环变成强依赖人工编辑）。

| Skill | 引用 `matrix update` |
|-------|---------------------|
| 03-spec | ✓ |
| 04-design | ✓ |
| 06-task | ✓ |
| 07-code | ✓ |
| 09-test | ✓ |
| 16-sync | ✓ |

---

### P0-3: AGENTS.md 存在 26 处 CLI 命令名错误（非全部）

AGENTS.md 是所有 Skill 的共享上下文，其中大量 CLI 命令参考使用了错误的命令名格式（例如 `spec-id/spec-ai/spec-matrix/...`）：

| AGENTS.md 中的命令 | 实际 CLI 命令 |
|-------------------|-------------|
| `spec-id next` | `spec-first id next` |
| `spec-id validate` | `spec-first id validate` |
| `spec-id list` | `spec-first id list` |
| `spec-gate check` | `spec-first gate check` |
| `spec-gate conditions` | `spec-first gate conditions` |
| `spec-gate history` | `spec-first gate history` |
| `spec-stage current` | `spec-first stage current` |
| `spec-stage advance` | `spec-first stage advance` |
| `spec-stage cancel` | `spec-first stage cancel` |
| `spec-matrix check` | `spec-first matrix check` |
| `spec-matrix export` | `spec-first matrix export` |
| `spec-metrics coverage` | `spec-first metrics coverage` |
| `spec-metrics report` | `spec-first metrics report` |
| `spec-ai context` | `spec-first ai context` |
| `spec-ai catchup` | `spec-first ai catchup` |
| `spec-ai stats` | `spec-first ai stats` |
| `spec-rfc create` | `spec-first rfc create` |
| `spec-rfc submit` | `spec-first rfc submit` |
| `spec-rfc transition` | `spec-first rfc transition` |
| `spec-rfc list` | `spec-first rfc list` |
| `spec-rfc get` | `spec-first rfc get` |
| `spec-defect register` | `spec-first defect register` |
| `spec-defect update` | `spec-first defect update` |
| `spec-defect list` | `spec-first defect list` |
| `spec-defect get` | `spec-first defect get` |
| `spec-defect escape-rate` | `spec-first defect escape-rate` |

共 26 处命令名错误。

---

### P0-4: 3 个 Skill 名称冲突 — Legacy 遮蔽当前版本导致不可达

`findSkillFile`（dispatcher.ts:127）使用 `entry.endsWith(`-${skillName}`)` 匹配，并且**第一个匹配即返回**。在当前环境下 `readdirSync` 观测到的目录顺序会先命中 legacy 条目，因此当 legacy 与 current Skill 同名时会发生遮蔽；该风险来自“首个匹配返回”策略本身，而非依赖某个固定排序保证。

| 用户入口 | 实际解析到 | 期望解析到 | 后果 |
|---------|-----------|-----------|------|
| `/spec-first:catchup` | `00-session-catchup/SKILL.md`（legacy） | `02-catchup/SKILL.md`（v2） | legacy 依赖 `spec-ai`（不存在），直接不可用 |
| `/spec-first:research` | `03-research/SKILL.md`（legacy） | `05-research/SKILL.md`（v2） | legacy 依赖 `spec-ai`（不存在），直接不可用 |
| `/spec-first:archive` | `07-archive/SKILL.md`（legacy） | `10-archive/SKILL.md`（v2） | legacy 依赖 `spec-gate`/`spec-metrics`（不存在），直接不可用 |

3 个核心日常路径入口（catchup/research/archive）全部指向不可用的 legacy Skill。

---

### P0-5: 2 个 Skill 被 RUNTIME_COMMANDS 覆盖 — Skill 文件形同虚设

`dispatcher.ts:28-32` 的 `RUNTIME_COMMANDS` 包含 `init` 和 `doctor`，导致 `/spec-first:init` 和 `/spec-first:doctor` 直接走 Runtime 路由（CLI 原子命令），**永远不会加载对应的 Skill 文件**。

| 用户入口 | 路由结果 | Skill 文件 | 后果 |
|---------|---------|-----------|------|
| `/spec-first:init` | Runtime → `spec-first init` | `01-init/SKILL.md` 不可达 | aux-01 期望 init 为引导式 Skill（6 阶段），实际只执行 CLI 原子命令 |
| `/spec-first:doctor` | Runtime → `spec-first doctor` | `15-doctor/SKILL.md` 不可达 | aux-01 期望 doctor 为 Utility Skill，实际只执行 CLI 原子命令 |

**影响**：16 个当前 Skill 中，5 个不可达（catchup/research/archive 被遮蔽 + init/doctor 被 Runtime 覆盖），实际可达率 = 11/16（69%）。

---

## 四、P1 问题（功能性）

### P1-1: AGENTS.md 执行模型与代码不一致 — 5 阶段 vs 6 阶段

AGENTS.md 定义 "5 阶段执行流程"（Phase 1-5），但 `phase-machine.ts` 和所有 16 个当前 Skill 使用 6 阶段模型（P0-P5）：

| AGENTS.md | 实际代码 |
|-----------|---------|
| Phase 1 — 上下文加载 | P0_LOCATE + P1_CONTEXT |
| Phase 2 — AI 推理生成 | P2_GENERATE |
| Phase 3 — 用户确认 | P3_CONFIRM |
| Phase 4 — 写入交付物 | P4_WRITE |
| Phase 5 — 副作用执行 | P5_SIDE_EFFECT |

缺失 P0_LOCATE 阶段（定位 Feature、校验阶段约束）。

---

### P1-2: AGENTS.md Stage×Skill 映射表引用 legacy Skill 名

| 阶段 | AGENTS.md 引用 | 应引用 |
|------|---------------|--------|
| 01_specify | 01-spec-write | 03-spec |
| 02_design | 02-design-write, 03-research | 04-design, 05-research |
| 03_plan | 04-task-decompose | 06-task |
| 04_implement | 05-code-trace | 07-code, 08-code-review |
| 05_verify | 06-test-design | 09-test |
| 06_wrap_up | 07-archive | 10-archive |
| 任意阶段 | 00-session-catchup | 02-catchup |

缺失编排 Skill：11-plan、12-verify、13-orchestrate、14-status、15-doctor、16-sync。

---

### P1-3: AGENTS.md ID 类型与 types.ts 不一致

AGENTS.md 列出 8 种 ID 类型：`FR | NFR | DS | API | TASK | TC | ADR | RFC`

`types.ts` 定义的 `NextIdType` 只有 5 种：`FR | DS | TASK | TC | RFC`

缺失的 3 种类型：
- `NFR` — 未作为独立 ID 类型实现（NFR 通过 `nfrTag` 字段标记在 MatrixRow 上）
- `API` — 未作为独立 ID 类型实现
- `ADR` — 未作为独立 ID 类型实现

Legacy Skill `01-spec-write` 调用 `spec-id next NFR`、`02-design-write` 调用 `spec-id next API`，均会失败。

---

### P1-4: AGENTS.md Gate 结果三态与代码不一致

| AGENTS.md | 实际代码（types.ts） |
|-----------|-------------------|
| `PASS \| FAIL \| WARN` | `PASS \| PASS_WITH_WAIVER \| FAIL` |

`WARN` 不存在，实际是 `PASS_WITH_WAIVER`（有豁免的通过）。

---

### P1-5: Dispatcher 语义映射与实际 CLI 命令不匹配

`dispatcher.ts` 中 `SEMANTIC_MAP` 的 defect 映射：

```typescript
'defect fix': { command: 'defect', argTemplate: 'transition {0} fixing' }
'defect verify': { command: 'defect', argTemplate: 'transition {0} verified' }
```

但实际 CLI 命令是 `defect update <featureId> <seq> --status <status>`，不是 `defect transition`。映射后的参数格式也不匹配。

---

## 五、P2 问题（规范性）

### P2-1: AGENTS.md init 命令参数格式错误

```bash
# AGENTS.md 中
spec-first init <featureId> --mode <N|I> --size <S|M|L> [--platform <github|gitlab|azure-devops>]

# 实际 CLI
spec-first init --feat <abbr> --mode <N|I> --size <S|M|L> --platforms <p1,p2,...> [--feature-id <id>]
```

差异：featureId 不是位置参数而是可选 flag；`--platform` 应为 `--platforms`；platform 值不是 CI 平台而是端平台（h5/java-backend 等）。

---

### P2-2: AGENTS.md 目录结构中 tasks.md 与 task_plan.md 并存

AGENTS.md 第 38 行列出 `tasks.md`，第 49 行列出 `task_plan.md`。实际代码中统一使用 `task_plan.md`。`tasks.md` 应删除或标注为 legacy 别名。

---

### P2-3: 当前 Skill 产出物路径与约定不一致

| Skill | 产出物路径 | 约定路径 |
|-------|-----------|---------|
| 03-spec | `fr-spec.md` | `spec.md` |
| 04-design | `design-spec.md` | `design.md` |
| 10-archive | `archive-summary.md` | `retro.md` |
| 05-research | `findings.md` | `research.md` |

---

### P2-4: 8 个 Legacy Skill 全部过时

所有 legacy Skill 存在以下共性问题：
- 引用 "v5 规范"（当前为 v2 技术方案体系）
- 使用 `spec-id`/`spec-gate`/`spec-matrix`/`spec-metrics`/`spec-ai` 格式（应为 `spec-first id`/`spec-first gate` 等）
- 使用 Step 1-N 线性流程而非 P0-P5 六阶段模型
- `04-task-decompose` 产出 `tasks.md`（应为 `task_plan.md`）

建议：在 AGENTS.md 或 Skill 目录中明确标注 legacy Skill 已废弃，避免 Dispatcher 误加载。当前 `findSkillFile` 按 `NN-skillName` 后缀匹配，legacy `01-spec-write` 不会与当前 `03-spec` 冲突，但 `03-research`（legacy）与 `05-research`（当前）的 skillName 相同（都是 `research`），Dispatcher 会优先匹配 `03-research`（legacy）而非 `05-research`（当前），因为 `readdirSync` 返回的目录列表中 `03-research` 排在 `05-research` 前面。

---

## 六、Dispatcher 补充审查

### 正面发现

- Skill 路由与 Runtime 路由分离清晰
- 本地 Skill 优先于包级 Skill 的查找策略正确
- 语义映射表（rfc approve/reject/close）设计合理

### 问题

1. ✅（撤销）CLI 已注册顶层 `golive` 命令（见 `src/cli/index.ts`），Runtime 路由成立；实现文件复用不影响路由正确性。  
2. ❌ `findSkillFile` 使用 `entry.endsWith(-${skillName})` 且“第一个匹配即返回”，当 legacy 和 current Skill 同名时（如 `research/archive/catchup`），会匹配到排序靠前的 legacy 版本（见 P0-4）。

---

## 七、16 个当前 Skill 逐项审查

| # | Skill | Stage | confirm | 可达性 | CLI 引用 | 问题 |
|---|-------|-------|---------|--------|---------|------|
| 01 | init | any | strict | ❌ Runtime 覆盖 | ⚠️ | `id generate Feature` 不存在；Skill 文件不可达（P0-5） |
| 02 | catchup | any | auto | ❌ 被遮蔽 | ✅ | CLI 正确但被 `00-session-catchup` 遮蔽（P0-4） |
| 03 | spec | 01_specify | strict/assisted | ✅ | ❌ | `id generate FR` + `matrix update` 不存在；产出 `fr-spec.md` 非约定 |
| 04 | design | 02_design | strict | ✅ | ❌ | `id generate DS` + `matrix update` 不存在；产出 `design-spec.md` 非约定 |
| 05 | research | any | auto | ❌ 被遮蔽 | ✅ | CLI 正确但被 `03-research` 遮蔽（P0-4） |
| 06 | task | 03_plan | assisted | ✅ | ❌ | `id generate TASK` + `matrix update` 不存在 |
| 07 | code | 04_implement | strict/assisted | ✅ | ⚠️ | `matrix update` 不存在 |
| 08 | code-review | 04_implement | assisted | ✅ | ✅ | references/ 4 份清单齐全 |
| 09 | test | 05_verify | assisted | ✅ | ❌ | `id generate TC` + `matrix update` 不存在 |
| 10 | archive | 06_wrap_up | strict | ❌ 被遮蔽 | ✅ | CLI 正确但被 `07-archive` 遮蔽（P0-4） |
| 11 | plan | any | assisted | ✅ | ✅ | — |
| 12 | verify | any | auto | ✅ | ✅ | — |
| 13 | orchestrate | any | strict | ✅ | ✅ | — |
| 14 | status | any | auto | ✅ | ✅ | — |
| 15 | doctor | any | auto | ❌ Runtime 覆盖 | ✅ | CLI 正确但 Skill 文件不可达（P0-5） |
| 16 | sync | any | assisted | ✅ | ⚠️ | `matrix update` 不存在 |

可达率：11/16（69%），5 个 Skill 不可达（3 被遮蔽 + 2 被 Runtime 覆盖）。
CLI 引用正确率：9/16（56%），7 个 Skill 引用了不存在的命令。
综合可用率（可达 + CLI 正确）：6/16（38%）— 完全可用主要为 08-code-review、11-plan、12-verify、13-orchestrate、14-status；07-code 为**部分可用**（不计入完全可用）。

---

## 八、修复建议优先级

| 优先级 | 修复项 | 影响范围 |
|--------|--------|---------|
| P0-1 | 5 个 Skill 的 `id generate` → `id next`（或删掉 Feature 生成调用） | 5 个 Skill 文件 |
| P0-2 | `matrix update`：实现原子命令或回收 Skill 承诺（不要简单改成 `matrix check`） | CLI + 6 个 Skill 文件 |
| P0-3 | AGENTS.md 全部 CLI 命令名 `spec-*` → `spec-first *` | AGENTS.md（26 处） |
| P0-4 | 消除 3 个 skillName 冲突：重命名 legacy 目录或删除 legacy Skill | 3 个 legacy 目录（00-session-catchup、03-research、07-archive） |
| P0-5 | 从 RUNTIME_COMMANDS 移除 `init`/`doctor`，改由 Skill 路由（Skill 内部调用 CLI） | dispatcher.ts |
| P1-1 | AGENTS.md 执行模型 5 阶段 → 6 阶段（P0-P5） | AGENTS.md |
| P1-2 | AGENTS.md Stage×Skill 映射表更新为当前 Skill 名 | AGENTS.md |
| P1-3 | AGENTS.md ID 类型表与 types.ts 对齐（移除 NFR/API/ADR 或标注未实现） | AGENTS.md |
| P1-4 | AGENTS.md Gate 结果 WARN → PASS_WITH_WAIVER | AGENTS.md |
| P1-5 | dispatcher.ts defect 语义映射参数修正 | dispatcher.ts |
| P2-1 | AGENTS.md init 命令参数格式修正 | AGENTS.md |
| P2-2 | AGENTS.md 目录结构 tasks.md → task_plan.md | AGENTS.md |
| P2-3 | 4 个 Skill 产出物路径与约定对齐 | 4 个 Skill 文件 |
| P2-4 | Legacy Skill 标注废弃（P0-4 修复后此项自动解决） | — |

---

## 九、结论

当前 Skill 体系 **"看起来齐全，但大部分不可用"**。16 个当前 Skill 中仅 6 个可正常工作（综合可用率 38%），根因有三层：

1. **路由层**（P0-4/P0-5）：3 个 skillName 冲突导致 legacy 遮蔽 v2 版本 + 2 个 Skill 被 RUNTIME_COMMANDS 覆盖，合计 5 个 Skill 完全不可达。这是最隐蔽的问题 — Skill 文件内容正确但永远不会被加载。
2. **CLI 契约层**（P0-1/P0-2）：7 个 Skill 引用 `id generate` / `matrix update` 等不存在的 CLI 命令，即使可达也会执行失败。
3. **共享上下文层**（P0-3 + P1-1~P1-4）：AGENTS.md 与实际代码实现严重脱节（CLI 命令名、执行模型、Skill 映射、ID 类型、Gate 语义全部不一致），持续误导新增 Skill。

建议修复顺序：P0-4（消除名称冲突）→ P0-5（调整路由边界）→ P0-1/P0-2（修正 CLI 引用）→ P0-3（重写 AGENTS.md）→ P1 → P2。

---

## 十、复审补充说明（2026-02-14 二次复核）

1. 已将“AGENTS.md CLI 命令名全部错误”修订为“存在 26 处命令名错误（非全部）”，避免过度表述。  
2. 已将 `readdirSync` 顺序相关结论修订为“当前环境观测 + 首个匹配返回导致遮蔽风险”，避免把环境顺序误写成语言层面的确定性承诺。  
3. 已修订综合可用率说明，区分“完全可用”与“部分可用（07-code）”，避免统计口径冲突。
