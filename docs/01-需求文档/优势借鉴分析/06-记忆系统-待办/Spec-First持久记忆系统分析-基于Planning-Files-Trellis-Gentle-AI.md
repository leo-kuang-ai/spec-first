# Spec-First 持久记忆系统分析

> 副标题：基于 Planning-Files、Trellis、Gentle-AI/Engram 的借鉴建议，以及 Spec-First 当前现状与演进方向
>
> 分析日期：2026-03-15
> 分析对象：Spec-First v1.0.4
> 参考对象：Planning-Files、Trellis、Gentle-AI/Engram

---

## 一、分析结论摘要

如果参考 **Planning-Files**、**Trellis** 与 **Gentle-AI/Engram** 三个系统，Spec-First 当前的持久记忆能力可以概括为：

- **已经实现了较强的 Planning-Files 式持久记忆**
  - 文件系统即外部记忆
  - 会话恢复依赖磁盘真源而非模型短期上下文
  - 已具备 5-Question Reboot 风格的恢复能力
- **只实现了部分 Trellis 式持久记忆**
  - 已有事件型 JSONL 持久化
  - 已有运行态现场快照
  - 但尚未形成 `record-session` 风格的知识捕获闭环
- **尚未实现 Gentle-AI/Engram 式结构化外部记忆**
  - 没有统一的 memory API
  - 没有 `topic_key` 驱动的稳定检索
  - 没有跨会话、抗 compaction 的独立知识后端

一句话判断：

> **Spec-First 当前更像是“文件化状态记忆系统”，还不是“结构化知识记忆系统”。**

---

## 二、参考系一：Planning-Files 的持久记忆观

根据前序对比分析，Planning-Files 的记忆系统核心不是单独的数据库或服务，而是以下三点：

1. **文件系统即内存**
2. **稳定上下文前缀 / KV-Cache 优化**
3. **5-Question Reboot 会话恢复**

其本质是：

- 所有关键状态和结论都落到文件中
- 重新进入会话时，不依赖模型记忆，而是重新读取文件真源
- 通过固定的恢复结构快速重建上下文

这是一种典型的 **Context Engineering** 路线。

---

## 三、参考系二：Trellis 的持久记忆观

Trellis 的重点不只是“保存状态”，而是“保存知识”。

其持久记忆能力主要体现为：

1. **Read Before Write**
   - 任何写入前先读取已有规范、上下文与历史
2. **JSONL 上下文持久化**
   - 使用连续日志保留上下文轨迹
3. **record-session 前置**
   - 会话结束时显式记录本轮结论、问题、经验和后续动作
4. **知识捕获**
   - 不让经验只停留在一次会话里，而是沉淀为下轮可用知识

这意味着 Trellis 的“记忆”不是单纯的状态快照，而是更偏向：

- 事件记忆
- 决策记忆
- 经验记忆
- 可复用知识记忆

---

## 四、参考系三：Gentle-AI / Engram 的持久记忆观

Gentle-AI 的持久记忆核心是 **Engram**。

它不是简单的“把产物写文件”，而是通过独立的 MCP memory backend 提供统一记忆接口。其记忆协议强调：

1. **统一 memory API**
   - `mem_save`
   - `mem_search`
   - `mem_get_observation`
   - `mem_context`
   - `mem_session_summary`
2. **结构化写入**
   - 记忆具备 `title`、`type`、`scope`、`topic_key`、`content`
3. **upsert 与稳定 topic key**
   - 同一主题持续演化时复用同一 `topic_key`
4. **会话结束强制总结**
   - 必须写 `mem_session_summary`
5. **上下文压缩后强恢复**
   - compaction 发生后先写总结，再从 memory 恢复

这意味着 Engram 的记忆形态不是单纯的状态快照，而是：

- 外部化知识记忆
- 可检索决策记忆
- 会话摘要记忆
- 可跨子代理共享的长期记忆

