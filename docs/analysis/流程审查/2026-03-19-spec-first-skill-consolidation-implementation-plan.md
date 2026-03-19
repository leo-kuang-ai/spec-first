# Spec-First Skill Consolidation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将 `spec-first` 的 skill 体系从“文档层重复”推进到“运行时可复用、节点职责更清晰、少数真重叠节点可 mode 化”的状态，降低维护成本，同时不破坏现有路由和门禁语义。

**Architecture:** 先锁定当前行为，再抽共享底座，最后才处理节点级合并。实现上以 `src/core/skill-runtime` 为主战场：把共享输入契约、运行时 notice 构建、Feature 定位、背景质量与治理字段统一到可复用层；`skills/spec-first/*/SKILL.md` 只保留职责边界与模式差异。对外命令尽量保持兼容，优先采用 mode 化和共享 helper，避免直接删节点导致路由和宿主渲染断裂。

**Tech Stack:** TypeScript, Vitest, Markdown skill docs, Spec-First CLI, repository governance docs

---

### Task 1: 冻结当前 skill 族群契约，建立回归基线

**Files:**
- Create: `tests/unit/skill-family-contracts.test.ts`
- Modify: `tests/unit/skill-runtime.test.ts`
- Modify: `tests/unit/skill-commands.test.ts`
- Read: `src/core/skill-runtime/context-resolver.ts`
- Read: `src/core/skill-runtime/dispatcher.ts`
- Read: `skills/spec-first/SHARED.md`
- Read: `skills/spec-first/shared/background-quality-contract.md`
- Read: `skills/spec-first/shared/orchestration-governance-contract.md`

**Step 1: 写失败测试**

先补一组“现状契约”测试，锁定当前已经成立的族群关系：

- `plan / orchestrate / task` 的输入资产契约应保持同构
- `code / review` 的输入资产契约应保持同构
- `status / analyze` 的输入资产契约应保持同构
- `review` 与 `spec-review` 仍应保持不同的输出模式与命名入口
- `feature` 仍应作为 `.spec-first/current` 的唯一读写入口

**Step 2: 运行测试确认基线**

Run:
```bash
pnpm -s vitest run tests/unit/skill-runtime.test.ts tests/unit/skill-commands.test.ts tests/unit/skill-family-contracts.test.ts
```

Expected:
- 现有测试通过
- 新增契约测试先失败，说明我们确实在锁定“想保留的边界”

**Step 3: 只补最小断言**

把测试写成“族群级别”的断言，而不是实现细节断言：

- 断言输入矩阵中的同构族群
- 断言 `review` / `spec-review` 入口分离
- 断言 `feature` 和 `catchup` 不共享控制面副作用

**Step 4: 重新运行并确认通过**

Run:
```bash
pnpm -s vitest run tests/unit/skill-runtime.test.ts tests/unit/skill-commands.test.ts tests/unit/skill-family-contracts.test.ts
```

Expected:
- 基线测试稳定通过
- 后续重构不会再靠“记忆中的边界”推进

**Step 5: 记录基线结论**

把本次族群判定写入 `findings.md` 或本次计划记录：

- 哪些是同族不同 mode
- 哪些是可合并候选
- 哪些明确不合并

---

### Task 2: 抽取共享 skill 家族注册表与上下文分发底座

**Files:**
- Create: `src/core/skill-runtime/skill-family.ts`
- Modify: `src/core/skill-runtime/context-resolver.ts`
- Modify: `src/core/skill-runtime/dispatcher.ts`
- Modify: `tests/unit/skill-runtime.test.ts`
- Create: `tests/unit/skill-family.test.ts`

**Step 1: 写失败测试**

先为新底座写测试，覆盖以下行为：

- skill 名称到族群映射可稳定查询
- skill 家族能返回 `required / optional` 输入资产
- `status / analyze`、`plan / orchestrate / task`、`code / review` 的族群分组可读
- `resolveSkillContext()` 不应改变现有返回结构

**Step 2: 提取族群数据结构**

在 `skill-family.ts` 中集中定义：

- skill family 名称
- 族群成员
- 共享输入资产
- 可选 mode 标签

