# Spec-First 工具集成现状与完善建议

> 分析日期：2026-03-15
> 分析范围：围绕 `2.1 全项目功能矩阵（10 + 2 系统）` 中的“工具集成”维度，分析 Spec-First 当前状态、与对标项目差距、以及可参考的补齐方向。

---

## 1. 结论摘要

在当前综合矩阵中，Spec-First 的“工具集成”被评为 `⭐⭐`。这个判断基本成立。

原因不是 Spec-First 完全没有工具集成，而是它目前的工具集成更偏向：

- `Claude Code / Codex` 宿主接入
- `MCP + Skills + Hooks` 的基础注册与诊断
- `viewer` 可视化面板

但在以下方面仍明显弱于工具集成能力更强的项目：

- 多运行时适配广度
- 浏览器 / LSP / 外部工具的产品化接入深度
- 一站式安装与自动探测体验
- 工具能力抽象层与按需装载机制
- 面向专项任务的工具化模板与报告产物

一句话概括：

> Spec-First 已经有“工具集成底座”，但还没有发展成“工具集成平台”。

从当前改造优先级看，执行顺序应调整为：

1. 先把 `必备 Skills + 必备 MCP` 做成稳定基线
2. 再把宿主扩展从 `Claude Code + Codex` 提升到 `Claude / Codex / Gemini / Cursor`
3. 最后再做更高阶的工具编排、专项模板和生态层发布

目标安装约束：

- 项目安装时，`必备 Skills + 核心 MCP` 默认强制安装
- 非基线能力才进入后续的组件化安装与可选扩展

当前事实：

- 当前已实现 `postinstall` 检测与提示
- 当前已实现 `update / init --bootstrap / doctor` 作为补齐入口
- 当前尚未完全实现“首次安装即默认强制补齐基线能力”

---

## 2. Spec-First 当前工具集成现状

### 2.0 当前现状架构

从源码看，Spec-First 当前的工具集成架构更接近“宿主接入层 + 运行支撑层”，而不是“统一工具编排层”。

可以概括为下面这张图：

```text
┌──────────────────────────────────────────────────────────────┐
│                      Host Layer                             │
│  Claude Code                    Codex                       │
│  ~/.claude/skills               ~/.codex/skills             │
│  ~/.config/claude-code/mcp.json ~/.codex/config.toml        │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                   Bootstrap / CLI Layer                     │
│  spec-first update   spec-first doctor   spec-first viewer  │
│  spec-first hooks    postinstall                               │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                  Integration Support Layer                  │
│  bootstrap-manifest.ts                                      │
│  skill-commands.ts                                          │
│  tool-integration/                                          │
│    - hook-installer                                         │
│    - ai-runtime-hook                                        │
│    - session-hook                                           │
│    - context-sync                                           │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                    Skill Runtime Layer                      │
│  research / task / review / verify 等 Skill                │
│  以 allowed-tools 方式局部声明工具                          │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                   External Tool Layer                       │
│  serena / fetch / context7 / playwright-mcp / shell         │
└──────────────────────────────────────────────────────────────┘
```

当前架构的特点是：

- `bootstrap-manifest.ts` 负责声明“需要哪些工具”
- `update / doctor` 负责“把工具接上并诊断”
- `tool-integration/*` 负责“宿主侧 wiring”
- Skill 自己决定要不要使用某个工具

这套结构的优点是简单、稳定、工程化；缺点是缺少一个统一的“工具能力中台”。

### 2.0.1 从安装到决策使用的完整流程图

从“用户安装 Spec-First”到“运行时决定用哪个工具”，完整流程应理解为下面这条链路：

```text
┌────────────────────────────────────────────────────────────────────┐
│  Step 1. 安装 Spec-First                                          │
│  pnpm/npm install -g spec-first                                   │
└────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────────┐
│  Step 2. postinstall 检测与提示                                   │
│  - 探测 Claude/Codex 路径                                          │
│  - 检查宿主配置目录                                                │
│  - 检查 Skills 注册状态                                            │
│  - 输出安装后引导                                                  │
└────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────────┐
│  Step 3. 基线能力补齐入口                                          │
│  A. spec-first update                                              │
│  B. spec-first init --bootstrap                                    │
│  C. spec-first doctor                                              │
└────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────────┐
│  Step 4. 读取 bootstrap-manifest                                  │
│  - REQUIRED_SKILLS                                                 │
│  - REQUIRED_MCP_SERVERS                                            │
│  作为基线能力的单一事实来源                                         │
└────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────────┐
│  Step 5. ensureHostBootstrap 执行检查/补齐                         │
│  - 补齐 Claude/Codex MCP 配置                                      │
│  - 补齐必备外部 Skills                                             │
│  - 可选执行 binary probe                                           │
└────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────────┐
│  Step 6. 宿主侧 wiring                                             │
│  - skill-commands 同步 Spec-First Skills                           │
│  - hooks / ai hooks / session hooks                               │
│  - viewer 可视化入口                                               │
└────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────────┐
│  Step 7. 进入运行时                                                │
│  - orchestrate / research / review / verify                       │
│  - Skill front matter 声明 required_mcps                          │
└────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────────┐
│  Step 8. 运行时工具决策                                            │
│  当前：Skill 局部声明 + required_mcps 检查                          │
│  目标：Tool Registry + Capability Matrix + Selection Policy        │
└────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────────┐
│  Step 9. 工具执行                                                  │
│  - 代码分析 -> serena                                              │
│  - 外部调研 -> fetch + context7                                   │
│  - 页面验收 -> playwright-mcp                                      │
│  - 降级 -> shell / manual template                                 │
└────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────────┐
│  Step 10. 结果沉淀                                                 │
│  - findings                                                        │
│  - research-evidence.md                                            │
│  - browser-verification.md                                         │
│  - security-audit-report.md                                        │
└────────────────────────────────────────────────────────────────────┘
```

