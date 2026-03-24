# omo-skills 架构分析

## 1. 一句话定义

`omo-skills` 不是完整项目框架，也不是安装器，而是一个 **角色型多代理 skill 集合**。  
它用 8 个 `SKILL.md` 把常见开发活动拆成明确角色：

> `omo-skills = Sisyphus 编排层 + 6 个专业代理 + 1 个聚合入口`

它更像一套“代理组织设计”，而不是一套“运行时系统设计”。

---

## 2. 定义层：它要解决什么问题

这个目录试图解决的核心问题不是工具接入，也不是项目状态管理，而是：

- 单个 agent 角色过于混杂
- 复杂任务缺少任务拆解与专业分工
- 搜索、研究、架构、文档、UI、视觉分析等活动容易混在一起
- 缺乏统一的“何时该调用谁”的协作心智

因此它采用的策略是：

1. 先定义一个主编排代理 `sisyphus`
2. 再定义多个专业代理负责垂直能力
3. 用 `omo-agents` 作为总入口，把这些角色组织成一个协作体系

所以它的重点不在“自动执行”，而在“明确角色边界与委派协议”。

---

## 3. 架构层：核心组成部件

### 3.1 顶层结构

`/Users/kuang/xiaobu/omo-skills` 当前非常轻量，几乎全部由目录级 `SKILL.md` 组成：

| 目录 | 作用 |
| --- | --- |
| `sisyphus/` | 主编排代理 |
| `oracle/` | 架构与技术顾问 |
| `librarian/` | 外部文档和开源实现研究 |
| `explore/` | 当前代码库搜索与定位 |
| `frontend-engineer/` | 前端 UI/UX 实现 |
| `document-writer/` | 技术文档撰写 |
| `multimodal-looker/` | 图片 / PDF / 图表分析 |
| `omo-agents/` | 多代理总入口与协作手册 |

此外还有一个空目录 `项目梳理/`，但当前没有实际内容。

### 3.2 没有统一运行时

这个目录里没有看到这些常见系统级部件：

- 没有 `package.json`
- 没有 CLI
- 没有脚本目录
- 没有 hooks
- 没有测试
- 没有模板生成链路
- 没有状态目录

这说明 `omo-skills` 并不是像 `Trellis`、`spec-kit`、`OpenSpec` 那样的系统工程，而是一个更纯粹的 skill 指令层。

### 3.3 中心结构是“主编排 + 专家代理”

它的中心结构非常明确：

```text
omo-agents
-> sisyphus (主编排)
-> oracle (架构咨询)
-> librarian (外部研究)
-> explore (本地搜索)
-> frontend-engineer (UI/UX)
-> document-writer (文档)
-> multimodal-looker (视觉分析)
```

其中：

- `omo-agents` 负责说明整个系统怎么用
- `sisyphus` 负责复杂任务拆解和委派
- 其余 skill 负责明确垂直职能

因此它的本质不是“8 个并列 skill”，而是一个小型代理组织结构。

---

## 4. Skill 明细：每个代理的功能

### 4.1 全量 skill 功能表

| Skill | 类别 | 主要功能 | 典型输入 | 典型输出 | 自动化强度 |
| --- | --- | --- | --- | --- | --- |
| `sisyphus` | 主编排 | 复杂任务分类、拆解、TODO 管理、委派、并行执行 | “实现一个功能”“重构模块”“协调多步骤开发” | 任务分解、TODO 列表、委派计划、阶段推进 | 中 |
| `oracle` | 技术顾问 | 架构评审、技术选型、代码审查、调试指导、重构建议 | “这个架构合理吗”“该用什么方案”“为什么这样设计” | 明确建议、权衡分析、风险提示、实现路径 | 弱 |
| `librarian` | 外部研究 | 官方文档查询、开源实现研究、最佳实践、issue/PR 历史 | “文档在哪”“官方推荐怎么做”“其他项目怎么实现” | 来源链接、实现参考、版本注意事项、结论摘要 | 中 |
| `explore` | 本地搜索 | 文件定位、内容搜索、定义/引用追踪、模式搜索、历史追溯 | “代码在哪”“找一下这个函数”“有没有类似实现” | 文件路径、行号、结构图、关键片段 | 中 |
| `frontend-engineer` | UI/UX | 组件设计实现、视觉优化、动效、响应式界面、设计系统思路 | “做个组件”“界面美化”“实现动画交互” | UI 方案、组件代码、视觉规范、交互细节 | 弱到中 |
| `document-writer` | 文档 | README、API 文档、架构文档、用户指南、注释/JSDoc | “写文档”“补 README”“整理 API 文档” | 结构化文档草稿、章节设计、示例代码 | 弱 |
| `multimodal-looker` | 多模态分析 | 图片、PDF、架构图、流程图、截图、设计稿分析 | “看这个图”“分析这个 PDF”“截图里报了什么错” | 结构化信息提取、图表解读、关键信息摘要 | 弱 |
| `omo-agents` | 聚合入口 | 说明各代理职责、调用方式、协作模式、最佳实践 | “多代理怎么协作”“这个任务该找谁” | 代理选择建议、协作路径、编排示例 | 弱 |

### 4.2 角色关系

这些 skill 不是功能随机堆在一起，而是沿着开发工作流拆成几个职责域：

