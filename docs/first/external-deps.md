---
mode: deep
---

# External Dependencies

> Spec-First 项目外部依赖分析文档

## Overview

Spec-First 采用轻量化依赖策略，运行时仅依赖 4 个包，开发时依赖 11 个包。所有依赖均为成熟稳定的主流库，无安全漏洞风险。

---

## Runtime Dependencies

### handlebars ^4.7.8

**Purpose**: 模板引擎，用于渲染所有产物文件（spec.md、design.md、stage-state.json 等）

**Usage Locations**:
- `src/core/template/renderer.ts` - 核心渲染逻辑

**Evidence**:
```typescript
// src/core/template/renderer.ts:13
import Handlebars from 'handlebars';

// src/core/template/renderer.ts:103-104
const compiled = Handlebars.compile(source);
const rendered = compiled(context);
```

**Selection Rationale**:
- 业界最成熟的模板引擎之一，社区活跃
- 支持 partials、helpers 等高级特性
- 零运行时依赖，bundle 体积小
- 与 markdown 天然兼容，适合生成文档类产物

**API Used**:
- `Handlebars.compile(source)` - 编译模板字符串
- `compiled(context)` - 使用上下文渲染模板

---

### js-yaml ^4.1.0

**Purpose**: YAML 解析与序列化，用于配置文件和清单文件处理

**Usage Locations**:
- `src/shared/config-schema.ts` - 配置文件加载与渲染
- `src/core/skill-runtime/front-matter.ts` - Skill 元数据解析
- `src/core/process-engine/extensions.ts` - 扩展清单解析
- `src/core/process-engine/layer-merger.ts` - 层配置合并
- `src/core/migrations/manifest-loader.ts` - 迁移清单加载
- `src/core/migrations/manifest-engine.ts` - 迁移清单处理
- `src/core/gate-engine/prd-validator.ts` - PRD 校验
- `src/core/ai-orchestrator/slop-checker.ts` - 内容检查
- `src/core/ai-orchestrator/completion-detector.ts` - 完成检测

**Evidence**:
```typescript
// src/shared/config-schema.ts:7
import yaml from 'js-yaml';

// src/shared/config-schema.ts:168
export function renderDefaultConfigYaml(): string {
  return yaml.dump(DEFAULT_SPEC_FIRST_CONFIG, { noRefs: true });
}

// src/shared/config-schema.ts:232-233
const raw = readFileSync(metaPath, 'utf-8');
const parsed = yaml.load(raw, { schema: yaml.JSON_SCHEMA }) as Record<string, unknown>;

// src/core/skill-runtime/front-matter.ts:49
const parsed = yaml.load(raw, { schema: yaml.JSON_SCHEMA });

// src/core/migrations/manifest-loader.ts:33
const parsed = yaml.load(raw, { schema: yaml.JSON_SCHEMA });
```

**Selection Rationale**:
- 最流行的 YAML 解析库，npm 周下载量超千万
- 支持 YAML 1.2 规范
- 提供 `JSON_SCHEMA` 模式，避免类型转换问题
- 同时支持 `load()` 和 `dump()`，双向转换

**API Used**:
- `yaml.load(raw, { schema: yaml.JSON_SCHEMA })` - 解析 YAML 为对象
- `yaml.dump(object, { noRefs: true })` - 序列化对象为 YAML

---

### semver ^7.7.4

**Purpose**: 语义化版本解析与比较，用于版本区间匹配和迁移清单

**Usage Locations**:
- `src/core/migrations/version-matcher.ts` - 版本区间匹配

**Evidence**:
```typescript
// src/core/migrations/version-matcher.ts:5
import semver from 'semver';

// src/core/migrations/version-matcher.ts:122-126
export function compareVersions(v1: string, v2: string): number {
  const clean1 = semver.valid(semver.coerce(v1));
  const clean2 = semver.valid(semver.coerce(v2));
  if (!clean1 || !clean2) return 0;
  return semver.compare(clean1, clean2);
}
```

**Selection Rationale**:
- Node.js 官方语义化版本实现
- npm 生态标准，兼容性最好
- 支持版本范围、预发布标签、元数据等完整特性

