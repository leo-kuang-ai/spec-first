---
mode: deep
generated_at: 2026-03-09T20:06:12.462Z
---

# 外部依赖

## 生产依赖

### handlebars (^4.7.8)
- **用途**: 模板渲染引擎
- **使用场景**: 产物生成、文档模板
- **关键模块**: `src/core/template/`

### js-yaml (^4.1.0)
- **用途**: YAML 配置解析
- **使用场景**: 配置文件读写、Frontmatter 解析
- **关键模块**: `src/config/`

### semver (^7.7.4)
- **用途**: 语义化版本管理
- **使用场景**: 版本比较、兼容性检查
- **关键模块**: 全局使用

### update-notifier (^7.0.0)
- **用途**: 更新通知
- **使用场景**: CLI 启动时检查新版本
- **关键模块**: `src/cli/`

## 开发依赖

### TypeScript 生态
- `typescript` (^5.4.0) - 编译器
- `@types/node` (^20.11.0) - Node.js 类型定义
- `@types/js-yaml` (^4.0.9) - js-yaml 类型定义
- `@types/semver` (^7.7.1) - semver 类型定义

### 构建工具
- `tsup` (^8.5.1) - 打包工具

### 测试工具
- `vitest` (^1.6.1) - 测试框架
- `@vitest/coverage-v8` (^1.6.1) - 覆盖率工具

### 代码质量
- `eslint` (^10.0.2) - 代码检查
- `typescript-eslint` (^8.56.1) - TypeScript ESLint 插件
- `prettier` (^3.8.1) - 代码格式化

## 依赖风险评估

- ✅ 所有依赖均为成熟稳定的社区标准库
- ✅ 无已知安全漏洞
- ✅ 版本锁定策略：使用 `^` 允许小版本更新
