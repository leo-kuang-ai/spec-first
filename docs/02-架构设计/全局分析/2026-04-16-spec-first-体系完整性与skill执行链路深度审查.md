# spec-first 体系完整性与 skill 执行链路深度审查

> Lifecycle: historical-input / external-reference. 本文保留旧架构、方案、迁移或研究记录；当前 source of truth 以 `docs/README.md`、根目录 README、`docs/05-用户手册/`、`docs/contracts/`、`skills/`、`src/cli/` 和 `CHANGELOG.md` 为准。

日期：2026-04-16  
审查口径：仅依据当前工作树中的代码与技能文档，不依据主观印象，不把设计意图等同于已落地实现。

## 0. 文档定位、阅读顺序与判读规则

### 0.1 文档定位

本文是 **spec-first 全局体系文档**，回答的是平台级问题：

1. `spec-first` 作为整体平台是否已经成体系。
2. 全局执行链路是否清晰。
3. Runtime / Context / Workflow 三个控制面的边界是否成立。
4. 平台级优化顺序应该如何排。

配套深潜文档是：

- `docs/02-架构设计/全局分析/2026-04-16-crg-代码数据索引基座全局审查与优化方案.md`

两份文档不是替代关系，而是：

- 本文负责 **总纲 / 全局边界 / 平台级排序**
- CRG 文档负责 **`src/crg` 子系统事实 / 内部优化顺序**

### 0.2 阅读顺序

建议按下面顺序阅读：

1. 先读本文，建立 `spec-first` 的整体边界。
2. 再读 CRG 深潜文档，理解代码索引基座的真实能力与缺口。
3. 真正进入开发排期时：
   - 平台级 roadmap 以本文为准
   - `src/crg` 内部施工顺序以 CRG 文档 `8.x` 的 `P0 / P1 / P2` 为准

### 0.3 证据标记

本文统一使用以下证据口径：

- `[R]` 运行验证：结论来自实际命令、测试、E2E 或运行结果
- `[C]` 代码链验证：结论可以直接从源码、调用链、文件关系中追踪
- `[I]` 基于实现推断：结论来自当前实现推导，不等于已经运行验证

未单独标注时，默认按 `[C]` 理解；显式引用测试或运行结果时，同时视为 `[R]`。

### 0.4 统一成熟度量表

为与配套 CRG 文档保持一致，本文统一采用下面 4 档量表：

| 量表 | 含义 |
| --- | --- |
| 完整 | 核心主链、治理闭环、关键运行边界都已落地 |
| 基本完整 | 主链已经可用，但关键质量门禁、精度或治理仍缺一层 |
| 部分完整 | 存在明确断层，或重要能力仍主要靠约定支撑 |
| 缺失 | 代码中基本不存在该能力 |

## 1. 审查目标与范围

本次审查回答 4 个问题：

1. `spec-first` 当前是否已经形成一套完整体系，而不是零散 `skill` 集合。
2. 从宏观和微观两个层面看，完整执行链路是否清晰。
3. `skill` 的真实执行链路是什么，哪些环节是代码硬实现，哪些环节主要依赖 `SKILL.md` contract。
4. 若以业界领先为目标，当前代码最值得补强的点在哪里。

本次审查覆盖的代码面：

- CLI 与宿主运行时控制面：`bin/spec-first.js`、`src/cli/**`
- source-of-truth 与分发：`.claude-plugin/plugin.json`、`src/cli/plugin.js`、`src/cli/adapters/**`
- Stage-0 / graph-bootstrap 编译链 / Context Routing：`src/bootstrap-compiler/**`、`src/context-routing/**`
- CRG 图理解引擎：`src/crg/**`
- workflow/skill contract：`templates/claude/commands/spec/*.md`、`skills/spec-*/SKILL.md`
- 质量与验证：`package.json`、`tests/e2e/spec-graph-bootstrap-mainline.sh`

## 2. 审查基线

一个关键前提必须先说清楚：

- 本文判断的是**当前工作树**，不是某个已发布 tag。
- 当前工作树里已经存在 `debug`、`update`、`setup` 等新增 command/skill 的代码事实，例如 `.claude-plugin/plugin.json:12-103` 已登记 13 个 command，`templates/claude/commands/spec/` 中也已有对应 wrapper。
- 因此，本文结论针对的是“当前仓内事实状态”，而不是“上一个稳定发布版本状态”。

## 3. 结论先行

### 3.1 宏观结论

`spec-first` 已经不是一个“提示词包”或者“技能目录”。从代码事实看，它已经形成了 3 条彼此配合的控制面：

1. **Runtime control plane**  
   负责安装、分发、适配、治理、清理、诊断宿主运行时。  
   代码核心：`src/cli/index.js:9-45`、`src/cli/commands/init.js:28-173`、`src/cli/plugin.js:152-220`、`src/cli/state.js:50-62`

