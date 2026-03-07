# 全链路治理实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标：** 让 `spec-first` 在 Skill 文档、运行时守卫、Gate 评估和 CLI 路由之间遵循同一套可执行治理模型。

**架构：** 先把阶段与 layer 治理收敛到统一运行时注册表，再据此统一 `test` / `code-review` / `verify` 的语义边界，随后去掉 Gate 对 Skill 文案的依赖，最后把证据记录和编排模型升级为状态驱动。整体工作按 `P0 / P1 / P2` 分阶段推进，保证每一阶段结束后系统都保持自洽。

**技术栈：** TypeScript、Vitest、Markdown Skill 资产、Node.js 20、ESM

---

### Task 1: P0 建立统一治理注册表

**文件：**
- 新建：`src/core/skill-runtime/skill-governance.ts`
- 修改：`src/core/skill-runtime/hard-gate.ts`
- 修改：`src/core/skill-runtime/dispatcher.ts`
- 修改：`src/shared/skill-commands.ts`
- 测试：`tests/unit/hard-gate.test.ts`
- 测试：`tests/unit/skill-runtime.test.ts`

**Step 1: 先写失败测试**

增加以下断言：
- 绑定阶段的 skill 映射来自同一个导出的治理注册表
- `code-review` 允许的 layer 在中心位置定义
- `verify` 允许的 layer 在中心位置定义

**Step 2: 运行测试并确认失败**

运行：`npx vitest run tests/unit/hard-gate.test.ts tests/unit/skill-runtime.test.ts`  
预期：FAIL，因为阶段和 layer 治理规则仍分别散落在 `hard-gate.ts` 与 `dispatcher.ts` 中。

**Step 3: 写最小实现**

创建 `skill-governance.ts`，导出：

```ts
export const SKILL_STAGE_BINDINGS = { /* ... */ };
export const SKILL_LAYER_BINDINGS = { /* ... */ };
export const COMMAND_FAMILIES = { /* ... */ };
```

然后更新 `hard-gate.ts`、`dispatcher.ts` 和 `skill-commands.ts`，改为统一消费该注册表。

**Step 4: 运行测试并确认通过**

运行：`npx vitest run tests/unit/hard-gate.test.ts tests/unit/skill-runtime.test.ts`  
预期：PASS

**Step 5: 提交**

```bash
git add src/core/skill-runtime/skill-governance.ts src/core/skill-runtime/hard-gate.ts src/core/skill-runtime/dispatcher.ts src/shared/skill-commands.ts tests/unit/hard-gate.test.ts tests/unit/skill-runtime.test.ts
git commit -m "refactor: centralize skill governance rules"
```

### Task 2: P0 收紧 `test` / `code-review` / `verify` 的语义边界

**文件：**
- 修改：`skills/spec-first/08-code-review/SKILL.md`
- 修改：`skills/spec-first/09-test/SKILL.md`
- 修改：`skills/spec-first/12-verify/SKILL.md`
- 修改：`skills/spec-first/README.md`
- 修改：`src/core/skill-runtime/dispatcher.ts`
- 修改：`src/core/skill-runtime/hard-gate.ts`
- 测试：`tests/unit/skill-runtime.test.ts`
- 测试：`tests/unit/hard-gate.test.ts`

**Step 1: 先写失败测试**

增加以下断言：
- `code-review --layer completion` 会被拒绝
- `verify` 只接受 `completion`
- `test` 不再绑定到 `05_verify`

**Step 2: 运行测试并确认失败**

运行：`npx vitest run tests/unit/skill-runtime.test.ts tests/unit/hard-gate.test.ts`  
预期：FAIL，因为运行时仍接受 `code-review --layer completion`，并且仍把 `test` 绑定到 `05_verify`。

**Step 3: 写最小实现**

- 从 `code-review` 允许的 layer 集合中移除 `completion`
- 在中心治理注册表中把 `test` 重新绑定到目标阶段
- 更新这 3 个 Skill 文档和 `skills/spec-first/README.md`，使其与运行时语义一致

**Step 4: 运行测试并确认通过**

运行：`npx vitest run tests/unit/skill-runtime.test.ts tests/unit/hard-gate.test.ts`  
预期：PASS

**Step 5: 提交**

```bash
git add skills/spec-first/08-code-review/SKILL.md skills/spec-first/09-test/SKILL.md skills/spec-first/12-verify/SKILL.md skills/spec-first/README.md src/core/skill-runtime/dispatcher.ts src/core/skill-runtime/hard-gate.ts tests/unit/skill-runtime.test.ts tests/unit/hard-gate.test.ts
git commit -m "refactor: align review verify and test stage semantics"
```

