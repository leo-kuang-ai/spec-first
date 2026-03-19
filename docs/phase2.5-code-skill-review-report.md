# Phase 2.5: code Skill 审查结果

**审查日期**: 2026-03-18
**审查范围**: `skills/spec-first/07-code/SKILL.md` v2.1.0 + 8 个 references + `background-quality-contract.md`
**审查人**: Claude (Sonnet 4.6)

---

## 审查摘要

- **审查文件数**: 10 (SKILL.md + 8 references + background-quality-contract.md)
- **发现问题数**: 12 (P0: 4, P1: 5, P2: 3)
- **审查状态**: ❌ **不通过** — 存在 4 个 P0 阻断问题

---

## 问题清单

### P0 阻断问题（4 个）

#### P0-1: 批量模式核心机制缺失 — 失败率控制未实现

**位置**: `SKILL.md` L8, L95
**问题描述**:
- SKILL.md v2.0.0 changelog 声称"支持依赖解析、并发执行、失败率控制"
- L95 提到 `stop_on_failure_rate` 配置项
- 但 `config-schema.ts` 中只有 `stop_on_blocked: boolean`，**没有** `stop_on_failure_rate` 字段
- `guards.ts` 只实现了 TDD 预检（50% 缺失率阈值），未实现运行时失败率控制
- `report-template.md` 提到"失败率"，但只是统计展示，不是控制机制

**影响**: 批量执行无法在失败率超标时自动停止，可能导致级联失败

**修复建议**:
1. 在 `config-schema.ts` 中补充 `stop_on_failure_rate: number` (0-1)
2. 在批量执行器中实现失败率检查逻辑
3. 或删除 SKILL.md 中关于失败率控制的声明

---

#### P0-2: 字段真理源声明不完整 — 缺少 status 规范化映射说明

**位置**: `SKILL.md` L130-140
**问题描述**:
- SKILL.md L130-140 已列出字段真理源：`task_id`, `title`, `status`, `depends_on`, `traces`, `owner`
- 但未说明 `status` 的规范化映射规则（`normalizeTaskPlanStatus` 函数）
- `parser.ts` 中 `status` 支持多种别名：
  - `complete/completed/done/verified` → `complete`
  - `in_progress/wip/doing/进行中` → `in_progress`
  - `blocked` → `blocked`
  - 其他 → `pending`
- 未说明 `depends_on` 和 `traces` 的分隔符（逗号）和空值处理（`-`）

**影响**: AI 可能生成与 parser 不兼容的 status 值

**修复建议**:
在 SKILL.md "字段真理源"章节中补充：
```markdown
### status 规范化映射

parser.ts 支持以下别名（不区分大小写，自动规范化）：
- `complete`: complete, completed, done, verified
- `in_progress`: in_progress, wip, doing, 进行中
- `blocked`: blocked
- `pending`: 其他所有值

### 分隔符与空值

- `depends_on`: 逗号分隔的 TASK ID 列表，空值用 `-`
- `traces`: 逗号分隔的 FR/DS ID 列表，空值用 `-`
```

---

#### P0-3: TDD 守卫与 SHARED.md 不一致 — 缺少 3-Strike Error Protocol

**位置**: `SKILL.md` L104-112, `SHARED.md` L201-208
**问题描述**:
- `SHARED.md` 明确定义了"3-Strike Error Protocol"（P1-05）：同类错误连续失败 3 次后必须升级到架构审查
- `SHARED.md` L24 明确声明 code skill 应用此规则
- 但 `SKILL.md` 的"硬规则"和"守卫"章节中**完全没有提及** 3-Strike 规则
- `tdd-guard.md` 也未提及此规则

**影响**: AI 可能在同一问题上反复失败而不升级处理

**修复建议**:
在 SKILL.md 的"硬规则"或"守卫"章节中补充：
```markdown
8. `3-Strike Error Protocol`：同类错误连续失败 3 次后，禁止继续"再试一次"，必须升级到架构审查或方案重设计，并写入 findings.md。
```

---

#### P0-4: Worktree First 原则缺失

**位置**: `SKILL.md` 全文, `SHARED.md` L191-198
**问题描述**:
- `SHARED.md` 明确定义了"Worktree First"原则（P1-16）：高风险任务默认建议在独立 worktree 执行
- `SHARED.md` L24 明确声明 code skill 应用此规则
- 但 `SKILL.md` 全文**没有任何关于 worktree 的提及**
- "并发黑名单"章节（L314-325）列出了高风险场景，但未建议使用 worktree

**影响**: 高风险任务可能污染主工作区，增加回滚成本

