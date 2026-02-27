# Review Scope

## Target

**Spec-First CLI Tool** - 全链路研发闭环工具，基于 Spec-First 理念设计的开发工作流框架。

## Project Overview

- **Type**: Node.js CLI 工具 (ES Module)
- **Language**: TypeScript (strict mode)
- **Framework**: Vitest (测试), tsup (构建)
- **Purpose**: 规范驱动的开发流程管理 - 从需求到上线的完整闭环

## Files

### Source Code (74 TypeScript files)
- `src/cli/` - CLI 命令入口 (15 files)
- `src/core/ai-orchestrator/` - AI 编排器 (5 files)
- `src/core/change-mgr/` - 变更管理 (6 files)
- `src/core/gate-engine/` - Gate 校验引擎 (6 files)
- `src/core/metrics-engine/` - 指标引擎 (2 files)
- `src/core/process-engine/` - 流程引擎 (6 files)
- `src/core/skill-runtime/` - Skill 运行时 (5 files)
- `src/core/template/` - 模板引擎 (2 files)
- `src/core/tool-integration/` - 工具集成 (8 files)
- `src/core/trace-engine/` - 追踪引擎 (6 files)
- `src/shared/` - 共享工具 (6 files)
- `src/postinstall.ts`, `src/preuninstall.ts` - 生命周期脚本

### Test Files (61 TypeScript files)
- `tests/unit/` - 单元测试

### Configuration
- `package.json` - 依赖管理
- `tsconfig.json` - TypeScript 配置
- `vitest.config.ts` - 测试配置
- `eslint.config.js` - 代码检查
- `.spec-first/` - 项目配置与 hooks

## Flags

- **Security Focus**: no
- **Performance Critical**: no
- **Strict Mode**: no
- **Framework**: TypeScript/Node.js ESM

## Review Phases

1. Code Quality & Architecture
2. Security & Performance
3. Testing & Documentation
4. Best Practices & Standards
5. Consolidated Report

## Test Coverage (Current)

- **Test Files**: 61
- **Test Cases**: 616
- **Pass Rate**: 99.8%
- **Coverage Threshold**: 60%
