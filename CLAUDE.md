# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **版本**: v1.2.0 | **更新**: 2026-02-28 | **状态**: 活跃维护

---

## 📌 项目定位

**Spec-First 全链路研发闭环**

基于 **Spec-First 核心理念**（规范即契约、规范即真理）设计的全链路研发闭环。

参考了 **Spec-Kit** 的结构化定义和 **Open-Spec** 的行业标准，确保从业务点子到测试上线的每一步都有据可查、自动化可校验。

### 核心原则

1. **规范即契约** - 所有开发活动以规范为准，规范是团队协作的唯一真理源
2. **全链路追溯** - 从需求到上线，每个环节都可追溯到对应规范
3. **自动化校验** - 规范可被工具自动解析和校验，减少人工审查成本
4. **结构化定义** - 采用标准化的规范格式，确保跨项目一致性

---

## 🔒 工作规范

### 核心理念

- **简洁至上**：恪守KISS原则，变更只触及必要代码，避免过度工程化与不必要的防御性设计
- **追根溯源**：找到根因，不做临时补丁，以 Senior Developer 标准要求自己
- **最小影响**：变更只触及必要范围，避免引入副作用
- **事实为本**：以事实为最高准则。若有任何谬误，恳请坦率斧正，助我精进
- **主动挑战**：当结论与数据矛盾、忽略风险、计划过于乐观、或技术优先伤害业务价值时，应直接指出并提供依据
- **规范驱动**：所有开发活动必须基于明确的规范定义，规范是唯一真理源

### 强制工作流

**渐进式开发**：通过多轮对话迭代，明确并实现需求。

**强制流程**：在编码前必须先完成
1. **构思方案** → 明确需求和实现思路
2. **请求审核** → 确认方案可行性
3. **拆解任务** → 分解为具体执行步骤
4. **逐项实现** → 按任务清单执行并自检

**不得"带假设开工"**，所有疑点必须在前期调研中厘清。

### Spec-First 特定约束

1. **规范先行** - 任何功能开发前，必须先定义或引用对应规范
2. **规范校验** - 代码提交前，必须通过自动化规范校验
3. **规范追溯** - 每个实现必须能追溯到对应的规范定义
4. **规范演进** - 规范变更必须有版本管理和影响分析

### 代码变动铁律

- **强制自检**：任何对项目源码的新增/删除/修改，完成后必须进行强制自检，确保实现与需求完全对齐
- **规范对齐检查**：代码变动必须与对应规范定义一致，不得出现"代码与规范不符"的情况
- **CHANGELOG.md 强制更新**：任何对项目源码的新增/删除/修改，必须同步在项目根目录 `CHANGELOG.md` 中添加一条记录，无此记录的代码变动一律拒绝生成
  - 记录格式：`- vX.Y.Z YYYY-MM-DD 作者: 一句话摘要`
  - 用户可见变更在末尾追加 `(user-visible)`
- **规范文档同步提交**：每次代码提交时，需将 `CLAUDE.md` 一并纳入提交范围，确保规范文档一致

---

## 🔄 工作流编排

### Plan 模式优先

- 非简单任务（3+ 步骤或涉及架构决策）必须进入 plan mode
- 遇到偏差时立即停下重新规划，不要硬推
- 验证步骤也用 plan mode 管理，不只是构建阶段
- 前期写清楚详细 spec，减少歧义

### Subagent 策略

- 积极使用 subagent 保持主上下文窗口干净
- 调研、探索、并行分析等任务下放给 subagent
- 复杂问题通过多 subagent 并行投入算力
- 每个 subagent 只做一件事，保持聚焦

### 自我改进循环

- 收到用户纠正后，立即将模式记录到 `tasks/lessons.md`
- 为自己编写防止同类错误的规则
- 持续迭代这些经验直到错误率下降
- 会话开始时回顾相关项目的 lessons

### 完成前验证

- 任务完成前必须证明其有效性
- 相关时对比 main 分支与当前变更的行为差异
- 自问："一个 Staff Engineer 会批准这个吗？"
- 跑测试、查日志、展示正确性

### 追求优雅（适度）

- 非简单变更：暂停问自己"有没有更优雅的方式？"
- 如果修复感觉像 hack："基于我现在掌握的全部信息，实现优雅方案"
- 简单明显的修复跳过此步，不要过度工程化

### 自主修 Bug

- 收到 bug 报告后直接修复，不要反问用户怎么做
- 指向日志、错误、失败测试，然后解决它们
- 用户零上下文切换成本
- CI 测试失败时主动修复，无需指导

## 📋 任务管理

1. **先写计划**: 将计划写入 `tasks/todo.md`，使用可勾选项
2. **确认计划**: 开始实现前与用户确认
3. **跟踪进度**: 完成时逐项标记
4. **说明变更**: 每步给出高层摘要
5. **记录结果**: 在 `tasks/todo.md` 添加 review section
6. **沉淀经验**: 收到纠正后更新 `tasks/lessons.md`

---

## 🛠️ 项目硬约束

### 技术栈

- **Runtime**: Node.js ≥20, ESM (`"type": "module"`)
- **Language**: TypeScript ≥5.4, strict mode, `verbatimModuleSyntax`
- **Bundler**: tsup
- **Test**: Vitest (globals enabled, v8 coverage, 75% threshold)
- **Lint**: eslint + typescript-eslint, Prettier
- **Templates**: Handlebars
- **Config**: js-yaml

### 常用命令

```bash
# 构建
npm run build              # tsup 打包
npm run typecheck          # tsc --noEmit 类型检查

# 测试
npm test                   # vitest run（全量）
npm run test:watch         # vitest watch 模式
npx vitest run tests/unit/fs-utils.test.ts  # 运行单个测试文件
npx vitest run -t "test name pattern"       # 按名称匹配运行

# 代码质量
npm run lint               # eslint src
npm run lint:fix           # eslint src --fix
npm run format             # prettier 格式化
```

