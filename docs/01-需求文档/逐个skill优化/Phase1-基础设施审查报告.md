# Phase 1: 基础设施审查报告

**审查日期**: 2026-03-18
**审查范围**: Skill Runtime 核心 + 共享契约文档 + orchestrate Skill
**审查状态**: ❌ **不通过** — 存在 4 个 P0 阻塞问题

---

## 执行摘要

### 审查覆盖
- **审查文件数**: 13
  - Skill Runtime 核心: 4 个文件
  - 共享契约文档: 3 个文件
  - orchestrate Skill: 6 个文件
- **发现问题总数**: 23 (P0: 4, P1: 11, P2: 8)

### 关键发现
1. **P0-1**: RUNTIME_COMMANDS 覆盖不完整，缺失 16 个 CLI 命令（覆盖率 42%）
2. **P0-2**: REMOVED_SKILLS 数据污染，包含非 Skill 的产物路径
3. **P0-3**: orchestrate Skill 的 Stage 映射不完整，缺少 07_release 和 08_done（覆盖率 77.8%）
4. **P0-4**: orchestrate Skill 的 --auto-advance 参数语义不清晰

### 总体评级
- **Skill Runtime 核心**: ⚠️ 不通过（2 个 P0 问题）
- **共享契约文档**: ✅ 通过（有改进建议，4 个 P1 问题）
- **orchestrate Skill**: ❌ 不通过（2 个 P0 问题）

---

## 1. Skill Runtime 核心审查结果

### 1.1 审查摘要
- **审查文件数**: 4
- **发现问题数**: 8 (P0: 2, P1: 4, P2: 2)
- **审查状态**: ⚠️ **不通过**

### 1.2 P0 问题（阻塞性）

#### [P0-1] RUNTIME_COMMANDS 覆盖不完整，缺失 16 个 CLI 命令
- **文件**: `src/core/skill-runtime/dispatcher.ts:88-100`
- **证据**: RUNTIME_COMMANDS 仅包含 11 个命令（id/matrix/stage/rfc/defect/metrics/gate/golive/ai/commit/feature），但 CLI 注册了 26 个命令
- **缺失命令**: analyze, batch-test, doctor, done, first, hooks, init, onboarding, setup, skill, trace, uninstall, update, validate, viewer
- **影响**:
  - 这些命令无法通过 `/spec-first:xxx` 语法调用
  - 路由逻辑不完整，可能导致命令分发失败
  - 与文档声称的"直接映射 CLI 原子命令"不符
- **整改建议**:
  1. 补全 RUNTIME_COMMANDS，添加所有 CLI 命令（除 batch-test 为临时命令可豁免）
  2. 或明确区分"Runtime 路由命令"与"Skill 路由命令"，在注释中说明筛选标准
- **验证方法**:
  ```bash
  diff <(grep "registerCommand" src/cli/index.ts | awk -F"'" '{print $2}' | sort) \
       <(grep -A 15 "const RUNTIME_COMMANDS" src/core/skill-runtime/dispatcher.ts | grep "'" | sed "s/[',]//g" | awk '{print $1}' | sort)
  ```

#### [P0-2] REMOVED_SKILLS 数据污染，包含非 Skill 的产物路径
- **文件**: `src/core/rules/truth-source.ts:37-43`
- **证据**:
  ```typescript
  export const REMOVED_SKILLS = [
    'code-review',
    'test',
    'feature-list',
    'feature-switch',
    'feature-current',
  ] as const;
  ```
  但实际输出包含 `reports/release-note.md` 和 `reports/smoke-test-report.md`（这是 RELEASE_REQUIRED_ARTIFACTS 的内容）
- **影响**:
  - 类型定义与运行时数据不一致
  - dispatcher.ts:282 的 REMOVED_SKILLS 检查可能误判
  - 审计日志和错误提示会混淆 Skill 名称与文件路径
- **整改建议**:
  1. 检查 truth-source.ts 的导出逻辑，确认是否有数组合并错误
  2. 确保 REMOVED_SKILLS 仅包含 Skill 名称（kebab-case 字符串）
  3. 添加单元测试验证 REMOVED_SKILLS 的每个元素都不包含 `/` 字符
