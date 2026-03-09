# spec-first 外部依赖与第三方服务

> **版本**: v1.0 | **更新时间**: 2026-03-09 | **提取模式**: deep | **提取自代码**

---

## 一、生产依赖（Production Dependencies）

### 1.1 handlebars (^4.7.8)

**用途**: 模板渲染引擎

**使用场景**:
- 渲染 Skill 模板（SKILL.md）
- 生成项目初始化文件（stage-state.json、需求文档等）
- 支持三级模板查找：local → meta → 包内默认

**证据源**:
```typescript
// src/core/template/renderer.ts:13
import Handlebars from 'handlebars';

// 编译和渲染模板
const compiled = Handlebars.compile(source);
const rendered = compiled(context);
```

**依赖类型**: 必需（核心功能）

---

### 1.2 js-yaml (^4.1.0)

**用途**: YAML 解析与序列化

**使用场景**:
- 解析 Skill front matter 元数据（write_mode、required_mcps、completion_markers）
- 解析配置文件（config.yaml）
- 解析 PRD 验证规则
- 解析阶段扩展配置

**证据源**:
```typescript
// src/core/skill-runtime/front-matter.ts:7
import yaml from 'js-yaml';

// 解析 YAML front matter
const parsed = yaml.load(raw, { schema: yaml.JSON_SCHEMA });
```

**使用文件**（9 处）:
- `src/shared/config-schema.ts`
- `src/core/process-engine/layer-merger.ts`
- `src/core/gate-engine/prd-validator.ts`
- `src/core/skill-runtime/front-matter.ts`
- `src/core/ai-orchestrator/slop-checker.ts`
- `src/core/ai-orchestrator/completion-detector.ts`
- `src/core/migrations/manifest-engine.ts`
- `src/core/migrations/manifest-loader.ts`
- `src/core/process-engine/extensions.ts`

**依赖类型**: 必需（核心功能）

---

### 1.3 semver (^7.7.4)

**用途**: 语义化版本比较与匹配

**使用场景**:
- 版本区间解析（">=1.2.3"、"1.2.3..2.0.0"）
- 迁移清单版本匹配
- 版本升级检测

**证据源**:
```typescript
// src/core/migrations/version-matcher.ts:5
import semver from 'semver';

// 版本比较
export function compareVersions(v1: string, v2: string): number {
  const clean1 = semver.valid(semver.coerce(v1));
  const clean2 = semver.valid(semver.coerce(v2));
  if (!clean1 || !clean2) return 0;
  return semver.compare(clean1, clean2);
}
```

**依赖类型**: 必需（迁移系统）

---

### 1.4 update-notifier (^7.0.0)

**用途**: CLI 版本更新通知

**使用场景**:
- 检查 npm 包更新（每 24 小时一次）
- 后台异步检查，不阻塞主流程
- 失败时静默降级

**证据源**:
```typescript
// src/cli/commands/update.ts:305-312
async function checkForUpdates(): Promise<void> {
  try {
    const mod = await import('update-notifier' as string);
    const pkg = { name: 'spec-first', version: getCliVersion() };
    mod.default({ pkg, updateCheckInterval: 1000 * 60 * 60 * 24 }).notify();
  } catch {
    // update-notifier 不可用，静默跳过
  }
}
```

**依赖类型**: 可选（用户体验增强）

---

## 二、开发依赖（Development Dependencies）

### 2.1 构建工具

| 依赖 | 版本 | 用途 |
|------|------|------|
| typescript | ^5.4.0 | TypeScript 编译器（strict mode + verbatimModuleSyntax） |
| tsup | ^8.5.1 | 基于 esbuild 的打包工具，生成 ESM 产物 |
| @types/node | ^20.11.0 | Node.js 类型定义 |
| @types/js-yaml | ^4.0.9 | js-yaml 类型定义 |
| @types/semver | ^7.7.1 | semver 类型定义 |

### 2.2 测试工具

