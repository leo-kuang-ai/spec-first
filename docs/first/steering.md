# Spec-First 技术方向指引

> 面向开发者的技术决策指南 | 基于 `.spec-first/runtime/first/steering.json` 生成

---

## 概述

本文档定义 spec-first 项目的技术约束、架构模式、设计决策和风险警示。所有代码变更应遵循本指引。

**证据来源**: `tsconfig.json:1-22`, `package.json:1-102`, `CLAUDE.md`, `src/core/`

---

## 技术栈约束

### 主技术栈

| 属性 | 值 | 约束 |
|------|-----|------|
| 语言 | TypeScript >= 5.4.0 | strict mode + verbatimModuleSyntax |
| 运行时 | Node.js >= 20.0.0 | ESM only |
| 模块系统 | ESM | `"type": "module"`, 禁止 CommonJS |
| 构建工具 | tsup 8.5+ | - |
| 测试框架 | Vitest 1.6+ | globals enabled, v8 coverage |

**证据**: `tsconfig.json:1-22`, `package.json:31-33`

### 强制约束

| 约束 | 说明 | 证据 |
|------|------|------|
| ESM Only | 全项目 `"type": "module"`，禁止 CommonJS | `package.json:5` |
| Named Exports Only | core 模块禁止使用 default export | [约定，代码验证] |
| Strict Mode | TypeScript strict + verbatimModuleSyntax | `tsconfig.json:9,18` |
| Coverage Threshold | lines/functions/statements 75%, branches 65% | `vitest.config.ts` |

---

## 架构模式

### 双层架构

```
+-------------------+        +-------------------+
|    Skill Layer    | -----> |    CLI Layer      |
|  (流程编排/触发)   |        |  (确定性原子能力)  |
+-------------------+        +-------------------+
```

- **Skill 层**：流程编排与触发，定义 prompt 模板和执行上下文
- **CLI 层**：提供确定性原子能力，所有业务逻辑在 core 模块中

**证据**: `skills/README.md:11-26`

### 三层规范体系

```
Layer 0 (基线) ──> Layer 1 (裁剪) ──> Layer 2 (端特有)
```

- Layer 0: 通用规范模板
- Layer 1: 项目级裁剪
- Layer 2: 平台/端特有配置

**证据**: [memory:architecture]

### 文件即状态

- 不引入数据库
- 使用 JSONL 审计日志
- 状态文件通过 CLI 命令管理，禁止手动编辑

**证据**: [memory:architecture]

### Skill 无状态

- Skill 只做编排和生成
- 状态由 CLI 管理
- Skill 调用不产生副作用

**证据**: [memory:architecture]

---

## 设计模式

### 阶段状态机

```
+----------+     +------------+     +-----------+     +---------+
| 00_init  | --> | 01_specify | --> | 02_design | --> | 03_plan |
+----------+     +------------+     +-----------+     +---------+
                                                          |
                                                          v
+----------+     +------------+     +-----------+     +---------+
| 08_done  | <-- | 07_release | <-- | 06_wrap_up| <-- |04_impl  |
+----------+     +------------+     +-----------+     +---------+
     |
     +------------------------------------------> +--------------+
                                                 |09_cancelled  |
                                                 +--------------+
```

**特性**：
- 8 active + 2 terminal stages
- 单向不可逆流转
- 任意阶段可取消

**证据**: `src/shared/types.ts:9-20`, `src/core/process-engine/stage-machine.ts:8-17`

### 追溯 ID 体系

**14 类 ID**：

```
业务链路:  FR → DS → TASK → TC
          ↘ RFC ↗

V-Model:  REQ → SYS → ARCH → MOD
          ATP   STP   ITP    UTP

顶层:     Feature
```

**证据**: `src/core/trace-engine/id-taxonomy.ts:6-52`

### Skill 三层路由

```
用户输入
    │
    v
+----------------+     复合命令映射 (如 "rfc approve" → CLI+参数)
| Semantic Map   |
+----------------+
    │
    v
+----------------+     直接分发 CLI (id/docs/stage/rfc/defect/...)
| Runtime Route  |
+----------------+
    │
    v
+----------------+     搜索 skills/spec-first/NN-name/SKILL.md
| Skill File     |
+----------------+
```

**证据**: `src/core/skill-runtime/dispatcher.ts:1-200`

---

## 命名约定

| 类别 | 约定 | 示例 |
|------|------|------|
| 文件 | kebab-case.ts | `stage-machine.ts`, `id-generator.ts` |
| 变量 | camelCase | `getNextStage`, `featureId` |
| 常量 | UPPER_SNAKE_CASE (global) / camelCase (local) | `TRANSITIONS`, `RELEASE_REQUIRED_ARTIFACTS` |
| 类/接口/类型 | PascalCase | `FeatureState`, `GateResult` |
| 未使用变量 | `_` 前缀 | `_unused`, `_idx` |
| Skill 命名空间 | `spec-first:*` | `/spec-first:code`, `/spec-first:gate` |

**证据**: `src/core/**/*.ts`, `skills/README.md:100`

---

## 业务规则

### Stage 转换规则

| 规则 | 说明 |
|------|------|
| 单向不可逆 | 终态（08_done/09_cancelled）不可转换，活跃阶段只能向前推进或取消 |
| Gate 前置 | 只有 Gate 状态为 PASS 或 PASS_WITH_WAIVER 时才允许调用 stage advance |

**证据**: `src/core/process-engine/stage-machine.ts:30-38`, `src/core/gate-engine/gate-evaluator.ts:100-106`

### 覆盖率计算规则

