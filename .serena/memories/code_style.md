# Spec-First 代码风格与约定

## TypeScript 配置

- **Target**: ES2022
- **Module**: ESNext (ESM)
- **Strict mode**: 启用
- **verbatimModuleSyntax**: 启用

## 命名约定

| 类型 | 约定 | 示例 |
|------|------|------|
| 文件名 | kebab-case | `stage-machine.ts` |
| 类名 | PascalCase | `ProcessEngine` |
| 函数名 | camelCase | `getCoverage()` |
| 常量 | SCREAMING_SNAKE | `MAX_RETRIES` |
| 接口 | PascalCase（无 I 前缀） | `FeatureConfig` |
| 类型 | PascalCase | `Stage` |
| 枚举 | PascalCase | `Stage` |

## 模块结构

每个核心模块遵循以下结构：

```
module-name/
├── index.ts           # 导出入口
├── core.ts            # 核心逻辑
├── types.ts           # 类型定义（如需要）
└── __tests__/         # 测试文件
```

## 错误处理

- 使用类型化错误（非裸 `Error`）
- 错误类型定义在 `src/shared/types.ts`
- 关键路径必须有错误处理
- 错误信息需包含规范引用

## 日志规范

- 使用 `src/shared/logger.ts` 中的 JSONL 日志工具
- 审计日志写入 `.jsonl` 文件（追加模式）
- 终端输出使用统一的日志格式

## 测试规范

- 测试框架：Vitest
- 单元测试放在 `tests/unit/`
- 集成测试放在 `tests/integration/`
- E2E 测试放在 `tests/e2e/`
- 测试文件命名：`*.test.ts`

## 文档约定

- 使用中文编写（技术术语保持英文）
- Markdown 格式
- CHANGELOG.md 必须同步更新
- 代码变更必须更新 CLAUDE.md（如有相关规范）

## ID 格式

- **Feature ID**: `FSREQ-YYYYMMDD-<FEAT>-NNN`
- **FR ID**: `FR-<ABBR>-NNN`
- **NFR ID**: `NFR-<ABBR>-NNN`
- **TASK ID**: `TASK-<ABBR>-NNN`
- **TC ID**: `TC-<ABBR>-NNN`