这张图里需要特别区分两件事：

- `Step 2-6` 解决的是“基础能力有没有装好”
- `Step 7-10` 解决的是“运行时该不该用、应该用哪个工具、结果如何沉淀”

当前 Spec-First 的优势主要在 `Step 2-6`，而短板主要在 `Step 8-10`。

### 2.0.2 当前架构的主要问题

从架构层面看，当前工具集成存在 4 个核心缺口：

1. `接入` 和 `使用` 脱节  
Manifest 解决了“配没配置”，但没有解决“何时使用、如何选择”。

2. 缺少统一能力抽象  
没有 registry / capability matrix / selection policy，导致每个 Skill 自己决定工具使用方式。

3. 缺少标准化输出  
工具执行结果没有统一沉淀为 evidence / verification / audit 产物。

4. 缺少宿主扩展层  
目前更像 “Claude Code + Codex 的集成工具”，而不是“多宿主工具平台”。

### 2.1 已有能力

#### 2.1.1 宿主接入：Claude Code + Codex

当前 Spec-First 已明确支持 `Claude Code` 和 `Codex` 两类宿主。

可见证据：

- `README.md` 明确写有 `Claude Code or Codex`
- `spec-first update` 会把 Skills 推送到 `~/.claude/` 与 `~/.codex/`
- `src/shared/skill-commands.ts` 里已有 Claude / Codex 双宿主注册逻辑

这意味着 Spec-First 已经不是纯文档框架，而是有宿主集成能力的 CLI 工具。

#### 2.1.2 MCP 清单驱动

`src/config/bootstrap-manifest.ts` 已经把必需 MCP 做成统一 manifest，目前至少包括：

- `sequential-thinking`
- `context7`
- `serena`
- `fetch`
- `playwright-mcp`

当前 `bootstrap-manifest.ts` 同时还定义了“必备 Skills”清单，但这一层现在仍然非常薄，仅包含：

- `find-skills`
- `skill-creator`

这说明当前工具集成的现实状态是：

- Spec-First 自身 Skill 体系已经能同步到 `Claude / Codex`
- 但“外部通用 Skills 基线”还没有形成真正的平台级能力包
- 必备 MCP 已经比必备 Skills 更成熟

因此，从执行顺序上看，下一阶段不应优先扩很多新工具，而应先把 `必备 Skills + 必备 MCP` 形成可维护、可诊断、可扩展的基础能力层。

这点很关键，因为它说明 Spec-First 已经具备：

- 工具依赖清单化
- 宿主差异配置
- binary probe 诊断入口

也就是说，MCP 接入不是散落在脚本里，而是进入了“单一事实来源”。

#### 2.1.3 update / doctor / hooks / viewer 已形成基础闭环

当前工具链相关的 CLI 能力已经比较完整：

- `update`: 刷新 Skills / MCP / Hooks
- `doctor`: 检查宿主 bootstrap、MCP、Hooks、配置状态
- `hooks`: Git / AI / Session hook 集成
- `viewer`: Stage Viewer 可视化面板

相关代码分布也比较清晰：

- `src/cli/commands/update.ts`
- `src/cli/commands/doctor.ts`
- `src/core/tool-integration/*`
- `src/cli/commands/viewer.ts`

这说明 Spec-First 的工具集成现状不是“缺失”，而是“集中在工程运行支撑层”。

#### 2.1.3.1 当前安装引导行为

结合当前实现，安装 `spec-first` 时的行为分为三层：

1. `postinstall` 检测与提示
   - 安装后会探测宿主路径、配置目录、Skill 注册状态
   - 会给出引导信息
   - 但不等于“首次安装就完整强制补齐所有基础能力”

2. `spec-first update` 执行补齐
   - 当前真正负责补齐必备 Skills / MCP 的主入口
   - 通过 `ensureHostBootstrap()` 读取 manifest 并执行检查/补齐

3. `spec-first init --bootstrap` 交互式补齐
   - 初始化 Feature 时可选择执行 bootstrap
   - 当前属于“显式启用”的初始化增强路径

因此，当前现状应准确表述为：

- 已有安装后提示与 bootstrap 引导
- 已有补齐入口
- 但“首次安装即默认强制补齐基线能力”还没有完全落地

这也是为什么后续改造要把“项目安装时默认强制安装基线能力”提升为明确目标，而不是误写成现状。

#### 2.1.4 Skill 内部已开始声明工具白名单

例如：

- `05-research` 已允许 `mcp__fetch__fetch`
- `06-task` 已允许部分 `serena` 工具

这表明 Spec-First 已经开始把“某个阶段允许使用哪些工具”纳入 Skill 设计，而不是完全依赖模型自由发挥。

这是一条很好的方向。

### 2.2 当前边界

虽然已有底座，但当前工具集成仍有明显边界。

#### 2.2.1 宿主覆盖面窄

当前主集成面还是：

- Claude Code
- Codex

而没有形成一等公民级别的：

- OpenCode
- Gemini CLI
- Cursor
- Copilot
- Qwen / Windsurf / Aider 等

这也是为什么矩阵中“多运行时”只给到 `⭐`，并进一步拖累“工具集成”评分。

#### 2.2.2 MCP 已配置，但未完全产品化

虽然 manifest 中已经声明了 `playwright-mcp`、`fetch`、`serena` 等工具，但当前更像：

- “保证环境里有这些工具”

而不是：

- “针对具体业务场景，系统能自动选择并编排这些工具”

比如：

- 浏览器工具已列为必需 MCP，但目前没有形成明确的浏览器任务策略层
- `serena` 已接入，但更多用于局部技能，不是统一代码导航编排层
- `fetch` 可用，但没有形成统一的外部资料采集报告链路

#### 2.2.3 缺少工具能力抽象层

Spec-First 目前有 `tool-integration` 目录，但这层更多处理：

- hook 安装
- context sync
- session hook

还没有形成真正的：

