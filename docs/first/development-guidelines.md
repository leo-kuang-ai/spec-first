# 开发指南

> 本文档基于 `.spec-first/runtime/first/` 下的真源资产生成，所有结论附带证据路径。

---

## 环境准备

### 系统要求

| 要求 | 版本 |
|------|------|
| Runtime | Node.js >=20.0.0 |
| 包管理器 | pnpm (推荐) 或 npm |
| Language | TypeScript >=5.4 |

**证据**: `package.json:31-33 (engines requirement)`

### 初始化

```bash
# 安装依赖（开发模式）
pnpm install && pnpm link --global

# 生产安装
npm install -g spec-first

# 构建项目
npm run build

# 类型检查
npm run typecheck
```

**证据**: `package.json:9-29 (npm scripts)`

---

## 常用命令

### 构建与类型检查

| 任务 | 命令 | 说明 |
|------|------|------|
| 构建项目 | `npm run build` | tsup 打包，输出到 dist/ |
| 类型检查 | `npm run typecheck` | tsc --noEmit 不生成文件 |

### 测试

| 任务 | 命令 | 说明 |
|------|------|------|
| 全量测试 | `npm test` | vitest run 执行所有测试 |
| Watch 模式 | `npm run test:watch` | vitest watch 模式 |
| 单文件测试 | `npx vitest run tests/unit/<file>.test.ts` | 运行指定测试文件 |
| 按名称匹配 | `npx vitest run -t "pattern"` | 按测试名称匹配 |
| 覆盖率报告 | `npm run test:coverage` | 生成 v8 覆盖率报告 |

**证据**: `vitest.config.ts:1-19 (test configuration)`

### 代码质量

| 任务 | 命令 | 说明 |
|------|------|------|
| Lint 检查 | `npm run lint` | eslint 检查 src/ |
| Lint 修复 | `npm run lint:fix` | eslint --fix |
| 格式化 | `npm run format` | prettier 格式化 src/**/*.ts |

---

## Spec-First CLI 命令

### Feature 管理

```bash
spec-first feature current                          # 查看当前 featureId
spec-first feature switch <featureId>               # 切换 Feature
```

### 节点与推进

```bash
spec-first status <featureId>                       # 查看节点状态与任务进度
spec-first transition <featureId>                   # 推进节点 / 取消 Feature
spec-first validate format <featureId>              # 校验产物格式
spec-first validate links <featureId>               # 校验文档关联
spec-first done <featureId>                         # 收口到 08_done
```

### 文档与追溯

```bash
spec-first validate links --feature <featureId>     # 校验文档关联
spec-first status <featureId>                       # 查看节点与任务概览
spec-first transition <featureId>                   # 推进或取消节点
```

### 变更与缺陷

```bash
spec-first defect create --feature <featureId>      # 创建缺陷记录
spec-first rfc create --feature <featureId>         # 创建变更请求
```

**证据**: `CLAUDE.md:115-132 (common commands)`

---

## 开发流程

### 代码变更自检清单

每次 `src/` 下 `.ts` 文件变更后必须执行：

```
[ ] 1. npm run typecheck - 类型检查通过
[ ] 2. npm test - 测试通过
[ ] 3. CHANGELOG.md - 已更新
[ ] 4. 变更范围 - 已确认仅限必要文件
```

### 提交前检查

1. 确保所有测试通过
2. 确保 lint 无错误
3. 更新 CHANGELOG.md（版本号从 package.json 读取）
4. CLAUDE.md 纳入提交范围

### 核心模块变更注意事项

修改以下文件时需要特别谨慎：

| 文件 | 风险 | 说明 |
|------|------|------|
| `src/shared/types.ts` | 高 | Stage/ID 体系，影响全局 |
| `src/core/rules/truth-source.ts` | 高 | Gate 真理源 |
| 任何 `index.ts` 重导出变更 | 中 | 影响公开 API |
| `src/core/` 核心逻辑 | 中 | 影响业务逻辑 |

---

## 禁止操作

以下文件/目录**只能通过 CLI 操作**，禁止手动编辑：

