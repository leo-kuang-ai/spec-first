# spec-first 团队协作规范

> Lifecycle: historical-input / external-reference. 本文保留旧架构、方案、迁移或研究记录；当前 source of truth 以 `docs/README.md`、根目录 README、`docs/05-用户手册/`、`docs/contracts/`、`skills/`、`src/cli/` 和 `CHANGELOG.md` 为准。

日期：2026-04-16  
适用范围：

1. `spec-first` 框架仓库自身
2. 使用 `spec-first` / `spec-graph-bootstrap` 的目标代码仓库

文档目标：

1. 明确哪些资产适合团队协作、进入 Git、参与合并
2. 明确哪些资产属于运行时控制面，只能本地或 CI 重建
3. 明确多人协作下的增量更新、提交、合并、冲突处理规范

---

## 1. 结论先行

这套体系的正确协作模型只有一句话：

**代码 + durable docs 进入 Git；control plane 和 runtime 副本不进入 Git，由本地或 CI 重建。**

更具体地说：

1. `src/`、`skills/`、`templates/`、`agents/`、`.claude-plugin/` 是框架真源
2. `docs/contexts/<slug>/`、`docs/plans/*`、`docs/solutions/*` 是团队协作型 durable docs
3. `.spec-first/`、`.claude/`、`.codex/`、`.agents/` 是运行时资产或生成副本，不应作为协作真源

如果团队遵守这个分层，系统适合团队协作，也支持增量更新和 Git 合并。  
如果把所有生成物都纳入版本控制，协作质量会明显下降。

---

## 2. 代码事实依据

本文规范不是主观建议，而是建立在当前代码事实之上：

### 2.1 真源与运行时副本边界

- `AGENTS.md` 已明确：
  - `skills/`、`agents/`、`templates/`、`src/` 是 source of truth
  - `.claude/`、`.codex/` 下的运行时副本不是 source of truth

### 2.2 运行时目录已默认忽略

当前仓库 `.gitignore` 已明确忽略：

1. `.spec-first/`
2. `.claude/commands/spec/`
3. `.claude/skills/`
4. `.claude/spec-first/`
5. `.claude/agents/`
6. `.codex/commands/spec/`
7. `.codex/spec-first/`
8. `.codex/agents/`
9. `.agents/`

这说明系统当前设计本来就不把这些目录当成团队协作真源。

### 2.3 `docs/contexts/<slug>/` 被设计为 durable asset

`spec-graph-bootstrap` 已明确：

1. `docs/contexts/<slug>/` 是 long-lived context library
2. 它是 durable VCS asset
3. 首次提交前需要人工审查内容

### 2.4 `.spec-first/` control plane 不应提交

`spec-graph-bootstrap` 已明确：

1. `.spec-first/` 包含 control plane 和临时 bootstrap state
2. 它不应提交到版本控制

### 2.5 `CRG` 已支持增量构建

当前 `CRG` 已具备：

1. `fingerprints` + SHA256 增量检测
2. changed / unchanged / deleted 分类
3. stale 节点删除
4. generation 指针
5. 局部替换 changed 文件

这说明“增量更新”不是未来设想，而是当前底座已支持的能力。

---

## 3. 协作分层模型

团队协作必须先接受下面这张分层表。

| 层级 | 资产类型 | 示例路径 | 是否入 Git | 是否允许人工修改 | 说明 |
| --- | --- | --- | --- | --- | --- |
| L1 真源层 | 框架源码与模板 | `src/`、`skills/`、`templates/`、`agents/`、`.claude-plugin/` | 是 | 是 | 真正的长期维护对象 |
| L2 durable docs 层 | 团队共享知识资产 | `docs/contexts/<slug>/`、`docs/plans/`、`docs/solutions/` | 是 | 是 | 团队协作与知识沉淀主层 |
| L3 control plane 层 | 运行时控制面 | `.spec-first/workflows/bootstrap/<slug>/` | 否 | 原则上否 | 本地或 CI 重建，主要用于路由、telemetry、调试 |
| L4 runtime 副本层 | 宿主运行时副本 | `.claude/`、`.codex/`、`.agents/` | 否 | 否 | 由 `init` / adapter 同步生成 |
| L5 telemetry 层 | 每次运行记录 | `.spec-first/workflows/<workflow>/<slug>/*.json` | 否 | 否 | 运行痕迹，不是协作真源 |

