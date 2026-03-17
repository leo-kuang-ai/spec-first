---
title: First Runtime-First 开发执行任务文档
date: 2026-03-16
author: Codex
status: proposal
version: 1.0
parent: ./2026-03-16-first-runtime-first-global-design.md
---

# First Runtime-First 开发执行任务文档

> 目标：将 `first` 从当前“旧 contract + 部分 runtime-first 实现”的混合状态，落地重构为“单一 canonical runtime-first 系统”，并使 `06_wrap_up -> 07_release -> 08_done` 自动维护完整认知资产体系。

---

## 一、开发目标

本次开发不是局部修文档，而是一次正式的产品契约重构。

最终必须达成以下结果：

1. `first` 采用单一标准模式，不再区分 quick / deep。
2. `.spec-first/runtime/first/` 成为唯一真源，正式 runtime assets 全量注册、全量健康可追踪。
3. `docs/first/*.md` 全部转为 runtime projection，不再允许旁路 Markdown 真源。
4. 基础 canonical docs、正式专题文档、条件型正式文档进入统一 projection contract。
5. `SKILL.md`、references、CLI、health、resume、mapping、governance 使用同一份正式 contract。
6. `06_wrap_up -> 07_release -> 08_done` 能自动刷新新的完整文档体系。

---

## 二、范围与边界

### 2.1 本次范围

本次改造覆盖以下 5 个层面：

1. **Skill 文档层**
   - `skills/spec-first/00-first/SKILL.md`
   - `skills/spec-first/00-first/references/*.md`

2. **Runtime Contract 层**
   - runtime types
   - runtime store
   - bootstrap
   - artifact mapping
   - projection registry

3. **Docs Projection 层**
   - `docs/first/*.md`
   - 正式专题文档
   - 条件型数据库文档

4. **治理与增量更新层**
   - governance
   - health
   - index
   - refresh
   - change detection

5. **下游消费层**
   - context resolver
   - `spec/design/task/code/review/verify/onboarding/orchestrate`

### 2.2 不在本次范围

以下内容不作为本轮首要实施目标：

1. 向下兼容旧 quick / deep 模式。
2. 保留任何 legacy docs 的旁路生成链路。
3. 继续维护 `modules.json` 之类非 contract runtime 文件。
4. 为所有潜在专题文档预留可选扩展能力。

---

## 三、终态 Contract

### 3.1 正式 Runtime Assets

基础正式资产：

1. `summary.json`
2. `role-views.json`
3. `stage-views.json`
4. `steering.json`
5. `conventions.json`
6. `critical-flows.json`
7. `change-map.json`
8. `entry-guide.json`
9. `reboot-guide.json`
10. `api-contracts.json`
11. `structure-overview.json`
12. `domain-model.json`

条件型资产：

13. `database-schema.json`

### 3.2 正式文档全集

基础 canonical docs：

1. `README.md`
2. `summary.md`
3. `role-views.md`
4. `stage-views.md`
5. `steering.md`
6. `conventions.md`
7. `critical-flows.md`
8. `change-map.md`
9. `entry-guide.md`
10. `reboot-guide.md`
11. `common-playbooks.md`
12. `known-risks-and-traps.md`
13. `tech-stack.md`
14. `api-docs.md`
15. `codebase-overview.md`
16. `domain-model.md`

正式专题文档：

17. `architecture.md`
18. `call-graph.md`
19. `external-deps.md`
20. `local-setup.md`
21. `development-guidelines.md`

条件型正式文档：

22. `database-er.md`

### 3.3 生成原则

1. runtime asset 才是真源。
2. 文档全部由 runtime projection 生成。
3. 条件型资产必须有显式状态，不用“文件不存在”表达不适用。
4. 专题文档允许多源派生，但不允许旁路生成。

---

## 四、代码改造清单

### 4.1 Runtime Contract

需要改造的代码文件：

- `src/core/skill-runtime/first-runtime-types.ts`
- `src/core/skill-runtime/first-runtime-store.ts`
- `src/core/skill-runtime/first-bootstrap.ts`

开发任务：