2. **Context control plane**  
   负责图理解、Stage-0 产物编译、上下文路由、降级、telemetry。  
   代码核心：`src/crg/cli/router.js:107-171`、`src/bootstrap-compiler/run-bootstrap.js:82-144`、`src/context-routing/evaluator.js:50-149`

3. **Workflow control plane**  
   负责把 `brainstorm -> plan -> work -> review -> compound` 这些流程固化成 command wrapper + workflow skill contract。  
   代码核心：`.claude-plugin/plugin.json:12-103`、`templates/claude/commands/spec/plan.md:8-16`、`templates/claude/commands/spec/work.md:8-17`、`templates/claude/commands/spec/code-review.md:8-17`

### 3.2 直接判断

- **体系是完整的骨架**：安装、分发、宿主适配、上下文资产、主 workflow、知识沉淀、运行时诊断与修复，这些主部件都已存在。
- **执行链路是清晰的**：但它不是“所有行为都由 Node CLI 执行”，而是“CLI 负责把 runtime 装好，真正 workflow 执行主要发生在宿主加载后的 command/skill contract 内”。
- **离业界领先还差一层统一执行/观测面**：当前已经有 control plane，但还没有完全收敛成统一 orchestration runtime；部分能力仍是 `SKILL.md` 约定强于 JS 执行器强约束。

### 3.3 最重要的保留判断

必须强调一条代码事实：

- `spec-first` 的主 workflow 并不是通过 `spec-first <workflow>` 这种 Node CLI 子命令直接执行。
- `bin/spec-first.js:7-15` 只分流到两类入口：
  - `crg` -> `src/crg/cli/router.js`
  - 普通 CLI -> `doctor/init/clean`
- 也就是说，`spec-*` 或 `spec-*` 的 workflow 执行，主要依赖 **运行时已安装的 command wrapper + workflow skill**，不是普通 CLI 进程自己直接跑完整业务逻辑。

这不是缺陷，而是当前架构的真实边界。

## 4. 宏观体系拆解

### 4.1 双主入口结构

CLI 入口非常清楚：

- `bin/spec-first.js:7-11`：若首参是 `crg`，走图引擎路由
- `bin/spec-first.js:14-15`：否则进入 `runCli`
- `src/cli/index.js:23-40`：当前普通 CLI 只直接支持 `doctor/init/clean`

这意味着系统天然分成两大面：

- **runtime 运行时管理面**
- **graph/context 理解面**

### 4.2 三层控制面

| 控制面 | 主要职责 | 关键代码事实 |
|---|---|---|
| Runtime control plane | 初始化、分发、宿主适配、状态管理、治理注入、清理与诊断 | `src/cli/commands/init.js:82-143`、`src/cli/state.js:152-224` |
| Context control plane | 生成 Stage-0 控制面产物与 context docs，按 stage 选择上下文并记录 telemetry | `src/bootstrap-compiler/run-bootstrap.js:103-139`、`src/context-routing/evaluator.js:97-149`、`src/context-routing/telemetry.js:34-53` |
| Workflow control plane | 通过 command wrapper 把行为委托给 workflow skill，形成 brainstorm/plan/work/review/compound 等交付链 | `templates/claude/commands/spec/*.md`、`skills/spec-*.md` |

### 4.3 从宏观上看，体系已经覆盖了 5 个闭环

1. **安装/修复闭环**  
   `doctor -> init -> clean -> update`

2. **上下文产物生成闭环**  
   `graph-bootstrap -> .spec-first/workflows/bootstrap -> docs/contexts`  
   说明：这里指的是 Stage-0 产物生成与消费路径已经形成闭环，不等同于 “CRG 事实已自动接入 graph-bootstrap 编译链”的更强闭环。

3. **交付闭环**  
   `brainstorm -> plan -> work -> review`

4. **知识沉淀闭环**  
   `compound -> docs/solutions`

5. **会话追溯闭环**  
   `sessions -> session-historian`

这说明 `spec-first` 已经不是单点工具，而是平台骨架。

## 5. 全局 ASCII 流程图

```text
User / Host Session
       |
       v
  spec-first CLI
       |
       +------------------------------+
       |                              |
       v                              v
doctor / init / clean             crg subcommands
       |                              |
       v                              v
manifest + adapters + state      graph build / query / retrieval
       |                              |
       v                              v
Claude/Codex runtime assets      .spec-first/graph/*
       |                              |
       +---------------+--------------+
                       |
                       v
         spec-* command wrapper or spec-* skill
                       |
                       v
              workflow SKILL contract
                       |
        +--------------+------------------------------+
        |              |              |               |
        v              v              v               v
   brainstorm       plan           work            review
        |              |              |               |
        +--------------+-------+------+---------------+
                               |
                               v
                     compound / sessions / update
```

这个图对应当前代码事实：

