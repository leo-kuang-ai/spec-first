# 项目规范

> 标准模式：deep
> 文档层级：docs/first 投影视图
> 真源依赖：.spec-first/runtime/first/conventions.json

## API 规范

### 观察到的模式
- CLI: spec-first

### 偏差
- 无

- 推荐规则: Expose command surfaces through stable spec-first CLI verbs.

### 证据
- CLI: spec-first
- dist/cli/index.js
- src/cli/index.ts
- package.json
- tsconfig.json

## 代码规范

### 观察到的模式
- src/cli
- src/config
- src/core
- src/postinstall.ts
- src/preuninstall.ts
- src/shared

### 偏差
- 无

- 推荐规则: Keep runtime logic under src/core and entry orchestration near src/cli.

### 证据
- src/cli
- src/config
- src/core
- src/postinstall.ts
- src/preuninstall.ts

## 测试规范

### 观察到的模式
- testing: Vitest

### 偏差
- 无

- 推荐规则: Use Vitest-style automated regression coverage and keep test evidence alongside runtime changes.

### 证据
- runtime: Node.js >=20.0.0
- language: TypeScript
- package-manager: pnpm
- testing: Vitest
- build: tsup

## 交付规范

### 观察到的模式
- runtime truth first
- 项目端类型待确认

### 偏差
- 无

- 推荐规则: Treat .spec-first/runtime/first as canonical truth before projecting docs/first views.

### 证据
- package.json
- tsconfig.json
- vitest.config.ts
- dist/cli/index.js
- src/cli/index.ts