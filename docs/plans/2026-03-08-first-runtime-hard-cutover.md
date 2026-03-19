# first-runtime hard cutover design

日期：2026-03-08

## 目标

彻底移除 `first-index.ts` / `first-legacy-index.ts` / `.index.yaml` 相关代码与测试心智，统一以 `.spec-first/runtime/first/*.json` 作为 `00-first` 唯一真源。

## 方案

### 方案 A：保留 shim，仅清主链
- 优点：改动小。
- 缺点：继续保留误导性入口，未来仍可能被误用。

### 方案 B：runtime-only hard cutover（采用）
- 删除 legacy shim 与 legacy index 实现。
- `first-resume` 只接受 runtime 真源语义，不再支持 legacy `docs/first` 分支。
- `first-change-detector` 只检查 runtime 资产健康，不再扫描 `docs/first/*.md` 与 `.index.yaml`。
- 测试全部改为 runtime-only fixture。

### 方案 C：保留兼容代码但强制抛错
- 优点：能更快暴露误用。
- 缺点：仍保留历史结构和冗余导出，没有方案 B 干净。

## 决策

采用方案 B，因为用户已明确不需要向下兼容，且当前最佳实践是保证真源唯一、接口唯一、测试心智唯一。

## 实施步骤

1. 先把 `first-resume`、`first-change-detector`、相关单测改为 runtime-only 预期。
2. 运行局部测试，确认出现 RED。
3. 修改生产代码完成 hard cutover。
4. 删除 legacy 文件与 legacy 测试。
5. 更新关联文档与 `CHANGELOG.md`。
6. 顺序执行 `CI=1 pnpm typecheck` 与 `CI=1 pnpm test`。

## 影响范围

- `src/core/skill-runtime/first-resume.ts`
- `src/core/skill-runtime/first-change-detector.ts`
- `src/core/skill-runtime/dispatcher.ts`
- `src/core/skill-runtime/first-index.ts`（删除）
- `src/core/skill-runtime/first-legacy-index.ts`（删除）
- `tests/unit/first-resume.test.ts`
- `tests/unit/first-change-detector.test.ts`
- `tests/unit/first-index.test.ts`（删除）
- `tests/unit/init-runtime-readiness.test.ts`
- `tests/unit/cli-init-stage.test.ts`
- `skills/spec-first/00-first/SKILL.md`
- `CHANGELOG.md`