- runtime 安装来自 `init`，不是 workflow 自身生成：`src/cli/commands/init.js:127-143`
- workflow 真实执行点在 wrapper 指向的 `SKILL.md`：例如 `templates/claude/commands/spec/work.md:8-17`
- graph/context 由 CRG 与 Stage-0 compiler 提供，不是 wrapper 自己生成：`src/crg/cli/router.js:107-171`、`src/bootstrap-compiler/run-bootstrap.js:103-139`

## 6. skill 执行链路

### 6.1 先分清三类资产

`spec-first` 里至少有 3 类不同的“可执行知识单元”：

| 类型 | 真源位置 | 运行时落点 | 用途 |
|---|---|---|---|
| command-backing workflow skill | `skills/spec-*/SKILL.md` + `.claude-plugin/plugin.json` | Claude: `.claude/spec-first/workflows/<skill>/`；Codex: `.agents/skills/<skill>/` | 支撑 `spec-*` 或 `spec-*` 主 workflow |
| standalone skill | `skills/<name>/SKILL.md` | Claude: `.claude/skills/<name>/`；Codex: `.agents/skills/<name>/` | 被直接调用，或被 workflow 间接调度 |
| agent profile | `agents/**/*.md` | Claude: `.claude/agents/**`；Codex: `.codex/agents/**` | reviewer / researcher / specialist 子代理 |

这不是猜测，而是 `syncSkills()` 的明确行为：

- `src/cli/plugin.js:181-220` 用 `manifest.commands.map(cmd => cmd.skill)` 先区分 command-backing skill
- command-backing skill 被复制到 `workflowsRoot`
- 非 command-backing skill 被复制到 `skillsRoot`

### 6.2 manifest 是 command -> skill 的单一真源

`.claude-plugin/plugin.json:12-103` 当前登记了 13 个 command：

- `ideate -> spec-ideate`
- `brainstorm -> spec-brainstorm`
- `plan -> spec-plan`
- `work -> spec-work`
- `debug -> spec-debug`
- `review -> spec-code-review`
- `compound -> spec-compound`
- `sessions -> spec-sessions`
- `bootstrap -> spec-graph-bootstrap`（当前代码里仍存在，但按产品演进定位应视为历史兼容入口，不纳入后续优化主轴）
- `graph-bootstrap -> spec-graph-bootstrap`
- `mcp-setup -> spec-mcp-setup`
- `update -> spec-update`
- `setup -> setup`

这意味着：

- command 名称不是散落在模板目录中的隐式约定
- workflow skill 也不是“靠文件名猜出来”
- 绑定关系由 manifest 显式声明

### 6.3 init/plugin/adapters 如何把真源分发到宿主 runtime

分发链路如下：

1. `runInit()` 读取 manifest、列出 bundled commands/skills/agents：`src/cli/commands/init.js:82-109`
2. `syncBundledAssets()` 统一同步 commands、skills、agents：`src/cli/plugin.js:152-158`
3. `syncCommands()` 把 command template 写入 runtime command 目录：`src/cli/plugin.js:160-179`
4. `syncSkills()` 按“是否 command-backing”把 skill 写到 workflowRoot 或 standaloneRoot：`src/cli/plugin.js:181-220`
5. adapter 对内容做宿主特定改写：`src/cli/adapters/claude.js:50-56`、`src/cli/adapters/codex.js:80-89`
6. 同步完成后写 state、developer、lang policy：`src/cli/commands/init.js:128-143`

### 6.4 Claude 与 Codex 的 skill 执行路径并不相同

#### Claude

- command root：`.claude/commands/spec`，见 `src/cli/adapters/claude.js:22-24`
- standalone skill root：`.claude/skills`，见 `src/cli/adapters/claude.js:26-28`
- workflow skill root：`.claude/spec-first/workflows`，见 `src/cli/adapters/claude.js:30-32`
- agent root：`.claude/agents`，见 `src/cli/adapters/claude.js:34-36`

Claude 的额外特征：

- 会把 canonical agent name 改写成 bare name，见 `src/cli/adapters/claude.js:131-143`
- `doctor` 还会检查 runtime 中是否残留 canonical agent refs 或 unresolved Task refs，见 `src/cli/adapters/claude.js:77-126`

#### Codex

- command root：`.codex/commands/spec`，见 `src/cli/adapters/codex.js:32-34`
- standalone skill root：`.agents/skills`，见 `src/cli/adapters/codex.js:36-38`
- workflow skill root 也是 `.agents/skills`，见 `src/cli/adapters/codex.js:40-42`
- agent root：`.codex/agents`，见 `src/cli/adapters/codex.js:44-46`

Codex 的额外特征：

- 统一把 `.claude/spec-first/workflows/`、`.claude/skills/` 改写到 `.agents/skills/`，见 `src/cli/adapters/codex.js:134-148`
- 把 `spec-first:<group>:<agent>` 改写成 `.codex/agents/<group>/<agent>.md` 路径引用，见 `src/cli/adapters/codex.js:150-192`
- 清理 legacy roots，见 `src/cli/adapters/codex.js:110-129`

