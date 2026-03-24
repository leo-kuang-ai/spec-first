# agency-agents 架构分析

## 1. 一句话定义

`agency-agents` 不是单一 skill，也不是项目内运行时框架，而是一个 **大规模角色化 agent roster + 多工具分发系统 + NEXUS 编排 doctrine**。

可以先压缩成一句：

> `agency-agents = agent 人才库 + NEXUS 协作方法论 + convert/install 分发脚本`

它的核心目标不是约束某一个 agent 的行为，而是让用户像组建一家“AI 代理公司”一样，按职能调用和编排大量专业角色。

---

## 2. 定义层：它要解决什么问题

从 README、示例和战略文档看，这个项目试图解决的问题是：

- 单个通用 agent 覆盖不了复杂业务职能
- 不同领域任务需要完全不同的表达方式、流程和产物
- 大量 agent 角色如果没有统一结构，很难维护和迁移到不同工具
- 多 agent 协作如果没有 doctrine，会产生冲突、重复劳动和交接断层

因此它的总体方案不是“做一个更强的 agent”，而是：

1. 建一个跨职能 agent 人才库
2. 规定每个 agent 的统一结构和设计规范
3. 用脚本把这些 agent 转换并安装到不同 agentic tools
4. 再用 `NEXUS` 把这些离散 agent 组织成分阶段协作的 pipeline

这意味着它的系统边界分成三层：

- **内容层**：大量 agent markdown 文件
- **分发层**：跨工具转换与安装
- **编排层**：NEXUS 协作 doctrine

---

## 3. 架构层：核心组成部件

### 3.1 顶层结构

这个仓库的核心目录可以拆成 6 类：

| 模块 | 作用 |
| --- | --- |
| 各职能目录 | agent 本体内容，如 `engineering/`、`marketing/`、`design/` 等 |
| `strategy/` | NEXUS 总体协作方法论、playbook、runbook、handoff 模板 |
| `scripts/` | 转换、安装、lint 脚本 |
| `integrations/` | 各工具的集成说明和生成产物入口 |
| `examples/` | 多 agent 协作样例输出 |
| `README.md` / `CONTRIBUTING.md` | 总览、设计规范、贡献协议 |

### 3.2 本体是大规模 agent roster

这是一个明显的“大 roster”型仓库，而不是少数几个核心 skill：

- `design/`：8 个 agent
- `engineering/`：23 个 agent
- `game-development/`：5 个 agent
- `marketing/`：26 个 agent
- `paid-media/`：7 个 agent
- `product/`：4 个 agent
- `project-management/`：6 个 agent
- `sales/`：8 个 agent
- `spatial-computing/`：6 个 agent
- `specialized/`：23 个 agent
- `support/`：6 个 agent
- `testing/`：8 个 agent

整体规模已经超过一百个专业角色。  
所以这个仓库的第一层本质不是 workflow，而是 **角色资产库**。

### 3.3 每个 agent 都遵循统一 schema

`CONTRIBUTING.md` 给出了非常清晰的 agent 设计模板：

- frontmatter
- Identity & Memory
- Core Mission
- Critical Rules
- Technical Deliverables
- Workflow Process
- Communication Style
- Learning & Memory
- Success Metrics
- Advanced Capabilities

这说明 `agency-agents` 虽然角色多，但不是野生 prompt 拼盘，而是有统一内容 schema 的“可维护 agent catalog”。

### 3.4 NEXUS 是第二层系统，而不是 README 附件

`strategy/nexus-strategy.md`、`QUICKSTART.md`、phase playbooks、coordination templates、scenario runbooks 一起说明：

NEXUS 不是示例玩法，而是这个仓库试图建立的统一协作 doctrine。

它定义了：

- 多 agent 七阶段 pipeline
- 每个阶段谁上场
- 交接如何做
- 质量门如何判断
- 什么情况下才能推进到下一阶段

因此 `agency-agents` 不是简单的“人才市场”，还附带了一套“机构运营手册”。

### 3.5 convert/install 是第三层：跨工具分发控制面

这个仓库不是只面向 Claude Code。  
`scripts/convert.sh` 和 `scripts/install.sh` 把同一批 agent 内容分发到多个工具：

