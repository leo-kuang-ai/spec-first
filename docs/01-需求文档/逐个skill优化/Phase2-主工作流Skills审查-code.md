# Phase 2.5: code Skill 审查报告

**审查日期**: 2026-03-18
**Skill 名称**: code (代码实现)
**版本**: v2.1.0
**优先级**: P0（核心工作流）
**审查状态**: ❌ **不通过** — 存在 4 个 P0 阻断问题

---

## 执行摘要

### 审查覆盖
- **审查文件数**: 10 (SKILL.md + 8 references + background-quality-contract.md)
- **发现问题数**: 12 (P0: 4, P1: 5, P2: 3)

### 关键发现
1. **P0-1**: 失败率控制未实现（changelog 声称支持但配置缺失）
2. **P0-2**: 字段真理源不完整（缺少 status 规范化映射说明）
3. **P0-3**: 缺少 3-Strike Error Protocol（SHARED.md 要求）
4. **P0-4**: 缺少 Worktree First 原则（SHARED.md 要求）

### 总体评级
- **流程完整性**: ⭐⭐⭐ (3/5)
- **文档完整性**: ⭐⭐⭐ (3/5)
- **一致性**: ⭐⭐ (2/5)
- **可执行性**: ⭐⭐⭐ (3/5)

---

## 问题清单

### P0 问题（阻断性）

#### [P0-1] 失败率控制未实现
- **文件**: `skills/spec-first/07-code/SKILL.md:9`
- **证据**:
  - changelog 声称 "v2.0.0: 完全重写为批量模式，支持依赖解析、并发执行、失败率控制"
  - 但 `src/shared/config-schema.ts` 中无 `stop_on_failure_rate` 字段
  - SKILL.md L95 明确说明："以下配置在 skill 中不再视为当前已实现真理源：stop_on_failure_rate"
- **影响**:
  - changelog 与实现不一致，误导用户
  - 批量执行时无法根据失败率自动停止
  - 可能导致大量 TASK 连续失败，浪费资源
- **整改建议**:
  1. 删除 changelog 中的"失败率控制"声明，或
  2. 在 `config-schema.ts` 中实现 `runtime.code.stop_on_failure_rate` 配置
  3. 在 batch-executor 中实现失败率检查逻辑
- **验证方法**:
  ```bash
  grep "stop_on_failure_rate" src/shared/config-schema.ts
  # 预期：有输出（如果实现）或无输出（如果删除声明）
  ```

#### [P0-2] 字段真理源不完整
- **文件**: `skills/spec-first/07-code/SKILL.md:131-150`
- **证据**:
  - L131-140 声称"当前 task plan 解析以 parser 为准，稳定字段只有：task_id, title, status, depends_on, traces, owner"
  - L144 提到 status 字段，但未说明 status 的规范化映射
  - orchestrate SKILL.md L144 提到："legacy `complete/verified` 会先归一到 `done`"
  - code SKILL.md 未提及这个规范化逻辑
- **影响**:
  - AI 可能生成不规范的 status 值（如 complete, verified, finished）
  - todo-runner 可能无法正确识别 TASK 状态
  - 状态机流转可能失败
- **整改建议**:
  1. 在"字段真理源"章节补充 status 规范化映射说明
  2. 明确说明：`complete/verified` → `done`, `todo` → `pending`
  3. 引用 `src/core/task-plan/parser.ts` 中的规范化逻辑
- **验证方法**:
  ```bash
  grep -A 10 "status.*normali" src/core/task-plan/parser.ts
  ```

#### [P0-3] 缺少 3-Strike Error Protocol
- **文件**: `skills/spec-first/07-code/SKILL.md`
- **证据**:
  - SHARED.md L203-207 定义了 3-Strike Error Protocol："同类错误连续失败 3 次后，禁止继续'再试一次'"
  - SHARED.md L207 明确说明："应用 Skills: 07-code"
  - 但 code SKILL.md 未提及这个协议
- **影响**:
  - AI 可能在同一错误上反复尝试，浪费时间
  - 无法触发架构审查或方案重设计
  - 违反 SHARED.md 的统一约束