协作时最重要的纪律：

1. L1、L2 是团队真源
2. L3、L4、L5 是可重建产物
3. 不允许把 L3-L5 当成长期手工维护对象

---

## 4. Git 提交规范

### 4.1 必须提交的内容

下面这些内容默认应进入 Git：

1. 框架代码变更
   - `src/`
   - `skills/`
   - `templates/`
   - `agents/`
   - `.claude-plugin/`

2. 长期协作型文档
   - `docs/contexts/<slug>/`
   - `docs/plans/*`
   - `docs/solutions/*`
   - 架构设计与规范文档

3. 目标项目中被人工审查通过的 durable docs
   - 尤其是 `docs/contexts/<slug>/README.md`
   - `00-summary.md`
   - `architecture/*`
   - `pitfalls/*`
   - `code-facts/*`

### 4.2 禁止提交的内容

下面这些内容默认不得提交：

1. `.spec-first/`
2. `.claude/`
3. `.codex/`
4. `.agents/`
5. workflow telemetry
6. bootstrap backup 目录
7. 本地运行时 repair / state / scratch 目录

### 4.3 提交边界规范

推荐按下面边界提交：

1. **代码提交**
   - 只包含框架逻辑变更
   - 例如 `src/crg/**`、`src/bootstrap-compiler/**`、`src/context-routing/**`

2. **文档提交**
   - 只包含 durable docs 更新
   - 例如 `docs/contexts/<slug>/` 的刷新

3. **混合提交**
   - 只有在代码和 durable docs 强绑定、审查时必须一起看时才允许

不推荐：

1. 把代码改动、运行时副本改动、telemetry 改动混在同一个提交
2. 把 `.spec-first/` 一起 add 进去

### 4.4 提交粒度规范

多人协作时，提交必须满足：

1. 一次提交对应一个完整、可描述的改动单元
2. 不提交 “WIP” 式半成品
3. 大任务拆成多个原子提交
4. 文档刷新和框架代码大改最好拆开提交

---

## 5. 分支与 PR 规范

### 5.1 分支模型

推荐默认模型：

1. `main` / 默认分支：只接收审查通过的变更
2. 功能分支：一项功能或一组强相关改动一个分支
3. 文档刷新分支：当 `docs/contexts/<slug>/` 刷新量很大时，可单独分支

### 5.2 PR 范围规范

每个 PR 应明确标注属于哪一类：

1. `framework-code`
2. `durable-docs-refresh`
3. `stage0-control-plane-logic`
4. `crg-quality-upgrade`
5. `workflow-runtime-alignment`

### 5.3 PR 描述必须说明

每个 PR 至少写清楚：

1. 修改了哪些真源目录
2. 是否影响 `docs/contexts/<slug>/`
3. 是否需要重新运行 `crg build`
4. 是否需要重新运行 `graph-bootstrap`
5. 跑了哪些验证命令
6. 是否影响 runtime 生成物

---

## 6. `docs/contexts/<slug>/` 协作规范

这是团队最容易协作、也最容易冲突的区域，必须单独规范。

### 6.1 角色定位

`docs/contexts/<slug>/` 是：

1. 团队共享长期知识库
2. AI workflow 的 durable context 输入
3. 应该被审查的知识资产

它不是：

1. 一次性运行日志
2. 本地缓存
3. `.spec-first/` 的镜像副本

### 6.2 文件级协作边界

推荐按文件族分工：

1. `README.md`、`00-summary.md`
   - 由 orchestrator / 主维护者负责

2. `architecture/*`
   - 由架构 owner 负责

3. `code-facts/*`
   - 由代码事实 owner 或 bootstrap 编译逻辑 owner 负责

4. `pitfalls/*`
   - 由 review / incident owner 负责

5. `guides/*`、`layers/*`
   - 由对应领域 owner 负责

### 6.3 同一文件避免多人并发修改

推荐规则：

1. 同一个 PR 中，一个 durable doc 文件只设一个主作者
2. 若多人必须协作，先分文件，不要分段落
3. 避免两个人同时刷新同一个 `slug` 的同一组文件

### 6.4 文档刷新触发条件

下面情况应刷新 `docs/contexts/<slug>/`：

1. 顶层目录结构发生明显变化
2. 关键模块边界变化
3. 公开入口、集成边界、测试面变化
4. 高风险模块变化
5. Stage-0 control plane 显示 freshness 已 stale

