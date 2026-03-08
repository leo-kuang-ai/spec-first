# 2026-03-08 first-skill 最佳实践重构设计

## 1. 这份文档的结论

结合全流程方案回看，当前 `first-skill` 方案还需要再收紧一层。

最终建议是：

> **`00-first` 只做统一背景底座的 producer，不再承担任何下游阶段的消费规则设计。**

这不是弱化 `00-first`，而是让它回到最有价值的位置：

- 统一生产项目背景真源
- 统一生产角色视图
- 统一生产阶段视图
- 统一提供读取接口
- 统一维护人类可读投影视图

其中最关键的新增结论是：

> **`stage-views.json` 必须升格为 `00-first` 的正式主产物，但 `docs/first/` 不应被删除，而应保留为长期维护的人类可读投影视图层。**

---

## 2. 为什么还要继续改进

虽然当前 `2026-03-08` 文档已经把方向拉正，但从仓库真实实现出发，仍有三个问题需要进一步说透。

### 2.1 producer 与 consumer 边界还需要更硬

`first-skill` 文档不能再混入这些内容：

- `03-spec` 怎么读取 `spec-view`
- `04-design` 何时把 `design-view` 升为门槛
- `07-code` 如何把 `code-view` 注入实现上下文
- `12-verify` 如何提升验证背景门槛
- `14-status / 15-doctor / 21-analyze` 如何治理背景状态

这些都属于 consumer 侧方案，应统一放在 `skill-全流程/`。

### 2.2 需要面对当前仓库的真实起点

当前仓库里，`00-first` 还没有进入新 runtime 架构：

- 展示产物在 `docs/first/*.md`
- 运行时索引仍是 `docs/first/.index.yaml`
- 已有代码集中在 `src/core/skill-runtime/first-index.ts`
- `src/core/skill-runtime/first-resume.ts`、`src/core/skill-runtime/first-artifact-mapping.ts` 仍围绕旧模式工作
- 新 runtime 文件 `first-summary.ts`、`first-role-views.ts`、`first-stage-views.ts`、`first-context.ts` 还不存在

所以真正的最佳实践，不是写一套“理想中的未来结构”，而是明确：

> **要在当前仓库上把 `00-first` 从“文档生成器”演进为“可长期增量维护的背景底座生产者”。**

### 2.3 不是“文档目录回退”，而是“人机分层”

此前把“新主路径统一迁移到 `.spec-first/runtime/first/`”说得过于绝对，容易引出一个真实问题：

- 如果真源全部迁走，`docs/first/` 怎么长期维护？
- 如果每次都全量重生成 runtime，维护成本会不会更高？

这里正确的答案不是把真源放回 `docs/first/`，而是采用更稳的 **方案 C**：

> **结构化真源放 `.spec-first/runtime/first/`，人类可读文档保留在 `docs/first/`，`00-first` 默认做增量更新，而不是每次全量重生成。**

这意味着：

- `docs/first/*.md` 继续长期存在
- 下游节点不再把 `docs/first/*.md` 当作主链真源
- `.spec-first/runtime/first/` 承担机器真源职责
- `docs/first/` 承担展示与沟通职责
- `00-first` 负责两层之间的派生与同步

---

## 3. 新的 producer-only 边界

### 3.1 `00-first` 必须负责

`00-first` 负责以下四类输出。

#### A. 展示层输出

保留：

- `docs/first/README.md`
- `docs/first/*.md`

职责：

- 给人看
- 做项目认知展示
- 作为长期维护的人类可读投影视图层
- 不作为主链阶段的机器真源

#### B. runtime 真源索引输出

目标路径：

- `.spec-first/runtime/first/index.json`

职责：

- 记录运行模式、产物状态、健康信息、时间戳
- 记录哪些 runtime 分片需要刷新
- 作为增量维护的核心索引
- 不承担业务语义总结

#### C. runtime 语义输出

目标路径：

- `.spec-first/runtime/first/summary/`
- `.spec-first/runtime/first/role-views/`
- `.spec-first/runtime/first/stage-views/`