- **验证方法**:
  ```bash
  grep -A 10 "export const REMOVED_SKILLS" src/core/rules/truth-source.ts | grep "/"
  # 预期：无输出
  ```

### 1.3 P1 问题（重要）

#### [P1-1] SEMANTIC_MAP 覆盖不完整，仅支持 5 个复合命令
- **文件**: `src/core/skill-runtime/dispatcher.ts:79-85`
- **证据**: 仅映射 `rfc approve/reject/close` 和 `defect fix/verify`
- **影响**:
  - 文档声称支持"复合命令映射"，但实际覆盖率极低
  - 用户无法通过语义化命令调用其他 CLI 子命令
- **整改建议**:
  1. 补充常用复合命令（如 `stage advance`, `matrix sync`, `gate check`）
  2. 或在注释中明确说明 SEMANTIC_MAP 仅覆盖"状态转换类"命令

#### [P1-2] SKILL_STAGE_REQUIREMENTS 覆盖不完整，仅 8 个 Skill
- **文件**: `src/core/rules/truth-source.ts:13-23`
- **证据**: 仅定义 spec/spec-review/design/research/task/code/review/verify/archive 的阶段要求
- **缺失 Skill**: init, orchestrate, catchup, first, doctor, status, sync, plan, analyze, feature, onboarding
- **影响**:
  - 这些 Skill 无法享受 Hard Gate 阶段前置校验
  - 可能在错误阶段执行，导致状态机混乱
- **整改建议**:
  1. 补全所有需要阶段约束的 Skill（至少包括 init, orchestrate）
  2. 在注释中说明哪些 Skill 豁免阶段检查（如 doctor, catchup 为诊断类命令）

#### [P1-3] PRIMARY_STAGE_SKILL 映射缺失 09_cancelled 终态
- **文件**: `src/core/rules/truth-source.ts:1-11`
- **证据**: 仅映射 9 个 Stage（00_init ~ 08_done），缺少 09_cancelled
- **影响**:
  - 与 CLAUDE.md 中"8 active + 2 terminal"的描述不符
  - `getSuggestedCommandForStage('09_cancelled')` 会返回兜底命令，而非明确的终态处理
- **整改建议**: 添加 `'09_cancelled': 'cancelled'` 映射（或明确说明 cancelled 不需要 Skill）

#### [P1-4] resolveSkillPath 优先级文档与实现不一致
- **文件**: `src/core/skill-runtime/dispatcher.ts:376-405`
- **证据**:
  - 实现顺序: ext → project local → package level
  - 注释声称: "项目本地 skills/ 优先"（line 394）
- **影响**:
  - 扩展 Skill 会覆盖项目本地 Skill，可能导致意外行为
  - 与"项目优先"的常规预期不符
- **整改建议**:
  1. 调整优先级为 project local → ext → package level
  2. 或在注释中明确说明扩展优先的设计意图

### 1.4 P2 问题（优化）

#### [P2-1] SCOPE_GUARD_SKILLS 硬编码，缺乏扩展性
- **文件**: `src/core/skill-runtime/scope-guard.ts:7`
- **证据**: `const SCOPE_GUARD_SKILLS = new Set(['code', 'review', 'verify']);`
- **影响**: 新增需要 Scope Guard 的 Skill 时需修改核心代码
- **整改建议**: 将 SCOPE_GUARD_SKILLS 移至 truth-source.ts 作为真理源

#### [P2-2] Hard Gate 错误处理不完备，git 命令失败时静默降级
- **文件**: `src/core/skill-runtime/hard-gate.ts:246-248`
- **影响**: 高风险评估失败时仅打印警告，不阻塞执行
- **整改建议**:
  1. 区分"git 不可用"（降级）与"git 命令失败"（阻塞）
  2. 在 HardGateDecision 中添加 `gitCheckFailed: boolean` 字段

### 1.5 一致性检查

| 检查项 | 状态 | 说明 |
|--------|------|------|
| dispatcher.ts vs truth-source.ts | ❌ | REMOVED_SKILLS 数据污染 |
| hard-gate.ts vs truth-source.ts | ✅ | SKILL_STAGE_REQUIREMENTS 一致 |
| scope-guard.ts vs truth-source.ts | ❌ | SCOPE_GUARD_SKILLS 未集中管理 |

### 1.6 代码质量评估