下面情况通常不必刷新全量 durable docs：

1. 纯局部 bugfix
2. 样式类前端小改
3. 不影响架构边界和关键事实的轻量修改

### 6.5 durable docs 合并策略

若 `docs/contexts/<slug>/` 发生冲突，按顺序处理：

1. 先保留双方都确认正确的人工内容
2. 若冲突主要来自自动刷新结果，优先合并代码，再重新运行 bootstrap / graph-bootstrap
3. 重新生成后，人工审查最终 diff
4. 不直接手工拼接大段机器生成内容后立即提交

---

## 7. control plane 协作规范

### 7.1 `.spec-first/workflows/bootstrap/<slug>/`

这个目录的定位是：

1. 本地运行时控制面
2. 路由、freshness、minimal-context、ownership、review-queue 的本地事实面
3. 用于 workflow 消费和调试

它不是：

1. 团队长期知识资产
2. Git 协作真源

### 7.2 control plane 的正确使用方式

团队应这样用：

1. 本地运行 bootstrap / graph-bootstrap
2. 让 workflow 从 control plane 读取上下文
3. 审查 durable docs 是否需要提交
4. 提交 durable docs，不提交 control plane

### 7.3 控制面冲突处理

若本地 `.spec-first/` 与最新代码不一致：

1. 先重跑生成
2. 不手工修 `.spec-first/` 试图“保持一致”
3. 若生成失败，排查真源逻辑，而不是提交 `.spec-first/`

---

## 8. 增量更新规范

### 8.1 `CRG` 增量更新

团队默认应采用增量更新，而不是每次全量重建。

推荐路径：

1. 开发前或代码变更多后，执行 `spec-first crg build --repo=<repo>`
2. 依赖 fingerprints + SHA 检测 changed 文件
3. changed 文件局部替换
4. stale 文件删除
5. health gate 校验后 promote

### 8.2 Stage-0 增量刷新

当 `docs/contexts/<slug>/` 已存在时：

1. 先 backup
2. 再刷新产物
3. 成功后删除 backup
4. 失败时恢复 durable docs

### 8.3 文档增量刷新策略

推荐分三档：

1. **轻量刷新**
   - 只更新局部事实页

2. **中量刷新**
   - 更新 `00-summary.md` + `architecture/*` + `code-facts/*`

3. **全量刷新**
   - 当模块边界、上下文契约、Stage-0 规则明显变化时执行

### 8.4 刷新后的提交纪律

刷新后不要直接提交全部文件。必须：

1. 先看 diff
2. 确认不是 sample 残留
3. 确认没有敏感信息
4. 只提交 durable docs

---

## 9. Git 合并与冲突处理规范

### 9.1 哪些内容天然容易合并

下面这些通常容易 merge：

1. `src/` 中边界清晰的小模块
2. `docs/plans/*`
3. `docs/solutions/*`
4. `docs/contexts/<slug>/` 下不同文件族

### 9.2 哪些内容冲突风险高

下面这些更容易冲突：

1. `docs/contexts/<slug>/00-summary.md`
2. `docs/contexts/<slug>/README.md`
3. `architecture/module-map.md`
4. 大型聚合文档
5. 同一 `slug` 的同一时段多次刷新

### 9.3 冲突处理标准流程

发生冲突时，按这个顺序：

1. **先合并代码**
2. **删除本地运行时残留影响**
   - 不提交 `.spec-first/`
3. **重新运行相关生成流程**
   - `crg build`
   - `bootstrap` / `graph-bootstrap`
4. **重新审查 durable docs diff**
5. **只提交最终 durable docs**

### 9.4 不允许的冲突处理方式

1. 手工修改 `.spec-first/` 后提交
2. 为了“省事”把双方 durable docs 都删掉
3. 直接保留一边机器生成结果而不审查
4. 合并后不重新跑生成链

---

## 10. ownership 与 review-queue 使用规范

当你们按主方案完成 Phase 2 后，团队协作应升级到更明确的治理模式。

### 10.1 ownership 规范

ownership 至少表达：

1. 资产 owner
2. reviewer
3. 文件或资产路径边界

推荐使用方式：

1. 把 owner 看作“第一责任人”
2. 把 reviewer 看作“默认把关人”
3. ownership 先覆盖 durable docs 和关键 control-plane 资产

