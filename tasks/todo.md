# Robustness Optimization - TODO

**基于**: docs/02-技术方案/spec-first-robustness-optimization.md
**创建**: 2026-03-05
**状态**: Completed ✅

---

## Phase 1: P0-3.1 格式校验前置化 ✅

### 核心模块
- [x] 1. 创建 `src/cli/commands/validate.ts` - 命令入口
- [x] 2. 创建 `src/core/validators/format-validator.ts` - 格式校验核心
- [x] 3. 实现 PRD 章节格式校验
- [x] 4. 实现 ID 格式校验（移除连字符）
- [x] 5. 实现文件路径校验
- [x] 6. 实现必需字段校验

### 集成点
- [x] 7. 修改 `skills/spec-first/03-spec/SKILL.md` - P4 后调用 validate
- [x] 8. 修改 `skills/spec-first/04-design/SKILL.md` - P4 后调用 validate
- [x] 9. 修改 `skills/spec-first/06-task/SKILL.md` - P4 后调用 validate

### 测试
- [x] 10. 添加 `tests/unit/format-validator.test.ts`（4 个测试）
- [x] 11. 添加 `tests/integration/validate-command.test.ts`（7 个测试）

---

## Phase 2: P0-3.3 依赖检查自动化 ✅

### 核心模块
- [x] 12. 创建 `src/core/process-engine/dependency-checker.ts`
- [x] 13. 定义 `StageDependency` 接口
- [x] 14. 配置各阶段依赖项（npm scripts/files/env）
- [x] 15. 实现 `checkDependencies()` 函数

### 集成点
- [x] 16. 修改 `src/core/process-engine/advance.ts` - advance 前检查依赖

### 测试
- [x] 17. 添加 `tests/unit/dependency-checker.test.ts`（5 个测试）

---

## 额外完成项 ✅

### 任务 1: 集成测试
- [x] 添加 `tests/integration/validate-command.test.ts`
- [x] 支持 `ValidateOptions.projectRoot` 用于测试

### 任务 2: Skills 集成
- [x] 03-spec Skill P4 落盘后添加格式校验
- [x] 04-design Skill 成功标准后添加格式校验
- [x] 06-task Skill 成功标准后添加格式校验

### 任务 3: 依赖检查配置化
- [x] config-schema.ts 新增 `DependenciesConfig` 接口
- [x] config.yaml 新增 `dependencies` 配置段
- [x] dependency-checker.ts 优先读取配置，回退到内置默认值

---

## 执行策略

**最小化原则**: 只实现核心功能，避免过度工程化 ✅

**分段输出**: 代码分多次小块输出，避免单次过大 ✅

**验证优先**: 每个模块完成后立即测试 ✅

---

## 完成总结

### 已完成（19 项）
- ✅ P0-3.1 格式校验前置化（CLI + 校验器 + Skills 集成）
- ✅ P0-3.3 依赖检查自动化（检查器 + 集成 + 配置化）
- ✅ 集成测试（7 个测试用例）
- ✅ Skills 集成（3 个 Skills）
- ✅ 依赖检查配置化

### 测试结果
- ✅ 96 个测试文件通过
- ✅ 1113 个测试用例通过
- ✅ 0 个失败

### 产出文件（12 个）
- `src/cli/commands/validate.ts`
- `src/core/validators/format-validator.ts`
- `src/core/process-engine/dependency-checker.ts`
- `src/shared/config-schema.ts`（修改）
- `src/cli/index.ts`（修改）
- `src/core/process-engine/advance.ts`（修改）
- `tests/unit/format-validator.test.ts`
- `tests/unit/dependency-checker.test.ts`
- `tests/integration/validate-command.test.ts`
- `tests/unit/advance.test.ts`（修改）
- `tests/e2e/error-paths.test.ts`（修改）
- `skills/spec-first/03-spec/SKILL.md`（修改）
- `skills/spec-first/04-design/SKILL.md`（修改）
- `skills/spec-first/06-task/SKILL.md`（修改）

### 版本
- v0.5.87: P0-3.1/3.3 基础实现
- v0.5.88: 集成测试/Skills 集成/配置化