**修复建议**:
在 SKILL.md 中补充：
```markdown
## Worktree First

高风险任务（大范围重构、跨模块联动、并行修复实验）默认建议在独立 worktree 执行：
- 主工作区仅用于稳定路径与结果汇总
- 最小流程：`git worktree add ../worktree-<TASK-ID> <branch>` → 在独立 worktree 中实现与验证 → 合并回主工作区
```

---

### P1 重要问题（5 个）

#### P1-1: 批量模式声明与实际能力不匹配

**位置**: `SKILL.md` L22-34
**问题描述**:
- L22-34 "当前模式"章节已明确说明"skill 以自动批量模式定义完整执行流程"但"batch executor 仍未完全接入真实 subagent 执行链路"
- 这是诚实的声明，但与 L8 changelog "v2.0.0: 完全重写为批量模式"存在语义冲突
- "完全重写"暗示已实现，但实际是"提示词定义完整，运行时未完全接线"

**影响**: 用户可能误解当前批量模式的自动化程度

**修复建议**:
将 L8 changelog 改为：
```markdown
v2.0.0: 重写为批量模式提示词，支持依赖解析、并发执行设计（运行时接线进行中）
```

---

#### P1-2: 依赖解析机制未明确说明

**位置**: `SKILL.md` L8, L149
**问题描述**:
- changelog 声称"支持依赖解析"
- L149 提到"或只在低风险、不同文件、不同模块时谨慎并发"
- 但未说明依赖解析的具体逻辑：
  - 如何从 `depends_on` 字段构建依赖图？
  - 如何检测循环依赖？
  - 如何分层（layer）？
- `types.ts` 定义了 `DependencyGraph` 和 `TaskLayer`，但 SKILL.md 未引用

**影响**: AI 可能无法正确处理复杂依赖关系

**修复建议**:
在 SKILL.md 中补充：
```markdown
## 依赖解析

批量模式根据 `depends_on` 字段构建依赖图：
1. 解析每个 TASK 的 `depends_on` 列表
2. 检测循环依赖（如存在则报错）
3. 按拓扑排序分层（layer 0 无依赖，layer N 依赖 layer N-1）
4. 同层 TASK 可并发执行（如无文件冲突）

真理源: `src/core/batch-executor/types.ts` (DependencyGraph, TaskLayer)
```

---

#### P1-3: 并发控制配置不一致

**位置**: `SKILL.md` L78, L87, L92-95
**问题描述**:
- L78 引用 `config-schema.ts` 作为"当前并发配置"真理源
- L87 声称 `max_parallel: 1..4`
- L92 说"真实读取入口是 `runtime.auto_orchestrate.max_parallel`"
- L94-95 说"不要读取 `runtime.code.max_parallel`" 和 "`stop_on_failure_rate`"
- 但 `config-schema.ts` 中：
  - `runtime.auto_orchestrate.max_parallel` 存在（正确）
  - **没有** `runtime.code.max_parallel`（正确，不应读取）
  - **没有** `stop_on_failure_rate`（见 P0-1）

**影响**: 配置引用混乱，可能导致 AI 读取错误字段

**修复建议**:
删除 L94-95 的错误配置引用，改为：
```markdown
## 当前已实现配置

从 `config-schema.ts` 读取：
- `runtime.auto_orchestrate.max_parallel`: 1..4（默认 2）
- `runtime.auto_orchestrate.stop_on_blocked`: boolean（默认 true）

不存在的配置项（不要尝试读取）：
- `runtime.code.max_parallel`（已废弃）
- `stop_on_failure_rate`（未实现）
```

---

#### P1-4: checkpoint 机制与 todo-state.json 关系不清

**位置**: `SKILL.md` L231, L307, L312
**问题描述**:
- L231 输出物列表包含 `batch-checkpoint.json`
- L307 输出物列表也包含 `batch-checkpoint.json`
- L312 说"`todo-state.json` 更偏 orchestrator 状态，不应作为本 skill 的默认 batch checkpoint 真理源"
- 但未说明：
  - `batch-checkpoint.json` 与 `todo-state.json` 的职责边界
  - code skill 是否应该读取 `todo-state.json`？
  - 两者如何同步？

**影响**: 可能导致状态不一致

**修复建议**:
在 SKILL.md 中补充：
```markdown
## Checkpoint 与状态文件

- `batch-checkpoint.json`: code skill 批量执行的内部状态（由 checkpoint.ts 管理）
- `todo-state.json`: orchestrate skill 的全局任务状态（由 orchestrator 管理）
- code skill 只读写 `batch-checkpoint.json`，不直接修改 `todo-state.json`
- orchestrate 负责同步两者状态
```

---

#### P1-5: 测试补全要求已存在但位置分散

