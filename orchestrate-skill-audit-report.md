# Phase 1.3: orchestrate Skill 审查结果

**审查日期**: 2026-03-18
**审查范围**: orchestrate skill 调度逻辑与 skill-mapping 完整性
**审查文件数**: 6

---

## 审查摘要

- **审查文件数**: 6 (SKILL.md + 3 references + truth-source.ts + orchestrate-args.ts)
- **发现问题数**: 7 (P0: 2, P1: 3, P2: 2)
- **审查状态**: ❌ **不通过** — 存在 2 个 P0 阻塞问题

---

## 问题清单

### P0 阻塞问题

#### P0-1: Stage 映射不一致 — 07_release 缺失

**位置**:
- `skills/spec-first/13-orchestrate/SKILL.md` L197-207
- `skills/spec-first/13-orchestrate/references/skill-mapping.md` L10-19

**问题描述**:
- SKILL.md 和 skill-mapping.md 的 Stage → Skill 映射表只覆盖到 `06_wrap_up`，缺少 `07_release` 和 `08_done` 的映射
- `truth-source.ts` 中 `PRIMARY_STAGE_SKILL` 定义了完整的 9 个阶段映射（包括 `07_release: 'golive'` 和 `08_done: 'done'`）
- `DELIVERY_ROUTE` 也包含完整的 9 个阶段路由

**影响**:
- orchestrate 在 `07_release` 和 `08_done` 阶段无法正确调度
- 文档与代码真理源不一致，可能导致运行时错误

**修复建议**:
```markdown
| 当前阶段 | 调度 Skill | 说明 |
|---------|-----------|------|
| 00_init | 无 | init 已完成 |
| 01_specify | 03-spec | 需求定义 |
| 02_design | 04-design | 技术设计（05-research 按需） |
| 03_plan | 06-task | 任务拆解 |
| 04_implement | 07-code | 代码实现（08-review 按需） |
| 05_verify | 12-verify | 阶段验收 |
| 06_wrap_up | 10-archive | 归档总结 |
| 07_release | golive (runtime) | 上线检查 |
| 08_done | done (runtime) | 已完成（终态） |
```

---

#### P0-2: 参数模式描述不完整 — 缺少 --auto-advance 语义

**位置**: `skills/spec-first/13-orchestrate/SKILL.md` L18-23

**问题描述**:
- SKILL.md L22 提到 `--auto-advance` 参数，但语义描述不清晰："仅当决策层返回 `READY_TO_ADVANCE / AUTO_ADVANCE` 时才执行 `stage advance`"
- 缺少与 `--auto` 的区别说明
- `orchestrate-args.ts` L18-25 中有清晰的注释："此标志只控制'阶段推进'，不控制'skill 执行'"
- 但 SKILL.md 中未体现这一关键区别

**影响**:
- 用户可能混淆 `--auto` 和 `--auto-advance` 的作用域
- 可能导致误用参数

**修复建议**:
```markdown
## 参数模式
- `/spec-first:orchestrate`：默认只做协调与建议，不自动推进阶段
- `/spec-first:orchestrate --auto`：运行 todo auto-loop，自动执行 TASK，但不自动推进阶段
- `/spec-first:orchestrate --auto --resume`：基于最近 checkpoint 恢复 auto-loop
- `/spec-first:orchestrate --auto-advance`：在 `--auto` 基础上，当所有 TASK 完成且 Gate 通过时，自动执行 `stage advance`
  - 注意：`--auto-advance` 只控制"阶段推进"，不控制"skill 执行"
  - 必须与 `--auto` 配合使用（单独使用无效）
```

---

### P1 重要问题

#### P1-1: 编排序列描述不一致

**位置**:
- `skills/spec-first/13-orchestrate/SKILL.md` L106 "plan -> skill 执行 -> verify -> stage advance"
- `skills/spec-first/13-orchestrate/SKILL.md` L193 "plan -> (spec|design|task|code|archive) -> verify -> advance"
- `skills/spec-first/13-orchestrate/references/skill-mapping.md` L112 "plan → skill → verify → advance"

**问题描述**:
- 三处描述的编排序列表述不一致
- L106 使用 "skill 执行"，L193 使用具体 skill 名称，L112 使用 "skill"
- 虽然语义相同，但表述不统一可能造成理解偏差

**修复建议**:
统一为：`plan → skill → verify → advance`，并在首次出现时注释："skill 指当前阶段对应的主 Skill（如 spec/design/task/code/archive）"

---

#### P1-2: 背景治理字段命名不一致