因此，Gentle-AI 的重点不是“文件即记忆”，而是：

> **独立 memory backend + 结构化知识协议**

---

## 五、Spec-First 当前的持久记忆架构

结合项目代码，Spec-First 当前的持久记忆不是一个独立 memory 模块，而是由多类文件共同构成。

### 5.1 架构总览

```text
SessionStart Hook
  ↓
.spec-first/current
  ↓
spec-first ai catchup
  ↓
┌──────────────────────────────────────────────┐
│ Feature 记忆层：specs/{featureId}/           │
│                                              │
│ stage-state.json        阶段真源/流程状态     │
│ task_plan.md            任务计划              │
│ findings.md             结论/步骤恢复线索     │
│ traceability-matrix.md  追溯链               │
│ gate-history.jsonl      事件日志/决策轨迹     │
│ ai-stats.jsonl          AI 调用统计           │
│ todo-state.json         自动执行现场状态      │
│ rfc/*.json              例外/变更决策         │
│ reports/*               证据与验证结果        │
└──────────────────────────────────────────────┘

项目级长期认知
  ↓
┌──────────────────────────────────────────────┐
│ .spec-first/runtime/first/                   │
│                                              │
│ index.json             运行索引/健康校验      │
│ summary.json           项目摘要真源           │
│ role-views.json        角色视图               │
│ stage-views.json       阶段视图               │
└──────────────────────────────────────────────┘
  ↓
docs/first/*.md
  文档投影视图，不是真源
```

### 5.2 项目级记忆：`first runtime`

Spec-First 通过 `.spec-first/runtime/first/` 保存项目级长期认知，核心文件包括：

- `index.json`
- `summary.json`
- `role-views.json`
- `stage-views.json`

代码入口见：

- `src/core/skill-runtime/first-runtime-store.ts`
- `src/core/skill-runtime/first-context.ts`
- `src/core/skill-runtime/first-resume.ts`

这一层保存的是：

- 项目名称
- 技术栈
- 模块划分
- 入口文件
- 能力清单
- 角色视角
- 阶段视角

因此它更接近：

> **项目画像记忆 / 项目认知真源**

而不是会话过程日志。

### 5.3 Feature 级记忆：`specs/{featureId}/`

每个 Feature 的目录本身就是一个持久记忆单元。

关键文件包括：

- `stage-state.json`：当前阶段、历史轨迹、策略、背景输入状态
- `task_plan.md`：任务拆解与执行线索
- `findings.md`：重要分析结论、恢复线索
- `traceability-matrix.md`：FR/DS/TASK/TC 追溯链
- `gate-history.jsonl`：Gate 评估与推进事件
- `reports/*`：验证、发布、分析证据
- `rfc/*.json`：变更决策与豁免

因此这一层本质上是：

> **Feature 生命周期记忆**

### 5.4 运行现场记忆：`todo-state.json`

在自动执行和恢复场景下，Spec-First 额外维护 `todo-state.json`。

其内容包括：

- 当前任务
- 任务状态
- 依赖关系
- heartbeat
- retry 次数与预算
- 上轮执行结果

因此它不是知识库，而是：

> **执行现场快照记忆**

### 5.5 恢复入口：`.spec-first/current + Session Hook + catchup`

会话恢复链路主要依赖：

- `.spec-first/current`：记录当前 Feature 指针
- SessionStart Hook：在新会话开始时提示或自动触发恢复
- `spec-first ai catchup`：从文件真源中重建上下文

恢复时读取的核心真源包括：

- `stage-state.json`
- `task_plan.md`
- `findings.md`
- `todo-state.json`

并生成：

- 当前阶段
- 当前任务
- 缺失文件
- 5-Question Reboot
- auto-loop 摘要

因此恢复机制本质上是：

> **重新读取持久化文件，而不是依赖模型记忆延续。**

---

## 六、Spec-First 与 Planning-Files 的对照分析

### 5.1 已经对齐的点