建议首期可以先以单文件实现，后续演进为分片目录：

- `.spec-first/runtime/first/summary.json`
- `.spec-first/runtime/first/role-views.json`
- `.spec-first/runtime/first/stage-views.json`

职责：

- `summary`：项目背景真源
- `role-views`：角色裁剪视图
- `stage-views`：阶段消费主入口

#### D. runtime 读取与投影刷新接口

目标代码：

- `src/core/skill-runtime/first-runtime-store.ts`
- `src/core/skill-runtime/first-context.ts`
- 后续可补 `src/core/skill-runtime/first-doc-projection.ts`

职责：

- 暴露 `loadFirstContext(projectRoot)`
- 暴露 `loadStageView(projectRoot, stage)`
- 暴露 `loadFirstRoleView(projectRoot, role)`
- 提供从 runtime 到 `docs/first/` 的投影刷新能力

### 3.2 `00-first` 明确不负责

- 不直接改 `03-spec` 的消费规则
- 不直接改 `04-design` 的门槛规则
- 不直接改 `07-code` 的实现规则
- 不直接改 `12-verify` 的验收门槛
- 不直接改 `14-status / 15-doctor / 21-analyze` 的治理口径
- 不把 `00-onboarding / 01-init / 13-orchestrate` 的流程消费逻辑塞回自身文档

---

## 4. 当前仓库下的精确文件策略

### 4.1 需要新建的文件

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

### 4.2 需要修改的既有文件

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

### 4.3 必须同时切换的主链入口

这里需要额外强调一个经常被漏掉的问题：

> **只切 runtime 底层、不切入口层，会形成半切换状态。**

典型风险点包括：

- `src/core/skill-runtime/dispatcher.ts` 仍用 `join(projectRoot, 'docs', 'first')` 构建 runtime notice
- `src/core/skill-runtime/first-change-detector.ts` 仍把 `docs/first` 当默认产物目录
- `src/cli/commands/init.ts` 仍把 `docs/first/.index.yaml` 当 readiness 真相
- `skills/spec-first/01-init/SKILL.md` 仍把旧索引和 quick 文档当强制前置
- `src/core/skill-runtime/first-index.ts` 的 `syncIndex` 仍围绕 `docs/first` 扫描心智

因此，producer 切换的硬约束应该再加一条：

> **任何主链运行时入口、恢复入口、readiness 判定、prompt notice 注入逻辑，都不得再直接把 `docs/first` 当作真源。**

也就是说：

- `docs/first/` 可以继续长期存在
- 但它只能作为投影视图层被刷新和展示
- 不能继续作为 dispatcher / resume / init readiness / change detector 的主真相来源

### 4.3 `docs/first/.index.yaml` 的新定位

- `docs/first/.index.yaml` 可以保留为历史兼容产物或展示层辅助索引
- 但它不再是下游阶段消费的正式真源索引
- 下游真源索引只认 `.spec-first/runtime/first/index.json`

也就是说，退出主链职责的不是整个 `docs/first/`，而只是：

> **`docs/first/.index.yaml` 作为 runtime 真索引的角色。**

---

## 5. 为什么方案 C 才适合长期维护

如果把所有东西都放回 `docs/first/`，会出现四个问题：

1. 人工改文档会污染机器真源
2. 下游会重新回到解析 Markdown 的旧模式
3. 展示模板变化会影响机器消费稳定性
4. 无法做好增量失效与局部更新

如果把所有东西都只放在 `.spec-first/runtime/first/`，也会有两个问题：

1. 人类阅读体验差
2. 沟通、审阅、沉淀不方便

因此更稳的结构只能是 **方案 C**：

- `docs/first/` = 人类可读层
- `.spec-first/runtime/first/` = 机器真源层
- `00-first` = 增量同步器

这套设计的本质不是“迁走 docs”，而是：

> **把真源和展示分开，把全量生成改成增量维护。**

---

## 6. 推荐的长期产物模型

首期可以采用单文件四件套，但从长期维护角度，建议演进为目录化分片。

### 6.1 真源层

