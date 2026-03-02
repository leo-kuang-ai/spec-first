# Spec-First 项目代码审查：最终合并报告（v2）

**报告日期**: 2026-03-02  
**项目**: Spec-First 全链路研发闭环  
**聚焦范围**: First Skill 实现  
**修订依据**: `.full-review/05-final-report-accuracy-audit.md`

---

## 执行摘要

本 v2 报告是在准确性审计后形成的修订版。  
相较 v1，本版主要修正：

- 移除事实性错误（如将已存在文件误判为缺失）；
- 合并重复问题；
- 下调缺少利用前提支撑的过高严重级别；
- 仅保留高置信、可由代码直接复核的结论。

**总体评级：B+（不变）**  
原因：工程基础较扎实，发布流程已在 DevOps 平台承接；当前主要改进点集中在代码安全加固与实现完整性。

---

## 按优先级的发现（修订后）

### P1 — 高优先级（当前最高优先级）

#### P1-001：开发依赖链存在 esbuild 0.21.5

**严重级别**: High  
**类别**: Security / Dependency Management  
**证据**:
- `pnpm why esbuild` 显示 `vite 5.4.21 -> esbuild 0.21.5`；
- `package.json` 未设置 `esbuild` override。

**说明**:
- 风险结论成立，但当前主要位于开发工具链路径（非直接生产运行路径）。

**建议修复**:
- 增加显式 override，并校验 lockfile 与测试结果。

---

#### P1-002：模板渲染缺少额外安全约束

**严重级别**: High  
**类别**: Security / Template Execution  
**证据**:
- `src/core/template/renderer.ts` 直接 `Handlebars.compile(source)`，缺少额外安全护栏。

**说明**:
- 加固缺口真实存在；
- 但 v1 中“远程 RCE”表述缺少与当前信任边界匹配的威胁模型支撑。

**建议修复**:
- 明确模板来源信任边界；
- 增加模板构造 denylist/allowlist 校验；
- 增补针对恶意模板模式的安全测试。

---

#### P1-003：`syncIndex()` 作为导出函数仍未完整实现

**严重级别**: High  
**类别**: Code Quality / Completeness  
**证据**:
- `src/core/skill-runtime/first-index.ts:315` 为 TODO 形态，未实现“同步索引”语义。

**影响**:
- 可能误导调用方对 API 语义的预期；
- 存在后续维护与一致性风险。

**建议修复**:
- 要么完整实现；要么明确标记弃用并给出替代接口契约。

---

#### P1-004：安全测试覆盖存在缺口（YAML + 模板加固场景）

**严重级别**: High  
**类别**: Testing / Security  
**证据**:
- 测试文件已存在（`tests/unit/first-index.test.ts`、`tests/unit/renderer.test.ts`）；
- 但针对恶意输入的专项测试仍不充分。

**影响**:
- 安全加固回归可能在后续变更中漏检。

**建议修复**:
- 增加恶意 YAML 负载与模板滥用场景测试，并与当前解析器/运行时真实行为对齐。

---

### P2 — 中优先级（纳入迭代计划）

#### P2-001：共享 FS 工具的路径安全策略偏宽

**严重级别**: Medium  
**类别**: Security / Boundary Control  
**证据**:
- `src/shared/fs-utils.ts` 拒绝相对路径，但允许任意绝对路径。

**说明**:
- 在当前调用图中不等于“立即可利用”；
- 但对未来调用点是典型纵深防御缺口。

**建议修复**:
- 在敏感调用场景增加可配置 allowed-root 策略。

---

#### P2-002：存在高复杂度热点函数

**严重级别**: Medium  
**类别**: Code Quality / Maintainability  
**证据**:
- `dispatchCommand` 为复杂度热点；
- `checkFirstUpdateContext` 为复杂度热点。

**说明**:
- v1 中“`analyzeChanges > 15`”为不准确信息，本版已修正。

**建议修复**:
- 抽取分支决策为更小职责函数；
- 用回归测试确保行为不变。

---

