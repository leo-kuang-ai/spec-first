# First Main Thread Context Reduction Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将 `spec-first:first` 的主线程收缩为“协调 + 裁决 + 验收”的最小控制面，同时把 runtime/docs 的证据、推理与正文生成稳定下沉到 subagents，避免主线程上下文继续膨胀。

**Architecture:** 以 `skills/spec-first/00-first/references/` 作为运行时合同的 canonical source，`docs/review-bundles/2026-03-20-first-subagent/` 只保留设计与实施说明。先锁主线程契约与 evidence pack schema，再收紧 `00-first/SKILL.md` 与执行流，再压薄 subagent 专项文档与 QA/detection 规则，最后用输出级回归验证 `first / init / status / orchestrate / ai catchup` 不回退。

**Tech Stack:** TypeScript, Vitest, Markdown skill docs, Spec-First runtime, review bundles

---

### Task 1: 固化主线程 canonical contract 与 evidence pack schema

**Files:**
- Modify: `skills/spec-first/00-first/references/main-thread-contract.md`
- Modify: `skills/spec-first/00-first/references/evidence-pack-spec.md`
- Modify: `skills/spec-first/00-first/references/agent-output-schema.md`
- Modify: `docs/review-bundles/2026-03-20-first-subagent/README.md`
- Test: `tests/unit/first-main-thread-contract.test.ts`
- Test: `tests/unit/first-evidence-pack-contract.test.ts`

**Step 1: 写失败测试**

新增测试，锁住以下事实：

- `main-thread-contract.md` 必须包含：
  - 当前 Feature
  - 当前波次
  - 资产目标
  - 并发上限
  - 重试规则
  - 验收条件
  - 禁止保留原始证据正文
- `evidence-pack-spec.md` 必须包含：
  - evidence pack 目录结构
  - runtime wave 可读范围
  - docs wave 可读范围
  - “主线程只发包，不发长证据”
- `agent-output-schema.md` 必须包含：
  - `status`
  - `artifacts`
  - `evidence_paths`
  - `gaps`
  - `next_action`
  - `blocked / retryable / [待确认]`
- `docs/review-bundles/2026-03-20-first-subagent/README.md` 必须只导航设计/实施文档，并明确 runtime contract 的 canonical source 在 `skills/spec-first/00-first/references/`

**Step 2: 运行测试确认失败**

Run:
```bash
pnpm -s vitest run tests/unit/first-main-thread-contract.test.ts tests/unit/first-evidence-pack-contract.test.ts
```

Expected:
- 新增断言在内容不完整或链接错误时失败
- 失败点集中在 canonical contract 内容或 bundle 索引说明

**Step 3: 写最小实现**

- 将 3 份 canonical contract 继续收敛到最小可读内容，但保持可被 `00-first/SKILL.md` 直接引用
- bundle README 只保留设计/实施说明与 canonical source 指向
- 不把运行时合同放回 review bundle

**Step 4: 再次运行测试**

Run:
```bash
pnpm -s vitest run tests/unit/first-main-thread-contract.test.ts tests/unit/first-evidence-pack-contract.test.ts
```

Expected:
- 两组 contract 测试通过

**Step 5: 提交**

```bash
git add skills/spec-first/00-first/references/main-thread-contract.md skills/spec-first/00-first/references/evidence-pack-spec.md skills/spec-first/00-first/references/agent-output-schema.md docs/review-bundles/2026-03-20-first-subagent/README.md tests/unit/first-main-thread-contract.test.ts tests/unit/first-evidence-pack-contract.test.ts
git commit -m "docs: add first main-thread canonical contracts"
```

---

### Task 2: 收紧 `00-first/SKILL.md` 与执行流文档

**Files:**
- Modify: `skills/spec-first/00-first/SKILL.md`
- Modify: `skills/spec-first/00-first/references/execution-flow.md`
- Modify: `tests/unit/first-skill-docs.test.ts`
- Modify: `tests/integration/skill-render.test.ts`

**Step 1: 写失败测试**

补断言覆盖以下方向：

- `00-first/SKILL.md` 必须引用 `references/main-thread-contract.md`、`references/evidence-pack-spec.md`、`references/agent-output-schema.md`
- `execution-flow.md` 必须显式包含 `load main-thread contract` 这一步
- `execution-flow.md` 必须保留 `collect evidence pack -> dispatch runtime agents -> dispatch docs agents -> write final files`
- `skill render first` 仍应渲染 spec-first 专属路径上下文，但不应把通用 skill 也带入相同注入语义

**Step 2: 运行测试确认失败**

Run:
```bash
pnpm -s vitest run tests/unit/first-skill-docs.test.ts tests/integration/skill-render.test.ts
```

Expected:
- 新增断言失败，直到 `SKILL.md` 和 `execution-flow.md` 收敛

**Step 3: 写最小实现**

- 保留 `first` 总入口定位
- 删除与子文档重复的执行细节
- 明确主线程只读取契约摘要与 wave 控制信息