1. 定义 12 个基础 runtime assets 的类型。
2. 定义 `database-schema.json` 的条件型类型与状态字段。
3. 在 runtime store 中注册基础资产和条件型资产集合。
4. 删除或吸收 `modules.json` 逻辑，将其合并进 `structure-overview.json`。
5. 在 bootstrap 中接入：
   - `api-contracts.json`
   - `structure-overview.json`
   - `domain-model.json`
   - `database-schema.json` 的条件生成判断

完成标准：

1. `.spec-first/runtime/first/` 中除 `index.json`、`project-cognition-updates.jsonl` 外不存在未注册文件。
2. `index.json` 能表达基础资产和条件型资产的健康状态。

### 4.2 Projection Contract

需要改造的代码文件：

- `src/core/skill-runtime/first-artifact-mapping.ts`
- `src/core/skill-runtime/first-doc-projection.ts`

开发任务：

1. 扩展 `FIRST_RUNTIME_TO_DOCS_PROJECTION_MAP`，覆盖 22 个正式文档。
2. 定义文档分组常量：
   - 基础 canonical docs
   - 正式专题文档
   - 条件型正式文档
3. 明确定义正式 docs 总集合常量，用于 health、governance、refresh 和审计统一收口。
   - `CANONICAL_PROJECTION_DOCS` 或等价正式总集合
   - `FORMAL_TOPIC_PROJECTION_DOCS`
   - `CONDITIONAL_PROJECTION_DOCS`
4. 为以下文档补 projection renderer：
   - `tech-stack.md`
   - `api-docs.md`
   - `codebase-overview.md`
   - `domain-model.md`
   - `architecture.md`
   - `call-graph.md`
   - `external-deps.md`
   - `local-setup.md`
   - `development-guidelines.md`
   - `database-er.md`
5. 删除 legacy docs 特判逻辑。
6. 删除对不存在文档或旧 deep 文档的无效映射。

完成标准：

1. 所有正式文档都能从 registry 找到 runtime 来源。
2. `refresh-docs-from-runtime` 能刷新基础文档、专题文档和条件型文档。

### 4.3 变更检测与治理

需要改造的代码文件：

- `src/core/skill-runtime/first-governance.ts`
- `src/core/skill-runtime/first-context.ts`
- `src/core/skill-runtime/first-change-detector.ts`
- `src/core/skill-runtime/first-resume.ts`

开发任务：

1. 调整治理模型，使治理以 runtime assets 为中心，而不是 docs 名称为中心。
2. 将 `06_wrap_up -> 07_release -> 08_done` 的刷新范围扩展到新 contract。
3. 为条件型资产增加适用性状态：
   - `healthy`
   - `not_applicable`
   - `degraded`
4. 调整变更检测映射，改为：
   - 文件 -> runtime assets
   - runtime assets -> docs
5. 调整 `first-resume.ts` 与相关提示，删除旧三资产/旧 12 文档口径。

完成标准：

1. 归档收口后能自动更新基础文档、专题文档与条件型文档。
2. 治理日志和 index 能表达条件型状态变化。

### 4.4 CLI / Health / Context Resolver

需要改造的代码文件：

- `src/cli/commands/first.ts`
- `src/core/skill-runtime/context-resolver.ts`
- 相关 health check 代码

开发任务：

1. 更新 CLI help 与对外文案，删除 quick / deep。
2. 更新 health 检查，只围绕正式 runtime registry 与正式 docs registry。
3. 按消费场景注入 runtime slices：
   - `spec/design`
   - `task/plan/orchestrate`
   - `code/review/verify`
   - `onboarding`
4. 对条件型资产增加 optional/fallback 处理语义。

完成标准：

1. CLI 不再承诺旧产物。
2. health check 与 context resolver 对正式 contract 口径一致。

### 4.5 Skill 文档与 References

需要改造的文档：