- `tool capability registry`
- `tool selection strategy`
- `tool fallback policy`
- `task type -> tool bundle` 映射

这使得工具集成还停留在“接入”，没有进入“编排”。

#### 2.2.4 缺少一站式安装体验

当前 `update / doctor` 体验已经不错，但仍偏工程化。

缺少的能力包括：

- 自动探测本机支持哪些宿主
- 按宿主生成最优安装计划
- 基线能力强制安装 + 非基线能力可选安装
- dry-run 安装计划预览
- 不同宿主的差异化配置说明

也就是说，当前更像“工程师工具”，还不是“生态配置器”。

---

## 3. 为什么 Spec-First 在“工具集成”上只有 2 星

从对标项目看，Spec-First 当前更像：

- 有宿主注册能力
- 有 MCP 与 hook 基础设施
- 有诊断与可视化

但还不具备下列高阶能力：

| 能力层 | Spec-First 当前状态 | 影响 |
|------|------------------|------|
| 宿主覆盖 | Claude Code + Codex 为主 | 可用面窄 |
| 工具抽象 | 以配置和 hook 为主 | 难以按任务动态编排 |
| 安装体验 | update / doctor 较工程化 | 非技术用户门槛高 |
| 外部工具深度 | Playwright/MCP 已声明但未全面产品化 | 使用深度不足 |
| 专项工具链 | 缺少安全审计、专家角色、专项报告层 | 工具集成广度不足 |

因此，`⭐⭐` 的判断更准确地说，是：

> “底座存在，但产品化和生态化不够。”

---

## 4. 可重点参考的项目与内容

### 4.1 GSD-2：外部工具深度最强

GSD-2 在工具集成上最值得参考的不是“有很多工具”，而是它把工具真正纳入主流程。

可参考点：

- 首次运行 setup wizard，支持 LLM provider + tool keys
- `14 extensions` 自动加载
- 浏览器工具 `Browser Tools`
- `MCPorter` 按需 MCP 集成
- `LSP` 一等能力

对 Spec-First 的启发：

- 不要只做“必需 MCP 清单”，要做“任务编排中的工具能力”
- 不要只做“安装”，要做“首次可用体验”
- 不要只做“工具存在性检查”，要做“工具是否被主流程稳定消费”

### 4.2 Gentle-AI：安装与生态配置最强

Gentle-AI 的强项不是单一工具，而是“把 agent 生态配置成系统”。

可参考点：

- agent adapter 模式
- components 维度安装：skills / mcp / persona / permissions / memory
- `--dry-run`
- 自动探测环境依赖
- per-agent config strategy
- 明确的 supported agents 表

对 Spec-First 的启发：

- 可以把当前 `update / doctor / setup` 升级成 `ecosystem configurator`
- 可以把工具集成拆成组件，而不是全量强耦合
- 可以增加“宿主能力矩阵”，把不同宿主的 Skills / MCP / Hooks / Browser / Viewer 支持状态说清楚

### 4.3 agency-agents：多工具分发与角色生态最强

agency-agents 的价值不在“工程流程”，而在：

- 一套 agent 内容，多工具转换和安装
- Claude / Copilot / Gemini / OpenCode / Cursor / Aider / Windsurf / Qwen 等多宿主分发
- 安装脚本与转换脚本成体系

对 Spec-First 的启发：

- Spec-First 未来可以不只管理 `skills`，还可以管理 `profiles / expert agents / wrappers`
- 可以为不同宿主自动生成不同格式的集成产物
- 可以把“多宿主发布”从手工支持升级为标准流程

### 4.4 code-audit：专项工具链与证据纪律

code-audit 最值得参考的不是宿主数量，而是：

- 审计清单化
- 报告模板化
- 工具证据纪律
- 专项任务的多 agent 审查流程

对 Spec-First 的启发：

- 工具集成不应只停留在“接浏览器 / 接 MCP”
- 还应进入“专项场景模板”
- 例如：
  - 安全审计检查表
  - API 联调检查表
  - 集成测试报告模板
  - 外部调研证据模板

---

## 5. Spec-First 可以补齐什么

### 5.1 P0：先建立“必备 Skills + 必备 MCP”基线

这一阶段不追求“功能很多”，而追求“最小但可靠的工具集成底座”。

#### 5.1.1 必备 Skills 基线

当前代码里，真正进入 bootstrap manifest 的外部通用 Skill 只有两个：

- `find-skills`
- `skill-creator`

这两项的价值分别是：

- `find-skills`：补足生态发现能力，避免用户和 Agent 对“已有能力”缺少统一入口
- `skill-creator`：补足能力生产能力，避免 Spec-First 只能消费现有 Skill，不能扩展新 Skill

如果从“平台化基线”看，这两个 Skill 过于偏辅助，还缺少直接支撑研发主流程的通用能力分类。建议第一批必备 Skills 分为三层：

1. `平台基础`
   - `find-skills`
   - `skill-creator`

2. `研发执行`
   - 与代码导航、调试、审查、验证直接相关的基础技能入口
   - 优先不重复造轮子，先通过 Spec-First 自身 Skill + MCP 组合覆盖

3. `专项增强`
   - 安全审计
   - 专家角色
   - 浏览器验收

当前执行建议：

- `P0-A`：保持 `find-skills / skill-creator` 作为 bootstrap 必备 Skill，不扩容过多
- `P0-B`：补一份“必备 Skill 基线说明”，明确哪些是平台级外部 Skill，哪些是 Spec-First 内建 Skill
- `P0-C`：把 Skill 安装从“能装上”升级为“项目安装时默认强制安装，并且按宿主可验证”

验收标准：

- `update` 能明确报告各宿主下的必备 Skill 状态
- `doctor` 能区分“Spec-First 内建 Skill 同步问题”与“外部必备 Skill 缺失”
- 文档中明确外部 Skill 与内建 Skill 的边界

#### 5.1.2 必备 MCP 基线