这一步的目标不是改变行为，而是把现在散落在 `context-resolver.ts` 里的“隐式分组”显式化。

**Step 3: 将 `context-resolver.ts` 改为消费共享底座**

把 `SKILL_INPUT_MATRIX` 的重复模式收束到新底座，保留现有输出字段：

- `summary`
- `backgroundInputStatus`
- `requiredAssetNames`
- `optionalAssetNames`
- `missingRequiredAssets`
- `recommendedAction`

**Step 4: 将 `dispatcher.ts` 的 skill notice 选择保持稳定**

不改外部命令名，只把内部 notice 构建改成从共享族群底座读取：

- `plan`
- `orchestrate`
- `review`
- `spec-review`

仍然走独立 notice 分支，但共用底层族群配置。

**Step 5: 运行测试并确认没有路由回归**

Run:
```bash
pnpm -s vitest run tests/unit/skill-family.test.ts tests/unit/skill-runtime.test.ts tests/unit/skill-commands.test.ts
```

Expected:
- 所有现有 skill 命令仍可解析
- 运行时上下文字段与现状一致

---

### Task 3: 合并审查家族的共享核心，但保留 code/spec 两种模式

**Files:**
- Modify: `skills/spec-first/08-review/SKILL.md`
- Modify: `skills/spec-first/20-spec-review/SKILL.md`
- Modify: `src/core/skill-runtime/dispatcher.ts`
- Modify: `src/core/skill-runtime/context-resolver.ts`
- Create: `skills/spec-first/shared/review-contract.md`
- Modify: `tests/unit/review-skill-docs.test.ts`
- Create: `tests/unit/review-mode-routing.test.ts`

**Step 1: 写失败测试**

先验证两个审查入口现在仍然分开：

- `review` 默认是代码审查层
- `spec-review` 默认是规格审查层
- 两者都能共享同一个审查底座，但不能丢失 mode 差异

**Step 2: 抽取共享审查合同**

把重复的公共语义收敛进 `skills/spec-first/shared/review-contract.md`：

- Feature 定位规则
- 人工确认策略
- 输出结构
- 背景质量字段
- 风险分类口径

**Step 3: 让审查入口显式 mode 化**

推荐方向：

- 保留 `spec-first:review`
- 将 `spec-first:spec-review` 迁入 mode 或别名体系
- 审查清单、评分、输出路径按 mode 切换

如果暂时不准备删入口，也要把两个 skill 的公共部分抽到共享合同里，减少复制。

**Step 4: 更新文档测试**

补测试确认：

- `08-review` 和 `20-spec-review` 都引用共享合同
- 两者描述不再重复写同一套 Feature 定位和背景质量语义

**Step 5: 运行回归**

Run:
```bash
pnpm -s vitest run tests/unit/review-skill-docs.test.ts tests/unit/review-mode-routing.test.ts tests/unit/skill-runtime.test.ts
```

Expected:
- 审查入口仍可用
- 审查模式差异被保留下来
- 公共语义从文档复制变成共享合同

---

### Task 4: 让 plan / orchestrate 共享治理底座，并显式区分“计划”和“推进”

**Files:**
- Modify: `skills/spec-first/11-plan/SKILL.md`
- Modify: `skills/spec-first/13-orchestrate/SKILL.md`
- Modify: `skills/spec-first/shared/orchestration-governance-contract.md`
- Modify: `src/core/skill-runtime/orchestrate-args.ts`
- Modify: `src/core/skill-runtime/dispatcher.ts`
- Modify: `tests/unit/orchestrate-args-parser.test.ts`
- Create: `tests/unit/plan-orchestrate-contract.test.ts`

**Step 1: 写失败测试**

覆盖以下事实：

- `plan` 只负责计划与风险评估，不推进阶段
- `orchestrate` 负责批次执行与推进决策
- 两者共享 `dependencyStrength / riskCategory / riskSignals`
- `orchestrate` 的展示层字段仍然是 snake_case

**Step 2: 收敛 plan/orchestrate 的共享语义**

把两者共用的部分统一到治理 contract：

- `backgroundInputStatus`
- `dependencyStrength`
- `riskCategory`
- `riskSignals`
- `recommendedAction`