Spec-First 在以下方面已经非常接近 Planning-Files：

1. **文件系统即记忆**
   - 项目认知、Feature 进度、任务状态、验证结果都已经落盘
2. **恢复依赖文件真源**
   - `catchup` 明确通过读取文件重建上下文
3. **有固定恢复结构**
   - 通过 5-Question Reboot 输出恢复摘要
4. **项目级上下文与 Feature 级上下文分层**
   - `.spec-first/runtime/first/` 对应项目认知
   - `specs/{featureId}/` 对应执行中的需求上下文

### 5.2 还可以增强的点

和 Planning-Files 相比，Spec-First 仍可增强：

- 稳定 prompt 前缀还没有被系统化设计成统一上下文前缀层
- `catchup` 已可恢复，但“恢复协议”还没有被抽象成所有 Skill 的统一前置层
- `first runtime` 很强，但与 Feature 恢复之间还缺少更紧的默认联动

### 5.3 结论

从 Planning-Files 视角，Spec-First 的记忆系统已经具备比较成熟的雏形。

准确地说：

> **Spec-First 已经实现了 Planning-Files 风格的文件式外部记忆。**

---

## 七、Spec-First 与 Trellis 的对照分析

### 6.1 已经具备的 Trellis 元素

Spec-First 已经实现了部分 Trellis 式能力：

1. **事件型持久化**
   - `gate-history.jsonl`
   - `ai-stats.jsonl`
2. **运行态现场快照**
   - `todo-state.json`
3. **恢复流程**
   - `catchup` 已经承担上下文恢复职责
4. **一定程度的知识承载**
   - `findings.md`
   - `retro.md`
   - `reports/*`

### 6.2 关键缺口

Spec-First 与 Trellis 的差距主要不在“有没有文件”，而在“是否形成知识沉淀闭环”。

主要差距如下：

1. **缺少 `record-session`**
   - 当前没有统一的“会话结束写知识”动作
   - 会话经验容易散落在 `findings.md`、`retro.md`、`review` 结论中

2. **JSONL 更多是事件日志，不是知识日志**
   - `gate-history.jsonl` 记录的是事件
   - 不是“问题、决策、经验、待办”的结构化 session memory

3. **没有统一的知识抽取层**
   - 经验没有自动从 Feature 文件上浮到项目级长期记忆

4. **缺少长期知识归档机制**
   - 当前更强的是流程状态保存
   - 较弱的是跨 Feature 可复用经验保存

### 6.3 结论

从 Trellis 视角，Spec-First 当前更像：

> **有日志、有状态、有恢复，但还缺少真正的知识持久化闭环。**

也就是说：

- 它擅长保存“发生了什么”
- 但还不够擅长沉淀“以后应该怎么做”

---

## 八、Spec-First 与 Gentle-AI / Engram 的对照分析

### 8.1 Engram 是怎么做持久记忆的

Gentle-AI 把持久化抽象为独立 contract，并支持四种模式：

- `engram`
- `openspec`
- `hybrid`
- `none`

其中 `engram` 模式下：

- 读取从 Engram 进行
- 写入到 Engram 进行
- 不要求写任何项目文件

其中 `hybrid` 模式下：

- Engram 作为主后端
- 文件系统作为 fallback 与本地工件层
- 读优先 Engram，写同时命中两边

因此 Engram 的核心不是“替代文件”，而是：

> **把知识记忆从项目文件系统里抽离出来，形成独立可检索的持久层。**

### 8.2 Gentle-AI / Engram 的特点

相对 Spec-First 当前实现，Engram 的特点非常明确：

1. **跨会话**
   - 记忆不依赖当前对话上下文
2. **抗 compaction**
   - 会话被压缩或重置后仍可恢复
3. **结构化**
   - 决策、bugfix、discovery、pattern 都有明确类型
4. **可搜索**
   - 通过 `mem_search + topic_key` 稳定检索
