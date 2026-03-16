---
mode: quick
---

# Spec-First 代码库概览

> 快速了解项目结构与核心模块职责

## 目录结构

```
src/
├── cli/                    # CLI 入口与命令解析
│   ├── index.ts           # bin 入口，注册所有命令
│   ├── router.ts          # 命令路由与分发
│   ├── parse-utils.ts     # 参数解析工具
│   └── commands/          # 26 个命令实现
│       ├── init.ts        # 项目初始化
│       ├── stage.ts       # 阶段推进
│       ├── gate.ts        # Gate 校验
│       ├── feature.ts     # Feature 管理
│       ├── matrix.ts      # 追溯矩阵
│       ├── metrics.ts     # 指标计算
│       ├── id.ts          # ID 生成/搜索
│       ├── defect.ts      # 缺陷管理
│       ├── rfc.ts         # 变更请求
│       ├── ai.ts          # AI 编排
│       ├── hooks.ts       # Git Hook
│       ├── doctor.ts      # 环境诊断
│       ├── first.ts       # FIRST Skill 入口
│       ├── onboarding.ts  # 新手引导
│       ├── skill.ts       # Skill 分发
│       └── ... (其他 11 个命令)
│
├── core/                   # 核心引擎（15 个模块）
│   ├── process-engine/     # M1: 阶段状态机（8阶段 + 2终态）
│   ├── trace-engine/       # M2: ID 注册/校验/搜索、矩阵管理
│   ├── gate-engine/        # M3: Gate 条件评估、SCA 校验
│   ├── change-mgr/         # M4: RFC 状态机、缺陷管理
│   ├── ai-orchestrator/    # M5: Context Pack、Catchup、Auto-loop
│   ├── metrics-engine/     # M6: 12 指标计算、健康分
│   ├── tool-integration/   # M7: Git Hook、CI 模板
│   ├── skill-runtime/      # Skill 分发、prompt 组装、三层路由
│   ├── task-plan/          # task_plan.md 解析与状态管理
│   ├── template/           # Handlebars 模板渲染
│   ├── validators/         # 产物格式校验
│   ├── batch-executor/     # 批量任务执行
│   ├── migrations/         # 状态文件版本迁移
│   ├── host-adapters/      # 宿主适配器（Claude/Codex/Cursor）
│   └── rules/              # 真理源规则定义
│
├── shared/                 # 共享类型和工具
│   ├── types.ts            # Stage enum、ExitCode、ID types
│   ├── config-schema.ts    # 配置 Schema 定义
│   ├── host-bootstrap.ts   # 宿主环境引导
│   ├── host-paths.ts       # 宿主路径解析
│   ├── skill-commands.ts   # Skill 命令映射
│   ├── logger.ts           # 日志工具
│   ├── fs-utils.ts         # 文件系统工具
│   ├── validators.ts       # 通用校验器
│   └── ... (其他工具)
│
├── config/                 # 配置相关
│   └── index.ts           # 配置加载与合并
│
├── postinstall.ts          # npm postinstall 钩子
└── preuninstall.ts         # npm preuninstall 钩子
```

## 核心模块职责