| 维度 | 评分 | 说明 |
|------|------|------|
| 类型安全 | 4/5 | 类型定义完整，但 REMOVED_SKILLS 存在运行时类型不匹配 |
| 错误处理 | 3/5 | git 命令失败时静默降级，缺少明确的错误传播机制 |
| 可测试性 | 4/5 | 函数职责清晰，但 Hard Gate 的 git 依赖难以 mock |
| 文档完整性 | 3/5 | 注释存在但与实现有偏差 |

---

## 2. 共享契约文档审查结果

### 2.1 审查摘要
- **审查文件数**: 3
- **发现问题数**: 8 (P0: 0, P1: 4, P2: 4)
- **审查状态**: ✅ **通过**（有改进建议）

### 2.2 P1 问题（重要改进）

#### [P1-01] SHARED.md 缺少 P0-P5 执行模型的例外声明引用
- **文件**: `skills/spec-first/SHARED.md:96-127`
- **问题**: P0-P5 执行模型声明"只适用于产物型 skill"，但未明确指出各 skill 应在何处声明例外
- **影响**: 新增 skill 时可能误用默认流程
- **建议**: 在 L99 补充："各 skill 必须在其 SKILL.md 的 `## 执行模型` 章节声明是否遵循默认 P0-P5 流程，或引用本文档的例外表。"

#### [P1-02] SHARED.md 未明确 confirm policy 的声明位置
- **文件**: `skills/spec-first/SHARED.md:139-149`
- **问题**: 定义了 auto/assisted/strict 三种策略，但未说明各 skill 应在何处声明其策略
- **影响**: 实际执行时无法确定某 skill 应使用哪种策略
- **建议**: 在 L149 补充："各 skill 必须在其 SKILL.md 的 metadata 或 `## 确认策略` 章节显式声明 confirm_policy。"

#### [P1-03] background-quality-contract.md 缺少使用示例
- **文件**: `skills/spec-first/shared/background-quality-contract.md`
- **问题**: 定义了字段和枚举，但未提供实际输出示例
- **影响**: skill 实现时可能格式不一致
- **建议**: 在文件末尾补充 `## 输出示例` 章节

#### [P1-04] orchestration-governance-contract.md 的 L1/L2/L3 依赖强度未定义语义
- **文件**: `skills/spec-first/shared/orchestration-governance-contract.md:66-70`
- **问题**: 仅列出 L1/L2/L3，未说明各级别的具体含义
- **影响**: plan/orchestrate skill 无法准确判定依赖强度
- **建议**: 补充语义定义（L1: 弱依赖/L2: 中等依赖/L3: 强依赖）

### 2.3 引用关系检查

#### SHARED.md 被引用情况
- **已引用**: 13 个 skill（01-init, 02-catchup, 03-spec, 04-design, 06-task, 07-code, 08-review, 11-plan, 12-verify, 13-orchestrate, 14-status, 15-doctor, 21-analyze）
- **未引用**: 7 个 skill（00-first, 00-onboarding, 05-research, 10-archive, 16-sync, 17-feature, 20-spec-review）

#### background-quality-contract.md 被引用情况
- **已引用**: 07-code
- **应引用但未引用**: 05-research

#### orchestration-governance-contract.md 被引用情况
- **已引用**: 11-plan, 13-orchestrate（符合预期）

### 2.4 与 CLAUDE.md 一致性
- ✅ **无冲突**
- 禁止操作规则、代码变动铁律、ESM 严格模式、工作流程规则均一致

---

## 3. orchestrate Skill 审查结果

### 3.1 审查摘要
- **审查文件数**: 6
- **发现问题数**: 7 (P0: 2, P1: 3, P2: 2)
- **审查状态**: ❌ **不通过**

### 3.2 P0 问题（阻塞性）

#### [P0-3] Stage 映射不完整，缺少 07_release 和 08_done
- **文件**: `skills/spec-first/13-orchestrate/SKILL.md`, `skills/spec-first/13-orchestrate/references/skill-mapping.md`
- **证据**: 映射表只覆盖到 `06_wrap_up`，缺少 `07_release` 和 `08_done`
- **影响**:
  - 与 truth-source.ts 中 PRIMARY_STAGE_SKILL 定义的 9 个阶段不一致
  - 覆盖率: 7/9 (77.8%)
  - orchestrate 无法正确调度 release 和 done 阶段