**Step 4: 再次运行测试**

Run:
```bash
pnpm -s vitest run tests/unit/first-skill-docs.test.ts tests/integration/skill-render.test.ts
```

Expected:
- 文档边界通过
- `skill render first` 相关回归继续通过

**Step 5: 提交**

```bash
git add skills/spec-first/00-first/SKILL.md skills/spec-first/00-first/references/execution-flow.md tests/unit/first-skill-docs.test.ts tests/integration/skill-render.test.ts
git commit -m "docs: narrow first skill entry to main-thread coordination"
```

---

### Task 3: 收敛 subagent 架构与 agent 专项文档

**Files:**
- Modify: `skills/spec-first/00-first/references/subagent-architecture.md`
- Modify: `skills/spec-first/00-first/references/agents-code-analysis.md`
- Modify: `skills/spec-first/00-first/references/agents-api-deps.md`
- Modify: `skills/spec-first/00-first/references/agent-guidelines-setup.md`
- Modify: `skills/spec-first/00-first/references/agent-database.md`
- Modify: `skills/spec-first/00-first/references/agent-domain-model.md`
- Modify: `tests/unit/first-subagent-architecture.test.ts`
- Modify: `tests/unit/dispatcher-first-runtime.test.ts`

**Step 1: 写失败测试**

新增断言覆盖：

- `subagent-architecture.md` 必须包含 runtime agents / docs agents 的输入、输出、失败策略
- runtime agents 只输出 JSON，不写正文
- docs agents 只消费 runtime 结果与同轮 evidence pack，不重新取证
- `dispatcher` 继续只为 spec-first skill 注入路径上下文，不扩散到通用 skill

**Step 2: 运行测试确认失败**

Run:
```bash
pnpm -s vitest run tests/unit/first-subagent-architecture.test.ts tests/unit/dispatcher-first-runtime.test.ts
```

Expected:
- 契约项缺失时测试失败
- spec-first 路径上下文断言保持可验证

**Step 3: 写最小实现**

- 逐个压薄 5 份 agent 文档
- 保留任务范围、输入证据、输出资产、缺口标记
- 删除与其它 agent 重复的长说明
- `subagent-architecture.md` 固化为：
  - 五个 wave
  - 每波最多 3 个 agent
  - 失败重试一次后再阻断
- 本次不修改 `structure-analysis.md`、`domain-model-analysis.md`、`database-config.md`、`platform-document-mapping.md`、`testing-strategy.md`，它们属于低频补充文档，不在默认主线程热路径内

**Step 4: 再次运行测试**

Run:
```bash
pnpm -s vitest run tests/unit/first-subagent-architecture.test.ts tests/unit/dispatcher-first-runtime.test.ts
```

Expected:
- runtime/docs 分工测试通过
- spec-first 路径上下文行为不回退

**Step 5: 提交**

```bash
git add skills/spec-first/00-first/references/subagent-architecture.md skills/spec-first/00-first/references/agents-code-analysis.md skills/spec-first/00-first/references/agents-api-deps.md skills/spec-first/00-first/references/agent-guidelines-setup.md skills/spec-first/00-first/references/agent-database.md skills/spec-first/00-first/references/agent-domain-model.md tests/unit/first-subagent-architecture.test.ts tests/unit/dispatcher-first-runtime.test.ts
git commit -m "docs: clarify first subagent boundaries"
```

---

### Task 4: 收敛 detection 与 QA 规则

**Files:**
- Modify: `skills/spec-first/00-first/references/detection-rules.md`
- Modify: `skills/spec-first/00-first/references/quality-assurance-rules.md`
- Modify: `tests/unit/first-detection-rules.test.ts`
- Modify: `tests/unit/first-quality-rules.test.ts`

**Step 1: 写失败测试**

新增断言覆盖：

- `detection-rules.md` 只保留 platformType / subType / mixed / monorepo / unknown 的识别语义
- `quality-assurance-rules.md` 必须明确主线程只消费 agent 摘要，不消费完整推理链
- QA 规则必须保留证据标注格式和抽样验证矩阵

**Step 2: 运行测试确认失败**

Run:
```bash
pnpm -s vitest run tests/unit/first-detection-rules.test.ts tests/unit/first-quality-rules.test.ts
```

Expected:
- 规则收敛前测试失败

**Step 3: 写最小实现**

- `detection-rules.md` 保留识别目标与 failure degradation 语义
- `quality-assurance-rules.md` 保留中文输出、证据标注、抽样验证
- 新增“主线程只消费摘要”的约束
- 新增 runtime/docs 统一输出最小格式说明

**Step 4: 再次运行测试**

Run:
```bash
pnpm -s vitest run tests/unit/first-detection-rules.test.ts tests/unit/first-quality-rules.test.ts
```

Expected:
- 识别与 QA 规则收敛通过

**Step 5: 提交**

