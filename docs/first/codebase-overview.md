---
last_updated: 2026-03-05
mode: deep
project_type: backend
---

# 代码结构概览

## 目录结构

```
spec-first/
├── src/
│   ├── cli/              # CLI 命令层
│   │   ├── index.ts      # CLI 入口
│   │   ├── router.ts     # 命令路由
│   │   └── commands/     # 19 个命令实现
│   ├── core/             # 核心引擎
│   │   ├── process-engine/      # 阶段状态机
│   │   ├── skill-runtime/       # Skill 分发与执行
│   │   ├── ai-orchestrator/     # AI 编排与上下文
│   │   ├── gate-engine/         # 质量门禁
│   │   ├── trace-engine/        # 追溯体系
│   │   ├── change-mgr/          # RFC/Defect 管理
│   │   ├── template/            # 模板渲染
│   │   ├── tool-integration/    # 工具集成
│   │   ├── metrics-engine/      # 度量引擎
│   │   └── migrations/          # 版本迁移
│   ├── shared/           # 共享工具
│   └── config/           # 配置管理
├── tests/                # 测试
├── templates/            # Handlebars 模板
├── skills/               # Skill 定义
└── dist/                 # 构建产物
```

## 核心模块

### CLI 层 (`src/cli/`)

**入口**: `src/cli/index.ts` (`src/cli/index.ts:47` — `const code = await dispatch(process.argv.slice(2));` — [显式])

**命令注册机制**: 使用 `registerCommand()` 注册到 `Map<string, CommandEntry>` (`src/cli/router.ts:18` — `const commands = new Map<string, CommandEntry>();` — [显式])

**19 个命令** (`src/cli/index.ts:27-45` — 19 个 `registerCommand()` 调用 — [显式]):
- `id` - 追溯 ID 生成/校验/检索
- `matrix` - 同步追踪矩阵
- `init` - 初始化 Feature 工作区
- `stage` - 阶段流转管理
- `rfc` - RFC 变更请求
- `defect` - 缺陷跟踪
- `metrics` - 覆盖率度量
- `doctor` - 环境诊断
- `gate` - 质量门禁评估
- `golive` - 上线就绪检查
- `ai` - 会话恢复与上下文
- `commit` - 规范提交
- `feature` - Feature 管理
- `setup` - 注册 Skill 命令
- `hooks` - Git Hooks 管理
- `viewer` - Stage Viewer 可视化
- `update` - 升级后刷新
- `uninstall` - 清理配置
- `analyze` - 一致性分析

### 核心引擎 (`src/core/`)

| 模块 | 职责 | 证据 |
|------|------|------|
| `process-engine/` | 8 个活跃阶段 + 2 个终态的状态机 | `src/shared/types.ts:7-18` — Stage 枚举定义 [显式] |
| `skill-runtime/` | Skill 分发、prompt 组装、hard-gate 校验 | `src/cli/router.ts:9` — `evaluatePolicy` 导入 [显式] |
| `ai-orchestrator/` | AI 自动循环、上下文恢复、context-pack | CLAUDE.md 架构概览 [文档] |
| `gate-engine/` | 阶段质量门禁、安全扫描、SCA | `src/shared/types.ts:78-100` — GateResult 类型 [显式] |
| `trace-engine/` | 追溯 ID 生成/校验、覆盖率矩阵 | `src/shared/types.ts:27-31` — IdType 定义 [显式] |
| `change-mgr/` | RFC + Defect 状态机、影响分析 | `src/cli/index.ts:31-32` — rfc/defect 命令 [显式] |
| `template/` | Handlebars 模板渲染、产物检查 | CLAUDE.md 技术栈 [文档] |
| `tool-integration/` | AI runtime hooks、context 同步 | CLAUDE.md 架构概览 [文档] |
| `metrics-engine/` | 健康度评分、瓶颈分析 | `src/cli/index.ts:33` — metrics 命令 [显式] |
| `migrations/` | 版本迁移与兼容性 | 目录结构 [推断] |