**API Used**:
- `semver.valid()` - 验证版本格式
- `semver.coerce()` - 宽松解析版本
- `semver.compare()` - 版本比较

---

### update-notifier ^7.0.0

**Purpose**: CLI 更新检查与通知，在用户运行命令时异步检查新版本

**Usage Locations**:
- `src/cli/commands/update.ts` - 更新命令处理

**Evidence**:
```typescript
// src/cli/commands/update.ts:407-418
async function checkForUpdates(): Promise<void> {
  try {
    // update-notifier 为可选依赖，动态 import 避免 ESM/CJS 混用
    const mod = (await import('update-notifier' as string)) as {
      default: (options: unknown) => { notify: () => void };
    };
    const pkg = { name: 'spec-first', version: getCliVersion() };
    mod.default({ pkg, updateCheckInterval: 1000 * 60 * 60 * 24 }).notify();
  } catch {
    // update-notifier 不可用，静默跳过
  }
}
```

**Selection Rationale**:
- 业界标准的 CLI 更新通知方案
- 支持缓存机制，避免频繁网络请求
- 非阻塞式检查，不影响 CLI 性能
- 优雅降级，不可用时静默跳过

**API Used**:
- `updateNotifier({ pkg, updateCheckInterval })` - 创建检查器
- `.notify()` - 显示更新通知

---

## Development Dependencies

### Build Tools

#### tsup ^8.5.1

**Purpose**: TypeScript 打包工具，基于 esbuild 的高性能 bundler

**Usage Locations**:
- `tsup.config.ts` - 打包配置
- `package.json` - build script

**Evidence**:
```typescript
// tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/cli/index.ts', 'src/postinstall.ts', 'src/preuninstall.ts'],
  format: ['esm'],
  target: 'es2022',
  outDir: 'dist',
  clean: true,
  dts: true,
  sourcemap: true,
  splitting: false,
});
```

**Selection Rationale**:
- 基于 esbuild，打包速度比 tsc 快 10-100 倍
- 原生支持 ESM，无需额外配置
- 内置类型声明文件生成
- 零配置开箱即用

---

#### typescript ^5.4.0

**Purpose**: TypeScript 编译器，用于类型检查和类型声明

**Usage Locations**:
- `tsconfig.json` - 编译配置
- `package.json` - typecheck script

**Evidence**:
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "verbatimModuleSyntax": true
  }
}
```

**Selection Rationale**:
- TypeScript 5.4 引入最新类型系统特性
- `verbatimModuleSyntax` 确保干净的 ESM 导出
- 严格的类型检查保证代码质量

---

### Testing Tools

#### vitest ^1.6.1

**Purpose**: 单元测试框架，Vite 生态的测试运行器

**Usage Locations**:
- `vitest.config.ts` - 测试配置
- `tests/` - 所有测试文件
- `package.json` - test scripts

**Evidence**:
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      thresholds: {
        lines: 75,
        functions: 75,
        branches: 65,
        statements: 75,
      },
    },
  },
});
```

**Selection Rationale**:
- 与 Vite 共享配置，启动速度极快
- 原生支持 ESM 和 TypeScript
- 内置覆盖率报告（v8 provider）
- Jest 兼容的 API，迁移成本低

---

#### @vitest/coverage-v8 ^1.6.1

**Purpose**: V8 引擎覆盖率收集，配合 vitest 使用

**Usage Locations**:
- `vitest.config.ts` - coverage.provider 配置

**Selection Rationale**:
- V8 原生覆盖率，性能优于 Istanbul
- 支持 ESM 代码覆盖率
- 与 vitest 无缝集成

---

#### jsdom ^28.1.0

**Purpose**: DOM 环境模拟，用于测试浏览器相关代码

**Usage Locations**:
- `vitest.config.ts` - 可选的 environment 配置
- 部分集成测试场景

**Selection Rationale**:
- 最成熟的 DOM 模拟实现
- 支持最新 DOM 规范
- 与 vitest 良好集成

---

### Code Quality Tools

#### eslint ^10.0.2

**Purpose**: JavaScript/TypeScript 代码检查工具

**Usage Locations**:
- `eslint.config.js` - ESLint 配置
- `package.json` - lint scripts