结论：这是**单一真源、多宿主分发**，不是两套平行维护系统。

### 6.5 command wrapper 本身是薄壳，真正行为在 workflow skill

这点非常关键。

每个 command wrapper 都先声明一件事：  
“先读取 runtime 中的对应 `SKILL.md`，并把它作为主 contract。”

例如：

- `spec:plan`：`templates/claude/commands/spec/plan.md:8-16`
- `spec:work`：`templates/claude/commands/spec/work.md:8-17`
- `spec:code-review`：`templates/claude/commands/spec/code-review.md:8-17`
- `spec:graph-bootstrap`：`templates/claude/commands/spec/graph-bootstrap.md:8-18`
- `spec:compound`：`templates/claude/commands/spec/compound.md:8-17`
- `spec:debug`：`templates/claude/commands/spec/debug.md:8-16`
- `spec:update`：`templates/claude/commands/spec/update.md:8-16`
- `spec:sessions`：`templates/claude/commands/spec/sessions.md:8-15`
- `spec:setup`：`templates/claude/commands/spec/setup.md:8-15`

这条设计的含义是：

- wrapper 负责“入口声明”和“兜底提醒”
- phase、artifact path、handoff、review routing 等行为定义，主要放在 workflow skill 中
- 因此，`spec-first` 的 workflow 行为核心，不在 command template，而在 `skills/spec-*/SKILL.md`

### 6.6 skill 执行链路 ASCII 图

```text
.claude-plugin/plugin.json
        |
        v
 listBundledCommands() / syncBundledAssets()
        |
        v
 runtime command wrapper
 (.claude/commands/spec/*.md or .codex/commands/spec/*.md)
        |
        v
 runtime workflow skill
 (.claude/spec-first/workflows/spec-*/SKILL.md
  or .agents/skills/spec-*/SKILL.md)
        |
        v
 workflow contract executes
        |
        +--> read Stage-0 context if available
        +--> dispatch standalone skills / agents if needed
        +--> write durable artifacts
        +--> emit review outputs / plans / docs / telemetry
```

### 6.7 当前 workflow 主链已经清晰

基于当前 manifest 与 skill 文档，可以明确看到主链：

- `spec:brainstorm`  
  产出 requirements doc，通常写到 `docs/brainstorms/...`，见 `templates/claude/commands/spec/brainstorm.md:12-18`

- `spec:plan`  
  明确 `WHAT/HOW` 分离，产出 plan，见 `skills/spec-plan/SKILL.md:11-13`

- `spec:work`  
  从 plan 出发执行，带 branch/worktree、测试、shipping 流程，见 `skills/spec-work/SKILL.md:66-120`、`skills/spec-work/SKILL.md:287-310`

- `spec:code-review`  
  不是单 reviewer，而是分层 persona review pipeline，见 `skills/spec-code-review/SKILL.md:80-99`、`skills/spec-code-review/SKILL.md:133-176`

- `spec:compound`  
  形成知识沉淀到 `docs/solutions/`，见 `templates/claude/commands/spec/compound.md:12-17`、`skills/spec-compound/SKILL.md:9-13`

- `spec:sessions`  
  追溯历史 session，见 `skills/spec-sessions/SKILL.md:21-38`

- `spec:update`  
  承担 CLI 版本检查与 runtime 漂移修复，见 `templates/claude/commands/spec/update.md:12-16`、`skills/spec-update/SKILL.md:1-54`

结论：主 workflow 不是单一技能列表，而是一条明确的交付主干。

## 7. Stage-0 / CRG / Context Routing 执行链路

### 7.1 路径边界非常清楚

`src/crg/artifact-paths.js` 明确区分了 3 个物理域：

- 图数据：`.spec-first/graph/*`，见 `src/crg/artifact-paths.js:35-60`
- workflow 控制面：`.spec-first/workflows/<workflow>/<slug>/`，见 `src/crg/artifact-paths.js:62-81`
- 长期 context docs：`docs/contexts/<slug>/`，见 `src/crg/artifact-paths.js:83-94`

这比很多“全部丢进一个目录”的方案成熟得多。

### 7.2 Stage-0 compiler mainline 的真实代码链

这里说的“真实代码链”，特指 **Stage-0 compiler 内部主链**，不是宿主里的 `spec-graph-bootstrap -> command wrapper -> workflow skill` 全链路。

这条内部主链在代码层和 E2E 测试里都能找到：

1. `runBootstrap()` 编译并写 control plane + context docs  
   见 `src/bootstrap-compiler/run-bootstrap.js:82-144`

2. `evaluateContextForRepo()` 读取 Stage-0 runtime state 并做 stage 级上下文选择  
   见 `src/context-routing/evaluator.js:151-163`

