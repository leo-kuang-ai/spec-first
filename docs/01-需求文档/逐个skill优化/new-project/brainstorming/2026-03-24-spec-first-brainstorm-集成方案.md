# spec-first:brainstorm 集成方案

文档日期：2026-03-24  
目标仓库：`/Users/kuang/xiaobu/spec-first`  
目标能力：新增正式 skill `spec-first:brainstorm`

## 1. 目标链路

本次集成的目标链路应固定为：

```text
用户需求
  -> /spec-first:brainstorm
  -> prd.md
  -> /spec-first:spec
  -> spec.md
  -> /spec-first:design
  -> design.md
  -> /spec-first:task
  -> task_plan.md
```

核心结论：

- `spec-first:brainstorm` 是正式上游入口，不是附属草稿节点
- `brainstorm` 的正式输出是 `prd.md`
- `03-spec` 负责消费 `prd.md` 并生成 `spec.md`
- `04-design` 继续消费 `spec.md`
- `06-task` 继续消费 `design.md`

这意味着 `spec-first` 需要把当前 `03-spec` 中承担的 `Phase 0 PRD 生成` 职责，前移到新 skill `spec-first:brainstorm`。

## 2. 定位与边界

### 2.1 `spec-first:brainstorm` 的职责

`spec-first:brainstorm` 应该负责：

- 读取项目上下文与已有产物
- 单问题澄清需求目标、范围、约束、成功标准
- 提供 2-3 个可行方向并给出推荐
- 按 section 分段确认方案
- 把确认结果落盘为 `prd.md`
- 给出唯一标准 handoff：`/spec-first:spec`

### 2.2 不属于 `brainstorm` 的职责

`brainstorm` 不负责：

- 生成 FR/AC
- 生成 DS
- 拆 TASK
- 写实现代码
- 直接进入 `design`、`task`、`code`

硬边界：

- `brainstorm` 的终点是 `prd.md`
- `spec` 的起点是 `prd.md`

### 2.3 与现有 skill 的新分工

`brainstorm`：

- 原始想法 -> 已确认 PRD

`spec`：

- `prd.md` -> `spec.md`

`design`：

- `spec.md` -> `design.md`

`task`：

- `design.md` -> `task_plan.md`

## 3. 为什么必须这样改

当前 `spec-first` 的事实是：

- `03-spec` 既负责 PRD 生成，又负责 FR/AC 结构化
- `04-design` 依赖 `spec.md`，不能直接吃模糊需求
- 阶段机已经稳定，不适合为了 brainstorm 新增正式 stage

所以最稳的改法不是重写阶段机，而是：

- 新增一个正式前置 skill `spec-first:brainstorm`
- 让它输出 `prd.md`
- 把 `03-spec` 的职责收缩为“消费 PRD，生成 spec”

这样做的收益：

- 上游澄清与正式规格化解耦
- `03-spec` 可以变轻，边界更干净
- 主阶段机仍然保持 `01_specify -> 02_design -> 03_plan -> ...`

## 4. 推荐架构

推荐方案：

- 新增独立 skill `spec-first:brainstorm`
- 不新增 stage
- 但把它定义为主链路的正式前置节点

设计原则：

- 主状态仍由 `stage-state.json` 驱动
- `brainstorm` 不推进阶段
- `brainstorm` 通过 `prd.md` 影响正式流程
- `spec` 对 `prd.md` 建立强依赖

一句话：

`brainstorm` 不进入阶段机，但进入主产物链。

## 5. 产物设计

### 5.1 正式输出产物

`spec-first:brainstorm` 的正式输出应是：

- `specs/{featureId}/prd.md`
- `specs/{featureId}/findings.md` 中的一段 brainstorm 摘要
- `specs/{featureId}/document-links.yaml` 中对 `prd.md` 的登记

不建议第一版输出 `brainstorm.md`，原因：

- 会和 `prd.md` 形成双真源
- 下游最终消费的还是 `prd.md`
- 你要的链路已经明确要求 `brainstorm -> prd.md`

### 5.2 `prd.md` 建议结构

建议 `brainstorm` 直接产出规范化 PRD，而不是一份自由格式会议纪要。

推荐结构：

```markdown
# Product Requirements Document

## 1. Problem Framing
## 2. Goals
## 3. Non-Goals
## 4. Target Users and Scenarios
## 5. Constraints and Assumptions
## 6. Options Compared
## 7. Recommended Direction
## 8. Clarification Decisions
## 9. Open Questions
## 10. Handoff to spec
```

### 5.3 `findings.md` 摘要模板

