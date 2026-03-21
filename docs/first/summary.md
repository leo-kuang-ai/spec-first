# Spec-First 项目摘要

> 版本 1.1.4 | 生成日期 2026-03-20

## 执行摘要

**Spec-First** 是一款 AI 工作流 CLI 工具，专注于规范驱动开发。通过阶段状态机、质量门禁和全链路追溯，实现从需求到交付的完整研发闭环。

### 核心价值主张

1. **规范驱动** — 任何实现必须能追溯到对应规范定义（FR/DS/TASK）
2. **质量保障** — 19 条 Gate 条件确保阶段交付质量
3. **全链路追溯** — 14 类 ID 体系支持上下游追溯
4. **状态机驱动** — 8 个活跃阶段 + 2 个终态，单向不可逆

## 技术栈一览

| 类别 | 技术选型 |
|------|---------|
| Runtime | Node.js >= 20.0.0 |
| Language | TypeScript >= 5.4, strict mode |
| Module System | ESM (`"type": "module"`) |
| Bundler | tsup |
| Test Framework | Vitest (v8 coverage) |
| Coverage Thresholds | lines/functions/statements 75%, branches 65% |
| Lint | ESLint + typescript-eslint + Prettier |
| Templates | Handlebars |
| Config Parser | js-yaml |

## 项目规模

| 指标 | 数值 |
|------|------|
| 源文件总数 | 146 个 |
| Core 模块文件 | 103 个 |
| CLI 命令 | 28 个 |
| Skill 定义 | 20 个 |
| 模板文件 | 15 个 |
| Core 代码行数 | ~22,645 行 |
| 预估总行数 | ~28,000 行 |
| 单元测试文件 | 161 个 |

## 模块概览

### 核心引擎（14 个模块）

| 模块 | 职责 | 文件数 |
|------|------|--------|
| process-engine | 阶段状态机、Feature 生命周期管理 | 8 |
| gate-engine | 质量门禁评估、PRD 评分 | 9 |
| trace-engine | 追溯 ID 生成/校验、覆盖率矩阵 | 9 |
| skill-runtime | Skill 分发、prompt 组装、hard-gate 校验 | 11 |
| ai-orchestrator | Auto-loop、catchup 上下文恢复 | 15 |
| change-mgr | RFC + Defect 状态机、影响分析 | 6 |
| metrics-engine | 健康度评分、瓶颈检测 | 3 |
| validators | 产物格式校验 | 1 |
| task-plan | task_plan.md 解析、Todo 状态管理 | 1 |
| template | Handlebars 模板渲染、产物生成 | 6 |
| tool-integration | AI runtime hooks、context 同步 | 11 |
| batch-executor | 批量任务执行、并行编排 | 11 |
| migrations | 状态文件版本迁移 | 6 |
| host-adapters | 多宿主环境适配（Claude/Codex/Cursor/Gemini） | 7 |

### 层次架构

```
┌─────────────────────────────────────────┐
│           CLI Layer (30 files)          │
│    命令注册与路由、用户交互入口            │
├─────────────────────────────────────────┤
│         Core Layer (103 files)          │
│    核心业务逻辑、14 个核心模块             │
├─────────────────────────────────────────┤
│        Shared Layer (13 files)          │
│    共享类型定义、工具函数                  │
├─────────────────────────────────────────┤
│        Config Layer (2 files)           │
│    配置与启动                            │
└─────────────────────────────────────────┘
```

**依赖方向**：CLI → Core → Shared

## 关键指标

### 阶段状态机

- **活跃阶段**：8 个（00_init → 07_release）
- **终态阶段**：2 个（08_done / 09_cancelled）
- **特性**：单向不可逆（除 09_cancelled）

### 追溯体系

- **ID 类型**：14 类
- **业务链路**：FR → DS → TASK → TC → RFC
- **V-Model 链路**：REQ → SYS → ARCH → MOD / ATP → STP → ITP → UTP
- **顶层**：Feature

### 覆盖率指标

| 指标 | 定义 | 传递性 |
|------|------|--------|
| C3 | TASK 覆 FR | 支持传递（TASK→DS→FR） |
| C4 | TC 覆 FR | 不支持传递（仅直接关联） |
| C6 | TASK 已实现 | 状态=Implemented/Verified/Accepted |
| C8 | TASK 有上游 | 反向合规（无孤儿 TASK） |
| C9 | TC 有上游 FR | 反向合规（无孤儿 TC） |

### Gate 系统

- **条件总数**：19 条
- **Blocking**：16 条
- **Warning**：3 条
- **结果类型**：PASS / PASS_WITH_WAIVER / FAIL

## 依赖清单

### Runtime Dependencies

| 包名 | 版本 | 用途 |
|------|------|------|
| handlebars | ^4.7.8 | 模板渲染引擎 |
| js-yaml | ^4.1.0 | YAML 配置解析 |
| semver | ^7.7.4 | 语义版本控制 |
| update-notifier | ^7.0.0 | CLI 更新通知 |

### Dev Dependencies

| 包名 | 版本 | 用途 |
|------|------|------|
| tsup | ^8.5.1 | TypeScript 打包工具 |
| vitest | ^1.6.1 | 测试框架 |
| typescript | ^5.4.0 | TypeScript 编译器 |
| typescript-eslint | ^8.56.1 | ESLint TypeScript 支持 |

## 关键约定

| 类别 | 约定 |
|------|------|
| Module System | ESM only (`"type": "module"`) |
| Exports | Named exports only（禁止 default export） |
| 文件命名 | kebab-case |
| 类型命名 | PascalCase |
| 函数命名 | camelCase |
| 常量命名 | UPPER_SNAKE_CASE |
| 未使用变量 | `_` 前缀 |
| 类型集中化 | `src/shared/types.ts` |

## 待确认事项

无

---

> 证据来源：`.spec-first/runtime/first/summary.json`、`package.json`、`src/shared/types.ts`