当前 manifest 中的必备 MCP 为：

- `sequential-thinking`
- `context7`
- `serena`
- `fetch`
- `playwright-mcp`

这 5 个 MCP 本身已经覆盖了当前最关键的 5 类能力：

| MCP | 能力角色 | 当前优先级 |
|------|----------|------------|
| `sequential-thinking` | 复杂任务拆解与推理 | 必备 |
| `context7` | 官方文档查询 | 必备 |
| `serena` | 代码结构导航与符号级分析 | 必备 |
| `fetch` | 外部资料抓取 | 必备 |
| `playwright-mcp` | 浏览器交互与页面验收 | 必备，但按场景启用 |

当前执行建议不是新增更多 MCP，而是先把这 5 个 MCP 产品化：

- `P0-D`：把它们定义为“Spec-First 核心 MCP 基线”
- `P0-E`：项目安装时默认强制安装这 5 个 MCP，并让 `doctor` 输出每个 MCP 的能力角色和缺失影响
- `P0-F`：让 `research / review / verify / orchestrate` 显式消费这些 MCP
- `P0-G`：建立缺失 MCP 时的降级策略

推荐的降级策略：

| MCP 缺失 | 降级方式 |
|---------|----------|
| `serena` 缺失 | 退回 `rg + shell`，但标记“分析精度下降” |
| `fetch` 缺失 | 退回浏览器或手工提供资料 |
| `playwright-mcp` 缺失 | 退回手工验收模板 |
| `context7` 缺失 | 退回本地文档与官方站点手工查询 |
| `sequential-thinking` 缺失 | 允许流程继续，但复杂任务需显式提示拆解能力下降 |

验收标准：

- 核心 MCP 的用途、调用阶段、降级策略都被文档化
- `doctor` 能告诉用户“缺了什么”和“会影响什么”
- `orchestrate` 和关键 Skill 能基于 MCP 可用性选择工具路径

#### 5.1.3 P0 的真正目标

P0 的目标不是“再接一批工具”，而是把当前已有工具变成一套稳定基线：

- 对外可说明
- 对内可诊断
- 在流程中可被稳定消费

只有这一步做稳，后面的多宿主扩展才不会变成“把不稳定能力复制到更多宿主”。

### 5.2 P0：把现有工具集成能力说清楚、用起来

在建立好 `必备 Skills + 必备 MCP` 基线后，再做现有能力显性化。

建议：

- 补一份正式的“宿主能力矩阵”
  - Claude Code / Codex 当前支持什么
  - 哪些命令依赖 MCP
  - viewer / hooks / doctor 在不同宿主下如何工作
- 补一份“工具集成说明文档”
  - MCP 清单
  - hook 清单
  - viewer 作用
  - 失败时如何诊断
- 在 orchestrate / review / verify 中显式消费 `fetch / context7 / serena / playwright`

目标：

- 让“已接入工具”从配置层进入流程层

### 5.3 P1：扩展宿主支持，从双宿主到多宿主

当前从实现事实看，Spec-First 真正稳定支持的宿主仍然是：

- `Claude Code`
- `Codex`

而用户要求的下一阶段方向是：

- 扩展支持 `Codex`
- 扩展支持 `Claude`
- 扩展支持 `Gemini`
- 扩展支持 `Cursor`
- 后续可再扩展到更多编程工具

这里需要先纠正一个工程判断：`Codex` 与 `Claude` 现在不是“未来支持目标”，而是“当前稳定基线宿主”；真正的扩展重点应是：

1. 保持 `Claude / Codex` 完整兼容
2. 在统一适配层下新增 `Gemini`
3. 再评估 `Cursor`
4. 之后再考虑 `Copilot / OpenCode / Windsurf`

#### 5.3.1 宿主扩展优先级建议

建议优先级如下：

1. `Claude`
   - 已有能力最完整
   - 继续作为功能定义基准宿主

2. `Codex`
   - 已有稳定集成
   - 作为第二基准宿主，确保双宿主一致性

3. `Gemini`
   - 适合作为第一个新增宿主验证 Host Adapter 设计
   - CLI / agent 化方向相对清晰

4. `Cursor`
   - 有较强价值，但宿主模型更接近 IDE/Agent 混合形态
   - 建议在 Host Adapter 稳定后接入

#### 5.3.2 宿主扩展范围

每个新增宿主不要求一开始支持全部能力，建议按 3 级接入：

| 级别 | 内容 | 说明 |
|------|------|------|
| L1 | detection + capability | 能识别宿主、输出能力矩阵 |
| L2 | skills + mcp | 能完成基础工具接入 |
| L3 | hooks + session + viewer | 能接入完整工作流增强 |

建议要求：

- `Gemini` 至少做到 `L2`
- `Cursor` 至少做到 `L1-L2`
- `Claude / Codex` 继续保持 `L3`

#### 5.3.3 宿主扩展的前置条件

在开始 `Gemini / Cursor` 之前，必须先完成：

- `Host Adapter` 抽象
- `Capability Matrix` 抽象
- `必备 Skills + 必备 MCP` 基线收敛

否则每加一个宿主，都会继续把逻辑散落到 `update / doctor / bootstrap-manifest / skill-commands` 里。

### 5.4 P1：把工具集成做成能力层

建议新增三层抽象：

1. `tool registry`
   - 定义工具名称、宿主要求、场景标签、降级策略

2. `tool capability matrix`
   - 定义不同宿主支持什么能力

3. `tool selection policy`
   - 让任务根据类型自动选择 `serena / fetch + context7 / browser / shell`

这会让 Spec-First 从“安装了几个工具”升级到“能调度这些工具”。

### 5.5 P1：补浏览器与外部资料采集的产品化链路

当前 `playwright-mcp`、`fetch`、`context7` 已经进入 manifest，但还可以更进一步：

- 为 research 阶段增加“外部证据采集模板”
- 为 verify 阶段增加“浏览器验收模板”
- 为 review 阶段增加“UI / 表单 / 外部接口检查模板”