| 依赖 | 版本 | 用途 |
|------|------|------|
| vitest | ^1.6.1 | 测试框架（globals enabled） |
| @vitest/coverage-v8 | ^1.6.1 | 代码覆盖率工具（75% 阈值） |

### 2.3 代码质量

| 依赖 | 版本 | 用途 |
|------|------|------|
| eslint | ^10.0.2 | 代码检查工具 |
| @eslint/js | ^10.0.1 | ESLint 核心规则 |
| typescript-eslint | ^8.56.1 | TypeScript ESLint 插件 |
| prettier | ^3.8.1 | 代码格式化工具 |

---

## 三、外部服务依赖

### 3.1 npm Registry

**用途**: 包发布与版本更新检查

**依赖场景**:
- `update-notifier` 检查新版本（registry.npmjs.org）
- 用户安装/更新包

**降级策略**: 网络不可用时静默跳过更新检查

---

### 3.2 AI Runtime（宿主环境）

**用途**: Skill 执行环境

**支持宿主**:
- Claude Code（claude.ai/code）
- Codex（GitHub Copilot）
- Generic（通用 AI 工具）

**集成方式**:
- Skill 命令注册（~/.spec-first/skills/）
- MCP 配置同步（.claude/settings.json、.codex/mcp.json）
- Git/AI/Session Hooks

**证据源**:
```typescript
// src/cli/commands/update.ts:107-110
const hostPaths = detectHostPaths();
const skills = ensureSkillCommands(cwd, { global: true, dryRun, hosts });
log(`Skill: ${skills.claude.length} claude, ${skills.codex.length} codex`);
```

---

## 四、无外部中间件依赖

经代码扫描确认，本项目**不依赖**以下常见外部服务：

- ❌ 数据库（MySQL/PostgreSQL/MongoDB）
- ❌ 缓存（Redis/Memcached）
- ❌ 消息队列（RabbitMQ/Kafka/RocketMQ）
- ❌ 对象存储（OSS/S3/MinIO）
- ❌ 搜索引擎（Elasticsearch/Solr）
- ❌ 注册中心（Nacos/Consul/Eureka）
- ❌ 监控服务（Prometheus/Grafana/Sentry）

**原因**: spec-first 是纯本地 CLI 工具，所有数据存储在项目文件系统中（`.spec-first/`、`specs/`）。

---

## 五、依赖安全性

### 5.1 pnpm 覆盖（Security Overrides）

```json
// package.json:73-78
"pnpm": {
  "overrides": {
    "rollup": "^4.59.0",      // 修复 CVE-2024-XXXX
    "minimatch": "^3.1.3",    // 修复 ReDoS 漏洞
    "esbuild": "^0.27.3"      // 修复构建安全问题
  }
}
```

### 5.2 依赖审计建议

- 定期运行 `npm audit` 检查已知漏洞
- 使用 `pnpm overrides` 强制升级有漏洞的传递依赖
- 关注 `handlebars` 模板注入风险（当前版本 4.7.8 已修复 CVE-2021-23383）

---

## 六、依赖图谱

```
spec-first (CLI)
├── handlebars (模板渲染)
├── js-yaml (配置解析)
├── semver (版本管理)
├── update-notifier (更新通知) [可选]
└── 宿主环境
    ├── Claude Code (Skill 执行)
    ├── Codex (Skill 执行)
    └── npm Registry (版本检查)
```

---

## 七、降级策略矩阵

| 依赖 | 失败场景 | 降级方案 |
|------|----------|----------|
| handlebars | 模板编译失败 | 抛出错误，终止初始化 |
| js-yaml | YAML 解析失败 | 返回空对象 `{}`，使用默认值 |
| semver | 版本比较失败 | 返回 0（相等），跳过版本检查 |
| update-notifier | 网络不可用 | 静默跳过，不影响主流程 |
| npm Registry | 无法访问 | 跳过更新检查，使用本地版本 |

---

**文档生成**: Agent C1 | **最后更新**: 2026-03-09T04:47:28Z
