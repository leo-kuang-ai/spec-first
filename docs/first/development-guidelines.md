# 开发指南

## 开发环境设置

### 前置条件

- Node.js ≥20.0.0
- pnpm（推荐）或 npm

### 安装依赖

```bash
pnpm install
```

### 验证环境

```bash
pnpm run typecheck
pnpm test
```

---

## 开发工作流

### 功能开发

1. **初始化 Feature**
   ```bash
   spec-first init --feat MYFEAT --title "我的功能"
   ```

2. **需求规格** — `/spec-first:spec`

3. **技术设计** — `/spec-first:design`

4. **任务拆解** — `/spec-first:task`

5. **代码实现** — `/spec-first:code`

6. **验收测试** — `/spec-first:verify`

### Bug 修复

1. 直接修复
2. 执行自检清单
3. 提交代码

### 代码自检清单

每次 `src/` 下 `.ts` 文件变更后必须执行：

```
✅ 自检清单
□ 1. pnpm run typecheck — 已通过
□ 2. pnpm test — 已通过
□ 3. CHANGELOG.md — 已更新（如适用）
□ 4. 变更范围 — 已确认仅限必要文件
```

---

## 代码规范

### 文件命名

- kebab-case.ts

### 命名约定

| 类型 | 规则 |
|------|------|
| 变量/函数 | camelCase |
| 类 | PascalCase |
| 常量 | SCREAMING_SNAKE_CASE |
| 枚举 | PascalCase |
| 未使用变量 | _前缀 |

### 导出规则

- Named exports only
- 禁止 default export

### TypeScript

- strict mode
- verbatimModuleSyntax
- 显式类型导入

---

## 测试

### 运行测试

```bash
# 全量测试
pnpm test

# 监听模式
pnpm run test:watch

# 单文件
npx vitest run tests/unit/router.test.ts

# 按名称匹配
npx vitest run -t "StageMachine"

# 覆盖率
pnpm run test:coverage
```

### 测试规范

- 框架：Vitest (globals enabled)
- 命名：`*.test.ts`
- 结构：`tests/unit/`, `tests/integration/`, `tests/e2e/`
- 覆盖率：lines/functions/statements 75%, branches 65%

### 测试示例

```typescript
describe('StageMachine', () => {
  it('should advance stage when gate passes', () => {
    const result = advanceStage(featureId, projectRoot);
    expect(result.success).toBe(true);
  });

  it('should not advance when gate fails', () => {
    // Mock gate failure
    vi.spyOn(gate, 'evaluateGate').mockReturnValue({ status: 'FAIL' });
    const result = advanceStage(featureId, projectRoot);
    expect(result.success).toBe(false);
  });
});
```

---

## 构建

```bash
# 构建
pnpm run build

# 类型检查
pnpm run typecheck

# Lint
pnpm run lint
pnpm run lint:fix

# 格式化
pnpm run format
```

---

## 调试

### 测试调试

```bash
# 监听模式
pnpm run test:watch

# 详细输出
npx vitest run --reporter=verbose
```

### 环境诊断

```bash
spec-first doctor
```

---

## Git 规范

### 分支命名

- 描述性名称，如 `leo-2026-03-19`, `feature/init-command`

### 提交格式

遵循 Conventional Commits：

```
type(scope): message

类型：
- feat: 新功能
- fix: Bug 修复
- docs: 文档
- refactor: 重构
- test: 测试
- chore: 杂项
```

### 提交示例

```
feat(cli): add status command
fix(gate): correct condition evaluation
docs(readme): update installation guide
```

---

## 常见问题

### Q: 如何添加新的 CLI 命令？

1. 在 `src/cli/commands/` 创建 `new-command.ts`
2. 实现 `handleNewCommand()` 函数
3. 在 `src/cli/index.ts` 注册：
   ```typescript
   registerCommand('new-command', '描述', handleNewCommand);
   ```

### Q: 如何添加新的 Skill？

1. 在 `skills/spec-first/NN-name/` 创建目录
2. 添加 `SKILL.md` 文件
3. 添加 `references/` 目录（如需要）

### Q: 如何添加新的 Gate 条件？

1. 在 `src/core/gate-engine/condition-registry.ts` 添加条件定义
2. 实现 `evaluate` 函数

---

## 证据来源

- 包配置 (`package.json:10-25`) — scripts — 显式
- 测试配置 (`vitest.config.ts:1-19`) — 覆盖率 — 显式
- ESLint 配置 (`eslint.config.js:1-28`) — 规则 — 显式