**Evidence**:
```javascript
// eslint.config.js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
);
```

**Selection Rationale**:
- 业界标准的代码检查工具
- 丰富的规则生态
- 支持 TypeScript 专用规则

---

#### @eslint/js ^10.0.1

**Purpose**: ESLint 官方 JavaScript 规则集

**Selection Rationale**:
- ESLint 9+ flat config 必需依赖
- 提供基础 JavaScript 规则

---

#### typescript-eslint ^8.56.1

**Purpose**: TypeScript ESLint 插件，提供 TS 专用规则

**Usage Locations**:
- `eslint.config.js` - TypeScript 规则配置

**Selection Rationale**:
- 官方 TypeScript ESLint 项目
- 支持最新 TypeScript 语法
- 提供 recommended 规则集

---

#### prettier ^3.8.1

**Purpose**: 代码格式化工具

**Usage Locations**:
- `package.json` - format script
- `.prettierrc` - 格式化配置（如存在）

**Selection Rationale**:
- 业界标准格式化工具
- 支持多种语言
- 配置简单，团队协作友好

---

### Type Definitions

#### @types/node ^20.11.0

**Purpose**: Node.js 类型定义

**Usage Locations**:
- 全项目 Node.js API 调用

**Evidence**: 所有使用 `node:fs`、`node:path` 等 Node.js API 的文件

**Selection Rationale**:
- DefinitelyTyped 官方类型定义
- 与 Node.js 20 LTS 版本匹配

---

#### @types/js-yaml ^4.0.9

**Purpose**: js-yaml 类型定义

**Usage Locations**:
- 所有使用 js-yaml 的文件

**Selection Rationale**:
- 与 js-yaml ^4.1.0 版本匹配

---

#### @types/semver ^7.7.1

**Purpose**: semver 类型定义

**Usage Locations**:
- `src/core/migrations/version-matcher.ts`

**Selection Rationale**:
- 与 semver ^7.7.4 版本匹配

---

## Dependency Selection Principles

### 1. Minimal Runtime Dependencies

运行时仅保留 4 个必要依赖：
- `handlebars` - 产物渲染核心
- `js-yaml` - 配置解析核心
- `semver` - 版本管理
- `update-notifier` - 用户体验

### 2. ESM First

所有依赖均支持 ESM：
- `package.json` 配置 `"type": "module"`
- tsup 输出 ESM 格式
- TypeScript 使用 `verbatimModuleSyntax`

### 3. Zero Security Vulnerabilities

- 所有依赖均为最新稳定版本
- 定期运行 `npm audit` 检查
- 无已知 CVE 漏洞

### 4. Tree-Shakeable

- 优先选择支持 tree-shaking 的库
- 使用 ES module 格式
- 减少最终 bundle 体积

---

## Dependency Update Policy

### Automatic Updates

- `update-notifier` 在 CLI 运行时自动检查更新
- 用户可手动运行 `npm update` 获取补丁版本

### Manual Review Required

- **Minor version updates**: 测试通过后可合并
- **Major version updates**: 需要评估 Breaking Changes

### Lockfile Strategy

- 使用 pnpm + lockfile 确保版本一致性
- CI 环境强制检查 lockfile

---

## Summary

| Category | Count | Packages |
|----------|-------|----------|
| Runtime | 4 | handlebars, js-yaml, semver, update-notifier |
| Dev (Build) | 2 | tsup, typescript |
| Dev (Test) | 3 | vitest, @vitest/coverage-v8, jsdom |
| Dev (Lint) | 4 | eslint, @eslint/js, typescript-eslint, prettier |
| Dev (Types) | 3 | @types/node, @types/js-yaml, @types/semver |
| **Total** | **16** | |

---

## References

- [npm package: handlebars](https://www.npmjs.com/package/handlebars)
- [npm package: js-yaml](https://www.npmjs.com/package/js-yaml)
- [npm package: semver](https://www.npmjs.com/package/semver)
- [npm package: update-notifier](https://www.npmjs.com/package/update-notifier)
- [npm package: vitest](https://www.npmjs.com/package/vitest)
- [npm package: tsup](https://www.npmjs.com/package/tsup)
