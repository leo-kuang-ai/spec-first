# 2026-03-08 first-skill 一次切换实施清单

## 1. 实施原则

这份清单只处理 producer 侧，不处理 consumer 接入。

换句话说，本轮目标不是：

- 同时改 `03-spec / 04-design / 07-code / 12-verify`
- 同时改 `00-onboarding / 01-init / 13-orchestrate`
- 同时改 `14-status / 15-doctor / 21-analyze`

本轮只做一件事：

> **让 `00-first` 在当前仓库中建立“runtime 真源层 + docs 投影视图层 + 增量维护机制”的 producer 架构。**

并且本轮明确：

- 不考虑让下游继续直读 `docs/first/*.md`
- 不再让 `docs/first/.index.yaml` 承担 runtime 真索引职责
- 保留 `docs/first/`，但把它收口为长期维护的人类可读投影视图层
- 默认目标不是“每次全量重生成”，而是“可增量维护”

---

## 2. 切换后的目标态

### 2.1 人类可读投影视图层

保留：

```text
docs/first/
├── README.md
└── *.md
```

职责：

- 人工阅读
- 项目认知展示
- 评审、沟通与知识沉淀
- 不再作为下游流程的主输入真源

### 2.2 runtime 真源层

正式运行态维护在：

```text
.spec-first/runtime/first/
├── index.json
├── summary.json
├── role-views.json
└── stage-views.json
```

长期建议可再演进为：

```text
.spec-first/runtime/first/
├── index.json
├── summary/
├── role-views/
└── stage-views/
```

职责：

- `index.json`：运行状态与健康信息
- `summary`：统一背景真源
- `role-views`：角色视图
- `stage-views`：阶段视图集合

### 2.3 读取与投影接口层

新增统一 API：

- `loadFirstContext(projectRoot)`
- `loadStageView(projectRoot, stage)`
- `loadFirstRoleView(projectRoot, role)`

建议补投影接口：

- `refreshFirstDocsFromRuntime(projectRoot)`

---

## 3. 当前仓库下的精确改动面

### 3.1 必须新增

- `src/core/skill-runtime/first-runtime-types.ts`
- `src/core/skill-runtime/first-runtime-store.ts`
- `src/core/skill-runtime/first-summary.ts`
- `src/core/skill-runtime/first-role-views.ts`
- `src/core/skill-runtime/first-stage-views.ts`
- `src/core/skill-runtime/first-context.ts`
- 后续可新增 `src/core/skill-runtime/first-doc-projection.ts`
- `tests/unit/first-runtime-types.test.ts`
- `tests/unit/first-runtime-store.test.ts`
- `tests/unit/first-summary.test.ts`
- `tests/unit/first-role-views.test.ts`
- `tests/unit/first-stage-views.test.ts`
- `tests/unit/first-context.test.ts`
- `tests/unit/first-context-stage-views.test.ts`

### 3.2 必须修改

- `src/core/skill-runtime/first-index.ts`
- `src/core/skill-runtime/first-resume.ts`
- `src/core/skill-runtime/first-artifact-mapping.ts`
- `src/core/skill-runtime/first-change-detector.ts`
- `src/core/skill-runtime/dispatcher.ts`
- `src/cli/commands/init.ts`
- `skills/spec-first/00-first/SKILL.md`
- `skills/spec-first/00-first/references/testing-strategy.md`
- `skills/spec-first/01-init/SKILL.md`
- `skills/spec-first/01-init/references/prerequisites.md`
- `skills/spec-first/01-init/references/output-format.md`
- `docs/first/README.md`
- `tests/unit/first-index.test.ts`
- `tests/unit/first-resume.test.ts`
- `tests/unit/first-artifact-mapping.test.ts`
- `tests/unit/first-change-detector.test.ts`
- `tests/unit/init.test.ts`
- `tests/unit/first-skill-docs.test.ts`
- 后续可新增 `tests/unit/dispatcher-first-runtime.test.ts`

### 3.3 明确退出主职责

退出主职责的是：

- `docs/first/.index.yaml` 作为 runtime 真索引的角色
- `docs/first/*.md` 作为下游主链机器输入的角色

但以下内容不会退出：

- `docs/first/` 作为人类可读投影视图层

---

## 4. P0 / P1 / P2 清单

## P0：建立 runtime 真源层与可增量维护基础

P0 是阻断项，不完成就不要做下游接入。

### P0-1 定义 runtime 类型

- 新建 `src/core/skill-runtime/first-runtime-types.ts`
- 定义 `FirstRuntimeIndex`
- 定义 `FirstRuntimeSummary`
- 定义 `FirstRoleViews`
- 定义 `FirstStageViews`
- 定义 `FirstSpecView / FirstDesignView / FirstCodeView / FirstVerifyView`
- 新建 `tests/unit/first-runtime-types.test.ts`

### P0-2 建立 runtime store

- 新建 `src/core/skill-runtime/first-runtime-store.ts`
- 固化 `.spec-first/runtime/first/` 路径
- 支持 `index / summary / role-views / stage-views` 读写
- 新建 `tests/unit/first-runtime-store.test.ts`

### P0-3 建立 summary / role / stage 生成链路

- 新建 `src/core/skill-runtime/first-summary.ts`
- 新建 `src/core/skill-runtime/first-role-views.ts`
- 新建 `src/core/skill-runtime/first-stage-views.ts`
- 打通 `summary -> role-views`
- 打通 `summary -> stage-views`
- 新建 `tests/unit/first-summary.test.ts`
- 新建 `tests/unit/first-role-views.test.ts`
- 新建 `tests/unit/first-stage-views.test.ts`