| 职责域 | Skill |
| --- | --- |
| 编排与推进 | `sisyphus`, `omo-agents` |
| 决策与判断 | `oracle` |
| 信息获取 | `librarian`, `explore`, `multimodal-looker` |
| 产出生成 | `frontend-engineer`, `document-writer` |

这说明它的组织方式更接近“一个小团队的岗位分工”，而不是“一个产品的模块分层”。

---

## 5. 运行层：它如何工作

### 5.1 主运行方式是会话内委派

从 `omo-agents/SKILL.md` 看，这套系统的标准使用方式有两种：

1. 直接调用专业代理  
例如：
`@oracle` 回答架构问题，`@explore` 搜索代码，`@document-writer` 写文档

2. 通过 `@sisyphus` 进行编排  
复杂任务交给 `sisyphus`，再由它去委派其他代理

所以它的运行模型是：

```text
用户请求
-> 判断任务复杂度
-> 简单任务直接找专业代理
-> 复杂任务进入 sisyphus
-> sisyphus 拆解 / TODO / 委派 / 汇总
```

### 5.2 自动化边界

这个仓库里当然存在“流程自动化”意图，但它主要是文本层的，而不是代码层的。

它能做到的自动化：

- 明确何时使用哪个代理
- 明确复杂任务的拆解顺序
- 明确委派格式和输出模板
- 明确搜索 / 研究 / 文档 / UI 的最佳实践

它做不到的系统级自动化：

- 没有 hook 强制注入
- 没有后台 daemon
- 没有状态持久化
- 没有任务数据库
- 没有升级机制
- 没有工具适配层

因此它属于：

> “skill 驱动的角色分工自动化”，不是“平台驱动的运行时自动化”。

### 5.3 流程是否在 skill 内闭环

答案是：**多数只在会话层部分闭环，不在系统层闭环。**

原因很直接：

- `sisyphus` 可以定义任务拆解和委派流程
- `explore` / `librarian` / `oracle` 等能定义各自的处理范式
- 但真正的执行依赖宿主 agent 的工具能力
- 没有本地脚本或 hooks 去强制保障流程落地

所以它的闭环边界大致是：

| 层级 | 是否闭环 | 说明 |
| --- | --- | --- |
| 单个代理回答模式 | 是 | 每个 skill 都有较完整的方法论和输出格式 |
| 多代理协作流程 | 基本是 | `omo-agents` + `sisyphus` 给出了比较完整的协作路径 |
| 系统级执行闭环 | 否 | 没有 runtime、hooks、state、scripts 支撑 |

---

## 6. 设计特点：为什么它像“组织设计”

### 6.1 以角色边界为核心

这个项目最明显的特点是：  
不是按技术层次拆，而是按“团队岗位”拆。

例如：

- `oracle` 不写代码，负责判断
- `explore` 不做决策，负责定位信息
- `librarian` 不查本地代码，负责外部研究
- `frontend-engineer` 专做视觉实现
- `document-writer` 负责整理对外表达

这是很强的组织建模思路。

### 6.2 `sisyphus` 是唯一真正的中枢

在 8 个 skill 里，真正形成系统感的是 `sisyphus`：

- 有阶段模型
- 有意图分类
- 有委派逻辑
- 有 TODO 驱动要求
- 有并行化原则

其余 skill 更像专长手册。  
所以如果压缩成最小架构，可以说：

```text
omo-skills = sisyphus orchestration + specialist playbooks
```

### 6.3 `omo-agents` 是目录级说明书，不是运行核心

`omo-agents` 的价值主要是：

- 列出各代理角色
- 给出何时调用谁
- 展示协作示例

它不是独立执行引擎，更像“代理系统的用户手册”。

---

## 7. 与前面项目的定位差异

放到你已经分析过的项目里，`omo-skills` 的位置很清楚：

| 项目 | 本质定位 |
| --- | --- |
| `skills` | 通用 workflow 素材库 |
| `superpowers` | 会话级纪律框架 |
| `cc-sdd` | spec workflow 安装器 |
| `planning-with-files` | 持久化工作记忆 skill |
| `everything-claude-code` | 多层 agent harness 系统 |
| `OpenSpec` | artifact-guided workflow engine |
| `spec-kit` | spec-driven bootstrap toolkit |
| `Trellis` | 项目内常驻 AI 工作流框架 |
| `omo-skills` | 角色型多代理 skill 组织包 |

如果和之前的 `skills` 对比：

- `skills` 更像各种 workflow 能力的并列集合
- `omo-skills` 更强调代理人格分工和编排关系

如果和 `superpowers` 对比：

- `superpowers` 更强调会话纪律与流程规范
- `omo-skills` 更强调“找谁干什么”

如果和 `Trellis` 对比：

- `Trellis` 有项目内状态层和 hooks
- `omo-skills` 只有角色说明和工作方法

---

## 8. 最终判断

### 8.1 核心结论

`omo-skills` 最准确的理解方式不是“一个工程框架”，而是：

> 一个把 AI 开发工作拆成多个专业岗位，并用主编排代理组织起来的轻量多代理 skill 包。

### 8.2 最短公式

```text
omo-skills = role-based specialist skills
           + sisyphus orchestration
           + omo-agents usage guide
```

### 8.3 一句话总结

```text
omo-skills 的重点不是运行时，而是把“AI 团队分工”写成一组可调用的 skill。
```