### Task 3: P0 让 Gate 脱离 Skill 文档逻辑耦合

**文件：**
- 修改：`src/core/gate-engine/gate-evaluator.ts`
- 测试：`tests/unit/gate-evaluator.test.ts`
- 新建：`tests/unit/skill-governance-docs.test.ts`

**Step 1: 先写失败测试**

增加以下断言：
- C11 不会因为 `03-spec/04-design/08-code-review` 的 Skill 文档缺少引用文字而单独失败
- 文档引用完整性由单独的 docs/catalog 测试负责

**Step 2: 运行测试并确认失败**

运行：`npx vitest run tests/unit/gate-evaluator.test.ts tests/unit/skill-governance-docs.test.ts`  
预期：FAIL，因为 `gate-evaluator.ts` 仍把 Skill 文档引用视为 C11 的一部分。

**Step 3: 写最小实现**

- 从 `evaluateConstitutionAuthorityMapping` 中移除对 Skill 文案的检查
- 保留 constitution 元数据与 feature/global constitution 一致性检查在 Gate 内
- 把文档引用检查迁移到单独的文档治理测试中

**Step 4: 运行测试并确认通过**

运行：`npx vitest run tests/unit/gate-evaluator.test.ts tests/unit/skill-governance-docs.test.ts`  
预期：PASS

**Step 5: 提交**

```bash
git add src/core/gate-engine/gate-evaluator.ts tests/unit/gate-evaluator.test.ts tests/unit/skill-governance-docs.test.ts
git commit -m "refactor: decouple gate rules from skill document prose"
```

### Task 4: P1 引入结构化证据账本

**文件：**
- 新建：`src/core/skill-runtime/evidence-ledger.ts`
- 修改：`src/core/skill-runtime/hard-gate.ts`
- 修改：`src/core/process-engine/advance.ts`
- 修改：`skills/spec-first/07-code/SKILL.md`
- 修改：`skills/spec-first/08-code-review/SKILL.md`
- 修改：`skills/spec-first/12-verify/SKILL.md`
- 测试：`tests/unit/hard-gate.test.ts`
- 测试：`tests/e2e/core-flow.test.ts`

**Step 1: 先写失败测试**

增加以下断言：
- TDD RED 可以从结构化 ledger 记录中读取
- plan approval 可以从结构化 ledger 记录中读取
- `findings.md` 不再是唯一的机器可读来源

**Step 2: 运行测试并确认失败**

运行：`npx vitest run tests/unit/hard-gate.test.ts tests/e2e/core-flow.test.ts`  
预期：FAIL，因为当前证据仍只从 `findings.md` 解析。

**Step 3: 写最小实现**

创建 JSONL ledger API：

```ts
type EvidenceEntry =
  | { type: 'tdd_red'; taskId: string; command: string; exitCode: number; timestamp: string }
  | { type: 'plan_approved'; approver: string; timestamp: string }
  | { type: 'review_result'; layer: string; result: 'pass' | 'fail'; timestamp: string };
```

更新 `hard-gate.ts`，优先读取 ledger，仅在迁移阶段回退到 `findings.md`。

**Step 4: 运行测试并确认通过**

运行：`npx vitest run tests/unit/hard-gate.test.ts tests/e2e/core-flow.test.ts`  
预期：PASS

**Step 5: 提交**

```bash
git add src/core/skill-runtime/evidence-ledger.ts src/core/skill-runtime/hard-gate.ts src/core/process-engine/advance.ts skills/spec-first/07-code/SKILL.md skills/spec-first/08-code-review/SKILL.md skills/spec-first/12-verify/SKILL.md tests/unit/hard-gate.test.ts tests/e2e/core-flow.test.ts
git commit -m "feat: add structured governance evidence ledger"
```

### Task 5: P1 收敛命令家族与 Skill 心智

**文件：**
- 修改：`src/cli/commands/feature.ts`
- 修改：`src/core/skill-runtime/dispatcher.ts`
- 修改：`skills/spec-first/README.md`
- 修改：`skills/spec-first/17-feature-list/SKILL.md`
- 修改：`skills/spec-first/18-feature-switch/SKILL.md`
- 修改：`skills/spec-first/19-feature-current/SKILL.md`
- 修改：`skills/spec-first/02-catchup/SKILL.md`
- 修改：`skills/spec-first/11-plan/SKILL.md`
- 修改：`skills/spec-first/14-status/SKILL.md`
- 测试：`tests/unit/skill-runtime.test.ts`