- `skills/spec-first/00-first/SKILL.md`
- `skills/spec-first/00-first/references/execution-flow.md`
- `skills/spec-first/00-first/references/subagent-architecture.md`
- `skills/spec-first/00-first/references/detection-rules.md`
- `skills/spec-first/00-first/references/platform-document-mapping.md`
- `skills/spec-first/00-first/references/quality-assurance-rules.md`
- `skills/spec-first/00-first/references/testing-strategy.md`
- `skills/spec-first/00-first/references/structure-analysis.md`
- `skills/spec-first/00-first/references/api-and-dependencies.md`
- `skills/spec-first/00-first/references/conventions-and-setup.md`
- `skills/spec-first/00-first/references/domain-model-analysis.md`
- `skills/spec-first/00-first/references/database-conditional-projection.md`
- `skills/spec-first/00-first/references/database-config.md`

开发任务：

1. 删除 quick / deep 双模式表述。
2. 删除旧 Agent 直接生成 Markdown 真源的描述。
3. 改为 runtime-first 口径：
   - 证据抽取
   - schema 固化
   - runtime 写入
   - docs projection
   - health / governance
4. 明确正式专题文档与条件型文档的生成规则。

完成标准：

1. 文档层不再出现 ghost outputs。
2. Skill 描述与代码实现目标 contract 一致。

---

## 五、Docs 层开发任务

### 5.1 基础 Canonical Docs

涉及文档：

- `docs/first/README.md`
- `docs/first/summary.md`
- `docs/first/role-views.md`
- `docs/first/stage-views.md`
- `docs/first/steering.md`
- `docs/first/conventions.md`
- `docs/first/critical-flows.md`
- `docs/first/change-map.md`
- `docs/first/entry-guide.md`
- `docs/first/reboot-guide.md`
- `docs/first/common-playbooks.md`
- `docs/first/known-risks-and-traps.md`
- `docs/first/tech-stack.md`
- `docs/first/api-docs.md`
- `docs/first/codebase-overview.md`
- `docs/first/domain-model.md`

开发任务：

1. 明确每个文档的 runtime 来源。
2. 固定每个文档的章节结构。
3. 删除历史兼容说明、legacy 标签和 quick / deep 提示。
4. 确保所有基础文档都可从 runtime 重建。

### 5.2 正式专题文档

涉及文档：

- `docs/first/architecture.md`
- `docs/first/call-graph.md`
- `docs/first/external-deps.md`
- `docs/first/local-setup.md`
- `docs/first/development-guidelines.md`

开发任务：

1. 为每个专题文档建立最低内容 contract。
2. 按运行时字段实现章节映射。
3. 支持字段缺失时的局部降级。
4. 明确默认生成与条件生成：
   - 默认生成：`architecture.md`、`external-deps.md`、`local-setup.md`、`development-guidelines.md`
   - 条件生成：`call-graph.md`

### 5.3 条件型正式文档

涉及文档：

- `docs/first/database-er.md`

开发任务：

1. 建立 `database-schema.json` -> `database-er.md` 投影链。
2. 检测数据库 schema 是否存在且是否具备足够认知价值。
3. 明确不适用项目的状态表达，而不是输出低质量文档。

---

## 六、推荐开发顺序

按以下顺序执行，避免返工：

1. **Batch 1：总契约收口**
2. **Batch 2：基础流程与规则收口**
3. **Batch 3：专题能力规范收口**
4. **代码层 Runtime Contract 改造**
5. **代码层 Projection Contract 改造**
6. **治理、health、resume、context-resolver 改造**
7. **Batch 4：第一批基础 canonical docs**
8. **Batch 5：剩余基础 canonical docs**
9. **Batch 6：正式专题文档**
10. **Batch 7：条件型数据库文档**
11. **端到端验证与归档收口链复测**

说明：

1. 文档层改造必须在对应 runtime/projection contract 就绪后进行。
2. 正式专题文档接入不得早于专题能力规范收口。
3. 条件型数据库文档必须晚于条件型状态语义落地。

---

## 七、分批执行任务

### Phase A：Contract 与规则收口

目标：

- 先让“系统说法”和“目标实现”一致。

任务：

1. 完成 Batch 1。
2. 完成 Batch 2。
3. 完成 Batch 3。

阶段验收：

1. 文档口径已删除 quick / deep。
2. 文档口径已删除 Agent 直出 Markdown 真源。
3. 正式 runtime assets、正式文档全集、条件型状态都已有统一文档定义。

### Phase B：代码 Contract 落地

目标：

- 让 runtime、projection、governance 真正支持新 contract。