同时保留职责边界：

- `plan` = 决策与建议
- `orchestrate` = 编排与阶段流转

**Step 3: 设计可选的模式入口**

如果要进一步瘦身，先不要直接删除 `plan`，而是做 mode 化：

- `orchestrate --plan-only`
- `orchestrate --auto`
- `orchestrate --auto-advance`

这可以在保持兼容的前提下验证 `plan` 是否真的可以退场。

**Step 4: 调整文档与测试**

让 `11-plan` 与 `13-orchestrate`：

- 不再重复定义治理字段
- 只在自身职责段落里描述差异
- 引用共享 contract 作为真源

**Step 5: 回归验证**

Run:
```bash
pnpm -s vitest run tests/unit/orchestrate-args-parser.test.ts tests/unit/plan-orchestrate-contract.test.ts tests/unit/skill-runtime.test.ts
```

Expected:
- `plan` 和 `orchestrate` 的边界清晰
- 共享治理字段只维护一份

---

### Task 5: 收缩 status / analyze / doctor / catchup 的边界，避免分析口径互相侵入

**Files:**
- Modify: `skills/spec-first/14-status/SKILL.md`
- Modify: `skills/spec-first/21-analyze/SKILL.md`
- Modify: `skills/spec-first/15-doctor/SKILL.md`
- Modify: `skills/spec-first/02-catchup/SKILL.md`
- Modify: `src/core/skill-runtime/dispatcher.ts`
- Modify: `tests/unit/status-skill-docs.test.ts`
- Modify: `tests/unit/analyze-skill-docs.test.ts`
- Modify: `tests/unit/doctor-skill-docs.test.ts`
- Modify: `tests/unit/catchup-skill-docs.test.ts`

**Step 1: 写失败测试**

验证边界约束：

- `status` 只输出状态快照，不承担深度一致性分析
- `analyze` 只做只读一致性分析，不回写控制面
- `doctor` 只管宿主与环境，不管业务 stage 判断
- `catchup` 只管会话恢复，不自造新的分析口径

**Step 2: 重新划分职责**

把当前混杂的语义拆回去：

- `status` = 快照 + 健康分 + 下一步
- `analyze` = 严重度分级 + 证据 + 修复建议
- `doctor` = 环境诊断 + 修复计划
- `catchup` = 恢复报告 + 信息缺口

**Step 3: 统一背景质量的引用方式**

所有这四个 skill 只引用共享的背景质量 contract，不重复定义枚举口径。

**Step 4: 运行文档测试**

Run:
```bash
pnpm -s vitest run tests/unit/status-skill-docs.test.ts tests/unit/analyze-skill-docs.test.ts tests/unit/doctor-skill-docs.test.ts tests/unit/catchup-skill-docs.test.ts
```

Expected:
- 各自职责更窄
- 共享字段不再反复拷贝

---

### Task 6: 做最终回归与清理，确认没有引入技能路由退化

**Files:**
- Read/Test: `tests/unit/*.test.ts`
- Read/Test: `tests/integration/*.test.ts`
- Write: `docs/analysis/2026-03-19-spec-first-skill-consolidation-implementation-report.md`
- Write: `docs/analysis/2026-03-19-spec-first-skill-runtime-cluster-deep-dive.md`（如需补充）

**Step 1: 跑定向回归**

Run:
```bash
pnpm -s vitest run tests/unit/skill-runtime.test.ts tests/unit/skill-commands.test.ts tests/unit/orchestrate-args-parser.test.ts tests/unit/*skill-docs*.test.ts
```

**Step 2: 跑整体验证**

Run:
```bash
pnpm -s vitest run
```

**Step 3: 检查技能族群是否仍然成立**

确认以下事实仍为真：

- 共享底座已抽离
- review 家族模式化而非失真
- plan/orchestrate 责任分离
- status/analyze/doctor/catchup 边界收紧
- `feature` 仍是当前指针唯一入口

**Step 4: 形成收尾报告**

在收尾报告里明确：

- 哪些节点真正适合合并
- 哪些只适合共享底座
- 哪些不应再动
- 后续如果要继续瘦身，应该先动哪一层