### 10.2 review-queue 规范

review queue 用于标记：

1. 未验证资产
2. stale context
3. contradictions

团队应这样用：

1. 把 open queue 当成待处理知识债务
2. 不把它当长期 Git 资产
3. 在日常迭代或定期维护中消化

---

## 11. CI / 本地验证规范

### 11.1 框架仓库最低要求

在 `spec-first` 框架仓库中，推荐最低验证集：

1. `npm run test:unit`
2. `npm run test:smoke`
3. `npm run test:integration`
4. `npm run test:e2e:crg`

### 11.2 质量门变更要求

若改动涉及：

1. routing
2. retrieval
3. Stage-0 选路
4. review-context
5. benchmark 行为

则在当时的历史方案里必须额外关注：

1. `npm run test:crg:gate`
2. `npm run test:crg:benchmarks`

> 说明：以上 benchmark 入口已在当前实现中退役，此处保留为历史协作规范记录。

### 11.3 目标项目最低要求

在使用 `spec-first` 的目标项目中，最低协作检查应包含：

1. durable docs diff 审查
2. freshness 状态检查
3. control plane 是否可读
4. Stage-0 fallback 是否异常升高

---

## 12. 单仓 / workspace 协作规范

### 12.1 单仓默认策略

当前系统最成熟的协作模型仍是单仓。

默认要求：

1. 一个 repo 对应一个 `slug`
2. 一个 durable context library
3. 一个 control-plane 路径

### 12.2 workspace 策略

当一个 workspace 下有多个 repo 时：

1. 每个 repo 仍保持自己的 `slug`
2. 每个 repo 的 `docs/contexts/<slug>/` 与 `.spec-first/workflows/bootstrap/<slug>/` 独立
3. workspace 只是聚合消费，不改变单 repo 的资产边界

### 12.3 workspace 合并纪律

workspace 模式下不要做：

1. 多个 repo 共用一个 `slug`
2. 直接把多个 repo 的 control plane 混写到一个目录
3. 把 workspace 聚合结果当单 repo durable docs 提交

---

## 13. 团队角色建议

推荐至少分这 4 类角色：

### 13.1 Framework Owner

负责：

1. `src/`
2. `skills/`
3. `templates/`
4. `.claude-plugin/`

### 13.2 Context Owner

负责：

1. `docs/contexts/<slug>/`
2. 文档刷新审查
3. durable docs 内容质量

### 13.3 Feature Developer

负责：

1. 代码实现
2. 必要时刷新局部 context
3. 提交原子变更

### 13.4 Reviewer / Knowledge Steward

负责：

1. 审查 durable docs 与代码事实是否一致
2. 处理 stale / contradictions / review queue
3. 确保知识资产长期可维护

---

## 14. 推荐协作流程

### 14.1 日常功能开发

1. 基于功能分支开发
2. 运行必要的 `crg build`
3. 若架构事实变化，刷新 `graph-bootstrap` / `bootstrap`
4. 审查 durable docs diff
5. 提交代码 + durable docs
6. PR 中说明是否有 context refresh

### 14.2 大规模重构

1. 先改代码
2. 合并后统一刷新 `CRG`
3. 再刷新 Stage-0 durable docs
4. 拆成多个 PR，不要一个 PR 同时做大规模代码重构和全量 context 重写

### 14.3 冲突多发场景

1. 同一 `slug` 同时多人刷新时，指定一个主刷新人
2. 其他人优先提交代码，不直接抢刷同一批 durable docs
3. 合并后由主刷新人统一重跑生成并提交 durable docs

---

## 15. 最终协作纪律

最后只强调 8 条纪律：

1. `docs/contexts/<slug>/` 是团队协作资产，可以进 Git。
2. `.spec-first/` 是 control plane，不进 Git。
3. `.claude/`、`.codex/`、`.agents/` 是运行时副本，不进 Git。
4. 增量更新优先，避免频繁全量重建。
5. durable docs 提交前必须人工审查 diff。
6. 合并冲突优先重跑生成链，不手工拼控制面产物。
7. 小提交、原子提交、清晰边界，是降低冲突的第一手段。
8. 团队协作的核心不是“把所有产物都共享”，而是“只共享长期真源和 durable docs”。  

这 8 条如果做到了，这套体系就能稳定支持团队协作、增量更新和 Git 合并。