**位置**:
- `skills/spec-first/13-orchestrate/SKILL.md` L222-234
- `skills/spec-first/13-orchestrate/references/output-format.md` L187-220

**问题描述**:
- SKILL.md L222-234 描述了背景治理口径，提到"展示层统一使用 snake_case"
- 但 output-format.md L187-220 的示例中混用了 `background_status` (snake_case) 和 `backgroundStatus` (camelCase)
- 虽然 orchestration-governance-contract.md 明确了分层命名规则，但 output-format.md 未严格遵守

**修复建议**:
- output-format.md 的所有用户可见输出示例必须使用 snake_case
- 内部 runtime 结构可以使用 camelCase，但不应出现在输出模板中

---

#### P1-3: 缺少 00_init 特殊处理的明确说明

**位置**:
- `skills/spec-first/13-orchestrate/SKILL.md` L201 "00_init | 无（init 已完成）| 直接 verify -> advance"
- `skills/spec-first/13-orchestrate/references/skill-mapping.md` L124-131

**问题描述**:
- SKILL.md L201 在映射表中简单标注"无（init 已完成）"
- skill-mapping.md L124-131 有专门的"00_init 特殊处理"章节，说明"直接 verify → advance"
- 但 SKILL.md 的执行阶段 P0-P5 (L103-109) 中未体现 00_init 的特殊处理逻辑
- 可能导致 orchestrate 在 00_init 阶段仍然尝试调度不存在的 skill

**修复建议**:
在 SKILL.md 的"执行阶段"章节增加：
```markdown
- P0: 定位 Feature，加载当前阶段与状态
  - **特殊处理**: 若当前阶段为 00_init，跳过 P1-P4，直接进入 P5 (verify -> advance)
```

---

### P2 优化建议

#### P2-1: 缺少 CLI 依赖的完整性说明

**位置**: `skills/spec-first/13-orchestrate/SKILL.md` L173-177

**问题描述**:
- CLI 依赖列表只列出了 4 个命令
- 但根据 SKILL.md 内容，orchestrate 还依赖：
  - `spec-first feature current` (L25-36 Feature 定位规则)
  - `spec-first matrix sync` (L156 证据铁律)
  - `spec-first metrics coverage` (L156 证据铁律)
- 列表不完整可能导致用户在 CLI 不可用时无法正确降级

**修复建议**:
```markdown
## CLI 依赖
- `spec-first feature current` — Feature 定位
- `spec-first stage current` — 阶段查询
- `spec-first stage advance` — 阶段推进
- `spec-first gate check` — Gate 校验
- `spec-first matrix sync` — 追溯矩阵同步
- `spec-first metrics coverage` — 覆盖率查询
- `spec-first metrics health` — 健康度评分
```

---

#### P2-2: 缺少与 dispatcher.ts 的参数解析一致性验证

**位置**:
- `skills/spec-first/13-orchestrate/SKILL.md` L18-23
- `src/core/skill-runtime/orchestrate-args.ts` L13-26

**问题描述**:
- SKILL.md 描述的参数模式与 `orchestrate-args.ts` 的 `OrchestrateArgs` 接口基本一致
- 但缺少对 `validateOrchestrateArgs` 函数的校验规则的明确说明
- 例如：`--resume` 必须搭配 `--auto` (L91-95)，但 SKILL.md 中未明确禁止单独使用 `--resume`

**修复建议**:
在参数模式章节增加"参数约束"小节：
```markdown
### 参数约束
- `--resume` 必须与 `--auto` 配合使用，单独使用会报错
- `--auto-advance` 建议与 `--auto` 配合使用（单独使用时无实际效果）
- 重复参数会被去重，只保留第一次出现
```

---

## Stage 映射完整性

| Stage | 映射 Skill | 状态 | 问题 |
|-------|-----------|------|------|
| 00_init | 无 (特殊处理) | ⚠️ | P1-3: 执行阶段未体现特殊处理逻辑 |
| 01_specify | 03-spec | ✅ | 无 |
| 02_design | 04-design | ✅ | 按需: 05-research |
| 03_plan | 06-task | ✅ | 无 |
| 04_implement | 07-code | ✅ | 按需: 08-review |
| 05_verify | 12-verify | ✅ | 无 |
| 06_wrap_up | 10-archive | ✅ | 无 |
| 07_release | golive (runtime) | ❌ | **P0-1: 映射表缺失** |
| 08_done | done (runtime) | ❌ | **P0-1: 映射表缺失** |

**覆盖率**: 7/9 (77.8%)
**阻塞项**: 2 个阶段缺失映射