- Claude Code
- GitHub Copilot
- Antigravity
- Gemini CLI
- OpenCode
- OpenClaw
- Cursor
- Aider
- Windsurf
- Qwen

因此它与一般 markdown prompt 仓库的差异在于：

> 内容本体和宿主平台被显式解耦，并通过脚本转换重新绑定。

---

## 4. 角色层：agent 不是怎么组织的

### 4.1 分类方式

它的分类方式明显借鉴了“机构部门”模型：

| 分类 | 代表问题域 |
| --- | --- |
| `engineering` | 软件研发、平台、架构、DevOps、安全、数据、嵌入式 |
| `design` | UI、UX、品牌、视觉叙事、图像生成、包容性视觉 |
| `marketing` | 渠道增长、内容、中文平台运营、跨境电商、短视频 |
| `paid-media` | PPC、Paid Social、Tracking、Creative、Programmatic |
| `product` | 趋势研究、反馈综合、优先级、行为设计 |
| `project-management` | 制片、项目推进、实验追踪、Jira 工作流 |
| `testing` | 证据收集、现实检查、性能、API、可访问性 |
| `support` | 支持、分析、财务、基础设施、法务、管理摘要 |
| `sales` | 账户策略、提案、销售工程、发现、外呼 |
| `spatial-computing` | XR、visionOS、Metal、WebXR、终端集成 |
| `specialized` | 编排、合规、知识管理、LSP、身份信任等特殊场景 |

这说明它的组织方式不是“按工具能力拆”，而是“按真实业务组织结构拆”。

### 4.2 单个 agent 的结构特点

以 `Frontend Developer` 和 `Agents Orchestrator` 为例，可以看到这些共同特征：

- 不是一句 prompt，而是完整 persona
- 有明确角色和经验设定
- 有具体 deliverables 和代码/文档样式
- 有分阶段 workflow
- 有 success metrics
- 有 communication style

因此这些 agent 更像“岗位手册”，而不是“快捷指令”。

### 4.3 `Agents Orchestrator` 是系统中枢

在所有角色里，`specialized/agents-orchestrator.md` 具有特殊地位。  
它不是单一职能专家，而是：

- pipeline manager
- quality gate enforcer
- retry / escalation controller
- handoff coordinator

其工作方式与 `Trellis` 的项目内状态编排不同，但目标相似：
都是在解决“多 agent 怎么协作”的问题。

只是 `agency-agents` 的做法更偏：

> 文档化的组织流程 + orchestrator persona

而不是 runtime/hook/state machinery。

---

## 5. 运行层：仓库如何真正工作

### 5.1 三种主要使用方式

从 README 看，这个仓库至少支持三种主要使用方式：

1. 直接复制原生 agent 文件  
例如给 Claude Code、Copilot 直接复制 `.md` agents

2. 作为参考资产手工挑选  
只阅读和复制某些 agent 的 persona / workflow / deliverables

3. 通过脚本转换并安装到特定工具  
`convert.sh` + `install.sh`

所以它的运行并不依赖统一 daemon，而依赖：

- 文件约定
- 转换脚本
- 安装脚本

### 5.2 `convert.sh` 的功能边界

`scripts/convert.sh` 的作用不是“执行 agent”，而是“转换格式”。

它做的事包括：

- 读取标准 agent markdown
- 解析 frontmatter
- 根据目标工具生成对应格式
- 写入 `integrations/<tool>/`
- 支持 Antigravity、Gemini CLI、OpenCode、Cursor、Aider、Windsurf、OpenClaw、Qwen 等

这说明它的主要价值是 **format adaptation**。

### 5.3 `install.sh` 的功能边界

`scripts/install.sh` 负责：

- 检测本机安装了哪些工具
- 交互式选择要安装到哪些宿主
- 把转换好的 agent 文件复制到目标目录
- 兼容 home-scoped 与 project-scoped 工具

它是 **deployment/install layer**，不是 workflow layer。

### 5.4 `lint-agents.sh` 提供最基础的内容质量门

`scripts/lint-agents.sh` 会校验：

- frontmatter 是否存在
- 必需字段是否齐全
- 推荐 section 是否存在
- 正文是否足够丰富

虽然比较轻，但这已经说明仓库在把 agent 当“结构化资产”维护，而不是随意文本。