### Skill 系统

**Skill 发现机制**: 扫描 `skills/spec-first/NN-name/SKILL.md` (`src/shared/skill-commands.ts:131-158` — `discoverSkills()` 函数 — [显式])

**命令生成**: 为每个 Skill 生成 `spec-first-${skillName}` 命令 (`src/shared/skill-commands.ts:149` — `commandName: 'spec-first-${skillName}'` — [显式])

**描述提取**: 从 SKILL.md 提取 P0 阶段描述或使用预定义描述 (`src/shared/skill-commands.ts:122-128` — `extractDescription()` 函数 — [显式])

**已注册 Skill** (`src/shared/skill-commands.ts:59-83` — `SKILL_DESCRIPTION_ZH` 常量 — [显式]):
- `onboarding` - 新手引导
- `first` - 项目快速认知
- `init` - Feature 工作区初始化
- `catchup` - 上下文恢复
- `spec` - 需求规格
- `design` - 技术设计
- `research` - 调研结论
- `task` - 任务拆解
- `code` - 代码实现
- `code-review` - 代码审查
- `test` - 验证测试
- `archive` - 归档复盘
- `plan` - 阶段计划
- `verify` - 阶段验收
- `orchestrate` - 状态编排
- `status` - 状态概览
- `doctor` - 环境诊断
- `sync` - 追踪矩阵同步
- `feature-list` - Feature 列表
- `feature-switch` - Feature 切换
- `feature-current` - 当前 Feature
- `spec-review` - 规格质量审查
- `analyze` - 一致性分析

### 共享层 (`src/shared/`)

**类型系统**: 所有共享类型集中定义 (`src/shared/types.ts:1-4` — 文件头注释 — [显式])

核心类型:
- `Stage` 枚举 - 10 个阶段定义 (`src/shared/types.ts:7-18` — [显式])
- `IdType` - 追溯 ID 类型 (`src/shared/types.ts:27-31` — [显式])
- `ExitCode` 枚举 - 退出码定义 (`src/shared/types.ts:41-48` — [显式])
- `StageState` - 阶段状态结构 (`src/shared/types.ts:59-75` — [显式])
- `GateResult` - 门禁结果 (`src/shared/types.ts:96-100` — [显式])

**工具模块**:
- `logger.ts` - 日志工具
- `config-schema.ts` - 配置 schema
- `validators.ts` - 校验工具
- `fs-utils.ts` - 文件系统工具
- `crypto-utils.ts` - 加密工具
- `host-paths.ts` - 宿主路径检测
- `skill-commands.ts` - Skill 命令注册 (`src/shared/skill-commands.ts:1-10` — 文件头注释 — [显式])

## 开发入口

### 新增 CLI 命令

1. **创建命令文件**: 在 `src/cli/commands/` 创建 `<command>.ts`
   - 导出 `handleXxx` 函数，签名为 `(args: string[]) => Promise<number> | number`
   - 返回 `ExitCode` 枚举值

2. **注册命令**: 在 `src/cli/index.ts` 添加注册
   ```typescript
   import { handleXxx } from './commands/xxx.js';
   registerCommand('xxx', '命令描述', handleXxx);
   ```
   参考: `src/cli/index.ts:27-45` — 现有 19 个命令注册示例

3. **路由机制**: `registerCommand()` 将命令添加到 `Map<string, CommandEntry>`
   - 分发逻辑: `src/cli/router.ts:35-75` — `dispatch()` 函数

### 新增 Skill

1. **创建 Skill 目录**: 在 `skills/spec-first/` 创建 `NN-<name>/`
   - `NN` 为两位数字序号（如 `00`, `01`）
   - `<name>` 为 Skill 名称（kebab-case）

2. **编写 SKILL.md**: 创建 `skills/spec-first/NN-<name>/SKILL.md`
   - 第一行格式: `# Skill: <skillName>`
   - 包含 P0 阶段描述（用于命令描述提取）
   - 参考: `src/shared/skill-commands.ts:122-128` — 描述提取逻辑