- **整改建议**:
  1. 在"守卫"章节补充"3-Strike Error Protocol"
  2. 说明：同类错误连续失败 3 次后，必须升级到架构审查
  3. 升级动作与结论必须写入 `findings.md`
- **验证方法**:
  ```bash
  grep -i "3.*strike\|three.*strike" skills/spec-first/07-code/SKILL.md
  # 预期：有输出
  ```

#### [P0-4] 缺少 Worktree First 原则
- **文件**: `skills/spec-first/07-code/SKILL.md`
- **证据**:
  - SHARED.md L193-197 定义了 Worktree First 原则："高风险任务默认建议在独立 worktree 执行"
  - SHARED.md L197 明确说明："应用 Skills: 07-code, 08-review"
  - 但 code SKILL.md 未提及这个原则
- **影响**:
  - 高风险任务可能污染主工作区
  - 实验性修复无法隔离
  - 违反 SHARED.md 的统一约束
- **整改建议**:
  1. 在"守卫"章节补充"Worktree First 原则"
  2. 说明：大范围重构、跨模块联动、并行修复实验默认建议在独立 worktree 执行
  3. 给出最小流程：`git worktree add ../worktree-<TASK-ID> <branch>`
- **验证方法**:
  ```bash
  grep -i "worktree" skills/spec-first/07-code/SKILL.md
  # 预期：有输出
  ```

---

### P1 问题（重要）

#### [P1-1] 批量模式声明与实际能力不匹配
- **文件**: `skills/spec-first/07-code/SKILL.md:22-34`
- **证据**:
  - L22-34 说明："当前仓库的真实状态是：skill 以自动批量模式定义完整执行流程，batch executor 仍未完全接入真实 subagent 执行链路"
  - L32-34 说明："不要把'自动批量模式提示词'直接等同于'当前 runtime 已稳定自动接线'"
- **影响**:
  - 用户可能误以为批量模式已完全实现
  - AI 可能尝试调用不存在的批量执行接口
  - 文档与实现的差距不够明确
- **整改建议**:
  1. 在 SKILL.md 开头增加"实现状态"章节
  2. 明确说明：提示词完整，运行时部分实现，当前默认人工/半自动调度
  3. 给出实现路线图（如果有）

#### [P1-2] 依赖解析机制未明确说明
- **文件**: `skills/spec-first/07-code/SKILL.md`
- **证据**:
  - changelog 声称支持"依赖解析"
  - L119 提到"必须先解析依赖关系"
  - 但未说明依赖解析的具体逻辑（如何从 depends_on 字段构建依赖图）
- **影响**:
  - AI 可能不清楚如何正确解析依赖
  - 并发执行时可能违反依赖顺序
- **整改建议**:
  1. 在"批量模式"章节补充依赖解析说明
  2. 说明：从 task_plan.md 的 depends_on 字段构建依赖图
  3. 说明：拓扑排序确定执行顺序

#### [P1-3] 并发控制配置引用混乱
- **文件**: `skills/spec-first/07-code/SKILL.md:80-100`
- **证据**:
  - L84-88 说明："当前只对齐已落地配置：runtime.auto_orchestrate.max_parallel: 1..4"
  - L90 说明："max_parallel 的真实读取入口是 runtime.auto_orchestrate.max_parallel"
  - L92-98 说明："以下配置在 skill 中不再视为当前已实现真理源：runtime.code.max_parallel"
- **影响**:
  - 配置路径不一致（auto_orchestrate vs code）
  - 用户可能配置错误的路径
  - 文档与实现的对应关系不清晰
- **整改建议**:
  1. 统一配置路径为 `runtime.code.max_parallel`
  2. 或明确说明为什么使用 `runtime.auto_orchestrate.max_parallel`
  3. 在 config-schema.ts 中添加配置别名或迁移提示