---

## 6. 编排层：NEXUS 到底是什么

### 6.1 NEXUS 是方法论，不是运行时

`strategy/nexus-strategy.md` 明确说：

> This is not a prompt collection — it is a deployment doctrine.

这句话很关键。  
NEXUS 解决的是这些问题：

- 何时激活谁
- 阶段边界怎么定义
- handoff 怎么做
- 质量门谁来判定
- 重试与升级路径怎么走

但它仍然主要是 **文档化编排**，不是程序化 orchestration engine。

### 6.2 七阶段 pipeline

NEXUS 的核心 pipeline 是：

1. Discovery
2. Strategy
3. Foundation
4. Build
5. Hardening
6. Launch
7. Operate

这使得 `agency-agents` 从单纯角色库提升为“端到端机构作战手册”。

### 6.3 examples 的作用

`examples/` 目录并不是普通 showcase，而是在回答一个关键问题：

> 这么多 agent 放在一起，真的能形成 coherent output 吗？

这些样例的作用是证明：

- 多个 agent 可以并行工作
- 输出可以互相引用
- 角色库并不只适合单点使用
- NEXUS 协作模型在实践层面是可演示的

---

## 7. 自动化与闭环边界

### 7.1 它有哪些自动化

这个仓库具备 3 类自动化：

| 类型 | 说明 |
| --- | --- |
| 内容结构自动化 | 统一 agent schema、lint 规则 |
| 格式转换自动化 | `convert.sh` 生成各工具集成格式 |
| 安装分发自动化 | `install.sh` 自动检测并安装到目标工具 |

### 7.2 它没有哪些自动化

它没有这些更强的系统能力：

- 没有统一运行时
- 没有项目内状态层
- 没有 hooks 注入系统
- 没有持续上下文记忆
- 没有真正的 orchestrator engine
- 没有 agent 调度总线

所以它的闭环边界是：

| 层级 | 是否闭环 | 说明 |
| --- | --- | --- |
| agent 内容生产与维护 | 是 | 有 schema、lint、分类结构 |
| 多工具分发安装 | 是 | convert/install 基本闭环 |
| 多 agent 协作方法论 | 基本是 | NEXUS 给出完整 doctrine |
| 系统级自动执行编排 | 否 | 仍依赖宿主 agent 和人工触发 |

---

## 8. 与前面项目的定位差异

把它放到你前面分析过的项目里，位置会更清楚：

| 项目 | 本质定位 |
| --- | --- |
| `skills` | workflow 素材库 |
| `superpowers` | 会话级纪律框架 |
| `cc-sdd` | spec workflow 安装器 |
| `planning-with-files` | 持久化工作记忆 skill |
| `everything-claude-code` | 多层 agent harness 系统 |
| `OpenSpec` | artifact-guided workflow engine |
| `spec-kit` | spec-driven bootstrap toolkit |
| `Trellis` | 项目内常驻 AI 工作流框架 |
| `omo-skills` | 角色型多代理 skill 组织包 |
| `andrej-karpathy-skills` | 单一行为治理 skill 分发仓库 |
| `agency-agents` | 大规模角色资产库 + 跨工具分发系统 + 编排 doctrine |

如果和 `omo-skills` 对比：

- `omo-skills` 是小型角色团队
- `agency-agents` 是完整机构编制

如果和 `Trellis` 对比：

- `Trellis` 强在项目内状态、hooks、update
- `agency-agents` 强在角色规模、内容规范、跨工具分发

如果和 `superpowers` 对比：

- `superpowers` 强在会话纪律
- `agency-agents` 强在职能分工与 pipeline doctrine

---

## 9. 最终判断

### 9.1 核心结论

`agency-agents` 最准确的理解方式不是“一个 prompt 仓库”，而是：

> 一个把 AI 专家角色资产化、规范化、可跨工具分发，并通过 NEXUS doctrine 组织成协作流水线的 agent agency framework。

### 9.2 最短公式

```text
agency-agents = large specialist agent catalog
              + cross-tool conversion/install pipeline
              + NEXUS orchestration doctrine
```

### 9.3 一句话总结

```text
它不是给你一个更强的单代理，而是给你一整家可部署、可移植、可编排的 AI agency。
```