每次 brainstorm 完成后，应在 `findings.md` 追加：

- 本轮目标
- 已确认边界
- 推荐方案
- 剩余未决项
- 下一步命令：`/spec-first:spec <featureId>`

## 6. 目录与命名

建议新增目录：

- `skills/spec-first/02a-brainstorm/SKILL.md`
- `skills/spec-first/02a-brainstorm/references/prd-template.md`
- `skills/spec-first/02a-brainstorm/references/brainstorm-checklist.md`
- `skills/spec-first/02a-brainstorm/references/option-comparison-template.md`

说明：

- 现有 `02-catchup` 已占 `02-*`
- 用 `02a-brainstorm` 表示它位于 `spec` 之前，但不属于正式阶段节点
- 对用户暴露的仍是 `/spec-first:brainstorm`

## 7. SKILL.md 设计要求

### 7.1 frontmatter

```yaml
---
name: "spec-first:brainstorm"
description: "Use when a request is still fuzzy and you need to clarify intent, compare options, and write an approved prd.md before spec."
version: 1.0.0
last_updated: 2026-03-24
---
```

### 7.2 核心流程

建议流程：

```text
P0 定位 Feature 与上下文
P1 读取 first/runtime 与现有 feature 文档
P2 单问题澄清目标/边界/约束/成功标准
P3 提供 2-3 个候选方案并推荐一个
P4 分段呈现 PRD 内容并逐段确认
P5 写入 prd.md + findings.md + document-links
P6 handoff 到 /spec-first:spec
```

### 7.3 HARD-GATE

必须写明：

- 未确认 PRD 前，不得进入 `spec`
- 未完成方案比较前，不得写 `prd.md`
- 若关键约束未澄清，只能输出 `[NEEDS CLARIFICATION]`
- 禁止直接 handoff 到 `design/task/code`

### 7.4 handoff 契约

`brainstorm` 的唯一标准 handoff：

- `/spec-first:spec`

不允许：

- `brainstorm -> design`
- `brainstorm -> task`
- `brainstorm -> code`

## 8. 与现有 `03-spec` 的改造关系

这是本次集成最关键的点。

### 8.1 当前问题

`03-spec` 当前同时做两件事：

- Phase 0：PRD 生成
- Step 0-8：FR/AC 结构化

这会导致：

- skill 过重
- “需求澄清”与“正式规格化”边界模糊

### 8.2 改造目标

改造后应变成：

- `brainstorm`：生成 `prd.md`
- `spec`：消费 `prd.md`，生成 `spec.md`

### 8.3 `03-spec` 建议调整

`03-spec` 不应再默认从零生成 PRD，而应改为：

```text
P0 定位 Feature
P1 读取 prd.md
P2 执行 PRD Sanity Check
P3 生成 FR/AC
P4 写入 spec.md
P5 执行 gate/check
```

建议保留兼容模式：

- 如果 `prd.md` 缺失，`03-spec` 可以报错并建议先跑 `/spec-first:brainstorm`
- 不建议继续在 `03-spec` 内完整复制旧的 `Phase 0 PRD` 长流程

### 8.4 `03-spec` 的最小保留检查

即便 `prd.md` 已存在，`03-spec` 仍应保留一个轻量 `PRD Sanity Check`：

- PRD 是否完整
- 是否仍有高优先级 `[NEEDS CLARIFICATION]`
- 是否存在不可接受的实现细节污染
- 是否可以进入 FR/AC 结构化

## 9. 与 `04-design`、`06-task` 的契约

### 9.1 `04-design`

保持不变：

- 直接输入仍是 `spec.md`
- 必要时可读取 `prd.md` 作为设计意图来源

但设计真相源仍是：

- `spec.md`

### 9.2 `06-task`

保持不变：

- 继续消费 `design.md`
- 不直接读取 `brainstorm` 会话

所以完整的正式产物流是：

```text
brainstorm -> prd.md -> spec -> spec.md -> design -> design.md -> task -> task_plan.md
```

## 10. `document-links.yaml` 集成

需要明确三条规则：

- `prd.md` 是合法正式文档
- `spec.md` 必须声明对 `prd.md` 的引用
- `design.md` 可选声明对 `prd.md` 的间接引用或背景引用

推荐关系：

```text
prd.md
  -> spec.md
      -> design.md
          -> task_plan.md
```

## 11. orchestrate 集成策略

第一版不建议把 `brainstorm` 写进正式 stage dispatch table，但要做建议型接入。

### 11.1 建议型规则

在 `13-orchestrate` 中增加：

