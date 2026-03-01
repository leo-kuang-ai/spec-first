---
last_updated: 2026-02-28
---

# 项目研发规范

> 本文档基于项目实际代码和配置自动生成，并结合业界最佳实践进行对比分析。

## 代码风格

**当前规范**:
- **Linter**: ESLint ^10.0.2
- **配置文件**: `eslint.config.js`
- **格式化工具**: Prettier ^3.8.1
- **缩进**: 2 空格（Prettier 默认）
- **引号**: 单引号（Prettier 默认）
- **分号**: 行尾必须有分号（ESLint 规则）

**相关文件**:
- `eslint.config.js` - ESLint 配置
- `.prettierrc` - Prettier 配置
- `package.json` - scripts: lint, lint:fix, format

**使用方式**:
```bash
npm run lint       # 检查代码问题
npm run lint:fix    # 自动修复可修复的问题
npm run format      # 格式化所有代码
```

## 提交规范

**当前规范**:
- **提交信息格式**: 遵循 Conventional Commits
- **CHANGELOG.md**: 每次变更需更新
- **Hook 验证**: `.spec-first/hooks/commit-msg.sh` 验证提交格式

**CHANGELOG 格式**:
```markdown
- vX.Y.Z YYYY-MM-DD 作者: 一句话摘要
```

**验证**:
```bash
# 提交前自动验证 commit-msg.sh
git commit -m "feat: 添加新功能"
```

## 测试要求

**测试框架**: Vitest ^1.6.1

**测试命令**:
```bash
npm test              # 运行所有测试
npm run test:watch   # 监视模式
```

**覆盖率**:
- **工具**: @vitest/coverage-v8 ^1.6.1
- **报告位置**: `coverage/` 目录
- **阈值**: 未强制配置，建议保持高覆盖率

**测试文件位置**: `tests/unit/`, `tests/integration/`, `tests/e2e/`

## 文档规范

**JSDoc**: TypeScript 类型系统优先，JSDoc 用于复杂类型注释

**文档生成**:
- 类型文档由 TypeScript 自动生成
- Skill 文档: `skills/spec-first/*/SKILL.md`
- 用户文档: `README.md`, `docs/`

## 错误处理

**日志框架**: 无专用日志框架，使用 `console.error` 输出错误

**异常处理**:
- 同步代码: `try-catch` 块
- 异步代码: `await` 错误处理
- ExitCode: `src/shared/types.ts` 定义标准退出码

**错误输出**:
```typescript
console.error(`错误：${message}`);
```

## 依赖管理

**包管理器**: pnpm

**lock 文件**: `pnpm-lock.yaml`

**核心依赖**:
- `handlebars` ^4.7.8 - 模板引擎
- `js-yaml` ^4.1.0 - YAML 解析
- `update-notifier` ^7.0.0 - 版本更新通知

**overrides 配置**:
```json
"pnpm": {
  "overrides": {
    "rollup": "^4.59.0",
    "minimatch": "^3.1.3"
  }
}
```

---

*生成时间: 2026-02-28 | 命令: `/spec-first:first`*