3. **注册描述（可选）**: 在 `src/shared/skill-commands.ts` 的 `SKILL_DESCRIPTION_ZH` 添加条目
   ```typescript
   '<skillName>': '中文描述',
   ```
   参考: `src/shared/skill-commands.ts:59-83`

4. **自动发现**: Skill 会被 `discoverSkills()` 自动扫描并生成命令
   - 命令名: `spec-first-<skillName>`
   - 发现逻辑: `src/shared/skill-commands.ts:131-158`

5. **同步到宿主**: 运行 `spec-first setup` 或 `spec-first update` 同步到 Claude Code/Codex
   - 同步逻辑: `src/shared/skill-commands.ts:327-363` — `ensureSkillCommands()`

### 修改核心引擎

1. **新增引擎模块**: 在 `src/core/` 创建模块目录
   - 使用 **named exports only**（禁止 default export）
   - 文件命名: `kebab-case.ts`

2. **添加类型定义**: 在 `src/shared/types.ts` 添加共享类型
   - 所有跨模块类型必须集中定义
   - 参考: `src/shared/types.ts:1-4` — 类型集中原则

3. **集成到命令**: 在对应的 `src/cli/commands/` 文件中导入并使用

### 修改 Stage 定义

1. **修改枚举**: 编辑 `src/shared/types.ts` 的 `Stage` 枚举
   - 位置: `src/shared/types.ts:7-18`
   - 格式: `STAGE_NAME = 'NN_stage_name'`

2. **更新终态集合**: 如添加新终态，更新 `TERMINAL_STAGES`
   - 位置: `src/shared/types.ts:21-24`

3. **影响范围**: Stage 变更会影响
   - `process-engine/` - 状态机流转逻辑
   - `gate-engine/` - 门禁评估
   - 所有 Skill 的阶段校验

### 添加追溯 ID 类型

1. **修改类型定义**: 编辑 `src/shared/types.ts`
   - `NextIdType`: `src/shared/types.ts:27-30`
   - `IdType`: `src/shared/types.ts:31`

2. **实现生成逻辑**: 在 `src/core/trace-engine/` 添加对应生成器

3. **集成到命令**: 在 `src/cli/commands/id.ts` 添加子命令支持

## 代码约定

- **ESM Only**: 全项目使用 `import/export` (`package.json` — `"type": "module"` — [显式])
- **Named Exports**: 核心模块不使用 default export (CLAUDE.md 关键约定 — [文档])
- **文件命名**: kebab-case.ts (CLAUDE.md 关键约定 — [文档])
- **类型集中**: 共享类型定义在 `src/shared/types.ts` (`src/shared/types.ts:1-4` — [显式])
- **未使用变量**: 以 `_` 前缀标记 (CLAUDE.md 关键约定 — [文档])
- **严格模式**: TypeScript strict mode + verbatimModuleSyntax (CLAUDE.md 技术栈 — [文档])

## 测试结构

```
tests/
├── unit/           # 单元测试（每模块一个文件）
├── integration/    # 集成测试
├── e2e/            # 端到端测试
├── benchmark/      # 性能基准测试
└── fixtures/       # 测试固件数据
```

**覆盖率阈值** (CLAUDE.md 技术栈 — [文档]):
- lines/functions/statements: 75%
- branches: 65%

**测试命令**:
- `npm test` - 全量测试
- `npm run test:watch` - watch 模式
- `npx vitest run <file>` - 单文件测试
- `npx vitest run -t "<pattern>"` - 按名称匹配

## 构建与发布

**构建工具**: tsup (CLAUDE.md 技术栈 — [文档])

**构建命令**:
- `npm run build` - 打包到 `dist/`
- `npm run typecheck` - 类型检查（不生成产物）

**代码质量**:
- `npm run lint` - ESLint 检查
- `npm run lint:fix` - 自动修复
- `npm run format` - Prettier 格式化