这样工具集成才能体现在产物里，而不是只体现在环境配置里。

### 5.6 P2：扩展多宿主与多工具发布

建议参考 `Gentle-AI + agency-agents`：

- 增加 OpenCode / Gemini / Cursor / Copilot 适配计划
- 为不同宿主生成不同配置
- 支持 dry-run 安装计划
- 允许按组件启用：
  - skills
  - MCP
  - viewer
  - hooks
  - expert profiles

### 5.7 P2：专项工具链模板化

建议参考 `code-audit`：

- 安全审计清单与报告模板
- 工具结果必须有证据来源
- 对高风险结论增加“证据不足不输出”规则
- 将专项检查结果沉淀为标准产物，而不是自由文本

---

## 6. 建议的落地顺序

| 阶段 | 目标 | 建议内容 |
|------|------|---------|
| P0 | 建立稳定基线 | 必备 Skills 基线、核心 MCP 基线、宿主能力矩阵、工具集成说明 |
| P1 | 扩成可调度平台 | Host Adapter、tool registry、capability matrix、selection policy、浏览器/调研模板 |
| P2 | 扩成生态层 | Gemini / Cursor 等宿主扩展、非基线组件化安装、专项工具链模板、专家 profile 接入 |

---

## 7. 详细优化方案

### 7.0 优化后的目标架构

优化后的工具集成不应继续沿用“manifest + hooks + skill 局部声明”的弱编排模型，而应升级为“分层能力架构”。

建议目标架构如下：

```text
┌────────────────────────────────────────────────────────────────────┐
│                        Host Adapter Layer                         │
│  Claude Code | Codex | OpenCode | Gemini | Cursor | Copilot      │
│  负责配置目录、skills、mcp、hooks、viewer、project scope 差异     │
└────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────────┐
│                      Component Install Layer                      │
│  install/update 默认强制基线；非基线能力支持 --component 扩展      │
│  dry-run / detect / repair / validate                            │
└────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────────┐
│                        Tool Capability Layer                      │
│  tool-registry                                                    │
│  capability-matrix                                                │
│  tool-selection-policy                                            │
│  tool-fallback-policy                                             │
└────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────────┐
│                        Workflow Integration Layer                 │
│  research bundle   review bundle   verify bundle   audit bundle   │
│  按任务类型选择 serena / fetch+context7 / browser / shell / experts │
└────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────────┐
│                          Output Layer                             │
│  research-evidence.md                                             │
│  browser-verification.md                                          │
│  security-audit-report.md                                         │
│  findings / verify / archive 标准化产物                           │
└────────────────────────────────────────────────────────────────────┘
```

### 7.0.1 优化后各层职责

#### Host Adapter Layer

职责：

- 描述不同宿主的配置路径和能力边界
- 管理 Skills / MCP / Hooks / Viewer 的宿主差异
- 支持未来多宿主扩展

建议代码落点：

- `src/core/host-adapters/types.ts`
- `src/core/host-adapters/registry.ts`
- `src/core/host-adapters/<host>-adapter.ts`

#### Component Install Layer

职责：

- 将工具集成从“全量 update”升级为“基线强制安装 + 非基线按组件安装”
- 支持 dry-run、修复、验证
- 统一管理安装计划

建议代码落点：

- `src/cli/commands/update.ts`
- `src/core/tool-integration/install-plan.ts`

#### Tool Capability Layer

职责：

- 统一定义有哪些工具
- 每种工具适合哪些场景
- 宿主是否支持该工具
- 不可用时如何降级

建议代码落点：

- `src/core/tool-integration/tool-registry.ts`
- `src/core/tool-integration/capability-matrix.ts`
- `src/core/tool-integration/tool-selection.ts`

#### Workflow Integration Layer

职责：

- 将工具能力真正接入 `research / review / verify / audit`
- 不再由每个 Skill 临时决定工具，而由任务类型驱动工具组合

建议代码落点：

- `skills/spec-first/05-research/SKILL.md`
- `skills/spec-first/08-review/SKILL.md`
- `skills/spec-first/12-verify/SKILL.md`
- `src/core/process-engine/advance.ts`

#### Output Layer

职责：

- 让工具执行结果沉淀为标准产物
- 形成证据链、验收链、审计链

建议代码落点：

- `docs/templates/research-evidence.md`
- `docs/templates/browser-verification.md`
- `docs/templates/security-audit-report.md`

### 7.0.2 从现状架构到目标架构的迁移原则

迁移时建议遵守 6 条原则：

1. 不推翻现有 manifest  
保留 `bootstrap-manifest.ts` 作为接入层单一事实来源。

2. 不一次性改所有 Skill  
先从 `research / review / verify` 三个高价值阶段接入统一选择策略。

3. 先统一抽象，再扩展宿主  
先做 registry / capability / selection，再做 Gemini / Cursor 等新增宿主。

4. 先让结果可沉淀，再追求更多工具  
优先把现有 `fetch / context7 / serena / playwright-mcp` 的结果沉淀成标准产物。

5. 先收敛基线，再新增宿主  
优先把 `Claude / Codex + 核心 Skills + 核心 MCP` 做稳，再接 `Gemini / Cursor`。

6. 先保证配置写入安全，再扩大自动补齐范围  
任何面向 `~/.claude`、`~/.codex` 等用户级配置的写入，都必须具备 backup、merge、rollback、idempotency。

### 7.1 总体目标

工具集成优化不建议以“再接几个 MCP”为目标，而应拆成三层：

1. `接入层`
   - 解决“工具有没有装上、宿主能不能识别”

2. `能力层`
   - 解决“系统知不知道什么时候该用哪个工具”

3. `产物层`
   - 解决“工具执行结果能不能沉淀为规范化证据、报告和阶段产物”

对应到 Spec-First，建议采用如下总体路线：