**位置**: `SKILL.md` L268, L284, L288-291
**问题描述**:
- L268 已说明"成功后必须形成 GREEN 证据或等价测试通过记录"
- L284 已说明"完成后补 `[TDD-GREEN]`"
- L288-291 已列出禁止项（先写代码后补 RED、用全量绿替代 RED 等）
- 但这些要求分散在不同章节，未形成统一的"测试补全守卫"

**影响**: AI 可能遗漏某些要求

**修复建议**:
在 SKILL.md 的"单 TASK 守卫"章节中整合为：
```markdown
### 测试补全守卫

每个 TASK 完成时必须满足：
1. 有 RED 证据或 WAIVER（P0 预检已强制）
2. 有对应的 GREEN 证据（与 RED 同一测试文件/命令）
3. GREEN 证据必须证明 RED 中的失败行为已修复
4. 如走 WAIVER，必须有替代验证证据（如 typecheck/lint/smoke）

禁止：
- 先写代码，后补 RED
- 用全量绿替代 RED
- 把样式、配置、外部接线之外的逻辑改动一律归类成 WAIVER
- 把"改动很小 / 时间不够 / 页面不好测"当成 WAIVER 理由
```

---

### P2 改进建议（3 个）

#### P2-1: background_input_status 检查未体现在流程中

**位置**: `SKILL.md` L36-44
**问题描述**:
- L36-44 "背景质量契约"章节引用了 `background-quality-contract.md`
- 说明"执行前检查 `backgroundInputStatus` 和 `background_input_status`"
- 但在"P0 全局守卫"（L114-120）和"单 TASK 守卫"（L122-127）中**没有提及**背景质量检查
- 未说明如果 `background_input_status=blind` 应该如何处理

**影响**: 背景质量契约可能被忽略

**修复建议**:
在"P0 全局守卫"中补充：
```markdown
- 检查 `background_input_status`，如为 `blind` 则建议先执行 `/spec-first:first` 补全背景
```

---

#### P2-2: Scope Guard 集成未说明

**位置**: `SKILL.md` 全文, `scope-guard.ts` L7
**问题描述**:
- `scope-guard.ts` 明确定义 `SCOPE_GUARD_SKILLS = new Set(['code', 'review', 'verify'])`
- code skill 在此集合中，应该触发 Scope Guard 检查
- 但 SKILL.md 中**没有任何关于 Scope Guard 的说明**
- 未说明：
  - Scope Guard 何时触发？
  - 如何从 task_plan.md 提取 `task_files`？
  - 如何从 code-view 提取 `entryPoints` 和 `likelyChangeAreas`？
  - 如果检测到 `out_of_scope_changes` 应该如何处理？

**影响**: AI 可能不知道 Scope Guard 的存在，无法正确响应阻断

**修复建议**:
在 SKILL.md 中补充：
```markdown
## Scope Guard

code skill 会触发 Scope Guard 检查（由 dispatcher 自动执行）：
1. 从 task_plan.md 提取当前 TASK 的文件范围
2. 从 code-view 提取 `entryPoints` 和 `likelyChangeAreas`
3. 对比 git diff 检测范围外变更
4. 如检测到 `out_of_scope_changes`，阻断执行并提示回退

详见: `src/core/skill-runtime/scope-guard.ts`
```

---

#### P2-3: 与 SHARED.md 的 P0-P5 执行模型对齐不完整

**位置**: `SKILL.md` L153-179, `SHARED.md` L96-136
**问题描述**:
- `SHARED.md` 定义了标准的 P0-P5 执行模型
- `SKILL.md` L153-179 定义了"P0 计划阶段"、"P1 执行阶段"、"P2 收尾阶段"
- 但这个分阶段与 SHARED.md 的 P0-P5 **不是同一套模型**：
  - SHARED.md 的 P0-P5 是"定位-上下文-生成-确认-写入-副作用"
  - SKILL.md 的 P0-P2 是"计划-执行-收尾"（批量模式的执行阶段）
- 两者命名冲突，容易混淆

**影响**: AI 可能混淆两套 P0-P5 模型

**修复建议**:
将 SKILL.md 的"P0 计划阶段"、"P1 执行阶段"、"P2 收尾阶段"改为：
- "Phase 0: 计划阶段"
- "Phase 1: 执行阶段"
- "Phase 2: 收尾阶段"

避免与 SHARED.md 的 P0-P5 执行模型命名冲突。

---