5. **对子代理友好**
   - 子代理可直接把结果写入共享记忆后端
6. **与文件解耦**
   - 文件可有可无，memory 本身就是主承载层

### 8.3 Engram 能解决什么问题

它主要解决以下问题：

1. **会话中断后失忆**
   - 上一轮的决策、发现、偏好还能找回
2. **上下文压缩导致丢信息**
   - compaction 之后仍可恢复会话脉络
3. **子代理 fresh context**
   - 子代理默认没有历史上下文，但可以共享同一记忆后端
4. **重复决策、重复踩坑**
   - 决策、约定、bug 根因可被搜索复用
5. **知识与状态混杂**
   - 它把“知识记忆”从项目状态文件中解耦出来

### 8.4 Spec-First 与 Engram 的核心差距

Spec-First 当前与 Engram 的主要差距不在于“有没有持久化”，而在于“持久化对象和方式不同”。

Spec-First 当前偏强的是：

- 项目状态真源
- Feature 产物真源
- 可审计文件记录
- 人类可读、Git 可追踪

Spec-First 当前偏弱的是：

- 统一 memory API
- 结构化 topic key 检索
- 会话级 summary 持久化
- 子代理共享知识后端
- 跨会话、抗 compaction 的知识恢复

### 8.5 结论

从 Gentle-AI / Engram 视角，Spec-First 当前更像：

> **状态和工件很强，但外部知识记忆层缺失。**

也就是说：

- Spec-First 擅长记住“产出了什么、推进到哪”
- Engram 擅长记住“知道了什么、为什么这么做”

---

## 九、综合判断：Spec-First 当前持久记忆的真实定位

把 Planning-Files、Trellis 与 Gentle-AI / Engram 放在一起看，Spec-First 当前的定位可以更精确地描述为：

### 7.1 它已经是什么

Spec-First 当前已经是一个：

> **文件化状态记忆系统**

它具备：

- 项目认知真源
- Feature 生命周期真源
- 执行现场快照
- 事件型日志
- 会话恢复入口

### 7.2 它还不是什么

Spec-First 当前还不是一个：

> **语义化知识记忆系统**

它缺少：

- 会话级知识提炼
- 项目级长期规则沉淀
- 经验自动上浮
- `record-session` 风格的结构化知识归档
- 独立 memory backend 驱动的结构化知识检索

### 9.3 三个参考系下的定位

可以进一步概括为：

- **对 Planning-Files**：已经比较接近
- **对 Trellis**：实现了一半
- **对 Engram**：还没有进入同一层级

一句话说：

> **Spec-First 已经有“文件化外部记忆”，但还没有“结构化外部知识记忆”。**

---

## 十、借鉴建议：面向 Planning-Files × Trellis × Engram 的演进方向

如果沿着 Planning-Files、Trellis 与 Engram 三个参考系共同演进，建议按以下优先级增强。

### 10.1 P0：补齐 `record-session`

建议新增会话结束记忆文件，例如：

```text
specs/{featureId}/session-memory.jsonl
```

每轮记录至少包括：

- 本轮目标
- 关键决策
- 遇到的问题
- 当前阻塞
- 下一步动作
- 是否需要上浮到项目级知识

这会把“事件日志”升级为“知识日志”。

同时建议为后续 Engram 化预留统一 schema，例如：

- `goal`
- `decisions`
- `discoveries`
- `accomplished`
- `next_steps`
- `relevant_files`

这样未来可以一键映射到：

- 文件存储
- Engram `mem_session_summary`

### 10.2 P0：区分“事件记忆”和“知识记忆”

建议明确分层：

- `gate-history.jsonl`、`ai-stats.jsonl`：事件记忆
- `session-memory.jsonl`：会话知识记忆
- `.spec-first/runtime/first/*.json`：项目认知记忆
- 未来 `steering/*.md`：项目长期规则记忆

如果未来引入外部 memory backend，再增加：

