# 05-final-report 准确性审计报告

**审计日期**: 2026-03-02  
**目标文件**: `.full-review/05-final-report.md`  
**审计范围**: 重点核验 P0/P1 全量条目，P2/P3 抽样核验

---

## 总体结论

原报告覆盖面较广，但存在明显事实性错误与定级偏高问题，尤其集中在 P0/P1。

- P0/P1 共 20 条中：
  - 准确: 6
  - 部分准确: 10
  - 不准确: 4
- 主要问题类型：
  - 将“文件存在但缺少某类测试”误写为“文件缺失”
  - 在缺少威胁模型前提下直接给 Critical
  - 个别复杂度/结构结论与代码事实不符
  - 使用特定工具链方案（husky）替代实际已实现方案，导致误判

**审计评级（针对报告本身）**: C+

---

## P0/P1 逐条核验

| ID | 原结论 | 审计结论 | 证据 |
|---|---|---|---|
| P0-001 | esbuild 漏洞 Critical | **部分准确**：`esbuild 0.21.5` 传递依赖存在，但为 dev 链路；Critical 偏高 | `pnpm why esbuild` 输出；`package.json` 依赖见 [package.json](/Users/kuang/xiaobu/spec-first/package.json#L53) |
| P0-002 | Handlebars 模板注入 Critical/RCE | **部分准确**：缺少额外安全约束是事实，但“可远程 RCE”证据不足、定级偏高 | 渲染实现见 [renderer.ts](/Users/kuang/xiaobu/spec-first/src/core/template/renderer.ts#L66) |
| P0-003 | YAML 反序列化可执行 `!!js/function` Critical | **不准确**：当前 `js-yaml@4` 下 `!!js/function` 不被默认 schema 支持；机理错误 | 代码见 [first-index.ts](/Users/kuang/xiaobu/spec-first/src/core/skill-runtime/first-index.ts#L79)、依赖见 [package.json](/Users/kuang/xiaobu/spec-first/package.json#L68) |
| P0-004 | `analyzeChanges`、`dispatchCommand` 复杂度都>15 | **不准确**：实测 `dispatchCommand=15`，`analyzeChanges=10`；被遗漏的是 `checkFirstUpdateContext=15` | 函数位置见 [dispatcher.ts](/Users/kuang/xiaobu/spec-first/src/core/skill-runtime/dispatcher.ts#L77)、[first-change-detector.ts](/Users/kuang/xiaobu/spec-first/src/core/skill-runtime/first-change-detector.ts#L279) |
| P0-005 | `syncIndex` 未实现 | **准确** | [first-index.ts](/Users/kuang/xiaobu/spec-first/src/core/skill-runtime/first-index.ts#L315) |
| P0-006 | 缺少 GitHub Actions | **准确** | `.github/workflows` 不存在 |
| P0-007 | 缺少 Dependabot/自动安全扫描 | **准确** | `.github/dependabot.yml` 不存在 |
| P0-008 | YAML 注入测试缺失，且 `first-index.test.ts` 缺失 | **部分准确**：安全用例缺失可能成立，但“文件缺失”错误 | 文件存在 [first-index.test.ts](/Users/kuang/xiaobu/spec-first/tests/unit/first-index.test.ts#L1) |
| P0-009 | 模板注入测试缺失，且 `renderer.test.ts` 缺失 | **部分准确**：安全专项用例不足；“文件缺失”错误 | 文件存在 [renderer.test.ts](/Users/kuang/xiaobu/spec-first/tests/unit/renderer.test.ts#L1) |
| P1-001 | `assertSafePath` 允许任意绝对路径，高风险 | **部分准确**：从防御纵深看成立；需结合调用面评估真实风险 | [fs-utils.ts](/Users/kuang/xiaobu/spec-first/src/shared/fs-utils.ts#L8) |
| P1-002 | SHA256 逻辑重复 | **准确** | [first-change-detector.ts](/Users/kuang/xiaobu/spec-first/src/core/skill-runtime/first-change-detector.ts#L197)、[hash-registry.ts](/Users/kuang/xiaobu/spec-first/src/core/template/hash-registry.ts#L45) |
| P1-003 | magic number (`HEAD~10`,`STALE_DAYS`) | **准确** | [first-change-detector.ts](/Users/kuang/xiaobu/spec-first/src/core/skill-runtime/first-change-detector.ts#L300) |
| P1-004 | 模式匹配逻辑重复 | **部分准确**：存在重复趋势，但两处语义并非完全相同，可能是刻意差异 | [change-classifier.ts](/Users/kuang/xiaobu/spec-first/src/core/template/change-classifier.ts#L20)、[hash-registry.ts](/Users/kuang/xiaobu/spec-first/src/core/template/hash-registry.ts#L101) |
| P1-005 | 大 mapping 在函数体 | **不准确**：mapping 在模块顶层常量，不在函数体 | [first-change-detector.ts](/Users/kuang/xiaobu/spec-first/src/core/skill-runtime/first-change-detector.ts#L93) |
| P1-006 | 错误信息泄漏（高） | **部分准确**：存在输出内部细节的可能，但“高”需明确威胁模型 | [router.ts](/Users/kuang/xiaobu/spec-first/src/cli/router.ts#L68)、[renderer.ts](/Users/kuang/xiaobu/spec-first/src/core/template/renderer.ts#L77) |
| P1-007 | 缺少 First 完整集成测试，且 `tests/integration/` 缺失 | **部分准确**：可能缺 first 全链路 E2E；但 `tests/integration` 实际存在 | [skill-integration.test.ts](/Users/kuang/xiaobu/spec-first/tests/integration/skill-integration.test.ts#L1) |
| P1-008 | 错误路径覆盖不足 | **部分准确**：已有部分错误路径测试，仍可能有缺口 | 例：[front-matter.test.ts](/Users/kuang/xiaobu/spec-first/tests/unit/front-matter.test.ts#L102)、[first-change-detector.test.ts](/Users/kuang/xiaobu/spec-first/tests/unit/first-change-detector.test.ts#L319) |
| P1-009 | first-index/first-change-detector 路径遍历测试不完整 | **不准确**：first-index 接口主要操作索引键，不是路径拼接面；该结论威胁模型不成立 | [first-index.ts](/Users/kuang/xiaobu/spec-first/src/core/skill-runtime/first-index.ts#L195) |
| P1-010 | `syncIndex` 不完整（高） | **准确但重复**：与 P0-005 重复计数 | [first-index.ts](/Users/kuang/xiaobu/spec-first/src/core/skill-runtime/first-index.ts#L315) |
| P1-011 | 缺少 pre-commit hooks（因无 husky） | **不准确**：项目有自管 hook 机制，不依赖 husky | [hook-installer.ts](/Users/kuang/xiaobu/spec-first/src/core/tool-integration/hook-installer.ts#L42)、[update.ts](/Users/kuang/xiaobu/spec-first/src/cli/commands/update.ts#L127) |

---

## P2/P3 抽样核验

- **P2-012（性能测试缺失）**: 部分准确。仓库已有基准测试，但并非专测 `first-index/first-change-detector` 大规模场景。见 [performance.bench.ts](/Users/kuang/xiaobu/spec-first/tests/benchmark/performance.bench.ts#L1)。
- **P2-014（缺少健康检查 endpoint）**: 不准确。项目形态以 CLI/流程引擎为主，“endpoint”表述不匹配架构。
- **P3-003（大文件）**: 准确。`layer-merger.ts` 与 `first-change-detector.ts` 行数较高。
- **P3-006（测试依赖实现细节）**: 准确。`modeExplicit` 断言较多，见 [first-args.test.ts](/Users/kuang/xiaobu/spec-first/tests/unit/first-args.test.ts#L22)。

---

## 报告质量问题（元问题）

1. **重复计数**：`syncIndex` 问题同时作为 P0-005 与 P1-010，影响汇总统计可信度。  
2. **事实性错误**：多处“文件缺失”与仓库实际不符。  
3. **威胁模型缺失**：将“本地可信模板/CLI上下文”直接映射为“远程 RCE”，定级偏高。  
4. **方案替代误判**：以“是否 husky”代替“是否有 pre-commit 机制”。

---

## 修正后的优先级建议

### 建议保留为 P0

- CI 缺失（P0-006）
- 自动安全扫描缺失（P0-007）

### 建议降级到 P1/P2

- esbuild 依赖风险（P0-001 -> P1）
- Handlebars 安全加固（P0-002 -> P1）
- YAML 读取 schema + 结构校验（P0-003 -> P1）
- `syncIndex` 未实现（P0-005 -> P1）
- 安全专项测试补齐（P0-008/P0-009 -> P1）

### 建议移除或重写

- P1-005（函数体内大对象）
- P1-009（first-index 路径遍历）
- P1-011（缺少 pre-commit hooks）
- P2-014（健康检查 endpoint）

---

## 下一步建议

1. 先按本审计修订 `05-final-report.md` 的错误条目与统计。  
2. 再生成 `05-final-report.v2.md`，确保每条结论都附“可复核证据 + 威胁模型前提”。  
3. 将“严重度定义”写成固定 rubric（例如：影响面、可利用性、前置条件、可检测性）。