3. `recordWorkflowTelemetry()` 把本次 workflow 的 selected assets 等信息写入 `.spec-first/workflows/<workflow>/<slug>/...`  
   见 `src/context-routing/telemetry.js:34-53`

4. 这条内部主链已有 E2E 验证  
   见 `tests/e2e/spec-graph-bootstrap-mainline.sh:21-78`

### 7.3 Stage-0 选择逻辑是真实存在的，不是口头约定

`evaluateContext()` 的真实行为是：

- 读取 `routing.always + routing.stages[stage]`，见 `src/context-routing/evaluator.js:97-105`
- 再评估 `selection_rules`，见 `src/context-routing/evaluator.js:106-114`
- 若 `minimal-context/<stage>.json` 存在，则把它提前到最前，见 `src/context-routing/evaluator.js:116-125`
- 只保留真实存在的 asset，再按预算裁剪，见 `src/context-routing/evaluator.js:127-129`
- 输出 `selected_assets / estimated_tokens / fallback_reason / skipped_rules / freshness_status`，见 `src/context-routing/evaluator.js:138-148`

这意味着 Stage-0 不是“读几个固定 markdown 文件”，而是已经有了 machine-oriented evaluator。

### 7.4 Stage-0 的降级机制也是硬实现

当前 evaluator 的降级层级不是 `Full/Enhanced/Basic`，而是 `L0-L3`：

- `L3 context_dir_missing`：context/control-plane 目录缺失，见 `src/context-routing/evaluator.js:63-72`
- `L3 manifest_incomplete`：manifest 不完整，见 `src/context-routing/evaluator.js:74-83`
- `L2 routing_missing`：routing 缺失，见 `src/context-routing/evaluator.js:85-95`
- `L1 minimal_context_missing`：minimal-context 缺失，见 `src/context-routing/evaluator.js:132-136`
- `L0`：正常

所以必须区分两个层面：

- `SKILL.md` 里的 `Full/Enhanced/Basic` 是 workflow contract 语义
- `src/context-routing/evaluator.js` 里的 `L0-L3` 是当前已落地的代码降级语义

### 7.5 `spec-graph-bootstrap` 的 contract 比当前编译器实现更强

这是本次审查里最重要的微观判断之一。

`skills/spec-graph-bootstrap/SKILL.md` 把自己定义成 graph-informed bootstrap，强调：

- machine-first contract 在 `docs/contracts/spec-graph-bootstrap/`
- 编译职责收敛到 `src/bootstrap-compiler/`
- Full / Enhanced / Basic 模式判定
- CRG readiness / fact extraction / routing generation

相关证据：

- `skills/spec-graph-bootstrap/SKILL.md:20-30`
- `skills/spec-graph-bootstrap/SKILL.md:45-145`
- `skills/spec-graph-bootstrap/SKILL.md:197-487`

但是当前 `bootstrap-compiler` 里仍有明显 sample/default 痕迹：

- `compileRouting()` 直接调用 sample generator，见 `src/bootstrap-compiler/compile-routing.js:9-14`
- `compileMachineArtifacts()` 默认也以 sample manifest 作为输入，见 `src/bootstrap-compiler/compile-machine-artifacts.js:9-22`
- `sample-generator.js` 明确生成 routing、artifact manifest、ownership、review queue 的 sample 数据，见 `src/bootstrap-compiler/sample-generator.js:8-220`
- `runBootstrap()` 默认写入的 context docs 也是 `# summary`、`# module map` 这一类占位内容，见 `src/bootstrap-compiler/run-bootstrap.js:19-28`

因此，代码事实是：

- Stage-0 control plane 已经有真实路径、真实 schema、真实 evaluator、真实 telemetry
- 但 Stage-0 compiler 当前仍**部分处于 scaffold/sample 阶段**
- 所以不能把 `spec-graph-bootstrap` 文档里的全部能力，视为已由 JS 编译器完整落地

### 7.6 CRG 是独立而真实的理解引擎

CRG 不是占位物，核心链路是实打实存在的：

- `src/crg/cli/router.js:6-49` 定义了 17+ 个子命令
- `src/crg/cli/build.js:126-359` 负责图构建、增量变更、局部替换、后处理、fingerprint 更新
- `src/crg/cli/context.js:76-146` 能输出 top hubs / communities / flows / retrieval context
- `src/crg/retrieval/api.js:11-50` 实现 `seed -> expand -> rerank -> semantic-rerank -> pack`

这说明 CRG 不是“将来要做”的模块，而是已经能工作的 graph engine。

### 7.7 但 CRG 与 graph-bootstrap 编译链还没有形成事实自动注入闭环

代码上也能看到这一点：