- `memory observations`：结构化知识记忆

### 10.3 P0：为外部 memory backend 预留抽象层

建议新增统一接口，例如：

```typescript
interface MemoryBackend {
  save(entry: StructuredMemoryEntry): Promise<string>;
  search(query: string, scope: MemoryScope): Promise<MemoryHit[]>;
  get(id: string): Promise<StructuredMemoryEntry | null>;
  summarizeSession(summary: SessionSummary): Promise<string>;
}
```

初期可以先做：

- `FilesystemMemoryBackend`

后续再扩展：

- `EngramMemoryBackend`

这样不会破坏 Spec-First 现有文件真源架构。

### 10.4 P1：建立经验上浮机制

建议把以下内容定期提炼为项目长期记忆：

- `findings.md`
- `retro.md`
- 高频 RFC 决策
- 重复出现的 review 问题

例如新增：

```text
.spec-first/steering/
├── product.md
├── tech.md
├── structure.md
└── lessons.md
```

这样可以把 Feature 级经验转为项目级知识。

### 10.5 P1：让 catchup 默认加载双层记忆

当前 `catchup` 主要恢复 Feature 现场。建议升级为双层恢复：

1. 项目长期记忆
2. 当前 Feature 现场记忆

这样恢复出来的不是单纯“做到哪了”，而是：

- 当前做到哪了
- 当前为什么这样做
- 这个项目长期有哪些约束

如果未来引入 Engram，可进一步扩展为三层恢复：

1. 项目长期记忆
2. 当前 Feature 现场记忆
3. 外部 session knowledge / decisions / discoveries

### 10.6 P2：统一恢复协议

建议让 `catchup` 不只是一个独立命令，而成为：

- SessionStart 默认协议
- Skill 执行前可选前置协议
- auto-loop 恢复协议

这样可以进一步接近 Planning-Files 的上下文工程路线。

---

## 十一、最终结论

### 11.1 现状结论

Spec-First 当前的持久记忆能力：

- **强于普通 CLI 工具**
- **接近 Planning-Files**
- **弱于 Trellis 的知识沉淀闭环**
- **明显弱于 Engram 的结构化外部记忆**

### 11.2 最准确的判断

可以用下面三句话概括：

> **Spec-First 已经实现了 Planning-Files 式的“文件系统即记忆”。**
>
> **Spec-First 还没有完全实现 Trellis 式的“record-session + 知识持久化”。**
>
> **Spec-First 也还没有实现 Engram 式的“独立 memory backend + 可检索知识协议”。**

### 11.3 演进方向结论

因此，Spec-First 在“记忆系统”上的下一步，不是继续增加状态文件，而是：

> **把已有状态记忆升级为可复用的知识记忆。**

再进一步说，演进路径应是：

> **文件化状态真源 → 结构化会话知识 → 可检索的外部知识记忆**

这也是从“文件化状态机”走向“长期项目记忆系统”的关键一步。

---

## 十二、附：代码与参考实现位置

当前分析涉及的核心实现位置如下：

- 项目级 runtime 真源
  - `src/core/skill-runtime/first-runtime-store.ts`
  - `src/core/skill-runtime/first-context.ts`
  - `src/core/skill-runtime/first-resume.ts`
- 当前 Feature 指针
  - `src/core/process-engine/feature.ts`
- 会话恢复
  - `src/core/ai-orchestrator/catchup.ts`
- 自动执行现场状态
  - `src/core/ai-orchestrator/todo-runner.ts`
- AI 统计日志
  - `src/core/ai-orchestrator/ai-stats.ts`
- SessionStart 自动恢复
  - `src/core/tool-integration/session-hook.ts`

Gentle-AI / Engram 参考实现位置：

- `README.md`
- `testdata/golden/engram-claude-claudemd.golden`
- `internal/assets/skills/_shared/persistence-contract.md`
- `internal/assets/generic/sdd-orchestrator.md`