```text
.spec-first/runtime/first/
├── index.json
├── summary/
│   ├── project-profile.json
│   ├── modules.json
│   ├── capabilities.json
│   ├── api-surface.json
│   └── data-model.json
├── role-views/
│   ├── product.json
│   ├── dev.json
│   └── qa.json
└── stage-views/
    ├── spec.json
    ├── design.json
    ├── code.json
    └── verify.json
```

### 6.2 展示层

```text
docs/first/
├── README.md
├── codebase-overview.md
├── architecture.md
├── api-docs.md
├── domain-model.md
└── development-guidelines.md
```

### 6.3 这样拆的意义

- `summary` 适合表达背景真源
- `stage-views` 适合表达阶段消费视图
- `docs/first` 适合表达人类可读叙事
- 分片结构有利于局部刷新，而不是整套重写

---

## 7. 增量维护而不是全量重生成

这部分是这次修正的核心。

### 7.1 默认流程

`00-first` 默认应采用以下流程：

1. 读取 `.spec-first/runtime/first/index.json`
2. 基于 `src/core/skill-runtime/first-change-detector.ts` 判断哪些源文件发生变化
3. 将变更映射到受影响的 summary 分片
4. 只重建受影响的 `role-views` 与 `stage-views`
5. 按需刷新对应的 `docs/first/*.md`
6. 更新 `index.json` 中的 hash、时间与健康状态

### 7.2 三类刷新模式

建议长期支持三类模式：

#### A. `refresh-runtime-only`

- 只更新 `.spec-first/runtime/first/`
- 适合下游流程消费优先场景

#### B. `refresh-docs-from-runtime`

- 不重建真源
- 仅从 runtime 刷新 `docs/first/`
- 适合模板改版、展示优化场景

#### C. `refresh-all`

- 全量重建 runtime 与 docs
- 仅在 schema 大改、资产失真或首次建立时使用

### 7.3 为什么这才可持续

如果每次都全量重跑：

- 成本高
- 漂移难定位
- 文档容易被覆盖
- 使用者会天然回避运行 `first`

如果采用增量维护：

- 更新成本更低
- 变更责任更清晰
- `docs/first/` 可以长期稳定存在
- 下游节点也能持续依赖 runtime 真源

---

## 8. 与全流程方案的正确接口

`first-skill` 只交付能力，不定义消费规则。

### 8.1 producer 交付物

- `summary` 真源
- `role-views` 真源
- `stage-views` 真源
- `docs/first` 投影视图
- `first runtime` 统一读取 API
- `first docs` 投影刷新能力

### 8.2 consumer 读取方

由 `skill-全流程` 负责定义：

- `00-onboarding` 如何读取 `role-views`
- `01-init` 如何识别背景输入状态
- `03-spec` 如何读取 `spec-view`
- `04-design` 如何读取 `design-view`
- `07-code` 如何读取 `code-view`
- `12-verify` 如何读取 `verify-view`
- `13-orchestrate` 如何编排依赖强度
- `14-status / 15-doctor / 21-analyze` 如何治理背景状态

这就是 producer / consumer 的硬边界。

---

## 9. 完成定义

只有当下面这些条件全部满足，`first-skill` 的新方案才算真正完成：

1. `.spec-first/runtime/first/index.json` 已成为下游主链消费的真索引
2. `summary`、`role-views`、`stage-views` 已成为结构化真源
3. `docs/first/*.md` 已保留为长期维护的人类可读投影视图
4. `00-first` 默认支持增量更新，而不是只支持全量重生成
5. `loadStageView(projectRoot, stage)` 已可直接读取单阶段视图
6. `first-skill` 文档没有再越界定义 consumer 规则

---

## 10. 一句话总结

当前 `first-skill` 方案确实需要改进。

但正确的改进方向不是把真源放回 `docs/first/`，也不是把 `docs/first/` 整体废掉，而是采用方案 C：

> **把 `00-first` 收敛成结构化真源维护器，把 `.spec-first/runtime/first/` 作为机器真源层，把 `docs/first/` 作为长期维护的人类可读投影视图层，并默认采用增量更新。**