- `sample-generator.js:61-220` 的 manifest schema 里已经预留了 `inputs.crg.graph_last_built/node_count/edge_count`
- 但 `compileRouting()` 与 `compileMachineArtifacts()` 当前默认仍走 sample 数据，不会主动调用 CRG CLI 或读取 `graph.db`

这意味着：

- **图引擎存在**
- **graph-bootstrap / Stage-0 控制面存在**
- 但二者当前还是“强关联、弱自动绑定”的状态

这是非常重要的产品化缺口。

### 7.8 Stage-0 / graph context ASCII 图

```text
spec:graph-bootstrap
                |
                v
     Stage-0 compiler / orchestration
                |
                +--> .spec-first/workflows/bootstrap/<slug>/
                |      - context-routing.json
                |      - artifact-manifest.json
                |      - freshness.json
                |      - minimal-context/*.json
                |
                +--> docs/contexts/<slug>/
                       - 00-summary.md
                       - architecture/*
                       - code-facts/*
                       - pitfalls/*
                       - injection-index.yaml
                |
                v
        context-routing evaluator(stage)
                |
                +--> selected_assets
                +--> fallback_reason
                +--> level(L0-L3)
                +--> skipped_rules
                |
                v
     plan / work / review workflows consume context
                |
                v
      telemetry -> .spec-first/workflows/<workflow>/<slug>/*.json
```

## 8. 微观层面的完整性判断

### 8.1 Runtime control plane：完整 `[C]`

证据：

- `runInit()` 不只是拷文件，它会：
  - 解析平台与开发者身份，见 `src/cli/commands/init.js:48-98`
  - 构建 preview state，见 `src/cli/commands/init.js:100-109`
  - 处理 legacy state hard reset，见 `src/cli/commands/init.js:111-122`
  - 删除 obsolete assets，见 `src/cli/commands/init.js:124-125`
  - 同步 assets，见 `src/cli/commands/init.js:127-143`

- `state.js` 负责：
  - 规范化 state shape，见 `src/cli/state.js:64-101`
  - 记录 commands / skills / workflowSkills / agents / supportFiles，见 `src/cli/state.js:50-62`
  - 支持 remove / hard reset / prune namespace，见 `src/cli/state.js:152-224`

- `clean` 明确只删 spec-first managed set，不碰用户自定义资产，见 `src/cli/commands/clean.js:65-72`

判断：

- 这条链路已经具备“可安装、可追踪、可清理、可重建”的平台属性。

### 8.2 宿主适配层：完整 `[C]`

证据：

- `PlatformAdapter` 定义了 runtimeRoot / managedRoot / skillsRoot / workflowsRoot / agentsRoot 等接口，见 `src/cli/adapters/base.js:5-145`
- Claude/Codex adapter 分别实现自己的路径与内容转换，见 `src/cli/adapters/claude.js:9-126`、`src/cli/adapters/codex.js:15-129`

判断：

- 宿主适配不是硬编码在 init 里，而是抽象为 adapter 层，这使“单一真源、多宿主分发”具备可扩展性。

### 8.3 治理注入：完整 `[C]`

证据：

- `.developer` 由 `developer.js` 负责解析/生成，见 `src/cli/developer.js:55-112`
- `lang-policy.js` 会幂等注入受管语言与 changelog 治理块到 `CLAUDE.md` / `AGENTS.md`，见 `src/cli/lang-policy.js:20-35`、`src/cli/lang-policy.js:46-115`
- 若 repo 没有 `CHANGELOG.md`，init 会 bootstrap 一份，见 `src/cli/changelog.js:14-27`

判断：

- 这说明 spec-first 不是只管“功能 skill”，而是把协作治理也纳入 runtime 管理面。

### 8.4 验证平面：基本完整 `[R] + [C]`

证据：

- `package.json:9-19` 已经声明 `test:unit`、`test:smoke`、`test:integration`、`test:e2e:crg`
- `tests/e2e/spec-graph-bootstrap-mainline.sh:21-78` 实测 `runBootstrap -> evaluator -> telemetry` 的 Stage-0 compiler mainline
- `spec-code-review` 还能写 run artifact，见 `skills/spec-code-review/SKILL.md:92-99`、`skills/spec-code-review/SKILL.md:615-623`

判断：

- 已有验证能力，但验证结果与运行状态仍分散在多个位置，没有统一“系统健康面板”。

## 9. 完整执行链路是否清晰

答案是：**清晰，但分两层理解才不会误判。**

### 9.1 第一层：runtime 安装与分发链，已经非常清晰

```text
spec-first init
   -> load manifest
   -> sync commands / skills / agents
   -> adapter transform
   -> write state + developer + policy
   -> host restart
```

对应代码：

- `src/cli/commands/init.js:82-173`
- `src/cli/plugin.js:152-247`

### 9.2 第二层：workflow 执行链，主要通过宿主 runtime 内 skill contract 落地