- **整改建议**:
  1. 在 skill-mapping.md 补充 07_release 和 08_done 的映射
  2. 明确 07_release 是否映射到 golive（runtime 命令）
  3. 明确 08_done 是否需要特殊处理（终态）

#### [P0-4] --auto-advance 参数语义不清晰
- **文件**: `skills/spec-first/13-orchestrate/SKILL.md:22`
- **证据**:
  - SKILL.md 描述："仅当决策层返回 `READY_TO_ADVANCE / AUTO_ADVANCE` 时才执行 `stage advance`"
  - orchestrate-args.ts 注释："只控制阶段推进，不控制 skill 执行"
  - 缺少与 --auto 的区别说明
- **影响**:
  - 用户无法理解 --auto 和 --auto-advance 的组合使用场景
  - 可能误用参数导致意外的阶段推进
- **整改建议**:
  1. 在 SKILL.md 补充参数组合表格
  2. 说明 --auto 控制 skill 执行，--auto-advance 控制阶段推进
  3. 补充示例：`--auto` vs `--auto --auto-advance`

### 3.3 P1 问题（重要）

#### [P1-5] 编排序列描述不一致
- **文件**: `skills/spec-first/13-orchestrate/SKILL.md`
- **证据**: 3 处表述不同
  - L106: "plan -> skill 执行 -> verify -> stage advance"
  - L193: "plan -> (spec|design|task|code|archive) -> verify -> advance"
  - skill-mapping.md L113: "plan → skill → verify → advance"
- **影响**: 文档不一致，可能导致理解偏差
- **整改建议**: 统一为 "plan → skill → verify → advance"

#### [P1-6] 背景治理字段命名混用 snake_case 和 camelCase
- **文件**: `skills/spec-first/13-orchestrate/SKILL.md:224-234`
- **证据**:
  - 展示层要求 snake_case（background_status, dependency_strength）
  - 内部 runtime 允许 camelCase
- **影响**: 可能导致字段名不一致
- **整改建议**: 在 SKILL.md 明确说明内部与展示层的命名转换规则

#### [P1-7] 00_init 特殊处理逻辑未在执行阶段中体现
- **文件**: `skills/spec-first/13-orchestrate/SKILL.md:104-109`
- **证据**:
  - skill-mapping.md 说明 00_init 直接 verify → advance
  - 但 P0-P5 执行阶段未提及此特殊处理
- **影响**: 实现时可能遗漏 00_init 的特殊逻辑
- **整改建议**: 在 P4 执行阶段补充 00_init 的分支处理

### 3.4 P2 问题（优化）

#### [P2-3] CLI 依赖列表不完整
- **文件**: `skills/spec-first/13-orchestrate/SKILL.md:173-177`
- **证据**: 仅列出 4 个命令（stage current/advance, gate check, metrics health）
- **缺失**: feature current, matrix sync, metrics coverage
- **整改建议**: 补全所有依赖的 CLI 命令

#### [P2-4] 缺少参数约束说明
- **文件**: `skills/spec-first/13-orchestrate/SKILL.md:18-23`
- **证据**: 未说明 --resume 必须搭配 --auto
- **整改建议**: 补充参数约束表格

### 3.5 Stage 映射完整性

| Stage | 映射 Skill | 状态 | 问题 |
|-------|-----------|------|------|
| 00_init | 无 | ✅ | 特殊处理：直接 verify → advance |
| 01_specify | 03-spec | ✅ | |
| 02_design | 04-design | ✅ | 按需：05-research |
| 03_plan | 06-task | ✅ | |
| 04_implement | 07-code | ✅ | 按需：08-review |
| 05_verify | 12-verify | ✅ | |
| 06_wrap_up | 10-archive | ✅ | |
| 07_release | ? | ❌ | **缺失映射** |
| 08_done | ? | ❌ | **缺失映射** |
| 09_cancelled | ? | ⚠️ | 未在 orchestrate 中处理 |

### 3.6 一致性检查
- ❌ **与 truth-source.ts 不一致**: 缺少 07_release 和 08_done 映射
- ✅ **与 dispatcher.ts 基本一致**: 参数解析逻辑匹配
- ⚠️ **与 orchestration-governance-contract.md 部分一致**: output-format.md 未严格遵守 snake_case 规范