### P0-4 建立统一读取入口

- 新建 `src/core/skill-runtime/first-context.ts`
- 提供 `loadFirstContext(projectRoot)`
- 提供 `loadStageView(projectRoot, stage)`
- 提供 `loadFirstRoleView(projectRoot, role)`
- 新建 `tests/unit/first-context.test.ts`
- 新建 `tests/unit/first-context-stage-views.test.ts`

### P0-5 建立 docs 投影视图刷新能力

- 新增或预留 `src/core/skill-runtime/first-doc-projection.ts`
- 明确 runtime -> `docs/first/*.md` 的投影刷新规则
- `docs/first/` 不再直接作为真源，而作为派生层存在

### P0-6 收口主链入口到 runtime 真源

- 修改 `src/core/skill-runtime/dispatcher.ts`
- 修改 `src/core/skill-runtime/first-change-detector.ts`
- 修改 `src/cli/commands/init.ts`
- 修改 `skills/spec-first/01-init/SKILL.md`
- 修改 `skills/spec-first/01-init/references/prerequisites.md`
- 修改 `skills/spec-first/01-init/references/output-format.md`
- 禁止 runtime notice、resume、readiness、change detection 继续直连 `docs/first`
- 统一改为从 `.spec-first/runtime/first/index.json` 与 runtime 真源层取真相

### P0-7 替换旧 runtime 索引主路径

- 修改 `src/core/skill-runtime/first-index.ts`
- 修改 `src/core/skill-runtime/first-resume.ts`
- 把主索引从 `docs/first/.index.yaml` 切到 `.spec-first/runtime/first/index.json`
- 修改相关单测

### P0-8 更新 `00-first` 文档真相

- 修改 `skills/spec-first/00-first/SKILL.md`
- 修改 `skills/spec-first/00-first/references/testing-strategy.md`
- 修改 `docs/first/README.md`
- 明确 `docs/first/*.md` 为投影视图层
- 明确 runtime 真源层为正式产物
- 修改 `tests/unit/first-skill-docs.test.ts`

## P1：补齐增量维护能力

### P1-1 对齐变更检测与分片刷新

- 修改 `src/core/skill-runtime/first-change-detector.ts`
- 修改 `src/core/skill-runtime/first-artifact-mapping.ts`
- 建立“源文件 -> summary/stage-view/docs 投影”映射关系
- 修改对应单测

### P1-2 支持三类刷新模式

建议支持：

- `refresh-runtime-only`
- `refresh-docs-from-runtime`
- `refresh-all`

目标：

- 真源刷新与文档刷新可分离
- 避免每次都全量重生成

### P1-3 对齐 resume / stale / health 语义

- 确保 `first-resume.ts`、`first-index.ts` 只基于 runtime 真源判断健康
- stale / healthy / issues 统一落到 `index.json`
- `docs/first/` 的刷新状态也可被索引感知

## P2：做清理与治理准备

### P2-1 清理旧心智

- producer 文档不再提“下游直读 `docs/first/*.md`”
- producer 文档不再把 `.index.yaml` 当作主索引
- producer 文档不再默认每次全量重生成

### P2-2 输出可供全流程消费的稳定契约

- 固化 `stage-views` 顶层 schema
- 固化 `background_input_status` 的来源字段
- 固化 docs 投影视图的刷新规则

### P2-3 保持 producer 文档边界

- `first-skill/` 只讲生产与投影
- downstream 接入一律转到 `skill-全流程/`

---

## 5. 明确不做

以下内容不在本次 `first-skill` 范围内：

- `skills/spec-first/00-onboarding/SKILL.md` 接入 `role-views`
- `skills/spec-first/01-init/SKILL.md` 接入完整的背景状态/降级编排
- `skills/spec-first/03-spec/SKILL.md` 接入 `spec-view`
- `skills/spec-first/04-design/SKILL.md` 接入 `design-view`
- `skills/spec-first/07-code/SKILL.md` 接入 `code-view`
- `skills/spec-first/12-verify/SKILL.md` 接入 `verify-view`
- `skills/spec-first/13-orchestrate/SKILL.md` 接入依赖强度调度
- `skills/spec-first/14-status/SKILL.md` 接入背景状态展示
- `skills/spec-first/15-doctor/SKILL.md` 接入背景诊断
- `skills/spec-first/21-analyze/SKILL.md` 接入背景质量分析

但需要注意：`01-init` 的 **truth-source 切换** 仍属于本次 producer 切换范围；不在本次范围内的只是它后续完整的背景消费与降级编排。

这些其余 consumer 行为全部由 `skill-全流程` 文档承接。

---

## 6. 完成定义

只有满足以下条件，producer 新架构才算完成：

1. `.spec-first/runtime/first/index.json` 已成为下游主链消费的真索引
2. `.spec-first/runtime/first/summary` 已成为背景真源
3. `.spec-first/runtime/first/role-views` 已稳定生成
4. `.spec-first/runtime/first/stage-views` 已稳定生成
5. `docs/first/*.md` 已保留为长期维护的人类可读投影视图
6. `loadStageView(projectRoot, stage)` 已可用
7. `00-first` 默认支持增量更新，而不是只支持全量重生成
8. `first-skill` 文档没有再越界写 consumer 规则

一句话：

> `first-skill` 的完成标志不是“全链路都接好了”，而是“producer 已经完成真源 / 投影分层，并能稳定增量维护 runtime 资产与 docs 投影视图”。
