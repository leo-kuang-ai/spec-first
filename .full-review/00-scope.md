# 审查范围

## 审查目标

**Spec-First 规范驱动开发框架 - 全项目研发流程审查**

这是一个基于 SDD (Specification-Driven Development) 规范的研发闭环引擎项目，包含：
- 完整的阶段状态机（8 个活跃阶段 + 2 个终止阶段）
- 14 个核心模块（process-engine, skill-runtime, gate-engine 等）
- 27 个 CLI 命令
- 20 个 Skill 定义
- 追溯体系（14 种 ID 类型，5 项覆盖率指标）

## 审查范围

### 代码层面
- **源代码**: `src/` 目录下 163 个 TypeScript 文件
  - `src/cli/` - CLI 命令注册与路由
  - `src/core/` - 核心引擎（14 个模块）
  - `src/shared/` - 共享类型与工具函数

### 文档层面
- **规范文档**: `specs/` 目录下 59 个文档
- **需求文档**: `docs/01-需求文档/` 下的架构设计与任务文档
- **用户文档**: `docs/07-用户文档/` 使用手册与命令参考

### 测试层面
- **单元测试**: `tests/unit/`
- **集成测试**: `tests/integration/`
- **E2E 测试**: `tests/e2e/`

### 配置层面
- **构建配置**: `package.json`, `tsconfig.json`, `tsup.config.ts`
- **质量配置**: `.eslintrc`, `.prettierrc`, `vitest.config.ts`
- **Skill 定义**: `skills/spec-first/` 下 20 个 Skill

## 审查标志

- **安全焦点**: ✅ 是（审查命令注入、路径遍历、敏感数据泄露等）
- **性能关键**: ✅ 是（审查大规模文件处理、并发性能、内存管理）
- **严格模式**: ✅ 是（所有 Critical 问题必须立即修复）
- **框架**: TypeScript/Node.js (ESM, strict mode)

## 当前改动概览

根据 git status，当前有大量改动：
- **修改的文件**: 核心模块、CLI 命令、Skill 定义、文档
- **删除的文件**: 旧的 TDD 强制方案、备份的 Skill 文件
- **新增的文件**: 专家角色集成、Host Adapter 设计、测试文件

主要改动领域：
1. **Host-Adapter 系统** - 宿主环境适配器
2. **专家角色集成** - 多 Agent 协作能力
3. **工具集成** - tool-registry, capability-matrix
4. **CLI 增强** - doctor, init, update 命令优化
5. **Skill 优化** - research, review, verify 流程改进

## 审查阶段

按照 comprehensive-review 流程执行 5 个阶段：

1. **Phase 1: 代码质量与架构审查** (并行执行 1A+1B)
   - 1A: 代码质量分析（复杂度、可维护性、技术债）
   - 1B: 架构设计审查（边界、依赖、API、数据模型）

2. **Phase 2: 安全与性能审查** (并行执行 2A+2B)
   - 2A: 安全漏洞评估（OWASP Top 10、输入验证、认证授权）
   - 2B: 性能与可扩展性分析（数据库、内存、并发、缓存）

3. **Phase 3: 测试与文档审查** (并行执行 3A+3B)
   - 3A: 测试覆盖率与质量分析
   - 3B: 文档完整性与准确性审查

4. **Phase 4: 最佳实践与标准** (并行执行 4A+4B)
   - 4A: 框架与语言最佳实践
   - 4B: CI/CD 与 DevOps 实践

5. **Phase 5: 综合报告**
   - 汇总所有发现，按优先级分类
   - 生成可执行的行动计划

## 预期产出

每个阶段完成后将生成对应的审查报告：
- `.full-review/01-quality-architecture.md`
- `.full-review/02-security-performance.md`
- `.full-review/03-testing-documentation.md`
- `.full-review/04-best-practices.md`
- `.full-review/05-final-report.md`

---

**审查开始时间**: 2026-03-15
**审查严格级别**: Critical（所有严重问题必须立即修复）
