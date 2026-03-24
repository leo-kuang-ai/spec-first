# Spec-First 项目摘要

> 基于 `.spec-first/runtime/first/summary.json` 生成

## 项目状态

- **健康状态**: healthy
- **项目类型**: node-cli-typescript
- **项目名称**: spec-first
- **版本**: 1.2.3

## 项目描述

Spec-First 全链路研发闭环引擎——阶段状态机驱动 Feature 从需求到上线

## 技术栈

| 属性 | 值 |
|------|-----|
| 运行时 | Node.js >= 20.0.0 |
| 模块系统 | ESM |
| 打包工具 | tsup |
| 测试框架 | Vitest |
| 入口点 | `dist/cli/index.js` |
| 源码入口 | `src/cli/index.ts` |

## 核心模块 (14 个)

```
src/core/
├── process-engine/      # 阶段状态机
├── skill-runtime/       # Skill 分发
├── ai-orchestrator/     # AI 调度
├── gate-engine/         # 质量门禁
├── trace-engine/        # 追溯 ID
├── change-mgr/          # 变更管理
├── template/            # 模板渲染
├── tool-integration/    # 工具集成
├── metrics-engine/      # 指标引擎
├── validators/          # 校验器
├── task-plan/           # 任务计划
├── rules/               # 规则定义
├── batch-executor/      # 批量执行
└── migrations/          # 版本迁移
```

## CLI 命令 (27 个)

| 类别 | 命令 |
|------|------|
| 核心 | `init`, `stage`, `gate`, `feature`, `status` |
| 文档 | `docs-links`, `viewer` |
| 追溯 | `trace`, `id`, `defect`, `rfc` |
| AI | `skill`, `ai`, `orchestrate`, `first` |
| 指标 | `metrics`, `analyze`, `doctor` |
| 维护 | `update`, `commit`, `hooks`, `setup`, `uninstall`, `validate`, `done`, `onboarding`, `batch-test` |

## 证据路径

```
CLAUDE.md           # 开发规范
package.json        # 项目配置
src/cli/index.ts    # CLI 入口
src/core/           # 核心模块
```

## 差距

当前无检测到的差距。
