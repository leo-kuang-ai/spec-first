# Spec-First 最终审查报告（精简版）

**日期**: 2026-03-02  
**范围**: 仅保留并跟踪以下 5 个问题（其余问题全部移除）

## 结论

当前仅保留以下问题项；其中本轮已逐项完成优化/修复并执行测试验证。

## 保留问题与处理结果

### 1. P1-001：开发依赖链存在 esbuild 0.21.5

- 状态: 已修复
- 修复动作:
- 在 `package.json` 增加 `pnpm.overrides.esbuild: ^0.27.3`
- 更新 `pnpm-lock.yaml`
- 验证:
- `pnpm why esbuild` 已解析到 `0.27.3`，不再出现 `0.21.5`

### 2. P2-004：SHA256 辅助逻辑重复

- 状态: 已修复
- 修复动作:
- 新增共享工具 `src/shared/crypto-utils.ts`（`sha256Hex`）
- 替换重复实现:
- `src/core/skill-runtime/first-change-detector.ts`
- `src/core/template/hash-registry.ts`
- `src/core/skill-runtime/first-resume.ts`
- 验证:
- 相关单测通过（见“测试结果”）

### 3. P2-005：跨模块分类规则存在漂移风险

- 状态: 已修复
- 修复动作:
- 新增单一规则来源 `src/core/template/template-level-classifier.ts`
- `change-classifier` 与 `hash-registry` 统一复用该模块
- 验证:
- `tests/unit/change-classifier.test.ts` 通过
- `tests/unit/hash-registry.test.ts` 通过

### 4. P2-006：大体量静态映射维护成本高

- 状态: 已修复
- 修复动作:
- 将映射规则从 `first-change-detector` 抽离到独立模块:
- `src/core/skill-runtime/first-artifact-mapping.ts`
- `first-change-detector` 改为调用 `matchArtifactsByChangedFile`
- 新增专项测试:
- `tests/unit/first-artifact-mapping.test.ts`
- 验证:
- 映射规则测试通过

### 5. P2-007：错误处理与观测策略尚未统一

- 状态: 已修复
- 修复动作:
- 新增统一观测工具:
- `src/core/skill-runtime/first-runtime-observability.ts`
- 统一接入降级/异常分支:
- `src/core/skill-runtime/first-change-detector.ts`
- `src/core/skill-runtime/first-index.ts`
- `src/core/skill-runtime/first-resume.ts`
- 验证:
- `tests/unit/first-runtime-observability.test.ts` 通过
- 相关模块回归测试通过

## 测试结果

### 定向回归（本轮改动相关）

已执行并通过:

- `tests/unit/change-classifier.test.ts`
- `tests/unit/hash-registry.test.ts`
- `tests/unit/first-index.test.ts`
- `tests/unit/first-resume.test.ts`
- `tests/unit/first-change-detector.test.ts`
- `tests/unit/first-artifact-mapping.test.ts`
- `tests/unit/first-runtime-observability.test.ts`

汇总: **7 个测试文件，102 个测试全部通过**。

### 全量测试说明

执行 `pnpm test` 时，仍有仓库内既有失败（与本次 5 项修复无直接关联）:

- `tests/unit/first-skill-docs.test.ts` 2 个断言失败

