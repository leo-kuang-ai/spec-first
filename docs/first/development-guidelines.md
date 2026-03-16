---
mode: deep
generated_at: 2026-03-16
evidence_level: code_analysis
sources:
  - CLAUDE.md
  - package.json
  - tsconfig.json
  - eslint.config.js
  - vitest.config.ts
  - src/shared/types.ts
  - src/core/process-engine/stage-machine.ts
  - tests/unit/stage-machine.test.ts
---

# Spec-First 开发规范

> **文档定位**: 本文档基于代码实证分析生成，所有规则均可在实际代码中找到依据。
> **适用范围**: Spec-First 项目所有 TypeScript 代码开发。

---

## 目录

- [1. 代码风格规范](#1-代码风格规范)
- [2. 测试规范](#2-测试规范)
- [3. 提交规范](#3-提交规范)
- [4. 目录结构规范](#4-目录结构规范)
- [5. 关键约定](#5-关键约定)
- [6. 开发工作流](#6-开发工作流)

---

## 1. 代码风格规范

### 1.1 模块系统

**规则**: ESM only，全项目使用 `"type": "module"` [证据: package.json:5]

```json
{
  "type": "module"
}
```

**影响**:
- 所有导入使用 `import/export` 语法
- 文件扩展名必须为 `.js`（即使源码是 `.ts`）
- 导入路径必须包含扩展名：`import { foo } from './bar.js'`

**示例** [证据: src/core/process-engine/stage-machine.ts:5]:

```typescript
// ✅ 正确：使用 .js 扩展名
import { Stage, TERMINAL_STAGES } from '../../shared/types.js';

// ❌ 错误：使用 .ts 扩展名或无扩展名
import { Stage } from '../../shared/types';
import { Stage } from '../../shared/types.ts';
```

### 1.2 导出规范

**规则**: Named exports only，core 模块禁止使用 default export [证据: CLAUDE.md:218]

```typescript
// ✅ 正确：命名导出
export function assertTransitionAllowed(from: Stage, to: Stage): void {
  // ...
}

export class TransitionError extends Error {
  // ...
}

// ❌ 错误：默认导出
export default class StageMachine {
  // ...
}
```

**理由**: 命名导出支持 tree-shaking，避免命名冲突，IDE 自动导入更友好。

### 1.3 文件命名

**规则**: 文件名使用 kebab-case [证据: CLAUDE.md:219]

```
src/
  core/
    process-engine/
      stage-machine.ts      ✅ 正确
      StageMachine.ts       ❌ 错误
      stageMachine.ts       ❌ 错误
```

### 1.4 类型定义

**规则**: 类型集中在 `src/shared/types.ts` [证据: CLAUDE.md:220]

**核心类型定义** [证据: src/shared/types.ts]:

```typescript
// Stage 枚举（单向不可逆）
export enum Stage {
  INIT = '00_init',
  SPECIFY = '01_specify',
  DESIGN = '02_design',
  PLAN = '03_plan',
  IMPLEMENT = '04_implement',
  VERIFY = '05_verify',
  WRAP_UP = '06_wrap_up',
  RELEASE = '07_release',
  DONE = '08_done',
  CANCELLED = '09_cancelled',
}

// ExitCode 枚举
export enum ExitCode {
  SUCCESS = 0,
  GATE_FAILED = 1,
  VALIDATION_ERROR = 2,
  CONFIG_ERROR = 3,
  IO_ERROR = 4,
  UNKNOWN_ERROR = 5,
  INVALID_ARGS = 6,
  GENERAL_ERROR = 7,
}

// 追溯 ID 类型（14 类）
export type IdType = NextIdType | 'Feature';
export type NextIdType =
  | 'FR' | 'DS' | 'TASK' | 'TC' | 'RFC'
  | 'REQ' | 'SYS' | 'ARCH' | 'MOD'
  | 'ATP' | 'STP' | 'ITP' | 'UTP';
```

**新增类型时**:
1. 优先添加到 `src/shared/types.ts`
2. 跨模块共享的类型必须在 `types.ts` 中定义
3. 模块内部类型可在同文件或 `types.ts` 子文件定义

### 1.5 未使用变量

**规则**: 未使用变量使用 `_` 前缀 [证据: eslint.config.js:22]

```javascript
// ESLint 配置
'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
```

**示例**:

```typescript
// ✅ 正确：未使用参数加 _ 前缀
function parseArgs(_config: Config, value: string) {
  return value.trim();
}

// ❌ 错误：未使用参数不加前缀
function parseArgs(config: Config, value: string) {
  return value.trim(); // config 未使用会报错
}
```

### 1.6 TypeScript 配置

**规则**: strict mode + verbatimModuleSyntax [证据: tsconfig.json:9,18]

```json
{
  "compilerOptions": {
    "strict": true,
    "verbatimModuleSyntax": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler"
  }
}
```

**影响**:
- 必须显式处理可能为 null/undefined 的值
- 类型导入必须使用 `import type`
- 枚举等运行时值使用普通 `import`

```typescript
// ✅ 正确：类型导入
import type { Stage } from '../../shared/types.js';

// ✅ 正确：运行时值导入
import { Stage } from '../../shared/types.js';

// ❌ 错误：混用
import { type Stage, ExitCode } from '../../shared/types.js';
```

---

## 2. 测试规范

### 2.1 测试框架

**框架**: Vitest (globals enabled) [证据: package.json:12, vitest.config.ts:5]

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    include: ['tests/**/*.test.ts'],
  },
});
```

**无需显式导入**:

```typescript
// ✅ 正确：直接使用全局函数
import { Stage } from '../../src/shared/types.js';

describe('stage-machine', () => {
  it('should pass', () => {
    expect(true).toBe(true);
  });
});

// ❌ 错误：无需导入 vitest
import { describe, it, expect } from 'vitest';
```

### 2.2 测试结构

**目录结构** [证据: CLAUDE.md:225-231]:

```
tests/
  unit/           # 单元测试（每模块一文件）
    stage-machine.test.ts
    gate-evaluator.test.ts
  integration/    # 集成测试
  e2e/            # 端到端测试
  benchmark/      # 性能基准测试
  fixtures/       # 测试固件数据
```

**命名规范**:
- 测试文件与源文件对应：`src/core/foo.ts` → `tests/unit/foo.test.ts`
- 使用 `.test.ts` 后缀

### 2.3 覆盖率要求

**阈值** [证据: vitest.config.ts:11-16]:

```typescript
coverage: {
  provider: 'v8',
  thresholds: {
    lines: 75,
    functions: 75,
    branches: 65,
    statements: 75,
  },
}
```

**运行命令** [证据: package.json:14]:

```bash
npm test                   # 运行测试
npm run test:watch         # watch 模式
npm run test:coverage      # 覆盖率报告
npx vitest run tests/unit/<file>.test.ts  # 单文件
```

### 2.4 测试示例

**单元测试示例** [证据: tests/unit/stage-machine.test.ts]:

```typescript
import { Stage } from '../../src/shared/types.js';
import {
  assertTransitionAllowed,
  isTerminal,
  getNextStages,
  TransitionError,
} from '../../src/core/process-engine/stage-machine.js';

describe('stage-machine', () => {
  describe('assertTransitionAllowed — forward chain', () => {
    it.each(FORWARD_CHAIN)('%s → %s should be allowed', (from, to) => {
      expect(() => assertTransitionAllowed(from, to)).not.toThrow();
    });
  });

  describe('assertTransitionAllowed — illegal transitions', () => {
    it('should reject skipping stages (INIT → DESIGN)', () => {
      expect(() => assertTransitionAllowed(Stage.INIT, Stage.DESIGN))
        .toThrow(TransitionError);
    });
  });

  describe('isTerminal', () => {
    it('DONE is terminal', () => {
      expect(isTerminal(Stage.DONE)).toBe(true);
    });
  });
});
```

---

## 3. 提交规范

### 3.1 自检清单

**规则**: 每次 `src/` 下 `.ts` 文件变更后必须执行自检 [证据: CLAUDE.md:40-48]

```
✅ 自检清单（回复中必须逐项输出）
□ 1. npm run typecheck — 已通过 / 已确认无需（原因：____）
□ 2. npm test — 已通过 / 受影响范围已通过
□ 3. CHANGELOG.md — 已更新 / 豁免（原因：____）
□ 4. 变更范围 — 已确认仅限必要文件，无误改/遗漏
```

### 3.2 CHANGELOG 更新

**规则**: CHANGELOG.md 主动更新 [证据: CLAUDE.md:50-52]

**格式** [证据: CHANGELOG.md:10]:

```markdown
- vX.Y.Z YYYY-MM-DD 作者: 一句话摘要 (user-visible)
```

**示例**:

```markdown
- v1.1.0 2026-03-16 Claude: feat(stage-machine): 新增阶段转换校验函数 (user-visible)
- v1.1.0 2026-03-16 Claude: test(stage-machine): 补充终态阶段边界测试
```

**豁免条件**（必须全部满足）[证据: CLAUDE.md:52]:
1. 仅修改 `.md`/`.yaml` 文件
2. 不涉及 `package.json`、`src/shared/types.ts`、`src/core/rules/truth-source.ts`
3. 不删除测试用例
4. 不修改覆盖率阈值配置

### 3.3 CLAUDE.md 同步提交

**规则**: 每次 commit 将 CLAUDE.md 纳入提交范围 [证据: CLAUDE.md:53]

```bash
git add src/core/foo.ts tests/unit/foo.test.ts CHANGELOG.md CLAUDE.md
git commit -m "feat(core): add foo module"
```

### 3.4 常用命令

**构建与检查** [证据: package.json:10-11]:

```bash
npm run build              # tsup 打包
npm run typecheck          # tsc --noEmit 类型检查
```

**代码质量** [证据: package.json:15-17]:

```bash
npm run lint               # eslint src
npm run lint:fix           # 自动修复
npm run format             # prettier 格式化
```

---

## 4. 目录结构规范

### 4.1 顶层目录

**结构** [证据: CLAUDE.md:169-178]:

```
spec-first/
  src/              # 源代码
    cli/            # CLI 命令注册与路由（27 个命令）
    core/           # 核心引擎（14 个模块）
    shared/         # 共享类型（types.ts）、工具函数
  specs/            # Feature 产物目录（状态文件由 spec-first CLI 管理）
  skills/           # Skill 定义（.md 文件，20 个）
  templates/        # Handlebars 模板
  tests/            # 测试代码
  docs/             # 文档
  .spec-first/      # 项目级配置与运行时状态
```

### 4.2 核心模块

**`src/core/` 模块职责** [证据: CLAUDE.md:188-203]:

| 模块 | 职责 |
|------|------|
| `process-engine/` | 阶段状态机（8 active + 2 terminal），驱动 Feature 生命周期 |
| `skill-runtime/` | Skill 分发、prompt 组装、hard-gate 校验 |
| `ai-orchestrator/` | Auto-loop、catchup 上下文恢复 |
| `gate-engine/` | 阶段质量门禁评估（19条：16 blocking + 3 warning） |
| `trace-engine/` | 追溯 ID 生成/校验/搜索、覆盖率矩阵 |
| `change-mgr/` | RFC + Defect 状态机、影响分析 |
| `template/` | Handlebars 模板渲染、产物生成 |
| `tool-integration/` | AI runtime hooks、context 同步 |
| `metrics-engine/` | 健康度评分（H1）、瓶颈检测（R1-R5） |
| `validators/` | 产物格式校验（ID 格式、必需章节） |
| `task-plan/` | task_plan.md 解析、Todo 状态管理 |
| `rules/` | 真理源（RELEASE_REQUIRED_ARTIFACTS 等） |
| `batch-executor/` | 批量任务执行、并行编排支持 |
| `migrations/` | 状态文件版本迁移、升级兼容处理 |

### 4.3 文件组织

**模块内部结构**:

```
src/core/process-engine/
  stage-machine.ts      # 阶段状态机核心
  feature.ts            # Feature 生命周期
  extensions.ts         # 扩展功能
  index.ts              # 模块导出
```

**禁止**:
- 循环依赖
- 跨层级直接导入（应通过 `index.ts` 重导出）
- 在 `core/` 模块中使用 default export

---

## 5. 关键约定

### 5.1 Stage 枚举

**规则**: Stage 枚举单向不可逆 [证据: CLAUDE.md:182, src/core/process-engine/stage-machine.ts:8-17]

```typescript
// 合法转换链
00_init → 01_specify → 02_design → 03_plan → 04_implement → 05_verify → 06_wrap_up → 07_release → 08_done

// 任意非终态阶段 → 09_cancelled
```

**终态阶段**:
- `08_done`: 正常完成
- `09_cancelled`: 取消（不可逆）

**代码校验** [证据: src/core/process-engine/stage-machine.ts:30-38]:

```typescript
export function assertTransitionAllowed(from: Stage, to: Stage): void {
  if (TERMINAL_STAGES.has(from)) {
    throw new TransitionError(from, to, 'source stage is terminal');
  }

  const allowed = TRANSITIONS.get(from);
  if (!allowed || !allowed.has(to)) {
    throw new TransitionError(from, to, 'transition not allowed');
  }
}
```

### 5.2 追溯 ID（14 类）

**ID 分类** [证据: CLAUDE.md:183]:

```
业务链路: FR DS TASK TC RFC
V-Model:  REQ SYS ARCH MOD / ATP STP ITP UTP
顶层:     Feature
```

**ID 生成**:

```bash
spec-first id generate FR --feature <featureId>
spec-first id search FR-UIOPT-001
```

### 5.3 覆盖率（5 项）

**核心指标** [证据: CLAUDE.md:184, src/shared/types.ts:211-217]:

```typescript
export interface CoverageMetrics {
  C3: number; // 任务覆盖率（TASK 覆 FR，传递链）
  C4: number; // 测试覆盖率（TC 直接覆 FR，不支持传递）
  C6: number; // 实现覆盖率（TASK 已实现）
  C8: number; // 任务合规率（TASK 有上游）
  C9: number; // TC 合规率（TC 有上游 FR）
}
```

**阈值**:
- C3/C6/C8/C9: 目标 100%
- C4: 目标 67%-100%（阶段相关）

### 5.4 Gate 条件

**类型** [证据: CLAUDE.md:193]:
- **Blocking (16 条)**: 失败时阻断阶段推进
- **Warning (3 条)**: 失败时警告但不阻断

**状态** [证据: src/shared/types.ts:105]:

```typescript
export type GateStatus = 'PASS' | 'PASS_WITH_WAIVER' | 'FAIL';
```

---

## 6. 开发工作流

### 6.1 场景路由

**场景判断表** [证据: CLAUDE.md:61-70]:

| 场景 | 路径 | Skill |
|------|------|-------|
| 功能开发 / 重构 | 完整 4 步 | `/spec-first:code` |
| Bug 修复 / CI 失败 | 直接修复 → 自检 | `/spec-first:review` |
| 性能优化 / 依赖升级 | 分析影响 → 如改 3+ 文件进 Plan 模式 | `/spec-first:analyze` |
| 测试补全 / 覆盖率提升 | 直接实现 → 自检 | — |
| 代码评审反馈 | 直接修复 → 自检 | `/spec-first:review` |
| 文档 / 配置 / 小改动 | 直接执行 → 确认结果 | — |
| 纯分析 / 调研 | Subagent 隔离上下文 | `/spec-first:research` |

### 6.2 Plan 模式触发条件

**必须进入 Plan 模式** [证据: CLAUDE.md:92-97]:

1. 修改 3+ 个文件
2. 新增或删除公开导出（public exports）
3. 涉及 `src/core/` 核心逻辑**且**变更函数签名 / 导出接口 / 状态机逻辑
4. 变更 Stage 枚举、ID 体系、Gate 条件
5. 遇到偏差立即停下重新规划

### 6.3 功能开发完整流程

**4 步流程** [证据: CLAUDE.md:77-84]:

1. **计划** — 在 `specs/{featureId}/task_plan.md` 写任务清单
   ```
   - [ ] TASK-{FEAT}-{NNN} [P{优先级}] 任务标题
   ```

2. **确认** — 实现前与用户确认

3. **执行** — 逐项实现，使用 `/spec-first:code`

4. **自检** — 执行强制自检清单

### 6.4 核心原则

**两条原则** [证据: CLAUDE.md:36-38]:

1. **KISS + 最小影响** — 变更只触及必要范围，找根因，不打临时补丁
2. **规范驱动** — 任何实现必须能追溯到对应规范定义（FR/DS/TASK）

**禁止**:
- "带假设开工"
- 过度工程化
- 临时补丁

---

## 附录：Spec-First CLI 常用命令

**Feature 管理**:

```bash
spec-first feature current                          # 查看当前 featureId
spec-first feature switch FSREQ-20260313-UIOPT-001  # 切换 Feature
```

**Gate 校验**:

```bash
spec-first gate check --feature <featureId>         # 执行 Gate 校验
spec-first gate check --feature <featureId> --stage 03_plan
```

**追踪管理**:

```bash
spec-first matrix sync --feature <featureId>        # 同步追踪矩阵
spec-first metrics --feature <featureId>            # 查看 C3/C4/C6/C8/C9
spec-first id search FR-UIOPT-001                   # 追溯某 ID 的上下游
spec-first id generate FR --feature <featureId>     # 生成新 FR ID
```

**变更管理**:

```bash
spec-first defect create --feature <featureId>      # 创建缺陷记录
spec-first rfc create --feature <featureId>         # 创建变更请求
```

**阶段推进**:

```bash
spec-first stage advance --feature <featureId>      # 推进阶段（须先通过 Gate）
```

---

## 证据索引

本文档所有规则均来自代码实证，以下是关键证据文件：

| 规则类别 | 证据文件 | 关键行号 |
|---------|---------|---------|
| ESM only | package.json | 5 |
| TypeScript strict | tsconfig.json | 9, 18 |
| Named exports | CLAUDE.md | 218 |
| 文件命名 | CLAUDE.md | 219 |
| 类型集中 | CLAUDE.md | 220, src/shared/types.ts |
| 未使用变量 | eslint.config.js | 22 |
| 测试框架 | vitest.config.ts | 5 |
| 覆盖率阈值 | vitest.config.ts | 11-16 |
| 自检清单 | CLAUDE.md | 40-48 |
| CHANGELOG | CLAUDE.md | 50-52, CHANGELOG.md:10 |
| Stage 不可逆 | src/core/process-engine/stage-machine.ts | 8-17, 30-38 |
| 追溯 ID | CLAUDE.md | 183, src/shared/types.ts:24-38 |
| 覆盖率指标 | CLAUDE.md | 184, src/shared/types.ts:211-217 |
| Plan 模式 | CLAUDE.md | 92-97 |
| 工作流 | CLAUDE.md | 61-70, 77-84 |

---

**文档版本**: 1.0.0
**最后更新**: 2026-03-16
**维护者**: Spec-First Team