| 层级 | 当前状态 | 优化目标 |
|------|----------|----------|
| 接入层 | 已有 update / doctor / manifest / hooks | 扩成统一宿主与组件安装器 |
| 能力层 | 局部技能直接点名工具 | 增加 registry / capability / selection policy |
| 产物层 | findings 中有零散记录 | 固化为 research / review / verify 的模板化输出 |

### 7.2 P0：把当前基线做稳并显性化

#### 7.2.-1 P0 阶段门禁

只有同时满足以下条件，才能从 `P0` 进入 `P1`：

- 基线能力定义稳定：必备 Skills / 核心 MCP 口径冻结
- `postinstall / init --bootstrap / update / doctor` 口径一致
- 配置写入具备 backup / merge / rollback / idempotency
- `research / review / verify` 三个阶段已显式消费核心工具
- 安装链路与基线补齐测试通过

#### 7.2.0 第一批执行范围

当前计划开始执行工具集成优化时，建议第一批只做下面两类：

1. `必备 Skill 基线`
   - `find-skills`
   - `skill-creator`

2. `核心 MCP 基线`
   - `sequential-thinking`
   - `context7`
   - `serena`
   - `fetch`
   - `playwright-mcp`

这一步不追求“多”，只追求“稳定、可诊断、可在流程中真正使用”。

并且增加一条安装原则：

- 项目安装时默认强制安装上述基线能力，不提供常规的“跳过基线安装”路径

#### 7.2.0.1 配置写入安全机制

在开始“默认强制安装基线能力”之前，必须先建立配置写入安全机制。

至少应包括：

- 写入前自动备份
- merge 优先，避免粗暴覆盖用户配置
- 检测配置冲突并输出提示
- 写入失败时支持回滚
- 同一版本重复执行保持幂等

重点适用位置：

- `~/.codex/config.toml`
- `~/.claude/...`
- Session hooks / AI hooks / MCP config

#### 7.2.1 建立宿主能力矩阵

目标：

- 明确 `Claude Code / Codex` 当前已支持哪些能力
- 为未来的 `OpenCode / Gemini / Cursor / Copilot` 留出可扩展结构

建议新增：

- `docs/reference/host-capability-matrix.md`

建议矩阵字段：

| 宿主 | Skills | MCP | Hooks | Viewer | Browser | Serena | Fetch | 备注 |
|------|--------|-----|-------|--------|---------|--------|-------|------|

建议来源：

- `src/config/bootstrap-manifest.ts`
- `src/shared/skill-commands.ts`
- `src/cli/commands/update.ts`
- `src/cli/commands/doctor.ts`

验收标准：

- 用户只看这一份矩阵，就能知道当前宿主支持边界
- doctor 输出能引用这份矩阵中的定义

#### 7.2.2 建立工具集成总说明

目标：

- 把当前零散在 README、doctor、manifest、skills 里的工具说明整合成一份“操作文档”

建议新增：

- `docs/reference/tool-integration-overview.md`

建议覆盖：

- 必需 MCP 列表
- 每个 MCP 的用途
- 失败时如何诊断
- `update / doctor / hooks / viewer` 的职责边界
- Claude Code 与 Codex 的差异

验收标准：

- 新人不需要翻源码就能理解工具集成结构
- 当前 README 中重复的集成说明可收敛到该文档

#### 7.2.3 在关键阶段显式消费工具

目标：

- 避免“工具已经安装，但流程没有用起来”

建议先从三个阶段入手：

1. `research`
   - 外部资料优先走 `fetch`
   - 官方文档、规范、SDK/API 说明优先走 `context7`
   - 代码结构优先走 `serena`

2. `review`
   - 前端场景允许声明 `playwright-mcp`
   - 代码定位优先走 `serena`

3. `verify`
   - 浏览器验收场景可以走浏览器工具
   - 外部接口验证可沉淀为 checklists

建议修改：

- `skills/spec-first/05-research/SKILL.md`
- `skills/spec-first/08-review/SKILL.md`
- `skills/spec-first/12-verify/SKILL.md`

验收标准：

- 相关 Skill 中明确写出“什么场景使用什么工具”
- findings / verify 产物里能看到工具证据来源

#### 7.2.4 把基线状态接入 update / doctor

目标：

- 让 `update` 和 `doctor` 成为“基线工具集成”的正式执行入口

建议执行项：

- `update` 输出分层摘要：
  - 外部必备 Skills
  - Spec-First 内建 Skills
  - 核心 MCP
  - Hooks / Session / Viewer
- 安装流程默认补齐基线能力：
  - 必备 Skills
  - 核心 MCP
- `doctor` 输出能力影响：
  - 缺 `serena` 会影响代码导航
  - 缺 `fetch` 会影响研究证据采集
  - 缺 `context7` 会影响官方文档与规范查询
  - 缺 `playwright-mcp` 会影响浏览器验收

建议代码落点：

- `src/cli/commands/update.ts`
- `src/cli/commands/doctor.ts`
- `src/config/bootstrap-manifest.ts`

验收标准：

- 用户能从 `update` / `doctor` 一眼看出当前基线是否健康
- 输出不再只是“装没装”，还包含“影响什么”

#### 7.2.5 P0 执行任务序列

建议按下面顺序启动第一批实施：

| 顺序 | 任务 | 目标文件 |
|------|------|----------|
| T1 | 梳理必备 Skill / MCP 基线口径 | `src/config/bootstrap-manifest.ts` |
| T2 | 扩充 update 输出分层摘要 | `src/cli/commands/update.ts` |
| T3 | 建立安装链路默认引导与强制补齐 | `src/postinstall.ts` `src/cli/commands/init.ts` |
| T4 | 扩充 doctor 输出“缺失影响” | `src/cli/commands/doctor.ts` |
| T5 | 产出宿主能力矩阵文档 | `docs/reference/host-capability-matrix.md` |
| T6 | 产出工具集成总说明 | `docs/reference/tool-integration-overview.md` |
| T7 | 在 `research / review / verify` 中显式接入核心 MCP | `skills/spec-first/*/SKILL.md` |
| T8 | 配置写入安全机制 | `src/shared/*` `src/core/tool-integration/*` |
| T9 | 安装链路与基线补齐集成验证 | `tests/integration/*` |