**Step 1: 先写失败测试**

增加以下断言：
- `feature` 继续作为主 CLI 命令族
- 已废弃的 feature 子 skill 会明确引导到 `spec-first feature ...`
- 上下文相关 skill 的职责描述不再重叠

**Step 2: 运行测试并确认失败**

运行：`npx vitest run tests/unit/skill-runtime.test.ts`  
预期：FAIL，因为 Skill 文档和运行时路由仍体现为碎片化命令心智。

**Step 3: 写最小实现**

- 保持 `feature list/current/switch` 作为规范 CLI 路径
- 把 `17/18/19` 改成薄包装或迁移提示
- 按 `recover / observe / decide` 重组 `catchup/status/plan` 文档

**Step 4: 运行测试并确认通过**

运行：`npx vitest run tests/unit/skill-runtime.test.ts`  
预期：PASS

**Step 5: 提交**

```bash
git add src/cli/commands/feature.ts src/core/skill-runtime/dispatcher.ts skills/spec-first/README.md skills/spec-first/17-feature-list/SKILL.md skills/spec-first/18-feature-switch/SKILL.md skills/spec-first/19-feature-current/SKILL.md skills/spec-first/02-catchup/SKILL.md skills/spec-first/11-plan/SKILL.md skills/spec-first/14-status/SKILL.md tests/unit/skill-runtime.test.ts
git commit -m "refactor: converge feature and context command families"
```

### Task 6: P2 把 `orchestrate` 升级为状态驱动编排器

**文件：**
- 修改：`src/core/skill-runtime/orchestrate-args.ts`
- 修改：`src/core/skill-runtime/dispatcher.ts`
- 修改：`src/core/process-engine/feature.ts`
- 修改：`skills/spec-first/13-orchestrate/SKILL.md`
- 修改：`skills/spec-first/13-orchestrate/references/skill-mapping.md`
- 测试：`tests/unit/skill-runtime.test.ts`
- 测试：`tests/e2e/core-flow.test.ts`

**Step 1: 先写失败测试**

增加以下断言：
- orchestrate 的推荐依赖当前阶段和可用证据，而不是只看阶段编号
- orchestrate 不再硬编码与当前治理规则冲突的 review/test 建议

**Step 2: 运行测试并确认失败**

运行：`npx vitest run tests/unit/skill-runtime.test.ts tests/e2e/core-flow.test.ts`  
预期：FAIL，因为当前编排行为仍主要由线性阶段映射主导。

**Step 3: 写最小实现**

- 基于 stage + gate + evidence 计算下一步推荐
- 保留 `--auto` 行为，但去掉过时的 layer/stage 假设
- 更新 orchestrate 文档，解释状态驱动决策方式

**Step 4: 运行测试并确认通过**

运行：`npx vitest run tests/unit/skill-runtime.test.ts tests/e2e/core-flow.test.ts`  
预期：PASS

**Step 5: 提交**

```bash
git add src/core/skill-runtime/orchestrate-args.ts src/core/skill-runtime/dispatcher.ts src/core/process-engine/feature.ts skills/spec-first/13-orchestrate/SKILL.md skills/spec-first/13-orchestrate/references/skill-mapping.md tests/unit/skill-runtime.test.ts tests/e2e/core-flow.test.ts
git commit -m "feat: make orchestrate state driven"
```

### Task 7: 全链路回归与审查归档

**文件：**
- 新建：`docs/04-审查报告/2026-03-07-full-flow-governance-review.md`
- 测试：`tests/unit/hard-gate.test.ts`
- 测试：`tests/unit/skill-runtime.test.ts`
- 测试：`tests/unit/gate-evaluator.test.ts`
- 测试：`tests/unit/stage-machine.test.ts`
- 测试：`tests/e2e/core-flow.test.ts`

**Step 1: 运行聚焦回归测试集**

运行：`npx vitest run tests/unit/hard-gate.test.ts tests/unit/skill-runtime.test.ts tests/unit/gate-evaluator.test.ts tests/unit/stage-machine.test.ts tests/e2e/core-flow.test.ts`  
预期：PASS

**Step 2: 检查 Git diff 与影响范围**

运行：`git diff --stat`  
预期：只包含治理相关文件，不应出现无关改动扩散。

**Step 3: 编写审查报告**

记录：
- 已完成的 `P0 / P1 / P2` 项
- 剩余风险
- 延后事项
- 对未来 Skill 变更的操作建议

**Step 4: 提交**

```bash
git add docs/04-审查报告/2026-03-07-full-flow-governance-review.md
git commit -m "docs: record full flow governance review"
```