任务：

1. 输出新的正式 registry 常量和类型定义。
2. Runtime types/store/bootstrap 改造。
3. projection registry 与 renderer 改造。
4. change detector / governance / health / resume / context resolver 改造。

阶段验收：

1. 所有正式 runtime 文件可注册、可索引、可健康检查。
2. 所有正式文档都能被 projection registry 识别。
3. 07/08 自动治理能覆盖基础、专题、条件型文档。

### Phase C：Docs 全量收口

目标：

- 让人类阅读层与 runtime truth 完整对齐。

任务：

1. 完成 Batch 4。
2. 完成 Batch 5。
3. 完成 Batch 6。
4. 完成 Batch 7。

阶段验收：

1. 所有正式文档都有明确 runtime 来源。
2. 不存在 legacy docs 语义和旁路生成语义。
3. 默认生成与条件生成边界清晰。

### Phase D：端到端验证

目标：

- 验证系统不是“文档看起来对”，而是真的可运行、可刷新、可消费。

任务：

1. 运行 bootstrap。
2. 运行 refresh-docs-from-runtime。
3. 运行 health check。
4. 验证 context resolver 注入。
5. 模拟 `06_wrap_up -> 07_release -> 08_done`。
6. 检查治理日志、index 状态和条件型状态。

阶段验收：

1. bootstrap -> index -> projection -> health -> governance 全链路通过。
2. 新手接手老项目迭代的产品级验收标准可达成。

---

## 八、测试与验收

### 8.1 必须新增或改造的测试

1. runtime registry 测试
2. projection registry 测试
3. no orphan runtime files 测试
4. no unprojected docs 测试
5. no ghost outputs 测试
6. consumption gate 测试
7. roundtrip gate 测试
8. 条件型资产状态测试
9. wrap_up / done 自动刷新测试

### 8.2 验收标准

#### 系统级验收

1. 正式 runtime assets 与正式文档全集在代码和文档中完全一致。
2. 所有正式文档均可从 runtime 重建。
3. 治理链、health、context resolver 全部依赖同一 contract。

#### 产品级验收

针对“新手接手老项目，在旧需求上迭代”的核心场景，至少满足：

1. 能在 30 分钟内定位旧需求实现入口。
2. 能识别主要影响面和高风险链路。
3. 能找到最小验证清单与回归关注点。
4. 能明确当前项目的技术边界、开发规范和本地进入路径。

---

## 九、风险与回滚

### 9.1 主要风险

1. registry 先改、projection 未跟上，导致 health 全量失败。
2. 专题文档先接入、runtime 字段未准备好，导致输出空文档。
3. 条件型数据库能力状态语义不清，导致治理误判。
4. docs 已改、context resolver 未改，导致下游 skill 消费缺口。

### 9.2 风险控制

1. 必须按批次和阶段执行，不跨阶段跳改。
2. 每一层 contract 改完后先补测试再继续。
3. 专题文档按最低内容 contract 验收，不允许“空投影也算完成”。
4. 条件型资产必须在 health 和 governance 中显式表达状态。

### 9.3 回滚原则

1. 不做旧 quick / deep 兼容回滚。
2. 若某批次造成系统不可用，应回滚到上一个“contract + tests 一致通过”的提交点。
3. 回滚时优先回滚代码 contract，不保留半成品文档层改造。

---

## 十、交付物

本次开发完成后，应至少交付：

1. 新版 `SKILL.md`
2. 新版 `references/*.md`
3. 新版 runtime registry 与 projection registry 代码
4. 新版 `docs/first` 基础文档
5. 新版正式专题文档
6. 条件型 `database-er.md` 能力
7. 新版 governance / health / context resolver
8. 全量测试与验收记录

---

## 十一、结论

本次开发的本质不是“继续补几个 first 文档”，而是：

> **重构 first 的正式输入层，让项目认知从不稳定的文档集合，升级为可生成、可校验、可治理、可消费的 runtime-first 认知系统。**

对工程实施来说，最关键的执行原则只有三条：

1. 先收口 contract，再改代码。
2. 先落 runtime truth，再投影 docs。
3. 先打通治理链，再宣称体系完成。