| 文件 | 风险等级 | 正确操作 |
|------|---------|---------|
| `stage-state.json` | 高 | `spec-first stage advance` |
| `document-links.yaml` | 中 | `spec-first validate links` |
| `specs/*/todo-state.json` | 中 | 对应 CLI 子命令 |
| `specs/*/reports/*` | 中 | 对应 CLI 子命令 |

### 违规后果

手动修改状态文件会导致：
- Gate 校验失准
- 覆盖率数据污染
- 审计日志断裂

### CLI 不可用时的降级策略

| 操作 | 降级策略 |
|------|---------|
| `stage advance` | **永不降级**，告知用户 CLI 不可用 |
| `validate links` | 可临时跳过，完成后提醒用户补校验 |
| 其他状态文件 | 仅读取不写入，告知用户需补 CLI 命令 |

**证据**: `CLAUDE.md:10-25 (禁止操作)`

---

## 架构约束

### 模块依赖图

```
+-------------------------------------------------------------+
|                        CLI Layer                            |
|  cli/index.ts --> cli/router.ts --> cli/commands/*         |
+---------------------------+---------------------------------+
                            | calls
                            v
+-------------------------------------------------------------+
|                        Core Layer                           |
|                                                             |
|  +--------------+     +--------------+                      |
|  |process-engine|<----|skill-runtime |                      |
|  +------+-------+     +------+-------+                      |
|         |                    |                              |
|         v                    v                              |
|  +--------------+     +--------------+                      |
|  |gate-engine   |<----|ai-orchestrator|                     |
|  +------+-------+     +--------------+                      |
|         |                                                  |
|         v                    +--------------+               |
|  +--------------+           |change-mgr    |               |
|  |trace-engine  |<----------+--------------+               |
|  +--------------+                                           |
+---------------------------+---------------------------------+
                            | depends on
                            v
+-------------------------------------------------------------+
|                       Shared Layer                          |
|  shared/types.ts (Stage, ExitCode, FeatureState, etc.)      |
+-------------------------------------------------------------+
```

**证据**: `structure-overview.json:303-348 (dependencies graph)`

### 模块边界

| 层级 | 模块 | 边界说明 |
|------|------|----------|
| CLI Layer | cli, cli/commands | 负责命令解析与用户交互，不包含业务逻辑 |
| Core Layer | 14 个核心模块 | 包含所有业务逻辑，模块间通过明确接口交互 |
| Shared Layer | shared | 提供公共类型定义和工具函数 |

**证据**: `structure-overview.json:285-301 (layers)`

---

## 风险管理

### 高风险：状态文件安全

**问题**: `stage-state.json` 等状态文件不可逆，手动编辑会导致 Gate 校验失准

**缓解**: 强制使用 CLI 命令（`spec-first stage advance`），禁止手动编辑

**证据**: `CLAUDE.md:10-25`

### 中风险：模块边界

**问题**: Core 模块间可能存在循环依赖或边界模糊

**缓解**: 使用 `src/shared/types.ts` 集中类型定义，core 模块间通过接口解耦

### 中风险：测试覆盖率

**问题**: 部分核心模块可能未达到 75% 覆盖率阈值

**缓解**: 运行 `npm run test:coverage` 验证，补充缺失测试

### 低风险：依赖版本

**问题**: pnpm overrides 中有 rollup、minimatch、esbuild 覆盖

**缓解**: 定期检查 overrides 是否仍然必要

**证据**: `package.json:95-101 (overrides)`

---

## 调试技巧

### 测试调试

```bash
# 运行特定测试
npx vitest run -t "pattern"

# Watch 模式调试
npm run test:watch
```

### 类型检查

```bash
# 完整类型检查
npm run typecheck
```

### Lint 调试

```bash
# 查看 lint 错误
npm run lint

# 自动修复
npm run lint:fix
```

---

## 证据路径汇总

| 内容 | 证据文件 |
|------|----------|
| npm scripts | `package.json:9-29` |
| engines requirement | `package.json:31-33` |
| exports config | `package.json:66-71` |
| common commands | `CLAUDE.md:115-132` |
| CLI entry point | `src/cli/index.ts:1-50` |
| test configuration | `vitest.config.ts:1-19` |
| 禁止操作 | `CLAUDE.md:10-25` |
| dependencies graph | `structure-overview.json:303-348` |