---

## 整改路线图

### 第一阶段（P0 问题，必须修复）

| 问题ID | 整改任务 | 预计工时 | 验证方法 |
|--------|---------|---------|---------|
| P0-1 | 补全 RUNTIME_COMMANDS 或明确筛选标准 | 2h | 运行验证脚本，确认覆盖率 |
| P0-2 | 清理 REMOVED_SKILLS 数据污染 | 1h | 单元测试验证无 `/` 字符 |
| P0-3 | 补充 orchestrate 的 07_release 和 08_done 映射 | 2h | 检查 skill-mapping.md 完整性 |
| P0-4 | 明确 --auto-advance 参数语义 | 1h | 补充参数组合表格和示例 |

**总计**: 6 小时

### 第二阶段（P1 问题，建议修复）

| 问题ID | 整改任务 | 预计工时 | 验证方法 |
|--------|---------|---------|---------|
| P1-1 | 补充 SEMANTIC_MAP 或明确覆盖范围 | 1h | 文档说明 |
| P1-2 | 补全 SKILL_STAGE_REQUIREMENTS | 2h | 检查所有 skill 的阶段约束 |
| P1-3 | 补充 PRIMARY_STAGE_SKILL 的 09_cancelled 映射 | 0.5h | 代码审查 |
| P1-4 | 修正 resolveSkillPath 优先级或文档 | 1h | 测试扩展 skill 加载顺序 |
| P1-01 | 补充 SHARED.md 的 P0-P5 例外声明引用 | 0.5h | 文档审查 |
| P1-02 | 补充 SHARED.md 的 confirm policy 声明位置 | 0.5h | 文档审查 |
| P1-03 | 补充 background-quality-contract.md 输出示例 | 1h | 文档审查 |
| P1-04 | 定义 L1/L2/L3 依赖强度语义 | 1h | 文档审查 |
| P1-5 | 统一 orchestrate 编排序列描述 | 0.5h | 文档审查 |
| P1-6 | 明确背景治理字段命名转换规则 | 0.5h | 文档审查 |
| P1-7 | 补充 00_init 特殊处理逻辑 | 0.5h | 文档审查 |

**总计**: 9.5 小时

### 第三阶段（P2 问题，可选优化）

| 问题ID | 整改任务 | 预计工时 | 验证方法 |
|--------|---------|---------|---------|
| P2-1 | 重构 SCOPE_GUARD_SKILLS 为真理源 | 1h | 代码审查 |
| P2-2 | 增强 Hard Gate 的 git 错误处理 | 2h | 单元测试 |
| P2-3 | 补全 orchestrate CLI 依赖列表 | 0.5h | 文档审查 |
| P2-4 | 补充 orchestrate 参数约束说明 | 0.5h | 文档审查 |
| P2-01 ~ P2-04 | SHARED.md 相关优化 | 2h | 文档审查 |

**总计**: 6 小时

---

## 附录

### A. 关键文件路径
- `src/core/skill-runtime/dispatcher.ts`
- `src/core/skill-runtime/hard-gate.ts`
- `src/core/skill-runtime/scope-guard.ts`
- `src/core/rules/truth-source.ts`
- `skills/spec-first/SHARED.md`
- `skills/spec-first/shared/background-quality-contract.md`
- `skills/spec-first/shared/orchestration-governance-contract.md`
- `skills/spec-first/13-orchestrate/SKILL.md`
- `skills/spec-first/13-orchestrate/references/skill-mapping.md`

### B. 数据统计
- CLI 命令总数: 26
- RUNTIME_COMMANDS 覆盖: 11/26 (42%)
- Skills 总数: 20
- SKILL_STAGE_REQUIREMENTS 覆盖: 8/20 (40%)
- orchestrate Stage 映射覆盖: 7/9 (77.8%)
- SHARED.md 被引用: 13/20 (65%)

### C. 下一步行动
1. 立即修复 4 个 P0 问题（预计 6 小时）
2. 继续 Phase 2: 主工作流链路审查（spec/code/catchup/first 等 8 个核心 skill）
3. 完成所有 20 个 skill 审查后，生成完整审计报告