- 当用户仍处于原始想法阶段，或 `prd.md` 缺失时，优先建议 `/spec-first:brainstorm`

### 11.2 不做的事

第一版不做：

- 自动调度 `brainstorm`
- 自动推进阶段
- 为 `brainstorm` 增加独立 stage

## 12. runtime 与 CLI 接入

### 12.1 命令发现

现有 `src/shared/skill-commands.ts` 会扫描 `skills/spec-first/*/SKILL.md`，所以新增 skill 目录后，理论上可自动发现。

需要确保：

- frontmatter 合法
- `# Skill: brainstorm` 存在
- skill 名不冲突

### 12.2 skill render

现有 `src/cli/commands/skill.ts` 已支持：

```bash
spec-first skill render brainstorm --feature <featureId>
```

所以第一版不必额外新增显式 CLI 命令。

### 12.3 是否新增 `src/cli/commands/brainstorm.ts`

第一版不建议新增。

原因：

- 先把 skill 契约与产物契约打稳
- 当前 `spec-first` 的主接入点本来就是 skill 发现与 render
- 后续如果需要“结构化落盘 PRD”的 runtime 命令，再补 CLI handler

## 13. 测试方案

至少补三层测试。

### 13.1 发现与渲染测试

目标：

- `discoverSkills()` 能发现 `brainstorm`
- `spec-first skill render brainstorm` 能渲染
- 安装链路能同步该 skill

建议涉及：

- `tests/integration/skill-render.test.ts`
- `tests/integration/skill-integration.test.ts`

### 13.2 文档契约测试

目标：

- `prd.md` 被识别为合法正式文档
- `document-links.yaml` 可登记 `prd.md`
- `spec` 引用 `prd.md` 不会破坏校验

建议涉及：

- `tests/integration/layer2-merge.test.ts`
- `docs links` 相关测试样例

### 13.3 流程建议测试

目标：

- 在 `prd.md` 缺失的场景下，系统能建议先用 `/spec-first:brainstorm`

第一版可先做 render / guidance 断言，不必直接上完整 e2e。

## 14. 实施清单

### Phase 1：skill 本体落地

范围：

- 新增 `spec-first:brainstorm`
- 新增 references 模板
- 接入 skill 发现与 render
- 建立 `prd.md` 产物结构

涉及文件：

- `skills/spec-first/02a-brainstorm/SKILL.md`
- `skills/spec-first/02a-brainstorm/references/*`
- `src/shared/skill-commands.ts`
- `tests/integration/skill-render.test.ts`
- `tests/integration/skill-integration.test.ts`

### Phase 2：`03-spec` 收缩改造

范围：

- 把 `03-spec` 的默认入口改为消费 `prd.md`
- 将旧 `Phase 0 PRD` 长流程降级为兼容或移除
- 增加缺失 `prd.md` 时的错误提示与建议

涉及文件：

- `skills/spec-first/03-spec/SKILL.md`
- `skills/spec-first/03-spec/references/*`
- 相关 tests

### Phase 3：文档链路与建议型编排

范围：

- `document-links` 接纳 `prd.md`
- `orchestrate` 增加建议型入口
- `catchup/status` 按需补弱提示

## 15. 风险与控制

### 风险 1：`03-spec` 改造不彻底

如果只新增 `brainstorm`，但 `03-spec` 仍然完整保留旧 `Phase 0 PRD` 主流程，最终会变成双入口、双职责。

控制：

- 明确 `brainstorm` 是 PRD 唯一标准入口
- `03-spec` 只保留 `PRD Sanity Check`

### 风险 2：`prd.md` 成为新双真源

如果同时保留 `brainstorm.md` 和 `prd.md`，会形成冲突。

控制：

- 第一版只保留 `prd.md`
- 不新增 `brainstorm.md`

### 风险 3：过早动阶段机

一旦把 `brainstorm` 纳入 `stage-machine.ts`，改造面会立刻扩大。

控制：

- 第一版不改 stage machine
- 只把 `brainstorm` 纳入主产物链

## 16. 最终建议

最终建议很明确：

1. 新增 `spec-first:brainstorm`。
2. 让它成为 PRD 的正式生成入口。
3. 把链路固定为 `brainstorm -> prd.md -> spec -> spec.md -> design -> design.md -> task -> task_plan.md`。
4. 收缩 `03-spec`，让它专注于 `PRD -> FR/AC -> spec.md`。
5. 第一版不改阶段机，只改 skill 契约、产物契约和下游消费契约。

这样做既符合你要的主链路，又不会一次性打爆 `spec-first` 现有的 stage/gate/runtime 基线。