| 模块 | 职责 | 关键文件 |
|------|------|----------|
| **process-engine** | 阶段状态机驱动 Feature 生命周期、ID 生成、目录初始化 | `stage-machine.ts`, `feature-lifecycle.ts` |
| **trace-engine** | 追溯 ID 生成/校验/搜索、覆盖率矩阵（C3/C4/C6/C8/C9） | `id-registry.ts`, `coverage-matrix.ts` |
| **gate-engine** | 阶段质量门禁评估（19条：16 blocking + 3 warning）、豁免管理 | `gate-evaluator.ts`, `exemption-manager.ts` |
| **change-mgr** | RFC + Defect 状态机、影响分析 | `rfc-state-machine.ts`, `defect-manager.ts` |
| **ai-orchestrator** | Auto-loop、Catchup 上下文恢复、Context Pack 组装 | `auto-loop.ts`, `catchup.ts`, `context-pack.ts` |
| **metrics-engine** | 健康度评分（H1）、瓶颈检测（R1-R5）、12 项指标 | `health-score.ts`, `bottleneck-detector.ts` |
| **skill-runtime** | Skill 三层路由、prompt 组装、hard-gate 校验 | `skill-resolver.ts`, `prompt-assembler.ts` |
| **tool-integration** | Git Hook、CI 模板、AI runtime hooks | `git-hooks.ts`, `ci-templates.ts` |
| **task-plan** | task_plan.md 解析、Todo 状态管理 | `task-plan-parser.ts` |
| **template** | Handlebars 模板渲染、产物生成 | `template-engine.ts` |
| **validators** | 产物格式校验（ID 格式、必需章节、追踪矩阵一致性） | `artifact-validator.ts` |
| **batch-executor** | 批量任务执行、并行编排支持 | `batch-runner.ts` |
| **migrations** | 状态文件版本迁移、升级兼容处理 | `migrator.ts` |
| **host-adapters** | 宿主适配器（Claude/Codex/Cursor） | `claude-adapter.ts` |
| **rules** | 真理源（RELEASE_REQUIRED_ARTIFACTS 等） | `truth-source.ts` |

## 开发入口命令

```bash
# 构建与类型检查
npm run build              # tsup 打包
npm run typecheck          # tsc --noEmit 类型检查

# 测试
npm test                   # vitest run（全量）
npm run test:watch         # vitest watch 模式
npx vitest run tests/unit/<file>.test.ts   # 单文件
npx vitest run -t "pattern"               # 按名称匹配

# 代码质量
npm run lint               # eslint src
npm run lint:fix           # eslint --fix
npm run format             # prettier 格式化

# 本地开发
npm link                  # 全局链接，本地测试 CLI
spec-first --help         # 查看帮助
```

## 核心领域概念

### Stage 枚举（单向不可逆）

```
00_init → 01_specify → 02_design → 03_plan → 04_implement → 05_verify → 06_wrap_up → 07_release → 08_done / 09_cancelled
```

### 追溯 ID（14 类）

| 分类 | ID 类型 | 说明 |
|------|---------|------|
| 业务链路 | FR | 功能需求 |
| | DS | 设计规格 |
| | TASK | 任务项 |
| | TC | 测试用例 |
| | RFC | 变更请求 |
| V-Model | REQ | 需求规格 |
| | SYS | 系统设计 |
| | ARCH | 架构设计 |
| | MOD | 模块设计 |
| | ATP | 验收测试计划 |
| | STP | 系统测试计划 |
| | ITP | 集成测试计划 |
| | UTP | 单元测试计划 |
| 顶层 | Feature | 功能特性 |

### 覆盖率（5 项）

| 指标 | 含义 | 计算方式 |
|------|------|----------|
| C3 | TASK 覆 FR | 传递链覆盖 |
| C4 | TC 覆 FR | 直接覆盖（不支持传递） |
| C6 | TASK 已实现 | 完成状态统计 |
| C8 | TASK 有上游 | 关联 FR 数量 |
| C9 | TC 有上游 FR | 关联 FR 数量 |

### Skill 三层路由

```
用户输入 → Semantic Map（复合命令映射，如 "rfc approve" → CLI+参数）
         → Runtime Route（RUNTIME_COMMANDS 集合，直接分发 CLI）
         → Skill File（resolveSkillPath() 搜索 skills/spec-first/NN-name/SKILL.md）
```

Skill 调用格式：`/spec-first:<skill-name>`

## 关键约定

- **ESM only** - 全项目 `"type": "module"`，使用 `import/export`
- **Named exports only** - core 模块禁止使用 default export
- **文件命名**: `kebab-case.ts`
- **类型集中**: `src/shared/types.ts`（Stage enum、ExitCode、ID types）
- **未使用变量**: `_` 前缀（eslint 规则 `^_`）
