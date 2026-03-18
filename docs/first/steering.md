# 项目导向与边界

> 标准模式：deep
> 文档层级：docs/first 投影视图
> 真源依赖：.spec-first/runtime/first/steering.json

## 项目导向
- 概述: AI-workflow CLI for spec-driven development — quality gates, traceability, and feature lifecycle management for AI-era teams

### 核心场景
- AI-workflow CLI for spec-driven development — quality gates, traceability, and feature lifecycle management for AI-era teams

### 非目标
- unregistered docs as canonical truth

### 术语表
- Feature
- StageState

## 技术约束
- runtime: Node.js >=20.0.0
- language: TypeScript
- package-manager: pnpm
- testing: Vitest
- build: tsup
- 项目端类型待确认

## 结构边界
- src/cli
- src/config
- src/core
- src/postinstall.ts
- src/preuninstall.ts
- src/shared
- dist/cli/index.js
- src/cli/index.ts
- read runtime truth first

## 权威顺序
- .spec-first/runtime/first/*.json -> docs/first/*.md
- runtime truth 优先于 docs projection
- 未注册 docs 不参与 canonical truth