这一批做完后，才适合进入多宿主扩展。

### 7.3 P1：增加统一工具能力层与宿主适配层

#### 7.3.-1 P1 阶段门禁

只有满足以下条件，才能从 `P1` 进入 `P2`：

- `Host Adapter` 已稳定覆盖 `Claude / Codex`
- `Tool Registry / Capability Matrix / Selection Policy` 已接入主链路
- `update / doctor` 已由 adapter 驱动且行为不回退
- 至少一轮配置安全与回归审查完成

#### 7.3.1 建立 Tool Registry

目标：

- 让工具从“配置项”升级为“可调度能力”

建议新增：

- `src/core/tool-integration/tool-registry.ts`
- `src/core/tool-integration/tool-types.ts`

建议核心结构：

```ts
interface ToolDescriptor {
  id: string;
  category: 'code' | 'research' | 'browser' | 'memory' | 'runtime';
  hosts: HostType[];
  requiredMcps?: string[];
  scenarios: string[];
  fallback?: string[];
}
```

建议先注册的工具：

- `serena`
- `context7`
- `fetch`
- `playwright-mcp`
- `shell`
- `viewer`

验收标准：

- 任何一个阶段要用工具时，都可以先查 registry
- registry 不再只描述“怎么安装”，而是描述“什么时候该用”

#### 7.3.2 建立 Capability Matrix

目标：

- 定义“工具支持”与“宿主支持”的交集

建议新增：

- `src/core/tool-integration/capability-matrix.ts`

示例能力：

- `supportsSkills`
- `supportsMcp`
- `supportsHooks`
- `supportsBrowser`
- `supportsSessionStart`
- `supportsProjectScopedAgents`

这样后续 `doctor`、`update`、`orchestrate`，以及未来 `Gemini / Cursor` 宿主接入都可以基于统一定义做判断。

验收标准：

- doctor 不再只做“文件存在性检查”
- 而是能输出“宿主具备哪些能力、缺哪些能力”

#### 7.3.3 建立 Host Adapter

目标：

- 把宿主扩展从“命令里写分支”升级为“新增 adapter”

建议新增：

- `src/core/host-adapters/types.ts`
- `src/core/host-adapters/registry.ts`
- `src/core/host-adapters/claude-adapter.ts`
- `src/core/host-adapters/codex-adapter.ts`
- `src/core/host-adapters/gemini-adapter.ts`
- `src/core/host-adapters/cursor-adapter.ts`

第一阶段要求：

- 先把 `Claude / Codex` 抽象进统一 adapter 层
- 再接入 `Gemini`
- `Cursor` 作为第二个新增宿主

验收标准：

- 新增宿主不需要大量改 `update / doctor`
- 能通过 registry 输出宿主能力矩阵

#### 7.3.4 建立 Tool Selection Policy

目标：

- 让系统按任务类型自动决定工具组合

建议新增：

- `src/core/tool-integration/tool-selection.ts`

示例映射：

| 场景 | 优先工具 | 回退工具 |
|------|----------|----------|
| 代码结构分析 | serena | shell + rg |
| 外部资料调研 | fetch + context7 | browser + 官方站点手工查询 |
| 页面交互验收 | playwright-mcp | 手工步骤模板 |
| 宿主环境诊断 | doctor + manifest | 文档提示 |

验收标准：

- research / review / verify 可根据任务元数据得到建议工具包
- 缺失 MCP 时能自动降级而不是静默失败

#### 7.3.5 P1 宿主扩展任务序列

在 P0 完成后，建议按下面顺序推进宿主扩展：

| 顺序 | 任务 | 目标文件 |
|------|------|----------|
| T7 | 引入 Host Adapter 基础类型与 registry | `src/core/host-adapters/types.ts` `src/core/host-adapters/registry.ts` |
| T8 | 抽象 `ClaudeAdapter` | `src/core/host-adapters/claude-adapter.ts` |
| T9 | 抽象 `CodexAdapter` | `src/core/host-adapters/codex-adapter.ts` |
| T10 | 让 `update / doctor` 改由 adapter 驱动 | `src/cli/commands/update.ts` `src/cli/commands/doctor.ts` |
| T11 | 接入 `GeminiAdapter`，完成第一个新增宿主验证 | `src/core/host-adapters/gemini-adapter.ts` |
| T12 | 接入 `CursorAdapter`，完成第二个新增宿主验证 | `src/core/host-adapters/cursor-adapter.ts` |

推荐的工程门槛：

- `Gemini` 先达到 `L2`
- `Cursor` 先达到 `L1-L2`
- 不要求一开始支持完整 `hooks + viewer`

#### 7.3.6 多 Agent 审查机制

工具集成升级不应只靠单人修改后自测，而应引入明确的多 agent 审查机制。

建议至少设置 3 类审查角色：

1. `安装链路审查`
   - 审查 `postinstall / update / init --bootstrap`
   - 关注引导是否清晰、是否会误装、是否会漏装

2. `配置安全审查`
   - 审查用户级配置写入
   - 关注 backup / merge / rollback / idempotency

3. `运行时策略审查`
   - 审查 tool selection policy、降级策略、标准产物模板
   - 关注是否真的被 `research / review / verify` 消费

建议把这些审查项沉淀为 checklist，而不是临时口头评审。

### 7.4 P1：把工具结果沉淀为标准产物

#### 7.4.1 调研证据模板

建议新增：

- `docs/templates/research-evidence.md`

建议字段：

- 来源 URL / 路径
- 工具来源（fetch / context7 / browser / serena / shell）
- 摘要
- 风险与置信度
- 是否已写入 findings