---

## 一致性检查

### 与 truth-source.ts 一致性

- ❌ **不一致**: SKILL.md 和 skill-mapping.md 缺少 `07_release` 和 `08_done` 的映射
- ✅ **一致**: 01-06 阶段的映射与 `PRIMARY_STAGE_SKILL` 一致
- ✅ **一致**: 与 `DELIVERY_ROUTE` 的前 7 个阶段一致

**详细对比**:

| Stage | truth-source.ts | SKILL.md | 一致性 |
|-------|----------------|----------|--------|
| 00_init | init | 无 (特殊处理) | ✅ (语义一致) |
| 01_specify | spec | 03-spec | ✅ |
| 02_design | design | 04-design | ✅ |
| 03_plan | task | 06-task | ✅ |
| 04_implement | code | 07-code | ✅ |
| 05_verify | verify | 12-verify | ✅ |
| 06_wrap_up | archive | 10-archive | ✅ |
| 07_release | golive | **缺失** | ❌ |
| 08_done | done | **缺失** | ❌ |

---

### 与 dispatcher.ts 一致性

- ✅ **一致**: 参数解析逻辑与 `OrchestrateArgs` 接口匹配
- ⚠️ **部分一致**: 背景治理信号与 `resolveOrchestrateBackgroundGuidance` 函数一致，但 SKILL.md 描述不够详细
- ❌ **不一致**: SKILL.md 未明确说明 `--resume` 必须搭配 `--auto` 的约束 (P2-2)

**背景治理信号对比**:

| 信号字段 | dispatcher.ts | SKILL.md | output-format.md | 一致性 |
|---------|--------------|----------|------------------|--------|
| backgroundStatus | camelCase (内部) | snake_case (展示) | 混用 | ⚠️ P1-2 |
| dependencyStrength | L1/L2/L3 | L1/L2/L3 | L1/L2/L3 | ✅ |
| riskCategory | 3 种 | 3 种 | 3 种 | ✅ |
| riskSignals | string[] | string[] | 示例正确 | ✅ |
| recommendedAction | 3 种 | 3 种 | 3 种 | ✅ |

---

### 与 orchestration-governance-contract.md 一致性

- ✅ **一致**: SKILL.md L222-234 明确引用了 contract 并遵守命名分层规则
- ⚠️ **部分一致**: output-format.md 的示例未严格遵守展示层 snake_case 规则 (P1-2)
- ✅ **一致**: 背景状态、依赖强度、风险类别的枚举值与 contract 完全一致
- ✅ **一致**: L3 的判定逻辑（高依赖阶段 + 高风险信号）与 contract 一致

---

## 其他发现

### 1. 文档结构良好

- SKILL.md 结构清晰，章节划分合理
- 使用了 Graphviz 流程图清晰展示编排流程
- 参考文档分离得当（skill-mapping.md、orchestration-rules.md、output-format.md）

### 2. 证据铁律执行严格

- L111-117 明确要求阶段推进前必须执行证据链
- 与 verify skill 的五步证据铁律一致
- 反合理化守卫 (L165-171) 有效防止 AI "带病推进"

### 3. 上下文裁剪规则合理

- L118-131 的 Fresh Context Per Task 规则清晰
- 2KB 上限控制合理
- 避免了上下文污染问题

### 4. Todo 状态机与 todo-runner 一致

- L139-151 的状态流转与 `src/core/task-plan/todo-runner.ts` 实现一致
- 支持中断恢复
- 终止条件明确

---

## 修复优先级

1. **立即修复 (P0)**:
   - P0-1: 补全 07_release 和 08_done 的映射
   - P0-2: 完善 --auto-advance 参数说明

2. **本周修复 (P1)**:
   - P1-1: 统一编排序列表述
   - P1-2: 修正 output-format.md 的命名一致性
   - P1-3: 补充 00_init 特殊处理说明

3. **下次迭代 (P2)**:
   - P2-1: 补全 CLI 依赖列表
   - P2-2: 增加参数约束说明

---

## 审查结论

orchestrate skill 的核心调度逻辑设计合理，文档结构清晰，但存在 **2 个 P0 阻塞问题**：

1. Stage 映射不完整，缺少 07_release 和 08_done
2. 参数模式描述不清晰，可能导致误用

建议优先修复 P0 问题后再进行下一阶段审查。

---

**审查人**: Claude (Spec-First Quality Audit)
**审查版本**: orchestrate skill v1.1.0
**下一步**: 修复 P0 问题后重新审查