#### [P1-4] checkpoint 与 todo-state.json 关系不清
- **文件**: `skills/spec-first/07-code/SKILL.md`
- **证据**:
  - L76 引用了 `src/core/batch-executor/checkpoint.ts`
  - orchestrate SKILL.md L150 提到："持久化文件：specs/{featureId}/todo-state.json"
  - 但 code SKILL.md 未说明 checkpoint 与 todo-state.json 的关系
- **影响**:
  - 不清楚 checkpoint 是否写入 todo-state.json
  - 不清楚会话恢复时如何读取 checkpoint
- **整改建议**:
  1. 在"批量模式"章节补充 checkpoint 机制说明
  2. 说明：checkpoint 写入 todo-state.json
  3. 说明：会话恢复时从 todo-state.json 读取 checkpoint

#### [P1-5] 测试补全要求分散，未形成统一守卫
- **文件**: `skills/spec-first/07-code/SKILL.md`
- **证据**:
  - L120 提到"必须先做 TDD 预检"
  - L124 提到"必须有 RED 证据或 WAIVER"
  - L128 提到"必须补测试或说明不补测试的理由"
  - 但这三个要求分散在不同章节，未形成统一的测试守卫
- **影响**:
  - AI 可能遗漏某个测试要求
  - 测试覆盖率可能不达标
- **整改建议**:
  1. 在"守卫"章节增加"测试守卫"子章节
  2. 统一说明：TDD 预检 → RED 证据 → 实现 → GREEN 证据 → 测试补全
  3. 明确说明何时可以豁免测试

---

### P2 问题（改进建议）

#### [P2-1] background_input_status 检查未体现在守卫流程中
- **文件**: `skills/spec-first/07-code/SKILL.md:36-43`
- **证据**:
  - L36-43 说明："本 skill 遵循 background-quality-contract.md，执行前检查 backgroundInputStatus / background_input_status"
  - 但"守卫"章节未提及这个检查
- **影响**:
  - AI 可能忘记检查背景质量
  - 在 blind 状态下执行代码实现，风险高
- **整改建议**:
  1. 在"P0 全局守卫"中补充背景质量检查
  2. 说明：blind 状态下必须先执行 `/spec-first:first`

#### [P2-2] Scope Guard 集成未说明
- **文件**: `skills/spec-first/07-code/SKILL.md`
- **证据**:
  - Phase 1.1 审查发现：code skill 在 SCOPE_GUARD_SKILLS 中
  - 但 code SKILL.md 未说明 Scope Guard 的触发条件和校验逻辑
- **影响**:
  - AI 可能不清楚代码变更范围会被校验
  - 可能触发 ScopeGuardBlockedError 但不知道原因
- **整改建议**:
  1. 在"守卫"章节补充"Scope Guard"说明
  2. 说明：代码变更必须在 task_plan.md 定义的文件范围内
  3. 说明：超出范围会触发 ScopeGuardBlockedError

#### [P2-3] P0-P5 命名与 SHARED.md 冲突
- **文件**: `skills/spec-first/07-code/SKILL.md`
- **证据**:
  - code SKILL.md 未定义 P0-P5 执行阶段
  - SHARED.md 定义了默认 P0-P5 执行模型（P0_LOCATE, P1_CONTEXT, P2_GENERATE, P3_CONFIRM, P4_WRITE, P5_SIDE_EFFECT）
  - code skill 属于"产物生成型"，应遵循默认 P0-P5 流程
- **影响**:
  - 不清楚 code skill 是否遵循默认 P0-P5 流程
  - 与 SHARED.md 的一致性不明确
- **整改建议**:
  1. 在 SKILL.md 增加"执行模型"章节
  2. 明确说明：遵循 SHARED.md 的默认 P0-P5 执行模型
  3. 或声明例外（如果有）

---

## 批量模式完整性检查

| 功能 | 状态 | 说明 |
|------|------|------|
| 单 TASK 模式 | ✅ | 完整定义 |
| 批量模式 | ⚠️ | 提示词完整，运行时未完全接线 |
| 依赖解析 | ❌ | 声称支持但未说明逻辑 |
| 并发控制 | ⚠️ | 配置存在但引用混乱 |
| 失败率控制 | ❌ | 声称支持但未实现 |
| checkpoint 机制 | ✅ | 引用了 checkpoint.ts |

