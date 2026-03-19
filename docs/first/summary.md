# 项目概览

## 基本信息

| 字段 | 值 |
|------|-----|
| 名称 | spec-first |
| 版本 | 1.1.4 |
| 类型 | CLI 工具 |
| 描述 | AI-workflow CLI for spec-driven development |

## 技术栈

| 类别 | 技术 |
|------|------|
| Runtime | Node.js ≥20 |
| Language | TypeScript 5.4+ |
| Module System | ESM |
| Build Tool | tsup |
| Test Framework | Vitest |
| Template Engine | Handlebars |
| Lint | ESLint + typescript-eslint |
| Format | Prettier |

## 项目结构

```
spec-first/
├── src/
│   ├── cli/           # CLI 命令（27 个）
│   ├── core/          # 核心引擎（14 个模块）
│   └── shared/        # 共享类型与工具
├── skills/            # Skill 定义（22 个）
├── templates/         # Handlebars 模板
├── tests/             # 测试目录
├── specs/             # Feature 产物
└── .spec-first/       # 项目配置
```

## 核心模块

| 模块 | 职责 |
|------|------|
| process-engine | Stage 状态机，驱动 Feature 生命周期 |
| skill-runtime | Skill 分发、Prompt 组装、Hard-Gate |
| ai-orchestrator | Auto-loop、Catchup 上下文恢复 |
| gate-engine | 19 条质量门禁规则评估 |
| trace-engine | 追溯 ID 生成/校验、覆盖率矩阵 |
| change-mgr | RFC + Defect 状态机 |
| template | Handlebars 模板渲染 |
| tool-integration | AI runtime hooks |
| metrics-engine | 健康度评分 |
| validators | 产物格式校验 |
| task-plan | task_plan.md 解析 |
| rules | 静态规则定义 |
| batch-executor | 批量任务执行 |
| migrations | 状态文件迁移 |

## 依赖

### 运行时依赖

- handlebars@^4.7.8 — 模板渲染
- js-yaml@^4.1.0 — YAML 解析
- semver@^7.7.4 — 版本管理
- update-notifier@^7.0.0 — 更新检查

### 开发依赖

- typescript@^5.4.0
- tsup@^8.5.1
- vitest@^1.6.1
- eslint@^10.0.2
- prettier@^3.8.1

## 证据来源

- 项目配置 (`package.json:1-98`) — 显式
- TypeScript 配置 (`tsconfig.json:1-22`) — 显式
- 测试配置 (`vitest.config.ts:1-19`) — 显式
- 目录结构分析 — 显式