#### P2-003：索引写入非原子，存在并发丢更新风险

**严重级别**: Medium  
**类别**: Data Integrity / Concurrency  
**证据**:
- `writeIndex` 当前为直接 `writeFileSync` 覆盖写。

**建议修复**:
- 采用临时文件 + 原子 rename；
- 若预期多进程并发，补充锁策略。

---

#### P2-004：SHA256 辅助逻辑重复

**严重级别**: Medium  
**类别**: Code Quality / DRY  
**证据**:
- first runtime 与模板注册表模块均实现了重复 hash helper。

**建议修复**:
- 提取共享 `crypto` 工具函数。

---

#### P2-005：跨模块分类规则存在漂移风险

**严重级别**: Medium  
**类别**: Code Quality / Consistency  
**证据**:
- 分类逻辑分散在多个模块，规则部分重叠但不完全一致。

**建议修复**:
- 统一规则来源，或明确文档化“有意差异”。

---

#### P2-006：大体量静态映射维护成本高

**严重级别**: Medium  
**类别**: Maintainability  
**证据**:
- `first-change-detector` 中存在较大文件到产物映射表。

**建议修复**:
- 外置到独立映射模块，并增加一致性测试。

---

#### P2-007：错误处理与观测策略尚未统一

**严重级别**: Medium  
**类别**: Error Handling / Observability  
**证据**:
- 各模块错误处理风格不一致。

**建议修复**:
- 定义统一错误策略并逐步落地。

---

### P3 — Backlog

#### P3-001：大文件影响可导航性

**证据**:
- `src/core/process-engine/layer-merger.ts` 约 547 行；
- `src/core/skill-runtime/first-change-detector.ts` 约 646 行。

---

#### P3-002：部分测试耦合内部字段（`modeExplicit`）

**证据**:
- `tests/unit/first-args.test.ts` 中存在较多内部结构断言。

---

#### P3-003：测试基础设施可选整合

**证据**:
- 多个测试文件存在重复 setup 样板代码。

---

## 与 v1 相比移除/重写项

以下 v1 条目因事实不符、重复计数或表述偏差而移除/重写：

1. “缺失 `tests/integration/`”（目录实际存在）；
2. “缺失 `renderer.test.ts` / `first-index.test.ts`”（文件实际存在）；
3. “大映射对象位于函数体内”（实际为模块级常量）；
4. “因无 husky 即缺失 pre-commit hooks”（项目已实现自管 hook 机制）；
5. `syncIndex` 问题多优先级重复计数（本版已合并）；
6. YAML `!!js/function` 作为 Critical 可执行链路的表述（本版改为 schema/校验加固视角）。
7. 两个 CI/CD 平台项（原 P0）已按项目现状移除：研发流程已接入外部 DevOps 发布平台，不在仓库内工作流范围。

---

## 修正后的分类汇总

| 类别 | P0 | P1 | P2 | P3 |
|---|---:|---:|---:|---:|
| CI/CD & DevOps | 0 | 0 | 0 | 0 |
| Security | 0 | 2 | 1 | 0 |
| Code Quality | 0 | 1 | 5 | 2 |
| Testing | 0 | 1 | 0 | 1 |
| Data Integrity | 0 | 0 | 1 | 0 |

---

## 建议执行计划

### 近期（P1）

1. 修复/覆盖 `esbuild` 风险依赖链。
2. 完成模板运行时安全加固并补齐安全测试。
3. 处理 `syncIndex` 契约（实现或弃用）。

### 后续迭代（P2）

1. 对敏感 FS 调用点收紧路径策略。
2. 重构复杂度热点函数。
3. 落地索引原子写支持。
4. 完成 DRY/一致性改造（hash + classifier + mapping）。

---

## 最终建议

先完成 **P1**（安全加固 + 契约完整性），再按迭代推进 **P2/P3**。

---

**报告版本**: 2.0.0  
**替代关系**: 当与 v1 冲突时，以 `.full-review/05-final-report.v2.md` 为准。