```bash
git add skills/spec-first/00-first/references/detection-rules.md skills/spec-first/00-first/references/quality-assurance-rules.md tests/unit/first-detection-rules.test.ts tests/unit/first-quality-rules.test.ts
git commit -m "docs: narrow first detection and qa contracts"
```

---

### Task 5: 收敛 review bundle 范围与索引

**Files:**
- Modify: `docs/review-bundles/2026-03-20-first-subagent/README.md`
- Modify: `docs/review-bundles/2026-03-20-first-subagent/2026-03-20-first-main-thread-context-reduction-design.md`
- Modify: `docs/review-bundles/2026-03-20-first-subagent/2026-03-20-first-main-thread-context-reduction-implementation-plan.md`
- Test: `tests/unit/first-subagent-bundle.test.ts`

**Step 1: 写失败测试**

新增断言覆盖：

- bundle 目录下至少包含设计稿与实施计划
- `README.md` 要能导航到两个核心文档
- bundle 路径必须统一为 `docs/review-bundles/2026-03-20-first-subagent/`
- runtime contract 不应放入 review bundle，canonical source 只允许落在 `skills/spec-first/00-first/references/`

**Step 2: 运行测试确认失败**

Run:
```bash
pnpm -s vitest run tests/unit/first-subagent-bundle.test.ts
```

Expected:
- bundle 索引缺失或 canonical source 指向错误时测试失败

**Step 3: 写最小实现**

- 创建或保留 bundle `README.md`
- 只写设计稿链接、实施计划链接、canonical source 指向、范围说明
- 不在 review bundle 中承载运行时合同

**Step 4: 再次运行测试**

Run:
```bash
pnpm -s vitest run tests/unit/first-subagent-bundle.test.ts
```

Expected:
- bundle 索引测试通过

**Step 5: 提交**

```bash
git add docs/review-bundles/2026-03-20-first-subagent/README.md docs/review-bundles/2026-03-20-first-subagent/2026-03-20-first-main-thread-context-reduction-design.md docs/review-bundles/2026-03-20-first-subagent/2026-03-20-first-main-thread-context-reduction-implementation-plan.md tests/unit/first-subagent-bundle.test.ts
git commit -m "docs: place first subagent docs in review bundle"
```

---

### Task 6: 做全量回归，确认 `first / init / status / orchestrate / ai catchup` 不受影响

**Files:**
- Test: `tests/integration/first-cli-real-flow.test.ts`
- Test: `tests/unit/init.test.ts`
- Test: `tests/unit/tool-integration.test.ts`
- Test: `tests/unit/orchestrate-stage-integration.test.ts`
- Test: `tests/unit/skill-runtime.test.ts`
- Test: `tests/unit/dispatcher-first-runtime.test.ts`
- Test: `tests/unit/prompt-assembler.test.ts`
- Test: `tests/unit/first-subagent-bundle.test.ts`

**Step 1: 写回归检查点**

锁住以下事实：

- `first` CLI 仍然只做最小支撑层检查
- `init` 仍能初始化 Feature，并保留背景输入状态
- `status` 仍能输出 runtime/docs 的状态摘要
- `orchestrate` 仍按现有 stage 语义工作
- `ai catchup` 仍可读取 `first-runtime-context`
- `skill render first` 仍只为 spec-first skill 注入路径上下文

**Step 2: 运行定向测试**

Run:
```bash
pnpm -s vitest run tests/integration/first-cli-real-flow.test.ts tests/unit/init.test.ts tests/unit/tool-integration.test.ts tests/unit/orchestrate-stage-integration.test.ts tests/unit/skill-runtime.test.ts tests/unit/dispatcher-first-runtime.test.ts tests/unit/prompt-assembler.test.ts
```

Expected:
- 关键流程不回退

**Step 3: 运行全量测试**

Run:
```bash
pnpm -s test
```

Expected:
- 全量通过
- 不出现新的 `first / init / status / orchestrate / ai catchup` 回归

**Step 4: 最终提交**

```bash
git add .
git commit -m "docs: reduce first main-thread context and tighten subagent contracts"
```

---

## 执行顺序建议

1. 先做 Task 1，落 canonical contract。
2. 再做 Task 2，把 `first` 主入口与执行流收拢。
3. 再做 Task 3，把 runtime/docs 分工和 agent contract 收紧。
4. 再做 Task 4，把 detection 和 QA 规则压到子 agent 契约层。
5. 再做 Task 5，锁定 review bundle 只承载设计与实施说明。
6. 最后做 Task 6，全量回归。

## 完成标准

- 新增的 canonical contract 文档全部存在且测试通过
- `first` 相关文档只保留最小主线程契约
- runtime agents / docs agents 的波次与输出边界明确
- QA / detection / agent 专项文档不再重复同一套规则
- 低频补充文档不在本轮改动范围内
- `pnpm test` 通过
- review bundle 只承载设计与实施说明，runtime contract 以 `skills/spec-first/00-first/references/` 为 canonical source