```text
spec-plan
   -> read runtime workflow SKILL.md
   -> optional Stage-0 preload
   -> repo research / requirements grounding
   -> write docs/plans/*
```

```text
spec-work
   -> read plan
   -> optional Stage-0 preload
   -> setup branch/worktree
   -> implement + test
   -> quality/shipping workflow
```

```text
spec-code-review
   -> optional Stage-0 preload
   -> spawn persona reviewers
   -> merge/dedup findings
   -> optional autofix
   -> write run artifact / residual work
```

所以，“执行链是否清晰”的答案不是看 Node CLI 有没有所有子命令，而是看：

- runtime 安装链是否清晰
- wrapper -> workflow skill 的委托是否清晰
- workflow 输出物是否有稳定路径

在这 3 点上，当前答案都是“是”。

## 10. 当前最主要的缺口

下面这些不是主观吹毛求疵，而是代码层能直接证明的结构性缺口。

### 10.1 缺统一 orchestration runtime

当前的 workflow 主执行逻辑大多在 `SKILL.md`，不是统一 JS/TS 执行器。

影响：

- 能力表达很灵活
- 但 phase、state、telemetry、异常恢复、统一观测更难强约束

代码事实：

- wrapper 只是“读 skill 并执行它”，见 `templates/claude/commands/spec/*.md`
- 普通 CLI 并不直接运行 plan/work/review，见 `src/cli/index.js:23-40`

判断：

- 这使系统非常适合 agent-native workflow，但离“统一 workflow engine”还差一步。

### 10.2 Stage-0 compiler 仍部分 sample 化

这是当前上下文控制面最真实的不足。

这里讨论的是 `spec-graph-bootstrap` 所依赖的 Stage-0 编译链，不针对历史 `spec-graph-bootstrap` skill 本身。

代码事实：

- `compileRouting()` 直接 sample，见 `src/bootstrap-compiler/compile-routing.js:9-14`
- `sample-generator.js` 生成大量 sample outputs，见 `src/bootstrap-compiler/sample-generator.js:8-349`
- `runBootstrap()` 默认写入 placeholder markdown，见 `src/bootstrap-compiler/run-bootstrap.js:19-28`

判断：

- control plane 框架是对的
- 但内容编译器还没有完全追上 contract 强度

### 10.3 evaluator 对 fact 级规则还没真正实现

代码事实：

- `evaluateSelectionRule()` 只真正支持 `output_exists.*` 与 `stage_is.*`
- 对 `fact.*` 规则只会记到 `skipped_rules`，见 `src/context-routing/evaluator.js:25-44`

判断：

- 当前路由已经够用
- 但还没有进化到“真正按代码事实动态路由上下文”的程度

### 10.4 系统观测面仍分散

当前观测数据散在：

- runtime state：`.claude/spec-first/state.json` / `.codex/spec-first/state.json`
- Stage-0 control plane：`.spec-first/workflows/bootstrap/<slug>/`
- workflow telemetry：`.spec-first/workflows/<workflow>/<slug>/`
- review artifact：`.spec-first/workflows/spec-code-review/<run-id>/`
- durable docs：`docs/contexts/`、`docs/plans/`、`docs/solutions/`

判断：

- 数据已经有了
- 但还没有一个统一入口把“我这套系统现在是否健康、上下文是否新鲜、哪些 workflow 最近跑过、哪里退化了”串成一个视图

### 10.5 `doctor` 对 CRG 的检测还不够本地开发友好

代码事实：

- `checkCrgNativeModules()` 用的是 `spawnSync('spec-first', ['crg', '--help'])`，见 `src/cli/commands/doctor.js:335-345`
- 相比之下，`spec-update` skill 已经为 repo-local source checkout 设计了回退思路，见 `skills/spec-update/SKILL.md:1-54`

判断：

- `doctor` 的检测策略还可以进一步向“本地源码环境也能自校验”收敛。

## 11. 面向业界领先的优化建议

以下建议都严格建立在当前代码事实之上，不是脱离实现的空想。  
为与配套 CRG 文档保持一致，本节定义的是 **平台级落地顺序**，不是某个子系统内部文件级改造顺序。

平台级正确顺序应理解为：

1. 先补底座事实质量
2. 再补 Stage-0 / Context 编译闭环
3. 最后再做统一执行器与统一观测面

### 11.1 先补 CRG 底座质量，而不是先做平台化外壳

这一项对应配套 CRG 文档中的：

1. 强语义生产层
2. `code_role` 分层
3. generation health gate

原因很直接：

- `spec-first` 的 Stage-0、review-context、architecture、impact、routing 都会消费 CRG 事实
- 如果底座事实质量不先提升，先做 runtime registry / status dashboard，只会把“薄语义、弱去噪”的问题平台化

因此，这一项是 **平台级 P0**，但具体 `src/crg` 施工顺序仍以 CRG 文档 `8.1-8.3` 为准。