### 规范体系

**参考标准**：
- **Spec-Kit** - 结构化规范定义方法
- **Open-Spec** - 行业标准规范格式

**规范层级**（待完善）：
1. 业务规范 - 需求定义、业务流程
2. 接口规范 - API契约、数据结构
3. 实现规范 - 代码规范、架构约束
4. 测试规范 - 测试用例、验收标准

---

## 🏗️ 架构概览

### 核心模块 (`src/core/`)

| 模块 | 职责 |
|------|------|
| `process-engine/` | 阶段状态机（8 active + 2 terminal stages），驱动 Feature 生命周期流转 |
| `skill-runtime/` | Skill 分发、prompt 组装、hard-gate 校验、编排参数解析 |
| `ai-orchestrator/` | AI 自动循环（auto-loop）、上下文恢复（catchup）、context-pack |
| `gate-engine/` | 阶段质量门禁评估、安全扫描、SCA、上线/回滚门禁 |
| `trace-engine/` | 追溯 ID 生成/校验/搜索、覆盖率矩阵（C1-C9） |
| `change-mgr/` | RFC + Defect 状态机、影响分析 |
| `template/` | Handlebars 模板渲染、产物检查 |
| `tool-integration/` | AI runtime hooks、context 同步 |
| `metrics-engine/` | 健康度评分、瓶颈分析 |

### 入口与命令路由

- 入口: `src/cli/index.ts` → 注册所有命令 → `dispatch(argv)`
- 路由: `src/cli/router.ts` — `registerCommand(name, desc, handler)` 模式，`Map<string, CommandEntry>` 注册表
- 19 个命令: id, matrix, init, stage, rfc, defect, metrics, doctor, gate, golive, ai, commit, feature, setup, hooks, viewer, update, uninstall, analyze

### Skill 分发流程（三层路由）

1. **Semantic Map** — 复合命令映射（如 `rfc approve` → 带参数模板的 runtime 命令）
2. **Runtime Route** — `RUNTIME_COMMANDS` 集合（id, matrix, stage, rfc, defect, metrics, gate, golive, ai, commit, feature）→ 直接分发为 CLI 命令
3. **Skill Route** — `resolveSkillPath()` 搜索 `skills/spec-first/NN-name/SKILL.md` → 包级 fallback
4. Skill 加载管线: 读文件 → `ensureNextStepsPolicy()` → `assemblePrompt()` → KV-cache 稳定性检查 → `buildHardGateRuntimeNotice()` 前置

### 关键约定

- **ESM only** — 全项目 `"type": "module"`，使用 `import/export`
- **Named exports only** — core 模块不使用 default export
- **文件命名**: `kebab-case.ts`
- **类型集中**: 所有共享类型定义在 `src/shared/types.ts`（Stage enum, ExitCode, ID types 等）
- **未使用变量**: 以 `_` 前缀标记（eslint 规则 `^_`）
- **Stage 枚举**: 00_init → 01_specify → 02_design → 03_plan → 04_implement → 05_verify → 06_wrap_up → 07_release → 08_done / 09_cancelled
- **追溯 ID 类型**: FR, DS, TASK, TC, RFC, REQ, SYS, ARCH, MOD, ATP, STP, ITP, UTP, Feature

### 测试结构

- `tests/unit/` — 单元测试（每模块一个文件）
- `tests/integration/` — 集成测试
- `tests/e2e/` — 端到端测试
- `tests/benchmark/` — 性能基准测试
- `tests/fixtures/` — 测试固件数据
- 覆盖率阈值: lines/functions/statements 75%, branches 65%

---

## 📋 协议优先级

遵循以下优先级：

1. **Spec-First 核心原则** - 规范即契约、规范即真理
2. **工作规范**（本文档）- 强制性MUST规则、工作流程、代码变动铁律
3. **Claude Code 默认行为** - 通用最佳实践

**优先级说明**：
- Spec-First 原则是项目的根本约束，任何决策都不得违背
- 工作规范是强制性的 MUST 规则，任何代码变动必须遵守
- 当存在冲突时：Spec-First 原则 > 工作规范 > 默认行为

**验证机制**：
- 任何代码变动前，必须输出「已阅读 ✅」清单，确认已读取相关规范文档
- 代码提交前，必须通过规范校验工具检查
- 如发现代码与规范不一致，必须立即修正或更新规范

---

## 🎯 输出模式规范

### 输出语言

- **默认中文**：除非用户明确要求英文，否则一律使用中文回复
- **技术术语**：保持英文原文（如 API、Spec-First、Open-Spec）
- **代码注释**：根据项目约定（待定）

### 代码规则

1. **注释规范**：
   - 复杂逻辑必须添加注释说明
   - 注释需说明"为什么"而非"是什么"
   - 规范引用：注释中标注对应规范位置

2. **命名规范**：
   - 变量/函数名必须语义明确
   - 避免缩写（除非是行业通用缩写）
   - 遵循项目统一命名风格

3. **错误处理**：
   - 关键路径必须有错误处理
   - 错误信息需包含规范引用
   - 提供明确的错误恢复建议

---

## 📝 更新日志

- v1.2.1 2026-02-28 Claude: 以代码为准修正 Stage 枚举(07_release)、命令数(19)、Skill 三层路由、测试结构
- v1.2.0 2026-02-28 Claude: 新增工作流编排、任务管理章节；核心理念补充追根溯源/最小影响
- v1.1.0 2026-02-28 Claude: 补充技术栈、常用命令、架构概览；移除硬编码路径
- v1.0.0 2026-02-06 Leo: 初始化 Spec-First 项目规范文档