价值：

- 避免 research 结果散落在自由文本里
- 为后续 review / verify 提供证据链

#### 7.4.2 浏览器验收模板

建议新增：

- `docs/templates/browser-verification.md`

建议字段：

- 页面
- 操作步骤
- 预期结果
- 实际结果
- 工具执行方式
- 失败截图/日志引用

价值：

- 让 `playwright-mcp` 进入验收产物，而不是只停留在“配置了 MCP”

#### 7.4.3 安全审计模板

建议新增：

- `docs/templates/security-audit-report.md`
- `src/core/security/audit-checklist.ts`

建议参考：

- `code-audit` 的 checklist + anti-hallucination discipline

价值：

- 提升 Spec-First 在专项任务中的工具集成深度
- 让“工具集成”体现到质量产物中

### 7.5 P2：升级为生态配置器

#### 7.5.1 组件化安装

目标：

- 把现在的 `update` 升级成“基线强制安装 + 非基线按组件安装”

建议组件：

- `skills`
- `mcp`
- `hooks`
- `viewer`
- `experts`
- `memory`

建议 CLI 方向：

```bash
spec-first update --component skills,mcp,hooks
spec-first update --component viewer
spec-first update --dry-run
```

约束：

- `必备 Skills + 核心 MCP` 默认强制补齐
- `--component` 主要用于非基线能力的增量安装与刷新

参考来源：

- Gentle-AI 的 component 安装思路

验收标准：

- update 会默认补齐基线能力
- 非基线能力可以只刷新部分组件
- dry-run 可展示即将写入哪些位置

#### 7.5.2 多宿主适配

目标：

- 从 `Claude Code + Codex` 扩展到更多宿主

建议优先级：

1. `Gemini`
2. `Cursor`
3. `Copilot`
4. `OpenCode`

建议新增：

- `src/core/host-adapters/types.ts`
- `src/core/host-adapters/<host>-adapter.ts`

每个 adapter 至少要回答：

- 配置目录在哪里
- 支持 skills 吗
- 支持 MCP 吗
- 支持 hooks 吗
- 支持 project-scoped 集成吗

参考来源：

- Gentle-AI 的 agent adapters
- agency-agents 的 multi-tool integration paths

补充说明：

- `Claude / Codex` 在此阶段不是新增支持，而是继续作为基准宿主
- `Gemini / Cursor` 才是本轮真正的新增扩展对象

#### 7.5.3 专家角色与 orchestrator profiles

目标：

- 把 agency-agents 的“专家分工”引入 Spec-First，但不复制其整库复杂度

建议新增：

- `skills/spec-first/experts/README.md`
- `src/core/agents/orchestrator-profiles.ts`

建议首批 profile：

- `security-auditor`
- `frontend-reviewer`
- `api-integrator`
- `workflow-optimizer`

价值：

- 工具集成从“连接工具”扩展到“连接角色能力”
- 对复杂任务可形成 `阶段技能 + 专家 profile + 工具 bundle` 的三层协作

### 7.6 建议的代码落点

| 目标 | 推荐文件 |
|------|---------|
| 宿主适配层 | `src/core/host-adapters/*` |
| 工具注册表 | `src/core/tool-integration/tool-registry.ts` |
| 能力矩阵 | `src/core/tool-integration/capability-matrix.ts` |
| 选择策略 | `src/core/tool-integration/tool-selection.ts` |
| 安全审计清单 | `src/core/security/audit-checklist.ts` |
| 专家角色映射 | `src/core/agents/orchestrator-profiles.ts` |
| 宿主矩阵文档 | `docs/reference/host-capability-matrix.md` |
| 工具总览文档 | `docs/reference/tool-integration-overview.md` |
| 浏览器验收模板 | `docs/templates/browser-verification.md` |
| 调研证据模板 | `docs/templates/research-evidence.md` |
| 安全审计模板 | `docs/templates/security-audit-report.md` |

### 7.7 详细验收标准

工具集成优化完成后，至少应满足以下验收条件：

#### 基础验收

- `spec-first doctor` 能输出宿主能力与缺失项，而不只是文件存在性
- `spec-first update --dry-run` 能展示组件级安装计划
- Skill 文档能明确工具使用边界

#### 流程验收

- `research` 能产出标准化研究证据
- `review` 能根据场景建议 `serena / browser / shell`
- `verify` 能输出浏览器验收或专项检查结果

#### 生态验收

- 至少新增一个非 Claude/Codex 宿主适配
- 工具结果进入模板化产物
- 专家 profile 可被 orchestrate 识别并使用

---

## 8. 结论

Spec-First 当前的工具集成现状可以概括为：

- 已有基础设施
- 还缺统一能力层
- 更缺生态级发布和专项模板

因此，“工具集成”维度的下一步重点不应该只是继续堆 MCP，而应该按下面的顺序推进：

1. 先把 `必备 Skills + 核心 MCP` 做成稳定基线
2. 再把现有 `Claude / Codex + MCP + Hooks + Viewer` 的边界讲清楚
3. 再把工具从“已配置”变成“可编排”
4. 最后再扩展到 `Gemini / Cursor` 等更多编程工具，并补齐专项工具链生态

如果只做第一步，Spec-First 会拥有“稳定的工具基线”。
如果做到第二步和第三步，Spec-First 会变成“可调度的流程引擎”。
如果做到第四步，Spec-First 才会真正接近“多宿主工具集成平台”。

---

## 附：本次分析使用的本地项目路径

- `Spec-First`: `/Users/kuang/xiaobu/spec-first`
- `GSD-2`: `/Users/kuang/xiaobu/gsd-2`
- `Gentle-AI`: `/Users/kuang/xiaobu/gentle-ai`
- `agency-agents`: `/Users/kuang/xiaobu/agency-agents`
- `code-audit`: `/Users/kuang/xiaobu/code-audit`
