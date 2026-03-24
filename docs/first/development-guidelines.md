# 开发指南

> 基于 `.spec-first/runtime/first/entry-guide.json` 与 `conventions.json` 生成

## 环境准备

### 系统要求

- **Runtime**: Node.js >=20.0.0
- **包管理器**: npm

### 初始化

```bash
# 安装依赖
npm install

# 构建项目
npm run build

# 类型检查
npm run typecheck
```

## 常用命令

### 构建与类型检查

```bash
npm run build              # tsup 打包
npm run typecheck          # tsc --noEmit 类型检查
```

### 测试

```bash
npm test                   # vitest run（全量）
npm run test:watch         # vitest watch 模式
npx vitest run tests/unit/<file>.test.ts   # 单文件
npx vitest run -t "pattern"               # 按名称匹配
```

### 代码质量

```bash
npm run lint               # eslint src
npm run lint:fix           # eslint --fix
npm run format             # prettier 格式化
```

### Spec-First CLI

```bash
# Feature 管理
spec-first feature current                          # 查看当前 featureId
spec-first feature switch <featureId>               # 切换 Feature

# Gate 与阶段
spec-first gate check --feature <featureId>         # 执行 Gate 校验
spec-first stage advance --feature <featureId>      # 推进阶段

# 文档与追溯
spec-first docs links validate --feature <featureId> # 校验文档关联
spec-first metrics --feature <featureId>            # 查看覆盖率指标
spec-first id search <ID>                           # 追溯 ID 上下游
spec-first id generate <TYPE> --feature <featureId> # 生成新 ID
```

## 开发流程

### 1. 代码变更后自检

每次 `src/` 下 `.ts` 文件变更后必须执行：

```bash
npm run typecheck
npm test
```

### 2. 提交前检查

- 确保所有测试通过
- 确保 lint 无错误
- 更新 CHANGELOG.md

### 3. 核心模块变更注意事项

修改以下核心模块时需要特别谨慎：

- `src/core/` - 核心引擎逻辑
- `src/shared/types.ts` - Stage/ID 体系
- 任何 `index.ts` 重导出变更

## 禁止操作

以下文件/目录**只能通过 CLI 操作**，禁止手动编辑：

| 文件 | 风险等级 | 正确操作 |
|------|---------|---------|
| `stage-state.json` | 高 | `spec-first stage advance` |
| `document-links.yaml` | 中 | `spec-first docs links validate` |
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
| `docs links validate` | 可临时跳过，完成后提醒用户补校验 |
| 其他状态文件 | 仅读取不写入，告知用户需补 CLI 命令 |