### 11.2 把 `spec-graph-bootstrap` 所依赖的 Stage-0 compiler 从 sample 版推进到真实编译版

建议优先级很高，因为这会直接提升 Stage-0 的可信度。

优先做 3 件事：

1. 用真实 CRG stats/context 输出填充 `artifact-manifest.json`
2. 用真实 analyzer 输出替代 `DEFAULT_CONTEXT_DOCS`
3. 让 `compileRouting()` 不再只生成 sample，而是基于真实产物存在性与风险信号生成 routing

### 11.3 让 context routing 真正支持 fact-based rule

当前已有 `fact.*` 规则入口，但只是跳过，见 `src/context-routing/evaluator.js:39-43`。

建议：

- 实现 `fact.graph_support_state`、`fact.code_facts_confidence`、`fact.risk_hotspot_exists` 等规则求值
- 让 routing 从“stage + output existence”升级到“事实驱动上下文裁剪”

这一步应排在真实编译之后，因为没有真实 fact 输入，rule engine 只会继续停留在壳子层。

### 11.4 把 Stage-0 evaluator 真正接进 workflow runtime

当前 `spec-plan/spec-work/spec-code-review` 都在 `SKILL.md` 里写了 Stage-0 预载流程，但这仍主要是 contract 级定义，见：

- `skills/spec-plan/SKILL.md:55-99`
- `skills/spec-work/SKILL.md:22-64`
- `skills/spec-code-review/SKILL.md:11-55`

建议：

- 提供一个统一 helper/CLI 接口，让 workflow 在运行时直接复用 `evaluateContextForRepo()` 与 `recordWorkflowTelemetry()`
- 把“按 stage 选 context”从手册提升为执行器默认能力

### 11.5 补一个统一 workflow runtime registry

这一步很重要，但它不应早于前面的底座质量与 Stage-0 闭环工作。

目标：

- 把 manifest、workflow skill、artifact path、telemetry schema、run status 统一到一个 machine-readable registry

当前依据：

- command 映射已经在 manifest 中，见 `.claude-plugin/plugin.json:12-103`
- skill 分类逻辑已经在 `syncSkills()` 中，见 `src/cli/plugin.js:181-220`

优化方向：

- 从“只有 command -> skill 映射”升级成“workflow registry”
- registry 中直接声明：
  - workflow 名
  - backing skill
  - stable artifacts
  - telemetry schema
  - required Stage-0 stage
  - allowed sub-skills / agents

### 11.6 做统一 system doctor / status dashboard

建议新增一个聚合状态命令，例如：

- `spec-first status`

聚合展示：

- manifest / runtime 同步状态
- graph-bootstrap / Stage-0 freshness
- graph freshness
- telemetry 最近运行记录
- docs/contexts 是否缺关键产物
- review artifact / todos 是否堆积

这是当前体系从“高级框架”走向“产品化平台”的关键一步，但正确时机是在底座质量与编译闭环补齐之后。

### 11.7 建立统一 retention/cleanup 策略

现在 runtime asset 有 state 化管理，但 workflow telemetry 与 run artifacts 还没有统一 retention 机制。

建议：

- 为 `.spec-first/workflows/**` 引入过期清理策略
- 区分 durable artifact 与 ephemeral artifact
- 让 `clean` / `doctor` / `status` 对这些资产形成统一认识

## 12. 最终判断

### 12.1 是否完整

**结论：整体完整，但不是“所有层都同等成熟”。**

更准确地说：

- runtime control plane：`完整`
- workflow control plane：`基本完整`
- context control plane：`部分完整`
- graph engine：`基本完整`
- 统一 orchestration / observability：`部分完整`

### 12.2 执行链路是否清晰

**结论：清晰。**

但正确理解方式是：

- `spec-first` 普通 CLI 主要负责**运行时安装、治理、诊断、清理**
- `crg` 负责**图理解引擎**
- 真正的 `spec-*` workflow 执行主要发生在**宿主 runtime 安装后的 command wrapper + workflow skill contract**

如果按这个模型理解，整条链路是连贯的。

### 12.3 这套体系的真实定位

基于当前代码事实，`spec-first` 的真实定位不是：

- 一个命令集合
- 一组 prompt
- 一个简化插件

而是：

**一个以单一真源分发、多宿主适配、Stage-0 上下文控制面、主 workflow 闭环、知识沉淀闭环为核心的 agent-native 工程效能平台雏形。**

“雏形”二字不是保守，而是准确：

- 框架与主骨架已经成立
- 下一阶段正确顺序应是：
  1. 先补 CRG 底座质量
  2. 再补真实上下文编译与 fact-based routing
  3. 最后收敛统一执行器与统一观测面

只要按这个顺序补齐，`spec-first` 才会从“体系完整”进一步跃迁到“产品级领先”，而不是过早平台化后把底层缺口固化进系统表面。