---

## 守卫机制完整性检查

| 守卫 | 状态 | 说明 |
|------|------|------|
| TDD 预检 | ✅ | L120 要求 |
| RED 证据 | ✅ | L124 要求 |
| WAIVER | ✅ | L124 允许 |
| 最小实现 | ✅ | L125 要求 |
| Surgical Changes | ✅ | L111 要求 |
| GREEN 证据 | ⚠️ | 未明确要求 |
| 测试补全 | ⚠️ | L128 要求但不明确 |
| 3-Strike Error | ❌ | SHARED.md 要求但缺失 |
| Worktree First | ❌ | SHARED.md 要求但缺失 |

---

## 一致性检查

### 与 truth-source.ts
- ✅ code skill 的 Stage 要求为 04_implement（一致）
- ✅ 字段定义基本一致（task_id/title/status/depends_on/traces/owner）
- ❌ status 规范化映射未说明（不完整）

### 与 SHARED.md
- ❌ 缺少 3-Strike Error Protocol（不一致）
- ❌ 缺少 Worktree First 原则（不一致）
- ⚠️ P0-P5 执行模型未明确声明（不清晰）
- ✅ code 专属守卫基本一致

### 与 background-quality-contract.md
- ✅ 引用了契约（一致）
- ❌ 未在守卫流程中体现（不完整）

### 与 Scope Guard
- ✅ code skill 在 SCOPE_GUARD_SKILLS 中（一致）
- ❌ SKILL.md 未说明 Scope Guard 机制（不完整）

---

## 整改优先级建议

### 立即修复（P0）
1. 删除失败率控制声明或实现该功能（预计 1-2 小时）
2. 补充 status 规范化映射说明（预计 30 分钟）
3. 补充 3-Strike Error Protocol（预计 30 分钟）
4. 补充 Worktree First 原则（预计 30 分钟）

### 近期修复（P1）
1. 明确批量模式实现状态（预计 1 小时）
2. 补充依赖解析机制说明（预计 1 小时）
3. 统一并发控制配置路径（预计 1 小时）
4. 补充 checkpoint 机制说明（预计 30 分钟）
5. 统一测试守卫要求（预计 1 小时）

### 建议改进（P2）
1. 在守卫中补充背景质量检查（预计 30 分钟）
2. 补充 Scope Guard 说明（预计 30 分钟）
3. 明确 P0-P5 执行模型（预计 30 分钟）

**总预计修复工作量**: 8-10 小时

---

## 总体评价

**优势**:
- 硬规则清晰（6 条）
- 守卫机制基本完整（TDD/RED/最小实现/Surgical Changes）
- 真理源引用准确
- 背景质量契约正确引用

**不足**:
- 与 SHARED.md 一致性差（缺少 3-Strike、Worktree First）
- 批量模式声明与实现不匹配
- 失败率控制未实现但声称支持
- 依赖解析、并发控制、checkpoint 机制说明不清晰
- 测试守卫要求分散，未形成统一流程

**结论**: code skill 的核心守卫机制基本完整，但与 SHARED.md 的一致性差，批量模式实现不完整。建议修复 P0 问题后再投入使用。

---

## 附录：关键文件路径

- **SKILL.md**: `/Users/kuang/xiaobu/spec-first/skills/spec-first/07-code/SKILL.md`
- **References**: `/Users/kuang/xiaobu/spec-first/skills/spec-first/07-code/references/` (8 个文件)
- **背景质量契约**: `/Users/kuang/xiaobu/spec-first/skills/spec-first/shared/background-quality-contract.md`
- **Parser**: `/Users/kuang/xiaobu/spec-first/src/core/task-plan/parser.ts`
- **Config Schema**: `/Users/kuang/xiaobu/spec-first/src/shared/config-schema.ts`
- **Batch Executor**: `/Users/kuang/xiaobu/spec-first/src/core/batch-executor/`