## 批量模式完整性

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 单 TASK 模式 | ✅ | L60-67 明确说明 |
| 批量模式 | ⚠️ | L55-59 说明存在，但 L22-34 承认运行时未完全接线 |
| 依赖解析 | ❌ | 声称支持但未说明具体逻辑（P1-2） |
| 并发控制 | ⚠️ | 配置存在但引用混乱（P1-3） |
| 失败率控制 | ❌ | 声称支持但未实现（P0-1） |
| checkpoint | ✅ | L76, L182, L231 明确引用 checkpoint.ts |

---

## 守卫机制完整性

| 检查项 | 状态 | 说明 |
|--------|------|------|
| TDD 预检 | ✅ | L114-120 明确说明，guards.ts 已实现 |
| RED 证据 | ✅ | L122-127 要求，tdd-guard.md 详细说明 |
| WAIVER | ✅ | tdd-guard.md L62-90 详细说明 |
| GREEN 证据 | ⚠️ | tdd-guard.md 提及但未强制（P1-5） |
| 最小实现 | ✅ | L109 硬规则 6 明确要求 |
| Surgical Changes | ✅ | L110 硬规则 7 明确要求 |
| 测试补全 | ⚠️ | 要求存在但不明确（P1-5） |
| 3-Strike Error | ❌ | SHARED.md 要求但 SKILL.md 缺失（P0-3） |
| Worktree First | ❌ | SHARED.md 要求但 SKILL.md 缺失（P0-4） |

---

## 一致性检查

### 与 truth-source.ts 一致性
- ✅ L69-78 正确引用 parser.ts, types.ts, context-packer.ts, checkpoint.ts, report-generator.ts
- ⚠️ 未引用 `truth-source.ts` 中的 `PRIMARY_STAGE_SKILL` 和 `SKILL_STAGE_REQUIREMENTS`（可能不需要）

### 与 SHARED.md 一致性
- ❌ 缺少 3-Strike Error Protocol（P0-3）
- ❌ 缺少 Worktree First 原则（P0-4）
- ✅ 引用了 background-quality-contract.md（L36-44）
- ⚠️ P0-P5 命名冲突（P2-3）

### 与 background-quality-contract.md 一致性
- ✅ L42-43 正确列出 `backgroundInputStatus` 和 `background_input_status`
- ⚠️ 未在守卫中体现检查逻辑（P2-1）

### 与 Scope Guard 一致性
- ✅ code skill 在 `SCOPE_GUARD_SKILLS` 集合中
- ❌ SKILL.md 未说明 Scope Guard 机制（P2-2）

---

## 真理源引用完整性

| 真理源文件 | SKILL.md 引用位置 | 状态 |
|-----------|------------------|------|
| `parser.ts` | L73 | ✅ 已引用 |
| `types.ts` | L74 | ✅ 已引用 |
| `context-packer.ts` | L75 | ✅ 已引用 |
| `checkpoint.ts` | L76 | ✅ 已引用 |
| `report-generator.ts` | L77 | ✅ 已引用 |
| `config-schema.ts` | L78 | ✅ 已引用 |
| `guards.ts` | L262 间接引用（tdd-guard.md L3） | ✅ 已引用 |
| `truth-source.ts` | 未引用 | ⚠️ 可能不需要 |
| `scope-guard.ts` | 未引用 | ❌ 应补充（P2-2） |

---

## 修复优先级建议

### 立即修复（P0，阻断发布）
1. **P0-1**: 删除或实现失败率控制
2. **P0-2**: 补充字段真理源说明
3. **P0-3**: 补充 3-Strike Error Protocol
4. **P0-4**: 补充 Worktree First 原则

### 近期修复（P1，影响质量）
1. **P1-1**: 修正批量模式声明
2. **P1-2**: 补充依赖解析说明
3. **P1-3**: 修正并发控制配置引用
4. **P1-4**: 澄清 checkpoint 与 todo-state.json 关系
5. **P1-5**: 明确测试补全要求

### 后续改进（P2，提升体验）
1. **P2-1**: 在守卫中体现背景质量检查
2. **P2-2**: 补充 Scope Guard 说明
3. **P2-3**: 解决 P0-P5 命名冲突

---

## 审查结论

**不通过** — 存在 4 个 P0 阻断问题，必须修复后才能发布。

核心问题：
1. 批量模式声称的能力（失败率控制）未实现
2. 与 SHARED.md 的共享规则（3-Strike、Worktree First）未对齐
3. 字段真理源说明不完整
4. 守卫机制与 SHARED.md 不一致

建议：
1. 先修复 4 个 P0 问题
2. 再修复 5 个 P1 问题
3. 最后考虑 3 个 P2 改进

预计修复工作量：2-3 小时（主要是文档补充和配置清理）

---

**审查完成时间**: 2026-03-18
**下一步**: 根据本报告修复 P0 问题，然后重新审查