| 规则 | 说明 |
|------|------|
| C3 传递链覆盖 | TASK 覆盖 FR 的计算支持传递：TASK → DS → FR |
| C4 直接覆盖 | TC 覆盖 FR 的计算仅支持直接关联，不支持传递 |

**证据**: `src/core/trace-engine/upstream-lineage.ts:16-73`

### Gate 条件规则

- **19 条 Gate 条件**：16 blocking + 3 warning
- Warning 条件：G-SPEC-00, G-SPEC-03, G-DESIGN-03

**证据**: `src/core/gate-engine/condition-registry.ts:39-234`

### Skill-Stage 映射

| Skill | Stage |
|-------|-------|
| spec | 01_specify |
| design | 02_design |
| task | 03_plan |
| code | 04_implement |
| verify | 05_verify |
| archive | 06_wrap_up |

**证据**: `src/core/rules/truth-source.ts:13-23`

### Release 必需产物

- `reports/smoke-test-report.md`
- `reports/release-note.md`

**证据**: `src/core/rules/truth-source.ts:45-48`

---

## 风险警示

### 高风险

| 风险 | 说明 | 缓解措施 |
|------|------|---------|
| 状态文件安全 | stage-state.json 等状态文件不可逆，手动编辑会导致 Gate 校验失准 | 强制使用 CLI 命令（`spec-first stage advance`），禁止手动编辑 |

**证据**: `CLAUDE.md:10-25`

### 中风险

| 风险 | 说明 | 缓解措施 |
|------|------|---------|
| 模块边界 | core 模块间可能存在循环依赖或边界模糊 | 使用 `src/shared/types.ts` 集中类型定义，core 模块间通过接口解耦 |
| 测试覆盖率 | 部分核心模块可能未达到 75% 覆盖率阈值 | 运行 `npm run test:coverage` 验证，补充缺失测试 |
| 循环依赖 | skill-runtime 与 gate-engine 之间存在双向依赖风险 | 通过 shared/types 或 rules 模块解耦 |

**证据**: `src/shared/types.ts`, `package.json:95-101`

### 低风险

| 风险 | 说明 | 缓解措施 |
|------|------|---------|
| 依赖版本 | pnpm overrides 中有 rollup、minimatch、esbuild 覆盖 | 定期检查 overrides 是否仍然必要 |

**证据**: `package.json:95-101`

---

## 优先级规则汇总

### P0 - 必须遵守

| 规则 | 说明 | 证据 |
|------|------|------|
| ESM Only | 全项目 type: module，禁止 CommonJS | `package.json:5` |
| Named Exports Only | core 模块禁止使用 default export | [约定] |
| Stage 单向不可逆 | 阶段只能向前推进或取消 | `src/core/process-engine/stage-machine.ts:30-38` |
| Gate 前置校验 | 推进阶段前必须通过 Gate | `src/core/gate-engine/gate-evaluator.ts:100-106` |
| 代码变更自检 | typecheck → test → CHANGELOG 更新 | `CLAUDE.md` |

### P1 - 强烈建议

| 规则 | 说明 | 证据 |
|------|------|------|
| 类型集中定义 | Stage/ExitCode/ID types 等在 src/shared/types.ts | `CLAUDE.md` |
| Plan 模式触发 | 修改 3+ 文件或涉及 src/core/ 核心逻辑 | `CLAUDE.md` |
| 追溯 ID 规范 | 14 类 ID，遵循命名格式 | `src/core/trace-engine/id-taxonomy.ts:6-52` |
| 覆盖率阈值 | lines/functions/statements 75%, branches 65% | `vitest.config.ts` |

### P2 - 推荐遵守

| 规则 | 说明 | 证据 |
|------|------|------|
| 测试分层 | unit / integration / e2e / benchmark / fixtures | `tests/` |

---

## 待确认项

| 项目 | 状态 | 建议操作 |
|------|------|---------|
| vitest.config.ts coverage threshold | 待确认 | 读取 `vitest.config.ts` 验证覆盖率阈值配置 |
| ESLint unused variable 规则 | 待确认 | 读取 `eslint.config.js` 验证 `_` 前缀规则 |
| batch-executor 核心符号 | 待确认 | 读取 `src/core/batch-executor/index.ts` 确认导出符号 |
| migrations 核心符号 | 待确认 | 读取 `src/core/migrations/index.ts` 确认导出符号 |
| C4 覆盖率计算逻辑 | 待确认 | 搜索 C4 或 TC 覆盖率相关代码确认计算逻辑 |

---

## 证据路径汇总

| 来源 | 路径 |
|------|------|
| TypeScript 配置 | `tsconfig.json:1-22` |
| 项目配置 | `package.json:1-102` |
| 类型定义 | `src/shared/types.ts` |
| 状态机 | `src/core/process-engine/stage-machine.ts` |
| Skill 分发 | `src/core/skill-runtime/dispatcher.ts` |
| Gate 引擎 | `src/core/gate-engine/gate-evaluator.ts` |
| 条件注册 | `src/core/gate-engine/condition-registry.ts` |
| 追溯引擎 | `src/core/trace-engine/id-taxonomy.ts` |
| 上游血缘 | `src/core/trace-engine/upstream-lineage.ts` |
| RFC 状态机 | `src/core/change-mgr/rfc-machine.ts` |
| 规则定义 | `src/core/rules/truth-source.ts` |
| Skill 定义 | `skills/README.md:1-155` |
| 开发规范 | `CLAUDE.md:10-25` |

---

## 相关文档

- **[README.md](./README.md)** — 项目认知总览（Onboarding 指南）
- **[summary.md](./summary.md)** — 项目摘要
- **[domain-model.md](./domain-model.md)** — 领域模型详解
- **[conventions.md](./conventions.md)** — 代码约定
